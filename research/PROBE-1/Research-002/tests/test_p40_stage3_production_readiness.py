"""HOROS PROBE-1 — Research-002: Regression Suite for Stage 3.3 Production Readiness.

Verifies:
1. Deliverable documents and specifications exist in experiments/stage3_production_readiness/.
2. Master seed registry defines exactly 1,000 production episodes across approved strata.
3. Zero seed collision between the 40 pilot seeds and 1,000 production seeds.
4. Mathematical validity of production parameter distributions for Prelift and Peg-in-Hole.
5. Seven-class ContactMode ontology consistency and decoupling from simulator strata.
6. Causal post-transition slip requirement for Regime A (pre-transition slip fails).
7. Exact timestep state/telemetry alignment requirement for Peg-in-Hole wedging.
8. Zero-leakage guarantee on observation packages.
9. Zero student model training invariants.
10. Preservation of certified Stage 3.2.2 pilot artifacts.
"""

from __future__ import annotations

import json
import math
import os
import sys
from pathlib import Path
from typing import Any, Dict

import numpy as np
import pytest

TESTS_DIR = Path(__file__).resolve().parent
R002_ROOT = TESTS_DIR.parent
STAGE3_3_DIR = R002_ROOT / "experiments" / "stage3_production_readiness"
PILOT_DIR = R002_ROOT / "experiments" / "stage3_preflight" / "pilot"

if str(R002_ROOT) not in sys.path:
    sys.path.insert(0, str(R002_ROOT))
if str(R002_ROOT / "src") not in sys.path:
    sys.path.insert(0, str(R002_ROOT / "src"))

from contact_modes.contact_mode_definitions import ContactMode  # noqa: E402
from teaching.factory import STAGE3_DATASET_COUNTS, STAGE3_PILOT_COUNTS  # noqa: E402


def test_stage3_3_deliverables_exist() -> None:
    expected_files = [
        "stage3_3_production_generation_protocol.md",
        "stage3_3_seed_registry.json",
        "stage3_3_dataset_schema.md",
        "stage3_3_acceptance_specification.md",
        "stage3_3_reproducibility_specification.md",
        "stage3_3_storage_and_security_specification.md",
        "stage3_3_readiness_test_report.md",
        "stage3_3_authorization_checklist.md",
    ]
    for filename in expected_files:
        path = STAGE3_3_DIR / filename
        assert path.is_file(), f"Missing required deliverable: {path}"


def test_seed_registry_counts_and_zero_pilot_collision() -> None:
    registry_path = STAGE3_3_DIR / "stage3_3_seed_registry.json"
    assert registry_path.is_file()

    with open(registry_path, "r", encoding="utf-8") as f:
        registry = json.load(f)

    assert registry["total_episodes"] == 1000
    episodes = registry["episodes"]
    assert len(episodes) == 1000

    prelift_eps = [e for e in episodes if e["task"] == "compliant_prelift"]
    pih_eps = [e for e in episodes if e["task"] == "peg_in_hole"]
    assert len(prelift_eps) == 500
    assert len(pih_eps) == 500

    # Check stratum counts
    prelift_strata = {"nominal": 0, "probe": 0, "nonstationary": 0}
    for e in prelift_eps:
        prelift_strata[e["stratum"]] += 1
    assert prelift_strata == STAGE3_DATASET_COUNTS["compliant_prelift"]

    pih_strata = {"nominal": 0, "impact": 0, "wedging": 0}
    for e in pih_eps:
        pih_strata[e["stratum"]] += 1
    assert pih_strata == STAGE3_DATASET_COUNTS["peg_in_hole"]

    # Check unique seeds
    prod_seeds = [e["seed"] for e in episodes]
    assert len(set(prod_seeds)) == 1000

    # Check pilot seed collision
    pilot_seeds = set()
    acc_path = PILOT_DIR / "accepted_manifest.json"
    assert acc_path.is_file()
    with open(acc_path, "r", encoding="utf-8") as f:
        pilot_manifest = json.load(f)
    for entry in pilot_manifest:
        pilot_seeds.add(int(entry["seed"]))
    assert len(pilot_seeds) == 40

    overlap = set(prod_seeds).intersection(pilot_seeds)
    assert len(overlap) == 0, f"Found pilot/production seed collision: {overlap}"


