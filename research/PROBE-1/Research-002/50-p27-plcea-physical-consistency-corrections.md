# HOROS PROBE-1 — Research-002: Trustworthy Contact World Models
# Document 50: Pre-Lift Contact Evidence Acquisition (PLCEA) — Physical Consistency Corrections, Multi-Contact Simultaneous Confidence, and Local-to-World Contact Transformations

**Author:** Sunil Kumar Chavhan (`contact@horoslab.org`)  
**Organization:** HOROS Physical Intelligence Research Group (H.R.)  
**Date:** November 7, 2026  
**Document Version:** 1.0 (Physical Consistency Corrections for Phase 1 Authorization)  
**Status:** **Pre-Implementation Specification Frozen for Co-Founder Authorization**  
**Prerequisites:** Document 45 (Audit Accepted), Documents 46–48 (Audited), Document 49 (Reviewed — Targeted Corrections Requested)  
**Implementation Safeguard:** In strict compliance with Technical Co-Founder Gate Instructions, **zero unit-test code and zero controller implementation code have been authored.** Documents 40–49 and historical pilot outputs remain permanently frozen and unmodified. This document provides the authoritative physical and mathematical corrections required before Phase 1 unit-test authoring (`tests/test_p27_plcea_evidence_acquisition.py`) can be authorized.  
**Git References:**
- Main Monorepo: `c:\projects\MemoryOS` (`horoslab`, branch `feat/probe1-research002-phase2`)
- Dedicated Research Repo: `c:\projects\horos-probe-1` (`horos-probe-1`, branch `main`)

---

## Executive Summary & Review Gate Resolution Matrix

This document directly addresses the five mathematical and physical gaps and the state-machine architectural clarification identified in the Technical Co-Founder review of Document 49.

```
+========================================================================================================================+
|                                        DOCUMENT 49 GAP RESOLUTION MATRIX                                               |
+================+===========================================+===========================================================+
| Gap Identifier | Co-Founder Audit Finding                  | Document 50 Mathematical & Physical Resolution            |
+================+===========================================+===========================================================+
| Gap 49.1       | Energy budget: Eimpact (1.565 mJ) +       | Reconciled total energy budget: Etotal = 2.315 mJ.        |
| (Impact Energy | Wactuator (0.750 mJ) = 2.315 mJ, but peak | Recalculated peak total force with k = 50,000 N/m:        |
| Reconciliation)| calculation used 1.625 mJ, yielding 13 N. | Fpeak,total = sqrt(2.5547^2 + 2*50000*0.002315) = 15.43 N.|
|                | Correct calculation yields 15.43 N.       | Reconciled T01 to validate 15.43 N <= 18.0 N.             |
+----------------+-------------------------------------------+-----------------------------------------------------------+
| Gap 49.2       | 99% one-sided bound per contact does not  | Formulated simultaneous family-wise 99% confidence bound  |
| (Simultaneous  | establish 99% joint confidence across all | across all Nf = 4 contacts via Bonferroni/Sidak:          |
| Friction Conf.)| four contacts (joint confidence is 96%).  | alpha_contact = 0.01/4 = 0.0025 => z0.9975 = 2.807.       |
|                |                                           | Delta mu_i = 0.0378; joint family confidence >= 99.0%.    |
+----------------+-------------------------------------------+-----------------------------------------------------------+
| Gap 49.3       | FrictionBoundValid does not establish     | Added explicit FrictionCapacityPassed gate:               |
| (Friction      | that available friction can support the   | sum(mu_LB,i * Fn,i) >= S * m * (g + az,cmd) with S = 1.25.|
| Capacity Gate) | requested upward lift load.               | Enforced antipodal bilateral balance across sides A & B.  |
+----------------+-------------------------------------------+-----------------------------------------------------------+
| Gap 49.4       | Elastomer (4 N/mm) and table (50 N/mm)    | Defined 3 distinct mechanical configurations:             |
| (Contact       | described in series, but 50 N/mm treated  | (1) Clamp pair: ke/2 = 2.0 N/mm;                          |
| Stiffness Def.)| as effective stiffness.                   | (2) Vertical grasp-table probe: keff,z = 5.36 N/mm;       |
|                |                                           | (3) Direct rigid table compression: krigid = 50.0 N/mm.   |
+----------------+-------------------------------------------+-----------------------------------------------------------+
| Gap 49.5       | World-frame vertical force and local      | Formulated full local contact frame {Ci} to world frame   |
| (Contact Frame | fingertip friction constraints not fully  | {W} rotation matrix R_W^Ci and spatial grasp map G.       |
| Transformation)| connected.                                | Proved Ffinger,z,i = ft,z,i under antipodal grasp geometry|
+----------------+-------------------------------------------+-----------------------------------------------------------+
| Architecture   | FRICTION_UNIDENTIFIED introduced without  | Defined FRICTION_UNIDENTIFIED strictly as an internal     |
| (State-Machine | clarifying if it is an 8th state or a     | estimation status substate within S2/S3, NOT an 8th state.|
| Definition)    | fallback substate.                        | Retained exactly 7 discrete supervisory states (S0..S6).  |
+================+===========================================+===========================================================+
```

