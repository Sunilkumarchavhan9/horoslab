"""Phase 3.6 Frozen 1,215-Episode Robustness Validation Campaign Runner (Tracks 3.6.2-3.6.6).

Executes strictly against frozen Phase 3.4 models/calibration artifacts, frozen manifest
``manifests/phase36_validation_manifest.json`` (``sha256: 620f8a7875a00b3e70818d905eda2e971e96044022782cfdc559e94edcebb5e1``),
and accepted Phase 3.5.2 Safety Architecture v1.0 (``GeometryAwareCBFSafetyFilter`` +
``TwoPhasePegInHoleController``), evaluating ``PredictiveCBFSafetyFilter`` strictly in
read-only shadow mode.

Enforces immediate stop-on-failure if Acceptance Gate G1 fails (>35 N / >7 N*m SafetyEvaluator
violation or >40 N / >8 N*m dynamic crush) across Tracks 3.6.2, 3.6.3, or 3.6.4.
"""

from __future__ import annotations

import datetime as dt
import hashlib
import json
import math
import os
import time
from typing import Any, Callable, Dict, List, Optional, Sequence, Tuple

import numpy as np

from src.environment import step_env_compatible
from src.environment.compliant_prelift_env import CompliantPreLiftContactEnv
from src.environment.peg_in_hole_env import PegInHoleEnv
from src.integrated.peginhole_phase352_controller import (
    InsertionPhase,
    TwoPhasePegInHoleController,
    build_metrology_clearance_spec,
    build_planner_for_condition,
)
from src.integrated.phase34_pipeline import get_runtime_reproducibility_metadata
from src.integrated.phase35_closure_addendum import verify_archived_phase35_immutability
from src.integrated.phase35_evaluator import FN_PROTECT_N, GRAVITY_MPS2, verify_phase34_artifacts_and_load
from src.integrated.phase36_validation_protocol import (
    PHASE36_SEED_BLOCKS,
    collect_safety_architecture_v1_hashes,
    one_sided_clopper_pearson_ucb_zero,
    verify_phase36_seed_disjointness,
)
from src.integrated.planner_evaluator import PlannerEvaluator
from src.integrated.safety_evaluator import SafetyEvaluator
from src.integrated.statistical_analysis import to_json_serializable
from src.safety.geometry_cbf_safety_filter import (
    ClearanceMode,
    ClearanceSpecification,
    GeometryAwareCBFSafetyFilter,
    VALIDATED_OOD_MIN_CLEARANCE_MM,
    extract_controller_visible_pih_obs,
)
from src.selection_aware.counterfactual_rollout import extract_env_state_and_wrench

FROZEN_MANIFEST_SHA256 = "620f8a7875a00b3e70818d905eda2e971e96044022782cfdc559e94edcebb5e1"
PIH_EVAL_HORIZON = 50
TASK2_EVAL_HORIZON = 50


def verify_frozen_phase36_manifest(r002_root: str) -> Dict[str, Any]:
    """Load ``manifests/phase36_validation_manifest.json`` and verify its exact SHA-256."""
    manifest_path = os.path.join(r002_root, "manifests", "phase36_validation_manifest.json")
    if not os.path.exists(manifest_path):
        raise FileNotFoundError(f"Frozen Phase 3.6 manifest missing: {manifest_path}")
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)
    body = {k: v for k, v in manifest.items() if k != "manifest_sha256"}
    recomputed = hashlib.sha256(
        json.dumps(to_json_serializable(body), sort_keys=True).encode("utf-8")
    ).hexdigest()
    recorded = manifest.get("manifest_sha256")
    if recomputed != FROZEN_MANIFEST_SHA256 or recorded != FROZEN_MANIFEST_SHA256:
        raise RuntimeError(
            f"Phase 3.6 manifest SHA-256 mismatch: expected={FROZEN_MANIFEST_SHA256}, "
            f"recorded={recorded}, recomputed={recomputed}"
        )
    return manifest


def _summarize_distribution(values: Sequence[float]) -> Dict[str, float]:
    if not values:
        return {"count": 0, "mean": 0.0, "std": 0.0, "p50": 0.0, "p95": 0.0, "p99": 0.0, "max": 0.0}
    arr = np.asarray(values, dtype=np.float64)
    return {
        "count": int(arr.size),
        "mean": round(float(np.mean(arr)), 4),
        "std": round(float(np.std(arr)), 4),
        "p50": round(float(np.percentile(arr, 50)), 4),
        "p95": round(float(np.percentile(arr, 95)), 4),
        "p99": round(float(np.percentile(arr, 99)), 4),
        "max": round(float(np.max(arr)), 4),
    }


def _exact_mcnemar_two_sided_p(n10: int, n01: int) -> float:
    """Exact two-sided binomial sign test p-value for paired McNemar discordant counts."""
    n = int(n10 + n01)
    if n == 0:
        return 1.0
    k = min(int(n10), int(n01))
    cdf_tail = sum(math.comb(n, i) for i in range(k + 1)) / float(2 ** n)
    return round(min(1.0, 2.0 * cdf_tail), 6)


def _write_json_atomic(path: str, payload: Dict[str, Any]) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp_path = f"{path}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(to_json_serializable(payload), f, indent=2)
    os.replace(tmp_path, path)


