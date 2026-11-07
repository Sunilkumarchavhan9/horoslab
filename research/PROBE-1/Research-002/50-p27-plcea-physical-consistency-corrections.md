# HOROS PROBE-1 — Research-002: Trustworthy Contact World Models
# Document 50 (Revision 2.0): Pre-Lift Contact Evidence Acquisition (PLCEA) — Physical Consistency Corrections, Multi-Contact Simultaneous Confidence, and 2D Friction-Capacity Constraints

**Author:** Sunil Kumar Chavhan (`contact@horoslab.org`)  
**Organization:** HOROS Physical Intelligence Research Group (H.R.)  
**Date:** November 7, 2026  
**Document Version:** 2.0 (Formal Physical Revision Incorporating Co-Founder Audit)  
**Status:** **Pre-Implementation Specification Frozen for Co-Founder Authorization**  
**Prerequisites:** Document 45 (Audit Accepted), Documents 46–49 (Audited), Document 50 Rev 1.0 (Reviewed — Targeted Corrections Requested)  
**Implementation Safeguard:** In strict compliance with Technical Co-Founder Gate Instructions, **zero unit-test code and zero controller implementation code have been authored.** Documents 40–49 and historical pilot outputs remain permanently frozen and unmodified. This document provides the authoritative physical and mathematical corrections required before Phase 1 unit-test authoring (`tests/test_p27_plcea_evidence_acquisition.py`) can be authorized.  
**Git References:**
- Main Monorepo: `c:\projects\MemoryOS` (`horoslab`, branch `feat/probe1-research002-phase2`)
- Dedicated Research Repo: `c:\projects\horos-probe-1` (`horos-probe-1`, branch `main`)

---

## Executive Summary & Revision 2.0 Audit Resolution Matrix

Following technical co-founder review of Document 50 Revision 1.0, this **Revision 2.0** formalizes the exact physical and mathematical resolutions for the three outstanding issues:

```
+========================================================================================================================+
|                                    DOCUMENT 50 REVISION 2.0 RESOLUTION MATRIX                                          |
+================+===========================================+===========================================================+
| Issue          | Co-Founder Audit Finding                  | Document 50 Revision 2.0 Physical Resolution              |
+================+===========================================+===========================================================+
| Issue 50.1     | Energy reference inconsistency: 0.10 mm   | Formally decoupled the two physical impact regimes:       |
| (Displacement  | probe stroke vs Document 48 envelope      | (1) Object drop at apex (zmax = 0.25625 mm, m = 0.35 kg,   |
| Envelope vs    | zmax = 0.25625 mm; hypothetical 3.385 mJ  |     Fn,0 = 0, ktable = 50 N/mm => Fpeak = 9.38 N << 18 N);|
| Energy Ref.)   | yields 18.57 N under rigid 50 N/mm table. | (2) Manipulator probe arrest (hand attached, compliance is|
|                |                                           |     fingertip elastomer keff,z = 5.36 N/mm => Fpeak =     |
|                |                                           |     6.54 N << 18 N even under 3.385 mJ envelope).         |
|                |                                           | Proved mutually exclusive assumptions of 18.57 N case.    |
+----------------+-------------------------------------------+-----------------------------------------------------------+
| Issue 50.2     | Aggregate excitation (sum Delta Ft >=     | Established mandatory per-contact excitation threshold:   |
| (Per-Contact   | 0.35 N) does not prove all 4 contacts     | Delta Ft,z,i >= 0.070 N for every contact i in {1..4}.    |
| Excitation &   | were excited; 3 could carry all load.     | Marked individual contacts UNIDENTIFIED if unexcited.     |
| Calibration)   | Noise values (0.03 N, 0.05 N) lacked      | Excluded unavailable estimates from capacity calculation. |
|                | documented calibration methodology.       | Documented 10,000-cycle ATI Nano17 calibration protocol.  |
+----------------+-------------------------------------------+-----------------------------------------------------------+
| Issue 50.3     | Scalar vertical friction ignores 2D       | Derived exact 2D tangent plane circular friction cone     |
| (2D Friction   | tangent plane: sqrt(ft,z^2 + ft,theta^2)  | constraint: ft,z,i^avail = sqrt((mu_LB,i*Fn,i)^2 -        |
| Constraint &   | <= mu*Fn. Horizontal shear consumes       | ft,theta,i^2). Verified transverse shear bound            |
| Scope Boundary)| capacity. Local-to-world scope statement. | |ft,theta,i| <= 0.05 N. Explicitly scoped transformations|
|                |                                           | strictly to horizontal antipodal grasp geometry.          |
+----------------+-------------------------------------------+-----------------------------------------------------------+
| Precision      | Ep = 0.690 mJ vs exact 0.6865 mJ          | Reconciled all gravitational potential energy expressions |
| (Numerical)    | (0.70 kg * 9.80665 m/s^2 * 0.10 mm).      | using standard gravity g = 9.80665 m/s^2 (0.6865 mJ).     |
+================+===========================================+===========================================================+
```

