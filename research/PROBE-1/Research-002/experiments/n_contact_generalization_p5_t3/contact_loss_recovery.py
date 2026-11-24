"""
HOROS PROBE-1 — Phase 5 Task 3 (P5-T3)
N-Contact Generalization & Cooperative Physical Intelligence
File: contact_loss_recovery.py

Detects sudden contact loss events and computes immediate cooperative force redistribution
to remaining active contacts to prevent object drop or catastrophic runaway.
"""

import math
import numpy as np
from typing import Dict, Any, List, Tuple, Optional


class ContactLossRecoveryManager:
    """
    Monitors contact states across N contacts.
    When a contact loss is detected (Fn drops near 0 or is_active becomes False),
    dynamically computes load transfer to the remaining active contacts.
    """

    def __init__(
        self,
        num_contacts: int,
        base_fn: float = 8.0,
        fn_min: float = 3.0,
        fn_max: float = 25.0,
    ):
        self.num_contacts = num_contacts
        self.base_fn = base_fn
        self.fn_min = fn_min
        self.fn_max = fn_max
        self.lost_contacts = set()

    def reset(self):
        self.lost_contacts.clear()

    def update(self, contact_obs_list: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes per-contact telemetry to detect contact loss or recovery.
        Returns:
            - active_indices: list of active contact IDs
            - lost_indices: list of lost contact IDs
            - redistribution_weights: list of weights for allocating missing normal force
        """
        active_indices = []
        newly_lost = []
        newly_recovered = []

        for i, c_obs in enumerate(contact_obs_list):
            is_active = bool(c_obs.get("is_active", True)) and (c_obs.get("force_n", 0.0) > 0.5)
            if is_active:
                active_indices.append(i)
                if i in self.lost_contacts:
                    self.lost_contacts.remove(i)
                    newly_recovered.append(i)
            else:
                if i not in self.lost_contacts:
                    self.lost_contacts.add(i)
                    newly_lost.append(i)

        n_active = len(active_indices)
        weights = [0.0] * self.num_contacts

        if n_active > 0:
            for idx in active_indices:
                weights[idx] = 1.0 / float(n_active)

        return {
            "active_indices": active_indices,
            "lost_indices": list(self.lost_contacts),
            "newly_lost": newly_lost,
            "newly_recovered": newly_recovered,
            "redistribution_weights": weights,
            "in_loss_mode": len(self.lost_contacts) > 0,
        }
