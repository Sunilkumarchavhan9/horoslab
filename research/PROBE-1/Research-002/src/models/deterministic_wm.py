"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Baseline B1: Deterministic Action-Conditioned Dynamics Model (ContactWorld Baseline)
Implements recurrent state-action predictor without uncertainty estimates.
"""

from __future__ import annotations
import torch
import torch.nn as nn
import numpy as np
from typing import Dict, Any, Tuple


class DeterministicWorldModel(nn.Module):
    """
    Deterministic Recurrent Dynamics Model.
    Predicts next robot/object state and contact wrench without uncertainty quantification.
    """

    def __init__(self, state_dim: int = 15, action_dim: int = 6, hidden_dim: int = 128):
        super().__init__()
        self.state_dim = state_dim
        self.action_dim = action_dim

        self.net = nn.Sequential(
            nn.Linear(state_dim + action_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.SiLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.SiLU(),
            nn.Linear(hidden_dim, state_dim)
        )

    def forward(self, state: torch.Tensor, action: torch.Tensor) -> torch.Tensor:
        """Computes deterministic next-state delta: s_{t+1} = s_t + f_theta(s_t, a_t)"""
        x = torch.cat([state, action], dim=-1)
        delta_s = self.net(x)
        return state + delta_s

    def predict_multistep(
        self,
        init_state: np.ndarray,
        action_sequence: np.ndarray,
        horizon: int
    ) -> np.ndarray:
        """Open-loop autoregressive rollout over horizon H."""
        self.eval()
        with torch.no_grad():
            curr_s = torch.tensor(init_state, dtype=torch.float32).unsqueeze(0)
            predictions = []

            for t in range(horizon):
                a_t = torch.tensor(action_sequence[t], dtype=torch.float32).unsqueeze(0)
                next_s = self.forward(curr_s, a_t)
                predictions.append(next_s.squeeze(0).numpy())
                curr_s = next_s

            return np.array(predictions)

