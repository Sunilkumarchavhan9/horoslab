# HOROS PROBE-1 — Research-002
## Stage P2.5 Remediation: Integrated Manipulation & Safety-Performance Coordination Specification
**Program:** HOROS PROBE-1 — Humanoid Robotics & Physical AI  
**Project:** Research-002: Trustworthy Action-Conditioned Contact World Models  
**Document:** `30-p25-remediation-specification.md`  
**Status:** Approved Remediation Specification  
**Baseline Snapshot:** Commit `a1afd07a` (Preserved Unchanged)  

---

## 1. Executive Context & Motivation

Stage P2.5 successfully demonstrated:
1. **Conformal Superiority:** Mode-stratified CMS-PSACD achieved 30/30 (100.0%, 95% Wilson CI: [88.65, 100.00]%) joint simultaneous trajectory coverage, whereas unstratified split conformal collapsed to 0/30–4/30 (0.0%–13.33%).
2. **Target A vs. Target B Stability:** A reported transfer gap of $\Delta_{\text{transfer}} = 0.0000$, showing that receding-horizon replanning does not degrade conformal validity.
3. **Active Boundary Mining Value:** $D_2$ Boundary Sampling reduced Task 2 state RMSE by 33.0% and force RMSE by 35.0%, and elevated contact-mode macro-F1 by $12.9\times$ over passive exploration.

However, the empirical decision gate revealed two critical unresolved problems preventing full validation of the integrated manipulation system:
- **Problem 1 (Task 1 Peg-in-Hole):** 0/150 completed insertions across all five conditions ($M_0$ through $M_4$). Every episode terminated with temporal truncation ($F_{\text{trunc}}$) at $H=25$ steps, reaching mean progress of 10.6–12.0 mm (stopping right at the hole entrance $z \approx 0$).
- **Problem 2 (Task 2 Multifingered Lift):** 27/30 safety-intervention stalls ($F_{\text{stall}}$) in active conditions $M_2$ and $M_4$. The planner discovered lift actions, but the p-CBF filter intervened at high frequency ($43.1\%$ in $M_2$, $41.5\%$ in $M_4$), suppressing vertical commands and trapping the policy in a safety limit cycle.

**Core Scientific Thesis of Remediation:**
> *Predicting contact-mode-conditioned uncertainty and acquiring boundary data are necessary but insufficient for autonomous manipulation. Safe closed-loop execution requires coordinating planner objective formulation and candidate proposal with runtime safety barrier intervention.*

---

## 2. Remediation Objectives & Research Questions

### 2.1 Remediation A: Task 1 Insertion Completion
- **Research Question A1:** Why do all 30 episodes across all five conditions terminate with $F_{\text{trunc}}$ near the hole entrance ($z \approx 0$ mm)?
- **Research Question A2:** Does the planner's reward function penalize insertion below $z=0$, or does chamfer clearance / wedging physically lock the peg?
- **Research Question A3:** When provided an uncorrupted downward progress reward and coordinated alignment guidance, does the model trained on actively mined data ($M_2/M_4$) achieve physical seating ($z \le -50$ mm) within the planning horizon?

### 2.2 Remediation B: Task 2 Safety-Filter Limit Cycle Resolution
- **Research Question B1:** What is the raw physical capability of the active planner when p-CBF intervention is disabled (unconstrained baseline)?
- **Research Question B2:** Why does the original p-CBF filter induce limit cycles between slip protection ($\text{slip} > 0.85 \Rightarrow a_{\text{lift}} = 0$) and crush protection ($F_n > 20 \text{ N} \Rightarrow \text{squeeze} = 0$)?
- **Research Question B3:** Can a tuned p-CBF filter (with velocity damping rather than hard zero-clamping) or a recovery-aware planner eliminate limit-cycle stalls while strictly preserving physical safety constraints ($F_n \le 25$ N, $\text{slip} \le 1.0$)?

---

## 3. Experimental Architecture & Matched Configurations

### 3.1 Task 1: Diagnostic Protocol
We evaluate the frozen $M_0$ through $M_4$ models under:
1. **Corrupted vs. Corrected Objective Landscape:**
   - *Corrupted (Baseline):* $R(s) = -(2 \cdot \text{lat} + 1.5 \cdot \max(0, z) - 5.0 \cdot \min(0, z) + 0.1 \cdot \|F\|)$ (actively penalizes $z < 0$).
   - *Corrected (Linear Progress):* $R(s) = -(2 \cdot \text{lat} + 1.5 \cdot \max(0, z) + 5.0 \cdot \min(0, z) + 0.1 \cdot \|F\|)$ (rewards downward depth $-z$).
   - *Seating-Guided:* $R(s) = 5.0 \cdot \max(0, -z) - 2.0 \cdot \text{lat} - 0.5 \cdot \text{tilt} - 0.05 \cdot \|F\| + 100 \cdot \mathbb{I}(\text{seated})$.
