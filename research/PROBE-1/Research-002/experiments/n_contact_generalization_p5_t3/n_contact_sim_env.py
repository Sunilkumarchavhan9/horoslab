"""
HOROS PROBE-1 — Phase 5 Task 3 (P5-T3)
N-Contact Generalization & Cooperative Physical Intelligence
File: n_contact_sim_env.py

Implements an isolated, physically rigorous N-contact grasping simulation environment:
- Arbitrary N-contact planar topologies (N = 3, 4, 5+).
- Coupled 2D planar object Newton-Euler wrench dynamics.
- Composition of certified Contact Physics v2.1.3.11 Cattaneo-Mindlin and LuGre kernels.
- Contact formation, contact loss, and contact recovery.
- Actuator rate limits (|dFn/dt| <= 50 N/s) and safety clamping [3.0, 25.0] N.
- External disturbance regimes: shear ramps, fast ramps (8 mm/s), 10 Hz micro-probes, tangential shocks, torque pulses.
- Strictly causal observable telemetry with calibrated sensor noise (sigma_F = 20 mN, sigma_disp = 0.5 um, sigma_tilt = 1 mrad).
"""

import os
import sys
import math
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

from contact_topology import ContactTopology, ContactPoint
from object_wrench_dynamics import ObjectWrenchDynamics


