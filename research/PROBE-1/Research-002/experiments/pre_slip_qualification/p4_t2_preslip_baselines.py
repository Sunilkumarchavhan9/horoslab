"""
HOROS PROBE-1 — Phase 4 Task 2 (P4-T2)
Pre-Slip Baselines Implementation & Comprehensive Evaluation Engine

Implements and evaluates:
1. Baseline 1: Force Ratio Baseline (R_F = |F_t| / (mu_prior * F_n) or raw |F_t| / F_n)
2. Baseline 2: Finite-Difference Tangential Stiffness Softening Baseline (k_t / k_t0)
3. Reference: Reactive Slip Detector (|v_slip| >= 1e-4 m/s, tau_lead = 0 ms)

Evaluates on the canonical P4-T1 partial slip trajectory suite across:
- Lead time distribution (tau_lead in ms, target >= 20 ms)
- Detection rate / Recall at gross slip
- False alarm rate during safe sticking (c/a >= 0.80)
- ROC curves and AUROC
- Robustness across friction uncertainty (mu_s in [0.30, 0.80])
- Robustness across sensor noise (clean vs ATI Nano17 grade noise)
"""

import os
import sys
import math
import json
import numpy as np
from typing import Dict, Any, List, Tuple, Optional

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from p4_t1_generate_trajectories import load_p4_t1_dataset


# ==============================================================================
# 1. Baseline Implementations
# ==============================================================================

class ForceRatioBaseline:
    """
    Baseline 1: Static Force Ratio Pre-Slip Detector
    Fires an alarm when tangential force ratio exceeds a fixed threshold theta.
    
    Can evaluate:
      - Raw ratio: S_1[t] = |F_t[t]| / F_n[t] >= theta_raw
      - Prior-normalized ratio: R_F[t] = |F_t[t]| / (mu_prior * F_n[t]) >= theta_norm
    """
    def __init__(self, mu_prior: Optional[float] = None):
        self.mu_prior = mu_prior

    def compute_score(self, ft: np.ndarray, fn: np.ndarray) -> np.ndarray:
        """
        Computes the pre-slip risk score for each time step.
        """
        fn_safe = np.maximum(fn, 1e-6)
        raw_ratio = np.abs(ft) / fn_safe
        if self.mu_prior is not None and self.mu_prior > 0.0:
            return raw_ratio / self.mu_prior
        return raw_ratio

    def evaluate_trajectory(
        self,
        ft: np.ndarray,
        fn: np.ndarray,
        time: np.ndarray,
        gross_slip_step: int,
        threshold: float,
    ) -> Dict[str, Any]:
        """
        Evaluates a single trajectory at a given threshold.
        """
        score = self.compute_score(ft, fn)
        t_slip = time[gross_slip_step] if gross_slip_step >= 0 else time[-1]

        # Find first step where score >= threshold
        alarm_indices = np.where(score >= threshold)[0]
        if len(alarm_indices) > 0:
            alarm_step = int(alarm_indices[0])
            alarm_time = float(time[alarm_step])
            if alarm_step <= gross_slip_step:
                lead_time_ms = (t_slip - alarm_time) * 1000.0
                detected_preslip = True
            else:
                lead_time_ms = 0.0
                detected_preslip = False
        else:
            alarm_step = -1
            alarm_time = -1.0
            lead_time_ms = 0.0
            detected_preslip = False

        return {
            "alarm_step": alarm_step,
            "alarm_time": alarm_time,
            "lead_time_ms": lead_time_ms,
            "detected_preslip": detected_preslip,
            "scores": score,
        }


