"""
HOROS PROBE-1 — Phase 5 Task 3 (P5-T3)
N-Contact Generalization & Cooperative Physical Intelligence
File: n_contact_tactile_estimator.py

Per-contact causal tactile estimator and stability margin tracker for arbitrary N contacts.
Strictly causal: accepts only noisy observable channels [Fn, Ft, disp, slip_vel].
"""

import math
import numpy as np
from typing import Dict, Any, List, Optional


class NContactTactileEstimator:
    """Estimates contact stability margin and epistemic uncertainty for contact i."""

    def __init__(
        self,
        contact_id: int,
        window_size: int = 15,
        dt: float = 0.001,
        nominal_fn: float = 5.0,
    ):
        self.contact_id = contact_id
        self.window_size = window_size
        self.dt = dt
        self.nominal_fn = nominal_fn

        self.fn_hist = []
        self.ft_hist = []
        self.disp_hist = []
        self.vel_hist = []

    def reset(self, nominal_fn: float = 5.0):
        self.nominal_fn = float(nominal_fn)
        self.fn_hist.clear()
        self.ft_hist.clear()
        self.disp_hist.clear()
        self.vel_hist.clear()

    def update(self, obs_contact: Dict[str, Any]) -> Dict[str, float]:
        """
        Processes one millisecond observation for this contact:
        Returns:
            - force_ratio: |Ft| / Fn
            - margin_hat: stability margin in [0, 1]
            - slip_prob: probability of gross slip in [0, 1]
            - uncertainty_var: epistemic uncertainty variance in [0.01, 0.50]
            - is_active: contact validity boolean
        """
        is_active = bool(obs_contact.get("is_active", True))
        if not is_active:
            return {
                "force_ratio": 0.0,
                "margin_hat": 0.0,
                "slip_prob": 1.0,
                "uncertainty_var": 0.50,
                "is_active": False,
            }

        fn = float(obs_contact["force_n"])
        ft = float(obs_contact["force_t"])
        disp = float(obs_contact["disp"])
        v_slip = float(obs_contact.get("slip_velocity", 0.0))

        self.fn_hist.append(fn)
        self.ft_hist.append(ft)
        self.disp_hist.append(disp)
        self.vel_hist.append(v_slip)

        if len(self.fn_hist) > self.window_size:
            self.fn_hist.pop(0)
            self.ft_hist.pop(0)
            self.disp_hist.pop(0)
            self.vel_hist.pop(0)

        mean_fn = max(0.5, float(np.mean(self.fn_hist)))
        mean_ft = abs(float(np.mean(self.ft_hist)))
        ratio = mean_ft / mean_fn

        # Tangential stiffness proxy
        if len(self.disp_hist) >= 5:
            d_ft = abs(self.ft_hist[-1] - self.ft_hist[0])
            d_disp = max(1e-7, abs(self.disp_hist[-1] - self.disp_hist[0]))
            kt_est = d_ft / d_disp
        else:
            kt_est = 6000.0

        # Physical margin estimation: m_hat = 1 - (R / mu_app)
        margin_base = max(0.0, 1.0 - (ratio / 0.40))
        if abs(v_slip) > 1e-4:
            margin_base = max(0.0, margin_base - 0.50)

        # Epistemic uncertainty variance
        ratio_var = float(np.var([abs(t) / max(0.5, n) for t, n in zip(self.ft_hist, self.fn_hist)])) if len(self.fn_hist) >= 5 else 0.005
        unc_var = float(np.clip(ratio_var * 5.0 + (0.10 if mean_fn < 4.0 else 0.02), 0.01, 0.50))

        # Slip risk probability
        p_slip = float(np.clip((1.0 - margin_base) ** 2 + (0.50 if abs(v_slip) > 1e-4 else 0.0), 0.0, 1.0))

        return {
            "force_ratio": ratio,
            "margin_hat": float(np.clip(margin_base, 0.0, 1.0)),
            "slip_prob": p_slip,
            "uncertainty_var": unc_var,
            "kt_proxy": kt_est,
            "is_active": True,
        }
