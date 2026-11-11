"""
HOROS PROBE-1 — Research-002: Phase 3.5.1 Targeted Peg-in-Hole Correction Engine

Implements the authorized three-part remediation for the Peg-in-Hole closed-loop defect:
- 3.5.1-A: Canonical physical-unit reward verification (depth monotonicity toward z = -50.0 mm,
           capped progress / overshoot deterrence beyond -50.0 mm, alignment, wrench, effort).
- 3.5.1-B: Free-space stall instrumentation across M0/M4 x B1/B2/B3 (world-model bias &
           uncertainty correlation sweeps, pre-fix vs reward-only vs CEM-scaled traces).
- 3.5.1-C: Targeted 150-episode closed-loop re-evaluation of C13-C18 ONLY (25 ep/cell, frozen
           seeds 6200-6224, frozen H=50) without overwriting Phase 3.5 570-ep or addendum archives.
"""

from __future__ import annotations

import copy
import json
import os
import time
from typing import Any, Callable, Dict, List, Optional, Sequence, Tuple

import numpy as np
import torch

from src.environment import get_env_dt, step_env_compatible
from src.integrated.calibration_runner import PHASE3_SEED_POOLS, verify_disjoint_seed_pools
from src.integrated.phase34_pipeline import _sha256_file, get_runtime_reproducibility_metadata
from src.integrated.phase35_closure_addendum import verify_archived_phase35_immutability
from src.integrated.phase35_evaluator import (
    _evaluate_closed_loop_cell,
    _summarize_continuous_distribution,
    apply_holm_bonferroni,
    compute_paired_binary_comparison,
    compute_paired_continuous_comparison,
    create_phase35_env,
    verify_phase34_artifacts_and_load,
)
from src.integrated.planner_evaluator import PlannerEvaluator, compute_peg_in_hole_planner_reward
from src.integrated.safety_evaluator import SafetyEvaluator
from src.integrated.statistical_analysis import format_count_pct, to_json_serializable
from src.mining.mining_evaluator import MiningEvaluator
from src.selection_aware.counterfactual_rollout import extract_env_state_and_wrench

PEGINHOLE_CELL_SPECS: Tuple[Tuple[str, str, str], ...] = (
    ("C13", "M0_passive", "B1"),
    ("C14", "M0_passive", "B2"),
    ("C15", "M0_passive", "B3"),
    ("C16", "M4_acmm", "B1"),
    ("C17", "M4_acmm", "B2"),
    ("C18", "M4_acmm", "B3"),
)

PEGINHOLE_INIT_STD: Tuple[float, ...] = (0.5, 0.5, 1.5, 0.3, 0.3, 0.1)
DIAG_6_SEEDS: Tuple[int, ...] = (6200, 6201, 6202, 6210, 6211, 6212)


def _legacy_buggy_pih_reward(s: np.ndarray, a: Optional[np.ndarray] = None) -> float:
    """Exact pre-3.5.1 buggy Peg-in-Hole reward preserved strictly for diagnostic replay."""
    del a
    peg_z = float(s[2])
    lateral_err = float(np.linalg.norm(s[:2]))
    wrench_norm = float(np.linalg.norm(s[9:15])) if len(s) >= 15 else float(np.linalg.norm(s[:3]))
    return -float(lateral_err * 2.0 + max(0.0, peg_z) * 1.5 - min(0.0, peg_z) * 5.0 + wrench_norm * 0.1)


def _pih_state(
    z_mm: float,
    x_mm: float = 0.0,
    y_mm: float = 0.0,
    rx_deg: float = 0.0,
    ry_deg: float = 0.0,
    wrench_z_n: float = 0.0,
) -> np.ndarray:
    s = np.zeros(15, dtype=np.float64)
    s[0] = x_mm
    s[1] = y_mm
    s[2] = z_mm
    s[6] = rx_deg
    s[7] = ry_deg
    s[11] = wrench_z_n
    return s


