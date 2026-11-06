# HOROS PROBE-1 — Research-002
## Stage P2.6: Contact-Aware Safety Coordination Specification
**Program:** HOROS PROBE-1 — Humanoid Robotics & Physical AI  
**Project:** Research-002: Trustworthy Action-Conditioned Contact World Models  
**Document:** `35-p26-safety-coordination-specification.md`  
**Status:** Approved Specification  
**Predecessor Snapshots:** Commit `a1afd07a` (P2.5 Master) & Commit `76ae6037` (P2.5 Remediation) Preserved  

---

## 1. Executive Motivation & Context

Stage P2.5 Remediation separated three previously entangled failure modes:
1. **Training Experience:** Active contact-boundary sampling ($D_2$) successfully acquired coordinated multi-finger manipulation dynamics (achieving **$16.7\%$ to $20.0\%$ unconstrained lift success** and **$3.3\%$ stall rate** in $M_4$ with zero safety interventions), whereas passive and random models achieved $0.0\%$ success.
2. **Reward Landscape:** Correcting the inverted depth reward in Task 1 unlocked chamber entry, increasing mean insertion from $0.00$ mm to **$5.02$ mm** (max $8.04$ mm).
3. **Safety Layer Over-Conservatism:** Decoupled runtime safety filters (both hard-clamp C2 and smooth-damped C3) intervened on $40.8\% - 48.5\%$ of decisions, inducing an average consecutive streak of $10$–$12$ clamped steps that arrested vertical progress and caused **$90\%$ to $100\%$ safety-intervention stalls**.

Stage P2.6 shifts focus from independent model validation to **Contact-Aware Safety Coordination**.

---

## 2. Formal Scientific Qualifications & Unit Reconciliation

Before establishing the P2.6 architecture, four critical scientific findings are explicitly qualified:

### 2.1 Decisive Reconciliation of Task 2 Lift-Height Units
In `MultifingerLiftEnv`, all spatial coordinates are simulated in **millimeters (mm)**:
- Object position: $\text{pos}_{\text{obj}} \in [0.0, 100.0]$ mm (table surface is at $z = 0.0$ mm).
- Arm command bounds: $dz \in [-2.0, 5.0]$ mm/step.
- Successful lift threshold: $z_{\text{obj}} > 5.0$ mm (`self.object_lifted = True`).

In the Stage P2.5 remediation telemetry, the raw simulator float values ($3.1664$, $3.5209$, $7.8030$, $8.8196$) were mistakenly labelled with the unit suffix `"m"` instead of `"mm"`. The true physical values are:
- **$M_2$ Boundary (C1 Open):** Mean lift height $= \mathbf{3.17\text{ mm}}$, Maximum lift height $= \mathbf{7.80\text{ mm}}$ (clearing the $5.0$ mm lift threshold).
- **$M_4$ ACMM (C1 Open):** Mean lift height $= \mathbf{3.52\text{ mm}}$, Maximum lift height $= \mathbf{8.82\text{ mm}}$ (clearing the $5.0$ mm lift threshold).

All Stage P2.6 telemetry, logs, and audit reports strictly use and report verified millimeter units (`mm`).

### 2.2 Empirical Nature of Unfiltered Safety
The observed $0/30$ physical violations under Configuration C1 (p-CBF disabled) yields a 95% Wilson binomial confidence interval of $[0.00, 11.35]\%$. This confirms zero observed violations in this 30-episode sample, but it is an **empirical sample observation**, not a mathematical guarantee against tail-risk violations in arbitrary out-of-distribution regimes.

### 2.3 Limits of Smooth Damping (C3) and Recovery Penalties (C4)
Stage P2.5 remediation demonstrated that neither smooth damping (C3) nor heuristic trajectory penalties (C4) resolved the stall limit cycle ($27/30$ and $29/30$ stalls). Merely reducing vertical velocity to a lower positive value or penalizing trajectories post-hoc leaves the controller with insufficient friction capacity to support the object. Safe progress requires **actively synthesizing compensating normal force preload**.

---

## 3. Core Research Question

> **Can a contact-aware planner and runtime safety filter coordinate manipulation actions without repeatedly suppressing feasible progress near contact and friction boundaries?**

The architectural thesis of Stage P2.6 is that the planner and safety filter cannot remain decoupled black boxes. Safe manipulation requires **bidirectional coordination**:
$$\text{Feasible Action Polytope: } \mathcal{A}_{\text{safe}}(s_t) = \left\{ a \in \mathcal{A} \;\middle|\; a_{\text{lift}} \le \frac{\mu}{\lambda_{\text{dyn}}} F_{n}(s_t, a_{\text{sqz}}), \; F_{n, i} \le F_{\text{crush}} \right\}$$

