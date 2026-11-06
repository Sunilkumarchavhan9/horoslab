"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.5 — Five-Way Integrated Evaluation: Model Training Runner

Standardizes hybrid world model training across datasets D0, D1, D2, D3, D4:
- DeterministicWorldModel (state and contact wrench dynamics)
- ContactModeClassifier (7-mode discrete stratum classification)
- Coupled into HybridContactStateModel
- Checkpointing and parameter verification
"""

from __future__ import annotations
import os
import time
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
import torch
import torch.optim as optim

from src.contact_modes.contact_mode_definitions import NUM_MODES
from src.contact_modes.contact_mode_classifier import ContactModeClassifier
from src.contact_modes.hybrid_contact_state_model import HybridContactStateModel
from src.models.deterministic_wm import DeterministicWorldModel


class ModelTrainingRunner:
    """
    Standardized trainer for Hybrid Contact-State Dynamics models.
    """

    def __init__(
        self,
        state_dim: Optional[int] = None,
        action_dim: Optional[int] = None,
        task: Optional[str] = None,
        hidden_dim: int = 64,
        epochs: int = 45,
        lr: float = 2e-3,
        seed: int = 42,
    ):
        if task == "peg_in_hole":
            self.state_dim = 15
            self.action_dim = 6
        elif task == "multifinger_lift":
            self.state_dim = 23
            self.action_dim = 5
        else:
            self.state_dim = state_dim or 15
            self.action_dim = action_dim or 6
        self.task = task
        self.hidden_dim = hidden_dim
        self.epochs = epochs
        self.lr = lr
        self.seed = seed

    def extract_transitions(
        self,
        episodes: List[Dict[str, Any]]
    ) -> List[Tuple[np.ndarray, np.ndarray, np.ndarray, int]]:
        """Extracts (s_t, a_t, s_{t+1}, m_t) transitions from an episode list."""
        transitions = []
        for ep in episodes:
            states = ep.get("realized_states")
            actions = ep.get("actions")
            modes = ep.get("realized_modes")

            if states is None or len(states) < 2 or actions is None:
                continue

            H = min(len(states) - 1, len(actions))
            for t in range(H):
                s_t = states[t]
                a_t = actions[t]
                s_next = states[t + 1]
                m_t = int(modes[t]) if modes is not None and len(modes) > t else 0
                transitions.append((s_t, a_t, s_next, m_t))

        return transitions

    def train_hybrid_model(
        self,
        training_transitions: List[Tuple[np.ndarray, np.ndarray, np.ndarray, int]],
        checkpoint_path: Optional[str] = None,
        epochs: Optional[int] = None,
        lr: Optional[float] = None,
        return_stats: bool = False,
    ) -> Any:
        """
        Trains deterministic state-transition model and contact mode classifier on transitions.
        """
        torch.manual_seed(self.seed)
        np.random.seed(self.seed)
        t0 = time.time()

        n_epochs = epochs if epochs is not None else self.epochs
        learning_rate = lr if lr is not None else self.lr

        if len(training_transitions) == 0:
            raise ValueError("Cannot train world model with 0 transitions.")

        s_arr = torch.tensor(np.array([x[0] for x in training_transitions]), dtype=torch.float32)
        a_arr = torch.tensor(np.array([x[1] for x in training_transitions]), dtype=torch.float32)
        next_s_arr = torch.tensor(np.array([x[2] for x in training_transitions]), dtype=torch.float32)
        m_arr = torch.tensor(np.array([x[3] for x in training_transitions]), dtype=torch.long)

        # 1. Continuous dynamics model
        det_wm = DeterministicWorldModel(self.state_dim, self.action_dim, hidden_dim=self.hidden_dim)
        opt_wm = optim.Adam(det_wm.parameters(), lr=learning_rate)
        wm_losses = []
        for _ in range(n_epochs):
            opt_wm.zero_grad()
            loss = torch.mean((det_wm(s_arr, a_arr) - next_s_arr) ** 2)
            loss.backward()
            opt_wm.step()
            wm_losses.append(float(loss.item()))

        # 2. Contact mode classifier
        mode_clf = ContactModeClassifier(self.state_dim, self.action_dim, hidden_dim=self.hidden_dim, num_modes=NUM_MODES)
        opt_clf = optim.Adam(mode_clf.parameters(), lr=learning_rate)
        loss_ce = torch.nn.CrossEntropyLoss()
        clf_losses = []
        for _ in range(n_epochs):
            opt_clf.zero_grad()
            loss = loss_ce(mode_clf(s_arr, a_arr), m_arr)
            loss.backward()
            opt_clf.step()
            clf_losses.append(float(loss.item()))

        hybrid_model = HybridContactStateModel(det_wm, mode_clf)

        elapsed = round(time.time() - t0, 2)
        train_stats = {
            "num_transitions": len(training_transitions),
            "epochs": n_epochs,
            "final_wm_loss": round(wm_losses[-1], 6) if wm_losses else 0.0,
            "final_clf_loss": round(clf_losses[-1], 6) if clf_losses else 0.0,
            "training_time_seconds": elapsed,
        }

        if checkpoint_path is not None:
            os.makedirs(os.path.dirname(checkpoint_path), exist_ok=True)
            torch.save({
                "continuous_model_state": det_wm.state_dict(),
                "mode_classifier_state": mode_clf.state_dict(),
                "stats": train_stats,
            }, checkpoint_path)

        if return_stats:
            return hybrid_model, train_stats
        return hybrid_model
