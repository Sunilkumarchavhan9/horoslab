"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Phase 3.5 — Offline (120 ep) and Closed-Loop (18x25 = 450 ep) Evaluation Engine

Executes the frozen Document 53 Revision 1.1 evaluation protocol using strictly verified,
accepted Phase 3.4 checkpoints and manifests without any retraining, recalibration,
normalization refitting, hyperparameter tuning, or model selection on test episodes:
- Pre-flight SHA-256 verification of archived Phase 3.4 datasets & checkpoints.
- Offline evaluation (120 episodes: 40 CompliantLift ID 3000-3039, 40 OOD 3040-3079,
  40 PegInHole 3080-3119) reusing identical trajectories across M0/M4 x B1/B2/B3/B4.
- Balanced 18-cell closed-loop matrix (2 training x 3 planner stacks B1-B3 x 3 regimes
  x 25 episodes = 450 episodes, C01-C18) recording every episode outcome verbatim.
- Disentangled uncertainty metrics (B2 aleatoric vs B3 epistemic/aleatoric vs B4 conformal).
- Protocol-specified paired statistical comparisons (Wilson 95% CIs, McNemar exact & Edwards
  chi2, Newcombe-Wilson risk difference CIs, paired Wilcoxon, Holm-Bonferroni, effect sizes).
