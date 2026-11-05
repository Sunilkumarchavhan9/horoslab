"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.2: Multi-Horizon Conformal Calibration Engine
Computes mode-conditioned and horizon-conditioned quantile matrix Q in R^{7 x 5}.
Provides both point-wise marginal horizon coverage and simultaneous trajectory-level coverage.
"""

from __future__ import annotations
import numpy as np
from typing import Dict, List, Tuple, Any, Optional
from contact_modes.contact_mode_definitions import ContactMode


HORIZONS = [1, 3, 5, 10, 20]
NUM_MODES = 7


class MultiHorizonQuantileEngine:
    """
    Multi-Horizon Conformal Calibration Engine.
    Calibrates prediction set radiuses across discrete contact modes Sigma_k in {0, ..., 6}
    and multi-step autoregressive rollout horizons H in {1, 3, 5, 10, 20}.
    """

    def __init__(self, alpha: float = 0.10, min_cell_samples: int = 15):
        self.alpha = alpha
        self.min_cell_samples = min_cell_samples
        self.horizons = HORIZONS
        self.num_modes = NUM_MODES

        # Quantile matrix Q in R^{7 x 5}
        self.Q = np.ones((self.num_modes, len(self.horizons)), dtype=np.float64) * 2.0
        # Global fallback quantiles per horizon
        self.q_global = np.ones(len(self.horizons), dtype=np.float64) * 2.0
        # Mode-level fallback quantiles
        self.q_mode = np.ones(self.num_modes, dtype=np.float64) * 2.0
        # Trajectory-level simultaneous inflation factor lambda_sim
        self.lambda_sim = 1.0

        self.calibrated = False

    def calibrate(self, calibration_trajectories: List[Dict[str, Any]]):
        """
        Calibrates both marginal quantiles Q_{k, h} and simultaneous trajectory inflation lambda_sim.
        Uses two-fold split calibration to prevent overfitting:
          - Fold 1 (50%): Calibrates cell marginal quantiles Q[k, h]
          - Fold 2 (50%): Calibrates simultaneous trajectory inflation factor lambda_sim
        """
        n_total = len(calibration_trajectories)
        if n_total < 2:
            return

        # Two-fold split
        n_fold1 = n_total // 2
        fold1_trajs = calibration_trajectories[:n_fold1]
        fold2_trajs = calibration_trajectories[n_fold1:]

        # Residual storage: cell_residuals[mode_k][h_idx]
        cell_residuals: Dict[Tuple[int, int], List[float]] = {
            (k, h_idx): [] for k in range(self.num_modes) for h_idx in range(len(self.horizons))
        }
        global_residuals: Dict[int, List[float]] = {h_idx: [] for h_idx in range(len(self.horizons))}
        mode_residuals: Dict[int, List[float]] = {k: [] for k in range(self.num_modes)}

        # 1. Collect residuals across Fold 1
        for traj in fold1_trajs:
            true_states = traj["true_states"]
            pred_states = traj["pred_states"]
            pred_modes = traj["pred_modes"]
            t_max = len(true_states)

            for h_idx, h in enumerate(self.horizons):
                if h < t_max:
                    res = float(np.linalg.norm(true_states[h] - pred_states[h]))
                    k = int(pred_modes[h])
                    cell_residuals[(k, h_idx)].append(res)
                    global_residuals[h_idx].append(res)
                    mode_residuals[k].append(res)

        # 2. Compute global and mode-level fallbacks on Fold 1
        for h_idx in range(len(self.horizons)):
            g_scores = global_residuals[h_idx]
            if len(g_scores) > 0:
                n = len(g_scores)
                q_level = min(1.0, np.ceil((n + 1) * (1.0 - self.alpha)) / n)
                self.q_global[h_idx] = float(np.quantile(g_scores, q_level))

        for k in range(self.num_modes):
            m_scores = mode_residuals[k]
            if len(m_scores) > 0:
                n = len(m_scores)
                q_level = min(1.0, np.ceil((n + 1) * (1.0 - self.alpha)) / n)
                self.q_mode[k] = float(np.quantile(m_scores, q_level))

        # 3. Compute cell quantiles Q[k, h] on Fold 1
        # Fallback priority: cell (mode, h) -> global (same horizon h) -> global max
        for k in range(self.num_modes):
            for h_idx, h in enumerate(self.horizons):
                scores = cell_residuals[(k, h_idx)]
                if len(scores) >= self.min_cell_samples:
                    n = len(scores)
                    q_level = min(1.0, np.ceil((n + 1) * (1.0 - self.alpha)) / n)
                    self.Q[k, h_idx] = float(np.quantile(scores, q_level))
                elif len(global_residuals[h_idx]) >= 5:
                    # Fallback to the same forecast horizon (preserves multi-step scaling)
                    self.Q[k, h_idx] = self.q_global[h_idx]
                else:
                    self.Q[k, h_idx] = self.q_mode[k]

        # 4. Calibrate Simultaneous Trajectory Inflation Factor lambda_sim on independent Fold 2!
        max_trajectory_scores = []
        for traj in fold2_trajs:
            true_states = traj["true_states"]
            pred_states = traj["pred_states"]
            pred_modes = traj["pred_modes"]
            t_max = len(true_states)

            studentized_scores = []
            for h_idx, h in enumerate(self.horizons):
                if h < t_max:
                    res = float(np.linalg.norm(true_states[h] - pred_states[h]))
                    k = int(pred_modes[h])
                    marginal_radius = self.Q[k, h_idx]
                    studentized_scores.append(res / (marginal_radius + 1e-6))

            if len(studentized_scores) > 0:
                max_trajectory_scores.append(float(np.max(studentized_scores)))

        if len(max_trajectory_scores) > 0:
            n_traj = len(max_trajectory_scores)
            q_level = min(1.0, np.ceil((n_traj + 1) * (1.0 - self.alpha)) / n_traj)
            self.lambda_sim = float(np.quantile(max_trajectory_scores, q_level))

        self.calibrated = True

    def get_marginal_radius(self, mode: int, horizon: int) -> float:
        """Returns marginal conformal radius for given mode and horizon step."""
        if horizon not in self.horizons:
            # Nearest horizon
            h_idx = int(np.argmin([abs(h - horizon) for h in self.horizons]))
        else:
            h_idx = self.horizons.index(horizon)

        k = int(np.clip(mode, 0, self.num_modes - 1))
        return float(self.Q[k, h_idx])

    def get_simultaneous_radius(self, mode: int, horizon: int) -> float:
        """Returns inflated simultaneous conformal radius guaranteeing trajectory-wide coverage."""
        marginal_r = self.get_marginal_radius(mode, horizon)
        return float(self.lambda_sim * marginal_r)

    def evaluate_coverage(self, test_trajectories: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Evaluates marginal horizon coverage and simultaneous trajectory coverage on held-out test data.
        """
        marginal_covered = {h: 0 for h in self.horizons}
        marginal_total = {h: 0 for h in self.horizons}

        simultaneous_covered_trajectories = 0
        total_trajectories = 0

        for traj in test_trajectories:
            true_states = traj["true_states"]
            pred_states = traj["pred_states"]
            pred_modes = traj["pred_modes"]
            t_max = len(true_states)

            all_horizons_covered = True
            evaluated_at_least_one = False

            for h_idx, h in enumerate(self.horizons):
                if h < t_max:
                    evaluated_at_least_one = True
                    res = float(np.linalg.norm(true_states[h] - pred_states[h]))
                    k = int(pred_modes[h])

                    # 1. Marginal check
                    r_marg = self.get_marginal_radius(k, h)
                    if res <= r_marg:
                        marginal_covered[h] += 1
                    marginal_total[h] += 1

                    # 2. Simultaneous check
                    r_sim = self.get_simultaneous_radius(k, h)
                    if res > r_sim:
                        all_horizons_covered = False

            if evaluated_at_least_one:
                total_trajectories += 1
                if all_horizons_covered:
                    simultaneous_covered_trajectories += 1

        marginal_coverage_rates = {
            h: round(marginal_covered[h] / max(1, marginal_total[h]), 3)
            for h in self.horizons
        }
        simultaneous_rate = round(simultaneous_covered_trajectories / max(1, total_trajectories), 3)

        return {
            "marginal_coverage_per_horizon": marginal_coverage_rates,
            "simultaneous_trajectory_coverage": simultaneous_rate,
            "lambda_sim_inflation": round(self.lambda_sim, 3),
            "target_coverage": 1.0 - self.alpha,
        }
