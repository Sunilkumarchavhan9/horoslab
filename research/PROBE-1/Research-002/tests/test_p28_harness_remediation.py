"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.8: Action-Conditioned Contact World Model Evaluation
Test Suite: Phase 3.3 Harness Remediation & Regression Verification

Covers remediation workstreams H1–H5:
- H1: Wrench Slicing & Extraction:
  * 15-D state wrench slicing (Task 1: peg_in_hole -> s[:, 9:15]).
  * 23-D state wrench slicing (Task 2: multifinger_lift -> s[:, 12:16] padded to 6-D).
  * Strict elimination of finger kinematics contamination (indices 0:11, especially finger 3 at 9:12).
  * Consistency between HybridContactStateModel.predict_multistep and extract_env_state_and_wrench.
  * Correct normal force indexing in MiningEvaluator and RecoveryAwareCEMPlanner.
- H2: Calibration Floors, Fallback Logging & Disjoint Pools:
  * Explicit 90% coverage target (alpha = 0.10), N_calib = 60, minimum per-mode count = 29.
  * Finite global fallback when a stratum is undersampled (m_n < 29) with explicit fallback_to_global logging.
  * Zero infinite quantiles silently marked calibrated.
  * Separate q_*_joint and q_*_marginal reporting in CalibrationRunner.
  * Strict pairwise disjointness of 60-episode calibration pools (Lift and PegInHole) from all training and eval pools.
- H3: Evaluation Architecture & Multi-Horizon Wiring:
  * Multi-horizon RMSE across H in {1, 3, 5, 10, 20} for kinematics, object_position,
    normal_forces, tangential_forces, and slip_velocity with valid_samples tracking.
  * No silent zero-replacement of missing horizons or missing Task 2 tangential forces; task isolation.
  * Full B1/B2/B3 (E=5 ensemble)/B4 conformal wiring with aleatoric & epistemic uncertainty decomposition.
  * UncertaintyPenalizedCEM planner integration preserving independent B1/B2/B3 planner identities.
- H4: Physics & Unit Corrections:
  * PegInHoleEnv velocity calculation prior to persistent peg_pos update across all regimes.
  * Default closed-loop horizon H=50 across evaluator/orchestrator entry points (with override support).
  * Task 2 height_mm unit consistency without mutating Task 1 mm_depth metrics.