"""

from __future__ import annotations

import copy
import hashlib
import json
import math
import os
import time
from typing import Any, Callable, Dict, List, Optional, Sequence, Tuple

import numpy as np
import torch
from scipy import stats as scipy_stats

from src.contact_modes.contact_mode_definitions import (
    ContactMode,
    MODE_NAMES,
    NUM_MODES,
    classify_contact_mode,
)
from src.coordination.plcea_substitutor import WORKPIECE_MASS_KG, GRAVITY_MPS2, FN_PROTECT_N
from src.environment import (
    CompliantPreLiftContactEnv,
    PegInHoleEnv,
    create_env_from_manifest,
    get_env_dt,
    get_ood_episode_manifest,
    step_env_compatible,
)
from src.integrated.calibration_runner import PHASE3_SEED_POOLS, verify_disjoint_seed_pools
from src.integrated.model_training_runner import load_b3_ensemble_from_members, load_hybrid_checkpoint
from src.integrated.phase34_pipeline import (
    Phase34TrainingPipeline,
    _evaluate_model_multistep_on_episodes,
    _sha256_file,
    get_runtime_reproducibility_metadata,
)
from src.integrated.planner_evaluator import PlannerEvaluator
from src.integrated.safety_evaluator import SafetyEvaluator
from src.integrated.statistical_analysis import (
    HORIZONS,
    compute_multihorizon_rmse,
    compute_peg_distribution,
    compute_wilson_ci,
    format_count_pct,
    to_json_serializable,
)
from src.mining.contact_boundary_sampler import ContactBoundarySampler
from src.selection_aware.counterfactual_rollout import extract_env_state_and_wrench
from src.selection_aware.episode_conformal_engine import EpisodeConformalEngine


PEG_OOD_CORNERS: Tuple[Tuple[float, float], ...] = (
    (0.75, 0.18),
    (0.75, 0.25),
    (0.85, 0.18),
    (0.85, 0.25),
)

ATI_DEFAULT_SIGMA_N = 0.04794723475925743
ATI_DEFAULT_RHO1 = 0.13545156336183484


def load_ati_noise_params(r002_root: str) -> Dict[str, float]:
    """Loads calibrated ATI Nano17 baseline noise parameters from disk."""
    path = os.path.join(r002_root, "calibration", "ati_nano17_10k_baseline.npz")
    if not os.path.exists(path):
        return {"sigma_n": ATI_DEFAULT_SIGMA_N, "rho1": ATI_DEFAULT_RHO1}
    with np.load(path, allow_pickle=False) as data:
        return {
            "sigma_n": float(data["sigma_n"]),
            "sigma_t": float(data["sigma_t"]),
            "rho1": float(data["rho_1_t"]),
        }


def create_phase35_env(regime: str, seed: int) -> Tuple[Any, Dict[str, Any]]:
    """
    Constructs the exact reproducible Document 53 v1.1 environment & sub-stratum metadata
    for both offline (3000-3119) and closed-loop (6000-6224) evaluation pools.
    """
    s = int(seed)
    if regime == "ID":
        env = CompliantPreLiftContactEnv(
            mu_true=0.50, object_mass=0.350, dt=0.01, seed=s, regime="nominal"
        )
        meta = {
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
        return env, meta

    if regime == "OOD":
        if 6100 <= s <= 6124:
            man = get_ood_episode_manifest(s)
            env = create_env_from_manifest(man)
            meta = {
                "task": "compliant_prelift",
                "regime": "OOD",
                "sub_stratum": man["stratum"],
                "env_class": "CompliantPreLiftContactEnv",
                "dt_s": float(man["dt"]),
                "initial_mu_true": float(man["mu_true"]),
                "initial_mass_kg": float(man["object_mass"]),
                "clearance_mm": None,
                "nonstationary_regime": man["regime"],
            }
            return env, meta

        # Offline 40-episode OOD partition (3040-3079): 14 LowMu + 12 HighMass + 7 RegimeA + 7 RegimeB
        if 3040 <= s <= 3053:
            mu_val = (0.12, 0.18, 0.22)[(s - 3040) % 3]
            env = CompliantPreLiftContactEnv(mu_true=mu_val, object_mass=0.350, dt=0.01, seed=s, regime="nominal")
            sub = "OOD-LowMu"
            nonstat = "nominal"
            m_init = 0.350
        elif 3054 <= s <= 3065:
            m_init = (0.55, 0.70)[(s - 3054) % 2]
            mu_val = 0.40
            env = CompliantPreLiftContactEnv(mu_true=mu_val, object_mass=m_init, dt=0.01, seed=s, regime="nominal")
            sub = "OOD-HighMass"
            nonstat = "nominal"
        elif 3066 <= s <= 3072:
            mu_val = 0.60
            m_init = 0.350
            env = CompliantPreLiftContactEnv(mu_true=0.60, object_mass=0.350, dt=0.01, seed=s, regime="A")
            sub = "OOD-RegimeA-FrictionStep"
            nonstat = "A"
        elif 3073 <= s <= 3079:
            mu_val = 0.60
            m_init = 0.350
            env = CompliantPreLiftContactEnv(mu_true=0.60, object_mass=0.350, dt=0.01, seed=s, regime="B")
            sub = "OOD-RegimeB-MassInflux"
            nonstat = "B"
        else:
            raise ValueError(f"Seed {s} outside frozen Phase 3 OOD evaluation pools.")

        return env, {
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

    if regime == "PegInHole":
        is_id = (6200 <= s <= 6209) or (3080 <= s <= 3095)
        if is_id:
            mu_c, clr, sub = 0.50, 0.50, "Peg-ID"
        elif 6210 <= s <= 6224:
            mu_c, clr = PEG_OOD_CORNERS[(s - 6210) % 4]
            sub = "Peg-OOD"
        elif 3096 <= s <= 3119:
            mu_c, clr = PEG_OOD_CORNERS[(s - 3096) % 4]
            sub = "Peg-OOD"
        else:
            raise ValueError(f"Seed {s} outside frozen Phase 3 PegInHole evaluation pools.")

        env = PegInHoleEnv(dt=0.02, clearance=clr, friction_coeff=mu_c, seed=s)
        return env, {
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

    raise ValueError(f"Unsupported Phase 3.5 evaluation regime '{regime}'.")


def verify_phase34_artifacts_and_load(r002_root: str) -> Dict[str, Any]:
    """
    Strictly verifies Phase 3.4 dataset & checkpoint integrity (SHA-256 + disjoint seeds + B3
    5-member parity) and returns loaded frozen B1-B4 models per (task, condition).
    """
    pool_audit = verify_disjoint_seed_pools()
    dataset_manifest_path = os.path.join(r002_root, "manifests", "phase34_dataset_manifest.json")
    ood_manifest_path = os.path.join(r002_root, "manifests", "ood_regime_manifests.json")
    checkpoint_root = os.path.join(r002_root, "checkpoints", "phase3_4")
    train_report_path = os.path.join(checkpoint_root, "phase34_training_report.json")

    for req in (dataset_manifest_path, ood_manifest_path, train_report_path):
        if not os.path.exists(req):
            raise FileNotFoundError(f"Required accepted Phase 3.4 artifact missing: {req}")

    with open(dataset_manifest_path, "r", encoding="utf-8") as f:
        dataset_manifest = json.load(f)
    with open(train_report_path, "r", encoding="utf-8") as f:
        train_report = json.load(f)

    dataset_dir = os.path.join(r002_root, "datasets", "phase3_4")
    verified_datasets: Dict[str, str] = {}
    for split_key, s_info in dataset_manifest["splits"].items():
        p = os.path.join(dataset_dir, s_info["npz_filename"])
        actual_sha = _sha256_file(p)
        if actual_sha != s_info["sha256"]:
            raise RuntimeError(f"Dataset SHA-256 mismatch on {p}: {actual_sha} != {s_info['sha256']}")
        verified_datasets[split_key] = actual_sha

    loaded_models: Dict[str, Dict[str, Any]] = {}
    checkpoint_sha_receipts: Dict[str, Any] = {}

    for task in ("peg_in_hole", "compliant_prelift"):
        loaded_models[task] = {}
        checkpoint_sha_receipts[task] = {}
        for cond in ("M0_passive", "M4_acmm"):
            cond_dir = os.path.join(checkpoint_root, task, cond)
            expected_hashes = train_report["tasks"][task]["conditions"][cond]["scientific_audit"]["artifact_sha256"]

            b1_p = os.path.join(cond_dir, "b1_deterministic.pt")
            b2_p = os.path.join(cond_dir, "b2_probabilistic.pt")
            b3_p = os.path.join(cond_dir, "b3_ensemble.pt")
            b3_m_paths = [os.path.join(cond_dir, f"b3_member_{i}.pt") for i in range(5)]
            b4_p = os.path.join(cond_dir, "b4_conformal_calibration.json")

            for key, p in (("B1", b1_p), ("B2", b2_p), ("B3", b3_p), ("B4", b4_p)):
                actual = _sha256_file(p)
                if actual != expected_hashes[key]:
                    raise RuntimeError(f"Checkpoint SHA-256 mismatch on {p}: {actual} != {expected_hashes[key]}")
            for idx, mp in enumerate(b3_m_paths):
                actual_m = _sha256_file(mp)
                if actual_m != expected_hashes["B3_members"][idx]:
                    raise RuntimeError(f"B3 member checkpoint SHA-256 mismatch on {mp}.")

            b1_model, b1_payload = load_hybrid_checkpoint(b1_p)
            b2_model, _ = load_hybrid_checkpoint(b2_p)
            b3_model, _ = load_hybrid_checkpoint(b3_p)
            b3_sub, _ = load_b3_ensemble_from_members(b3_m_paths, ensemble_checkpoint_path=b3_p)
            b4_model, b4_art = Phase34TrainingPipeline.reconstruct_b4_from_artifacts(b4_p, b1_p)

            cal_aps_q_raw = b4_art.get("aps_calibration", {}).get("aps_quantile")
            if cal_aps_q_raw is None or not math.isfinite(float(cal_aps_q_raw)):
                raise RuntimeError(f"Missing/non-finite calibrated aps_quantile in {b4_p}.")
            cal_aps_q = float(cal_aps_q_raw)
            for m_inst in (b1_model, b2_model, b3_model):
                m_inst.mode_classifier.aps_quantile = cal_aps_q
                validate_aps_quantile_matches_calibrated(m_inst, b4_art, context=f"{task}/{cond}")

            # Verify B3 ensemble == B3 reconstructed from member_0..4 before eval
            s_probe = torch.zeros((2, b1_model.continuous_model.state_dim), dtype=torch.float32)
            a_probe = torch.zeros((2, b1_model.continuous_model.action_dim), dtype=torch.float32)
            with torch.no_grad():
                m_e, epi_e, alea_e = b3_model.predict_with_uncertainty(s_probe, a_probe)
                m_s, epi_s, alea_s = b3_sub.predict_with_uncertainty(s_probe, a_probe)
                max_diff = float(max(torch.max(torch.abs(m_e - m_s)), torch.max(torch.abs(epi_e - epi_s)), torch.max(torch.abs(alea_e - alea_s))).item())
                if max_diff > 1e-6:
                    raise RuntimeError(f"B3 member parity check failed for {task}/{cond}: max_diff={max_diff}")

            train_counts_dict = train_report["tasks"][task]["conditions"][cond]["scientific_audit"][
                "contact_mode_classification_audit"
            ]["train_class_counts"]

            loaded_models[task][cond] = {
                "B1": b1_model,
                "B2": b2_model,
                "B3": b3_model,
                "B4": b4_model,
                "b4_artifact": b4_art,
                "calibrated_aps_quantile": cal_aps_q,
                "train_class_counts": {k: int(v["count"]) for k, v in train_counts_dict.items()},
                "scaler_sha256": hashlib.sha256(
                    json.dumps(b1_payload.get("normalization"), sort_keys=True).encode("utf-8")
                ).hexdigest(),
            }
            checkpoint_sha_receipts[task][cond] = dict(expected_hashes)

    return {
        "disjoint_pool_audit": pool_audit,
        "dataset_manifest_sha256": _sha256_file(dataset_manifest_path),
        "ood_manifest_sha256": _sha256_file(ood_manifest_path),
        "phase34_training_report_sha256": _sha256_file(train_report_path),
        "verified_dataset_sha256s": verified_datasets,
        "checkpoint_sha256s": checkpoint_sha_receipts,
        "models": loaded_models,
    }


def _compute_auroc(scores: np.ndarray, binary_labels: np.ndarray) -> Optional[float]:
    """Computes exact Mann-Whitney / rank-based AUROC; returns None if single-class."""
    s = np.asarray(scores, dtype=np.float64)
    y = np.asarray(binary_labels, dtype=np.int64)
    n_pos = int(np.sum(y == 1))
    n_neg = int(np.sum(y == 0))
    if n_pos == 0 or n_neg == 0:
        return None
    ranks = scipy_stats.rankdata(s, method="average")
    u = float(np.sum(ranks[y == 1])) - n_pos * (n_pos + 1) / 2.0
    return round(u / (n_pos * n_neg), 4)


def _compute_gaussian_ece(
    preds: np.ndarray, targets: np.ndarray, total_var: np.ndarray
) -> Dict[str, Any]:
    """Computes Gaussian z-score empirical coverage calibration error across 0.1..0.9 levels."""
    std = np.sqrt(np.maximum(total_var, 1e-12))
    z_abs = np.abs(targets - preds) / std
    levels = [round(0.1 * i, 1) for i in range(1, 10)]
    curve = []
    abs_gaps = []
    for p in levels:
        z_crit = float(scipy_stats.norm.ppf((1.0 + p) / 2.0))
        emp = float(np.mean(z_abs <= z_crit))
        gap = abs(emp - p)
        abs_gaps.append(gap)
        curve.append({"nominal_p": p, "empirical_p": round(emp, 4), "abs_gap": round(gap, 4)})
    return {"ece": round(float(np.mean(abs_gaps)), 4), "reliability_curve": curve}


def validate_aps_quantile_matches_calibrated(
    hybrid_wm,
    b4_artifact_or_quantile: Any,
    atol: float = 1e-6,
    context: str = "",
) -> float:
    """
    Guardrail ensuring the evaluated model's mode_classifier.aps_quantile strictly
    matches the frozen calibrated APS quantile archived in b4_conformal_calibration.json.
    """
    if isinstance(b4_artifact_or_quantile, dict):
        expected_q = float(b4_artifact_or_quantile["aps_calibration"]["aps_quantile"])
    else:
        expected_q = float(b4_artifact_or_quantile)
    actual_q = float(hybrid_wm.mode_classifier.aps_quantile)
    if not (math.isfinite(actual_q) and math.isfinite(expected_q) and abs(actual_q - expected_q) <= atol):
        raise ValueError(
            f"APS quantile mismatch{' (' + context + ')' if context else ''}: "
            f"model has {actual_q}, calibrated artifact expects {expected_q}."
        )
    return actual_q


def _evaluate_classifier_and_aps(
    hybrid_wm,
    transitions: Sequence[Tuple[np.ndarray, np.ndarray, np.ndarray, int]],
    train_class_counts: Dict[str, int],
    calibrated_aps_quantile: Optional[Any] = None,
) -> Dict[str, Any]:
    """Read-only 7-class evaluation with confusion matrix, present/absent breakdown, and frozen APS."""
    if calibrated_aps_quantile is not None:
        validate_aps_quantile_matches_calibrated(
            hybrid_wm, calibrated_aps_quantile, context="_evaluate_classifier_and_aps"
        )
    s_np = np.asarray([x[0] for x in transitions], dtype=np.float32)
    a_np = np.asarray([x[1] for x in transitions], dtype=np.float32)
    y_true = np.asarray([int(x[3]) for x in transitions], dtype=np.int64)

    hybrid_wm.eval()
    with torch.no_grad():
        s_t = torch.from_numpy(s_np)
        a_t = torch.from_numpy(a_np)
        logits = hybrid_wm.predict_mode_logits(s_t, a_t)
        probs = torch.softmax(logits, dim=-1).numpy()
        s_in, a_in = hybrid_wm._prepare_inputs(s_t, a_t)
        s_in_np, a_in_np = s_in.numpy(), a_in.numpy()

    y_pred = np.argmax(probs, axis=-1).astype(np.int64)
    cm = np.zeros((NUM_MODES, NUM_MODES), dtype=np.int64)
    for t_v, p_v in zip(y_true, y_pred):
        cm[int(t_v), int(p_v)] += 1

    per_class: Dict[str, Any] = {}
    f1_all7: List[float] = []
    f1_present_in_eval: List[float] = []
    f1_trained_and_present: List[float] = []

    for k in range(NUM_MODES):
        tp = int(cm[k, k])
        supp = int(np.sum(cm[k, :]))
        pred_cnt = int(np.sum(cm[:, k]))
        fp = pred_cnt - tp
        fn = supp - tp
        prec = round(tp / pred_cnt, 4) if pred_cnt > 0 else None
        rec = round(tp / supp, 4) if supp > 0 else None
        if supp > 0 and (2 * tp + fp + fn) > 0:
            f1 = round((2.0 * tp) / (2.0 * tp + fp + fn), 4)
        elif supp > 0:
            f1 = 0.0
        else:
            f1 = None

        f1_all7.append(float(f1) if f1 is not None else 0.0)
        if supp > 0 and f1 is not None:
            f1_present_in_eval.append(float(f1))
        tr_supp = int(train_class_counts.get(str(k), 0))
        if tr_supp > 0 and supp > 0 and f1 is not None:
            f1_trained_and_present.append(float(f1))

        per_class[str(k)] = {
            "mode_id": k,
            "mode_name": MODE_NAMES[ContactMode(k)],
            "train_support": tr_supp,
            "absent_in_training": bool(tr_supp == 0),
            "eval_support": supp,
            "predicted_count": pred_cnt,
            "tp": tp,
            "fp": fp,
            "fn": fn,
            "precision": prec,
            "recall": rec,
            "f1": f1,
        }

    # Frozen APS conformal mode-set coverage (threshold loaded verbatim from Phase 3.4)
    aps_q = float(hybrid_wm.mode_classifier.aps_quantile)
    aps_hits = 0
    aps_sizes: List[int] = []
    for i in range(len(y_true)):
        m_set = hybrid_wm.mode_classifier.predict_mode_set(s_in_np[i], a_in_np[i])
        aps_sizes.append(len(m_set))
        if int(y_true[i]) in m_set:
            aps_hits += 1

    aps_ci = compute_wilson_ci(aps_hits, len(y_true))
    return {
        "num_transitions": int(len(y_true)),
        "overall_accuracy": round(float(np.mean(y_true == y_pred)), 4),
        "macro_f1_all7_unbalanced": round(float(np.mean(f1_all7)), 4),
        "macro_f1_present_in_eval": round(float(np.mean(f1_present_in_eval)), 4) if f1_present_in_eval else None,
        "macro_f1_trained_and_present": round(float(np.mean(f1_trained_and_present)), 4) if f1_trained_and_present else None,
        "confusion_matrix_rows_true_cols_pred": cm.tolist(),
        "per_class": per_class,
        "aps_eval": {
            "frozen_aps_quantile": round(aps_q, 6),
            "coverage": round(aps_hits / max(1, len(y_true)), 4),
            "covered_count": int(aps_hits),
            "total_count": int(len(y_true)),
            "coverage_ci_95": [round(aps_ci[0] * 100.0, 2), round(aps_ci[1] * 100.0, 2)],
            "mean_prediction_set_size": round(float(np.mean(aps_sizes)), 4),
        },
    }


def _summarize_continuous_distribution(values: Sequence[float]) -> Dict[str, float]:
    arr = np.asarray(values, dtype=np.float64)
    if len(arr) == 0:
        return {"n": 0, "mean": 0.0, "sd": 0.0, "median": 0.0, "q25": 0.0, "q75": 0.0, "iqr": 0.0}
    q25, med, q75 = np.percentile(arr, [25.0, 50.0, 75.0])
    return {
        "n": int(len(arr)),
        "mean": round(float(np.mean(arr)), 4),
        "sd": round(float(np.std(arr, ddof=1)) if len(arr) > 1 else 0.0, 4),
        "median": round(float(med), 4),
        "q25": round(float(q25), 4),
        "q75": round(float(q75), 4),
        "iqr": round(float(q75 - q25), 4),
    }


def format_exact_pvalue(p_val: float) -> Tuple[float, str]:
    """
    Preserves nonzero exact p-values without 6-decimal rounding to 0.0,
    returning (numeric_value, scientific_notation_str).
    """
    val = float(p_val)
    if not math.isfinite(val) or val < 0.0:
        raise ValueError(f"Invalid p-value: {p_val}")
    numeric = round(val, 6) if val >= 1e-4 else val
    return float(numeric), f"{val:.6e}"


def compute_paired_binary_comparison(
    m4_outcomes: Sequence[bool], m0_outcomes: Sequence[bool], label: str
) -> Dict[str, Any]:
    """Paired McNemar exact + Edwards chi2, Haldane odds ratio, and Newcombe-Wilson 95% RD CI."""
    if len(m4_outcomes) != len(m0_outcomes) or len(m4_outcomes) == 0:
        raise ValueError(f"Paired binary comparison requires equal non-empty arrays for {label}.")
    n = len(m4_outcomes)
    y4 = np.asarray(m4_outcomes, dtype=bool)
    y0 = np.asarray(m0_outcomes, dtype=bool)
    k4, k0 = int(np.sum(y4)), int(np.sum(y0))
    p4, p0 = k4 / n, k0 / n

    both_1 = int(np.sum(y4 & y0))
    m4_only = int(np.sum(y4 & (~y0)))   # b
    m0_only = int(np.sum((~y4) & y0))   # c
    both_0 = int(np.sum((~y4) & (~y0)))

    n_disc = m4_only + m0_only
    if n_disc > 0:
        p_mcnemar_exact = float(scipy_stats.binomtest(m4_only, n_disc, 0.5, alternative="two-sided").pvalue)
        edwards_chi2 = ((abs(m4_only - m0_only) - 1.0) ** 2) / n_disc if abs(m4_only - m0_only) >= 1 else 0.0
    else:
        p_mcnemar_exact = 1.0
        edwards_chi2 = 0.0

    l4, u4 = compute_wilson_ci(k4, n)
    l0, u0 = compute_wilson_ci(k0, n)
    rd = p4 - p0
    rd_lo = rd - math.sqrt((p4 - l4) ** 2 + (u0 - p0) ** 2)
    rd_hi = rd + math.sqrt((u4 - p4) ** 2 + (p0 - l0) ** 2)

    return {
        "metric": label,
        "n_pairs": n,
        "m4": format_count_pct(k4, n),
        "m0": format_count_pct(k0, n),
        "discordant_pairs": {"both_1": both_1, "m4_only_b": m4_only, "m0_only_c": m0_only, "both_0": both_0},
        "risk_difference_m4_minus_m0": round(rd, 4),
        "newcombe_wilson_rd_ci_95_pct": [round(rd_lo * 100.0, 2), round(rd_hi * 100.0, 2)],
        "paired_odds_ratio_haldane": round((m4_only + 0.5) / (m0_only + 0.5), 4),
        "mcnemar_exact_p": format_exact_pvalue(p_mcnemar_exact)[0],
        "mcnemar_exact_p_sci": format_exact_pvalue(p_mcnemar_exact)[1],
        "edwards_chi2": round(float(edwards_chi2), 4),
    }


def compute_paired_continuous_comparison(
    m4_vals: Sequence[float], m0_vals: Sequence[float], label: str
) -> Dict[str, Any]:
    """Paired Wilcoxon signed-rank test, rank-biserial correlation r, and paired Cohen's d_z."""
    if len(m4_vals) != len(m0_vals) or len(m4_vals) == 0:
        raise ValueError(f"Paired continuous comparison requires equal non-empty arrays for {label}.")
    a4 = np.asarray(m4_vals, dtype=np.float64)
    a0 = np.asarray(m0_vals, dtype=np.float64)
    diff = a4 - a0
    sd_diff = float(np.std(diff, ddof=1)) if len(diff) > 1 else 0.0
    dz = (float(np.mean(diff)) / sd_diff) if sd_diff > 1e-12 else 0.0

    nz = diff[diff != 0.0]
    if len(nz) > 0:
        res = scipy_stats.wilcoxon(diff, zero_method="wilcox", alternative="two-sided")
        p_val = float(res.pvalue)
        stat = float(res.statistic)
        ranks = scipy_stats.rankdata(np.abs(nz))
        r_sum = float(np.sum(ranks))
        w_pos = float(np.sum(ranks[nz > 0]))
        w_neg = float(np.sum(ranks[nz < 0]))
        rbc = (w_pos - w_neg) / r_sum if r_sum > 0 else 0.0
    else:
        p_val, stat, rbc = 1.0, 0.0, 0.0

    return {
        "metric": label,
        "n_pairs": int(len(diff)),
        "m4_summary": _summarize_continuous_distribution(a4),
        "m0_summary": _summarize_continuous_distribution(a0),
        "diff_m4_minus_m0_summary": _summarize_continuous_distribution(diff),
        "wilcoxon_statistic": round(stat, 4),
        "wilcoxon_p": format_exact_pvalue(p_val)[0],
        "wilcoxon_p_sci": format_exact_pvalue(p_val)[1],
        "rank_biserial_r": round(float(rbc), 4),
        "cohens_dz": round(float(dz), 4),
    }


