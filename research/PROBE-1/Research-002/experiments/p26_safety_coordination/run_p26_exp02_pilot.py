"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.6: Contact-Aware Safety Coordination
Experiment 02 Pilot: 50-Episode Pre-Registered Smoke-Test Execution Runner

Implements Document 42 Pre-Registered Protocol:
- 5 Variants: E02-A, E02-B, E02-C, E02-D, baseline_C2
- 2 Contact Models: M2_boundary, M4_acmm
- 5 Episodes per cell (50 episodes total)
- Pre-registered seeds: [42, 142, 242, 342, 442]
- Evaluates: Zero hard-limit breaches (Fn < 25N), active 18N damping, E02-C clamp streak reduction
- Non-pooling: Excluded from final N=90 factorial evaluation
"""

import sys
import os
import time
import json
from typing import Dict, Any, List
import numpy as np

current_dir = os.path.dirname(os.path.abspath(__file__))
r002_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
if r002_root not in sys.path:
    sys.path.insert(0, r002_root)
src_dir = os.path.join(r002_root, "src")
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

from src.mining.trajectory_selector import TrajectorySelector
from src.integrated.model_training_runner import ModelTrainingRunner
from src.planners.cem_planner import CEMPlanner
from src.environment.multifinger_lift_env import MultifingerLiftEnv
from src.coordination.action_substitutor import ContactAwareActionSubstitutor
from src.coordination.intervention_telemetry import InterventionTelemetryLogger
from src.integrated.statistical_analysis import compute_wilson_ci, to_json_serializable


def run_p26_exp02_pilot(output_dir: str = None) -> Dict[str, Any]:
    print("\n" + "=" * 80)
    print("  HOROS PROBE-1 STAGE P2.6 — EXPERIMENT 02: 50-EPISODE CONTROLLED PILOT")
    print("=" * 80, flush=True)

    start_time = time.time()
    pilot_seeds = [42, 142, 242, 342, 442]
    variants = ["baseline_C2", "E02_A", "E02_B", "E02_C", "E02_D"]
    target_models = ["M2_boundary", "M4_acmm"]

    # 1. Prepare Models M2 and M4
    print("  --> Mining trajectories & training M2 / M4 models...", flush=True)
    t2_trainer = ModelTrainingRunner(task="multifinger_lift", seed=100)
    t2_selector = TrajectorySelector(task="multifinger_lift", budget=25, seed=100)
    t2_d0 = t2_selector.mine_trajectories(strategy="D1_random", num_candidates=25, start_seed=100, horizon=25)["admitted_trajectories"]

    t2_active_selector = TrajectorySelector(task="multifinger_lift", budget=40, d_min=0.20, seed=300)
    t2_d2 = t2_active_selector.mine_trajectories(strategy="D2_boundary", num_candidates=80, start_seed=4000, horizon=25)["admitted_trajectories"]
    t2_d4 = t2_active_selector.mine_trajectories(strategy="D4_acmm", num_candidates=120, start_seed=4000, horizon=25)["admitted_trajectories"]

    m2 = t2_trainer.train_hybrid_model(t2_trainer.extract_transitions(t2_d0 + t2_d2), epochs=45)
    m4 = t2_trainer.train_hybrid_model(t2_trainer.extract_transitions(t2_d0 + t2_d4), epochs=45)

    models = {
        "M2_boundary": m2,
        "M4_acmm": m4
    }

    action_bounds = (
        np.array([-1.0, -1.0, -1.0, -1.0, -1.0]),
        np.array([1.0, 1.0, 1.0, 1.0, 1.0])
    )

    telemetry = InterventionTelemetryLogger()
    pilot_results = {
        "metadata": {
            "protocol": "Document 42 Section 3",
            "pilot_seeds": pilot_seeds,
            "variants": variants,
            "models": target_models,
            "total_episodes": len(variants) * len(target_models) * len(pilot_seeds),
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        },
        "cells": {}
    }

    total_episodes_run = 0
    hard_limit_violations = 0

    for model_name in target_models:
        model = models[model_name]
        planner = CEMPlanner(
            model=model,
            horizon=5,
            num_samples=25,
            num_elites=5,
            action_bounds=action_bounds,
            task="multifinger_lift",
            seed=100
        )

        for variant in variants:
            cell_key = f"{model_name}__{variant}"
            print(f"\n  [PILOT RUN] Evaluating Cell: {cell_key} (5 episodes)...", flush=True)

            substitutor = ContactAwareActionSubstitutor()
            cell_successes = 0
            cell_interventions = 0
            cell_decisions = 0
            cell_hard_violations = 0
            max_clamp_streak = 0
            current_clamp_streak = 0

            for ep_idx, ep_seed in enumerate(pilot_seeds):
                env = MultifingerLiftEnv(seed=ep_seed)
                obs = env.reset(seed=ep_seed)
                substitutor.reset()
                episode_interventions = 0
                ep_max_fn = 0.0

                for step in range(25):
                    # Propose action from model planner
                    action_prop = planner.plan(obs)
                    # Coordinate action substitution
                    action_sub, intervened, sub_info = substitutor.substitute_action(
                        obs, action_prop, variant=variant
                    )

                    if intervened:
                        episode_interventions += 1
                        cell_interventions += 1

                    # Track clamp streak
                    if sub_info.get("branch") in ["Baseline_C2", "E02_A_Clamped", "Branch_Hard_Limit_Arrest", "Branch_Unmeasured_Shear_Lift_Blocked"]:
                        current_clamp_streak += 1
                        if current_clamp_streak > max_clamp_streak:
                            max_clamp_streak = current_clamp_streak
                    else:
                        current_clamp_streak = 0

                    cell_decisions += 1

                    # Execute environment step
                    next_obs, reward, done, env_info = env.step(action_sub)

                    # Monitor physical normal force
                    step_max_fn = float(np.max(next_obs.get("finger_normal_force", [0.0])))
                    if step_max_fn > ep_max_fn:
                        ep_max_fn = step_max_fn

                    if step_max_fn >= 25.0:
                        cell_hard_violations += 1
                        hard_limit_violations += 1

                    obs = next_obs
                    if done:
                        break

                # Evaluation criteria: object lifted > 2.0 mm
                final_z = float(obs.get("obj_pos", [0.0, 0.0, 0.0])[2])
                success = bool(final_z >= 2.0)
                if success:
                    cell_successes += 1

                total_episodes_run += 1
                print(f"    Ep {ep_idx+1}/5 (Seed {ep_seed}): Success={success}, Max Fn={ep_max_fn:.2f}N, Interventions={episode_interventions}/25", flush=True)

            pilot_results["cells"][cell_key] = {
                "success_rate": cell_successes / 5.0,
                "success_count": f"{cell_successes}/5",
                "interventions": cell_interventions,
                "decisions": cell_decisions,
                "intervention_rate": round(cell_interventions / max(1, cell_decisions), 4),
                "hard_limit_violations": cell_hard_violations,
                "max_clamp_streak": max_clamp_streak
            }

    pilot_results["summary"] = {
        "total_episodes": total_episodes_run,
        "total_hard_violations": hard_limit_violations,
        "primary_safety_passed": bool(hard_limit_violations == 0),
        "execution_time_sec": round(time.time() - start_time, 2)
    }

    print("\n" + "=" * 80)
    print(f"  PILOT COMPLETE: {total_episodes_run} Episodes Run across 10 Cells")
    print(f"  Hard Limit Violations (Fn >= 25N): {hard_limit_violations}/50")
    print(f"  Safety Invariant: {'PASSED' if hard_limit_violations == 0 else 'FAILED'}")
    print("=" * 80 + "\n", flush=True)

    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
        out_path = os.path.join(output_dir, "p26_exp02_pilot_results.json")
        with open(out_path, "w") as f:
            json.dump(to_json_serializable(pilot_results), f, indent=2)
        print(f"  Results saved to: {out_path}\n")

    return pilot_results


if __name__ == "__main__":
    run_p26_exp02_pilot()
