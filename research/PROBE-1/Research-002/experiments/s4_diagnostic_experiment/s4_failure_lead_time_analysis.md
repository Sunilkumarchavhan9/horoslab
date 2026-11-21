# HOROS PROBE-1 — S4 Failure Lead Time & Event Decomposition Analysis

**Document Identifier:** `HOROS-P1-R002-S4-LEAD-TIME-ANALYSIS`  
**Date:** 2026-11-20  
**Phase:** Stage 3.3 Research Qualification / S4 Experimental Gate  
**Author:** HOROS Physical Intelligence Research Group  
**Status:** **TEMPORAL & LEAD-TIME DECOMPOSITION REPORT**  

---

### 1. Multi-Milestone Lead Time Architecture

A single scalar lead time cannot capture the progression of contact failure. HOROS evaluates four distinct, physically grounded lead-time intervals relative to the decision timestamp $t_{\text{dec}}$:

$$\tau_{\text{S4}} = t_{\text{S4}} - t_{\text{dec}} \quad \text{(Lead time to S4 equilibrium clamp)}$$
$$\tau_{\text{insuff}} = t_{\text{insuff}} - t_{\text{dec}} \quad \text{(Lead time to theoretical friction insufficiency)}$$
$$\tau_{\text{slip}} = t_{\text{slip}} - t_{\text{dec}} \quad \text{(Lead time to first genuine Coulomb slip)}$$
$$\tau_{\text{drop}} = t_{\text{drop}} - t_{\text{dec}} \quad \text{(Lead time to terminal object drop)}$$

---

### 2. Empirical Event Chronology Across Failing Trajectories

In the diagnostic experiment, whenever friction capacity was insufficient to maintain hold ($S = \mu F_N / W < 1.0$), the temporal progression exhibited the following measured milestones:

#### Case A: Insufficient Capacity Before Liftoff (e.g. Cell M1_F1, M2_F1, M3_F1, M4_F1)
- $t = 0 \to 1$: Fingertips squeeze to $F_N \approx 11.20\text{ N}$.
- $t = 2 \to 9$: Arm commands upward velocity ($v_{\text{arm}} = 5\text{ mm/s}$). Pad stretch increases.
- $t = 10$: Shear force reaches $\mu_{\text{true}} F_N = 2.688\text{ N} < W = 2.942\text{ N}$.
  - Coulomb slip occurs: $\dot{\delta} = 0.0005\text{ m/s}$. ($t_{\text{slip}} = 10$).
  - Liftoff condition ($F_t > W$) is never met ($t_{\text{liftoff}} = \infty$).
  - Object remains on table ($z_{\text{obj}} = 0$).
  - Drop never occurs because object never became airborne ($t_{\text{drop}} = \infty$).
  - **Result:** $t_{\text{S4}} = \text{None}, t_{\text{slip}} = 10, t_{\text{drop}} = \text{None}$.

#### Case B: In-Flight Degradation (Protocol 2: In-Flight Relaxation)
- $t = 0 \to 10$: Liftoff achieved at high clamp ($F_N = 11.20\text{ N}$, $z_{\text{obj}} = 0.15\text{ mm}$).
- $t = 15 \to 25$: Clamping force relaxed gradually.
- $t = 25$: $F_N = 8.56\text{ N}$, $\mu F_N = 3.08\text{ N} > W = 2.94\text{ N}$ ($S = 1.047$). Sticking hold maintained.
- $t = 26$: Squeeze relaxed by $0.015\text{ mm}$.
  - Stored pad stretch produces candidate shear $F_t = W/4 = 0.735\text{ N}$.
  - Available static friction drops to $\mu F_{n,i} = 0.36 \times 2.025 = 0.729\text{ N}$.
  - Candidate shear exceeds static limit ($0.735 > 0.729\text{ N}$).
  - Coulomb slip triggers instantly: $\dot{\delta} = 0.0010\text{ m/s}$ ($t_{\text{slip}} = 26$).
  - Support insufficiency occurs simultaneously ($t_{\text{insuff}} = 26$).
  - Drop branch is triggered ($a_z = -9.81\text{ m/s}^2$).
- $t = 28$: Object strikes table ($z_{\text{obj}} \le 10^{-6}\text{ m}$), triggering $t_{\text{drop}} = 28$.

---

### 3. Quantitative Lead Time Breakdown

| Prediction Rule | Lead Time vs S4 ($\tau_{\text{S4}}$) | Lead Time vs Insufficiency ($\tau_{\text{insuff}}$) | Lead Time vs Slip ($\tau_{\text{slip}}$) | Lead Time vs Terminal Drop ($\tau_{\text{drop}}$) | Scientific Validity |
| :---: | :---: | :---: | :---: | :---: | :--- |
| **Proactive Pre-Slip Model** ($t_{\text{dec}} \le 25$) | Undefined ($t_{\text{S4}}$ never occurs) | $\tau_{\text{insuff}} \ge 1\text{ step}$ ($10\text{ ms}$) | $\tau_{\text{slip}} \ge 1\text{ step}$ ($10\text{ ms}$) | $\tau_{\text{drop}} \ge 3\text{ steps}$ ($30\text{ ms}$) | **UNSOUND.** Pre-slip observations are 100% invariant to $\mu$; prediction is chance or mass confounding. |
| **Reactive Slip Detector** ($t_{\text{dec}} = 26$) | Undefined | $\tau_{\text{insuff}} = 0\text{ steps}$ | $\tau_{\text{slip}} = 0\text{ steps}$ ($0\text{ ms}$) | $\tau_{\text{drop}} = 2\text{ steps}$ ($20\text{ ms}$) | **VALID REACTIVE DETECTION.** Fires on actual slip onset; gives $20\text{ ms}$ warning before table impact. |
| **Post-Failure Latch** ($t_{\text{dec}} \ge 28$) | Undefined | $\tau_{\text{insuff}} < 0$ | $\tau_{\text{slip}} < 0$ | $\tau_{\text{drop}} \le 0\text{ steps}$ | **RETROACTIVE.** Classifies a completed drop. |

---

### 4. Conclusion

1. **Lead Time Relative to Slip is Zero:** Any scientifically grounded detector that does not rely on random guessing or mass confounding achieves $\tau_{\text{slip}} = 0\text{ steps}$. True pre-slip forecasting lead time ($\tau_{\text{slip}} > 0$) is zero.
2. **Lead Time Relative to Terminal Drop is 1–2 Steps ($10–20\text{ ms}$):** The reactive detection of slip provides a very short $10–20\text{ ms}$ window before the falling workpiece impacts the table surface. This is insufficient for high-level replanning, but sufficient for an emergency reactive clamp reflex.
