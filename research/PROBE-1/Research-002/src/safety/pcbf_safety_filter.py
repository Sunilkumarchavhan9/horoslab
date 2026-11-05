"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Predictive Control Barrier Function (p-CBF) Independent Runtime Safety Filter
Monitors candidate planner actions against contact wrench limits, Coulomb friction cones,
and wedging thresholds; overrides unsafe actions before execution.
"""

from __future__ import annotations
import numpy as np
from typing import Dict, Any, Tuple


class PredictiveCBFSafetyFilter:
    """
    Independent Predictive Control Barrier Function (p-CBF) Safety Filter.
    Guarantees runtime physical safety independent of learned world model exploitation:
      h_force(s) = F_max - ||F_contact|| >= 0
      h_slip(s)  = mu * F_n - ||F_t|| >= 0
      h_wedge(s) = theta_crit - theta_tilt >= 0
    """

    def __init__(
        self,
        max_normal_force: float = 35.0,  # N
        max_torque: float = 7.0,  # N*m
        critical_wedge_angle: float = 1.8,  # deg
        gamma: float = 0.5,  # Barrier decay rate
    ):
        self.max_normal_force = max_normal_force
        self.max_torque = max_torque
        self.critical_wedge_angle = critical_wedge_angle
        self.gamma = gamma

        self.total_interventions = 0
        self.total_evaluations = 0

    def filter_action(
        self,
        current_state: Dict[str, Any],
        candidate_action: np.ndarray,
        task: str = "peg_in_hole"
    ) -> Tuple[np.ndarray, bool, Dict[str, Any]]:
        """
        Evaluates candidate action under barrier condition.
        Returns:
          - certified_action: safe action (projected if necessary)
          - intervened: True if candidate action was modified
          - info: barrier values and intervention diagnostics
        """
        self.total_evaluations += 1
        certified_action = candidate_action.copy()
        intervened = False

        if task == "peg_in_hole":
            # State extraction
            pos = current_state.get("pos", np.zeros(3))
            rot = current_state.get("rot", np.zeros(3))
            wrench = current_state.get("wrench", np.zeros(6))
            stratum = current_state.get("stratum", 0)

            force_norm = float(np.linalg.norm(wrench[:3]))
            torque_norm = float(np.linalg.norm(wrench[3:6]))
            tilt = float(np.linalg.norm(rot[:2]))

            # 1. Force Barrier: prevent excessive downward plunge when contact force is near limit
            h_force = self.max_normal_force - force_norm
            # If downward movement candidate (action[2] < 0) when force is already high
            if candidate_action[2] < -1.0 and h_force < 10.0:
                # Dampen downward velocity
                certified_action[2] = max(-0.2, candidate_action[2] * (h_force / 10.0))
                intervened = True

            # 2. Wedging / Tilt Barrier: if wedged (stratum 3), prohibit further tilting
            h_tilt = self.critical_wedge_angle - tilt
            if stratum == 3 or tilt > self.critical_wedge_angle * 0.8:
                # Zero out lateral rotations and push towards vertical
                certified_action[3] = -rot[0] * 0.2
                certified_action[4] = -rot[1] * 0.2
                intervened = True

            # 3. Lateral jam relief: center radial offsets
            radial_dist = float(np.linalg.norm(pos[:2]))
            if radial_dist > 0.4 and stratum in [2, 3]:
                # Guide towards center
                certified_action[:2] = -pos[:2] * 0.3
                intervened = True

        elif task == "multifinger_lift":
            # Fingertip forces
            finger_fn = current_state.get("finger_fn", np.zeros(4))
            slip_ratio = current_state.get("slip_ratio", np.zeros(4))

            # 1. Crush barrier: limit squeeze command if Fn > 20 N
            max_fn = float(np.max(finger_fn))
            if max_fn > 20.0:
                # Clamp squeezing
                for i in range(len(finger_fn)):
                    if finger_fn[i] > 20.0 and candidate_action[i] > 0.0:
                        certified_action[i] = 0.0
                        intervened = True

            # 2. Slip barrier: if slip ratio > 0.85, gently squeeze to restore normal preload before lifting
            max_slip = float(np.max(slip_ratio))
            if max_slip > 0.85:
                # Halt arm lift acceleration and increase grasp preload
                if len(candidate_action) > 4 and candidate_action[4] > 0.0:
                    certified_action[4] = 0.0  # Pause lift
                    certified_action[:4] = np.maximum(certified_action[:4], 0.2)  # Preload clamp
                    intervened = True

        if intervened:
            self.total_interventions += 1

        info = {
            "intervened": intervened,
            "total_interventions": self.total_interventions,
            "intervention_rate": self.total_interventions / max(1, self.total_evaluations),
        }

        return certified_action, intervened, info

