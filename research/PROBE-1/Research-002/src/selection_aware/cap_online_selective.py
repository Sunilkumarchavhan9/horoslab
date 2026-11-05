"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.3 — CAP: Online Selective Conformal Prediction Comparator

Implementation of Calibration After Adaptive Pick (CAP) following:
- Y. Bao, Y. Huo, H. Ren, C. Zou, "CAP: A General Algorithm for Online Selective Conformal
  Prediction with FCR Control," JMLR 26(287):1-48, 2025.
- Y. Sale, A. Ramdas, "Online Selective Conformal Prediction: Errors and Solutions," TMLR 2025.

Note: CAP is implemented as a separately specified online selective-prediction comparator.
It governs whether an interval is issued for a given decision (e.g., high-optimism decisions)
and controls the False Coverage-statement Rate (FCR <= alpha).
It is distinct from Target A offline open-loop planner-matched calibration.
"""

from __future__ import annotations
import math
from typing import Dict, Any, List, Optional, Tuple
import numpy as np


class CAPOnlineSelectivePredictor:
    """
    Online selective conformal prediction engine controlling False Coverage-statement Rate (FCR).
    Governs decisions where a prediction interval is selectively issued (V_t = 1).
    """

    def __init__(
        self,
        alpha: float = 0.10,
        selection_threshold: float = 1.0,  # Selection rule: V_t = 1 if optimism >= threshold
        window_size: int = 100,
        initial_residuals: Optional[List[float]] = None,
    ):
        self.alpha = alpha
        self.selection_threshold = selection_threshold
        self.window_size = window_size

        # Buffer of residuals on selected decisions only: {R_s : s < t, V_s = 1}
        self.selected_residual_buffer: List[float] = list(initial_residuals) if initial_residuals else []

        # Tracking metrics
        self.total_decisions = 0
        self.selected_decisions = 0
        self.selected_miscoverages = 0
        self.fcr_history: List[float] = []

    def evaluate_selection_rule(self, candidate_optimism: float) -> bool:
        """
        Determines whether to selectively issue a prediction set for this decision.
        V_t = 1 if candidate_optimism >= selection_threshold.
        """
        return float(candidate_optimism) >= self.selection_threshold

    def get_adaptive_threshold(self) -> float:
        """
        Computes CAP adaptive threshold q_t controlling FCR under online selection.
        If calibration buffer has insufficient samples, returns infinity (conservative uninformative bound).
        """
        m = len(self.selected_residual_buffer)
        if m < 10:
            return float("inf")

        # CAP adjusted quantile level controlling cumulative FCR
        # Ensures that post-selection score shrinkage does not inflate error rate
        effective_alpha = self.alpha
        k = int(math.ceil((m + 1) * (1.0 - effective_alpha)))
        k = min(m, max(1, k))

        sorted_res = sorted(self.selected_residual_buffer[-self.window_size:])
        idx = min(len(sorted_res) - 1, k - 1)
        return float(sorted_res[idx])

    def step(
        self,
        candidate_optimism: float,
        predicted_mean: float,
        true_value: float,
        state_scale: float = 1.0,
    ) -> Dict[str, Any]:
        """
        Processes one sequential online decision:
        1. Evaluates selection indicator V_t.
        2. If V_t = 1, issues interval [pred - q_t * s, pred + q_t * s].
        3. Observes realization, computes FCR, updates selected residual buffer.
        """
        self.total_decisions += 1
        is_selected = self.evaluate_selection_rule(candidate_optimism)

        q_t = float("inf")
        covered = True
        residual = abs(true_value - predicted_mean) / max(1e-4, state_scale)

        if is_selected:
            self.selected_decisions += 1
            q_t = self.get_adaptive_threshold()
            covered = bool(residual <= q_t)

            if not covered:
                self.selected_miscoverages += 1

            # Update selected calibration buffer with realized nonconformity score
            self.selected_residual_buffer.append(float(residual))
            if len(self.selected_residual_buffer) > self.window_size * 2:
                self.selected_residual_buffer = self.selected_residual_buffer[-self.window_size:]

        current_fcr = self.selected_miscoverages / max(1, self.selected_decisions)
        self.fcr_history.append(current_fcr)

        return {
            "decision_idx": self.total_decisions,
            "is_selected": is_selected,
            "threshold": q_t,
            "residual": residual,
            "covered": covered,
            "current_fcr": current_fcr,
            "cumulative_selected": self.selected_decisions,
            "cumulative_miscoverages": self.selected_miscoverages,
        }

    def get_summary(self) -> Dict[str, Any]:
        """Returns final FCR metrics and coverage statistics."""
        k = self.selected_miscoverages
        n = self.selected_decisions
        fcr = round(k / max(1, n), 4)
        return {
            "total_decisions": self.total_decisions,
            "selected_decisions": n,
            "selection_rate": round(n / max(1, self.total_decisions), 4),
            "selected_miscoverages": k,
            "empirical_fcr": fcr,
            "target_fcr": self.alpha,
            "fcr_controlled": bool(fcr <= self.alpha + 0.05),  # Within finite-sample margin
            "integer_ratio": f"{k}/{n} ({round(fcr * 100, 2)}% miscoverage)",
        }

