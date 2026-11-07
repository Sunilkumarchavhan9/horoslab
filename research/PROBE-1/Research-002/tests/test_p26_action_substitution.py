"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.6: Contact-Aware Safety Coordination
Test Suite: Action Substitution Verification & Adversarial Safety Audit
(Document 40 Revision 2.1, Document 41 Implementation Audit & Document 42 Readiness Gate)

Author: Sunil Kumar Chavhan (contact@horoslab.org)
Coverage:
- 13 Baseline Unit & Kinematic Physics Tests
- 5 Document 41 Adversarial & Border Safety Tests (Issues 1-4)
- 5 Document 42 Readiness Gate Tests (Blockers A, B, C)
Total: 23 Targeted Unit & Physics Tests
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

from src.coordination.action_substitutor import ContactAwareActionSubstitutor


class TestP26ActionSubstitution(unittest.TestCase):
    def setUp(self):
        self.sub = ContactAwareActionSubstitutor(
            object_mass=0.50,
            gravity=9.81,
            num_fingers=4,
            friction_coeff=0.60,
            elastic_stiffness=4.0,
            dynamic_safety_margin=1.25,
            friction_margin_eta=0.85,
            dt=0.01,
            max_crush_force=18.0,
            hard_environment_limit=25.0,
            contact_loss_threshold=0.10,
            kp_squeeze=1.0,
            k_retract=1.5
        )

    # -------------------------------------------------------------
    # 1. Squeeze Controller
    # -------------------------------------------------------------
    def test_01_force_deficit_calculation(self):
        """Assert force deficit Delta F_n = max(0, F_req - F_n) with F_req = 2.5547 N."""
        expected_f_req = (1.25 * 0.50 * 9.81) / (4 * 0.60)
        self.assertAlmostEqual(self.sub.F_n_required, expected_f_req, places=4)
        self.assertAlmostEqual(self.sub.F_n_required, 2.5547, places=3)

        fn_profile = np.array([1.0, 2.0, 2.5547, 4.0])
        deficits = self.sub.calculate_force_deficit(fn_profile)
        self.assertAlmostEqual(deficits[0], 2.5547 - 1.0, places=4)
        self.assertAlmostEqual(deficits[1], 2.5547 - 2.0, places=4)
        self.assertAlmostEqual(deficits[2], 0.0, places=4)
        self.assertAlmostEqual(deficits[3], 0.0, places=4)

    def test_02_squeeze_proportional_command_and_clipping(self):
        """Assert proportional command delta_a = Kp * (Delta F_n / k_elastic) clipped to [-2.0, 2.0]."""
        fn_profile = np.array([self.sub.F_n_required - 2.0] * 4)
        proposed_a = np.zeros(4)
        cmd = self.sub.calculate_squeeze_command(fn_profile, proposed_a)
        for i in range(4):
            self.assertAlmostEqual(cmd[i], 0.50, places=4)

        # Large deficit saturates at upper limit 2.0 mm/step
        fn_huge_deficit = np.array([0.15] * 4)
        cmd_saturated = self.sub.calculate_squeeze_command(fn_huge_deficit, proposed_a)
        for i in range(4):
            self.assertLessEqual(cmd_saturated[i], 2.0)

    # -------------------------------------------------------------
    # 2. Anti-Crush Controller
    # -------------------------------------------------------------
    def test_03_anti_crush_protective_threshold_and_retraction(self):
        """Assert active outward retraction for F_n >= 18.0 N with K_retract = 1.5 step^-1."""
        fn_excess = np.array([22.0, 22.0, 22.0, 22.0])
        proposed_squeeze = np.array([0.5, 0.5, 0.5, 0.5])
        cmd = self.sub.calculate_squeeze_command(fn_excess, proposed_squeeze)
        for i in range(4):
            self.assertAlmostEqual(cmd[i], -1.50, places=4)

    def test_04_hard_environment_limit_override(self):
        """Assert forces exceeding 25.0 N saturate maximum negative retraction (-2.0 mm/step)."""
        fn_hard_limit = np.array([26.0, 26.0, 26.0, 26.0])
        cmd = self.sub.calculate_squeeze_command(fn_hard_limit, np.zeros(4))
        for i in range(4):
            self.assertEqual(cmd[i], -2.0)

    # -------------------------------------------------------------
    # 3. Lift Controller & Stateful Integration
    # -------------------------------------------------------------
    def test_05_lift_acceleration_and_velocity_integration(self):
        """Assert upward acceleration and velocity integration in Branch 1 with measured shear."""
        self.sub.reset()
        obs = {
            "normal_forces": [5.0, 5.0, 5.0, 5.0],
            "finger_shear_force": [1.0, 1.0, 1.0, 1.0],
            "obj_pos": [0.0, 0.0, 10.0]
        }
        proposed_action = np.array([0.0, 0.0, 0.0, 0.0, 0.05])

        sub_action, intervened, info = self.sub.substitute_action(obs, proposed_action, variant="E02_C")
        self.assertEqual(info["branch"], "Branch_1_Upward")
        self.assertAlmostEqual(sub_action[4], 0.05, places=4)
        self.assertAlmostEqual(self.sub.v_z, 0.005, places=4)

    def test_06_stale_velocity_safeguard(self):
        """Assert that if preload deficit occurs, upward velocity v_z is strictly zeroed."""
        self.sub.v_z = 0.05
        obs = {
            "normal_forces": [1.0, 1.0, 1.0, 1.0],
            "finger_shear_force": [0.2, 0.2, 0.2, 0.2],
            "obj_pos": [0.0, 0.0, 10.0]
        }
        proposed_action = np.array([0.0, 0.0, 0.0, 0.0, 1.0])

        sub_action, intervened, info = self.sub.substitute_action(obs, proposed_action, variant="E02_C")
        self.assertEqual(info["branch"], "Branch_1_Upward")
        self.assertEqual(sub_action[4], 0.0)
        self.assertEqual(self.sub.v_z, 0.0)

    # -------------------------------------------------------------
    # 4. Downward Controller
    # -------------------------------------------------------------
    def test_07_downward_command_passthrough_and_table_guard(self):
        """Assert Branch 2 passes negative commands and enforces table collision guard z_obj + a_lift >= 0."""
        self.sub.reset()
        obs = {
            "normal_forces": [3.0, 3.0, 3.0, 3.0],
            "finger_shear_force": [1.0, 1.0, 1.0, 1.0],
            "obj_pos": [0.0, 0.0, 5.0]
        }
        proposed_action = np.array([0.0, 0.0, 0.0, 0.0, -1.0])
        sub_action, intervened, info = self.sub.substitute_action(obs, proposed_action, variant="E02_C")
        self.assertEqual(info["branch"], "Branch_2_Downward")
        self.assertEqual(sub_action[4], -1.0)
        self.assertAlmostEqual(self.sub.v_z, -0.10, places=4)

        # Collision risk: z_obj = 0.5 mm, proposed lift = -1.5 mm -> clipped to -0.5 mm
        obs["obj_pos"] = [0.0, 0.0, 0.5]
        sub_action, intervened, info = self.sub.substitute_action(obs, proposed_action, variant="E02_C")
        self.assertEqual(info["branch"], "Branch_2_Downward")
        self.assertAlmostEqual(sub_action[4], -0.5, places=4)

    # -------------------------------------------------------------
    # 5. Contact-Loss Fallback (Issue 1)
    # -------------------------------------------------------------
    def test_08_contact_loss_fallback_per_finger(self):
        """
        Assert contact loss triggers Branch 3 Fallback: lift arrest and per-finger response.
        Unseated finger searches (+0.2mm), seated finger holds stationary (0.0mm).
        """
        self.sub.v_z = 0.02
        obs = {
            "normal_forces": [3.0, 0.05, 3.0, 3.0],
            "finger_shear_force": [0.5, 0.0, 0.5, 0.5],
            "obj_pos": [0.0, 0.0, 10.0]
        }
        proposed_action = np.array([0.0, 0.0, 0.0, 0.0, 1.0])
        sub_action, intervened, info = self.sub.substitute_action(obs, proposed_action, variant="E02_C")

        self.assertEqual(info["branch"], "Branch_3_Fallback")
        self.assertEqual(info["reason"], "contact_loss")
        self.assertTrue(intervened)
        self.assertEqual(sub_action[4], 0.0)
        self.assertEqual(self.sub.v_z, 0.0)

        # Per-finger check
        self.assertAlmostEqual(sub_action[1], 0.20, places=4)
        self.assertEqual(sub_action[0], 0.0)
        self.assertEqual(sub_action[2], 0.0)
        self.assertEqual(sub_action[3], 0.0)

    # -------------------------------------------------------------
    # 6. Friction Constraints
    # -------------------------------------------------------------
    def test_09_weakest_contact_friction_bottleneck(self):
        """Assert multi-finger friction capacity is bounded by the weakest contact min_i(F_n,i)."""
        obs = {
            "normal_forces": [10.0, 10.0, 10.0, 1.0],
            "finger_shear_force": [1.0, 1.0, 1.0, 1.0],
            "obj_pos": [0.0, 0.0, 10.0]
        }
        proposed_action = np.array([0.0, 0.0, 0.0, 0.0, 0.5])
        sub_action, intervened, info = self.sub.substitute_action(obs, proposed_action, variant="E02_C")
        self.assertEqual(sub_action[4], 0.0)

    # -------------------------------------------------------------
    # 7. Clamp Release Evaluation (Issue 3)
    # -------------------------------------------------------------
    def test_10_clamp_release_conditions(self):
        """Assert E02-A clamp release iff all F_n >= F_req AND all rho_i <= eta with measured shear."""
        fn_good = np.array([3.0, 3.0, 3.0, 3.0])
        ft_good = np.array([1.0, 1.0, 1.0, 1.0])
        self.assertTrue(self.sub.evaluate_clamp_release(fn_good, ft_good))

        # Deficit
        fn_bad = np.array([3.0, 2.0, 3.0, 3.0])
        self.assertFalse(self.sub.evaluate_clamp_release(fn_bad, ft_good))

        # High shear
        ft_high = np.array([2.0, 2.0, 2.0, 2.0])
        self.assertFalse(self.sub.evaluate_clamp_release(fn_good, ft_high))

        # Singularity cutoff
        fn_cutoff = np.array([0.05, 3.0, 3.0, 3.0])
        ratios = self.sub.calculate_regularized_slip_ratios(fn_cutoff, ft_good)
        self.assertTrue(math.isinf(ratios[0]))
        self.assertFalse(self.sub.evaluate_clamp_release(fn_cutoff, ft_good))

    # -------------------------------------------------------------
    # 8. Invalid Inputs Handling
    # -------------------------------------------------------------
    def test_11_invalid_inputs_safety_fallback(self):
        """Assert NaN, Inf, zero friction, and negative forces safely trigger Branch 3 Fallback."""
        obs_nan = {
            "normal_forces": [float("nan"), 3.0, 3.0, 3.0],
            "finger_shear_force": [1.0, 1.0, 1.0, 1.0],
            "obj_pos": [0.0, 0.0, 5.0]
        }
        sub_action, intervened, info = self.sub.substitute_action(obs_nan, np.ones(5), variant="E02_C")
        self.assertEqual(info["branch"], "Branch_3_Fallback")
        self.assertEqual(info["reason"], "sensor_fault")
        self.assertEqual(sub_action[4], 0.0)
        np.testing.assert_array_equal(sub_action[:4], np.zeros(4))

        obs_neg = {
            "normal_forces": [-1.0, 3.0, 3.0, 3.0],
            "finger_shear_force": [1.0, 1.0, 1.0, 1.0],
            "obj_pos": [0.0, 0.0, 5.0]
        }
        sub_action, intervened, info = self.sub.substitute_action(obs_neg, np.ones(5), variant="E02_C")
        self.assertEqual(info["branch"], "Branch_3_Fallback")
        self.assertEqual(info["reason"], "sensor_fault")

    # -------------------------------------------------------------
    # 9. Determinism
    # -------------------------------------------------------------
    def test_12_controller_determinism(self):
        """Assert identical inputs produce bitwise identical outputs across repeated calls."""
        obs = {
            "normal_forces": [2.1, 2.8, 3.4, 1.9],
            "finger_shear_force": [0.5, 0.6, 0.7, 0.4],
            "obj_pos": [0.0, 0.0, 2.5]
        }
        action = np.array([0.1, 0.2, 0.3, 0.4, 0.5])

        sub1 = ContactAwareActionSubstitutor()
        sub2 = ContactAwareActionSubstitutor()

        a1, i1, info1 = sub1.substitute_action(obs, action, variant="E02_C")
        a2, i2, info2 = sub2.substitute_action(obs, action, variant="E02_C")

        np.testing.assert_array_equal(a1, a2)
        self.assertEqual(i1, i2)
        self.assertEqual(info1, info2)

    # -------------------------------------------------------------
    # 10. Physical Units & Dimensional Consistency
    # -------------------------------------------------------------
    def test_13_physical_units_and_dimensions(self):
        """Dimensional audit for forces, stiffnesses, accelerations, and velocities."""
        m = 0.50          # kg
        g = 9.81          # m/s^2
        F_g = m * g       # N = 4.905
        k_el = 4.0        # N/mm
        delta_fn = 2.0    # N
        delta_x = delta_fn / k_el  # mm = 0.5 mm
        Kp = 1.0          # step^-1
        delta_a = Kp * delta_x     # mm/step = 0.5 mm/step

        self.assertAlmostEqual(F_g, 4.905, places=4)
        self.assertAlmostEqual(delta_x, 0.5, places=4)
        self.assertAlmostEqual(delta_a, 0.5, places=4)

        f_shear = 10.0    # N
        a_z = (f_shear - F_g) / m
        dt = 0.01         # s
        v_z = a_z * dt
        delta_z = v_z * dt * 1000.0

        self.assertAlmostEqual(a_z, 10.19, places=2)
        self.assertAlmostEqual(v_z, 0.1019, places=4)
        self.assertAlmostEqual(delta_z, 1.019, places=3)

    # -------------------------------------------------------------
    # 11. Adversarial Test: Contact Loss Combined with Overforce (Issue 1 & 4)
    # -------------------------------------------------------------
    def test_14_adversarial_contact_loss_with_overforce(self):
        """
        Adversarial test for Issue 1 & Issue 4:
        Finger 0: 0.05 N (contact loss) -> must search (+0.20 mm/step)
        Finger 1: 22.0 N (protective crush ceiling) -> must actively retract (-1.50 mm/step)
        Finger 2: 3.0 N (nominal seated) -> must hold stationary (0.00 mm/step)
        Finger 3: 26.0 N (hard environment limit breach) -> must hard-saturate retract (-2.00 mm/step)
        Upward lift: must be completely arrested (0.00 mm/step).
        """
        self.sub.v_z = 0.05
        obs = {
            "normal_forces": [0.05, 22.0, 3.0, 26.0],
            "finger_shear_force": [0.0, 2.0, 0.5, 2.0],
            "obj_pos": [0.0, 0.0, 10.0]
        }
        proposed_action = np.array([0.5, 0.5, 0.5, 0.5, 1.0])

        sub_action, intervened, info = self.sub.substitute_action(obs, proposed_action, variant="E02_C")

        self.assertEqual(info["branch"], "Branch_3_Fallback")
        self.assertEqual(info["reason"], "contact_loss")
        self.assertTrue(intervened)
        self.assertEqual(sub_action[4], 0.0)
        self.assertEqual(self.sub.v_z, 0.0)

        self.assertAlmostEqual(sub_action[0], 0.20, places=4)
        self.assertAlmostEqual(sub_action[1], -1.50, places=4)
        self.assertEqual(sub_action[2], 0.0)
        self.assertEqual(sub_action[3], -2.0)

    # -------------------------------------------------------------
    # 12. Adversarial Test: NaN/Inf Shear Telemetry Rejection (Issue 2)
    # -------------------------------------------------------------
    def test_15_nan_inf_shear_telemetry_rejection(self):
        """Assert NaN or Inf shear force cannot bypass slip check and routes to sensor fault."""
        obs_nan_shear = {
            "normal_forces": [3.0, 3.0, 3.0, 3.0],
            "finger_shear_force": [float("nan"), 1.0, 1.0, 1.0],
            "obj_pos": [0.0, 0.0, 5.0]
        }
        proposed_action = np.array([0.0, 0.0, 0.0, 0.0, 1.0])
        sub_action, intervened, info = self.sub.substitute_action(obs_nan_shear, proposed_action, variant="E02_C")
        self.assertEqual(info["branch"], "Branch_3_Fallback")
        self.assertEqual(info["reason"], "sensor_fault")
        self.assertEqual(sub_action[4], 0.0)
        np.testing.assert_array_equal(sub_action[:4], np.zeros(4))

        ratios = self.sub.calculate_regularized_slip_ratios(
            np.array([3.0, 3.0, 3.0, 3.0]),
            np.array([float("inf"), 1.0, 1.0, 1.0])
        )
        self.assertTrue(np.all(np.isinf(ratios)))

    # -------------------------------------------------------------
    # 13. Missing Shear Blocks Clamp Release (Issue 3)
    # -------------------------------------------------------------
    def test_16_unmeasured_shear_blocks_clamp_release(self):
        """Assert evaluate_clamp_release strictly returns False when shear is unmeasured (None)."""
        fn_good = np.array([3.0, 3.0, 3.0, 3.0])
        self.assertFalse(self.sub.evaluate_clamp_release(fn_good, ft_profile=None))

        obs_no_shear = {
            "normal_forces": [3.0, 3.0, 3.0, 3.0],
            "obj_pos": [0.0, 0.0, 5.0]
        }
        proposed_action = np.array([0.0, 0.0, 0.0, 0.0, 1.0])
        sub_action, intervened, info = self.sub.substitute_action(obs_no_shear, proposed_action, variant="E02_A")
        self.assertEqual(info["branch"], "E02_A_Clamped")
        self.assertEqual(sub_action[4], 0.0)

    # -------------------------------------------------------------
    # 14. Independent 18 N vs 25 N Boundary Responses (Issue 4)
    # -------------------------------------------------------------
    def test_17_independent_18N_vs_25N_boundaries(self):
        """Assert independent and distinct behavior across 18 N protective ceiling and 25 N hard limit."""
        # Zone B: 18 N <= Fn < 25 N -> Proportional active retraction
        fn_20 = np.array([20.0, 20.0, 20.0, 20.0])
        cmd_20 = self.sub.calculate_squeeze_command(fn_20, np.zeros(4))
        for i in range(4):
            self.assertAlmostEqual(cmd_20[i], -0.75, places=4)

        # Zone A: Fn >= 25.0 N -> Hard environment limit saturation (-2.00 mm/step)
        fn_25 = np.array([25.0, 25.0, 25.0, 25.0])
        cmd_25 = self.sub.calculate_squeeze_command(fn_25, np.zeros(4))
        for i in range(4):
            self.assertEqual(cmd_25[i], -2.0)

        # In substitute_action: Fn >= 25 N triggers immediate lift arrest override
        obs_hard_breach = {
            "normal_forces": [25.5, 3.0, 3.0, 3.0],
            "finger_shear_force": [1.0, 1.0, 1.0, 1.0],
            "obj_pos": [0.0, 0.0, 5.0]
        }
        sub_action, intervened, info = self.sub.substitute_action(
            obs_hard_breach, np.array([0.0, 0.0, 0.0, 0.0, 2.0]), variant="E02_C"
        )
        self.assertEqual(info["branch"], "Branch_Hard_Limit_Arrest")
        self.assertEqual(sub_action[4], 0.0)
        self.assertEqual(sub_action[0], -2.0)

    # -------------------------------------------------------------
    # 15. Malformed Proposed Action Guarding (Issue 4)
    # -------------------------------------------------------------
    def test_18_malformed_proposed_action_guarding(self):
        """Assert truncated vectors, non-finite values, and None actions are safely arrested."""
        obs = {
            "normal_forces": [3.0, 3.0, 3.0, 3.0],
            "finger_shear_force": [1.0, 1.0, 1.0, 1.0],
            "obj_pos": [0.0, 0.0, 5.0]
        }

        # None action
        sub_a, intv, info = self.sub.substitute_action(obs, None)
        self.assertEqual(info["reason"], "none_proposed_action")
        np.testing.assert_array_equal(sub_a, np.zeros(5))

        # Truncated action (length 3 < 5)
        sub_a, intv, info = self.sub.substitute_action(obs, np.array([0.1, 0.2, 0.3]))
        self.assertEqual(info["reason"], "malformed_proposed_action_shape_or_nonfinite")
        np.testing.assert_array_equal(sub_a, np.zeros(5))

        # Non-finite action (NaN)
        sub_a, intv, info = self.sub.substitute_action(obs, np.array([0.0, 0.0, float("nan"), 0.0, 1.0]))
        self.assertEqual(info["reason"], "malformed_proposed_action_shape_or_nonfinite")
        np.testing.assert_array_equal(sub_a, np.zeros(5))

    # -------------------------------------------------------------
    # 16. Document 42 Blocker C: Constructor Domain Validation
    # -------------------------------------------------------------
    def test_19_constructor_domain_validation(self):
        """Assert ValueError is raised on invalid physical configurations at initialization."""
        # Non-positive mass
        with self.assertRaises(ValueError):
            ContactAwareActionSubstitutor(object_mass=-0.5)
        with self.assertRaises(ValueError):
            ContactAwareActionSubstitutor(object_mass=0.0)

        # Non-positive gravity
        with self.assertRaises(ValueError):
            ContactAwareActionSubstitutor(gravity=-9.81)

        # Invalid finger count
        with self.assertRaises(ValueError):
            ContactAwareActionSubstitutor(num_fingers=0)
        with self.assertRaises(ValueError):
            ContactAwareActionSubstitutor(num_fingers=-2)

        # Non-positive stiffness
        with self.assertRaises(ValueError):
            ContactAwareActionSubstitutor(elastic_stiffness=-4.0)

        # Non-positive timestep
        with self.assertRaises(ValueError):
            ContactAwareActionSubstitutor(dt=0.0)

        # Invalid safety margins
        with self.assertRaises(ValueError):
            ContactAwareActionSubstitutor(dynamic_safety_margin=0.8)  # must be >= 1.0
        with self.assertRaises(ValueError):
            ContactAwareActionSubstitutor(friction_margin_eta=1.5)    # must be <= 1.0

        # Inverted ceilings (max_crush_force >= hard_environment_limit)
        with self.assertRaises(ValueError):
            ContactAwareActionSubstitutor(max_crush_force=30.0, hard_environment_limit=25.0)

        # Invalid contact loss threshold
        with self.assertRaises(ValueError):
            ContactAwareActionSubstitutor(contact_loss_threshold=0.0)
        with self.assertRaises(ValueError):
            ContactAwareActionSubstitutor(contact_loss_threshold=20.0, max_crush_force=18.0)

        # Non-positive gains
        with self.assertRaises(ValueError):
            ContactAwareActionSubstitutor(kp_squeeze=-1.0)
        with self.assertRaises(ValueError):
            ContactAwareActionSubstitutor(k_retract=0.0)

    # -------------------------------------------------------------
    # 17. Document 42 Blocker B: Strict Normal Force Shape Validation
    # -------------------------------------------------------------
    def test_20_strict_shape_validation_normal_forces(self):
        """Assert malformed shapes (nested 2D, scalar, oversized, truncated) trigger sensor fault."""
        valid_shear = [1.0, 1.0, 1.0, 1.0]
        valid_pos = [0.0, 0.0, 5.0]
        act = np.array([0.0, 0.0, 0.0, 0.0, 1.0])

        # Nested 2D list: [[1, 2, 3, 4]]
        obs_nested = {"normal_forces": [[1.0, 2.0, 3.0, 4.0]], "finger_shear_force": valid_shear, "obj_pos": valid_pos}
        sub_a, intv, info = self.sub.substitute_action(obs_nested, act)
        self.assertEqual(info["reason"], "sensor_fault")
        np.testing.assert_array_equal(sub_a, np.zeros(5))

        # Scalar float
        obs_scalar = {"normal_forces": 3.0, "finger_shear_force": valid_shear, "obj_pos": valid_pos}
        sub_a, intv, info = self.sub.substitute_action(obs_scalar, act)
        self.assertEqual(info["reason"], "sensor_fault")

        # Oversized (5 elements instead of 4)
        obs_over = {"normal_forces": [3.0, 3.0, 3.0, 3.0, 3.0], "finger_shear_force": valid_shear, "obj_pos": valid_pos}
        sub_a, intv, info = self.sub.substitute_action(obs_over, act)
        self.assertEqual(info["reason"], "sensor_fault")

        # Truncated (3 elements instead of 4)
        obs_trunc = {"normal_forces": [3.0, 3.0, 3.0], "finger_shear_force": valid_shear, "obj_pos": valid_pos}
        sub_a, intv, info = self.sub.substitute_action(obs_trunc, act)
        self.assertEqual(info["reason"], "sensor_fault")

    # -------------------------------------------------------------
    # 18. Document 42 Blocker B: Strict Shear Force Shape Validation
    # -------------------------------------------------------------
    def test_21_strict_shape_validation_shear_forces(self):
        """Assert malformed shear shapes (3D, wrong width 2D, truncated) trigger sensor fault."""
        valid_fn = [3.0, 3.0, 3.0, 3.0]
        valid_pos = [0.0, 0.0, 5.0]
        act = np.array([0.0, 0.0, 0.0, 0.0, 1.0])

        # 3D shear array
        obs_3d = {"normal_forces": valid_fn, "finger_shear_force": np.ones((4, 2, 2)), "obj_pos": valid_pos}
        sub_a, intv, info = self.sub.substitute_action(obs_3d, act)
        self.assertEqual(info["reason"], "sensor_fault")

        # 2D shear array with wrong column dimension (4, 3)
        obs_wrong_col = {"normal_forces": valid_fn, "finger_shear_force": np.ones((4, 3)), "obj_pos": valid_pos}
        sub_a, intv, info = self.sub.substitute_action(obs_wrong_col, act)
        self.assertEqual(info["reason"], "sensor_fault")

        # Truncated shear array (3,)
        obs_trunc = {"normal_forces": valid_fn, "finger_shear_force": [1.0, 1.0, 1.0], "obj_pos": valid_pos}
        sub_a, intv, info = self.sub.substitute_action(obs_trunc, act)
        self.assertEqual(info["reason"], "sensor_fault")

        # Valid 2D shear array (4, 2) is accepted and processed cleanly
        obs_valid_2d = {"normal_forces": [5.0, 5.0, 5.0, 5.0], "finger_shear_force": np.ones((4, 2)) * 0.5, "obj_pos": valid_pos}
        sub_a, intv, info = self.sub.substitute_action(obs_valid_2d, np.array([0.0, 0.0, 0.0, 0.0, 0.05]), variant="E02_C")
        self.assertEqual(info["branch"], "Branch_1_Upward")
        self.assertTrue(info["shear_measured"])

    # -------------------------------------------------------------
    # 19. Document 42 Blocker B: Strict Object Position & Proposed Action Validation
    # -------------------------------------------------------------
    def test_22_strict_shape_validation_object_pos_and_action(self):
        """Assert malformed object position (wrong dimension, NaN) and action shapes are rejected."""
        valid_fn = [3.0, 3.0, 3.0, 3.0]
        valid_ft = [1.0, 1.0, 1.0, 1.0]

        # obj_pos has 4 elements
        obs_pos_4 = {"normal_forces": valid_fn, "finger_shear_force": valid_ft, "obj_pos": [0.0, 0.0, 5.0, 1.0]}
        sub_a, intv, info = self.sub.substitute_action(obs_pos_4, np.zeros(5))
        self.assertEqual(info["reason"], "sensor_fault")

        # obj_pos has NaN
        obs_pos_nan = {"normal_forces": valid_fn, "finger_shear_force": valid_ft, "obj_pos": [0.0, 0.0, float("nan")]}
        sub_a, intv, info = self.sub.substitute_action(obs_pos_nan, np.zeros(5))
        self.assertEqual(info["reason"], "sensor_fault")

        # Action is 2D array (1, 5)
        obs_valid = {"normal_forces": valid_fn, "finger_shear_force": valid_ft, "obj_pos": [0.0, 0.0, 5.0]}
        sub_a, intv, info = self.sub.substitute_action(obs_valid, np.zeros((1, 5)))
        self.assertEqual(info["reason"], "malformed_proposed_action_shape_or_nonfinite")

        # Action is oversized (6,)
        sub_a, intv, info = self.sub.substitute_action(obs_valid, np.zeros(6))
        self.assertEqual(info["reason"], "malformed_proposed_action_shape_or_nonfinite")

    # -------------------------------------------------------------
    # 20. Document 42 Blocker A: Missing Shear Unconditionally Blocks Upward Lift
    # -------------------------------------------------------------
    def test_23_missing_shear_unconditionally_blocks_upward_lift(self):
        """
        Blocker A: Missing shear must not authorize upward motion under ANY variant.
        Assert that when finger_shear_force is missing, upward lift is arrested.
        Downward motion is safely permitted.
        """
        obs_no_shear = {
            "normal_forces": [5.0, 5.0, 5.0, 5.0],  # normal force is fully adequate
            "obj_pos": [0.0, 0.0, 10.0]
        }
        proposed_upward = np.array([0.0, 0.0, 0.0, 0.0, 1.0])

        for variant in ["E02_B", "E02_C", "E02_D"]:
            self.sub.v_z = 0.05
            sub_a, intv, info = self.sub.substitute_action(obs_no_shear, proposed_upward, variant=variant)
            self.assertEqual(info["branch"], "Branch_Unmeasured_Shear_Lift_Blocked", f"Failed on {variant}")
            self.assertEqual(sub_a[4], 0.0, f"Lift not zeroed on {variant}")
            self.assertEqual(self.sub.v_z, 0.0, f"Velocity not zeroed on {variant}")
            self.assertFalse(info["shear_measured"])
            self.assertEqual(info["shear_source"], "unmeasured_nominal_diagnostic")

        # Baseline C2 also blocks upward lift if shear is unmeasured
        sub_a, intv, info = self.sub.substitute_action(obs_no_shear, proposed_upward, variant="baseline_C2")
        self.assertEqual(info["branch"], "Baseline_C2")
        self.assertEqual(sub_a[4], 0.0)

        # Downward motion remains safely permitted
        proposed_downward = np.array([0.0, 0.0, 0.0, 0.0, -1.0])
        sub_a, intv, info = self.sub.substitute_action(obs_no_shear, proposed_downward, variant="E02_C")
        self.assertEqual(info["branch"], "Branch_2_Downward")
        self.assertEqual(sub_a[4], -1.0)


if __name__ == "__main__":
    unittest.main()
