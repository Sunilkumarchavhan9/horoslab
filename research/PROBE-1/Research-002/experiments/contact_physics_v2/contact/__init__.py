"""
HOROS Contact Physics v2.1: Reference Kernel Package
Remediated for continuous hybrid transitions (CP2-01) and exact layer stiffness (CP2-02).
"""

__version__ = "2.1.0"

from .geometry import (
    ContactGeometry,
    SphericalContact,
    FlatPunchContact,
    TruncatedSphericalContact,
)
from .material import (
    ElasticMaterial,
    FrictionPair,
    LuGreParameters,
    SILICONE_30A,
    SILICONE_50A,
    POLYURETHANE_60A,
    ALUMINUM_6061,
    STRUCTURAL_STEEL,
    create_silicone_aluminum_pair,
    create_silicone_steel_pair,
)
from .contact_state import (
    ContactState,
    ContactModelMode,
)
from .normal_contact import NormalContactModel
from .cattaneo_mindlin import CattaneoMindlinModel
from .lugre import LuGreModel
from .calibration_interface import (
    PhysicalCalibrationInterface,
    CalibrationDataSource,
    CalibrationResult,
    NormalIndentationMeasurement,
    TangentialShearMeasurement,
)

__all__ = [
    "ContactGeometry",
    "SphericalContact",
    "FlatPunchContact",
    "TruncatedSphericalContact",
    "ElasticMaterial",
    "FrictionPair",
    "LuGreParameters",
    "SILICONE_30A",
    "SILICONE_50A",
    "POLYURETHANE_60A",
    "ALUMINUM_6061",
    "STRUCTURAL_STEEL",
    "create_silicone_aluminum_pair",
    "create_silicone_steel_pair",
    "ContactState",
    "ContactModelMode",
    "NormalContactModel",
    "CattaneoMindlinModel",
    "LuGreModel",
    "PhysicalCalibrationInterface",
    "CalibrationDataSource",
    "CalibrationResult",
    "NormalIndentationMeasurement",
    "TangentialShearMeasurement",
]
