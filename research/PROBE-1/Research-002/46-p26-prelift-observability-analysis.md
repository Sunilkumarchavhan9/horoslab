# HOROS PROBE-1 — Research-002: Trustworthy Contact World Models
# Document 46: Pre-Lift Observability & Contact Evidence Acquisition (PLCEA) Specification

**Author:** Sunil Kumar Chavhan (`contact@horoslab.org`)  
**Organization:** HOROS Physical Intelligence Research Group (H.R.)  
**Date:** November 7, 2026  
**Status:** Mathematical Specification Complete — Awaiting Co-Founder Review  
**Git References:**
- `horoslab`: `feat/probe1-research002-phase2`
- `horos-probe-1`: `main`

---

## 1. Executive Summary & Research Motivation

The Stage P2.6 Experiment 02 pilot exposed a fundamental scientific dichotomy in safe contact coordination:
- **Variant `E02_A` achieved $9/10$ ($90.0\%$) task success**, but did so by accepting unmeasured friction uncertainty during pre-lift resting contact.
- **Variant `E02_B` achieved $0/10$ ($0.0\%$) task success**, not because its safety principles were flawed, but because it lacked proactive normal preload compensation and faced a bootstrap observability paradox: **tangential shear cannot be measured until vertical load is transferred, but vertical motion cannot be authorized until shear is verified.**

This document provides:
1. A rigorous physical investigation of why `E02_A` succeeds and `E02_B` fails.
2. A formal mathematical specification of **Pre-Lift Contact Evidence Acquisition (PLCEA)**, introducing a controlled micro-probe mechanism that establishes empirical contact confidence before authorizing full-throttle lift.
3. Pre-registered failure modes, invariant theorems, and unit test specifications.

---

## 2. Investigation: Why E02-A Succeeds and E02-B Fails

### 2.1. Question 1: Does E02-A succeed because it obtains better contact or because it accepts more uncertainty?
**Finding:** E02-A succeeds by **accepting unverified uncertainty**, not by obtaining better contact information.

#### The Mathematical Mechanics of E02-A:
In `E02_A`, lift clamp release is governed by:
$$\text{Released} \iff \left(\min_{i} F_{n,i} \ge F_{n,\text{required}}\right) \land \left(\max_i \rho_i \le \eta\right)$$
When the robot is resting on the table with fingers indented:
1. Normal preload is established via the proactive squeeze controller: $F_{n,i} \ge 2.5547\text{ N}$.
2. The object remains supported by the table surface: $z_{\text{obj}} = 0.0\text{ mm}$.
3. The vertical load supported by the fingertips is identically zero: $\mathbf{f}_{t,i} = [0.0, 0.0]^\top\text{ N}$.
4. The computed regularized slip ratio is:
   $$\rho_i = \frac{\|\mathbf{f}_{t,i}\|}{\mu F_{n,i} + \epsilon_{\text{reg}}} = \frac{0.0}{\mu F_{n,i} + 10^{-6}} = 0.0$$
5. Because $0.0 \le \eta = 0.80$, `evaluate_clamp_release` evaluates to `True`.
6. Crucially, once released, E02-A bypasses the stateful physical velocity integrator and passes through the raw, unconstrained planner lift velocity:
   $$a_{\text{sub}}[4] = a_{\text{prop}}[4] \approx 0.85\text{--}1.00\text{ mm/step}$$

In simulation, where $\mu = 0.50$ is stationary and adequate, jumping from zero to full velocity succeeds. However, on a real physical robot where contact friction may be nonstationary or degraded ($\mu_{\text{true}} < 0.20$), jumping directly to full-speed lift without measuring the dynamic shear response risks immediate catastrophic slip. E02-A's high success rate reflects **permissive authorization under resting zero-shear**, not verified contact safety.

---

### 2.2. Question 2: Does E02-B fail because it cannot establish contact, or because its authorization rule is too restrictive?
**Finding:** E02-B fails primarily because of an **architectural coupling between unaugmented squeeze and asymmetric contact loss**, preventing it from generating the normal force required by its physical lift equation.

