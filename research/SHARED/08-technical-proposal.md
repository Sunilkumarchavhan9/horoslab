# HOROS First-Party Model Program: SHARED
## 08 — Technical Proposal & Core Platform Specification

### 1. HOROS Shared Foundation Architecture (HOROS-Core)
The overarching technical blueprint integrates shared representation learning with domain-specific execution heads:

```
[Raw Physical Sensor & Geometric Inputs]
                   │
                   ▼
[Unified Modality Ingestion & Patching]
├─ Images: SigLIP-2 Multi-View Patching
├─ 3D Geometry: Multi-Scale Octree Point Patching
├─ Telemetry: Continuous 1D Temporal Convolution
                   │
                   ▼
[HOROS-Core Foundation Trunk]
- Architecture: 3.8B - 14B Sparse Mixture of Experts (MoE)
- 32 Transformer Layers, 16 Expert Routing Heads (2 active/token)
- Rotary Position Embeddings (RoPE) for 3D Spatial-Temporal Coordinates
- FlashAttention-3 Kernel Acceleration
                   │
                   ▼
┌──────────────────┴──────────────────┐
│                                     │
▼                                     ▼
[Domain Adapter Head A: PROBE-1]     [Domain Adapter Head B: AEROPROBE-1]
- 45M Parameter Flow Matching DiT    - Multi-Scale Field Decoder (Cp, Cf, U)
- 100 Hz Continuous Action Chunking  - Continuous Coordinate Field Query
- GelSight Tactile Fusion            - Conservation Residual Loss Check
│                                     │
▼                                     ▼
[Real-Time Control Barrier Filter]   [Aero Design & Verification Gate]
│                                     │
▼                                     ▼
[Humanoid Actuators (Hardware)]       [Aircraft Design & CFD Validated Polar]
```

### 2. Model Registry & Lineage Contract
Every checkpoint generated within the HOROS research ecosystem conforms to the strict lineage contract:
1. **Immutable Manifest:** Contains parent checkpoint SHA-256, training dataset manifest hashes, parameter configuration, and evaluation benchmark certificates.
2. **Provenance Policy:** Checkpoints derived from open-weights (e.g., Llama, SigLIP, Prismatic) explicitly state their base ancestry in the metadata header and model card. Under no circumstances are adapted checkpoints described as trained from scratch.
3. **HOROS Runtime Certification:** Checkpoints undergo automated compilation to TensorRT-LLM and Triton before being registered into production serving pools.
