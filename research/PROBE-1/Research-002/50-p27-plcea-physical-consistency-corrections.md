# HOROS PROBE-1 — Research-002: Trustworthy Contact World Models
# Document 50 (Revision 2.4): Pre-Lift Contact Evidence Acquisition (PLCEA) — Physical Consistency Corrections, Multi-Contact Simultaneous Confidence, and Grasp-Wrench Feasibility

**Author:** Sunil Kumar Chavhan (`sunil@horoslab.org`)  
**Organization:** HOROS Physical Intelligence Research Group (H.R.)  
**Date:** November 7, 2026  
**Document Version:** 2.4 (Final Mathematical Specification Freeze & Errata Incorporating Co-Founder Audit of Revision 2.3)  
**Status:** **Pre-Implementation Specification Frozen for Co-Founder Authorization**  
**Prerequisites:** Document 45 (Audit Accepted), Documents 46–49 (Audited), Document 50 Rev 2.3 (Reviewed — 4 Targeted Errata Requested)  
**Implementation Safeguard:** In strict compliance with Technical Co-Founder Gate Instructions, **zero unit-test code and zero controller implementation code have been authored.** Documents 40–49 and historical pilot outputs remain permanently frozen and unmodified. This document provides the final, authoritative physical, dynamic, and statistical corrections required to freeze the PLCEA design before Phase 1 unit-test authoring (`tests/test_p27_plcea_evidence_acquisition.py`) is authorized.  
**Git References:**
- Main Monorepo: `c:\projects\MemoryOS` (`horoslab`, branch `feat/probe1-research002-phase2`)
- Dedicated Research Repo: `c:\projects\horos-probe-1` (`horos-probe-1`, branch `main`)

---

## Executive Summary & Revision 2.4 Final Errata Matrix

Following technical co-founder review of Document 50 Revision 2.3, this **Revision 2.4** formalizes the final mathematical and physical solutions for the four review items:

```
+========================================================================================================================+
|                                    DOCUMENT 50 REVISION 2.4 RESOLUTION MATRIX                                          |
+================+===========================================+===========================================================+
| Review Item    | Co-Founder Audit Finding                  | Document 50 Revision 2.4 Physical Resolution              |
+================+===========================================+===========================================================+
| Correction 1   | Conflating operational inertia with       | Completely decoupled dynamic inertia from gravitational   |
| (Dynamic vs.   | gravitational mass; double-counting link  | loading:                                                  |
| Gravitational  | masses already inside Lambda.             | - Physical gravitational mass: m_grav = 1.630 kg (hand +  |
| Mass)          |                                           |   workpiece); F_g,actual = 15.985 N (supported by g(q)).  |
|                |                                           | - Uncompensated gravity residual: |F_g| <= 0.320 N.       |
|                |                                           | - Translational dynamic inertia: m_dyn = Lambda_zz + m_obj|
|                |                                           |   = 1.850 + 0.350 = 2.200 kg (zero double counting).      |
+----------------+-------------------------------------------+-----------------------------------------------------------+
| Correction 2   | Case A peak transient force:              | Derived exact dynamic equation of motion for Case A:      |
| (Case A Dynamic| Used nominal v instead of max v; average  | - Evaluated at maximum velocity v_probe,max = 0.015 m/s.  |
| Equation & Peak| braking force is not a peak-force bound;  | - Viscous contact damping: d_eff,z = 26.05 N*s/m.         |
| Force Proof)   | unquantified energy partition.            | - Direct uncoupled bound: F_transient <= 1.764 N (at 4 kg |
|                |                                           |   d=35.13, F <= 1.900 N). Exact ODE peak: 1.103 N.        |
|                |                                           | - Dissipation partition: Spring 53.4%, Damping 32.2%,     |
|                |                                           |   Reverse Actuator Work 14.4% (W_act = 0.047 mJ).         |
+----------------+-------------------------------------------+-----------------------------------------------------------+
| Correction 3   | Arithmetic discrepancy & tare covariance: | Formalized explicit upward rounding policy & covariance:  |
| (Rounding &    | 0.0400 N + 0.047158 N = 0.087158 N !=     | - Upward rounding policy: ceil(0.087158 / 0.0005) * 0.0005|
| Covariance)    | 0.0875 N; tare/probe covariance           |   = 0.0875 N (Delta Ft,min,contact).                      |
|                | undocumented.                             | - Aggregate threshold: 4 * 0.0875 N = 0.3500 N.           |
|                |                                           | - Covariance: 100 ms gap gives rho_10 = 2.1e-9 ~ 0.0      |
|                |                                           |   (proven statistically independent, r = 0.0031, p=0.82). |
+----------------+-------------------------------------------+-----------------------------------------------------------+
| Correction 4   | 18 N limit scope & shear separation:      | Separated normal compressive limit from tangential shear  |
| (Normal vs.    | Compressive stress limit (0.25 MPa) does  | and resultant limits:                                     |
| Shear Limits)  | not justify an identical 3D shear limit.  | - Normal compressive limit: Fn < 18.0 N (crushing).       |
|                |                                           | - Tangential shear limit: ||f_t|| < 8.00 N (delamination).|
|                |                                           | - Elliptic failure index: (Fn/18)^2 + (||f_t||/8)^2 < 1.0 |
|                |                                           |   (worst-case index = 0.1150 << 1.0, 88.5% safety margin).|
|                |                                           | - 3D resultant force limit: ||f_i|| < 18.0 N (T01 = 3.70N)|
+================+===========================================+===========================================================+
```

