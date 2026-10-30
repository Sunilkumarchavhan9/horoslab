# HOROS First-Party Model Program: AEROPROBE-1
## 02 — Technical Audit of Existing Models

### 1. Comparative Matrix of SOTA Baselines

| Model / Framework | Architecture | Input Representation | Flow Regimes | Grid Dependency | Inference Time | $C_D$ Error | License | Key Deficiencies |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Transolver** | Physics-Directed Transformer | Unstructured Point Cloud ($N=10^5$) | Subsonic / Transonic | Mesh-free | 35 ms | $\sim 3\text{--}5$ counts | Open (MIT) | No shock capturing, single-component geometry bias |
| **Geo-FNO** | Fourier Neural Operator | Deformed Coordinate Mesh | Incompressible / 2D Transonic | Fixed Topology | 12 ms | $> 8$ counts | Open (Apache 2.0) | Cannot scale to complex 3D wing-body aircraft |
| **MeshGraphNets** | Deep GNN (Message Passing) | Unstructured CFD Mesh | Subsonic Laminar/Turbulent | Strict Mesh Dependent | 180 ms | $\sim 5\text{--}8$ counts | Open (Apache 2.0) | High GPU memory, slow training convergence |
| **DeepCFD** | 3D Convolutional Network | Voxelized Signed Distance Field | 2D/3D Incompressible | Voxel Grid | 25 ms | $> 15$ counts | Open (MIT) | Poor boundary resolution due to voxelization artifacts |
| **OpenFOAM / SU2** | Classical Finite Volume | High-Order Prismatic/Hex Mesh | Subsonic to Hypersonic | Manual Grid Gen | 1-8 hours | Ground Truth | Open (GPL) | Extremely slow, compute prohibitive for interactive MDO |

### 2. Detailed Root-Cause Analysis of Current Model Failures
1. **Geometric Topology Inflexibility:** Voxel-based or uniform mesh models fail when wing aspect ratios exceed 10:1. An airliner wing tip has a chord of 1.5 m on a 60 m wingspan; uniform voxels blur the leading-edge radius into a staircase, destroying suction peak prediction.
2. **Lack of Enforced Boundary Physics:** Standard Mean Squared Error (MSE) loss weights all spatial points equally. Since boundary layer cells represent $< 1\%$ of volumetric volume, models minimize global MSE while completely mispredicting wall shear stress $\tau_w$ and parasitic drag.
