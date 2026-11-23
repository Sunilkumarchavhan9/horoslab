"""
HOROS PROBE-1 — Phase 4 Task 4B (P4-T4B)
Closed-Loop Grasping Simulation Environment with Energy & Damage Proxies
File: grasp_simulation_env_p4_t4b.py

Simulates single-contact compliant grasping under dynamic closed-loop normal force modulation
using the certified Contact Physics v2.1.3.11 hybrid equations (Cattaneo-Mindlin + LuGre).

Features:
- Dynamic normal force modulation by grasping controllers: F_n(t+1) = controller(obs_t)
- Dynamic Hertzian contact radius: a(t) = (3 * F_n * R / (4 * E*))^(1/3)
- Physical stick-annulus progression: c(t) = a(t) * (1 - |F_t| / (mu_s * F_n))^(1/3)
- Disturbance regimes:
  1. 'shear_ramp': Monotonic shear ramp (simulating heavy object lift)
  2. 'fast_ramp': High-velocity shear ramp (8.0 mm/s)
  3. 'micro_probe': High-frequency cyclic oscillation (10 Hz)
  4. 'tangential_shock': Sudden external force step pulse
  5. 'normal_perturbation': Shear ramp combined with normal force drop disturbance
- Comprehensive physical metrics:
  - Grasp success, gross slip onset, slip arrest / recovery success, recovery time (ms)
  - Normal-force impulse (N*s)
  - Actuator mechanical work proxy (Joules): W_act = W_norm + W_tang
  - Workpiece damage proxy: Peak force penalty and High-force integral D_proxy = int(max(0, Fn - 15)^2 dt)
  - Step latency and controller state tracking
"""

import math
import os
import sys
import numpy as np
from typing import Dict, Any, Tuple, Optional

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
RESEARCH_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))
CP_V2_DIR = os.path.abspath(os.path.join(RESEARCH_DIR, "experiments", "contact_physics_v2"))

for p in (CURRENT_DIR, RESEARCH_DIR, CP_V2_DIR):
    if p not in sys.path:
        sys.path.insert(0, p)

from contact.geometry import SphericalContact
from contact.material import create_silicone_aluminum_pair, FrictionPair
from contact.contact_state import ContactState
from contact.cattaneo_mindlin import CattaneoMindlinModel
from contact.lugre import LuGreModel


