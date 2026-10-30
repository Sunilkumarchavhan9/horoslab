# HOROS First-Party Model Program: PROBE-1
## 05 — Benchmark Design, Evaluation Protocol & Empirical Test Suite

### Executive Summary & Empirical Charter
The objective of this benchmark specification is to establish a **reproducible, statistically rigorous experimental harness** capable of proving or disproving the performance of the five architecture candidates identified in `04-architecture-comparison.md`:
* **Candidate A:** Hierarchical VLA (Slow semantic planner + fast reactive controller)
* **Candidate B:** Action-Conditioned World Model (Future latent rollout & MPPI)
* **Candidate C:** Spatiotemporal Dynamics Model (Explicit neural contact surrogate)
* **Candidate D:** Continuous-Action Flow Policy (Optimal Transport flow matching)
* **Candidate E:** Hybrid World-Model + VLA (Co-trained forward prediction + action generation)

> **Core Research Rule:**
> **Do not assume Candidate E wins simply because it combines the other approaches.** Candidate E carries the highest training complexity and potential for negative gradient interference. The empirical data collected under this benchmark will independently determine which architecture delivers the highest physical reliability, lowest latency, and provable safety.

---

### Three Cardinal Rules Before Accepting Benchmark Results

1. **Rule 1 — Zero Sim-to-Real Equivalence Claim:**
   * Performance in Isaac Sim or MuJoCo **must never be reported or presented as equivalent to real-world humanoid performance**. Every task must be evaluated across isolated simulated environments and physical hardware twin cells, with sim-to-real transfer deltas explicitly quantified.
2. **Rule 2 — Full Latency Distribution Reporting (P50, P95, P99):**
   * Average latency is an invalid robotics metric. A 100 Hz control loop demands a hard **10.0 ms cycle budget**. Any system whose P99 latency exceeds 10.0 ms will drop control packets, destabilize bipedal balance, and fail the benchmark. Latency must be measured across the entire pipeline: sensor serialization $\to$ neural forward pass $\to$ safety filter $\to$ motor bus dispatch.
3. **Rule 3 — Independent Deterministic Safety Evaluation:**
   * Safety must be measured by an independent supervisor **outside the model's own predictions and representations**. A candidate cannot grade its own safety. If a hardware-enforced emergency stop (E-stop), joint torque limit, or Control Barrier Function (CBF) engages, the trial is logged as a safety intervention.

> **Hypothesis Disclaimer:**
> The proposed parameters—5 Hz high-level planner, 100 Hz action head, 200 Hz sensor processing, and 256-dimensional affordance latent interface—are **hypotheses to be empirically tested**, not dogma.

---

## 1. Six Benchmark Tracks

