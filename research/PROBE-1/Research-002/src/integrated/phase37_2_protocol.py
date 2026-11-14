"""
HOROS PROBE-1 — Research-002: Phase 3.7.2 Experimental Protocol & Readiness
Contact-Mode-Aware Uncertainty, History-Conditioned Inference, and Calibration

Establishes and freezes the Phase 3.7.2 experimental specification, pre-registered
acceptance gates (U1-U5), fresh disjoint calibration/validation seed pools (>=9000),
dataset generation & SHA-256 hashing utilities, and immutable upstream artifact checks.

STRICT GOVERNANCE INVARIANT:
- Zero new model training, fine-tuning, checkpoint modification, or candidate evaluation
  occurs in this module during Phase 3.7.2 specification & readiness setup.
- Zero overlap with any historical Phase 2.6, Phase 3.4, Phase 3.5, Phase 3.5.2, or
  Phase 3.6 seeds (all historical seeds <= 8849).
"""

from __future__ import annotations

import hashlib
import json
import os
from typing import Any, Dict, List, Optional, Sequence, Tuple

from src.contact_modes.contact_mode_definitions import MODE_NAMES, NUM_MODES
from src.environment import CompliantPreLiftContactEnv, PegInHoleEnv
from src.integrated.calibration_runner import PHASE3_SEED_POOLS, verify_disjoint_seed_pools
from src.integrated.peginhole_phase352_controller import PILOT_SEEDS
from src.integrated.phase34_pipeline import (
    _serialize_dataset_split_npz,
    _sha256_file,
    get_runtime_reproducibility_metadata,
)
from src.integrated.phase35_evaluator import PEG_OOD_CORNERS, verify_phase34_artifacts_and_load
from src.integrated.phase36_validation_protocol import (
    PHASE36_SEED_BLOCKS,
    verify_phase36_seed_disjointness,
)
from src.integrated.phase37_1_ood_diagnostics import (
    PHASE37_1_REPORT_JSON_REL,
    PHASE37_1_REPORT_MD_REL,
    verify_all_source_sha256s,
)
from src.integrated.statistical_analysis import to_json_serializable
from src.mining.contact_boundary_sampler import ContactBoundarySampler

PHASE37_2_MANIFEST_REL = os.path.join("manifests", "phase37_2_uncertainty_manifest.json")
PHASE37_2_DATASET_DIR_REL = os.path.join("datasets", "phase3_7_2")
PHASE37_2_DATASET_MANIFEST_REL = os.path.join(
    PHASE37_2_DATASET_DIR_REL, "phase37_2_dataset_manifest.json"
)
PHASE37_2_SPEC_REL = os.path.join(
    "experiments", "phase3_7_uncertainty_intelligence", "phase37_2_experimental_specification.md"
)
PHASE37_2_READINESS_REL = os.path.join(
    "experiments", "phase3_7_uncertainty_intelligence", "phase37_2_readiness_report.json"
)

HISTORICAL_MAX_SEED = 8849
PHASE37_2_SEED_FLOOR = 9000

# Strictly disjoint fresh seed pools (>=9000): 180 calibration + 160 validation = 340 episodes.
PHASE37_2_SEED_POOLS: Dict[str, List[int]] = {
    "p37_2_calib_task2_id": list(range(9000, 9060)),
    "p37_2_calib_task2_ood": list(range(9060, 9120)),
    "p37_2_calib_pih": list(range(9120, 9180)),
    "p37_2_val_task2_id": list(range(9200, 9260)),
    "p37_2_val_task2_ood": list(range(9260, 9320)),
    "p37_2_val_pih": list(range(9320, 9360)),
}

PHASE37_2_POOL_CONFIGS: Dict[str, Dict[str, Any]] = {
    "p37_2_calib_task2_id": {
        "split_role": "calibration",
        "task": "compliant_prelift",
        "regime": "ID",
        "npz_filename": "p37_2_calib_task2_id.npz",
    },
    "p37_2_calib_task2_ood": {
        "split_role": "calibration",
        "task": "compliant_prelift",
        "regime": "OOD",
        "npz_filename": "p37_2_calib_task2_ood.npz",
    },
    "p37_2_calib_pih": {
        "split_role": "calibration",
        "task": "peg_in_hole",
        "regime": "PegInHole",
        "npz_filename": "p37_2_calib_pih.npz",
    },
    "p37_2_val_task2_id": {
        "split_role": "validation",
        "task": "compliant_prelift",
        "regime": "ID",
        "npz_filename": "p37_2_val_task2_id.npz",
    },
    "p37_2_val_task2_ood": {
        "split_role": "validation",
        "task": "compliant_prelift",
        "regime": "OOD",
        "npz_filename": "p37_2_val_task2_ood.npz",
    },
    "p37_2_val_pih": {
        "split_role": "validation",
        "task": "peg_in_hole",
        "regime": "PegInHole",
        "npz_filename": "p37_2_val_pih.npz",
    },
}

