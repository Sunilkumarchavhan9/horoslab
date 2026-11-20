"""
HOROS Contact Physics v2: LuGre Dynamic Friction Module
Implements the LuGre dynamic bristle friction model with unconditional exponential
time-integration, Stribeck velocity softening, frictional memory, damping,
and a composable non-double-counting interface.
"""

import math
from typing import Tuple, Dict, Any, Optional

from .material import FrictionPair, LuGreParameters
from .contact_state import ContactState, ContactModelMode


class LuGreModel:
    """
    Independently selectable LuGre dynamic friction model.
    Models average microscopic asperity bristle deflection z(t),
    rate-dependent friction memory, micro-damping, and Stribeck velocity effects.
    """

    def __init__(self, pair: FrictionPair, params: LuGreParameters = None):
        self.pair = pair
        self.params = params or pair.lugre_params
        if self.params is None:
            raise ValueError("LuGreModel requires valid LuGreParameters either explicitly or on FrictionPair")

    def compute_stribeck(self, v: float, Fn: float) -> float:
        """
        Calculates velocity-dependent friction threshold g(v):
        g(v) = F_C + (F_S - F_C) * exp( - (|v| / v_s)^alpha )
        where F_C = mu_k * Fn, F_S = mu_s * Fn.
        """
        if Fn <= 0.0:
            return 0.0

        F_C = self.pair.mu_kinetic * Fn
        F_S = self.pair.mu_static * Fn
        v_abs = abs(v)

        decay = math.exp(- (v_abs / self.params.stribeck_velocity) ** self.params.stribeck_exponent)
        return F_C + (F_S - F_C) * decay

    def integrate_bristle(self, z_prev: float, v: float, Fn: float, dt: float) -> Tuple[float, float]:
        """
        Unconditionally stable exponential time integration of bristle state equation:
        dz/dt = v - (sigma_0 * |v| / g(v)) * z
        Returns: (z_next [m], dz_dt [m/s])
        """
        if Fn <= 0.0 or dt <= 0.0:
            return 0.0, 0.0

        g_v = self.compute_stribeck(v, Fn)
        if g_v <= 0.0:
            return 0.0, 0.0

        v_abs = abs(v)
        if v_abs < 1e-12:
            # Zero velocity: bristle holds constant deflection
            return z_prev, 0.0

        # Rate constant lambda = sigma_0 * |v| / g(v)
        lam = (self.params.sigma_0 * v_abs) / g_v
        z_steady = math.copysign(g_v / self.params.sigma_0, v)

        # Analytical solution over timestep dt:
        # z(t+dt) = z_steady + (z_prev - z_steady) * exp(-lam * dt)
        exp_factor = math.exp(- min(100.0, lam * dt))
        z_next = z_steady + (z_prev - z_steady) * exp_factor

        # Bristle velocity dz/dt
        dz_dt = (z_next - z_prev) / dt

        return z_next, dz_dt

    def compute_friction_force(self, z: float, dz_dt: float, v: float) -> float:
        """
        Computes total LuGre tangential friction force:
        Ft = sigma_0 * z + sigma_1 * dz_dt + sigma_2 * v
        """
        Ft = (self.params.sigma_0 * z) + (self.params.sigma_1 * dz_dt) + (self.params.sigma_2 * v)
        return Ft

    def step(self, state: ContactState, v_cmd: float, dt: float) -> None:
        """
        Advances standalone LuGre dynamic friction model.
        Updates state.tangential_force, state.bristle_deflection, state.bristle_velocity,
        and energy dissipation.
        """
        if not state.in_contact or state.normal_force <= 0.0:
            state.bristle_deflection = 0.0
            state.bristle_velocity = 0.0
            state.tangential_force = 0.0
            state.slip_velocity = 0.0
            state.is_gross_slipping = False
            return

        Fn = state.normal_force
        z_prev = state.bristle_deflection

        z_next, dz_dt = self.integrate_bristle(z_prev, v_cmd, Fn, dt)
        Ft = self.compute_friction_force(z_next, dz_dt, v_cmd)

        # Check slip threshold based on steady bristle limit
        g_v = self.compute_stribeck(v_cmd, Fn)
        z_max = g_v / self.params.sigma_0
        is_sliding = abs(z_next) >= 0.98 * z_max and abs(v_cmd) > 1e-4

        state.bristle_deflection = z_next
        state.bristle_velocity = dz_dt
        state.tangential_force = Ft
        state.is_gross_slipping = is_sliding
        state.slip_velocity = v_cmd if is_sliding else dz_dt

        # Work and energy dissipation (SIGNED physical residuals without max(0.0, ...) masking)
        dW = Ft * (v_cmd * dt)
        new_elastic = 0.5 * self.params.sigma_0 * (z_next ** 2)
        d_elastic = new_elastic - state.stored_elastic_energy
        d_diss = dW - d_elastic

        state.stored_elastic_energy = new_elastic
        state.signed_step_dissipation = d_diss
        state.cumulative_dissipated_energy += d_diss
        state.instantaneous_dissipation_rate = d_diss / dt

    def step_composed_hybrid(self, state: ContactState, Ft_cm_elastic: float, v_cmd: float,
                            stick_ratio: float, dt: float, geometry: Optional[Any] = None) -> float:
        """
        Continuum Traction Composition Strategy for Contact Physics v2.1.1 (CP2-01.1 Remediated):
        Combines Cattaneo-Mindlin continuum partial-slip elasticity with LuGre dynamic dissipation
        WITHOUT DOUBLE-COUNTING STIFFNESS, WITH ZERO FORCE JUMP, AND WITH EXACT CONTINUUM TRACTION PARTITION:

        1. Annular Slip Normal Load Fraction:
           Computed via geometry-specific dispatch (Hertzian sphere, sharp flat punch, rounded punch,
           or truncated dome):
           - Hertzian sphere: Phi_slip = [ max(0.0, 1.0 - (c/a)^2) ]^(3/2)
           - Sharp flat punch: Phi_slip = 0 (c/a > 0), 1 (c/a == 0) (binary slip)
           - Rounded flat punch: Ciavarella (1998) / Truman asymptotic rounded edge slip

        2. Exact Continuum Tangential Traction Partition (CP2-01.1):
           Rather than an ad-hoc convex blend (1 - Phi)*Ft_cm + Phi*Ft_lugre which distorts the
           partial slip force by up to 12.5% at c/a = 1/sqrt(2), the continuum composition integrates:
           Ft_core_cm = Ft_cm_elastic - sgn * mu_s * Fn * Phi_slip
           Ft_annulus_lugre = Phi_slip * Ft_lugre
           Ft_hybrid = Ft_core_cm + Ft_annulus_lugre
                     = Ft_cm_elastic + Phi_slip * (Ft_lugre - sgn * mu_s * Fn)

        3. In the limits:
           - As v -> 0: Ft_lugre -> sgn * mu_s * Fn -> Ft_hybrid = Ft_cm_elastic IDENTICALLY for all c/a.
           - As c/a -> 1 (pure stick): Phi_slip = 0 -> Ft = Ft_cm_elastic (pure Cattaneo-Mindlin).
           - As c/a -> 0 (gross slide): Phi_slip = 1 -> Ft = Ft_lugre (pure standard LuGre).
           - Boundary derivative dPhi_slip/d(c/a) = 0 guarantees C1 smoothness.
        """
        Fn = state.normal_force
        if Fn <= 0.0:
            return 0.0

        c_over_a = max(0.0, min(1.0, stick_ratio))

        # 1. Geometry-specific continuum normal load fraction:
        if geometry is not None and hasattr(geometry, 'annular_slip_load_fraction'):
            phi_slip = geometry.annular_slip_load_fraction(c_over_a)
        else:
            phi_slip = (1.0 - c_over_a ** 2) ** 1.5 if c_over_a < 1.0 else 0.0

        # Direction sign for the static Coulomb capacity on the slipping annulus:
        if abs(Ft_cm_elastic) > 1e-12:
            sgn = 1.0 if Ft_cm_elastic > 0.0 else -1.0
        elif abs(v_cmd) > 1e-12:
            sgn = 1.0 if v_cmd > 0.0 else -1.0
        else:
            sgn = 1.0
        coulomb_limit = sgn * self.pair.mu_static * Fn

        # Synchronize annular bristle state with physical asperity slip strain if uninitialized:
        # Asperities on the slipping annulus are strained to the static Coulomb threshold
        if abs(state.bristle_deflection) < 1e-12 and c_over_a < 1.0:
            state.bristle_deflection = coulomb_limit / self.params.sigma_0

        # Advance internal bristle state driven by local micro-slip / sliding velocity
        v_eff = v_cmd * (1.0 - c_over_a) if c_over_a > 0.0 else v_cmd
        z_next, dz_dt = self.integrate_bristle(state.bristle_deflection, v_eff, Fn, dt)
        state.bristle_deflection = z_next
        state.bristle_velocity = dz_dt

        # Standard canonical LuGre dynamic friction force
        Ft_lugre = self.compute_friction_force(z_next, dz_dt, v_cmd)

        if c_over_a > 0.0:
            # Exact continuum traction partition (CP2-01.1):
            total_Ft = Ft_cm_elastic + phi_slip * (Ft_lugre - coulomb_limit)
            state.is_gross_slipping = False
            return total_Ft
        else:
            state.is_gross_slipping = True
            return Ft_lugre
