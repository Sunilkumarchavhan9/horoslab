"""
HOROS PROBE-1 — Research-002: Regression & Verification Suite for Phase 3.7.3 (Manifest v2.0).

Verifies:
1. Deliverable artifacts exist on disk and follow expected schemas.
2. Manifest v2.0 formally registers authorization (execution_authorized: 1, training_permitted: 0)
   and updated physical probing parameters (35 steps, 2.0 mm, 10 N cap).
3. Gates T1–T5 all pass according to pre-registered criteria without artificial shortcuts.
4. ActiveMicroLiftEstimator physics, plateau detection, and safety clamps.
5. GeometryAwareCBFSafetyFilter v1.0 safe-hold certification under ABSTAIN.
6. Tri-State decision transitions across all 3 conditions (CUSUM, mode conformal, feature support).
7. Non-privileged input firewall (no mu_true, object_mass, clearance in decision inputs).
8. Zero world model parameter training (0 weight updates, 0 gradient steps).
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
from safety.geometry_cbf_safety_filter import (
    ClearanceMode,
    ClearanceSpecification,
    GeometryAwareCBFSafetyFilter,
)


@pytest.fixture(scope="module")
def phase37_3_results() -> dict:
    results_path = R002_ROOT / "experiments" / "phase3_7_uncertainty_intelligence" / "phase37_3_results.json"
    assert results_path.is_file(), f"Missing Phase 3.7.3 results JSON at {results_path}"
    with open(results_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="module")
def phase37_3_manifest() -> dict:
    manifest_path = R002_ROOT / "manifests" / "phase37_3_trust_manifest.json"
    assert manifest_path.is_file(), f"Missing Phase 3.7.3 manifest at {manifest_path}"
    with open(manifest_path, "r", encoding="utf-8") as f:
        return json.load(f)


def test_phase37_3_deliverables_exist() -> None:
    manifest_path = R002_ROOT / "manifests" / "phase37_3_trust_manifest.json"
    results_path = R002_ROOT / "experiments" / "phase3_7_uncertainty_intelligence" / "phase37_3_results.json"
    report_path = R002_ROOT / "experiments" / "phase3_7_uncertainty_intelligence" / "phase37_3_execution_report.md"
    receipt_path = R002_ROOT / "experiments" / "phase3_7_uncertainty_intelligence" / "phase37_3_exploratory_receipt.md"

    assert manifest_path.is_file(), "phase37_3_trust_manifest.json does not exist"
    assert results_path.is_file(), "phase37_3_results.json does not exist"
    assert report_path.is_file(), "phase37_3_execution_report.md does not exist"
    assert receipt_path.is_file(), "phase37_3_exploratory_receipt.md does not exist"
    assert report_path.stat().st_size > 500, "phase37_3_execution_report.md is suspiciously small"


def test_phase37_3_manifest_v2_registered(phase37_3_manifest: dict) -> None:
    assert phase37_3_manifest.get("schema_version") == "phase37_3_trust_manifest_v2.0"
    assert phase37_3_manifest.get("execution_authorized") == 1
    assert phase37_3_manifest.get("training_permitted") == 0
    probe_cfg = phase37_3_manifest["tri_state_policy"]["force_gated_micro_lift"]
    assert probe_cfg["probe_horizon_steps"] == 35
    assert probe_cfg["max_displacement_mm"] == 2.0
    assert probe_cfg["max_force_cap_n"] == 10.0


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
    assert t2["mass_r2_all_60_eps"] >= 0.60
    assert t2["mass_spearman_rho_all_60_eps"] >= 0.70

    # Gate T3
    t3 = gates["T3_tristate_decision_quality"]
    assert t3["status"] == "PASS"
    assert t3["trust_precision"] >= 0.90

    # Gate T4
    t4 = gates["T4_abstention_latency"]
    assert t4["status"] == "PASS"
    assert t4["mean_latency_contact_steps"] <= 3.0
    assert t4["mean_latency_contact_ms"] <= 30.0
    assert t4.get("artificial_fallback_removed") is True
    assert t4.get("uncapped_evaluation") is True

    # Gate T5
    t5 = gates["T5_artifact_immutability"]
    assert t5["status"] == "PASS"
    assert t5["mismatches"] == 0


def test_zero_training_guarantee(phase37_3_results: dict) -> None:
    assert phase37_3_results.get("training_performed") is False
    assert phase37_3_results.get("parameters_trained") == 0


def test_cbf_safety_filter_safe_hold_certification() -> None:
    """Verifies that GeometryAwareCBFSafetyFilter actively certifies upstream safe-hold commands."""
    cbf = GeometryAwareCBFSafetyFilter()
    spec = ClearanceSpecification(mode=ClearanceMode.ESTIMATED_CLEARANCE, c_hat_mm=0.25, sigma_c_mm=0.01)

    obs = {
        "pos": np.array([0.05, 0.05, -5.0]),
        "vel": np.zeros(3),
        "rot": np.zeros(3),
        "wrench": np.array([5.0, 5.0, 10.0, 0.1, 0.1, 0.2]),
        "stratum": 0,
    }
    raw_hold = np.zeros(6, dtype=np.float64)
    safe_act, info = cbf.filter_action(obs, raw_hold, clearance_spec=spec)

    assert info["is_safe"] is True
    assert np.all(safe_act == 0.0)


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
    m_target = 0.50
    w_target = m_target * 9.80665
    done = False
    m_est = None

    for step_idx in range(30):
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
        fz_ramp = 0.5 + step_i * 0.15
        if fz_ramp >= 9.8:
            fz_ramp = 9.8
        act, done, m_est = estimator.step(fz_ramp)
        if done:
            break
    assert done is True
    assert estimator.total_disp_mm >= 2.5


def test_trust_aware_world_model_tri_state_logic() -> None:
    cfg = TrustPolicyConfig(
        tau_cusum_prelift=2.50,
        conformal_alpha=0.08,
    )

    class DummyWorldModel:
        pass

    trust_model = TrustAwareWorldModel(
        base_world_model=DummyWorldModel(),
        conformal_quantiles={"q_state": 1.35, "q_wrench": 2.50},
        config=cfg,
        task="compliant_prelift",
    )

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


def test_runtime_three_condition_policy_reasons() -> None:
    """Verifies that runtime evaluate_decision correctly flags CUSUM, Conformal, and Feature support breaches."""
    cfg = TrustPolicyConfig(
        tau_cusum_prelift=2.50,
        tau_feat=3.0,
        conformal_alpha=0.08,
    )

    class DummyWorldModel:
        pass

    feat_ref = {
        "mu_feat": np.zeros(7, dtype=np.float32),
        "std_feat": np.ones(7, dtype=np.float32),
        "tau_feat": 3.0,
    }
    mode_bounds = {0: 1.0, 1: 25.0}  # Mode 1 exceeds delta_safe (20.0 mm)

    model = TrustAwareWorldModel(
        base_world_model=DummyWorldModel(),
        mode_conformal_bounds=mode_bounds,
        feature_reference=feat_ref,
        config=cfg,
        task="compliant_prelift",
    )

    nominal_obs = {
        "finger_pos": np.zeros(4, dtype=np.float32),
        "wrenches": np.zeros(3, dtype=np.float32),
        "finger_fn": np.array([4.0, 4.0, 4.0, 4.0], dtype=np.float32),
        "finger_ft": np.zeros((4, 2), dtype=np.float32),
        "delta_dot_t": np.zeros(4, dtype=np.float32),
    }
    act = np.array([0.0, 0.0, 0.0, 0.0, 0.05], dtype=np.float32)

    # 1. Feature outlier
    outlier_obs = dict(nominal_obs)
    outlier_obs["wrenches"] = np.array([10.0, 10.0, 10.0], dtype=np.float32)
    dec_feat = model.evaluate_decision(outlier_obs, act, pred_contact_mode=0)
    assert dec_feat.state == TriState.ABSTAIN
    assert dec_feat.reason == "FEATURE_SUPPORT_OUTLIER"

    # 2. Conformal bound exceeded
    dec_conf = model.evaluate_decision(nominal_obs, act, pred_contact_mode=1)
    assert dec_conf.state == TriState.ABSTAIN
    assert dec_conf.reason == "CONFORMAL_BOUND_EXCEEDED"

    # 3. CUSUM drift
    model.cusum_statistic = 3.5
    dec_cusum = model.evaluate_decision(nominal_obs, act, pred_contact_mode=0)
    assert dec_cusum.state == TriState.ABSTAIN
    assert dec_cusum.reason == "CUSUM_DRIFT"


def test_t4_genuine_uncapped_latency_no_synthetic_injection(phase37_3_results: dict) -> None:
    """Verifies that Gate T4 results are based on zero synthetic slip injection and genuine sensor features."""
    t4 = phase37_3_results["gates"]["T4_abstention_latency"]
    assert t4["status"] == "PASS"
    assert t4["synthetic_slip_injection"] is False
    assert t4["uncapped_evaluation"] is True
    assert t4["artificial_fallback_removed"] is True
    assert t4["mean_latency_contact_steps"] <= 3.0
    assert t4["mean_latency_contact_ms"] <= 30.0


def test_t5_full_explicit_sha256_verification(phase37_3_results: dict) -> None:
    """Verifies that Gate T5 evaluated all 21 files with zero cryptographic mismatches."""
    t5 = phase37_3_results["gates"]["T5_artifact_immutability"]
    assert t5["status"] == "PASS"
    assert t5["mismatches"] == 0
    assert t5["files_verified_count"] == 21
    assert len(t5["manifest_sha256"]) == 64
    assert t5.get("pre_execution_verified") is True
    assert t5.get("post_execution_verified") is True
    assert t5.get("immutability_violations") == 0
    assert t5.get("pre_execution_mismatches") == 0
    assert t5.get("post_execution_mismatches") == 0


def test_t1_actual_intervention_accounting(phase37_3_results: dict) -> None:
    """Verifies that Gate T1 reports exact actual intervention denominators and safe-hold executions."""
    t1 = phase37_3_results["gates"]["T1_safety_under_abstention"]
    assert t1["status"] == "PASS"
    assert t1["pih_cbf_evaluations"] == 40
    assert t1["prelift_abstention_interventions"] == 50
    assert t1["prelift_episodes_without_abstention"] == 10
    assert t1["total_intervention_episodes"] == 90
    assert t1["violations"] == 0
    assert t1["violation_rate"] == 0.0


def test_unidentified_mass_fail_closed_never_enters_trust() -> None:
    """Verifies that under contact, unidentified mass strictly commands PROBE or fails closed to ABSTAIN, never TRUST."""
    cfg = TrustPolicyConfig(
        probe_horizon_steps=35,
        tau_cusum_prelift=2.50,
        conformal_alpha=0.08,
    )

    class DummyWorldModel:
        pass

    model = TrustAwareWorldModel(
        base_world_model=DummyWorldModel(),
        config=cfg,
        task="compliant_prelift",
    )
    model.reset_episode()
    assert model.latent_mass_identified is False

    obs_contact = {
        "finger_pos": np.zeros(4, dtype=np.float32),
        "finger_fn": np.array([4.0, 4.0, 4.0, 4.0], dtype=np.float32),  # Contact established
        "finger_ft": np.zeros((4, 2), dtype=np.float32),
        "wrenches": np.zeros(3, dtype=np.float32),
        "delta_dot_t": np.zeros(4, dtype=np.float32),
    }
    nominal_act = np.array([0.0, 0.0, 0.0, 0.0, 0.05], dtype=np.float32)

    # Step through 40 steps without plateau (e.g. constant force)
    decisions = []
    for step_i in range(40):
        dec = model.evaluate_decision(obs_contact, nominal_act, pred_contact_mode=0)
        decisions.append(dec)

    # In steps 0..33 (probing in progress), state must be PROBE
    for step_i in range(34):
        assert decisions[step_i].state == TriState.PROBE, f"Step {step_i} was not PROBE"
        assert decisions[step_i].reason == "ACTIVE_MICRO_LIFT_PROBING"

    # From step 34 onward (35th step hits probe_horizon_steps=35 without plateau): must fail-closed to ABSTAIN
    for step_i in range(34, 40):
        assert decisions[step_i].state == TriState.ABSTAIN, f"Step {step_i} was not ABSTAIN"
        assert decisions[step_i].reason == "UNIDENTIFIED_MASS_FAIL_CLOSED"
        assert np.all(decisions[step_i].action == 0.0), "Fail-closed action must be safe hold"

    # Crucial invariant: zero decisions may EVER enter TRUST with unidentified mass
    for step_i, dec in enumerate(decisions):
        assert dec.state != TriState.TRUST, f"Strict invariant breached: step {step_i} entered TRUST with unidentified mass!"


def test_episode_isolation_wipes_all_runtime_state() -> None:
    """Verifies that reset_episode() completely cleans all runtime drift, mass, and probing state."""
    cfg = TrustPolicyConfig()

    class DummyWorldModel:
        pass

    model = TrustAwareWorldModel(
        base_world_model=DummyWorldModel(),
        config=cfg,
        task="compliant_prelift",
    )

    # Dirty the runtime state
    model.latent_mass_identified = True
    model.probing_failed_closed = True
    model.estimated_mass = 0.42
    model.cusum_statistic = 4.80
    model.step_index = 85
    model.micro_lift_estimator.probing_step = 22
    model.micro_lift_estimator.total_disp_mm = 1.10
    model.micro_lift_estimator.plateau_detected = True

    # Wipe state
    model.reset_episode()

    # Verify clean slate
    assert model.latent_mass_identified is False
    assert model.probing_failed_closed is False
    assert model.estimated_mass is None
    assert model.cusum_statistic == 0.0
    assert model.step_index == 0
    assert model.micro_lift_estimator.probing_step == 0
    assert model.micro_lift_estimator.total_disp_mm == 0.0
    assert model.micro_lift_estimator.plateau_detected is False


