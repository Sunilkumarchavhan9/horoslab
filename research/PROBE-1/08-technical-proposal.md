# HOROS First-Party Model Program: PROBE-1
## 08 — Technical Proposal & Architecture Specification

---

### Executive Summary

**HOROS PROBE-1** is a first-party physical-AI foundation model engineered specifically for humanoid robotics, dynamic whole-body locomotion, and bi-manual dexterous manipulation. While modern Vision-Language-Action (VLA) foundation models have established semantic generalization across tabletop manipulation tasks, they exhibit fundamental deficiencies when deployed on high-degree-of-freedom humanoid hardware:
1. **Perceptual Disconnect:** Standard VLAs depend exclusively on low-frequency visual tokens ($5\text{--}10\text{ Hz}$), discarding high-frequency contact forces, joint torque transients, optical tactile shear, and inertial dynamics.
2. **Kinematic Decoupling & Fragility:** Autoregressive token generation generates discretized end-effector poses without respecting non-linear whole-body kinematics, leading to high latency ($> 100\text{ ms}$), severe phase lag, and dangerous actuator jitter.
3. **Contact-Unaware Control:** Existing models do not model contact transitions, friction manifolds, or dynamic slip, causing high drop rates and excessive impact forces during physical interaction.
4. **Lack of Independent Safety Certification:** Stochastic neural policies directly control physical motors without mathematical safety guarantees, risking catastrophic hardware collisions or falls during out-of-distribution hallucinations.

PROBE-1 resolves these foundational bottlenecks through a **Hierarchical, Multi-Rate Physical Foundation Architecture (HOROS-DualFlow)**. It couples a slow semantic and physical planning trunk ($5\text{--}10\text{ Hz}$) with an action-conditioned continuous flow-matching motor policy ($100\text{ Hz}$) and an independent, deterministic Control Barrier Function (p-CBF) safety supervisor ($200\text{--}500\text{ Hz}$), providing sub-millisecond safety guarantees directly on edge compute.

---

### 1. Architectural Specification

PROBE-1 is structured into four tightly coordinated yet rate-decoupled operational tiers:

```
                                  [HIGH-LEVEL SENSORY STREAMS]
              Multi-View RGB-D (30 Hz)                  Natural Language Instructions
                         │                                           │
                         ▼                                           ▼
             [Vision-Language Tokenizer]                     [Text Tokenizer]
             (SigLIP-2 / DINOv2 Hybrid)                      (Byte-Pair Encoding)
                         │                                           │
                         └───────────────────┬───────────────────────┘
                                             │
                                             ▼
             ┌───────────────────────────────────────────────────────────────┐
             │         TIER 2: PHYSICAL-VLA FOUNDATION TRUNK                 │
             │         3.8B Sparse MoE (1.1B Active Parameters / Token)      │
             │         - Operates at 5 - 10 Hz                               │
             │         - Semantic Reasoning & Affordance Decomposition       │
             │         - Outputs: Latent Goal Representation z_goal          │
             └───────────────────────────────┬───────────────────────────────┘
                                             │
                                             ▼
                      ┌──────────────────────────────────────┐
                      │    TIER 3: ACTION-CONDITIONED       │
                      │    PHYSICAL WORLD MODEL              │
                      │    - Predicts SDF & Contact Manifold │
                      │    - Forward Rollout: \hat{s}_{t+k}  │
                      └──────────────────────┬───────────────┘
                                             │
                       [HIGH-RATE PROPRIOCEPTIVE & TACTILE SENSORS]
                       Joint Encoders (200 Hz), IMU (500 Hz), Tactile Arrays (100 Hz)
                                             │
                                             ▼
                               ┌─────────────────────────────┐
                               │  TIER 1: PHYSICAL TOKENIZER │
                               │  Temporal Convolutions +    │
                               │  Cross-Attention Alignment  │
                               └─────────────┬───────────────┘
                                             │
                                             ▼
             ┌───────────────────────────────────────────────────────────────┐
             │         TIER 4A: CONTINUOUS FLOW ACTION EXPERT                │
             │         45M Parameter Lightweight Diffusion Transformer (DiT)  │
             │         - Operates at 100 Hz (Inference Latency: 7.2 ms)      │
             │         - Optimal Transport Flow Matching (OT-CFM)            │
             │         - 3-Step Mid-Point ODE Numerical Integration          │
             │         - Generates 32-step Action Chunk (q, \dot{q}, \tau)   │
             └───────────────────────────────┬───────────────────────────────┘
                                             │
                                             ▼
             ┌───────────────────────────────────────────────────────────────┐
             │         TIER 4B: PREDICTIVE CONTROL BARRIER SUPERVISOR        │
             │         - Operates at 200 - 500 Hz (Deterministic <= 1.0 ms)   │
             │         - Active-Set Quadratic Program (OSQP / ProxSuite)     │
             │         - Invariance: Joint Torques, Collision Tubes, ZMP     │
             │         - Hard Timeout Fallback: Safe Impedance Deceleration  │
             └───────────────────────────────┬───────────────────────────────┘
                                             │
                                             ▼
                                 [ACTUATOR MOTOR INVERTERS]
                                 EtherCAT / CAN-FD Bus to Motors
```

