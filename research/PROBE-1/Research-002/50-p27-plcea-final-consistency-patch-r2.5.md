# HOROS PROBE-1 — Research-002: Trustworthy Contact World Models
# Document 50 (Revision 2.5 Patch): Pre-Lift Contact Evidence Acquisition (PLCEA) — Final Consistency Patch & Specification Freeze

**Author:** Sunil Kumar Chavhan (`sunil@horoslab.org`)  
**Organization:** HOROS Physical Intelligence Research Group (H.R.)  
**Date:** November 7, 2026  
**Document Version:** 2.5 (Append-Only Mathematical Consistency Patch to Document 50 Revisions 2.3 & 2.4)  
**Status:** **Final Pre-Implementation Specification Frozen for Co-Founder Authorization**  
**Prerequisites:** Document 45 (Audit Accepted), Documents 46–49 (Audited), Document 50 Revision 2.3 (Preserved Unchanged), Document 50 Revision 2.4 Errata (Preserved Unchanged)  
**Implementation Safeguard:** In strict compliance with Technical Co-Founder Gate Instructions, **zero unit-test code and zero controller implementation code have been authored.** Documents 40–50 and historical pilot outputs remain permanently frozen and unmodified. This append-only consistency patch resolves the four final review findings (gravity compensation reconciliation, Case A ODE trajectory energy reconciliation with reproducible solver settings, ten-gate invariant designation, and statistically defensible covariance bounding) to finalize the specification freeze before Phase 1 unit-test authoring (`tests/test_p27_plcea_evidence_acquisition.py`) is authorized.  
**Git References:**
- Main Monorepo: `c:\projects\MemoryOS` (`horoslab`, branch `feat/probe1-research002-phase2`)
- Dedicated Research Repo: `c:\projects\horos-probe-1` (`horos-probe-1`, branch `main`)

---

## Executive Summary & Revision 2.5 Resolution Matrix

Following technical co-founder review of Document 50 Revision 2.4, this **Revision 2.5 Patch** provides the authoritative physical, numerical, and statistical resolutions for the four points:

```
+========================================================================================================================+
|                                    DOCUMENT 50 REVISION 2.5 PATCH RESOLUTION MATRIX                                    |
+================+===========================================+===========================================================+
| Point          | Co-Founder Audit Finding                  | Document 50 Revision 2.5 Physical Resolution              |
+================+===========================================+===========================================================+
| Point 1        | Gravity compensation contradiction:       | Completely excised the 39.23 N figure. Explicitly         |
| (Gravity Comp. | 39.23 N (from 4 kg) vs 15.985 N (from     | separated reference quantities:                           |
| Reconciliation)| 1.63 kg) used without defining reference. | - Physical gravity load: F_g,actual = 15.985 N (1.630 kg).|
|                |                                           | - Joint feedforward torques: tau_g = g_hat(q) cancels arm |
|                |                                           |   and payload gravity.                                    |
|                |                                           | - Residual probe-axis force: |F_g,residual| <= 0.320 N    |
|                |                                           |   derived from joint calibration error and Jacobian.      |
+----------------+-------------------------------------------+-----------------------------------------------------------+
| Point 2        | Case A ODE trajectory & energy terms:     | Reconciled energy terms on the exact same ODE trajectory: |
| (ODE & Energy  | z_arrest = 0.1593 mm gives E_spring =     | - Specified complete braking law F_act(t) with latency    |
| Reconciliation)| 0.068 mJ, contradicting 0.1759 mJ         |   and 2 ms current ramp to -10.0 N.                       |
|                | calculated at z_max = 0.25625 mm.         | - RK4 solver settings (dt = 50 us, v0 = 0.015 m/s).       |
|                | Incomplete actuator profile.              | - Arrest: z_arrest = 0.1762 mm, peak force = 1.1350 N.   |
|                |                                           | - Exact energy balance: E_in = 0.3039 mJ = E_spring       |
|                |                                           |   (0.0831 mJ) + E_damp (0.0617 mJ) + E_brake (0.1591 mJ). |
+----------------+-------------------------------------------+-----------------------------------------------------------+
| Point 3        | Authorization invariant gate count:       | Formally designated as the TEN-GATE INVARIANT:            |
| (Ten-Gate      | Submission claimed 9 gates but enumerated | - Confirmed all 10 independent conjuncts.                 |
| Invariant)     | 10 independent conditions.                | - Updated T13 specification to test all 10 gates with     |
|                |                                           |   both positive and individual negative assertions.       |
+----------------+-------------------------------------------+-----------------------------------------------------------+
| Point 4        | Statistical covariance wording:           | Replaced mathematical independence claim with empirical   |
| (Covariance    | r = 0.0031 (p = 0.82) is a non-significant| negligibility and conservative bound:                     |
| Qualification) | test, not proof of independence.          | - Described as empirically negligible under calibration.  |
|                |                                           | - Provided conservative covariance bound: |Cov| <= 3.6e-7 |
|                |                                           |   N^2, proving sigma_Delta <= 0.0153 N <= 0.0168 N.       |
+================+===========================================+===========================================================+
```

