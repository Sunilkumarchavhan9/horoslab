# HOROS PROBE-1 — S4 Sensor Noise, Autocorrelation & SNR Analysis

**Document Identifier:** `HOROS-P1-R002-S4-SENSOR-NOISE-SNR-ANALYSIS`  
**Date:** 2026-11-20  
**Phase:** Stage 3.3 Research Qualification / S4 Experimental Gate  
**Author:** HOROS Physical Intelligence Research Group  
**Status:** **STATISTICAL & SIGNAL INTEGRITY REPORT**  

---

### 1. The Sensor Noise Formulation

In [`CompliantPreLiftContactEnv._get_obs()`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/environment/compliant_prelift_env.py#L536-L547), tactile sensor readings are corrupted by a stationary first-order autoregressive AR(1) noise process:

$$\mathbf{n}_t = \rho_1 \mathbf{n}_{t-1} + \boldsymbol{\epsilon}_t, \quad \boldsymbol{\epsilon}_t \sim \mathcal{N}\left(0, \; \sigma^2 (1 - \rho_1^2)\right)$$

- Autoregressive parameter: $\rho_1 = 0.1355$
- Normal force noise standard deviation: $\sigma_n = 0.015\text{ N}$
- Tangential force noise standard deviation: $\sigma_t = 0.008\text{ N}$

---

### 2. Theoretical vs. Effective Signal-to-Noise Ratio (SNR)

#### 2.1 The Theoretical Signal
The maximum possible friction signal in State S4 is the difference between full equilibrium hold ($F_t = W/4$) and the lower bound of the deadband ($0.98 W/4$):

$$\Delta F_{\text{signal}} = 0.02 \cdot \frac{m_{\text{obj}} g}{4}$$

For the four experimental masses:
- $m = 0.30\text{ kg}$: $\Delta F_{\text{signal}} = 0.0147\text{ N/finger}$ ($0.0588\text{ N}$ total)
- $m = 0.40\text{ kg}$: $\Delta F_{\text{signal}} = 0.0196\text{ N/finger}$ ($0.0785\text{ N}$ total)
- $m = 0.50\text{ kg}$: $\Delta F_{\text{signal}} = 0.0245\text{ N/finger}$ ($0.0981\text{ N}$ total)
- $m = 0.60\text{ kg}$: $\Delta F_{\text{signal}} = 0.0294\text{ N/finger}$ ($0.1177\text{ N}$ total)

#### 2.2 Effective Sample Size Under AR(1) Autocorrelation
For an AR(1) process with positive lag-1 autocorrelation $\rho_1 = 0.1355$, successive samples are not statistically independent. The variance of the sample mean over an observation window of $N$ steps is:

$$\text{Var}(\bar{X}_N) = \frac{\sigma_t^2}{N_{\text{eff}}}, \quad \text{where} \quad N_{\text{eff}} = \frac{N}{1 + 2 \sum_{k=1}^{N-1} \left(1 - \frac{k}{N}\right) \rho_1^k} \approx N \frac{1 - \rho_1}{1 + \rho_1}$$

For $\rho_1 = 0.1355$:
$$\frac{1 - \rho_1}{1 + \rho_1} = \frac{0.8645}{1.1355} \approx 0.7614$$

The effective sample size and standard error of the mean across different window lengths are:

| Window Length ($N$) | Effective Size ($N_{\text{eff}}$) | Noise Standard Error ($\sigma_{\bar{F}}$) | Theoretical SNR ($m=0.30\text{ kg}$) | Theoretical SNR ($m=0.60\text{ kg}$) |
| :---: | :---: | :---: | :---: | :---: |
| **$N = 1$ step (Instantaneous)** | $1.00$ | $0.0080\text{ N}$ | $\text{SNR} = 1.84$ | $\text{SNR} = 3.68$ |
| **$N = 5$ steps ($50\text{ ms}$)** | $3.81$ | $0.0041\text{ N}$ | $\text{SNR} = 3.59$ | $\text{SNR} = 7.17$ |
| **$N = 10$ steps ($100\text{ ms}$)** | $7.61$ | $0.0029\text{ N}$ | $\text{SNR} = 5.07$ | $\text{SNR} = 10.14$ |

---

### 3. The Fatal Empirical Obstacle: Window Truncation

While a 10-step window mathematically yields an adequate $\text{SNR} \approx 5.1$, our empirical diagnostic revealed that:

$$\text{Actual Duration of State S4 in Dynamic Execution} = 0 \text{ steps}$$

Because the grasp immediately collapses from State S3 into Coulomb slip ($S < 0.98$ or candidate shear violation) within a single step:
- The actual realizable observation window is $N_{\text{actual}} = 0$.
- No multi-step averaging can occur.
- An instantaneous measurement ($N=1$) has $\text{SNR} \approx 1.84$, which falls below the scientific detection floor ($\text{SNR} \ge 3.0$).

### 4. Conclusion

Under the exact AR(1) sensor noise process, the theoretical S4 signal is statistically marginal in a single frame ($\text{SNR} < 2.0$) and physically unreachable over multi-frame windows due to instantaneous boundary traversal.
