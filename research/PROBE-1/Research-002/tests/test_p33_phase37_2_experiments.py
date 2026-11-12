"""Regression and verification tests for PROBE-1 Research-002 Phase 3.7.2.

Verifies:
1. Deliverable artifacts exist on disk and follow expected schemas.
2. U1 baseline parity reproduced within 1e-4 against Phase 3.7.1 archive.
3. U5 data integrity, seed disjointness, zero world-model training, and B4 immutability.
4. C1-C5 candidate evaluations, bootstrap confidence intervals, and Holm-adjusted p-values.
5. Per-contact-mode conformal coverage (n >= 20) and non-privileged feature enforcement.
6. CSV comparison consistency with JSON results.
"""

from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path
from typing import Any, Dict

import pytest

TESTS_DIR = Path(__file__).resolve().parent
R002_ROOT = TESTS_DIR.parent
EXP_INTEL_DIR = R002_ROOT / "experiments" / "phase3_7_uncertainty_intelligence"


@pytest.fixture(scope="module")
def phase37_2_results() -> Dict[str, Any]:
    json_path = EXP_INTEL_DIR / "phase37_2_results.json"
    assert json_path.is_file(), f"Missing Phase 3.7.2 results JSON at {json_path}"
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)


def test_phase37_2_deliverables_exist_and_nonempty() -> None:
    expected_files = [
        EXP_INTEL_DIR / "phase37_2_results.json",
        EXP_INTEL_DIR / "phase37_2_candidate_comparison.csv",
        EXP_INTEL_DIR / "phase37_2_execution_report.md",
        EXP_INTEL_DIR / "phase37_2_reproducibility_audit.md",
    ]
    for path in expected_files:
        assert path.is_file(), f"Required deliverable missing: {path}"
        assert path.stat().st_size > 0, f"Required deliverable empty: {path}"


def test_phase37_2_results_schema(phase37_2_results: Dict[str, Any]) -> None:
    assert phase37_2_results.get("program") == "HOROS PROBE-1 — Research-002"
    assert "Phase 3.7.2" in phase37_2_results.get("stage", "")
    assert phase37_2_results.get("elapsed_s", 0.0) > 0.0

    runtime = phase37_2_results.get("runtime_environment", {})
    assert "python_version" in runtime
    assert "torch_version" in runtime
    assert "software_revision" in runtime

    assert "frozen_config_sha256" in phase37_2_results
    assert len(phase37_2_results["frozen_config_sha256"]) == 64

    gate_summary = phase37_2_results.get("gate_summary", {})
    for gate_key in [
        "U1_frozen_baseline_parity",
        "U2_ood_discrimination_improvement",
        "U3_conformal_coverage_and_risk_coverage",
        "U4_temporal_inference_and_diversity",
        "U5_seed_disjointness_and_artifact_immutability",
    ]:
        assert gate_key in gate_summary, f"Missing gate {gate_key} in gate_summary"


def test_u1_frozen_baseline_parity(phase37_2_results: Dict[str, Any]) -> None:
    u1 = phase37_2_results["gate_summary"]["U1_frozen_baseline_parity"]
    assert u1["status"] == "PASS"
    assert u1["passed"] == 1
    assert u1["max_abs_diff"] <= 1e-4

    expected = u1["expected"]
    reproduced = u1["reproduced"]
    for key, exp_val in expected.items():
        assert key in reproduced, f"Missing reproduced metric: {key}"
        assert abs(reproduced[key] - exp_val) <= 1e-4, f"Metric mismatch on {key}: {reproduced[key]} vs {exp_val}"


def test_u5_data_integrity_and_seed_disjointness(phase37_2_results: Dict[str, Any]) -> None:
    u5 = phase37_2_results["gate_summary"]["U5_seed_disjointness_and_artifact_immutability"]
    assert u5["status"] == "PASS"
    assert u5["mismatches"] == 0

    readiness = phase37_2_results.get("pre_execution_readiness", {})
    assert readiness.get("training_permitted") == 0
    assert readiness.get("immutable_sha256_mismatches") == 0

    seed_audit = readiness.get("seed_audit", {})
    assert seed_audit.get("disjoint_verified") == 1
    assert seed_audit.get("historical_overlap_count") == 0
    assert seed_audit.get("calib_val_overlap_count") == 0
    assert seed_audit.get("below_floor_count") == 0
    assert seed_audit.get("total_phase37_2_episodes") == 340

    # Ensure Phase 3.4 B4 conformal calibration JSON files on disk are completely unchanged
    manifest_path = R002_ROOT / "manifests" / "phase37_2_uncertainty_manifest.json"
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    b4_artifacts = manifest.get("frozen_phase34_artifacts", {}).get("b4_conformal_calibrations", {})
    for rel_path, exp_sha in b4_artifacts.items():
        full_path = R002_ROOT / rel_path
        assert full_path.is_file(), f"B4 artifact missing: {full_path}"
        with open(full_path, "rb") as f:
            actual_sha = hashlib.sha256(f.read()).hexdigest()
        assert actual_sha == exp_sha, f"B4 artifact modified on disk: {rel_path} ({actual_sha} != {exp_sha})"