#### The Mathematical Mechanics of E02-B:
1. **Unaugmented Squeeze:** Document 40 specified E02-B with unaugmented squeeze ($a_{\text{sub}}[:4] = a_{\text{prop}}[:4]$), disabling the proportional deficit controller $K_p \cdot \Delta F_n / k_{\text{elastic}}$.
2. **Asymmetric Contact Fallback:** During approach, the moment any single finger contacted the cylinder ($F_n \ge 0.10\text{ N}$), the other 3 fingers were classified as asymmetric contact loss. Fallback held the contacted finger stationary ($a_{\text{sub}} = 0.0$) while uncontacted fingers crept at only $0.20\text{ mm/step}$.
3. **Horizon Exhaustion:** It required 22 control steps (out of 25) for all four fingers to finally establish contact.
4. **Insufficient Upward Acceleration:** When all 4 contacts were finally seated at step 23, the achieved normal force was only $F_{n,\min} \approx 1.31\text{ N}$.
5. Under Branch 1 physical integration:
   $$F_{t,\max} = N_f \cdot \eta \cdot \mu \cdot \min_i F_{n,i} = 4 \cdot 0.80 \cdot 0.50 \cdot 1.31 = 2.096\text{ N}$$
   Gravity load is $F_g = m \cdot g = 0.35 \cdot 9.81 = 3.4335\text{ N}$.
   The maximum physical acceleration is:
   $$a_{z,\max} = \frac{F_{t,\max} - F_g}{m} = \frac{2.096 - 3.4335}{0.35} = -3.82\text{ m/s}^2 \le 0.0$$
6. Because $a_{z,\max} \le 0$, the controller clamped $v_z = 0.0$ and $a_{\text{sub}}[4] = 0.0$.
7. E02-B never failed because the lift rule was "too strict"—it failed because without proactive squeeze, it never achieved the normal force necessary to lift the object against gravity!

---

### 2.3. Question 3: Can tactile deformation and proprioception provide useful evidence before lifting?
**Finding:** Yes. Pre-lift tactile deformation and joint proprioception provide three critical orthogonal observability signals:

1. **Compliant Normal Indentation Profile ($\boldsymbol{\delta}_n$):**
   Fingertip displacement $\delta_i = r_{\text{spawn}} - r_{\text{finger},i}$ relative to the contact surface measures elastomeric compression. Under Hunt-Crossley elastomeric contact:
   $$F_{n,i} = k_{\text{elastic}} \delta_i^n + \lambda \delta_i^n \dot{\delta}_i$$
   Verifying that $\delta_i > 0$ for all $i \in \{1, \dots, N_f\}$ confirms physical enclosure.
2. **Antipodal Force Balance Symmetry ($\sigma_{\text{sym}}$):**
   A stable grasp requires collinear force opposition. We define the grasp symmetry metric:
   $$\sigma_{\text{sym}} = 1.0 - \frac{\mathrm{Std}(F_{n,1}, \dots, F_{n,N_f})}{\mathrm{Mean}(F_{n,1}, \dots, F_{n,N_f}) + \epsilon}$$
   High symmetry ($\sigma_{\text{sym}} \ge 0.80$) confirms that fingers are balanced and will not impart unmodeled roll/pitch moments upon liftoff.
3. **Elastomeric Tactile Displacement Flow:**
   In GelSlim/DIGIT sensors, the contact patch area $A_{\text{contact}} \propto F_{n,i}^{2/3}$ provides direct evidence of contact maturity before shear is applied.

---

### 2.4. Question 4: Can a controlled micro-probe acquire additional contact information without destabilizing the grasp?
**Finding:** Yes. A controlled micro-probe solves the Pre-Lift Bootstrap Paradox safely.

#### Micro-Probe Mechanics:
Rather than choosing between a blind binary release (E02-A) or an eternal clamp (E02-B/C2), the controller commands a bounded test impulse:
$$\Delta z_{\text{probe}} = +0.10\text{ mm} \quad (\Delta t = 20\text{ ms}, \; v_{\text{probe}} = 5.0\text{ mm/s})$$

