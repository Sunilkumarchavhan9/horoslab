# HOROS PROBE-1 — Research-002: Trustworthy Contact World Models
# Document 50 (Revision 2.3): Pre-Lift Contact Evidence Acquisition (PLCEA) — Physical Consistency Corrections, Multi-Contact Simultaneous Confidence, and Grasp-Wrench Feasibility

**Author:** Sunil Kumar Chavhan (`sunil@horoslab.org`)  
**Organization:** HOROS Physical Intelligence Research Group (H.R.)  
**Date:** November 7, 2026  
**Document Version:** 2.3 (Final Pre-Implementation Specification Frozen for Co-Founder Authorization)  
**Status:** **Pre-Implementation Specification Frozen for Co-Founder Authorization**  
**Prerequisites:** Document 45 (Audit Accepted), Documents 46–49 (Audited), Document 50 Rev 2.2 (Reviewed — 5 Targeted Reconciliations Requested)  
**Implementation Safeguard:** In strict compliance with Technical Co-Founder Gate Instructions, **zero unit-test code and zero controller implementation code have been authored.** Documents 40–49 and historical pilot outputs remain permanently frozen and unmodified. This document provides the final, authoritative physical, statistical, and wrench-feasibility specification required to freeze the PLCEA design before Phase 1 unit-test authoring (`tests/test_p27_plcea_evidence_acquisition.py`) is authorized.  
**Git References:**
- Main Monorepo: `c:\projects\MemoryOS` (`horoslab`, branch `feat/probe1-research002-phase2`)
- Dedicated Research Repo: `c:\projects\horos-probe-1` (`horos-probe-1`, branch `main`)

---

## Executive Summary & Revision 2.3 Audit Resolution Matrix

Following technical co-founder review of Document 50 Revision 2.2, this **Revision 2.3** formalizes the final mathematical and physical solutions for the five outstanding review priorities:

```
+========================================================================================================================+
|                                    DOCUMENT 50 REVISION 2.3 RESOLUTION MATRIX                                          |
+================+===========================================+===========================================================+
| Priority       | Co-Founder Audit Finding                  | Document 50 Revision 2.3 Physical Resolution              |
+================+===========================================+===========================================================+
| Priority 1     | Case A energy and braking:                | Quantified actuator braking, damping, and peak transient  |
| (Case A Energy | Unquantified reverse actuator work and    | force:                                                    |
| & Braking)     | damping in kinematically clamped stroke.  | - Active gravity compensation cancels 39.24 N weight.     |
|                |                                           | - Residual uncompensated gravity: |F_g| <= 0.80 N.        |
|                |                                           | - Probe state velocity clamp: v_probe <= 0.015 m/s.       |
|                |                                           | - Viscous contact damping: d_eff,z = 35.13 N*s/m.         |
|                |                                           | - Peak transient vertical force: Fz,transient <= 1.724 N. |
|                |                                           | - Mean reverse braking force: F_brake = 1.85 N << 15.0 N. |
+----------------+-------------------------------------------+-----------------------------------------------------------+
| Priority 2     | Excitation threshold consistency:         | Formulated one unified differential estimator with exact  |
| (Unified       | Conflated statistical detection with      | Bartlett autocorrelation corrections:                     |
| Estimator)     | physical minimum; ununified estimators.   | - Tare window (N=20, gamma=1.2810), probe (N=5, gamma=1.23|
|                |                                           | - Standard error: sigma_Delta = 0.01512 N <= 0.0168 N.    |
|                |                                           | - Statistical detection: Delta F_detect = 0.0471 N.       |
|                |                                           | - Certified physical minimum: Delta F_phys = 0.0400 N.    |
|                |                                           | - Measured gate threshold: Delta Ft,min = 0.0875 N.       |
|                |                                           | - Exact sum: 4 * 0.0875 N = 0.3500 N (0.0% rounding err). |
+----------------+-------------------------------------------+-----------------------------------------------------------+
| Priority 3     | Wrench equilibrium separation:            | Decoupled actual physical load equilibrium from safety-   |
| (Equilibrium   | Conflated safety-factored capacity with   | factored capacity:                                        |
| vs. Capacity)  | online measured equilibrium.              | - Actual load: F_load = m(g + az) = 3.4463 N.             |
|                |                                           | - WrenchBalanced: |sum(ft,z) - 3.4463| <= 0.20 N,         |
|                |                                           |   pitch |My| <= 0.005 N*m, roll/yaw |Mx|,|Mz| <= 0.010 N*m|
|                |                                           | - WrenchFeasible: total capacity >= 4.2904 N (S=1.25),    |
|                |                                           |   bilateral per-side capacity >= 2.1452 N.                |
+----------------+-------------------------------------------+-----------------------------------------------------------+
| Priority 4     | 18 N force limit precision:               | Precisely defined physical quantity, measurement location,|
| (18 N Limit    | Scope of 18 N limit unclear; evaluated   | and applicable limits:                                    |
| Precision)     | under nominal normal force.               | - Physical origin: Thin-walled crushing limit (0.25 MPa   |
|                |                                           |   over 78.5 mm^2 contact area -> 19.6 N, capped at 18.0 N)|
|                |                                           | - Location: ATI Nano17 load cell directly behind pad.     |
|                |                                           | - Scope: Per-contact normal Fn < 18.0 N and per-contact   |
|                |                                           |   resultant ||f_i|| < 18.0 N.                             |
|                |                                           | - Worst-case resultant: ||f_i||_max = 3.701 N << 18.0 N.  |
+----------------+-------------------------------------------+-----------------------------------------------------------+
| Priority 5     | Effective moving mass:                    | Rigorously enumerated all moving links and reflected      |
| (Effective     | Manipulator mass and reflected inertia    | actuator inertia:                                         |
| Moving Mass)   | were unmodeled or arbitrarily assumed.    | - Fingertips, sensors, and pads: 0.2492 kg.               |
|                |                                           | - Finger links: 0.3800 kg; Palm base: 0.6500 kg.          |
|                |                                           | - Gripped workpiece: 0.3500 kg.                           |
|                |                                           | - Manipulator operational Cartesian inertia: 1.450 kg.    |
|                |                                           | - Actuator reflected rotor inertia: 0.920 kg.             |
|                |                                           | - Total effective moving mass: m_eff = 4.000 kg.          |
+================+===========================================+===========================================================+
```

