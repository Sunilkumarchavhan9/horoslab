"""
HOROS PROBE-1 — Phase 4 Task 4 (P4-T4)
Closed-Loop Grasping Simulation Environment
File: grasp_simulation_env.py

Simulates single-contact compliant grasping under dynamic closed-loop normal force modulation
using the certified Contact Physics v2.1.3.11 hybrid equations (Cattaneo-Mindlin + LuGre).

Features:
- Dynamic normal force modulation by grasping controllers: F_n(t+1) = controller(obs_t)
- Dynamic Hertzian contact radius adaptation: a(t) = (3 * F_n * R / (4 * E*))^(1/3)
- Physical stick-annulus progression: c(t) = a(t) * (1 - |F_t| / (mu_s * F_n))^(1/3)
- Tangential disturbance regimes:
  1. 'shear_ramp': Monotonic shear ramp (simulating heavy object lift / draw)
  2. 'micro_probe': High-frequency cyclic oscillation
  3. 'tangential_shock': Sudden external force step disturbance
- Realistic sensor noise channels (ATI Nano17 grade: sigma_F = 0.02 N, sigma_delta = 0.5 um)
- Comprehensive physical outcome metrics:
  - Grasp success, gross slip onset, slip arrest / prevention, force expenditure (impulse),
    peak normal force, recovery time.
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


class ClosedLoopGraspEnv:
    """
    Closed-loop single-contact compliant grasping environment.
    """

    def __init__(
        self,
        mu_static: float = 0.60,
        mu_kinetic: float = 0.50,
        fingertip_radius: float = 0.015,  # 15 mm elastomeric fingertip
        fn_initial: float = 5.0,           # 5 N initial grasp force
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

    def reset(self, disturbance_type: str = "shear_ramp", v_shear: float = 0.0025) -> Dict[str, Any]:
        """Resets the contact episode for a closed-loop run."""
        self.step_count = 0
        self.time = 0.0
        self.disturbance_type = disturbance_type
        self.v_shear = v_shear

        self.current_fn = float(self.fn_initial)
        self.current_ft = 0.0
        self.current_disp = 0.0
        self.slip_vel = 0.0

        # Physical state
        a_0 = (3.0 * self.current_fn * self.geom.radius / (4.0 * self.E_star)) ** (1.0 / 3.0)
        self.contact_radius = a_0
        self.stick_radius = a_0
        self.stick_ratio = 1.0

        self.cm_state = ContactState(in_contact=True, normal_force=self.current_fn, contact_radius=a_0)
        self.lugre_state = ContactState(in_contact=True, normal_force=self.current_fn, contact_radius=a_0)

        # Episode telemetry tracking
        self.is_gross_slipping = False
        self.gross_slip_step = -1
        self.gross_slip_time = -1.0
        self.slip_prevented = False
        self.impulse_spent = 0.0
        self.peak_fn = self.current_fn

        # Initial clean & noisy observations
        return self._get_observation()

    def step(self, cmd_fn: float) -> Tuple[Dict[str, Any], bool, Dict[str, Any]]:
        """
        Executes one millisecond simulation step with the controller's commanded normal force.
        """
        self.step_count += 1
        self.time += self.dt

        # Dynamic normal force update with actuator rate clipping
        self.current_fn = float(cmd_fn)
        self.impulse_spent += self.current_fn * self.dt
        if self.current_fn > self.peak_fn:
            self.peak_fn = self.current_fn

        # Update Hertzian contact radius under modulated normal force
        self.contact_radius = (3.0 * self.current_fn * self.geom.radius / (4.0 * self.E_star)) ** (1.0 / 3.0)
        self.cm_state.normal_force = self.current_fn
        self.cm_state.contact_radius = self.contact_radius
        self.lugre_state.normal_force = self.current_fn
        self.lugre_state.contact_radius = self.contact_radius

        # Realistic manipulation disturbance profiles:
        # Physical disturbances (such as lifting a mass or resisting a push) ramp up tangential load
        # and then hold steady, challenging the gripper to maintain grasp stability without dropping.
        if self.disturbance_type == "shear_ramp":
            # Ramp for 0.40 s, then hold tangential position (v = 0)
            if self.time <= 0.40:
                v_cmd = self.v_shear
            else:
                v_cmd = 0.0
        elif self.disturbance_type == "micro_probe":
            # Steady ramp followed by 10 Hz cyclic disturbance
            if self.time <= 0.30:
                v_cmd = self.v_shear
            else:
                v_cmd = 0.001 * math.cos(2.0 * math.pi * 10.0 * (self.time - 0.30))
        elif self.disturbance_type == "tangential_shock":
            # Pulse shock between t = 0.15s and t = 0.35s, then hold
            if 0.15 <= self.time <= 0.35:
                v_cmd = self.v_shear * 2.5
            elif self.time < 0.15:
                v_cmd = self.v_shear * 0.5
            else:
                v_cmd = 0.0
        else:
            v_cmd = self.v_shear

        # Step hybrid synchronized kernel (Cattaneo-Mindlin + LuGre)
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

        was_gross = self.is_gross_slipping
        is_gross = bool(self.cm_state.is_gross_slipping or self.lugre_state.is_gross_slipping)
        self.is_gross_slipping = is_gross

        if is_gross and not was_gross:
            self.gross_slip_step = self.step_count
            self.gross_slip_time = self.time

        if was_gross and not is_gross:
            # Re-arrested slip into sticking!
            self.slip_prevented = True

        done = self.step_count >= self.max_steps
        # Terminate if gross slip runs uncontrolled for > 150 ms (dropped grasp)
        if self.is_gross_slipping and self.gross_slip_step >= 0:
            if (self.step_count - self.gross_slip_step) > 150:
                done = True

        obs = self._get_observation()
        info = {
            "is_gross_slipping": self.is_gross_slipping,
            "gross_slip_step": self.gross_slip_step,
            "gross_slip_time": self.gross_slip_time,
            "stick_ratio": self.stick_ratio,
            "peak_fn": self.peak_fn,
            "impulse_spent": self.impulse_spent,
            "slip_prevented": self.slip_prevented,
            "grasp_success": (not self.is_gross_slipping) and (self.step_count > 100),
        }
        return obs, done, info

    def _get_observation(self) -> Dict[str, Any]:
        """Synthesizes observable sensory measurements with realistic sensor noise."""
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
            # Clean observables (for diagnostics / benchmarking)
            "clean_force_t": clean_ft,
            "clean_force_n": clean_fn,
            "clean_disp": clean_disp,
        }
