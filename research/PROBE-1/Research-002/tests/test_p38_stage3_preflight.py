"""Stage 3.0 regression tests for dataset-generation preflight.

Covers deterministic stratified sampling, scenario counts, task-specific physics
rejection, complete provenance hashing, and separation of privileged ground truth
from model-visible observations. No student training.
"""

from __future__ import annotations

import json
import os
import sys
import tempfile

import numpy as np
import pytest

R002_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
for path in (R002_ROOT, os.path.join(R002_ROOT, "src")):
    if path not in sys.path:
        sys.path.insert(0, path)

from teaching.factory import (  # noqa: E402
    STAGE3_DATASET_COUNTS,
    STAGE3_PILOT_COUNTS,
    EnvironmentSamplingSpec,
    SyntheticEpisodeRecord,
    SyntheticExperienceFactory,
)
from teaching.inference import DeterministicMockTeacher, TeacherInferenceEngine  # noqa: E402
from teaching.registry import TeacherModelDescriptor, TeacherModelRegistry, TeacherProvider  # noqa: E402
from teaching.validator import (  # noqa: E402
    PIH_TASK_LIMITS,
    PRELIFT_TASK_LIMITS,
    PhysicsValidationEngine,
    TaskPhysicsLimits,
    ValidationVerdict,
)


def _blank_record(**overrides) -> SyntheticEpisodeRecord:
    length = 4
    record = SyntheticEpisodeRecord(
        episode_id="ep",
        seed=7,
        task="compliant_prelift",
        states=np.zeros((length, 23), dtype=np.float32),
        actions=np.zeros((length, 5), dtype=np.float32),
        next_states=np.ones((length, 23), dtype=np.float32),
        wrenches=np.zeros((length, 6), dtype=np.float32),
        next_wrenches=np.full((length, 6), 0.25, dtype=np.float32),
        modes=np.arange(length, dtype=np.int64),
        rewards=np.linspace(0.0, 1.0, length).astype(np.float32),
        env_metadata={"initial_mu_true": 0.6, "initial_mass_kg": 0.35, "clearance_mm": 0.5},
        teacher_suggestions={"teacher_id": "t", "teacher_confidence": 0.9, "candidate_actions": np.zeros((length, 5))},
    )
    for key, value in overrides.items():
        setattr(record, key, value)
    return record


def test_stage3_counts_match_approved_specification() -> None:
    assert sum(STAGE3_DATASET_COUNTS["compliant_prelift"].values()) == 500
    assert sum(STAGE3_DATASET_COUNTS["peg_in_hole"].values()) == 500
    assert STAGE3_DATASET_COUNTS["compliant_prelift"] == {
        "nominal": 250, "probe": 150, "nonstationary": 100,
    }
    assert STAGE3_DATASET_COUNTS["peg_in_hole"] == {
        "nominal": 250, "impact": 150, "wedging": 100,
    }
    assert sum(STAGE3_PILOT_COUNTS["compliant_prelift"].values()) == 20
    assert sum(STAGE3_PILOT_COUNTS["peg_in_hole"].values()) == 20


def test_stratified_sampling_is_deterministic_and_covers_strata() -> None:
    factory = SyntheticExperienceFactory(inference_engine=None)  # type: ignore[arg-type]
    first = factory.iter_stratum_slots("compliant_prelift")
    second = factory.iter_stratum_slots("compliant_prelift")
    assert len(first) == 500
    assert [row["stratum"] for row in first].count("nominal") == 250
    assert [row["stratum"] for row in first].count("probe") == 150
    assert [row["stratum"] for row in first].count("nonstationary") == 100
    assert first[0]["seed"] == second[0]["seed"]
    assert first[0]["friction_mu"] == second[0]["friction_mu"]
    assert first[0]["seed"] == factory.scenario_seed("compliant_prelift", "nominal", 0)

    nonstationary = [row for row in first if row["stratum"] == "nonstationary"]
    assert nonstationary[0]["regime"] == "A"
    assert nonstationary[1]["regime"] == "B"
    assert nonstationary[0]["friction_mu"] == 0.60

    peg = factory.iter_stratum_slots("peg_in_hole", STAGE3_PILOT_COUNTS["peg_in_hole"])
    assert len(peg) == 20
    impacts = [row for row in peg if row["stratum"] == "impact"]
    wedges = [row for row in peg if row["stratum"] == "wedging"]
    assert len(impacts) == 6 and all(row["radial_offset_mm"] >= 0.50 for row in impacts)
    assert len(wedges) == 4 and all(0.10 <= row["clearance_mm"] <= 0.40 for row in wedges)
    assert all(row["tilt_deg"] > 0.5 for row in wedges)
    again = factory.sample_stratified_scenario("peg_in_hole", "impact", 3)
    assert again == impacts[3]


