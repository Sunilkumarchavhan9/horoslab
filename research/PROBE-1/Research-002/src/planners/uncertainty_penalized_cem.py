"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Batched Uncertainty-Penalized CEM Trajectory Optimizer (Li et al., 2025/2026 Style)
Penalizes epistemic (or aleatoric/total) model uncertainty: J_pen = J_WM - beta * sum(sigma)
Evaluates rollouts via batched PyTorch tensor operations.
"""

from __future__ import annotations
import numpy as np
import torch
from typing import Dict, Any, Callable, Tuple, Optional


class UncertaintyPenalizedCEM:
    """
    Batched Uncertainty-Penalized CEM.
    Evaluates candidate rollouts in parallel batches and subtracts beta * sigma from returns,
    while separately tracking raw predicted return for unpenalized PEG diagnostics.
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
        uncertainty_source: str = "auto",
        seed: Optional[int] = None,
        init_std: Optional[Any] = None,
    ):
        self.ensemble_model = ensemble_model
        self.action_dim = action_dim
        self.lower_bound, self.upper_bound = action_bounds
        self.horizon = horizon
        self.num_samples = num_samples
        self.num_elites = max(1, int(num_samples * elite_fraction))
        self.num_iterations = num_iterations
        self.beta = float(beta)
        self.uncertainty_source = uncertainty_source
        self.init_std = init_std
        self.rng = np.random.RandomState(seed) if seed is not None else None

    def _select_variance_tensor(
        self, epi_var: torch.Tensor, alea_var: torch.Tensor
    ) -> Tuple[torch.Tensor, str]:
        if self.uncertainty_source == "epistemic":
            return epi_var, "epistemic"
        if self.uncertainty_source == "aleatoric":
            return alea_var, "aleatoric"
        if self.uncertainty_source == "total":
            return epi_var + alea_var, "total"
        # "auto": prioritize epistemic variance when nonzero (B3), else aleatoric (B2)
        if bool(torch.any(epi_var > 0.0)):
            return epi_var, "epistemic"
        if bool(torch.any(alea_var > 0.0)):
            return alea_var, "aleatoric"
        return torch.zeros_like(epi_var), "none"

    def plan(
        self,
        current_state: np.ndarray,
        reward_fn: Callable[[np.ndarray, np.ndarray], float],
        warm_start_mean: Optional[np.ndarray] = None,
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """Optimizes action trajectories under penalized objective using batched tensors."""
        self.ensemble_model.eval()
        mean = warm_start_mean.copy() if warm_start_mean is not None else np.zeros((self.horizon, self.action_dim))
        if self.init_std is None:
            std = np.ones((self.horizon, self.action_dim)) * 0.5
        else:
            std = np.broadcast_to(np.asarray(self.init_std, dtype=np.float64), (self.horizon, self.action_dim)).copy()

        best_trajectory = None
        best_penalized_return = -float("inf")
        best_raw_return = -float("inf")
        best_penalty_total = 0.0
        source_used = "none"
        last_samples_first = None
        last_elites_first = None
        s_curr_tensor = torch.tensor(current_state, dtype=torch.float32)

        for _ in range(self.num_iterations):
            if self.rng is not None:
                samples = self.rng.normal(mean, std, size=(self.num_samples, self.horizon, self.action_dim))
            else:
                samples = np.random.normal(mean, std, size=(self.num_samples, self.horizon, self.action_dim))
            samples = np.clip(samples, self.lower_bound, self.upper_bound)
            samples_tensor = torch.tensor(samples, dtype=torch.float32)

            curr_states = s_curr_tensor.unsqueeze(0).expand(self.num_samples, -1).clone()
            penalized_returns = np.zeros(self.num_samples, dtype=np.float64)
            raw_returns = np.zeros(self.num_samples, dtype=np.float64)
            penalty_totals = np.zeros(self.num_samples, dtype=np.float64)

            with torch.no_grad():
                for t in range(self.horizon):
                    a_t = samples_tensor[:, t, :]
                    if hasattr(self.ensemble_model, "predict_with_uncertainty"):
                        bar_mean, epi_var, alea_var = self.ensemble_model.predict_with_uncertainty(curr_states, a_t)
                    else:
                        res = self.ensemble_model(curr_states, a_t)
                        bar_mean = res[0] if isinstance(res, tuple) else res
                        epi_var = torch.zeros_like(bar_mean)
                        alea_var = res[1] if isinstance(res, tuple) and len(res) >= 2 else torch.zeros_like(bar_mean)

                    selected_var, source_used = self._select_variance_tensor(epi_var, alea_var)
                    selected_var = torch.clamp(selected_var, min=0.0)

                    s_np = bar_mean.numpy()
                    a_np = samples[:, t, :]
                    sigma_norms = torch.norm(torch.sqrt(selected_var), dim=-1).numpy()

                    for i in range(self.num_samples):
                        r_i = reward_fn(s_np[i], a_np[i])
                        p_i = self.beta * float(sigma_norms[i])
                        raw_returns[i] += r_i
                        penalty_totals[i] += p_i
                        penalized_returns[i] += r_i - p_i

                    curr_states = bar_mean

            elite_indices = np.argsort(penalized_returns)[-self.num_elites:]
            elite_samples = samples[elite_indices]
            last_samples_first = samples[:, 0, :]
            last_elites_first = elite_samples[:, 0, :]
            top_idx = int(elite_indices[-1])

            if penalized_returns[top_idx] > best_penalized_return:
                best_penalized_return = float(penalized_returns[top_idx])
                best_raw_return = float(raw_returns[top_idx])
                best_penalty_total = float(penalty_totals[top_idx])
                best_trajectory = elite_samples[-1].copy()

            new_mean = np.mean(elite_samples, axis=0)
            new_std = np.std(elite_samples, axis=0) + 1e-4

            mean = 0.8 * new_mean + 0.2 * mean
            std = 0.8 * new_std + 0.2 * std

        best_action = best_trajectory[0] if best_trajectory is not None else np.zeros(self.action_dim)

        info = {
            "planner_type": "UncertaintyPenalizedCEM",
            "uncertainty_source": source_used,
            "beta": self.beta,
            "best_predicted_return": best_raw_return,
            "best_penalized_return": best_penalized_return,
            "best_uncertainty_penalty": best_penalty_total,
            "best_trajectory": best_trajectory,
            "cand_first_action_mean": (
                np.mean(last_samples_first, axis=0).tolist()
                if last_samples_first is not None
                else [0.0] * self.action_dim
            ),
            "cand_first_action_std": (
                np.std(last_samples_first, axis=0).tolist()
                if last_samples_first is not None
                else [0.0] * self.action_dim
            ),
            "elite_first_action_mean": (
                np.mean(last_elites_first, axis=0).tolist()
                if last_elites_first is not None
                else [0.0] * self.action_dim
            ),
            "elite_first_action_std": (
                np.std(last_elites_first, axis=0).tolist()
                if last_elites_first is not None
                else [0.0] * self.action_dim
            ),
        }

        return best_action, info
