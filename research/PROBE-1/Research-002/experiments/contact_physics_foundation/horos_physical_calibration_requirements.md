# HOROS PROBE-1 — Physical Calibration Requirements & Ground-Truth Reference Standards

**Program:** HOROS Physical Intelligence Research Group  
**Project:** Research-002: Model Teaching Infrastructure & Contact Mechanics  
**Document Identifier:** `HOROS-P1-R002-PHYSICAL-CALIBRATION-REQUIREMENTS`  
**Date:** 2026-11-20  
**Status:** **AUTHORITATIVE CALIBRATION SPECIFICATION**  

---

### 1. Purpose & Guiding Principles

Simulation of contact mechanics is only as credible as its physical calibration. If simulated tactile compliance curves or friction parameters are arbitrary, world models trained on them will fail to transfer to physical robot hardware (the "Reality Gap").

This specification establishes a **Three-Tier Verification & Calibration Framework** to ensure that `CompliantPreLiftContactEnv-v2` reproduces real-world elastomeric contact mechanics with quantitative fidelity:
- **Tier 1:** Closed-Form Analytical Reference Standards (Continuum Mechanics).
- **Tier 2:** Published Empirical Robotic & Tribological Reference Datasets.
- **Tier 3:** Physical Hardware Calibration Rig & Experimental Protocols.

---

### 2. Tier 1: Closed-Form Analytical Reference Standards

Before comparing against experimental noise, all simulation kernels must achieve $\ge 99.5\%$ numerical concordance with classical continuum solutions:

1. **Hertzian Normal Compliance:**
   $$F_n(\delta_n) = \frac{4}{3} E^* R^{1/2} \delta_n^{3/2}$$
   - *Verification Metric:* Maximum relative error $|\hat{F}_n - F_{n,\text{Hertz}}| / F_{n,\text{Hertz}} \le 0.005$ across normal loads $0.1\text{ N} \le F_n \le 20.0\text{ N}$.
2. **Cattaneo-Mindlin Annular Stick Boundary:**
   $$\frac{c}{a} = \left( 1 - \frac{F_t}{\mu F_n} \right)^{1/3}$$
   - *Verification Metric:* Stick core radius tracking within $1.0\%$ across tangential force ratios $0.0 \le F_t / (\mu F_n) \le 0.99$.
3. **Tangent Compliance Softening Curve:**
   $$k_t(F_t) = k_{t,0} \left( 1 - \frac{F_t}{\mu F_n} \right)^{1/3}$$
   - *Verification Metric:* Monotonic decrease of numerical tangent stiffness $dF_t / d\delta_t$ with zero negative slope violations.

---

### 3. Tier 2: Published Literature Reference Benchmarks

The simulator parameters must be anchored in peer-reviewed tribological and robotic grasping data:

```
+-----------------------------------------------------------------------------------------------+
| Reference Dataset               | Target Physical Phenomenon            | Calibrated Parameter |
+---------------------------------+---------------------------------------+---------------------+
| Cutkosky & Wright (1986)        | Grasp compliance and fingertip        | Initial shear       |
| Cutkosky & Kao (1989)           | micro-displacement before gross slip  | stiffness kt,0      |
+---------------------------------+---------------------------------------+---------------------+
| Tada, Hosoda, Asano (2003)      | Incipient slip detection via tactile  | Stick ratio c/a     |
|                                 | epidermal strain ridge deformation    | and annular micro-v |
+---------------------------------+---------------------------------------+---------------------+
| Delhaye, Lefèvre,               | High-speed optical tracking of        | Spatial traction    |
| Thonnard (2014, 2016)           | human/elastomer contact area & slip   | distribution q(r)   |
+---------------------------------+---------------------------------------+---------------------+
| PANDAS Benchmark (2024)         | 32 ms lead-time tactile slip          | Pre-slip precursor  |
|                                 | forecasting on robotic grippers       | signal lead-time    |
+---------------------------------+---------------------------------------+---------------------+
| ContactGuard / ViTacWorld       | Multi-contact insertion and           | Dynamic coefficient |
| (2024–2025)                     | pre-contact predictive braking        | of friction mu(v)   |
+-----------------------------------------------------------------------------------------------+
```

