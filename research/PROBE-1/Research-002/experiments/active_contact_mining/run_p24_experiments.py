"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.4 — Active Contact-Mode Mining (ACMM) Experiment Runner

Executes the 5-way benchmark across Task 1 and Task 2:
- D0: Passive Exploration Baseline (25 episodes)
- D1: Random Exploration (+40 episodes)
- D2: Contact-Boundary Sampling (+40 episodes)
- D3: Uncertainty & Disagreement (+40 episodes)
- D4: Combined ACMM Multi-Signal Mining (+40 episodes)

Evaluates:
1. Contact transitions and mode diversity discovered.
2. Next-step state RMSE and contact force RMSE.
3. 7-mode classification Macro-F1.
4. Downstream manipulation performance under corrected 25-step horizon.
5. Exact integer success counts (k/30) and 95% Wilson confidence intervals.
"""

import sys
import os
import time
import math
import json
from typing import Dict, Any, List, Tuple
import numpy as np
import torch

current_dir = os.path.dirname(os.path.abspath(__file__))
r002_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
sys.path.insert(0, r002_root)
sys.path.insert(0, os.path.join(r002_root, "src"))

from src.mining.trajectory_selector import TrajectorySelector
from src.mining.mining_evaluator import MiningEvaluator
from src.contact_modes.contact_mode_definitions import MODE_NAMES
from src.selection_aware.episode_conformal_engine import compute_wilson_ci


def to_json_serializable(obj):
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, (np.floating, float)):
        return float(obj)
    elif isinstance(obj, (np.integer, int)):
        return int(obj)
    elif isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    elif isinstance(obj, dict):
        return {str(k): to_json_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [to_json_serializable(v) for v in obj]
    return obj


def format_pct(k: int, n: int) -> Dict[str, Any]:
    rate = round(k / max(1, n), 4)
    pct = round(rate * 100.0, 2)
    low, high = compute_wilson_ci(k, n, 0.95)
    return {
        "count": k,
        "total": n,
        "rate": rate,
        "formatted": f"{k}/{n} ({pct}%)",
        "ci_95": [round(low * 100.0, 2), round(high * 100.0, 2)],
    }


def run_mining_pipeline_for_task(
    task: str = "peg_in_hole",
    active_budget: int = 40,
    eval_horizon: int = 25,
    seed: int = 42
) -> Dict[str, Any]:
    print(f"\n{'=' * 80}")
    print(f"  EXECUTING STAGE P2.4 ACTIVE MINING FOR TASK: {task.upper()}")
    print(f"  Active Budget: {active_budget} episodes | Corrected Evaluation Horizon: {eval_horizon} steps")
    print(f"{'=' * 80}", flush=True)

    np.random.seed(seed)
    torch.manual_seed(seed)

    evaluator = MiningEvaluator(task=task, eval_horizon=eval_horizon, test_episodes_count=30, seed=seed)
    selector = TrajectorySelector(task=task, budget=active_budget, d_min=0.20, seed=seed + 100)

    # 1. Collect Baseline D0 (25 passive episodes)
    print("  [Step 1/5] Collecting D0 initial passive dataset (25 episodes)...", flush=True)
    d0_selector = TrajectorySelector(task=task, budget=25, seed=seed)
    d0_result = d0_selector.mine_trajectories(strategy="D1_random", num_candidates=25, start_seed=100, horizon=eval_horizon)
    d0_episodes = d0_result["admitted_trajectories"]
    d0_transitions = evaluator.extract_transitions_from_episodes(d0_episodes)

    # Held-out test transitions for offline evaluation (30 episodes)
    test_selector = TrajectorySelector(task=task, budget=30, seed=seed + 999)
    test_res = test_selector.mine_trajectories(strategy="D4_acmm", num_candidates=45, start_seed=3000, horizon=eval_horizon)
    test_transitions = evaluator.extract_transitions_from_episodes(test_res["admitted_trajectories"])

    strategies = ["D0_passive", "D1_random", "D2_boundary", "D3_uncertainty", "D4_acmm"]
    strategy_results = {}

    for strat in strategies:
        print(f"\n  --- Evaluating Strategy: {strat} ---", flush=True)
        t_strat_start = time.time()

        if strat == "D0_passive":
            active_episodes = []
            mining_stats = {
                "strategy": "D0_passive",
                "admitted_count": 0,
                "unique_contact_modes": d0_result["unique_contact_modes"],
                "num_unique_modes": d0_result["num_unique_modes"],
                "success_count_in_mined": 0,
            }
        else:
            cand_mult = 3 if strat == "D4_acmm" else 2
            mine_res = selector.mine_trajectories(
                strategy=strat,
                num_candidates=active_budget * cand_mult,
                start_seed=seed + 2000,
                horizon=eval_horizon
            )
            active_episodes = mine_res["admitted_trajectories"]
            mining_stats = {
                "strategy": strat,
                "admitted_count": len(active_episodes),
                "unique_contact_modes": mine_res["unique_contact_modes"],
                "num_unique_modes": mine_res["num_unique_modes"],
                "success_count_in_mined": mine_res["success_count_in_mined"],
            }

        # Form Augmented Dataset: D_augmented = D0 + Active
        combined_episodes = d0_episodes + active_episodes
        all_transitions = evaluator.extract_transitions_from_episodes(combined_episodes)
        total_transitions_count = len(all_transitions)

        # Train Hybrid World Model on Augmented Dataset
        print(f"    Training world model on {len(combined_episodes)} episodes ({total_transitions_count} transitions)...", flush=True)
        model = evaluator.train_world_model(all_transitions, epochs=45)

        # Offline Metrics
        offline_metrics = evaluator.evaluate_offline_predictions(model, test_transitions)
        print(f"    Offline: State RMSE={offline_metrics['state_rmse']}, Force RMSE={offline_metrics['force_rmse']}, Mode Macro-F1={offline_metrics['mode_macro_f1']}", flush=True)

        # Closed-Loop Manipulation Evaluation under corrected horizon
        print(f"    Evaluating closed-loop manipulation across 30 test episodes (H={eval_horizon} steps)...", flush=True)
        manip_metrics = evaluator.evaluate_downstream_manipulation(model, num_episodes=30, start_seed=seed + 5000)
        print(f"    Manipulation: Success={manip_metrics['success_formatted']}, Mean Progress={manip_metrics['mean_goal_progress']}", flush=True)

        elapsed = round(time.time() - t_strat_start, 2)

        strategy_results[strat] = {
            "strategy": strat,
            "total_training_episodes": len(combined_episodes),
            "total_transitions": total_transitions_count,
            "mining_diagnostics": mining_stats,
            "prediction_accuracy": offline_metrics,
            "closed_loop_manipulation": manip_metrics,
            "elapsed_seconds": elapsed,
        }

    return {
        "task": task,
        "eval_horizon_steps": eval_horizon,
        "active_budget_episodes": active_budget,
        "strategies": strategy_results,
    }


def main():
    print("=" * 80)
    print("HOROS PROBE-1 — Research-002: Stage P2.4 Active Contact-Mode Mining Benchmark")
    print("=" * 80)

    t_total_start = time.time()

    # Run for Task 1 (Peg-in-Hole) with corrected 25-step horizon
    task1_benchmark = run_mining_pipeline_for_task(
        task="peg_in_hole",
        active_budget=40,
        eval_horizon=25,
        seed=42
    )

    # Run for Task 2 (Multifingered Lift) with corrected 25-step horizon
    task2_benchmark = run_mining_pipeline_for_task(
        task="multifinger_lift",
        active_budget=40,
        eval_horizon=25,
        seed=84
    )

    master_benchmark_report = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "program": "HOROS PROBE-1, Research-002",
        "stage": "P2.4",
        "method": "Active Contact-Mode Mining (ACMM)",
        "experimental_design_corrections": {
            "task_1_evaluation_horizon": "Extended from 10 steps to 25 steps to enable physical seating completion (>=65mm displacement).",
            "task_2_coordinated_manipulation": "Exploration pool includes multi-finger normal force preload regulation and synchronized dynamic arm lift.",
            "test_split_isolation": "All active mining operates exclusively in training simulation; held-out test splits remain 100% untouched.",
        },
        "task_1_peg_in_hole": task1_benchmark,
        "task_2_multifinger_lift": task2_benchmark,
        "total_benchmark_runtime_seconds": round(time.time() - t_total_start, 2),
    }

    results_dir = os.path.join(r002_root, "experiments", "active_contact_mining", "results")
    os.makedirs(results_dir, exist_ok=True)
    report_file = os.path.join(results_dir, "p24_mining_benchmark_report.json")

    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(to_json_serializable(master_benchmark_report), f, indent=2)

    print(f"\n Master Stage P2.4 Benchmark Report written to:\n  {report_file}")
    print(f" Total Benchmark Runtime: {round(time.time() - t_total_start, 2)}s")
    print("=" * 80)


if __name__ == "__main__":
    main()
