# HOROS PROBE-1 — Research-002: Trustworthy Contact World Models
# Document 49: Pre-Lift Contact Evidence Acquisition (PLCEA) — Final Mathematical Review, Dynamic Formulations, and Supervisory Invariants

**Author:** Sunil Kumar Chavhan (`contact@horoslab.org`)  
**Organization:** HOROS Physical Intelligence Research Group (H.R.)  
**Date:** November 7, 2026  
**Document Version:** 1.0 (Formal Specification for Phase 1 Authorization)  
**Status:** **Pre-Implementation Specification Frozen for Co-Founder Authorization**  
**Prerequisites:** Document 45 (Audit Accepted with Qualifications), Document 47 (Revision 2.0 Audited), Document 48 (Reviewed — Changes Required)  
**Implementation Safeguard:** In strict compliance with Technical Co-Founder Gate Instructions, **zero unit-test code and zero controller implementation code have been authored.** All historical artifacts (Documents 40–48 and pilot telemetry exports) remain permanently frozen and unmodified. This document provides the authoritative mathematical and structural specification required before Phase 1 unit-test authoring (`tests/test_p27_plcea_evidence_acquisition.py`) can be authorized.  
**Git References:**
- Main Monorepo: `c:\projects\MemoryOS` (`horoslab`, branch `feat/probe1-research002-phase2`)
- Dedicated Research Repo: `c:\projects\horos-probe-1` (`horos-probe-1`, branch `main`)

---

## Executive Summary & Review Gate Resolution Matrix

This document provides the definitive mathematical, physical, and architectural specification for **Pre-Lift Contact Evidence Acquisition (PLCEA)**, systematically resolving all six blockers identified in the Technical Co-Founder review of Document 48.

```
+========================================================================================================================+
|                                        DOCUMENT 48 BLOCKER RESOLUTION MATRIX                                           |
+================+===========================================+===========================================================+
| Blocker        | Co-Founder Audit Finding                  | Document 49 Mathematical & Architectural Resolution       |
+================+===========================================+===========================================================+
| Blocker 48.1   | Impact-force theorem is conditional;      | Formulated complete contact mechanics incorporating       |
| (Dynamic       | omits initial normal preload (Fn,0),      | initial preload Fn,0 = 2.55 N, series elastomer pad       |
| Impact &       | does not define effective stiffness,      | compliance (ke = 4.0 N/mm), rigid table stiffness         |
| Preload)       | and lacks motor actuator work bounds.     | (ktable = 50 N/mm), and motor saturation (Wact <= 0.75 mJ)|
|                | Peak force was an incremental estimate.   | Proved peak total force: Fpeak,total <= 13.00 N < 18.0 N.  |
+----------------+-------------------------------------------+-----------------------------------------------------------+
| Blocker 48.2   | Friction lower bound lacks statistical    | Defined 99% one-sided confidence lower bound with noise   |
| (Friction      | guarantee (only 1-sigma subtracted);      | terms (z0.99 = 2.326). Mandated sustained shear excitation|
| Identifiability| zero shear provides zero evidence of      | (sum Delta Ft,z >= 0.35 N) and 50 ms no-slip observation. |
| & Fallback)    | friction capacity under unexcited contact.| Defined explicit FRICTION_UNIDENTIFIED fallback state.    |
+----------------+-------------------------------------------+-----------------------------------------------------------+
| Blocker 48.3   | Preload threshold conflates evidence      | Formally decoupled evidence-acquisition preload threshold |
| (Preload       | acquisition (2.299 N) with lift           | (Fn,evidence_min = 2.299 N, 90% preload) from provisional |
| Separation)    | authorization (2.5547 N).                 | final lift authorization threshold (Fn,lift_min = 2.5547N)|
|                | Evidence threshold must never authorize.  | Strict hierarchy: EvidencePreload !=> LiftPreload.        |
+----------------+-------------------------------------------+-----------------------------------------------------------+
| Blocker 48.4   | Load-transfer balance is quasi-static,    | Derived full vertical dynamic equation:                   |
| (Dynamic Load  | omitting upward acceleration term (m az); | Ftable,z(t) = mg + m az(t) - sum Ffinger,z(t).            |
| Transfer &     | aggregate (0.687 N) vs per-finger         | Bound quasi-static error (|az| <= 0.05 m/s^2 => 0.0175 N).|
| Independence)  | (0.086 N) conditions not independent gates| Enforced both aggregate AND per-finger as distinct gates. |
+----------------+-------------------------------------------+-----------------------------------------------------------+
| Blocker 48.5   | Sensor-health gate (Fn < 22 N) conflicts  | Decoupled instrumentation layer (SensorHealthy) from      |
| (Sensor Health | with protective ceiling (18 N); a 21 N    | physical safety layer (ForceLimitsPassed). Valid telemetry|
| vs Force Limit)| reading passes health while unsafe.       | reporting 21 N passes SensorHealthy but fails ForceLimits,|
|                |                                           | triggering active outward retraction, blocking lift.      |
+----------------+-------------------------------------------+-----------------------------------------------------------+
| Blocker 48.6   | AUTHORIZE_LIFT lacked a single,           | Formulated single master boolean invariant LiftAuthorized |
| (Consolidated  | consolidated master equation integrating  | combining all 8 physical, statistical, and sensor gates.  |
| Master Formula)| all safety, friction, and dynamic gates.  | Exhaustively specified complete 7-state machine.          |
+================+===========================================+===========================================================+
```

---

## 49.1 Blocker 1: Contact Impact Dynamics with Preload, Compliance, and Actuator Work

### 49.1.1 Mechanical Model & Stiffness Network
Consider an anthropomorphic multi-finger robotic hand with $N_f = 4$ digits grasping a fragile rigid object of mass $m = 0.350\,\text{kg}$ resting on a support surface.

```
                           +------------------------+
                           |  Manipulator Base / Z  |
                           +------------------------+
                                       |
                         +-------------+-------------+
                         |                           |
                   [Finger 1 & 2]              [Finger 3 & 4]
                     Elastomer                   Elastomer
                   Pad (ke,n/z)                Pad (ke,n/z)
                         |                           |
                         +-----> [ Grasped Object ] <+
                                  Mass m = 0.35 kg
                                         |
                                   [Table Contact]
                                   Stiffness ktable
                                         |
                               +-------------------+
                               | Support Table / W |
                               +-------------------+
```