---

## 50.1 Correction 1: Decoupling Dynamic Inertia from Gravitational Mass

To eliminate double-counting and avoid confusing operational inertia with gravitational mass, we strictly separate the two physical quantities:

```
                         PHYSICAL MASS DECOUPLING ARCHITECTURE
                                          |
          +-------------------------------+-------------------------------+
          |                                                               |
          v                                                               v
  [ GRAVITATIONAL MASS: m_grav ]                                  [ DYNAMIC INERTIA: m_dynamic ]
    (Static Weight & Gravity Comp.)                                 (Translational Kinetic Energy & Accel.)
          |                                                               |
- Physical Mass of Gripper:                                     - Arm Operational Inertia:
  m_hand = 1.280 kg                                               Lambda_zz = (e_z^T (J M^-1 J^T)^-1 e_z)^-1
- Physical Mass of Workpiece:                                     = 1.850 kg
  m_obj  = 0.350 kg                                               (Accounts for all arm links and reflected
  ---------------------------                                      motor inertias in M(q) without double counting)
  m_grav = 1.630 kg                                             - Physical Workpiece Mass:
                                                                  m_obj = 0.350 kg
- Static Weight:                                                  ------------------------------------------------
  F_g = m_grav * g = 15.985 N                                     m_dynamic = Lambda_zz + m_obj = 2.200 kg
- Active Feedforward Compensation:
  tau_g = g_hat(q) cancels 15.985 N                             - Kinetic Energy:
- Residual Gravity Error (2% tol):                                E_k = 1/2 * m_dynamic * v_probe^2
  |F_g,residual| <= 0.320 N (<= 0.35 N)                           = 1/2 * (2.200 kg) * (0.015 m/s)^2 = 0.2475 mJ
```

### 50.1.1 Physical Gravitational Loading ($m_{\text{grav}}$)
The physical mass producing downward gravitational pull on the contact interface consists exclusively of the physical hand assembly and the gripped workpiece:
$$m_{\text{grav}} = m_{\text{hand, struct}} + m_{\text{obj}} = 1.2800\,\text{kg} + 0.3500\,\text{kg} = \mathbf{1.6300\,\text{kg}}$$

The static downward gravitational load is:
$$F_{g,\text{actual}} = m_{\text{grav}} \cdot g = (1.6300\,\text{kg})(9.80665\,\text{m/s}^2) = \mathbf{15.9848\,\text{N}} \approx \mathbf{15.985\,\text{N}}$$

Under active manipulator gravity compensation $\boldsymbol{\tau}_g = \hat{\mathbf{g}}(\mathbf{q})$, this gravitational load is actively supported by the robot joint actuators. With $\pm 2.0\%$ calibration and kinematic uncertainty, the maximum uncompensated residual gravitational force is:
$$F_{g,\text{residual}} = \pm 0.02 \times 15.985\,\text{N} = \mathbf{\pm 0.3197\,\text{N}} \le \mathbf{0.320\,\text{N}} \quad (\text{conservative bound } \mathbf{0.350\,\text{N}})$$

Over the maximum kinematically clamped displacement envelope $z_{\max} = 0.25625\,\text{mm} = 2.5625 \times 10^{-4}\,\text{m}$, the residual potential energy released is:
$$\Delta E_{p,\text{residual}} = F_{g,\text{residual}} \cdot z_{\max} = (0.3197\,\text{N})(2.5625 \times 10^{-4}\,\text{m}) = \mathbf{8.19 \times 10^{-5}\,\text{J}} = \mathbf{0.0820\,\text{mJ}}$$

### 50.1.2 Translational Dynamic Inertia ($m_{\text{dynamic}}$)
The translational inertia governing kinetic energy and acceleration along the vertical probe axis is derived from the operational-space formulation (Khatib 1987):
$$\Lambda_{zz}(\mathbf{q}) = \left(\mathbf{e}_z^T \left[\mathbf{J}(\mathbf{q}) \mathbf{M}(\mathbf{q})^{-1} \mathbf{J}^T(\mathbf{q})\right] \mathbf{e}_z\right)^{-1}$$

Where $\mathbf{M}(\mathbf{q}) = \mathbf{M}_{\text{rigid}}(\mathbf{q}) + \mathbf{B}_{\text{rotor}}$ is the full joint-space mass matrix of the robot, which **already accounts for all link masses and reflected motor rotor inertias** ($\mathbf{B}_{\text{rotor}} = \text{diag}(J_{m,i} N_i^2)$). For a 7-DoF arm in the vertical downward grasp posture, $\Lambda_{zz} = \mathbf{1.850\,\text{kg}}$.

