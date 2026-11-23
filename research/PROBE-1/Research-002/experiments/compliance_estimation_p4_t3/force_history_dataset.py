"""
HOROS PROBE-1 — Phase 4 Task 3 (P4-T3)
Force-History Dataset Builder & Episode-Grouped Splitter

Extracts causal sliding-window feature vectors and future targets from
the canonical 96 P4-T1 partial-slip trajectories.

Strict Guardrails:
- Grouped by complete episode ID (zero intra-episode window leakage).
- Causal observations only (no future information in inputs).
- No privileged physics variables (mu, stick radius, true slip velocity) in inputs.
"""

import os
import sys
import json
import numpy as np
import torch
from torch.utils.data import Dataset
from typing import Dict, Any, List, Tuple, Optional


class ForceHistoryWindowDataset(Dataset):
    """
    Sliding window dataset for causal pre-slip margin and failure prediction.
    
    Inputs (Window W):
    - Tangential force history: F_t[t-W+1:t+1]
    - Normal force history: F_n[t-W+1:t+1]
    - Tangential displacement increments: Delta delta_t[t-W+1:t+1]
    - Commanded velocity history: v_cmd[t-W+1:t+1]
    
    Targets:
    - Future stiffness margin: m_{t+H} in [0.0, 1.0] (at horizon H)
    - Gross slip within horizon H: binary flag in {0, 1}
    - Remaining time to gross slip: tau_rem in [0.0, 1.0] seconds
    """

    def __init__(
        self,
        features: np.ndarray,
        target_margins: np.ndarray,
        target_slips: np.ndarray,
        target_times: np.ndarray,
        episode_indices: np.ndarray,
        time_steps: np.ndarray,
    ):
        self.features = torch.tensor(features, dtype=torch.float32)
        self.target_margins = torch.tensor(target_margins, dtype=torch.float32)
        self.target_slips = torch.tensor(target_slips, dtype=torch.float32)
        self.target_times = torch.tensor(target_times, dtype=torch.float32)
        self.episode_indices = episode_indices
        self.time_steps = time_steps

    def __len__(self) -> int:
        return len(self.features)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor]:
        return (
            self.features[idx],
            self.target_margins[idx],
            self.target_slips[idx],
            self.target_times[idx],
        )


