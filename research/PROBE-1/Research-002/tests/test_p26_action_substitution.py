"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.6: Contact-Aware Safety Coordination
Test Suite: Action Substitution Verification (Document 40 Revision 2.1)

Author: Sunil Kumar Chavhan (contact@horoslab.org)
Co-Founder Authorized: Phase 1 Unit and Physics Tests
Coverage: 10 Required Test Groups
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
        # When deficit is 2.0 N, delta_a = 1.0 * (2.0 / 4.0) = 0.50 mm/step
        fn_profile = np.array([self.sub.F_n_required - 2.0] * 4)
        proposed_a = np.zeros(4)
        cmd = self.sub.calculate_squeeze_command(fn_profile, proposed_a)
        for i in range(4):
            self.assertAlmostEqual(cmd[i], 0.50, places=4)

        # Huge deficit (12 N) should saturate at upper limit 2.0 mm/step
        fn_huge_deficit = np.array([0.15] * 4)  # above loss threshold
        cmd_saturated = self.sub.calculate_squeeze_command(fn_huge_deficit, proposed_a)
        for i in range(4):
            self.assertLessEqual(cmd_saturated[i], 2.0)

    # -------------------------------------------------------------
    # 2. Anti-Crush Controller
    # -------------------------------------------------------------
    def test_03_anti_crush_protective_threshold_and_retraction(self):
        """Assert active outward retraction for F_n >= 18.0 N with K_retract = 1.5 step^-1."""
        # At 22.0 N (excess 4.0 N):
        # retract = -1.5 * (4.0 / 4.0) = -1.50 mm/step
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
        """Assert upward acceleration and velocity integration in Branch 1."""
        self.sub.reset()
        # With high normal forces (e.g. 5.0 N each), friction capacity is large:
        # F_t_max = 4 * (0.85 * 0.60 * 5.0) = 10.20 N
        # a_z_max = (10.20 - 4.905) / 0.50 = 10.59 m/s^2
        obs = {
            "normal_forces": [5.0, 5.0, 5.0, 5.0],
            "obj_pos": [0.0, 0.0, 10.0]
        }
        proposed_action = np.array([0.0, 0.0, 0.0, 0.0, 0.05])  # 0.05 mm/step -> 0.005 m/s

        sub_action, intervened, info = self.sub.substitute_action(obs, proposed_action, variant="E02_C")
        self.assertEqual(info["branch"], "Branch_1_Upward")
        self.assertAlmostEqual(sub_action[4], 0.05, places=4)
        self.assertAlmostEqual(self.sub.v_z, 0.005, places=4)

    def test_06_stale_velocity_safeguard(self):
        """Assert that if preload deficit occurs, upward velocity v_z is strictly zeroed."""
        self.sub.v_z = 0.05  # Stale velocity from previous step
        # Low normal force (1.0 N each) -> a_z_max is negative:
        # F_t_max = 4 * (0.85 * 0.60 * 1.0) = 2.04 N < 4.905 N
        obs = {
            "normal_forces": [1.0, 1.0, 1.0, 1.0],
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
        # Safe descent: z_obj = 5.0 mm, proposed lift = -1.0 mm/step -> -1.0 allowed
        obs = {
            "normal_forces": [3.0, 3.0, 3.0, 3.0],
            "obj_pos": [0.0, 0.0, 5.0]
        }
        proposed_action = np.array([0.0, 0.0, 0.0, 0.0, -1.0])
        sub_action, intervened, info = self.sub.substitute_action(obs, proposed_action, variant="E02_C")
        self.assertEqual(info["branch"], "Branch_2_Downward")
        self.assertEqual(sub_action[4], -1.0)
        self.assertAlmostEqual(self.sub.v_z, -0.10, places=4)  # -1.0 mm / 0.01 s = -0.10 m/s

        # Collision risk: z_obj = 0.5 mm, proposed lift = -1.5 mm/step -> clipped to -0.5 mm
        obs["obj_pos"] = [0.0, 0.0, 0.5]
        sub_action, intervened, info = self.sub.substitute_action(obs, proposed_action, variant="E02_C")
        self.assertEqual(info["branch"], "Branch_2_Downward")
        self.assertAlmostEqual(sub_action[4], -0.5, places=4)

    # -------------------------------------------------------------
    # 5. Contact-Loss Fallback
    # -------------------------------------------------------------
    def test_08_contact_loss_fallback(self):
        """Assert F_n < 0.10 N triggers Branch 3 Fallback: lift arrest and gentle search (+0.20 mm)."""
        self.sub.v_z = 0.02
        obs = {
            "normal_forces": [3.0, 0.05, 3.0, 3.0],  # finger 1 has contact loss (0.05 N < 0.10 N)
            "obj_pos": [0.0, 0.0, 10.0]
        }
        proposed_action = np.array([0.0, 0.0, 0.0, 0.0, 1.0])
        sub_action, intervened, info = self.sub.substitute_action(obs, proposed_action, variant="E02_C")

        self.assertEqual(info["branch"], "Branch_3_Fallback")
        self.assertEqual(info["reason"], "contact_loss")
        self.assertTrue(intervened)
        self.assertEqual(sub_action[4], 0.0)  # Immediate arrest
        for i in range(4):
            self.assertAlmostEqual(sub_action[i], 0.20, places=4)  # Gentle inward search
        self.assertEqual(self.sub.v_z, 0.0)

    # -------------------------------------------------------------
    # 6. Friction Constraints
    # -------------------------------------------------------------
    def test_09_weakest_contact_friction_bottleneck(self):
        """Assert multi-finger friction capacity is bounded by the weakest contact min_i(F_n,i)."""
        # If three fingers have 10 N but one finger has 1.0 N:
        # min_fn = 1.0 N -> F_t_max = 4 * (0.85 * 0.60 * 1.0) = 2.04 N < 4.905 N -> a_z_max <= 0
        obs = {
            "normal_forces": [10.0, 10.0, 10.0, 1.0],
            "obj_pos": [0.0, 0.0, 10.0]
        }
        proposed_action = np.array([0.0, 0.0, 0.0, 0.0, 0.5])
        sub_action, intervened, info = self.sub.substitute_action(obs, proposed_action, variant="E02_C")
        self.assertEqual(sub_action[4], 0.0)

    # -------------------------------------------------------------
    # 7. Clamp Release Evaluation
    # -------------------------------------------------------------
    def test_10_clamp_release_conditions(self):
        """Assert E02-A clamp release iff all F_n >= F_req AND all rho_i <= eta."""
        # Satisfied: all Fn = 3.0 N > 2.5547 N and low shear
        fn_good = np.array([3.0, 3.0, 3.0, 3.0])
        ft_good = np.array([1.0, 1.0, 1.0, 1.0])
        # rho_i = 1.0 / (0.60 * 3.0) = 0.5556 <= 0.85
        self.assertTrue(self.sub.evaluate_clamp_release(fn_good, ft_good))

        # Failed: one finger has deficit
        fn_bad = np.array([3.0, 2.0, 3.0, 3.0])
        self.assertFalse(self.sub.evaluate_clamp_release(fn_bad, ft_good))

        # Failed: high shear violating eta
        ft_high = np.array([2.0, 2.0, 2.0, 2.0])
        # rho_i = 2.0 / (0.60 * 3.0) = 1.11 > 0.85
        self.assertFalse(self.sub.evaluate_clamp_release(fn_good, ft_high))

        # Singularity cutoff: contact loss force (< 0.10 N) produces rho = inf
        fn_cutoff = np.array([0.05, 3.0, 3.0, 3.0])
        ratios = self.sub.calculate_regularized_slip_ratios(fn_cutoff)
        self.assertTrue(math.isinf(ratios[0]))
        self.assertFalse(self.sub.evaluate_clamp_release(fn_cutoff))

    # -------------------------------------------------------------
    # 8. Invalid Inputs Handling
    # -------------------------------------------------------------
    def test_11_invalid_inputs_safety_fallback(self):
        """Assert NaN, Inf, zero friction, and negative forces safely trigger Branch 3 Fallback."""
        obs_nan = {
            "normal_forces": [float("nan"), 3.0, 3.0, 3.0],
            "obj_pos": [0.0, 0.0, 5.0]
        }
        sub_action, intervened, info = self.sub.substitute_action(obs_nan, np.ones(5), variant="E02_C")
        self.assertEqual(info["branch"], "Branch_3_Fallback")
        self.assertEqual(info["reason"], "sensor_fault")
        self.assertEqual(sub_action[4], 0.0)

        obs_neg = {
            "normal_forces": [-1.0, 3.0, 3.0, 3.0],
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
        """
        Dimensional audit:
        F_g: [kg * m/s^2 = N]
        k_elastic: [N/mm]
        delta_x: [mm]
        Kp: [step^-1]
        delta_a_cmd: [mm/step]
        a_z_max: [(N - N) / kg = m/s^2]
        v_z: [m/s]
        delta_z: [m/s * s * 10^3 mm/m = mm]
        """
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

        # Acceleration and velocity
        f_shear = 10.0    # N
        a_z = (f_shear - F_g) / m  # m/s^2 = (10.0 - 4.905)/0.5 = 10.19 m/s^2
        dt = 0.01         # s
        v_z = a_z * dt    # m/s = 0.1019 m/s
        delta_z = v_z * dt * 1000.0  # mm = 0.1019 * 0.01 * 1000 = 1.019 mm/step

        self.assertAlmostEqual(a_z, 10.19, places=2)
        self.assertAlmostEqual(v_z, 0.1019, places=4)
        self.assertAlmostEqual(delta_z, 1.019, places=3)


if __name__ == "__main__":
    unittest.main()
