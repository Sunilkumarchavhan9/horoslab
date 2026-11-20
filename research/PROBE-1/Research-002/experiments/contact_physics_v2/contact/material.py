"""
HOROS Contact Physics v2: Material Module
Defines elastic, frictional, and dynamic constitutive material properties,
equivalent contact moduli, and physical property bounds validation.
"""

from dataclasses import dataclass
import math


@dataclass(frozen=True)
class ElasticMaterial:
    """
    Isotropic linear elastic material definition.
    """
    name: str
    youngs_modulus: float    # E in Pascals (N/m^2)
    poissons_ratio: float    # nu, dimensionless

    def __post_init__(self):
        if self.youngs_modulus <= 0.0:
            raise ValueError(f"Young's modulus must be positive, got {self.youngs_modulus} Pa")
        if not (-1.0 < self.poissons_ratio < 0.5):
            raise ValueError(f"Poisson's ratio must be in (-1, 0.5) for physical stability, got {self.poissons_ratio}")

    @property
    def shear_modulus(self) -> float:
        """G = E / (2 * (1 + nu))"""
        return self.youngs_modulus / (2.0 * (1.0 + self.poissons_ratio))


@dataclass(frozen=True)
class LuGreParameters:
    """
    Dynamic bristle friction parameters for LuGre friction model.
    """
    sigma_0: float              # Bristle stiffness (N/m)
    sigma_1: float              # Bristle micro-damping (N*s/m)
    sigma_2: float              # Viscous friction coefficient (N*s/m)
    stribeck_velocity: float    # v_s in m/s (characteristic Stribeck speed)
    stribeck_exponent: float = 2.0  # Exponent in Stribeck decay (typically 1.0 or 2.0)

    def __post_init__(self):
        if self.sigma_0 <= 0.0:
            raise ValueError(f"Bristle stiffness sigma_0 must be positive, got {self.sigma_0}")
        if self.sigma_1 < 0.0:
            raise ValueError(f"Micro-damping sigma_1 cannot be negative, got {self.sigma_1}")
        if self.sigma_2 < 0.0:
            raise ValueError(f"Viscous friction sigma_2 cannot be negative, got {self.sigma_2}")
        if self.stribeck_velocity <= 0.0:
            raise ValueError(f"Stribeck velocity must be positive, got {self.stribeck_velocity}")


@dataclass(frozen=True)
class FrictionPair:
    """
    Pairwise contact interface between two contacting bodies.
    Calculates composite contact modulus E* and Mindlin equivalent shear modulus G*.
    """
    body1: ElasticMaterial
    body2: ElasticMaterial
    mu_static: float            # Static friction coefficient mu_s
    mu_kinetic: float           # Kinetic friction coefficient mu_k
    lugre_params: LuGreParameters = None

    def __post_init__(self):
        if self.mu_static <= 0.0:
            raise ValueError(f"Static friction coefficient must be positive, got {self.mu_static}")
        if self.mu_kinetic <= 0.0:
            raise ValueError(f"Kinetic friction coefficient must be positive, got {self.mu_kinetic}")
        if self.mu_kinetic > self.mu_static:
            raise ValueError(f"Kinetic friction ({self.mu_kinetic}) cannot exceed static friction ({self.mu_static})")

    @property
    def equivalent_youngs_modulus(self) -> float:
        """
        1 / E* = (1 - nu1^2)/E1 + (1 - nu2^2)/E2
        """
        inv_e_star = ((1.0 - self.body1.poissons_ratio**2) / self.body1.youngs_modulus +
                      (1.0 - self.body2.poissons_ratio**2) / self.body2.youngs_modulus)
        return 1.0 / inv_e_star

    @property
    def equivalent_shear_modulus(self) -> float:
        """
        Mindlin equivalent shear compliance factor:
        1 / G* = (2 - nu1)/G1 + (2 - nu2)/G2
        Used directly in Cattaneo-Mindlin initial tangential compliance:
        kt_0 = 8 * a / (1 / G*) = 8 * G* * a
        """
        inv_g_star = ((2.0 - self.body1.poissons_ratio) / self.body1.shear_modulus +
                      (2.0 - self.body2.poissons_ratio) / self.body2.shear_modulus)
        return 1.0 / inv_g_star


# =========================================================================
# Pre-Calibrated Standard Material Library
# =========================================================================

# Elastomers (typical robotic gripper fingertip pads)
SILICONE_30A = ElasticMaterial(name="Silicone Shore 30A", youngs_modulus=1.20e6, poissons_ratio=0.495)
SILICONE_50A = ElasticMaterial(name="Silicone Shore 50A", youngs_modulus=2.80e6, poissons_ratio=0.490)
POLYURETHANE_60A = ElasticMaterial(name="Polyurethane 60A", youngs_modulus=4.50e6, poissons_ratio=0.485)

# Rigid Workpieces
ALUMINUM_6061 = ElasticMaterial(name="Aluminum 6061-T6", youngs_modulus=69.0e9, poissons_ratio=0.330)
STRUCTURAL_STEEL = ElasticMaterial(name="Structural Steel", youngs_modulus=205.0e9, poissons_ratio=0.290)
ACRYLIC_PMMA = ElasticMaterial(name="Acrylic PMMA", youngs_modulus=3.20e9, poissons_ratio=0.370)

# Default Standard Friction Pairs
STANDARD_LUGRE_ELASTOMER = LuGreParameters(
    sigma_0=2.5e4,        # 25,000 N/m
    sigma_1=450.0,        # 450 N*s/m
    sigma_2=1.5,          # 1.5 N*s/m
    stribeck_velocity=0.002,  # 2 mm/s
    stribeck_exponent=2.0
)

def create_silicone_aluminum_pair(mu_static: float = 0.65, mu_kinetic: float = 0.55) -> FrictionPair:
    return FrictionPair(
        body1=SILICONE_30A,
        body2=ALUMINUM_6061,
        mu_static=mu_static,
        mu_kinetic=mu_kinetic,
        lugre_params=STANDARD_LUGRE_ELASTOMER
    )

def create_silicone_steel_pair(mu_static: float = 0.50, mu_kinetic: float = 0.42) -> FrictionPair:
    return FrictionPair(
        body1=SILICONE_50A,
        body2=STRUCTURAL_STEEL,
        mu_static=mu_static,
        mu_kinetic=mu_kinetic,
        lugre_params=STANDARD_LUGRE_ELASTOMER
    )
