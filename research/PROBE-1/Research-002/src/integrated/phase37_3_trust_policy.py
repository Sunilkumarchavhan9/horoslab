"""
HOROS PROBE-1 — Research-002: Phase 3.7.3 Trust-Aware World Model Architecture.

Implements the complete Tri-State Decision Policy (TRUST / PROBE / ABSTAIN):
- TRUST: High calibration, low epistemic uncertainty, nominal CUSUM innovation drift,
         mode-stratified conformal error bound within physical safety limits, and
         feature-support distance within calibrated in-distribution envelope.
- PROBE: Contact established (||F_N|| > 0.5 N), nominal CUSUM, but latent physical
         parameters (specifically object mass m_obj) unobserved. Executes closed-loop
         force-gated micro-lift profile to identify mass without dropping or crushing.
- ABSTAIN: Anomaly detected: CUSUM drift > tau_cusum, mode-stratified conformal bound
           exceeds Delta_safe, feature-support distance exceeds tau_feat, or physical slip
           detected under vertical load. Acts as upstream setpoint multiplexer delivering
           safe-hold command into GeometryAwareCBFSafetyFilter v1.0.

STRICT GOVERNANCE BOUNDARIES:
- Strictly zero world model parameter training (0 weight updates, 0 gradient steps).
- B1-B4 frozen checkpoints remain 100% immutable.
- GeometryAwareCBFSafetyFilter v1.0 is 100% frozen; trust layer interfaces strictly upstream.
- Zero simulator ground-truth oracle leakage (no mu_true, object_mass, or privileged contact modes).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
import math
from typing import Any, Dict, List, Optional, Sequence, Tuple
import numpy as np


class TriState(str, Enum):
    """Tri-state operational decision for model-based physical interaction."""
    TRUST = "TRUST"
    PROBE = "PROBE"
    ABSTAIN = "ABSTAIN"


@dataclass(frozen=True)
class TrustPolicyConfig:
    """Hyperparameters and thresholds for the Tri-State Trust Layer (Manifest v2.0)."""
    # Conformal coverage settings
    conformal_alpha: float = 0.08
    delta_safe_prelift_m: float = 0.020  # 20 mm max allowable pad/arm deviation
    delta_safe_pih_mm: float = 0.50      # 0.5 mm hole clearance safety bound

    # CUSUM temporal innovation settings
    cusum_k_ref_sigma: float = 0.25
    tau_cusum_prelift: float = 2.50
    tau_cusum_pih: float = 3.00

    # Feature support settings (standardized distance to ID calibration centroid)
    tau_feat: float = 3.95

    # Contact & Probing settings
    fn_contact_threshold_n: float = 0.50
    tau_probe_mass_sigma: float = 0.15
    tau_probe_friction_sigma: float = 0.12

    # Force-gated micro-lift kinematics (mathematically calibrated for pad stiffness 6 N/mm)
    probe_velocity_mps: float = 0.005       # 5.0 mm/s
    probe_horizon_steps: int = 35           # 35 steps @ 10ms = 350ms
    arm_dz_per_step_mm: float = 0.05        # 5 mm/s * 0.01s = 0.05 mm/step
    max_displacement_mm: float = 2.00       # 2.0 mm nominal cap (> 1.389 mm liftoff for 0.85 kg)
    max_displacement_clamp_mm: float = 2.50 # 2.5 mm hard physical safety clamp
    liftoff_displacement_threshold_mm: float = 1.389
    max_force_cap_n: float = 10.0           # 10.0 N safety clamp (< 20.0 N crush threshold)
    plateau_derivative_threshold_n_s: float = 2.50  # |dFz/dt| finite-difference plateau threshold

    # Safety Hold Action (Prelift: [squeeze*4, dz_mm]; PiH: [vx, vy, vz, wx, wy, wz])
    safe_hold_action_prelift: Tuple[float, ...] = (0.0, 0.0, 0.0, 0.0, 0.0)
    safe_hold_action_pih: Tuple[float, ...] = (0.0, 0.0, 0.0, 0.0, 0.0, 0.0)


@dataclass
class TrustDecision:
    """Structured output from the Tri-State Trust-Aware Decision Layer."""
    state: TriState
    reason: str
    confidence: float
    action: np.ndarray
    predicted_next_state: Optional[np.ndarray] = None
    estimated_mass_kg: Optional[float] = None
    estimated_friction_mu: Optional[float] = None
    cusum_statistic: float = 0.0
    conformal_radius: float = 0.0
    feature_distance: float = 0.0
    probing_step_count: int = 0
    plateau_detected: bool = False
    safety_violation_prevented: bool = False


class ActiveMicroLiftEstimator:
    """
    Closed-loop force-gated micro-lift estimator for latent object mass.

    Operates strictly on observable force-torque measurements (finger_ft[:, 1] vertical shear).
    Applies upward probing velocity v_probe = 5 mm/s and continuously monitors dFz/dt.
    When the object lifts off the table, the table normal reaction drops to zero, and the shear
    force plateaus at Fz = m_obj * g. Plateau force directly yields m_hat = Fz_plateau / g.
    """

    def __init__(self, config: Optional[TrustPolicyConfig] = None):
        self.cfg = config or TrustPolicyConfig()
        self.reset()

    def reset(self) -> None:
        self.probing_active = False
        self.probing_step = 0
        self.fz_history: List[float] = []
        self.time_history: List[float] = []
        self.plateau_detected = False
        self.plateau_fz = 0.0
        self.estimated_mass: Optional[float] = None
        self.total_disp_mm = 0.0

    def start_probing(self) -> None:
        self.reset()
        self.probing_active = True

    def step(self, fz_total_n: float, dt_s: float = 0.01) -> Tuple[np.ndarray, bool, Optional[float]]:
        """
        Executes one step of active force-gated micro-lift.

        Returns:
            probing_action: np.ndarray (5-dim action for CompliantPreLift)
            is_complete: bool (True when plateau identified or safety limit reached)
            estimated_mass: Optional[float] (mass estimate in kg upon completion)
        """
        if not self.probing_active:
            self.start_probing()

        self.probing_step += 1
        self.fz_history.append(float(fz_total_n))
        self.time_history.append(float(self.probing_step * dt_s))
        self.total_disp_mm += self.cfg.arm_dz_per_step_mm

        # Safety clamp: if shear exceeds 10.0 N or travel exceeds 2.5 mm, stop immediately
        if fz_total_n >= self.cfg.max_force_cap_n or self.total_disp_mm >= self.cfg.max_displacement_clamp_mm:
            self.probing_active = False
            self.estimated_mass = max(0.10, fz_total_n / 9.80665)
            return np.array([0.0, 0.0, 0.0, 0.0, 0.0], dtype=np.float32), True, self.estimated_mass

        # Plateau detection: after initial engagement (>= 4 steps, Fz > 1.2 N),
        # compute finite difference derivative dFz/dt over a 3-step window
        if len(self.fz_history) >= 4 and fz_total_n > 1.2:
            dt_window = 3.0 * dt_s
            dfz = (self.fz_history[-1] - self.fz_history[-4]) / dt_window
            if abs(dfz) <= self.cfg.plateau_derivative_threshold_n_s:
                self.plateau_detected = True
                self.plateau_fz = float(np.mean(self.fz_history[-3:]))
                self.estimated_mass = float(self.plateau_fz / 9.80665)
                self.probing_active = False
                return np.array([0.0, 0.0, 0.0, 0.0, 0.0], dtype=np.float32), True, self.estimated_mass

        # Nominal probing action: upward arm displacement 0.05 mm/step (5 mm/s), 0 squeeze increment
        probe_action = np.array([0.0, 0.0, 0.0, 0.0, self.cfg.arm_dz_per_step_mm], dtype=np.float32)

        # Check horizon cap (35 steps = 350 ms)
        if self.probing_step >= self.cfg.probe_horizon_steps:
            self.probing_active = False
            self.estimated_mass = float(fz_total_n / 9.80665)
            return np.array([0.0, 0.0, 0.0, 0.0, 0.0], dtype=np.float32), True, self.estimated_mass

        return probe_action, False, None


class TrustAwareWorldModel:
    """
    Online Trust-Aware World Model Decision Layer.

    Wraps a frozen physical world model and executes the complete Tri-State Policy:
    1. Evaluates real-time CUSUM innovation drift S_t against tau_cusum.
    2. Evaluates mode-stratified conformal radius R_conf against Delta_safe.
    3. Evaluates feature-support standardized distance d_feat against tau_feat.
    4. Evaluates active latent parameter identifiability to trigger micro-lift PROBE.
    5. Routes ABSTAIN directly to safe-hold upstream of GeometryAwareCBFSafetyFilter v1.0.
    """

    def __init__(
        self,
        base_world_model: Any,
        conformal_quantiles: Optional[Dict[str, float]] = None,
        mode_conformal_bounds: Optional[Dict[int, float]] = None,
        feature_reference: Optional[Dict[str, Any]] = None,
        c2_reference: Optional[Dict[str, Any]] = None,
        config: Optional[TrustPolicyConfig] = None,
        task: str = "compliant_prelift",
    ):
        self.wm = base_world_model
        self.conformal_quantiles = conformal_quantiles or {"q_state": 1.35, "q_wrench": 2.50}
        self.mode_conformal_bounds = mode_conformal_bounds or {
            0: 1.0645, 1: 1.4263, 2: 1.3531, 3: 2.5550, 4: 1.2103
        }
        self.feature_ref = feature_reference
        self.c2_ref = c2_reference
        self.cfg = config or TrustPolicyConfig()
        self.task = task

        self.micro_lift_estimator = ActiveMicroLiftEstimator(self.cfg)
        self.reset_episode()

    def reset_episode(self) -> None:
        """Resets causal state across episode boundaries."""
        self.cusum_statistic = 0.0
        self.step_index = 0
        self.micro_lift_estimator.reset()
        self.latent_mass_identified = False
        self.probing_failed_closed = False
        self.estimated_mass: Optional[float] = None
        self.estimated_friction: Optional[float] = None
        self.prev_state: Optional[np.ndarray] = None
        self.prev_pred: Optional[np.ndarray] = None
        self.prev_fz = 0.0

    def compute_feature_distance(self, obs: Dict[str, Any]) -> float:
        """Computes standardized distance of current non-privileged features to ID centroid."""
        if not self.feature_ref:
            return 0.0

        mu_f = self.feature_ref.get("mu_feat")
        std_f = self.feature_ref.get("std_feat")
        if mu_f is None or std_f is None:
            return 0.0

        # Extract observable feature vector
        if self.task == "compliant_prelift":
            f_pos = obs.get("finger_pos", np.zeros(4, dtype=np.float32))
            f_w = obs.get("wrenches", np.zeros(3, dtype=np.float32))
            if f_w.shape[0] < 3:
                # Fallback to ft channels
                ft_mat = obs.get("finger_ft", np.zeros((4, 2), dtype=np.float32))
                fn = float(np.sum(obs.get("finger_fn", np.zeros(4))))
                fz = float(np.sum(ft_mat[:, 1])) if ft_mat.ndim == 2 and ft_mat.shape[1] >= 2 else 0.0
                f_w = np.array([fn, 0.0, fz], dtype=np.float32)
            feat_vec = np.hstack([f_pos[:4], f_w[:3]])
        else:
            # Peg-in-Hole: peg pos (3) and wrench (3)
            pos = obs.get("pos", np.zeros(3, dtype=np.float32))
            w = obs.get("wrench", np.zeros(6, dtype=np.float32))
            feat_vec = np.hstack([pos[:3], w[:3]])

        if feat_vec.shape[0] != mu_f.shape[0]:
            return 0.0

        z = (feat_vec - mu_f) / (std_f + 1e-4)
        return float(np.linalg.norm(z))

    def evaluate_decision(
        self,
        obs: Dict[str, Any],
        nominal_action: np.ndarray,
        pred_contact_mode: int = 0,
        recent_residuals: Optional[Sequence[float]] = None,
        latent_mass_uncertainty: float = 0.0,
        latent_friction_uncertainty: float = 0.0,
    ) -> TrustDecision:
        """
        Evaluates the Tri-State Policy at current timestep t strictly on observable features.

        Implements the complete registered 3-condition rule:
        C_trust = {S_t <= tau_cusum} and {R_conf <= Delta_safe} and {d_feat <= tau_feat}

        Returns:
            TrustDecision with state in {TRUST, PROBE, ABSTAIN} and multiplexed safe action.
        """
        self.step_index += 1

        # 1. Extract non-privileged contact forces
        fn_vec = obs.get("finger_fn", np.zeros(4, dtype=np.float32))
        ft_mat = obs.get("finger_ft", np.zeros((4, 2), dtype=np.float32))
        total_fn = float(np.sum(fn_vec))
        total_fz = float(np.sum(ft_mat[:, 1])) if ft_mat.ndim == 2 and ft_mat.shape[1] >= 2 else 0.0
        max_slip_vel = float(np.max(obs.get("delta_dot_t", np.zeros(4))))
        contact_established = total_fn >= self.cfg.fn_contact_threshold_n

        # 2. Update CUSUM residual innovation
        if recent_residuals is not None and len(recent_residuals) > 0:
            innov = float(recent_residuals[-1])
            m0 = self.c2_ref.get("step_mu0", 0.0) if self.c2_ref else 0.0
            sd0 = self.c2_ref.get("step_sd0", 1.0) if self.c2_ref else 1.0
            k_ref = self.cfg.cusum_k_ref_sigma
            excess = (innov - (m0 + k_ref * sd0)) / max(sd0, 1e-4)
            self.cusum_statistic = max(0.0, self.cusum_statistic + excess)

        # 3. Evaluate the 3 Trust Policy Conditions
        tau_cusum = self.cfg.tau_cusum_prelift if self.task == "compliant_prelift" else self.cfg.tau_cusum_pih
        delta_safe = self.cfg.delta_safe_prelift_m if self.task == "compliant_prelift" else self.cfg.delta_safe_pih_mm

        # Condition 1: CUSUM Drift
        cusum_breach = self.cusum_statistic > tau_cusum

        # Condition 2: Mode-Stratified Conformal Radius
        conformal_radius = self.mode_conformal_bounds.get(
            pred_contact_mode, self.conformal_quantiles.get("q_state", 1.35)
        )
        conformal_breach = conformal_radius > (delta_safe * 1000.0 if self.task == "compliant_prelift" else delta_safe)

        # Condition 3: Feature-Support Standardized Distance
        feat_dist = self.compute_feature_distance(obs)
        feat_breach = (feat_dist > self.cfg.tau_feat) if self.feature_ref else False

        # Physical safety invariant: Slip under vertical load
        slip_collapse = contact_established and max_slip_vel > 0.0010 and total_fz > 1.0

        # Check for ABSTAIN triggers
        if cusum_breach or slip_collapse or conformal_breach or feat_breach:
            safe_action = np.array(
                self.cfg.safe_hold_action_prelift if self.task == "compliant_prelift" else self.cfg.safe_hold_action_pih,
                dtype=np.float32,
            )
            if cusum_breach:
                reason = "CUSUM_DRIFT"
            elif slip_collapse:
                reason = "SLIP_COLLAPSE"
            elif conformal_breach:
                reason = "CONFORMAL_BOUND_EXCEEDED"
            else:
                reason = "FEATURE_SUPPORT_OUTLIER"

            return TrustDecision(
                state=TriState.ABSTAIN,
                reason=reason,
                confidence=0.0,
                action=safe_action,
                estimated_mass_kg=self.estimated_mass,
                estimated_friction_mu=self.estimated_friction,
                cusum_statistic=self.cusum_statistic,
                conformal_radius=conformal_radius,
                feature_distance=feat_dist,
                safety_violation_prevented=True,
            )

        # 4. Active Information Gathering / Latent Parameter Verification
        if self.task == "compliant_prelift" and contact_established:
            if self.probing_failed_closed:
                safe_action = np.array(self.cfg.safe_hold_action_prelift, dtype=np.float32)
                return TrustDecision(
                    state=TriState.ABSTAIN,
                    reason="UNIDENTIFIED_MASS_FAIL_CLOSED",
                    confidence=0.0,
                    action=safe_action,
                    estimated_mass_kg=None,
                    cusum_statistic=self.cusum_statistic,
                    conformal_radius=conformal_radius,
                    feature_distance=feat_dist,
                    probing_step_count=self.micro_lift_estimator.probing_step,
                    plateau_detected=False,
                    safety_violation_prevented=True,
                )

            if not self.latent_mass_identified:
                # Mass is unknown: policy must actively probe or fail-closed into ABSTAIN
                probe_action, is_complete, mass_est = self.micro_lift_estimator.step(total_fz)
                if is_complete and self.micro_lift_estimator.plateau_detected and mass_est is not None:
                    self.latent_mass_identified = True
                    self.estimated_mass = mass_est
                    return TrustDecision(
                        state=TriState.TRUST,
                        reason="PROBE_COMPLETED_MASS_IDENTIFIED",
                        confidence=0.95,
                        action=nominal_action,
                        estimated_mass_kg=self.estimated_mass,
                        cusum_statistic=self.cusum_statistic,
                        conformal_radius=conformal_radius,
                        feature_distance=feat_dist,
                        probing_step_count=self.micro_lift_estimator.probing_step,
                        plateau_detected=True,
                    )
                elif is_complete and not self.micro_lift_estimator.plateau_detected:
                    # Probing completed without plateau detection: fail-closed immediately
                    self.probing_failed_closed = True
                    safe_action = np.array(self.cfg.safe_hold_action_prelift, dtype=np.float32)
                    return TrustDecision(
                        state=TriState.ABSTAIN,
                        reason="UNIDENTIFIED_MASS_FAIL_CLOSED",
                        confidence=0.0,
                        action=safe_action,
                        estimated_mass_kg=None,
                        cusum_statistic=self.cusum_statistic,
                        conformal_radius=conformal_radius,
                        feature_distance=feat_dist,
                        probing_step_count=self.micro_lift_estimator.probing_step,
                        plateau_detected=False,
                        safety_violation_prevented=True,
                    )
                else:
                    # Probing in progress
                    return TrustDecision(
                        state=TriState.PROBE,
                        reason="ACTIVE_MICRO_LIFT_PROBING",
                        confidence=0.50,
                        action=probe_action,
                        cusum_statistic=self.cusum_statistic,
                        conformal_radius=conformal_radius,
                        feature_distance=feat_dist,
                        probing_step_count=self.micro_lift_estimator.probing_step,
                        plateau_detected=False,
                    )

            # Strict Governance Invariant: If contact is established, unidentified mass can NEVER enter TRUST
            if not self.latent_mass_identified:
                self.probing_failed_closed = True
                safe_action = np.array(self.cfg.safe_hold_action_prelift, dtype=np.float32)
                return TrustDecision(
                    state=TriState.ABSTAIN,
                    reason="UNIDENTIFIED_MASS_FAIL_CLOSED",
                    confidence=0.0,
                    action=safe_action,
                    estimated_mass_kg=None,
                    cusum_statistic=self.cusum_statistic,
                    conformal_radius=conformal_radius,
                    feature_distance=feat_dist,
                    probing_step_count=self.micro_lift_estimator.probing_step,
                    plateau_detected=False,
                    safety_violation_prevented=True,
                )

        # 5. Default: TRUST (All 3 Conditions Satisfied & Mass Identified or Free Space)
        reason = "NOMINAL_CALIBRATED_PREDICTION" if contact_established else "FREE_SPACE_KINEMATIC_TRUST"
        return TrustDecision(
            state=TriState.TRUST,
            reason=reason,
            confidence=max(0.10, 1.0 - self.cfg.conformal_alpha),
            action=nominal_action,
            estimated_mass_kg=self.estimated_mass,
            estimated_friction_mu=self.estimated_friction,
            cusum_statistic=self.cusum_statistic,
            conformal_radius=conformal_radius,
            feature_distance=feat_dist,
        )
