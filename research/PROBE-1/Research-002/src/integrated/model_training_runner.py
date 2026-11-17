"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.5 / P2.8 — Five-Way Integrated Evaluation: Model Training Runner

Standardizes hybrid world model training and conformal calibration across B1–B4:
- B1: DeterministicWorldModel (deterministic reference, MSE)
- B2: ProbabilisticWorldModel (heteroscedastic Gaussian aleatoric uncertainty, NLL)
- B3: EnsembleWorldModel (E=5 bootstrapped probabilistic members -> epistemic + aleatoric)
- B4: ContactStratifiedConformalWM (contact-stratified conformal prediction intervals)
- Coupled with ContactModeClassifier (7-mode discrete stratum classification) into HybridContactStateModel

Phase 3.4.1 Enhancements:
- Uniform per-feature z-score normalization (FeatureStandardizer) fitted strictly on training data
- Uniform global gradient-norm clipping (max_grad_norm = 1.0) with pre-clip norm & frequency logging
- Independent per-member B3 checkpoints (b3_member_0..4.pt) with bootstrap provenance & loss history
- Physical-unit B4 calibration with 29-sample operational floor and APS persistence
"""

from __future__ import annotations
import hashlib
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
from src.models.normalization import FeatureStandardizer


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


def _summarize_grad_norms(norms: List[float], max_grad_norm: float) -> Dict[str, Any]:
    if not norms:
        return {
            "max_grad_norm": float(max_grad_norm),
            "steps": 0,
            "clip_count": 0,
            "clip_frequency": 0.0,
            "max_pre_clip_grad_norm": 0.0,
            "mean_pre_clip_grad_norm": 0.0,
            "pre_clip_grad_norms": [],
        }
    clip_count = sum(1 for g in norms if g > max_grad_norm)
    return {
        "max_grad_norm": float(max_grad_norm),
        "steps": len(norms),
        "clip_count": int(clip_count),
        "clip_frequency": round(clip_count / len(norms), 6),
        "max_pre_clip_grad_norm": round(float(max(norms)), 6),
        "mean_pre_clip_grad_norm": round(float(np.mean(norms)), 6),
        "pre_clip_grad_norms": [round(float(g), 6) for g in norms],
    }


def load_hybrid_checkpoint(checkpoint_path: str) -> Tuple[HybridContactStateModel, Dict[str, Any]]:
    """Loads a saved B1/B2/B3 HybridContactStateModel checkpoint including normalization scaler."""
    payload = torch.load(checkpoint_path, map_location="cpu", weights_only=False)
    arch_id = payload["architecture_id"]
    state_dim = int(payload["state_dim"])
    action_dim = int(payload["action_dim"])
    hidden_dim = int(payload["hidden_dim"])
    ensemble_size = int(payload.get("ensemble_size", 5))

    if arch_id == "B1":
        cont = DeterministicWorldModel(state_dim, action_dim, hidden_dim=hidden_dim)
    elif arch_id == "B2":
        cont = ProbabilisticWorldModel(state_dim, action_dim, hidden_dim=hidden_dim)
    elif arch_id == "B3":
        cont = EnsembleWorldModel(state_dim, action_dim, hidden_dim=hidden_dim, ensemble_size=ensemble_size)
    else:
        raise ValueError(f"Unsupported checkpoint architecture '{arch_id}'.")

    cont.load_state_dict(payload["continuous_model_state"])
    mode_clf = ContactModeClassifier(state_dim, action_dim, hidden_dim=hidden_dim, num_modes=NUM_MODES)
    mode_clf.load_state_dict(payload["mode_classifier_state"])
    if "aps_quantile" in payload and payload["aps_quantile"] is not None:
        mode_clf.aps_quantile = float(payload["aps_quantile"])

    norm_dict = payload.get("normalization")
    scaler = FeatureStandardizer.from_dict(norm_dict) if norm_dict is not None else None
    hybrid = HybridContactStateModel(cont, mode_clf, architecture_id=arch_id, feature_scaler=scaler)
    hybrid.eval()
    return hybrid, payload


def load_b3_ensemble_from_members(
    member_paths: Sequence[str],
    ensemble_checkpoint_path: Optional[str] = None,
) -> Tuple[EnsembleWorldModel, List[Dict[str, Any]]]:
    """Reconstructs an EnsembleWorldModel cleanly from individually saved B3 member checkpoints."""
    if len(member_paths) == 0:
        raise ValueError("member_paths must be non-empty.")

    payloads = [torch.load(p, map_location="cpu", weights_only=False) for p in member_paths]
    first = payloads[0]
    ensemble = EnsembleWorldModel(
        state_dim=int(first["state_dim"]),
        action_dim=int(first["action_dim"]),
        hidden_dim=int(first["hidden_dim"]),
        ensemble_size=len(payloads),
    )
    for idx, p in enumerate(payloads):
        ensemble.models[idx].load_state_dict(p["member_model_state"])

    if ensemble_checkpoint_path is not None:
        ens_payload = torch.load(ensemble_checkpoint_path, map_location="cpu", weights_only=False)
        norm_dict = ens_payload.get("normalization")
        scaler = FeatureStandardizer.from_dict(norm_dict) if norm_dict is not None else None
        mode_clf = ContactModeClassifier(
            int(first["state_dim"]), int(first["action_dim"]), hidden_dim=int(first["hidden_dim"]), num_modes=NUM_MODES
        )
        mode_clf.load_state_dict(ens_payload["mode_classifier_state"])
        if "aps_quantile" in ens_payload and ens_payload["aps_quantile"] is not None:
            mode_clf.aps_quantile = float(ens_payload["aps_quantile"])
        hybrid = HybridContactStateModel(ensemble, mode_clf, architecture_id="B3", feature_scaler=scaler)
        hybrid.eval()
        return hybrid, payloads

    ensemble.eval()
    return ensemble, payloads


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
        max_grad_norm: float = 1.0,
        normalize: bool = True,
        min_std: float = 1e-4,
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
        self.max_grad_norm = float(max_grad_norm)
        self.normalize = bool(normalize)
        self.min_std = float(min_std)

    def extract_transitions(
        self,
        episodes: List[Dict[str, Any]],
    ) -> List[Tuple[np.ndarray, np.ndarray, np.ndarray, int]]:
        """
        Extracts aligned (s_t, a_t, s_{t+1}, m_t) transitions from an episode list.
        Uses explicit realized_next_states when available (zero-loss on unpadded early termination)
        and preserves legacy s[t] -> s[t+1] extraction for [T+1] trajectory arrays.
        """
        transitions = []
        for ep in episodes:
            states = ep.get("realized_states")
            next_states = ep.get("realized_next_states")
            actions = ep.get("actions")
            modes = ep.get("realized_modes")

            if states is None or actions is None or len(actions) == 0:
                continue

            if next_states is not None:
                H = min(len(states), len(next_states), len(actions))
                for t in range(H):
                    m_t = int(modes[t]) if modes is not None and len(modes) > t else 0
                    transitions.append((states[t], actions[t], next_states[t], m_t))
            else:
                if len(states) < 2:
                    continue
                H = min(len(states) - 1, len(actions))
                for t in range(H):
                    m_t = int(modes[t]) if modes is not None and len(modes) > t else 0
                    transitions.append((states[t], actions[t], states[t + 1], m_t))

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
        feature_scaler: Optional[FeatureStandardizer] = None,
        member_checkpoint_dir: Optional[str] = None,
        max_grad_norm: Optional[float] = None,
        extra_metadata: Optional[Dict[str, Any]] = None,
    ) -> Any:
        """
        Trains continuous dynamics model (B1, B2, or B3 E=5) and 7-mode contact classifier
        under shared z-score standardization and global gradient clipping.
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
        grad_clip_norm = float(max_grad_norm) if max_grad_norm is not None else self.max_grad_norm

        if len(training_transitions) == 0:
            raise ValueError("Cannot train world model with 0 transitions.")

        s_raw = torch.tensor(np.array([x[0] for x in training_transitions]), dtype=torch.float32)
        a_raw = torch.tensor(np.array([x[1] for x in training_transitions]), dtype=torch.float32)
        next_s_raw = torch.tensor(np.array([x[2] for x in training_transitions]), dtype=torch.float32)
        m_arr = torch.tensor(np.array([x[3] for x in training_transitions]), dtype=torch.long)

        active_scaler: Optional[FeatureStandardizer]
        if feature_scaler is not None:
            active_scaler = feature_scaler
        elif self.normalize:
            active_scaler = FeatureStandardizer.fit_from_transitions(
                training_transitions,
                min_std=self.min_std,
                task=self.task,
                fit_source="single_split_training_only",
            )
        else:
            active_scaler = None

        if active_scaler is not None:
            s_in = active_scaler.normalize_state_tensor(s_raw)
            a_in = active_scaler.normalize_action_tensor(a_raw)
            next_s_in = active_scaler.normalize_target_next_state_tensor(s_raw, next_s_raw)
        else:
            s_in, a_in, next_s_in = s_raw, a_raw, next_s_raw

        def _clip_and_step(loss: torch.Tensor, params, opt: optim.Optimizer) -> float:
            opt.zero_grad()
            loss.backward()
            pre_norm = float(torch.nn.utils.clip_grad_norm_(params, max_norm=grad_clip_norm).item())
            opt.step()
            return pre_norm

        # 1. Continuous dynamics model by architecture
        wm_losses: List[float] = []
        wm_grad_norms: List[float] = []
        nll_loss_final: Optional[float] = None
        member_artifacts: List[Dict[str, Any]] = []
        member_paths: List[str] = []

        resolved_member_dir = member_checkpoint_dir
        if resolved_member_dir is None and checkpoint_path is not None and arch_id == "B3":
            resolved_member_dir = os.path.dirname(checkpoint_path)

        if arch_id == "B1":
            continuous_wm = DeterministicWorldModel(self.state_dim, self.action_dim, hidden_dim=self.hidden_dim)
            opt_wm = optim.Adam(continuous_wm.parameters(), lr=learning_rate)
            for _ in range(n_epochs):
                loss = torch.mean((continuous_wm(s_in, a_in) - next_s_in) ** 2)
                gnorm = _clip_and_step(loss, continuous_wm.parameters(), opt_wm)
                wm_losses.append(float(loss.item()))
                wm_grad_norms.append(gnorm)

        elif arch_id == "B2":
            continuous_wm = ProbabilisticWorldModel(self.state_dim, self.action_dim, hidden_dim=self.hidden_dim)
            opt_wm = optim.Adam(continuous_wm.parameters(), lr=learning_rate)
            for _ in range(n_epochs):
                loss = continuous_wm.loss(s_in, a_in, next_s_in)
                gnorm = _clip_and_step(loss, continuous_wm.parameters(), opt_wm)
                wm_losses.append(float(loss.item()))
                wm_grad_norms.append(gnorm)
            nll_loss_final = round(wm_losses[-1], 6) if wm_losses else None

        else:  # B3: Bootstrapped Deep Ensemble (E=5)
            continuous_wm = EnsembleWorldModel(
                self.state_dim,
                self.action_dim,
                hidden_dim=self.hidden_dim,
                ensemble_size=ensemble_size,
            )
            n_trans = len(training_transitions)
            member_final_losses: List[float] = []
            for e_idx, member in enumerate(continuous_wm.models):
                boot_seed = int(self.seed + 101 * (e_idx + 1))
                rng_boot = np.random.RandomState(boot_seed)
                torch.manual_seed(boot_seed)
                boot_idx = rng_boot.randint(0, n_trans, size=n_trans)
                boot_t = torch.tensor(boot_idx, dtype=torch.long)
                s_b, a_b, ns_b = s_in[boot_t], a_in[boot_t], next_s_in[boot_t]

                opt_e = optim.Adam(member.parameters(), lr=learning_rate)
                member_losses: List[float] = []
                member_gnorms: List[float] = []
                for _ in range(n_epochs):
                    loss = member.loss(s_b, a_b, ns_b)
                    gnorm = _clip_and_step(loss, member.parameters(), opt_e)
                    member_losses.append(float(loss.item()))
                    member_gnorms.append(gnorm)
                    wm_grad_norms.append(gnorm)

                last_loss = member_losses[-1] if member_losses else 0.0
                member_final_losses.append(last_loss)
                idx_sha = hashlib.sha256(np.asarray(boot_idx, dtype=np.int64).tobytes()).hexdigest()
                member_clip_summary = _summarize_grad_norms(member_gnorms, grad_clip_norm)

                member_record = {
                    "architecture_id": "B3_member",
                    "member_index": int(e_idx),
                    "ensemble_size": int(ensemble_size),
                    "model_class": type(member).__name__,
                    "state_dim": self.state_dim,
                    "action_dim": self.action_dim,
                    "hidden_dim": self.hidden_dim,
                    "bootstrap_seed": boot_seed,
                    "bootstrap_provenance": {
                        "bootstrap_seed": boot_seed,
                        "num_transitions": n_trans,
                        "sample_with_replacement": True,
                        "unique_sample_count": int(len(set(boot_idx.tolist()))),
                        "indices_sha256": idx_sha,
                        "bootstrap_indices": boot_idx.tolist(),
                    },
                    "training_config": {
                        "epochs": n_epochs,
                        "lr": learning_rate,
                        "optimizer": "Adam",
                        "max_grad_norm": grad_clip_norm,
                        "normalize": active_scaler is not None,
                        "task": self.task,
                        "parent_seed": self.seed,
                    },
                    "loss_history": [round(v, 6) for v in member_losses],
                    "final_nll_loss": round(last_loss, 6),
                    "grad_clip_stats": member_clip_summary,
                    "normalization": active_scaler.to_dict() if active_scaler is not None else None,
                    "metadata": dict(extra_metadata) if extra_metadata else {},
                }
                member_artifacts.append(member_record)

                if resolved_member_dir:
                    os.makedirs(resolved_member_dir, exist_ok=True)
                    m_path = os.path.join(resolved_member_dir, f"b3_member_{e_idx}.pt")
                    member_save = dict(member_record)
                    member_save["member_model_state"] = member.state_dict()
                    torch.save(member_save, m_path)
                    member_paths.append(m_path)

            mean_nll = float(np.mean(member_final_losses)) if member_final_losses else 0.0
            wm_losses.append(mean_nll)
            nll_loss_final = round(mean_nll, 6)

        # Reset seed deterministically before classifier training
        torch.manual_seed(self.seed)
        np.random.seed(self.seed)

        # 2. Contact mode classifier (discrete targets m_arr never normalized)
        mode_clf = ContactModeClassifier(self.state_dim, self.action_dim, hidden_dim=self.hidden_dim, num_modes=NUM_MODES)
        opt_clf = optim.Adam(mode_clf.parameters(), lr=learning_rate)
        loss_ce = torch.nn.CrossEntropyLoss()
        clf_losses: List[float] = []
        clf_gnorms: List[float] = []
        for _ in range(n_epochs):
            loss = loss_ce(mode_clf(s_in, a_in), m_arr)
            gnorm = _clip_and_step(loss, mode_clf.parameters(), opt_clf)
            clf_losses.append(float(loss.item()))
            clf_gnorms.append(gnorm)

        hybrid_model = HybridContactStateModel(
            continuous_wm,
            mode_clf,
            architecture_id=arch_id,
            feature_scaler=active_scaler,
        )
        hybrid_model.eval()

        with torch.no_grad():
            mean_pred_phys = hybrid_model(s_raw, a_raw)
            final_mse = float(torch.mean((mean_pred_phys - next_s_raw) ** 2).item())
            phys_nll: Optional[float] = None
            if arch_id in ("B2", "B3"):
                phys_nll = round(float(hybrid_model.compute_nll(s_raw, a_raw, next_s_raw).item()), 6)

        elapsed = round(time.time() - t0, 2)
        wm_clip_summary = _summarize_grad_norms(wm_grad_norms, grad_clip_norm)
        clf_clip_summary = _summarize_grad_norms(clf_gnorms, grad_clip_norm)

        training_config = {
            "task": self.task,
            "state_dim": self.state_dim,
            "action_dim": self.action_dim,
            "hidden_dim": self.hidden_dim,
            "epochs": n_epochs,
            "lr": learning_rate,
            "optimizer": "Adam",
            "max_grad_norm": grad_clip_norm,
            "normalize": active_scaler is not None,
            "min_std": self.min_std,
            "seed": self.seed,
            "ensemble_size": ensemble_size if arch_id == "B3" else 1,
        }

        train_stats = {
            "architecture_id": arch_id,
            "model_class": type(continuous_wm).__name__,
            "ensemble_size": ensemble_size if arch_id == "B3" else 1,
            "num_transitions": len(training_transitions),
            "epochs": n_epochs,
            "normalized": active_scaler is not None,
            "max_grad_norm": grad_clip_norm,
            "final_wm_loss": round(wm_losses[-1], 6) if wm_losses else 0.0,
            "final_mse_loss": round(final_mse, 6),
            "final_nll_loss": nll_loss_final,
            "final_phys_nll_loss": phys_nll,
            "final_clf_loss": round(clf_losses[-1], 6) if clf_losses else 0.0,
            "loss_history": [round(v, 6) for v in wm_losses],
            "clf_loss_history": [round(v, 6) for v in clf_losses],
            "grad_clip_stats": wm_clip_summary,
            "clf_grad_clip_stats": clf_clip_summary,
            "training_time_seconds": elapsed,
        }
        if arch_id == "B3":
            train_stats["member_final_nll_losses"] = [m["final_nll_loss"] for m in member_artifacts]
            train_stats["member_checkpoint_paths"] = list(member_paths)
            train_stats["member_provenance"] = [
                {
                    "member_index": m["member_index"],
                    "bootstrap_seed": m["bootstrap_seed"],
                    "unique_sample_count": m["bootstrap_provenance"]["unique_sample_count"],
                    "indices_sha256": m["bootstrap_provenance"]["indices_sha256"],
                }
                for m in member_artifacts
            ]

        if checkpoint_path is not None:
            ckpt_dir = os.path.dirname(checkpoint_path)
            if ckpt_dir:
                os.makedirs(ckpt_dir, exist_ok=True)
            payload = {
                "architecture_id": arch_id,
                "model_class": type(continuous_wm).__name__,
                "state_dim": self.state_dim,
                "action_dim": self.action_dim,
                "hidden_dim": self.hidden_dim,
                "ensemble_size": ensemble_size if arch_id == "B3" else 1,
                "continuous_model_state": continuous_wm.state_dict(),
                "mode_classifier_state": mode_clf.state_dict(),
                "aps_quantile": float(mode_clf.aps_quantile),
                "normalization": active_scaler.to_dict() if active_scaler is not None else None,
                "training_config": training_config,
                "stats": train_stats,
                "metadata": dict(extra_metadata) if extra_metadata else {},
            }
            if arch_id == "B3":
                payload["member_checkpoint_paths"] = list(member_paths)
                payload["b3_member_provenance"] = [
                    {
                        "member_index": m["member_index"],
                        "bootstrap_seed": m["bootstrap_seed"],
                        "bootstrap_provenance": m["bootstrap_provenance"],
                        "final_nll_loss": m["final_nll_loss"],
                        "loss_history": m["loss_history"],
                        "grad_clip_stats": m["grad_clip_stats"],
                    }
                    for m in member_artifacts
                ]
            torch.save(payload, checkpoint_path)

        if return_stats:
            return hybrid_model, train_stats
        return hybrid_model

    def calibrate_conformal_b4(
        self,
        base_model: Any,
        calib_transitions: List[Tuple[np.ndarray, np.ndarray, np.ndarray, int]],
        alpha: float = 0.10,
        num_strata: int = NUM_MODES,
        min_stratum_samples: int = 29,
        checkpoint_path: Optional[str] = None,
    ) -> ContactStratifiedConformalWM:
        """
        Builds and calibrates B4 (ContactStratifiedConformalWM) on held-out calibration transitions.
        Keeps HybridContactStateModel wrapper intact so physical-unit inverse transforms apply
        consistently, and persists optional JSON conformal artifacts when checkpoint_path is set.
        """
        if len(calib_transitions) == 0:
            raise ValueError("Cannot calibrate B4 ContactStratifiedConformalWM with 0 calibration transitions.")

        underlying = (
            base_model
            if isinstance(base_model, HybridContactStateModel)
            or getattr(base_model, "feature_scaler", None) is not None
            else base_model
        )
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
        if checkpoint_path is not None:
            b4_model.save(checkpoint_path)
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
        feature_scaler: Optional[FeatureStandardizer] = None,
        checkpoint_dir: Optional[str] = None,
        min_stratum_samples: int = 29,
        extra_metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Trains and prepares B1, B2, B3 independently on training_transitions, and calibrates B4 on
        disjoint calib_transitions (wrapping B1 base predictor without leakage).
        """
        models: Dict[str, Any] = {}
        stats: Dict[str, Any] = {}
        requested = [normalize_architecture_id(a) for a in architectures]

        shared_scaler = feature_scaler
        if shared_scaler is None and self.normalize:
            shared_scaler = FeatureStandardizer.fit_from_transitions(
                training_transitions,
                min_std=self.min_std,
                task=self.task,
                fit_source="train_all_architectures_training_only",
            )

        ckpt_names = {
            "B1": "b1_deterministic.pt",
            "B2": "b2_probabilistic.pt",
            "B3": "b3_ensemble.pt",
        }

        for arch in ("B1", "B2", "B3"):
            if arch in requested:
                ckpt_path = os.path.join(checkpoint_dir, ckpt_names[arch]) if checkpoint_dir else None
                m, st = self.train_hybrid_model(
                    training_transitions=training_transitions,
                    checkpoint_path=ckpt_path,
                    epochs=epochs,
                    lr=lr,
                    return_stats=True,
                    model_type=arch,
                    ensemble_size=ensemble_size,
                    feature_scaler=shared_scaler,
                    member_checkpoint_dir=checkpoint_dir if arch == "B3" else None,
                    extra_metadata=extra_metadata,
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
                base_ckpt = os.path.join(checkpoint_dir, ckpt_names["B1"]) if checkpoint_dir else None
                base_for_b4, _ = self.train_hybrid_model(
                    training_transitions=training_transitions,
                    checkpoint_path=base_ckpt,
                    epochs=epochs,
                    lr=lr,
                    return_stats=True,
                    model_type="B1",
                    feature_scaler=shared_scaler,
                    extra_metadata=extra_metadata,
                )
            b4_ckpt = os.path.join(checkpoint_dir, "b4_conformal_calibration.json") if checkpoint_dir else None
            b4 = self.calibrate_conformal_b4(
                base_model=base_for_b4,
                calib_transitions=calib_transitions,
                alpha=alpha,
                num_strata=NUM_MODES,
                min_stratum_samples=min_stratum_samples,
                checkpoint_path=b4_ckpt,
            )
            models["B4"] = b4
            stats["B4"] = {
                "architecture_id": "B4",
                "model_class": "ContactStratifiedConformalWM",
                "is_conformal_architecture": True,
                "calibration_diagnostics": b4.get_calibration_diagnostics(),
            }

        return {"models": models, "stats": stats, "feature_scaler": shared_scaler}
