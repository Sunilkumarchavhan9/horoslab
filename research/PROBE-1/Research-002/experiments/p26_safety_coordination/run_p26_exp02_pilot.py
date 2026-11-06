"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.6: Contact-Aware Safety Coordination
Experiment 02 Pilot: 50-Episode Pre-Registered Smoke-Test Execution Runner
(Document 42 & Document 43 Corrective Specifications)

Key Features:
1. Strict 8-channel decision telemetry logging (1,250 decision records).
2. Unconditional episode accounting (episodes_completed vs episodes_successful).
3. Dynamic two-step 18 N active retraction damping evaluation.
4. Per-episode clamp streak reset & isolated E02-C/M4 vs C2/M4 comparison.
5. Built-in dry-run verification mode.
"""

import sys
import os
import time
import json
import argparse
from typing import Dict, Any, List, Optional
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
from src.contact_modes.contact_mode_definitions import classify_contact_mode
from src.coordination.action_substitutor import ContactAwareActionSubstitutor
from src.coordination.intervention_telemetry import InterventionTelemetryLogger
from src.integrated.statistical_analysis import compute_wilson_ci, to_json_serializable


class DynamicDampingTracker:
    """Evaluates whether force growth arrests or reverses within 2 steps after reaching 18 N."""
    def __init__(self, threshold: float = 18.0):
        self.threshold = threshold
        self.total_excursions = 0
        self.damped_excursions = 0
        self.failed_excursions = 0
        # Active tracking: list of {"finger": i, "step": t, "f_thresh": val, "resolved": bool}
        self.active_events = []

    def reset_episode(self):
        # Resolve any trailing events at episode termination
        for ev in self.active_events:
            if not ev["resolved"]:
                if ev.get("last_observed", ev["f_thresh"]) <= ev["f_thresh"]:
                    self.damped_excursions += 1
                else:
                    self.failed_excursions += 1
                ev["resolved"] = True
        self.active_events = []

    def update_step(self, step_idx: int, normal_forces: np.ndarray):
        fn = np.asarray(normal_forces, dtype=float)
        # Check active events for resolution
        for ev in self.active_events:
            if ev["resolved"]:
                continue
            f_idx = ev["finger"]
            f_thresh = ev["f_thresh"]
            t_start = ev["step"]
            delta_t = step_idx - t_start

            if delta_t == 1:
                ev["last_observed"] = fn[f_idx]
                if fn[f_idx] <= f_thresh:
                    ev["resolved"] = True
                    self.damped_excursions += 1
            elif delta_t >= 2:
                ev["last_observed"] = fn[f_idx]
                ev["resolved"] = True
                if fn[f_idx] <= f_thresh:
                    self.damped_excursions += 1
                else:
                    self.failed_excursions += 1

        # Check for new excursions
        for i in range(len(fn)):
            if fn[i] >= self.threshold:
                # Check if this finger is already actively being tracked
                already_active = any(
                    (ev["finger"] == i and not ev["resolved"] and step_idx - ev["step"] < 2)
                    for ev in self.active_events
                )
                if not already_active:
                    self.total_excursions += 1
                    self.active_events.append({
                        "finger": i,
                        "step": step_idx,
                        "f_thresh": fn[i],
                        "last_observed": fn[i],
                        "resolved": False
                    })


def run_p26_exp02_pilot(
    dry_run: bool = False,
    output_dir: Optional[str] = None
) -> Dict[str, Any]:
    print("\n" + "=" * 80)
    print("  HOROS PROBE-1 STAGE P2.6 — EXPERIMENT 02: 50-EPISODE CONTROLLED PILOT")
    print("  Document 42 & Document 43 Corrective Protocol")
    print("=" * 80, flush=True)

    pilot_seeds = [42, 142, 242, 342, 442]
    variants = ["baseline_C2", "E02_A", "E02_B", "E02_C", "E02_D"]
    target_models = ["M2_boundary", "M4_acmm"]
    total_expected_episodes = len(variants) * len(target_models) * len(pilot_seeds)
    total_expected_decisions = total_expected_episodes * 25

    if dry_run:
        print("  [DRY-RUN MODE] Validating plan layout without simulation execution...")
        planned_cells = {}
        for model_name in target_models:
            for variant in variants:
                cell_key = f"{model_name}__{variant}"
                planned_cells[cell_key] = {
                    "model": model_name,
                    "variant": variant,
                    "episodes": len(pilot_seeds),
                    "decisions": len(pilot_seeds) * 25,
                    "seeds": pilot_seeds
                }

        dry_run_report = {
            "mode": "dry_run",
            "status": "VALIDATED",
            "planned_cells_count": len(planned_cells),
            "planned_total_episodes": total_expected_episodes,
            "planned_total_decisions": total_expected_decisions,
            "planned_seeds": pilot_seeds,
            "variants": variants,
            "models": target_models,
            "cells": planned_cells
        }
        print(f"  Dry-run confirmed: {len(planned_cells)} cells, {total_expected_episodes} episodes, {total_expected_decisions} decision slots.")
        print("=" * 80 + "\n", flush=True)
        return dry_run_report

    start_time = time.time()

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

    telemetry = InterventionTelemetryLogger(task="multifinger_lift")
    damping_tracker = DynamicDampingTracker(threshold=18.0)

    pilot_results = {
        "metadata": {
            "protocol": "Document 42 & Document 43 Corrective Protocol",
            "pilot_seeds": pilot_seeds,
            "variants": variants,
            "models": target_models,
            "total_episodes_planned": total_expected_episodes,
            "total_decisions_planned": total_expected_decisions,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        },
        "cells": {}
    }

    global_episodes_completed = 0
    global_episodes_successful = 0
    global_hard_violations = 0
    global_decisions = 0
    global_interventions = 0
    cell_clamp_streaks = {}

    episode_counter = 0

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
            cell_completed = 0
            cell_successful = 0
            cell_interventions = 0
            cell_decisions = 0
            cell_hard_violations = 0
            cell_max_streak = 0

            for ep_idx, ep_seed in enumerate(pilot_seeds):
                episode_counter += 1
                env = MultifingerLiftEnv(seed=ep_seed)
                obs = env.reset(seed=ep_seed)
                substitutor.reset()
                damping_tracker.reset_episode()

                # Issue 4: Strict streak reset at episode boundary
                current_clamp_streak = 0
                ep_max_streak = 0
                ep_interventions = 0
                ep_max_fn = 0.0

                # Issue 1: Start granular episode telemetry
                telemetry.start_episode(
                    episode_id=episode_counter,
                    model_name=model_name,
                    configuration=variant,
                    seed=ep_seed
                )

                for step in range(25):
                    contact_mode = classify_contact_mode(obs)
                    action_prop = planner.plan(obs)

                    # Coordinate action substitution
                    action_sub, intervened, sub_info = substitutor.substitute_action(
                        obs, action_prop, variant=variant
                    )

                    if intervened:
                        ep_interventions += 1
                        cell_interventions += 1
                        global_interventions += 1

                    # Track clamp streak per episode
                    if sub_info.get("branch") in [
                        "Baseline_C2",
                        "E02_A_Clamped",
                        "Branch_Hard_Limit_Arrest",
                        "Branch_Unmeasured_Shear_Lift_Blocked"
                    ]:
                        current_clamp_streak += 1
                        if current_clamp_streak > ep_max_streak:
                            ep_max_streak = current_clamp_streak
                    else:
                        current_clamp_streak = 0

                    cell_decisions += 1
                    global_decisions += 1

                    # Step environment
                    next_obs, reward, done, env_info = env.step(action_sub)
                    task_progress_mm = float(next_obs.get("obj_pos", [0.0, 0.0, 0.0])[2])

                    # Issue 3: Dynamic 18 N damping tracking
                    step_fn = np.asarray(next_obs.get("finger_normal_force", [0.0] * 4), dtype=float)
                    damping_tracker.update_step(step, step_fn)

                    # Monitor physical normal force
                    step_max_fn = float(np.max(step_fn)) if len(step_fn) > 0 else 0.0
                    if step_max_fn > ep_max_fn:
                        ep_max_fn = step_max_fn

                    if step_max_fn >= 25.0:
                        cell_hard_violations += 1
                        global_hard_violations += 1

                    # Issue 1: Log decision across all 8 channels
                    telemetry.log_decision(
                        step_idx=step,
                        obs=obs,
                        proposed_action=action_prop,
                        filtered_action=action_sub,
                        intervened=intervened,
                        filter_info={
                            "intervention_reason": sub_info.get("branch", "nominal"),
                            "max_slip_ratio": sub_info.get("max_slip_ratio", 0.0),
                            "h_slip": 1.0 - sub_info.get("max_slip_ratio", 0.0),
                            "h_crush": 25.0 - step_max_fn
                        },
                        task_progress_mm=task_progress_mm,
                        contact_mode=contact_mode
                    )

                    obs = next_obs
                    if done:
                        break

                if ep_max_streak > cell_max_streak:
                    cell_max_streak = ep_max_streak

                # Issue 2: Evaluate success and unconditionally increment completed
                final_z = float(obs.get("obj_pos", [0.0, 0.0, 0.0])[2])
                success = bool(final_z >= 2.0)
                if success:
                    cell_successful += 1
                    global_episodes_successful += 1

                cell_completed += 1
                global_episodes_completed += 1

                # Issue 1: Finalize episode telemetry
                telemetry.end_episode(
                    task_success=success,
                    safety_violated=bool(ep_max_fn >= 25.0),
                    stalled=bool(not success and final_z < 0.5),
                    final_progress_mm=final_z
                )

                print(
                    f"    Ep {ep_idx+1}/5 (Seed {ep_seed}): Success={success}, "
                    f"Max Fn={ep_max_fn:.2f}N, Streak={ep_max_streak}, Interventions={ep_interventions}/25",
                    flush=True
                )

            cell_clamp_streaks[cell_key] = cell_max_streak
            pilot_results["cells"][cell_key] = {
                "episodes_completed": cell_completed,
                "episodes_successful": cell_successful,
                "success_rate": round(cell_successful / max(1, cell_completed), 4),
                "interventions": cell_interventions,
                "decisions": cell_decisions,
                "intervention_rate": round(cell_interventions / max(1, cell_decisions), 4),
                "hard_limit_violations": cell_hard_violations,
                "max_clamp_streak": cell_max_streak
            }

    damping_tracker.reset_episode()

    # Issue 4: Isolated E02-C/M4 vs C2/M4 comparison
    m4_c2_streak = cell_clamp_streaks.get("M4_acmm__baseline_C2", 0)
    m4_e02c_streak = cell_clamp_streaks.get("M4_acmm__E02_C", 0)
    streak_reduction = m4_c2_streak - m4_e02c_streak

    pilot_results["streak_comparison"] = {
        "m4_baseline_C2_max_streak": m4_c2_streak,
        "m4_E02_C_max_streak": m4_e02c_streak,
        "streak_reduction_steps": streak_reduction,
        "limit_cycle_eliminated": bool(m4_e02c_streak <= 3)
    }

    # Issue 3: Global 18 N damping summary
    pilot_results["damping_summary"] = {
        "total_18N_excursions": damping_tracker.total_excursions,
        "damped_18N_excursions": damping_tracker.damped_excursions,
        "failed_18N_damping": damping_tracker.failed_excursions,
        "damping_success_rate": round(
            damping_tracker.damped_excursions / max(1, damping_tracker.total_excursions), 4
        ) if damping_tracker.total_excursions > 0 else 1.0
    }

    pilot_results["summary"] = {
        "episodes_completed": global_episodes_completed,
        "episodes_successful": global_episodes_successful,
        "overall_success_rate": round(global_episodes_successful / max(1, global_episodes_completed), 4),
        "total_decisions": global_decisions,
        "total_interventions": global_interventions,
        "overall_intervention_rate": round(global_interventions / max(1, global_decisions), 4),
        "hard_limit_violations": global_hard_violations,
        "primary_safety_passed": bool(global_hard_violations == 0),
        "execution_time_sec": round(time.time() - start_time, 2)
    }

    print("\n" + "=" * 80)
    print(f"  PILOT COMPLETE: {global_episodes_completed}/50 Completed | {global_episodes_successful}/50 Successful")
    print(f"  Hard Limit Violations (Fn >= 25N): {global_hard_violations}/50")
    print(f"  18N Damping: {damping_tracker.damped_excursions}/{damping_tracker.total_excursions} Damped ({pilot_results['damping_summary']['damping_success_rate']*100:.1f}%)")
    print(f"  M4 Clamp Streak: C2={m4_c2_streak} steps -> E02_C={m4_e02c_streak} steps (Reduction: {streak_reduction} steps)")
    print(f"  Safety Invariant: {'PASSED' if global_hard_violations == 0 else 'FAILED'}")
    print("=" * 80 + "\n", flush=True)

    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
        out_summary = os.path.join(output_dir, "p26_exp02_pilot_summary.json")
        out_telemetry = os.path.join(output_dir, "p26_exp02_pilot_telemetry.json")

        with open(out_summary, "w", encoding="utf-8") as f:
            json.dump(to_json_serializable(pilot_results), f, indent=2)
        telemetry.save_json(out_telemetry)

        print(f"  Summary saved to: {out_summary}")
        print(f"  8-Channel Telemetry (1,250 decisions) saved to: {out_telemetry}\n")

    return pilot_results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="P2.6 Experiment 02 Pilot Runner")
    parser.add_argument("--dry-run", action="store_true", help="Perform structural dry-run without simulation")
    parser.add_argument("--output-dir", type=str, default=None, help="Directory to save telemetry results")
    args = parser.parse_args()

    run_p26_exp02_pilot(dry_run=args.dry_run, output_dir=args.output_dir)
