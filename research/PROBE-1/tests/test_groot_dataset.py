"""
HOROS PROBE-1 Unit Tests: GR00T-Teleop-G1 Dataset Loader & Schema Integrity
File: research/PROBE-1/tests/test_groot_dataset.py
"""

import os
import sys
import shutil
import tempfile
from pathlib import Path
import pytest
import torch
import numpy as np
import h5py

# Add research/PROBE-1 directory to sys.path for direct module imports
probe1_root = Path(__file__).parent.parent
if str(probe1_root) not in sys.path:
    sys.path.insert(0, str(probe1_root))

from datasets.groot_teleop_g1 import GrootTeleopG1Dataset


@pytest.fixture(scope="module")
def sample_dataset_dir():
    """
    Creates a temporary directory with 5 realistic HDF5 episodes
    plus 1 intentionally malformed episode to test error handling.
    """
    temp_dir = tempfile.mkdtemp(prefix="horos_probe1_test_")
    dir_path = Path(temp_dir)

    # Generate 5 valid episodes with varying lengths
    lengths = [75, 100, 120, 80, 110]
    for i, length in enumerate(lengths):
        ep_file = dir_path / f"episode_{i:04d}.h5"
        GrootTeleopG1Dataset.create_mock_episode(
            filepath=str(ep_file),
            num_steps=length,
            height=224,
            width=224,
            seed=42 + i
        )

    # Generate 1 malformed episode (missing joint_positions)
    corrupted_file = dir_path / "episode_corrupt.h5"
    with h5py.File(corrupted_file, "w") as f:
        f.create_dataset("dummy_data", data=np.zeros((10, 10)))

    # Generate 1 short episode (length < chunk_size 32)
    short_file = dir_path / "episode_too_short.h5"
    GrootTeleopG1Dataset.create_mock_episode(
        filepath=str(short_file),
        num_steps=20, # < 32
        seed=999
    )

    yield dir_path

    # Cleanup after test suite
    shutil.rmtree(temp_dir)


def test_dataset_initialization_and_indexing(sample_dataset_dir):
    """
    Verify that the dataset initializes, gracefully handles corrupted/short files,
    and indexes the correct number of sample windows.
    """
    chunk_size = 32
    dataset = GrootTeleopG1Dataset(data_dir=str(sample_dataset_dir), chunk_size=chunk_size)

    # 5 valid episodes of lengths [75, 100, 120, 80, 110]
    # Each episode yields (length - chunk_size) samples:
    # 75 - 32 = 43
    # 100 - 32 = 68
    # 120 - 32 = 88
    # 80 - 32 = 48
    # 110 - 32 = 78
    # Expected total = 43 + 68 + 88 + 48 + 78 = 325 samples.
    expected_total_samples = (75 - 32) + (100 - 32) + (120 - 32) + (80 - 32) + (110 - 32)
    assert len(dataset) == expected_total_samples, f"Expected {expected_total_samples} samples, got {len(dataset)}"


def test_tensor_shapes_and_types(sample_dataset_dir):
    """
    Assert that all returned tensors conform to the exact PROBE-1 tensor specification.
    """
    dataset = GrootTeleopG1Dataset(data_dir=str(sample_dataset_dir), chunk_size=32)
    sample = dataset[0]

    # Visual Streams
    assert sample["head_rgb"].shape == (3, 224, 224), "Head camera must be (3, 224, 224)"
    assert sample["wrist_left_rgb"].shape == (3, 224, 224), "Wrist Left camera must be (3, 224, 224)"
    assert sample["wrist_right_rgb"].shape == (3, 224, 224), "Wrist Right camera must be (3, 224, 224)"

    # Types and Value Ranges
    assert sample["head_rgb"].dtype == torch.float32
    assert sample["head_rgb"].min() >= 0.0 and sample["head_rgb"].max() <= 1.0, "Images must be normalized [0, 1]"

    # Proprioception (29 pos + 29 vel = 58)
    assert sample["proprioception"].shape == (58,), "Proprioceptive vector must have 58 elements (29 pos + 29 vel)"
    assert sample["proprioception"].dtype == torch.float32

    # Action Chunk (32 steps x 26 action dimensions)
    assert sample["action_chunk"].shape == (32, 26), "Action chunk must be (32, 26)"
    assert sample["action_chunk"].dtype == torch.float32


def test_modality_availability_flag(sample_dataset_dir):
    """
    CRITICAL AUDIT ASSERTION:
    Tactile availability flag must be 0.0 (unavailable) because GR00T-Teleop-G1
    does not include physical tactile measurements.
    """
    dataset = GrootTeleopG1Dataset(data_dir=str(sample_dataset_dir), chunk_size=32)
    sample = dataset[0]

    assert "tactile_available" in sample, "Sample must contain 'tactile_available' key"
    assert sample["tactile_available"].item() == 0.0, (
        "tactile_available must be 0.0 for GR00T-Teleop-G1 to prevent models from "
        "assuming valid physical tactile sensor data is present."
    )
    assert sample["vision_available"].item() == 1.0
    assert sample["proprio_available"].item() == 1.0


def test_numerical_integrity_no_nans_or_infs(sample_dataset_dir):
    """
    Assert that zero NaN or Inf values exist in any returned tensor.
    """
    dataset = GrootTeleopG1Dataset(data_dir=str(sample_dataset_dir), chunk_size=32)
    
    # Check first 20 samples
    for i in range(min(20, len(dataset))):
        sample = dataset[i]
        for key, tensor in sample.items():
            if torch.is_tensor(tensor) and tensor.dtype.is_floating_point:
                assert not torch.isnan(tensor).any(), f"NaN detected in tensor '{key}' at sample {i}"
                assert not torch.isinf(tensor).any(), f"Inf detected in tensor '{key}' at sample {i}"


def test_index_out_of_bounds_handling(sample_dataset_dir):
    """
    Assert that accessing out-of-bounds indices raises IndexError.
    """
    dataset = GrootTeleopG1Dataset(data_dir=str(sample_dataset_dir), chunk_size=32)
    
    with pytest.raises(IndexError):
        _ = dataset[len(dataset) + 10]

    with pytest.raises(IndexError):
        _ = dataset[-1]


def test_empty_directory_handling():
    """
    Assert FileNotFoundError when pointing to an empty directory.
    """
    with tempfile.TemporaryDirectory() as empty_dir:
        with pytest.raises(FileNotFoundError):
            _ = GrootTeleopG1Dataset(data_dir=empty_dir)
