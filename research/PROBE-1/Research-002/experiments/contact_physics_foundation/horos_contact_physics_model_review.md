# HOROS PROBE-1 — Contact Physics Model Review & Simulator Audit

**Program:** HOROS Physical Intelligence Research Group  
**Project:** Research-002: Model Teaching Infrastructure & Contact Mechanics  
**Document Identifier:** `HOROS-P1-R002-CONTACT-PHYSICS-MODEL-REVIEW`  
**Date:** 2026-11-20  
**Status:** **AUTHORITATIVE TECHNICAL AUDIT**  

---

### 1. Architectural Scope & Purpose

This audit provides a comprehensive physical, mathematical, and algorithmic evaluation of the contact simulation engines currently implemented in HOROS PROBE-1 Research-002:
1. `CompliantPreLiftContactEnv` ([`src/environment/compliant_prelift_env.py`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/environment/compliant_prelift_env.py))
2. `PegInHoleEnv` ([`src/environment/peg_in_hole_env.py`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/environment/peg_in_hole_env.py))
3. `MultifingerLiftEnv` ([`src/environment/multifinger_lift_env.py`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/environment/multifinger_lift_env.py))

The audit catalogs the exact governing equations, constitutive contact laws, discrete simplifications, and missing physical phenomena, establishing the foundational evidence for the Contact Physics Upgrade Program.

---

### 2. Deep Audit of Current Simulation Mechanics

#### 2.1 Normal Contact Mechanics
In `CompliantPreLiftContactEnv.step()` (lines 420–428):
- **Model:** Independent 1D radial elastic Winkler foundation per fingertip.
- **Governing Law:**
  $$F_{n,i} = \begin{cases} k_{\text{norm}} \cdot \max(0.0, \; R_{\text{obj}} - r_i), & \text{if } r_i < R_{\text{obj}} \\ 0.0, & \text{otherwise} \end{cases}$$
  where $k_{\text{norm}} = 4.0\text{ N/mm} = 4000.0\text{ N/m}$, nominal workpiece radius $R_{\text{obj}} = 35.0\text{ mm}$, and $r_i = \|\mathbf{p}_{\text{finger},i}^{xy}\|$.
- **Contact Geometry:** 4 discrete point contacts oriented radially at $90^\circ$ antipodal separation.
- **Physical Limitations:**
  1. *Linearity:* Normal stiffness is constant; it ignores the non-linear hardening characteristic of elastomeric rubber ($F_n \propto \delta^{1.5}$ in Hertzian contacts or Ogden hyperelasticity).
  2. *Zero Cross-Coupling:* Compressing finger 0 exerts zero deformation on fingers 1–3 or the workpiece interior.
  3. *Zero Contact Area:* Contact area is mathematically zero ($A = 0$). There is no contact patch radius $a(F_n)$ and no pressure distribution $P(x,y)$.

#### 2.2 Tangential Pad Mechanics & Sticking Dynamics
In `CompliantPreLiftContactEnv.step()` (lines 436–455):
- **Model:** Uncoupled linear elastic shear spring per finger.
- **Governing Law:**
  $$F_{t,z,i}^{\text{candidate}} = k_{\text{pad}} \cdot (\Delta z_{\text{pad},i} + \Delta z_{\text{arm}})$$
  where $k_{\text{pad}} = 1500.0\text{ N/m} = 1.5\text{ N/mm}$ per finger ($6000.0\text{ N/m}$ aggregate across 4 fingers).
- **Physical Limitations:**
  1. *Constant Tangential Stiffness:* Tangential compliance is strictly linear and constant ($dk_t / dF_t = 0$) right up to the catastrophic friction boundary.
  2. *Single-Axis Kinematics:* Prelift action and force spaces model only the vertical axis $z$. Transverse shear $F_\theta$ is hardcoded to zeros (`ft_theta = np.zeros(4)` at line 440).
  3. *Torsional Disconnection:* Torsional friction around the contact normal ($T_n$) is entirely omitted.

