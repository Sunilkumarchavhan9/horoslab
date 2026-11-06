# HOROS PROBE-1 — Research-002
## Stage P2.5 Remediation: Experimental Protocol
**Program:** HOROS PROBE-1 — Humanoid Robotics & Physical AI  
**Project:** Research-002: Trustworthy Action-Conditioned Contact World Models  
**Document:** `33-safety-performance-remediation-protocol.md`  
**Status:** Evaluation Protocol  

---

## 1. Experimental Overview

This protocol governs the empirical execution of Stage P2.5 Remediation, designed to resolve:
1. **Task 1 Insertion Completion:** Testing whether correcting the inverted depth objective and providing sufficient horizon ($H=40, 60$) unlocks physical seating ($z \le -50.0$ mm).
2. **Task 2 Safety-Performance Trade-Off:** Matched four-way comparison (C1 through C4) across all five dataset models ($M_0$ through $M_4$) to eliminate safety-intervention stalls while maintaining zero physical violations.

---

## 2. Remediation A Protocol: Task 1 Precision Peg-in-Hole

### 2.1 Experimental Matrix
All evaluations use the trained and frozen world models ($M_0$ through $M_4$) from Stage P2.5, evaluated on the 30 held-out test episodes:

| Dimension | Tested Settings | Description |
| :--- | :--- | :--- |
| **Objective Formulation** | $R_{\text{corrupt}}$, $R_{\text{corrected}}$, $R_{\text{guided}}$ | Tests removal of $z < 0$ penalty and addition of seating incentive |
| **Evaluation Horizon** | $H \in \{25, 40, 60\}$ steps | Evaluates whether physical distance requires additional steps |
| **Safety Filter** | p-CBF ON vs. OFF | Measures whether force barrier prematurely arrests downward insertion |

### 2.2 Objective Definitions
1. **$R_{\text{corrupt}}$ (P2.5 Baseline):**
   $$R(s) = -(2.0 \cdot \text{lateral} + 1.5 \cdot \max(0, z) - 5.0 \cdot \min(0, z) + 0.1 \cdot \|F\|)$$
2. **$R_{\text{corrected}}$ (Linear Downward Progress):**
   $$R(s) = 5.0 \cdot \max(0, -z) - 2.0 \cdot \text{lateral} - 1.5 \cdot \max(0, z) - 0.1 \cdot \|F\|$$
3. **$R_{\text{guided}}$ (Seating & Alignment Guided):**
   $$R(s) = 5.0 \cdot \max(0, -z) - 2.0 \cdot \text{lateral} - 0.5 \cdot \text{tilt} - 0.05 \cdot \|F\| + 100.0 \cdot \mathbb{I}(z \le -50.0)$$

---

## 3. Remediation B Protocol: Task 2 Multifingered Lift

### 3.1 The Four Matched Configurations
To rigorously isolate planner capability from filter conservatism, we evaluate 30 held-out test episodes per condition across four configurations:

```
[Candidate Action Sequence]
             │
             ├── C1: Direct Execution without Safety Filter (Measures raw planner skill)
             │
             ├── C2: Original Discontinuous Hard Clamp (Slip > 0.85 => a_lift = 0.0)
             │
             ├── C3: Tuned Continuous-Damping p-CBF (Smooth proportional lift reduction)
             │
             └── C4: Recovery-Aware CEM Planner + Tuned p-CBF (Preload-prioritized search)
```

### 3.2 Detailed Algorithmic Specifications

#### Configuration C1: p-CBF Disabled
- Actions output by `CEMPlanner` are executed directly without modification:
  $$a_{\text{exec}} = a_{\text{planner}}$$

#### Configuration C2: Original p-CBF (P2.5 Baseline)
- Crush threshold: $F_{n, \max} = 20.0$ N.
- Slip threshold: $\text{slip}_{\max} = 0.85$.
- Override rules:
  - If $\max_i F_{n, i} > 20.0$ N and $a_{\text{sqz}, i} > 0 \implies a_{\text{sqz}, i} = 0.0$.
  - If $\max_i \text{slip}_i > 0.85$ and $a_{\text{lift}} > 0 \implies a_{\text{lift}} = 0.0$, $a_{\text{sqz}, i} = \max(a_{\text{sqz}, i}, 0.2)$.

#### Configuration C3: Tuned Smooth p-CBF Filter
- Crush protection: Smooth squeeze backoff when $F_n > 18.0$ N:
  $$a_{\text{sqz}, i} \leftarrow a_{\text{sqz}, i} \cdot \max\left(0.0, \frac{25.0 - F_{n, i}}{7.0}\right)$$
- Slip protection: Smooth proportional velocity damping over interval $[0.75, 0.95]$:
  $$\gamma_{\text{slip}} = \max\left(0.0, \min\left(1.0, \frac{0.95 - \text{slip}}{0.20}\right)\right)$$
  $$a_{\text{lift}} \leftarrow a_{\text{lift}} \cdot \gamma_{\text{slip}}$$
  $$a_{\text{sqz}, i} \leftarrow \max(a_{\text{sqz}, i}, 0.15 \cdot (1.0 - \gamma_{\text{slip}}))$$
- Guarantees $a_{\text{lift}} = 0.0$ strictly before reaching the physical slip boundary $\text{slip} = 1.0$, while preventing chattering.

#### Configuration C4: Recovery-Aware CEM Planner + Tuned p-CBF
- At replanning step $t$, the CEM trajectory optimizer predicts multi-step candidate rollouts using the learned hybrid world model.
- Candidate returns are augmented with a predictive barrier violation penalty:
  $$J_{\text{recovery}}(A) = J_{\text{WM}}(A) - 20.0 \sum_{\tau=0}^{H_{\text{plan}}} \max(0.0, \hat{\text{slip}}_\tau - 0.80) - 10.0 \sum_{\tau=0}^{H_{\text{plan}}} \max(0.0, \hat{F}_{n, \tau} - 22.0)$$
- Elite candidates selected by CEM are naturally trajectories that establish sufficient normal preload ($F_n \ge 12$ N) before initiating vertical lift.

---

## 4. Execution Pipeline & Output Format

All experimental scripts and raw traces are organized in:
`research/PROBE-1/Research-002/experiments/p25_remediation/`
- Master runner: `run_p25_remediation.py`
- Serialized report: `experiments/p25_remediation/results/p25_remediation_master_report.json`
- Audit document: `34-p25-remediation-results-audit.md`

