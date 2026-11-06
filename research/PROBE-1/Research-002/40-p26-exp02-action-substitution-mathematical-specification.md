# HOROS PROBE-1 Research-002 — Stage P2.6
## Document 40 (Revision 2.0): Experiment 02 — Action Substitution Mathematical Specification & Controlled Factorial Protocol

**Program:** HOROS PROBE-1, Research-002 — Trustworthy Action-Conditioned Contact World Models  
**Stage:** P2.6 — Contact-Aware Safety Coordination  
**Document:** 40 (Formal Revision 2.0 incorporating Co-Founder Mathematical & Experimental Review)  
**Status:** **Pre-Implementation Specification Frozen for Signoff**  
**Author:** HOROS Physical Intelligence Research Group  
**Date:** November 6, 2026  

---

## 1. Executive Context & Review Amendments Summary

Following co-founder audit of Revision 1.0, this revised specification resolves three blocking mathematical issues and two experimental-design issues prior to any code implementation:

| Issue | Audit Finding in Revision 1.0 | Resolution in Revision 2.0 |
| :--- | :--- | :--- |
| **40.1 (Squeeze Command)** | $\Delta x_{\text{sqz}}\ [\text{mm}]$ displacement target compared directly to per-step increment $a_{\text{prop, sqz}}\ [\text{mm/step}]$ | Separated displacement target from command via stateful bounded proportional controller with $K_p$ and anti-crush ceiling |
| **40.2 (Lift Velocity Controller)** | $\Delta z_{\text{safe}} = \frac{1}{2} a_{z,\max} \Delta t^2$ represented only single-step acceleration from rest | Formulated stateful discrete velocity integrator $v_{z,t+1} = \operatorname{clip}(v_{z,t} + a_{z,\text{cmd}}\Delta t, 0, v_{z,\max})$ converted to mm per step |
| **40.3 (Per-Contact Friction Bottleneck)** | Aggregate sum $\eta \mu \sum F_{n,i}$ ignored load asymmetry and multi-finger geometry | Derived per-contact friction cone constraints $\|\mathbf{F}_{t,i}\| \le \eta \mu_i F_{n,i}$ bounded by weakest contact $\min_i(\eta \mu_i F_{n,i})$ |
| **40.4 (Experimental Disambiguation)** | E02-A clamp release logic unspecified; E02-D factorial overlap unclear | Defined explicit threshold release condition for E02-A; formally defined E02-D as E02-C filter + coordinated CEM prior |
| **40.5 (Sampling & Reporting)** | Episode counts and model-specific baselines ambiguous | Standardized 30 episodes/seed $\times$ 3 seeds = 90 episodes/condition; differentiated acceptance thresholds for $M_2$ vs $M_4$ |

---

## 2. First-Principles Mathematical Derivation

### 2.1 Coordinate Frame, Kinematic State & Actuator Space
In `MultifingerLiftEnv`:
- Object mass: $m = 0.50\text{ kg}$, gravitational acceleration $g = 9.81\text{ m/s}^2 \implies F_g = m g = 4.905\text{ N}$.
- Hand topology: $N_f = 4$ antipodal hemispherical fingertips positioned radially around object at nominal radius $r_{\text{nom}} = 35.0\text{ mm}$.
- Control frequency: $100\text{ Hz}$ ($\Delta t = 0.01\text{ s}$).
- State vector: At time step $t$, the controller observes:
  - Fingertip radial positions $\mathbf{p}_{i,t} \in \mathbb{R}^3$, radial distance $r_{i,t} = \|\mathbf{p}_{i,t}^{\text{radial}}\| = \sqrt{x_{i,t}^2 + y_{i,t}^2}$.
  - Measured normal contact forces $\mathbf{F}_{n,t} = [F_{n,1,t}, \dots, F_{n,N_f,t}]^T \in \mathbb{R}^{N_f}_{\ge 0}$.
  - Measured tangential shear forces $\mathbf{F}_{t,t} = [\mathbf{F}_{t,1,t}, \dots, \mathbf{F}_{t,N_f,t}]^T$.
  - Hand vertical velocity $v_{z,t}\ [\text{m/s}]$ and object vertical position $z_{\text{obj}, t}\ [\text{mm}]$.
