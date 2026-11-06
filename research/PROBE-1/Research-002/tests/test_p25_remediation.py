"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Unit Tests for Stage P2.5 Remediation
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

from src.safety.pcbf_tuned_filter import TunedSmoothPCBFFilter
from src.planners.recovery_aware_cem import RecoveryAwareCEMPlanner
from src.models.deterministic_wm import DeterministicWorldModel
from src.contact_modes.contact_mode_classifier import ContactModeClassifier
from src.contact_modes.hybrid_contact_state_model import HybridContactStateModel


class TestP25Remediation(unittest.TestCase):

    def test_tuned_smooth_pcbf_filter_slip_damping(self):
        f = TunedSmoothPCBFFilter(task="multifinger_lift")

        # 1. Benign slip (0.50): no intervention, damping factor 1.0
        state_benign = {
            "finger_fn": np.array([5.0, 5.0, 5.0, 5.0]),
            "slip_ratio": np.array([0.5, 0.5, 0.5, 0.5]),
        }
        cand = np.array([0.1, 0.1, 0.1, 0.1, 2.0])
        cert, interv, info = f.filter_action(state_benign, cand)
        self.assertFalse(interv)
        self.assertAlmostEqual(info["damping_factor"], 1.0)
        self.assertAlmostEqual(cert[4], 2.0)

        # 2. Intermediate slip (0.85): proportional damping factor (0.95 - 0.85)/0.20 = 0.50
        state_mid = {
            "finger_fn": np.array([5.0, 5.0, 5.0, 5.0]),
            "slip_ratio": np.array([0.85, 0.70, 0.60, 0.50]),
        }
        cert_mid, interv_mid, info_mid = f.filter_action(state_mid, cand)
        self.assertTrue(interv_mid)
        self.assertAlmostEqual(info_mid["damping_factor"], 0.50, places=3)
        self.assertAlmostEqual(cert_mid[4], 1.0, places=3)
        self.assertGreater(cert_mid[0], 0.05)  # Preload boosted

        # 3. Critical slip (0.98): hard zero-clamp
        state_crit = {
            "finger_fn": np.array([5.0, 5.0, 5.0, 5.0]),
            "slip_ratio": np.array([0.98, 0.70, 0.60, 0.50]),
        }
        cert_crit, interv_crit, info_crit = f.filter_action(state_crit, cand)
        self.assertTrue(interv_crit)
        self.assertAlmostEqual(info_crit["damping_factor"], 0.0)
        self.assertAlmostEqual(cert_crit[4], 0.0)

    def test_tuned_smooth_pcbf_streak_tracking(self):
        f = TunedSmoothPCBFFilter(task="multifinger_lift")
        state_slip = {
            "finger_fn": np.array([5.0, 5.0, 5.0, 5.0]),
            "slip_ratio": np.array([0.88, 0.5, 0.5, 0.5]),
        }
        cand = np.array([0.1, 0.1, 0.1, 0.1, 2.0])

        f.filter_action(state_slip, cand)
        _, _, info2 = f.filter_action(state_slip, cand)
        self.assertEqual(info2["current_streak"], 2)
        self.assertEqual(info2["max_streak"], 2)

        # Reset episode
        f.reset_episode()
        self.assertEqual(f.current_streak, 0)
        self.assertEqual(f.max_streak, 2)  # max streak preserved

    def test_recovery_aware_cem_planner(self):
        state_dim = 23
        action_dim = 5
        action_bounds = (np.array([-1.0]*5), np.array([1.0]*5))

        det_wm = DeterministicWorldModel(state_dim, action_dim, hidden_dim=32)
        mode_clf = ContactModeClassifier(state_dim, action_dim, hidden_dim=32, num_modes=7)
        hybrid_wm = HybridContactStateModel(det_wm, mode_clf)

        planner = RecoveryAwareCEMPlanner(
            world_model=hybrid_wm,
            action_dim=action_dim,
            action_bounds=action_bounds,
            horizon=5,
            num_samples=20,
            num_iterations=2,
        )

        s_init = np.zeros(state_dim, dtype=np.float32)
        def reward_fn(s, a):
            return float(s[20] * 10.0)

        action, info = planner.plan(s_init, reward_fn)
        self.assertEqual(len(action), action_dim)
        self.assertIn("best_trajectory", info)
        self.assertEqual(info["best_trajectory"].shape, (5, action_dim))


if __name__ == "__main__":
    unittest.main()

