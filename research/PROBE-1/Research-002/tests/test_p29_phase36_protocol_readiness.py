"""Phase 3.6 Protocol Specification & Readiness Unit Tests (Design-Only)."""

import os
import sys

import pytest

R002_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
R002_SRC = os.path.join(R002_ROOT, "src")
if R002_ROOT not in sys.path:
    sys.path.insert(0, R002_ROOT)
if R002_SRC not in sys.path:
    sys.path.insert(0, R002_SRC)

from src.integrated.phase36_validation_protocol import (
    PHASE36_SEED_BLOCKS,
    PRIMARY_N_PER_CORNER_M4_B3,
    SAFETY_ARCHITECTURE_VERSION,
    build_phase36_validation_manifest,
    one_sided_clopper_pearson_ucb_zero,
    required_n_for_zero_failure_ucb,
    verify_phase36_seed_disjointness,
)


def test_binomial_sample_size_and_ucb_bounds():
    assert required_n_for_zero_failure_ucb(0.05, 0.95) == 59
    assert PRIMARY_N_PER_CORNER_M4_B3 == 60
    assert one_sided_clopper_pearson_ucb_zero(60, 0.95) == pytest.approx(0.048701, abs=1e-5)
    assert one_sided_clopper_pearson_ucb_zero(240, 0.95) == pytest.approx(0.012405, abs=1e-5)
    assert one_sided_clopper_pearson_ucb_zero(300, 0.95) == pytest.approx(0.009937, abs=1e-5)
    assert one_sided_clopper_pearson_ucb_zero(600, 0.95) == pytest.approx(0.004981, abs=1e-5)


def test_phase36_seeds_completely_disjoint_from_all_prior_phases():
    audit = verify_phase36_seed_disjointness()
    assert audit["disjoint_verified"] is True
    assert audit["pairwise_overlap_count"] == 0
    assert audit["phase3_6_total_unique_seeds"] == 740
    assert sum(len(v) for v in PHASE36_SEED_BLOCKS.values()) == 740


def test_phase36_manifest_determinism_and_frozen_safety_v1():
    m1 = build_phase36_validation_manifest(R002_ROOT)
    m2 = build_phase36_validation_manifest(R002_ROOT)
    assert m1["manifest_sha256"] == m2["manifest_sha256"]
    assert m1["execution_status"] == "DESIGN_FROZEN_AWAITING_EXECUTION_AUTHORIZATION"
    assert m1["safety_architecture_version"] == SAFETY_ARCHITECTURE_VERSION

    budget = m1["evaluation_budget"]
    assert budget["track_362_primary_envelope_episodes"] == 775
    assert budget["track_363_unseen_and_boundary_episodes"] == 240
    assert budget["track_364_pose_tilt_impulse_episodes"] == 120
    assert budget["track_365_fault_recovery_scenarios"] == 30
    assert budget["track_366_task2_non_regression_episodes"] == 50
    assert budget["total_campaign_episodes"] == 1215

    hashes = m1["frozen_safety_v1_and_baseline_sha256"]
    assert "src/safety/geometry_cbf_safety_filter.py" in hashes
    assert "src/integrated/peginhole_phase352_controller.py" in hashes
    assert "src/safety/pcbf_safety_filter.py" in hashes
    assert "src/coordination/plcea_substitutor.py" in hashes
    assert len(m1["acceptance_gates"]) == 6
