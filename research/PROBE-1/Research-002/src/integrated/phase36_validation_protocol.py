"""Phase 3.6 Experimental Protocol Specification & Readiness Verifier (Design Only).

Defines and freezes the Phase 3.6 Robustness Validation protocol prior to execution:
- Frozen Safety Architecture v1.0 SHA-256 receipts (zero controller mutation)
- Binomial sample-size power & Clopper-Pearson one-sided 95% UCB calculation
- Disjoint seed allocation across Tracks 3.6.2..3.6.6 (seeds 8000..8849)
- Pre-registered quantitative acceptance gates (G1..G6)
"""

from __future__ import annotations

import hashlib
import json
import math
import os
from typing import Any, Dict, List, Tuple

from src.integrated.calibration_runner import PHASE3_SEED_POOLS, verify_disjoint_seed_pools
from src.integrated.peginhole_phase352_controller import (
    PHYSICAL_CONDITIONS,
    PILOT_SEEDS,
    collect_immutable_file_hashes,
)
from src.integrated.phase34_pipeline import _sha256_file
from src.integrated.phase35_evaluator import verify_phase34_artifacts_and_load
from src.integrated.statistical_analysis import to_json_serializable

SAFETY_ARCHITECTURE_VERSION = "v1.0-phase3.5.2-accepted"

# Pre-registered sample sizes
PRIMARY_N_PER_CORNER_M4_B3 = 60  # Gives 1-sided 95% UCB = 1 - 0.05**(1/60) = 4.87% <= 5.0%
PRIMARY_N_PER_CORNER_M4_B1 = 20
PRIMARY_N_PER_CORNER_M0_B3 = 15

# Disjoint Phase 3.6 seed blocks (8000..8849)
PHASE36_SEED_BLOCKS: Dict[str, List[int]] = {
    "track_362_id_nominal": list(range(8000, 8060)),
    "track_362_ood_mu075_clr018": list(range(8060, 8120)),
    "track_362_ood_mu075_clr025": list(range(8120, 8180)),
    "track_362_ood_mu085_clr018": list(range(8180, 8240)),
    "track_362_ood_mu085_clr025": list(range(8240, 8300)),
    "track_363_unseen_interpolation": list(range(8300, 8460)),
    "track_363_boundary_stress": list(range(8460, 8540)),
    "track_364_pose_tilt_contact_stress": list(range(8600, 8720)),
    "track_365_fault_recovery_injection": list(range(8720, 8750)),
    "track_366_task2_non_regression": list(range(8800, 8850)),
}

# Track 3.6.3 (8 unseen interior + 4 stress/boundary combinations, 20 ep each = 240 ep)
UNSEEN_INTERPOLATION_CELLS: Tuple[Tuple[str, float, float, str], ...] = (
    ("INT_mu060_clr035", 0.60, 0.35, "unknown_clearance"),
    ("INT_mu065_clr022", 0.65, 0.22, "unknown_clearance"),
    ("INT_mu080_clr020", 0.80, 0.20, "unknown_clearance"),
    ("INT_mu075_clr022", 0.75, 0.22, "unknown_clearance"),
    ("INT_mu085_clr021", 0.85, 0.21, "unknown_clearance"),
    ("INT_mu060_clr020", 0.60, 0.20, "estimated_clearance"),
    ("INT_mu070_clr030", 0.70, 0.30, "estimated_clearance"),
    ("INT_mu080_clr035", 0.80, 0.35, "estimated_clearance"),
)

BOUNDARY_STRESS_CELLS: Tuple[Tuple[str, float, float, str, str], ...] = (
    ("BND_below018_runtime_falsify", 0.85, 0.14, "unknown_clearance", "runtime_contact_resistance_refusal"),
    ("BND_below018_proactive_refuse", 0.85, 0.14, "unknown_clearance", "min_possible_clearance_014_refusal"),
    ("BND_below018_mode_a_valid", 0.85, 0.14, "estimated_clearance", "metrology_c_hat_014_sigma_0015"),
    ("BND_high_mu095_clr018", 0.95, 0.18, "unknown_clearance", "beyond_mu085_upper_friction_corner"),
)

