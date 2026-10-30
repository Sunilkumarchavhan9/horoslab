# HOROS First-Party Model Program: PROBE-1
## 06 — Critical Research Gaps, Unsolved Physical Problems & Scientific Hypotheses

### Executive Summary & Scientific Purpose
The goal of this document is to define the **exact scientific and engineering contributions** that PROBE-1 will pursue. Rather than duplicating existing models (e.g., re-implementing another discrete VLA or re-running standard imitation learning), PROBE-1 focuses its compute, dataset acquisition, and physical experiments on unaddressed technical bottlenecks where existing state-of-the-art approaches demonstrably fail.

This audit evaluates **seven candidate research gaps**:
1. **Unified Physical Representation** (Cross-sensory embedding of vision, depth, proprioception, force, and tactile signals)
2. **Contact-Aware Anticipatory Prediction** (Predicting contact transitions, friction margins, and incipient slip before occurrence)
3. **Action-Conditioned Physical Dynamics** (Counterfactual multi-step rollout accuracy under high-DoF action chunks)
4. **Cross-Embodiment Kinematic & Dynamic Transfer** (Zero-shot and few-shot knowledge transfer between heterogeneous bipedal humanoids)
5. **Simulation-to-Real Physical Fidelity Transfer** (Bridging soft-contact, motor hysteresis, and high-frequency tactile reality gaps)
6. **Predictive Safety Supervision** (Anticipatory Control Barrier Functions grounded in learned forward physical prediction)
7. **Continual Physical Learning & Mistake Immunity** (Learning from physical deployment failures without catastrophic forgetting of previous motor skills)

> **Methodological Standard:**
> Every candidate gap is treated as an **unproven hypothesis**, critically scrutinized against published literature, cross-referenced with our verified dataset inventory (`03-dataset-audit.md`), and bounded by realistic hardware constraints.

---

### Critical Research Gap Audit Matrix

| Candidate Research Gap | Literature Baseline | SOTA Capability | Unsolved Problem / Failure Mode | Feasibility in PROBE-1 | Empirical Test |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Unified Physical Representation** | RT-2, OpenVLA, Octo | Maps RGB + text to kinematic actions | Tactile, force, and high-rate proprioception treated as afterthought or omitted | High (Permissive datasets + HOROS sensor rigs) | EXP-001 (Multi-sensory ablation) |
| **2. Contact-Aware Prediction** | GelSight (Yuan), ContactNets | Reactive slip detection (after slip occurs) | Anticipatory contact prediction (preventing slip before onset) | High (Tactile testbed + load cells) | EXP-002 (Anticipatory slip lead-time) |
| **3. Action-Conditioned Dynamics** | UniSim, DreamerV3, HWM | Video dreaming / low-DoF rollouts | Compounding error & non-physical interpenetration in 32-DoF humanoid rollouts | Moderate (Isaac Sim + G1 data) | EXP-003 (Multi-step rollout error) |
| **4. Cross-Embodiment Learning** | OXE, Octo, X-Robot | Arm-level kinematic retargeting | Humanoid whole-body dynamic transfer across distinct masses, link lengths & actuators | Moderate (Requires H1 $\leftrightarrow$ G1 paired runs) | EXP-005 (Cross-humanoid fine-tuning) |
| **5. Sim-to-Real Physical Transfer** | Humanoid-Gym, Cassie | Blind bipedal walking transfer | High-frequency contact-rich bi-manual dexterous manipulation sim-to-real transfer | High (MimicGen + G1 teleop) | EXP-004 (Real-world G1 execution) |
| **6. Predictive Safety Supervision** | Classical CBFs, Shield RL | Reactive torque clamps & velocity limits | Predictive barrier filters looking ahead in time to intercept unstable momentum | High (HOROS Safety Runtime) | Track 6 Safety Evaluation |
| **7. Continual Physical Learning** | EWC, LoRA fine-tuning | Catastrophic forgetting in multi-task RL | Autonomous physical failure logging into mistake-immune memory without forgetting | High (HOROS Experience Engine) | Long-horizon deployment suite |

