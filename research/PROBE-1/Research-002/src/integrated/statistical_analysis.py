"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.5 — Five-Way Integrated Evaluation: Statistical Analysis Engine

Provides rigorous statistical metrics:
1. Wilson score binomial confidence intervals (95% CI).
2. Multi-horizon state and force RMSE at H in {1, 3, 5, 10, 20}.
3. 7-mode contact classification macro-F1, precision, recall, and confusion matrix.
4. Planner Exploitation Gap (PEG) distribution statistics.
5. Conformal coverage and prediction interval widths.
"""

from __future__ import annotations
import math
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
from src.contact_modes.contact_mode_definitions import ContactMode, NUM_MODES, MODE_NAMES


def compute_wilson_ci(k: int, n: int, confidence: float = 0.95) -> Tuple[float, float]:
    """Computes exact Wilson score binomial confidence interval [lower, upper] for k successes in n trials."""
    if n <= 0:
        return 0.0, 1.0
    k_clamped = max(0, min(k, n))
    z = 1.959963984540054  # 95% normal quantile
    p_hat = k_clamped / n
    denominator = 1.0 + z**2 / n
    center = (p_hat + z**2 / (2 * n)) / denominator
    radicand = max(0.0, p_hat * (1.0 - p_hat) / n + z**2 / (4 * n**2))
    margin = (z * math.sqrt(radicand)) / denominator
    lower = max(0.0, center - margin)
    upper = min(1.0, center + margin)
    return float(lower), float(upper)


def format_count_pct(k: int, n: int) -> Dict[str, Any]:
    """Formats exact integer fraction, rate, formatted string, and 95% Wilson CI."""
    rate = round(k / max(1, n), 4)
    pct = round(rate * 100.0, 2)
    low, high = compute_wilson_ci(k, n, 0.95)
    return {
        "count": k,
        "total": n,
        "rate": rate,
        "formatted": f"{k}/{n} ({pct}%)",
        "ci_95": [round(low * 100.0, 2), round(high * 100.0, 2)],
    }


def compute_rmse(pred: np.ndarray, target: np.ndarray) -> float:
    """Computes root mean square error between prediction and ground truth arrays."""
    if len(pred) == 0 or len(target) == 0:
        return 0.0
    return float(np.sqrt(np.mean((pred - target) ** 2)))


def compute_multihorizon_rmse(
    pred_trajectories: List[np.ndarray],
    true_trajectories: List[np.ndarray],
    horizons: Tuple[int, ...] = (1, 3, 5, 10, 20)
) -> Dict[str, float]:
    """
    Computes state RMSE at specific forecast horizons H across multi-step trajectory rollouts.
    """
    horizon_errors = {str(h): [] for h in horizons}

    for pred_seq, true_seq in zip(pred_trajectories, true_trajectories):
        H_avail = min(len(pred_seq), len(true_seq))
        for h in horizons:
            h_idx = h - 1
            if h_idx < H_avail:
                err = float(np.linalg.norm(pred_seq[h_idx] - true_seq[h_idx]))
                horizon_errors[str(h)].append(err)

    results = {}
    for h_str, err_list in horizon_errors.items():
        if len(err_list) > 0:
            results[h_str] = round(float(np.sqrt(np.mean(np.array(err_list) ** 2))), 4)
        else:
            results[h_str] = float("nan")

    return results


def compute_contact_mode_f1(
    pred_modes: np.ndarray,
    true_modes: np.ndarray,
    num_modes: int = NUM_MODES
) -> Dict[str, Any]:
    """
    Computes macro-F1, per-mode precision, recall, and confusion matrix across all 7 contact modes.
    """
    pred_modes = np.array(pred_modes, dtype=np.int64).flatten()
    true_modes = np.array(true_modes, dtype=np.int64).flatten()

    conf_matrix = np.zeros((num_modes, num_modes), dtype=np.int64)
    for p, t in zip(pred_modes, true_modes):
        if 0 <= p < num_modes and 0 <= t < num_modes:
            conf_matrix[t, p] += 1

    per_mode = {}
    f1_list = []

    for m in range(num_modes):
        mode_name = MODE_NAMES[m] if m < len(MODE_NAMES) else f"Mode_{m}"
        tp = int(conf_matrix[m, m])
        fp = int(np.sum(conf_matrix[:, m]) - tp)
        fn = int(np.sum(conf_matrix[m, :]) - tp)

        prec = float(tp / max(1, tp + fp))
        rec = float(tp / max(1, tp + fn))
        f1 = float((2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0)

        per_mode[mode_name] = {
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1": round(f1, 4),
            "support": int(np.sum(conf_matrix[m, :])),
        }
        f1_list.append(f1)

    macro_f1 = float(np.mean(f1_list))

    return {
        "macro_f1": round(macro_f1, 4),
        "per_mode_metrics": per_mode,
        "confusion_matrix": conf_matrix.tolist(),
    }


def compute_peg_distribution(predicted_returns: List[float], realized_returns: List[float]) -> Dict[str, Any]:
    """Computes distribution statistics of Planner Exploitation Gap (PEG = J_WM - J_sim)."""
    pegs = np.array([max(0.0, float(p - r)) for p, r in zip(predicted_returns, realized_returns)], dtype=np.float64)
    if len(pegs) == 0:
        return {"mean_peg": 0.0, "median_peg": 0.0, "max_peg": 0.0, "std_peg": 0.0, "terciles": {"total_samples": 0, "thresholds": [0.0, 0.0, 0.0]}}

    return {
        "mean_peg": round(float(np.mean(pegs)), 3),
        "median_peg": round(float(np.median(pegs)), 3),
        "max_peg": round(float(np.max(pegs)), 3),
        "std_peg": round(float(np.std(pegs)), 3),
        "terciles": {
            "total_samples": len(pegs),
            "thresholds": [
                round(float(np.quantile(pegs, 0.33)), 3),
                round(float(np.quantile(pegs, 0.67)), 3),
                round(float(np.quantile(pegs, 1.0)), 3),
            ]
        }
    }


def to_json_serializable(obj: Any) -> Any:
    """Recursively converts numpy and torch scalars/arrays to native JSON serializable types."""
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, (np.floating, float)):
        return float(obj)
    elif isinstance(obj, (np.integer, int)):
        return int(obj)
    elif isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    elif isinstance(obj, dict):
        return {str(k): to_json_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [to_json_serializable(v) for v in obj]
    return obj


# Aliases for interface flexibility
compute_multihorizon_rmses = compute_multihorizon_rmse
compute_mode_confusion_and_f1 = compute_contact_mode_f1
compute_peg_statistics = compute_peg_distribution

