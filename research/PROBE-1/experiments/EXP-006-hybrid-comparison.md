# HOROS PROBE-1 Experiment Specification
## EXP-006: Decisive Comparison: Hybrid World-Model vs. Continuous Flow Policy

* **Experiment ID:** EXP-006
* **Title:** Direct Empirical Comparison of Hybrid World-Model + VLA (Candidate E) versus Continuous-Action Flow Policy (Candidate D)
* **Research Hypothesis:** Augmenting a multimodal continuous action policy with an explicit predictive physical world model (Candidate E) produces a statistically significant improvement in task success ($\ge 12\%$ absolute gain) on contact-rich, multi-stage humanoid manipulation tasks compared to a state-of-the-art flow-matching policy without explicit forward simulation (Candidate D), while remaining within acceptable onboard latency limits ($\le 30\text{ ms}$).
* **Research Question:** Does explicit forward physical rollout during inference provide measurable performance advantages over pure continuous action generation in contact-critical and dynamic humanoid tasks, justifying its higher model complexity and computational footprint?
* **Baseline Models:**
  1. *Candidate D (Continuous Flow Policy):* $\pi_0$-style 3.5B parameter flow-matching action policy operating directly on multimodal tokens without explicit future-state prediction heads.
  2. *Candidate A (Hierarchical VLA Baseline):* Dual-system semantic planner (5 Hz) driving an inverse dynamics controller (100 Hz).
  3. *Candidate B (World Model + Pure MPC Baseline):* High-capacity forward dynamics model with cross-entropy method (CEM) action planning without a policy prior.
* **Proposed Method:** Candidate E (PROBE-1 Hybrid Architecture):
  * Semantic/Physical Tokenizer + Action-Conditioned World Model generating 50-step signed distance fields and contact forces + Continuous Flow Action Expert guided by world-model value/rollout gradients + Low-Level Whole-Body Controller running at 200 Hz.
* **Datasets:**
  * Training: 1,000 hours of synchronized multimodal demonstrations (DROID, Humanoid Everyday, PhysicalAI-Robotics-GR00T-Teleop-G1, and synthetic Isaac Sim contact trajectories).
  * Evaluation Tasks: 5 representative contact-rich humanoid tracks:
    1. Peg-in-hole precision insertion ($1\text{ mm}$ clearance).
    2. Compliant door opening with spring latch.
    3. Dual-arm heavy object handover ($5\text{ kg}$ payload with shifting liquid center of mass).
    4. Table clearing with fragile glassware handling under varying surface friction.
    5. Push-recovery while manipulating an object on an uneven floor.
* **Training Configuration:**
  * Candidate D: 64x NVIDIA H100 GPUs, 500,000 steps, batch size 512, AdamW, flow-matching conditional vector field loss.
  * Candidate E: 64x NVIDIA H100 GPUs, 500,000 steps, multi-task joint loss: $\mathcal{L}_{\text{total}} = \mathcal{L}_{\text{flow}} + 0.4 \mathcal{L}_{\text{world\_sdf}} + 0.3 \mathcal{L}_{\text{contact}} + 0.1 \mathcal{L}_{\text{balance}}$.
  * Compute parity: Both candidate architectures trained with identical total FLOPs ($1.2 \times 10^{22}$ FLOPs).
* **Evaluation Environment:**
  * Dual-setup: (1) High-fidelity Isaac Sim 4.2 physics benchmark across 5,000 randomized seeds; (2) Physical twin evaluation cell with Unitree G1 humanoid and calibrated test fixtures.
* **Hardware Requirements:** Physical Unitree G1 humanoid equipped with bilateral DexH10 hands, tactile sensor fingertips, dual Intel RealSense D435i cameras, and an onboard/workstation-tethered dual RTX 4090 / NVIDIA Jetson Thor inference engine.
* **Independent Variables:** Core architecture class: Candidate D (Pure Flow Policy) vs. Candidate E (Hybrid World-Model + VLA).
* **Dependent Variables:** Task success rate (binary), execution time (s), contact forces / peak impact torque ($\text{N}\cdot\text{m}$), slippage occurrence rate, intervention / fall rate, inference latency (ms).
* **Control Variables:** Initial scene layout, object mass, ambient lighting, surface friction, target goal specifications.
* **Metrics:** Primary: Task Success Rate ($P_{\text{success}}$); Secondary: Mechanical Energy Consumption ($E_{\text{mech}}$), Normalized Future Prediction Error ($\text{NFPE}$), End-to-End P95 Latency.
* **Sample-Size Justification:**
  * Based on a priori power calculation for McNemar's paired test comparing paired Bernoulli trials:
  * With baseline Candidate D success probability $P_D = 0.70$, hypothesized Candidate E success probability $P_E = 0.82$ (target effect size $\delta = 0.12$), two-sided significance level $\alpha = 0.01$, and statistical power $1 - \beta = 0.90$:
  * Required sample size is $N = 260$ paired physical trials per task category.
  * Over 5 distinct evaluation tracks, the complete physical protocol requires $N = 1,300$ paired trials ($2,600$ total physical execution runs).
* **Statistical Analysis:**
  * Paired McNemar's test evaluated per task track.
  * Benjamini-Hochberg (BH) False Discovery Rate (FDR) adjustment across the 5 benchmark tasks ($q^* = 0.01$).
  * Wilcoxon signed-rank test for continuous completion time and peak impact forces.
* **Ablation Studies:**
  * Remove world-model rollout guidance during inference (test Candidate E in open-loop flow mode).
  * Vary world-model rollout horizon ($H \in \{10, 25, 50\}$ steps).
  * Vary test-time compute budget (number of CEM refinement iterations: $0, 3, 5, 10$).
* **Failure Conditions:** Candidate E P95 latency exceeds $30\text{ ms}$, or Candidate E demonstrates higher intervention/damage rate than Candidate D due to hallucinated model transitions.
* **Reproducibility Requirements:** Exact frozen model weights, identical random seeds for physical object placement, automated robotic reset apparatus for repeatable physical trials, and video recordings with optical tracking logs for every trial.
* **Expected Outcome:** Candidate E achieves $\ge 82\%$ aggregate task success compared to $70\%$ for Candidate D on contact-rich manipulation, demonstrating reduced slip events and smoother contact transitions, at an inference latency of $24\text{ ms}$.
* **Decision Criteria (Scientific Protocol):**
  * **Candidate E is selected as PROBE-1 architecture IF:**
    1. Candidate E shows statistically significant superior success rate ($p < 0.01$ FDR-adjusted) on at least 4 out of 5 task categories.
    2. Candidate E experiences $\ge 30\%$ fewer catastrophic slip/drop events.
    3. P95 end-to-end inference latency remains $\le 30.0\text{ ms}$.
  * **Otherwise (Fallback):** If Candidate E fails these criteria, the PROBE-1 architecture defaults to Candidate D (Continuous Flow Policy) or Candidate A (Hierarchical VLA), and world modeling is relegated to offline data synthesis rather than runtime policy inference.

