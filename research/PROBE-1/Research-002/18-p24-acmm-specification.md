# HOROS PROBE-1 — Research-002
## Stage P2.4: Active Contact-Mode Mining (ACMM) — Specification
**Program:** HOROS PROBE-1 — Humanoid Robotics & Physical AI  
**Project:** Research-002: Trustworthy Action-Conditioned Contact World Models  
**Stage:** P2.4 — Active Contact-Mode Mining (ACMM)  
**Status:** Frozen Technical Specification & Implementation Architecture  
**Date:** 6 November 2026  
**Reference Snapshot:** Commit `b652b415` (P2.3 Empirical Results Audit)  

---

## 1. Executive Summary & Research Motivation

In Stage P2.3, **Planner-Selection-Aware Conformal Dynamics (PSACD)** resolved the core statistical hypothesis of Research-002: calibrating conformal prediction intervals on planner-selected outcomes eliminated the **Optimizer's Curse**, elevating joint simultaneous coverage in Task 2 from $0.0\%$ to $93.33\%$.

However, the empirical results audit identified two fundamental physical manipulation bottlenecks:
1. **Task 1 (Peg-in-Hole):** The policy made steady physical progress ($34.8$ mm insertion) without jamming, but seating required at least $65.0$ mm total displacement ($z_{\text{init}} = +15.0$ mm to $z \le -50.0$ mm). The benchmark was stopped prematurely at $10$ steps, whereas seating physically requires at least $14$ steps.
2. **Task 2 (Multifingered Lift):** The world model was trained on $25$ episodes of uniform random exploration that completely lacked coordinated multi-finger preload ($F_n \ge 4.0$ N) and synchronized lifting. The Cross-Entropy Method (CEM) planner discovered pathological, out-of-distribution regions of the uncalibrated neural network world model, hallucinating massive lift height and creating an astronomical **Planner Exploitation Gap of $\text{PEG} = 7,616.27$**. Executed in reality, the fingers slipped immediately, producing $0.01$ mm lift.

**Stage P2.4 Objective:**  
Stage P2.4 shifts from passive observation to **Active Contact-Mode Mining (ACMM)**. Rather than collecting unfocused random data, ACMM deliberately identifies unlearned contact modes and contact boundaries, actively acquires targeted transition trajectories, and incorporates them into world model training.

---

## 2. Mathematical Framing & Core Acquisition Signals

An acquisition function $A(\tau)$ evaluates candidate trajectory rollouts $\tau = \{(s_t, a_t, s_{t+1}, \Sigma_t, F_t)\}_{t=0}^{H-1}$ generated in the training environment to select high-value, informative physical transitions.

### 2.1 The Five Acquisition Signals

$$A(\tau) = w_1 \tilde{U}_{\text{mode}}(\tau) + w_2 \tilde{U}_{\text{disagreement}}(\tau) + w_3 \tilde{U}_{\text{boundary}}(\tau) + w_4 \tilde{U}_{\text{optimism}}(\tau) + w_5 \tilde{U}_{\text{recovery}}(\tau)$$

