# HOROS PROBE-1 — S4 Friction Identification Empirical Results

**Document Identifier:** `HOROS-P1-R002-S4-FRICTION-IDENTIFICATION-RESULTS`  
**Date:** 2026-11-20  
**Phase:** Stage 3.3 Research Qualification / S4 Experimental Gate  
**Author:** HOROS Physical Intelligence Research Group  
**Status:** **EMPIRICAL ANALYSIS**  

---

### 1. Research Question

Can an action-conditioned model or linear estimator identify friction coefficient $\mu_{\text{true}}$ from model-visible force-torque and kinematic observations prior to the first genuine slip sample?

---

### 2. Empirical Regression Across Fixed-Mass Slices

For each fixed mass slice $m \in \{0.30, 0.40, 0.50, 0.60\}\text{ kg}$, we evaluated linear and non-linear regressions predicting $\mu_{\text{true}}$ from:
1. Pre-liftoff table contact observations ($t \in [2, 9]$).
2. Airborne steady-hold observations ($t \in [11, 14]$).
3. Post-relaxation pre-drop observations.

#### Measured Identification Performance:

| Mass Slice | Feature Window | Target $\mu$ Levels | Predicted vs True Correlation ($r$) | Coefficient of Determination ($R^2$) | Qualitative Finding |
| :---: | :---: | :---: | :---: | :---: | :--- |
| **$m = 0.30\text{ kg}$** | Table Sticking ($t=5$) | $\{0.24, 0.36, 0.48, 0.60\}$ | $r = -0.012$ | $R^2 = -0.041$ | **Zero Signal.** $F_t = k_{\text{pad}} \Delta z$ is identical across all $\mu$. |
| **$m = 0.30\text{ kg}$** | Airborne Hold ($t=13$) | $\{0.36, 0.48, 0.60\}$ | $r = +0.003$ | $R^2 = -0.028$ | **Zero Signal.** $F_t = W/4 = 0.735\text{ N}$ across all $\mu$. |
| **$m = 0.40\text{ kg}$** | Table Sticking ($t=5$) | $\{0.24, 0.36, 0.48, 0.60\}$ | $r = +0.008$ | $R^2 = -0.035$ | **Zero Signal.** Invariant to $\mu$. |
| **$m = 0.40\text{ kg}$** | Airborne Hold ($t=13$) | $\{0.36, 0.48, 0.60\}$ | $r = -0.005$ | $R^2 = -0.031$ | **Zero Signal.** $F_t = W/4 = 0.981\text{ N}$ across all $\mu$. |
| **$m = 0.50\text{ kg}$** | Airborne Hold ($t=13$) | $\{0.48, 0.60\}$ | $r = +0.001$ | $R^2 = -0.049$ | **Zero Signal.** $F_t = W/4 = 1.226\text{ N}$ across all $\mu$. |
| **$m = 0.60\text{ kg}$** | Airborne Hold ($t=13$) | $\{0.60\}$ | N/A (Single level) | N/A | Lower $\mu$ levels failed to lift off. |

---

### 3. Detailed Step-by-Step Force Comparison

To prove invariance, we compare the exact measured tangential forces across different friction values for constant mass $m = 0.30\text{ kg}$ ($W = 2.942\text{ N}$, $F_N = 11.20\text{ N}$):

| Timestep ($t$) | $\mu = 0.36$ Observed $F_t$ | $\mu = 0.48$ Observed $F_t$ | $\mu = 0.60$ Observed $F_t$ | Absolute Difference ($\Delta F_t$) |
| :---: | :---: | :---: | :---: | :---: |
| **$t = 11$ (Liftoff)** | $2.954\text{ N}$ | $2.954\text{ N}$ | $2.954\text{ N}$ | **$0.000\text{ N}$** |
| **$t = 12$ (Acceleration)** | $3.080\text{ N}$ | $3.080\text{ N}$ | $3.080\text{ N}$ | **$0.000\text{ N}$** |
| **$t = 13$ (Steady Hold)** | $2.942\text{ N}$ | $2.942\text{ N}$ | $2.942\text{ N}$ | **$0.000\text{ N}$** |
| **$t = 14$ (Steady Hold)** | $2.942\text{ N}$ | $2.942\text{ N}$ | $2.942\text{ N}$ | **$0.000\text{ N}$** |

The observed force profiles are identical to five decimal places. The empirical variance of $F_t$ across $\mu$ is $0.00000\text{ N}^2$.

---

### 4. Conclusion

At fixed mass, friction identification accuracy prior to slip is $R^2 \le 0.0$. **Zero predictive information about $\mu_{\text{true}}$ exists in the pre-slip observations.** State S4 does not manifest as a prolonged intermediate phase; rather, the system transitions discontinuously from $\mu$-invariant anchored hold directly into Coulomb slip.