---

## 50.1 Section 1: Reconciled Impact-Energy Budget & Corrected Peak-Force Calculation

### 50.1.1 Energy Budget Reconciliation
The total energy absorbed during a transient deceleration or downward contact arrest event comprises three physically derived components:
1. **Moving Inertial Kinetic Energy ($E_k$):**
   - Effective manipulator and hand moving Cartesian mass: $M_{\text{hand}} = 0.70\,\text{kg}$.
   - Maximum commanded micro-probe velocity ceiling: $v_{\max} = 0.05\,\text{m/s}$.
   $$E_k = \frac{1}{2} M_{\text{hand}} v_{\max}^2 = \frac{1}{2} (0.70\,\text{kg}) (0.05\,\text{m/s})^2 = 0.875 \times 10^{-3}\,\text{J} = 0.875\,\text{mJ}$$
2. **Gravitational Potential Energy Change ($\Delta E_p$):**
   - Vertical micro-probe displacement stroke: $\Delta z = 0.10\,\text{mm} = 1.0 \times 10^{-4}\,\text{m}$.
   $$\Delta E_p = M_{\text{hand}} g \Delta z = (0.70\,\text{kg}) (9.81\,\text{m/s}^2) (1.0 \times 10^{-4}\,\text{m}) = 0.6867 \times 10^{-3}\,\text{J} \approx 0.690\,\text{mJ}$$
3. **Total Impact Energy ($E_{\text{impact}}$):**
   $$E_{\text{impact}} = E_k + \Delta E_p = 0.875\,\text{mJ} + 0.690\,\text{mJ} = 1.565\,\text{mJ}$$
4. **Actuator Work Under Motor Torque Saturation ($W_{\text{actuator}}$):**
   - Joint motor driver current limits impose a strict saturation ceiling on downward force: $F_{\text{motor},\max} \le 5.0\,\text{N}$.
   - Maximum physical arrest displacement: $\Delta \delta_{\max} \le 0.15\,\text{mm} = 1.5 \times 10^{-4}\,\text{m}$.
   $$W_{\text{actuator}} \le F_{\text{motor},\max} \cdot \Delta \delta_{\max} \le (5.0\,\text{N}) (1.5 \times 10^{-4}\,\text{m}) = 0.750 \times 10^{-3}\,\text{J} = 0.750\,\text{mJ}$$
5. **Reconciled Total Energy Budget ($E_{\text{total}}$):**
   $$\boxed{E_{\text{total}} = E_{\text{impact}} + W_{\text{actuator}} = 1.565\,\text{mJ} + 0.750\,\text{mJ} = 2.315\,\text{mJ} = 2.315 \times 10^{-3}\,\text{J}}$$

### 50.1.2 Corrected Peak-Force Derivation
Under initial normal preload $F_{n,0} = 2.5547\,\text{N}$, initial elastomeric displacement $\delta_0 = F_{n,0} / k$, and effective contact stiffness $k$, the incremental strain energy absorbed is:
$$\Delta U = F_{n,0} \Delta \delta_{\max} + \frac{1}{2} k \Delta \delta_{\max}^2 = E_{\text{total}}$$

Solving for maximum total contact force $F_{\text{peak, total}} = F_{n,0} + k \Delta \delta_{\max}$:
$$\boxed{F_{\text{peak, total}} = \sqrt{F_{n,0}^2 + 2 k E_{\text{total}}}}$$

Evaluating under the rigid table support stiffness $k = 50.0\,\text{N/mm} = 50,000\,\text{N/m}$:
$$F_{\text{peak, total}} = \sqrt{(2.5547\,\text{N})^2 + 2 (50,000\,\text{N/m}) (0.002315\,\text{J})}$$
$$F_{\text{peak, total}} = \sqrt{6.5265 + 231.50} = \sqrt{238.0265} \approx \mathbf{15.428\,\text{N}}$$

