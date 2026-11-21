# HOROS PROBE-1 — S4 Airborne Friction Observability Diagnostic Report

**Document Identifier:** `HOROS-P1-R002-S4-DIAGNOSTIC-EXPERIMENT-REPORT`  
**Date:** 2026-11-20  
**Phase:** Stage 3.3 Research Qualification / S4 Experimental Gate  
**Author:** HOROS Physical Intelligence Research Group  
**Status:** **EXPERIMENTAL EVIDENCE COMPLETE**  
**Classification:** **`SIMULATOR_ARTIFACT_ONLY` / `NO_RELIABLE_SIGNAL`**  

---

### 1. Executive Summary

This report delivers the empirical findings of the **S4 Airborne Friction Observability Diagnostic**. The objective was to test whether the theoretical counterexample identified in `CompliantPreLiftContactEnv.step()`—where the equilibrium force clamp `min(step_mu_used * fn[i], eq_ft_z)` mathematically allows shear force to depend on $\mu_{\text{true}}$ without recorded slip—can serve as a stable, friction-specific, and predictive pre-slip signal.

#### Primary Experimental Finding
Across 160 controlled trials spanning a $4 \times 4$ matched factorial grid ($\mu \in [0.24, 0.36, 0.48, 0.60] \times m \in [0.30, 0.40, 0.50, 0.60]\text{ kg}$) and multiple action schedules, **State S4 occurred in 0 out of 160 trials (0.0%)**:
1. When frictional capacity is sufficient ($\mu F_N \ge W$), the grasp operates strictly in **State S3 (Anchored Hold)**. Observed shear force is locked to object weight ($F_t = W/4 = m g / 4$) and is **100% invariant to $\mu$**.
2. When frictional capacity is insufficient on the table ($\mu F_N < W$), **liftoff never occurs**. Tangential shear reaches Coulomb limit on the table and slips without ever becoming airborne.
3. When frictional capacity degrades in flight, existing pad stretch ($F_t \approx W/4$) immediately exceeds the reduced static boundary ($\mu F_n < W/4$), triggering Coulomb slip ($\dot{\delta} \ge 0.0005\text{ m/s}$) on the exact same timestep, causing immediate terminal drop.
4. In symmetric grasps, State S4 spans a measure-zero force band of less than $0.06\text{ N}$ ($10.2\text{ }\mu\text{m}$ indentation window), which is bypassed in a single discrete simulation step.

---

### 2. Experimental Setup & Protocol

- **Environment:** Authoritative, unmodified `CompliantPreLiftContactEnv`.
- **Factorial Grid:** $4 \times 4$ parameter combinations (16 cells).
- **Seeds:** Temporary diagnostic seeds `9,500,000`–`9,503,404` (strictly disjoint from production `3,300,000` and reserve `3,390,000` pools).
- **Evaluated Protocols:**
  - *Protocol 1 (Standard Lift):* Initial grasp ($F_n \approx 11.2\text{ N}$), followed by constant $5\text{ mm/s}$ lift.
  - *Protocol 2 (In-Flight Relaxation):* Grasp, lift to $z \approx 0.15\text{ mm}$, followed by controlled squeeze relaxation to approach the critical friction boundary.
- **Safety Limits:** Enforced $F_N \le 20.0\text{ N}$ total normal force and $F_t \le 15.0\text{ N}$ total shear force across all trials. 100% compliant (0 violations).

---

### 3. Quantitative Results Summary

| Cell ID | Mass ($m$) | Friction ($\mu$) | Static Weight ($W$) | Max Lift Capacity | Liftoff Achieved? | State S4 Duration | First Slip Step | Dropped? |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **M1_F1** | $0.30\text{ kg}$ | $0.24$ | $2.942\text{ N}$ | $2.688\text{ N}$ | **NO** (Slips on table) | 0 steps | Step 10 | False |
| **M1_F2** | $0.30\text{ kg}$ | $0.36$ | $2.942\text{ N}$ | $4.032\text{ N}$ | **YES** ($z=0.15\text{ mm}$) | 0 steps | Step 26 | True |
| **M1_F3** | $0.30\text{ kg}$ | $0.48$ | $2.942\text{ N}$ | $5.376\text{ N}$ | **YES** ($z=0.15\text{ mm}$) | 0 steps | None | False |
| **M1_F4** | $0.30\text{ kg}$ | $0.60$ | $2.942\text{ N}$ | $6.720\text{ N}$ | **YES** ($z=0.15\text{ mm}$) | 0 steps | None | False |
| **M2_F1** | $0.40\text{ kg}$ | $0.24$ | $3.923\text{ N}$ | $2.688\text{ N}$ | **NO** (Slips on table) | 0 steps | Step 10 | False |
| **M2_F2** | $0.40\text{ kg}$ | $0.36$ | $3.923\text{ N}$ | $4.032\text{ N}$ | **YES** ($z=0.15\text{ mm}$) | 0 steps | Step 25 | True |
| **M2_F3** | $0.40\text{ kg}$ | $0.48$ | $3.923\text{ N}$ | $5.376\text{ N}$ | **YES** ($z=0.15\text{ mm}$) | 0 steps | None | False |
| **M2_F4** | $0.40\text{ kg}$ | $0.60$ | $3.923\text{ N}$ | $6.720\text{ N}$ | **YES** ($z=0.15\text{ mm}$) | 0 steps | None | False |
| **M3_F1** | $0.50\text{ kg}$ | $0.24$ | $4.903\text{ N}$ | $2.688\text{ N}$ | **NO** (Slips on table) | 0 steps | Step 10 | False |
| **M3_F2** | $0.50\text{ kg}$ | $0.36$ | $4.903\text{ N}$ | $4.032\text{ N}$ | **NO** (Slips on table) | 0 steps | Step 10 | False |
| **M3_F3** | $0.50\text{ kg}$ | $0.48$ | $4.903\text{ N}$ | $5.376\text{ N}$ | **YES** ($z=0.15\text{ mm}$) | 0 steps | Step 24 | True |
| **M3_F4** | $0.50\text{ kg}$ | $0.60$ | $4.903\text{ N}$ | $6.720\text{ N}$ | **YES** ($z=0.15\text{ mm}$) | 0 steps | None | False |
| **M4_F1** | $0.60\text{ kg}$ | $0.24$ | $5.884\text{ N}$ | $2.688\text{ N}$ | **NO** (Slips on table) | 0 steps | Step 10 | False |
| **M4_F2** | $0.60\text{ kg}$ | $0.36$ | $5.884\text{ N}$ | $4.032\text{ N}$ | **NO** (Slips on table) | 0 steps | Step 10 | False |
| **M4_F3** | $0.60\text{ kg}$ | $0.48$ | $5.884\text{ N}$ | $5.376\text{ N}$ | **NO** (Slips on table) | 0 steps | Step 10 | False |
| **M4_F4** | $0.60\text{ kg}$ | $0.60$ | $5.884\text{ N}$ | $6.720\text{ N}$ | **YES** ($z=0.15\text{ mm}$) | 0 steps | Step 23 | True |

---

### 4. Classification & Conclusion

Under the pre-registered classification taxonomy, the outcome is formally classified as:
$$\text{\textbf{SIMULATOR\_ARTIFACT\_ONLY}} \quad \text{and} \quad \text{\textbf{NO\_RELIABLE\_SIGNAL}}$$

State S4 is a mathematical singularity in the simulator equations, not a stable observable state. It provides zero reliable lead time prior to physical slip or catastrophic drop. Pre-slip friction prediction cannot be accomplished using this signal.
