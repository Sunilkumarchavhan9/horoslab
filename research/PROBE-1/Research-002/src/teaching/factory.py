"""Synthetic Experience Factory for HOROS Model Teaching Infrastructure.

Generates reproducible physical interaction trajectories by coupling teacher action suggestions
with validated PROBE-1 ground-truth simulation environments:
- Task 1: PegInHoleEnv (operational space impedance, chamfer, wedging, seating mechanics)
- Task 2: CompliantPreLiftContactEnv (elastomeric fingertip shear pads, Coulomb slip, liftoff acceleration)
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
    """Generates reproducible physical trajectories by pairing teacher proposals with authoritative simulator physics."""

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
        """Deterministically samples physical parameters using specified PRNG seed."""
        rng = np.random.RandomState(seed)
        mu = float(rng.uniform(self.sampling_spec.friction_range[0], self.sampling_spec.friction_range[1]))
        mass = float(rng.uniform(self.sampling_spec.mass_range_kg[0], self.sampling_spec.mass_range_kg[1]))
        clearance = float(
            rng.uniform(self.sampling_spec.clearance_range_mm[0], self.sampling_spec.clearance_range_mm[1])
        )

        regimes = ["nominal", "A", "B"] if self.sampling_spec.enable_regime_shifts else ["nominal"]
        regime = str(rng.choice(regimes))

        return {
            "friction_mu": round(mu, 4),
            "mass_kg": round(mass, 4),
            "clearance_mm": round(clearance, 4),
            "regime": regime,
            "seed": seed,
        }

    def _create_environment(self, task: str, params: Dict[str, Any], dt: float):
        """Instantiates the authoritative PROBE-1 environment matching task requirements."""
        seed = int(params["seed"])
        mu = float(params["friction_mu"])
        mass = float(params["mass_kg"])
        clearance = float(params["clearance_mm"])
        regime = str(params.get("regime", "nominal"))

        if task in ("compliant_prelift", "compliant_lift", "multifinger_lift"):
            try:
                from src.environment.compliant_prelift_env import CompliantPreLiftContactEnv
                return CompliantPreLiftContactEnv(
                    mu_true=mu,
                    object_mass=mass,
                    dt=dt,
                    seed=seed,
                    regime=regime,
                )
            except ImportError:
                from environment.compliant_prelift_env import CompliantPreLiftContactEnv
                return CompliantPreLiftContactEnv(
                    mu_true=mu,
                    object_mass=mass,
                    dt=dt,
                    seed=seed,
                    regime=regime,
                )
        else:
            try:
                from src.environment.peg_in_hole_env import PegInHoleEnv
                return PegInHoleEnv(
                    dt=dt,
                    clearance=clearance,
                    friction_coeff=mu,
                    seed=seed,
                )
            except ImportError:
                from environment.peg_in_hole_env import PegInHoleEnv
                return PegInHoleEnv(
                    dt=dt,
                    clearance=clearance,
                    friction_coeff=mu,
                    seed=seed,
                )

    def generate_episode(
        self,
        task: str,
        teacher_id: str,
        seed: int,
        episode_length: Optional[int] = None,
        parameter_overrides: Optional[Dict[str, Any]] = None,
    ) -> SyntheticEpisodeRecord:
        """Executes a complete synthetic episode by driving the simulator with teacher actions."""
        episode_len = episode_length or self.sampling_spec.default_episode_length
        dt = self.sampling_spec.dt_s

        # Parameter sampling
        params = self.sample_parameters(seed)
        if parameter_overrides:
            params.update(parameter_overrides)

        # Import environment adapters
        try:
            from src.environment.step_adapter import step_env_compatible
            from src.selection_aware.counterfactual_rollout import extract_env_state_and_wrench
            from src.contact_modes.contact_mode_definitions import classify_contact_mode
        except ImportError:
            from environment.step_adapter import step_env_compatible
            from selection_aware.counterfactual_rollout import extract_env_state_and_wrench
            from contact_modes.contact_mode_definitions import classify_contact_mode

        # Initialize real simulator
        env = self._create_environment(task, params, dt)
        obs = env.reset()

        # Extract initial state and wrench from real environment
        s0, w0 = extract_env_state_and_wrench(obs, task=task)
        state_dim = len(s0)
        action_dim = 5 if task in ("compliant_prelift", "compliant_lift", "multifinger_lift") else 6

        # Query teacher for candidate action sequence
        payload = TeacherQueryPayload(
            task_id=task,
            query_type="trajectory_proposal",
            current_state=s0.astype(np.float32),
            target_horizon=episode_len,
            seed=seed,
            request_representations=True,
        )
        teacher_res = self.inference_engine.query(teacher_id, payload)
        cand_actions = teacher_res.candidate_actions

        states = np.zeros((episode_len, state_dim), dtype=np.float32)
        next_states = np.zeros((episode_len, state_dim), dtype=np.float32)
        actions = np.zeros((episode_len, action_dim), dtype=np.float32)
        wrenches = np.zeros((episode_len, 6), dtype=np.float32)
        next_wrenches = np.zeros((episode_len, 6), dtype=np.float32)
        modes = np.zeros(episode_len, dtype=np.int64)
        rewards = np.zeros(episode_len, dtype=np.float32)

        curr_obs = obs
        curr_s = s0.copy()
        curr_w = w0.copy()

        for t in range(episode_len):
            # Teacher proposed action
            a_cmd = cand_actions[t].copy() if t < len(cand_actions) else np.zeros(action_dim, dtype=np.float32)
            states[t] = curr_s.copy()
            actions[t] = a_cmd.copy()
            wrenches[t] = curr_w.copy()

            # Step the authoritative simulation environment!
            next_obs, step_reward, done, info = step_env_compatible(env, a_cmd, task=task)

            # Extract genuine state and wrench from the real environment
            next_s, next_w = extract_env_state_and_wrench(next_obs, task=task)
            next_states[t] = next_s.copy()
            next_wrenches[t] = next_w.copy()
            rewards[t] = float(step_reward) if step_reward is not None else 0.0

            # Classify ground-truth contact mode from simulator state
            mode_t = classify_contact_mode(next_obs, prev_state=curr_obs, dt=dt, task=task)
            modes[t] = int(mode_t)

            curr_obs = next_obs
            curr_s = next_s
            curr_w = next_w

        ep_id = f"syn_{task}_{teacher_id}_seed{seed:05d}"
        env_meta = {
            "initial_mu_true": params["friction_mu"],
            "initial_mass_kg": params["mass_kg"],
            "clearance_mm": params["clearance_mm"],
            "regime": params.get("regime", "nominal"),
            "dt_s": dt,
            "simulator_env": type(env).__name__,
        }

        record = SyntheticEpisodeRecord(
            episode_id=ep_id,
            seed=seed,
            task=task,
            states=states,
            actions=actions,
            next_states=next_states,
            wrenches=wrenches,
            next_wrenches=next_wrenches,
            modes=modes,
            rewards=rewards,
            env_metadata=env_meta,
            teacher_suggestions={
                "teacher_id": teacher_id,
                "candidate_actions": cand_actions,
                "teacher_confidence": teacher_res.predicted_confidence,
            },
        )
        record.provenance_hash = record.compute_record_hash()

        # Save to disk if output directory specified
        if self.output_dir:
            file_path = self.output_dir / f"{ep_id}.npz"
            np.savez_compressed(
                file_path,
                episode_id=record.episode_id,
                seed=record.seed,
                task=record.task,
                states=record.states,
                actions=record.actions,
                next_states=record.next_states,
                wrenches=record.wrenches,
                next_wrenches=record.next_wrenches,
                modes=record.modes,
                rewards=record.rewards,
                provenance_hash=record.provenance_hash,
                env_metadata_json=json.dumps(record.env_metadata),
            )

        return record

    def generate_batch(
        self,
        task: str,
        teacher_id: str,
        seeds: List[int],
        episode_length: Optional[int] = None,
    ) -> List[SyntheticEpisodeRecord]:
        """Generates multiple synthetic physical episodes across a list of distinct seeds."""
        return [self.generate_episode(task, teacher_id, s, episode_length) for s in seeds]
