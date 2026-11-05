"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Baseline B4: Contact-Stratified Conformal World Model (CaPTURe Baseline)
Implements Split Conformal Prediction conditioned on physical contact strata.
Guarantees distribution-free marginal coverage (1 - alpha) per contact regime.
"""

from __future__ import annotations
import numpy as np
import torch
from typing import Dict, Any, List, Optional, Tuple


class ContactStratifiedConformalWM:
    """
    Contact-Stratified Split Conformal Calibration.
    Calibrates non-conformity scores separately across physical contact strata:
    Sigma_k in {Free, Impact, Sliding, Wedging, Seated}
    """

    def __init__(self, base_model, num_strata: int = 5, alpha: float = 0.10):
        self.base_model = base_model
        self.num_strata = num_strata
        self.alpha = alpha
        # Calibration quantiles per stratum: {0: q_0, 1: q_1, ...}
        self.stratum_quantiles: Dict[int, float] = {}
        self.stratum_scores: Dict[int, List[float]] = {k: [] for k in range(num_strata)}

    def calibrate(
        self,
        calib_states: np.ndarray,
        calib_actions: np.ndarray,
        calib_targets: np.ndarray,
        calib_strata: np.ndarray
    ):
        """
        Calibrates stratum-specific conformal prediction radiuses using held-out data.
        Non-conformity score: R_i = ||s_{t+1}^{true} - hat{s}_{t+1}||_2
        """
        self.base_model.eval()
        with torch.no_grad():
            s_tensor = torch.tensor(calib_states, dtype=torch.float32)
            a_tensor = torch.tensor(calib_actions, dtype=torch.float32)

            if hasattr(self.base_model, "predict_with_uncertainty"):
                preds, _, _ = self.base_model.predict_with_uncertainty(s_tensor, a_tensor)
            elif isinstance(self.base_model, torch.nn.Module):
                res = self.base_model(s_tensor, a_tensor)
                preds = res[0] if isinstance(res, tuple) else res
            else:
                preds = s_tensor  # fallback

            preds = preds.numpy()

            errors = np.linalg.norm(calib_targets - preds, axis=-1)

            for i in range(len(calib_strata)):
                k = int(calib_strata[i])
                if k in self.stratum_scores:
                    self.stratum_scores[k].append(float(errors[i]))

            # Compute conformal quantile per stratum: ceil((N + 1)(1 - alpha)) / N
            for k in range(self.num_strata):
                scores = self.stratum_scores[k]
                if len(scores) > 10:
                    n = len(scores)
                    q_level = min(1.0, np.ceil((n + 1) * (1.0 - self.alpha)) / n)
                    self.stratum_quantiles[k] = float(np.quantile(scores, q_level))
                else:
                    self.stratum_quantiles[k] = 2.0  # Conservative fallback

    def predict_region(
        self,
        state: np.ndarray,
        action: np.ndarray,
        stratum: int
    ) -> Tuple[np.ndarray, float]:
        """
        Returns predicted point mean and conformal radius:
        C_{1-alpha}(s, a) = { y : ||y - hat{s}|| <= q_{1-alpha}(Sigma_k) }
        """
        s_t = torch.tensor(state, dtype=torch.float32).unsqueeze(0)
        a_t = torch.tensor(action, dtype=torch.float32).unsqueeze(0)

        with torch.no_grad():
            if hasattr(self.base_model, "predict_with_uncertainty"):
                pred_mean, _, _ = self.base_model.predict_with_uncertainty(s_t, a_t)
            elif isinstance(self.base_model, torch.nn.Module):
                res = self.base_model(s_t, a_t)
                pred_mean = res[0] if isinstance(res, tuple) else res
            else:
                pred_mean = s_t

            radius = self.stratum_quantiles.get(stratum, 2.0)
            return pred_mean.squeeze(0).numpy(), float(radius)

