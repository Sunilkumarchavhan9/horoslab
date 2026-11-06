# HOROS PROBE-1 — Research-002
## Stage P2.5: Safety Audit & Performance Trade-off Protocol
**Program:** HOROS PROBE-1 — Humanoid Robotics & Physical AI  
**Project:** Research-002: Trustworthy Action-Conditioned Contact World Models  
**Document:** 28-safety-and-performance-audit.md  
**Status:** Audit Specification  

---

## 1. Safety Filter Architecture & Empirical Status

### 1.1 Empirical p-CBF Filter Formulation
The runtime predictive Control Barrier Function (p-CBF) filter operates at each decision step $t$ by evaluating candidate actions against safety barrier constraints:

$$h_1(s) = F_{\max} - \|F_{\text{contact}}\|, \quad h_2(s) = \tau_{\max} - \|\tau_{\text{contact}}\|$$

For discrete-time predictive safety over horizon $H$:
$$\min_a \frac{1}{2} \|a - a_{\text{planner}}\|_2^2 \quad \text{s.t.} \quad \hat{h}_k(\hat{s}_{t+\tau}) \ge \gamma^\tau h_k(s_t), \quad \forall \tau \in \{1, \ldots, H\}$$

### 1.2 Scientific Qualification on Safety
Zero observed safety violations in $N = 30$ episodes is an **empirical observation**, not a certified mathematical guarantee. The finite-sample 95% Wilson binomial confidence interval for $0/30$ observed events is $[0.0, 11.35]\%$, which cannot exclude a non-zero tail risk below $11.35\%$. We report safety strictly as empirical verification under the evaluated distributions.

---

## 2. Safety vs. Performance Metrics

To detect whether the safety filter induces artificial conservatism or prevents successful task completion, we track four coupled safety metrics:

| Metric | Definition | Optimal Condition |
| :--- | :--- | :--- |
| **Safety Violation Rate** | Fraction of episodes exceeding $F_{\max}$ or $\tau_{\max}$ | $0.0\%$ |
| **Intervention Rate** | Fraction of decisions modified or rejected by p-CBF | Low ($\le 5\%$) |
| **False Rejection Rate** | Interventions on actions that would not have caused violations | $0.0\%$ |
| **Stall Induced Rate** | Episodes that stalled specifically due to safety intervention | $0.0\%$ |

---

## 3. Failure Mode Taxonomy

Every uncompleted episode is classified into one of five mutually exclusive failure categories:

1. **Temporal Truncation ($F_{\text{trunc}}$):** Stable physical progress halted before reaching task threshold due to step limit.
2. **Gross Slip / Loss of Traction ($F_{\text{slip}}$):** Finger tangential force exceeds friction capacity ($\|F_t\| > \mu F_n$).
3. **Jamming / Wedging Lockout ($F_{\text{jam}}$):** Two-point contact wedging prevents downward insertion.
4. **Safety Intervention Stall ($F_{\text{stall}}$):** Safety filter repeatedly clamps command velocity to zero.
5. **Dynamic Crush Violation ($F_{\text{crush}}$):** Fingertip normal force exceeds structural limit ($F_n > 25.0$ N).

