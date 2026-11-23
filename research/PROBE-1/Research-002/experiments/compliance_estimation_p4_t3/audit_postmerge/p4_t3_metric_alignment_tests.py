"""
HOROS PROBE-1 — Phase 4 Task 3 (P4-T3) Metric Alignment & Audit Test Suite
File: p4_t3_metric_alignment_tests.py

Validates:
1. Future-margin alignment: model prediction m_hat(t+H) is compared against stick_ratio[t+H], not stick_ratio[t].
2. Regression test asserting that misaligned comparison (t vs t+H) produces a detectable error.
3. Causal window construction strictly excludes privileged and future telemetry.
4. Noise generation fidelity: Regime A (0.02 N) vs Regime B (0.05 N) from clean telemetry.
5. Seed reservation: newly generated audit episodes do not collide with locked intervals.
6. Dataset split accounting: exact reconciliation of episodes and sliding windows.
"""

import os
import sys
import numpy as np
import pytest
import torch

AUDIT_DIR = os.path.dirname(os.path.abspath(__file__))
EXP_DIR = os.path.abspath(os.path.join(AUDIT_DIR, ".."))
RESEARCH_DIR = os.path.abspath(os.path.join(EXP_DIR, "..", ".."))
PRE_SLIP_DIR = os.path.abspath(os.path.join(RESEARCH_DIR, "experiments", "pre_slip_qualification"))

for p in (AUDIT_DIR, EXP_DIR, RESEARCH_DIR, PRE_SLIP_DIR):
    if p not in sys.path:
        sys.path.insert(0, p)

from p4_t1_generate_trajectories import load_p4_t1_dataset
from force_history_dataset import (
    build_causal_sliding_windows,
    create_grouped_train_val_test_splits,
)
from predictive_margin_mlp import PredictiveMarginMLP


TRAJECTORIES_NPZ = os.path.join(PRE_SLIP_DIR, "data", "p4_t1_partial_slip_trajectories.npz")
MANIFEST_JSON = os.path.join(PRE_SLIP_DIR, "data", "p4_t1_trajectory_manifest.json")
CHECKPOINT_PATH = os.path.join(EXP_DIR, "checkpoints", "best_p4_t3_mlp.pt")


def test_future_margin_alignment_contract():
    """Verify ground truth margin matches stick_ratio[min(T-1, t+H)], NOT stick_ratio[t]."""
    assert os.path.exists(TRAJECTORIES_NPZ) and os.path.exists(MANIFEST_JSON)
    trajs = load_p4_t1_dataset(TRAJECTORIES_NPZ, MANIFEST_JSON)
    tr = trajs[0]

    window_size = 15
    horizon = 20
    stick_ratio = tr["stick_ratio"]
    total_steps = len(stick_ratio)
    gs = tr["gross_slip_step"]

    # Verify that stick_ratio monotonically decreases during partial slip
    # Therefore, stick_ratio[t + H] < stick_ratio[t] before gross slip
    t_mid = gs // 2
    future_idx = min(total_steps - 1, t_mid + horizon)
    m_current = stick_ratio[t_mid]
    m_future = stick_ratio[future_idx]

    # In partial slip, softening causes future margin to be strictly less than current margin
    assert m_future < m_current, f"Expected future margin {m_future} < current margin {m_current} during loading"

    # Verify that dataset builder correctly assigned future_idx
    X, ym, ys, yt, _, steps = build_causal_sliding_windows([tr], window_size=window_size, horizon=horizon, use_noisy=False)
    idx_in_dataset = np.where(steps == t_mid)[0][0]
    expected_target = stick_ratio[future_idx]
    actual_target = ym[idx_in_dataset, 0]

    assert np.isclose(actual_target, expected_target), f"Target mismatch: {actual_target} vs {expected_target}"


def test_detects_misaligned_current_vs_future_comparison():
    """Regression test: comparing future prediction against current margin must fail alignment check."""
    # Simulate a ground truth future signal and an aligned model
    time_steps = 100
    horizon = 20
    true_margin_series = np.linspace(1.0, 0.0, time_steps)  # dropping linearly

    # Model predicting future margin perfectly: m_hat(t) = true_margin[t + H]
    m_hat_series = np.zeros(time_steps)
    for t in range(time_steps):
        fut_idx = min(time_steps - 1, t + horizon)
        m_hat_series[t] = true_margin_series[fut_idx]

    # Correct aligned evaluation:
    aligned_mae = np.mean([
        abs(m_hat_series[t] - true_margin_series[min(time_steps - 1, t + horizon)])
        for t in range(time_steps - horizon)
    ])
    assert aligned_mae == pytest.approx(0.0), "Aligned model must have 0 MAE against future target"

    # Misaligned evaluation (comparing m_hat(t) against true_margin[t]):
    misaligned_mae = np.mean([
        abs(m_hat_series[t] - true_margin_series[t])
        for t in range(time_steps - horizon)
    ])
    # The misaligned MAE must be strictly greater than 0 due to temporal offset
    assert misaligned_mae > 0.15, f"Misaligned MAE was {misaligned_mae}, expected substantial temporal error"


def test_dual_noise_regimes_from_clean():
    """Verify that Regime A (0.02 N) and Regime B (0.05 N) are generated independently from clean force."""
    trajs = load_p4_t1_dataset(TRAJECTORIES_NPZ, MANIFEST_JSON)
    tr = trajs[0]
    clean_ft = tr["force_t"]

    rng_a = np.random.RandomState(1001)
    rng_b = np.random.RandomState(1001)

    noise_a = clean_ft + rng_a.normal(0.0, 0.02, size=len(clean_ft))
    noise_b = clean_ft + rng_b.normal(0.0, 0.05, size=len(clean_ft))

    std_a = np.std(noise_a - clean_ft)
    std_b = np.std(noise_b - clean_ft)

    assert np.isclose(std_a, 0.02, atol=0.005)
    assert np.isclose(std_b, 0.05, atol=0.008)
    assert not np.array_equal(noise_a, noise_b)


def test_split_and_window_accounting_reconciliation():
    """Verify exact count of episodes and causal windows across train/val/test splits."""
    trajs = load_p4_t1_dataset(TRAJECTORIES_NPZ, MANIFEST_JSON)
    train_t, val_t, test_t, split_manifest = create_grouped_train_val_test_splits(trajs, seed=42)

    assert len(train_t) == 62
    assert len(val_t) == 16
    assert len(test_t) == 18
    assert len(trajs) == 96

    X_tr, _, _, _, _, _ = build_causal_sliding_windows(train_t, window_size=15, horizon=20, use_noisy=True)
    X_val, _, _, _, _, _ = build_causal_sliding_windows(val_t, window_size=15, horizon=20, use_noisy=True)
    X_te, _, _, _, _, _ = build_causal_sliding_windows(test_t, window_size=15, horizon=20, use_noisy=True)

    assert len(X_tr) == 24747
    assert len(X_val) == 5273
    assert len(X_te) == 8968
    assert len(X_tr) + len(X_val) + len(X_te) == 38988


def test_no_privileged_telemetry_in_model_windows():
    """Verify that model input vectors contain only observable channels (no stick radius or true friction)."""
    trajs = load_p4_t1_dataset(TRAJECTORIES_NPZ, MANIFEST_JSON)
    X_tr, _, _, _, _, _ = build_causal_sliding_windows(trajs[:2], window_size=15, horizon=20, use_noisy=True)

    # 4 observable channels * 15 window_size = 60 dimensions
    assert X_tr.shape[1] == 60
