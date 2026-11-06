"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.6: Contact-Aware Safety Coordination
Experiment 01: Instrumented Baseline Replay

Replays the frozen P2.5 baseline conditions (C1 unconstrained vs C2 original p-CBF)
with comprehensive 8-channel decision telemetry to establish the empirical reference
foundation for all P2.6 coordination interventions.
"""

import sys
import os
import time
import json
from typing import Dict, Any, List
import numpy as np

current_dir = os.path.dirname(os.path.abspath(__file__))
r002_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
sys.path.insert(0, r002_root)
sys.path.insert(0, os.path.join(r002_root, "src"))

from src.mining.trajectory_selector import TrajectorySelector
from src.mining.mining_evaluator import MiningEvaluator
from src.integrated.model_training_runner import ModelTrainingRunner
from src.safety.pcbf_safety_filter import PredictiveCBFSafetyFilter
from src.planners.cem_planner import CEMPlanner
from src.environment.multifinger_lift_env import MultifingerLiftEnv
from src.selection_aware.counterfactual_rollout import extract_env_state_and_wrench
from src.contact_modes.contact_mode_definitions import classify_contact_mode
from src.integrated.statistical_analysis import format_count_pct, compute_wilson_ci, to_json_serializable
from src.coordination.intervention_telemetry import InterventionTelemetryLogger


def run_exp01_instrumented_baseline(seed: int = 100) -> Dict[str, Any]:
    print("\n" + "=" * 80)
    print("  HOROS PROBE-1 STAGE P2.6 — EXPERIMENT 01: INSTRUMENTED BASELINE REPLAY")
    print("=" * 80, flush=True)

    start_time = time.time()
    np.random.seed(seed)

    # 1. Prepare Trajectories & Train Target Models (M0, M2, M4)
    print("  --> Mining training trajectories (Task 2 Multifinger Lift)...", flush=True)
    t2_trainer = ModelTrainingRunner(task="multifinger_lift", seed=100)
    t2_selector = TrajectorySelector(task="multifinger_lift", budget=25, seed=100)
    t2_d0 = t2_selector.mine_trajectories(strategy="D1_random", num_candidates=25, start_seed=100, horizon=25)["admitted_trajectories"]

    t2_active_selector = TrajectorySelector(task="multifinger_lift", budget=40, d_min=0.20, seed=300)
    t2_d2 = t2_active_selector.mine_trajectories(strategy="D2_boundary", num_candidates=80, start_seed=4000, horizon=25)["admitted_trajectories"]
    t2_d4 = t2_active_selector.mine_trajectories(strategy="D4_acmm", num_candidates=120, start_seed=4000, horizon=25)["admitted_trajectories"]

    print("  --> Training M0_passive...", flush=True)
    m0 = t2_trainer.train_hybrid_model(t2_trainer.extract_transitions(t2_d0), epochs=45)
    print("  --> Training M2_boundary...", flush=True)
    m2 = t2_trainer.train_hybrid_model(t2_trainer.extract_transitions(t2_d0 + t2_d2), epochs=45)
    print("  --> Training M4_acmm...", flush=True)
    m4 = t2_trainer.train_hybrid_model(t2_trainer.extract_transitions(t2_d0 + t2_d4), epochs=45)

    models = {
        "M0_passive": m0,
        "M2_boundary": m2,
        "M4_acmm": m4
    }

    action_bounds = (
        np.array([-1.0, -1.0, -1.0, -1.0, -1.0]),
        np.array([1.0, 1.0, 1.0, 1.0, 1.0])
    )

    def lift_reward(s, a):
        obj_z = s[20] if len(s) >= 23 else s[2]
        slip = np.linalg.norm(s[16:20]) if len(s) >= 23 else 0.0
        force_err = abs(np.sum(s[8:12]) - 16.0) if len(s) >= 23 else 0.0
        return float(obj_z * 15.0 - slip * 5.0 - force_err * 0.1)

    exp01_results = {
        "experiment": "P2.6_EXP01_Instrumented_Baseline_Replay",
        "seed": seed,
        "models_evaluated": ["M0_passive", "M2_boundary", "M4_acmm"],
        "configurations": ["C1_open", "C2_original"],
        "telemetry_records": {},
        "model_summaries": {}
    }

    raw_traces = {}

    for m_name in ["M0_passive", "M2_boundary", "M4_acmm"]:
        model = models[m_name]
        exp01_results["model_summaries"][m_name] = {}
        raw_traces[m_name] = {}
        print(f"\n=======================================================", flush=True)
        print(f"  MODEL: {m_name}", flush=True)
        print(f"=======================================================", flush=True)

        for cfg_id in ["C1_open", "C2_original"]:
            logger = InterventionTelemetryLogger(task="multifinger_lift")
            planner = CEMPlanner(
                world_model=model,
                action_dim=5,
                action_bounds=action_bounds,
                horizon=10,
                num_samples=60,
                elite_fraction=0.15,
                num_iterations=2,
            )

            safety_filter = None if cfg_id == "C1_open" else PredictiveCBFSafetyFilter()
            ep_traces_list = []

            for ep_idx in range(30):
                ep_seed = seed + 6000 + ep_idx
                env = MultifingerLiftEnv(seed=ep_seed)
                obs = env.reset()
                if hasattr(safety_filter, "reset_episode"):
                    safety_filter.reset_episode()

                logger.start_episode(
                    episode_id=ep_idx,
                    model_name=m_name,
                    configuration=cfg_id,
                    seed=ep_seed
                )

                ep_steps_data = []

                for step in range(25):
                    s_vec, _ = extract_env_state_and_wrench(obs, "multifinger_lift")
                    c_mode = classify_contact_mode(obs, task="multifinger_lift")

                    raw_action, _ = planner.plan(s_vec, lift_reward)

                    intervened = False
                    filter_info = {}
                    filtered_action = raw_action.copy()

                    if safety_filter is not None:
                        filtered_action, intervened, filter_info = safety_filter.filter_action(
                            obs, raw_action, task="multifinger_lift"
                        )

                    z_prog_mm = float(env.obj_pos[2])

                    dec_record = logger.log_decision(
                        step_idx=step,
                        obs=obs,
                        proposed_action=raw_action,
                        filtered_action=filtered_action,
                        intervened=intervened,
                        filter_info=filter_info,
                        task_progress_mm=z_prog_mm,
                        contact_mode=c_mode
                    )

                    obs, r, done, info = env.step(filtered_action)

                    ep_steps_data.append({
                        "step": step,
                        "pos_z_mm": float(env.obj_pos[2]),
                        "normal_forces": [float(x) for x in env.finger_normal_force],
                        "slip_ratios": [float(x) for x in env.finger_slip_ratio],
                        "contact_stratum": int(env.contact_stratum),
                        "intervened": bool(intervened)
                    })

                    if done:
                        break

                final_z_mm = float(env.obj_pos[2])
                is_stalled = False
                pos_history = [s["pos_z_mm"] for s in ep_steps_data]
                if len(pos_history) >= 5:
                    if float(np.var(pos_history[-5:])) < 1e-4 and final_z_mm < 0.005:
                        is_stalled = True

                logger.end_episode(
                    task_success=bool(env.object_lifted),
                    safety_violated=bool(env.crush_violated),
                    stalled=is_stalled,
                    final_progress_mm=final_z_mm
                )

                ep_traces_list.append({
                    "episode_idx": ep_idx,
                    "seed": ep_seed,
                    "success": bool(env.object_lifted),
                    "violation": bool(env.crush_violated),
                    "stalled": is_stalled,
                    "final_z_mm": round(final_z_mm, 4),
                    "steps": ep_steps_data
                })

            raw_traces[m_name][cfg_id] = ep_traces_list
            agg_telemetry = logger.get_aggregate_telemetry()

            # Save per-condition telemetry log
            cond_log_path = os.path.join(
                r002_root, "experiments", "p26_safety_coordination", "intervention_logs",
                f"telemetry_{m_name}_{cfg_id}.json"
            )
            logger.save_json(cond_log_path)

            succ_info = format_count_pct(agg_telemetry["success_count"], 30)
            viol_info = format_count_pct(agg_telemetry["violation_count"], 30)
            stall_info = format_count_pct(agg_telemetry["stall_count"], 30)
            interv_info = format_count_pct(agg_telemetry["total_interventions"], agg_telemetry["total_decisions"])

            exp01_results["model_summaries"][m_name][cfg_id] = {
                "configuration": cfg_id,
                "model": m_name,
                "task_success": succ_info,
                "safety_violations": viol_info,
                "stall_rate": stall_info,
                "interventions": interv_info,
                "mean_max_streak": agg_telemetry["mean_max_streak"],
                "max_observed_streak": agg_telemetry["max_observed_streak"],
                "mean_lift_height_mm": agg_telemetry["progress_mean_mm"],
                "max_lift_height_mm": agg_telemetry["progress_max_mm"],
                "mode_distribution": agg_telemetry["interventions_by_contact_mode"]
            }

            print(f"  [{cfg_id}] Success: {succ_info['formatted']} | Stalls: {stall_info['formatted']} | Interventions: {interv_info['formatted']} | Lift: mean={agg_telemetry['progress_mean_mm']}mm, max={agg_telemetry['progress_max_mm']}mm | Max Streak: {agg_telemetry['max_observed_streak']}", flush=True)

    exp01_results["total_runtime_seconds"] = round(time.time() - start_time, 2)

    # Serialize Master Results & Episode Traces
    results_dir = os.path.join(r002_root, "experiments", "p26_safety_coordination", "results")
    traces_dir = os.path.join(r002_root, "experiments", "p26_safety_coordination", "episode_traces")
    os.makedirs(results_dir, exist_ok=True)
    os.makedirs(traces_dir, exist_ok=True)

    master_path = os.path.join(results_dir, "p26_exp01_baseline_report.json")
    with open(master_path, "w", encoding="utf-8") as f:
        json.dump(to_json_serializable(exp01_results), f, indent=2)

    traces_path = os.path.join(traces_dir, "exp01_traces.json")
    with open(traces_path, "w", encoding="utf-8") as f:
        json.dump(to_json_serializable(raw_traces), f, indent=2)

    print("\n" + "=" * 80)
    print("  EXPERIMENT 01 COMPLETE: ALL TELEMETRY & TRACES SERIALIZED")
    print(f"  Master Report: {master_path}")
    print(f"  Episode Traces: {traces_path}")
    print("=" * 80 + "\n", flush=True)

    return exp01_results


if __name__ == "__main__":
    run_exp01_instrumented_baseline()
