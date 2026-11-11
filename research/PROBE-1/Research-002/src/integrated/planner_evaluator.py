"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.5 — Five-Way Integrated Evaluation: Closed-Loop Planner Evaluator

Executes receding-horizon CEM trajectory optimization across held-out evaluation episodes:
1. Clones simulator at each decision step to isolate Target A (open-loop plan) from Target B (closed-loop future).
2. Interleaves p-CBF safety filter runtime monitoring.
3. Records Planner Exploitation Gap (PEG = Predicted Reward - Realized Reward).
4. Computes downstream manipulation success, goal progress, action magnitude, and stall rate under the 50-step closed-loop horizon.
"""

from __future__ import annotations
import copy
from typing import Dict, Any, List, Tuple, Callable, Optional
import numpy as np
import torch

from src.contact_modes.contact_mode_definitions import ContactMode, classify_contact_mode, NUM_MODES
from src.contact_modes.hybrid_contact_state_model import HybridContactStateModel
from src.planners.cem_planner import CEMPlanner
from src.planners.uncertainty_penalized_cem import UncertaintyPenalizedCEM
from src.planners.recovery_aware_cem import RecoveryAwareCEMPlanner
from src.environment.peg_in_hole_env import PegInHoleEnv
from src.environment.multifinger_lift_env import MultifingerLiftEnv
from src.selection_aware.counterfactual_rollout import extract_env_state_and_wrench
from src.integrated.safety_evaluator import SafetyEvaluator
from src.integrated.statistical_analysis import (
    format_count_pct,
    compute_wilson_ci,
    compute_multihorizon_rmse,
    HORIZONS,
)


class PlannerEvaluator:
    """
    Evaluates closed-loop receding-horizon planning, Target A/B counterfactual branches,
    and safety filter interventions under standardized P2.5 protocol.
    """

    def __init__(
        self,
        task: str = "peg_in_hole",
        eval_horizon: int = 50,
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

    def _create_planner_for_model(
        self,
        hybrid_wm: HybridContactStateModel,
        architecture_id: Optional[str] = None,
        planner_type: str = "auto",
        uncertainty_beta: float = 1.5,
        uncertainty_source: str = "auto",
    ) -> Tuple[Any, str, str, str, str]:
        """
        Instantiates the planner corresponding to the architecture while preserving
        independent B1/B2/B3 planner identities.
        """
        resolved_arch = architecture_id or getattr(hybrid_wm, "architecture_id", None)
        if resolved_arch is None:
            cls_name = type(getattr(hybrid_wm, "continuous_model", hybrid_wm)).__name__
            if "Ensemble" in cls_name:
                resolved_arch = "B3"
            elif "Probabilistic" in cls_name:
                resolved_arch = "B2"
            else:
                resolved_arch = "B1"

        mode_key = planner_type.strip().lower()
        if mode_key == "auto":
            if resolved_arch in ("B2", "B3") or type(getattr(hybrid_wm, "continuous_model", None)).__name__ in (
                "ProbabilisticWorldModel",
                "EnsembleWorldModel",
            ):
                mode_key = "uncertainty_penalized_cem"
            else:
                mode_key = "cem"

        if mode_key == "uncertainty_penalized_cem":
            src_mode = uncertainty_source
            if src_mode == "auto":
                if resolved_arch == "B2":
                    src_mode = "aleatoric"
                elif resolved_arch == "B3":
                    src_mode = "epistemic"
            planner = UncertaintyPenalizedCEM(
                ensemble_model=hybrid_wm,
                action_dim=self.action_dim,
                action_bounds=self.action_bounds,
                horizon=self.plan_horizon,
                num_samples=self.num_candidates,
                elite_fraction=self.elite_fraction,
                num_iterations=self.cem_iterations,
                beta=uncertainty_beta,
                uncertainty_source=src_mode,
                seed=self.seed,
            )
            planner_class = "UncertaintyPenalizedCEM"
            planner_identity = f"{resolved_arch}_UncertaintyPenalizedCEM_{src_mode}"
            return planner, planner_identity, planner_class, resolved_arch, src_mode

        if mode_key == "recovery_aware_cem":
            planner = RecoveryAwareCEMPlanner(
                world_model=hybrid_wm,
                action_dim=self.action_dim,
                action_bounds=self.action_bounds,
                horizon=self.plan_horizon,
                num_samples=self.num_candidates,
                elite_fraction=self.elite_fraction,
                num_iterations=self.cem_iterations,
            )
            return planner, f"{resolved_arch}_RecoveryAwareCEMPlanner", "RecoveryAwareCEMPlanner", resolved_arch, "none"

        planner = CEMPlanner(
            world_model=hybrid_wm,
            action_dim=self.action_dim,
            action_bounds=self.action_bounds,
            horizon=self.plan_horizon,
            num_samples=self.num_candidates,
            elite_fraction=self.elite_fraction,
            num_iterations=self.cem_iterations,
        )
        return planner, f"{resolved_arch}_CEMPlanner", "CEMPlanner", resolved_arch, "none"

    def evaluate_policy(
        self,
        hybrid_wm: HybridContactStateModel,
        num_episodes: int = 30,
        start_seed: int = 5000,
        use_safety_filter: bool = True,
        architecture_id: Optional[str] = None,
        planner_type: str = "auto",
        uncertainty_beta: float = 1.5,
        uncertainty_source: str = "auto",
    ) -> Dict[str, Any]:
        """
        Executes receding-horizon evaluation across held-out episodes.
        Preserves independent planner identities across B1 (CEMPlanner), B2 (aleatoric
        UncertaintyPenalizedCEM), and B3 (epistemic UncertaintyPenalizedCEM), and computes
        multi-horizon Target A forecast accuracy without zero-filling missing steps.
        """
        planner, planner_identity, planner_class, resolved_arch, resolved_unc_source = (
            self._create_planner_for_model(
                hybrid_wm=hybrid_wm,
                architecture_id=architecture_id,
                planner_type=planner_type,
                uncertainty_beta=uncertainty_beta,
                uncertainty_source=uncertainty_source,
            )
        )

        safety_filter = self.safety_evaluator.create_safety_filter() if use_safety_filter else None

        episodes_data = []
        peg_values = []
        progress_values = []
        action_magnitudes = []
        epistemic_step_vals = []
        aleatoric_step_vals = []
        penalized_return_vals = []
        penalty_vals = []
        target_a_pred_trajs: List[np.ndarray] = []
        target_a_true_trajs: List[np.ndarray] = []
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
                if "best_penalized_return" in plan_info:
                    penalized_return_vals.append(float(plan_info["best_penalized_return"]))
                if "best_uncertainty_penalty" in plan_info:
                    penalty_vals.append(float(plan_info["best_uncertainty_penalty"]))

                # Multi-step autoregressive rollout with learned world model
                rollout_pred = hybrid_wm.predict_multistep(
                    s_current, candidate_sequence, horizon=len(candidate_sequence), task=self.task
                )
                pred_traj_states = rollout_pred["states"]
                if "epistemic_uncertainties" in rollout_pred and len(rollout_pred["epistemic_uncertainties"]) > 0:
                    epistemic_step_vals.append(float(rollout_pred["epistemic_uncertainties"][0]))
                if "aleatoric_uncertainties" in rollout_pred and len(rollout_pred["aleatoric_uncertainties"]) > 0:
                    aleatoric_step_vals.append(float(rollout_pred["aleatoric_uncertainties"][0]))
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
                if L_a > 0:
                    target_a_pred_trajs.append(np.array(pred_traj_states[:L_a], dtype=np.float32))
                    target_a_true_trajs.append(np.array(target_a_states, dtype=np.float32))
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

        target_a_mh_rmse = (
            compute_multihorizon_rmse(
                pred_trajectories=target_a_pred_trajs,
                true_trajectories=target_a_true_trajs,
                horizons=HORIZONS,
                task=self.task,
                detailed=True,
            )
            if len(target_a_pred_trajs) > 0
            else None
        )

        uncertainty_summary = {
            "epistemic_mean": round(float(np.mean(epistemic_step_vals)), 4) if epistemic_step_vals else 0.0,
            "aleatoric_mean": round(float(np.mean(aleatoric_step_vals)), 4) if aleatoric_step_vals else 0.0,
            "mean_penalized_return": round(float(np.mean(penalized_return_vals)), 4) if penalized_return_vals else None,
            "mean_uncertainty_penalty": round(float(np.mean(penalty_vals)), 4) if penalty_vals else 0.0,
        }

        return {
            "task": self.task,
            "architecture_id": resolved_arch,
            "planner_identity": planner_identity,
            "planner_type": planner_class,
            "uncertainty_source": resolved_unc_source,
            "uncertainty_beta": float(uncertainty_beta) if planner_class == "UncertaintyPenalizedCEM" else 0.0,
            "eval_horizon_steps": self.eval_horizon,
            "total_episodes": num_episodes,
            "task_success": succ_info,
            "safety_violations": viol_info,
            "stall_rate": stall_info,
            "goal_progress": {
                "unit": "mm_depth" if self.task == "peg_in_hole" else "height_mm",
                "mean": mean_prog,
                "max": max_prog,
                "std": std_prog,
            },
            "mean_action_magnitude": mean_act_mag,
            "planner_exploitation_gap": {
                "mean": peg_mean,
                "std": peg_std,
            },
            "uncertainty_summary": uncertainty_summary,
            "target_a_multihorizon_rmse": target_a_mh_rmse,
            "safety_audit": safety_audit,
            "target_a_episodes": target_a_episodes,
            "target_b_episodes": target_b_episodes,
        }
