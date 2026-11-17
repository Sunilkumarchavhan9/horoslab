"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Task 1: Precision Peg-in-Hole Contact Simulation Environment

Simulation Fidelity Specification:
Implements a task-level contact mechanics simulation with analytical contact dynamics:
- Operational space impedance control setpoint kinematics (position and orientation increments).
- Five discrete contact strata (Free, Impact, Chamfer Sliding, Wedging, Seated).
- Coulomb friction mechanics, clearance tolerances (0.1–4.0 mm), and contact wrench reactions.
Note on Scope: This environment models task-level contact and wedging dynamics analytically;
it does not simulate full 7-DoF Franka Panda rigid multi-body dynamics or joint-level motor torque equations.
"""

from __future__ import annotations
import numpy as np
from typing import Dict, Any, Tuple, Optional


class PegInHoleEnv:
    """
    Precision Peg-in-Hole task-level contact mechanics simulation environment.
    Simulates analytical contact dynamics, chamfer sliding, wedging, jamming, and force telemetry.
    """

    def __init__(
        self,
        dt: float = 0.02,  # 50 Hz control loop
        peg_radius: float = 15.0,  # mm
        peg_length: float = 80.0,  # mm
        hole_depth: float = 60.0,  # mm
        clearance: float = 0.50,  # mm
        friction_coeff: float = 0.50,
        contact_stiffness: float = 5000.0,  # N/m
        contact_damping: float = 100.0,  # N/(m/s)
        max_force_threshold: float = 40.0,  # N (Safety limit)
        max_torque_threshold: float = 8.0,  # N*m (Safety limit)
        max_steps: int = 200,
        seed: Optional[int] = None,
    ):
        self.dt = dt
        self.peg_radius = peg_radius
        self.peg_length = peg_length
        self.hole_depth = hole_depth
        self.clearance = clearance
        self.hole_radius = peg_radius + clearance
        self.friction_coeff = friction_coeff
        self.contact_stiffness = contact_stiffness
        self.contact_damping = contact_damping
        self.max_force_threshold = max_force_threshold
        self.max_torque_threshold = max_torque_threshold
        self.max_steps = max_steps

        self.rng = np.random.RandomState(seed)
        self.reset()

    def reset(
        self,
        friction_coeff: Optional[float] = None,
        clearance: Optional[float] = None,
        init_pos_offset: Optional[np.ndarray] = None,
        init_rot_offset: Optional[np.ndarray] = None,
    ) -> Dict[str, Any]:
        """Resets the environment with optional physical parameter overrides."""
        if friction_coeff is not None:
            self.friction_coeff = friction_coeff
        if clearance is not None:
            self.clearance = clearance
            self.hole_radius = self.peg_radius + clearance

        # Hole frame origin is at (0, 0, 0), top rim at z = 0.
        # Peg nominal starting pose above hole: z = 15.0 mm
        pos_offset = init_pos_offset if init_pos_offset is not None else self.rng.uniform(-2.0, 2.0, size=2)
        z_init = 15.0 + float(self.rng.uniform(-1.0, 1.0))
        self.peg_pos = np.array([pos_offset[0], pos_offset[1], z_init], dtype=np.float64)  # in mm
        self.peg_vel = np.zeros(3, dtype=np.float64)  # mm/s

        rot_offset = init_rot_offset if init_rot_offset is not None else self.rng.uniform(-1.0, 1.0, size=3)
        self.peg_rot = np.array(rot_offset, dtype=np.float64)  # deg (Euler angles roll, pitch, yaw)
        self.peg_omega = np.zeros(3, dtype=np.float64)  # deg/s

        self.contact_wrench = np.zeros(6, dtype=np.float64)  # [Fx, Fy, Fz, Tx, Ty, Tz] in N, N*m
        self.contact_stratum = 0  # 0: Free, 1: Impact, 2: Sliding, 3: Wedging, 4: Seated
        self.step_count = 0
        self.jammed = False
        self.seated = False
        self.safety_violated = False

        return self._get_obs()

    def step(self, action: np.ndarray) -> Tuple[Dict[str, Any], float, bool, Dict[str, Any]]:
        """
        Executes action: action = [dx, dy, dz, droll, dpitch, dyaw] in mm and deg per step.
        Clamped to max command bounds.
        """
        self.step_count += 1
        action = np.clip(action, [-5.0, -5.0, -5.0, -2.0, -2.0, -2.0], [5.0, 5.0, 5.0, 2.0, 2.0, 2.0])

        delta_pos = action[:3]
        delta_rot = action[3:6]

        # Desired impedance command
        target_pos = self.peg_pos + delta_pos
        target_rot = self.peg_rot + delta_rot

        # Rigid body contact solver (Chamfer, Wall contact, Wedging)
        self._simulate_contact_dynamics(target_pos, target_rot)

        # Check contact mode & termination
        force_norm = float(np.linalg.norm(self.contact_wrench[:3]))
        torque_norm = float(np.linalg.norm(self.contact_wrench[3:6]))

        if force_norm > self.max_force_threshold or torque_norm > self.max_torque_threshold:
            self.safety_violated = True

        # Jamming condition: high lateral force preventing downward movement
        lateral_force = float(np.linalg.norm(self.contact_wrench[:2]))
        if self.contact_stratum == 3 and lateral_force > 15.0 and abs(self.peg_vel[2]) < 0.5:
            self.jammed = True

        # Seating condition: peg inserted past 50 mm with low lateral wrench
        if -self.peg_pos[2] >= 50.0 and lateral_force < 10.0:
            self.seated = True

        done = self.step_count >= self.max_steps or self.seated or self.safety_violated or self.jammed

        # Reward formulation: distance progress penalized by lateral wrench and wedging
        insertion_depth = max(0.0, -self.peg_pos[2])
        radial_error = float(np.linalg.norm(self.peg_pos[:2]))
        reward = 2.0 * insertion_depth - 0.5 * radial_error - 0.1 * force_norm

        if self.seated:
            reward += 100.0
        elif self.safety_violated or self.jammed:
            reward -= 50.0

        obs = self._get_obs()
        info = {
            "stratum": self.contact_stratum,
            "stratum_name": ["Free", "Impact", "Sliding", "Wedging", "Seated"][self.contact_stratum],
            "force_norm": force_norm,
            "torque_norm": torque_norm,
            "insertion_depth": insertion_depth,
            "radial_error": radial_error,
            "jammed": self.jammed,
            "seated": self.seated,
            "safety_violated": self.safety_violated,
        }

        return obs, float(reward), bool(done), info

    def _simulate_contact_dynamics(self, target_pos: np.ndarray, target_rot: np.ndarray):
        """Physics engine computing compliant contact response, friction, and wedging."""
        previous_pos = self.peg_pos.copy()
        # Unconstrained candidate motion
        candidate_pos = target_pos
        candidate_rot = target_rot

        z = candidate_pos[2]
        r_peg = float(np.linalg.norm(candidate_pos[:2]))
        penetration_depth = max(0.0, r_peg - self.clearance)

        # 1. Free Space regime (z > 0)
        if z > 0.0:
            accepted_pos = candidate_pos.copy()
            self.peg_vel = (accepted_pos - previous_pos) / self.dt
            self.peg_pos = accepted_pos
            self.peg_rot = candidate_rot
            self.contact_wrench = np.zeros(6, dtype=np.float64)
            self.contact_stratum = 0
            return

        # 2. Contact zone (z <= 0)
        # Inside the hole fixture
        insertion = -z  # positive downward depth
        radial_vec = candidate_pos[:2]
        radial_dist = float(np.linalg.norm(radial_vec))

        if radial_dist > self.clearance:
            # Peg body or tip is penetrating the hole wall
            radial_dir = radial_vec / (radial_dist + 1e-6)
            penetration = radial_dist - self.clearance  # in mm
            penetration_m = penetration * 1e-3

            # Normal reaction force along radial direction
            Fn = self.contact_stiffness * penetration_m + self.contact_damping * (self.peg_vel[0]*radial_dir[0] + self.peg_vel[1]*radial_dir[1]) * 1e-3
            Fn = max(0.0, Fn)

            # Friction opposes vertical and tangential motion
            vel_z = candidate_pos[2] - previous_pos[2]
            Ft_z = -np.sign(vel_z + 1e-6) * min(self.friction_coeff * Fn, abs(vel_z) * 10.0)
            Ft_lateral = -radial_dir * min(self.friction_coeff * Fn, Fn * 0.5)

            # Tilting creates two-point contact wedging if tilt angle exceeds clearance ratio
            tilt_angle = float(np.linalg.norm(candidate_rot[:2]))  # deg
            critical_wedge_angle = np.degrees(np.arctan2(2.0 * self.clearance, self.peg_length))

            if tilt_angle > critical_wedge_angle and insertion > 5.0:
                # Wedging regime: normal forces multiply drastically due to two opposite contact points
                wedging_multiplier = 1.0 + 3.0 * (tilt_angle / (critical_wedge_angle + 1e-6))
                Fn *= wedging_multiplier
                self.contact_stratum = 3  # Wedging
            elif insertion < 2.0:
                self.contact_stratum = 1  # Chamfer impact
            else:
                self.contact_stratum = 2  # Sliding

            # Wrench assembly
            self.contact_wrench[0] = -Fn * radial_dir[0] + Ft_lateral[0]
            self.contact_wrench[1] = -Fn * radial_dir[1] + Ft_lateral[1]
            self.contact_wrench[2] = Ft_z
            self.contact_wrench[3] = Fn * radial_dir[1] * (self.peg_length * 0.5e-3)
            self.contact_wrench[4] = -Fn * radial_dir[0] * (self.peg_length * 0.5e-3)
            self.contact_wrench[5] = 0.05 * Fn

            # Constrain position update by compliance
            constrained_pos = candidate_pos.copy()
            constrained_pos[:2] = (self.clearance + (penetration * 0.1)) * radial_dir
            if self.contact_stratum == 3:  # Wedged
                constrained_pos[2] = previous_pos[2] + 0.1 * (candidate_pos[2] - previous_pos[2])
            else:
                constrained_pos[2] = candidate_pos[2] + 0.5 * (self.dt * Ft_z / 10.0)

            accepted_pos = constrained_pos.copy()
            self.peg_vel = (accepted_pos - previous_pos) / self.dt
            self.peg_pos = accepted_pos
            self.peg_rot = candidate_rot
        else:
            # Clear inside hole
            accepted_pos = candidate_pos.copy()
            self.peg_vel = (accepted_pos - previous_pos) / self.dt
            self.peg_pos = accepted_pos
            self.peg_rot = candidate_rot
            # Pure viscous sliding friction
            self.contact_wrench = np.array([0.0, 0.0, -0.5 * self.friction_coeff, 0.0, 0.0, 0.0], dtype=np.float64)
            if insertion >= 50.0:
                self.contact_stratum = 4  # Seated
            else:
                self.contact_stratum = 2  # Sliding

    def _get_obs(self) -> Dict[str, Any]:
        """Returns standard multi-modal observation state."""
        return {
            "pos": self.peg_pos.copy(),
            "vel": self.peg_vel.copy(),
            "rot": self.peg_rot.copy(),
            "wrench": self.contact_wrench.copy(),
            "stratum": self.contact_stratum,
            "step": self.step_count,
            "friction": self.friction_coeff,
            "clearance": self.clearance,
        }

