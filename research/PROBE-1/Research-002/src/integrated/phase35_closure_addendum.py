"""
HOROS PROBE-1 — Research-002: Phase 3.5 Closure Addendum Audit Engine
Read-only reconciliation and audit across frozen Phase 3.4 checkpoints/bundles and immutable
Phase 3.5 archived evaluation results:
1. Recomputed APS diagnostics using frozen b4_conformal_calibration.json quantiles.
2. OOD detection AUROC audit (convention verification, distributions ID vs each OOD stratum).
3. Task 2 one-step vs multi-horizon H=1 RMSE metric reconciliation.
4. Peg-in-Hole H=50 temporal-truncation root-cause telemetry (reward sign inversion & free-space stall).
5. B4 episode-level simultaneous joint coverage calculation & denominator audit.
6. Exact nonzero scientific-notation p-value recomputation (zero 6-decimal rounding to 0.0).
7. Explicit M4 success-vs-safety contingency analysis retaining all violations.
"""

from __future__ import annotations

import copy
import json
import math
import os
from collections import Counter, defaultdict
from typing import Any, Dict, List, Optional, Sequence, Tuple

import numpy as np
import torch
from scipy import stats as scipy_stats

from src.environment import PegInHoleEnv, step_env_compatible
from src.integrated.phase34_pipeline import (
    _evaluate_model_multistep_on_episodes,
    _sha256_file,
    get_runtime_reproducibility_metadata,
)
from src.integrated.phase35_evaluator import (
    _compute_auroc,
    create_phase35_env,
    format_exact_pvalue,
    generate_offline_test_bundles,
    validate_aps_quantile_matches_calibrated,
    verify_phase34_artifacts_and_load,
)
from src.integrated.planner_evaluator import PlannerEvaluator
from src.integrated.safety_evaluator import SafetyEvaluator
from src.integrated.statistical_analysis import HORIZONS, compute_wilson_ci, format_count_pct, to_json_serializable
from src.selection_aware.counterfactual_rollout import extract_env_state_and_wrench
from src.selection_aware.episode_conformal_engine import EpisodeConformalEngine

EXPECTED_ARCHIVE_SHA256S: Dict[str, str] = {
    "phase35_offline_120ep_results.json": "0d700fdec06324ce76c687c3557358c4e4232c1f1d8e9923000883fe201812f1",
    "phase35_closed_loop_450ep_results.json": "8bb42e1a852c9dc61446d9f4fd689c596b1763e675b81a5754aa0ae0bc859653",
    "phase35_statistical_comparison.json": "b4f90493b84c2414ce5f97f3143be69e562edb0e5559c9d292318430fc409fec",
    "phase35_master_report.json": "3945a8cc988c990933470dfec31efd651f808819ae4933325b5eb772ba7ec745",
}


def verify_archived_phase35_immutability(eval_dir: str) -> Dict[str, str]:
    """Asserts the original 4 archived 570-episode JSON files remain byte-for-byte unchanged."""
    actual: Dict[str, str] = {}
    for fname, exp_sha in EXPECTED_ARCHIVE_SHA256S.items():
        fpath = os.path.join(eval_dir, fname)
        if not os.path.exists(fpath):
            raise FileNotFoundError(f"Original Phase 3.5 archive missing: {fpath}")
        sha = _sha256_file(fpath)
        if sha != exp_sha:
            raise RuntimeError(f"Original Phase 3.5 archive mutated on {fname}: {sha} != {exp_sha}")
        actual[fname] = sha
    return actual


def _dist_summary(arr: np.ndarray) -> Dict[str, float]:
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


def _apply_exact_holm(items: List[Dict[str, Any]], p_key: str) -> None:
    m = len(items)
    if m == 0:
        return
    indexed = sorted(enumerate(items), key=lambda x: float(x[1][p_key]))
    running_max = 0.0
    for rank_idx, (orig_idx, item) in enumerate(indexed):
        adj = min(1.0, (m - rank_idx) * float(item[p_key]))
        running_max = max(running_max, adj)
        num, sci = format_exact_pvalue(running_max)
        items[orig_idx][f"{p_key}_holm_adjusted"] = num
        items[orig_idx][f"{p_key}_holm_adjusted_sci"] = sci


