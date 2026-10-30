# HOROS First-Party Model Program: AEROPROBE-1
## 01 — Comprehensive Literature Review

### 1. Evolution of Scientific Machine Learning for Aerodynamics
The intersection of deep learning and fluid dynamics has evolved through four major paradigms:

1. **Physics-Informed Neural Networks (PINNs):**
   * *Raissi et al. (2019):* Enforced Navier-Stokes partial differential equations directly into the loss function via automatic differentiation.
   * *Limitations:* Struggles to scale to high Reynolds numbers ($Re > 10^5$) due to extreme spectral bias, stiff optimization gradients, and failure to resolve thin boundary layers without dense collocation sampling.

2. **Fourier & Wavelet Neural Operators:**
   * *Fourier Neural Operator (FNO) (Li et al., 2020):* Parametrizes the integral kernel in Fourier space, computing continuous operator mappings invariant to discretization resolution.
   * *Geo-FNO (Li et al., 2022) & Factorized FNO:* Extended FNO to irregular geometries by learning coordinate deformation transforms.
   * *Limitations:* Struggles with sharp geometric discontinuities (airfoil trailing edges, nacelle-wing junctions) and requires structured coordinate remeshing.

3. **Graph Neural Networks on Unstructured Meshes:**
   * *MeshGraphNets (Pfaff et al., 2020):* Formulates CFD grid physics as message passing over unstructured tetrahedral/prismatic meshes.
   * *GraphCast (Lam et al., 2023):* Multi-scale icosahedral graph architecture for global weather forecasting.
   * *Limitations:* Message passing over millions of vertices incurs massive memory footprints ($O(V+E)$) and high latency, prone to oversmoothing across complex shock waves.

4. **Transformer-Based Neural Solvers:**
   * *Transolver (Wu et al., 2024):* State-of-the-art transformer architecture for learning physics-based neural operators. Solves the $O(N^2)$ attention bottleneck on large unstructured point clouds through Physics-Directed Attention and learned slice tokens.
   * *AeroSwin & DrivaAerNet Surrogates (2024):* Hierarchical windowed attention over multi-block aerodynamic geometries.

### 2. Theoretical Challenges & Frontiers in Aero-ML
* **The Boundary Layer Resolution Dilemma:** Physical viscous drag is determined within the viscous sublayer ($y^+ < 1$), where velocity gradients $\frac{\partial u}{\partial y}$ are extreme. Global neural operators frequently smooth over boundary layers, inducing 10–30 drag count errors ($10^{-3}$ in $C_D$).
* **Shock-Wave Gibbs Phenomenon:** Neural operators parameterizing continuous Sobolev spaces suffer from oscillatory overshoot near transonic shocks unless explicitly equipped with non-linear shock-capturing viscosity or TVD (Total Variation Diminishing) regularizers.
