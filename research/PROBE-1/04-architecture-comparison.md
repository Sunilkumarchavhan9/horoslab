# HOROS First-Party Model Program: PROBE-1
## 04 — Technical Architecture Comparison & Trade-off Analysis

### Executive Summary & Research Question
A foundational research question guides the technical definition of PROBE-1:
> **What technical architecture should PROBE-1 investigate, and why would it be better suited to our physical intelligence objectives than existing alternatives?**

To answer this without premature architectural lock-in, this study establishes a rigorous comparative trade-off analysis across **five candidate paradigms**:
* **Candidate A: Hierarchical Vision-Language-Action (VLA)** — Decoupled slow semantic planning + fast motor execution.
* **Candidate B: Action-Conditioned World Model** — Explicit forward prediction of physical world state transitions conditioned on candidate actions.
* **Candidate C: Spatiotemporal Dynamics Model** — Continuous geometric and contact-mechanics surrogate modeling (friction, contact manifolds, deformation).
* **Candidate D: Continuous-Action Flow Policy** — End-to-end Optimal Transport flow matching directly mapping multimodal perception to action vector fields.
* **Candidate E: Hybrid World-Model + VLA Policy** — Unified architecture co-training forward physical simulation with closed-loop reactive policy execution.

Every candidate is evaluated across ten standardized dimensions, clearly distinguishing **empirically published results (with citations)** from **HOROS research hypotheses**.

---

### Comparative Evaluation Matrix Across the Five Candidates

| Evaluation Criteria | Candidate A: Hierarchical VLA | Candidate B: Action-Conditioned World Model | Candidate C: Spatiotemporal Dynamics Model | Candidate D: Continuous Flow Policy | Candidate E: Hybrid World-Model + VLA |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Primary Mechanism** | Slow VLM Planner + Fast Reactive Policy | Autoregressive / Diffusion Latent State Transition | Neural Operator / SDF Physics Surrogate | Optimal Transport Vector Field Generation | Joint Physical Rollout + Flow-Guided Policy |
| **2. Action Representation** | Action Chunks (Joint Pos/Vel) | Latent Action Tokens / Control Commands | Kinematic / Contact Forces ($\boldsymbol{\tau}, \mathbf{f}_c$) | Continuous Action Chunk Flow Fields | Action Chunks Guided by Latent Value Gradients |
| **3. Control Frequency** | High: 5–10 Hz / Low: 100–200 Hz | 5–20 Hz (Planning in Imagination) | 50–100 Hz (Physics Simulation Step) | **100–200 Hz** (1–2 Step Flow ODE) | Dual: 10 Hz World Model / 100 Hz Policy |
| **4. Inference Latency** | Low-level: 5–10 ms; High-level: 150 ms | 50–200 ms per imagined rollout | 10–25 ms per forward simulation | **< 10 ms** (Real-time edge execution) | Policy: 8–12 ms; World Model: 80 ms |
| **5. Tactile & Force Integration** | Input to Low-Level Controller | Hard to ground in visual latents | **Native** (Explicit force/stress tensors) | Cross-attention conditioning tokens | **Native** (Grounds world model transitions) |
| **6. Whole-Body Locomotion** | Feasible via decoupled lower-body policy | Struggles with dynamic ground impact | Excellent for contact phase prediction | Feasible via high-dim action chunking | **Superior** (Anticipates slip & momentum) |
| **7. Training Complexity** | Moderate (Two independent models) | Very High (Compounding error mitigation) | High (PDE / contact complementarity losses) | Moderate (Standard Flow Matching loss) | **Highest** (Multi-task joint loss balancing) |
| **8. Compute Footprint** | Edge Deployable (NVIDIA Thor / Orin) | Server Heavy (Requires multi-rollout CEM) | GPU Accelerated (TensorRT / Warp) | **Lightweight Edge** (< 10 ms on single GPU) | Dual-Chip / Heterogeneous SoC |
| **9. Safety & Verifiability** | High (Safety filter between layers) | Moderate (Trajectory safety checks) | **Highest** (Explicit physical limit checks) | Moderate (Stochastic trajectory sampling) | **Highest** (Counterfactual pre-checks + CBF) |
| **10. Research Readiness** | High (Validated by GR00T N1, RT-H) | Moderate (Validated by DreamerV3, UniSim) | Emerging (ContactNets, PhysGaussian) | High (Validated by π0, Flow Matching) | **Frontier Research Hypothesis** |