PHASE37_2_WORKSTREAMS: List[Dict[str, Any]] = [
    {
        "track_id": "3.7.2-A",
        "title": "Contact-Mode-Aware Uncertainty",
        "objective": "Decouple uncertainty estimation and normalization across physical contact modes (ContactMode 0..6) so high-density free-space/sticking modes do not mask sliding/low-mu/impact divergence.",
        "status": "SPEC_FROZEN_READY",
        "training_permitted": False,
        "candidate_mechanisms": [
            "Per-mode reference score normalization (mean/IQR or empirical CDF quantile per ContactMode 0..6 fitted strictly on calibration ID transitions).",
            "Contact-mode-conditioned feature-space distance (diag-Mahalanobis / kNN distance inside frozen world-model hidden embeddings stratified by ContactMode).",
        ],
    },
    {
        "track_id": "3.7.2-B",
        "title": "History-Conditioned Physical Inference",
        "objective": "Use short causal state-action-wrench-slip windows (L in {5, 10} steps) and frozen 1-step innovation residuals to detect hidden physical parameter shifts (OOD-LowMu, OOD-HighMass) and non-stationary transitions (RegimeA friction step, RegimeB mass influx).",
        "status": "SPEC_FROZEN_READY",
        "training_permitted": False,
        "candidate_mechanisms": [
            "Windowed friction-cone and mass-balance residual tracker over (fn, tangential force proxy, slip_vel, z_obj) at L in {5, 10}.",
            "CUSUM / EWMA innovation statistic over frozen M4_acmm / M0_passive 1-step prediction residuals within-episode.",
            "Frozen-feature causal probe (lightweight ridge/linear physical parameter & regime-shift estimator trained strictly on Phase 3.7.2 calibration rollouts when execution is authorized).",
        ],
    },
    {
        "track_id": "3.7.2-C",
        "title": "Contact-Mode-Aware Conformal Calibration",
        "objective": "Recover ID->OOD conformal coverage continuity (addressing matched EpisodeConformalEngine ID 95.0% -> OOD 80.0% M4 / 87.5% M0 drop, and OOD-LowMu 50.0% collapse) using mode-normalized nonconformity fitted strictly on fresh calibration seeds (>=9000).",
        "status": "SPEC_FROZEN_READY",
        "training_permitted": False,
        "candidate_mechanisms": [
            "Contact-mode-normalized multi-horizon nonconformity scores fitted on p37_2_calib_task2_id and p37_2_calib_pih ID slices.",
            "Uncertainty-adaptive / difficulty-weighted conformal scaling preserving valid-domain nominal coverage (target >= 90% at alpha=0.10) without peeking at validation or Phase 3.5/3.6 eval seeds.",
        ],
    },
    {
        "track_id": "3.7.2-D",
        "title": "B3 Ensemble Diversity and Correlated Errors",
        "objective": "Characterize pairwise residual correlation and effective ensemble size across B3's E=5 identically initialized MLP-LayerNorm members, evaluating post-hoc decorrelation and diversity-aware uncertainty aggregation before deciding if any future architectural retraining is needed.",
        "status": "SPEC_FROZEN_READY",
        "training_permitted": False,
        "candidate_mechanisms": [
            "Per-mode pairwise member residual correlation matrix R_m, variance inflation factor (VIF), and Epi/Bias^2 ratio decomposition.",
            "Mahalanobis precision-weighted ensemble disagreement and hybrid epistemic + frozen-encoder feature-distance scoring.",
        ],
    },
    {
        "track_id": "3.7.2-E",
        "title": "OOD Detection Evaluation",
        "objective": "Rigorous, stratified evaluation on strictly held-out fresh validation pools (9200..9359) plus secondary frozen holdout audit (3000..3119) reporting transition and episode AUROC, AUPRC, FPR@95TPR, Spearman error-uncertainty correlation, and Risk-Coverage AURC.",
        "status": "SPEC_FROZEN_READY",
        "training_permitted": False,
        "candidate_mechanisms": [
            "Unified detector benchmark suite across Task 2 strata (ID vs OOD overall, LowMu, HighMass, RegimeA, RegimeB) and Task 1 (Peg-ID vs Peg-OOD).",
            "Bootstrap 95% confidence intervals (B=2000) and Holm-Bonferroni paired significance tests against frozen B3 total_std and epistemic_std baselines.",
        ],
    },
]