def apply_holm_bonferroni(comparisons: List[Dict[str, Any]], p_key: str) -> List[Dict[str, Any]]:
    """Adds Holm-Bonferroni family-wise adjusted p-values across a primary contrast family."""
    m = len(comparisons)
    if m == 0:
        return comparisons
    indexed = sorted(enumerate(comparisons), key=lambda x: float(x[1][p_key]))
    running_max = 0.0
    adjusted = [1.0] * m
    for rank_idx, (orig_idx, item) in enumerate(indexed):
        raw_p = float(item[p_key])
        adj = min(1.0, (m - rank_idx) * raw_p)
        running_max = max(running_max, adj)
        adjusted[orig_idx] = running_max
    for i, item in enumerate(comparisons):
        adj_num, adj_sci = format_exact_pvalue(adjusted[i])
        item[f"{p_key}_holm_adjusted"] = adj_num
        item[f"{p_key}_holm_adjusted_sci"] = adj_sci
    return comparisons


def generate_offline_test_bundles(horizon: int = 50) -> Dict[str, List[Dict[str, Any]]]:
    """
    Deterministically generates the exact 120 frozen offline evaluation episodes:
    - offline_test_id:          40 ep (seeds 3000-3039, CompliantPreLift ID)
    - offline_test_ood:         40 ep (seeds 3040-3079, CompliantPreLift OOD strata)
    - offline_test_peg_in_hole: 40 ep (seeds 3080-3119, PegInHole ID + OOD strata)
    """
    verify_disjoint_seed_pools()
    bundles: Dict[str, List[Dict[str, Any]]] = {}

    pool_specs = (
        ("offline_test_id", "ID", list(PHASE3_SEED_POOLS["offline_test_id"])),
        ("offline_test_ood", "OOD", list(PHASE3_SEED_POOLS["offline_test_ood"])),
        ("offline_test_peg_in_hole", "PegInHole", list(PHASE3_SEED_POOLS["offline_test_peg_in_hole"])),
    )

    for pool_name, regime, seeds in pool_specs:
        eps: List[Dict[str, Any]] = []
        for idx, seed in enumerate(seeds):
            env, env_meta = create_phase35_env(regime=regime, seed=seed)
            t_key = env_meta["task"]
            sampler = ContactBoundarySampler(
                task="peg_in_hole" if t_key == "peg_in_hole" else "compliant_prelift",
                seed=int(seed),
                mu=float(env_meta["initial_mu_true"]),
                clearance=float(env_meta["clearance_mm"] or 0.50),
            )
            if t_key == "peg_in_hole":
                mode = ("insertion", "boundary", "random")[idx % 3]
                traj = sampler.sample_task1_boundary_trajectory(env, horizon=horizon, exploration_mode=mode)
            else:
                mode = ("coordinated", "friction_boundary", "random")[idx % 3]
                traj = sampler.sample_task2_boundary_trajectory(env, horizon=horizon, exploration_mode=mode)

            traj["pool"] = pool_name
            traj["seed"] = int(seed)
            traj["episode_index"] = idx
            traj["exploration_strategy"] = mode
            traj["env_meta"] = env_meta
            traj["regime_events"] = list(getattr(env, "regime_events", []))
            eps.append(traj)
        bundles[pool_name] = eps

    return bundles


def _inject_ati_ar1_bench_noise(
    bundle_episodes: List[Dict[str, Any]],
    sigma_n: float,
    rho1: float,
    scale_mult: float,
    seed: int = 9999,
) -> List[Tuple[np.ndarray, np.ndarray, np.ndarray, int]]:
    """Creates flat Task 2 transitions with deterministic ATI Nano17 AR(1) sensor noise on fn (12:16)."""
    rng = np.random.RandomState(seed)
    sigma_scaled = sigma_n * scale_mult
    innov_std = sigma_scaled * math.sqrt(max(0.0, 1.0 - rho1 ** 2))
    out: List[Tuple[np.ndarray, np.ndarray, np.ndarray, int]] = []
    for ep in bundle_episodes:
        states = np.asarray(ep["realized_states"], dtype=np.float32).copy()
        next_states = np.asarray(ep["realized_next_states"], dtype=np.float32).copy()
        actions = np.asarray(ep["actions"], dtype=np.float32)
        modes = np.asarray(ep["realized_modes"], dtype=np.int64)
        noise = np.zeros(4, dtype=np.float32)
        for t in range(len(actions)):
            noise = (rho1 * noise + rng.normal(0.0, innov_std, size=4)).astype(np.float32)
            mask = states[t, 12:16] > 0.05
            states[t, 12:16] = np.where(mask, np.maximum(0.0, states[t, 12:16] + noise), 0.0)
            out.append((states[t], actions[t], next_states[t], int(modes[t])))
    return out


