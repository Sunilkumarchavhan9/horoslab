"""Synthetic Experience Factory for HOROS Model Teaching Infrastructure.

Generates reproducible physical interaction scenarios across stratified domain randomization
ranges, coupling teacher action suggestions with ground-truth simulator dynamics.
"""

from __future__ import annotations

import copy
import hashlib
import json
import math
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

from teaching.inference import TeacherInferenceEngine, TeacherQueryPayload


@dataclass
class EnvironmentSamplingSpec:
    """Domain randomization configuration for synthetic physical scenarios."""
    friction_range: Tuple[float, float] = (0.08, 1.20)
    mass_range_kg: Tuple[float, float] = (0.10, 2.50)
    clearance_range_mm: Tuple[float, float] = (0.10, 4.00)
    noise_force_sigma_n: float = 0.015
    enable_regime_shifts: bool = True
    default_episode_length: int = 50
    dt_s: float = 0.01


@dataclass
class SyntheticEpisodeRecord:
    """Immutable data record representing a single synthesized physical episode."""
    episode_id: str
    seed: int
    task: str
    states: np.ndarray          # Shape: (T, state_dim)
    actions: np.ndarray         # Shape: (T, action_dim) - executed in sim
    next_states: np.ndarray     # Shape: (T, state_dim)
    wrenches: np.ndarray        # Shape: (T, 6)
    next_wrenches: np.ndarray   # Shape: (T, 6)
    modes: np.ndarray           # Shape: (T,)
    rewards: np.ndarray         # Shape: (T,)
    env_metadata: Dict[str, Any]
    teacher_suggestions: Dict[str, Any] = field(default_factory=dict)
    provenance_hash: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Converts record to dictionary suitable for JSON serialization and NPZ packaging."""
        return {
            "episode_id": self.episode_id,
            "seed": self.seed,
            "task": self.task,
            "states": self.states,
            "actions": self.actions,
            "next_states": self.next_states,
            "wrenches": self.wrenches,
            "next_wrenches": self.next_wrenches,
            "modes": self.modes,
            "rewards": self.rewards,
            "env_metadata": self.env_metadata,
            "teacher_suggestions": self.teacher_suggestions,
            "provenance_hash": self.provenance_hash,
        }

    def compute_record_hash(self) -> str:
        """Computes deterministic SHA-256 fingerprint of the complete episode data."""
        hasher = hashlib.sha256()
        hasher.update(self.episode_id.encode("utf-8"))
        hasher.update(str(self.seed).encode("utf-8"))
        hasher.update(self.task.encode("utf-8"))
        hasher.update(self.states.tobytes())
        hasher.update(self.actions.tobytes())
        hasher.update(self.next_states.tobytes())
        hasher.update(self.wrenches.tobytes())
        hasher.update(self.modes.tobytes())
        meta_str = json.dumps(self.env_metadata, sort_keys=True)
        hasher.update(meta_str.encode("utf-8"))
        return hasher.hexdigest()


class SyntheticExperienceFactory:
    """Generates reproducible physical trajectories by pairing teacher proposals with simulator physics."""

    def __init__(
        self,
        inference_engine: TeacherInferenceEngine,
        sampling_spec: Optional[EnvironmentSamplingSpec] = None,
        output_dir: Optional[str] = None,
    ):
        self.inference_engine = inference_engine
        self.sampling_spec = sampling_spec or EnvironmentSamplingSpec()
        self.output_dir = Path(output_dir) if output_dir else None

        if self.output_dir:
            self.output_dir.mkdir(parents=True, exist_ok=True)

    def sample_parameters(self, seed: int) -> Dict[str, Any]:
        """Deterministically samples physical parameters from specification bounds."""
        rng = np.random.RandomState(seed)
        spec = self.sampling_spec

        mu_true = float(rng.uniform(spec.friction_range[0], spec.friction_range[1]))
        mass_kg = float(math.exp(rng.uniform(math.log(spec.mass_range_kg[0]), math.log(spec.mass_range_kg[1]))))
        clearance_mm = float(rng.uniform(spec.clearance_range_mm[0], spec.clearance_range_mm[1]))

        # Non-stationary regime tag
        regime = "nominal"
        if spec.enable_regime_shifts:
            r_roll = rng.rand()
            if r_roll < 0.20:
                regime = "RegimeA_FrictionStep"
            elif r_roll < 0.40:
                regime = "RegimeB_MassInflux"

        return {
            "seed": seed,
            "initial_mu_true": round(mu_true, 4),
            "initial_mass_kg": round(mass_kg, 4),
            "clearance_mm": round(clearance_mm, 4),
            "regime": regime,
            "dt_s": spec.dt_s,
        }

    def generate_episode(
        self,
        task: str,
        teacher_id: str,
        seed: int,
        custom_params: Optional[Dict[str, Any]] = None,
    ) -> SyntheticEpisodeRecord:
        """Executes candidate teacher actions through simulation to produce an episode record."""
        params = custom_params or self.sample_parameters(seed)
        episode_len = self.sampling_spec.default_episode_length
        state_dim = 23 if task == "compliant_prelift" else 15
        action_dim = 5 if task == "compliant_prelift" else 6

        rng = np.random.RandomState(seed)
        dt = params["dt_s"]
        mu_true = params["initial_mu_true"]
        mass_kg = params["initial_mass_kg"]

        # Initial state setup
        init_state = np.zeros(state_dim, dtype=np.float32)
        if task == "compliant_prelift":
            # Gripper pos at finger span 40 mm, z = 45 mm (above object resting at z=0)
            init_state[0] = 0.0
            init_state[1] = 0.0
            init_state[2] = 45.0  # z hand
            init_state[8] = 0.0   # z obj resting on table
        else:
            # Peg tip at z = 10 mm above hole, small lateral misalignment
            init_state[0] = float(rng.uniform(-0.5, 0.5))
            init_state[1] = float(rng.uniform(-0.5, 0.5))
            init_state[2] = 10.0

        # Query teacher for candidate action sequence
        payload = TeacherQueryPayload(
            task_id=task,
            query_type="trajectory_proposal",
            current_state=init_state,
            target_horizon=episode_len,
            seed=seed,
            request_representations=True,
        )
        teacher_res = self.inference_engine.query(teacher_id, payload)
        cand_actions = teacher_res.candidate_actions

        # Step through physical simulation dynamics
        states = np.zeros((episode_len, state_dim), dtype=np.float32)
        next_states = np.zeros((episode_len, state_dim), dtype=np.float32)
        actions = np.zeros((episode_len, action_dim), dtype=np.float32)
        wrenches = np.zeros((episode_len, 6), dtype=np.float32)
        next_wrenches = np.zeros((episode_len, 6), dtype=np.float32)
        modes = np.zeros(episode_len, dtype=np.int64)
        rewards = np.zeros(episode_len, dtype=np.float32)

        curr_s = init_state.copy()
        k_pad_total = 6000.0  # N/m
        g = 9.80665

        for t in range(episode_len):
            a_cmd = cand_actions[t].copy()
            states[t] = curr_s.copy()
            actions[t] = a_cmd.copy()

            # Dynamic parameter update for non-stationary regimes
            curr_mu = mu_true
            curr_mass = mass_kg
            if params.get("regime") == "RegimeA_FrictionStep" and t >= 15:
                curr_mu = max(0.10, mu_true * 0.40)
            elif params.get("regime") == "RegimeB_MassInflux" and t >= 10:
                curr_mass = mass_kg + 0.25 * (t - 10) * dt

            # Physics simulation step
            next_s = curr_s.copy()
            w_meas = np.zeros(6, dtype=np.float32)
            mode = 0

            if task == "compliant_prelift":
                # Compliant prelift state update
                hand_z = curr_s[2]
                obj_z = curr_s[8]
                cmd_vx, cmd_vy, cmd_vz = a_cmd[0], a_cmd[1], a_cmd[2]
                f_grip = max(0.0, float(a_cmd[4]))

                # Kinematic update of hand
                hand_z = max(40.0, hand_z + cmd_vz * dt * 1000.0)
                pad_stretch_mm = max(0.0, hand_z - 40.0 - obj_z)
                f_shear = (pad_stretch_mm / 1000.0) * k_pad_total
                max_shear = curr_mu * f_grip

                # Coulomb slip or liftoff
                weight_n = curr_mass * g
                if f_grip < 0.5:
                    mode = 0  # Free space
                    f_shear = 0.0
                elif f_shear <= max_shear:
                    if f_shear > weight_n:
                        mode = 2  # Sticking liftoff
                        obj_z += (f_shear - weight_n) / curr_mass * (dt ** 2) * 1000.0 * 0.5
                    else:
                        mode = 2  # Sticking on table
                else:
                    mode = 3  # Sliding slip
                    f_shear = 0.90 * max_shear

                next_s[0] += cmd_vx * dt * 1000.0
                next_s[1] += cmd_vy * dt * 1000.0
                next_s[2] = hand_z
                next_s[8] = obj_z

                w_meas[0] = float(rng.normal(0, 0.05))
                w_meas[1] = float(rng.normal(0, 0.05))
                w_meas[2] = float(f_shear)
                rewards[t] = float(obj_z - 0.05 * f_shear)

            else:
                # Peg-in-hole state update
                tip_x, tip_y, tip_z = curr_s[0], curr_s[1], curr_s[2]
                vx, vy, vz = a_cmd[0], a_cmd[1], a_cmd[2]

                next_x = tip_x + vx * dt * 1000.0
                next_y = tip_y + vy * dt * 1000.0
                next_z = tip_z + vz * dt * 1000.0

                radial_err = math.sqrt(next_x ** 2 + next_y ** 2)
                clearance = params["clearance_mm"]

                if next_z > 0.0:
                    mode = 0  # Free space
                elif radial_err <= clearance:
                    mode = 2  # Clean insertion
                    w_meas[2] = -curr_mu * 5.0
                else:
                    mode = 4  # Contact / impact with hole chamfer
                    next_z = max(0.0, next_z)
                    w_meas[0] = 5.0 * (next_x / (radial_err + 1e-6))
                    w_meas[1] = 5.0 * (next_y / (radial_err + 1e-6))
                    w_meas[2] = 12.0

                next_s[0] = next_x
                next_s[1] = next_y
                next_s[2] = next_z
                rewards[t] = float(-radial_err + (10.0 - next_z))

            next_states[t] = next_s.copy()
            wrenches[t] = w_meas.copy()
            next_wrenches[t] = w_meas.copy()
            modes[t] = mode
            curr_s = next_s.copy()

        episode_id = f"syn_{task}_{teacher_id}_seed{seed:05d}"
        teacher_meta = {
            "teacher_id": teacher_id,
            "teacher_confidence": float(teacher_res.predicted_confidence),
            "teacher_provenance_hash": teacher_res.provenance_hash,
            "has_teacher_representations": teacher_res.latent_representations is not None,
            "candidate_actions": cand_actions,
        }

        record = SyntheticEpisodeRecord(
            episode_id=episode_id,
            seed=seed,
            task=task,
            states=states,
            actions=actions,
            next_states=next_states,
            wrenches=wrenches,
            next_wrenches=next_wrenches,
            modes=modes,
            rewards=rewards,
            env_metadata=params,
            teacher_suggestions=teacher_meta,
        )
        record.provenance_hash = record.compute_record_hash()

        if self.output_dir:
            out_path = self.output_dir / f"{episode_id}.npz"
            np.savez_compressed(
                out_path,
                states=states,
                actions=actions,
                next_states=next_states,
                wrenches=wrenches,
                next_wrenches=next_wrenches,
                modes=modes,
                rewards=rewards,
                env_metadata_json=json.dumps(params),
                teacher_metadata_json=json.dumps(teacher_meta, default=lambda x: x.tolist() if hasattr(x, "tolist") else str(x)),
                provenance_hash=record.provenance_hash,
            )

        return record

    def generate_batch(
        self,
        task: str,
        teacher_id: str,
        seeds: List[int],
    ) -> List[SyntheticEpisodeRecord]:
        """Generates a batch of synthetic episodes across multiple seeds."""
        return [self.generate_episode(task, teacher_id, s) for s in seeds]
