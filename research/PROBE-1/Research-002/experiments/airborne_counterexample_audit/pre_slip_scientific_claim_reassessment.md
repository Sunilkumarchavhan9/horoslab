# HOROS PROBE-1 — Pre-Slip Scientific Claim Reassessment

**Document Identifier:** `HOROS-P1-R002-PRE-SLIP-SCIENTIFIC-CLAIM-REASSESSMENT`  
**Date:** 2026-11-20  
**Phase:** Stage 3.3 Research Qualification / Counterexample Audit  
**Author:** HOROS Physical Intelligence Research Group  
**Status:** **SCIENTIFIC REASSESSMENT: CONDITIONAL DISPOSITION**  

---

### 1. Motivation for Reassessment

The initial feasibility report issued a categorical **NO-GO**, concluding that no observation in `CompliantPreLiftContactEnv` could depend on friction $\mu_{\text{true}}$ prior to the occurrence of a non-zero slip velocity sample. 

The discovery of the airborne hold branch (`actual_ft_z[i] = min(step_mu_used * self.fn[i], eq_ft_z)`) demonstrates that this categorical conclusion was overly broad. While true for the table-supported sticking phase, it is mathematically not true for the airborne hold phase. This document formally reassesses the research claims, delineates the precise state sequence of manipulation, and establishes what can and cannot be claimed scientifically.

---

### 2. State-Space Taxonomy of Manipulation Phases

To avoid conflating distinct physical phenomena, HOROS establishes a rigorous 7-state taxonomy for compliant pre-lift manipulation:

```
[State 1: Table Sticking] 
       │ (Total Ft > W)
       ▼
[State 2: Liftoff Transient]
       │
       ├─────────────────────────────────────────┐
       ▼ (mu * Fn >= W/4)                        ▼ (0.98 W <= mu * Fn < W)
[State 3: Fully Anchored Hold]             [State 4: Marginal Airborne Hold]
       │                                         │ (Force proportional to mu)
       │ (mu drops or mass increases)            ▼ (mu drops below 0.98 W)
       └────────────────────────────────────────>[State 5: Support Degradation]
                                                         │
                                                         ▼
                                                 [State 6: Gross Slip] (delta_dot > 0.0005 m/s)
                                                         │
                                                         ▼
                                                 [State 7: Object Drop] (z_obj -> 0)
```

#### Detailed State Definitions:

| State | Phase Name | Physical Condition | Slip Velocity ($\dot{\delta}$) | Friction Observability |
| :---: | :--- | :--- | :---: | :---: |
| **S1** | **Table Sticking** | $z_{\text{obj}} = 0$, $F_N \ge 0.4\text{ N}$, $F_t \le W$ | Exactly $0.0\text{ m/s}$ | **Zero.** $F_t = k_{\text{pad}} \Delta z$. Invariant to $\mu_{\text{true}}$. |
| **S2** | **Liftoff Transient** | $z_{\text{obj}}$ transitions $0 \to >0$, $F_t > W$ | $\le 10^{-4}\text{ m/s}$ | **Zero.** Governed by upward inertial balance $(F_t - W)/m$. |
| **S3** | **Fully Anchored Hold** | $z_{\text{obj}} > 0$, $\forall i, \mu_{\text{true}} F_{n,i} \ge W/4$ | Exactly $0.0\text{ m/s}$ | **Zero.** $F_t = W/4 = m g / 4$. Depends only on $m_{\text{obj}}$. |
| **S4** | **Marginal Airborne Hold** | $z_{\text{obj}} > 0$, $0.98 W \le \mu_{\text{true}} F_N < W$ | Recorded as $0.0\text{ m/s}$ | **Observable.** $F_t = \mu_{\text{true}} F_n$. Simulator clamping artifact. |
| **S5** | **Support Degradation** | $\mu_{\text{true}} F_N < 0.98 W$, $a_z < 0$ | Transitioning | **Observable.** Forces drop below equilibrium. |
| **S6** | **Gross Slip** | $\exists i, F_t > \mu_{\text{true}} F_{n,i}$ | $\ge 0.0005\text{ m/s}$ | **Observable.** Kinetic friction $F_t = 0.90 \mu F_n$. |
| **S7** | **Object Drop** | $z_{\text{obj}} \le 10^{-6}\text{ m}$ after liftoff | High downward | **Terminal Failure.** Episode terminates with `dropped = True`. |

---

### 3. Reassessment of Core Research Claims

#### Claim 1: "A robot can forecast friction failure before liftoff while resting on the table."
- **Reassessment Verdict:** **REFUTED (NO-GO).**
- **Reason:** In State S1 (table contact), the pad stretch is purely elastic $F_t = k_{\text{pad}} \Delta z$. Unless the probe intentionally commands $F_t > \mu F_n$ (which immediately produces Coulomb slip $\dot{\delta} \ge 0.0005\text{ m/s}$), the table reaction absorbs the remainder of the load. No pre-slip friction signal exists on the table.

#### Claim 2: "A robot can observe friction-dependent force changes during airborne hold without recording slip."
- **Reassessment Verdict:** **CONFIRMED IN CODE, BUT CONDITIONAL SCIENTIFIC VALUE.**
- **Reason:** In State S4 (marginal airborne hold), `actual_ft_z[i] = min(step_mu_used * fn[i], eq_ft_z)` forces the shear force to match $\mu_{\text{true}} F_{n,i}$ while leaving `actual_slip_vel` at zero. However, this is a simulator numerical artifact resulting from the $0.98$ deadband clamp.

#### Claim 3: "A world model can distinguish friction changes from mass changes."
- **Reassessment Verdict:** **CONDITIONAL (REQUIRES MULTI-REGIME PROBING).**
- **Reason:** 
  - In State S3 (anchored hold), force depends *only on mass* ($F_t = m g / 4$).
  - In State S4 (marginal hold), force depends *only on friction and normal force* ($F_t = \mu F_n$).
  - A two-stage active probe that tests both an anchored grip (high $F_n$) and a marginal grip (lowered $F_n$) can, in principle, decouple $m_{\text{obj}}$ and $\mu_{\text{true}}$ mathematically.

---

### 4. Revision of Project Disposition

The project disposition is formally revised from **NO-GO** to **CONDITIONAL**:

```
[PREVIOUS STATUS] ─────────> NO-GO (Categorical: zero friction signal exists before slip)
                                 │
                                 ▼ (Discovery of State S4 airborne hold clamp)
[CURRENT STATUS]  ─────────> CONDITIONAL (Signal exists in State S4, but is an airborne artifact; 
                                          pre-lift table forecasting remains impossible)
```

#### Conditions for Moving to GO:
1. The research scope must be restricted to **in-flight grasp stability monitoring**, not pre-lift ground forecasting.
2. The model must be evaluated on matched factorial splits ($m$ constant vs. $\mu$ constant) to ensure it is not merely fitting mass variations.
3. The simulator's $0.98$ clamping artifact must be formally acknowledged as an idealization of incipient partial slip.