class FiniteDifferenceStiffnessBaseline:
    """
    Baseline 2: Finite-Difference Tangential Stiffness Softening Detector
    Estimates instantaneous tangential stiffness k_hat_t = Delta F_t / Delta delta_t,
    normalizes by initial stiffness k_t0, and fires an alarm when softening drops
    below a threshold theta (e.g. k_norm <= theta_softening).
    
    Includes causal smoothing (EMA) and persistence filtering to handle sensor noise.
    """
    def __init__(
        self,
        window: int = 5,
        alpha_ema: float = 0.30,
        persistence: int = 3,
        min_disp_threshold: float = 10e-6,
    ):
        self.window = window
        self.alpha_ema = alpha_ema
        self.persistence = persistence
        self.min_disp_threshold = min_disp_threshold

    def compute_stiffness_trajectory(
        self,
        ft: np.ndarray,
        disp: np.ndarray,
        kt_0_theoretical: Optional[float] = None,
    ) -> Tuple[np.ndarray, np.ndarray, float]:
        """
        Computes instantaneous raw stiffness, smoothed normalized stiffness, and baseline kt_0.
        """
        w = self.window
        N = len(ft)
        if N <= w:
            return np.ones(N), np.ones(N), 1.0

        dF = ft[w:] - ft[:-w]
        dd = disp[w:] - disp[:-w]
        raw_kt = dF / np.maximum(np.abs(dd), 1e-12)

        # Baseline kt_0: median of first few valid estimates, or theoretical
        if kt_0_theoretical is not None and kt_0_theoretical > 0.0:
            kt_0 = kt_0_theoretical
        else:
            valid_init = raw_kt[:max(1, min(10, len(raw_kt)))]
            kt_0 = float(np.median(valid_init))
            if kt_0 <= 0.0:
                kt_0 = 1000.0  # Safe fallback

        norm_kt = raw_kt / kt_0

        # Causal EMA smoothing
        smoothed = np.zeros(N, dtype=np.float64)
        smoothed[:w] = 1.0  # Initially full stick
        s = 1.0
        for i, val in enumerate(norm_kt):
            step_idx = i + w
            s = self.alpha_ema * val + (1.0 - self.alpha_ema) * s
            smoothed[step_idx] = s

        # Score is risk of slip: 1.0 - normalized stiffness (higher means higher risk)
        full_norm_kt = np.ones(N, dtype=np.float64)
        full_norm_kt[w:] = norm_kt
        return full_norm_kt, smoothed, kt_0

    def evaluate_trajectory(
        self,
        ft: np.ndarray,
        disp: np.ndarray,
        time: np.ndarray,
        gross_slip_step: int,
        threshold: float,
        kt_0_theoretical: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Evaluates a single trajectory at a given stiffness softening threshold.
        Alarm fires when smoothed normalized stiffness <= threshold for `persistence` consecutive steps.
        """
        full_norm_kt, smoothed_kt, kt_0 = self.compute_stiffness_trajectory(
            ft, disp, kt_0_theoretical
        )
        t_slip = time[gross_slip_step] if gross_slip_step >= 0 else time[-1]

        alarm_step = -1
        alarm_time = -1.0
        consecutive_triggers = 0

        for step in range(self.window, len(time)):
            if disp[step] < self.min_disp_threshold:
                continue

            if smoothed_kt[step] <= threshold:
                consecutive_triggers += 1
                if consecutive_triggers >= self.persistence:
                    alarm_step = step
                    alarm_time = float(time[step])
                    break
            else:
                consecutive_triggers = 0

        if alarm_step >= 0 and alarm_step <= gross_slip_step:
            lead_time_ms = (t_slip - alarm_time) * 1000.0
            detected_preslip = True
        else:
            lead_time_ms = 0.0
            detected_preslip = False

        # Invert score for ROC: higher score = higher slip risk
        # Risk score = 1.0 - smoothed_stiffness
        risk_score = np.clip(1.0 - smoothed_kt, 0.0, 1.0)

        return {
            "alarm_step": alarm_step,
            "alarm_time": alarm_time,
            "lead_time_ms": lead_time_ms,
            "detected_preslip": detected_preslip,
            "kt_0": kt_0,
            "smoothed_kt": smoothed_kt,
            "scores": risk_score,
        }


class ReactiveSlipDetector:
    """
    Reference Baseline: Reactive Macroscopic Slip Detector
    Detects slip when slip velocity exceeds threshold (default 1e-4 m/s).
    By definition, fires at or after gross slip commences; lead time is strictly 0 ms.
    """
    def __init__(self, slip_vel_threshold: float = 1e-4):
        self.slip_vel_threshold = slip_vel_threshold

    def evaluate_trajectory(
        self,
        slip_velocity: np.ndarray,
        time: np.ndarray,
        gross_slip_step: int,
    ) -> Dict[str, Any]:
        indices = np.where(np.abs(slip_velocity) >= self.slip_vel_threshold)[0]
        if len(indices) > 0:
            alarm_step = int(indices[0])
            alarm_time = float(time[alarm_step])
        else:
            alarm_step = gross_slip_step
            alarm_time = float(time[gross_slip_step]) if gross_slip_step >= 0 else float(time[-1])

        # Reactive detection has lead time <= 0 by definition
        return {
            "alarm_step": alarm_step,
            "alarm_time": alarm_time,
            "lead_time_ms": 0.0,
            "detected_preslip": False,
        }


# ==============================================================================
# 2. Comprehensive Metric & ROC Suite
# ==============================================================================

def compute_binary_metrics_at_threshold(
    trajectories: List[Dict[str, Any]],
    baseline_type: str,
    threshold: float,
    use_noisy: bool = False,
    **baseline_kwargs,
) -> Dict[str, Any]:
    """
    Computes lead times, detection recall, and false alarm rate across all trajectories.
    """
    lead_times = []
    detections = []
    false_alarms = []
    early_triggers = []

    if baseline_type == "force_ratio":
        baseline = ForceRatioBaseline(**baseline_kwargs)
    elif baseline_type == "stiffness":
        baseline = FiniteDifferenceStiffnessBaseline(**baseline_kwargs)
    else:
        raise ValueError(f"Unknown baseline: {baseline_type}")

    for tr in trajectories:
        time = tr["time"]
        gs_step = tr["gross_slip_step"]
        if gs_step < 0:
            continue

        if use_noisy:
            ft = tr["noisy_force_t"]
            fn = tr["noisy_force_n"]
            disp = tr["noisy_disp"]
        else:
            ft = tr["force_t"]
            fn = tr["force_n"]
            disp = tr["disp"]

        if baseline_type == "force_ratio":
            eval_res = baseline.evaluate_trajectory(ft, fn, time, gs_step, threshold)
        else:
            eval_res = baseline.evaluate_trajectory(
                ft, disp, time, gs_step, threshold, tr.get("kt_0_theoretical")
            )

        lead_time = eval_res["lead_time_ms"]
        detected = eval_res["detected_preslip"]
        alarm_step = eval_res["alarm_step"]

        lead_times.append(lead_time)
        detections.append(1 if detected else 0)

        # Check for false alarm / premature trigger during safe sticking
        # Defined as triggering when stick_ratio >= 0.80 or alarm_step < 0.25 * gs_step
        if alarm_step >= 0:
            stick_at_alarm = tr["stick_ratio"][alarm_step]
            is_false_alarm = (stick_at_alarm >= 0.80) or (alarm_step < 0.25 * gs_step)
            false_alarms.append(1 if is_false_alarm else 0)
        else:
            false_alarms.append(0)

    lead_arr = np.array(lead_times)
    det_arr = np.array(detections)
    fa_arr = np.array(false_alarms)

    return {
        "threshold": threshold,
        "mean_lead_time_ms": float(np.mean(lead_arr)),
        "median_lead_time_ms": float(np.median(lead_arr)),
        "std_lead_time_ms": float(np.std(lead_arr)),
        "min_lead_time_ms": float(np.min(lead_arr)),
        "max_lead_time_ms": float(np.max(lead_arr)),
        "detection_rate": float(np.mean(det_arr)),
        "false_alarm_rate": float(np.mean(fa_arr)),
        "trajectories_evaluated": len(lead_arr),
    }


def compute_frame_level_auroc(
    trajectories: List[Dict[str, Any]],
    baseline_type: str,
    use_noisy: bool = False,
    **baseline_kwargs,
) -> Dict[str, Any]:
    """
    Computes frame-level ROC curve and AUROC across all time steps.
    Positive class (y = 1): Pre-slip regime (stick_ratio <= 0.60 and not gross slipping).
    Negative class (y = 0): Safe sticking regime (stick_ratio >= 0.80).
    """
    all_scores = []
    all_labels = []

    if baseline_type == "force_ratio":
        baseline = ForceRatioBaseline(**baseline_kwargs)
    elif baseline_type == "stiffness":
        baseline = FiniteDifferenceStiffnessBaseline(**baseline_kwargs)
    else:
        raise ValueError(f"Unknown baseline: {baseline_type}")

    for tr in trajectories:
        gs_step = tr["gross_slip_step"]
        if gs_step < 0:
            continue

        if use_noisy:
            ft = tr["noisy_force_t"]
            fn = tr["noisy_force_n"]
            disp = tr["noisy_disp"]
        else:
            ft = tr["force_t"]
            fn = tr["force_n"]
            disp = tr["disp"]

        if baseline_type == "force_ratio":
            scores = baseline.compute_score(ft, fn)
        else:
            _, _, _ = baseline.compute_stiffness_trajectory(ft, disp, tr.get("kt_0_theoretical"))
            _, smoothed_kt, _ = baseline.compute_stiffness_trajectory(ft, disp, tr.get("kt_0_theoretical"))
            scores = np.clip(1.0 - smoothed_kt, 0.0, 1.0)

        stick_ratios = tr["stick_ratio"]
        is_gross = tr["is_gross_slipping"]

        for s in range(len(scores)):
            if is_gross[s]:
                continue  # Ignore macroscopic sliding steps for pre-slip classification
            ca = stick_ratios[s]
            if ca <= 0.60:
                all_labels.append(1)
                all_scores.append(float(scores[s]))
            elif ca >= 0.80:
                all_labels.append(0)
                all_scores.append(float(scores[s]))

    y_true = np.array(all_labels, dtype=int)
    y_score = np.array(all_scores, dtype=float)

    if len(np.unique(y_true)) < 2:
        return {"auroc": 0.5, "roc_points": []}

    # Manual AUROC calculation
    desc_order = np.argsort(-y_score)
    y_true_sorted = y_true[desc_order]
    y_score_sorted = y_score[desc_order]

    n_pos = np.sum(y_true == 1)
    n_neg = np.sum(y_true == 0)

    # Rank-sum AUROC
    ranks = np.arange(len(y_score), 0, -1)
    pos_ranks_sum = np.sum(ranks[y_true_sorted == 1])
    auroc = (pos_ranks_sum - n_pos * (n_pos + 1) / 2.0) / (n_pos * n_neg)

    # Compute a 20-point ROC curve
    quantiles = np.linspace(0.0, 1.0, 21)
    thresholds = np.quantile(y_score, quantiles)
    roc_points = []
    for th in sorted(set(thresholds)):
        y_pred = (y_score >= th).astype(int)
        tpr = float(np.sum((y_pred == 1) & (y_true == 1)) / max(1, n_pos))
        fpr = float(np.sum((y_pred == 1) & (y_true == 0)) / max(1, n_neg))
        roc_points.append({"threshold": float(th), "tpr": tpr, "fpr": fpr})

    return {
        "auroc": float(auroc),
        "total_positive_frames": int(n_pos),
        "total_negative_frames": int(n_neg),
        "roc_points": roc_points,
    }


def evaluate_friction_stratification(
    trajectories: List[Dict[str, Any]],
    use_noisy: bool = False,
) -> Dict[str, Any]:
    """
    Evaluates how Baseline 1 and Baseline 2 perform across stratified friction slices
    mu_s in {0.30, 0.40, 0.50, 0.60, 0.70, 0.80}.
    Demonstrates the fundamental breakdown of static force ratio versus stiffness softening.
    """
    mu_groups = sorted(list(set(tr["mu_static"] for tr in trajectories)))
    strata_results = {}

    # Fixed operational thresholds for comparison
    th_force_ratio = 0.50  # Load ratio 0.50
    th_stiffness = 0.40    # 60% softening (kt <= 0.40 * kt_0)

    b1 = ForceRatioBaseline()
    b2 = FiniteDifferenceStiffnessBaseline(window=5, alpha_ema=0.30, persistence=3)

    for mu in mu_groups:
        sub_trajs = [tr for tr in trajectories if abs(tr["mu_static"] - mu) < 1e-4]
        b1_leads = []
        b1_dets = []
        b2_leads = []
        b2_dets = []

        for tr in sub_trajs:
            time = tr["time"]
            gs = tr["gross_slip_step"]
            if gs < 0: continue

            if use_noisy:
                ft, fn, disp = tr["noisy_force_t"], tr["noisy_force_n"], tr["noisy_disp"]
            else:
                ft, fn, disp = tr["force_t"], tr["force_n"], tr["disp"]

            res1 = b1.evaluate_trajectory(ft, fn, time, gs, th_force_ratio)
            res2 = b2.evaluate_trajectory(ft, disp, time, gs, th_stiffness, tr.get("kt_0_theoretical"))

            b1_leads.append(res1["lead_time_ms"])
            b1_dets.append(1 if res1["detected_preslip"] else 0)
            b2_leads.append(res2["lead_time_ms"])
            b2_dets.append(1 if res2["detected_preslip"] else 0)

        strata_results[f"mu_{mu:.2f}"] = {
            "trajectory_count": len(sub_trajs),
            "b1_force_ratio_lead_ms": float(np.mean(b1_leads)),
            "b1_force_ratio_recall": float(np.mean(b1_dets)),
            "b2_stiffness_lead_ms": float(np.mean(b2_leads)),
            "b2_stiffness_recall": float(np.mean(b2_dets)),
        }

    return strata_results


# ==============================================================================
# 3. Main Evaluation Runner
# ==============================================================================

def run_p4_t2_evaluation(
    npz_path: str = None,
    manifest_path: str = None,
) -> Dict[str, Any]:
    """
    Executes the complete P4-T2 baseline evaluation on recorded partial slip trajectories.
    """
    if npz_path is None:
        npz_path = os.path.join(CURRENT_DIR, "data", "p4_t1_partial_slip_trajectories.npz")
    if manifest_path is None:
        manifest_path = os.path.join(CURRENT_DIR, "data", "p4_t1_trajectory_manifest.json")

    trajectories = load_p4_t1_dataset(npz_path, manifest_path)
    num_trajs = len(trajectories)
    print(f"Loaded {num_trajs} trajectories for P4-T2 evaluation.")

    # 1. Sweep Thresholds for Baseline 1 (Force Ratio) - Clean and Noisy
    force_ratio_thresholds = [0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80]
    b1_clean_sweeps = [
        compute_binary_metrics_at_threshold(trajectories, "force_ratio", th, use_noisy=False)
        for th in force_ratio_thresholds
    ]
    b1_noisy_sweeps = [
        compute_binary_metrics_at_threshold(trajectories, "force_ratio", th, use_noisy=True)
        for th in force_ratio_thresholds
    ]

    # 2. Sweep Thresholds for Baseline 2 (Stiffness Softening) - Clean and Noisy
    stiffness_thresholds = [0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80]
    b2_clean_sweeps = [
        compute_binary_metrics_at_threshold(
            trajectories, "stiffness", th, use_noisy=False, window=5, alpha_ema=0.30, persistence=3
        )
        for th in stiffness_thresholds
    ]
    b2_noisy_sweeps = [
        compute_binary_metrics_at_threshold(
            trajectories, "stiffness", th, use_noisy=True, window=5, alpha_ema=0.30, persistence=3
        )
        for th in stiffness_thresholds
    ]

    # 3. AUROC Computations
    b1_auroc_clean = compute_frame_level_auroc(trajectories, "force_ratio", use_noisy=False)
    b1_auroc_noisy = compute_frame_level_auroc(trajectories, "force_ratio", use_noisy=True)
    b2_auroc_clean = compute_frame_level_auroc(trajectories, "stiffness", use_noisy=False)
    b2_auroc_noisy = compute_frame_level_auroc(trajectories, "stiffness", use_noisy=True)

    # 4. Friction Strata Generalization Analysis
    strata_clean = evaluate_friction_stratification(trajectories, use_noisy=False)
    strata_noisy = evaluate_friction_stratification(trajectories, use_noisy=True)

    # 5. Reactive Baseline Comparison
    reactive = ReactiveSlipDetector()
    reactive_results = [
        reactive.evaluate_trajectory(tr["slip_velocity"], tr["time"], tr["gross_slip_step"])
        for tr in trajectories
    ]
    reactive_mean_lead = float(np.mean([r["lead_time_ms"] for r in reactive_results]))

    # 6. Aggregate Scientific Findings & Decision Gate
    # Optimal operational operating points:
    # B1 at theta=0.50 (clean)
    opt_b1 = next(s for s in b1_clean_sweeps if abs(s["threshold"] - 0.50) < 1e-4)
    # B2 at theta=0.40 (clean, 60% softening)
    opt_b2 = next(s for s in b2_clean_sweeps if abs(s["threshold"] - 0.40) < 1e-4)
    opt_b2_noisy = next(s for s in b2_noisy_sweeps if abs(s["threshold"] - 0.40) < 1e-4)

    preslip_signal_demonstrated = (
        opt_b2["mean_lead_time_ms"] >= 20.0 or
        any(s["mean_lead_time_ms"] >= 20.0 and s["detection_rate"] >= 0.85 for s in b2_clean_sweeps)
    )

    p4_t3_gateway_recommendation = "PROCEED_TO_P4_T3" if preslip_signal_demonstrated else "STOP_NO_GO"

    summary_report = {
        "task": "P4-T2 Pre-Slip Baseline Evaluation",
        "date": "2026-11-23",
        "total_trajectories": num_trajs,
        "reactive_baseline": {
            "mean_lead_time_ms": reactive_mean_lead,
            "detection_nature": "Macro-slip detection only (zero pre-slip forecast)",
        },
        "baseline1_force_ratio": {
            "auroc_clean": b1_auroc_clean["auroc"],
            "auroc_noisy": b1_auroc_noisy["auroc"],
            "sweeps_clean": b1_clean_sweeps,
            "sweeps_noisy": b1_noisy_sweeps,
        },
        "baseline2_stiffness_softening": {
            "auroc_clean": b2_auroc_clean["auroc"],
            "auroc_noisy": b2_auroc_noisy["auroc"],
            "sweeps_clean": b2_clean_sweeps,
            "sweeps_noisy": b2_noisy_sweeps,
        },
        "friction_stratification_clean": strata_clean,
        "friction_stratification_noisy": strata_noisy,
        "scientific_conclusions": {
            "preslip_signal_measurable": preslip_signal_demonstrated,
            "optimal_stiffness_lead_time_ms": opt_b2["mean_lead_time_ms"],
            "optimal_stiffness_detection_rate": opt_b2["detection_rate"],
            "optimal_stiffness_noisy_lead_time_ms": opt_b2_noisy["mean_lead_time_ms"],
            "gateway_verdict": p4_t3_gateway_recommendation,
        }
    }

    report_path = os.path.join(CURRENT_DIR, "data", "p4_t2_evaluation_summary.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(summary_report, f, indent=2)

    return summary_report


if __name__ == "__main__":
    rep = run_p4_t2_evaluation()
    print("\n" + "="*80)
    print("P4-T2 EVALUATION COMPLETED SUCCESSFULLY")
    print("="*80)
    print(f"Reactive Baseline Lead Time: {rep['reactive_baseline']['mean_lead_time_ms']:.1f} ms")
    print(f"Baseline 1 (Force Ratio) AUROC: Clean={rep['baseline1_force_ratio']['auroc_clean']:.4f}, Noisy={rep['baseline1_force_ratio']['auroc_noisy']:.4f}")
    print(f"Baseline 2 (Stiffness)   AUROC: Clean={rep['baseline2_stiffness_softening']['auroc_clean']:.4f}, Noisy={rep['baseline2_stiffness_softening']['auroc_noisy']:.4f}")
    sc = rep["scientific_conclusions"]
    print(f"Measurable Pre-Slip Signal: {sc['preslip_signal_measurable']}")
    print(f"Stiffness Softening Lead Time (Clean): {sc['optimal_stiffness_lead_time_ms']:.1f} ms (Recall: {sc['optimal_stiffness_detection_rate']*100:.1f}%)")
    print(f"Stiffness Softening Lead Time (Noisy): {sc['optimal_stiffness_noisy_lead_time_ms']:.1f} ms")
    print(f"Gateway Decision: {sc['gateway_verdict']}")
    print("="*80)