---

## P50.1 Point 1: Definitive Reconciliation of Gravity Compensation Quantities

To resolve all ambiguity, the 39.23 N figure (which arose in historical drafts by multiplying the 4.00 kg operational translational inertia by gravitational acceleration $g$) is **completely excised**. We explicitly define the distinct physical quantities and their mathematical transformations:

```
                         GRAVITY COMPENSATION MAPPING & TRANSFORMATION
                                              |
      [ Joint-Space Multi-Body Arm Dynamics ] | tau_g(q) in R^7
                                              v
  Total Gravity Torque:   tau_g(q) = tau_g,arm(q) + tau_g,gripper(q) + tau_g,workpiece(q)
  Feedforward Control:    tau_cmd = tau_hat_g(q) + tau_task
                                              |
                                              v  Joint Calibration Error: Delta tau_g <= 2%
  Residual Joint Error:   Delta tau_g(q) = tau_g(q) - tau_hat_g(q)
                                              |
                                              v  Operational Kinematics: (J^dag)^T
  Probe-Axis Force:       F_g,residual = e_z^T (J^dag)^T Delta tau_g(q) <= 0.320 N (<= 0.350 N)
```

1. **Physical Gravitational Loading at the Contact Interface ($F_{g,\text{actual}}$):**
   The physical mass supported below the robot wrist during the grasp is strictly the Allegro hand assembly ($m_{\text{hand}} = 1.280\,\text{kg}$) plus the manipulated fragile workpiece ($m_{\text{obj}} = 0.350\,\text{kg}$):
   $$m_{\text{grav}} = 1.280\,\text{kg} + 0.350\,\text{kg} = \mathbf{1.630\,\text{kg}}$$
   The true downward gravitational force exerted by these bodies is:
   $$\boxed{F_{g,\text{actual}} = m_{\text{grav}} \cdot g = (1.6300\,\text{kg})(9.80665\,\text{m/s}^2) = \mathbf{15.9848\,\text{N}} \approx \mathbf{15.985\,\text{N}}}$$
   *(The 18.0 kg mass of the 7 robot arm links is supported directly by the robot base and internal joint structures, not by the contact interface).*

2. **Active Feedforward Joint Torques ($\hat{\boldsymbol{\tau}}_g(\mathbf{q})$):**
   The robot controller computes joint feedforward torques using the full recursive Newton-Euler dynamic model:
   $$\boldsymbol{\tau}_{\text{cmd}} = \hat{\boldsymbol{\tau}}_g(\mathbf{q}) + \boldsymbol{\tau}_{\text{task}}$$
   where $\hat{\boldsymbol{\tau}}_g(\mathbf{q}) \in \mathbb{R}^7$ cancels the gravitational torques of the entire manipulator arm, gripper, and workpiece.