def test_prelift_production_parameter_distributions() -> None:
    registry_path = STAGE3_3_DIR / "stage3_3_seed_registry.json"
    with open(registry_path, "r", encoding="utf-8") as f:
        registry = json.load(f)

    prelift_eps = [e for e in registry["episodes"] if e["task"] == "compliant_prelift"]
    assert len(prelift_eps) == 500

    regime_a_count = 0
    regime_b_count = 0

    for ep in prelift_eps:
        p = ep["parameters"]
        stratum = ep["stratum"]
        if stratum == "nominal":
            assert 0.40 <= p["friction_mu"] <= 0.80
            assert 0.30 <= p["mass_kg"] <= 0.55
            assert p["regime"] == "nominal"
        elif stratum == "probe":
            assert 0.15 <= p["friction_mu"] <= 0.85
            assert 0.30 <= p["mass_kg"] <= 0.90
            assert p["regime"] == "nominal"
        elif stratum == "nonstationary":
            assert p["friction_mu"] == 0.60
            assert p["mass_kg"] == 0.350
            if p["regime"] == "A":
                regime_a_count += 1
            elif p["regime"] == "B":
                regime_b_count += 1

    assert regime_a_count == 50
    assert regime_b_count == 50


def test_pih_production_parameter_distributions() -> None:
    registry_path = STAGE3_3_DIR / "stage3_3_seed_registry.json"
    with open(registry_path, "r", encoding="utf-8") as f:
        registry = json.load(f)

    pih_eps = [e for e in registry["episodes"] if e["task"] == "peg_in_hole"]
    assert len(pih_eps) == 500
    pegged_length_mm = 80.0

    for ep in pih_eps:
        p = ep["parameters"]
        stratum = ep["stratum"]
        if stratum == "nominal":
            assert 0.40 <= p["clearance_mm"] <= 1.50
            assert 0.30 <= p["friction_mu"] <= 0.70
            assert 0.0 <= p["radial_offset_mm"] <= 0.30
            assert 0.0 <= p["tilt_deg"] <= 0.20
        elif stratum == "impact":
            assert 0.50 <= p["clearance_mm"] <= 2.00
            assert 0.30 <= p["friction_mu"] <= 0.70
            assert 0.50 <= p["radial_offset_mm"] <= 2.00
            assert 0.0 <= p["tilt_deg"] <= 0.50
        elif stratum == "wedging":
            assert 0.10 <= p["clearance_mm"] <= 0.40
            assert 0.20 <= p["friction_mu"] <= 0.60
            c = p["clearance_mm"]
            theta_c = math.degrees(math.atan2(2.0 * c, pegged_length_mm))
            assert p["tilt_deg"] >= theta_c + 0.499


def test_contact_mode_ontology_seven_classes() -> None:
    expected_members = {
        "FREE": 0,
        "FIRST_CONTACT": 1,
        "STICKING": 2,
        "SLIDING": 3,
        "IMPACT": 4,
        "JAMMING": 5,
        "RELEASE": 6,
    }
    assert len(ContactMode) == 7
    for name, value in expected_members.items():
        assert hasattr(ContactMode, name)
        assert getattr(ContactMode, name).value == value

    # Check simulator stratum decoupling
    # Classifier mode 3 is SLIDING, simulator stratum 3 is WEDGING
    assert ContactMode.SLIDING.value == 3
    assert ContactMode.JAMMING.value == 5


def test_causal_regime_a_slip_acceptance_logic() -> None:
    from scripts.run_stage3_pilot import verify_physical_interaction

    class MockPreliftEpisode:
        def __init__(self, slip_sequence: np.ndarray, regime: str = "A"):
            H = len(slip_sequence)
            self.states = np.zeros((H, 23), dtype=np.float32)
            self.next_states = np.zeros((H, 23), dtype=np.float32)
            # Normal force: ~2.8 N per finger
            self.next_states[:, 12:16] = 2.8
            # Slip velocity on finger 0
            self.next_states[:, 16] = slip_sequence
            self.wrenches = np.zeros((H, 6), dtype=np.float32)
            self.next_wrenches = np.zeros((H, 6), dtype=np.float32)
            self.next_wrenches[:, 2] = 4.0  # Fz shear
            self.modes = np.array([0, 4] + [2] * (H - 2), dtype=np.int64)
            self.env_metadata = {
                "stratum": "nonstationary",
                "regime": regime,
                "step_mu_true": [0.60] * 14 + [0.24] * 6,
            }

    # Case 1: Slip is strictly PRE-TRANSITION (steps 0..13 have slip, steps 14..19 have zero slip)
    slip_pre = np.zeros(20, dtype=np.float32)
    slip_pre[5:10] = 0.0050  # Slip before transition
    ep_pre = MockPreliftEpisode(slip_pre)
    passed_pre, metrics_pre = verify_physical_interaction("compliant_prelift", ep_pre)
    assert passed_pre is False, "Pre-transition slip MUST be rejected for Regime A!"

    # Case 2: Slip is strictly POST-TRANSITION (steps 14..19 have slip)
    slip_post = np.zeros(20, dtype=np.float32)
    slip_post[15:19] = 0.0050  # Slip after transition at step 15
    ep_post = MockPreliftEpisode(slip_post)
    passed_post, metrics_post = verify_physical_interaction("compliant_prelift", ep_post)
    assert passed_post is True, "Post-transition slip MUST be accepted for Regime A!"


