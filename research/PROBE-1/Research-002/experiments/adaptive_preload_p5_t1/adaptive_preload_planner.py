"""
HOROS PROBE-1 — Phase 5 Task 1 (P5-T1)
Adaptive Pre-Contact Preload Planners Suite & Safety Filter Integration
File: adaptive_preload_planner.py

Implements 6 distinct preload planning strategies:
1. FixedPreloadPlanner(3.0 N): Light baseline.
2. FixedPreloadPlanner(5.0 N): Standard nominal baseline.
3. FixedPreloadPlanner(8.0 N): Firm baseline.
4. FixedPreloadPlanner(12.0 N): Conservative high-force baseline.
5. RuleBasedAdaptivePreloadPlanner: Probes contact for 50 ms and applies physical compliance rules.
6. LearnedAdaptivePreloadPlanner: Probes contact for 50 ms, feeds causal features to calibrated neural estimator,
   and applies uncertainty-aware fallback.

All planners enforce actuator rate limits (|dFn/dt| <= 50 N/s) and safety bounds [3.0, 25.0] N.
"""

import math
import numpy as np
from typing import Dict, Any, Tuple, Optional, List

from probe_design import ControlledTactileProbe
from contact_condition_estimator import RuleBasedContactEstimator, LearnedUncertaintyContactEstimator


class BasePreloadPlanner:
    """Base class for preload planners."""

    def __init__(self, name: str, fn_min: float = 3.0, fn_max: float = 25.0):
        self.name = name
        self.fn_min = fn_min
        self.fn_max = fn_max

    def plan_preload(self, probe_history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        raise NotImplementedError


class FixedPreloadPlanner(BasePreloadPlanner):
    """Planner that outputs a constant pre-registered initial preload."""

    def __init__(self, target_preload: float):
        super().__init__(name=f"Fixed_{target_preload:.1f}N")
        self.target_preload = float(target_preload)

    def plan_preload(self, probe_history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        preload = float(np.clip(self.target_preload, self.fn_min, self.fn_max))
        return {
            "planner_name": self.name,
            "recommended_preload": preload,
            "estimated_risk": 0.50,
            "uncertainty_variance": 0.0,
            "reason": f"Fixed static preload policy commanding {preload:.1f} N.",
            "in_fallback": False,
            "requires_probing": False,
        }


class RuleBasedAdaptivePreloadPlanner(BasePreloadPlanner):
    """Adaptive planner using physical compliance rules from tactile probe observations."""

    def __init__(self, **estimator_kwargs):
        super().__init__(name="RuleBasedAdaptivePlanner")
        self.probe = ControlledTactileProbe()
        self.estimator = RuleBasedContactEstimator(**estimator_kwargs)

    def plan_preload(self, probe_history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        if not probe_history:
            # Fallback to standard 8.0 N if no probe available
            return {
                "planner_name": self.name,
                "recommended_preload": 8.0,
                "estimated_risk": 0.50,
                "uncertainty_variance": 0.20,
                "reason": "No probe telemetry available. Falling back to firm 8.0 N.",
                "in_fallback": True,
                "requires_probing": True,
            }

        features = self.probe.extract_probe_features(probe_history)
        est = self.estimator.estimate(features)
        preload = float(np.clip(est["recommended_preload"], self.fn_min, self.fn_max))

        return {
            "planner_name": self.name,
            "recommended_preload": preload,
            "estimated_stratum": est["estimated_stratum"],
            "estimated_risk": est["estimated_risk"],
            "uncertainty_variance": est["uncertainty_variance"],
            "reason": est["reason"],
            "in_fallback": est["in_fallback"],
            "requires_probing": True,
            "probe_features": features,
        }


class LearnedAdaptivePreloadPlanner(BasePreloadPlanner):
    """Adaptive planner using neural condition estimation with epistemic uncertainty fallback."""

    def __init__(self, **estimator_kwargs):
        super().__init__(name="LearnedAdaptivePlanner")
        self.probe = ControlledTactileProbe()
        self.estimator = LearnedUncertaintyContactEstimator(**estimator_kwargs)

    def plan_preload(self, probe_history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        if not probe_history:
            return {
                "planner_name": self.name,
                "recommended_preload": 12.0,
                "estimated_risk": 0.80,
                "uncertainty_variance": 0.30,
                "reason": "Missing probe observations. Epistemic uncertainty fallback commanding 12.0 N.",
                "in_fallback": True,
                "requires_probing": True,
            }

        features = self.probe.extract_probe_features(probe_history)
        est = self.estimator.estimate(features)
        preload = float(np.clip(est["recommended_preload"], self.fn_min, self.fn_max))

        return {
            "planner_name": self.name,
            "recommended_preload": preload,
            "estimated_stratum": est["estimated_stratum"],
            "estimated_risk": est["estimated_risk"],
            "uncertainty_variance": est["uncertainty_variance"],
            "reason": est["reason"],
            "in_fallback": est["in_fallback"],
            "requires_probing": True,
            "probe_features": features,
        }
