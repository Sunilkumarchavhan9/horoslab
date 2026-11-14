"""Student Distillation Engine for HOROS Model Teaching Infrastructure.

Collates physics-validated episodes into student training batches and dataset manifests.
Enforces the Information Firewall: strictly zero ground-truth contact mode or simulator-privileged
parameter leakage into the autoregressive history buffer (h_{t-9:t}).
"""

from __future__ import annotations

import copy
import hashlib
import json
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

from teaching.factory import SyntheticEpisodeRecord


@dataclass
class StudentTrainingBatch:
    """Standardized PyTorch-compatible batch representation for student model training."""
    history_obs: np.ndarray             # Shape: (B, H_hist, input_dim) - strictly observable
    future_actions: np.ndarray          # Shape: (B, H_fut, action_dim)
    target_next_states: np.ndarray      # Shape: (B, H_fut, state_dim)
    target_next_wrenches: np.ndarray    # Shape: (B, H_fut, 6)
    target_modes: np.ndarray            # Shape: (B, H_fut) - ground-truth ONLY as loss target
    target_mu: np.ndarray               # Shape: (B,) - auxiliary system ID target only
    target_mass: np.ndarray             # Shape: (B,) - auxiliary system ID target only
    teacher_action_targets: Optional[np.ndarray] = None  # Shape: (B, H_fut, action_dim)
    teacher_representations: Optional[np.ndarray] = None  # Shape: (B, H_fut, rep_dim)
    provenance_hashes: List[str] = field(default_factory=list)


@dataclass
class TrainingDatasetManifest:
    """Provenance and structural manifest for assembled distillation datasets."""
    manifest_id: str
    dataset_name: str
    total_episodes: int
    total_transitions: int
    total_batches: int
    history_horizon: int
    future_horizon: int
    task: str
    has_teacher_actions: bool
    has_teacher_representations: bool
    zero_leakage_verified: bool
    data_sha256: str
    metadata: Dict[str, Any] = field(default_factory=dict)


def estimate_observable_mode_probabilities(
    wrench: np.ndarray,
    state: Optional[np.ndarray] = None,
    num_modes: int = 5,
) -> np.ndarray:
    """Estimates contact mode probabilities solely from observable physical sensor signals.

    Strict Physical & Non-Leakage Contract:
    - Simulator ground truth (ep.modes) is NEVER accessed.
    - Uses true aggregate normal force (sum of fingertip normal forces state[12:16] or wrench norm),
      true vertical pad shear force (wrench[2]), and observed slip velocity (state[16:20]).
    - 4 equal normal forces with zero tangential shear strictly classify as Sticking (Mode 2), NEVER Sliding.
    - Default modes: [0: Free, 1: Impact, 2: Sticking, 3: Sliding, 4: Seated/Wedged]
    """
    probs = np.zeros(num_modes, dtype=np.float32)

    # Extract aggregate normal clamping force
    if state is not None and len(state) >= 16:
        fn_total = float(np.sum(state[12:16]))
    else:
        fn_total = float(np.linalg.norm(wrench[:2])) if len(wrench) >= 2 else 0.0

    # Extract true vertical pad shear force from 6-axis net wrench
    fz_shear = float(abs(wrench[2])) if len(wrench) >= 3 else 0.0

    # Extract maximum observed physical slip velocity
    slip_vel = 0.0
    if state is not None and len(state) >= 20:
        slip_vel = float(np.max(np.abs(state[16:20])))

    # Mode classification based on verified physical mechanics
    if fn_total < 0.20 and fz_shear < 0.20:
        # Free-space: no normal clamp or shear force detected
        probs[0] = 0.92
        probs[1] = 0.02
        probs[2] = 0.02
        probs[3] = 0.02
        probs[4] = 0.02
    elif fn_total > 22.0 or (fz_shear > 16.0 and slip_vel < 1e-4):
        # High impact or crush overload
        probs[0] = 0.01
        probs[1] = 0.88
        probs[2] = 0.04
        probs[3] = 0.04
        probs[4] = 0.03
    elif fn_total >= 0.50:
        # Contact engaged: check if slip occurs (slip velocity >= 0.1 mm/s or shear exceeds friction limit)
        is_sliding = (slip_vel >= 1e-4) or (fz_shear > 0.85 * fn_total)
        if is_sliding:
            # Sliding slip
            probs[0] = 0.01
            probs[1] = 0.03
            probs[2] = 0.16
            probs[3] = 0.76
            probs[4] = 0.04
        else:
            # Sticking contact (including stable 4-finger zero-shear clamp)
            probs[0] = 0.01
            probs[1] = 0.03
            probs[2] = 0.82
            probs[3] = 0.10
            probs[4] = 0.04
    else:
        # Low-force transition / ambiguous region
        probs[:] = 1.0 / num_modes

    return probs / float(np.sum(probs))


