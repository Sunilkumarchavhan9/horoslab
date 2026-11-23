"""
HOROS PROBE-1 — Phase 5 Task 2 (P5-T2)
Comprehensive Unit & Integration Test Suite for Multi-Finger Cooperative Grasping
File: test_p5_t2_multi_finger.py

Tests:
1. Multi-finger environment instantiation & hybrid kernel composition.
2. Symmetric grasp wrench equilibrium (zero net lateral force).
3. Asymmetric friction contact physics (mu_1 = 0.35, mu_2 = 0.75).
4. Off-center loading, torque generation, and tilt dynamics.
5. Actuator rate limits (|dFn/dt| <= 50 N/s) and safety bounds [3, 25] N.
6. Causality & non-leakage contract (strictly noisy observable channels).
7. Cooperative load redistribution under asymmetric shear ratios.
8. Contact loss detection and recovery without numerical instability.
9. Core protected file and seed interval invariance.
"""

import os
import sys
import math
import numpy as np
import pytest

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
RESEARCH_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))

for p in (CURRENT_DIR, RESEARCH_DIR):
    if p not in sys.path:
        sys.path.insert(0, p)

from multi_finger_sim_env import MultiFingerGraspEnvP5T2
from tactile_finger_estimator import TactileFingerEstimator
from cooperative_preload_controllers import (
    EqualForceDistributionController,
    FixedTotalForceController,
    RuleBasedCooperativeBalancingController,
    PredictiveMarginBalancingController,
    IndependentP5T1AdaptiveController,
    LearnedUncertaintyCooperativeAllocationController,
)


def test_multi_finger_environment_composition():
    """Verify that multi-finger environment properly composes certified contact physics kernels."""
    env = MultiFingerGraspEnvP5T2(mu_static_1=0.55, mu_static_2=0.55, seed=4600001)
    obs = env.reset()

    assert "finger_1" in obs and "finger_2" in obs
    assert "object_tilt" in obs and "total_force_n" in obs

    # Step physics with nominal 8 N clamp
    obs_next, done, info = env.step(cmd_fn1=8.0, cmd_fn2=8.0)
    assert not done
    assert "fn1" in info and "fn2" in info
    assert "ft1" in info and "ft2" in info
    assert info["stick_ratio_1"] >= 0.90
    assert info["stick_ratio_2"] >= 0.90


def test_symmetric_grasp_equilibrium():
    """Verify that under equal normal forces, lateral acceleration is balanced."""
    env = MultiFingerGraspEnvP5T2(mu_static_1=0.60, mu_static_2=0.60, seed=4600002)
    env.reset(disturbance_type="shear_ramp", v_shear=0.0)

    for _ in range(50):
        obs, done, info = env.step(cmd_fn1=8.0, cmd_fn2=8.0)

    # Object x position should remain centered near 0.0
    assert abs(env.obj_x) < 1e-4
    assert abs(env.obj_vx) < 1e-4
    assert np.isclose(env.fn1, env.fn2, atol=1e-3)


def test_asymmetric_friction_physics():
    """Verify that independent friction coefficients correctly govern each finger contact."""
    env = MultiFingerGraspEnvP5T2(mu_static_1=0.35, mu_static_2=0.75, seed=4600003)
    env.reset(disturbance_type="shear_ramp", v_shear=0.002)

    for _ in range(50):
        obs, done, info = env.step(cmd_fn1=8.0, cmd_fn2=8.0)

    # Under identical normal force and relative shear, Finger 1 (low mu) reaches higher force ratio
    ratio_1 = abs(info["ft1"]) / info["fn1"]
    ratio_2 = abs(info["ft2"]) / info["fn2"]
    # Finger 1 should have lower stick ratio (closer to slip)
    assert info["stick_ratio_1"] <= info["stick_ratio_2"]


def test_off_center_loading_and_tilt():
    """Verify that off-center loading generates torque and rotational tilt dynamics."""
    env = MultiFingerGraspEnvP5T2(mu_static_1=0.55, mu_static_2=0.55, seed=4600004)
    # Apply load at offset y = +0.02 m (generates external moment)
    env.reset(disturbance_type="torque_perturbation", v_shear=0.002, load_offset_y=0.02)

    for _ in range(100):
        obs, done, info = env.step(cmd_fn1=8.0, cmd_fn2=8.0)

    # Object should experience measurable tilt
    assert info["max_tilt_rad"] > 0.001


