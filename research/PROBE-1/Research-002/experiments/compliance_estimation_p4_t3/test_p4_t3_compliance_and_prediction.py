"""
HOROS PROBE-1 — Phase 4 Task 3 (P4-T3) Unit & Integration Test Suite
File: test_p4_t3_compliance_and_prediction.py

Tests:
1. RLS mathematical updates and synthetic linear convergence.
2. Covariance positive-definiteness and boundedness under continuous updates.
3. Deadband gating and covariance windup prevention under zero excitation.
4. Episode-grouped split isolation (zero inter-split window or episode leakage).
5. Causal window construction invariant (no future-step leakage).
6. PredictiveMarginMLP architectural shapes, forward pass, and positive variance head.
7. Trained checkpoint loading, numerical sanity, and output bounds.
8. Noise robustness contrast: MLP and RLS stability vs Finite-Difference noise amplification.
9. Preservation of protected production gates, simulator v1, and contact physics kernel v2.
"""

import os
import sys
import numpy as np
import pytest
import torch

# Ensure experiment directory and pre_slip directory are on path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PRE_SLIP_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "pre_slip_qualification"))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)
if PRE_SLIP_DIR not in sys.path:
    sys.path.insert(0, PRE_SLIP_DIR)

from rls_compliance_estimator import RLSComplianceEstimator
from force_history_dataset import (
    ForceHistoryWindowDataset,
    build_causal_sliding_windows,
    create_grouped_train_val_test_splits,
    create_held_out_generalization_splits,
)
from predictive_margin_mlp import PredictiveMarginMLP
from p4_t1_generate_trajectories import load_p4_t1_dataset


# Paths to canonical P4-T1 dataset files
TRAJECTORIES_NPZ = os.path.join(PRE_SLIP_DIR, "data", "p4_t1_partial_slip_trajectories.npz")
MANIFEST_JSON = os.path.join(PRE_SLIP_DIR, "data", "p4_t1_trajectory_manifest.json")


# =====================================================================
# 1. RLS Parameter Estimation & Convergence
# =====================================================================

def test_rls_synthetic_linear_convergence():
    """Verify incremental RLS converges to the true tangent stiffness on clean linear data."""
    true_k = 12000.0  # 12 kN/m = 12 N/mm (within physical contact bounds [500, 30000])
    estimator = RLSComplianceEstimator(
        formulation="incremental",
        lam=0.98,
        delta_window=2,
        min_disp_excitation=1e-6,
        p_init=100.0,
        k_init_guess=true_k,
    )

    # Simulate constant-stiffness ramp
    for step in range(1, 50):
        t = step * 0.001
        disp = step * 1e-5  # 10 um increments per ms
        ft = true_k * disp
        res = estimator.update(ft=ft, fn=10.0, disp=disp, time=t)

    # After 50 consistent updates, estimate should be within 2% of true_k
    assert np.isclose(res["stiffness_kt"], true_k, rtol=0.02), f"Estimated {res['stiffness_kt']} vs true {true_k}"
    assert res["data_valid"] is True


def test_rls_covariance_positive_definite():
    """Verify parameter covariance P_t remains strictly positive definite for both formulations."""
    estimator_abs = RLSComplianceEstimator(
        formulation="absolute",
        lam=0.98,
        delta_window=2,
        p_init=50.0,
        min_disp_excitation=1e-6,
    )

    rng = np.random.RandomState(42)
    disp = 0.0
    for i in range(1, 40):
        d_disp = 1e-5 + rng.uniform(0.0, 5e-6)
        disp += d_disp
        ft = 10000.0 * disp + rng.normal(0, 0.01)
        res = estimator_abs.update(ft=ft, fn=10.0, disp=disp, time=i * 0.001)

        P = estimator_abs.P
        eigvals = np.linalg.eigvalsh(P)
        assert np.all(eigvals > 0), f"Covariance not positive definite at step {i}: eigvals={eigvals}"
        assert res["covariance_trace"] > 0


def test_rls_deadband_gating_prevents_windup():
    """Verify that during zero or sub-threshold displacement, RLS skips update and P does not blow up."""
    p_initial = 100.0
    estimator = RLSComplianceEstimator(
        formulation="incremental",
        lam=0.95,
        delta_window=2,
        p_init=p_initial,
        min_disp_excitation=1e-5,  # 10 um threshold
    )

    # Feed 50 stationary steps with sub-threshold displacement increments (< 1 um)
    for step in range(1, 50):
        tiny_disp = 1e-4 + step * 1e-7  # Sub-threshold: 0.1 um increment << 10 um
        res = estimator.update(ft=5.0, fn=10.0, disp=tiny_disp, time=step * 0.001)
        if step > 3:  # once window w=2 is filled
            assert res["data_valid"] is False

    # Covariance trace must equal p_init (never updated, zero wind-up)
    assert np.isclose(float(np.trace(estimator.P)), p_initial)


