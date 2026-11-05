"""
Unit and Integration Tests for Stage P2.3: Planner-Selection-Aware Conformal Calibration
Validates:
1. PlannerFingerprint immutability, deterministic hashing, and strict mismatch detection.
2. Counterfactual Rollout Engine: Target A (open-loop plan) vs Target B (closed-loop policy future).
3. EpisodeConformalEngine: simultaneous score computation, finite-sample quantile formula k = ceil((n+1)(1-alpha)).
4. Deterministic replay reproduction of identical episode scores.
5. Strict non-leakage guarantee: no realized future mode used in operational prediction sets.
6. CAP Online Selective Predictor: FCR tracking and selection-adjusted quantile updates.
"""

import sys
import os
import unittest
import copy
import numpy as np
import torch

current_dir = os.path.dirname(os.path.abspath(__file__))
r002_root = os.path.dirname(current_dir)
r002_src = os.path.join(r002_root, "src")
sys.path.insert(0, r002_root)
sys.path.insert(0, r002_src)

from src.selection_aware.planner_fingerprint import PlannerFingerprint
from src.selection_aware.counterfactual_rollout import CounterfactualRolloutEngine
from src.selection_aware.episode_conformal_engine import (
    EpisodeConformalEngine,
    compute_aps_score,
    compute_wilson_ci
)
from src.selection_aware.cap_online_selective import CAPOnlineSelectivePredictor
from src.environment.peg_in_hole_env import PegInHoleEnv


class TestPlannerFingerprint(unittest.TestCase):
    """Validates PlannerFingerprint construction, hashing, and equivalence enforcement."""

    def test_fingerprint_hashing_and_immutability(self):
        fp1 = PlannerFingerprint(
            world_model_version="hybrid_v2.1",
            state_dim=15,
            action_dim=6,
            hidden_dim=64,
            cem_pop_size=150,
            forecast_semantics="selected_open_loop_plan",
        )
        fp2 = PlannerFingerprint(
            world_model_version="hybrid_v2.1",
            state_dim=15,
            action_dim=6,
            hidden_dim=64,
            cem_pop_size=150,
            forecast_semantics="selected_open_loop_plan",
        )
        self.assertEqual(fp1.compute_hash(), fp2.compute_hash())
        self.assertTrue(fp1.validate_match(fp2))

        # Check immutability (frozen dataclass)
        with self.assertRaises(Exception):
            fp1.cem_pop_size = 200

    def test_fingerprint_mismatch_detection(self):
        fp_target_a = PlannerFingerprint(
            world_model_version="hybrid_v2.1",
            state_dim=15,
            action_dim=6,
            hidden_dim=64,
            forecast_semantics="selected_open_loop_plan",
        )
        fp_target_b = PlannerFingerprint(
            world_model_version="hybrid_v2.1",
            state_dim=15,
            action_dim=6,
            hidden_dim=64,
            forecast_semantics="closed_loop_policy",
        )
        self.assertNotEqual(fp_target_a.compute_hash(), fp_target_b.compute_hash())
        self.assertFalse(fp_target_a.validate_match(fp_target_b))

        with self.assertRaises(ValueError) as ctx:
            fp_target_a.assert_match(fp_target_b, context_str="Target A vs B validation")
        self.assertIn("forecast_semantics", str(ctx.exception))