$$\boxed{F_{\text{peak, total}} = 15.43\,\text{N} < F_{\text{protect}} (18.0\,\text{N}) < F_{\text{hard}} (25.0\,\text{N})}$$

**Resolution:**
The calculation error in Document 49 ($1.625\,\text{mJ}$ resulting in $13.00\,\text{N}$) is fully reconciled. The exact physical peak force bound is **$15.43\,\text{N}$**. This value strictly satisfies the $18.0\,\text{N}$ fragile-object protective ceiling and provides the exact numerical target for unit test T01.

---

## 50.2 Section 2: Simultaneous Friction Uncertainty Across Multiple Contacts

### 50.2.1 Marginal vs. Family-Wise Joint Confidence
In Document 49, a $1 - \alpha = 99\%$ one-sided confidence lower bound was derived individually per contact. However, for a multi-fingered hand with $N_f = 4$ independent contacts, marginal $99\%$ confidence yields a joint family-wise confidence of only:
$$P\left(\bigcap_{i=1}^{N_f} \{\mu_i \ge \mu_{\text{LB},i}\}\right) \ge 1 - \sum_{i=1}^{N_f} \alpha_i = 1 - 4(0.01) = 0.96 \quad (96\%)$$

To establish a guaranteed **simultaneous joint confidence level of $1 - \alpha_{\text{family}} = 99\%$** ($\alpha_{\text{family}} = 0.01$) across all four contacts simultaneously, we apply the Bonferroni correction:
$$\alpha_{\text{contact}} = \frac{\alpha_{\text{family}}}{N_f} = \frac{0.01}{4} = 0.0025$$

Under the exact Šidák correction for independent channels:
$$\alpha_{\text{Šidák}} = 1 - (1 - \alpha_{\text{family}})^{1/N_f} = 1 - (1 - 0.01)^{0.25} = 1 - (0.99)^{0.25} \approx 0.002509$$

The one-sided standard normal critical value corresponding to $\alpha = 0.0025$ is:
$$z_{1 - \alpha_{\text{contact}}} = z_{0.9975} = \Phi^{-1}(0.9975) \approx \mathbf{2.807}$$

### 50.2.2 Simultaneous Lower Bound Formulation
Using calibrated sensor noise standard deviations ($\sigma_t = 0.03\,\text{N}$, $\sigma_n = 0.05\,\text{N}$) across the measured mobilization ratio $\hat{r}_i = \|f_{t,i}\| / F_{n,i}$:
$$\Delta \mu_i^{\text{simultaneous}} = \frac{z_{0.9975}}{F_{n,i}} \sqrt{\sigma_t^2 + \left(\frac{\|f_{t,i}\|}{F_{n,i}}\right)^2 \sigma_n^2} = \frac{2.807}{F_{n,i}} \sqrt{\sigma_t^2 + \left(\frac{\|f_{t,i}\|}{F_{n,i}}\right)^2 \sigma_n^2}$$

Evaluating at nominal evidence acquisition threshold ($F_{n,i} = 2.299\,\text{N}$, $\|f_{t,i}\| = 0.35\,\text{N}$):
$$\Delta \mu_i^{\text{simultaneous}} = \frac{2.807}{2.299} \sqrt{0.03^2 + \left(\frac{0.35}{2.299}\right)^2 0.05^2} = 1.221 \times \sqrt{0.0009 + 0.0000579} \approx \mathbf{0.0378}$$

The simultaneous lower confidence bound for each finger $i \in \{1,\dots,N_f\}$ is:
$$\boxed{\mu_{\text{LB},i}^{\text{simultaneous}} = \max\left(0, \frac{\|f_{t,i}\|}{F_{n,i}} - \Delta \mu_i^{\text{simultaneous}}\right)}$$

$$\boxed{P\left(\mu_1 \ge \mu_{\text{LB},1}^{\text{simultaneous}} \land \mu_2 \ge \mu_{\text{LB},2}^{\text{simultaneous}} \land \mu_3 \ge \mu_{\text{LB},3}^{\text{simultaneous}} \land \mu_4 \ge \mu_{\text{LB},4}^{\text{simultaneous}}\right) \ge 0.99}$$

This establishes a mathematically sound $99\%$ simultaneous lower confidence bound across all four contacts.

---

## 50.3 Section 3: Friction-Capacity Lift Authorization Condition

