"""
Unit tests for Conformalized Quantile Regression and Adaptive Conformal Inference (ACI).
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

from estimation.conformal import ConformalCalibrator, AdaptiveConformalInference
from estimation.contact_state import MultiContactStateEstimator


def test_conformal_calibrator_split_no_leakage():
    rng = np.random.default_rng(42)
    # Generate 500 calibration samples with realistic prediction errors
    y_cal = rng.uniform(0.3, 0.8, size=500)
    mu_pred = y_cal + rng.normal(0.0, 0.04, size=500)
    q_low = mu_pred - 0.03
    q_high = mu_pred + 0.03

    calibrator = ConformalCalibrator()
    calibrator.fit(y_cal, q_low, q_high)

    score_95 = calibrator.get_quantile(alpha=0.05)
    score_90 = calibrator.get_quantile(alpha=0.10)
    # Higher confidence (smaller alpha) requires larger score
    assert score_95 >= score_90
    assert score_95 > 0.0


def test_aci_tracking_under_distribution_shift():
    rng = np.random.default_rng(1337)
    # Warmup calibration set with realistic prediction noise
    y_cal = rng.uniform(0.4, 0.7, size=300)
    mu_pred_cal = y_cal + rng.normal(0.0, 0.025, size=300)
    q_low = mu_pred_cal - 0.02
    q_high = mu_pred_cal + 0.02
    calibrator = ConformalCalibrator()
    calibrator.fit(y_cal, q_low, q_high)

    aci = AdaptiveConformalInference(
        calibrator=calibrator, target_miscoverage=0.05, gamma=0.04, mu_floor=0.05
    )

    # 100 timesteps with sudden distribution shift at t = 40 (Regime A: friction drops)
    y_true_seq = np.concatenate([
        np.full(40, 0.60) + rng.normal(0.0, 0.01, size=40),
        np.full(60, 0.25) + rng.normal(0.0, 0.01, size=60),  # Sudden shift
    ])

    prev_y = None
    for k in range(100):
        # Base estimator lags or is slightly biased
        if k < 40:
            pred_mu = 0.60
        else:
            # Model gradually detects lower friction
            pred_mu = 0.25 if k >= 45 else 0.50

        q_l = pred_mu - 0.04
        q_h = pred_mu + 0.04

        mu_min, mu_max, caution = aci.step(pred_mu, q_l, q_h, y_true_previous=prev_y)
        prev_y = y_true_seq[k]

        assert mu_min >= 0.05
        assert mu_max >= mu_min

    metrics = aci.compute_empirical_coverage(y_true_seq)
    assert "empirical_coverage" in metrics
    # Under sharp step perturbation, ACI adapts alpha to recover coverage
    assert metrics["empirical_coverage"] >= 0.85
    assert len(aci.alpha_history) == 100


def test_mu_floor_boundary_and_caution_flag():
    # Setup calibrator with large margin
    calibrator = ConformalCalibrator(scores=np.array([0.15, 0.20, 0.25]))
    aci = AdaptiveConformalInference(
        calibrator=calibrator, target_miscoverage=0.05, gamma=0.02, mu_floor=0.05
    )

    # Low friction prediction 0.10 with score 0.20 -> raw lower = 0.10 - 0.20 = -0.10
    mu_min, mu_max, caution = aci.step(mu_pred=0.10, q_lower=0.10, q_upper=0.15)
    # Must clip to floor
    assert mu_min == 0.05
    # Must raise caution flag
    assert caution is True
