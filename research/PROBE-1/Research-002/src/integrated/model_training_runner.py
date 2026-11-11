"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.5 / P2.8 — Five-Way Integrated Evaluation: Model Training Runner

Standardizes hybrid world model training and conformal calibration across B1–B4:
- B1: DeterministicWorldModel (deterministic reference)
- B2: ProbabilisticWorldModel (heteroscedastic Gaussian aleatoric uncertainty)
- B3: EnsembleWorldModel (E=5 bootstrapped probabilistic members -> epistemic + aleatoric)
- B4: ContactStratifiedConformalWM (contact-stratified conformal prediction intervals)
- Coupled with ContactModeClassifier (7-mode discrete stratum classification) into HybridContactStateModel
"""

from __future__ import annotations
import os
import time
from typing import Dict, Any, List, Tuple, Optional, Sequence
import numpy as np
import torch
import torch.optim as optim

from src.contact_modes.contact_mode_definitions import NUM_MODES
from src.contact_modes.contact_mode_classifier import ContactModeClassifier
from src.contact_modes.hybrid_contact_state_model import HybridContactStateModel
from src.models.deterministic_wm import DeterministicWorldModel
from src.models.probabilistic_wm import ProbabilisticWorldModel
from src.models.ensemble_wm import EnsembleWorldModel
from src.models.stratified_conformal_wm import ContactStratifiedConformalWM


ARCHITECTURE_ALIASES = {
    "b1": "B1",
    "deterministic": "B1",
    "b1_deterministic": "B1",
    "b2": "B2",
    "probabilistic": "B2",
    "b2_probabilistic": "B2",
    "b3": "B3",
    "ensemble": "B3",
    "b3_ensemble": "B3",
    "b4": "B4",
    "conformal": "B4",
    "b4_conformal": "B4",
}


def normalize_architecture_id(model_type: str) -> str:
    key = model_type.strip().lower()
    if key not in ARCHITECTURE_ALIASES:
        raise ValueError(
            f"Unsupported world-model architecture '{model_type}'. Expected one of B1, B2, B3, B4."
        )
    return ARCHITECTURE_ALIASES[key]


class ModelTrainingRunner:
    """
    Standardized trainer for B1–B3 Hybrid Contact-State Dynamics models and B4 Conformal wrapper.
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
        elif task in ("multifinger_lift", "compliant_prelift", "compliant_lift"):
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
        episodes: List[Dict[str, Any]],
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
        model_type: str = "B1",
        ensemble_size: int = 5,
    ) -> Any:
        """
        Trains continuous dynamics model (B1, B2, or B3 E=5) and 7-mode contact classifier.
        """
        arch_id = normalize_architecture_id(model_type)
        if arch_id == "B4":
            raise ValueError(
                "B4 (ContactStratifiedConformalWM) is a conformal calibration wrapper, not a "
                "neural training target. Train B1/B2/B3 first, then call calibrate_conformal_b4() "
                "on disjoint calibration transitions."
            )

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

        # 1. Continuous dynamics model by architecture
        wm_losses: List[float] = []
        nll_loss_final: Optional[float] = None

        if arch_id == "B1":
            continuous_wm = DeterministicWorldModel(self.state_dim, self.action_dim, hidden_dim=self.hidden_dim)
            opt_wm = optim.Adam(continuous_wm.parameters(), lr=learning_rate)
            for _ in range(n_epochs):
                opt_wm.zero_grad()
                loss = torch.mean((continuous_wm(s_arr, a_arr) - next_s_arr) ** 2)
                loss.backward()
                opt_wm.step()
                wm_losses.append(float(loss.item()))

        elif arch_id == "B2":
            continuous_wm = ProbabilisticWorldModel(self.state_dim, self.action_dim, hidden_dim=self.hidden_dim)
            opt_wm = optim.Adam(continuous_wm.parameters(), lr=learning_rate)
            for _ in range(n_epochs):
                opt_wm.zero_grad()
                loss = continuous_wm.loss(s_arr, a_arr, next_s_arr)
                loss.backward()
                opt_wm.step()
                wm_losses.append(float(loss.item()))
            nll_loss_final = round(wm_losses[-1], 6) if wm_losses else None

        else:  # B3: Bootstrapped Deep Ensemble (E=5)
            continuous_wm = EnsembleWorldModel(
                self.state_dim,
                self.action_dim,
                hidden_dim=self.hidden_dim,
                ensemble_size=ensemble_size,
            )
            n_trans = len(training_transitions)
            member_final_losses = []
            for e_idx, member in enumerate(continuous_wm.models):
                rng_boot = np.random.RandomState(self.seed + 101 * (e_idx + 1))
                torch.manual_seed(self.seed + 101 * (e_idx + 1))
                boot_idx = rng_boot.randint(0, n_trans, size=n_trans)
                boot_t = torch.tensor(boot_idx, dtype=torch.long)
                s_b, a_b, ns_b = s_arr[boot_t], a_arr[boot_t], next_s_arr[boot_t]

                opt_e = optim.Adam(member.parameters(), lr=learning_rate)
                last_loss = 0.0
                for _ in range(n_epochs):
                    opt_e.zero_grad()
                    loss = member.loss(s_b, a_b, ns_b)
                    loss.backward()
                    opt_e.step()
                    last_loss = float(loss.item())
                member_final_losses.append(last_loss)

            mean_nll = float(np.mean(member_final_losses)) if member_final_losses else 0.0
            wm_losses.append(mean_nll)
            nll_loss_final = round(mean_nll, 6)

        # Reset seed deterministically before classifier training
        torch.manual_seed(self.seed)
        np.random.seed(self.seed)

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

        hybrid_model = HybridContactStateModel(continuous_wm, mode_clf, architecture_id=arch_id)

        with torch.no_grad():
            mean_pred = hybrid_model(s_arr, a_arr)
            final_mse = float(torch.mean((mean_pred - next_s_arr) ** 2).item())

        elapsed = round(time.time() - t0, 2)
        train_stats = {
            "architecture_id": arch_id,
            "model_class": type(continuous_wm).__name__,
            "ensemble_size": ensemble_size if arch_id == "B3" else 1,
            "num_transitions": len(training_transitions),
            "epochs": n_epochs,
            "final_wm_loss": round(wm_losses[-1], 6) if wm_losses else 0.0,
            "final_mse_loss": round(final_mse, 6),
            "final_nll_loss": nll_loss_final,
            "final_clf_loss": round(clf_losses[-1], 6) if clf_losses else 0.0,
            "training_time_seconds": elapsed,
        }

        if checkpoint_path is not None:
            ckpt_dir = os.path.dirname(checkpoint_path)
            if ckpt_dir:
                os.makedirs(ckpt_dir, exist_ok=True)
            torch.save({
                "architecture_id": arch_id,
                "model_class": type(continuous_wm).__name__,
                "ensemble_size": ensemble_size if arch_id == "B3" else 1,
                "continuous_model_state": continuous_wm.state_dict(),
                "mode_classifier_state": mode_clf.state_dict(),
                "stats": train_stats,
            }, checkpoint_path)

        if return_stats:
            return hybrid_model, train_stats
        return hybrid_model

    def calibrate_conformal_b4(
        self,
        base_model: Any,
        calib_transitions: List[Tuple[np.ndarray, np.ndarray, np.ndarray, int]],
        alpha: float = 0.10,
        num_strata: int = NUM_MODES,
        min_stratum_samples: int = 11,
    ) -> ContactStratifiedConformalWM:
        """
        Builds and calibrates B4 (ContactStratifiedConformalWM) on held-out calibration transitions.
        Preserves B4 strictly as a conformal interval model separate from B2/B3 probabilistic nets.
        """
        if len(calib_transitions) == 0:
            raise ValueError("Cannot calibrate B4 ContactStratifiedConformalWM with 0 calibration transitions.")

        underlying = base_model.continuous_model if isinstance(base_model, HybridContactStateModel) else base_model
        b4_model = ContactStratifiedConformalWM(
            base_model=underlying,
            num_strata=num_strata,
            alpha=alpha,
            min_stratum_samples=min_stratum_samples,
        )

        s_cal = np.array([x[0] for x in calib_transitions], dtype=np.float32)
        a_cal = np.array([x[1] for x in calib_transitions], dtype=np.float32)
        t_cal = np.array([x[2] for x in calib_transitions], dtype=np.float32)
        strata_cal = np.array([int(x[3]) for x in calib_transitions], dtype=np.int64)

        b4_model.calibrate(s_cal, a_cal, t_cal, strata_cal)
        return b4_model

    def train_all_architectures(
        self,
        training_transitions: List[Tuple[np.ndarray, np.ndarray, np.ndarray, int]],
        calib_transitions: Optional[List[Tuple[np.ndarray, np.ndarray, np.ndarray, int]]] = None,
        architectures: Sequence[str] = ("B1", "B2", "B3", "B4"),
        epochs: Optional[int] = None,
        lr: Optional[float] = None,
        alpha: float = 0.10,
        ensemble_size: int = 5,
    ) -> Dict[str, Any]:
        """
        Trains and prepares B1, B2, B3 independently on training_transitions, and calibrates B4 on
        disjoint calib_transitions (wrapping B1 base predictor without leakage).
        """
        models: Dict[str, Any] = {}
        stats: Dict[str, Any] = {}
        requested = [normalize_architecture_id(a) for a in architectures]

        for arch in ("B1", "B2", "B3"):
            if arch in requested:
                m, st = self.train_hybrid_model(
                    training_transitions=training_transitions,
                    epochs=epochs,
                    lr=lr,
                    return_stats=True,
                    model_type=arch,
                    ensemble_size=ensemble_size,
                )
                models[arch] = m
                stats[arch] = st

        if "B4" in requested:
            if calib_transitions is None or len(calib_transitions) == 0:
                raise ValueError(
                    "calib_transitions from a disjoint calibration pool must be supplied to calibrate B4."
                )
            if "B1" in models:
                base_for_b4 = models["B1"]
            else:
                base_for_b4, _ = self.train_hybrid_model(
                    training_transitions=training_transitions,
                    epochs=epochs,
                    lr=lr,
                    return_stats=True,
                    model_type="B1",
                )
            b4 = self.calibrate_conformal_b4(
                base_model=base_for_b4,
                calib_transitions=calib_transitions,
                alpha=alpha,
                num_strata=NUM_MODES,
            )
            models["B4"] = b4
            stats["B4"] = {
                "architecture_id": "B4",
                "model_class": "ContactStratifiedConformalWM",
                "is_conformal_architecture": True,
                "calibration_diagnostics": b4.get_calibration_diagnostics(),
            }

        return {"models": models, "stats": stats}
