# HOROS First-Party Model Program: AEROPROBE-1
## 03 — Dataset Audit, Data Contracts & Pipeline

### 1. Aerodynamic Dataset Repositories & Benchmarks

#### A. DrivaAerNet & DrivaAerNet++
* **Domain:** External vehicle and bluff-body aerodynamics.
* **Scale:** 4,000+ high-fidelity 3D car shapes with RANS ($k\text{-}\omega$ SST) simulations, totaling over 10 billion cell values.
* **Utility:** Provides deep aerodynamic wake and vortex breakdown training data.

#### B. NASA Common Research Model (CRM) & DPW Suites
* **Domain:** Transonic commercial transport aircraft ($Ma \in [0.70, 0.88]$, $Re \in [5 \times 10^6, 30 \times 10^6]$).
* **Source:** AIAA Drag Prediction Workshops (DPW-I through DPW-VII).
* **Validation:** High-accuracy wind-tunnel surface pressure taps, wing twist deformations, and oil-flow visualization data.

#### C. Airfoil & Wing Benchmark Databases
* **UIUC Airfoil Database:** 1,600+ 2D airfoil coordinate sets spanning low-Re gliders to supercritical airfoils.
* **RAE 2822 Transonic Test Cases:** Definitive AGARD experimental dataset for shock-induced boundary layer separation.
* **ONERA M6 Wing:** Classical 3D transonic wing benchmark with extensive transonic $\lambda$-shock experimental measurements ($Ma = 0.84, \alpha = 3.06^\circ$).

### 2. Automated Synthetic CFD Sweep Engine (HOROS-AeroGen)
To achieve model generalization, AEROPROBE-1 deploys an automated parametric flow simulation farm:
1. **Parametric Geometry Engine:** CST (Class-Shape Transformation) parameterization and Free-Form Deformation (FFD) generating 50,000+ aerodynamically viable wing, nacelle, and blended-body configurations.
2. **Automated Meshing & Solver Farm:** SU2 / OpenFOAM cluster deployment with snappyHexMesh generating automated prism-layer meshes with $y^+ \le 1$.
3. **Solver Modes:** Spallart-Allmaras (SA) and $k\text{-}\omega$ Shear Stress Transport (SST) turbulence models with compressible density-based solvers.

### 3. Unified Aerodynamic Data Schema (HOROS-Aero-v1)
```json
{
  "case_id": "aeroprobe1_transonic_wing_004291",
  "geometry": {
    "surface_point_cloud": {"count": 131072, "format": "xyz_normals_curvature"},
    "cad_brep_features": {"leading_edge_radius_norm": 0.018, "sweep_angle_deg": 28.5, "aspect_ratio": 9.4}
  },
  "flight_conditions": {
    "mach": 0.84,
    "reynolds": 11700000.0,
    "angle_of_attack_deg": 2.85,
    "ambient_temperature_k": 216.65,
    "ambient_pressure_pa": 22632.0
  },
  "surface_fields": {
    "pressure_coefficient_cp": [131072],
    "skin_friction_coefficient_cf": [131072],
    "surface_streamlines": [131072, 3]
  },
  "integrated_forces": {
    "c_lift": 0.5284,
    "c_drag": 0.0242,
    "c_moment_pitch": -0.0891,
    "drag_counts": 242.0
  },
  "conservation_residuals": {
    "continuity_residual": 8.4e-6,
    "momentum_residual": 1.2e-5
  }
}
```
