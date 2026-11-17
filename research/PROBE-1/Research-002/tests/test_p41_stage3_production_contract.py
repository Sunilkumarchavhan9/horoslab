"""HOROS PROBE-1 — Research-002: Regression Suite for Stage 3.3A.1 Production Contract Reconciliation.

Verifies:
1. Production seed formula (base 3,300,000) matches 1,000/1,000 entries in stage3_3_seed_registry.json.
2. Distinctness from frozen Stage 3.0 factory seed formula (base 3,100,000).
3. Reserve seed pool specification (base 3,390,000, 300 seeds) with zero collision against pilot or primary seeds.
4. Dual episode identity resolution (canonical ID syn_... and slot alias prod_...).
5. Peg-in-Hole impact acceptance hardening (authentic rim contact + measurable force >= 1.0 N).
6. Wedging alignment and strict ContactMode JAMMING (mode 5) prohibition.
7. Prelift physical interaction criteria (liftoff in nominal, sliding in probe, causal slip in nonstationary).
8. Model-visible observation allowlist and SecurityViolationError on privileged data leakage.
9. Bitwise deterministic reproducibility of production episodes.
10. Fail-closed non-silent rejection policy.
"""

from __future__ import annotations

import json
import math
import os
import sys
from pathlib import Path
from typing import Any, Dict, List

import numpy as np
import pytest

TESTS_DIR = Path(__file__).resolve().parent
R002_ROOT = TESTS_DIR.parent
STAGE3_3_DIR = R002_ROOT / "experiments" / "stage3_production_readiness"
PILOT_DIR = R002_ROOT / "experiments" / "stage3_preflight" / "pilot"

for path in (R002_ROOT, R002_ROOT / "src"):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

from contact_modes.contact_mode_definitions import ContactMode  # noqa: E402
from scripts.stage3_production_adapter import (  # noqa: E402
    MODEL_VISIBLE_ALLOWLIST,
    PRIVILEGED_FIELD_BLOCKLIST,
    RESERVE_SEEDS_PER_STRATUM,
    STAGE3_PRODUCTION_SEED_BASE,
    STAGE3_RESERVE_SEED_BASE,
    SecurityViolationError,
    Stage3ProductionExperienceFactory,
    create_deterministic_mock_engine,
    generate_reserve_seed_registry,
    sanitize_for_model_ingestion,
    validate_model_visible_package,
    verify_deterministic_reproducibility,
    verify_production_physical_interaction,
)
from teaching.factory import (  # noqa: E402
    STAGE3_DATASET_COUNTS,
    SyntheticEpisodeRecord,
    SyntheticExperienceFactory,
)
from teaching.inference import DeterministicMockTeacher, TeacherInferenceEngine  # noqa: E402
from teaching.registry import TeacherModelDescriptor, TeacherModelRegistry, TeacherProvider  # noqa: E402


# ---------------------------------------------------------------------------
# Test Cases
# ---------------------------------------------------------------------------

def test_production_seed_formula_reconciliation() -> None:
    """Verifies Stage3ProductionExperienceFactory seeds match stage3_3_seed_registry.json 1,000/1,000."""
    registry_path = STAGE3_3_DIR / "stage3_3_seed_registry.json"
    with open(registry_path, "r", encoding="utf-8") as f:
        registry = json.load(f)

    episodes = registry["episodes"]
    assert len(episodes) == 1000

    matches = 0
    frozen_diffs = 0

    for ep in episodes:
        task = ep["task"]
        stratum = ep["stratum"]
        idx = ep["index_in_stratum"]
        expected_seed = ep["seed"]

        # Production adapter seed
        prod_seed = Stage3ProductionExperienceFactory.scenario_seed(task, stratum, idx)
        assert prod_seed == expected_seed, f"Mismatch at {task}/{stratum}/{idx}: {prod_seed} vs {expected_seed}"
        matches += 1

        # Frozen factory seed (must differ by exactly 200,000)
        frozen_seed = SyntheticExperienceFactory.scenario_seed(task, stratum, idx)
        assert frozen_seed == expected_seed - 200_000
        frozen_diffs += 1

    assert matches == 1000
    assert frozen_diffs == 1000


