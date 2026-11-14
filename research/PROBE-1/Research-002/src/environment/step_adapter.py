"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Environment Step & Reward Compatibility Adapter

Provides unified handling across both supported environment signatures without
altering CompliantPreLiftContactEnv's 2-tuple control signature or leaking mu_true:
- Legacy 4-tuple API: (obs, reward, done, info) — PegInHoleEnv, MultifingerLiftEnv
- Production Task 2 2-tuple API: (obs, done) — CompliantPreLiftContactEnv

When require_reward=True on a 2-tuple environment, computes physically grounded
Task 2 evaluation rewards (or evaluates caller reward_fn) rather than fabricating 0.0.
When require_reward=False on a 2-tuple environment, returns reward=None without
inventing synthetic scalar rewards.
"""

from __future__ import annotations
from typing import Any, Callable, Dict, Optional, Tuple
import numpy as np


COMPLIANT_TASK_ALIASES = ("compliant_prelift", "compliant_lift", "multifinger_lift")


def is_compliant_prelift_task(task: Optional[str]) -> bool:
    """Returns True when task targets production CompliantPreLiftContactEnv."""
    return task in COMPLIANT_TASK_ALIASES


def get_env_dt(env: Any, task: Optional[str] = None) -> float:
    """Resolves the physical simulation timestep dt (0.01 s CompliantPreLift, 0.02 s PegInHole)."""
    env_dt = getattr(env, "dt", None)
    if env_dt is not None:
        return float(env_dt)
    if is_compliant_prelift_task(task):
        return 0.01
    return 0.02


def compute_task2_eval_reward(
    obs: Dict[str, Any],
    action: Optional[np.ndarray] = None,
    env: Any = None,
    reward_fn: Optional[Callable[[np.ndarray, np.ndarray], float]] = None,
) -> float:
    """
    Computes physically grounded Task 2 evaluation reward from public observation channels
    (never leaking hidden mu_true and never fabricating 0.0).
    """
    from src.selection_aware.counterfactual_rollout import extract_env_state_and_wrench
    s_vec, _ = extract_env_state_and_wrench(obs, task="compliant_prelift")
    if reward_fn is not None:
        act_arr = np.zeros(5, dtype=np.float32) if action is None else np.asarray(action, dtype=np.float32)
        return float(reward_fn(s_vec, act_arr))

    obj_z = float(s_vec[22])
    slip_mag = float(np.linalg.norm(s_vec[16:20]))
    force_err = abs(float(np.sum(s_vec[12:16])) - 16.0)
    fn_max = float(np.max(s_vec[12:16]))

    dropped = bool(getattr(env, "dropped", getattr(env, "object_dropped", False))) if env is not None else False
    lifted = bool(getattr(env, "lifted", getattr(env, "object_lifted", False))) if env is not None else (obj_z >= 5.0)
    crush = bool(getattr(env, "crush_violated", fn_max > 25.0)) if env is not None else (fn_max > 25.0)

    term_bonus = 150.0 if (lifted and obj_z >= 20.0) else 0.0
    term_penalty = (100.0 if dropped else 0.0) + (100.0 if crush else 0.0)
    return float(15.0 * obj_z - 5.0 * slip_mag - 0.1 * force_err + term_bonus - term_penalty)


def step_env_compatible(
    env: Any,
    action: np.ndarray,
    task: Optional[str] = None,
    reward_fn: Optional[Callable[[np.ndarray, np.ndarray], float]] = None,
    require_reward: bool = True,
) -> Tuple[Dict[str, Any], Optional[float], bool, Dict[str, Any]]:
    """
    Steps an environment supporting both (obs, reward, done, info) and (obs, done) signatures.
    """
    step_out = env.step(action)
    if not isinstance(step_out, tuple):
        raise ValueError(f"Expected tuple from env.step(), got {type(step_out).__name__}.")

    if len(step_out) == 4:
        obs, reward, done, info = step_out
        info_dict = dict(info) if isinstance(info, dict) else {"raw_info": info}
        info_dict.setdefault("step_api", "four_tuple")
        return obs, float(reward), bool(done), info_dict

    if len(step_out) == 2:
        obs, done = step_out
        info_dict: Dict[str, Any] = {
            "step_api": "two_tuple",
            "step": int(getattr(env, "step_count", 0)),
            "sim_time_s": float(getattr(env, "sim_time_s", 0.0)),
            "dt": get_env_dt(env, task),
            "lifted": bool(getattr(env, "lifted", False)),
            "dropped": bool(getattr(env, "dropped", False)),
            "obj_z_mm": float(obs["obj_pos"][2]) if "obj_pos" in obs else 0.0,
            "total_fn_n": float(np.sum(obs["finger_fn"])) if "finger_fn" in obs else 0.0,
        }
        reward: Optional[float]
        if require_reward:
            reward = compute_task2_eval_reward(obs, action=action, env=env, reward_fn=reward_fn)
        else:
            reward = None
        return obs, reward, bool(done), info_dict

    raise ValueError(
        f"Unsupported env.step() return tuple length {len(step_out)}; expected 2 or 4 elements."
    )
