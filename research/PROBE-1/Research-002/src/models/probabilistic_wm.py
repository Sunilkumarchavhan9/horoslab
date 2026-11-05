"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Baseline B2: Heteroscedastic Gaussian Dynamics Model
Predicts state mean and diagonal log-variance, trained with Gaussian NLL.
"""

from __future__ import annotations
import torch
import torch.nn as nn
import numpy as np
from typing import Dict, Any, Tuple


class ProbabilisticWorldModel(nn.Module):
    """
    Heteroscedastic Gaussian World Model.
    Predicts state transition mean mu and aleatoric variance sigma^2.
    """

    def __init__(self, state_dim: int = 15, action_dim: int = 6, hidden_dim: int = 128):
        super().__init__()
        self.state_dim = state_dim
        self.action_dim = action_dim

        self.backbone = nn.Sequential(
            nn.Linear(state_dim + action_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.SiLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.SiLU(),
        )

        self.mean_head = nn.Linear(hidden_dim, state_dim)
        self.logvar_head = nn.Linear(hidden_dim, state_dim)

        # Clamping bounds for numerical stability
        self.max_logvar = nn.Parameter(torch.ones(state_dim) * 2.0)
        self.min_logvar = nn.Parameter(torch.ones(state_dim) * -10.0)

    def forward(self, state: torch.Tensor, action: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """Returns predicted next-state mean and variance."""
        x = torch.cat([state, action], dim=-1)
        feat = self.backbone(x)

        delta_mean = self.mean_head(feat)
        logvar = self.logvar_head(feat)

        # Soft clamping
        logvar = self.max_logvar - nn.functional.softplus(self.max_logvar - logvar)
        logvar = self.min_logvar + nn.functional.softplus(logvar - self.min_logvar)

        next_mean = state + delta_mean
        next_var = torch.exp(logvar)

        return next_mean, next_var

    def loss(self, state: torch.Tensor, action: torch.Tensor, target_next_state: torch.Tensor) -> torch.Tensor:
        """Gaussian Negative Log-Likelihood loss."""
        mean, var = self.forward(state, action)
        inv_var = 1.0 / (var + 1e-6)
        mse_weighted = (target_next_state - mean) ** 2 * inv_var
        log_det = torch.log(var + 1e-6)
        nll = 0.5 * torch.mean(torch.sum(mse_weighted + log_det, dim=-1))
        return nll

    def predict_multistep(
        self,
        init_state: np.ndarray,
        action_sequence: np.ndarray,
        horizon: int
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Autoregressive rollout outputting trajectory mean and variance."""
        self.eval()
        with torch.no_grad():
            curr_s = torch.tensor(init_state, dtype=torch.float32).unsqueeze(0)
            means, vars_list = [], []

            for t in range(horizon):
                a_t = torch.tensor(action_sequence[t], dtype=torch.float32).unsqueeze(0)
                mean, var = self.forward(curr_s, a_t)
                means.append(mean.squeeze(0).numpy())
                vars_list.append(var.squeeze(0).numpy())
                curr_s = mean

            return np.array(means), np.array(vars_list)

