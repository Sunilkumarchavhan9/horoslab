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

    def compute_passive_velocity_limit(self, Fn: float) -> float:
        """
        Calculates the maximum relative sliding velocity guaranteeing unconditional
        constitutive passivity (Delta_z <= 0) for all deflection states z in R:
        v_passive(Fn) = 4 * (sigma_1 + sigma_2) * mu_k * Fn / sigma_1^2
        """
        if Fn <= 0.0:
            return 0.0
        return (4.0 * (self.params.sigma_1 + self.params.sigma_2) * self.pair.mu_kinetic * Fn) / (self.params.sigma_1 ** 2)

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
            state.annular_step_dissipation = 0.0
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
            state.annular_step_dissipation = P_diss_indep * dt
            state.independent_step_dissipation = P_diss_indep * dt
        else:
            state.annular_step_dissipation = 0.0
            state.independent_step_dissipation = 0.0

    def step_composed_hybrid(self, state: ContactState, Ft_cm_elastic: float, v_cmd: float,
                            stick_ratio: float, dt: float, geometry: Optional[Any] = None,
                            enforce_passivity_envelope: bool = True,
                            cm_state: Optional[ContactState] = None,
                            require_valid_domain: bool = False) -> float:
        """
        Continuum Traction Composition Strategy for Contact Physics v2.1.3.5:
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
           - Independent core storage rate (dot_V_core) and moving-boundary energy flux (dot_E_boundary).
           - Independent constitutive dissipation tracking and thermodynamic lift-off dissipation.
           - Runtime passivity envelope enforcement: bounds commanded velocity to v_passive(Fn).

        ACTUATOR AND SIMULATOR INTEGRATION NOTICE (v2.1.3.7):
        This method returns only total_Ft. For physical actuator, robot, and simulator execution,
        callers MUST use step_composed_hybrid_with_velocity() to obtain the passivity-bounded
        applied velocity Tuple[float, float] = (total_Ft, v_applied).
        Propagating v_applied ensures the physical hardware tracks the passivity-certified trajectory.
        """
        if cm_state is not None:
            state.sync_reversal_history_from(cm_state)

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
            state.core_stored_energy = 0.0
            state.annular_stored_energy = 0.0
            state.core_storage_rate = 0.0
            state.annular_storage_rate = 0.0
            state.annular_boundary_flux = 0.0
            state.analytical_core_boundary_flux = 0.0
            state.kinematic_transport_flux = 0.0
            state.boundary_energy_flux = 0.0
            state.reversible_boundary_transfer = 0.0
            state.applied_slip_velocity = 0.0
            state.is_velocity_clamped = False
            state.passive_velocity_limit = 0.0
            state.bristle_deflection = 0.0
            state.bristle_velocity = 0.0
            state.tangential_force = 0.0
            state.stick_ratio = 1.0
            state.stick_radius = 0.0
            state.is_gross_slipping = False
            state.annular_step_dissipation = 0.0
            state.independent_step_dissipation = 0.0
            return 0.0

        # CP2-03.5 Runtime Passivity Envelope Enforcement:
        # Enforce the normal-force-dependent velocity limit v_passive,max(Fn)
        v_passive_limit = self.compute_passive_velocity_limit(Fn)
        if enforce_passivity_envelope and v_passive_limit > 0.0 and abs(v_cmd) > v_passive_limit:
            v_applied = math.copysign(v_passive_limit, v_cmd)
            is_clamped = True
        else:
            v_applied = v_cmd
            is_clamped = False

        state.applied_slip_velocity = v_applied
        state.is_velocity_clamped = is_clamped
        state.passive_velocity_limit = v_passive_limit

        c_over_a = max(0.0, min(1.0, stick_ratio))

        # 1. Geometry-specific continuum normal load fraction:
        if geometry is not None and hasattr(geometry, 'annular_slip_load_fraction'):
            phi_slip = geometry.annular_slip_load_fraction(c_over_a)
        else:
            phi_slip = (1.0 - c_over_a ** 2) ** 1.5 if c_over_a < 1.0 else 0.0

        # Direction sign for the static Coulomb capacity on the slipping annulus:
        if abs(Ft_cm_elastic) > 1e-12:
            sgn = 1.0 if Ft_cm_elastic > 0.0 else -1.0
        elif abs(v_applied) > 1e-12:
            sgn = 1.0 if v_applied > 0.0 else -1.0
        else:
            sgn = 1.0
        coulomb_limit = sgn * self.pair.mu_static * Fn

        # In static equilibrium at zero velocity (v_applied == 0), if bristle state is uninitialized,
        # synchronize bristle deflection with the static Coulomb capacity so that
        # Ft_hybrid identically equals Ft_cm without artificial force discrepancy:
        if abs(state.bristle_deflection) < 1e-12 and c_over_a < 1.0 and abs(v_applied) < 1e-12:
            state.bristle_deflection = coulomb_limit / self.params.sigma_0

        # CP2-04 Stick-to-Slip Relaxation under normal load reduction
        z_static_cap = (self.pair.mu_static * Fn) / self.params.sigma_0
        z_prev = state.bristle_deflection
        if abs(z_prev) > z_static_cap:
            z_prev = math.copysign(z_static_cap, z_prev)

        # CP2-03 Reconciled Annular Kinematics:
        # Annular bristles slip at effective relative velocity v_eff = v_applied * (1 - c/a)
        v_eff = v_applied * (1.0 - c_over_a) if c_over_a > 0.0 else v_applied
        z_next, dz_dt = self.integrate_bristle(z_prev, v_eff, Fn, dt)
        state.bristle_deflection = z_next
        state.bristle_velocity = dz_dt

        # Standard canonical LuGre dynamic friction force driven by annular velocity v_eff
        Ft_lugre = self.compute_friction_force(z_next, dz_dt, v_eff)

        prev_Ft = state.tangential_force
        is_gross = (c_over_a <= 0.0) or state.is_gross_slipping or (cm_state is not None and cm_state.is_gross_slipping)
        if not is_gross and c_over_a > 0.0:
            # Exact continuum traction partition (CP2-01.1):
            total_Ft = Ft_cm_elastic + phi_slip * (Ft_lugre - coulomb_limit)
            state.is_gross_slipping = False
        else:
            total_Ft = Ft_lugre
            state.is_gross_slipping = True
            c_over_a = 0.0
            phi_slip = 1.0

        state.tangential_force = total_Ft

        # Work and energy dissipation: Trapezoidal work integration strictly using v_applied
        dW = 0.5 * (prev_Ft + total_Ft) * (v_applied * dt)

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
        state.instantaneous_dissipation_rate = d_diss / dt if dt > 0.0 else 0.0

        # Independent calculation of core storage rate and moving-boundary energy flux:
        dt_safe = max(1e-12, dt)
        prev_E_core = state.core_stored_energy
        prev_phi_slip = (1.0 - state.stick_ratio ** 2) ** 1.5 if state.stick_ratio < 1.0 else 0.0
        if geometry is not None and hasattr(geometry, 'annular_slip_load_fraction'):
            prev_phi_slip = geometry.annular_slip_load_fraction(state.stick_ratio)
        prev_E_ann = 0.5 * self.params.sigma_0 * (z_prev ** 2)

        dot_phi_slip = (phi_slip - prev_phi_slip) / dt_safe

        # CP2-03.8 Geometry & History Domain Restriction:
        # The analytical formula is strictly exact for Hertzian spherical contact under Cattaneo-Mindlin traction.
        # For non-Hertzian geometries (rounded punches with Ciavarella edge fields, truncated flat plateaus),
        # or during Mindlin-Deresiewicz load reversal, the kernel explicitly tracks domain validity.
        sgn_core = 1.0 if Ft_core > 0.0 else (-1.0 if Ft_core < 0.0 else sgn)

        if geometry is not None and hasattr(geometry, "corner_radius") and geometry.corner_radius == 0.0 and not geometry.has_annular_partial_slip():
            # Sharp flat punch
            if c_over_a > 0.0 and not state.is_gross_slipping:
                # Complete sticking (c = a): no moving boundary exists (dot_c == 0). Boundary flux is identically zero.
                dot_E_boundary_core = 0.0
                state.boundary_flux_domain_valid = True
                state.boundary_flux_domain_reason = "Sharp flat punch: complete sticking, zero boundary flux"
            else:
                # Sharp flat punch instantaneous gross-slip transition cannot be modeled by quasi-static boundary flux
                dot_E_boundary_core = float('nan')
                state.boundary_flux_domain_valid = False
                state.boundary_flux_domain_reason = "Sharp flat punch gross slip: instantaneous boundary collapse outside quasi-static domain"
                if require_valid_domain:
                    raise ValueError(f"Analytical boundary flux invalid during sharp flat punch gross slip: {state.boundary_flux_domain_reason}")
        elif geometry is not None and (
            (hasattr(geometry, "corner_radius") and geometry.corner_radius > 0.0) or
            (hasattr(geometry, "flat_radius") and getattr(geometry, "flat_radius", 0.0) > 0.0)
        ):
            # Non-Hertzian geometry (rounded punch fillet or truncated dome with central flat plateau)
            # Analytical formula is outside the proven Hertzian parabolic pressure domain. Fail-closed:
            dot_E_boundary_core = float('nan')
            state.boundary_flux_domain_valid = False
            geom_desc = "Rounded flat punch" if hasattr(geometry, "corner_radius") else "Truncated dome flat plateau"
            state.boundary_flux_domain_reason = f"Non-Hertzian geometry ({geom_desc}): analytical formula is approximate outside spherical domain"
            if require_valid_domain:
                raise ValueError(f"Analytical boundary flux invalid for non-Hertzian geometry: {state.boundary_flux_domain_reason}")
        else:
            # Hertzian spherical contact
            if c_over_a <= 0.0 or state.is_gross_slipping:
                # Hertzian spherical gross slip: sticking core collapsed (c=0), boundary flux unsupported in full sliding
                dot_E_boundary_core = float('nan')
                state.boundary_flux_domain_valid = False
                state.boundary_flux_domain_reason = "Hertzian spherical gross slip: sticking core collapsed (c=0), boundary flux unsupported in full sliding"
                if require_valid_domain:
                    raise ValueError(f"Analytical boundary flux invalid during spherical gross slip: {state.boundary_flux_domain_reason}")
            elif state.total_reversals > 0:
                # Mindlin-Deresiewicz reversal regime: displacement measured relative to reversal point
                disp_from_rev = abs(state.tangential_displacement - state.reversal_tangential_disp)
                v_dir = 1.0 if v_applied > 0 else (-1.0 if v_applied < 0 else sgn_core)
                dot_E_boundary_core = - v_dir * self.pair.mu_static * Fn * disp_from_rev * dot_phi_slip
                state.boundary_flux_domain_valid = True
                state.boundary_flux_domain_reason = "Hertzian spherical reversal: Mindlin-Deresiewicz reversal traction flux"
            else:
                # Monotonic Cattaneo-Mindlin loading regime (exact continuum formula)
                dot_E_boundary_core = - sgn_core * self.pair.mu_static * Fn * delta_t_mag * dot_phi_slip
                state.boundary_flux_domain_valid = True
                state.boundary_flux_domain_reason = "Hertzian spherical monotonic: exact analytical Cattaneo-Mindlin traction flux"

        # Core subsystem power and storage rate:
        # Independently calculated finite-difference rate of change of stored core elastic energy:
        # dot_V_core = (E_core - prev_E_core) / dt_safe
        P_core = Ft_core * v_applied
        dot_V_core = (E_core - prev_E_core) / dt_safe

        # Complete annular stored-energy derivative:
        # d(Phi * E_ann)/dt = Phi * sigma_0 * z * dz_dt + dot_Phi * E_ann
        # 1. Annular bristle elastic storage rate:
        dot_V_ann = phi_slip * self.params.sigma_0 * z_next * dz_dt
        # 2. Annular moving-boundary stored-energy transfer:
        dot_E_boundary_ann = dot_phi_slip * prev_E_ann

        # Kinematic transport flux between applied macro-velocity and micro-slip velocity:
        dot_E_transport = phi_slip * Ft_lugre * (v_applied - v_eff)

        # Conservative interface energy transfer between core and annulus across the moving boundary:
        # Full First-Law power port closure: P_ext = dot_V_core + dot_V_ann + dot_E_boundary_core + dot_E_transport + P_diss
        # where dot_E_boundary_transfer = dot_E_boundary_core + dot_E_transport - dot_E_boundary_ann.
        if math.isnan(dot_E_boundary_core):
            dot_E_boundary_transfer = float('nan')
        else:
            dot_E_boundary_transfer = dot_E_boundary_core + dot_E_transport - dot_E_boundary_ann

        # Annular constitutive dissipation rate (raw signed, unmasked):
        # Direct evaluation of LuGre dissipation function on the slipping annulus
        gv = self.compute_stribeck(v_eff, Fn)
        v_eff_abs = abs(v_eff)
        if gv > 0.0 and v_eff_abs > 1e-12:
            P_ann_indep = (
                ((self.params.sigma_0**2 * v_eff_abs / gv) * (z_next**2)) +
                (self.params.sigma_1 * dz_dt * v_eff) +
                (self.params.sigma_2 * (v_eff**2))
            )
        else:
            P_ann_indep = 0.0

        # Irreversible frictional dissipation on slipping annulus (strictly >= 0 within envelope):
        irreversible_step_diss = phi_slip * P_ann_indep * dt
        state.annular_step_dissipation = irreversible_step_diss
        state.independent_step_dissipation = irreversible_step_diss

        state.core_stored_energy = E_core
        state.annular_stored_energy = phi_slip * E_ann
        state.core_storage_rate = dot_V_core
        state.annular_storage_rate = dot_V_ann
        state.annular_boundary_flux = dot_E_boundary_ann
        state.analytical_core_boundary_flux = dot_E_boundary_core
        state.kinematic_transport_flux = dot_E_transport
        state.boundary_energy_flux = dot_E_boundary_transfer
        state.reversible_boundary_transfer = dot_E_boundary_transfer * dt

        # Update stick-zone state tracking so previous boundary states are NEVER stale
        state.stick_ratio = c_over_a
        state.stick_radius = c_over_a * state.contact_radius

        return total_Ft

    def step_composed_hybrid_with_velocity(
        self,
        state: ContactState,
        Ft_cm_elastic: float,
        v_cmd: float,
        stick_ratio: float,
        dt: float,
        geometry=None,
        enforce_passivity_envelope: bool = True,
        cm_state: Optional[ContactState] = None,
        require_valid_domain: bool = False,
    ) -> Tuple[float, float]:
        """
        Executes composed hybrid step and returns Tuple[total_Ft, v_applied].
        Provides actuator-level velocity feedback so controllers and simulators
        can observe when velocity clamping occurs to maintain passivity.

        NOTE ON ACTUATOR INTEGRATION STATUS:
        Currently verified via standalone closed-loop driver unit tests. No production
        actuator consumer exists yet in the simulator, as multi-finger simulator integration
        and Stage 3.3B production are strictly gated pending final review.
        """
        total_Ft = self.step_composed_hybrid(
            state,
            Ft_cm_elastic,
            v_cmd,
            stick_ratio,
            dt,
            geometry,
            enforce_passivity_envelope,
            cm_state=cm_state,
            require_valid_domain=require_valid_domain,
        )
        return total_Ft, state.applied_slip_velocity