def evaluate_reward_verification_suite() -> Dict[str, Any]:
    """3.5.1-A: Verifies exact numeric values, monotonicity, bounds, and wiring consistency."""
    a_zero = np.zeros(6, dtype=np.float64)
    z_checkpoints = [15.0, 0.0, -2.0, -25.0, -50.0, -60.0, -80.0]
    depth_rows = []
    for z in z_checkpoints:
        s = _pih_state(z)
        depth_rows.append({
            "peg_z_mm": z,
            "insertion_depth_mm": round(max(0.0, -z), 3),
            "corrected_reward": round(compute_peg_in_hole_planner_reward(s, a_zero), 6),
            "legacy_buggy_reward": round(_legacy_buggy_pih_reward(s, a_zero), 6),
        })

    pe = PlannerEvaluator(task="peg_in_hole", num_candidates=4, cem_iterations=1)
    me = MiningEvaluator(task="peg_in_hole")
    probe_s = _pih_state(-12.5, x_mm=0.4, rx_deg=0.5, wrench_z_n=4.0)
    probe_a = np.array([0.5, -0.2, -3.5, 0.1, 0.0, 0.0])

    r_vals = [row["corrected_reward"] for row in depth_rows]
    monotonic_to_seat = bool(r_vals[0] < r_vals[1] < r_vals[2] < r_vals[3] < r_vals[4])
    penalizes_overrun = bool(r_vals[4] > r_vals[5] > r_vals[6])

    alignment_and_load_checks = {
        "z_minus25_aligned": round(compute_peg_in_hole_planner_reward(_pih_state(-25.0), a_zero), 6),
        "z_minus25_lat_2mm": round(compute_peg_in_hole_planner_reward(_pih_state(-25.0, x_mm=2.0), a_zero), 6),
        "z_minus25_tilt_2deg": round(compute_peg_in_hole_planner_reward(_pih_state(-25.0, rx_deg=2.0), a_zero), 6),
        "z_minus50_wrench_5n_seated": round(compute_peg_in_hole_planner_reward(_pih_state(-50.0, wrench_z_n=5.0), a_zero), 6),
        "z_minus50_wrench_20n_wedged": round(compute_peg_in_hole_planner_reward(_pih_state(-50.0, wrench_z_n=20.0), a_zero), 6),
        "z_minus25_wrench_45n_overload": round(compute_peg_in_hole_planner_reward(_pih_state(-25.0, wrench_z_n=45.0), a_zero), 6),
        "z_minus10_pure_z_action": round(
            compute_peg_in_hole_planner_reward(_pih_state(-10.0), np.array([0.0, 0.0, -4.0, 0.0, 0.0, 0.0])), 6
        ),
        "z_minus10_noisy_lateral_action": round(
            compute_peg_in_hole_planner_reward(_pih_state(-10.0), np.array([2.0, 2.0, -4.0, 1.0, 1.0, 0.0])), 6
        ),
        "planner_evaluator_matches_mining_evaluator": abs(
            pe.reward_fn(probe_s, probe_a) - me.reward_fn(probe_s, probe_a)
        ) < 1e-9,
    }

    return {
        "depth_checkpoints": depth_rows,
        "monotonic_to_z_minus50": monotonic_to_seat,
        "peak_at_seating_and_penalizes_overrun": penalizes_overrun,
        "alignment_and_load_checks": alignment_and_load_checks,
    }


def _probe_world_model_freespace_bias(models_pih: Dict[str, Any]) -> Dict[str, Any]:
    """Probes zero-action drift, z-action sensitivity, and uncertainty correlation at z = 15 mm."""
    s0 = _pih_state(15.0)
    az_grid = [-5.0, -4.0, -3.0, -2.0, -1.0, 0.0, 1.0, 2.0, 3.0, 4.0, 5.0]
    s_batch = torch.tensor(np.repeat(s0[np.newaxis, :], len(az_grid), axis=0), dtype=torch.float32)
    a_batch = torch.zeros((len(az_grid), 6), dtype=torch.float32)
    a_batch[:, 2] = torch.tensor(az_grid, dtype=torch.float32)

    out: Dict[str, Any] = {}
    zero_idx = az_grid.index(0.0)
    for cond in ("M0_passive", "M4_acmm"):
        out[cond] = {}
        for arch in ("B1", "B2", "B3"):
            wm = models_pih[cond][arch]
            wm.eval()
            with torch.no_grad():
                mean_ns, epi_v, alea_v = wm.predict_with_uncertainty(s_batch, a_batch)
            deltas = mean_ns.numpy()[:, :3] - s0[:3]
            epi_norm = torch.norm(torch.sqrt(torch.clamp(epi_v, min=0.0)), dim=-1).numpy()
            alea_norm = torch.norm(torch.sqrt(torch.clamp(alea_v, min=0.0)), dim=-1).numpy()
            dz_pred = deltas[:, 2]
            dz_slope = float(np.polyfit(np.asarray(az_grid, dtype=np.float64), dz_pred, 1)[0])
            corr_epi = (
                float(np.corrcoef(dz_pred, epi_norm)[0, 1]) if float(np.std(epi_norm)) > 1e-12 else 0.0
            )
            corr_alea = (
                float(np.corrcoef(dz_pred, alea_norm)[0, 1]) if float(np.std(alea_norm)) > 1e-12 else 0.0
            )
            out[cond][arch] = {
                "zero_action_pred_delta_xyz_mm": [round(float(x), 4) for x in deltas[zero_idx]],
                "dz_pred_at_az_minus5_mm": round(float(dz_pred[0]), 4),
                "dz_pred_at_az_plus5_mm": round(float(dz_pred[-1]), 4),
                "linear_dz_gain_per_az": round(dz_slope, 4),
                "epistemic_norm_at_az_minus5": round(float(epi_norm[0]), 4),
                "epistemic_norm_at_az_0": round(float(epi_norm[zero_idx]), 4),
                "aleatoric_norm_at_az_minus5": round(float(alea_norm[0]), 4),
                "aleatoric_norm_at_az_0": round(float(alea_norm[zero_idx]), 4),
                "corr_dz_with_epistemic": round(corr_epi, 4),
                "corr_dz_with_aleatoric": round(corr_alea, 4),
            }
    return out