- Action command: $a_t = [a_{\text{sqz}, 1, t}, \dots, a_{\text{sqz}, N_f, t}, a_{\text{lift}, t}]^T \in \mathbb{R}^5$:
  - $a_{\text{sqz}, i, t} \in [-\Delta a_{\max}, \Delta a_{\max}] = [-2.0, 2.0]\text{ mm/step}$: Inward radial displacement increment.
  - $a_{\text{lift}, t} \in [-\Delta z_{\max}, \Delta z_{\max}] = [-2.0, 5.0]\text{ mm/step}$: Arm vertical displacement increment.
- Elastomeric normal contact stiffness:
  $$F_{n,i}(\delta_{i,t}) = k_{\text{elastic}} \cdot \max(0, \delta_{i,t}), \quad k_{\text{elastic}} = 4.0\text{ N/mm}$$
  where indentation $\delta_{i,t} = \max(0, r_{\text{nom}} - r_{i,t})\ [\text{mm}]$.

---

### 2.2 Squeeze Preload Substitution Controller (Amendment 40.1)

#### A. Required Normal Force per Contact
To support object weight $F_g$ with friction coefficient $\mu$ under dynamic safety margin $\gamma = 1.25$ (accounting for upward acceleration and minor grip asymmetries):
$$F_{n,\text{required}} = \frac{\gamma \cdot F_g}{N_f \cdot \mu} = \frac{1.25 \times 4.905}{4 \times 0.60} = 2.5547\text{ N}$$

#### B. Normal Force Deficit & Indentation Target
At step $t$, the normal force deficit for finger $i$ is:
$$\Delta F_{n,i,t} = \max\left(0, F_{n,\text{required}} - F_{n,i,t}\right) \quad [\text{N}]$$

The corresponding required elastic indentation target is:
$$\delta_{\text{target}, i,t} = \delta_{i,t} + \frac{\Delta F_{n,i,t}}{k_{\text{elastic}}} \quad [\text{mm}]$$

#### C. Bounded Proportional Displacement Controller
Rather than equating the static displacement target with a velocity increment, we synthesize a bounded proportional displacement controller with gain $K_p \in (0, 1]$ (default $K_p = 1.0$):
$$\Delta a_{\text{cmd}, \text{sqz}, i, t} = \operatorname{clip}\left(K_p \cdot (\delta_{\text{target}, i,t} - \delta_{i,t}), -\Delta a_{\max}, \Delta a_{\max}\right) = \operatorname{clip}\left(K_p \cdot \frac{\Delta F_{n,i,t}}{k_{\text{elastic}}}, -2.0, 2.0\right) \quad [\text{mm/step}]$$

#### D. Substituted Squeeze Action & Anti-Crush Enforcement
The substituted squeeze action merges the planner proposal with the required preload command:
$$a_{\text{sub}, \text{sqz}, i, t} = \operatorname{clip}\left(\max\left(a_{\text{prop}, \text{sqz}, i, t}, \Delta a_{\text{cmd}, \text{sqz}, i, t}\right), -2.0, 2.0\right) \quad [\text{mm/step}]$$

**Anti-Crush Safety Override:**
To guarantee that preload augmentation never violates the physical crush ceiling $F_{\max} = 18.0\text{ N}$ ($25.0\text{ N}$ hard environment limit):
$$\text{If } F_{n,i,t} \ge 18.0\text{ N}: \quad a_{\text{sub}, \text{sqz}, i, t} = \min\left(0.0, a_{\text{prop}, \text{sqz}, i, t}\right) \quad (\text{Strict Inward Inhibit / Retract})$$

---

### 2.3 Stateful Lift Velocity & Friction-Aware Scaling Controller (Amendment 40.2 & 40.3)

