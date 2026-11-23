"""
HOROS PROBE-1 — Phase 4 Task 4B (P4-T4B)
Closed-Loop Grasp Controllers Suite with Tri-State Hybrid Reflexes
File: controllers_p4_t4b.py

Implements 5 closed-loop controllers:
1. FixedForceController: Constant clamping load baseline.
2. ReactiveSlipController: Reactive slip arrest only after macroscopic slip detection.
3. ThresholdMarginController: Proportional feedback on instantaneous force ratio |Ft| / Fn.
4. RLSPredictiveController: Feedback driven by online RLS compliance margin tracking.
5. HOROSHybridPredictiveController: Tri-state hybrid controller combining:
   - State 1: Stable contact (hold & controlled gentle relaxation)
   - State 2: Approaching instability (proactive predictive margin boost)
   - State 3: Emergency / High-uncertainty fallback (reactive slip arrest + epistemic fallback)
   - Hysteresis latching, actuator squeeze rate limiting (50 N/s), and safety force clamping [3.0, 25.0] N.
   - Strict causality (only observable noisy tactile telemetry).
"""

import math
import numpy as np
import torch
from typing import Dict, Any, Tuple, Optional


class BaseGraspController:
    """Base class providing safety filtering, rate limiting, and causal state management."""

    def __init__(
        self,
        fn_min: float = 3.0,
        fn_max: float = 25.0,
        max_force_rate: float = 50.0,  # Max squeeze rate: 50 N/s = 0.05 N/ms
        dt: float = 0.001,
    ):
        self.fn_min = fn_min
        self.fn_max = fn_max
        self.max_force_rate = max_force_rate
        self.dt = dt
        self.reset()

    def reset(self, fn_initial: float = 5.0) -> None:
        self.current_cmd_fn = float(np.clip(fn_initial, self.fn_min, self.fn_max))
        self.step_count = 0
        self.interventions_count = 0
        self.in_fallback = False

    def apply_rate_and_bounds(self, desired_fn: float) -> float:
        """Applies physical actuation rate limits and absolute safety bounds."""
        max_delta = self.max_force_rate * self.dt
        delta = float(np.clip(desired_fn - self.current_cmd_fn, -max_delta, max_delta))
        new_fn = float(np.clip(self.current_cmd_fn + delta, self.fn_min, self.fn_max))
        if abs(new_fn - self.current_cmd_fn) > 1e-4:
            self.interventions_count += 1
        self.current_cmd_fn = new_fn
        self.step_count += 1
        return self.current_cmd_fn


class FixedForceController(BaseGraspController):
    """Controller 1: Constant Clamping Force Baseline."""
    def step(self, obs: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "cmd_fn": self.current_cmd_fn,
            "control_action": "maintain",
            "operational_state": 1,
            "predicted_margin": None,
            "slip_probability": None,
            "uncertainty": None,
            "in_fallback": False,
        }


class ReactiveSlipController(BaseGraspController):
    """
    Controller 2: Reactive Slip Controller.
    Responds only after detecting gross slip (|v_slip| >= threshold).
    """
    def __init__(
        self,
        slip_vel_threshold: float = 1e-4,  # 0.1 mm/s macroscopic slip
        recovery_boost: float = 12.0,      # Squeeze command delta in N
        **kwargs
    ):
        super().__init__(**kwargs)
        self.slip_vel_threshold = slip_vel_threshold
        self.recovery_boost = recovery_boost
        self.slip_detected = False

    def reset(self, fn_initial: float = 5.0) -> None:
        super().reset(fn_initial)
        self.slip_detected = False

    def step(self, obs: Dict[str, Any]) -> Dict[str, Any]:
        v_slip = abs(obs.get("slip_velocity", 0.0))
        target_fn = self.current_cmd_fn

        if v_slip >= self.slip_vel_threshold:
            self.slip_detected = True
            target_fn = min(self.fn_max, self.current_cmd_fn + self.recovery_boost)
            action = "reactive_boost"
            op_state = 3
        else:
            action = "maintain"
            op_state = 1

        cmd_fn = self.apply_rate_and_bounds(target_fn)
        return {
            "cmd_fn": cmd_fn,
            "control_action": action,
            "operational_state": op_state,
            "predicted_margin": None,
            "slip_probability": 1.0 if self.slip_detected else 0.0,
            "uncertainty": None,
            "in_fallback": False,
        }


