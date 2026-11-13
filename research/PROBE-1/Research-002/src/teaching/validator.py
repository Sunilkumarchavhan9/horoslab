"""Physics Validation Engine for HOROS Model Teaching Infrastructure.

Implements the Grounded Firewall: no external teacher trajectory enters the student
training pool without passing kinematic, friction cone, force, and penetration checks.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

import numpy as np


class ValidationVerdict(str, Enum):
    """Categorical outcome of physical validation."""
    PHYSICALLY_VALID = "PHYSICALLY_VALID"
    REJECTED_NAN_OR_CORRUPT = "REJECTED_NAN_OR_CORRUPT"
    REJECTED_KINEMATIC_LIMIT = "REJECTED_KINEMATIC_LIMIT"
    REJECTED_FRICTION_CONE = "REJECTED_FRICTION_CONE"
    REJECTED_FORCE_LIMIT = "REJECTED_FORCE_LIMIT"
    REJECTED_PENETRATION = "REJECTED_PENETRATION"
    REJECTED_COORDINATE_ERROR = "REJECTED_COORDINATE_ERROR"


@dataclass
class ValidationReport:
    """Detailed audit report produced by the Physics Validation Engine."""
    verdict: ValidationVerdict
    is_valid: bool
    max_normal_force_n: float = 0.0
    max_shear_force_n: float = 0.0
    max_friction_ratio: float = 0.0
    max_penetration_mm: float = 0.0
    max_linear_velocity_mps: float = 0.0
    failure_step: Optional[int] = None
    violation_details: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)


class PhysicsValidationEngine:
    """Rigorous physical validator checking trajectories against simulator mechanics."""

    def __init__(
        self,
        max_normal_force_n: float = 20.0,
        max_shear_force_n: float = 15.0,
        max_torque_nm: float = 2.0,
        max_linear_velocity_mps: float = 0.10,
        max_angular_velocity_radps: float = 2.0,
        max_penetration_mm: float = 0.50,
        friction_margin: float = 0.10,
        dt_s: float = 0.01,
    ):
        self.max_normal_force_n = max_normal_force_n
        self.max_shear_force_n = max_shear_force_n
        self.max_torque_nm = max_torque_nm
        self.max_linear_velocity_mps = max_linear_velocity_mps
        self.max_angular_velocity_radps = max_angular_velocity_radps
        self.max_penetration_mm = max_penetration_mm
        self.friction_margin = friction_margin
        self.dt_s = dt_s

    def validate_trajectory(
        self,
        task_id: str,
        states: np.ndarray,
        actions: np.ndarray,
        wrenches: np.ndarray,
        env_metadata: Optional[Dict[str, Any]] = None,
    ) -> ValidationReport:
        """Validates a single physical trajectory across all physical constraints."""
        meta = env_metadata or {}
        mu_true = float(meta.get("initial_mu_true", meta.get("mu_true", 0.60)))
        mass_kg = float(meta.get("initial_mass_kg", meta.get("object_mass", 0.350)))

        T = len(states)
        if T == 0 or len(actions) != T or len(wrenches) != T:
            return ValidationReport(
                verdict=ValidationVerdict.REJECTED_NAN_OR_CORRUPT,
                is_valid=False,
                violation_details="Array length mismatch or empty trajectory.",
            )

        # 1. NaN and Inf check
        if np.any(np.isnan(states)) or np.any(np.isinf(states)):
            return ValidationReport(
                verdict=ValidationVerdict.REJECTED_NAN_OR_CORRUPT,
                is_valid=False,
                violation_details="NaN or Inf detected in state array.",
            )
        if np.any(np.isnan(actions)) or np.any(np.isinf(actions)):
            return ValidationReport(
                verdict=ValidationVerdict.REJECTED_NAN_OR_CORRUPT,
                is_valid=False,
                violation_details="NaN or Inf detected in action array.",
            )
        if np.any(np.isnan(wrenches)) or np.any(np.isinf(wrenches)):
            return ValidationReport(
                verdict=ValidationVerdict.REJECTED_NAN_OR_CORRUPT,
                is_valid=False,
                violation_details="NaN or Inf detected in wrench array.",
            )

        max_fn = 0.0
        max_ft = 0.0
        max_ratio = 0.0
        max_pen_mm = 0.0
        max_vel = 0.0

        for t in range(T):
            s_t = states[t]
            a_t = actions[t]
            w_t = wrenches[t]

            # 2. Kinematic limits check
            if task_id == "compliant_prelift":
                # Action: [vx, vy, vz, omega, F_grip]
                lin_vel = np.linalg.norm(a_t[:3])
                ang_vel = abs(a_t[3])
                f_grip = a_t[4]
            else:
                # Peg in hole: [vx, vy, vz, wx, wy, wz]
                lin_vel = np.linalg.norm(a_t[:3])
                ang_vel = np.linalg.norm(a_t[3:])
                f_grip = 0.0

            max_vel = max(max_vel, float(lin_vel))
            if lin_vel > self.max_linear_velocity_mps:
                return ValidationReport(
                    verdict=ValidationVerdict.REJECTED_KINEMATIC_LIMIT,
                    is_valid=False,
                    max_linear_velocity_mps=max_vel,
                    failure_step=t,
                    violation_details=f"Step {t}: Linear velocity {lin_vel:.4f} m/s exceeds limit {self.max_linear_velocity_mps:.4f} m/s.",
                )
            if ang_vel > self.max_angular_velocity_radps:
                return ValidationReport(
                    verdict=ValidationVerdict.REJECTED_KINEMATIC_LIMIT,
                    is_valid=False,
                    failure_step=t,
                    violation_details=f"Step {t}: Angular velocity {ang_vel:.4f} rad/s exceeds limit {self.max_angular_velocity_radps:.4f} rad/s.",
                )

            # 3. Wrench & force limits check
            # ATI Nano17 frame: [Fx, Fy, Fz, Mx, My, Mz]
            fn_total = float(f_grip) if task_id == "compliant_prelift" else float(np.linalg.norm(w_t[:2]))
            fz_shear = abs(float(w_t[2]))
            torque_mag = float(np.linalg.norm(w_t[3:]))

            max_fn = max(max_fn, fn_total)
            max_ft = max(max_ft, fz_shear)

            if fn_total > self.max_normal_force_n:
                return ValidationReport(
                    verdict=ValidationVerdict.REJECTED_FORCE_LIMIT,
                    is_valid=False,
                    max_normal_force_n=max_fn,
                    max_shear_force_n=max_ft,
                    failure_step=t,
                    violation_details=f"Step {t}: Normal clamping force {fn_total:.2f} N exceeds crush limit {self.max_normal_force_n:.2f} N.",
                )
            if fz_shear > self.max_shear_force_n:
                return ValidationReport(
                    verdict=ValidationVerdict.REJECTED_FORCE_LIMIT,
                    is_valid=False,
                    max_normal_force_n=max_fn,
                    max_shear_force_n=max_ft,
                    failure_step=t,
                    violation_details=f"Step {t}: Vertical shear force {fz_shear:.2f} N exceeds limit {self.max_shear_force_n:.2f} N.",
                )
            if torque_mag > self.max_torque_nm:
                return ValidationReport(
                    verdict=ValidationVerdict.REJECTED_FORCE_LIMIT,
                    is_valid=False,
                    failure_step=t,
                    violation_details=f"Step {t}: Torque magnitude {torque_mag:.2f} Nm exceeds limit {self.max_torque_nm:.2f} Nm.",
                )

            # 4. Coulomb friction cone check
            if task_id == "compliant_prelift" and fn_total > 0.5:
                # In prelift, 4 fingers share grip. Total normal force is Fn_total.
                # Maximum static shear force is mu * Fn_total.
                ratio = fz_shear / fn_total
                max_ratio = max(max_ratio, ratio)
                if ratio > (mu_true + self.friction_margin):
                    return ValidationReport(
                        verdict=ValidationVerdict.REJECTED_FRICTION_CONE,
                        is_valid=False,
                        max_friction_ratio=max_ratio,
                        max_normal_force_n=max_fn,
                        max_shear_force_n=max_ft,
                        failure_step=t,
                        violation_details=f"Step {t}: Friction ratio |F_shear|/F_normal = {ratio:.3f} violates Coulomb cone (mu={mu_true:.3f} + margin {self.friction_margin:.2f}).",
                    )

            # 5. Collision and penetration check
            if task_id == "compliant_prelift":
                # In prelift, s_t[6] is obj_z in mm (or s_t[8] depending on layout).
                # Table surface is at z = 0. Penetration occurs if obj_z < -0.5 mm.
                obj_z_mm = float(s_t[8]) if len(s_t) > 8 else float(s_t[2])
                if obj_z_mm < -self.max_penetration_mm:
                    max_pen_mm = abs(obj_z_mm)
                    return ValidationReport(
                        verdict=ValidationVerdict.REJECTED_PENETRATION,
                        is_valid=False,
                        max_penetration_mm=max_pen_mm,
                        failure_step=t,
                        violation_details=f"Step {t}: Object penetrated table surface by {abs(obj_z_mm):.2f} mm (limit {self.max_penetration_mm:.2f} mm).",
                    )
            elif task_id == "peg_in_hole":
                # Tip z cannot penetrate deeper than bottom of hole (-50.5 mm)
                tip_z_mm = float(s_t[2])
                if tip_z_mm < -50.5:
                    max_pen_mm = abs(tip_z_mm - (-50.0))
                    return ValidationReport(
                        verdict=ValidationVerdict.REJECTED_PENETRATION,
                        is_valid=False,
                        max_penetration_mm=max_pen_mm,
                        failure_step=t,
                        violation_details=f"Step {t}: Peg tip penetrated hole bottom by {max_pen_mm:.2f} mm.",
                    )

        return ValidationReport(
            verdict=ValidationVerdict.PHYSICALLY_VALID,
            is_valid=True,
            max_normal_force_n=max_fn,
            max_shear_force_n=max_ft,
            max_friction_ratio=max_ratio,
            max_penetration_mm=max_pen_mm,
            max_linear_velocity_mps=max_vel,
            violation_details="All physical invariants satisfied.",
        )

    def filter_and_label_batch(
        self,
        task_id: str,
        episodes: List[Any],
    ) -> Tuple[List[Any], List[ValidationReport]]:
        """Filters a batch of episodes, separating validated trajectories from rejections."""
        validated: List[Any] = []
        reports: List[ValidationReport] = []

        for ep in episodes:
            if hasattr(ep, "states"):
                states = ep.states
                actions = ep.actions
                wrenches = ep.wrenches
                meta = getattr(ep, "env_metadata", {})
            else:
                states = ep["states"]
                actions = ep["actions"]
                wrenches = ep["wrenches"]
                meta = ep.get("env_metadata", {})
            report = self.validate_trajectory(task_id, states, actions, wrenches, env_metadata=meta)
            reports.append(report)
            if report.is_valid:
                validated.append(ep)

        return validated, reports
