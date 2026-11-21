# HOROS PROBE-1 — S4 Mass Confounding & Decoupling Analysis

**Document Identifier:** `HOROS-P1-R002-S4-MASS-CONFOUNDING-ANALYSIS`  
**Date:** 2026-11-20  
**Phase:** Stage 3.3 Research Qualification / S4 Experimental Gate  
**Author:** HOROS Physical Intelligence Research Group  
**Status:** **ANALYTICAL & EMPIRICAL DECOUPLING REPORT**  

---

### 1. Executive Summary

This report investigates the central confounding mechanism in contact failure prediction: **the confusion between latent workpiece mass $m_{\text{obj}}$ and interface friction $\mu_{\text{true}}$**. 

Our diagnostic reveals that:
1. **Mass is 100% physically identifiable** during steady airborne hold: $F_{t,z} = m_{\text{obj}} g$. Across the diagnostic grid, mass estimation achieves $R^2 = 0.9994$ and Pearson $r = 0.9998$.
2. **Friction is 0% identifiable** prior to slip: $R^2 \le 0.0$.
3. **The Confounding Illusion:** Any machine learning model trained on un-controlled datasets will learn to associate higher mass with higher failure probability ($S = \mu F_N / m g$), creating a superficial appearance of "predicting failure" while having learned strictly zero representation of friction.

---

### 2. Empirical Mass Identification at Fixed Friction

Across all trajectories where liftoff was attained, we regressed $m_{\text{obj}}$ onto the observed steady-state shear force $F_{t,z}$:

| Fixed Friction ($\mu$) | Available Mass Range | Observed Mean Shear Force ($F_t$) | Mass Estimation $R^2$ | Correlation ($r$) |
| :---: | :---: | :---: | :---: | :---: |
| **$\mu = 0.48$** | $0.30\text{ kg} \to 0.50\text{ kg}$ | $2.942\text{ N} \to 4.903\text{ N}$ | **$R^2 = 0.9998$** | $r = 0.9999$ |
| **$\mu = 0.60$** | $0.30\text{ kg} \to 0.60\text{ kg}$ | $2.942\text{ N} \to 5.884\text{ N}$ | **$R^2 = 0.9999$** | $r = 1.0000$ |

#### Mechanism of Mass Identifiability
During airborne hold (State S3), the physical force balance enforces:
$$F_{t,z} = \sum_{i=0}^3 F_{t,z,i} = m_{\text{obj}}(g + a_z)$$
For constant arm velocity ($a_z = 0$), $F_{t,z} = m_{\text{obj}} g$. 
Dividing total observed shear force by $g = 9.80665\text{ m/s}^2$ yields an exact, closed-form mass estimator:
$$\hat{m}_{\text{obj}} = \frac{\sum_{i} F_{t,z,i}}{9.80665}$$
This confirms why Phase 3.7.3 Gate T2 achieved $R^2 = 0.6537$ on 60 episodes: it was performing an analytical $F_z / g$ weighing operation, not learning a latent world model parameter.

---

### 3. The Confounding Mechanism

#### The Danger of Marginal Statistics
In the $4 \times 4$ factorial grid, the probability of liftoff failure and slip correlates strongly with mass:
- For $m = 0.30\text{ kg}$: 3 of 4 friction levels ($75\%$) lift off successfully.
- For $m = 0.40\text{ kg}$: 3 of 4 friction levels ($75\%$) lift off successfully.
- For $m = 0.50\text{ kg}$: 2 of 4 friction levels ($50\%$) lift off successfully.
- For $m = 0.60\text{ kg}$: 1 of 4 friction levels ($25\%$) lifts off successfully.

A model evaluating $P(\text{failure})$ that reads only the observable shear force $F_t$ will achieve high AUROC simply by predicting:
$$P(\text{failure}) \propto F_t$$
Because higher $F_t$ indicates higher mass $m_{\text{obj}}$, which directly correlates with higher failure rate under fixed clamping force.

#### The Decoupling Proof: Iso-Safety Contrasts
To prove that a world model is actually estimating friction rather than mass, it must correctly predict stability on the **iso-safety diagonal** where the safety factor $S = \frac{\mu F_N}{m_{\text{obj}} g}$ is identical:

| Iso-Safety Pair | Parameters | Safety Margin ($S$) | True Stability | Model Failure Prediction If Mass-Confounded |
| :---: | :---: | :---: | :---: | :---: |
| **Pair A** | $m=0.30\text{ kg}, \mu=0.36$ | $S = 1.37$ | **Stable Hold** | Predicts High Stability (Low $F_t = 2.94\text{ N}$) |
| **Pair B** | $m=0.50\text{ kg}, \mu=0.60$ | $S = 1.37$ | **Stable Hold** | **Falsely Predicts High Risk** (High $F_t = 4.90\text{ N}$) |

A mass-confounded model assigns vastly different failure risks to Pair A and Pair B despite their identical physical stability margins.

---

### 4. Classification & Guidance

The diagnostic formally rules:
- **Mass identification:** Scientifically sound, robust, and physically verified ($R^2 > 0.99$).
- **Friction identification:** Refuted in pre-slip states ($R^2 \le 0.0$).
- **Conclusion:** Any apparent pre-slip failure prediction in this simulator is an artifact of **mass confounding**.