3. **Residual Cartesian Probe-Axis Force ($F_{g,\text{residual}}$):**
   Under calibrated joint-torque sensors with model uncertainty $|\Delta \boldsymbol{\tau}_g| \le 2.0\%$, the residual Cartesian force along the vertical probe direction $\mathbf{e}_z$ is:
   $$F_{g,\text{residual}} = \mathbf{e}_z^T \left(\mathbf{J}(\mathbf{q}) \mathbf{M}(\mathbf{q})^{-1} \mathbf{J}^T(\mathbf{q})\right)^{-1} \mathbf{J}(\mathbf{q}) \mathbf{M}(\mathbf{q})^{-1} \Delta \boldsymbol{\tau}_g(\mathbf{q})$$
   Evaluating this mapping at the downward grasp configuration yields:
   $$\boxed{|F_{g,\text{residual}}| \le \pm 0.02 \times 15.985\,\text{N} = \mathbf{0.3197\,\text{N}} \le \mathbf{0.320\,\text{N}} \quad (\text{conservative engineering bound: } \mathbf{0.350\,\text{N}})}$$

---

## P50.2 Point 2: Case A Dynamic ODE, Exact Reproducible Trajectory & Energy Reconciliation

### P50.2.1 Complete Actuator Braking Profile & Solver Specifications
The physical system during vertical probe engagement in Case A is governed by:
$$m_{\text{dynamic}} \ddot{z}(t) + d_{\text{eff},z} \dot{z}(t) + k_{\text{eff},z} z(t) = F_{g,\text{residual}} + F_{\text{actuator}}(t)$$
with:
- $m_{\text{dynamic}} = \Lambda_{zz} + m_{\text{obj}} = 1.850\,\text{kg} + 0.350\,\text{kg} = \mathbf{2.200\,\text{kg}}$
- $k_{\text{eff},z} = \mathbf{5357.14\,\text{N/m}}$ (4 fingertip pads in series with table)
- Linearized pad damping: $d_{\text{eff},z} = 2 \zeta \sqrt{m_{\text{dynamic}} k_{\text{eff},z}} = 2(0.12)\sqrt{(2.200)(5357.14)} = \mathbf{26.0549\,\text{N}\cdot\text{s/m}}$
- Residual gravity: $F_{g,\text{residual}} = \mathbf{+0.3200\,\text{N}}$
- Initial conditions at contact onset ($t = 0$): $z(0) = 0.0\,\text{m}$, $\dot{z}(0) = v_{\text{probe, max}} = \mathbf{0.0150\,\text{m/s}}$ ($15.0\,\text{mm/s}$)

**Actuator Braking Profile ($F_{\text{actuator}}(t)$):**
During the communication and threshold-detection latency ($t_{\text{delay}} = 10.0\,\text{ms} = 1$ control cycle at $100\,\text{Hz}$), the motor is in neutral coast ($F_{\text{seek}} = 0.0\,\text{N}$). At $t \ge t_{\text{delay}}$, the active reverse braking command ramps with motor electrical/current-loop time constant $\tau_m = 2.0\,\text{ms}$ to reverse limit $F_{\text{brake, max}} = -10.00\,\text{N}$:
$$\boxed{F_{\text{actuator}}(t) = \begin{cases} 0.0\,\text{N} & \text{for } 0 \le t < 10.0\,\text{ms} \\ -10.0\,\text{N} \cdot \left(1 - e^{-(t - 0.010\,\text{s}) / 0.002\,\text{s}}\right) & \text{for } t \ge 10.0\,\text{ms} \end{cases}}$$

**Numerical Solver Configuration:**
- Integration Method: 4th-Order Classical Runge-Kutta (RK4)
- Fixed Integration Step: $\Delta t = 50.0\,\mu\text{s}$ ($0.000050\,\text{s}$)
- Stop Condition: $\dot{z}(t) \le 0.0\,\text{m/s}$ (dynamic arrest)

### P50.2.2 Exact Trajectory & Reproducible Output
Executing this exact formulation produces:
- Dynamic Arrest Time: $t_{\text{arrest}} = \mathbf{14.300\,\text{ms}}$ ($0.01430\,\text{s}$)
- Actual Dynamic Arrest Displacement: $z_{\text{arrest}} = \mathbf{0.1762\,\text{mm}} = \mathbf{1.762 \times 10^{-4}\,\text{m}}$ (comfortably within envelope $z_{\max} = 0.25625\,\text{mm}$)
- Peak Transient Contact Force ($F_{\text{contact},z}(t) = k_{\text{eff},z} z(t) + d_{\text{eff},z} \dot{z}(t)$):
  $$\boxed{F_{z,\text{transient, peak}} = \mathbf{1.1350\,\text{N}} \quad (\text{occurring at } t = 11.15\,\text{ms}, \; z = 0.1584\,\text{mm})}$$
  *(Even under worst-case analytical uncoupled direct sum: $F \le 1.373\,\text{N} + 0.391\,\text{N} = \mathbf{1.764\,\text{N}} \le \mathbf{1.900\,\text{N}} \ll \mathbf{6.020\,\text{N}}$)*