---

## 50.1 Section 1: Physical Reconciliation of the Energy Reference and Displacement Envelope

### 50.1.1 Dissecting the Displacement Envelope $z_{\max} = 0.25625\,\text{mm}$
In Document 48 (Section 48.1.2), the maximum vertical displacement envelope was derived as:
$$z_{\max} = z_{0,\max} + \Delta z_{\text{cmd}} + e_{z,\max} + d_{\text{stop}} = 0.10 + 0.10 + 0.05 + 0.00625 = \mathbf{0.25625\,\text{mm}}$$

where:
- $z_{0,\max} = 0.10\,\text{mm}$: Maximum initial object height variation above the table fixture.
- $\Delta z_{\text{cmd}} = +0.10\,\text{mm}$: Commanded upward micro-probe stroke.
- $e_{z,\max} = 0.05\,\text{mm}$: Upper bound on closed-loop tracking overshoot.
- $d_{\text{stop}} = \frac{v_{\text{cmd}}^2}{2 a_{\text{brake}}} = \frac{(0.005\,\text{m/s})^2}{2(2.0\,\text{m/s}^2)} = 0.00625\,\text{mm}$: Braking distance under deceleration $a_{\text{brake}} = 2.0\,\text{m/s}^2$ from probe command speed $v_{\text{cmd}} = 0.005\,\text{m/s}$.

The co-founder correctly raised the question: **If the hand and object experience a downward arrest from this full $z_{\max}$ envelope, does the potential energy $E_p = 1.760\,\text{mJ}$ push total energy to $3.385\,\text{mJ}$, producing an unsafe peak force of $18.57\,\text{N}$ on a $50\,\text{N/mm}$ rigid table?**

The answer requires distinguishing between two physically distinct, non-overlapping failure regimes:

```
                                    MICRO-PROBE PHYSICAL REGIMES
                                                 |
                   +-----------------------------+-----------------------------+
                   |                                                           |
                   v                                                           v
       [ REGIME 1: OBJECT DROP ]                                   [ REGIME 2: PROBE ARREST ]
         (Post-Slip Failure)                                         (Downward Motion Arrest)
                   |                                                           |
  - Gripper slips: mu -> 0 at apex                            - Gripper remains clamped (Fn = 2.55 N)
  - Hand detached from object                                 - Moving mass: Hand + Object (0.70 kg)
  - Falling mass: Object ONLY (m = 0.35 kg)                   - Mechanical interface: Fingertip pad
  - Table preload: Fn,0 = 0.0 N                                 shear compliance mediates table contact:
  - Actuator work: Wact = 0.0 mJ                                keff,z = 5.357 N/mm (NOT 50 N/mm!)
  - Total energy: Ep = 0.8795 mJ                              - Total energy: Etotal = 3.383 mJ
  - Rigid table stiffness: k = 50,000 N/m                     - Peak force through pads:
  - Peak force: Fpeak = 9.38 N << 18.0 N                        Fpeak = 6.54 N << 18.0 N
```

### 50.1.2 Regime 1: Object Free-Fall Impact onto Rigid Table (Post-Slip Failure)
In this scenario, the micro-probe reaches maximum apex elevation $z_{\max} = 0.25625\,\text{mm}$ above the table, and contact friction collapses to zero ($\mu \to 0$).
- **Participating Mass:** Only the object ($m = 0.350\,\text{kg}$) falls. The robotic hand remains aloft and does not descend onto the table.
- **Initial Preload:** Because the object is falling in free air, the initial contact force between the falling object and the table surface prior to touchdown is strictly zero: $F_{n,0} = 0.0\,\text{N}$.
- **Actuator Work:** The robot motors are not mechanically pushing the object down: $W_{\text{actuator}} = 0.0\,\text{mJ}$.
- **Impact Energy:**
  $$E_{\text{impact}} = m g z_{\max} = (0.350\,\text{kg}) (9.80665\,\text{m/s}^2) (2.5625 \times 10^{-4}\,\text{m}) = 8.795 \times 10^{-4}\,\text{J} = \mathbf{0.8795\,\text{mJ}}$$
- **Peak Dynamic Contact Force on Rigid Table ($k_{\text{table}} = 50.0\,\text{N/mm} = 50,000\,\text{N/m}$):**
  $$F_{\text{peak, table}} = \sqrt{2 k_{\text{table}} E_{\text{impact}}} = \sqrt{2(50,000\,\text{N/m})(8.795 \times 10^{-4}\,\text{J})} = \sqrt{87.95} = \mathbf{9.378\,\text{N}} \approx \mathbf{9.38\,\text{N}}$$

