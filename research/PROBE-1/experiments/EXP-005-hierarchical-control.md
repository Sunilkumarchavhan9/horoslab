# HOROS PROBE-1 Experiment Specification
## EXP-005: Hierarchical Control Decoupling and Frequency Sweep

* **Experiment ID:** EXP-005
* **Title:** Latency and Frequency Decoupling in Hierarchical Robot Foundation Architectures
* **Research Hypothesis:** Decoupling high-level multimodal semantic/physical planning ($1\text{--}10\text{ Hz}$) from low-level proprioceptive motor execution ($50\text{--}200\text{ Hz}$) via intermediate kinematic screw displacements and dynamic impedance targets yields higher disturbance recovery success ($\ge 85\%$) than monolithic end-to-end foundation policies operating at uniform rates ($\le 20\text{ Hz}$).
* **Research Question:** What is the optimal frequency split between high-level visual-physical foundation reasoning and low-level reactive motor control, and can a hierarchical interface maintain stable closed-loop humanoid balance during external impacts?
* **Baseline Models:**
  1. *Monolithic Low-Frequency Baseline:* OpenVLA-style direct action prediction running end-to-end at $10\text{ Hz}$ or $20\text{ Hz}$.
  2. *Chunked Monolithic Policy:* Action Chunking Transformer (ACT) predicting 50-step action chunks at $10\text{ Hz}$ open-loop interpolated to $200\text{ Hz}$.
  3. *Unconstrained End-to-End Flow:* Candidate D operating with receding horizon flow-matching at $30\text{ Hz}$ without explicit low-level hierarchy.
* **Proposed Method:** PROBE-1 Hierarchical Architecture (Candidate A / Candidate E control spine):
  * *High-Level Planner (Tier 2/3):* Multimodal transformer outputting desired 6-DoF end-effector spatial twists, footstep touchdown targets, and centroidal momentum rates at $5\text{ Hz}$.
  * *Low-Level Controller (Tier 4):* Lightweight proprioceptive MLP / QP-based whole-body controller running at $100\text{ Hz}$ to $200\text{ Hz}$, tracking high-level reference trajectories while providing instantaneous torque-level stiffness adaptation.
* **Datasets:**
  * In-distribution: DROID whole-body manipulation trajectories + Humanoid Everyday walking logs.
  * Simulation Dataset: 50,000 randomized dynamic impact trajectories collected in Isaac Sim across varying floor restitution and friction coefficients.
* **Training Configuration:**
  * High-level policy: Pretrained VLA fine-tuned with behavior cloning on 10 Hz downsampled trajectories with Huber loss on spatial screw displacements.
  * Low-level controller: Trained via massively parallel Model Predictive Path Integral (MPPI) or RL in Isaac Sim on $200\text{ Hz}$ state transitions with domain randomization.
* **Evaluation Environment:**
  * Stage 1: Isaac Sim humanoid whole-body manipulation under randomized impulse forces ($10\text{--}50\text{ N}$ applied to torso).
  * Stage 2: Physical Unitree G1 humanoid standing on a variable-compliance foam pad and subjected to pendulum mass impacts ($2.5\text{ kg}$ impactor at $1.5\text{ m/s}$).
* **Hardware Requirements:** Host workstation with NVIDIA RTX 4090 / Jetson AGX Orin connected via real-time EtherCAT bus operating deterministically at $200\text{ Hz}$ jitter $< 50\ \mu\text{s}$.
* **Independent Variables:**
  1. High-level planning frequency: $1\text{ Hz}, 3\text{ Hz}, 5\text{ Hz}, 10\text{ Hz}$.
  2. Low-level control frequency: $50\text{ Hz}, 100\text{ Hz}, 200\text{ Hz}$.
  3. Control interface representation: direct joint position commands vs. Cartesian impedance targets vs. spatial screw twists.
* **Dependent Variables:** Disturbance rejection recovery rate (%), peak center-of-mass excursion (cm), settling time following perturbation (ms), actuator torque saturation rate.
* **Control Variables:** Impact momentum ($3.75\text{ N}\cdot\text{s}$), surface friction coefficient ($\mu = 0.65$), initial standing posture.
* **Metrics:** Recovery success rate, P99 end-to-end latency, jitter, Root Mean Square Tracking Error (RMSTE) of torso orientation.
* **Sample-Size Justification:** $N = 120$ perturbation trials per frequency combination ($12 \times 120 = 1,440$ total runs) ensures $90\%$ statistical power to distinguish a $10\%$ difference in recovery rate at $\alpha = 0.05$.
* **Statistical Analysis:** Multi-factorial ANOVA examining main effects of high-level frequency, low-level frequency, and their interaction on recovery rate; post-hoc Tukey HSD for pairwise comparisons.
* **Ablation Studies:**
  * Replace Cartesian screw targets with raw joint angles at the high-low interface.
  * Test system robustness during intentional packet dropouts ($10\%\text{--}30\%$ dropped high-level packets).
  * Vary network latency jitter between high-level GPU planner and low-level microcontroller ($0\text{ to }40\text{ ms}$).
* **Failure Conditions:** Robot torso pitch exceeds $45^\circ$ (fall), joint velocity limits violated, or low-level controller fails to meet its $5.0\text{ ms}$ ($200\text{ Hz}$) execution deadline.
* **Reproducibility Requirements:** Pinned simulation config files with exact Isaac Sim 4.2 physics stepping parameters ($dt = 0.005\text{ s}$), real-time Linux kernel (PREEMPT_RT), and open-source EtherCAT master logging.
* **Expected Outcome:** The $5\text{ Hz}$ high-level + $200\text{ Hz}$ low-level Cartesian impedance hierarchy achieves $> 90\%$ recovery rate, whereas monolithic $10\text{ Hz}$ policies fall in over $60\%$ of impact trials due to phase lag.
* **Decision Criteria:** Architecture Candidate A/E hierarchical design is validated if the decoupled $5\text{ Hz} / 200\text{ Hz}$ controller demonstrates statistically superior disturbance recovery ($p < 0.01$) compared to monolithic baselines without degrading steady-state task completion accuracy.