def test_reserve_seed_pool_specification() -> None:
    """Verifies reserve seed pool structure, counts, and zero collision."""
    registry_path = STAGE3_3_DIR / "stage3_3_seed_registry.json"
    with open(registry_path, "r", encoding="utf-8") as f:
        registry = json.load(f)

    assert "reserve_seed_pool" in registry
    pool = registry["reserve_seed_pool"]

    assert pool["reserve_base_seed"] == 3_390_000
    assert pool["reserve_seeds_per_stratum"] == 50
    assert pool["total_reserve_seeds"] == 300

    reserve_seeds = [e["seed"] for e in pool["reserve_seeds"]]
    assert len(reserve_seeds) == 300
    assert len(set(reserve_seeds)) == 300  # all unique

    prod_seeds = {e["seed"] for e in registry["episodes"]}
    assert len(prod_seeds) == 1000

    pilot_seeds = set()
    acc_path = PILOT_DIR / "accepted_manifest.json"
    with open(acc_path, "r", encoding="utf-8") as f:
        pilot_manifest = json.load(f)
    for entry in pilot_manifest:
        pilot_seeds.add(int(entry["seed"]))

    # Zero overlap across all three sets
    assert len(prod_seeds.intersection(reserve_seeds)) == 0, "Production and reserve collision!"
    assert len(pilot_seeds.intersection(reserve_seeds)) == 0, "Pilot and reserve collision!"
    assert len(pilot_seeds.intersection(prod_seeds)) == 0, "Pilot and production collision!"


def test_dual_episode_identity_resolution() -> None:
    """Verifies episode record contains both canonical ID and slot alias."""
    engine, _, _ = create_deterministic_mock_engine("mock_teacher_deterministic_v1")
    factory = Stage3ProductionExperienceFactory(engine)

    scenario = factory.sample_stratified_scenario("compliant_prelift", "nominal", 0)
    assert scenario["seed"] == 3311000
    assert scenario["slot_alias"] == "prod_compliant_prelift_nominal_000"

    # Generate episode
    record = factory.generate_episode(
        task="compliant_prelift",
        teacher_id="mock_teacher_deterministic_v1",
        seed=scenario["seed"],
        episode_length=5,
        parameter_overrides=scenario,
        slot_alias=scenario["slot_alias"],
    )

    # Primary ID should be slot_alias
    assert record.episode_id == "prod_compliant_prelift_nominal_000"
    # Metadata contains both
    assert record.env_metadata["slot_alias"] == "prod_compliant_prelift_nominal_000"
    assert record.env_metadata["canonical_episode_id"] == "syn_compliant_prelift_mock_teacher_deterministic_v1_seed3311000"
    assert len(record.provenance_hash) == 64


def test_impact_acceptance_contract_reconciliation() -> None:
    """Tests authentic rim impact acceptance vs false-success rejection."""
    class MockPegEpisode:
        def __init__(self, strata: List[int], modes: List[int], force_mag: float):
            H = len(strata)
            self.states = np.zeros((H, 12), dtype=np.float32)
            self.next_states = np.zeros((H, 12), dtype=np.float32)
            self.next_states[:, 2] = -1.0  # insertion attained
            self.wrenches = np.zeros((H, 6), dtype=np.float32)
            self.next_wrenches = np.zeros((H, 6), dtype=np.float32)
            self.next_wrenches[:, 0] = force_mag  # force norm
            self.modes = np.array(modes, dtype=np.int64)
            self.env_metadata = {
                "stratum": "impact",
                "step_contact_stratum": strata,
                "step_insertion_depth_mm": [1.0] * H,
            }

    # Case 1: Authentic rim impact via stratum 1 with measurable force (2.5 N) -> PASS
    ep1 = MockPegEpisode([0, 1, 0, 0], [0, 1, 0, 0], force_mag=2.5)
    pass1, _ = verify_production_physical_interaction("peg_in_hole", ep1)
    assert pass1 is True

    # Case 2: Authentic rim impact via mode 4 with measurable force (1.5 N) -> PASS
    ep2 = MockPegEpisode([0, 0, 0, 0], [0, 4, 0, 0], force_mag=1.5)
    pass2, _ = verify_production_physical_interaction("peg_in_hole", ep2)
    assert pass2 is True

    # Case 3: False-success edge case in pilot: force = 1.5 N, but NEITHER stratum 1 nor mode 4 -> REJECT!
    ep3 = MockPegEpisode([0, 2, 2, 0], [0, 2, 2, 0], force_mag=1.5)
    pass3, _ = verify_production_physical_interaction("peg_in_hole", ep3)
    assert pass3 is False, "Non-rim contact with force MUST be rejected in impact stratum!"

    # Case 4: Stratum 1 attained, but contact force = 0.0 N -> REJECT!
    ep4 = MockPegEpisode([0, 1, 0, 0], [0, 1, 0, 0], force_mag=0.0)
    pass4, _ = verify_production_physical_interaction("peg_in_hole", ep4)
    assert pass4 is False, "Infinitesimal contact force MUST be rejected!"

    # Case 5: Force limit exceeded (40.0 N > 35.0 N) -> REJECT!
    ep5 = MockPegEpisode([0, 1, 0, 0], [0, 1, 0, 0], force_mag=40.0)
    pass5, _ = verify_production_physical_interaction("peg_in_hole", ep5)
    assert pass5 is False, "Excessive impact force MUST be rejected!"