def _evaluate_frozen_b4_and_conformal_offline(
    b4_model,
    b4_art: Dict[str, Any],
    episodes: List[Dict[str, Any]],
    task: str,
) -> Dict[str, Any]:
    """
    Evaluates Phase 3.4 calibrated B4 scalar L2, Episode CMS-PSACD joint/marginal,
    and MultiHorizon Q matrices strictly on held-out evaluation episodes (zero recalibration).
    """
    transitions = [
        (ep["realized_states"][t], ep["actions"][t], ep["realized_next_states"][t], int(ep["realized_modes"][t]))
        for ep in episodes
        for t in range(len(ep["actions"]))
    ]
    s_arr = np.asarray([x[0] for x in transitions], dtype=np.float32)
    a_arr = np.asarray([x[1] for x in transitions], dtype=np.float32)
    ns_arr = np.asarray([x[2] for x in transitions], dtype=np.float32)
    m_arr = np.asarray([int(x[3]) for x in transitions], dtype=np.int64)

    cov_res = b4_model.evaluate_coverage(s_arr, a_arr, ns_arr, m_arr)
    g_cov = int(cov_res["covered_count"])
    g_tot = int(cov_res["total_count"])
    g_ci = compute_wilson_ci(g_cov, g_tot)

    # Compute held-out transition fallback frequency explicitly
    fb_log = b4_model.stratum_fallback_log
    fb_trans = sum(1 for m in m_arr if bool(fb_log.get(int(m), {}).get("fallback_to_global", True)))
    per_stratum = {}
    for k_str, s_meta in cov_res["per_stratum_coverage"].items():
        tot_k = int(s_meta["total"])
        cov_k = int(s_meta["covered"])
        ci_k = compute_wilson_ci(cov_k, tot_k) if tot_k > 0 else (None, None)
        per_stratum[k_str] = {
            **s_meta,
            "mode_name": MODE_NAMES[ContactMode(int(k_str))],
            "ci_95": [round(ci_k[0] * 100.0, 2), round(ci_k[1] * 100.0, 2)] if tot_k > 0 else None,
        }

    # Evaluate frozen Episode CMS-PSACD joint thresholds on held-out episode rollouts
    joint_q = b4_art["episode_conformal_calibration"]["joint_quantiles"]
    q_s_j = float(joint_q["q_state_joint"])
    q_w_j = float(joint_q["q_wrench_joint"])
    q_m_j = float(joint_q["q_mode_joint"])

    base_model = b4_model.base_model
    ep_s_hits = ep_w_hits = ep_m_hits = ep_joint_hits = 0
    mh_hits = {h: 0 for h in HORIZONS}
    mh_totals = {h: 0 for h in HORIZONS}
    q_mh_global = [float(x) for x in b4_art["multihorizon_quantile_calibration"]["q_global"]]

    for ep in episodes:
        states = np.asarray(ep["realized_states"], dtype=np.float32)
        next_states = np.asarray(ep["realized_next_states"], dtype=np.float32)
        actions = np.asarray(ep["actions"], dtype=np.float32)
        wrenches = np.asarray(ep["realized_next_wrenches"], dtype=np.float32)
        modes = np.asarray(ep["realized_modes"], dtype=np.int64)
        avail = len(actions)
        if avail == 0:
            continue
        roll = base_model.predict_multistep(states[0], actions[:avail], horizon=avail, task=task)
        p_s = np.asarray(roll["states"][:avail], dtype=np.float64)
        p_w = np.asarray(roll["contact_forces"][:avail], dtype=np.float64)
        p_probs = np.asarray(roll["mode_probabilities"][:avail], dtype=np.float64)

        s_err_max = float(np.max(np.linalg.norm(p_s - next_states[:avail], axis=-1)))
        w_err_max = float(np.max(np.linalg.norm(p_w[:, :6] - wrenches[:avail, :6], axis=-1)))
        m_scores = [1.0 - float(p_probs[t, int(modes[t])]) for t in range(avail)]
        m_err_max = float(np.max(m_scores))

        s_ok = s_err_max <= q_s_j
        w_ok = w_err_max <= q_w_j
        m_ok = m_err_max <= q_m_j
        ep_s_hits += int(s_ok)
        ep_w_hits += int(w_ok)
        ep_m_hits += int(m_ok)
        ep_joint_hits += int(s_ok and w_ok and m_ok)

        for idx_h, h in enumerate(HORIZONS):
            if avail >= h:
                mh_totals[h] += 1
                err_h = float(np.linalg.norm(p_s[h - 1] - next_states[h - 1]))
                if err_h <= q_mh_global[idx_h]:
                    mh_hits[h] += 1

    eps_with_id = [{"episode_id": f"{task}_{e['seed']}", **e} for e in episodes]
    conformal_eps, _ = _evaluate_model_multistep_on_episodes(base_model, eps_with_id, task=task, horizons=HORIZONS)
    matched_eng = EpisodeConformalEngine(alpha=0.10, horizons=HORIZONS, min_stratum_samples=29, seed=42)
    matched_eng.calibrated = True
    matched_eng.marginal_calibrated = True
    matched_eng.joint_calibrated = True
    matched_eng.has_infinite_quantiles = False
    matched_eng.n_calib_episodes = int(b4_art.get("num_calibration_episodes", 60))
    matched_eng.calibration_status = "VALID"
    matched_eng.q_state_joint = q_s_j
    matched_eng.q_wrench_joint = q_w_j
    matched_eng.q_mode_joint = q_m_j
    marg_q = b4_art["episode_conformal_calibration"].get("marginal_quantiles", {})
    matched_eng.q_state_marginal = float(marg_q.get("q_state_marginal", q_s_j))
    matched_eng.q_wrench_marginal = float(marg_q.get("q_wrench_marginal", q_w_j))
    matched_eng.q_mode_marginal = float(marg_q.get("q_mode_marginal", q_m_j))
    matched_eval = matched_eng.evaluate_test_episodes(conformal_eps, use_stratified=False)

    n_eps = len(episodes)
    return {
        "architecture_id": "B4",
        "is_conformal_architecture": True,
        "global_coverage": format_count_pct(g_cov, g_tot),
        "mean_interval_radius": cov_res["mean_interval_radius"],
        "mean_l2_error": cov_res["mean_l2_error"],
        "global_quantile": b4_model.global_quantile,
        "test_transition_fallback_count": int(fb_trans),
        "test_transition_fallback_frequency": round(fb_trans / max(1, g_tot), 4),
        "per_stratum_coverage": per_stratum,
        "episode_cms_psacd_heldout": {
            "event_definition": "L2 norm over all rollout steps 1..T_avail with 1-p(y) mode score",
            "frozen_joint_quantiles": joint_q,
            "all_quantiles_finite": bool(all(math.isfinite(x) for x in (q_s_j, q_w_j, q_m_j))),
            "state_joint_cov": format_count_pct(ep_s_hits, n_eps),
            "wrench_joint_cov": format_count_pct(ep_w_hits, n_eps),
            "mode_joint_cov": format_count_pct(ep_m_hits, n_eps),
            "simultaneous_joint_cov": format_count_pct(ep_joint_hits, n_eps),
        },
        "episode_cms_psacd_exact_matched": {
            "event_definition": "EpisodeConformalEngine L_inf over HORIZONS=(1,3,5,10,20) with compute_aps_score",
            "frozen_joint_quantiles": joint_q,
            "joint_coverage": matched_eval["episode_joint_coverage"],
            "marginal_coverage": matched_eval["episode_marginal_coverage"],
        },
        "multihorizon_global_q_heldout": {
            str(h): format_count_pct(mh_hits[h], mh_totals[h]) if mh_totals[h] > 0 else {"count": 0, "total": 0, "rate": None}
            for h in HORIZONS
        },
    }


