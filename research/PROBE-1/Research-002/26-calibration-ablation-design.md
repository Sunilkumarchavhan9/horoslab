# HOROS PROBE-1 — Research-002
## Stage P2.5: Calibration Ablation Design & Component Attribution
**Program:** HOROS PROBE-1 — Humanoid Robotics & Physical AI  
**Project:** Research-002: Trustworthy Action-Conditioned Contact World Models  
**Document:** 26-calibration-ablation-design.md  
**Status:** Algorithmic Specification  

---

## 1. Objective of the Calibration Ablation

To determine whether performance improvements in Stage P2.5 originate from:
1. **The training data (ACMM mining):** Better dynamic coverage of friction and wedging boundaries.
2. **The calibration engine (CMS-PSACD):** Selection-aware, mode-stratified uncertainty quantification.

Without a matched ablation holding the dataset and world model weights fixed while toggling the calibration engine, the scientific contribution of CMS-PSACD cannot be independently isolated.

---

## 2. Matched Ablation Configuration

For every model trained on datasets $D_0$ through $D_4$, we evaluate two conformal calibration configurations:

### Configuration A: CMS-PSACD (Proposed Full Method)
- **Selection-Aware:** Calibrated on counterfactual open-loop outcomes of the identical planner (**Target A**).
- **Contact-Mode Stratified:** Solves separate nonconformity quantiles $q_c^{(m)}$ for each of the 7 initial contact modes:
  $$\Sigma = \{\text{Free}, \text{FirstContact}, \text{Sticking}, \text{Sliding}, \text{Impact}, \text{Jamming}, \text{Release}\}$$
- **Simultaneous Trajectory Score:** $S_c(i) = \max_{t, h} r_c(i, t, h)$.
- **Finite-Sample Quantile:** $k = \lceil(n+1)(1 - \alpha/3)\rceil$ for joint Bonferroni coverage.

### Configuration B: Unstratified Split Conformal (Baseline Ablation)
- **Unstratified:** Single global scalar quantile $q_{\text{global}}$ computed across all contact modes without mode separation.
- **Passive Calibration:** Quantiles solved on passive exploration rollouts rather than planner-matched rollouts.
- **Identical Level:** Target confidence $1 - \alpha = 90.0\%$.

---

## 3. Isolating Component Contributions

Let $C(\mathcal{D}, \mathcal{M})$ denote the empirical joint simultaneous coverage, and $W(\mathcal{D}, \mathcal{M})$ denote the prediction interval width:

1. **Active Data Gain:**
   $$\Delta_{\text{data}} = C(D_{\text{mined}}, \text{CMS-PSACD}) - C(D_0, \text{CMS-PSACD})$$
2. **Calibration Engine Gain:**
   $$\Delta_{\text{calib}} = C(D_{\text{mined}}, \text{CMS-PSACD}) - C(D_{\text{mined}}, \text{Unstratified})$$
3. **Efficiency Impact:**
   $$\Delta_{\text{width}} = W(D_{\text{mined}}, \text{CMS-PSACD}) - W(D_{\text{mined}}, \text{Unstratified})$$

This formulation guarantees full attribution of experimental outcomes.

