"""
Conformalized Quantile Regression (CQR) with Adaptive Conformal Inference (ACI).
Implements Gibbs & Candès online update under temporal distribution shifts.
"""
from __future__ import annotations

import numpy as np
from typing import List, Tuple, Dict, Optional


class ConformalCalibrator:
    """
    Offline/Warm-up Split Conformal Calibration over calibration dataset D_cal.
    Computes non-conformity scores: E_i = max(q_low(x_i) - y_i, y_i - q_high(x_i)).
    """

    def __init__(self, scores: Optional[np.ndarray] = None):
        if scores is None:
            self.scores = np.array([], dtype=np.float64)
        else:
            self.scores = np.sort(np.asarray(scores, dtype=np.float64))

    def fit(self, y_true: np.ndarray, q_lower: np.ndarray, q_upper: np.ndarray) -> None:
        """Fit empirical scores on calibration set without test data contamination."""
        assert len(y_true) == len(q_lower) == len(q_upper)
        scores = np.maximum(q_lower - y_true, y_true - q_upper)
        self.scores = np.sort(scores)

    def get_quantile(self, alpha: float) -> float:
        """Compute (1 - alpha) conformal empirical quantile."""
        n = len(self.scores)
        if n == 0:
            return 0.0
        # Pinned conformal index calculation: ceil((n + 1) * (1 - alpha)) / n
        q_idx = int(np.ceil((n + 1) * (1.0 - alpha))) - 1
        q_idx = np.clip(q_idx, 0, n - 1)
        return float(self.scores[q_idx])


class AdaptiveConformalInference:
    """
    Adaptive Conformal Inference (ACI) for dynamic sequential robotic manipulation:
      alpha_{k+1} = alpha_k + gamma * (delta - err_k)
    where:
      delta: target miscoverage rate (e.g. 0.05 for 95% target coverage)
      err_k: indicator II(y_k not in C_k)
      gamma: step size
    """

    def __init__(
        self,
        calibrator: ConformalCalibrator,
        target_miscoverage: float = 0.05,
        gamma: float = 0.02,
        alpha_init: Optional[float] = None,
        mu_floor: float = 0.05,
    ):
        self.calibrator = calibrator
        self.delta = float(target_miscoverage)
        self.gamma = float(gamma)
        self.alpha = float(alpha_init if alpha_init is not None else target_miscoverage)
        self.mu_floor = float(mu_floor)

        # History tracking
        self.alpha_history: List[float] = [self.alpha]
        self.error_history: List[int] = []
        self.interval_history: List[Tuple[float, float]] = []
        self.caution_flags: List[bool] = []

    def step(
        self,
        mu_pred: float,
        q_lower: float,
        q_upper: float,
        y_true_previous: Optional[float] = None,
    ) -> Tuple[float, float, bool]:
        """
        Executes online ACI update step.
        Returns:
            mu_calibrated_min: Conservative lower bound of the adaptive calibrated friction prediction interval
            mu_calibrated_max: Upper bound of the adaptive calibrated friction prediction interval
            caution_flag: True if prediction interval hit physical floor mu_floor
        """
        # 1. Update alpha if previous true label is provided
        if y_true_previous is not None and len(self.interval_history) > 0:
            prev_low, prev_high = self.interval_history[-1]
            prev_err = 1 if (y_true_previous < prev_low or y_true_previous > prev_high) else 0
            self.error_history.append(prev_err)

            # ACI recursion
            self.alpha = self.alpha + self.gamma * (self.delta - prev_err)
            self.alpha = float(np.clip(self.alpha, 0.001, 0.50))
            self.alpha_history.append(self.alpha)

        # 2. Compute conformal margin for current step
        conformal_score = self.calibrator.get_quantile(self.alpha)

        # Standard CQR margin expansion: [q_lower - score, q_upper + score]
        raw_lower = q_lower - conformal_score
        raw_upper = q_upper + conformal_score
        if raw_upper < raw_lower:
            mid = 0.5 * (raw_lower + raw_upper)
            raw_lower = mid - 0.01
            raw_upper = mid + 0.01

        # Check physical measurement floor
        caution_flag = bool(raw_lower <= self.mu_floor)
        mu_min = float(np.maximum(self.mu_floor, raw_lower))
        mu_max = float(max(mu_min, raw_upper))

        self.interval_history.append((mu_min, mu_max))
        self.caution_flags.append(caution_flag)

        return mu_min, mu_max, caution_flag

    def compute_empirical_coverage(self, y_true_sequence: np.ndarray) -> Dict[str, float]:
        """
        Evaluates empirical coverage 1 - err over the sequence.
        """
        n = min(len(y_true_sequence), len(self.interval_history))
        if n == 0:
            return {"empirical_coverage": 1.0, "target_coverage": 1.0 - self.delta}

        covered = 0
        for i in range(n):
            y = y_true_sequence[i]
            low, high = self.interval_history[i]
            if low <= y <= high:
                covered += 1

        coverage = float(covered / n)
        return {
            "empirical_coverage": coverage,
            "target_coverage": 1.0 - self.delta,
            "coverage_gap": float(coverage - (1.0 - self.delta)),
            "mean_interval_width": float(
                np.mean([high - low for low, high in self.interval_history[:n]])
            ),
            "caution_flag_rate": float(np.mean(self.caution_flags[:n])),
        }