def _instrument_episode_trace(
    cond: str,
    arch: str,
    hybrid_wm: Any,
    seed: int,
    reward_fn: Callable[[np.ndarray, Optional[np.ndarray]], float],
    num_candidates: int,
    cem_iterations: int,
    init_std: Optional[Sequence[float]],
    warm_start: bool,
) -> Dict[str, Any]:
    """Runs a single instrumented closed-loop episode logging CEM proposals, CBF interventions, and state."""
    pe = PlannerEvaluator(
        task="peg_in_hole",
        eval_horizon=50,
        plan_horizon=10,
        num_candidates=num_candidates,
        elite_fraction=0.15,
        cem_iterations=cem_iterations,
        seed=42,
        init_std=list(init_std) if init_std is not None else None,
    )
    planner, _, _, _, _ = pe._create_planner_for_model(hybrid_wm, arch, "auto", 1.5, "auto")
    np.random.seed(42 + int(seed))
    if hasattr(planner, "rng") and planner.rng is not None:
        planner.rng = np.random.RandomState(42 + int(seed))

    env, emeta = create_phase35_env("PegInHole", int(seed))
    safety_filter = SafetyEvaluator(task="peg_in_hole").create_safety_filter()
    obs = env.reset()
    warm_mean = None

    raw_dz_vals: List[float] = []
    exec_dz_vals: List[float] = []
    unc_pen_vals: List[float] = []
    pred_ret_vals: List[float] = []
    cand_z_samples: List[float] = []
    z_traj = [float(env.peg_pos[2])]
    radial_traj = [float(np.linalg.norm(env.peg_pos[:2]))]
    max_force = 0.0
    plunge_damp_cnt = tilt_clamp_cnt = lat_clamp_cnt = interv_cnt = 0
    first_contact_step: Optional[int] = None
    first_plunge_dz: Optional[float] = None

    for step in range(50):
        s_curr, _ = extract_env_state_and_wrench(obs, "peg_in_hole")
        plan_kwargs = {"warm_start_mean": warm_mean} if warm_mean is not None else {}
        a_raw, p_info = planner.plan(s_curr, reward_fn, **plan_kwargs)
        cand_seq = p_info.get("best_trajectory")
        if warm_start and cand_seq is not None and len(cand_seq) > 1:
            warm_mean = np.vstack([cand_seq[1:], cand_seq[-1:]])
        if cand_seq is not None and step == 0:
            first_plunge_dz = round(float(cand_seq[0, 2]), 4)
        cand_z_samples.append(float(a_raw[2]))
        if "best_uncertainty_penalty" in p_info:
            unc_pen_vals.append(float(p_info["best_uncertainty_penalty"]))
        pred_ret_vals.append(float(p_info.get("best_predicted_return", 0.0)))

        w = obs.get("wrench", np.zeros(6))
        rot = obs.get("rot", np.zeros(3))
        pos = obs.get("pos", np.zeros(3))
        if a_raw[2] < -1.0 and (safety_filter.max_normal_force - float(np.linalg.norm(w[:3]))) < 10.0:
            plunge_damp_cnt += 1
        if obs.get("stratum", 0) == 3 or float(np.linalg.norm(rot[:2])) > safety_filter.critical_wedge_angle * 0.8:
            tilt_clamp_cnt += 1
        if float(np.linalg.norm(pos[:2])) > 0.4 and obs.get("stratum", 0) in (2, 3):
            lat_clamp_cnt += 1

        a_exec, intervened, _ = safety_filter.filter_action(obs, a_raw.copy(), task="peg_in_hole")
        if intervened:
            interv_cnt += 1
        raw_dz_vals.append(float(a_raw[2]))
        exec_dz_vals.append(float(a_exec[2]))

        obs, _, done, _ = step_env_compatible(env, a_exec, task="peg_in_hole", require_reward=False)
        z_traj.append(float(env.peg_pos[2]))
        radial_traj.append(float(np.linalg.norm(env.peg_pos[:2])))
        fn = float(np.linalg.norm(obs.get("wrench", np.zeros(6))[:3]))
        max_force = max(max_force, fn)
        if first_contact_step is None and fn > 0.5:
            first_contact_step = step
        if done:
            break

    seated = bool(-z_traj[-1] >= 50.0 and float(np.linalg.norm(obs.get("wrench", np.zeros(6))[:2])) < 10.0)
    return {
        "condition": cond,
        "architecture": arch,
        "seed": int(seed),
        "sub_stratum": emeta["sub_stratum"],
        "clearance_mm": emeta["clearance_mm"],
        "steps_executed": len(raw_dz_vals),
        "z_init_mm": round(z_traj[0], 4),
        "z_final_mm": round(z_traj[-1], 4),
        "insertion_depth_final_mm": round(max(0.0, 15.0 - z_traj[-1]), 4),
        "radial_init_mm": round(radial_traj[0], 4),
        "radial_max_mm": round(float(max(radial_traj)), 4),
        "radial_final_mm": round(radial_traj[-1], 4),
        "seated": seated,
        "first_contact_step": first_contact_step,
        "max_contact_force_n": round(max_force, 4),
        "step0_cand_dz_mm": first_plunge_dz,
        "raw_dz_mean_mm": round(float(np.mean(raw_dz_vals)), 4),
        "exec_dz_mean_mm": round(float(np.mean(exec_dz_vals)), 4),
        "raw_minus_exec_dz_max_abs": round(float(np.max(np.abs(np.asarray(raw_dz_vals) - np.asarray(exec_dz_vals)))), 6),
        "uncertainty_penalty_mean": round(float(np.mean(unc_pen_vals)), 4) if unc_pen_vals else 0.0,
        "predicted_return_mean": round(float(np.mean(pred_ret_vals)), 4),
        "cbf_interventions_total": int(interv_cnt),
        "cbf_barrier_triggers": {
            "force_plunge_damp": int(plunge_damp_cnt),
            "tilt_wedging": int(tilt_clamp_cnt),
            "lateral_centering": int(lat_clamp_cnt),
        },
    }