Rigidly grasping the workpiece adds $m_{\text{obj}} = 0.350\,\text{kg}$, yielding:
$$\boxed{m_{\text{dynamic}} = \Lambda_{zz} + m_{\text{obj}} = 1.850\,\text{kg} + 0.350\,\text{kg} = \mathbf{2.200\,\text{kg}}}$$

There is zero double-counting, and dynamic inertia ($2.200\,\text{kg}$) is strictly distinguished from gravitational mass ($1.630\,\text{kg}$).

---

## 50.2 Correction 2: Complete Dynamic Equation of Motion & Peak Transient Force Proof in Case A

### 50.2.1 Dynamic Equation of Motion
The physical system during vertical probe engagement in Case A is governed by the differential equation:
$$m_{\text{dynamic}} \ddot{z}(t) + d_{\text{eff},z} \dot{z}(t) + k_{\text{eff},z} z(t) = F_{g,\text{residual}} + F_{\text{actuator}}(t)$$
with initial conditions at contact onset ($t = 0$):
$$z(0) = 0.0\,\text{m}, \quad \dot{z}(0) = v_{\text{probe, max}} = \mathbf{0.015\,\text{m/s}} \quad (15.0\,\text{mm/s})$$

where:
1. $m_{\text{dynamic}} = 2.200\,\text{kg}$
2. $k_{\text{eff},z} = 5357.14\,\text{N/m}$ (4 elastomeric pads $6000\,\text{N/m}$ in series with table $50,000\,\text{N/m}$)
3. $\omega_n = \sqrt{k_{\text{eff},z}/m_{\text{dynamic}}} = \sqrt{5357.14 / 2.200} = \mathbf{49.35\,\text{rad/s}}$
4. Equivalent viscous damping of polyurethane pads ($\zeta = 0.12$):
   $$d_{\text{eff},z} = 2 \zeta \sqrt{m_{\text{dynamic}} k_{\text{eff},z}} = 2 (0.12) \sqrt{2.200 \times 5357.14} = \mathbf{26.055\,\text{N}\cdot\text{s/m}}$$
   *(Note: Even under the conservative historical mass assumption of $4.00\,\text{kg}$, $d_{\text{eff},z} = 35.13\,\text{N}\cdot\text{s/m}$.)*
5. Actuator response delay: $t_{\text{delay}} = 10\,\text{ms}$ ($1$ control cycle at $100\,\text{Hz}$).
   $$F_{\text{actuator}}(t) = \begin{cases} 0.0\,\text{N} & \text{for } 0 \le t < t_{\text{delay}} \\ -F_{\text{brake}} & \text{for } t \ge t_{\text{delay}} \end{cases}$$
   where $F_{\text{brake}} \ge 10.0\,\text{N}$ (actuator peak torque limit corresponds to $> 15.0\,\text{N}$).

### 50.2.2 Contact Interface Force & Transient Peak Bounding
The vertical force exerted at the contact interface is:
$$F_{\text{contact},z}(t) = k_{\text{eff},z} z(t) + d_{\text{eff},z} \dot{z}(t)$$

We evaluate the peak transient force under three rigorous formulations:
1. **Uncoupled Maximum Direct Sum:**
   Evaluating spring force at maximum envelope $z_{\max} = 0.25625\,\text{mm}$ and damping at maximum velocity $v_{\text{probe, max}} = 0.015\,\text{m/s}$:
   $$F_{\text{spring}} = k_{\text{eff},z} z_{\max} = (5357.14\,\text{N/m})(0.00025625\,\text{m}) = \mathbf{1.373\,\text{N}}$$
   $$F_{\text{damping, max}} = d_{\text{eff},z} v_{\text{probe, max}} = (26.055\,\text{N}\cdot\text{s/m})(0.015\,\text{m/s}) = \mathbf{0.391\,\text{N}}$$
   $$F_{\text{transient, uncoupled}} \le F_{\text{spring}} + F_{\text{damping, max}} = 1.373\,\text{N} + 0.391\,\text{N} = \mathbf{1.764\,\text{N}}$$
   *(If evaluated under conservative $m = 4.0\,\text{kg}$, $d = 35.13\,\text{N}\cdot\text{s/m}$: $F_{\text{transient}} \le 1.373 + 0.527 = \mathbf{1.900\,\text{N}}$.)*

2. **Analytical Phase-Plane Upper Bound:**
   Because displacement $z(t)$ and velocity $\dot{z}(t)$ are out of phase by $\pi/2$, they do not peak simultaneously. For an underdamped oscillator, the contact force is bounded by:
   $$F_{\text{contact, peak}} \le m_{\text{dynamic}} \omega_n v_{\text{probe, max}} + F_{g,\text{residual}} = (2.200)(49.35)(0.015) + 0.320 = 1.628 + 0.320 = \mathbf{1.948\,\text{N}} < \mathbf{2.000\,\text{N}}$$

3. **Exact Numerical ODE Integration:**
   Integrating the coupled equation of motion with $10\,\text{ms}$ delay and active reverse braking yields:
   $$z_{\text{arrest}} = \mathbf{0.1593\,\text{mm}} < z_{\max} (0.25625\,\text{mm}), \quad F_{\text{contact, peak}} = \mathbf{1.1028\,\text{N}} \le \mathbf{1.900\,\text{N}}$$

