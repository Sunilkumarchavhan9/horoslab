"""Stage 3.3 Production Contract Adapter and Generation Infrastructure.

Bridges the frozen Stage 3.0 factory with the approved Stage 3.3 production contract:
1. Reconciles seed namespace: implements production 3,300,000 seed formula and reserve 3,390,000 pool.
2. Implements Stage3ProductionExperienceFactory subclassing SyntheticExperienceFactory without modifying Stage 3.0 code.
3. Provides dual episode identity resolution: canonical ID (syn_{task}_{teacher}_seed{seed}) and slot alias (prod_{task}_{stratum}_{idx:03d}).
4. Accepts peg rim impact only when the stratum-1 event and the force-time measurement coincide.
5. Keeps ContactMode.JAMMING (frozen enum value 5) distinct from simulator WEDGING, and accepts the label only when the geometric lock is real.
6. Keeps reconstructable identifiers and privileged telemetry out of model-visible training inputs.
7. Guarantees deterministic replay and formalizes non-silent fail-closed rejection with audited reserve seed allocation.
"""

from __future__ import annotations

import copy
import hashlib
import hmac
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

# Frozen PegInHoleEnv and factory timing. The environment class defaults to
# 0.02 s, but SyntheticExperienceFactory passes EnvironmentSamplingSpec.dt_s,
# which is 0.01 s. Certified pilot impact metadata records dt_s = 0.01.
PEG_CONTROL_DT_S = 0.01
PEG_CONTACT_STIFFNESS_N_PER_M = 5000.0
PEG_FORCE_RESOLUTION_N = 1e-4
PEG_FORCE_LIMIT_N = 35.0
PEG_TORQUE_LIMIT_NM = 7.0
RIM_IMPACT_STRATUM = 1
JAMMING_LATERAL_FORCE_N = 15.0
JAMMING_TILT_DEG = 1.8
WEDGING_MIN_DEPTH_MM = 5.0

# Training archives may contain only these keys. Seed, episode_id and the
# provenance hash are reconstructable joins into the public seed registry or
# the audit manifest, so they are not model inputs.
MODEL_VISIBLE_ALLOWLIST: Set[str] = {
    "states",
    "actions",
    "next_states",
    "wrenches",
    "next_wrenches",
    "sample_id",
    "task",
}

RECONSTRUCTABLE_IDENTIFIER_KEYS: Set[str] = {
    "seed",
    "episode_id",
    "provenance_hash",
    "slot_alias",
    "canonical_episode_id",
    "rewards",
}