PHASE37_2_ACCEPTANCE_GATES: Dict[str, Dict[str, Any]] = {
    "U1_frozen_baseline_parity": {
        "description": "Reproduce exact frozen M4_acmm B3 Phase 3.7.1 baseline OOD AUROC values (0.4169 total_std, 0.4627 epistemic_std; LowMu 0.3347 total_std, 0.4450 epistemic_std) within 1e-4 and record fresh validation pool baselines prior to any candidate scoring.",
        "metric": "abs_diff_vs_phase37_1_baseline",
        "threshold": 1e-4,
        "frozen_reference": {
            "M4_acmm_B3_transition_auroc_total_std": 0.4169,
            "M4_acmm_B3_transition_auroc_epistemic_std": 0.4627,
            "M4_acmm_B3_ood_lowmu_auroc_total_std": 0.3347,
            "M4_acmm_B3_ood_lowmu_auroc_epistemic_std": 0.4450,
            "M4_acmm_B4_matched_id_coverage": 0.950,
            "M4_acmm_B4_matched_ood_coverage": 0.800,
            "M4_acmm_B4_matched_lowmu_coverage": 0.500,
        },
    },
    "U2_ood_discrimination_improvement": {
        "description": "Calibrated contact-mode-aware / history-conditioned / hybrid detector evaluated on strictly held-out validation pools (9200..9319) improves OOD vs ID discrimination significantly over frozen B3 baselines without training on eval pools.",
        "thresholds": {
            "task2_overall_transition_auroc_min": 0.75,
            "task2_lowmu_transition_auroc_min": 0.75,
            "task2_overall_episode_auroc_min": 0.80,
            "task2_fpr_at_95tpr_max": 0.65,
            "bootstrap_ci95_lower_min": 0.70,
            "holm_bonferroni_alpha_max": 0.05,
        },
    },
    "U3_conformal_coverage_and_risk_coverage": {
        "description": "Mode-conditioned conformal calibration fitted strictly on fresh calibration ID splits recovers OOD episode coverage continuity while preserving nominal ID coverage (alpha=0.10) and improving Risk-Coverage AURC.",
        "thresholds": {
            "id_episode_coverage_min": 0.88,
            "ood_episode_coverage_min": 0.85,
            "id_ood_coverage_gap_max": 0.05,
            "aurc_relative_reduction_min": 0.25,
            "per_mode_coverage_deviation_max": 0.08,
        },
    },
    "U4_temporal_inference_and_diversity": {
        "description": "Temporal sliding-window residual/physical inference detects non-stationary regimes (RegimeA friction step, RegimeB mass influx) after onset, and B3 ensemble error-correlation diagnostics quantify member redundancy and decorrelation gain.",
        "thresholds": {
            "nonstationary_post_onset_auroc_min": 0.80,
            "spearman_error_uncertainty_min": 0.25,
            "b3_diversity_diagnostics_reported": 1,
        },
    },
    "U5_seed_disjointness_and_artifact_immutability": {
        "description": "Zero seed overlap with all historical pools (0..8849), strict calibration-vs-validation disjointness, 100% SHA-256 immutability of Phase 3.4-3.7.1 checkpoints/archives and Safety Architecture v1.0, and zero unauthorized training.",
        "thresholds": {
            "historical_seed_overlap": 0,
            "calib_val_seed_overlap": 0,
            "immutable_sha256_mismatches": 0,
            "training_permitted_in_spec_phase": 0,
        },
    },
}