#### 2.3 Friction & Slip Transitions
- **Constitutive Law:** Amontons-Coulomb rigid-threshold friction:
  $$\text{If } F_{t,z,i}^{\text{candidate}} \le \mu_{\text{true}} F_{n,i} \implies \begin{cases} F_{t,z,i} = F_{t,z,i}^{\text{candidate}} \\ \dot{\delta}_i = 0.0\text{ m/s} & \text{(Sticking)} \end{cases}$$
  $$\text{If } F_{t,z,i}^{\text{candidate}} > \mu_{\text{true}} F_{n,i} \implies \begin{cases} F_{t,z,i} = 0.90 \cdot \mu_{\text{true}} F_{n,i} \\ \dot{\delta}_i = \max(0.0005, \; |v_{\text{cmd}}|)\text{ m/s} & \text{(Kinetic Slip)} \end{cases}$$
- **Physical Limitations:**
  1. *Absence of Incipient Slip:* Real elastomer contacts do not slip instantaneously across the entire pad. They undergo progressive annular slip from the outer perimeter inward (Cattaneo-Mindlin mechanics).
  2. *Discontinuous Slip Velocity:* Slip velocity jumps discontinuously from $0.0$ to $\ge 0.0005\text{ m/s}$ in a single timestep ($0.01\text{ s}$). There is no smooth micro-slip regime.
  3. *Velocity Invariance:* Friction coefficient $\mu$ is independent of slip velocity (zero Stribeck effect, zero rate-and-state friction).

#### 2.4 Sensor Models & Observation Contamination
In `CompliantPreLiftContactEnv._get_obs()` (lines 536–558):
- **Noise Process:** Stationary AR(1) autoregressive noise on force channels:
  $$\mathbf{n}_t = \rho_1 \mathbf{n}_{t-1} + \boldsymbol{\epsilon}_t, \quad \rho_1 = 0.1355, \; \sigma_n = 0.015\text{ N}, \; \sigma_t = 0.008\text{ N}$$
- **Physical Limitations:**
  1. *Noise Independence from Friction:* Sensor noise variance is constant; in real tactile sensors, signal noise and high-frequency vibrations increase dramatically near the slip boundary (frictional acoustic emission).
  2. *Free-Space False Slip Bug:* Lines 445–450 set `actual_slip_vel[i] = cmd_vel_mps` when $F_n < 0.10\text{ N}$, causing free-air vertical motion to register as Coulomb slip.

---

### 3. Summary of Limitations Proven by the S4 Diagnostic

The empirical execution of 160 controlled trials across the $4 \times 4$ factorial grid established:
1. **Pre-Slip Friction Invariance ($R^2 \le 0.0$):** While sticking on the table or during anchored airborne hold, observed forces depend strictly on pad displacement ($k_{\text{pad}} \Delta z$) or object weight ($m_{\text{obj}} g$), with zero mathematical dependence on $\mu_{\text{true}}$.
2. **Singularity of State S4 ($0/160$ Realizations):** The airborne equilibrium deadband ($0.98 \le S < 1.00$) is a measure-zero numerical artifact spanning only $10.2\text{ }\mu\text{m}$ of indentation, which is bypassed in a single discrete step.
3. **Mass Confounding ($R^2 = 0.9998$):** The simulator exposes a pure mass weighing signal ($F_t = m g$), creating a deceptive illusion of slip prediction in un-controlled environments.

---

### 4. Categorization of Model Deficiencies

| Deficiency | Classification | Impact on World Model Learning |
| :--- | :---: | :--- |
| **Ideal Coulomb Cliff-Edge** | **Fundamental Physical Defect** | Prevents world models from observing pre-slip precursor signals. |
| **Linear Tangential Stiffness** | **Constitutive Simplification** | Eradicates compliance softening prior to macroscopic slip. |
| **Zero Contact Area ($A=0$)** | **Geometric Simplification** | Precludes spatial traction field or tactile matrix simulation. |
| **Free-Space Slip Anomaly** | **Algorithmic Defect** | Corrupts automated metric evaluation during pre-grasp. |
| **Uncoupled Normal/Shear** | **Constitutive Simplification** | Omits load-dependent friction reduction and multi-axis coupling. |
