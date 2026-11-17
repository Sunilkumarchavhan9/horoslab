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


NUM_MODES = 7

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
    dt: Optional[float] = None,
    mu: float = 0.50,
    f_detect: float = 0.50,  # N
    impact_rate_threshold: float = 500.0,  # N/s
    wedge_angle_threshold: float = 1.8,  # deg
    task: str = "peg_in_hole",
    slip_vel_threshold_mps: float = 1e-4,  # 0.10 mm/s physical slip threshold
) -> ContactMode:
    """
    Classifies the active physical contact manifold using public physical sensor channels.
    Respects task-specific dt (0.01 s for CompliantPreLiftContactEnv via obs['dt_ms'] or task
    default; 0.02 s for PegInHoleEnv) and classifies Task 2 sliding via physical delta_dot_t
    when slip_ratio is absent, without ever reading hidden mu_true.
    """
    if dt is None:
        if "dt_ms" in state and float(state["dt_ms"]) > 0.0:
            resolved_dt = float(state["dt_ms"]) * 1e-3
        elif task in ("compliant_prelift", "compliant_lift"):
            resolved_dt = 0.01
        else:
            resolved_dt = 0.02
    else:
        resolved_dt = max(1e-6, float(dt))

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

        df_dt = (fn - prev_fn) / resolved_dt

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
        # Task 2: CompliantPreLiftContactEnv (delta_dot_t) or legacy MultifingerLiftEnv (slip_ratio)
        finger_fn = np.asarray(state.get("finger_fn", np.zeros(4)), dtype=float)
        obj_vel = state.get("obj_vel", np.zeros(3))

        total_fn = float(np.sum(finger_fn))

        prev_fn = 0.0
        if prev_state is not None:
            prev_fn = float(np.sum(prev_state.get("finger_fn", np.zeros(4))))

        df_dt = (total_fn - prev_fn) / resolved_dt

        if total_fn < 0.05:
            if prev_fn > f_detect and obj_vel[2] < -5.0:
                return ContactMode.RELEASE
            return ContactMode.FREE

        if df_dt > impact_rate_threshold:
            return ContactMode.IMPACT

        if total_fn <= f_detect and prev_fn < 0.05:
            return ContactMode.FIRST_CONTACT

        if "slip_ratio" in state:
            slip_ratios = np.asarray(state["slip_ratio"], dtype=float)
            max_slip = float(np.max(slip_ratios)) if len(slip_ratios) > 0 else 0.0
            if max_slip >= 0.85:
                return ContactMode.SLIDING
        elif "delta_dot_t" in state:
            delta_dot_t = np.asarray(state["delta_dot_t"], dtype=float)
            in_contact = finger_fn > 0.05
            if np.any(in_contact) and len(delta_dot_t) == len(finger_fn):
                max_slip_vel = float(np.max(np.abs(delta_dot_t[in_contact])))
            elif len(delta_dot_t) > 0:
                max_slip_vel = float(np.max(np.abs(delta_dot_t)))
            else:
                max_slip_vel = 0.0
            if max_slip_vel >= slip_vel_threshold_mps:
                return ContactMode.SLIDING

        return ContactMode.STICKING
