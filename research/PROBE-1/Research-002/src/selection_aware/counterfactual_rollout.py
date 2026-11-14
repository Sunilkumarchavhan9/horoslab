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
from src.environment.step_adapter import get_env_dt, step_env_compatible


def compute_prelift_resultant_wrench(
    finger_pos: np.ndarray,
    obj_pos: np.ndarray,
    finger_fn: np.ndarray,
    finger_ft: np.ndarray,
) -> np.ndarray:
    """Computes the net 6-axis Cartesian contact wrench [Fx, Fy, Fz, Tx, Ty, Tz]

    acting on the grasped rigid workpiece from multi-finger contact observations.

    Coordinate Transformation Contract:
    - Object frame: centered at obj_pos with Cartesian axes X, Y, Z.
    - For each finger i:
        * Lever arm r_i = (finger_pos[i] - obj_pos) * 1e-3 (in meters).
        * In-plane radial distance r_xy = norm(r_i[:2]).
        * Inward normal unit vector: n_i = -[r_i[0]/r_xy, r_i[1]/r_xy, 0].
        * Circumferential tangential unit vector: u_theta_i = [-r_i[1]/r_xy, r_i[0]/r_xy, 0].
        * Vertical pad shear unit vector: u_z = [0, 0, 1].
        * 3D contact force exerted on workpiece by finger i:
            F_i = finger_fn[i] * n_i + finger_ft[i, 0] * u_theta_i + finger_ft[i, 1] * u_z
        * Torque contribution about object center:
            tau_i = r_i x F_i (cross product in N*m).
    - Net resultant wrench:
        W = [sum(F_i_x), sum(F_i_y), sum(F_i_z), sum(tau_i_x), sum(tau_i_y), sum(tau_i_z)]
    """
    pos_arr = np.asarray(finger_pos, dtype=np.float32)
    obj_arr = np.asarray(obj_pos, dtype=np.float32)
    fn_arr = np.asarray(finger_fn, dtype=np.float32)
    ft_arr = np.asarray(finger_ft, dtype=np.float32)

    r_m = (pos_arr - obj_arr) * 1e-3  # (4, 3) in meters
    net_force = np.zeros(3, dtype=np.float32)
    net_torque = np.zeros(3, dtype=np.float32)

    for i in range(min(4, len(pos_arr))):
        r_xy = float(np.linalg.norm(r_m[i, :2]))
        if r_xy > 1e-6:
            u_r = r_m[i, :2] / r_xy
            n_i = np.array([-u_r[0], -u_r[1], 0.0], dtype=np.float32)
            u_theta = np.array([-u_r[1], u_r[0], 0.0], dtype=np.float32)
        else:
            n_i = np.zeros(3, dtype=np.float32)
            u_theta = np.zeros(3, dtype=np.float32)
        u_z = np.array([0.0, 0.0, 1.0], dtype=np.float32)

        fn = float(fn_arr[i])
        ft_theta = float(ft_arr[i, 0]) if ft_arr.ndim == 2 else 0.0
        ft_z = float(ft_arr[i, 1]) if ft_arr.ndim == 2 else float(ft_arr[i])

        F_i = fn * n_i + ft_theta * u_theta + ft_z * u_z
        tau_i = np.cross(r_m[i], F_i)
        net_force += F_i
        net_torque += tau_i

    return np.concatenate([net_force, net_torque]).astype(np.float32)


