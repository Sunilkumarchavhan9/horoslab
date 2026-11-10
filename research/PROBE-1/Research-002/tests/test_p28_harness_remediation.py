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

Author: Sunil Kumar Chavhan (sunil@horoslab.org)
Organization: HOROS Physical Intelligence Research Group (H.R.)
"""

from __future__ import annotations
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
from src.selection_aware.counterfactual_rollout import extract_env_state_and_wrench
from src.mining.mining_evaluator import MiningEvaluator
from src.planners.recovery_aware_cem import RecoveryAwareCEMPlanner


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


if __name__ == "__main__":
    unittest.main()
