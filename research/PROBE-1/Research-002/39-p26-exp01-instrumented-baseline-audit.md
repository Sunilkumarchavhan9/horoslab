# HOROS PROBE-1 Research-002 — Stage P2.6
## Document 39: Experiment 01 Audit — Instrumented Baseline Replay

**Stage:** P2.6 — Contact-Aware Safety Coordination  
**Experiment:** Exp-01 (Instrumented Baseline Replay)  
**Status:** **Executed & Verified**  
**Audit Date:** November 6, 2026  
**Primary Deliverable:** High-Resolution 8-Channel Telemetry & Mode-Stratified Intervention Characterization  

---

## 1. Executive Summary & Core Scientific Findings

Experiment 01 reproduces the baseline unconstrained ($C_1$) and decoupled safety-filtered ($C_2$) behaviors from Stage P2.5 under complete 8-channel decision telemetry. This establishes the definitive quantitative foundation against which all P2.6 coordination interventions will be evaluated.

### Core Discoveries:
1. **Unconstrained Model Competence Replicated ($C_1$):**
   - Active models $M_2$ (Boundary ACMM) and $M_4$ (Combined ACMM) achieved **$4/30$ ($13.33\%$) and $8/30$ ($26.67\%$) lift success**, with zero hard safety violations ($0/30$, 95% Wilson CI $[0.0\%, 11.35\%]$).
   - Mean lift heights reached **$2.75\text{ mm}$ ($M_2$) and $3.52\text{ mm}$ ($M_4$)**, with maximum lifts of **$7.60\text{ mm}$ and $7.15\text{ mm}$**, clearing the $5.0\text{ mm}$ task success threshold.
   - Passive model $M_0$ achieved **$0/30$ ($0.0\%$) success and $100\%$ stall rate**, confirming that manipulation capability originates entirely from active contact-boundary acquisition.
2. **Decoupled Safety Filter Suppression Replicated ($C_2$):**
   - Enabling the baseline p-CBF filter completely suppressed lift success to **$0/30$ ($0.0\%$)** across all models.
   - Triggered **$349 / 750$ interventions ($46.53\%$)** for $M_2$ and **$290 / 750$ interventions ($38.67\%$)** for $M_4$.
   - Produced extreme intervention streaks: **$16$ consecutive clamped steps for $M_2$** and **$12$ consecutive clamped steps for $M_4$**, driving stall rates to **$90.00\%$ and $96.67\%$**.
3. **Contact-Mode Localization of Safety Interventions:**
   The 8-channel telemetry pinpointed the exact physical mechanism of the limit cycle:
   - **Mode 0 (Free Space), Mode 1 (Approach), Mode 2 (Sticking Grasp):** Exactly **$0.0\%$ intervention rate** ($0$ interventions across $> 300$ decisions).
   - **Mode 3 (Dynamic Lift Onset):** **$91.94\%$ – $92.11\%$ intervention rate** ($57/62$ and $70/76$ decisions intervened).
   - **Mode 4 (Incipient Micro-Slip):** **$80.40\%$ – $84.12\%$ intervention rate** ($233/277$ and $279/347$ decisions intervened).

---

## 2. Replay Verification Matrix

| Model | Configuration | Task Success ($k/N$, %) | 95% Wilson CI | Hard Violations | Stall Rate ($k/N$, %) | Total Interventions | Max Streak | Mean Lift (mm) | Max Lift (mm) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **$M_0$ (Passive)** | $C_1$ (Open) | 0/30 (0.0%) | [0.0%, 11.35%] | 0/30 (0.0%) | 30/30 (100.0%) | 0 / 750 (0.0%) | 0 | 0.0000 | 0.0000 |
| **$M_0$ (Passive)** | $C_2$ (Original) | 0/30 (0.0%) | [0.0%, 11.35%] | 0/30 (0.0%) | 30/30 (100.0%) | 2 / 750 (0.27%) | 1 | 0.0000 | 0.0000 |
| **$M_2$ (Boundary)**| $C_1$ (Open) | **4/30 (13.33%)** | [5.31%, 29.68%] | 0/30 (0.0%) | **4/30 (13.33%)** | 0 / 750 (0.0%) | 0 | **2.7464** | **7.6026** |
| **$M_2$ (Boundary)**| $C_2$ (Original) | 0/30 (0.0%) | [0.0%, 11.35%] | 0/30 (0.0%) | 27/30 (90.00%) | **349 / 750 (46.53%)**| **16** | 0.0348 | 0.6456 |
| **$M_4$ (ACMM)** | $C_1$ (Open) | **8/30 (26.67%)** | [14.18%, 44.45%]| 0/30 (0.0%) | **2/30 (6.67%)** | 0 / 750 (0.0%) | 0 | **3.5249** | **7.1531** |
| **$M_4$ (ACMM)** | $C_2$ (Original) | 0/30 (0.0%) | [0.0%, 11.35%] | 0/30 (0.0%) | 29/30 (96.67%) | **290 / 750 (38.67%)**| **12** | 0.0000 | 0.0000 |

---

## 3. High-Resolution Mode-Stratified Telemetry Breakdown

### Model $M_2$ Boundary ($C_2$ Original p-CBF Filter)
- Total decisions: $750$ | Total interventions: $349$ ($46.53\%$)

