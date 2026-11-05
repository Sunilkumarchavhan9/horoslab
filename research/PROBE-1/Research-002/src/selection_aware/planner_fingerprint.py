"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.3 — Planner Fingerprint Specification

Formal dataclass and hashing engine that guarantees calibration and test episodes
share an identical model, planner, simulator, and selection pipeline.
Any change that can change the selected-action distribution invalidates
the planner-matched calibration unless equivalence is formally established.
"""

from __future__ import annotations
from dataclasses import dataclass, field, asdict
import hashlib
import json
from typing import Dict, Any, Optional, Tuple


@dataclass(frozen=True)
class PlannerFingerprint:
    """
    Immutable representation of the complete prediction, planning, and simulation pipeline.
    All calibration and test episodes within a stratum must match this fingerprint exactly.
    """
    # 1. World Model Version & Preprocessing
    world_model_version: str
    state_dim: int
    action_dim: int
    hidden_dim: int
    preprocessing_version: str = "v1.0_identity_normalized"

    # 2. Planner Algorithm & Objective
    planner_algorithm: str = "CEM"
    reward_version: str = "v1.0_task_impedance"

    # 3. CEM Optimization Hyperparameters
    cem_pop_size: int = 150
    cem_num_iters: int = 4
    cem_horizon: int = 10
    cem_elite_frac: float = 0.10
    cem_smoothing: float = 0.80
    action_bounds_min: Tuple[float, ...] = (-5.0, -5.0, -5.0, -2.0, -2.0, -2.0)
    action_bounds_max: Tuple[float, ...] = (5.0, 5.0, 5.0, 2.0, 2.0, 2.0)

    # 4. Candidate Scoring & Tie-Breaking
    candidate_scoring_rule: str = "discounted_sum_return"
    tie_breaking_rule: str = "first_discovered"

    # 5. Replanning Cadence & Execution Mode
    replanning_cadence: int = 1
    execution_mode: str = "execute_first_action"

    # 6. Forecast Target Semantics: Must be 'selected_open_loop_plan' or 'closed_loop_policy'
    forecast_semantics: str = "selected_open_loop_plan"

    # 7. Uncertainty Penalty
    uncertainty_penalty_type: str = "none"  # "none", "ensemble_std", "pessimistic_conformal"
    uncertainty_beta: float = 0.0

    # 8. p-CBF Safety Filter Mode
    pcbf_mode: str = "empirical_runtime_filter"  # "none", "empirical_runtime_filter", "strict_barrier"
    pcbf_version: str = "v1.0_linearized_hc"
    force_limit_n: float = 40.0
    torque_limit_nm: float = 8.0

    # 9. Simulation Environment & Physics Config
    task_name: str = "peg_in_hole"
    env_version: str = "v1.0_contact_strata"
    sim_dt: float = 0.02
    clearance_mm: float = 0.50
    friction_coeff: float = 0.50

    def compute_hash(self) -> str:
        """Computes a deterministic SHA-256 fingerprint hash."""
        d = self.to_dict()
        # Sort keys for deterministic JSON serialization
        serialized = json.dumps(d, sort_keys=True, indent=None)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    def to_dict(self) -> Dict[str, Any]:
        """Serializes the fingerprint to a standard dictionary."""
        d = asdict(self)
        # Convert tuples to lists for JSON compatibility
        d["action_bounds_min"] = list(self.action_bounds_min)
        d["action_bounds_max"] = list(self.action_bounds_max)
        d["fingerprint_hash"] = ""  # placeholder
        return d

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> PlannerFingerprint:
        """Constructs a PlannerFingerprint instance from dictionary data."""
        clean_data = data.copy()
        clean_data.pop("fingerprint_hash", None)
        if "action_bounds_min" in clean_data and isinstance(clean_data["action_bounds_min"], list):
            clean_data["action_bounds_min"] = tuple(clean_data["action_bounds_min"])
        if "action_bounds_max" in clean_data and isinstance(clean_data["action_bounds_max"], list):
            clean_data["action_bounds_max"] = tuple(clean_data["action_bounds_max"])
        return cls(**clean_data)

    def validate_match(self, other: PlannerFingerprint) -> bool:
        """Returns True if two fingerprints match exactly in all parameters."""
        return self.compute_hash() == other.compute_hash()

    def assert_match(self, other: PlannerFingerprint, context_str: str = ""):
        """Raises ValueError with detailed diff if fingerprints do not match."""
        if not self.validate_match(other):
            diffs = []
            d1, d2 = self.to_dict(), other.to_dict()
            for k in d1:
                if d1[k] != d2.get(k):
                    diffs.append(f"  Field '{k}': expected {d1[k]}, got {d2.get(k)}")
            diff_msg = "\n".join(diffs)
            raise ValueError(
                f"PlannerFingerprint mismatch in {context_str}!\n"
                f"Hash mismatch: {self.compute_hash()} vs {other.compute_hash()}\n"
                f"Differences:\n{diff_msg}"
            )

