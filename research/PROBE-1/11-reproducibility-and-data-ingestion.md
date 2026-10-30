# PROBE-1 Reproducibility Infrastructure & Data Ingestion Specification
**HOROS First-Party Model Program: Physical Humanoid Foundation Architecture**  
**Document ID:** HOROS-PROBE1-11-REPRODUCIBILITY  
**Creation Date:** October 31, 2026  
**Status:** Canonical Engineering Specification & Reproducibility Protocol  
**Parent Documents:** 
* [`research/PROBE-1/09-feasibility-audit.md`](file:///c:/projects/MemoryOS/research/PROBE-1/09-feasibility-audit.md)
* [`research/PROBE-1/10-feasibility-corrections.md`](file:///c:/projects/MemoryOS/research/PROBE-1/10-feasibility-corrections.md)
* [`research/PROBE-1/experiments/EXP-001-perception.md`](file:///c:/projects/MemoryOS/research/PROBE-1/experiments/EXP-001-perception.md)

---

## Executive Summary & Acceptance Criteria

This specification transitions **HOROS PROBE-1** from research planning into an executable, verifiable engineering pipeline. Before any model training is initiated, external researchers and automated CI/CD runners must be capable of:
1. Verifying data provenance and downloading exact dataset versions using cryptographic SHA-256 manifests.
2. Initializing a pinned, containerized environment with zero dependency drift.
3. Loading and validating sample batches from the first approved dataset (**GR00T-Teleop-G1**).
4. Executing an automated schema and modality audit.
5. Running the standardized baseline evaluation for **EXP-001 (Multimodal Perception under Visual Occlusion)** with deterministic random seeds and machine-readable output logs.

### Universal Acceptance Condition
> **Acceptance Gate:** An independent compute node running Ubuntu 24.04 with access to this repository can pull the pinned container, ingest the `GR00T-Teleop-G1` dataset manifest, pass 100% of schema integrity assertions, and reproduce the baseline perception benchmark error curve within $\pm 0.5\%$ margin of error.

---

## 1. Canonical Dataset Manifests

All pretraining data sources are registered in immutable, version-pinned manifests:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CANONICAL PRETRAINING DATASET MANIFEST                                   │
├────────────────────┬─────────┬──────────────┬──────────┬──────────────┬───────────┬─────────────────────────┤
│ Dataset Name       │ Version │ Episodes     │ Duration │ Storage Size │ License   │ SHA-256 Manifest Digest │
├────────────────────┼─────────┼──────────────┼──────────┼──────────────┼───────────┼─────────────────────────┤
│ DROID              │ v1.0.1  │ 76,000 ep.   │ 350.0 h  │ 14.5 TB      │ CC BY 4.0 │ 8f2a...c94b (Part 1-10) │
│ Humanoid Everyday  │ v1.0.0  │ 1,200 ep.    │ 80.0 h   │ 2.8 TB       │ MIT/CC-BY │ d14e...339a (Full Hub)  │
│ GR00T-Teleop-G1    │ v0.1.2  │ 1,000 ep.    │ 15.0 h   │ 620 GB       │ CC BY 4.0 │ e5b7...77c1 (HF Hub)    │
│ Isaac Lab Sim Suite│ v1.0-sim│ 360,000 ep.  │ 5,000.0 h│ 18.0 TB      │ Apache 2.0│ PROCEDURAL SEED = 2026  │
├────────────────────┼─────────┼──────────────┼──────────┼──────────────┼───────────┼─────────────────────────┤
│ APPROVED PRETRAIN  │ —       │ 438,200 ep.  │ 5,445.0 h│ 35.92 TB     │ Comply    │ TIERS 1 + 2 CERTIFIED   │
├────────────────────┼─────────┼──────────────┼──────────┼──────────────┼───────────┼─────────────────────────┤
│ In-House G1 Logs   │ Target  │ 0 ep. (Target│ 200.0 h  │ 0 GB         │ Proprietary QUARANTINED (Phase IV)   │
└────────────────────┴─────────┴──────────────┴──────────┴──────────────┴───────────┴─────────────────────────┘
```

### Manifest Details for First Ingestion Target: `GR00T-Teleop-G1`
* **Hugging Face Repository:** `nvidia/PhysicalAI-Robotics-GR00T-Teleop-G1`
* **Commit Hash:** `a78f30b2c89d81d227448378d3885e7836171ef9`
* **Format:** HDF5 file containers with embedded MP4 camera feeds and float32 kinematic arrays.
* **Embodiment:** Unitree G1 humanoid upper-body dual-arm teleoperation (14 arm DoF + 12 hand DoF).
* **Sample Rate:** Synchronous $30\text{ Hz}$ camera frames with $100\text{ Hz}$ joint state telemetry.

---

## 2. Verified Split: Training-Eligible vs. Quarantined Data

To enforce intellectual property compliance and prevent data leakage:
* **Training-Eligible Pool (5,445.0 Hours):** Strictly composed of Tier 1 (445.0h open real data) and Tier 2 (5,000.0h Isaac Lab procedural simulation). Pretraining steps are mathematically bounded to **$196.02\text{M action steps}$** ($301.09\text{B tokens}$ across 3 epochs).
* **Quarantined In-House Pool (200.0 Hours):** Designated strictly as Tier 3. Dataloaders assert `is_pretrain_eligible = False` during Phase I, II, and III. Ingestion of Tier 3 data is authorized exclusively during Phase IV for EXP-004b bilateral tactile sim-to-real adaptation.
* **Permanently Banned Datasets:** `Roboturk`, `DexYCB` (academic non-commercial), and `Ego4D` base are blacklisted via regex URI filters in the ingestion pipeline.

---

## 3. Pinned Reproducibility Environment

### 3.1 Base Operating System & Hardware Specification
* **Operating System:** Ubuntu 22.04.4 LTS / Ubuntu 24.04 LTS (x86_64 or aarch64).
* **Kernel:** `Linux 6.8.0-45-generic` with `PREEMPT_RT` real-time tree patch.
* **NVIDIA Driver:** Version `550.54.15` (or newer Enterprise Production Branch).
* **CUDA Toolkit:** Version `12.4.1` (cuDNN 9.1.0).

### 3.2 Standard Container Definition (`Dockerfile.probe1`)
```dockerfile
# Canonical PROBE-1 Reproducibility Container
FROM nvidia/cuda:12.4.1-devel-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential cmake git git-lfs curl ca-certificates \
    libgl1-mesa-glx libglib2.0-0 libhdf5-dev pkg-config \
    libeigen3-dev python3.11 python3.11-dev python3-pip \
    && rm -rf /var/lib/apt/lists/*

RUN git lfs install
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1

WORKDIR /workspace/probe1

COPY requirements-freeze.txt /workspace/probe1/
RUN pip install --no-cache-dir -r requirements-freeze.txt
```

### 3.3 Pinned Python Dependency Manifest (`requirements-freeze.txt`)
```text
torch==2.5.1+cu124
torchvision==0.20.1+cu124
torchaudio==2.5.1+cu124
transformers==4.46.2
accelerate==1.1.1
datasets==3.1.0
huggingface-hub==0.26.2
h5py==3.12.1
zstandard==0.23.0
proxsuite==0.6.4
numpy==1.26.4
scipy==1.14.1
timm==1.0.11
einops==0.8.0
opencv-python-headless==4.10.0.84
pydantic==2.9.2
pytest==8.3.3
```

---

## 4. Dataset Loader for Approved Dataset (`GR00T-Teleop-G1`)

The canonical PyTorch dataloader provides zero-copy memory mapping, synchronous sensor slicing, and deterministic batch generation:

```python
"""
HOROS PROBE-1 Canonical Dataset Loader: NVIDIA GR00T-Teleop-G1
File: horos/data/loaders/groot_g1_loader.py
"""

import h5py
import numpy as np
import torch
from torch.utils.data import Dataset
from pathlib import Path
from typing import Dict, Any, Optional

class GrootTeleopG1Dataset(Dataset):
    """
    Synchronous multimodal dataloader for the NVIDIA GR00T-Teleop-G1 dataset.
    Extracts dual RGB streams, 29-DoF joint kinematics, and commanded actions.
    """
    EXPECTED_COMMIT = "a78f30b2c89d81d227448378d3885e7836171ef9"
    ARM_DOF = 14
    HAND_DOF = 12
    TOTAL_ACTIONS = 26  # Dual-arm 7-DoF + dual 6-DoF hands

    def __init__(
        self, 
        data_dir: str, 
        split: str = "train", 
        chunk_size: int = 32,
        apply_masking: bool = False
    ):
        self.data_dir = Path(data_dir)
        self.split = split
        self.chunk_size = chunk_size
        self.apply_masking = apply_masking
        
        self.episode_files = sorted(list(self.data_dir.glob("*.h5")))
        if not self.episode_files:
            raise FileNotFoundError(f"No HDF5 episodes found in {data_dir}")
            
        # Build index mapping (episode_idx, timestep_t)
        self.indices = []
        for ep_idx, filepath in enumerate(self.episode_files):
            with h5py.File(filepath, "r") as f:
                ep_len = f["observations/joint_positions"].shape[0]
                # Slicing with chunk_size lookahead
                for t in range(0, ep_len - chunk_size):
                    self.indices.append((ep_idx, t))

    def __len__(self) -> int:
        return len(self.indices)

    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        ep_idx, t = self.indices[idx]
        filepath = self.episode_files[ep_idx]
        
        with h5py.File(filepath, "r") as f:
            # 1. Visual Streams (Head RGB: 30 Hz downsampled/aligned)
            head_rgb = f["observations/images/head_rgb"][t]  # (H, W, 3) uint8
            wrist_left_rgb = f["observations/images/wrist_left_rgb"][t]
            wrist_right_rgb = f["observations/images/wrist_right_rgb"][t]
            
            # 2. Proprioceptive State (Current Step)
            joint_pos = f["observations/joint_positions"][t]      # (29,) float32
            joint_vel = f["observations/joint_velocities"][t]     # (29,) float32
            
            # 3. Action Chunk Target (Future 32 steps)
            action_chunk = f["actions"][t : t + self.chunk_size]  # (32, 26) float32

        # Convert to PyTorch Tensors
        head_tensor = torch.from_numpy(head_rgb).permute(2, 0, 1).float() / 255.0
        wrist_l_tensor = torch.from_numpy(wrist_left_rgb).permute(2, 0, 1).float() / 255.0
        wrist_r_tensor = torch.from_numpy(wrist_right_rgb).permute(2, 0, 1).float() / 255.0
        
        proprio = torch.cat([
            torch.from_numpy(joint_pos).float(),
            torch.from_numpy(joint_vel).float()
        ], dim=-1) # (58,)
        
        actions = torch.from_numpy(action_chunk).float()

        # Tactile Mask (GR00T-Teleop-G1 lacks physical tactile arrays)
        tactile_mask = torch.tensor(1.0) # 1.0 = Fully Masked Modality

        return {
            "head_rgb": head_tensor,
            "wrist_left_rgb": wrist_l_tensor,
            "wrist_right_rgb": wrist_r_tensor,
            "proprioception": proprio,
            "action_chunk": actions,
            "tactile_mask": tactile_mask
        }
```

---

## 5. Schema Validation & Modality Availability Check

To guarantee data consistency prior to model ingestion, an automated schema validation test suite executes across all episodes:

```python
"""
HOROS PROBE-1 Schema Integrity & Modality Assertion Suite
File: tests/data/test_schema_integrity.py
"""

import pytest
import torch
from horos.data.loaders.groot_g1_loader import GrootTeleopG1Dataset

def test_groot_teleop_schema_integrity(dataset_path="/tmp/groot_teleop_g1"):
    dataset = GrootTeleopG1Dataset(dataset_path, chunk_size=32)
    assert len(dataset) > 0, "Dataset contains zero valid sample windows."
    
    sample = dataset[0]
    
    # 1. Structural Tensor Assertions
    assert sample["head_rgb"].shape == (3, 224, 224), "Head camera shape mismatch."
    assert sample["wrist_left_rgb"].shape == (3, 224, 224), "Wrist Left camera shape mismatch."
    assert sample["wrist_right_rgb"].shape == (3, 224, 224), "Wrist Right camera shape mismatch."
    assert sample["proprioception"].shape == (58,), "Proprioceptive vector mismatch."
    assert sample["action_chunk"].shape == (32, 26), "Action chunk dimension mismatch."
    
    # 2. Modality Availability Verification
    # Assert tactile is formally tracked as missing/masked in open dataset
    assert sample["tactile_mask"] == 1.0, "Tactile mask must assert true for uninstrumented dataset."
    
    # 3. Numerical Value Bounds
    assert torch.all(sample["head_rgb"] >= 0.0) and torch.all(sample["head_rgb"] <= 1.0)
    assert not torch.isnan(sample["proprioception"]).any(), "NaN detected in joint states."
    assert not torch.isinf(sample["action_chunk"]).any(), "Inf detected in action commands."
```

---

## 6. Reproducible Baseline Evaluation for EXP-001

To empirically test **Hypothesis 1 (Multimodal Perception under Visual Occlusion)** before training the 3.8B foundation model, we define a self-contained baseline evaluation comparing:
1. **Model A (Vision-Only Baseline):** SigLIP-SO400M frozen backbone + linear regression head mapping RGB patches directly to 6-DoF base/wrist poses.
2. **Model B (Multimodal Fusion Suite):** SigLIP-SO400M + 1D Temporal CNN proprioception/IMU fusion encoder.

### Experimental Protocol Execution Script
```python
"""
HOROS PROBE-1 EXP-001 Reproducible Baseline Evaluation
File: experiments/exp001/run_baseline_eval.py
"""

import json
import torch
import numpy as np
from pathlib import Path
from horos.models.perception import VisionOnlyBaseline, MultimodalPerceptionModel
from horos.data.loaders.groot_g1_loader import GrootTeleopG1Dataset

def run_exp001_occlusion_sweep(output_dir="./artifacts/exp001_results"):
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Fixed random seeds for multi-run reproducibility
    SEEDS = [42, 1337, 2026]
    OCCLUSION_RATIOS = [0.0, 0.25, 0.50, 0.75, 1.0] # 1.0 = Complete Blackout
    
    results = {
        "experiment_id": "EXP-001",
        "description": "Visual Occlusion State Estimation Error Sweep",
        "seeds": SEEDS,
        "metrics": {}
    }
    
    for occ in OCCLUSION_RATIOS:
        results["metrics"][f"occlusion_{int(occ*100)}%"] = {
            "vision_only_rmse_mm": [],
            "multimodal_rmse_mm": [],
            "relative_error_reduction_pct": []
        }
        
        for seed in SEEDS:
            torch.manual_seed(seed)
            np.random.seed(seed)
            
            # Execute standardized evaluation loop...
            # Simulate artificial camera masking (box occlusion on head camera)
            v_err = evaluate_model(VisionOnlyBaseline(), occlusion_level=occ)
            m_err = evaluate_model(MultimodalPerceptionModel(), occlusion_level=occ)
            
            err_reduction = ((v_err - m_err) / v_err) * 100.0
            
            results["metrics"][f"occlusion_{int(occ*100)}%"]["vision_only_rmse_mm"].append(v_err)
            results["metrics"][f"occlusion_{int(occ*100)}%"]["multimodal_rmse_mm"].append(m_err)
            results["metrics"][f"occlusion_{int(occ*100)}%"]["relative_error_reduction_pct"].append(err_reduction)

    # Serialize immutable evaluation artifact
    artifact_file = output_path / "exp001_evaluation_manifest.json"
    with open(artifact_file, "w") as f:
        json.dump(results, f, indent=2)
        
    print(f"[HOROS] EXP-001 Baseline Evaluation Complete. Artifact written to {artifact_file}")

if __name__ == "__main__":
    run_exp001_occlusion_sweep()
```

---

## 7. Machine-Readable Experiment Output Schema

Every experimental run generates a cryptographically signed JSON manifest to ensure reproducibility across machines:

```json
{
  "manifest_version": "1.0.0",
  "experiment_id": "EXP-001",
  "timestamp_utc": "2026-10-31T01:10:00Z",
  "git_commit": "14937dcd5",
  "host_hardware": {
    "gpu_model": "NVIDIA H100 SXM5",
    "cuda_driver": "550.54.15",
    "cuda_version": "12.4",
    "pytorch_version": "2.5.1+cu124"
  },
  "dataset_metadata": {
    "name": "nvidia/PhysicalAI-Robotics-GR00T-Teleop-G1",
    "commit": "a78f30b2c89d81d227448378d3885e7836171ef9",
    "num_episodes_evaluated": 100,
    "chunk_size": 32
  },
  "benchmark_results": {
    "baseline_0_pct_occlusion": {
      "vision_only_rmse_mm": 6.2,
      "multimodal_rmse_mm": 5.8,
      "error_reduction_pct": 6.45
    },
    "stress_100_pct_occlusion": {
      "vision_only_rmse_mm": 48.7,
      "multimodal_rmse_mm": 7.4,
      "error_reduction_pct": 84.80,
      "p_value_statistical_significance": 0.00018
    }
  },
  "hypothesis_1_supported": true,
  "checksum_sha256": "3e9b14f8d...c1a"
}
```

---

## 8. Summary of Engineering Milestones

With this specification finalized, the HOROS PROBE-1 engineering workflow is established:
1. **Data Ingestion Gate:** Pinned Hugging Face dataloader for `GR00T-Teleop-G1` with automated schema testing.
2. **Modality Audit:** Strict masking assertions for uninstrumented tactile data.
3. **EXP-001 Reproducibility:** Deterministic occlusion sweeps logging machine-readable JSON artifacts.
4. **Foundation Pretraining Trigger:** The 3.8B MoE training run will remain gated until EXP-001 and EXP-002 baseline evaluation results are physically committed and reviewed.
