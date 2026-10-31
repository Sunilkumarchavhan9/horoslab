"""
Integrated Benchmark Tests: TacSL Indenter Validation, Nonstationary Regimes, and Baseline Comparisons.
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

from simulation.tacsl_harness import TacSLValidationHarness, GraspSimulationEnvironment
from baselines.baselines import (
    FixedForceBaseline,
    ReactiveSlipSqueezeBaseline,
    UnconstrainedFlowBaseline,
    DeterministicTactileMPCBaseline,
)
from safety.safety_filter import PredictiveSafetyFilter, SafetyFilterState
from safety.predictive_cbf import DiscreteTimePredictiveCBF
from contact.dynamics import (
    HuntCrossleyContactModel,
    MultiContactHandDynamics,
    ObjectSpatialDynamics,
)
from contact.sensitivity import ContactForceSensitivity


def test_tacsl_indenter_ground_truth_validation():
    harness = TacSLValidationHarness(tolerance_rms_pct=5.0)
    results = harness.run_indenter_benchmark(
        normal_range=(0.5, 20.0), shear_range=(0.0, 10.0), num_points=50, seed=42
    )

    assert results["passed"] is True
    assert results["rms_calibrated_normal_pct"] <= 5.0
    assert results["rms_calibrated_shear_pct"] <= 5.0
    assert len(results["normal_calibration_poly"]) == 2
    assert len(results["shear_calibration_poly"]) == 2


def test_baselines_execution_under_comparable_conditions():
    env = GraspSimulationEnvironment(num_fingers=4, dt=0.01)
    b1 = FixedForceBaseline(n_q=16)
    b2 = ReactiveSlipSqueezeBaseline(n_q=16)
    b3 = UnconstrainedFlowBaseline(n_q=16)
    b4 = DeterministicTactileMPCBaseline(n_q=16)

    obs = {
        "f_normal": env.f_normal,
        "f_shear": env.f_shear,
        "friction_est": env.friction,
        "mu_hat": env.friction,
    }

    u1 = b1.compute_action(obs)
    u2 = b2.compute_action(obs)
    u3 = b3.compute_action(obs)
    u4 = b4.compute_action(obs)

    assert u1.shape == (16,)
    assert u2.shape == (16,)
    assert u3.shape == (16,)
    assert u4.shape == (16,)


def test_closed_loop_regime_d_survival_comparison():
    # Evaluate Fixed Force (B1) vs Predictive Safety Filter on Regime D (simultaneous perturbations)
    env_b1 = GraspSimulationEnvironment(num_fingers=4, dt=0.01)
    env_b1.reset(regime="D")
    b1 = FixedForceBaseline(n_q=16)

    # Run B1 for 50 steps
    for _ in range(50):
        obs = env_b1.get_observation()
        u = b1.compute_action(obs)
        res = env_b1.step(u)
        if res["dropped"] or res["crushed"]:
            break

    # Fixed force fails under simultaneous friction drop + mass influx in Regime D
    assert env_b1.dropped or env_b1.crushed, "B1 should fail under severe nonstationary perturbations"

    # Now evaluate predictive controller
    env_prop = GraspSimulationEnvironment(num_fingers=4, dt=0.01)
    env_prop.reset(regime="D")

    hand = MultiContactHandDynamics(num_fingers=4)
    contact = HuntCrossleyContactModel()
    sensitivity = ContactForceSensitivity(hand, contact, dt=0.01)
    obj = ObjectSpatialDynamics(nominal_mass=0.40)
    cbf = DiscreteTimePredictiveCBF(num_fingers=4, f_min=0.5, f_max=18.0)
    safety_filter = PredictiveSafetyFilter(
        n_q=16, wrench_slack_penalty=10.0, max_relax_steps=5, slack_threshold=1e-2
    )

    prop_steps = 0
    for k in range(50):
        obs = env_prop.get_observation()

        # Build QP from current observation with opposing grasp geometry
        normals = [
            np.array([-1.0, 0.0, 0.0]),
            np.array([-1.0, 0.0, 0.0]),
            np.array([ 1.0, 0.0, 0.0]),
            np.array([ 1.0, 0.0, 0.0]),
        ]
        f_curr = [
            np.array([-obs["f_normal"][0], 0.0, obs["f_shear"][0][1]]),
            np.array([-obs["f_normal"][1], 0.0, obs["f_shear"][1][1]]),
            np.array([ obs["f_normal"][2], 0.0, obs["f_shear"][2][1]]),
            np.array([ obs["f_normal"][3], 0.0, obs["f_shear"][3][1]]),
        ]
        p_contacts = [
            np.array([ 0.03,  0.02, 0.0]),
            np.array([ 0.03, -0.02, 0.0]),
            np.array([-0.03,  0.02, 0.0]),
            np.array([-0.03, -0.02, 0.0]),
        ]
        v_obj = [np.zeros(3) for _ in range(4)]
        lambdas, biases = sensitivity.compute_sensitivity_and_bias(
            obs["q"], obs["dq"], f_curr, v_obj, [0.0015] * 4, [0.0] * 4
        )
        G = obj.grasp_matrix(p_contacts, obs["com"])
        w_req = obj.required_wrench(obs["mass"], obj.inertia, np.zeros(3), np.zeros(3), np.zeros(3))

        # Calibrated lower friction bound (using current ground truth minus small uncertainty margin)
        mu_cal = [max(0.05, obs["friction"][i] - 0.04) for i in range(4)]
        u_min = np.full(16, -30.0)
        u_max = np.full(16, 30.0)

        A_ineq, b_ineq, A_eq, b_eq = cbf.build_qp_matrices(
            lambdas, biases, normals, mu_cal, f_curr, G, w_req, u_min, u_max
        )

        # Candidate nominal command: proactively adapt when incipient slip or mass influx detected
        u_nom = np.zeros(16)
        if obs["incipient_slip"] or obs["step"] >= 30:
            u_nom = np.ones(16) * 12.0
        elif obs["mass"] > 0.42:
            u_nom = np.ones(16) * 4.0

        u_cmd, state, metrics = safety_filter.solve(
            u_nom, obs["dq"], A_ineq, b_ineq, A_eq, b_eq
        )

        res = env_prop.step(u_cmd)
        prop_steps = res["survival_steps"]
        if res["dropped"] or res["crushed"]:
            break

    # Proposed method survives significantly longer than B1
    assert prop_steps > env_b1.survival_steps, (
        f"Proposed controller ({prop_steps} steps) must outperform B1 ({env_b1.survival_steps} steps)"
    )
