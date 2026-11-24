"""
HOROS PROBE-1 — Phase 5 Task 3 (P5-T3)
N-Contact Generalization & Cooperative Physical Intelligence
File: cooperative_n_contact_controller.py

Implements the proposed Learned Uncertainty-Aware N-Contact Allocation Controller:
- Generalized for arbitrary N-contact topologies (N = 3, 4, 5+).
- Causal online tactile margin estimation.
- Differential margin rebalancing across active contacts.
- Epistemic uncertainty fallback bonus.
- Dynamic contact loss detection and immediate load redistribution.
- Object-level wrench and tilt counter-moment compensation.
- Supports Protocol A (unconstrained total budget) and Protocol B (equal total force budget).
- Strictly obeys 50 N/s actuator rate limits and [3.0, 25.0] N safety bounds.
"""

import math
import numpy as np
from typing import Dict, Any, List, Optional, Tuple

from n_contact_tactile_estimator import NContactTactileEstimator
from contact_loss_recovery import ContactLossRecoveryManager
from controller_baselines import BaseNContactController


class LearnedUncertaintyAwareNContactController(BaseNContactController):
    """
    Generalized Cooperative N-Contact Allocator:
    - Analyzes per-contact stability margins m_hat_i and uncertainties sigma_hat_i^2.
    - Dynamically redistributes normal forces to threatened contacts.
    - Instantly adapts to contact loss by reallocating lost forces to surviving contacts.
    - Actively compensates for object tilt and external disturbance wrenches.
    """

    def __init__(
        self,
        num_contacts: int,
        base_fn: float = 8.0,
        kp_margin: float = 18.0,
        kp_unc: float = 12.0,
        kp_tilt: float = 14.0,
        margin_safe: float = 0.50,
        unc_threshold: float = 0.15,
        total_force_budget: Optional[float] = None,  # If set, enforces Protocol B budget
        **kwargs
    ):
        super().__init__(name="LearnedUncertaintyAwareNContact", num_contacts=num_contacts, **kwargs)
        self.base_fn = float(base_fn)
        self.kp_m = float(kp_margin)
        self.kp_u = float(kp_unc)
        self.kp_tilt = float(kp_tilt)
        self.m_safe = float(margin_safe)
        self.unc_threshold = float(unc_threshold)
        self.total_budget = total_force_budget  # None for Protocol A, float for Protocol B

        self.estimators = [NContactTactileEstimator(contact_id=i) for i in range(num_contacts)]
        self.recovery_mgr = ContactLossRecoveryManager(
            num_contacts=num_contacts,
            base_fn=base_fn,
            fn_min=self.fn_min,
            fn_max=self.fn_max,
        )

    def reset(self, initial_preloads: Optional[List[float]] = None):
        super().reset(initial_preloads)
        init_p = initial_preloads or [8.0] * self.num_contacts
        for i, est in enumerate(self.estimators):
            est.reset(init_p[i])
        self.recovery_mgr.reset()

    def step(self, obs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Advances the cooperative N-contact controller by 1 millisecond.
        Causal inputs: noisy contact telemetry and noisy object tilt.
        """
        contacts_obs = obs["contacts"]
        tilt = float(obs.get("object_tilt", 0.0))

        # 1. Update contact loss and recovery manager
        loss_info = self.recovery_mgr.update(contacts_obs)
        active_indices = loss_info["active_indices"]
        n_active = len(active_indices)
        active_mask = [i in active_indices for i in range(self.num_contacts)]

        if n_active == 0:
            # Emergency hold
            return {
                "cmd_fn": [0.0] * self.num_contacts,
                "control_action": "all_contacts_lost",
                "active_contacts": 0,
            }

        # 2. Update causal tactile estimators
        margins = []
        unc_vars = []
        slip_probs = []

        for i, est in enumerate(self.estimators):
            if active_mask[i]:
                info = est.update(contacts_obs[i])
                margins.append(info["margin_hat"])
                unc_vars.append(info["uncertainty_var"])
                slip_probs.append(info["slip_prob"])
            else:
                margins.append(0.0)
                unc_vars.append(0.50)
                slip_probs.append(1.0)

        # 3. Base nominal allocation across active contacts
        # If in loss mode, redistribute lost contacts' base force to remaining contacts
        lost_count = self.num_contacts - n_active
        effective_base_fn = self.base_fn + (lost_count * self.base_fn / float(n_active))
        target_fn = [effective_base_fn if active_mask[i] else 0.0 for i in range(self.num_contacts)]

        # 4. Cooperative Margin Balancing
        # Compute minimum and mean deficit among active contacts
        deficits = [max(0.0, self.m_safe - margins[i]) for i in active_indices]
        min_deficit = min(deficits) if deficits else 0.0
        mean_deficit = float(np.mean(deficits)) if deficits else 0.0

        for i in active_indices:
            m_i = margins[i]
            deficit_i = max(0.0, self.m_safe - m_i)

            # Internal grasp squeeze reinforcement: increases uniform radial squeeze in null space of G
            target_fn[i] += self.kp_m * min_deficit * 0.70
            # Differential allocation: threatened contact gets priority
            target_fn[i] += self.kp_m * (deficit_i - mean_deficit) * 0.30

            # 5. Epistemic Uncertainty Fallback Bonus
            if unc_vars[i] >= self.unc_threshold:
                target_fn[i] += self.kp_u * unc_vars[i]

            # 6. Object Tilt Counter-Torque Compensation
            phi_i = 2.0 * math.pi * float(i) / float(self.num_contacts)
            tilt_torque_adj = self.kp_tilt * tilt * math.sin(phi_i)
            target_fn[i] += tilt_torque_adj

        # 7. Protocol B Force Budget Enforcement (if total_budget is specified)
        if self.total_budget is not None and n_active > 0:
            current_sum = sum(target_fn[i] for i in active_indices)
            if current_sum > self.total_budget:
                scale = float(self.total_budget / max(1.0, current_sum))
                for i in active_indices:
                    target_fn[i] = float(np.clip(target_fn[i] * scale, self.fn_min, self.fn_max))

        # 8. Apply physical rate limit (|dFn/dt| <= 50 N/s) and safety bounds [3.0, 25.0] N
        cmds = self.apply_rate_limit(target_fn, active_mask=active_mask)

        return {
            "cmd_fn": cmds,
            "margins": margins,
            "uncertainty_vars": unc_vars,
            "slip_probs": slip_probs,
            "active_indices": active_indices,
            "lost_indices": loss_info["lost_indices"],
            "control_action": "learned_cooperative_allocation",
        }
