"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.5 — Five-Way Integrated Evaluation: Calibration Runner

Executes dual conformal calibration regimes:
1. CMS-PSACD (Proposed): 7-mode stratified, planner-selection-aware calibration on Target A/B.
2. Unstratified Split Conformal (Matched Baseline Ablation): Global scalar calibration without mode separation.
"""

from __future__ import annotations
import math
from typing import Dict, Any, List, Tuple, Optional
import numpy as np

from src.selection_aware.episode_conformal_engine import EpisodeConformalEngine, compute_wilson_ci
from src.integrated.statistical_analysis import format_count_pct


class CalibrationRunner:
    """
    Dual conformal calibration runner supporting CMS-PSACD and unstratified split conformal baseline.
    """

    def __init__(
        self,
        alpha: float = 0.10,
        horizons: Tuple[int, ...] = (1, 3, 5, 10, 20),
        seed: int = 42
    ):
        self.alpha = alpha
        self.horizons = horizons
        self.seed = seed

    def calibrate_cms_psacd(
        self,
        calib_episodes: List[Dict[str, Any]],
    ) -> EpisodeConformalEngine:
        """
        Calibrates the full CMS-PSACD engine on calibration episodes.
        Solves mode-stratified quantiles and simultaneous episode max scores.
        """
        engine = EpisodeConformalEngine(
            alpha=self.alpha,
            horizons=self.horizons,
            min_stratum_samples=5,
            seed=self.seed
        )
        engine.calibrate(calib_episodes)
        return engine

    def calibrate_unstratified_baseline(
        self,
        calib_episodes: List[Dict[str, Any]],
    ) -> Dict[str, float]:
        """
        Calibrates unstratified split-conformal baseline (single global quantile across all modes).
        """
        n = len(calib_episodes)
        if n == 0:
            raise ValueError("Cannot calibrate with 0 episodes.")

        all_state_errors = []
        all_wrench_errors = []

        for ep in calib_episodes:
            for dec in ep.get("decisions", []):
                t_s = dec.get("realized_states")
                p_s = dec.get("pred_states")
                t_w = dec.get("realized_wrenches")
                p_w = dec.get("pred_wrenches")
                if t_s is not None and p_s is not None and len(t_s) > 0:
                    err_s = float(np.max(np.abs(t_s - p_s)))
                    all_state_errors.append(err_s)
                if t_w is not None and p_w is not None and len(t_w) > 0:
                    err_w = float(np.max(np.abs(t_w - p_w)))
                    all_wrench_errors.append(err_w)

        k_idx = int(math.ceil((len(all_state_errors) + 1) * (1.0 - self.alpha)))
        k_s = min(len(all_state_errors) - 1, max(0, k_idx - 1))
        q_s_global = float(sorted(all_state_errors)[k_s]) if len(all_state_errors) > 0 else float("inf")

        k_w_idx = int(math.ceil((len(all_wrench_errors) + 1) * (1.0 - self.alpha)))
        k_w = min(len(all_wrench_errors) - 1, max(0, k_w_idx - 1))
        q_w_global = float(sorted(all_wrench_errors)[k_w]) if len(all_wrench_errors) > 0 else float("inf")

        return {
            "q_state_unstratified": round(q_s_global, 4),
            "q_wrench_unstratified": round(q_w_global, 4),
            "state_interval_width": round(2.0 * q_s_global, 4),
            "wrench_interval_width": round(2.0 * q_w_global, 4),
        }

    def evaluate_calibration_regimes(
        self,
        engine_cms: EpisodeConformalEngine,
        unstrat_quantiles: Dict[str, float],
        test_episodes: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Evaluates test episodes under both CMS-PSACD and the unstratified baseline ablation.
        """
        # 1. CMS-PSACD evaluation
        eval_cms = engine_cms.evaluate_test_episodes(test_episodes, use_stratified=True)

        # 2. Unstratified baseline evaluation
        q_s = unstrat_quantiles["q_state_unstratified"]
        q_w = unstrat_quantiles["q_wrench_unstratified"]
        N = len(test_episodes)
        unstrat_s_hits = 0
        unstrat_w_hits = 0
        unstrat_joint_hits = 0

        for ep in test_episodes:
            scores = engine_cms.compute_episode_scores(ep)
            s_ok = scores["state"] <= q_s
            w_ok = scores["wrench"] <= q_w
            if s_ok: unstrat_s_hits += 1
            if w_ok: unstrat_w_hits += 1
            if s_ok and w_ok: unstrat_joint_hits += 1

        return {
            "cms_psacd": {
                "marginal_state": eval_cms["episode_marginal_coverage"]["state"],
                "marginal_wrench": eval_cms["episode_marginal_coverage"]["wrench"],
                "marginal_mode": eval_cms["episode_marginal_coverage"]["mode"],
                "joint_simultaneous": eval_cms["episode_joint_coverage"]["joint_simultaneous"],
                "prediction_intervals": {
                    "q_state": round(engine_cms.q_state_marginal, 4),
                    "q_wrench": round(engine_cms.q_wrench_marginal, 4),
                    "state_width": round(2.0 * engine_cms.q_state_marginal, 4),
                    "wrench_width": round(2.0 * engine_cms.q_wrench_marginal, 4),
                },
                "pointwise_horizons": eval_cms.get("pointwise_horizon_diagnostic", {}),
            },
            "unstratified_ablation": {
                "marginal_state": format_count_pct(unstrat_s_hits, N),
                "marginal_wrench": format_count_pct(unstrat_w_hits, N),
                "joint_simultaneous": format_count_pct(unstrat_joint_hits, N),
                "prediction_intervals": {
                    "q_state": q_s,
                    "q_wrench": q_w,
                    "state_width": unstrat_quantiles["state_interval_width"],
                    "wrench_width": unstrat_quantiles["wrench_interval_width"],
                }
            }
        }

