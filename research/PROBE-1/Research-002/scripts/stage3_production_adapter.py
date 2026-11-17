"""Stage 3.3 Production Contract Adapter and Generation Infrastructure.

Bridges the frozen Stage 3.0 factory with the approved Stage 3.3 production contract:
1. Reconciles seed namespace: implements production 3,300,000 seed formula and reserve 3,390,000 pool.
2. Implements Stage3ProductionExperienceFactory subclassing SyntheticExperienceFactory without modifying Stage 3.0 code.
3. Provides dual episode identity resolution: canonical ID (syn_{task}_{teacher}_seed{seed}) and slot alias (prod_{task}_{stratum}_{idx:03d}).
4. Hardens impact acceptance: strictly requires authentic rim contact (stratum 1 or mode 4) AND measurable impact force (>= 1.0 N).
5. Enforces ContactMode 7-class ontology decoupling from simulator strata (mode 5 JAMMING strictly prohibited in wedging).
6. Enforces strict model-visible observation allowlist and protects privileged simulator telemetry.
7. Guarantees deterministic replay and formalizes non-silent fail-closed rejection with audited reserve seed allocation.
"""

from __future__ import annotations

import copy
import hashlib
import json
import math
import os
import sys
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

import numpy as np

# Ensure R002_ROOT and src are on sys.path
SCRIPT_DIR = Path(__file__).resolve().parent
R002_ROOT = SCRIPT_DIR.parent
for path in (R002_ROOT, R002_ROOT / "src"):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

# Import frozen Stage 3.0 infrastructure
from contact_modes.contact_mode_definitions import ContactMode, NUM_MODES
from teaching.factory import (
    EnvironmentSamplingSpec,
    SyntheticEpisodeRecord,
    SyntheticExperienceFactory,
    STAGE3_DATASET_COUNTS,
    PEGGED_LENGTH_MM,
)
from teaching.inference import DeterministicMockTeacher, TeacherInferenceEngine, TeacherQueryPayload
from teaching.registry import TeacherModelDescriptor, TeacherModelRegistry, TeacherProvider


# ---------------------------------------------------------------------------
# Constants & Contract Definitions
# ---------------------------------------------------------------------------

STAGE3_PRODUCTION_SEED_BASE = 3_300_000
STAGE3_RESERVE_SEED_BASE = 3_390_000

STAGE3_TASK_CODES: Dict[str, int] = {
    "compliant_prelift": 1,
    "peg_in_hole": 2,
}

STAGE3_STRATUM_CODES: Dict[str, int] = {
    "nominal": 1,
    "probe": 2,
    "nonstationary": 3,
    "impact": 4,
    "wedging": 5,
}

RESERVE_SEEDS_PER_STRATUM = 50

# Strict allowlist of keys permitted in student-visible observation packages
MODEL_VISIBLE_ALLOWLIST: Set[str] = {
    "states",
    "actions",
    "next_states",
    "wrenches",
    "next_wrenches",
    "rewards",
    "episode_id",
    "seed",
    "task",
    "provenance_hash",
}

# Blocklist tokens that MUST NEVER appear in model-visible training inputs
PRIVILEGED_FIELD_BLOCKLIST: Set[str] = {
    "mu_true",
    "initial_mu_true",
    "object_mass",
    "initial_mass_kg",
    "clearance_mm",
    "clearance",
    "contact_mode",
    "contactmode",
    "friction",
    "step_mu_true",
    "step_object_mass_kg",
    "step_contact_stratum",
    "step_insertion_depth_mm",
    "step_force_norm_n",
    "step_torque_norm_nm",
    "strata_observed",
    "modes",
    "env_metadata",
    "teacher_suggestions",
}


class SecurityViolationError(ValueError):
    """Raised when privileged simulator ground truth is leaked into model observations."""
    pass


