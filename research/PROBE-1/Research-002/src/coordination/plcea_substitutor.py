"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.7: Pre-Lift Contact Evidence Acquisition (PLCEA)
Module: PLCEA Action Substitutor & Ten-Gate Authorization Controller

Implements Document 50 Revisions 2.3, 2.4 Errata & 2.5 Consistency Patch:
1. Strict constructor domain validation & zero silent parameter mutation.
2. Fail-closed telemetry validation across all sensor, wrench, slip, and dynamics channels
   (rejects None, malformed shapes, NaN/Inf, negative normal force, stale dt > 20 ms,
   heartbeat fault gamma != 1, and ADC saturation >= 22.0 N).
3. Independently verified Ten-Gate Authorization Invariant (G1–G10):
   - G1:  SensorHealthy
   - G2:  EvidencePreloadPassed (>= 2.2990 N)
   - G3:  LiftPreloadPassed (>= 2.5547 N)
   - G4:  LoadTransferPassed (sum Delta Ft,z >= 0.6865 N and min Delta Ft,z >= 0.0858 N)
   - G5:  FrictionBoundValid (all 4 contacts IDENTIFIED >= 0.0875 N, min mu_LB >= 0.150)
   - G6:  WrenchFeasible (total avail >= 4.2904 N and bilateral side >= 2.1452 N)
   - G7:  WrenchBalanced (|sum ft,z - 3.4463 N| <= 0.20 N, |My| <= 0.005, |Mx|,|Mz| <= 0.010 N*m)
   - G8:  ForceLimitsPassed (Fn < 18.0 N, Fn >= 0.10 N, ||f_C|| < 18.0 N, ||ft|| < 8.0 N, I_fail < 1.0)
   - G9:  NoActiveSlip (rho <= 0.85 and |delta_dot_t| <= 0.10 mm/s)
   - G10: DynamicModelValid (|a_z| <= 0.050 m/s^2 or F_table,z_hat >= 0.0 N)
4. Seven-State Supervisory Machine (S0–S6) with:
   - Quiescent tare baseline window (N_tare = 20 frames)
   - Autocorrelation-clearing dwell buffer (100 ms gap)
   - Controlled upward micro-probe & load-transfer ramp (v <= 0.015 m/s)
   - Empirical simultaneous Bonferroni (99% FWER) friction confidence estimation
   - Two-attempt retry budget in S3 before latched fallback S5
   - Three-consecutive-healthy-frame recovery from S6
   - Active two-zone anti-crush retraction (18.0 N proportional + 25.0 N hard saturation)

