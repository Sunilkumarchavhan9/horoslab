"""Geometry-aware and clearance-ablatable CBF safety filter for Peg-in-Hole (Phase 3.5.2).

Preserves ``src/safety/pcbf_safety_filter.py`` untouched as the archived baseline.
Never reads oracle ground-truth keys (``clearance``, ``friction``) from environment
observations; operates strictly on controller-visible state and either an independent
metrology estimate + uncertainty (Mode A) or a bounded-domain conservative fallback
(Mode B) that fails closed outside its validated domain.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, Optional, Tuple

import numpy as np

from src.safety.pcbf_safety_filter import PredictiveCBFSafetyFilter

ORACLE_OBS_KEYS = frozenset({"clearance", "friction"})
VALIDATED_OOD_MIN_CLEARANCE_MM = 0.18
VALIDATED_FRICTION_UPPER = 0.90
DEFAULT_C_FLOOR_VALID_MM = 0.05


class ClearanceMode(str, Enum):
    ESTIMATED_CLEARANCE = "estimated_clearance"
    UNKNOWN_CLEARANCE = "unknown_clearance"


def extract_controller_visible_pih_obs(obs: Dict[str, Any]) -> Dict[str, Any]:
    """Return a shallow-copied observation stripped of privileged oracle fields."""
    if not isinstance(obs, dict):
        raise TypeError("Observation must be a dictionary.")
    clean: Dict[str, Any] = {}
    for key, value in obs.items():
        if key in ORACLE_OBS_KEYS:
            continue
        clean[key] = value.copy() if isinstance(value, np.ndarray) else value
    return clean


def compute_critical_wedge_angle(clearance_mm: float, peg_length_mm: float = 80.0) -> float:
    """Compute theoretical two-point wedging critical tilt angle in degrees."""
    if not np.isfinite(clearance_mm) or not np.isfinite(peg_length_mm) or peg_length_mm <= 0.0:
        return 0.0
    if clearance_mm <= 0.0:
        return 0.0
    return float(np.degrees(np.arctan2(2.0 * float(clearance_mm), float(peg_length_mm))))


@dataclass(frozen=True)
class ClearanceSpecification:
    """Controller-visible clearance specification without oracle environment access."""

    mode: ClearanceMode = ClearanceMode.UNKNOWN_CLEARANCE
    c_hat_mm: Optional[float] = None
    sigma_c_mm: float = 0.0
    k_sigma: float = 2.0
    c_robust_mm: float = VALIDATED_OOD_MIN_CLEARANCE_MM
    c_floor_valid_mm: float = DEFAULT_C_FLOOR_VALID_MM
    allow_below_validated_domain: bool = False
    min_possible_clearance_mm: float = VALIDATED_OOD_MIN_CLEARANCE_MM


def _is_finite_array(arr: Any, expected_len: int) -> Tuple[bool, Optional[np.ndarray]]:
    try:
        vec = np.asarray(arr, dtype=np.float64)
    except (TypeError, ValueError):
        return False, None
    if vec.shape != (expected_len,) or not np.all(np.isfinite(vec)):
        return False, None
    return True, vec


def _clip_action(action: np.ndarray) -> np.ndarray:
    lower = np.array([-5.0, -5.0, -5.0, -2.0, -2.0, -2.0], dtype=np.float64)
    upper = np.array([5.0, 5.0, 5.0, 2.0, 2.0, 2.0], dtype=np.float64)
    return np.clip(np.asarray(action, dtype=np.float64), lower, upper)


def _project_vec_to_disk(vec: np.ndarray, max_radius: float) -> np.ndarray:
    norm = float(np.linalg.norm(vec))
    if norm <= max_radius or max_radius <= 0.0:
        return np.zeros_like(vec) if max_radius <= 0.0 else vec.copy()
    return vec * (max_radius / (norm + 1e-12))


class GeometryAwareCBFSafetyFilter:
    """First-principles geometry- and contact-aware predictive CBF safety filter."""

    def __init__(
        self,
        max_normal_force: float = 35.0,
        max_torque: float = 7.0,
        operational_force_limit: float = 24.0,
        operational_torque_limit: float = 5.0,
        peg_length_mm: float = 80.0,
        contact_stiffness: float = 5000.0,
        contact_damping: float = 100.0,
        friction_upper_bound: float = VALIDATED_FRICTION_UPPER,
        dt: float = 0.05,
        r_gate_fraction: float = 0.65,
        r_tube_fraction: float = 0.85,
        tilt_gate_fraction: float = 0.70,
        tilt_tube_fraction: float = 0.75,
        clearance_spec: Optional[ClearanceSpecification] = None,
        enable_shadow_baseline: bool = True,
    ):
        self.max_normal_force = float(max_normal_force)
        self.max_torque = float(max_torque)
        self.operational_force_limit = float(operational_force_limit)
        self.operational_torque_limit = float(operational_torque_limit)
        self.peg_length_mm = float(peg_length_mm)
        self.contact_stiffness = float(contact_stiffness)
        self.contact_damping = float(contact_damping)
        self.friction_upper_bound = float(friction_upper_bound)
        self.dt = float(dt)
        self.r_gate_fraction = float(r_gate_fraction)
        self.r_tube_fraction = float(r_tube_fraction)
        self.tilt_gate_fraction = float(tilt_gate_fraction)
        self.tilt_tube_fraction = float(tilt_tube_fraction)
        self.clearance_spec = clearance_spec or ClearanceSpecification()
        self.shadow_baseline = (
            PredictiveCBFSafetyFilter(
                max_normal_force=self.max_normal_force,
                max_torque=self.max_torque,
                critical_wedge_angle=1.8,
            )
            if enable_shadow_baseline
            else None
        )
        self.reset_episode_state()

    def reset_episode_state(self) -> None:
        self._latched_refusal_reason: Optional[str] = None
        self.total_steps = 0
        self.modified_steps = 0
        self.shadow_would_pass_unsafe_steps = 0

    def resolve_safe_clearance(
        self,
        clearance_spec: Optional[ClearanceSpecification] = None,
        pos_xy: Optional[np.ndarray] = None,
        z_mm: Optional[float] = None,
        wrench: Optional[np.ndarray] = None,
    ) -> Tuple[bool, float, float, Optional[str]]:
        """Resolve conservative safe clearance ``c_safe`` without oracle env fields."""
        spec = clearance_spec or self.clearance_spec
        if self._latched_refusal_reason is not None:
            return False, 0.0, 0.0, self._latched_refusal_reason

        if spec.mode == ClearanceMode.ESTIMATED_CLEARANCE:
            if spec.c_hat_mm is None or not np.isfinite(spec.c_hat_mm):
                return False, 0.0, 0.0, "invalid_or_missing_clearance_estimate"
            if not np.isfinite(spec.sigma_c_mm) or spec.sigma_c_mm < 0.0:
                return False, 0.0, 0.0, "invalid_clearance_uncertainty"
            if not np.isfinite(spec.k_sigma) or spec.k_sigma < 0.0:
                return False, 0.0, 0.0, "invalid_k_sigma"
            c_safe = float(spec.c_hat_mm) - float(spec.k_sigma) * float(spec.sigma_c_mm)
            if not np.isfinite(c_safe) or c_safe < float(spec.c_floor_valid_mm):
                return False, 0.0, 0.0, "estimated_lcb_below_valid_floor"
            return True, c_safe, compute_critical_wedge_angle(c_safe, self.peg_length_mm), None

        if spec.mode == ClearanceMode.UNKNOWN_CLEARANCE:
            if spec.allow_below_validated_domain or (
                not np.isfinite(spec.min_possible_clearance_mm)
                or float(spec.min_possible_clearance_mm) < float(spec.c_robust_mm)
            ):
                return False, 0.0, 0.0, "outside_validated_clearance_domain"
            if not np.isfinite(spec.c_robust_mm) or float(spec.c_robust_mm) < float(spec.c_floor_valid_mm):
                return False, 0.0, 0.0, "invalid_robust_clearance"
            c_safe = float(spec.c_robust_mm)
            # Runtime falsification check: lateral/wall reaction force strictly inside c_robust
            if pos_xy is not None and z_mm is not None and wrench is not None and z_mm <= 0.0:
                r_curr = float(np.linalg.norm(pos_xy))
                lateral_force = float(np.linalg.norm(wrench[:2]))
                if r_curr <= c_safe + 1e-3 and lateral_force > 1.0:
                    self._latched_refusal_reason = "contact_resistance_below_validated_domain"
                    return False, 0.0, 0.0, self._latched_refusal_reason
            return True, c_safe, compute_critical_wedge_angle(c_safe, self.peg_length_mm), None

        return False, 0.0, 0.0, "unknown_clearance_mode"

    def predict_contact_wrench_upper_bound(
        self,
        pos: np.ndarray,
        vel: np.ndarray,
        rot: np.ndarray,
        action: np.ndarray,
        c_safe: float,
        theta_crit_deg: float,
    ) -> Dict[str, float]:
        """Conservatively predict next-step normal force, total force, torque, and depth."""
        pos_next = pos + action[:3]
        rot_next = rot + action[3:6]
        z_next = float(pos_next[2])
        r_curr = float(np.linalg.norm(pos[:2]))
        r_next = float(np.linalg.norm(pos_next[:2]))
        tilt_next = float(np.linalg.norm(rot_next[:2]))
        insertion_next = max(0.0, -z_next)

        if z_next > 0.0 or r_next <= c_safe:
            return {
                "z_next": z_next,
                "r_next": r_next,
                "tilt_next": tilt_next,
                "insertion_next": insertion_next,
                "fn_upper": 0.0,
                "force_upper": 0.0 if z_next > 0.0 else 0.5 * self.friction_upper_bound,
                "torque_upper": 0.0,
            }

        penetration_m = (r_next - c_safe) * 1e-3
        r_dir = pos_next[:2] / (r_next + 1e-9)
        v_r_obs = float(np.dot(vel[:2], r_dir))
        v_r_cmd = float((r_next - r_curr) / max(self.dt, 1e-6))
        v_r_upper = max(0.0, v_r_obs, v_r_cmd)

        fn_base = max(0.0, self.contact_stiffness * penetration_m + self.contact_damping * v_r_upper * 1e-3)
        if tilt_next > theta_crit_deg and insertion_next > 2.0:
            wedge_mult = 1.0 + 3.0 * (tilt_next / (theta_crit_deg + 1e-6))
            fn_upper = fn_base * wedge_mult
        else:
            fn_upper = fn_base

        force_factor = float(
            np.sqrt((1.0 + min(self.friction_upper_bound, 0.5)) ** 2 + self.friction_upper_bound ** 2)
        )
        torque_factor = float(np.sqrt((self.peg_length_mm * 0.5e-3) ** 2 + 0.05 ** 2))
        return {
            "z_next": z_next,
            "r_next": r_next,
            "tilt_next": tilt_next,
            "insertion_next": insertion_next,
            "fn_upper": float(fn_upper),
            "force_upper": float(fn_upper * force_factor),
            "torque_upper": float(fn_upper * torque_factor),
        }

    def _safe_fail_closed_action(
        self,
        pos: Optional[np.ndarray],
        rot: Optional[np.ndarray],
        reason: str,
        raw_action: np.ndarray,
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        safe_act = np.zeros(6, dtype=np.float64)
        if pos is not None and np.all(np.isfinite(pos)):
            if pos[2] <= 0.0:
                safe_act[2] = float(np.clip(max(1.0, 1.0 - pos[2]), 0.0, 5.0))
            else:
                safe_act[2] = float(np.clip(max(0.0, 1.0 - pos[2]), 0.0, 5.0))
            safe_act[:2] = np.clip(-0.5 * pos[:2], -5.0, 5.0)
        else:
            safe_act[2] = 2.0
        if rot is not None and np.all(np.isfinite(rot)):
            safe_act[3:5] = np.clip(-0.5 * rot[:2], -2.0, 2.0)
        safe_act = _clip_action(safe_act)
        self.modified_steps += 1
        return safe_act, {
            "is_safe": False,
            "modified": True,
            "fail_closed": True,
            "reason": reason,
            "entry_allowed": False,
            "c_safe_mm": 0.0,
            "theta_crit_deg": 0.0,
            "raw_action": raw_action.tolist(),
            "safe_action": safe_act.tolist(),
        }

    def filter_action(
        self,
        obs: Dict[str, Any],
        raw_action: np.ndarray,
        clearance_spec: Optional[ClearanceSpecification] = None,
        wm_pred_wrench: Optional[np.ndarray] = None,
        wm_pred_wrench_std: Optional[np.ndarray] = None,
        allow_entry_phase: bool = True,
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """Project ``raw_action`` onto the geometry-aware safe admissible set."""
        self.total_steps += 1
        visible_obs = extract_controller_visible_pih_obs(obs)

        ok_raw, raw_vec = _is_finite_array(raw_action, 6)
        if not ok_raw:
            raw_fallback = np.zeros(6, dtype=np.float64)
            return self._safe_fail_closed_action(None, None, "non_finite_action", raw_fallback)
        clipped_raw = _clip_action(raw_vec)

        ok_pos, pos = _is_finite_array(visible_obs.get("pos"), 3)
        ok_vel, vel = _is_finite_array(visible_obs.get("vel"), 3)
        ok_rot, rot = _is_finite_array(visible_obs.get("rot"), 3)
        ok_wrench, wrench = _is_finite_array(visible_obs.get("wrench"), 6)
        stratum = visible_obs.get("stratum", -1)
        valid_stratum = isinstance(stratum, (int, np.integer)) and 0 <= int(stratum) <= 4
        if not (ok_pos and ok_vel and ok_rot and ok_wrench and valid_stratum):
            return self._safe_fail_closed_action(pos, rot, "invalid_or_non_finite_observation", clipped_raw)

        if wm_pred_wrench is not None:
            ok_wm, wm_w = _is_finite_array(wm_pred_wrench, 6)
            if not ok_wm:
                return self._safe_fail_closed_action(pos, rot, "non_finite_wm_prediction", clipped_raw)
            if wm_pred_wrench_std is not None:
                ok_std, wm_std = _is_finite_array(wm_pred_wrench_std, 6)
                if not ok_std or np.any(wm_std < 0.0):
                    return self._safe_fail_closed_action(pos, rot, "non_finite_wm_uncertainty", clipped_raw)
                wm_w_abs = np.abs(wm_w) + 2.0 * wm_std
            else:
                wm_w_abs = np.abs(wm_w)
            wm_force_ucb = float(np.linalg.norm(wm_w_abs[:3]))
            wm_torque_ucb = float(np.linalg.norm(wm_w_abs[3:6]))
        else:
            wm_force_ucb = 0.0
            wm_torque_ucb = 0.0

        ok_clr, c_safe, theta_crit_deg, refusal_reason = self.resolve_safe_clearance(
            clearance_spec=clearance_spec,
            pos_xy=pos[:2],
            z_mm=float(pos[2]),
            wrench=wrench,
        )
        if not ok_clr:
            return self._safe_fail_closed_action(pos, rot, refusal_reason or "clearance_refused", clipped_raw)

        safe_action = clipped_raw.copy()
        reasons = []

        r_gate = self.r_gate_fraction * c_safe
        r_tube = self.r_tube_fraction * c_safe
        tilt_gate = self.tilt_gate_fraction * theta_crit_deg
        tilt_tube = self.tilt_tube_fraction * theta_crit_deg

        r_curr = float(np.linalg.norm(pos[:2]))
        tilt_curr = float(np.linalg.norm(rot[:2]))
        f_meas = float(np.linalg.norm(wrench[:3]))
        tau_meas = float(np.linalg.norm(wrench[3:6]))

        # Joint lateral & tilt tube projection (strictly enforced across all strata 0..4)
        active_r_limit = r_gate if pos[2] > 0.0 else r_tube
        active_tilt_limit = tilt_gate if pos[2] > 0.0 else tilt_tube

        pos_next_xy = pos[:2] + safe_action[:2]
        if float(np.linalg.norm(pos_next_xy)) > active_r_limit:
            target_xy = _project_vec_to_disk(pos_next_xy, active_r_limit)
            safe_action[:2] = np.clip(target_xy - pos[:2], -5.0, 5.0)
            reasons.append("radial_tube_projection")

        rot_next_xy = rot[:2] + safe_action[3:5]
        if float(np.linalg.norm(rot_next_xy)) > active_tilt_limit:
            target_rot_xy = _project_vec_to_disk(rot_next_xy, active_tilt_limit)
            safe_action[3:5] = np.clip(target_rot_xy - rot[:2], -2.0, 2.0)
            reasons.append("tilt_tube_projection")

        # Update expected next xy/tilt after lateral+tilt projection
        r_next = float(np.linalg.norm(pos[:2] + safe_action[:2]))
        tilt_next = float(np.linalg.norm(rot[:2] + safe_action[3:5]))

        # Pre-entry gate when currently above fixture mouth (z > 0)
        entry_ready = (
            allow_entry_phase
            and r_curr <= r_gate
            and r_next <= r_gate
            and tilt_curr <= tilt_gate
            and tilt_next <= tilt_gate
        )
        if pos[2] > 0.0:
            z_next = float(pos[2] + safe_action[2])
            if z_next <= 0.0 and not entry_ready:
                min_dz = max(-safe_action[2] * 0.0, 0.5 - float(pos[2]))
                safe_action[2] = float(np.clip(max(safe_action[2], min_dz), -5.0, 5.0))
                reasons.append("pre_entry_alignment_gate")

        # Predictive wrench + measured contact guard (stratum-independent, all 0..4)
        pred = self.predict_contact_wrench_upper_bound(pos, vel, rot, safe_action, c_safe, theta_crit_deg)
        f_pred_total = max(pred["force_upper"], wm_force_ucb)
        tau_pred_total = max(pred["torque_upper"], wm_torque_ucb)

        in_unsafe_contact = (
            f_meas > self.operational_force_limit
            or tau_meas > self.operational_torque_limit
            or f_pred_total > self.operational_force_limit
            or tau_pred_total > self.operational_torque_limit
            or (pos[2] <= 0.0 and (r_curr > c_safe or tilt_curr > theta_crit_deg))
        )
        if in_unsafe_contact:
            # Halt downward motion or gently retract while centering laterally & uprighting tilt
            if f_meas > self.operational_force_limit or tau_meas > self.operational_torque_limit:
                safe_action[2] = float(np.clip(max(safe_action[2], 1.0), 0.0, 5.0))
            else:
                safe_action[2] = float(np.clip(max(safe_action[2], 0.0), 0.0, 5.0))
            safe_action[:2] = np.clip(-pos[:2], -5.0, 5.0)
            safe_action[3:5] = np.clip(-rot[:2], -2.0, 2.0)
            pred = self.predict_contact_wrench_upper_bound(pos, vel, rot, safe_action, c_safe, theta_crit_deg)
            f_pred_total = max(pred["force_upper"], wm_force_ucb)
            tau_pred_total = max(pred["torque_upper"], wm_torque_ucb)
            reasons.append("predictive_contact_barrier")

        # Enforce hard safety fallback if even centered step would cross operational ceiling while z <= 0
        if pos[2] + safe_action[2] <= 0.0 and (
            f_pred_total > self.max_normal_force or tau_pred_total > self.max_torque
        ):
            safe_action[2] = float(np.clip(max(0.5 - pos[2], 0.5), 0.0, 5.0))
            reasons.append("hard_safety_retract")

        safe_action = _clip_action(safe_action)
        modified = bool(np.linalg.norm(safe_action - clipped_raw) > 1e-6)
        if modified:
            self.modified_steps += 1

        shadow_info: Dict[str, Any] = {}
        if self.shadow_baseline is not None:
            shadow_act, shadow_intervened, shadow_meta = self.shadow_baseline.filter_action(
                visible_obs, clipped_raw.copy()
            )
            shadow_passed_raw = bool(not shadow_intervened and np.linalg.norm(shadow_act - clipped_raw) <= 1e-6)
            shadow_unsafe = shadow_passed_raw and (len(reasons) > 0 or pred["force_upper"] > self.max_normal_force)
            if shadow_unsafe:
                self.shadow_would_pass_unsafe_steps += 1
            shadow_info = {
                "shadow_modified": bool(shadow_intervened),
                "shadow_reason": str(shadow_meta.get("reason", "ok")),
                "shadow_action_diff": float(np.linalg.norm(shadow_act - safe_action)),
                "shadow_would_pass_unsafe": bool(shadow_unsafe),
            }

        return safe_action, {
            "is_safe": True,
            "modified": modified,
            "fail_closed": False,
            "reason": ";".join(reasons) if reasons else "nominal",
            "entry_allowed": bool(entry_ready),
            "c_safe_mm": float(c_safe),
            "theta_crit_deg": float(theta_crit_deg),
            "f_meas": float(f_meas),
            "tau_meas": float(tau_meas),
            "f_pred_upper": float(f_pred_total),
            "tau_pred_upper": float(tau_pred_total),
            "r_curr": float(r_curr),
            "r_next": float(np.linalg.norm(pos[:2] + safe_action[:2])),
            "tilt_curr": float(tilt_curr),
            "tilt_next": float(np.linalg.norm(rot[:2] + safe_action[3:5])),
            "raw_action": clipped_raw.tolist(),
            "safe_action": safe_action.tolist(),
            **shadow_info,
        }
