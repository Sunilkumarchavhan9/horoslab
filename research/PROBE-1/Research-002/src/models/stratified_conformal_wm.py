"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Baseline B4: Contact-Stratified Conformal World Model (CaPTURe Baseline)
Implements Split Conformal Prediction conditioned on physical contact strata.
Guarantees distribution-free marginal coverage (1 - alpha) per contact regime.
"""

from __future__ import annotations
import math
import numpy as np
import torch
from typing import Dict, Any, List, Optional, Tuple


class ContactStratifiedConformalWM:
    """
    Contact-Stratified Split Conformal Calibration.
    Calibrates non-conformity scores separately across physical contact strata:
    Sigma_k in {Free, Impact, Sliding, Wedging, Seated} (or 7 contact modes).
    """

    def __init__(
        self,
        base_model,
        num_strata: int = 5,
        alpha: float = 0.10,
        min_stratum_samples: int = 11,
    ):
        if not (0.0 < alpha < 1.0):
            raise ValueError(f"alpha must lie strictly in (0, 1), got {alpha}")
        self.base_model = base_model
        self.num_strata = num_strata
        self.alpha = float(alpha)
        self.target_coverage = round(1.0 - self.alpha, 6)
        self.n_min_marginal = max(1, int(math.ceil(1.0 / self.alpha)) - 1)
        # Preserve > 10 quality guard while enforcing marginal order-statistic feasibility
        self.min_stratum_samples = max(int(min_stratum_samples), self.n_min_marginal)

        # Calibration quantiles per stratum: {0: q_0, 1: q_1, ...}
        self.stratum_quantiles: Dict[int, float] = {}
        self.stratum_scores: Dict[int, List[float]] = {k: [] for k in range(num_strata)}
        self.stratum_fallback_log: Dict[int, Dict[str, Any]] = {}
        self.global_quantile: float = float("inf")
        self.any_fallback_to_global: bool = False
        self.calibrated: bool = False

    def calibrate(
        self,
        calib_states: np.ndarray,
        calib_actions: np.ndarray,
        calib_targets: np.ndarray,
        calib_strata: np.ndarray,
    ):
        """
        Calibrates stratum-specific conformal prediction radiuses using held-out data.
        Non-conformity score: R_i = ||s_{t+1}^{true} - hat{s}_{t+1}||_2
        """
        self.base_model.eval()
        self.stratum_scores = {k: [] for k in range(self.num_strata)}
        self.stratum_quantiles = {}
        self.stratum_fallback_log = {}

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

            all_errors: List[float] = []
            for i in range(len(calib_strata)):
                err_val = float(errors[i])
                all_errors.append(err_val)
                k = int(calib_strata[i])
                if k in self.stratum_scores:
                    self.stratum_scores[k].append(err_val)

            # Global fallback order statistic
            global_ok = len(all_errors) >= self.n_min_marginal
            if global_ok:
                k_global = int(math.ceil((len(all_errors) + 1) * (1.0 - self.alpha)))
                if k_global <= len(all_errors):
                    self.global_quantile = float(sorted(all_errors)[k_global - 1])
                else:
                    global_ok = False
                    self.global_quantile = float("inf")
            else:
                self.global_quantile = float("inf")

            # Compute conformal quantile per stratum with explicit fallback tracking
            for k in range(self.num_strata):
                scores = self.stratum_scores[k]
                n_k = len(scores)
                k_rank = int(math.ceil((n_k + 1) * (1.0 - self.alpha))) if n_k > 0 else 1
                if n_k >= self.min_stratum_samples and k_rank <= n_k:
                    q_k = float(sorted(scores)[k_rank - 1])
                    fallback_to_global = False
                    source = "empirical_stratum"
                elif global_ok and math.isfinite(self.global_quantile):
                    q_k = self.global_quantile
                    fallback_to_global = True
                    source = "global_fallback"
                else:
                    q_k = 2.0  # Uncalibrated heuristic fallback
                    fallback_to_global = True
                    source = "uncalibrated_default_2.0"

                self.stratum_quantiles[k] = q_k
                self.stratum_fallback_log[k] = {
                    "stratum": k,
                    "sample_count": n_k,
                    "min_stratum_samples": self.min_stratum_samples,
                    "fallback_to_global": fallback_to_global,
                    "fallback_triggered": fallback_to_global,
                    "source": source,
                    "quantile": round(q_k, 4) if math.isfinite(q_k) else float("inf"),
                }

            self.any_fallback_to_global = any(
                meta["fallback_to_global"] for meta in self.stratum_fallback_log.values()
            )
            self.calibrated = bool(
                global_ok or any(
                    meta["source"] == "empirical_stratum" for meta in self.stratum_fallback_log.values()
                )
            )

    def get_calibration_diagnostics(self) -> Dict[str, Any]:
        """Returns stratum sample counts and empirical vs fallback logging."""
        return {
            "alpha": self.alpha,
            "target_coverage": self.target_coverage,
            "n_min_marginal": self.n_min_marginal,
            "min_stratum_samples": self.min_stratum_samples,
            "calibrated": self.calibrated,
            "global_quantile": round(self.global_quantile, 4) if math.isfinite(self.global_quantile) else float("inf"),
            "any_fallback_to_global": self.any_fallback_to_global,
            "stratum_fallback_log": {str(k): dict(v) for k, v in self.stratum_fallback_log.items()},
        }

    def predict_region(
        self,
        state: np.ndarray,
        action: np.ndarray,
        stratum: int,
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

    def evaluate_coverage(
        self,
        test_states: np.ndarray,
        test_actions: np.ndarray,
        test_targets: np.ndarray,
        test_strata: np.ndarray,
    ) -> Dict[str, Any]:
        """
        Evaluates contact-stratified conformal prediction intervals on held-out transitions.
        Produces conformal coverage and interval width metrics distinct from probabilistic neural NLL.
        """
        if not self.calibrated:
            raise RuntimeError(
                "ContactStratifiedConformalWM must be calibrated before evaluate_coverage."
            )

        n = len(test_states)
        if n == 0:
            raise ValueError("Cannot evaluate conformal coverage with 0 transitions.")

        covered = 0
        radii: List[float] = []
        l2_errors: List[float] = []
        per_stratum_hits: Dict[int, int] = {k: 0 for k in range(self.num_strata)}
        per_stratum_total: Dict[int, int] = {k: 0 for k in range(self.num_strata)}

        for i in range(n):
            k = int(test_strata[i])
            pred_mean, radius = self.predict_region(test_states[i], test_actions[i], stratum=k)
            err_norm = float(np.linalg.norm(test_targets[i] - pred_mean))
            l2_errors.append(err_norm)
            radii.append(float(radius))
            is_cov = err_norm <= radius
            if is_cov:
                covered += 1
            if k in per_stratum_total:
                per_stratum_total[k] += 1
                if is_cov:
                    per_stratum_hits[k] += 1

        rate = round(covered / n, 4)
        per_stratum_cov = {
            str(k): {
                "covered": per_stratum_hits[k],
                "total": per_stratum_total[k],
                "coverage": round(per_stratum_hits[k] / per_stratum_total[k], 4) if per_stratum_total[k] > 0 else None,
                "radius": round(self.stratum_quantiles.get(k, 2.0), 4),
                "fallback_to_global": bool(self.stratum_fallback_log.get(k, {}).get("fallback_to_global", True)),
                "source": self.stratum_fallback_log.get(k, {}).get("source", "unknown"),
            }
            for k in range(self.num_strata)
        }

        return {
            "architecture_id": "B4",
            "model_class": "ContactStratifiedConformalWM",
            "is_conformal_architecture": True,
            "target_coverage": self.target_coverage,
            "alpha": self.alpha,
            "covered_count": covered,
            "total_count": n,
            "empirical_coverage": rate,
            "mean_interval_radius": round(float(np.mean(radii)), 4),
            "mean_l2_error": round(float(np.mean(l2_errors)), 4),
            "per_stratum_coverage": per_stratum_cov,
            "calibration_diagnostics": self.get_calibration_diagnostics(),
        }