def test_record_hash_covers_every_field_except_itself() -> None:
    original = _blank_record()
    original.provenance_hash = original.compute_record_hash()
    assert len(original.provenance_hash) == 64
    assert original.compute_record_hash() == original.provenance_hash

    changed_wrench = _blank_record()
    changed_wrench.next_wrenches = changed_wrench.next_wrenches + 1.0
    changed_reward = _blank_record()
    changed_reward.rewards = changed_reward.rewards + 1.0
    changed_teacher = _blank_record()
    changed_teacher.teacher_suggestions = dict(changed_teacher.teacher_suggestions)
    changed_teacher.teacher_suggestions["teacher_confidence"] = 0.1
    labeled = _blank_record()
    labeled.provenance_hash = "this-label-is-not-part-of-the-preimage"

    assert changed_wrench.compute_record_hash() != original.provenance_hash
    assert changed_reward.compute_record_hash() != original.provenance_hash
    assert changed_teacher.compute_record_hash() != original.provenance_hash
    assert labeled.compute_record_hash() == original.provenance_hash


def test_task_limits_keep_prelift_grip_cap_and_pih_safety_evaluator_cap() -> None:
    assert PRELIFT_TASK_LIMITS.total_normal_force_n == 20.0
    assert PRELIFT_TASK_LIMITS.per_finger_normal_force_n == 20.0
    assert PRELIFT_TASK_LIMITS.shear_force_n == 15.0
    assert PIH_TASK_LIMITS.resultant_force_n == 35.0
    assert PIH_TASK_LIMITS.max_torque_nm == 7.0

    engine = PhysicsValidationEngine.for_tasks()
    states = np.zeros((2, 23), dtype=np.float32)
    states[:, 12:16] = 6.0
    actions = np.zeros((2, 5), dtype=np.float32)
    wrenches = np.zeros((2, 6), dtype=np.float32)
    total = engine.validate_trajectory("compliant_prelift", states, actions, wrenches, {"initial_mu_true": 0.6})
    assert total.verdict == ValidationVerdict.REJECTED_FORCE_LIMIT
    assert "Total fingertip normal" in total.violation_details

    loose = TaskPhysicsLimits(
        profile_name="test_per_finger_only",
        total_normal_force_n=80.0,
        per_finger_normal_force_n=20.0,
        shear_force_n=15.0,
        resultant_force_n=20.0,
        max_torque_nm=2.0,
        max_linear_velocity_mps=0.10,
        max_penetration_mm=0.50,
        normal_force_semantics="per_finger",
    )
    finger_engine = PhysicsValidationEngine(task_limits={"compliant_prelift": loose})
    mild = states.copy()
    mild[:, 12:16] = 6.0
    accepted = finger_engine.validate_trajectory(
        "compliant_prelift", mild, actions, wrenches, {"initial_mu_true": 0.9}
    )
    assert accepted.is_valid is True
    one_finger = np.zeros_like(states)
    one_finger[:, 12] = 21.0
    rejected = finger_engine.validate_trajectory(
        "compliant_prelift", one_finger, actions, wrenches, {"initial_mu_true": 0.9}
    )
    assert rejected.verdict == ValidationVerdict.REJECTED_FORCE_LIMIT
    assert "Per-finger" in rejected.violation_details

    shear_states = np.zeros_like(states)
    shear_states[:, 12:16] = 2.5
    shear_wrench = np.zeros_like(wrenches)
    shear_wrench[:, 2] = 16.0
    shear = engine.validate_trajectory(
        "compliant_prelift", shear_states, actions, shear_wrench, {"initial_mu_true": 2.0}
    )
    assert shear.verdict == ValidationVerdict.REJECTED_FORCE_LIMIT
    assert "shear cap was not raised" in shear.violation_details

    pih_state = np.zeros((2, 15), dtype=np.float32)
    pih_action = np.zeros((2, 6), dtype=np.float32)
    under = np.zeros((2, 6), dtype=np.float32)
    under[:, 2] = 30.0
    over = np.zeros((2, 6), dtype=np.float32)
    over[:, 2] = 36.0
    assert engine.validate_trajectory("peg_in_hole", pih_state, pih_action, under).is_valid is True
    pih_over = engine.validate_trajectory("peg_in_hole", pih_state, pih_action, over)
    assert pih_over.verdict == ValidationVerdict.REJECTED_FORCE_LIMIT
    assert "35.00 N" in pih_over.violation_details
    assert "40 N" in pih_over.violation_details


