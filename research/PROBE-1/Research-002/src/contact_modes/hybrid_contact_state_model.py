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

    def __init__(
        self,
        continuous_dynamics_model,
        mode_classifier: ContactModeClassifier,
        architecture_id: Optional[str] = None,
    ):
        super().__init__()
        self.continuous_model = continuous_dynamics_model
        self.mode_classifier = mode_classifier
        if architecture_id is not None:
            self.architecture_id = architecture_id
        else:
            cls_name = type(continuous_dynamics_model).__name__
            if "Ensemble" in cls_name:
                self.architecture_id = "B3"
            elif "Probabilistic" in cls_name:
                self.architecture_id = "B2"
            elif "Deterministic" in cls_name:
                self.architecture_id = "B1"
            else:
                self.architecture_id = cls_name

    def eval(self):
        super().eval()
        if hasattr(self.continuous_model, "eval"):
            self.continuous_model.eval()
        if hasattr(self.mode_classifier, "eval"):
            self.mode_classifier.eval()
        return self

    def forward(self, s: torch.Tensor, a: torch.Tensor) -> torch.Tensor:
        """Forwards continuous state-transition prediction."""
        if hasattr(self.continuous_model, "predict_with_uncertainty"):
            mean, _, _ = self.continuous_model.predict_with_uncertainty(s, a)
            return mean
        res = self.continuous_model(s, a)
        return res[0] if isinstance(res, tuple) else res

    def predict_with_uncertainty(
        self,
        s: torch.Tensor,
        a: torch.Tensor,
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        Unified batched uncertainty prediction returning (mean, epistemic_var, aleatoric_var).
        """
        if hasattr(self.continuous_model, "predict_with_uncertainty"):
            return self.continuous_model.predict_with_uncertainty(s, a)
        elif isinstance(self.continuous_model, nn.Module):
            res = self.continuous_model(s, a)
            if isinstance(res, tuple) and len(res) >= 2:
                mean, var = res[0], res[1]
                return mean, torch.zeros_like(var), var
            mean = res[0] if isinstance(res, tuple) else res
            zeros = torch.zeros_like(mean)
            return mean, zeros, zeros
        zeros = torch.zeros_like(s)
        return s, zeros, zeros

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
          - epistemic_uncertainty / aleatoric_uncertainty / total_uncertainty
        """
        s_tensor = torch.tensor(current_state, dtype=torch.float32).unsqueeze(0)
        a_tensor = torch.tensor(action, dtype=torch.float32).unsqueeze(0)

        with torch.no_grad():
            pred_s, epi_var, alea_var = self.predict_with_uncertainty(s_tensor, a_tensor)
            next_state = pred_s.squeeze(0).numpy()
            epi_var_np = torch.clamp(epi_var, min=0.0).squeeze(0).numpy()
            alea_var_np = torch.clamp(alea_var, min=0.0).squeeze(0).numpy()

            epistemic_uncertainty = float(np.linalg.norm(np.sqrt(epi_var_np)))
            aleatoric_uncertainty = float(np.linalg.norm(np.sqrt(alea_var_np)))
            total_uncertainty = float(np.linalg.norm(np.sqrt(epi_var_np + alea_var_np)))

            mode_probs = self.mode_classifier.predict_mode_distribution(current_state, action)
            candidate_modes = self.mode_classifier.predict_mode_set(current_state, action)
            top1_mode = int(np.argmax(mode_probs))

        return {
            "next_state": next_state,
            "mode_probs": mode_probs,
            "candidate_modes": candidate_modes,
            "predicted_mode": top1_mode,
            "predicted_mode_name": MODE_NAMES[ContactMode(top1_mode)],
            "state_uncertainty": total_uncertainty,
            "epistemic_uncertainty": epistemic_uncertainty,
            "aleatoric_uncertainty": aleatoric_uncertainty,
            "total_uncertainty": total_uncertainty,
            "epistemic_var": epi_var_np,
            "aleatoric_var": alea_var_np,
            "architecture_id": self.architecture_id,
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
        Returns predicted trajectories of states, modes, mode candidate sets, and uncertainties.
        """
        curr_state = init_state.copy()
        states = []
        mode_distributions = []
        mode_sets = []
        top_modes = []
        epistemic_uncertainties = []
        aleatoric_uncertainties = []
        total_uncertainties = []
        epistemic_vars = []
        aleatoric_vars = []

        for h in range(horizon):
            a_h = action_sequence[h] if h < len(action_sequence) else action_sequence[-1]
            step_res = self.predict_step(curr_state, a_h)

            states.append(step_res["next_state"])
            mode_distributions.append(step_res["mode_probs"])
            mode_sets.append(step_res["candidate_modes"])
            top_modes.append(step_res["predicted_mode"])
            epistemic_uncertainties.append(step_res["epistemic_uncertainty"])
            aleatoric_uncertainties.append(step_res["aleatoric_uncertainty"])
            total_uncertainties.append(step_res["total_uncertainty"])
            epistemic_vars.append(step_res["epistemic_var"])
            aleatoric_vars.append(step_res["aleatoric_var"])

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
            "architecture_id": self.architecture_id,
            "states": states_arr,
            "mode_distributions": mode_dist_arr,
            "mode_probabilities": mode_dist_arr,
            "mode_sets": mode_sets,
            "predicted_modes": np.array(top_modes, dtype=np.int64),
            "top_modes": np.array(top_modes, dtype=np.int64),
            "contact_forces": forces,
            "epistemic_uncertainties": np.array(epistemic_uncertainties, dtype=np.float32),
            "aleatoric_uncertainties": np.array(aleatoric_uncertainties, dtype=np.float32),
            "total_uncertainties": np.array(total_uncertainties, dtype=np.float32),
            "epistemic_vars": np.array(epistemic_vars, dtype=np.float32),
            "aleatoric_vars": np.array(aleatoric_vars, dtype=np.float32),
        }