class ThresholdMarginController(BaseGraspController):
    """
    Controller 3: Static Force-Ratio Margin Controller.
    Monitors instantaneous force ratio |F_t| / F_n against safety threshold (0.45).
    """
    def __init__(
        self,
        ratio_threshold: float = 0.45,
        target_ratio: float = 0.35,
        gain: float = 15.0,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.ratio_threshold = ratio_threshold
        self.target_ratio = target_ratio
        self.gain = gain

    def step(self, obs: Dict[str, Any]) -> Dict[str, Any]:
        ft = abs(obs["force_t"])
        fn = max(1e-4, obs["force_n"])
        ratio = ft / fn

        target_fn = self.current_cmd_fn
        action = "maintain"
        op_state = 1

        if ratio >= self.ratio_threshold:
            deficit = ratio - self.target_ratio
            boost = self.gain * deficit
            target_fn = min(self.fn_max, self.current_cmd_fn + boost)
            action = "threshold_boost"
            op_state = 2
        elif ratio < 0.20 and self.current_cmd_fn > self.fn_min + 1.0:
            target_fn = max(self.fn_min, self.current_cmd_fn - 0.5 * self.dt)
            action = "relax"
            op_state = 1

        cmd_fn = self.apply_rate_and_bounds(target_fn)
        return {
            "cmd_fn": cmd_fn,
            "control_action": action,
            "operational_state": op_state,
            "predicted_margin": max(0.0, 1.0 - ratio),
            "slip_probability": 1.0 if ratio >= self.ratio_threshold else 0.0,
            "uncertainty": None,
            "in_fallback": False,
        }


class RLSPredictiveController(BaseGraspController):
    """
    Controller 4: RLS-Based Compliance Grasp Controller.
    Uses online RLS to estimate tangential stiffness and normalized margin.
    """
    def __init__(
        self,
        margin_threshold: float = 0.40,
        proportional_gain: float = 20.0,
        rls_estimator=None,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.margin_threshold = margin_threshold
        self.proportional_gain = proportional_gain
        self.rls = rls_estimator

    def set_rls_estimator(self, rls):
        self.rls = rls

    def step(self, obs: Dict[str, Any]) -> Dict[str, Any]:
        if self.rls is None:
            cmd_fn = self.apply_rate_and_bounds(self.current_cmd_fn)
            return {"cmd_fn": cmd_fn, "control_action": "maintain", "operational_state": 1}

        rls_out = self.rls.update(
            ft=obs["force_t"],
            fn=obs["force_n"],
            disp=obs["disp"],
            time=obs["time"],
        )
        margin = rls_out["stiffness_margin"]
        target_fn = self.current_cmd_fn
        action = "maintain"
        op_state = 1

        if margin <= self.margin_threshold and rls_out["data_valid"]:
            margin_deficit = self.margin_threshold - margin
            boost = self.proportional_gain * margin_deficit
            target_fn = min(self.fn_max, self.current_cmd_fn + boost)
            action = "rls_reflex_boost"
            op_state = 2

        cmd_fn = self.apply_rate_and_bounds(target_fn)
        return {
            "cmd_fn": cmd_fn,
            "control_action": action,
            "operational_state": op_state,
            "predicted_margin": margin,
            "slip_probability": 1.0 if margin <= self.margin_threshold else 0.0,
            "uncertainty": rls_out["covariance_trace"],
            "in_fallback": False,
        }


class HOROSHybridPredictiveController(BaseGraspController):
    """
    Controller 5 (Improved P4-T4B): Tri-State Hybrid Grasp Controller.
    
    Architecture:
    1. State 1 — Stable Contact:
       - Condition: m_hat(t+20) >= 0.70, p_slip < 0.15, |v_slip| < 5e-5 m/s.
       - Action: Maintain minimum validated holding force; gently relax force (-1.0 N/s)
                 if current force exceeds baseline to prevent workpiece damage.
    2. State 2 — Approaching Instability:
       - Condition: (m_hat(t+20) <= 0.45 or p_slip >= 0.30) and |v_slip| < 1e-4 m/s.
       - Action: Proactive pre-slip reflex boost:
                 Delta F_n = K_m * max(0, 0.55 - m_hat) + K_p * p_slip (K_m=30, K_p=18).
                 Latches target for H_hold = 50 ms to prevent high-frequency chatter.
    3. State 3 — Emergency Slip Recovery / Epistemic Fallback:
       - Condition: |v_slip| >= 1e-4 m/s (gross slip) OR sigma_m^2 >= 0.25 (model untrusted).
       - Action: Emergency reactive squeeze (+12.0 N) latched for 100 ms to arrest slipping.
    
    Safety constraints:
    - Actuation rate limit: |dF_n / dt| <= 50 N/s (0.05 N/step at 1000 Hz).
    - Clamping bounds: [3.0, 25.0] N.
    - Causal observations only: [F_t, F_n, Delta delta_t, v_cmd] window (W=15).
    """
    def __init__(
        self,
        model: Any,
        window_size: int = 15,
        margin_safe_target: float = 0.55,
        margin_critical_threshold: float = 0.45,
        slip_risk_threshold: float = 0.30,
        uncertainty_fallback_threshold: float = 0.25,
        slip_vel_threshold: float = 1e-4,
        kp_margin: float = 30.0,
        kp_risk: float = 18.0,
        recovery_boost: float = 12.0,
        proactive_hold_steps: int = 50,    # 50 ms hysteresis hold
        emergency_hold_steps: int = 100,   # 100 ms emergency hold
        **kwargs
    ):
        self.model = model
        self.window_size = window_size
        self.margin_safe_target = margin_safe_target
        self.margin_critical_threshold = margin_critical_threshold
        self.slip_risk_threshold = slip_risk_threshold
        self.uncertainty_fallback_threshold = uncertainty_fallback_threshold
        self.slip_vel_threshold = slip_vel_threshold
        self.kp_margin = kp_margin
        self.kp_risk = kp_risk
        self.recovery_boost = recovery_boost
        self.proactive_hold_steps = proactive_hold_steps
        self.emergency_hold_steps = emergency_hold_steps

        # Causal observation history
        self.ft_hist = []
        self.fn_hist = []
        self.disp_hist = []
        self.vcmd_hist = []

        # Internal state tracking & hysteresis
        self.op_state = 1
        self.state_hold_counter = 0
        self.latched_target_fn = 5.0
        self.baseline_fn = 5.0

        super().__init__(**kwargs)

    def reset(self, fn_initial: float = 5.0) -> None:
        super().reset(fn_initial)
        self.ft_hist.clear()
        self.fn_hist.clear()
        self.disp_hist.clear()
        self.vcmd_hist.clear()
        self.op_state = 1
        self.state_hold_counter = 0
        self.latched_target_fn = float(fn_initial)
        self.baseline_fn = float(fn_initial)

    def step(self, obs: Dict[str, Any]) -> Dict[str, Any]:
        ft = obs["force_t"]
        fn = obs["force_n"]
        disp = obs["disp"]
        vcmd = obs.get("v_cmd", 0.0)
        vslip = abs(obs.get("slip_velocity", 0.0))

        self.ft_hist.append(ft)
        self.fn_hist.append(fn)
        self.disp_hist.append(disp)
        self.vcmd_hist.append(vcmd)

        W = self.window_size
        if len(self.ft_hist) < W:
            cmd_fn = self.apply_rate_and_bounds(self.current_cmd_fn)
            return {
                "cmd_fn": cmd_fn,
                "control_action": "warmup",
                "operational_state": 1,
                "predicted_margin": 1.0,
                "slip_probability": 0.0,
                "uncertainty": 0.0,
                "in_fallback": False,
            }

        # Build causal feature window of shape (60,)
        w_ft = np.array(self.ft_hist[-W:], dtype=np.float32)
        w_fn = np.array(self.fn_hist[-W:], dtype=np.float32)
        w_disp = np.array(self.disp_hist[-W:], dtype=np.float32)
        w_dd = np.zeros_like(w_disp)
        w_dd[1:] = (w_disp[1:] - w_disp[:-1]) * 1000.0  # mm
        w_vcmd = np.array(self.vcmd_hist[-W:], dtype=np.float32) * 1000.0

        feat = np.concatenate([w_ft, w_fn, w_dd, w_vcmd], axis=0)

        # Multi-task neural perception
        with torch.no_grad():
            preds = self.model.predict_causal_step(feat)

        m_hat = preds["predicted_margin"]
        p_slip = preds["slip_probability"]
        time_rem = preds["predicted_time_to_slip_s"]
        var_m = preds["margin_uncertainty_std"] ** 2

        # -------------------------------------------------------------
        # Decision Logic: Tri-State Hybrid Reflex Engine
        # -------------------------------------------------------------
        action = "maintain"
        in_fallback = False

        # Decrement hysteresis hold counter
        if self.state_hold_counter > 0:
            self.state_hold_counter -= 1

        # Priority 1: STATE 3 — Emergency Slip Recovery OR High Uncertainty Fallback
        is_gross_slip = vslip >= self.slip_vel_threshold
        is_uncertain = var_m >= self.uncertainty_fallback_threshold

        if is_gross_slip or is_uncertain:
            self.op_state = 3
            self.state_hold_counter = self.emergency_hold_steps
            boost = self.recovery_boost if is_gross_slip else 8.0
            self.latched_target_fn = min(self.fn_max, self.current_cmd_fn + boost)
            action = "emergency_slip_arrest" if is_gross_slip else "uncertainty_fallback"
            in_fallback = is_uncertain

        # Priority 2: STATE 2 — Approaching Instability (Proactive Pre-Slip Boost)
        elif (self.op_state != 3 or self.state_hold_counter == 0) and (
            m_hat <= self.margin_critical_threshold or p_slip >= self.slip_risk_threshold
        ):
            self.op_state = 2
            margin_deficit = max(0.0, self.margin_safe_target - m_hat)
            risk_term = p_slip
            proactive_boost = self.kp_margin * margin_deficit + self.kp_risk * risk_term
            self.latched_target_fn = min(self.fn_max, self.current_cmd_fn + proactive_boost)
            self.state_hold_counter = self.proactive_hold_steps
            action = "proactive_pre_slip_boost"

        # Priority 3: STATE 1 — Stable Sticking Contact (Hold or Gentle Relaxation)
        elif self.state_hold_counter == 0:
            self.op_state = 1
            if m_hat >= 0.70 and p_slip < 0.15 and vslip < 5e-5:
                if self.current_cmd_fn > self.baseline_fn + 0.5:
                    # Gentle relaxation preserving workpiece and saving actuation
                    self.latched_target_fn = max(self.baseline_fn, self.current_cmd_fn - 1.0 * self.dt)
                    action = "controlled_relaxation"
                else:
                    self.latched_target_fn = self.baseline_fn
                    action = "maintain"
            else:
                action = "maintain"

        # Apply rate limits and safety bounds
        cmd_fn = self.apply_rate_and_bounds(self.latched_target_fn)

        return {
            "cmd_fn": cmd_fn,
            "control_action": action,
            "operational_state": self.op_state,
            "predicted_margin": m_hat,
            "slip_probability": p_slip,
            "uncertainty": var_m,
            "time_to_slip_s": time_rem,
            "in_fallback": in_fallback,
        }