---

## 1. Deep Investigation of Candidate Research Gaps

### Research Gap 1: Unified Multimodal Physical Representation
*Can vision, depth, proprioception, 6-axis force-torque, and high-density tactile signals share a coherent, physically grounded latent representation?*

#### 1. Research Gap Description
Contemporary multimodal foundation models treat robotics as an extension of vision-language processing: camera images are projected through a visual transformer (ViT), concatenated with text tokens, and mapped to actions. However, physical interaction is governed by mechanics that vision cannot observe: joint torque compliance, high-frequency contact vibrations, tactile normal/shear distributions, and internal inertial momentum. Currently, no foundation model embeds these diverse physical signals into a shared geometric-physical latent space.

#### 2. Relevant Existing Papers
* *RT-2* (Brohan et al., CoRL 2023) — Ignores proprioception and tactile data; purely vision-language.
* *OpenVLA* (Kim et al., 2024) — No force, torque, or tactile inputs.
* *Octo* (Octo Model Team, RSS 2024) — Incorporates basic low-dimensional proprioceptive vectors via linear projection, but lacks force or tactile arrays.
* *ViTac* (Kerr et al., 2023) — Fuses visual and optical tactile sensors for tabletop picking, but restricted to specialized single-arm tasks without whole-body proprioception.

#### 3. What Existing Approaches Already Achieve
Existing models successfully align 2D visual semantics with natural language goals, enabling robots to recognize "red apple" or "screwdriver" and execute approximate reaching motions.

#### 4. What Remains Unsolved & Why Existing Methods Fail
* **The Contact Occlusion Blindspot:** At the exact moment of grasp engagement, the robot's fingers, palm, and tool completely occlude the visual camera line-of-sight. Without tactile and force feedback, models are blind during the most critical phase of manipulation.
* **Dimensional & Frequency Heterogeneity:** Visual streams arrive at 30 Hz ($10^6$ pixels), joint encoders at 100 Hz ($10^1$ floats), force-torque sensors at 500 Hz ($10^1$ floats), and tactile arrays at 60 Hz ($10^3$ taxels). Simply concatenating these vectors into an LLM context window causes severe temporal misalignment and overwhelms attention maps.

#### 5. Proposed PROBE-1 Hypothesis
> **Hypothesis 1 (Physical Tokenization):** Transforming multi-rate sensory streams into continuous spatial-temporal tokens—where tactile data is represented as surface contact displacement fields and proprioception as kinematic joint twists—will reduce state-estimation error by $\ge 35\%$ during visual occlusion compared to vision-only baselines.

#### 6. Experimental Validation & Required Resources
* **Validation:** Execute **EXP-001** (Multimodal Physical State Estimation) under simulated and physical camera occlusions (blocking head/wrist cameras during active manipulation).
* **Datasets & Resources:** DROID (visual base) + GR00T Teleop G1 (humanoid proprioception) + HOROS tactile test rig (GelSight optical tactile). 8x H100 GPU cluster.

#### 7. Expected Contribution & Risks
* **Contribution:** First open multimodal physical tokenizer bridging high-density tactile arrays, 6-axis force-torque, and multi-view vision into a single foundation transformer.
* **Risks & Alternatives:** Modality collapse (model ignores tactile tokens when vision is available). *Mitigation:* Apply sensory dropout (randomly masking visual cameras during 30% of training steps).

---

### Research Gap 2: Contact-Aware Anticipatory Prediction
*Can an embodied model predict contact transitions, friction cone boundaries, and incipient slip before they physically occur?*

#### 1. Research Gap Description
Current robotic manipulation policies are purely reactive to slip: when an object slips, the sensor detects shear movement after the contact patch has already shifted, often leading to dropped objects before the motor controller can clamp down. Anticipatory contact modeling requires predicting the contact normal force vector $\hat{\mathbf{n}}_c$ and friction cone margin $\Delta \mu = \mu F_N - \|F_T\|$ 20–50 ms into the future, enabling the policy to modulate grip force proactively.

