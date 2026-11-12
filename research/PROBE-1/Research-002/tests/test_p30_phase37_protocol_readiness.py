"""Phase 3.7 Specification & Readiness Unit Tests (Design-Only, Zero Training/Execution)."""

import os
import sys

R002_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
R002_SRC = os.path.join(R002_ROOT, "src")
if R002_ROOT not in sys.path:
    sys.path.insert(0, R002_ROOT)
if R002_SRC not in sys.path:
    sys.path.insert(0, R002_SRC)

from src.integrated.phase37_uncertainty_protocol import (
    PHASE37_PROGRAM_VERSION,
    build_phase37_uncertainty_manifest,
    extract_archived_uncertainty_baselines,
)


def test_phase37_manifest_determinism_and_freeze_policy():
    m1 = build_phase37_uncertainty_manifest(R002_ROOT)
    m2 = build_phase37_uncertainty_manifest(R002_ROOT)
    assert m1["manifest_sha256"] == m2["manifest_sha256"]
    assert m1["execution_status"] == "DESIGN_FROZEN_AWAITING_EXECUTION_AUTHORIZATION"
    assert m1["program_version"] == PHASE37_PROGRAM_VERSION
    assert len(m1["workstreams"]) == 3
    assert all(ws["training_permitted"] is False for ws in m1["workstreams"])
    assert len(m1["acceptance_gates"]) == 5


def test_phase37_baselines_and_locked_hashes():
    b = extract_archived_uncertainty_baselines(R002_ROOT)
    assert abs(b["M4_acmm_B3_transition_auroc_total_std"] - 0.4169) < 1e-4
    assert abs(b["M4_acmm_B3_transition_auroc_epistemic_std"] - 0.4627) < 1e-4
    assert abs(b["M4_acmm_B3_ood_lowmu_auroc_total_std"] - 0.3347) < 1e-4
    m = build_phase37_uncertainty_manifest(R002_ROOT)
    assert "experiments/phase3_6_robustness_validation/phase36_validation_results.json" in m["locked_phase36_archive_sha256"]
    assert "experiments/phase3_6_robustness_validation/phase36_closure_adjudication.json" in m["locked_phase36_archive_sha256"]

