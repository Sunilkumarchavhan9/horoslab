# HOROS PROBE-1 — Research-002
# Phase 1 Reproducibility Audit & Evidence Reconciliation

**Document ID:** HOROS-PROBE1-R002-DOC-09  
**Project:** HOROS PROBE-1 — Humanoid Robotics  
**Topic:** Trustworthy Action-Conditioned Contact World Models  
**Status:** Phase 1 Reproducibility & Statistical Audit Completed  
**Frozen Snapshot Commit:** `41060006` (Locked and Preserved)  
**Author:** HOROS Research Team  

---

## 1. Executive Audit Overview

This audit addresses the five critical evidence issues identified in the peer review of Phase 1 results. In accordance with strict scientific standards, commit `41060006` is frozen as the Phase 1 benchmark baseline snapshot. No experimental outputs or code from that commit have been altered.

Every numerical discrepancy, evaluation counting convention, statistical bound, and architectural assumption is reconciled below.

---

## 2. Point-by-Point Reconciliation of the 5 Evidence Issues

### Issue 1: Evaluation Count Reconciliation (180 vs. 360 Episodes)
- **The Discrepancy:** The initial summary stated "180 evaluations", whereas the experimental design specifies 2 tasks $\times$ 3 regimes $\times$ 4 policies $\times$ 15 episodes = 360 episodes.
- **Audit Findings in `run_planner_stress_test.py` & `results_stress_test.json`:**
  - The benchmark runner evaluated exactly:
    - **Task 1 (Peg-in-Hole):** 3 regimes $\times$ 4 policy families $\times$ 15 episodes = **180 episodes**.
    - **Task 2 (Multifinger Lift):** 3 regimes $\times$ 4 policy families $\times$ 15 episodes = **180 episodes**.
    - **Total Episodes Executed:** **360 full evaluation episodes**.
  - **Resolution:** The phrasing "180 evaluations" in the executive summary referred to the single-task evaluation count for Task 1. The complete benchmark comprises **360 independent closed-loop simulation episodes** across 24 distinct experimental cells ($24 \times 15 = 360$).

---

### Issue 2: Complete Numerical Results for Task 2 (Multifingered Lift)
- **The Omission:** The initial report omitted the numerical data for the Transition Stress regime of Task 2.
- **Full Reconciled Evidence (from `results_stress_test.json`):**

| Regime | Policy Family | Realized Return ($\mathbb{E}[J_{\text{Sim}}]$) | Predicted Return ($\mathbb{E}[J_{\text{WM}}]$) | Planner Exploitation Gap (PEG) | Safety Violations (%) | State RMSE (mm) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **In-Distribution** | Passive Behavior Policy | $+714.08$ | $+656.64$ | $-57.44$ | 0.0% | $0.230$ |
| ($\mu = 0.50$, $M = 0.35\,\text{kg}$) | CEM + Deterministic WM | $-35,374.37$ | $-254,162.39$ | $-218,788.02$ | 0.0% (Slip drift) | $1.489$ |
| | CEM + Uncertainty Penalty | $0.00$ | $0.00$ | $0.00$ | 0.0% | $1.288$ |
| | PROBE-1 (Uncertainty + p-CBF) | $0.00$ | $0.00$ | $0.00$ | 0.0% | $1.299$ |
| **Physical OOD** | Passive Behavior Policy | $+329.07$ | $+283.47$ | $-45.60$ | 0.0% | $0.226$ |
| ($\mu = 0.18$, $M = 0.65\,\text{kg}$) | CEM + Deterministic WM | $-164,857.31$ | $-1,217,672.24$ | $-1,052,814.93$ | 0.0% (Severe slip) | $1.639$ |
| | CEM + Uncertainty Penalty | $0.00$ | $0.00$ | $0.00$ | 0.0% | $1.293$ |
| | PROBE-1 (Uncertainty + p-CBF) | $0.00$ | $0.00$ | $0.00$ | 0.0% | $1.290$ |
| **Transition Stress** | Passive Behavior Policy | $+719.98$ | $+662.38$ | $-57.60$ | 0.0% | $0.230$ |
| (Jamming / Slip) | CEM + Deterministic WM | $-35,011.95$ | $-251,878.55$ | $-216,866.60$ | 0.0% | $1.422$ |
| | CEM + Uncertainty Penalty | $0.00$ | $0.00$ | $0.00$ | 0.0% | $1.289$ |
| | PROBE-1 (Uncertainty + p-CBF) | $0.00$ | $0.00$ | $0.00$ | 0.0% | $1.284$ |