#### Detailed Component Responsibilities

1. **Tier 1: Multimodal Physical Tokenizer (Multi-Rate Fusion):**
   * Projects asynchronous sensory data into a synchronized 512-dimensional embedding space $\mathcal{Z}_{\text{phys}}$.
   * Vision: Dual RGB-D streams (head stereo + wrist cameras) encoded via lightweight patch projections.
   * Tactile: Optical tactile shear fields (GelSight/DIGIT) compressed via shallow spatial CNN encoders.
   * Proprioception: 200 Hz joint positions, velocities, motor currents, and 6-DoF base IMU accelerations compressed via temporal 1D causal convolutions.

2. **Tier 2: Physical-VLA Foundation Trunk (5–10 Hz Planner):**
   * 3.8B parameter Sparse Mixture-of-Experts (MoE) architecture with 8 experts (2 active per token, 1.1B active parameter compute footprint).
   * Ingests language instructions and multimodal tokens to formulate high-level spatial affordances, contact sequence plans, and task phase transitions.
   * Emits a compact latent conditioning vector $\mathbf{z}_{\text{goal}} \in \mathbb{R}^{256}$ to guide downstream continuous action generation.

3. **Tier 3: Action-Conditioned Physical World Model (Predictive Dynamics):**
   * Predicts future physical state evolutions $\hat{s}_{t+k}$ over a lookahead horizon $H = 15\text{--}50$ steps conditioned on candidate action sequences.
   * Directly predicts geometric surface Signed Distance Fields (SDF), contact normal forces $\hat{f}_N$, tangential shear forces $\hat{f}_T$, and slip probabilities $\hat{p}_{\text{slip}}$.
   * Acts as a predictive guide for test-time trajectory optimization (CEM) and feeds forward safety tubes to the barrier supervisor.

4. **Tier 4A: Continuous Flow Action Expert (100 Hz Low-Level Policy):**
   * 45M parameter Diffusion Transformer (DiT) operating on Optimal Transport Conditional Flow Matching (OT-CFM).
   * Generates continuous 32-step whole-body action chunks ($0.32\text{ s}$ horizon) comprising joint angles, velocities, and feedforward torques.
   * Solved with a 3-step mid-point Euler ODE solver in $7.2\text{ ms}$ on NVIDIA Jetson Thor hardware.

5. **Tier 4B: Predictive Control Barrier Function Supervisor (200–500 Hz Safety Filter):**
   * Deterministic, mathematically provable safety boundary implemented outside the neural network forward graph.
   * Solves an active-set Quadratic Program (ProxSuite / OSQP) within a hard **1.0 ms deterministic hardware deadline**.
   * Filters raw action proposals $\mathbf{a}^*$ to ensure joint limit compliance, collision avoidance, and Zero-Moment Point (ZMP) stability within the support polygon.

---

### 2. Mathematical Formulation

#### 2.1 Optimal Transport Conditional Flow Matching (OT-CFM)
Unlike slow stochastic diffusion processes that require 20–50 iterative denoising steps, PROBE-1 adopts continuous-time Optimal Transport Flow Matching. 

