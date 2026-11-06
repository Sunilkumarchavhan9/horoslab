"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.4 — Active Contact-Mode Mining: Episode Deduplicator

Enforces a Trajectory Diversity Filter to prevent redundant failure modes
from consuming the active collection budget:
- Computes trajectory distance using normalized continuous state distance + contact mode discrepancy.
- Evaluates candidate rollouts in descending acquisition score order.
- Rejects candidates that are within d_min distance of already admitted episodes.
"""

from __future__ import annotations
from typing import Dict, Any, List, Optional
import numpy as np


class EpisodeDeduplicator:
    """
    Filters redundant candidate trajectories using state-space and contact-mode sequence distance.
    """

    def __init__(
        self,
        d_min: float = 0.25,
        mode_weight: float = 0.50,
        state_scale: Optional[np.ndarray] = None
    ):
        self.d_min = d_min
        self.mode_weight = mode_weight
        self.state_scale = state_scale

    def compute_trajectory_distance(
        self,
        traj_a: Dict[str, Any],
        traj_b: Dict[str, Any]
    ) -> float:
        """
        Computes normalized distance between two trajectories:
        d(A, B) = (1/H) sum ||s_t^A - s_t^B|| / sigma_s + lambda_mode * (1 - mode_match_rate)
        """
        states_a = traj_a.get("realized_states")
        states_b = traj_b.get("realized_states")

        if states_a is None or states_b is None or len(states_a) == 0 or len(states_b) == 0:
            return float("inf")

        H = min(len(states_a), len(states_b))
        if H == 0:
            return float("inf")

        # 1. State distance
        diff_s = np.abs(states_a[:H] - states_b[:H])
        if self.state_scale is not None:
            scale = np.maximum(self.state_scale, 1e-4)
            diff_s = diff_s / scale
        state_dist = float(np.mean(np.linalg.norm(diff_s, axis=-1)))

        # 2. Contact mode sequence discrepancy
        modes_a = traj_a.get("realized_modes")
        modes_b = traj_b.get("realized_modes")
        if modes_a is not None and modes_b is not None and len(modes_a) >= H and len(modes_b) >= H:
            match_rate = float(np.mean(np.array(modes_a[:H]) == np.array(modes_b[:H])))
            mode_dist = 1.0 - match_rate
        else:
            mode_dist = 0.5

        return float(state_dist + self.mode_weight * mode_dist)

    def filter_and_select(
        self,
        ranked_candidates: List[Dict[str, Any]],
        budget: int = 60
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Processes ranked candidates in descending order, admitting non-redundant trajectories.
        Returns:
            - admitted_trajectories: list of length <= budget
            - rejected_trajectories: list of candidates filtered out due to redundancy
        """
        admitted: List[Dict[str, Any]] = []
        rejected: List[Dict[str, Any]] = []

        for candidate in ranked_candidates:
            if len(admitted) >= budget:
                rejected.append(candidate)
                continue

            if len(admitted) == 0:
                admitted.append(candidate)
                continue

            # Check minimum distance to all already admitted trajectories
            min_dist = min(self.compute_trajectory_distance(candidate, adm) for adm in admitted)
            if min_dist >= self.d_min:
                candidate["min_diversity_distance"] = round(min_dist, 4)
                admitted.append(candidate)
            else:
                candidate["rejection_reason"] = f"Redundant: min_dist={min_dist:.4f} < {self.d_min}"
                rejected.append(candidate)

        return admitted, rejected