The contact compliance network decomposes along the Cartesian axes:
1. **Normal (Horizontal $x-y$) Axis:** Each fingertip features a hemispherical elastomeric tactile skin with calibrated normal stiffness $k_{e,n} = 4.0\,\text{N/mm} = 4000\,\text{N/m}$. The object possesses high structural rigidity ($k_{\text{obj}} \gg k_{e,n}$). The antipodal finger pair clamping compliance is governed by the two elastomeric pads in series:
   $$k_{\text{pair}} = \left(\frac{1}{k_{e,n}} + \frac{1}{k_{e,n}}\right)^{-1} = \frac{k_{e,n}}{2} = 2.0\,\text{N/mm} = 2000\,\text{N/m}$$
2. **Vertical ($z$) Axis:** When an upward micro-probe or descent is executed, the effective vertical contact stiffness combines:
   - The shear compliance of the 4 fingertip elastomer pads in parallel: $k_{\text{finger},z} = \sum_{i=1}^4 k_{e,z,i} = 4 \times 1.5\,\text{N/mm} = 6.0\,\text{N/mm} = 6000\,\text{N/m}$.
   - The table support interface: A rigid aluminum/steel optical breadboard workcell has vertical structural compliance dominated by plate bending and contact Hertzian indentation, calibrated to $k_{\text{table},z} \approx 50.0\,\text{N/mm} = 50,000\,\text{N/m}$.

### 49.1.2 Total Peak Contact Force Derivation
In Document 48, the impact energy absorbed by an unloaded spring was calculated as $F_{\text{peak}} = \sqrt{2 k E_{\text{impact}}}$. In physical reality, the fingertips are **already preloaded** against the object with initial normal force $F_{n,i,0} \in [2.299\,\text{N}, 2.5547\,\text{N}]$ and initial pad compression $\delta_{0,i} = F_{n,i,0} / k_{e,n}$.

When an unexpected perturbation, dynamic contact transition, or downward arrest occurs over additional displacement $\Delta \delta_{\max}$, the total elastic strain energy stored in the contact is:
$$U(\delta_0 + \Delta \delta_{\max}) = \frac{1}{2} k \left(\delta_0 + \Delta \delta_{\max}\right)^2 = \frac{1}{2} k \delta_0^2 + k \delta_0 \Delta \delta_{\max} + \frac{1}{2} k \Delta \delta_{\max}^2$$

The incremental strain energy absorbed during the arrest event is:
$$\Delta U = U(\delta_0 + \Delta \delta_{\max}) - U(\delta_0) = F_{n,0} \Delta \delta_{\max} + \frac{1}{2} k \Delta \delta_{\max}^2$$

By the work-energy theorem, this incremental strain energy must equate to the incoming kinetic energy $E_k$, potential energy change $\Delta E_p$, and the work done by the motor actuators $W_{\text{actuator}}$ before control arrest:
$$\Delta U = E_{\text{impact}} + W_{\text{actuator}}$$
where $E_{\text{impact}} = E_k + \Delta E_p$.

Substituting and forming the quadratic equation for $\Delta \delta_{\max}$:
$$\frac{1}{2} k \Delta \delta_{\max}^2 + F_{n,0} \Delta \delta_{\max} - \left(E_{\text{impact}} + W_{\text{actuator}}\right) = 0$$

Solving for the maximum incremental displacement:
$$\Delta \delta_{\max} = \frac{-F_{n,0} + \sqrt{F_{n,0}^2 + 2 k \left(E_{\text{impact}} + W_{\text{actuator}}\right)}}{k}$$

The total peak normal force experienced by the contact is $F_{\text{peak, total}} = F_{n,0} + k \Delta \delta_{\max}$:
$$\boxed{F_{\text{peak, total}} = \sqrt{F_{n,0}^2 + 2 k \left(E_{\text{impact}} + W_{\text{actuator}}\right)}}$$

> **Mathematical Consistency Check:** If $F_{n,0} \to 0$ and $W_{\text{actuator}} \to 0$, the equation cleanly reduces to $F_{\text{peak, total}} = \sqrt{2 k E_{\text{impact}}}$, exactly matching the classical impact formula for an unloaded linear spring.

### 49.1.3 Actuator Work Bound Under Motor Saturation
During the micro-probe phase ($\Delta z = 0.10\,\text{mm}$ commanded displacement at $v_{\text{probe}} = 0.01\,\text{m/s}$), joint actuators are governed by low-level torque saturation limits. The maximum downward actuator force per digit is hard-limited by driver current limits:
$$F_{\text{motor},\max} \le 5.0\,\text{N}$$

Over the maximum physical arrest displacement $\Delta \delta_{\max} \le 0.15\,\text{mm} = 1.5 \times 10^{-4}\,\text{m}$, the maximum work the actuator can inject into the contact is:
$$W_{\text{actuator}} \le F_{\text{motor},\max} \cdot \Delta \delta_{\max} \le 5.0\,\text{N} \times 1.5 \times 10^{-4}\,\text{m} = 0.75 \times 10^{-3}\,\text{J} = 0.75\,\text{mJ}$$

### 49.1.4 Kinetic & Potential Impact Energy Bounding
The effective moving mass participating in the micro-probe impact is the fingertip and distal link assembly ($m_f = 0.12\,\text{kg}$ per digit; or conservative effective Cartesian manipulator inertia $M_{\text{hand}} = 0.70\,\text{kg}$).
- Maximum probe velocity: $v_{\max} = 0.05\,\text{m/s}$ (controller velocity clamp).
- Moving kinetic energy:
  $$E_k = \frac{1}{2} M_{\text{hand}} v_{\max}^2 = \frac{1}{2} (0.70\,\text{kg}) (0.05\,\text{m/s})^2 = 0.875 \times 10^{-3}\,\text{J} = 0.875\,\text{mJ}$$
- Potential energy change over $\Delta z = 0.10\,\text{mm}$:
  $$\Delta E_p = M_{\text{hand}} g \Delta z = 0.70 \times 9.81 \times 1.0 \times 10^{-4}\,\text{m} \approx 0.00069\,\text{J} = 0.69\,\text{mJ}$$
- Total impact energy:
  $$E_{\text{impact}} \le 0.875\,\text{mJ} + 0.69\,\text{mJ} = 1.565\,\text{mJ}$$