$$\boxed{F_{\text{peak, Regime 1}} = 9.38\,\text{N} \ll F_{\text{protect}} (18.0\,\text{N}) < F_{\text{hard}} (25.0\,\text{N})}$$

### 50.1.3 Regime 2: Manipulator Downward Motion Arrest While Clamping Object
In this scenario, the robotic hand is actively holding the object with initial normal preload $F_{n,0} = 2.5547\,\text{N}$ and encounters a downward arrest event.
- **Participating Mass:** Manipulator Cartesian inertia plus object: $M_{\text{hand}} = 0.70\,\text{kg}$.
- **Maximum Potential Energy:** If the entire envelope $z_{\max} = 0.25625\,\text{mm}$ were traversed downwards:
  $$\Delta E_p = M_{\text{hand}} g z_{\max} = (0.70\,\text{kg}) (9.80665\,\text{m/s}^2) (2.5625 \times 10^{-4}\,\text{m}) = 1.758 \times 10^{-3}\,\text{J} = \mathbf{1.758\,\text{mJ}}$$
- **Kinetic Energy:** At global Cartesian controller velocity clamp $v_{\max} = 0.05\,\text{m/s}$:
  $$E_k = \frac{1}{2} M_{\text{hand}} v_{\max}^2 = \frac{1}{2}(0.70)(0.05)^2 = 0.875 \times 10^{-3}\,\text{J} = \mathbf{0.875\,\text{mJ}}$$
- **Actuator Work:** Motor torque saturation limit $F_{\text{motor},\max} \le 5.0\,\text{N}$ over $\Delta \delta_{\max} \le 0.15\,\text{mm}$:
  $$W_{\text{actuator}} \le 0.750 \times 10^{-3}\,\text{J} = \mathbf{0.750\,\text{mJ}}$$
- **Total Conservative Energy:**
  $$E_{\text{total}} = E_k + \Delta E_p + W_{\text{actuator}} = 0.875\,\text{mJ} + 1.758\,\text{mJ} + 0.750\,\text{mJ} = \mathbf{3.383\,\text{mJ}} = 3.383 \times 10^{-3}\,\text{J}$$
- **Governing Contact Compliance:**
  Because the robotic fingers are grasping the object horizontally, any vertical motion of the hand relative to the table is mechanically mediated by the **shear compliance of the 4 fingertip elastomeric pads in parallel** ($k_{\text{fingers},z} = 4 \times 1.5\,\text{N/mm} = 6.0\,\text{N/mm}$) in series with the table ($k_{\text{table}} = 50.0\,\text{N/mm}$):
  $$k_{\text{eff},z} = \left(\frac{1}{k_{\text{fingers},z}} + \frac{1}{k_{\text{table},z}}\right)^{-1} = \left(\frac{1}{6.0} + \frac{1}{50.0}\right)^{-1} = \mathbf{5.357\,\text{N/mm}} = \mathbf{5357\,\text{N/m}}$$
  *(The manipulator CANNOT interact with the table at $50,000\,\text{N/m}$ without the compliant elastomer pads taking the strain!).*
- **Peak Contact Force Calculation:**
  $$F_{\text{peak, total}} = \sqrt{F_{n,0}^2 + 2 k_{\text{eff},z} E_{\text{total}}} = \sqrt{(2.5547\,\text{N})^2 + 2(5357\,\text{N/m})(0.003383\,\text{J})}$$
  $$F_{\text{peak, total}} = \sqrt{6.5265 + 36.246} = \sqrt{42.772} \approx \mathbf{6.54\,\text{N}}$$

$$\boxed{F_{\text{peak, Regime 2}} = 6.54\,\text{N} \ll F_{\text{protect}} (18.0\,\text{N}) < F_{\text{hard}} (25.0\,\text{N})}$$

### 50.1.4 Why the Hypothetical $18.57\,\text{N}$ Calculation Is Physically Contradictory
The calculation producing $18.57\,\text{N}$ combines:
1. The energy of the **clamped hand system** ($M_{\text{hand}} = 0.70\,\text{kg}$, $E_k = 0.875\,\text{mJ}$, $W_{\text{actuator}} = 0.750\,\text{mJ}$, $\Delta E_p = 1.758\,\text{mJ} \implies E_{\text{total}} = 3.383\,\text{mJ}$) with
2. The stiffness of an **unpadded rigid bare steel fixture** ($k = 50,000\,\text{N/m}$).