def build_causal_sliding_windows(
    trajectories: List[Dict[str, Any]],
    window_size: int = 15,
    horizon: int = 20,  # 20 ms into the future
    use_noisy: bool = False,
    dt: float = 0.001,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    Constructs sliding window feature matrices and target vectors from trajectories.
    """
    feature_list = []
    margin_list = []
    slip_list = []
    time_rem_list = []
    ep_id_list = []
    step_list = []

    for tr in trajectories:
        ep_id = tr["traj_id"]
        gs_step = tr["gross_slip_step"]
        if gs_step <= 0:
            continue

        if use_noisy:
            ft = tr["noisy_force_t"]
            fn = tr["noisy_force_n"]
            disp = tr["noisy_disp"]
        else:
            ft = tr["force_t"]
            fn = tr["force_n"]
            disp = tr["disp"]

        v_cmd = tr["v_nominal"] * np.ones_like(ft)  # Commanded velocity action
        stick_ratio = tr["stick_ratio"]
        total_steps = len(ft)

        # Precompute displacement increments Delta delta_t
        delta_disp = np.zeros_like(disp)
        delta_disp[1:] = disp[1:] - disp[:-1]

        # Extract windows: sample up to 10 steps past gross slip
        max_t = min(total_steps, gs_step + 10)

        for t in range(window_size, max_t):
            # Window slice [t - window_size : t]
            w_ft = ft[t - window_size : t]
            w_fn = fn[t - window_size : t]
            w_dd = delta_disp[t - window_size : t] * 1000.0  # Scale to mm for conditioning
            w_vcmd = v_cmd[t - window_size : t] * 1000.0   # Scale to mm/s

            # Dimensionless / normalized feature representation
            feat = np.concatenate([w_ft, w_fn, w_dd, w_vcmd], axis=0)

            # Targets at causal future horizon t + horizon
            future_idx = min(total_steps - 1, t + horizon)
            target_margin = float(stick_ratio[future_idx])  # c/a represents normalized margin
            target_slip = 1.0 if (t + horizon >= gs_step) else 0.0

            time_to_slip_s = max(0.0, (gs_step - t) * dt)
            time_to_slip_capped = min(1.0, time_to_slip_s)

            feature_list.append(feat)
            margin_list.append(target_margin)
            slip_list.append(target_slip)
            time_rem_list.append(time_to_slip_capped)
            ep_id_list.append(ep_id)
            step_list.append(t)

    X = np.array(feature_list, dtype=np.float32)
    y_margin = np.array(margin_list, dtype=np.float32)[:, None]
    y_slip = np.array(slip_list, dtype=np.float32)[:, None]
    y_time = np.array(time_rem_list, dtype=np.float32)[:, None]
    episodes = np.array(ep_id_list, dtype=np.int32)
    steps = np.array(step_list, dtype=np.int32)

    return X, y_margin, y_slip, y_time, episodes, steps


def create_grouped_train_val_test_splits(
    trajectories: List[Dict[str, Any]],
    train_ratio: float = 0.625,  # 60 episodes
    val_ratio: float = 0.167,    # 16 episodes
    test_ratio: float = 0.208,   # 20 episodes
    seed: int = 42,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]], Dict[str, List[int]]]:
    """
    Partitions the 96 trajectories into Train, Val, and Test splits strictly by episode ID.
    Stratifies across friction levels to ensure all splits see diverse contact physics.
    """
    np.random.seed(seed)
    mu_groups = {}
    for tr in trajectories:
        mu = tr["mu_static"]
        mu_groups.setdefault(mu, []).append(tr)

    train_trajs = []
    val_trajs = []
    test_trajs = []

    for mu, group in sorted(mu_groups.items()):
        # Shuffle deterministically within each friction stratum
        indices = np.random.permutation(len(group))
        n_group = len(group)
        n_test = max(1, int(round(n_group * test_ratio)))
        n_val = max(1, int(round(n_group * val_ratio)))
        n_train = n_group - n_val - n_test
        if n_train <= 0:
            n_train = 1
            n_test = max(1, n_group - n_train - n_val)

        for i, idx in enumerate(indices):
            if i < n_train:
                train_trajs.append(group[idx])
            elif i < n_train + n_val:
                val_trajs.append(group[idx])
            else:
                test_trajs.append(group[idx])

    split_manifest = {
        "train_ids": [tr["traj_id"] for tr in train_trajs],
        "val_ids": [tr["traj_id"] for tr in val_trajs],
        "test_ids": [tr["traj_id"] for tr in test_trajs],
    }

    # Verify zero leakage across splits
    set_train = set(split_manifest["train_ids"])
    set_val = set(split_manifest["val_ids"])
    set_test = set(split_manifest["test_ids"])

    assert len(set_train.intersection(set_val)) == 0, "Data leakage between train and val!"
    assert len(set_train.intersection(set_test)) == 0, "Data leakage between train and test!"
    assert len(set_val.intersection(set_test)) == 0, "Data leakage between val and test!"

    return train_trajs, val_trajs, test_trajs, split_manifest


def create_held_out_generalization_splits(
    trajectories: List[Dict[str, Any]],
    held_out_mu: List[float] = [0.35, 0.65],  # Unseen intermediate friction levels
    held_out_fn: List[float] = [15.0],        # Unseen high normal load
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Creates strict OOD generalization splits:
    - ID Train/Val (nominal friction and loads)
    - OOD Friction Test (completely unseen friction values)
    - OOD Load Test (completely unseen normal load)
    """
    id_trajs = []
    ood_friction_trajs = []
    ood_load_trajs = []

    for tr in trajectories:
        mu = tr["mu_static"]
        fn = tr["Fn_nominal"]
        if any(abs(mu - h_mu) < 1e-4 for h_mu in held_out_mu):
            ood_friction_trajs.append(tr)
        elif any(abs(fn - h_fn) < 1e-4 for h_fn in held_out_fn):
            ood_load_trajs.append(tr)
        else:
            id_trajs.append(tr)

    return id_trajs, ood_friction_trajs, ood_load_trajs
