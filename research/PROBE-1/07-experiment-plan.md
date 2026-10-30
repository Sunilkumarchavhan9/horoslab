# HOROS First-Party Model Program: PROBE-1
## 07 — Comprehensive Experiment Plan & Empirical Execution Roadmap

### Executive Summary & Scientific Charter
This document establishes the executable research and experimental roadmap for PROBE-1. It operationalizes the seven hypotheses identified in `06-research-gaps.md` and the evaluation protocols from `05-benchmark-design.md`, answering:
> **Exactly what experiments will we run, in what order, with what resources, and what evidence will determine whether each hypothesis is supported?**

To prevent premature architectural commitments or wasted compute, all experiments are structured into **four sequential phases** prioritized by empirical feasibility. No model training at scale or production deployment will commence until the foundational experimental phases provide conclusive evidence.

---

### Four-Phase Experimental Progression

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PROBE-1 FOUR-PHASE EXPERIMENT ROADMAP                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ PHASE I: FOUNDATIONS (Priority 1)                                            │
│ • EXP-001: Multimodal Physical State Estimation (Hypothesis 1)              │
│ • EXP-002: Contact-Aware Anticipatory Slip Prediction (Hypothesis 2)        │
│ ──► GATE: Verify physical representation fidelity & sensory integration.    │
├─────────────────────────────────────────────────────────────────────────────┤
│ PHASE II: PHYSICAL PREDICTION (Priority 1)                                  │
│ • EXP-003: Action-Conditioned Dynamics & SDF Rollout (Hypothesis 3)        │
│ ──► GATE: Verify multi-step physical rollout stability & non-penetration.   │
├─────────────────────────────────────────────────────────────────────────────┤
│ PHASE III: CONTROL & TRANSFER (Priority 2)                                  │
│ • EXP-004a: Continuous Action Generation (Flow vs. Diffusion vs. Discrete)  │
│ • EXP-004b: Sim-to-Real High-Fidelity Tactile Transfer (Hypothesis 5)      │
│ • EXP-005: Hierarchical Frequency Sweeps (5 Hz vs 100 Hz Policy)           │
│ • EXP-007: Cross-Embodiment Centroidal Momentum Transfer (Hypothesis 4)     │
│ ──► GATE: Validate 10 ms control loop execution & cross-humanoid viability. │
├─────────────────────────────────────────────────────────────────────────────┤
│ PHASE IV: ARCHITECTURAL DECISION & ADVANCED (Priority 3)                     │
│ • EXP-008: Predictive Safety & Control Barrier Supervision (Hypothesis 6)   │
│ • EXP-009: Continual Physical Learning & Mistake Immunity (Hypothesis 7)    │
│ • EXP-006: The Decisive Test (Hybrid World-Model vs. Pure Flow Policy)      │
│ ──► FINAL DECISION: Freeze production architecture based on power-backed data│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Master Experiment Index & Hypothesis Traceability