def test_wedging_alignment_and_jamming_prohibition() -> None:
    """Verifies wedging alignment requirement and strict prohibition of classifier mode 5 (JAMMING)."""
    class MockWedgingEpisode:
        def __init__(self, strata: List[int], depths: List[float], modes: List[int]):
            H = len(strata)
            self.states = np.zeros((H, 12), dtype=np.float32)
            self.next_states = np.zeros((H, 12), dtype=np.float32)
            self.next_states[:, 2] = [-d for d in depths]
            self.wrenches = np.zeros((H, 6), dtype=np.float32)
            self.next_wrenches = np.zeros((H, 6), dtype=np.float32)
            self.next_wrenches[:, 0] = 3.0  # Fx
            self.next_wrenches[:, 3] = 0.2  # Tx
            self.modes = np.array(modes, dtype=np.int64)
            self.env_metadata = {
                "stratum": "wedging",
                "step_contact_stratum": strata,
                "step_insertion_depth_mm": depths,
            }

    # Case 1: Aligned wedging without jamming mode -> PASS
    strata_good = [0] * 5 + [3] * 5
    depths_good = [1.0, 2.0, 3.0, 4.0, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5]
    modes_good = [0, 1, 2, 2, 2, 2, 2, 2, 2, 2]
    ep_good = MockWedgingEpisode(strata_good, depths_good, modes_good)
    pass_good, m_good = verify_production_physical_interaction("peg_in_hole", ep_good)
    assert pass_good is True
    assert len(m_good["wedging_aligned_steps"]) > 0

    # Case 2: Aligned wedging BUT classifier mode 5 (JAMMING) emitted -> REJECT!
    modes_jam = [0, 1, 2, 2, 2, 5, 2, 2, 2, 2]  # mode 5 at step 5
    ep_jam = MockWedgingEpisode(strata_good, depths_good, modes_jam)
    pass_jam, _ = verify_production_physical_interaction("peg_in_hole", ep_jam)
    assert pass_jam is False, "Wedging episode emitting ContactMode.JAMMING MUST be rejected!"

    # Case 3: Stratum 3 occurs at shallow depth (< 5.0 mm) -> REJECT!
    depths_shallow = [0.1 * t for t in range(10)]
    ep_shallow = MockWedgingEpisode(strata_good, depths_shallow, modes_good)
    pass_shallow, _ = verify_production_physical_interaction("peg_in_hole", ep_shallow)
    assert pass_shallow is False, "Wedging stratum at shallow depth MUST be rejected!"


