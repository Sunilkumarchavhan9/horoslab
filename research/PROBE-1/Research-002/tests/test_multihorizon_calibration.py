"""
HOROS PROBE-1 — Research-002: Unit & Integration Test Suite
Stage P2.2: Multi-Horizon Conformal Calibration Engine
Tests quantile tensor matrix shape, marginal coverage, simultaneous trajectory coverage, and hierarchical fallbacks.
"""

import sys
import os
import unittest
import numpy as np

current_dir = os.path.dirname(os.path.abspath(__file__))
r002_src = os.path.join(os.path.dirname(current_dir), "src")
sys.path.insert(0, r002_src)

from conformal import MultiHorizonQuantileEngine, HORIZONS, NUM_MODES


class TestMultiHorizonCalibration(unittest.TestCase):

    def setUp(self):
        np.random.seed(42)

    def _generate_synthetic_trajectories(self, num_trajectories: int = 150, traj_len: int = 25):
        """Generates synthetic trajectories with randomized contact modes and horizon-compounding errors."""
        trajectories = []
        for i in range(num_trajectories):
            true_states = np.zeros((traj_len, 15), dtype=np.float64)
            pred_states = np.zeros((traj_len, 15), dtype=np.float64)
            true_modes = np.zeros(traj_len, dtype=np.int64)
            pred_modes = np.zeros(traj_len, dtype=np.int64)

            # Random starting mode with Markovian transitions
            curr_mode = np.random.choice(7)

            for t in range(traj_len):
                if np.random.rand() < 0.25:
                    curr_mode = np.random.choice(7)

                true_modes[t] = curr_mode
                pred_modes[t] = curr_mode

                # Horizon compounding error: error scale increases strictly with horizon t
                mode_scale = 1.8 if curr_mode in [4, 5] else 1.0
                error_scale = 0.05 + 0.15 * np.sqrt(t + 1) * mode_scale

                error = np.random.normal(0, error_scale, size=15)
                pred_states[t] = true_states[t] + error

            trajectories.append({
                "true_states": true_states,
                "pred_states": pred_states,
                "true_modes": true_modes,
                "pred_modes": pred_modes,
            })
        return trajectories

    def test_01_quantile_tensor_dimensions(self):
        """Verifies that quantile matrix Q has shape [7, 5]."""
        engine = MultiHorizonQuantileEngine(alpha=0.10)
        self.assertEqual(engine.Q.shape, (7, 5))
        self.assertEqual(len(engine.horizons), 5)
        self.assertEqual(engine.horizons, [1, 3, 5, 10, 20])

    def test_02_calibration_and_marginal_coverage(self):
        """Verifies that marginal coverage meets >= 1 - alpha on held-out test trajectories."""
        calib_data = self._generate_synthetic_trajectories(num_trajectories=150)
        test_data = self._generate_synthetic_trajectories(num_trajectories=150)

        engine = MultiHorizonQuantileEngine(alpha=0.10, min_cell_samples=10)
        engine.calibrate(calib_data)

        self.assertTrue(engine.calibrated)
        # Quantiles should grow monotonically with horizon for the same mode
        for k in range(NUM_MODES):
            self.assertGreater(engine.Q[k, 4], engine.Q[k, 0])  # H=20 quantile > H=1 quantile

        # Evaluate coverage on test set
        res = engine.evaluate_coverage(test_data)
        marginal_rates = res["marginal_coverage_per_horizon"]

        for h, rate in marginal_rates.items():
            # Should be close to target 90% (>= 85% with statistical tolerance)
            self.assertGreaterEqual(rate, 0.85, f"Horizon {h} coverage {rate} below 0.85")

    def test_03_simultaneous_trajectory_coverage(self):
        """Verifies that simultaneous trajectory coverage achieves >= 1 - alpha."""
        calib_data = self._generate_synthetic_trajectories(num_trajectories=200)
        test_data = self._generate_synthetic_trajectories(num_trajectories=200)

        engine = MultiHorizonQuantileEngine(alpha=0.10, min_cell_samples=10)
        engine.calibrate(calib_data)

        # Simultaneous inflation lambda_sim must be >= 1.0 to account for multi-horizon union bound
        self.assertGreaterEqual(engine.lambda_sim, 1.0)

        res = engine.evaluate_coverage(test_data)
        sim_rate = res["simultaneous_trajectory_coverage"]

        # Simultaneous coverage must achieve >= 1 - alpha (with empirical tolerance)
        self.assertGreaterEqual(sim_rate, 0.86, f"Simultaneous coverage {sim_rate} below target")

    def test_04_hierarchical_pooling_fallback(self):
        """Verifies fallback when specific mode-horizon cells have zero or sparse samples."""
        engine = MultiHorizonQuantileEngine(alpha=0.10, min_cell_samples=25)

        # Small dataset with only mode 0
        small_calib = []
        for i in range(30):
            true_states = np.zeros((25, 15))
            pred_states = true_states + np.random.normal(0, 0.5, size=(25, 15))
            # Only Mode 0 present
            small_calib.append({
                "true_states": true_states,
                "pred_states": pred_states,
                "true_modes": np.zeros(25, dtype=int),
                "pred_modes": np.zeros(25, dtype=int),
            })

        engine.calibrate(small_calib)
        self.assertTrue(engine.calibrated)
        # Sparse modes should have received fallback values, not NaN or crash
        for k in range(NUM_MODES):
            for h_idx in range(5):
                self.assertFalse(np.isnan(engine.Q[k, h_idx]))
                self.assertGreater(engine.Q[k, h_idx], 0.0)


if __name__ == "__main__":
    unittest.main()