---

## 1. Deep Technical Investigation of Candidate Architectures

### Candidate A: Hierarchical Vision-Language-Action (Hierarchical VLA)

#### 1. Architecture & Components
* **High-Level Semantic Planner (System 2):** Pretrained Vision-Language Model (3B–7B parameters, e.g., PaliGemma or Prismatic VLM) running asynchronously at low frequency (2–5 Hz). Ingests multi-view RGB camera frames and natural language instructions; outputs high-level semantic subgoals, spatial affordance coordinates, and execution phases.
* **Low-Level Motor Policy (System 1):** Compact, high-frequency transformer or MLP-Mixer policy (50M–100M parameters) running synchronously at high frequency (100–200 Hz). Ingests high-level latent goal embeddings, full-body proprioception (joint positions, velocities, torques), 6-DoF IMU measurements, and high-density tactile arrays; outputs continuous joint torque or impedance targets.
* **Published Precedents:** NVIDIA GR00T N1 (*Fan et al., arXiv:2503.14734, 2025*); RT-H (*Belkhale et al., CoRL 2024*); Octo Hierarchical Mode (*Octo Team, RSS 2024*).

#### 2. Input & Output Representations
* **Inputs:**
  * System 2: RGB images $\mathbf{I}_t \in \mathbb{R}^{3 \times H \times W}$, instruction text tokens $\mathbf{T}_{\text{lang}}$.
  * System 1: Latent subgoal vector $\mathbf{g}_t \in \mathbb{R}^{256}$, proprioceptive state $\mathbf{s}_t = [\mathbf{q}_t, \dot{\mathbf{q}}_t, \boldsymbol{\tau}_t] \in \mathbb{R}^{3 \times D}$, IMU vector $\mathbf{m}_t \in \mathbb{R}^6$, tactile normal/shear tensor $\mathbf{F}_t \in \mathbb{R}^{B \times 16 \times 16}$.
* **Outputs:** Continuous joint position/torque target chunks $\mathbf{A}_t \in \mathbb{R}^{K \times D}$ for horizon $K=16$ steps.

#### 3. Training Objectives & Loss Functions
* Decoupled two-stage optimization:
  $$\mathcal{L}_{\text{System 2}} = -\sum_{i} \log P(\mathbf{g}_i \mid \mathbf{I}_{\le i}, \mathbf{T}_{\text{lang}})$$
  $$\mathcal{L}_{\text{System 1}} = \mathbb{E}_{(\mathbf{s}, \mathbf{g}, \mathbf{a}^*)} \left[ \|\mathbf{a}^* - \pi_\theta(\mathbf{s}, \mathbf{g})\|_2^2 \right] + \lambda_{\text{smooth}} \|\nabla_t \mathbf{a}\|_2^2$$

#### 4. Datasets, Modalities & Computational Requirements
* **Datasets:** Requires visual internet VQA/caption datasets for System 2; real robot teleoperation logs (DROID, GR00T Teleop G1) and sim-to-real locomotion runs for System 1.
* **Compute:** System 2 requires 64x A100/H100 GPUs for pretraining; System 1 trains rapidly on 8x RTX 4090 / L40S GPUs.
* **Inference:** Asynchronous execution: System 2 runs on a separate GPU thread at 5 Hz; System 1 runs on real-time CPU/GPU loop at 100–200 Hz with $< 8$ ms latency.

#### 5. Trade-offs & Relevance to PROBE-1
* **Advantages:** Decouples heavy visual reasoning from fast real-time motor reflexes; prevents catastrophic motor freezes during long LLM forward passes.
* **Limitations:** Information bottleneck at the goal interface: if the high-level planner emits an erroneous or misaligned latent goal, the low-level controller blindly executes it.
* **PROBE-1 Relevance:** Strong baseline candidate. Provides immediate engineering feasibility and safe real-time execution on physical Unitree G1 hardware.

---

### Candidate B: Action-Conditioned World Model

