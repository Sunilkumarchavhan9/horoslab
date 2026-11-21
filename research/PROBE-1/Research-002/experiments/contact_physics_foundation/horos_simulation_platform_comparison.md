# HOROS PROBE-1 — Contact Mechanics Simulation Platform Comparison

**Program:** HOROS Physical Intelligence Research Group  
**Project:** Research-002: Model Teaching Infrastructure & Contact Mechanics  
**Document Identifier:** `HOROS-P1-R002-SIMULATION-PLATFORM-COMPARISON`  
**Date:** 2026-11-20  
**Status:** **AUTHORITATIVE ARCHITECTURAL EVALUATION**  

---

### 1. Executive Summary

Following the empirical finding that HOROS PROBE-1's existing simulator cannot support pre-slip friction forecasting due to idealized rigid-Coulomb physics, this assessment evaluates four architectural alternatives for the next-generation contact simulation engine:
- **Option A:** Extended In-House Python / NumPy Physics Kernel (`CompliantPreLiftContactEnv-v2`)
- **Option B:** NVIDIA Isaac Lab / Isaac Sim with PhysX 5 & Newton (GPU Warp Kernels)
- **Option C:** Antioch Continuum Contact Mechanics Simulator
- **Option D:** General-Purpose Robotics Physics Engines (MuJoCo 3.x, Drake, Genesis, SOFA)

Each platform is systematically benchmarked across **12 technical dimensions** essential for world-model training, physical determinism, tactile observability, and experimental calibration.

---

### 2. Multi-Platform Architectural Evaluation Matrix

| # | Evaluation Dimension | Option A: In-House Python/NumPy v2 | Option B: NVIDIA Isaac Lab / Newton | Option C: Antioch Simulator | Option D1: MuJoCo 3.x | Option D2: Drake (Hydroelastic) |
| :-: | :--- | :---: | :---: | :---: | :---: | :---: |
| **1** | **Contact Fidelity & Partial Slip** | **High** (Closed-form Cattaneo-Mindlin / LuGre) | **High** (Custom Warp contact kernels) | **Very High** (Nonlinear continuum FEM) | **Low–Medium** (Ellipsoidal friction cone; rigid stick-slip) | **Medium–High** (Compliant pressure field, regularized slip) |
| **2** | **Soft-Body & Elastomer Mechanics** | **Medium** (Discretized Winkler / multi-ring) | **High** (PhysX FEM & MPM particles) | **Very High** (Full 3D hyperelastic FEM) | **Low** (Rigid bodies + soft constraints) | **Medium** (Hydroelastic contact approximation) |
| **3** | **Custom Constitutive Laws** | **Maximum** (Direct Python/C extensions) | **High** (Custom CUDA/Warp user shaders) | **Medium** (C++ solver hooks required) | **Low** (Hardcoded solver LCP / QP) | **Medium** (Custom C++ plant systems) |
| **4** | **Tactile Sensor Emulation** | **High** (Spatial grid & vibrotactile noise) | **Very High** (Omniverse RTX ray tracing / depth) | **High** (Stress tensor extraction at surface) | **Medium** (Point force sensors; no area) | **Medium–High** (Hydroelastic pressure patch) |
| **5** | **Differentiability / Gradients** | **High** (PyTorch compatible autograd) | **Very High** (NVIDIA Warp automatic autodiff) | **Medium** (Adjoint sensitivity in development) | **Medium** (MuJoCo derivative / MJX) | **Medium** (Drake autodiff scalar types) |
| **6** | **Parallel Simulation Throughput** | **Medium** ($5\text{k} - 15\text{k}$ steps/sec on 16 CPUs) | **Extreme** ($100\text{k} - 1\text{M}$ steps/sec on GPU) | **Very Low** ($10 - 100$ steps/sec, FEM solve) | **High** ($50\text{k} - 200\text{k}$ steps/sec) | **Medium** ($5\text{k} - 20\text{k}$ steps/sec) |
| **7** | **Numerical Determinism & Parity** | **Absolute (100%)** (Bitwise reproducible across OS) | **Good (98–99%)** (GPU warp non-associativity) | **High** (Linear solver convergence tolerance) | **High** (Deterministic CPU; MJX varies) | **High** (Strict deterministic time-stepping) |
| **8** | **PyTorch / RL Interoperability** | **Seamless** (Zero IPC; native memory) | **Seamless** (Torch tensor pointers on VRAM) | **Difficult** (File/IPC sockets required) | **High** (Gymnasium / MJX) | **Medium** (Python pydrake bindings) |
| **9** | **Licensing & Dependencies** | **Zero Overhead** (Open source, in-repo) | **Heavy** (Omniverse EULA, GPU driver lock-in) | **Research / Proprietary** | **Open Source** (Apache 2.0) | **Open Source** (BSD 3-Clause) |
| **10** | **Compute Requirements** | **Minimal** (Runs on standard laptops/CI) | **Heavy** (Modern RTX Ada / Ampere GPU) | **High CPU** (Multi-core cluster for FEM) | **Minimal** (Standard CPU) | **Minimal** (Standard CPU) |
| **11** | **Implementation & Migration Time** | **Fast** ($1 - 2$ weeks) | **Moderate–High** ($4 - 8$ weeks) | **Extreme** ($12 - 24$ weeks) | **Moderate** ($3 - 5$ weeks) | **Moderate–High** ($4 - 6$ weeks) |
| **12** | **Physical Calibration Readiness** | **Immediate** (Direct parameter fitting) | **Moderate** (Requires system identification pipeline) | **High** (Standard material constitutive parameters) | **Low** (Opaque constraint solver parameters) | **Moderate** (Hydroelastic modulus tuning) |

