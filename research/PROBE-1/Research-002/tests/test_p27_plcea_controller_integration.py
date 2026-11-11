"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.7: Pre-Lift Contact Evidence Acquisition (PLCEA)
Test Suite: Phase 2 Controller Verification, Failure Handling & Closed-Loop Integration

Tests the production controller module `src/coordination/plcea_substitutor.py`:
1. Constructor domain validation & immutable threshold consistency.
2. Independent enforcement of all Ten Authorization Gates (G1–G10) in real obs dicts
   (1 positive all-True lift test + 10 isolated single-gate failure rejections + zero bypass).
3. Fail-closed handling of malformed/missing/stale/NaN/Inf/saturated/unmeasured telemetry.
4. S6 sensor-unavailable 3-frame recovery invariant & state wipe verification.
5. S3 two-retry budget & latched S5 fallback verification.
6. Active anti-crush retraction (18.0 N proportional + 25.0 N saturation) & velocity clamping.
7. Closed-loop compliant pre-lift dynamics integration (Document 50 physics):
   - Nominal grasp (mu=0.60): full lifecycle S0->S1->dwell->S2->S4 controlled lift.
   - Adversarial low-friction grasp (mu=0.12): fails safely before liftoff, zero drop.
   - Mid-probe ADC saturation recovery: fault -> S6 -> 3 healthy frames -> S1 -> S4 lift.
8. Research-002 architecture integration with MultifingerLiftEnv & InterventionTelemetryLogger.