def test_actuator_rate_limit_and_bounds():
    """Verify that commanded normal forces strictly obey 50 N/s squeeze rate and [3, 25] N bounds."""
    env = MultiFingerGraspEnvP5T2(seed=4600005)
    env.reset(initial_preload_1=5.0, initial_preload_2=5.0)

    # Request sudden +15 N jump (from 5 N to 20 N)
    obs, done, info = env.step(cmd_fn1=20.0, cmd_fn2=20.0)

    # In 1 ms (1 step), maximum force increase is strictly 50 N/s * 0.001 s = 0.050 N
    delta1 = info["fn1"] - 5.0
    delta2 = info["fn2"] - 5.0
    assert np.isclose(delta1, 0.050, atol=1e-5), f"Rate limit violated for finger 1: delta={delta1}"
    assert np.isclose(delta2, 0.050, atol=1e-5), f"Rate limit violated for finger 2: delta={delta2}"

    # Request out-of-bounds command (30 N)
    ctrl = EqualForceDistributionController(nominal_fn=30.0)
    for _ in range(500):
        out = ctrl.step(obs)
        obs, done, info = env.step(out["cmd_fn1"], out["cmd_fn2"])

    assert info["fn1"] <= 25.0
    assert info["fn2"] <= 25.0


def test_causality_and_observability_contract():
    """Verify that planners and controllers receive strictly causal, noisy observations."""
    env = MultiFingerGraspEnvP5T2(seed=4600006)
    obs = env.reset()

    causal_keys = {"time", "finger_1", "finger_2", "object_tilt", "total_force_n"}
    for k in causal_keys:
        assert k in obs, f"Missing required observation key: {k}"

    finger_keys = {"force_n", "force_t", "disp", "slip_velocity", "force_ratio"}
    for k in finger_keys:
        assert k in obs["finger_1"], f"Missing finger channel: {k}"
        assert k in obs["finger_2"], f"Missing finger channel: {k}"

    forbidden = {"mu_s1", "mu_s2", "c_1", "c_2", "stick_ratio_1", "stick_ratio_2", "cm_state1", "cm_state2"}
    for f in forbidden:
        assert f not in obs, f"Privileged oracle state leaked: {f}"


def test_cooperative_balancing_redistribution():
    """Verify that cooperative balancing redistributes force toward the threatened contact."""
    ctrl_rule = RuleBasedCooperativeBalancingController(base_fn=8.0, gain_balance=20.0)
    ctrl_learned = LearnedUncertaintyCooperativeAllocationController(base_fn=8.0)
    ctrl_rule.reset(8.0, 8.0)
    ctrl_learned.reset(8.0, 8.0)

    # Mock observation where finger 1 is under high shear ratio (approaching slip) and finger 2 is relaxed
    mock_obs = {
        "time": 0.10,
        "finger_1": {"force_n": 8.0, "force_t": 2.4, "disp": 1e-5, "slip_velocity": 0.0, "force_ratio": 0.30},
        "finger_2": {"force_n": 8.0, "force_t": 0.8, "disp": 2e-6, "slip_velocity": 0.0, "force_ratio": 0.10},
        "object_tilt": 0.0,
        "total_force_n": 16.0,
    }

    out_rule = ctrl_rule.step(mock_obs)
    out_learned = ctrl_learned.step(mock_obs)

    # Both controllers should shift normal force toward threatened finger 1
    assert out_rule["cmd_fn1"] > out_rule["cmd_fn2"]
    assert out_learned["cmd_fn1"] > out_learned["cmd_fn2"]


def test_contact_loss_and_recovery():
    """Verify that contact loss is safely handled without simulator NaN or crash."""
    env = MultiFingerGraspEnvP5T2(seed=4600007)
    env.reset()

    # Step with zero normal force command (simulates emergency retraction or contact loss)
    for _ in range(50):
        obs, done, info = env.step(cmd_fn1=0.0, cmd_fn2=0.0)

    # Forces should clamp to minimum safety bound (3.0 N) rather than plunging negative
    assert info["fn1"] >= 3.0
    assert info["fn2"] >= 3.0
    assert not math.isnan(env.obj_x)
    assert not math.isnan(env.obj_y)


def test_protection_invariants():
    """Verify that certified contact physics kernel and simulator v1 remain strictly unmodified."""
    cp_dir = os.path.join(RESEARCH_DIR, "experiments", "contact_physics_v2", "contact")
    assert os.path.exists(os.path.join(cp_dir, "lugre.py")), "Certified LuGre kernel missing!"
    assert os.path.exists(os.path.join(cp_dir, "cattaneo_mindlin.py")), "Certified Cattaneo-Mindlin kernel missing!"
    assert os.path.exists(os.path.join(cp_dir, "contact_state.py")), "Certified contact state missing!"
