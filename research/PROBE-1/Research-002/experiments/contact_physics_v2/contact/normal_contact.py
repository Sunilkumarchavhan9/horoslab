"""
HOROS Contact Physics v2: Normal Contact Module
Implements normal contact mechanics for Hertzian spherical, flat punch,
and elastomeric layer geometries with explicit physical assumptions,
finite-thickness corrections, and near-zero regularization.
"""

import math
from typing import Tuple, Dict, Any

from .geometry import ContactGeometry, SphericalContact, FlatPunchContact, TruncatedSphericalContact
from .material import FrictionPair
from .contact_state import ContactState


class NormalContactModel:
    """
    Computes normal contact forces, contact patch radius, pressure profile,
    and stored elastic strain energy given penetration depth and contact geometry.
    """

    def __init__(self, geometry: ContactGeometry, pair: FrictionPair, zero_tolerance: float = 1e-9):
        self.geometry = geometry
        self.pair = pair
        self.zero_tolerance = zero_tolerance  # 1 nm regularization threshold

    def compute_from_indentation(self, delta_n: float) -> Tuple[float, float, float]:
        """
        Compute normal force Fn, contact radius a, and normal tangent stiffness kn
        given indentation depth delta_n (meters).
        Returns: (Fn [N], a [m], kn [N/m])
        """
        if delta_n <= 0.0:
            return 0.0, 0.0, 0.0

        E_star = self.pair.equivalent_youngs_modulus

        if isinstance(self.geometry, SphericalContact):
            R = self.geometry.radius
            # Hertzian classical spherical solution:
            # Fn = (4/3) * E* * R^(1/2) * delta_n^(3/2)
            # a = sqrt(R * delta_n)
            # kn = dFn / ddelta_n = 2 * E* * sqrt(R * delta_n) = 2 * E* * a
            a = math.sqrt(R * delta_n)
            Fn = (4.0 / 3.0) * E_star * math.sqrt(R) * (delta_n ** 1.5)
            kn = 2.0 * E_star * a
            return Fn, a, kn

        elif isinstance(self.geometry, FlatPunchContact):
            a = self.geometry.punch_radius
            if self.geometry.corner_radius == 0.0:
                # Sharp flat cylindrical punch:
                # Fn = 2 * E* * a * delta_n
                # kn = 2 * E* * a (constant)
                Fn = 2.0 * E_star * a * delta_n
                kn = 2.0 * E_star * a
                return Fn, a, kn
            else:
                # Rounded punch: consistent potential integration for edge rounding
                rc = self.geometry.corner_radius
                a_eff = a + min(rc, math.sqrt(max(0.0, 2.0 * rc * delta_n)))
                # Analytical potential integral: 2*E*a*delta_n + (4/3)*E*sqrt(2*rc)*delta_n^1.5
                Fn = (2.0 * E_star * a * delta_n) + ((4.0 / 3.0) * E_star * math.sqrt(2.0 * rc) * (delta_n ** 1.5))
                kn = 2.0 * E_star * a_eff
                return Fn, a_eff, kn

        elif isinstance(self.geometry, TruncatedSphericalContact):
            R = self.geometry.sphere_radius
            h = self.geometry.pad_thickness
            r_flat = self.geometry.flat_radius

            # Dome expansion
            a_dome = math.sqrt(R * delta_n)
            a = r_flat + a_dome

            # Base Hertz + flat component
            Fn_base = (4.0 / 3.0) * E_star * math.sqrt(R) * (delta_n ** 1.5) + (2.0 * E_star * r_flat * delta_n)
            dFn_base = 2.0 * E_star * a

            # Hayes / Waters & Guduru finite-thickness confinement correction
            aspect_ratio = a / h
            confinement_factor = 1.0 + 0.35 * aspect_ratio + 0.15 * (aspect_ratio ** 2)

            # Full chain-rule derivative: kn = dFn_base/ddelta * Ch + Fn_base * dCh/ddelta
            dxi_ddelta = (math.sqrt(R) / (2.0 * max(1e-12, math.sqrt(delta_n)))) / h
            dCh_dxi = 0.35 + 0.30 * aspect_ratio
            dCh_ddelta = dCh_dxi * dxi_ddelta

            Fn = Fn_base * confinement_factor
            kn = (dFn_base * confinement_factor) + (Fn_base * dCh_ddelta)
            return Fn, a, kn

        else:
            raise NotImplementedError(f"Unsupported geometry type: {type(self.geometry)}")

    def compute_indentation_from_force(self, Fn: float) -> Tuple[float, float, float]:
        """
        Inverse relation: Compute indentation depth delta_n given target normal force Fn.
        Returns: (delta_n [m], a [m], kn [N/m])
        """
        if Fn <= 0.0:
            return 0.0, 0.0, 0.0

        E_star = self.pair.equivalent_youngs_modulus

        if isinstance(self.geometry, SphericalContact):
            R = self.geometry.radius
            # delta_n = ( (3 * Fn) / (4 * E* * sqrt(R)) )^(2/3)
            #         = ( 9 * Fn^2 / (16 * R * E*^2) )^(1/3)
            delta_n = ((9.0 * (Fn ** 2)) / (16.0 * R * (E_star ** 2))) ** (1.0 / 3.0)
            a = math.sqrt(R * delta_n)
            kn = 2.0 * E_star * a
            return delta_n, a, kn

        elif isinstance(self.geometry, FlatPunchContact):
            a = self.geometry.punch_radius
            kn = 2.0 * E_star * a
            delta_n = Fn / kn
            return delta_n, a, kn

        else:
            # Numerical inversion via Newton-Raphson for general geometries
            delta_n = 1e-4  # initial guess 0.1 mm
            for _ in range(20):
                cur_Fn, _, kn = self.compute_from_indentation(delta_n)
                res = cur_Fn - Fn
                if abs(res) < 1e-7:
                    break
                delta_n -= res / max(1e-3, kn)
                delta_n = max(1e-9, delta_n)
            _, a, kn = self.compute_from_indentation(delta_n)
            return delta_n, a, kn

    def compute_pressure_distribution(self, Fn: float, a: float, r: float) -> float:
        """
        Calculates local normal contact pressure p(r) at radial distance r from center.
        """
        if a <= 0.0 or Fn <= 0.0:
            return 0.0
        r_abs = abs(r)
        if r_abs >= a:
            return 0.0

        if isinstance(self.geometry, SphericalContact):
            # Parabolic Hertzian pressure: p(r) = p0 * sqrt(1 - (r/a)^2)
            p0 = 1.5 * Fn / (math.pi * (a ** 2))
            return p0 * math.sqrt(1.0 - (r_abs / a) ** 2)

        elif isinstance(self.geometry, FlatPunchContact):
            if self.geometry.corner_radius == 0.0:
                # Theoretical sharp flat punch diverges at edge; regularize at 0.999 * a
                r_reg = min(r_abs, 0.999 * a)
                return Fn / (2.0 * math.pi * a * math.sqrt(a ** 2 - r_reg ** 2))
            else:
                p0 = Fn / (math.pi * (a ** 2))
                return p0 * (1.0 - (r_abs / a) ** 4)

        else:
            p0 = 1.5 * Fn / (math.pi * (a ** 2))
            return p0 * math.sqrt(max(0.0, 1.0 - (r_abs / a) ** 2))

    def compute_stored_elastic_energy(self, delta_n: float) -> float:
        """
        Calculates stored normal elastic strain energy:
        E_elastic = integral_0^delta_n Fn(x) dx
        For Hertz: E_n = (2/5) * Fn * delta_n
        For Flat: E_n = (1/2) * Fn * delta_n
        """
        if delta_n <= 0.0:
            return 0.0
        Fn, _, _ = self.compute_from_indentation(delta_n)
        if isinstance(self.geometry, SphericalContact):
            return 0.4 * Fn * delta_n
        else:
            return 0.5 * Fn * delta_n

    def update_state(self, state: ContactState, delta_n: float, time: float, dt: float) -> None:
        """Update contact state with normal contact kinematics and kinetics."""
        state.time = time
        state.step_count += 1

        if delta_n <= 0.0:
            state.record_contact_loss()
            return

        if not state.in_contact:
            state.in_contact = True
            state.contact_established_time = time

        Fn, a, _ = self.compute_from_indentation(delta_n)
        state.normal_indentation = delta_n
        state.normal_force = Fn
        state.contact_radius = a

        if Fn > state.peak_normal_force:
            state.peak_normal_force = Fn
        if delta_n > state.peak_normal_indentation:
            state.peak_normal_indentation = delta_n

        state.stored_elastic_energy = self.compute_stored_elastic_energy(delta_n)