class ClosedLoopGraspEnvP4T4B:
    """
    Closed-loop compliant grasping environment with rigorous metric instrumentation.
    """

    def __init__(
        self,
        mu_static: float = 0.60,
        mu_kinetic: float = 0.50,
        fingertip_radius: float = 0.015,  # 15 mm elastomeric fingertip
        fn_initial: float = 5.0,           # Initial grasp force
        dt: float = 0.001,                 # 1 ms control cycle (1000 Hz)
        max_duration_s: float = 2.0,       # 2000 steps
        noise_force_std: float = 0.02,     # 0.02 N (Regime A)
        noise_disp_std: float = 0.5e-6,    # 0.5 um
        seed: int = 42,
    ):
        self.mu_s = mu_static
        self.mu_k = mu_kinetic
        self.radius = fingertip_radius
        self.fn_initial = fn_initial
        self.dt = dt
        self.max_steps = int(max_duration_s / dt)
        self.noise_force_std = noise_force_std
        self.noise_disp_std = noise_disp_std
        self.seed = seed
        self.rng = np.random.RandomState(seed)

        # Contact models
        self.pair = create_silicone_aluminum_pair(mu_static=self.mu_s, mu_kinetic=self.mu_k)
        self.geom = SphericalContact(radius=self.radius)
        self.cm = CattaneoMindlinModel(self.geom, self.pair)
        self.lugre = LuGreModel(self.pair)
        self.E_star = self.pair.equivalent_youngs_modulus
        self.G_star = self.pair.equivalent_shear_modulus

        self.reset()

    def reset(
        self,
        disturbance_type: str = "shear_ramp",
        v_shear: float = 0.0025,
        fn_override: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Resets the contact episode for a closed-loop run."""
        self.step_count = 0
        self.time = 0.0
        self.disturbance_type = disturbance_type
        self.v_shear = v_shear

        if fn_override is not None:
            self.fn_initial = float(fn_override)

        self.current_fn = float(self.fn_initial)
        self.current_ft = 0.0
        self.current_disp = 0.0
        self.slip_vel = 0.0

        # Hertzian normal indentation delta_n = a^2 / R
        a_0 = (3.0 * self.current_fn * self.geom.radius / (4.0 * self.E_star)) ** (1.0 / 3.0)
        self.contact_radius = a_0
        self.stick_radius = a_0
        self.stick_ratio = 1.0
        self.current_delta_n = (a_0 ** 2) / self.geom.radius
        self.prev_delta_n = self.current_delta_n

        self.cm_state = ContactState(in_contact=True, normal_force=self.current_fn, contact_radius=a_0)
        self.lugre_state = ContactState(in_contact=True, normal_force=self.current_fn, contact_radius=a_0)

        # Episode telemetry tracking
        self.is_gross_slipping = False
        self.gross_slip_step = -1
        self.gross_slip_time = -1.0
        self.slip_arrest_step = -1
        self.slip_arrest_time = -1.0
        self.recovery_success = False

        self.impulse_spent = 0.0
        self.peak_fn = self.current_fn
        self.mechanical_work_act = 0.0
        self.tangential_work = 0.0
        self.damage_proxy_integral = 0.0

        return self._get_observation()

    def step(self, cmd_fn: float) -> Tuple[Dict[str, Any], bool, Dict[str, Any]]:
        """
        Executes one millisecond simulation step with commanded normal force.
        """
        self.step_count += 1
        self.time += self.dt

        # Dynamic normal force update
        self.current_fn = float(cmd_fn)
        self.impulse_spent += self.current_fn * self.dt
        if self.current_fn > self.peak_fn:
            self.peak_fn = self.current_fn

        # Damage proxy calculation: penalize forces > 15 N (quadratic stress index)
        if self.current_fn > 15.0:
            self.damage_proxy_integral += ((self.current_fn - 15.0) ** 2) * self.dt

        # Update Hertzian geometry
        self.contact_radius = (3.0 * self.current_fn * self.geom.radius / (4.0 * self.E_star)) ** (1.0 / 3.0)
        self.current_delta_n = (self.contact_radius ** 2) / self.geom.radius

        # Normal actuator mechanical work: W_norm = int(F_n * max(0, d(delta_n)))
        delta_n_dot = (self.current_delta_n - self.prev_delta_n) / self.dt
        if delta_n_dot > 0:
            self.mechanical_work_act += self.current_fn * delta_n_dot * self.dt
        self.prev_delta_n = self.current_delta_n

        self.cm_state.normal_force = self.current_fn
        self.cm_state.contact_radius = self.contact_radius
        self.lugre_state.normal_force = self.current_fn
        self.lugre_state.contact_radius = self.contact_radius

        # Disturbance velocity profile
        if self.disturbance_type == "shear_ramp":
            v_cmd = self.v_shear if self.time <= 0.40 else 0.0
        elif self.disturbance_type == "fast_ramp":
            v_cmd = self.v_shear if self.time <= 0.25 else 0.0
        elif self.disturbance_type == "micro_probe":
            if self.time <= 0.30:
                v_cmd = self.v_shear
            else:
                v_cmd = 0.001 * math.cos(2.0 * math.pi * 10.0 * (self.time - 0.30))
        elif self.disturbance_type == "tangential_shock":
            if 0.15 <= self.time <= 0.35:
                v_cmd = self.v_shear * 2.5
            elif self.time < 0.15:
                v_cmd = self.v_shear * 0.5
            else:
                v_cmd = 0.0
        elif self.disturbance_type == "normal_perturbation":
            v_cmd = self.v_shear if self.time <= 0.40 else 0.0
            # External unloading dip between t=0.20 and t=0.30
            if 0.20 <= self.time <= 0.30:
                self.current_fn = max(3.0, self.current_fn - 2.0)
                self.cm_state.normal_force = self.current_fn
                self.lugre_state.normal_force = self.current_fn
        else:
            v_cmd = self.v_shear

        # Certified hybrid synchronized kernel execution
        Ft_total, v_applied = self.lugre.step_hybrid_synchronized(
            cm_model=self.cm,
            cm_state=self.cm_state,
            state=self.lugre_state,
            v_cmd=v_cmd,
            dt=self.dt,
            geometry=self.geom,
            enforce_passivity_envelope=True,
        )

        self.current_ft = Ft_total
        self.current_disp = self.cm_state.tangential_displacement
        self.stick_ratio = self.cm_state.stick_ratio
        self.stick_radius = self.cm_state.stick_radius
        self.slip_vel = self.lugre_state.applied_slip_velocity

        # Tangential frictional work: W_tang = int(|Ft| * |v_applied| * dt)
        self.tangential_work += abs(self.current_ft) * abs(v_applied) * self.dt

        was_gross = self.is_gross_slipping
        is_gross = bool(self.cm_state.is_gross_slipping or self.lugre_state.is_gross_slipping)
        self.is_gross_slipping = is_gross

        if is_gross and not was_gross:
            self.gross_slip_step = self.step_count
            self.gross_slip_time = self.time

        if was_gross and not is_gross:
            # Slip arrested!
            self.slip_arrest_step = self.step_count
            self.slip_arrest_time = self.time
            self.recovery_success = True

        done = self.step_count >= self.max_steps
        # Dropped grasp termination: gross slip sustained for > 150 ms
        if self.is_gross_slipping and self.gross_slip_step >= 0:
            if (self.step_count - self.gross_slip_step) > 150:
                done = True

        obs = self._get_observation()
        recovery_time_ms = (
            (self.slip_arrest_time - self.gross_slip_time) * 1000.0
            if (self.recovery_success and self.gross_slip_time >= 0)
            else 0.0
        )

        info = {
            "is_gross_slipping": self.is_gross_slipping,
            "gross_slip_step": self.gross_slip_step,
            "gross_slip_time": self.gross_slip_time,
            "recovery_success": self.recovery_success,
            "recovery_time_ms": recovery_time_ms,
            "stick_ratio": self.stick_ratio,
            "peak_fn": self.peak_fn,
            "impulse_spent": self.impulse_spent,
            "mechanical_work_act": self.mechanical_work_act,
            "tangential_work": self.tangential_work,
            "damage_proxy_integral": self.damage_proxy_integral,
            "peak_force_violation": max(0.0, self.peak_fn - 20.0),
            "grasp_success": (not self.is_gross_slipping) and (self.step_count > 100),
        }
        return obs, done, info

    def _get_observation(self) -> Dict[str, Any]:
        """Synthesizes observable telemetry with noise."""
        clean_ft = self.current_ft
        clean_fn = self.current_fn
        clean_disp = self.current_disp

        noisy_ft = clean_ft + self.rng.normal(0.0, self.noise_force_std)
        noisy_fn = clean_fn + self.rng.normal(0.0, self.noise_force_std)
        noisy_disp = clean_disp + self.rng.normal(0.0, self.noise_disp_std)

        return {
            "time": self.time,
            "force_t": noisy_ft,
            "force_n": noisy_fn,
            "disp": noisy_disp,
            "v_cmd": self.v_shear,
            "slip_velocity": self.slip_vel,
            "clean_force_t": clean_ft,
            "clean_force_n": clean_fn,
            "clean_disp": clean_disp,
        }
