"""
HOROS PROBE-1 — Phase 5 Task 3 (P5-T3)
N-Contact Generalization & Cooperative Physical Intelligence
File: object_wrench_dynamics.py

Implements 2D planar rigid-body Newton-Euler dynamics, contact kinematics,
wrench integration, and equilibrium residual tracking.
"""

import math
import numpy as np
from typing import Dict, Any, Tuple, List, Optional
from contact_topology import ContactTopology, ContactPoint


class ObjectWrenchDynamics:
    """
    Simulates the 3-DOF planar motion of a rigid workpiece coupled to N contacts.
    Degrees of freedom: [x, y, theta]
    Velocities: [vx, vy, omega]
    """

    def __init__(
        self,
        topology: ContactTopology,
        dt: float = 0.001,
        linear_damping: float = 10.0,   # N*s/m environmental guidance damping
        angular_damping: float = 0.08,  # N*m*s/rad rotational damping
    ):
        self.topology = topology
        self.dt = float(dt)
        self.m = float(topology.m_obj)
        self.I = float(topology.I_obj)
        self.c_lin = float(linear_damping)
        self.c_ang = float(angular_damping)

        self.reset()

    def reset(
        self,
        init_x: float = 0.0,
        init_y: float = 0.0,
        init_theta: float = 0.0,
        init_vx: float = 0.0,
        init_vy: float = 0.0,
        init_omega: float = 0.0,
    ):
        """Resets the object state."""
        self.x = float(init_x)
        self.y = float(init_y)
        self.theta = float(init_theta)
        self.vx = float(init_vx)
        self.vy = float(init_vy)
        self.omega = float(init_omega)

        self.time = 0.0
        self.step_count = 0
        self.max_tilt_rad = abs(self.theta)
        self.max_disp_m = math.sqrt(self.x**2 + self.y**2)

    def get_contact_kinematics(self, v_ext_list: Optional[List[float]] = None) -> List[Dict[str, Any]]:
        """
        Computes the velocity of the object surface at each contact point and 
        the relative tangential slip velocity.
        """
        cos_t = math.cos(self.theta)
        sin_t = math.sin(self.theta)
        rot = np.array([[cos_t, -sin_t], [sin_t, cos_t]])
        v_obj = np.array([self.vx, self.vy])

        if v_ext_list is None:
            v_ext_list = [0.0] * self.topology.num_contacts

        kinematics = []
        for i, cp in enumerate(self.topology.contacts):
            if not cp.is_active:
                kinematics.append({
                    "contact_id": cp.contact_id,
                    "r_world": np.zeros(2),
                    "n_world": np.zeros(2),
                    "t_world": np.zeros(2),
                    "v_contact": np.zeros(2),
                    "v_rel_tangent": 0.0,
                    "is_active": False,
                })
                continue

            r_w = rot @ cp.pos_rel
            n_w = rot @ cp.normal
            t_w = rot @ cp.tangent

            # Velocity of object surface at contact: v_obj + omega x r_w
            # In 2D: [vx - omega * r_y, vy + omega * r_x]
            v_point = v_obj + self.omega * np.array([-r_w[1], r_w[0]])

            # Tangential relative velocity: project onto t_w minus external pad velocity
            v_rel_t = float(np.dot(v_point, t_w) - v_ext_list[i])

            kinematics.append({
                "contact_id": cp.contact_id,
                "r_world": r_w,
                "n_world": n_w,
                "t_world": t_w,
                "v_contact": v_point,
                "v_rel_tangent": v_rel_t,
                "is_active": True,
            })

        return kinematics

    def step(
        self,
        normal_forces: List[float],
        tangential_forces: List[float],
        f_ext: np.ndarray,      # [Fx_ext, Fy_ext]
        tau_ext: float,         # External torque
    ) -> Dict[str, Any]:
        """
        Advances the 2D planar object dynamics by 1 step (dt) under the applied contact forces
        and external disturbance wrench.
        """
        self.step_count += 1
        self.time += self.dt

        cos_t = math.cos(self.theta)
        sin_t = math.sin(self.theta)
        rot = np.array([[cos_t, -sin_t], [sin_t, cos_t]])

        total_fx = float(f_ext[0])
        total_fy = float(f_ext[1])
        total_tau = float(tau_ext)

        contact_wrenches = []

        for i, cp in enumerate(self.topology.contacts):
            if not cp.is_active:
                contact_wrenches.append(np.zeros(3))
                continue

            fn = float(normal_forces[i])
            ft = float(tangential_forces[i])

            r_w = rot @ cp.pos_rel
            n_w = rot @ cp.normal
            t_w = rot @ cp.tangent

            # Force vector from contact i applied to workpiece: normal compresses, friction opposes slip
            f_i = fn * n_w - ft * t_w
            # Torque about object center of mass: r_w x f_i = rx * fy - ry * fx
            tau_i = r_w[0] * f_i[1] - r_w[1] * f_i[0]

            total_fx += f_i[0]
            total_fy += f_i[1]
            total_tau += tau_i

            contact_wrenches.append(np.array([f_i[0], f_i[1], tau_i]))

        # Net forces with viscous damping
        net_fx = total_fx - self.c_lin * self.vx
        net_fy = total_fy - self.c_lin * self.vy
        net_tau = total_tau - self.c_ang * self.omega

        # Accelerations
        ax = net_fx / self.m
        ay = net_fy / self.m
        alpha = net_tau / self.I

        # Symplectic Euler integration
        self.vx += ax * self.dt
        self.vy += ay * self.dt
        self.omega += alpha * self.dt

        self.x += self.vx * self.dt
        self.y += self.vy * self.dt
        self.theta += self.omega * self.dt

        current_disp = math.sqrt(self.x**2 + self.y**2)
        if current_disp > self.max_disp_m:
            self.max_disp_m = current_disp
        if abs(self.theta) > self.max_tilt_rad:
            self.max_tilt_rad = abs(self.theta)

        # Equilibrium residual norm (excluding damping)
        wrench_residual_norm = math.sqrt(total_fx**2 + total_fy**2 + (total_tau / self.topology.r_obj)**2)

        return {
            "time": self.time,
            "x": self.x,
            "y": self.y,
            "theta": self.theta,
            "vx": self.vx,
            "vy": self.vy,
            "omega": self.omega,
            "ax": ax,
            "ay": ay,
            "alpha": alpha,
            "net_fx": net_fx,
            "net_fy": net_fy,
            "net_tau": net_tau,
            "wrench_residual_norm": wrench_residual_norm,
            "max_tilt_rad": self.max_tilt_rad,
            "max_disp_m": self.max_disp_m,
            "contact_wrenches": contact_wrenches,
        }