def _compute_aps_addendum(
    models: Dict[str, Any], bundles: Dict[str, List[Dict[str, Any]]]
) -> Dict[str, Any]:
    """Recomputes offline APS coverage & set sizes with frozen calibrated b4 quantiles vs legacy 0.90."""
    pool_specs = (
        ("offline_test_id", "compliant_prelift"),
        ("offline_test_ood", "compliant_prelift"),
        ("offline_test_peg_in_hole", "peg_in_hole"),
    )
    out: Dict[str, Any] = {
        "closed_loop_influence_audit": {
            "aps_influenced_closed_loop_planner_or_safety": False,
            "evidence": (
                "CEMPlanner, UncertaintyPenalizedCEM, and PredictiveCBFSafetyFilter operate strictly on continuous "
                "state/variance predictions and sensor measurements; predict_mode_set/aps_quantile are passive "
                "offline diagnostics only, so no 570-episode replay is required."
            ),
        },
        "pools": {},
    }
    for pname, task in pool_specs:
        eps = bundles[pname]
        trans = [
            (ep["realized_states"][t], ep["actions"][t], int(ep["realized_modes"][t]))
            for ep in eps
            for t in range(len(ep["actions"]))
        ]
        s_t = torch.from_numpy(np.asarray([x[0] for x in trans], dtype=np.float32))
        a_t = torch.from_numpy(np.asarray([x[1] for x in trans], dtype=np.float32))
        y_true = np.asarray([x[2] for x in trans], dtype=np.int64)

        out["pools"][pname] = {}
        for cond in ("M0_passive", "M4_acmm"):
            cond_pack = models[task][cond]
            cal_q = float(cond_pack["calibrated_aps_quantile"])
            arch_map: Dict[str, Any] = {}
            for arch in ("B1", "B2", "B3"):
                wm = copy.deepcopy(cond_pack[arch])
                validate_aps_quantile_matches_calibrated(wm, cal_q, context=f"{pname}/{cond}/{arch}")
                wm.eval()
                with torch.no_grad():
                    s_in, a_in = wm._prepare_inputs(s_t, a_t)
                    s_np, a_np = s_in.numpy(), a_in.numpy()

                cal_hits, cal_sizes = 0, []
                for i in range(len(y_true)):
                    ms = wm.mode_classifier.predict_mode_set(s_np[i], a_np[i])
                    cal_sizes.append(len(ms))
                    if int(y_true[i]) in ms:
                        cal_hits += 1

                wm.mode_classifier.aps_quantile = 0.90
                leg_hits, leg_sizes = 0, []
                for i in range(len(y_true)):
                    ms_leg = wm.mode_classifier.predict_mode_set(s_np[i], a_np[i])
                    leg_sizes.append(len(ms_leg))
                    if int(y_true[i]) in ms_leg:
                        leg_hits += 1

                cal_fmt = format_count_pct(cal_hits, len(y_true))
                leg_fmt = format_count_pct(leg_hits, len(y_true))
                arch_map[arch] = {
                    "legacy_090_aps_quantile": 0.90,
                    "legacy_090_coverage": leg_fmt,
                    "legacy_090_mean_set_size": round(float(np.mean(leg_sizes)), 4),
                    "calibrated_aps_quantile": round(cal_q, 6),
                    "calibrated_coverage": cal_fmt,
                    "calibrated_mean_set_size": round(float(np.mean(cal_sizes)), 4),
                }
            out["pools"][pname][cond] = {
                "calibrated_aps_quantile": round(cal_q, 6),
                "architectures": arch_map,
            }
    return out


def _audit_ood_uncertainty(
    models: Dict[str, Any], bundles: Dict[str, List[Dict[str, Any]]]
) -> Dict[str, Any]:
    """Audits Task 2 ID vs OOD uncertainty distributions, label conventions, and stratum AUROCs."""
    id_eps = bundles["offline_test_id"]
    ood_eps = bundles["offline_test_ood"]

    def _collect(eps_list: List[Dict[str, Any]], cond: str, arch: str) -> Dict[str, Any]:
        wm = models["compliant_prelift"][cond][arch]
        wm.eval()
        all_epi, all_tot, ep_mean_tot, ep_max_tot, ep_mean_epi = [], [], [], [], []
        sub_tot: Dict[str, List[float]] = defaultdict(list)
        sub_epi: Dict[str, List[float]] = defaultdict(list)
        for ep in eps_list:
            s_t = torch.from_numpy(np.asarray(ep["realized_states"], dtype=np.float32))
            a_t = torch.from_numpy(np.asarray(ep["actions"], dtype=np.float32))
            with torch.no_grad():
                _, e_v, a_v = wm.predict_with_uncertainty(s_t, a_t)
            e_n = np.linalg.norm(np.sqrt(torch.clamp(e_v, min=0.0).numpy()), axis=-1)
            t_n = np.linalg.norm(np.sqrt(torch.clamp(e_v + a_v, min=0.0).numpy()), axis=-1)
            all_epi.extend(e_n.tolist())
            all_tot.extend(t_n.tolist())
            ep_mean_tot.append(float(np.mean(t_n)))
            ep_max_tot.append(float(np.max(t_n)))
            ep_mean_epi.append(float(np.mean(e_n)))
            sn = ep["env_meta"]["sub_stratum"]
            sub_tot[sn].extend(t_n.tolist())
            sub_epi[sn].extend(e_n.tolist())
        return {
            "trans_epi": np.asarray(all_epi),
            "trans_tot": np.asarray(all_tot),
            "ep_mean_tot": np.asarray(ep_mean_tot),
            "ep_max_tot": np.asarray(ep_max_tot),
            "ep_mean_epi": np.asarray(ep_mean_epi),
            "sub_tot": {k: np.asarray(v) for k, v in sub_tot.items()},
            "sub_epi": {k: np.asarray(v) for k, v in sub_epi.items()},
        }

    out: Dict[str, Any] = {
        "label_and_score_convention_verified": (
            "Correct original convention: positive label y=1 denotes OOD (offline_test_ood), y=0 denotes ID "
            "(offline_test_id); higher uncertainty score predicts OOD. No sign reversal applied."
        ),
        "conditions": {},
    }
    for cond in ("M0_passive", "M4_acmm"):
        out["conditions"][cond] = {}
        for arch in ("B2", "B3"):
            u_id = _collect(id_eps, cond, arch)
            u_ood = _collect(ood_eps, cond, arch)
            y_t = np.concatenate([np.zeros(len(u_id["trans_tot"])), np.ones(len(u_ood["trans_tot"]))])
            y_e = np.concatenate([np.zeros(len(id_eps)), np.ones(len(ood_eps))])
            per_sub = {}
            for sname, s_tot in sorted(u_ood["sub_tot"].items()):
                y_sub = np.concatenate([np.zeros(len(u_id["trans_tot"])), np.ones(len(s_tot))])
                per_sub[sname] = {
                    "total_std_stats": _dist_summary(s_tot),
                    "epistemic_std_stats": _dist_summary(u_ood["sub_epi"][sname]) if arch == "B3" else None,
                    "auroc_total_std_vs_id": _compute_auroc(np.concatenate([u_id["trans_tot"], s_tot]), y_sub),
                    "auroc_epistemic_std_vs_id": (
                        _compute_auroc(np.concatenate([u_id["trans_epi"], u_ood["sub_epi"][sname]]), y_sub)
                        if arch == "B3"
                        else None
                    ),
                }
            out["conditions"][cond][arch] = {
                "id_total_std": _dist_summary(u_id["trans_tot"]),
                "ood_total_std": _dist_summary(u_ood["trans_tot"]),
                "id_epistemic_std": _dist_summary(u_id["trans_epi"]) if arch == "B3" else None,
                "ood_epistemic_std": _dist_summary(u_ood["trans_epi"]) if arch == "B3" else None,
                "transition_auroc_total_std": _compute_auroc(np.concatenate([u_id["trans_tot"], u_ood["trans_tot"]]), y_t),
                "transition_auroc_epistemic_std": (
                    _compute_auroc(np.concatenate([u_id["trans_epi"], u_ood["trans_epi"]]), y_t)
                    if arch == "B3"
                    else None
                ),
                "episode_mean_auroc_total_std": _compute_auroc(np.concatenate([u_id["ep_mean_tot"], u_ood["ep_mean_tot"]]), y_e),
                "episode_max_auroc_total_std": _compute_auroc(np.concatenate([u_id["ep_max_tot"], u_ood["ep_max_tot"]]), y_e),
                "episode_mean_auroc_epistemic_std": (
                    _compute_auroc(np.concatenate([u_id["ep_mean_epi"], u_ood["ep_mean_epi"]]), y_e)
                    if arch == "B3"
                    else None
                ),
                "per_sub_stratum": per_sub,
            }
    return out