def verify_phase37_2_seed_disjointness() -> Dict[str, Any]:
    """
    Verifies that every Phase 3.7.2 seed pool (>=9000) is pairwise disjoint internally,
    strictly >= 9000 (above historical max 8849), and has zero intersection with
    PHASE3_SEED_POOLS, PILOT_SEEDS, and PHASE36_SEED_BLOCKS.
    """
    p3_base = verify_disjoint_seed_pools(extra_pools=PHASE37_2_SEED_POOLS)
    p36_audit = verify_phase36_seed_disjointness()

    historical_seeds = set(range(0, HISTORICAL_MAX_SEED + 1))
    for pool_vals in PHASE3_SEED_POOLS.values():
        historical_seeds.update(int(s) for s in pool_vals)
    historical_seeds.update(int(s) for s in PILOT_SEEDS)
    for pool_vals in PHASE36_SEED_BLOCKS.values():
        historical_seeds.update(int(s) for s in pool_vals)

    calib_seeds: set[int] = set()
    val_seeds: set[int] = set()
    below_floor: List[int] = []
    hist_overlaps: Dict[str, List[int]] = {}

    for name, seeds in PHASE37_2_SEED_POOLS.items():
        s_ints = [int(s) for s in seeds]
        if len(s_ints) != len(set(s_ints)):
            raise AssertionError(f"Duplicate seed inside pool '{name}'")
        bad = [s for s in s_ints if s < PHASE37_2_SEED_FLOOR]
        if bad:
            below_floor.extend(bad)
        ov = sorted(set(s_ints).intersection(historical_seeds))
        if ov:
            hist_overlaps[name] = ov
        if "_calib_" in name:
            calib_seeds.update(s_ints)
        elif "_val_" in name:
            val_seeds.update(s_ints)
        else:
            raise AssertionError(f"Unrecognized split role for pool '{name}'")

    calib_val_overlap = sorted(calib_seeds.intersection(val_seeds))
    if below_floor or hist_overlaps or calib_val_overlap or p3_base["pairwise_overlap_count"] != 0:
        raise AssertionError(
            f"Phase 3.7.2 seed disjointness violation: below_floor={below_floor}, "
            f"hist_overlaps={hist_overlaps}, calib_val_overlap={calib_val_overlap}"
        )

    return {
        "disjoint_verified": 1,
        "historical_max_seed": HISTORICAL_MAX_SEED,
        "phase37_2_seed_floor": PHASE37_2_SEED_FLOOR,
        "phase36_seed_disjoint_verified": int(p36_audit["disjoint_verified"]),
        "total_calib_episodes": len(calib_seeds),
        "total_val_episodes": len(val_seeds),
        "total_phase37_2_episodes": len(calib_seeds) + len(val_seeds),
        "historical_overlap_count": 0,
        "calib_val_overlap_count": 0,
        "below_floor_count": 0,
        "pool_counts": {k: len(v) for k, v in PHASE37_2_SEED_POOLS.items()},
        "pool_ranges": {k: [min(v), max(v)] for k, v in PHASE37_2_SEED_POOLS.items()},
    }


def _create_phase37_2_task2_ood_env(
    pool_name: str, seed: int, index_in_pool: int
) -> Tuple[CompliantPreLiftContactEnv, Dict[str, Any]]:
    """
    Constructs a stratified CompliantPreLift OOD environment for fresh Phase 3.7.2
    calibration (n=60) or validation (n=60) pools matching frozen Phase 3.5 proportions:
    21 OOD-LowMu, 18 OOD-HighMass, 11 OOD-RegimeA-FrictionStep, 10 OOD-RegimeB-MassInflux.
    """
    if index_in_pool < 21:
        mu_val = (0.12, 0.18, 0.22)[index_in_pool % 3]
        m_init = 0.350
        sub = "OOD-LowMu"
        nonstat = "nominal"
    elif index_in_pool < 39:
        k = index_in_pool - 21
        m_init = (0.55, 0.70)[k % 2]
        mu_val = 0.40
        sub = "OOD-HighMass"
        nonstat = "nominal"
    elif index_in_pool < 50:
        mu_val = 0.60
        m_init = 0.350
        sub = "OOD-RegimeA-FrictionStep"
        nonstat = "A"
    else:
        mu_val = 0.60
        m_init = 0.350
        sub = "OOD-RegimeB-MassInflux"
        nonstat = "B"

    env = CompliantPreLiftContactEnv(
        mu_true=mu_val, object_mass=m_init, dt=0.01, seed=int(seed), regime=nonstat
    )
    meta = {
        "pool": pool_name,
        "task": "compliant_prelift",
        "regime": "OOD",
        "sub_stratum": sub,
        "env_class": "CompliantPreLiftContactEnv",
        "dt_s": 0.01,
        "initial_mu_true": float(mu_val),
        "initial_mass_kg": float(m_init),
        "clearance_mm": None,
        "nonstationary_regime": nonstat,
    }
    return env, meta