def _collect_stall_diagnostics(
    r002_root: str,
    phase34_ctx: Dict[str, Any],
    corrected_cells: Dict[str, Any],
) -> Dict[str, Any]:
    """3.5.1-B: Free-space stall root causes, world-model sweeps, traces, and 6-seed ablation."""
    eval_dir = os.path.join(r002_root, "experiments", "phase3_5_evaluation")
    with open(os.path.join(eval_dir, "phase35_closed_loop_450ep_results.json"), "r", encoding="utf-8") as f:
        cl35 = json.load(f)

    pih_models = phase34_ctx["models"]["peg_in_hole"]
    orig_c13_c18_summary = {}
    for cid, _, _ in PEGINHOLE_CELL_SPECS:
        c = cl35["cells"][cid]
        eps = c["episodes"]
        nz_f = sum(1 for e in eps if float(e.get("max_peg_force_n") or 0.0) > 0.0)
        orig_c13_c18_summary[cid] = {
            "training_condition": c["training_condition"],
            "architecture_id": c["architecture_id"],
            "task_success": c["task_success"],
            "safety_violations": c["safety_violations"],
            "nonzero_force_contact_episodes": format_count_pct(nz_f, len(eps)),
            "max_peg_force_n": _summarize_continuous_distribution([float(e.get("max_peg_force_n") or 0.0) for e in eps]),
            "goal_progress": c["goal_progress"],
            "stall_rate": c["stall_rate"],
            "temporal_truncation": c["failure_taxonomy"]["temporal_truncation"],
            "interventions_per_step": c["interventions_per_step"],
            "epistemic_uncertainty_mean": c["epistemic_uncertainty_mean"],
            "aleatoric_uncertainty_mean": c["aleatoric_uncertainty_mean"],
            "planner_exploitation_gap": c["planner_exploitation_gap"],
        }

    wm_probe = _probe_world_model_freespace_bias(pih_models)

    traces: Dict[str, Any] = {}
    for cid, cond, arch in (("C14", "M0_passive", "B2"), ("C18", "M4_acmm", "B3")):
        wm = pih_models[cond][arch]
        traces[cid] = {}
        for seed in (6200, 6210):
            traces[cid][str(seed)] = {
                "1_legacy_buggy_60x2_std05": _instrument_episode_trace(
                    cond, arch, wm, seed, _legacy_buggy_pih_reward, 60, 2, None, False
                ),
                "2_reward_fix_only_60x2_std05": _instrument_episode_trace(
                    cond, arch, wm, seed, compute_peg_in_hole_planner_reward, 60, 2, None, False
                ),
                "3_reward_fix_scaled_100x3_warmstart": _instrument_episode_trace(
                    cond, arch, wm, seed, compute_peg_in_hole_planner_reward, 100, 3, PEGINHOLE_INIT_STD, True
                ),
            }

    # Paired 6-seed ablation comparing reward-fix-only (60x2, std=0.5, warm_start=False)
    # against matching 6 seeds from 3.5.1-C (100x3, vec std, warm_start=True)
    ablation_6seed: Dict[str, Any] = {}
    seed_set = list(DIAG_6_SEEDS)
    for cid, cond, arch in PEGINHOLE_CELL_SPECS:
        cond_pack = pih_models[cond]
        b4_m = cond_pack["B4"] if arch == "B1" else None
        ro_res = _evaluate_closed_loop_cell(
            cell_id=cid,
            task="peg_in_hole",
            condition=cond,
            arch=arch,
            regime="PegInHole",
            seeds=seed_set,
            hybrid_wm=cond_pack[arch],
            b4_model=b4_m,
            eval_horizon=50,
            seed_offset=42,
            num_candidates=60,
            cem_iterations=2,
            init_std=None,
            warm_start=False,
        )
        sc_eps = [e for e in corrected_cells[cid]["episodes"] if int(e["seed"]) in DIAG_6_SEEDS]
        ro_eps = ro_res["episodes"]
        ablation_6seed[cid] = {
            "seeds": seed_set,
            "reward_fix_only_60x2_std05": {
                "task_success": format_count_pct(sum(1 for e in ro_eps if e["is_success"]), len(ro_eps)),
                "contact_nonzero_force": format_count_pct(
                    sum(1 for e in ro_eps if float(e.get("max_peg_force_n") or 0.0) > 0.0), len(ro_eps)
                ),
                "safety_violations": format_count_pct(sum(1 for e in ro_eps if e["has_safety_violation"]), len(ro_eps)),
                "goal_progress_mean_mm": round(float(np.mean([e["goal_progress"] for e in ro_eps])), 4),
            },
            "reward_fix_plus_cem_100x3_warmstart": {
                "task_success": format_count_pct(sum(1 for e in sc_eps if e["is_success"]), len(sc_eps)),
                "contact_nonzero_force": format_count_pct(
                    sum(1 for e in sc_eps if float(e.get("max_peg_force_n") or 0.0) > 0.0), len(sc_eps)
                ),
                "safety_violations": format_count_pct(sum(1 for e in sc_eps if e["has_safety_violation"]), len(sc_eps)),
                "goal_progress_mean_mm": round(float(np.mean([e["goal_progress"] for e in sc_eps])), 4),
            },
        }

    return {
        "original_phase35_c13_c18_summary": orig_c13_c18_summary,
        "world_model_freespace_bias_and_uncertainty": wm_probe,
        "instrumented_seed_traces": traces,
        "six_seed_reward_only_vs_scaled_cem_ablation": ablation_6seed,
    }