#### Parameter Bounds Extracted from Literature:
- **Elastomer Shear Modulus ($G^*$):** $0.3\text{ MPa}$ to $2.5\text{ MPa}$ (Shore A 30 to Shore A 60 silicone).
- **Poisson's Ratio ($\nu$):** $0.48 - 0.499$ (nearly incompressible rubber).
- **Initial Tangential Stiffness ($k_{t,0}$):** $800\text{ N/m}$ to $3500\text{ N/m}$ per contact pad.
- **Micro-Slip Displacement Horizon:** $0.15\text{ mm}$ to $0.85\text{ mm}$ before catastrophic gross slip.
- **Static vs. Kinetic Ratio ($\mu_s / \mu_k$):** $1.08$ to $1.25$ for dry elastomeric interfaces.

---

### 4. Tier 3: Physical Hardware Calibration Testbed & Protocols

To support empirical calibration in later HOROS phases, the following physical testbed protocol is standardized:

```
       [ Micro-Motion Actuator (Voice Coil / Piezo) ]
                             |
                   [ 6-Axis F/T Load Cell ]
                             |
                 [ Elastomeric Finger Pad ]
                             |
                     === Workpiece ===
                             |
             [ High-Speed Optical Microscope / PIV ]
```

#### Calibration Protocol Specifications:
1. **Protocol CP-01: Normal Indentation Profiling**
   - *Procedure:* Drive fingertip against rigid workpiece at $0.05\text{ mm/s}$ to normal load $F_n = 15.0\text{ N}$.
   - *Target Identification:* Fit normal stiffness $k_{\text{norm}}$ and non-linear exponent $\alpha$ in $F_n = k_{\text{norm}} \delta_n^\alpha$.
2. **Protocol CP-02: Quasi-Static Tangential Shear Ramp**
   - *Procedure:* Lock normal force at fixed values ($2\text{ N}, 5\text{ N}, 10\text{ N}$); apply tangential ramp at $0.02\text{ mm/s}$ until gross slip occurs.
   - *Target Identification:* Extract initial stiffness $k_{t,0}$, compliance softening trajectory $k_t(F_t)$, static friction coefficient $\mu_s$, and kinetic drop $\mu_k$.
3. **Protocol CP-03: Dynamic Frequency Response (Bode Analysis)**
   - *Procedure:* Inject multi-sine shear displacements ($1\text{ Hz} - 250\text{ Hz}$) at amplitude $\pm 20\text{ }\mu\text{m}$.
   - *Target Identification:* Fit LuGre internal bristle parameters: stiffness $\sigma_0$, micro-damping $\sigma_1$, and viscous drag $\sigma_2$.
4. **Protocol CP-04: High-Speed Optical Contact Area Tracking**
   - *Procedure:* Use transparent glass/acrylic workpiece with frustrated total internal reflection (FTIR) or high-contrast surface markers.
   - *Target Identification:* Measure contact patch boundary $a$ and stick-core boundary $c$ as a function of shear load $F_t / (\mu F_n)$ to validate the Cattaneo-Mindlin $1/3$-power law.

---

### 5. Standardized Material Parameter Library

`CompliantPreLiftContactEnv-v2` shall ship with pre-calibrated material profiles:

| Material Pair | Nominal $\mu_s$ | Nominal $\mu_k$ | Initial $k_{t,0}$ ($\text{N/m}$) | Micro-Slip Zone ($\mu\text{m}$) | Exponent $\alpha$ |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Silicone 30A on Aluminum** | $0.68 \pm 0.08$ | $0.58 \pm 0.06$ | $1,250$ | $420$ | $1.48$ |
| **Silicone 50A on Steel** | $0.52 \pm 0.05$ | $0.44 \pm 0.04$ | $2,100$ | $280$ | $1.51$ |
| **Polyurethane on Acrylic** | $0.42 \pm 0.04$ | $0.36 \pm 0.03$ | $1,800$ | $310$ | $1.45$ |
| **Nitrile on Cardboard** | $0.35 \pm 0.06$ | $0.29 \pm 0.05$ | $1,400$ | $360$ | $1.38$ |
| **Oily / Contaminated Contact** | $0.18 \pm 0.03$ | $0.14 \pm 0.02$ | $1,100$ | $190$ | $1.50$ |

---

### 6. Document Traceability & Sign-Off

- **Authors:** HOROS Experimental Metrology Working Group
- **Calibration Standard:** Compliant with ASTM D1894 and robotic tactile calibration guidelines.
- **Status:** Baseline parameter requirements locked for `CompliantPreLiftContactEnv-v2`.