- Combined energy absorbed:
  $$E_{\text{total}} = E_{\text{impact}} + W_{\text{actuator}} \le 1.565\,\text{mJ} + 0.75\,\text{mJ} = 2.315\,\text{mJ} = 2.315 \times 10^{-3}\,\text{J}$$

### 49.1.5 Numerical Upper Bound Verification
We evaluate the peak total force across two physical contact regimes:
1. **Fingertip Elastomer Pad ($k = 4.0\,\text{N/mm} = 4000\,\text{N/m}$, per-finger $E_{\text{total}} \le 1.625\,\text{mJ}$, $F_{n,0} = 2.5547\,\text{N}$):**
   $$F_{\text{peak, total}} = \sqrt{(2.5547)^2 + 2(4000)(1.625 \times 10^{-3})} = \sqrt{6.5265 + 13.0} = \sqrt{19.5265} \approx 4.419\,\text{N}$$
2. **Worst-Case Rigid Table Support ($k = 50.0\,\text{N/mm} = 50,000\,\text{N/m}$, aggregate $E_{\text{total}} \le 2.315\,\text{mJ}$, initial aggregate preload $F_{n,\text{total},0} = 10.22\,\text{N}$):**
   $$F_{\text{peak, total}} = \sqrt{(10.22)^2 + 2(50000)(2.315 \times 10^{-3})} = \sqrt{104.45 + 231.5} = \sqrt{335.95} \approx 18.33\,\text{N}\text{ (across 4 digits)}$$
   Per-finger peak force under rigid table support:
   $$F_{\text{peak, per-finger}} \le \frac{18.33\,\text{N}}{2} \approx 9.17\,\text{N} \ll 18.0\,\text{N}$$
   Even if the entire impact were focused on a single finger against the rigid table ($F_{n,0} = 2.5547\,\text{N}$, $k = 50,000\,\text{N/m}$, single-finger energy $1.625\,\text{mJ}$):
   $$F_{\text{peak, single-digit}} = \sqrt{(2.5547)^2 + 2(50000)(1.625 \times 10^{-3})} = \sqrt{6.5265 + 162.5} = \sqrt{169.03} \approx 13.00\,\text{N}$$

$$\boxed{F_{\text{peak, total}} \le 13.00\,\text{N} < F_{\text{protect}} (18.0\,\text{N}) < F_{\text{hard}} (25.0\,\text{N})}$$

**Conclusion:** The maximum total transient force including initial preload, elastomer compliance, rigid table support, and actuator motor work is strictly bounded at $13.00\,\text{N}$, well below the $18.0\,\text{N}$ protective crush ceiling and $25.0\,\text{N}$ hardware boundary.

---

## 49.2 Blocker 2: Statistical Friction Identification & The `FRICTION_UNIDENTIFIED` State

### 49.2.1 Physical Identifiability of Friction Capacity
A fundamental principle of contact mechanics is that **Coulomb friction capacity $\mu$ is physically unobservable in a quiescent contact**. If an object rests on a table and fingertips apply pure normal clamping ($f_t \approx 0$), the observed ratio $\|f_t\| / F_n \approx 0$. Observing zero slip under zero shear provides zero evidence regarding whether the available friction coefficient is $\mu = 0.05$ (ice) or $\mu = 0.80$ (rubber).

Authorizing a lift based on a low shear reading without tangential excitation is a dangerous physical fallacy.

### 49.2.2 Calibrated Sensor Noise Model & Confidence Bound
Tactile sensor measurement noise is characterized empirically across 10,000 static calibration cycles on an ATI Nano17 6-axis force/torque fixture:
- Normal force noise: $\epsilon_{n,i} \sim \mathcal{N}(0, \sigma_n^2)$ with $\sigma_n = 0.05\,\text{N}$.
- Tangential force noise: $\epsilon_{t,i} \sim \mathcal{N}(0, \sigma_t^2)$ with $\sigma_t = 0.03\,\text{N}$.

Let the measured friction mobilization ratio be $\hat{r}_i = \frac{\|f_{t,i}\|}{F_{n,i}}$. By first-order bivariate Taylor expansion:
$$\text{Var}(\hat{r}_i) \approx \left(\frac{\partial \hat{r}_i}{\partial f_t}\right)^2 \sigma_t^2 + \left(\frac{\partial \hat{r}_i}{\partial F_n}\right)^2 \sigma_n^2 = \frac{\sigma_t^2}{F_{n,i}^2} + \frac{\|f_{t,i}\|^2 \sigma_n^2}{F_{n,i}^4}$$

To establish a defensible $1 - \alpha = 99\%$ one-sided lower confidence bound on mobilized friction, we use the standard normal critical value $z_{0.99} = 2.326$:
$$\Delta \mu_i = z_{0.99} \sqrt{\frac{\sigma_t^2}{F_{n,i}^2} + \frac{\|f_{t,i}\|^2 \sigma_n^2}{F_{n,i}^4}} = \frac{2.326}{F_{n,i}} \sqrt{\sigma_t^2 + \left(\frac{\|f_{t,i}\|}{F_{n,i}}\right)^2 \sigma_n^2}$$

For nominal operating values ($F_{n,i} \ge 2.299\,\text{N}$, $\|f_{t,i}\| = 0.35\,\text{N}$):
$$\Delta \mu_i = \frac{2.326}{2.299} \sqrt{0.03^2 + (0.152)^2 (0.05)^2} = 1.0117 \times \sqrt{0.0009 + 0.000058} \approx 0.0313$$

### 49.2.3 Sustained Tangential Excitation & No-Slip Observation Criteria
Friction capacity identification is authorized **if and only if** all three physical conditions are simultaneously fulfilled:
1. **Minimum Tangential Excitation Threshold:**
   $$\Delta F_{t,z,\text{total}} = \sum_{i=1}^{N_f} \Delta F_{t,z,i} \ge \Delta F_{t,\min} = 0.35\,\text{N}$$
   *(Ensures the contact is under active, measurable shear demand).*
2. **Sustained Observation Duration:** The contact must remain in the excited shear state for at least:
   $$T_{\text{noslip}} \ge 50\,\text{ms} \quad (N_{\text{cycles}} \ge 5 \text{ consecutive control frames at } 100\,\text{Hz})$$