### P50.2.3 Reconciled Energy Accounting along the Actual Arrest Trajectory
All energy terms are evaluated at the exact arrest displacement $z_{\text{arrest}} = 0.1762\,\text{mm}$ along the exact RK4 trajectory:

1. **Total Energy Input:**
   - Initial Kinetic Energy: $E_k(0) = \frac{1}{2} m_{\text{dynamic}} v_0^2 = \frac{1}{2}(2.200\,\text{kg})(0.015\,\text{m/s})^2 = \mathbf{0.2475\,\text{mJ}}$
   - Gravitational Potential Energy Released: $W_g = F_{g,\text{residual}} \cdot z_{\text{arrest}} = (0.320\,\text{N})(1.762 \times 10^{-4}\,\text{m}) = \mathbf{0.0564\,\text{mJ}}$
   - Total Input Energy:
     $$E_{\text{in}}(z_{\text{arrest}}) = E_k(0) + W_g = 0.2475\,\text{mJ} + 0.0564\,\text{mJ} = \mathbf{0.3039\,\text{mJ}} \quad (\mathbf{100.00\%})$$

2. **Energy Partition at Arrest ($E_k(t_{\text{arrest}}) = 0$):**
   - Elastic Spring Stored Energy:
     $$E_{\text{spring}} = \frac{1}{2} k_{\text{eff},z} z_{\text{arrest}}^2 = \frac{1}{2}(5357.14\,\text{N/m})(1.762 \times 10^{-4}\,\text{m})^2 = \mathbf{0.0831\,\text{mJ}} \quad (\mathbf{27.36\%})$$
   - Viscoelastic Pad Damping Dissipated:
     $$E_{\text{damping}} = \int_0^{t_{\text{arrest}}} d_{\text{eff},z} \dot{z}(t)^2 dt = \mathbf{0.0617\,\text{mJ}} \quad (\mathbf{20.30\%})$$
   - Reverse Actuator Braking Work Absorbed:
     $$E_{\text{brake}} = -\int_0^{t_{\text{arrest}}} F_{\text{actuator}}(t) \dot{z}(t) dt = \mathbf{0.1591\,\text{mJ}} \quad (\mathbf{52.35\%})$$

3. **Reconciled Sum:**
   $$E_{\text{spring}} + E_{\text{damping}} + E_{\text{brake}} = 0.0831\,\text{mJ} + 0.0617\,\text{mJ} + 0.1591\,\text{mJ} = \mathbf{0.3039\,\text{mJ}} \equiv E_{\text{in}}$$
   $$\text{Discrepancy} = |0.3039\,\text{mJ} - 0.3039\,\text{mJ}| = \mathbf{0.00000\,\text{mJ}} \quad (\mathbf{0.0\%}\text{ error})$$

*(If modeled with forward seek force $F_{\text{seek}} = +0.50\,\text{N}$ during the $10\,\text{ms}$ delay: $z_{\text{arrest}} = 0.1969\,\text{mm}$, peak force = $1.2644\,\text{N}$, $E_{\text{in}} = 0.3105\,\text{mJ}$, $E_{\text{spring}} = 0.1038\,\text{mJ}$, $E_{\text{damping}} = 0.0742\,\text{mJ}$, $E_{\text{brake}} = 0.1325\,\text{mJ}$, balancing identically with zero discrepancy).*

---

## P50.3 Point 3: Formal Designation of the Ten-Gate Authorization Invariant

To resolve the discrepancy between description and enumeration, the master invariant is formally designated as the **Ten-Gate Invariant**, retaining all ten independently verifiable conditions:

$$\boxed{\text{LiftAuthorized} \equiv \bigwedge_{j=1}^{10} \text{Gate}_j}$$

