"""P4-T1 single-contact partial-slip trajectory contract."""

from .generator import DomainRejection, SeedAllocationError, generate_episode
from .recorder import generate_and_record
from .schema import FIXTURE_CONFIGS, OBSERVABLE_CHANNELS, TrajectoryConfig
from .validation import assess_partial_slip_softening, build_coulomb_cliff_observable

__all__ = [
    "DomainRejection",
    "FIXTURE_CONFIGS",
    "OBSERVABLE_CHANNELS",
    "SeedAllocationError",
    "TrajectoryConfig",
    "assess_partial_slip_softening",
    "build_coulomb_cliff_observable",
    "generate_and_record",
    "generate_episode",
]