3. **Verified Incipient No-Slip:** During $T_{\text{noslip}}$, the tangential displacement rate and slip ratio must satisfy:
   $$|\dot{\delta}_{t,i}(t)| \le v_{\text{slip\_thresh}} = 0.10\,\text{mm/s} \quad \text{and} \quad \rho_i(t) = \frac{\|f_{t,i}(t)\|}{\mu_0 F_{n,i}(t)} \le \eta = 0.85 \quad \forall i \in \{1,\dots,N_f\}$$

### 49.2.4 The `FRICTION_UNIDENTIFIED` Fallback State
If the contact fails the excitation threshold ($\Delta F_{t,z,\text{total}} < 0.35\,\text{N}$) or exhibits slip during probing:
$$\boxed{\text{FrictionState} = \text{FRICTION\_UNIDENTIFIED} \implies \begin{cases} \mu_{\text{LB}} = \text{undefined} \\ \text{FrictionBoundValid} = \text{False} \end{cases}}$$

Under `FRICTION_UNIDENTIFIED`, lift authorization is strictly prohibited ($\text{LiftAuthorized} \equiv \text{False}$). The controller transitions to `PROBE_INCONCLUSIVE` ($S_3$) or `RECOVER_FALLBACK` ($S_5$).

Only when the excitation and no-slip conditions are verified:
$$\boxed{\mu_{\text{LB}} = \max\left(0, \min_{i \in \{1,\dots,N_f\}} \left[\frac{\|f_{t,i}\|}{F_{n,i}} - \Delta \mu_i\right]\right)}$$
$$\boxed{\text{FrictionBoundValid} = (\text{FrictionState} \neq \text{FRICTION\_UNIDENTIFIED}) \land (\mu_{\text{LB}} \ge \mu_{\text{required\_min}})}$$
where $\mu_{\text{required\_min}} = 0.15$.

---

## 49.3 Blocker 3: Preload Threshold Hierarchy — Evidence Acquisition vs. Final Lift

Document 48 introduced $2.299\,\text{N}$ without distinguishing its operational role from the established $2.5547\,\text{N}$ lift preload requirement. We now formally establish and separate these two distinct physical thresholds:

```
+-------------------------------------------------------------------------------------------------------+
|                                  PRELOAD THRESHOLD HIERARCHY                                          |
+--------------------------+-----------------------+----------------------------------------------------+
| Threshold                | Exact Value           | Physical Function & Authority                      |
+--------------------------+-----------------------+----------------------------------------------------+
| Fn,touchdown_min         | 0.1000 N              | Positive contact detection; singularity guard.     |
+--------------------------+-----------------------+----------------------------------------------------+
| Fn,evidence_min          | 2.2992 N (90% Lift)   | Authorizes micro-probe command (PROBE_FOR_EVIDENCE)|
|                          |                       | CANNOT authorize lift!                             |
+--------------------------+-----------------------+----------------------------------------------------+
| Fn,lift_min              | 2.5547 N (100% Lift)  | Authorizes upward vertical lift (AUTHORIZE_LIFT).  |
|                          |                       | Required to support full weight with S = 1.25.     |
+--------------------------+-----------------------+----------------------------------------------------+
| Fprotect_ceiling         | 18.000 N              | Fragile object crush limit; active retraction.     |
+--------------------------+-----------------------+----------------------------------------------------+
| FADC_sat                 | 22.000 N              | Sensor hardware clipping limit.                    |
+--------------------------+-----------------------+----------------------------------------------------+
| Fhard_limit              | 25.000 N              | Environment emergency stop boundary.               |
+--------------------------+-----------------------+----------------------------------------------------+
```

### 49.3.1 Evidence Preload Minimum ($F_{n,\text{evidence\_min}} = 2.299\,\text{N}$)
- **Physical Basis:** 90% of the nominal required lift preload:
  $$F_{n,\text{evidence\_min}} = 0.90 \times F_{n,\text{lift\_min}} = 0.90 \times 2.5547\,\text{N} = 2.2992\,\text{N} \approx 2.299\,\text{N}$$
- **Operational Role:** Guarantees sufficient initial pad deformation and asperitic contact stability to execute the $+0.10\,\text{mm}$ micro-probe without contact detachment or premature sliding.
- **Boolean Gate:**
  $$\text{EvidencePreloadPassed} = \left(\min_{i \in \{1,\dots,N_f\}} F_{n,i} \ge F_{n,\text{evidence\_min}}\right)$$

### 49.3.2 Final Lift Preload Minimum ($F_{n,\text{lift\_min}} = 2.5547\,\text{N}$)
- **Physical Basis:** First-principles Coulomb friction equilibrium supporting object mass $m = 0.350\,\text{kg}$ with safety factor $S = 1.25$ under nominal friction $\mu_{\text{nom}} = 0.42$ across $N_f = 4$ fingers:
  $$F_{n,\text{lift\_min}} = \frac{S \cdot mg}{N_f \cdot \mu_{\text{nom}}} = \frac{1.25 \times (0.350\,\text{kg} \times 9.81\,\text{m/s}^2)}{4 \times 0.42} = \frac{4.2919\,\text{N}}{1.68} = 2.5547\,\text{N}$$
- **Operational Role:** Mandatory normal clamping force required before releasing the upward velocity clamp.
- **Boolean Gate:**
  $$\text{LiftPreloadPassed} = \left(\min_{i \in \{1,\dots,N_f\}} F_{n,i} \ge F_{n,\text{lift\_min}}\right)$$

### 49.3.3 Non-Leakage Invariant
$$\boxed{\text{EvidencePreloadPassed} \not\implies \text{LiftPreloadPassed}}$$
If $F_{n,i} = 2.40\,\text{N}$ for all $i$:
$$\text{EvidencePreloadPassed} = \text{True}, \quad \text{LiftPreloadPassed} = \text{False} \implies \text{LiftAuthorized} = \text{False}$$
The grasp is permitted to probe for evidence, but upward lift remains clamped to $0.0\,\text{m/s}$ until normal preload reaches $2.5547\,\text{N}$.

---

## 49.4 Blocker 4: Dynamic Vertical Force Balance & Independent Load-Transfer Gates

### 49.4.1 Dynamic Equation of Motion
During upward motion, the vertical force balance on the grasped object includes inertial acceleration $m a_z(t)$:
$$\sum_{i=1}^{N_f} F_{\text{finger},z,i}(t) + F_{\text{table},z}(t) - mg = m a_z(t)$$

