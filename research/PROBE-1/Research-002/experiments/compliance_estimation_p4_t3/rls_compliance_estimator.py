"""
HOROS PROBE-1 — Phase 4 Task 3 (P4-T3)
Level 1: Recursive Least Squares (RLS) Compliance Estimator

Estimates instantaneous contact stiffness, normalized compliance margin,
and slip proximity from causal observable sensor measurements (forces, displacements, actions).
Features:
- Parameterized forgetting factor lambda
- Insufficient excitation / dead-band gating (prevents covariance wind-up)
- Dimensionless feature normalization (prevents ill-conditioning)
- Online residual tracking and parameter covariance uncertainty indicator
- Configurable margin warning trigger with persistence filtering
"""

import math
import numpy as np
from typing import Dict, Any, Tuple, Optional, List


class RLSComplianceEstimator:
    """
    Recursive Least Squares compliance and stiffness estimator for contact interfaces.
    
    Supported formulations:
    1. 'incremental' (default): Delta F_t = k_t * Delta delta_t + eps_t
       Directly tracks tangent stiffness k_t = dF_t / d delta_t.
    2. 'absolute': F_t = b + k_t * delta_t + eps_t
       Affine local force-displacement regression with feature scaling.
    """

    def __init__(
        self,
        formulation: str = "incremental",
        lam: float = 0.96,
        delta_window: int = 5,
        min_disp_excitation: float = 1e-6,  # 1.0 um minimum displacement increment
        p_init: float = 100.0,
        theta_warning_margin: float = 0.40,
        warning_persistence: int = 3,
        k_init_guess: float = 6000.0,  # Expected stiffness in N/m
    ):
        assert formulation in ("incremental", "absolute"), f"Unknown formulation: {formulation}"
        assert 0.80 <= lam <= 1.0, f"Forgetting factor lambda must be in [0.80, 1.0], got {lam}"

        self.formulation = formulation
        self.lam = lam
        self.delta_window = delta_window
        self.min_disp_excitation = min_disp_excitation
        self.p_init = p_init
        self.theta_warning_margin = theta_warning_margin
        self.warning_persistence = warning_persistence
        self.k_init_guess = k_init_guess

        # Internal state
        self.reset()

    def reset(self, kt_0_nominal: Optional[float] = None) -> None:
        """Resets the estimator state for a new contact episode."""
        self.step_count = 0
        self.kt_0 = kt_0_nominal if kt_0_nominal and kt_0_nominal > 0.0 else self.k_init_guess
        self.kt_0_locked = kt_0_nominal is not None

        # History buffers for sliding-window difference
        self.ft_hist: List[float] = []
        self.disp_hist: List[float] = []
        self.time_hist: List[float] = []

        # RLS State
        if self.formulation == "incremental":
            # 1D regression: y = dF [N], phi = dd [mm], beta = [kt in N/mm]
            self.beta = np.array([self.kt_0 / 1000.0], dtype=np.float64)
            self.P = np.array([[self.p_init]], dtype=np.float64)
        else:
            # 2D regression: y = Ft [N], phi = [1.0, disp_mm], beta = [b [N], kt [N/mm]]
            self.beta = np.array([0.0, self.kt_0 / 1000.0], dtype=np.float64)
            self.P = np.eye(2, dtype=np.float64) * self.p_init

        # Performance and diagnostic state
        self.current_kt = float(self.kt_0)
        self.current_margin = 1.0
        self.latest_residual = 0.0
        self.residual_variance = 1e-4
        self.consecutive_warning_count = 0
        self.warning_active = False
        self.first_warning_step = -1
        self.first_warning_time = -1.0
        self.data_valid = False

    def update(
        self,
        ft: float,
        fn: float,
        disp: float,
        time: float,
    ) -> Dict[str, Any]:
        """
        Processes a single causal time-step measurement.
        
        Args:
            ft: Measured tangential force [N]
            fn: Measured normal force [N]
            disp: Measured tangential displacement [m]
            time: Current timestamp [s]
            
        Returns:
            Dictionary containing:
            - 'stiffness_kt': Estimated tangential stiffness [N/m]
            - 'stiffness_margin': Normalized margin m_t in [0.0, 1.0]
            - 'estimation_residual': Prediction error e_t [N]
            - 'covariance_trace': Tr(P_t) measure of parameter uncertainty
            - 'residual_std': Standard deviation of prediction residuals [N]
            - 'warning_active': Boolean flag if margin is below threshold with persistence
            - 'data_valid': Boolean flag indicating if valid excitation was present
        """
        self.step_count += 1
        self.ft_hist.append(ft)
        self.disp_hist.append(disp)
        self.time_hist.append(time)

        # Initial calibration period (first 10 steps to lock kt_0 if not provided)
        if not self.kt_0_locked and len(self.disp_hist) >= 10:
            d_disp_init = abs(self.disp_hist[-1] - self.disp_hist[0])
            d_ft_init = abs(self.ft_hist[-1] - self.ft_hist[0])
            if d_disp_init >= self.min_disp_excitation:
                est_init = d_ft_init / d_disp_init
                if 500.0 <= est_init <= 30000.0:
                    self.kt_0 = float(est_init)
                    self.kt_0_locked = True

        w = self.delta_window
        if len(self.disp_hist) <= w:
            # Insufficient history for finite-window regressor
            self.data_valid = False
            return self._build_step_output(is_valid=False)

        # Compute regressor components
        if self.formulation == "incremental":
            dd = disp - self.disp_hist[-w - 1]
            df = ft - self.ft_hist[-w - 1]
            dd_mm = dd * 1000.0  # Scale to mm

            # Deadband gate: test for sufficient excitation
            if abs(dd) < self.min_disp_excitation:
                self.data_valid = False
                # No update to P or beta, but return current state
                return self._build_step_output(is_valid=False)

            self.data_valid = True
            phi = np.array([dd_mm], dtype=np.float64)
            y = df

            # Standard 1D RLS step
            err = y - float(phi @ self.beta)
            self.latest_residual = float(err)
            self.residual_variance = 0.95 * self.residual_variance + 0.05 * (err ** 2)

            denom = self.lam + float(phi @ self.P @ phi)
            K = (self.P @ phi) / denom
            self.beta = self.beta + K * err
            self.P = (self.P - np.outer(K, phi) @ self.P) / self.lam

            # Project stiffness to physically reasonable non-negative bounds
            kt_n_mm = max(0.0, min(30.0, float(self.beta[0])))
            self.beta[0] = kt_n_mm
            self.current_kt = kt_n_mm * 1000.0

        else:  # absolute formulation
            disp_mm = disp * 1000.0
            phi = np.array([1.0, disp_mm], dtype=np.float64)
            y = ft

            # 2D RLS step
            err = y - float(phi @ self.beta)
            self.latest_residual = float(err)
            self.residual_variance = 0.95 * self.residual_variance + 0.05 * (err ** 2)

            denom = self.lam + float(phi @ self.P @ phi)
            K = (self.P @ phi) / denom
            self.beta = self.beta + K * err
            self.P = (self.P - np.outer(K, phi) @ self.P) / self.lam

            kt_n_mm = max(0.0, min(30.0, float(self.beta[1])))
            self.beta[1] = kt_n_mm
            self.current_kt = kt_n_mm * 1000.0
            self.data_valid = True

        # Normalized margin: m_t = kt / kt_0
        self.current_margin = float(np.clip(self.current_kt / max(1.0, self.kt_0), 0.0, 1.0))

        # Warning logic with persistence
        if self.current_margin <= self.theta_warning_margin:
            self.consecutive_warning_count += 1
            if self.consecutive_warning_count >= self.warning_persistence:
                self.warning_active = True
                if self.first_warning_step < 0:
                    self.first_warning_step = self.step_count
                    self.first_warning_time = time
        else:
            self.consecutive_warning_count = 0

        return self._build_step_output(is_valid=True)

    def _build_step_output(self, is_valid: bool) -> Dict[str, Any]:
        return {
            "stiffness_kt": self.current_kt,
            "stiffness_margin": self.current_margin,
            "estimation_residual": self.latest_residual,
            "covariance_trace": float(np.trace(self.P)),
            "residual_std": math.sqrt(max(0.0, self.residual_variance)),
            "warning_active": self.warning_active,
            "first_warning_step": self.first_warning_step,
            "first_warning_time": self.first_warning_time,
            "data_valid": is_valid,
        }

    def evaluate_trajectory(
        self,
        ft: np.ndarray,
        fn: np.ndarray,
        disp: np.ndarray,
        time: np.ndarray,
        gross_slip_step: int,
        kt_0_nominal: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Evaluates a complete trajectory sequentially and returns comprehensive time-series
        and episode-level metrics.
        """
        self.reset(kt_0_nominal=kt_0_nominal)
        N = len(time)

        kt_series = np.zeros(N, dtype=np.float64)
        margin_series = np.zeros(N, dtype=np.float64)
        residual_series = np.zeros(N, dtype=np.float64)
        cov_trace_series = np.zeros(N, dtype=np.float64)
        valid_series = np.zeros(N, dtype=bool)

        for i in range(N):
            out = self.update(ft[i], fn[i], disp[i], time[i])
            kt_series[i] = out["stiffness_kt"]
            margin_series[i] = out["stiffness_margin"]
            residual_series[i] = out["estimation_residual"]
            cov_trace_series[i] = out["covariance_trace"]
            valid_series[i] = out["data_valid"]

        t_slip = float(time[gross_slip_step]) if gross_slip_step >= 0 else float(time[-1])

        if self.first_warning_step >= 0 and self.first_warning_step <= gross_slip_step:
            lead_time_ms = (t_slip - self.first_warning_time) * 1000.0
            detected = True
        else:
            lead_time_ms = 0.0
            detected = False

        return {
            "detected_preslip": detected,
            "lead_time_ms": lead_time_ms,
            "warning_step": self.first_warning_step,
            "warning_time": self.first_warning_time,
            "gross_slip_time": t_slip,
            "kt_series": kt_series,
            "margin_series": margin_series,
            "residual_series": residual_series,
            "cov_trace_series": cov_trace_series,
            "valid_series": valid_series,
        }
