"""
HOROS PROBE-1 — Phase 4 Task 4B (P4-T4B)
Independent 300-Scenario Closed-Loop Grasp Benchmark Suite
File: run_p4_t4b_experiments.py

Systematically benchmarks 5 grasp controllers across 300 independent scenarios:
  - 100 Low-friction episodes (mu_s = 0.35)
  - 100 Moderate-friction episodes (mu_s = 0.55)
  - 100 High-friction episodes (mu_s = 0.75)
  - Initial normal loads: 3.0 N, 5.0 N, 8.0 N, 12.0 N (conservative low-friction mitigation)
  - Disturbance regimes: shear_ramp, fast_ramp (8 mm/s), micro_probe (10 Hz), tangential_shock, normal_perturbation
  - Reserved research seeds: 4400001 through 4400300
  - Computes 95% bootstrap confidence intervals, P10, median, worst-case, mechanical work, and damage proxies.
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

from controllers_p4_t4b import (
    FixedForceController,
    ReactiveSlipController,
    ThresholdMarginController,
    RLSPredictiveController,
    HOROSHybridPredictiveController,
)
from grasp_simulation_env_p4_t4b import ClosedLoopGraspEnvP4T4B
from rls_compliance_estimator import RLSComplianceEstimator
from predictive_margin_mlp import PredictiveMarginMLP


CHECKPOINT_PATH = os.path.join(P4_T3_DIR, "checkpoints", "best_p4_t3_mlp.pt")


def generate_300_benchmark_configs() -> List[Dict[str, Any]]:
    """
    Generates 300 factorial closed-loop test scenarios:
    100 low friction, 100 moderate friction, 100 high friction.
    """
    configs = []
    mu_strata = [0.35, 0.55, 0.75]
    loads = [3.0, 5.0, 8.0, 12.0]
    disturbances = ["shear_ramp", "fast_ramp", "micro_probe", "tangential_shock", "normal_perturbation"]
    velocities = [0.001, 0.0025, 0.005]  # 1.0, 2.5, 5.0 mm/s (fast_ramp uses 0.008)

    scenario_id = 0
    # Exactly 100 episodes per friction stratum
    for mu in mu_strata:
        episodes_in_stratum = 0
        while episodes_in_stratum < 100:
            load = loads[episodes_in_stratum % len(loads)]
            dist = disturbances[episodes_in_stratum % len(disturbances)]
            v = 0.008 if dist == "fast_ramp" else velocities[episodes_in_stratum % len(velocities)]
            seed = 4400001 + scenario_id

            configs.append({
                "scenario_id": scenario_id,
                "seed": seed,
                "mu_static": mu,
                "mu_kinetic": 0.85 * mu,
                "disturbance_type": dist,
                "v_shear": v,
                "fn_initial": load,
            })
            episodes_in_stratum += 1
            scenario_id += 1

    return configs


def run_episode(env: ClosedLoopGraspEnvP4T4B, controller, config: Dict[str, Any]) -> Dict[str, Any]:
    """Executes a single closed-loop episode."""
    obs = env.reset(disturbance_type=config["disturbance_type"], v_shear=config["v_shear"])
    controller.reset(fn_initial=config["fn_initial"])

    done = False
    step_latencies = []
    actions_taken = []
    fn_history = []
    state_history = []

    while not done:
        t0 = time.perf_counter()
        ctrl_out = controller.step(obs)
        step_latencies.append((time.perf_counter() - t0) * 1000.0)

        cmd_fn = ctrl_out["cmd_fn"]
        actions_taken.append(ctrl_out.get("control_action", "maintain"))
        state_history.append(ctrl_out.get("operational_state", 1))
        fn_history.append(cmd_fn)

        obs, done, info = env.step(cmd_fn)

    gross_slip_occurred = info["gross_slip_step"] >= 0
    slip_prevented = (not gross_slip_occurred)
    grasp_success = info["grasp_success"]
    recovery_success = info["recovery_success"] and grasp_success

    # False intervention: controller triggered squeeze when contact never dropped c/a below 0.80
    min_stick_ratio = min(env.stick_ratio, 1.0)
    intervened = controller.interventions_count > 0
    false_intervention = intervened and (min_stick_ratio >= 0.80) and (not gross_slip_occurred)

    return {
        "scenario_id": config["scenario_id"],
        "mu_static": config["mu_static"],
        "fn_initial": config["fn_initial"],
        "disturbance_type": config["disturbance_type"],
        "v_shear": config["v_shear"],
        "steps": env.step_count,
        "grasp_success": grasp_success,
        "gross_slip_occurred": gross_slip_occurred,
        "slip_prevented": slip_prevented,
        "recovery_success": recovery_success,
        "recovery_time_ms": float(info["recovery_time_ms"]),
        "false_intervention": false_intervention,
        "interventions_count": controller.interventions_count,
        "average_fn": float(np.mean(fn_history)),
        "peak_fn": float(info["peak_fn"]),
        "impulse_spent": float(info["impulse_spent"]),
        "mechanical_work_act": float(info["mechanical_work_act"]),
        "tangential_work": float(info["tangential_work"]),
        "damage_proxy_integral": float(info["damage_proxy_integral"]),
        "peak_force_violation": float(info["peak_force_violation"]),
        "mean_latency_ms": float(np.mean(step_latencies)),
        "p95_latency_ms": float(np.percentile(step_latencies, 95)),
    }


def compute_bootstrap_ci(data: List[float], n_bootstrap: int = 1000, ci: float = 0.95) -> Tuple[float, float]:
    """Computes non-parametric bootstrap confidence interval."""
    if not data or len(data) < 2:
        return (0.0, 0.0)
    arr = np.array(data)
    boot_means = []
    rng = np.random.RandomState(42)
    n = len(arr)
    for _ in range(n_bootstrap):
        sample = rng.choice(arr, size=n, replace=True)
        boot_means.append(np.mean(sample))
    alpha = (1.0 - ci) / 2.0
    lower = float(np.percentile(boot_means, 100.0 * alpha))
    upper = float(np.percentile(boot_means, 100.0 * (1.0 - alpha)))
    return lower, upper


def execute_p4_t4b_benchmark():
    print("=" * 80)
    print("HOROS PROBE-1 — Phase 4 Task 4B (P4-T4B) Independent 300-Scenario Grasp Benchmark")
    print("=" * 80)

    # 1. Load certified Level 2 MLP World Model
    mlp_model = PredictiveMarginMLP(input_dim=60, hidden_dim=64)
    ckpt = torch.load(CHECKPOINT_PATH, map_location="cpu")
    mlp_model.load_state_dict(ckpt["model_state_dict"])
    mlp_model.eval()
    print("Loaded Level 2 Predictive MLP model checkpoint.")

    # 2. Generate 300 test scenarios (seeds 4400001..4400300)
    configs = generate_300_benchmark_configs()
    print(f"Generated {len(configs)} test scenarios with reserved research seeds 4400001..4400300.")
    print("Friction strata: 100 low (0.35), 100 moderate (0.55), 100 high (0.75).")

    # 3. Define 5 controllers for matched pairwise comparison
    controllers = {
        "1_fixed_force": lambda: FixedForceController(),
        "2_reactive_slip": lambda: ReactiveSlipController(slip_vel_threshold=1e-4, recovery_boost=12.0),
        "3_threshold_margin": lambda: ThresholdMarginController(ratio_threshold=0.45, gain=15.0),
        "4_rls_predictive": lambda: RLSPredictiveController(
            margin_threshold=0.40,
            proportional_gain=20.0,
            rls_estimator=RLSComplianceEstimator(formulation="incremental", lam=0.96, delta_window=5)
        ),
        "5_horos_hybrid_predictive": lambda: HOROSHybridPredictiveController(
            model=mlp_model,
            margin_safe_target=0.55,
            margin_critical_threshold=0.45,
            slip_risk_threshold=0.30,
            kp_margin=30.0,
            kp_risk=18.0,
            recovery_boost=12.0,
        ),
    }

    results = {
        "benchmark": "HOROS P4-T4B Independent 300-Scenario Closed-Loop Benchmark",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "total_scenarios": len(configs),
        "seed_range": [configs[0]["seed"], configs[-1]["seed"]],
        "controllers": {},
    }

    for c_name, c_factory in controllers.items():
        print(f"\n>>> Benchmarking Controller: {c_name} (300 episodes) <<<")
        ep_results = []
        t_start = time.time()

        for cfg in configs:
            env = ClosedLoopGraspEnvP4T4B(
                mu_static=cfg["mu_static"],
                mu_kinetic=cfg["mu_kinetic"],
                fn_initial=cfg["fn_initial"],
                dt=0.001,
                seed=cfg["seed"],
            )
            ctrl = c_factory()
            res = run_episode(env, ctrl, cfg)
            ep_results.append(res)

        elapsed = time.time() - t_start
        n = len(ep_results)
        successes = sum(1 for r in ep_results if r["grasp_success"])
        slips = sum(1 for r in ep_results if r["gross_slip_occurred"])
        preventions = sum(1 for r in ep_results if r["slip_prevented"])
        recoveries = sum(1 for r in ep_results if r["recovery_success"])
        false_interventions = sum(1 for r in ep_results if r["false_intervention"])

        succ_list = [1.0 if r["grasp_success"] else 0.0 for r in ep_results]
        fn_list = [r["average_fn"] for r in ep_results]
        peak_list = [r["peak_fn"] for r in ep_results]
        imp_list = [r["impulse_spent"] for r in ep_results]
        work_list = [r["mechanical_work_act"] for r in ep_results]
        tang_work_list = [r["tangential_work"] for r in ep_results]
        damage_list = [r["damage_proxy_integral"] for r in ep_results]
        lat_list = [r["mean_latency_ms"] for r in ep_results]

        succ_ci = compute_bootstrap_ci(succ_list)
        imp_ci = compute_bootstrap_ci(imp_list)
        fn_ci = compute_bootstrap_ci(fn_list)

        # Stratified analysis by friction
        friction_analysis = {}
        for mu in [0.35, 0.55, 0.75]:
            sub = [r for r in ep_results if abs(r["mu_static"] - mu) < 1e-4]
            sub_succ = sum(1 for r in sub if r["grasp_success"]) / len(sub)
            sub_fn = float(np.mean([r["average_fn"] for r in sub]))
            sub_imp = float(np.mean([r["impulse_spent"] for r in sub]))
            sub_rec = sum(1 for r in sub if r["recovery_success"]) / max(1, sum(1 for r in sub if r["gross_slip_occurred"]))
            friction_analysis[f"mu_{mu:.2f}"] = {
                "count": len(sub),
                "success_rate": sub_succ,
                "gross_slip_rate": sum(1 for r in sub if r["gross_slip_occurred"]) / len(sub),
                "slip_prevention_rate": sum(1 for r in sub if r["slip_prevented"]) / len(sub),
                "recovery_rate_given_slip": sub_rec,
                "mean_fn": sub_fn,
                "mean_impulse": sub_imp,
            }

        # Stratified analysis by initial normal force
        load_analysis = {}
        for ld in [3.0, 5.0, 8.0, 12.0]:
            sub = [r for r in ep_results if abs(r["fn_initial"] - ld) < 1e-4]
            load_analysis[f"Fn0_{ld:.1f}N"] = {
                "count": len(sub),
                "success_rate": sum(1 for r in sub if r["grasp_success"]) / len(sub),
                "mean_fn": float(np.mean([r["average_fn"] for r in sub])),
                "mean_impulse": float(np.mean([r["impulse_spent"] for r in sub])),
            }

        # Low-friction specific breakdown across initial loads
        low_mu_by_load = {}
        sub_low = [r for r in ep_results if abs(r["mu_static"] - 0.35) < 1e-4]
        for ld in [3.0, 5.0, 8.0, 12.0]:
            sub_ld = [r for r in sub_low if abs(r["fn_initial"] - ld) < 1e-4]
            low_mu_by_load[f"Fn0_{ld:.1f}N"] = {
                "count": len(sub_ld),
                "success_rate": sum(1 for r in sub_ld if r["grasp_success"]) / len(sub_ld),
                "mean_fn": float(np.mean([r["average_fn"] for r in sub_ld])),
            }

        # Disturbance breakdown
        dist_analysis = {}
        for dist in ["shear_ramp", "fast_ramp", "micro_probe", "tangential_shock", "normal_perturbation"]:
            sub = [r for r in ep_results if r["disturbance_type"] == dist]
            dist_analysis[dist] = {
                "count": len(sub),
                "success_rate": sum(1 for r in sub if r["grasp_success"]) / len(sub),
                "mean_fn": float(np.mean([r["average_fn"] for r in sub])),
            }

        results["controllers"][c_name] = {
            "grasp_success_rate": successes / n,
            "success_rate_95_ci": [succ_ci[0], succ_ci[1]],
            "gross_slip_rate": slips / n,
            "slip_prevention_rate": preventions / n,
            "recovery_success_rate": recoveries / max(1, slips),
            "false_intervention_rate": false_interventions / n,
            "average_normal_force_N": {
                "mean": float(np.mean(fn_list)),
                "median": float(np.median(fn_list)),
                "p10": float(np.percentile(fn_list, 10)),
                "worst_case": float(np.max(fn_list)),
                "ci_95": [fn_ci[0], fn_ci[1]],
            },
            "peak_normal_force_N": {
                "mean": float(np.mean(peak_list)),
                "median": float(np.median(peak_list)),
                "worst_case": float(np.max(peak_list)),
            },
            "normal_force_impulse_Ns": {
                "mean": float(np.mean(imp_list)),
                "median": float(np.median(imp_list)),
                "p10": float(np.percentile(imp_list, 10)),
                "worst_case": float(np.max(imp_list)),
                "ci_95": [imp_ci[0], imp_ci[1]],
            },
            "mechanical_work_J": {
                "mean": float(np.mean(work_list)),
                "worst_case": float(np.max(work_list)),
            },
            "tangential_work_J": {
                "mean": float(np.mean(tang_work_list)),
            },
            "damage_proxy_integral_N2s": {
                "mean": float(np.mean(damage_list)),
                "worst_case": float(np.max(damage_list)),
            },
            "control_latency_ms": {
                "mean": float(np.mean(lat_list)),
                "p95": float(np.percentile(lat_list, 95)),
            },
            "friction_strata": friction_analysis,
            "initial_load_analysis": load_analysis,
            "low_friction_by_load": low_mu_by_load,
            "disturbance_regimes": dist_analysis,
            "elapsed_seconds": elapsed,
            "raw_episodes": ep_results,
        }

        print(f"  Success: {successes/n*100:.1f}% (95% CI: [{succ_ci[0]*100:.1f}%, {succ_ci[1]*100:.1f}%])")
        print(f"  Gross Slip: {slips/n*100:.1f}% | Prevention: {preventions/n*100:.1f}% | False Alarm: {false_interventions/n*100:.1f}%")
        print(f"  Avg Fn: {np.mean(fn_list):.2f} N | Impulse: {np.mean(imp_list):.2f} Ns | Latency: {np.mean(lat_list):.3f} ms")
        print(f"  Benchmark took {elapsed:.1f}s.")

    out_file = os.path.join(CURRENT_DIR, "p4_t4b_evaluation_summary.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nSaved complete 300-scenario evaluation summary to {out_file}!")


if __name__ == "__main__":
    execute_p4_t4b_benchmark()
