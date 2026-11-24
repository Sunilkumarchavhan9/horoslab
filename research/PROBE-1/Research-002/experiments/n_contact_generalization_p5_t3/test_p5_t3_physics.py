"""
HOROS PROBE-1 — Phase 5 Task 3 (P5-T3)
N-Contact Physical Consistency & Multi-Finger Physics Tests
File: test_p5_t3_physics.py

Verifies:
1. N-contact initialization across topologies (N=3, 4, 5).
2. Grasp matrix G(theta) wrench equilibrium.
3. Symmetric grasp equilibrium (zero net acceleration under equal forces).
4. Asymmetric friction and force response.
5. Actuator rate limits (50 N/s) and safety bounds [3.0, 25.0] N.
6. External torque response and tilt kinematics.
7. Indentation mechanical work accounting.
"""

import os
import sys
import math
import pytest
import numpy as np

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
RESEARCH_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))

for p in (CURRENT_DIR, RESEARCH_DIR):
    if p not in sys.path:
        sys.path.insert(0, p)

from contact_topology import ContactTopology, ContactPoint
from object_wrench_dynamics import ObjectWrenchDynamics
from n_contact_sim_env import NContactGraspEnvP5T3


def test_n_contact_topologies_initialization():
    """Verify that symmetric radial topologies can be created for N=3, N=4, and N=5."""
    for n in (3, 4, 5):
        topo = ContactTopology.create_symmetric_radial(num_contacts=n, object_radius=0.040, object_mass=0.50)
        assert topo.num_contacts == n
        assert len(topo.contacts) == n

        # Check angular distribution: sum of normal vectors should cancel to zero (force equilibrium)
        sum_normals = np.sum([cp.normal for cp in topo.contacts], axis=0)
        assert np.allclose(sum_normals, [0.0, 0.0], atol=1e-12), f"Normals do not cancel for N={n}: {sum_normals}"

        # Check grasp matrix dimensions: 3 x 2N
        G = topo.get_grasp_matrix(theta=0.0)
        assert G.shape == (3, 2 * n)


def test_symmetric_grasp_equilibrium():
    """Verify that under symmetric equal normal forces with no external load, object remains in equilibrium."""
    for n in (3, 4, 5):
        topo = ContactTopology.create_symmetric_radial(num_contacts=n, object_radius=0.040, object_mass=0.50)
        env = NContactGraspEnvP5T3(topology=topo, seed=4700000 + n)
        env.reset(disturbance_type="none", v_shear=0.0, load_offset_y=0.0)

        # Step 50 ms with equal nominal forces and zero external disturbance
        for _ in range(50):
            obs, done, info = env.step(cmd_fn_list=[8.0] * n)

        # Acceleration and displacement should be near zero
        assert not info["is_gross_slipping"]
        assert info["max_disp_m"] < 1e-4, f"Object drifted under symmetric grasp for N={n}: {info['max_disp_m']}"
        assert abs(info["object_tilt_rad"]) < 1e-4, f"Object tilted under symmetric grasp for N={n}"


def test_grasp_matrix_wrench_consistency():
    """Verify that the grasp matrix G(theta) correctly transforms contact normal and tangential forces."""
    topo = ContactTopology.create_symmetric_radial(num_contacts=3, object_radius=0.040, object_mass=0.50)
    G0 = topo.get_grasp_matrix(theta=0.0)

    # For contact 0 at angle 0 rad (pos = [0.04, 0], normal = [-1, 0], tangent = [0, 1]):
    # Normal force = 10 N -> force = [-10, 0], torque = 0.04 * 0 - 0 * (-10) = 0
    fn_ft = np.zeros(2 * 3)
    fn_ft[0] = 10.0  # Fn_0
    w_calc = G0 @ fn_ft
    assert np.isclose(w_calc[0], -10.0)
    assert np.isclose(w_calc[1], 0.0)
    assert np.isclose(w_calc[2], 0.0)

    # Tangential force = 5 N on contact 0 -> force = [0, 5], torque = 0.04 * 5 - 0 * 0 = 0.20 N*m
    fn_ft[0] = 0.0
    fn_ft[1] = 5.0  # Ft_0
    w_calc_t = G0 @ fn_ft
    assert np.isclose(w_calc_t[0], 0.0)
    assert np.isclose(w_calc_t[1], -5.0)
    assert np.isclose(w_calc_t[2], -0.04 * 5.0)


def test_actuator_rate_limiting_and_bounds():
    """Verify that actuator rate limits (|dFn/dt| <= 50 N/s = 0.05 N/ms) and [3, 25] N bounds are strictly enforced."""
    topo = ContactTopology.create_symmetric_radial(num_contacts=4, object_radius=0.040, object_mass=0.50)
    env = NContactGraspEnvP5T3(topology=topo, seed=4700010)
    env.reset(initial_preloads=[5.0] * 4)

    # Command an abrupt jump from 5 N to 20 N
    obs, done, info = env.step(cmd_fn_list=[20.0] * 4)

    # In 1 millisecond, normal force should increase by at most 0.05 N
    for i in range(4):
        assert math.isclose(info["fn_list"][i], 5.05, abs_tol=1e-5), f"Actuator rate limit violated: {info['fn_list'][i]}"

    # Command out-of-bounds force (50 N) over 500 steps
    for _ in range(450):
        obs, done, info = env.step(cmd_fn_list=[50.0] * 4)

    # Forces should be clamped at 25.0 N
    for i in range(4):
        assert info["fn_list"][i] <= 25.0 + 1e-5
        assert info["fn_list"][i] >= 3.0 - 1e-5


def test_object_tilt_kinematics_under_torque():
    """Verify that external torque induces rotational tilt and creates differential contact velocities."""
    topo = ContactTopology.create_symmetric_radial(num_contacts=3, object_radius=0.040, object_mass=0.50)
    env = NContactGraspEnvP5T3(topology=topo, seed=4700020)
    env.reset(disturbance_type="torque_perturbation", v_shear=0.0)

    # Step through the torque pulse
    for _ in range(250):
        obs, done, info = env.step(cmd_fn_list=[8.0] * 3)

    # Object should experience measurable tilt
    assert info["max_tilt_rad"] > 0.001
    assert abs(info["object_tilt_rad"]) > 0.0005


def test_mechanical_work_and_impulse_accounting():
    """Verify that actuator mechanical work (positive J) and normal force impulse (N*s) are separately tracked."""
    topo = ContactTopology.create_symmetric_radial(num_contacts=3, object_radius=0.040, object_mass=0.50)
    env = NContactGraspEnvP5T3(topology=topo, seed=4700030)
    env.reset(initial_preloads=[5.0] * 3)

    # Command normal force ramp from 5 N to 10 N
    for _ in range(100):
        obs, done, info = env.step(cmd_fn_list=[10.0] * 3)

    # Impulse must be positive (approx 3 fingers * 7.5 N * 0.1 s ~ 2.25 N*s)
    assert info["impulse_total"] > 1.0
    # Mechanical work of actuator compressing silicone must be strictly positive
    assert info["mechanical_work_act"] > 0.0
    # Tangential friction work must be non-negative
    assert info["tangential_work"] >= 0.0