### 50.3.1 Physical Rationale
Verifying that $\mu_{\text{LB},i} \ge \mu_{\text{required\_min}} = 0.15$ proves that friction is nonzero, but **does not prove that the current grasp can support the physical lift wrench**.

To prevent drop failures upon lift initiation, the controller must evaluate whether the total available friction force under current normal forces exceeds the required upward vertical wrench with safety margin $S \ge 1.25$.

### 50.3.2 Total Upward Friction Capacity Formulation
The maximum upward vertical friction force that can be mobilized across all contacts without slipping is:
$$F_{\text{friction, max}} = \sum_{i=1}^{N_f} \mu_{\text{LB},i}^{\text{simultaneous}} \cdot F_{n,i}$$

The required vertical lift force to accelerate the object upward at commanded acceleration $a_{z,\text{cmd}}$ with safety factor $S = 1.25$ is:
$$F_{\text{lift, req}} = S \cdot m \left(g + \max(0, a_{z,\text{cmd}})\right)$$
where $m = 0.350\,\text{kg}$, $g = 9.81\,\text{m/s}^2$. For quasi-static lift ($a_{z,\text{cmd}} = 0$):
$$F_{\text{lift, req}} = 1.25 \times (0.350\,\text{kg} \times 9.81\,\text{m/s}^2) = 1.25 \times 3.4335\,\text{N} = 4.2919\,\text{N}$$

### 50.3.3 Bilateral Antipodal Balance Condition
In an antipodal grasp (Side A = fingers $\{1, 2\}$, Side B = fingers $\{3, 4\}$), vertical load support must be balanced across opposing grasp faces to prevent internal object torque and peel-off slip:
$$F_{\text{capacity, Side A}} = \sum_{i \in \{1, 2\}} \mu_{\text{LB},i} F_{n,i} \ge \frac{1}{2} F_{\text{lift, req}} = 2.146\,\text{N}$$
$$F_{\text{capacity, Side B}} = \sum_{j \in \{3, 4\}} \mu_{\text{LB},j} F_{n,j} \ge \frac{1}{2} F_{\text{lift, req}} = 2.146\,\text{N}$$

### 50.3.4 Explicit Friction Capacity Gate
$$\boxed{\text{FrictionCapacityPassed} = \left(\sum_{i=1}^{N_f} \mu_{\text{LB},i} F_{n,i} \ge S \cdot m (g + a_{z,\text{cmd}})\right) \land \left(\min(F_{\text{capacity, Side A}}, F_{\text{capacity, Side B}}) \ge \frac{S \cdot m (g + a_{z,\text{cmd}})}{2}\right)}$$

If $\text{FrictionCapacityPassed} = \text{False}$, upward lift remains locked to $0.0\,\text{m/s}$, even if $\mu_{\text{LB},i} \ge 0.15$.

---

## 50.4 Section 4: Explicit Contact Stiffness Configurations & Compliance Network

To eliminate ambiguity between series pad compliance and rigid table support, we formally specify the three distinct mechanical contact configurations:

```
+========================================================================================================================+
|                                      MECHANICAL CONTACT CONFIGURATIONS                                                 |
+===============+====================================+=======================================+===========================+
| Configuration | Mechanical Physical Description    | Governing Stiffness Expression        | Calibrated Stiffness (k)  |
+===============+====================================+=======================================+===========================+
| Config 1      | Normal Clamping Pair               | kclamp = (1/ke,n + 1/kobj + 1/ke,n)^-1| kclamp = 2.0 N/mm         |
| (Horizontal)  | Two opposing fingertips on object  | For rigid object (kobj -> inf): ke,n/2| (2000 N/m)                |
+---------------+------------------------------------+---------------------------------------+---------------------------+
| Config 2      | Vertical Grasp-Table Probing       | keff,z = (1/kfingers,z + 1/ktable,z)^-1| keff,z = 5.357 N/mm       |
| (Vertical)    | Fingers in shear, object on table  | kfingers,z = 4 * 1.5 N/mm = 6.0 N/mm  | (5357 N/m)                |
+---------------+------------------------------------+---------------------------------------+---------------------------+
| Config 3      | Direct Rigid Boundary Compression  | krigid = ktable,z                     | krigid = 50.0 N/mm        |
| (Worst-Case)  | Object pressed directly into table | Structural optical breadboard plate   | (50,000 N/m)              |
+========================================================================================================================+
```

