"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.6: Contact-Aware Safety Coordination
Module: Contact-Aware Action Substitutor (Workstream B)

Implements Document 40 Revision 2.1 specification:
1. Normal preload substitution via bounded proportional displacement controller
2. Stateful three-way vertical velocity and displacement integrator
3. Multi-finger weakest-contact friction cone bottleneck
4. Active anti-crush proportional outward retraction
5. Singularity-guarded clamp release and contact-loss safe fallback
"""

import math
from typing import Dict, Any, Tuple, Optional
import numpy as np


class ContactAwareActionSubstitutor:
    def __init__(
        self,
        object_mass: float = 0.50,          # kg
        gravity: float = 9.81,              # m/s^2
        num_fingers: int = 4,
        friction_coeff: float = 0.60,
        elastic_stiffness: float = 4.0,     # N/mm
        dynamic_safety_margin: float = 1.25,# gamma
        friction_margin_eta: float = 0.85,  # eta
        dt: float = 0.01,                   # s (100 Hz)
        max_crush_force: float = 18.0,      # N (Protective ceiling)
        hard_environment_limit: float = 25.0,# N
        contact_loss_threshold: float = 0.10,# N
        kp_squeeze: float = 1.0,            # step^-1
        k_retract: float = 1.5              # step^-1
    ):
        self.m = float(object_mass)
        self.g = float(gravity)
        self.F_g = self.m * self.g          # N (4.905 N)
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
        if self.mu > 0 and self.N_f > 0:
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
        Computes substituted squeeze action command [mm/step] using
        bounded proportional displacement controller and active anti-crush retraction.
        """
        fn = np.asarray(fn_profile, dtype=float)
        a_prop = np.asarray(proposed_squeeze, dtype=float)
        a_sub = a_prop.copy()

        delta_fn = self.calculate_force_deficit(fn)
        # delta_x_target in mm, Kp in step^-1 -> delta_a_cmd in mm/step
        delta_a_cmd = np.clip(self.Kp * (delta_fn / self.k_elastic), -2.0, 2.0)

        for i in range(len(fn)):
            if fn[i] >= self.F_ceiling:
                # Active outward proportional retraction (Amendment 40.7)
                retract = -self.K_retract * ((fn[i] - self.F_ceiling) / self.k_elastic)
                a_sub[i] = float(np.clip(retract, -2.0, 0.0))
            else:
                # Augment squeeze to eliminate force deficit
                a_sub[i] = float(np.clip(max(a_prop[i], delta_a_cmd[i]), -2.0, 2.0))

        return a_sub

    def calculate_regularized_slip_ratios(
        self,
        fn_profile: np.ndarray,
        ft_profile: Optional[np.ndarray] = None
    ) -> np.ndarray:
        """
        Computes regularized slip ratio rho_i = ||Ft_i|| / (mu * Fn_i)
        with singularity guard for Fn < 0.10 N (Amendment 40.8).
        """
        fn = np.asarray(fn_profile, dtype=float)
        n = len(fn)
        ratios = np.zeros(n, dtype=float)

        # If ft_profile not provided, assume static gravity distribution Ft_i = F_g / N_f
        if ft_profile is None:
            ft_mags = np.full(n, self.F_g / max(1, self.N_f))
        else:
            ft_arr = np.asarray(ft_profile, dtype=float)
            if ft_arr.ndim == 2:
                ft_mags = np.linalg.norm(ft_arr, axis=1)
            else:
                ft_mags = np.abs(ft_arr)

        for i in range(n):
            if fn[i] < self.F_min_valid or self.mu <= 0.0 or math.isnan(fn[i]) or math.isinf(fn[i]):
                ratios[i] = float("inf")  # Singularity cutoff
            else:
                ratios[i] = ft_mags[i] / (self.mu * fn[i])

        return ratios

    def evaluate_clamp_release(
        self,
        fn_profile: np.ndarray,
        ft_profile: Optional[np.ndarray] = None
    ) -> bool:
        """
        Evaluates E02-A clamp release condition (Amendment 40.4 & 40.8).
        Released iff all contacts satisfy Fn >= Fn_req AND rho_i <= eta.
        """
        fn = np.asarray(fn_profile, dtype=float)
        if len(fn) == 0 or np.any(np.isnan(fn)) or np.any(np.isinf(fn)):
            return False

        if np.any(fn < self.F_n_required):
            return False

        ratios = self.calculate_regularized_slip_ratios(fn, ft_profile)
        if np.any(np.isinf(ratios)) or np.any(np.isnan(ratios)):
            return False

        return bool(np.all(ratios <= self.eta))

    def substitute_action(
        self,
        obs: Dict[str, Any],
        proposed_action: np.ndarray,
        variant: str = "E02_C"
    ) -> Tuple[np.ndarray, bool, Dict[str, Any]]:
        """
        Executes full action substitution adhering to Document 40 Revision 2.1.
        Returns: (substituted_action, intervened_flag, diagnostic_info)
        """
        a_prop = np.asarray(proposed_action, dtype=float).copy()
        a_sub = a_prop.copy()

        # Parse observation
        fn_profile = []
        if "normal_forces" in obs:
            fn_profile = [float(x) for x in obs["normal_forces"]]
        elif "finger_normal_force" in obs:
            fn_profile = [float(x) for x in obs["finger_normal_force"]]

        fn_arr = np.array(fn_profile, dtype=float) if fn_profile else np.zeros(self.N_f)
        z_obj = float(obs.get("obj_pos", [0.0, 0.0, 0.0])[2]) if "obj_pos" in obs else float(obs.get("lift_height", 0.0))

        ft_arr = None
        if "finger_shear_force" in obs:
            ft_arr = np.asarray(obs["finger_shear_force"], dtype=float)

        # Sensor validity & Contact-loss check (Branch 3)
        has_sensor_fault = (
            len(fn_arr) < self.N_f
            or np.any(np.isnan(fn_arr))
            or np.any(np.isinf(fn_arr))
            or np.any(fn_arr < 0.0)
            or self.mu <= 0.0
            or math.isnan(z_obj)
            or math.isinf(z_obj)
        )

        has_contact_loss = (not has_sensor_fault) and np.any(fn_arr < self.F_min_valid)

        if has_sensor_fault or has_contact_loss:
            # Branch 3: Safe Fallback (Amendment 40.6 & 40.8)
            # Immediate lift arrest, stateful velocity reset, gentle inward search
            self.v_z = 0.0
            a_sub[4] = 0.0
            a_sub[:4] = 0.20  # Gentle search
            info = {
                "variant": variant,
                "branch": "Branch_3_Fallback",
                "reason": "sensor_fault" if has_sensor_fault else "contact_loss",
                "max_slip_ratio": float("inf"),
                "total_normal_force": float(np.sum(fn_arr)) if not has_sensor_fault else 0.0,
                "v_z_stateful": self.v_z,
                "distortion_norm": float(np.linalg.norm(a_prop - a_sub))
            }
            return a_sub, True, info

        # Extract contact mechanics
        min_fn = float(np.min(fn_arr))
        total_fn = float(np.sum(fn_arr))
        max_fn = float(np.max(fn_arr))
        slip_ratios = self.calculate_regularized_slip_ratios(fn_arr, ft_arr)
        max_slip = float(np.max(slip_ratios))

        # Check if intervention is needed
        needs_preload = bool(min_fn < self.F_n_required)
        has_slip_risk = bool(max_slip > self.eta)
        has_crush_risk = bool(max_fn >= self.F_ceiling)
        is_unsafe = needs_preload or has_slip_risk or has_crush_risk

        # -------------------------------------------------------------
        # SQUEEZE CONTROLLER EXECUTION
        # -------------------------------------------------------------
        if variant in ["E02_A", "E02_C", "E02_D"]:
            a_sub[:4] = self.calculate_squeeze_command(fn_arr, a_prop[:4])
        else:
            # Baseline C2 and Variant E02-B: unaugmented squeeze
            # Enforce hard anti-crush override only
            for i in range(len(fn_arr)):
                if fn_arr[i] >= self.F_ceiling:
                    retract = -self.K_retract * ((fn_arr[i] - self.F_ceiling) / self.k_elastic)
                    a_sub[i] = float(np.clip(retract, -2.0, 0.0))

        # -------------------------------------------------------------
        # VERTICAL LIFT CONTROLLER EXECUTION (Three-Way Branching)
        # -------------------------------------------------------------
        proposed_lift = float(a_prop[4])

        if variant == "baseline_C2":
            # Original negative control: hard zero-clamp
            if is_unsafe and proposed_lift > 0:
                a_sub[4] = 0.0
                self.v_z = 0.0
            branch_used = "Baseline_C2"

        elif variant == "E02_A":
            # Preload boost with state-triggered clamp release
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
                    # Stale velocity safeguard: reset v_z to 0
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
            "max_slip_ratio": round(float(max_slip), 4),
            "min_normal_force_N": round(float(min_fn), 4),
            "total_normal_force_N": round(float(total_fn), 4),
            "v_z_stateful_mps": round(float(self.v_z), 5),
            "distortion_norm": round(float(np.linalg.norm(a_prop - a_sub)), 5)
        }
        return a_sub, intervened, info
