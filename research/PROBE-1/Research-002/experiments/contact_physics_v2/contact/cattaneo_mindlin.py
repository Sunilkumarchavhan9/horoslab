"""
HOROS Contact Physics v2: Cattaneo-Mindlin Tangential Contact Module
Implements the classical Cattaneo (1938) and Mindlin (1949) partial-slip
tangential contact solution, stick-zone evolution, traction distribution,
Mindlin-Deresiewicz (1953) hysteresis loops, and non-linear compliance softening.
"""

import math
from typing import Tuple, Dict, Any, List

from .geometry import ContactGeometry, SphericalContact, FlatPunchContact
from .material import FrictionPair
from .contact_state import ContactState


class CattaneoMindlinModel:
    """
    Computes tangential contact traction, stick core radius c, annular micro-slip,
    and tangent compliance softening for contact geometries.
    """

    def __init__(self, geometry: ContactGeometry, pair: FrictionPair):
        self.geometry = geometry
        self.pair = pair
        self.beta = geometry.partial_slip_exponent()

    def compute_initial_tangential_stiffness(self, a: float) -> float:
        """
        kt_0 = 8 * G* * a = 8 * a / (1 / G*)
        Mindlin's initial tangential stiffness for zero shear load.
        """
        if a <= 0.0:
            return 0.0
        return 8.0 * self.pair.equivalent_shear_modulus * a

    def compute_stick_radius(self, Ft: float, Fn: float, a: float) -> Tuple[float, float]:
        """
        Calculates stick core radius c and stick ratio (c/a).
        For spherical contact (Cattaneo-Mindlin):
          (c / a) = (1 - |Ft| / (mu_s * Fn))^(1/3) for |Ft| < mu_s * Fn
          c = 0.0 for |Ft| >= mu_s * Fn (gross sliding)
        For general geometry:
          (c / a) = (1 - |Ft| / (mu_s * Fn))^beta
        Returns: (c [m], stick_ratio in [0, 1])
        """
        if a <= 0.0 or Fn <= 0.0:
            return 0.0, 0.0

        limit = self.pair.mu_static * Fn
        Ft_ratio = min(1.0, abs(Ft) / max(1e-12, limit))

        if Ft_ratio >= 1.0 or not self.geometry.has_annular_partial_slip():
            if Ft_ratio >= 1.0:
                return 0.0, 0.0
            else:
                # Flat punch with sharp corners: 100% stick until catastrophic slide
                return a, 1.0

        stick_ratio = (1.0 - Ft_ratio) ** self.beta
        c = a * stick_ratio
        return c, stick_ratio

    def compute_tangent_stiffness(self, Ft: float, Fn: float, a: float) -> float:
        """
        Instantaneous tangential stiffness kt(Ft) = dFt / ddelta_t.
        For Cattaneo-Mindlin spherical contact:
          kt(Ft) = kt_0 * (c / a) = kt_0 * (1 - |Ft| / (mu_s * Fn))^(1/3)
        Notice that as |Ft| -> mu_s * Fn, kt -> 0 smoothly!
        """
        if a <= 0.0 or Fn <= 0.0:
            return 0.0
        kt_0 = self.compute_initial_tangential_stiffness(a)
        _, stick_ratio = self.compute_stick_radius(Ft, Fn, a)
        return kt_0 * stick_ratio

    def compute_displacement_monotonic(self, Ft: float, Fn: float, a: float) -> float:
        """
        Computes relative tangential displacement delta_t given tangential force Ft
        under monotonic loading from rest at constant normal force Fn.
        delta_t(Ft) = sgn(Ft) * (3 * mu_s * Fn) / (2 * kt_0) * [ 1 - (1 - |Ft| / (mu_s * Fn))^(2/3) ]
        """
        if a <= 0.0 or Fn <= 0.0 or Ft == 0.0:
            return 0.0

        kt_0 = self.compute_initial_tangential_stiffness(a)
        limit = self.pair.mu_static * Fn
        Ft_mag = abs(Ft)

        if not self.geometry.has_annular_partial_slip():
            # Linear elastic up to limit
            return (Ft / kt_0)

        # Classical Cattaneo-Mindlin displacement
        Ft_ratio = min(1.0, Ft_mag / limit)
        # delta_t_max = 3 * mu_s * Fn / (2 * kt_0)
        disp_scale = (1.5 * limit) / kt_0
        disp_mag = disp_scale * (1.0 - (1.0 - Ft_ratio) ** (2.0 / 3.0))

        return math.copysign(disp_mag, Ft)

    def compute_force_monotonic(self, delta_t: float, Fn: float, a: float) -> Tuple[float, float, bool]:
        """
        Inverse relation: Computes tangential force Ft given displacement delta_t
        under monotonic loading from rest.
        Returns: (Ft [N], kt [N/m], is_gross_sliding [bool])
        """
        if a <= 0.0 or Fn <= 0.0 or delta_t == 0.0:
            return 0.0, 0.0, False

        kt_0 = self.compute_initial_tangential_stiffness(a)
        limit = self.pair.mu_static * Fn

        if not self.geometry.has_annular_partial_slip():
            # Sharp flat punch: linear spring until limit
            candidate_Ft = kt_0 * delta_t
            if abs(candidate_Ft) >= limit:
                # Gross slide
                Ft = math.copysign(self.pair.mu_kinetic * Fn, delta_t)
                return Ft, 0.0, True
            return candidate_Ft, kt_0, False

        # Sphere: delta_t_max = 1.5 * limit / kt_0
        delta_t_max = (1.5 * limit) / kt_0
        delta_mag = abs(delta_t)

        if delta_mag >= delta_t_max:
            # Gross slide: force drops to kinetic friction
            Ft_kinetic = math.copysign(self.pair.mu_kinetic * Fn, delta_t)
            return Ft_kinetic, 0.0, True

        # Invert Cattaneo-Mindlin:
        # (1 - |Ft|/(mu*Fn))^(2/3) = 1 - delta_mag / delta_t_max
        # |Ft| = mu*Fn * [ 1 - (1 - delta_mag / delta_t_max)^(3/2) ]
        fraction = 1.0 - (delta_mag / delta_t_max)
        Ft_mag = limit * (1.0 - (fraction ** 1.5))
        Ft = math.copysign(Ft_mag, delta_t)

        # Instantaneous tangent stiffness kt = kt_0 * (fraction)^(1/2) = kt_0 * (c/a)
        kt = kt_0 * math.sqrt(max(0.0, fraction))

        return Ft, kt, False

    def compute_traction_distribution(self, r: float, Ft: float, Fn: float, a: float) -> float:
        """
        Calculates local tangential traction q(r) across the contact disk 0 <= r <= a.
        For r <= c: q(r) = (3 * mu * Fn) / (2 * pi * a^2) * [ sqrt(1 - (r/a)^2) - (c/a) * sqrt(1 - (r/c)^2) ]
        For c < r <= a: q(r) = mu * p(r) = (3 * mu * Fn) / (2 * pi * a^2) * sqrt(1 - (r/a)^2)
        """
        if a <= 0.0 or Fn <= 0.0:
            return 0.0
        r_abs = abs(r)
        if r_abs >= a:
            return 0.0

        c, stick_ratio = self.compute_stick_radius(Ft, Fn, a)
        tau_0 = (1.5 * self.pair.mu_static * Fn) / (math.pi * (a ** 2))
        q_outer = tau_0 * math.sqrt(1.0 - (r_abs / a) ** 2)

        if r_abs > c or c <= 0.0:
            # Annular slip region
            return math.copysign(q_outer, Ft)
        else:
            # Central stick core
            q_inner = tau_0 * (c / a) * math.sqrt(1.0 - (r_abs / c) ** 2)
            return math.copysign(q_outer - q_inner, Ft)

    def step(self, state: ContactState, delta_t_cmd: float, dt: float) -> None:
        """
        Advances the tangential state by commanding incremental tangential displacement,
        incorporating loading history, load reversal (Mindlin-Deresiewicz), and energy dissipation.
        """
        if not state.in_contact or state.normal_force <= 0.0:
            state.tangential_displacement = 0.0
            state.tangential_force = 0.0
            state.tangent_stiffness = 0.0
            state.stick_radius = 0.0
            state.stick_ratio = 1.0
            state.is_gross_slipping = False
            return

        Fn = state.normal_force
        a = state.contact_radius
        limit = self.pair.mu_static * Fn

        # Determine displacement increment
        prev_disp = state.tangential_displacement
        new_disp = prev_disp + delta_t_cmd
        d_disp = new_disp - prev_disp

        if abs(d_disp) < 1e-15:
            # Stationary step
            state.slip_velocity = 0.0
            return

        current_dir = 1 if d_disp > 0 else -1

        # Check for loading reversal
        if state.loading_direction != 0 and current_dir != state.loading_direction:
            # Reversal occurred! Record turning point for Mindlin-Deresiewicz loop
            state.reversal_tangential_force = state.tangential_force
            state.reversal_tangential_disp = state.tangential_displacement
            state.total_reversals += 1

        state.loading_direction = current_dir

        # If we have a recorded reversal and are within partial slip
        if state.total_reversals > 0 and not state.is_gross_slipping:
            # Mindlin-Deresiewicz reversal equation:
            # Ft - Ft* = - 2 * Ft_monotonic((disp* - disp) / 2)
            delta_from_rev = abs(new_disp - state.reversal_tangential_disp)
            Ft_delta, kt_rev, gross_rev = self.compute_force_monotonic(delta_from_rev / 2.0, Fn, a)
            Ft_delta *= 2.0

            if current_dir > 0:
                new_Ft = state.reversal_tangential_force + Ft_delta
            else:
                new_Ft = state.reversal_tangential_force - Ft_delta

            if abs(new_Ft) >= limit or gross_rev:
                # Reversal reached gross sliding boundary
                state.is_gross_slipping = True
                new_Ft = math.copysign(self.pair.mu_kinetic * Fn, new_Ft)
                state.tangent_stiffness = 0.0
                state.stick_radius = 0.0
                state.stick_ratio = 0.0
                state.slip_velocity = delta_t_cmd / dt
                state.cumulative_slip_distance += abs(delta_t_cmd)
            else:
                state.is_gross_slipping = False
                state.tangent_stiffness = kt_rev
                c, stick_ratio = self.compute_stick_radius(new_Ft, Fn, a)
                state.stick_radius = c
                state.stick_ratio = stick_ratio
                state.slip_velocity = (1.0 - stick_ratio) * (delta_t_cmd / dt)

        else:
            # Monotonic branch from zero
            new_Ft, kt, is_gross = self.compute_force_monotonic(new_disp, Fn, a)
            state.is_gross_slipping = is_gross
            state.tangent_stiffness = kt

            if is_gross:
                state.stick_radius = 0.0
                state.stick_ratio = 0.0
                state.slip_velocity = delta_t_cmd / dt
                state.cumulative_slip_distance += abs(delta_t_cmd)
            else:
                c, stick_ratio = self.compute_stick_radius(new_Ft, Fn, a)
                state.stick_radius = c
                state.stick_ratio = stick_ratio
                state.slip_velocity = (1.0 - stick_ratio) * (delta_t_cmd / dt)

        # Work and energy tracking
        avg_Ft = 0.5 * (state.tangential_force + new_Ft)
        incremental_work = avg_Ft * d_disp

        state.tangential_displacement = new_disp
        state.tangential_force = new_Ft

        # Update elastic and dissipated energy
        kt_0 = self.compute_initial_tangential_stiffness(a)
        if kt_0 > 0.0:
            new_elastic = 0.5 * (new_Ft ** 2) / kt_0
        else:
            new_elastic = 0.0

        d_elastic = new_elastic - state.stored_elastic_energy
        d_diss = max(0.0, incremental_work - d_elastic)  # Passivity enforcement

        state.stored_elastic_energy = new_elastic
        state.cumulative_dissipated_energy += d_diss
        state.instantaneous_dissipation_rate = d_diss / dt
