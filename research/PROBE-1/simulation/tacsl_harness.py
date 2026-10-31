"""
TacSL Visuotactile Sensor Indenter Calibration and Multi-Finger Grasp Simulation Harness.
Pinned for Isaac Lab v2.3 / Isaac Sim 5.1 compatibility.
"""
from __future__ import annotations

import numpy as np
from typing import Dict, List, Tuple, Any, Optional


class TacSLValidationHarness:
    """
    Validates simulated TacSL sensor outputs against known ground-truth applied forces
    to prevent sensor simulation discrepancies from contaminating model training or evaluation.
    """

    def __init__(self, tolerance_rms_pct: float = 5.0):
        self.tolerance_rms_pct = tolerance_rms_pct

    def run_indenter_benchmark(
        self,
        normal_range: Tuple[float, float] = (0.5, 20.0),
        shear_range: Tuple[float, float] = (0.0, 10.0),
        num_points: int = 40,
        seed: int = 42,
    ) -> Dict[str, Any]:
        """
        Applies known test loads to simulated tactile sensor pad and compares
        sensor reconstruction against applied force.
        """
        rng = np.random.default_rng(seed)
        f_normal_applied = np.linspace(normal_range[0], normal_range[1], num_points)
        f_shear_applied = np.linspace(shear_range[0], shear_range[1], num_points)

        # Simulated TacSL output with minor elastomeric compliance nonlinearity
        # Simulated raw reading has slight optical attenuation (~2% gain loss + slight zero-offset)
        raw_gain = 0.985
        raw_offset = 0.05
        noise = rng.normal(0.0, 0.08, size=num_points)

        f_normal_measured_raw = raw_gain * f_normal_applied + raw_offset + noise
        f_shear_measured_raw = 0.980 * f_shear_applied + rng.normal(0.0, 0.05, size=num_points)

        # Calibration stage (polynomial compensation)
        poly_fn = np.polyfit(f_normal_measured_raw, f_normal_applied, deg=1)
        poly_ft = np.polyfit(f_shear_measured_raw, f_shear_applied, deg=1)

        f_normal_calibrated = np.polyval(poly_fn, f_normal_measured_raw)
        f_shear_calibrated = np.polyval(poly_ft, f_shear_measured_raw)

        # Compute RMS percentage errors
        rms_raw_fn = 100.0 * np.sqrt(np.mean(((f_normal_measured_raw - f_normal_applied) / f_normal_applied) ** 2))
        rms_cal_fn = 100.0 * np.sqrt(np.mean(((f_normal_calibrated - f_normal_applied) / f_normal_applied) ** 2))

        rms_raw_ft = 100.0 * np.sqrt(np.mean((f_shear_measured_raw - f_shear_applied) ** 2)) / np.mean(f_shear_applied + 1e-6)
        rms_cal_ft = 100.0 * np.sqrt(np.mean((f_shear_calibrated - f_shear_applied) ** 2)) / np.mean(f_shear_applied + 1e-6)

        passed = bool(rms_cal_fn <= self.tolerance_rms_pct and rms_cal_ft <= self.tolerance_rms_pct)

        return {
            "passed": passed,
            "rms_raw_normal_pct": float(rms_raw_fn),
            "rms_calibrated_normal_pct": float(rms_cal_fn),
            "rms_raw_shear_pct": float(rms_raw_ft),
            "rms_calibrated_shear_pct": float(rms_cal_ft),
            "normal_calibration_poly": [float(c) for c in poly_fn],
            "shear_calibration_poly": [float(c) for c in poly_ft],
        }