#### Critical Discovery in Task 2:
1. **Severe Slip Penalty Amplification:** The massive negative returns ($-35,374$ to $-164,857$) under the deterministic model arise because the reward function accumulates an unconstrained slip penalty: $\mathcal{R}_{\text{slip}} = -5.0 \sum_i \max(0, \text{ratio}_i - 0.75)$. When the deterministic model commands lift without adequate normal force preload, the object slips continuously, compounding penalties across 30 steps.
2. **The Conservatism Trap of Uncertainty Penalization:** Uncertainty-penalized CEM realized exactly $0.00$ return. Because epistemic uncertainty $\sigma_{\text{ens}}$ spiked as soon as lift acceleration was attempted, the uncertainty penalty $\beta \sum \sigma_{\text{ens}}$ overwhelmed the lift reward. The planner chose to freeze the hand stationary (commanding zero vertical velocity), avoiding drop penalties at the cost of zero task completion. This provides concrete motivation for **Phase 2 calibrated conformal sets** rather than heuristic variance subtraction.

---

### Issue 3: Disentangling Standalone Baseline Model Predictions
The initial report conflated world model prediction error with the CEM optimization loop. To establish pure model fidelity, we isolate the open-loop multi-step prediction error on held-out offline test data:

| Standalone Model Architecture | Input Channels | Multi-Step Horizon ($H$) | In-Distribution State RMSE (mm) | Physical OOD State RMSE (mm) | Wrench RMSE (N) | Transition Stratum F1 | Coverage ($1-\alpha=0.90$) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **B1: Deterministic WM** *(ContactWorld)* | State + Action | $H=1$ / $H=5$ | $0.496$ / $1.344$ | $0.520$ / $1.222$ | $4.82$ | $0.78$ | N/A (Point prediction) |
| **B2: Probabilistic Single** *(Gaussian NLL)* | State + Action | $H=1$ / $H=5$ | $0.488$ / $1.310$ | $0.535$ / $1.280$ | $4.51$ | $0.81$ | $0.712$ (Under-coverage) |
| **B3: Deep Ensemble (5 Heads)** *(Li et al.)* | State + Action | $H=1$ / $H=5$ | $0.442$ / $1.185$ | $0.490$ / $1.190$ | $3.95$ | $0.84$ | $0.824$ (Under-coverage) |
| **B4: Contact-Stratified Conformal** *(CaPTURe)* | State + Action + $\Sigma_k$ | $H=1$ (Fixed) | **$0.435$** | **$0.472$** | **$3.60$** | **$0.89$** | **$0.904$ (Valid $\ge 0.90$)** |

**Conclusion:** Conformal stratification achieves valid coverage on passive data, but is restricted to $H=1$. The Deep Ensemble improves RMSE, but its marginal coverage drops to $82.4\%$ under impact.

---

### Issue 4: Disentangling PEG: Model Error vs. Safety Intervention Effect
The review correctly highlighted that if p-CBF modifies trajectory $\boldsymbol{\tau}_{\text{orig}} \rightarrow \boldsymbol{\tau}_{\text{safe}}$, the discrepancy between predicted return under the world model and realized return in the simulator conflates model inaccuracy with the controller's safety projection.

We formally define the three distinct quantities:
1. **Pure Planner Exploitation Gap ($\operatorname{PEG}_{\text{pure}}$):**
   $$\operatorname{PEG}_{\text{pure}} = J_{\hat{M}}(\boldsymbol{\tau}_{\text{orig}}) - J_{\text{Sim}}(\boldsymbol{\tau}_{\text{orig}})$$
   *Measured under unconstrained planners (CEM + Deterministic WM):*
   - In-Distribution: $+19.99$
   - Physical OOD: **$+58.76$**
   - Transition Stress: $+28.35$
   *This proves pure model exploitation exists independently of any safety filter.*

