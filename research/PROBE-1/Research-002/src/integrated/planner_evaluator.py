"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.5 — Five-Way Integrated Evaluation: Closed-Loop Planner Evaluator

Executes receding-horizon CEM trajectory optimization across held-out evaluation episodes:
1. Clones simulator at each decision step to isolate Target A (open-loop plan) from Target B (closed-loop future).
2. Interleaves p-CBF safety filter runtime monitoring.
3. Records Planner Exploitation Gap (PEG = Predicted Reward - Realized Reward).
4. Computes downstream manipulation success, goal progress, action magnitude, and stall rate under the corrected 25-step horizon.
"""

from __future__ import annotations
import copy
from typing import Dict, Any, List, Tuple, Callable, Optional
import numpy as np
import torch

from src.contact_modes.contact_mode_definitions import ContactMode, classify_contact_mode, NUM_MODES
from src.contact_modes.hybrid_contact_state_model import HybridContactStateModel
from src.planners.cem_planner import CEMPlanner
from src.environment.peg_in_hole_env import PegInHoleEnv
from src.environment.multifinger_lift_env import MultifingerLiftEnv
from src.selection_aware.counterfactual_rollout import extract_env_state_and_wrench
from src.integrated.safety_evaluator import SafetyEvaluator
from src.integrated.statistical_analysis import format_count_pct, compute_wilson_ci


class PlannerEvaluator:
    """
    Evaluates closed-loop receding-horizon planning, Target A/B counterfactual branches,
    and safety filter interventions under standardized P2.5 protocol.
    """

    def __init__(
        self,
        task: str = "peg_in_hole",
        eval_horizon: int = 25,
        plan_horizon: int = 10,
        num_candidates: int = 60,
        elite_fraction: float = 0.15,
        cem_iterations: int = 2,
        seed: int = 42,
    ):
        self.task = task
        self.eval_horizon = eval_horizon
        self.plan_horizon = plan_horizon
        self.num_candidates = num_candidates
        self.elite_fraction = elite_fraction
        self.cem_iterations = cem_iterations
        self.seed = seed

        self.safety_evaluator = SafetyEvaluator(task=task)

        if task == "peg_in_hole":
            self.state_dim = 15
            self.action_dim = 6
            self.action_bounds = (
                np.array([-5.0, -5.0, -5.0, -2.0, -2.0, -2.0]),
                np.array([5.0, 5.0, 5.0, 2.0, 2.0, 2.0])
            )
            def reward_fn(s: np.ndarray, a: np.ndarray) -> float:
                peg_z = s[2]
                lateral_err = np.linalg.norm(s[:2])
                wrench_norm = np.linalg.norm(s[9:15]) if len(s) >= 15 else np.linalg.norm(s[:3])
                return -float(lateral_err * 2.0 + max(0.0, peg_z) * 1.5 - min(0.0, peg_z) * 5.0 + wrench_norm * 0.1)
            self.reward_fn = reward_fn
        else:
            self.state_dim = 23
            self.action_dim = 5
            self.action_bounds = (
                np.array([-1.0, -1.0, -1.0, -1.0, -1.0]),
                np.array([1.0, 1.0, 1.0, 1.0, 1.0])
            )
            def reward_fn(s: np.ndarray, a: np.ndarray) -> float:
                obj_z = s[22] if len(s) >= 23 else s[2]
                slip = np.linalg.norm(s[16:20]) if len(s) >= 23 else 0.0
                force_err = abs(np.sum(s[12:16]) - 16.0) if len(s) >= 23 else 0.0
                return float(obj_z * 15.0 - slip * 5.0 - force_err * 0.1)
            self.reward_fn = reward_fn

    def create_env(self, seed: int):
        if self.task == "peg_in_hole":
            return PegInHoleEnv(seed=seed)
        return MultifingerLiftEnv(seed=seed)

    def evaluate_policy(
        self,
        hybrid_wm: HybridContactStateModel,
        num_episodes: int = 30,
        start_seed: int = 5000,
        use_safety_filter: bool = True,
    ) -> Dict[str, Any]:
        """
        Executes receding-horizon evaluation across held-out episodes.
        Returns aggregated performance metrics, safety diagnostics, and episode traces for both Target A and B.
        """
        planner = CEMPlanner(
            world_model=hybrid_wm,
            action_dim=self.action_dim,
            action_bounds=self.action_bounds,
            horizon=self.plan_horizon,
            num_samples=self.num_candidates,
            elite_fraction=self.elite_fraction,
            num_iterations=self.cem_iterations,
        )

        safety_filter = self.safety_evaluator.create_safety_filter() if use_safety_filter else None

        episodes_data = []
        peg_values = []
        progress_values = []
        action_magnitudes = []
        success_count = 0
        violation_count = 0
        stall_count = 0

        target_a_episodes = []
        target_b_episodes = []

        for ep_idx in range(num_episodes):
            ep_seed = start_seed + ep_idx
            env = self.create_env(seed=ep_seed)
            obs = env.reset()

            ep_decisions_a = []
            ep_decisions_b = []
            ep_interventions = 0
            ep_has_violation = False

            realized_states_b = []
            realized_wrenches_b = []
            realized_modes_b = []
            actions_executed = []

            s_init, w_init = extract_env_state_and_wrench(obs, self.task)
            realized_states_b.append(s_init)
            realized_wrenches_b.append(w_init)
            realized_modes_b.append(classify_contact_mode(obs, task=self.task))

            step_positions = []

            for step in range(self.eval_horizon):
                s_current, w_current = extract_env_state_and_wrench(obs, self.task)
                current_mode = classify_contact_mode(obs, task=self.task)

                # 1. Plan candidate trajectory
                best_first_action, plan_info = planner.plan(s_current, self.reward_fn)
                candidate_sequence = plan_info.get("best_trajectory")
                if candidate_sequence is None:
                    candidate_sequence = np.repeat(best_first_action[np.newaxis, :], self.plan_horizon, axis=0)

                pred_reward = float(plan_info.get("best_predicted_return", 0.0))

                # Multi-step autoregressive rollout with learned world model
                rollout_pred = hybrid_wm.predict_multistep(
                    s_current, candidate_sequence, horizon=len(candidate_sequence), task=self.task
                )
                pred_traj_states = rollout_pred["states"]
                pred_traj_wrenches = np.zeros((len(candidate_sequence), 6), dtype=np.float32)
                cf_slice = rollout_pred["contact_forces"]
                pred_traj_wrenches[:, :min(6, cf_slice.shape[1])] = cf_slice[:, :min(6, cf_slice.shape[1])]
                pred_traj_modes = rollout_pred.get("predicted_modes", rollout_pred.get("top_modes"))
                pred_traj_mode_probs = rollout_pred["mode_probabilities"]

                # 2. Target A Counterfactual Branch (clone simulator, execute open-loop plan without replanning)
                clone_env = copy.deepcopy(env)
                target_a_states = []
                target_a_wrenches = []
                target_a_modes = []
                target_a_rewards = []

                for act in candidate_sequence:
                    c_obs, c_r, c_done, _ = clone_env.step(act)
                    c_s, c_w = extract_env_state_and_wrench(c_obs, self.task)
                    c_m = classify_contact_mode(c_obs, task=self.task)
                    target_a_states.append(c_s)
                    target_a_wrenches.append(c_w)
                    target_a_modes.append(c_m)
                    target_a_rewards.append(float(c_r))
                    if c_done:
                        break

                realized_a_cum_reward = float(np.sum(target_a_rewards))
                peg_step = pred_reward - realized_a_cum_reward
                peg_values.append(peg_step)

                L_a = len(target_a_modes)
                ep_decisions_a.append({
                    "step": step,
                    "pred_states": np.array(pred_traj_states[:L_a]),
                    "realized_states": np.array(target_a_states),
                    "pred_wrenches": np.array(pred_traj_wrenches[:L_a]),
                    "realized_wrenches": np.array(target_a_wrenches),
                    "pred_modes": np.array(pred_traj_modes[:L_a]),
                    "pred_mode_probs": np.array(pred_traj_mode_probs[:L_a]),
                    "realized_modes": np.array(target_a_modes),
                    "pred_reward": pred_reward,
                    "realized_reward": realized_a_cum_reward,
                    "peg": peg_step,
                    "stratum": int(current_mode),
                })

                # 3. Action Filtering (p-CBF)
                chosen_action = best_first_action.copy()
                intervened = False
                if safety_filter:
                    chosen_action, intervened, _ = safety_filter.filter_action(
                        current_state=obs,
                        candidate_action=chosen_action,
                        task=self.task,
                    )
                    if intervened:
                        ep_interventions += 1

                action_magnitudes.append(float(np.linalg.norm(chosen_action)))
                actions_executed.append(chosen_action)

                # 4. Target B: Execute action in real simulator (Receding Horizon)
                obs, r, done, info = env.step(chosen_action)
                s_next, w_next = extract_env_state_and_wrench(obs, self.task)
                m_next = classify_contact_mode(obs, task=self.task)

                realized_states_b.append(s_next)
                realized_wrenches_b.append(w_next)
                realized_modes_b.append(m_next)

                p_m_prob = pred_traj_mode_probs[0:1] if len(pred_traj_mode_probs) > 0 else np.full((1, 7), 1.0/7.0, dtype=np.float32)

                ep_decisions_b.append({
                    "step": step,
                    "pred_states": np.array([pred_traj_states[0]]) if len(pred_traj_states) > 0 else np.array([s_next]),
                    "realized_states": np.array([s_next]),
                    "pred_wrenches": np.array([pred_traj_wrenches[0]]) if len(pred_traj_wrenches) > 0 else np.array([w_next]),
                    "realized_wrenches": np.array([w_next]),
                    "pred_modes": np.array([pred_traj_modes[0]]) if len(pred_traj_modes) > 0 else np.array([m_next]),
                    "pred_mode_probs": p_m_prob,
                    "realized_modes": np.array([m_next]),
                    "stratum": int(current_mode),
                })

                is_viol, _ = self.safety_evaluator.check_safety_violation(obs)
                if is_viol or getattr(env, "safety_violated", False) or getattr(env, "crush_violated", False):
                    ep_has_violation = True

                if self.task == "peg_in_hole":
                    step_positions.append(float(env.peg_pos[2]))
                else:
                    step_positions.append(float(env.obj_pos[2]))

                if done:
                    break

            # Episode outcome calculation
            is_success = bool(env.seated if self.task == "peg_in_hole" else getattr(env, "object_lifted", False))
            if is_success:
                success_count += 1
            if ep_has_violation:
                violation_count += 1

            # Goal Progress
            if self.task == "peg_in_hole":
                # peg starts at +15 mm; success is <= -50 mm. Progress is mm inserted down.
                final_z = float(env.peg_pos[2])
                progress = max(0.0, 15.0 - final_z)
            else:
                final_z = float(env.obj_pos[2])
                progress = max(0.0, final_z)
            progress_values.append(progress)

            # Stall detection: if position barely moved over last 5 steps and progress is near zero
            is_stalled = False
            if len(step_positions) >= 5:
                pos_variance = float(np.var(step_positions[-5:]))
                if pos_variance < 1e-4 and progress < (1.0 if self.task == "peg_in_hole" else 0.01):
                    is_stalled = True
                    stall_count += 1

            failure_mode = self.safety_evaluator.classify_failure_mode(
                is_success=is_success,
                env_state={
                    "jammed": getattr(env, "jammed", False),
                    "wedged": getattr(env, "wedged", False),
                    "object_dropped": getattr(env, "object_dropped", False),
                    "slip_exceeded": getattr(env, "slip_exceeded", False),
                    "stalled": is_stalled,
                    "safety_violated": ep_has_violation,
                },
                interventions_in_episode=ep_interventions,
                total_steps=len(actions_executed),
                eval_horizon=self.eval_horizon,
            )

            ep_meta = {
                "episode_idx": ep_idx,
                "seed": ep_seed,
                "initial_mode": int(realized_modes_b[0]) if len(realized_modes_b) > 0 else 0,
                "is_success": is_success,
                "has_violation": ep_has_violation,
                "is_stalled": is_stalled,
                "intervention_count": ep_interventions,
                "steps": len(actions_executed),
                "goal_progress": round(progress, 4),
                "failure_mode": failure_mode,
            }

            target_a_episodes.append({
                **ep_meta,
                "forecast_semantics": "selected_open_loop_plan",
                "decisions": ep_decisions_a,
            })

            target_b_episodes.append({
                **ep_meta,
                "forecast_semantics": "closed_loop_policy",
                "realized_states": np.array(realized_states_b),
                "actions": np.array(actions_executed),
                "realized_modes": np.array(realized_modes_b),
                "decisions": ep_decisions_b,
            })

            episodes_data.append(ep_meta)

        # Safety Audit
        safety_audit = self.safety_evaluator.audit_safety_performance(episodes_data)

        # Aggregated Manipulation Metrics
        succ_info = format_count_pct(success_count, num_episodes)
        viol_info = format_count_pct(violation_count, num_episodes)
        stall_info = format_count_pct(stall_count, num_episodes)

        mean_prog = round(float(np.mean(progress_values)), 4)
        max_prog = round(float(np.max(progress_values)), 4)
        std_prog = round(float(np.std(progress_values)), 4)
        mean_act_mag = round(float(np.mean(action_magnitudes)), 4) if len(action_magnitudes) > 0 else 0.0

        peg_mean = round(float(np.mean(peg_values)), 4) if len(peg_values) > 0 else 0.0
        peg_std = round(float(np.std(peg_values)), 4) if len(peg_values) > 0 else 0.0

        return {
            "task": self.task,
            "eval_horizon_steps": self.eval_horizon,
            "total_episodes": num_episodes,
            "task_success": succ_info,
            "safety_violations": viol_info,
            "stall_rate": stall_info,
            "goal_progress": {
                "unit": "mm_depth" if self.task == "peg_in_hole" else "meters_height",
                "mean": mean_prog,
                "max": max_prog,
                "std": std_prog,
            },
            "mean_action_magnitude": mean_act_mag,
            "planner_exploitation_gap": {
                "mean": peg_mean,
                "std": peg_std,
            },
            "safety_audit": safety_audit,
            "target_a_episodes": target_a_episodes,
            "target_b_episodes": target_b_episodes,
        }
