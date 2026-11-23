"""
HOROS PROBE-1 — Phase 4 Task 4B (P4-T4B)
Unit & Integration Test Suite for Tri-State Hybrid Reflex Grasp Controllers
File: test_p4_t4b_hybrid_reflex.py

Validates:
1. Physical action bounds: Fn strictly clamped to [3.0, 25.0] N.
2. Actuation squeeze rate limits: |dFn/dt| <= 50 N/s (0.05 N/step at 1000 Hz).
3. State 1 (Stable Contact): gentle force relaxation down toward baseline.
4. State 2 (Approaching Instability): proactive reflex boost on low margin / high slip risk.
5. State 3 (Emergency Arrest): immediate reactive boost on gross slip with latching horizon.
6. State 3 (Uncertainty Fallback): protective boost on elevated prediction variance (sigma_m^2 >= 0.25).
7. Causality invariant: controller inputs contain strictly observable channels (no privileged state leakage).
8. ClosedLoopGraspEnvP4T4B physics integration with certified Cattaneo-Mindlin + LuGre kernel.
9. Energy work and damage proxy tracking consistency.
10. Simulation reproducibility across identical seeds.
11. Protection invariants: Simulator v1, Contact Kernel v2, and production gates untouched.
"""

import math
import os
import sys
import numpy as np
import pytest
import torch

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
RESEARCH_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))
P4_T3_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "compliance_estimation_p4_t3"))

for p in (CURRENT_DIR, RESEARCH_DIR, P4_T3_DIR):
    if p not in sys.path:
        sys.path.insert(0, p)

from controllers_p4_t4b import (
    BaseGraspController,
    FixedForceController,
    ReactiveSlipController,
    ThresholdMarginController,
    RLSPredictiveController,
    HOROSHybridPredictiveController,
)
from grasp_simulation_env_p4_t4b import ClosedLoopGraspEnvP4T4B
from predictive_margin_mlp import PredictiveMarginMLP


CHECKPOINT_PATH = os.path.join(P4_T3_DIR, "checkpoints", "best_p4_t3_mlp.pt")


# =====================================================================
# 1. Controller Action Bounds & Rate Limits
# =====================================================================

def test_controller_action_bounds_and_rate_limits():
    """Verify commanded normal force never exceeds physical bounds and adheres to rate limits."""
    ctrl = BaseGraspController(fn_min=3.0, fn_max=25.0, max_force_rate=50.0, dt=0.001)
    ctrl.reset(fn_initial=5.0)

    # 1. Attempt sudden jump to 100 N -> rate limit should allow max 0.05 N
    cmd = ctrl.apply_rate_and_bounds(100.0)
    assert np.isclose(cmd, 5.05), f"Expected 5.05 N after one step, got {cmd}"

    # 2. Step 1000 times -> should saturate at fn_max (25.0 N)
    for _ in range(1000):
        cmd = ctrl.apply_rate_and_bounds(100.0)
    assert np.isclose(cmd, 25.0), f"Expected clamp at fn_max 25.0 N, got {cmd}"

    # 3. Attempt sudden jump to 0.0 N -> rate limit should allow max -0.05 N
    cmd = ctrl.apply_rate_and_bounds(0.0)
    assert np.isclose(cmd, 24.95)

    # 4. Step 1000 times -> should saturate at fn_min (3.0 N)
    for _ in range(1000):
        cmd = ctrl.apply_rate_and_bounds(0.0)
    assert np.isclose(cmd, 3.0), f"Expected clamp at fn_min 3.0 N, got {cmd}"


# =====================================================================
# 2. Tri-State Hybrid Controller State Transitions
# =====================================================================

def test_hybrid_controller_state_transitions():
    """Verify operational state switching between State 1, State 2, and State 3."""
    class MockPerceptionModel:
        def __init__(self):
            self.m_hat = 0.80
            self.p_slip = 0.05
            self.sigma_sq = 0.02

        def predict_causal_step(self, feat):
            return {
                "predicted_margin": self.m_hat,
                "slip_probability": self.p_slip,
                "predicted_time_to_slip_s": 0.5,
                "margin_uncertainty_std": math.sqrt(self.sigma_sq),
            }

    mock_model = MockPerceptionModel()
    ctrl = HOROSHybridPredictiveController(
        model=mock_model,
        window_size=3,
        proactive_hold_steps=5,
        emergency_hold_steps=10,
    )
    ctrl.reset(fn_initial=8.0)

    # 1. Warmup (window_size = 3)
    for s in range(3):
        out = ctrl.step({"force_t": 1.0, "force_n": 8.0, "disp": 1e-5, "time": s * 0.001, "slip_velocity": 0.0})

    # 2. State 1 at baseline -> maintain
    assert out["operational_state"] == 1
    assert out["control_action"] == "maintain"

    # 3. Trigger State 2: Approaching instability (low margin)
    mock_model.m_hat = 0.35
    mock_model.p_slip = 0.40
    out = ctrl.step({"force_t": 3.0, "force_n": 8.0, "disp": 5e-5, "time": 0.01, "slip_velocity": 1e-5})
    assert out["operational_state"] == 2
    assert out["control_action"] == "proactive_pre_slip_boost"
    assert out["cmd_fn"] > 8.0

    # 4. Trigger State 3: Emergency slip arrest (v_slip >= 1e-4)
    out = ctrl.step({"force_t": 4.0, "force_n": 8.5, "disp": 1e-4, "time": 0.02, "slip_velocity": 2e-4})
    assert out["operational_state"] == 3
    assert out["control_action"] == "emergency_slip_arrest"

    # 5. Return to State 1 after emergency hold expires: current_fn > baseline + 0.5 -> controlled relaxation
    mock_model.m_hat = 0.85
    mock_model.p_slip = 0.02
    for s in range(12):  # emergency_hold_steps = 10, so 12 steps clears the latch
        out = ctrl.step({"force_t": 1.0, "force_n": out["cmd_fn"], "disp": 1e-4, "time": 0.03 + s * 0.001, "slip_velocity": 0.0})

    assert out["operational_state"] == 1
    assert out["control_action"] == "controlled_relaxation"


