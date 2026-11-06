"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.5 — Five-Way Integrated Evaluation: Main Benchmark Runner

Executes the integrated benchmark across both tasks:
1. Precision Peg-in-Hole (Task 1)
2. Multifingered Lift (Task 2)

Evaluates:
- M0: Passive Baseline (D0)
- M1: Random Exploration (D1)
- M2: Contact-Boundary Sampling (D2)
- M3: Uncertainty / Disagreement (D3)
- M4: Combined ACMM (D4)

Across:
- Dual Conformal Regimes (CMS-PSACD vs Unstratified Split Conformal Baseline)
- Dual Target Estimands (Target A Open-Loop vs Target B Receding Horizon)
- Safety Filter Ablation (Runtime p-CBF ON vs OFF)
- 5-Class Failure Taxonomy

Serializes master reports to experiments/integrated_evaluation/results/p25_integrated_benchmark_report.json.
"""

import sys
import os
import time
import json
from typing import Dict, Any

current_dir = os.path.dirname(os.path.abspath(__file__))
r002_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
sys.path.insert(0, r002_root)
sys.path.insert(0, os.path.join(r002_root, "src"))

from src.integrated.experiment_orchestrator import ExperimentOrchestrator
from src.integrated.statistical_analysis import to_json_serializable


def run_benchmark():
    results_dir = os.path.join(current_dir, "results")
    os.makedirs(results_dir, exist_ok=True)

    print("================================================================================", flush=True)
    print("  HOROS PROBE-1 — STAGE P2.5: FIVE-WAY INTEGRATED BENCHMARK SUITE", flush=True)
    print("================================================================================", flush=True)
    t_global_start = time.time()

    # 1. Run Task 1: Precision Peg-in-Hole
    t1_orchestrator = ExperimentOrchestrator(
        task="peg_in_hole",
        eval_horizon=25,
        test_episodes_count=30,
        calib_episodes_count=25,
        active_budget=40,
        seed=42,
    )
    t1_results = t1_orchestrator.run_benchmark(output_dir=results_dir)

    # 2. Run Task 2: Multifingered Lift
    t2_orchestrator = ExperimentOrchestrator(
        task="multifinger_lift",
        eval_horizon=25,
        test_episodes_count=30,
        calib_episodes_count=25,
        active_budget=40,
        seed=100,
    )
    t2_results = t2_orchestrator.run_benchmark(output_dir=results_dir)

    total_time = round(time.time() - t_global_start, 2)

    master_benchmark = {
        "benchmark_title": "HOROS PROBE-1 Research-002 Stage P2.5: Five-Way Integrated Evaluation",
        "program": "HOROS PROBE-1 — Humanoid Robotics & Physical AI",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total_runtime_seconds": total_time,
        "tasks": {
            "peg_in_hole": t1_results,
            "multifinger_lift": t2_results,
        }
    }

    final_report_path = os.path.join(results_dir, "p25_integrated_benchmark_report.json")
    with open(final_report_path, "w", encoding="utf-8") as f:
        json.dump(to_json_serializable(master_benchmark), f, indent=2)

    print("\n================================================================================", flush=True)
    print(f"  P2.5 BENCHMARK COMPLETE! MASTER REPORT WRITTEN TO: {final_report_path}", flush=True)
    print(f"  TOTAL TIME: {total_time}s", flush=True)
    print("================================================================================", flush=True)


if __name__ == "__main__":
    run_benchmark()