### 50.4.1 Peak Impact Forces Across Configurations
Evaluating $F_{\text{peak, total}} = \sqrt{F_{n,0}^2 + 2 k E_{\text{total}}}$ with $F_{n,0} = 2.5547\,\text{N}$ and $E_{\text{total}} = 2.315\,\text{mJ}$:

1. **Configuration 2 (Nominal Vertical Probing, $k_{\text{eff},z} = 5357\,\text{N/m}$):**
   $$F_{\text{peak, total}} = \sqrt{(2.5547)^2 + 2(5357)(0.002315)} = \sqrt{6.5265 + 24.803} = \sqrt{31.330} \approx \mathbf{5.60\,\text{N}}$$
   *During nominal micro-probing, transient force peaks at only $5.60\,\text{N}$.*

2. **Configuration 3 (Worst-Case Direct Rigid Compression, $k_{\text{rigid}} = 50,000\,\text{N/m}$):**
   $$F_{\text{peak, total}} = \sqrt{(2.5547)^2 + 2(50000)(0.002315)} = \sqrt{6.5265 + 231.50} = \sqrt{238.026} \approx \mathbf{15.43\,\text{N}}$$
   *Even under worst-case direct rigid table compression, peak force reaches $15.43\,\text{N}$, strictly below the $18.0\,\text{N}$ ceiling.*

---

## 50.5 Section 5: Local-to-World Contact Force Transformations & Spatial Grasp Map

### 50.5.1 Coordinate Frame Definitions
1. **World Inertial Frame $\{\mathcal{W}\}$:**
   - Cartesian axes: $\{\hat{\mathbf{x}}_{\mathcal{W}}, \hat{\mathbf{y}}_{\mathcal{W}}, \hat{\mathbf{z}}_{\mathcal{W}}\}$.
   - Gravity points along negative $z$: $\mathbf{g} = [0, 0, -g]^T$ where $g = 9.81\,\text{m/s}^2$.
   - Upward lift acceleration occurs along $+\hat{\mathbf{z}}_{\mathcal{W}}$.
2. **Local Contact Frame at Digit $i$ ($\{\mathcal{C}_i\}$):**
   - Unit inward normal vector: $\hat{\mathbf{n}}_i \in \mathbb{R}^3$, directed into the object surface ($\|\hat{\mathbf{n}}_i\| = 1$).
   - Tangent unit vectors: $\hat{\mathbf{t}}_{i,1}, \hat{\mathbf{t}}_{i,2} \in \mathbb{R}^3$, spanning the local contact tangent plane such that:
     $$\hat{\mathbf{t}}_{i,1} \cdot \hat{\mathbf{n}}_i = 0, \quad \hat{\mathbf{t}}_{i,2} \cdot \hat{\mathbf{n}}_i = 0, \quad \hat{\mathbf{t}}_{i,1} \times \hat{\mathbf{t}}_{i,2} = \hat{\mathbf{n}}_i$$
   - Rotation matrix from local contact frame to world frame:
     $$\mathbf{R}_{\mathcal{W}}^{\mathcal{C}_i} = \begin{bmatrix} \hat{\mathbf{t}}_{i,1} & \hat{\mathbf{t}}_{i,2} & \hat{\mathbf{n}}_i \end{bmatrix} \in SO(3)$$

### 50.5.2 Antipodal Grasp Geometry
For a multi-finger antipodal grasp on a prismatic or cylindrical object resting on a horizontal table:
- Fingers 1 and 2 contact Side A with inward normal $\hat{\mathbf{n}}_1 = \hat{\mathbf{n}}_2 = [1, 0, 0]^T$.
- Fingers 3 and 4 contact Side B with inward normal $\hat{\mathbf{n}}_3 = \hat{\mathbf{n}}_4 = [-1, 0, 0]^T$.
- Because contact normals are horizontal:
  $$\hat{\mathbf{n}}_i \cdot \hat{\mathbf{z}}_{\mathcal{W}} = 0 \quad \forall i \in \{1, 2, 3, 4\}$$
- We define the first tangent vector aligned with the world vertical axis:
  $$\hat{\mathbf{t}}_{i,z} \equiv \hat{\mathbf{z}}_{\mathcal{W}} = [0, 0, 1]^T$$
- The transverse horizontal tangent vector is:
  $$\hat{\mathbf{t}}_{i,\theta} = \hat{\mathbf{n}}_i \times \hat{\mathbf{t}}_{i,z}$$