def create_deterministic_mock_engine(
    model_id: str = "mock_teacher_deterministic_v1",
) -> Tuple[TeacherInferenceEngine, TeacherModelRegistry, TeacherModelDescriptor]:
    """Factory helper creating a fully-registered deterministic mock teacher inference engine."""
    reg = TeacherModelRegistry()
    desc = TeacherModelDescriptor(
        model_id=model_id,
        display_name="Deterministic Mock Teacher",
        version="1.0.0",
        provider=TeacherProvider.MOCK_DETERMINISTIC,
        supported_modalities=["state_vector"],
        capabilities=["trajectory_proposal"],
        license="internal_horos_research",
        has_representations=False,
        deterministic_seed_supported=True,
    )
    reg.register(desc)
    engine = TeacherInferenceEngine(reg)
    engine.register_adapter(model_id, DeterministicMockTeacher(desc))
    return engine, reg, desc


# ---------------------------------------------------------------------------
# Telemetry Recorder Wrapper
# ---------------------------------------------------------------------------

class TelemetryRecorderWrapper:
    """Wraps simulation environments to record empirical step-by-step simulator telemetry."""

    def __init__(self, env: Any, task: str):
        self._env = env
        self.task = task
        self.telemetry: Dict[str, List[Any]] = {
            "step_mu_true": [],
            "step_object_mass_kg": [],
            "step_contact_stratum": [],
            "step_insertion_depth_mm": [],
            "step_force_norm_n": [],
            "step_torque_norm_nm": [],
        }

    def __getattr__(self, name: str) -> Any:
        return getattr(self._env, name)

    def reset(self, *args: Any, **kwargs: Any) -> Any:
        res = self._env.reset(*args, **kwargs)
        self.telemetry = {
            "step_mu_true": [],
            "step_object_mass_kg": [],
            "step_contact_stratum": [],
            "step_insertion_depth_mm": [],
            "step_force_norm_n": [],
            "step_torque_norm_nm": [],
        }
        return res

    def step(self, action: np.ndarray) -> Any:
        res = self._env.step(action)
        if hasattr(self._env, "friction_history"):
            self.telemetry["step_mu_true"] = [round(float(x), 4) for x in self._env.friction_history[1:]]
            self.telemetry["step_object_mass_kg"] = [round(float(x), 4) for x in self._env.mass_history[1:]]
        if hasattr(self._env, "contact_stratum"):
            self.telemetry["step_contact_stratum"].append(int(self._env.contact_stratum))
            self.telemetry["step_insertion_depth_mm"].append(round(float(max(0.0, -self._env.peg_pos[2])), 4))
            self.telemetry["step_force_norm_n"].append(round(float(np.linalg.norm(self._env.contact_wrench[:3])), 4))
            self.telemetry["step_torque_norm_nm"].append(round(float(np.linalg.norm(self._env.contact_wrench[3:6])), 4))
        return res


# ---------------------------------------------------------------------------
# Stage 3.3 Production Experience Factory
# ---------------------------------------------------------------------------

