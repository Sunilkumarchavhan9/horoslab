# HOROS PROBE-1 — Contact Mechanics Benchmark Specification (HOROS-CB-v1)

**Program:** HOROS Physical Intelligence Research Group  
**Project:** Research-002: Model Teaching Infrastructure & Contact Mechanics  
**Document Identifier:** `HOROS-P1-R002-CONTACT-BENCHMARK-SPECIFICATION`  
**Date:** 2026-11-20  
**Status:** **AUTHORITATIVE TEST SPECIFICATION**  

---

### 1. Benchmark Purpose & Scope

The HOROS Contact Benchmark Suite Version 1.0 (`HOROS-CB-v1`) defines a standardized battery of **10 automated verification protocols** to certify any contact simulation engine proposed for HOROS PROBE-1.

A candidate simulator (whether `CompliantPreLiftContactEnv-v2`, NVIDIA Warp, or Drake) must execute all 10 protocols and satisfy 100% of the quantitative pass criteria before being authorized for research dataset generation or world-model training.

---

### 2. The 10 Automated Benchmark Protocols

```
+----------------------------------------------------------------------------------------------------+
| Protocol ID | Protocol Name                     | Target Physical Behavior                                |
+-------------+-----------------------------------+---------------------------------------------------------+
| CB-01       | Normal Indentation Profiling      | Non-linear Hertzian hardening; continuous force entry    |
| CB-02       | Pure Tangential Shear Ramp        | Monotonic compliance softening; continuous dFt/ddelta_t  |
| CB-03       | Incipient Slip Annular Migration  | Shrinking stick core (c/a -> 0) prior to gross sliding   |
| CB-04       | In-Flight Friction Step Drop      | Rate-dependent slip onset without equilibrium deadbands  |
| CB-05       | Dynamic Payload Influx            | Physical decoupling of mass identification from friction |
| CB-06       | Multi-Axis Coupled Shear/Torsion  | Combined linear-torsional limit surface satisfaction     |
| CB-07       | Asymmetric Antipodal Grasping     | Differential load sharing across 4 independent fingers   |
| CB-08       | Safe Active Probing Cycle         | Friction identification R^2 >= 0.85 without causing slip |
| CB-09       | Gross Slip Kinetic Transition     | Smooth transition to kinetic friction with Stribeck drag |
| CB-10       | Closed-Loop Reactive Slip Arrest  | Feasibility of reflexive squeeze arresting partial slip  |
+----------------------------------------------------------------------------------------------------+
```

---

### 3. Detailed Protocol Specifications & Quantitative Pass Gates

#### Protocol CB-01: Normal Indentation Profiling
- **Action Sequence:** Move fingertips from clearance ($r = 36.5\text{ mm}$) to squeeze depth ($r = 34.0\text{ mm}$) in steps of $0.05\text{ mm}$.
- **Measurement:** Normal force $F_n(r)$.
- **Pass Gate:**
  1. $F_n = 0.0\text{ N}$ strictly for $r \ge R_{\text{obj}}$.
  2. Power-law fit $F_n = k \delta_n^\alpha$ yields $1.35 \le \alpha \le 1.65$ with fit $R^2 \ge 0.99$.
  3. Zero step discontinuities ($\max |\Delta F_n| \le 0.5\text{ N}$).

#### Protocol CB-02: Pure Tangential Shear Ramp
- **Action Sequence:** Fix normal force $F_n = 10.0\text{ N}$ ($2.5\text{ N}$/finger); apply monotonically increasing vertical displacement $\delta_z$ from $0.0$ to $2.0\text{ mm}$ at $0.01\text{ mm/step}$.
- **Measurement:** Tangential shear force $F_t(\delta_z)$ and numerical derivative $k_t = \Delta F_t / \Delta \delta_z$.
- **Pass Gate:**
  1. Tangent stiffness $k_t$ decreases monotonically: $\frac{\Delta k_t}{\Delta \delta_z} \le 0$.
  2. Softening ratio: $\frac{k_t(0.9 \mu F_n)}{k_t(0.1 \mu F_n)} \le 0.55$.
  3. Asymptotic limit: $\lim_{F_t \to \mu F_n} k_t \le 0.10 \cdot k_{t,0}$.

#### Protocol CB-03: Incipient Slip Annular Migration
- **Action Sequence:** Apply tangential load $F_t$ from $0.1 \mu F_n$ to $0.99 \mu F_n$.
- **Measurement:** Internal stick core ratio $c/a$.
- **Pass Gate:**
  1. $c/a$ tracks Cattaneo-Mindlin prediction $(1 - F_t/(\mu F_n))^{1/3}$ with RMS error $\le 0.05$.
  2. Micro-slip area fraction $(1 - (c/a)^2)$ expands smoothly from $0.0$ to $> 0.95$ before gross slip.