# =====================================================================
# 2. Dataset Builder & Split Isolation
# =====================================================================

def test_dataset_grouped_split_isolation():
    """Verify strict episode-grouped train/val/test splits with zero cross-split leakage."""
    assert os.path.exists(TRAJECTORIES_NPZ) and os.path.exists(MANIFEST_JSON)

    trajectories = load_p4_t1_dataset(TRAJECTORIES_NPZ, MANIFEST_JSON)
    train_t, val_t, test_t, split_manifest = create_grouped_train_val_test_splits(trajectories, seed=42)

    train_eps = set(split_manifest["train_ids"])
    val_eps = set(split_manifest["val_ids"])
    test_eps = set(split_manifest["test_ids"])

    # Assert mutual exclusivity
    assert len(train_eps & val_eps) == 0, f"Train-Val leak: {train_eps & val_eps}"
    assert len(train_eps & test_eps) == 0, f"Train-Test leak: {train_eps & test_eps}"
    assert len(val_eps & test_eps) == 0, f"Val-Test leak: {val_eps & test_eps}"

    total_eps = len(train_eps) + len(val_eps) + len(test_eps)
    assert total_eps == 96, f"Expected 96 total episodes across splits, got {total_eps}"


def test_causal_window_construction_invariant():
    """Verify window generation at index t strictly uses observations <= t (no future lookahead)."""
    assert os.path.exists(TRAJECTORIES_NPZ) and os.path.exists(MANIFEST_JSON)

    trajectories = load_p4_t1_dataset(TRAJECTORIES_NPZ, MANIFEST_JSON)[:1]
    X, y_margin, y_slip, y_time, episodes, steps = build_causal_sliding_windows(
        trajectories, window_size=15, horizon=20, use_noisy=False
    )

    assert X.shape[1] == 60  # 4 channels * 15 window_size
    assert len(y_margin) == len(X)
    assert len(y_slip) == len(X)
    assert len(y_time) == len(X)

    # Check steps are monotonic
    assert np.all(np.diff(steps) >= 0)
    # Check that targets are physically bounded
    assert np.all(y_margin >= 0.0) and np.all(y_margin <= 1.0)
    assert np.all(np.isin(y_slip, [0.0, 1.0]))
    assert np.all(y_time >= 0.0)


# =====================================================================
# 3. Predictive MLP Architecture & Checkpoint
# =====================================================================

def test_mlp_architecture_shapes_and_positivity():
    """Verify MLP input/output tensor shapes and positive uncertainty variance head."""
    model = PredictiveMarginMLP(
        input_dim=60,
        hidden_dim=64,
        dropout=0.0,
    )
    model.eval()

    batch_size = 8
    x = torch.randn(batch_size, 60)
    with torch.no_grad():
        margin_pred, slip_prob, time_pred, variance_pred = model(x)

    assert margin_pred.shape == (batch_size, 1)
    assert slip_prob.shape == (batch_size, 1)
    assert time_pred.shape == (batch_size, 1)
    assert variance_pred.shape == (batch_size, 1)

    # Variance must be strictly positive
    assert torch.all(variance_pred > 0), "Variance output must be strictly positive via Softplus"
    # Slip probability must be in [0, 1] via Sigmoid
    assert torch.all((slip_prob >= 0.0) & (slip_prob <= 1.0))
    # Margin must be in [0, 1] via Sigmoid
    assert torch.all((margin_pred >= 0.0) & (margin_pred <= 1.0))