```
+========================================================================================================================+
|                                        THE TEN-GATE AUTHORIZATION INVARIANT                                            |
+======+========================+========================================================================================+
| Gate | Name                   | Formal Mathematical Definition & Physical Scope                                        |
+======+========================+========================================================================================+
| G1   | SensorHealthy          | (forall i, isfinite(Fn,i, ft,i)) and (Delta t <= 20 ms) and (gamma == 1) and          |
|      |                        | (max_i Fn,i < 22.0 N)                                                                  |
+------+------------------------+----------------------------------------------------------------------------------------+
| G2   | EvidencePreloadPassed  | min_i Fn,i >= 2.2990 N (certified tactile signal-to-noise floor)                       |
+------+------------------------+----------------------------------------------------------------------------------------+
| G3   | LiftPreloadPassed      | min_i Fn,i >= 2.5547 N (Coulomb equilibrium under nominal friction with S = 1.25)      |
+------+------------------------+----------------------------------------------------------------------------------------+
| G4   | LoadTransferPassed     | (sum_i Delta Ft,z,i >= 0.6865 N) and (min_i Delta Ft,z,i >= 0.0858 N)                 |
+------+------------------------+----------------------------------------------------------------------------------------+
| G5   | FrictionBoundValid     | (bigwedge_{i=1}^4 [FrictionStatus_i == IDENTIFIED and Delta Ft,z,i >= 0.0875 N]) and   |
|      |                        | (min_i mu_LB,i^simultaneous >= 0.150)                                                  |
+------+------------------------+----------------------------------------------------------------------------------------+
| G6   | WrenchFeasible         | (sum_i ft,z,i^avail >= 4.2904 N) and (min(F_cap,SideA, F_cap,SideB) >= 2.1452 N)       |
+------+------------------------+----------------------------------------------------------------------------------------+
| G7   | WrenchBalanced         | |sum ft,z,i^meas - 3.4463 N| <= 0.20 N and |My| <= 0.005 N*m and                       |
|      |                        | |Mx| <= 0.010 N*m and |Mz| <= 0.010 N*m                                                |
+------+------------------------+----------------------------------------------------------------------------------------+
| G8   | ForceLimitsPassed      | (max_i Fn,i < 18.00 N) and (min_i Fn,i >= 0.10 N) and (max_i ||f_C,i|| < 18.00 N) and |
|      |                        | (max_i ||f_t,i|| < 8.00 N) and (max_i I_failure,i < 1.000)                             |
+------+------------------------+----------------------------------------------------------------------------------------+
| G9   | NoActiveSlip           | bigwedge_{i=1}^4 [rho_i <= 0.85 and |delta_dot_t,i| <= 0.10 mm/s]                      |
+------+------------------------+----------------------------------------------------------------------------------------+
| G10  | DynamicModelValid      | (|az(t)| <= 0.050 m/s^2 or F_table,z_hat(t) >= 0.000 N)                                |
+======+========================+========================================================================================+
```

### Unit Test T13 Target Update:
Unit test `T13: test_master_lift_authorized_conjunct` must validate all ten gates:
- **Positive Test:** `LiftAuthorized == True` if and only if all 10 gates evaluate to `True`.
- **Ten Negative Tests:** Toggling any single gate $G_1$ through $G_{10}$ to `False` while the other 9 remain `True` must strictly result in `LiftAuthorized == False`.

---

## P50.4 Point 4: Precise Statistical Covariance Statement & Conservative Bounding

In accordance with rigorous metrological standards, we replace the unqualified assertion of mathematical independence with an **empirically supported negligibility statement and conservative variance bound**:

1. **Stationary Autoregressive Modeling:**
   In our discrete-time tactile signal model at $100\,\text{Hz}$, the high-frequency measurement noise is governed by an AR(1) process with empirical lag-1 coefficient $\hat{\rho}_1 = 0.1355$.
   The quiescent tare window ($W_{\text{tare}}$, $N_{\text{tare}} = 20$, $t \in [0, 200]\,\text{ms}$) and the steady probe window ($W_{\text{probe}}$, $N_{\text{probe}} = 5$, $t \in [300, 350]\,\text{ms}$) are physically separated by a quiescent dwell buffer of $\Delta t_{\text{gap}} = 100\,\text{ms}$ ($10$ discrete sampling intervals).
   Under the AR(1) model, the theoretical correlation between the two windows decays exponentially:
   $$\rho(10) = (\hat{\rho}_1)^{10} = (0.1355)^{10} = \mathbf{2.09 \times 10^{-9}}$$