def _run_single_pih_episode(
    *,
    cell_id: str,
    track: str,
    seed: int,
    friction_coeff: float,
    true_clearance_mm: float,
    wm: Any,
    wm_condition: str,
    arch: str,
    clr_spec: ClearanceSpecification,
    safety_eval: SafetyEvaluator,
    eval_horizon: int = PIH_EVAL_HORIZON,
    seed_offset: int = 42,
    stress_mode: Optional[str] = None,
    keep_step_trace: bool = False,
) -> Dict[str, Any]:
    """Execute one frozen TwoPhasePegInHoleController episode with full safety telemetry."""
    planner, pmeta = build_planner_for_condition(wm, arch, seed_offset=seed_offset)
    np.random.seed(seed_offset + int(seed))
    if hasattr(planner, "rng") and planner.rng is not None:
        planner.rng = np.random.RandomState(seed_offset + int(seed))

    env = PegInHoleEnv(
        dt=0.02,
        clearance=float(true_clearance_mm),
        friction_coeff=float(friction_coeff),
        seed=int(seed),
    )
    geom_filter = GeometryAwareCBFSafetyFilter(clearance_spec=clr_spec, enable_shadow_baseline=True)
    controller = TwoPhasePegInHoleController(wm, planner, geom_filter, clr_spec)

    rng_stress = np.random.RandomState(int(seed) + 50000)
    if stress_mode == "STRESS_A_large_radial_offset":
        theta = float(rng_stress.uniform(0.0, 2.0 * np.pi))
        r0 = float(rng_stress.uniform(2.5, 4.5))
        obs = env.reset(init_pos_offset=np.array([r0 * math.cos(theta), r0 * math.sin(theta)], dtype=np.float64))
        env.peg_pos[2] = float(rng_stress.uniform(2.0, 5.0))
        obs = env._get_obs()
    elif stress_mode == "STRESS_B_high_initial_tilt":
        phi = float(rng_stress.uniform(0.0, 2.0 * np.pi))
        tilt0 = float(rng_stress.uniform(1.2, 2.5))
        yaw0 = float(rng_stress.uniform(-1.0, 1.0))
        obs = env.reset(
            init_rot_offset=np.array([tilt0 * math.cos(phi), tilt0 * math.sin(phi), yaw0], dtype=np.float64)
        )
    elif stress_mode == "STRESS_C_near_rim_contact_acq":
        obs = env.reset()
        env.peg_pos[2] = float(rng_stress.uniform(0.25, 1.0))
        obs = env._get_obs()
    else:
        obs = env.reset()

    init_z_mm = float(env.peg_pos[2])
    init_r_mm = float(np.linalg.norm(env.peg_pos[:2]))
    init_tilt_deg = float(np.linalg.norm(env.peg_rot[:2]))
    controller.reset()

    max_force = 0.0
    max_torque = 0.0
    safety_violated_eval = False
    safety_violated_env = False
    jammed = False
    seated = False
    term_reason = "horizon_reached"
    steps_exec = 0
    in_bore_steps = 0
    wall_penetration_steps = 0
    fail_closed_steps = 0
    impulse_applied = False
    impulse_step: Optional[int] = None
    c_safe_recorded: Optional[float] = None
    phases_visited: List[str] = []
    raw_action_norms: List[float] = []
    safe_action_norms: List[float] = []
    raw_dz_series: List[float] = []
    safe_dz_series: List[float] = []
    step_forces: List[float] = []
    step_torques: List[float] = []
    step_traces: List[Dict[str, Any]] = []
    intervention_trace: List[Dict[str, Any]] = []

    for step in range(int(eval_horizon)):
        if (
            stress_mode == "STRESS_D_mid_insertion_impulse"
            and not impulse_applied
            and float(env.peg_pos[2]) <= -15.0
        ):
            # Apply external disturbance bump inside physical wall clearance while exceeding operational tube
            ang = float(rng_stress.uniform(0.0, 2.0 * np.pi))
            r_bump = min(0.88 * float(true_clearance_mm), 0.16)
            tilt_bump = 0.24
            env.peg_pos[0] = float(r_bump * math.cos(ang))
            env.peg_pos[1] = float(r_bump * math.sin(ang))
            env.peg_rot[0] = float(tilt_bump * math.cos(ang))
            env.peg_rot[1] = float(tilt_bump * math.sin(ang))
            obs = env._get_obs()
            impulse_applied = True
            impulse_step = int(step)

        safe_act, step_meta = controller.select_action(obs)
        c_safe_recorded = float(step_meta.get("c_safe_mm", 0.0))
        phases_visited.append(str(step_meta["phase"]))
        cbf_meta = step_meta["cbf_meta"]
        if cbf_meta.get("fail_closed", False):
            fail_closed_steps += 1

        raw_act = np.asarray(step_meta["raw_planner_action"], dtype=np.float64)
        raw_action_norms.append(float(np.linalg.norm(raw_act)))
        safe_action_norms.append(float(np.linalg.norm(safe_act)))
        raw_dz_series.append(float(raw_act[2]))
        safe_dz_series.append(float(safe_act[2]))

        obs, _, done, info = step_env_compatible(env, safe_act, task="peg_in_hole", require_reward=False)
        steps_exec += 1

        z_now = float(env.peg_pos[2])
        r_now = float(np.linalg.norm(env.peg_pos[:2]))
        tilt_now = float(np.linalg.norm(env.peg_rot[:2]))
        if z_now <= 0.0:
            in_bore_steps += 1
            if r_now > float(env.clearance):
                wall_penetration_steps += 1

        fn = float(np.linalg.norm(obs["wrench"][:3]))
        tn = float(np.linalg.norm(obs["wrench"][3:6]))
        step_forces.append(fn)
        step_torques.append(tn)
        max_force = max(max_force, fn)
        max_torque = max(max_torque, tn)

        step_violated, viol_reason = safety_eval.check_safety_violation(obs)
        if step_violated:
            safety_violated_eval = True
        if info.get("safety_violated", False):
            safety_violated_env = True
        if info.get("jammed", False):
            jammed = True
        if info.get("seated", False):
            seated = True

        step_entry = {
            "step": int(step),
            "phase": str(step_meta["phase"]),
            "z_mm": round(z_now, 4),
            "r_mm": round(r_now, 4),
            "tilt_deg": round(tilt_now, 4),
            "force_n": round(fn, 4),
            "torque_nm": round(tn, 4),
            "raw_dz": round(float(raw_act[2]), 4),
            "safe_dz": round(float(safe_act[2]), 4),
            "cbf_modified": bool(cbf_meta.get("modified", False)),
            "fail_closed": bool(cbf_meta.get("fail_closed", False)),
            "reason": str(cbf_meta.get("reason", "")),
            "shadow_unsafe": bool(cbf_meta.get("shadow_would_pass_unsafe", False)),
            "safety_violated_eval": bool(step_violated),
            "viol_reason": str(viol_reason),
        }
        if keep_step_trace:
            step_traces.append(step_entry)
        elif step_entry["cbf_modified"] or step_entry["shadow_unsafe"] or step_violated or info.get("safety_violated", False):
            if len(intervention_trace) < 12:
                intervention_trace.append(step_entry)

        if done:
            if seated:
                term_reason = "seated"
            elif safety_violated_env:
                term_reason = "dynamic_crush_terminated"
            elif jammed:
                term_reason = "jammed"
            else:
                term_reason = "done_other"
            break

    return {
        "track": track,
        "cell_id": cell_id,
        "seed": int(seed),
        "stress_mode": stress_mode,
        "friction_coeff": float(friction_coeff),
        "true_clearance_mm": float(true_clearance_mm),
        "world_model_condition": wm_condition,
        "architecture": arch,
        "clearance_mode": clr_spec.mode.value,
        "c_hat_mm": clr_spec.c_hat_mm,
        "sigma_c_mm": clr_spec.sigma_c_mm,
        "c_safe_mm": round(float(c_safe_recorded or 0.0), 6),
        "planner_class": pmeta["planner_class"],
        "init_z_mm": round(init_z_mm, 4),
        "init_r_mm": round(init_r_mm, 4),
        "init_tilt_deg": round(init_tilt_deg, 4),
        "steps_executed": int(steps_exec),
        "in_bore_steps": int(in_bore_steps),
        "contact_acquired": bool(in_bore_steps > 0),
        "wall_penetration_steps": int(wall_penetration_steps),
        "final_z_mm": round(float(env.peg_pos[2]), 4),
        "final_radial_err_mm": round(float(np.linalg.norm(env.peg_pos[:2])), 4),
        "final_tilt_deg": round(float(np.linalg.norm(env.peg_rot[:2])), 4),
        "final_phase": controller.phase.value,
        "phases_visited": sorted(set(phases_visited)),
        "alignment_failed": bool(controller.phase == InsertionPhase.ALIGNMENT_FAILED),
        "alignment_failure_reason": controller.alignment_failure_reason,
        "fail_closed_steps": int(fail_closed_steps),
        "impulse_applied": bool(impulse_applied),
        "impulse_step": impulse_step,
        "seated_success": bool(seated),
        "safety_violation": bool(safety_violated_eval or safety_violated_env),
        "safety_evaluator_violation": bool(safety_violated_eval),
        "dynamic_crush_terminated": bool(safety_violated_env),
        "jammed": bool(jammed),
        "termination_reason": term_reason,
        "max_force_n": round(float(max_force), 4),
        "max_torque_nm": round(float(max_torque), 4),
        "mean_force_n": round(float(np.mean(step_forces)) if step_forces else 0.0, 4),
        "mean_torque_nm": round(float(np.mean(step_torques)) if step_torques else 0.0, 4),
        "mean_raw_action_norm": round(float(np.mean(raw_action_norms)) if raw_action_norms else 0.0, 4),
        "mean_safe_action_norm": round(float(np.mean(safe_action_norms)) if safe_action_norms else 0.0, 4),
        "mean_raw_dz_mm": round(float(np.mean(raw_dz_series)) if raw_dz_series else 0.0, 4),
        "mean_safe_dz_mm": round(float(np.mean(safe_dz_series)) if safe_dz_series else 0.0, 4),
        "cbf_modified_steps": int(geom_filter.modified_steps),
        "shadow_would_pass_unsafe_steps": int(geom_filter.shadow_would_pass_unsafe_steps),
        "intervention_sample_steps": intervention_trace,
        "full_step_trace": step_traces if keep_step_trace else None,
    }


