"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Feature Standardization & Physical-Unit Inverse Transformation

Implements shared per-task z-score standardization fitted strictly on training
splits (pooled M0 + M4 training data, never on calibration or evaluation splits):
- Input features: continuous state s(t) and action a(t)
- Residual target: delta(t) = s(t+1) - s(t)
- Constant / near-constant channels guarded by safe std floor (default min_std = 1e-4)
- Exact inverse transformation returning predicted next states and B2/B3
  aleatoric/epistemic variances in original physical feature units.
- Discrete categorical mode labels remain untouched (never normalized).
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional, Sequence, Tuple
import numpy as np
import torch


class FeatureStandardizer:
    """Per-task z-score standardizer for (state, action, residual s_{t+1} - s_t)."""

    def __init__(
        self,
        state_mean: np.ndarray,
        state_std: np.ndarray,
        action_mean: np.ndarray,
        action_std: np.ndarray,
        delta_mean: np.ndarray,
        delta_std: np.ndarray,
        min_std: float = 1e-4,
        task: Optional[str] = None,
        fit_source: str = "training_only",
        num_fit_transitions: int = 0,
        clamped_dims: Optional[Dict[str, List[int]]] = None,
    ):
        self.min_std = float(min_std)
        self.task = task
        self.fit_source = fit_source
        self.num_fit_transitions = int(num_fit_transitions)

        self.state_mean = np.asarray(state_mean, dtype=np.float32).copy()
        self.state_std = np.maximum(np.asarray(state_std, dtype=np.float32), self.min_std).copy()
        self.action_mean = np.asarray(action_mean, dtype=np.float32).copy()
        self.action_std = np.maximum(np.asarray(action_std, dtype=np.float32), self.min_std).copy()
        self.delta_mean = np.asarray(delta_mean, dtype=np.float32).copy()
        self.delta_std = np.maximum(np.asarray(delta_std, dtype=np.float32), self.min_std).copy()

        self.state_dim = int(self.state_mean.shape[0])
        self.action_dim = int(self.action_mean.shape[0])
        self.clamped_dims = clamped_dims or {"state": [], "action": [], "delta": []}

    @classmethod
    def fit(
        cls,
        states: np.ndarray,
        actions: np.ndarray,
        next_states: np.ndarray,
        min_std: float = 1e-4,
        task: Optional[str] = None,
        fit_source: str = "training_only",
    ) -> "FeatureStandardizer":
        """Fits per-feature z-score statistics on training arrays only."""
        s_arr = np.asarray(states, dtype=np.float64)
        a_arr = np.asarray(actions, dtype=np.float64)
        ns_arr = np.asarray(next_states, dtype=np.float64)

        if s_arr.ndim != 2 or a_arr.ndim != 2 or ns_arr.ndim != 2:
            raise ValueError("FeatureStandardizer.fit expects 2-D [N, D] arrays.")
        if len(s_arr) == 0:
            raise ValueError("Cannot fit FeatureStandardizer on empty transitions.")
        if s_arr.shape != ns_arr.shape or len(s_arr) != len(a_arr):
            raise ValueError(
                f"Shape mismatch in fit: states={s_arr.shape}, actions={a_arr.shape}, next_states={ns_arr.shape}"
            )

        deltas = ns_arr - s_arr
        floor = float(min_std)

        s_mean = np.mean(s_arr, axis=0)
        s_raw_std = np.std(s_arr, axis=0, ddof=0)
        s_std = np.maximum(s_raw_std, floor)

        a_mean = np.mean(a_arr, axis=0)
        a_raw_std = np.std(a_arr, axis=0, ddof=0)
        a_std = np.maximum(a_raw_std, floor)

        d_mean = np.mean(deltas, axis=0)
        d_raw_std = np.std(deltas, axis=0, ddof=0)
        d_std = np.maximum(d_raw_std, floor)

        clamped = {
            "state": [int(i) for i in np.where(s_raw_std < floor)[0]],
            "action": [int(i) for i in np.where(a_raw_std < floor)[0]],
            "delta": [int(i) for i in np.where(d_raw_std < floor)[0]],
        }

        return cls(
            state_mean=s_mean.astype(np.float32),
            state_std=s_std.astype(np.float32),
            action_mean=a_mean.astype(np.float32),
            action_std=a_std.astype(np.float32),
            delta_mean=d_mean.astype(np.float32),
            delta_std=d_std.astype(np.float32),
            min_std=floor,
            task=task,
            fit_source=fit_source,
            num_fit_transitions=len(s_arr),
            clamped_dims=clamped,
        )

    @classmethod
    def fit_from_transitions(
        cls,
        transitions: Sequence[Tuple[np.ndarray, np.ndarray, np.ndarray, int]],
        min_std: float = 1e-4,
        task: Optional[str] = None,
        fit_source: str = "training_only",
    ) -> "FeatureStandardizer":
        """Fits scaler strictly from extracted (s_t, a_t, s_{t+1}, m_t) training tuples."""
        if len(transitions) == 0:
            raise ValueError("Cannot fit FeatureStandardizer from 0 transitions.")
        s_arr = np.asarray([t[0] for t in transitions], dtype=np.float64)
        a_arr = np.asarray([t[1] for t in transitions], dtype=np.float64)
        ns_arr = np.asarray([t[2] for t in transitions], dtype=np.float64)
        return cls.fit(s_arr, a_arr, ns_arr, min_std=min_std, task=task, fit_source=fit_source)

    def _tensor_pair(self, arr: np.ndarray, reference: torch.Tensor) -> torch.Tensor:
        return torch.as_tensor(arr, dtype=reference.dtype, device=reference.device)

    def normalize_state_tensor(self, s: torch.Tensor) -> torch.Tensor:
        mean = self._tensor_pair(self.state_mean, s)
        std = self._tensor_pair(self.state_std, s)
        return (s - mean) / std

    def normalize_action_tensor(self, a: torch.Tensor) -> torch.Tensor:
        mean = self._tensor_pair(self.action_mean, a)
        std = self._tensor_pair(self.action_std, a)
        return (a - mean) / std

    def normalize_delta_tensor(self, delta: torch.Tensor) -> torch.Tensor:
        mean = self._tensor_pair(self.delta_mean, delta)
        std = self._tensor_pair(self.delta_std, delta)
        return (delta - mean) / std

    def normalize_target_next_state_tensor(self, s: torch.Tensor, next_s: torch.Tensor) -> torch.Tensor:
        """
        Builds normalized next-state target so residual models f(s_norm, a_norm) = s_norm + net(...)
        minimize MSE/NLL directly against standardized residual (s_{t+1} - s_t).
        """
        s_norm = self.normalize_state_tensor(s)
        delta_norm = self.normalize_delta_tensor(next_s - s)
        return s_norm + delta_norm

    def inverse_transform_next_state_tensor(
        self, raw_state: torch.Tensor, pred_norm_next: torch.Tensor
    ) -> torch.Tensor:
        """Inverse-transforms normalized predicted residual back into physical next state."""
        s_norm = self.normalize_state_tensor(raw_state)
        pred_delta_norm = pred_norm_next - s_norm
        d_mean = self._tensor_pair(self.delta_mean, pred_norm_next)
        d_std = self._tensor_pair(self.delta_std, pred_norm_next)
        return raw_state + pred_delta_norm * d_std + d_mean

    def inverse_transform_variance_tensor(self, var_norm: torch.Tensor) -> torch.Tensor:
        """Scales normalized predictive variance Var_norm back to physical variance Var_phys = delta_std^2 * Var_norm."""
        d_std = self._tensor_pair(self.delta_std, var_norm)
        return torch.clamp(var_norm, min=0.0) * (d_std ** 2)

    def to_dict(self) -> Dict[str, Any]:
        """Serializes scaler parameters and provenance for checkpoint & manifest persistence."""
        return {
            "normalization_type": "per_feature_zscore",
            "residual_target": "s_next_minus_s",
            "task": self.task,
            "fit_source": self.fit_source,
            "num_fit_transitions": self.num_fit_transitions,
            "min_std": self.min_std,
            "state_dim": self.state_dim,
            "action_dim": self.action_dim,
            "state_mean": [float(x) for x in self.state_mean],
            "state_std": [float(x) for x in self.state_std],
            "action_mean": [float(x) for x in self.action_mean],
            "action_std": [float(x) for x in self.action_std],
            "delta_mean": [float(x) for x in self.delta_mean],
            "delta_std": [float(x) for x in self.delta_std],
            "clamped_dims": {k: list(v) for k, v in self.clamped_dims.items()},
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "FeatureStandardizer":
        return cls(
            state_mean=np.asarray(data["state_mean"], dtype=np.float32),
            state_std=np.asarray(data["state_std"], dtype=np.float32),
            action_mean=np.asarray(data["action_mean"], dtype=np.float32),
            action_std=np.asarray(data["action_std"], dtype=np.float32),
            delta_mean=np.asarray(data["delta_mean"], dtype=np.float32),
            delta_std=np.asarray(data["delta_std"], dtype=np.float32),
            min_std=float(data.get("min_std", 1e-4)),
            task=data.get("task"),
            fit_source=str(data.get("fit_source", "training_only")),
            num_fit_transitions=int(data.get("num_fit_transitions", 0)),
            clamped_dims=data.get("clamped_dims"),
        )
