"""
Unit tests for Contact Dynamics and Action-Dependent Sensitivity.
"""
import pytest
import numpy as np
import sys
import os

src_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../src"))
root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if src_path not in sys.path:
    sys.path.insert(0, src_path)
if root_path not in sys.path:
    sys.path.insert(0, root_path)

from contact.dynamics import (
    HuntCrossleyContactModel,
    MultiContactHandDynamics,
    ObjectSpatialDynamics,
)
from contact.sensitivity import ContactForceSensitivity


def test_hunt_crossley_normal_and_shear():
    model = HuntCrossleyContactModel(k_n=2000.0, chi_n=50.0, n=1.2, m=1.0)
    # Penetration: 1mm, rate: 0.05 m/s
    fn, ft, slip_ratio = model.compute_force(
        delta_n=0.001,
        dot_delta_n=0.05,
        delta_t=np.array([0.0005, 0.0002]),
        dot_delta_t=np.array([0.01, 0.0]),
        mu=0.5,
    )
    assert fn > 0.0
    assert len(ft) == 2
    assert slip_ratio <= 1.0 + 1e-6
    # Slip condition: shear norm must not exceed mu * fn
    assert np.linalg.norm(ft) <= 0.5 * fn + 1e-6


def test_stiffness_and_damping_matrices():
    model = HuntCrossleyContactModel()
    K_c, D_c = model.compute_stiffness_and_damping(delta_n=0.0015, dot_delta_n=0.0)
    assert K_c.shape == (3, 3)
    assert D_c.shape == (3, 3)
    assert K_c[2, 2] > 0.0  # Normal stiffness
    assert D_c[2, 2] > 0.0  # Normal damping


def test_hand_kinematics_and_jacobians():
    hand = MultiContactHandDynamics(num_fingers=4, joints_per_finger=4)
    q = np.array([0.1, 0.4, 0.6, 0.3] * 4, dtype=np.float64)
    positions = hand.forward_kinematics(q)
    assert len(positions) == 4
    for p in positions:
        assert p.shape == (3,)

    jacobians = hand.contact_jacobians(q)
    assert len(jacobians) == 4
    for J in jacobians:
        assert J.shape == (3, 16)
        assert not np.isnan(J).any()


def test_object_grasp_matrix_and_wrench():
    obj = ObjectSpatialDynamics(nominal_mass=0.45)
    com = np.array([0.0, 0.0, 0.0])
    p_contacts = [
        np.array([0.03, 0.02, 0.0]),
        np.array([0.03, -0.02, 0.0]),
        np.array([-0.03, 0.02, 0.0]),
        np.array([-0.03, -0.02, 0.0]),
    ]
    G = obj.grasp_matrix(p_contacts, com)
    assert G.shape == (6, 12)
    # Upper 3x12 blocks must be sum of identity matrices
    assert np.allclose(G[0:3, 0:3], np.eye(3))
    assert np.allclose(G[0:3, 3:6], np.eye(3))

    w_req = obj.required_wrench(
        mass=0.45,
        inertia=obj.inertia,
        v_dot_des=np.zeros(3),
        omega=np.zeros(3),
        omega_dot_des=np.zeros(3),
    )
    assert w_req.shape == (6,)
    # Vertical equilibrium force must counteract gravity: 0.45 * 9.81 = 4.4145 N
    assert np.isclose(w_req[2], 0.45 * 9.81, atol=1e-3)


def test_contact_sensitivity_finite_difference():
    hand = MultiContactHandDynamics(num_fingers=4, joints_per_finger=4)
    contact = HuntCrossleyContactModel()
    sensitivity = ContactForceSensitivity(hand, contact, dt=0.01)

    q = np.array([0.1, 0.3, 0.5, 0.2] * 4, dtype=np.float64)
    dq = np.zeros(16, dtype=np.float64)
    u_nom = np.zeros(16, dtype=np.float64)
    f_curr = [np.array([0.0, 0.0, 4.0]) for _ in range(4)]
    v_obj = [np.zeros(3) for _ in range(4)]
    penetrations = [0.0015] * 4
    penetration_rates = [0.0] * 4

    max_err = sensitivity.finite_difference_check(
        q, dq, u_nom, f_curr, v_obj, penetrations, penetration_rates, eps=1e-5
    )
    # Finite difference error must be < 1e-4
    assert max_err < 1e-4, f"Finite difference check failed: max_err = {max_err}"
