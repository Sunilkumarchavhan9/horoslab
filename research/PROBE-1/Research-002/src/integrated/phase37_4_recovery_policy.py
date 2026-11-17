"""
HOROS PROBE-1 — Research-002: Phase 3.7.4 Persistent Safety & Recovery Policy.

Implements:
1. Persistent Safety Latch (ABSTAIN Latch):
   - Latches upon any qualifying physical safety event (slip collapse, CUSUM drift,
     conformal radius exceedance, feature outlier).
   - Enforces continuous safe-hold commands while latched.
   - Strictly prohibits unauthorized returns to TRUST merely because an instantaneous
     observation reports zero slip (eliminating TRUST/ABSTAIN chattering).
2. Explicit Controlled Recovery Protocol:
   - Mandatory Quiescent Settle Dwell (zero slip for N_dwell steps).
   - Observable Physical Verification (force-ratio check & micro-probe displacement test).
   - Fail-Closed Guarantee (fails closed to TERMINAL_ABSTAIN if recovery conditions cannot be verified).
3. Non-Privileged Governance:
   - Operates strictly on observable sensor channels (forces, pad stretch, observable slip, CUSUM).
   - Zero oracle leakage (mu_true, object_mass, and simulator contact mode labels are never privileged inputs).
   - Exactly zero world model parameter training.
"""

from __future__ import annotations

import copy
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

from src.integrated.phase37_3_trust_policy import (
    ActiveMicroLiftEstimator,
    TriState,
    TrustAwareWorldModel,
    TrustDecision,
    TrustPolicyConfig,
)


class SafetyLatchState(str, Enum):
    """Lifecycle states of the Phase 3.7.4 persistent safety and recovery architecture."""
    UNLATCHED = "UNLATCHED"                   # Nominal operation (TRUST / PROBE)
    LATCHED_ABSTAIN = "LATCHED_ABSTAIN"       # Safety breach tripped latch: persistent safe hold
    RECOVERING_SETTLE = "RECOVERING_SETTLE"   # Holding safe hold during quiescent dwell period
    RECOVERING_VERIFY = "RECOVERING_VERIFY"   # Executing observable safety verification check
    RECOVERED = "RECOVERED"                   # Recovery certified: safe return to TRUST
    TERMINAL_ABSTAIN = "TERMINAL_ABSTAIN"     # Recovery failed or unverified: permanent fail-closed hold


@dataclass(frozen=True)
class RecoveryConfig:
    """Configuration parameters for the Phase 3.7.4 safety latch and recovery protocol."""
    # Safety event thresholds
    tau_slip_mps: float = 0.0010              # 1.0 mm/s physical slip triggers latch under load
    tau_fz_loaded_n: float = 1.00             # Minimum vertical load for slip to be critical
    fn_contact_threshold_n: float = 0.50      # Grasp contact established
    tau_cusum_prelift: float = 2.50           # CUSUM drift trigger
    tau_cusum_recovery: float = 1.50          # CUSUM recovery hysteresis threshold

    # Settle / Dwell parameters
    min_latch_dwell_steps: int = 5            # Mandatory quiescent dwell steps (50 ms at dt=0.01s)
    max_quiescent_slip_mps: float = 0.0001    # Max slip allowable during settle (0.1 mm/s)
    settle_timeout_steps: int = 20            # Max steps to achieve settle before failing closed

    # Verification probe parameters
    verify_probe_steps: int = 3               # Micro-displacement test duration (30 ms)
    verify_arm_dz_per_step_mm: float = 0.02   # Minimal micro-lift quantum for safety verification
    verify_max_slip_mps: float = 0.0005       # Max slip permitted during verification micro-probe
    safe_shear_ratio_cap: float = 0.35        # Max observable Fz / Fn ratio for certified stability
    max_recovery_attempts: int = 1            # Single attempt allowed; fail-closed upon failure
    require_underlying_trust: bool = True     # Phase 3.7.4.2: Invariant requiring underlying model TRUST throughout verification

    # Safe hold actions
    safe_hold_action_prelift: Tuple[float, ...] = (0.0, 0.0, 0.0, 0.0, 0.0)
    safe_hold_action_pih: Tuple[float, ...] = (0.0, 0.0, 0.0, 0.0, 0.0, 0.0)