def extract_env_state_and_wrench(
    obs: Dict[str, Any],
    task: str = "peg_in_hole",
    legacy_compatibility_mode: bool = False,
    legacy_padding: bool = False,
) -> Tuple[np.ndarray, np.ndarray]:
    """Helper to extract consistent state vector (state_dim) and 6-axis wrench (6).

    Coordinate Transformation & Force Contract:
    - Task 1 (peg_in_hole): 15-D state, 6-axis ATI sensor wrench [Fx, Fy, Fz, Tx, Ty, Tz].
    - Task 2 (compliant_prelift, compliant_lift, multifinger_lift): 23-D state:
        [0:12]   Fingertip positions (4 x 3) in mm
        [12:16]  Fingertip normal forces (4) in N
        [16:20]  Fingertip slip velocities (4) in m/s
        [20:23]  Workpiece center of mass (3) in mm
      Wrench representation:
        - Modern physical contract (default): 6-axis Cartesian resultant wrench on the rigid workpiece
          computed via compute_prelift_resultant_wrench(finger_pos, obj_pos, finger_fn, finger_ft),
          combining normal contact forces, circumferential shear, and vertical pad shear with physical
          lever-arm torques. Requires 'finger_ft' in obs; raises ValueError if missing. Applies across
          all Task 2 identifiers ('compliant_prelift', 'compliant_lift', 'multifinger_lift').
        - Legacy checkpoint compatibility mode: enabled strictly when legacy_compatibility_mode=True
          (or legacy_padding=True) or via extract_legacy_checkpoint_state_and_wrench(). Formats wrench as
          4 normal forces padded with 2 zeros [fn_0, fn_1, fn_2, fn_3, 0, 0] strictly for backward
          compatibility with frozen Phase 3.4/3.5 B1-B4 checkpoints and test harnesses.
    """
    if task == "peg_in_hole":
        s_vec = np.concatenate([
            obs["pos"], obs["vel"],
            obs["rot"], obs["wrench"]
        ]).astype(np.float32)
        wrench = obs["wrench"].astype(np.float32)
    elif task in ("compliant_prelift", "compliant_lift", "multifinger_lift"):
        slip_or_vel = (
            obs["slip_ratio"]
            if "slip_ratio" in obs
            else np.abs(np.asarray(obs["delta_dot_t"], dtype=np.float32))
        )
        s_vec = np.concatenate([
            obs["finger_pos"].flatten(),
            obs["finger_fn"],
            slip_or_vel,
            obs["obj_pos"]
        ]).astype(np.float32)

        is_legacy = bool(legacy_compatibility_mode or legacy_padding)
        if is_legacy:
            wrench = np.pad(obs["finger_fn"][:4], (0, 2)).astype(np.float32)
        else:
            if "finger_ft" not in obs or obs["finger_ft"] is None:
                raise ValueError(
                    f"Task 2 modern physical force contract requires 'finger_ft' tangential force observations for task '{task}'. "
                    f"Missing 'finger_ft' channel in observation dictionary. To evaluate legacy checkpoints requiring padded "
                    f"representation, explicitly call extract_legacy_checkpoint_state_and_wrench() or pass legacy_compatibility_mode=True."
                )
            wrench = compute_prelift_resultant_wrench(
                obs["finger_pos"],
                obs["obj_pos"],
                obs["finger_fn"],
                obs["finger_ft"],
            )
    else:
        raise ValueError(
            f"Unknown task identifier: '{task}'. Expected 'peg_in_hole', 'compliant_prelift', "
            f"'compliant_lift', or 'multifinger_lift'."
        )
    return s_vec, wrench


def extract_legacy_checkpoint_state_and_wrench(
    obs: Dict[str, Any],
    task: str = "multifinger_lift",
) -> Tuple[np.ndarray, np.ndarray]:
    """Explicit legacy adapter strictly for evaluating frozen Phase 3.4/3.5 B1-B4 checkpoints.

    Formats Task 2 contact wrench as [fn_0, fn_1, fn_2, fn_3, 0.0, 0.0].
    DO NOT use in the modern teaching, distillation, or validation pipeline.
    """
    return extract_env_state_and_wrench(obs, task=task, legacy_compatibility_mode=True)


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
        env_dt = get_env_dt(clone_env, task)
        seq_len = len(selected_action_sequence)

        realized_states = []
        realized_wrenches = []
        realized_modes = []
        realized_rewards = []
        safety_violation = False

        prev_obs = clone_env._get_obs()
        for t in range(seq_len):
            action = selected_action_sequence[t]
            obs, r, done, info = step_env_compatible(
                clone_env, action, task=task, reward_fn=self.reward_fn, require_reward=True
            )

            s_vec, wrench = extract_env_state_and_wrench(obs, task)
            mode = classify_contact_mode(obs, prev_state=prev_obs, dt=env_dt, task=task)
            prev_obs = obs

            realized_states.append(s_vec)
            realized_wrenches.append(wrench)
            realized_modes.append(int(mode))
            realized_rewards.append(float(r))

            if getattr(clone_env, "safety_violated", False) or getattr(clone_env, "crush_violated", False):
                safety_violation = True
            if done:
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
        env_dt = get_env_dt(clone_env, task)
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
            obs, r, done, info = step_env_compatible(
                clone_env, action, task=task, reward_fn=self.reward_fn, require_reward=True
            )

            curr_s_vec, wrench = extract_env_state_and_wrench(obs, task)
            mode = classify_contact_mode(obs, prev_state=prev_obs, dt=env_dt, task=task)
            prev_obs = obs

            realized_states.append(curr_s_vec)
            realized_wrenches.append(wrench)
            realized_modes.append(int(mode))
            realized_rewards.append(float(r))

            if getattr(clone_env, "safety_violated", False) or getattr(clone_env, "crush_violated", False):
                safety_violation = True
            if done:
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
