"""
HOROS PROBE-1 — Research-002: Stage P2.3 Selection-Aware Calibration Module
"""

from src.selection_aware.planner_fingerprint import PlannerFingerprint
from src.selection_aware.counterfactual_rollout import CounterfactualRolloutEngine
from src.selection_aware.episode_conformal_engine import (
    EpisodeConformalEngine,
    compute_aps_score,
    compute_wilson_ci
)
from src.selection_aware.cap_online_selective import CAPOnlineSelectivePredictor

__all__ = [
    "PlannerFingerprint",
    "CounterfactualRolloutEngine",
    "EpisodeConformalEngine",
    "compute_aps_score",
    "compute_wilson_ci",
    "CAPOnlineSelectivePredictor"
]

