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


# Approved Stage 3 dataset shape. Counts are the production specification.
# Stage 3.0 freezes the sampler. It does not generate these 1,000 episodes.
STAGE3_DATASET_COUNTS: Dict[str, Dict[str, int]] = {
    "compliant_prelift": {"nominal": 250, "probe": 150, "nonstationary": 100},
    "peg_in_hole": {"nominal": 250, "impact": 150, "wedging": 100},
}

# 40-episode pilot: proportional prefix of the production strata (10/6/4 and 10/6/4).
STAGE3_PILOT_COUNTS: Dict[str, Dict[str, int]] = {
    "compliant_prelift": {"nominal": 10, "probe": 6, "nonstationary": 4},
    "peg_in_hole": {"nominal": 10, "impact": 6, "wedging": 4},
}

PRELIFT_TASKS = ("compliant_prelift", "compliant_lift", "multifinger_lift")
PEGGED_LENGTH_MM = 80.0

# Model-visible arrays. Privileged simulator fields are not in this set.
OBSERVATION_ARRAY_FIELDS = (
    "states",
    "actions",
    "next_states",
    "wrenches",
    "next_wrenches",
    "rewards",
)
PRIVILEGED_FIELD_NAMES = (
    "mu_true",
    "initial_mu_true",
    "object_mass",
    "initial_mass_kg",
    "clearance_mm",
    "clearance",
    "contact_mode",
    "contactmode",
    "friction",
)


def _hash_value(hasher: "hashlib._Hash", value: Any) -> None:
    """Feeds a nested value into a SHA-256 hasher without including the hash field itself."""
    if isinstance(value, np.ndarray):
        array = np.ascontiguousarray(value)
        hasher.update(b"ndarray")
        hasher.update(str(array.dtype).encode("utf-8"))
        hasher.update(str(array.shape).encode("utf-8"))
        hasher.update(array.tobytes())
        return
    if isinstance(value, dict):
        hasher.update(b"dict")
        for key in sorted(value.keys(), key=str):
            if str(key) == "provenance_hash":
                continue
            hasher.update(str(key).encode("utf-8"))
            _hash_value(hasher, value[key])
        return
    if isinstance(value, (list, tuple)):
        hasher.update(b"list")
        hasher.update(str(len(value)).encode("utf-8"))
        for item in value:
            _hash_value(hasher, item)
        return
    if isinstance(value, (np.floating, float)):
        hasher.update(b"float")
        hasher.update(np.float64(value).tobytes())
        return
    if isinstance(value, (np.integer, int)) and not isinstance(value, bool):
        hasher.update(b"int")
        hasher.update(str(int(value)).encode("utf-8"))
        return
    hasher.update(b"str")
    hasher.update(str(value).encode("utf-8"))