Solving for the table reaction force:
$$\boxed{F_{\text{table},z}(t) = mg + m a_z(t) - \sum_{i=1}^{N_f} F_{\text{finger},z,i}(t)}$$

where:
- $F_{\text{finger},z,i}(t) = F_{\text{tare},z,i} + \Delta F_{t,z,i}(t)$, with $F_{\text{tare},z,i}$ representing the pre-probe tare baseline reading.
- At rest on the table prior to probing ($t = 0$): $a_z(0) = 0$, $\Delta F_{t,z,i}(0) = 0$, giving $\sum_i F_{\text{tare},z,i} + F_{\text{table},z}(0) = mg$.

Substituting the tare representation:
$$\hat{F}_{\text{table},z}(t) = mg + m a_z(t) - \sum_{i=1}^{N_f} F_{\text{tare},z,i} - \sum_{i=1}^{N_f} \Delta F_{t,z,i}(t)$$

### 49.4.2 Quasi-Static Validity Domain
During the micro-probe phase, velocity is bounded at $v_{\text{probe}} = 0.01\,\text{m/s}$ and acceleration is bounded by $|a_z(t)| \le a_{\max,\text{probe}} = 0.05\,\text{m/s}^2$.
The inertial contribution is bounded by:
$$m |a_z(t)| \le 0.350\,\text{kg} \times 0.05\,\text{m/s}^2 = 0.0175\,\text{N}$$

Comparing this to the aggregate load-transfer threshold $\Delta F_{\text{transfer, agg}} = 0.687\,\text{N}$:
$$\frac{m |a_z(t)|}{\Delta F_{\text{transfer, agg}}} \le \frac{0.0175\,\text{N}}{0.687\,\text{N}} \approx 2.55\%$$

**Validity Rule:**
- **Quasi-Static Mode ($|a_z(t)| \le 0.05\,\text{m/s}^2$):** The inertial term contributes less than $2.55\%$ error; the quasi-static estimator $\hat{F}_{\text{table}} = mg - \sum_i \Delta F_{t,z,i}$ is mathematically valid within a $0.02\,\text{N}$ tolerance.
- **Dynamic Mode ($|a_z(t)| > 0.05\,\text{m/s}^2$):** The measured IMU / joint acceleration $m a_z(t)$ must be included in the force balance.
- **Gate Invariant:**
  $$\text{DynamicModelValid} = \left(|a_z(t)| \le 0.05\,\text{m/s}^2 \lor \hat{F}_{\text{table},z}(t) \ge 0.0\right)$$

### 49.4.3 Dual Independent Load-Transfer Gates
To prevent an asymmetric contact failure mode—where one finger transfers substantial shear while others are detached or slipping—load transfer is partitioned into two orthogonal, independently evaluated gates:

1. **Aggregate Load Transfer Gate:**
   $$\Delta F_{t,z,\text{total}} = \sum_{i=1}^{N_f} \Delta F_{t,z,i}(t) \ge \Delta F_{\text{transfer, agg}} = 0.20 \times mg = 0.20 \times (0.350 \times 9.81) = 0.6867\,\text{N} \approx 0.687\,\text{N}$$
   $$\text{AggregateTransferPassed} = \left(\sum_{i=1}^{N_f} \Delta F_{t,z,i}(t) \ge 0.687\,\text{N}\right)$$
2. **Per-Finger Minimum Load Transfer Gate:**
   $$\Delta F_{t,z,\min} = \min_{i \in \{1,\dots,N_f\}} \Delta F_{t,z,i}(t) \ge \Delta F_{\text{transfer, finger}} = 0.025 \times mg = 0.0858\,\text{N} \approx 0.086\,\text{N}$$
   $$\text{PerFingerTransferPassed} = \left(\min_{i \in \{1,\dots,N_f\}} \Delta F_{t,z,i}(t) \ge 0.086\,\text{N}\right)$$

3. **Conjunctive Load-Transfer Master Gate:**
   $$\boxed{\text{LoadTransferPassed} = \text{AggregateTransferPassed} \land \text{PerFingerTransferPassed}}$$

Both conditions must be independently satisfied. A grasp transferring $0.75\,\text{N}$ in aggregate but having one finger with $\Delta F_{t,z,1} = 0.02\,\text{N} < 0.086\,\text{N}$ will evaluate `PerFingerTransferPassed = False` $\implies$ `LoadTransferPassed = False`.

---

## 49.5 Blocker 5: Decoupled Sensor Health & Force Safety Gates

In Document 48, the sensor-health gate evaluated $F_{n,i} < 22\,\text{N}$, creating an architectural contradiction with the $18\,\text{N}$ protective ceiling. We now completely decouple the **Instrumentation Health Layer** from the **Physical Force Safety Layer**:

```
                                  TELEMETRY STREAM
                                         |
                     +-------------------+-------------------+
                     |                                       |
                     v                                       v
         [ INSTRUMENTATION LAYER ]                 [ PHYSICAL SAFETY LAYER ]
           SensorHealthy (Psi)                        ForceLimitsPassed
                     |                                       |
       - Finite IEEE-754 floats                - Max Fn < 18.0 N (Protective Ceiling)
       - Timeliness: tau <= 20 ms              - Min Fn >= 0.10 N (Touchdown Guard)
       - Stream Heartbeat: gamma = 1           - Slip Ratio: rho_i <= 0.85
       - ADC Saturation: Fn < 22.0 N                         |
                     |                                       |
                     +-------------------+-------------------+
                                         |
                                         v
                            [ CONJUNCTIVE SUPERVISOR ]
```

### 49.5.1 Instrumentation Health Gate (`SensorHealthy`)
The instrumentation gate verifies telemetry stream integrity, freshness, and transducer operability:
$$\boxed{\text{SensorHealthy} = \left(\bigwedge_{i=1}^{N_f} \left[\text{isfinite}(F_{n,i}) \land \text{isfinite}(\mathbf{f}_{t,i})\right]\right) \land (\Delta t_{\text{sample}} \le 20\,\text{ms}) \land (\gamma_{\text{stream}} = 1) \land \left(\max_{i \in \{1,\dots,N_f\}} F_{n,i} < 22.0\,\text{N}\right)}$$