#### 2. Relevant Existing Papers
* *Touch-First Manipulation with GelSight* (Yuan et al., Sensors 2017) — Reactive slip detection based on marker displacement.
* *ContactNets* (Pfrommer et al., CoRL 2020) — Accurately estimates contact impulses in rigid bodies, but operates offline on known CAD geometries without visual generalization.
* *TacSL* (Suresh et al., ICRA 2023) — Slip detection using learned tactile representations, but evaluated only on static parallel-jaw grippers.

#### 3. What Existing Approaches Already Achieve
Robots can detect gross slip after an object has displaced $>2$ mm in the gripper and apply emergency gripping force.

#### 4. What Remains Unsolved & Why Existing Methods Fail
* Existing methods cannot predict **impending slip** during dynamic humanoid motions (e.g., when the humanoid accelerates its torso while holding a glass of water). The inertial force $\mathbf{F}_{\text{inertial}} = m(\mathbf{a}_{\text{base}} + \mathbf{g})$ shifts the contact shear vector faster than reactive controllers can adjust.
* Models lack an explicit formulation for friction cone margin prediction inside the action generation loop.

#### 5. Proposed PROBE-1 Hypothesis
> **Hypothesis 2 (Anticipatory Friction Margin):** Explicitly supervising a contact prediction head with predicted friction-cone margin $\Delta \mu_{t+H}$ will increase grasp stability on low-friction, delicate, and deformable objects by $\ge 40\%$ compared to standard imitation learning policies.

#### 6. Experimental Validation & Required Resources
* **Validation:** Execute **EXP-002** (Contact Prediction & Slip Prevention) across 20 challenge objects with varying friction coefficients ($\mu \in [0.1, 0.9]$).
* **Datasets & Resources:** HOROS physical tactile testbed equipped with calibrated 6-axis load cells + Unitree G1 dexterous hand.

#### 7. Expected Contribution & Risks
* **Contribution:** Formulation of an anticipatory friction-cone loss function integrated directly into flow matching vector field policies.
* **Risks & Alternatives:** Load cell ground truth is difficult to measure during unconstrained multi-fingered manipulation. *Mitigation:* Leverage high-fidelity Isaac Sim contact sensor arrays for dense supervision, followed by sim-to-real fine-tuning.

---

### Research Gap 3: Action-Conditioned Dynamics & Compounding Rollout Errors
*Can future physical states and contact manifolds be predicted accurately under high-DoF action chunks without catastrophic autoregressive drift?*

#### 1. Research Gap Description
Action-conditioned world models (e.g., DreamerV3, UniSim) predict future latent or pixel states given candidate actions. In high-DoF humanoid physical systems (32 DoF), small prediction errors in joint angles or contact point locations compound exponentially over multi-step horizons, causing imagined rollouts to hallucinate physical impossibilities: feet floating above the ground, arms passing through solid tabletops, or friction-free infinite sliding.

#### 2. Relevant Existing Papers
* *UniSim* (Yang et al., ICML 2023) — Visual diffusion world model; suffers from high latency ($>1.2$ s per step) and object penetration over horizons $>15$ steps.
* *DreamerV3* (Hafner et al., Nature MI 2023) — Categorical RSSM; effective for video games, but lacks explicit physical contact and signed distance field constraints.
* *Humanoid World Models* (Gu et al., arXiv:2506.01182, 2025) — Action-conditioned dynamics for humanoid locomotion, but restricted to low-level proprioceptive states without visual reasoning.

#### 3. What Existing Approaches Already Achieve
World models successfully simulate low-dimensional game environments and short-horizon visual scenes without physical contact.

#### 4. What Remains Unsolved & Why Existing Methods Fail
* **The Non-Penetration Complementarity Challenge:** Contact is mathematically discontinuous. Neural networks naturally smooth out sharp transitions, leading to inter-penetration during predicted contact events.
* **Horizons vs. Latency:** Diffusion-based video rollouts take seconds to compute, rendering them completely useless for closed-loop real-time motor control.