def test_observation_files_exclude_privileged_ground_truth() -> None:
    record = _blank_record()
    record.provenance_hash = record.compute_record_hash()
    assert record.leaked_privileged_keys() == []
    with tempfile.TemporaryDirectory() as directory:
        factory = SyntheticExperienceFactory(inference_engine=None, output_dir=directory)  # type: ignore[arg-type]
        obs_path, privileged_path = factory.write_separated_artifacts(record)
        with np.load(obs_path, allow_pickle=False) as archive:
            keys = set(archive.files)
        assert "modes" not in keys
        assert "env_metadata_json" not in keys
        assert "mu_true" not in keys
        privileged = json.loads(privileged_path.read_text(encoding="utf-8"))
        assert privileged["env_metadata"]["initial_mu_true"] == pytest.approx(0.6)
        assert privileged["modes"] == [0, 1, 2, 3]


def test_frozen_historical_artifacts_are_unchanged() -> None:
    from integrated.phase37_3_evaluator import EXPECTED_SHA256_REGISTRY, _sha256_of_file

    checked = 0
    for group in EXPECTED_SHA256_REGISTRY.values():
        for relative, expected in group.items():
            full = os.path.join(R002_ROOT, relative)
            assert os.path.isfile(full), relative
            assert _sha256_of_file(full) == expected, relative
            checked += 1
    assert checked == 21


def test_stratified_episode_round_trip_is_reproducible() -> None:
    registry = TeacherModelRegistry()
    descriptor = TeacherModelDescriptor(
        model_id="stage3_preflight_teacher",
        display_name="Stage 3 preflight",
        version="1.0.0",
        provider=TeacherProvider.MOCK_DETERMINISTIC,
        supported_modalities=["state_vector"],
        capabilities=["trajectory_proposal"],
        license="internal_horos_research",
        has_representations=False,
        deterministic_seed_supported=True,
    )
    registry.register(descriptor)
    engine = TeacherInferenceEngine(registry)
    engine.register_adapter(descriptor.model_id, DeterministicMockTeacher(descriptor))
    factory = SyntheticExperienceFactory(
        engine,
        sampling_spec=EnvironmentSamplingSpec(default_episode_length=8, dt_s=0.01, enable_regime_shifts=False),
    )
    first = factory.generate_stratified_episode("compliant_prelift", descriptor.model_id, "nominal", 0, episode_length=8)
    second = factory.generate_stratified_episode("compliant_prelift", descriptor.model_id, "nominal", 0, episode_length=8)
    assert first.provenance_hash == second.provenance_hash
    assert np.array_equal(first.states, second.states)
    assert first.env_metadata["stratum"] == "nominal"
    assert "initial_mu_true" not in first.observation_package()
    validator = PhysicsValidationEngine.for_tasks()
    accepted, rejected, reports = validator.partition_episodes("compliant_prelift", [first])
    assert len(reports) == 1
    assert reports[0].verdict in {ValidationVerdict.PHYSICALLY_VALID, ValidationVerdict.REJECTED_FORCE_LIMIT, ValidationVerdict.REJECTED_FRICTION_CONE}
    assert (len(accepted) + len(rejected)) == 1