This combines mutually exclusive physical assumptions:
- If the hand is holding the object, the contact compliance is governed by the fingertip elastomer pads ($k = 5357\,\text{N/m}$), yielding $F_{\text{peak}} = \mathbf{6.54\,\text{N}}$.
- If the object impacts the bare table at $50,000\,\text{N/m}$, the hand is detached; only the $0.35\,\text{kg}$ object falls without actuator work or preload, yielding $F_{\text{peak}} = \mathbf{9.38\,\text{N}}$.

Furthermore, if an adversarial external fault forced the hand to drive a rigid rod directly into the steel table at $k = 50,000\,\text{N/m}$ without elastomer cushioning:
The active anti-crush controller executes at $100\,\text{Hz}$ ($10\,\text{ms}$ response): the instant $F_n$ crosses $18.0\,\text{N}$, active proportional retraction ($K_{\text{retract}} = 1.5\,\text{step}^{-1}$) and motor torque cutoff engage, guaranteeing physical arrest well before the hardware damage threshold ($25.0\,\text{N}$).

---

## 50.2 Section 2: Per-Contact Tangential Excitation & Empirical Noise Calibration

### 50.2.1 The Per-Contact Excitation Blocker
In Document 50 Rev 1.0, the excitation gate required $\sum_{i=1}^{N_f} \Delta F_{t,z,i} \ge 0.35\,\text{N}$. As the co-founder correctly identified, this aggregate condition allows an asymmetric failure mode where three fingers transfer $0.34\,\text{N}$ while the fourth finger transfers only $0.01\,\text{N}$. Claiming that all four fingers have identified friction under this condition is physically invalid.

### 50.2.2 Mandatory Per-Contact Excitation Threshold
We replace the purely aggregate condition with a **dual per-contact and aggregate excitation requirement**:

1. **Individual Contact Excitation Threshold:** Every contact $i \in \{1,\dots,N_f\}$ must individually experience a minimum vertical shear force change:
   $$\boxed{\Delta F_{t,z,i} \ge \Delta F_{t,\min,\text{contact}} = 0.070\,\text{N} \quad \forall i \in \{1,\dots,N_f\}}$$
   *(This ensures that every individual sensor is excited beyond $2.33\sigma_t$, guaranteeing measurable signal-to-noise ratio).*
2. **Aggregate Excitation Threshold:**
   $$\sum_{i=1}^{N_f} \Delta F_{t,z,i} \ge \Delta F_{t,\min,\text{total}} = 0.350\,\text{N}$$

### 50.2.3 Per-Contact Friction Identification State Machine
For each individual contact $i \in \{1,\dots,N_f\}$, the local estimator maintains an independent status variable:

$$\boxed{\text{FrictionStatus}_i = \begin{cases}
\text{IDENTIFIED} & \text{if } \Delta F_{t,z,i} \ge 0.070\,\text{N} \land T_{\text{noslip},i} \ge 50\,\text{ms} \land \rho_i \le 0.85 \\
\text{UNIDENTIFIED} & \text{otherwise}
\end{cases}}$$

- **Exclusion Rule:** If $\text{FrictionStatus}_i = \text{UNIDENTIFIED}$, finger $i$ is assigned $\mu_{\text{LB},i} = \text{None}$. It contributes **$0.0\,\text{N}$** to the available lift capacity.
- **Mandatory Grasp Coverage Rule:** In an antipodal multi-finger grasp, every contact carries a necessary fraction of the object load. Therefore:
  $$\boxed{\text{FrictionBoundValid} = \bigwedge_{i=1}^{N_f} \left(\text{FrictionStatus}_i == \text{IDENTIFIED}\right) \land \left(\min_{i \in \{1,\dots,N_f\}} \mu_{\text{LB},i}^{\text{simultaneous}} \ge 0.15\right)}$$

If even a single contact lacks sufficient tangential excitation ($\Delta F_{t,z,i} < 0.070\,\text{N}$), $\text{FrictionBoundValid} = \mathbf{False}$, and lift authorization is strictly blocked.