### 50.5.3 Force Decomposition & Transformation
In local contact coordinates, the contact force vector is:
$$\mathbf{f}_{\mathcal{C},i} = \begin{bmatrix} f_{t,z,i} \\ f_{t,\theta,i} \\ F_{n,i} \end{bmatrix}$$
where $F_{n,i} \ge 0$ is the inward normal force, and $\mathbf{f}_{t,i} = [f_{t,z,i}, f_{t,\theta,i}]^T$ is the 2D tangential friction vector.

Transforming to world frame:
$$\mathbf{f}_{\mathcal{W},i} = \mathbf{R}_{\mathcal{W}}^{\mathcal{C}_i} \mathbf{f}_{\mathcal{C},i} = f_{t,z,i} \hat{\mathbf{t}}_{i,z} + f_{t,\theta,i} \hat{\mathbf{t}}_{i,\theta} + F_{n,i} \hat{\mathbf{n}}_i$$

Projecting along the world vertical axis:
$$F_{\text{finger},z,i} = \mathbf{f}_{\mathcal{W},i} \cdot \hat{\mathbf{z}}_{\mathcal{W}} = f_{t,z,i} (\hat{\mathbf{t}}_{i,z} \cdot \hat{\mathbf{z}}_{\mathcal{W}}) + f_{t,\theta,i} (\hat{\mathbf{t}}_{i,\theta} \cdot \hat{\mathbf{z}}_{\mathcal{W}}) + F_{n,i} (\hat{\mathbf{n}}_i \cdot \hat{\mathbf{z}}_{\mathcal{W}})$$

Since $\hat{\mathbf{t}}_{i,z} \cdot \hat{\mathbf{z}}_{\mathcal{W}} = 1$, $\hat{\mathbf{t}}_{i,\theta} \cdot \hat{\mathbf{z}}_{\mathcal{W}} = 0$, and $\hat{\mathbf{n}}_i \cdot \hat{\mathbf{z}}_{\mathcal{W}} = 0$:
$$\boxed{F_{\text{finger},z,i} = f_{t,z,i}}$$

**Physical Result:**
The world-frame vertical load supported by each fingertip is **identically equal to its local vertical shear force $f_{t,z,i}$**. Normal force $F_{n,i}$ provides zero direct vertical support; its sole role is to generate friction capacity $\mu_i F_{n,i}$ via Coulomb contact constraints:
$$\boxed{|f_{t,z,i}| \le \sqrt{f_{t,z,i}^2 + f_{t,\theta,i}^2} \le \mu_i F_{n,i}}$$

### 50.5.4 Spatial Grasp Map $\mathbf{G}$
The net wrench exerted on the object center of mass by all $N_f = 4$ contacts is:
$$\mathbf{w}_{\text{grasp}} = \mathbf{G} \mathbf{f}_{\mathcal{W}} = \sum_{i=1}^{N_f} \begin{bmatrix} \mathbf{I}_{3 \times 3} \\ [\mathbf{p}_i \times] \end{bmatrix} \mathbf{f}_{\mathcal{W},i} \in \mathbb{R}^6$$
where $\mathbf{p}_i = \mathbf{x}_i - \mathbf{x}_{\text{COM}}$ is the position vector of contact $i$ relative to the object COM.

For pure vertical lifting without induced rotation:
1. Vertical Force Equilibrium: $\sum_{i=1}^{N_f} f_{t,z,i} + F_{\text{table},z} = m (g + a_z)$.
2. Moment Balance: $\sum_{i=1}^{N_f} (\mathbf{p}_i \times \mathbf{f}_{\mathcal{W},i}) = \mathbf{0}$.

---

## 50.6 Section 6: Architectural Definition — `FRICTION_UNIDENTIFIED` Substate & The 7-State Supervisor

### 50.6.1 Architectural Classification
We formally resolve the state-machine architectural question:
**`FRICTION_UNIDENTIFIED` is NOT an 8th supervisory state.**

It is an **internal estimation status substate / flag** maintained by the tactile estimator inside:
- State $S_2$: `PROBE_FOR_EVIDENCE`
- State $S_3$: `PROBE_INCONCLUSIVE`

