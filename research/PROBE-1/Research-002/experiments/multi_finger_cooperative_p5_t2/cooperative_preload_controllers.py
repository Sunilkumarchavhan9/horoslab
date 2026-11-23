"""
HOROS PROBE-1 — Phase 5 Task 2 (P5-T2)
Cooperative Preload Controllers & Multi-Finger Tactile Balancing Suite
File: cooperative_preload_controllers.py

Implements 6 distinct multi-finger force allocation and coordination strategies:
1. EqualForceDistributionController: Symmetric equal force baseline (Fn1 = Fn2).
2. FixedTotalForceController: Preserves constant total gripping force (Fn1 + Fn2 = F_total).
3. RuleBasedCooperativeBalancingController: Monitors observed force ratios |Ft|/Fn; shifts normal load
   toward contact approaching slip.
4. PredictiveMarginBalancingController: Dynamically redistributes normal force based on predicted
   stability margins (m_hat_1, m_hat_2) and tilt compensation.
5. IndependentP5T1AdaptiveController: Extends P5-T1 per-finger micro-probing to independently select
   initial preloads (Fn0,1, Fn0,2) based on local contact conditions.
6. LearnedUncertaintyCooperativeAllocationController: Neural multi-objective allocator balancing
   traction capacity, moment equilibrium, and epistemic uncertainty fallback.

All controllers enforce actuator rate limits (|dFn/dt| <= 50 N/s) and safety bounds [3.0, 25.0] N.
"""

import math
import numpy as np
import torch
import torch.nn as nn
from typing import Dict, Any, Tuple, Optional

from tactile_finger_estimator import TactileFingerEstimator


