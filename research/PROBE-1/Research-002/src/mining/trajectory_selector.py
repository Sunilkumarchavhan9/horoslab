"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.4 — Active Contact-Mode Mining: Trajectory Selector

Orchestrates candidate generation, multi-objective scoring, diversity deduplication,
and budget selection for strategies D1, D2, D3, and D4.
"""

from __future__ import annotations
import time
from typing import Dict, Any, List, Optional, Tuple
import numpy as np

from src.mining.acquisition_scorer import AcquisitionScorer
from src.mining.contact_boundary_sampler import ContactBoundarySampler
from src.mining.episode_deduplicator import EpisodeDeduplicator


class TrajectorySelector:
    """
    Selects top-ranked, deduplicated trajectories from candidate exploration pools.
    """

    def __init__(
        self,
        task: str = "peg_in_hole",
        budget: int = 60,
        d_min: float = 0.25,
        weights: Optional[Dict[str, float]] = None,
        seed: int = 2000,
    ):
        self.task = task
        self.budget = budget
        self.seed = seed
        self.sampler = ContactBoundarySampler(task=task, seed=seed)
        self.scorer = AcquisitionScorer(weights=weights)
        self.deduplicator = EpisodeDeduplicator(d_min=d_min)

    def mine_trajectories(
        self,
        strategy: str,
        num_candidates: int = 150,
        start_seed: int = 2000,
        horizon: int = 25
    ) -> Dict[str, Any]:
        """
        Executes active mining pipeline:
        1. Samples candidate rollouts.
        2. Scores candidates via multi-objective acquisition signals.
        3. Filters redundant candidates via episode deduplication.
        4. Selects top candidates up to budget K.
        """
        t0 = time.time()

        # 1. Propose candidate rollouts
        candidates = self.sampler.generate_candidate_batch(
            strategy=strategy,
            num_candidates=num_candidates,
            start_seed=start_seed,
            horizon=horizon
        )

        # 2. Score candidates
        if strategy == "D1_random":
            # Random exploration doesn't use active scoring; shuffle or rank by index
            ranked_candidates = [dict(c, acquisition_score=0.0, acquisition_rank=i+1) for i, c in enumerate(candidates)]
        elif strategy == "D2_boundary":
            ranked_candidates = self.scorer.rank_trajectories(
                candidates, task=self.task,
                override_weights={"mode_uncertainty": 0.10, "prediction_disagreement": 0.10,
                                  "contact_boundary": 0.60, "planner_optimism": 0.10, "recovery_value": 0.10}
            )
        elif strategy == "D3_uncertainty":
            ranked_candidates = self.scorer.rank_trajectories(
                candidates, task=self.task,
                override_weights={"mode_uncertainty": 0.50, "prediction_disagreement": 0.50,
                                  "contact_boundary": 0.0, "planner_optimism": 0.0, "recovery_value": 0.0}
            )
        else:  # D4_acmm
            ranked_candidates = self.scorer.rank_trajectories(candidates, task=self.task)

        # 3. Deduplication and budget selection
        if strategy == "D1_random":
            admitted = ranked_candidates[:self.budget]
            rejected = ranked_candidates[self.budget:]
        else:
            admitted, rejected = self.deduplicator.filter_and_select(ranked_candidates, budget=self.budget)

        elapsed = time.time() - t0

        # Calculate statistics
        modes_discovered = set()
        for traj in admitted:
            for m in traj.get("realized_modes", []):
                modes_discovered.add(int(m))

        success_count = sum(1 for t in admitted if t.get("success", False))

        return {
            "strategy": strategy,
            "task": self.task,
            "total_candidates": len(candidates),
            "admitted_count": len(admitted),
            "rejected_count": len(rejected),
            "budget": self.budget,
            "elapsed_seconds": round(elapsed, 2),
            "unique_contact_modes": sorted(list(modes_discovered)),
            "num_unique_modes": len(modes_discovered),
            "success_count_in_mined": success_count,
            "admitted_trajectories": admitted,
            "rejected_trajectories": rejected,
        }