Author: Sunil Kumar Chavhan (sunil@horoslab.org)
Organization: HOROS Physical Intelligence Research Group (H.R.)
"""

from __future__ import annotations
import json
import math
import os
import sys
import unittest
import numpy as np
import torch
import torch.nn as nn

current_dir = os.path.dirname(os.path.abspath(__file__))
r002_root = os.path.abspath(os.path.join(current_dir, ".."))
if r002_root not in sys.path:
    sys.path.insert(0, r002_root)
src_dir = os.path.join(r002_root, "src")
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

from src.contact_modes.hybrid_contact_state_model import HybridContactStateModel
from src.contact_modes.contact_mode_classifier import ContactModeClassifier
from src.models.deterministic_wm import DeterministicWorldModel
from src.models.probabilistic_wm import ProbabilisticWorldModel
from src.models.ensemble_wm import EnsembleWorldModel
from src.models.stratified_conformal_wm import ContactStratifiedConformalWM
from src.selection_aware.counterfactual_rollout import extract_env_state_and_wrench
from src.selection_aware.episode_conformal_engine import (
    EpisodeConformalEngine,
    PRIMARY_ALPHA,
    PRIMARY_TARGET_COVERAGE,
    PRIMARY_N_CALIB,
    compute_min_calib_samples,
)
from src.conformal.multihorizon_quantile_engine import MultiHorizonQuantileEngine
from src.integrated.calibration_runner import (
    CalibrationRunner,
    PHASE3_SEED_POOLS,
    get_calibration_seed_pool,
    get_phase3_task_pools,
    verify_disjoint_seed_pools,
)
from src.integrated.model_training_runner import ModelTrainingRunner
from src.integrated.planner_evaluator import PlannerEvaluator
from src.integrated.experiment_orchestrator import ExperimentOrchestrator
from src.integrated.statistical_analysis import (
    HORIZONS,
    MULTIHORIZON_COMPONENTS,
    compute_multihorizon_rmse,
    to_json_serializable,
)
from src.mining.mining_evaluator import MiningEvaluator
from src.planners.cem_planner import CEMPlanner
from src.planners.uncertainty_penalized_cem import UncertaintyPenalizedCEM
from src.planners.recovery_aware_cem import RecoveryAwareCEMPlanner
from src.environment.peg_in_hole_env import PegInHoleEnv
from src.environment.multifinger_lift_env import MultifingerLiftEnv


class MockContinuousDynamics(nn.Module):
    """Deterministic linear transition model for controlled test rollouts."""

    def __init__(self, state_dim: int, action_dim: int):
        super().__init__()
        self.state_dim = state_dim
        self.action_dim = action_dim

    def forward(self, s: torch.Tensor, a: torch.Tensor) -> torch.Tensor:
        # Constant persistence transition with small action delta
        delta = torch.zeros_like(s)
        delta[:, :min(s.shape[1], a.shape[1])] = a[:, :min(s.shape[1], a.shape[1])] * 0.05
        return s + delta


class TestHarnessRemediationH1(unittest.TestCase):
    """Workstream H1 — Contact Wrench Slicing & Representation Verification."""

    def setUp(self):
        np.random.seed(42)
        torch.manual_seed(42)

    def test_h1_01_15d_wrench_slicing_peg_in_hole(self):
        """Verifies 15-D state wrench slicing extracts s[:, 9:15] for peg_in_hole."""
        state_dim = 15
        action_dim = 6
        horizon = 5

        continuous_model = MockContinuousDynamics(state_dim, action_dim)
        classifier = ContactModeClassifier(state_dim, action_dim, hidden_dim=32, num_modes=7)
        hybrid_model = HybridContactStateModel(continuous_model, classifier)

        # Build 15-D initial state: [pos(3), vel(3), rot(3), wrench(6)]
        init_state = np.zeros(15, dtype=np.float32)
        init_state[0:3] = [1.0, 2.0, 15.0]       # pos mm
        init_state[3:6] = [0.1, -0.1, -0.5]      # vel mm/s
        init_state[6:9] = [0.01, 0.02, 0.0]      # rot rad
        nominal_wrench = np.array([2.5, -1.8, 14.2, 0.12, -0.05, 0.35], dtype=np.float32)
        init_state[9:15] = nominal_wrench        # 6-D wrench

        action_seq = np.zeros((horizon, action_dim), dtype=np.float32)

        # Test with explicit task="peg_in_hole"
        out_explicit = hybrid_model.predict_multistep(init_state, action_seq, horizon=horizon, task="peg_in_hole")
        forces_explicit = out_explicit["contact_forces"]
        self.assertEqual(forces_explicit.shape, (horizon, 6))
        np.testing.assert_allclose(forces_explicit[0], nominal_wrench, atol=1e-5)

        # Test with task=None (automated shape dispatch: dim == 15)
        out_auto = hybrid_model.predict_multistep(init_state, action_seq, horizon=horizon, task=None)
        forces_auto = out_auto["contact_forces"]
        self.assertEqual(forces_auto.shape, (horizon, 6))
        np.testing.assert_allclose(forces_auto[0], nominal_wrench, atol=1e-5)

    def test_h1_02_23d_wrench_slicing_multifinger_lift_no_kinematics_leakage(self):
        """
        Verifies 23-D state wrench slicing extracts finger normal forces s[:, 12:16],
        pads to 6-D, and has ZERO contamination from finger kinematics (indices 0:11).
        """
        state_dim = 23
        action_dim = 5
        horizon = 4

        continuous_model = MockContinuousDynamics(state_dim, action_dim)
        classifier = ContactModeClassifier(state_dim, action_dim, hidden_dim=32, num_modes=7)
        hybrid_model = HybridContactStateModel(continuous_model, classifier)

        # Build 23-D initial state:
        # 0:12  = finger_pos (4 fingers x 3 coords)
        # 12:16 = finger_fn (4 normal forces)
        # 16:20 = slip_ratio (4 slip ratios)
        # 20:23 = obj_pos (3 coords: x, y, z)
        init_state = np.zeros(23, dtype=np.float32)

        # Set distinctive kinematics, especially finger 3 at indices 9:12
        # Under legacy bug, s[:, 9:15] sliced [finger 3 pos (9:12), finger_fn[:3] (12:15)]
        init_state[0:12] = [
            -35.0, 0.0, 40.0,   # Finger 0
            35.0, 0.0, 40.0,    # Finger 1
            0.0, 35.0, 40.0,    # Finger 2
            0.0, -35.0, 40.0,   # Finger 3 (indices 9:12)
        ]

        expected_fn = np.array([4.25, 3.80, 4.10, 3.95], dtype=np.float32)
        init_state[12:16] = expected_fn       # Normal forces in N
        init_state[16:20] = [0.15, 0.12, 0.18, 0.14]  # Slip ratios
        init_state[20:23] = [0.0, 0.0, 12.5]          # Object pos (z = 12.5 mm)

        action_seq = np.zeros((horizon, action_dim), dtype=np.float32)

        # Rollout with explicit task="multifinger_lift"
        out_task = hybrid_model.predict_multistep(init_state, action_seq, horizon=horizon, task="multifinger_lift")
        forces_task = out_task["contact_forces"]

        self.assertEqual(forces_task.shape, (horizon, 6))
        # Elements 0:4 must be the 4 normal forces
        np.testing.assert_allclose(forces_task[0, :4], expected_fn, atol=1e-5)
        # Elements 4:6 must be 0.0 padding
        np.testing.assert_allclose(forces_task[0, 4:6], np.array([0.0, 0.0], dtype=np.float32), atol=1e-5)

        # STRICT INVARIANT: Verify ZERO kinematics contamination
        # Finger 3 coords are [-35.0, 40.0]; they must NEVER appear in forces
        self.assertNotIn(-35.0, forces_task[0])
        self.assertNotIn(40.0, forces_task[0])
        self.assertNotIn(35.0, forces_task[0])

        # Test with compliant_prelift task label
        out_prelift = hybrid_model.predict_multistep(init_state, action_seq, horizon=horizon, task="compliant_prelift")
        np.testing.assert_allclose(out_prelift["contact_forces"][0, :4], expected_fn, atol=1e-5)

        # Test with task=None (automated shape dispatch: dim == 23)
        out_auto = hybrid_model.predict_multistep(init_state, action_seq, horizon=horizon, task=None)
        forces_auto = out_auto["contact_forces"]
        self.assertEqual(forces_auto.shape, (horizon, 6))
        np.testing.assert_allclose(forces_auto[0, :4], expected_fn, atol=1e-5)
        np.testing.assert_allclose(forces_auto[0, 4:6], [0.0, 0.0], atol=1e-5)

    def test_h1_03_consistency_with_extract_env_state_and_wrench(self):
        """
        Verifies that extract_env_state_and_wrench and HybridContactStateModel
        produce identical 6-D wrench representations for both tasks, preserving all 4 fingers.
        """
        continuous_model_15 = MockContinuousDynamics(15, 6)
        clf_15 = ContactModeClassifier(15, 6, hidden_dim=32, num_modes=7)
        model_15 = HybridContactStateModel(continuous_model_15, clf_15)

        continuous_model_23 = MockContinuousDynamics(23, 5)
        clf_23 = ContactModeClassifier(23, 5, hidden_dim=32, num_modes=7)
        model_23 = HybridContactStateModel(continuous_model_23, clf_23)

        # 1. PegInHole (15-D)
        peg_obs = {
            "pos": np.array([0.5, -0.2, 8.0], dtype=np.float32),
            "vel": np.array([0.0, 0.0, -1.0], dtype=np.float32),
            "rot": np.array([0.01, 0.0, 0.0], dtype=np.float32),
            "wrench": np.array([1.2, -0.8, 8.5, 0.02, -0.01, 0.05], dtype=np.float32),
        }
        s_peg, w_peg = extract_env_state_and_wrench(peg_obs, task="peg_in_hole")
        self.assertEqual(len(s_peg), 15)
        self.assertEqual(len(w_peg), 6)

        pred_peg = model_15.predict_multistep(s_peg, np.zeros((1, 6), dtype=np.float32), horizon=1, task="peg_in_hole")
        np.testing.assert_allclose(pred_peg["contact_forces"][0], w_peg, atol=1e-5)

        # 2. MultifingerLift (23-D)
        lift_obs = {
            "finger_pos": np.array([
                [-35.0, 0.0, 40.0],
                [35.0, 0.0, 40.0],
                [0.0, 35.0, 40.0],
                [0.0, -35.0, 40.0],
            ], dtype=np.float32),
            "finger_fn": np.array([4.1, 4.2, 3.9, 4.4], dtype=np.float32),
            "slip_ratio": np.array([0.1, 0.15, 0.08, 0.12], dtype=np.float32),
            "obj_pos": np.array([0.0, 0.0, 10.0], dtype=np.float32),
        }
        s_lift, w_lift = extract_env_state_and_wrench(lift_obs, task="multifinger_lift")
        self.assertEqual(len(s_lift), 23)
        self.assertEqual(len(w_lift), 6)

        # Wrench representation check: 4 normal forces followed by 2 zeros
        np.testing.assert_allclose(w_lift[:4], lift_obs["finger_fn"], atol=1e-5)
        np.testing.assert_allclose(w_lift[4:], [0.0, 0.0], atol=1e-5)

        # Verify all 4 fingers are preserved (especially finger 3 at index 3)
        self.assertAlmostEqual(float(w_lift[3]), 4.4, places=5)

        # Match with hybrid model rollout
        pred_lift = model_23.predict_multistep(s_lift, np.zeros((1, 5), dtype=np.float32), horizon=1, task="multifinger_lift")
        np.testing.assert_allclose(pred_lift["contact_forces"][0], w_lift, atol=1e-5)

    def test_h1_04_mining_evaluator_force_rmse_uses_normal_forces(self):
        """
        Verifies MiningEvaluator.evaluate_prediction_and_modes compares normal forces
        at indices 12:16 on Task 2, ignoring kinematics differences in indices 0:11.
        """
        evaluator = MiningEvaluator(task="multifinger_lift", seed=42)

        # Create identical mock hybrid WM
        det_wm = DeterministicWorldModel(state_dim=23, action_dim=5, hidden_dim=32)
        mode_clf = ContactModeClassifier(state_dim=23, action_dim=5, hidden_dim=32, num_modes=7)
        hybrid_wm = HybridContactStateModel(det_wm, mode_clf)

        # Define 2 transitions:
        # s_t: base state
        s_t = np.zeros(23, dtype=np.float32)
        s_t[12:16] = [4.0, 4.0, 4.0, 4.0]  # Fn = 4 N
        a_t = np.zeros(5, dtype=np.float32)

        # Construct true_s_next with perturbed kinematics but IDENTICAL normal forces
        true_s_next = s_t.copy()
        true_s_next[0:12] = np.random.randn(12).astype(np.float32) * 5.0  # Big kinematics delta
        true_s_next[12:16] = [4.0, 4.0, 4.0, 4.0]                        # Normal forces identical

        # Mock the continuous model to output exact s_t (so pred normal forces = 4.0 N)
        class IdentityWM(nn.Module):
            def forward(self, s, a):
                return s

        mock_wm = HybridContactStateModel(IdentityWM(), mode_clf)

        test_trans = [(s_t, a_t, true_s_next, 2)]
        metrics = evaluator.evaluate_offline_predictions(mock_wm, test_trans)

        # Since normal forces are identical (4.0 vs 4.0), force_rmse MUST be 0.0
        # Under the legacy bug (slicing 8:12), the kinematics delta in true_s_next would make force_rmse > 0!
        self.assertAlmostEqual(metrics["force_rmse"], 0.0, places=4)

        # Now perturb normal forces by 1.0 N each
        perturbed_s_next = s_t.copy()
        perturbed_s_next[12:16] = [5.0, 5.0, 5.0, 5.0]  # Delta = 1.0 N
        perturbed_trans = [(s_t, a_t, perturbed_s_next, 2)]
        metrics_pert = evaluator.evaluate_offline_predictions(mock_wm, perturbed_trans)
        self.assertAlmostEqual(metrics_pert["force_rmse"], 1.0, places=4)

    def test_h1_05_recovery_aware_cem_crush_barrier_indices(self):
        """
        Verifies RecoveryAwareCEMPlanner checks normal forces in s[12:16] rather than s[8:12],
        preventing false crush triggers from finger 2/3 positions (indices 8:12).
        """
        state_dim = 23
        action_dim = 5
        action_bounds = (np.array([-1.0]*5), np.array([1.0]*5))

        # Model that outputs state where finger positions at 8:12 are 40.0 mm (standard fingertip height),
        # but normal forces at 12:16 are safely 4.0 N (< 20.0 N crush limit)
        class ConstantOutputWM(nn.Module):
            def forward(self, s, a):
                out = torch.zeros(s.shape[0], 23, dtype=torch.float32)
                out[:, 8:12] = 40.0   # Kinematics: 40 mm (would trigger crush under legacy s[8:12] > 20.0)
                out[:, 12:16] = 4.0   # Safe normal force: 4.0 N (< 20.0 N)
                out[:, 16:20] = 0.2   # Safe slip: 0.2 (< 0.80)
                out[:, 22] = 10.0     # Lift height: 10 mm
                return out

        mode_clf = ContactModeClassifier(state_dim, action_dim, hidden_dim=32, num_modes=7)
        hybrid_wm = HybridContactStateModel(ConstantOutputWM(), mode_clf)

        planner = RecoveryAwareCEMPlanner(
            world_model=hybrid_wm,
            action_dim=action_dim,
            action_bounds=action_bounds,
            horizon=3,
            num_samples=10,
            num_iterations=2,
            crush_penalty_weight=100.0,
        )

        s_init = np.zeros(23, dtype=np.float32)
        def reward_fn(s, a):
            return 10.0

        best_action, info = planner.plan(s_init, reward_fn)
        # If crush penalty was triggered (legacy bug), return would be: 10.0 - 100 * (40 - 20) = -1990 per step!
        # With fix, normal force is 4.0 N <= 20 N, so return is strictly positive: 3 steps * 10.0 = 30.0
        self.assertGreater(info["best_predicted_return"], 0.0)
        self.assertAlmostEqual(info["best_predicted_return"], 30.0, places=2)

    def test_h1_06_edge_cases_empty_horizon_and_arbitrary_dims(self):
        """Verifies predict_multistep gracefully handles horizon=0 and non-standard dimensions."""
        model = HybridContactStateModel(MockContinuousDynamics(15, 6), ContactModeClassifier(15, 6, hidden_dim=16, num_modes=7))

        # Horizon 0
        res_0 = model.predict_multistep(np.zeros(15, dtype=np.float32), np.zeros((0, 6), dtype=np.float32), horizon=0)
        self.assertEqual(res_0["states"].shape, (0,))
        self.assertEqual(res_0["contact_forces"].shape, (0, 6))

        # Arbitrary 8-D state: forces slice first 6 channels
        model_8 = HybridContactStateModel(MockContinuousDynamics(8, 3), ContactModeClassifier(8, 3, hidden_dim=16, num_modes=7))
        init_8 = np.arange(8, dtype=np.float32)
        res_8 = model_8.predict_multistep(init_8, np.zeros((2, 3), dtype=np.float32), horizon=2)
        self.assertEqual(res_8["contact_forces"].shape, (2, 6))
        np.testing.assert_allclose(res_8["contact_forces"][0], np.arange(6, dtype=np.float32))


class TestHarnessRemediationH2(unittest.TestCase):
    """Workstream H2 — Conformal Calibration Floor, Fallback Logging & Disjoint Pools."""

    def setUp(self):
        np.random.seed(42)
        torch.manual_seed(42)

    def _make_episode(
        self,
        seed: int,
        initial_mode: int = 0,
        noise_scale: float = 0.2,
        horizon: int = 20,
        state_dim: int = 23,
    ) -> dict:
        rng = np.random.RandomState(seed)
        true_s = rng.randn(horizon, state_dim).astype(np.float32)
        pred_s = true_s + rng.normal(0.0, noise_scale, size=(horizon, state_dim)).astype(np.float32)
        true_w = rng.randn(horizon, 6).astype(np.float32)
        pred_w = true_w + rng.normal(0.0, noise_scale * 0.5, size=(horizon, 6)).astype(np.float32)
        true_m = rng.randint(0, 7, size=horizon).astype(np.int64)
        logits = rng.randn(horizon, 7).astype(np.float32)
        probs = np.exp(logits) / np.sum(np.exp(logits), axis=-1, keepdims=True)
        return {
            "episode_id": f"ep_{seed}",
            "initial_mode": int(initial_mode),
            "decisions": [
                {
                    "realized_states": true_s,
                    "pred_states": pred_s,
                    "realized_wrenches": true_w,
                    "pred_wrenches": pred_w,
                    "realized_modes": true_m,
                    "pred_mode_probs": probs,
                }
            ],
        }

    def test_h2_01_explicit_90pct_target_and_sample_floors(self):
        """Verifies explicit 90% primary coverage target and finite-sample feasibility floors."""
        self.assertAlmostEqual(PRIMARY_ALPHA, 0.10, places=6)
        self.assertAlmostEqual(PRIMARY_TARGET_COVERAGE, 0.90, places=6)
        self.assertEqual(PRIMARY_N_CALIB, 60)

        # Exact order-statistic feasibility floors: n >= ceil(C / alpha) - 1
        self.assertEqual(compute_min_calib_samples(0.10, 1), 9)
        self.assertEqual(compute_min_calib_samples(0.10, 3), 29)
        self.assertEqual(compute_min_calib_samples(0.05, 1), 19)
        self.assertEqual(compute_min_calib_samples(0.05, 3), 59)
        self.assertEqual(compute_min_calib_samples(0.01, 3), 299)

        # Attempting to construct with legacy min_stratum_samples=5 clamps up to 29 at alpha=0.10
        engine = EpisodeConformalEngine(alpha=0.10, min_stratum_samples=5, seed=42)
        self.assertAlmostEqual(engine.target_coverage, 0.90, places=6)
        self.assertEqual(engine.n_min_marginal, 9)
        self.assertEqual(engine.n_min_joint, 29)
        self.assertEqual(engine.min_stratum_samples, 29)
        self.assertEqual(engine.recommended_n_calib, 60)

    def test_h2_02_n_calib_60_enforcement_and_95pct_guard(self):
        """Verifies CalibrationRunner enforces N_calib >= 60 for 90% target and N=120 for 95% target."""
        runner = CalibrationRunner(seed=42)
        self.assertAlmostEqual(runner.alpha, 0.10, places=6)
        self.assertAlmostEqual(runner.target_coverage, 0.90, places=6)
        self.assertEqual(runner.min_calib_episodes, 60)
        self.assertEqual(runner.min_stratum_samples, 29)

        # Undersampled N=25 (legacy defect) and N=40 must be rejected when enforcing protocol pool N=60
        for n_bad in (25, 40, 59):
            under_pool = [self._make_episode(seed=2000 + i, initial_mode=0) for i in range(n_bad)]
            with self.assertRaises(ValueError):
                runner.calibrate_cms_psacd(under_pool)

        # Protocol N=60 succeeds with interior non-max order statistics:
        # k_marginal = ceil(61 * 0.90) = 55 <= 60; k_joint = ceil(61 * (1 - 0.10/3)) = 59 <= 60
        pool_60 = [self._make_episode(seed=2000 + i, initial_mode=i % 2) for i in range(60)]
        engine = runner.calibrate_cms_psacd(pool_60)
        self.assertTrue(engine.calibrated)
        self.assertTrue(engine.marginal_calibrated)
        self.assertTrue(engine.joint_calibrated)
        self.assertFalse(engine.has_infinite_quantiles)
        self.assertEqual(engine.k_state_marginal, 55)
        self.assertEqual(engine.k_state_joint, 59)
        self.assertEqual(engine.calibration_status, "calibrated_finite")

        # 95% sensitivity check must NEVER run on n=60; requires N_calib = 120
        with self.assertRaises(ValueError):
            CalibrationRunner(alpha=0.05, min_calib_episodes=60)
        runner_95 = CalibrationRunner(alpha=0.05)
        self.assertEqual(runner_95.min_calib_episodes, 120)
        self.assertEqual(runner_95.min_stratum_samples, 59)

    def test_h2_03_minimum_stratum_29_and_explicit_fallback_to_global_logging(self):
        """
        Verifies per-mode stratum quantization is only permitted when m_n >= 29;
        undersampled modes (e.g., 18 samples, which bypassed legacy min=5) must fall back
        to finite global q_*_joint and explicitly log fallback_to_global=True.
        """
        # Build 60-episode pool:
        # Mode 0: 32 episodes (empirical stratum enabled, noise_scale=0.1)
        # Mode 1: 18 episodes (5 <= 18 < 29 -> MUST fallback to global, noise_scale=0.5)
        # Mode 2: 10 episodes (< 29 -> MUST fallback to global, noise_scale=1.5)
        # Modes 3..6: 0 episodes (< 29 -> MUST fallback to global)
        episodes = (
            [self._make_episode(seed=2000 + i, initial_mode=0, noise_scale=0.1) for i in range(32)]
            + [self._make_episode(seed=2032 + i, initial_mode=1, noise_scale=0.5) for i in range(18)]
            + [self._make_episode(seed=2050 + i, initial_mode=2, noise_scale=1.5) for i in range(10)]
        )

        runner = CalibrationRunner(alpha=0.10, seed=42)
        engine = runner.calibrate_cms_psacd(episodes)
        diag = engine.get_calibration_diagnostics()

        self.assertTrue(diag["calibrated"])
        self.assertFalse(diag["has_infinite_quantiles"])
        self.assertTrue(diag["any_fallback_to_global"])
        self.assertEqual(diag["empirical_stratified_modes"], [0])
        self.assertEqual(diag["fallback_modes"], [1, 2, 3, 4, 5, 6])

        # Mode 0 has 32 >= 29 -> empirical stratum threshold (< global because Mode 0 noise=0.1 is low)
        m0_log = engine.stratum_fallback_log[0]
        self.assertEqual(m0_log["sample_count"], 32)
        self.assertFalse(m0_log["fallback_to_global"])
        self.assertEqual(m0_log["source"], "empirical_stratum")
        self.assertLess(engine.stratified_q_joint[0]["state"], engine.q_state_joint)

        # Mode 1 has 18 samples (< 29): must NOT emit inf or empirical quantile; uses global joint fallback
        m1_log = engine.stratum_fallback_log[1]
        self.assertEqual(m1_log["sample_count"], 18)
        self.assertTrue(m1_log["fallback_to_global"])
        self.assertEqual(m1_log["source"], "global_joint_fallback")
        self.assertTrue(m1_log["finite"])
        self.assertAlmostEqual(engine.stratified_q_joint[1]["state"], engine.q_state_joint, places=6)
        self.assertAlmostEqual(engine.stratified_q_joint[1]["wrench"], engine.q_wrench_joint, places=6)
        self.assertAlmostEqual(engine.stratified_q_joint[1]["mode"], engine.q_mode_joint, places=6)

        # All 7 strata must be finite
        for m in range(7):
            th = engine.stratified_q_joint[m]
            self.assertTrue(math.isfinite(th["state"]))
            self.assertTrue(math.isfinite(th["wrench"]))
            self.assertTrue(math.isfinite(th["mode"]))

    def test_h2_04_no_infinite_quantile_silently_presented_as_calibrated(self):
        """
        Reproduces the P2.5 Defect G4 regime (n=25 < 29) and verifies the engine
        refuses to present inf quantiles as calibrated or return 100% coverage reports.
        """
        pool_25 = [self._make_episode(seed=2000 + i, initial_mode=i % 3) for i in range(25)]
        test_pool = [self._make_episode(seed=3000 + i, initial_mode=0) for i in range(15)]

        # strict=True raises ValueError immediately
        engine_strict = EpisodeConformalEngine(alpha=0.10, seed=42)
        with self.assertRaises(ValueError):
            engine_strict.calibrate(pool_25, strict=True)

        # Default calibrate sets calibrated=False and flags infinite quantile transparently
        engine = EpisodeConformalEngine(alpha=0.10, seed=42)
        engine.calibrate(pool_25)
        self.assertFalse(engine.calibrated)
        self.assertFalse(engine.joint_calibrated)
        self.assertTrue(engine.has_infinite_quantiles)
        self.assertEqual(engine.calibration_status, "uncalibrated_infinite_joint_quantile")
        self.assertEqual(engine.q_state_joint, float("inf"))

        # Attempting to evaluate test episodes must fail closed (RuntimeError), NOT log 100% coverage
        with self.assertRaises(RuntimeError):
            engine.evaluate_test_episodes(test_pool, use_stratified=True)

        # Unstratified baseline on tiny (< 9 frames) pool also refuses calibrated=True
        runner = CalibrationRunner(alpha=0.10, seed=42)
        tiny_pool = [self._make_episode(seed=2000 + i) for i in range(5)]
        unstrat_tiny = runner.calibrate_unstratified_baseline(tiny_pool)
        self.assertFalse(unstrat_tiny["calibrated"])
        self.assertFalse(unstrat_tiny["is_finite"])
        with self.assertRaises(ValueError):
            runner.calibrate_unstratified_baseline(tiny_pool, strict=True)

    def test_h2_05_separate_joint_and_marginal_quantile_reporting(self):
        """Verifies CalibrationRunner separates q_*_joint from q_*_marginal in reports."""
        calib_pool = [self._make_episode(seed=2000 + i, initial_mode=i % 4) for i in range(60)]
        test_pool = [self._make_episode(seed=3000 + i, initial_mode=i % 4) for i in range(25)]

        runner = CalibrationRunner(alpha=0.10, seed=42)
        engine = runner.calibrate_cms_psacd(calib_pool)
        unstrat = runner.calibrate_unstratified_baseline(calib_pool)
        report = runner.evaluate_calibration_regimes(engine, unstrat, test_pool)

        cms = report["cms_psacd"]
        self.assertEqual(cms["n_calibration_episodes"], 60)
        self.assertAlmostEqual(cms["target_coverage"], 0.90, places=6)
        self.assertEqual(cms["min_stratum_samples"], 29)
        self.assertTrue(cms["any_fallback_to_global"])
        self.assertIn("stratum_fallback_log", cms)

        # Verify explicit separation and finiteness of marginal vs joint quantiles
        mq = cms["marginal_quantiles"]
        jq = cms["joint_quantiles"]
        self.assertTrue(all(k in mq for k in ("q_state_marginal", "q_wrench_marginal", "q_mode_marginal")))
        self.assertTrue(all(k in jq for k in ("q_state_joint", "q_wrench_joint", "q_mode_joint")))
        for v in list(mq.values()) + list(jq.values()):
            self.assertTrue(math.isfinite(v))

        # Joint Bonferroni thresholds (alpha/3) must be >= marginal thresholds (alpha)
        self.assertGreaterEqual(jq["q_state_joint"], mq["q_state_marginal"])
        self.assertGreaterEqual(jq["q_wrench_joint"], mq["q_wrench_marginal"])
        self.assertGreaterEqual(jq["q_mode_joint"], mq["q_mode_marginal"])

    def test_h2_06_multihorizon_and_stratified_conformal_fallback_logging(self):
        """Verifies MultiHorizonQuantileEngine and ContactStratifiedConformalWM fallback logging."""
        # 1. MultiHorizonQuantileEngine on 60 trajectories (30 Fold 1 + 30 Fold 2) with sparse modes
        trajs = []
        rng = np.random.RandomState(42)
        for i in range(60):
            t_len = 25
            true_s = np.zeros((t_len, 15), dtype=np.float64)
            pred_s = true_s + rng.normal(0.0, 0.3, size=(t_len, 15))
            # Only modes 0 and 1 present -> modes 2..6 must log global_fallback
            modes = np.full(t_len, i % 2, dtype=np.int64)
            trajs.append({
                "true_states": true_s,
                "pred_states": pred_s,
                "true_modes": modes,
                "pred_modes": modes,
            })

        mh_engine = MultiHorizonQuantileEngine(alpha=0.10, min_cell_samples=15)
        mh_engine.calibrate(trajs)
        mh_diag = mh_engine.get_calibration_diagnostics()
        self.assertTrue(mh_diag["calibrated"])
        self.assertEqual(mh_diag["fold1_episodes"], 30)
        self.assertEqual(mh_diag["fold2_episodes"], 30)
        self.assertTrue(mh_diag["any_fallback_to_global"])
        self.assertTrue(math.isfinite(mh_diag["lambda_sim"]))
        self.assertEqual(mh_diag["cell_fallback_log"]["mode_4_H1"]["source"], "global_fallback")
        self.assertTrue(mh_diag["cell_fallback_log"]["mode_4_H1"]["fallback_to_global"])
        self.assertEqual(mh_diag["cell_fallback_log"]["mode_0_H1"]["sample_count"], 15)
        self.assertEqual(mh_diag["cell_fallback_log"]["mode_0_H1"]["source"], "empirical_cell")

        # Undersized Fold 2 (< 9 trajectories) refuses to claim calibrated
        mh_small = MultiHorizonQuantileEngine(alpha=0.10, min_cell_samples=15)
        mh_small.calibrate(trajs[:10])  # Fold 1=5, Fold 2=5 (< 9)
        self.assertFalse(mh_small.calibrated)

        # 2. ContactStratifiedConformalWM logs fallback per stratum
        wm = ContactStratifiedConformalWM(MockContinuousDynamics(15, 6), num_strata=5, alpha=0.10)
        s = np.zeros((30, 15), dtype=np.float32)
        a = np.zeros((30, 6), dtype=np.float32)
        t = rng.normal(0.0, 0.2, size=(30, 15)).astype(np.float32)
        strata = np.array([0] * 25 + [1] * 5, dtype=np.int64)  # Strata 2,3,4 empty; 1 undersampled
        wm.calibrate(s, a, t, strata)
        wm_diag = wm.get_calibration_diagnostics()
        self.assertTrue(wm_diag["calibrated"])
        self.assertEqual(wm_diag["stratum_fallback_log"]["0"]["source"], "empirical_stratum")
        self.assertFalse(wm_diag["stratum_fallback_log"]["0"]["fallback_to_global"])
        self.assertEqual(wm_diag["stratum_fallback_log"]["1"]["source"], "global_fallback")
        self.assertTrue(wm_diag["stratum_fallback_log"]["1"]["fallback_to_global"])

    def test_h2_07_disjoint_60_episode_calibration_pools_and_peginhole_isolation(self):
        """
        Verifies that BOTH 60-episode calibration pools (CompliantPreLift 2000-2059 and
        separate PegInHole 2100-2159) remain strictly disjoint from each other and from
        all training, offline eval, closed-loop eval, and excluded pilot pools.
        """
        audit = verify_disjoint_seed_pools()
        self.assertTrue(audit["disjoint_verified"])
        self.assertEqual(audit["pairwise_overlap_count"], 0)

        # Verify exact 60-episode primary calibration pools per task
        lift_calib = get_calibration_seed_pool("multifinger_lift", alpha=0.10)
        prelift_calib = get_calibration_seed_pool("compliant_prelift", alpha=0.10)
        peg_calib = get_calibration_seed_pool("peg_in_hole", alpha=0.10)

        self.assertEqual(len(lift_calib), 60)
        self.assertEqual(lift_calib, prelift_calib)
        self.assertEqual(lift_calib, list(range(2000, 2060)))

        self.assertEqual(len(peg_calib), 60)
        self.assertEqual(peg_calib, list(range(2100, 2160)))

        # Separate PegInHole and CompliantPreLift calibration pools must have zero intersection
        self.assertEqual(set(lift_calib) & set(peg_calib), set())

        # Both 60-ep calibration pools must have zero overlap with training, eval, or excluded pilot pools
        non_calib_pool_keys = [
            "training_compliant_prelift",
            "training_peg_in_hole",
            "offline_test_id",
            "offline_test_ood",
            "offline_test_peg_in_hole",
            "closed_loop_id",
            "closed_loop_ood",
            "closed_loop_peg_in_hole",
            "excluded_p26_pilot",
        ]
        for key in non_calib_pool_keys:
            other_set = set(PHASE3_SEED_POOLS[key])
            self.assertEqual(set(lift_calib) & other_set, set(), f"Lift calib overlaps {key}")
            self.assertEqual(set(peg_calib) & other_set, set(), f"PegInHole calib overlaps {key}")

        # 95% sensitivity pool extension yields 120 disjoint episodes per task (no 2060..2119 collision)
        lift_95 = get_calibration_seed_pool("compliant_prelift", alpha=0.05)
        peg_95 = get_calibration_seed_pool("peg_in_hole", alpha=0.05)
        self.assertEqual(len(lift_95), 120)
        self.assertEqual(len(peg_95), 120)
        self.assertEqual(set(lift_95) & set(peg_95), set())

        # Overlapping pool injection must raise ValueError
        with self.assertRaises(ValueError):
            verify_disjoint_seed_pools(extra_pools={"bad_pool": [2050, 2150]})

        # ExperimentOrchestrator defaults to N_calib=60 and disjoint task calibration pools
        orch_lift = ExperimentOrchestrator(task="multifinger_lift", seed=42)
        orch_peg = ExperimentOrchestrator(task="peg_in_hole", seed=42)
        self.assertEqual(orch_lift.calib_episodes_count, 60)
        self.assertEqual(orch_peg.calib_episodes_count, 60)
        self.assertEqual(orch_lift.task_seed_pools["calibration"], list(range(2000, 2060)))
        self.assertEqual(orch_peg.task_seed_pools["calibration"], list(range(2100, 2160)))

        # Reject undersized calibration pool in ExperimentOrchestrator
        with self.assertRaises(ValueError):
            ExperimentOrchestrator(task="peg_in_hole", calib_episodes_count=25)


class TestHarnessRemediationH3(unittest.TestCase):
    """Workstream H3 — Multi-Horizon Evaluation & B1–B4 Architecture + Planner Wiring."""

    def setUp(self):
        np.random.seed(42)
        torch.manual_seed(42)

    def _make_task_episodes(
        self,
        task: str,
        num_episodes: int = 3,
        steps: int = 21,
        seed: int = 100,
    ) -> list:
        rng = np.random.RandomState(seed)
        state_dim = 15 if task == "peg_in_hole" else 23
        action_dim = 6 if task == "peg_in_hole" else 5
        episodes = []
        for ep in range(num_episodes):
            states = np.cumsum(rng.normal(0.0, 0.25, size=(steps + 1, state_dim)), axis=0).astype(np.float32)
            actions = rng.uniform(-0.5, 0.5, size=(steps, action_dim)).astype(np.float32)
            modes = rng.randint(0, 7, size=steps + 1).astype(np.int64)
            # Ensure modes cover strata 0 and 2 well plus sparse mode 1
            modes[:] = (ep % 2) * 2
            modes[-1] = 1
            episodes.append({
                "episode_idx": ep,
                "seed": seed + ep,
                "realized_states": states,
                "actions": actions,
                "realized_modes": modes,
            })
        return episodes

    def test_h3_01_multihorizon_rmse_all_five_horizons_and_component_disaggregation(self):
        """
        Verifies compute_multihorizon_rmse evaluates H in [1, 3, 5, 10, 20] separately for
        robot_kinematics, object_position, normal_forces, tangential_forces, and slip_velocity
        across both Task 1 and Task 2, with exact reproducibility.
        """
        self.assertEqual(tuple(HORIZONS), (1, 3, 5, 10, 20))
        self.assertEqual(
            set(MULTIHORIZON_COMPONENTS),
            {"robot_kinematics", "object_position", "normal_forces", "tangential_forces", "slip_velocity"},
        )

        # Task 1: Peg-in-Hole (15-D)
        t1_true = [np.zeros((20, 15), dtype=np.float32) for _ in range(2)]
        t1_pred = [np.zeros((20, 15), dtype=np.float32) for _ in range(2)]
        for seq in t1_pred:
            seq[:, 0:9] = 1.0    # robot_kinematics err = 1.0
            seq[:, 9:11] = 2.0   # tangential_forces (Fx, Fy) err = 2.0
            seq[:, 11:12] = 3.0  # normal_forces (Fz) err = 3.0

        res_t1_a = compute_multihorizon_rmse(t1_pred, t1_true, horizons=HORIZONS, task="peg_in_hole")
        res_t1_b = compute_multihorizon_rmse(t1_pred, t1_true, horizons=HORIZONS, task="peg_in_hole")
        self.assertEqual(res_t1_a, res_t1_b)  # Reproducible
        self.assertEqual(res_t1_a["task"], "peg_in_hole")

        for h in HORIZONS:
            h_str = str(h)
            self.assertEqual(res_t1_a["valid_samples_per_horizon"][h_str], 2)
            comps = res_t1_a["per_horizon"][h_str]["components"]
            self.assertAlmostEqual(comps["robot_kinematics"]["rmse"], 1.0, places=4)
            self.assertAlmostEqual(comps["tangential_forces"]["rmse"], 2.0, places=4)
            self.assertAlmostEqual(comps["normal_forces"]["rmse"], 3.0, places=4)
            # Not applicable on Task 1 15-D -> None with valid_samples=0 (never 0.0)
            self.assertIsNone(comps["object_position"]["rmse"])
            self.assertFalse(comps["object_position"]["applicable"])
            self.assertEqual(comps["object_position"]["valid_samples"], 0)
            self.assertIsNone(comps["slip_velocity"]["rmse"])
            self.assertFalse(comps["slip_velocity"]["applicable"])

        # Task 2: Multifinger-Lift (23-D) with explicit external tangential forces
        t2_true = [np.zeros((20, 23), dtype=np.float32) for _ in range(2)]
        t2_pred = [np.zeros((20, 23), dtype=np.float32) for _ in range(2)]
        t2_true_tan = [np.zeros((20, 4), dtype=np.float32) for _ in range(2)]
        t2_pred_tan = [np.full((20, 4), 0.75, dtype=np.float32) for _ in range(2)]
        for seq in t2_pred:
            seq[:, 0:12] = 0.5   # robot_kinematics
            seq[:, 12:16] = 1.5  # normal_forces
            seq[:, 16:20] = 0.25 # slip_velocity (slip_ratio)
            seq[:, 20:23] = 2.5  # object_position

        res_t2 = compute_multihorizon_rmse(
            t2_pred,
            t2_true,
            horizons=HORIZONS,
            task="multifinger_lift",
            pred_tangential_forces=t2_pred_tan,
            true_tangential_forces=t2_true_tan,
        )
        self.assertEqual(res_t2["task"], "multifinger_lift")
        for h in HORIZONS:
            comps = res_t2["per_horizon"][str(h)]["components"]
            self.assertAlmostEqual(comps["robot_kinematics"]["rmse"], 0.5, places=4)
            self.assertAlmostEqual(comps["normal_forces"]["rmse"], 1.5, places=4)
            self.assertAlmostEqual(comps["slip_velocity"]["rmse"], 0.25, places=4)
            self.assertAlmostEqual(comps["object_position"]["rmse"], 2.5, places=4)
            self.assertAlmostEqual(comps["tangential_forces"]["rmse"], 0.75, places=4)

    def test_h3_02_missing_predictions_never_zero_replaced_and_task_isolation(self):
        """
        Verifies missing horizons / NaN / absent tangential channels are never replaced with 0.0,
        exact valid_samples per horizon are recorded, mixed Task 1/2 fails, and JSON is RFC 8259 clean.
        """
        t2_true = [
            np.zeros((20, 23), dtype=np.float32),  # covers H=1,3,5,10,20
            np.zeros((12, 23), dtype=np.float32),  # covers H=1,3,5,10
            np.zeros((5, 23), dtype=np.float32),   # covers H=1,3,5
            np.zeros((20, 23), dtype=np.float32),  # will contain NaN at H=10
        ]
        t2_pred = [
            np.ones((20, 23), dtype=np.float32),
            np.ones((8, 23), dtype=np.float32),    # shorter prediction stops at 8 -> misses H=10,20
            None,                                  # completely missing prediction!
            np.ones((20, 23), dtype=np.float32),
        ]
        t2_pred[3][9, 0] = np.nan                  # NaN at H=10 (index 9)

        # Do NOT supply tangential forces -> missing on packed 23-D states!
        res = compute_multihorizon_rmse(t2_pred, t2_true, horizons=HORIZONS, task="multifinger_lift")

        # Valid sample counts:
        # H=1  (idx 0): trajs 0, 1, 3 -> 3 valid
        # H=3  (idx 2): trajs 0, 1, 3 -> 3 valid
        # H=5  (idx 4): trajs 0, 1, 3 -> 3 valid
        # H=10 (idx 9): traj 0 valid, traj 1 truncated (len 8), traj 2 None, traj 3 NaN -> 1 valid!
        # H=20 (idx 19): trajs 0, 3 -> 2 valid
        self.assertEqual(res["valid_samples_per_horizon"], {"1": 3, "3": 3, "5": 3, "10": 1, "20": 2})

        # Short-only set where H=20 has zero valid trajectories -> None (NEVER 0.0!)
        res_short = compute_multihorizon_rmse(
            [np.ones((5, 23), dtype=np.float32)],
            [np.zeros((5, 23), dtype=np.float32)],
            horizons=HORIZONS,
            task="multifinger_lift",
        )
        self.assertEqual(res_short["valid_samples_per_horizon"]["10"], 0)
        self.assertIsNone(res_short["state_rmse"]["10"])
        self.assertIsNone(res_short["per_horizon"]["20"]["components"]["robot_kinematics"]["rmse"])

        # Packed 23-D state without tangential forces must report None (NOT 0.0!)
        self.assertIsNone(res["per_horizon"]["1"]["components"]["tangential_forces"]["rmse"])
        self.assertEqual(res["per_horizon"]["1"]["components"]["tangential_forces"]["valid_samples"], 0)
        self.assertFalse(res["per_horizon"]["1"]["components"]["tangential_forces"]["applicable"])

        # Task 1 (15-D) and Task 2 (23-D) cannot be mixed
        with self.assertRaises(ValueError):
            compute_multihorizon_rmse(
                [np.zeros((5, 15), dtype=np.float32), np.zeros((5, 23), dtype=np.float32)],
                [np.zeros((5, 15), dtype=np.float32), np.zeros((5, 23), dtype=np.float32)],
            )

        # Strict RFC 8259 JSON serialization succeeds (allow_nan=False)
        dumped = json.dumps(to_json_serializable(res_short), allow_nan=False)
        self.assertIn('"20": null', dumped)

    def test_h3_03_b1_b2_b3_uncertainty_decomposition_and_5_member_ensemble(self):
        """
        Verifies B1 (Deterministic), B2 (Probabilistic aleatoric), and B3 (E=5 Ensemble
        epistemic + aleatoric) independently instantiate, train, predict, and decompose uncertainty.
        """
        runner = ModelTrainingRunner(task="multifinger_lift", hidden_dim=32, epochs=2, seed=42)
        episodes = self._make_task_episodes(task="multifinger_lift", num_episodes=2, steps=21, seed=100)
        transitions = runner.extract_transitions(episodes)

        m_b1, st_b1 = runner.train_hybrid_model(transitions, epochs=2, model_type="B1", return_stats=True)
        m_b2, st_b2 = runner.train_hybrid_model(transitions, epochs=2, model_type="B2", return_stats=True)
        m_b3, st_b3 = runner.train_hybrid_model(transitions, epochs=2, model_type="B3", return_stats=True)

        self.assertIsInstance(m_b1.continuous_model, DeterministicWorldModel)
        self.assertIsInstance(m_b2.continuous_model, ProbabilisticWorldModel)
        self.assertIsInstance(m_b3.continuous_model, EnsembleWorldModel)
        self.assertEqual(st_b3["ensemble_size"], 5)
        self.assertEqual(len(m_b3.continuous_model.models), 5)

        # Verify all 5 B3 ensemble members have pairwise distinct linear head weights
        for i in range(5):
            for j in range(i + 1, 5):
                wi = m_b3.continuous_model.models[i].mean_head.weight.detach()
                wj = m_b3.continuous_model.models[j].mean_head.weight.detach()
                self.assertFalse(torch.allclose(wi, wj))

        evaluator = MiningEvaluator(task="multifinger_lift", seed=42)
        off_b1 = evaluator.evaluate_offline_predictions(m_b1, transitions[:10])
        off_b2 = evaluator.evaluate_offline_predictions(m_b2, transitions[:10])
        off_b3 = evaluator.evaluate_offline_predictions(m_b3, transitions[:10])

        # B1: deterministic -> 0 epistemic, 0 aleatoric, no NLL
        self.assertEqual(off_b1["architecture_id"], "B1")
        self.assertEqual(off_b1["epistemic_uncertainty_mean"], 0.0)
        self.assertEqual(off_b1["aleatoric_uncertainty_mean"], 0.0)
        self.assertIsNone(off_b1["gaussian_nll"])

        # B2: heteroscedastic probabilistic -> 0 epistemic, >0 aleatoric, finite NLL
        self.assertEqual(off_b2["architecture_id"], "B2")
        self.assertEqual(off_b2["epistemic_uncertainty_mean"], 0.0)
        self.assertGreater(off_b2["aleatoric_uncertainty_mean"], 0.0)
        self.assertIsNotNone(off_b2["gaussian_nll"])
        self.assertTrue(math.isfinite(off_b2["gaussian_nll"]))

        # B3: 5-member ensemble -> >0 epistemic AND >0 aleatoric, finite NLL
        self.assertEqual(off_b3["architecture_id"], "B3")
        self.assertGreater(off_b3["epistemic_uncertainty_mean"], 0.0)
        self.assertGreater(off_b3["aleatoric_uncertainty_mean"], 0.0)
        self.assertIsNotNone(off_b3["gaussian_nll"])
        self.assertTrue(math.isfinite(off_b3["gaussian_nll"]))

        # Multi-horizon uncertainty tracking across H in {1,3,5,10,20}
        mh_b3 = evaluator.evaluate_multihorizon_offline(m_b3, episodes, horizons=HORIZONS)
        for h in HORIZONS:
            u_h = mh_b3["uncertainty_by_horizon"][str(h)]
            self.assertGreater(u_h["valid_samples"], 0)
            self.assertGreater(u_h["epistemic_mean"], 0.0)
            self.assertGreater(u_h["aleatoric_mean"], 0.0)

    def test_h3_04_b4_conformal_architecture_isolation_coverage_and_fallbacks(self):
        """
        Verifies B4 ContactStratifiedConformalWM remains strictly a conformal prediction
        architecture (cannot be trained via B1-B3 neural trainer), produces stratified
        intervals, and exposes empirical coverage + H2 fallback diagnostics separately.
        """
        runner = ModelTrainingRunner(task="peg_in_hole", hidden_dim=32, epochs=2, seed=42)
        train_eps = self._make_task_episodes(task="peg_in_hole", num_episodes=2, steps=15, seed=1100)
        calib_eps = self._make_task_episodes(task="peg_in_hole", num_episodes=3, steps=15, seed=2100)
        test_eps = self._make_task_episodes(task="peg_in_hole", num_episodes=2, steps=15, seed=3080)

        train_t = runner.extract_transitions(train_eps)
        calib_t = runner.extract_transitions(calib_eps)
        test_t = runner.extract_transitions(test_eps)

        # Refuses direct neural training for B4
        with self.assertRaises(ValueError):
            runner.train_hybrid_model(train_t, model_type="B4")

        # train_all_architectures requires explicit calib_transitions for B4
        with self.assertRaises(ValueError):
            runner.train_all_architectures(train_t, calib_transitions=None, architectures=("B4",))

        b1_model = runner.train_hybrid_model(train_t, epochs=2, model_type="B1")
        b4_model = runner.calibrate_conformal_b4(
            base_model=b1_model, calib_transitions=calib_t, alpha=0.10, num_strata=7
        )
        self.assertIsInstance(b4_model, ContactStratifiedConformalWM)

        evaluator = MiningEvaluator(task="peg_in_hole", seed=42)
        b4_res = evaluator.evaluate_conformal_b4(b4_model, test_t)
        self.assertEqual(b4_res["architecture_id"], "B4")
        self.assertTrue(b4_res["is_conformal_architecture"])
        self.assertAlmostEqual(b4_res["target_coverage"], 0.90, places=5)
        self.assertIn("empirical_coverage", b4_res)
        self.assertIn("mean_interval_radius", b4_res)
        self.assertIn("per_stratum_coverage", b4_res)
        self.assertIn("calibration_diagnostics", b4_res)
        self.assertIn("stratum_fallback_log", b4_res["calibration_diagnostics"])
        self.assertTrue(b4_res["calibration_diagnostics"]["any_fallback_to_global"])
        # B4 must NOT report B2/B3 Gaussian NLL or epistemic variance fields
        self.assertNotIn("gaussian_nll", b4_res)
        self.assertNotIn("epistemic_uncertainty_mean", b4_res)

    def test_h3_05_uncertainty_penalized_cem_and_independent_planner_identities(self):
        """
        Verifies UncertaintyPenalizedCEM integrates with B2/B3 models, tracks raw vs penalized
        returns, and PlannerEvaluator preserves independent B1/B2/B3 planner identities.
        """
        runner = ModelTrainingRunner(task="multifinger_lift", hidden_dim=32, epochs=2, seed=42)
        eps = self._make_task_episodes(task="multifinger_lift", num_episodes=2, steps=15, seed=1000)
        transitions = runner.extract_transitions(eps)

        m_b1 = runner.train_hybrid_model(transitions, epochs=2, model_type="B1")
        m_b2 = runner.train_hybrid_model(transitions, epochs=2, model_type="B2")
        m_b3 = runner.train_hybrid_model(transitions, epochs=2, model_type="B3")

        bounds = (np.array([-1.0] * 5), np.array([1.0] * 5))
        def reward_fn(s, a):
            return float(s[22] - 0.1 * np.linalg.norm(a))

        # Direct UncertaintyPenalizedCEM on B3 (epistemic) and B2 (aleatoric)
        up_cem_b3 = UncertaintyPenalizedCEM(
            m_b3, action_dim=5, action_bounds=bounds, horizon=3, num_samples=8, num_iterations=2, beta=2.0, seed=42
        )
        act_b3, info_b3 = up_cem_b3.plan(np.zeros(23, dtype=np.float32), reward_fn)
        self.assertEqual(len(act_b3), 5)
        self.assertEqual(info_b3["planner_type"], "UncertaintyPenalizedCEM")
        self.assertEqual(info_b3["uncertainty_source"], "epistemic")
        self.assertGreater(info_b3["best_uncertainty_penalty"], 0.0)
        self.assertAlmostEqual(
            info_b3["best_predicted_return"] - info_b3["best_uncertainty_penalty"],
            info_b3["best_penalized_return"],
            places=5,
        )

        up_cem_b2 = UncertaintyPenalizedCEM(
            m_b2, action_dim=5, action_bounds=bounds, horizon=3, num_samples=8, num_iterations=2, beta=2.0, seed=42
        )
        _, info_b2 = up_cem_b2.plan(np.zeros(23, dtype=np.float32), reward_fn)
        self.assertEqual(info_b2["uncertainty_source"], "aleatoric")
        self.assertGreater(info_b2["best_uncertainty_penalty"], 0.0)

        # PlannerEvaluator wiring preserves independent planner identities across B1, B2, B3
        pe = PlannerEvaluator(
            task="multifinger_lift", eval_horizon=4, plan_horizon=3, num_candidates=6, cem_iterations=1, seed=42
        )
        out_b1 = pe.evaluate_policy(m_b1, num_episodes=1, start_seed=6000, use_safety_filter=True)
        out_b2 = pe.evaluate_policy(m_b2, num_episodes=1, start_seed=6000, use_safety_filter=True)
        out_b3 = pe.evaluate_policy(m_b3, num_episodes=1, start_seed=6000, use_safety_filter=True)

        self.assertEqual(out_b1["architecture_id"], "B1")
        self.assertEqual(out_b1["planner_identity"], "B1_CEMPlanner")
        self.assertEqual(out_b1["planner_type"], "CEMPlanner")

        self.assertEqual(out_b2["architecture_id"], "B2")
        self.assertEqual(out_b2["planner_identity"], "B2_UncertaintyPenalizedCEM_aleatoric")
        self.assertEqual(out_b2["planner_type"], "UncertaintyPenalizedCEM")
        self.assertGreater(out_b2["uncertainty_summary"]["aleatoric_mean"], 0.0)

        self.assertEqual(out_b3["architecture_id"], "B3")
        self.assertEqual(out_b3["planner_identity"], "B3_UncertaintyPenalizedCEM_epistemic")
        self.assertEqual(out_b3["planner_type"], "UncertaintyPenalizedCEM")
        self.assertGreater(out_b3["uncertainty_summary"]["epistemic_mean"], 0.0)

        # Target A multi-horizon RMSE is wired; missing H=10,20 cleanly logged with valid_samples=0
        self.assertIsNotNone(out_b3["target_a_multihorizon_rmse"])
        self.assertGreater(out_b3["target_a_multihorizon_rmse"]["valid_samples_per_horizon"]["1"], 0)
        self.assertEqual(out_b3["target_a_multihorizon_rmse"]["valid_samples_per_horizon"]["20"], 0)
        self.assertIsNone(out_b3["target_a_multihorizon_rmse"]["state_rmse"]["20"])

    def test_h3_06_orchestrator_wiring_multihorizon_and_b1_b4_separation(self):
        """
        End-to-end verification of ExperimentOrchestrator.evaluate_architecture_suite wiring
        multi-horizon RMSE + B1–B4 architectures separately for Task 1 and Task 2, with strict JSON.
        """
        for task, train_seed, cal_seed, test_seed, cl_seed in (
            ("peg_in_hole", 1100, 2100, 3080, 6200),
            ("multifinger_lift", 1000, 2000, 3000, 6000),
        ):
            orch = ExperimentOrchestrator(
                task=task, eval_horizon=5, test_episodes_count=2, calib_episodes_count=60, seed=42
            )
            orch.planner_evaluator = PlannerEvaluator(
                task=task, eval_horizon=4, plan_horizon=3, num_candidates=6, cem_iterations=1, seed=42
            )
            train_eps = self._make_task_episodes(task=task, num_episodes=2, steps=21, seed=train_seed)
            calib_eps = self._make_task_episodes(task=task, num_episodes=3, steps=21, seed=cal_seed)
            test_eps = self._make_task_episodes(task=task, num_episodes=2, steps=21, seed=test_seed)

            suite_a = orch.evaluate_architecture_suite(
                training_episodes=train_eps,
                calib_raw_episodes=calib_eps,
                test_raw_episodes=test_eps,
                architectures=("B1", "B2", "B3", "B4"),
                epochs=2,
                run_closed_loop=True,
                closed_loop_episodes=1,
                closed_loop_start_seed=cl_seed,
            )
            suite_b = orch.evaluate_architecture_suite(
                training_episodes=train_eps,
                calib_raw_episodes=calib_eps,
                test_raw_episodes=test_eps,
                architectures=("B1", "B2", "B3", "B4"),
                epochs=2,
                run_closed_loop=True,
                closed_loop_episodes=1,
                closed_loop_start_seed=cl_seed,
            )

            self.assertEqual(suite_a["task"], task)
            self.assertEqual(set(suite_a["architectures"].keys()), {"B1", "B2", "B3", "B4"})
            # Reproducible across runs
            self.assertEqual(
                suite_a["architectures"]["B3"]["offline_multihorizon_rmse"]["state_rmse"],
                suite_b["architectures"]["B3"]["offline_multihorizon_rmse"]["state_rmse"],
            )
            # Check all 5 horizons populated offline
            for arch in ("B1", "B2", "B3"):
                mh = suite_a["architectures"][arch]["offline_multihorizon_rmse"]
                self.assertEqual(mh["valid_samples_per_horizon"], {"1": 2, "3": 2, "5": 2, "10": 2, "20": 2})

            # B4 cleanly isolated as conformal architecture
            b4_entry = suite_a["architectures"]["B4"]
            self.assertTrue(b4_entry["is_conformal_architecture"])
            self.assertEqual(b4_entry["conformal_evaluation"]["task"], task)

            # Strict RFC 8259 JSON serializability
            json_str = json.dumps(to_json_serializable(suite_a), allow_nan=False)
            self.assertGreater(len(json_str), 100)


class TestHarnessRemediationH4(unittest.TestCase):
    """Workstream H4 — PegInHole Velocity Ordering, Closed-Loop H=50, & Height Units."""

    def setUp(self):
        np.random.seed(42)
        torch.manual_seed(42)

    def test_h4_01_peg_velocity_nonzero_on_accepted_displacement(self):
        """H4-01: Peg velocity is nonzero for an accepted nonzero displacement in free and hole regimes."""
        env = PegInHoleEnv(dt=0.02, seed=42)
        env.reset(
            init_pos_offset=np.array([0.0, 0.0], dtype=np.float64),
            init_rot_offset=np.array([0.0, 0.0, 0.0], dtype=np.float64),
        )

        # 1. Free space (z > 0): step down by -2.0 mm
        obs_free, _, _, _ = env.step(np.array([0.5, -0.25, -2.0, 0.0, 0.0, 0.0], dtype=np.float64))
        self.assertGreater(obs_free["pos"][2], 0.0)
        self.assertGreater(float(np.linalg.norm(obs_free["vel"])), 0.0)

        # 2. Clear inside hole (z <= 0, r <= clearance): move down inside hole
        env.peg_pos = np.array([0.0, 0.0, -5.0], dtype=np.float64)
        obs_hole, _, _, _ = env.step(np.array([0.1, 0.0, -3.0, 0.0, 0.0, 0.0], dtype=np.float64))
        self.assertLessEqual(obs_hole["pos"][2], 0.0)
        self.assertGreater(float(np.linalg.norm(obs_hole["vel"])), 0.0)

        # 3. Wall-contact / collision regime (z <= 0, r > clearance)
        env.peg_pos = np.array([0.4, 0.0, -5.0], dtype=np.float64)
        obs_coll, _, _, _ = env.step(np.array([1.0, 0.0, -2.0, 0.0, 0.0, 0.0], dtype=np.float64))
        self.assertGreater(float(np.linalg.norm(obs_coll["vel"])), 0.0)

    def test_h4_02_velocity_equals_accepted_displacement_divided_by_dt(self):
        """H4-02: Peg velocity equals exact accepted displacement divided by dt across all regimes."""
        dt = 0.02
        env = PegInHoleEnv(dt=dt, seed=42)
        obs = env.reset(
            init_pos_offset=np.array([0.0, 0.0], dtype=np.float64),
            init_rot_offset=np.array([0.0, 0.0, 0.0], dtype=np.float64),
        )

        # 1. Free-space displacement
        prev_pos = obs["pos"].copy()
        action = np.array([1.0, -0.5, -2.0, 0.0, 0.0, 0.0], dtype=np.float64)
        obs_next, _, _, _ = env.step(action)
        expected_vel = (obs_next["pos"] - prev_pos) / dt
        np.testing.assert_allclose(obs_next["vel"], expected_vel, atol=1e-6)
        np.testing.assert_allclose(obs_next["vel"], np.array([50.0, -25.0, -100.0]), atol=1e-6)

        # 2. Clear inside hole (z <= 0, radial_dist <= clearance)
        env.peg_pos = np.array([0.05, -0.05, -10.0], dtype=np.float64)
        prev_hole = env.peg_pos.copy()
        obs_hole, _, _, _ = env.step(np.array([0.05, 0.05, -4.0, 0.0, 0.0, 0.0], dtype=np.float64))
        expected_hole_vel = (obs_hole["pos"] - prev_hole) / dt
        np.testing.assert_allclose(obs_hole["vel"], expected_hole_vel, atol=1e-6)
        np.testing.assert_allclose(obs_hole["vel"], np.array([2.5, 2.5, -200.0]), atol=1e-6)

        # 3. Collision-constrained wall contact (z <= 0, radial_dist > clearance)
        env.peg_pos = np.array([0.4, 0.0, -8.0], dtype=np.float64)
        prev_coll = env.peg_pos.copy()
        cand_action = np.array([2.0, 0.0, -2.0, 0.0, 0.0, 0.0], dtype=np.float64)
        unconstrained_target = prev_coll + cand_action[:3]
        obs_coll, _, _, _ = env.step(cand_action)
        self.assertFalse(np.allclose(obs_coll["pos"], unconstrained_target))  # Collision modified pos
        expected_coll_vel = (obs_coll["pos"] - prev_coll) / dt
        np.testing.assert_allclose(obs_coll["vel"], expected_coll_vel, atol=1e-6)

    def test_h4_03_stationary_peg_produces_zero_velocity(self):
        """H4-03: Zero displacement command keeps peg stationary with exactly zero velocity."""
        env = PegInHoleEnv(dt=0.02, seed=42)
        env.reset(
            init_pos_offset=np.array([0.0, 0.0], dtype=np.float64),
            init_rot_offset=np.array([0.0, 0.0, 0.0], dtype=np.float64),
        )
        zero_act = np.zeros(6, dtype=np.float64)

        # Free space stationary step
        obs_free, _, _, _ = env.step(zero_act)
        np.testing.assert_allclose(obs_free["vel"], np.zeros(3), atol=1e-12)

        # Clear hole stationary step
        env.peg_pos = np.array([0.0, 0.0, -10.0], dtype=np.float64)
        obs_hole, _, _, _ = env.step(zero_act)
        np.testing.assert_allclose(obs_hole["vel"], np.zeros(3), atol=1e-12)

    def test_h4_04_closed_loop_default_horizon_is_50(self):
        """H4-04: Default closed-loop horizon is exactly H=50 while multi-horizon forecast horizons remain untouched."""
        pe_lift = PlannerEvaluator(task="multifinger_lift", plan_horizon=2, num_candidates=4, cem_iterations=1, seed=42)
        pe_peg = PlannerEvaluator(task="peg_in_hole", plan_horizon=2, num_candidates=4, cem_iterations=1, seed=42)
        orch = ExperimentOrchestrator(task="peg_in_hole", calib_episodes_count=60, seed=42)
        me = MiningEvaluator(task="multifinger_lift", seed=42)

        self.assertEqual(pe_lift.eval_horizon, 50)
        self.assertEqual(pe_peg.eval_horizon, 50)
        self.assertEqual(orch.eval_horizon, 50)
        self.assertEqual(me.eval_horizon, 50)
        # Multi-horizon forecast steps (1, 3, 5, 10, 20) remain untouched
        self.assertEqual(tuple(HORIZONS), (1, 3, 5, 10, 20))

        # Execute closed-loop PlannerEvaluator using default eval_horizon=50
        dummy_wm = HybridContactStateModel(
            MockContinuousDynamics(23, 5), ContactModeClassifier(23, 5, hidden_dim=16, num_modes=7)
        )
        res = pe_lift.evaluate_policy(dummy_wm, num_episodes=1, start_seed=6000, use_safety_filter=True)
        self.assertEqual(res["eval_horizon_steps"], 50)
        self.assertEqual(res["target_b_episodes"][0]["steps"], 50)
        self.assertEqual(len(res["target_b_episodes"][0]["actions"]), 50)

    def test_h4_05_explicit_horizon_overrides_remain_functional(self):
        """H4-05: Explicit closed-loop eval_horizon overrides remain respected across entry points."""
        pe = PlannerEvaluator(
            task="peg_in_hole", eval_horizon=12, plan_horizon=2, num_candidates=4, cem_iterations=1, seed=42
        )
        orch = ExperimentOrchestrator(task="multifinger_lift", eval_horizon=35, calib_episodes_count=60, seed=42)
        me = MiningEvaluator(task="peg_in_hole", eval_horizon=15, seed=42)

        self.assertEqual(pe.eval_horizon, 12)
        self.assertEqual(orch.eval_horizon, 35)
        self.assertEqual(me.eval_horizon, 15)

        dummy_wm = HybridContactStateModel(
            MockContinuousDynamics(15, 6), ContactModeClassifier(15, 6, hidden_dim=16, num_modes=7)
        )
        res = pe.evaluate_policy(dummy_wm, num_episodes=1, start_seed=6200, use_safety_filter=True)
        self.assertEqual(res["eval_horizon_steps"], 12)
        self.assertEqual(res["target_b_episodes"][0]["steps"], 12)

    def test_h4_06_task2_goal_progress_label_and_numeric_units_agree(self):
        """
        H4-06: Task 2 goal_progress uses millimeter label 'height_mm' (never 'meters_height')
        and its numeric value matches MultifingerLiftEnv obj_pos[2] in millimeters (1:1).
        """
        # World model whose predicted next state rewards squeezing & lifting so CEM actually lifts
        class LiftIncentiveWM(nn.Module):
            def forward(self, s: torch.Tensor, a: torch.Tensor) -> torch.Tensor:
                out = s.clone()
                out[:, 12:16] = torch.clamp(out[:, 12:16] + a[:, :4] * 2.0, min=0.0)
                out[:, 22] = out[:, 22] + torch.clamp(a[:, 4], min=-2.0, max=5.0)
                return out

        pe = PlannerEvaluator(
            task="multifinger_lift", eval_horizon=6, plan_horizon=2, num_candidates=24, cem_iterations=2, seed=42
        )
        wm = HybridContactStateModel(LiftIncentiveWM(), ContactModeClassifier(23, 5, hidden_dim=16, num_modes=7))
        res = pe.evaluate_policy(wm, num_episodes=1, start_seed=6000, use_safety_filter=False)

        self.assertEqual(res["goal_progress"]["unit"], "height_mm")
        self.assertNotEqual(res["goal_progress"]["unit"], "meters_height")

        # Numeric check: final state obj_pos[2] is at index 22 (in mm), must agree 1:1 with goal_progress
        final_realized_s = res["target_b_episodes"][0]["realized_states"][-1]
        expected_height_mm = round(max(0.0, float(final_realized_s[22])), 4)
        self.assertAlmostEqual(res["target_b_episodes"][0]["goal_progress"], expected_height_mm, places=4)
        self.assertAlmostEqual(res["goal_progress"]["mean"], expected_height_mm, places=4)

        # MiningEvaluator additive unit field also reports height_mm
        me = MiningEvaluator(task="multifinger_lift", eval_horizon=4, seed=42)
        ds = me.evaluate_downstream_manipulation(wm, num_episodes=1, start_seed=6000)
        self.assertEqual(ds["goal_progress_unit"], "height_mm")

    def test_h4_07_task1_metrics_unchanged_by_task2_unit_correction(self):
        """H4-07: Task 1 PegInHole goal_progress ('mm_depth', 15.0 - z_final) remains unaltered."""
        pe = PlannerEvaluator(
            task="peg_in_hole", eval_horizon=5, plan_horizon=2, num_candidates=8, cem_iterations=1, seed=42
        )
        wm = HybridContactStateModel(
            MockContinuousDynamics(15, 6), ContactModeClassifier(15, 6, hidden_dim=16, num_modes=7)
        )
        res = pe.evaluate_policy(wm, num_episodes=1, start_seed=6200, use_safety_filter=True)

        self.assertEqual(res["goal_progress"]["unit"], "mm_depth")
        final_z = float(res["target_b_episodes"][0]["realized_states"][-1][2])
        expected_depth_mm = round(max(0.0, 15.0 - final_z), 4)
        self.assertAlmostEqual(res["target_b_episodes"][0]["goal_progress"], expected_depth_mm, places=4)
        self.assertAlmostEqual(res["goal_progress"]["mean"], expected_depth_mm, places=4)

    def test_h4_08_collision_constrained_wedging_and_wall_contact_velocity(self):
        """
        H4-08: Under two-point wedging (stratum 3) and wall collision (stratum 2), velocity
        tracks the constrained accepted displacement rather than the unconstrained target command.
        """
        dt = 0.02
        env = PegInHoleEnv(dt=dt, clearance=0.50, seed=42)
        env.reset(
            init_pos_offset=np.array([0.0, 0.0], dtype=np.float64),
            init_rot_offset=np.array([0.0, 0.0, 0.0], dtype=np.float64),
        )

        # Drive directly into deep insertion with tilt > critical_wedge_angle (~0.716 deg) & r > clearance
        env.peg_pos = np.array([0.2, 0.0, -10.0], dtype=np.float64)
        env.peg_rot = np.array([2.5, 0.0, 0.0], dtype=np.float64)
        prev_pos = env.peg_pos.copy()

        # Command large radial wall penetration + downward insertion (-3.0 mm)
        action = np.array([1.5, 0.0, -3.0, 0.5, 0.0, 0.0], dtype=np.float64)
        unconstrained_dz = -3.0
        obs_wedge, _, _, info_wedge = env.step(action)

        self.assertEqual(info_wedge["stratum"], 3)  # Wedging
        # Wedging attenuates vertical progress to 0.1 * dz (-0.3 mm instead of -3.0 mm)
        accepted_disp = obs_wedge["pos"] - prev_pos
        self.assertLess(abs(accepted_disp[2]), abs(unconstrained_dz))
        # Velocity matches constrained accepted displacement / dt, NOT unconstrained -3.0 / dt
        np.testing.assert_allclose(obs_wedge["vel"], accepted_disp / dt, atol=1e-6)
        self.assertAlmostEqual(obs_wedge["vel"][2], -0.3 / dt, places=4)


if __name__ == "__main__":
    unittest.main()