#### A. Per-Contact Multi-Finger Friction Constraint (Amendment 40.3)
In multi-finger grasp mechanics, gross slip initiates at the **weakest contact point**. For antipodal vertical lifting with $N_f$ contacts:
$$\forall i \in \{1, \dots, N_f\}: \quad \|\mathbf{F}_{t,i}\| \le \eta \mu_i F_{n,i}$$
where $\eta = 0.85$ is the conservative friction cone margin ($15\%$ buffer against micro-slip).

Assuming vertical load distribution, the maximum total sustainable vertical shear force before any finger slips is bounded by the minimum contact normal force:
$$F_{t,\max, t} = N_f \cdot \min_{i=1 \dots N_f} \left(\eta \mu_i F_{n,i,t}\right) \quad [\text{N}]$$

#### B. Dynamic Acceleration Bound
The maximum safe upward vertical acceleration $a_{z,\max, t}$ without slip is:
$$a_{z,\max, t} = \frac{F_{t,\max, t} - m g}{m} \quad [\text{m/s}^2]$$

**Sign & Feasibility Regimes:**
1. **Preload Deficit Regime ($F_{t,\max, t} < m g$):** $a_{z,\max, t} < 0$. The available friction cannot support static gravity. Safe upward acceleration is strictly zero; any upward motion causes immediate slip.
2. **Sufficient Preload Regime ($F_{t,\max, t} \ge m g$):** $a_{z,\max, t} \ge 0$. The contact grasp has positive net upward force capacity.

#### C. Stateful Velocity Integrator (Amendment 40.2)
We track stateful hand vertical velocity $v_{z,t}\ [\text{m/s}]$ across steps.
1. The planner proposes vertical displacement increment $a_{\text{prop}, \text{lift}, t}\ [\text{mm/step}]$, representing an intended velocity:
   $$v_{\text{prop}, t+1} = \frac{a_{\text{prop}, \text{lift}, t} \cdot 10^{-3}}{\Delta t} \quad [\text{m/s}]$$
2. The maximum allowable velocity $v_{z,\max, t}$ is constrained by available upward acceleration and dynamic braking:
   $$v_{z,\max, t} = \max\left(0.0, v_{z,t} + a_{z,\max, t} \cdot \Delta t\right) \quad [\text{m/s}]$$
3. When $F_{t,\max, t} < m g$ (preload deficit), the maximum upward velocity is strictly zero:
   $$v_{z,\max, t} = 0.0 \quad (\text{if } a_{z,\max, t} \le 0)$$
4. The integrated safe velocity for step $t+1$ is:
   $$v_{z,t+1} = \operatorname{clip}\left(v_{\text{prop}, t+1}, 0.0, v_{z,\max, t}\right) \quad [\text{m/s}]$$
5. Converting to the simulator's commanded displacement increment ($\text{mm/step}$):
   $$\Delta z_{\text{safe}, t} = v_{z,t+1} \cdot \Delta t \cdot 10^3 \quad [\text{mm/step}]$$
   $$a_{\text{sub}, \text{lift}, t} = \operatorname{clip}\left(\Delta z_{\text{safe}, t}, -2.0, 5.0\right) \quad [\text{mm/step}]$$

**Downward Motion Handling:** If the planner proposes downward arm travel ($a_{\text{prop}, \text{lift}, t} < 0$), downward acceleration does not cause friction slip against gravity; $a_{\text{sub}, \text{lift}, t} = a_{\text{prop}, \text{lift}, t}$.

---

## 3. Controlled Factorial Matrix & Disambiguation (Amendment 40.4)

Experiment 02 implements a strict $2 \times 2$ factorial ablation plus baseline negative control:

```
+-----------------------------------------------------------------------------------------------+
|                             FACTORIAL COMPARISON MATRIX (EXP-02)                              |
+---------------+-------------------------------+-------------------------------+---------------+
| Condition     | Squeeze Action a[:4]          | Lift Action a[4]              | Planner Prior |
+---------------+-------------------------------+-------------------------------+---------------+
| Baseline (C2) | a_prop[:4] (Unmodified)       | 0.0 mm/step (Hard Zero-Clamp) | Uncoordinated |
| Variant E02-A | a_sub[:4] (Preload Controller)| Stateful Clamp Release Logic  | Uncoordinated |
| Variant E02-B | a_prop[:4] (Unmodified)       | a_sub[4] (Stateful Integrator)| Uncoordinated |
| Variant E02-C | a_sub[:4] (Preload Controller)| a_sub[4] (Stateful Integrator)| Uncoordinated |
| Variant E02-D | a_sub[:4] (Preload Controller)| a_sub[4] (Stateful Integrator)| Coordinated   |
+---------------+-------------------------------+-------------------------------+---------------+
```