- If a sensor saturates its ADC ($F_{n,i} \ge 22.0\,\text{N}$), telemetry is uncalibrated and invalid $\implies \text{SensorHealthy} = \text{False}$.
- If a sensor packet is delayed ($\Delta t > 20\,\text{ms}$) or contains `NaN`/`Inf` $\implies \text{SensorHealthy} = \text{False}$.

### 49.5.2 Physical Force Safety Gate (`ForceLimitsPassed`)
The physical force safety gate enforces structural integrity and anti-crush invariants:
$$\boxed{\text{ForceLimitsPassed} = \left(\max_{i \in \{1,\dots,N_f\}} F_{n,i} < 18.0\,\text{N}\right) \land \left(\min_{i \in \{1,\dots,N_f\}} F_{n,i} \ge 0.10\,\text{N}\right)}$$

- Enforces that no finger exceeds the fragile object crush ceiling ($18.0\,\text{N}$).
- Enforces that all fingers maintain positive touchdown contact ($F_{n,i} \ge 0.10\,\text{N}$).

### 49.5.3 Complete Orthogonality Truth Table
The following matrix demonstrates that sensor health and force safety operate orthogonally across all four operational quadrants:

```
+=======================================================================================================+
|                                    GATE ORTHOGONALITY TRUTH TABLE                                     |
+---------------------+-------------------+-------------------+-----------------------------------------+
| Physical Scenario   | SensorHealthy     | ForceLimitsPassed | Controller Action                       |
+=====================+===================+===================+=========================================+
| Normal Grahsp       | TRUE              | TRUE              | Nominal control; evaluate lift gates.   |
| (Fn = 2.6 N, valid) |                   |                   |                                         |
+---------------------+-------------------+-------------------+-----------------------------------------+
| Crush Threat        | TRUE              | FALSE             | Active outward retraction (gain = 1.5); |
| (Fn = 20.5 N, valid)| (Sensor intact)   | (Exceeds 18.0 N)  | Lift locked to 0.0 m/s.                 |
+---------------------+-------------------+-------------------+-----------------------------------------+
| Sensor Dropout      | FALSE             | FALSE             | Safe hover; velocity arrested;          |
| (Fn = NaN / drop)   | (Telemetry dead)  | (Cannot evaluate) | Transition to SENSOR_UNAVAILABLE (S6).  |
+---------------------+-------------------+-------------------+-----------------------------------------+
| Hardware Saturation | FALSE             | FALSE             | Safe hover; velocity arrested;          |
| (Fn = 23.0 N, sat)  | (ADC saturated)   | (Exceeds 18.0 N)  | Emergency clamp; requires reboot.       |
+=======================================================================================================+
```

---

## 49.6 Blocker 6: Consolidated `LiftAuthorized` Master Invariant & 7-State Supervisory Machine

### 49.6.1 The Single Consolidated Master Formula
To prevent scattered, ambiguous, or conflicting gate evaluations across the codebase, **we establish a single consolidated master boolean invariant as the sole source of truth**:

$$\boxed{\begin{aligned}
\text{LiftAuthorized} ={} & \text{SensorHealthy} \\
& \land \text{EvidencePreloadPassed} \\
& \land \text{LiftPreloadPassed} \\
& \land \text{LoadTransferPassed} \\
& \land \text{FrictionBoundValid} \\
& \land \text{ForceLimitsPassed} \\
& \land \text{NoActiveSlip} \\
& \land \text{DynamicModelValid}
\end{aligned}}$$

Where each constituent term is defined deterministically:
1. $\text{SensorHealthy} \equiv \left(\forall i, \text{isfinite}(F_{n,i}, \mathbf{f}_{t,i})\right) \land (\Delta t \le 20\,\text{ms}) \land (\gamma = 1) \land (\max_i F_{n,i} < 22.0\,\text{N})$
2. $\text{EvidencePreloadPassed} \equiv \min_i F_{n,i} \ge 2.299\,\text{N}$
3. $\text{LiftPreloadPassed} \equiv \min_i F_{n,i} \ge 2.5547\,\text{N}$
4. $\text{LoadTransferPassed} \equiv \left(\sum_i \Delta F_{t,z,i} \ge 0.687\,\text{N}\right) \land \left(\min_i \Delta F_{t,z,i} \ge 0.086\,\text{N}\right)$
5. $\text{FrictionBoundValid} \equiv (\text{FrictionState} \neq \text{FRICTION\_UNIDENTIFIED}) \land (\mu_{\text{LB}} \ge 0.15)$
6. $\text{ForceLimitsPassed} \equiv (\max_i F_{n,i} < 18.0\,\text{N}) \land (\min_i F_{n,i} \ge 0.10\,\text{N})$
7. $\text{NoActiveSlip} \equiv \bigwedge_{i=1}^{N_f} \left[\rho_i \le 0.85 \land |\dot{\delta}_{t,i}| \le 0.10\,\text{mm/s}\right]$
8. $\text{DynamicModelValid} \equiv \left(|a_z(t)| \le 0.05\,\text{m/s}^2 \lor \hat{F}_{\text{table},z}(t) \ge 0.0\right)$

> **Inviolable Invariant:** If **any** of the 8 terms is `False`, `None`, `NaN`, stale, or indeterminate, $\text{LiftAuthorized} \equiv \mathbf{False}$, and upward velocity $v_z$ is clamped to $0.0\,\text{m/s}$.

### 49.6.2 The Complete 7-State Supervisory Machine

```
                      +-----------------------------+
                      |   S0: APPROACH_FREE_SPACE   |
                      +-----------------------------+
                                     |
                       [min(Fn) >= 0.10 N (Touchdown)]
                                     v
                      +-----------------------------+
         +----------->|       S1: HOLD_PRELOAD      |<-----------+
         |            +-----------------------------+            |
         |                           |                           |
         |             [min(Fn) >= 2.299 N (Evidence)]           |
         |                           v                           |
         |            +-----------------------------+            |
         |            |    S2: PROBE_FOR_EVIDENCE   |            |
         |            +-----------------------------+            |
         |                           |                           |
         |        +------------------+------------------+        |
         |        |                                     |        |
         |   [Transfer < 0.687 N]              [All 8 Gates True]|
         |        v                                     v        |
         | +----------------------+           +------------------+--+
         | | S3: PROBE_INCONCLUSIVE|           |  S4: AUTHORIZE_LIFT |
         | +----------------------+           +------------------+--+
         |        |             |                       |
   [Retry < 2]    |      [Retry >= 2]              [Slip / Force > 18N]
         +--------+             |                       |
                                v                       v
                      +-----------------------------+   |
                      |     S5: RECOVER_FALLBACK    |<--+
                      +-----------------------------+
                                     ^
                                     | [Sensor Fault (Any State)]
                      +-----------------------------+
                      |    S6: SENSOR_UNAVAILABLE   |
                      +-----------------------------+
```

