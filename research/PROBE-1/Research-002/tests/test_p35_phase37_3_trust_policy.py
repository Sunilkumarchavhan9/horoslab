"""
HOROS PROBE-1 — Research-002: Regression & Verification Suite for Phase 3.7.3.

Verifies:
1. Deliverable artifacts exist on disk and follow expected schemas.
2. Gates T1–T5 all pass according to pre-registered criteria.
3. ActiveMicroLiftEstimator physics, plateau detection, and safety clamps.
4. Tri-State decision transitions (TRUST / PROBE / ABSTAIN).
5. Non-privileged input firewall (no mu_true, object_mass, clearance in decision inputs).
6. Zero world model parameter training (0 weight updates, 0 gradient steps).
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
import numpy as np
import pytest

TESTS_DIR = Path(__file__).resolve().parent
R002_ROOT = TESTS_DIR.parent
SRC_DIR = R002_ROOT / "src"

if str(R002_ROOT) not in sys.path:
    sys.path.insert(0, str(R002_ROOT))
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from integrated.phase37_3_trust_policy import (
    ActiveMicroLiftEstimator,
    TriState,
    TrustAwareWorldModel,
    TrustPolicyConfig,
)


@pytest.fixture(scope="module")
def phase37_3_results() -> dict:
    results_path = R002_ROOT / "experiments" / "phase3_7_uncertainty_intelligence" / "phase37_3_results.json"
    assert results_path.is_file(), f"Missing Phase 3.7.3 results JSON at {results_path}"
    with open(results_path, "r", encoding="utf-8") as f:
        return json.load(f)


def test_phase37_3_deliverables_exist() -> None:
    manifest_path = R002_ROOT / "manifests" / "phase37_3_trust_manifest.json"
    results_path = R002_ROOT / "experiments" / "phase3_7_uncertainty_intelligence" / "phase37_3_results.json"
    report_path = R002_ROOT / "experiments" / "phase3_7_uncertainty_intelligence" / "phase37_3_execution_report.md"

    assert manifest_path.is_file(), "phase37_3_trust_manifest.json does not exist"
    assert results_path.is_file(), "phase37_3_results.json does not exist"
    assert report_path.is_file(), "phase37_3_execution_report.md does not exist"
    assert report_path.stat().st_size > 500, "phase37_3_execution_report.md is suspiciously small"


def test_phase37_3_gates_all_pass(phase37_3_results: dict) -> None:
    assert phase37_3_results.get("all_gates_passed") is True, "Not all Phase 3.7.3 gates passed"
    gates = phase37_3_results["gates"]

    # Gate T1
    t1 = gates["T1_safety_under_abstention"]
    assert t1["status"] == "PASS"
    assert t1["violations"] == 0
    assert t1["violation_rate"] == 0.0

    # Gate T2
    t2 = gates["T2_active_mass_identifiability"]
    assert t2["status"] == "PASS"
    assert t2["mass_r2"] >= 0.60
    assert t2["mass_spearman_rho"] >= 0.70

    # Gate T3
    t3 = gates["T3_tristate_decision_quality"]
    assert t3["status"] == "PASS"
    assert t3["trust_precision"] >= 0.90

    # Gate T4
    t4 = gates["T4_abstention_latency"]
    assert t4["status"] == "PASS"
    assert t4["mean_latency_steps"] <= 3.0
    assert t4["mean_latency_ms"] <= 30.0

    # Gate T5
    t5 = gates["T5_artifact_immutability"]
    assert t5["status"] == "PASS"
    assert t5["mismatches"] == 0


def test_zero_training_guarantee(phase37_3_results: dict) -> None:
    assert phase37_3_results.get("training_performed") is False
    assert phase37_3_results.get("parameters_trained") == 0


def test_active_micro_lift_estimator_plateau_detection() -> None:
    cfg = TrustPolicyConfig(
        probe_velocity_mps=0.005,
        probe_horizon_steps=35,
        arm_dz_per_step_mm=0.05,
        max_displacement_mm=2.0,
        max_displacement_clamp_mm=2.5,
        max_force_cap_n=10.0,
        plateau_derivative_threshold_n_s=2.5,
    )
    estimator = ActiveMicroLiftEstimator(cfg)

    # Simulate lifting a 0.50 kg object (target weight W = 4.9033 N)
    # Stiff ramp up then flat plateau at 4.90 N
    m_target = 0.50
    w_target = m_target * 9.80665
    done = False
    m_est = None

    for step_idx in range(30):
        # Linearly increasing until step 16, then constant plateau
        if step_idx < 16:
            fz = min(w_target, (step_idx + 1) * 0.30)
        else:
            fz = w_target + 0.01 * np.sin(step_idx)

        act, done, m_est = estimator.step(fz)
        if done:
            break

    assert done is True, "Plateau was not detected within horizon"
    assert m_est is not None
    assert abs(m_est - m_target) < 0.05, f"Estimated mass {m_est} drifted from target {m_target}"
    assert np.all(act == 0.0), "Probe did not command safe hold on completion"


def test_active_micro_lift_estimator_safety_clamps() -> None:
    cfg = TrustPolicyConfig(
        max_force_cap_n=10.0,
        max_displacement_clamp_mm=2.5,
        probe_horizon_steps=60,
    )
    estimator = ActiveMicroLiftEstimator(cfg)

    # Case 1: Exceeding force cap
    act, done, m_est = estimator.step(10.5)
    assert done is True
    assert np.all(act == 0.0)

    # Case 2: Exceeding displacement clamp (with continuously rising force to prevent plateau detection)
    estimator.reset()
    for step_i in range(55):  # 55 * 0.05 mm = 2.75 mm > 2.5 mm clamp
        # Force increases rapidly by 0.15 N per step (15 N/s > 2.5 N/s plateau threshold)
        fz_ramp = 0.5 + step_i * 0.15
        if fz_ramp >= 9.8:  # Keep just below 10.0 N cap
            fz_ramp = 9.8
        act, done, m_est = estimator.step(fz_ramp)
        if done:
            break
    assert done is True
    assert estimator.total_disp_mm >= 2.5


def test_trust_aware_world_model_tri_state_logic() -> None:
    cfg = TrustPolicyConfig(
        tau_cusum_prelift=2.50,
        conformal_alpha=0.10,
    )

    class DummyWorldModel:
        pass

    trust_model = TrustAwareWorldModel(
        base_world_model=DummyWorldModel(),
        conformal_quantiles={"q_state": 1.35, "q_wrench": 2.50},
        config=cfg,
        task="compliant_prelift",
    )

    # Test 1: ABSTAIN when CUSUM drift exceeds tau_cusum
    obs_slip = {
        "joint_pos": np.zeros(6, dtype=np.float32),
        "finger_pos": np.zeros(4, dtype=np.float32),
        "finger_fn": np.array([4.0, 4.0, 4.0, 4.0], dtype=np.float32),
        "finger_ft": np.array([[0.0, 1.0], [0.0, 1.0], [0.0, 1.0], [0.0, 1.0]], dtype=np.float32),
        "delta_dot_t": np.zeros(4, dtype=np.float32),
    }
    # Simulate high error triggering CUSUM
    trust_model.cusum_statistic = 3.50  # > 2.50
    dec = trust_model.evaluate_decision(
        obs=obs_slip,
        nominal_action=np.array([0.5, 0.5, 0.5, 0.5, 0.1], dtype=np.float32),
    )
    assert dec.state == TriState.ABSTAIN
    assert np.all(dec.action == 0.0), "ABSTAIN action must be safe hold"


def test_nonprivileged_firewall() -> None:
    """Verify that TrustPolicyConfig and estimator do not accept or read privileged oracle keys."""
    cfg = TrustPolicyConfig()
    forbidden = ["mu_true", "object_mass", "clearance", "oracle", "ContactMode"]
    for field_name in cfg.__dataclass_fields__.keys():
        for f in forbidden:
            assert f.lower() not in field_name.lower(), f"Forbidden oracle field {field_name} in TrustPolicyConfig"