| Experiment ID | Title | Addressed Hypothesis | Primary Phase | Priority | Primary Hardware / Env | Decision Significance | Detailed Spec |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **EXP-001** | Multimodal Physical Perception Baseline | Hypothesis 1 (Physical Tokenization) | Phase I | **Priority 1** | Physical Unitree G1 + Vicon Mocap | Determines if tactile/force tokens survive visual occlusion | [`EXP-001`](file:///c:/projects/MemoryOS/research/PROBE-1/experiments/EXP-001-perception.md) |
| **EXP-002** | Contact-Aware Anticipatory Slip Modeling | Hypothesis 2 (Friction Cone Margin) | Phase I | **Priority 1** | Tactile Testbed + ATI 6-Axis Load Cell | Determines if slip can be predicted $\ge 25$ ms before occurrence | [`EXP-002`](file:///c:/projects/MemoryOS/research/PROBE-1/experiments/EXP-002-contact-prediction.md) |
| **EXP-003** | Action-Conditioned Dynamics & SDF Rollout | Hypothesis 3 (Constrained Latent Dynamics)| Phase II | **Priority 1** | Isaac Sim + DROID/Everyday Validation | Determines if 50-step rollouts remain physically valid | [`EXP-003`](file:///c:/projects/MemoryOS/research/PROBE-1/experiments/EXP-003-future-state.md) |
| **EXP-004a**| Continuous Action Generation Head Benchmark| Architecture Candidate D Evaluation | Phase III | **Priority 2** | G1 Dual-Arm Station + Jetson Thor | Resolves Flow Matching vs. Diffusion vs. Discretization | [`EXP-004`](file:///c:/projects/MemoryOS/research/PROBE-1/experiments/EXP-004-continuous-action.md) |
| **EXP-004b**| Sim-to-Real Tactile Residual Adaptation | Hypothesis 5 (Bilateral Tactile Residual) | Phase III | **Priority 2** | Isaac Lab Sim $\to$ Physical G1 Arms | Proves if $< 2$ hours of tactile telemetry bridges reality gap | [`EXP-004`](file:///c:/projects/MemoryOS/research/PROBE-1/experiments/EXP-004-continuous-action.md) |
| **EXP-005** | Hierarchical Frequency Optimization Sweep | Architecture Candidate A Evaluation | Phase III | **Priority 2** | Isaac Lab Whole-Body Loco-Manipulation | Validates or disproves the 5 Hz planner / 100 Hz policy split | [`EXP-005`](file:///c:/projects/MemoryOS/research/PROBE-1/experiments/EXP-005-hierarchical-control.md) |
| **EXP-007** | Cross-Embodiment Centroidal Momentum Transfer| Hypothesis 4 (Normalized Momentum Action) | Phase III | **Priority 2** | Unitree H1 $\leftrightarrow$ Unitree G1 Paired Rig | Proves if whole-body skills transfer across humanoid masses | [`EXP-007`](file:///c:/projects/MemoryOS/research/PROBE-1/experiments/EXP-007-cross-embodiment.md) |
| **EXP-008** | Predictive Safety & Anticipatory Barrier Supervision| Hypothesis 6 (Predictive Momentum Barrier) | Phase IV | **Priority 3** | Gantry-Tethered G1 + PREEMPT_RT Linux | Determines if forward prediction reduces physical E-stops | [`EXP-008`](file:///c:/projects/MemoryOS/research/PROBE-1/experiments/EXP-008-predictive-safety.md) |
| **EXP-009** | Continual Physical Learning & Mistake Immunity| Hypothesis 7 (Epistemic Trajectory Memory)| Phase IV | **Priority 3** | Physical Kitting & Sorting Cell | Proves if non-destructive failure memory stops repeat errors | [`EXP-009`](file:///c:/projects/MemoryOS/research/PROBE-1/experiments/EXP-009-continual-learning.md) |
| **EXP-006** | Decisive Test: Hybrid World-Model vs. Flow Policy| Architecture Decision (Candidate E vs. D)| Phase IV | **Priority 3** | Full 50-Task Challenge Suite (Sim + Real)| Statistically determines the production PROBE-1 architecture | [`EXP-006`](file:///c:/projects/MemoryOS/research/PROBE-1/experiments/EXP-006-hybrid-comparison.md) |

---

## 1. Methodological Resolutions & Research Refinements

Before executing this plan, five critical methodological issues identified during peer review have been formally resolved:

### Resolution 1: Formal Power Calculation for EXP-006
* **Issue:** The previously proposed 250 trials per task block lacked statistical derivation.
* **Resolution:** Under McNemar's paired test for binary success/failure outcomes:
  * Baseline Candidate D expected success rate: $P_D = 0.70$.
  * Target Candidate E success rate: $P_E = 0.82$ (effect size $\delta = 0.12$).
  * Discordant proportion $\psi = P(E \text{ succeeds}, D \text{ fails}) - P(D \text{ succeeds}, E \text{ fails}) \approx 0.18$.
  * Significance level $\alpha = 0.01$ (two-tailed), Statistical Power $1 - \beta = 0.90$.
  * Standard sample size formula for paired binary proportions:
    $$N = \frac{\left( Z_{\alpha/2} \sqrt{\psi} + Z_{\beta} \sqrt{\psi - \delta^2} \right)^2}{\delta^2} \approx 234$$
  * Adding a 10% buffer for potential hardware anomalies yields **$N = 260$ paired physical trials per task category**. Across 5 core evaluation task blocks, this requires **$N = 1,300$ total paired trials**.

### Resolution 2: Scope Disambiguation of EXP-004
* **Issue:** Conflating continuous action generation (Candidate D evaluation) with sim-to-real transfer (Hypothesis 5).
* **Resolution:** Formally decoupled into two clean sub-experiments:
  * **EXP-004a:** Focuses strictly on action head architecture: Flow Matching vs. Diffusion Policy vs. Discrete Autoregressive Tokenization on identical in-distribution datasets.
  * **EXP-004b:** Focuses strictly on the physical sim-to-real reality gap: evaluates the bilateral tactile residual adaptation head when transferring policies trained on Isaac Sim to physical Unitree G1 arms.

### Resolution 3: Mathematical Normalization of Future Rollout Error (Hypothesis 3)
* **Issue:** The proposed "15% rollout error" was mathematically ambiguous across disparate units (radians, meters, Newtons).
* **Resolution:** Normalized Future Prediction Error ($\text{NFPE}$) over horizon $H$ is formally defined as the variance-weighted dimensionless normalized deviation:
  $$\text{NFPE}(H) = \frac{1}{H} \sum_{k=1}^H \left( \frac{1}{D} \sum_{j=1}^D \frac{|\hat{s}_{t+k, j} - s_{t+k, j}|}{\sigma_j + \epsilon} \right)$$
  where $\sigma_j$ is the empirical standard deviation of state variable $j$ computed over the entire evaluation dataset split. A rollout passes the 15% threshold if $\text{NFPE}(H=50) \le 0.150$.

### Resolution 4: Predictive Safety Calibration & Deterministic Runtime (Hypothesis 6)
* **Issue:** Neural forward predictions can be overconfident or poorly calibrated, and solving an optimization barrier must not induce non-deterministic latency.
* **Resolution:** 
  1. Prediction uncertainty is calibrated via Expected Calibration Error (ECE) and temperature scaling over the validation split.
  2. The Control Barrier Function (CBF) is solved via an active-set Quadratic Program (OSQP / ProxSuite) with a hard **1.0 ms deterministic execution timeout**. If the QP fails to find a certified solution within 1.0 ms, the runtime immediately falls back to a deterministic safe impedance deceleration maneuver.

### Resolution 5: Tiered Hardware Safety Gating Protocol
* **Issue:** Testing aggressive balance recovery or physical disturbances on an unconstrained humanoid risks catastrophic mechanical destruction.
* **Resolution:** Every physical test protocol must pass through three mandatory gates:
  1. *Gate 1 (Digital Verification):* 10,000 randomized simulation runs in Isaac Sim with zero joint limit violations.
  2. *Gate 2 (Gantry-Tethered Hardware):* Robot suspended on an overhead zero-friction safety gantry with slack tether preventing ground impact.
  3. *Gate 3 (Untethered Hardware):* Authorized only after Gate 2 achieves 20 consecutive runs with zero emergency stop interventions.

---

## 2. Resource Allocation & Hardware Budget

The complete experimental program is budgeted across a 16-week execution timeline:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       RESOURCE & COMPUTE ALLOCATION MATRIX                  │
├─────────────────────┬──────────────┬───────────────┬────────────────────────┤
│ Phase               │ GPU Nodes    │ Cluster Hours │ Target Embodiment      │
├─────────────────────┼──────────────┼───────────────┼────────────────────────┤
│ Phase I (EXP 1–2)   │ 4x H100 SXM5 │ 1,200 hrs     │ Unitree G1 Hands + Rig │
│ Phase II (EXP 3)    │ 8x H100 SXM5 │ 2,400 hrs     │ Isaac Sim Cluster      │
│ Phase III (EXP 4–5) │ 8x H100 SXM5 │ 3,600 hrs     │ Physical G1 + H1 Rigs  │
│ Phase IV (EXP 6–9)  │ 16x H100     │ 5,800 hrs     │ Full Twin Cell + Sim   │
├─────────────────────┼──────────────┼───────────────┼────────────────────────┤
│ TOTALS              │ 16x H100 Peak│ 13,000 hrs    │ 2x G1, 1x H1 Humanoids │
└─────────────────────┴──────────────┴───────────────┴────────────────────────┘
```

---

## 3. Detailed Experiment Specifications

The individual, self-contained experimental specifications are archived in `research/PROBE-1/experiments/`:
1. [`EXP-001: Multimodal Physical Perception Baseline`](file:///c:/projects/MemoryOS/research/PROBE-1/experiments/EXP-001-perception.md)
2. [`EXP-002: Contact-Aware Anticipatory Slip Prediction`](file:///c:/projects/MemoryOS/research/PROBE-1/experiments/EXP-002-contact-prediction.md)
3. [`EXP-003: Action-Conditioned Dynamics & SDF Rollout`](file:///c:/projects/MemoryOS/research/PROBE-1/experiments/EXP-003-future-state.md)
4. [`EXP-004: Continuous Action Generation & Sim-to-Real Dexterity`](file:///c:/projects/MemoryOS/research/PROBE-1/experiments/EXP-004-continuous-action.md)
5. [`EXP-005: Hierarchical Control Frequency Sweeps`](file:///c:/projects/MemoryOS/research/PROBE-1/experiments/EXP-005-hierarchical-control.md)
6. [`EXP-006: Decisive Comparison: Hybrid World-Model vs. Flow Policy`](file:///c:/projects/MemoryOS/research/PROBE-1/experiments/EXP-006-hybrid-comparison.md)
7. [`EXP-007: Cross-Embodiment Centroidal Momentum Transfer`](file:///c:/projects/MemoryOS/research/PROBE-1/experiments/EXP-007-cross-embodiment.md)
8. [`EXP-008: Predictive Safety & Control Barrier Supervision`](file:///c:/projects/MemoryOS/research/PROBE-1/experiments/EXP-008-predictive-safety.md)
9. [`EXP-009: Continual Physical Learning & Mistake Immunity`](file:///c:/projects/MemoryOS/research/PROBE-1/experiments/EXP-009-continual-learning.md)