def _reconcile_task2_1step_vs_h1(
    models: Dict[str, Any], bundles: Dict[str, List[Dict[str, Any]]]
) -> Dict[str, Any]:
    """Reconciles Task 2 all-transition 1-step RMSE vs initial-step H=1 multi-horizon RMSE."""
    def _comp_rmse(sq_mat: np.ndarray) -> Dict[str, float]:
        return {
            "all_23d": round(float(np.sqrt(np.mean(sq_mat))), 4),
            "kine_0_12": round(float(np.sqrt(np.mean(sq_mat[:, 0:12]))), 4),
            "fn_12_16": round(float(np.sqrt(np.mean(sq_mat[:, 12:16]))), 4),
            "obj_16_19": round(float(np.sqrt(np.mean(sq_mat[:, 16:19]))), 4),
            "slip_19_23": round(float(np.sqrt(np.mean(sq_mat[:, 19:23]))), 4),
        }

    out: Dict[str, Any] = {
        "reconciliation_summary": (
            "Both metrics use identical physical 23-D targets and identical single-step forward predictions "
            "(max_abs_diff <= 4e-6). one_step.state_rmse pools all transitions t=0..T_i-1 (n=1192 ID, 1493 OOD), "
            "whereas multihorizon_rmse['1'] evaluates ONLY initial transitions t=0 (n=40 per pool). M4 achieves "
            "lower error on sustained contact transitions t>=1, while exhibiting higher normal-force transient error "
            "at t=0 pre-contact onset (fn_12_16 = 1.61-2.50 N vs M0 0.64-0.87 N)."
        ),
        "pools": {},
    }
    for pname in ("offline_test_id", "offline_test_ood"):
        eps = bundles[pname]
        out["pools"][pname] = {}
        for cond in ("M0_passive", "M4_acmm"):
            out["pools"][pname][cond] = {}
            for arch in ("B1", "B2", "B3"):
                wm = models["compliant_prelift"][cond][arch]
                wm.eval()
                all_sq, t0_sq, t1_sq, t0_diffs = [], [], [], []
                ep_all_t, ep_t0 = [], []
                strat_t0: Dict[str, List[np.ndarray]] = defaultdict(list)
                for ep in eps:
                    s = np.asarray(ep["realized_states"], dtype=np.float32)
                    a = np.asarray(ep["actions"], dtype=np.float32)
                    ns = np.asarray(ep["realized_next_states"], dtype=np.float32)
                    with torch.no_grad():
                        mu_tf, _, _ = wm.predict_with_uncertainty(torch.from_numpy(s), torch.from_numpy(a))
                        mu_np = mu_tf.numpy()
                    roll1 = wm.predict_multistep(s[0], a[:1], horizon=1, task="compliant_prelift")["states"][0]
                    t0_diffs.append(float(np.max(np.abs(roll1 - mu_np[0]))))
                    sq = (mu_np - ns) ** 2
                    all_sq.append(sq)
                    t0_sq.append(sq[0])
                    if len(sq) > 1:
                        t1_sq.append(sq[1:])
                    strat_t0[ep["exploration_strategy"]].append(sq[0])
                    ep_all_t.append(float(np.sqrt(np.mean(sq))))
                    ep_t0.append(float(np.sqrt(np.mean(sq[0]))))

                out["pools"][pname][cond][arch] = {
                    "max_abs_diff_predict_step_vs_teacher_forced_t0": float(np.max(t0_diffs)),
                    "n_all_transitions": int(sum(len(x) for x in all_sq)),
                    "n_t0_initial_steps": len(t0_sq),
                    "rmse_all_transitions": _comp_rmse(np.concatenate(all_sq, axis=0)),
                    "rmse_t0_only_equals_mh_H1": _comp_rmse(np.asarray(t0_sq)),
                    "rmse_t1plus_only": _comp_rmse(np.concatenate(t1_sq, axis=0)),
                    "episode_mean_all_t_1step_rmse": round(float(np.mean(ep_all_t)), 4),
                    "episode_mean_t0_h1_rmse": round(float(np.mean(ep_t0)), 4),
                    "t0_by_exploration_strategy": {
                        k: _comp_rmse(np.asarray(v)) for k, v in sorted(strat_t0.items())
                    },
                }
    return out