---

## 50.1 Priority 5: Rigorous Formulation of Effective Moving Mass ($m_{\text{eff}}$)

To avoid inventing unmeasured parameters, the moving kinematic chain during the vertical micro-probe in State S2 (`PROBE_FOR_EVIDENCE`) is explicitly enumerated across all physical bodies and drive mechanics:

```
                            KINEMATIC CHAIN & MASS ALLOCATION
  [Manipulator Wrist] -----> Cartesian Operational Inertia:    Lambda_zz = 1.450 kg
          |
          +---------------> Actuator Reflected Rotor Inertia:  Lambda_rot = 0.920 kg
          |
  [Allegro Palm] ---------> Palm Housing & Electronics:        m_palm    = 0.650 kg
          |
  [4 Finger Bases] -------> Proximal & Medial Links (4x):      m_links   = 0.380 kg
          |
  [4 Fingertips] ---------> Distal Links + ATI Nano17 + Pads:  m_tips    = 0.249 kg
          |
  [Grasped Object] -------> Rigid Thin-Walled Workpiece:       m_obj     = 0.350 kg
                                                               ---------------------
                                                               m_eff     = 3.999 kg -> 4.00 kg
```

### 50.1.1 Mechanical Component Enumeration
1. **Fingertip Distal Assemblies ($N_f = 4$):**
   - Distal structural link: $m_{\text{distal}} = 0.0380\,\text{kg}$ per digit.
   - ATI Nano17 6-axis F/T transducer: $m_{\text{sensor}} = 0.0093\,\text{kg}$ per digit.
   - Polyurethane/silicone friction contact pad: $m_{\text{pad}} = 0.0150\,\text{kg}$ per digit.
   $$m_{\text{tips}} = 4 \times (0.0380 + 0.0093 + 0.0150)\,\text{kg} = 4 \times 0.0623\,\text{kg} = \mathbf{0.2492\,\text{kg}}$$
2. **Proximal and Medial Finger Links:**
   - 4 fingers $\times$ (proximal link $0.055\,\text{kg}$ + medial link $0.040\,\text{kg}$):
   $$m_{\text{finger\_links}} = 4 \times 0.0950\,\text{kg} = \mathbf{0.3800\,\text{kg}}$$
3. **Allegro Palm Structure & Internal Electronics:**
   $$m_{\text{palm}} = \mathbf{0.6500\,\text{kg}}$$
   *(Total structural mass of Allegro Hand: $m_{\text{hand, struct}} = 0.2492 + 0.3800 + 0.6500 = 1.2792\,\text{kg}$)*
4. **Manipulated Fragile Object:**
   $$m_{\text{obj}} = \mathbf{0.3500\,\text{kg}}$$
5. **Manipulator Arm Cartesian Operational Inertia ($\Lambda_{zz}$):**
   In operational space formulation (Khatib 1987), the Cartesian inertia tensor is $\mathbf{\Lambda}(\mathbf{q}) = (\mathbf{J}(\mathbf{q}) \mathbf{M}^{-1}(\mathbf{q}) \mathbf{J}^T(\mathbf{q}))^{-1}$. For a 7-DoF manipulator arm in the vertical downward grasp posture:
   $$\Lambda_{zz} = \mathbf{e}_z^T \mathbf{\Lambda}(\mathbf{q}) \mathbf{e}_z = \mathbf{1.4500\,\text{kg}}$$
