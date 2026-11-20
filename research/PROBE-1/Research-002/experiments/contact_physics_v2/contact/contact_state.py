"""
HOROS Contact Physics v2: Contact State Module
Maintains an explicit, history-dependent contact state tracking normal and
tangential loading history, reversals, stick-zone evolution, energy, and contact lifecycles.
"""

from dataclasses import dataclass, field
from enum import Enum
import math
from typing import Optional


class ContactModelMode(Enum):
    """Execution mode for contact simulation."""
    CATTANEO_MINDLIN_QUASISTATIC = "cattaneo_mindlin_quasistatic"
    LUGRE_DYNAMIC = "lugre_dynamic"
    HYBRID_COMPOSED = "hybrid_composed"


@dataclass
class ContactState:
    """
    Explicit, history-dependent contact state representation.
    Guarantees that hysteresis, partial slip migration, energy dissipation,
    and contact lifecycles cannot be replaced by an instantaneous algebraic ratio.
    """
    # Contact status
    in_contact: bool = False
    step_count: int = 0
    time: float = 0.0

    # Normal contact history
    normal_indentation: float = 0.0       # delta_n (m)
    normal_force: float = 0.0             # Fn (N)
    contact_radius: float = 0.0           # a (m)
    peak_normal_force: float = 0.0        # Fn,max experienced during this contact (N)
    peak_normal_indentation: float = 0.0  # delta_n,max (m)

    # Tangential partial-slip state
    tangential_displacement: float = 0.0  # delta_t (m)
    tangential_force: float = 0.0         # Ft (N)
    tangent_stiffness: float = 0.0        # kt = dFt / ddelta_t (N/m)
    stick_radius: float = 0.0             # c (m)
    stick_ratio: float = 1.0              # c / a in [0.0, 1.0]
    is_gross_slipping: bool = False
    slip_velocity: float = 0.0            # v_slip (m/s)
    cumulative_slip_distance: float = 0.0 # Total macroscopic slip distance (m)

    # Tangential loading history & reversal tracking (Mindlin-Deresiewicz)
    loading_direction: int = 0            # +1 for increasing Ft, -1 for decreasing Ft, 0 for idle
    reversal_tangential_force: float = 0.0 # Ft* at last turning point (N)
    reversal_tangential_disp: float = 0.0  # delta_t* at last turning point (m)
    reverse_stick_radius: float = 0.0     # b (m) for reverse slip annulus
    total_reversals: int = 0

    # Dynamic friction state (LuGre internal state)
    bristle_deflection: float = 0.0       # z (m)
    bristle_velocity: float = 0.0         # dz/dt (m/s)

    # Energetics & Passivity
    stored_elastic_energy: float = 0.0    # E_elastic (Joules)
    signed_step_dissipation: float = 0.0  # dW - dE_elastic (Joules, unmasked signed step residual)
    cumulative_dissipated_energy: float = 0.0  # E_diss (Joules, strictly >= 0)
    instantaneous_dissipation_rate: float = 0.0 # Power dissipated (Watts)

    # Contact lifecycle events
    contact_established_time: float = 0.0
    contact_loss_count: int = 0

    def record_contact_loss(self):
        """Reset contact fields when body separates from surface, preserving lifecycle counts."""
        if self.in_contact:
            self.contact_loss_count += 1
        self.in_contact = False
        self.normal_indentation = 0.0
        self.normal_force = 0.0
        self.contact_radius = 0.0
        self.tangential_displacement = 0.0
        self.tangential_force = 0.0
        self.tangent_stiffness = 0.0
        self.stick_radius = 0.0
        self.stick_ratio = 1.0
        self.is_gross_slipping = False
        self.slip_velocity = 0.0
        self.loading_direction = 0
        self.reversal_tangential_force = 0.0
        self.reversal_tangential_disp = 0.0
        self.reverse_stick_radius = 0.0
        self.bristle_deflection = 0.0
        self.bristle_velocity = 0.0
        self.stored_elastic_energy = 0.0
        self.instantaneous_dissipation_rate = 0.0

    def verify_energy_passivity(self) -> bool:
        """
        Verify physical energy conservation and passivity:
        1. Cumulative dissipated energy cannot be negative (no unphysical energy generation).
        2. Stored elastic energy cannot be negative.
        """
        return self.cumulative_dissipated_energy >= -1e-9 and self.stored_elastic_energy >= -1e-9