#### 1. Architecture & Components
* **Spatiotemporal Visual-State Encoder:** VQ-VAE or continuous latent visual tokenizer compressing multi-view RGB-D streams into compact latent state representations $z_t \in \mathbb{R}^{L \times d}$.
* **Latent Transition Predictor:** Autoregressive or recurrent transformer (e.g., RSSM in DreamerV3 or causal transformer in Genie) modeling physical state transitions conditioned on continuous action sequences:
  $$z_{t+1:t+H} \sim P_\theta(z_{t+1:t+H} \mid z_{\le t}, a_{t:t+H})$$
* **Controller / Planner:** Model Predictive Path Integral (MPPI) or Cross-Entropy Method (CEM) planning inside the learned latent space, evaluating thousands of candidate action sequences against a target reward/value function without executing them on physical hardware.
* **Published Precedents:** DreamerV3 (*Hafner et al., Nature MI 2023*); UniSim (*Yang et al., ICML 2023*); DayDreamer (*Wu et al., CoRL 2022*); Genie (*Bruce et al., ICML 2024*).

#### 2. Input & Output Representations
* **Inputs:** Multi-view video frames $\mathbf{I}_{t-T:t}$, candidate action chunk sequences $\mathbf{a}_{t:t+H} \in \mathbb{R}^{H \times D}$, high-level task goal embedding $\mathbf{g}$.
* **Outputs:** Imagined future latent trajectory $\hat{z}_{t+1:t+H}$, predicted task reward/success probability $\hat{r}_{t+H}$, predicted contact failure/slip indicators.

#### 3. Training Objectives & Loss Functions
* Multi-component variational bound:
  $$\mathcal{L}_{\text{WM}} = \mathbb{E} \left[ \mathcal{L}_{\text{recon}}(\hat{\mathbf{I}}_t, \mathbf{I}_t) + \beta D_{\text{KL}}(q(z_t \mid \mathbf{I}_{\le t}, a_{< t}) \parallel p(z_t \mid z_{t-1}, a_{t-1})) + \mathcal{L}_{\text{reward}}(\hat{r}_t, r_t) \right]$$

#### 4. Datasets, Modalities & Computational Requirements
* **Datasets:** Requires millions of unannotated robot interaction videos, passive observation videos (Ego4D), and simulated physics rollouts.
* **Compute:** Heavy training footprint (128x H100 GPUs for multi-billion parameter world models).
* **Inference:** Significant latency: sampling 100 candidate trajectories through 15 diffusion/transformer steps takes **150–500 ms**, requiring offline execution or asynchronous model-predictive caching.

#### 5. Trade-offs & Relevance to PROBE-1
* **Advantages:** True counterfactual reasoning: the robot can simulate "what happens if I push this heavy cart" before physical motor actuation; enables zero-shot physical affordance evaluation.
* **Limitations:** **Compounding Latent Error:** Minor prediction errors accumulate over multi-step rollouts, causing "hallucinated physics" where objects float or pass through solid barriers. High inference latency precludes direct 100 Hz motor control.
* **PROBE-1 Relevance:** Cannot serve as the standalone direct motor controller for PROBE-1, but constitutes an essential subsystem for counterfactual mission verification and simulation dreaming.

---

### Candidate C: Spatiotemporal Dynamics Model

#### 1. Architecture & Components
* **Differentiable Geometric Physics Engine:** Deep neural operator (Fourier Neural Operator / Point Transformer) directly modeling continuous contact mechanics, continuous signed distance fields (SDFs), stress tensors, and momentum exchange.
* **Contact Manifold Predictor:** Explicitly computes contact normals $\hat{\mathbf{n}}_c$, friction cone margins $\mu F_N - \|F_T\| \ge 0$, and collision impulse vectors:
  $$\boldsymbol{\lambda}_c = \arg\min_{\boldsymbol{\lambda}} \frac{1}{2} \boldsymbol{\lambda}^T \mathbf{A} \boldsymbol{\lambda} + \mathbf{b}^T \boldsymbol{\lambda} \quad \text{s.t.} \quad \boldsymbol{\lambda} \in \mathcal{K}_{\text{friction}}$$
* **Published Precedents:** ContactNets (*Pfrommer et al., CoRL 2020*); PhysGaussian (*Xie et al., CVPR 2024*); Humanoid World Models (*Gu et al., arXiv:2506.01182, 2025*); D-NeRF (*Pumarola et al., 2021*).