def _aggregate_cell_records(cell_records: Sequence[Dict[str, Any]], label: str) -> Dict[str, Any]:
    n = len(cell_records)
    viols = sum(1 for r in cell_records if r["safety_violation"])
    crush = sum(1 for r in cell_records if r["dynamic_crush_terminated"])
    seated = sum(1 for r in cell_records if r["seated_success"])
    contact = sum(1 for r in cell_records if r["contact_acquired"])
    align_fail = sum(1 for r in cell_records if r["alignment_failed"])
    cbf_mod = sum(int(r["cbf_modified_steps"]) for r in cell_records)
    shadow_unsafe = sum(int(r["shadow_would_pass_unsafe_steps"]) for r in cell_records)
    shadow_ep = sum(1 for r in cell_records if r["shadow_would_pass_unsafe_steps"] > 0)
    forces = [float(r["max_force_n"]) for r in cell_records]
    torques = [float(r["max_torque_nm"]) for r in cell_records]
    ucb_95 = round(one_sided_clopper_pearson_ucb_zero(n, 0.95), 6) if (n > 0 and viols == 0) else None
    return {
        "cell_label": label,
        "n_episodes": n,
        "safety_violations": viols,
        "dynamic_crush_terminations": crush,
        "seated_successes": seated,
        "seated_rate": round(seated / n, 4) if n else 0.0,
        "contact_acquired_episodes": contact,
        "contact_acquisition_rate": round(contact / n, 4) if n else 0.0,
        "alignment_failed_episodes": align_fail,
        "total_cbf_modified_steps": cbf_mod,
        "total_shadow_would_pass_unsafe_steps": shadow_unsafe,
        "episodes_with_shadow_unsafe_steps": shadow_ep,
        "max_force_n_distribution": _summarize_distribution(forces),
        "max_torque_nm_distribution": _summarize_distribution(torques),
        "zero_violation_marginal_95pct_ucb": ucb_95,
    }


def _compute_paired_mode_a_vs_mode_b(records: Sequence[Dict[str, Any]]) -> Dict[str, Any]:
    """Compare Mode A vs Mode B on exact paired seeds (M4_acmm, B3, Track 3.6.2)."""
    by_pair: Dict[Tuple[str, int, str], Dict[str, Any]] = {}
    for r in records:
        if r["world_model_condition"] == "M4_acmm" and r["architecture"] == "B3":
            by_pair[(r["cell_id"].split("__")[0], int(r["seed"]), r["clearance_mode"])] = r

    pairs: List[Tuple[Dict[str, Any], Dict[str, Any]]] = []
    keys_a = [(k[0], k[1]) for k in by_pair if k[2] == ClearanceMode.ESTIMATED_CLEARANCE.value]
    for phys, seed in sorted(keys_a):
        rb = by_pair.get((phys, seed, ClearanceMode.UNKNOWN_CLEARANCE.value))
        if rb is not None:
            pairs.append((by_pair[(phys, seed, ClearanceMode.ESTIMATED_CLEARANCE.value)], rb))

    n_pairs = len(pairs)
    a_pass_b_pass = sum(1 for a, b in pairs if a["seated_success"] and b["seated_success"])
    a_pass_b_fail = sum(1 for a, b in pairs if a["seated_success"] and not b["seated_success"])
    a_fail_b_pass = sum(1 for a, b in pairs if not a["seated_success"] and b["seated_success"])
    a_fail_b_fail = sum(1 for a, b in pairs if not a["seated_success"] and not b["seated_success"])

    # Paired force delta (B - A)
    f_diffs = [float(b["max_force_n"] - a["max_force_n"]) for a, b in pairs]
    steps_diffs = [int(b["steps_executed"] - a["steps_executed"]) for a, b in pairs]

    return {
        "n_paired_seeds": n_pairs,
        "independence_note": (
            "Mode A (estimated_clearance) and Mode B (unknown_clearance) share paired seeds 8000-8299; "
            "per statistical review, Mode A (N=300) and Mode B (N=300) marginal risk bounds are kept strictly "
            "separate rather than claiming a combined N=600 independent Clopper-Pearson UCB."
        ),
        "mode_a_marginal_n300_ucb_95_if_zero_viol": round(one_sided_clopper_pearson_ucb_zero(300, 0.95), 6),
        "mode_b_marginal_n300_ucb_95_if_zero_viol": round(one_sided_clopper_pearson_ucb_zero(300, 0.95), 6),
        "contingency_seated": {
            "both_seated": a_pass_b_pass,
            "mode_a_only_seated": a_pass_b_fail,
            "mode_b_only_seated": a_fail_b_pass,
            "neither_seated": a_fail_b_fail,
            "mcnemar_exact_two_sided_p": _exact_mcnemar_two_sided_p(a_pass_b_fail, a_fail_b_pass),
        },
        "paired_max_force_diff_b_minus_a_n": _summarize_distribution(f_diffs),
        "paired_steps_diff_b_minus_a": _summarize_distribution([float(x) for x in steps_diffs]),
    }