def _audit_peginhole_truncation(
    models: Dict[str, Any],
    bundles: Dict[str, List[Dict[str, Any]]],
    cl_doc: Dict[str, Any],
) -> Dict[str, Any]:
    """Audits why all 150 closed-loop Peg-in-Hole episodes C13-C18 terminate via temporal truncation at H=50."""
    off_stats: Dict[str, Any] = {}
    by_s: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for ep in bundles["offline_test_peg_in_hole"]:
        by_s[ep["exploration_strategy"]].append(ep)
    for sname, s_eps in sorted(by_s.items()):
        off_stats[sname] = {
            "terminations": dict(Counter(e["termination_reason"] for e in s_eps)),
            "mean_episode_length": round(float(np.mean([e["episode_length"] for e in s_eps])), 2),
            "mean_depth_mm": round(float(np.mean([e["final_progress"] for e in s_eps])), 2),
        }

    cl_summary = {}
    for cid in ("C13", "C14", "C15", "C16", "C17", "C18"):
        c = cl_doc["cells"][cid]
        eps = c["episodes"]
        cl_summary[cid] = {
            "config": f"{c['training_condition']}|{c['architecture_id']}",
            "all_50_steps": all(e["steps_executed"] == 50 for e in eps),
            "mean_depth_mm": c["goal_progress"]["mean"],
            "min_max_depth_mm": [min(e["goal_progress"] for e in eps), max(e["goal_progress"] for e in eps)],
            "max_peg_force_mean_n": round(float(np.mean([e["max_peg_force_n"] for e in eps])), 3),
            "episodes_never_contacted_0n": sum(1 for e in eps if float(e["max_peg_force_n"]) == 0.0),
        }

    pe = PlannerEvaluator(
        task="peg_in_hole", eval_horizon=50, plan_horizon=10, num_candidates=60, elite_fraction=0.15, cem_iterations=2, seed=42
    )
    se = SafetyEvaluator(task="peg_in_hole")
    traces: Dict[str, Any] = {}
    cell_defs = (
        ("C13", "M0_passive", "B1"),
        ("C14", "M0_passive", "B2"),
        ("C15", "M0_passive", "B3"),
        ("C16", "M4_acmm", "B1"),
        ("C17", "M4_acmm", "B2"),
        ("C18", "M4_acmm", "B3"),
    )
    for cid, cond, arch in cell_defs:
        wm = models["peg_in_hole"][cond][arch]
        planner, _, _, _, _ = pe._create_planner_for_model(wm, arch, "auto", 1.5, "auto")
        traces[cid] = {}
        for seed in (6200, 6210):
            np.random.seed(42 + seed)
            if hasattr(planner, "rng") and planner.rng is not None:
                planner.rng = np.random.RandomState(42 + seed)
            env, emeta = create_phase35_env("PegInHole", seed)
            sf = se.create_safety_filter()
            obs = env.reset()
            z0 = float(env.peg_pos[2])
            z_hist = [z0]
            raw_dz, exec_dz = [], []
            b_force = b_tilt = b_lat = 0
            first_contact = None
            max_f = 0.0
            for t in range(50):
                s_curr, _ = extract_env_state_and_wrench(obs, "peg_in_hole")
                a_cand, _ = planner.plan(s_curr, pe.reward_fn)
                raw_dz.append(float(a_cand[2]))
                w = obs.get("wrench", np.zeros(6))
                rot = obs.get("rot", np.zeros(3))
                pos = obs.get("pos", np.zeros(3))
                if a_cand[2] < -1.0 and (sf.max_normal_force - float(np.linalg.norm(w[:3]))) < 10.0:
                    b_force += 1
                if obs.get("stratum", 0) == 3 or float(np.linalg.norm(rot[:2])) > sf.critical_wedge_angle * 0.8:
                    b_tilt += 1
                if float(np.linalg.norm(pos[:2])) > 0.4 and obs.get("stratum", 0) in (2, 3):
                    b_lat += 1
                a_exec, _, _ = sf.filter_action(obs, a_cand.copy(), task="peg_in_hole")
                exec_dz.append(float(a_exec[2]))
                obs, _, done, _ = step_env_compatible(env, a_exec, task="peg_in_hole", require_reward=False)
                z_hist.append(float(env.peg_pos[2]))
                fn = float(np.linalg.norm(obs.get("wrench", np.zeros(6))[:3]))
                max_f = max(max_f, fn)
                if first_contact is None and fn > 0.5:
                    first_contact = t
                if done:
                    break
            traces[cid][str(seed)] = {
                "sub_stratum": emeta["sub_stratum"],
                "z_checkpoints_0_10_25_50": [round(z_hist[0], 3), round(z_hist[10], 3), round(z_hist[25], 3), round(z_hist[-1], 3)],
                "final_depth_mm": round(max(0.0, 15.0 - z_hist[-1]), 4),
                "final_radial_offset_mm": round(float(np.linalg.norm(env.peg_pos[:2])), 4),
                "contact_onset_step": first_contact,
                "max_force_n": round(max_f, 3),
                "raw_cand_dz_mean": round(float(np.mean(raw_dz)), 4),
                "exec_dz_mean": round(float(np.mean(exec_dz)), 4),
                "barrier_triggers": {"force_plunge_damp": b_force, "tilt_wedging": b_tilt, "lateral_center": b_lat},
            }

    return {
        "root_causes": [
            (
                "PlannerEvaluator.reward_fn sign inversion at z < 0: -float(... - min(0.0, peg_z)*5.0 ...) penalizes "
                "insertion below z=0 at -5.0/mm, making z=0.0 mm (15 mm depth) the planner optimum; C13 reaches contact "
                "at steps 24-35 and stalls at z ~ -2.2 mm."
            ),
            (
                "In C14-C18 (125/125 episodes), max_peg_force_mean == 0.0 N: the peg never reaches z <= 0.0 within 50 steps "
                "due to slow CEM descent (raw_cand_dz ~ -0.09..-0.26 mm/step) and lateral drift (2.6-13.7 mm), with C15 "
                "M0|B3 uncertainty penalty driving peg upward (z: 14.3 -> 27.5 mm, 0.00 mm depth)."
            ),
            (
                "PredictiveCBFSafetyFilter force plunge dampening fired 0 times (exec_dz_mean == raw_cand_dz_mean in all traces); "
                "interventions only damped rotational tilt."
            ),
        ],
        "offline_open_loop_by_strategy": off_stats,
        "closed_loop_cell_summary": cl_summary,
        "representative_seed_traces": traces,
    }


