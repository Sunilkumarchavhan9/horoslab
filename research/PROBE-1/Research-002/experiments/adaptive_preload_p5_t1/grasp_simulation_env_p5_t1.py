"""
HOROS PROBE-1 — Phase 5 Task 1 (P5-T1)
Closed-Loop Grasping Simulation Environment with Controlled Probing & Adaptive Preloading
File: grasp_simulation_env_p5_t1.py

Integrates:
- Phase 1 (0 to 50 ms): Non-destructive Controlled Tactile Probe at gentle normal force 3.0 N.
- Phase 2: Actuator preload ramp to planner's recommended F_n,0 (at 50 N/s).
- Phase 3: Task disturbance execution under downstream HOROS Hybrid closed-loop control.
- Certified Contact Physics v2.1.3.11 hybrid equations (step_hybrid_synchronized).
- Metric tracking: Grasp success, probe-induced slip check, mechanical work, impulse, damage proxy.
"""

import math
import os
import sys
import numpy as np
from typing import Dict, Any, Tuple, Optional, List

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
from probe_design import ControlledTactileProbe


class ClosedLoopGraspEnvP5T1:
    """
    Simulation environment executing Phase 1 Probing, Phase 2 Preload Ramp, and Phase 3 Task Loading.
    """

    def __init__(
        self,
        mu_static: float = 0.60,
        mu_kinetic: float = 0.50,
        fingertip_radius: float = 0.015,
        dt: float = 0.001,
        noise_force_std: float = 0.02,
        noise_disp_std: float = 0.5e-6,
        seed: int = 42,
    ):
        self.mu_s = mu_static
        self.mu_k = mu_kinetic
        self.radius = fingertip_radius
        self.dt = dt
        self.noise_force_std = noise_force_std
        self.noise_disp_std = noise_disp_std
        self.seed = seed
        self.rng = np.random.RandomState(seed)

        self.pair = create_silicone_aluminum_pair(mu_static=self.mu_s, mu_kinetic=self.mu_k)
        self.geom = SphericalContact(radius=self.radius)
        self.cm = CattaneoMindlinModel(self.geom, self.pair)
        self.lugre = LuGreModel(self.pair)
        self.E_star = self.pair.equivalent_youngs_modulus
        self.G_star = self.pair.equivalent_shear_modulus

        self.probe = ControlledTactileProbe(probe_duration_steps=50, probe_disp_max=4.0e-6, dt=self.dt)
        self.reset()

    def reset(
        self,
        disturbance_type: str = "shear_ramp",
        v_shear: float = 0.0025,
    ) -> Dict[str, Any]:
        """Resets the environment at gentle initial touch load (3.0 N)."""
        self.step_count = 0
        self.time = 0.0
        self.disturbance_type = disturbance_type
        self.v_shear = v_shear

        self.current_fn = 3.0  # Gentle touch load during probe
        self.current_ft = 0.0
        self.current_disp = 0.0
        self.slip_vel = 0.0

        a_0 = (3.0 * self.current_fn * self.geom.radius / (4.0 * self.E_star)) ** (1.0 / 3.0)
        self.contact_radius = a_0
        self.stick_radius = a_0
        self.stick_ratio = 1.0
        self.current_delta_n = (a_0 ** 2) / self.geom.radius
        self.prev_delta_n = self.current_delta_n

        self.cm_state = ContactState(in_contact=True, normal_force=self.current_fn, contact_radius=a_0)
        self.lugre_state = ContactState(in_contact=True, normal_force=self.current_fn, contact_radius=a_0)

        # Telemetry
        self.is_gross_slipping = False
        self.gross_slip_step = -1
        self.gross_slip_time = -1.0
        self.slip_arrest_step = -1
        self.recovery_success = False
        self.probe_induced_slip = False
        self.dist_step_count = 0

        self.impulse_spent = 0.0
        self.peak_fn = self.current_fn
        self.mechanical_work_act = 0.0
        self.tangential_work = 0.0
        self.damage_proxy_integral = 0.0

        return self._get_observation()

    def step_physical(self, cmd_fn: float, v_shear_cmd: float) -> Tuple[Dict[str, Any], bool, Dict[str, Any]]:
        """Advances physics kernel by one step with commanded normal force and shear velocity."""
        self.step_count += 1
        self.time += self.dt

        self.current_fn = float(cmd_fn)
        self.impulse_spent += self.current_fn * self.dt
        if self.current_fn > self.peak_fn:
            self.peak_fn = self.current_fn

        if self.current_fn > 15.0:
            self.damage_proxy_integral += ((self.current_fn - 15.0) ** 2) * self.dt

        self.contact_radius = (3.0 * self.current_fn * self.geom.radius / (4.0 * self.E_star)) ** (1.0 / 3.0)
        self.current_delta_n = (self.contact_radius ** 2) / self.geom.radius

        delta_n_dot = (self.current_delta_n - self.prev_delta_n) / self.dt
        if delta_n_dot > 0:
            self.mechanical_work_act += self.current_fn * delta_n_dot * self.dt
        self.prev_delta_n = self.current_delta_n

        self.cm_state.normal_force = self.current_fn
        self.cm_state.contact_radius = self.contact_radius
        self.lugre_state.normal_force = self.current_fn
        self.lugre_state.contact_radius = self.contact_radius

        # Step synchronized hybrid kernel
        Ft_total, v_applied = self.lugre.step_hybrid_synchronized(
            cm_model=self.cm,
            cm_state=self.cm_state,
            state=self.lugre_state,
            v_cmd=v_shear_cmd,
            dt=self.dt,
            geometry=self.geom,
            enforce_passivity_envelope=True,
        )

        self.current_ft = Ft_total
        self.current_disp = self.cm_state.tangential_displacement
        self.stick_ratio = self.cm_state.stick_ratio
        self.stick_radius = self.cm_state.stick_radius
        self.slip_vel = self.lugre_state.applied_slip_velocity
        self.tangential_work += abs(self.current_ft) * abs(v_applied) * self.dt

        was_gross = self.is_gross_slipping
        is_gross = bool(self.cm_state.is_gross_slipping or self.lugre_state.is_gross_slipping)
        self.is_gross_slipping = is_gross

        if is_gross and not was_gross:
            self.gross_slip_step = self.step_count
            self.gross_slip_time = self.time

        if was_gross and not is_gross:
            self.slip_arrest_step = self.step_count
            self.recovery_success = True

        obs = self._get_observation()
        info = {
            "is_gross_slipping": self.is_gross_slipping,
            "gross_slip_step": self.gross_slip_step,
            "gross_slip_time": self.gross_slip_time,
            "recovery_success": self.recovery_success,
            "stick_ratio": self.stick_ratio,
            "peak_fn": self.peak_fn,
            "impulse_spent": self.impulse_spent,
            "mechanical_work_act": self.mechanical_work_act,
            "tangential_work": self.tangential_work,
            "damage_proxy_integral": self.damage_proxy_integral,
            "peak_force_violation": max(0.0, self.peak_fn - 20.0),
            "grasp_success": (not self.is_gross_slipping) and (self.step_count > 100),
        }
        return obs, False, info

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
            "slip_velocity": self.slip_vel,
            "clean_force_t": clean_ft,
            "clean_force_n": clean_fn,
            "clean_disp": clean_disp,
        }

    def execute_probe(self, probe: Optional[ControlledTactileProbe] = None) -> List[Dict[str, Any]]:
        """
        Executes Phase 1: 50 ms non-destructive controlled micro-probe at 3.0 N.
        Returns observable telemetry trajectory.
        """
        if probe is None:
            probe = self.probe
        probe_history = []
        for s in range(probe.duration_steps):
            v_cmd = probe.get_probe_velocity_command(s)
            obs, _, info = self.step_physical(cmd_fn=3.0, v_shear_cmd=v_cmd)
            probe_history.append(obs)
            if info["is_gross_slipping"]:
                self.probe_induced_slip = True
        return probe_history

    def execute_preload_ramp(self, target_fn: float, max_rate: float = 50.0) -> None:
        """
        Executes Phase 2: Ramps normal force from current to target_fn at max_rate (50 N/s).
        Tangential shear velocity is zero during this transition.
        """
        target = float(np.clip(target_fn, 3.0, 25.0))
        delta = target - self.current_fn
        if abs(delta) < 1e-4:
            return
        steps = int(math.ceil(abs(delta) / (max_rate * self.dt)))
        step_delta = delta / steps
        for _ in range(steps):
            new_fn = self.current_fn + step_delta
            self.step_physical(cmd_fn=new_fn, v_shear_cmd=0.0)

    def step_disturbance(self, cmd_fn: float) -> Tuple[Dict[str, Any], bool, Dict[str, Any]]:
        """
        Executes one step of Phase 3 task disturbance under closed-loop control.
        """
        self.dist_step_count += 1
        t_dist = self.dist_step_count * self.dt

        # Disturbance velocity profile
        if self.disturbance_type == "shear_ramp":
            v_cmd = self.v_shear if t_dist <= 0.40 else 0.0
        elif self.disturbance_type == "fast_ramp":
            v_cmd = self.v_shear if t_dist <= 0.25 else 0.0
        elif self.disturbance_type == "micro_probe":
            if t_dist <= 0.30:
                v_cmd = self.v_shear
            else:
                v_cmd = 0.001 * math.cos(2.0 * math.pi * 10.0 * (t_dist - 0.30))
        elif self.disturbance_type == "tangential_shock":
            if 0.15 <= t_dist <= 0.35:
                v_cmd = self.v_shear * 2.5
            elif t_dist < 0.15:
                v_cmd = self.v_shear * 0.5
            else:
                v_cmd = 0.0
        elif self.disturbance_type == "normal_perturbation":
            v_cmd = self.v_shear if t_dist <= 0.40 else 0.0
            if 0.20 <= t_dist <= 0.30:
                cmd_fn = max(3.0, cmd_fn - 2.0)
        else:
            v_cmd = self.v_shear

        obs, _, info = self.step_physical(cmd_fn=cmd_fn, v_shear_cmd=v_cmd)
        done = (self.dist_step_count >= 500)
        info["probe_induced_slip"] = self.probe_induced_slip
        info["grasp_success"] = (not self.is_gross_slipping) and (not self.probe_induced_slip)
        return obs, done, info