class Stage3ProductionExperienceFactory(SyntheticExperienceFactory):
    """Production Experience Factory for Stage 3.3 Dataset Generation.

    Subclasses SyntheticExperienceFactory to:
    - Implement production seed formula: 3_300_000 + task_code*10,000 + stratum_code*1,000 + index
    - Implement reserve seed formula: 3_390_000 + task_code*10,000 + stratum_code*1,000 + reserve_index
    - Instrument environments with TelemetryRecorderWrapper for authoritative post-action measurements
    - Standardize dual episode identity: canonical ID and slot alias
    - Guarantee bitwise deterministic replay
    """

    def __init__(self, *args: Any, **kwargs: Any):
        super().__init__(*args, **kwargs)
        self._last_env: Optional[TelemetryRecorderWrapper] = None

    @staticmethod
    def scenario_seed(task: str, stratum: str, index: int) -> int:
        """Production seed formula (base 3,300,000). Matches Stage 3.3 Seed Registry."""
        if task not in STAGE3_TASK_CODES:
            raise ValueError(f"Unknown task: {task}")
        if stratum not in STAGE3_STRATUM_CODES:
            raise ValueError(f"Unknown stratum: {stratum}")
        task_code = STAGE3_TASK_CODES[task]
        stratum_code = STAGE3_STRATUM_CODES[stratum]
        return STAGE3_PRODUCTION_SEED_BASE + task_code * 10_000 + stratum_code * 1_000 + int(index)

    @staticmethod
    def reserve_scenario_seed(task: str, stratum: str, reserve_index: int) -> int:
        """Reserve pool seed formula (base 3,390,000). Pre-registered for audited replacement."""
        if task not in STAGE3_TASK_CODES:
            raise ValueError(f"Unknown task: {task}")
        if stratum not in STAGE3_STRATUM_CODES:
            raise ValueError(f"Unknown stratum: {stratum}")
        if not (0 <= reserve_index < RESERVE_SEEDS_PER_STRATUM):
            raise ValueError(f"Reserve index out of range [0, {RESERVE_SEEDS_PER_STRATUM}): {reserve_index}")
        task_code = STAGE3_TASK_CODES[task]
        stratum_code = STAGE3_STRATUM_CODES[stratum]
        return STAGE3_RESERVE_SEED_BASE + task_code * 10_000 + stratum_code * 1_000 + int(reserve_index)

    def sample_stratified_scenario(self, task: str, stratum: str, index: int) -> Dict[str, Any]:
        """Draws one scenario inside the approved Stage 3.3 production distributions."""
        if task not in STAGE3_DATASET_COUNTS or stratum not in STAGE3_DATASET_COUNTS[task]:
            raise ValueError(f"Unsupported Stage 3.3 scenario {task}/{stratum}")

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
            else:  # nonstationary
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
                "slot_alias": f"prod_{task}_{stratum}_{int(index):03d}",
            }

        # peg_in_hole
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
        else:  # wedging
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
            "slot_alias": f"prod_{task}_{stratum}_{int(index):03d}",
        }

    def _create_environment(self, task: str, params: Dict[str, Any], dt: float) -> TelemetryRecorderWrapper:
        """Instantiates simulator environment wrapped in TelemetryRecorderWrapper."""
        raw_env = super()._create_environment(task, params, dt)
        wrapped = TelemetryRecorderWrapper(raw_env, task)
        self._last_env = wrapped
        return wrapped

    def generate_episode(
        self,
        task: str,
        teacher_id: str,
        seed: int,
        episode_length: Optional[int] = None,
        parameter_overrides: Optional[Dict[str, Any]] = None,
        slot_alias: Optional[str] = None,
    ) -> SyntheticEpisodeRecord:
        """Executes synthetic episode with telemetry capture and dual episode ID resolution."""
        record = super().generate_episode(task, teacher_id, seed, episode_length, parameter_overrides)

        # Attach empirical telemetry from wrapped simulator
        if self._last_env is not None and hasattr(self._last_env, "telemetry"):
            for k, v in self._last_env.telemetry.items():
                if v:
                    record.env_metadata[k] = list(v)

        # Standardize dual episode identity
        canonical_id = f"syn_{task}_{teacher_id}_seed{int(seed):05d}"
        inferred_alias = slot_alias
        if inferred_alias is None and parameter_overrides and "slot_alias" in parameter_overrides:
            inferred_alias = parameter_overrides["slot_alias"]

        record.env_metadata["canonical_episode_id"] = canonical_id
        if inferred_alias:
            record.env_metadata["slot_alias"] = inferred_alias
            record.episode_id = inferred_alias
        else:
            record.episode_id = canonical_id

        # Recompute authoritative provenance hash
        record.provenance_hash = record.compute_record_hash()
        return record


# ---------------------------------------------------------------------------
# Reconciled Physical Interaction Verification
# ---------------------------------------------------------------------------

