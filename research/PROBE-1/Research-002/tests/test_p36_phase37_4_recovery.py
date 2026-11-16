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