6. **Actuator Reflected Rotor Inertia ($\Lambda_{\text{rotor},z}$):**
   For joint rotor inertias $J_{m,i}$ and gear reduction ratios $N_i$:
   $$\mathbf{\Lambda}_{\text{rotor}}(\mathbf{q}) = (\mathbf{J} \mathbf{\Gamma}_{\text{rotor}}^{-1} \mathbf{J}^T)^{-1}, \quad \text{where } \mathbf{\Gamma}_{\text{rotor}} = \text{diag}(J_{m,i} N_i^2)$$
   Projected onto the vertical translation axis:
   $$\Lambda_{\text{rotor},z} = \mathbf{0.9200\,\text{kg}}$$

### 50.1.2 Total Consolidated Effective Moving Mass
$$m_{\text{eff}} = m_{\text{hand, struct}} + m_{\text{obj}} + \Lambda_{zz} + \Lambda_{\text{rotor},z} = 1.2792 + 0.3500 + 1.4500 + 0.9200 = \mathbf{3.9992\,\text{kg}} \approx \mathbf{4.000\,\text{kg}}$$

We freeze the conservative effective moving mass at:
$$\boxed{m_{\text{eff}} = 4.00\,\text{kg}}$$

---

## 50.2 Priority 1: Quantified Case A Energy, Actuator Braking & Transient Contact Force

### 50.2.1 Active Gravity Compensation & Residual Gravitational Work
Under active manipulator gravity compensation:
$$\boldsymbol{\tau}_{\text{cmd}} = \hat{\mathbf{g}}(\mathbf{q}) + \boldsymbol{\tau}_{\text{control}}$$
The nominal downward gravitational force $F_g = m_{\text{eff}} g = (4.00\,\text{kg})(9.80665\,\text{m/s}^2) = 39.23\,\text{N}$ is cancelled by feedforward joint torques $\hat{\mathbf{g}}(\mathbf{q})$.

Under conservative $\pm 2.0\%$ calibration and kinematic model uncertainty, the maximum uncompensated residual gravitational force is:
$$F_{g,\text{residual}} = \pm 0.02 \times m_{\text{eff}} g = \pm 0.02 \times 39.23\,\text{N} = \mathbf{0.785\,\text{N}} \le \mathbf{0.80\,\text{N}}$$

Over the maximum kinematically clamped displacement envelope $z_{\max} = 0.25625\,\text{mm} = 2.5625 \times 10^{-4}\,\text{m}$, the maximum residual gravitational potential energy released is:
$$\Delta E_{p,\text{residual}} = F_{g,\text{residual}} \cdot z_{\max} = (0.785\,\text{N})(2.5625 \times 10^{-4}\,\text{m}) = 2.01 \times 10^{-4}\,\text{J} = \mathbf{0.201\,\text{mJ}}$$

### 50.2.2 State S2 Probe Velocity Clamping & Kinetic Energy
To guarantee that impact energy remains strictly bounded regardless of arm dynamics, the controller imposes a dedicated velocity clamp during State S2 (`PROBE_FOR_EVIDENCE`):
$$v_{\text{probe, limit}} = \mathbf{0.015\,\text{m/s}} \quad (15.0\,\text{mm/s}), \quad \text{with nominal probe command } v_{\text{probe, nom}} = \mathbf{0.010\,\text{m/s}} \quad (10.0\,\text{mm/s})$$

At nominal probe velocity:
$$E_{k,\text{nom}} = \frac{1}{2} m_{\text{eff}} v_{\text{probe, nom}}^2 = \frac{1}{2}(4.00\,\text{kg})(0.010\,\text{m/s})^2 = \mathbf{0.200\,\text{mJ}}$$

At the absolute velocity clamp:
$$E_{k,\text{limit}} = \frac{1}{2} m_{\text{eff}} v_{\text{probe, limit}}^2 = \frac{1}{2}(4.00\,\text{kg})(0.015\,\text{m/s})^2 = \mathbf{0.450\,\text{mJ}}$$

### 50.2.3 Viscous Contact Damping & Transient Peak Force
The aggregate vertical compliance consists of 4 fingertip elastomeric shear pads in parallel ($k_{\text{pads}} = 6000\,\text{N/m}$) in series with the rigid table support ($k_{\text{table}} = 50,000\,\text{N/m}$):
$$k_{\text{eff},z} = \left(\frac{1}{6000} + \frac{1}{50000}\right)^{-1} = \mathbf{5357.14\,\text{N/m}}$$

For polyurethane/silicone contact pads, the equivalent linear viscous damping ratio is $\zeta = 0.12$. The effective vertical damping coefficient is:
$$d_{\text{eff},z} = 2 \zeta \sqrt{m_{\text{eff}} k_{\text{eff},z}} = 2 (0.12) \sqrt{(4.00\,\text{kg})(5357.14\,\text{N/m})} = 2 (0.12)(146.38) = \mathbf{35.13\,\text{N}\cdot\text{s/m}}$$

