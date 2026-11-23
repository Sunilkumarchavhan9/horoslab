"""
HOROS PROBE-1 — Phase 4 Task 4B (P4-T4B)
P4-T3 Model Robustness & 4-Quadrant Sensor Noise Sensitivity Suite
File: p4_t3_sensor_robustness_test.py

Evaluates the certified Level 2 Multi-Task Predictive Margin MLP under independently
varied tactile sensor noise across 4 conditions:
  Condition A: Force noise 0.02 N, displacement noise 0.5 um (nominal baseline)
  Condition B: Force noise 0.05 N, displacement noise 0.5 um (elevated force noise)
  Condition C: Force noise 0.02 N, displacement noise 1.0 um (elevated displacement noise)
  Condition D: Force noise 0.05 N, displacement noise 1.0 um (dual elevated stress regime)

Strict causal execution from clean measurements with deterministic noise-generation seeds.
Evaluates:
- Precision, Recall, False Alarm Rate, Mean Lead Time (ms)
- Aligned Future-Margin MAE (against stick_ratio[t+20])
- Brier Score for Gross-Slip Probability Head
- Mean Epistemic Uncertainty Variance (sigma_m^2)
- Uncertainty Fallback Activation Rate (fraction of steps where sigma_m^2 >= 0.25)
"""

import os
import sys
import json
import time
import numpy as np
import torch
from typing import Dict, Any, List, Tuple

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
RESEARCH_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))
P4_T3_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "compliance_estimation_p4_t3"))
P4_T4_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "reflexive_control_p4_t4"))

for p in (CURRENT_DIR, RESEARCH_DIR, P4_T3_DIR, P4_T4_DIR):
    if p not in sys.path:
        sys.path.insert(0, p)

from predictive_margin_mlp import PredictiveMarginMLP


CHECKPOINT_PATH = os.path.join(P4_T3_DIR, "checkpoints", "best_p4_t3_mlp.pt")
INDEPENDENT_DATA_PATH = os.path.join(P4_T3_DIR, "audit_postmerge", "data", "independent_eval_trajectories.npz")
INDEPENDENT_MANIFEST_PATH = os.path.join(P4_T3_DIR, "audit_postmerge", "data", "independent_eval_manifest.json")


def load_clean_trajectories() -> List[Dict[str, Any]]:
    """Loads clean trajectories from the independent 24-episode audit dataset."""
    data = np.load(INDEPENDENT_DATA_PATH, allow_pickle=True)
    with open(INDEPENDENT_MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)["trajectories"]

    trajectories = []
    for rec in manifest:
        idx = rec["traj_id"] - 1000
        prefix = f"traj_{idx:03d}_"
        tr = {
            "time": data[prefix + "time"],
            "force_t": data[prefix + "force_t"],
            "force_n": data[prefix + "force_n"],
            "disp": data[prefix + "disp"],
            "stick_ratio": data[prefix + "stick_ratio"],
            "gross_slip_step": int(rec["gross_slip_step"]),
            "gross_slip_time": float(rec["gross_slip_time"]),
            "mu_static": float(rec["mu_static"]),
            "v_nominal": float(rec["v_nominal"]),
        }
        trajectories.append(tr)
    return trajectories


