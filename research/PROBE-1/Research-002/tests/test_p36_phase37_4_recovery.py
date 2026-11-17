"""
HOROS PROBE-1 — Research-002: Regression & Verification Suite for Phase 3.7.4.

Verifies:
1. Deliverable artifacts exist on disk and follow expected schemas.
2. Manifest v1.0 registers authorization (execution_authorized: 1, training_permitted: 0)
   and recovery parameters.
3. Gates R1–R5 all pass according to pre-registered criteria without artificial shortcuts.
4. Main acceptance criterion: Zero unauthorized transitions back to TRUST while latch is active.
5. All six physical scenarios (Normal, Degradation, Slip Disappears, Sustained Degradation,
   Satisfied Recovery, Unverified Recovery) execute strictly according to specification.
6. Policy unit mechanics: persistent latching, dwell settle, verification micro-probe, fail-closed terminal state.
7. Zero world model parameter training (0 weight updates, 0 gradient steps).
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

import numpy as np
import pytest

TESTS_DIR = Path(__file__).resolve().parent
R002_ROOT = TESTS_DIR.parent
SRC_DIR = R002_ROOT / "src"

import sys
if str(R002_ROOT) not in sys.path:
    sys.path.insert(0, str(R002_ROOT))
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from src.integrated.phase37_3_trust_policy import (
    TriState,
    TrustAwareWorldModel,
    TrustPolicyConfig,
)
from src.integrated.phase37_4_recovery_policy import (
    PersistentSafetyRecoveryPolicy,
    RecoveryConfig,
    SafetyLatchState,
)


@pytest.fixture(scope="module")
def phase37_4_results() -> Dict[str, Any]:
    results_path = R002_ROOT / "experiments" / "phase3_7_uncertainty_intelligence" / "phase37_4_results.json"
    assert results_path.is_file(), f"Missing Phase 3.7.4 results JSON at {results_path}"
    with open(results_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="module")
def phase37_4_manifest() -> Dict[str, Any]:
    manifest_path = R002_ROOT / "manifests" / "phase37_4_recovery_manifest.json"
    assert manifest_path.is_file(), f"Missing Phase 3.7.4 manifest at {manifest_path}"
    with open(manifest_path, "r", encoding="utf-8") as f:
        return json.load(f)


def test_phase37_4_deliverables_exist() -> None:
    manifest_path = R002_ROOT / "manifests" / "phase37_4_recovery_manifest.json"
    results_path = R002_ROOT / "experiments" / "phase3_7_uncertainty_intelligence" / "phase37_4_results.json"
    report_path = R002_ROOT / "experiments" / "phase3_7_uncertainty_intelligence" / "phase37_4_execution_report.md"
    evidence_path = R002_ROOT / "experiments" / "phase3_7_uncertainty_intelligence" / "phase37_4_evidence.json"

    assert manifest_path.is_file(), "phase37_4_recovery_manifest.json does not exist"
    assert results_path.is_file(), "phase37_4_results.json does not exist"
    assert report_path.is_file(), "phase37_4_execution_report.md does not exist"
    assert evidence_path.is_file(), "phase37_4_evidence.json does not exist"
    assert report_path.stat().st_size > 500, "phase37_4_execution_report.md is suspiciously small"


def test_phase37_4_manifest_v1_registered(phase37_4_manifest: Dict[str, Any]) -> None:
    assert phase37_4_manifest.get("schema_version") == "phase37_4_recovery_manifest_v1.0"
    gov = phase37_4_manifest.get("governance", {})
    assert gov.get("execution_authorized") == 1
    assert gov.get("training_permitted") == 0
    assert gov.get("unauthorized_trust_tolerance") == 0

    latch_cfg = phase37_4_manifest.get("safety_latch", {})
    assert latch_cfg.get("tau_slip_mps") == 0.0010
    assert latch_cfg.get("min_latch_dwell_steps") == 5

    rec_cfg = phase37_4_manifest.get("recovery_protocol", {})
    assert rec_cfg.get("verify_probe_steps") == 3
    assert rec_cfg.get("verify_arm_dz_per_step_mm") == 0.02
    assert rec_cfg.get("max_recovery_attempts") == 1


def test_phase37_4_all_gates_pass(phase37_4_results: Dict[str, Any]) -> None:
    assert phase37_4_results.get("all_gates_passed") is True, "Not all Phase 3.7.4 gates passed"
    gates = phase37_4_results["gates"]

    assert gates["R1_zero_unauthorized_trust"]["status"] == "PASS"
    assert gates["R2_persistent_abstain_no_oscillation"]["status"] == "PASS"
    assert gates["R3_quiescent_dwell_enforcement"]["status"] == "PASS"
    assert gates["R4_fail_closed_unverified_recovery"]["status"] == "PASS"
    assert gates["R5_certified_recovery_success"]["status"] == "PASS"


def test_main_acceptance_zero_unauthorized_trust(phase37_4_results: Dict[str, Any]) -> None:
    crit = phase37_4_results.get("main_acceptance_criterion", {})
    assert crit.get("status") == "PASS"
    assert crit.get("observed") == 0
    assert crit.get("required") == 0

    # Also verify in Gate R1
    r1 = phase37_4_results["gates"]["R1_zero_unauthorized_trust"]
    assert r1["unauthorized_transitions"] == 0


def test_scenario_1_nominal_continuous_trust(phase37_4_results: Dict[str, Any]) -> None:
    scen1 = phase37_4_results["scenarios"]["scenario_1_normal_friction"]
    assert scen1["status"] == "PASS"
    assert scen1["false_abstentions"] == 0
    assert scen1["latch_trips"] == 0
    assert scen1["unauthorized_transitions_to_trust"] == 0


def test_scenario_2_and_3_latch_trips_and_step16_persists(phase37_4_results: Dict[str, Any]) -> None:
    scen2 = phase37_4_results["scenarios"]["scenario_2_friction_degradation"]
    assert scen2["status"] == "PASS"
    assert scen2["step_15_detected"] is True
    assert scen2["step_16_remained_abstain_despite_zero_slip"] is True
    assert scen2["step_16_measured_slip_zero"] is True
    assert scen2["unauthorized_transitions_to_trust"] == 0


def test_scenario_4_sustained_degradation_no_oscillation(phase37_4_results: Dict[str, Any]) -> None:
    scen4 = phase37_4_results["scenarios"]["scenario_4_degraded_friction_persists"]
    assert scen4["status"] == "PASS"
    assert scen4["mean_post_abstain_ratio"] == 1.0
    assert scen4["unauthorized_transitions_to_trust"] == 0
    # Exactly 2 state flips per episode (setup PROBE -> TRUST -> latched ABSTAIN), zero chattering
    for flips in scen4["state_flips_per_episode"]:
        assert flips <= 2


def test_scenario_5_recovery_protocol_success(phase37_4_results: Dict[str, Any]) -> None:
    scen5 = phase37_4_results["scenarios"]["scenario_5_recovery_satisfied"]
    assert scen5["status"] == "PASS"
    assert scen5["recovered_count"] == scen5["total_episodes"]
    assert scen5["recovery_success_rate"] == 1.0
    assert scen5["unauthorized_transitions_to_trust"] == 0


def test_scenario_6_recovery_unverified_fails_closed(phase37_4_results: Dict[str, Any]) -> None:
    scen6 = phase37_4_results["scenarios"]["scenario_6_recovery_unverified"]
    assert scen6["status"] == "PASS"
    assert scen6["failed_closed_count"] == scen6["total_episodes"]
    assert scen6["unauthorized_transitions_to_trust"] == 0


def test_zero_training_guarantee(phase37_4_results: Dict[str, Any]) -> None:
    assert phase37_4_results.get("training_performed") is False
    assert phase37_4_results.get("parameters_trained") == 0


def test_policy_unit_latch_and_recovery_mechanics() -> None:
    """Direct unit test of PersistentSafetyRecoveryPolicy state machine."""
    class DummyModel:
        pass

    base_model = TrustAwareWorldModel(
        base_world_model=DummyModel(),
        config=TrustPolicyConfig(tau_cusum_prelift=2.50),
        task="compliant_prelift",
    )
    policy = PersistentSafetyRecoveryPolicy(
        base_trust_model=base_model,
        recovery_config=RecoveryConfig(
            min_latch_dwell_steps=3,
            verify_probe_steps=2,
            tau_slip_mps=0.0010,
        ),
    )
    policy.reset_episode()
    # Establish identified mass after reset
    policy.trust_model.latent_mass_identified = True
    policy.trust_model.estimated_mass = 0.350
    assert policy.latch_state == SafetyLatchState.UNLATCHED
    assert policy.safety_latched is False

    nom_act = np.array([0.0, 0.0, 0.0, 0.0, 0.05], dtype=np.float32)

    # 1. Step under nominal conditions -> TRUST
    obs_nominal = {
        "finger_fn": np.array([4.0, 4.0, 4.0, 4.0], dtype=np.float32),
        "finger_ft": np.array([[0.0, 0.85], [0.0, 0.85], [0.0, 0.85], [0.0, 0.85]], dtype=np.float32),
        "delta_dot_t": np.zeros(4, dtype=np.float32),
    }
    dec1 = policy.evaluate_decision(obs_nominal, nom_act)
    assert dec1.state == TriState.TRUST
    assert policy.safety_latched is False

    # 2. Step with physical slip collapse -> Tripping Latch
    obs_slip = {
        "finger_fn": np.array([4.0, 4.0, 4.0, 4.0], dtype=np.float32),
        "finger_ft": np.array([[0.0, 0.85], [0.0, 0.85], [0.0, 0.85], [0.0, 0.85]], dtype=np.float32),
        "delta_dot_t": np.array([0.005, 0.005, 0.005, 0.005], dtype=np.float32),  # > tau_slip
    }
    dec2 = policy.evaluate_decision(obs_slip, nom_act)
    assert dec2.state == TriState.ABSTAIN
    assert policy.safety_latched is True
    assert policy.latch_state == SafetyLatchState.LATCHED_ABSTAIN
    assert np.all(dec2.action == 0.0)

    # 3. Next step: arm stopped, slip is zero! Policy must STRICTLY REMAIN in ABSTAIN!
    obs_zero_slip = {
        "finger_fn": np.array([4.0, 4.0, 4.0, 4.0], dtype=np.float32),
        "finger_ft": np.array([[0.0, 0.85], [0.0, 0.85], [0.0, 0.85], [0.0, 0.85]], dtype=np.float32),
        "delta_dot_t": np.zeros(4, dtype=np.float32),  # Instantaneous zero slip
    }
    dec3 = policy.evaluate_decision(obs_zero_slip, nom_act, allow_recovery_trigger=False)
    assert dec3.state == TriState.ABSTAIN
    assert policy.safety_latched is True
    assert np.all(dec3.action == 0.0)
    assert policy.unauthorized_trust_attempts >= 1  # Underlying model wanted TRUST, latch blocked it!

    # 4. Fail-closed test on unverified recovery:
    # Trigger recovery under degraded slip
    policy.latch_state = SafetyLatchState.RECOVERING_VERIFY
    policy.verify_step_count = 0
    obs_verify_slipping = {
        "finger_fn": np.array([4.0, 4.0, 4.0, 4.0], dtype=np.float32),
        "finger_ft": np.array([[0.0, 0.85], [0.0, 0.85], [0.0, 0.85], [0.0, 0.85]], dtype=np.float32),
        "delta_dot_t": np.array([0.002, 0.002, 0.002, 0.002], dtype=np.float32),  # Slipped during test
    }
    dec_fail = policy.evaluate_decision(obs_verify_slipping, nom_act)
    assert dec_fail.state == TriState.ABSTAIN
    assert policy.latch_state == SafetyLatchState.TERMINAL_ABSTAIN
    assert policy.safety_latched is True


def test_settle_timeout_fails_closed() -> None:
    """Verifies that persistent micro-slip during dwell settle times out into TERMINAL_ABSTAIN."""
    class DummyModel:
        pass

    base_model = TrustAwareWorldModel(
        base_world_model=DummyModel(),
        config=TrustPolicyConfig(),
        task="compliant_prelift",
    )
    base_model.latent_mass_identified = True
    base_model.estimated_mass = 0.350

    policy = PersistentSafetyRecoveryPolicy(
        base_trust_model=base_model,
        recovery_config=RecoveryConfig(
            min_latch_dwell_steps=5,
            settle_timeout_steps=10,  # 10 steps timeout
            max_quiescent_slip_mps=0.0001,
        ),
    )
    policy.reset_episode()
    policy.safety_latched = True
    policy.latch_state = SafetyLatchState.RECOVERING_SETTLE
    policy.total_settle_steps = 0

    nom_act = np.array([0.0, 0.0, 0.0, 0.0, 0.05], dtype=np.float32)
    obs_micro_slip = {
        "finger_fn": np.array([4.0, 4.0, 4.0, 4.0], dtype=np.float32),
        "finger_ft": np.array([[0.0, 0.85], [0.0, 0.85], [0.0, 0.85], [0.0, 0.85]], dtype=np.float32),
        "delta_dot_t": np.array([0.0003, 0.0003, 0.0003, 0.0003], dtype=np.float32),  # > max_quiescent_slip_mps
    }

    # Step 9 times: still in settle dwell
    for step_i in range(9):
        dec = policy.evaluate_decision(obs_micro_slip, nom_act)
        assert policy.latch_state == SafetyLatchState.RECOVERING_SETTLE
        assert dec.state == TriState.ABSTAIN

    # Step 10: hits settle_timeout_steps -> must fail closed to TERMINAL_ABSTAIN
    dec10 = policy.evaluate_decision(obs_micro_slip, nom_act)
    assert policy.latch_state == SafetyLatchState.TERMINAL_ABSTAIN
    assert dec10.state == TriState.ABSTAIN
    assert dec10.reason == "RECOVERY_SETTLE_TIMEOUT_EXCEEDED"
    assert policy.recovery_attempts == 1


def test_elevated_cusum_prevents_recovery() -> None:
    """Verifies that elevated CUSUM drift during verification prevents unauthorized recovery."""
    class DummyModel:
        pass

    base_model = TrustAwareWorldModel(
        base_world_model=DummyModel(),
        config=TrustPolicyConfig(),
        task="compliant_prelift",
    )
    policy = PersistentSafetyRecoveryPolicy(
        base_trust_model=base_model,
        recovery_config=RecoveryConfig(
            verify_probe_steps=3,
            tau_cusum_recovery=1.50,
        ),
    )
    policy.reset_episode()
    policy.trust_model.latent_mass_identified = True
    policy.trust_model.estimated_mass = 0.350
    policy.safety_latched = True
    policy.latch_state = SafetyLatchState.RECOVERING_VERIFY
    policy.verify_step_count = 0
    # Simulate elevated CUSUM statistic
    policy.trust_model.cusum_statistic = 2.10  # > 1.50

    nom_act = np.array([0.0, 0.0, 0.0, 0.0, 0.05], dtype=np.float32)
    obs_no_slip = {
        "finger_fn": np.array([4.0, 4.0, 4.0, 4.0], dtype=np.float32),
        "finger_ft": np.array([[0.0, 0.85], [0.0, 0.85], [0.0, 0.85], [0.0, 0.85]], dtype=np.float32),
        "delta_dot_t": np.zeros(4, dtype=np.float32),
    }

    dec = policy.evaluate_decision(obs_no_slip, nom_act)
    assert dec.state == TriState.ABSTAIN
    assert dec.reason == "RECOVERY_VERIFICATION_CUSUM_ELEVATED"
    assert policy.latch_state == SafetyLatchState.TERMINAL_ABSTAIN
    assert policy.recovery_attempts == 1


def test_max_recovery_attempts_enforced() -> None:
    """Verifies that a failed recovery cannot be repeatedly retried."""
    class DummyModel:
        pass

    base_model = TrustAwareWorldModel(
        base_world_model=DummyModel(),
        config=TrustPolicyConfig(),
        task="compliant_prelift",
    )
    base_model.latent_mass_identified = True
    base_model.estimated_mass = 0.350

    policy = PersistentSafetyRecoveryPolicy(
        base_trust_model=base_model,
        recovery_config=RecoveryConfig(
            max_recovery_attempts=1,
            min_latch_dwell_steps=2,
        ),
    )
    policy.reset_episode()
    policy.safety_latched = True
    policy.latch_state = SafetyLatchState.LATCHED_ABSTAIN
    policy.latch_trigger_step = 10
    policy.step_index = 15
    policy.recovery_attempts = 1  # Already attempted and failed once

    nom_act = np.array([0.0, 0.0, 0.0, 0.0, 0.05], dtype=np.float32)
    obs = {
        "finger_fn": np.array([4.0, 4.0, 4.0, 4.0], dtype=np.float32),
        "finger_ft": np.array([[0.0, 0.85], [0.0, 0.85], [0.0, 0.85], [0.0, 0.85]], dtype=np.float32),
        "delta_dot_t": np.zeros(4, dtype=np.float32),
    }

    dec = policy.evaluate_decision(obs, nom_act, allow_recovery_trigger=True)
    # Must immediately lock into TERMINAL_ABSTAIN without re-entering settle
    assert policy.latch_state == SafetyLatchState.TERMINAL_ABSTAIN
    assert dec.state == TriState.ABSTAIN


def test_report_metrics_normal_friction_and_forces(phase37_4_results: Dict[str, Any]) -> None:
    """Verifies that physical normal-friction and maximum-force reporting metrics are populated and compliant."""
    scens = phase37_4_results["scenarios"]
    s1 = scens["scenario_1_normal_friction"]
    assert "max_fn_n" in s1
    assert "max_fn_per_finger_n" in s1
    assert "mean_fz_n" in s1
    assert s1["max_fn_n"] > 0.0
    assert s1["max_fn_per_finger_n"] < 20.0  # Dynamic crush limit

    s4 = scens["scenario_4_degraded_friction_persists"]
    assert "max_fn_n" in s4
    assert "max_fn_per_finger_n" in s4
    assert s4["max_fn_n"] > 0.0
    assert s4["max_fn_per_finger_n"] < 20.0


# -----------------------------------------------------------------------------
# Phase 3.7.4.2 — Recovery Re-entry Trust Invariant Regression Tests
# -----------------------------------------------------------------------------

def test_recovery_reentry_rejects_underlying_abstain_conformal_bound() -> None:
    """Verifies that an underlying conformal-bound exceedance during verification prevents recovery."""
    class DummyModel:
        pass

    base_model = TrustAwareWorldModel(
        base_world_model=DummyModel(),
        config=TrustPolicyConfig(delta_safe_prelift_m=0.002),
        task="compliant_prelift",
    )
    base_model.latent_mass_identified = True
    base_model.estimated_mass = 0.350
    # Mode 0 conformal bound 15.0 mm > delta_safe (2.0 mm) -> triggers CONFORMAL_BOUND_EXCEEDED
    base_model.mode_conformal_bounds = {0: 15.0}

    policy = PersistentSafetyRecoveryPolicy(
        base_trust_model=base_model,
        recovery_config=RecoveryConfig(verify_probe_steps=3),
    )
    policy.reset_episode()
    policy.safety_latched = True
    policy.latch_state = SafetyLatchState.RECOVERING_VERIFY
    policy.verify_step_count = 0

    nom_act = np.array([0.0, 0.0, 0.0, 0.0, 0.05], dtype=np.float32)
    obs = {
        "finger_fn": np.array([4.0, 4.0, 4.0, 4.0], dtype=np.float32),
        "finger_ft": np.array([[0.0, 0.85], [0.0, 0.85], [0.0, 0.85], [0.0, 0.85]], dtype=np.float32),
        "delta_dot_t": np.zeros(4, dtype=np.float32),
    }

    dec = policy.evaluate_decision(obs, nom_act)
    assert policy.latch_state == SafetyLatchState.TERMINAL_ABSTAIN
    assert dec.state == TriState.ABSTAIN
    assert "CONFORMAL_BOUND_EXCEEDED" in dec.reason
    assert np.all(dec.action == 0.0)
    assert policy.recovery_attempts == 1
    assert policy.recovery_successful is False
    assert dec.state != TriState.TRUST


def test_recovery_reentry_rejects_underlying_abstain_feature_support() -> None:
    """Verifies that an underlying feature-support outlier during verification prevents recovery."""
    class DummyModel:
        pass

    base_model = TrustAwareWorldModel(
        base_world_model=DummyModel(),
        config=TrustPolicyConfig(tau_feat=2.0),
        task="compliant_prelift",
    )
    base_model.latent_mass_identified = True
    base_model.estimated_mass = 0.350
    base_model.feature_ref = {
        "mu_feat": np.zeros(7, dtype=np.float32),
        "std_feat": np.ones(7, dtype=np.float32),
    }

    policy = PersistentSafetyRecoveryPolicy(
        base_trust_model=base_model,
        recovery_config=RecoveryConfig(verify_probe_steps=3),
    )
    policy.reset_episode()
    policy.safety_latched = True
    policy.latch_state = SafetyLatchState.RECOVERING_VERIFY
    policy.verify_step_count = 0

    nom_act = np.array([0.0, 0.0, 0.0, 0.0, 0.05], dtype=np.float32)
    # Severe outlier in wrenches channel -> norm(z) >> tau_feat (2.0)
    obs = {
        "finger_pos": np.zeros(4, dtype=np.float32),
        "wrenches": np.array([50.0, 50.0, 50.0], dtype=np.float32),
        "finger_fn": np.array([4.0, 4.0, 4.0, 4.0], dtype=np.float32),
        "finger_ft": np.array([[0.0, 0.85], [0.0, 0.85], [0.0, 0.85], [0.0, 0.85]], dtype=np.float32),
        "delta_dot_t": np.zeros(4, dtype=np.float32),
    }

    dec = policy.evaluate_decision(obs, nom_act)
    assert policy.latch_state == SafetyLatchState.TERMINAL_ABSTAIN
    assert dec.state == TriState.ABSTAIN
    assert "FEATURE_SUPPORT_OUTLIER" in dec.reason
    assert np.all(dec.action == 0.0)
    assert policy.recovery_attempts == 1
    assert policy.recovery_successful is False
    assert dec.state != TriState.TRUST


def test_recovery_reentry_rejects_underlying_probe_unidentified_mass() -> None:
    """Verifies that an underlying PROBE state (unidentified latent mass) fails closed and is never upgraded to TRUST."""
    class DummyModel:
        pass

    base_model = TrustAwareWorldModel(
        base_world_model=DummyModel(),
        config=TrustPolicyConfig(),
        task="compliant_prelift",
    )
    # Latent mass has NOT been identified
    base_model.latent_mass_identified = False
    base_model.estimated_mass = None

    policy = PersistentSafetyRecoveryPolicy(
        base_trust_model=base_model,
        recovery_config=RecoveryConfig(verify_probe_steps=3),
    )
    policy.reset_episode()
    policy.safety_latched = True
    policy.latch_state = SafetyLatchState.RECOVERING_VERIFY
    policy.verify_step_count = 0

    nom_act = np.array([0.0, 0.0, 0.0, 0.0, 0.05], dtype=np.float32)
    obs = {
        "finger_fn": np.array([4.0, 4.0, 4.0, 4.0], dtype=np.float32),
        "finger_ft": np.array([[0.0, 0.85], [0.0, 0.85], [0.0, 0.85], [0.0, 0.85]], dtype=np.float32),
        "delta_dot_t": np.zeros(4, dtype=np.float32),
    }

    dec = policy.evaluate_decision(obs, nom_act)
    assert policy.latch_state == SafetyLatchState.TERMINAL_ABSTAIN
    assert dec.state == TriState.ABSTAIN
    assert "PROBE" in dec.reason
    assert np.all(dec.action == 0.0)  # Commanded safe-hold, never upgraded or probing
    assert policy.recovery_attempts == 1
    assert policy.recovery_successful is False
    assert dec.state != TriState.TRUST


def test_recovery_reentry_rejects_underlying_abstain_at_final_verification_step() -> None:
    """Verifies that an underlying ABSTAIN occurring at the final verification step prevents recovery certification."""
    class DummyModel:
        pass

    base_model = TrustAwareWorldModel(
        base_world_model=DummyModel(),
        config=TrustPolicyConfig(delta_safe_prelift_m=0.002),
        task="compliant_prelift",
    )
    policy = PersistentSafetyRecoveryPolicy(
        base_trust_model=base_model,
        recovery_config=RecoveryConfig(verify_probe_steps=3),
    )
    policy.reset_episode()
    policy.trust_model.latent_mass_identified = True
    policy.trust_model.estimated_mass = 0.350
    policy.trust_model.mode_conformal_bounds = {0: 1.0}  # Valid bound initially
    policy.safety_latched = True
    policy.latch_state = SafetyLatchState.RECOVERING_VERIFY
    policy.verify_step_count = 0

    nom_act = np.array([0.0, 0.0, 0.0, 0.0, 0.05], dtype=np.float32)
    obs = {
        "finger_fn": np.array([4.0, 4.0, 4.0, 4.0], dtype=np.float32),
        "finger_ft": np.array([[0.0, 0.85], [0.0, 0.85], [0.0, 0.85], [0.0, 0.85]], dtype=np.float32),
        "delta_dot_t": np.zeros(4, dtype=np.float32),
    }

    # Step 1: Nominal -> PROBE (micro-probe active)
    dec1 = policy.evaluate_decision(obs, nom_act)
    assert policy.latch_state == SafetyLatchState.RECOVERING_VERIFY
    assert dec1.state == TriState.PROBE
    assert policy.verify_step_count == 1

    # Step 2: Nominal -> PROBE (micro-probe active)
    dec2 = policy.evaluate_decision(obs, nom_act)
    assert policy.latch_state == SafetyLatchState.RECOVERING_VERIFY
    assert dec2.state == TriState.PROBE
    assert policy.verify_step_count == 2

    # Step 3 (Final step): Underlying model triggers ABSTAIN via conformal breach
    policy.trust_model.mode_conformal_bounds = {0: 10.0}
    dec3 = policy.evaluate_decision(obs, nom_act)

    # Must immediately abort recovery and fail closed to TERMINAL_ABSTAIN
    assert policy.latch_state == SafetyLatchState.TERMINAL_ABSTAIN
    assert dec3.state == TriState.ABSTAIN
    assert "CONFORMAL_BOUND_EXCEEDED" in dec3.reason
    assert np.all(dec3.action == 0.0)
    assert policy.recovery_attempts == 1
    assert policy.recovery_successful is False
    assert dec3.state != TriState.TRUST


def test_recovery_reentry_certified_when_underlying_trust_throughout() -> None:
    """Verifies that recovery is safely certified to TRUST when underlying model returns TRUST across all verification steps."""
    class DummyModel:
        pass

    base_model = TrustAwareWorldModel(
        base_world_model=DummyModel(),
        config=TrustPolicyConfig(delta_safe_prelift_m=0.002),
        task="compliant_prelift",
    )
    policy = PersistentSafetyRecoveryPolicy(
        base_trust_model=base_model,
        recovery_config=RecoveryConfig(verify_probe_steps=3, tau_cusum_recovery=1.50),
    )
    policy.reset_episode()
    policy.trust_model.latent_mass_identified = True
    policy.trust_model.estimated_mass = 0.350
    policy.trust_model.mode_conformal_bounds = {0: 1.0}
    policy.trust_model.cusum_statistic = 1.0  # < tau_cusum_recovery (1.50)
    policy.safety_latched = True
    policy.latch_state = SafetyLatchState.RECOVERING_VERIFY
    policy.verify_step_count = 0

    nom_act = np.array([0.0, 0.0, 0.0, 0.0, 0.05], dtype=np.float32)
    obs = {
        "finger_fn": np.array([4.0, 4.0, 4.0, 4.0], dtype=np.float32),
        "finger_ft": np.array([[0.0, 0.85], [0.0, 0.85], [0.0, 0.85], [0.0, 0.85]], dtype=np.float32),
        "delta_dot_t": np.zeros(4, dtype=np.float32),
    }

    # Step 1: Verification in progress
    dec1 = policy.evaluate_decision(obs, nom_act)
    assert dec1.state == TriState.PROBE
    assert policy.latch_state == SafetyLatchState.RECOVERING_VERIFY
    assert policy.verify_step_count == 1
    assert policy.trust_model.cusum_statistic == 1.0  # Not reset yet

    # Step 2: Verification in progress
    dec2 = policy.evaluate_decision(obs, nom_act)
    assert dec2.state == TriState.PROBE
    assert policy.latch_state == SafetyLatchState.RECOVERING_VERIFY
    assert policy.verify_step_count == 2
    assert policy.trust_model.cusum_statistic == 1.0  # Not reset yet

    # Step 3: Final step successfully passes -> RECOVERY CERTIFIED!
    dec3 = policy.evaluate_decision(obs, nom_act)
    assert dec3.state == TriState.TRUST
    assert dec3.reason == "RECOVERY_SUCCESSFUL_VERIFIED"
    assert policy.latch_state == SafetyLatchState.RECOVERED
    assert policy.safety_latched is False
    assert policy.recovery_successful is True
    assert policy.trust_model.cusum_statistic == 0.0  # Reset only upon full certification!
    assert np.allclose(dec3.action, nom_act)


def test_zero_unauthorized_transitions_across_all_failure_modes() -> None:
    """Verifies that across every possible recovery verification failure mode, zero unauthorized jumps to TRUST occur."""
    failure_cases = [
        ("conformal_breach", {"mode_conformal_bounds": {0: 25.0}}),
        ("elevated_cusum", {"cusum_statistic": 2.20}),
        ("unidentified_mass", {"latent_mass_identified": False}),
        ("excessive_slip", {"slip": 0.0020}),
        ("unsafe_shear_ratio", {"shear_fz": 5.0, "total_fn": 4.0}),  # Fz/Fn = 1.25 > 0.35
    ]

    for mode_name, override in failure_cases:
        class DummyModel:
            pass

        base_model = TrustAwareWorldModel(
            base_world_model=DummyModel(),
            config=TrustPolicyConfig(delta_safe_prelift_m=0.002),
            task="compliant_prelift",
        )
        policy = PersistentSafetyRecoveryPolicy(
            base_trust_model=base_model,
            recovery_config=RecoveryConfig(
                verify_probe_steps=3,
                tau_cusum_recovery=1.50,
                verify_max_slip_mps=0.0005,
                safe_shear_ratio_cap=0.35,
            ),
        )
        policy.reset_episode()
        policy.trust_model.latent_mass_identified = override.get("latent_mass_identified", True)
        policy.trust_model.estimated_mass = 0.350 if policy.trust_model.latent_mass_identified else None
        policy.trust_model.mode_conformal_bounds = override.get("mode_conformal_bounds", {0: 1.0})
        policy.trust_model.cusum_statistic = override.get("cusum_statistic", 0.0)
        policy.safety_latched = True
        policy.latch_state = SafetyLatchState.RECOVERING_VERIFY
        policy.verify_step_count = 0

        slip = override.get("slip", 0.0)
        fz_per_finger = override.get("shear_fz", 3.4) / 4.0
        fn_per_finger = override.get("total_fn", 16.0) / 4.0

        obs = {
            "finger_fn": np.array([fn_per_finger] * 4, dtype=np.float32),
            "finger_ft": np.array([[0.0, fz_per_finger]] * 4, dtype=np.float32),
            "delta_dot_t": np.array([slip] * 4, dtype=np.float32),
        }
        nom_act = np.array([0.0, 0.0, 0.0, 0.0, 0.05], dtype=np.float32)

        dec = policy.evaluate_decision(obs, nom_act)
        assert dec.state == TriState.ABSTAIN, f"Failure mode {mode_name} returned non-ABSTAIN {dec.state}"
        assert policy.latch_state == SafetyLatchState.TERMINAL_ABSTAIN, f"Failure mode {mode_name} did not fail closed"
        assert policy.recovery_successful is False, f"Failure mode {mode_name} certified recovery"
        assert np.all(dec.action == 0.0), f"Failure mode {mode_name} commanded non-zero action"
        assert dec.state != TriState.TRUST, f"Failure mode {mode_name} leaked unauthorized TRUST"