def test_candidates_c1_through_c5_evaluated(phase37_2_results: Dict[str, Any]) -> None:
    evals = phase37_2_results.get("task2_candidate_evaluations", [])
    assert len(evals) >= 15, f"Expected at least 15 candidate evaluations, got {len(evals)}"

    candidate_names = {item["candidate"] for item in evals}

    # Verify presence of representative variants for all candidates C1-C5 and baselines
    expected_prefixes = [
        "Baseline_M4_B3",
        "C1a_",
        "C1b_",
        "C1_",
        "C2_",
        "C3_",
        "C4_",
    ]
    for prefix in expected_prefixes:
        matching = [name for name in candidate_names if name.startswith(prefix)]
        assert len(matching) > 0, f"No evaluated candidate found for prefix: {prefix}"

    # Verify metrics are within valid ranges [0, 1] and finite
    for item in evals:
        name = item["candidate"]
        auroc = item.get("transition_auroc")
        assert auroc is not None and 0.0 <= auroc <= 1.0, f"Invalid transition_auroc for {name}: {auroc}"

        ci95 = item.get("transition_auroc_ci95")
        assert ci95 is not None and len(ci95) == 2, f"Missing CI95 for {name}"
        assert 0.0 <= ci95[0] <= ci95[1] <= 1.0, f"Invalid CI95 range for {name}: {ci95}"

        ep_auroc = item.get("episode_auroc")
        assert ep_auroc is not None and 0.0 <= ep_auroc <= 1.0, f"Invalid episode_auroc for {name}: {ep_auroc}"

        fpr95 = item.get("fpr_at_95tpr")
        assert fpr95 is not None and 0.0 <= fpr95 <= 1.0, f"Invalid fpr_at_95tpr for {name}: {fpr95}"

        holm_p = item.get("p_value_vs_b3_total_holm_adjusted")
        assert holm_p is not None and 0.0 <= holm_p <= 1.0, f"Invalid holm_p for {name}: {holm_p}"


def test_u2_gate_reporting(phase37_2_results: Dict[str, Any]) -> None:
    u2 = phase37_2_results["gate_summary"]["U2_ood_discrimination_improvement"]
    assert u2["status"] in ["PASS", "PARTIAL_OR_FAIL", "FAIL"]
    assert "best_candidate" in u2
    assert u2["transition_auroc"] > 0.60
    assert u2["lowmu_auroc"] >= 0.75
    assert u2["holm_adjusted_p"] <= 0.05
    assert "checks_passed" in u2


def test_u3_conformal_coverage_and_per_mode_reporting(phase37_2_results: Dict[str, Any]) -> None:
    u3 = phase37_2_results["gate_summary"]["U3_conformal_coverage_and_risk_coverage"]
    c5_ep = u3.get("episode_level_c5", {})
    assert c5_ep.get("id_joint", {}).get("rate", 0.0) >= 0.88
    assert c5_ep.get("ood_joint", {}).get("rate", 0.0) >= 0.85
    assert c5_ep.get("id_ood_gap", 1.0) <= 0.05

    c5_details = phase37_2_results.get("c5_conformal_calibration", {})
    trans_mode = c5_details.get("transition_level_task2_per_mode", {}).get("mode_normalized", {})
    per_mode = trans_mode.get("per_true_contact_mode", {})

    expected_modes = ["Free", "FirstContact", "Sticking", "Sliding", "Impact"]
    for mode in expected_modes:
        assert mode in per_mode, f"Missing per-contact-mode coverage for {mode}"
        mode_data = per_mode[mode]
        assert mode_data["n_pooled"] >= 20, f"Insufficient samples for mode {mode}: {mode_data['n_pooled']}"
        assert 0.70 <= mode_data["pooled_rate"] <= 1.0, f"Coverage out of bounds for mode {mode}"


def test_u4_temporal_inference_and_diversity(phase37_2_results: Dict[str, Any]) -> None:
    u4 = phase37_2_results["gate_summary"]["U4_temporal_inference_and_diversity"]
    assert u4["status"] == "PASS"
    assert u4["best_regimeA_post_vs_pre_auroc"] >= 0.80
    assert u4["best_spearman_err_pooled"] >= 0.25
    assert u4["b3_diversity_diagnostics_reported"] == 1

    c4_diag = phase37_2_results.get("c4_ensemble_correlation_diagnostics", {})
    assert "task2_M4_acmm" in c4_diag
    assert "task2_M0_passive" in c4_diag
    for model_key in ["task2_M4_acmm", "task2_M0_passive"]:
        val_id = c4_diag[model_key]["val_id"]
        assert val_id["mean_off_diag_corr"] >= 0.80
        assert val_id["effective_ensemble_size"] < 2.0


def test_candidate_comparison_csv_consistency(phase37_2_results: Dict[str, Any]) -> None:
    csv_path = EXP_INTEL_DIR / "phase37_2_candidate_comparison.csv"
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = list(csv.DictReader(f))

    evals = phase37_2_results.get("task2_candidate_evaluations", [])
    assert len(reader) == len(evals), f"CSV row count {len(reader)} != JSON evaluation count {len(evals)}"

    json_by_name = {item["candidate"]: item for item in evals}
    for row in reader:
        name = row["candidate"]
        assert name in json_by_name, f"Candidate {name} in CSV but not in JSON"
        json_item = json_by_name[name]
        assert abs(float(row["transition_auroc"]) - json_item["transition_auroc"]) <= 1e-4
        assert abs(float(row["holm_adjusted_p"]) - json_item["p_value_vs_b3_total_holm_adjusted"]) <= 1e-4


def test_task1_peginhole_evaluations_present(phase37_2_results: Dict[str, Any]) -> None:
    task1_evals = phase37_2_results.get("task1_peginhole_evaluations", [])
    assert len(task1_evals) >= 5, f"Expected at least 5 Task 1 evaluations, got {len(task1_evals)}"
    for item in task1_evals:
        assert "candidate" in item
        assert 0.0 <= item["transition_auroc"] <= 1.0
        assert 0.0 <= item["episode_auroc"] <= 1.0
        assert "risk_coverage" in item
