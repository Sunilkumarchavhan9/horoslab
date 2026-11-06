"""
Unit Tests for Stage P2.4: Active Contact-Mode Mining (ACMM)
Tests:
1. Multi-objective Acquisition Scorer (U_mode, U_disag, U_bound, U_opt, U_rec, normalization, ranking).
2. Episode Deduplicator (distance metrics, diversity filtering, budget enforcement).
3. Contact Boundary Sampler (Task 1 wedging/insertion, Task 2 coordinated lift/friction sweep).
4. Trajectory Selector (end-to-end mining pipeline).
"""

import sys
import os
import unittest
import numpy as np

current_dir = os.path.dirname(os.path.abspath(__file__))
r002_root = os.path.abspath(os.path.join(current_dir, ".."))
sys.path.insert(0, r002_root)
sys.path.insert(0, os.path.join(r002_root, "src"))

from src.mining.acquisition_scorer import AcquisitionScorer
from src.mining.episode_deduplicator import EpisodeDeduplicator
from src.mining.contact_boundary_sampler import ContactBoundarySampler
from src.mining.trajectory_selector import TrajectorySelector
from src.environment.peg_in_hole_env import PegInHoleEnv
from src.environment.multifinger_lift_env import MultifingerLiftEnv


class TestActiveContactMining(unittest.TestCase):

    def setUp(self):
        np.random.seed(42)

    def test_acquisition_scorer_signals(self):
        scorer = AcquisitionScorer()

        # 1. Mode uncertainty (entropy)
        probs_uniform = np.ones((5, 7)) / 7.0
        entropy_uniform = scorer.compute_mode_uncertainty(probs_uniform)
        self.assertAlmostEqual(entropy_uniform, np.log(7.0), places=3)

        probs_certain = np.zeros((5, 7))
        probs_certain[:, 0] = 1.0
        entropy_certain = scorer.compute_mode_uncertainty(probs_certain)
        self.assertAlmostEqual(entropy_certain, 0.0, places=3)

        # 2. Prediction disagreement
        pred1 = np.zeros((5, 15))
        pred2 = np.ones((5, 15))
        disag = scorer.compute_prediction_disagreement([pred1, pred2])
        self.assertGreater(disag, 0.0)

        # 3. Planner optimism
        opt_val = scorer.compute_planner_optimism(opt_return=100.0, realized_return=40.0)
        self.assertEqual(opt_val, 60.0)
        opt_neg = scorer.compute_planner_optimism(opt_return=40.0, realized_return=100.0)
        self.assertEqual(opt_neg, 0.0)

        # 4. Recovery value
        modes = np.array([3, 2, 2, 3, 4])  # Task 1: 3->2 and 3->4 recoveries
        rec_val = scorer.compute_recovery_value(modes, success=True, task="peg_in_hole")
        self.assertGreaterEqual(rec_val, 5.0)  # 2 events + 3 bonus

    def test_acquisition_ranking_deterministic(self):
        scorer = AcquisitionScorer()
        candidates = [
            {"candidate_id": 0, "opt_return": 10.0, "realized_return": 10.0, "realized_modes": np.array([0, 0])},
            {"candidate_id": 1, "opt_return": 100.0, "realized_return": 10.0, "realized_modes": np.array([3, 2]), "success": True},
            {"candidate_id": 2, "opt_return": 50.0, "realized_return": 20.0, "realized_modes": np.array([1, 2])},
        ]

        ranked = scorer.rank_trajectories(candidates, task="peg_in_hole")
        self.assertEqual(len(ranked), 3)
        # Candidate 1 has massive optimism (90) and recovery (success + transition), should rank #1
        self.assertEqual(ranked[0]["candidate_id"], 1)
        self.assertEqual(ranked[0]["acquisition_rank"], 1)

    def test_episode_deduplicator(self):
        dedup = EpisodeDeduplicator(d_min=0.20)
        traj_a = {
            "realized_states": np.zeros((10, 5)),
            "realized_modes": np.zeros(10)
        }
        # Identical trajectory
        traj_b = {
            "realized_states": np.zeros((10, 5)),
            "realized_modes": np.zeros(10)
        }
        # Distant trajectory
        traj_c = {
            "realized_states": np.ones((10, 5)) * 10.0,
            "realized_modes": np.ones(10) * 3
        }

        dist_ab = dedup.compute_trajectory_distance(traj_a, traj_b)
        self.assertAlmostEqual(dist_ab, 0.0, places=4)

        dist_ac = dedup.compute_trajectory_distance(traj_a, traj_c)
        self.assertGreater(dist_ac, 0.20)

        admitted, rejected = dedup.filter_and_select([traj_a, traj_b, traj_c], budget=2)
        self.assertEqual(len(admitted), 2)
        self.assertEqual(len(rejected), 1)

    def test_contact_boundary_sampler_task1(self):
        sampler = ContactBoundarySampler(task="peg_in_hole", seed=42)
        env = PegInHoleEnv(seed=42)
        traj = sampler.sample_task1_boundary_trajectory(env, horizon=15, exploration_mode="insertion")
        self.assertEqual(len(traj["realized_states"]), 15)
        self.assertEqual(len(traj["realized_modes"]), 15)
        self.assertIn("realized_return", traj)

    def test_contact_boundary_sampler_task2(self):
        sampler = ContactBoundarySampler(task="multifinger_lift", seed=84)
        env = MultifingerLiftEnv(seed=84)
        traj = sampler.sample_task2_boundary_trajectory(env, horizon=15, exploration_mode="coordinated")
        self.assertEqual(len(traj["realized_states"]), 15)
        self.assertEqual(len(traj["realized_modes"]), 15)
        self.assertIn("realized_return", traj)

    def test_trajectory_selector_pipeline(self):
        selector = TrajectorySelector(task="peg_in_hole", budget=5, seed=123)
        res = selector.mine_trajectories(strategy="D4_acmm", num_candidates=10, horizon=10)
        self.assertIn("admitted_trajectories", res)
        self.assertLessEqual(len(res["admitted_trajectories"]), 5)
        self.assertIn("unique_contact_modes", res)


if __name__ == "__main__":
    unittest.main()
