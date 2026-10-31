"""
Benchmark baseline controllers for multifingered grasp comparison.
"""
from .baselines import (
    FixedForceBaseline,
    ReactiveSlipSqueezeBaseline,
    UnconstrainedFlowBaseline,
    DeterministicTactileMPCBaseline,
)

__all__ = [
    "FixedForceBaseline",
    "ReactiveSlipSqueezeBaseline",
    "UnconstrainedFlowBaseline",
    "DeterministicTactileMPCBaseline",
]