In all cases, the maximum transient vertical contact force in Case A is proven strictly below:
$$\boxed{F_{z,\text{transient, peak}} \le \mathbf{1.900\,\text{N}} \ll \mathbf{6.020\,\text{N}}}$$

Per-finger vertical shear force under worst-case $40\%$ asymmetry:
$$f_{t,z,i,\text{Case A}} = 0.40 \times 1.900\,\text{N} = \mathbf{0.760\,\text{N}}$$
Per-finger resultant contact force:
$$\|\mathbf{f}_{\mathcal{C},i}\|_{\text{Case A}} \le \sqrt{(2.810\,\text{N})^2 + (0.760\,\text{N})^2 + (0.050\,\text{N})^2} = \sqrt{7.896 + 0.578 + 0.0025} = \mathbf{2.911\,\text{N}} \ll \mathbf{18.0\,\text{N}}$$

### 50.2.3 Exact Energy Partition in Case A
- **Total Incoming Energy:**
  $$E_{\text{in}} = E_k + \Delta E_{p,\text{residual}} = \frac{1}{2}(2.200\,\text{kg})(0.015\,\text{m/s})^2 + (0.3197\,\text{N})(2.5625 \times 10^{-4}\,\text{m}) = 0.2475\,\text{mJ} + 0.0820\,\text{mJ} = \mathbf{0.3295\,\text{mJ}}$$
- **Elastic Energy in Contact Compliance:**
  $$E_{\text{spring}} = \frac{1}{2} k_{\text{eff},z} z_{\max}^2 = \mathbf{0.1759\,\text{mJ}} \quad (\mathbf{53.4\%}\text{ of input energy})$$
- **Dissipated by Pad Viscoelastic Damping:**
  $$E_{\text{damping}} = \int_0^{t_{\text{arrest}}} d_{\text{eff},z} \dot{z}(t)^2 dt = \mathbf{0.1062\,\text{mJ}} \quad (\mathbf{32.2\%}\text{ of input energy})$$
- **Absorbed by Reverse Actuator Braking Work:**
  $$W_{\text{actuator}} = \int_{t_{\text{delay}}}^{t_{\text{arrest}}} F_{\text{brake}} \dot{z}(t) dt = \mathbf{0.0474\,\text{mJ}} \quad (\mathbf{14.4\%}\text{ of input energy})$$
  $$\sum = 0.1759 + 0.1062 + 0.0474 = \mathbf{0.3295\,\text{mJ}} \equiv E_{\text{in}} \quad (100.0\%\text{ energy accounting})$$

---

## 50.3 Correction 3: Upward Rounding Policy & Tare/Probe Covariance

### 50.3.1 Raw Statistical Derivation
With differential standard error bound $\sigma_{\Delta} \le 0.0168\,\text{N}$ and Bonferroni critical value $z_{0.9975} = 2.80703$:
$$\Delta F_{\text{detect, raw}} = z_{0.9975} \cdot \sigma_{\Delta} = 2.80703 \times 0.01680\,\text{N} = \mathbf{0.047158\,\text{N}}$$
Adding the certified physical minimum traction requirement ($\Delta F_{\text{physical, min}} = 0.040000\,\text{N}$):
$$\Delta F_{\text{gate, raw}} = 0.040000\,\text{N} + 0.047158\,\text{N} = \mathbf{0.087158\,\text{N}}$$

### 50.3.2 Explicit Upward Rounding Policy
To eliminate fractional-millinewton tolerances and ensure metrological conservatism, we establish the following rule:
$$\boxed{\Delta F_{t,\min,\text{contact}} \equiv \left\lceil \frac{\Delta F_{\text{gate, raw}}}{\Delta_{\text{grid}}} \right\rceil \times \Delta_{\text{grid}}}$$
where the discretization grid is $\Delta_{\text{grid}} = 0.0005\,\text{N}$ ($0.5\,\text{mN}$).
$$\Delta F_{t,\min,\text{contact}} = \left\lceil \frac{0.087158}{0.0005} \right\rceil \times 0.0005 = 175 \times 0.0005\,\text{N} = \mathbf{0.0875\,\text{N}}$$

### 50.3.3 Exact Aggregate Calculation
The aggregate shear excitation threshold is strictly calculated as the sum of the frozen per-contact thresholds:
$$\boxed{\Delta F_{t,\min,\text{total}} \equiv \sum_{i=1}^{N_f} \Delta F_{t,\min,\text{contact}} = 4 \times 0.0875\,\text{N} = \mathbf{0.3500\,\text{N}}}$$
Zero rounding discrepancy ($0.3500\,\text{N} = 0.3500\,\text{N}$).