def test_wedging_alignment_acceptance_logic() -> None:
    from scripts.run_stage3_pilot import verify_physical_interaction

    class MockPegEpisode:
        def __init__(self, strata: list[int], depths: list[float], state_z: list[float]):
            H = len(strata)
            self.states = np.zeros((H, 12), dtype=np.float32)
            self.next_states = np.zeros((H, 12), dtype=np.float32)
            self.next_states[:, 2] = state_z
            self.wrenches = np.zeros((H, 6), dtype=np.float32)
            self.next_wrenches = np.zeros((H, 6), dtype=np.float32)
            self.next_wrenches[:, 0] = 3.0  # Fx
            self.next_wrenches[:, 3] = 0.2  # Tx
            self.modes = np.array([0, 1] + [2] * (H - 2), dtype=np.int64)
            self.env_metadata = {
                "stratum": "wedging",
                "step_contact_stratum": strata,
                "step_insertion_depth_mm": depths,
            }

    # Case 1: Misaligned wedging (stratum 3 at step 10, depth > 5 mm at step 25)
    strata_mis = [0] * 10 + [3] * 5 + [2] * 15
    depths_mis = [float(t * 0.2) for t in range(30)]  # reaches 5.0 mm at step 25
    state_z_mis = [-d for d in depths_mis]
    ep_mis = MockPegEpisode(strata_mis, depths_mis, state_z_mis)
    passed_mis, _ = verify_physical_interaction("peg_in_hole", ep_mis)
    assert passed_mis is False, "Misaligned wedging MUST be rejected!"

    # Case 2: Aligned wedging (stratum 3 and depth > 5.0 mm occur at same steps 25..29)
    strata_al = [0] * 10 + [2] * 15 + [3] * 5
    depths_al = [float(t * 0.22) for t in range(30)]  # step 25 depth = 5.5 mm
    state_z_al = [-d for d in depths_al]
    ep_al = MockPegEpisode(strata_al, depths_al, state_z_al)
    passed_al, metrics_al = verify_physical_interaction("peg_in_hole", ep_al)
    assert passed_al is True, "Aligned wedging MUST be accepted!"
    assert len(metrics_al["wedging_aligned_steps"]) > 0


def test_observation_package_zero_leakage_guarantee() -> None:
    forbidden_keys = {
        "modes", "mu_true", "initial_mu_true", "object_mass", "initial_mass_kg",
        "clearance_mm", "clearance", "contact_mode", "contactmode", "friction",
        "step_mu_true", "step_object_mass_kg", "step_contact_stratum",
        "step_insertion_depth_mm", "step_force_norm_n", "step_torque_norm_nm",
        "env_metadata", "env_metadata_json",
    }
    npz_files = list((PILOT_DIR / "accepted").glob("*.npz"))
    assert len(npz_files) == 40
    for npz_path in npz_files:
        with np.load(npz_path, allow_pickle=False) as data:
            keys = set(data.files)
            leaks = keys.intersection(forbidden_keys)
            assert len(leaks) == 0, f"Privileged keys leaked in {npz_path.name}: {leaks}"


def test_zero_training_governance_invariants() -> None:
    report_path = PILOT_DIR / "stage3_pilot_report.json"
    with open(report_path, "r", encoding="utf-8") as f:
        rep = json.load(f)

    assert rep.get("training_performed") is False
    assert rep.get("parameters_trained") == 0
    assert rep.get("training_permitted", 0) == 0


def test_frozen_pilot_artifacts_intact() -> None:
    acc_manifest = PILOT_DIR / "accepted_manifest.json"
    rej_manifest = PILOT_DIR / "rejected_manifest.json"
    assert acc_manifest.is_file()
    assert rej_manifest.is_file()

    with open(acc_manifest, "r", encoding="utf-8") as f:
        acc = json.load(f)
    assert len(acc) == 40

    with open(rej_manifest, "r", encoding="utf-8") as f:
        rej = json.load(f)
    assert len(rej) == 0