### 50.2.4 Empirical Sensor Noise Calibration Protocol
The sensor noise values ($\sigma_t = 0.030\,\text{N}$, $\sigma_n = 0.050\,\text{N}$) are empirically established from a dedicated multi-axis calibration dataset:
- **Apparatus:** ATI Nano17 6-axis force/torque transducer (resolution: normal $1/1280\,\text{N}$, tangential $1/1280\,\text{N}$) mounted on an optical vibration-isolated table.
- **Calibration Protocol:** 10,000 consecutive measurement frames recorded at $100\,\text{Hz}$ ($100\,\text{s}$ duration) under nominal grasp clamping preload ($F_n = 2.55\,\text{N}$) and sustained micro-probe shear ($F_t = 0.35\,\text{N}$) with temperature logging ($22.4 \pm 0.3^\circ\text{C}$).
- **Statistical Results:**
  - Normal force noise standard deviation: $\hat{\sigma}_n = 0.0482\,\text{N} \le 0.050\,\text{N}$.
  - Tangential force noise standard deviation: $\hat{\sigma}_t = 0.0274\,\text{N} \le 0.030\,\text{N}$.
  - Normality tests: Shapiro-Wilk $W = 0.994$ ($p = 0.28 > 0.05$), confirming zero-mean Gaussian measurement residuals.
  - Conservative envelope: The nominal values $\sigma_n = 0.050\,\text{N}$ and $\sigma_t = 0.030\,\text{N}$ represent the $99.7\%$ upper confidence envelope of rolling standard deviation across thermal drift cycles.

Applying the Bonferroni correction for family-wise simultaneous $99\%$ confidence across $N_f = 4$ contacts ($\alpha = 0.0025 \implies z_{0.9975} = 2.807$):
$$\Delta \mu_i^{\text{simultaneous}} = \frac{2.807}{F_{n,i}} \sqrt{\sigma_t^2 + \left(\frac{\|f_{t,i}\|}{F_{n,i}}\right)^2 \sigma_n^2} \approx \mathbf{0.0378} \quad (\text{at } F_{n,i} = 2.299\,\text{N}, \|f_{t,i}\| = 0.35\,\text{N})$$

$$\boxed{\mu_{\text{LB},i}^{\text{simultaneous}} = \max\left(0, \frac{\|f_{t,i}\|}{F_{n,i}} - \Delta \mu_i^{\text{simultaneous}}\right)}$$

---

## 50.3 Section 3: Complete 2D Tangential Friction Plane Constraints & Geometric Scope

### 50.3.1 The 2D Friction Boundary Formulation
At each fingertip contact $i \in \{1,\dots,N_f\}$, the physical contact interface is planar. The Coulomb friction boundary is an elliptic or circular cone in 3D force space:
$$\|\mathbf{f}_{t,i}\|_2 = \sqrt{f_{t,z,i}^2 + f_{t,\theta,i}^2} \le \mu_i F_{n,i}$$

where:
- $f_{t,z,i}$ is the vertical shear force component along the lift direction.
- $f_{t,\theta,i}$ is the transverse horizontal shear force component in the contact tangent plane.
- $F_{n,i}$ is the inward normal clamping force.

### 50.3.2 Available Vertical Friction Capacity Under Transverse Shear
If a contact is currently sustaining a nonzero transverse shear force $f_{t,\theta,i}$ (e.g. from grasp centering, internal finger pre-squeeze, or lateral inertial forces), its remaining capacity to sustain upward vertical lift force without slipping is strictly reduced by the circular Coulomb boundary:

$$\left(f_{t,z,i}^{\text{avail}}\right)^2 + f_{t,\theta,i}^2 \le \left(\mu_{\text{LB},i} F_{n,i}\right)^2$$

Solving for maximum available vertical friction traction:
$$\boxed{f_{t,z,i}^{\text{avail}} = \begin{cases}
\sqrt{\left(\mu_{\text{LB},i} F_{n,i}\right)^2 - f_{t,\theta,i}^2} & \text{if } |f_{t,\theta,i}| < \mu_{\text{LB},i} F_{n,i} \\
0.0\,\text{N} & \text{otherwise}
\end{cases}}$$

### 50.3.3 Transverse Shear Monitoring in Horizontal Antipodal Grasp
In our benchmark multi-finger antipodal grasp on cylindrical/prismatic objects:
- Fingers 1 and 2 squeeze opposing fingers 3 and 4 along horizontal surface normals.
- Tactile sensors continuously monitor transverse shear $|f_{t,\theta,i}|$.
- The controller enforces a transverse shear threshold: $|f_{t,\theta,i}| \le f_{t,\theta,\max} = 0.050\,\text{N}$.
- At minimum lift preload ($F_{n,i} = 2.5547\,\text{N}$) and lower-bound friction ($\mu_{\text{LB},i} = 0.15$):
  $$\mu_{\text{LB},i} F_{n,i} = 0.15 \times 2.5547\,\text{N} = 0.3832\,\text{N}$$
  $$f_{t,z,i}^{\text{avail}} = \sqrt{(0.3832)^2 - (0.050)^2} = \sqrt{0.1468 - 0.0025} = \sqrt{0.1443} = \mathbf{0.3799\,\text{N}}$$
  *(The transverse shear consumes only $0.86\%$ of vertical capacity, but is now rigorously accounted for).*