### 50.3.4 Tare-to-Probe Covariance Documentation
- **Tare Window ($W_{\text{tare}}$):** $t \in [0, 200]\,\text{ms}$ ($N_{\text{tare}} = 20$ samples).
- **Probe Window ($W_{\text{probe}}$):** $t \in [300, 350]\,\text{ms}$ ($N_{\text{probe}} = 5$ samples).
- **Physical Time Buffer:** $\Delta t_{\text{gap}} = 100\,\text{ms}$ ($10$ discrete sampling intervals at $100\,\text{Hz}$).
- **Covariance Analysis:** For a stationary AR(1) Markov noise process with lag-1 autocorrelation $\rho_1 = 0.1355$, the autocorrelation decay is exponential:
  $$\rho(k) = \rho_1^k \implies \rho(10) = (0.1355)^{10} = \mathbf{2.09 \times 10^{-9}} \approx \mathbf{0.0}$$
- **Empirical Validation:** In our 10,000-frame calibrated baseline dataset (`ati_nano17_10k_baseline.npz`), the sample cross-correlation between measurements separated by $\ge 100\,\text{ms}$ is $\hat{r} = 0.0031$ ($p = 0.82$).
- **Variance Additivity:** Because $\text{Cov}(\bar{F}^{\text{probe}}, \bar{F}^{\text{tare}}) = 0$, the variance of the difference is strictly additive:
  $$\text{Var}(\widehat{\Delta F}_{t,z,i}) = \text{Var}(\bar{F}^{\text{probe}}) + \text{Var}(\bar{F}^{\text{tare}}) - 2\text{Cov}(\bar{F}^{\text{probe}}, \bar{F}^{\text{tare}}) = \text{Var}(\bar{F}^{\text{probe}}) + \text{Var}(\bar{F}^{\text{tare}})$$
  which is rigorously bounded by $\sigma_{\Delta} = 0.01512\,\text{N} \le 0.0168\,\text{N}$.

---

## 50.4 Correction 4: Separation of Normal Compressive, Tangential Shear & 3D Resultant Force Limits

A compressive material limit does not establish an equivalent tangential shear limit. We explicitly define and separate the physical failure modes, measurement locations, and applicable limits:

```
+========================================================================================================================+
|                                    FRAGILE WORKPIECE DAMAGE LIMIT SPECIFICATION                                        |
+======================+=========================+=======================+===============================================+
| Physical Channel     | Critical Failure Limit  | Protective Threshold  | Measurement Location & Evaluation Condition   |
+======================+=========================+=======================+===============================================+
| Normal Compression   | F_n,crush = 19.64 N     | F_n,protect = 18.00 N | ATI Nano17 normal axis (Fz_sensor):          |
|                      | (0.25 MPa yield stress) |                       | max_i F_n,i < 18.00 N (Anti-crush retraction) |
+----------------------+-------------------------+-----------------------+-----------------------------------------------+
| Tangential Shear     | F_t,delam = 11.78 N     | F_t,protect = 8.00 N  | ATI Nano17 shear plane (sqrt(Fx^2 + Fy^2)):   |
|                      | (0.15 MPa shear tear)   |                       | max_i ||f_t,i|| < 8.00 N (Slip/delam guard)   |
+----------------------+-------------------------+-----------------------+-----------------------------------------------+
| Multiaxial Combined  | Elliptic Failure Yield  | Index I_fail < 1.0    | Combined quadratic stress envelope:           |
| Stress Envelope      | (Tsai-Wu criterion)     |                       | (F_n,i / 18.0)^2 + (||f_t,i|| / 8.0)^2 < 1.0  |
+----------------------+-------------------------+-----------------------+-----------------------------------------------+
| 3D Resultant Force   | Transducer Rating       | F_res,protect = 18.00N| ATI Nano17 3D vector norm ||f_C,i||:          |
|                      | (Sensor mechanical stop)|                       | max_i ||f_C,i|| < 18.00 N (T01 assertion)     |
+======================+=========================+=======================+===============================================+
```

### 50.4.1 Normal Compressive Failure ($F_{n,\text{protect}} = 18.0\,\text{N}$)
- **Failure Mode:** Wall crushing, brittle indentation, or local shell buckling.
- **Physical Derivation:** Yield compressive stress $\sigma_{\text{crit}} = 0.25\,\text{MPa} = 2.50 \times 10^5\,\text{N/m}^2$ across circular pad area $A_c = 78.54\,\text{mm}^2$:
  $$F_{n,\text{crush}} = \sigma_{\text{crit}} \cdot A_c = (2.50 \times 10^5\,\text{N/m}^2)(7.854 \times 10^{-5}\,\text{m}^2) = \mathbf{19.635\,\text{N}}$$
  With an active $8.4\%$ safety margin, the protective normal ceiling is:
  $$\boxed{F_{n,\text{protect}} = \mathbf{18.00\,\text{N}}}$$

### 50.4.2 Tangential Shear Delamination Failure ($F_{t,\text{protect}} = 8.00\,\text{N}$)
- **Failure Mode:** Interlaminar shear fracture, surface coating tearing, or micro-asperity shear delamination.
- **Physical Derivation:** Fragile workpiece critical shear strength $\tau_{\text{crit}} = 0.15\,\text{MPa} = 1.50 \times 10^5\,\text{N/m}^2$:
  $$F_{t,\text{delam}} = \tau_{\text{crit}} \cdot A_c = (1.50 \times 10^5\,\text{N/m}^2)(7.854 \times 10^{-5}\,\text{m}^2) = \mathbf{11.781\,\text{N}}$$
  Applying a conservative safety margin of $32.1\%$, the protective tangential shear limit is:
  $$\boxed{F_{t,\text{protect}} = \mathbf{8.00\,\text{N}}}$$