```
+----------------------------------------------------------------------------------------------------+
|                                    CONTROLLED MICRO-PROBE PHYSICS                                  |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  Step k: Preload Established           Step k+1: Micro-Probe (+0.1mm)      Step k+2: Decision      |
|  Fn >= 2.55 N, Ft = 0.0 N              Table load transfers to hand        Verify dFt / dz         |
|                                                                                                    |
|      [Finger]    [Finger]                  [Finger]    [Finger]                                    |
|         │           │                         ▲           ▲                                        |
|         ▼           ▼                         │   +0.1mm  │                --> If dFt/dz >= K_min: |
|       ┌───────────────┐                     ┌───▲───────▲───┐                  AUTHORIZE LIFT      |
|       │    OBJECT     │                     │   │OBJECT │   │                                      |
|       └───────┬───────┘                     └───┴───┬───┴───┘              --> If dFt/dz < K_min:  |
|   ════════════╧════════════ (Table)     ════════════╧════════════              SLIP DETECTED (0mm) |
|         Ft = 0.0 N                              dFt > 0 N                      ARREST IMMEDIATELY  |
+----------------------------------------------------------------------------------------------------+
```

1. **Zero-Drop Guarantee:** Because $\Delta z_{\text{probe}} = 0.10\text{ mm}$ is far smaller than the object contact margin ($5.0\text{ mm}$), the object remains within the table's ground-support basin. If friction collapses during the probe, the object settles back onto the table with zero kinetic drop energy.
2. **Dynamic Shear Verification:** If the grasp is secure, lifting by $0.10\text{ mm}$ tensions the contact elastomer, generating measurable shear $\Delta \mathbf{f}_t > 0$. The controller measures the shear stiffness $\hat{K}_t = \Delta F_t / \Delta z$ and computes an active empirical slip ratio $\rho_{\text{probe}} = \|\mathbf{f}_t\| / (\mu F_n)$.
3. **Empirical Authorization:** Upward lift is authorized only if the micro-probe confirms non-zero shear transfer without incipient slip.

---

## 3. Mathematical Specification: Pre-Lift Contact Evidence Acquisition (PLCEA)

### 3.1. Observation & State Space
Let the contact observation at control cycle $k$ be:
$$\mathbf{y}_k = \left[ \mathbf{f}_{n,k}, \; \boldsymbol{\delta}_{n,k}, \; \mathbf{f}_{t,k}, \; \gamma_{t,k}, \; z_{\text{obj},k} \right]$$
where:
- $\mathbf{f}_{n,k} \in \mathbb{R}_{\ge 0}^{N_f}$: Measured normal forces per finger.
- $\boldsymbol{\delta}_{n,k} \in \mathbb{R}^{N_f}$: Finger indentation depths ($r_{\text{obj}} - \|\mathbf{p}_{i,xy}\|$).
- $\mathbf{f}_{t,k} \in \mathbb{R}^{N_f \times 2}$: Measured tangential shear force vectors.
- $\gamma_{t,k} \in \{0, 1\}$: Tactile shear validity flag ($1$ if sensor stream is finite and online, $0$ if unmeasured/fault).
- $z_{\text{obj},k} \in \mathbb{R}$: Object center-of-mass height above table.

---

### 3.2. Contact Evidence & Confidence Metric
We formulate a normalized Contact Confidence Metric $C_k \in [0, 1]$:
$$C_k = w_n \cdot \psi_n(\mathbf{f}_{n,k}) + w_{\text{sym}} \cdot \psi_{\text{sym}}(\mathbf{f}_{n,k}) + w_t \cdot \psi_t(\mathbf{f}_{t,k}, \gamma_{t,k})$$

with weights $w_n = 0.40, \; w_{\text{sym}} = 0.25, \; w_t = 0.35$ satisfying $\sum w = 1.0$.

#### Sub-Metrics:
1. **Normal Force Adequacy ($\psi_n$):**
   $$\psi_n(\mathbf{f}_{n,k}) = \text{clip}\left( \frac{\min_i F_{n,i,k}}{F_{n,\text{required}}}, \; 0.0, \; 1.0 \right)$$
   where $F_{n,\text{required}} = 2.5547\text{ N}$.

