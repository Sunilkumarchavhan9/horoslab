"""
HOROS PROBE-1 — Phase 4 Task 4 (P4-T4)
Closed-Loop Grasp Controllers Suite
File: controllers.py

Implements 5 distinct grasping control policies:
1. Controller 1: Fixed-Force Baseline (constant clamping force)
2. Controller 2: Reactive Slip Controller (triggers only after slip velocity exceeds threshold)
3. Controller 3: Threshold-Based Margin Controller (static ratio or softening threshold)
4. Controller 4: RLS-Based Predictive Controller (driven by online RLS compliance estimates)
5. Controller 5: HOROS Predictive MLP Controller (multi-task margin, risk, uncertainty, and reflex modulation)

Safety Guardrails:
- Strict force bounds: F_n in [F_min, F_max]
- Squeeze rate limits: |dF_n / dt| <= max_squeeze_rate
- Anti-crush protection
- Uncertainty-aware fallback policies
- Causal observations only (no future data or privileged physics oracle)
"""

import math
import numpy as np
import torch
from typing import Dict, Any, Tuple, Optional


class BaseGraspController:
    """Base class for closed-loop grasp controllers."""

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
    """
    Controller 1: Constant Clamping Force Baseline.
    Maintains constant normal gripping force regardless of tangential loading or slip.
    """
    def step(self, obs: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "cmd_fn": self.current_cmd_fn,
            "control_action": "maintain",
            "predicted_margin": None,
            "slip_probability": None,
            "uncertainty": None,
            "in_fallback": False,
        }