The supervisor retains **exactly seven discrete operational states ($S_0$ through $S_6$)**:
```
+========================================================================================================+
|                                    7-STATE SUPERVISORY ARCHITECTURE                                    |
+=======+========================+=======================================================================+
| State | Name                   | Operational Definition & Authority                                    |
+=======+========================+=======================================================================+
| S0    | APPROACH_FREE_SPACE    | Free space approach; lift locked to 0.0 m/s.                          |
+-------+------------------------+-----------------------------------------------------------------------+
| S1    | HOLD_PRELOAD           | Squeeze deficit active; establishes Fn >= 2.299 N; lift locked.       |
+-------+------------------------+-----------------------------------------------------------------------+
| S2    | PROBE_FOR_EVIDENCE     | Executes +0.10 mm micro-probe; tracks shear, slip, and friction.      |
|       |                        | Internal estimator status: UNIDENTIFIED vs IDENTIFIED.                |
+-------+------------------------+-----------------------------------------------------------------------+
| S3    | PROBE_INCONCLUSIVE     | Probe finished but evidence insufficient; evaluates retry budget.     |
+-------+------------------------+-----------------------------------------------------------------------+
| S4    | AUTHORIZE_LIFT         | Lift clamp released; upward velocity integrated under mu_LB.          |
+-------+------------------------+-----------------------------------------------------------------------+
| S5    | RECOVER_FALLBACK       | Active outward retraction; lift arrested to 0.0 m/s.                  |
+-------+------------------------+-----------------------------------------------------------------------+
| S6    | SENSOR_UNAVAILABLE     | Telemetry fault / saturation; safe hover; requires 3 healthy frames.  |
+=======+================================================================================================+
```

### 50.6.2 Internal Estimator Logic in State $S_2$
Inside $S_2$, the estimator evaluates:
$$\text{FrictionStatus} = \begin{cases}
\text{FRICTION\_IDENTIFIED} & \text{if } \sum_{i=1}^{N_f} \Delta F_{t,z,i} \ge 0.35\,\text{N} \land T_{\text{noslip}} \ge 50\,\text{ms} \land \max_i \rho_i \le 0.85 \\
\text{FRICTION\_UNIDENTIFIED} & \text{otherwise}
\end{cases}$$

- If $\text{FrictionStatus} = \text{FRICTION\_UNIDENTIFIED}$:
  - $\mu_{\text{LB},i} = \text{undefined}$ (set to `None`).
  - $\text{FrictionBoundValid} = \text{False}$.
  - $\text{FrictionCapacityPassed} = \text{False}$.
  - Transition to $S_4$ (`AUTHORIZE_LIFT`) is strictly impossible.
  - Upon probe completion, supervisor transitions to $S_3$ (`PROBE_INCONCLUSIVE`).

### 50.6.3 The Consolidated Master `LiftAuthorized` Invariant
The single consolidated boolean equation governing transition into and retention in $S_4$ (`AUTHORIZE_LIFT`) is:

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

Where all 9 conditions are deterministically evaluated at each 100 Hz cycle:
1. $\text{SensorHealthy} \equiv \left(\forall i, \text{isfinite}(F_{n,i}, \mathbf{f}_{t,i})\right) \land (\Delta t \le 20\,\text{ms}) \land (\gamma = 1) \land (\max_i F_{n,i} < 22.0\,\text{N})$
2. $\text{EvidencePreloadPassed} \equiv \min_i F_{n,i} \ge 2.299\,\text{N}$
3. $\text{LiftPreloadPassed} \equiv \min_i F_{n,i} \ge 2.5547\,\text{N}$
4. $\text{LoadTransferPassed} \equiv \left(\sum_i \Delta F_{t,z,i} \ge 0.687\,\text{N}\right) \land \left(\min_i \Delta F_{t,z,i} \ge 0.086\,\text{N}\right)$
5. $\text{FrictionBoundValid} \equiv (\text{FrictionStatus} == \text{FRICTION\_IDENTIFIED}) \land (\min_i \mu_{\text{LB},i}^{\text{simultaneous}} \ge 0.15)$
6. $\text{FrictionCapacityPassed} \equiv \left(\sum_i \mu_{\text{LB},i} F_{n,i} \ge 1.25\,m(g + a_{z,\text{cmd}})\right) \land \left(\min(F_{\text{cap, A}}, F_{\text{cap, B}}) \ge \frac{1.25\,m(g + a_{z,\text{cmd}})}{2}\right)$
7. $\text{ForceLimitsPassed} \equiv (\max_i F_{n,i} < 18.0\,\text{N}) \land (\min_i F_{n,i} \ge 0.10\,\text{N})$
8. $\text{NoActiveSlip} \equiv \bigwedge_{i=1}^{N_f} \left[\rho_i \le 0.85 \land |\dot{\delta}_{t,i}| \le 0.10\,\text{mm/s}\right]$
9. $\text{DynamicModelValid} \equiv \left(|a_z(t)| \le 0.05\,\text{m/s}^2 \lor \hat{F}_{\text{table},z}(t) \ge 0.0\right)$