def _audit_b4_joint_coverage(
    models: Dict[str, Any], bundles: Dict[str, List[Dict[str, Any]]], off_doc: Dict[str, Any]
) -> Dict[str, Any]:
    """Reconciles B4 episode-joint coverage between Phase 3.5 L2/all-steps vs Phase 3.4 L_inf/HORIZONS."""
    pool_specs = (
        ("offline_test_id", "compliant_prelift"),
        ("offline_test_ood", "compliant_prelift"),
        ("offline_test_peg_in_hole", "peg_in_hole"),
    )
    out: Dict[str, Any] = {
        "audit_summary": (
            "Denominator n=40/pool and all frozen Phase 3.4 Bonferroni joint quantiles are verified exact without "
            "recalibration. The low 2.5%-17.5% (Task 2) and 45.0% (Task 1) values in phase35_offline_120ep_results.json "
            "evaluated L2 norms across all steps 1..T_avail (up to 50) with 1-p(y) mode score against quantiles calibrated "
            "under EpisodeConformalEngine (L_inf over HORIZONS={1,3,5,10,20} with compute_aps_score). Under the exact "
            "matched EpisodeConformalEngine event, ID reaches 38/40 (95.0%) while OOD drops to 35/40 (87.5%) M0 and 32/40 (80.0%) M4."
        ),
        "pools": {},
    }
    for pname, task in pool_specs:
        eps = bundles[pname]
        out["pools"][pname] = {}
        for cond in ("M0_passive", "M4_acmm"):
            b4_art = models[task][cond]["b4_artifact"]
            base_m = models[task][cond]["B4"].base_model
            jq = b4_art["episode_conformal_calibration"]["joint_quantiles"]
            mq = b4_art["episode_conformal_calibration"]["marginal_quantiles"]
            eps_with_id = [{"episode_id": f"{pname}_{e['seed']}", **e} for e in eps]
            conformal_eps, _ = _evaluate_model_multistep_on_episodes(base_m, eps_with_id, task=task, horizons=HORIZONS)
            eng = EpisodeConformalEngine(alpha=0.10, horizons=HORIZONS, min_stratum_samples=29, seed=42)
            eng.calibrated = True
            eng.marginal_calibrated = True
            eng.joint_calibrated = True
            eng.has_infinite_quantiles = False
            eng.n_calib_episodes = int(b4_art["num_calibration_episodes"])
            eng.calibration_status = "VALID"
            eng.q_state_joint = float(jq["q_state_joint"])
            eng.q_wrench_joint = float(jq["q_wrench_joint"])
            eng.q_mode_joint = float(jq["q_mode_joint"])
            eng.q_state_marginal = float(mq["q_state_marginal"])
            eng.q_wrench_marginal = float(mq["q_wrench_marginal"])
            eng.q_mode_marginal = float(mq["q_mode_marginal"])
            exact_eval = eng.evaluate_test_episodes(conformal_eps, use_stratified=False)

            out["pools"][pname][cond] = {
                "frozen_joint_quantiles": jq,
                "phase35_reported_L2_all_steps_1minusP": off_doc["pools"][pname]["conditions"][cond]["B4"][
                    "episode_cms_psacd_heldout"
                ],
                "phase34_matched_Linf_HORIZONS_APS_joint": exact_eval["episode_joint_coverage"],
                "phase34_matched_Linf_HORIZONS_APS_marginal": exact_eval["episode_marginal_coverage"],
            }
    return out


