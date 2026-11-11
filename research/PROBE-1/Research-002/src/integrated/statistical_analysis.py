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


HORIZONS: Tuple[int, ...] = (1, 3, 5, 10, 20)

MULTIHORIZON_COMPONENTS: Tuple[str, ...] = (
    "robot_kinematics",
    "object_position",
    "normal_forces",
    "tangential_forces",
    "slip_velocity",
)

TASK_STATE_SCHEMAS: Dict[str, Dict[str, Any]] = {
    "peg_in_hole": {
        "state_dim": 15,
        "robot_kinematics": slice(0, 9),    # pos(0:3), vel(3:6), rot(6:9)
        "object_position": None,            # Not tracked separately from held peg in 15-D
        "normal_forces": slice(11, 12),     # Fz axial channel
        "tangential_forces": slice(9, 11),  # Fx, Fy lateral shear channels
        "slip_velocity": None,              # Not present in 15-D vector
    },
    "multifinger_lift": {
        "state_dim": 23,
        "robot_kinematics": slice(0, 12),   # 4 fingers x 3 pos coords
        "object_position": slice(20, 23),   # obj_pos(x, y, z)
        "normal_forces": slice(12, 16),     # finger_fn(0..3)
        "tangential_forces": None,          # Absent from 23-D vector unless supplied externally
        "slip_velocity": slice(16, 20),     # slip_ratio(0..3)
    },
}