def test_prelift_physical_acceptance_logic() -> None:
    """Verifies Prelift nominal liftoff, probe sliding, and nonstationary causal slip."""
    class MockPreliftEpisode:
        def __init__(self, stratum: str, z_pos: float, slip_seq: np.ndarray, regime: str = "nominal"):
            H = len(slip_seq)
            self.states = np.zeros((H, 23), dtype=np.float32)
            self.next_states = np.zeros((H, 23), dtype=np.float32)
            self.next_states[:, 2] = z_pos
            self.next_states[:, 12:16] = 2.5  # normal force
            self.next_states[:, 16] = slip_seq  # slip
            self.wrenches = np.zeros((H, 6), dtype=np.float32)
            self.next_wrenches = np.zeros((H, 6), dtype=np.float32)
            self.next_wrenches[:, 2] = 4.0  # shear
            self.modes = np.array([0, 1] + [2] * (H - 2), dtype=np.int64)
            self.env_metadata = {
                "stratum": stratum,
                "regime": regime,
                "step_mu_true": [0.60] * 14 + [0.24] * 6 if regime == "A" else [0.60] * H,
            }

    # Nominal: Liftoff > 0.001 mm and no slip -> PASS
    ep_nom_pass = MockPreliftEpisode("nominal", z_pos=0.05, slip_seq=np.zeros(20))
    pass_nom, _ = verify_production_physical_interaction("compliant_prelift", ep_nom_pass)
    assert pass_nom is True

    # Nominal: Zero liftoff -> REJECT
    ep_nom_fail = MockPreliftEpisode("nominal", z_pos=0.0, slip_seq=np.zeros(20))
    pass_nom_fail, _ = verify_production_physical_interaction("compliant_prelift", ep_nom_fail)
    assert pass_nom_fail is False

    # Probe: Controlled sliding without liftoff -> PASS
    slip_probe = np.full(20, 0.0010)
    ep_probe_pass = MockPreliftEpisode("probe", z_pos=0.0, slip_seq=slip_probe)
    pass_probe, _ = verify_production_physical_interaction("compliant_prelift", ep_probe_pass)
    assert pass_probe is True

    # Probe: Accidental liftoff -> REJECT
    ep_probe_fail = MockPreliftEpisode("probe", z_pos=0.02, slip_seq=slip_probe)
    pass_probe_fail, _ = verify_production_physical_interaction("compliant_prelift", ep_probe_fail)
    assert pass_probe_fail is False

    # Nonstationary Regime A: Causal post-transition slip -> PASS
    slip_causal = np.zeros(20)
    slip_causal[15:] = 0.0020
    ep_causal = MockPreliftEpisode("nonstationary", z_pos=0.01, slip_seq=slip_causal, regime="A")
    pass_causal, _ = verify_production_physical_interaction("compliant_prelift", ep_causal)
    assert pass_causal is True

    # Nonstationary Regime A: Pre-transition slip only -> REJECT
    slip_noncausal = np.zeros(20)
    slip_noncausal[:10] = 0.0020
    ep_noncausal = MockPreliftEpisode("nonstationary", z_pos=0.01, slip_seq=slip_noncausal, regime="A")
    pass_noncausal, _ = verify_production_physical_interaction("compliant_prelift", ep_noncausal)
    assert pass_noncausal is False


def test_model_visible_allowlist_security_guard() -> None:
    """Verifies that model-visible allowlist strictly blocks privileged simulator keys."""
    valid_package = {
        "states": np.zeros((10, 12)),
        "actions": np.zeros((10, 6)),
        "next_states": np.zeros((10, 12)),
        "wrenches": np.zeros((10, 6)),
        "next_wrenches": np.zeros((10, 6)),
        "rewards": np.zeros(10),
        "episode_id": "prod_peg_in_hole_nominal_000",
        "seed": 3321000,
        "task": "peg_in_hole",
        "provenance_hash": "a" * 64,
    }
    assert validate_model_visible_package(valid_package) is True

    # Test leakage of privileged keys
    for leak_key in [
        "mu_true",
        "initial_mu_true",
        "object_mass",
        "clearance_mm",
        "contact_mode",
        "step_contact_stratum",
        "step_insertion_depth_mm",
        "env_metadata",
        "teacher_suggestions",
        "unauthorized_custom_key",
    ]:
        bad_pkg = dict(valid_package)
        bad_pkg[leak_key] = 1.0
        with pytest.raises(SecurityViolationError):
            validate_model_visible_package(bad_pkg)


def test_deterministic_replay_provenance() -> None:
    """Verifies exact bitwise deterministic reproducibility of production scenarios."""
    engine, _, _ = create_deterministic_mock_engine("mock_teacher_deterministic_v1")
    factory = Stage3ProductionExperienceFactory(engine)

    # Prelift replay
    success_pre, hash1_pre, hash2_pre = verify_deterministic_reproducibility(
        factory, "compliant_prelift", "nominal", 0, "mock_teacher_deterministic_v1", episode_length=10
    )
    assert success_pre is True
    assert hash1_pre == hash2_pre
    assert len(hash1_pre) == 64

    # Peg-in-Hole replay
    success_pih, hash1_pih, hash2_pih = verify_deterministic_reproducibility(
        factory, "peg_in_hole", "nominal", 0, "mock_teacher_deterministic_v1", episode_length=10
    )
    assert success_pih is True
    assert hash1_pih == hash2_pih
    assert len(hash1_pih) == 64