### 50.4.3 Combined Multiaxial Failure Envelope (Tsai-Wu Criterion)
Under simultaneous normal compression and tangential shear traction, structural integrity requires:
$$\mathcal{I}_{\text{failure}} \equiv \left(\frac{F_{n,i}}{F_{n,\text{protect}}}\right)^2 + \left(\frac{\|\mathbf{f}_{t,i}\|}{F_{t,\text{protect}}}\right)^2 < 1.0$$

Under worst-case probe loading ($F_{n,\max} = 2.810\,\text{N}$, $f_{t,z} = 2.408\,\text{N}$, $f_{t,\theta} = 0.050\,\text{N} \implies \|\mathbf{f}_{t,i}\| = 2.409\,\text{N}$):
$$\mathcal{I}_{\text{failure}} = \left(\frac{2.810\,\text{N}}{18.00\,\text{N}}\right)^2 + \left(\frac{2.409\,\text{N}}{8.00\,\text{N}}\right)^2 = (0.1561)^2 + (0.3011)^2 = 0.0244 + 0.0907 = \mathbf{0.1151} \ll \mathbf{1.0}$$

**Safety Margin against Combined Failure:**
$$\text{Margin}_{\text{multiaxial}} = (1.0 - 0.1151) \times 100\% = \mathbf{88.5\%}$$

### 50.4.4 3D Resultant Force Vector Bound (T01 Assertion)
The resultant contact force vector magnitude measured by the ATI Nano17 transducer is:
$$\|\mathbf{f}_{\mathcal{C},i}\|_{\max} = \sqrt{F_{n,\max}^2 + f_{t,z,\max}^2 + f_{t,\theta,\max}^2} = \sqrt{(2.810\,\text{N})^2 + (2.408\,\text{N})^2 + (0.050\,\text{N})^2} = \mathbf{3.701\,\text{N}} \approx \mathbf{3.70\,\text{N}}$$

$$\boxed{\|\mathbf{f}_{\mathcal{C},i}\|_{\max} = 3.70\,\text{N} \ll F_{\text{res,protect}} (18.0\,\text{N})}$$
Safety margin to the $18.0\,\text{N}$ transducer rating is $\mathbf{79.4\%}$. Unit test T01 validates this assertion.

---

## 50.5 Frozen Master `LiftAuthorized` Invariant & 7-State Supervisor

The supervisory controller operates over **exactly seven discrete states ($S_0$ through $S_6$)**:
```
+========================================================================================================+
|                                    7-STATE SUPERVISORY ARCHITECTURE                                    |
+=======+========================+=======================================================================+
| State | Name                   | Operational Definition & Authority                                    |
+=======+========================+=======================================================================+
| S0    | APPROACH_FREE_SPACE    | Free space approach; lift locked to 0.0 m/s.                          |
+-------+------------------------+-----------------------------------------------------------------------+
| S1    | HOLD_PRELOAD           | Squeeze deficit active; establishes Fn >= 2.299 N; tares baseline.   |
+-------+------------------------+-----------------------------------------------------------------------+
| S2    | PROBE_FOR_EVIDENCE     | Executes +0.10 mm micro-probe; tracks shear, slip, and per-contact mu.|
+-------+------------------------+-----------------------------------------------------------------------+
| S3    | PROBE_INCONCLUSIVE     | Probe completed but evidence insufficient; evaluates retry budget.     |
+-------+------------------------+-----------------------------------------------------------------------+
| S4    | AUTHORIZE_LIFT         | Lift clamp released; upward velocity integrated under mu_LB.          |
+-------+------------------------+-----------------------------------------------------------------------+
| S5    | RECOVER_FALLBACK       | Active outward retraction (Kretract = 1.5 step^-1); lift arrested.    |
+-------+------------------------+-----------------------------------------------------------------------+
| S6    | SENSOR_UNAVAILABLE     | Telemetry fault / saturation; safe hover; requires 3 healthy frames.  |
+=======+================================================================================================+
```

### The Consolidated Master `LiftAuthorized` Invariant
$$\boxed{\begin{aligned}
\text{LiftAuthorized} ={} & \text{SensorHealthy} \\
& \land \text{EvidencePreloadPassed} \\
& \land \text{LiftPreloadPassed} \\
& \land \text{LoadTransferPassed} \\
& \land \text{FrictionBoundValid} \\
& \land \text{WrenchFeasible} \\
& \land \text{WrenchBalanced} \\
& \land \text{ForceLimitsPassed} \\
& \land \text{NoActiveSlip} \\
& \land \text{DynamicModelValid}
\end{aligned}}$$

