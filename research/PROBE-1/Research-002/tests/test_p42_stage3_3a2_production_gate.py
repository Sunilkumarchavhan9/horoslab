"""HOROS PROBE-1 — Research-002: Stage 3.3A.2 production-gate regressions.

Covers the four contract corrections from the independent 3.3A.1 review:
model-input leakage, event-aligned rim impact, ContactMode.JAMMING during
simulator WEDGING, and the reserve-seed formula.
"""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import pytest

TESTS_DIR = Path(__file__).resolve().parent
R002_ROOT = TESTS_DIR.parent
STAGE3_3_DIR = R002_ROOT / "experiments" / "stage3_production_readiness"

for path in (R002_ROOT, R002_ROOT / "src"):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

from scripts.stage3_production_adapter import (  # noqa: E402
    PEG_CONTROL_DT_S,
    PEG_FORCE_LIMIT_N,
    PEG_FORCE_RESOLUTION_N,
    PEG_TORQUE_LIMIT_NM,
    SecurityViolationError,
    Stage3ProductionExperienceFactory,
    assert_tensor_channels_clean,
    build_training_package_and_audit,
    create_deterministic_mock_engine,
    evaluate_aligned_rim_impact,
    jamming_label_is_physically_valid,
    opaque_sample_id,
    verify_deterministic_reproducibility,
    verify_production_physical_interaction,
    verify_provenance_against_serialized_audit,
    ProductionTrainingDataloader,
)
from teaching.factory import SyntheticEpisodeRecord  # noqa: E402


def _peg_episode(
    strata: List[int],
    modes: List[int],
    forces: List[float],
    *,
    stratum: str = "impact",
    torques: Optional[List[float]] = None,
    depths: Optional[List[float]] = None,
    lateral: Optional[List[float]] = None,
) -> Any:
    horizon = len(strata)
    torques = torques if torques is not None else [0.1] * horizon
    depths = depths if depths is not None else [1.0] * horizon
    lateral = lateral if lateral is not None else forces

    class Episode:
        pass

    episode = Episode()
    episode.states = np.zeros((horizon, 12), dtype=np.float32)
    episode.next_states = np.zeros((horizon, 12), dtype=np.float32)
    episode.next_states[:, 2] = np.array([-d for d in depths], dtype=np.float32)
    episode.wrenches = np.zeros((horizon, 6), dtype=np.float32)
    episode.next_wrenches = np.zeros((horizon, 6), dtype=np.float32)
    episode.next_wrenches[:, 0] = np.array(lateral, dtype=np.float32)
    episode.next_wrenches[:, 2] = 0.0
    # Resultant force is the lateral channel unless a larger axial component is set.
    for index, force in enumerate(forces):
        if abs(force) > abs(float(episode.next_wrenches[index, 0])):
            episode.next_wrenches[index, 0] = force
    episode.next_wrenches[:, 3] = np.array(torques, dtype=np.float32)
    episode.modes = np.array(modes, dtype=np.int64)
    episode.env_metadata = {
        "stratum": stratum,
        "dt_s": PEG_CONTROL_DT_S,
        "step_contact_stratum": list(strata),
        "step_insertion_depth_mm": list(depths),
    }
    return episode


def test_aligned_rising_rim_force_is_accepted() -> None:
    """Pilot seed 3124000 shape: force rises from 0 to 6.6173 N on stratum 1."""
    episode = _peg_episode(
        [0, 1, 2, 2],
        [0, 1, 3, 3],
        [0.0, 6.6173, 0.0, 0.0],
    )
    passed, metrics = verify_production_physical_interaction("peg_in_hole", episode)
    assert passed is True
    assert metrics["impact_dynamics_passed"] is True
    assert metrics["force_limit_passed"] is True
    assert metrics["torque_limit_passed"] is True
    assert metrics["rim_event_steps"] == [1]
    assert metrics["event_impulse_n_s"] == pytest.approx(6.6173 * PEG_CONTROL_DT_S, rel=1e-4)
    assert metrics["event_peak_rising_rate_n_s"] == pytest.approx(6.6173 / PEG_CONTROL_DT_S, rel=1e-4)


def test_stratum_label_without_force_rise_is_rejected() -> None:
    episode = _peg_episode([0, 1, 2, 2], [0, 1, 2, 2], [0.0, 0.0, 0.0, 0.0])
    passed, metrics = verify_production_physical_interaction("peg_in_hole", episode)
    assert passed is False
    assert metrics["impact_dynamics_passed"] is False


def test_preexisting_force_is_not_an_impact_transient() -> None:
    """A constant 2.5 N load already present before the rim step is not a rise."""
    episode = _peg_episode([0, 1, 2, 2], [0, 4, 2, 2], [2.5, 2.5, 2.5, 2.5])
    passed, metrics = verify_production_physical_interaction("peg_in_hole", episode)
    assert passed is False
    assert metrics["event_peak_rising_rate_n_s"] == pytest.approx(0.0)