#### 5. Proposed PROBE-1 Hypothesis
> **Hypothesis 3 (Constrained Latent Dynamics):** Conditioning the latent world model on explicit Signed Distance Field (SDF) geometry and penalizing negative contact normal forces will maintain rollout physical plausibility over a 50-step horizon ($1.0$ second) with $< 15\%$ drift error.

#### 6. Experimental Validation & Required Resources
* **Validation:** Execute **EXP-003** (Future-State Prediction Accuracy) measuring Future Prediction Error ($\text{FPE}$) and non-penetration violations across 20,000 trajectories.
* **Datasets & Resources:** Humanoid Everyday + Isaac Sim G1/H1 synthetic suites.

#### 7. Expected Contribution & Risks
* **Contribution:** A continuous-time latent physical world model constrained by geometric non-penetration invariants running at inference speeds compatible with online replanning.
* **Risks:** Enforcing rigid mathematical constraints on latent neural embeddings may cause gradient instability. *Mitigation:* Formulate constraints as soft penalty barriers with adaptive Lagrange multipliers.

---

### Research Gap 4: Cross-Embodiment Kinematic & Dynamic Transfer
*Can physical manipulation and locomotion skills transfer zero-shot or few-shot between fundamentally different humanoid robot morphologies?*

#### 1. Research Gap Description
Open X-Embodiment demonstrated cross-embodiment transfer for robotic arms (e.g., Franka Panda to UR5), where kinematics are largely similar (6-DoF or 7-DoF serial manipulators mounted to fixed tables). Humanoid robots, however, differ wildly in total height, link mass distribution, actuator gear ratios, joint velocity limits, and center-of-mass dynamics (e.g., Unitree H1 vs. Unitree G1 vs. Fourier GR-1 vs. Boston Dynamics Atlas). No existing foundation model achieves robust zero-shot cross-humanoid transfer.

#### 2. Relevant Existing Papers
* *Open X-Embodiment* (OXE Collaboration, 2023) — Cross-arm transfer; does not address bipedal humanoids or dynamic balance.
* *Octo* (Octo Model Team, RSS 2024) — Modular tokenizers accommodate different input/output dimensions, but policy weights fail when transferred to systems with significantly different inertia matrices.
* *X-Robot* (He et al., 2024) — Cross-embodiment learning across mobile manipulators, but balance dynamics are absent.

#### 3. What Existing Approaches Already Achieve
Policies can adapt to new robotic arms with identical end-effector Cartesian action spaces using ~50–100 teleoperated demonstrations.

#### 4. What Remains Unsolved & Why Existing Methods Fail
* **Inertial & Dynamic Incompatibility:** Cartesian end-effector velocities do not capture whole-body momentum. Commanding an identical hand trajectory on a 35 kg humanoid (G1) versus a 75 kg humanoid (H1) generates completely different torso reaction torques. A policy ignoring embodiment inertia causes the robot to tip over.

#### 5. Proposed PROBE-1 Hypothesis
> **Hypothesis 4 (Normalized Momentum Action Space):** Parameterizing humanoid whole-body actions as normalized centroidal momentum deltas $[\Delta \mathbf{h}_{\text{lin}}, \Delta \mathbf{h}_{\text{ang}}]$ paired with embodiment-specific URDF joint embeddings will enable zero-shot transfer between Unitree H1 and G1 with $\ge 65\%$ task success without retraining base weights.

#### 6. Experimental Validation & Required Resources
* **Validation:** Train base model on H1 whole-body demonstration data; evaluate zero-shot on physical Unitree G1 hardware in simulation and physical test cells.
* **Datasets & Resources:** Humanoid Everyday (contains paired H1 and G1 runs) + Isaac Lab multi-humanoid simulation environments.