where $\tilde{U}$ denotes the min-max normalized signal across candidate rollouts, and $\sum_{k=1}^5 w_k = 1.0$ (baseline default: $w_k = 0.20$).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        ACTIVE CONTACT-MODE ACQUISITION ENGINE                          │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ 1. Mode Uncertainty      │ 2. Model Disagreement      │ 3. Boundary Proximity         │
│ U_mode = -∑ p_k log p_k  │ U_disag = Var(x^(1)...x^(M))│ U_bound = exp(-||Ft-μFn||/σ)  │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ 4. Planner Optimism      │ 5. Failure / Recovery Value │ 6. Deduplication & Selection  │
│ U_opt = max(0, J_WM-J_sim│ U_rec = I(Slip->Grip, Wedge)│ Distance metric filtering     │
└──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

#### Signal 1: Contact-Mode Classification Entropy ($U_{\text{mode}}$)
Measures the ambiguity of the contact mode classifier among the 7 discrete contact strata:
$$U_{\text{mode}}(\tau) = \frac{1}{H} \sum_{t=0}^{H-1} \left( - \sum_{k=1}^7 p(m_t = k \mid s_t, a_t) \log p(m_t = k \mid s_t, a_t) \right)$$
Maximizes acquisition around ambiguous impact, incipient slip, wedging, and chamfer transitions.

#### Signal 2: Epistemic Prediction Disagreement ($U_{\text{disagreement}}$)
Measures model variance across an ensemble of $M$ bootstrap models or Monte Carlo dropout passes:
$$\bar{x}_{t+1} = \frac{1}{M} \sum_{m=1}^M \hat{f}^{(m)}(s_t, a_t), \quad U_{\text{disagreement}}(\tau) = \frac{1}{H} \sum_{t=0}^{H-1} \left( \frac{1}{M} \sum_{m=1}^M \|\hat{f}^{(m)}(s_t, a_t) - \bar{x}_{t+1}\|_2^2 \right)$$
Identifies regions of parameter uncertainty where world models diverge.

#### Signal 3: Physical Contact-Boundary Proximity ($U_{\text{boundary}}$)
Measures how closely the contact trajectory grazes critical physical boundaries:
- **Coulomb Friction Cone Boundary (Slip Onset):**
  $$\Delta_{\text{friction}}(t) = | \|F_{t, \text{shear}}\| - \mu F_{t, \text{normal}} |$$
- **Geometric Wedging Boundary (Peg-in-Hole Tilting):**
  $$\Delta_{\text{wedge}}(t) = | \theta_{\text{tilt}}(t) - \theta_{\text{crit}} |, \quad \theta_{\text{crit}} = \arctan\left(\frac{2\delta}{L}\right)$$
- **Boundary Score Formulation:**
  $$U_{\text{boundary}}(\tau) = \frac{1}{H} \sum_{t=0}^{H-1} \exp\left( - \frac{\Delta_{\text{friction}}(t)}{\sigma_{\text{friction}}} \right) + \exp\left( - \frac{\Delta_{\text{wedge}}(t)}{\sigma_{\text{wedge}}} \right)$$

#### Signal 4: Planner Optimism / Exploitation Severity ($U_{\text{optimism}}$)
Quantifies the optimizer's curse on candidate actions:
$$U_{\text{optimism}}(\tau) = \max\left(0, \hat{J}_{\text{WM}}(\tau) - J_{\text{sim}}(\tau)\right)$$
Actively targets candidate sequences where the world model overestimates return, forcing the learner to correct over-optimistic hallucinations.

#### Signal 5: Failure & Recovery Value ($U_{\text{recovery}}$)
Prioritizes trajectories that contain dynamic transitions between failure and recovery:
- Slip $\to$ Grip recovery ($m_t = \text{IncipientSlip} \to m_{t+1} = \text{Sticking}$)
- Wedging $\to$ Compliance breakaway ($m_t = \text{Wedging} \to m_{t+1} = \text{ChamferSliding}$)
- Successful goal achievement ($\text{seated} = \text{True}$ or $\text{lifted} = \text{True}$)
$$U_{\text{recovery}}(\tau) = \sum_{t=0}^{H-2} \mathbf{1}_{\text{recovery\_event}}(t) + 2.0 \cdot \mathbf{1}_{\text{goal\_achieved}}(\tau)$$

---

## 3. Five-Way Acquisition Experiment Matrix

We define five data-collection regimes evaluated on both Task 1 and Task 2 under an identical budget of $N_{\text{active}} = 60$ mined episodes:

| Strategy ID | Strategy Name | Primary Acquisition Driver | Description |
| :--- | :--- | :--- | :--- |
| **D0** | **Passive Baseline** | Passive exploration | Original 25 passive episodes (no active data). |
| **D1** | **Random Exploration** | Uniform exploration | Adds 60 randomly sampled simulator episodes. |
| **D2** | **Boundary Sampling** | Friction cone & wedging | Focuses purely on $\|F_t\| \approx \mu F_n$ and $\theta \approx \theta_{\text{crit}}$. |
| **D3** | **Uncertainty & Disagreement** | Epistemic variance | Focuses on mode entropy $U_{\text{mode}}$ and ensemble variance $U_{\text{disag}}$. |
| **D4** | **Combined ACMM** | Unified multi-signal | Full weighted combination $A(\tau)$ with trajectory deduplication. |

---

## 4. Experimental Design Corrections from Stage P2.3

1. **Task 1 Horizon Extended to 25 Steps:**  
   The evaluation horizon is increased from 10 steps to 25 steps across all regimes. At $5.0$ mm/step, 25 steps provides $125.0$ mm of downward displacement capacity, allowing full seating ($\ge 65.0$ mm) without artificial temporal truncation.

2. **Task 2 Coordinated Preload in Exploration Pool:**  
   Candidate exploration sequences for Task 2 explicitly sample coordinated finger squeeze actions ($F_n \in [4, 20]$ N) prior to arm lift commands, guaranteeing that the candidate pool contains genuine grasp-and-lift experiences.

3. **Strict Separation of Held-Out Test Set:**  
   All active mining, boundary sampling, and retraining operate exclusively on training environments. The 30 calibration episodes and 30 test episodes frozen in P2.3 remain 100% untouched.

---

## 5. Architectural Directory Layout

```
research/PROBE-1/Research-002/
├── 18-p24-acmm-specification.md
├── 19-acquisition-score-design.md
├── 20-contact-boundary-sampling.md
├── 21-active-data-collection-protocol.md
├── 22-p24-experiment-protocol.md
├── src/
│   └── mining/
│       ├── __init__.py
│       ├── acquisition_scorer.py
│       ├── contact_boundary_sampler.py
│       ├── trajectory_selector.py
│       ├── episode_deduplicator.py
│       └── mining_evaluator.py
└── experiments/
    └── active_contact_mining/
        ├── configs/
        ├── collected_episodes/
        ├── acquisition_logs/
        ├── checkpoints/
        └── results/
```

---

## 6. Completion Gate Criteria

Stage P2.4 will be declared successful if and only if:
1. **Transition Discovery:** ACMM discovers at least $3\times$ more contact transitions ($\Sigma = \text{Impact}, \text{Wedging}, \text{Slip}, \text{Lift}$) than random exploration.
2. **Prediction Accuracy:** Retrained world models reduce next-state and contact force RMSE on held-out transitions compared to D0 and D1.
3. **Calibration & Efficiency:** Planner-matched calibration retains $\ge 90.0\%$ simultaneous coverage with equal or tighter prediction interval widths.
4. **Task 2 Manipulation Progress:** Task 2 achieves measurable lift height ($z_{\text{obj}} \ge 5.0$ mm) and non-zero task success.
5. **Task 1 Manipulation Success:** Task 1 achieves non-zero task completion under the corrected 25-step horizon.