# Frozen extractor layout from extract_env_state_and_wrench. Wrench channels
# in the 15-D peg vector are the sensor wrench, not simulator parameters.
APPROVED_STATE_WIDTHS: Dict[str, Set[int]] = {
    "peg_in_hole": {12, 15},
    "compliant_prelift": {23},
    "compliant_lift": {23},
    "multifinger_lift": {23},
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
    1. Impact stratum: the rim-impact event is simulator stratum 1. The force-rate
       and impulse are computed only on that event. Force and torque limits are
       separate gates.
    2. Wedging stratum: same-timestep depth alignment. ContactMode.JAMMING is
       accepted only when that timestep is also a geometric lock.
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
        valid_jamming_steps: List[int] = []
        invalid_jamming_steps: List[int] = []
        impact_metrics: Dict[str, Any] = {}

        if stratum == "nominal":
            # Nominal insertion must never wedge
            stratum_specific_passed = (3 not in strata_observed)
        elif stratum == "impact":
            dt_s = float(episode.env_metadata.get("dt_s", PEG_CONTROL_DT_S))
            impact_metrics = evaluate_aligned_rim_impact(
                episode.next_wrenches,
                strata_observed,
                dt_s=dt_s,
            )
            stratum_specific_passed = bool(impact_metrics["passed"])
        elif stratum == "wedging":
            # Geometric wedging is simulator stratum 3 at insertion > 5 mm.
            # ContactMode.JAMMING is a different label. It is valid only at a
            # timestep that also satisfies the frozen mechanical-lock evidence.
            jamming_tilt = episode.env_metadata.get("tilt_deg")
            mode_horizon = len(modes)
            telemetry_horizon = min(len(strata_observed), len(depths_observed), episode.next_states.shape[0])
            for t in range(telemetry_horizon):
                state_depth = float(max(0.0, -episode.next_states[t, 2]))
                telem_depth = float(depths_observed[t])
                if (
                    strata_observed[t] == 3
                    and telem_depth > WEDGING_MIN_DEPTH_MM
                    and state_depth > WEDGING_MIN_DEPTH_MM
                    and abs(telem_depth - state_depth) < 1e-3
                ):
                    wedging_aligned_steps.append(t)
            for t in range(mode_horizon):
                if int(modes[t]) != int(ContactMode.JAMMING):
                    continue
                if (
                    t >= len(strata_observed)
                    or t >= len(depths_observed)
                    or t >= episode.next_wrenches.shape[0]
                    or t >= episode.next_states.shape[0]
                ):
                    invalid_jamming_steps.append(t)
                    continue
                state_depth = float(max(0.0, -episode.next_states[t, 2]))
                telem_depth = float(depths_observed[t])
                depth_aligned = (abs(telem_depth - state_depth) < 1e-3) and (state_depth > WEDGING_MIN_DEPTH_MM)
                lateral_force = float(np.linalg.norm(episode.next_wrenches[t, :2]))
                if depth_aligned and jamming_label_is_physically_valid(
                    mode=int(modes[t]),
                    stratum=int(strata_observed[t]),
                    depth_mm=telem_depth,
                    lateral_force_n=lateral_force,
                    tilt_deg=None if jamming_tilt is None else float(jamming_tilt),
                ):
                    valid_jamming_steps.append(t)
                else:
                    invalid_jamming_steps.append(t)
            stratum_specific_passed = (len(wedging_aligned_steps) > 0) and (len(invalid_jamming_steps) == 0)

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
            "valid_jamming_steps": valid_jamming_steps,
            "invalid_jamming_steps": invalid_jamming_steps,
            "wedging_aligned_depth_mm": round(float(depths_observed[wedging_aligned_steps[0]]), 4) if wedging_aligned_steps else 0.0,
            "interaction_passed": is_valid_interaction,
        }
        metrics.update(impact_metrics)
        return is_valid_interaction, metrics


# ---------------------------------------------------------------------------
# Impact dynamics and jamming ontology
# ---------------------------------------------------------------------------

def evaluate_aligned_rim_impact(
    next_wrenches: np.ndarray,
    strata: List[int],
    dt_s: float = PEG_CONTROL_DT_S,
) -> Dict[str, Any]:
    """Event-aligned rim-impact measurement.

    The rim event is simulator contact stratum 1 (chamfer contact while
    insertion < 2 mm). Impulse and rising force-rate are integrated only on
    that event. A force peak elsewhere does not count. The 2.0 N·s shock in
    document 12 is not used: at dt = 0.01 s the 35 N cap limits one step to
    0.35 N·s, and every certified pilot rim impulse is below 0.10 N·s.
    """
    wrenches = np.asarray(next_wrenches, dtype=np.float64)
    forces = np.linalg.norm(wrenches[:, :3], axis=-1) if wrenches.size else np.zeros(0)
    torques = np.linalg.norm(wrenches[:, 3:6], axis=-1) if wrenches.size else np.zeros(0)
    event = [index for index, stratum in enumerate(strata) if int(stratum) == RIM_IMPACT_STRATUM]
    rates: List[float] = []
    for index in event:
        previous = float(forces[index - 1]) if index > 0 else 0.0
        rates.append((float(forces[index]) - previous) / float(dt_s))
    impulse = float(sum(float(forces[index]) * float(dt_s) for index in event))
    peak_rate = float(max(rates)) if rates else 0.0
    impulse_floor = PEG_FORCE_RESOLUTION_N * float(dt_s)
    rate_floor = PEG_FORCE_RESOLUTION_N / float(dt_s)
    dynamics_passed = bool(event) and impulse > impulse_floor and peak_rate > rate_floor
    max_force = float(np.max(forces)) if forces.size else 0.0
    max_torque = float(np.max(torques)) if torques.size else 0.0
    force_limit_passed = max_force <= PEG_FORCE_LIMIT_N
    torque_limit_passed = max_torque <= PEG_TORQUE_LIMIT_NM
    peak_index = int(np.argmax(forces)) if forces.size else -1
    unrelated = max_force > PEG_FORCE_RESOLUTION_N and peak_index not in event
    return {
        "passed": bool(dynamics_passed and force_limit_passed and torque_limit_passed),
        "impact_dynamics_passed": bool(dynamics_passed),
        "force_limit_passed": bool(force_limit_passed),
        "torque_limit_passed": bool(torque_limit_passed),
        "rim_event_steps": event,
        "event_impulse_n_s": impulse,
        "event_peak_rising_rate_n_s": peak_rate,
        "unrelated_peak_outside_event": bool(unrelated),
        "max_contact_force_n": max_force,
        "max_torque_nm": max_torque,
    }


