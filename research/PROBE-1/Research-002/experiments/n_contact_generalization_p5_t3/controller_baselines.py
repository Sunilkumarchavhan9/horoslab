"""
HOROS PROBE-1 — Phase 5 Task 3 (P5-T3)
N-Contact Generalization & Cooperative Physical Intelligence
File: controller_baselines.py

Implements 6 multi-contact baseline controllers for arbitrary N contacts:
1. EqualForcePerContactController
2. FixedTotalForceController
3. RuleBasedCooperativeController
4. PredictiveMarginBalancingController
5. IndependentP5T1AdaptiveController
6. P5T2LearnedCooperativeExtension
"""

import math
import numpy as np
from typing import Dict, Any, List, Optional
from n_contact_tactile_estimator import NContactTactileEstimator


class BaseNContactController:
    """Base class for N-contact controllers with rate limiting and safety clamping."""

    def __init__(
        self,
        name: str,
        num_contacts: int,
        fn_min: float = 3.0,
        fn_max: float = 25.0,
        max_rate: float = 50.0,  # 50 N/s = 0.05 N/step
        dt: float = 0.001,
    ):
        self.name = name
        self.num_contacts = num_contacts
        self.fn_min = fn_min
        self.fn_max = fn_max
        self.max_rate = max_rate
        self.dt = dt
        self.current_fn = [8.0] * num_contacts
        self.step_count = 0

    def reset(self, initial_preloads: Optional[List[float]] = None):
        if initial_preloads is None:
            initial_preloads = [8.0] * self.num_contacts
        self.current_fn = [float(np.clip(p, self.fn_min, self.fn_max)) for p in initial_preloads]
        self.step_count = 0

    def apply_rate_limit(self, target_fn_list: List[float], active_mask: Optional[List[bool]] = None) -> List[float]:
        """Applies physical 50 N/s actuator rate limits and bounds."""
        max_d = self.max_rate * self.dt
        cmd_fn = []
        if active_mask is None:
            active_mask = [True] * self.num_contacts

        for i in range(self.num_contacts):
            if not active_mask[i]:
                self.current_fn[i] = 0.0
                cmd_fn.append(0.0)
                continue

            target = float(np.clip(target_fn_list[i], self.fn_min, self.fn_max))
            d = float(np.clip(target - self.current_fn[i], -max_d, max_d))
            self.current_fn[i] = float(np.clip(self.current_fn[i] + d, self.fn_min, self.fn_max))
            cmd_fn.append(self.current_fn[i])

        self.step_count += 1
        return cmd_fn

    def step(self, obs: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError


class EqualForcePerContactController(BaseNContactController):
    """Commands identical normal forces to all active contacts (Fn_i = F_nom)."""

    def __init__(self, num_contacts: int, nominal_fn: float = 8.0, **kwargs):
        super().__init__(name=f"EqualForce_{nominal_fn:.1f}N", num_contacts=num_contacts, **kwargs)
        self.nominal_fn = float(nominal_fn)

    def step(self, obs: Dict[str, Any]) -> Dict[str, Any]:
        targets = [self.nominal_fn] * self.num_contacts
        active_mask = [bool(c.get("is_active", True)) for c in obs["contacts"]]
        cmds = self.apply_rate_limit(targets, active_mask=active_mask)
        return {"cmd_fn": cmds, "control_action": "equal_force"}


class FixedTotalForceController(BaseNContactController):
    """Maintains constant total normal force (sum Fn_i = F_total), split equally across active contacts."""

    def __init__(self, num_contacts: int, total_force: Optional[float] = None, **kwargs):
        if total_force is None:
            total_force = float(num_contacts * 8.0)
        super().__init__(name=f"FixedTotal_{total_force:.1f}N", num_contacts=num_contacts, **kwargs)
        self.total_force = float(total_force)

    def step(self, obs: Dict[str, Any]) -> Dict[str, Any]:
        active_mask = [bool(c.get("is_active", True)) for c in obs["contacts"]]
        n_active = sum(1 for a in active_mask if a)
        share = float(self.total_force / max(1, n_active))
        targets = [share if active_mask[i] else 0.0 for i in range(self.num_contacts)]
        cmds = self.apply_rate_limit(targets, active_mask=active_mask)
        return {"cmd_fn": cmds, "control_action": "fixed_total_force"}


class RuleBasedCooperativeController(BaseNContactController):
    """
    Monitors per-contact force ratios R_i = |Ft_i| / Fn_i.
    Redistributes normal force toward contacts with above-average ratio.
    """

    def __init__(self, num_contacts: int, base_fn: float = 8.0, gain_balance: float = 16.0, **kwargs):
        super().__init__(name="RuleBasedCooperative", num_contacts=num_contacts, **kwargs)
        self.base_fn = float(base_fn)
        self.kb = float(gain_balance)

    def step(self, obs: Dict[str, Any]) -> Dict[str, Any]:
        active_mask = [bool(c.get("is_active", True)) for c in obs["contacts"]]
        ratios = []
        for i, c in enumerate(obs["contacts"]):
            if active_mask[i]:
                fn = max(0.5, float(c["force_n"]))
                ft = abs(float(c["force_t"]))
                ratios.append(ft / fn)
            else:
                ratios.append(0.0)

        active_ratios = [ratios[i] for i in range(self.num_contacts) if active_mask[i]]
        mean_r = float(np.mean(active_ratios)) if active_ratios else 0.0

        targets = []
        for i in range(self.num_contacts):
            if not active_mask[i]:
                targets.append(0.0)
            else:
                diff = ratios[i] - mean_r
                shift = self.kb * diff
                targets.append(self.base_fn + shift)

        cmds = self.apply_rate_limit(targets, active_mask=active_mask)
        return {"cmd_fn": cmds, "control_action": "rule_based_cooperative"}


class PredictiveMarginBalancingController(BaseNContactController):
    """
    Uses causal stability margin estimates m_hat_i.
    Allocates normal force inversely to stability margin and applies tilt counter-torque.
    """

    def __init__(
        self,
        num_contacts: int,
        base_fn: float = 8.0,
        kp_margin: float = 16.0,
        kp_tilt: float = 12.0,
        margin_safe: float = 0.50,
        **kwargs
    ):
        super().__init__(name="PredictiveMarginBalancing", num_contacts=num_contacts, **kwargs)
        self.base_fn = float(base_fn)
        self.kp_m = float(kp_margin)
        self.kp_tilt = float(kp_tilt)
        self.m_safe = float(margin_safe)
        self.estimators = [NContactTactileEstimator(contact_id=i) for i in range(num_contacts)]

    def reset(self, initial_preloads: Optional[List[float]] = None):
        super().reset(initial_preloads)
        init_p = initial_preloads or [8.0] * self.num_contacts
        for i, est in enumerate(self.estimators):
            est.reset(init_p[i])

    def step(self, obs: Dict[str, Any]) -> Dict[str, Any]:
        active_mask = [bool(c.get("is_active", True)) for c in obs["contacts"]]
        margins = []
        for i, est in enumerate(self.estimators):
            info = est.update(obs["contacts"][i])
            margins.append(info["margin_hat"])

        tilt = float(obs.get("object_tilt", 0.0))
        targets = []

        for i in range(self.num_contacts):
            if not active_mask[i]:
                targets.append(0.0)
                continue

            target = self.base_fn
            deficit = max(0.0, self.m_safe - margins[i])
            target += self.kp_m * deficit

            # Tilt counter-torque: contacts on lower side get boosted
            # Contact position relative to center: contact i angle
            phi_i = 2.0 * math.pi * float(i) / float(self.num_contacts)
            # Normal moment arm proxy: sin(phi_i)
            tilt_adj = self.kp_tilt * tilt * math.sin(phi_i)
            target += tilt_adj

            targets.append(target)

        cmds = self.apply_rate_limit(targets, active_mask=active_mask)
        return {"cmd_fn": cmds, "margins": margins, "control_action": "predictive_margin_balancing"}


class IndependentP5T1AdaptiveController(BaseNContactController):
    """
    Extends P5-T1 independent planning: each contact independently commands normal force
    based on local contact conditions without cross-contact coordination.
    """

    def __init__(self, num_contacts: int, nominal_preloads: Optional[List[float]] = None, **kwargs):
        super().__init__(name="IndependentP5T1Adaptive", num_contacts=num_contacts, **kwargs)
        if nominal_preloads is None:
            nominal_preloads = [8.0] * num_contacts
        self.planned_preloads = list(nominal_preloads)

    def set_planned_preloads(self, preloads: List[float]):
        self.planned_preloads = [float(np.clip(p, self.fn_min, self.fn_max)) for p in preloads]

    def step(self, obs: Dict[str, Any]) -> Dict[str, Any]:
        active_mask = [bool(c.get("is_active", True)) for c in obs["contacts"]]
        targets = [self.planned_preloads[i] if active_mask[i] else 0.0 for i in range(self.num_contacts)]
        cmds = self.apply_rate_limit(targets, active_mask=active_mask)
        return {"cmd_fn": cmds, "control_action": "independent_adaptive_hold"}


class P5T2LearnedCooperativeExtension(BaseNContactController):
    """
    Extends P5-T2 learned cooperative allocator to N contacts:
    - Differential margin rebalancing across contacts.
    - Epistemic uncertainty bonus.
    - Tilt counter-torque.
    """

    def __init__(
        self,
        num_contacts: int,
        base_fn: float = 8.0,
        kp_margin: float = 16.0,
        kp_unc: float = 12.0,
        kp_tilt: float = 14.0,
        unc_threshold: float = 0.15,
        **kwargs
    ):
        super().__init__(name="P5T2LearnedCooperativeExtension", num_contacts=num_contacts, **kwargs)
        self.base_fn = float(base_fn)
        self.kp_m = float(kp_margin)
        self.kp_unc = float(kp_unc)
        self.kp_tilt = float(kp_tilt)
        self.unc_threshold = float(unc_threshold)
        self.estimators = [NContactTactileEstimator(contact_id=i) for i in range(num_contacts)]

    def reset(self, initial_preloads: Optional[List[float]] = None):
        super().reset(initial_preloads)
        init_p = initial_preloads or [8.0] * self.num_contacts
        for i, est in enumerate(self.estimators):
            est.reset(init_p[i])

    def step(self, obs: Dict[str, Any]) -> Dict[str, Any]:
        active_mask = [bool(c.get("is_active", True)) for c in obs["contacts"]]
        margins = []
        unc_vars = []
        for i, est in enumerate(self.estimators):
            info = est.update(obs["contacts"][i])
            margins.append(info["margin_hat"])
            unc_vars.append(info["uncertainty_var"])

        tilt = float(obs.get("object_tilt", 0.0))
        active_indices = [i for i in range(self.num_contacts) if active_mask[i]]
        n_act = len(active_indices)

        targets = []
        for i in range(self.num_contacts):
            if not active_mask[i]:
                targets.append(0.0)
                continue

            target = self.base_fn
            # Deficit on contact i
            m_i = margins[i]
            deficit_i = max(0.0, 0.50 - m_i)

            # Average margin of other active contacts
            other_margins = [margins[j] for j in active_indices if j != i]
            mean_other_m = float(np.mean(other_margins)) if other_margins else 0.50
            diff_m = mean_other_m - m_i

            target += self.kp_m * diff_m * 0.5
            if deficit_i > 0:
                target += self.kp_m * deficit_i * 0.5

            # Uncertainty bonus
            if unc_vars[i] >= self.unc_threshold:
                target += self.kp_unc * unc_vars[i]

            # Tilt compensation
            phi_i = 2.0 * math.pi * float(i) / float(self.num_contacts)
            target += self.kp_tilt * tilt * math.sin(phi_i)

            targets.append(target)

        cmds = self.apply_rate_limit(targets, active_mask=active_mask)
        return {"cmd_fn": cmds, "control_action": "p5_t2_extension"}