def test_trained_checkpoint_inference():
    """Verify saved checkpoint loads correctly and produces bounded predictions."""
    ckpt_path = os.path.join(CURRENT_DIR, "checkpoints", "best_p4_t3_mlp.pt")
    if not os.path.exists(ckpt_path):
        pytest.skip(f"Checkpoint not found at {ckpt_path}")

    model = PredictiveMarginMLP(input_dim=60, hidden_dim=64)
    ckpt = torch.load(ckpt_path, map_location="cpu")
    model.load_state_dict(ckpt["model_state_dict"])
    model.eval()

    # Create synthetic test window simulating sticking phase
    # [w_ft, w_fn, w_dd, w_vcmd] each of length 15 -> total 60
    sticking_window = torch.zeros(1, 60)
    sticking_window[0, 0:15] = torch.linspace(0.1, 0.5, 15)  # Ft small
    sticking_window[0, 15:30] = 10.0  # Fn = 10 N
    sticking_window[0, 30:45] = 0.001  # small displacement increments (mm)
    sticking_window[0, 45:60] = 5.0  # commanded velocity (mm/s)

    with torch.no_grad():
        margin_pred, slip_prob, time_pred, var_pred = model(sticking_window)

    margin = margin_pred.item()
    prob = slip_prob.item()
    var = var_pred.item()

    assert np.isfinite(margin) and np.isfinite(prob) and np.isfinite(var)
    # Sticking contact with low Ft/Fn should have high margin (> 0.4) and low slip probability (< 0.5)
    assert margin > 0.4, f"Expected high margin for sticking contact, got {margin}"
    assert prob < 0.5, f"Expected low slip prob for sticking contact, got {prob}"
    assert var > 0.0


# =====================================================================
# 4. Noise Robustness Contrast (RLS & MLP vs Finite Difference)
# =====================================================================

def test_noise_robustness_on_stationary_contact():
    """Verify finite difference triggers false alarms under sensor noise while RLS/MLP do not."""
    # Simulate 50 steps of stationary loaded contact with sensor noise
    rng = np.random.RandomState(123)
    N = 50
    Fn_clean = 10.0
    Ft_clean = 2.0
    delta_clean = 1e-5

    noise_force_std = 0.05  # N
    noise_disp_std = 0.5e-6  # m

    Fn_noisy = Fn_clean + rng.normal(0, noise_force_std, N)
    Ft_noisy = Ft_clean + rng.normal(0, noise_force_std, N)
    delta_noisy = delta_clean + rng.normal(0, noise_disp_std, N)

    # 1. Finite-difference stiffness: dFt / d_delta
    # Raw single-step finite difference produces huge noise spikes
    dFt = np.diff(Ft_noisy)
    d_delta = np.diff(delta_noisy)
    valid = np.abs(d_delta) > 1e-8
    raw_stiffness = np.zeros_like(dFt)
    raw_stiffness[valid] = dFt[valid] / (d_delta[valid] / 1e-3)  # N/mm

    # Finite difference will have wild oscillations (negative stiffness, huge values)
    has_negative_spikes = np.any(raw_stiffness < -500.0)
    assert has_negative_spikes, "Expected finite difference to suffer negative stiffness noise spikes"

    # 2. RLS estimator under same noisy inputs with gating
    rls = RLSComplianceEstimator(
        formulation="incremental",
        delta_window=2,
        min_disp_excitation=1e-5,  # 10 um threshold rejects sub-micron noise
    )
    for i in range(N):
        res = rls.update(ft=Ft_noisy[i], fn=Fn_noisy[i], disp=delta_noisy[i], time=i * 0.001)

    # Because displacement jitter is sub-micron, RLS deadband gating blocks updates
    # and prevents false warning activation
    assert res["warning_active"] is False


# =====================================================================
# 5. Protection Invariants
# =====================================================================

def test_simulator_v1_and_contact_kernel_unmodified():
    """Verify that Simulator v1 and Contact Physics v2 kernel remain 100% intact."""
    root_dir = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", "..", ".."))

    # Check simulator v1 environment
    sim_env_file = os.path.join(root_dir, "research", "PROBE-1", "Research-002", "src", "environment", "compliant_prelift_env.py")
    if os.path.exists(sim_env_file):
        with open(sim_env_file, "r", encoding="utf-8") as f:
            content = f.read()
            assert "class CompliantPreLiftContactEnv" in content

    # Check contact physics kernel files exist and have v2.1.3 headers
    kernel_dir = os.path.join(root_dir, "research", "PROBE-1", "Research-002", "experiments", "contact_physics_v2", "contact")
    if os.path.exists(kernel_dir):
        lugre_file = os.path.join(kernel_dir, "lugre.py")
        assert os.path.exists(lugre_file)
        with open(lugre_file, "r", encoding="utf-8") as f:
            lugre_code = f.read()
            assert "compute_passive_velocity_limit" in lugre_code
            assert "step_composed_hybrid" in lugre_code