def test_unrelated_force_outside_the_rim_event_is_rejected() -> None:
    episode = _peg_episode([0, 1, 2, 2], [0, 1, 2, 2], [0.0, 0.0, 0.0, 12.0])
    passed, metrics = verify_production_physical_interaction("peg_in_hole", episode)
    assert passed is False
    assert metrics["impact_dynamics_passed"] is False
    assert metrics["unrelated_peak_outside_event"] is True


def test_classifier_impact_mode_without_rim_stratum_is_rejected() -> None:
    episode = _peg_episode([0, 2, 2, 2], [0, 4, 2, 2], [0.0, 8.0, 0.0, 0.0])
    passed, metrics = verify_production_physical_interaction("peg_in_hole", episode)
    assert passed is False
    assert metrics["rim_event_steps"] == []


def test_force_and_torque_limits_are_independent() -> None:
    torque_breach = _peg_episode(
        [0, 1, 2],
        [0, 1, 2],
        [0.0, 6.0, 0.0],
        torques=[0.0, 8.0, 0.0],
    )
    passed_torque, metrics_torque = verify_production_physical_interaction("peg_in_hole", torque_breach)
    assert passed_torque is False
    assert metrics_torque["impact_dynamics_passed"] is True
    assert metrics_torque["torque_limit_passed"] is False
    assert metrics_torque["force_limit_passed"] is True

    force_breach = _peg_episode([0, 1, 2], [0, 1, 2], [0.0, 40.0, 0.0])
    passed_force, metrics_force = verify_production_physical_interaction("peg_in_hole", force_breach)
    assert passed_force is False
    assert metrics_force["force_limit_passed"] is False
    assert metrics_force["torque_limit_passed"] is True
    assert PEG_FORCE_LIMIT_N == 35.0
    assert PEG_TORQUE_LIMIT_NM == 7.0


def test_impulse_floor_is_the_telemetry_quantum_not_the_doc12_shock() -> None:
    """Doc-12's 2.0 N·s shock is unreachable under the 35 N cap at dt=0.01 s."""
    measurement = evaluate_aligned_rim_impact(
        np.array([[0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.12, 0.0, 0.0, 0.0, 0.0, 0.0]], dtype=np.float64),
        [0, 1],
        dt_s=PEG_CONTROL_DT_S,
    )
    assert measurement["passed"] is True
    assert measurement["event_impulse_n_s"] == pytest.approx(0.12 * PEG_CONTROL_DT_S)
    assert measurement["event_impulse_n_s"] < 2.0
    assert PEG_FORCE_RESOLUTION_N == 1e-4
    max_step_impulse = PEG_FORCE_LIMIT_N * PEG_CONTROL_DT_S
    assert max_step_impulse < 2.0


def test_valid_geometric_jamming_during_wedging_is_accepted() -> None:
    episode = _peg_episode(
        [0, 2, 3, 3],
        [0, 3, 5, 2],
        [0.0, 1.0, 16.5, 4.0],
        stratum="wedging",
        depths=[1.0, 3.0, 6.2, 6.4],
        lateral=[0.0, 1.0, 16.5, 4.0],
    )
    passed, metrics = verify_production_physical_interaction("peg_in_hole", episode)
    assert passed is True
    assert metrics["valid_jamming_steps"] == [2]
    assert metrics["invalid_jamming_steps"] == []
    assert jamming_label_is_physically_valid(
        mode=5, stratum=3, depth_mm=6.2, lateral_force_n=16.5, tilt_deg=2.4
    )


def test_jamming_label_during_sliding_is_rejected() -> None:
    episode = _peg_episode(
        [0, 2, 2, 2],
        [0, 3, 5, 3],
        [0.0, 1.0, 18.0, 1.0],
        stratum="wedging",
        depths=[1.0, 6.2, 6.4, 6.6],
        lateral=[0.0, 1.0, 18.0, 1.0],
    )
    passed, metrics = verify_production_physical_interaction("peg_in_hole", episode)
    assert passed is False
    assert metrics["invalid_jamming_steps"] == [2]
    assert jamming_label_is_physically_valid(
        mode=5, stratum=2, depth_mm=6.4, lateral_force_n=18.0
    ) is False


def test_jamming_label_without_mechanical_lock_force_is_rejected() -> None:
    episode = _peg_episode(
        [0, 3, 3],
        [0, 5, 2],
        [0.0, 3.0, 3.0],
        stratum="wedging",
        depths=[1.0, 6.0, 6.5],
        lateral=[0.0, 3.0, 3.0],
    )
    passed, metrics = verify_production_physical_interaction("peg_in_hole", episode)
    assert passed is False
    assert 1 in metrics["invalid_jamming_steps"]


