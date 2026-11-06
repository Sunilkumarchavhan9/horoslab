"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.5 Remediation: Recovery-Aware CEM Trajectory Optimizer

Integrates predictive barrier evaluation directly into the Cross-Entropy Method
objective function, shifting elite trajectory selection toward candidates that
establish normal force preload prior to vertical lift, eliminating safety-filter limit cycles.
"""

from __future__ import annotations
import numpy as np
import torch
from typing import Dict, Any, Callable, Tuple, Optional


class RecoveryAwareCEMPlanner:
    """
    Cross-Entropy Method planner with predictive barrier constraint penalties.
    Actively coordinates with runtime safety filter by penalizing candidate sequences
    that approach the Coulomb slip boundary or crush limits.
    """

    def __init__(
        self,
        world_model,
        action_dim: int,
        action_bounds: Tuple[np.ndarray, np.ndarray],
        horizon: int = 10,
        num_samples: int = 60,
        elite_fraction: float = 0.15,
        num_iterations: int = 2,
        slip_penalty_weight: float = 25.0,
        crush_penalty_weight: float = 15.0,
    ):
        self.world_model = world_model
        self.action_dim = action_dim
        self.lower_bound, self.upper_bound = action_bounds
        self.horizon = horizon
        self.num_samples = num_samples
        self.num_elites = max(1, int(num_samples * elite_fraction))
        self.num_iterations = num_iterations
        self.slip_penalty_weight = slip_penalty_weight
        self.crush_penalty_weight = crush_penalty_weight

    def plan(
        self,
        current_state: np.ndarray,
        reward_fn: Callable[[np.ndarray, np.ndarray], float],
        warm_start_mean: Optional[np.ndarray] = None,
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Plans an optimal safe action sequence.
        Returns:
          - best_action: first action a_0
          - info: plan diagnostic stats
        """
        self.world_model.eval()
        mean = warm_start_mean if warm_start_mean is not None else np.zeros((self.horizon, self.action_dim))
        std = np.ones((self.horizon, self.action_dim)) * 0.4

        best_trajectory = None
        best_predicted_return = -float("inf")
        s_curr_tensor = torch.tensor(current_state, dtype=torch.float32)

        for iteration in range(self.num_iterations):
            samples = np.random.normal(mean, std, size=(self.num_samples, self.horizon, self.action_dim))
            samples = np.clip(samples, self.lower_bound, self.upper_bound)
            samples_tensor = torch.tensor(samples, dtype=torch.float32)

            curr_states = s_curr_tensor.unsqueeze(0).expand(self.num_samples, -1).clone()
            returns = np.zeros(self.num_samples, dtype=np.float64)

            with torch.no_grad():
                for t in range(self.horizon):
                    a_t = samples_tensor[:, t, :]
                    if hasattr(self.world_model, "predict_with_uncertainty"):
                        next_states, _, _ = self.world_model.predict_with_uncertainty(curr_states, a_t)
                    else:
                        res = self.world_model(curr_states, a_t)
                        next_states = res[0] if isinstance(res, tuple) else res

                    s_np = next_states.numpy()
                    a_np = samples[:, t, :]

                    for i in range(self.num_samples):
                        base_r = reward_fn(s_np[i], a_np[i])

                        # Predictive Barrier Penalties
                        barrier_penalty = 0.0
                        if len(s_np[i]) >= 23:  # multifinger lift
                            # slip ratio in s[16:20], normal force in s[8:12]
                            slip_vals = s_np[i, 16:20]
                            max_slip = float(np.max(slip_vals))
                            if max_slip > 0.80:
                                barrier_penalty += self.slip_penalty_weight * (max_slip - 0.80)

                            fn_vals = s_np[i, 8:12]
                            max_fn = float(np.max(fn_vals))
                            if max_fn > 20.0:
                                barrier_penalty += self.crush_penalty_weight * (max_fn - 20.0)

                        returns[i] += (base_r - barrier_penalty)

                    curr_states = next_states

            # Select elite trajectories
            elite_indices = np.argsort(returns)[-self.num_elites:]
            elite_samples = samples[elite_indices]

            if returns[elite_indices[-1]] > best_predicted_return:
                best_predicted_return = float(returns[elite_indices[-1]])
                best_trajectory = elite_samples[-1]

            new_mean = np.mean(elite_samples, axis=0)
            new_std = np.std(elite_samples, axis=0) + 1e-4

            mean = 0.8 * new_mean + 0.2 * mean
            std = 0.8 * new_std + 0.2 * std

        best_action = best_trajectory[0] if best_trajectory is not None else np.zeros(self.action_dim)

        info = {
            "best_predicted_return": best_predicted_return,
            "best_trajectory": best_trajectory,
        }

        return best_action, info

