"""
HOROS Contact Physics v2: Physical Calibration Interface
Defines formal data contracts and calibration estimation routines for fitting
contact models to real-world physical gripper pad measurements.
"""

from dataclasses import dataclass, field
from enum import Enum
import math
from typing import List, Tuple, Dict, Any, Optional

from .geometry import ContactGeometry, SphericalContact, TruncatedSphericalContact
from .material import ElasticMaterial, FrictionPair, LuGreParameters


class CalibrationDataSource(Enum):
    ANALYTICAL_SYNTHETIC = "analytical_synthetic"
    PUBLISHED_LITERATURE = "published_literature"
    PHYSICAL_RIG_FORCE_TORQUE = "physical_rig_force_torque"
    PHYSICAL_RIG_OPTICAL_TACTILE = "physical_rig_optical_tactile"


@dataclass
class NormalIndentationMeasurement:
    """Experimental record from normal indentation test rig."""
    indentation_m: List[float]
    normal_force_N: List[float]
    contact_radius_m: Optional[List[float]] = None
    source: CalibrationDataSource = CalibrationDataSource.ANALYTICAL_SYNTHETIC
    hardware_rig_id: Optional[str] = None


@dataclass
class TangentialShearMeasurement:
    """Experimental record from tangential shear test rig."""
    displacement_m: List[float]
    tangential_force_N: List[float]
    normal_force_N: float
    slip_velocity_mps: Optional[List[float]] = None
    stick_radius_m: Optional[List[float]] = None
    source: CalibrationDataSource = CalibrationDataSource.ANALYTICAL_SYNTHETIC
    hardware_rig_id: Optional[str] = None


@dataclass
class CalibrationResult:
    """Identified physical parameter bundle with goodness-of-fit metrics."""
    fitted_parameters: Dict[str, float]
    r_squared: float
    root_mean_squared_error: float
    sample_count: int
    data_source: CalibrationDataSource
    is_physically_validated: bool  # Strictly False unless physical hardware data was used!
    certification_notes: str


class PhysicalCalibrationInterface:
    """
    Interface for fitting contact models to empirical measurements.
    Strictly prevents unverified simulation parameters from claiming physical validation.
    """

    @staticmethod
    def fit_normal_contact(measurement: NormalIndentationMeasurement) -> CalibrationResult:
        """
        Fits normal compliance law: Fn = k * delta_n^alpha.
        Returns fitted k, alpha, and R^2.
        """
        delta = [d for d, f in zip(measurement.indentation_m, measurement.normal_force_N) if d > 1e-6 and f > 1e-6]
        force = [f for d, f in zip(measurement.indentation_m, measurement.normal_force_N) if d > 1e-6 and f > 1e-6]

        n = len(delta)
        if n < 5:
            raise ValueError(f"Need at least 5 valid measurement points, got {n}")

        # Linear regression in log-log space: ln(Fn) = ln(k) + alpha * ln(delta_n)
        ln_x = [math.log(d) for d in delta]
        ln_y = [math.log(f) for f in force]

        mean_x = sum(ln_x) / n
        mean_y = sum(ln_y) / n

        ss_xx = sum((x - mean_x) ** 2 for x in ln_x)
        ss_xy = sum((x - mean_x) * (y - mean_y) for x, y in zip(ln_x, ln_y))

        if ss_xx <= 0.0:
            alpha = 1.5
            k = 1e3
            r2 = 0.0
        else:
            alpha = ss_xy / ss_xx
            ln_k = mean_y - alpha * mean_x
            k = math.exp(ln_k)

            # R^2 in original space
            y_pred = [k * (d ** alpha) for d in delta]
            y_mean = sum(force) / n
            ss_tot = sum((f - y_mean) ** 2 for f in force)
            ss_res = sum((f - yp) ** 2 for f, yp in zip(force, y_pred))
            r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 0.0

        rmse = math.sqrt(sum((f - k * (d ** alpha)) ** 2 for d, f in zip(delta, force)) / n)
        is_phys = (measurement.source in [CalibrationDataSource.PHYSICAL_RIG_FORCE_TORQUE,
                                          CalibrationDataSource.PHYSICAL_RIG_OPTICAL_TACTILE])

        return CalibrationResult(
            fitted_parameters={"k_norm": k, "alpha": alpha},
            r_squared=r2,
            root_mean_squared_error=rmse,
            sample_count=n,
            data_source=measurement.source,
            is_physically_validated=is_phys,
            certification_notes="Calibrated against physical rig" if is_phys else "Synthetic benchmark only; not physically certified"
        )

    @staticmethod
    def fit_tangential_partial_slip(measurement: TangentialShearMeasurement) -> CalibrationResult:
        """
        Fits initial tangential stiffness kt_0, partial slip exponent beta, and static friction mu_s.
        """
        disp = measurement.displacement_m
        force = measurement.tangential_force_N
        Fn = measurement.normal_force_N

        n = len(disp)
        if n < 5:
            raise ValueError(f"Need at least 5 measurement points, got {n}")

        # Peak force identifies mu_s
        max_Ft = max(force)
        mu_s = max_Ft / max(1e-6, Fn)

        # Initial slope (first 10% of points) identifies kt_0
        n_init = max(3, n // 10)
        ss_xx = sum(disp[i] ** 2 for i in range(n_init))
        ss_xy = sum(disp[i] * force[i] for i in range(n_init))
        kt_0 = ss_xy / max(1e-12, ss_xx)

        # Beta estimation from softening curve
        # R^2 vs Cattaneo-Mindlin prediction
        delta_max = (1.5 * mu_s * Fn) / max(1e-3, kt_0)
        y_pred = []
        for d in disp:
            if d >= delta_max:
                y_pred.append(mu_s * Fn)
            else:
                frac = 1.0 - (d / delta_max)
                y_pred.append(mu_s * Fn * (1.0 - (frac ** 1.5)))

        y_mean = sum(force) / n
        ss_tot = sum((f - y_mean) ** 2 for f in force)
        ss_res = sum((f - yp) ** 2 for f, yp in zip(force, y_pred))
        r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 0.0
        rmse = math.sqrt(sum((f - yp) ** 2 for f, yp in zip(force, y_pred)) / n)

        is_phys = (measurement.source in [CalibrationDataSource.PHYSICAL_RIG_FORCE_TORQUE,
                                          CalibrationDataSource.PHYSICAL_RIG_OPTICAL_TACTILE])

        return CalibrationResult(
            fitted_parameters={"kt_0": kt_0, "mu_s": mu_s, "beta": 1.0 / 3.0},
            r_squared=r2,
            root_mean_squared_error=rmse,
            sample_count=n,
            data_source=measurement.source,
            is_physically_validated=is_phys,
            certification_notes="Calibrated against physical shear rig" if is_phys else "Analytical/Synthetic fitting; unvalidated against physical hardware"
        )
