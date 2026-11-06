"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.4 — Active Contact-Mode Mining: Acquisition Scorer

Computes multi-objective acquisition signals for candidate physical trajectories:
1. Contact-Mode Classification Entropy (U_mode)
2. Epistemic Prediction Disagreement (U_disagreement)
3. Physical Contact-Boundary Proximity (U_boundary)
4. Planner Optimism / Exploitation Severity (U_optimism)
5. Dynamic Failure & Recovery Value (U_recovery)

Normalizes signals across candidate batches, applies configurable weights,
and provides deterministic, reproducible trajectory ranking.
"""

from __future__ import annotations
import math
from typing import Dict, Any, List, Optional, Tuple
import numpy as np


class AcquisitionScorer:
    """
    Multi-objective trajectory acquisition scorer for Active Contact-Mode Mining.
    """

    DEFAULT_WEIGHTS = {
        "mode_uncertainty": 0.20,
        "prediction_disagreement": 0.20,
        "contact_boundary": 0.20,
        "planner_optimism": 0.20,
        "recovery_value": 0.20,
    }

    def __init__(
        self,
        weights: Optional[Dict[str, float]] = None,
        mu: float = 0.50,
        sigma_friction: float = 2.0,
        sigma_wedge: float = 0.50,
        clearance: float = 0.50,
        peg_length: float = 80.0,
    ):
        self.weights = self._normalize_weights(weights or self.DEFAULT_WEIGHTS)
        self.mu = mu
        self.sigma_friction = sigma_friction
        self.sigma_wedge = sigma_wedge
        self.clearance = clearance
        self.peg_length = peg_length
        self.theta_crit = math.degrees(math.atan2(2.0 * clearance, peg_length))

    @staticmethod
    def _normalize_weights(w_dict: Dict[str, float]) -> Dict[str, float]:
        total = sum(w_dict.values())
        if total <= 0:
            raise ValueError("Sum of acquisition weights must be strictly positive.")
        return {k: float(v / total) for k, v in w_dict.items()}

    def compute_mode_uncertainty(self, pred_mode_probs: np.ndarray) -> float:
        """
        Computes Shannon entropy across the 7 contact mode probabilities over the trajectory horizon:
        U_mode = - (1/H) sum_{t=0}^{H-1} sum_{k=1}^7 p_k * ln(p_k + 1e-12)
        """
        if pred_mode_probs is None or len(pred_mode_probs) == 0:
            return 0.0
        probs = np.clip(pred_mode_probs, 1e-12, 1.0)
        # Normalize rows just in case
        probs = probs / np.sum(probs, axis=-1, keepdims=True)
        entropy_per_step = -np.sum(probs * np.log(probs), axis=-1)
        return float(np.mean(entropy_per_step))

    def compute_prediction_disagreement(self, ensemble_predictions: List[np.ndarray]) -> float:
        """
        Computes epistemic variance across M ensemble predictions:
        U_disag = (1/H) sum_{t=0}^{H-1} (1/M) sum_{m=1}^M || s_hat^(m)_t - s_bar_t ||_2^2
        """
        if ensemble_predictions is None or len(ensemble_predictions) < 2:
            return 0.0
        # Stack to [M, H, state_dim]
        stack = np.array(ensemble_predictions, dtype=np.float32)
        mean_pred = np.mean(stack, axis=0)  # [H, state_dim]
        var_per_step = np.mean(np.sum((stack - mean_pred) ** 2, axis=-1), axis=0)  # [H]
        return float(np.mean(var_per_step))

    def compute_contact_boundary_proximity(
        self,
        realized_wrenches: np.ndarray,
        realized_states: Optional[np.ndarray] = None,
        task: str = "peg_in_hole"
    ) -> float:
        """
        Computes proximity to physical contact boundaries:
        - Coulomb friction cone boundary: ||Ft|| approx mu * Fn
        - Peg-in-hole geometric wedging angle: theta approx theta_crit
        """
        if realized_wrenches is None or len(realized_wrenches) == 0:
            return 0.0

        H = len(realized_wrenches)
        scores = []

        for t in range(H):
            w = realized_wrenches[t]
            if task == "peg_in_hole":
                # peg_in_hole wrench: [Fx, Fy, Fz, Tx, Ty, Tz]
                fn = max(0.01, abs(float(w[2])))
                ft = float(np.linalg.norm(w[:2]))
                delta_friction = abs(ft - self.mu * fn)
                phi_f = math.exp(-delta_friction / self.sigma_friction)

                # Wedging angle check from state rotation if available
                phi_w = 0.0
                if realized_states is not None and len(realized_states) > t:
                    s = realized_states[t]
                    tilt = float(np.linalg.norm(s[6:8])) if len(s) >= 8 else 0.0
                    delta_wedge = abs(tilt - self.theta_crit)
                    phi_w = math.exp(-delta_wedge / self.sigma_wedge)

                scores.append(0.5 * (phi_f + phi_w))
            else:
                # multifinger_lift: w has finger normal forces in [:4] or [:3]
                fn = max(0.01, float(np.sum(w[:4]))) if len(w) >= 4 else max(0.01, float(np.sum(w[:3])))
                # If states provide slip ratio (indices 12:16)
                if realized_states is not None and len(realized_states) > t and len(realized_states[t]) >= 20:
                    slip_ratios = realized_states[t][12:16]
                    # Proximity to slip ratio 1.0 (Coulomb boundary)
                    max_slip = float(np.max(slip_ratios))
                    phi_f = math.exp(-abs(max_slip - 1.0) / 0.20)
                else:
                    phi_f = 0.5
                scores.append(phi_f)

        return float(np.mean(scores))

    def compute_planner_optimism(self, opt_return: float, realized_return: float) -> float:
        """
        Computes planner optimism / exploitation error:
        U_opt = max(0.0, opt_return - realized_return)
        """
        return max(0.0, float(opt_return - realized_return))

    def compute_recovery_value(
        self,
        realized_modes: np.ndarray,
        success: bool = False,
        task: str = "peg_in_hole"
    ) -> float:
        """
        Computes failure recovery transitions:
        - Task 1: Wedging (3) -> Sliding (2) or Seated (4)
        - Task 2: Incipient Slip (4) -> Sticking (2) or Lift (3)
        """
        if realized_modes is None or len(realized_modes) < 2:
            return 3.0 if success else 0.0

        recovery_events = 0
        H = len(realized_modes)

        for t in range(H - 1):
            m_curr = int(realized_modes[t])
            m_next = int(realized_modes[t + 1])

            if task == "peg_in_hole":
                # Wedging (3) -> Sliding (2) or Seated (4)
                if m_curr == 3 and m_next in (2, 4):
                    recovery_events += 1
                # Impact (1) -> Sliding (2)
                elif m_curr == 1 and m_next == 2:
                    recovery_events += 0.5
            else:
                # Incipient Slip (4) -> Sticking (2) or Lift (3)
                if m_curr == 4 and m_next in (2, 3):
                    recovery_events += 1
                # Pre-grasp (0) -> Sticking (2)
                elif m_curr == 0 and m_next == 2:
                    recovery_events += 0.5

        bonus = 3.0 if success else 0.0
        return float(recovery_events + bonus)

    def score_trajectory_raw(self, trajectory: Dict[str, Any], task: str = "peg_in_hole") -> Dict[str, float]:
        """Computes raw (unnormalized) acquisition signals for a single trajectory."""
        u_mode = self.compute_mode_uncertainty(trajectory.get("pred_mode_probs"))
        u_disag = self.compute_prediction_disagreement(trajectory.get("ensemble_predictions", []))
        u_bound = self.compute_contact_boundary_proximity(
            trajectory.get("realized_wrenches"),
            realized_states=trajectory.get("realized_states"),
            task=task
        )
        u_opt = self.compute_planner_optimism(
            trajectory.get("opt_return", 0.0),
            trajectory.get("realized_return", 0.0)
        )
        u_rec = self.compute_recovery_value(
            trajectory.get("realized_modes"),
            success=trajectory.get("success", False),
            task=task
        )

        return {
            "mode_uncertainty": u_mode,
            "prediction_disagreement": u_disag,
            "contact_boundary": u_bound,
            "planner_optimism": u_opt,
            "recovery_value": u_rec,
        }

    def rank_trajectories(
        self,
        candidate_trajectories: List[Dict[str, Any]],
        task: str = "peg_in_hole",
        override_weights: Optional[Dict[str, float]] = None
    ) -> List[Dict[str, Any]]:
        """
        Ranks candidate trajectories deterministically by multi-objective score.
        Normalizes signals across the candidate batch, applies weights, and resolves ties by index.
        """
        N = len(candidate_trajectories)
        if N == 0:
            return []

        weights = self._normalize_weights(override_weights) if override_weights else self.weights

        # 1. Compute raw scores for all candidates
        raw_signal_matrix = {k: [] for k in weights.keys()}
        for i, traj in enumerate(candidate_trajectories):
            raw = self.score_trajectory_raw(traj, task=task)
            for k in weights.keys():
                raw_signal_matrix[k].append(raw[k])

        # 2. Min-Max Normalization across the candidate pool
        norm_signal_matrix = {}
        for k, vals in raw_signal_matrix.items():
            arr = np.array(vals, dtype=np.float64)
            min_v = float(np.min(arr))
            max_v = float(np.max(arr))
            denom = max_v - min_v
            if denom > 1e-6:
                norm_signal_matrix[k] = (arr - min_v) / denom
            else:
                norm_signal_matrix[k] = np.zeros_like(arr)

        # 3. Composite score calculation
        scored_candidates = []
        for i, traj in enumerate(candidate_trajectories):
            composite_score = 0.0
            signals_dict = {}
            for k, w in weights.items():
                val = float(norm_signal_matrix[k][i])
                composite_score += w * val
                signals_dict[k] = round(val, 4)

            scored_traj = dict(traj)
            scored_traj["candidate_index"] = i
            scored_traj["acquisition_score"] = float(round(composite_score, 6))
            scored_traj["normalized_signals"] = signals_dict
            scored_candidates.append(scored_traj)

        # 4. Deterministic sorting (descending by acquisition score, ascending by candidate index as tie-breaker)
        scored_candidates.sort(key=lambda x: (-x["acquisition_score"], x["candidate_index"]))

        for rank, item in enumerate(scored_candidates):
            item["acquisition_rank"] = rank + 1

        return scored_candidates