def _run_track_365_fault_injection(r002_root: str, models_pih: Dict[str, Any]) -> Dict[str, Any]:
    """Run all 30 deterministic fault-injection scenarios + G5 oracle-leakage invariance audit."""
    seeds = PHASE36_SEED_BLOCKS["track_365_fault_recovery_injection"]
    assert len(seeds) == 30
    safety_eval = SafetyEvaluator(task="peg_in_hole")
    wm = models_pih["M4_acmm"]["B3"]
    wm.eval()

    scenarios: List[Dict[str, Any]] = []
    # Category 1: 10 non-finite pos/vel/rot/wrench injections (seeds 8720..8729)
    fault_specs_cat1 = [
        ("pos", np.array([np.nan, 0.0, 2.0])),
        ("pos", np.array([0.0, np.inf, 2.0])),
        ("vel", np.array([-np.inf, 0.0, 0.0])),
        ("vel", np.array([0.0, 0.0, np.nan])),
        ("rot", np.array([np.nan, 0.0, 0.0])),
        ("rot", np.array([0.0, np.inf, 0.0])),
        ("wrench", np.array([np.nan, 0.0, 0.0, 0.0, 0.0, 0.0])),
        ("wrench", np.array([0.0, 0.0, np.inf, 0.0, 0.0, 0.0])),
        ("pos", np.array([1.0, 2.0])),  # wrong shape
        ("wrench", np.array([0.0, 0.0, 0.0])),  # wrong shape
    ]
    for idx in range(10):
        seed = seeds[idx]
        field_name, bad_val = fault_specs_cat1[idx]
        gf = GeometryAwareCBFSafetyFilter()
        spec = ClearanceSpecification(mode=ClearanceMode.UNKNOWN_CLEARANCE)
        obs = {
            "pos": np.array([0.02, -0.01, 1.5], dtype=np.float64),
            "vel": np.array([0.0, 0.0, -0.5], dtype=np.float64),
            "rot": np.array([0.05, -0.04, 0.0], dtype=np.float64),
            "wrench": np.zeros(6, dtype=np.float64),
            "stratum": 0,
        }
        obs[field_name] = bad_val
        cand = np.array([0.0, 0.0, -4.5, 0.0, 0.0, 0.0], dtype=np.float64)
        safe_act, meta = gf.filter_action(obs, cand, clearance_spec=spec)
        refused = bool(meta.get("fail_closed", False)) and float(safe_act[2]) >= 0.0
        scenarios.append({
            "scenario_index": idx,
            "seed": int(seed),
            "category": "non_finite_pos_vel_rot_wrench",
            "injected_fault": f"{field_name}:{np.asarray(bad_val).tolist()}",
            "fail_closed": bool(meta.get("fail_closed", False)),
            "safe_action": [round(float(x), 4) for x in safe_act],
            "non_descending_safe_hold": bool(float(safe_act[2]) >= 0.0),
            "reason": str(meta.get("reason", "")),
            "passed": refused,
        })

    # Category 2: 10 missing / NaN / negative / below-floor Mode A metrology specs (seeds 8730..8739)
    bad_specs_cat2 = [
        ("mode_a_none_c_hat", ClearanceSpecification(mode=ClearanceMode.ESTIMATED_CLEARANCE, c_hat_mm=None, sigma_c_mm=0.02)),
        ("mode_a_nan_c_hat", ClearanceSpecification(mode=ClearanceMode.ESTIMATED_CLEARANCE, c_hat_mm=float("nan"), sigma_c_mm=0.02)),
        ("mode_a_inf_c_hat", ClearanceSpecification(mode=ClearanceMode.ESTIMATED_CLEARANCE, c_hat_mm=float("inf"), sigma_c_mm=0.02)),
        ("mode_a_neg_sigma", ClearanceSpecification(mode=ClearanceMode.ESTIMATED_CLEARANCE, c_hat_mm=0.25, sigma_c_mm=-0.01)),
        ("mode_a_nan_sigma", ClearanceSpecification(mode=ClearanceMode.ESTIMATED_CLEARANCE, c_hat_mm=0.25, sigma_c_mm=float("nan"))),
        ("mode_a_neg_k", ClearanceSpecification(mode=ClearanceMode.ESTIMATED_CLEARANCE, c_hat_mm=0.25, sigma_c_mm=0.02, k_sigma=-1.0)),
        ("mode_a_lcb_below_floor_004", ClearanceSpecification(mode=ClearanceMode.ESTIMATED_CLEARANCE, c_hat_mm=0.08, sigma_c_mm=0.02, k_sigma=2.0)),
        ("mode_a_lcb_zero", ClearanceSpecification(mode=ClearanceMode.ESTIMATED_CLEARANCE, c_hat_mm=0.05, sigma_c_mm=0.025, k_sigma=2.0)),
        ("mode_a_lcb_negative", ClearanceSpecification(mode=ClearanceMode.ESTIMATED_CLEARANCE, c_hat_mm=0.02, sigma_c_mm=0.03, k_sigma=2.0)),
        ("mode_b_unvalidated_014", ClearanceSpecification(mode=ClearanceMode.UNKNOWN_CLEARANCE, allow_below_validated_domain=False, min_possible_clearance_mm=0.14)),
    ]
    for k, (fault_name, bad_spec) in enumerate(bad_specs_cat2):
        idx = 10 + k
        seed = seeds[idx]
        gf = GeometryAwareCBFSafetyFilter()
        obs = {
            "pos": np.array([0.01, 0.01, 2.0], dtype=np.float64),
            "vel": np.zeros(3, dtype=np.float64),
            "rot": np.array([0.02, 0.02, 0.0], dtype=np.float64),
            "wrench": np.zeros(6, dtype=np.float64),
            "stratum": 0,
        }
        cand = np.array([0.0, 0.0, -5.0, 0.0, 0.0, 0.0], dtype=np.float64)
        safe_act, meta = gf.filter_action(obs, cand, clearance_spec=bad_spec)
        refused = bool(meta.get("fail_closed", False)) and float(safe_act[2]) >= 0.0
        scenarios.append({
            "scenario_index": idx,
            "seed": int(seed),
            "category": "missing_or_narrow_mode_a_metrology",
            "injected_fault": fault_name,
            "fail_closed": bool(meta.get("fail_closed", False)),
            "safe_action": [round(float(x), 4) for x in safe_act],
            "non_descending_safe_hold": bool(float(safe_act[2]) >= 0.0),
            "reason": str(meta.get("reason", "")),
            "passed": refused,
        })

    # Category 3: 10 invalid stratum or WM prediction/uncertainty injections (seeds 8740..8749)
    fault_specs_cat3 = [
        ("stratum_neg", -1, None, None),
        ("stratum_high", 5, None, None),
        ("stratum_str", "invalid", None, None),
        ("stratum_none", None, None, None),
        ("wm_pred_nan", 0, np.array([np.nan, 0.0, 0.0, 0.0, 0.0, 0.0]), None),
        ("wm_pred_inf", 0, np.array([0.0, np.inf, 0.0, 0.0, 0.0, 0.0]), None),
        ("wm_pred_shape", 0, np.array([0.0, 0.0]), None),
        ("wm_std_neg", 0, np.zeros(6), np.array([-0.5, 0.1, 0.1, 0.1, 0.1, 0.1])),
        ("wm_std_nan", 0, np.zeros(6), np.array([0.1, np.nan, 0.1, 0.1, 0.1, 0.1])),
        ("wm_std_shape", 0, np.zeros(6), np.array([0.1, 0.1])),
    ]
    for k, (fault_name, bad_stratum, wm_w, wm_std) in enumerate(fault_specs_cat3):
        idx = 20 + k
        seed = seeds[idx]
        gf = GeometryAwareCBFSafetyFilter()
        spec = ClearanceSpecification(mode=ClearanceMode.UNKNOWN_CLEARANCE)
        obs = {
            "pos": np.array([0.01, 0.01, 2.0], dtype=np.float64),
            "vel": np.zeros(3, dtype=np.float64),
            "rot": np.array([0.02, 0.02, 0.0], dtype=np.float64),
            "wrench": np.zeros(6, dtype=np.float64),
            "stratum": bad_stratum,
        }
        cand = np.array([0.0, 0.0, -5.0, 0.0, 0.0, 0.0], dtype=np.float64)
        safe_act, meta = gf.filter_action(
            obs, cand, clearance_spec=spec, wm_pred_wrench=wm_w, wm_pred_wrench_std=wm_std
        )
        refused = bool(meta.get("fail_closed", False)) and float(safe_act[2]) >= 0.0
        scenarios.append({
            "scenario_index": idx,
            "seed": int(seed),
            "category": "invalid_stratum_or_wm_prediction",
            "injected_fault": fault_name,
            "fail_closed": bool(meta.get("fail_closed", False)),
            "safe_action": [round(float(x), 4) for x in safe_act],
            "non_descending_safe_hold": bool(float(safe_act[2]) >= 0.0),
            "reason": str(meta.get("reason", "")),
            "passed": refused,
        })

    # G5 Oracle-leakage invariance audit across Mode A and Mode B
    oracle_max_diff = 0.0
    for test_seed in (8720, 8735, 8749):
        env_oracle = PegInHoleEnv(dt=0.02, clearance=0.18, friction_coeff=0.85, seed=test_seed)
        obs_a = env_oracle.reset()
        obs_b = copy_and_mutate_oracle(obs_a)
        for mode in (ClearanceMode.ESTIMATED_CLEARANCE, ClearanceMode.UNKNOWN_CLEARANCE):
            spec = build_metrology_clearance_spec(mode, 0.18, test_seed)
            pa, _ = build_planner_for_condition(wm, "B3", seed_offset=42)
            pb, _ = build_planner_for_condition(wm, "B3", seed_offset=42)
            ga = GeometryAwareCBFSafetyFilter(clearance_spec=spec, enable_shadow_baseline=True)
            gb = GeometryAwareCBFSafetyFilter(clearance_spec=spec, enable_shadow_baseline=True)
            ca = TwoPhasePegInHoleController(wm, pa, ga, spec)
            cb = TwoPhasePegInHoleController(wm, pb, gb, spec)
            np.random.seed(42 + test_seed)
            act_a, _ = ca.select_action(extract_controller_visible_pih_obs(obs_a))
            np.random.seed(42 + test_seed)
            act_b, _ = cb.select_action(obs_b)
            oracle_max_diff = max(oracle_max_diff, float(np.max(np.abs(act_a - act_b))))

    passed_count = sum(1 for s in scenarios if s["passed"])
    return {
        "n_scenarios": len(scenarios),
        "passed_scenarios": passed_count,
        "pass_rate": round(passed_count / len(scenarios), 4),
        "g5_oracle_invariance_max_abs_diff": float(oracle_max_diff),
        "g5_oracle_zero_leakage_verified": bool(oracle_max_diff == 0.0),
        "scenarios": scenarios,
    }


