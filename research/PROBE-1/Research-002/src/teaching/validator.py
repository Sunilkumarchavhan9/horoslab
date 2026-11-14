"""Physics Validation Engine for HOROS Model Teaching Infrastructure.

Implements the Grounded Firewall: no external teacher trajectory enters the student training pool
without passing rigorous physical validation checks.

Distinguishes:
1. Analytic Sanity & Kinematic Checks (velocity limits, torque limits, actuator saturation, NaNs/Infs).
2. Simulator Geometric Boundary Checks (analytic table support constraints, radial hole boundaries;
   explicitly distinguished from general 3D FEA/mesh collisions).
3. Privileged Parameter Firewall Checks (Coulomb friction cone verification using ground-truth mu_sim;
   strictly sealed inside this firewall boundary and never leaked downstream to student inputs).
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
    """Rigorous physical validator checking candidate trajectories against physical laws and boundaries."""

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
        """Validates a single candidate trajectory across all physical constraints."""
        meta = env_metadata or {}
        # Privileged simulation parameters accessed EXCLUSIVELY inside this firewall gatekeeper
        mu_true = float(meta.get("initial_mu_true", meta.get("mu_true", 0.60)))
        mass_kg = float(meta.get("initial_mass_kg", meta.get("object_mass", 0.350)))

        T = len(states)
        if T == 0 or len(actions) != T or len(wrenches) != T:
            return ValidationReport(
                verdict=ValidationVerdict.REJECTED_NAN_OR_CORRUPT,
                is_valid=False,
                violation_details="Array length mismatch or empty trajectory.",
            )

        # -------------------------------------------------------------
        # Phase 1: Analytic Sanity & Corruption Checks
        # -------------------------------------------------------------
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
        max_pen = 0.0
        max_lin_vel = 0.0

        for t in range(T):
            s_t = states[t]
            a_t = actions[t]
            w_t = wrenches[t]

            # ---------------------------------------------------------
            # Phase 2: Analytic Kinematic & Actuator Limit Checks
            # ---------------------------------------------------------
            # Extract commanded/realized velocities based on task structure
            if task_id in ("compliant_prelift", "compliant_lift", "multifinger_lift"):
                # In CompliantPreLift:
                # Actions are [squeeze_0..3, arm_dz_mm]
                if len(a_t) == 5:
                    v_cmd_lin = abs(float(a_t[4])) * 1e-3 / self.dt_s  # mm/step -> m/s
                else:
                    v_cmd_lin = float(np.linalg.norm(a_t[:3]))
                # Slip velocities in state vector s_t[16:20] in m/s
                v_slip_max = float(np.max(np.abs(s_t[16:20]))) if len(s_t) >= 20 else 0.0
                v_lin = max(v_cmd_lin, v_slip_max)
            else:
                # Peg in hole: action is [dx, dy, dz, droll, dpitch, dyaw] in mm and deg
                v_lin = float(np.linalg.norm(a_t[:3])) * 1e-3 / self.dt_s

            max_lin_vel = max(max_lin_vel, v_lin)
            if v_lin > self.max_linear_velocity_mps:
                return ValidationReport(
                    verdict=ValidationVerdict.REJECTED_KINEMATIC_LIMIT,
                    is_valid=False,
                    max_linear_velocity_mps=max_lin_vel,
                    failure_step=t,
                    violation_details=(
                        f"Step {t}: Linear velocity {v_lin:.4f} m/s exceeds safety threshold "
                        f"{self.max_linear_velocity_mps:.4f} m/s."
                    ),
                )

            # Actuator normal & shear force and torque checks
            if task_id in ("compliant_prelift", "compliant_lift", "multifinger_lift"):
                # Reject legacy padded representation [fn_0, fn_1, fn_2, fn_3, 0, 0] in modern pipeline
                if len(s_t) >= 16 and np.sum(s_t[12:16]) > 0.5:
                    if len(w_t) >= 6 and np.allclose(w_t[:4], s_t[12:16], atol=1e-4) and abs(w_t[4]) < 1e-6 and abs(w_t[5]) < 1e-6:
                        return ValidationReport(
                            verdict=ValidationVerdict.REJECTED_FORCE_LIMIT,
                            is_valid=False,
                            failure_step=t,
                            violation_details=(
                                f"Step {t}: Legacy padded wrench representation [fn_0, fn_1, fn_2, fn_3, 0, 0] "
                                f"detected in modern teaching pipeline. Task 2 requires 6-axis resultant wrench [Fx, Fy, Fz, Tx, Ty, Tz]."
                            ),
                        )
                # Normal clamping force from fingertip sensor channels s_t[12:16] in Newtons (N)
                fn_total = float(np.sum(s_t[12:16])) if len(s_t) >= 16 else float(np.linalg.norm(w_t[:2]))
                # True vertical pad shear force from 6-axis net wrench F_z^net = sum(F_t,z,i) in Newtons (N)
                fz_shear = float(abs(w_t[2]))
                # Resultant torque derived from cross products r_i x F_i in compute_prelift_resultant_wrench in Newton-meters (N*m)
                torque_mag = float(np.linalg.norm(w_t[3:])) if len(w_t) >= 6 else 0.0
            else:
                # Peg in hole: w_t is 6-axis ATI/Franka wrench [Fx, Fy, Fz, Tx, Ty, Tz]
                fn_total = float(np.linalg.norm(w_t[:2]))
                fz_shear = float(abs(w_t[2]))
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
                    violation_details=(
                        f"Step {t}: Normal clamping force {fn_total:.2f} N exceeds crush limit "
                        f"{self.max_normal_force_n:.2f} N."
                    ),
                )
            if fz_shear > self.max_shear_force_n:
                return ValidationReport(
                    verdict=ValidationVerdict.REJECTED_FORCE_LIMIT,
                    is_valid=False,
                    max_normal_force_n=max_fn,
                    max_shear_force_n=max_ft,
                    failure_step=t,
                    violation_details=(
                        f"Step {t}: Vertical shear force {fz_shear:.2f} N exceeds limit "
                        f"{self.max_shear_force_n:.2f} N."
                    ),
                )
            if torque_mag > self.max_torque_nm:
                return ValidationReport(
                    verdict=ValidationVerdict.REJECTED_FORCE_LIMIT,
                    is_valid=False,
                    failure_step=t,
                    violation_details=(
                        f"Step {t}: Torque magnitude {torque_mag:.2f} Nm exceeds limit "
                        f"{self.max_torque_nm:.2f} Nm."
                    ),
                )

            # ---------------------------------------------------------
            # Phase 3: Privileged Parameter Firewall Checks (Coulomb Cone)
            # ---------------------------------------------------------
            # Note: mu_true is privileged ground-truth accessed strictly within this firewall
            if task_id in ("compliant_prelift", "compliant_lift", "multifinger_lift") and fn_total > 0.5:
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
                        violation_details=(
                            f"Step {t}: Friction ratio |F_shear|/F_normal = {ratio:.3f} violates "
                            f"Coulomb cone (mu_sim={mu_true:.3f} + margin {self.friction_margin:.2f})."
                        ),
                    )

            # ---------------------------------------------------------
            # Phase 4: Simulator Geometric Boundary Checks
            # ---------------------------------------------------------
            if task_id in ("compliant_prelift", "compliant_lift", "multifinger_lift"):
                # Object vertical coordinate in prelift state vector (s_t[22] or s_t[8])
                obj_z_mm = float(s_t[22]) if len(s_t) > 22 else (float(s_t[8]) if len(s_t) > 8 else 0.0)
                # Table surface rests at z = 0.0 mm. Negative values represent elastic table indentation.
                if obj_z_mm < -self.max_penetration_mm:
                    pen_depth = abs(obj_z_mm)
                    max_pen = max(max_pen, pen_depth)
                    return ValidationReport(
                        verdict=ValidationVerdict.REJECTED_PENETRATION,
                        is_valid=False,
                        max_penetration_mm=max_pen,
                        failure_step=t,
                        violation_details=(
                            f"Step {t}: Workpiece penetrated rigid table boundary by {pen_depth:.2f} mm "
                            f"(limit {self.max_penetration_mm:.2f} mm)."
                        ),
                    )
            elif task_id == "peg_in_hole":
                # Tip coordinates: s_t[0], s_t[1], s_t[2] (x, y, z in mm)
                if len(s_t) >= 3:
                    tip_z = float(s_t[2])
                    radial_r = float(np.linalg.norm(s_t[:2]))
                    hole_r = float(meta.get("hole_radius", 15.5))
                    # Inside the hole (z < 0), peg outer radius must not exceed hole boundary
                    if tip_z < -1.0 and radial_r > (hole_r + self.max_penetration_mm):
                        pen_depth = radial_r - hole_r
                        max_pen = max(max_pen, pen_depth)
                        return ValidationReport(
                            verdict=ValidationVerdict.REJECTED_PENETRATION,
                            is_valid=False,
                            max_penetration_mm=max_pen,
                            failure_step=t,
                            violation_details=(
                                f"Step {t}: Peg penetrated hole wall boundary by {pen_depth:.2f} mm "
                                f"(limit {self.max_penetration_mm:.2f} mm)."
                            ),
                        )

        return ValidationReport(
            verdict=ValidationVerdict.PHYSICALLY_VALID,
            is_valid=True,
            max_normal_force_n=max_fn,
            max_shear_force_n=max_ft,
            max_friction_ratio=max_ratio,
            max_penetration_mm=max_pen,
            max_linear_velocity_mps=max_lin_vel,
            violation_details="",
            metadata={
                "steps_validated": T,
                "mu_sim_firewall_checked": mu_true,
                "mass_sim_checked": mass_kg,
            },
        )

    def filter_and_label_batch(
        self,
        task_id: str,
        episodes: List[Any],
    ) -> Tuple[List[Any], List[ValidationReport]]:
        """Filters a batch of episodes, accepting only physically valid episodes into the dataset."""
        valid_episodes: List[Any] = []
        reports: List[ValidationReport] = []

        for ep in episodes:
            if hasattr(ep, "states"):
                states = ep.states
                actions = ep.actions
                wrenches = ep.wrenches
                meta = ep.env_metadata
            else:
                states = ep["states"]
                actions = ep["actions"]
                wrenches = ep["wrenches"]
                meta = ep.get("env_metadata", {})

            rep = self.validate_trajectory(task_id, states, actions, wrenches, meta)
            reports.append(rep)
            if rep.is_valid:
                valid_episodes.append(ep)

        return valid_episodes, reports