#### Protocol CB-04: In-Flight Friction Step Drop
- **Action Sequence:** Grasp workpiece in mid-air with steady hold ($F_t = m g / 4$); suddenly drop $\mu_{\text{true}}$ from $0.60$ to $0.20$ within $1$ step ($10\text{ ms}$).
- **Measurement:** Shear force $F_t(t)$ and workpiece acceleration $\ddot{z}(t)$.
- **Pass Gate:**
  1. Zero unphysical equilibrium clamping: shear force immediately saturates at $\mu_{\text{new}} F_n$.
  2. Workpiece acceleration strictly satisfies Newton's Second Law: $m \ddot{z} = \sum F_{t,i} - m g$.
  3. Zero measure-zero artificial deadbands (State S4 non-occurrence confirmed).

#### Protocol CB-05: Dynamic Payload Influx
- **Action Sequence:** Hold object in stable grasp; inject mass disturbance $\Delta m = +0.20\text{ kg}$ while keeping $\mu$ constant. Repeat with $\mu$ variation under constant mass.
- **Measurement:** Orthogonal covariance matrix between estimated mass $\hat{m}$ and estimated friction $\hat{\mu}$.
- **Pass Gate:**
  1. Correlation $|r(\hat{m}, \hat{\mu})| \le 0.15$ during pre-slip probing.
  2. Independent identifiability: world model or estimator can identify friction without mass confounding.

#### Protocol CB-06: Multi-Axis Coupled Shear & Torsion
- **Action Sequence:** Simultaneously apply vertical shear $F_z$, horizontal shear $F_\theta$, and torsional moment $M_n$ around contact normal.
- **Measurement:** Traction limit boundary.
- **Pass Gate:**
  1. Satisfies generalized ellipsoidal limit: $\left(\frac{F_z}{\mu F_n}\right)^2 + \left(\frac{F_\theta}{\mu F_n}\right)^2 + \left(\frac{M_n}{M_{\text{max}}}\right)^2 \le 1.0$.
  2. Combined loading triggers partial slip earlier than single-axis loading, matching continuum theory.

#### Protocol CB-07: Asymmetric Antipodal Grasping
- **Action Sequence:** Set finger 0 friction $\mu_0 = 0.20$, and fingers 1–3 friction $\mu_{1,2,3} = 0.60$. Apply upward lift.
- **Measurement:** Individual finger tangential forces and slip states.
- **Pass Gate:**
  1. Finger 0 undergoes partial and gross slip while fingers 1–3 remain in sticking contact.
  2. Object undergoes tilting torque due to asymmetric frictional traction, inducing multi-finger load redistribution.

#### Protocol CB-08: Safe Active Probing Cycle
- **Action Sequence:** Execute a 3-step micro-oscillation ($A = \pm 15\text{ }\mu\text{m}$, $\Delta t = 30\text{ ms}$) during anchored contact prior to liftoff.
- **Measurement:** Observed compliance $\hat{k}_t$ and linear regression against ground-truth $\mu_{\text{true}} \in [0.20, 0.70]$.
- **Pass Gate:**
  1. Regression $R^2(\hat{\mu}, \mu_{\text{true}}) \ge 0.85$.
  2. Probing induced slip displacement $\Delta z_{\text{slip}} = 0.0\text{ mm}$ (strictly safe, zero gross slip).

#### Protocol CB-09: Gross Slip Kinetic Transition
- **Action Sequence:** Drive tangential force beyond $\mu F_n$ into sustained sliding at commanding velocity $v_{\text{cmd}} = 0.05\text{ m/s}$.
- **Measurement:** Kinetic friction force $F_{t,\text{kinetic}}$ as a function of sliding velocity.
- **Pass Gate:**
  1. Exhibits continuous Stribeck friction curve: $F_t(v) = [F_C + (F_S - F_C) e^{-(v/v_s)^2} + \sigma_2 v] \text{sgn}(v)$.
  2. Zero infinite jerk / zero step discontinuities in force upon slip entry.

#### Protocol CB-10: Closed-Loop Reactive Slip Arrest
- **Action Sequence:** In mid-lift, upon detecting partial slip ($c/a \le 0.50$ or compliance softening $> 40\%$), trigger an immediate reactive normal squeeze $\Delta F_n = +4.0\text{ N}$.
- **Measurement:** Workpiece vertical displacement and final contact state.
- **Pass Gate:**
  1. Pre-slip warning lead time $\tau_{\text{lead}} \ge 20\text{ ms}$ before gross slip.
  2. Reactive squeeze successfully halts slip migration, restoring stick core $c/a \ge 0.80$ without dropping the workpiece.

---

### 4. Certification Harness Implementation

The benchmark suite shall be implemented as a fully automated pytest module:
`tests/test_horos_contact_benchmark_v1.py`

Execution command:
```bash
pytest research/PROBE-1/Research-002/tests/test_horos_contact_benchmark_v1.py -v --benchmark-output=cb_v1_results.json
```

A simulator engine achieves **HOROS-CB-v1 Certified Status** if and only if:
- Test Results: **10 Passed, 0 Failed, 0 Skipped**
- Total execution time across all 10 protocols: $< 60.0\text{ seconds}$ on standard CI.

---

### 5. Document Traceability & Sign-Off

- **Authors:** HOROS Quality Assurance & Contact Mechanics Group
- **Benchmark Version:** HOROS-CB-v1
- **Status:** Approved benchmark specification for simulator upgrades.
