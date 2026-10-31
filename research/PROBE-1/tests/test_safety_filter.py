"""
Unit tests for Predictive Safety Filter, State Machine, and Fallback Controller.
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
from safety.predictive_cbf import DiscreteTimePredictiveCBF
from safety.safety_filter import PredictiveSafetyFilter, SafetyFilterState
from control.fallback import PassiveImpedanceFallback


def test_passive_fallback_controller():
    fallback = PassiveImpedanceFallback(n_q=16, k_d=15.0, u_limit=40.0)
    dq = np.array([1.2, -0.8, 0.5, 0.1] * 4, dtype=np.float64)

    # Warm-up call
    fallback.execute_fallback(dq)

    u_safe, stats = fallback.execute_fallback(dq)
    assert u_safe.shape == (16,)
    assert stats["latency_us"] < 500.0  # Must execute in < 0.5 ms (typically 10-30 us)
    # Passivity: dot{E} = dot{q}^T u_safe <= 0
    assert stats["dissipation_rate"] < 0.0
    # Clamping limit
    assert stats["max_abs_accel"] <= 40.0


def test_predictive_cbf_matrix_shapes():
    hand = MultiContactHandDynamics(num_fingers=4, joints_per_finger=4)
    contact = HuntCrossleyContactModel()
    sensitivity = ContactForceSensitivity(hand, contact, dt=0.01)
    obj = ObjectSpatialDynamics(nominal_mass=0.40)
    cbf = DiscreteTimePredictiveCBF(num_fingers=4, f_min=1.0, f_max=18.0)

    q = np.array([0.1, 0.4, 0.6, 0.3] * 4, dtype=np.float64)
    dq = np.zeros(16, dtype=np.float64)
    f_curr = [np.array([0.0, 0.0, 4.0]) for _ in range(4)]
    v_obj = [np.zeros(3) for _ in range(4)]
    p_contacts = hand.forward_kinematics(q)

    lambdas, biases = sensitivity.compute_sensitivity_and_bias(
        q, dq, f_curr, v_obj, [0.0015] * 4, [0.0] * 4
    )
    normals = [np.array([0.0, 0.0, 1.0]) for _ in range(4)]
    mu_cal = [0.55] * 4
    G = obj.grasp_matrix(p_contacts, np.zeros(3))
    w_req = obj.required_wrench(0.40, obj.inertia, np.zeros(3), np.zeros(3), np.zeros(3))

    u_min = np.full(16, -30.0)
    u_max = np.full(16, 30.0)

    A_ineq, b_ineq, A_eq, b_eq = cbf.build_qp_matrices(
        lambdas, biases, normals, mu_cal, f_curr, G, w_req, u_min, u_max
    )

    # 4 fingers * (8 friction facets + 1 crush + 1 contact) = 40 constraints
    # + 32 joint bounds = 72 ineq constraints
    assert A_ineq.shape == (72, 16)
    assert b_ineq.shape == (72,)
    # Grasp wrench balance = 6 eq constraints
    assert A_eq.shape == (6, 16)
    assert b_eq.shape == (6,)


def test_safety_filter_nominal_safe_state():
    hand = MultiContactHandDynamics(num_fingers=4, joints_per_finger=4)
    contact = HuntCrossleyContactModel()
    sensitivity = ContactForceSensitivity(hand, contact, dt=0.01)
    obj = ObjectSpatialDynamics(nominal_mass=0.40)
    cbf = DiscreteTimePredictiveCBF(num_fingers=4, f_min=0.5, f_max=18.0)
    safety_filter = PredictiveSafetyFilter(n_q=16, slack_threshold=1e-2)

    q = np.array([0.1, 0.4, 0.6, 0.3] * 4, dtype=np.float64)
    dq = np.zeros(16, dtype=np.float64)
    # Balanced 0.40 kg * 9.81 = 3.924 N vertical force distributed across 4 contacts
    f_curr = [np.array([0.0, 0.0, 0.981]) for _ in range(4)]
    v_obj = [np.zeros(3) for _ in range(4)]
    p_contacts = hand.forward_kinematics(q)

    lambdas, biases = sensitivity.compute_sensitivity_and_bias(
        q, dq, f_curr, v_obj, [0.0015] * 4, [0.0] * 4
    )
    normals = [np.array([0.0, 0.0, 1.0]) for _ in range(4)]
    mu_cal = [0.55] * 4
    G = obj.grasp_matrix(p_contacts, np.zeros(3))
    w_req = obj.required_wrench(0.40, obj.inertia, np.zeros(3), np.zeros(3), np.zeros(3))

    u_min = np.full(16, -30.0)
    u_max = np.full(16, 30.0)

    A_ineq, b_ineq, A_eq, b_eq = cbf.build_qp_matrices(
        lambdas, biases, normals, mu_cal, f_curr, G, w_req, u_min, u_max
    )

    u_nom = np.zeros(16, dtype=np.float64)
    u_cmd, state, metrics = safety_filter.solve(
        u_nom=u_nom, dq=dq, A_ineq=A_ineq, b_ineq=b_ineq, A_eq=A_eq, b_eq=b_eq
    )

    assert state == SafetyFilterState.NOMINAL_SAFE
    assert metrics["max_slack"] <= 1e-2
    assert metrics["status"] == "solved"
    assert u_cmd.shape == (16,)


def test_safety_filter_emergency_and_limit_transition():
    # Force a scenario where constraints are tightened to require slack relaxation
    safety_filter = PredictiveSafetyFilter(n_q=2, slack_penalty=1e3, max_relax_steps=2, slack_threshold=1e-2)

    # Incompatible ineq: u >= 5.0 and u <= 3.0
    A_ineq = np.array([[-1.0, 0.0], [1.0, 0.0]], dtype=np.float64)
    b_ineq = np.array([-5.0, 3.0], dtype=np.float64)
    A_eq = np.zeros((1, 2), dtype=np.float64)
    b_eq = np.zeros(1, dtype=np.float64)

    dq = np.array([0.5, -0.5])
    u_nom = np.array([4.0, 0.0])

    # Step 1: Enters EMERGENCY_RELAXED
    u_cmd1, state1, m1 = safety_filter.solve(u_nom, dq, A_ineq, b_ineq, A_eq, b_eq)
    assert state1 == SafetyFilterState.EMERGENCY_RELAXED
    assert m1["max_slack"] > 1e-2

    # Step 2: Enters EMERGENCY_RELAXED
    u_cmd2, state2, m2 = safety_filter.solve(u_nom, dq, A_ineq, b_ineq, A_eq, b_eq)
    assert state2 == SafetyFilterState.EMERGENCY_RELAXED

    # Step 3: Relaxation limit exceeded (count > 2) -> Shifts to CRITICAL_FAIL and triggers fallback
    u_cmd3, state3, m3 = safety_filter.solve(u_nom, dq, A_ineq, b_ineq, A_eq, b_eq)
    assert state3 == SafetyFilterState.CRITICAL_FAIL
    assert "fallback_stats" in m3
    # Verifies that fallback was applied: u_safe = -K_d * dq
    assert np.isclose(u_cmd3[0], -15.0 * 0.5)


def test_safety_filter_timing_statistics():
    safety_filter = PredictiveSafetyFilter(n_q=4)
    A_ineq = np.eye(4)
    b_ineq = np.ones(4)
    A_eq = np.zeros((1, 4))
    b_eq = np.zeros(1)
    dq = np.zeros(4)
    u_nom = np.zeros(4)

    for _ in range(15):
        safety_filter.solve(u_nom, dq, A_ineq, b_ineq, A_eq, b_eq)

    stats = safety_filter.get_timing_statistics()
    assert "p50_ms" in stats
    assert "p95_ms" in stats
    assert "wcet_ms" in stats
    assert stats["sample_count"] == 15
    assert stats["wcet_ms"] >= stats["p50_ms"]