def evaluate_phase35_offline_suite(
    r002_root: str,
    phase34_ctx: Dict[str, Any],
    horizon: int = 50,
) -> Dict[str, Any]:
    """Executes complete 120-episode Phase 3.5 offline evaluation across both tasks, ID/OOD, M0/M4, B1-B4."""
    bundles = generate_offline_test_bundles(horizon=horizon)
    ati_params = load_ati_noise_params(r002_root)
    loaded_models = phase34_ctx["models"]

    pool_task_map = (
        ("offline_test_id", "compliant_prelift"),
        ("offline_test_ood", "compliant_prelift"),
        ("offline_test_peg_in_hole", "peg_in_hole"),
    )

    pools_output: Dict[str, Any] = {}
    all_seed_check: List[int] = []

    for pool_name, task_key in pool_task_map:
        episodes = bundles[pool_name]
        all_seed_check.extend(int(ep["seed"]) for ep in episodes)
        transitions = [
            (ep["realized_states"][t], ep["actions"][t], ep["realized_next_states"][t], int(ep["realized_modes"][t]))
            for ep in episodes
            for t in range(len(ep["actions"]))
        ]
        s_t = torch.from_numpy(np.asarray([x[0] for x in transitions], dtype=np.float32))
        a_t = torch.from_numpy(np.asarray([x[1] for x in transitions], dtype=np.float32))
        ns_np = np.asarray([x[2] for x in transitions], dtype=np.float32)
        ns_t = torch.from_numpy(ns_np)
        m_np = np.asarray([int(x[3]) for x in transitions], dtype=np.int64)

        # ATI 2x noise variant for CompliantPreLift pools (D3 sensor robustness)
        trans_ati_2x = (
            _inject_ati_ar1_bench_noise(
                episodes, sigma_n=ati_params["sigma_n"], rho1=ati_params["rho1"], scale_mult=2.0, seed=3500 + len(episodes)
            )
            if task_key == "compliant_prelift"
            else None
        )

        # Sub-stratum index map for disaggregated offline reporting
        sub_strata_names = sorted({ep["env_meta"]["sub_stratum"] for ep in episodes})

        cond_results: Dict[str, Any] = {}
        ep_level_1step_rmse: Dict[str, Dict[str, List[float]]] = {"M0_passive": {}, "M4_acmm": {}}
        ep_level_mh_rmse: Dict[str, Dict[str, Dict[int, List[Tuple[int, float]]]]] = {}

        for cond in ("M0_passive", "M4_acmm"):
            cond_pack = loaded_models[task_key][cond]
            arch_out: Dict[str, Any] = {}

            for arch in ("B1", "B2", "B3"):
                wm = cond_pack[arch]
                wm.eval()
                with torch.no_grad():
                    mu_t, epi_t, alea_t = wm.predict_with_uncertainty(s_t, a_t)
                    mu_np = mu_t.numpy()
                    epi_np = torch.clamp(epi_t, min=0.0).numpy()
                    alea_np = torch.clamp(alea_t, min=0.0).numpy()

                if not (np.all(np.isfinite(mu_np)) and np.all(np.isfinite(epi_np)) and np.all(np.isfinite(alea_np))):
                    raise RuntimeError(f"Non-finite offline prediction detected in {pool_name}/{cond}/{arch}.")

                sq_err = (mu_np - ns_np) ** 2
                state_rmse = float(np.sqrt(np.mean(sq_err)))
                w_slice = slice(9, 15) if task_key == "peg_in_hole" else slice(12, 16)
                force_rmse = float(np.sqrt(np.mean((mu_np[:, w_slice] - ns_np[:, w_slice]) ** 2)))
                l2_errs = np.linalg.norm(mu_np - ns_np, axis=-1)
                high_err_label = (l2_errs > float(np.median(l2_errs))).astype(np.int64)

                epi_norms = np.linalg.norm(np.sqrt(epi_np), axis=-1)
                alea_norms = np.linalg.norm(np.sqrt(alea_np), axis=-1)
                tot_var = epi_np + alea_np
                tot_norms = np.linalg.norm(np.sqrt(tot_var), axis=-1)

                phys_nll: Optional[float] = None
                ece_info: Optional[Dict[str, Any]] = None
                if arch in ("B2", "B3"):
                    with torch.no_grad():
                        phys_nll = round(float(wm.compute_nll(s_t, a_t, ns_t).item()), 4)
                    ece_info = _compute_gaussian_ece(mu_np, ns_np, tot_var)

                # Multi-horizon open-loop rollouts reusing realized_next_states cleanly
                pred_trajs: List[np.ndarray] = []
                true_trajs: List[np.ndarray] = []
                ep_1step_rmses: List[float] = []
                ep_mh_rmses: Dict[int, List[Tuple[int, float]]] = {h: [] for h in HORIZONS}
                epi_h: Dict[int, List[float]] = {h: [] for h in HORIZONS}
                alea_h: Dict[int, List[float]] = {h: [] for h in HORIZONS}

                for ep_idx_off, ep in enumerate(episodes):
                    s_ep = np.asarray(ep["realized_states"], dtype=np.float32)
                    ns_ep = np.asarray(ep["realized_next_states"], dtype=np.float32)
                    a_ep = np.asarray(ep["actions"], dtype=np.float32)
                    avail = len(a_ep)
                    roll_h = min(avail, max(HORIZONS))
                    roll = wm.predict_multistep(s_ep[0], a_ep[:roll_h], horizon=roll_h, task=task_key)
                    p_seq = np.asarray(roll["states"], dtype=np.float32)
                    pred_trajs.append(p_seq)
                    true_trajs.append(ns_ep[:roll_h])

                    # Per-episode paired 1-step RMSE
                    with torch.no_grad():
                        m_ep, _, _ = wm.predict_with_uncertainty(torch.from_numpy(s_ep), torch.from_numpy(a_ep))
                        ep_1step_rmses.append(float(np.sqrt(np.mean((m_ep.numpy() - ns_ep) ** 2))))

                    for h in HORIZONS:
                        if roll_h >= h:
                            epi_h[h].append(float(roll["epistemic_uncertainties"][h - 1]))
                            alea_h[h].append(float(roll["aleatoric_uncertainties"][h - 1]))
                            h_rmse = float(np.sqrt(np.mean((p_seq[h - 1] - ns_ep[h - 1]) ** 2)))
                            ep_mh_rmses[h].append((int(ep["seed"]), h_rmse))

                ep_level_1step_rmse[cond][arch] = ep_1step_rmses
                ep_level_mh_rmse.setdefault(cond, {}).setdefault(arch, {})
                ep_level_mh_rmse[cond][arch] = ep_mh_rmses
                mh_res = compute_multihorizon_rmse(pred_trajs, true_trajs, horizons=HORIZONS, task=task_key, detailed=True)

                # Disaggregated sub-stratum 1-step RMSE
                sub_breakdown: Dict[str, Any] = {}
                for sub_name in sub_strata_names:
                    sub_eps = [ep for ep in episodes if ep["env_meta"]["sub_stratum"] == sub_name]
                    s_sub = np.asarray([ep["realized_states"][t] for ep in sub_eps for t in range(len(ep["actions"]))], dtype=np.float32)
                    a_sub = np.asarray([ep["actions"][t] for ep in sub_eps for t in range(len(ep["actions"]))], dtype=np.float32)
                    ns_sub = np.asarray([ep["realized_next_states"][t] for ep in sub_eps for t in range(len(ep["actions"]))], dtype=np.float32)
                    with torch.no_grad():
                        mu_s, epi_s, alea_s = wm.predict_with_uncertainty(torch.from_numpy(s_sub), torch.from_numpy(a_sub))
                    sub_breakdown[sub_name] = {
                        "num_episodes": len(sub_eps),
                        "num_transitions": int(len(s_sub)),
                        "state_rmse": round(float(np.sqrt(np.mean((mu_s.numpy() - ns_sub) ** 2))), 4),
                        "force_rmse": round(float(np.sqrt(np.mean((mu_s.numpy()[:, w_slice] - ns_sub[:, w_slice]) ** 2))), 4),
                        "epistemic_std_mean": round(float(np.mean(np.linalg.norm(np.sqrt(torch.clamp(epi_s, min=0.0).numpy()), axis=-1))), 4),
                        "aleatoric_std_mean": round(float(np.mean(np.linalg.norm(np.sqrt(torch.clamp(alea_s, min=0.0).numpy()), axis=-1))), 4),
                    }

                # D3 ATI 2x noise sensitivity check
                ati_2x_metrics = None
                if trans_ati_2x is not None:
                    s2_t = torch.from_numpy(np.asarray([x[0] for x in trans_ati_2x], dtype=np.float32))
                    a2_t = torch.from_numpy(np.asarray([x[1] for x in trans_ati_2x], dtype=np.float32))
                    ns2_np = np.asarray([x[2] for x in trans_ati_2x], dtype=np.float32)
                    with torch.no_grad():
                        mu2_np = wm.forward(s2_t, a2_t).numpy()
                    ati_2x_metrics = {
                        "state_rmse_ati_2x": round(float(np.sqrt(np.mean((mu2_np - ns2_np) ** 2))), 4),
                        "force_rmse_ati_2x": round(float(np.sqrt(np.mean((mu2_np[:, 12:16] - ns2_np[:, 12:16]) ** 2))), 4),
                    }

                clf_eval = _evaluate_classifier_and_aps(
                    wm,
                    transitions,
                    cond_pack["train_class_counts"],
                    calibrated_aps_quantile=cond_pack["calibrated_aps_quantile"],
                )

                arch_out[arch] = {
                    "architecture_id": arch,
                    "is_conformal_architecture": False,
                    "one_step": {
                        "state_rmse": round(state_rmse, 4),
                        "force_rmse": round(force_rmse, 4),
                        "l2_error_mean": round(float(np.mean(l2_errs)), 4),
                        "gaussian_nll": phys_nll,
                        "gaussian_ece": ece_info,
                        "epistemic_std_mean": round(float(np.mean(epi_norms)), 4),
                        "aleatoric_std_mean": round(float(np.mean(alea_norms)), 4),
                        "error_auroc_total_std": _compute_auroc(tot_norms, high_err_label) if arch in ("B2", "B3") else None,
                        "error_auroc_epistemic_std": _compute_auroc(epi_norms, high_err_label) if arch == "B3" else None,
                    },
                    "multihorizon_rmse": mh_res,
                    "multihorizon_uncertainty": {
                        str(h): {
                            "valid_samples": len(epi_h[h]),
                            "epistemic_mean": round(float(np.mean(epi_h[h])), 4) if epi_h[h] else None,
                            "aleatoric_mean": round(float(np.mean(alea_h[h])), 4) if alea_h[h] else None,
                        }
                        for h in HORIZONS
                    },
                    "sub_stratum_breakdown": sub_breakdown,
                    "ati_2x_noise_robustness": ati_2x_metrics,
                    "contact_mode_and_aps": clf_eval,
                }

            arch_out["B4"] = _evaluate_frozen_b4_and_conformal_offline(
                cond_pack["B4"], cond_pack["b4_artifact"], episodes, task_key
            )
            cond_results[cond] = arch_out

        # Paired M4 vs M0 offline comparisons per architecture B1-B3 (1-step + multi-horizon)
        paired_offline: Dict[str, Any] = {}
        paired_mh_offline: Dict[str, Any] = {}
        for arch in ("B1", "B2", "B3"):
            paired_offline[arch] = compute_paired_continuous_comparison(
                ep_level_1step_rmse["M4_acmm"][arch],
                ep_level_1step_rmse["M0_passive"][arch],
                f"{pool_name}_{arch}_1step_state_rmse",
            )
            mh_cmp = []
            for h in HORIZONS:
                map4 = dict(ep_level_mh_rmse["M4_acmm"][arch][h])
                map0 = dict(ep_level_mh_rmse["M0_passive"][arch][h])
                common_seeds = sorted(set(map4.keys()) & set(map0.keys()))
                if common_seeds:
                    c_res = compute_paired_continuous_comparison(
                        [map4[s] for s in common_seeds],
                        [map0[s] for s in common_seeds],
                        f"{pool_name}_{arch}_H{h}_state_rmse",
                    )
                    c_res["horizon"] = int(h)
                    mh_cmp.append(c_res)
            apply_holm_bonferroni(mh_cmp, "wilcoxon_p")
            paired_mh_offline[arch] = mh_cmp

        pools_output[pool_name] = {
            "pool_name": pool_name,
            "task": task_key,
            "num_episodes": len(episodes),
            "num_transitions": len(transitions),
            "seeds": [int(ep["seed"]) for ep in episodes],
            "seed_range": [int(episodes[0]["seed"]), int(episodes[-1]["seed"])],
            "episode_manifest_summary": [
                {
                    "seed": int(ep["seed"]),
                    "sub_stratum": ep["env_meta"]["sub_stratum"],
                    "initial_mu_true": ep["env_meta"]["initial_mu_true"],
                    "initial_mass_kg": ep["env_meta"]["initial_mass_kg"],
                    "clearance_mm": ep["env_meta"]["clearance_mm"],
                    "exploration_strategy": ep["exploration_strategy"],
                    "episode_length": int(ep["episode_length"]),
                    "termination_reason": ep["termination_reason"],
                    "success": bool(ep["success"]),
                    "safety_violated": bool(ep["safety_violated"]),
                    "final_progress": round(float(ep["final_progress"]), 4),
                }
                for ep in episodes
            ],
            "conditions": cond_results,
            "paired_m4_vs_m0_1step_rmse": paired_offline,
            "paired_m4_vs_m0_multihorizon_rmse": paired_mh_offline,
        }

    # D5 cross-pool OOD/ID ratios & OOD-vs-ID epistemic uncertainty AUROC (Task 2)
    ood_generalization_summary: Dict[str, Any] = {}
    id_eps = bundles["offline_test_id"]
    ood_eps = bundles["offline_test_ood"]
    s_id = torch.from_numpy(np.asarray([ep["realized_states"][t] for ep in id_eps for t in range(len(ep["actions"]))], dtype=np.float32))
    a_id = torch.from_numpy(np.asarray([ep["actions"][t] for ep in id_eps for t in range(len(ep["actions"]))], dtype=np.float32))
    s_ood = torch.from_numpy(np.asarray([ep["realized_states"][t] for ep in ood_eps for t in range(len(ep["actions"]))], dtype=np.float32))
    a_ood = torch.from_numpy(np.asarray([ep["actions"][t] for ep in ood_eps for t in range(len(ep["actions"]))], dtype=np.float32))
    ood_labels = np.concatenate([np.zeros(len(s_id), dtype=np.int64), np.ones(len(s_ood), dtype=np.int64)])

    for cond in ("M0_passive", "M4_acmm"):
        ood_generalization_summary[cond] = {}
        for arch in ("B1", "B2", "B3"):
            r_id = pools_output["offline_test_id"]["conditions"][cond][arch]["one_step"]["state_rmse"]
            r_ood = pools_output["offline_test_ood"]["conditions"][cond][arch]["one_step"]["state_rmse"]
            ratio = round(r_ood / r_id, 4) if r_id > 0 else None
            wm = loaded_models["compliant_prelift"][cond][arch]
            wm.eval()
            with torch.no_grad():
                _, epi_id_t, alea_id_t = wm.predict_with_uncertainty(s_id, a_id)
                _, epi_ood_t, alea_ood_t = wm.predict_with_uncertainty(s_ood, a_ood)
            epi_all = np.concatenate([
                np.linalg.norm(np.sqrt(torch.clamp(epi_id_t, min=0.0).numpy()), axis=-1),
                np.linalg.norm(np.sqrt(torch.clamp(epi_ood_t, min=0.0).numpy()), axis=-1),
            ])
            tot_all = np.concatenate([
                np.linalg.norm(np.sqrt(torch.clamp(epi_id_t + alea_id_t, min=0.0).numpy()), axis=-1),
                np.linalg.norm(np.sqrt(torch.clamp(epi_ood_t + alea_ood_t, min=0.0).numpy()), axis=-1),
            ])
            cov_id = pools_output["offline_test_id"]["conditions"][cond]["B4"]["global_coverage"]["rate"]
            cov_ood = pools_output["offline_test_ood"]["conditions"][cond]["B4"]["global_coverage"]["rate"]
            ood_generalization_summary[cond][arch] = {
                "rmse_id": r_id,
                "rmse_ood": r_ood,
                "rmse_ood_over_id_ratio": ratio,
                "b4_cov_id": cov_id if arch == "B1" else None,
                "b4_cov_ood": cov_ood if arch == "B1" else None,
                "b4_cov_retention_ood_minus_90pct": round(cov_ood - 0.90, 4) if arch == "B1" else None,
                "ood_detection_auroc_total_std": _compute_auroc(tot_all, ood_labels) if arch in ("B2", "B3") else None,
                "ood_detection_auroc_epistemic_std": _compute_auroc(epi_all, ood_labels) if arch == "B3" else None,
            }

    return {
        "stage": "Phase 3.5 Offline Evaluation",
        "total_offline_episodes": len(all_seed_check),
        "unique_offline_seeds": len(set(all_seed_check)),
        "expected_seed_range_check": sorted(all_seed_check) == list(range(3000, 3120)),
        "ati_nano17_params": ati_params,
        "pools": pools_output,
        "task2_id_vs_ood_generalization": ood_generalization_summary,
    }