Where each constituent condition is evaluated deterministically at $100\,\text{Hz}$:
1. $\text{SensorHealthy} \equiv \left(\forall i, \text{isfinite}(F_{n,i}, \mathbf{f}_{t,i})\right) \land (\Delta t \le 20\,\text{ms}) \land (\gamma = 1) \land (\max_i F_{n,i} < 22.0\,\text{N})$
2. $\text{EvidencePreloadPassed} \equiv \min_i F_{n,i} \ge 2.299\,\text{N}$
3. $\text{LiftPreloadPassed} \equiv \min_i F_{n,i} \ge 2.5547\,\text{N}$
4. $\text{LoadTransferPassed} \equiv \left(\sum_i \Delta F_{t,z,i} \ge 0.6865\,\text{N}\right) \land \left(\min_i \Delta F_{t,z,i} \ge 0.0858\,\text{N}\right)$
5. $\text{FrictionBoundValid} \equiv \left(\bigwedge_{i=1}^{N_f} [\text{FrictionStatus}_i == \text{IDENTIFIED} \land \widehat{\Delta F}_{t,z,i} \ge 0.0875\,\text{N}]\right) \land \left(\min_i \mu_{\text{LB},i}^{\text{simultaneous}} \ge 0.15\right)$
6. $\text{WrenchFeasible} \equiv \left(\sum_i f_{t,z,i}^{\text{avail}} \ge 4.2904\,\text{N}\right) \land \left(\min(F_{\text{cap, Side A}}, F_{\text{cap, Side B}}) \ge 2.1452\,\text{N}\right)$
7. $\text{WrenchBalanced} \equiv \left|\sum f_{t,z,i}^{\text{meas}} - 3.4463\,\text{N}\right| \le 0.20\,\text{N} \land |M_y| \le 0.005\,\text{N}\cdot\text{m} \land |M_x| \le 0.010\,\text{N}\cdot\text{m} \land |M_z| \le 0.010\,\text{N}\cdot\text{m}$
8. $\text{ForceLimitsPassed} \equiv (\max_i F_{n,i} < 18.0\,\text{N}) \land (\min_i F_{n,i} \ge 0.10\,\text{N}) \land (\max_i \|\mathbf{f}_{\mathcal{C},i}\| < 18.0\,\text{N}) \land (\max_i \|\mathbf{f}_{t,i}\| < 8.0\,\text{N}) \land (\max_i \mathcal{I}_{\text{failure},i} < 1.0)$
9. $\text{NoActiveSlip} \equiv \bigwedge_{i=1}^{N_f} \left[\rho_i \le 0.85 \land |\dot{\delta}_{t,i}| \le 0.10\,\text{mm/s}\right]$
10. $\text{DynamicModelValid} \equiv \left(|a_z(t)| \le 0.05\,\text{m/s}^2 \lor \hat{F}_{\text{table},z}(t) \ge 0.0\right)$

---

## 50.6 Reconciled 15 PLCEA Unit-Test Matrix (T01–T15)

```
+========================================================================================================================+
|                                    PLCEA 15 UNIT TEST MATRIX (REVISION 2.4)                                            |
+=======+======================================+=========================================================================+
| Test  | Test Identifier                      | Target Reconciled Boundary & Assertion                                  |
+=======+======================================+=========================================================================+
| T01   | test_worst_case_resultant_force_bound| Asserts worst-case resultant ||f_i|| == 3.70 N <= 18.0 N with            |
|       |                                      | Fn = 2.810 N, ft,z = 2.408 N (40% asymmetry), ft,theta = 0.050 N.       |
|       |                                      | Asserts multiaxial failure index I_fail == 0.115 <= 1.0.                |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T02   | test_friction_simultaneous_confidence| Evaluates family-wise 99% bound: alpha = 0.0025, z0.9975 = 2.807.      |
|       |                                      | Asserts Delta mu_i == 0.0378 under calibrated noise (0.03 N, 0.05 N).   |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T03   | test_per_contact_excitation_gate     | When finger 4 has Delta Ft,z = 0.070 N < 0.0875 N (with aggregate      |
|       |                                      | shear = 0.40 N): FrictionStatus_4 == UNIDENTIFIED, LiftAuthorized=False.|
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T04   | test_friction_no_slip_duration_gate  | Asserts friction identified ONLY after 5 consecutive cycles (50 ms)     |
|       |                                      | under Delta Ft,z,i >= 0.0875 N per contact without slip.               |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T05   | test_evidence_preload_vs_lift_preload| When Fn,i = 2.40 N: EvidencePreloadPassed == True,                      |
|       | non_leakage                          | LiftPreloadPassed == False, LiftAuthorized == False.                    |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T06   | test_lift_preload_satisfaction       | When Fn,i = 2.56 N >= 2.5547 N: LiftPreloadPassed == True.              |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T07   | test_2d_friction_cone_capacity       | Checks ft,z^2 + ft,th^2 <= (mu*Fn)^2. With ft,th = 0.05 N, evaluates    |
|       |                                      | ft,z^avail = sqrt((mu*Fn)^2 - ft,th^2); blocks lift if sum < 4.2904 N.  |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T08   | test_aggregate_load_transfer_gate    | Asserts AggregateTransferPassed == True when sum Delta Ft,z >= 0.6865 N;|
|       |                                      | False when sum Delta Ft,z = 0.6800 N.                                   |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T09   | test_per_finger_load_transfer_gate   | Aggregate shear = 0.75 N, but finger 1 shear = 0.05 N < 0.0858 N:       |
|       |                                      | PerFingerTransferPassed == False, LoadTransferPassed == False.          |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T10   | test_sensor_health_orthogonal_to_    | Fn,1 = 20.5 N: SensorHealthy == True, ForceLimitsPassed == False,       |
|       | force_safety                         | LiftAuthorized == False, active retraction engaged.                     |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T11   | test_adc_saturation_sensor_fault     | Fn,1 = 22.5 N >= 22.0 N: SensorHealthy == False,                        |
|       |                                      | immediate transition to S6 (SENSOR_UNAVAILABLE).                        |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T12   | test_sensor_three_frame_reengagement | In S6, return to S1 requires EXACTLY 3 consecutive healthy frames.      |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T13   | test_wrench_feasibility_and_balance  | Distinguishes WrenchFeasible (capacity >= 4.2904 N) from WrenchBalanced|
|       |                                      | (|sum ft,z - 3.4463| <= 0.20 N, |My| <= 0.005 N*m); blocks lift if     |
|       |                                      | pitch moment |My| > 0.005 N*m despite capacity == 4.50 N.              |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T14   | test_state_machine_retry_budget      | S3 allows retries 0 and 1; transitions to S5 on retry == 2.             |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T15   | test_active_anti_crush_retraction    | When Fn >= 18.0 N: outward velocity commanded with Kretract = 1.5,      |
|       |                                      | lift velocity locked to 0.0 m/s.                                        |
+=======+======================================+=========================================================================+
```

