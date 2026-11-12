"""
Phase 3.7.1 Read-only OOD Epistemic Uncertainty Diagnostic Verification Tests.
"""

from __future__ import annotations

import json
import os
import sys

R002_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, R002_ROOT)
sys.path.insert(0, os.path.join(R002_ROOT, "src"))

from src.integrated.phase35_evaluator import verify_phase34_artifacts_and_load
from src.integrated.phase37_1_ood_diagnostics import (
    PHASE37_1_REPORT_JSON_REL,
    PHASE37_1_REPORT_MD_REL,
    run_phase37_1_epistemic_diagnostics,
    verify_all_source_sha256s,
)


def test_phase37_1_read_only_u1_reproduction_and_artifacts():
    p34_ctx_before = verify_phase34_artifacts_and_load(R002_ROOT)
    sha_before = verify_all_source_sha256s(R002_ROOT, p34_ctx_before)

    doc = run_phase37_1_epistemic_diagnostics(R002_ROOT)
    assert doc["training_permitted"] is False
    assert doc["execution_mode"] == "READ_ONLY_FROZEN_CHECKPOINTS_AND_ARCHIVES"

    u1 = doc["u1_baseline_reproduction"]
    assert u1["passed"] is True
    assert u1["max_abs_diff"] == 0.0
    rep = u1["reproduced"]
    assert rep["M4_B3_transition_total_auroc"] == 0.4169
    assert rep["M4_B3_transition_epistemic_auroc"] == 0.4627
    assert rep["M4_B3_lowmu_total_auroc"] == 0.3347
    assert rep["M4_B3_lowmu_epistemic_auroc"] == 0.4450

    m4 = doc["task2_conditions"]["M4_acmm"]
    dec = m4["simpson_mode_vs_within_decomposition"]
    assert dec["observed_epi_delta_ood_minus_id"] < 0.0
    assert abs((dec["mode_mix_shift_component"] + dec["within_mode_collapse_component"]) - dec["observed_epi_delta_ood_minus_id"]) <= 0.001

    b4 = doc["b4_conformal_reference"]
    assert b4["offline_test_id"]["M4_acmm"]["episode_joint_coverage"]["joint_simultaneous"]["count"] == 38
    assert b4["offline_test_ood"]["M4_acmm"]["episode_joint_coverage"]["joint_simultaneous"]["count"] == 32
    assert b4["offline_test_ood"]["M4_acmm"]["per_sub_stratum"]["OOD-LowMu"]["joint_simultaneous"]["count"] == 7

    json_path = os.path.join(R002_ROOT, PHASE37_1_REPORT_JSON_REL)
    md_path = os.path.join(R002_ROOT, PHASE37_1_REPORT_MD_REL)
    assert os.path.exists(json_path) and os.path.exists(md_path)
    with open(json_path, "r", encoding="utf-8") as f:
        loaded = json.load(f)
    assert loaded["u1_baseline_reproduction"]["max_abs_diff"] == 0.0

    # Confirm zero mutation of all upstream Phase 3.4-3.7 checkpoints & archives
    p34_ctx_after = verify_phase34_artifacts_and_load(R002_ROOT)
    sha_after = verify_all_source_sha256s(R002_ROOT, p34_ctx_after)
    assert sha_before == sha_after

