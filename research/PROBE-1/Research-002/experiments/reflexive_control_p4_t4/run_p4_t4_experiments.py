"""
HOROS PROBE-1 — Phase 4 Task 4 (P4-T4)
Comprehensive Closed-Loop Grasp Stabilization Benchmark Suite
File: run_p4_t4_experiments.py

Executes systematic closed-loop simulation benchmark across 5 controllers:
1. Controller 1: Fixed-Force Baseline
2. Controller 2: Reactive Slip Controller
3. Controller 3: Threshold Margin Controller
4. Controller 4: RLS Predictive Controller
5. Controller 5: HOROS Predictive MLP Controller

Evaluates over 30 systematically varied grasping episodes:
- Low friction (mu_s = 0.35), Moderate friction (mu_s = 0.55), High friction (mu_s = 0.75)
- Quasi-static ramp (1.0 mm/s), Fast ramp (5.0 mm/s), Micro-probe (10 Hz), Tangential shock
- Realistic tactile noise (Regime A: sigma_F = 0.02 N, sigma_delta = 0.5 um)
- Generates machine-readable p4_t4_evaluation_summary.json.
"""

import os
import sys
import json
import time
import math
import numpy as np
import torch
from typing import Dict, Any, List, Tuple

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
RESEARCH_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))
P4_T3_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "compliance_estimation_p4_t3"))

for p in (CURRENT_DIR, RESEARCH_DIR, P4_T3_DIR):
    if p not in sys.path:
        sys.path.insert(0, p)

from controllers import (
    FixedForceController,
    ReactiveSlipController,
    ThresholdMarginController,
    RLSPredictiveController,
    HOROSPredictiveMLPController,
)
from grasp_simulation_env import ClosedLoopGraspEnv
from rls_compliance_estimator import RLSComplianceEstimator
from predictive_margin_mlp import PredictiveMarginMLP


CHECKPOINT_PATH = os.path.join(P4_T3_DIR, "checkpoints", "best_p4_t3_mlp.pt")


def generate_experiment_configs() -> List[Dict[str, Any]]:
    """Generates 30 systematically varied closed-loop test scenarios with reserved seeds."""
    configs = []
    mu_levels = [0.35, 0.55, 0.75]
    disturbances = ["shear_ramp", "micro_probe", "tangential_shock"]
    velocities = [0.001, 0.0025, 0.005]  # 1.0, 2.5, 5.0 mm/s
    loads = [3.0, 5.0, 8.0]

    scenario_id = 0
    for mu in mu_levels:
        for dist in disturbances:
            for v in velocities:
                seed = 4300001 + scenario_id
                configs.append({
                    "scenario_id": scenario_id,
                    "seed": seed,
                    "mu_static": mu,
                    "mu_kinetic": 0.85 * mu,
                    "disturbance_type": dist,
                    "v_shear": v,
                    "fn_initial": loads[scenario_id % len(loads)],
                })
                scenario_id += 1
                if len(configs) >= 30:
                    break
            if len(configs) >= 30:
                break
        if len(configs) >= 30:
            break
    # Add 3 high-stress low-normal-load disturbance scenarios to complete 30 scenarios
    for mu in [0.35, 0.55, 0.75]:
        seed = 4300001 + scenario_id
        configs.append({
            "scenario_id": scenario_id,
            "seed": seed,
            "mu_static": mu,
            "mu_kinetic": 0.85 * mu,
            "disturbance_type": "tangential_shock",
            "v_shear": 0.005,
            "fn_initial": 3.0,
        })
        scenario_id += 1
        if len(configs) >= 30:
            break
    return configs


def run_episode(env: ClosedLoopGraspEnv, controller, config: Dict[str, Any]) -> Dict[str, Any]:
    """Runs a single closed-loop episode."""
    obs = env.reset(disturbance_type=config["disturbance_type"], v_shear=config["v_shear"])
    controller.reset(fn_initial=config["fn_initial"])

    done = False
    step_latencies = []
    actions_taken = []
    fn_history = []
    margin_history = []
    uncertainty_history = []

    while not done:
        t0 = time.perf_counter()
        ctrl_out = controller.step(obs)
        step_latencies.append((time.perf_counter() - t0) * 1000.0)

        cmd_fn = ctrl_out["cmd_fn"]
        actions_taken.append(ctrl_out["control_action"])
        fn_history.append(cmd_fn)
        if ctrl_out.get("predicted_margin") is not None:
            margin_history.append(ctrl_out["predicted_margin"])
        if ctrl_out.get("uncertainty") is not None:
            uncertainty_history.append(ctrl_out["uncertainty"])

        obs, done, info = env.step(cmd_fn)

    # Outcome analysis
    gross_slip_occurred = info["gross_slip_step"] >= 0
    slip_prevented = info["slip_prevented"] or (not gross_slip_occurred)
    grasp_success = info["grasp_success"]
    
    # False intervention: controller triggered pre-emptive squeeze when contact never dropped c/a below 0.80
    min_stick_ratio = min(env.stick_ratio, 1.0)
    intervened = controller.interventions_count > 0
    false_intervention = intervened and (min_stick_ratio >= 0.80) and (not gross_slip_occurred)

    return {
        "scenario_id": config["scenario_id"],
        "mu_static": config["mu_static"],
        "disturbance_type": config["disturbance_type"],
        "v_shear": config["v_shear"],
        "steps": env.step_count,
        "grasp_success": grasp_success,
        "gross_slip_occurred": gross_slip_occurred,
        "slip_prevented": slip_prevented,
        "false_intervention": false_intervention,
        "interventions_count": controller.interventions_count,
        "average_fn": float(np.mean(fn_history)),
        "peak_fn": float(info["peak_fn"]),
        "impulse_spent": float(info["impulse_spent"]),
        "mean_latency_ms": float(np.mean(step_latencies)),
        "p95_latency_ms": float(np.percentile(step_latencies, 95)),
    }


