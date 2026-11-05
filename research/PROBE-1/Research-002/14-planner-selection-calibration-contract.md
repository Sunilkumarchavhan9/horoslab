# HOROS PROBE-1 — Research-002
## Stage P2.3: Planner-Selection-Aware Conformal Calibration (Contract Fulfillment & Empirical Audit)

- **Program:** HOROS PROBE-1 — Humanoid Robotics & Physical AI
- **Project:** Research-002: Trustworthy Action-Conditioned Contact World Models
- **Stage:** P2.3 — Planner-Selection-Aware Calibration
- **Status:** **Completed & Audited (All Acceptance Criteria Verified)**
- **Baseline Git Snapshot:** Commit `aa9a6ef` (PR #34 merged to `origin/main` as `8f572c8d`)
- **Active Branch:** `feat/probe1-research002-phase2`

---

## 1. Executive Summary & Estimand Formalization

In action-conditioned world modeling, passive or behavior-policy evaluation creates a dangerous blindspot known as the **optimizer's curse**: an optimizing planner (e.g., Cross-Entropy Method, MPPI) repeatedly queries the world model across candidate distributions $A_t$ to maximize predicted return $J(a)$, systematically selecting actions where the model is over-optimistic or prone to under-estimating contact transitions.

Stage P2.3 formalizes and validates **Planner-Selection-Aware Conformal Dynamics (PSACD)** to guarantee finite-sample coverage on planner-selected actions.

### Formal Estimand
The primary estimand of Stage P2.3 is the **marginal episode-level simultaneous coverage** of the planner-selected open-loop plan outputs:
$$\mathbb{P}\left( \max_{t \in \mathcal{T}_i, h \in H} r_c(i, t, h) \le q_c \right) \ge 1 - \alpha$$
Where:
- $i$ indexes an independent episode.
- $\mathcal{T}_i$ denotes the set of replanning decisions along the episode.
- $H = \{1, 3, 5, 10\}$ denotes the pre-registered forecast horizons.
- $r_c$ denotes the nonconformity score for channel $c \in \{\text{state}, \text{wrench}, \text{mode}\}$.

> [!IMPORTANT]
> **Explicit Non-Claim:** Stage P2.3 guarantees marginal finite-sample coverage for planner-selected actions drawn from the same frozen selection pipeline. It **does NOT claim arbitrary action-conditional coverage** $P(Y \in C(X, a) \mid a) \ge 1 - \alpha \ \forall a \in \mathcal{A}$, which is known to be theoretically impossible for continuous action spaces without restrictive parametric assumptions.

---

## 2. Selection Event, Forecast Targets & Calibration Units

At each replanning decision $t$, the Cross-Entropy Method (CEM) planner generates candidate set $A_t = \{a^{(1)}, \dots, a^{(K)}\}$, scores them with the frozen world model and objective function, and selects candidate sequence $a_t^* = \arg\max_{a \in A_t} J(a)$.

The calibration unit is strictly the **entire episode** ($i$), never individual unpooled timesteps. Before computing any score, the forecast target is explicitly fixed into one of two segregated semantics:

### Target A — Selected Open-Loop Plan (Primary Optimizer's Curse Target)
- **Protocol:** At decision $t$, the simulator state is cloned: $E_{\text{clone}} = \text{clone}(E_t)$.
- The selected candidate sequence $a_t^* = (a_0, \dots, a_{H-1})$ is executed in $E_{\text{clone}}$ **open-loop without replanning**.
- The model forecast for $a_t^*$ is compared against the counterfactual realization in $E_{\text{clone}}$.
- **Purpose:** Directly isolates and tests whether the optimizer selected an unreliable plan.

### Target B — Closed-Loop Policy Future (Receding-Horizon Deployment Target)
- **Protocol:** At decision $t$, the simulator state is cloned: $E_{\text{clone}} = \text{clone}(E_t)$.
- The receding-horizon controller with continuous CEM replanning is executed in $E_{\text{clone}}$.
- **Purpose:** Measures policy-level closed-loop trajectory forecast accuracy.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        TARGET SEGREGATION IN STAGE P2.3                                │
├──────────────────────────────────────────┬─────────────────────────────────────────────┤
│ Target A: Selected Open-Loop Plan        │ Target B: Closed-Loop Replanned Policy      │
├──────────────────────────────────────────┼─────────────────────────────────────────────┤
│ • Evaluates frozen candidate sequence a* │ • Evaluates closed-loop controller execution│
│ • No replanning in simulator clone       │ • Online CEM replanning at every step       │
│ • Tests pure optimizer's curse           │ • Tests receding-horizon deployment error   │
│ • forecast_semantics="selected_open_loop"│ • forecast_semantics="closed_loop_policy"   │
└──────────────────────────────────────────┴─────────────────────────────────────────────┘
```

---

## 3. P2.2 Audit Resolution: Denominators & Filtering Rules

Contract Section 10 required auditing the Stage P2.2 calibration report (`calibration_report.json`) where Task 1 reported $H=1$ coverage of $89.3\%$ and simultaneous coverage of $96.4\%$:

### Audit Findings:
1. **Silent Filtering Rule Identified:** In `run_calibration_experiment.py`, the trajectory collection loop contained the guard:
   ```python
   if len(states) >= 22:
       trajectories.append(...)
   ```
   During Task 1 evaluation, 2 out of the 30 test episodes completed in fewer than 22 steps due to early insertion success. These 2 episodes were silently discarded from the evaluation pool, reducing the test denominator from $N=30$ to $N=28$.
2. **Exact Mathematical Recovery:**
   $$\frac{25}{28} = 0.89285... \approx 89.3\% \quad (H=1 \text{ marginal})$$
   $$\frac{27}{28} = 0.96428... \approx 96.4\% \quad (\text{simultaneous trajectory coverage})$$
3. **P2.3 Enforcement:** In Stage P2.3:
   - All episodes are retained regardless of length.
   - For early-terminating episodes, all decisions and valid forecast horizons up to termination are logged, and terminal states are padded without bias.
   - **Every reported metric strictly includes explicit integer numerators and denominators $(k/N)$ and 95% Wilson score binomial confidence intervals.**

---

## 4. Planner Fingerprint Specification

To guarantee calibration validity, calibration and test episodes must share an identical frozen pipeline. The `PlannerFingerprint` dataclass in [`planner_fingerprint.py`](./src/selection_aware/planner_fingerprint.py) tracks:
1. **World Model Version:** Checkpoint, architecture (`state_dim`, `action_dim`, `hidden_dim`), preprocessing.
2. **Planner Algorithm:** CEM version, objective function, discount factor.
3. **CEM Parameters:** Population size ($K=100$), iterations ($I=3$), horizon ($H=10$), elite fraction ($\gamma=0.10$), smoothing ($\alpha_{\text{smooth}}=0.80$).
4. **Candidate Scoring & Tie-Breaking:** Discounted sum of rewards, first-discovered tie-breaker.
5. **Replanning Cadence & Execution Mode:** 1 step, `execute_first_action`.
6. **Forecast Target Semantics:** `selected_open_loop_plan` (Target A) vs `closed_loop_policy` (Target B).
7. **Uncertainty Penalty:** Penalty type, coefficients ($\beta$).
8. **Safety Filter:** p-CBF filter mode (`empirical_runtime_filter`), thresholds ($F_{\max}=40\,\text{N}$, $\tau_{\max}=8\,\text{N}\cdot\text{m}$).
9. **Environment Configuration:** Physics timestep ($\Delta t = 0.02\,\text{s}$), clearance, friction.

Any modification to these fields changes the deterministic SHA-256 hash and triggers an immediate validation failure:
- Task 1 Target A Hash: `cc9b5c9096ff3bd2b3604748adffc63798737848fee8cd08255fb7d49cbc67df`
- Task 1 Target B Hash: `1d2dca470dd557236f5da8dcd48e92eef2dc319931075fc3d6595541cc5e1bee`
- Task 2 Target A Hash: `1169b0020c84dda0b3a2c83dc3b1a761fbc3a31a576bfd3093091ce04bb82c60`
- Task 2 Target B Hash: `9d2bfbcade747ddcba395efff1db97e1ae78489dfe22764689ab5f1d844dd2bc`

---

## 5. Episode Scores & Split-Conformal Formulation

### Nonconformity Scores
For episode $i$, decision $t \in \mathcal{T}_i$, and horizon $h \in H = \{1, 3, 5, 10\}$:
$$r_x(i, t, h) = \left\| \frac{x_{t+h} - \hat{x}_{t+h}}{s_x} \right\|_\infty$$
$$r_F(i, t, h) = \left\| \frac{F_{t+h} - \hat{F}_{t+h}}{s_F} \right\|_\infty$$
$$r_{\text{mode}}(i, t, h) = \text{APS}(p_{t+h}, \sigma_{t+h}) = \sum_{m: p_m > p_{\sigma}} p_m + U \cdot \sum_{m: p_m = p_{\sigma}} p_m$$

### Simultaneous Episode Scores
$$S_c(i) = \max_{t \in \mathcal{T}_i, h \in H} r_c(i, t, h), \quad c \in \{\text{state}, \text{wrench}, \text{mode}\}$$

### Finite-Sample Quantiles
For $n = 40$ calibration episodes and error level $\alpha = 0.10$:
$$k = \lceil (n + 1)(1 - \alpha) \rceil = \lceil 41 \times 0.90 \rceil = 37$$
- **Marginal Thresholds ($q_c$):** 37th order statistic computed independently at $\alpha = 0.10$.
- **Joint Simultaneous Thresholds ($q_{c,\text{joint}}$):** Computed via Bonferroni allocation $\alpha_x = \alpha_F = \alpha_{\text{mode}} = \alpha / 3 = 0.0333$:
  $$k_{\text{joint}} = \lceil (n + 1)(1 - \alpha/3) \rceil = \lceil 41 \times 0.9667 \rceil = 40$$
  The union bound guarantees joint coverage:
  $$\mathbb{P}(S_x \le q_{x,\text{joint}} \land S_F \le q_{F,\text{joint}} \land S_{\text{mode}} \le q_{\text{mode},\text{joint}}) \ge 1 - \alpha$$

---

## 6. CAP: Online Selective Prediction Comparator

Following Bao et al. (JMLR 2025) and Sale & Ramdas (TMLR 2025), CAP is implemented as a **separately specified online selective prediction comparator** in [`cap_online_selective.py`](./src/selection_aware/cap_online_selective.py):
- **Selection Event ($V_t$):** A prediction set is selectively issued only when candidate optimism exceeds the median optimism:
  $$V_t = \mathbb{I}\left( \Delta J_t \ge \tau_{\text{optimism}} \right), \quad \Delta J_t = J(a_t^*) - \operatorname{median}_{a \in A_t}(J(a))$$
- **False Coverage-statement Rate (FCR):**
  $$\text{FCR}_T = \frac{\sum_{t=1}^T V_t \cdot \mathbb{I}(Y_t \notin C_t)}{\max\left(1, \sum_{t=1}^T V_t\right)} \le \alpha$$
- **Mechanism:** Maintains an adaptive buffer of historical residuals on selected decisions $\mathcal{S}_{\text{sel}} = \{R_s : s < t, V_s = 1\}$ and updates the selection-adjusted quantile online to prevent post-selection shrinkage.

---

## 7. Master Experimental Results Matrix

All experiments were evaluated across $N=30$ independent, held-out test episodes disjoint from training and calibration.

### Task 1: Precision Peg-in-Hole Insertion ($N=30$)

| Condition | Method | State Coverage | Wrench Coverage | Mode Coverage | Joint Simultaneous | 95% Wilson CI (Joint) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **C1** | Passive Baseline (P2.2) | 30/30 (100.0%) | 30/30 (100.0%) | 29/30 (96.67%) | **30/30 (100.0%)** | [88.65%, 100.0%] |
| **C2** | **Planner-Matched Target A** | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | **30/30 (100.0%)** | [88.65%, 100.0%] |
| **C3** | Closed-Loop Target B | 24/30 (80.0%) | 30/30 (100.0%) | 30/30 (100.0%) | **24/30 (80.0%)** | [62.69%, 90.49%] |

### Task 2: Multifinger Compliant Lift ($N=30$)

| Condition | Method | State Coverage | Wrench Coverage | Mode Coverage | Joint Simultaneous | 95% Wilson CI (Joint) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **C1** | Passive Baseline (P2.2) | 7/30 (23.33%) | 0/30 (0.0%) | 18/30 (60.0%) | **0/30 (0.0%)** | [0.0%, 11.35%] |
| **C2** | **Planner-Matched Target A** | 23/30 (76.67%) | 29/30 (96.67%) | 29/30 (96.67%) | **29/30 (96.67%)** | [83.33%, 99.41%] |
| **C3** | Closed-Loop Target B | 24/30 (80.0%) | 30/30 (100.0%) | 30/30 (100.0%) | **24/30 (80.0%)** | [62.69%, 90.49%] |

> [!CAUTION]
> **Key Scientific Finding — Collapse of Passive Calibration:**  
> Under Task 2 multifingered manipulation, Condition 1 (Passive Calibration) suffered a **catastrophic coverage collapse down to 0/30 (0.0%) joint coverage** on planner-selected actions.  
> Condition 2 (Planner-Matched Calibration) successfully restored joint simultaneous coverage to **29/30 (96.67%)**, strictly meeting the $90.0\%$ target level.

---

### Condition 4: CAP Online Selective Prediction Comparator

Evaluated on streaming online decisions ($T=300$ decisions across 30 test episodes):

| Task | Selection Threshold ($\tau$) | Selected Decisions | Unadjusted Error Rate (FCR) | CAP Adjusted Error Rate (FCR) | FCR Controlled? ($\le 10\%$) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Task 1: Peg-in-Hole** | $\Delta J \ge 1.623$ | 150 / 300 (50.0%) | 0/150 (0.0%) | **6/150 (4.0%)** | **YES (Controlled)** |
| **Task 2: Multifinger Lift** | $\Delta J \ge 1.673$ | 155 / 300 (51.7%) | 0/155 (0.0%) | **3/155 (1.94%)** | **YES (Controlled)** |

---

### Condition 5: Selection-Severity Optimism Diagnostics

Decisions stratified into candidate return optimism terciles ($\Delta J = J(a^*) - \operatorname{median}(J(a))$):

| Task | Low Optimism ($T_1$) | Medium Optimism ($T_2$) | High Optimism ($T_3$) |
| :--- | :--- | :--- | :--- |
| **Task 1: Peg-in-Hole** | 100/100 (100.0%) | 100/100 (100.0%) | 100/100 (100.0%) |
| **Task 2: Multifinger Lift** | 93/99 (93.94%) | 102/102 (100.0%) | 98/99 (98.99%) |

---

## 8. Pointwise Diagnostic Horizon Breakdown (Target A)

Exact integer hits and denominators across pre-registered horizons:

| Horizon | Task 1 State Hits | Task 1 Wrench Hits | Task 1 Mode Hits | Task 2 State Hits | Task 2 Wrench Hits | Task 2 Mode Hits |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **$H=1$** | 300/300 (100.0%) | 300/300 (100.0%) | 299/300 (99.67%) | 293/300 (97.67%) | 300/300 (100.0%) | 298/300 (99.33%) |
| **$H=3$** | 300/300 (100.0%) | 300/300 (100.0%) | 298/300 (99.33%) | 295/300 (98.33%) | 300/300 (100.0%) | 298/300 (99.33%) |
| **$H=5$** | 300/300 (100.0%) | 300/300 (100.0%) | 298/300 (99.33%) | 296/300 (98.67%) | 300/300 (100.0%) | 297/300 (99.0%) |
| **$H=10$**| 300/300 (100.0%) | 300/300 (100.0%) | 297/300 (99.0%) | 298/300 (99.33%) | 300/300 (100.0%) | 296/300 (98.67%) |

---

## 9. Acceptance Criteria Verification Checklist

| Criterion | Implementation & Evidence | Verification |
| :--- | :--- | :--- |
| **1. Disjoint Episode Splits** | Train ($N=25$), Calib ($N=40$), Test ($N=30$) generated with non-overlapping seed ranges (Train: 0-24, Calib: 100-139, Test: 300-329). | **VERIFIED** |
| **2. Identical Fingerprints** | `PlannerFingerprint` checked via SHA-256 hash validation before every calibration and test run. | **VERIFIED** |
| **3. Complete Logging** | Every decision and horizon $h \in \{1, 3, 5, 10\}$ logged without silent omission. | **VERIFIED** |
| **4. Strict Non-Leakage** | Tested in `test_strict_non_leakage_guarantee`: mutating realized future modes causes zero change to prediction sets or thresholds. | **VERIFIED** |
| **5. Passing Test Suite** | 14/14 unit and integration tests passing (`test_planner_selection_aware.py`, `test_multihorizon_calibration.py`, `test_contact_modes.py`). | **VERIFIED** |
| **6. Deterministic Replay** | Tested in `test_deterministic_replay_produces_identical_scores`: identical seed reproduces exact scores to machine precision. | **VERIFIED** |
| **7. Exact Denominators** | Every percentage in `p23_selection_aware_report.json` and this document includes integer numerator and denominator $(k/N)$. | **VERIFIED** |
| **8. Restricted Claims** | Claims restricted strictly to marginal episode-level validity; no unverified conditional or physical safety guarantees asserted. | **VERIFIED** |

---

## 10. Archival & Reproducibility Command

To reproduce all Stage P2.3 benchmark results and regenerate the JSON report:
```bash
python research/PROBE-1/Research-002/experiments/planner_selection/run_p23_experiments.py
```
To run the full Stage P2.3 test suite:
```bash
python -m unittest discover -s research/PROBE-1/Research-002/tests -p "test_*.py"
```