### 3.1 Variant Disambiguation & Clamp Release Logic

#### Variant E02-A: Normal Preload Compensation with State-Triggered Clamp Release
- **Squeeze Command:** $a_{\text{sub}, \text{sqz}, i, t}$ active (commands $\Delta a_{\text{cmd}, \text{sqz}}$).
- **Lift Clamp Release Criterion:**
  $$\text{Lift Action: } a_{\text{sub}, \text{lift}, t} = \begin{cases} a_{\text{prop}, \text{lift}, t} & \text{if } \min_{i} F_{n,i,t} \ge F_{n,\text{required}} \text{ and } \max_i \frac{\|F_{t,i,t}\|}{\mu F_{n,i,t}} \le \eta \\ 0.0 & \text{otherwise (clamp active while preloading)} \end{cases}$$
- **Purpose:** Isolates whether active normal preloading alone breaks the limit cycle once normal force reaches threshold, without needing continuous velocity scaling.

#### Variant E02-B: Stateful Velocity Scaling Only (Zero Squeeze Augmentation)
- **Squeeze Command:** $a_{\text{prop}, \text{sqz}, i, t}$ (no preload compensation).
- **Lift Command:** $a_{\text{sub}, \text{lift}, t}$ via stateful velocity integrator ($v_{z,t+1}$).
- **Purpose:** Isolates whether smooth proportional velocity scaling alone prevents stalls if the hand happens to build preload naturally through accidental friction.

#### Variant E02-C: Full Action Substitution (Preload + Stateful Velocity Scaling)
- **Squeeze Command:** $a_{\text{sub}, \text{sqz}, i, t}$ active.
- **Lift Command:** $a_{\text{sub}, \text{lift}, t}$ active.
- **Planner:** Standard uncoordinated CEM planner.
- **Purpose:** Evaluates runtime filter action substitution without modifying the planner's internal optimization objective.

#### Variant E02-D: Action Substitution + Coordinated CEM Planner Prior
- **Safety Filter:** Identical to Variant E02-C (full action substitution).
- **Planner Coordination (CEM Prior Bias):**
  At replanning step $t$, the CEM planner inspects current state $\mathbf{F}_{n,t}$:
  - If $\min_i F_{n,i,t} < F_{n,\text{required}}$:
    - Squeeze sampling prior mean initialized to: $\boldsymbol{\mu}_{\text{CEM}, \text{sqz}} = \Delta a_{\text{cmd}, \text{sqz}}$.
    - Lift sampling prior mean initialized to: $\mu_{\text{CEM}, \text{lift}} = 0.0$.
  - If $\min_i F_{n,i,t} \ge F_{n,\text{required}}$:
    - Squeeze prior mean initialized to: $\boldsymbol{\mu}_{\text{CEM}, \text{sqz}} = 0.0$.
    - Lift prior mean initialized to: $\mu_{\text{CEM}, \text{lift}} = \Delta z_{\text{safe}, t}$.
- **Purpose:** Isolates the additive value of planner-filter coordination over filter substitution alone by reducing proposed action distortion $\|a_{\text{prop}} - a_{\text{sub}}\|$ at the source.

---

## 4. Sampling Protocol, Seeds & Acceptance Gates (Amendment 40.5)

### 4.1 Frozen Episode Allocation
- **Evaluation Splits:** 30 episodes per seed $\times$ 3 independent seeds = **90 episodes per condition**.
- **Frozen Random Seeds:**
  - Seed 1: $s = 100$ (Episodes 0–29, base seed 6000)
  - Seed 2: $s = 200$ (Episodes 0–29, base seed 7000)
  - Seed 3: $s = 300$ (Episodes 0–29, base seed 8000)