Let $\mathbf{a}_1 \sim q(\mathbf{a})$ denote ground-truth demonstration action chunks, and let $\mathbf{a}_0 \sim p_0(\mathbf{a}) = \mathcal{N}(\mathbf{0}, \mathbf{I})$ denote standard Gaussian noise. We construct the straight-line probability path:
$$\psi_t(\mathbf{a}_0) = \mathbf{a}_t = (1 - (1 - \sigma_{\min})t)\mathbf{a}_0 + t\mathbf{a}_1, \quad t \in [0, 1]$$
The corresponding marginal vector field that generates this probability path is:
$$u_t(\mathbf{a} \mid \mathbf{a}_1) = \frac{\mathbf{a}_1 - (1 - \sigma_{\min})\mathbf{a}_t}{1 - (1 - \sigma_{\min})t}$$

PROBE-1 parameterizes a time-dependent neural vector field $v_\theta(t, \mathbf{a}_t, \mathbf{c})$ where $\mathbf{c} = [\mathbf{z}_{\text{goal}}, \mathbf{z}_{\text{phys}}]$ represents the fused conditioning context. The training objective minimizes the mean squared regression error:
$$\mathcal{L}_{\text{CFM}}(\theta) = \mathbb{E}_{t \sim \mathcal{U}[0, 1],\, \mathbf{a}_0 \sim p_0,\, \mathbf{a}_1 \sim q} \left\| v_\theta(t, \mathbf{a}_t, \mathbf{c}) - (\mathbf{a}_1 - (1 - \sigma_{\min})\mathbf{a}_0) \right\|^2$$

During inference, action trajectories are generated deterministically by integrating the ordinary differential equation (ODE):
$$\frac{d\mathbf{a}_t}{dt} = v_\theta(t, \mathbf{a}_t, \mathbf{c})$$
from $t = 0$ to $t = 1$ using a 3-step mid-point Runge-Kutta/Euler integrator.

#### 2.2 Action-Conditioned Dynamics & SDF Rollout
The Tier 3 world model predicts future environmental and proprioceptive transitions over horizon $H$:
$$\hat{s}_{t+k+1} = f_\phi(\hat{s}_{t+k}, \mathbf{a}_{t+k}, \mathbf{z}_{\text{goal}}), \quad k \in [0, H-1]$$
where state $s_t = [\mathbf{q}_t, \dot{\mathbf{q}}_t, \boldsymbol{\Phi}_{\text{SDF}}(x), \mathbf{f}_{\text{contact}}]$.

Normalized Future Prediction Error ($\text{NFPE}$) over horizon $H$ is computed as:
$$\text{NFPE}(H) = \frac{1}{H} \sum_{k=1}^H \left( \frac{1}{D} \sum_{j=1}^D \frac{|\hat{s}_{t+k, j} - s_{t+k, j}|}{\sigma_j + \epsilon} \right)$$
where $\sigma_j$ is the empirical standard deviation of state variable $j$ across the dataset. The world model loss penalizes dynamics error and signed distance field reconstruction:
$$\mathcal{L}_{\text{world}}(\phi) = \sum_{k=1}^H \left( \|\hat{s}_{t+k} - s_{t+k}\|_{\Sigma^{-1}}^2 + \lambda_{\text{SDF}} \|\hat{\boldsymbol{\Phi}}_{t+k} - \boldsymbol{\Phi}_{t+k}\|_1 \right)$$

#### 2.3 Anticipatory Contact & Slip Mechanics
Physical contact interactions are governed by Coulomb friction cone constraints:
$$\|\mathbf{f}_T\| \le \mu \|\mathbf{f}_N\|$$
PROBE-1 introduces an anticipatory slip prediction head trained on high-speed optical tactile shear deformations:
$$\hat{p}_{\text{slip}}(t + \Delta t) = \sigma\left( \mathbf{w}_{\text{slip}}^T \cdot \text{MLP}\left( \mathbf{z}_{\text{tactile}}, \dot{\mathbf{z}}_{\text{tactile}}, \mathbf{f}_{\text{cmd}} \right) \right)$$
When $\hat{p}_{\text{slip}} > 0.5$, an anticipatory grasping squeeze torque $\Delta \tau_{\text{grip}} = K_p (\hat{p}_{\text{slip}} - 0.5) \mathbf{n}_{\text{contact}}$ is injected into the commanded action $25\text{ ms}$ prior to macro-slippage.