#### 2. Input & Output Representations
* **Inputs:** 3D surface point clouds / mesh vertices $\mathbf{P}_t \in \mathbb{R}^{N \times 3}$, joint positions and velocities $[\mathbf{q}, \dot{\mathbf{q}}]$, measured contact force-torque signals $\mathbf{F}_{\text{ext}} \in \mathbb{R}^6$, terrain elevation grid.
* **Outputs:** Predicted contact forces $\mathbf{F}_{c, t+1}$, contact point locations $\mathbf{x}_c$, dynamic stability margin (Zero Moment Point distance to support polygon edge $\Delta d_{\text{ZMP}}$).

#### 3. Training Objectives & Loss Functions
* Physics-informed loss enforcing Newton-Euler momentum conservation and non-penetration complementarity:
  $$\mathcal{L}_{\text{Phys}} = \|\mathbf{M}(\mathbf{q})\ddot{\mathbf{q}} + \mathbf{C}(\mathbf{q},\dot{\mathbf{q}})\dot{\mathbf{q}} + \mathbf{G}(\mathbf{q}) - (\boldsymbol{\tau} + \mathbf{J}_c^T \mathbf{F}_c)\|_2^2 + \gamma \max(0, -\phi(\mathbf{x}))$$
  where $\phi(\mathbf{x})$ is the signed distance field (penalizing inter-penetration).

#### 4. Datasets, Modalities & Computational Requirements
* **Datasets:** High-frequency physical telemetry with multi-axis force-torque sensors (RH20T research logs, HOROS physical test rigs), synchronized high-speed mocap (Vicon), and Isaac Lab contact telemetry.
* **Compute:** GPU-accelerated tensor operations (NVIDIA Warp / CUDA kernels). Requires moderate parameter scale (100M–500M parameters).
* **Inference:** Fast forward simulation step ($10–20$ ms), enabling real-time contact estimation at 50–100 Hz.

#### 5. Trade-offs & Relevance to PROBE-1
* **Advantages:** Unrivaled physical correctness; eliminates hallucinations of contact and guarantees adherence to friction cone limits; directly prevents foot slippage and motor torque saturation.
* **Limitations:** Narrow semantic scope: cannot understand natural language instructions, cannot parse complex visual scenes or novel object categories.
* **PROBE-1 Relevance:** Crucial lower-tier subsystem for PROBE-1's bipedal balance and dexterous grasping reflexes.

---

### Candidate D: Continuous-Action Flow Policy (Flow Matching VLA)

#### 1. Architecture & Components
* **Unified Perception Trunk:** Vision-Language transformer (e.g., SigLIP + DINOv2 visual encoders paired with PaliGemma or SmolLM2) processing camera streams and instructions into a continuous conditioning token sequence $\mathbf{c}_t$.
* **Optimal Transport Flow Matching Action Head:** Continuous vector field estimator $v_\theta(\mathbf{a}_t, t, \mathbf{c})$. Instead of standard multi-step denoising diffusion (which requires 10–20 steps), it learns straight-line probability paths between standard Gaussian noise $\mathbf{a}_0 \sim \mathcal{N}(0, \mathbf{I})$ and ground-truth action chunks $\mathbf{a}_1 \in \mathbb{R}^{K \times D}$.
* **Inference Solver:** Solves the continuous ODE $\frac{d\mathbf{a}}{dt} = v_\theta(\mathbf{a}_t, t, \mathbf{c})$ in **1 to 2 Euler integration steps**, producing smooth multi-step action trajectories in $< 10$ ms.
* **Published Precedents:** π0 (*Physical Intelligence Team, Technical Report 2024*); Flow Matching for Generative Modeling (*Lipman et al., ICLR 2023*); Direct Flow Policy (*Chi et al., 2024*).

#### 2. Input & Output Representations
* **Inputs:** Multi-view RGB camera feeds ($3 \times [H \times W]$), language instruction embeddings, full-body joint proprioception $\mathbf{q}_t$, tactile pressure maps $\mathbf{P}_t$, flow time step $t \in [0, 1]$.
* **Outputs:** Continuous whole-body action chunk $\mathbf{A}_t \in \mathbb{R}^{32 \times 32}$ (32 future time steps of 32-DoF joint position/impedance deltas).