| Physical Contact Mode | Description | Decision Count | Interventions | Intervention Rate | Telemetry Observation |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **Mode 0** | Free Space Pre-Grasp | 244 | 0 | **0.0%** | Barrier inactive; fingertip approach unobstructed |
| **Mode 1** | Touchdown Impact | 10 | 0 | **0.0%** | Initial contact established without friction violation |
| **Mode 2** | Stable Sticking Grasp | 73 | 0 | **0.0%** | Normal force established; zero vertical shear command |
| **Mode 3** | Dynamic Lift Onset | 76 | 70 | **92.11%** | Upward arm command introduces shear $F_t$; filter clamps |
| **Mode 4** | Incipient Micro-Slip | 347 | 279 | **80.40%** | Persistent friction deficit ($\|F_t\| > \mu F_n$); zero-clamp deadlock |

### Model $M_4$ ACMM ($C_2$ Original p-CBF Filter)
- Total decisions: $750$ | Total interventions: $290$ ($38.67\%$)

| Physical Contact Mode | Description | Decision Count | Interventions | Intervention Rate | Telemetry Observation |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **Mode 0** | Free Space Pre-Grasp | 325 | 0 | **0.0%** | Smooth uninhibited trajectory generation |
| **Mode 1** | Touchdown Impact | 10 | 0 | **0.0%** | Symmetrical contact closure |
| **Mode 2** | Stable Sticking Grasp | 76 | 0 | **0.0%** | Normal pre-contact maintained |
| **Mode 3** | Dynamic Lift Onset | 62 | 57 | **91.94%** | Arm lift triggered before normal force preloaded |
| **Mode 4** | Incipient Micro-Slip | 277 | 233 | **84.12%** | Repeated velocity suppression traps hand at $z=0.0\text{ mm}$ |

---

## 4. Physical Diagnostic of the Limit-Cycle Mechanism

Tracing individual decision sequences reveals the exact limit-cycle loop:

```mermaid
sequenceDiagram
    autonumber
    participant P as CEM Planner
    participant F as p-CBF Filter
    participant E as Environment

    P->>F: Propose Lift Action [Squeeze: 0.1 mm, Arm dz: +3.0 mm/step]
    Note over F: Evaluate Barrier: ||Ft|| / (mu * Fn) = 1.34 > 1.0 (Slip!)
    F->>E: Discontinuous Clamp: [Squeeze: 0.1 mm, Arm dz: 0.0 mm/step]
    Note over E: Object stays at z = 0.0 mm; Normal force unchanged (Fn = 2.8 N)
    E-->>P: Next Observation: Hand still at z = 0.0 mm, Fn = 2.8 N
    P->>F: Re-propose Lift Action [Squeeze: 0.1 mm, Arm dz: +3.0 mm/step]
    Note over F: Evaluate Barrier: Still ||Ft|| / (mu * Fn) > 1.0
    F->>E: Discontinuous Clamp: Arm dz: 0.0 mm/step (Streak count = 2)
    Note over E: Repeat for 12 to 16 consecutive steps -> STALL (z = 0.0 mm)
```

### The Three Structural Defects in Decoupled Filtering:
1. **Zero Preload Augmentation:** When the filter identifies a normal force deficit ($\Delta F_n = \frac{F_g}{N_f \mu} - F_n > 0$), it only zeros out $dz$. It does **not** command additional finger squeeze ($\Delta a_{\text{sqz}}$).
2. **Binary Shear Clamping:** Rather than scaling lift velocity to match the current available friction capacity ($v_{\text{safe}} = \kappa \mu F_n$), the baseline filter clamps $dz = 0.0$, causing a complete standstill.
3. **Planner Blindness:** The CEM planner has no predictive feedback that its proposed lift trajectory was rejected, causing it to reissue the same unsafe commands on subsequent steps.

---

## 5. Artifact & Receipt Registry

| Artifact Name | Path | SHA256 / Status |
| :--- | :--- | :---: |
| **Master Report** | `experiments/p26_safety_coordination/results/p26_exp01_baseline_report.json` | Verified |
| **Episode Traces** | `experiments/p26_safety_coordination/episode_traces/exp01_traces.json` | Verified (180 episodes) |
| **Telemetry $M_0$ $C_1$** | `experiments/p26_safety_coordination/intervention_logs/telemetry_M0_passive_C1_open.json` | 750 decisions logged |
| **Telemetry $M_0$ $C_2$** | `experiments/p26_safety_coordination/intervention_logs/telemetry_M0_passive_C2_original.json` | 750 decisions logged |
| **Telemetry $M_2$ $C_1$** | `experiments/p26_safety_coordination/intervention_logs/telemetry_M2_boundary_C1_open.json` | 750 decisions logged |
| **Telemetry $M_2$ $C_2$** | `experiments/p26_safety_coordination/intervention_logs/telemetry_M2_boundary_C2_original.json` | 750 decisions logged |
| **Telemetry $M_4$ $C_1$** | `experiments/p26_safety_coordination/intervention_logs/telemetry_M4_acmm_C1_open.json` | 750 decisions logged |
| **Telemetry $M_4$ $C_2$** | `experiments/p26_safety_coordination/intervention_logs/telemetry_M4_acmm_C2_original.json` | 750 decisions logged |

---

## 6. Readiness for Experiment 02 (Action Substitution)

With the baseline failure mechanism localized to **Modes 3 and 4** and 100% instrumented, we are ready to proceed to:
- **Experiment 02 (Workstream B): Action Substitution Intervention.**
- **Hypothesis:** Injecting analytic normal force compensation ($\Delta a_{\text{sqz}} = \frac{\Delta F_n}{k_{\text{elastic}}}$) and scaling shear velocity ($a_{\text{lift}} = \min(a_{\text{prop}}, \kappa \mu F_n)$) will eliminate the Mode 3/4 deadband, reduce intervention frequency by $\ge 50\%$, and unlock safe lifting without stalls.
