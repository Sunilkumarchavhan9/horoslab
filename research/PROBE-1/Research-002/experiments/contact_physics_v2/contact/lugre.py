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
        Incorporates CP2-04 stick-to-slip relaxation under normal load reduction
        and CP2-05 constitutive bristle velocity to prevent micro-damping instability.
        Returns: (z_next [m], dz_dt [m/s])
        """
        if Fn <= 0.0 or dt <= 0.0:
            return 0.0, 0.0

        g_v = self.compute_stribeck(v, Fn)
        if g_v <= 0.0:
            return 0.0, 0.0

        # CP2-04 Physical Stick-to-Slip Relaxation under Normal Load Reduction:
        # Asperities cannot sustain shear strain exceeding the instantaneous static Coulomb threshold.
        # When normal force drops, excess strain relaxes physically via micro-slip.
        z_static_cap = (self.pair.mu_static * Fn) / self.params.sigma_0
        if abs(z_prev) > z_static_cap:
            z_prev = math.copysign(z_static_cap, z_prev)

        v_abs = abs(v)
        if v_abs < 1e-12:
            # Zero velocity: bristle holds relaxed deflection with zero velocity
            return z_prev, 0.0

        # Rate constant lambda = sigma_0 * |v| / g(v)
        lam = (self.params.sigma_0 * v_abs) / g_v
        z_steady = math.copysign(g_v / self.params.sigma_0, v)

        # Analytical solution over timestep dt:
        # z(t+dt) = z_steady + (z_prev - z_steady) * exp(-lam * dt)
        exp_factor = math.exp(- min(100.0, lam * dt))
        z_next = z_steady + (z_prev - z_steady) * exp_factor

        # CP2-05 Constitutive Sliding Bristle Velocity for Micro-Damping:
        # Evaluated from constitutive rate dz/dt = v - (sigma_0 * |v| / g(v)) * z_next.
        # Under arbitrary velocity reversals, for any state within the admissible static Coulomb
        # invariant set |z| <= mu_s * Fn / sigma_0, the constitutive rate satisfies:
        # |dz/dt| <= (1 + mu_s / mu_k) * |v|.
        # We enforce this invariant rate bound to prevent micro-damping force explosion.
        dz_dt_constitutive = v - (self.params.sigma_0 * v_abs / max(1e-9, g_v)) * z_next
        max_rate = (1.0 + (self.pair.mu_static / max(1e-6, self.pair.mu_kinetic))) * v_abs
        dz_dt = max(-max_rate, min(max_rate, dz_dt_constitutive))

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
            # Physical lift-off policy:
            # Any remaining stored elastic energy dissipates to heat upon separation
            if state.stored_elastic_energy > 0.0:
                state.cumulative_dissipated_energy += state.stored_elastic_energy
                state.signed_step_dissipation = state.stored_elastic_energy
            else:
                state.signed_step_dissipation = 0.0

            state.stored_elastic_energy = 0.0
            state.bristle_deflection = 0.0
            state.bristle_velocity = 0.0
            state.tangential_force = 0.0
            state.slip_velocity = 0.0
            state.is_gross_slipping = False
            state.independent_step_dissipation = 0.0
            return

        Fn = state.normal_force
        z_prev = state.bristle_deflection

        # CP2-04 Stick-to-Slip Relaxation under normal load reduction
        z_static_cap = (self.pair.mu_static * Fn) / self.params.sigma_0
        if abs(z_prev) > z_static_cap:
            z_prev = math.copysign(z_static_cap, z_prev)

        z_next, dz_dt = self.integrate_bristle(z_prev, v_cmd, Fn, dt)
        Ft = self.compute_friction_force(z_next, dz_dt, v_cmd)

        # Check slip threshold based on steady bristle limit
        g_v = self.compute_stribeck(v_cmd, Fn)
        z_max = g_v / self.params.sigma_0
        is_sliding = abs(z_next) >= 0.98 * z_max and abs(v_cmd) > 1e-4

        state.bristle_deflection = z_next
        state.bristle_velocity = dz_dt
        prev_Ft = state.tangential_force
        state.tangential_force = Ft
        state.is_gross_slipping = is_sliding
        state.slip_velocity = v_cmd if is_sliding else dz_dt

        # Work and energy dissipation: Trapezoidal work integration
        dW = 0.5 * (prev_Ft + Ft) * (v_cmd * dt)

        new_elastic = 0.5 * self.params.sigma_0 * (z_next ** 2)
        d_elastic = new_elastic - state.stored_elastic_energy

        # Exact First-Law Energy Balance (Eliminating double-counting):
        # Every Joule of mechanical work that does not increase stored elastic energy
        # is dissipated. Under normal load drop at v = 0 (dW = 0), d_elastic is negative,
        # so d_diss = -d_elastic > 0 directly reflects relaxation dissipation with ZERO double-counting.
        d_diss = dW - d_elastic

        state.stored_elastic_energy = new_elastic
        state.signed_step_dissipation = d_diss
        state.cumulative_dissipated_energy += d_diss
        state.instantaneous_dissipation_rate = d_diss / dt

        # Independent constitutive dissipation rate (raw signed, unmasked):
        gv = self.compute_stribeck(v_cmd, Fn)
        v_cmd_abs = abs(v_cmd)
        if gv > 0.0 and v_cmd_abs > 1e-12:
            P_diss_indep = (
                ((self.params.sigma_0**2 * v_cmd_abs / gv) * (z_next**2)) +
                (self.params.sigma_1 * dz_dt * v_cmd) +
                (self.params.sigma_2 * (v_cmd**2))
            )
            state.independent_step_dissipation = P_diss_indep * dt
        else:
            state.independent_step_dissipation = 0.0

    def step_composed_hybrid(self, state: ContactState, Ft_cm_elastic: float, v_cmd: float,
                            stick_ratio: float, dt: float, geometry: Optional[Any] = None) -> float:
        """
        Continuum Traction Composition Strategy for Contact Physics v2.1.3.2 (CP2-01 / CP2-03 Remediated):
        Combines Cattaneo-Mindlin continuum partial-slip elasticity with LuGre dynamic dissipation
        WITHOUT DOUBLE-COUNTING STIFFNESS, WITH ZERO FORCE JUMP, AND WITH EXACT CONTINUUM TRACTION PARTITION:

        1. Annular Slip Normal Load Fraction:
           Computed via geometry-specific dispatch (Hertzian sphere, sharp flat punch, rounded punch,
           or truncated dome):
           - Hertzian sphere: Phi_slip = [ max(0.0, 1.0 - (c/a)^2) ]^(3/2)
           - Sharp flat punch: Phi_slip = 0 (c/a > 0), 1 (c/a == 0) (binary slip)
           - Rounded flat punch: Ciavarella (1998) / Truman asymptotic rounded edge slip

        2. Exact Continuum Tangential Traction Partition (CP2-01.1):
           Ft_core_cm = Ft_cm_elastic - sgn * mu_s * Fn * Phi_slip
           Ft_annulus_lugre = Phi_slip * Ft_lugre
           Ft_hybrid = Ft_core_cm + Ft_annulus_lugre
                     = Ft_cm_elastic + Phi_slip * (Ft_lugre - sgn * mu_s * Fn)

        3. Complete Hybrid Energy Balance (CP2-03 / CP2-04 / CP2-05 Remediated):
           - Reconciled kinematics: Annular bristles are driven by relative slip velocity
             v_eff = v_cmd * (1 - c/a), unifying state dynamics, micro-viscous force, and dissipation.
           - Exact First-Law energy conservation: d_diss = dW - d_elastic without double-counting.
           - State tracking: Updates state.stick_ratio and state.stick_radius at every step.
           - Independent constitutive dissipation tracking and thermodynamic lift-off dissipation.
        """
        Fn = state.normal_force
        if Fn <= 0.0 or not state.in_contact:
            # Physical lift-off policy:
            # Any remaining stored elastic energy dissipates to heat upon separation
            if state.stored_elastic_energy > 0.0:
                state.cumulative_dissipated_energy += state.stored_elastic_energy
                state.signed_step_dissipation = state.stored_elastic_energy
            else:
                state.signed_step_dissipation = 0.0

            state.stored_elastic_energy = 0.0
            state.bristle_deflection = 0.0
            state.bristle_velocity = 0.0
            state.tangential_force = 0.0
            state.stick_ratio = 1.0
            state.stick_radius = 0.0
            state.is_gross_slipping = False
            state.independent_step_dissipation = 0.0
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
        if abs(state.bristle_deflection) < 1e-12 and c_over_a < 1.0:
            state.bristle_deflection = coulomb_limit / self.params.sigma_0

        # CP2-04 Stick-to-Slip Relaxation under normal load reduction
        z_static_cap = (self.pair.mu_static * Fn) / self.params.sigma_0
        z_prev = state.bristle_deflection
        if abs(z_prev) > z_static_cap:
            z_prev = math.copysign(z_static_cap, z_prev)

        # CP2-03 Reconciled Annular Kinematics:
        # Annular bristles slip at effective relative velocity v_eff = v_cmd * (1 - c/a)
        v_eff = v_cmd * (1.0 - c_over_a) if c_over_a > 0.0 else v_cmd
        z_next, dz_dt = self.integrate_bristle(z_prev, v_eff, Fn, dt)
        state.bristle_deflection = z_next
        state.bristle_velocity = dz_dt

        # Standard canonical LuGre dynamic friction force driven by annular velocity v_eff
        Ft_lugre = self.compute_friction_force(z_next, dz_dt, v_eff)

        prev_Ft = state.tangential_force
        if c_over_a > 0.0:
            # Exact continuum traction partition (CP2-01.1):
            total_Ft = Ft_cm_elastic + phi_slip * (Ft_lugre - coulomb_limit)
            state.is_gross_slipping = False
        else:
            total_Ft = Ft_lugre
            state.is_gross_slipping = True

        state.tangential_force = total_Ft

        # Work and energy dissipation: Trapezoidal work integration
        dW = 0.5 * (prev_Ft + total_Ft) * (v_cmd * dt)

        # Composite stored elastic energy (Exact Clapeyron Sticking Core + Annular Asperity Bristles)
        # Sticking core carries net force Ft_core under uniform core displacement delta_t
        a = state.contact_radius
        kt_0 = 8.0 * self.pair.equivalent_shear_modulus * a if a > 0.0 else 1.0
        Ft_core = Ft_cm_elastic - coulomb_limit * phi_slip
        if geometry is not None and hasattr(geometry, 'has_annular_partial_slip') and not geometry.has_annular_partial_slip():
            delta_t_mag = abs(Ft_cm_elastic) / kt_0 if kt_0 > 0.0 else 0.0
        else:
            delta_t_mag = (1.5 * abs(coulomb_limit) / kt_0) * max(0.0, 1.0 - c_over_a**2) if kt_0 > 0.0 else 0.0
        E_core = 0.5 * abs(Ft_core) * delta_t_mag
        E_ann = 0.5 * self.params.sigma_0 * (z_next ** 2)
        new_elastic = E_core + phi_slip * E_ann

        # Exact First-Law Energy Dissipation (eliminates double-counting):
        # d_diss = dW - d_elastic
        # Every Joule of mechanical work not stored as elastic potential is dissipated.
        # This holds identically across expanding/contracting boundaries and load changes.
        d_elastic = new_elastic - state.stored_elastic_energy
        d_diss = dW - d_elastic

        state.stored_elastic_energy = new_elastic
        state.signed_step_dissipation = d_diss
        state.cumulative_dissipated_energy += d_diss
        state.instantaneous_dissipation_rate = d_diss / dt

        # Independent constitutive dissipation rate (raw signed, unmasked):
        # Direct evaluation of LuGre dissipation function on the slipping annulus
        gv = self.compute_stribeck(v_eff, Fn)
        v_eff_abs = abs(v_eff)
        if gv > 0.0 and v_eff_abs > 1e-12:
            P_ann_indep = (
                ((self.params.sigma_0**2 * v_eff_abs / gv) * (z_next**2)) +
                (self.params.sigma_1 * dz_dt * v_eff) +
                (self.params.sigma_2 * (v_eff**2))
            )
            state.independent_step_dissipation = phi_slip * P_ann_indep * dt
        else:
            state.independent_step_dissipation = 0.0

        # Update stick-zone state tracking so previous boundary states are NEVER stale
        state.stick_ratio = c_over_a
        state.stick_radius = c_over_a * state.contact_radius

        return total_Ft