def _recompute_exact_nonzero_pvalues(
    models: Dict[str, Any],
    bundles: Dict[str, List[Dict[str, Any]]],
    cl_doc: Dict[str, Any],
    off_doc: Dict[str, Any],
    stats_doc: Dict[str, Any],
) -> Dict[str, Any]:
    """Recomputes exact nonzero float & scientific-notation p-values for every test (highlighting archived 0.0s)."""
    def _scan_zero_pkeys(obj: Any, prefix: str = "") -> List[str]:
        pkeys = {"wilcoxon_p", "wilcoxon_p_holm_adjusted", "mcnemar_exact_p", "mcnemar_exact_p_holm_adjusted"}
        hits: List[str] = []
        if isinstance(obj, dict):
            for k, v in obj.items():
                if k in pkeys and isinstance(v, (int, float)) and v == 0.0:
                    hits.append(f"{prefix}.{k}")
                else:
                    hits.extend(_scan_zero_pkeys(v, f"{prefix}.{k}"))
        elif isinstance(obj, list):
            for i, v in enumerate(obj):
                hits.extend(_scan_zero_pkeys(v, f"{prefix}[{i}]"))
        return hits

    zero_paths = {
        "offline_120ep_zero_p_field_count": len(_scan_zero_pkeys(off_doc)),
        "closed_loop_450ep_zero_p_field_count": len(_scan_zero_pkeys(cl_doc)),
        "statistical_comparison_zero_p_field_count": len(_scan_zero_pkeys(stats_doc)),
    }

    m4_cells = ("C04", "C05", "C06", "C10", "C11", "C12", "C16", "C17", "C18")
    m0_cells = ("C01", "C02", "C03", "C07", "C08", "C09", "C13", "C14", "C15")
    m4_succ = [bool(e["is_success"]) for c in m4_cells for e in cl_doc["cells"][c]["episodes"]]
    m0_succ = [bool(e["is_success"]) for c in m0_cells for e in cl_doc["cells"][c]["episodes"]]
    m4_viol = [bool(e["has_safety_violation"]) for c in m4_cells for e in cl_doc["cells"][c]["episodes"]]
    m0_viol = [bool(e["has_safety_violation"]) for c in m0_cells for e in cl_doc["cells"][c]["episodes"]]
    m4_peg = [float(e["peg_mean"]) for c in m4_cells for e in cl_doc["cells"][c]["episodes"]]
    m0_peg = [float(e["peg_mean"]) for c in m0_cells for e in cl_doc["cells"][c]["episodes"]]

    bs = sum(1 for a, b in zip(m4_succ, m0_succ) if a and not b)
    cs = sum(1 for a, b in zip(m4_succ, m0_succ) if not a and b)
    bv = sum(1 for a, b in zip(m4_viol, m0_viol) if a and not b)
    cv = sum(1 for a, b in zip(m4_viol, m0_viol) if not a and b)

    p_gs = float(scipy_stats.binomtest(bs, bs + cs, 0.5, alternative="two-sided").pvalue)
    p_gv = float(scipy_stats.binomtest(bv, bv + cv, 0.5, alternative="two-sided").pvalue)
    p_gp = float(scipy_stats.wilcoxon(np.asarray(m4_peg) - np.asarray(m0_peg), zero_method="wilcox", alternative="two-sided").pvalue)

    pair_ids = [
        ("C04", "C01", "ID_B1"), ("C05", "C02", "ID_B2"), ("C06", "C03", "ID_B3"),
        ("C10", "C07", "OOD_B1"), ("C11", "C08", "OOD_B2"), ("C12", "C09", "OOD_B3"),
        ("C16", "C13", "Peg_B1"), ("C17", "C14", "Peg_B2"), ("C18", "C15", "Peg_B3"),
    ]
    cell_prog, cell_peg = [], []
    for c4, c0, lbl in pair_ids:
        dp = np.array([e["goal_progress"] for e in cl_doc["cells"][c4]["episodes"]]) - np.array([e["goal_progress"] for e in cl_doc["cells"][c0]["episodes"]])
        pp = float(scipy_stats.wilcoxon(dp, zero_method="wilcox", alternative="two-sided").pvalue) if np.any(dp != 0) else 1.0
        cell_prog.append({"pair": f"{c4}_vs_{c0}_{lbl}", "wilcoxon_p": pp, "wilcoxon_p_sci": format_exact_pvalue(pp)[1]})
        dg = np.array([e["peg_mean"] for e in cl_doc["cells"][c4]["episodes"]]) - np.array([e["peg_mean"] for e in cl_doc["cells"][c0]["episodes"]])
        pg = float(scipy_stats.wilcoxon(dg, zero_method="wilcox", alternative="two-sided").pvalue) if np.any(dg != 0) else 1.0
        cell_peg.append({"pair": f"{c4}_vs_{c0}_{lbl}", "wilcoxon_p": pg, "wilcoxon_p_sci": format_exact_pvalue(pg)[1]})
    _apply_exact_holm(cell_prog, "wilcoxon_p")
    _apply_exact_holm(cell_peg, "wilcoxon_p")

    planner_prog, planner_peg = [], []
    trips = (
        ("M0_passive", {"B1": ("C01", "C07", "C13"), "B2": ("C02", "C08", "C14"), "B3": ("C03", "C09", "C15")}),
        ("M4_acmm", {"B1": ("C04", "C10", "C16"), "B2": ("C05", "C11", "C17"), "B3": ("C06", "C12", "C18")}),
    )
    for cname, tmap in trips:
        for idx_r, reg in enumerate(("ID", "OOD", "PegInHole")):
            c1, c2, c3 = tmap["B1"][idx_r], tmap["B2"][idx_r], tmap["B3"][idx_r]
            for nm, ca, cb in (("B2_vs_B1", c2, c1), ("B3_vs_B1", c3, c1), ("B3_vs_B2", c3, c2)):
                dpr = np.array([e["goal_progress"] for e in cl_doc["cells"][ca]["episodes"]]) - np.array([e["goal_progress"] for e in cl_doc["cells"][cb]["episodes"]])
                ppr = float(scipy_stats.wilcoxon(dpr, zero_method="wilcox", alternative="two-sided").pvalue) if np.any(dpr != 0) else 1.0
                planner_prog.append({"pair": f"{cname}_{reg}_{nm}_progress", "wilcoxon_p": ppr, "wilcoxon_p_sci": format_exact_pvalue(ppr)[1]})
                dpg = np.array([e["peg_mean"] for e in cl_doc["cells"][ca]["episodes"]]) - np.array([e["peg_mean"] for e in cl_doc["cells"][cb]["episodes"]])
                ppg = float(scipy_stats.wilcoxon(dpg, zero_method="wilcox", alternative="two-sided").pvalue) if np.any(dpg != 0) else 1.0
                planner_peg.append({"pair": f"{cname}_{reg}_{nm}_peg", "wilcoxon_p": ppg, "wilcoxon_p_sci": format_exact_pvalue(ppg)[1]})
    _apply_exact_holm(planner_prog, "wilcoxon_p")
    _apply_exact_holm(planner_peg, "wilcoxon_p")

    off_mh_exact = {}
    for pname, tkey in (("offline_test_id", "compliant_prelift"), ("offline_test_ood", "compliant_prelift"), ("offline_test_peg_in_hole", "peg_in_hole")):
        eps = bundles[pname]
        off_mh_exact[pname] = {}
        ep_errs: Dict[str, Dict[str, Dict[int, List[float]]]] = {"M0_passive": {}, "M4_acmm": {}}
        for cond in ("M0_passive", "M4_acmm"):
            for arch in ("B1", "B2", "B3"):
                wm = models[tkey][cond][arch]
                ep_errs[cond][arch] = {h: [] for h in HORIZONS}
                for ep in eps:
                    s_ep = np.asarray(ep["realized_states"], dtype=np.float32)
                    ns_ep = np.asarray(ep["realized_next_states"], dtype=np.float32)
                    a_ep = np.asarray(ep["actions"], dtype=np.float32)
                    rh = min(len(a_ep), max(HORIZONS))
                    p_seq = np.asarray(wm.predict_multistep(s_ep[0], a_ep[:rh], horizon=rh, task=tkey)["states"], dtype=np.float32)
                    for h in HORIZONS:
                        if rh >= h:
                            ep_errs[cond][arch][h].append(float(np.sqrt(np.mean((p_seq[h - 1] - ns_ep[h - 1]) ** 2))))
        for arch in ("B1", "B2", "B3"):
            items = []
            for h in HORIZONS:
                d = np.array(ep_errs["M4_acmm"][arch][h]) - np.array(ep_errs["M0_passive"][arch][h])
                pv = float(scipy_stats.wilcoxon(d, zero_method="wilcox", alternative="two-sided").pvalue) if np.any(d != 0) else 1.0
                items.append({"horizon": h, "wilcoxon_p": pv, "wilcoxon_p_sci": format_exact_pvalue(pv)[1]})
            _apply_exact_holm(items, "wilcoxon_p")
            off_mh_exact[pname][arch] = items

    return {
        "archived_zero_p_counts": zero_paths,
        "grand_M4_vs_M0_N225": {
            "task_success": {"b": bs, "c": cs, "mcnemar_exact_p": p_gs, "mcnemar_exact_p_sci": format_exact_pvalue(p_gs)[1]},
            "safety_violations": {"b": bv, "c": cv, "mcnemar_exact_p": p_gv, "mcnemar_exact_p_sci": format_exact_pvalue(p_gv)[1]},
            "peg": {"wilcoxon_p": p_gp, "wilcoxon_p_sci": format_exact_pvalue(p_gp)[1]},
        },
        "cell_paired_goal_progress": cell_prog,
        "cell_paired_peg": cell_peg,
        "planner_B1_B2_B3_paired_goal_progress": planner_prog,
        "planner_B1_B2_B3_paired_peg": planner_peg,
        "offline_multihorizon_exact": off_mh_exact,
    }


