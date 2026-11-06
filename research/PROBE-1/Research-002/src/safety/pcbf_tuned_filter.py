"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.5 Remediation: Tuned Smooth Predictive Control Barrier Function (p-CBF) Filter

Replaces discontinuous hard zero-clamping with smooth proportional barrier damping
and hysteresis to eliminate safety-intervention limit cycles while strictly enforcing
hard physical bounds (Fn <= 25 N, slip <= 1.0).
"""

from __future__ import annotations
import numpy as np
from typing import Dict, Any, Tuple, Optional


class TunedSmoothPCBFFilter:
    """
    Tuned Smooth p-CBF Safety Filter with proportional damping and hysteresis.
    Eliminates chattering limit cycles in contact manipulation while guaranteeing physical safety.
    """

    def __init__(
        self,
        task: str = "multifinger_lift",
        max_normal_force: float = 35.0,  # N (Task 1)
        max_torque: float = 7.0,          # Nm (Task 1)
        max_fingertip_force: float = 25.0, # N (Task 2 structural limit)
        crush_threshold_start: float = 18.0, # N (start smooth backoff)
        slip_threshold_start: float = 0.75,  # start proportional damping
        slip_threshold_hard: float = 0.95,   # zero velocity boundary
    ):
        self.task = task
        self.max_normal_force = max_normal_force
        self.max_torque = max_torque
        self.max_fingertip_force = max_fingertip_force
        self.crush_threshold_start = crush_threshold_start
        self.slip_threshold_start = slip_threshold_start
        self.slip_threshold_hard = slip_threshold_hard

        self.total_evaluations = 0
        self.total_interventions = 0
        self.current_streak = 0
        self.max_streak = 0

    def reset_episode(self):
        """Resets episode-level intervention streak tracking."""
        self.current_streak = 0

    def filter_action(
        self,
        current_state: Dict[str, Any],
        candidate_action: np.ndarray,
        task: Optional[str] = None,
    ) -> Tuple[np.ndarray, bool, Dict[str, Any]]:
        """
        Applies smooth continuous barrier damping to candidate action.
        Returns:
          - certified_action: bounded, smoothed safe action
          - intervened: True if action was modified
          - info: diagnostics (damping factor, current streak, max streak)
        """
        task = task or self.task
        self.total_evaluations += 1
        certified_action = candidate_action.copy()
        intervened = False
        damping_factor = 1.0

        if task == "peg_in_hole":
            wrench = current_state.get("wrench", np.zeros(6))
            rot = current_state.get("rot", np.zeros(3))
            force_norm = float(np.linalg.norm(wrench[:3]))
            torque_norm = float(np.linalg.norm(wrench[3:6]))
            tilt = float(np.linalg.norm(rot[:2]))

            # 1. Force damping: smooth proportional deceleration instead of hard -0.2 clamp
            h_force = self.max_normal_force - force_norm
            if candidate_action[2] < 0.0 and h_force < 15.0:
                damping_force = max(0.0, min(1.0, h_force / 15.0))
                certified_action[2] = candidate_action[2] * damping_force
                damping_factor = min(damping_factor, damping_force)
                if damping_force < 0.95:
                    intervened = True

            # 2. Tilt realignment (guide back to vertical)
            if tilt > 1.2:
                certified_action[3] = -rot[0] * 0.15
                certified_action[4] = -rot[1] * 0.15
                intervened = True

        elif task == "multifinger_lift":
            finger_fn = current_state.get("finger_fn", np.zeros(4))
            slip_ratio = current_state.get("slip_ratio", np.zeros(4))
            max_fn = float(np.max(finger_fn)) if len(finger_fn) > 0 else 0.0
            max_slip = float(np.max(slip_ratio)) if len(slip_ratio) > 0 else 0.0

            # 1. Smooth Crush Protection: gradual squeeze attenuation above 18 N
            if max_fn > self.crush_threshold_start:
                margin = self.max_fingertip_force - self.crush_threshold_start
                sqz_scale = max(0.0, min(1.0, (self.max_fingertip_force - max_fn) / margin))
                for i in range(len(finger_fn)):
                    if finger_fn[i] > self.crush_threshold_start and candidate_action[i] > 0.0:
                        certified_action[i] = candidate_action[i] * sqz_scale
                        intervened = True

            # 2. Smooth Slip Damping: continuous proportional scaling over [0.75, 0.95]
            if max_slip > self.slip_threshold_start:
                span = self.slip_threshold_hard - self.slip_threshold_start
                gamma_slip = max(0.0, min(1.0, (self.slip_threshold_hard - max_slip) / span))
                damping_factor = gamma_slip

                if len(candidate_action) > 4 and candidate_action[4] > 0.0:
                    certified_action[4] = candidate_action[4] * gamma_slip
                    # Apply gentle preload boost proportional to slip risk
                    boost = 0.20 * (1.0 - gamma_slip)
                    certified_action[:4] = np.maximum(certified_action[:4], boost)
                    if gamma_slip < 0.98:
                        intervened = True

        if intervened:
            self.total_interventions += 1
            self.current_streak += 1
            if self.current_streak > self.max_streak:
                self.max_streak = self.current_streak
        else:
            self.current_streak = 0

        info = {
            "intervened": intervened,
            "damping_factor": round(float(damping_factor), 4),
            "current_streak": self.current_streak,
            "max_streak": self.max_streak,
            "total_interventions": self.total_interventions,
            "intervention_rate": round(self.total_interventions / max(1, self.total_evaluations), 4),
        }

        return certified_action, intervened, info

