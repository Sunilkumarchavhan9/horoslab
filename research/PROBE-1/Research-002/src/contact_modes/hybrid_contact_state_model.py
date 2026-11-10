"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.1: Hybrid Contact-State Dynamics Model
Couples continuous state-wrench prediction with discrete contact mode estimation.
Strictly eliminates future-information leakage: predicts mode distributions and mode sets at inference time.
"""

from __future__ import annotations
import numpy as np
import torch
import torch.nn as nn
from typing import Dict, Any, List, Tuple, Optional
from .contact_mode_definitions import ContactMode, MODE_NAMES
from .contact_mode_classifier import ContactModeClassifier


class HybridContactStateModel(nn.Module):
    """
    Hybrid Contact-State Dynamics Model.
    Predicts continuous state, contact wrenches, and discrete contact-mode transitions.
    Operates without future-mode leakage by producing predicted mode sets S_{1-alpha_mode}.
    """

    def __init__(self, continuous_dynamics_model, mode_classifier: ContactModeClassifier):
        super().__init__()
        self.continuous_model = continuous_dynamics_model
        self.mode_classifier = mode_classifier

    def eval(self):
        super().eval()
        if hasattr(self.continuous_model, "eval"):
            self.continuous_model.eval()
        if hasattr(self.mode_classifier, "eval"):
            self.mode_classifier.eval()
        return self

    def forward(self, s: torch.Tensor, a: torch.Tensor) -> torch.Tensor:
        """Forwards continuous state-transition prediction."""
        res = self.continuous_model(s, a)
        return res[0] if isinstance(res, tuple) else res

    def predict_step(
        self,
        current_state: np.ndarray,
        action: np.ndarray,
    ) -> Dict[str, Any]:
        """
        Executes a single step forward prediction without peeking at the future.
        Returns:
          - next_state: predicted continuous state vector (pose, vel, wrench)
          - mode_probs: probability distribution over 7 modes [7]
          - candidate_modes: conformal mode set S_{1-alpha_mode}
          - predicted_mode: top-1 mode index
        """
        s_tensor = torch.tensor(current_state, dtype=torch.float32).unsqueeze(0)
        a_tensor = torch.tensor(action, dtype=torch.float32).unsqueeze(0)

        with torch.no_grad():
            if hasattr(self.continuous_model, "predict_with_uncertainty"):
                pred_s, epi_var, alea_var = self.continuous_model.predict_with_uncertainty(s_tensor, a_tensor)
                next_state = pred_s.squeeze(0).numpy()
                state_uncertainty = float(torch.norm(torch.sqrt(epi_var)).numpy())
            elif isinstance(self.continuous_model, nn.Module):
                res = self.continuous_model(s_tensor, a_tensor)
                pred_s = res[0] if isinstance(res, tuple) else res
                next_state = pred_s.squeeze(0).numpy()
                state_uncertainty = 0.0
            else:
                next_state = current_state
                state_uncertainty = 0.0

            mode_probs = self.mode_classifier.predict_mode_distribution(current_state, action)
            candidate_modes = self.mode_classifier.predict_mode_set(current_state, action)
            top1_mode = int(np.argmax(mode_probs))

        return {
            "next_state": next_state,
            "mode_probs": mode_probs,
            "candidate_modes": candidate_modes,
            "predicted_mode": top1_mode,
            "predicted_mode_name": MODE_NAMES[ContactMode(top1_mode)],
            "state_uncertainty": state_uncertainty,
        }

    def predict_multistep(
        self,
        init_state: np.ndarray,
        action_sequence: np.ndarray,
        horizon: int,
        task: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Executes open-loop multi-step autoregressive rollout over horizon H.
        Returns predicted trajectories of states, modes, and mode candidate sets.
        """
        curr_state = init_state.copy()
        states = []
        mode_distributions = []
        mode_sets = []
        top_modes = []

        for h in range(horizon):
            a_h = action_sequence[h] if h < len(action_sequence) else action_sequence[-1]
            step_res = self.predict_step(curr_state, a_h)

            states.append(step_res["next_state"])
            mode_distributions.append(step_res["mode_probs"])
            mode_sets.append(step_res["candidate_modes"])
            top_modes.append(step_res["predicted_mode"])

            curr_state = step_res["next_state"]

        states_arr = np.array(states, dtype=np.float32)
        mode_dist_arr = np.array(mode_distributions, dtype=np.float32)

        # Contact forces (wrench channel for 15-D peg_in_hole, normal forces for 23-D multifinger_lift)
        if states_arr.shape[0] == 0:
            forces = np.zeros((0, 6), dtype=np.float32)
        elif task == "peg_in_hole" or (task is None and states_arr.shape[1] == 15):
            forces = states_arr[:, 9:15]
        elif task in ("multifinger_lift", "compliant_prelift") or (task is None and states_arr.shape[1] == 23):
            forces = np.pad(states_arr[:, 12:16], ((0, 0), (0, 2)), mode="constant").astype(np.float32)
        elif states_arr.shape[1] >= 15:
            forces = states_arr[:, 9:15]
        elif states_arr.shape[1] >= 6:
            forces = states_arr[:, :6]
        else:
            forces = np.pad(states_arr, ((0, 0), (0, 6 - states_arr.shape[1])), mode="constant").astype(np.float32)

        return {
            "states": states_arr,
            "mode_distributions": mode_dist_arr,
            "mode_probabilities": mode_dist_arr,
            "mode_sets": mode_sets,
            "predicted_modes": np.array(top_modes, dtype=np.int64),
            "top_modes": np.array(top_modes, dtype=np.int64),
            "contact_forces": forces,
        }
