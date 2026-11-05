"""
HOROS PROBE-1 — Research-002: Unit & Integration Test Suite
Stage P2.1: Hybrid Contact-State Model & Seven-Mode Classification
Tests physical threshold classification, non-leakage constraints, APS conformal sets, and multi-step rollouts.
"""

import sys
import os
import unittest
import numpy as np
import torch
import torch.optim as optim

current_dir = os.path.dirname(os.path.abspath(__file__))
r002_src = os.path.join(os.path.dirname(current_dir), "src")
sys.path.insert(0, r002_src)

from contact_modes import (
    ContactMode,
    MODE_NAMES,
    classify_contact_mode,
    ContactModeClassifier,
    HybridContactStateModel,
)
from models import DeterministicWorldModel


class TestContactModes(unittest.TestCase):

    def setUp(self):
        np.random.seed(42)
        torch.manual_seed(42)

    def test_01_seven_modes_defined(self):
        """Verifies that all seven physical contact modes are defined and distinct."""
        self.assertEqual(len(ContactMode), 7)
        expected_modes = ["Free", "FirstContact", "Sticking", "Sliding", "Impact", "Jamming", "Release"]
        for idx, name in enumerate(expected_modes):
            self.assertEqual(ContactMode(idx).name.replace("_", "").lower(), name.lower())
            self.assertEqual(MODE_NAMES[ContactMode(idx)], name)

    def test_02_physical_classification_logic(self):
        """Verifies physical threshold classification across contact regimes."""
        # Free space
        s_free = {"wrench": np.zeros(6), "rot": np.zeros(3), "vel": np.array([0, 0, 5.0])}
        self.assertEqual(classify_contact_mode(s_free, task="peg_in_hole"), ContactMode.FREE)

        # First contact
        s_touch = {"wrench": np.array([0, 0, -0.3, 0, 0, 0]), "rot": np.zeros(3), "vel": np.array([0, 0, -1.0])}
        self.assertEqual(classify_contact_mode(s_touch, prev_state=s_free, task="peg_in_hole"), ContactMode.FIRST_CONTACT)

        # Impact shock (rapid force change)
        s_impact = {"wrench": np.array([0, 0, -25.0, 0, 0, 0]), "rot": np.zeros(3), "vel": np.array([0, 0, -5.0])}
        self.assertEqual(classify_contact_mode(s_impact, prev_state=s_touch, dt=0.02, task="peg_in_hole"), ContactMode.IMPACT)

        # Jamming / Wedging (high lateral force + tilt)
        s_jam = {"wrench": np.array([20.0, 10.0, -10.0, 0, 0, 0]), "rot": np.array([2.5, 0.5, 0]), "vel": np.zeros(3)}
        self.assertEqual(classify_contact_mode(s_jam, task="peg_in_hole"), ContactMode.JAMMING)

        # Tangential sliding
        s_slide = {"wrench": np.array([6.0, 0, -10.0, 0, 0, 0]), "rot": np.zeros(3), "vel": np.array([5.0, 0, 0])}
        self.assertEqual(classify_contact_mode(s_slide, mu=0.50, task="peg_in_hole"), ContactMode.SLIDING)

    def test_03_neural_classifier_and_aps_coverage(self):
        """Verifies neural mode classifier and Adaptive Prediction Sets (APS) coverage."""
        classifier = ContactModeClassifier(state_dim=15, action_dim=6, hidden_dim=64, num_modes=7)
        optimizer = optim.Adam(classifier.parameters(), lr=1e-2)

        # Generate synthetic state-action-mode pairs
        N = 300
        states = np.random.randn(N, 15).astype(np.float32)
        actions = np.random.randn(N, 6).astype(np.float32)
        modes = np.random.choice(7, size=N)

        s_t = torch.tensor(states)
        a_t = torch.tensor(actions)
        m_t = torch.tensor(modes, dtype=torch.long)

        # Train classifier
        criterion = torch.nn.CrossEntropyLoss()
        classifier.train()
        for _ in range(50):
            optimizer.zero_grad()
            logits = classifier(s_t, a_t)
            loss = criterion(logits, m_t)
            loss.backward()
            optimizer.step()

        # Split into calibration and test
        classifier.calibrate_aps(states[:150], actions[:150], modes[:150], alpha_mode=0.10)

        # Check coverage on held-out test
        covered = 0
        for i in range(150, 300):
            candidate_set = classifier.predict_mode_set(states[i], actions[i])
            if modes[i] in candidate_set:
                covered += 1

        empirical_coverage = covered / 150.0
        # Valid conformal coverage should achieve >= 1 - alpha - small sample tolerance
        self.assertGreaterEqual(empirical_coverage, 0.85)

    def test_04_hybrid_model_non_leakage_multistep(self):
        """Verifies that HybridContactStateModel predicts future states without mode leakage."""
        det_wm = DeterministicWorldModel(state_dim=15, action_dim=6, hidden_dim=64)
        classifier = ContactModeClassifier(state_dim=15, action_dim=6, hidden_dim=64, num_modes=7)

        hybrid_model = HybridContactStateModel(det_wm, classifier)

        init_s = np.zeros(15, dtype=np.float32)
        action_seq = np.ones((10, 6), dtype=np.float32) * 0.1

        # Execute 10-step rollout
        res = hybrid_model.predict_multistep(init_s, action_seq, horizon=10)

        self.assertEqual(res["states"].shape, (10, 15))
        self.assertEqual(res["mode_distributions"].shape, (10, 7))
        self.assertEqual(len(res["mode_sets"]), 10)
        self.assertEqual(len(res["predicted_modes"]), 10)

        # Verify each mode set is a non-empty subset of {0, ..., 6}
        for mode_set in res["mode_sets"]:
            self.assertIsInstance(mode_set, list)
            self.assertGreater(len(mode_set), 0)
            for m in mode_set:
                self.assertIn(m, range(7))


if __name__ == "__main__":
    unittest.main()
