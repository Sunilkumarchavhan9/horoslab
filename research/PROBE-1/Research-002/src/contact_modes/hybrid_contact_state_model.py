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


class HybridContactStateModel:
    """
    Hybrid Contact-State Dynamics Model.
    Predicts continuous state, contact wrenches, and discrete contact-mode transitions.
    Operates without future-mode leakage by producing predicted mode sets S_{1-alpha_mode}.
    """

    def __init__(self, continuous_dynamics_model, mode_classifier: ContactModeClassifier):
        self.continuous_model = continuous_dynamics_model
        self.mode_classifier = mode_classifier

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
            # Continuous state prediction
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

            # Discrete contact mode prediction (Leakage-free)
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
            a_h = action_sequence[h]
            step_res = self.predict_step(curr_state, a_h)

            states.append(step_res["next_state"])
            mode_distributions.append(step_res["mode_probs"])
            mode_sets.append(step_res["candidate_modes"])
            top_modes.append(step_res["predicted_mode"])

            curr_state = step_res["next_state"]

        return {
            "states": np.array(states),
            "mode_distributions": np.array(mode_distributions),
            "mode_sets": mode_sets,
            "predicted_modes": np.array(top_modes),
        }