def _create_phase37_2_env(
    pool_name: str, seed: int, index_in_pool: int
) -> Tuple[Any, Dict[str, Any]]:
    """Creates deterministic Task 1 or Task 2 environment & metadata for a Phase 3.7.2 pool."""
    cfg = PHASE37_2_POOL_CONFIGS[pool_name]
    task = cfg["task"]
    regime = cfg["regime"]

    if task == "compliant_prelift" and regime == "ID":
        env = CompliantPreLiftContactEnv(
            mu_true=0.50, object_mass=0.350, dt=0.01, seed=int(seed), regime="nominal"
        )
        return env, {
            "pool": pool_name,
            "task": "compliant_prelift",
            "regime": "ID",
            "sub_stratum": "ID-Nominal",
            "env_class": "CompliantPreLiftContactEnv",
            "dt_s": 0.01,
            "initial_mu_true": 0.50,
            "initial_mass_kg": 0.350,
            "clearance_mm": None,
            "nonstationary_regime": "nominal",
        }

    if task == "compliant_prelift" and regime == "OOD":
        return _create_phase37_2_task2_ood_env(pool_name, seed, index_in_pool)

    if task == "peg_in_hole":
        n_total = len(PHASE37_2_SEED_POOLS[pool_name])
        n_id = (2 * n_total) // 5  # 24/60 for calib, 16/40 for val
        if index_in_pool < n_id:
            mu_c, clr, sub = 0.50, 0.50, "Peg-ID"
        else:
            mu_c, clr = PEG_OOD_CORNERS[(index_in_pool - n_id) % len(PEG_OOD_CORNERS)]
            sub = "Peg-OOD"
        env = PegInHoleEnv(dt=0.02, clearance=clr, friction_coeff=mu_c, seed=int(seed))
        return env, {
            "pool": pool_name,
            "task": "peg_in_hole",
            "regime": "PegInHole",
            "sub_stratum": sub,
            "env_class": "PegInHoleEnv",
            "dt_s": 0.02,
            "initial_mu_true": float(mu_c),
            "initial_mass_kg": None,
            "clearance_mm": float(clr),
            "nonstationary_regime": "nominal",
        }

    raise ValueError(f"Unsupported Phase 3.7.2 pool '{pool_name}'")