def copy_and_mutate_oracle(obs: Dict[str, Any]) -> Dict[str, Any]:
    out = {k: (v.copy() if isinstance(v, np.ndarray) else v) for k, v in obs.items()}
    out["clearance"] = 0.01
    out["friction"] = 99.9
    return out


def _create_task2_env_for_phase36(stratum: str, seed: int) -> Tuple[CompliantPreLiftContactEnv, Dict[str, Any]]:
    idx = int(seed) % 10
    if stratum == "ID-Nominal":
        mu_val, m_init, reg = 0.50, 0.350, "nominal"
    elif stratum == "OOD-LowMu":
        mu_val, m_init, reg = (0.12, 0.18, 0.22)[idx % 3], 0.350, "nominal"
    elif stratum == "OOD-HighMass":
        mu_val, m_init, reg = 0.40, (0.55, 0.70)[idx % 2], "nominal"
    elif stratum == "OOD-RegimeA-FrictionStep":
        mu_val, m_init, reg = 0.60, 0.350, "A"
    elif stratum == "OOD-RegimeB-MassInflux":
        mu_val, m_init, reg = 0.60, 0.350, "B"
    else:
        raise ValueError(f"Unsupported Task 2 stratum '{stratum}'")

    env = CompliantPreLiftContactEnv(
        mu_true=mu_val, object_mass=m_init, dt=0.01, seed=int(seed), regime=reg
    )
    meta = {
        "sub_stratum": stratum,
        "initial_mu_true": float(mu_val),
        "initial_mass_kg": float(m_init),
        "nonstationary_regime": reg,
    }
    return env, meta


def _run_track_366_task2_non_regression(
    manifest: Dict[str, Any], models_t2: Dict[str, Any]
) -> Dict[str, Any]:
    """Run 50 frozen Task 2 non-regression episodes across ID + 4 OOD strata under M4_acmm B3."""
    strata = manifest["tracks"]["3.6.6_task2_non_regression"]["strata"]
    seeds = PHASE36_SEED_BLOCKS["track_366_task2_non_regression"]
    assert len(seeds) == 50 and len(strata) == 5

    pe = PlannerEvaluator(
        task="compliant_prelift",
        eval_horizon=TASK2_EVAL_HORIZON,
        plan_horizon=10,
        num_candidates=60,
        elite_fraction=0.15,
        cem_iterations=2,
        seed=42,
    )
    safety_eval = SafetyEvaluator(task="compliant_prelift")
    wm = models_t2["M4_acmm"]["B3"]
    wm.eval()
    planner, _, planner_cls, _, _ = pe._create_planner_for_model(
        hybrid_wm=wm, architecture_id="B3", planner_type="auto", uncertainty_beta=1.5, uncertainty_source="auto"
    )

    records: List[Dict[str, Any]] = []
    for s_idx, stratum in enumerate(strata):
        stratum_seeds = seeds[s_idx * 10 : (s_idx + 1) * 10]
        for seed in stratum_seeds:
            np.random.seed(42 + int(seed))
            if hasattr(planner, "rng") and planner.rng is not None:
                planner.rng = np.random.RandomState(42 + int(seed))
            env, meta = _create_task2_env_for_phase36(stratum, int(seed))
            safety_filter = safety_eval.create_safety_filter()
            obs = env.reset()
            max_fn = 0.0
            has_viol = False
            interventions = 0
            steps_exec = 0
            for _ in range(TASK2_EVAL_HORIZON):
                s_curr, _ = extract_env_state_and_wrench(obs, "compliant_prelift")
                best_act, _ = planner.plan(s_curr, pe.reward_fn)
                chosen_act, intervened, _ = safety_filter.filter_action(
                    current_state=obs, candidate_action=best_act.copy(), task="compliant_prelift"
                )
                if intervened:
                    interventions += 1
                obs, _, done, _ = step_env_compatible(env, chosen_act, task="compliant_prelift", require_reward=False)
                steps_exec += 1
                fn_cur = float(np.max(obs.get("finger_fn", np.zeros(4))))
                max_fn = max(max_fn, fn_cur)
                step_viol, _ = safety_eval.check_safety_violation(obs)
                if step_viol or fn_cur > safety_eval.max_fingertip_force or getattr(env, "dropped", False):
                    has_viol = True
                if done:
                    break
            records.append({
                "seed": int(seed),
                "sub_stratum": stratum,
                "initial_mu_true": meta["initial_mu_true"],
                "initial_mass_kg": meta["initial_mass_kg"],
                "final_mu_true": round(float(env.mu_true), 4),
                "final_mass_kg": round(float(env.object_mass), 4),
                "is_success": bool(env.lifted),
                "dropped": bool(env.dropped),
                "max_finger_fn_n": round(max_fn, 4),
                "safety_violation": bool(has_viol),
                "interventions": int(interventions),
                "steps_executed": int(steps_exec),
                "progress_mm": round(max(0.0, float(env.obj_pos[2])), 4),
            })

    by_stratum: Dict[str, Any] = {}
    for stratum in strata:
        sub = [r for r in records if r["sub_stratum"] == stratum]
        by_stratum[stratum] = {
            "n_episodes": len(sub),
            "success_count": sum(1 for r in sub if r["is_success"]),
            "success_rate": round(sum(1 for r in sub if r["is_success"]) / len(sub), 4),
            "dropped_count": sum(1 for r in sub if r["dropped"]),
            "safety_violations": sum(1 for r in sub if r["safety_violation"]),
            "force_gt_25n_count": sum(1 for r in sub if r["max_finger_fn_n"] > 25.0),
            "mean_progress_mm": round(float(np.mean([r["progress_mm"] for r in sub])), 4),
        }

    return {
        "architecture": "M4_acmm_B3",
        "planner_class": planner_cls,
        "n_episodes": len(records),
        "overall_success_rate": round(sum(1 for r in records if r["is_success"]) / len(records), 4),
        "total_drops": sum(1 for r in records if r["dropped"]),
        "total_safety_violations": sum(1 for r in records if r["safety_violation"]),
        "force_gt_25n_episodes": sum(1 for r in records if r["max_finger_fn_n"] > 25.0),
        "by_stratum": by_stratum,
        "episodes": records,
    }


