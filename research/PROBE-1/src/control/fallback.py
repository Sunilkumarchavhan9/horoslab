"""
Passive Joint Damping and Impedance Fallback Controller.
"""
from __future__ import annotations

import time
import numpy as np
from typing import Tuple, Dict


class PassiveImpedanceFallback:
    """
    Sub-millisecond passive damping fallback executed when safety filter fails or times out:
    u_{safe} = -K_d * dot{q}
    Guarantees strict passivity: dot{E} = -dot{q}^T K_d dot{q} <= 0.
    Evaluated against dual criteria:
      1. Robot safety (torque limits, smooth deceleration)
      2. Object retention / controlled kinetic energy dissipation
    """

    def __init__(self, n_q: int = 16, k_d: float = 15.0, u_limit: float = 40.0):
        self.n_q = n_q
        self.K_d = float(k_d) * np.eye(n_q, dtype=np.float64)
        self.u_limit = float(u_limit)

    def execute_fallback(self, dq: np.ndarray) -> Tuple[np.ndarray, Dict[str, float]]:
        """
        Computes safe damping command within microsecond budget.
        """
        t0 = time.perf_counter_ns()

        # Pure dissipative acceleration
        u_safe = -self.K_d @ dq
        # Clamp to hardware acceleration bounds to preserve actuators
        u_safe = np.clip(u_safe, -self.u_limit, self.u_limit)

        t1 = time.perf_counter_ns()
        latency_us = (t1 - t0) / 1000.0

        # Energy dissipation rate: dot{E} = dot{q}^T u_safe <= 0
        dissipation_rate = float(np.dot(dq, u_safe))

        stats = {
            "latency_us": latency_us,
            "dissipation_rate": dissipation_rate,
            "max_abs_accel": float(np.max(np.abs(u_safe))),
        }
        return u_safe, stats