#### 7. Expected Contribution & Risks
* **Contribution:** First foundation embodiment-invariant whole-body action representation for humanoid physical intelligence.
* **Risks:** Low-level motor controllers on different robots have proprietary firmware differences that distort commanded torques. *Mitigation:* Interface through calibrated joint impedance targets rather than direct raw torques.

---

### Research Gap 5: Simulation-to-Real High-Fidelity Contact Transfer
*How can complex physical manipulation skills learned in digital simulation transfer to physical hardware without thousands of fragile real-world teleoperation hours?*

#### 1. Research Gap Description
Sim-to-real transfer has succeeded for blind quadruped and bipedal locomotion (Cassie, ANYmal) where contact is periodic and ground-normal forces dominate. In contrast, sim-to-real transfer for **fine dexterous bi-manual manipulation** remains an open failure mode: rigid-body physics engines cannot simulate soft finger-pad compliance, micro-slip stick-slip transitions, gear backlash, and cable flexure with sufficient numerical fidelity.

#### 2. Relevant Existing Papers
* *Humanoid-Gym* (Gu et al., 2024) — Locomotion sim-to-real via actuator neural network modeling; manipulation is unaddressed.
* *MimicGen* (Mandlekar et al., 2023) — Automated trajectory synthesis in simulation; visual and dynamic sim-to-real gap remains significant.
* *Dextreme* (Handa et al., 2023) — Dexterous in-hand manipulation sim-to-real via massive domain randomization, requiring months of hyperparameter tuning on specialized clusters.

#### 3. What Existing Approaches Already Achieve
Robust bipedal walking across rough terrain trained purely in Isaac Sim transfers zero-shot to physical hardware.

#### 4. What Remains Unsolved & Why Existing Methods Fail
* Standard domain randomization (randomizing friction $\mu$ uniformly between $0.2$ and $1.0$) produces overly conservative, stiff policies that fail to grasp delicate objects or drop objects under minor vibrations.
* Tactile sensor simulations (e.g., simulated GelSight) fail to replicate optical elastomeric tearing, camera sensor noise, and shear hysteresis.

#### 5. Proposed PROBE-1 Hypothesis
> **Hypothesis 5 (Bilateral Tactile Residual Adaptation):** Combining a simulation-pretrained base flow policy with a lightweight real-world residual adaptation head trained on $< 2$ hours of physical tactile telemetry will bridge the sim-to-real dexterity gap, achieving $> 80\%$ success on millimeter-clearance assembly.

#### 6. Experimental Validation & Required Resources
* **Validation:** Execute **EXP-004** comparing zero-shot sim policy, purely real-world policy, and sim-pretrained + real-residual policy on Unitree G1 dual-arm peg-in-hole assembly.
* **Datasets & Resources:** Isaac Lab synthetic suite + 100 physical G1 teleoperation demonstrations.

#### 7. Expected Contribution & Risks
* **Contribution:** A sample-efficient sim-to-real transfer pipeline specifically tailored for multi-fingered dexterous tactile manipulation.
* **Risks:** Real-world residual policy could overfit to specific ambient laboratory temperatures affecting gel elastomeric stiffness.

---

### Research Gap 6: Predictive Safety & Anticipatory Control Barrier Functions
*Can forward physical state prediction actively supervise and constrain low-level motor commands to provably prevent hardware damage before it happens?*

#### 1. Research Gap Description
Modern robot foundation models (OpenVLA, π0, RT-2) operate without formal safety guarantees. If a visual out-of-distribution artifact occurs, the policy can command maximum joint velocity into a tabletop or the robot's own torso. Classical safety filters (e.g., reactive torque saturation or joint limit stops) act only **after** the velocity or torque has already exceeded safe thresholds, causing harsh jerky stops that can destabilize bipedal balance.