def test_genuine_wedging_without_jamming_label_is_accepted() -> None:
    episode = _peg_episode(
        [0, 2, 3, 3],
        [0, 3, 2, 2],
        [0.0, 1.0, 4.0, 4.0],
        stratum="wedging",
        depths=[1.0, 4.0, 6.1, 6.8],
    )
    passed, metrics = verify_production_physical_interaction("peg_in_hole", episode)
    assert passed is True
    assert metrics["valid_jamming_steps"] == []
    assert 5 not in metrics["modes_observed"]


def test_sliding_contact_is_not_relabeled_as_jamming() -> None:
    assert jamming_label_is_physically_valid(
        mode=3, stratum=2, depth_mm=8.0, lateral_force_n=20.0, tilt_deg=3.0
    ) is False
    assert jamming_label_is_physically_valid(
        mode=5, stratum=3, depth_mm=6.0, lateral_force_n=16.0, tilt_deg=0.4
    ) is False


def test_model_package_rejects_reconstructable_identifiers() -> None:
    from scripts.stage3_production_adapter import validate_model_visible_package

    leaked = {
        "states": np.zeros((4, 15), dtype=np.float32),
        "actions": np.zeros((4, 6), dtype=np.float32),
        "next_states": np.zeros((4, 15), dtype=np.float32),
        "wrenches": np.zeros((4, 6), dtype=np.float32),
        "next_wrenches": np.zeros((4, 6), dtype=np.float32),
        "sample_id": "a" * 64,
        "task": "peg_in_hole",
        "seed": 3324000,
    }
    with pytest.raises(SecurityViolationError):
        validate_model_visible_package(leaked)

    named = dict(leaked)
    named.pop("seed")
    named["episode_id"] = "prod_peg_in_hole_impact_000"
    with pytest.raises(SecurityViolationError):
        validate_model_visible_package(named)


def test_training_package_uses_opaque_id_and_blocks_registry_join(tmp_path: Path) -> None:
    engine, _, _ = create_deterministic_mock_engine()
    factory = Stage3ProductionExperienceFactory(engine)
    scenario = factory.sample_stratified_scenario("peg_in_hole", "impact", 0)
    record = factory.generate_episode(
        task="peg_in_hole",
        teacher_id="mock_teacher_deterministic_v1",
        seed=scenario["seed"],
        episode_length=4,
        parameter_overrides=scenario,
        slot_alias=scenario["slot_alias"],
    )
    salt = b"stage33a2-audit-salt-not-in-registry"
    package, audit = build_training_package_and_audit(record, salt)

    assert "seed" not in package
    assert "episode_id" not in package
    assert "provenance_hash" not in package
    assert "rewards" not in package
    assert package["sample_id"] == opaque_sample_id(record.env_metadata["canonical_episode_id"], salt)
    assert str(record.seed) not in package["sample_id"]
    assert package["sample_id"] != record.episode_id

    registry = json.loads((STAGE3_3_DIR / "stage3_3_seed_registry.json").read_text(encoding="utf-8"))
    public_seeds = {int(entry["seed"]) for entry in registry["episodes"]}
    assert record.seed in public_seeds
    assert package["sample_id"] not in {str(seed) for seed in public_seeds}
    assert audit["seed"] == int(record.seed)
    assert audit["friction_mu"] == scenario["friction_mu"]
    assert "friction_mu" not in package

    archive = tmp_path / "training" / f"{package['sample_id']}.npz"
    archive.parent.mkdir()
    arrays = {key: value for key, value in package.items() if key not in {"sample_id", "task"}}
    np.savez_compressed(archive, sample_id=package["sample_id"], task=package["task"], **arrays)
    reloaded = np.load(archive, allow_pickle=False)
    assert "seed" not in reloaded.files
    assert str(reloaded["sample_id"]) == package["sample_id"]


def test_privileged_telemetry_copied_into_a_state_channel_is_rejected() -> None:
    states = np.zeros((5, 15), dtype=np.float64)
    states[:, 0] = [0.60, 0.60, 0.60, 0.24, 0.24]
    with pytest.raises(SecurityViolationError):
        assert_tensor_channels_clean(
            "peg_in_hole",
            states,
            np.zeros((5, 6)),
            {"step_mu_true": [0.60, 0.60, 0.60, 0.24, 0.24]},
        )