---

## 4. The Three Workstreams of Stage P2.6

```
Stage P2.6: Contact-Aware Safety Coordination
├── Workstream A: Deep Intervention Telemetry & Diagnosis
│   └── Instrument slip ratio, Fn, Ft, contact mode, streak length, and progress per decision
├── Workstream B: Contact-Aware Action Substitution & Coordinated MPC
│   ├── B1: Action Substitution (Projected Preload Boost)
│   ├── B2: Coupled MPC-CBF (Optimization over feasible friction polytope)
│   └── B3: Dynamic Transient Slip Tolerance
└── Workstream C: Task 1 Controlled Insertion Horizon & Impedance Sweep
    └── Evaluate H in {40, 75, 100, 150} steps under fixed 50.0 mm seating criterion
```

### 4.1 Workstream A: Deep Intervention Telemetry
Every intervention is logged with an 8-channel diagnostic vector:
1. `step`: Episode decision index $t \in [0, H-1]$.
2. `mode`: Active contact mode (Free, Touchdown, Sticking, Lift, Incipient Slip, Wedging, Seated).
3. `slip_ratio`: Exact calculated Coulomb ratio $\max_i \frac{\|F_{t, i}\|}{\mu F_{n, i}}$.
4. `normal_force`: Vector of fingertip normal forces $[F_{n, 1}, \ldots, F_{n, 4}]$ in N.
5. `proposed_action`: Raw action generated by planner $[a_{\text{sqz}}, a_{\text{lift}}]$.
6. `substituted_action`: Certified safe action output by coordination layer.
7. `streak_count`: Current consecutive intervention count.
8. `made_progress`: Boolean indicating whether the state advanced closer to the goal after execution.

### 4.2 Workstream B: Contact-Aware Intervention Design
We evaluate three advanced coordination strategies against P2.5 baselines:
1. **Baseline C2:** Original Hard Step-Clamp ($a_{\text{lift}} = 0.0$ if $\text{slip} > 0.85$).
2. **Strategy S1: Action Substitution (Projected Preload Boost):**  
   When $\text{slip} > 0.80$, instead of zeroing $a_{\text{lift}}$, compute the missing normal force $\Delta F_n$ required to support the proposed lift velocity, and substitute:
   $$a_{\text{sqz}, i} \leftarrow a_{\text{sqz}, i} + \Delta a_{\text{preload}}(s_t), \quad a_{\text{lift}} \leftarrow \min\left(a_{\text{lift}}, \kappa \cdot \mu F_n(s_t)\right)$$
3. **Strategy S2: Jointly Coordinated MPC-CBF:**  
   The CEM trajectory optimizer evaluates candidates strictly within the safety barrier envelope, enforcing a minimum normal preload trajectory before initiating vertical lift.
4. **Strategy S3: Transient Slip Tolerance with Energy Decay:**  
   Allows transient micro-slip ($\text{slip} \le 0.95$) for at most $\tau_{\text{transient}} = 2$ control steps ($40$ ms) during initial lift-off, provided normal force is monotonically increasing.

### 4.3 Workstream C: Task 1 Controlled Insertion Horizon Sweep
To establish whether the peg can achieve full physical seating ($z \le -50.0$ mm) without shifting the pre-declared threshold:
- Sweep $H \in \{40, 75, 100, 150\}$ steps.
- Hold the corrected objective $R_{\text{corrected}}$ fixed.
- Track insertion depth, radial error, lateral contact wrench, and seating rate ($k/N$ with 95% Wilson CI).

---

## 5. Quantitative Decision Gates for Stage P2.6

| Gate Criterion | Target Threshold | Required Evidence |
| :--- | :--- | :--- |
| **G1. Task 2 Coordinated Success** | Task success $> 0/30$ ($\ge 10.0\%$) under active safety layer | Evaluated across 30 held-out test episodes |
| **G2. Stall Rate Reduction** | Stall rate reduced by $\ge 50\%$ relative to C2 ($< 45\%$) | Exact count and 95% Wilson CI |
| **G3. Zero Safety Compromise** | 0 hard physical violations ($F > 35$ N, $\tau > 7$ Nm, $F_n > 25$ N) | $0/30$ maintained in all safe configurations |
| **G4. Measurable Recovery Progress** | $\ge 60\%$ of substituted interventions produce positive upward progress | Telemetry log audit from Workstream A |
| **G5. Task 1 Travel Kinematics** | Penetration depth mapped across $H \in \{40, 75, 100, 150\}$ | Determine physical seating step threshold |
| **G6. Unit Verification** | 100% telemetry verified in millimeters (`mm`) | Reconciled across all reports |