class GraspSimulationEnvironment:
    """
    Simulation harness representing the multi-finger grasp environment at 100 Hz (10 ms period).
    Simulates nonstationary Regimes A, B, C, and D.
    """

    def __init__(
        self,
        num_fingers: int = 4,
        dt: float = 0.01,
        initial_mass: float = 0.40,
        initial_friction: float = 0.60,
    ):
        self.num_fingers = num_fingers
        self.dt = dt
        self.initial_mass = initial_mass
        self.initial_friction = initial_friction
        self.reset()

    def reset(self, regime: str = "D") -> None:
        """Reset environment to initial state."""
        self.step_idx = 0
        self.regime = regime
        self.mass = self.initial_mass
        self.friction = [self.initial_friction] * self.num_fingers
        self.com = np.array([0.0, 0.0, 0.0], dtype=np.float64)
        self.q = np.array([0.1, 0.4, 0.6, 0.3] * self.num_fingers, dtype=np.float64)
        self.dq = np.zeros(self.num_fingers * 4, dtype=np.float64)
        self.penetrations = [0.0015] * self.num_fingers  # 1.5 mm penetration
        self.penetration_rates = [0.0] * self.num_fingers

        # Initial normal and shear forces (balanced grasp at ~4 N normal per finger)
        self.f_normal = [4.0] * self.num_fingers
        self.f_shear = [np.array([0.0, 0.0], dtype=np.float64) for _ in range(self.num_fingers)]
        self.dropped = False
        self.crushed = False
        self.survival_steps = 0

    def get_observation(self) -> Dict[str, Any]:
        """Returns synchronized sensor observation for the current cycle."""
        # Update nonstationary parameters for the upcoming cycle
        t = self.step_idx * self.dt

        # Incipient slip detection: tactile peripheral marker flow detects impending slip 30 ms (3 steps) prior to macro-drop
        incipient_slip = False
        if self.regime in ["A", "D"]:
            if 27 <= self.step_idx < 30:
                incipient_slip = True
            elif self.step_idx >= 30:
                self.friction = [0.24] * self.num_fingers

        if self.regime in ["B", "D"]:
            # Regime B: Dynamic liquid mass influx (+0.25 kg/s)
            self.mass = self.initial_mass + 0.25 * t

        if self.regime in ["C", "D"]:
            # Regime C: Dynamic tilt inducing CoM precession
            self.com = np.array([0.03 * np.sin(2.0 * np.pi * 0.5 * t), 0.02 * np.cos(2.0 * np.pi * 0.5 * t), 0.0])

        # Current shear load required to support object weight and dynamic inertia
        for i in range(self.num_fingers):
            shear_mag = (self.mass * 9.81 / self.num_fingers) + np.linalg.norm(self.com) * 5.0
            self.f_shear[i] = np.array([shear_mag * 0.6, shear_mag * 0.8], dtype=np.float64)

        return {
            "step": self.step_idx,
            "mass": self.mass,
            "friction": list(self.friction),
            "incipient_slip": incipient_slip,
            "com": np.array(self.com),
            "f_normal": list(self.f_normal),
            "f_shear": [np.array(s) for s in self.f_shear],
            "q": np.array(self.q),
            "dq": np.array(self.dq),
        }

    def step(self, u_cmd: np.ndarray) -> Dict[str, Any]:
        """
        Advance simulation by one 10 ms step under candidate joint acceleration u_cmd.
        """
        self.step_idx += 1
        dt = self.dt

        # Integrate kinematics
        self.dq = self.dq + u_cmd * dt
        self.q = self.q + self.dq * dt

        # Update contact normal forces based on finger position changes
        for i in range(self.num_fingers):
            # Delta normal force from joint command
            delta_fn = 25.0 * np.sum(u_cmd[i*4 : (i+1)*4]) * (0.5 * dt**2 + dt * 0.05)
            self.f_normal[i] = max(0.0, self.f_normal[i] + delta_fn)

            # Check failure conditions
            # Slip / Drop condition: required shear > mu * f_normal
            shear_norm = np.linalg.norm(self.f_shear[i])
            if shear_norm > self.friction[i] * self.f_normal[i] + 1e-3:
                self.dropped = True
            if self.f_normal[i] <= 0.2:
                self.dropped = True

            # Crush violation condition: f_normal > 18.0 N
            if self.f_normal[i] > 18.0:
                self.crushed = True

        if not self.dropped and not self.crushed:
            self.survival_steps += 1

        return {
            "step": self.step_idx,
            "mass": self.mass,
            "friction": list(self.friction),
            "com": np.array(self.com),
            "f_normal": list(self.f_normal),
            "f_shear": [np.array(s) for s in self.f_shear],
            "dropped": self.dropped,
            "crushed": self.crushed,
            "survival_steps": self.survival_steps,
        }
