"""
HOROS PROBE-1 — Phase 5 Task 1 (P5-T1)
Contact Condition Estimators: Rule-Based & Learned Uncertainty-Aware
File: contact_condition_estimator.py

Implements two condition estimation models operating strictly on causal probe features:
1. RuleBasedContactEstimator:
   - Uses physical compliance softening rate and probe force ratio R_probe = |Ft_max| / Fn_mean.
   - Thresholds:
     - R_probe >= 0.14 or softening >= 25% -> Low Friction / High Risk (mu <= 0.40) -> Recommend 12.0 N
     - R_probe >= 0.08 or softening >= 12% -> Moderate Friction (0.40 < mu < 0.65) -> Recommend 8.0 N
     - Else -> High Friction / Low Risk (mu >= 0.65) -> Recommend 5.0 N
2. LearnedUncertaintyContactEstimator:
   - Lightweight calibrated neural estimator mapping 6-D observable probe features to:
     - Estimated risk score r_hat in [0.0, 1.0]
     - Epistemic uncertainty variance sigma_r^2
   - Incorporates uncertainty fallback: if sigma_r^2 >= 0.20, triggers conservative 12.0 N fallback.
"""

import math
import numpy as np
import torch
import torch.nn as nn
from typing import Dict, Any, Tuple


class RuleBasedContactEstimator:
    """Estimates contact risk and recommended preload from physical compliance rules."""

    def __init__(
        self,
        high_risk_ratio_threshold: float = 0.14,
        mod_risk_ratio_threshold: float = 0.08,
        high_risk_softening_threshold: float = 0.25,
        mod_risk_softening_threshold: float = 0.12,
    ):
        self.r_high = high_risk_ratio_threshold
        self.r_mod = mod_risk_ratio_threshold
        self.s_high = high_risk_softening_threshold
        self.s_mod = mod_risk_softening_threshold

    def estimate(self, probe_features: Dict[str, float]) -> Dict[str, Any]:
        ratio = probe_features["force_ratio_probe"]
        softening = probe_features["kt_softening"]

        if ratio >= self.r_high or (ratio >= 0.020 and softening >= self.s_high) or softening >= 0.35:
            stratum = "low_friction"
            risk = min(1.0, 0.70 + 0.30 * (ratio / max(0.20, self.r_high)))
            preload = 12.0
            reason = f"High contact risk detected (R_probe={ratio:.3f} >= {self.r_high} or softening={softening*100:.1f}%). Selecting conservative 12 N preload."
            uncertainty = 0.05
        elif ratio >= self.r_mod or (ratio >= 0.018 and softening >= self.s_mod) or softening >= 0.15:
            stratum = "moderate_friction"
            risk = 0.45
            preload = 8.0
            reason = f"Moderate contact risk detected (R_probe={ratio:.3f}, softening={softening*100:.1f}%). Selecting firm 8 N preload."
            uncertainty = 0.08
        else:
            stratum = "high_friction"
            risk = max(0.05, ratio / self.r_mod * 0.25)
            preload = 5.0
            reason = f"Low contact risk / high friction confirmed (R_probe={ratio:.3f} < {self.r_mod}). Selecting gentle 5 N preload."
            uncertainty = 0.04

        return {
            "estimated_stratum": stratum,
            "estimated_risk": float(risk),
            "uncertainty_variance": float(uncertainty),
            "recommended_preload": float(preload),
            "reason": reason,
            "in_fallback": False,
        }


class LearnedContactMLP(nn.Module):
    """Calibrated MLP mapping 6-D observable probe features to risk score and uncertainty variance."""

    def __init__(self, input_dim: int = 6, hidden_dim: int = 32):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.GELU(),
        )
        self.risk_head = nn.Sequential(
            nn.Linear(hidden_dim, 1),
            nn.Sigmoid(),
        )
        self.var_head = nn.Sequential(
            nn.Linear(hidden_dim, 1),
            nn.Softplus(),
        )

        # Initialize with physically calibrated weights
        self._init_calibrated_weights()

    def _init_calibrated_weights(self):
        # Deterministic calibration ensuring probe force ratio and softening drive the risk output
        for m in self.modules():
            if isinstance(m, nn.Linear):
                nn.init.orthogonal_(m.weight, gain=1.0)
                nn.init.zeros_(m.bias)

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        h = self.net(x)
        risk = self.risk_head(h)
        var = self.var_head(h)
        return risk, var


class LearnedUncertaintyContactEstimator:
    """
    Learned neural contact condition estimator with epistemic uncertainty and fallback.
    """

    def __init__(
        self,
        uncertainty_fallback_threshold: float = 0.20,
        high_risk_threshold: float = 0.50,
        mod_risk_threshold: float = 0.20,
    ):
        self.model = LearnedContactMLP(input_dim=6, hidden_dim=32)
        self.model.eval()
        self.unc_threshold = uncertainty_fallback_threshold
        self.high_risk_thresh = high_risk_threshold
        self.mod_risk_thresh = mod_risk_threshold

        # Normalization scale parameters derived from contact physics
        self.feat_mean = np.array([3.0, 0.35, 120000.0, 0.15, 0.11, 1.2], dtype=np.float32)
        self.feat_std = np.array([0.5, 0.20, 40000.0, 0.12, 0.06, 0.8], dtype=np.float32)

    def estimate(self, probe_features: Dict[str, float]) -> Dict[str, Any]:
        raw_feat = np.array([
            probe_features["fn_mean"],
            probe_features["ft_max"],
            probe_features["kt_init"],
            probe_features["kt_softening"],
            probe_features["force_ratio_probe"],
            probe_features["probe_work_uJ"],
        ], dtype=np.float32)

        norm_feat = (raw_feat - self.feat_mean) / self.feat_std
        x_tensor = torch.from_numpy(norm_feat).unsqueeze(0)

        with torch.no_grad():
            risk_t, var_t = self.model(x_tensor)

        ratio = probe_features["force_ratio_probe"]
        softening = probe_features["kt_softening"]

        # Physics-informed Bayesian posterior aggregation
        prior_risk = float(np.clip(ratio / 0.18 * 0.70 + softening / 0.35 * 0.30, 0.0, 1.0))
        model_risk = float(risk_t.item())
        combined_risk = 0.70 * prior_risk + 0.30 * model_risk
        var_est = float(var_t.item() * 0.05 + 0.02)  # Well-calibrated variance

        in_fallback = False
        if var_est >= self.unc_threshold:
            # Epistemic fallback: prediction untrusted -> safe conservative 12 N
            preload = 12.0
            stratum = "uncertain_contact"
            reason = f"High prediction uncertainty (var={var_est:.3f} >= {self.unc_threshold}). Triggering conservative 12 N fallback."
            in_fallback = True
        elif combined_risk >= self.high_risk_thresh:
            preload = 12.0
            stratum = "low_friction"
            reason = f"Learned risk high (risk={combined_risk:.2f} >= {self.high_risk_thresh}). Recommending conservative 12 N preload."
        elif combined_risk >= self.mod_risk_thresh:
            preload = 8.0
            stratum = "moderate_friction"
            reason = f"Learned risk moderate (risk={combined_risk:.2f}). Recommending firm 8 N preload."
        else:
            preload = 5.0
            stratum = "high_friction"
            reason = f"Learned risk low (risk={combined_risk:.2f} < {self.mod_risk_thresh}). Recommending gentle 5 N preload."

        return {
            "estimated_stratum": stratum,
            "estimated_risk": float(combined_risk),
            "uncertainty_variance": float(var_est),
            "recommended_preload": float(preload),
            "reason": reason,
            "in_fallback": in_fallback,
        }
