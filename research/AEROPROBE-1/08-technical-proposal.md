# HOROS First-Party Model Program: AEROPROBE-1
## 08 — Technical Proposal & Architecture Specification

### 1. System Architecture: HOROS-GeoTransolver
AEROPROBE-1 implements a **Multi-Scale Physics-Directed Geometric Transformer**:

```
[CAD Surface Point Cloud (131,072 Nodes)] + [Flight Conditions: Ma, Re, α]
                             │
                             ▼
         [Hierarchical Octree Patch Tokenizer]
         - Partitions surface into 1,024 geometric slices
         - Encodes local surface curvature, normals, area metric
                             │
                             ▼
         [Physics-Directed Cross-Attention Trunk]
         (850M Parameters, 24 Transformer Layers, 16 Attention Heads)
         - Computes non-local interactions across spatial slices
         - Incorporates Shock-Capturing Anisotropic Attention Decay
                             │
                             ▼
         [Dual-Branch Flow Field Decoder]
         ┌───────────────────────────────────────┬───────────────────────────────────────┐
         │ Branch 1: Surface Field Decoder       │ Branch 2: Implicit Near-Body Field    │
         │ - Pressure Coefficient Cp             │ - Velocity vector u(x,y,z)            │
         │ - Skin friction Cf                    │ - Static pressure p(x,y,z)            │
         │ - Wall shear stress vector τ_w        │ - Static temperature T(x,y,z)         │
         └───────────────────────────────────────┴───────────────────────────────────────┘
                             │
                             ▼
         [Differentiable Conservation & Integral Force Block]
         - Cl = ∫ Cp (n · k) dA + ∫ Cf (t · k) dA
         - Cd = ∫ Cp (n · i) dA + ∫ Cf (t · i) dA
         - Conservation Loss: ||∇ · (ρu)||² + ||∇ · (ρu ⊗ u + pI - τ)||²
```

### 2. Loss Function Formulation
The total optimization objective $\mathcal{L}_{\\text{total}}$ is a composite multi-task physics loss:
$$\mathcal{L}_{\\text{total}} = \lambda_{\\text{surf}} \mathcal{L}_{\\text{surf}} + \lambda_{\\text{force}} \mathcal{L}_{\\text{force}} + \lambda_{\\text{shock}} \mathcal{L}_{\\text{shock}} + \lambda_{\\text{pde}} \mathcal{L}_{\\text{pde}}$$
where:
1. **Surface Field Loss:**
   $$\mathcal{L}_{\\text{surf}} = \frac{1}{N} \sum_{i=1}^N \left[ w_p |C_{p,i} - \hat{C}_{p,i}|^2 + w_f |\boldsymbol{\tau}_{w,i} - \hat{\boldsymbol{\tau}}_{w,i}|^2 \right]$$
2. **Integrated Aerodynamic Force Loss (enforcing exact drag count resolution):**
   $$\mathcal{L}_{\\text{force}} = \alpha_L |C_L - \hat{C}_L|^2 + \alpha_D |C_D - \hat{C}_D|^2 + \alpha_m |C_m - \hat{C}_m|^2$$
3. **Shock-Capturing Total Variation Loss:**
   $$\mathcal{L}_{\\text{shock}} = \int_{\\text{wing}} |\nabla C_p - \nabla \hat{C}_p| \, dA$$
4. **Navier-Stokes Conservation Residual:**
   $$\mathcal{L}_{\\text{pde}} = \|\nabla \cdot (\hat{\rho} \hat{\mathbf{u}})\|^2 + \|\nabla \cdot (\hat{\rho} \hat{\mathbf{u}} \otimes \hat{\mathbf{u}} + \hat{p}\mathbf{I} - \hat{\boldsymbol{\tau}})\|^2$$

### 3. Latency & Resource Footprint
* **Model Parameters:** 850M parameters.
* **Weights Precision:** FP8 / BF16 mixed-precision inference.
* **Inference Speed:** 38 ms on NVIDIA H100 GPU (TensorRT-LLM compiled).
* **Speedup vs High-Order CFD:** $> 250{,}000\times$ faster than RANS ($k\text{-}\omega$ SST) on identical 3D geometries.
