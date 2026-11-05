# HOROS PROBE-1 — Research-002
# Formal Decision Gate Audit: Criteria Evaluation & Phase 2 Authorization

**Document ID:** HOROS-PROBE1-R002-DOC-08  
**Project:** HOROS PROBE-1 — Humanoid Robotics  
**Topic:** Trustworthy Action-Conditioned Contact World Models  
**Status:** Step 6 Decision Gate Approved  
**Charter Reference:** Section 12 (Decision Gate)  
**Author:** HOROS Research Team  

---

## 1. Decision Gate Mandate

Section 12 of Research Charter v0.1 specifies:
> *"Proceed to a new method only if the baseline experiment demonstrates at least one reproducible failure that existing baselines do not adequately resolve... If existing methods already solve the measured problem, revise the research question rather than manufacture novelty."*

This audit formally assesses the four pre-registered failure criteria against the empirical evidence recorded in [`07-empirical-stress-test-results.md`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/07-empirical-stress-test-results.md).

---

## 2. Evaluation of the 4 Pre-Registered Criteria

### Criterion 1: Conditional uncertainty becomes miscalibrated around contact transitions
- **Audit Finding:** **PASSED / CONFIRMED.**
- **Empirical Evidence:** In Task 1, state RMSE under passive behavioral data is only $0.496\,\text{mm}$. However, during two-point wedging transitions ($\Sigma_3$), state prediction error increases by **$3.7\times$** ($1.852\,\text{mm}$), and normal force error increases by **$4.8\times$**. Standard conformal prediction calibrated marginally across all transitions under-covers contact onset by $24.2\%$, confirming that calibration must be strictly conditioned on the physical contact manifold.

---

### Criterion 2: Planner-selected actions have significantly worse error or risk than behavior-distribution actions
- **Audit Finding:** **PASSED / CONFIRMED.**
- **Empirical Evidence:**
  - *Passive Behavior:* $0.0\%$ safety violations, $\text{RMSE} = 0.496\,\text{mm}$, $\text{PEG} = -28.13$.
  - *CEM Planner Search (ContactWorld baseline):* $\text{PEG} = +19.99$ (In-Distribution), surging to **$+58.76$** under Physical OOD.
  - *Safety Violations:* Jumped from $0.0\%$ to **$20.0\%$** under Transition Stress.
  - The optimizer systematically selects candidate actions in the tail distribution where the world model is blind to wedging boundaries.

---

### Criterion 3: Standard uncertainty penalties fail to detect model exploitation
- **Audit Finding:** **PASSED / CONFIRMED.**
- **Empirical Evidence:** The deep ensemble penalty of Li et al. (2025/2026) still incurred a **$6.7\%$ safety violation rate** in the In-Distribution regime. Because all ensemble members share smooth continuous MLP backbones, they jointly underestimate the discontinuous contact force step-jump, causing the variance $\sigma_{\text{ens}}$ to remain low despite imminent jamming.

---

### Criterion 4: A safety filter reduces violations without unacceptable conservatism
- **Audit Finding:** **PASSED / CONFIRMED.**
- **Empirical Evidence:** The independent Predictive Control Barrier Function (p-CBF) filter reduced safety violations to **strictly $0.0\%$** across all test regimes while achieving higher realized returns ($-10.91$ vs. $-24.49$ for ContactWorld) by converting catastrophic jams into compliant sliding corrections.

---

## 3. Formal Gate Verdict & Authorized Phase 2 Next Steps

| Gate Criterion | Status | Primary Evidence |
| :--- | :--- | :--- |
| 1. Contact Transition Miscalibration | **CONFIRMED** | $3.7\times$ RMSE spike at wedging boundary $\Sigma_3$ |
| 2. Planner Selection Exploitation | **CONFIRMED** | PEG $+58.76$, violations spike to $20.0\%$ |
| 3. Failure of Standard Ensemble Penalty | **CONFIRMED** | Li et al. incurs $6.7\%$ violations due to joint underestimation |
| 4. Viability of Independent Runtime Filter | **CONFIRMED** | p-CBF achieves $0.0\%$ violations across 90 evaluations |

### Official Verdict:
**DECISION GATE PASSED (UNANIMOUS APPROVAL).**  
The baseline stress test has established the existence of a reproducible, high-impact scientific gap that neither ContactWorld (deterministic) nor Li et al. (Gaussian ensemble) nor CaPTURe (single-step passive conformal) adequately resolves.

### Phase 2 Authorized Objectives:
1. Formulate the **Contact-Stratified Conformalized Dynamics (CSCD)** architecture, integrating contact mode classification heads with multi-step conformal bounds.
2. Formulate **Active Contact Mode Mining (ACMM)**: an offline active learning algorithm that oversamples transitions near the Coulomb friction boundary and critical wedging angle.
3. Integrate the validated **Predictive Control Barrier Function (p-CBF)** runtime assurance layer into the official HOROS PROBE-1 manipulation library.
4. Scale up the evaluation on full Isaac Lab 2.3 GPU environments for paper preparation.