2. **Antipodal Grasp Symmetry ($\psi_{\text{sym}}$):**
   $$\psi_{\text{sym}}(\mathbf{f}_{n,k}) = \max\left(0.0, \; 1.0 - \frac{\mathrm{Std}(\mathbf{f}_{n,k})}{\mathrm{Mean}(\mathbf{f}_{n,k}) + 10^{-4}}\right)$$

3. **Dynamic Shear Transfer ($\psi_t$):**
   $$\psi_t(\mathbf{f}_{t,k}, \gamma_{t,k}) = \begin{cases} 
   0.0, & \text{if } \gamma_{t,k} = 0 \text{ (Unmeasured/Fault)} \\
   \text{clip}\left( \frac{\sum_i \|\mathbf{f}_{t,i,k}\|}{F_g \cdot 0.20}, \; 0.0, \; 1.0 \right) \cdot \mathbb{I}(\max_i \rho_{i,k} \le \eta), & \text{if } \gamma_{t,k} = 1
   \end{cases}$$

---

### 3.3. Four-Way Pre-Lift Decision Gate

At each control cycle $k$, the supervisory gate evaluates the discrete state machine:

```
                                      [ Incoming Control Cycle ]
                                                  │
                                                  ▼
                                      [ Hard Limit Breach? ] ──YES──> [ RECOVER_FALLBACK ]
                                      (Fn >= 18N or Sensor Fault)     (Active Outward Retract)
                                                  │
                                                  NO
                                                  ▼
                                      [ Fn,min < Fn,required? ] ──YES──> [ HOLD_PRELOAD ]
                                                                        (Proactive Squeeze Augment)
                                                  │
                                                  NO
                                                  ▼
                                      [ Shear Engaged? ]
                                      ( ||Ft|| >= 0.20 * Fg )
                                       /                     \
                                     YES                     NO
                                     /                         \
                        [ max_i rho_i <= eta? ]            [ Micro-Probe Completed? ]
                         /                   \              /                      \
                       YES                   NO           YES                      NO
                       /                       \          /                          \
              [ AUTHORIZE_LIFT ]         [ RECOVER_FALLBACK ]                  [ PROBE_FOR_EVIDENCE ]
              (Stateful Accel Integrator) (Arrest Lift, Preload)               (Command +0.10mm Test)
```

#### Decision Rules:
1. **`RECOVER_FALLBACK`:**
   Triggered if $\max_i F_{n,i} \ge 18.0\text{ N}$, or $\gamma_{t,k} = 0$ while lifting, or $\max_i \rho_i > \eta$.
   Action:
   $$a_{\text{sub}}[4] = 0.0, \quad v_z = 0.0, \quad a_{\text{sub}}[i] = -K_{\text{retract}} \frac{F_{n,i} - 18.0}{k_{\text{elastic}}}$$

2. **`HOLD_PRELOAD`:**
   Triggered if $\min_i F_{n,i} < F_{n,\text{required}}$ and $\max_i F_{n,i} < 18.0\text{ N}$.
   Action:
   $$a_{\text{sub}}[4] = 0.0, \quad v_z = 0.0, \quad a_{\text{sub}}[i] = K_p \frac{F_{n,\text{required}} - F_{n,i}}{k_{\text{elastic}}}$$

3. **`PROBE_FOR_EVIDENCE`:**
   Triggered if $\min_i F_{n,i} \ge F_{n,\text{required}}$, but $\|\mathbf{f}_t\| < 0.20 F_g$ (resting on table; zero shear).
   Action:
   $$a_{\text{sub}}[4] = +0.10\text{ mm}, \quad a_{\text{sub}}[:4] = 0.0\text{ (hold grasp)}$$
   Status flag: `probe_active = True`.

4. **`AUTHORIZE_LIFT`:**
   Triggered if $C_k \ge 0.85$, $\min_i F_{n,i} \ge F_{n,\text{required}}$, and verified dynamic shear satisfies $\max_i \rho_i \le \eta$.
   Action:
   $$a_{z,\max} = \frac{N_f \cdot \eta \cdot \mu \cdot \min_i F_{n,i} - F_g}{m}$$
   $$v_{z,k} = \min\left( \frac{a_{\text{prop}}[4] \cdot 10^{-3}}{\Delta t}, \; v_{z,k-1} + a_{z,\max} \Delta t \right)$$
   $$a_{\text{sub}}[4] = v_{z,k} \Delta t \cdot 10^3\text{ mm}$$