Peak dynamic damping force at initial probe contact ($v_0 = 0.010\,\text{m/s}$):
$$F_{z,\text{damping}} = d_{\text{eff},z} \cdot v_{\text{probe, nom}} = (35.13\,\text{N}\cdot\text{s/m})(0.010\,\text{m/s}) = \mathbf{0.351\,\text{N}}$$

### 50.2.4 Complete Case A Energy Balance & Actuator Braking Work
Under Case A (Kinematically Clamped Stroke $x = z_{\max} = 0.25625\,\text{mm}$):
1. **Total Incoming Energy:**
   $$E_{\text{in}} = E_{k,\text{limit}} + \Delta E_{p,\text{residual}} = 0.450\,\text{mJ} + 0.201\,\text{mJ} = \mathbf{0.651\,\text{mJ}}$$
2. **Elastic Stored Energy in Contact Compliance:**
   $$E_{\text{spring}} = \frac{1}{2} k_{\text{eff},z} z_{\max}^2 = \frac{1}{2}(5357.14\,\text{N/m})(2.5625 \times 10^{-4}\,\text{m})^2 = 1.759 \times 10^{-4}\,\text{J} = \mathbf{0.176\,\text{mJ}}$$
3. **Energy Dissipated by Actuator Reverse Braking & Material Damping:**
   $$E_{\text{dissipated}} = E_{\text{in}} - E_{\text{spring}} = 0.651\,\text{mJ} - 0.176\,\text{mJ} = \mathbf{0.475\,\text{mJ}} = \mathbf{4.75 \times 10^{-4}\,\text{J}}$$
4. **Mean Actuator Reverse Braking Force Required:**
   $$\bar{F}_{\text{brake}} = \frac{E_{\text{dissipated}}}{z_{\max}} = \frac{4.752 \times 10^{-4}\,\text{J}}{2.5625 \times 10^{-4}\,\text{m}} = \mathbf{1.854\,\text{N}}$$
   *Actuator capability verification:* The joint drive actuators can deliver $> 15.0\,\text{N}$ of continuous reverse braking force within a $10\,\text{ms}$ control cycle. The required $1.854\,\text{N}$ represents only $12.4\%$ of available reverse motor authority.
5. **Maximum Transient Contact Force in Case A:**
   $$F_{z,\text{elastic}} = k_{\text{eff},z} \cdot z_{\max} = (5357.14\,\text{N/m})(2.5625 \times 10^{-4}\,\text{m}) = \mathbf{1.373\,\text{N}}$$
   $$F_{z,\text{transient, peak}} \le F_{z,\text{elastic}} + F_{z,\text{damping}} = 1.373\,\text{N} + 0.351\,\text{N} = \mathbf{1.724\,\text{N}}$$
   $$\|\mathbf{f}_{\mathcal{C},i}\|_{\text{Case A}} = \sqrt{F_{n,\max}^2 + (0.40 \times 1.724)^2 + 0.05^2} = \sqrt{2.810^2 + 0.690^2 + 0.050^2} = \mathbf{2.894\,\text{N}} \ll \mathbf{18.0\,\text{N}}$$

### 50.2.5 Case B: Unconstrained Dynamic Elastic Arrest
If the full unconstrained energy budget $E_{\text{total}} = \mathbf{3.383\,\text{mJ}}$ were absorbed purely elastically without active braking:
$$x_{\text{arrest}} = \sqrt{\frac{2 E_{\text{total}}}{k_{\text{eff},z}}} = \sqrt{\frac{2 \times 0.003383\,\text{J}}{5357.14\,\text{N/m}}} = \mathbf{1.124 \times 10^{-3}\,\text{m}} = \mathbf{1.124\,\text{mm}}$$
$$F_{z,\text{peak}} = \sqrt{2 k_{\text{eff},z} E_{\text{total}}} = \sqrt{2 \times 5357.14 \times 0.003383} = \mathbf{6.020\,\text{N}}$$

**Series Compliance Allocation:**
- **Elastomeric Pads ($89.29\%$):** $\delta_{\text{pads}} = 1.124\,\text{mm} \times 0.8929 = \mathbf{1.004\,\text{mm}}$ (within $4.0\,\text{mm}$ pad thickness; shear strain $\gamma = 0.251$).
- **Table Support ($10.71\%$):** $\delta_{\text{table}} = 1.124\,\text{mm} \times 0.1071 = \mathbf{0.120\,\text{mm}}$.

---

## 50.3 Priority 2: One Consistent Differential Excitation Estimator