#### 2. Relevant Existing Papers
* *Control Barrier Functions in Robot Safety* (Ames et al., IEEE TAC 2017) — Classical control-theoretic safety bounds for known kinematic models.
* *Safe RL for Humanoids* (Castillo et al., 2023) — Barrier function filters for quadruped balance; does not interface with multimodal foundation models.
* *Shielded Foundation Models* (Alshiekh et al., 2018; modern survey 2024) — Discrete action masking; inapplicable to continuous high-frequency flow matching.

#### 3. What Existing Approaches Already Achieve
Reactive clamping of motor commands to ensure current limits ($I_{\max}$) and hard joint stop limits are not exceeded.

#### 4. What Remains Unsolved & Why Existing Methods Fail
* Clamping torques reactively on a walking humanoid causes instant fall events: suddenly cutting torque on a leg joint because it approached a limit destroys the dynamic balance trajectory.
* Existing safety filters cannot evaluate **future momentum**: an arm moving at $2\text{ m/s}$ with a 5 kg mass cannot be safely stopped in 5 mm of travel without extreme structural shock.

#### 5. Proposed PROBE-1 Hypothesis
> **Hypothesis 6 (Predictive Momentum Barrier):** Feeding the forward latent world model's 500 ms momentum prediction into a hardware-enforced Quadratic Program (QP) Control Barrier Function will reduce emergency stop activations by $\ge 70\%$ while maintaining $0.000\%$ hard joint and self-collision limit violations.

#### 6. Experimental Validation & Required Resources
* **Validation:** Benchmark Track 6 (Safety Evaluation) under deliberate adversarial disturbances, sudden target switches, and physical obstacles injected during trajectory execution.
* **Datasets & Resources:** HOROS Safety Runtime testbed running PREEMPT_RT Linux on Unitree G1 hardware.

#### 7. Expected Contribution & Risks
* **Contribution:** The first integration of a continuous neural foundation model with a provably safe predictive Control Barrier Function runtime.
* **Risks:** Solving the QP barrier optimization at 100 Hz may introduce computation latency. *Mitigation:* Implement GPU-accelerated active-set QP solvers (e.g., OSQP / ProxSuite) executing in $< 0.8$ ms.

---

### Research Gap 7: Continual Physical Learning & Mistake Immunity
*Can an embodied foundation model autonomously learn from its physical execution failures and adapt without catastrophically forgetting previous manipulation capabilities?*

#### 1. Research Gap Description
When a deployed robot fails at a task (e.g., misaligns a grasp and drops a tool), conventional foundation models cannot self-correct permanently. Updating weights on the failure demonstration via standard gradient descent causes catastrophic forgetting: the policy learns to pick up the dropped tool but degrades its performance across previously mastered tasks.

#### 2. Relevant Existing Papers
* *RoboCat* (Bousmalis et al., Nature 2023) — Self-improving foundation agent; demonstrates autonomous data generation, but requires massive centralized offline retraining runs.
* *Continual Learning for Robotics* (Lesort et al., 2020 survey) — Rehearsal and regularization methods (EWC, PackNet); evaluated on simple toy benchmarks.
* *MemoryOS / HOROS Mistake Immunity Architecture* (Sunil Kumar et al., 2026) — Epistemic memory logging of trajectory failures and runtime policy gating.

#### 3. What Existing Approaches Already Achieve
Fine-tuning models on new task datasets using Parameter-Efficient Fine-Tuning (LoRA) or adapter heads.

#### 4. What Remains Unsolved & Why Existing Methods Fail
* Standard LoRA adapters require manual human labeling of failure events and offline cluster retraining.
* Online reinforcement learning directly on physical hardware risks self-destructive actions during the exploration phase.

#### 5. Proposed PROBE-1 Hypothesis
> **Hypothesis 7 (Epistemic Trajectory Memory):** Logging failed execution traces into an episodic memory retrieval bank and retrieving nearest failure keys as negative conditioning tokens during flow matching inference will prevent repeated failure modes by $\ge 60\%$ without modifying base transformer weights.

#### 6. Experimental Validation & Required Resources
* **Validation:** Long-horizon deployment trials: robot executes 50 repetitive kitting tasks with injected adversarial object displacements; measure repeat failure rate over 5 successive runs.
* **Datasets & Resources:** First-party HOROS physical deployment telemetry streams.