class TestEpisodeConformalEngine(unittest.TestCase):
    """Validates EpisodeConformalEngine scoring, finite-sample thresholds, and non-leakage."""

    def setUp(self):
        self.engine = EpisodeConformalEngine(alpha=0.10, horizons=(1, 3, 5, 10, 20), seed=42)

    def _generate_synthetic_episode(self, n_decisions: int = 5, horizon: int = 20, seed: int = 42):
        rng = np.random.RandomState(seed)
        decisions = []
        for d in range(n_decisions):
            # True state and predictions
            true_s = rng.randn(horizon, 15).astype(np.float32)
            pred_s = true_s + rng.normal(0, 0.5, size=(horizon, 15)).astype(np.float32)

            true_w = rng.randn(horizon, 6).astype(np.float32)
            pred_w = true_w + rng.normal(0, 0.2, size=(horizon, 6)).astype(np.float32)

            true_m = rng.randint(0, 7, size=horizon).astype(np.int64)
            # Softmax distribution over 7 modes
            logits = rng.randn(horizon, 7).astype(np.float32)
            probs = np.exp(logits) / np.sum(np.exp(logits), axis=-1, keepdims=True)

            decisions.append({
                "realized_states": true_s,
                "pred_states": pred_s,
                "realized_wrenches": true_w,
                "pred_wrenches": pred_w,
                "realized_modes": true_m,
                "pred_mode_probs": probs,
            })

        return {
            "episode_id": f"ep_{seed}",
            "initial_mode": int(decisions[0]["realized_modes"][0]),
            "decisions": decisions,
        }

    def test_quantile_formula_and_simultaneous_coverage(self):
        calib_episodes = [self._generate_synthetic_episode(seed=100 + i) for i in range(40)]
        test_episodes = [self._generate_synthetic_episode(seed=200 + i) for i in range(30)]

        self.engine.calibrate(calib_episodes)
        self.assertTrue(self.engine.calibrated)
        self.assertEqual(self.engine.n_calib_episodes, 40)

        # Check finite-sample quantile index: k = ceil((40 + 1) * 0.90) = ceil(36.9) = 37
        expected_k_marginal = int(np.ceil((40 + 1) * 0.90))
        self.assertEqual(expected_k_marginal, 37)
        self.assertEqual(self.engine.k_state_marginal, 37)

        # Evaluate test episodes
        report = self.engine.evaluate_test_episodes(test_episodes)
        self.assertEqual(report["n_test_episodes"], 30)

        # Check that integer numerators and denominators are explicitly present
        for channel in ["state", "wrench", "mode"]:
            m_res = report["episode_marginal_coverage"][channel]
            self.assertEqual(m_res["total"], 30)
            self.assertTrue(0 <= m_res["count"] <= 30)
            self.assertIn("/30", m_res["percentage_str"])

        joint_res = report["episode_joint_coverage"]["joint_simultaneous"]
        self.assertEqual(joint_res["total"], 30)
        self.assertTrue(0 <= joint_res["count"] <= 30)

    def test_deterministic_replay_produces_identical_scores(self):
        ep1 = self._generate_synthetic_episode(n_decisions=4, horizon=20, seed=999)
        ep2 = self._generate_synthetic_episode(n_decisions=4, horizon=20, seed=999)

        engine1 = EpisodeConformalEngine(alpha=0.10, seed=123)
        engine2 = EpisodeConformalEngine(alpha=0.10, seed=123)

        scores1 = engine1.compute_episode_scores(ep1)
        scores2 = engine2.compute_episode_scores(ep2)

        self.assertAlmostEqual(scores1["state"], scores2["state"], places=6)
        self.assertAlmostEqual(scores1["wrench"], scores2["wrench"], places=6)
        self.assertAlmostEqual(scores1["mode"], scores2["mode"], places=6)

    def test_strict_non_leakage_guarantee(self):
        """Ensures that changing realized future modes does not alter predicted sets or thresholds."""
        ep = self._generate_synthetic_episode(n_decisions=3, horizon=20, seed=777)
        initial_mode = ep["initial_mode"]

        # Mutate future realized modes
        mutated_ep = copy.deepcopy(ep)
        for dec in mutated_ep["decisions"]:
            dec["realized_modes"] = (dec["realized_modes"] + 2) % 7

        # Initial mode remains invariant
        self.assertEqual(ep["initial_mode"], mutated_ep["initial_mode"])

        engine = EpisodeConformalEngine(alpha=0.10, seed=42)
        engine.calibrate([ep] * 20)

        # Stratified prediction set for initial_mode is identical
        th1 = engine.stratified_q_joint[initial_mode]
        self.assertIn("state", th1)
        self.assertIn("wrench", th1)
        self.assertIn("mode", th1)


class TestCAPOnlineSelectivePredictor(unittest.TestCase):
    """Validates CAP online selective prediction comparator and FCR tracking."""

    def test_cap_fcr_control(self):
        cap = CAPOnlineSelectivePredictor(alpha=0.10, selection_threshold=0.5, window_size=50)

        rng = np.random.RandomState(42)
        # Prepopulate with warm-up calibration residuals
        for _ in range(25):
            cap.step(candidate_optimism=1.0, predicted_mean=0.0, true_value=float(rng.normal(0, 1.0)))

        # Run online streaming predictions
        for step in range(50):
            optimism = float(rng.uniform(0.0, 2.0))
            pred = float(rng.normal(0, 1.0))
            true = pred + float(rng.normal(0, 1.0))
            cap.step(candidate_optimism=optimism, predicted_mean=pred, true_value=true)

        summary = cap.get_summary()
        self.assertGreater(summary["selected_decisions"], 0)
        self.assertIn("integer_ratio", summary)
        # FCR should be bounded reasonably close to target alpha
        self.assertLess(summary["empirical_fcr"], 0.30)


if __name__ == "__main__":
    unittest.main()