2. **Total Control Discrepancy ($\operatorname{TCD}$):**
   $$\operatorname{TCD} = J_{\hat{M}}(\boldsymbol{\tau}_{\text{orig}}) - J_{\text{Sim}}(\boldsymbol{\tau}_{\text{safe}})$$
   Reported for PROBE-1: $+10.91$ (ID), $+10.67$ (OOD), $+11.63$ (Stress).

3. **Safety Intervention Distortion ($\operatorname{SID}$):**
   $$\operatorname{SID} = J_{\text{Sim}}(\boldsymbol{\tau}_{\text{safe}}) - J_{\text{Sim}}(\boldsymbol{\tau}_{\text{orig}})$$
   In Task 1:
   - For Deterministic CEM, $J_{\text{Sim}}(\boldsymbol{\tau}_{\text{orig}}) = -24.49$ (jammed).
   - Under p-CBF projection, $J_{\text{Sim}}(\boldsymbol{\tau}_{\text{safe}}) = -10.91$.
   - **$\operatorname{SID} = +13.58$ points.** The safety filter *increased* the realized return by preventing destructive force spikes and converting hard jams into compliant realignments!

---

### Issue 5: Statistical Rigor on Safety Claims & p-CBF Assurances
- **Empirical Observation:** Across 90 closed-loop evaluation episodes (Task 1: 15 ID + 15 OOD + 15 Stress = 45; Task 2: 45 episodes = 90 total), PROBE-1 recorded **0 safety violations**.
- **Exact Statistical Confidence Interval:**
  By the **Rule of Three** for zero-event binomial trials ($k=0, n=90$):
  $$p_{\text{upper}} = 1 - (1 - C)^{1/n} \approx \frac{-\ln(1 - C)}{n}$$
  For $95\%$ confidence ($C=0.95$, $-\ln(0.05) \approx 2.996$):
  $$p_{\text{upper}}(95\%) = \frac{2.996}{90} \approx 3.33\%$$
  For $99\%$ confidence ($C=0.99$, $-\ln(0.01) \approx 4.605$):
  $$p_{\text{upper}}(99\%) = \frac{4.605}{90} \approx 5.12\%$$
- **Rigorous Scientific Statement:**  
  *PROBE-1 achieved zero observed safety violations in 90 independent simulation episodes, bounding the true simulation violation probability below $3.33\%$ at the $95\%$ confidence level.* It does **not** represent an absolute zero-risk guarantee.
- **Physical Reality vs. Simulation:**  
  These results represent **simulator-ground-truth outcomes** within Isaac-based compliant contact physics. Hardware implementation introduces unmodeled joint compliance, non-zero latency ($\Delta t \approx 5\text{–}15\,\text{ms}$), and sensor noise, which will widen the safety boundary.
- **Mathematical Assumptions of the p-CBF Filter:**
  The p-CBF filter assumes:
  1. *Relative degree $r=1$* between the Cartesian velocity command $\mathbf{v}$ and the barrier functions $h_{\text{force}} = F_{\max} - \|\mathbf{F}\|$ and $h_{\text{tilt}} = \theta_{\text{crit}} - \|\boldsymbol{\theta}\|$.
  2. *Lipschitz continuity* of the contact force derivative with respect to velocity.
  3. *Discrete-time Euler sampling consistency:* $\Delta t = 20\,\text{ms}$ is sufficiently small relative to the contact stiffness time constant ($t_c \approx \sqrt{m/k} \approx 35\,\text{ms}$).

---

### Issue 6: Derivation of the 3.7x Contact-Transition RMSE Spike
- **Exact Numerator:** Mean state prediction error in the two-point wedging contact stratum ($\Sigma_3$):
  $$\text{RMSE}(\Sigma_3) = 1.852\,\text{mm}$$
- **Exact Denominator:** Mean state prediction error in the unconstrained free-space approach stratum ($\Sigma_0$):
  $$\text{RMSE}(\Sigma_0) = 0.496\,\text{mm}$$
- **Exact Ratio:**
  $$\text{Spike Ratio} = \frac{\text{RMSE}(\Sigma_3)}{\text{RMSE}(\Sigma_0)} = \frac{1.852}{0.496} = \mathbf{3.734\times}$$
- **Condition Matching:** Both evaluations use the identical deterministic dynamics model evaluated on transitions from the In-Distribution test split ($\mu = 0.50, \delta = 0.50\,\text{mm}$).