def _summarize_stratum_episodes(eps: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Computes ID vs OOD Peg-in-Hole contingency and depth statistics."""
    n = len(eps)
    succ = sum(1 for e in eps if e["is_success"])
    viol = sum(1 for e in eps if e["has_safety_violation"])
    clean_succ = sum(1 for e in eps if e["is_success"] and not e["has_safety_violation"])
    contact = sum(1 for e in eps if float(e.get("max_peg_force_n") or 0.0) > 0.0)
    reach20 = sum(1 for e in eps if e["reached_20mm_target"])
    return {
        "num_episodes": n,
        "task_success": format_count_pct(succ, n),
        "safety_violations": format_count_pct(viol, n),
        "clean_success_no_violation": format_count_pct(clean_succ, n),
        "nonzero_force_contact": format_count_pct(contact, n),
        "reached_20mm_depth": format_count_pct(reach20, n),
        "goal_progress_mm": _summarize_continuous_distribution([e["goal_progress"] for e in eps]),
        "max_peg_force_n": _summarize_continuous_distribution([float(e.get("max_peg_force_n") or 0.0) for e in eps]),
        "planner_exploitation_gap": _summarize_continuous_distribution([e["peg_mean"] for e in eps]),
    }


def _compute_phase351_statistics(
    cells_new: Dict[str, Any],
    cells_old: Dict[str, Any],
) -> Dict[str, Any]:
    """Computes paired within-3.5.1 and Before-vs-After statistical comparisons with exact Holm p-values."""
    within_m4_vs_m0: List[Dict[str, Any]] = []
    for cname, c4, c0 in (
        ("C16_vs_C13_Peg_B1", "C16", "C13"),
        ("C17_vs_C14_Peg_B2", "C17", "C14"),
        ("C18_vs_C15_Peg_B3", "C18", "C15"),
    ):
        e4, e0 = cells_new[c4]["episodes"], cells_new[c0]["episodes"]
        within_m4_vs_m0.append(
            compute_paired_binary_comparison([x["is_success"] for x in e4], [x["is_success"] for x in e0], f"{cname}_success")
        )
        within_m4_vs_m0.append(
            compute_paired_binary_comparison(
                [x["has_safety_violation"] for x in e4], [x["has_safety_violation"] for x in e0], f"{cname}_safety_violation"
            )
        )
        within_m4_vs_m0.append(
            compute_paired_continuous_comparison([x["goal_progress"] for x in e4], [x["goal_progress"] for x in e0], f"{cname}_goal_progress")
        )
        within_m4_vs_m0.append(
            compute_paired_continuous_comparison([x["peg_mean"] for x in e4], [x["peg_mean"] for x in e0], f"{cname}_peg")
        )

    m4_all = [e for cid in ("C16", "C17", "C18") for e in cells_new[cid]["episodes"]]
    m0_all = [e for cid in ("C13", "C14", "C15") for e in cells_new[cid]["episodes"]]
    within_m4_vs_m0.append(
        compute_paired_binary_comparison([x["is_success"] for x in m4_all], [x["is_success"] for x in m0_all], "Peg_M4_vs_M0_N75_success")
    )
    within_m4_vs_m0.append(
        compute_paired_binary_comparison(
            [x["has_safety_violation"] for x in m4_all], [x["has_safety_violation"] for x in m0_all], "Peg_M4_vs_M0_N75_safety_violation"
        )
    )
    within_m4_vs_m0.append(
        compute_paired_continuous_comparison([x["goal_progress"] for x in m4_all], [x["goal_progress"] for x in m0_all], "Peg_M4_vs_M0_N75_goal_progress")
    )
    within_m4_vs_m0.append(
        compute_paired_continuous_comparison([x["peg_mean"] for x in m4_all], [x["peg_mean"] for x in m0_all], "Peg_M4_vs_M0_N75_peg")
    )

    # Apply Holm separately over binary and continuous families
    bin_within = [c for c in within_m4_vs_m0 if "mcnemar_exact_p" in c]
    cont_within = [c for c in within_m4_vs_m0 if "wilcoxon_p" in c]
    apply_holm_bonferroni(bin_within, "mcnemar_exact_p")
    apply_holm_bonferroni(cont_within, "wilcoxon_p")

    planner_contrasts: List[Dict[str, Any]] = []
    by_cond_arch = {(c["training_condition"], c["architecture_id"]): c["episodes"] for c in cells_new.values()}
    for cond in ("M0_passive", "M4_acmm"):
        for a1, a0 in (("B2", "B1"), ("B3", "B1"), ("B3", "B2")):
            ea, eb = by_cond_arch[(cond, a1)], by_cond_arch[(cond, a0)]
            planner_contrasts.append(
                compute_paired_binary_comparison([x["is_success"] for x in ea], [x["is_success"] for x in eb], f"{cond}_{a1}_vs_{a0}_success")
            )
            planner_contrasts.append(
                compute_paired_continuous_comparison([x["goal_progress"] for x in ea], [x["goal_progress"] for x in eb], f"{cond}_{a1}_vs_{a0}_goal_progress")
            )
    apply_holm_bonferroni([c for c in planner_contrasts if "mcnemar_exact_p" in c], "mcnemar_exact_p")
    apply_holm_bonferroni([c for c in planner_contrasts if "wilcoxon_p" in c], "wilcoxon_p")

    # Paired Before (Phase 3.5) vs After (Phase 3.5.1) across identical seeds 6200-6224
    before_after: List[Dict[str, Any]] = []
    for cid, _, _ in PEGINHOLE_CELL_SPECS:
        e_new = cells_new[cid]["episodes"]
        e_old = cells_old[cid]["episodes"]
        if [x["seed"] for x in e_new] != [x["seed"] for x in e_old]:
            raise RuntimeError(f"Seed mismatch between Phase 3.5 and Phase 3.5.1 in {cid}.")
        before_after.append(
            compute_paired_binary_comparison([x["is_success"] for x in e_new], [x["is_success"] for x in e_old], f"{cid}_351_vs_35_success")
        )
        before_after.append(
            compute_paired_binary_comparison(
                [x["has_safety_violation"] for x in e_new], [x["has_safety_violation"] for x in e_old], f"{cid}_351_vs_35_safety_violation"
            )
        )
        before_after.append(
            compute_paired_binary_comparison(
                [float(x.get("max_peg_force_n") or 0.0) > 0.0 for x in e_new],
                [float(x.get("max_peg_force_n") or 0.0) > 0.0 for x in e_old],
                f"{cid}_351_vs_35_contact",
            )
        )
        before_after.append(
            compute_paired_continuous_comparison([x["goal_progress"] for x in e_new], [x["goal_progress"] for x in e_old], f"{cid}_351_vs_35_goal_progress")
        )
        before_after.append(
            compute_paired_continuous_comparison([x["peg_mean"] for x in e_new], [x["peg_mean"] for x in e_old], f"{cid}_351_vs_35_peg")
        )

    for scope_lbl, cids in (
        ("All_M0_N75", ("C13", "C14", "C15")),
        ("All_M4_N75", ("C16", "C17", "C18")),
        ("All_C13_C18_N150", ("C13", "C14", "C15", "C16", "C17", "C18")),
    ):
        en = [e for c in cids for e in cells_new[c]["episodes"]]
        eo = [e for c in cids for e in cells_old[c]["episodes"]]
        before_after.append(
            compute_paired_binary_comparison([x["is_success"] for x in en], [x["is_success"] for x in eo], f"{scope_lbl}_351_vs_35_success")
        )
        before_after.append(
            compute_paired_continuous_comparison([x["goal_progress"] for x in en], [x["goal_progress"] for x in eo], f"{scope_lbl}_351_vs_35_goal_progress")
        )

    apply_holm_bonferroni([c for c in before_after if "mcnemar_exact_p" in c], "mcnemar_exact_p")
    apply_holm_bonferroni([c for c in before_after if "wilcoxon_p" in c], "wilcoxon_p")

    return {
        "within_phase351_m4_vs_m0_paired": within_m4_vs_m0,
        "within_phase351_planner_contrasts": planner_contrasts,
        "before_vs_after_phase35_paired": before_after,
    }


def run_phase35_1_peginhole_correction(
    r002_root: str,
    repo_root: Optional[str] = None,
    output_dir: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Executes Phase 3.5.1 (3.5.1-A reward verification, 3.5.1-B stall diagnostics & ablation,
    and 3.5.1-C 150-episode C13-C18 closed-loop re-evaluation) while verifying byte-for-byte
    preservation of all Phase 3.5 and closure addendum archives.
    """
    t0 = time.time()
    eval_dir = output_dir or os.path.join(r002_root, "experiments", "phase3_5_evaluation")
    verify_disjoint_seed_pools()

    archive_hashes = verify_archived_phase35_immutability(eval_dir)
    addendum_paths = (
        "phase35_closure_addendum.json",
        "phase35_closure_addendum_report.md",
    )
    addendum_pre_hashes = {
        fn: _sha256_file(os.path.join(eval_dir, fn))
        for fn in addendum_paths
        if os.path.exists(os.path.join(eval_dir, fn))
    }

    phase34_ctx = verify_phase34_artifacts_and_load(r002_root)
    runtime_meta = get_runtime_reproducibility_metadata(repo_root=repo_root)
    seeds = list(PHASE3_SEED_POOLS["closed_loop_peg_in_hole"])

    print("[Phase 3.5.1-A] Verifying corrected Peg-in-Hole planner reward...", flush=True)
    reward_suite = evaluate_reward_verification_suite()

    print("[Phase 3.5.1-C] Running 150-episode C13-C18 re-evaluation (H=50, seeds 6200-6224)...", flush=True)
    pih_models = phase34_ctx["models"]["peg_in_hole"]
    cells_new: Dict[str, Any] = {}
    all_new_eps: List[Dict[str, Any]] = []
    for cid, cond, arch in PEGINHOLE_CELL_SPECS:
        print(f"  [3.5.1 Closed-Loop] {cid}: {cond} | {arch} | PegInHole (N={len(seeds)})...", flush=True)
        cond_pack = pih_models[cond]
        b4_m = cond_pack["B4"] if arch == "B1" else None
        cres = _evaluate_closed_loop_cell(
            cell_id=cid,
            task="peg_in_hole",
            condition=cond,
            arch=arch,
            regime="PegInHole",
            seeds=seeds,
            hybrid_wm=cond_pack[arch],
            b4_model=b4_m,
            eval_horizon=50,
            seed_offset=42,
            num_candidates=100,
            cem_iterations=3,
            init_std=list(PEGINHOLE_INIT_STD),
            warm_start=True,
        )
        cres["sub_stratum_contingency"] = {
            "ID_N10": _summarize_stratum_episodes([e for e in cres["episodes"] if e["sub_stratum"] == "Peg-ID"]),
            "OOD_N15": _summarize_stratum_episodes([e for e in cres["episodes"] if e["sub_stratum"] == "Peg-OOD"]),
            "All_N25": _summarize_stratum_episodes(cres["episodes"]),
        }
        cells_new[cid] = cres
        all_new_eps.extend(cres["episodes"])

    print("[Phase 3.5.1-B] Collecting free-space stall diagnostics & 6-seed ablation...", flush=True)
    stall_diag = _collect_stall_diagnostics(r002_root, phase34_ctx, cells_new)

    with open(os.path.join(eval_dir, "phase35_closed_loop_450ep_results.json"), "r", encoding="utf-8") as f:
        cl35 = json.load(f)
    cells_old = {cid: cl35["cells"][cid] for cid, _, _ in PEGINHOLE_CELL_SPECS}

    marginals = {
        "M0_passive_N75": _summarize_stratum_episodes([e for e in all_new_eps if e["training_condition"] == "M0_passive"]),
        "M4_acmm_N75": _summarize_stratum_episodes([e for e in all_new_eps if e["training_condition"] == "M4_acmm"]),
        "B1_N50": _summarize_stratum_episodes([e for e in all_new_eps if e["architecture_id"] == "B1"]),
        "B2_N50": _summarize_stratum_episodes([e for e in all_new_eps if e["architecture_id"] == "B2"]),
        "B3_N50": _summarize_stratum_episodes([e for e in all_new_eps if e["architecture_id"] == "B3"]),
        "ID_N60": _summarize_stratum_episodes([e for e in all_new_eps if e["sub_stratum"] == "Peg-ID"]),
        "OOD_N90": _summarize_stratum_episodes([e for e in all_new_eps if e["sub_stratum"] == "Peg-OOD"]),
        "All_PegInHole_N150": _summarize_stratum_episodes(all_new_eps),
    }

    stats_doc = _compute_phase351_statistics(cells_new, cells_old)

    out_doc = {
        "program": "HOROS PROBE-1 — Research-002",
        "stage": "Phase 3.5.1 Targeted Peg-in-Hole Planner Correction & Re-Evaluation",
        "generated_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total_runtime_seconds": round(time.time() - t0, 2),
        "runtime_environment": runtime_meta,
        "archive_immutability_sha256s": {**archive_hashes, **addendum_pre_hashes},
        "planner_configuration": {
            "eval_horizon_steps": 50,
            "plan_horizon_steps": 10,
            "num_candidates": 100,
            "cem_iterations": 3,
            "elite_fraction": 0.15,
            "init_std": list(PEGINHOLE_INIT_STD),
            "warm_start": True,
            "safety_controller": "PredictiveCBFSafetyFilter (untouched)",
            "uncertainty_beta": 1.5,
        },
        "episode_accounting": {
            "cells_evaluated": [cid for cid, _, _ in PEGINHOLE_CELL_SPECS],
            "episodes_per_cell": len(seeds),
            "total_re_evaluated_episodes": len(all_new_eps),
            "eval_horizon_steps": 50,
            "seeds": seeds,
            "id_seeds": [s for s in seeds if s < 6210],
            "ood_seeds": [s for s in seeds if s >= 6210],
        },
        "part_351a_reward_verification": reward_suite,
        "part_351b_freespace_stall_diagnostics": stall_diag,
        "marginals": marginals,
        "cells": cells_new,
        "statistical_comparisons": stats_doc,
    }

    out_path = os.path.join(eval_dir, "phase35_1_peginhole_correction.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(to_json_serializable(out_doc), f, indent=2, allow_nan=False)

    verify_archived_phase35_immutability(eval_dir)
    for fn, pre_sha in addendum_pre_hashes.items():
        post_sha = _sha256_file(os.path.join(eval_dir, fn))
        if post_sha != pre_sha:
            raise RuntimeError(f"Addendum archive mutated on {fn}: {post_sha} != {pre_sha}")

    return out_doc