def _evaluate_closed_loop_cell(
    cell_id: str,
    task: str,
    condition: str,
    arch: str,
    regime: str,
    seeds: List[int],
    hybrid_wm,
    b4_model=None,
    eval_horizon: int = 50,
    seed_offset: int = 42,
    num_candidates: int = 60,
    cem_iterations: int = 2,
    init_std: Optional[Any] = None,
    warm_start: bool = False,
) -> Dict[str, Any]:
    """
    Runs a single closed-loop cell under Document 53 v1.1 (or Phase 3.5.1 corrected Peg-in-Hole
    configuration), recording every episode verbatim (success, failures, drops, safety limits, PEG, latency).
    """
    pe = PlannerEvaluator(
        task=task,
        eval_horizon=eval_horizon,
        plan_horizon=10,
        num_candidates=num_candidates,
        elite_fraction=0.15,
        cem_iterations=cem_iterations,
        seed=seed_offset,
        init_std=init_std,
    )
    safety_eval = SafetyEvaluator(task=task)
    planner, planner_identity, planner_class, resolved_arch, resolved_unc_src = pe._create_planner_for_model(
        hybrid_wm=hybrid_wm, architecture_id=arch, planner_type="auto", uncertainty_beta=1.5, uncertainty_source="auto"
    )

    episode_records: List[Dict[str, Any]] = []
    peg_vals: List[float] = []
    progress_vals: List[float] = []
    act_mags: List[float] = []
    epi_vals: List[float] = []
    alea_vals: List[float] = []
    step_latencies_ms: List[float] = []
    target_a_pred_trajs: List[np.ndarray] = []
    target_a_true_trajs: List[np.ndarray] = []
    b4_trans_cov = 0
    b4_trans_tot = 0

    for ep_idx, ep_seed in enumerate(seeds):
        # Deterministic paired RNG per episode seed so M0 and M4 face identical CEM noise streams
        np.random.seed(seed_offset + int(ep_seed))
        if hasattr(planner, "rng") and planner.rng is not None:
            planner.rng = np.random.RandomState(seed_offset + int(ep_seed))

        env, env_meta = create_phase35_env(regime=regime, seed=int(ep_seed))
        env_dt = get_env_dt(env, task)
        safety_filter = safety_eval.create_safety_filter()
        obs = env.reset()
        prev_obs = obs

        ep_interventions = 0
        ep_has_violation = False
        ep_fn_ge_18 = False
        ep_fn_gt_25 = False
        max_fn_obs = 0.0
        max_peg_f = 0.0
        max_peg_t = 0.0
        ep_peg_vals: List[float] = []
        ep_pred_ret: List[float] = []
        ep_real_ret: List[float] = []
        ep_epi_vals: List[float] = []
        ep_alea_vals: List[float] = []
        ep_pen_vals: List[float] = []
        ep_latencies: List[float] = []
        ep_act_mags: List[float] = []
        step_positions: List[float] = []
        term_reason = "horizon_reached"
        steps_exec = 0
        warm_mean = None

        for step in range(eval_horizon):
            t_step_0 = time.perf_counter()
            s_curr, _ = extract_env_state_and_wrench(obs, task)
            plan_kwargs = {"warm_start_mean": warm_mean} if warm_mean is not None else {}
            best_first_action, plan_info = planner.plan(s_curr, pe.reward_fn, **plan_kwargs)
            raw_cand_seq = plan_info.get("best_trajectory")
            cand_seq = raw_cand_seq
            if cand_seq is None:
                cand_seq = np.repeat(best_first_action[np.newaxis, :], pe.plan_horizon, axis=0)
            if warm_start and raw_cand_seq is not None and len(raw_cand_seq) > 1:
                warm_mean = np.vstack([raw_cand_seq[1:], raw_cand_seq[-1:]])

            pred_ret = float(plan_info.get("best_predicted_return", 0.0))
            if "best_uncertainty_penalty" in plan_info:
                ep_pen_vals.append(float(plan_info["best_uncertainty_penalty"]))

            roll = hybrid_wm.predict_multistep(s_curr, cand_seq, horizon=len(cand_seq), task=task)
            p_states = roll["states"]
            if "epistemic_uncertainties" in roll and len(roll["epistemic_uncertainties"]) > 0:
                v_e = float(roll["epistemic_uncertainties"][0])
                ep_epi_vals.append(v_e)
                epi_vals.append(v_e)
            if "aleatoric_uncertainties" in roll and len(roll["aleatoric_uncertainties"]) > 0:
                v_a = float(roll["aleatoric_uncertainties"][0])
                ep_alea_vals.append(v_a)
                alea_vals.append(v_a)

            # Target A counterfactual clone
            clone_env = copy.deepcopy(env)
            ta_states: List[np.ndarray] = []
            ta_rewards: List[float] = []
            for act in cand_seq:
                c_obs, c_r, c_done, _ = step_env_compatible(
                    clone_env, act, task=task, reward_fn=pe.reward_fn, require_reward=True
                )
                c_s, _ = extract_env_state_and_wrench(c_obs, task)
                ta_states.append(c_s)
                ta_rewards.append(float(c_r))
                if c_done:
                    break
            l_a = len(ta_states)
            if l_a > 0:
                target_a_pred_trajs.append(np.asarray(p_states[:l_a], dtype=np.float32))
                target_a_true_trajs.append(np.asarray(ta_states, dtype=np.float32))
            real_a_ret = float(np.sum(ta_rewards))
            peg_step = pred_ret - real_a_ret
            ep_peg_vals.append(peg_step)
            ep_pred_ret.append(pred_ret)
            ep_real_ret.append(real_a_ret)
            peg_vals.append(peg_step)

            # Safety filter (PredictiveCBFSafetyFilter)
            chosen_act, intervened, _ = safety_filter.filter_action(
                current_state=obs, candidate_action=best_first_action.copy(), task=task
            )
            if intervened:
                ep_interventions += 1

            t_step_ms = (time.perf_counter() - t_step_0) * 1000.0
            ep_latencies.append(t_step_ms)
            step_latencies_ms.append(t_step_ms)
            act_norm = float(np.linalg.norm(chosen_act))
            ep_act_mags.append(act_norm)
            act_mags.append(act_norm)

            prev_obs = obs
            obs, _, done, _ = step_env_compatible(env, chosen_act, task=task, require_reward=False)
            steps_exec += 1
            s_next, _ = extract_env_state_and_wrench(obs, task)
            m_next = int(classify_contact_mode(obs, prev_state=prev_obs, dt=env_dt, task=task))

            # Optional read-only B4 closed-loop 1-step region check on B1 base trajectories
            if b4_model is not None:
                pred_mu, rad = b4_model.predict_region(s_curr, chosen_act, stratum=m_next)
                b4_trans_tot += 1
                if float(np.linalg.norm(s_next - pred_mu)) <= float(rad):
                    b4_trans_cov += 1

            is_viol, _ = safety_eval.check_safety_violation(obs)
            if task == "peg_in_hole":
                w_obs = np.asarray(obs.get("wrench", np.zeros(6)), dtype=float)
                max_peg_f = max(max_peg_f, float(np.linalg.norm(w_obs[:3])))
                max_peg_t = max(max_peg_t, float(np.linalg.norm(w_obs[3:6])))
                if is_viol or getattr(env, "safety_violated", False):
                    ep_has_violation = True
                step_positions.append(float(env.peg_pos[2]))
            else:
                fn_cur = float(np.max(obs.get("finger_fn", np.zeros(4))))
                max_fn_obs = max(max_fn_obs, fn_cur)
                if fn_cur >= FN_PROTECT_N:
                    ep_fn_ge_18 = True
                if fn_cur > safety_eval.max_fingertip_force:
                    ep_fn_gt_25 = True
                if is_viol or getattr(env, "dropped", False) or ep_fn_gt_25:
                    ep_has_violation = True
                step_positions.append(float(env.obj_pos[2]))

            if done:
                if task == "peg_in_hole":
                    if getattr(env, "seated", False):
                        term_reason = "seated"
                    elif getattr(env, "safety_violated", False):
                        term_reason = "safety_violated"
                    elif getattr(env, "jammed", False):
                        term_reason = "jammed"
                    else:
                        term_reason = "terminated_early"
                else:
                    term_reason = "lifted_20mm" if env.obj_pos[2] >= 20.0 else "terminated_early"
                break

        if term_reason == "horizon_reached" and task != "peg_in_hole" and getattr(env, "dropped", False):
            term_reason = "dropped_by_horizon"

        if task == "peg_in_hole":
            is_success = bool(env.seated)
            progress = max(0.0, 15.0 - float(env.peg_pos[2]))
            dropped_flag = False
            reached_20 = None
            final_mu = float(env.friction_coeff)
            final_mass = None
            analytical_feasible = None
        else:
            is_success = bool(env.lifted)
            progress = max(0.0, float(env.obj_pos[2]))
            dropped_flag = bool(env.dropped)
            reached_20 = bool(env.obj_pos[2] >= 20.0)
            final_mu = float(env.mu_true)
            final_mass = float(env.object_mass)
            # Analytical Coulomb preload feasibility at protected cap 18 N/finger: 4 * mu * 18 N >= W
            analytical_feasible = bool((4.0 * float(env_meta["initial_mu_true"]) * FN_PROTECT_N) >= (final_mass * GRAVITY_MPS2))

        is_stalled = False
        if len(step_positions) >= 5:
            if float(np.var(step_positions[-5:])) < 1e-4 and progress < (1.0 if task == "peg_in_hole" else 0.01):
                is_stalled = True

        failure_mode = safety_eval.classify_failure_mode(
            is_success=is_success,
            env_state={
                "jammed": getattr(env, "jammed", False),
                "wedged": getattr(env, "wedged", False),
                "object_dropped": dropped_flag,
                "slip_exceeded": dropped_flag,
                "stalled": is_stalled,
                "safety_violated": ep_has_violation,
            },
            interventions_in_episode=ep_interventions,
            total_steps=steps_exec,
            eval_horizon=eval_horizon,
        )

        progress_vals.append(progress)
        episode_records.append({
            "cell_id": cell_id,
            "task": task,
            "training_condition": condition,
            "architecture_id": resolved_arch,
            "planner_identity": planner_identity,
            "planner_type": planner_class,
            "uncertainty_source": resolved_unc_src,
            "regime": regime,
            "sub_stratum": env_meta["sub_stratum"],
            "seed": int(ep_seed),
            "initial_mu_true": float(env_meta["initial_mu_true"]),
            "final_mu_true": final_mu,
            "initial_mass_kg": env_meta["initial_mass_kg"],
            "final_mass_kg": final_mass,
            "clearance_mm": env_meta["clearance_mm"],
            "nonstationary_regime": env_meta["nonstationary_regime"],
            "nonstationary_events": list(getattr(env, "regime_events", [])),
            "steps_executed": int(steps_exec),
            "is_success": bool(is_success),
            "reached_20mm_target": reached_20,
            "termination_reason": term_reason,
            "failure_mode": failure_mode,
            "goal_progress": round(progress, 4),
            "goal_progress_unit": "mm_depth" if task == "peg_in_hole" else "height_mm",
            "has_safety_violation": bool(ep_has_violation),
            "dropped": dropped_flag,
            "fn_ge_18n": bool(ep_fn_ge_18),
            "fn_gt_25n": bool(ep_fn_gt_25),
            "max_finger_fn_n": round(max_fn_obs, 4) if task != "peg_in_hole" else None,
            "max_peg_force_n": round(max_peg_f, 4) if task == "peg_in_hole" else None,
            "max_peg_torque_nm": round(max_peg_t, 4) if task == "peg_in_hole" else None,
            "analytical_grasp_feasible": analytical_feasible,
            "is_stalled": bool(is_stalled),
            "intervention_count": int(ep_interventions),
            "action_magnitude_mean": round(float(np.mean(ep_act_mags)), 4) if ep_act_mags else 0.0,
            "peg_mean": round(float(np.mean(ep_peg_vals)), 4) if ep_peg_vals else 0.0,
            "peg_raw_pred_return_mean": round(float(np.mean(ep_pred_ret)), 4) if ep_pred_ret else 0.0,
            "peg_realized_a_return_mean": round(float(np.mean(ep_real_ret)), 4) if ep_real_ret else 0.0,
            "epistemic_uncertainty_mean": round(float(np.mean(ep_epi_vals)), 4) if ep_epi_vals else 0.0,
            "aleatoric_uncertainty_mean": round(float(np.mean(ep_alea_vals)), 4) if ep_alea_vals else 0.0,
            "uncertainty_penalty_mean": round(float(np.mean(ep_pen_vals)), 4) if ep_pen_vals else 0.0,
            "step_latency_p50_ms": round(float(np.percentile(ep_latencies, 50.0)), 3) if ep_latencies else 0.0,
            "step_latency_p95_ms": round(float(np.percentile(ep_latencies, 95.0)), 3) if ep_latencies else 0.0,
            "all_finite": True,
        })

    n = len(episode_records)
    succ_cnt = sum(1 for r in episode_records if r["is_success"])
    viol_cnt = sum(1 for r in episode_records if r["has_safety_violation"])
    drop_cnt = sum(1 for r in episode_records if r["dropped"])
    fn18_cnt = sum(1 for r in episode_records if r["fn_ge_18n"])
    stall_cnt = sum(1 for r in episode_records if r["is_stalled"])
    tot_interventions = sum(r["intervention_count"] for r in episode_records)
    tot_steps = sum(r["steps_executed"] for r in episode_records)

    taxonomy_counts = {
        "temporal_truncation": 0,
        "gross_slip": 0,
        "jamming_wedging": 0,
        "safety_intervention_stall": 0,
        "dynamic_crush": 0,
    }
    for r in episode_records:
        fm = r["failure_mode"]
        if fm in taxonomy_counts:
            taxonomy_counts[fm] += 1

    # Disaggregated sub-stratum summary
    sub_summary: Dict[str, Any] = {}
    for sub_name in sorted({r["sub_stratum"] for r in episode_records}):
        sub_recs = [r for r in episode_records if r["sub_stratum"] == sub_name]
        sub_summary[sub_name] = {
            "num_episodes": len(sub_recs),
            "seeds": [r["seed"] for r in sub_recs],
            "task_success": format_count_pct(sum(1 for r in sub_recs if r["is_success"]), len(sub_recs)),
            "safety_violations": format_count_pct(sum(1 for r in sub_recs if r["has_safety_violation"]), len(sub_recs)),
            "dropped": format_count_pct(sum(1 for r in sub_recs if r["dropped"]), len(sub_recs)),
            "goal_progress": _summarize_continuous_distribution([r["goal_progress"] for r in sub_recs]),
        }

    target_a_mh = (
        compute_multihorizon_rmse(target_a_pred_trajs, target_a_true_trajs, horizons=HORIZONS, task=task, detailed=True)
        if target_a_pred_trajs
        else None
    )

    return {
        "cell_id": cell_id,
        "task": task,
        "training_condition": condition,
        "architecture_id": resolved_arch,
        "planner_identity": planner_identity,
        "planner_type": planner_class,
        "uncertainty_source": resolved_unc_src,
        "regime": regime,
        "num_episodes": n,
        "seeds": [int(s) for s in seeds],
        "eval_horizon_steps": eval_horizon,
        "safety_controller": "PredictiveCBFSafetyFilter",
        "task_success": format_count_pct(succ_cnt, n),
        "safety_violations": format_count_pct(viol_cnt, n),
        "dropped_episodes": format_count_pct(drop_cnt, n),
        "fn_ge_18n_episodes": format_count_pct(fn18_cnt, n),
        "stall_rate": format_count_pct(stall_cnt, n),
        "interventions_per_step": format_count_pct(tot_interventions, max(1, tot_steps)),
        "goal_progress_unit": "mm_depth" if task == "peg_in_hole" else "height_mm",
        "goal_progress": _summarize_continuous_distribution(progress_vals),
        "action_magnitude_mean": round(float(np.mean(act_mags)), 4) if act_mags else 0.0,
        "planner_exploitation_gap": _summarize_continuous_distribution(peg_vals),
        "epistemic_uncertainty_mean": round(float(np.mean(epi_vals)), 4) if epi_vals else 0.0,
        "aleatoric_uncertainty_mean": round(float(np.mean(alea_vals)), 4) if alea_vals else 0.0,
        "cpu_step_latency_ms": {
            "p50": round(float(np.percentile(step_latencies_ms, 50.0)), 3) if step_latencies_ms else 0.0,
            "p95": round(float(np.percentile(step_latencies_ms, 95.0)), 3) if step_latencies_ms else 0.0,
        },
        "target_a_multihorizon_rmse": target_a_mh,
        "b4_closed_loop_1step_coverage": (
            format_count_pct(b4_trans_cov, b4_trans_tot) if (b4_model is not None and b4_trans_tot > 0) else None
        ),
        "failure_taxonomy": {k: format_count_pct(v, n) for k, v in taxonomy_counts.items()},
        "sub_stratum_breakdown": sub_summary,
        "episodes": episode_records,
    }