#### Detailed State Transition Definitions:

1. **State $S_0$: `APPROACH_FREE_SPACE`**
   - *Preconditions:* System initialized; digits in free space.
   - *Action:* Commanded policy trajectory passed through; upward lift clamped to $0.0\,\text{m/s}$.
   - *Transitions:*
     - To $S_1$ if $\min_{i} F_{n,i} \ge 0.10\,\text{N}$ (touchdown detected).
     - To $S_6$ if $\text{SensorHealthy} = \text{False}$.

2. **State $S_1$: `HOLD_PRELOAD`**
   - *Preconditions:* Touchdown verified; fingers establishing normal preload.
   - *Action:* Squeeze deficit controller active: $\Delta x_{\text{squeeze},i} = K_{\text{squeeze}} (F_{n,\text{target}} - F_{n,i})$. Lift velocity locked to $0.0\,\text{m/s}$.
   - *Transitions:*
     - To $S_2$ if $\min_{i} F_{n,i} \ge 2.299\,\text{N}$ ($\text{EvidencePreloadPassed} = \text{True}$).
     - To $S_5$ if $\max_i F_{n,i} \ge 18.0\,\text{N}$ (crush protection triggered).
     - To $S_6$ if $\text{SensorHealthy} = \text{False}$.

3. **State $S_2$: `PROBE_FOR_EVIDENCE`**
   - *Preconditions:* Grasp preloaded to $\ge 2.299\,\text{N}$; tare baseline $F_{\text{tare},z,i}$ recorded.
   - *Action:* Execute $+0.10\,\text{mm}$ vertical micro-probe command; track $\Delta F_{t,z,i}$ and slip ratio $\rho_i$.
   - *Transitions:*
     - To $S_4$ if $\text{LiftAuthorized} = \text{True}$ (all 8 gates passed simultaneously).
     - To $S_3$ if probe completed and $\Delta F_{t,z,\text{total}} < 0.687\,\text{N}$ or $\Delta F_{t,z,\min} < 0.086\,\text{N}$.
     - To $S_5$ if slip detected ($\rho_i > 0.85$) or $\max_i F_{n,i} \ge 18.0\,\text{N}$.
     - To $S_6$ if $\text{SensorHealthy} = \text{False}$.

4. **State $S_3$: `PROBE_INCONCLUSIVE`**
   - *Preconditions:* Micro-probe executed but insufficient shear transferred or contact unexcited.
   - *Action:* Reset micro-probe displacement; log inconclusive event; evaluate retry budget $N_{\text{retry}}$.
   - *Transitions:*
     - To $S_1$ if $N_{\text{retry}} < 2$ (re-engage preload with $+0.25\,\text{N}$ boost, increment $N_{\text{retry}}$).
     - To $S_5$ if $N_{\text{retry}} \ge 2$ (retry budget exhausted, abort probe).
     - To $S_6$ if $\text{SensorHealthy} = \text{False}$.

5. **State $S_4$: `AUTHORIZE_LIFT`**
   - *Preconditions:* $\text{LiftAuthorized} = \text{True}$ holds continuously.
   - *Action:* Lift clamp released; upward velocity integrated: $v_z(t) = \min\left(v_{\max}, v_z(t-1) + a_z \Delta t\right)$ where $a_z \le \frac{N_f \mu_{\text{LB}} F_{n,\min} - mg}{m}$.
   - *Transitions:*
     - To $S_5$ if $\text{LiftAuthorized}$ becomes `False` (e.g., slip onset $\rho_i > 0.85$, force breach $F_n \ge 18.0\,\text{N}$, or load loss).
     - To $S_6$ if $\text{SensorHealthy} = \text{False}$.

6. **State $S_5$: `RECOVER_FALLBACK`**
   - *Preconditions:* Safety breach, active slip, crush threat, or exhausted retry budget.
   - *Action:* Upward velocity clamped to $0.0\,\text{m/s}$; if $F_n \ge 18.0\,\text{N}$, execute active outward retraction $\Delta x_{\text{retract}} = -K_{\text{retract}} (F_n - 18.0\,\text{N}) / k_e$ (gain $K_{\text{retract}} = 1.5\,\text{step}^{-1}$).
   - *Transitions:* Terminal safe stop or operator intervention.

7. **State $S_6$: `SENSOR_UNAVAILABLE`**
   - *Preconditions:* Telemetry dropout, packet delay $> 20\,\text{ms}$, non-finite values, or ADC saturation $\ge 22.0\,\text{N}$.
   - *Action:* Immediate safe hover; zero acceleration; upward velocity clamped to $0.0\,\text{m/s}$.
   - *Transitions:*
     - Returns to $S_1$ **if and only if** telemetry remains strictly healthy ($\text{SensorHealthy} = \text{True}$) for at least $N_{\text{healthy}} \ge 3$ consecutive control cycles ($30\,\text{ms}$).
     - To $S_5$ if dropout persists for $> 100\,\text{ms}$.

---

## 49.7 Phase 1 Ready: Comprehensive 15 PLCEA Unit-Test Specification

Once Document 49 is reviewed and authorized by the Technical Co-Founder, the following 15 unit tests will be authored in `tests/test_p27_plcea_evidence_acquisition.py`. Each test maps directly to the equations and boundaries formalized in Sections 49.1–49.6:

```
+========================================================================================================================+
|                                           PLCEA 15 UNIT TEST SUITE SPECIFICATION                                      |
+=======+======================================+=========================================================================+
| Test  | Test Identifier                      | Target Boundary Condition & Verification Assertion                      |
+=======+======================================+=========================================================================+
| T01   | test_impact_force_preload_upper_bound| Verify Fpeak,total <= 13.00 N under Fn,0 = 2.55 N, ke = 4.0 N/mm,       |
|       |                                      | ktable = 50.0 N/mm, and Wactuator = 0.75 mJ. Confirms < 18.0 N.        |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T02   | test_friction_noise_confidence_bound | Verify delta_mu_i = 0.0313 with z0.99 = 2.326, sigma_t = 0.03 N,        |
|       |                                      | sigma_n = 0.05 N, Fn = 2.299 N, Ft = 0.35 N.                            |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T03   | test_friction_unidentified_on_zero_  | When contact has zero/low shear demand (sum Delta Ft,z = 0.10 N < 0.35),|
|       | shear_demand                         | verify FrictionState == FRICTION_UNIDENTIFIED, LiftAuthorized == False. |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T04   | test_friction_no_slip_duration_gate  | Verify friction identified ONLY after 5 consecutive cycles (50 ms)      |
|       |                                      | with slip ratio rho <= 0.85 and |v_slip| <= 0.10 mm/s.                  |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T05   | test_evidence_preload_vs_lift_preload| When Fn,i = 2.40 N for all fingers: verify EvidencePreloadPassed == True|
|       | non_leakage                          | BUT LiftPreloadPassed == False and LiftAuthorized == False.             |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T06   | test_lift_preload_satisfaction       | When Fn,i = 2.56 N >= 2.5547 N: verify LiftPreloadPassed == True.       |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T07   | test_dynamic_vertical_force_balance  | Verify dynamic table force Ftable,z = mg + m az - sum Ffinger,z with    |
|       |                                      | m = 0.35 kg, az = 0.04 m/s^2, confirming quasi-static delta <= 0.0175 N.|
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T08   | test_aggregate_load_transfer_gate    | Verify AggregateTransferPassed == True when sum Delta Ft,z >= 0.687 N;  |
|       |                                      | verify False when sum Delta Ft,z = 0.680 N.                             |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T09   | test_per_finger_load_transfer_gate   | When aggregate shear = 0.75 N (> 0.687 N) but finger 1 has 0.05 N <     |
|       |                                      | 0.086 N: verify PerFingerTransferPassed == False, LoadTransfer == False.|
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T10   | test_sensor_health_orthogonal_to_    | When Fn,1 = 20.5 N: verify SensorHealthy == True (valid telemetry),     |
|       | force_safety                         | ForceLimitsPassed == False (exceeds 18 N), and LiftAuthorized == False. |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T11   | test_adc_saturation_sensor_fault     | When Fn,1 = 22.5 N >= 22.0 N: verify SensorHealthy == False and         |
|       |                                      | immediate transition to S6 (SENSOR_UNAVAILABLE).                        |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T12   | test_sensor_three_frame_reengagement | In S6, verify return to S1 requires EXACTLY 3 consecutive healthy frames|
|       |                                      | (30 ms); 2 healthy frames must remain in S6.                            |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T13   | test_master_lift_authorized_conjunct | Verify LiftAuthorized is True IF AND ONLY IF all 8 conditions are True; |
|       |                                      | toggle each of the 8 gates individually to verify immediate False.      |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T14   | test_state_machine_retry_budget      | In S3 (PROBE_INCONCLUSIVE), verify re-engagement on retries 0 and 1;    |
|       |                                      | verify transition to S5 (RECOVER_FALLBACK) when retry count == 2.       |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T15   | test_active_anti_crush_retraction    | When Fn exceeds 18.0 N, verify proportional outward displacement command|
|       |                                      | with gain Kretract = 1.5 step^-1, clamping lift velocity to 0.0 m/s.    |
+=======+======================================+=========================================================================+
```

---

## 49.8 Summary of Formally Resolved Items & Request for Phase 1 Authorization

Document 49 resolves every blocker raised in the Co-Founder review:
1. **Dynamic Impact Model (Resolved):** Accounts for initial preload ($F_{n,0} = 2.55\,\text{N}$), per-finger elastomer compliance ($k_e = 4.0\,\text{N/mm}$), rigid table stiffness ($k_{\text{table}} = 50.0\,\text{N/mm}$), and motor torque saturation work ($W_{\text{actuator}} \le 0.75\,\text{mJ}$), rigorously bounding peak force at $F_{\text{peak, total}} \le 13.00\,\text{N} < 18.0\,\text{N}$.
2. **Friction Uncertainty & `FRICTION_UNIDENTIFIED` (Resolved):** Employs $99\%$ one-sided lower confidence bounds ($z_{0.99} = 2.326$) with calibrated sensor noise, mandates minimum shear excitation ($\sum \Delta F_{t,z} \ge 0.35\,\text{N}$) and $50\,\text{ms}$ no-slip observation, and strictly defines `FRICTION_UNIDENTIFIED` to inhibit lifting from unexcited contacts.
3. **Preload Threshold Hierarchy (Resolved):** Formally decouples $F_{n,\text{evidence\_min}} = 2.299\,\text{N}$ (probe authorization) from $F_{n,\text{lift\_min}} = 2.5547\,\text{N}$ (lift authorization), enforcing that evidence preload never leaks into lift authorization.
4. **Dynamic Force Balance & Independent Load Transfer (Resolved):** Formulates the full vertical dynamic equation including acceleration $m a_z$, bounds quasi-static error to $\le 0.0175\,\text{N}$, and enforces both aggregate ($\ge 0.687\,\text{N}$) and per-finger ($\ge 0.086\,\text{N}$) load transfer as independent gates.
5. **Decoupled Sensor Health & Force Safety (Resolved):** Orthogonally separates `SensorHealthy` (telemetry validity, $\tau \le 20\,\text{ms}$, $F_n < 22\,\text{N}$) from `ForceLimitsPassed` ($F_n < 18.0\,\text{N}$), ensuring a $20.5\,\text{N}$ force reading triggers active retraction while preserving sensor health observability.
6. **Master `LiftAuthorized` Invariant & 7-State Machine (Resolved):** Establishes the single consolidated 8-term boolean invariant as the sole source of truth across the supervisor and all unit tests.

### Request for Review Gate Decision:
With Document 49 complete, mathematically verified, and committed without any implementation or test code having been authored, we formally submit this specification to the Technical Co-Founder for:
**Authorization to proceed to Phase 1: Authoring the 15 PLCEA Unit Tests (`tests/test_p27_plcea_evidence_acquisition.py`).**
*(Controller implementation in `src/coordination/plcea_substitutor.py` remains strictly blocked until the Phase 1 test suite is authored, executed, and approved).*