def _evaluate_acceptance_gates(
    t362_summary: Dict[str, Any],
    t363_summary: Dict[str, Any],
    t364_summary: Dict[str, Any],
    t365_summary: Dict[str, Any],
    t366_summary: Dict[str, Any],
    immutability_ok: bool,
    g1_halted: bool,
) -> Dict[str, Any]:
    g1_viol = (
        int(t362_summary["total_safety_violations"])
        + int(t363_summary["total_safety_violations"])
        + int(t364_summary["total_safety_violations"])
    )
    g1_pass = (not g1_halted) and (g1_viol == 0)

    # G2: valid-domain M4_acmm across Track 3.6.2 + Track 3.6.3 unseen interpolation
    m4_cells = list(t362_summary["m4_valid_domain_cells"].values()) + list(
        t363_summary["unseen_interpolation_cells"].values()
    )
    min_seated_rate = min(c["seated_rate"] for c in m4_cells) if m4_cells else 0.0
    min_contact_rate = min(c["contact_acquisition_rate"] for c in m4_cells) if m4_cells else 0.0
    total_m4_n = sum(c["n_episodes"] for c in m4_cells)
    total_m4_seated = sum(c["seated_successes"] for c in m4_cells)
    total_m4_contact = sum(c["contact_acquired_episodes"] for c in m4_cells)
    g2_pass = (min_seated_rate >= 0.90) and (min_contact_rate >= 0.95)

    # G3: 100% refusal on proactive below-domain clearance (0.14 Mode B) & Track 3.6.5 faults + 0 viol across all boundary cells
    proactive_cell = t363_summary["boundary_cells"].get("BND_below018_proactive_refuse", {})
    proactive_refusal_ok = (
        proactive_cell.get("alignment_failed_episodes", 0) == proactive_cell.get("n_episodes", -1)
        and proactive_cell.get("contact_acquired_episodes", 1) == 0
        and proactive_cell.get("safety_violations", 1) == 0
    )
    bnd_viol_zero = all(c["safety_violations"] == 0 for c in t363_summary["boundary_cells"].values())
    g3_pass = (
        proactive_refusal_ok
        and bnd_viol_zero
        and t365_summary["passed_scenarios"] == t365_summary["n_scenarios"]
    )

    # G4: Track 3.6.4 zero crush + zero SafetyEvaluator violation
    g4_pass = (
        t364_summary["total_dynamic_crush_terminations"] == 0
        and t364_summary["total_safety_violations"] == 0
    )

    # G5: Zero oracle leakage + shadow baseline read-only
    g5_pass = bool(t365_summary["g5_oracle_zero_leakage_verified"])

    # G6: SHA-256 immutability + Task 2 non-regression (0 force >25N; ID=100% success)
    id_t2 = t366_summary["by_stratum"].get("ID-Nominal", {})
    g6_pass = (
        bool(immutability_ok)
        and id_t2.get("success_rate", 0.0) == 1.0
        and t366_summary.get("force_gt_25n_episodes", 1) == 0
    )

    return {
        "G1_zero_dynamic_crush_and_force_violations": {
            "passed": g1_pass,
            "total_violations": g1_viol,
            "g1_halted": g1_halted,
        },
        "G2_non_degenerate_contact_acquisition_and_seating": {
            "passed": g2_pass,
            "m4_valid_domain_total_n": total_m4_n,
            "m4_valid_domain_pooled_seated_rate": round(total_m4_seated / total_m4_n, 4) if total_m4_n else 0.0,
            "m4_valid_domain_pooled_contact_rate": round(total_m4_contact / total_m4_n, 4) if total_m4_n else 0.0,
            "worst_cell_seated_rate": round(min_seated_rate, 4),
            "worst_cell_contact_rate": round(min_contact_rate, 4),
        },
        "G3_below_domain_and_fault_refusal": {
            "passed": g3_pass,
            "proactive_014_refusal_ok": proactive_refusal_ok,
            "boundary_cells_zero_violations": bnd_viol_zero,
            "track_365_passed": t365_summary["passed_scenarios"],
            "track_365_total": t365_summary["n_scenarios"],
        },
        "G4_pose_tilt_and_impulse_safety": {
            "passed": g4_pass,
            "dynamic_crush_terminations": t364_summary["total_dynamic_crush_terminations"],
            "safety_violations": t364_summary["total_safety_violations"],
        },
        "G5_zero_oracle_leakage_and_shadow_only_baseline": {
            "passed": g5_pass,
            "oracle_max_abs_diff": t365_summary["g5_oracle_invariance_max_abs_diff"],
            "shadow_baseline_only": True,
        },
        "G6_immutable_checkpoints_and_task2_non_regression": {
            "passed": g6_pass,
            "sha256_immutability_verified": bool(immutability_ok),
            "task2_id_success_rate": id_t2.get("success_rate", 0.0),
            "task2_force_gt_25n_episodes": t366_summary.get("force_gt_25n_episodes", -1),
        },
        "all_six_gates_passed": bool(g1_pass and g2_pass and g3_pass and g4_pass and g5_pass and g6_pass),
    }