#### 2.4 Morphology-Invariant Centroidal Momentum Coordinates
To achieve seamless cross-embodiment transfer between disparate humanoid robots (e.g., Unitree H1 vs. Unitree G1), the high-level policy predicts centroidal momentum rates rather than robot-specific joint positions:
$$\dot{\mathbf{h}}_{\text{base}} = \begin{bmatrix} \dot{\mathbf{p}} \\ \dot{\mathbf{k}} \end{bmatrix} = \begin{bmatrix} m \ddot{\mathbf{x}}_{\text{CoM}} \\ \frac{d}{dt} \mathbf{L}_{\text{CoM}} \end{bmatrix} = \sum_{i=1}^{N_c} \begin{bmatrix} \mathbf{f}_i \\ (\mathbf{p}_i - \mathbf{x}_{\text{CoM}}) \times \mathbf{f}_i \end{bmatrix} + \begin{bmatrix} m\mathbf{g} \\ \mathbf{0} \end{bmatrix}$$
An embodiment-specific inverse dynamics layer maps commanded centroidal momentum $\dot{\mathbf{h}}^*$ and operational space twists $\dot{\mathbf{x}}_{\text{task}}^*$ into robot joint torques $\boldsymbol{\tau}$ via the robot's centroidal momentum matrix $\mathbf{A}_{\text{robot}}(\mathbf{q})$:
$$\mathbf{A}_{\text{robot}}(\mathbf{q}) \ddot{\mathbf{q}} + \dot{\mathbf{A}}_{\text{robot}}(\mathbf{q}, \dot{\mathbf{q}})\dot{\mathbf{q}} = \dot{\mathbf{h}}^*$$

#### 2.5 Predictive Control Barrier Functions (p-CBF)
Hardware safety is certified by solving a real-time Quadratic Program at 200–500 Hz. Given candidate action $\mathbf{a}^*$ from the flow expert, the filtered safety command $\mathbf{u}^*$ is computed as:
$$\mathbf{u}^* = \arg\min_{\mathbf{u}} \frac{1}{2} \| \mathbf{u} - \mathbf{a}^* \|_{\mathbf{W}}^2$$
subject to:
1. **Torque Bounds:** $\boldsymbol{\tau}_{\min} \le \mathbf{M}(\mathbf{q})\mathbf{u} + \mathbf{C}(\mathbf{q}, \dot{\mathbf{q}})\dot{\mathbf{q}} + \mathbf{g}(\mathbf{q}) \le \boldsymbol{\tau}_{\max}$
2. **Predictive Barrier Condition:**
   $$\nabla h(\hat{s}_{t+k})^T f(\hat{s}_{t+k}, \mathbf{u}) + \alpha(h(\hat{s}_{t+k})) \ge 0, \quad \forall k \in [1, K_{\text{horizon}}]$$
   where $h(s) = d_{\text{obs}}(s) - d_{\text{safe}}$ represents the distance to obstacle or self-collision boundary.
3. **ZMP Polygon Constraint:** The predicted Zero-Moment Point must strictly remain inside the support polygon boundary:
   $$\mathbf{p}_{\text{ZMP}} = \mathbf{x}_{\text{CoM}} - \frac{z_{\text{CoM}}}{\ddot{z}_{\text{CoM}} + g} \ddot{\mathbf{x}}_{\text{CoM}} \in \mathcal{S}_{\text{support}}$$

If the QP solver fails to converge within the **1.0 ms deterministic execution timeout**, the controller automatically engages a pre-computed safe impedance braking policy:
$$\mathbf{u}_{\text{safe}} = - \mathbf{K}_d \dot{\mathbf{q}}$$
halting motion safely without triggering uncontrolled motor shutoff.

---

### 3. Data Engine & Training Strategy

