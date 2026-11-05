# HOROS PROBE-1 — Research-002
# Phase 2 Technical Implementation Specification & Engineering Contract

**Document ID:** HOROS-PROBE1-R002-DOC-11  
**Project:** HOROS PROBE-1 — Humanoid Robotics  
**Topic:** Trustworthy Action-Conditioned Contact World Models  
**Baseline Snapshot Freeze:** Commit `0dfb2b66`  
**Active Working Branch:** `feat/probe1-research002-phase2`  
**Author:** HOROS Research Team  

---

## 1. Scope & Execution Staging

Phase 2 transitions Research-002 from exploratory baseline benchmarking to the formal implementation and verification of **Contact-Mode-Stratified, Planner-Selection-Aware Conformal Dynamics (CMS-PSACD)**.

To maintain uncompromising scientific discipline, development proceeds strictly in the mandated sequential stages:

```
[Phase 2 Staging Pipeline]
  Stage P2.1: Hybrid Contact-State Model (Seven-Mode Contact Representation & Predictor)
       │
       ▼
  Stage P2.2: Multi-Horizon Conformal Calibration Engine (Mode x Horizon Tensor Q in R^{7x5})
       │
       ▼
  Stage P2.3: Planner-Selection-Aware Calibration (CAP / Adaptive Pick Selection-Correction)
       │
       ▼
  Stage P2.4: Active Contact-Mode Mining (Targeted Acquisition at Friction & Wedging Boundaries)
       │
       ▼
  Stage P2.5: Five-Way Integrated Benchmark Evaluation (M1 through M5, with & without p-CBF)
```

---

## 2. Technical Conditions & Mathematical Constraints

### Condition 1: Strict Prevention of Future-Information Leakage in P2.1
- **The Problem:** In passive analysis, researchers often condition prediction intervals on the *realized* contact mode observed at step $t+h$. At real-time inference, the future contact mode is **unknown**. Conditioning on ground-truth future modes constitutes severe target leakage.
- **Contract Rule:** At inference time, the model must first predict a contact mode probability distribution:
  $$\hat{\mathbf{p}}_{t+h} = \operatorname{softmax}\left(g_\phi(\hat{\mathbf{s}}_{t+h-1}, \mathbf{a}_{t+h-1})\right) \in \Delta^6$$
  and/or a conformal candidate mode set:
  $$\hat{\mathcal{S}}_{1-\alpha_{\text{mode}}}(\mathbf{s}_t, \mathbf{a}) \subseteq \{0, 1, 2, 3, 4, 5, 6\}$$
- Prediction regions must be evaluated jointly over $(\hat{\mathbf{x}}_{t+h}, \hat{\Sigma}_{t+h})$ or via mode-marginalized union bounds:
  $$\hat{\mathcal{C}}_{1-\alpha}(\mathbf{s}_t, \mathbf{a}) = \bigcup_{k \in \hat{\mathcal{S}}} \hat{\mathcal{C}}_{1-\alpha}^{(k)}(\mathbf{s}_t, \mathbf{a})$$

---

### Condition 2: Multi-Horizon Quantile Engine & Simultaneous Coverage in P2.2
- **Quantile Tensor Structure:**
  $$\mathbf{Q} \in \mathbb{R}^{7 \times 5} \quad \text{for } \Sigma_k \in \{0, \dots, 6\} \text{ and } H \in \{1, 3, 5, 10, 20\}$$
- **Marginal vs. Simultaneous Trajectory Coverage:**
  A model achieving marginal coverage $\mathbb{P}(\mathbf{x}_{t+h} \in \hat{\mathcal{C}}_{t+h}) \ge 1 - \alpha$ at each individual horizon $h$ can experience severe violation across a complete rollout trajectory $\boldsymbol{\tau}_{1:H}$.
- We formulate and report two separate guarantees:
  1. *Marginal Horizon Coverage:* Evaluated point-wise at each $h \in \{1, 3, 5, 10, 20\}$.
  2. *Simultaneous Trajectory Coverage:* Calibrated using maximum studentized trajectory residuals:
     $$S_i^{\text{traj}} = \max_{h \in \{1, 3, 5, 10, 20\}} \frac{\|\mathbf{x}_{t+h}^{\text{true}} - \hat{\mathbf{x}}_{t+h}^{(i)}\|_2}{\hat{q}_{\text{marginal}}(\hat{\Sigma}_{t+h}, h)}$$
     guaranteeing joint validity:
     $$\mathbb{P}\left( \forall h \in \{1, \dots, H\}, \; \mathbf{x}_{t+h} \in \hat{\mathcal{C}}_{1-\alpha}^{\text{traj}} \right) \ge 1 - \alpha$$