#### 3. Training Objectives & Loss Functions
* Conditional Optimal Transport Flow Matching Loss:
  $$\mathcal{L}_{\text{CFM}} = \mathbb{E}_{t \sim \mathcal{U}[0, 1], \mathbf{a}_0 \sim p_0, \mathbf{a}_1 \sim q} \left\| v_\theta((1 - t)\mathbf{a}_0 + t \mathbf{a}_1, t, \mathbf{c}) - (\mathbf{a}_1 - \mathbf{a}_0) \right\|^2$$
  This objective directly regresses the constant velocity vector field connecting noise to data, avoiding the noisy score-matching variances of standard diffusion.

#### 4. Datasets, Modalities & Computational Requirements
* **Datasets:** Requires large-scale demonstration datasets with continuous, smooth trajectories (DROID, BridgeData V2, Humanoid Everyday, GR00T Teleop G1).
* **Compute:** Highly efficient during both training and inference. 3.5B model trains in 7–10 days on 32x H100 GPUs.
* **Inference:** Sub-10 ms latency on NVIDIA RTX 4090 / Jetson Thor with FP8 / INT8 quantization. Runs cleanly at **100 Hz**.

#### 5. Trade-offs & Relevance to PROBE-1
* **Advantages:** SOTA dexterity on physical hardware; human-like fluid motion; captures multi-modal action distributions without mode collapse; eliminates discrete tokenization lag.
* **Limitations:** Lacks explicit future-state prediction: cannot evaluate if an action trajectory will collide with an unmodeled dynamic obstacle 2 seconds in the future unless that obstacle is explicitly within the training demonstration distribution.
* **PROBE-1 Relevance:** **Prime candidate for PROBE-1's core action generation engine.**

---

### Candidate E: Hybrid World-Model + VLA Policy

#### 1. Architecture & Components
* **Unified Dual-Branch Transformer:** A single shared physical foundation trunk branching into two synchronized execution heads:
  1. *Action Generation Head (Flow Matching VLA):* Generates immediate high-frequency continuous action chunks ($100$ Hz) to drive motors.
  2. *Physical World Model Head (Latent Dynamics Predictor):* Predicts the consequences of the planned action chunk over a 2-second future window ($z_{t+1:t+H}$), evaluating contact stability, collision probability, and slip risk.
* **Closed-Loop Counterfactual Monitor:** If the physical world model head detects that the planned action trajectory will violate a stability boundary (e.g., ZMP margin collapse or excessive shear stress), an automated replanning interrupt is triggered before motor current saturation occurs.
* **Published Precedents / HOROS Research Frontier:** Theoretical synthesis uniting DreamerV3 / UniSim (*Hafner 2023, Yang 2023*) with Flow Matching VLAs (*π0, Black 2024*); Humanoid World Models (*Gu 2025*).

```
                      CANDIDATE E: HYBRID ARCHITECTURE
                      
    [ Multimodal Sensory Perception: Vision, Proprio, IMU, Tactile, F/T ]
                                   │
                                   ▼
         [ Shared Spatiotemporal Physical Foundation Trunk (3B–7B) ]
                                   │
                 ┌─────────────────┴─────────────────┐
                 ▼                                   ▼
     [ Branch 1: Action Flow Head ]     [ Branch 2: World Model Head ]
       (100 Hz Continuous Chunk)          (Future State & Contact Rollout)
                 │                                   │
                 ▼                                   ▼
     [ Candidate Trajectory a_t ] ──────► [ Predict: Collision? Slip? ]
                 │                                   │
                 ├───────────────────────────────────┘
                 ▼ (If Safe)
     [ Independent Hardware Safety Barrier (CBF / Torque Saturation) ]
                 │
                 ▼
     [ Physical Robot Hardware (Unitree G1 / H1 Actuators) ]
```

#### 2. Input & Output Representations
* **Inputs:** Unified token sequence: multi-view visual tokens + text instruction tokens + proprioceptive state tokens + tactile/force tokens.
* **Outputs:**
  * Branch 1: Continuous action chunk $\mathbf{A}_t \in \mathbb{R}^{32 \times 32}$.
  * Branch 2: Predicted future latent tokens $\hat{\mathbf{z}}_{t+1:t+H}$, predicted contact impulse tensor $\hat{\boldsymbol{\lambda}}_c$, and predicted safety risk score $\hat{R}_{\text{risk}} \in [0, 1]$.