def evaluate_phase35_closed_loop_matrix(
    phase34_ctx: Dict[str, Any],
    eval_horizon: int = 50,
    seed_offset: int = 42,
) -> Dict[str, Any]:
    """Executes all 18 cells (C01-C18 x 25 = 450 closed-loop episodes) and protocol marginals/contrasts."""
    verify_disjoint_seed_pools()
    loaded_models = phase34_ctx["models"]

    cell_specs: Tuple[Tuple[str, str, str, str, str, List[int]], ...] = (
        ("C01", "compliant_prelift", "M0_passive", "B1", "ID", list(PHASE3_SEED_POOLS["closed_loop_id"])),
        ("C02", "compliant_prelift", "M0_passive", "B2", "ID", list(PHASE3_SEED_POOLS["closed_loop_id"])),
        ("C03", "compliant_prelift", "M0_passive", "B3", "ID", list(PHASE3_SEED_POOLS["closed_loop_id"])),
        ("C04", "compliant_prelift", "M4_acmm", "B1", "ID", list(PHASE3_SEED_POOLS["closed_loop_id"])),
        ("C05", "compliant_prelift", "M4_acmm", "B2", "ID", list(PHASE3_SEED_POOLS["closed_loop_id"])),
        ("C06", "compliant_prelift", "M4_acmm", "B3", "ID", list(PHASE3_SEED_POOLS["closed_loop_id"])),
        ("C07", "compliant_prelift", "M0_passive", "B1", "OOD", list(PHASE3_SEED_POOLS["closed_loop_ood"])),
        ("C08", "compliant_prelift", "M0_passive", "B2", "OOD", list(PHASE3_SEED_POOLS["closed_loop_ood"])),
        ("C09", "compliant_prelift", "M0_passive", "B3", "OOD", list(PHASE3_SEED_POOLS["closed_loop_ood"])),
        ("C10", "compliant_prelift", "M4_acmm", "B1", "OOD", list(PHASE3_SEED_POOLS["closed_loop_ood"])),
        ("C11", "compliant_prelift", "M4_acmm", "B2", "OOD", list(PHASE3_SEED_POOLS["closed_loop_ood"])),
        ("C12", "compliant_prelift", "M4_acmm", "B3", "OOD", list(PHASE3_SEED_POOLS["closed_loop_ood"])),
        ("C13", "peg_in_hole", "M0_passive", "B1", "PegInHole", list(PHASE3_SEED_POOLS["closed_loop_peg_in_hole"])),
        ("C14", "peg_in_hole", "M0_passive", "B2", "PegInHole", list(PHASE3_SEED_POOLS["closed_loop_peg_in_hole"])),
        ("C15", "peg_in_hole", "M0_passive", "B3", "PegInHole", list(PHASE3_SEED_POOLS["closed_loop_peg_in_hole"])),
        ("C16", "peg_in_hole", "M4_acmm", "B1", "PegInHole", list(PHASE3_SEED_POOLS["closed_loop_peg_in_hole"])),
        ("C17", "peg_in_hole", "M4_acmm", "B2", "PegInHole", list(PHASE3_SEED_POOLS["closed_loop_peg_in_hole"])),
        ("C18", "peg_in_hole", "M4_acmm", "B3", "PegInHole", list(PHASE3_SEED_POOLS["closed_loop_peg_in_hole"])),
    )

    cells: Dict[str, Any] = {}
    all_episodes: List[Dict[str, Any]] = []
    for cell_id, task, cond, arch, regime, seeds in cell_specs:
        print(f"  [Closed-Loop] {cell_id}: {cond} | {arch} | {regime} (N={len(seeds)})...", flush=True)
        cond_pack = loaded_models[task][cond]
        b4_for_eval = cond_pack["B4"] if arch == "B1" else None
        cell_res = _evaluate_closed_loop_cell(
            cell_id=cell_id,
            task=task,
            condition=cond,
            arch=arch,
            regime=regime,
            seeds=seeds,
            hybrid_wm=cond_pack[arch],
            b4_model=b4_for_eval,
            eval_horizon=eval_horizon,
            seed_offset=seed_offset,
        )
        cells[cell_id] = cell_res
        all_episodes.extend(cell_res["episodes"])

    def _agg_subset(eps: List[Dict[str, Any]], include_progress: bool = True) -> Dict[str, Any]:
        n = len(eps)
        res = {
            "total_episodes": n,
            "task_success": format_count_pct(sum(1 for e in eps if e["is_success"]), n),
            "safety_violations": format_count_pct(sum(1 for e in eps if e["has_safety_violation"]), n),
            "dropped_episodes": format_count_pct(sum(1 for e in eps if e["dropped"]), n),
            "stall_rate": format_count_pct(sum(1 for e in eps if e["is_stalled"]), n),
            "peg_summary": _summarize_continuous_distribution([e["peg_mean"] for e in eps]),
        }
        if include_progress:
            res["goal_progress"] = _summarize_continuous_distribution([e["goal_progress"] for e in eps])
        return res

    marginals = {
        "by_model_regime_N75": {
            f"{cond}__{reg}": _agg_subset([e for e in all_episodes if e["training_condition"] == cond and e["regime"] == reg], include_progress=True)
            for cond in ("M0_passive", "M4_acmm")
            for reg in ("ID", "OOD", "PegInHole")
        },
        "by_planner_regime_N50": {
            f"{arch}__{reg}": _agg_subset([e for e in all_episodes if e["architecture_id"] == arch and e["regime"] == reg], include_progress=True)
            for arch in ("B1", "B2", "B3")
            for reg in ("ID", "OOD", "PegInHole")
        },
        "by_regime_N150": {
            reg: _agg_subset([e for e in all_episodes if e["regime"] == reg], include_progress=True)
            for reg in ("ID", "OOD", "PegInHole")
        },
        "grand_model_N225": {
            cond: _agg_subset([e for e in all_episodes if e["training_condition"] == cond], include_progress=False)
            for cond in ("M0_passive", "M4_acmm")
        },
    }

    # Pre-registered paired M4 vs M0 contrasts across cells, Model x Regime (N=75), and Grand (N=225)
    paired_pairs = (
        ("C04_vs_C01_ID_B1", "C04", "C01"),
        ("C05_vs_C02_ID_B2", "C05", "C02"),
        ("C06_vs_C03_ID_B3", "C06", "C03"),
        ("C10_vs_C07_OOD_B1", "C10", "C07"),
        ("C11_vs_C08_OOD_B2", "C11", "C08"),
        ("C12_vs_C09_OOD_B3", "C12", "C09"),
        ("C16_vs_C13_Peg_B1", "C16", "C13"),
        ("C17_vs_C14_Peg_B2", "C17", "C14"),
        ("C18_vs_C15_Peg_B3", "C18", "C15"),
    )
    cell_binary_succ = []
    cell_binary_viol = []
    cell_cont_prog = []
    cell_cont_peg = []

    for cname, c4, c0 in paired_pairs:
        e4 = cells[c4]["episodes"]
        e0 = cells[c0]["episodes"]
        if [x["seed"] for x in e4] != [x["seed"] for x in e0]:
            raise RuntimeError(f"Paired seed mismatch in {cname}.")
        cell_binary_succ.append(compute_paired_binary_comparison([x["is_success"] for x in e4], [x["is_success"] for x in e0], f"{cname}_success"))
        cell_binary_viol.append(compute_paired_binary_comparison([x["has_safety_violation"] for x in e4], [x["has_safety_violation"] for x in e0], f"{cname}_safety_violation"))
        cell_cont_prog.append(compute_paired_continuous_comparison([x["goal_progress"] for x in e4], [x["goal_progress"] for x in e0], f"{cname}_goal_progress"))
        cell_cont_peg.append(compute_paired_continuous_comparison([x["peg_mean"] for x in e4], [x["peg_mean"] for x in e0], f"{cname}_peg"))

    apply_holm_bonferroni(cell_binary_succ, "mcnemar_exact_p")
    apply_holm_bonferroni(cell_binary_viol, "mcnemar_exact_p")
    apply_holm_bonferroni(cell_cont_prog, "wilcoxon_p")
    apply_holm_bonferroni(cell_cont_peg, "wilcoxon_p")

    regime_binary_succ = []
    regime_cont_prog = []
    for reg in ("ID", "OOD", "PegInHole"):
        e4 = [e for e in all_episodes if e["training_condition"] == "M4_acmm" and e["regime"] == reg]
        e0 = [e for e in all_episodes if e["training_condition"] == "M0_passive" and e["regime"] == reg]
        regime_binary_succ.append(compute_paired_binary_comparison([x["is_success"] for x in e4], [x["is_success"] for x in e0], f"{reg}_M4_vs_M0_N75_success"))
        regime_cont_prog.append(compute_paired_continuous_comparison([x["goal_progress"] for x in e4], [x["goal_progress"] for x in e0], f"{reg}_M4_vs_M0_N75_goal_progress"))
    apply_holm_bonferroni(regime_binary_succ, "mcnemar_exact_p")
    apply_holm_bonferroni(regime_cont_prog, "wilcoxon_p")

    e4_all = [e for e in all_episodes if e["training_condition"] == "M4_acmm"]
    e0_all = [e for e in all_episodes if e["training_condition"] == "M0_passive"]
    grand_m4_vs_m0 = {
        "task_success": compute_paired_binary_comparison([x["is_success"] for x in e4_all], [x["is_success"] for x in e0_all], "Grand_M4_vs_M0_N225_success"),
        "safety_violations": compute_paired_binary_comparison([x["has_safety_violation"] for x in e4_all], [x["has_safety_violation"] for x in e0_all], "Grand_M4_vs_M0_N225_safety_violations"),
        "peg": compute_paired_continuous_comparison([x["peg_mean"] for x in e4_all], [x["peg_mean"] for x in e0_all], "Grand_M4_vs_M0_N225_peg"),
    }

    # Paired B1 vs B2 vs B3 planner comparisons within (Condition x Regime)
    planner_contrasts_succ = []
    planner_contrasts_prog = []
    planner_contrasts_peg = []
    cell_lookup = {
        (c["training_condition"], c["architecture_id"], c["regime"]): c["episodes"]
        for c in cells.values()
    }
    for cond in ("M0_passive", "M4_acmm"):
        for reg in ("ID", "OOD", "PegInHole"):
            for arch_a, arch_b in (("B2", "B1"), ("B3", "B1"), ("B3", "B2")):
                ea = cell_lookup[(cond, arch_a, reg)]
                eb = cell_lookup[(cond, arch_b, reg)]
                lbl = f"{cond}_{reg}_{arch_a}_vs_{arch_b}"
                planner_contrasts_succ.append(compute_paired_binary_comparison([x["is_success"] for x in ea], [x["is_success"] for x in eb], f"{lbl}_success"))
                planner_contrasts_prog.append(compute_paired_continuous_comparison([x["goal_progress"] for x in ea], [x["goal_progress"] for x in eb], f"{lbl}_goal_progress"))
                planner_contrasts_peg.append(compute_paired_continuous_comparison([x["peg_mean"] for x in ea], [x["peg_mean"] for x in eb], f"{lbl}_peg"))
    apply_holm_bonferroni(planner_contrasts_succ, "mcnemar_exact_p")
    apply_holm_bonferroni(planner_contrasts_prog, "wilcoxon_p")
    apply_holm_bonferroni(planner_contrasts_peg, "wilcoxon_p")

    return {
        "stage": "Phase 3.5 Closed-Loop 18x25 Evaluation",
        "num_cells": len(cells),
        "total_closed_loop_episodes": len(all_episodes),
        "cells": cells,
        "marginals": marginals,
        "statistical_comparisons": {
            "cell_paired_success": cell_binary_succ,
            "cell_paired_safety_violations": cell_binary_viol,
            "cell_paired_goal_progress": cell_cont_prog,
            "cell_paired_peg": cell_cont_peg,
            "regime_M4_vs_M0_N75_success": regime_binary_succ,
            "regime_M4_vs_M0_N75_goal_progress": regime_cont_prog,
            "grand_M4_vs_M0_N225": grand_m4_vs_m0,
            "planner_B1_B2_B3_paired_success": planner_contrasts_succ,
            "planner_B1_B2_B3_paired_goal_progress": planner_contrasts_prog,
            "planner_B1_B2_B3_paired_peg": planner_contrasts_peg,
        },
    }


