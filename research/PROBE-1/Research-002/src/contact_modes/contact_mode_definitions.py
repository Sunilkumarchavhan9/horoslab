"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.1: Seven-Mode Discrete Contact Manifold Definitions
Defines physical contact modes, classification logic, and threshold parameters.
"""

from __future__ import annotations
from enum import IntEnum
import numpy as np
from typing import Dict, Any, Optional


class ContactMode(IntEnum):
    """Seven discrete physical contact manifolds."""
    FREE = 0            # No rigid contact (Fn = 0)
    FIRST_CONTACT = 1   # Touchdown / initial contact onset (0 < Fn <= F_detect)
    STICKING = 2        # Static contact equilibrium inside Coulomb friction cone
    SLIDING = 3         # Tangential slip on surface at Coulomb boundary
    IMPACT = 4          # Dynamic collision impact shock / rapid force jump
    JAMMING = 5         # Two-point geometric wedging / mechanical lock
    RELEASE = 6         # Detachment / separation breaking contact


MODE_NAMES = {
    ContactMode.FREE: "Free",
    ContactMode.FIRST_CONTACT: "FirstContact",
    ContactMode.STICKING: "Sticking",
    ContactMode.SLIDING: "Sliding",
    ContactMode.IMPACT: "Impact",
    ContactMode.JAMMING: "Jamming",
    ContactMode.RELEASE: "Release",
}


def classify_contact_mode(
    state: Dict[str, Any],
    prev_state: Optional[Dict[str, Any]] = None,
    dt: float = 0.02,
    mu: float = 0.50,
    f_detect: float = 0.50,  # N
    impact_rate_threshold: float = 500.0,  # N/s
    wedge_angle_threshold: float = 1.8,  # deg
    task: str = "peg_in_hole",
) -> ContactMode:
    """
    Classifies the active physical contact manifold using physical sensor channels.
    """
    if task == "peg_in_hole":
        wrench = state.get("wrench", np.zeros(6))
        rot = state.get("rot", np.zeros(3))
        vel = state.get("vel", np.zeros(3))

        fn = float(abs(wrench[2])) if abs(wrench[2]) > 0.0 else float(np.linalg.norm(wrench[:2]))
        ft_norm = float(np.linalg.norm(wrench[:2]))
        tilt = float(np.linalg.norm(rot[:2]))

        prev_fn = 0.0
        if prev_state is not None:
            prev_wrench = prev_state.get("wrench", np.zeros(6))
            prev_fn = float(abs(prev_wrench[2])) if abs(prev_wrench[2]) > 0.0 else float(np.linalg.norm(prev_wrench[:2]))

        df_dt = (fn - prev_fn) / dt

        # 0. Free space check
        if fn < 0.01 and ft_norm < 0.01:
            if prev_fn > f_detect and vel[2] > 2.0:
                return ContactMode.RELEASE
            return ContactMode.FREE

        # 4. Impact check (rapid force rise)
        if df_dt > impact_rate_threshold:
            return ContactMode.IMPACT

        # 5. Wedging / Jamming check
        if tilt > wedge_angle_threshold and ft_norm > 15.0:
            return ContactMode.JAMMING

        # 1. First contact onset
        if fn <= f_detect and prev_fn < 0.01:
            return ContactMode.FIRST_CONTACT

        # 3. Tangential sliding check
        v_rel = float(np.linalg.norm(vel[:2]))
        if ft_norm >= mu * fn * 0.85 and v_rel > 1.0:
            return ContactMode.SLIDING

        # 2. Stable sticking
        return ContactMode.STICKING

    else:
        # Task 2: Multifingered Lift
        finger_fn = state.get("finger_fn", np.zeros(4))
        slip_ratios = state.get("slip_ratio", np.zeros(4))
        obj_vel = state.get("obj_vel", np.zeros(3))

        total_fn = float(np.sum(finger_fn))
        max_slip = float(np.max(slip_ratios)) if len(slip_ratios) > 0 else 0.0

        prev_fn = 0.0
        if prev_state is not None:
            prev_fn = float(np.sum(prev_state.get("finger_fn", np.zeros(4))))

        df_dt = (total_fn - prev_fn) / dt

        if total_fn < 0.05:
            if prev_fn > f_detect and obj_vel[2] < -5.0:
                return ContactMode.RELEASE
            return ContactMode.FREE

        if df_dt > impact_rate_threshold:
            return ContactMode.IMPACT

        if total_fn <= f_detect and prev_fn < 0.05:
            return ContactMode.FIRST_CONTACT

        if max_slip >= 0.85:
            return ContactMode.SLIDING

        return ContactMode.STICKING