def generate_phase37_2_datasets(
    r002_root: str, horizon: int = 50
) -> Dict[str, Any]:
    """
    Deterministically generates fresh disjoint calibration (9000..9179) and validation
    (9200..9359) trajectory datasets under datasets/phase3_7_2/ with SHA-256 receipts,
    mode histograms, and per-episode manifests. Does not touch any frozen checkpoints.
    """
    seed_audit = verify_phase37_2_seed_disjointness()
    ds_dir = os.path.join(r002_root, PHASE37_2_DATASET_DIR_REL)
    os.makedirs(ds_dir, exist_ok=True)
    runtime_env = get_runtime_reproducibility_metadata()
    sw_rev = str(runtime_env.get("software_revision", "unknown"))

    splits_meta: Dict[str, Any] = {}
    stratum_summary: Dict[str, Dict[str, int]] = {}
    all_episode_records: List[Dict[str, Any]] = []

    for pool_name, cfg in PHASE37_2_POOL_CONFIGS.items():
        seeds = PHASE37_2_SEED_POOLS[pool_name]
        task = cfg["task"]
        episodes: List[Dict[str, Any]] = []
        sub_counts: Dict[str, int] = {}

        for idx, seed in enumerate(seeds):
            env, env_meta = _create_phase37_2_env(pool_name, seed, idx)
            sampler = ContactBoundarySampler(
                task=task,
                seed=int(seed),
                mu=float(env_meta["initial_mu_true"]),
                clearance=float(env_meta["clearance_mm"] or 0.50),
            )
            if task == "peg_in_hole":
                mode = ("insertion", "boundary", "random")[idx % 3]
                traj = sampler.sample_task1_boundary_trajectory(
                    env, horizon=horizon, exploration_mode=mode
                )
            else:
                mode = ("coordinated", "friction_boundary", "random")[idx % 3]
                traj = sampler.sample_task2_boundary_trajectory(
                    env, horizon=horizon, exploration_mode=mode
                )

            sub = env_meta["sub_stratum"]
            sub_counts[sub] = sub_counts.get(sub, 0) + 1
            regime_events = list(getattr(env, "regime_events", []))
            rewards_arr = traj.get("realized_rewards", [0.0] * len(traj["actions"]))
            ep_len = int(len(traj["actions"]))
            init_mode = int(traj["realized_modes"][0]) if ep_len > 0 else 0
            term_reason = str(traj.get("termination_reason", "horizon_reached"))

            ep_entry = {
                "episode_id": f"{pool_name}_ep{idx:03d}_seed{int(seed)}",
                "pool": pool_name,
                "split_role": cfg["split_role"],
                "task": task,
                "condition": pool_name,
                "regime": cfg["regime"],
                "sub_stratum": sub,
                "seed": int(seed),
                "episode_index": idx,
                "strategy": mode,
                "exploration_strategy": mode,
                "num_steps": ep_len,
                "episode_length": ep_len,
                "termination_reason": term_reason,
                "initial_mode": init_mode,
                "dt_s": float(env_meta["dt_s"]),
                "success": bool(term_reason in ("seated", "success")),
                "safety_violated": bool("crush" in term_reason or "safety" in term_reason),
                "stall": bool(term_reason == "stall"),
                "final_progress": float(traj.get("final_progress", 0.0)),
                "realized_return": float(sum(float(r) for r in rewards_arr)),
                "env_config": env_meta,
                "env_meta": env_meta,
                "regime_events": regime_events,
                "software_revision": sw_rev,
                "realized_states": traj["realized_states"],
                "realized_next_states": traj["realized_next_states"],
                "actions": traj["actions"],
                "realized_wrenches": traj["realized_wrenches"],
                "realized_next_wrenches": traj["realized_next_wrenches"],
                "realized_modes": traj["realized_modes"],
                "realized_rewards": rewards_arr,
            }
            episodes.append(ep_entry)
            all_episode_records.append(
                {
                    "pool": pool_name,
                    "split_role": cfg["split_role"],
                    "task": task,
                    "regime": cfg["regime"],
                    "sub_stratum": sub,
                    "seed": int(seed),
                    "episode_index": idx,
                    "strategy": mode,
                    "num_steps": int(len(traj["actions"])),
                    "initial_mu_true": env_meta["initial_mu_true"],
                    "initial_mass_kg": env_meta["initial_mass_kg"],
                    "clearance_mm": env_meta["clearance_mm"],
                    "nonstationary_regime": env_meta["nonstationary_regime"],
                    "regime_events": regime_events,
                    "termination_reason": ep_entry["termination_reason"],
                }
            )

        npz_path = os.path.join(ds_dir, cfg["npz_filename"])
        npz_meta = _serialize_dataset_split_npz(npz_path, task, pool_name, episodes)
        mode_named = {
            MODE_NAMES[m]: int(npz_meta["mode_histogram"].get(m, npz_meta["mode_histogram"].get(str(m), 0)))
            for m in range(NUM_MODES)
        }
        splits_meta[pool_name] = {
            "split_role": cfg["split_role"],
            "task": task,
            "regime": cfg["regime"],
            "npz_filename": cfg["npz_filename"],
            "relative_path": f"datasets/phase3_7_2/{cfg['npz_filename']}",
            "sha256": npz_meta["sha256"],
            "num_episodes": int(npz_meta["num_episodes"]),
            "num_transitions": int(npz_meta["num_transitions"]),
            "seed_range": [int(min(seeds)), int(max(seeds))],
            "seeds": [int(s) for s in seeds],
            "sub_stratum_counts": sub_counts,
            "mode_histogram": npz_meta["mode_histogram"],
            "mode_histogram_named": mode_named,
        }
        stratum_summary[pool_name] = sub_counts

    dataset_manifest = to_json_serializable(
        {
            "manifest_id": "HOROS-PROBE1-R002-PHASE3.7.2-DATASETS-v1.0",
            "horizon_max": int(horizon),
            "runtime_environment": get_runtime_reproducibility_metadata(),
            "seed_pool_disjoint_audit": seed_audit,
            "splits": splits_meta,
            "episode_manifest": all_episode_records,
        }
    )
    ds_man_path = os.path.join(r002_root, PHASE37_2_DATASET_MANIFEST_REL)
    with open(ds_man_path, "w", encoding="utf-8") as f:
        json.dump(dataset_manifest, f, indent=2)
    ds_man_sha256 = _sha256_file(ds_man_path)

    return {
        "dataset_manifest_rel": PHASE37_2_DATASET_MANIFEST_REL.replace("\\", "/"),
        "dataset_manifest_sha256": ds_man_sha256,
        "dataset_manifest": dataset_manifest,
    }