#### 3. Training Objectives & Loss Functions
* Joint multi-task co-training objective:
  $$\mathcal{L}_{\text{Hybrid}} = \mathcal{L}_{\text{CFM}}(\mathbf{A}_t) + \alpha \mathcal{L}_{\text{Dynamics}}(\hat{\mathbf{z}}_{t+1:t+H}, \mathbf{z}_{t+1:t+H}) + \beta \mathcal{L}_{\text{Contact}}(\hat{\boldsymbol{\lambda}}_c, \boldsymbol{\lambda}_c) + \gamma \mathcal{L}_{\text{Safety}}(\hat{R}_{\text{risk}}, R_{\text{actual}})$$

#### 4. Datasets, Modalities & Computational Requirements
* **Datasets:** Requires both high-quality physical demonstration trajectories (GR00T G1, Humanoid Everyday, DROID) AND massive interaction/observation rollouts (Isaac Sim, Ego4D).
* **Compute:** Highest compute footprint among all candidates (64x to 128x H100 GPUs for joint pretraining).
* **Inference:** Asymmetric compute scheduling: Action Flow Head executes at 100 Hz (8 ms step); World Model Head evaluates asynchronously every 10–20 steps (50–100 ms) to audit upcoming trajectory safety.

#### 5. Trade-offs & Relevance to PROBE-1
* **Advantages:** Combines the high-speed dexterity of continuous flow matching with the strategic foresight and safety verification of a physical world model. Eliminates blind execution.
* **Limitations:** High engineering complexity; balancing multi-task loss gradients during training requires careful loss weighting to prevent world model gradients from destabilizing action generation.
* **PROBE-1 Relevance:** **Represents PROBE-1's ultimate long-term frontier target hypothesis.**

---

## 2. Resolving the Six Critical Architectural Questions

### Q1: Should PROBE-1 use a single monolithic model or multiple coordinated models?
* **Research Finding:** **Multiple coordinated models (modular hierarchy) are mathematically and physically necessary.**
* **Scientific Justification:** Monolithic models (e.g., RT-2, OpenVLA) force high-level semantic reasoning (tokenizing concepts like "fragile wine glass") and low-level physical dynamics (damping joint vibration at 200 Hz) to share the same neural weights and inference clock. A 7B parameter forward pass takes $\ge 150$ ms, which is an eternity when a humanoid foot begins to slip on wet tile (reaction required in $< 20$ ms). PROBE-1 must use coordinated, asynchronous models operating on decoupled clock cycles.

### Q2: Should physical dynamics prediction be separate from action generation?
* **Research Finding:** **They should be decoupled in execution, but share pre-trained foundation representations.**
* **Scientific Justification:** Forcing action generation to wait for a full video or volumetric dynamics prediction step introduces intolerable generative latency (diffusion video models take seconds). However, training them on a shared geometric-physical foundation backbone ensures the action policy implicitly understands physical affordances, contact limits, and momentum conservation.

### Q3: How should the high-level planner communicate with the low-level controller?
* **Research Finding:** **Via continuous latent goal embeddings paired with temporal phase tokens, NOT text or discrete action tokens.**
* **Scientific Justification:** Communicating via natural language text tokens (e.g., "move arm 2 cm left") introduces semantic ambiguity and discrete latency. PROBE-1 establishes a continuous cross-attention interface: the high-level planner emits a 256-dimensional spatial affordance token sequence $\mathbf{g}_t$ and a phase indicator $\phi \in [0, 1]$, which condition the low-level flow matching action head via cross-attention.

### Q4: How can the model learn from both real robot demonstrations and simulation?
* **Research Finding:** **Through Asymmetric Multi-Stage Co-Training with Feature Aligners.**
* **Scientific Justification:**
  * *Simulation Data (Isaac Lab / Isaac Sim):* Abundant, cheap, with ground-truth contact forces and joint torques. Used to train whole-body locomotion, disturbance rejection, and recovery reflexes.
  * *Real-World Data (DROID, Humanoid Everyday, G1 Teleop):* Sparse and visually complex. Used to ground the visual perception trunk, grasp affordances, and material interactions.
  * *Alignment:* Cross-domain contrastive loss and domain randomization (friction, mass, camera noise) bridge the sim-to-real gap, ensuring the policy does not overfit to simulation physics artifacts.

