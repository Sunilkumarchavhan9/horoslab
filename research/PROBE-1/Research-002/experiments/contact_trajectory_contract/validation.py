"""Independent checks on recorded trajectories.

Tangential stiffness is a finite difference of recorded force and recorded
displacement. This module reads those two series and the gross-slip index.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .schema import OBSERVABLE_CHANNELS, OBSERVABLE_COLUMN


class TrajectoryValidationError(ValueError):
    """Raised when a recorded episode fails the partial-slip contract."""


@dataclass(frozen=True)
class StiffnessReport:
    sample_count: int
    early_median_n_per_m: float
    late_median_n_per_m: float
    late_to_early_ratio: float
    slope_n_per_m_per_sample: float
    gross_slip_index: int
    accepted: bool


def finite_difference_stiffness(
    tangential_force: np.ndarray,
    tangential_displacement: np.ndarray,
) -> np.ndarray:
    """K_t[i] = abs( (F[i+1] - F[i]) / (delta[i+1] - delta[i]) )."""

    force = np.ascontiguousarray(tangential_force, dtype=np.float64)
    displacement = np.ascontiguousarray(tangential_displacement, dtype=np.float64)
    if force.shape != displacement.shape or force.ndim != 1:
        raise TrajectoryValidationError("Force and displacement must be 1-D and the same length")
    if force.size < 3:
        raise TrajectoryValidationError("Need at least three samples to difference stiffness")
    delta_force = np.diff(force)
    delta_disp = np.diff(displacement)
    if np.any(np.abs(delta_disp) <= 1e-15):
        raise TrajectoryValidationError("Tangential displacement increment is below 1e-15 m")
    return np.abs(delta_force / delta_disp)


def assess_partial_slip_softening(
    observable: np.ndarray,
    gross_slip_index: int,
    *,
    minimum_pre_slip_samples: int = 30,
    maximum_late_to_early_ratio: float = 0.80,
) -> StiffnessReport:
    """Accept only when recorded stiffness falls before the gross-slip sample.

    ``gross_slip_index`` is the first recorded sample labelled gross slip.
    Stiffness samples are the intervals whose right endpoint is still before
    that sample, so the kinetic-force drop itself is not the stiffness signal.
    """

    array = _as_observable(observable)
    if not isinstance(gross_slip_index, (int, np.integer)):
        raise TrajectoryValidationError("gross_slip_index must be an integer sample index")
    gross_slip_index = int(gross_slip_index)
    if gross_slip_index < 2 or gross_slip_index >= array.shape[0]:
        raise TrajectoryValidationError(
            f"gross_slip_index {gross_slip_index} is outside the pre-slip interior"
        )

    normal_force = array[:, OBSERVABLE_COLUMN["normal_force"]]
    if float(np.ptp(normal_force)) > 1e-9:
        raise TrajectoryValidationError("Normal force is not constant on the recorded episode")

    displacement = array[:, OBSERVABLE_COLUMN["tangential_displacement"]]
    if not np.all(np.diff(displacement) > 0.0):
        raise TrajectoryValidationError("Tangential displacement is not strictly increasing")

    stiffness = finite_difference_stiffness(
        array[:, OBSERVABLE_COLUMN["tangential_force"]],
        displacement,
    )
    # Interval i ends at sample i+1. Keep intervals that end before gross slip.
    pre_slip = stiffness[: gross_slip_index - 1]
    report = _trend(pre_slip, gross_slip_index, minimum_pre_slip_samples, maximum_late_to_early_ratio)
    if not report.accepted:
        raise TrajectoryValidationError(
            "Recorded tangential stiffness does not fall before gross slip: "
            f"late/early={report.late_to_early_ratio:.4f}, "
            f"slope={report.slope_n_per_m_per_sample:.4f}, "
            f"samples={report.sample_count}"
        )
    return report


def assert_rejects_coulomb_cliff(observable: np.ndarray, gross_slip_index: int) -> None:
    """The constant-then-drop control must not pass the softening test."""

    try:
        assess_partial_slip_softening(observable, gross_slip_index)
    except TrajectoryValidationError:
        return
    raise TrajectoryValidationError("Coulomb-cliff fixture was accepted")


def build_coulomb_cliff_observable(steps: int = 80, stiffness_n_per_m: float = 1500.0) -> tuple[np.ndarray, int]:
    """Constant pre-slip stiffness, then one instantaneous force reduction.

    This is a negative control. It is not produced by the contact kernel.
    """

    if steps < 40:
        raise TrajectoryValidationError("Cliff fixture needs at least 40 steps")
    displacement = np.linspace(0.0, 1.0e-3, steps, dtype=np.float64)
    force = stiffness_n_per_m * displacement
    force[-1] = 0.55 * force[-2]
    observable = np.column_stack(
        [
            np.full(steps, 0.004, dtype=np.float64),
            np.full(steps, 1.5, dtype=np.float64),
            force,
            displacement,
            np.zeros(steps, dtype=np.float64),
        ]
    )
    return observable, steps - 1


def _trend(
    pre_slip: np.ndarray,
    gross_slip_index: int,
    minimum_pre_slip_samples: int,
    maximum_late_to_early_ratio: float,
) -> StiffnessReport:
    count = int(pre_slip.size)
    if count < minimum_pre_slip_samples:
        return StiffnessReport(count, float("nan"), float("nan"), float("nan"), float("nan"), gross_slip_index, False)
    early = pre_slip[: max(1, count // 5)]
    late = pre_slip[int(count * 0.70) :]
    early_median = float(np.median(early))
    late_median = float(np.median(late))
    ratio = late_median / early_median if early_median > 0.0 else float("inf")
    slope = float(np.polyfit(np.arange(count, dtype=np.float64), pre_slip, 1)[0])
    accepted = bool(late_median < maximum_late_to_early_ratio * early_median and slope < 0.0)
    return StiffnessReport(count, early_median, late_median, ratio, slope, gross_slip_index, accepted)


def _as_observable(observable: np.ndarray) -> np.ndarray:
    array = np.ascontiguousarray(observable, dtype=np.float64)
    if array.ndim != 2 or array.shape[1] != len(OBSERVABLE_CHANNELS):
        raise TrajectoryValidationError(
            f"Observable array must have shape (T, {len(OBSERVABLE_CHANNELS)}), got {array.shape}"
        )
    return array