def run_phase36_validation_campaign(
    r002_root: str,
    progress_callback: Optional[Callable[[str], None]] = None,
) -> Dict[str, Any]:
    """Execute the complete frozen 1,215-episode Phase 3.6 robustness validation campaign."""
    t_start = time.perf_counter()
    out_dir = os.path.join(r002_root, "experiments", "phase3_6_robustness_validation")
    os.makedirs(out_dir, exist_ok=True)
    ckpt_path = os.path.join(out_dir, "phase36_progress_checkpoint.json")
    results_path = os.path.join(out_dir, "phase36_validation_results.json")

    def _log(msg: str) -> None:
        if progress_callback is not None:
            progress_callback(msg)

    # Pre-flight integrity & immutability lock check
    manifest = verify_frozen_phase36_manifest(r002_root)
    seed_audit = verify_phase36_seed_disjointness()
    if not seed_audit["disjoint_verified"]:
        raise RuntimeError("Phase 3.6 seed pools failed disjointness check.")
    artifacts = verify_phase34_artifacts_and_load(r002_root)
    eval_dir_p35 = os.path.join(r002_root, "experiments", "phase3_5_evaluation")
    pre_phase35_imm = verify_archived_phase35_immutability(eval_dir_p35)
    pre_v1_hashes = collect_safety_architecture_v1_hashes(r002_root)
    if pre_v1_hashes != manifest["frozen_safety_v1_and_baseline_sha256"]:
        raise RuntimeError("Pre-run Safety Architecture v1.0 hashes drifted from frozen manifest!")

    models_pih = artifacts["models"]["peg_in_hole"]
    models_t2 = artifacts["models"]["compliant_prelift"]
    for cond_dict in (models_pih, models_t2):
        for arch_dict in cond_dict.values():
            for mdl in arch_dict.values():
                if hasattr(mdl, "eval"):
                    mdl.eval()

    safety_eval = SafetyEvaluator(task="peg_in_hole")
    g1_halted = False
    g1_failure_details: Optional[Dict[str, Any]] = None

    # ---- Track 3.6.2: Primary Physical Envelope (775 episodes) ----
    t362_records: List[Dict[str, Any]] = []
    t362_cells_summary: Dict[str, Any] = {}
    m4_valid_cells: Dict[str, Any] = {}
    m0_cells: Dict[str, Any] = {}

    for cell_idx, cell in enumerate(manifest["tracks"]["3.6.2_primary_physical_envelope"]):
        phys = cell["physical_condition"]
        mu = float(cell["friction_coeff"])
        clr = float(cell["clearance_mm"])
        cond = cell["world_model_condition"]
        arch = cell["architecture"]
        clr_mode = ClearanceMode(cell["clearance_mode"])
        cell_key = f"{phys}__{cond}_{arch}__{clr_mode.value}"
        s0, s1 = int(cell["seed_range"][0]), int(cell["seed_range"][1])
        wm = models_pih[cond][arch]
        cell_recs: List[Dict[str, Any]] = []

        for seed in range(s0, s1 + 1):
            clr_spec = build_metrology_clearance_spec(clr_mode, clr, seed)
            rec = _run_single_pih_episode(
                cell_id=cell_key,
                track="3.6.2_primary_physical_envelope",
                seed=seed,
                friction_coeff=mu,
                true_clearance_mm=clr,
                wm=wm,
                wm_condition=cond,
                arch=arch,
                clr_spec=clr_spec,
                safety_eval=safety_eval,
            )
            cell_recs.append(rec)
            t362_records.append(rec)
            if rec["safety_violation"] or rec["dynamic_crush_terminated"]:
                g1_halted = True
                g1_failure_details = rec
                break

        agg = _aggregate_cell_records(cell_recs, cell_key)
        agg["role"] = cell["role"]
        agg["physical_condition"] = phys
        agg["world_model_condition"] = cond
        agg["architecture"] = arch
        agg["clearance_mode"] = clr_mode.value
        t362_cells_summary[cell_key] = agg
        if cond == "M4_acmm":
            m4_valid_cells[cell_key] = agg
        else:
            m0_cells[cell_key] = agg

        if (cell_idx + 1) % 4 == 0 or g1_halted:
            _write_json_atomic(
                ckpt_path,
                {
                    "status": "G1_HALTED" if g1_halted else "RUNNING_TRACK_362",
                    "completed_episodes_t362": len(t362_records),
                    "g1_halted": g1_halted,
                    "g1_failure_details": g1_failure_details,
                },
            )
            _log(f"[Track 3.6.2] cell {cell_idx+1}/20 ({cell_key}) -> n={len(cell_recs)}, viol={agg['safety_violations']}, seated={agg['seated_successes']}")
        if g1_halted:
            break

    # Build separate per-(condition, mode) & pooled OOD summary without pooled paired claim
    t362_m4_mode_a = [r for r in t362_records if r["world_model_condition"] == "M4_acmm" and r["architecture"] == "B3" and r["clearance_mode"] == ClearanceMode.ESTIMATED_CLEARANCE.value]
    t362_m4_mode_b = [r for r in t362_records if r["world_model_condition"] == "M4_acmm" and r["architecture"] == "B3" and r["clearance_mode"] == ClearanceMode.UNKNOWN_CLEARANCE.value]
    t362_m4_b1 = [r for r in t362_records if r["world_model_condition"] == "M4_acmm" and r["architecture"] == "B1"]
    t362_m0_b3 = [r for r in t362_records if r["world_model_condition"] == "M0_passive"]
    t362_ood_mode_a = [r for r in t362_m4_mode_a if r["cell_id"].startswith("OOD_")]
    t362_ood_mode_b = [r for r in t362_m4_mode_b if r["cell_id"].startswith("OOD_")]

    t362_summary = {
        "n_episodes_executed": len(t362_records),
        "total_safety_violations": sum(1 for r in t362_records if r["safety_violation"]),
        "total_dynamic_crush_terminations": sum(1 for r in t362_records if r["dynamic_crush_terminated"]),
        "cells": t362_cells_summary,
        "m4_valid_domain_cells": m4_valid_cells,
        "m0_passive_cells": m0_cells,
        "pooled_subgroups_explicitly_labeled": {
            "M4_B3_ModeA_ID_plus_OOD_marginal_n300": _aggregate_cell_records(t362_m4_mode_a, "M4_B3_ModeA_all"),
            "M4_B3_ModeB_ID_plus_OOD_marginal_n300": _aggregate_cell_records(t362_m4_mode_b, "M4_B3_ModeB_all"),
            "M4_B3_ModeA_OOD_4corners_mixture_n240": _aggregate_cell_records(t362_ood_mode_a, "M4_B3_ModeA_OOD_mixture"),
            "M4_B3_ModeB_OOD_4corners_mixture_n240": _aggregate_cell_records(t362_ood_mode_b, "M4_B3_ModeB_OOD_mixture"),
            "M4_B1_ModeB_control_n75": _aggregate_cell_records(t362_m4_b1, "M4_B1_ModeB_all"),
            "M0_B3_ModeB_passive_comparison_n100": _aggregate_cell_records(t362_m0_b3, "M0_B3_ModeB_all"),
        },
        "paired_mode_a_vs_mode_b": _compute_paired_mode_a_vs_mode_b(t362_records),
    }

    # ---- Track 3.6.3: Unseen Interpolation & Boundary Stress (240 episodes) ----
    t363_records: List[Dict[str, Any]] = []
    interp_cells: Dict[str, Any] = {}
    bnd_cells: Dict[str, Any] = {}
    if not g1_halted:
        wm_m4_b3 = models_pih["M4_acmm"]["B3"]
        for cell in manifest["tracks"]["3.6.3_unseen_and_boundary"]:
            cid = cell["cell_id"]
            cat = cell["category"]
            mu = float(cell["friction_coeff"])
            clr = float(cell["clearance_mm"])
            clr_mode = ClearanceMode(cell["clearance_mode"])
            s0, s1 = int(cell["seed_range"][0]), int(cell["seed_range"][1])
            cell_recs = []

            for seed in range(s0, s1 + 1):
                if cid == "BND_below018_proactive_refuse":
                    clr_spec = ClearanceSpecification(
                        mode=ClearanceMode.UNKNOWN_CLEARANCE,
                        c_robust_mm=VALIDATED_OOD_MIN_CLEARANCE_MM,
                        allow_below_validated_domain=False,
                        min_possible_clearance_mm=0.14,
                    )
                elif cid == "BND_below018_mode_a_valid":
                    clr_spec = build_metrology_clearance_spec(
                        ClearanceMode.ESTIMATED_CLEARANCE, clr, seed, sigma_c_mm=0.015, k_sigma=2.0
                    )
                else:
                    clr_spec = build_metrology_clearance_spec(clr_mode, clr, seed)

                rec = _run_single_pih_episode(
                    cell_id=cid,
                    track="3.6.3_unseen_and_boundary",
                    seed=seed,
                    friction_coeff=mu,
                    true_clearance_mm=clr,
                    wm=wm_m4_b3,
                    wm_condition="M4_acmm",
                    arch="B3",
                    clr_spec=clr_spec,
                    safety_eval=safety_eval,
                )
                cell_recs.append(rec)
                t363_records.append(rec)
                if rec["safety_violation"] or rec["dynamic_crush_terminated"]:
                    g1_halted = True
                    g1_failure_details = rec
                    break

            agg = _aggregate_cell_records(cell_recs, cid)
            agg["category"] = cat
            agg["expected_behavior"] = cell.get("expected_behavior")
            if cat == "unseen_interpolation":
                interp_cells[cid] = agg
            else:
                bnd_cells[cid] = agg
            if g1_halted:
                break

        _write_json_atomic(
            ckpt_path,
            {
                "status": "G1_HALTED" if g1_halted else "COMPLETED_TRACK_363",
                "completed_episodes_t363": len(t363_records),
                "g1_halted": g1_halted,
                "g1_failure_details": g1_failure_details,
            },
        )
        _log(f"[Track 3.6.3] executed={len(t363_records)} viol={sum(1 for r in t363_records if r['safety_violation'])}")

    t363_summary = {
        "n_episodes_executed": len(t363_records),
        "total_safety_violations": sum(1 for r in t363_records if r["safety_violation"]),
        "total_dynamic_crush_terminations": sum(1 for r in t363_records if r["dynamic_crush_terminated"]),
        "unseen_interpolation_cells": interp_cells,
        "boundary_cells": bnd_cells,
    }

    # ---- Track 3.6.4: Pose, Tilt, Near-Rim & Mid-Insertion Impulse Stress (120 episodes) ----
    t364_records: List[Dict[str, Any]] = []
    t364_cells: Dict[str, Any] = {}
    if not g1_halted:
        wm_m4_b3 = models_pih["M4_acmm"]["B3"]
        for cell in manifest["tracks"]["3.6.4_pose_tilt_contact_stress"]:
            smode = cell["stress_mode"]
            s0, s1 = int(cell["seed_range"][0]), int(cell["seed_range"][1])
            cell_recs = []
            for seed in range(s0, s1 + 1):
                clr_spec = build_metrology_clearance_spec(ClearanceMode.UNKNOWN_CLEARANCE, 0.18, seed)
                rec = _run_single_pih_episode(
                    cell_id=smode,
                    track="3.6.4_pose_tilt_contact_stress",
                    seed=seed,
                    friction_coeff=0.85,
                    true_clearance_mm=0.18,
                    wm=wm_m4_b3,
                    wm_condition="M4_acmm",
                    arch="B3",
                    clr_spec=clr_spec,
                    safety_eval=safety_eval,
                    stress_mode=smode,
                )
                cell_recs.append(rec)
                t364_records.append(rec)
                if rec["safety_violation"] or rec["dynamic_crush_terminated"]:
                    g1_halted = True
                    g1_failure_details = rec
                    break

            agg = _aggregate_cell_records(cell_recs, smode)
            agg["description"] = cell["description"]
            t364_cells[smode] = agg
            if g1_halted:
                break

        _write_json_atomic(
            ckpt_path,
            {
                "status": "G1_HALTED" if g1_halted else "COMPLETED_TRACK_364",
                "completed_episodes_t364": len(t364_records),
                "g1_halted": g1_halted,
                "g1_failure_details": g1_failure_details,
            },
        )
        _log(f"[Track 3.6.4] executed={len(t364_records)} viol={sum(1 for r in t364_records if r['safety_violation'])}")

    t364_summary = {
        "n_episodes_executed": len(t364_records),
        "total_safety_violations": sum(1 for r in t364_records if r["safety_violation"]),
        "total_dynamic_crush_terminations": sum(1 for r in t364_records if r["dynamic_crush_terminated"]),
        "stress_modes": t364_cells,
    }

    # ---- Track 3.6.5 (Faults + G5 Oracle Audit) & Track 3.6.6 (Task 2 Non-Regression) ----
    if not g1_halted:
        t365_summary = _run_track_365_fault_injection(r002_root, models_pih)
        _log(f"[Track 3.6.5] passed={t365_summary['passed_scenarios']}/{t365_summary['n_scenarios']} g5_diff={t365_summary['g5_oracle_invariance_max_abs_diff']}")
        t366_summary = _run_track_366_task2_non_regression(manifest, models_t2)
        _log(f"[Track 3.6.6] n={t366_summary['n_episodes']} success={t366_summary['overall_success_rate']} viol={t366_summary['total_safety_violations']}")
    else:
        t365_summary = {"n_scenarios": 0, "passed_scenarios": 0, "g5_oracle_invariance_max_abs_diff": None, "g5_oracle_zero_leakage_verified": False, "skipped_due_to_g1_halt": True}
        t366_summary = {"n_episodes": 0, "total_safety_violations": 0, "force_gt_25n_episodes": 0, "by_stratum": {}, "skipped_due_to_g1_halt": True}

    # Post-run immutability verification
    post_phase35_imm = verify_archived_phase35_immutability(eval_dir_p35)
    post_v1_hashes = collect_safety_architecture_v1_hashes(r002_root)
    manifest_after = verify_frozen_phase36_manifest(r002_root)
    immutability_ok = bool(
        len(pre_phase35_imm) == 4
        and pre_phase35_imm == post_phase35_imm
        and pre_v1_hashes == post_v1_hashes
        and manifest_after["manifest_sha256"] == FROZEN_MANIFEST_SHA256
    )

    gates = _evaluate_acceptance_gates(
        t362_summary=t362_summary,
        t363_summary=t363_summary,
        t364_summary=t364_summary,
        t365_summary=t365_summary,
        t366_summary=t366_summary,
        immutability_ok=immutability_ok,
        g1_halted=g1_halted,
    )

    total_executed = (
        int(t362_summary["n_episodes_executed"])
        + int(t363_summary["n_episodes_executed"])
        + int(t364_summary["n_episodes_executed"])
        + int(t365_summary["n_scenarios"])
        + int(t366_summary["n_episodes"])
    )
    elapsed_s = round(time.perf_counter() - t_start, 2)

    all_pih_records = t362_records + t363_records + t364_records
    results_doc: Dict[str, Any] = {
        "schema_version": "phase3_6_validation_results_v1",
        "generated_at_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
        "elapsed_seconds": elapsed_s,
        "manifest_sha256": FROZEN_MANIFEST_SHA256,
        "safety_architecture_version": manifest["safety_architecture_version"],
        "reproducibility_metadata": get_runtime_reproducibility_metadata(),
        "execution_status": "HALTED_ON_G1_VIOLATION" if g1_halted else "COMPLETED",
        "g1_halted": g1_halted,
        "g1_failure_details": g1_failure_details,
        "total_planned_episodes": manifest["evaluation_budget"]["total_campaign_episodes"],
        "total_executed_episodes": total_executed,
        "seed_disjointness_audit": seed_audit,
        "acceptance_gates": gates,
        "track_summaries": {
            "3.6.2_primary_physical_envelope": t362_summary,
            "3.6.3_unseen_and_boundary": t363_summary,
            "3.6.4_pose_tilt_contact_stress": t364_summary,
            "3.6.5_fault_recovery_injection": t365_summary,
            "3.6.6_task2_non_regression": {k: v for k, v in t366_summary.items() if k != "episodes"},
        },
        "aggregate_pih_safety_telemetry": {
            "total_pih_episodes": len(all_pih_records),
            "total_safety_violations": sum(1 for r in all_pih_records if r["safety_violation"]),
            "total_dynamic_crush": sum(1 for r in all_pih_records if r["dynamic_crush_terminated"]),
            "total_wall_penetration_steps": sum(int(r["wall_penetration_steps"]) for r in all_pih_records),
            "total_cbf_modified_steps": sum(int(r["cbf_modified_steps"]) for r in all_pih_records),
            "total_shadow_would_pass_unsafe_steps": sum(int(r["shadow_would_pass_unsafe_steps"]) for r in all_pih_records),
            "max_force_n_overall": _summarize_distribution([float(r["max_force_n"]) for r in all_pih_records]),
            "max_torque_nm_overall": _summarize_distribution([float(r["max_torque_nm"]) for r in all_pih_records]),
            "worst_5_force_episodes": [
                {k: r[k] for k in ("track", "cell_id", "seed", "world_model_condition", "architecture", "clearance_mode", "max_force_n", "max_torque_nm", "seated_success", "termination_reason", "cbf_modified_steps", "shadow_would_pass_unsafe_steps")}
                for r in sorted(all_pih_records, key=lambda x: (-x["max_force_n"], -x["max_torque_nm"]))[:5]
            ],
        },
        "immutability_verification": {
            "immutability_ok": immutability_ok,
            "pre_safety_v1_hashes": pre_v1_hashes,
            "post_safety_v1_hashes": post_v1_hashes,
        },
        "episodes_peg_in_hole": all_pih_records,
        "episodes_task2": t366_summary.get("episodes", []),
    }

    _write_json_atomic(results_path, results_doc)
    return results_doc
