"""Phase 3.7 Specification & Readiness Protocol: Uncertainty-Aware Physical Intelligence.

Design-only specification (zero model retraining, zero checkpoint mutation, and zero large
evaluation runs). Locks all frozen Phase 3.4 B1-B4 checkpoints, Phase 3.5 closure archives,
and Phase 3.6 validation archives via SHA-256 verification before Phase 3.7 execution.
"""

from __future__ import annotations

import hashlib
import json
import os
from typing import Any, Dict, List

from src.integrated.phase34_pipeline import _sha256_file
from src.integrated.phase35_closure_addendum import verify_archived_phase35_immutability
from src.integrated.phase35_evaluator import verify_phase34_artifacts_and_load
from src.integrated.phase36_validation_protocol import collect_safety_architecture_v1_hashes
from src.integrated.phase36_validation_runner import FROZEN_MANIFEST_SHA256, verify_frozen_phase36_manifest
from src.integrated.statistical_analysis import to_json_serializable

PHASE37_PROGRAM_VERSION = "v1.0-phase3.7-spec-frozen"


def collect_phase36_closure_hashes(r002_root: str) -> Dict[str, str]:
    """Hash Phase 3.6 frozen manifest, campaign results archive, and closure adjudication."""
    rel_paths = [
        "manifests/phase36_validation_manifest.json",
        "experiments/phase3_6_robustness_validation/phase36_validation_results.json",
        "experiments/phase3_6_robustness_validation/phase36_closure_adjudication.json",
    ]
    hashes: Dict[str, str] = {}
    for rel in rel_paths:
        full = os.path.join(r002_root, rel)
        if not os.path.exists(full):
            raise FileNotFoundError(f"Required Phase 3.6 archive missing: {full}")
        hashes[rel] = _sha256_file(full)
    return hashes


def extract_archived_uncertainty_baselines(r002_root: str) -> Dict[str, Any]:
    """Extract archived Phase 3.5 uncertainty AUROC & conformal coverage baselines (read-only)."""
    addendum_path = os.path.join(r002_root, "experiments", "phase3_5_evaluation", "phase35_closure_addendum.json")
    with open(addendum_path, "r", encoding="utf-8") as f:
        addendum = json.load(f)

    ood = addendum["ood_auroc_audit"]["conditions"]
    b4 = addendum["b4_joint_coverage_audit"]
    return {
        "M0_passive_B2_transition_auroc_total_std": ood["M0_passive"]["B2"]["transition_auroc_total_std"],
        "M0_passive_B3_transition_auroc_total_std": ood["M0_passive"]["B3"]["transition_auroc_total_std"],
        "M0_passive_B3_transition_auroc_epistemic_std": ood["M0_passive"]["B3"]["transition_auroc_epistemic_std"],
        "M4_acmm_B3_transition_auroc_total_std": ood["M4_acmm"]["B3"]["transition_auroc_total_std"],
        "M4_acmm_B3_transition_auroc_epistemic_std": ood["M4_acmm"]["B3"]["transition_auroc_epistemic_std"],
        "M4_acmm_B3_ood_lowmu_auroc_total_std": ood["M4_acmm"]["B3"]["per_sub_stratum"]["OOD-LowMu"]["auroc_total_std_vs_id"],
        "M4_acmm_B3_ood_lowmu_auroc_epistemic_std": ood["M4_acmm"]["B3"]["per_sub_stratum"]["OOD-LowMu"]["auroc_epistemic_std_vs_id"],
        "b4_matched_coverage_summary": b4["audit_summary"],
    }