---

## 50.7 Section 7: Updated Test Matrix Specification (T01–T15)

The 15 PLCEA unit tests for `tests/test_p27_plcea_evidence_acquisition.py` are updated with the reconciled values:

```
+========================================================================================================================+
|                                        RECONCILED PLCEA 15 UNIT TEST MATRIX                                            |
+=======+======================================+=========================================================================+
| Test  | Test Identifier                      | Target Reconciled Boundary & Assertion                                  |
+=======+======================================+=========================================================================+
| T01   | test_impact_force_preload_upper_bound| Reconciled: Etotal = 2.315 mJ, Fn,0 = 2.5547 N, k = 50,000 N/m.         |
|       |                                      | Asserts Fpeak,total == 15.43 N <= 18.0 N.                               |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T02   | test_friction_simultaneous_confidence| Evaluates simultaneous 99% bound: alpha = 0.0025, z0.9975 = 2.807.      |
|       |                                      | Asserts Delta mu_i == 0.0378, joint family confidence >= 99.0%.         |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T03   | test_friction_unidentified_on_zero_  | Contact with zero shear demand (Delta Ft,z = 0.10 N < 0.35 N) sets      |
|       | shear_demand                         | FrictionStatus == UNIDENTIFIED, LiftAuthorized == False.                |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T04   | test_friction_no_slip_duration_gate  | Asserts friction identified ONLY after 5 consecutive cycles (50 ms)     |
|       |                                      | under active shear demand without slip.                                 |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T05   | test_evidence_preload_vs_lift_preload| When Fn,i = 2.40 N: EvidencePreloadPassed == True,                      |
|       | non_leakage                          | LiftPreloadPassed == False, LiftAuthorized == False.                    |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T06   | test_lift_preload_satisfaction       | When Fn,i = 2.56 N >= 2.5547 N: LiftPreloadPassed == True.              |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T07   | test_friction_capacity_lift_gate     | When mu_LB = 0.20 but Fn = 2.6 N (capacity = 2.08 N < 4.29 N):          |
|       |                                      | FrictionCapacityPassed == False, blocking lift.                         |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T08   | test_aggregate_load_transfer_gate    | Asserts AggregateTransferPassed == True when sum Delta Ft,z >= 0.687 N; |
|       |                                      | False when sum Delta Ft,z = 0.680 N.                                    |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T09   | test_per_finger_load_transfer_gate   | Aggregate shear = 0.75 N, but finger 1 shear = 0.05 N < 0.086 N:        |
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

## 50.8 Formal Request for Phase 1 Authorization

With Document 50 complete, every numerical, statistical, physical, and architectural item raised by the Technical Co-Founder has been resolved:
1. **Energy Budget & Peak Force:** Reconciled $E_{\text{total}} = 2.315\,\text{mJ}$ and proven $F_{\text{peak, total}} = 15.43\,\text{N} \le 18.0\,\text{N}$.
2. **Simultaneous Confidence:** Derived $99\%$ joint family-wise lower confidence bounds ($z_{0.9975} = 2.807 \implies \Delta \mu_i = 0.0378$) across all four contacts.
3. **Friction Capacity Gate:** Formulated $\text{FrictionCapacityPassed}$ with bilateral antipodal balance to guarantee lift wrench support before authorization.
4. **Explicit Contact Stiffness:** Specified Configurations 1 (clamp, $2.0\,\text{N/mm}$), 2 (vertical probe, $5.36\,\text{N/mm}$), and 3 (rigid table, $50.0\,\text{N/mm}$).
5. **Contact Frame Transformations:** Derived $\mathbf{R}_{\mathcal{W}}^{\mathcal{C}_i}$ and proved $F_{\text{finger},z,i} = f_{t,z,i}$ under antipodal geometry.
6. **State-Machine Architecture:** Confirmed `FRICTION_UNIDENTIFIED` as an internal substate of $S_2/S_3$, retaining exactly 7 discrete supervisor states.

We formally request Technical Co-Founder authorization to proceed to:
**Phase 1: Authoring the 15 PLCEA Unit Tests (`tests/test_p27_plcea_evidence_acquisition.py`).**
*(Controller implementation in `src/coordination/plcea_substitutor.py` remains strictly blocked until the Phase 1 test suite is authored, run, and approved).*