def jamming_label_is_physically_valid(
    mode: int,
    stratum: int,
    depth_mm: float,
    lateral_force_n: float,
    tilt_deg: Optional[float] = None,
) -> bool:
    """Return whether ContactMode.JAMMING is the frozen geometric lock.

    The frozen enum defines JAMMING as two-point geometric wedging / mechanical
    lock. It is not a synonym for simulator stratum 3, and it is not forbidden
    merely because the episode was sampled from the wedging stratum. A label is
    valid only when the same timestep is in simulator WEDGING, deeper than the
    frozen 5 mm wedging gate, and above the frozen 15 N lateral-force lock.
    When tilt is supplied, it must also exceed the frozen 1.8 deg classifier gate.
    """
    if int(mode) != int(ContactMode.JAMMING):
        return False
    if int(stratum) != 3:
        return False
    if float(depth_mm) <= WEDGING_MIN_DEPTH_MM:
        return False
    if float(lateral_force_n) <= JAMMING_LATERAL_FORCE_N:
        return False
    if tilt_deg is not None and float(tilt_deg) <= JAMMING_TILT_DEG:
        return False
    return True


# ---------------------------------------------------------------------------
# Data Security & Model Ingestion Allowlist Enforcer
# ---------------------------------------------------------------------------

def validate_model_visible_package(pkg: Dict[str, Any]) -> bool:
    """Reject reconstructable identifiers and any key outside the training allowlist."""
    for key in pkg.keys():
        key_str = str(key)
        lowered = key_str.lower()
        if key_str in RECONSTRUCTABLE_IDENTIFIER_KEYS or key_str not in MODEL_VISIBLE_ALLOWLIST:
            raise SecurityViolationError(
                f"Unauthorized key '{key_str}' detected in model observation package! "
                f"Allowed keys: {sorted(MODEL_VISIBLE_ALLOWLIST)}"
            )
        for token in PRIVILEGED_FIELD_BLOCKLIST:
            if token in lowered:
                raise SecurityViolationError(
                    f"Privileged simulator field '{key_str}' matches forbidden token '{token}'!"
                )
    return True


def opaque_sample_id(canonical_episode_id: str, audit_salt: bytes) -> str:
    """HMAC sample id. The salt stays in the audit manifest, not in the training archive."""
    if not audit_salt:
        raise SecurityViolationError("Audit salt must be non-empty and must not be written into the training archive")
    return hmac.new(audit_salt, canonical_episode_id.encode("utf-8"), hashlib.sha256).hexdigest()