def _jsonable(value: Any) -> Any:
    if isinstance(value, np.ndarray):
        return np.ascontiguousarray(value).tolist()
    if isinstance(value, (np.floating, float)):
        return float(value)
    if isinstance(value, (np.integer, int)) and not isinstance(value, bool):
        return int(value)
    if isinstance(value, dict):
        return {str(key): _jsonable(item) for key, item in value.items() if str(key) != "provenance_hash"}
    if isinstance(value, (list, tuple)):
        return [_jsonable(item) for item in value]
    return value


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
        """SHA-256 of every episode field except provenance_hash itself.

        Covered fields: episode_id, seed, task, states, actions, next_states,
        wrenches, next_wrenches, modes, rewards, env_metadata, teacher_suggestions.
        """
        hasher = hashlib.sha256()
        hasher.update(b"stage3-episode-hash-v2")
        hasher.update(self.episode_id.encode("utf-8"))
        hasher.update(str(int(self.seed)).encode("utf-8"))
        hasher.update(self.task.encode("utf-8"))
        for name in (
            "states",
            "actions",
            "next_states",
            "wrenches",
            "next_wrenches",
            "modes",
            "rewards",
        ):
            hasher.update(name.encode("utf-8"))
            _hash_value(hasher, getattr(self, name))
        hasher.update(b"env_metadata")
        _hash_value(hasher, self.env_metadata)
        hasher.update(b"teacher_suggestions")
        _hash_value(hasher, self.teacher_suggestions)
        return hasher.hexdigest()

    def observation_package(self) -> Dict[str, Any]:
        """Model-visible arrays only. No friction, mass, clearance, or contact-mode labels."""
        return {name: getattr(self, name) for name in OBSERVATION_ARRAY_FIELDS}

    def privileged_payload(self) -> Dict[str, Any]:
        """Simulator ground truth and teacher provenance, stored apart from observations."""
        return {
            "episode_id": self.episode_id,
            "seed": int(self.seed),
            "task": self.task,
            "env_metadata": _jsonable(self.env_metadata),
            "modes": np.ascontiguousarray(self.modes).tolist(),
            "teacher_suggestions": _jsonable(self.teacher_suggestions),
            "provenance_hash": self.provenance_hash,
        }

    def leaked_privileged_keys(self) -> List[str]:
        """Returns observation-package keys that name privileged simulator quantities."""
        leaked = []
        for key in self.observation_package():
            lowered = key.lower()
            if any(token in lowered for token in PRIVILEGED_FIELD_NAMES):
                leaked.append(key)
        return leaked


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

    @staticmethod
    def scenario_seed(task: str, stratum: str, index: int) -> int:
        """Stable seed for one slot of the approved dataset. Pilot index 0 matches production index 0."""
        task_code = {"compliant_prelift": 1, "peg_in_hole": 2}[task]
        stratum_code = {
            "nominal": 1,
            "probe": 2,
            "nonstationary": 3,
            "impact": 4,
            "wedging": 5,
        }[stratum]
        return 3_100_000 + task_code * 10_000 + stratum_code * 1_000 + int(index)

    def sample_stratified_scenario(self, task: str, stratum: str, index: int) -> Dict[str, Any]:
        """Draws one scenario inside the approved stratum ranges. The stratum is not chosen at random."""
        if task not in STAGE3_DATASET_COUNTS or stratum not in STAGE3_DATASET_COUNTS[task]:
            raise ValueError(f"Unsupported Stage 3 scenario {task}/{stratum}")
        seed = self.scenario_seed(task, stratum, index)
        rng = np.random.RandomState(seed)
        if task == "compliant_prelift":
            if stratum == "nominal":
                mu = float(rng.uniform(0.40, 0.80))
                mass = float(rng.uniform(0.30, 0.55))
                regime = "nominal"
            elif stratum == "probe":
                mu = float(rng.uniform(0.15, 0.85))
                mass = float(rng.uniform(0.30, 0.90))
                regime = "nominal"
            else:
                mu = 0.60
                mass = 0.350
                regime = "A" if index % 2 == 0 else "B"
            return {
                "stratified": True,
                "task": task,
                "stratum": stratum,
                "index": int(index),
                "seed": seed,
                "friction_mu": round(mu, 4),
                "mass_kg": round(mass, 4),
                "clearance_mm": 0.5,
                "regime": regime,
            }

        if stratum == "nominal":
            clearance = float(rng.uniform(0.40, 1.50))
            mu = float(rng.uniform(0.30, 0.70))
            radius = float(rng.uniform(0.0, 0.30))
            tilt = float(rng.uniform(0.0, 0.20))
        elif stratum == "impact":
            clearance = float(rng.uniform(0.50, 2.00))
            mu = float(rng.uniform(0.30, 0.70))
            radius = float(rng.uniform(0.50, 2.00))
            tilt = float(rng.uniform(0.0, 0.50))
        else:
            clearance = float(rng.uniform(0.10, 0.40))
            mu = float(rng.uniform(0.20, 0.60))
            radius = float(rng.uniform(0.0, max(clearance * 0.5, 0.05)))
            critical_deg = float(np.degrees(np.arctan2(2.0 * clearance, PEGGED_LENGTH_MM)))
            tilt = float(rng.uniform(critical_deg + 0.5, critical_deg + 3.0))
        angle = float(rng.uniform(0.0, 2.0 * math.pi))
        return {
            "stratified": True,
            "task": task,
            "stratum": stratum,
            "index": int(index),
            "seed": seed,
            "friction_mu": round(mu, 4),
            "mass_kg": 0.350,
            "clearance_mm": round(clearance, 4),
            "regime": "nominal",
            "init_pos_offset_mm": [round(radius * math.cos(angle), 4), round(radius * math.sin(angle), 4)],
            "init_rot_offset_deg": [round(tilt, 4), 0.0, 0.0],
            "radial_offset_mm": round(radius, 4),
            "tilt_deg": round(tilt, 4),
        }

    def iter_stratum_slots(self, task: str, counts: Optional[Dict[str, int]] = None) -> List[Dict[str, Any]]:
        """Lists scenario slots in stratum order. Default counts are the 500-episode specification."""
        table = counts if counts is not None else STAGE3_DATASET_COUNTS[task]
        slots = []
        for stratum, count in table.items():
            for index in range(int(count)):
                slots.append(self.sample_stratified_scenario(task, stratum, index))
        return slots

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

        # Initialize real simulator. Stratified scenarios pass an explicit pose.
        # Unstratified calls keep the historical reset so existing seeds stay reproducible.
        env = self._create_environment(task, params, dt)
        obs = self._reset_environment(env, task, params)

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

        ep_id = f"syn_{task}_{teacher_id}_seed{int(params['seed']):05d}"
        env_meta = {
            "initial_mu_true": params["friction_mu"],
            "initial_mass_kg": params["mass_kg"],
            "clearance_mm": params["clearance_mm"],
            "regime": params.get("regime", "nominal"),
            "stratum": params.get("stratum", "unstratified"),
            "dt_s": dt,
            "simulator_env": type(env).__name__,
        }
        if "radial_offset_mm" in params:
            env_meta["radial_offset_mm"] = params["radial_offset_mm"]
            env_meta["tilt_deg"] = params["tilt_deg"]

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

        # Observations and privileged ground truth are written to different files.
        if self.output_dir:
            self.write_separated_artifacts(record)

        return record

    def _reset_environment(self, env: Any, task: str, params: Dict[str, Any]):
        if not params.get("stratified"):
            return env.reset()
        if task in PRELIFT_TASKS:
            return env.reset(
                mu_true=float(params["friction_mu"]),
                object_mass=float(params["mass_kg"]),
                regime=str(params.get("regime", "nominal")),
            )
        reset_kwargs: Dict[str, Any] = {
            "friction_coeff": float(params["friction_mu"]),
            "clearance": float(params["clearance_mm"]),
        }
        if "init_pos_offset_mm" in params:
            reset_kwargs["init_pos_offset"] = np.asarray(params["init_pos_offset_mm"], dtype=np.float64)
        if "init_rot_offset_deg" in params:
            reset_kwargs["init_rot_offset"] = np.asarray(params["init_rot_offset_deg"], dtype=np.float64)
        return env.reset(**reset_kwargs)

    def write_separated_artifacts(self, record: SyntheticEpisodeRecord) -> Tuple[Path, Path]:
        """Writes model-visible observations and privileged metadata to separate files."""
        if self.output_dir is None:
            raise RuntimeError("write_separated_artifacts requires output_dir")
        leaked = record.leaked_privileged_keys()
        if leaked:
            raise RuntimeError(f"Observation package names privileged fields: {leaked}")
        obs_path = self.output_dir / f"{record.episode_id}.npz"
        privileged_path = self.output_dir / f"{record.episode_id}.privileged.json"
        package = record.observation_package()
        np.savez_compressed(
            obs_path,
            episode_id=record.episode_id,
            seed=np.int64(record.seed),
            task=record.task,
            provenance_hash=record.provenance_hash,
            **package,
        )
        with open(privileged_path, "w", encoding="utf-8") as handle:
            json.dump(record.privileged_payload(), handle, indent=2, sort_keys=True)
            handle.write("\n")
        return obs_path, privileged_path

    def generate_stratified_episode(
        self,
        task: str,
        teacher_id: str,
        stratum: str,
        index: int,
        episode_length: Optional[int] = None,
    ) -> SyntheticEpisodeRecord:
        """Generates the scenario at a fixed stratum slot. Index 0 is stable across pilot and production."""
        params = self.sample_stratified_scenario(task, stratum, index)
        return self.generate_episode(
            task,
            teacher_id,
            seed=int(params["seed"]),
            episode_length=episode_length,
            parameter_overrides=params,
        )

    def generate_batch(
        self,
        task: str,
        teacher_id: str,
        seeds: List[int],
        episode_length: Optional[int] = None,
    ) -> List[SyntheticEpisodeRecord]:
        """Generates multiple synthetic physical episodes across a list of distinct seeds."""
        return [self.generate_episode(task, teacher_id, s, episode_length) for s in seeds]
