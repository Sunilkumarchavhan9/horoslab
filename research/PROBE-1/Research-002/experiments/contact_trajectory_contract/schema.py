"""Observable and privileged schemas for the P4-T1 trajectory contract.

The observable array is the only tensor a later model is allowed to read.
Friction, stick radius, and bristle state stay in the privileged sidecar.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Tuple


SCHEMA_VERSION = "p4t1-contact-trajectory-v1"
OBSERVABLE_HASH_PREFIX = b"p4t1-observable-v1"
PRIVILEGED_HASH_PREFIX = b"p4t1-privileged-v1"
EPISODE_HASH_PREFIX = b"p4t1-episode-hash-v1"

# Exact column order of the observable array. Do not append channels.
OBSERVABLE_CHANNELS: Tuple[str, ...] = (
    "commanded_velocity",
    "normal_force",
    "tangential_force",
    "tangential_displacement",
    "slip_speed",
)

OBSERVABLE_COLUMN = {name: index for index, name in enumerate(OBSERVABLE_CHANNELS)}

# Names that must never appear as observable array columns or NPZ keys.
PRIVILEGED_FORBIDDEN_IN_OBSERVABLE: Tuple[str, ...] = (
    "mu_static",
    "mu_kinetic",
    "stick_radius",
    "bristle_state",
    "bristle_deflection",
    "bristle_velocity",
)

# Research-only seeds. They sit outside production (3300000), pilot
# (3111000-3125003), reserve (3390000 series), Phase 3.7.2 (9000-9359),
# and the S4 diagnostic band (9500000).
RESEARCH_SEEDS: Tuple[int, ...] = (4100101, 4100102, 4100103)

# Intervals that are already allocated or previously consumed.
LOCKED_SEED_INTERVALS: Tuple[Tuple[int, int], ...] = (
    (9000, 9359),
    (3111000, 3125003),
    (3300000, 3325999),
    (3390000, 3415999),
    (9500000, 9509999),
)


@dataclass(frozen=True)
class TrajectoryConfig:
    """Controlled initial condition for one single-contact episode.

    ``seed`` identifies the episode. It does not draw a hidden physical
    parameter. Two runs with the same config produce the same samples.
    """

    seed: int
    normal_force_n: float
    commanded_velocity_m_s: float
    radius_m: float
    mu_static: float = 0.65
    mu_kinetic: float = 0.55
    dt_s: float = 0.001
    max_steps: int = 800
    require_valid_domain: bool = False
    geometry: str = "spherical"
    punch_radius_m: float = 0.003
    corner_radius_m: float = 0.001

    @property
    def episode_id(self) -> str:
        return f"p4t1-{self.geometry}-seed{int(self.seed)}"


# Three spherical episodes used as the checked-in fixture set.
# Commanded speeds stay under the kernel passivity limit at these loads
# (v_passive scales with mu_k * Fn / sigma_1^2).
FIXTURE_CONFIGS: Tuple[TrajectoryConfig, ...] = (
    TrajectoryConfig(
        seed=4100101,
        normal_force_n=1.5,
        commanded_velocity_m_s=0.004,
        radius_m=0.008,
    ),
    TrajectoryConfig(
        seed=4100102,
        normal_force_n=1.2,
        commanded_velocity_m_s=0.0035,
        radius_m=0.010,
    ),
    TrajectoryConfig(
        seed=4100103,
        normal_force_n=2.0,
        commanded_velocity_m_s=0.0045,
        radius_m=0.012,
    ),
)


def rounded_punch_rejection_config(seed: int = 4100101) -> TrajectoryConfig:
    """Geometry the frozen kernel rejects when require_valid_domain is set.

    FlatPunchContact with a positive corner radius raises ValueError inside
    step_composed_hybrid before any state mutation of the LuGre record.
    """

    return TrajectoryConfig(
        seed=seed,
        normal_force_n=1.5,
        commanded_velocity_m_s=0.004,
        radius_m=0.008,
        require_valid_domain=True,
        geometry="rounded_punch",
        punch_radius_m=0.003,
        corner_radius_m=0.001,
    )