---

## 4. Safety Invariants & Formal Properties

### Invariant 1 (Ground-Support Basin Safety)
**Theorem 1:** *The micro-probe command $\Delta z_{\text{probe}} = +0.10\text{ mm}$ cannot induce a catastrophic drop.*  
**Proof:** The object rests at $z_{\text{obj}} = 0.0\text{ mm}$ on the table surface. The maximum vertical displacement achievable by a single micro-probe step is $\Delta z = 0.10\text{ mm}$. If friction is identically zero ($\mu = 0$), the gravitational potential energy gained is:
$$\Delta U = m g \Delta z = 0.35 \cdot 9.81 \cdot 10^{-4} = 3.43 \times 10^{-4}\text{ J}$$
Upon immediate arrest, the object settles back by $0.10\text{ mm}$ with terminal impact velocity $v_{\text{impact}} = \sqrt{2 g \Delta z} = 0.044\text{ m/s}$, well below the material damage threshold ($> 1.5\text{ m/s}$). $\blacksquare$

### Invariant 2 (Missing Shear Gating)
**Theorem 2:** *Under PLCEA, unmeasured shear ($\gamma_t = 0$) can never authorize upward motion.*  
**Proof:** By definition in Section 3.2, if $\gamma_t = 0$, $\psi_t \equiv 0.0$, bounding maximum confidence $C_k \le 0.40 + 0.25 = 0.65 < C_{\text{thresh}} = 0.85$. The gate condition $C_k \ge 0.85$ strictly fails, preventing entry into `AUTHORIZE_LIFT`. $\blacksquare$

---

## 5. Pre-Registration for the Next Experimental Comparison

The PLCEA controller will be evaluated alongside the existing variants in the upcoming controlled experiment:

| Controller Variant | Preload Squeeze | Pre-Lift Observability | Lift Authorization Mechanism | Velocity Integration |
|:---|:---:|:---:|:---:|:---:|
| **Baseline C2** | Constant (+0.2 mm) | None (Blind halt) | Binary slip threshold ($> 0.85$) | None ($a_z = 0$) |
| **E02-A** | Proportional ($K_p$) | Resting zero-shear assumption | Full unconstrained planner passthrough | None (Step bypass) |
| **E02-B** | Unaugmented | None | Stateful friction-balance integrator | Stateful ($a_{z,\max}$) |
| **E02-C** | Proportional ($K_p$) | None | Stateful friction-balance integrator | Stateful ($a_{z,\max}$) |
| **PLCEA (New)** | Proportional ($K_p$) | **Controlled Micro-Probe (+0.1mm)** | **Empirical Confidence Gate ($C_k \ge 0.85$)** | **Stateful ($a_{z,\max}$)** |

---

## 6. Full Evaluation Protocol Recommendation (Step 4)

Pursuant to the Co-Founder guidance on allocation design:
- **Recommended Matrix:** **Balanced 10-Cell Evaluation** ($2\text{ contact regimes} \times 5\text{ variants}$).
- **Allocation:** **45 episodes per cell** across 3 seeds (`{42, 142, 242}` $\times 15\text{ episodes/seed}$).
- **Total Episodes:** **450 episodes** ($11,250\text{ control decisions}$).
- **Rationale:** 45 episodes per cell provides sufficient sample size to narrow the Wilson 95% CI margin of error to $\pm 6.8\%$ while remaining computationally manageable and fully balanced across both contact models ($M_2$ and $M_4$).

---

## 7. Submission & Action Request

Document 45 (Audit) and Document 46 (PLCEA Specification) are complete.
**Implementation Safeguard:** In strict accordance with the Co-Founder directive, **no controller code for PLCEA has been implemented.** 

**Action Requested from Technical Co-Founder:**
1. Review and audit Document 45 (Telemetry & Results Audit).
2. Review and evaluate Document 46 (PLCEA Mathematical Specification and Micro-Probe Architecture).
3. Authorize authoring of unit tests for PLCEA prior to controller implementation.
