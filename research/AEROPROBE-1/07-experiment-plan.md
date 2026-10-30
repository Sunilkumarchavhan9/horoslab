# HOROS First-Party Model Program: AEROPROBE-1
## 07 — Phased Experiment Plan & Training Roadmap

### Phase 1: 2D Transonic Airfoil & Shock Foundational Pretraining (Weeks 1–3)
* **Compute:** 16x NVIDIA H100 GPUs.
* **Data:** 100,000 2D transonic airfoil CFD sweeps (UIUC, RAE, NACA 6-series) spanning $Ma \in [0.4, 0.95], \alpha \in [-4^\circ, 15^\circ], Re \in [10^6, 50 \times 10^6]$.
* **Objective:** Establish baseline geometric neural operator. Validate shock capturing accuracy on RAE 2822 Cases 9 and 10 within $\pm 0.5\%$ chord.

### Phase 2: 3D Swept Wing Scaling & Boundary Layer Resolution (Weeks 4–7)
* **Compute:** 32x NVIDIA H100 GPUs.
* **Data:** ONERA M6 parametric variations, swept tapered wings, 30,000 3D surface flow cases.
* **Objective:** Scale architecture to 3D point cloud surfaces (131K nodes). Implement boundary layer wall shear stress head. Target drag prediction error $< 2.0$ drag counts.

### Phase 3: Full Aircraft Configurations & High-Reynolds Scaling (Weeks 8–11)
* **Compute:** 64x NVIDIA H100 GPUs.
* **Data:** NASA CRM (Wing-Body, Wing-Body-Nacelle-Pylon) + DrivaAerNet automotive flow datasets.
* **Objective:** Achieve full aerodynamic polar prediction under 45 ms. Enforce differentiable mass and momentum conservation loss terms. Attain $\le 1.0$ drag count precision.

### Phase 4: Inverse Aerodynamic Shape Optimization & MDO Integration (Weeks 12–15)
* **Compute:** 32x NVIDIA H100 GPUs.
* **Objective:** Integrate AEROPROBE-1 into HOROS Reality Fabric inverse design compiler. Perform closed-loop inverse shape optimization: synthesize full 3D transonic wing geometries satisfying specified drag polars in $< 10$ seconds.