#### 7. Expected Contribution & Risks
* **Contribution:** Non-destructive physical continual learning architecture that prevents repeat failures in production environments without expensive full-model retraining.
* **Risks:** Episodic memory lookup latency may exceed control cycle budget if the retrieval index grows beyond $10^5$ entries. *Mitigation:* Hierarchical vector quantization (HNSW indexing) with $< 2$ ms query latency.

---

## 2. Statistical Protocol & Power Analysis for Decisive Benchmarking (EXP-006)

In response to the benchmark integrity mandate, **EXP-006** (testing whether Candidate E: Hybrid World-Model + VLA genuinely outperforms Candidate D: Pure Flow Policy) establishes a rigorous inferential statistical protocol:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       EXP-006 STATISTICAL VALIDATION PROTOCOL               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Hypothesis Testing:                                                      │
│    • Null Hypothesis (H0): Success_Rate(Candidate E) = Success_Rate(Cand D) │
│    • Alternative (H1): Success_Rate(Candidate E) >= Success_Rate(Cand D) + δ│
│      where δ = 0.12 (12% absolute margin requirement).                      │
│                                                                             │
│ 2. Sample Size Justification & Power Analysis:                             │
│    • Target Statistical Power: 1 - β = 0.90 (90% power to detect true gain) │
│    • Significance Level: α = 0.01 (Two-tailed test)                         │
│    • Minimum Required Sample Size: N = 250 trials per candidate task block  │
│      (Total N = 1,250 paired physical & simulated evaluation runs).          │
│                                                                             │
│ 3. Inferential Testing & Paired Comparisons:                                │
│    • Paired McNemar's Test for binary task success outcomes.                │
│    • Wilcoxon Signed-Rank Test for continuous latency & force distributions │
│    • 95% Bootstrap Confidence Intervals (10,000 resamples per metric).      │
│                                                                             │
│ 4. Multiple Comparison Correction:                                          │
│    • Benjamini-Hochberg False Discovery Rate (FDR) control at q = 0.05      │
│      across all 50 task evaluation slices.                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

> **Experimental Decision Rule:**
> Candidate E is declared the winning architecture **if and only if**:
> 1. It demonstrates a statistically significant improvement ($p < 0.01$, Benjamini-Hochberg adjusted) over Candidate D with an effect size $\delta \ge 0.12$.
> 2. Its P99 end-to-end control latency remains strictly $\le 10.0$ ms on physical edge hardware.
>
> If Candidate E achieves higher success rates but violates the 10.0 ms P99 cycle budget, or if the success rate gain is $< 12\%$, **Candidate D (Continuous Flow Policy) is selected as the winning architecture for PROBE-1**.

---

## 3. Prioritized Research Focus for PROBE-1

From these seven evaluated gaps, PROBE-1 establishes the following prioritized research roadmap to convert into concrete experiments in `07-experiment-plan.md`:

1. **Priority 1 (Core Focus — Gaps 1 & 2):**
   * *Unified Multimodal Physical Representation & Anticipatory Contact Modeling.*
   * Solving tactile blindness and anticipatory friction margin regulation will create an immediate, defensible physical capability moat over vision-only foundation models (RT-2, OpenVLA, π0).
2. **Priority 2 (Execution Architecture — Gaps 5 & 6):**
   * *Sample-Efficient Sim-to-Real Dexterity & Predictive Safety Barriers.*
   * Validating that continuous flow policies can transfer from Isaac Sim to physical G1 hardware while guarded by provably safe Control Barrier Functions.
3. **Priority 3 (Frontier Investigation — Gaps 3, 4 & 7):**
   * *Action-Conditioned World Model Validation & Non-Destructive Mistake Immunity.*
   * Executing EXP-006 under the strict statistical protocol to empirically prove whether adding an action-conditioned world model justifies its computational overhead.
