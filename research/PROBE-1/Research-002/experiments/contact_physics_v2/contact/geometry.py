"""
HOROS Contact Physics v2: Geometry Module
Defines contact surface geometry profiles, gap functions, and geometry-dependent
exponents for normal and tangential contact mechanics.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
import math
from typing import Optional


class ContactGeometry(ABC):
    """Abstract base class for contact surface geometry."""

    @abstractmethod
    def profile(self, r: float) -> float:
        """Surface elevation profile z(r) relative to contact apex at radius r (meters)."""
        pass

    @abstractmethod
    def normal_compliance_exponent(self) -> float:
        """Exponent alpha in Fn ~ delta_n^alpha."""
        pass

    @abstractmethod
    def partial_slip_exponent(self) -> float:
        """Exponent beta in (c/a) = (1 - Ft / (mu * Fn))^beta."""
        pass

    @abstractmethod
    def has_annular_partial_slip(self) -> bool:
        """Whether this geometry exhibits Cattaneo-Mindlin style annular partial slip."""
        pass

    @abstractmethod
    def annular_slip_load_fraction(self, stick_ratio: float) -> float:
        """
        Computes the continuum normal load fraction Phi_slip supported by the
        slipping annulus as a function of the stick ratio c/a in [0, 1].
        """
        pass

    @abstractmethod
    def contact_radius(self, delta_n: float) -> float:
        """Contact patch radius a (meters) as a function of indentation depth delta_n."""
        pass

    @abstractmethod
    def describe(self) -> str:
        """Human-readable description of geometric assumptions."""
        pass


@dataclass(frozen=True)
class SphericalContact(ContactGeometry):
    """
    Classical spherical contact profile (Hertzian).
    z(r) = r^2 / (2 * R)
    Valid for spherical or axisymmetric paraboloid indenter against flat elastic half-space.
    """
    radius: float  # Radius of curvature in meters

    def __post_init__(self):
        if self.radius <= 0.0:
            raise ValueError(f"Spherical radius must be strictly positive, got {self.radius} m")

    def profile(self, r: float) -> float:
        r_abs = abs(r)
        if r_abs > self.radius:
            return self.radius
        return r_abs**2 / (2.0 * self.radius)

    def normal_compliance_exponent(self) -> float:
        return 1.5  # Hertzian: Fn ~ delta_n^(3/2)

    def partial_slip_exponent(self) -> float:
        return 1.0 / 3.0  # Cattaneo-Mindlin: (c/a) = (1 - Ft/(mu*Fn))^(1/3)

    def has_annular_partial_slip(self) -> bool:
        return True

    def annular_slip_load_fraction(self, stick_ratio: float) -> float:
        """
        Exact Hertzian normal load fraction over slipping annulus:
        Phi_slip = (1 - (c/a)^2)^(3/2) for c/a in [0, 1].
        """
        x = max(0.0, min(1.0, stick_ratio))
        return (1.0 - x**2) ** 1.5 if x < 1.0 else 0.0

    def contact_radius(self, delta_n: float) -> float:
        if delta_n <= 0.0:
            return 0.0
        return math.sqrt(self.radius * delta_n)

    def describe(self) -> str:
        return f"Hertzian Spherical Contact (R = {self.radius*1e3:.2f} mm, alpha=1.5, beta=1/3)"


@dataclass(frozen=True)
class FlatPunchContact(ContactGeometry):
    """
    Classical flat cylindrical punch profile.
    Flat face for r <= punch_radius, with optional rounded edge of radius corner_radius.
    For sharp punch (corner_radius == 0):
      - Normal stiffness is constant: Fn ~ delta_n^1.0
      - Pressure diverges at edge: p(r) ~ 1/sqrt(a^2 - r^2)
      - No annular slip: complete sticking until gross sliding occurs instantaneously!
    """
    punch_radius: float   # Flat face radius in meters
    corner_radius: float = 0.0  # Optional edge fillet radius in meters

    def __post_init__(self):
        if self.punch_radius <= 0.0:
            raise ValueError(f"Punch radius must be strictly positive, got {self.punch_radius} m")
        if self.corner_radius < 0.0:
            raise ValueError(f"Corner radius cannot be negative, got {self.corner_radius} m")

    def profile(self, r: float) -> float:
        r_abs = abs(r)
        if r_abs <= self.punch_radius:
            return 0.0
        delta_r = r_abs - self.punch_radius
        if self.corner_radius > 0.0:
            if delta_r <= self.corner_radius:
                return self.corner_radius - math.sqrt(max(0.0, self.corner_radius**2 - delta_r**2))
            return self.corner_radius
        return float('inf')

    def normal_compliance_exponent(self) -> float:
        # Sharp punch is linear; rounded punch is slightly nonlinear near initial contact
        return 1.0 if self.corner_radius == 0.0 else 1.15

    def partial_slip_exponent(self) -> float:
        # Sharp punch has zero partial-slip exponent (binary transition)
        # Rounded punch has small finite partial slip at edges
        return 0.0 if self.corner_radius == 0.0 else 0.12

    def has_annular_partial_slip(self) -> bool:
        return self.corner_radius > 0.0

    def annular_slip_load_fraction(self, stick_ratio: float) -> float:
        """
        Exact continuum normal load fraction Phi_slip = (1/Fn) * int_{c}^{b} 2*pi*r*p(r) dr:
        - Sharp punch (corner_radius == 0): Binary slip. Phi_slip = 0 for c/a > 0, 1 for c/a == 0.
        - Rounded punch (corner_radius > 0): Closed-form integration of Ciavarella (1998)
          pressure field across central flat core and rounded edge fillet:
          p(r) = p0 for r <= a0; p(r) = p0 * sqrt(1 - ((r - a0)/rc)^2) for a0 < r <= b.
        """
        x = max(0.0, min(1.0, stick_ratio))
        if self.corner_radius <= 0.0:
            return 1.0 if x <= 0.0 else 0.0

        if x <= 0.0:
            return 1.0
        if x >= 1.0:
            return 0.0

        a0 = self.punch_radius
        rc = self.corner_radius
        b = a0 + rc
        c = x * b

        # Total normal force integral factor:
        I_edge = (math.pi**2 / 2.0) * a0 * rc + (2.0 * math.pi / 3.0) * rc**2
        I_flat = math.pi * a0**2
        I_tot = I_flat + I_edge

        if c >= a0:
            # Slipping zone strictly confined to the rounded edge fillet:
            rho = (c - a0) / rc
            term1 = a0 * (math.pi / 4.0 - 0.5 * (rho * math.sqrt(max(0.0, 1.0 - rho**2)) + math.asin(min(1.0, rho))))
            term2 = (rc / 3.0) * (max(0.0, 1.0 - rho**2))**1.5
            I_slip = 2.0 * math.pi * rc * (term1 + term2)
            return min(1.0, max(0.0, I_slip / I_tot))
        else:
            # Slipping zone has penetrated past the rounded fillet into the flat core:
            I_slip_flat = math.pi * (a0**2 - c**2)
            return min(1.0, max(0.0, (I_slip_flat + I_edge) / I_tot))

    def contact_radius(self, delta_n: float) -> float:
        if delta_n <= 0.0:
            return 0.0
        if self.corner_radius == 0.0:
            return self.punch_radius
        # Approximate edge expansion under indentation
        extra = math.sqrt(max(0.0, 2.0 * self.corner_radius * delta_n))
        return self.punch_radius + min(self.corner_radius, extra)

    def describe(self) -> str:
        if self.corner_radius == 0.0:
            return f"Flat Cylindrical Punch (a = {self.punch_radius*1e3:.2f} mm, sharp edge, no partial slip)"
        return f"Rounded Flat Punch (a = {self.punch_radius*1e3:.2f} mm, r_c = {self.corner_radius*1e3:.2f} mm)"


@dataclass(frozen=True)
class TruncatedSphericalContact(ContactGeometry):
    """
    Truncated sphere or dome with elastomeric layer thickness.
    Representative of robotic fingertip pads featuring a curved rubber dome
    backed by a rigid core or featuring a flat central region.
    """
    sphere_radius: float   # Dome radius of curvature (m)
    pad_thickness: float   # Elastomer layer thickness h (m)
    flat_radius: float = 0.0  # Central flat region radius (m)

    def __post_init__(self):
        if self.sphere_radius <= 0.0:
            raise ValueError(f"Sphere radius must be positive, got {self.sphere_radius} m")
        if self.pad_thickness <= 0.0:
            raise ValueError(f"Pad thickness must be positive, got {self.pad_thickness} m")
        if self.flat_radius < 0.0:
            raise ValueError(f"Flat radius cannot be negative, got {self.flat_radius} m")

    def profile(self, r: float) -> float:
        r_abs = abs(r)
        if r_abs <= self.flat_radius:
            return 0.0
        dr = r_abs - self.flat_radius
        return dr**2 / (2.0 * self.sphere_radius)

    def normal_compliance_exponent(self) -> float:
        # Effective exponent between linear (thin layer confinement) and 1.5 (deep Hertz)
        return 1.35

    def partial_slip_exponent(self) -> float:
        # Effective exponent for elastomeric dome
        return 0.28

    def has_annular_partial_slip(self) -> bool:
        return True

    def annular_slip_load_fraction(self, stick_ratio: float) -> float:
        """
        Exact continuum normal load fraction Phi_slip = (1/Fn) * int_{c}^{b} 2*pi*r*p(r) dr:
        - When flat_radius == 0: Exact Hertzian (1 - (c/a)^2)^(3/2).
        - When flat_radius > 0: Closed-form integration of piecewise normal pressure:
          p(r) = p0 for r <= a0 (flat apex); p(r) = p0 * sqrt(1 - ((r - a0)/rs)^2) for a0 < r <= b.
        """
        x = max(0.0, min(1.0, stick_ratio))
        if x <= 0.0:
            return 1.0
        if x >= 1.0:
            return 0.0
        if self.flat_radius <= 0.0:
            return (1.0 - x**2) ** 1.5

        a0 = self.flat_radius
        rs = math.sqrt(self.sphere_radius * 1e-4)
        b = a0 + rs
        c = x * b

        I_shoulder = (math.pi**2 / 2.0) * a0 * rs + (2.0 * math.pi / 3.0) * rs**2
        I_flat = math.pi * a0**2
        I_tot = I_flat + I_shoulder

        if c >= a0:
            rho = (c - a0) / rs
            term1 = a0 * (math.pi / 4.0 - 0.5 * (rho * math.sqrt(max(0.0, 1.0 - rho**2)) + math.asin(min(1.0, rho))))
            term2 = (rs / 3.0) * (max(0.0, 1.0 - rho**2))**1.5
            I_slip = 2.0 * math.pi * rs * (term1 + term2)
            return min(1.0, max(0.0, I_slip / I_tot))
        else:
            I_slip_flat = math.pi * (a0**2 - c**2)
            return min(1.0, max(0.0, (I_slip_flat + I_shoulder) / I_tot))

    def contact_radius(self, delta_n: float) -> float:
        if delta_n <= 0.0:
            return 0.0
        dome_a = math.sqrt(self.sphere_radius * delta_n)
        return self.flat_radius + dome_a

    def describe(self) -> str:
        return (f"Elastomeric Dome Fingertip (R = {self.sphere_radius*1e3:.2f} mm, "
                f"h = {self.pad_thickness*1e3:.2f} mm, r_flat = {self.flat_radius*1e3:.2f} mm)")
