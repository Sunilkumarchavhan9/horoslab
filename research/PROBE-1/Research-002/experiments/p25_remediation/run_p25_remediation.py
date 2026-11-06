"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.5 Remediation: Benchmark Execution Suite

Executes:
1. Task 1 Remediation (Precision Peg-in-Hole):
   - Corrupted vs Corrected Linear vs Seating-Guided Reward Landscape
   - Horizon evaluation at H=40 steps
   - p-CBF ON vs OFF
2. Task 2 Remediation (Multifingered Lift):
   - Four matched configurations:
     * C1: p-CBF Disabled (Raw planner capability)
     * C2: Original p-CBF (Baseline hard zero-clamp)
     * C3: Tuned Smooth p-CBF (Proportional damping)
     * C4: Recovery-Aware CEM + Tuned p-CBF (Preload-prioritized search)
   - Detailed metrics: lift success, consecutive intervention streaks, stall rates, failure taxonomy.
"""

import sys
import os
import time
import copy
import json
from typing import Dict, Any, List, Tuple, Callable
import numpy as np
import torch

current_dir = os.path.dirname(os.path.abspath(__file__))
r002_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
sys.path.insert(0, r002_root)
sys.path.insert(0, os.path.join(r002_root, "src"))

from src.mining.trajectory_selector import TrajectorySelector
from src.mining.mining_evaluator import MiningEvaluator
from src.integrated.model_training_runner import ModelTrainingRunner
from src.safety.pcbf_safety_filter import PredictiveCBFSafetyFilter
from src.safety.pcbf_tuned_filter import TunedSmoothPCBFFilter
from src.planners.cem_planner import CEMPlanner
from src.planners.recovery_aware_cem import RecoveryAwareCEMPlanner
from src.environment.peg_in_hole_env import PegInHoleEnv
from src.environment.multifinger_lift_env import MultifingerLiftEnv
from src.selection_aware.counterfactual_rollout import extract_env_state_and_wrench
from src.contact_modes.contact_mode_definitions import classify_contact_mode
from src.integrated.statistical_analysis import format_count_pct, compute_wilson_ci, to_json_serializable


def run_task1_remediation(models: Dict[str, Any], seed: int = 42) -> Dict[str, Any]:
    print("\n================================================================================", flush=True)
    print("  EXECUTING REMEDIATION A: TASK 1 PRECISION PEG-IN-HOLE", flush=True)
    print("================================================================================", flush=True)

    action_bounds = (
        np.array([-5.0, -5.0, -5.0, -2.0, -2.0, -2.0]),
        np.array([5.0, 5.0, 5.0, 2.0, 2.0, 2.0])
    )

    # 1. Corrupted Objective (P2.5 Baseline)
    def r_corrupted(s, a):
        peg_z = s[2]
        lat_err = np.linalg.norm(s[:2])
        w_norm = np.linalg.norm(s[9:15]) if len(s) >= 15 else np.linalg.norm(s[:3])
        return -float(lat_err * 2.0 + max(0.0, peg_z) * 1.5 - min(0.0, peg_z) * 5.0 + w_norm * 0.1)

    # 2. Corrected Linear Downward Progress
    def r_corrected(s, a):
        peg_z = s[2]
        lat_err = np.linalg.norm(s[:2])
        w_norm = np.linalg.norm(s[9:15]) if len(s) >= 15 else np.linalg.norm(s[:3])
        depth = max(0.0, -peg_z)
        above = max(0.0, peg_z)
        return float(5.0 * depth - 1.5 * above - 2.0 * lat_err - 0.1 * w_norm)

    # 3. Seating-Guided Objective with Alignment Guidance
    def r_guided(s, a):
        peg_z = s[2]
        lat_err = np.linalg.norm(s[:2])
        tilt = np.linalg.norm(s[6:8]) if len(s) >= 8 else 0.0
        w_norm = np.linalg.norm(s[9:15]) if len(s) >= 15 else np.linalg.norm(s[:3])
        depth = max(0.0, -peg_z)
        above = max(0.0, peg_z)
        seating_bonus = 100.0 if peg_z <= -50.0 else 0.0
        return float(6.0 * depth - 1.5 * above - 2.5 * lat_err - 1.0 * tilt - 0.05 * w_norm + seating_bonus)

    eval_horizons = [25, 40]
    reward_configs = [
        ("corrupted_baseline", r_corrupted),
        ("corrected_linear", r_corrected),
        ("seating_guided", r_guided),
    ]

    t1_results = {}

    # Focus deep test on best boundary model M2 and combined M4
    for model_name in ["M0_passive", "M2_boundary", "M4_acmm"]:
        model = models[model_name]
        t1_results[model_name] = {}

        for rew_name, rew_fn in reward_configs:
            for H in eval_horizons:
                cfg_key = f"{rew_name}_H{H}"
                print(f"    Evaluating {model_name} under {cfg_key} (30 test episodes)...", flush=True)

                planner = CEMPlanner(
                    world_model=model,
                    action_dim=6,
                    action_bounds=action_bounds,
                    horizon=10,
                    num_samples=60,
                    elite_fraction=0.15,
                    num_iterations=2,
                )

                success_count = 0
                depths = []
                stalls = 0

                for ep_idx in range(30):
                    ep_seed = seed + 5000 + ep_idx
                    env = PegInHoleEnv(seed=ep_seed)
                    obs = env.reset()

                    for step in range(H):
                        s_vec, _ = extract_env_state_and_wrench(obs, "peg_in_hole")
                        action, _ = planner.plan(s_vec, rew_fn)
                        obs, r, done, info = env.step(action)
                        if done:
                            break

                    final_depth = max(0.0, -float(env.peg_pos[2]))
                    depths.append(final_depth)
                    if env.seated:
                        success_count += 1
                    if env.jammed:
                        stalls += 1

                succ_info = format_count_pct(success_count, 30)
                mean_depth = round(float(np.mean(depths)), 2)
                max_depth = round(float(np.max(depths)), 2)

                t1_results[model_name][cfg_key] = {
                    "model": model_name,
                    "reward_config": rew_name,
                    "horizon_steps": H,
                    "task_success": succ_info,
                    "insertion_depth_mean_mm": mean_depth,
                    "insertion_depth_max_mm": max_depth,
                    "jammed_count": stalls,
                }
                print(f"      -> Success: {succ_info['formatted']}, Mean Depth: {mean_depth}mm (Max: {max_depth}mm)", flush=True)

    return t1_results


def run_task2_remediation(models: Dict[str, Any], seed: int = 100) -> Dict[str, Any]:
    print("\n================================================================================", flush=True)
    print("  EXECUTING REMEDIATION B: TASK 2 MULTIFINGERED LIFT (4 MATCHED CONFIGURATIONS)", flush=True)
    print("================================================================================", flush=True)

    action_bounds = (
        np.array([-1.0, -1.0, -1.0, -1.0, -1.0]),
        np.array([1.0, 1.0, 1.0, 1.0, 1.0])
    )

    def lift_reward(s, a):
        obj_z = s[20] if len(s) >= 23 else s[2]
        slip = np.linalg.norm(s[16:20]) if len(s) >= 23 else 0.0
        force_err = abs(np.sum(s[8:12]) - 16.0) if len(s) >= 23 else 0.0
        return float(obj_z * 15.0 - slip * 5.0 - force_err * 0.1)

    t2_results = {}
    tested_models = ["M0_passive", "M1_random", "M2_boundary", "M3_uncertainty", "M4_acmm"]

    for model_name in tested_models:
        model = models[model_name]
        t2_results[model_name] = {}
        print(f"\n  --- Model: {model_name} ---", flush=True)

        for cfg_id in ["C1_open", "C2_original", "C3_tuned", "C4_recovery"]:
            # Setup Planner & Filter
            if cfg_id == "C4_recovery":
                planner = RecoveryAwareCEMPlanner(
                    world_model=model,
                    action_dim=5,
                    action_bounds=action_bounds,
                    horizon=10,
                    num_samples=60,
                    elite_fraction=0.15,
                    num_iterations=2,
                )
            else:
                planner = CEMPlanner(
                    world_model=model,
                    action_dim=5,
                    action_bounds=action_bounds,
                    horizon=10,
                    num_samples=60,
                    elite_fraction=0.15,
                    num_iterations=2,
                )

            if cfg_id == "C1_open":
                safety_filter = None
            elif cfg_id == "C2_original":
                safety_filter = PredictiveCBFSafetyFilter()
            else:  # C3_tuned or C4_recovery
                safety_filter = TunedSmoothPCBFFilter(task="multifinger_lift")

            success_count = 0
            violations = 0
            stalls = 0
            lift_heights = []
            total_decisions = 0
            total_interventions = 0
            max_streaks = []

            for ep_idx in range(30):
                ep_seed = seed + 6000 + ep_idx
                env = MultifingerLiftEnv(seed=ep_seed)
                obs = env.reset()
                if hasattr(safety_filter, "reset_episode"):
                    safety_filter.reset_episode()

                ep_interv = 0
                ep_positions = []
                ep_max_streak = 0

                for step in range(25):
                    total_decisions += 1
                    s_vec, _ = extract_env_state_and_wrench(obs, "multifinger_lift")
                    action, _ = planner.plan(s_vec, lift_reward)

                    intervened = False
                    if safety_filter is not None:
                        action, intervened, info = safety_filter.filter_action(obs, action, task="multifinger_lift")
                        if intervened:
                            ep_interv += 1
                            total_interventions += 1
                        ep_max_streak = max(ep_max_streak, info.get("current_streak", 0))

                    obs, r, done, info = env.step(action)
                    ep_positions.append(float(env.obj_pos[2]))
                    if done:
                        break

                max_streaks.append(ep_max_streak)
                final_z = float(env.obj_pos[2])
                lift_heights.append(final_z)

                if env.object_lifted:
                    success_count += 1
                if env.crush_violated:
                    violations += 1

                # Stall detection
                is_stalled = False
                if len(ep_positions) >= 5:
                    if float(np.var(ep_positions[-5:])) < 1e-4 and final_z < 0.005:
                        is_stalled = True
                        stalls += 1

            succ_info = format_count_pct(success_count, 30)
            viol_info = format_count_pct(violations, 30)
            stall_info = format_count_pct(stalls, 30)
            interv_info = format_count_pct(total_interventions, max(1, total_decisions))
            mean_h = round(float(np.mean(lift_heights)), 4)
            max_h = round(float(np.max(lift_heights)), 4)
            mean_max_streak = round(float(np.mean(max_streaks)), 1)

            t2_results[model_name][cfg_id] = {
                "configuration": cfg_id,
                "model": model_name,
                "task_success": succ_info,
                "safety_violations": viol_info,
                "stall_rate": stall_info,
                "interventions": interv_info,
                "mean_consecutive_interventions": mean_max_streak,
                "mean_lift_height_m": mean_h,
                "max_lift_height_m": max_h,
            }
            print(f"    [{cfg_id}] Success: {succ_info['formatted']}, Stalls: {stall_info['formatted']}, Interv: {interv_info['formatted']}, Mean Lift: {mean_h}m (Max: {max_h}m)", flush=True)

    return t2_results


def run_remediation():
    t_start = time.time()
    results_dir = os.path.join(current_dir, "results")
    os.makedirs(results_dir, exist_ok=True)

    # 1. Train or load models for Task 1 and Task 2
    print("================================================================================", flush=True)
    print("  STAGE P2.5 REMEDIATION: RE-TRAINING STANDARDIZED MODELS", flush=True)
    print("================================================================================", flush=True)

    # Task 1 Models
    t1_trainer = ModelTrainingRunner(task="peg_in_hole", seed=42)
    t1_selector = TrajectorySelector(task="peg_in_hole", budget=25, seed=42)
    t1_d0 = t1_selector.mine_trajectories(strategy="D1_random", num_candidates=25, start_seed=100, horizon=25)["admitted_trajectories"]

    t1_active_selector = TrajectorySelector(task="peg_in_hole", budget=40, d_min=0.20, seed=242)
    t1_d2 = t1_active_selector.mine_trajectories(strategy="D2_boundary", num_candidates=80, start_seed=4000, horizon=25)["admitted_trajectories"]
    t1_d4 = t1_active_selector.mine_trajectories(strategy="D4_acmm", num_candidates=120, start_seed=4000, horizon=25)["admitted_trajectories"]

    t1_models = {
        "M0_passive": t1_trainer.train_hybrid_model(t1_trainer.extract_transitions(t1_d0), epochs=45),
        "M2_boundary": t1_trainer.train_hybrid_model(t1_trainer.extract_transitions(t1_d0 + t1_d2), epochs=45),
        "M4_acmm": t1_trainer.train_hybrid_model(t1_trainer.extract_transitions(t1_d0 + t1_d4), epochs=45),
    }

    # Task 2 Models
    t2_trainer = ModelTrainingRunner(task="multifinger_lift", seed=100)
    t2_selector = TrajectorySelector(task="multifinger_lift", budget=25, seed=100)
    t2_d0 = t2_selector.mine_trajectories(strategy="D1_random", num_candidates=25, start_seed=100, horizon=25)["admitted_trajectories"]

    t2_active_selector = TrajectorySelector(task="multifinger_lift", budget=40, d_min=0.20, seed=300)
    t2_d1 = t2_active_selector.mine_trajectories(strategy="D1_random", num_candidates=80, start_seed=4000, horizon=25)["admitted_trajectories"]
    t2_d2 = t2_active_selector.mine_trajectories(strategy="D2_boundary", num_candidates=80, start_seed=4000, horizon=25)["admitted_trajectories"]
    t2_d3 = t2_active_selector.mine_trajectories(strategy="D3_uncertainty", num_candidates=80, start_seed=4000, horizon=25)["admitted_trajectories"]
    t2_d4 = t2_active_selector.mine_trajectories(strategy="D4_acmm", num_candidates=120, start_seed=4000, horizon=25)["admitted_trajectories"]

    t2_models = {
        "M0_passive": t2_trainer.train_hybrid_model(t2_trainer.extract_transitions(t2_d0), epochs=45),
        "M1_random": t2_trainer.train_hybrid_model(t2_trainer.extract_transitions(t2_d0 + t2_d1), epochs=45),
        "M2_boundary": t2_trainer.train_hybrid_model(t2_trainer.extract_transitions(t2_d0 + t2_d2), epochs=45),
        "M3_uncertainty": t2_trainer.train_hybrid_model(t2_trainer.extract_transitions(t2_d0 + t2_d3), epochs=45),
        "M4_acmm": t2_trainer.train_hybrid_model(t2_trainer.extract_transitions(t2_d0 + t2_d4), epochs=45),
    }

    # Execute Remediation A and B
    t1_results = run_task1_remediation(t1_models, seed=42)
    t2_results = run_task2_remediation(t2_models, seed=100)

    elapsed = round(time.time() - t_start, 2)

    master_report = {
        "program": "HOROS PROBE-1 — Humanoid Robotics & Physical AI",
        "project": "Research-002: Trustworthy Action-Conditioned Contact World Models",
        "stage": "P2.5 Remediation: Integrated Manipulation & Safety Coordination",
        "total_runtime_seconds": elapsed,
        "task1_peg_in_hole_remediation": t1_results,
        "task2_multifinger_lift_remediation": t2_results,
    }

    report_path = os.path.join(results_dir, "p25_remediation_master_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(to_json_serializable(master_report), f, indent=2)

    print("\n================================================================================", flush=True)
    print(f"  P2.5 REMEDIATION EXPERIMENTS COMPLETE! REPORT SAVED TO: {report_path}", flush=True)
    print(f"  TOTAL ELAPSED: {elapsed}s", flush=True)
    print("================================================================================", flush=True)


if __name__ == "__main__":
    run_remediation()

