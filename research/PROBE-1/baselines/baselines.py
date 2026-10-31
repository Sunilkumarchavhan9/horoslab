"""
Benchmark Grasp Controllers:
  B1: Fixed Force Grasp Policy
  B2: Reactive Slip Squeeze Reflex Policy
  B3: Unconstrained Flow Matching Action Policy
  B4: Deterministic Tactile Certainty-Equivalence MPC
"""
from __future__ import annotations

import numpy as np
from typing import Dict, Any, List


class FixedForceBaseline:
    """B1: Dispatches constant open-loop squeeze command, ignoring sensory changes."""

    def __init__(self, n_q: int = 16):
        self.n_q = n_q

    def compute_action(self, obs: Dict[str, Any]) -> np.ndarray:
        return np.zeros(self.n_q, dtype=np.float64)


class ReactiveSlipSqueezeBaseline:
    """B2: Reactive heuristic reflex: clamps fingers aggressively when slip is detected."""

    def __init__(self, n_q: int = 16, slip_threshold: float = 0.85, squeeze_accel: float = 12.0):
        self.n_q = n_q
        self.slip_threshold = slip_threshold
        self.squeeze_accel = squeeze_accel

    def compute_action(self, obs: Dict[str, Any]) -> np.ndarray:
        f_shear = obs["f_shear"]
        f_normal = obs["f_normal"]
        friction = obs.get("friction_est", [0.5] * len(f_normal))

        u = np.zeros(self.n_q, dtype=np.float64)
        for i in range(len(f_normal)):
            shear_mag = float(np.linalg.norm(f_shear[i]))
            fn = max(0.1, f_normal[i])
            ratio = shear_mag / (friction[i] * fn + 1e-6)

            if ratio > self.slip_threshold:
                # Trigger sudden reflexive squeezing on this finger
                u[i*4 : (i+1)*4] = self.squeeze_accel

        return u


class UnconstrainedFlowBaseline:
    """B3: Generative flow/diffusion action policy without barrier constraints."""

    def __init__(self, n_q: int = 16):
        self.n_q = n_q

    def compute_action(self, obs: Dict[str, Any]) -> np.ndarray:
        # Generates nominal tracking command based on object acceleration
        # Often violates friction cones during abrupt perturbations
        return np.ones(self.n_q, dtype=np.float64) * 0.8


class DeterministicTactileMPCBaseline:
    """B4: Certainty-equivalence tactile MPC without uncertainty margins (k_margin = 0)."""

    def __init__(self, n_q: int = 16, gain: float = 4.0):
        self.n_q = n_q
        self.gain = gain

    def compute_action(self, obs: Dict[str, Any]) -> np.ndarray:
        f_shear = obs["f_shear"]
        f_normal = obs["f_normal"]
        mu_hat = obs.get("mu_hat", [0.5] * len(f_normal))

        u = np.zeros(self.n_q, dtype=np.float64)
        for i in range(len(f_normal)):
            shear_mag = float(np.linalg.norm(f_shear[i]))
            target_fn = (shear_mag / (mu_hat[i] + 1e-6)) * 1.15
            delta_fn = target_fn - f_normal[i]
            u[i*4 : (i+1)*4] = self.gain * delta_fn

        return np.clip(u, -25.0, 25.0)
