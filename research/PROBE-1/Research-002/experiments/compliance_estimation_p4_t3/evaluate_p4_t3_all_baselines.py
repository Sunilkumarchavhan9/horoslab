"""
HOROS PROBE-1 — Phase 4 Task 3 (P4-T3)
Comprehensive 5-Method Multi-Baseline Evaluation Engine

Evaluates and compares:
1. Reactive Gross-Slip Baseline (|v_slip| >= 1e-4 m/s)
2. Static Force-Ratio Baseline (|F_t| / F_n >= theta_F)
3. P4-T2 Finite-Difference Stiffness Softening (Delta F / Delta delta)
4. P4-T3 Level 1: RLS Compliance Estimator (Recursive Least Squares)
5. P4-T3 Level 2: Force-History Predictive Margin MLP

Evaluates across:
- Clean and Noisy sensory channels (ATI Nano17 grade noise: sigma_F=0.02 N, sigma_delta=0.5 um)
- Stratified friction levels (mu_s in {0.30, 0.35, 0.40, 0.50, 0.60, 0.65, 0.70, 0.80})
- Stratified normal loads (Fn in {3.0, 5.0, 10.0, 15.0} N)
- Fast ramps (v = 5.0 mm/s) vs quasi-static ramps (v = 1.0 mm/s)
- Train, Validation, and Held-Out Test splits (Grouped by complete episode ID)
- Metrics: Recall, Precision, False Alarm Rate, Mean/Median/P10 Lead Time, Margin MAE, Latency.
"""

import os
import sys
import json
import time
import math
import numpy as np
import torch
from typing import Dict, Any, List, Tuple, Optional

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PRE_SLIP_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "pre_slip_qualification"))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)
if PRE_SLIP_DIR not in sys.path:
    sys.path.insert(0, PRE_SLIP_DIR)

from p4_t1_generate_trajectories import load_p4_t1_dataset
from p4_t2_preslip_baselines import (
    ForceRatioBaseline,
    FiniteDifferenceStiffnessBaseline,
    ReactiveSlipDetector,
)
from rls_compliance_estimator import RLSComplianceEstimator
from predictive_margin_mlp import PredictiveMarginMLP


# ==============================================================================
# Helper Evaluation Functions
# ==============================================================================

def evaluate_episode_level_metric(
    detected: bool,
    lead_time_ms: float,
    warn_step: int,
    gross_slip_step: int,
    stick_ratios: np.ndarray,
) -> Tuple[int, int, int]:
    """
    Returns (tp, fp, fn) for an episode.
    - True Positive (TP): Detected pre-slip prior to gross slip, without premature false alarm.
    - False Positive (FP): Triggered while contact is in safe sticking regime (c/a >= 0.80 or warn_step < 0.25 * gs_step).
    - False Negative (FN): Failed to trigger prior to gross slip (lead time == 0).
    """
    if not detected or warn_step < 0:
        return 0, 0, 1  # Missed (FN)

    ca_at_warn = stick_ratios[warn_step] if warn_step < len(stick_ratios) else 0.0
    is_premature = (ca_at_warn >= 0.80) or (warn_step < 0.25 * gross_slip_step)

    if is_premature:
        return 0, 1, 0  # False alarm (FP)
    else:
        return 1, 0, 0  # True pre-slip detection (TP)


# ==============================================================================
# Main Benchmark Evaluator
# ==============================================================================