# Track 3.6.4 (4 stress modes x 30 ep = 120 ep)
POSE_STRESS_MODES: Tuple[Tuple[str, int, str], ...] = (
    ("STRESS_A_large_radial_offset", 30, "r0 in [2.5, 4.5] mm, z0 in [2.0, 5.0] mm"),
    ("STRESS_B_high_initial_tilt", 30, "tilt0 in [1.2, 2.5] deg (4.6x-9.7x OOD theta_crit)"),
    ("STRESS_C_near_rim_contact_acq", 30, "z0 in [0.25, 1.0] mm, random xy/tilt + immediate plunge probe"),
    ("STRESS_D_mid_insertion_impulse", 30, "20 N / 2.0 deg lateral+tilt disturbance at z ~ -15 mm"),
)


def one_sided_clopper_pearson_ucb_zero(n: int, confidence: float = 0.95) -> float:
    """Exact one-sided upper confidence bound for 0 observed failures in ``n`` trials."""
    if n <= 0:
        raise ValueError("Sample size n must be positive.")
    alpha = 1.0 - float(confidence)
    return float(1.0 - (alpha ** (1.0 / float(n))))


def required_n_for_zero_failure_ucb(target_ucb: float, confidence: float = 0.95) -> int:
    """Minimum integer N such that 0/N gives 1-sided confidence UCB <= target_ucb."""
    if not (0.0 < target_ucb < 1.0):
        raise ValueError("target_ucb must be in (0, 1).")
    alpha = 1.0 - float(confidence)
    return int(math.ceil(math.log(alpha) / math.log(1.0 - float(target_ucb))))


def verify_phase36_seed_disjointness() -> Dict[str, Any]:
    """Prove all Phase 3.6 seed blocks are pairwise disjoint from Phase 3 & 3.5.2 pools."""
    p3_audit = verify_disjoint_seed_pools()
    seen: Dict[int, str] = {}

    for name, pool in PHASE3_SEED_POOLS.items():
        if name == "excluded_p26_pilot":
            continue
        for s in pool:
            seen[int(s)] = f"phase3:{name}"
    for s in PILOT_SEEDS:
        sid = int(s)
        if sid in seen:
            raise RuntimeError(f"Seed {sid} collision between {seen[sid]} and phase3_5_2_pilot")
        seen[sid] = "phase3_5_2:pilot"

    p36_counts: Dict[str, int] = {}
    p36_total = 0
    for block_name, block_seeds in PHASE36_SEED_BLOCKS.items():
        if len(block_seeds) != len(set(block_seeds)):
            raise RuntimeError(f"Duplicate seed inside Phase 3.6 block {block_name}")
        for s in block_seeds:
            sid = int(s)
            if sid in seen:
                raise RuntimeError(f"Phase 3.6 seed {sid} in {block_name} overlaps {seen[sid]}")
            seen[sid] = f"phase3_6:{block_name}"
        p36_counts[block_name] = len(block_seeds)
        p36_total += len(block_seeds)

    return {
        "disjoint_verified": True,
        "phase3_pool_audit": p3_audit,
        "phase3_5_2_pilot_range": [int(PILOT_SEEDS[0]), int(PILOT_SEEDS[-1])],
        "phase3_6_total_unique_seeds": p36_total,
        "phase3_6_block_counts": p36_counts,
        "pairwise_overlap_count": 0,
    }


