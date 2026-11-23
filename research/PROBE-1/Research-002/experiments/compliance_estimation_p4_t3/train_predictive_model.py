"""
HOROS PROBE-1 — Phase 4 Task 3 (P4-T3)
Predictive Margin MLP Training & Validation Pipeline

Trains the causal Force-History MLP on P4-T1 trajectories with:
- Strict episode-grouped data splitting (Train=60, Val=16, Test=20).
- Multi-task optimization (margin regression NLL, slip-risk BCE, time-to-slip).
- Noise-robust training on ATI Nano17 realistic sensory channels.
- Early stopping and model selection strictly on the validation set.
- Checkpoints saved in isolated experiments directory (zero production file overlap).
"""

import os
import sys
import json
import time
import numpy as np
import torch
from torch.utils.data import DataLoader
from typing import Dict, Any, Tuple

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PRE_SLIP_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "pre_slip_qualification"))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)
if PRE_SLIP_DIR not in sys.path:
    sys.path.insert(0, PRE_SLIP_DIR)

from p4_t1_generate_trajectories import load_p4_t1_dataset
from force_history_dataset import (
    ForceHistoryWindowDataset,
    build_causal_sliding_windows,
    create_grouped_train_val_test_splits,
)
from predictive_margin_mlp import PredictiveMarginMLP


def train_p4_t3_model(
    npz_path: str = None,
    manifest_path: str = None,
    checkpoint_dir: str = None,
    epochs: int = 40,
    batch_size: int = 128,
    lr: float = 1e-3,
    weight_decay: float = 1e-4,
    window_size: int = 15,
    horizon: int = 20,
    seed: int = 42,
) -> Dict[str, Any]:
    """
    Executes reproducible, causal model training on P4-T1 partial slip trajectories.
    """
    torch.manual_seed(seed)
    np.random.seed(seed)

    if npz_path is None:
        npz_path = os.path.join(PRE_SLIP_DIR, "data", "p4_t1_partial_slip_trajectories.npz")
    if manifest_path is None:
        manifest_path = os.path.join(PRE_SLIP_DIR, "data", "p4_t1_trajectory_manifest.json")
    if checkpoint_dir is None:
        checkpoint_dir = os.path.join(CURRENT_DIR, "checkpoints")
    os.makedirs(checkpoint_dir, exist_ok=True)

    # 1. Load Trajectories
    trajectories = load_p4_t1_dataset(npz_path, manifest_path)
    print(f"Loaded {len(trajectories)} trajectories for P4-T3 training.")

    # 2. Create Grouped Episode Splits
    train_trajs, val_trajs, test_trajs, split_manifest = create_grouped_train_val_test_splits(
        trajectories, train_ratio=0.625, val_ratio=0.167, test_ratio=0.208, seed=seed
    )
    print(f"Splits: Train={len(train_trajs)} eps, Val={len(val_trajs)} eps, Test={len(test_trajs)} eps")

    # 3. Build Causal Sliding Windows (Trained on Noisy Channels for Robustness)
    X_train, ym_train, ys_train, yt_train, _, _ = build_causal_sliding_windows(
        train_trajs, window_size=window_size, horizon=horizon, use_noisy=True
    )
    X_val, ym_val, ys_val, yt_val, _, _ = build_causal_sliding_windows(
        val_trajs, window_size=window_size, horizon=horizon, use_noisy=True
    )

    print(f"Window datasets built: Train windows={len(X_train)}, Val windows={len(X_val)}")
    input_dim = X_train.shape[1]

    train_dataset = ForceHistoryWindowDataset(X_train, ym_train, ys_train, yt_train, None, None)
    val_dataset = ForceHistoryWindowDataset(X_val, ym_val, ys_val, yt_val, None, None)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    # 4. Instantiate Model & Optimizer
    model = PredictiveMarginMLP(input_dim=input_dim, hidden_dim=64, dropout=0.05)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=weight_decay)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    best_val_loss = float("inf")
    best_checkpoint_path = os.path.join(checkpoint_dir, "best_p4_t3_mlp.pt")
    history = {"train_loss": [], "val_loss": [], "val_margin_mae": [], "val_bce": []}

    start_time = time.time()

    # 5. Training Loop
    for epoch in range(1, epochs + 1):
        model.train()
        total_train_loss = 0.0

        for x_b, ym_b, ys_b, yt_b in train_loader:
            optimizer.zero_grad()
            losses = model.compute_loss(x_b, ym_b, ys_b, yt_b)
            loss = losses["total_loss"]
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=2.0)
            optimizer.step()
            total_train_loss += loss.item() * len(x_b)

        scheduler.step()
        avg_train_loss = total_train_loss / len(train_dataset)

        # Validation
        model.eval()
        total_val_loss = 0.0
        total_val_mae = 0.0
        total_val_bce = 0.0

        with torch.no_grad():
            for x_b, ym_b, ys_b, yt_b in val_loader:
                losses = model.compute_loss(x_b, ym_b, ys_b, yt_b)
                total_val_loss += losses["total_loss"].item() * len(x_b)
                total_val_mae += losses["margin_mae"].item() * len(x_b)
                total_val_bce += losses["slip_bce"].item() * len(x_b)

        avg_val_loss = total_val_loss / len(val_dataset)
        avg_val_mae = total_val_mae / len(val_dataset)
        avg_val_bce = total_val_bce / len(val_dataset)

        history["train_loss"].append(avg_train_loss)
        history["val_loss"].append(avg_val_loss)
        history["val_margin_mae"].append(avg_val_mae)
        history["val_bce"].append(avg_val_bce)

        if epoch % 10 == 0 or epoch == 1:
            print(f"Epoch {epoch:2d}/{epochs}: Train Loss={avg_train_loss:.4f}, Val Loss={avg_val_loss:.4f}, Val Margin MAE={avg_val_mae:.4f}")

        # Model selection on validation loss
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            torch.save(
                {
                    "epoch": epoch,
                    "model_state_dict": model.state_dict(),
                    "optimizer_state_dict": optimizer.state_dict(),
                    "input_dim": input_dim,
                    "val_loss": avg_val_loss,
                    "val_margin_mae": avg_val_mae,
                    "split_manifest": split_manifest,
                    "window_size": window_size,
                    "horizon": horizon,
                },
                best_checkpoint_path,
            )

    train_duration_s = time.time() - start_time
    print(f"Training complete in {train_duration_s:.1f}s. Best Val Loss: {best_val_loss:.4f}")

    # Save summary metadata
    meta_path = os.path.join(checkpoint_dir, "p4_t3_training_meta.json")
    meta = {
        "epochs": epochs,
        "best_val_loss": best_val_loss,
        "best_val_margin_mae": float(min(history["val_margin_mae"])),
        "train_samples": len(X_train),
        "val_samples": len(X_val),
        "split_counts": {
            "train_episodes": len(train_trajs),
            "val_episodes": len(val_trajs),
            "test_episodes": len(test_trajs),
        },
        "checkpoint_path": best_checkpoint_path,
        "train_duration_s": train_duration_s,
        "split_manifest": split_manifest,
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    return meta


if __name__ == "__main__":
    train_p4_t3_model(epochs=35)