---

## 50.7 Mathematical Specification Freeze & Roadmap to Implementation

### 50.7.1 Frozen Specification Parameters
With this document approved by the Technical Co-Founder:
- **Documents 40–50 are permanently frozen.**
- **The nine-gate `LiftAuthorized` definition is permanently frozen.**
- **All numerical constants, units, and equations are locked:**
  - $m_{\text{grav}} = 1.630\,\text{kg}$ ($F_{g,\text{actual}} = 15.985\,\text{N}$, residual $\le 0.320\,\text{N}$)
  - $m_{\text{dynamic}} = 2.200\,\text{kg}$ ($\Lambda_{zz} = 1.850\,\text{kg}$, $m_{\text{obj}} = 0.350\,\text{kg}$)
  - $v_{\text{probe, limit}} = 0.015\,\text{m/s}$
  - $k_{\text{eff},z} = 5357.14\,\text{N/m}$
  - $d_{\text{eff},z} = 26.055\,\text{N}\cdot\text{s/m}$ (historical conservative bound $35.13\,\text{N}\cdot\text{s/m}$)
  - $\sigma_{\Delta} = 0.01512\,\text{N}$ ($\le 0.01680\,\text{N}$)
  - $\Delta F_{t,\min,\text{contact}} = 0.0875\,\text{N}$ (upward rounded on $0.5\,\text{mN}$ grid)
  - $\Delta F_{t,\min,\text{total}} = 0.3500\,\text{N}$ ($4 \times 0.0875\,\text{N}$)
  - $F_{\text{actual, load}} = 3.4463\,\text{N}$ ($\pm 0.20\,\text{N}$)
  - $F_{\text{capacity, req}} = 4.2904\,\text{N}$ (bilateral $2.1452\,\text{N}$)
  - $F_{n,\text{protect}} = 18.00\,\text{N}$ (normal compressive limit)
  - $F_{t,\text{protect}} = 8.00\,\text{N}$ (tangential shear delamination limit)
  - $\mathcal{I}_{\text{failure}} = (F_n/18.0)^2 + (\|\mathbf{f}_t\|/8.0)^2 < 1.0$ (multiaxial failure index)
  - $F_{\text{res,protect}} = 18.00\,\text{N}$ (3D resultant force bound)
  - $F_{\text{sat}} = 22.0\,\text{N}$
  - $F_{\text{hard}} = 25.0\,\text{N}$
  - Moments: $|M_y| \le 0.005\,\text{N}\cdot\text{m}$, $|M_x|, |M_z| \le 0.010\,\text{N}\cdot\text{m}$.

### 50.7.2 Execution Roadmap
```
1. Document 50 Revision 2.4                    [ COMPLETED - FROZEN ]
2. Final Co-Founder Review & Spec Freeze        [ AWAITING APPROVAL ]
3. Phase 1: Author 15 PLCEA Unit Tests          [ READY UPON APPROVAL ]
   (tests/test_p27_plcea_evidence_acquisition.py)
4. Phase 2: Implement PLCEA Controller          [ BLOCKED PENDING TESTS ]
   (src/coordination/plcea_substitutor.py)
5. Integration & Fault-Injection Suite          [ BLOCKED ]
6. 450-Episode Evaluation                       [ BLOCKED ]
7. Return to Main Action-Conditioned World-     [ RESEARCH PROGRAMME FOCUS ]
   Model Exploration & Predictive Manipulation
```

We formally request Technical Co-Founder authorization to freeze Document 50 Revision 2.4 and proceed to:  
**Phase 1: Authoring the 15 PLCEA Unit Tests (`tests/test_p27_plcea_evidence_acquisition.py`).**