def run_phase35_evaluation(
    r002_root: str,
    repo_root: Optional[str] = None,
    output_dir: Optional[str] = None,
    eval_horizon: int = 50,
    seed_offset: int = 42,
) -> Dict[str, Any]:
    """
    Executes the full 570-episode (120 offline + 450 closed-loop) Document 53 v1.1 evaluation
    and persists strict RFC 8259 JSON receipts under experiments/phase3_5_evaluation/.
    """
    t0 = time.time()
    out_dir = output_dir or os.path.join(r002_root, "experiments", "phase3_5_evaluation")
    os.makedirs(out_dir, exist_ok=True)

    phase34_ctx = verify_phase34_artifacts_and_load(r002_root)
    runtime_meta = get_runtime_reproducibility_metadata(repo_root=repo_root)

    print("[Phase 3.5] Running 120-episode Offline Evaluation (seeds 3000-3119)...", flush=True)
    offline_res = evaluate_phase35_offline_suite(r002_root=r002_root, phase34_ctx=phase34_ctx, horizon=eval_horizon)

    print("[Phase 3.5] Running 450-episode Closed-Loop 18x25 Evaluation (seeds 6000-6224)...", flush=True)
    closed_loop_res = evaluate_phase35_closed_loop_matrix(
        phase34_ctx=phase34_ctx, eval_horizon=eval_horizon, seed_offset=seed_offset
    )

    total_eps = offline_res["total_offline_episodes"] + closed_loop_res["total_closed_loop_episodes"]
    elapsed = round(time.time() - t0, 2)

    offline_path = os.path.join(out_dir, "phase35_offline_120ep_results.json")
    cl_path = os.path.join(out_dir, "phase35_closed_loop_450ep_results.json")
    stats_path = os.path.join(out_dir, "phase35_statistical_comparison.json")
    master_path = os.path.join(out_dir, "phase35_master_report.json")

    stats_doc = {
        "stage": "Phase 3.5 Statistical Comparisons",
        "generated_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "offline_paired_1step_rmse": {
            p_name: p_val["paired_m4_vs_m0_1step_rmse"] for p_name, p_val in offline_res["pools"].items()
        },
        "closed_loop_comparisons": closed_loop_res["statistical_comparisons"],
    }

    # Build compact master report + cell table without duplicating the 450 episode ledger inside master JSON
    compact_cells = {
        cid: {k: v for k, v in cdata.items() if k != "episodes"}
        for cid, cdata in closed_loop_res["cells"].items()
    }
    master = {
        "program": "HOROS PROBE-1 — Research-002",
        "stage": "Phase 3.5 Offline & Closed-Loop Evaluation (Document 53 v1.1)",
        "generated_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total_runtime_seconds": elapsed,
        "runtime_environment": runtime_meta,
        "episode_accounting": {
            "offline_episodes": offline_res["total_offline_episodes"],
            "closed_loop_episodes": closed_loop_res["total_closed_loop_episodes"],
            "total_evaluation_episodes": total_eps,
            "seed_pool_disjoint_verified": bool(phase34_ctx["disjoint_pool_audit"]["disjoint_verified"]),
            "pairwise_overlap_count": int(phase34_ctx["disjoint_pool_audit"]["pairwise_overlap_count"]),
        },
        "phase34_provenance": {
            "dataset_manifest_sha256": phase34_ctx["dataset_manifest_sha256"],
            "ood_manifest_sha256": phase34_ctx["ood_manifest_sha256"],
            "phase34_training_report_sha256": phase34_ctx["phase34_training_report_sha256"],
            "verified_dataset_sha256s": phase34_ctx["verified_dataset_sha256s"],
            "checkpoint_sha256s": phase34_ctx["checkpoint_sha256s"],
        },
        "offline_summary": offline_res,
        "closed_loop_cell_summaries": compact_cells,
        "closed_loop_marginals": closed_loop_res["marginals"],
        "statistical_comparisons": stats_doc,
        "artifact_paths": {
            "offline_120ep": offline_path,
            "closed_loop_450ep": cl_path,
            "statistical_comparison": stats_path,
            "master_report": master_path,
        },
    }

    for p, doc in (
        (offline_path, offline_res),
        (cl_path, closed_loop_res),
        (stats_path, stats_doc),
        (master_path, master),
    ):
        with open(p, "w", encoding="utf-8") as f:
            json.dump(to_json_serializable(doc), f, indent=2, allow_nan=False)

    return master