- Minimum sample threshold: $N_{\min} \ge 30$ per mode-horizon cell; fallback to pooled marginal if stratum is sparse.

---

### Condition 3: Planner-Selection-Aware Calibration (P2.3)
- Incorporates the foundational framework of **Calibration after Adaptive Pick (CAP)** (Bates et al., 2023; Fannjiang et al., 2024).
- The planner adaptively chooses candidate actions $\mathbf{a}^* = \arg\max_\mathbf{a} \hat{R}(\mathbf{a})$ based on model predictions. This violates standard exchangeability.
- We implement and compare:
  1. *Standard Split Conformal (Marginal)*
  2. *Contact-Stratified Conformal (CaPTURe Baseline)*
  3. *Planner-Specific Calibration*
  4. *Planner-Selection-Aware Conformal (CAP-corrected)*
- Document the exact mathematical conditions under which valid coverage holds, avoiding over-claiming finite-sample validity under arbitrary non-stationary shifts.

---

### Condition 4: Resolution of Task 2 Conservatism
To prevent the "frozen robot" trap where an uncertainty penalty achieves 0 violations by commanding zero action, Phase 2 evaluates:
- **Task Success Rate (%):** Object lifted $\ge 60\,\text{mm}$ and held for $1.0\,\text{s}$.
- **Goal Progress (mm):** Net displacement towards target pose.
- **Stall Probability ($P_{\text{stall}}$):** Fraction of time steps where commanded action magnitude $\|\mathbf{a}_t\| < 10^{-3}$ while goal remains unachieved.
- **Average Action Magnitude:** $\mathbb{E}[\|\mathbf{a}_t\|]$.
- **Safety Filter Intervention Rate (%):** Interventions per control step.
- **Correct PEG Classification:** Task 2's negative PEG ($-218,788$) is classified as *extreme pessimistic slip-penalty accumulation*, distinct from Task 1's *optimistic exploitation*.

---

### Condition 5: Empirical p-CBF Classification
- Relative degree $r=1$ between Cartesian velocity commands and contact wrench barrier functions is an operational approximation, not a closed-form certified theorem.
- Until a full Hamiltonian dynamics derivation with actuator dynamics is proven, the runtime filter is formally classified and reported as an **Empirical Runtime Safety Filter**, not a certified guarantee.

---

## 3. Directory Layout & Module Specifications

```
research/PROBE-1/Research-002/
├── src/
│   ├── contact_modes/
│   │   ├── __init__.py
│   │   ├── contact_mode_definitions.py    # Seven-mode definitions & threshold physics
│   │   ├── contact_mode_classifier.py     # Ground truth & neural mode classifiers
│   │   └── hybrid_contact_state_model.py  # Non-leaking hybrid state dynamics
│   ├── conformal/
│   │   ├── __init__.py
│   │   ├── multihorizon_quantile_engine.py# Q in R^{7x5} marginal & simultaneous quantiles
│   │   └── trajectory_conformal.py        # Joint simultaneous trajectory bounds
│   ├── selection_aware/
│   │   ├── __init__.py
│   │   └── cap_selection_conformal.py     # Calibration after Adaptive Pick (CAP)
│   ├── mining/
│   │   ├── __init__.py
│   │   └── active_contact_mining.py       # Boundary-focused active sampler
│   ├── planners/
│   │   ├── cem_planner.py
│   │   └── uncertainty_penalized_cem.py
│   └── safety/
│       └── pcbf_safety_filter.py          # Empirical runtime barrier filter
├── tests/
│   ├── test_contact_modes.py              # Unit & integration tests for P2.1
│   ├── test_multihorizon_calibration.py   # Quantile coverage verification for P2.2
│   └── test_selection_aware.py            # Selection-shift verification for P2.3
└── experiments/
    ├── calibration/
    ├── planner_selection/
    ├── contact_mining/
    └── phase2_comparison/
```