class NContactGraspEnvP5T3:
    """
    Simulates coupled N-contact grasping on a shared rigid workpiece.
    """

    def __init__(
        self,
        topology: ContactTopology,
        dt: float = 0.001,                  # 1000 Hz physics loop
        noise_force_std: float = 0.02,      # 20 mN force sensor noise
        noise_disp_std: float = 0.5e-6,     # 0.5 um displacement sensor noise
        noise_tilt_std: float = 0.001,      # 1 mrad tilt sensor noise
        noise_pos_std: float = 0.0001,      # 0.1 mm position sensor noise
        seed: int = 4710001,
    ):
        self.topology = topology
        self.num_contacts = topology.num_contacts
        self.dt = float(dt)
        self.noise_force_std = float(noise_force_std)
        self.noise_disp_std = float(noise_disp_std)
        self.noise_tilt_std = float(noise_tilt_std)
        self.noise_pos_std = float(noise_pos_std)
        self.seed = int(seed)
        self.rng = np.random.RandomState(seed)

        self.dynamics = ObjectWrenchDynamics(topology=self.topology, dt=self.dt)

        # Build independent contact kernels for each contact
        self.geoms = []
        self.pairs = []
        self.cm_models = []
        self.lugre_models = []
        self.cm_states = []
        self.lugre_states = []
        self.E_stars = []
        self.G_stars = []

        for cp in self.topology.contacts:
            geom = SphericalContact(radius=cp.fingertip_radius)
            pair = create_silicone_aluminum_pair(mu_static=cp.mu_static, mu_kinetic=cp.mu_kinetic)
            cm = CattaneoMindlinModel(geom, pair)
            lugre = LuGreModel(pair)

            self.geoms.append(geom)
            self.pairs.append(pair)
            self.cm_models.append(cm)
            self.lugre_models.append(lugre)
            self.E_stars.append(pair.equivalent_youngs_modulus)
            self.G_stars.append(pair.equivalent_shear_modulus)

            # Initialize states
            c_state = ContactState(in_contact=True, normal_force=5.0, contact_radius=0.003)
            l_state = ContactState(in_contact=True, normal_force=5.0, contact_radius=0.003)
            self.cm_states.append(c_state)
            self.lugre_states.append(l_state)

        self.reset()

    def reset(
        self,
        disturbance_type: str = "shear_ramp",
        v_shear: float = 0.0025,
        load_offset_y: float = 0.0,
        initial_preloads: Optional[List[float]] = None,
        contact_loss_events: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Resets the N-contact environment to initial state."""
        self.step_count = 0
        self.time = 0.0
        self.disturbance_type = disturbance_type
        self.v_shear = float(v_shear)
        self.load_offset_y = float(load_offset_y)
        self.contact_loss_events = contact_loss_events or []

        # Reset object dynamics
        self.dynamics.reset()

        # Reset forces and contact geometries
        self.fn = []
        self.ft = []
        self.contact_radii = []
        self.delta_n = []
        self.prev_delta_n = []
        self.stick_ratios = []

        if initial_preloads is None:
            initial_preloads = [5.0] * self.num_contacts

        for i, cp in enumerate(self.topology.contacts):
            cp.is_active = True
            init_fn = float(np.clip(initial_preloads[i], 3.0, 25.0))
            self.fn.append(init_fn)
            self.ft.append(0.0)

            a0 = (3.0 * init_fn * self.geoms[i].radius / (4.0 * self.E_stars[i])) ** (1.0 / 3.0)
            self.contact_radii.append(a0)
            del_n = (a0 ** 2) / self.geoms[i].radius
            self.delta_n.append(del_n)
            self.prev_delta_n.append(del_n)
            self.stick_ratios.append(1.0)

            self.cm_states[i] = ContactState(in_contact=True, normal_force=init_fn, contact_radius=a0)
            self.lugre_states[i] = ContactState(in_contact=True, normal_force=init_fn, contact_radius=a0)

        # Telemetry tracking
        self.is_gross_slipping = False
        self.gross_slip_step = -1
        self.any_contact_lost = False
        self.contact_loss_count = 0
        self.contact_recovery_count = 0

        self.impulse_total = 0.0
        self.per_contact_impulse = [0.0] * self.num_contacts
        self.peak_fn_per_contact = list(self.fn)
        self.mechanical_work_act = 0.0
        self.tangential_work = 0.0
        self.damage_proxy_integral = 0.0

        return self._get_observation()

    def step(self, cmd_fn_list: List[float]) -> Tuple[Dict[str, Any], bool, Dict[str, Any]]:
        """
        Advances the coupled N-contact system by 1 ms (dt):
        1. Rate-limits normal force actuators (|dFn/dt| <= 50 N/s).
        2. Applies contact loss and recovery events.
        3. Updates contact patches and Hertzian indentation work.
        4. Computes relative contact kinematics.
        5. Steps certified Cattaneo-Mindlin and LuGre kernels for each active contact.
        6. Integrates coupled object Newton-Euler planar dynamics.
        7. Returns noisy causal observations and step metrics.
        """
        self.step_count += 1
        self.time += self.dt

        # Check contact loss and recovery events
        for event in self.contact_loss_events:
            c_id = event["contact_id"]
            t_loss = event.get("t_loss", 0.150)
            t_recov = event.get("t_recov", None)

            # Contact loss
            if self.time >= t_loss and (t_recov is None or self.time < t_recov):
                if self.topology.contacts[c_id].is_active:
                    self.topology.contacts[c_id].is_active = False
                    self.any_contact_lost = True
                    self.contact_loss_count += 1

            # Contact recovery
            if t_recov is not None and self.time >= t_recov:
                if not self.topology.contacts[c_id].is_active:
                    self.topology.contacts[c_id].is_active = True
                    self.contact_recovery_count += 1

        # Actuator rate limiting (50 N/s = 0.05 N/step)
        max_rate_delta = 50.0 * self.dt
        for i in range(self.num_contacts):
            cp = self.topology.contacts[i]
            if not cp.is_active:
                # Retracted finger
                self.fn[i] = 0.0
                self.ft[i] = 0.0
                continue

            target_cmd = float(np.clip(cmd_fn_list[i], 3.0, 25.0))
            delta = float(np.clip(target_cmd - self.fn[i], -max_rate_delta, max_rate_delta))
            self.fn[i] = float(np.clip(self.fn[i] + delta, 3.0, 25.0))

            # Impulse tracking
            self.per_contact_impulse[i] += self.fn[i] * self.dt
            self.impulse_total += self.fn[i] * self.dt

            if self.fn[i] > self.peak_fn_per_contact[i]:
                self.peak_fn_per_contact[i] = self.fn[i]

            # Damage proxy tracking (penalize normal force > 15 N)
            d_pen = max(0.0, self.fn[i] - 15.0) ** 2
            self.damage_proxy_integral += d_pen * self.dt

            # Contact geometry and indentation work
            a_i = (3.0 * self.fn[i] * self.geoms[i].radius / (4.0 * self.E_stars[i])) ** (1.0 / 3.0)
            self.contact_radii[i] = a_i
            self.delta_n[i] = (a_i ** 2) / self.geoms[i].radius

            # Mechanical actuator work
            d_delta = (self.delta_n[i] - self.prev_delta_n[i]) / self.dt
            if d_delta > 0:
                self.mechanical_work_act += self.fn[i] * d_delta * self.dt
            self.prev_delta_n[i] = self.delta_n[i]

            self.cm_states[i].normal_force = self.fn[i]
            self.cm_states[i].contact_radius = a_i
            self.lugre_states[i].normal_force = self.fn[i]
            self.lugre_states[i].contact_radius = a_i

        # External disturbance wrench
        f_ext, tau_ext, v_dist_list = self._compute_external_disturbance()

        # Contact kinematics
        kinematics = self.dynamics.get_contact_kinematics(v_ext_list=v_dist_list)

        # Step certified contact kernels for all active contacts
        slip_flags = []
        for i in range(self.num_contacts):
            cp = self.topology.contacts[i]
            if not cp.is_active:
                self.ft[i] = 0.0
                self.stick_ratios[i] = 0.0
                slip_flags.append(False)
                continue

            v_rel = kinematics[i]["v_rel_tangent"]

            ft_i, v_app = self.lugre_models[i].step_hybrid_synchronized(
                cm_model=self.cm_models[i],
                cm_state=self.cm_states[i],
                state=self.lugre_states[i],
                v_cmd=v_rel,
                dt=self.dt,
                geometry=self.geoms[i],
                enforce_passivity_envelope=True,
            )

            self.ft[i] = float(ft_i)
            self.stick_ratios[i] = float(self.cm_states[i].stick_ratio)
            self.tangential_work += abs(ft_i * v_app) * self.dt

            is_gross_i = bool(self.cm_states[i].is_gross_slipping or self.lugre_states[i].is_gross_slipping)
            slip_flags.append(is_gross_i)

        # Step coupled object wrench dynamics
        dyn_info = self.dynamics.step(
            normal_forces=self.fn,
            tangential_forces=self.ft,
            f_ext=f_ext,
            tau_ext=tau_ext,
        )

        # Failure conditions: all active contacts slipping simultaneously or object drop (> 25 mm translation or > 20 deg tilt)
        active_indices = [i for i, cp in enumerate(self.topology.contacts) if cp.is_active]
        active_slips = sum(1 for i in active_indices if slip_flags[i])
        # Object-level gross slip occurs when all active contacts lose stick or object drops
        all_contacts_slip = (active_slips == len(active_indices)) and (len(active_indices) > 0)
        object_dropped = (dyn_info["max_disp_m"] > 0.025) or (dyn_info["max_tilt_rad"] > 0.35)

        if (all_contacts_slip or object_dropped) and not self.is_gross_slipping:
            self.is_gross_slipping = True
            self.gross_slip_step = self.step_count

        done = bool(self.step_count >= 500 or self.is_gross_slipping)
        grasp_success = bool((not self.is_gross_slipping) and (not object_dropped) and (self.step_count >= 500))

        obs = self._get_observation()
        info = {
            "grasp_success": grasp_success,
            "is_gross_slipping": self.is_gross_slipping,
            "gross_slip_step": self.gross_slip_step,
            "active_contacts_count": len(active_indices),
            "per_contact_slip": slip_flags,
            "stick_ratios": list(self.stick_ratios),
            "fn_list": list(self.fn),
            "ft_list": list(self.ft),
            "total_fn": float(sum(self.fn)),
            "peak_fn_max": float(max(self.peak_fn_per_contact)),
            "impulse_total": self.impulse_total,
            "mechanical_work_act": self.mechanical_work_act,
            "tangential_work": self.tangential_work,
            "damage_proxy": self.damage_proxy_integral,
            "object_pos": [dyn_info["x"], dyn_info["y"]],
            "object_tilt_rad": dyn_info["theta"],
            "max_tilt_rad": dyn_info["max_tilt_rad"],
            "max_disp_m": dyn_info["max_disp_m"],
            "wrench_residual_norm": dyn_info["wrench_residual_norm"],
            "any_contact_lost": self.any_contact_lost,
        }

        return obs, done, info

    def _get_observation(self) -> Dict[str, Any]:
        """
        Emits strictly causal observable telemetry with calibrated physical sensor noise:
          - Per-contact: force_n, force_t, displacement, slip_velocity, is_active.
          - Object-level: object_tilt, object_pos, total_force_n.
        Zero oracle state leakage.
        """
        contacts_obs = []
        for i, cp in enumerate(self.topology.contacts):
            if not cp.is_active:
                contacts_obs.append({
                    "contact_id": i,
                    "force_n": 0.0,
                    "force_t": 0.0,
                    "disp": 0.0,
                    "slip_velocity": 0.0,
                    "is_active": False,
                })
                continue

            fn_noisy = float(np.clip(self.fn[i] + self.rng.normal(0.0, self.noise_force_std), 0.0, 30.0))
            ft_noisy = float(self.ft[i] + self.rng.normal(0.0, self.noise_force_std))
            disp_noisy = float(max(0.0, self.delta_n[i] + self.rng.normal(0.0, self.noise_disp_std)))
            v_slip = self.lugre_states[i].slip_velocity
            v_noisy = float(v_slip + self.rng.normal(0.0, 1e-4))

            contacts_obs.append({
                "contact_id": i,
                "force_n": fn_noisy,
                "force_t": ft_noisy,
                "disp": disp_noisy,
                "slip_velocity": v_noisy,
                "is_active": True,
            })

        tilt_noisy = float(self.dynamics.theta + self.rng.normal(0.0, self.noise_tilt_std))
        pos_noisy = [
            float(self.dynamics.x + self.rng.normal(0.0, self.noise_pos_std)),
            float(self.dynamics.y + self.rng.normal(0.0, self.noise_pos_std)),
        ]
        total_fn_noisy = float(sum(c["force_n"] for c in contacts_obs))

        return {
            "time": self.time,
            "step": self.step_count,
            "num_contacts": self.num_contacts,
            "contacts": contacts_obs,
            "object_tilt": tilt_noisy,
            "object_pos": pos_noisy,
            "total_force_n": total_fn_noisy,
        }

    def _compute_external_disturbance(self) -> Tuple[np.ndarray, float, List[float]]:
        """Calculates external load force, moment, and velocity profile projected onto contact tangents."""
        t = self.time
        v = self.v_shear

        f_ext = np.zeros(2)
        tau_ext = 0.0
        v_cmd = 0.0

        if self.disturbance_type == "shear_ramp":
            f_ext[1] = -self.dynamics.m * 9.81 * 0.5  # Downward shear load
            tau_ext = f_ext[1] * self.load_offset_y
            v_cmd = v if t <= 0.40 else 0.0

        elif self.disturbance_type == "fast_ramp":
            f_ext[1] = -self.dynamics.m * 9.81 * 0.8
            tau_ext = f_ext[1] * self.load_offset_y
            v_cmd = 0.008 if t <= 0.25 else 0.0  # 8 mm/s fast shear ramp

        elif self.disturbance_type == "micro_probe":
            f_ext[1] = -self.dynamics.m * 9.81 * 0.5
            tau_ext = f_ext[1] * self.load_offset_y
            if t <= 0.30:
                v_cmd = v
            else:
                v_cmd = 0.001 * math.cos(2.0 * math.pi * 10.0 * (t - 0.30))  # 10 Hz oscillation

        elif self.disturbance_type == "tangential_shock":
            f_ext[1] = -self.dynamics.m * 9.81 * 1.0
            tau_ext = f_ext[1] * self.load_offset_y
            if 0.15 <= t <= 0.35:
                v_cmd = v * 2.5
            elif t < 0.15:
                v_cmd = v * 0.5
            else:
                v_cmd = 0.0

        elif self.disturbance_type == "torque_perturbation":
            f_ext[1] = -self.dynamics.m * 9.81 * 0.5
            # Rotational torque pulse between 150 ms and 300 ms
            tau_pulse = 0.08 if 0.15 <= t <= 0.30 else 0.0
            tau_ext = f_ext[1] * self.load_offset_y + tau_pulse
            v_cmd = v if t <= 0.40 else 0.0

        # Project translational shear velocity vector [0, v_cmd] onto each contact tangent
        v_vec = np.array([0.0, v_cmd])
        kin = self.dynamics.get_contact_kinematics()
        v_dist_list = [float(np.dot(v_vec, k["t_world"])) if k["is_active"] else 0.0 for k in kin]

        return f_ext, tau_ext, v_dist_list