### Q5: How do we incorporate force, tactile, and proprioceptive signals?
* **Research Finding:** **Via dedicated Temporal Sensor Tokenizers directly integrated into the flow matching action head.**
* **Scientific Justification:** Vision is occluded during grasping and manipulation. PROBE-1 introduces:
  1. *Optical Tactile Tokenizer (GelSight/DIGIT):* Converts 2D shear displacement vector fields into spatial latent tokens.
  2. *Proprioception & IMU Tokenizer:* Continuous MLP embedding joint positions, velocities, torques, and accelerations at 200 Hz.
  3. These sensor tokens bypass the slow visual trunk and feed directly into the low-level flow policy, enabling instant reactive grip-force adjustment within 10 ms.

### Q6: How do we prevent unsafe model predictions from directly controlling hardware?
* **Research Finding:** **Through an Independent Deterministic Safety Controller (Outside the Neural Network).**
* **Scientific Justification:** Neural networks are inherently stochastic and vulnerable to out-of-distribution distribution shift. PROBE-1 establishes an unbypassable hardware-level safety boundary between the policy output and motor drivers:
  $$\boldsymbol{\tau}_{\text{motor}} = \text{SafetyFilter}(\mathbf{a}_{\text{model}}, \mathbf{s}_{\text{robot}})$$
  * **Control Barrier Functions (CBFs):** Mathematically enforce zero self-collision and joint over-extension.
  * **Torque Saturation Envelopes:** Prevent joint motor current overloads.
  * **Hard E-Stop Intercept:** Instantaneous open-loop hardware braking if stability thresholds (ZMP margins) collapse.

---

## 3. The PROBE-1 Hypothesized Research Direction

Based on this comprehensive comparative study, PROBE-1 articulates its primary **working research hypothesis** (to be empirically benchmarked rather than dogmatically selected):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      HOROS PROBE-1 HYPOTHESIZED ARCHITECTURE                │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. MULTIMODAL PHYSICAL PERCEPTION                                           │
│    • Multi-View RGB-D (Stereo Head + Wrist Cams)                            │
│    • High-Density Tactile (GelSight Optical Shear + Matrix Pressure)        │
│    • Whole-Body Proprioception (Joint Pos, Vel, Torque, 6-DoF Pelvis IMU)   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. PHYSICAL WORLD MODEL                                                     │
│    • Spatiotemporal Causal Foundation Trunk (3.5B Parameters)               │
│    • Action-Conditioned Contact Normal & Friction Margin Estimator          │
│    • Counterfactual Simulation & Latent Future State Prediction             │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. HIERARCHICAL ACTION INTELLIGENCE                                         │
│    • System 2 (Slow Semantic Planner @ 5 Hz): Affordances & Sub-goals       │
│    • System 1 (Fast Flow Policy @ 100 Hz): Optimal Transport Action Chunks  │
│    • Whole-Body Loco-Manipulation: Dynamic ZMP Balance + Dexterous Hands    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. INDEPENDENT DETERMINISTIC SAFETY CONTROLLER                              │
│    • Control Barrier Functions (CBFs) & Joint Workspace Limits              │
│    • Continuous Friction-Cone & Motor Thermal Saturation Filters            │
│    • Hardware Real-Time Safe Intercept (< 1 ms latency)                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

> **Research Integrity Declaration:**
> The above 4-tier architecture is an empirical research hypothesis designed for experimental validation against Candidates A, B, C, and D. It will be subjected to the rigorous benchmark suite defined in `05-benchmark-design.md` before finalizing production freeze.

---

## 4. Legal & Data Governance Integrity Check

In strict adherence to the HOROS Data Governance Charter, the dataset inventory audited in `03-dataset-audit.md` is governed by the following legal compliance requirements:
1. **Preservation of Raw License Artifacts:** The actual license text files, upstream repository commit hashes, dataset card snapshots, and source URLs are archived in `research/SHARED/licenses/` prior to authorizing cluster training jobs.
2. **Quarantine Verification:** `GR00T Teleop GR1` (Fourier Intelligence, CC-BY-NC 4.0) and `RH20T` (SJTU Academic NonCommercial) are verified as physically isolated in separate network-isolated directories to prevent accidental inclusion in commercial training runs.
3. **Audit Trail Signatures:** Every pretraining run logs the cryptographic SHA-256 hash of its ingestion manifest, guaranteeing 100% legal traceability for enterprise and commercial deployment.