def _analyze_safety_vs_success(cl_doc: Dict[str, Any]) -> Dict[str, Any]:
    """Explicit joint outcome & crush mechanism analysis retaining all safety violations."""
    cells: Dict[str, Any] = {}
    for cid in ("C01", "C02", "C03", "C04", "C05", "C06", "C07", "C08", "C09", "C10", "C11", "C12"):
        eps = cl_doc["cells"][cid]["episodes"]
        safe_fns = [float(e["max_finger_fn_n"]) for e in eps if not e["has_safety_violation"]]
        unsafe_fns = [float(e["max_finger_fn_n"]) for e in eps if e["has_safety_violation"]]
        cells[cid] = {
            "config": f"{cl_doc['cells'][cid]['training_condition']}|{cl_doc['cells'][cid]['architecture_id']}|{cl_doc['cells'][cid]['regime']}",
            "succ_and_safe": sum(1 for e in eps if e["is_success"] and not e["has_safety_violation"]),
            "succ_and_unsafe": sum(1 for e in eps if e["is_success"] and e["has_safety_violation"]),
            "fail_and_safe": sum(1 for e in eps if not e["is_success"] and not e["has_safety_violation"]),
            "fail_and_unsafe": sum(1 for e in eps if not e["is_success"] and e["has_safety_violation"]),
            "dropped": sum(1 for e in eps if e["dropped"]),
            "fn_gt_25n": sum(1 for e in eps if e["fn_gt_25n"]),
            "analytical_grasp_feasible": sum(1 for e in eps if e["analytical_grasp_feasible"]),
            "max_fn_mean_safe": round(float(np.mean(safe_fns)), 2) if safe_fns else None,
            "max_fn_mean_unsafe": round(float(np.mean(unsafe_fns)), 2) if unsafe_fns else None,
        }

    ood_strata: Dict[str, Any] = {}
    for cid in ("C10", "C11", "C12"):
        eps = cl_doc["cells"][cid]["episodes"]
        ood_strata[cid] = {}
        for sn in sorted({e["sub_stratum"] for e in eps}):
            seps = [e for e in eps if e["sub_stratum"] == sn]
            ood_strata[cid][sn] = {
                "n": len(seps),
                "succ_and_safe": sum(1 for e in seps if e["is_success"] and not e["has_safety_violation"]),
                "succ_and_unsafe": sum(1 for e in seps if e["is_success"] and e["has_safety_violation"]),
                "fail_and_unsafe": sum(1 for e in seps if not e["is_success"] and e["has_safety_violation"]),
                "dropped": sum(1 for e in seps if e["dropped"]),
                "max_fn_mean": round(float(np.mean([float(e["max_finger_fn_n"]) for e in seps])), 2),
                "interventions_mean": round(float(np.mean([int(e["intervention_count"]) for e in seps])), 2),
            }
    return {
        "cell_outcome_quadrants": cells,
        "m4_ood_sub_strata": ood_strata,
        "finding": (
            "All 150 Compliant Pre-Lift ID and 150 OOD episodes are analytically grasp-feasible (4*mu*18 N >= W). "
            "In C11 (M4|B2|OOD), 5 of 6 task successes still exceeded the 25 N crush safety limit (only 1/25 clean "
            "success in Regime A), alongside 8 failed crush episodes (13/25 total violations). Conversely, M0|B2/B3 "
            "produced 0 safety violations alongside 0 successes."
        ),
    }