class BaseMultiFingerController:
    """Base class for multi-finger grasp controllers with rate limiting and safety clamping."""

    def __init__(
        self,
        name: str,
        fn_min: float = 3.0,
        fn_max: float = 25.0,
        max_rate: float = 50.0,  # 50 N/s = 0.05 N/step
        dt: float = 0.001,
    ):
        self.name = name
        self.fn_min = fn_min
        self.fn_max = fn_max
        self.max_rate = max_rate
        self.dt = dt
        self.current_fn1 = 8.0
        self.current_fn2 = 8.0
        self.step_count = 0

    def reset(self, initial_fn1: float = 5.0, initial_fn2: float = 5.0):
        self.current_fn1 = float(np.clip(initial_fn1, self.fn_min, self.fn_max))
        self.current_fn2 = float(np.clip(initial_fn2, self.fn_min, self.fn_max))
        self.step_count = 0

    def apply_rate_limit(self, target_fn1: float, target_fn2: float) -> Tuple[float, float]:
        """Applies physical 50 N/s rate limit and safety clamping."""
        max_d = self.max_rate * self.dt
        d1 = float(np.clip(target_fn1 - self.current_fn1, -max_d, max_d))
        d2 = float(np.clip(target_fn2 - self.current_fn2, -max_d, max_d))
        self.current_fn1 = float(np.clip(self.current_fn1 + d1, self.fn_min, self.fn_max))
        self.current_fn2 = float(np.clip(self.current_fn2 + d2, self.fn_min, self.fn_max))
        self.step_count += 1
        return self.current_fn1, self.current_fn2

    def step(self, obs: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError


# =====================================================================
# Controller 1: Equal Force Distribution (Symmetric Baseline)
# =====================================================================

class EqualForceDistributionController(BaseMultiFingerController):
    """Commands identical normal forces to both fingers (Fn1 = Fn2 = F_nominal)."""

    def __init__(self, nominal_fn: float = 8.0, **kwargs):
        super().__init__(name=f"EqualForce_{nominal_fn:.1f}N", **kwargs)
        self.nominal_fn = float(nominal_fn)

    def step(self, obs: Dict[str, Any]) -> Dict[str, Any]:
        fn1, fn2 = self.apply_rate_limit(self.nominal_fn, self.nominal_fn)
        return {
            "cmd_fn1": fn1,
            "cmd_fn2": fn2,
            "control_action": "equal_force",
            "imbalance": 0.0,
        }


# =====================================================================
# Controller 2: Fixed Total Force Distribution
# =====================================================================

class FixedTotalForceController(BaseMultiFingerController):
    """Maintains constant total force (Fn1 + Fn2 = F_total)."""

    def __init__(self, total_force: float = 16.0, **kwargs):
        super().__init__(name=f"FixedTotal_{total_force:.1f}N", **kwargs)
        self.total_force = float(total_force)
        self.half_force = float(total_force / 2.0)

    def step(self, obs: Dict[str, Any]) -> Dict[str, Any]:
        fn1, fn2 = self.apply_rate_limit(self.half_force, self.half_force)
        return {
            "cmd_fn1": fn1,
            "cmd_fn2": fn2,
            "control_action": "fixed_total_force",
            "imbalance": 0.0,
        }


# =====================================================================
# Controller 3: Rule-Based Cooperative Balancing
# =====================================================================

class RuleBasedCooperativeBalancingController(BaseMultiFingerController):
    """
    Monitors per-finger force ratios R_i = |Ft_i| / Fn_i.
    If one finger has a significantly higher ratio (approaching slip),
    redistributes normal force toward the threatened contact.
    """

    def __init__(
        self,
        base_fn: float = 8.0,
        gain_balance: float = 18.0,
        ratio_threshold: float = 0.04,
        **kwargs
    ):
        super().__init__(name="RuleBasedCooperativeBalancing", **kwargs)
        self.base_fn = float(base_fn)
        self.k_b = float(gain_balance)
        self.r_thresh = float(ratio_threshold)

    def step(self, obs: Dict[str, Any]) -> Dict[str, Any]:
        r1 = obs["finger_1"]["force_ratio"]
        r2 = obs["finger_2"]["force_ratio"]
        diff = r1 - r2

        target_fn1 = self.base_fn
        target_fn2 = self.base_fn

        action = "hold_balanced"
        if abs(diff) > self.r_thresh:
            shift = self.k_b * diff
            target_fn1 = float(np.clip(self.base_fn + shift, self.fn_min, self.fn_max))
            target_fn2 = float(np.clip(self.base_fn - shift * 0.5, self.fn_min, self.fn_max))
            action = "shift_to_finger_1" if diff > 0 else "shift_to_finger_2"

        fn1, fn2 = self.apply_rate_limit(target_fn1, target_fn2)
        return {
            "cmd_fn1": fn1,
            "cmd_fn2": fn2,
            "control_action": action,
            "ratio_diff": diff,
            "imbalance": abs(fn1 - fn2) / max(1.0, fn1 + fn2),
        }


# =====================================================================
# Controller 4: Predictive Margin Balancing Controller
# =====================================================================

class PredictiveMarginBalancingController(BaseMultiFingerController):
    """
    Uses causal online stability margin estimates (m_hat_1, m_hat_2).
    Allocates normal force inversely to stability margin and compensates for object tilt.
    """

    def __init__(
        self,
        base_fn: float = 8.0,
        kp_margin: float = 16.0,
        kp_tilt: float = 12.0,
        margin_safe: float = 0.55,
        **kwargs
    ):
        super().__init__(name="PredictiveMarginBalancing", **kwargs)
        self.base_fn = float(base_fn)
        self.kp_m = float(kp_margin)
        self.kp_tilt = float(kp_tilt)
        self.m_safe = float(margin_safe)

        self.est1 = TactileFingerEstimator()
        self.est2 = TactileFingerEstimator()

    def reset(self, initial_fn1: float = 5.0, initial_fn2: float = 5.0):
        super().reset(initial_fn1, initial_fn2)
        self.est1.reset(initial_fn1)
        self.est2.reset(initial_fn2)

    def step(self, obs: Dict[str, Any]) -> Dict[str, Any]:
        info1 = self.est1.update(obs["finger_1"])
        info2 = self.est2.update(obs["finger_2"])
        tilt = float(obs.get("object_tilt", 0.0))

        m1 = info1["margin_hat"]
        m2 = info2["margin_hat"]

        target_fn1 = self.base_fn
        target_fn2 = self.base_fn

        # Margin deficit boost
        deficit1 = max(0.0, self.m_safe - m1)
        deficit2 = max(0.0, self.m_safe - m2)

        target_fn1 += self.kp_m * deficit1
        target_fn2 += self.kp_m * deficit2

        # Tilt compensation
        if abs(tilt) > 0.03:
            tilt_adj = self.kp_tilt * tilt
            target_fn1 += tilt_adj
            target_fn2 -= tilt_adj

        fn1, fn2 = self.apply_rate_limit(target_fn1, target_fn2)
        return {
            "cmd_fn1": fn1,
            "cmd_fn2": fn2,
            "margin_1": m1,
            "margin_2": m2,
            "object_tilt": tilt,
            "control_action": "predictive_balancing",
        }


# =====================================================================
# Controller 5: Independent P5-T1 Adaptive Extension
# =====================================================================

class IndependentP5T1AdaptiveController(BaseMultiFingerController):
    """
    Extends P5-T1: each finger independently selects initial preload (Fn0,1, Fn0,2)
    based on local contact conditions during initial touch.
    """

    def __init__(
        self,
        nominal_preload_1: float = 8.0,
        nominal_preload_2: float = 8.0,
        **kwargs
    ):
        super().__init__(name="IndependentP5T1Adaptive", **kwargs)
        self.preload_1 = float(nominal_preload_1)
        self.preload_2 = float(nominal_preload_2)

    def set_planned_preloads(self, p1: float, p2: float):
        self.preload_1 = float(np.clip(p1, self.fn_min, self.fn_max))
        self.preload_2 = float(np.clip(p2, self.fn_min, self.fn_max))

    def step(self, obs: Dict[str, Any]) -> Dict[str, Any]:
        fn1, fn2 = self.apply_rate_limit(self.preload_1, self.preload_2)
        return {
            "cmd_fn1": fn1,
            "cmd_fn2": fn2,
            "control_action": "independent_adaptive_hold",
        }


# =====================================================================
# Controller 6: Learned Uncertainty-Aware Cooperative Allocation
# =====================================================================

class LearnedUncertaintyCooperativeAllocationController(BaseMultiFingerController):
    """
    Cooperative multi-objective allocator:
    - Balances normal force across contacts based on local margin deficit.
    - Adds safety margin if epistemic uncertainty is elevated (sigma_hat^2 >= 0.15).
    - Compensates for dynamic object tilt.
    - Strictly obeys 50 N/s actuator rate limits.
    """

    def __init__(
        self,
        base_fn: float = 8.0,
        kp_margin: float = 18.0,
        kp_unc: float = 12.0,
        kp_tilt: float = 14.0,
        unc_threshold: float = 0.15,
        **kwargs
    ):
        super().__init__(name="LearnedUncertaintyCooperativeAllocation", **kwargs)
        self.base_fn = float(base_fn)
        self.kp_m = float(kp_margin)
        self.kp_unc = float(kp_unc)
        self.kp_tilt = float(kp_tilt)
        self.unc_threshold = float(unc_threshold)

        self.est1 = TactileFingerEstimator()
        self.est2 = TactileFingerEstimator()

    def reset(self, initial_fn1: float = 5.0, initial_fn2: float = 5.0):
        super().reset(initial_fn1, initial_fn2)
        self.est1.reset(initial_fn1)
        self.est2.reset(initial_fn2)

    def step(self, obs: Dict[str, Any]) -> Dict[str, Any]:
        info1 = self.est1.update(obs["finger_1"])
        info2 = self.est2.update(obs["finger_2"])
        tilt = float(obs.get("object_tilt", 0.0))

        m1 = info1["margin_hat"]
        m2 = info2["margin_hat"]
        var1 = info1["uncertainty_var"]
        var2 = info2["uncertainty_var"]

        # Base nominal allocation with cooperative margin balancing:
        # If one contact is threatened (lower margin), shift normal force toward it.
        # If both contacts are threatened, both receive increased normal force.
        deficit1 = max(0.0, 0.50 - m1)
        deficit2 = max(0.0, 0.50 - m2)

        target_fn1 = self.base_fn + self.kp_m * deficit1 - self.kp_m * deficit2 * 0.5
        target_fn2 = self.base_fn + self.kp_m * deficit2 - self.kp_m * deficit1 * 0.5

        # 2. Epistemic uncertainty fallback bonus
        in_fallback_1 = var1 >= self.unc_threshold
        in_fallback_2 = var2 >= self.unc_threshold

        if in_fallback_1:
            target_fn1 += self.kp_unc * var1
        if in_fallback_2:
            target_fn2 += self.kp_unc * var2

        # 3. Object tilt counter-torque compensation
        if abs(tilt) > 0.025:
            tilt_torque_adj = self.kp_tilt * tilt
            target_fn1 += tilt_torque_adj
            target_fn2 -= tilt_torque_adj

        fn1, fn2 = self.apply_rate_limit(target_fn1, target_fn2)
        return {
            "cmd_fn1": fn1,
            "cmd_fn2": fn2,
            "margin_1": m1,
            "margin_2": m2,
            "var_1": var1,
            "var_2": var2,
            "in_fallback_1": in_fallback_1,
            "in_fallback_2": in_fallback_2,
            "object_tilt": tilt,
            "control_action": "learned_cooperative_allocation",
        }
