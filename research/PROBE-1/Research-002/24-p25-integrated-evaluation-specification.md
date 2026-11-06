# HOROS PROBE-1 — Research-002
## Stage P2.5: Five-Way Integrated Evaluation — Specification
**Program:** HOROS PROBE-1 — Humanoid Robotics & Physical AI  
**Project:** Research-002: Trustworthy Action-Conditioned Contact World Models  
**Stage:** P2.5 — Five-Way Integrated Evaluation  
**Status:** Frozen Specification & Evaluation Architecture  
**Date:** 6 November 2026  
**Reference Snapshots:** Commit `b652b415` (P2.3 Baseline) & Commit `14b69b3f` (P2.4 Active Mining)  

---

## 1. Executive Summary & Research Objective

Stage P2.5 represents the synthesis milestone of Research-002. While Stage P2.3 validated statistical calibration under planner selection (**PSACD**) and Stage P2.4 validated physical contact boundary data acquisition (**ACMM**), Stage P2.5 evaluates the **integrated system**:

$$\text{Integrated Architecture} = \text{CMS-PSACD} + \text{ACMM} + \text{p-CBF Runtime Filter}$$

### Central Research Question
> *Does integrating contact-mode-stratified, planner-selection-aware conformal dynamics (CMS-PSACD) with actively mined contact-transition data improve prediction reliability, planner decision quality, and safe manipulation performance over frozen P2.3 baselines and alternative data-collection strategies?*

---

## 2. Synthesis of Stage P2.4 Findings & Scientific Qualifications

Stage P2.4 established the first successful physical manipulation in Research-002:
- **Task 2 (Multifinger Lift):** Contact-boundary sampling ($D_2$) achieved **16/30 (53.33%, 95% CI: [36.14, 69.77]%)** closed-loop task success with a peak elevation of **9.77 mm**, compared to **0/30 (0.0%)** for passive ($D_0$) and random exploration ($D_1$).
- **Prediction Improvements:** State RMSE dropped by approximately **39.1%** ($1.3248 \to 0.8066$), force RMSE dropped by **27.7%** ($0.8709 \to 0.6307$ N), and 7-mode classification macro-F1 improved by **12.7×** ($0.0189 \to 0.2397$).

### Critical Qualifications Investigated in Stage P2.5

1. **Acquisition Signal Dilution in $D_4$:**  
   In Stage P2.4, strategy $D_2$ achieved 16/30 success, whereas $D_4$ (Combined ACMM with equal 20% weights) achieved 0/30 success. Equal signal weighting diluted the critical friction-cone boundary concentration with uninformative exploration samples. Stage P2.5 investigates this trade-off by comparing pure boundary sampling ($D_2$) against calibrated combined weighting ($D_4^*$).

2. **Task 1 Insertion Completion:**  
   Extending the evaluation horizon to 25 steps corrected the temporal truncation bottleneck of Stage P2.3. However, Task 1 achieved a maximum insertion progress of $0.67$ mm under $D_2$, but did not achieve full $50.0$ mm seating. Stage P2.5 evaluates whether selection-aware uncertainty penalties guide the planner through the chamfer corridor to achieve full seating.

3. **Empirical Nature of Safety Claims:**  
   Zero observed safety violations in 30 test episodes represents positive empirical evidence, not a formal mathematical certificate. Stage P2.5 independently audits the intervention rate, boundary margins, and potential conservatism induced by the p-CBF filter.

---

## 3. Five-Way Integrated Evaluation Design

We evaluate five data-collection regimes combined with the full CMS-PSACD conformal calibration engine and p-CBF safety filter under identical compute budgets:

| Condition ID | Training Dataset | World Model | Calibration Engine | Safety Filter |
| :--- | :--- | :--- | :--- | :--- |
| **M0** | $D_0$ (Passive Baseline) | Hybrid Dynamics $f_\theta, C_\phi$ | CMS-PSACD (Target A/B) | Empirical p-CBF |
| **M1** | $D_1$ (Random Exploration) | Hybrid Dynamics $f_\theta, C_\phi$ | CMS-PSACD (Target A/B) | Empirical p-CBF |
| **M2** | $D_2$ (Boundary Sampling) | Hybrid Dynamics $f_\theta, C_\phi$ | CMS-PSACD (Target A/B) | Empirical p-CBF |
| **M3** | $D_3$ (Uncertainty & Disag.) | Hybrid Dynamics $f_\theta, C_\phi$ | CMS-PSACD (Target A/B) | Empirical p-CBF |
| **M4** | $D_4$ (Combined ACMM) | Hybrid Dynamics $f_\theta, C_\phi$ | CMS-PSACD (Target A/B) | Empirical p-CBF |

### Matched Calibration Ablation Control
To isolate how much improvement stems from **active data (ACMM)** versus **conformal calibration (CMS-PSACD)**, every condition is evaluated under two matched calibration regimes:
- **Calib-A (CMS-PSACD):** Full 7-mode stratified episode-level planner-selection-aware calibration.
- **Calib-B (P2.3 Unstratified Split Conformal):** Standard global split-conformal calibration on passive data without mode stratification.

### Safety Filter Control
Every condition is evaluated both with the empirical p-CBF filter **enabled** and **disabled** to quantify intervention rates and detect whether safety filtering induces task stalls.

---

## 4. Evaluation Targets & Metrics

1. **Target A vs Target B:**  
   - Target A: Open-loop planned candidate execution in counterfactual simulator clone.
   - Target B: Receding-horizon closed-loop execution with replanning at every decision.
2. **Prediction Reliability:** State RMSE, Wrench RMSE, Multi-horizon error at $H \in \{1, 3, 5, 10, 20\}$.
3. **Contact Calibration:** Marginal coverage, simultaneous trajectory coverage, prediction interval width ($2q$).
4. **Planner Reliability:** Planner Exploitation Gap ($\text{PEG} = \hat{J}_{\text{WM}} - J_{\text{sim}}$), Optimism rate.
5. **Manipulation Performance:** Success rate ($k/N$), 95% Wilson confidence intervals, Goal progress (mm), Stall rate.
6. **Safety:** Safety violation rate, p-CBF intervention frequency, false-rejection rate.

---

## 5. Frozen Provenance & Test Set Isolation

- **P2.3 Snapshot:** Commit `b652b415` preserved as frozen historical reference.
- **P2.4 Snapshot:** Commit `14b69b3f` preserved.
- **Zero Test Leakage:** The final 30 test episodes remain strictly untouched during training, calibration, and threshold solving.

