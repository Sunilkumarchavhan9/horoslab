"""
HOROS PROBE-1 Canonical Dataset Loader: NVIDIA GR00T-Teleop-G1
File: research/PROBE-1/datasets/groot_teleop_g1.py
Repository: nvidia/PhysicalAI-Robotics-GR00T-Teleop-G1
Commit: a78f30b2c89d81d227448378d3885e7836171ef9
"""

import os
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional
import h5py
import numpy as np
import torch
from torch.utils.data import Dataset

class GrootTeleopG1Dataset(Dataset):
    """
    Synchronous multimodal dataloader for the NVIDIA GR00T-Teleop-G1 dataset.
    Extracts dual RGB camera views, 29-DoF joint kinematics, and commanded action chunks.
    
    Attributes:
        data_dir (Path): Root directory containing episode HDF5 files.
        split (str): 'train', 'val', or 'test'.
        chunk_size (int): Temporal action chunk horizon (default 32 steps).
        image_size (Tuple[int, int]): Target image dimensions (H, W).
    """

    EXPECTED_COMMIT = "a78f30b2c89d81d227448378d3885e7836171ef9"
    CANONICAL_MANIFEST_SHA256 = "e5b7c02418a66719b581db24b34b677a2889c2b3e89659b81b22db95c7aa77c1"
    
    # Embodiment Kinematic Specification: Unitree G1 Humanoid
    TOTAL_ROBOT_DOF = 29
    ARM_DOF = 14       # 7-DoF per arm x 2
    HAND_DOF = 12      # 6-DoF per DexH10 hand x 2
    ACTION_DIM = 26    # 14 arm joint deltas + 12 hand actuator targets

    def __init__(
        self,
        data_dir: str,
        split: str = "train",
        chunk_size: int = 32,
        image_size: Tuple[int, int] = (224, 224),
        apply_augmentation: bool = False,
    ):
        super().__init__()
        self.data_dir = Path(data_dir)
        self.split = split
        self.chunk_size = chunk_size
        self.image_size = image_size
        self.apply_augmentation = apply_augmentation

        if not self.data_dir.exists():
            raise FileNotFoundError(f"Dataset directory does not exist: {self.data_dir}")

        # Locate all HDF5 episode files
        self.episode_files: List[Path] = sorted(list(self.data_dir.glob("*.h5")))
        if not self.episode_files:
            raise FileNotFoundError(
                f"No HDF5 (.h5) files found in {self.data_dir}. "
                "Ensure dataset is downloaded or mock episodes are generated."
            )

        # Build index mapping: (episode_idx, timestep_t)
        self.indices: List[Tuple[int, int]] = []
        self.episode_lengths: List[int] = []

        for ep_idx, filepath in enumerate(self.episode_files):
            try:
                with h5py.File(filepath, "r") as f:
                    # Validate minimum schema keys
                    if "observations/joint_positions" not in f:
                        raise KeyError(f"Missing 'observations/joint_positions' in {filepath.name}")
                    
                    ep_len = f["observations/joint_positions"].shape[0]
                    self.episode_lengths.append(ep_len)

                    # Ensure episode is long enough to yield at least one action chunk
                    if ep_len > self.chunk_size:
                        for t in range(0, ep_len - self.chunk_size):
                            self.indices.append((ep_idx, t))
            except Exception as e:
                # Log corrupted file and skip
                print(f"[WARNING] Skipping corrupted episode {filepath.name}: {e}")

        if not self.indices:
            raise ValueError(
                f"No valid temporal sample windows of chunk_size={self.chunk_size} "
                f"found across {len(self.episode_files)} episodes."
            )

    def __len__(self) -> int:
        return len(self.indices)

    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        if idx < 0 or idx >= len(self.indices):
            raise IndexError(f"Index {idx} out of range for dataset with {len(self.indices)} samples.")

        ep_idx, t = self.indices[idx]
        filepath = self.episode_files[ep_idx]

        with h5py.File(filepath, "r") as f:
            # 1. Visual Streams (Extract RGB images)
            head_rgb = f["observations/images/head_rgb"][t]            # (H, W, 3) uint8
            wrist_left_rgb = f["observations/images/wrist_left_rgb"][t]  # (H, W, 3) uint8
            wrist_right_rgb = f["observations/images/wrist_right_rgb"][t]# (H, W, 3) uint8

            # 2. Proprioceptive State (29-DoF positions and velocities)
            joint_pos = f["observations/joint_positions"][t]            # (29,) float32
            joint_vel = f["observations/joint_velocities"][t]           # (29,) float32

            # 3. Action Chunk Target (Future 32 steps)
            action_chunk = f["actions"][t : t + self.chunk_size]        # (32, 26) float32

        # Convert to PyTorch Tensors and normalize images to [0.0, 1.0], channel-first (3, H, W)
        head_tensor = torch.from_numpy(head_rgb).permute(2, 0, 1).float() / 255.0
        wrist_l_tensor = torch.from_numpy(wrist_left_rgb).permute(2, 0, 1).float() / 255.0
        wrist_r_tensor = torch.from_numpy(wrist_right_rgb).permute(2, 0, 1).float() / 255.0

        proprio = torch.cat([
            torch.from_numpy(joint_pos).float(),
            torch.from_numpy(joint_vel).float()
        ], dim=-1)  # (58,) float32

        actions = torch.from_numpy(action_chunk).float()  # (32, 26) float32

        # Modality Availability Flags:
        # Crucial: 0.0 indicates tactile data is NOT present/observed in this dataset.
        tactile_available = torch.tensor(0.0, dtype=torch.float32)
        proprio_available = torch.tensor(1.0, dtype=torch.float32)
        vision_available = torch.tensor(1.0, dtype=torch.float32)

        return {
            "head_rgb": head_tensor,
            "wrist_left_rgb": wrist_l_tensor,
            "wrist_right_rgb": wrist_r_tensor,
            "proprioception": proprio,
            "action_chunk": actions,
            "tactile_available": tactile_available,
            "proprio_available": proprio_available,
            "vision_available": vision_available,
            "timestep": torch.tensor(t, dtype=torch.int64),
            "episode_idx": torch.tensor(ep_idx, dtype=torch.int64),
        }

    @staticmethod
    def create_mock_episode(
        filepath: str,
        num_steps: int = 100,
        height: int = 224,
        width: int = 224,
        seed: int = 42
    ) -> None:
        """
        Creates a synthetic HDF5 file matching the exact GR00T-Teleop-G1 schema.
        Used for reproducible local unit testing and continuous integration without
        requiring multi-gigabyte dataset downloads.
        """
        rng = np.random.default_rng(seed)
        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)

        with h5py.File(path, "w") as f:
            obs = f.create_group("observations")
            images = obs.create_group("images")

            # Create synthetic RGB video streams (uint8, 0-255)
            images.create_dataset(
                "head_rgb",
                data=rng.integers(0, 256, size=(num_steps, height, width, 3), dtype=np.uint8),
                compression="gzip"
            )
            images.create_dataset(
                "wrist_left_rgb",
                data=rng.integers(0, 256, size=(num_steps, height, width, 3), dtype=np.uint8),
                compression="gzip"
            )
            images.create_dataset(
                "wrist_right_rgb",
                data=rng.integers(0, 256, size=(num_steps, height, width, 3), dtype=np.uint8),
                compression="gzip"
            )

            # Create synthetic 29-DoF joint kinematics
            obs.create_dataset(
                "joint_positions",
                data=rng.uniform(-3.14, 3.14, size=(num_steps, GrootTeleopG1Dataset.TOTAL_ROBOT_DOF)).astype(np.float32)
            )
            obs.create_dataset(
                "joint_velocities",
                data=rng.uniform(-1.0, 1.0, size=(num_steps, GrootTeleopG1Dataset.TOTAL_ROBOT_DOF)).astype(np.float32)
            )

            # Create synthetic 26-DoF action commands
            f.create_dataset(
                "actions",
                data=rng.uniform(-0.1, 0.1, size=(num_steps, GrootTeleopG1Dataset.ACTION_DIM)).astype(np.float32)
            )

            # Metadata attributes
            f.attrs["robot_embodiment"] = "Unitree G1"
            f.attrs["frequency_hz"] = 30.0
            f.attrs["teleop_operator"] = "HOROS-Simulated-Agent"

