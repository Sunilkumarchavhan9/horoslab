"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.3 — Counterfactual Simulation Engine for Target A & Target B

Generates rigorous counterfactual branches at replanning decisions:
- Target A (Primary): Selected Open-Loop Plan executed without replanning in a cloned simulator.
- Target B: Closed-Loop Policy Future executed with full receding-horizon replanning in a cloned simulator.
Isolates optimizer-selected candidate forecast discrepancies from online replanning corrections.
"""

from __future__ import annotations
import copy
from typing import Dict, Any, List, Optional, Tuple, Callable
import numpy as np
import torch
from src.contact_modes.contact_mode_definitions import ContactMode, classify_contact_mode, NUM_MODES
from src.selection_aware.planner_fingerprint import PlannerFingerprint


def extract_env_state_and_wrench(obs: Dict[str, Any], task: str = "peg_in_hole") -> Tuple[np.ndarray, np.ndarray]:
    """Helper to extract consistent state vector (state_dim) and wrench (6)."""
    if task == "peg_in_hole":
        s_vec = np.concatenate([
            obs["pos"], obs["vel"],
            obs["rot"], obs["wrench"]
        ]).astype(np.float32)
        wrench = obs["wrench"].astype(np.float32)
    else:
        s_vec = np.concatenate([
            obs["finger_pos"].flatten(),
            obs["finger_fn"],
            obs["slip_ratio"],
            obs["obj_pos"]
        ]).astype(np.float32)
        wrench = np.pad(obs["finger_fn"][:3], (0, 3)).astype(np.float32)
    return s_vec, wrench


class CounterfactualRolloutEngine:
    """
    Executes counterfactual simulator branches to evaluate model forecasts on planner-selected actions.
    """

    def __init__(
        self,
        env,
        hybrid_model,
        reward_fn: Callable[[np.ndarray, np.ndarray], float],
        fingerprint: PlannerFingerprint,
        evaluation_horizons: Tuple[int, ...] = (1, 3, 5, 10, 20),
    ):
        self.env = env
        self.hybrid_model = hybrid_model
        self.reward_fn = reward_fn
        self.fingerprint = fingerprint
        self.evaluation_horizons = evaluation_horizons
        self.max_eval_horizon = max(evaluation_horizons)

    def execute_target_a_branch(
        self,
        env_state_snapshot,
        selected_action_sequence: np.ndarray,
        task: str = "peg_in_hole",
    ) -> Dict[str, Any]:
        """
        Target A: Executes the frozen selected candidate sequence in a cloned simulator WITHOUT replanning.
        Compares candidate open-loop model predictions against counterfactual realization.
        """
        clone_env = copy.deepcopy(env_state_snapshot)
        seq_len = len(selected_action_sequence)

        realized_states = []
        realized_wrenches = []
        realized_modes = []
        realized_rewards = []
        safety_violation = False

        prev_obs = clone_env._get_obs()
        for t in range(seq_len):
            action = selected_action_sequence[t]
            obs, r, done, info = clone_env.step(action)

            s_vec, wrench = extract_env_state_and_wrench(obs, task)
            mode = classify_contact_mode(obs, prev_state=prev_obs, task=task)
            prev_obs = obs

            realized_states.append(s_vec)
            realized_wrenches.append(wrench)
            realized_modes.append(int(mode))
            realized_rewards.append(r)

            if getattr(clone_env, "safety_violated", False) or getattr(clone_env, "crush_violated", False):
                safety_violation = True
            if done:
                # Pad remaining horizon if early termination occurred
                while len(realized_states) < seq_len:
                    realized_states.append(s_vec.copy())
                    realized_wrenches.append(wrench.copy())
                    realized_modes.append(int(mode))
                    realized_rewards.append(0.0)
                break

        return {
            "forecast_semantics": "selected_open_loop_plan",
            "realized_states": np.array(realized_states, dtype=np.float32),
            "realized_wrenches": np.array(realized_wrenches, dtype=np.float32),
            "realized_modes": np.array(realized_modes, dtype=np.int64),
            "realized_rewards": np.array(realized_rewards, dtype=np.float32),
            "realized_cumulative_return": float(np.sum(realized_rewards)),
            "safety_violated": safety_violation,
        }

    def execute_target_b_branch(
        self,
        env_state_snapshot,
        planner,
        horizon_steps: int = 10,
        task: str = "peg_in_hole",
    ) -> Dict[str, Any]:
        """
        Target B: Executes the full receding-horizon policy WITH replanning at every step in a cloned simulator.
        Measures closed-loop policy future accuracy.
        """
        clone_env = copy.deepcopy(env_state_snapshot)
        realized_states = []
        realized_wrenches = []
        realized_modes = []
        realized_rewards = []
        safety_violation = False

        prev_obs = clone_env._get_obs()
        for step in range(horizon_steps):
            s_vec, _ = extract_env_state_and_wrench(prev_obs, task)

            # Receding-horizon replanning in clone
            action, _ = planner.plan(s_vec, self.reward_fn)
            obs, r, done, info = clone_env.step(action)

            curr_s_vec, wrench = extract_env_state_and_wrench(obs, task)
            mode = classify_contact_mode(obs, prev_state=prev_obs, task=task)
            prev_obs = obs

            realized_states.append(curr_s_vec)
            realized_wrenches.append(wrench)
            realized_modes.append(int(mode))
            realized_rewards.append(r)

            if getattr(clone_env, "safety_violated", False) or getattr(clone_env, "crush_violated", False):
                safety_violation = True
            if done:
                while len(realized_states) < horizon_steps:
                    realized_states.append(curr_s_vec.copy())
                    realized_wrenches.append(wrench.copy())
                    realized_modes.append(int(mode))
                    realized_rewards.append(0.0)
                break

        return {
            "forecast_semantics": "closed_loop_policy",
            "realized_states": np.array(realized_states, dtype=np.float32),
            "realized_wrenches": np.array(realized_wrenches, dtype=np.float32),
            "realized_modes": np.array(realized_modes, dtype=np.int64),
            "realized_rewards": np.array(realized_rewards, dtype=np.float32),
            "realized_cumulative_return": float(np.sum(realized_rewards)),
            "safety_violated": safety_violation,
        }