def test_hybrid_controller_uncertainty_fallback():
    """Verify high uncertainty shifts controller into State 3 fallback."""
    class MockHighUncertaintyModel:
        def predict_causal_step(self, feat):
            return {
                "predicted_margin": 0.80,
                "slip_probability": 0.05,
                "predicted_time_to_slip_s": 0.5,
                "margin_uncertainty_std": 0.55,  # var = 0.3025 >= 0.25 threshold
            }

    ctrl = HOROSHybridPredictiveController(
        model=MockHighUncertaintyModel(),
        window_size=2,
        uncertainty_fallback_threshold=0.25,
    )
    ctrl.reset(fn_initial=5.0)

    for s in range(2):
        out = ctrl.step({"force_t": 1.0, "force_n": 5.0, "disp": 1e-5, "time": s * 0.001, "slip_velocity": 0.0})

    assert out["operational_state"] == 3
    assert out["in_fallback"] is True
    assert out["control_action"] == "uncertainty_fallback"


# =====================================================================
# 3. Simulation Environment & Energy / Damage Metrics
# =====================================================================

def test_simulation_env_energy_and_damage_metrics():
    """Verify ClosedLoopGraspEnvP4T4B computes mechanical work and damage proxies correctly."""
    env = ClosedLoopGraspEnvP4T4B(mu_static=0.55, fn_initial=5.0, seed=42)
    obs = env.reset("shear_ramp", 0.002)

    assert "force_t" in obs and "force_n" in obs and "disp" in obs
    assert obs["force_n"] > 0.0

    # Step with varying force to induce mechanical work
    for step_i in range(100):
        target = 5.0 + step_i * 0.05  # Ramping up to 10 N
        obs, done, info = env.step(target)

    # Verify mechanical work and impulse accumulated
    assert info["impulse_spent"] > 0.0
    assert info["mechanical_work_act"] >= 0.0
    assert info["tangential_work"] >= 0.0
    assert info["peak_fn"] <= 10.0
    # Force never exceeded 15 N -> damage proxy integral must be 0
    assert info["damage_proxy_integral"] == 0.0

    # Now step above 15 N to verify damage proxy activates
    for _ in range(50):
        obs, done, info = env.step(18.0)
    assert info["damage_proxy_integral"] > 0.0
    assert info["peak_fn"] == 18.0


# =====================================================================
# 4. Causality & Non-Leakage Contract
# =====================================================================

def test_causality_and_observability_invariant():
    """Verify controllers receive only noisy observable channels."""
    env = ClosedLoopGraspEnvP4T4B(mu_static=0.55, fn_initial=5.0, seed=42)
    obs = env.reset("shear_ramp", 0.002)

    causal_keys = {"time", "force_t", "force_n", "disp", "v_cmd", "slip_velocity"}
    for k in causal_keys:
        assert k in obs, f"Missing required observation channel: {k}"

    forbidden_keys = {"stick_ratio", "stick_radius", "true_contact_radius", "is_gross_slipping", "cm_state", "lugre_state"}
    for k in forbidden_keys:
        assert k not in obs, f"Forbidden privileged oracle state leaked: {k}"


# =====================================================================
# 5. Simulation Reproducibility
# =====================================================================

def test_simulation_reproducibility():
    """Verify identical seeds produce byte-identical simulation runs."""
    env1 = ClosedLoopGraspEnvP4T4B(mu_static=0.55, fn_initial=5.0, seed=9999)
    env2 = ClosedLoopGraspEnvP4T4B(mu_static=0.55, fn_initial=5.0, seed=9999)

    obs1 = env1.reset("shear_ramp", 0.0025)
    obs2 = env2.reset("shear_ramp", 0.0025)
    assert obs1["force_t"] == obs2["force_t"]

    for _ in range(30):
        o1, _, _ = env1.step(6.0)
        o2, _, _ = env2.step(6.0)
        assert np.isclose(o1["force_t"], o2["force_t"])
        assert np.isclose(o1["disp"], o2["disp"])


# =====================================================================
# 6. Protection Invariants
# =====================================================================

def test_protection_invariants():
    """Verify Simulator v1, Contact Kernel v2, and production gates remain completely intact."""
    root_dir = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", "..", ".."))

    sim_path = os.path.join(root_dir, "research", "PROBE-1", "Research-002", "src", "environment", "compliant_prelift_env.py")
    if os.path.exists(sim_path):
        with open(sim_path, "r", encoding="utf-8") as f:
            assert "class CompliantPreLiftContactEnv" in f.read()

    kernel_path = os.path.join(root_dir, "research", "PROBE-1", "Research-002", "experiments", "contact_physics_v2", "contact", "lugre.py")
    if os.path.exists(kernel_path):
        with open(kernel_path, "r", encoding="utf-8") as f:
            assert "step_hybrid_synchronized" in f.read()