def build_phase37_uncertainty_manifest(r002_root: str) -> Dict[str, Any]:
    """Construct deterministic frozen Phase 3.7 specification manifest (read-only design)."""
    verify_frozen_phase36_manifest(r002_root)
    p35_imm = verify_archived_phase35_immutability(os.path.join(r002_root, "experiments", "phase3_5_evaluation"))
    v1_hashes = collect_safety_architecture_v1_hashes(r002_root)
    p36_hashes = collect_phase36_closure_hashes(r002_root)
    baselines = extract_archived_uncertainty_baselines(r002_root)

    workstreams: List[Dict[str, Any]] = [
        {
            "track_id": "3.7.1_diagnose_epistemic_uncertainty_under_ood",
            "title": "Diagnose Epistemic Uncertainty Collapse & Inversion Under OOD",
            "mode": "READ_ONLY_FROZEN_CHECKPOINTS_AND_ARCHIVES",
            "training_permitted": False,
            "data_sources": [
                "experiments/phase3_5_evaluation/phase35_offline_120ep_results.json",
                "experiments/phase3_5_evaluation/phase35_closed_loop_450ep_results.json",
                "experiments/phase3_6_robustness_validation/phase36_validation_results.json",
                "datasets/phase3_4/{offline_test_id,offline_test_ood,offline_test_peg_in_hole}",
            ],
            "diagnostic_axes": [
                "Epistemic vs. aleatoric variance decomposition across B2 and B3 (5-member ensemble disagreement vs predicted heteroscedastic variance).",
                "Normalization scaling & input saturation effects (src/models/normalization.py) causing lower total_std under OOD-LowMu (AUROC 0.3347) and OOD-HighMass (0.469).",
                "Contact-mode transition stratification (strata 0..4) comparing true prediction MSE/MAE vs predicted epistemic_std and total_std per horizon H in {1,3,5,10,20}.",
                "Feature/latent representation shift metrics (Mahalanobis / kNN feature distance vs ensemble disagreement) under frozen M0_passive and M4_acmm encoders.",
            ],
        },
        {
            "track_id": "3.7.2_contact_mode_aware_uncertainty_and_calibration",
            "title": "Contact-Mode-Aware Uncertainty Quantification & Conformal Calibration Design",
            "mode": "FROZEN_BASE_MODELS_CALIBRATION_DESIGN_NO_RETRAINING",
            "training_permitted": False,
            "components": [
                "Contact-mode-conditioned nonconformity normalization (separating free-space, impact, sliding, wedging, seated strata).",
                "Stratified OOD detection evaluation metrics: AUROC, AUPRC, FPR@95TPR, Spearman error-uncertainty correlation, and selective Risk-Coverage / AURC.",
                "B4 conformal coverage recovery target under OOD (addressing matched ID 95.0% -> OOD 80.0% M4 / 87.5% M0 gap without contaminating evaluation seeds).",
                "Strict disjointness guarantee preserving Phase 3.4 training/calibration/offline/closed-loop/Phase 3.6 seeds (`<=8849`).",
            ],
        },
        {
            "track_id": "3.7.3_uncertainty_conditioned_planning_and_trust_gate",
            "title": "Uncertainty-Conditioned Planning & World-Model Trust Arbitration Design",
            "mode": "SPECIFICATION_AND_ABALATION_PROTOCOL",
            "training_permitted": False,
            "components": [
                "Trust-gate rule design: when normalized/hybrid epistemic + distance-aware OOD score flags unreliable rollouts, shrink effective planning horizon H_eff, increase uncertainty penalty or abstain toward conservative GeometryAwareCBFSafetyFilter tube limits.",
                "Dual-task evaluation matrix across Task 1 (Peg-in-Hole OOD & boundary stress) and Task 2 (CompliantPreLift OOD-LowMu / HighMass / RegimeA / RegimeB).",
                "Non-degradation invariant: zero increase in safety violations (preserving Phase 3.6 0/1,135 PiH safety record) and maintained Task 1 valid-domain seating (>=95%).",
            ],
        },
    ]

    acceptance_gates = {
        "U1_root_cause_attribution_reproducible": "Deterministic reproduction of Phase 3.5 M4_acmm B3 OOD AUROC (0.4169 transition total_std / 0.3347 LowMu) and quantitative decomposition of epistemic vs aleatoric variance inversion.",
        "U2_mode_conditioned_ood_discrimination": "Calibrated contact-mode-aware detector achieves statistically validated improvement over frozen baseline AUROC (>=0.75 OOD vs ID without training on Phase 3.5/3.6 eval pools).",
        "U3_conformal_coverage_and_risk_coverage": "Improved selective Risk-Coverage AURC and bounded OOD conformal coverage gap while keeping B1-B4 checkpoints untouched unless explicit Phase 3.7 execution retraining addendum is authorized.",
        "U4_safety_and_task1_non_regression": "Preserve 0/1,135 PiH crush/SafetyEvaluator violations and valid-domain seating under any trust-gated planner integration.",
        "U5_strict_artifact_and_seed_hygiene": "100% SHA-256 immutability of Phase 3.4, 3.5, 3.6 archives and Safety Architecture v1.0; zero overlap with all prior seed pools (0..8849).",
    }

    manifest: Dict[str, Any] = {
        "schema_version": "phase3_7_uncertainty_protocol_v1",
        "execution_status": "DESIGN_FROZEN_AWAITING_EXECUTION_AUTHORIZATION",
        "program_version": PHASE37_PROGRAM_VERSION,
        "checkpoint_freeze_policy": "Keep all Phase 3.4 B1-B4 checkpoints frozen during Track 3.7.1 diagnostics and initial calibration analysis; zero retraining authorized under specification phase.",
        "phase36_precondition": {
            "manifest_sha256": FROZEN_MANIFEST_SHA256,
            "closure_adjudicated_six_gates": True,
        },
        "archived_uncertainty_baselines": baselines,
        "workstreams": workstreams,
        "acceptance_gates": acceptance_gates,
        "locked_phase35_archive_sha256": p35_imm,
        "locked_safety_v1_sha256": v1_hashes,
        "locked_phase36_archive_sha256": p36_hashes,
    }
    manifest["manifest_sha256"] = hashlib.sha256(
        json.dumps(to_json_serializable(manifest), sort_keys=True).encode("utf-8")
    ).hexdigest()
    return manifest


def run_phase37_readiness_preflight(r002_root: str, write_manifest: bool = True) -> Dict[str, Any]:
    """Verify frozen Phase 3.4-3.6 artifacts and write frozen Phase 3.7 specification manifest."""
    verify_phase34_artifacts_and_load(r002_root)
    manifest = build_phase37_uncertainty_manifest(r002_root)
    out_path = os.path.join(r002_root, "manifests", "phase37_uncertainty_manifest.json")
    if write_manifest:
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(to_json_serializable(manifest), f, indent=2)
    return {
        "manifest_path": "manifests/phase37_uncertainty_manifest.json",
        "manifest_sha256": manifest["manifest_sha256"],
        "workstream_count": len(manifest["workstreams"]),
        "execution_status": manifest["execution_status"],
        "all_prior_archives_verified": True,
    }