- **Total Experiment 02 Benchmark Size:**
  - 5 conditions ($C_2$ Baseline, E02-A, E02-B, E02-C, E02-D) $\times$ 2 active models ($M_2$ Boundary, $M_4$ ACMM) $\times$ 90 episodes = **900 episodes**.
  - Reference check: $M_0$ Passive evaluated on $C_2$ and E02-C across 30 episodes (negative control).
  - Total planned episodes: **960 episodes**.

### 4.2 Model-Specific Acceptance Thresholds
Because $M_2$ (Boundary) and $M_4$ (Combined ACMM) demonstrated different unconstrained baseline capabilities in Experiment 01 ($13.33\%$ vs $26.67\%$ success; 16 vs 12 max streak), acceptance gates are declared **separately per model**:

| Metric | Baseline $C_2$ ($M_2$) | Baseline $C_2$ ($M_4$) | Acceptance Threshold ($M_2$) | Acceptance Threshold ($M_4$) |
| :--- | :---: | :---: | :---: | :---: |
| **Intervention Rate** | $46.53\%$ ($349/750$) | $38.67\%$ ($290/750$) | **$\le 20.0\%$** ($\ge 57\%$ reduction) | **$\le 18.0\%$** ($\ge 53\%$ reduction) |
| **Max Intervention Streak** | 16 steps | 12 steps | **$\le 3$ steps** | **$\le 3$ steps** |
| **Stall Rate** | $90.0\%$ ($27/30$) | $96.67\%$ ($29/30$) | **$\le 20.0\%$** | **$\le 15.0\%$** |
| **Task Success Rate** | $0.0\%$ ($0/30$) | $0.0\%$ ($0/30$) | **$\ge 15.0\%$** (Ambitious recovery) | **$\ge 25.0\%$** (Full skill recovery) |
| **Hard Safety Violations** | $0.0\%$ ($0/30$) | $0.0\%$ ($0/30$) | **$0/90$ ($0.0\%$, CI upper $\le 3.98\%$)** | **$0/90$ ($0.0\%$, CI upper $\le 3.98\%$)** |

*Note on Safety Claim:* Observing $0/90$ hard violations establishes an empirical 95% Wilson confidence upper bound of $3.98\%$. In compliance with HOROS research integrity rules, this will be reported strictly as an empirical non-violation record, not a formal certified safety guarantee.

---

## 5. Implementation Architecture & Phased Rollout

Following co-founder approval of Document 40, implementation will proceed through strict verified phases:

1. **Phase 1: Unit & Physics Test Suite (`tests/test_p26_action_substitution.py`)**
   - Test 1: Squeeze displacement target $\Delta x_{\text{sqz}}$ vs command increment $\Delta a_{\text{cmd}}$ scaling.
   - Test 2: Anti-crush override at $F_n \ge 18.0\text{ N}$.
   - Test 3: Weakest-contact friction bottleneck calculation $\min_i(\eta \mu_i F_{n,i})$.
   - Test 4: Stateful velocity integrator deceleration and zero-velocity clamping when $a_{z,\max} \le 0$.
2. **Phase 2: Source Module Implementation (`src/coordination/action_substitutor.py`)**
   - Implements `ContactAwareActionSubstitutor` adhering to Section 2 and 3 contracts.
3. **Phase 3: Execution of Controlled Factorial Suite (`run_p26_exp02_action_substitution.py`)**
   - Evaluates Baseline $C_2$, E02-A, E02-B, E02-C, E02-D across 900 episodes.
4. **Phase 4: Publication of Results Audit (`41-p26-exp02-empirical-results-audit.md`)**
   - Reports per-seed, pooled, and model-stratified metrics against frozen acceptance gates.

---

## 6. Signoff Decision Request

This revised Document 40 is submitted for formal technical review and authorization to proceed with Phase 1 (Unit Tests) and Phase 2 (`src/coordination/action_substitutor.py`).