def build_phase37_2_manifest(
    r002_root: str,
    dataset_info: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Constructs and writes manifests/phase37_2_uncertainty_manifest.json with strict
    upstream SHA-256 locks (Phase 3.4-3.7.1 + Safety v1.0), fresh dataset hashes,
    frozen training policy, 5 workstreams (3.7.2-A..E), and U1-U5 acceptance gates.
    """
    p34_ctx = verify_phase34_artifacts_and_load(r002_root)
    source_locks = verify_all_source_sha256s(r002_root, p34_ctx)
    seed_audit = verify_phase37_2_seed_disjointness()

    if dataset_info is None:
        ds_man_path = os.path.join(r002_root, PHASE37_2_DATASET_MANIFEST_REL)
        if not os.path.exists(ds_man_path):
            raise FileNotFoundError(
                f"Phase 3.7.2 dataset manifest missing at {ds_man_path}; run dataset generation first."
            )
        with open(ds_man_path, "r", encoding="utf-8") as f:
            ds_man = json.load(f)
        dataset_info = {
            "dataset_manifest_rel": PHASE37_2_DATASET_MANIFEST_REL.replace("\\", "/"),
            "dataset_manifest_sha256": _sha256_file(ds_man_path),
            "dataset_manifest": ds_man,
        }

    ds_man = dataset_info["dataset_manifest"]
    split_hashes = {
        k: {
            "relative_path": v["relative_path"],
            "sha256": v["sha256"],
            "split_role": v["split_role"],
            "num_episodes": v["num_episodes"],
            "num_transitions": v["num_transitions"],
            "seed_range": v["seed_range"],
        }
        for k, v in ds_man["splits"].items()
    }

    p37_1_locks = {}
    for rel in (
        PHASE37_1_REPORT_JSON_REL,
        PHASE37_1_REPORT_MD_REL,
        os.path.join("src", "integrated", "phase37_1_ood_diagnostics.py"),
    ):
        fpath = os.path.join(r002_root, rel)
        if not os.path.exists(fpath):
            raise FileNotFoundError(f"Required Phase 3.7.1 artifact missing: {fpath}")
        p37_1_locks[rel.replace("\\", "/")] = _sha256_file(fpath)

    manifest_body = {
        "schema_version": "phase3_7_2_uncertainty_protocol_v1",
        "execution_status": "DESIGN_FROZEN_AWAITING_EXECUTION_AUTHORIZATION",
        "program_version": "v1.0-phase3.7.2-spec-frozen",
        "training_permitted": False,
        "candidate_evaluation_executed": False,
        "checkpoint_freeze_policy": (
            "All Phase 3.4 B1-B4 checkpoints, calibration artifacts, Phase 3.5-3.7.1 "
            "archives, and GeometryAwareCBFSafetyFilter (Safety Architecture v1.0) "
            "remain 100% frozen. Zero new model training or candidate evaluation "
            "occurs until explicit Phase 3.7.2 execution authorization."
        ),
        "phase37_1_precondition": {
            "phase37_manifest_sha256": source_locks["phase37_manifest_sha256"],
            "locked_phase37_1_artifacts_sha256": p37_1_locks,
        },
        "locked_phase34_context": {
            "dataset_manifest_sha256": source_locks["dataset_manifest_sha256"],
            "ood_manifest_sha256": source_locks["ood_manifest_sha256"],
            "phase34_training_report_sha256": source_locks["phase34_training_report_sha256"],
            "verified_dataset_sha256s": source_locks["verified_dataset_sha256s"],
            "checkpoint_sha256s": source_locks["checkpoint_sha256s"],
        },
        "locked_phase35_archive_sha256": source_locks["phase35_original_archive_sha256s"],
        "locked_phase35_to_37_archives": source_locks["phase35_to_37_locked_archives"],
        "locked_safety_v1_sha256": source_locks["safety_v1_locked_files"],
        "seed_pool_registry": seed_audit,
        "fresh_phase37_2_datasets": {
            "dataset_manifest_path": dataset_info["dataset_manifest_rel"],
            "dataset_manifest_sha256": dataset_info["dataset_manifest_sha256"],
            "splits": split_hashes,
        },
        "workstreams": PHASE37_2_WORKSTREAMS,
        "acceptance_gates": PHASE37_2_ACCEPTANCE_GATES,
    }

    canonical_bytes = json.dumps(to_json_serializable(manifest_body), sort_keys=True).encode("utf-8")
    manifest_body["manifest_sha256"] = hashlib.sha256(canonical_bytes).hexdigest()

    manifest_path = os.path.join(r002_root, PHASE37_2_MANIFEST_REL)
    os.makedirs(os.path.dirname(manifest_path), exist_ok=True)
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(to_json_serializable(manifest_body), f, indent=2)
    return to_json_serializable(manifest_body)


def verify_phase37_2_readiness(r002_root: str) -> Dict[str, Any]:
    """
    Runs complete pre-execution readiness & governance checks for Phase 3.7.2:
    1. Verifies zero seed overlaps across all historical pools (<=8849) and Phase 3.7.2 pools (>=9000).
    2. Verifies manifests/phase37_2_uncertainty_manifest.json canonical hash & flags.
    3. Verifies every datasets/phase3_7_2/*.npz file & dataset manifest SHA-256 hash.
    4. Verifies 100% SHA-256 immutability across Phase 3.4, 3.5, 3.6, Safety v1.0, and Phase 3.7.1.
    """
    seed_audit = verify_phase37_2_seed_disjointness()
    manifest_path = os.path.join(r002_root, PHASE37_2_MANIFEST_REL)
    if not os.path.exists(manifest_path):
        raise FileNotFoundError(f"Missing Phase 3.7.2 manifest: {manifest_path}")
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    recorded_sha = manifest["manifest_sha256"]
    body = {k: v for k, v in manifest.items() if k != "manifest_sha256"}
    recomputed_sha = hashlib.sha256(
        json.dumps(body, sort_keys=True).encode("utf-8")
    ).hexdigest()
    if recorded_sha != recomputed_sha:
        raise AssertionError(f"Phase 3.7.2 manifest_sha256 mismatch: {recorded_sha} != {recomputed_sha}")

    if manifest["execution_status"] != "DESIGN_FROZEN_AWAITING_EXECUTION_AUTHORIZATION":
        raise AssertionError(f"Unexpected execution_status: {manifest['execution_status']}")
    if bool(manifest["training_permitted"]):
        raise AssertionError("training_permitted must be False/0 before execution authorization")
    if bool(manifest["candidate_evaluation_executed"]):
        raise AssertionError("candidate_evaluation_executed must be False/0 during spec freeze")

    # Verify fresh dataset manifest + split .npz hashes
    ds_info = manifest["fresh_phase37_2_datasets"]
    ds_man_path = os.path.join(r002_root, ds_info["dataset_manifest_path"])
    actual_ds_man_sha = _sha256_file(ds_man_path)
    if actual_ds_man_sha != ds_info["dataset_manifest_sha256"]:
        raise AssertionError("Phase 3.7.2 dataset manifest SHA-256 mismatch")

    verified_splits: Dict[str, str] = {}
    for name, s_meta in ds_info["splits"].items():
        fpath = os.path.join(r002_root, s_meta["relative_path"])
        if not os.path.exists(fpath):
            raise FileNotFoundError(f"Missing Phase 3.7.2 dataset split: {fpath}")
        actual_sha = _sha256_file(fpath)
        if actual_sha != s_meta["sha256"]:
            raise AssertionError(f"Dataset split '{name}' SHA-256 mismatch: {actual_sha} != {s_meta['sha256']}")
        verified_splits[name] = actual_sha

    # Verify all frozen upstream files (Phase 3.4 - Phase 3.7.1 + Safety v1.0)
    p34_ctx = verify_phase34_artifacts_and_load(r002_root)
    source_locks = verify_all_source_sha256s(r002_root, p34_ctx)

    for key_field in ("dataset_manifest_sha256", "ood_manifest_sha256", "phase34_training_report_sha256"):
        if source_locks[key_field] != manifest["locked_phase34_context"][key_field]:
            raise AssertionError(f"Upstream lock mismatch on {key_field}")
    if source_locks["verified_dataset_sha256s"] != manifest["locked_phase34_context"]["verified_dataset_sha256s"]:
        raise AssertionError("Phase 3.4 dataset hash mismatch")
    if source_locks["checkpoint_sha256s"] != manifest["locked_phase34_context"]["checkpoint_sha256s"]:
        raise AssertionError("Phase 3.4 checkpoint hash mismatch")
    if source_locks["phase35_original_archive_sha256s"] != manifest["locked_phase35_archive_sha256"]:
        raise AssertionError("Phase 3.5 original archive hash mismatch")
    if source_locks["safety_v1_locked_files"] != manifest["locked_safety_v1_sha256"]:
        raise AssertionError("Safety Architecture v1.0 hash mismatch")

    for rel, exp_sha in manifest["phase37_1_precondition"]["locked_phase37_1_artifacts_sha256"].items():
        actual_sha = _sha256_file(os.path.join(r002_root, rel))
        if actual_sha != exp_sha:
            raise AssertionError(f"Phase 3.7.1 artifact mutated ({rel}): {actual_sha} != {exp_sha}")

    spec_exists = os.path.exists(os.path.join(r002_root, PHASE37_2_SPEC_REL))

    return {
        "status": "PHASE_3_7_2_READY_DESIGN_FROZEN",
        "training_permitted": False,
        "candidate_evaluation_executed": False,
        "specification_present": spec_exists,
        "manifest_sha256": recorded_sha,
        "manifest_file_sha256": _sha256_file(manifest_path),
        "dataset_manifest_sha256": actual_ds_man_sha,
        "verified_split_sha256s": verified_splits,
        "seed_audit": seed_audit,
        "immutable_sha256_mismatches": 0,
        "workstream_count": len(manifest["workstreams"]),
        "acceptance_gate_count": len(manifest["acceptance_gates"]),
    }