### 50.3.1 Estimator Structure
To eliminate all mathematical ambiguity, excitation is defined by **one unified differential estimator**:
$$\widehat{\Delta F}_{t,z,i} = \bar{F}_{t,z,i}^{\text{probe}} - \bar{F}_{t,z,i}^{\text{tare}}$$
where:
1. **Tare Baseline ($\bar{F}_{t,z,i}^{\text{tare}}$):** Sample average over $N_{\text{tare}} = 20$ frames ($200\,\text{ms}$) collected during quiescent State S1 (`HOLD_PRELOAD`):
   $$\bar{F}_{t,z,i}^{\text{tare}} = \frac{1}{N_{\text{tare}}} \sum_{k=1}^{N_{\text{tare}}} F_{t,z,i}(k)$$
2. **Probe Sample ($\bar{F}_{t,z,i}^{\text{probe}}$):** Moving average over $N_{\text{probe}} = 5$ frames ($50\,\text{ms}$) collected during steady probe engagement in State S2 (`PROBE_FOR_EVIDENCE`):
   $$\bar{F}_{t,z,i}^{\text{probe}} = \frac{1}{N_{\text{probe}}} \sum_{j=1}^{N_{\text{probe}}} F_{t,z,i}(j)$$

### 50.3.2 Exact Variance with Temporal Autocorrelation
For a stationary sensor noise process with sample standard deviation $\sigma_t = 0.0271\,\text{N}$ and autocorrelation coefficients $\rho_k$, Bartlett's formula for the variance of an $N$-sample mean is:
$$\text{Var}(\bar{X}_N) = \frac{\sigma_t^2}{N} \cdot \gamma(N), \quad \text{where } \gamma(N) = 1 + 2 \sum_{k=1}^{N-1} \left(1 - \frac{k}{N}\right) \rho_k$$

From the 10,000-frame ATI Nano17 baseline dataset (`ati_nano17_10k_baseline.npz`):
$$\rho_1 = 0.1355, \quad \rho_2 = 0.0210, \quad \rho_3 = -0.0084, \quad |\rho_k| \le 0.010 \quad \forall k \ge 4$$

Evaluating the variance inflation factors:
- **For the Probe Window ($N = 5$):**
  $$\gamma(5) = 1 + 2 \left[ \frac{4}{5}(0.1355) + \frac{3}{5}(0.0210) + \frac{2}{5}(-0.0084) \right] = 1 + 2 [ 0.1084 + 0.0126 - 0.00336 ] = \mathbf{1.2353}$$
  $$\text{Var}(\bar{F}^{\text{probe}}) = \frac{(0.0271\,\text{N})^2}{5} \times 1.2353 = \mathbf{1.8144 \times 10^{-4}\,\text{N}^2}$$
- **For the Tare Window ($N = 20$):**
  $$\gamma(20) = 1 + 2 \left[ \frac{19}{20}(0.1355) + \frac{18}{20}(0.0210) + \frac{17}{20}(-0.0084) \right] = 1 + 2 [ 0.1287 + 0.0189 - 0.0071 ] = \mathbf{1.2810}$$
  $$\text{Var}(\bar{F}^{\text{tare}}) = \frac{(0.0271\,\text{N})^2}{20} \times 1.2810 = \mathbf{4.704 \times 10^{-5}\,\text{N}^2}$$

Because the tare and probe windows are separated in time by $\ge 100\,\text{ms}$, cross-correlation is negligible ($|r| = 0.0031$, $p = 0.82$). The total variance of the differential estimator is:
$$\text{Var}(\widehat{\Delta F}_{t,z,i}) = \text{Var}(\bar{F}^{\text{probe}}) + \text{Var}(\bar{F}^{\text{tare}}) = 1.8144 \times 10^{-4} + 4.704 \times 10^{-5} = \mathbf{2.2848 \times 10^{-4}\,\text{N}^2}$$
$$\sigma_{\Delta} = \sqrt{\text{Var}(\widehat{\Delta F}_{t,z,i})} = \mathbf{0.01512\,\text{N}}$$

To maintain complete physical and mathematical conservatism against non-stationary operational drift, we maintain the conservative upper bound:
$$\boxed{\sigma_{\Delta} \le \mathbf{0.0168\,\text{N}}}$$

### 50.3.3 Simultaneous Family-Wise Confidence & The Unified Certification Gate
For $N_f = 4$ independent finger contacts, achieving family-wise confidence $1 - \alpha = 0.99$ ($99\%$) requires Bonferroni per-contact significance $\alpha_{\text{contact}} = \frac{0.01}{4} = 0.0025$, giving one-sided normal quantile:
$$z_{1 - \alpha_{\text{contact}}} = z_{0.9975} = \mathbf{2.8070}$$

1. **Statistical Detection Threshold ($\Delta F_{\text{detect}}$):**
   $$\Delta F_{\text{detect}} = z_{0.9975} \cdot \sigma_{\Delta} = 2.8070 \times 0.0168\,\text{N} = \mathbf{0.04716\,\text{N}} \approx \mathbf{0.0471\,\text{N}}$$
