"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Baseline B3: Bootstrapped Deep Ensemble Dynamics Model (Li et al., 2025/2026 Baseline)
Quantifies epistemic uncertainty via ensemble disagreement across E=5 independently trained models.
"""

from __future__ import annotations
import torch
import torch.nn as nn
import numpy as np
from typing import Dict, Any, Tuple, List
from .probabilistic_wm import ProbabilisticWorldModel


class EnsembleWorldModel(nn.Module):
    """
    Bootstrapped Deep Ensemble of Probabilistic World Models.
    Measures epistemic uncertainty via variance across ensemble heads:
    sigma_ens^2 = (1/E) sum ||mu_e - bar_mu||^2
    """

    def __init__(self, state_dim: int = 15, action_dim: int = 6, hidden_dim: int = 128, ensemble_size: int = 5):
        super().__init__()
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.ensemble_size = ensemble_size

        self.models = nn.ModuleList([
            ProbabilisticWorldModel(state_dim, action_dim, hidden_dim)
            for _ in range(ensemble_size)
        ])

    def forward_all(self, state: torch.Tensor, action: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """Returns predictions from all ensemble heads: shape [E, B, state_dim]"""
        means, vars_list = [], []
        for model in self.models:
            m, v = model(state, action)
            means.append(m)
            vars_list.append(v)
        return torch.stack(means, dim=0), torch.stack(vars_list, dim=0)

    def predict_with_uncertainty(
        self,
        state: torch.Tensor,
        action: torch.Tensor
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        Returns:
          - bar_mean: mean prediction across ensemble
          - epistemic_var: variance of ensemble means (model uncertainty)
          - aleatoric_var: mean of ensemble variances (data noise)
        """
        all_means, all_vars = self.forward_all(state, action)
        bar_mean = torch.mean(all_means, dim=0)
        epistemic_var = torch.var(all_means, dim=0, unbiased=False)
        aleatoric_var = torch.mean(all_vars, dim=0)
        return bar_mean, epistemic_var, aleatoric_var

    def predict_multistep(
        self,
        init_state: np.ndarray,
        action_sequence: np.ndarray,
        horizon: int
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Autoregressive rollout with epistemic uncertainty."""
        self.eval()
        with torch.no_grad():
            curr_s = torch.tensor(init_state, dtype=torch.float32).unsqueeze(0)
            means, epistemic_stds = [], []

            for t in range(horizon):
                a_t = torch.tensor(action_sequence[t], dtype=torch.float32).unsqueeze(0)
                mean, epi_var, _ = self.predict_with_uncertainty(curr_s, a_t)
                means.append(mean.squeeze(0).numpy())
                epistemic_stds.append(torch.sqrt(epi_var).squeeze(0).numpy())
                curr_s = mean

            return np.array(means), np.array(epistemic_stds)