def verify_production_physical_interaction(
    task: str,
    episode: Any,
) -> Tuple[bool, Dict[str, Any]]:
    """Authoritative physical interaction verification for Stage 3.3 production contract.

    Reconciliations enforced:
    1. Impact stratum: strictly requires authentic rim contact (stratum 1 or mode 4)
       AND measurable impact force (>= 1.0 N) AND bounded forces (<= 35.0 N, <= 7.0 Nm).
    2. Wedging stratum: strictly requires same-timestep alignment between state depth,
       telemetry depth (> 5.0 mm), and simulator stratum 3; forbids classifier mode 5 (JAMMING).
    3. Prelift nominal: requires positive liftoff (> 0.001 mm) and shear pad stretch.
    4. Prelift probe: requires controlled sliding (>= 0.0005 m/s) with zero liftoff.
    5. Prelift nonstationary:
       - Regime A: causal post-transition slip (t >= 14); pre-transition slip fails.
       - Regime B: mass influx hold under accretion.
    """
    stratum = episode.env_metadata.get("stratum", "nominal")

    if task in ("compliant_prelift", "compliant_lift", "multifinger_lift"):
        # Prelift telemetry & states
        # next_states[:, 12:16] are finger normal forces
        # next_states[:, 16:20] are finger slip velocities
        # next_states[:, 2] is workpiece z position in mm
        finger_normal_forces = episode.next_states[:, 12:16]
        finger_slip_vels = episode.next_states[:, 16:20]
        total_normal_force = np.sum(finger_normal_forces, axis=-1)
        peak_total_normal_force = float(np.max(total_normal_force))
        peak_finger_normal_force = float(np.max(finger_normal_forces))

        vertical_shear_forces = np.abs(episode.next_wrenches[:, 2])
        peak_shear_force = float(np.max(vertical_shear_forces))

        max_slip_vel = float(np.max(finger_slip_vels))
        max_z_obj = float(np.max(episode.next_states[:, 2]))
        modes = [int(m) for m in episode.modes]

        contact_attained = peak_total_normal_force >= 0.50
        forces_bounded = (
            peak_finger_normal_force <= 20.0
            and peak_total_normal_force <= 20.0
            and peak_shear_force <= 15.0
        )
        shear_attained = peak_shear_force >= 0.50
        contact_modes_attained = any(m != 0 for m in modes)

        event_specific_passed = True
        regime_a_causal = None

        if stratum == "nominal":
            # Positive workpiece liftoff (> 0.001 mm) without slip
            liftoff_attained = max_z_obj > 0.001
            no_slip_failure = max_slip_vel < 0.0005
            event_specific_passed = liftoff_attained and no_slip_failure
        elif stratum == "probe":
            # Controlled Coulomb sliding without liftoff
            sliding_attained = max_slip_vel >= 0.0005
            no_liftoff = max_z_obj <= 0.0001
            event_specific_passed = sliding_attained and no_liftoff
        elif stratum == "nonstationary":
            regime = episode.env_metadata.get("regime", "A")
            if regime == "A":
                # Friction transition occurs at step 14 (dt=0.01s, 0.14s)
                # Causal Invariant: Slip must occur AFTER transition (t >= 14)
                H = finger_slip_vels.shape[0]
                pre_trans_slip = float(np.max(finger_slip_vels[:14])) if H >= 14 else 0.0
                post_trans_slip = float(np.max(finger_slip_vels[14:])) if H > 14 else 0.0
                regime_a_causal = (post_trans_slip > 0.0010) and (pre_trans_slip <= 0.0010)
                event_specific_passed = bool(regime_a_causal)
            else:  # Regime B
                # Mass influx clamping hold
                event_specific_passed = contact_attained and shear_attained

        is_valid_interaction = (
            contact_attained
            and forces_bounded
            and shear_attained
            and contact_modes_attained
            and event_specific_passed
        )

        metrics = {
            "contact_attained": contact_attained,
            "forces_bounded": forces_bounded,
            "shear_attained": shear_attained,
            "contact_modes_attained": contact_modes_attained,
            "event_specific_passed": event_specific_passed,
            "peak_total_normal_force_n": round(peak_total_normal_force, 3),
            "peak_finger_normal_force_n": round(peak_finger_normal_force, 3),
            "peak_shear_force_n": round(peak_shear_force, 3),
            "max_slip_vel_m_s": round(max_slip_vel, 5),
            "max_z_obj_mm": round(max_z_obj, 5),
            "modes_observed": sorted(list(set(modes))),
            "mode_counts": dict(Counter(modes)),
            "interaction_passed": is_valid_interaction,
        }
        if regime_a_causal is not None:
            metrics["regime_a_causal"] = regime_a_causal
        return is_valid_interaction, metrics

    else:
        # Peg-in-Hole task
        forces = np.linalg.norm(episode.next_wrenches[:, :3], axis=-1)
        torques = np.linalg.norm(episode.next_wrenches[:, 3:6], axis=-1)
        max_force = float(np.max(forces))
        max_torque = float(np.max(torques))
        min_z = float(np.min(episode.next_states[:, 2]))
        max_insertion_mm = float(max(0.0, -min_z))
        modes = [int(m) for m in episode.modes]
        strata_observed = episode.env_metadata.get("step_contact_stratum", [])
        depths_observed = episode.env_metadata.get("step_insertion_depth_mm", [])

        insertion_attained = min_z <= 0.0
        contact_attained = max_force > 0.0
        forces_bounded = (max_force <= 35.0) and (max_torque <= 7.0)
        contact_modes_attained = any(m != 0 for m in modes)

        stratum_specific_passed = True
        wedging_aligned_steps: List[int] = []

        if stratum == "nominal":
            # Nominal insertion must never wedge
            stratum_specific_passed = (3 not in strata_observed)
        elif stratum == "impact":
            # Reconciled Contract: strictly require authentic rim collision
            # (stratum 1 OR mode 4) AND measurable impact force (>= 1.0 N)
            authentic_rim_contact = (1 in strata_observed) or (4 in modes)
            measurable_force = max_force >= 1.0
            stratum_specific_passed = authentic_rim_contact and measurable_force and forces_bounded
        elif stratum == "wedging":
            # 1. Simulator stratum 3 must occur simultaneously with insertion depth > 5.0 mm
            # 2. State depth and telemetry depth must match within 1e-3 mm
            # 3. Classifier mode 5 (JAMMING) must NOT be emitted
            jamming_forbidden = (5 not in modes)
            T_len = min(len(strata_observed), len(depths_observed), episode.next_states.shape[0])
            for t in range(T_len):
                state_depth = float(max(0.0, -episode.next_states[t, 2]))
                telem_depth = float(depths_observed[t])
                if (
                    strata_observed[t] == 3
                    and telem_depth > 5.0
                    and state_depth > 5.0
                    and abs(telem_depth - state_depth) < 1e-3
                ):
                    wedging_aligned_steps.append(t)
            stratum_specific_passed = (len(wedging_aligned_steps) > 0) and jamming_forbidden

        is_valid_interaction = (
            insertion_attained
            and contact_attained
            and forces_bounded
            and contact_modes_attained
            and stratum_specific_passed
        )

        metrics = {
            "insertion_attained": insertion_attained,
            "contact_attained": contact_attained,
            "forces_bounded": forces_bounded,
            "contact_modes_attained": contact_modes_attained,
            "stratum_specific_passed": stratum_specific_passed,
            "max_contact_force_n": round(max_force, 3),
            "max_torque_nm": round(max_torque, 3),
            "min_z_mm": round(min_z, 3),
            "max_insertion_mm": round(max_insertion_mm, 3),
            "modes_observed": sorted(list(set(modes))),
            "mode_counts": dict(Counter(modes)),
            "strata_observed": sorted(list(set(strata_observed))),
            "wedging_stratum_attained": (3 in strata_observed),
            "wedging_aligned_steps": wedging_aligned_steps,
            "wedging_aligned_depth_mm": round(float(depths_observed[wedging_aligned_steps[0]]), 4) if wedging_aligned_steps else 0.0,
            "interaction_passed": is_valid_interaction,
        }
        return is_valid_interaction, metrics