@dataclass
class RecoveryAuditRecord:
    """Audit log entry capturing state, decisions, and safety invariants at each step."""
    step: int
    latch_state: SafetyLatchState
    decision_state: TriState
    decision_reason: str
    action: np.ndarray
    max_slip_mps: float
    total_fn_n: float
    total_fz_n: float
    cusum_statistic: float
    unauthorized_trust_prevented: bool = False


class PersistentSafetyRecoveryPolicy:
    """
    Phase 3.7.4 Persistent Safety and Controlled Recovery Policy.

    Wraps TrustAwareWorldModel and enforces:
    1. Persistent ABSTAIN latching upon physical safety events.
    2. Continuous safe hold while latched.
    3. Zero unauthorized transitions back to TRUST.
    4. Controlled recovery protocol based on registered observable conditions.
    5. Fail-closed guarantee to TERMINAL_ABSTAIN when recovery cannot be established.
    """

    def __init__(
        self,
        base_trust_model: TrustAwareWorldModel,
        recovery_config: Optional[RecoveryConfig] = None,
    ):
        self.trust_model = base_trust_model
        self.cfg = recovery_config or RecoveryConfig()
        self.reset_episode()

    def reset_episode(self) -> None:
        """Resets all runtime latch, recovery state, and audit logs across episode boundaries."""
        self.trust_model.reset_episode()
        self.step_index = 0
        self.safety_latched = False
        self.latch_state = SafetyLatchState.UNLATCHED
        self.latch_trigger_step: Optional[int] = None
        self.latch_trigger_reason: Optional[str] = None
        self.dwell_step_count = 0
        self.total_settle_steps = 0
        self.verify_step_count = 0
        self.recovery_attempts = 0
        self.unauthorized_trust_attempts = 0
        self.recovery_successful = False
        self.audit_log: List[RecoveryAuditRecord] = []

    def evaluate_decision(
        self,
        obs: Dict[str, Any],
        nominal_action: np.ndarray,
        pred_contact_mode: int = 0,
        recent_residuals: Optional[List[float]] = None,
        allow_recovery_trigger: bool = True,
    ) -> TrustDecision:
        """
        Evaluates step decision enforcing persistent latch and controlled recovery.

        Returns:
            TrustDecision with state (TRUST / PROBE / ABSTAIN), certified safe action,
            and complete provenance.
        """
        self.step_index += 1

        # Extract observable physical features
        fn_vec = obs.get("finger_fn", np.zeros(4, dtype=np.float32))
        ft_mat = obs.get("finger_ft", np.zeros((4, 2), dtype=np.float32))
        total_fn = float(np.sum(fn_vec))
        total_fz = float(np.sum(ft_mat[:, 1])) if ft_mat.ndim == 2 and ft_mat.shape[1] >= 2 else 0.0
        max_slip_vel = float(np.max(obs.get("delta_dot_t", np.zeros(4))))
        contact_established = total_fn >= self.cfg.fn_contact_threshold_n

        safe_hold_act = np.array(
            self.cfg.safe_hold_action_prelift if self.trust_model.task == "compliant_prelift" else self.cfg.safe_hold_action_pih,
            dtype=np.float32,
        )

        # 1. Evaluate underlying decision layer
        underlying_dec = self.trust_model.evaluate_decision(
            obs=obs,
            nominal_action=nominal_action,
            pred_contact_mode=pred_contact_mode,
            recent_residuals=recent_residuals,
        )

        # 2. Check for qualifying safety breach tripping the latch
        # Qualifying events:
        # a) Slip collapse under vertical load
        slip_collapse = contact_established and max_slip_vel > self.cfg.tau_slip_mps and total_fz > self.cfg.tau_fz_loaded_n
        # b) Underlying decision layer returned ABSTAIN (CUSUM, conformal, feature outlier, or fail-closed mass)
        underlying_abstain = underlying_dec.state == TriState.ABSTAIN

        trip_latch = False
        trip_reason = ""
        if slip_collapse:
            trip_latch = True
            trip_reason = "SLIP_COLLAPSE"
        elif underlying_abstain:
            trip_latch = True
            trip_reason = underlying_dec.reason

        # ---------------------------------------------------------------------
        # State Machine: Persistent Safety Latch & Recovery Protocol
        # ---------------------------------------------------------------------

        # State 1: UNLATCHED
        if not self.safety_latched:
            if trip_latch:
                # Safety event detected: trip the latch immediately
                self.safety_latched = True
                self.latch_state = SafetyLatchState.LATCHED_ABSTAIN
                self.latch_trigger_step = self.step_index
                self.latch_trigger_reason = trip_reason

                audit_rec = RecoveryAuditRecord(
                    step=self.step_index,
                    latch_state=self.latch_state,
                    decision_state=TriState.ABSTAIN,
                    decision_reason=f"LATCHED_{trip_reason}",
                    action=safe_hold_act,
                    max_slip_mps=max_slip_vel,
                    total_fn_n=total_fn,
                    total_fz_n=total_fz,
                    cusum_statistic=self.trust_model.cusum_statistic,
                    unauthorized_trust_prevented=False,
                )
                self.audit_log.append(audit_rec)

                return TrustDecision(
                    state=TriState.ABSTAIN,
                    reason=f"LATCHED_{trip_reason}",
                    confidence=0.0,
                    action=safe_hold_act,
                    estimated_mass_kg=self.trust_model.estimated_mass,
                    cusum_statistic=self.trust_model.cusum_statistic,
                    conformal_radius=underlying_dec.conformal_radius,
                    feature_distance=underlying_dec.feature_distance,
                    safety_violation_prevented=True,
                )
            else:
                # Nominal unlatched operation: return underlying TRUST / PROBE
                audit_rec = RecoveryAuditRecord(
                    step=self.step_index,
                    latch_state=self.latch_state,
                    decision_state=underlying_dec.state,
                    decision_reason=underlying_dec.reason,
                    action=np.asarray(underlying_dec.action, dtype=np.float32),
                    max_slip_mps=max_slip_vel,
                    total_fn_n=total_fn,
                    total_fz_n=total_fz,
                    cusum_statistic=self.trust_model.cusum_statistic,
                    unauthorized_trust_prevented=False,
                )
                self.audit_log.append(audit_rec)
                return underlying_dec

        # If safety_latched is True, enforce the governance invariant:
        # Zero unauthorized transitions back to TRUST merely because slip temporarily disappeared!
        unauthorized_attempt = bool(underlying_dec.state == TriState.TRUST)
        if unauthorized_attempt:
            self.unauthorized_trust_attempts += 1

        # State 2: LATCHED_ABSTAIN
        if self.latch_state == SafetyLatchState.LATCHED_ABSTAIN:
            steps_latched = self.step_index - (self.latch_trigger_step or self.step_index)
            # Check if recovery protocol can be initiated
            if allow_recovery_trigger and steps_latched >= self.cfg.min_latch_dwell_steps:
                if self.recovery_attempts >= self.cfg.max_recovery_attempts:
                    # Recovery attempts exhausted: permanent fail-closed terminal safe hold
                    self.latch_state = SafetyLatchState.TERMINAL_ABSTAIN
                else:
                    self.latch_state = SafetyLatchState.RECOVERING_SETTLE
                    self.dwell_step_count = 0
                    self.total_settle_steps = 0

            audit_rec = RecoveryAuditRecord(
                step=self.step_index,
                latch_state=self.latch_state,
                decision_state=TriState.ABSTAIN,
                decision_reason="LATCHED_SAFETY_HOLD_PERSISTENT",
                action=safe_hold_act,
                max_slip_mps=max_slip_vel,
                total_fn_n=total_fn,
                total_fz_n=total_fz,
                cusum_statistic=self.trust_model.cusum_statistic,
                unauthorized_trust_prevented=unauthorized_attempt,
            )
            self.audit_log.append(audit_rec)

            return TrustDecision(
                state=TriState.ABSTAIN,
                reason="LATCHED_SAFETY_HOLD_PERSISTENT",
                confidence=0.0,
                action=safe_hold_act,
                estimated_mass_kg=self.trust_model.estimated_mass,
                cusum_statistic=self.trust_model.cusum_statistic,
                conformal_radius=underlying_dec.conformal_radius,
                feature_distance=underlying_dec.feature_distance,
                safety_violation_prevented=True,
            )

        # State 3: RECOVERING_SETTLE (Dwell Phase)
        if self.latch_state == SafetyLatchState.RECOVERING_SETTLE:
            self.total_settle_steps += 1
            if self.total_settle_steps >= self.cfg.settle_timeout_steps:
                # Settle timed out: persistent slip prevented quiescent dwell! Fail closed!
                self.latch_state = SafetyLatchState.TERMINAL_ABSTAIN
                self.recovery_attempts += 1
                audit_rec = RecoveryAuditRecord(
                    step=self.step_index,
                    latch_state=self.latch_state,
                    decision_state=TriState.ABSTAIN,
                    decision_reason="RECOVERY_SETTLE_TIMEOUT_EXCEEDED",
                    action=safe_hold_act,
                    max_slip_mps=max_slip_vel,
                    total_fn_n=total_fn,
                    total_fz_n=total_fz,
                    cusum_statistic=self.trust_model.cusum_statistic,
                    unauthorized_trust_prevented=unauthorized_attempt,
                )
                self.audit_log.append(audit_rec)
                return TrustDecision(
                    state=TriState.ABSTAIN,
                    reason="RECOVERY_SETTLE_TIMEOUT_EXCEEDED",
                    confidence=0.0,
                    action=safe_hold_act,
                    estimated_mass_kg=self.trust_model.estimated_mass,
                    cusum_statistic=self.trust_model.cusum_statistic,
                    conformal_radius=underlying_dec.conformal_radius,
                    feature_distance=underlying_dec.feature_distance,
                    safety_violation_prevented=True,
                )

            # Check quiescent stability
            if max_slip_vel <= self.cfg.max_quiescent_slip_mps:
                self.dwell_step_count += 1
                if self.dwell_step_count >= self.cfg.min_latch_dwell_steps:
                    # Dwell satisfied: proceed to active verification
                    self.latch_state = SafetyLatchState.RECOVERING_VERIFY
                    self.verify_step_count = 0
            else:
                # Residual slip detected during settle: reset dwell counter
                self.dwell_step_count = 0

            audit_rec = RecoveryAuditRecord(
                step=self.step_index,
                latch_state=self.latch_state,
                decision_state=TriState.ABSTAIN,
                decision_reason="RECOVERY_SETTLING_DWELL_ACTIVE",
                action=safe_hold_act,
                max_slip_mps=max_slip_vel,
                total_fn_n=total_fn,
                total_fz_n=total_fz,
                cusum_statistic=self.trust_model.cusum_statistic,
                unauthorized_trust_prevented=unauthorized_attempt,
            )
            self.audit_log.append(audit_rec)

            return TrustDecision(
                state=TriState.ABSTAIN,
                reason="RECOVERY_SETTLING_DWELL_ACTIVE",
                confidence=0.10,
                action=safe_hold_act,
                estimated_mass_kg=self.trust_model.estimated_mass,
                cusum_statistic=self.trust_model.cusum_statistic,
                conformal_radius=underlying_dec.conformal_radius,
                feature_distance=underlying_dec.feature_distance,
                safety_violation_prevented=True,
            )

        # State 4: RECOVERING_VERIFY (Verification Micro-Probe & Grasp Ratio Check)
        if self.latch_state == SafetyLatchState.RECOVERING_VERIFY:
            # Condition 0: Phase 3.7.4.2 Recovery Re-entry Trust Invariant
            # Inspect underlying_dec.state during every recovery verification step.
            # Must independently return TRUST throughout the complete verification sequence.
            if self.cfg.require_underlying_trust and underlying_dec.state != TriState.TRUST:
                self.latch_state = SafetyLatchState.TERMINAL_ABSTAIN
                self.recovery_attempts += 1
                if underlying_dec.state == TriState.ABSTAIN:
                    reason = f"RECOVERY_VERIFICATION_UNDERLYING_ABSTAIN_{underlying_dec.reason}"
                elif underlying_dec.state == TriState.PROBE:
                    reason = f"RECOVERY_VERIFICATION_UNDERLYING_PROBE_{underlying_dec.reason}"
                else:
                    reason = f"RECOVERY_VERIFICATION_UNDERLYING_NON_TRUST_{underlying_dec.state}"

                audit_rec = RecoveryAuditRecord(
                    step=self.step_index,
                    latch_state=self.latch_state,
                    decision_state=TriState.ABSTAIN,
                    decision_reason=reason,
                    action=safe_hold_act,
                    max_slip_mps=max_slip_vel,
                    total_fn_n=total_fn,
                    total_fz_n=total_fz,
                    cusum_statistic=self.trust_model.cusum_statistic,
                    unauthorized_trust_prevented=unauthorized_attempt,
                )
                self.audit_log.append(audit_rec)
                return TrustDecision(
                    state=TriState.ABSTAIN,
                    reason=reason,
                    confidence=0.0,
                    action=safe_hold_act,
                    estimated_mass_kg=self.trust_model.estimated_mass,
                    cusum_statistic=self.trust_model.cusum_statistic,
                    conformal_radius=underlying_dec.conformal_radius,
                    feature_distance=underlying_dec.feature_distance,
                    safety_violation_prevented=True,
                )

            # Condition A: Check slip during verification
            if max_slip_vel > self.cfg.verify_max_slip_mps:
                # Slip detected during micro-probe: verification failed closed!
                self.latch_state = SafetyLatchState.TERMINAL_ABSTAIN
                self.recovery_attempts += 1
                audit_rec = RecoveryAuditRecord(
                    step=self.step_index,
                    latch_state=self.latch_state,
                    decision_state=TriState.ABSTAIN,
                    decision_reason="RECOVERY_VERIFICATION_SLIP_DETECTED",
                    action=safe_hold_act,
                    max_slip_mps=max_slip_vel,
                    total_fn_n=total_fn,
                    total_fz_n=total_fz,
                    cusum_statistic=self.trust_model.cusum_statistic,
                    unauthorized_trust_prevented=unauthorized_attempt,
                )
                self.audit_log.append(audit_rec)
                return TrustDecision(
                    state=TriState.ABSTAIN,
                    reason="RECOVERY_VERIFICATION_SLIP_DETECTED",
                    confidence=0.0,
                    action=safe_hold_act,
                    estimated_mass_kg=self.trust_model.estimated_mass,
                    cusum_statistic=self.trust_model.cusum_statistic,
                    conformal_radius=underlying_dec.conformal_radius,
                    feature_distance=underlying_dec.feature_distance,
                    safety_violation_prevented=True,
                )

            # Condition B: Check force ratio stability
            shear_ratio = float(total_fz / max(1.0, total_fn))
            if total_fn >= self.cfg.fn_contact_threshold_n and shear_ratio > self.cfg.safe_shear_ratio_cap:
                # Force ratio unsafe: fail closed!
                self.latch_state = SafetyLatchState.TERMINAL_ABSTAIN
                self.recovery_attempts += 1
                audit_rec = RecoveryAuditRecord(
                    step=self.step_index,
                    latch_state=self.latch_state,
                    decision_state=TriState.ABSTAIN,
                    decision_reason="RECOVERY_VERIFICATION_UNSAFE_FORCE_RATIO",
                    action=safe_hold_act,
                    max_slip_mps=max_slip_vel,
                    total_fn_n=total_fn,
                    total_fz_n=total_fz,
                    cusum_statistic=self.trust_model.cusum_statistic,
                    unauthorized_trust_prevented=unauthorized_attempt,
                )
                self.audit_log.append(audit_rec)
                return TrustDecision(
                    state=TriState.ABSTAIN,
                    reason="RECOVERY_VERIFICATION_UNSAFE_FORCE_RATIO",
                    confidence=0.0,
                    action=safe_hold_act,
                    estimated_mass_kg=self.trust_model.estimated_mass,
                    cusum_statistic=self.trust_model.cusum_statistic,
                    conformal_radius=underlying_dec.conformal_radius,
                    feature_distance=underlying_dec.feature_distance,
                    safety_violation_prevented=True,
                )

            # Condition C: Enforce tau_cusum_recovery (P0)
            if self.trust_model.cusum_statistic > self.cfg.tau_cusum_recovery:
                # Elevated CUSUM drift: cannot certify recovery! Fail closed!
                self.latch_state = SafetyLatchState.TERMINAL_ABSTAIN
                self.recovery_attempts += 1
                audit_rec = RecoveryAuditRecord(
                    step=self.step_index,
                    latch_state=self.latch_state,
                    decision_state=TriState.ABSTAIN,
                    decision_reason="RECOVERY_VERIFICATION_CUSUM_ELEVATED",
                    action=safe_hold_act,
                    max_slip_mps=max_slip_vel,
                    total_fn_n=total_fn,
                    total_fz_n=total_fz,
                    cusum_statistic=self.trust_model.cusum_statistic,
                    unauthorized_trust_prevented=unauthorized_attempt,
                )
                self.audit_log.append(audit_rec)
                return TrustDecision(
                    state=TriState.ABSTAIN,
                    reason="RECOVERY_VERIFICATION_CUSUM_ELEVATED",
                    confidence=0.0,
                    action=safe_hold_act,
                    estimated_mass_kg=self.trust_model.estimated_mass,
                    cusum_statistic=self.trust_model.cusum_statistic,
                    conformal_radius=underlying_dec.conformal_radius,
                    feature_distance=underlying_dec.feature_distance,
                    safety_violation_prevented=True,
                )

            # Condition C: Verification micro-probe progression
            self.verify_step_count += 1
            if self.verify_step_count >= self.cfg.verify_probe_steps:
                # All verification criteria satisfied: RECOVERY CERTIFIED!
                self.latch_state = SafetyLatchState.RECOVERED
                self.safety_latched = False
                self.recovery_successful = True
                self.trust_model.cusum_statistic = 0.0  # Re-baseline CUSUM

                audit_rec = RecoveryAuditRecord(
                    step=self.step_index,
                    latch_state=self.latch_state,
                    decision_state=TriState.TRUST,
                    decision_reason="RECOVERY_SUCCESSFUL_VERIFIED",
                    action=np.asarray(nominal_action, dtype=np.float32),
                    max_slip_mps=max_slip_vel,
                    total_fn_n=total_fn,
                    total_fz_n=total_fz,
                    cusum_statistic=self.trust_model.cusum_statistic,
                    unauthorized_trust_prevented=False,
                )
                self.audit_log.append(audit_rec)

                return TrustDecision(
                    state=TriState.TRUST,
                    reason="RECOVERY_SUCCESSFUL_VERIFIED",
                    confidence=0.90,
                    action=nominal_action,
                    estimated_mass_kg=self.trust_model.estimated_mass,
                    cusum_statistic=0.0,
                    conformal_radius=underlying_dec.conformal_radius,
                    feature_distance=underlying_dec.feature_distance,
                )
            else:
                # Micro-probe test in progress: command minimal test displacement
                verify_act = np.array([0.0, 0.0, 0.0, 0.0, self.cfg.verify_arm_dz_per_step_mm], dtype=np.float32)
                audit_rec = RecoveryAuditRecord(
                    step=self.step_index,
                    latch_state=self.latch_state,
                    decision_state=TriState.PROBE,
                    decision_reason="RECOVERY_MICRO_PROBE_ACTIVE",
                    action=verify_act,
                    max_slip_mps=max_slip_vel,
                    total_fn_n=total_fn,
                    total_fz_n=total_fz,
                    cusum_statistic=self.trust_model.cusum_statistic,
                    unauthorized_trust_prevented=unauthorized_attempt,
                )
                self.audit_log.append(audit_rec)

                return TrustDecision(
                    state=TriState.PROBE,
                    reason="RECOVERY_MICRO_PROBE_ACTIVE",
                    confidence=0.50,
                    action=verify_act,
                    estimated_mass_kg=self.trust_model.estimated_mass,
                    cusum_statistic=self.trust_model.cusum_statistic,
                    conformal_radius=underlying_dec.conformal_radius,
                    feature_distance=underlying_dec.feature_distance,
                )

        # State 5: TERMINAL_ABSTAIN (Fail-Closed Terminal Hold)
        audit_rec = RecoveryAuditRecord(
            step=self.step_index,
            latch_state=SafetyLatchState.TERMINAL_ABSTAIN,
            decision_state=TriState.ABSTAIN,
            decision_reason="TERMINAL_ABSTAIN_FAIL_CLOSED",
            action=safe_hold_act,
            max_slip_mps=max_slip_vel,
            total_fn_n=total_fn,
            total_fz_n=total_fz,
            cusum_statistic=self.trust_model.cusum_statistic,
            unauthorized_trust_prevented=unauthorized_attempt,
        )
        self.audit_log.append(audit_rec)

        return TrustDecision(
            state=TriState.ABSTAIN,
            reason="TERMINAL_ABSTAIN_FAIL_CLOSED",
            confidence=0.0,
            action=safe_hold_act,
            estimated_mass_kg=self.trust_model.estimated_mass,
            cusum_statistic=self.trust_model.cusum_statistic,
            conformal_radius=underlying_dec.conformal_radius,
            feature_distance=underlying_dec.feature_distance,
            safety_violation_prevented=True,
        )
