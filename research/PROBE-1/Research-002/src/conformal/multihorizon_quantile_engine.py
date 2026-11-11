"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.2: Multi-Horizon Conformal Calibration Engine
Computes mode-conditioned and horizon-conditioned quantile matrix Q in R^{7 x 5}.
Provides both point-wise marginal horizon coverage and simultaneous trajectory-level coverage.
"""

from __future__ import annotations
import math
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
        if not (0.0 < alpha < 1.0):
            raise ValueError(f"alpha must lie strictly in (0, 1), got {alpha}")
        self.alpha = float(alpha)
        self.target_coverage = round(1.0 - self.alpha, 6)
        self.n_min_marginal = max(1, int(math.ceil(1.0 / self.alpha)) - 1)
        self.min_cell_samples = max(int(min_cell_samples), self.n_min_marginal)
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

        self.fold1_episodes = 0
        self.fold2_episodes = 0
        self.cell_sample_counts = np.zeros((self.num_modes, len(self.horizons)), dtype=np.int64)
        self.cell_fallback_log: Dict[str, Dict[str, Any]] = {}
        self.any_fallback_to_global = False
        self.fold2_calibrated = False
        self.calibrated = False

    def calibrate(self, calibration_trajectories: List[Dict[str, Any]]):
        """
        Calibrates both marginal quantiles Q_{k, h} and simultaneous trajectory inflation lambda_sim.
        Uses two-fold split calibration to prevent overfitting:
          - Fold 1 (50%): Calibrates cell marginal quantiles Q[k, h]
          - Fold 2 (50%): Calibrates simultaneous trajectory inflation factor lambda_sim
        """
        n_total = len(calibration_trajectories)
        self.calibrated = False
        self.fold2_calibrated = False
        if n_total < 2:
            return

        # Two-fold split
        n_fold1 = n_total // 2
        fold1_trajs = calibration_trajectories[:n_fold1]
        fold2_trajs = calibration_trajectories[n_fold1:]
        self.fold1_episodes = len(fold1_trajs)
        self.fold2_episodes = len(fold2_trajs)

        def _exact_marginal_quantile(scores: List[float]) -> Tuple[float, bool]:
            n = len(scores)
            if n < self.n_min_marginal:
                return float("inf"), False
            k_idx = int(math.ceil((n + 1) * (1.0 - self.alpha)))
            if k_idx > n:
                return float("inf"), False
            return float(sorted(scores)[k_idx - 1]), True

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
        global_feasible = [False] * len(self.horizons)
        for h_idx in range(len(self.horizons)):
            q_g, ok_g = _exact_marginal_quantile(global_residuals[h_idx])
            global_feasible[h_idx] = ok_g
            if ok_g:
                self.q_global[h_idx] = q_g

        mode_feasible = [False] * self.num_modes
        for k in range(self.num_modes):
            q_m, ok_m = _exact_marginal_quantile(mode_residuals[k])
            mode_feasible[k] = ok_m
            if ok_m:
                self.q_mode[k] = q_m

        # 3. Compute cell quantiles Q[k, h] on Fold 1 with explicit source & fallback_to_global log
        self.cell_sample_counts.fill(0)
        self.cell_fallback_log = {}
        all_cells_feasible = True

        for k in range(self.num_modes):
            for h_idx, h in enumerate(self.horizons):
                scores = cell_residuals[(k, h_idx)]
                n_cell = len(scores)
                self.cell_sample_counts[k, h_idx] = n_cell
                if n_cell >= self.min_cell_samples:
                    q_cell, ok_cell = _exact_marginal_quantile(scores)
                    if ok_cell and math.isfinite(q_cell):
                        self.Q[k, h_idx] = q_cell
                        source = "empirical_cell"
                        fallback_to_global = False
                    elif global_feasible[h_idx]:
                        self.Q[k, h_idx] = self.q_global[h_idx]
                        source = "global_fallback"
                        fallback_to_global = True
                    else:
                        self.Q[k, h_idx] = float("inf")
                        source = "uncalibrated_insufficient_samples"
                        fallback_to_global = True
                        all_cells_feasible = False
                elif global_feasible[h_idx]:
                    # Fallback to the same forecast horizon (preserves multi-step scaling)
                    self.Q[k, h_idx] = self.q_global[h_idx]
                    source = "global_fallback"
                    fallback_to_global = True
                elif mode_feasible[k]:
                    self.Q[k, h_idx] = self.q_mode[k]
                    source = "mode_fallback"
                    fallback_to_global = True
                else:
                    self.Q[k, h_idx] = float("inf")
                    source = "uncalibrated_insufficient_samples"
                    fallback_to_global = True
                    all_cells_feasible = False

                self.cell_fallback_log[f"mode_{k}_H{h}"] = {
                    "mode": k,
                    "horizon": h,
                    "sample_count": n_cell,
                    "min_cell_samples": self.min_cell_samples,
                    "fallback_to_global": fallback_to_global,
                    "source": source,
                    "finite": bool(math.isfinite(self.Q[k, h_idx])),
                }

        self.any_fallback_to_global = any(
            v["fallback_to_global"] for v in self.cell_fallback_log.values()
        )

        # 4. Calibrate Simultaneous Trajectory Inflation Factor lambda_sim on independent Fold 2!
        if not all_cells_feasible:
            self.lambda_sim = float("inf")
            self.fold2_calibrated = False
            self.calibrated = False
            return

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

        lambda_val, ok_fold2 = _exact_marginal_quantile(max_trajectory_scores)
        if ok_fold2 and math.isfinite(lambda_val):
            self.lambda_sim = lambda_val
            self.fold2_calibrated = True
            self.calibrated = True
        else:
            self.lambda_sim = float("inf")
            self.fold2_calibrated = False
            self.calibrated = False

    def get_calibration_diagnostics(self) -> Dict[str, Any]:
        """Returns Fold-1/Fold-2 sample counts, cell fallback sources, and calibration status."""
        return {
            "alpha": self.alpha,
            "target_coverage": self.target_coverage,
            "n_min_marginal": self.n_min_marginal,
            "min_cell_samples": self.min_cell_samples,
            "fold1_episodes": self.fold1_episodes,
            "fold2_episodes": self.fold2_episodes,
            "calibrated": self.calibrated,
            "fold2_calibrated": self.fold2_calibrated,
            "lambda_sim": round(self.lambda_sim, 4) if math.isfinite(self.lambda_sim) else float("inf"),
            "any_fallback_to_global": self.any_fallback_to_global,
            "cell_sample_counts": self.cell_sample_counts.tolist(),
            "cell_fallback_log": self.cell_fallback_log,
        }

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