def execute_p4_t4_benchmark():
    print("Starting HOROS Phase 4 Task 4 (P4-T4) Closed-Loop Grasping Benchmark...")

    # Load trained Level 2 MLP model
    mlp_model = PredictiveMarginMLP(input_dim=60, hidden_dim=64)
    ckpt = torch.load(CHECKPOINT_PATH, map_location="cpu")
    mlp_model.load_state_dict(ckpt["model_state_dict"])
    mlp_model.eval()
    print("Loaded Level 2 Predictive MLP model checkpoint.")

    configs = generate_experiment_configs()
    print(f"Generated {len(configs)} test scenarios with reserved seeds 4300001..4300030.")

    controllers = {
        "1_fixed_force": lambda: FixedForceController(),
        "2_reactive_slip": lambda: ReactiveSlipController(slip_vel_threshold=1e-4, recovery_boost=12.0),
        "3_threshold_margin": lambda: ThresholdMarginController(ratio_threshold=0.45, gain=15.0),
        "4_rls_predictive": lambda: RLSPredictiveController(
            margin_threshold=0.40,
            proportional_gain=20.0,
            rls_estimator=RLSComplianceEstimator(formulation="incremental", lam=0.96, delta_window=5)
        ),
        "5_horos_predictive_mlp": lambda: HOROSPredictiveMLPController(
            model=mlp_model,
            margin_safe_target=0.50,
            margin_critical_threshold=0.35,
            slip_risk_threshold=0.40,
            kp_margin=25.0,
            kp_risk=15.0,
        ),
    }

    results = {
        "benchmark": "HOROS P4-T4 Closed-Loop Grasping Stabilization Benchmark",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "total_scenarios": len(configs),
        "controllers": {},
    }

    for c_name, c_factory in controllers.items():
        print(f"\n--- Evaluating Controller: {c_name} ---")
        ep_results = []
        for cfg in configs:
            env = ClosedLoopGraspEnv(
                mu_static=cfg["mu_static"],
                mu_kinetic=cfg["mu_kinetic"],
                fn_initial=cfg["fn_initial"],
                dt=0.001,
                seed=cfg["seed"],
            )
            ctrl = c_factory()
            res = run_episode(env, ctrl, cfg)
            ep_results.append(res)

        # Aggregate metrics
        n = len(ep_results)
        successes = sum(1 for r in ep_results if r["grasp_success"])
        slips = sum(1 for r in ep_results if r["gross_slip_occurred"])
        preventions = sum(1 for r in ep_results if r["slip_prevented"])
        false_interventions = sum(1 for r in ep_results if r["false_intervention"])

        avg_fn = float(np.mean([r["average_fn"] for r in ep_results]))
        peak_fn = float(np.max([r["peak_fn"] for r in ep_results]))
        avg_impulse = float(np.mean([r["impulse_spent"] for r in ep_results]))
        mean_lat = float(np.mean([r["mean_latency_ms"] for r in ep_results]))

        # Breakdown by friction level
        mu_breakdown = {}
        for mu in [0.35, 0.55, 0.75]:
            mu_subset = [r for r in ep_results if abs(r["mu_static"] - mu) < 1e-4]
            mu_breakdown[f"mu_{mu:.2f}"] = {
                "count": len(mu_subset),
                "success_rate": sum(1 for r in mu_subset if r["grasp_success"]) / len(mu_subset),
                "slip_rate": sum(1 for r in mu_subset if r["gross_slip_occurred"]) / len(mu_subset),
                "avg_fn": float(np.mean([r["average_fn"] for r in mu_subset])),
            }

        # Breakdown by disturbance type
        dist_breakdown = {}
        for dist in ["shear_ramp", "micro_probe", "tangential_shock"]:
            dist_subset = [r for r in ep_results if r["disturbance_type"] == dist]
            dist_breakdown[dist] = {
                "count": len(dist_subset),
                "success_rate": sum(1 for r in dist_subset if r["grasp_success"]) / len(dist_subset),
                "slip_rate": sum(1 for r in dist_subset if r["gross_slip_occurred"]) / len(dist_subset),
                "avg_fn": float(np.mean([r["average_fn"] for r in dist_subset])),
            }

        results["controllers"][c_name] = {
            "grasp_success_rate": successes / n,
            "gross_slip_rate": slips / n,
            "slip_prevention_rate": preventions / n,
            "false_intervention_rate": false_interventions / n,
            "average_normal_force_N": avg_fn,
            "peak_normal_force_N": peak_fn,
            "mean_impulse_spent_Ns": avg_impulse,
            "mean_step_latency_ms": mean_lat,
            "friction_breakdown": mu_breakdown,
            "disturbance_breakdown": dist_breakdown,
            "raw_episodes": ep_results,
        }

        print(f"  Success Rate: {successes/n*100:.1f}% | Slip Rate: {slips/n*100:.1f}% | Avg Fn: {avg_fn:.2f} N | Latency: {mean_lat:.3f} ms")

    out_file = os.path.join(CURRENT_DIR, "p4_t4_evaluation_summary.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nP4-T4 Benchmark completed! Summary saved to {out_file}")


if __name__ == "__main__":
    execute_p4_t4_benchmark()