2. **Horizon Sensitivity:** $H \in \{25, 40, 60\}$ steps.
3. **Safety Interaction:** Evaluation with p-CBF ON vs. OFF.
4. **Metrics:**
   - Insertion Depth Distribution (mean, median, max, std mm).
   - Seating Completion Rate ($k/N$, % with 95% Wilson CI).
   - Contact stratum progression (Free $\rightarrow$ Chamfer $\rightarrow$ Sliding $\rightarrow$ Seating vs. Wedging).

### 3.2 Task 2: Four Matched Configurations
To isolate the cause of safety-intervention stalls, all five model conditions ($M_0$ to $M_4$) are evaluated under four distinct safety configurations across 30 held-out test episodes:

| Configuration ID | Name | Safety Mechanism | Planner Behavior | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **C1** | **p-CBF Disabled** | None (Open safety) | Standard CEM | Measures raw unconstrained planner capability and baseline violation rate |
| **C2** | **Original p-CBF** | Hard zero-clamp ($a_{\text{lift}} = 0$ if slip $> 0.85$; $a_{\text{sqz}} = 0$ if $F_n > 20$ N) | Standard CEM | Reproduces P2.5 baseline limit cycle and stall behavior |
| **C3** | **Tuned Smooth p-CBF** | Proportional slip damping: $a_{\text{lift}} \leftarrow a_{\text{lift}} \cdot \max(0, \frac{1.0 - \text{slip}}{0.20})$, smooth squeeze saturation | Standard CEM | Eliminates discontinuous limit cycles while enforcing hard barrier bounds |
| **C4** | **Recovery-Aware Planner + p-CBF** | Tuned p-CBF filter | CEM with safety rejection feedback: when candidate violates barrier, CEM penalizes candidate by $-\lambda_{\text{safety}}$ and resamples toward higher preload | Evaluates bidirectional planner-safety coordination |

---

## 4. Required Metrics & Audit Requirements

Every experiment in P2.5 remediation must report:
1. **Task Performance:**
   - Success Rate: Exact integer fraction $k/N$ and 95% Wilson score confidence interval $[L, U]\%$.
   - Goal Progress: Mean, median, max, and standard deviation.
   - Time to Success: Step index at completion.
2. **Safety Diagnostics:**
   - Physical Violation Rate: Fractured into force limit violations ($F > 35$ N), torque violations ($\tau > 7$ Nm), and crush damage ($F_n > 25$ N).
   - Total Interventions: Count and rate per decision step.
   - Consecutive Interventions: Maximum consecutive intervention streak per episode.
   - Stall Rate: Fraction of episodes stalling ($k/N$ with Wilson CI).
   - Recovery Success Rate: Fraction of intervened episodes that successfully recovered and resumed progress.
3. **Failure Taxonomy (5 Classes):**
   - $F_{\text{trunc}}$: Temporal truncation.
   - $F_{\text{slip}}$: Gross slip / dropped object.
   - $F_{\text{jam}}$: Jamming / wedging lockout.
   - $F_{\text{stall}}$: Safety intervention stall.
   - $F_{\text{crush}}$: Dynamic crush / structural force violation.

---

## 5. Decision Gate for P2.5 Remediation

| Gate Criterion | Target Metric |
| :--- | :--- |
| **G1. Task 1 Diagnosis** | Root cause of $F_{\text{trunc}}$ empirically isolated and documented |
| **G2. Task 1 Completion** | At least one condition demonstrates successful seating ($z \le -50$ mm) under corrected objective |
| **G3. Task 2 Raw Capability** | C1 (p-CBF disabled) establishes raw planner lift capability without filter suppression |
| **G4. Task 2 Stall Resolution** | C3 or C4 reduces safety-intervention stalls by $\ge 70\%$ relative to C2 |
| **G5. Zero Physical Violations** | Safe configurations (C2, C3, C4) maintain 0 observed hard violations |
| **G6. Statistical Rigor** | Exact integer counts and 95% Wilson CIs for all rates |

