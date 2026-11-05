"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.3 — Episode-Level Conformal Calibration Engine

Implements split-conformal calibration for planner-selected trajectories:
- Computes nonconformity scores for state (r_x), wrench (r_F), and contact mode (r_mode via APS).
- Computes simultaneous episode scores S_c(i) = max_{t, h} r_c(i, t, h).
- Solves finite-sample conformal thresholds k = ceil((n + 1) * (1 - alpha)).
- Generates marginal thresholds and joint Bonferroni-allocated thresholds (alpha / 3).
- Conditions only on initial observed mode (known at prediction time), never on future modes.
- Provides exact integer counts and 95% Wilson binomial confidence intervals for all metrics.
"""

from __future__ import annotations
import math
from typing import Dict, Any, List, Optional, Tuple, Set
import numpy as np
from src.contact_modes.contact_mode_definitions import ContactMode, NUM_MODES


def compute_aps_score(prob_vec: np.ndarray, true_mode: int, rng: Optional[np.random.RandomState] = None) -> float:
    """
    Computes Adaptive Prediction Set (APS) nonconformity score for contact mode prediction:
    APS score is the cumulative sum of probabilities for modes with probability >= prob[true_mode],
    plus a uniform tie-breaker U * prob[true_mode].
    """
    true_mode = int(true_mode)
    p_true = float(prob_vec[true_mode])
    # Sum probabilities strictly greater than true mode
    score = float(np.sum(prob_vec[prob_vec > p_true]))
    # For tied probabilities (including true mode), apply randomized uniform tie-breaking
    tied_prob = float(np.sum(prob_vec[prob_vec == p_true]))
    u = float(rng.uniform(0.0, 1.0)) if rng is not None else 0.5
    score += u * tied_prob
    return float(np.clip(score, 0.0, 1.0))


def compute_wilson_ci(k: int, n: int, confidence: float = 0.95) -> Tuple[float, float]:
    """Computes Wilson score binomial confidence interval [lower, upper] for k successes out of n trials."""
    if n <= 0:
        return 0.0, 1.0
    z = 1.959963984540054  # 95% normal quantile
    p_hat = k / n
    denominator = 1.0 + z**2 / n
    center = (p_hat + z**2 / (2 * n)) / denominator
    margin = (z * math.sqrt(p_hat * (1.0 - p_hat) / n + z**2 / (4 * n**2))) / denominator
    lower = max(0.0, center - margin)
    upper = min(1.0, center + margin)
    return float(lower), float(upper)


class EpisodeConformalEngine:
    """
    Episode-level split-conformal calibration engine for planner-selection-aware trajectories.
    """

    def __init__(
        self,
        alpha: float = 0.10,
        horizons: Tuple[int, ...] = (1, 3, 5, 10, 20),
        min_stratum_samples: int = 5,
        state_scale: Optional[np.ndarray] = None,
        wrench_scale: Optional[np.ndarray] = None,
        seed: int = 42,
    ):
        self.alpha = alpha
        self.horizons = horizons
        self.min_stratum_samples = min_stratum_samples
        self.state_scale = state_scale
        self.wrench_scale = wrench_scale
        self.rng = np.random.RandomState(seed)

        # Fitted calibration thresholds
        self.calibrated = False
        self.n_calib_episodes = 0

        # Marginal episode thresholds at level alpha
        self.q_state_marginal = float("inf")
        self.q_wrench_marginal = float("inf")
        self.q_mode_marginal = float("inf")

        # Joint Bonferroni episode thresholds at level alpha/3
        self.alpha_state = alpha / 3.0
        self.alpha_wrench = alpha / 3.0
        self.alpha_mode = alpha / 3.0
        self.q_state_joint = float("inf")
        self.q_wrench_joint = float("inf")
        self.q_mode_joint = float("inf")

        # Stratified thresholds by initial mode (known at prediction time)
        self.stratified_q_joint: Dict[int, Dict[str, float]] = {}

    def compute_episode_scores(self, episode_data: Dict[str, Any]) -> Dict[str, float]:
        """
        Computes simultaneous episode scores S_c(i) = max_{t, h} r_c(i, t, h) for episode i:
        r_x(i,t,h) = || (x - xhat) / s_x ||_inf
        r_F(i,t,h) = || (F - Fhat) / s_F ||_inf
        r_mode(i,t,h) = APS(p, sigma)
        """
        decisions = episode_data["decisions"]
        if len(decisions) == 0:
            return {"state": 0.0, "wrench": 0.0, "mode": 0.0}

        r_x_all = []
        r_F_all = []
        r_mode_all = []

        for dec in decisions:
            true_states = dec["realized_states"]      # [H, state_dim]
            pred_states = dec["pred_states"]          # [H, state_dim]
            true_wrenches = dec["realized_wrenches"]  # [H, wrench_dim]
            pred_wrenches = dec["pred_wrenches"]      # [H, wrench_dim]
            true_modes = dec["realized_modes"]        # [H]
            pred_mode_probs = dec["pred_mode_probs"]  # [H, 7]

            H_avail = len(true_states)
            for h in self.horizons:
                h_idx = h - 1  # 0-indexed horizon step
                if h_idx < H_avail:
                    # 1. State residual
                    diff_x = np.abs(true_states[h_idx] - pred_states[h_idx])
                    if self.state_scale is not None:
                        diff_x = diff_x / np.maximum(self.state_scale, 1e-4)
                    r_x = float(np.max(diff_x))
                    r_x_all.append(r_x)

                    # 2. Wrench residual
                    diff_F = np.abs(true_wrenches[h_idx] - pred_wrenches[h_idx])
                    if self.wrench_scale is not None:
                        diff_F = diff_F / np.maximum(self.wrench_scale, 1e-4)
                    r_F = float(np.max(diff_F))
                    r_F_all.append(r_F)

                    # 3. Mode residual via APS
                    r_m = compute_aps_score(pred_mode_probs[h_idx], true_modes[h_idx], rng=self.rng)
                    r_mode_all.append(r_m)

        S_x = float(np.max(r_x_all)) if len(r_x_all) > 0 else 0.0
        S_F = float(np.max(r_F_all)) if len(r_F_all) > 0 else 0.0
        S_mode = float(np.max(r_mode_all)) if len(r_mode_all) > 0 else 0.0

        return {"state": S_x, "wrench": S_F, "mode": S_mode}

    def calibrate(self, calib_episodes: List[Dict[str, Any]]):
        """
        Fits split-conformal thresholds on n independent calibration episodes:
        k = ceil((n + 1) * (1 - alpha))
        q = k-th order statistic
        """
        self.n_calib_episodes = len(calib_episodes)
        if self.n_calib_episodes == 0:
            raise ValueError("Cannot calibrate with 0 episodes.")

        all_S_state = []
        all_S_wrench = []
        all_S_mode = []

        # Episode-level stratification by INITIAL observed contact mode
        mode_stratum_scores: Dict[int, Dict[str, List[float]]] = {
            m: {"state": [], "wrench": [], "mode": []} for m in range(NUM_MODES)
        }

        for ep in calib_episodes:
            scores = self.compute_episode_scores(ep)
            all_S_state.append(scores["state"])
            all_S_wrench.append(scores["wrench"])
            all_S_mode.append(scores["mode"])

            init_mode = int(ep.get("initial_mode", 0))
            if init_mode in mode_stratum_scores:
                mode_stratum_scores[init_mode]["state"].append(scores["state"])
                mode_stratum_scores[init_mode]["wrench"].append(scores["wrench"])
                mode_stratum_scores[init_mode]["mode"].append(scores["mode"])

        n = self.n_calib_episodes

        def calc_quantile(scores: List[float], alpha_level: float) -> Tuple[float, int]:
            k = int(math.ceil((n + 1) * (1.0 - alpha_level)))
            if k > n:
                return float("inf"), k
            sorted_s = sorted(scores)
            return float(sorted_s[k - 1]), k

        # 1. Marginal thresholds (alpha)
        self.q_state_marginal, self.k_state_marginal = calc_quantile(all_S_state, self.alpha)
        self.q_wrench_marginal, self.k_wrench_marginal = calc_quantile(all_S_wrench, self.alpha)
        self.q_mode_marginal, self.k_mode_marginal = calc_quantile(all_S_mode, self.alpha)

        # 2. Joint Bonferroni thresholds (alpha / 3)
        self.q_state_joint, self.k_state_joint = calc_quantile(all_S_state, self.alpha_state)
        self.q_wrench_joint, self.k_wrench_joint = calc_quantile(all_S_wrench, self.alpha_wrench)
        self.q_mode_joint, self.k_mode_joint = calc_quantile(all_S_mode, self.alpha_mode)

        # 3. Stratified by initial observed contact mode with hierarchical fallback
        for m in range(NUM_MODES):
            m_n = len(mode_stratum_scores[m]["state"])
            if m_n >= self.min_stratum_samples:
                k_m = int(math.ceil((m_n + 1) * (1.0 - self.alpha_state)))
                if k_m <= m_n:
                    q_s = float(sorted(mode_stratum_scores[m]["state"])[k_m - 1])
                    q_w = float(sorted(mode_stratum_scores[m]["wrench"])[k_m - 1])
                    q_m = float(sorted(mode_stratum_scores[m]["mode"])[k_m - 1])
                else:
                    q_s, q_w, q_m = self.q_state_joint, self.q_wrench_joint, self.q_mode_joint
            else:
                # Hierarchical fallback to global unstratified joint threshold
                q_s, q_w, q_m = self.q_state_joint, self.q_wrench_joint, self.q_mode_joint

            self.stratified_q_joint[m] = {"state": q_s, "wrench": q_w, "mode": q_m}

        self.calibrated = True

    def evaluate_test_episodes(
        self,
        test_episodes: List[Dict[str, Any]],
        use_stratified: bool = False,
    ) -> Dict[str, Any]:
        """
        Evaluates episode-level simultaneous coverage and diagnostic pointwise horizon coverage.
        All percentages include explicit integer numerators and denominators.
        """
        if not self.calibrated:
            raise RuntimeError("Engine must be calibrated before evaluation.")

        N = len(test_episodes)
        if N == 0:
            raise ValueError("Test episode list is empty.")

        covered_state_marginal = 0
        covered_wrench_marginal = 0
        covered_mode_marginal = 0

        covered_state_joint = 0
        covered_wrench_joint = 0
        covered_mode_joint = 0
        covered_joint_simultaneous = 0

        # Pointwise diagnostic horizon counters
        pointwise_marginal = {h: {"state_hits": 0, "wrench_hits": 0, "mode_hits": 0, "total": 0} for h in self.horizons}

        episode_scores_list = []
        for ep in test_episodes:
            scores = self.compute_episode_scores(ep)
            episode_scores_list.append(scores)
            init_mode = int(ep.get("initial_mode", 0))

            if use_stratified and init_mode in self.stratified_q_joint:
                th_joint = self.stratified_q_joint[init_mode]
                q_s_j = th_joint["state"]
                q_w_j = th_joint["wrench"]
                q_m_j = th_joint["mode"]
            else:
                q_s_j = self.q_state_joint
                q_w_j = self.q_wrench_joint
                q_m_j = self.q_mode_joint

            # Marginal checks
            c_s_m = scores["state"] <= self.q_state_marginal
            c_w_m = scores["wrench"] <= self.q_wrench_marginal
            c_m_m = scores["mode"] <= self.q_mode_marginal
            if c_s_m: covered_state_marginal += 1
            if c_w_m: covered_wrench_marginal += 1
            if c_m_m: covered_mode_marginal += 1

            # Joint simultaneous checks
            c_s_j = scores["state"] <= q_s_j
            c_w_j = scores["wrench"] <= q_w_j
            c_m_j = scores["mode"] <= q_m_j
            if c_s_j: covered_state_joint += 1
            if c_w_j: covered_wrench_joint += 1
            if c_m_j: covered_mode_joint += 1
            if c_s_j and c_w_j and c_m_j:
                covered_joint_simultaneous += 1

            # Pointwise horizon diagnostic
            for dec in ep.get("decisions", []):
                t_s = dec["realized_states"]
                p_s = dec["pred_states"]
                t_w = dec["realized_wrenches"]
                p_w = dec["pred_wrenches"]
                t_m = dec["realized_modes"]
                p_m_prob = dec["pred_mode_probs"]

                for h in self.horizons:
                    h_idx = h - 1
                    if h_idx < len(t_s):
                        diff_x = np.abs(t_s[h_idx] - p_s[h_idx])
                        if self.state_scale is not None:
                            diff_x = diff_x / np.maximum(self.state_scale, 1e-4)
                        rx = float(np.max(diff_x))

                        diff_F = np.abs(t_w[h_idx] - p_w[h_idx])
                        if self.wrench_scale is not None:
                            diff_F = diff_F / np.maximum(self.wrench_scale, 1e-4)
                        rF = float(np.max(diff_F))

                        rm = compute_aps_score(p_m_prob[h_idx], t_m[h_idx], rng=self.rng)

                        pointwise_marginal[h]["total"] += 1
                        if rx <= self.q_state_marginal: pointwise_marginal[h]["state_hits"] += 1
                        if rF <= self.q_wrench_marginal: pointwise_marginal[h]["wrench_hits"] += 1
                        if rm <= self.q_mode_marginal: pointwise_marginal[h]["mode_hits"] += 1

        def format_metric(k: int, n: int) -> Dict[str, Any]:
            rate = round(k / max(1, n), 4)
            pct = round(rate * 100.0, 2)
            ci_low, ci_high = compute_wilson_ci(k, n, 0.95)
            return {
                "count": k,
                "total": n,
                "rate": rate,
                "percentage_str": f"{k}/{n} ({pct}%)",
                "formatted": f"{k}/{n} ({pct}%)",
                "ci_95": [round(ci_low * 100.0, 2), round(ci_high * 100.0, 2)],
            }

        pointwise_results = {}
        for h, v in pointwise_marginal.items():
            tot = v["total"]
            pointwise_results[str(h)] = {
                "total_decisions": tot,
                "state": format_metric(v["state_hits"], tot),
                "wrench": format_metric(v["wrench_hits"], tot),
                "mode": format_metric(v["mode_hits"], tot),
            }

        return {
            "n_calibration_episodes": self.n_calib_episodes,
            "n_test_episodes": N,
            "target_marginal_coverage": 1.0 - self.alpha,
            "target_joint_coverage": 1.0 - self.alpha,
            "marginal_thresholds": {
                "state": round(self.q_state_marginal, 4),
                "wrench": round(self.q_wrench_marginal, 4),
                "mode": round(self.q_mode_marginal, 4),
            },
            "joint_thresholds": {
                "state": round(self.q_state_joint, 4),
                "wrench": round(self.q_wrench_joint, 4),
                "mode": round(self.q_mode_joint, 4),
            },
            "episode_marginal_coverage": {
                "state": format_metric(covered_state_marginal, N),
                "wrench": format_metric(covered_wrench_marginal, N),
                "mode": format_metric(covered_mode_marginal, N),
            },
            "episode_joint_coverage": {
                "state": format_metric(covered_state_joint, N),
                "wrench": format_metric(covered_wrench_joint, N),
                "mode": format_metric(covered_mode_joint, N),
                "joint_simultaneous": format_metric(covered_joint_simultaneous, N),
            },
            "pointwise_horizon_diagnostic": pointwise_results,
        }

