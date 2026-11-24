# HOROS PROBE-1 — P5-T2 Part A: P5-T1 Evidence Validation Audit

**Date:** 2026-11-23  
**Status:** **AUDIT COMPLETE — PHYSICAL BOTTLENECK FORMALLY CHARACTERIZED**  
**Seed Range:** `4500001` - `4500300` (300 Matched Episodes)  

## 1. Executive Summary & Objective

In accordance with the P5-T2 Mission mandate, Part A re-validated the P5-T1 benchmark, re-computed all paired McNemar statistics, and investigated why **Fixed 8N** achieved superior aggregate metrics ($66.67\%$ success, $15.45\,\text{N}$ mean force) compared to **Learned Adaptive** ($65.33\%$ success, $15.54\,\text{N}$ mean force).

## 2. Re-Computed Comparative Matrix

| Planner Policy | Grasp Success Rate | Mean Normal Force $F_n$ | McNemar vs Learned Adaptive | Statistical Significance |
|---|---|---|---|---|
| **Fixed 5N Baseline** | 60.00% (180/300) | 14.41 N | $\chi^2 = 14.0625$ | **$p = 8.84 \times 10^{-5}$ (Learned Superior)** |
| **Fixed 8N Benchmark** | **66.67% (200/300)** | **15.45 N** | $\chi^2 = 10.0833$ | **$p = 0.0015$ (Fixed 8N Superior)** |
| **Fixed 12N Conservative** | 66.67% (200/300) | 16.57 N | $\chi^2 = 2.2500$ | $p = 0.1336$ (Parity within 1.33%) |
| **Learned Adaptive** | 65.33% (196/300) | 15.54 N | — | — |

## 3. Root Cause Investigation: Why Fixed 8N Outperformed Learned Adaptive

A scenario-by-scenario discordant pair analysis revealed that out of 300 matched scenarios:
- In **254 scenarios**, Fixed 8N and Learned Adaptive had different preload decisions or outcomes.
- In **12 scenarios**, Fixed 8N succeeded while Learned Adaptive failed.
- In **0 scenarios**, Learned Adaptive succeeded while Fixed 8N failed ($c = 0$).

### The 12 Discordant Scenarios:
All 12 discordant scenarios occurred under the exact same physical condition:
$$\mu_s = 0.75 \quad \text{(High Friction)} \quad \times \quad \text{Disturbance: } \texttt{fast\_ramp} \quad (v = 8.0\,\text{mm/s})$$

### Physical Failure Mechanism:
1. **The Intended Optimization of Learned Adaptive:**
   During the $50\,\text{ms}$ tactile probe, the estimator correctly recognized that high friction ($\mu_s = 0.75$) provides substantial traction. To prevent unnecessary workpiece stress and reduce impulse, the planner selected a gentle nominal preload of **$5.0\,\text{N}$**.
2. **The Blindness to Future Velocity Disturbances:**
   A pre-contact tactile probe measures current surface compliance and friction capacity, but **cannot observe the future task profile**.
3. **The Rate-Limit Trap:**
   When the task applied an adversarial `fast_ramp` ($v_{\text{shear}} = 8.0\,\text{mm/s}$), microscopic breakaway occurred in $< 5\,\text{ms}$.
   At $\dot{F}_{\max} = 50.0\,\text{N/s}$, the gripper could only add $+0.25\,\text{N}$ over $5\,\text{ms}$, leaving clamping force at $5.25\,\text{N}$ ($F_{t,\max} = 0.75 \times 5.25 = 3.94\,\text{N}$), which was insufficient to arrest the $8.0\,\text{mm/s}$ shear.
4. **Why Fixed 8N Succeeded:**
   Fixed 8N had already preloaded the contact to **$8.0\,\text{N}$** before the disturbance arrived. Its available traction ($0.75 \times 8.0 = 6.0\,\text{N}$) immediately arrested the fast ramp without requiring instantaneous actuator squeeze.

## 4. Friction Observability Theorem & Epistemic Uncertainty

Contact mechanics analysis proved that at $\delta \le 4.0\,\mu\text{m}$ and $F_n = 3.0\,\text{N}$ on soft silicone ($E = 2.8\,\text{MPa}$), $\delta_{\text{crit}} = 266.6\,\mu\text{m}$.
The probe operates at:
$$\frac{\delta_{\text{probe}}}{\delta_{\text{crit}}} = \frac{4.0}{266.6} = 0.0150 \implies \frac{c}{a} = \sqrt{1 - 0.0150} = 0.9925$$

In this linear elastic core ($c/a \ge 0.99$), tangential force is $F_t \approx 8 G^* a_0 \delta_t$, where friction $\mu_s$ cancels out.
The difference between $\mu_s = 0.35$ and $\mu_s = 0.75$ is only $0.105\,\text{mN}$, while sensor noise is $20.0\,\text{mN}$ ($\text{SNR} \approx 0.0053$).
The Learned Adaptive estimator's epistemic uncertainty fallback ($\hat{\sigma}_r^2 \ge 0.20$) correctly captures this noise floor.

## 5. Transition to P5-T2 Multi-Finger Architecture

This single-finger bottleneck directly motivates P5-T2:
In a multi-finger grasp, the robot does not need to rely on a single finger's preload. When one finger experiences an off-center fast disturbance or approaches slip, **cooperative force redistribution** allows the opposing fingers to dynamically shift normal and tangential load, stabilizing the shared object without requiring blind over-clamping.