def collect_safety_architecture_v1_hashes(r002_root: str) -> Dict[str, str]:
    """Collect SHA-256 hashes of frozen Safety Architecture v1.0 & baselines."""
    hashes = collect_immutable_file_hashes(r002_root)
    v1_rel_paths = (
        "src/safety/geometry_cbf_safety_filter.py",
        "src/integrated/peginhole_phase352_controller.py",
        "experiments/phase3_5_2_safety_investigation/phase35_2_pilot_manifest.json",
        "experiments/phase3_5_2_safety_investigation/phase35_2_investigation.json",
        "experiments/phase3_5_2_safety_investigation/phase35_2_telemetry_audit.json",
    )
    for rel in v1_rel_paths:
        full = os.path.join(r002_root, rel)
        if not os.path.exists(full):
            raise FileNotFoundError(f"Required frozen Safety v1.0 / Phase 3.5.2 file missing: {rel}")
        hashes[rel] = _sha256_file(full)
    return hashes


def build_phase36_validation_manifest(r002_root: str) -> Dict[str, Any]:
    """Construct the deterministic Phase 3.6 experimental specification & manifest (no eval execution)."""
    seed_audit = verify_phase36_seed_disjointness()
    v1_hashes = collect_safety_architecture_v1_hashes(r002_root)

    # Track 3.6.2 cells
    t362_blocks = [
        ("ID", 0.50, 0.50, PHASE36_SEED_BLOCKS["track_362_id_nominal"]),
        ("OOD_mu075_clr018", 0.75, 0.18, PHASE36_SEED_BLOCKS["track_362_ood_mu075_clr018"]),
        ("OOD_mu075_clr025", 0.75, 0.25, PHASE36_SEED_BLOCKS["track_362_ood_mu075_clr025"]),
        ("OOD_mu085_clr018", 0.85, 0.18, PHASE36_SEED_BLOCKS["track_362_ood_mu085_clr018"]),
        ("OOD_mu085_clr025", 0.85, 0.25, PHASE36_SEED_BLOCKS["track_362_ood_mu085_clr025"]),
    ]
    assert len(t362_blocks) == len(PHYSICAL_CONDITIONS)

    track_362_cells: List[Dict[str, Any]] = []
    t362_episodes = 0
    for phys_label, mu, clr, seeds in t362_blocks:
        specs = [
            ("M4_acmm", "B3", "estimated_clearance", seeds, "confirmatory_primary_mode_a"),
            ("M4_acmm", "B3", "unknown_clearance", seeds, "confirmatory_primary_mode_b"),
            ("M4_acmm", "B1", "unknown_clearance", seeds[:PRIMARY_N_PER_CORNER_M4_B1], "deterministic_wm_control"),
            ("M0_passive", "B3", "unknown_clearance", seeds[:PRIMARY_N_PER_CORNER_M0_B3], "passive_wm_comparison"),
        ]
        for cond, arch, clr_mode, cell_seeds, role in specs:
            n_ep = len(cell_seeds)
            t362_episodes += n_ep
            track_362_cells.append({
                "physical_condition": phys_label,
                "friction_coeff": mu,
                "clearance_mm": clr,
                "world_model_condition": cond,
                "architecture": arch,
                "clearance_mode": clr_mode,
                "role": role,
                "n_episodes": n_ep,
                "seed_range": [int(cell_seeds[0]), int(cell_seeds[-1])],
                "zero_failure_95pct_ucb": round(one_sided_clopper_pearson_ucb_zero(n_ep), 6),
            })

    # Track 3.6.3 cells
    track_363_cells: List[Dict[str, Any]] = []
    interp_seeds = PHASE36_SEED_BLOCKS["track_363_unseen_interpolation"]
    for idx, (label, mu, clr, clr_mode) in enumerate(UNSEEN_INTERPOLATION_CELLS):
        sl = interp_seeds[idx * 20 : (idx + 1) * 20]
        track_363_cells.append({
            "cell_id": label,
            "category": "unseen_interpolation",
            "friction_coeff": mu,
            "clearance_mm": clr,
            "world_model_condition": "M4_acmm",
            "architecture": "B3",
            "clearance_mode": clr_mode,
            "n_episodes": len(sl),
            "seed_range": [int(sl[0]), int(sl[-1])],
        })

    bnd_seeds = PHASE36_SEED_BLOCKS["track_363_boundary_stress"]
    for idx, (label, mu, clr, clr_mode, rule) in enumerate(BOUNDARY_STRESS_CELLS):
        sl = bnd_seeds[idx * 20 : (idx + 1) * 20]
        track_363_cells.append({
            "cell_id": label,
            "category": "boundary_stress",
            "friction_coeff": mu,
            "clearance_mm": clr,
            "world_model_condition": "M4_acmm",
            "architecture": "B3",
            "clearance_mode": clr_mode,
            "expected_behavior": rule,
            "n_episodes": len(sl),
            "seed_range": [int(sl[0]), int(sl[-1])],
        })

    # Track 3.6.4 cells
    track_364_cells: List[Dict[str, Any]] = []
    stress_seeds = PHASE36_SEED_BLOCKS["track_364_pose_tilt_contact_stress"]
    offset = 0
    for label, count, desc in POSE_STRESS_MODES:
        sl = stress_seeds[offset : offset + count]
        offset += count
        track_364_cells.append({
            "stress_mode": label,
            "description": desc,
            "physical_condition": "OOD_mu085_clr018_corner_worst_case",
            "world_model_condition": "M4_acmm",
            "architecture": "B3",
            "clearance_mode": "unknown_clearance",
            "n_episodes": len(sl),
            "seed_range": [int(sl[0]), int(sl[-1])],
        })

    t363_episodes = sum(c["n_episodes"] for c in track_363_cells)
    t364_episodes = sum(c["n_episodes"] for c in track_364_cells)
    t365_episodes = len(PHASE36_SEED_BLOCKS["track_365_fault_recovery_injection"])
    t366_episodes = len(PHASE36_SEED_BLOCKS["track_366_task2_non_regression"])
    total_episodes = t362_episodes + t363_episodes + t364_episodes + t365_episodes + t366_episodes

    manifest: Dict[str, Any] = {
        "schema_version": "phase3_6_validation_protocol_v1",
        "execution_status": "DESIGN_FROZEN_AWAITING_EXECUTION_AUTHORIZATION",
        "safety_architecture_version": SAFETY_ARCHITECTURE_VERSION,
        "frozen_models_policy": "Keep all Phase 3.4 B1-B4 checkpoints and B4 calibration artifacts 100% frozen (no retraining or recalibration).",
        "shadow_baseline_policy": "PredictiveCBFSafetyFilter evaluated in read-only shadow mode only; never actuated live.",
        "seed_disjointness_audit": seed_audit,
        "sample_size_justification": {
            "target_per_condition_ucb_95": 0.05,
            "minimum_n_for_0_violations_ucb_le_005": required_n_for_zero_failure_ucb(0.05, 0.95),
            "chosen_primary_n_per_condition": PRIMARY_N_PER_CORNER_M4_B3,
            "realized_per_condition_ucb_95": round(one_sided_clopper_pearson_ucb_zero(PRIMARY_N_PER_CORNER_M4_B3, 0.95), 6),
            "realized_ood_4corners_ucb_95_per_mode": round(one_sided_clopper_pearson_ucb_zero(240, 0.95), 6),
            "realized_primary_mode_overall_ucb_95": round(one_sided_clopper_pearson_ucb_zero(300, 0.95), 6),
            "realized_paired_m4_b3_total_ucb_95": round(one_sided_clopper_pearson_ucb_zero(600, 0.95), 6),
        },
        "evaluation_budget": {
            "track_362_primary_envelope_episodes": t362_episodes,
            "track_363_unseen_and_boundary_episodes": t363_episodes,
            "track_364_pose_tilt_impulse_episodes": t364_episodes,
            "track_365_fault_recovery_scenarios": t365_episodes,
            "track_366_task2_non_regression_episodes": t366_episodes,
            "total_campaign_episodes": total_episodes,
            "estimated_cpu_runtime_minutes": round((total_episodes * 2.15) / 60.0, 1),
        },
        "acceptance_gates": {
            "G1_zero_dynamic_crush_and_force_violations": "0 dynamic-crush (>40 N / >8 N*m) and 0 SafetyEvaluator (>35 N / >7 N*m) violations across Tracks 3.6.2, 3.6.3 (in-envelope + boundary), and 3.6.4.",
            "G2_non_degenerate_contact_acquisition_and_seating": "M4_acmm in valid domain achieves >=90% seating success and >=95% physical bore contact acquisition (M0_passive reported separately).",
            "G3_below_domain_and_fault_refusal": "100% of out-of-domain clearance (0.14 mm under Mode B) and injected telemetry/clearance faults trigger fail-closed refusal or safe hold above z > 0 with 0 violations.",
            "G4_pose_tilt_and_impulse_safety": "0 dynamic-crush violations under extreme initial offset/tilt, sudden z>0->z<=0 plunge, and mid-insertion impulses; clean reporting of alignment_failed hold vs seated recovery.",
            "G5_zero_oracle_leakage_and_shadow_only_baseline": "Controller/CBF produce identical outputs under mutated vs stripped oracle keys; baseline PredictiveCBFSafetyFilter strictly shadow-only.",
            "G6_immutable_checkpoints_and_task2_non_regression": "Zero SHA-256 drift on all B1-B4 checkpoints, datasets, Phase 3.5/3.5.1/3.5.2 archives; Task 2 ID + 4 OOD strata show zero regression.",
        },
        "tracks": {
            "3.6.2_primary_physical_envelope": track_362_cells,
            "3.6.3_unseen_and_boundary": track_363_cells,
            "3.6.4_pose_tilt_contact_stress": track_364_cells,
            "3.6.5_fault_recovery_injection": {
                "n_scenarios": t365_episodes,
                "seed_range": [8720, 8749],
                "categories": [
                    "non_finite_pos_vel_rot_wrench_10ep",
                    "missing_or_narrow_mode_a_metrology_10ep",
                    "invalid_stratum_or_wm_prediction_10ep",
                ],
            },
            "3.6.6_task2_non_regression": {
                "n_episodes": t366_episodes,
                "seed_range": [8800, 8849],
                "strata": ["ID-Nominal", "OOD-LowMu", "OOD-HighMass", "OOD-RegimeA-FrictionStep", "OOD-RegimeB-MassInflux"],
            },
        },
        "frozen_safety_v1_and_baseline_sha256": v1_hashes,
    }
    manifest["manifest_sha256"] = hashlib.sha256(
        json.dumps(to_json_serializable(manifest), sort_keys=True).encode("utf-8")
    ).hexdigest()
    return manifest


def run_phase36_readiness_preflight(r002_root: str, write_manifest: bool = True) -> Dict[str, Any]:
    """Verify Phase 3.4/3.5.2 artifacts and write frozen Phase 3.6 validation manifest (NO large campaign run)."""
    verify_phase34_artifacts_and_load(r002_root)
    manifest = build_phase36_validation_manifest(r002_root)
    out_path = os.path.join(r002_root, "manifests", "phase36_validation_manifest.json")
    if write_manifest:
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(to_json_serializable(manifest), f, indent=2)
    return {
        "manifest_path": "manifests/phase36_validation_manifest.json",
        "manifest_sha256": manifest["manifest_sha256"],
        "total_campaign_episodes": manifest["evaluation_budget"]["total_campaign_episodes"],
        "total_unique_seeds": manifest["seed_disjointness_audit"]["phase3_6_total_unique_seeds"],
        "disjoint_verified": manifest["seed_disjointness_audit"]["disjoint_verified"],
        "b1_to_b4_and_v1_verified": True,
    }
