# HOROS PROBE-1 — Research-002
## Stage P2.4: Experiment Protocol — Five-Way Active Mining Comparison
**Program:** HOROS PROBE-1 — Humanoid Robotics & Physical AI  
**Project:** Research-002: Trustworthy Action-Conditioned Contact World Models  
**Document:** 22-p24-experiment-protocol.md  
**Status:** Protocol Specification  

---

## 1. Experiment Overview & Five-Way Comparison Matrix

To evaluate whether targeted active mining improves physical prediction and manipulation compared to passive or random data acquisition, we execute a rigorous five-way benchmark on both Task 1 (Peg-in-Hole) and Task 2 (Multifinger Lift):

| Strategy ID | Acquisition Strategy | Description | Active Budget | Total Training Size |
| :--- | :--- | :--- | :--- | :--- |
| **D0** | **Passive Baseline** | Original passive random exploration dataset | 0 episodes | 25 episodes |
| **D1** | **Random Exploration** | Adds randomly sampled simulator rollouts | +60 episodes | 85 episodes |
| **D2** | **Boundary Sampling** | Selects candidate rollouts near friction & wedging boundaries | +60 episodes | 85 episodes |
| **D3** | **Uncertainty & Disag.**| Selects candidates with high mode entropy & model variance | +60 episodes | 85 episodes |
| **D4** | **Combined ACMM** | Multi-signal score $A(\tau)$ with trajectory deduplication | +60 episodes | 85 episodes |

---

## 2. Evaluation Metrics

For each trained model under strategies D0 through D4, the following metrics are evaluated on the identical, untouched held-out test splits:

### 2.1 Contact Transition Discovery & Diversity
- Number of novel contact transitions discovered during mining ($\Sigma \in \{\text{Impact}, \text{Wedging}, \text{Slip}, \text{Lift}\}$).
- Unique contact mode sequence entropy.

### 2.2 Prediction Accuracy
- State Next-Step RMSE ($e_x = \|\hat{s}_{t+1} - s_{t+1}\|_2$).
- Contact Force RMSE ($e_F = \|\hat{F}_{t+1} - F_{t+1}\|_2$).
- Multi-Step Rollout RMSE across horizons $H \in \{1, 3, 5, 10, 20\}$.
- Contact Mode Classification Macro-F1 score across all 7 modes.

### 2.3 Conformal Calibration & Efficiency
- Marginal state coverage at $1 - \alpha = 90\%$.
- Simultaneous trajectory coverage across state, wrench, and mode.
- Mean prediction interval widths ($2 q_{\text{state}}$, $2 q_{\text{wrench}}$).

### 2.4 Downstream Manipulation Performance (Corrected Horizon: 25 Steps)
- **Task 1 (Peg-in-Hole):**
  - Task Success Rate ($\text{seated} = \text{True}$, $-z \ge 50.0$ mm).
  - Mean Insertion Progress (mm).
  - Jamming / Wedging Stall Rate.
- **Task 2 (Multifingered Lift):**
  - Task Success Rate ($\text{lifted} = \text{True}$, $z \ge 5.0$ mm).
  - Mean Lift Elevation (mm).
  - Gross Slip Rate and Drop Rate.
- **Safety & Filtering:**
  - Safety Violation Rate ($F > F_{\max}$).
  - p-CBF filter intervention frequency.

---

## 3. Execution Schedule & Step-by-Step Deliverables

1. **Step 1:** Implement `src/mining/acquisition_scorer.py` and `src/mining/episode_deduplicator.py`.
2. **Step 2:** Implement `src/mining/contact_boundary_sampler.py`.
3. **Step 3:** Implement `src/mining/trajectory_selector.py` and `src/mining/mining_evaluator.py`.
4. **Step 4:** Unit test suite in `tests/test_active_contact_mining.py` (verify deterministic scoring, normalization, weights, deduplication, and boundary sampling).
5. **Step 5:** Execute the 5-way mining experiment matrix across Task 1 and Task 2.
6. **Step 6:** Compile final empirical benchmark report in `experiments/active_contact_mining/results/p24_mining_benchmark_report.json` and generate audit documentation.