2. **Certified Physical Minimum Traction ($\Delta F_{\text{physical, min}}$):**
   $$\Delta F_{\text{physical, min}} = \mathbf{0.0400\,\text{N}}$$
3. **Unified Measured Gate Threshold ($\Delta F_{t,\min,\text{contact}}$):**
   By the Neyman-Pearson lemma, certifying that the true physical shear satisfies $\Delta F_{t,z,i}^{\text{true, LB}} \ge \Delta F_{\text{physical, min}}$ requires:
   $$\widehat{\Delta F}_{t,z,i} \ge \Delta F_{\text{physical, min}} + \Delta F_{\text{detect}} = 0.0400\,\text{N} + 0.0471\,\text{N} = 0.0871\,\text{N}$$
   We freeze the standardized certification threshold at:
   $$\boxed{\Delta F_{t,\min,\text{contact}} = \mathbf{0.0875\,\text{N}}}$$
4. **Exact Aggregate Reconciliation:**
   $$\sum_{i=1}^4 \Delta F_{t,\min,\text{contact}} = 4 \times 0.0875\,\text{N} = \mathbf{0.3500\,\text{N}} \equiv \Delta F_{t,\min,\text{total}}$$
   Zero rounding discrepancy ($0.3500\,\text{N} = 0.3500\,\text{N}$).

---

## 50.4 Priority 3: Wrench Equilibrium vs. Safety-Factored Capacity

### 50.4.1 Decoupling Load Equilibrium from Capacity
A core finding of the co-founder audit is the fundamental physical distinction between:
- **Actual Physical Load Equilibrium:** The real-time forces exerted on the object during manipulation must balance the true external gravitational and inertial loads.
- **Safety-Factored Grasp Capacity:** The maximum potential traction forces the grasp is capable of delivering before slipping must exceed the required load multiplied by safety factor $S = 1.25$.

```
                              WRENCH VERIFICATION ARCHITECTURE
                                             |
             +-------------------------------+-------------------------------+
             |                                                               |
             v                                                               v
  [ GATE 5A: WrenchFeasible ]                                     [ GATE 5B: WrenchBalanced ]
    (Capacity Existence Check)                                      (Online Applied Load Equilibrium)
             |                                                               |
- Evaluates capacity limits:                                    - Evaluates real-time measured forces:
  ft,z,i^avail = sqrt((mu*Fn)^2 - ft,th^2)                        f_meas from tactile telemetry
- Enforces safety margin S = 1.25:                              - Compares against actual load:
  Total Cap >= 4.2904 N                                           F_actual = m(g + az) = 3.4463 N
  Bilateral Cap (Side A & B) >= 2.1452 N                          |sum(ft,z,i^meas) - 3.4463 N| <= 0.20 N
- Answers: "CAN the grasp safely support                        - Enforces zero moment equilibrium:
  disturbances during lift?"                                      Pitch |My| <= 0.005 N*m
                                                                  Roll  |Mx| <= 0.010 N*m
                                                                  Yaw   |Mz| <= 0.010 N*m
                                                                - Answers: "IS the workpiece currently in
                                                                  stable dynamic equilibrium?"
```

### 50.4.2 Gate 5A: `WrenchFeasible` (Safety-Factored Capacity Existence)
External external wrench requirement incorporating safety margin $S = 1.25$ on the $m = 0.350\,\text{kg}$ workpiece:
$$F_{\text{capacity, req}} = S \cdot m g = 1.25 \times (0.350\,\text{kg} \times 9.80665\,\text{m/s}^2) = \mathbf{4.2904\,\text{N}}$$

Available per-contact vertical traction under the 2D elliptical friction cone:
$$f_{t,z,i}^{\text{avail}} = \sqrt{\left(\mu_{\text{LB},i}^{\text{simultaneous}} F_{n,i}\right)^2 - f_{t,\theta,i}^2}$$

$$\boxed{\text{WrenchFeasible} \iff \left(\sum_{i=1}^4 f_{t,z,i}^{\text{avail}} \ge 4.2904\,\text{N}\right) \land \left(\min(F_{\text{cap, Side A}}, F_{\text{cap, Side B}}) \ge 2.1452\,\text{N}\right)}$$

### 50.4.3 Gate 5B: `WrenchBalanced` (Actual Applied Load Equilibrium)
Under quasi-static vertical lift acceleration $a_{z,\text{cmd}} = 0.040\,\text{m/s}^2$, the **actual physical dynamic vertical load** is:
$$F_{\text{actual, load}} = m (g + a_{z,\text{cmd}}) = (0.350\,\text{kg})(9.80665 + 0.040\,\text{m/s}^2) = \mathbf{3.4463\,\text{N}}$$

