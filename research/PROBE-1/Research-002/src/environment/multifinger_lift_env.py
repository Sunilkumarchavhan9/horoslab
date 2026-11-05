"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Task 2: Multifingered Dexterous Grasp-and-Lift Simulation Environment
Simulates 16-DoF Allegro Hand + arm lift dynamics, 6 contact strata
(Pre-grasp, Touchdown, Sticking, Dynamic Lift, Incipient Slip, Gross Slip),
Coulomb friction cone boundaries, tactile sensor array feedback, and drop events.
"""

from __future__ import annotations
import numpy as np
from typing import Dict, Any, Tuple, Optional


class MultifingerLiftEnv:
    """
    Multifingered Dexterous Grasp-and-Lift environment.
    Simulates fingertip compliance, dynamic normal preload, incipient slip,
    shear acceleration, and catastrophic object drops.
    """

    def __init__(
        self,
        dt: float = 0.02,  # 50 Hz control loop
        num_fingers: int = 4,
        object_mass: float = 0.35,  # kg
        friction_coeff: float = 0.50,
        max_crush_force: float = 25.0,  # N (Safety limit per finger)
        gravity: float = 9.81,  # m/s^2
        max_steps: int = 250,
        seed: Optional[int] = None,
    ):
        self.dt = dt
        self.num_fingers = num_fingers
        self.object_mass = object_mass
        self.friction_coeff = friction_coeff
        self.max_crush_force = max_crush_force
        self.gravity = gravity
        self.max_steps = max_steps

        self.rng = np.random.RandomState(seed)
        self.reset()

    def reset(
        self,
        object_mass: Optional[float] = None,
        friction_coeff: Optional[float] = None,
        com_offset: Optional[np.ndarray] = None,
    ) -> Dict[str, Any]:
        """Resets the environment with optional physical parameter overrides."""
        if object_mass is not None:
            self.object_mass = object_mass
        if friction_coeff is not None:
            self.friction_coeff = friction_coeff

        self.com_offset = com_offset if com_offset is not None else self.rng.uniform(-2.0, 2.0, size=3)  # mm

        # Object pose: [x, y, z] in mm (table surface is at z = 0.0)
        self.obj_pos = np.array([0.0, 0.0, 0.0], dtype=np.float64)
        self.obj_vel = np.zeros(3, dtype=np.float64)

        # 4 Fingertips initial positions relative to object center
        # Symmetrical antipodal grip at radius r = 35 mm
        self.finger_pos = np.array([
            [38.0, 0.0, 40.0],   # Finger 1 (Right)
            [-38.0, 0.0, 40.0],  # Finger 2 (Left)
            [0.0, 38.0, 40.0],   # Finger 3 (Front)
            [0.0, -38.0, 40.0],  # Finger 4 (Back)
        ], dtype=np.float64)

        self.finger_normal_force = np.zeros(self.num_fingers, dtype=np.float64)  # N
        self.finger_shear_force = np.zeros((self.num_fingers, 2), dtype=np.float64)  # N
        self.finger_slip_ratio = np.zeros(self.num_fingers, dtype=np.float64)  # ||Ft|| / (mu * Fn)

        self.contact_stratum = 0  # 0: Pre-grasp, 1: Touchdown, 2: Sticking, 3: Lift, 4: Incipient Slip, 5: Dropped
        self.step_count = 0
        self.object_lifted = False
        self.object_dropped = False
        self.crush_violated = False

        return self._get_obs()

    def step(self, action: np.ndarray) -> Tuple[Dict[str, Any], float, bool, Dict[str, Any]]:
        """
        Executes action: action = [squeeze_delta (4), arm_dz]
        squeeze_delta: inward finger position increment in mm.
        arm_dz: vertical arm velocity command in mm/step.
        """
        self.step_count += 1
        squeeze = np.clip(action[:4], -2.0, 2.0)
        arm_dz = float(np.clip(action[4] if len(action) > 4 else 0.5, -2.0, 5.0))

        # 1. Update finger radial positions (Squeezing)
        for i in range(self.num_fingers):
            r_curr = np.linalg.norm(self.finger_pos[i, :2])
            r_target = max(30.0, r_curr - squeeze[i])
            dir_unit = self.finger_pos[i, :2] / (r_curr + 1e-6)
            self.finger_pos[i, :2] = dir_unit * r_target
            self.finger_pos[i, 2] += arm_dz

        # 2. Compute Normal Contact Forces via compliant fingertip indentation
        nominal_obj_radius = 35.0  # mm
        finger_contacted = np.zeros(self.num_fingers, dtype=bool)

        for i in range(self.num_fingers):
            r_dist = float(np.linalg.norm(self.finger_pos[i, :2]))
            indentation = max(0.0, nominal_obj_radius - r_dist)  # mm

            if indentation > 0.001:
                finger_contacted[i] = True
                # Elastic normal stiffness: k = 4.0 N/mm
                self.finger_normal_force[i] = 4.0 * indentation + float(self.rng.normal(0, 0.05))
            else:
                self.finger_normal_force[i] = 0.0

        # Safety Check: Crush Force
        if np.any(self.finger_normal_force > self.max_crush_force):
            self.crush_violated = True

        total_normal_force = float(np.sum(self.finger_normal_force))

        # 3. Contact Mode Classification
        if total_normal_force < 0.1:
            self.contact_stratum = 0  # Pre-grasp free space
        elif not self.object_lifted and self.obj_pos[2] <= 0.1:
            if total_normal_force < 4.0:
                self.contact_stratum = 1  # Touchdown
            else:
                self.contact_stratum = 2  # Stable Sticking Grasp

        # 4. Tangential Shear & Slip Dynamics under Arm Lift
        if self.contact_stratum >= 2 or self.object_lifted:
            # Gravity load on object: Fg = m * g
            fg_load = self.object_mass * self.gravity  # N
            # Maximum friction available across all fingers: F_friction_max = mu * sum(Fn)
            max_grip_friction = self.friction_coeff * total_normal_force

            # Vertical shear required to lift or support object
            required_shear_per_finger = fg_load / max(1, self.num_fingers)

            for i in range(self.num_fingers):
                self.finger_shear_force[i, 1] = required_shear_per_finger
                mu_fn = self.friction_coeff * max(0.01, self.finger_normal_force[i])
                ratio = required_shear_per_finger / (mu_fn + 1e-6)
                self.finger_slip_ratio[i] = ratio

            max_slip_ratio = float(np.max(self.finger_slip_ratio))

            if max_grip_friction > fg_load * 1.15:
                # Stable Lift condition
                self.obj_pos[2] = max(0.0, self.obj_pos[2] + arm_dz)
                self.obj_vel[2] = arm_dz / self.dt
                if self.obj_pos[2] > 5.0:
                    self.object_lifted = True
                    self.contact_stratum = 3  # Dynamic Lift

                if max_slip_ratio > 0.80 and max_slip_ratio <= 1.0:
                    self.contact_stratum = 4  # Incipient Slip
            elif max_grip_friction <= fg_load:
                # Slip occurs! Object cannot be supported
                if self.object_lifted:
                    # Dropping under gravity
                    self.obj_vel[2] -= self.gravity * self.dt * 1e3  # mm/s^2
                    self.obj_pos[2] = max(0.0, self.obj_pos[2] + self.obj_vel[2] * self.dt)
                    self.contact_stratum = 5  # Gross Slip / Dropped
                    if self.obj_pos[2] <= 0.0:
                        self.object_dropped = True
                else:
                    self.contact_stratum = 4  # Incipient Slip (Cannot break ground contact)

        done = (
            self.step_count >= self.max_steps
            or self.object_dropped
            or self.crush_violated
            or (self.obj_pos[2] >= 100.0)
        )

        # Reward formulation
        lift_height = float(self.obj_pos[2])
        slip_penalty = float(np.sum(np.maximum(0.0, self.finger_slip_ratio - 0.75)))
        reward = 3.0 * lift_height - 5.0 * slip_penalty

        if lift_height >= 100.0:
            reward += 150.0
        elif self.object_dropped or self.crush_violated:
            reward -= 100.0

        obs = self._get_obs()
        info = {
            "stratum": self.contact_stratum,
            "stratum_name": ["PreGrasp", "Touchdown", "Sticking", "DynamicLift", "IncipientSlip", "Dropped"][self.contact_stratum],
            "total_fn": total_normal_force,
            "max_slip_ratio": float(np.max(self.finger_slip_ratio)),
            "lift_height": lift_height,
            "object_lifted": self.object_lifted,
            "object_dropped": self.object_dropped,
            "crush_violated": self.crush_violated,
        }

        return obs, float(reward), bool(done), info

    def _get_obs(self) -> Dict[str, Any]:
        """Returns multi-modal observation state."""
        return {
            "finger_pos": self.finger_pos.copy(),
            "finger_fn": self.finger_normal_force.copy(),
            "finger_ft": self.finger_shear_force.copy(),
            "slip_ratio": self.finger_slip_ratio.copy(),
            "obj_pos": self.obj_pos.copy(),
            "obj_vel": self.obj_vel.copy(),
            "stratum": self.contact_stratum,
            "step": self.step_count,
            "mass": self.object_mass,
            "friction": self.friction_coeff,
        }

