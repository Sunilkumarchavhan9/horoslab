# HOROS First-Party Model Program: SHARED
## 07 — Infrastructure, Training Infrastructure & Compute Allocation

### 1. Distributed Training Architecture
The shared training infrastructure is engineered for scaling across multi-node GPU clusters:
* **Compute Cluster:** 64x NVIDIA H100 80GB SXM5 nodes interconnected via 3.2 Tbps NVIDIA Quantum-2 InfiniBand.
* **Distributed Framework:** PyTorch 2.4+ with Fully Sharded Data Parallelism 2 (FSDP2) and Megatron-Core Tensor Parallelism.
* **Kernel Optimizations:** FlashAttention-3, fused RMSNorm, fused SwiGLU, and FP8 Transformer Engine execution.
* **Checkpointing Strategy:** Asynchronous zero-copy checkpointing to high-performance NVMe storage, achieving $< 30$ seconds checkpoint write time for 14B parameter models.

### 2. Compute Budgeting & Allocation Roadmap
* **Trunk Pre-training (Shared Geometry & Temporal Dynamics):** 40,000 GPU hours.
* **PROBE-1 Adaptation & Flow Matching Fine-Tuning:** 25,000 GPU hours.
* **AEROPROBE-1 Operator Training & CFD Sweeps:** 25,000 GPU hours.
* **Verification, Benchmarking & Distillation:** 10,000 GPU hours.
* **Total Program Budget:** 100,000 H100 GPU hours.