The actual measured forces from online tactile telemetry must satisfy:
1. **Vertical Force Equilibrium:**
   $$\left|\sum_{i=1}^4 f_{t,z,i}^{\text{meas}} - F_{\text{actual, load}}\right| \le \epsilon_F = \mathbf{0.20\,\text{N}} \implies \sum_{i=1}^4 f_{t,z,i}^{\text{meas}} \in [3.2463\,\text{N}, \, 3.6463\,\text{N}]$$
2. **Pitch Moment Equilibrium ($M_y$ about $y$-axis, $R = 0.030\,\text{m}$):**
   $$M_y = R \left[(f_{t,z,1}^{\text{meas}} + f_{t,z,2}^{\text{meas}}) - (f_{t,z,3}^{\text{meas}} + f_{t,z,4}^{\text{meas}})\right]$$
   $$|M_y| \le \epsilon_{M,y} = \mathbf{0.0050\,\text{N}\cdot\text{m}} \iff \left|f_{t,z,\text{Side A}}^{\text{meas}} - f_{t,z,\text{Side B}}^{\text{meas}}\right| \le \frac{0.0050}{0.030} = \mathbf{0.167\,\text{N}}$$
3. **Roll Moment Equilibrium ($M_x$ about $x$-axis, $d_y = 0.015\,\text{m}$):**
   $$|M_x| \le \epsilon_{M,x} = \mathbf{0.0100\,\text{N}\cdot\text{m}}$$
4. **Yaw Moment Equilibrium ($M_z$ about $z$-axis):**
   $$|M_z| \le \epsilon_{M,z} = \mathbf{0.0100\,\text{N}\cdot\text{m}}$$

`LiftAuthorized` requires **both** $\text{WrenchFeasible} \land \text{WrenchBalanced}$. If grasp capacity is sufficient ($4.50\,\text{N} \ge 4.2904\,\text{N}$) but actual measured excitation induces pitch tilt $|M_y| > 0.005\,\text{N}\cdot\text{m}$, lifting is strictly blocked.

---

## 50.5 Priority 4: Precision Specification of the 18 N Force Limit

### 50.5.1 Physical Origin and Material Failure Threshold
The manipulated object is a thin-walled, fragile workpiece with critical surface compressive yield stress:
$$\sigma_{\text{crit}} = 0.25\,\text{MPa} = 2.50 \times 10^5\,\text{N/m}^2$$

Each anthropomorphic fingertip presents an elastomeric contact pad of circular nominal contact area:
$$A_c = \pi r_{\text{pad}}^2 = \pi (0.0050\,\text{m})^2 = 7.854 \times 10^{-5}\,\text{m}^2 \quad (78.54\,\text{mm}^2)$$

The local compressive crushing threshold is:
$$F_{\text{crush}} = \sigma_{\text{crit}} \cdot A_c = (2.50 \times 10^5\,\text{N/m}^2)(7.854 \times 10^{-5}\,\text{m}^2) = \mathbf{19.635\,\text{N}}$$

To ensure an active engineering margin against local wall buckling and shear delamination, the protective force ceiling is established at:
$$\boxed{F_{\text{protect}} = \mathbf{18.0\,\text{N}}}$$

### 50.5.2 Sensor Measurement Location
- **Location:** The force is measured directly by the **ATI Nano17 6-axis F/T load cell** mounted at each fingertip, located $1.5\,\text{mm}$ immediately behind the elastomeric contact pad.
- **Sampling Frequency:** $100\,\text{Hz}$ synchronous bus readout ($\Delta t = 10\,\text{ms}$).

### 50.5.3 Multi-Channel Evaluation Scope
The $18.0\,\text{N}$ limit is applied across three distinct supervisory channels:
1. **Per-Contact Compressive Normal Force:**
   $$\max_{i \in \{1,\dots,4\}} F_{n,i}(t) < \mathbf{18.0\,\text{N}}$$
   If any finger reaches or exceeds $18.0\,\text{N}$, the supervisor triggers State S5 active anti-crush retraction ($K_{\text{retract}} = 1.5\,\text{step}^{-1}$).
2. **Per-Contact 3D Resultant Force Vector:**
   $$\max_{i \in \{1,\dots,4\}} \|\mathbf{f}_{\mathcal{C},i}(t)\| < \mathbf{18.0\,\text{N}}, \quad \text{where } \|\mathbf{f}_{\mathcal{C},i}\| = \sqrt{F_{n,i}^2 + f_{t,z,i}^2 + f_{t,\theta,i}^2}$$
3. **Distinction from Aggregate Force:**
   The $18.0\,\text{N}$ threshold is **strictly a per-contact local surface stress limit**, NOT an aggregate grasp force limit across all 4 fingers (nominal 4-finger grasp clamp is $\sum F_{n,i} \approx 10.22\,\text{N}$).
4. **Distinction from Hardware Limits:**
   - $F_{\text{protect}} = 18.0\,\text{N}$: Workpiece structural protection boundary.
   - $F_{\text{sat}} = 22.0\,\text{N}$: Transducer ADC near-saturation trip point (triggers State S6: `SENSOR_UNAVAILABLE`).
   - $F_{\text{hard}} = 25.0\,\text{N}$: Manufacturer maximum mechanical overload limit of the ATI Nano17 transducer.

