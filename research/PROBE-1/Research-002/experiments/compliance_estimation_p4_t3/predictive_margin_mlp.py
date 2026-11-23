"""
HOROS PROBE-1 — Phase 4 Task 3 (P4-T3)
Level 2: Force-History Predictive Margin Neural Network (MLP)

Multi-task causal neural architecture estimating:
1. Future normalized stiffness / stability margin: m_{t+H} in [0.0, 1.0]
2. Gross slip probability over horizon H: p(gross_slip in [t, t+H]) in [0.0, 1.0]
3. Time-to-gross-slip: tau_rem in [0.0, 1.0] s
4. Epistemic/aleatoric margin prediction variance: sigma^2_m
"""

import math
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from typing import Dict, Any, Tuple, Optional


class PredictiveMarginMLP(nn.Module):
    """
    4-layer feedforward network with LayerNorm and multi-head causal prediction.
    """

    def __init__(
        self,
        input_dim: int = 60,  # 4 channels * window_size 15
        hidden_dim: int = 64,
        dropout: float = 0.05,
    ):
        super().__init__()
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim

        # Shared feature extractor backbone
        self.backbone = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
        )

        # Multi-task prediction heads
        self.margin_head = nn.Linear(hidden_dim, 1)        # Target margin in [0, 1]
        self.slip_head = nn.Linear(hidden_dim, 1)          # Binary slip probability in [0, 1]
        self.time_head = nn.Linear(hidden_dim, 1)          # Time to slip in seconds
        self.uncertainty_head = nn.Linear(hidden_dim, 1)   # Margin prediction variance

    def forward(
        self,
        x: torch.Tensor,
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        Forward pass.
        Returns:
            margin_pred: (B, 1) in [0, 1]
            slip_prob: (B, 1) in [0, 1]
            time_pred: (B, 1) in [0, inf)
            variance_pred: (B, 1) in (0, inf)
        """
        feats = self.backbone(x)

        margin_pred = torch.sigmoid(self.margin_head(feats))
        slip_prob = torch.sigmoid(self.slip_head(feats))
        time_pred = F.relu(self.time_head(feats))
        variance_pred = F.softplus(self.uncertainty_head(feats)) + 1e-4

        return margin_pred, slip_prob, time_pred, variance_pred

    def compute_loss(
        self,
        x: torch.Tensor,
        target_margin: torch.Tensor,
        target_slip: torch.Tensor,
        target_time: torch.Tensor,
    ) -> Dict[str, torch.Tensor]:
        """
        Multi-task loss: Gaussian NLL for margin + BCE for slip risk + Huber for remaining time.
        """
        margin_pred, slip_prob, time_pred, var_pred = self.forward(x)

        # Gaussian Negative Log-Likelihood for margin
        # NLL = 0.5 * ( (m - m_hat)^2 / var + log(var) )
        margin_nll = 0.5 * torch.mean(((target_margin - margin_pred) ** 2) / var_pred + torch.log(var_pred))
        margin_mae = F.l1_loss(margin_pred, target_margin)

        # Binary Cross-Entropy for Gross Slip Probability
        slip_bce = F.binary_cross_entropy(slip_prob, target_slip)

        # Smooth L1 for Time to Gross Slip
        time_loss = F.smooth_l1_loss(time_pred, target_time)

        # Combined multi-task objective
        total_loss = margin_nll + 1.0 * slip_bce + 0.2 * time_loss

        return {
            "total_loss": total_loss,
            "margin_nll": margin_nll,
            "margin_mae": margin_mae,
            "slip_bce": slip_bce,
            "time_loss": time_loss,
        }

    @torch.no_grad()
    def predict_causal_step(
        self,
        feature_vector: np.ndarray,
    ) -> Dict[str, float]:
        """
        Inference call for a single observation window at time t.
        """
        self.eval()
        x_tensor = torch.tensor(feature_vector, dtype=torch.float32).unsqueeze(0)
        margin_pred, slip_prob, time_pred, var_pred = self.forward(x_tensor)

        return {
            "predicted_margin": float(margin_pred.item()),
            "slip_probability": float(slip_prob.item()),
            "predicted_time_to_slip_s": float(time_pred.item()),
            "margin_uncertainty_std": math.sqrt(float(var_pred.item())),
        }
