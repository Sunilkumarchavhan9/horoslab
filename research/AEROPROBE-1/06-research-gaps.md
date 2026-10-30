# HOROS First-Party Model Program: AEROPROBE-1
## 06 — Critical Research Gaps & Deficiencies

### 1. Gap 1: The Drag Count Precision Barrier
* **Deficiency:** In commercial aerospace design, a **single drag count** ($\Delta C_D = 0.0001$) translates to millions of dollars in lifetime fuel burn across an airline fleet. Existing neural surrogates routinely suffer from 10–30 drag counts of error, rendering them useless for final aerodynamic certification.
* **AEROPROBE-1 Solution:** Implement a dual-scale boundary-layer focused neural tokenizer that concentrates 70% of model capacity within the near-wall region ($y^+ < 30$), directly predicting wall shear stress vectors $\boldsymbol{\tau}_w$ alongside pressure fields.

### 2. Gap 2: Shock Discontinuity Smearing
* **Deficiency:** Global spectral and convolution methods smooth out discontinuous transonic normal shocks over multiple grid cells, completely mispredicting shock-induced flow separation and buffet boundaries.
* **AEROPROBE-1 Solution:** Introduce a **Directional Shock Attention Kernel** with anisotropic spatial decay oriented along the local Mach cone lines, preserving sharp gradients across supersonic discontinuities.

### 3. Gap 3: Complete Failure on Out-of-Distribution Geometric Topologies
* **Deficiency:** Surrogates trained on standard transport wings fail completely when presented with unconventional configurations (e.g., truss-braced wings, blended wing-bodies, canards).
* **AEROPROBE-1 Solution:** Ingest raw CAD B-Rep topological graphs and local curvature invariants rather than rigid global coordinates, enabling universal geometric transfer.

### 4. Gap 4: Violation of Fundamental Conservation Laws
* **Deficiency:** Pure data-driven deep learning models predict non-zero net mass flux across closed control volumes, generating unphysical artificial momentum sources.
* **AEROPROBE-1 Solution:** Hybrid loss function combining data regression with differentiable finite-volume conservation projection, penalizing violations of $\nabla \cdot (\rho \mathbf{u})$ and $\nabla \cdot (\rho \mathbf{u} \otimes \mathbf{u} + p\mathbf{I} - \boldsymbol{\tau})$.