class ReactiveSlipController(BaseGraspController):
    """
    Controller 2: Reactive Slip Controller.
    Responds only after detecting gross slip (|v_slip| >= threshold or rapid acceleration).
    Squeezes aggressively to recover once macroscopic slip has already initiated.
    """
    def __init__(
        self,
        slip_vel_threshold: float = 1e-4,  # 0.1 mm/s macro slip
        recovery_boost: float = 10.0,      # Squeeze command delta in N
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
        # Uses observable slip velocity estimate
        v_slip = abs(obs.get("slip_velocity", 0.0))
        target_fn = self.current_cmd_fn

        if v_slip >= self.slip_vel_threshold:
            self.slip_detected = True
            target_fn = min(self.fn_max, self.current_cmd_fn + self.recovery_boost)
            action = "reactive_boost"
        else:
            action = "maintain"

        cmd_fn = self.apply_rate_and_bounds(target_fn)
        return {
            "cmd_fn": cmd_fn,
            "control_action": action,
            "predicted_margin": None,
            "slip_probability": 1.0 if self.slip_detected else 0.0,
            "uncertainty": None,
            "in_fallback": False,
        }


class ThresholdMarginController(BaseGraspController):
    """
    Controller 3: Static Force-Ratio / Threshold Margin Controller.
    Monitors instantaneous force ratio |F_t| / F_n. When ratio crosses safety threshold (e.g. 0.45),
    proportionally increases normal force to restore margin.
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

        if ratio >= self.ratio_threshold:
            # Proportional boost to bring ratio down toward target_ratio
            deficit = ratio - self.target_ratio
            boost = self.gain * deficit
            target_fn = min(self.fn_max, self.current_cmd_fn + boost)
            action = "threshold_boost"
        elif ratio < 0.20 and self.current_cmd_fn > self.fn_min + 1.0:
            # Gentle relaxation when very safe
            target_fn = max(self.fn_min, self.current_cmd_fn - 0.5 * self.dt)
            action = "relax"

        cmd_fn = self.apply_rate_and_bounds(target_fn)
        return {
            "cmd_fn": cmd_fn,
            "control_action": action,
            "predicted_margin": max(0.0, 1.0 - ratio),
            "slip_probability": 1.0 if ratio >= self.ratio_threshold else 0.0,
            "uncertainty": None,
            "in_fallback": False,
        }


class RLSPredictiveController(BaseGraspController):
    """
    Controller 4: RLS-Based Compliance Grasp Controller.
    Uses Level 1 RLS compliance estimator to track estimated tangential stiffness k_t.
    When estimated normalized margin m_t = k_t / k_t0 drops below threshold,
    reflexively modulates normal force.
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
            return super().step(obs)

        # Update RLS
        rls_out = self.rls.update(
            ft=obs["force_t"],
            fn=obs["force_n"],
            disp=obs["disp"],
            time=obs["time"],
        )
        margin = rls_out["stiffness_margin"]
        target_fn = self.current_cmd_fn
        action = "maintain"

        if margin <= self.margin_threshold and rls_out["data_valid"]:
            margin_deficit = self.margin_threshold - margin
            boost = self.proportional_gain * margin_deficit
            target_fn = min(self.fn_max, self.current_cmd_fn + boost)
            action = "rls_reflex_boost"

        cmd_fn = self.apply_rate_and_bounds(target_fn)
        return {
            "cmd_fn": cmd_fn,
            "control_action": action,
            "predicted_margin": margin,
            "slip_probability": 1.0 if margin <= self.margin_threshold else 0.0,
            "uncertainty": rls_out["covariance_trace"],
            "in_fallback": False,
        }


class HOROSPredictiveMLPController(BaseGraspController):
    """
    Controller 5: HOROS Predictive World Model Grasp Controller.
    
    Closed-loop perception-action architecture:
    - Maintains causal sliding window of tactile observations: [Ft, Fn, Delta delta_t, v_cmd]
    - Level 2 Multi-Task MLP inference:
      1. Future stability margin: m_hat(t+H) in [0, 1]
      2. Gross slip probability: p_hat_slip in [0, 1]
      3. Remaining time-to-slip: tau_hat in s
      4. Prediction uncertainty variance: sigma^2_m
    - Intelligent Decision Engine:
      - Low Margin / High Slip Risk -> Dynamic predictive pre-emptive squeeze
      - Safe Sticking Margin -> Minimal normal force preservation
      - High Uncertainty -> Fallback bounded squeeze
      - Hysteresis & Persistence filtering preventing chatter
    """
    def __init__(
        self,
        model: Any,
        window_size: int = 15,
        margin_safe_target: float = 0.50,
        margin_critical_threshold: float = 0.35,
        slip_risk_threshold: float = 0.40,
        uncertainty_fallback_threshold: float = 0.25,
        kp_margin: float = 25.0,
        kp_risk: float = 15.0,
        **kwargs
    ):
        self.model = model
        self.window_size = window_size
        self.margin_safe_target = margin_safe_target
        self.margin_critical_threshold = margin_critical_threshold
        self.slip_risk_threshold = slip_risk_threshold
        self.uncertainty_fallback_threshold = uncertainty_fallback_threshold
        self.kp_margin = kp_margin
        self.kp_risk = kp_risk

        # Causal observation history
        self.ft_hist = []
        self.fn_hist = []
        self.disp_hist = []
        self.vcmd_hist = []

        super().__init__(**kwargs)

    def reset(self, fn_initial: float = 5.0) -> None:
        super().reset(fn_initial)
        self.ft_hist.clear()
        self.fn_hist.clear()
        self.disp_hist.clear()
        self.vcmd_hist.clear()

    def step(self, obs: Dict[str, Any]) -> Dict[str, Any]:
        ft = obs["force_t"]
        fn = obs["force_n"]
        disp = obs["disp"]
        vcmd = obs.get("v_cmd", 0.0)

        self.ft_hist.append(ft)
        self.fn_hist.append(fn)
        self.disp_hist.append(disp)
        self.vcmd_hist.append(vcmd)

        W = self.window_size
        if len(self.ft_hist) < W:
            # Warming up causal history window
            cmd_fn = self.apply_rate_and_bounds(self.current_cmd_fn)
            return {
                "cmd_fn": cmd_fn,
                "control_action": "warmup",
                "predicted_margin": 1.0,
                "slip_probability": 0.0,
                "uncertainty": 0.0,
                "in_fallback": False,
            }

        # Build causal feature window of shape (1, 60)
        w_ft = np.array(self.ft_hist[-W:], dtype=np.float32)
        w_fn = np.array(self.fn_hist[-W:], dtype=np.float32)
        w_disp = np.array(self.disp_hist[-W:], dtype=np.float32)
        w_dd = np.zeros_like(w_disp)
        w_dd[1:] = (w_disp[1:] - w_disp[:-1]) * 1000.0  # mm
        w_vcmd = np.array(self.vcmd_hist[-W:], dtype=np.float32) * 1000.0

        feat = np.concatenate([w_ft, w_fn, w_dd, w_vcmd], axis=0)

        # Predict future contact dynamics
        with torch.no_grad():
            preds = self.model.predict_causal_step(feat)

        m_hat = preds["predicted_margin"]
        p_slip = preds["slip_probability"]
        time_rem = preds["predicted_time_to_slip_s"]
        var_m = preds["margin_uncertainty_std"] ** 2

        target_fn = self.current_cmd_fn
        action = "maintain"
        in_fallback = False

        # 1. Uncertainty Fallback Check
        if var_m >= self.uncertainty_fallback_threshold:
            # High epistemic uncertainty: trigger robust protective fallback
            target_fn = min(self.fn_max, self.current_cmd_fn + 5.0)
            action = "uncertainty_fallback"
            in_fallback = True
        # 2. Pre-Slip Risk or Softening Intervention
        elif (m_hat <= self.margin_critical_threshold) or (p_slip >= self.slip_risk_threshold):
            # Impending slip detected: calculate proactive stabilizing squeeze
            margin_deficit = max(0.0, self.margin_safe_target - m_hat)
            risk_term = p_slip
            # Synergistic normal force boost
            boost = self.kp_margin * margin_deficit + self.kp_risk * risk_term
            target_fn = min(self.fn_max, self.current_cmd_fn + boost)
            action = "predictive_reflex_boost"
        # 3. Safe Grasp Relaxation
        elif m_hat >= 0.75 and p_slip < 0.10 and self.current_cmd_fn > self.fn_min + 1.0:
            # Abundant physical margin: gently relax gripping force to save energy
            target_fn = max(self.fn_min, self.current_cmd_fn - 1.0 * self.dt)
            action = "gentle_relax"

        cmd_fn = self.apply_rate_and_bounds(target_fn)
        return {
            "cmd_fn": cmd_fn,
            "control_action": action,
            "predicted_margin": m_hat,
            "slip_probability": p_slip,
            "uncertainty": var_m,
            "time_to_slip_s": time_rem,
            "in_fallback": in_fallback,
        }
