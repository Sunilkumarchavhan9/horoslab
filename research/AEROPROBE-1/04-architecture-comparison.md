# HOROS First-Party Model Program: AEROPROBE-1
## 04 — Architecture Comparison & Trade-off Study

### 1. Comparative Analysis of Neural Operator Architectures

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Architecture 1: Fourier Neural Operator (FNO / Geo-FNO)                    │
│ [Geometry Latent Grid] ──► [Spectral Convolution (FFT)] ──► [Field Output] │
└─────────────────────────────────────────────────────────────────────────────┘
  ❌ Pros: Quasi-linear time complexity, resolution independent.
  ❌ Cons: Inability to natively handle complex 3D non-Euclidean manifolds; boundary smoothing.

┌─────────────────────────────────────────────────────────────────────────────┐
│ Architecture 2: Graph Neural Operator (MeshGraphNet / GNO)                 │
│ [Mesh Nodes + Edges] ──► [Message Passing Layers] ──► [Node State Updates] │
└─────────────────────────────────────────────────────────────────────────────┘
  ⚠️ Pros: Strictly respects unstructured computational meshes.
  ⚠️ Cons: $O(V+E)$ compute overhead, severe GPU memory bottlenecks at $10^7$ cells.

┌─────────────────────────────────────────────────────────────────────────────┐
│ Architecture 3 (Selected for AEROPROBE-1):                                  │
│ Multi-Scale Physics-Directed Geometric Transformer (HOROS-GeoTransolver)  │
│                                                                             │
│ [3D Surface Points + Normals + Flow Condition Tokens (Ma, Re, α)]           │
│                                │                                            │
│                                ▼                                            │
│ [Multi-Scale Octree Patch Tokenizer (131K points ──► 1024 Physics Slices)]  │
│                                │                                            │
│                                ▼                                            │
│ [Physics-Directed Cross-Attention Backbone (24 Layers, 850M Params)]        │
│  - Captures non-local shock interactions and long-range wake shedding      │
│                                │                                            │
│                                ▼                                            │
│ [Dual-Branch Decoder Head]:                                                 │
│  ├─ Branch 1: High-Resolution Surface Decoder (Cp, Cf, Wall Shear)         │
│  └─ Branch 2: Implicit Near-Body Field Query (Query any x,y,z ──► u,p,T,ρ) │
│                                │                                            │
│                                ▼                                            │
│ [Differentiable Physics Conservation Residual Check]                        │
└─────────────────────────────────────────────────────────────────────────────┘
  ✅ Pros: Sub-50ms inference, mesh-free CAD direct evaluation, 1 drag count precision.
```

### 2. Comprehensive Trade-off Matrix

| Criterion | Geo-FNO | MeshGraphNet | AEROPROBE-1 (GeoTransolver) |
| :--- | :--- | :--- | :--- |
| **Geometric Representation** | Deformed tensor grid | Explicit computational mesh | Point cloud / B-Rep surface + Implicit query |
| **Mesh Generation Cost** | Requires structured grid | Requires 3D volumetric mesh (hours) | **Zero (direct CAD evaluation)** |
| **Scaling to 3D Aircraft** | Poor (coordinate distortion) | High memory exhaustion | **Native multi-scale patch attention** |
| **Shock-Capturing Sharpness** | Oversmoothed / ringing | Moderate | **High (directional attention slices)** |
| **Inference Time (H100)** | 12 ms | 190 ms | **38 ms** |
| **$C_D$ Error Tolerance** | $> 8$ drag counts | $\sim 5$ drag counts | **$\le 1.0$ drag count** |
| **Boundary Layer Sensitivity** | Poor | Good | **Exceptional (curvature & normal conditioning)** |