Author: Sunil Kumar Chavhan (sunil@horoslab.org)
Organization: HOROS Physical Intelligence Research Group (H.R.)
"""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
from enum import Enum
import math
import statistics
from typing import Any, Deque, Dict, List, Optional, Sequence, Tuple
import numpy as np


# ==============================================================================
# Frozen Specification Constants (Document 50 Revisions 2.3, 2.4, 2.5)
# ==============================================================================

WORKPIECE_MASS_KG: float = 0.350
GRIPPER_MASS_KG: float = 1.280
GRAVITY_MPS2: float = 9.80665
STATIC_WEIGHT_N: float = 3.4323
DYNAMIC_CMD_ACCEL_MPS2: float = 0.040
F_LOAD_DYNAMIC_N: float = 3.4463
SAFETY_FACTOR_S: float = 1.25
F_CAPACITY_REQ_N: float = 4.2904
F_CAPACITY_SIDE_REQ_N: float = 2.1452

FN_TOUCHDOWN_MIN_N: float = 0.10
FN_EVIDENCE_PRELOAD_N: float = 2.2990
FN_LIFT_PRELOAD_N: float = 2.5547
FN_PROTECT_N: float = 18.00
FT_PROTECT_N: float = 8.00
F_RESULTANT_PROTECT_N: float = 18.00
F_SAT_ADC_N: float = 22.00
F_HARD_DAMAGE_N: float = 25.00

DELTA_FT_MIN_CONTACT_N: float = 0.0875
DELTA_FT_MIN_TOTAL_N: float = 0.3500
LOAD_TRANSFER_AGG_MIN_N: float = 0.6865
LOAD_TRANSFER_FINGER_MIN_N: float = 0.0858
MU_LB_MIN: float = 0.150

CAL_SIGMA_N: float = 0.050
CAL_SIGMA_T: float = 0.030
FWER_ALPHA: float = 0.01
SIGMA_DELTA_MAX_N: float = 0.01680

WRENCH_FORCE_TOL_N: float = 0.20
MOMENT_TOL_PITCH_NM: float = 0.005
MOMENT_TOL_ROLL_YAW_NM: float = 0.010

SLIP_RATIO_MAX: float = 0.85
SLIP_VELOCITY_MAX_MPS: float = 0.00010  # 0.10 mm/s
DYNAMIC_ACCEL_MAX_MPS2: float = 0.050
MAX_SENSOR_LATENCY_MS: float = 20.0

V_PROBE_MAX_MPS: float = 0.015  # 15.0 mm/s
V_PROBE_NOM_MPS: float = 0.010  # 10.0 mm/s
PROBE_STROKE_MM: float = 0.10
MAX_PROBE_RETRIES: int = 2
SENSOR_REENGAGE_FRAMES: int = 3
FRICTION_STREAK_CYCLES: int = 5
N_TARE_FRAMES: int = 20
DWELL_GAP_MS: float = 100.0
N_PROBE_FRAMES: int = 5


class PLCEAState(str, Enum):
    """Seven discrete supervisory states (S0–S6) of the PLCEA controller."""

    S0_APPROACH_FREE_SPACE = "S0_APPROACH_FREE_SPACE"
    S1_HOLD_PRELOAD = "S1_HOLD_PRELOAD"
    S2_PROBE_FOR_EVIDENCE = "S2_PROBE_FOR_EVIDENCE"
    S3_PROBE_INCONCLUSIVE = "S3_PROBE_INCONCLUSIVE"
    S4_AUTHORIZE_LIFT = "S4_AUTHORIZE_LIFT"
    S5_RECOVER_FALLBACK = "S5_RECOVER_FALLBACK"
    S6_SENSOR_UNAVAILABLE = "S6_SENSOR_UNAVAILABLE"


@dataclass(frozen=True)
class AuthorizationResult:
    """Structured outcome from Ten-Gate PLCEA authorization evaluation."""

    lift_authorized: bool
    state: PLCEAState
    gates: Dict[str, bool]
    failed_gates: List[str]
    reason: str
    evidence: Dict[str, Any] = field(default_factory=dict)


class PLCEAGateEvaluator:
    """
    Deterministic stateless evaluator implementing all Ten Authorization Gates (G1–G10)
    and statistical confidence formulas from Document 50 Revisions 2.3, 2.4, and 2.5.
    """

    def __init__(
        self,
        num_fingers: int = 4,
        object_mass_kg: float = WORKPIECE_MASS_KG,
        gravity_mps2: float = GRAVITY_MPS2,
        safety_factor: float = SAFETY_FACTOR_S,
        side_a_indices: Tuple[int, ...] = (0, 1),
        side_b_indices: Tuple[int, ...] = (2, 3),
        fwer_alpha: float = FWER_ALPHA,
        fn_evidence_preload_n: float = FN_EVIDENCE_PRELOAD_N,
        fn_lift_preload_n: float = FN_LIFT_PRELOAD_N,
        fn_protect_n: float = FN_PROTECT_N,
        ft_protect_n: float = FT_PROTECT_N,
        f_resultant_protect_n: float = F_RESULTANT_PROTECT_N,
        f_sat_adc_n: float = F_SAT_ADC_N,
        fn_touchdown_min_n: float = FN_TOUCHDOWN_MIN_N,
        delta_ft_min_contact_n: float = DELTA_FT_MIN_CONTACT_N,
        mu_lb_min: float = MU_LB_MIN,
        slip_ratio_max: float = SLIP_RATIO_MAX,
        slip_velocity_max_mps: float = SLIP_VELOCITY_MAX_MPS,
        max_sensor_latency_ms: float = MAX_SENSOR_LATENCY_MS,
        dynamic_accel_max_mps2: float = DYNAMIC_ACCEL_MAX_MPS2,
    ):
        self.num_fingers = num_fingers
        self.object_mass_kg = object_mass_kg
        self.gravity_mps2 = gravity_mps2
        self.safety_factor = safety_factor
        self.side_a_indices = side_a_indices
        self.side_b_indices = side_b_indices
        self.fwer_alpha = fwer_alpha
        self.z_bonferroni = statistics.NormalDist().inv_cdf(1.0 - fwer_alpha / float(num_fingers))

        self.fn_evidence_preload_n = fn_evidence_preload_n
        self.fn_lift_preload_n = fn_lift_preload_n
        self.fn_protect_n = fn_protect_n
        self.ft_protect_n = ft_protect_n
        self.f_resultant_protect_n = f_resultant_protect_n
        self.f_sat_adc_n = f_sat_adc_n
        self.fn_touchdown_min_n = fn_touchdown_min_n
        self.delta_ft_min_contact_n = delta_ft_min_contact_n
        self.mu_lb_min = mu_lb_min
        self.slip_ratio_max = slip_ratio_max
        self.slip_velocity_max_mps = slip_velocity_max_mps
        self.max_sensor_latency_ms = max_sensor_latency_ms
        self.dynamic_accel_max_mps2 = dynamic_accel_max_mps2

        # Preserve exact 4-decimal frozen specification thresholds at nominal 0.350 kg / 9.80665 m/s^2
        if (
            abs(object_mass_kg - WORKPIECE_MASS_KG) < 1e-9
            and abs(gravity_mps2 - GRAVITY_MPS2) < 1e-9
            and abs(safety_factor - SAFETY_FACTOR_S) < 1e-9
        ):
            self.static_weight_n = STATIC_WEIGHT_N
            self.f_load_dynamic_n = F_LOAD_DYNAMIC_N
            self.f_capacity_req_n = F_CAPACITY_REQ_N
            self.f_capacity_side_req_n = F_CAPACITY_SIDE_REQ_N
            self.load_transfer_agg_min_n = LOAD_TRANSFER_AGG_MIN_N
            self.load_transfer_finger_min_n = LOAD_TRANSFER_FINGER_MIN_N
        else:
            self.static_weight_n = object_mass_kg * gravity_mps2
            self.f_load_dynamic_n = object_mass_kg * (gravity_mps2 + DYNAMIC_CMD_ACCEL_MPS2)
            self.f_capacity_req_n = safety_factor * self.static_weight_n
            self.f_capacity_side_req_n = 0.5 * self.f_capacity_req_n
            self.load_transfer_agg_min_n = round(0.20 * self.static_weight_n, 4)
            self.load_transfer_finger_min_n = round(0.025 * self.static_weight_n, 4)

    def compute_simultaneous_delta_mu(
        self,
        fn_i: float,
        ft_norm_i: float,
        sigma_n: float = CAL_SIGMA_N,
        sigma_t: float = CAL_SIGMA_T,
    ) -> float:
        """
        First-order Taylor uncertainty bound Delta mu_i under simultaneous Bonferroni
        99% family-wise confidence:
        Delta mu_i = (z_{1 - alpha/N} / Fn,i) * sqrt(sigma_t^2 + (||ft,i|| / Fn,i)^2 * sigma_n^2)
        """
        if not (math.isfinite(fn_i) and fn_i >= self.fn_touchdown_min_n and math.isfinite(ft_norm_i)):
            return float("inf")
        ratio = ft_norm_i / fn_i
        variance_term = (sigma_t ** 2) + (ratio ** 2) * (sigma_n ** 2)
        return (self.z_bonferroni / fn_i) * math.sqrt(variance_term)

    def compute_resultant_force_norm(self, fn_i: float, ft_vec_i: Sequence[float]) -> float:
        """Computes 3D resultant vector magnitude ||f_C,i|| = sqrt(Fn,i^2 + ft,theta,i^2 + ft,z,i^2)."""
        ft_norm = float(np.linalg.norm(ft_vec_i))
        return math.sqrt(float(fn_i) ** 2 + ft_norm ** 2)

    def compute_multiaxial_failure_index(self, fn_i: float, ft_vec_i: Sequence[float]) -> float:
        """Tsai-Wu elliptical contact failure index: (Fn/18.0)^2 + (||ft||/8.0)^2."""
        ft_norm = float(np.linalg.norm(ft_vec_i))
        return (float(fn_i) / self.fn_protect_n) ** 2 + (ft_norm / self.ft_protect_n) ** 2

    def compute_available_vertical_capacities(
        self,
        mu_lb: Sequence[float],
        fn_profile: Sequence[float],
        ft_theta: Sequence[float],
    ) -> List[float]:
        """
        Computes per-contact vertical traction capacity under the 2D elliptical friction cone:
        ft,z,i^avail = sqrt(max(0, (mu_LB,i * Fn,i)^2 - ft,theta,i^2))
        """
        caps: List[float] = []
        for i in range(self.num_fingers):
            if (
                mu_lb[i] is None
                or not math.isfinite(mu_lb[i])
                or not math.isfinite(fn_profile[i])
                or not math.isfinite(ft_theta[i])
                or fn_profile[i] < 0.0
                or mu_lb[i] < 0.0
            ):
                caps.append(0.0)
                continue
            radicand = (float(mu_lb[i]) * float(fn_profile[i])) ** 2 - float(ft_theta[i]) ** 2
            caps.append(math.sqrt(radicand) if radicand > 0.0 else 0.0)
        return caps

    def evaluate_g1_sensor_healthy(
        self,
        fn_profile: Optional[Sequence[float]],
        ft_profile: Optional[Sequence[Sequence[float]]],
        dt_ms: Optional[float],
        gamma: Optional[int],
    ) -> bool:
        """
        Gate G1: SensorHealthy
        (forall i, isfinite(Fn,i, ft,i) and Fn,i >= 0) and (0 < dt <= 20 ms) and (gamma == 1) and (max_i Fn,i < 22.0 N)
        """
        if fn_profile is None or ft_profile is None or dt_ms is None or gamma is None:
            return False
        try:
            fn_arr = np.asarray(fn_profile, dtype=float)
            ft_arr = np.asarray(ft_profile, dtype=float)
            dt_val = float(dt_ms)
        except (ValueError, TypeError):
            return False

        if fn_arr.ndim != 1 or fn_arr.shape != (self.num_fingers,):
            return False
        if not ((ft_arr.ndim == 2 and ft_arr.shape == (self.num_fingers, 2)) or (ft_arr.ndim == 1 and ft_arr.shape == (self.num_fingers,))):
            return False
        if not (np.all(np.isfinite(fn_arr)) and np.all(np.isfinite(ft_arr))):
            return False
        if np.any(fn_arr < 0.0):
            return False
        if not (math.isfinite(dt_val) and 0.0 < dt_val <= self.max_sensor_latency_ms):
            return False
        if isinstance(gamma, bool):
            if not gamma:
                return False
        elif not (isinstance(gamma, (int, float)) and math.isfinite(gamma) and int(gamma) == 1 and gamma == 1):
            return False
        if np.any(fn_arr >= self.f_sat_adc_n):
            return False
        return True

    def evaluate_g2_evidence_preload(self, fn_profile: Sequence[float]) -> bool:
        """Gate G2: EvidencePreloadPassed (min_i Fn,i >= 2.2990 N)."""
        try:
            fn_arr = np.asarray(fn_profile, dtype=float)
            if fn_arr.ndim != 1 or fn_arr.shape != (self.num_fingers,) or not np.all(np.isfinite(fn_arr)):
                return False
            return bool(np.min(fn_arr) >= self.fn_evidence_preload_n)
        except (ValueError, TypeError):
            return False

    def evaluate_g3_lift_preload(self, fn_profile: Sequence[float]) -> bool:
        """Gate G3: LiftPreloadPassed (min_i Fn,i >= 2.5547 N)."""
        try:
            fn_arr = np.asarray(fn_profile, dtype=float)
            if fn_arr.ndim != 1 or fn_arr.shape != (self.num_fingers,) or not np.all(np.isfinite(fn_arr)):
                return False
            return bool(np.min(fn_arr) >= self.fn_lift_preload_n)
        except (ValueError, TypeError):
            return False

    def evaluate_g4_load_transfer(self, delta_ft_z: Optional[Sequence[float]]) -> bool:
        """
        Gate G4: LoadTransferPassed
        (sum_i Delta Ft,z,i >= 0.6865 N) and (min_i Delta Ft,z,i >= 0.0858 N)
        """
        if delta_ft_z is None:
            return False
        try:
            dft_arr = np.asarray(delta_ft_z, dtype=float)
            if dft_arr.ndim != 1 or dft_arr.shape != (self.num_fingers,) or not np.all(np.isfinite(dft_arr)):
                return False
            total_shift = float(np.sum(dft_arr))
            min_shift = float(np.min(dft_arr))
            return (total_shift + 1e-12 >= self.load_transfer_agg_min_n) and (
                min_shift + 1e-12 >= self.load_transfer_finger_min_n
            )
        except (ValueError, TypeError):
            return False

    def evaluate_g5_friction_bound_valid(
        self,
        friction_status: Optional[Sequence[str]],
        delta_ft_z: Optional[Sequence[float]],
        mu_lb: Optional[Sequence[Optional[float]]],
    ) -> bool:
        """
        Gate G5: FrictionBoundValid
        forall i: (FrictionStatus_i == 'IDENTIFIED' and Delta Ft,z,i >= 0.0875 N and mu_LB,i >= 0.150)
        """
        if friction_status is None or delta_ft_z is None or mu_lb is None:
            return False
        if len(friction_status) != self.num_fingers or len(delta_ft_z) != self.num_fingers or len(mu_lb) != self.num_fingers:
            return False
        for i in range(self.num_fingers):
            if friction_status[i] != "IDENTIFIED":
                return False
            if delta_ft_z[i] is None or not math.isfinite(delta_ft_z[i]) or float(delta_ft_z[i]) < self.delta_ft_min_contact_n:
                return False
            if mu_lb[i] is None or not math.isfinite(mu_lb[i]) or float(mu_lb[i]) < self.mu_lb_min:
                return False
        return True

    def evaluate_g6_wrench_feasible(
        self,
        mu_lb: Optional[Sequence[Optional[float]]],
        fn_profile: Sequence[float],
        ft_theta: Optional[Sequence[float]],
    ) -> bool:
        """
        Gate G6: WrenchFeasible
        (sum_i ft,z,i^avail >= 4.2904 N) and (min(F_cap,SideA, F_cap,SideB) >= 2.1452 N)
        """
        if mu_lb is None or ft_theta is None:
            return False
        if len(mu_lb) != self.num_fingers or len(fn_profile) != self.num_fingers or len(ft_theta) != self.num_fingers:
            return False
        for i in range(self.num_fingers):
            if mu_lb[i] is None or not math.isfinite(mu_lb[i]) or not math.isfinite(fn_profile[i]) or not math.isfinite(ft_theta[i]):
                return False

        caps = self.compute_available_vertical_capacities(
            [float(x) for x in mu_lb],  # type: ignore[arg-type]
            fn_profile,
            ft_theta,
        )
        total_cap = sum(caps)
        side_a_cap = sum(caps[i] for i in self.side_a_indices)
        side_b_cap = sum(caps[i] for i in self.side_b_indices)

        return (total_cap + 1e-12 >= self.f_capacity_req_n) and (
            min(side_a_cap, side_b_cap) + 1e-12 >= self.f_capacity_side_req_n
        )

    def evaluate_g7_wrench_balanced(
        self,
        ft_z_meas: Optional[Sequence[float]],
        moments_xyz: Optional[Sequence[float]],
    ) -> bool:
        """
        Gate G7: WrenchBalanced
        |sum ft,z,i^meas - 3.4463 N| <= 0.20 N and |My| <= 0.005 N*m and |Mx|, |Mz| <= 0.010 N*m
        """
        if ft_z_meas is None or moments_xyz is None:
            return False
        try:
            ft_z_arr = np.asarray(ft_z_meas, dtype=float)
            m_arr = np.asarray(moments_xyz, dtype=float)
        except (ValueError, TypeError):
            return False

        if ft_z_arr.ndim != 1 or ft_z_arr.shape != (self.num_fingers,) or not np.all(np.isfinite(ft_z_arr)):
            return False
        if m_arr.ndim != 1 or m_arr.shape != (3,) or not np.all(np.isfinite(m_arr)):
            return False

        total_ft_z = float(np.sum(ft_z_arr))
        if abs(total_ft_z - self.f_load_dynamic_n) > WRENCH_FORCE_TOL_N:
            return False
        mx, my, mz = float(m_arr[0]), float(m_arr[1]), float(m_arr[2])
        if abs(my) > MOMENT_TOL_PITCH_NM:
            return False
        if abs(mx) > MOMENT_TOL_ROLL_YAW_NM or abs(mz) > MOMENT_TOL_ROLL_YAW_NM:
            return False
        return True

    def evaluate_g8_force_limits(
        self,
        fn_profile: Sequence[float],
        ft_profile: Sequence[Sequence[float]],
    ) -> bool:
        """
        Gate G8: ForceLimitsPassed
        (max Fn < 18.0 N) and (min Fn >= 0.10 N) and (max ||f_C|| < 18.0 N) and
        (max ||ft|| < 8.0 N) and (max I_failure < 1.000)
        """
        try:
            fn_arr = np.asarray(fn_profile, dtype=float)
            ft_arr = np.asarray(ft_profile, dtype=float)
        except (ValueError, TypeError):
            return False

        if fn_arr.ndim != 1 or fn_arr.shape != (self.num_fingers,) or not np.all(np.isfinite(fn_arr)):
            return False
        if ft_arr.ndim != 2 or ft_arr.shape != (self.num_fingers, 2) or not np.all(np.isfinite(ft_arr)):
            return False

        for i in range(self.num_fingers):
            fn = float(fn_arr[i])
            ft_vec = ft_arr[i]
            ft_norm = float(np.linalg.norm(ft_vec))
            f_res = math.sqrt(fn ** 2 + ft_norm ** 2)

            if fn >= self.fn_protect_n or fn < self.fn_touchdown_min_n:
                return False
            if f_res >= self.f_resultant_protect_n:
                return False
            if ft_norm >= self.ft_protect_n:
                return False
            i_fail = (fn / self.fn_protect_n) ** 2 + (ft_norm / self.ft_protect_n) ** 2
            if i_fail >= 1.000:
                return False
        return True

    def evaluate_g9_no_active_slip(
        self,
        rho_profile: Optional[Sequence[float]],
        delta_dot_t_profile: Optional[Sequence[float]],
    ) -> bool:
        """
        Gate G9: NoActiveSlip
        forall i: (rho_i <= 0.85 and |delta_dot_t,i| <= 0.10 mm/s)
        """
        if rho_profile is None or delta_dot_t_profile is None:
            return False
        try:
            rho_arr = np.asarray(rho_profile, dtype=float)
            vel_arr = np.asarray(delta_dot_t_profile, dtype=float)
        except (ValueError, TypeError):
            return False

        if rho_arr.ndim != 1 or rho_arr.shape != (self.num_fingers,) or not np.all(np.isfinite(rho_arr)):
            return False
        if vel_arr.ndim != 1 or vel_arr.shape != (self.num_fingers,) or not np.all(np.isfinite(vel_arr)):
            return False

        for i in range(self.num_fingers):
            if rho_arr[i] < 0.0 or rho_arr[i] > self.slip_ratio_max:
                return False
            if abs(vel_arr[i]) > self.slip_velocity_max_mps:
                return False
        return True

    def evaluate_g10_dynamic_model_valid(
        self,
        a_z: Optional[float],
        f_table_z_hat: Optional[float],
    ) -> bool:
        """
        Gate G10: DynamicModelValid
        (|a_z| <= 0.050 m/s^2) or (F_table,z_hat >= 0.000 N)
        """
        valid_az = False
        if a_z is not None:
            try:
                az_val = float(a_z)
                if math.isfinite(az_val) and abs(az_val) <= self.dynamic_accel_max_mps2:
                    valid_az = True
            except (ValueError, TypeError):
                pass

        valid_ftable = False
        if f_table_z_hat is not None:
            try:
                ft_val = float(f_table_z_hat)
                if math.isfinite(ft_val) and ft_val >= 0.0:
                    valid_ftable = True
            except (ValueError, TypeError):
                pass

        return valid_az or valid_ftable

    @staticmethod
    def evaluate_lift_authorized(gates: Dict[str, bool]) -> bool:
        """Master Ten-Gate Invariant: LiftAuthorized == bigwedge_{j=1}^{10} Gate_j."""
        for j in range(1, 11):
            if not bool(gates.get(f"G{j}", False)):
                return False
        return True


class PLCEAActionSubstitutor:
    """
    Stage P2.7 Pre-Lift Contact Evidence Acquisition (PLCEA) Controller.

    Enforces evidence-before-lift authorization over a 7-state supervisor (S0–S6)
    and ten independent authorization gates (G1–G10), with active anti-crush
    retraction, bounded probe velocity clamping, and adaptive squeeze regulation.
    """

    def __init__(
        self,
        object_mass: float = WORKPIECE_MASS_KG,
        gravity: float = GRAVITY_MPS2,
        num_fingers: int = 4,
        nominal_friction_mu: float = 0.60,
        elastic_stiffness: float = 4.0,          # N/mm
        dynamic_safety_margin: float = SAFETY_FACTOR_S,
        friction_margin_eta: float = SLIP_RATIO_MAX,
        dt: float = 0.01,                        # s (100 Hz)
        max_crush_force: float = FN_PROTECT_N,
        hard_environment_limit: float = F_HARD_DAMAGE_N,
        adc_saturation_limit: float = F_SAT_ADC_N,
        contact_loss_threshold: float = FN_TOUCHDOWN_MIN_N,
        kp_squeeze: float = 1.0,                 # step^-1
        k_retract: float = 1.5,                  # step^-1
        noise_sigma_n: float = CAL_SIGMA_N,
        noise_sigma_t: float = CAL_SIGMA_T,
        n_tare_frames: int = N_TARE_FRAMES,
        dwell_gap_ms: float = DWELL_GAP_MS,
        n_probe_frames: int = N_PROBE_FRAMES,
        friction_streak_cycles: int = FRICTION_STREAK_CYCLES,
        max_probe_retries: int = MAX_PROBE_RETRIES,
        sensor_reengage_frames: int = SENSOR_REENGAGE_FRAMES,
        probe_stroke_mm: float = PROBE_STROKE_MM,
        max_probe_total_mm: float = 1.50,
        v_probe_max_mps: float = V_PROBE_MAX_MPS,
        v_probe_nom_mps: float = V_PROBE_NOM_MPS,
        max_lift_accel_mps2: float = DYNAMIC_CMD_ACCEL_MPS2,
        preload_control_margin_n: float = 0.15,
        side_a_indices: Tuple[int, ...] = (0, 1),
        side_b_indices: Tuple[int, ...] = (2, 3),
    ):
        # ----------------------------------------------------------------------
        # Strict Constructor Domain Validation (No implicit parameter tolerance)
        # ----------------------------------------------------------------------
        if not (isinstance(object_mass, (int, float)) and math.isfinite(object_mass) and object_mass > 0.0):
            raise ValueError(f"object_mass must be a positive finite float, got {object_mass}")
        if not (isinstance(gravity, (int, float)) and math.isfinite(gravity) and gravity > 0.0):
            raise ValueError(f"gravity must be a positive finite float, got {gravity}")
        if not (isinstance(num_fingers, int) and not isinstance(num_fingers, bool) and num_fingers == 4):
            raise ValueError(f"num_fingers must be exact integer 4 for bilateral 4-contact PLCEA, got {num_fingers}")
        if not (isinstance(nominal_friction_mu, (int, float)) and math.isfinite(nominal_friction_mu) and nominal_friction_mu > 0.0):
            raise ValueError(f"nominal_friction_mu must be a positive finite float, got {nominal_friction_mu}")
        if not (isinstance(elastic_stiffness, (int, float)) and math.isfinite(elastic_stiffness) and elastic_stiffness > 0.0):
            raise ValueError(f"elastic_stiffness must be a positive finite float, got {elastic_stiffness}")
        if not (isinstance(dynamic_safety_margin, (int, float)) and math.isfinite(dynamic_safety_margin) and dynamic_safety_margin >= 1.0):
            raise ValueError(f"dynamic_safety_margin must be >= 1.0, got {dynamic_safety_margin}")
        if not (isinstance(friction_margin_eta, (int, float)) and math.isfinite(friction_margin_eta) and 0.0 < friction_margin_eta <= 1.0):
            raise ValueError(f"friction_margin_eta must be in (0.0, 1.0], got {friction_margin_eta}")
        if not (isinstance(dt, (int, float)) and math.isfinite(dt) and dt > 0.0):
            raise ValueError(f"dt must be a positive finite float, got {dt}")
        if not (isinstance(max_crush_force, (int, float)) and math.isfinite(max_crush_force) and max_crush_force > 0.0):
            raise ValueError(f"max_crush_force must be a positive finite float, got {max_crush_force}")
        if not (isinstance(adc_saturation_limit, (int, float)) and math.isfinite(adc_saturation_limit) and adc_saturation_limit > max_crush_force):
            raise ValueError(f"adc_saturation_limit must be > max_crush_force ({max_crush_force}), got {adc_saturation_limit}")
        if not (isinstance(hard_environment_limit, (int, float)) and math.isfinite(hard_environment_limit) and hard_environment_limit > adc_saturation_limit):
            raise ValueError(f"hard_environment_limit must be > adc_saturation_limit ({adc_saturation_limit}), got {hard_environment_limit}")
        if not (isinstance(contact_loss_threshold, (int, float)) and math.isfinite(contact_loss_threshold) and 0.0 < contact_loss_threshold < FN_EVIDENCE_PRELOAD_N):
            raise ValueError(f"contact_loss_threshold must be in (0.0, {FN_EVIDENCE_PRELOAD_N}), got {contact_loss_threshold}")
        if not (isinstance(kp_squeeze, (int, float)) and math.isfinite(kp_squeeze) and kp_squeeze > 0.0):
            raise ValueError(f"kp_squeeze must be positive finite, got {kp_squeeze}")
        if not (isinstance(k_retract, (int, float)) and math.isfinite(k_retract) and k_retract > 0.0):
            raise ValueError(f"k_retract must be positive finite, got {k_retract}")
        if not (isinstance(noise_sigma_n, (int, float)) and math.isfinite(noise_sigma_n) and noise_sigma_n >= 0.0):
            raise ValueError(f"noise_sigma_n must be >= 0.0, got {noise_sigma_n}")
        if not (isinstance(noise_sigma_t, (int, float)) and math.isfinite(noise_sigma_t) and noise_sigma_t >= 0.0):
            raise ValueError(f"noise_sigma_t must be >= 0.0, got {noise_sigma_t}")
        if not (isinstance(n_tare_frames, int) and n_tare_frames >= 1):
            raise ValueError(f"n_tare_frames must be integer >= 1, got {n_tare_frames}")
        if not (isinstance(dwell_gap_ms, (int, float)) and math.isfinite(dwell_gap_ms) and dwell_gap_ms >= 0.0):
            raise ValueError(f"dwell_gap_ms must be >= 0.0, got {dwell_gap_ms}")
        if not (isinstance(n_probe_frames, int) and n_probe_frames >= 1):
            raise ValueError(f"n_probe_frames must be integer >= 1, got {n_probe_frames}")
        if not (isinstance(friction_streak_cycles, int) and friction_streak_cycles >= 1):
            raise ValueError(f"friction_streak_cycles must be integer >= 1, got {friction_streak_cycles}")
        if not (isinstance(max_probe_retries, int) and max_probe_retries >= 0):
            raise ValueError(f"max_probe_retries must be integer >= 0, got {max_probe_retries}")
        if not (isinstance(sensor_reengage_frames, int) and sensor_reengage_frames >= 1):
            raise ValueError(f"sensor_reengage_frames must be integer >= 1, got {sensor_reengage_frames}")
        if not (isinstance(v_probe_max_mps, (int, float)) and math.isfinite(v_probe_max_mps) and v_probe_max_mps > 0.0):
            raise ValueError(f"v_probe_max_mps must be positive finite, got {v_probe_max_mps}")
        if not (isinstance(v_probe_nom_mps, (int, float)) and math.isfinite(v_probe_nom_mps) and 0.0 < v_probe_nom_mps <= v_probe_max_mps):
            raise ValueError(f"v_probe_nom_mps must be in (0.0, {v_probe_max_mps}], got {v_probe_nom_mps}")
        if not (isinstance(max_lift_accel_mps2, (int, float)) and math.isfinite(max_lift_accel_mps2) and 0.0 < max_lift_accel_mps2 <= DYNAMIC_ACCEL_MAX_MPS2):
            raise ValueError(f"max_lift_accel_mps2 must be in (0.0, {DYNAMIC_ACCEL_MAX_MPS2}], got {max_lift_accel_mps2}")
        if not (isinstance(preload_control_margin_n, (int, float)) and math.isfinite(preload_control_margin_n) and preload_control_margin_n >= 0.0):
            raise ValueError(f"preload_control_margin_n must be >= 0.0, got {preload_control_margin_n}")

        all_indices = list(side_a_indices) + list(side_b_indices)
        if sorted(all_indices) != list(range(num_fingers)) or not side_a_indices or not side_b_indices:
            raise ValueError(f"side_a_indices {side_a_indices} and side_b_indices {side_b_indices} must partition 0..{num_fingers - 1}")

        self.m = float(object_mass)
        self.g = float(gravity)
        self.F_g = self.m * self.g
        self.N_f = int(num_fingers)
        self.mu_nominal = float(nominal_friction_mu)
        self.k_elastic = float(elastic_stiffness)
        self.gamma_safety = float(dynamic_safety_margin)
        self.eta = float(friction_margin_eta)
        self.dt = float(dt)
        self.F_ceiling = float(max_crush_force)
        self.F_sat_limit = float(adc_saturation_limit)
        self.F_hard_limit = float(hard_environment_limit)
        self.F_min_valid = float(contact_loss_threshold)
        self.Kp = float(kp_squeeze)
        self.K_retract = float(k_retract)
        self.sigma_n = float(noise_sigma_n)
        self.sigma_t = float(noise_sigma_t)

        self.n_tare_frames = int(n_tare_frames)
        self.dwell_gap_ms = float(dwell_gap_ms)
        self.n_dwell_frames = int(math.ceil(self.dwell_gap_ms / (self.dt * 1000.0))) if self.dwell_gap_ms > 0.0 else 0
        self.n_probe_frames = int(n_probe_frames)
        self.friction_streak_cycles = int(friction_streak_cycles)
        self.max_probe_retries = int(max_probe_retries)
        self.sensor_reengage_frames = int(sensor_reengage_frames)
        self.probe_stroke_mm = float(probe_stroke_mm)
        self.max_probe_total_mm = float(max_probe_total_mm)
        self.v_probe_max_mps = float(v_probe_max_mps)
        self.v_probe_nom_mps = float(v_probe_nom_mps)
        self.max_lift_accel_mps2 = float(max_lift_accel_mps2)
        self.preload_control_margin_n = float(preload_control_margin_n)
        self.side_a_indices = tuple(side_a_indices)
        self.side_b_indices = tuple(side_b_indices)

        self.evaluator = PLCEAGateEvaluator(
            num_fingers=self.N_f,
            object_mass_kg=self.m,
            gravity_mps2=self.g,
            safety_factor=self.gamma_safety,
            side_a_indices=self.side_a_indices,
            side_b_indices=self.side_b_indices,
            fn_protect_n=self.F_ceiling,
            f_resultant_protect_n=self.F_ceiling,
            f_sat_adc_n=self.F_sat_limit,
            fn_touchdown_min_n=self.F_min_valid,
            slip_ratio_max=self.eta,
        )

        # Control loop stateful buffers & counters
        self.state: PLCEAState = PLCEAState.S0_APPROACH_FREE_SPACE
        self.retry_count: int = 0
        self.retry_exhausted_latched: bool = False
        self.s5_latched_slip: bool = False
        self.s5_stable_frames: int = 0
        self.sensor_healthy_consecutive_frames: int = 0

        self.tare_buffer: Deque[np.ndarray] = deque(maxlen=self.n_tare_frames)
        self.tare_ft_z: Optional[np.ndarray] = None
        self.dwell_counter: int = 0
        self.probe_buffer: Deque[np.ndarray] = deque(maxlen=self.n_probe_frames)
        self.probe_cumulative_stroke_mm: float = 0.0
        self.probe_step_count: int = 0
        self.max_probe_steps: int = max(80, int(math.ceil(1.00 / self.dt)))
        self.no_excitation_timeout_steps: int = max(25, int(math.ceil(0.25 / self.dt)))

        self.streak_counter: List[int] = [0] * self.N_f
        self.friction_status: List[str] = ["UNIDENTIFIED"] * self.N_f
        self.mu_lb: List[Optional[float]] = [None] * self.N_f
        self.base_preload_target_n: float = self.evaluator.fn_lift_preload_n + self.preload_control_margin_n

        self.v_z: float = 0.0
        self.prev_obj_vel_z_mps: Optional[float] = None
        self.prev_rel_z_m: Optional[np.ndarray] = None
        self.last_authorization: Optional[AuthorizationResult] = None

    def reset(self) -> None:
        """Resets all episodic state machines, buffers, identified friction, and velocity trackers."""
        self.state = PLCEAState.S0_APPROACH_FREE_SPACE
        self.retry_count = 0
        self.retry_exhausted_latched = False
        self.s5_latched_slip = False
        self.s5_stable_frames = 0
        self.sensor_healthy_consecutive_frames = 0

        self.tare_buffer.clear()
        self.tare_ft_z = None
        self.dwell_counter = 0
        self.probe_buffer.clear()
        self.probe_cumulative_stroke_mm = 0.0
        self.probe_step_count = 0

        self.streak_counter = [0] * self.N_f
        self.friction_status = ["UNIDENTIFIED"] * self.N_f
        self.mu_lb = [None] * self.N_f
        self.base_preload_target_n = self.evaluator.fn_lift_preload_n + self.preload_control_margin_n

        self.v_z = 0.0
        self.prev_obj_vel_z_mps = None
        self.prev_rel_z_m = None
        self.last_authorization = None

    def _clear_evidence_buffers(self, reset_friction: bool = True) -> None:
        """Clears tare/dwell/probe windows; optionally invalidates identified friction bounds."""
        self.tare_buffer.clear()
        self.tare_ft_z = None
        self.dwell_counter = 0
        self.probe_buffer.clear()
        self.probe_cumulative_stroke_mm = 0.0
        self.probe_step_count = 0
        if reset_friction:
            self.streak_counter = [0] * self.N_f
            self.friction_status = ["UNIDENTIFIED"] * self.N_f
            self.mu_lb = [None] * self.N_f

    # --------------------------------------------------------------------------
    # Telemetry Extraction & Derivation (Strict Validation, Zero Implicit Pass)
    # --------------------------------------------------------------------------

    @staticmethod
    def _first_present(obs: Dict[str, Any], keys: Sequence[str]) -> Tuple[bool, Any]:
        for k in keys:
            if k in obs:
                return True, obs[k]
        return False, None

    def _extract_normal_forces(self, obs: Dict[str, Any]) -> Optional[np.ndarray]:
        found, raw = self._first_present(obs, ("finger_fn", "normal_forces", "finger_normal_force"))
        if not found or raw is None:
            return None
        try:
            arr = np.asarray(raw, dtype=float)
            if arr.ndim != 1 or arr.shape != (self.N_f,) or not np.all(np.isfinite(arr)) or np.any(arr < 0.0):
                return None
            return arr
        except (ValueError, TypeError):
            return None

    def _extract_shear_forces(self, obs: Dict[str, Any]) -> Optional[np.ndarray]:
        """Returns 2D shear array shape (N_f, 2) as [ft_theta, ft_z] or None if invalid/missing."""
        found, raw = self._first_present(obs, ("finger_ft", "finger_shear_force", "shear_forces"))
        if not found or raw is None:
            return None
        try:
            arr = np.asarray(raw, dtype=float)
            if arr.ndim == 2 and arr.shape == (self.N_f, 2) and np.all(np.isfinite(arr)):
                return arr
            # Accept 1D only if explicit ft_theta is separately supplied; never assume ft_theta == 0 silently
            if arr.ndim == 1 and arr.shape == (self.N_f,) and np.all(np.isfinite(arr)):
                found_th, raw_th = self._first_present(obs, ("ft_theta", "transverse_shear"))
                if found_th and raw_th is not None:
                    th_arr = np.asarray(raw_th, dtype=float)
                    if th_arr.ndim == 1 and th_arr.shape == (self.N_f,) and np.all(np.isfinite(th_arr)):
                        return np.column_stack([th_arr, arr])
            return None
        except (ValueError, TypeError):
            return None

    def _extract_dt_and_gamma(self, obs: Dict[str, Any]) -> Tuple[Optional[float], Optional[int]]:
        """Extracts latency/step interval dt_ms and bus heartbeat gamma without masking faults."""
        dt_ms: Optional[float] = self.dt * 1000.0
        for key, scale in (("dt_ms", 1.0), ("latency_ms", 1.0), ("tau_delay_ms", 1.0), ("dt", 1000.0)):
            if key in obs:
                val = obs[key]
                if val is None:
                    return None, 0
                try:
                    fval = float(val) * scale
                    if not math.isfinite(fval):
                        return None, 0
                    dt_ms = max(dt_ms if key != "dt" else fval, fval)
                except (ValueError, TypeError):
                    return None, 0

        gamma = 1
        for g_key in ("gamma", "gamma_n", "gamma_t"):
            if g_key in obs:
                g_val = obs[g_key]
                if g_val is None:
                    gamma = 0
                elif isinstance(g_val, bool):
                    if not g_val:
                        gamma = 0
                elif isinstance(g_val, (int, float)) and math.isfinite(g_val):
                    if g_val != 1:
                        gamma = 0
                else:
                    gamma = 0

        return dt_ms, gamma

    def _extract_positions_m(self, obs: Dict[str, Any]) -> Tuple[Optional[np.ndarray], Optional[np.ndarray]]:
        """Extracts finger_pos (4, 3) and obj_pos (3,) in meters."""
        obj_pos_m: Optional[np.ndarray] = None
        if "obj_pos" in obs and obs["obj_pos"] is not None:
            try:
                p = np.asarray(obs["obj_pos"], dtype=float)
                if p.ndim == 1 and p.shape == (3,) and np.all(np.isfinite(p)):
                    obj_pos_m = p * 1e-3  # mm -> m
            except (ValueError, TypeError):
                obj_pos_m = None

        finger_pos_m: Optional[np.ndarray] = None
        if "finger_pos" in obs and obs["finger_pos"] is not None:
            try:
                fp = np.asarray(obs["finger_pos"], dtype=float)
                if fp.ndim == 2 and fp.shape == (self.N_f, 3) and np.all(np.isfinite(fp)):
                    finger_pos_m = fp * 1e-3  # mm -> m
            except (ValueError, TypeError):
                finger_pos_m = None

        return finger_pos_m, obj_pos_m

    def compute_wrench_moments_nm(
        self,
        fn_profile: np.ndarray,
        ft_profile: np.ndarray,
        finger_pos_m: np.ndarray,
        obj_pos_m: np.ndarray,
    ) -> np.ndarray:
        """Computes 3D net wrench moment [Mx, My, Mz] (N*m) applied about the grasp-plane object CoM."""
        total_moment = np.zeros(3, dtype=float)
        z_grasp_plane_m = float(np.mean(finger_pos_m[:, 2]))
        com_origin_m = np.array([float(obj_pos_m[0]), float(obj_pos_m[1]), z_grasp_plane_m], dtype=float)
        for i in range(self.N_f):
            r = finger_pos_m[i] - com_origin_m
            r_xy_norm = math.hypot(r[0], r[1])
            if r_xy_norm < 1e-6:
                continue
            # Radial inward normal vector in XY plane toward object CoM
            u_in = np.array([-r[0] / r_xy_norm, -r[1] / r_xy_norm, 0.0], dtype=float)
            # Transverse tangential unit vector e_z x u_in
            u_theta = np.array([r[1] / r_xy_norm, -r[0] / r_xy_norm, 0.0], dtype=float)
            u_z = np.array([0.0, 0.0, 1.0], dtype=float)

            force_vec = fn_profile[i] * u_in + ft_profile[i, 0] * u_theta + ft_profile[i, 1] * u_z
            total_moment += np.cross(r, force_vec)
        return total_moment

    def _extract_moments(
        self,
        obs: Dict[str, Any],
        fn_arr: Optional[np.ndarray],
        ft_arr: Optional[np.ndarray],
        finger_pos_m: Optional[np.ndarray],
        obj_pos_m: Optional[np.ndarray],
    ) -> Optional[np.ndarray]:
        found, raw_m = self._first_present(obs, ("moments", "obj_moments", "wrench_moments"))
        if found:
            if raw_m is None:
                return None
            try:
                m_arr = np.asarray(raw_m, dtype=float)
                if m_arr.ndim == 1 and m_arr.shape == (3,) and np.all(np.isfinite(m_arr)):
                    return m_arr
                return None
            except (ValueError, TypeError):
                return None

        if fn_arr is not None and ft_arr is not None and finger_pos_m is not None and obj_pos_m is not None:
            return self.compute_wrench_moments_nm(fn_arr, ft_arr, finger_pos_m, obj_pos_m)
        return None

    def _extract_slip_kinematics(
        self,
        obs: Dict[str, Any],
        fn_arr: Optional[np.ndarray],
        ft_arr: Optional[np.ndarray],
        finger_pos_m: Optional[np.ndarray],
        obj_pos_m: Optional[np.ndarray],
        dt_s: float,
        commit_history: bool,
    ) -> Tuple[Optional[np.ndarray], Optional[np.ndarray]]:
        """Extracts slip ratio rho_i and relative tangential velocity delta_dot_t,i (m/s)."""
        # 1. Relative slip velocity delta_dot_t (m/s)
        delta_dot_t: Optional[np.ndarray] = None
        found_v, raw_v = self._first_present(obs, ("delta_dot_t", "slip_vel", "slip_velocities"))
        if found_v:
            if raw_v is not None:
                try:
                    varr = np.asarray(raw_v, dtype=float)
                    if varr.ndim == 1 and varr.shape == (self.N_f,) and np.all(np.isfinite(varr)):
                        delta_dot_t = varr
                except (ValueError, TypeError):
                    delta_dot_t = None
        elif finger_pos_m is not None and obj_pos_m is not None:
            rel_z_m = finger_pos_m[:, 2] - obj_pos_m[2]
            if self.prev_rel_z_m is not None and dt_s > 0.0:
                delta_dot_t = (rel_z_m - self.prev_rel_z_m) / dt_s
            if commit_history:
                self.prev_rel_z_m = rel_z_m.copy()

        # 2. Slip mobilization ratio rho_i
        rho_arr: Optional[np.ndarray] = None
        found_r, raw_r = self._first_present(obs, ("slip_ratio", "slip_ratios", "rho"))
        if found_r:
            if raw_r is not None:
                try:
                    rarr = np.asarray(raw_r, dtype=float)
                    if rarr.ndim == 1 and rarr.shape == (self.N_f,) and np.all(np.isfinite(rarr)) and np.all(rarr >= 0.0):
                        rho_arr = rarr
                except (ValueError, TypeError):
                    rho_arr = None
        elif fn_arr is not None and ft_arr is not None:
            ratios = np.full(self.N_f, float("inf"), dtype=float)
            ft_norms = np.linalg.norm(ft_arr, axis=1)
            for i in range(self.N_f):
                mu_ref = self.mu_nominal
                if (
                    self.state == PLCEAState.S4_AUTHORIZE_LIFT
                    and self.mu_lb[i] is not None
                    and math.isfinite(self.mu_lb[i])  # type: ignore[arg-type]
                ):
                    mu_ref = min(self.mu_nominal, float(self.mu_lb[i]))  # type: ignore[arg-type]
                if fn_arr[i] >= self.F_min_valid and mu_ref > 0.0:
                    ratios[i] = float(ft_norms[i] / (mu_ref * fn_arr[i]))
            rho_arr = ratios

        return rho_arr, delta_dot_t

    def _extract_vertical_dynamics(
        self,
        obs: Dict[str, Any],
        ft_arr: Optional[np.ndarray],
        dt_s: float,
        commit_history: bool,
    ) -> Tuple[Optional[float], Optional[float]]:
        """Extracts vertical object acceleration a_z (m/s^2) and estimated table normal force (N)."""
        a_z: Optional[float] = None
        found_az, raw_az = self._first_present(obs, ("a_z", "obj_acc_z"))
        if found_az:
            if raw_az is not None:
                try:
                    val = float(raw_az)
                    if math.isfinite(val):
                        a_z = val
                except (ValueError, TypeError):
                    a_z = None
        else:
            vel_z_mps: Optional[float] = None
            if "obj_vel_mps" in obs and obs["obj_vel_mps"] is not None:
                try:
                    v = np.asarray(obs["obj_vel_mps"], dtype=float)
                    if v.ndim == 1 and v.shape == (3,) and np.all(np.isfinite(v)):
                        vel_z_mps = float(v[2])
                except (ValueError, TypeError):
                    vel_z_mps = None
            elif "obj_vel" in obs and obs["obj_vel"] is not None:
                try:
                    v = np.asarray(obs["obj_vel"], dtype=float)
                    if v.ndim == 1 and v.shape == (3,) and np.all(np.isfinite(v)):
                        vel_z_mps = float(v[2]) * 1e-3  # mm/s -> m/s
                except (ValueError, TypeError):
                    vel_z_mps = None

            if vel_z_mps is not None:
                if self.prev_obj_vel_z_mps is not None and dt_s > 0.0:
                    a_z = (vel_z_mps - self.prev_obj_vel_z_mps) / dt_s
                if commit_history:
                    self.prev_obj_vel_z_mps = vel_z_mps

        f_table_z_hat: Optional[float] = None
        if "f_table_z_hat" in obs and obs["f_table_z_hat"] is not None:
            try:
                val = float(obs["f_table_z_hat"])
                if math.isfinite(val):
                    f_table_z_hat = val
            except (ValueError, TypeError):
                f_table_z_hat = None
        elif a_z is not None and ft_arr is not None:
            # Newton vertical balance estimate: F_table = m(g + a_z) - sum(f_t,z)
            f_table_z_hat = self.m * (self.g + a_z) - float(np.sum(ft_arr[:, 1]))

        return a_z, f_table_z_hat

    # --------------------------------------------------------------------------
    # Control Law Helpers
    # --------------------------------------------------------------------------

    def calculate_force_deficit(self, fn_profile: np.ndarray, target_fn: Optional[np.ndarray] = None) -> np.ndarray:
        """Computes per-contact normal force deficit Delta F_n [N]."""
        fn = np.asarray(fn_profile, dtype=float)
        if fn.ndim != 1 or fn.shape != (self.N_f,):
            raise ValueError(f"fn_profile must have shape ({self.N_f},), got {fn.shape}")
        ref = np.full(self.N_f, self.base_preload_target_n, dtype=float) if target_fn is None else target_fn
        return np.maximum(0.0, ref - fn)

    def calculate_squeeze_command(
        self,
        fn_profile: np.ndarray,
        proposed_squeeze: np.ndarray,
        target_fn: Optional[np.ndarray] = None,
        allow_augment: bool = True,
    ) -> np.ndarray:
        """
        Computes safe squeeze action [mm/step] enforcing two-zone anti-crush architecture:
        - Fn >= 25.0 N: Hard damage boundary -> immediate -2.0 mm/step outward saturation.
        - 18.0 N <= Fn < 25.0 N: Protective ceiling -> active proportional outward retraction (<= -0.05 mm/step).
        - Fn < 18.0 N: Regulated inward squeeze if allow_augment else hold/clip safely.
        """
        fn = np.asarray(fn_profile, dtype=float)
        a_prop = np.asarray(proposed_squeeze, dtype=float)
        ref = np.full(self.N_f, self.base_preload_target_n, dtype=float) if target_fn is None else target_fn

        a_sub = np.zeros(self.N_f, dtype=float)
        for i in range(self.N_f):
            if fn[i] >= self.F_hard_limit:
                a_sub[i] = -2.0
            elif fn[i] >= self.F_ceiling:
                prop_retract = -self.K_retract * ((fn[i] - self.F_ceiling) / self.k_elastic)
                # Ensure strictly negative outward command even right at 18.00 N boundary
                a_sub[i] = float(np.clip(min(-0.05, prop_retract), -2.0, 0.0))
            elif allow_augment:
                if fn[i] < self.F_min_valid:
                    a_sub[i] = float(np.clip(max(a_prop[i], 0.20), 0.20, 2.0))
                else:
                    deficit = max(0.0, float(ref[i]) - fn[i])
                    delta_cmd = self.Kp * (deficit / self.k_elastic)
                    upper_fn_cap = min(self.F_ceiling - 2.0, float(ref[i]) + 0.15)
                    max_inward_step = max(0.0, (upper_fn_cap - fn[i]) / self.k_elastic)
                    min_safe_step = deficit / self.k_elastic
                    safe_prop = float(np.clip(a_prop[i], min_safe_step, max_inward_step))
                    a_sub[i] = float(np.clip(max(safe_prop, delta_cmd), -2.0, 2.0))
            else:
                a_sub[i] = float(np.clip(a_prop[i], -2.0, 0.0))
        return a_sub

    def _compute_adaptive_preload_targets(self, ft_theta: np.ndarray) -> Tuple[np.ndarray, bool]:
        """
        Computes normal preload required per finger to certify WrenchFeasible (Gate G6)
        from empirically identified friction lower bounds mu_LB,i.
        Returns (target_fn_array, is_within_safe_force_envelope).
        """
        targets = np.full(self.N_f, self.base_preload_target_n, dtype=float)
        feasible_within_ceiling = True
        max_safe_squeeze_ceiling = self.F_ceiling - 2.0  # preserve >= 2 N crush safety buffer

        for i in range(self.N_f):
            mu_i = self.mu_lb[i]
            if mu_i is None or not math.isfinite(mu_i) or mu_i < self.evaluator.mu_lb_min:
                feasible_within_ceiling = False
                continue

            # Target side shear share = side_req / len(side)
            side_req = self.evaluator.f_capacity_side_req_n
            per_finger_req_z = side_req / float(len(self.side_a_indices if i in self.side_a_indices else self.side_b_indices))
            req_total_tangent = math.hypot(per_finger_req_z, float(ft_theta[i]))
            req_fn = (req_total_tangent / mu_i) + self.preload_control_margin_n

            if req_fn >= max_safe_squeeze_ceiling:
                feasible_within_ceiling = False
                targets[i] = self.base_preload_target_n
            else:
                targets[i] = max(self.base_preload_target_n, req_fn)

        return targets, feasible_within_ceiling

    # --------------------------------------------------------------------------
    # Pure Gate & Differential Excitation Evaluation
    # --------------------------------------------------------------------------

    def _compute_differential_excitation(
        self,
        obs: Dict[str, Any],
        ft_arr: Optional[np.ndarray],
    ) -> Tuple[Optional[np.ndarray], bool]:
        """
        Evaluates differential excitation Delta Ft,z,i = F_bar^probe - F_bar^tare.
        Strictly requires complete tare baseline AND full probe window unless explicit
        calibrated delta_ft_z vector is provided by an upstream certified F/T observer.
        """
        if "delta_ft_z" in obs:
            raw = obs["delta_ft_z"]
            if raw is None:
                return None, False
            try:
                arr = np.asarray(raw, dtype=float)
                if arr.ndim == 1 and arr.shape == (self.N_f,) and np.all(np.isfinite(arr)):
                    return arr, True
                return None, False
            except (ValueError, TypeError):
                return None, False

        if ft_arr is None or self.tare_ft_z is None or len(self.probe_buffer) < self.n_probe_frames:
            return None, False

        probe_mean_ft_z = np.mean(np.stack(self.probe_buffer, axis=0), axis=0)
        return probe_mean_ft_z - self.tare_ft_z, True

    def evaluate_gates(
        self,
        obs: Dict[str, Any],
        commit_history: bool = False,
    ) -> Tuple[Dict[str, bool], Dict[str, Any]]:
        """
        Evaluates all Ten Authorization Gates (G1–G10) strictly from telemetry in obs
        and certified internal evidence accumulators. Does not advance state machine.
        """
        fn_arr = self._extract_normal_forces(obs)
        ft_arr = self._extract_shear_forces(obs)
        dt_ms, gamma = self._extract_dt_and_gamma(obs)

        g1 = self.evaluator.evaluate_g1_sensor_healthy(fn_arr, ft_arr, dt_ms, gamma)
        dt_s = (dt_ms * 1e-3) if (dt_ms is not None and math.isfinite(dt_ms) and dt_ms > 0.0) else self.dt

        finger_pos_m, obj_pos_m = self._extract_positions_m(obs)
        moments_xyz = self._extract_moments(obs, fn_arr, ft_arr, finger_pos_m, obj_pos_m)
        rho_arr, delta_dot_t = self._extract_slip_kinematics(obs, fn_arr, ft_arr, finger_pos_m, obj_pos_m, dt_s, commit_history)
        a_z, f_table_z_hat = self._extract_vertical_dynamics(obs, ft_arr, dt_s, commit_history)

        delta_ft_z, diff_valid = self._compute_differential_excitation(obs, ft_arr)

        if not g1 or fn_arr is None or ft_arr is None:
            gates = {f"G{j}": False for j in range(1, 11)}
            return gates, {
                "fn_arr": fn_arr,
                "ft_arr": ft_arr,
                "dt_ms": dt_ms,
                "gamma": gamma,
                "moments_xyz": moments_xyz,
                "rho_arr": rho_arr,
                "delta_dot_t": delta_dot_t,
                "a_z": a_z,
                "f_table_z_hat": f_table_z_hat,
                "delta_ft_z": delta_ft_z,
                "diff_valid": diff_valid,
            }

        g2 = self.evaluator.evaluate_g2_evidence_preload(fn_arr)
        g3 = self.evaluator.evaluate_g3_lift_preload(fn_arr)
        g4 = self.evaluator.evaluate_g4_load_transfer(delta_ft_z) if diff_valid else False
        g5 = self.evaluator.evaluate_g5_friction_bound_valid(self.friction_status, delta_ft_z, self.mu_lb) if diff_valid else False
        g6 = self.evaluator.evaluate_g6_wrench_feasible(self.mu_lb, fn_arr, ft_arr[:, 0]) if g5 else False
        g7 = self.evaluator.evaluate_g7_wrench_balanced(ft_arr[:, 1], moments_xyz)
        g8 = self.evaluator.evaluate_g8_force_limits(fn_arr, ft_arr)
        g9 = self.evaluator.evaluate_g9_no_active_slip(rho_arr, delta_dot_t)
        g10 = self.evaluator.evaluate_g10_dynamic_model_valid(a_z, f_table_z_hat)

        gates = {
            "G1": g1,
            "G2": g2,
            "G3": g3,
            "G4": g4,
            "G5": g5,
            "G6": g6,
            "G7": g7,
            "G8": g8,
            "G9": g9,
            "G10": g10,
        }
        return gates, {
            "fn_arr": fn_arr,
            "ft_arr": ft_arr,
            "dt_ms": dt_ms,
            "gamma": gamma,
            "moments_xyz": moments_xyz,
            "rho_arr": rho_arr,
            "delta_dot_t": delta_dot_t,
            "a_z": a_z,
            "f_table_z_hat": f_table_z_hat,
            "delta_ft_z": delta_ft_z,
            "diff_valid": diff_valid,
            "obj_pos_m": obj_pos_m,
        }

    # --------------------------------------------------------------------------
    # Main Control Cycle (7-State Supervisor & Action Substitution)
    # --------------------------------------------------------------------------

    def _safe_arrest_action(self, reason: str, gates: Optional[Dict[str, bool]] = None) -> Tuple[np.ndarray, bool, Dict[str, Any]]:
        self.v_z = 0.0
        a_sub = np.zeros(5, dtype=float)
        g_map = gates if gates is not None else {f"G{j}": False for j in range(1, 11)}
        failed = [f"G{j}" for j in range(1, 11) if not g_map.get(f"G{j}", False)]
        self.last_authorization = AuthorizationResult(
            lift_authorized=False,
            state=self.state,
            gates=g_map,
            failed_gates=failed,
            reason=reason,
        )
        info = {
            "variant": "PLCEA",
            "state": self.state.value,
            "branch": "PLCEA_Safe_Arrest",
            "intervention_reason": reason,
            "intervened": True,
            "lift_authorized": False,
            "gates": g_map,
            "failed_gates": failed,
            "shear_measured": False,
            "max_slip_ratio": float("inf"),
            "h_slip": float("-inf"),
            "h_crush": 0.0,
            "v_z_stateful_mps": 0.0,
            "distortion_norm": 0.0,
        }
        return a_sub, True, info

    def _update_friction_identification(
        self,
        fn_arr: np.ndarray,
        ft_arr: np.ndarray,
        delta_ft_z: Optional[np.ndarray],
        rho_arr: Optional[np.ndarray],
        delta_dot_t: Optional[np.ndarray],
        diff_valid: bool,
    ) -> None:
        """
        Updates per-contact 5-cycle consecutive identification streaks and latches empirical
        simultaneous Bonferroni friction lower bounds mu_LB,i only under verified excitation and no-slip.
        """
        if not diff_valid or delta_ft_z is None or rho_arr is None or delta_dot_t is None:
            self.streak_counter = [0] * self.N_f
            return

        ft_norms = np.linalg.norm(ft_arr, axis=1)
        for i in range(self.N_f):
            excite_ok = float(delta_ft_z[i]) >= self.evaluator.delta_ft_min_contact_n
            slip_ok = (0.0 <= float(rho_arr[i]) <= self.eta) and (abs(float(delta_dot_t[i])) <= SLIP_VELOCITY_MAX_MPS)
            fn_ok = float(fn_arr[i]) >= self.evaluator.fn_evidence_preload_n

            if excite_ok and slip_ok and fn_ok:
                self.streak_counter[i] += 1
                if self.streak_counter[i] >= self.friction_streak_cycles:
                    self.friction_status[i] = "IDENTIFIED"
                    delta_mu = self.evaluator.compute_simultaneous_delta_mu(
                        float(fn_arr[i]), float(ft_norms[i]), self.sigma_n, self.sigma_t
                    )
                    mu_est_lb = max(0.0, (float(ft_norms[i]) / float(fn_arr[i])) - delta_mu)
                    if self.mu_lb[i] is None:
                        self.mu_lb[i] = mu_est_lb
                    else:
                        self.mu_lb[i] = max(float(self.mu_lb[i]), mu_est_lb)
            else:
                self.streak_counter[i] = 0
                self.friction_status[i] = "UNIDENTIFIED"
                self.mu_lb[i] = None

    def _evaluate_gate_bundle(
        self,
        fn_arr: np.ndarray,
        ft_arr: np.ndarray,
        dt_ms: float,
        gamma: int,
        moments_xyz: Optional[np.ndarray],
        rho_arr: Optional[np.ndarray],
        delta_dot_t: Optional[np.ndarray],
        a_z: Optional[float],
        f_table_z_hat: Optional[float],
        delta_ft_z: Optional[np.ndarray],
        diff_valid: bool,
    ) -> Dict[str, bool]:
        g1 = self.evaluator.evaluate_g1_sensor_healthy(fn_arr, ft_arr, dt_ms, gamma)
        g2 = self.evaluator.evaluate_g2_evidence_preload(fn_arr)
        g3 = self.evaluator.evaluate_g3_lift_preload(fn_arr)
        g4 = self.evaluator.evaluate_g4_load_transfer(delta_ft_z) if diff_valid else False
        g5 = self.evaluator.evaluate_g5_friction_bound_valid(self.friction_status, delta_ft_z, self.mu_lb) if diff_valid else False
        g6 = self.evaluator.evaluate_g6_wrench_feasible(self.mu_lb, fn_arr, ft_arr[:, 0]) if g5 else False
        g7 = self.evaluator.evaluate_g7_wrench_balanced(ft_arr[:, 1], moments_xyz)
        g8 = self.evaluator.evaluate_g8_force_limits(fn_arr, ft_arr)
        g9 = self.evaluator.evaluate_g9_no_active_slip(rho_arr, delta_dot_t)
        g10 = self.evaluator.evaluate_g10_dynamic_model_valid(a_z, f_table_z_hat)
        return {
            "G1": g1,
            "G2": g2,
            "G3": g3,
            "G4": g4,
            "G5": g5,
            "G6": g6,
            "G7": g7,
            "G8": g8,
            "G9": g9,
            "G10": g10,
        }

    def substitute_action(
        self,
        obs: Dict[str, Any],
        proposed_action: np.ndarray,
        variant: str = "PLCEA",
    ) -> Tuple[np.ndarray, bool, Dict[str, Any]]:
        """
        Executes one deterministic 100 Hz control cycle of the PLCEA Action Substitutor.
        Returns (substituted_action, intervened_flag, diagnostic_info).
        """
        # 1. Proposed Action Validation
        if obs is None or not isinstance(obs, dict):
            self.sensor_healthy_consecutive_frames = 0
            self.state = PLCEAState.S6_SENSOR_UNAVAILABLE
            self._clear_evidence_buffers(reset_friction=True)
            return self._safe_arrest_action("invalid_obs_dict")

        if proposed_action is None:
            return self._safe_arrest_action("none_proposed_action")
        try:
            a_prop = np.asarray(proposed_action, dtype=float)
        except (ValueError, TypeError):
            return self._safe_arrest_action("unconvertible_proposed_action")
        if a_prop.ndim != 1 or a_prop.shape != (5,) or not np.all(np.isfinite(a_prop)):
            return self._safe_arrest_action("malformed_proposed_action")

        # 2. Sensor Telemetry Extraction & Gate G1 Check
        initial_gates, ctx = self.evaluate_gates(obs, commit_history=True)
        fn_arr: Optional[np.ndarray] = ctx["fn_arr"]
        ft_arr: Optional[np.ndarray] = ctx["ft_arr"]
        dt_ms: Optional[float] = ctx["dt_ms"]
        gamma: Optional[int] = ctx["gamma"]

        if not initial_gates["G1"] or fn_arr is None or ft_arr is None or dt_ms is None or gamma is None:
            self.sensor_healthy_consecutive_frames = 0
            self.state = PLCEAState.S6_SENSOR_UNAVAILABLE
            self._clear_evidence_buffers(reset_friction=True)
            self.v_z = 0.0

            a_sub = np.zeros(5, dtype=float)
            if fn_arr is not None:
                a_sub[:4] = self.calculate_squeeze_command(fn_arr, np.zeros(self.N_f), allow_augment=False)

            failed = [f"G{j}" for j in range(1, 11) if not initial_gates.get(f"G{j}", False)]
            self.last_authorization = AuthorizationResult(
                lift_authorized=False,
                state=self.state,
                gates=initial_gates,
                failed_gates=failed,
                reason="sensor_unavailable_g1_fault",
            )
            max_fn_val = float(np.max(fn_arr)) if fn_arr is not None else 0.0
            return a_sub, True, {
                "variant": variant,
                "state": self.state.value,
                "branch": "PLCEA_S6_Sensor_Fault",
                "intervention_reason": "sensor_unavailable_g1_fault",
                "intervened": True,
                "lift_authorized": False,
                "gates": initial_gates,
                "failed_gates": failed,
                "shear_measured": False,
                "max_slip_ratio": float("inf"),
                "h_slip": float("-inf"),
                "h_crush": self.F_hard_limit - max_fn_val,
                "v_z_stateful_mps": 0.0,
                "distortion_norm": round(float(np.linalg.norm(a_prop - a_sub)), 5),
            }

        dt_s = dt_ms * 1e-3

        # 3. Handle Recovery from State S6 (Strict 3 Consecutive Healthy Frames Requirement)
        if self.state == PLCEAState.S6_SENSOR_UNAVAILABLE:
            self.sensor_healthy_consecutive_frames += 1
            if self.sensor_healthy_consecutive_frames < self.sensor_reengage_frames:
                self.v_z = 0.0
                a_sub = np.zeros(5, dtype=float)
                a_sub[:4] = self.calculate_squeeze_command(fn_arr, np.zeros(self.N_f), allow_augment=False)
                gates = {f"G{j}": False for j in range(1, 11)}
                gates["G1"] = True
                failed = [f"G{j}" for j in range(2, 11)]
                self.last_authorization = AuthorizationResult(
                    lift_authorized=False,
                    state=self.state,
                    gates=gates,
                    failed_gates=failed,
                    reason=f"sensor_reengaging_{self.sensor_healthy_consecutive_frames}_of_{self.sensor_reengage_frames}",
                )
                return a_sub, True, {
                    "variant": variant,
                    "state": self.state.value,
                    "branch": "PLCEA_S6_Reengaging",
                    "intervention_reason": "sensor_reengaging",
                    "intervened": True,
                    "lift_authorized": False,
                    "gates": gates,
                    "failed_gates": failed,
                    "shear_measured": True,
                    "max_slip_ratio": float(np.max(ctx["rho_arr"])) if ctx["rho_arr"] is not None else float("inf"),
                    "h_slip": 0.0,
                    "h_crush": self.F_hard_limit - float(np.max(fn_arr)),
                    "v_z_stateful_mps": 0.0,
                    "distortion_norm": round(float(np.linalg.norm(a_prop - a_sub)), 5),
                }
            # Re-engaged cleanly on exact 3rd healthy frame -> transition to S1_HOLD_PRELOAD
            self.sensor_healthy_consecutive_frames = 0
            self.state = PLCEAState.S1_HOLD_PRELOAD

        else:
            self.sensor_healthy_consecutive_frames += 1

        # 4. Global Force Limit / Overforce Breach Override (>= 18.0 N, Delamination >= 8.0 N, or I_fail >= 1.0)
        max_fn = float(np.max(fn_arr))
        min_fn = float(np.min(fn_arr))
        ft_norms = np.linalg.norm(ft_arr, axis=1)
        f_res_norms = np.array([self.evaluator.compute_resultant_force_norm(fn_arr[i], ft_arr[i]) for i in range(self.N_f)])
        i_fail_vals = np.array([self.evaluator.compute_multiaxial_failure_index(fn_arr[i], ft_arr[i]) for i in range(self.N_f)])

        has_overforce_hazard = (
            max_fn >= self.F_ceiling
            or float(np.max(f_res_norms)) >= self.evaluator.f_resultant_protect_n
            or float(np.max(ft_norms)) >= self.evaluator.ft_protect_n
            or float(np.max(i_fail_vals)) >= 1.000
        )

        if has_overforce_hazard:
            self.state = PLCEAState.S5_RECOVER_FALLBACK
            self._clear_evidence_buffers(reset_friction=True)
            self.v_z = 0.0
            a_sub = np.zeros(5, dtype=float)
            a_sub[:4] = self.calculate_squeeze_command(fn_arr, np.zeros(self.N_f), allow_augment=False)
            a_sub[4] = 0.0  # Lift velocity strictly locked to 0.0 m/s

            gates = self._evaluate_gate_bundle(
                fn_arr,
                ft_arr,
                dt_ms,
                gamma,
                ctx["moments_xyz"],
                ctx["rho_arr"],
                ctx["delta_dot_t"],
                ctx["a_z"],
                ctx["f_table_z_hat"],
                None,
                False,
            )
            failed = [f"G{j}" for j in range(1, 11) if not gates.get(f"G{j}", False)]
            self.last_authorization = AuthorizationResult(
                lift_authorized=False,
                state=self.state,
                gates=gates,
                failed_gates=failed,
                reason="overforce_anti_crush_retraction",
            )
            max_rho = float(np.max(ctx["rho_arr"])) if ctx["rho_arr"] is not None else float("inf")
            return a_sub, True, {
                "variant": variant,
                "state": self.state.value,
                "branch": "PLCEA_S5_AntiCrush_Retraction",
                "intervention_reason": "overforce_anti_crush_retraction",
                "intervened": True,
                "lift_authorized": False,
                "gates": gates,
                "failed_gates": failed,
                "shear_measured": True,
                "max_slip_ratio": max_rho,
                "h_slip": (self.eta - max_rho) if math.isfinite(max_rho) else float("-inf"),
                "h_crush": self.F_hard_limit - max_fn,
                "v_z_stateful_mps": 0.0,
                "distortion_norm": round(float(np.linalg.norm(a_prop - a_sub)), 5),
            }

        # 5. State Machine Execution (S0 through S5 nominal transitions)
        a_sub = a_prop.copy()
        branch_used = self.state.value
        reason = "nominal"
        target_fn = np.full(self.N_f, self.base_preload_target_n, dtype=float)
        allow_augment = True

        moments_xyz = ctx["moments_xyz"]
        rho_arr = ctx["rho_arr"]
        delta_dot_t = ctx["delta_dot_t"]
        a_z = ctx["a_z"]
        f_table_z_hat = ctx["f_table_z_hat"]
        obj_pos_m = ctx["obj_pos_m"]
        z_obj_mm = (float(obj_pos_m[2]) * 1000.0) if obj_pos_m is not None else 0.0

        # ------------------------------------------------------------------
        # S0: APPROACH_FREE_SPACE
        # ------------------------------------------------------------------
        if self.state == PLCEAState.S0_APPROACH_FREE_SPACE:
            if np.any(fn_arr >= self.F_min_valid):
                self.state = PLCEAState.S1_HOLD_PRELOAD
            else:
                self.v_z = 0.0
                a_sub[:4] = np.clip(np.maximum(a_prop[:4], 0.20), 0.20, 2.0)
                a_sub[4] = 0.0
                branch_used = "PLCEA_S0_Approach"
                reason = "approaching_workpiece_free_space"

        # ------------------------------------------------------------------
        # S1: HOLD_PRELOAD (Seating + 20-Frame Tare + 100 ms Dwell)
        # ------------------------------------------------------------------
        if self.state == PLCEAState.S1_HOLD_PRELOAD:
            self.v_z = 0.0
            a_sub[4] = 0.0
            a_sub[:4] = self.calculate_squeeze_command(fn_arr, a_prop[:4], target_fn=target_fn, allow_augment=True)
            branch_used = "PLCEA_S1_HoldPreload_Tare"
            reason = "acquiring_preload_and_tare_baseline"

            if min_fn >= self.evaluator.fn_evidence_preload_n:
                if len(self.tare_buffer) < self.n_tare_frames:
                    self.tare_buffer.append(ft_arr[:, 1].copy())
                    if len(self.tare_buffer) == self.n_tare_frames:
                        self.tare_ft_z = np.mean(np.stack(self.tare_buffer, axis=0), axis=0)
                elif self.dwell_counter < self.n_dwell_frames:
                    self.dwell_counter += 1
                    # Keep grasp fixed/gentle during quiescent dwell so shear doesn't drift
                    a_sub[:4] = np.clip(a_sub[:4], -0.20, 0.20)
                    reason = f"quiescent_dwell_buffer_{self.dwell_counter}_of_{self.n_dwell_frames}"

                if (
                    self.tare_ft_z is not None
                    and self.dwell_counter >= self.n_dwell_frames
                    and min_fn >= self.evaluator.fn_lift_preload_n
                ):
                    self.state = PLCEAState.S2_PROBE_FOR_EVIDENCE
                    self.probe_buffer.clear()
                    self.probe_cumulative_stroke_mm = 0.0
                    self.probe_step_count = 0
                    reason = "transition_to_s2_micro_probe"
            else:
                # Lost evidence preload before tare finished -> clear quiescent tare
                self.tare_buffer.clear()
                self.tare_ft_z = None
                self.dwell_counter = 0

        # ------------------------------------------------------------------
        # S2: PROBE_FOR_EVIDENCE (Micro-Probe + Friction ID + Wrench Balance)
        # ------------------------------------------------------------------
        if self.state == PLCEAState.S2_PROBE_FOR_EVIDENCE:
            self.probe_step_count += 1
            self.probe_buffer.append(ft_arr[:, 1].copy())

            delta_ft_z, diff_valid = self._compute_differential_excitation(obs, ft_arr)
            self._update_friction_identification(fn_arr, ft_arr, delta_ft_z, rho_arr, delta_dot_t, diff_valid)

            all_identified = all(s == "IDENTIFIED" for s in self.friction_status)
            slip_detected = (rho_arr is not None and np.any(rho_arr > self.eta)) or (
                delta_dot_t is not None and np.any(np.abs(delta_dot_t) > SLIP_VELOCITY_MAX_MPS)
            )

            # Check immediate failure / abort conditions in S2
            if min_fn < self.evaluator.fn_evidence_preload_n:
                self.v_z = 0.0
                a_sub[4] = 0.0
                a_sub[:4] = self.calculate_squeeze_command(fn_arr, a_prop[:4], target_fn=target_fn, allow_augment=True)
                self._clear_evidence_buffers(reset_friction=True)
                self.state = PLCEAState.S1_HOLD_PRELOAD
                branch_used = "PLCEA_S2_Preload_Lost"
                reason = "evidence_preload_lost_during_probe"
            elif slip_detected:
                self.v_z = 0.0
                a_sub[4] = 0.0
                a_sub[:4] = np.zeros(self.N_f, dtype=float)
                self._clear_evidence_buffers(reset_friction=True)
                self.s5_latched_slip = True
                self.s5_stable_frames = 0
                self.state = PLCEAState.S5_RECOVER_FALLBACK
                branch_used = "PLCEA_S2_Slip_Detected"
                reason = "slip_detected_during_probe_recover"
            else:
                # Phase 2a excitation failure timeout (e.g. unresponsive shear response)
                no_excitation_timed_out = (
                    self.probe_step_count >= self.no_excitation_timeout_steps
                    and not all_identified
                    and (not diff_valid or delta_ft_z is None or float(np.min(delta_ft_z)) < self.evaluator.delta_ft_min_contact_n)
                )

                if no_excitation_timed_out:
                    self.v_z = 0.0
                    a_sub[4] = 0.0
                    a_sub[:4] = np.zeros(self.N_f, dtype=float)
                    self.state = PLCEAState.S3_PROBE_INCONCLUSIVE
                    branch_used = "PLCEA_S2_No_Excitation_Timeout"
                    reason = "insufficient_shear_excitation_inconclusive"
                else:
                    # Only compute adaptive preload boost once empirical mu_lb >= 0.150 is established
                    mu_min_ready = all_identified and all(
                        m is not None and math.isfinite(m) and float(m) >= self.evaluator.mu_lb_min
                        for m in self.mu_lb
                    )
                    if mu_min_ready:
                        target_fn, feasible_within_ceiling = self._compute_adaptive_preload_targets(ft_arr[:, 0])
                        if not feasible_within_ceiling:
                            self.v_z = 0.0
                            a_sub[4] = 0.0
                            a_sub[:4] = np.zeros(self.N_f, dtype=float)
                            self._clear_evidence_buffers(reset_friction=False)
                            self.s5_latched_slip = True
                            self.s5_stable_frames = 0
                            self.state = PLCEAState.S5_RECOVER_FALLBACK
                            branch_used = "PLCEA_S2_Insufficient_Friction_For_Wrench"
                            reason = "mu_lb_requires_excessive_preload_near_crush"

                    if self.state == PLCEAState.S2_PROBE_FOR_EVIDENCE:
                        a_sub[:4] = self.calculate_squeeze_command(fn_arr, a_prop[:4], target_fn=target_fn, allow_augment=True)

                        # Evaluate all 10 gates strictly
                        gates_now = self._evaluate_gate_bundle(
                            fn_arr, ft_arr, dt_ms, gamma, moments_xyz, rho_arr, delta_dot_t, a_z, f_table_z_hat, delta_ft_z, diff_valid
                        )

                        if self.evaluator.evaluate_lift_authorized(gates_now):
                            self.state = PLCEAState.S4_AUTHORIZE_LIFT
                            branch_used = "PLCEA_S4_Lift_Authorized"
                            reason = "all_ten_gates_verified"
                        else:
                            # Controlled vertical micro-probe step (strictly bounded <= v_probe_max_mps)
                            self.v_z = 0.0
                            max_probe_dz_step = self.v_probe_nom_mps * 1000.0 * dt_s
                            cap_probe_dz_step = self.v_probe_max_mps * 1000.0 * dt_s
                            safe_step = min(max_probe_dz_step, cap_probe_dz_step)

                            if float(a_prop[4]) < -0.05:
                                a_sub[4] = float(np.clip(max(float(a_prop[4]), -z_obj_mm), -2.0, 0.0))
                                branch_used = "PLCEA_S2_Descent_Abort"
                                reason = "planner_requested_descent_during_probe"
                            elif self.probe_cumulative_stroke_mm < self.probe_stroke_mm:
                                # Phase 2a: initial +0.10 mm tactile excitation micro-probe
                                rem = self.probe_stroke_mm - self.probe_cumulative_stroke_mm
                                dz = min(rem, safe_step)
                                a_sub[4] = dz
                                self.probe_cumulative_stroke_mm += dz
                                branch_used = "PLCEA_S2_Excitation_MicroProbe"
                                reason = "executing_0.10mm_micro_probe"
                            elif (
                                len(self.probe_buffer) >= self.n_probe_frames
                                and (not gates_now["G4"] or not gates_now["G7"])
                                and float(np.sum(ft_arr[:, 1])) < (self.evaluator.f_load_dynamic_n - 0.05)
                                and all_identified
                                and self.probe_cumulative_stroke_mm < self.max_probe_total_mm
                            ):
                                # Phase 2b: quasi-static pre-lift shear load-transfer ramp (object seated on table)
                                rem = self.max_probe_total_mm - self.probe_cumulative_stroke_mm
                                dz = min(rem, 0.5 * safe_step)
                                a_sub[4] = dz
                                self.probe_cumulative_stroke_mm += dz
                                branch_used = "PLCEA_S2_LoadTransfer_Ramp"
                                reason = "quasi_static_load_transfer_ramp"
                            elif self.probe_step_count >= self.max_probe_steps:
                                # Probe timed out without closing all 10 gates -> S3 Inconclusive
                                a_sub[4] = 0.0
                                self.state = PLCEAState.S3_PROBE_INCONCLUSIVE
                                branch_used = "PLCEA_S3_Inconclusive"
                                reason = "probe_timeout_inconclusive"
                            else:
                                a_sub[4] = 0.0
                                branch_used = "PLCEA_S2_Accumulating_Evidence"
                                reason = "stabilizing_probe_window_or_preload"

        # ------------------------------------------------------------------
        # S3: PROBE_INCONCLUSIVE (2-Attempt Retry Budget)
        # ------------------------------------------------------------------
        if self.state == PLCEAState.S3_PROBE_INCONCLUSIVE:
            self.v_z = 0.0
            a_sub[4] = 0.0
            a_sub[:4] = np.zeros(self.N_f, dtype=float)
            if self.retry_count < self.max_probe_retries:
                self.retry_count += 1
                # Slightly augment target preload for retry within safe envelope
                self.base_preload_target_n = min(self.F_ceiling - 4.0, self.base_preload_target_n + 0.30)
                self._clear_evidence_buffers(reset_friction=True)
                self.state = PLCEAState.S1_HOLD_PRELOAD
                branch_used = "PLCEA_S3_Retry_S1"
                reason = f"inconclusive_retry_{self.retry_count}_of_{self.max_probe_retries}"
            else:
                self.retry_exhausted_latched = True
                self._clear_evidence_buffers(reset_friction=True)
                self.state = PLCEAState.S5_RECOVER_FALLBACK
                branch_used = "PLCEA_S3_Exhausted_To_S5"
                reason = "retry_budget_exhausted_entering_s5"

        # ------------------------------------------------------------------
        # S4: AUTHORIZE_LIFT (Continuous 10-Gate Enforcement & Stateful Velocity)
        # ------------------------------------------------------------------
        if self.state == PLCEAState.S4_AUTHORIZE_LIFT:
            delta_ft_z, diff_valid = self._compute_differential_excitation(obs, ft_arr)
            # Re-verify all 10 gates continuously during lift execution
            gates_s4 = self._evaluate_gate_bundle(
                fn_arr, ft_arr, dt_ms, gamma, moments_xyz, rho_arr, delta_dot_t, a_z, f_table_z_hat, delta_ft_z, diff_valid
            )

            # Check if adaptive preload target needs updating from certified mu_lb
            target_fn, _ = self._compute_adaptive_preload_targets(ft_arr[:, 0])
            a_sub[:4] = self.calculate_squeeze_command(fn_arr, a_prop[:4], target_fn=target_fn, allow_augment=True)

            if not self.evaluator.evaluate_lift_authorized(gates_s4):
                self.v_z = 0.0
                a_sub[4] = 0.0
                if not gates_s4["G9"]:
                    self._clear_evidence_buffers(reset_friction=True)
                    self.s5_latched_slip = True
                    self.s5_stable_frames = 0
                    self.state = PLCEAState.S5_RECOVER_FALLBACK
                    branch_used = "PLCEA_S4_Aborted_Slip_To_S5"
                    reason = "slip_detected_during_authorized_lift"
                elif not gates_s4["G3"] or not gates_s4["G2"]:
                    self._clear_evidence_buffers(reset_friction=False)
                    self.state = PLCEAState.S1_HOLD_PRELOAD
                    branch_used = "PLCEA_S4_Preload_Drop_To_S1"
                    reason = "preload_deficit_during_lift"
                else:
                    self._clear_evidence_buffers(reset_friction=True)
                    self.s5_stable_frames = 0
                    self.state = PLCEAState.S5_RECOVER_FALLBACK
                    branch_used = "PLCEA_S4_Gate_Loss_To_S5"
                    reason = "gate_invariant_broken_during_lift"
            else:
                proposed_lift = float(a_prop[4])
                if proposed_lift <= 0.0:
                    # Downward descent with table collision guard
                    z_safe = max(proposed_lift, -z_obj_mm)
                    a_sub[4] = float(np.clip(z_safe, -2.0, 0.0))
                    self.v_z = (a_sub[4] * 1e-3) / dt_s
                    branch_used = "PLCEA_S4_Downward"
                    reason = "authorized_controlled_descent"
                else:
                    # Stateful upward velocity integration strictly bounded by empirical mu_LB and max_lift_accel
                    caps = self.evaluator.compute_available_vertical_capacities(
                        [float(x) for x in self.mu_lb],  # type: ignore[arg-type]
                        fn_arr,
                        ft_arr[:, 0],
                    )
                    f_t_max = self.eta * sum(caps)
                    a_z_friction_max = max(0.0, (f_t_max - self.F_g) / self.m)
                    a_z_allowed = min(self.max_lift_accel_mps2, a_z_friction_max)

                    v_z_upper = self.v_z + a_z_allowed * dt_s
                    v_prop = (proposed_lift * 1e-3) / dt_s
                    v_z_lower = max(0.0, self.v_z - self.max_lift_accel_mps2 * dt_s)

                    self.v_z = float(np.clip(v_prop, v_z_lower, v_z_upper))
                    delta_z_mm = self.v_z * dt_s * 1000.0
                    a_sub[4] = float(np.clip(delta_z_mm, 0.0, 5.0))
                    branch_used = "PLCEA_S4_Upward"
                    reason = "authorized_upward_lift"

        # ------------------------------------------------------------------
        # S5: RECOVER_FALLBACK (Safe Arrest / Latched Fallback)
        # ------------------------------------------------------------------
        if self.state == PLCEAState.S5_RECOVER_FALLBACK:
            self.v_z = 0.0
            a_sub[4] = 0.0
            a_sub[:4] = self.calculate_squeeze_command(fn_arr, np.zeros(self.N_f), allow_augment=False)
            branch_used = "PLCEA_S5_RecoverFallback"
            latched = self.retry_exhausted_latched or self.s5_latched_slip
            reason = "latched_safe_fallback" if latched else "recover_fallback_arrest"

            # Recover to S1 after 3 stable hover frames only if not permanently latched by slip or retry exhaustion
            if (not latched) and (min_fn >= self.F_min_valid) and (max_fn < self.F_ceiling - 2.0):
                self.s5_stable_frames += 1
                if self.s5_stable_frames >= 3 and self.retry_count < self.max_probe_retries:
                    self.s5_stable_frames = 0
                    self.retry_count += 1
                    self._clear_evidence_buffers(reset_friction=True)
                    self.state = PLCEAState.S1_HOLD_PRELOAD
                    branch_used = "PLCEA_S5_Recovered_To_S1"
                    reason = "overforce_or_transient_recovered_to_s1"
            else:
                self.s5_stable_frames = 0

        # 6. Final Gate Evaluation & Structured Telemetry Output
        delta_ft_z_final, diff_valid_final = self._compute_differential_excitation(obs, ft_arr)
        final_gates = self._evaluate_gate_bundle(
            fn_arr,
            ft_arr,
            dt_ms,
            gamma,
            moments_xyz,
            rho_arr,
            delta_dot_t,
            a_z,
            f_table_z_hat,
            delta_ft_z_final,
            diff_valid_final,
        )
        lift_authorized = (self.state == PLCEAState.S4_AUTHORIZE_LIFT) and self.evaluator.evaluate_lift_authorized(final_gates)
        if not lift_authorized and a_sub[4] > 0.0 and self.state != PLCEAState.S2_PROBE_FOR_EVIDENCE:
            # Defense-in-depth invariant: NEVER output positive lift velocity outside authorized S4 (or bounded S2 probe)
            a_sub[4] = 0.0
            self.v_z = 0.0

        failed_gates = [f"G{j}" for j in range(1, 11) if not final_gates.get(f"G{j}", False)]
        intervened = bool(np.linalg.norm(a_prop - a_sub) > 1e-4)

        self.last_authorization = AuthorizationResult(
            lift_authorized=lift_authorized,
            state=self.state,
            gates=final_gates,
            failed_gates=failed_gates,
            reason=reason,
            evidence={
                "tare_ready": self.tare_ft_z is not None,
                "dwell_counter": self.dwell_counter,
                "probe_window_len": len(self.probe_buffer),
                "probe_cumulative_stroke_mm": round(self.probe_cumulative_stroke_mm, 4),
                "friction_status": list(self.friction_status),
                "mu_lb": [round(x, 4) if x is not None else None for x in self.mu_lb],
                "delta_ft_z": [round(float(x), 4) for x in delta_ft_z_final] if delta_ft_z_final is not None else None,
            },
        )

        max_slip = float(np.max(rho_arr)) if rho_arr is not None else float("inf")
        info = {
            "variant": variant,
            "state": self.state.value,
            "branch": branch_used,
            "intervention_reason": reason,
            "intervened": intervened,
            "lift_authorized": lift_authorized,
            "gates": final_gates,
            "failed_gates": failed_gates,
            "retry_count": self.retry_count,
            "tare_ready": self.tare_ft_z is not None,
            "dwell_counter": self.dwell_counter,
            "probe_window_len": len(self.probe_buffer),
            "friction_status": list(self.friction_status),
            "mu_lb": [round(x, 4) if x is not None else None for x in self.mu_lb],
            "shear_measured": True,
            "max_slip_ratio": round(max_slip, 4) if math.isfinite(max_slip) else float("inf"),
            "h_slip": round(self.eta - max_slip, 4) if math.isfinite(max_slip) else float("-inf"),
            "h_crush": round(self.F_hard_limit - max_fn, 4),
            "min_normal_force_N": round(min_fn, 4),
            "max_normal_force_N": round(max_fn, 4),
            "total_normal_force_N": round(float(np.sum(fn_arr)), 4),
            "v_z_stateful_mps": round(float(self.v_z), 5),
            "distortion_norm": round(float(np.linalg.norm(a_prop - a_sub)), 5),
        }
        return a_sub, intervened, info

    def handle_inconclusive_probe(self) -> str:
        """Explicit S3 inconclusive probe retry budget helper matching Phase 1 contract."""
        self.state = PLCEAState.S3_PROBE_INCONCLUSIVE
        if self.retry_count < self.max_probe_retries:
            self.retry_count += 1
            self.base_preload_target_n = min(self.F_ceiling - 4.0, self.base_preload_target_n + 0.30)
            self._clear_evidence_buffers(reset_friction=True)
            self.state = PLCEAState.S1_HOLD_PRELOAD
            return "RETRY"
        self.retry_exhausted_latched = True
        self._clear_evidence_buffers(reset_friction=True)
        self.state = PLCEAState.S5_RECOVER_FALLBACK
        return "ABORT"