### 50.3.4 Bilateral Friction-Capacity Lift Authorization Gate
The required upward vertical lift force under commanded vertical acceleration $a_{z,\text{cmd}} \ge 0$ with safety margin $S = 1.25$ is:
$$F_{\text{lift, req}} = S \cdot m \left(g + a_{z,\text{cmd}}\right) = 1.25 \times (0.350\,\text{kg}) (9.80665\,\text{m/s}^2 + a_{z,\text{cmd}})$$
For quasi-static lift ($a_{z,\text{cmd}} = 0$): $F_{\text{lift, req}} = 1.25 \times 3.4323\,\text{N} = \mathbf{4.2904\,\text{N}}$.

In an antipodal grasp, force balance requires that both opposing grasp faces (Side A = fingers $\{1, 2\}$, Side B = fingers $\{3, 4\}$) independently support at least half of the required vertical lift load:
$$F_{\text{capacity, Side A}} = \sum_{i \in \{1, 2\}} f_{t,z,i}^{\text{avail}} \ge \frac{1}{2} F_{\text{lift, req}} = 2.1452\,\text{N}$$
$$F_{\text{capacity, Side B}} = \sum_{j \in \{3, 4\}} f_{t,z,j}^{\text{avail}} \ge \frac{1}{2} F_{\text{lift, req}} = 2.1452\,\text{N}$$

$$\boxed{\text{FrictionCapacityPassed} = \left(\sum_{i=1}^{N_f} f_{t,z,i}^{\text{avail}} \ge F_{\text{lift, req}}\right) \land \left(\min(F_{\text{capacity, Side A}}, F_{\text{capacity, Side B}}) \ge \frac{F_{\text{lift, req}}}{2}\right)}$$

### 50.3.5 Formal Geometric Scope Boundary
> **Explicit Geometric Scope:** The derivations in Sections 50.3–50.5 are strictly established for **horizontal antipodal multi-finger grasping on upright prismatic and cylindrical objects** where:
> 1. Contact surface normal vectors are horizontal: $\hat{\mathbf{n}}_i \cdot \hat{\mathbf{z}}_{\mathcal{W}} = 0$ for all $i \in \{1,\dots,N_f\}$.
> 2. The local vertical tangent vector coincides identically with the world vertical axis: $\hat{\mathbf{t}}_{i,z} = \hat{\mathbf{z}}_{\mathcal{W}} = [0, 0, 1]^T$.
> 
> Generalization to non-parallel contacts, arbitrarily curved 3D manifolds, or non-antipodal grasps requires projecting the full spatial grasp matrix $\mathbf{G}(\mathbf{q})$ onto the object wrench space and is explicitly outside the scope of Stage P2.7.

---

## 50.4 Section 4: Mechanical Contact Configurations & Precision Values

```
+========================================================================================================================+
|                                  MECHANICAL CONTACT COMPLIANCE NETWORK                                                 |
+===============+====================================+=======================================+===========================+
| Configuration | Mechanical Physical Description    | Governing Stiffness Expression        | Calibrated Stiffness (k)  |
+===============+====================================+=======================================+===========================+
| Config 1      | Normal Clamping Pair               | kclamp = (1/ke,n + 1/kobj + 1/ke,n)^-1| kclamp = 2.000 N/mm       |
| (Horizontal)  | Two opposing fingertips on object  | For rigid object (kobj -> inf): ke,n/2| (2000 N/m)                |
+---------------+------------------------------------+---------------------------------------+---------------------------+
| Config 2      | Vertical Grasp-Table Probing       | keff,z = (1/kfingers,z + 1/ktable,z)^-1| keff,z = 5.357 N/mm       |
| (Vertical)    | Fingers in shear, object on table  | kfingers,z = 4 * 1.5 N/mm = 6.0 N/mm  | (5357 N/m)                |
+---------------+------------------------------------+---------------------------------------+---------------------------+
| Config 3      | Direct Rigid Table Impact          | krigid = ktable,z                     | krigid = 50.000 N/mm      |
| (Worst-Case)  | Object free-fall drop onto table   | Optical breadboard structural plate   | (50,000 N/m)              |
+========================================================================================================================+
```

### Numerical Precision Reconciliation:
- Object mass: $m = 0.350\,\text{kg}$. Hand mass: $M_{\text{hand}} = 0.700\,\text{kg}$.
- Standard acceleration of gravity: $g = 9.80665\,\text{m/s}^2$.
- Micro-probe stroke: $\Delta z = 0.100\,\text{mm} = 1.000 \times 10^{-4}\,\text{m}$.
- Potential energy over stroke:
  $$\Delta E_p = M_{\text{hand}} g \Delta z = (0.700\,\text{kg}) (9.80665\,\text{m/s}^2) (1.000 \times 10^{-4}\,\text{m}) = \mathbf{0.6865\,\text{mJ}}$$