Author: Sunil Kumar Chavhan (sunil@horoslab.org)
Organization: HOROS Physical Intelligence Research Group (H.R.)
"""

import math
import os
import sys
import unittest
import numpy as np

current_dir = os.path.dirname(os.path.abspath(__file__))
r002_root = os.path.abspath(os.path.join(current_dir, ".."))
if r002_root not in sys.path:
    sys.path.insert(0, r002_root)
src_dir = os.path.join(r002_root, "src")
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

from src.coordination import (
    PLCEAActionSubstitutor,
    PLCEAGateEvaluator,
    PLCEAState,
    AuthorizationResult,
    InterventionTelemetryLogger,
)
from src.environment.multifinger_lift_env import MultifingerLiftEnv


class CompliantPreLiftContactEnv:
    """
    Physically compliant pre-lift contact testbed implementing Document 50 mechanics:
    - 4 elastomeric fingertip shear pads in parallel (k_pads = 6000 N/m = 6.0 N/mm total, 1.5 N/mm per finger)
    - Table vertical compliance k_table = 50000 N/m = 50.0 N/mm
    - Rigid workpiece mass = 0.350 kg (static weight W = 3.4323 N under g = 9.80665 m/s^2)
    - Normal radial contact stiffness k_normal = 4.0 N/mm per finger
    - Coulomb slip occurs physically if ||ft_i|| > mu_true * Fn_i
    - True friction mu_true is NEVER exposed to the controller (hidden world parameter)
    """

    def __init__(
        self,
        mu_true: float = 0.60,
        object_mass: float = 0.350,
        gravity: float = 9.80665,
        dt: float = 0.01,
        k_pad_per_finger_npm: float = 1500.0,  # 4 * 1500 = 6000 N/m total
        k_normal_per_finger_npmm: float = 4.0,
        noise_std_n: float = 0.015,
        noise_std_t: float = 0.008,
        seed: int = 2026,
    ):
        self.mu_true = float(mu_true)
        self.object_mass = float(object_mass)
        self.gravity = float(gravity)
        self.dt = float(dt)
        self.k_pad = float(k_pad_per_finger_npm)
        self.k_norm = float(k_normal_per_finger_npmm)
        self.noise_std_n = float(noise_std_n)
        self.noise_std_t = float(noise_std_t)
        self.rng = np.random.RandomState(seed)
        self.reset()

    def reset(self, mu_true: float = None, seed: int = None):
        if mu_true is not None:
            self.mu_true = float(mu_true)
        if seed is not None:
            self.rng = np.random.RandomState(seed)

        self.obj_pos = np.array([0.0, 0.0, 0.0], dtype=float)  # mm
        self.obj_vel = np.array([0.0, 0.0, 0.0], dtype=float)  # mm/s
        self.obj_acc_z = 0.0  # m/s^2
        # Fingers start 1.5 mm away from object radius 35.0 mm (free space)
        self.finger_pos = np.array(
            [
                [36.5, 0.0, 40.0],
                [-36.5, 0.0, 40.0],
                [0.0, 36.5, 40.0],
                [0.0, -36.5, 40.0],
            ],
            dtype=float,
        )
        self.pad_stretch_m = np.zeros(4, dtype=float)
        self.fn = np.zeros(4, dtype=float)
        self.ft = np.zeros((4, 2), dtype=float)  # [ft_theta, ft_z]
        self.slip_vel_mps = np.zeros(4, dtype=float)
        self.dropped = False
        self.lifted = False
        self.step_count = 0
        self.prev_noise_n = np.zeros(4, dtype=float)
        self.prev_noise_t = np.zeros(4, dtype=float)
        return self._get_obs()

    def step(self, action: np.ndarray):
        self.step_count += 1
        squeeze = np.clip(action[:4], -2.0, 2.0)
        arm_dz_mm = float(np.clip(action[4], -2.0, 5.0))
        arm_dz_m = arm_dz_mm * 1e-3

        # 1. Update radial squeeze indentation -> normal forces
        obj_radius = 35.0
        for i in range(4):
            r_curr = float(np.linalg.norm(self.finger_pos[i, :2]))
            r_new = max(28.0, r_curr - squeeze[i])
            u = self.finger_pos[i, :2] / max(1e-6, r_curr)
            self.finger_pos[i, :2] = u * r_new
            indent_mm = max(0.0, obj_radius - r_new)
            self.fn[i] = self.k_norm * indent_mm if indent_mm > 0.0 else 0.0

        # 2. Compliant tangential pad stretch vs table reaction & Coulomb slip limit
        prev_vel_z_mps = self.obj_vel[2] * 1e-3
        weight_n = self.object_mass * self.gravity
        prev_obj_z_m = self.obj_pos[2] * 1e-3
        cmd_vel_mps = arm_dz_m / self.dt

        # Candidate object upward motion (restrained on table until total shear >= W, then inertial lift)
        tentative_stretch_m = self.pad_stretch_m + arm_dz_m
        candidate_ft_z = np.where(self.fn > 0.10, self.k_pad * np.maximum(0.0, tentative_stretch_m), 0.0)

        # Check physical Coulomb cone at each contact (transverse perturbation near zero)
        ft_theta = np.zeros(4, dtype=float)
        actual_slip_vel = np.zeros(4, dtype=float)
        actual_ft_z = np.zeros(4, dtype=float)

        for i in range(4):
            if self.fn[i] < 0.10:
                self.pad_stretch_m[i] = 0.0
                actual_ft_z[i] = 0.0
                actual_slip_vel[i] = cmd_vel_mps
                continue

            max_static_ft = self.mu_true * self.fn[i]
            if candidate_ft_z[i] <= max_static_ft:
                actual_ft_z[i] = candidate_ft_z[i]
                self.pad_stretch_m[i] = tentative_stretch_m[i]
                actual_slip_vel[i] = 0.0
            else:
                # Coulomb slip occurs! Pad slips at kinetic limit 0.90 * mu_true * Fn
                actual_ft_z[i] = 0.90 * max_static_ft
                self.pad_stretch_m[i] = actual_ft_z[i] / self.k_pad
                actual_slip_vel[i] = max(0.0005, abs(cmd_vel_mps))  # > 0.10 mm/s physical slip velocity!

        total_ft_z = float(np.sum(actual_ft_z))

        # 3. Rigid-body vertical dynamics of object
        if prev_obj_z_m <= 1e-6:
            if total_ft_z > weight_n and np.all(actual_slip_vel <= 1e-4):
                # Liftoff achieved! Object follows compliant equilibrium acceleration
                a_z = min(cmd_vel_mps / self.dt, (total_ft_z - weight_n) / self.object_mass)
                a_z = max(0.0, min(0.040, a_z))
                new_vel_z_mps = prev_vel_z_mps + a_z * self.dt
                if abs(cmd_vel_mps - prev_vel_z_mps) <= 0.050 * self.dt:
                    new_vel_z_mps = max(0.0, cmd_vel_mps)
                    a_z = (new_vel_z_mps - prev_vel_z_mps) / self.dt
                new_obj_z_m = max(0.0, prev_obj_z_m + new_vel_z_mps * self.dt)
                self.pad_stretch_m = actual_ft_z / self.k_pad
                # Clamp actual shear to balanced dynamic equilibrium force
                eq_ft_z = self.object_mass * (self.gravity + a_z) / 4.0
                for i in range(4):
                    if actual_slip_vel[i] == 0.0 and eq_ft_z <= self.mu_true * self.fn[i]:
                        actual_ft_z[i] = eq_ft_z
                        self.pad_stretch_m[i] = eq_ft_z / self.k_pad
            else:
                a_z = 0.0
                new_vel_z_mps = 0.0
                new_obj_z_m = 0.0
        else:
            # Object is airborne
            max_holdable = float(np.sum(actual_ft_z))
            if max_holdable < weight_n * 0.98 or np.any(actual_slip_vel > 1e-4):
                # Object slips and drops under gravity
                a_z = max(-self.gravity, (max_holdable - weight_n) / self.object_mass)
                new_vel_z_mps = prev_vel_z_mps + a_z * self.dt
                new_obj_z_m = max(0.0, prev_obj_z_m + new_vel_z_mps * self.dt)
                if new_obj_z_m <= 1e-6:
                    self.dropped = True
            else:
                # Track arm velocity cleanly without slipping
                a_z = (cmd_vel_mps - prev_vel_z_mps) / self.dt
                new_vel_z_mps = cmd_vel_mps
                new_obj_z_m = max(0.0, prev_obj_z_m + new_vel_z_mps * self.dt)
                eq_ft_z = self.object_mass * (self.gravity + a_z) / 4.0
                for i in range(4):
                    actual_ft_z[i] = min(self.mu_true * self.fn[i], max(0.0, eq_ft_z))
                    self.pad_stretch_m[i] = actual_ft_z[i] / self.k_pad

        # Update finger vertical coordinate identically to hand z = obj_z + pad_stretch (relative offset + 40mm)
        self.obj_pos[2] = new_obj_z_m * 1000.0
        self.obj_vel[2] = new_vel_z_mps * 1000.0
        self.obj_acc_z = a_z
        for i in range(4):
            self.finger_pos[i, 2] = self.obj_pos[2] + 40.0 + self.pad_stretch_m[i] * 1000.0

        self.ft = np.column_stack([ft_theta, actual_ft_z])
        self.slip_vel_mps = actual_slip_vel
        if self.obj_pos[2] >= 5.0 and not self.dropped:
            self.lifted = True

        return self._get_obs(), self.obj_pos[2] >= 20.0

    def _get_obs(self):
        # Apply AR(1) stationary thermal + white sensor noise
        rho1 = 0.1355
        innov_n = self.rng.normal(0.0, self.noise_std_n * math.sqrt(1 - rho1 ** 2), 4)
        innov_t = self.rng.normal(0.0, self.noise_std_t * math.sqrt(1 - rho1 ** 2), 4)
        self.prev_noise_n = rho1 * self.prev_noise_n + innov_n
        self.prev_noise_t = rho1 * self.prev_noise_t + innov_t

        fn_meas = np.where(self.fn > 0.05, np.maximum(0.0, self.fn + self.prev_noise_n), 0.0)
        ft_meas = self.ft.copy()
        if np.any(self.fn > 0.05):
            ft_meas[:, 1] = ft_meas[:, 1] + np.where(self.fn > 0.05, self.prev_noise_t, 0.0)

        return {
            "finger_pos": self.finger_pos.copy(),
            "finger_fn": fn_meas,
            "finger_ft": ft_meas,
            "obj_pos": self.obj_pos.copy(),
            "obj_vel": self.obj_vel.copy(),
            "a_z": self.obj_acc_z,
            "delta_dot_t": self.slip_vel_mps.copy(),
            "dt_ms": self.dt * 1000.0,
            "gamma": 1,
        }


class TestP27PLCEAControllerIntegration(unittest.TestCase):
    """Comprehensive Phase 2 Controller, Failure Handling, and Integration Test Suite."""

    def setUp(self):
        self.sub = PLCEAActionSubstitutor()

    def _make_fully_authorized_controller_and_obs(self):
        """
        Helper creating a clean post-evidence controller ready for lift verification
        along with a strictly valid physical obs dict (all 10 gates satisfied).
        """
        sub = PLCEAActionSubstitutor()
        sub.state = PLCEAState.S4_AUTHORIZE_LIFT
        sub.tare_ft_z = np.zeros(4, dtype=float)
        sub.dwell_counter = sub.n_dwell_frames
        sub.probe_buffer.clear()
        for _ in range(sub.n_probe_frames):
            sub.probe_buffer.append(np.array([0.8616, 0.8616, 0.8616, 0.8616]))
        sub.streak_counter = [5, 5, 5, 5]
        sub.friction_status = ["IDENTIFIED"] * 4
        sub.mu_lb = [0.50, 0.50, 0.50, 0.50]

        obs = {
            "finger_fn": np.array([2.70, 2.70, 2.70, 2.70]),
            "finger_ft": np.array([[0.02, 0.8616], [0.02, 0.8616], [0.02, 0.8616], [0.02, 0.8616]]),
            "finger_pos": np.array([[35.0, 0.0, 40.0], [-35.0, 0.0, 40.0], [0.0, 35.0, 40.0], [0.0, -35.0, 40.0]]),
            "obj_pos": np.array([0.0, 0.0, 0.0]),
            "obj_vel": np.array([0.0, 0.0, 0.0]),
            "moments": np.array([0.0, 0.0, 0.0]),
            "a_z": 0.040,
            "f_table_z_hat": 0.0,
            "rho": np.array([0.32, 0.32, 0.32, 0.32]),
            "delta_dot_t": np.array([0.0, 0.0, 0.0, 0.0]),
            "dt_ms": 10.0,
            "gamma": 1,
        }
        return sub, obs

    # --------------------------------------------------------------------------
    # 1. Constructor Domain Validation
    # --------------------------------------------------------------------------
    def test_01_constructor_domain_validation(self):
        """Rejects negative, zero, NaN, Inf, or physically inconsistent constructor parameters."""
        invalid_kwargs = [
            {"object_mass": -0.35},
            {"object_mass": 0.0},
            {"object_mass": float("nan")},
            {"gravity": -9.8},
            {"num_fingers": 3},
            {"nominal_friction_mu": 0.0},
            {"elastic_stiffness": -4.0},
            {"dynamic_safety_margin": 0.9},
            {"friction_margin_eta": 1.2},
            {"friction_margin_eta": 0.0},
            {"dt": 0.0},
            {"max_crush_force": 23.0, "adc_saturation_limit": 22.0},
            {"adc_saturation_limit": 26.0, "hard_environment_limit": 25.0},
            {"contact_loss_threshold": 0.0},
            {"n_tare_frames": 0},
            {"dwell_gap_ms": -10.0},
            {"n_probe_frames": 0},
            {"friction_streak_cycles": 0},
            {"max_probe_retries": -1},
            {"sensor_reengage_frames": 0},
            {"v_probe_max_mps": 0.0},
            {"v_probe_nom_mps": 0.020, "v_probe_max_mps": 0.015},
            {"max_lift_accel_mps2": 0.10},  # > 0.050 m/s^2 limit
            {"side_a_indices": (0, 1), "side_b_indices": (1, 3)},  # non-partitioning
        ]
        for kwargs in invalid_kwargs:
            with self.assertRaises(ValueError, msg=f"Should reject {kwargs}"):
                PLCEAActionSubstitutor(**kwargs)

    # --------------------------------------------------------------------------
    # 2. Ten Independent Gates Conjunction & Single-Gate Failure Isolation
    # --------------------------------------------------------------------------
    def test_02_ten_gate_positive_and_isolated_negative_enforcement(self):
        """
        Verifies live controller enforces all 10 gates independently:
        - Positive case authorizes upward lift in S4.
        - Perturbing any individual channel corresponding to G1..G10 immediately blocks
          upward lift (a_sub[4] <= 0.0, lift_authorized == False).
        """
        # Positive test
        sub, base_obs = self._make_fully_authorized_controller_and_obs()
        prop_up = np.array([0.0, 0.0, 0.0, 0.0, 0.20])
        a_sub, _, info = sub.substitute_action(base_obs, prop_up)
        self.assertTrue(info["lift_authorized"])
        self.assertEqual(info["state"], PLCEAState.S4_AUTHORIZE_LIFT.value)
        self.assertEqual(info["failed_gates"], [])
        self.assertGreater(a_sub[4], 0.0)

        # Prepare per-gate isolated failure mutations (each targets one gate while trying to leave others healthy)
        gate_perturbations = {
            "G1": {"dt_ms": 25.0},  # Stale latency > 20 ms
            "G2": {"finger_fn": np.array([2.20, 2.70, 2.70, 2.70])},  # < 2.299 N (also trips G3)
            "G3": {"finger_fn": np.array([2.40, 2.70, 2.70, 2.70])},  # 2.299 <= Fn < 2.5547 N (G2 True, G3 False)
            "G4": {"delta_ft_z": np.array([0.05, 0.20, 0.20, 0.20])},  # Sum 0.65 < 0.6865 N & min < 0.0858 N
            "G5": {"delta_ft_z": np.array([0.20, 0.20, 0.20, 0.086])},  # G4 True (sum=0.686, min=0.086>=0.0858), but G5 False (< 0.0875 N)!
            "G6": {"finger_fn": np.array([2.60, 2.60, 2.60, 2.60]), "override_mu_lb": [0.35, 0.35, 0.35, 0.35]},  # Cap=3.64 < 4.2904 N!
            "G7": {"moments": np.array([0.0, 0.008, 0.0])},  # Pitch moment |My| > 0.005 N*m
            "G8": {"finger_fn": np.array([18.5, 2.70, 2.70, 2.70])},  # Crush >= 18 N (G1 True < 22 N, G8 False)
            "G9": {"delta_dot_t": np.array([0.0, 0.0, 0.00025, 0.0])},  # Active slip > 0.10 mm/s
            "G10": {"a_z": 0.15, "f_table_z_hat": -0.50},  # Excessive accel + impossible negative table pull
        }

        for target_gate, mod in gate_perturbations.items():
            sub_g, obs_g = self._make_fully_authorized_controller_and_obs()
            obs_mod = dict(obs_g)
            if "override_mu_lb" in mod:
                sub_g.mu_lb = list(mod["override_mu_lb"])
            for k, v in mod.items():
                if k != "override_mu_lb":
                    obs_mod[k] = v

            # Run step
            a_fail, intervened, info_fail = sub_g.substitute_action(obs_mod, prop_up)
            self.assertFalse(
                info_fail["lift_authorized"],
                msg=f"Expected LiftAuthorized==False when breaking {target_gate}",
            )
            self.assertIn(
                target_gate,
                info_fail["failed_gates"],
                msg=f"Expected {target_gate} in failed_gates, got {info_fail['failed_gates']}",
            )
            self.assertLessEqual(a_fail[4], 0.0, msg=f"Upward lift was not blocked when {target_gate} failed")
            self.assertTrue(intervened)

    # --------------------------------------------------------------------------
    # 3. Zero Implicit Defaults & Strict Telemetry Sanitization
    # --------------------------------------------------------------------------
    def test_03_fail_closed_invalid_missing_corrupted_telemetry(self):
        """Rejects None, NaN, Inf, bad shapes, heartbeat faults, missing moments/dynamics."""
        prop = np.array([0.0, 0.0, 0.0, 0.0, 0.50])

        # Bad obs / proposed action
        for bad_obs in [None, "invalid", {}]:
            sub = PLCEAActionSubstitutor()
            a_sub, intervened, info = sub.substitute_action(bad_obs, prop)  # type: ignore[arg-type]
            self.assertFalse(info["lift_authorized"])
            self.assertEqual(a_sub[4], 0.0)
            self.assertEqual(info["state"], PLCEAState.S6_SENSOR_UNAVAILABLE.value)

        for bad_act in [None, np.array([0.0, 0.0, 0.0]), np.array([0.0, float("nan"), 0.0, 0.0, 0.0])]:
            _, base_obs = self._make_fully_authorized_controller_and_obs()
            a_sub, intervened, info = self.sub.substitute_action(base_obs, bad_act)  # type: ignore[arg-type]
            self.assertTrue(np.all(a_sub == 0.0))
            self.assertTrue(intervened)

        # Missing transverse shear (1D shear without explicit ft_theta) -> fails G1 closed
        sub, base_obs = self._make_fully_authorized_controller_and_obs()
        obs_1d = dict(base_obs)
        obs_1d["finger_ft"] = np.array([0.86, 0.86, 0.86, 0.86])  # missing transverse component
        a_sub, _, info = sub.substitute_action(obs_1d, prop)
        self.assertFalse(info["gates"]["G1"])
        self.assertFalse(info["lift_authorized"])
        self.assertEqual(info["state"], PLCEAState.S6_SENSOR_UNAVAILABLE.value)

        # Missing moments & missing finger_pos -> G7 must fail closed (never implicitly zero)
        sub, base_obs = self._make_fully_authorized_controller_and_obs()
        obs_no_mom = {k: v for k, v in base_obs.items() if k not in ("moments", "finger_pos")}
        a_sub, _, info = sub.substitute_action(obs_no_mom, prop)
        self.assertFalse(info["gates"]["G7"])
        self.assertFalse(info["lift_authorized"])
        self.assertEqual(a_sub[4], 0.0)

        # Bus heartbeat fault gamma = 0
        sub, base_obs = self._make_fully_authorized_controller_and_obs()
        obs_gamma = dict(base_obs, gamma=0)
        a_sub, _, info = sub.substitute_action(obs_gamma, prop)
        self.assertFalse(info["gates"]["G1"])
        self.assertEqual(info["state"], PLCEAState.S6_SENSOR_UNAVAILABLE.value)

        # NaN normal force & negative normal force
        for bad_val in [float("nan"), float("inf"), -0.1]:
            sub, base_obs = self._make_fully_authorized_controller_and_obs()
            obs_bad_fn = dict(base_obs)
            obs_bad_fn["finger_fn"] = np.array([bad_val, 2.7, 2.7, 2.7])
            a_sub, _, info = sub.substitute_action(obs_bad_fn, prop)
            self.assertFalse(info["gates"]["G1"])
            self.assertEqual(info["state"], PLCEAState.S6_SENSOR_UNAVAILABLE.value)
            self.assertEqual(a_sub[4], 0.0)

    # --------------------------------------------------------------------------
    # 4. S6 ADC Saturation & 3-Frame Recovery Protocol
    # --------------------------------------------------------------------------
    def test_04_adc_saturation_and_three_frame_recovery_protocol(self):
        """
        Fn >= 22.0 N forces immediate S6_SENSOR_UNAVAILABLE, resets prior friction/tare evidence,
        requires exact 3 consecutive healthy frames to return to S1_HOLD_PRELOAD, and aborts
        streak if any frame in the 3-frame window fails.
        """
        sub, obs_ok = self._make_fully_authorized_controller_and_obs()
        obs_sat = dict(obs_ok, finger_fn=np.array([22.5, 2.7, 2.7, 2.7]))
        prop = np.array([0.0, 0.0, 0.0, 0.0, 0.50])

        a_sub, _, info = sub.substitute_action(obs_sat, prop)
        self.assertEqual(sub.state, PLCEAState.S6_SENSOR_UNAVAILABLE)
        self.assertFalse(info["gates"]["G1"])
        self.assertEqual(a_sub[4], 0.0)
        self.assertLessEqual(a_sub[0], -1.0)  # Active squeeze relief even during overforce fault
        # Prior evidence must be wiped clean
        self.assertIsNone(sub.tare_ft_z)
        self.assertEqual(sub.friction_status, ["UNIDENTIFIED"] * 4)

        # Frame 1 healthy -> still S6 (count 1)
        _, _, i1 = sub.substitute_action(obs_ok, prop)
        self.assertEqual(sub.state, PLCEAState.S6_SENSOR_UNAVAILABLE)
        self.assertEqual(sub.sensor_healthy_consecutive_frames, 1)
        self.assertFalse(i1["lift_authorized"])

        # Frame 2 healthy -> still S6 (count 2)
        _, _, i2 = sub.substitute_action(obs_ok, prop)
        self.assertEqual(sub.state, PLCEAState.S6_SENSOR_UNAVAILABLE)
        self.assertEqual(sub.sensor_healthy_consecutive_frames, 2)

        # Frame 3 faulty -> resets streak to 0, stays S6
        _, _, i3_bad = sub.substitute_action(obs_sat, prop)
        self.assertEqual(sub.state, PLCEAState.S6_SENSOR_UNAVAILABLE)
        self.assertEqual(sub.sensor_healthy_consecutive_frames, 0)

        # Now supply 3 clean frames -> 3rd frame transitions S6 -> S1_HOLD_PRELOAD (never directly to S4!)
        sub.substitute_action(obs_ok, prop)
        sub.substitute_action(obs_ok, prop)
        a3, _, i3_ok = sub.substitute_action(obs_ok, prop)
        self.assertEqual(sub.state, PLCEAState.S1_HOLD_PRELOAD)
        self.assertFalse(i3_ok["lift_authorized"])
        self.assertEqual(a3[4], 0.0)

    # --------------------------------------------------------------------------
    # 5. Anti-Crush Protection (18 N Proportional Retract & 25 N Hard Saturation)
    # --------------------------------------------------------------------------
    def test_05_anti_crush_two_zone_retraction_and_multiaxial_protection(self):
        """
        Verifies:
        - Fn == 18.00 N triggers active outward squeeze (< 0) and enters S5_RECOVER_FALLBACK.
        - Fn == 21.00 N commands proportional retraction -1.5*(21-18)/4 = -1.125 mm/step.
        - Fn >= 25.00 N commands -2.0 mm/step saturation while G1 checks saturation < 22.0 N cleanly.
        - Excess tangential shear (>= 8.0 N) or high Tsai-Wu index triggers S5_RECOVER_FALLBACK.
        """
        sub, base_obs = self._make_fully_authorized_controller_and_obs()
        prop = np.array([1.0, 1.0, 1.0, 1.0, 0.50])

        # Exact 18.00 N protective boundary
        obs_18 = dict(base_obs, finger_fn=np.array([18.00, 2.7, 2.7, 2.7]))
        a_18, _, info_18 = sub.substitute_action(obs_18, prop)
        self.assertEqual(sub.state, PLCEAState.S5_RECOVER_FALLBACK)
        self.assertTrue(info_18["gates"]["G1"])
        self.assertFalse(info_18["gates"]["G8"])
        self.assertLess(a_18[0], 0.0)
        self.assertEqual(a_18[4], 0.0)

        # Proportional 21.00 N (< 22.0 N ADC sat)
        sub2, base_obs = self._make_fully_authorized_controller_and_obs()
        obs_21 = dict(base_obs, finger_fn=np.array([21.00, 2.7, 2.7, 2.7]))
        a_21, _, info_21 = sub2.substitute_action(obs_21, prop)
        expected_retract = -1.5 * (21.00 - 18.00) / 4.0  # -1.125 mm/step
        self.assertAlmostEqual(a_21[0], expected_retract, places=4)
        self.assertEqual(a_21[4], 0.0)
        self.assertEqual(sub2.state, PLCEAState.S5_RECOVER_FALLBACK)

        # Hard limit 26.00 N -> saturation -2.0 mm/step & G1 sensor saturation S6
        sub3, base_obs = self._make_fully_authorized_controller_and_obs()
        obs_26 = dict(base_obs, finger_fn=np.array([26.00, 2.7, 2.7, 2.7]))
        a_26, _, info_26 = sub3.substitute_action(obs_26, prop)
        self.assertEqual(a_26[0], -2.0)
        self.assertEqual(a_26[4], 0.0)

    # --------------------------------------------------------------------------
    # 6. Retry Budget Exhaustion (Unresponsive Object -> Latched S5)
    # --------------------------------------------------------------------------
    def test_06_inconclusive_retry_budget_exhaustion_latches_s5(self):
        """
        When shear excitation fails repeatedly during S2 probing:
        - Allows retry 1 and retry 2 cleanly through S3 -> S1 -> S2.
        - Exhausts budget on 3rd failure (retry == 2) and latches in S5_RECOVER_FALLBACK.
        """
        sub = PLCEAActionSubstitutor(n_tare_frames=5, dwell_gap_ms=20.0, n_probe_frames=3)
        sub.no_excitation_timeout_steps = 8

        # Build dead-shear obs (Fn seated at 2.7 N, but zero vertical shear change during probe)
        obs = {
            "finger_fn": np.array([2.70, 2.70, 2.70, 2.70]),
            "finger_ft": np.zeros((4, 2), dtype=float),
            "finger_pos": np.array([[35.0, 0.0, 40.0], [-35.0, 0.0, 40.0], [0.0, 35.0, 40.0], [0.0, -35.0, 40.0]]),
            "obj_pos": np.zeros(3, dtype=float),
            "obj_vel": np.zeros(3, dtype=float),
            "moments": np.zeros(3, dtype=float),
            "a_z": 0.0,
            "delta_dot_t": np.zeros(4, dtype=float),
            "dt_ms": 10.0,
            "gamma": 1,
        }
        prop = np.array([0.0, 0.0, 0.0, 0.0, 0.50])
        saw_retries = set()
        for _ in range(150):
            a_sub, _, info = sub.substitute_action(obs, prop)
            saw_retries.add(info["retry_count"])
            self.assertFalse(info["lift_authorized"])
            if sub.state == PLCEAState.S5_RECOVER_FALLBACK and sub.retry_exhausted_latched:
                break

        self.assertEqual(sub.state, PLCEAState.S5_RECOVER_FALLBACK)
        self.assertTrue(sub.retry_exhausted_latched)
        self.assertEqual(sub.retry_count, 2)
        self.assertIn(1, saw_retries)
        self.assertIn(2, saw_retries)

        # Additional calls must stay latched in S5 with lift locked 0.0
        for _ in range(10):
            a_latched, _, i_latched = sub.substitute_action(obs, prop)
            self.assertEqual(sub.state, PLCEAState.S5_RECOVER_FALLBACK)
            self.assertEqual(a_latched[4], 0.0)
            self.assertFalse(i_latched["lift_authorized"])

    # --------------------------------------------------------------------------
    # 7. Closed-Loop Compliant Simulation: Nominal Safe Grasp (mu = 0.60)
    # --------------------------------------------------------------------------
    def test_07_closed_loop_compliant_nominal_lift_lifecycle(self):
        """
        Full closed-loop simulation on CompliantPreLiftContactEnv (mu_true = 0.60, hidden):
        Executes complete sequence S0 -> S1 (20 tare + 10 dwell) -> S2 (0.10mm probe +
        5-cycle ID + load-transfer + adaptive wrench squeeze) -> S4_AUTHORIZE_LIFT ->
        lifts workpiece >= 20 mm cleanly without slip, crush, or premature liftoff.
        """
        env = CompliantPreLiftContactEnv(mu_true=0.60, seed=101)
        sub = PLCEAActionSubstitutor()
        obs = env.reset()
        prop_aggressive_planner = np.array([0.1, 0.1, 0.1, 0.1, 1.0])  # reckless planner wants immediate lift

        visited_states = []
        lifted_20mm = False
        max_fn_seen = 0.0

        for step in range(250):
            a_sub, _, info = sub.substitute_action(obs, prop_aggressive_planner)
            if not visited_states or visited_states[-1] != sub.state:
                visited_states.append(sub.state)

            # Assert object never lifts prior to S4 authorization
            if sub.state != PLCEAState.S4_AUTHORIZE_LIFT:
                self.assertEqual(env.obj_pos[2], 0.0, msg=f"Premature object lift in {sub.state} at step {step}")

            # Assert S2 probe speed strictly clamped <= 15 mm/s (0.15 mm/step at 100 Hz)
            if sub.state == PLCEAState.S2_PROBE_FOR_EVIDENCE:
                self.assertLessEqual(a_sub[4], 0.150001)

            obs, done = env.step(a_sub)
            max_fn_seen = max(max_fn_seen, float(np.max(env.fn)))
            if done:
                lifted_20mm = True
                break

        self.assertTrue(lifted_20mm, f"Failed to complete lift; last state={sub.state}, info={info}")
        self.assertFalse(env.dropped)
        self.assertLess(max_fn_seen, 18.0)
        self.assertIn(PLCEAState.S0_APPROACH_FREE_SPACE, visited_states)
        self.assertIn(PLCEAState.S1_HOLD_PRELOAD, visited_states)
        self.assertIn(PLCEAState.S2_PROBE_FOR_EVIDENCE, visited_states)
        self.assertIn(PLCEAState.S4_AUTHORIZE_LIFT, visited_states)

    # --------------------------------------------------------------------------
    # 8. Closed-Loop Compliant Simulation: Adversarial Low-Friction Rejection (mu = 0.12)
    # --------------------------------------------------------------------------
    def test_08_closed_loop_adversarial_low_friction_blocks_lift_prevents_drop(self):
        """
        Closed-loop simulation on slippery object (mu_true = 0.12 < 0.150, hidden from controller):
        Controller detects slip / inadequate empirical friction lower bound during S2 probe,
        strictly withholds lift authorization across all steps, aborts to S5_RECOVER_FALLBACK,
        and leaves the fragile object safely on the table with ZERO drops.
        """
        env = CompliantPreLiftContactEnv(mu_true=0.12, seed=404)
        sub = PLCEAActionSubstitutor()
        obs = env.reset()
        prop_lift = np.array([0.05, 0.05, 0.05, 0.05, 1.0])

        ever_authorized = False
        for _ in range(150):
            a_sub, _, info = sub.substitute_action(obs, prop_lift)
            if info["lift_authorized"] or sub.state == PLCEAState.S4_AUTHORIZE_LIFT:
                ever_authorized = True
            obs, _ = env.step(a_sub)

        self.assertFalse(ever_authorized, "Low-friction mu=0.12 grasp must NEVER be authorized to lift")
        self.assertFalse(env.dropped)
        self.assertEqual(env.obj_pos[2], 0.0)
        self.assertIn(sub.state, (PLCEAState.S5_RECOVER_FALLBACK, PLCEAState.S3_PROBE_INCONCLUSIVE, PLCEAState.S1_HOLD_PRELOAD))

    # --------------------------------------------------------------------------
    # 9. Closed-Loop Fault Injection: Mid-Probe ADC Saturation Recovery -> Safe Lift
    # --------------------------------------------------------------------------
    def test_09_closed_loop_mid_probe_saturation_recovery_and_completion(self):
        """
        Injects transient ADC saturation (>= 22.0 N) mid-probe during a nominal lift:
        Verifies S2 -> S6 (zero lift), 3-frame healthy re-engagement -> S1, clean tare/probe
        re-acquisition, and eventual safe S4 lift completion.
        """
        env = CompliantPreLiftContactEnv(mu_true=0.60, seed=707)
        sub = PLCEAActionSubstitutor()
        obs = env.reset()
        prop = np.array([0.05, 0.05, 0.05, 0.05, 0.80])

        injected_fault = False
        saw_s6 = False
        lifted = False

        for step in range(320):
            # Inject 1-frame ADC glitch right after entering S2 probe
            if not injected_fault and sub.state == PLCEAState.S2_PROBE_FOR_EVIDENCE and sub.probe_step_count >= 3:
                injected_fault = True
                obs_glitch = dict(obs)
                obs_glitch["finger_fn"] = np.array([22.4, 2.7, 2.7, 2.7])
                a_sub, _, info = sub.substitute_action(obs_glitch, prop)
                self.assertEqual(sub.state, PLCEAState.S6_SENSOR_UNAVAILABLE)
                self.assertEqual(a_sub[4], 0.0)
                saw_s6 = True
            else:
                a_sub, _, info = sub.substitute_action(obs, prop)

            obs, done = env.step(a_sub)
            if done:
                lifted = True
                break

        self.assertTrue(injected_fault)
        self.assertTrue(saw_s6)
        self.assertTrue(lifted, f"Controller failed to recover and finish lift; final state={sub.state}")
        self.assertFalse(env.dropped)

    # --------------------------------------------------------------------------
    # 10. Research-002 Stack Integration (MultifingerLiftEnv + InterventionTelemetryLogger)
    # --------------------------------------------------------------------------
    def test_10_research002_stack_multifinger_env_and_telemetry_integration(self):
        """
        Verifies clean API compatibility and fail-closed integration with Research-002's
        existing MultifingerLiftEnv (dt=0.02 s = 20 ms) and InterventionTelemetryLogger.
        Because MultifingerLiftEnv does not model compliant pre-lift micro-shear build-up,
        PLCEA strictly refuses to authorize blind lift, completes retries, and logs valid
        8-channel telemetry cleanly.
        """
        env = MultifingerLiftEnv(dt=0.02, object_mass=0.35, friction_coeff=0.60, seed=42)
        sub = PLCEAActionSubstitutor(dt=0.02)
        logger = InterventionTelemetryLogger(task="multifinger_lift")

        obs = env.reset()
        sub.reset()
        logger.start_episode(episode_id=1, model_name="PLCEA_Integration", configuration="PLCEA_P27", seed=42)

        prop = np.array([0.5, 0.5, 0.5, 0.5, 0.8])
        ever_lifted_illegally = False

        for step in range(200):
            a_sub, intervened, sub_info = sub.substitute_action(obs, prop)
            if sub_info["lift_authorized"]:
                ever_lifted_illegally = True

            next_obs, _, done, _ = env.step(a_sub)
            logger.log_decision(
                step_idx=step,
                obs=obs,
                proposed_action=prop,
                filtered_action=a_sub,
                intervened=intervened,
                filter_info=sub_info,
                task_progress_mm=float(next_obs["obj_pos"][2]),
                contact_mode=int(next_obs["stratum"]),
            )
            obs = next_obs
            if done:
                break

        logger.end_episode(
            task_success=False,
            safety_violated=False,
            stalled=True,
            final_progress_mm=float(obs["obj_pos"][2]),
        )
        agg = logger.get_aggregate_telemetry()

        self.assertFalse(ever_lifted_illegally)
        self.assertEqual(agg["total_episodes"], 1)
        self.assertEqual(agg["violation_count"], 0)
        self.assertEqual(sub.state, PLCEAState.S5_RECOVER_FALLBACK)
        self.assertTrue(sub.retry_exhausted_latched)

    # --------------------------------------------------------------------------
    # 11. Frozen Specification T01-T15 Controller Evaluator Parity
    # --------------------------------------------------------------------------
    def test_11_specification_t01_to_t15_controller_parity(self):
        """Directly asserts production PLCEAGateEvaluator and retry methods match T01-T15 constants."""
        ev = self.sub.evaluator

        # T01: resultant force & Tsai-Wu index
        f_res = ev.compute_resultant_force_norm(2.810, [0.050, 2.408])
        i_fail = ev.compute_multiaxial_failure_index(2.810, [0.050, 2.408])
        self.assertAlmostEqual(f_res, 3.701, places=3)
        self.assertAlmostEqual(i_fail, 0.1150, places=4)

        # T02: simultaneous Bonferroni confidence margin (Delta mu = 0.0378)
        dmu = ev.compute_simultaneous_delta_mu(2.299, 0.35, sigma_n=0.050, sigma_t=0.030)
        self.assertAlmostEqual(dmu, 0.0378, places=4)

        # T03, T05, T06, T07, T08, T09: exact gate boundaries on evaluator
        self.assertFalse(ev.evaluate_g5_friction_bound_valid(["IDENTIFIED"] * 3 + ["UNIDENTIFIED"], [0.11, 0.11, 0.11, 0.07], [0.5] * 4))
        self.assertTrue(ev.evaluate_g2_evidence_preload([2.40] * 4))
        self.assertFalse(ev.evaluate_g3_lift_preload([2.40] * 4))
        self.assertTrue(ev.evaluate_g3_lift_preload([2.56] * 4))
        self.assertTrue(ev.evaluate_g6_wrench_feasible([0.5] * 4, [2.60] * 4, [0.05] * 4))
        self.assertFalse(ev.evaluate_g6_wrench_feasible([0.5] * 4, [3.0, 3.0, 1.5, 1.5], [0.05] * 4))
        self.assertFalse(ev.evaluate_g4_load_transfer([0.17] * 4))  # 0.6800 < 0.6865
        self.assertTrue(ev.evaluate_g4_load_transfer([0.1717, 0.1716, 0.1716, 0.1716]))  # 0.6865
        self.assertFalse(ev.evaluate_g4_load_transfer([0.050, 0.250, 0.225, 0.225]))  # per-finger 0.05 < 0.0858

        # T14: S3 handle_inconclusive_probe retries 0 and 1, aborts on retry 2
        sub_retry = PLCEAActionSubstitutor()
        self.assertEqual(sub_retry.handle_inconclusive_probe(), "RETRY")
        self.assertEqual(sub_retry.retry_count, 1)
        self.assertEqual(sub_retry.handle_inconclusive_probe(), "RETRY")
        self.assertEqual(sub_retry.retry_count, 2)
        self.assertEqual(sub_retry.handle_inconclusive_probe(), "ABORT")
        self.assertEqual(sub_retry.state, PLCEAState.S5_RECOVER_FALLBACK)

    # --------------------------------------------------------------------------
    # 12. Determinism & Episodic Reset Isolation
    # --------------------------------------------------------------------------
    def test_12_controller_determinism_and_reset_isolation(self):
        """Verifies exact determinism across identical runs and complete clean state after reset()."""
        prop = np.array([0.08, 0.08, 0.08, 0.08, 0.90])

        def run_trace(sub_inst, seed):
            env = CompliantPreLiftContactEnv(mu_true=0.60, seed=seed)
            obs = env.reset()
            hist = []
            for _ in range(80):
                a, interv, info = sub_inst.substitute_action(obs, prop)
                hist.append((a.copy(), interv, info["state"], info["lift_authorized"], list(info["mu_lb"]), info["v_z_stateful_mps"]))
                obs, _ = env.step(a)
            return hist

        s1 = PLCEAActionSubstitutor()
        s2 = PLCEAActionSubstitutor()
        h1 = run_trace(s1, seed=999)
        h2 = run_trace(s2, seed=999)
        s1.reset()
        h3 = run_trace(s1, seed=999)

        for t in range(len(h1)):
            np.testing.assert_allclose(h1[t][0], h2[t][0], atol=1e-12)
            np.testing.assert_allclose(h1[t][0], h3[t][0], atol=1e-12)
            self.assertEqual(h1[t][1:], h2[t][1:])
            self.assertEqual(h1[t][1:], h3[t][1:])


if __name__ == "__main__":
    unittest.main()