# ---------------------------------------------------------------------------
# Data Security & Model Ingestion Allowlist Enforcer
# ---------------------------------------------------------------------------

def validate_model_visible_package(pkg: Dict[str, Any]) -> bool:
    """Enforces strict allowlist on model-visible data packages.

    Raises SecurityViolationError if any unauthorized or privileged key is detected.
    """
    for key in pkg.keys():
        key_str = str(key)
        lowered = key_str.lower()

        # Check against allowlist
        if key_str not in MODEL_VISIBLE_ALLOWLIST:
            raise SecurityViolationError(
                f"Unauthorized key '{key_str}' detected in model observation package! "
                f"Allowed keys: {sorted(list(MODEL_VISIBLE_ALLOWLIST))}"
            )

        # Check against privileged blocklist tokens
        for token in PRIVILEGED_FIELD_BLOCKLIST:
            if token in lowered:
                raise SecurityViolationError(
                    f"Privileged simulator field '{key_str}' matches forbidden token '{token}'!"
                )

    return True


def sanitize_for_model_ingestion(record: SyntheticEpisodeRecord) -> Dict[str, Any]:
    """Produces verified model-visible package stripped of all privileged metadata."""
    pkg = {
        "states": record.states,
        "actions": record.actions,
        "next_states": record.next_states,
        "wrenches": record.wrenches,
        "next_wrenches": record.next_wrenches,
        "rewards": record.rewards,
        "episode_id": record.episode_id,
        "seed": int(record.seed),
        "task": record.task,
        "provenance_hash": record.provenance_hash,
    }
    validate_model_visible_package(pkg)
    return pkg