def assert_tensor_channels_clean(
    task: str,
    states: np.ndarray,
    wrenches: np.ndarray,
    privileged_series: Dict[str, Any],
) -> None:
    """Reject a state or wrench channel that copies a privileged telemetry series."""
    state_array = np.asarray(states, dtype=np.float64)
    wrench_array = np.asarray(wrenches, dtype=np.float64)
    allowed = APPROVED_STATE_WIDTHS.get(task)
    if allowed is None or state_array.ndim != 2 or state_array.shape[1] not in allowed:
        raise SecurityViolationError(
            f"State width {getattr(state_array, 'shape', None)} is outside the approved schema for {task}"
        )
    if wrench_array.ndim != 2 or wrench_array.shape != (state_array.shape[0], 6):
        raise SecurityViolationError("Wrench tensor must be (T, 6) and aligned with the state horizon")
    for name, series in privileged_series.items():
        privileged = np.asarray(series, dtype=np.float64).reshape(-1)
        if privileged.shape[0] != state_array.shape[0]:
            continue
        if not np.any(np.abs(privileged) > 1e-8):
            continue
        for channel in range(state_array.shape[1]):
            if np.allclose(state_array[:, channel], privileged, atol=1e-4, rtol=0.0):
                raise SecurityViolationError(
                    f"State channel {channel} copies privileged series '{name}'"
                )
        for channel in range(wrench_array.shape[1]):
            if np.allclose(wrench_array[:, channel], privileged, atol=1e-4, rtol=0.0):
                raise SecurityViolationError(
                    f"Wrench channel {channel} copies privileged series '{name}'"
                )