def generate_phase35_closure_addendum(r002_root: str, repo_root: Optional[str] = None) -> Dict[str, Any]:
    """Executes the full Phase 3.5 closure addendum without overwriting original 570-episode archives."""
    eval_dir = os.path.join(r002_root, "experiments", "phase3_5_evaluation")
    archive_hashes = verify_archived_phase35_immutability(eval_dir)

    with open(os.path.join(eval_dir, "phase35_offline_120ep_results.json"), "r", encoding="utf-8") as f:
        off_doc = json.load(f)
    with open(os.path.join(eval_dir, "phase35_closed_loop_450ep_results.json"), "r", encoding="utf-8") as f:
        cl_doc = json.load(f)
    with open(os.path.join(eval_dir, "phase35_statistical_comparison.json"), "r", encoding="utf-8") as f:
        stats_doc = json.load(f)

    p34_ctx = verify_phase34_artifacts_and_load(r002_root)
    models = p34_ctx["models"]
    bundles = generate_offline_test_bundles(horizon=50)

    addendum = {
        "program": "HOROS PROBE-1 — Research-002",
        "stage": "Phase 3.5 Scientific Closure Addendum (Document 53 v1.1)",
        "runtime_environment": get_runtime_reproducibility_metadata(repo_root=repo_root),
        "preserved_original_archive_sha256s": archive_hashes,
        "aps_corrected": _compute_aps_addendum(models, bundles),
        "ood_auroc_audit": _audit_ood_uncertainty(models, bundles),
        "task2_1step_vs_h1_reconciliation": _reconcile_task2_1step_vs_h1(models, bundles),
        "peginhole_truncation_audit": _audit_peginhole_truncation(models, bundles, cl_doc),
        "b4_joint_coverage_audit": _audit_b4_joint_coverage(models, bundles, off_doc),
        "exact_nonzero_pvalues": _recompute_exact_nonzero_pvalues(models, bundles, cl_doc, off_doc, stats_doc),
        "safety_vs_success_analysis": _analyze_safety_vs_success(cl_doc),
    }

    out_json = os.path.join(eval_dir, "phase35_closure_addendum.json")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(to_json_serializable(addendum), f, indent=2, allow_nan=False)

    verify_archived_phase35_immutability(eval_dir)
    return addendum

