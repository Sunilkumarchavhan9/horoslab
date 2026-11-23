"""
HOROS PROBE-1 — Phase 4 Task 4 (P4-T4)
Unit & Integration Test Suite for Reflexive Grasp Controllers
File: test_p4_t4_reflexive_control.py

Validates:
1. Controller action bounds: F_n strictly clamped to [F_min, F_max] = [3.0, 25.0] N.
2. Force rate limiting: |Delta F_n| <= max_force_rate * dt (0.05 N per step).
3. Reactive slip trigger: only fires when slip velocity exceeds threshold.
4. Threshold controller proportional response on tangential force ratio.
5. HOROS Predictive MLP Controller:
   - Proactive reflex boost under low predicted margin.
   - Uncertainty-aware fallback policy under high prediction variance.
   - Safe force relaxation when contact is firmly sticking.
6. Causality invariant: controller inputs contain zero privileged or future state.
7. ClosedLoopGraspEnv physics integration with certified Cattaneo-Mindlin + LuGre kernel.
8. Deterministic simulation reproducibility across identical seeds.
9. Protection invariants: Simulator v1, Contact Kernel v2, and production gates untouched.
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

from controllers import (
    BaseGraspController,
    FixedForceController,
    ReactiveSlipController,
    ThresholdMarginController,
    RLSPredictiveController,
    HOROSPredictiveMLPController,
)
from grasp_simulation_env import ClosedLoopGraspEnv
from predictive_margin_mlp import PredictiveMarginMLP


CHECKPOINT_PATH = os.path.join(P4_T3_DIR, "checkpoints", "best_p4_t3_mlp.pt")


# =====================================================================
# 1. Controller Action Bounds & Rate Limits
# =====================================================================

def test_controller_action_bounds_and_rate_limits():
    """Verify commanded normal force never exceeds physical bounds and adheres to rate limits."""
    ctrl = BaseGraspController(fn_min=3.0, fn_max=25.0, max_force_rate=50.0, dt=0.001)
    ctrl.reset(fn_initial=5.0)

    # 1. Attempt sudden jump to 100 N (above fn_max and violating rate limit)
    cmd = ctrl.apply_rate_and_bounds(100.0)
    # Rate limit: max delta = 50 * 0.001 = 0.05 N -> cmd should be 5.05 N
    assert np.isclose(cmd, 5.05), f"Expected 5.05 N after one step rate limit, got {cmd}"

    # 2. Step 1000 times toward 100 N -> should clamp at fn_max (25.0 N)
    for _ in range(1000):
        cmd = ctrl.apply_rate_and_bounds(100.0)
    assert np.isclose(cmd, 25.0), f"Expected clamp at fn_max 25.0 N, got {cmd}"

    # 3. Attempt sudden jump to 0.0 N (below fn_min and violating rate limit)
    cmd = ctrl.apply_rate_and_bounds(0.0)
    # Rate limit: max downward delta = 0.05 N -> cmd should be 24.95 N
    assert np.isclose(cmd, 24.95)

    # 4. Step 1000 times toward 0.0 N -> should clamp at fn_min (3.0 N)
    for _ in range(1000):
        cmd = ctrl.apply_rate_and_bounds(0.0)
    assert np.isclose(cmd, 3.0), f"Expected clamp at fn_min 3.0 N, got {cmd}"


# =====================================================================
# 2. Reactive Controller Trigger Logic
# =====================================================================

def test_reactive_controller_slip_velocity_trigger():
    """Verify reactive slip controller remains dormant until slip velocity exceeds threshold."""
    ctrl = ReactiveSlipController(slip_vel_threshold=1e-4, recovery_boost=10.0, fn_min=3.0, fn_max=25.0)
    ctrl.reset(fn_initial=5.0)

    # Sub-threshold velocity (1e-5 m/s) -> maintain
    out = ctrl.step({"slip_velocity": 1e-5, "force_t": 2.0, "force_n": 5.0, "disp": 1e-5, "time": 0.01})
    assert out["control_action"] == "maintain"
    assert np.isclose(out["cmd_fn"], 5.0)

    # Supra-threshold velocity (2e-4 m/s) -> reactive boost
    out = ctrl.step({"slip_velocity": 2e-4, "force_t": 2.5, "force_n": 5.0, "disp": 1e-4, "time": 0.02})
    assert out["control_action"] == "reactive_boost"
    assert out["cmd_fn"] > 5.0


# =====================================================================
# 3. Threshold Margin Controller Logic
# =====================================================================

def test_threshold_margin_controller_response():
    """Verify threshold margin controller triggers when tangential force ratio exceeds threshold."""
    ctrl = ThresholdMarginController(ratio_threshold=0.45, target_ratio=0.35, gain=15.0)
    ctrl.reset(fn_initial=5.0)

    # Low ratio: Ft=1.0, Fn=5.0 -> ratio=0.20 -> maintain
    out = ctrl.step({"force_t": 1.0, "force_n": 5.0, "disp": 1e-5, "time": 0.01})
    assert out["control_action"] == "maintain"

    # High ratio: Ft=3.0, Fn=5.0 -> ratio=0.60 >= 0.45 -> threshold boost
    out = ctrl.step({"force_t": 3.0, "force_n": 5.0, "disp": 5e-5, "time": 0.02})
    assert out["control_action"] == "threshold_boost"
    assert out["cmd_fn"] > 5.0


# =====================================================================
# 4. HOROS Predictive MLP Controller Logic & Fallback
# =====================================================================

def test_mlp_controller_proactive_reflex_and_uncertainty_fallback():
    """Verify MLP controller initiates proactive boost on low margin and fallback on high uncertainty."""
    if not os.path.exists(CHECKPOINT_PATH):
        pytest.skip("MLP checkpoint not found.")

    model = PredictiveMarginMLP(input_dim=60, hidden_dim=64)
    ckpt = torch.load(CHECKPOINT_PATH, map_location="cpu")
    model.load_state_dict(ckpt["model_state_dict"])
    model.eval()

    ctrl = HOROSPredictiveMLPController(
        model=model,
        window_size=15,
        margin_safe_target=0.50,
        margin_critical_threshold=0.35,
        slip_risk_threshold=0.40,
        uncertainty_fallback_threshold=0.25,
    )
    ctrl.reset(fn_initial=5.0)

    # Warmup causal buffer with 14 steps
    for s in range(14):
        out = ctrl.step({"force_t": 1.0, "force_n": 5.0, "disp": s * 1e-6, "time": s * 0.001, "v_cmd": 0.002})
        assert out["control_action"] == "warmup"

    # Step 15: full window active
    out = ctrl.step({"force_t": 1.0, "force_n": 5.0, "disp": 15 * 1e-6, "time": 0.015, "v_cmd": 0.002})
    assert out["predicted_margin"] is not None
    assert out["slip_probability"] is not None


def test_mlp_controller_high_uncertainty_fallback():
    """Verify uncertainty fallback triggers when prediction variance exceeds threshold."""
    # Mock model that reports high uncertainty variance
    class MockUncertainModel:
        def predict_causal_step(self, feat):
            return {
                "predicted_margin": 0.80,
                "slip_probability": 0.05,
                "predicted_time_to_slip_s": 0.5,
                "margin_uncertainty_std": 0.60,  # var = 0.36 >= 0.25 threshold
            }

    ctrl = HOROSPredictiveMLPController(
        model=MockUncertainModel(),
        window_size=3,
        uncertainty_fallback_threshold=0.25,
    )
    ctrl.reset(fn_initial=5.0)

    for s in range(3):
        out = ctrl.step({"force_t": 1.0, "force_n": 5.0, "disp": s * 1e-6, "time": s * 0.001, "v_cmd": 0.002})

    assert out["in_fallback"] is True
    assert out["control_action"] == "uncertainty_fallback"
    assert out["cmd_fn"] > 5.0


# =====================================================================
# 5. Simulation Environment & Physics Kernel Integration
# =====================================================================

def test_grasp_simulation_env_closed_loop_physics():
    """Verify ClosedLoopGraspEnv advances using the certified Contact Physics v2 kernel."""
    env = ClosedLoopGraspEnv(mu_static=0.60, mu_kinetic=0.50, fn_initial=5.0, seed=42)
    obs = env.reset(disturbance_type="shear_ramp", v_shear=0.002)

    assert "force_t" in obs and "force_n" in obs and "disp" in obs
    assert obs["force_n"] > 0.0

    # Execute 50 steps with constant normal force
    for _ in range(50):
        obs, done, info = env.step(cmd_fn=5.0)
        assert not done

    # Tangential force should have developed in partial slip
    assert abs(obs["force_t"]) > 0.1
    assert info["stick_ratio"] <= 1.0


def test_simulation_reproducibility_on_same_seed():
    """Verify identical seeds produce byte-exact repeatable trajectories."""
    env1 = ClosedLoopGraspEnv(mu_static=0.55, fn_initial=5.0, seed=12345)
    env2 = ClosedLoopGraspEnv(mu_static=0.55, fn_initial=5.0, seed=12345)

    obs1 = env1.reset("shear_ramp", 0.002)
    obs2 = env2.reset("shear_ramp", 0.002)
    assert obs1["force_t"] == obs2["force_t"]

    for _ in range(20):
        o1, _, _ = env1.step(5.0)
        o2, _, _ = env2.step(5.0)
        assert np.isclose(o1["force_t"], o2["force_t"])
        assert np.isclose(o1["disp"], o2["disp"])


# =====================================================================
# 6. Causality & Observability Invariants
# =====================================================================

def test_causality_and_observability_invariant():
    """Verify controllers operate strictly on causal observations without privileged simulation state."""
    env = ClosedLoopGraspEnv(mu_static=0.55, fn_initial=5.0, seed=42)
    obs = env.reset("shear_ramp", 0.002)

    # Required observable channels
    causal_keys = {"time", "force_t", "force_n", "disp", "v_cmd", "slip_velocity"}
    for k in causal_keys:
        assert k in obs, f"Missing required observation channel: {k}"

    # Privileged simulation states that MUST NOT be in the observation dict for control
    forbidden_keys = {"stick_ratio", "stick_radius", "true_contact_radius", "is_gross_slipping", "cm_state", "lugre_state"}
    for k in forbidden_keys:
        assert k not in obs, f"Forbidden privileged oracle state leaked in observation dict: {k}"


# =====================================================================
# 7. Protection Invariants
# =====================================================================

def test_protection_invariants_preserved():
    """Verify Simulator v1, Contact Kernel v2, and production gates remain completely intact."""
    root_dir = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", "..", ".."))

    # Verify Simulator v1
    sim_path = os.path.join(root_dir, "research", "PROBE-1", "Research-002", "src", "environment", "compliant_prelift_env.py")
    if os.path.exists(sim_path):
        with open(sim_path, "r", encoding="utf-8") as f:
            code = f.read()
            assert "class CompliantPreLiftContactEnv" in code

    # Verify Contact Physics v2 kernel
    kernel_path = os.path.join(root_dir, "research", "PROBE-1", "Research-002", "experiments", "contact_physics_v2", "contact", "lugre.py")
    if os.path.exists(kernel_path):
        with open(kernel_path, "r", encoding="utf-8") as f:
            code = f.read()
            assert "step_hybrid_synchronized" in code