# ---------------------------------------------------------------------------
# Deterministic Replay & Provenance Verification
# ---------------------------------------------------------------------------

def verify_deterministic_reproducibility(
    factory: Stage3ProductionExperienceFactory,
    task: str,
    stratum: str,
    index: int,
    teacher_id: str,
    episode_length: int = 20,
) -> Tuple[bool, str, str]:
    """Proves bitwise deterministic reproducibility for a scenario.

    Runs two independent syntheses from the same seed and asserts identical arrays and hash.
    """
    scenario = factory.sample_stratified_scenario(task, stratum, index)
    seed = scenario["seed"]

    rec1 = factory.generate_episode(
        task=task,
        teacher_id=teacher_id,
        seed=seed,
        episode_length=episode_length,
        parameter_overrides=scenario,
    )

    rec2 = factory.generate_episode(
        task=task,
        teacher_id=teacher_id,
        seed=seed,
        episode_length=episode_length,
        parameter_overrides=scenario,
    )

    # Check array bitwise equality
    arrays_match = (
        np.array_equal(rec1.states, rec2.states)
        and np.array_equal(rec1.actions, rec2.actions)
        and np.array_equal(rec1.next_states, rec2.next_states)
        and np.array_equal(rec1.wrenches, rec2.wrenches)
        and np.array_equal(rec1.next_wrenches, rec2.next_wrenches)
        and np.array_equal(rec1.modes, rec2.modes)
        and np.array_equal(rec1.rewards, rec2.rewards)
    )

    hashes_match = (rec1.provenance_hash == rec2.provenance_hash)
    success = bool(arrays_match and hashes_match)
    return success, rec1.provenance_hash, rec2.provenance_hash


# ---------------------------------------------------------------------------
# Reserve Pool Specification & Generation
# ---------------------------------------------------------------------------

def generate_reserve_seed_registry() -> Dict[str, Any]:
    """Generates the 300 pre-registered reserve seeds across all 6 strata.

    Formula: 3_390_000 + task_code*10,000 + stratum_code*1,000 + reserve_index (0..49)
    """
    reserve_pool: Dict[str, Any] = {
        "reserve_base_seed": STAGE3_RESERVE_SEED_BASE,
        "reserve_seeds_per_stratum": RESERVE_SEEDS_PER_STRATUM,
        "total_reserve_seeds": 6 * RESERVE_SEEDS_PER_STRATUM,
        "policy": "Non-silent fail-closed. Rejections commit to rejected_manifest.json. "
                  "Reserve seeds require audited allocation manifest in Stage 3.4.",
        "strata_ranges": {},
        "reserve_seeds": [],
    }

    for task, strata in [
        ("compliant_prelift", ["nominal", "probe", "nonstationary"]),
        ("peg_in_hole", ["nominal", "impact", "wedging"]),
    ]:
        for stratum in strata:
            key = f"{task}_{stratum}"
            start_seed = Stage3ProductionExperienceFactory.reserve_scenario_seed(task, stratum, 0)
            end_seed = Stage3ProductionExperienceFactory.reserve_scenario_seed(
                task, stratum, RESERVE_SEEDS_PER_STRATUM - 1
            )
            reserve_pool["strata_ranges"][key] = [start_seed, end_seed]

            for r_idx in range(RESERVE_SEEDS_PER_STRATUM):
                seed = Stage3ProductionExperienceFactory.reserve_scenario_seed(task, stratum, r_idx)
                reserve_pool["reserve_seeds"].append({
                    "task": task,
                    "stratum": stratum,
                    "reserve_index": r_idx,
                    "seed": seed,
                    "status": "UNALLOCATED_LOCKED",
                })

    return reserve_pool