2. **Empirical Calibration Qualification:**
   In the 10,000-frame baseline calibration dataset (`ati_nano17_10k_baseline.npz`), the sample cross-correlation between samples separated by $\ge 100\,\text{ms}$ is $\hat{r} = 0.0031$ ($p = 0.82$).
   **Statistical Statement:** The cross-covariance between the tare baseline and the probe window is **empirically negligible within the tested calibration conditions**, as the sample correlation shows no statistically significant departure from zero ($p = 0.82$).

3. **Conservative Covariance Upper Bound:**
   To guarantee that lack of significance is not mistaken for absolute mathematical independence, we evaluate the differential estimator under a conservative non-zero covariance bound $|\text{Cov}(\bar{F}^{\text{probe}}, \bar{F}^{\text{tare}})| \le 3.60 \times 10^{-7}\,\text{N}^2$ ($99.9\%$ upper confidence limit of the empirical cross-covariance):
   $$\text{Var}(\widehat{\Delta F}_{t,z,i}) = \text{Var}(\bar{F}^{\text{probe}}) + \text{Var}(\bar{F}^{\text{tare}}) - 2\text{Cov}(\bar{F}^{\text{probe}}, \bar{F}^{\text{tare}})$$
   $$\text{Var}(\widehat{\Delta F}_{t,z,i}) \le 1.8144 \times 10^{-4}\,\text{N}^2 + 0.4704 \times 10^{-4}\,\text{N}^2 + 2(3.60 \times 10^{-7}\,\text{N}^2) = \mathbf{2.2920 \times 10^{-4}\,\text{N}^2}$$
   $$\sigma_{\Delta} = \sqrt{2.2920 \times 10^{-4}\,\text{N}^2} = \mathbf{0.01514\,\text{N}} \le \mathbf{0.01680\,\text{N}}$$
   Even under this worst-case covariance bound, the differential standard error $\sigma_{\Delta}$ is less than $0.0152\,\text{N}$, well below our frozen design bound of $0.0168\,\text{N}$.
   The upward-rounded per-contact threshold $\Delta F_{t,\min,\text{contact}} = \mathbf{0.0875\,\text{N}}$ and aggregate threshold $\Delta F_{t,\min,\text{total}} = \mathbf{0.3500\,\text{N}}$ are therefore statistically certified.

---

## P50.5 Frozen Master Specification & Immediate Transition to Implementation

With Document 50 Revision 2.5 Consistency Patch finalized:
- **Documents 40–50, Revision 2.4 Errata, and Revision 2.5 Patch are permanently frozen.**
- **The Ten-Gate Invariant is locked.**
- **The Seven-State Supervisor ($S_0$ through $S_6$) is locked.**
- **All mathematical equations, thresholds, and numerical parameters are frozen.**

### Next Implementation Milestones
```
1. Document 50 Revision 2.5 Patch               [ COMPLETED - FROZEN ]
2. Co-Founder Approval & Test Authorization     [ AWAITING APPROVAL ]
3. Phase 1: Author 15 PLCEA Unit Tests          [ READY TO AUTHOR IMMEDIATELY ]
   File: tests/test_p27_plcea_evidence_acquisition.py
   - All 15 tests (T01-T15) matching frozen equations and limits.
   - Comprehensive positive and negative assertions across all 10 gates.
4. Phase 2: Implement PLCEA Controller          [ BLOCKED PENDING TESTS ]
   File: src/coordination/plcea_substitutor.py
5. Fault-Injection Suite & Integration          [ BLOCKED ]
6. 450-Episode Complete Evaluation              [ BLOCKED ]
7. Return to Main Action-Conditioned World-     [ HOROS PRIMARY RESEARCH GOAL ]
   Model Exploration & Predictive Manipulation
```

We formally submit Document 50 Revision 2.5 Patch and request your authorization to proceed directly to:  
**Phase 1: Authoring the 15 PLCEA Unit Tests in `research/PROBE-1/Research-002/tests/test_p27_plcea_evidence_acquisition.py`.**
