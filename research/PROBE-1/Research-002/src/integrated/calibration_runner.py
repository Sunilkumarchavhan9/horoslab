"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.5 / P2.8 — Five-Way Integrated Evaluation: Calibration Runner & Pool Registry

Executes dual conformal calibration regimes under Document 53 Revision 1.1 bounds:
1. CMS-PSACD (Proposed): 7-mode stratified, planner-selection-aware calibration on Target A/B
   with 90% primary coverage target (alpha = 0.10), N_calib = 60, minimum per-mode sample count = 29,
   finite global fallback when undersampled, and explicit fallback_to_global logging.
2. Unstratified Split Conformal (Matched Baseline Ablation): Global scalar calibration without mode separation.
3. Canonical Disjoint Phase 3 Seed Pool Registry across Training, Calibration (Lift & PegInHole),
   Offline Test, Closed-Loop Benchmark, and Excluded P2.6 Pilot Pools.
"""

from __future__ import annotations
import math
from typing import Dict, Any, List, Tuple, Optional
import numpy as np

from src.selection_aware.episode_conformal_engine import (
    EpisodeConformalEngine,
    PRIMARY_ALPHA,
    PRIMARY_TARGET_COVERAGE,
    PRIMARY_N_CALIB,
    SECONDARY_N_CALIB_95,
    NUM_CONFORMAL_CHANNELS,
    compute_min_calib_samples,
    recommended_n_calib,
    compute_wilson_ci,
)
from src.integrated.statistical_analysis import format_count_pct


PHASE3_SEED_POOLS: Dict[str, List[int]] = {
    # Pre-eval training & ACMM mining pools (60 episodes each)
    "training_compliant_prelift": list(range(1000, 1060)),
    "training_peg_in_hole": list(range(1100, 1160)),
    # Pre-eval primary conformal calibration pools (alpha = 0.10, N_calib = 60 each)
    "calib_compliant_prelift": list(range(2000, 2060)),
    "calib_peg_in_hole": list(range(2100, 2160)),
    # Disjoint secondary +60 extension pools if optional alpha = 0.05 (N = 120) check is run
    "calib_95_extension_compliant_prelift": list(range(2200, 2260)),
    "calib_95_extension_peg_in_hole": list(range(2300, 2360)),
    # Additional offline OOD & conformal evaluation pools (40 + 40 + 40 = 120 episodes)
    "offline_test_id": list(range(3000, 3040)),
    "offline_test_ood": list(range(3040, 3080)),
    "offline_test_peg_in_hole": list(range(3080, 3120)),
    # Closed-loop benchmark matrix paired seed blocks (25 per regime)
    "closed_loop_id": list(range(6000, 6025)),
    "closed_loop_ood": list(range(6100, 6125)),
    "closed_loop_peg_in_hole": list(range(6200, 6225)),
    # Excluded P2.6 historical pilot seeds (50 episodes across {42,142,242,342,442})
    "excluded_p26_pilot": sorted(
        {s + i for s in (42, 142, 242, 342, 442) for i in range(5)}
        | {42, 142, 242, 342, 442}
    ),
}


def _normalize_task_key(task: str) -> str:
    """Maps task aliases to canonical Phase 3 task keys."""
    if task == "peg_in_hole":
        return "peg_in_hole"
    if task in ("multifinger_lift", "compliant_prelift", "compliant_lift"):
        return "compliant_prelift"
    raise ValueError(f"Unsupported task '{task}' for Phase 3 seed pool lookup.")


def get_calibration_seed_pool(task: str, alpha: float = PRIMARY_ALPHA) -> List[int]:
    """
    Returns the task-specific disjoint conformal calibration seed pool:
    - compliant_prelift / multifinger_lift (alpha=0.10): 2000..2059 (60 episodes)
    - peg_in_hole (alpha=0.10): 2100..2159 (60 episodes)
    - If alpha <= 0.05 sensitivity check: appends task-specific disjoint 60-seed extension (120 episodes total).
    """
    key = _normalize_task_key(task)
    base_pool = list(PHASE3_SEED_POOLS[f"calib_{key}"])
    if alpha < PRIMARY_ALPHA - 1e-9:
        ext_pool = list(PHASE3_SEED_POOLS[f"calib_95_extension_{key}"])
        return base_pool + ext_pool
    return base_pool


def get_phase3_task_pools(task: str, alpha: float = PRIMARY_ALPHA) -> Dict[str, List[int]]:
    """
    Returns all non-overlapping training, calibration, offline eval, and closed-loop eval pools
    for the requested task after verifying global pairwise disjointness.
    """
    verify_disjoint_seed_pools()
    key = _normalize_task_key(task)
    if key == "peg_in_hole":
        return {
            "training": list(PHASE3_SEED_POOLS["training_peg_in_hole"]),
            "calibration": get_calibration_seed_pool(key, alpha=alpha),
            "offline_eval": list(PHASE3_SEED_POOLS["offline_test_peg_in_hole"]),
            "closed_loop_eval": list(PHASE3_SEED_POOLS["closed_loop_peg_in_hole"]),
            "excluded_pilot": list(PHASE3_SEED_POOLS["excluded_p26_pilot"]),
        }
    return {
        "training": list(PHASE3_SEED_POOLS["training_compliant_prelift"]),
        "calibration": get_calibration_seed_pool(key, alpha=alpha),
        "offline_eval_id": list(PHASE3_SEED_POOLS["offline_test_id"]),
        "offline_eval_ood": list(PHASE3_SEED_POOLS["offline_test_ood"]),
        "closed_loop_id": list(PHASE3_SEED_POOLS["closed_loop_id"]),
        "closed_loop_ood": list(PHASE3_SEED_POOLS["closed_loop_ood"]),
        "excluded_pilot": list(PHASE3_SEED_POOLS["excluded_p26_pilot"]),
    }


def verify_disjoint_seed_pools(extra_pools: Optional[Dict[str, List[int]]] = None) -> Dict[str, Any]:
    """
    Verifies that every pair of Phase 3 seed pools (training, Lift calibration, PegInHole
    calibration, optional 95% extensions, offline eval, closed-loop eval, and excluded pilot)
    is strictly pairwise disjoint, and that both primary calibration pools contain 60 episodes.
    """
    pools: Dict[str, List[int]] = {k: list(v) for k, v in PHASE3_SEED_POOLS.items()}
    if extra_pools:
        pools.update({k: list(v) for k, v in extra_pools.items()})

    # Check individual pool duplicates
    for name, seeds in pools.items():
        if len(seeds) != len(set(seeds)):
            raise ValueError(f"Duplicate seed detected inside pool '{name}'.")

    # Verify primary 60-episode calibration pools
    if len(pools["calib_compliant_prelift"]) != PRIMARY_N_CALIB:
        raise ValueError(
            f"calib_compliant_prelift must have {PRIMARY_N_CALIB} seeds, got {len(pools['calib_compliant_prelift'])}"
        )
    if len(pools["calib_peg_in_hole"]) != PRIMARY_N_CALIB:
        raise ValueError(
            f"calib_peg_in_hole must have {PRIMARY_N_CALIB} seeds, got {len(pools['calib_peg_in_hole'])}"
        )

    names = list(pools.keys())
    overlaps = []
    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            s1, s2 = set(pools[names[i]]), set(pools[names[j]])
            common = sorted(s1 & s2)
            if common:
                overlaps.append((names[i], names[j], common))

    if overlaps:
        raise ValueError(f"Seed pool overlap violation detected: {overlaps}")

    return {
        "disjoint_verified": True,
        "pool_counts": {k: len(v) for k, v in pools.items()},
        "pairwise_overlap_count": 0,
    }


class CalibrationRunner:
    """
    Dual conformal calibration runner supporting CMS-PSACD and unstratified split conformal baseline.
    """

    def __init__(
        self,
        alpha: float = PRIMARY_ALPHA,
        horizons: Tuple[int, ...] = (1, 3, 5, 10, 20),
        min_calib_episodes: Optional[int] = None,
        min_stratum_samples: Optional[int] = None,
        seed: int = 42,
    ):
        if not (0.0 < alpha < 1.0):
            raise ValueError(f"alpha must lie strictly in (0, 1), got {alpha}")
        self.alpha = float(alpha)
        self.target_coverage = round(1.0 - self.alpha, 6)
        self.horizons = horizons
        self.seed = seed

        self.n_min_marginal = compute_min_calib_samples(self.alpha, 1)
        self.n_min_joint = compute_min_calib_samples(self.alpha, NUM_CONFORMAL_CHANNELS)
        self.recommended_n_calib = recommended_n_calib(self.alpha)

        self.min_calib_episodes = (
            int(min_calib_episodes) if min_calib_episodes is not None else self.recommended_n_calib
        )
        if self.min_calib_episodes < self.n_min_joint:
            raise ValueError(
                f"min_calib_episodes={self.min_calib_episodes} violates finite-sample Bonferroni floor "
                f"n_min_joint={self.n_min_joint} at alpha={self.alpha}."
            )
        if math.isclose(self.alpha, 0.05, rel_tol=1e-6) and self.min_calib_episodes < SECONDARY_N_CALIB_95:
            raise ValueError(
                f"95% confidence check (alpha=0.05) requires N_calib >= {SECONDARY_N_CALIB_95}; "
                f"cannot evaluate at min_calib_episodes={self.min_calib_episodes}."
            )

        requested_stratum_min = int(min_stratum_samples) if min_stratum_samples is not None else self.n_min_joint
        self.min_stratum_samples = max(requested_stratum_min, self.n_min_joint)

    def calibrate_cms_psacd(
        self,
        calib_episodes: List[Dict[str, Any]],
        enforce_n_calib: bool = True,
    ) -> EpisodeConformalEngine:
        """
        Calibrates the full CMS-PSACD engine on calibration episodes.
        Enforces N_calib >= self.min_calib_episodes (default 60 at alpha=0.10),
        minimum per-mode sample count >= 29 (at alpha=0.10), finite global fallback,
        and explicit fallback_to_global logging.
        """
        n_ep = len(calib_episodes)
        if n_ep == 0:
            raise ValueError("Cannot calibrate with 0 episodes.")
        if enforce_n_calib and n_ep < self.min_calib_episodes:
            raise ValueError(
                f"Insufficient calibration pool size: received {n_ep} episodes, "
                f"required N_calib >= {self.min_calib_episodes} for target coverage "
                f"{self.target_coverage:.0%} (alpha={self.alpha})."
            )

        engine = EpisodeConformalEngine(
            alpha=self.alpha,
            horizons=self.horizons,
            min_stratum_samples=self.min_stratum_samples,
            seed=self.seed,
        )
        engine.calibrate(calib_episodes, strict=True)
        return engine

    def calibrate_unstratified_baseline(
        self,
        calib_episodes: List[Dict[str, Any]],
        strict: bool = False,
    ) -> Dict[str, Any]:
        """
        Calibrates unstratified split-conformal baseline (single global quantile across all modes).
        Never clamps an infeasible order statistic k > n or silently marks infinite quantiles calibrated.
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

        def _marginal_quantile(errors: List[float]) -> Tuple[float, int, bool]:
            count = len(errors)
            if count == 0:
                return float("inf"), 1, False
            k_idx = int(math.ceil((count + 1) * (1.0 - self.alpha)))
            if k_idx > count:
                return float("inf"), k_idx, False
            return float(sorted(errors)[k_idx - 1]), k_idx, True

        q_s_global, k_s, s_finite = _marginal_quantile(all_state_errors)
        q_w_global, k_w, w_finite = _marginal_quantile(all_wrench_errors)
        is_calibrated = bool(s_finite and w_finite and math.isfinite(q_s_global) and math.isfinite(q_w_global))

        if strict and not is_calibrated:
            raise ValueError(
                f"Unstratified baseline infeasible: samples=(state:{len(all_state_errors)}, "
                f"wrench:{len(all_wrench_errors)}), n_min_marginal={self.n_min_marginal} (alpha={self.alpha})."
            )

        return {
            "alpha": self.alpha,
            "target_coverage": self.target_coverage,
            "n_episodes": n,
            "n_state_samples": len(all_state_errors),
            "n_wrench_samples": len(all_wrench_errors),
            "n_min_marginal": self.n_min_marginal,
            "calibrated": is_calibrated,
            "is_finite": is_calibrated,
            "q_state_unstratified": round(q_s_global, 4) if is_calibrated else float("inf"),
            "q_wrench_unstratified": round(q_w_global, 4) if is_calibrated else float("inf"),
            "state_interval_width": round(2.0 * q_s_global, 4) if is_calibrated else float("inf"),
            "wrench_interval_width": round(2.0 * q_w_global, 4) if is_calibrated else float("inf"),
        }

    def evaluate_calibration_regimes(
        self,
        engine_cms: EpisodeConformalEngine,
        unstrat_quantiles: Dict[str, Any],
        test_episodes: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Evaluates test episodes under both CMS-PSACD and the unstratified baseline ablation.
        Separately reports q_*_marginal and q_*_joint alongside fallback_to_global diagnostics.
        """
        if not engine_cms.calibrated or not engine_cms.joint_calibrated or engine_cms.has_infinite_quantiles:
            raise RuntimeError(
                f"Refusing to evaluate uncalibrated CMS-PSACD engine "
                f"(status={engine_cms.calibration_status}, n_calib={engine_cms.n_calib_episodes})."
            )

        q_s = unstrat_quantiles["q_state_unstratified"]
        q_w = unstrat_quantiles["q_wrench_unstratified"]
        if not unstrat_quantiles.get("calibrated", True) or not (math.isfinite(q_s) and math.isfinite(q_w)):
            raise RuntimeError("Refusing to evaluate uncalibrated or infinite unstratified baseline.")

        # 1. CMS-PSACD evaluation
        eval_cms = engine_cms.evaluate_test_episodes(test_episodes, use_stratified=True)

        # 2. Unstratified baseline evaluation
        N = len(test_episodes)
        unstrat_s_hits = 0
        unstrat_w_hits = 0
        unstrat_joint_hits = 0

        for ep in test_episodes:
            scores = engine_cms.compute_episode_scores(ep)
            s_ok = scores["state"] <= q_s
            w_ok = scores["wrench"] <= q_w
            if s_ok:
                unstrat_s_hits += 1
            if w_ok:
                unstrat_w_hits += 1
            if s_ok and w_ok:
                unstrat_joint_hits += 1

        return {
            "cms_psacd": {
                "alpha": engine_cms.alpha,
                "target_coverage": engine_cms.target_coverage,
                "n_calibration_episodes": engine_cms.n_calib_episodes,
                "min_stratum_samples": engine_cms.min_stratum_samples,
                "calibration_status": engine_cms.calibration_status,
                "calibrated": engine_cms.calibrated,
                "joint_calibrated": engine_cms.joint_calibrated,
                "marginal_calibrated": engine_cms.marginal_calibrated,
                "has_infinite_quantiles": engine_cms.has_infinite_quantiles,
                "any_fallback_to_global": engine_cms.any_fallback_to_global,
                "fallback_modes": eval_cms["fallback_modes"],
                "empirical_stratified_modes": eval_cms["empirical_stratified_modes"],
                "stratum_fallback_log": eval_cms["stratum_fallback_log"],
                "marginal_state": eval_cms["episode_marginal_coverage"]["state"],
                "marginal_wrench": eval_cms["episode_marginal_coverage"]["wrench"],
                "marginal_mode": eval_cms["episode_marginal_coverage"]["mode"],
                "joint_simultaneous": eval_cms["episode_joint_coverage"]["joint_simultaneous"],
                "marginal_quantiles": {
                    "q_state_marginal": round(engine_cms.q_state_marginal, 4),
                    "q_wrench_marginal": round(engine_cms.q_wrench_marginal, 4),
                    "q_mode_marginal": round(engine_cms.q_mode_marginal, 4),
                },
                "joint_quantiles": {
                    "q_state_joint": round(engine_cms.q_state_joint, 4),
                    "q_wrench_joint": round(engine_cms.q_wrench_joint, 4),
                    "q_mode_joint": round(engine_cms.q_mode_joint, 4),
                },
                "prediction_intervals": {
                    "q_state_marginal": round(engine_cms.q_state_marginal, 4),
                    "q_wrench_marginal": round(engine_cms.q_wrench_marginal, 4),
                    "q_mode_marginal": round(engine_cms.q_mode_marginal, 4),
                    "q_state_joint": round(engine_cms.q_state_joint, 4),
                    "q_wrench_joint": round(engine_cms.q_wrench_joint, 4),
                    "q_mode_joint": round(engine_cms.q_mode_joint, 4),
                    "state_width_marginal": round(2.0 * engine_cms.q_state_marginal, 4),
                    "wrench_width_marginal": round(2.0 * engine_cms.q_wrench_marginal, 4),
                    "state_width_joint": round(2.0 * engine_cms.q_state_joint, 4),
                    "wrench_width_joint": round(2.0 * engine_cms.q_wrench_joint, 4),
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
                },
            },
        }