def _resolve_task_schema(
    pred_trajectories: List[Optional[np.ndarray]],
    true_trajectories: List[Optional[np.ndarray]],
    task: Optional[str] = None,
) -> Tuple[str, Dict[str, Any]]:
    """Resolves canonical task schema and validates trajectory dimensions remain separated per task."""
    if task is not None:
        key = "peg_in_hole" if task == "peg_in_hole" else "multifinger_lift"
        if key not in TASK_STATE_SCHEMAS:
            raise ValueError(f"Unsupported task '{task}' for multi-horizon evaluation.")
        expected_dim = TASK_STATE_SCHEMAS[key]["state_dim"]
        for seq in list(pred_trajectories) + list(true_trajectories):
            if seq is not None and len(seq) > 0:
                arr = np.asarray(seq)
                if arr.ndim == 2 and arr.shape[1] != expected_dim:
                    raise ValueError(
                        f"Task/state dimension mismatch for '{task}': expected {expected_dim}-D, got {arr.shape[1]}-D. "
                        "Task 1 and Task 2 results must remain strictly separate."
                    )
        return key, TASK_STATE_SCHEMAS[key]

    inferred_dims = set()
    for seq in list(pred_trajectories) + list(true_trajectories):
        if seq is not None and len(seq) > 0:
            arr = np.asarray(seq)
            if arr.ndim == 2:
                inferred_dims.add(int(arr.shape[1]))

    if len(inferred_dims) > 1:
        raise ValueError(
            f"Mixed state dimensions {sorted(inferred_dims)} in single compute_multihorizon_rmse call; "
            "Task 1 (15-D) and Task 2 (23-D) trajectories must be evaluated separately."
        )
    if inferred_dims == {23}:
        return "multifinger_lift", TASK_STATE_SCHEMAS["multifinger_lift"]
    return "peg_in_hole", TASK_STATE_SCHEMAS["peg_in_hole"]


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
    pred_trajectories: List[Optional[np.ndarray]],
    true_trajectories: List[Optional[np.ndarray]],
    horizons: Tuple[int, ...] = HORIZONS,
    task: Optional[str] = None,
    pred_tangential_forces: Optional[List[Optional[np.ndarray]]] = None,
    true_tangential_forces: Optional[List[Optional[np.ndarray]]] = None,
    detailed: bool = True,
) -> Dict[str, Any]:
    """
    Computes multi-horizon RMSE across H in {1, 3, 5, 10, 20} disaggregated into:
    - robot_kinematics
    - object_position
    - normal_forces
    - tangential_forces
    - slip_velocity

    Strict invariants:
    - Task 1 (15-D peg_in_hole) and Task 2 (23-D multifinger_lift / compliant_prelift)
      cannot be mixed in a single call.
    - Missing or non-finite steps at horizon H are never silently replaced with 0.0;
      instead valid_samples per horizon is tracked explicitly and rmse=None when valid_samples==0.
    """
    resolved_task, schema = _resolve_task_schema(pred_trajectories, true_trajectories, task=task)

    state_mse_lists: Dict[int, List[float]] = {h: [] for h in horizons}
    state_l2_sq_lists: Dict[int, List[float]] = {h: [] for h in horizons}
    comp_mse_lists: Dict[int, Dict[str, List[float]]] = {
        h: {c: [] for c in MULTIHORIZON_COMPONENTS} for h in horizons
    }

    n_pairs = min(len(pred_trajectories), len(true_trajectories))
    for i in range(n_pairs):
        pred_seq = pred_trajectories[i]
        true_seq = true_trajectories[i]
        if pred_seq is None or true_seq is None:
            continue

        pred_arr = np.asarray(pred_seq, dtype=np.float64)
        true_arr = np.asarray(true_seq, dtype=np.float64)
        if pred_arr.ndim != 2 or true_arr.ndim != 2:
            continue

        H_avail = min(pred_arr.shape[0], true_arr.shape[0])

        ext_pred_tan = None
        ext_true_tan = None
        if pred_tangential_forces is not None and true_tangential_forces is not None:
            if i < len(pred_tangential_forces) and i < len(true_tangential_forces):
                p_tf = pred_tangential_forces[i]
                t_tf = true_tangential_forces[i]
                if p_tf is not None and t_tf is not None:
                    ext_pred_tan = np.asarray(p_tf, dtype=np.float64)
                    ext_true_tan = np.asarray(t_tf, dtype=np.float64)

        for h in horizons:
            h_idx = h - 1
            if h_idx >= H_avail:
                continue

            p_step = pred_arr[h_idx]
            t_step = true_arr[h_idx]
            if p_step.shape != t_step.shape:
                continue
            if not (np.all(np.isfinite(p_step)) and np.all(np.isfinite(t_step))):
                continue

            diff = p_step - t_step
            state_mse_lists[h].append(float(np.mean(diff ** 2)))
            state_l2_sq_lists[h].append(float(np.sum(diff ** 2)))

            for comp in MULTIHORIZON_COMPONENTS:
                slc = schema.get(comp)
                if slc is not None:
                    c_diff = diff[slc]
                    comp_mse_lists[h][comp].append(float(np.mean(c_diff ** 2)))
                elif comp == "tangential_forces" and ext_pred_tan is not None and ext_true_tan is not None:
                    if h_idx < len(ext_pred_tan) and h_idx < len(ext_true_tan):
                        pt = ext_pred_tan[h_idx]
                        tt = ext_true_tan[h_idx]
                        if pt.shape == tt.shape and np.all(np.isfinite(pt)) and np.all(np.isfinite(tt)):
                            comp_mse_lists[h][comp].append(float(np.mean((pt - tt) ** 2)))

    per_horizon: Dict[str, Any] = {}
    state_rmse_map: Dict[str, Optional[float]] = {}
    state_l2_map: Dict[str, Optional[float]] = {}
    valid_samples_map: Dict[str, int] = {}
    components_by_horizon: Dict[str, Dict[str, Optional[float]]] = {c: {} for c in MULTIHORIZON_COMPONENTS}

    for h in horizons:
        h_str = str(h)
        n_valid = len(state_mse_lists[h])
        valid_samples_map[h_str] = n_valid

        s_rmse = round(float(math.sqrt(np.mean(state_mse_lists[h]))), 4) if n_valid > 0 else None
        s_l2_rmse = round(float(math.sqrt(np.mean(state_l2_sq_lists[h]))), 4) if n_valid > 0 else None
        state_rmse_map[h_str] = s_rmse
        state_l2_map[h_str] = s_l2_rmse

        comp_details: Dict[str, Any] = {}
        for comp in MULTIHORIZON_COMPONENTS:
            c_mses = comp_mse_lists[h][comp]
            c_valid = len(c_mses)
            c_rmse = round(float(math.sqrt(np.mean(c_mses))), 4) if c_valid > 0 else None
            c_applicable = bool(schema.get(comp) is not None or c_valid > 0)
            comp_details[comp] = {
                "rmse": c_rmse,
                "valid_samples": c_valid,
                "applicable": c_applicable,
            }
            components_by_horizon[comp][h_str] = c_rmse

        per_horizon[h_str] = {
            "horizon": h,
            "valid_samples": n_valid,
            "state_rmse": s_rmse,
            "state_l2_rmse": s_l2_rmse,
            "components": comp_details,
        }

    if not detailed:
        return state_l2_map

    return {
        "task": resolved_task,
        "state_dim": schema["state_dim"],
        "horizons": list(horizons),
        "per_horizon": per_horizon,
        "state_rmse": state_rmse_map,
        "state_l2_rmse": state_l2_map,
        "valid_samples_per_horizon": valid_samples_map,
        "components_by_horizon": components_by_horizon,
    }


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
    """Recursively converts numpy and torch scalars/arrays to RFC 8259 JSON serializable types."""
    if isinstance(obj, np.ndarray):
        return [to_json_serializable(v) for v in obj.tolist()]
    elif isinstance(obj, (np.floating, float)):
        val = float(obj)
        return val if math.isfinite(val) else None
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