def test_dataloader_refuses_audit_manifest_and_reinserted_seed(tmp_path: Path) -> None:
    training = tmp_path / "training"
    training.mkdir()
    sample_id = "ab" * 32
    np.savez_compressed(
        training / f"{sample_id}.npz",
        sample_id=sample_id,
        task="peg_in_hole",
        states=np.zeros((3, 15), dtype=np.float32),
        actions=np.zeros((3, 6), dtype=np.float32),
        next_states=np.zeros((3, 15), dtype=np.float32),
        wrenches=np.zeros((3, 6), dtype=np.float32),
        next_wrenches=np.zeros((3, 6), dtype=np.float32),
    )
    loader = ProductionTrainingDataloader(training)
    batch = loader.batches(batch_size=1)[0]
    assert "seed" not in batch
    assert batch["sample_id"] == [sample_id]

    cached = loader.cache_batch(batch, tmp_path / "cache" / "batch0.npz")
    reloaded = np.load(cached, allow_pickle=False)
    assert "seed" not in reloaded.files

    def reinsert_seed(package: Dict[str, Any]) -> Dict[str, Any]:
        poisoned = dict(package)
        poisoned["seed"] = 3324000
        return poisoned

    with pytest.raises(SecurityViolationError):
        loader.apply_transform(batch, reinsert_seed)

    audit = training / "stage3_3_a2_audit_manifest.json"
    audit.write_text("{}", encoding="utf-8")
    with pytest.raises(SecurityViolationError):
        ProductionTrainingDataloader(training)


def test_every_reserve_seed_matches_the_formula_independently() -> None:
    registry = json.loads((STAGE3_3_DIR / "stage3_3_seed_registry.json").read_text(encoding="utf-8"))
    pool = registry["reserve_seed_pool"]["reserve_seeds"]
    assert len(pool) == 300
    task_codes = {"compliant_prelift": 1, "peg_in_hole": 2}
    stratum_codes = {"nominal": 1, "probe": 2, "nonstationary": 3, "impact": 4, "wedging": 5}
    expected_ranges = {
        ("compliant_prelift", "nominal"): (3_401_000, 3_401_049),
        ("compliant_prelift", "probe"): (3_402_000, 3_402_049),
        ("compliant_prelift", "nonstationary"): (3_403_000, 3_403_049),
        ("peg_in_hole", "nominal"): (3_411_000, 3_411_049),
        ("peg_in_hole", "impact"): (3_414_000, 3_414_049),
        ("peg_in_hole", "wedging"): (3_415_000, 3_415_049),
    }
    seen = set()
    primary = {int(entry["seed"]) for entry in registry["episodes"]}
    for entry in pool:
        calculated = (
            3_390_000
            + task_codes[entry["task"]] * 10_000
            + stratum_codes[entry["stratum"]] * 1_000
            + int(entry["reserve_index"])
        )
        assert int(entry["seed"]) == calculated
        assert entry["status"] == "UNALLOCATED_LOCKED"
        low, high = expected_ranges[(entry["task"], entry["stratum"])]
        assert low <= calculated <= high
        seen.add(calculated)
    assert len(seen) == 300
    assert seen.isdisjoint(primary)
    report = (STAGE3_3_DIR / "stage3_3_a1_completion_report.md").read_text(encoding="utf-8")
    assert "3_391_000" not in report
    assert "3_401_000" in report


def test_replay_and_serialized_provenance_cover_all_six_strata(tmp_path: Path) -> None:
    engine, _, _ = create_deterministic_mock_engine()
    factory = Stage3ProductionExperienceFactory(engine)
    cases = [
        ("compliant_prelift", "nominal"),
        ("compliant_prelift", "probe"),
        ("compliant_prelift", "nonstationary"),
        ("peg_in_hole", "nominal"),
        ("peg_in_hole", "impact"),
        ("peg_in_hole", "wedging"),
    ]
    for task, stratum in cases:
        success, first_hash, second_hash = verify_deterministic_reproducibility(
            factory,
            task,
            stratum,
            0,
            "mock_teacher_deterministic_v1",
            episode_length=6,
        )
        assert success is True
        assert first_hash == second_hash
        assert len(first_hash) == 64

        scenario = factory.sample_stratified_scenario(task, stratum, 0)
        record = factory.generate_episode(
            task=task,
            teacher_id="mock_teacher_deterministic_v1",
            seed=scenario["seed"],
            episode_length=6,
            parameter_overrides=scenario,
            slot_alias=scenario["slot_alias"],
        )
        audit_path = tmp_path / f"{task}_{stratum}.audit.json"
        verified, stored_hash, file_sha = verify_provenance_against_serialized_audit(record, audit_path)
        assert verified is True
        assert stored_hash == record.compute_record_hash()
        payload = json.loads(audit_path.read_text(encoding="utf-8"))
        assert payload["provenance_hash"] == record.provenance_hash
        digest = hashlib.sha256(audit_path.read_bytes()).hexdigest()
        assert digest == file_sha
        assert "seed" in payload
        assert payload["seed"] == int(record.seed)
