# HOROS PROBE-1 Experiment Specification
## EXP-008: Predictive Safety & Control Barrier Supervision

* **Experiment ID:** EXP-008
* **Title:** Predictive Control Barrier Function (p-CBF) Supervision for Humanoid Collision and Fall Prevention
* **Research Hypothesis:** Hypothesis 6 — Integrating forward physical world-model rollouts into a real-time safety filter based on predictive Control Barrier Functions (p-CBF) reduces critical safety violations (falls, self-collisions, excessive contact forces, and human workspace incursions) by $\ge 60\%$ during out-of-distribution physical interactions compared to reactive safety governors, while introducing $\le 1.0\text{ ms}$ of deterministic QP overhead.
* **Research Question:** Can an action-conditioned physical world model anticipate and veto unsafe action trajectories before dynamic momentum renders recovery physically impossible, without introducing non-deterministic latency or false-positive task freezes?
* **Baseline Models:**
  1. *Reactive Threshold Filter:* Conventional emergency stop governor triggering only when measured torques or IMU tilts exceed static safety thresholds ($|\tau| > 0.95 \tau_{\text{max}}$ or $|\theta| > 30^\circ$).
  2. *Static Control Barrier Function (CBF):* First-order kinematics-only barrier filter running on instantaneous joint limits and distance-to-obstacles.
  3. *Unsupervised Foundation Policy:* PROBE-1 policy running open-loop without an independent safety filter.
* **Proposed Method:** PROBE-1 Predictive Safety Supervisor:
  * Neural world model generates calibrated forward reachability tubes ($\hat{s}_{t+k} \pm 2\sigma_k$) over a $15$-step horizon ($150\text{ ms}$).
  * High-order discrete-time Control Barrier Function (CBF) formulation enforcing:
    $$h(s_{t+k}) = \begin{bmatrix} d_{\text{obs}}(s) - d_{\text{min}} \\ \tau_{\text{max}} - |\tau_{\text{cmd}}| \\ \theta_{\text{torso\_max}} - |\theta| \end{bmatrix} \ge 0$$
  * Solved via real-time active-set Quadratic Program (ProxSuite / OSQP) with a hard **1.0 ms deterministic hardware timeout**. If the QP fails or times out, a deterministic joint impedance deceleration maneuver is engaged.
* **Datasets:**
  * Training: 10,000 simulated near-fall recovery trajectories and obstacle collision scenarios from Isaac Sim.
  * Validation: Calibrated dataset of 500 edge-case disturbance interactions annotated with true safety boundary violations for temperature-scaled Expected Calibration Error (ECE) minimization.
* **Training Configuration:**
  * World-model safety head trained with focal loss on boundary transgression events.
  * Calibration: Temperature scaling optimized on validation set to achieve $\text{ECE} < 0.03$.
* **Evaluation Environment:**
  * Phase 1 (Digital Verification): 10,000 randomized simulation runs in Isaac Sim 4.2 with unexpected obstacle intrusions and floor slippery patches.
  * Phase 2 (Gantry-Tethered Hardware): Physical Unitree G1 humanoid suspended from an overhead zero-friction safety gantry with a slack safety tether.
  * Phase 3 (Untethered Hardware): Authorized strictly after Phase 2 achieves 20 consecutive disturbance runs with zero tether engagements.
* **Hardware Requirements:** Dual Intel RealSense depth sensors, high-frequency IMU (500 Hz), real-time industrial PC running PREEMPT_RT Linux and ProxSuite QP solver.
* **Independent Variables:** Safety supervision mechanism: (1) Unsupervised, (2) Reactive Threshold, (3) Static Kinematic CBF, (4) Calibrated Predictive CBF (p-CBF).
* **Dependent Variables:** Critical safety violation rate (%), false-positive task abort rate (%), intervention latency (time before boundary collision), QP solve time (ms).
* **Control Variables:** Robot payload mass ($2.0\text{ kg}$), walking velocity ($0.8\text{ m/s}$), obstacle intrusion speed ($1.0\text{ m/s}$).
* **Metrics:** Safety violation reduction rate ($R_{\text{viol}}$), False Intervention Rate ($P_{\text{false}}$), P99.9 solver execution latency ($t_{\text{QP}}$), minimum distance to safety envelope.
* **Sample-Size Justification:** $N = 100$ dynamic obstacle and unexpected slip trials per condition ($400$ total physical trials) provides $> 95\%$ power to detect a $30\%$ drop in violation rates at $\alpha = 0.01$.
* **Statistical Analysis:** Chi-square test of independence on binary collision/fall outcomes; log-rank survival analysis on time-to-violation; Wilcoxon signed-rank test on latency overhead.
* **Ablation Studies:**
  * Disable temperature calibration on world-model forward rollouts.
  * Vary lookahead horizon ($H \in \{5, 10, 15, 25\}$ steps).
  * Enforce artificial QP solver timeouts to verify the deterministic safe impedance fallback mechanism.
* **Failure Conditions:** Hardware collision occurs with normal force $> 50\text{ N}$, robot falls without safety trigger, or QP solve time exceeds $1.0\text{ ms}$ without engaging safe deceleration.
* **Reproducibility Requirements:** Deterministic seed suite for obstacle trajectories, open-source C++ implementation of ProxSuite p-CBF filter, and logged sensor telemetry at 1 kHz.
* **Expected Outcome:** Predictive CBF anticipates dynamic tipping and collision $80\text{ ms}$ earlier than reactive filters, reducing critical hardware violations from $28\%$ to $< 4\%$ with P99 solve time of $0.65\text{ ms}$.
* **Decision Criteria:** Hypothesis 6 is supported if the predictive CBF supervisor reduces physical safety violations by $\ge 60\%$ relative to reactive baselines ($p < 0.001$) while maintaining false intervention rates $< 5\%$ and strict real-time determinism ($t_{\text{QP}} \le 1.0\text{ ms}$).