#### 3.1 Dataset Composition & Provenance Quarantine
To ensure full intellectual property ownership and commercial usability, PROBE-1 enforces a strict provenance quarantine policy:
* **Excluded / Quarantined:** Any dataset with Non-Commercial restrictions (e.g., CC-BY-NC 4.0 in Roboturk, DexYCB, or certain academic scrapes). These are isolated and forbidden from the foundation model pretraining pipeline.
* **Approved Pretraining Datasets:**
  1. *DROID (350 hrs):* Permissive CC-BY 4.0 dexterous manipulation trajectories.
  2. *Stanford Humanoid Everyday (80 hrs):* Permissive whole-body bipedal manipulation.
  3. *PhysicalAI-Robotics-GR00T-Teleop-G1 (1,000 episodes):* CC-BY 4.0 dual-arm Unitree G1 demonstrations.
  4. *Isaac Lab Synthetic Contact Suite (10,000 hrs equivalent):* First-party synthetic simulations generated with domain-randomized physical parameters (friction $\mu \in [0.1, 1.2]$, motor damping $\pm 30\%$, mass variations $\pm 25\%$).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       TRAINING DATA COMPOSITION MATRIX                      │
├─────────────────────┬──────────────┬───────────────┬────────────────────────┤
│ Modality Split      │ Hours / Ep.  │ License       │ Purpose                │
├─────────────────────┼──────────────┼───────────────┼────────────────────────┤
│ DROID               │ 350 Hours    │ CC-BY 4.0     │ Bi-manual Dexterity    │
│ Humanoid Everyday   │ 80 Hours     │ MIT / CC-BY   │ Whole-Body Locomotion  │
│ GR00T-Teleop-G1     │ 1,000 Ep.    │ CC-BY 4.0     │ Dual-Arm Teleoperation │
│ Synthetic Contact   │ 5,000 Hours  │ Proprietary   │ Dynamics & Impact Sim  │
│ Physical G1 In-House│ 200 Hours    │ Proprietary   │ Sim-to-Real Alignment  │
├─────────────────────┼──────────────┼───────────────┼────────────────────────┤
│ TOTAL ACTIVE POOL   │ 5,630 Hours  │ Commercially Clean                     │
└─────────────────────┴──────────────┴───────────────┴────────────────────────┘
```

#### 3.2 Four-Stage Progressive Training Regimen
1. **Stage 1: Multimodal Physical Autoencoding (MPA):**
   * Pretrains Tier 1 tokenizers and Tier 2 trunk via Masked Physical Autoencoding on 32x H100 GPUs.
   * $40\%$ random masking applied across visual patches, tactile shear vectors, and proprioceptive trajectories.
   * Forces the trunk to predict missing sensory modalities (e.g., predicting tactile contact forces solely from occluded wrist camera views and joint currents).
2. **Stage 2: Action-Conditioned World Model Pretraining:**
   * Trains Tier 3 predictive dynamics over synthetic and real trajectories.
   * Multi-step autoregressive loss predicting SDF changes and contact point reaction forces up to 50 steps into the future.
3. **Stage 3: Optimal Transport Flow Policy Training:**
   * Trains the 45M parameter DiT action expert on clean demonstration chunks using the OT-CFM loss.
   * Batch size 512, AdamW optimizer ($\text{lr} = 1 \times 10^{-4}$ with linear warmup and cosine decay).
4. **Stage 4: Sim-to-Real Bilateral Residual Adaptation:**
   * Policy weights frozen; fine-tunes a bilateral tactile residual adapter on physical Unitree G1 hardware.
   * Leverages 200 hours of in-house physical teleoperation to absorb residual motor friction, backlash, and latency variations.

---

### 4. Edge Hardware & System Latency Budget

#### 4.1 Deployment Hardware Configuration
* **Primary Humanoid Embodiment:** Unitree G1 humanoid (29 active DoF: 12 legs, 3 waist, 14 dual arms) equipped with bilateral DexH10 multi-fingered hands.
* **Secondary Transfer Platform:** Unitree H1 humanoid (23 active DoF: 10 legs, 3 waist, 10 arms).
* **Onboard Edge Compute:** NVIDIA Jetson Thor / Drive Thor SoC (Blackwell GPU architecture, 800 FP8 TFLOPS, 128 GB unified LPDDR5X memory) or dual RTX 4090 testbench.
* **Real-Time Communications Bus:** Real-time Linux kernel with `PREEMPT_RT` patch; EtherCAT master running at $1\text{ kHz}$ with hardware timestamping ($< 20\ \mu\text{s}$ jitter).

#### 4.2 End-to-End Latency & Frequency Budget

The total perception-to-action cycle is strictly budgeted to guarantee $100\text{ Hz}$ execution:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       REAL-TIME LATENCY BUDGET BREAKDOWN                    │
├───────────────────────────────┬────────────┬──────────────┬─────────────────┤
│ Pipeline Stage                │ Target P50 │ Target P95   │ Hard Deadline   │
├───────────────────────────────┼────────────┼──────────────┼─────────────────┤
│ Sensor Acquisition & DMA      │ 1.2 ms     │ 1.8 ms       │ 2.5 ms          │
│ Multimodal Tokenizer (Tier 1) │ 2.5 ms     │ 3.2 ms       │ 4.0 ms          │
│ MoE High-Level Trunk (Tier 2) │ 8.0 ms     │ 11.5 ms      │ 15.0 ms (10 Hz) │
│ DiT Flow Action Expert (Tier4)│ 5.5 ms     │ 7.2 ms       │ 8.5 ms (100 Hz) │
│ Predictive Safety QP (Tier 4B)│ 0.4 ms     │ 0.8 ms       │ 1.0 ms (Timeout)│
│ EtherCAT Bus Actuator Dispatch│ 0.3 ms     │ 0.5 ms       │ 0.8 ms          │
├───────────────────────────────┼────────────┼──────────────┼─────────────────┤
│ TOTAL END-TO-END PIPELINE     │ 17.9 ms    │ 25.0 ms      │ <= 30.0 ms      │
└───────────────────────────────┴────────────┴──────────────┴─────────────────┘
```