def _jsonable_audit(value: Any) -> Any:
    if isinstance(value, np.ndarray):
        return np.ascontiguousarray(value).tolist()
    if isinstance(value, (np.floating, float)):
        return float(value)
    if isinstance(value, (np.integer, int)) and not isinstance(value, bool):
        return int(value)
    if isinstance(value, dict):
        return {str(key): _jsonable_audit(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_jsonable_audit(item) for item in value]
    return value


def build_training_package_and_audit(
    record: SyntheticEpisodeRecord,
    audit_salt: bytes,
) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """Split a record into a model package and a separately controlled audit record."""
    canonical = str(record.env_metadata.get("canonical_episode_id", record.episode_id))
    sample_id = opaque_sample_id(canonical, audit_salt)
    privileged_series = {
        key: record.env_metadata[key]
        for key in ("step_mu_true", "step_object_mass_kg", "step_contact_stratum")
        if key in record.env_metadata
    }
    assert_tensor_channels_clean(record.task, record.states, record.wrenches, privileged_series)
    assert_tensor_channels_clean(record.task, record.next_states, record.next_wrenches, privileged_series)
    package = {
        "states": np.asarray(record.states),
        "actions": np.asarray(record.actions),
        "next_states": np.asarray(record.next_states),
        "wrenches": np.asarray(record.wrenches),
        "next_wrenches": np.asarray(record.next_wrenches),
        "sample_id": sample_id,
        "task": record.task,
    }
    validate_model_visible_package(package)
    audit = {
        "sample_id": sample_id,
        "episode_id": record.episode_id,
        "canonical_episode_id": canonical,
        "seed": int(record.seed),
        "task": record.task,
        "stratum": record.env_metadata.get("stratum"),
        "provenance_hash": record.provenance_hash,
        "friction_mu": record.env_metadata.get("initial_mu_true", record.env_metadata.get("friction_mu")),
        "mass_kg": record.env_metadata.get("initial_mass_kg"),
        "clearance_mm": record.env_metadata.get("clearance_mm"),
        "env_metadata": _jsonable_audit(record.env_metadata),
        "modes": np.asarray(record.modes).tolist(),
        "rewards": np.asarray(record.rewards).tolist(),
        "audit_salt_sha256": hashlib.sha256(audit_salt).hexdigest(),
    }
    return package, audit


def sanitize_for_model_ingestion(
    record: SyntheticEpisodeRecord,
    audit_salt: bytes = b"",
) -> Dict[str, Any]:
    """Model-visible package only. The audit mapping is not returned to the loader."""
    package, _audit = build_training_package_and_audit(record, audit_salt)
    return package


class ProductionTrainingDataloader:
    """Loads training archives and refuses colocated audit or registry files."""

    def __init__(self, training_dir: Path):
        self.training_dir = Path(training_dir)
        self._refuse_colocated_audit(self.training_dir)
        self.samples: List[Dict[str, Any]] = []
        for path in sorted(self.training_dir.glob("*.npz")):
            self.samples.append(self._load_archive(path))

    @staticmethod
    def _refuse_colocated_audit(directory: Path) -> None:
        if not directory.is_dir():
            raise SecurityViolationError(f"Training directory does not exist: {directory}")
        for path in directory.iterdir():
            name = path.name.lower()
            if name.endswith(".privileged.json") or "audit" in name or "seed_registry" in name:
                raise SecurityViolationError(
                    f"Training directory contains separately controlled audit material: {path.name}"
                )

    @staticmethod
    def _scalar_text(value: Any) -> str:
        array = np.asarray(value)
        if array.shape == ():
            return str(array.item())
        return str(array.reshape(-1)[0])

    def _load_archive(self, path: Path) -> Dict[str, Any]:
        with np.load(path, allow_pickle=False) as data:
            package = {
                key: self._scalar_text(data[key]) if key in {"sample_id", "task"} else np.asarray(data[key])
                for key in data.files
            }
        validate_model_visible_package(package)
        assert_tensor_channels_clean(str(package["task"]), package["states"], package["wrenches"], {})
        assert_tensor_channels_clean(str(package["task"]), package["next_states"], package["next_wrenches"], {})
        return package

    def batches(self, batch_size: int) -> List[Dict[str, Any]]:
        produced: List[Dict[str, Any]] = []
        for start in range(0, len(self.samples), batch_size):
            chunk = self.samples[start:start + batch_size]
            batch = {
                "sample_id": [sample["sample_id"] for sample in chunk],
                "task": [sample["task"] for sample in chunk],
                "states": np.stack([sample["states"] for sample in chunk]),
                "actions": np.stack([sample["actions"] for sample in chunk]),
                "next_states": np.stack([sample["next_states"] for sample in chunk]),
                "wrenches": np.stack([sample["wrenches"] for sample in chunk]),
                "next_wrenches": np.stack([sample["next_wrenches"] for sample in chunk]),
            }
            validate_model_visible_package({
                "sample_id": batch["sample_id"][0],
                "task": batch["task"][0],
                "states": batch["states"][0],
                "actions": batch["actions"][0],
                "next_states": batch["next_states"][0],
                "wrenches": batch["wrenches"][0],
                "next_wrenches": batch["next_wrenches"][0],
            })
            produced.append(batch)
        return produced

    def cache_batch(self, batch: Dict[str, Any], path: Path) -> Path:
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        validate_model_visible_package({
            "sample_id": batch["sample_id"][0],
            "task": batch["task"][0],
            "states": batch["states"][0],
            "actions": batch["actions"][0],
            "next_states": batch["next_states"][0],
            "wrenches": batch["wrenches"][0],
            "next_wrenches": batch["next_wrenches"][0],
        })
        np.savez_compressed(
            path,
            sample_id=np.array(batch["sample_id"]),
            task=np.array(batch["task"]),
            states=batch["states"],
            actions=batch["actions"],
            next_states=batch["next_states"],
            wrenches=batch["wrenches"],
            next_wrenches=batch["next_wrenches"],
        )
        return path

    def apply_transform(self, batch: Dict[str, Any], transform: Any) -> Dict[str, Any]:
        package = {
            "sample_id": batch["sample_id"][0],
            "task": batch["task"][0],
            "states": batch["states"][0],
            "actions": batch["actions"][0],
            "next_states": batch["next_states"][0],
            "wrenches": batch["wrenches"][0],
            "next_wrenches": batch["next_wrenches"][0],
        }
        transformed = transform(package)
        validate_model_visible_package(transformed)
        return transformed


def verify_provenance_against_serialized_audit(
    record: SyntheticEpisodeRecord,
    path: Path,
) -> Tuple[bool, str, str]:
    """Write the audit record and compare its stored hash with the live record hash."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "episode_id": record.episode_id,
        "canonical_episode_id": record.env_metadata.get("canonical_episode_id", record.episode_id),
        "seed": int(record.seed),
        "task": record.task,
        "provenance_hash": record.provenance_hash,
        "env_metadata": _jsonable_audit(record.env_metadata),
    }
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    stored = str(json.loads(path.read_text(encoding="utf-8"))["provenance_hash"])
    file_sha = hashlib.sha256(path.read_bytes()).hexdigest()
    verified = stored == record.provenance_hash == record.compute_record_hash()
    return verified, stored, file_sha


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