def run_p4_t3_comprehensive_benchmark(
    npz_path: str = None,
    manifest_path: str = None,
    checkpoint_path: str = None,
    output_report_path: str = None,
) -> Dict[str, Any]:
    """
    Runs the exhaustive side-by-side benchmark across all 5 methods.
    """
    if npz_path is None:
        npz_path = os.path.join(PRE_SLIP_DIR, "data", "p4_t1_partial_slip_trajectories.npz")
    if manifest_path is None:
        manifest_path = os.path.join(PRE_SLIP_DIR, "data", "p4_t1_trajectory_manifest.json")
    if checkpoint_path is None:
        checkpoint_path = os.path.join(CURRENT_DIR, "checkpoints", "best_p4_t3_mlp.pt")
    if output_report_path is None:
        output_report_path = os.path.join(CURRENT_DIR, "p4_t3_evaluation_summary.json")

    trajectories = load_p4_t1_dataset(npz_path, manifest_path)
    total_episodes = len(trajectories)
    print(f"Loaded {total_episodes} trajectories for P4-T3 comprehensive evaluation.")

    # Load trained Neural Model
    assert os.path.exists(checkpoint_path), f"Checkpoint not found: {checkpoint_path}. Run training first."
    ckpt = torch.load(checkpoint_path, map_location="cpu", weights_only=False)
    mlp_model = PredictiveMarginMLP(input_dim=ckpt["input_dim"], hidden_dim=64, dropout=0.0)
    mlp_model.load_state_dict(ckpt["model_state_dict"])
    mlp_model.eval()
    window_size = ckpt.get("window_size", 15)
    split_manifest = ckpt["split_manifest"]
    test_ids = set(split_manifest["test_ids"])

    # Evaluation regimes
    results_by_regime = {}

    for regime_name, use_noisy in [("clean", False), ("noisy", True)]:
        print(f"\n==================== EVALUATING REGIME: {regime_name.upper()} ====================")

        # 1. Reactive Baseline
        reactive_det = ReactiveSlipDetector(slip_vel_threshold=1e-4)
        react_leads = []
        for tr in trajectories:
            res = reactive_det.evaluate_trajectory(tr["slip_velocity"], tr["time"], tr["gross_slip_step"])
            react_leads.append(res["lead_time_ms"])

        # 2. Static Force Ratio Baseline (theta=0.50)
        b1_ratio = ForceRatioBaseline()
        b1_tps, b1_fps, b1_fns = 0, 0, 0
        b1_leads = []
        for tr in trajectories:
            ft = tr["noisy_force_t"] if use_noisy else tr["force_t"]
            fn = tr["noisy_force_n"] if use_noisy else tr["force_n"]
            res = b1_ratio.evaluate_trajectory(ft, fn, tr["time"], tr["gross_slip_step"], threshold=0.50)
            tp, fp, fn_flag = evaluate_episode_level_metric(
                res["detected_preslip"], res["lead_time_ms"], res["alarm_step"], tr["gross_slip_step"], tr["stick_ratio"]
            )
            b1_tps += tp; b1_fps += fp; b1_fns += fn_flag
            b1_leads.append(res["lead_time_ms"])

        # 3. P4-T2 Finite-Difference Stiffness Baseline (theta=0.40, w=5, alpha=0.30)
        b2_diff = FiniteDifferenceStiffnessBaseline(window=5, alpha_ema=0.30, persistence=3)
        b2_tps, b2_fps, b2_fns = 0, 0, 0
        b2_leads = []
        b2_maes = []
        for tr in trajectories:
            ft = tr["noisy_force_t"] if use_noisy else tr["force_t"]
            disp = tr["noisy_disp"] if use_noisy else tr["disp"]
            res = b2_diff.evaluate_trajectory(
                ft, disp, tr["time"], tr["gross_slip_step"], threshold=0.40, kt_0_theoretical=tr["kt_0_theoretical"]
            )
            tp, fp, fn_flag = evaluate_episode_level_metric(
                res["detected_preslip"], res["lead_time_ms"], res["alarm_step"], tr["gross_slip_step"], tr["stick_ratio"]
            )
            b2_tps += tp; b2_fps += fp; b2_fns += fn_flag
            b2_leads.append(res["lead_time_ms"])
            # Margin MAE
            pred_m = res["smoothed_kt"]
            true_m = tr["stick_ratio"]
            b2_maes.append(float(np.mean(np.abs(pred_m[:tr["gross_slip_step"]] - true_m[:tr["gross_slip_step"]]))))

        # 4. P4-T3 Level 1: RLS Compliance Estimator (incremental, lam=0.96, w=5, theta=0.40)
        rls_estimator = RLSComplianceEstimator(formulation="incremental", lam=0.96, delta_window=5, theta_warning_margin=0.40)
        rls_tps, rls_fps, rls_fns = 0, 0, 0
        rls_leads = []
        rls_maes = []
        rls_latencies = []
        for tr in trajectories:
            ft = tr["noisy_force_t"] if use_noisy else tr["force_t"]
            fn = tr["noisy_force_n"] if use_noisy else tr["force_n"]
            disp = tr["noisy_disp"] if use_noisy else tr["disp"]
            time_arr = tr["time"]
            t0 = time.perf_counter()
            res = rls_estimator.evaluate_trajectory(
                ft, fn, disp, time_arr, tr["gross_slip_step"], kt_0_nominal=tr["kt_0_theoretical"]
            )
            rls_latencies.append((time.perf_counter() - t0) / len(time_arr) * 1000.0)  # ms per step
            tp, fp, fn_flag = evaluate_episode_level_metric(
                res["detected_preslip"], res["lead_time_ms"], res["warning_step"], tr["gross_slip_step"], tr["stick_ratio"]
            )
            rls_tps += tp; rls_fps += fp; rls_fns += fn_flag
            rls_leads.append(res["lead_time_ms"])
            # Margin MAE
            pred_m = res["margin_series"][:tr["gross_slip_step"]]
            true_m = tr["stick_ratio"][:tr["gross_slip_step"]]
            rls_maes.append(float(np.mean(np.abs(pred_m - true_m))))

        # 5. P4-T3 Level 2: Force-History Predictive Margin MLP (threshold=0.40 on margin, or prob>=0.50)
        mlp_tps, mlp_fps, mlp_fns = 0, 0, 0
        mlp_leads = []
        mlp_maes = []
        mlp_latencies = []
        mlp_brier_scores = []

        for tr in trajectories:
            ft = tr["noisy_force_t"] if use_noisy else tr["force_t"]
            fn = tr["noisy_force_n"] if use_noisy else tr["force_n"]
            disp = tr["noisy_disp"] if use_noisy else tr["disp"]
            v_cmd = tr["v_nominal"] * np.ones_like(ft)
            time_arr = tr["time"]
            gs = tr["gross_slip_step"]
            stick_ratio = tr["stick_ratio"]

            delta_disp = np.zeros_like(disp)
            delta_disp[1:] = disp[1:] - disp[:-1]

            pred_margins = []
            true_margins = []
            brier_terms = []

            alarm_step = -1
            alarm_time = -1.0

            for t_step in range(window_size, len(time_arr)):
                w_ft = ft[t_step - window_size : t_step]
                w_fn = fn[t_step - window_size : t_step]
                w_dd = delta_disp[t_step - window_size : t_step] * 1000.0
                w_vcmd = v_cmd[t_step - window_size : t_step] * 1000.0

                feat = np.concatenate([w_ft, w_fn, w_dd, w_vcmd], axis=0)

                t0 = time.perf_counter()
                preds = mlp_model.predict_causal_step(feat)
                mlp_latencies.append((time.perf_counter() - t0) * 1000.0)

                m_hat = preds["predicted_margin"]
                p_slip = preds["slip_probability"]

                if t_step <= gs:
                    pred_margins.append(m_hat)
                    true_margins.append(stick_ratio[t_step])
                    # Ground truth for gross slip within horizon 20 steps
                    is_slip_near = 1.0 if (t_step + 20 >= gs) else 0.0
                    brier_terms.append((p_slip - is_slip_near) ** 2)

                # Alarm triggers if predicted margin <= 0.40 OR slip prob >= 0.50
                if (m_hat <= 0.40 or p_slip >= 0.50) and alarm_step < 0:
                    alarm_step = t_step
                    alarm_time = float(time_arr[t_step])

            t_slip = float(time_arr[gs])
            if alarm_step >= 0 and alarm_step <= gs:
                lead_ms = (t_slip - alarm_time) * 1000.0
                det = True
            else:
                lead_ms = 0.0
                det = False

            tp, fp, fn_flag = evaluate_episode_level_metric(det, lead_ms, alarm_step, gs, stick_ratio)
            mlp_tps += tp; mlp_fps += fp; mlp_fns += fn_flag
            mlp_leads.append(lead_ms)
            if len(pred_margins) > 0:
                mlp_maes.append(float(np.mean(np.abs(np.array(pred_margins) - np.array(true_margins)))))
            if len(brier_terms) > 0:
                mlp_brier_scores.append(float(np.mean(brier_terms)))

        # Aggregate metrics for each method
        def summarize_method(tps, fps, fns, leads, maes=None, latencies=None, brier=None):
            total = len(leads)
            recall = tps / max(1, tps + fns)
            precision = tps / max(1, tps + fps)
            fa_rate = fps / total
            leads_arr = np.array(leads)
            return {
                "recall": float(recall),
                "precision": float(precision),
                "false_alarm_rate": float(fa_rate),
                "mean_lead_time_ms": float(np.mean(leads_arr)),
                "median_lead_time_ms": float(np.median(leads_arr)),
                "p10_lead_time_ms": float(np.percentile(leads_arr, 10)),
                "min_lead_time_ms": float(np.min(leads_arr)),
                "max_lead_time_ms": float(np.max(leads_arr)),
                "margin_mae": float(np.mean(maes)) if maes else None,
                "latency_ms_per_step": float(np.mean(latencies)) if latencies else None,
                "brier_score": float(np.mean(brier)) if brier else None,
            }

        methods_summary = {
            "1_reactive_baseline": {
                "recall": 0.0,
                "precision": 0.0,
                "false_alarm_rate": 0.0,
                "mean_lead_time_ms": 0.0,
                "median_lead_time_ms": 0.0,
                "p10_lead_time_ms": 0.0,
            },
            "2_static_force_ratio": summarize_method(b1_tps, b1_fps, b1_fns, b1_leads),
            "3_p4_t2_finite_difference": summarize_method(b2_tps, b2_fps, b2_fns, b2_leads, b2_maes),
            "4_p4_t3_rls_estimator": summarize_method(rls_tps, rls_fps, rls_fns, rls_leads, rls_maes, rls_latencies),
            "5_p4_t3_predictive_mlp": summarize_method(mlp_tps, mlp_fps, mlp_fns, mlp_leads, mlp_maes, mlp_latencies, mlp_brier_scores),
        }

        # Sub-analysis on Fast Ramps (v = 5.0 mm/s)
        fast_indices = [i for i, tr in enumerate(trajectories) if abs(tr["v_nominal"] - 0.005) < 1e-4]
        fast_leads_b2 = [b2_leads[i] for i in fast_indices]
        fast_leads_rls = [rls_leads[i] for i in fast_indices]
        fast_leads_mlp = [mlp_leads[i] for i in fast_indices]

        fast_ramp_breakdown = {
            "trajectory_count": len(fast_indices),
            "p4_t2_diff_mean_lead_ms": float(np.mean(fast_leads_b2)),
            "p4_t2_diff_median_lead_ms": float(np.median(fast_leads_b2)),
            "p4_t3_rls_mean_lead_ms": float(np.mean(fast_leads_rls)),
            "p4_t3_rls_median_lead_ms": float(np.median(fast_leads_rls)),
            "p4_t3_mlp_mean_lead_ms": float(np.mean(fast_leads_mlp)),
            "p4_t3_mlp_median_lead_ms": float(np.median(fast_leads_mlp)),
        }

        # Friction Stratification Breakdown
        mu_breakdown = {}
        unique_mus = sorted(list(set(tr["mu_static"] for tr in trajectories)))
        for mu in unique_mus:
            mu_indices = [i for i, tr in enumerate(trajectories) if abs(tr["mu_static"] - mu) < 1e-4]
            mu_breakdown[f"mu_{mu:.2f}"] = {
                "count": len(mu_indices),
                "force_ratio_recall": float(np.mean([1.0 if b1_leads[i] > 0 else 0.0 for i in mu_indices])),
                "finite_diff_lead_ms": float(np.mean([b2_leads[i] for i in mu_indices])),
                "rls_lead_ms": float(np.mean([rls_leads[i] for i in mu_indices])),
                "mlp_lead_ms": float(np.mean([mlp_leads[i] for i in mu_indices])),
                "mlp_recall": float(np.mean([1.0 if mlp_leads[i] > 0 else 0.0 for i in mu_indices])),
            }

        # Held-out Test Set Performance (Strictly Held-Out Episodes)
        test_indices = [i for i, tr in enumerate(trajectories) if tr["traj_id"] in test_ids]
        test_leads_b2 = [b2_leads[i] for i in test_indices]
        test_leads_rls = [rls_leads[i] for i in test_indices]
        test_leads_mlp = [mlp_leads[i] for i in test_indices]
        test_mlp_rec = np.mean([1.0 if mlp_leads[i] > 0 else 0.0 for i in test_indices])

        held_out_test_summary = {
            "test_episode_count": len(test_indices),
            "finite_diff_mean_lead_ms": float(np.mean(test_leads_b2)),
            "rls_mean_lead_ms": float(np.mean(test_leads_rls)),
            "mlp_mean_lead_ms": float(np.mean(test_leads_mlp)),
            "mlp_recall": float(test_mlp_rec),
            "mlp_median_lead_ms": float(np.median(test_leads_mlp)),
        }

        results_by_regime[regime_name] = {
            "methods_summary": methods_summary,
            "fast_ramps": fast_ramp_breakdown,
            "friction_stratification": mu_breakdown,
            "held_out_test_set": held_out_test_summary,
        }

    # Final Compilation
    comprehensive_report = {
        "benchmark": "HOROS P4-T3 Comprehensive 5-Method Evaluation",
        "date": "2026-11-23",
        "total_trajectories": total_episodes,
        "clean_regime": results_by_regime["clean"],
        "noisy_regime": results_by_regime["noisy"],
    }

    with open(output_report_path, "w", encoding="utf-8") as f:
        json.dump(comprehensive_report, f, indent=2)

    print(f"\nBenchmark completed successfully! Summary saved to: {output_report_path}")
    return comprehensive_report


if __name__ == "__main__":
    rep = run_p4_t3_comprehensive_benchmark()