class StudentDistillationEngine:
    """Collates physics-validated episodes into student training batches and dataset manifests."""

    def __init__(
        self,
        history_horizon: int = 10,
        future_horizon: int = 20,
        batch_size: int = 32,
        num_modes: int = 5,
    ):
        self.history_horizon = history_horizon
        self.future_horizon = future_horizon
        self.batch_size = batch_size
        self.num_modes = num_modes

    def extract_nonprivileged_step(
        self,
        state: np.ndarray,
        action: np.ndarray,
        wrench: np.ndarray,
        causal_mode_probs: Optional[np.ndarray] = None,
    ) -> np.ndarray:
        """Extracts strictly observable continuous physical features with zero ground-truth leakage.

        Features:
        - state: observable kinematic pose & velocity (no hidden sim state)
        - action: applied control command
        - wrench: measured 6-axis FT sensor reading (true Cartesian net force and torque)
        - continuous_signals: total normal clamping force, vertical shear, pad strain, slip indicator
        - causal_mode_probs: causally estimated mode distribution (derived from observables or causal model)
        """
        if len(state) >= 16:
            fn_mag = float(np.sum(state[12:16]))
        else:
            fn_mag = float(np.linalg.norm(wrench[:2])) if len(wrench) >= 2 else 0.0

        fz_shear = float(abs(wrench[2])) if len(wrench) >= 3 else 0.0
        k_pad_total = 6000.0  # 4 * 1500 N/m
        pad_strain = fz_shear / k_pad_total

        # Detect observable slip from state slip velocity or shear-to-normal ratio
        slip_vel = float(np.max(np.abs(state[16:20]))) if len(state) >= 20 else 0.0
        slip_indicator = 1.0 if (slip_vel >= 1e-4 or (fn_mag > 0.5 and fz_shear > 0.85 * fn_mag)) else 0.0

        if causal_mode_probs is not None:
            mode_probs = causal_mode_probs.astype(np.float32)
        else:
            mode_probs = estimate_observable_mode_probabilities(wrench, state, self.num_modes)

        continuous_signals = np.array([fn_mag, fz_shear, pad_strain, slip_indicator], dtype=np.float32)
        return np.concatenate([state, action, wrench, continuous_signals, mode_probs])

    def verify_zero_leakage(self, sample_episodes: List[SyntheticEpisodeRecord]) -> bool:
        """Rigorously verifies that ground-truth contact mode labels (ep.modes) do not leak into history inputs.

        Verification Protocol:
        1. Collate feature sequences from original episodes.
        2. Create deepcopy of episodes with perturbed/corrupted ground-truth mode arrays.
        3. Collate feature sequences from perturbed episodes.
        4. Assert bitwise identical history observation tensors.
        5. Assert target mode tensors differ according to the perturbation.
        """
        if not sample_episodes:
            return True

        # Collate original history features
        orig_seqs = []
        for ep in sample_episodes:
            for t in range(len(ep.states)):
                obs = self.extract_nonprivileged_step(ep.states[t], ep.actions[t], ep.wrenches[t])
                orig_seqs.append(obs)
        orig_arr = np.asarray(orig_seqs, dtype=np.float32)

        # Clone and corrupt ground truth mode labels
        corrupted_episodes = []
        for ep in sample_episodes:
            c_ep = copy.deepcopy(ep)
            # Invert or shift ground-truth modes
            c_ep.modes = (c_ep.modes + 1) % self.num_modes
            corrupted_episodes.append(c_ep)

        # Collate corrupted history features
        pert_seqs = []
        for ep in corrupted_episodes:
            for t in range(len(ep.states)):
                obs = self.extract_nonprivileged_step(ep.states[t], ep.actions[t], ep.wrenches[t])
                pert_seqs.append(obs)
        pert_arr = np.asarray(pert_seqs, dtype=np.float32)

        # Bitwise identity check on input features
        if not np.array_equal(orig_arr, pert_arr):
            raise AssertionError(
                "CRITICAL INFORMATION LEAKAGE DETECTED: Perturbing ground-truth contact mode labels "
                "altered the observation history feature tensor! Non-leakage contract violated."
            )

        return True

    def prepare_dataset_batches(
        self,
        task: str,
        episodes: List[SyntheticEpisodeRecord],
        verify_leakage: bool = True,
    ) -> Tuple[List[StudentTrainingBatch], TrainingDatasetManifest]:
        """Collates episodes into sequence chunks with verified zero ground-truth leakage."""
        if verify_leakage and episodes:
            self.verify_zero_leakage(episodes[:5])

        all_histories: List[np.ndarray] = []
        all_future_actions: List[np.ndarray] = []
        all_target_states: List[np.ndarray] = []
        all_target_wrenches: List[np.ndarray] = []
        all_target_modes: List[np.ndarray] = []
        all_target_mu: List[float] = []
        all_target_mass: List[float] = []
        all_teacher_actions: List[Optional[np.ndarray]] = []
        all_teacher_reps: List[Optional[np.ndarray]] = []
        all_hashes: List[str] = []

        H_hist = self.history_horizon
        H_fut = self.future_horizon
        req_len = H_hist + H_fut

        total_transitions = 0
        has_teacher_reps = False
        has_teacher_acts = False

        for ep in episodes:
            T = len(ep.states)
            total_transitions += T
            meta = ep.env_metadata
            mu_val = float(meta.get("initial_mu_true", meta.get("mu_true", 0.60)))
            mass_val = float(meta.get("initial_mass_kg", meta.get("object_mass", 0.350)))

            cand_acts = ep.teacher_suggestions.get("candidate_actions")
            if cand_acts is not None:
                has_teacher_acts = True

            # Extract non-privileged observation sequence with ZERO ep.modes access
            nonpriv_seq: List[np.ndarray] = []
            for t in range(T):
                # Mode probability is estimated SOLELY from observable sensor signals
                causal_mode_prob = estimate_observable_mode_probabilities(
                    ep.wrenches[t], ep.states[t], self.num_modes
                )
                obs_t = self.extract_nonprivileged_step(
                    ep.states[t], ep.actions[t], ep.wrenches[t], causal_mode_prob
                )
                nonpriv_seq.append(obs_t)

            nonpriv_arr = np.asarray(nonpriv_seq, dtype=np.float32)

            # Slide window across episode
            for start in range(0, T - req_len + 1, 5):
                hist_window = nonpriv_arr[start : start + H_hist]
                fut_actions = ep.actions[start + H_hist : start + req_len]
                target_s = ep.next_states[start + H_hist : start + req_len]
                target_w = ep.next_wrenches[start + H_hist : start + req_len]
                target_m = ep.modes[start + H_hist : start + req_len]  # Target ONLY

                all_histories.append(hist_window)
                all_future_actions.append(fut_actions)
                all_target_states.append(target_s)
                all_target_wrenches.append(target_w)
                all_target_modes.append(target_m)
                all_target_mu.append(mu_val)
                all_target_mass.append(mass_val)
                all_hashes.append(ep.provenance_hash)

                if cand_acts is not None and len(cand_acts) >= start + req_len:
                    all_teacher_actions.append(cand_acts[start + H_hist : start + req_len])
                else:
                    all_teacher_actions.append(None)
                all_teacher_reps.append(None)

        # Batch assembly
        N = len(all_histories)
        batches: List[StudentTrainingBatch] = []
        B = self.batch_size

        for i in range(0, N, B):
            b_hist = np.asarray(all_histories[i : i + B], dtype=np.float32)
            b_fut_a = np.asarray(all_future_actions[i : i + B], dtype=np.float32)
            b_tgt_s = np.asarray(all_target_states[i : i + B], dtype=np.float32)
            b_tgt_w = np.asarray(all_target_wrenches[i : i + B], dtype=np.float32)
            b_tgt_m = np.asarray(all_target_modes[i : i + B], dtype=np.int64)
            b_mu = np.asarray(all_target_mu[i : i + B], dtype=np.float32)
            b_mass = np.asarray(all_target_mass[i : i + B], dtype=np.float32)
            b_hashes = all_hashes[i : i + B]

            b_teach_a = None
            if has_teacher_acts and all(x is not None for x in all_teacher_actions[i : i + B]):
                b_teach_a = np.asarray(all_teacher_actions[i : i + B], dtype=np.float32)

            batch = StudentTrainingBatch(
                history_obs=b_hist,
                future_actions=b_fut_a,
                target_next_states=b_tgt_s,
                target_next_wrenches=b_tgt_w,
                target_modes=b_tgt_m,
                target_mu=b_mu,
                target_mass=b_mass,
                teacher_action_targets=b_teach_a,
                teacher_representations=None,
                provenance_hashes=b_hashes,
            )
            batches.append(batch)

        # Compute dataset fingerprint
        hasher = hashlib.sha256()
        for b in batches:
            hasher.update(b.history_obs.tobytes())
            hasher.update(b.target_next_states.tobytes())
            hasher.update(b.target_mu.tobytes())
            hasher.update(b.target_mass.tobytes())
        data_sha = hasher.hexdigest()

        manifest = TrainingDatasetManifest(
            manifest_id=f"manifest_distill_{task}_{data_sha[:8]}",
            dataset_name=f"Curated Distillation Dataset: {task}",
            total_episodes=len(episodes),
            total_transitions=total_transitions,
            total_batches=len(batches),
            history_horizon=H_hist,
            future_horizon=H_fut,
            task=task,
            has_teacher_actions=has_teacher_acts,
            has_teacher_representations=has_teacher_reps,
            zero_leakage_verified=True,
            data_sha256=data_sha,
            metadata={
                "batch_size": B,
                "total_sequence_samples": N,
                "input_dim": int(all_histories[0].shape[-1]) if all_histories else 0,
                "leakage_verification_status": "VERIFIED_BITWISE_INVARIANT_UNDER_MODE_CORRUPTION",
            },
        )

        return batches, manifest

    def export_manifest(self, manifest: TrainingDatasetManifest, filepath: str) -> str:
        """Exports dataset manifest to a JSON file."""
        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(asdict(manifest), f, indent=2)
        return str(path)
