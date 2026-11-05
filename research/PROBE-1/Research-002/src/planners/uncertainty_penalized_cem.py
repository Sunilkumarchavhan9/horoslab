"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Batched Uncertainty-Penalized CEM Trajectory Optimizer (Li et al., 2025/2026 Style)
Penalizes epistemic model disagreement: J_pen = J_WM - beta * sum(sigma_ens)
Evaluates rollouts via batched PyTorch tensor operations.
"""

from __future__ import annotations
import numpy as np
import torch
from typing import Dict, Any, Callable, Tuple, Optional


class UncertaintyPenalizedCEM:
    """
    Batched Uncertainty-Penalized CEM.
    Evaluates candidate rollouts in parallel batches and subtracts beta * sigma_ens from returns.
    """

    def __init__(
        self,
        ensemble_model,
        action_dim: int,
        action_bounds: Tuple[np.ndarray, np.ndarray],
        horizon: int = 10,
        num_samples: int = 250,
        elite_fraction: float = 0.10,
        num_iterations: int = 4,
        beta: float = 1.5,
    ):
        self.ensemble_model = ensemble_model
        self.action_dim = action_dim
        self.lower_bound, self.upper_bound = action_bounds
        self.horizon = horizon
        self.num_samples = num_samples
        self.num_elites = max(1, int(num_samples * elite_fraction))
        self.num_iterations = num_iterations
        self.beta = beta

    def plan(
        self,
        current_state: np.ndarray,
        reward_fn: Callable[[np.ndarray, np.ndarray], float],
        warm_start_mean: Optional[np.ndarray] = None,
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """Optimizes action trajectories under penalized objective using batched tensors."""
        self.ensemble_model.eval()
        mean = warm_start_mean if warm_start_mean is not None else np.zeros((self.horizon, self.action_dim))
        std = np.ones((self.horizon, self.action_dim)) * 0.5

        best_trajectory = None
        best_penalized_return = -float("inf")
        s_curr_tensor = torch.tensor(current_state, dtype=torch.float32)

        for iteration in range(self.num_iterations):
            samples = np.random.normal(mean, std, size=(self.num_samples, self.horizon, self.action_dim))
            samples = np.clip(samples, self.lower_bound, self.upper_bound)
            samples_tensor = torch.tensor(samples, dtype=torch.float32)

            curr_states = s_curr_tensor.unsqueeze(0).expand(self.num_samples, -1).clone()
            penalized_returns = np.zeros(self.num_samples, dtype=np.float64)
            raw_returns = np.zeros(self.num_samples, dtype=np.float64)

            with torch.no_grad():
                for t in range(self.horizon):
                    a_t = samples_tensor[:, t, :]
                    bar_mean, epi_var, _ = self.ensemble_model.predict_with_uncertainty(curr_states, a_t)

                    s_np = bar_mean.numpy()
                    a_np = samples[:, t, :]
                    # Epistemic std norm per sample: [N]
                    sigma_norms = torch.norm(torch.sqrt(epi_var), dim=-1).numpy()

                    for i in range(self.num_samples):
                        r_i = reward_fn(s_np[i], a_np[i])
                        raw_returns[i] += r_i
                        penalized_returns[i] += r_i - self.beta * sigma_norms[i]

                    curr_states = bar_mean

            elite_indices = np.argsort(penalized_returns)[-self.num_elites:]
            elite_samples = samples[elite_indices]

            if penalized_returns[elite_indices[-1]] > best_penalized_return:
                best_penalized_return = float(penalized_returns[elite_indices[-1]])
                best_trajectory = elite_samples[-1]

            new_mean = np.mean(elite_samples, axis=0)
            new_std = np.std(elite_samples, axis=0) + 1e-4

            mean = 0.8 * new_mean + 0.2 * mean
            std = 0.8 * new_std + 0.2 * std

        best_action = best_trajectory[0] if best_trajectory is not None else np.zeros(self.action_dim)

        info = {
            "best_penalized_return": best_penalized_return,
            "best_trajectory": best_trajectory,
        }

        return best_action, info