---

### 5. Benchmark Validation & Statistical Decision Protocol

PROBE-1's evaluation is governed by the 6 benchmark tracks established in [`05-benchmark-design.md`](file:///c:/projects/MemoryOS/research/PROBE-1/05-benchmark-design.md) and tested via the 9 experiments in [`07-experiment-plan.md`](file:///c:/projects/MemoryOS/research/PROBE-1/07-experiment-plan.md):

1. **Physical Perception (Track 1 / EXP-001):** 6-DoF pose estimation under visual occlusions ($\ge 35\%$ error reduction).
2. **Contact Dynamics (Track 2 / EXP-002):** Anticipatory slip prediction ($\ge 80\%$ precision, $\ge 75\%$ recall, $\ge 25\text{ ms}$ advance warning).
3. **Future-State Prediction (Track 3 / EXP-003):** 50-step predictive rollouts ($\text{NFPE} \le 0.150$).
4. **Dexterous Manipulation (Track 4 / EXP-004 & EXP-006):** Contact-rich multi-stage assembly ($\ge 85\%$ success).
5. **Dynamic Locomotion (Track 5 / EXP-005 & EXP-007):** Push recovery and cross-embodiment momentum transfer ($\ge 70\%$ success).
6. **Predictive Safety (Track 6 / EXP-008):** Hardware violation reduction ($\ge 60\%$ reduction with zero QP deadline overruns).
7. **Continual Learning (EXP-009):** One-shot mistake immunity ($\ge 85\%$) without catastrophic forgetting ($\le 3\%$).

#### Decisive Architecture Decision Rule (EXP-006)
* Candidate E (Hybrid World-Model + VLA) must outperform Candidate D (Pure Flow Policy) on at least 4 out of 5 physical manipulation tracks with $p < 0.01$ (McNemar test with Benjamini-Hochberg FDR correction over $N = 1,300$ paired physical trials) and P95 latency $\le 30.0\text{ ms}$.
* If Candidate E fails to meet these criteria, Candidate D is selected as the default runtime policy, and the world model is repurposed exclusively for synthetic data augmentation and offline trajectory filtering.

---

### 6. Implementation Roadmap & Milestones

The program spans a 16-week execution timeline:

```
Weeks 01-04: Phase I — Physical Perception & Tokenization Foundations
  ├─ Week 01: Multi-rate DMA pipeline & PREEMPT_RT Linux setup on Jetson Thor.
  ├─ Week 02: Masked Physical Autoencoder pretraining on DROID + GR00T-Teleop.
  ├─ Week 03: EXP-001 visual occlusion perception benchmark on Unitree G1.
  └─ Week 04: EXP-002 optical tactile slip prediction model integration.
  Deliverable: PROBE-1 Perception & Contact Tokenizer Checkpoint (v0.1).

Weeks 05-08: Phase II — Action-Conditioned Dynamics & World Modeling
  ├─ Week 05: Isaac Lab contact physics simulation suite generation (5k hours).
  ├─ Week 06: Tier 3 dynamics model training (SDF + normal force prediction).
  ├─ Week 07: EXP-003 NFPE multi-step prediction validation across horizons.
  └─ Week 08: Epistemic episodic memory vector index (HNSW/FAISS) integration.
  Deliverable: PROBE-1 Action-Conditioned Dynamics Model Checkpoint (v0.2).

Weeks 09-12: Phase III — Continuous Flow Control, Hierarchies & Sim-to-Real
  ├─ Week 09: 45M DiT Flow Matching action expert pretraining (OT-CFM).
  ├─ Week 10: EXP-004a flow vs. diffusion vs. ACT action generation benchmarks.
  ├─ Week 11: EXP-004b bilateral tactile residual adaptation on physical arms.
  └─ Week 12: EXP-005 hierarchical frequency sweep ($5\text{ Hz} / 200\text{ Hz}$ verification).
  Deliverable: PROBE-1 Real-Time Continuous Control Policy (v0.3).

Weeks 13-16: Phase IV — Full Benchmark Suite, Safety Certification & Decision
  ├─ Week 13: EXP-007 cross-embodiment momentum transfer tests (H1 -> G1).
  ├─ Week 14: EXP-008 predictive Control Barrier Function hardware gating.
  ├─ Week 15: EXP-009 continual learning and one-shot mistake immunity trials.
  └─ Week 16: EXP-006 decisive 1,300-trial Candidate E vs. D comparison.
  Deliverable: Final PROBE-1 Model Weights, Open Benchmark Suite, Technical Paper.
```

---

### 7. Failure Mode Analysis & Risk Mitigation Matrix

| Failure Mode | Root Cause | Impact | Technical Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Tactile Sensor Drift** | Temperature variations & elastomer fatigue | False slip predictions, improper grip force | Automatic baseline tare calibration on hand open; dual-stream differential optical shear tracking. |
| **World Model Hallucination** | Out-of-distribution physical contact geometries | Erroneous forward rollouts causing trajectory freeze | Calibrated uncertainty threshold ($\text{ECE} < 0.03$); fallback to Candidate D direct flow policy when epistemic variance $\sigma_k > \sigma_{\text{threshold}}$. |
| **QP Solver Timeout** | Ill-conditioned barrier Hessian during impact | Real-time deadline overrun ($> 1.0\text{ ms}$) | Warm-started active-set solver (ProxSuite); hard interrupt at $1.0\text{ ms}$ triggering deterministic safe joint impedance damping. |
| **Cross-Embodiment Instability** | Kinematic singularities & mass distribution errors | Uncontrolled bipedal fall during momentum transfer | Centroidal angular momentum regulation with Zero-Moment Point constraints projected into the physical support polygon. |
| **Overheating / Edge Throttling** | High GPU compute load on Jetson Thor | Frame dropping, latency spikes $> 50\text{ ms}$ | Active liquid cooling rig on physical testbed; INT8 / FP8 TensorRT model quantization with dedicated DMA engines. |

---

### 8. Conclusion & Sign-Off

The PROBE-1 Technical Proposal establishes a scientifically rigorous, mathematically grounded, and hardware-verified foundation for HOROS physical intelligence. By reconciling high-level multimodal semantic reasoning with 100 Hz continuous flow matching and independent microsecond-level safety verification, PROBE-1 addresses the core physical limitations of current robot foundation models and provides an empirical roadmap toward genuine humanoid autonomy.
