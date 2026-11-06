"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.4 — Active Contact-Mode Mining: Contact Boundary Sampler

Generates targeted physical exploration rollouts in the training simulator:
1. Friction Cone Boundary Sweep (Task 2): Modulates normal force and shear velocity across ||Ft|| = mu * Fn.
2. Wedging Envelope Oscillations (Task 1): Explores tilt angles theta around theta_crit = atan(2*delta / L).
3. Coordinated Manipulation Policy (Task 2): Multi-phase squeeze -> preload -> lift -> slip recovery.
4. Compliant Downward Insertion Policy (Task 1): Deep insertion exploration with chamfer dithering.
"""

from __future__ import annotations
import math
import copy
from typing import Dict, Any, List, Optional, Tuple
import numpy as np

from src.contact_modes.contact_mode_definitions import classify_contact_mode
from src.selection_aware.counterfactual_rollout import extract_env_state_and_wrench
from src.environment.peg_in_hole_env import PegInHoleEnv
from src.environment.multifinger_lift_env import MultifingerLiftEnv


class ContactBoundarySampler:
    """
    Targeted physical trajectory generator focusing on friction cone and wedging boundaries.
    """

    def __init__(
        self,
        task: str = "peg_in_hole",
        seed: int = 2000,
        mu: float = 0.50,
        clearance: float = 0.50,
        peg_length: float = 80.0,
    ):
        self.task = task
        self.seed = seed
        self.rng = np.random.RandomState(seed)
        self.mu = mu
        self.clearance = clearance
        self.peg_length = peg_length
        self.theta_crit = math.degrees(math.atan2(2.0 * clearance, peg_length))

    def sample_task1_boundary_trajectory(
        self,
        env: PegInHoleEnv,
        horizon: int = 25,
        exploration_mode: str = "boundary"
    ) -> Dict[str, Any]:
        """
        Samples an informative Peg-in-Hole trajectory.
        Modes:
            - 'boundary': Perturbs orientation around critical wedging angle and lateral chamfer boundaries.
            - 'insertion': Purposeful compliant insertion aimed at discovering seating without jamming.
            - 'random': Uncorrelated uniform random actions.
        """
        obs = env.reset()
        prev_obs = obs

        realized_states = []
        realized_wrenches = []
        realized_modes = []
        realized_rewards = []
        actions = []

        for t in range(horizon):
            s_vec, wrench = extract_env_state_and_wrench(obs, "peg_in_hole")
            peg_pos = env.peg_pos
            peg_rot = env.peg_rot

            if exploration_mode == "random":
                act = self.rng.uniform([-5.0, -5.0, -5.0, -2.0, -2.0, -2.0],
                                       [5.0, 5.0, 5.0, 2.0, 2.0, 2.0])
            elif exploration_mode == "boundary":
                # Boundary mode: feed downward while dithering near critical wedging angle
                dz = -self.rng.uniform(2.0, 5.0)
                # Dither lateral offsets near chamfer radius
                dx = -peg_pos[0] * 0.3 + self.rng.normal(0, 0.4)
                dy = -peg_pos[1] * 0.3 + self.rng.normal(0, 0.4)
                # Dither tilt near theta_crit
                droll = (self.theta_crit - abs(peg_rot[0])) * self.rng.uniform(0.5, 1.2) * np.sign(self.rng.randn())
                dpitch = (self.theta_crit - abs(peg_rot[1])) * self.rng.uniform(0.5, 1.2) * np.sign(self.rng.randn())
                act = np.array([dx, dy, dz, droll, dpitch, 0.0])
            else:  # 'insertion'
                # Compliant insertion mode: active centering + steady downward descent
                dx = -peg_pos[0] * 0.6
                dy = -peg_pos[1] * 0.6
                dz = -self.rng.uniform(3.5, 5.0)
                droll = -peg_rot[0] * 0.5
                dpitch = -peg_rot[1] * 0.5
                act = np.array([dx, dy, dz, droll, dpitch, 0.0])

            act = np.clip(act, [-5.0, -5.0, -5.0, -2.0, -2.0, -2.0], [5.0, 5.0, 5.0, 2.0, 2.0, 2.0])
            next_obs, r, done, info = env.step(act)
            mode = classify_contact_mode(next_obs, prev_state=prev_obs, task="peg_in_hole")

            actions.append(act)
            realized_states.append(s_vec)
            realized_wrenches.append(wrench)
            realized_modes.append(int(mode))
            realized_rewards.append(r)

            prev_obs = next_obs
            obs = next_obs
            if done:
                # Pad to horizon if terminated early
                while len(realized_states) < horizon:
                    realized_states.append(s_vec.copy())
                    realized_wrenches.append(wrench.copy())
                    realized_modes.append(int(mode))
                    realized_rewards.append(0.0)
                break

        return {
            "task": "peg_in_hole",
            "actions": np.array(actions, dtype=np.float32),
            "realized_states": np.array(realized_states, dtype=np.float32),
            "realized_wrenches": np.array(realized_wrenches, dtype=np.float32),
            "realized_modes": np.array(realized_modes, dtype=np.int64),
            "realized_rewards": np.array(realized_rewards, dtype=np.float32),
            "realized_return": float(np.sum(realized_rewards)),
            "success": bool(env.seated),
            "safety_violated": bool(env.safety_violated),
            "stall": bool(env.jammed),
            "final_progress": max(0.0, -float(env.peg_pos[2])),
        }

    def sample_task2_boundary_trajectory(
        self,
        env: MultifingerLiftEnv,
        horizon: int = 25,
        exploration_mode: str = "coordinated"
    ) -> Dict[str, Any]:
        """
        Samples an informative Multifingered Lift trajectory.
        Modes:
            - 'coordinated': Multi-phase squeeze -> preload -> lift -> slip recovery.
            - 'friction_boundary': Oscillates shear force across ||Ft|| = mu * Fn.
            - 'random': Uncorrelated uniform random actions in [-1, 1].
        """
        obs = env.reset()
        prev_obs = obs

        realized_states = []
        realized_wrenches = []
        realized_modes = []
        realized_rewards = []
        actions = []

        for t in range(horizon):
            s_vec, wrench = extract_env_state_and_wrench(obs, "multifinger_lift")
            fn_total = float(np.sum(env.finger_normal_force))

            if exploration_mode == "random":
                act = self.rng.uniform([-1.0, -1.0, -1.0, -1.0, -1.0],
                                       [1.0, 1.0, 1.0, 1.0, 1.0])
            elif exploration_mode == "friction_boundary":
                # Boundary mode: modulate lift velocity near critical threshold
                # Critical normal force for m=0.35kg, mu=0.5: Fn_crit = m*g / mu = 0.35*9.81 / 0.5 = 6.87 N
                if fn_total < 7.0:
                    # Inward squeeze to reach boundary
                    sq = self.rng.uniform(1.0, 1.8)
                    act = np.array([sq, sq, sq, sq, 0.0])
                else:
                    # Oscillate arm vertical velocity to probe slip onset
                    arm_dz = self.rng.uniform(-0.5, 2.5)
                    sq_dither = self.rng.normal(0, 0.2)
                    act = np.array([sq_dither]*4 + [arm_dz])
            else:  # 'coordinated'
                # Coordinated manipulation policy:
                # Phase 1 (Steps 0-2): Squeeze inward 1.5mm to establish contact
                if t <= 2:
                    act = np.array([1.5, 1.5, 1.5, 1.5, 0.0])
                # Phase 2 (Steps 3-4): Maintain normal force around 12-16N
                elif t <= 4:
                    adj = 0.2 if fn_total < 12.0 else -0.1
                    act = np.array([adj, adj, adj, adj, 0.2])
                # Phase 3 (Steps 5-20): Steady upward lift command
                else:
                    # Check if slip ratio is elevated; if so, trigger recovery squeeze
                    max_slip = float(np.max(env.finger_slip_ratio))
                    if max_slip > 0.85:
                        # Recovery squeeze
                        act = np.array([0.8, 0.8, 0.8, 0.8, 0.5])
                    else:
                        act = np.array([0.05, 0.05, 0.05, 0.05, 1.5])

            act = np.clip(act, [-2.0, -2.0, -2.0, -2.0, -2.0], [2.0, 2.0, 2.0, 2.0, 5.0])
            next_obs, r, done, info = env.step(act)
            mode = classify_contact_mode(next_obs, prev_state=prev_obs, task="multifinger_lift")

            actions.append(act)
            realized_states.append(s_vec)
            realized_wrenches.append(wrench)
            realized_modes.append(int(mode))
            realized_rewards.append(r)

            prev_obs = next_obs
            obs = next_obs
            if done:
                while len(realized_states) < horizon:
                    realized_states.append(s_vec.copy())
                    realized_wrenches.append(wrench.copy())
                    realized_modes.append(int(mode))
                    realized_rewards.append(0.0)
                break

        return {
            "task": "multifinger_lift",
            "actions": np.array(actions, dtype=np.float32),
            "realized_states": np.array(realized_states, dtype=np.float32),
            "realized_wrenches": np.array(realized_wrenches, dtype=np.float32),
            "realized_modes": np.array(realized_modes, dtype=np.int64),
            "realized_rewards": np.array(realized_rewards, dtype=np.float32),
            "realized_return": float(np.sum(realized_rewards)),
            "success": bool(env.object_lifted),
            "safety_violated": bool(env.crush_violated),
            "stall": bool(env.object_dropped),
            "final_progress": max(0.0, float(env.obj_pos[2])),
        }

    def generate_candidate_batch(
        self,
        strategy: str,
        num_candidates: int = 150,
        start_seed: int = 2000,
        horizon: int = 25
    ) -> List[Dict[str, Any]]:
        """
        Generates a batch of candidate trajectories under a given data-collection strategy:
        - 'D1_random': pure random exploration
        - 'D2_boundary': physical boundary perturbations
        - 'D3_uncertainty': mixed exploration for epistemic active learning
        - 'D4_acmm': full physical + coordinated active mining
        """
        candidates = []
        for i in range(num_candidates):
            ep_seed = start_seed + i
            if self.task == "peg_in_hole":
                env = PegInHoleEnv(seed=ep_seed)
                if strategy == "D1_random":
                    traj = self.sample_task1_boundary_trajectory(env, horizon=horizon, exploration_mode="random")
                elif strategy == "D2_boundary":
                    traj = self.sample_task1_boundary_trajectory(env, horizon=horizon, exploration_mode="boundary")
                elif strategy == "D3_uncertainty":
                    mode = "boundary" if (i % 2 == 0) else "random"
                    traj = self.sample_task1_boundary_trajectory(env, horizon=horizon, exploration_mode=mode)
                else:  # D4_acmm
                    mode = "insertion" if (i % 3 == 0) else "boundary"
                    traj = self.sample_task1_boundary_trajectory(env, horizon=horizon, exploration_mode=mode)
            else:
                env = MultifingerLiftEnv(seed=ep_seed)
                if strategy == "D1_random":
                    traj = self.sample_task2_boundary_trajectory(env, horizon=horizon, exploration_mode="random")
                elif strategy == "D2_boundary":
                    traj = self.sample_task2_boundary_trajectory(env, horizon=horizon, exploration_mode="friction_boundary")
                elif strategy == "D3_uncertainty":
                    mode = "friction_boundary" if (i % 2 == 0) else "random"
                    traj = self.sample_task2_boundary_trajectory(env, horizon=horizon, exploration_mode=mode)
                else:  # D4_acmm
                    mode = "coordinated" if (i % 3 == 0) else "friction_boundary"
                    traj = self.sample_task2_boundary_trajectory(env, horizon=horizon, exploration_mode=mode)

            traj["episode_id"] = f"{self.task}_{strategy}_{ep_seed}"
            traj["seed"] = ep_seed
            candidates.append(traj)

        return candidates
