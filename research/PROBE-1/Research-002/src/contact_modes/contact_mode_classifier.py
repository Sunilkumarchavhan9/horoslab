"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.1: Contact-Mode Neural Classifier & Conformal Mode Set Predictor
Predicts discrete contact mode probabilities and conformal candidate sets S_{1-alpha_mode}.
"""

from __future__ import annotations
import numpy as np
import torch
import torch.nn as nn
from typing import List, Tuple, Dict, Any, Optional
from .contact_mode_definitions import ContactMode


class ContactModeClassifier(nn.Module):
    """
    Seven-Class Contact-Mode Predictor.
    Estimates mode logits: P(Sigma_{t+1} = k | s_t, a_t) for k in {0, ..., 6}.
    Implements Adaptive Prediction Sets (APS) for distribution-free mode coverage.
    """

    def __init__(self, state_dim: int = 15, action_dim: int = 6, hidden_dim: int = 128, num_modes: int = 7):
        super().__init__()
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.num_modes = num_modes

        self.net = nn.Sequential(
            nn.Linear(state_dim + action_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.SiLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.SiLU(),
            nn.Linear(hidden_dim, num_modes)
        )

        self.aps_quantile: float = 0.90  # default calibration threshold

    def forward(self, state: torch.Tensor, action: torch.Tensor) -> torch.Tensor:
        """Computes unnormalized logits for all 7 contact modes."""
        x = torch.cat([state, action], dim=-1)
        return self.net(x)

    def predict_mode_distribution(self, state: np.ndarray, action: np.ndarray) -> np.ndarray:
        """Returns softmax probability vector across 7 modes: [7]."""
        self.eval()
        with torch.no_grad():
            s_t = torch.tensor(state, dtype=torch.float32).unsqueeze(0)
            a_t = torch.tensor(action, dtype=torch.float32).unsqueeze(0)
            logits = self.forward(s_t, a_t)
            probs = torch.softmax(logits, dim=-1).squeeze(0).numpy()
            return probs

    def calibrate_aps(self, calib_states: np.ndarray, calib_actions: np.ndarray, calib_modes: np.ndarray, alpha_mode: float = 0.10):
        """
        Calibrates Adaptive Prediction Sets (APS) threshold for mode classification:
        Non-conformity score E_i = sum_{j=1}^{rank(y_i)} p_(j)
        """
        self.eval()
        with torch.no_grad():
            s_t = torch.tensor(calib_states, dtype=torch.float32)
            a_t = torch.tensor(calib_actions, dtype=torch.float32)
            logits = self.forward(s_t, a_t)
            probs = torch.softmax(logits, dim=-1).numpy()

            n = len(calib_modes)
            conformity_scores = []

            for i in range(n):
                true_mode = int(calib_modes[i])
                prob_vec = probs[i]
                sorted_indices = np.argsort(-prob_vec)
                cum_prob = 0.0
                for rank, idx in enumerate(sorted_indices):
                    cum_prob += prob_vec[idx]
                    if idx == true_mode:
                        conformity_scores.append(cum_prob)
                        break

            q_level = min(1.0, np.ceil((n + 1) * (1.0 - alpha_mode)) / n)
            self.aps_quantile = float(np.quantile(conformity_scores, q_level))

    def predict_mode_set(self, state: np.ndarray, action: np.ndarray) -> List[int]:
        """
        Returns guaranteed candidate mode set S_{1-alpha_mode} containing the true mode with probability >= 1 - alpha.
        Strictly leakage-free: does not require realized future mode.
        """
        probs = self.predict_mode_distribution(state, action)
        sorted_indices = np.argsort(-probs)
        candidate_modes = []
        cum_prob = 0.0

        for idx in sorted_indices:
            candidate_modes.append(int(idx))
            cum_prob += probs[idx]
            if cum_prob >= self.aps_quantile:
                break

        return candidate_modes