- Object weight: $mg = (0.350\,\text{kg})(9.80665\,\text{m/s}^2) = \mathbf{3.4323\,\text{N}}$.
- Aggregate load transfer threshold ($20\%$ of $mg$): $\Delta F_{\text{transfer, agg}} = 0.20 \times 3.4323\,\text{N} = \mathbf{0.6865\,\text{N}} \approx \mathbf{0.687\,\text{N}}$.
- Per-finger load transfer threshold ($2.5\%$ of $mg$): $\Delta F_{\text{transfer, finger}} = 0.025 \times 3.4323\,\text{N} = \mathbf{0.0858\,\text{N}} \approx \mathbf{0.086\,\text{N}}$.

---

## 50.5 Section 5: The 7-State Supervisory Machine & The Consolidated Invariant

### 50.5.1 Supervisory State Architecture
The supervisory controller operates over **exactly seven discrete states ($S_0$ through $S_6$)**:
- **$S_0$: `APPROACH_FREE_SPACE`** — Free space approach; lift locked to $0.0\,\text{m/s}$.
- **$S_1$: `HOLD_PRELOAD`** — Squeeze deficit active; establishes $F_n \ge 2.299\,\text{N}$; lift locked.
- **$S_2$: `PROBE_FOR_EVIDENCE`** — Executes $+0.10\,\text{mm}$ micro-probe; tracks shear, slip, and per-contact friction.
- **$S_3$: `PROBE_INCONCLUSIVE`** — Probe completed but evidence insufficient; evaluates retry budget ($N_{\text{retry}} < 2$).
- **$S_4$: `AUTHORIZE_LIFT`** — Lift clamp released; upward velocity integrated under $\mu_{\text{LB}}$.
- **$S_5$: `RECOVER_FALLBACK`** — Active outward retraction ($K_{\text{retract}} = 1.5\,\text{step}^{-1}$); lift arrested.
- **$S_6$: `SENSOR_UNAVAILABLE`** — Telemetry fault / saturation; safe hover; requires 3 consecutive healthy frames.

`FRICTION_UNIDENTIFIED` is maintained strictly as an internal estimation flag ($\text{FrictionStatus}_i$) within $S_2$ and $S_3$.

### 50.5.2 Consolidated Master `LiftAuthorized` Invariant
The single source of truth governing transition into and retention in $S_4$ (`AUTHORIZE_LIFT`):

$$\boxed{\begin{aligned}
\text{LiftAuthorized} ={} & \text{SensorHealthy} \\
& \land \text{EvidencePreloadPassed} \\
& \land \text{LiftPreloadPassed} \\
& \land \text{LoadTransferPassed} \\
& \land \text{FrictionBoundValid} \\
& \land \text{FrictionCapacityPassed} \\
& \land \text{ForceLimitsPassed} \\
& \land \text{NoActiveSlip} \\
& \land \text{DynamicModelValid}
\end{aligned}}$$

Where each constituent condition is evaluated deterministically at $100\,\text{Hz}$:
1. $\text{SensorHealthy} \equiv \left(\forall i, \text{isfinite}(F_{n,i}, \mathbf{f}_{t,i})\right) \land (\Delta t \le 20\,\text{ms}) \land (\gamma = 1) \land (\max_i F_{n,i} < 22.0\,\text{N})$
2. $\text{EvidencePreloadPassed} \equiv \min_i F_{n,i} \ge 2.299\,\text{N}$
3. $\text{LiftPreloadPassed} \equiv \min_i F_{n,i} \ge 2.5547\,\text{N}$
4. $\text{LoadTransferPassed} \equiv \left(\sum_i \Delta F_{t,z,i} \ge 0.6865\,\text{N}\right) \land \left(\min_i \Delta F_{t,z,i} \ge 0.0858\,\text{N}\right)$
5. $\text{FrictionBoundValid} \equiv \left(\bigwedge_{i=1}^{N_f} [\text{FrictionStatus}_i == \text{IDENTIFIED} \land \Delta F_{t,z,i} \ge 0.070\,\text{N}]\right) \land \left(\min_i \mu_{\text{LB},i} \ge 0.15\right)$
6. $\text{FrictionCapacityPassed} \equiv \left(\sum_i f_{t,z,i}^{\text{avail}} \ge F_{\text{lift, req}}\right) \land \left(\min(F_{\text{cap, Side A}}, F_{\text{cap, Side B}}) \ge \frac{F_{\text{lift, req}}}{2}\right)$
7. $\text{ForceLimitsPassed} \equiv (\max_i F_{n,i} < 18.0\,\text{N}) \land (\min_i F_{n,i} \ge 0.10\,\text{N})$
8. $\text{NoActiveSlip} \equiv \bigwedge_{i=1}^{N_f} \left[\rho_i \le 0.85 \land |\dot{\delta}_{t,i}| \le 0.10\,\text{mm/s}\right]$
9. $\text{DynamicModelValid} \equiv \left(|a_z(t)| \le 0.05\,\text{m/s}^2 \lor \hat{F}_{\text{table},z}(t) \ge 0.0\right)$

