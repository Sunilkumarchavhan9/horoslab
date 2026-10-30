# HOROS PROBE-1 Experiment Specification
## EXP-004: Continuous Action Generation & Sim-to-Real Dexterity Transfer

* **Experiment ID:** EXP-004
* **Title:** Continuous Flow Matching Policy Evaluation and Bilateral Tactile Residual Sim-to-Real Transfer
* **Research Hypotheses:**
  * **Sub-Experiment EXP-004a (Action Generation):** Continuous Optimal Transport flow matching achieves $\ge 85\%$ task success with P99 latency $< 10.0$ ms, outperforming 256-bin discrete tokenization (OpenVLA) and 16-step diffusion (Diffusion Policy).
  * **Sub-Experiment EXP-004b (Sim-to-Real Transfer / Hypothesis 5):** Augmenting a simulation-pretrained base flow policy with a lightweight real-world residual adaptation head trained on $< 2$ hours of hardware telemetry achieves $> 80\%$ success on millimeter-clearance bi-manual assembly.
* **Research Questions:**
  * EXP-004a: Does continuous flow matching eliminate discretization jitter while satisfying the 100 Hz (10 ms) real-time control budget?
  * EXP-004b: Can fine-tolerance dexterous manipulation transfer from digital simulation to real hardware with minimal real-world teleoperation hours?
* **Baseline Models:**
  * For 004a: (1) Discrete Autoregressive Head (OpenVLA style, 256 bins), (2) DDIM Diffusion Policy (16 steps).
  * For 004b: (1) Zero-Shot Simulation Policy (no real fine-tuning), (2) Purely Real-World BC Policy (trained on only 2 hours of real data).
* **Proposed Methods:**
  * EXP-004a: PROBE-1 Optimal Transport Flow Matching action head evaluated at 1, 2, and 4 Euler integration steps.
  * EXP-004b: PROBE-1 Bilateral Residual Architecture: Base weights frozen from Isaac Lab pretraining; lightweight MLP residual head fine-tuned on real tactile telemetry:
    $$\mathbf{a}_{\text{real}} = \mathbf{a}_{\text{sim\_base}} + \Delta \mathbf{a}_{\text{residual}}(\mathbf{s}_{\text{tactile}}, \mathbf{s}_{\text{torque}})$$
* **Datasets:**
  * EXP-004a: 1,000 demonstration trajectories from GR00T Teleop G1.
  * EXP-004b: 50,000 synthetic assembly episodes from Isaac Lab + 120 physical G1 teleoperation episodes (~2 hours).
* **Training Configuration:** 16x H100 GPUs (Stage 1 base) + single RTX 4090 (Stage 2 residual head training in 45 minutes).
* **Evaluation Environment:** Physical Unitree G1 dual-arm station executing standardized peg-in-hole assembly (1.0 mm and 0.5 mm tolerances).
* **Hardware Requirements:** Onboard Jetson Thor running PREEMPT_RT Linux kernel; high-speed optical tactile fingertips.
* **Independent Variables:** Action generation head type (Discrete vs. Diffusion vs. Flow) and sim-to-real transfer paradigm (Zero-shot vs. Pure Real vs. Residual).
* **Dependent Variables:** Task success rate ($R_{\text{task}}$), path jitter ($\sigma_{\text{jitter}}$), P50/P95/P99 latency (ms), assembly clearance tolerance achieved.
* **Control Variables:** Target peg dimensions, assembly fixture position, robot arm kinematic calibration.
* **Metrics:** Task success rate (%), assembly completion time (s), P99 latency (ms), peak contact force (N).
* **Sample-Size Justification:** $N = 100$ physical trials per condition (total $N = 600$ physical insertion trials).
* **Statistical Analysis:** Pairwise Fisher's exact test for success rate; Kolmogorov-Smirnov test for latency distributions.
* **Ablation Studies:**
  * Vary Flow Matching integration steps ($N \in \{1, 2, 4, 8\}$).
  * Vary real-world fine-tuning duration ($0.5\text{ hr}, 1.0\text{ hr}, 2.0\text{ hr}, 5.0\text{ hr}$).
  * Remove tactile inputs from the residual head.
* **Failure Conditions:** P99 latency exceeds $10.0$ ms (dropping below 100 Hz control), or peg jammed/broken due to force spikes $> 30\text{ N}$.
* **Expected Outcomes:**
  * EXP-004a: Flow matching achieves $88.5\%$ success at P99 latency $= 7.8$ ms (vs. $215$ ms for OpenVLA and $62$ ms for Diffusion).
  * EXP-004b: Bilateral residual adaptation reaches $83.0\%$ success on 0.5 mm clearance pegs with only 2 hours of real data (vs. $22\%$ for zero-shot sim).
* **Decision Criteria:** Supported if Flow Matching achieves $\ge 85\%$ success with P99 latency $< 10.0$ ms, and residual adaptation achieves $> 80\%$ success ($p < 0.01$).