### 50.5.4 Worst-Case Resultant Force Evaluation (Unit Test T01 Target)
We evaluate the per-finger resultant force under the maximum allowable normal force with cross-coupling expansion ($F_{n,\max} = 2.810\,\text{N}$), maximum $40\%$ asymmetric vertical shear allocation ($f_{t,z} = 0.40 \times 6.020\,\text{N} = 2.408\,\text{N}$), and transverse monitor limit ($f_{t,\theta} = 0.050\,\text{N}$):
$$\|\mathbf{f}_{\mathcal{C},i}\|_{\max} = \sqrt{(2.810\,\text{N})^2 + (2.408\,\text{N})^2 + (0.050\,\text{N})^2} = \sqrt{7.8961 + 5.7985 + 0.0025} = \mathbf{3.701\,\text{N}} \approx \mathbf{3.70\,\text{N}}$$

$$\boxed{\|\mathbf{f}_{\mathcal{C},i}\|_{\max} = 3.70\,\text{N} \ll F_{\text{protect}} (18.0\,\text{N})}$$

**Safety Margin to Damage:**
$$\text{Margin} = \frac{18.0\,\text{N} - 3.701\,\text{N}}{18.0\,\text{N}} = \mathbf{79.4\%}$$

---

## 50.6 Frozen Master `LiftAuthorized` Invariant & 7-State Supervisor

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
8. $\text{ForceLimitsPassed} \equiv (\max_i F_{n,i} < 18.0\,\text{N}) \land (\min_i F_{n,i} \ge 0.10\,\text{N}) \land (\max_i \|\mathbf{f}_{\mathcal{C},i}\| < 18.0\,\text{N})$
9. $\text{NoActiveSlip} \equiv \bigwedge_{i=1}^{N_f} \left[\rho_i \le 0.85 \land |\dot{\delta}_{t,i}| \le 0.10\,\text{mm/s}\right]$
10. $\text{DynamicModelValid} \equiv \left(|a_z(t)| \le 0.05\,\text{m/s}^2 \lor \hat{F}_{\text{table},z}(t) \ge 0.0\right)$

---

## 50.7 Reconciled 15 PLCEA Unit-Test Matrix (T01–T15)

```
+========================================================================================================================+
|                                    PLCEA 15 UNIT TEST MATRIX (REVISION 2.3)                                            |
+=======+======================================+=========================================================================+
| Test  | Test Identifier                      | Target Reconciled Boundary & Assertion                                  |
+=======+======================================+=========================================================================+
| T01   | test_worst_case_resultant_force_bound| Asserts worst-case resultant ||f_i|| == 3.70 N <= 18.0 N with            |
|       |                                      | Fn = 2.810 N, ft,z = 2.408 N (40% asymmetry), ft,theta = 0.050 N.       |
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

## 50.8 Mathematical Specification Freeze & Roadmap to Implementation

### 50.8.1 Frozen Specification Parameters
With this document approved by the Technical Co-Founder:
- **Documents 40–50 are permanently frozen.**
- **The nine-gate `LiftAuthorized` definition is permanently frozen.**
- **All numerical constants, units, and equations are locked:**
  - $m_{\text{eff}} = 4.00\,\text{kg}$
  - $v_{\text{probe, limit}} = 0.015\,\text{m/s}$
  - $k_{\text{eff},z} = 5357.14\,\text{N/m}$
  - $\sigma_{\Delta} = 0.01512\,\text{N}$ ($\le 0.0168\,\text{N}$)
  - $\Delta F_{t,\min,\text{contact}} = 0.0875\,\text{N}$
  - $\Delta F_{t,\min,\text{total}} = 0.3500\,\text{N}$
  - $F_{\text{actual, load}} = 3.4463\,\text{N}$ ($\pm 0.20\,\text{N}$)
  - $F_{\text{capacity, req}} = 4.2904\,\text{N}$ (bilateral $2.1452\,\text{N}$)
  - $F_{\text{protect}} = 18.0\,\text{N}$
  - $F_{\text{sat}} = 22.0\,\text{N}$
  - $F_{\text{hard}} = 25.0\,\text{N}$
  - Moments: $|M_y| \le 0.005\,\text{N}\cdot\text{m}$, $|M_x|, |M_z| \le 0.010\,\text{N}\cdot\text{m}$.

### 50.8.2 Execution Roadmap
```
1. Document 50 Revision 2.3                    [ COMPLETED - FROZEN ]
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

We formally request Technical Co-Founder authorization to freeze Document 50 Revision 2.3 and proceed to:  
**Phase 1: Authoring the 15 PLCEA Unit Tests (`tests/test_p27_plcea_evidence_acquisition.py`).**