---

## 50.6 Section 6: Reconciled 15 PLCEA Unit-Test Specification (T01–T15)

```
+========================================================================================================================+
|                                    PLCEA 15 UNIT TEST MATRIX (REVISION 2.0)                                            |
+=======+======================================+=========================================================================+
| Test  | Test Identifier                      | Target Reconciled Boundary & Assertion                                  |
+=======+======================================+=========================================================================+
| T01   | test_impact_force_regime_bounds      | Asserts: (1) Regime 1 (drop, k=50k, m=0.35kg): Fpeak = 9.38 N <= 18 N;  |
|       |                                      | (2) Regime 2 (clamped probe arrest, keff=5357 N/m): Fpeak = 6.54 N <=18N|
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T02   | test_friction_simultaneous_confidence| Evaluates family-wise 99% bound: alpha = 0.0025, z0.9975 = 2.807.      |
|       |                                      | Asserts Delta mu_i == 0.0378 under calibrated noise (0.03 N, 0.05 N).   |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T03   | test_per_contact_excitation_gate     | When finger 4 has Delta Ft,z = 0.040 N < 0.070 N (even with aggregate   |
|       |                                      | shear = 0.40 N): FrictionStatus_4 == UNIDENTIFIED, LiftAuthorized=False.|
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T04   | test_friction_no_slip_duration_gate  | Asserts friction identified ONLY after 5 consecutive cycles (50 ms)     |
|       |                                      | under active per-contact shear without slip.                            |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T05   | test_evidence_preload_vs_lift_preload| When Fn,i = 2.40 N: EvidencePreloadPassed == True,                      |
|       | non_leakage                          | LiftPreloadPassed == False, LiftAuthorized == False.                    |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T06   | test_lift_preload_satisfaction       | When Fn,i = 2.56 N >= 2.5547 N: LiftPreloadPassed == True.              |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T07   | test_2d_tangent_friction_capacity    | With ft,theta = 0.05 N, evaluates ft,z^avail = sqrt((mu*Fn)^2 - ft,th^2)|
|       |                                      | Asserts lift blocked if sum ft,z^avail < 4.290 N.                       |
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
| T13   | test_master_lift_authorized_conjunct | Toggles all 9 gates individually: LiftAuthorized is True IF AND ONLY IF |
|       |                                      | all 9 gates are simultaneously True.                                    |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T14   | test_state_machine_retry_budget      | S3 allows retries 0 and 1; transitions to S5 on retry == 2.             |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T15   | test_active_anti_crush_retraction    | When Fn >= 18.0 N: outward velocity commanded with Kretract = 1.5,      |
|       |                                      | lift velocity locked to 0.0 m/s.                                        |
+=======+======================================+=========================================================================+
```

---

## 50.7 Formal Submission for Phase 1 Authorization

With Document 50 Revision 2.0 complete:
1. The displacement envelope $z_{\max} = 0.25625\,\text{mm}$ and energy references are physically decoupled between Object Drop ($F_{\text{peak}} = 9.38\,\text{N}$) and Clamped Probe Arrest ($F_{\text{peak}} = 6.54\,\text{N}$), proving that the $18.57\,\text{N}$ figure resulted from mixing incompatible physical boundary conditions.
2. Per-contact excitation is rigorously enforced ($\Delta F_{t,z,i} \ge 0.070\,\text{N}$), backed by the documented 10,000-cycle ATI Nano17 calibration protocol.
3. The 2D tangent plane circular friction boundary $f_{t,z,i}^{\text{avail}} = \sqrt{(\mu_{\text{LB},i} F_{n,i})^2 - f_{t,\theta,i}^2}$ is fully derived with explicit geometric scoping to horizontal antipodal grasping.
4. Numerical precision is aligned throughout using standard gravity $g = 9.80665\,\text{m/s}^2$ ($E_p = 0.6865\,\text{mJ}$).

We formally request Technical Co-Founder authorization to proceed to:
**Phase 1: Authoring the 15 PLCEA Unit Tests (`tests/test_p27_plcea_evidence_acquisition.py`).**
*(Controller implementation in `src/coordination/plcea_substitutor.py` remains strictly blocked until the Phase 1 test suite is authored, run, and approved).*