def evaluate_condition(
    model: PredictiveMarginMLP,
    trajectories: List[Dict[str, Any]],
    sigma_force: float,
    sigma_disp: float,
    noise_seed_base: int = 5500000,
    window_size: int = 15,
) -> Dict[str, Any]:
    """Evaluates the Level 2 MLP under specified force and displacement noise standard deviations."""
    tps, fps, fns = 0, 0, 0
    lead_times = []
    future_maes = []
    brier_scores = []
    uncertainties = []
    fallback_triggers = 0
    total_eval_steps = 0

    for ep_idx, tr in enumerate(trajectories):
        rng = np.random.RandomState(noise_seed_base + ep_idx)
        time_arr = tr["time"]
        clean_ft = tr["force_t"]
        clean_fn = tr["force_n"]
        clean_disp = tr["disp"]
        stick_ratio = tr["stick_ratio"]
        gs = tr["gross_slip_step"]

        # Synthesize noisy observables strictly from clean
        noisy_ft = clean_ft + rng.normal(0.0, sigma_force, size=clean_ft.shape)
        noisy_fn = clean_fn + rng.normal(0.0, sigma_force, size=clean_fn.shape)
        noisy_disp = clean_disp + rng.normal(0.0, sigma_disp, size=clean_disp.shape)
        v_cmd = tr["v_nominal"] * np.ones_like(clean_ft)

        delta_disp = np.zeros_like(noisy_disp)
        delta_disp[1:] = noisy_disp[1:] - noisy_disp[:-1]

        alarm_step = -1
        alarm_time = -1.0

        for t_step in range(window_size, len(time_arr)):
            total_eval_steps += 1
            w_ft = noisy_ft[t_step - window_size : t_step]
            w_fn = noisy_fn[t_step - window_size : t_step]
            w_dd = delta_disp[t_step - window_size : t_step] * 1000.0  # mm
            w_vcmd = v_cmd[t_step - window_size : t_step] * 1000.0

            feat = np.concatenate([w_ft, w_fn, w_dd, w_vcmd], axis=0)

            with torch.no_grad():
                preds = model.predict_causal_step(feat)

            m_hat = preds["predicted_margin"]
            p_slip = preds["slip_probability"]
            sigma_sq = preds["margin_uncertainty_std"] ** 2
            uncertainties.append(float(sigma_sq))

            if sigma_sq >= 0.25:
                fallback_triggers += 1

            if t_step <= gs:
                future_idx = min(len(time_arr) - 1, t_step + 20)
                true_future_m = stick_ratio[future_idx]
                future_maes.append(abs(m_hat - true_future_m))
                is_slip_near = 1.0 if (t_step + 20 >= gs) else 0.0
                brier_scores.append((p_slip - is_slip_near) ** 2)

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

        # Evaluation metrics
        if gs < len(time_arr) - 1:
            if det and lead_ms > 0.0:
                tps += 1
                lead_times.append(lead_ms)
            else:
                fns += 1
        else:
            if det:
                fps += 1

    precision = tps / (tps + fps) if (tps + fps) > 0 else 1.0
    recall = tps / (tps + fns) if (tps + fns) > 0 else 0.0
    far = fps / len(trajectories)
    mean_lead = float(np.mean(lead_times)) if lead_times else 0.0
    median_lead = float(np.median(lead_times)) if lead_times else 0.0

    return {
        "sigma_force_N": sigma_force,
        "sigma_disp_um": sigma_disp * 1e6,
        "precision": float(precision),
        "recall": float(recall),
        "false_alarm_rate": float(far),
        "mean_lead_time_ms": mean_lead,
        "median_lead_time_ms": median_lead,
        "future_margin_mae": float(np.mean(future_maes)),
        "brier_score": float(np.mean(brier_scores)),
        "mean_uncertainty_var": float(np.mean(uncertainties)),
        "p95_uncertainty_var": float(np.percentile(uncertainties, 95)),
        "fallback_trigger_rate": float(fallback_triggers / max(1, total_eval_steps)),
    }


def run_sensor_robustness_suite():
    print("Executing HOROS P4-T4B 4-Quadrant Tactile Sensor Noise Robustness Suite...")
    model = PredictiveMarginMLP(input_dim=60, hidden_dim=64)
    ckpt = torch.load(CHECKPOINT_PATH, map_location="cpu")
    model.load_state_dict(ckpt["model_state_dict"])
    model.eval()

    trajectories = load_clean_trajectories()
    print(f"Loaded {len(trajectories)} clean independent test trajectories.")

    conditions = {
        "Condition_A": {"sigma_force": 0.02, "sigma_disp": 0.5e-6, "desc": "Force 0.02 N, Disp 0.5 um (Nominal Baseline)"},
        "Condition_B": {"sigma_force": 0.05, "sigma_disp": 0.5e-6, "desc": "Force 0.05 N, Disp 0.5 um (Elevated Force Noise)"},
        "Condition_C": {"sigma_force": 0.02, "sigma_disp": 1.0e-6, "desc": "Force 0.02 N, Disp 1.0 um (Elevated Displacement Noise)"},
        "Condition_D": {"sigma_force": 0.05, "sigma_disp": 1.0e-6, "desc": "Force 0.05 N, Disp 1.0 um (Dual Elevated Stress)"},
    }

    summary = {
        "suite": "P4-T4B 4-Quadrant Tactile Sensor Noise Robustness",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "checkpoint": "best_p4_t3_mlp.pt",
        "total_test_episodes": len(trajectories),
        "results": {},
    }

    for cond_id, cfg in conditions.items():
        print(f"\n--- Evaluating {cond_id}: {cfg['desc']} ---")
        res = evaluate_condition(model, trajectories, cfg["sigma_force"], cfg["sigma_disp"])
        res["description"] = cfg["desc"]
        summary["results"][cond_id] = res
        print(f"  Precision: {res['precision']*100:.1f}% | Recall: {res['recall']*100:.1f}% | FAR: {res['false_alarm_rate']*100:.1f}%")
        print(f"  Future Margin MAE: {res['future_margin_mae']:.4f} | Brier: {res['brier_score']:.4f} | Lead: {res['mean_lead_time_ms']:.1f} ms")
        print(f"  Mean Var: {res['mean_uncertainty_var']:.4f} | Fallback Rate: {res['fallback_trigger_rate']*100:.2f}%")

    out_file = os.path.join(CURRENT_DIR, "p4_t3_sensor_robustness_summary.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"\nCompleted! 4-Quadrant Robustness summary saved to {out_file}")


if __name__ == "__main__":
    run_sensor_robustness_suite()