The benchmark organizes robot physical intelligence across six standardized tracks:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PROBE-1 BENCHMARK TRACK MATRIX                        │
├──────────────────────────┬──────────────────────────────────────────────────┤
│ Track 1: Perception      │ 3D bounding, 6-DoF pose, depth, scene estimation │
│ Track 2: Contact Phys    │ Contact normal, friction cone, slip prediction   │
│ Track 3: Future State    │ Action-conditioned rollout accuracy (10–50 steps)│
│ Track 4: Manipulation    │ Grasp stability, bi-manual kitting, tool use     │
│ Track 5: Locomotion      │ Bipedal balance, omnidirectional walk, impulses  │
│ Track 6: Safety          │ Zero constraint violations, CBF recovery, E-stop │
└──────────────────────────┴──────────────────────────────────────────────────┘
```

### Track 1: Physical Perception
* **Target:** Evaluate spatial and dynamic state estimation from multi-camera RGB-D and proprioceptive sensors under severe physical occlusions.
* **Scope:** 6-DoF object pose estimation, surface geometry reconstruction, and ego-velocity tracking during dynamic walking.

### Track 2: Contact Dynamics & Friction Modeling
* **Target:** Evaluate the model's ability to perceive, predict, and regulate physical contact events.
* **Scope:** Detection of initial contact touch, contact point localization, contact normal estimation, shear stress tracking, and incipient slip prevention before object drop.

### Track 3: Future-State Prediction
* **Target:** Quantify the accuracy of action-conditioned dynamics over multi-step prediction horizons ($H \in \{10, 25, 50\}$ steps).
* **Scope:** Predicting future proprioceptive states ($\hat{\mathbf{q}}_{t+H}, \hat{\dot{\mathbf{q}}}_{t+H}$), object trajectories, and collision boundary intersections given executed action chunks.

### Track 4: Dexterous & Bi-manual Manipulation
* **Target:** Assess fine-tolerance bi-manual physical coordination and tool manipulation on Unitree G1 dexterous hands.
* **Scope:** Dynamic in-hand object reorientation, peg-in-hole assembly (1.0 mm and 0.5 mm tolerances), flexible cable threading, and dual-arm box carrying.

### Track 5: Whole-Body Locomotion & Disturbance Rejection
* **Target:** Evaluate dynamic bipedal stability, gait fluency, and recovery from unexpected external force impulses on Unitree H1/G1 platforms.
* **Scope:** Omnidirectional walking ($1.0–1.8$ m/s), stair climbing, walking on low-friction surfaces ($\mu \le 0.25$), and recovering from lateral torso pushes ($\ge 120\text{ N}\cdot\text{s}$).

### Track 6: Safety & Verifiability
* **Target:** Measure physical hardware self-protection and boundary adherence under severe out-of-distribution distribution shifts and adversarial disturbances.
* **Scope:** Motor torque limit violations, joint kinematic range exceedances, self-collision occurrences, and autonomous recovery success rates without human resets.

---

## 2. Measurable Metrics Definition

Every benchmark run logs a standardized telemetry record measuring five metric categories:

### 2.1 Perception Metrics
1. **Object 6-DoF Pose Error:**
   * Translation Error: $e_{\text{trans}} = \|\mathbf{t}_{\text{pred}} - \mathbf{t}_{\text{gt}}\|_2$ (in mm).
   * Rotation Error: $e_{\text{rot}} = \arccos \left( \frac{\text{Tr}(\mathbf{R}_{\text{pred}}^T \mathbf{R}_{\text{gt}}) - 1}{2} \right)$ (in degrees).
2. **Proprioceptive State Estimation Error:** Root Mean Squared Error (RMSE) across all active joint angles and velocities against calibrated optical mocap (Vicon/OptiTrack).
3. **Temporal Consistency Metric:** Jitter penalty quantified by average second-order finite difference:
   $$\sigma_{\text{jitter}} = \frac{1}{T} \sum_{t=2}^{T-1} \|\mathbf{x}_{t+1} - 2\mathbf{x}_t + \mathbf{x}_{t-1}\|_2$$

### 2.2 Physical Dynamics & Contact Metrics
1. **Contact Precision & Recall:** Precision and recall of binary contact detection against ground-truth force thresholds ($F_N \ge 1.0\text{ N}$).
2. **Contact Normal Angular Error:** Angular deviation $\theta_{\text{normal}} = \arccos(\hat{\mathbf{n}}_{\text{pred}} \cdot \mathbf{n}_{\text{gt}})$ (in degrees).
3. **Slip Prediction Lead Time:** Time (in ms) between predicted slip warning and actual physical slip onset ($\Delta t_{\text{lead}} \ge 20$ ms target).
4. **Future-State Rollout Error:** Normalized trajectory error over $H$-step prediction horizon:
   $$\text{FPE}(H) = \frac{1}{H} \sum_{k=1}^H \frac{\|\hat{\mathbf{s}}_{t+k} - \mathbf{s}_{t+k}\|_2}{\|\mathbf{s}_{t+k}\|_2 + \epsilon}$$

### 2.3 Manipulation & Locomotion Metrics
1. **Task Success Rate ($R_{\text{task}}$):** Binary completion rate across $N \ge 50$ randomized evaluation trials.
2. **Task Completion Time ($T_{\text{task}}$):** Time (in seconds) from initial command to verified goal state.
3. **Grasp Stability Metric ($G_{\text{stab}}$):** Percentage of trial duration where target object remains firmly clamped within the friction cone without micro-slip ($< 1$ mm displacement).
4. **Disturbance Recovery Rate ($R_{\text{recovery}}$):** Percentage of external impulse shoves successfully absorbed without the bipedal base falling or losing foot contact traction.
5. **Fall & Collision Count:** Total count of unauthorized ground contact events (torso/knee touching ground) or environment collisions.

### 2.4 Inference & Control Metrics
1. **End-to-End Latency ($\tau_{\text{e2e}}$):** Wall-clock time from camera sensor photon arrival to motor CAN bus torque packet dispatch.
2. **Latency Distribution:** Full profile logging **P50 (Median)**, **P95**, and **P99 (Tail)** latencies over $10^5$ continuous cycles.
3. **Control Execution Frequency ($f_{\text{hz}}$):** Effective sustained frequency of low-level motor packet generation (target: $\ge 100\text{ Hz}$).
4. **Hardware Compute Footprint:** Peak GPU VRAM utilization (GB), average GPU power draw (Watts), and compute FLOP utilization (MFU %).

### 2.5 Safety & Constraint Metrics
1. **Safety Constraint Violations ($N_{\text{violation}}$):** Total count of instances where commanded joint commands violate kinematic limits or self-collision envelopes.
2. **Torque Limit Saturation Ratio ($S_{\boldsymbol{\tau}}$):** Fraction of execution time where joint torques exceed 90% of motor continuous thermal rating.
3. **Emergency-Stop Activation Count ($N_{\text{E-stop}}$):** Count of automated hardware-level E-stops triggered by safety boundary trips.
4. **Safe Autonomous Recovery Rate ($R_{\text{safe}}$):** Percentage of aborted or failed tasks where the robot safely returns to a stable home stance without falling or dropping tools.

---

## 3. Candidate-Specific Experimental Protocol

The benchmark subjects all five candidates to identical evaluation splits and hardware environments:

| Candidate | Target Hypothesis Tested | Primary Baseline Implementation | Key Failure Condition |
| :--- | :--- | :--- | :--- |
| **A: Hierarchical VLA** | Decoupling 5 Hz planner from 100 Hz controller enables stable dexterity | OpenVLA-7B (Planner) + MLP-Mixer Policy | Low-level policy divergence due to stale high-level latent goals |
| **B: World Model** | Latent action-conditioned rollouts yield superior zero-shot planning | DreamerV3 RSSM / UniSim Diffusion Predictor | Compounding rollout hallucinations; rollout time exceeds cycle budget |
| **C: Dynamics Model** | Explicit contact mechanics estimation prevents grasping slip and falls | ContactNets + Deep Whole-Body RL Controller | Inability to generalize to novel visual objects or natural language tasks |
| **D: Flow Policy** | Continuous optimal transport flow matching generates fluid trajectories | π0 open-reproduction / Flow Matching Action Head | Trajectory collisions into dynamic obstacles not present in demo data |
| **E: Hybrid** | Co-training world model with flow policy delivers foresight + dexterity | Unified Causal Trunk + Flow Head + Rollout Head | Gradient conflict during training; compute saturation on edge hardware |

---

## 4. The Six Core Empirical Experiments

### EXP-001 — Perception Baseline: Multimodal Physical State Estimation
* **Objective:** Determine which sensory modality combinations provide the lowest state-estimation error during high-vibration humanoid walking.
* **Dataset & Split:** DROID + Humanoid Everyday + HOROS physical testbed logs (70% train / 15% validation / 15% held-out test split).
* **Setup:** Physical Unitree G1 humanoid walking across a $10\text{ m}$ indoor path tracked with Vicon optical motion capture (millimeter ground truth).
* **Metrics:** 6-DoF base pose RMSE, joint angle RMSE, and latency distribution.
* **Ablations:**
  * Vision only (Dual stereo RGB).
  * Vision + Depth (RGB-D).
  * Vision + Proprioception + Pelvis IMU.
  * Vision + Proprioception + IMU + Tactile (Complete suite).
* **Success Criteria:** State estimation error $\le 5$ mm translation and $\le 1.5^\circ$ orientation at P95 latency $< 5.0$ ms.

---

### EXP-002 — Contact Prediction: Learned Contact & Slip Modeling
* **Objective:** Compare learned contact normal prediction, friction cone margins, and slip anticipation against baseline physics simulators.
* **Dataset & Split:** Curated contact episodes from Isaac Sim Contact Suite + HOROS tactile test cell (50,000 contact press sequences).
* **Setup:** Unitree dexterous hand grasping 20 everyday objects (metallic cylinders, smooth glass, deformable sponge, raw eggs) with ATI load cell verification.
* **Metrics:** Contact normal angular error ($\theta_{\text{normal}}$), slip anticipation lead time ($\Delta t_{\text{lead}}$), and object drop rate.
* **Ablations:**
  * Model without tactile inputs (Vision + joint currents only).
  * Model with binary contact switches.
  * Model with high-density optical tactile sensing (GelSight / DIGIT).
* **Success Criteria:** Slip anticipation detected $\ge 25$ ms prior to physical slip; zero broken fragile objects.

---

### EXP-003 — Future-State Prediction: Action-Conditioned Rollout Accuracy
* **Objective:** Directly compare Candidate B (World Model), Candidate C (Dynamics Model), and Candidate E (Hybrid) on multi-step trajectory prediction.
* **Dataset & Split:** 20,000 multi-step manipulation trajectories from DROID and Humanoid Everyday.
* **Setup:** Roll out predictions over $H \in \{10, 25, 50\}$ steps ($0.2\text{s}, 0.5\text{s}, 1.0\text{s}$) given ground-truth initial state and action sequences.
* **Metrics:** Future-State Rollout Error (FPE), collision boundary intersection accuracy, and inference execution time per step.
* **Failure Condition:** FPE divergence $> 35\%$ over 25 steps, or forward rollout latency $> 20$ ms per step.

---

### EXP-004 — Continuous Action Generation: Flow Matching vs. Diffusion vs. Discretization
* **Objective:** Compare continuous flow matching (Candidate D) against discrete tokenization (OpenVLA style) and multi-step diffusion (Diffusion Policy style).
* **Dataset & Split:** 1,000 episodes of GR00T Teleop G1 bi-manual fruit-picking demonstrations.
* **Setup:** Real-world Unitree G1 executing bi-manual pick, hand-off, and slot-insertion tasks.
* **Metrics:** Task success rate ($R_{\text{task}}$), path smoothness metric ($\sigma_{\text{jitter}}$), and end-to-end P99 latency.
* **Ablations:**
  * Discrete Action Head (256 bins per dimension).
  * Diffusion Policy Head (16 DDIM denoising steps).
  * Flow Matching Head (1, 2, 4, and 8 Euler integration steps).
* **Success Criteria:** Flow matching achieves $\ge 85\%$ task success with P99 latency $< 10.0$ ms (satisfying the 100 Hz control budget).

---

### EXP-005 — Hierarchical Control: Planner vs. Controller Frequency Sweeps
* **Objective:** Empirically validate or disprove the hypothesized 5 Hz planner / 100 Hz controller hierarchy.
* **Dataset & Split:** Whole-Body Loco-Manipulation Suite in Isaac Lab (10,000 runs) and Physical Twin Cell (50 runs).
* **Setup:** Humanoid walking toward a table, picking up a heavy container, turning, and placing on a high shelf under external disturbances.
* **Metrics:** Task completion time, fall count, stability margin, and communication bandwidth.
* **Sweep Variations:**
  * Monolithic 5 Hz (No hierarchy; pure OpenVLA style).
  * Monolithic 20 Hz.
  * Hierarchical: 2 Hz Planner $\to$ 50 Hz Controller.
  * Hierarchical: **5 Hz Planner $\to$ 100 Hz Controller (Hypothesized)**.
  * Hierarchical: 10 Hz Planner $\to$ 200 Hz Controller.
* **Success Criteria:** Identify the exact Pareto-optimal frequency pair that maximizes stability while minimizing compute power draw.

---

### EXP-006 — Hybrid Architecture: Does Co-Training Prediction with Action Generation Win?
* **Objective:** The critical research question: Does Candidate E (Hybrid World-Model + VLA) outperform Candidate D (Pure Flow Policy) on physical tasks?
* **Setup:** Evaluate Candidates A, B, C, D, and E across the 50 standardized challenge tasks, including novel out-of-distribution physical obstacles.
* **Test Protocol:**
  * Task 1–25: Familiar in-distribution manipulation (fruit picking, door opening).
  * Task 26–40: Novel object geometry and low-friction contact (ice, oil on surface).
  * Task 41–50: Dynamic obstacle intrusion and sudden payload drop during locomotion.
* **Metrics:** Overall PROBE-1 Comprehensive Score ($S_{\text{PROBE}}$), out-of-distribution generalization delta, and safe intervention count.
* **Success Criteria:** Candidate E must demonstrate a statistically significant gain ($\ge 12\%$ higher success rate, $p < 0.01$) over Candidate D to justify its $3\times$ higher training compute and dual-head complexity. If Candidate E does not beat Candidate D by this margin, **Candidate D is selected as the winning architecture**.

---

## 5. Comprehensive Benchmark Scoring Formula

To combine multi-dimensional physical performance into a single objective scalar for candidate ranking, the **PROBE-1 Comprehensive Benchmark Index ($S_{\text{PROBE}}$)** is computed as:

$$S_{\text{PROBE}} = w_1 R_{\text{task}} + w_2 (1 - \hat{e}_{\text{force}}) + w_3 R_{\text{recovery}} + w_4 F_{\text{latency}} + w_5 S_{\text{safety}}$$

Where weights are normalized ($\sum w_i = 1.0$):
* $w_1 = 0.35$ (Task Success Rate $R_{\text{task}} \in [0, 1]$).
* $w_2 = 0.20$ (Normalized Contact Force Error: penalizes excessive force spikes above $25\text{ N}$).
* $w_3 = 0.20$ (Disturbance Recovery Rate: successful bipedal balance maintenance).
* $w_4 = 0.15$ (Latency Compliance Factor):
  $$F_{\text{latency}} = \max\left(0, 1.0 - \frac{\max(0, \tau_{\text{P99}} - 10.0\text{ ms})}{10.0\text{ ms}}\right)$$
  *(Drops to 0.0 if P99 latency exceeds 20.0 ms).*
* $w_5 = 0.10$ (Independent Safety Compliance: 1.0 if zero uncontained E-stops occurred, 0.0 otherwise).

---

## 6. Hardware Infrastructure & Reproducibility Protocol

All benchmark experiments adhere to the following reproducibility mandate:

1. **Evaluation Hardware Standards:**
   * **Simulation Cluster:** 8x NVIDIA H100 SXM5 (80GB) nodes running Isaac Sim 4.2 / Isaac Lab with locked PhysX 5 sub-step integration ($dt = 0.005\text{ s}$).
   * **Physical Robot Edge Hardware:** Onboard NVIDIA Jetson Thor / Drive Thor (or dual RTX 4090 workstation node) connected to Unitree G1 via isolated EtherCAT / CAN-FD real-time bus running PREEMPT_RT Linux kernel.
2. **Statistical Significance Standards:**
   * Minimum **5 random seeds** per simulation experiment ($N \ge 1,000$ episodes per seed).
   * Minimum **20 trials** per physical hardware benchmark task ($N \ge 100$ total physical trials).
   * All reported metrics must include **95% bootstrap confidence intervals** ($\pm \text{CI}_{95}$).
3. **Data Logging Contract:**
   * Every execution step logs raw sensory buffers, commanded torques, predicted latents, and execution timestamps directly to immutable Parquet telemetry streams signed with cryptographic SHA-256 commit hashes.
