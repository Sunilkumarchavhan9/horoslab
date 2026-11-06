"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Unit Tests for Stage P2.5 Five-Way Integrated Evaluation
"""

import sys
import os
import unittest
import numpy as np
import torch

current_dir = os.path.dirname(os.path.abspath(__file__))
r002_root = os.path.abspath(os.path.join(current_dir, ".."))
sys.path.insert(0, r002_root)
sys.path.insert(0, os.path.join(r002_root, "src"))

from src.integrated.statistical_analysis import (
    compute_wilson_ci,
    format_count_pct,
    compute_multihorizon_rmses,
    compute_mode_confusion_and_f1,
    compute_peg_statistics,
    to_json_serializable,
)
from src.integrated.model_training_runner import ModelTrainingRunner
from src.integrated.calibration_runner import CalibrationRunner
from src.integrated.safety_evaluator import SafetyEvaluator
from src.integrated.planner_evaluator import PlannerEvaluator


class TestIntegratedEvaluation(unittest.TestCase):

    def test_statistical_analysis_wilson_ci(self):
        # 0 successes out of 30
        low0, high0 = compute_wilson_ci(0, 30, confidence=0.95)
        self.assertEqual(low0, 0.0)
        self.assertAlmostEqual(high0, 0.1135, places=3)

        # 16 successes out of 30
        low16, high16 = compute_wilson_ci(16, 30, confidence=0.95)
        self.assertGreater(low16, 0.35)
        self.assertLess(high16, 0.72)

        # 30 successes out of 30
        low30, high30 = compute_wilson_ci(30, 30, confidence=0.95)
        self.assertGreater(low30, 0.88)
        self.assertAlmostEqual(high30, 1.0, places=4)

    def test_statistical_analysis_format_count_pct(self):
        res = format_count_pct(16, 30)
        self.assertEqual(res["count"], 16)
        self.assertEqual(res["total"], 30)
        self.assertEqual(res["formatted"], "16/30 (53.33%)")
        self.assertIn("ci_95", res)

    def test_mode_confusion_and_f1(self):
        y_true = np.array([0, 1, 2, 3, 4, 5, 6, 0, 1, 2])
        y_pred = np.array([0, 1, 2, 3, 4, 5, 6, 0, 1, 1])
        res = compute_mode_confusion_and_f1(y_true, y_pred)
        self.assertIn("macro_f1", res)
        self.assertGreater(res["macro_f1"], 0.8)
        self.assertEqual(len(res["per_mode_metrics"]), 7)

    def test_peg_statistics(self):
        pred_rewards = np.array([10.0, 12.0, 8.0, 15.0])
        real_rewards = np.array([8.0, 7.0, 9.0, 10.0])
        stats = compute_peg_statistics(pred_rewards, real_rewards)
        self.assertAlmostEqual(stats["mean_peg"], 3.0, places=2)
        self.assertIn("terciles", stats)
        self.assertEqual(stats["terciles"]["total_samples"], 4)

    def test_safety_evaluator_violations_and_taxonomy(self):
        evaluator = SafetyEvaluator(task="peg_in_hole", max_normal_force=35.0, max_torque=7.0)

        # Safe observation
        safe_obs = {"wrench": np.array([10.0, 5.0, -15.0, 1.0, 0.5, 0.0])}
        is_viol, vtype = evaluator.check_safety_violation(safe_obs)
        self.assertFalse(is_viol)

        # Unsafe observation (excessive force)
        unsafe_obs = {"wrench": np.array([30.0, 20.0, -25.0, 1.0, 0.5, 0.0])}
        is_viol, vtype = evaluator.check_safety_violation(unsafe_obs)
        self.assertTrue(is_viol)
        self.assertEqual(vtype, "force_limit_exceeded")

        # Failure mode classification: dynamic_crush
        f_mode = evaluator.classify_failure_mode(
            is_success=False,
            env_state={"safety_violated": True},
            interventions_in_episode=0,
            total_steps=10,
            eval_horizon=25,
        )
        self.assertEqual(f_mode, "dynamic_crush")

        # Failure mode classification: jamming_wedging
        f_mode_jam = evaluator.classify_failure_mode(
            is_success=False,
            env_state={"jammed": True, "safety_violated": False},
            interventions_in_episode=0,
            total_steps=10,
            eval_horizon=25,
        )
        self.assertEqual(f_mode_jam, "jamming_wedging")

        # Failure mode classification: temporal_truncation
        f_mode_trunc = evaluator.classify_failure_mode(
            is_success=False,
            env_state={"jammed": False, "safety_violated": False, "stalled": False},
            interventions_in_episode=1,
            total_steps=25,
            eval_horizon=25,
        )
        self.assertEqual(f_mode_trunc, "temporal_truncation")

    def test_model_training_runner_and_calibration(self):
        # Quick synthetic test transitions
        state_dim = 15
        action_dim = 6
        n_samples = 40

        np.random.seed(42)
        transitions = []
        for _ in range(n_samples):
            s = np.random.randn(state_dim).astype(np.float32)
            a = np.random.randn(action_dim).astype(np.float32)
            s_next = s + 0.1 * np.random.randn(state_dim).astype(np.float32)
            m = np.random.randint(0, 7)
            transitions.append((s, a, s_next, m))

        runner = ModelTrainingRunner(task="peg_in_hole", seed=42)
        model = runner.train_hybrid_model(transitions, epochs=5, lr=5e-3)
        self.assertIsNotNone(model)

        # Test prediction shape
        s_test = np.random.randn(state_dim).astype(np.float32)
        a_test = np.random.randn(action_dim).astype(np.float32)
        pred_dict = model.predict_step(s_test, a_test)
        s_pred = pred_dict["next_state"]
        m_pred = pred_dict["predicted_mode"]
        self.assertEqual(len(s_pred), state_dim)
        self.assertIn(m_pred, list(range(7)))

        # Quick calibration runner test
        calib_runner = CalibrationRunner(alpha=0.10, seed=42)
        mock_episodes = [
            {
                "decisions": [
                    {
                        "realized_states": np.random.randn(10, state_dim),
                        "pred_states": np.random.randn(10, state_dim),
                        "realized_wrenches": np.random.randn(10, 6),
                        "pred_wrenches": np.random.randn(10, 6),
                        "stratum": i % 7,
                    }
                ]
            }
            for i in range(10)
        ]

        unstrat = calib_runner.calibrate_unstratified_baseline(mock_episodes)
        self.assertIn("q_state_unstratified", unstrat)
        self.assertIn("state_interval_width", unstrat)


if __name__ == "__main__":
    unittest.main()
