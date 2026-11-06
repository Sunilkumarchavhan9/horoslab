"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.5 — Five-Way Integrated Evaluation: Safety Evaluator

Evaluates empirical runtime safety and performance trade-offs:
1. Safety Violation Tracking (Force, Torque, Dynamic Crush limits).
2. p-CBF Intervention Frequency & False Rejection Analysis.
3. Safety-Induced Conservatism / Stall Rate.
4. Five-Category Failure Taxonomy Classification:
   - Temporal Truncation (F_trunc)
   - Gross Slip (F_slip)
   - Jamming / Wedging Lockout (F_jam)
   - Safety Intervention Stall (F_stall)
   - Dynamic Crush Violation (F_crush)
"""

from __future__ import annotations
from typing import Dict, Any, List, Tuple, Optional
import numpy as np

from src.safety.pcbf_safety_filter import PredictiveCBFSafetyFilter
from src.integrated.statistical_analysis import format_count_pct, compute_wilson_ci


class SafetyEvaluator:
    """
    Evaluates safety filter interventions, violations, conservatism trade-offs,
    and failure taxonomy classifications under P2.5 specifications.
    """

    def __init__(
        self,
        task: str = "peg_in_hole",
        max_normal_force: float = 35.0,
        max_torque: float = 7.0,
        max_fingertip_force: float = 25.0,
    ):
        self.task = task
        self.max_normal_force = max_normal_force
        self.max_torque = max_torque
        self.max_fingertip_force = max_fingertip_force

    def create_safety_filter(self) -> PredictiveCBFSafetyFilter:
        """Instantiates a fresh p-CBF filter."""
        return PredictiveCBFSafetyFilter(
            max_normal_force=self.max_normal_force,
            max_torque=self.max_torque,
        )

    def check_safety_violation(self, obs: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Evaluates physical observation for hard constraint violations.
        Returns (is_violated, violation_type).
        """
        if self.task == "peg_in_hole":
            wrench = obs.get("wrench", np.zeros(6))
            force_mag = float(np.linalg.norm(wrench[:3]))
            torque_mag = float(np.linalg.norm(wrench[3:6]))

            if force_mag > self.max_normal_force:
                return True, "force_limit_exceeded"
            if torque_mag > self.max_torque:
                return True, "torque_limit_exceeded"
            return False, "none"

        else:  # multifinger_lift
            finger_fn = obs.get("finger_fn", np.zeros(4))
            max_fn = float(np.max(finger_fn)) if len(finger_fn) > 0 else 0.0

            if max_fn > self.max_fingertip_force:
                return True, "crush_damage_exceeded"
            return False, "none"

    def classify_failure_mode(
        self,
        is_success: bool,
        env_state: Dict[str, Any],
        interventions_in_episode: int,
        total_steps: int,
        eval_horizon: int,
    ) -> str:
        """
        Classifies non-successful episode into one of 5 mutually exclusive failure taxonomy bins:
        1. temporal_truncation: Stable progress, no violation/jamming/crush, but hit step limit.
        2. gross_slip: Slip ratio exceeded friction cone in multifinger lift.
        3. jamming_wedging: Wedging/jamming in peg-in-hole.
        4. safety_intervention_stall: High intervention count resulting in zero progress.
        5. dynamic_crush: Fingertip normal force or contact wrench structural limit exceeded.
        """
        if is_success:
            return "success"

        # 1. Dynamic crush / force violation
        is_viol, viol_type = self.check_safety_violation(env_state)
        if is_viol or env_state.get("safety_violated", False) or env_state.get("crush_violated", False):
            return "dynamic_crush"

        # 2. Safety intervention stall
        if interventions_in_episode >= 5 and env_state.get("stalled", False):
            return "safety_intervention_stall"

        # 3. Task-specific physical failure modes
        if self.task == "peg_in_hole":
            if env_state.get("jammed", False) or env_state.get("wedged", False):
                return "jamming_wedging"
        else:
            if env_state.get("object_dropped", False) or env_state.get("slip_exceeded", False):
                return "gross_slip"

        # 4. Temporal truncation: reached eval_horizon with measurable progress but not full goal
        return "temporal_truncation"

    def audit_safety_performance(
        self,
        episodes_with_filter: List[Dict[str, Any]],
        episodes_without_filter: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Aggregates safety violations, intervention counts, stall rates,
        and failure taxonomy distributions across test episodes.
        """
        n_eps = len(episodes_with_filter)
        if n_eps == 0:
            return {"error": "No episodes provided for safety audit"}

        total_decisions = sum(ep.get("steps", len(ep.get("decisions", []))) for ep in episodes_with_filter)
        total_interventions = sum(ep.get("intervention_count", 0) for ep in episodes_with_filter)
        total_decisions = max(total_decisions, total_interventions)
        episodes_with_violation = sum(1 for ep in episodes_with_filter if ep.get("has_violation", False))
        episodes_stalled = sum(1 for ep in episodes_with_filter if ep.get("is_stalled", False))
        episodes_successful = sum(1 for ep in episodes_with_filter if ep.get("is_success", False))

        # Failure Taxonomy Bins
        taxonomy_counts = {
            "temporal_truncation": 0,
            "gross_slip": 0,
            "jamming_wedging": 0,
            "safety_intervention_stall": 0,
            "dynamic_crush": 0,
        }

        for ep in episodes_with_filter:
            f_mode = ep.get("failure_mode")
            if f_mode in taxonomy_counts:
                taxonomy_counts[f_mode] += 1

        # False Rejection Analysis (if ablation without filter is provided)
        false_rejection_count = 0
        if episodes_without_filter and len(episodes_without_filter) == n_eps:
            for ep_filt, ep_raw in zip(episodes_with_filter, episodes_without_filter):
                # An intervention is a false rejection if the filter intervened, but the raw unconstrained episode also did not violate safety
                if ep_filt.get("intervention_count", 0) > 0 and not ep_raw.get("has_violation", False):
                    false_rejection_count += 1

        unfiltered_violations = sum(1 for ep in episodes_without_filter if ep.get("has_violation", False)) if episodes_without_filter else None

        return {
            "total_episodes": n_eps,
            "total_decisions": total_decisions,
            "observed_safety_violations": format_count_pct(episodes_with_violation, n_eps),
            "safety_interventions": format_count_pct(total_interventions, max(1, total_decisions)),
            "episodes_with_interventions": format_count_pct(
                sum(1 for ep in episodes_with_filter if ep.get("intervention_count", 0) > 0), n_eps
            ),
            "stall_rate": format_count_pct(episodes_stalled, n_eps),
            "task_success_rate": format_count_pct(episodes_successful, n_eps),
            "failure_taxonomy": {
                k: format_count_pct(v, n_eps) for k, v in taxonomy_counts.items()
            },
            "safety_filter_ablation": {
                "violations_with_pcbf": format_count_pct(episodes_with_violation, n_eps),
                "violations_without_pcbf": format_count_pct(unfiltered_violations, n_eps) if unfiltered_violations is not None else "N/A",
                "false_rejections": format_count_pct(false_rejection_count, n_eps),
            },
            "empirical_status_note": (
                "Zero observed violations is an empirical observation over finite evaluation samples, "
                "not a formal mathematical safety guarantee."
            )
        }