---

### 3. Detailed Architectural Profiles

#### 3.1 Option A: Extended In-House Python/NumPy Kernel (`CompliantPreLiftContactEnv-v2`)
- **Core Architecture:** Extends the existing deterministic HOROS pipeline with analytical Cattaneo-Mindlin compliance softening, multi-annular pressure integration, and dynamic LuGre micro-slip dynamics.
- **Key Strengths:**
  1. *Immediate Continuity:* Preserves 100% of existing action interfaces, safety wrappers (`CBF v1.0`), state definitions, and test suites (307 passing tests).
  2. *Exact Physical Observability:* Implements closed-form equations where $dF_t / d\delta_t$ softens deterministically as a function of $\mu_{\text{true}}$, enabling direct validation of pre-slip forecasting hypotheses.
  3. *Bitwise Parity:* Runs identically on Windows, Linux, and GitHub Actions CI without specialized GPU hardware.
- **Key Limitations:**
  - Cannot scale to full 3D deformable finite-element meshing for arbitrary non-axisymmetric geometries.
  - Throughput capped at CPU multiprocessing limits ($\sim 10^4$ steps/sec).

#### 3.2 Option B: NVIDIA Isaac Lab / Newton (GPU Warp Simulation)
- **Core Architecture:** GPU-accelerated simulation ecosystem utilizing PhysX 5 and NVIDIA Warp for differentiable spatial mechanics and high-throughput parallel rollouts.
- **Key Strengths:**
  1. *Throughput:* Up to $10^6$ environment steps/second on a single RTX 4090, enabling massive parallel world-model exploration.
  2. *Optical Tactile Rendering:* Built-in ray tracing enables synthetic GelSight/DIGIT tactile elastomer deformation rendering.
  3. *Warp Differentiability:* Native automatic differentiation through contact points for gradient-based system identification.
- **Key Limitations:**
  - Standard PhysX friction model is velocity-based regularized Coulomb; capturing true micro-slip compliance requires custom Warp kernels.
  - Heavy infrastructure footprint: requires Omniverse installation, CUDA 12+, and breaks lightweight GitHub Actions CI without self-hosted GPU runners.

#### 3.3 Option C: Antioch Continuum Contact Mechanics Simulator
- **Core Architecture:** Specialized continuum mechanics and finite-element solver focusing on multi-scale contact, hyperelastic material degradation, and frictional interfaces.
- **Key Strengths:**
  - Highest theoretical fidelity for 3D stress tensors, subsurface shear strain, and asperity micro-welding.
- **Key Limitations:**
  - Incompatible with real-time RL / world-model training: FEM step solve time is $10 - 500\text{ ms}$ per step ($2 - 100\text{ Hz}$).
  - Immature robotics/Gymnasium API; requires custom IPC bindings and state synchronization pipelines.
  - High risk of stalling research timeline.

#### 3.4 Option D: General Multibody Engines (MuJoCo & Drake)
- **MuJoCo 3.x:** Superb multibody dynamics and velocity-stepping LCP solver, but models contact as convex optimization with rigid Coulomb friction cones. It natively exhibits the exact same step-discontinuous slip transitions that caused the failure of `CompliantPreLiftContactEnv-v1`.
- **Drake (Hydroelastic Model):** Computes contact pressure fields across overlapping soft meshes, providing smoother force transitions. However, its tangential friction model remains a regularized Coulomb approximation that lacks the Cattaneo-Mindlin stick-slip annulus contraction.

---

### 4. Strategic Assessment & Recommendations

#### 4.1 Fatal Flaw Analysis of Purely Rigid Engines
Both standard MuJoCo and basic PhysX solve contact using Linear Complementarity Problems (LCP) or Quadratic Programs (QP) that enforce velocity constraints:
$$\dot{\mathbf{v}} = \mathbf{0} \quad \text{if } \|\mathbf{F}_t\| < \mu F_n$$
This mathematical structure guarantees that during pre-slip sticking, tangential acceleration and micro-displacement are identically zero. Consequently, **no off-the-shelf rigid-body simulator supports pre-slip friction forecasting without custom contact modification.**

#### 4.2 The Winning Path: Dual-Stage Evolution Strategy
To combine scientific rigor, immediate progress, and long-term scalability, a **two-stage evolutionary architecture** is recommended:
1. **Stage 1 (Immediate Proof-of-Concept): Option A (`CompliantPreLiftContactEnv-v2`)**
   - Implement the analytical Cattaneo-Mindlin softening kernel directly in the existing HOROS Python environment.
   - Validate pre-slip friction observability ($R^2 \ge 0.85$, $\tau_{\text{lead}} \ge 20\text{ ms}$) within 2 weeks.
   - Maintain 100% CI parity and preserve existing safety foundations.
2. **Stage 2 (Scale & Physical Alignment): Option B (NVIDIA Warp / Newton GPU Kernel)**
   - Port the validated Stage 1 constitutive equations into an NVIDIA Warp custom contact solver.
   - Execute massive parallel pre-training ($10^6$ steps/sec) and synthetic vision-tactile rendering.

---

### 5. Document Traceability & Sign-Off

- **Authors:** HOROS Architectural Review Board
- **Evaluation Scope:** 4 platform architectures, 12 technical dimensions.
- **Decision Baseline:** Feeds directly into `HOROS-P1-R002-CONTACT-PHYSICS-UPGRADE-ADR` (`ADR-HOROS-008`).
