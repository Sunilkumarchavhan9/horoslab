# HOROS PROBE-1 — Research-002
## Stage P2.5 Remediation: p-CBF Intervention Limit-Cycle Analysis
**Program:** HOROS PROBE-1 — Humanoid Robotics & Physical AI  
**Project:** Research-002: Trustworthy Action-Conditioned Contact World Models  
**Document:** `32-pcbf-intervention-limit-cycle-analysis.md`  
**Status:** Diagnostic Failure Audit  

---

## 1. The Safety-Performance Conflict in Task 2

In Stage P2.5, actively mined models ($M_2$ Boundary and $M_4$ ACMM) successfully discovered coordinated multi-finger squeeze-and-lift manipulation. When evaluated unconstrained, these models exhibited strong physical capability (reaching up to $0.402$ m lift height).

However, under closed-loop deployment with the original runtime p-CBF filter:
- **Intervention Rates:**
  - $M_2$ Boundary: **323 / 750 decisions (43.07%)**
  - $M_4$ ACMM: **311 / 750 decisions (41.47%)**
- **Failure Taxonomy:**
  - $M_2$: **27 / 30 episodes (90.0%)** classified as **Safety-Intervention Stall ($F_{\text{stall}}$)**.
  - $M_4$: **27 / 30 episodes (90.0%)** classified as **Safety-Intervention Stall ($F_{\text{stall}}$)**.
- **Observed Physical Violations:** **0 / 30 (0.0%, 95% Wilson CI: [0.00, 11.35]%)**.

The safety filter was 100% effective at eliminating slip drops and crush damage, but it achieved safety by **permanently arresting the robot's upward motion**.

---

## 2. Mathematical Anatomy of the Limit Cycle

### 2.1 The Two Competing Barrier Constraints
In `PredictiveCBFSafetyFilter` (`pcbf_safety_filter.py`), two hard barrier projections govern multifingered manipulation:

```python
# 1. Crush barrier: limit squeeze command if normal force exceeds 20 N
max_fn = float(np.max(finger_fn))
if max_fn > 20.0:
    for i in range(len(finger_fn)):
        if finger_fn[i] > 20.0 and candidate_action[i] > 0.0:
            certified_action[i] = 0.0
            intervened = True

# 2. Slip barrier: if slip ratio > 0.85, halt lift acceleration and force preload
max_slip = float(np.max(slip_ratio))
if max_slip > 0.85:
    if len(candidate_action) > 4 and candidate_action[4] > 0.0:
        certified_action[4] = 0.0                           # Hard velocity zero-clamp!
        certified_action[:4] = np.maximum(certified_action[:4], 0.2)  # Preload clamp
        intervened = True
```

### 2.2 Physical Simulation Dynamics
In `MultifingerLiftEnv`:
- Object mass: $m = 0.8$ kg, gravity: $g = 9.81\text{ m/s}^2 \implies F_g = 7.848$ N.
- Number of fingers: $N_f = 4 \implies$ Required shear force per finger to support gravity:
  $$F_{t, i} = \frac{F_g}{4} = 1.962\text{ N}$$
- Friction coefficient: $\mu = 0.50$.
- Coulomb slip ratio per finger:
  $$\text{slip}_i = \frac{F_{t, i}}{\mu F_{n, i}} = \frac{1.962}{0.50 \cdot F_{n, i}} = \frac{3.924}{F_{n, i}}$$

### 2.3 The Discontinuous Chattering Mechanism
The threshold $\text{slip} > 0.85$ corresponds to:
$$\frac{3.924}{F_{n, i}} > 0.85 \iff F_{n, i} < 4.616\text{ N} \quad (\text{Total } F_n < 18.46\text{ N})$$

When the robot executes receding-horizon control:
```
Step t:   F_n = 4.0 N  --> slip = 0.98 > 0.85.
          Planner commands: a_lift = +2.5 mm/step.
          p-CBF intervenes: Overrides a_lift = 0.0 (PAUSE LIFT), overrides squeeze = 0.2 mm.
          Result: Robot does not move vertically; normal force increases to F_n = 4.8 N.

Step t+1: F_n = 4.8 N  --> slip = 0.817 < 0.85 (Temporarily safe!).
          Planner commands: a_lift = +2.5 mm/step.
          p-CBF passes: a_lift = +2.5 executed!
          Environment steps: Arm accelerates upward.
          Dynamic shear spikes due to upward acceleration: F_t increases from 1.96 N to 2.5 N.
          New slip ratio: slip = 2.5 / (0.50 * 4.8) = 1.04 > 0.85!

Step t+2: slip = 1.04 > 0.85.
          p-CBF intervenes: Hard clamps a_lift = 0.0 again!
```

Because the original filter uses a **discontinuous step function** ($a_{\text{lift}} = 0.0$) without hysteresis, the policy chatters between zero velocity and small upward pulses, averaging near-zero net displacement over $H=25$ steps. The episode stalls, resulting in the $90\%$ $F_{\text{stall}}$ audit outcome.

---

## 3. Remediation Architecture: Two Complementary Solutions

### 3.1 Solution 1: Tuned Continuous-Damping p-CBF (Filter-Level)
Instead of a discontinuous step clamp to $0.0$, we implement smooth barrier-proximity damping:
$$\gamma_{\text{slip}}(\text{slip}) = \begin{cases} 
1.0 & \text{if } \text{slip} \le 0.75 \\
\max\left(0.0, \frac{0.95 - \text{slip}}{0.95 - 0.75}\right) & \text{if } 0.75 < \text{slip} \le 0.95 \\
0.0 & \text{if } \text{slip} > 0.95 
\end{cases}$$

$$a_{\text{lift}}^{\text{certified}} = a_{\text{lift}}^{\text{planner}} \cdot \gamma_{\text{slip}}(\text{slip})$$

- When $\text{slip} = 0.85$, $\gamma = (0.95 - 0.85)/0.20 = 0.50$. The arm continues lifting at half velocity, preventing chattering while maintaining a $5\%$ safety margin below the physical Coulomb slip limit ($\text{slip} = 1.0$).
- When $\text{slip} > 0.95$, hard zero-clamp is enforced to guarantee zero drops.

### 3.2 Solution 2: Recovery-Aware Planner (Planner-Level Coordination)
In standard CEM, the trajectory optimizer is completely blind to runtime safety rejection. It repeatedly proposes actions that trigger the filter because its internal world model predicts high return for immediate vertical lifting.

In the **Recovery-Aware Planner**:
1. At decision step $t$, candidate action sequences $A^{(i)}$ are evaluated through a fast predictive barrier check.
2. If candidate $A^{(i)}$ induces $\text{slip} > 0.85$ in the world model rollout, its return is penalized:
   $$J_{\text{recovery}}(A^{(i)}) = J_{\text{WM}}(A^{(i)}) - \lambda_{\text{slip}} \sum_{\tau} \max(0.0, \hat{\text{slip}}_\tau - 0.80)$$
3. The CEM elites shift naturally toward candidate sequences that **first increase finger preload ($F_n \ge 12$ N)** during steps $\tau=0, 1$ before initiating vertical lift ($\tau \ge 2$).

This eliminates the limit cycle at the source by ensuring the planner only proposes certified safe actions.

