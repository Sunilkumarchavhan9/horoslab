"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.6: Contact-Aware Safety Coordination
Module: Contact-Aware Action Substitutor (Workstream B)

Implements Document 40 Revision 2.1 & Document 41 Corrective Specifications:
1. Normal preload substitution via bounded proportional displacement controller
2. Stateful three-way vertical velocity and displacement integrator
3. Multi-finger weakest-contact friction cone bottleneck
4. Two-zone anti-crush architecture (18 N proportional active retraction + 25 N hard limit saturation)
5. Asymmetric contact-loss fallback with per-finger force ceiling protection
6. Comprehensive shear force telemetry validation (NaN / Inf / dimension rejection)
7. Explicit separation of measured vs estimated shear; clamp release requires empirical shear
8. Malformed proposed action validation (dimensions, finiteness)
"""

import math
from typing import Dict, Any, Tuple, Optional
import numpy as np


class ContactAwareActionSubstitutor:
    def __init__(
        self,
        object_mass: float = 0.50,           # kg
        gravity: float = 9.81,               # m/s^2
        num_fingers: int = 4,
        friction_coeff: float = 0.60,
        elastic_stiffness: float = 4.0,      # N/mm
        dynamic_safety_margin: float = 1.25, # gamma
        friction_margin_eta: float = 0.85,   # eta
        dt: float = 0.01,                    # s (100 Hz)
        max_crush_force: float = 18.0,       # N (Protective ceiling)
        hard_environment_limit: float = 25.0,# N (Emergency limit)
        contact_loss_threshold: float = 0.10,# N (Loss boundary)
        kp_squeeze: float = 1.0,             # step^-1
        k_retract: float = 1.5               # step^-1
    ):
        self.m = float(object_mass)
        self.g = float(gravity)
        self.F_g = self.m * self.g           # N (4.905 N)
        self.N_f = int(num_fingers)
        self.mu = float(friction_coeff)
        self.k_elastic = float(elastic_stiffness)
        self.gamma = float(dynamic_safety_margin)
        self.eta = float(friction_margin_eta)
        self.dt = float(dt)
        self.F_ceiling = float(max_crush_force)
        self.F_hard_limit = float(hard_environment_limit)
        self.F_min_valid = float(contact_loss_threshold)
        self.Kp = float(kp_squeeze)
        self.K_retract = float(k_retract)

        # Required normal force per finger: F_n_req = (gamma * F_g) / (N_f * mu)
        if self.mu > 0.0 and self.N_f > 0:
            self.F_n_required = (self.gamma * self.F_g) / (self.N_f * self.mu)
        else:
            self.F_n_required = float("inf")

        # Stateful vertical velocity tracker [m/s]
        self.v_z = 0.0

    def reset(self):
        """Resets stateful velocity tracker between episodes."""
        self.v_z = 0.0

    def calculate_force_deficit(self, fn_profile: np.ndarray) -> np.ndarray:
        """Computes per-contact normal force deficit in Newtons [N]."""
        fn = np.asarray(fn_profile, dtype=float)
        return np.maximum(0.0, self.F_n_required - fn)

    def calculate_squeeze_command(
        self,
        fn_profile: np.ndarray,
        proposed_squeeze: np.ndarray
    ) -> np.ndarray:
        """
        Computes substituted squeeze action command [mm/step].
        Enforces two-zone anti-crush architecture:
        - Zone A (F_n >= 25.0 N): Hard environment limit breach -> emergency maximum outward saturation (-2.0 mm/step)
        - Zone B (18.0 N <= F_n < 25.0 N): Protective ceiling -> active proportional retraction
        - Zone C (F_n < 18.0 N): Bounded proportional augmentation to eliminate force deficit
        """
        fn = np.asarray(fn_profile, dtype=float)
        a_prop = np.asarray(proposed_squeeze, dtype=float)
        a_sub = a_prop.copy()

        delta_fn = self.calculate_force_deficit(fn)
        # delta_x_target in mm, Kp in step^-1 -> delta_a_cmd in mm/step
        delta_a_cmd = np.clip(self.Kp * (delta_fn / self.k_elastic), -2.0, 2.0)

        for i in range(len(fn)):
            if fn[i] >= self.F_hard_limit:
                # Independent 25 N hard environment limit: immediate maximum retraction saturation
                a_sub[i] = -2.0
            elif fn[i] >= self.F_ceiling:
                # 18 N protective threshold: active proportional retraction
                retract = -self.K_retract * ((fn[i] - self.F_ceiling) / self.k_elastic)
                a_sub[i] = float(np.clip(retract, -2.0, 0.0))
            else:
                # Augment squeeze to eliminate force deficit
                a_sub[i] = float(np.clip(max(a_prop[i], delta_a_cmd[i]), -2.0, 2.0))

        return a_sub

    def calculate_regularized_slip_ratios(
        self,
        fn_profile: np.ndarray,
        ft_profile: Optional[np.ndarray] = None,
        allow_unmeasured_estimate: bool = False
    ) -> np.ndarray:
        """
        Computes regularized slip ratio rho_i = ||Ft_i|| / (mu * Fn_i)
        with singularity guard for Fn < 0.10 N (Amendment 40.8).
        
        Strict safety guarantee:
        - Rejects NaN/Inf shear measurements with rho = inf
        - If shear is unmeasured (ft_profile is None) and allow_unmeasured_estimate is False,
          returns rho = inf (cannot certify safety without empirical tactile data)
        """
        fn = np.asarray(fn_profile, dtype=float)
        n = len(fn)
        ratios = np.full(n, float("inf"), dtype=float)

        if self.mu <= 0.0:
            return ratios

        if ft_profile is None:
            if not allow_unmeasured_estimate:
                return ratios  # Strict unmeasured guard
            # Nominal planning heuristic only
            ft_mags = np.full(n, self.F_g / max(1, self.N_f))
        else:
            try:
                ft_arr = np.asarray(ft_profile, dtype=float)
                if not np.all(np.isfinite(ft_arr)):
                    return ratios  # Corrupted / NaN / Inf shear data
                if ft_arr.ndim == 2:
                    ft_mags = np.linalg.norm(ft_arr, axis=1)
                else:
                    ft_mags = np.abs(ft_arr)
                if len(ft_mags) != n:
                    return ratios
            except Exception:
                return ratios

        for i in range(n):
            if fn[i] < self.F_min_valid or not math.isfinite(fn[i]) or math.isnan(ft_mags[i]):
                ratios[i] = float("inf")
            else:
                ratios[i] = ft_mags[i] / (self.mu * fn[i])

        return ratios

    def evaluate_clamp_release(
        self,
        fn_profile: np.ndarray,
        ft_profile: Optional[np.ndarray] = None
    ) -> bool:
        """
        Evaluates E02-A clamp release condition (Amendment 40.4 & Document 41 Issue 3).
        Released iff:
        1. Tactile shear is empirically measured (ft_profile is not None)
        2. All shear and normal telemetry values are finite
        3. All contacts satisfy Fn >= Fn_req
        4. All contacts satisfy rho_i <= eta
        """
        if ft_profile is None:
            # Issue 3: Missing shear data cannot establish safety certificate
            return False

        fn = np.asarray(fn_profile, dtype=float)
        ft = np.asarray(ft_profile, dtype=float)

        if len(fn) != self.N_f or not np.all(np.isfinite(fn)):
            return False
        if len(ft) != self.N_f or not np.all(np.isfinite(ft)):
            return False

        if np.any(fn < self.F_n_required):
            return False

        ratios = self.calculate_regularized_slip_ratios(fn, ft, allow_unmeasured_estimate=False)
        if np.any(np.isinf(ratios)) or np.any(np.isnan(ratios)):
            return False

        return bool(np.all(ratios <= self.eta))

    def _safe_arrest_action(self, reason: str) -> Tuple[np.ndarray, bool, Dict[str, Any]]:
        """Emergency safe arrest for malformed inputs or catastrophic sensor faults."""
        self.v_z = 0.0
        a_sub = np.zeros(5, dtype=float)
        info = {
            "variant": "safe_arrest",
            "branch": "Branch_3_Fallback",
            "reason": reason,
            "max_slip_ratio": float("inf"),
            "total_normal_force": 0.0,
            "v_z_stateful": 0.0,
            "distortion_norm": 0.0
        }
        return a_sub, True, info

    def substitute_action(
        self,
        obs: Dict[str, Any],
        proposed_action: np.ndarray,
        variant: str = "E02_C"
    ) -> Tuple[np.ndarray, bool, Dict[str, Any]]:
        """
        Executes full action substitution adhering to Document 40 Revision 2.1 & Document 41.
        Returns: (substituted_action, intervened_flag, diagnostic_info)
        """
        # 1. Validate proposed action dimensions and finiteness (Issue 4)
        if proposed_action is None:
            return self._safe_arrest_action("none_proposed_action")

        try:
            a_prop = np.asarray(proposed_action, dtype=float).copy()
        except (ValueError, TypeError):
            return self._safe_arrest_action("unconvertible_proposed_action")

        if len(a_prop) < 5 or not np.all(np.isfinite(a_prop)):
            return self._safe_arrest_action("malformed_proposed_action_dimension_or_nonfinite")

        a_sub = a_prop.copy()

        # 2. Parse and validate normal force telemetry
        fn_profile = []
        if "normal_forces" in obs:
            fn_profile = obs["normal_forces"]
        elif "finger_normal_force" in obs:
            fn_profile = obs["finger_normal_force"]

        try:
            fn_arr = np.asarray(fn_profile, dtype=float)
        except (ValueError, TypeError):
            fn_arr = np.zeros(0)

        # 3. Parse and validate shear force telemetry (Issue 2 & 3)
        ft_arr = None
        shear_measured = False
        has_shear_corruption = False

        if "finger_shear_force" in obs and obs["finger_shear_force"] is not None:
            try:
                raw_ft = np.asarray(obs["finger_shear_force"], dtype=float)
                if raw_ft.shape[0] == self.N_f and np.all(np.isfinite(raw_ft)):
                    ft_arr = raw_ft
                    shear_measured = True
                else:
                    has_shear_corruption = True
            except (ValueError, TypeError):
                has_shear_corruption = True

        # Parse object vertical height
        try:
            z_obj = float(obs.get("obj_pos", [0.0, 0.0, 0.0])[2]) if "obj_pos" in obs else float(obs.get("lift_height", 0.0))
        except Exception:
            z_obj = float("nan")

        # 4. Sensor validity & contact-loss determination
        has_sensor_fault = (
            len(fn_arr) != self.N_f
            or not np.all(np.isfinite(fn_arr))
            or np.any(fn_arr < 0.0)
            or has_shear_corruption
            or self.mu <= 0.0
            or not math.isfinite(z_obj)
        )

        has_contact_loss = (not has_sensor_fault) and np.any(fn_arr < self.F_min_valid)

        # 5. Branch 3: Safe Fallback Execution (Issue 1 & 4)
        if has_sensor_fault or has_contact_loss:
            self.v_z = 0.0
            a_sub[4] = 0.0  # Immediate lift arrest

            if has_sensor_fault:
                # Corrupted / invalid sensors: hold all fingers stationary
                a_sub[:4] = 0.0
                reason = "sensor_fault"
            else:
                # Asymmetric contact loss: apply per-finger conditioned response (Issue 1)
                reason = "contact_loss"
                for i in range(self.N_f):
                    if fn_arr[i] >= self.F_hard_limit:
                        # 25 N hard limit: emergency maximum retraction
                        a_sub[i] = -2.0
                    elif fn_arr[i] >= self.F_ceiling:
                        # 18 N protective ceiling: active proportional retraction
                        retract = -self.K_retract * ((fn_arr[i] - self.F_ceiling) / self.k_elastic)
                        a_sub[i] = float(np.clip(retract, -2.0, 0.0))
                    elif fn_arr[i] < self.F_min_valid:
                        # Unseated finger: gentle inward search
                        a_sub[i] = 0.20
                    else:
                        # Seated stable finger: hold stationary (prevent crushing)
                        a_sub[i] = 0.0

            info = {
                "variant": variant,
                "branch": "Branch_3_Fallback",
                "reason": reason,
                "shear_measured": shear_measured,
                "max_slip_ratio": float("inf"),
                "total_normal_force": float(np.sum(fn_arr)) if not has_sensor_fault else 0.0,
                "v_z_stateful": self.v_z,
                "distortion_norm": float(np.linalg.norm(a_prop - a_sub))
            }
            return a_sub, True, info

        # 6. Contact Mechanics Extraction
        min_fn = float(np.min(fn_arr))
        total_fn = float(np.sum(fn_arr))
        max_fn = float(np.max(fn_arr))

        # Calculate slip ratios (Issue 2 & 3)
        slip_ratios = self.calculate_regularized_slip_ratios(
            fn_arr, ft_arr, allow_unmeasured_estimate=True
        )
        max_slip = float(np.max(slip_ratios))

        # Check safety state
        needs_preload = bool(min_fn < self.F_n_required)
        has_slip_risk = bool(max_slip > self.eta)
        has_crush_risk = bool(max_fn >= self.F_ceiling)
        has_hard_limit_breach = bool(max_fn >= self.F_hard_limit)
        is_unsafe = needs_preload or has_slip_risk or has_crush_risk or has_hard_limit_breach

        # -------------------------------------------------------------
        # SQUEEZE CONTROLLER EXECUTION (Issue 4)
        # -------------------------------------------------------------
        if variant in ["E02_A", "E02_C", "E02_D"]:
            a_sub[:4] = self.calculate_squeeze_command(fn_arr, a_prop[:4])
        else:
            # Baseline C2 and Variant E02-B: unaugmented squeeze
            # Enforce two-zone anti-crush override
            for i in range(len(fn_arr)):
                if fn_arr[i] >= self.F_hard_limit:
                    a_sub[i] = -2.0
                elif fn_arr[i] >= self.F_ceiling:
                    retract = -self.K_retract * ((fn_arr[i] - self.F_ceiling) / self.k_elastic)
                    a_sub[i] = float(np.clip(retract, -2.0, 0.0))

        # -------------------------------------------------------------
        # VERTICAL LIFT CONTROLLER EXECUTION (Three-Way Branching)
        # -------------------------------------------------------------
        proposed_lift = float(a_prop[4])

        if has_hard_limit_breach:
            # Hard limit breach overrides upward motion unconditionally
            self.v_z = 0.0
            if proposed_lift < 0.0:
                # Downward descent permitted with table guard
                z_safe = max(proposed_lift, -z_obj)
                a_sub[4] = float(np.clip(z_safe, -2.0, 0.0))
            else:
                a_sub[4] = 0.0
            branch_used = "Branch_Hard_Limit_Arrest"

        elif variant == "baseline_C2":
            # Original negative control: hard zero-clamp
            if is_unsafe and proposed_lift > 0.0:
                a_sub[4] = 0.0
                self.v_z = 0.0
            branch_used = "Baseline_C2"

        elif variant == "E02_A":
            # Preload boost with state-triggered clamp release (Issue 3)
            released = self.evaluate_clamp_release(fn_arr, ft_arr)
            if released:
                a_sub[4] = proposed_lift
                self.v_z = (proposed_lift * 1e-3) / self.dt
                branch_used = "E02_A_Released"
            else:
                a_sub[4] = 0.0
                self.v_z = 0.0
                branch_used = "E02_A_Clamped"

        else:  # E02-B, E02-C, E02-D: Stateful Three-Way Velocity Controller
            if proposed_lift <= 0.0:
                # Branch 2: Downward Motion with Table Collision Guard
                z_safe_descent = max(proposed_lift, -z_obj)
                a_sub[4] = float(np.clip(z_safe_descent, -2.0, 0.0))
                self.v_z = (a_sub[4] * 1e-3) / self.dt
                branch_used = "Branch_2_Downward"
            else:
                # Branch 1: Upward Motion with Stateful Friction-Aware Integrator
                # Weakest-contact friction bottleneck (Amendment 40.3)
                F_t_max = self.N_f * (self.eta * self.mu * min_fn)
                a_z_max = (F_t_max - self.F_g) / self.m  # m/s^2

                if a_z_max <= 0.0:
                    # Preload deficit: upward velocity strictly locked to 0
                    self.v_z = 0.0
                    v_z_max = 0.0
                else:
                    # Positive friction capacity: integrate acceleration
                    v_z_max = max(0.0, self.v_z + a_z_max * self.dt)

                v_prop = (proposed_lift * 1e-3) / self.dt  # m/s
                self.v_z = float(np.clip(v_prop, 0.0, v_z_max))
                # Convert to mm/step
                delta_z_safe = self.v_z * self.dt * 1e3
                a_sub[4] = float(np.clip(delta_z_safe, 0.0, 5.0))
                branch_used = "Branch_1_Upward"

        intervened = bool(np.linalg.norm(a_prop - a_sub) > 1e-4)

        info = {
            "variant": variant,
            "branch": branch_used,
            "intervened": intervened,
            "shear_measured": shear_measured,
            "max_slip_ratio": round(float(max_slip), 4),
            "min_normal_force_N": round(float(min_fn), 4),
            "total_normal_force_N": round(float(total_fn), 4),
            "v_z_stateful_mps": round(float(self.v_z), 5),
            "distortion_norm": round(float(np.linalg.norm(a_prop - a_sub)), 5)
        }
        return a_sub, intervened, info
