# HOROS PROBE-1 — Research-002
# Benchmark Task Protocol & Experimental Design Freeze

**Document ID:** HOROS-PROBE1-R002-DOC-04  
**Project:** HOROS PROBE-1 — Humanoid Robotics  
**Topic:** Trustworthy Action-Conditioned Contact World Models  
**Status:** Step 1 Task Protocol Formally Frozen  
**Author:** HOROS Research Team  

---

## 1. Protocol Purpose & Freezing Mandate

In accordance with Section 11, Step 4 of Research Charter v0.1, this document formally freezes the experimental task specifications, physics parameter distributions, action representations, dataset splits, and quantitative evaluation metrics for Phase 1 of HOROS PROBE-1 Research-002.

**Freezing Rule:** No hyperparameter, task geometry, or evaluation protocol specified herein may be altered during baseline benchmarking without an explicit charter revision increment (v0.2). This eliminates research degrees of freedom and guarantees defensible peer-review repeatability.

---

## 2. Frozen Minimum Pair Tasks

To rigorously isolate contact-mode transitions under optimizing planner search, Phase 1 evaluates exactly two complementary, high-impact manipulation tasks:

```
┌──────────────────────────────────────────────┬──────────────────────────────────────────────┐
│ Task 1: Precision Peg-in-Hole Insertion      │ Task 2: Multifingered Grasp & Dynamic Lift   │
├──────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ • Focus: Constrained rigid-body contact      │ • Focus: Nonstationary frictional contact    │
│ • Key Phenomena: Impact, wedging, jamming    │ • Key Phenomena: Incipient slip, stick-slip  │
│ • Embodiment: 7-DoF Franka Emika Panda       │ • Embodiment: 16-DoF Allegro Hand + Arm      │
│ • Primary Danger: Excessive contact wrench   │ • Primary Danger: Slip, torque breach, drop  │
└──────────────────────────────────────────────┴──────────────────────────────────────────────┘
```

---

### Task 1: Precision Peg-in-Hole Insertion

#### 1. Kinematic & Physical Setup
- **Robot Arm:** 7-DoF Franka Emika Panda with Robotiq 2F-85 or parallel rigid gripper holding the peg.
- **Hole Fixture:** Rigidly mounted base with circular, square, and hexagonal hole inserts.
- **Nominal Dimensions:**
  - Peg length: $L = 80\,\text{mm}$, nominal radius $r = 15.0\,\text{mm}$.
  - Hole depth: $D = 60\,\text{mm}$.
  - Clearance tolerance: nominal $\delta = 0.5\,\text{mm}$ (tight fit).
- **Physical Contact Regimes:**
  1. $\Sigma_0$ (**Free Space**): Peg tip above hole fixture ($z > z_{\text{rim}}$).
  2. $\Sigma_1$ (**Impact / Contact Onset**): First contact event with hole chamfer or rim.
  3. $\Sigma_2$ (**One-Point Chamfer Sliding**): Peg tip sliding down the chamfer slope.
  4. $\Sigma_3$ (**Two-Point Wedging**): Peg tip and body simultaneously contact opposite sides of the hole wall.
  5. $\Sigma_4$ (**Full Seating / Jamming**): Deep insertion ($z \ge D - 5\,\text{mm}$) under friction or premature force lock.

#### 2. Action Representation & Controller
- **Control Mode:** Cartesian Operational Space Impedance Control at $50\,\text{Hz}$ ($\Delta t = 20\,\text{ms}$).
- **Action Vector:**
  $$\mathbf{a}_t = \left[ \Delta x, \Delta y, \Delta z, \Delta \theta_x, \Delta \theta_y, \Delta \theta_z \right]^T \in \mathbb{R}^6$$
  where $\|\Delta \mathbf{x}\| \le 5.0\,\text{mm}$ and $\|\Delta \boldsymbol{\theta}\| \le 2.0^\circ$ per step.

#### 3. State & Observation Channels ($s_t$)
- Proprioception: Joint positions $q_t \in \mathbb{R}^7$, joint velocities $\dot{q}_t \in \mathbb{R}^7$.
- Tool Center Point (TCP): Cartesian pose $\mathbf{x}_{\text{tcp}} \in \mathrm{SE}(3)$, linear/angular velocity $\mathbf{v}_{\text{tcp}} \in \mathbb{R}^6$.
- Contact Wrench: Wrist 6-axis Force/Torque sensor $\mathbf{W}_t = [F_x, F_y, F_z, \tau_x, \tau_y, \tau_z]^T \in \mathbb{R}^6$ sampled at $1000\,\text{Hz}$, filtered to $50\,\text{Hz}$.
- Simulator Ground Truth: True peg pose relative to hole frame, contact manifold label $\Sigma_k \in \{0, 1, 2, 3, 4\}$.

#### 4. Episode Termination & Safety Thresholds
- **Success:** Insertion depth $z_{\text{peg}} \ge 50\,\text{mm}$ with $\|F_{\text{lateral}}\| \le 10\,\text{N}$.
- **Safety Violation / Jamming:** Contact normal force $\|\mathbf{F}_{\text{contact}}\| > 40.0\,\text{N}$ or lateral wrench $\|\boldsymbol{\tau}\| > 8.0\,\text{N}\cdot\text{m}$.
- **Timeout:** Maximum 200 control steps ($4.0\,\text{seconds}$).

---

### Task 2: Multifingered Grasp-and-Lift under Changing Friction

#### 1. Kinematic & Physical Setup
- **Manipulator:** 16-DoF Allegro Hand (4 fingers $\times$ 4 joints) mounted on Franka Panda arm.
- **Fingertips:** Equipped with simulated compliant hemispherical tactile sensor pads ($E = 2.5\,\text{MPa}$, Poisson ratio $\nu = 0.45$).
- **Manipulated Objects:** Cylindrical bottle ($r = 35\,\text{mm}, h = 120\,\text{mm}$) and rectangular block ($60 \times 60 \times 120\,\text{mm}$).
- **Physical Contact Regimes:**
  1. $\Sigma_0$ (**Pre-grasp Free Motion**): Fingertips moving toward object surface.
  2. $\Sigma_1$ (**Touchdown / Contact Onset**): Tactile normal force exceeds detection threshold ($F_n > 0.05\,\text{N}$).
  3. $\Sigma_2$ (**Stable Sticking Grasp**): Normal pre-load established ($F_n \in [2.0, 8.0]\,\text{N}$), tangential force inside Coulomb friction cone ($\|F_t\| < \mu F_n$).
  4. $\Sigma_3$ (**Dynamic Lift / Tangential Shear**): Upward acceleration; gravity induces rapid tangential shear load $\Delta F_t$.
  5. $\Sigma_4$ (**Incipient Slip**): Boundary taxels exhibit localized displacement while central contact point sticks.
  6. $\Sigma_5$ (**Gross Slip / Drop**): Relative velocity between fingertip and object surface exceeds $10\,\text{mm/s}$; object drops.

#### 2. Action Representation & Controller
- **Control Mode:** Joint position delta commands for 16 Allegro joints + 3 arm Cartesian velocities at $50\,\text{Hz}$.
- **Action Vector:**
  $$\mathbf{a}_t = \left[ \Delta \theta_{1:16}^{\text{hand}}, \Delta x_{\text{arm}}, \Delta y_{\text{arm}}, \Delta z_{\text{arm}} \right]^T \in \mathbb{R}^{19}$$
  clamped to max joint delta $|\Delta \theta_i| \le 0.05\,\text{rad}$ per step.

#### 3. State & Observation Channels ($s_t$)
- Proprioception: Hand joint angles $\theta \in \mathbb{R}^{16}$, fingertip Cartesian positions $\mathbf{p}_{\text{tip}}^{(1:4)} \in \mathbb{R}^{12}$.
- Tactile Arrays: 4 fingertip taxel arrays (e.g., $16 \times 16$ normal strain + shear vectors).
- Object Ground Truth: 6-DoF pose $\mathbf{T}_{\text{obj}} \in \mathrm{SE}(3)$, linear/angular velocity $\mathbf{v}_{\text{obj}} \in \mathbb{R}^6$.
- Contact Mode: Ground truth contact classification per finger $\Sigma_k^{(1:4)} \in \{0, 1, 2, 3, 4, 5\}$.

#### 4. Episode Termination & Safety Thresholds
- **Success:** Object lifted to height $z_{\text{lift}} \ge 100\,\text{mm}$ and held stably for $1.0\,\text{second}$ without gross slip.
- **Safety Violation / Crush:** Fingertip normal force $F_n^{(i)} > 25.0\,\text{N}$ (crush damage) or object dropped ($z_{\text{obj}} < z_{\text{table}} + 10\,\text{mm}$ after lift began).
- **Timeout:** Maximum 250 control steps ($5.0\,\text{seconds}$).

---

## 3. Physical Randomization & Data Regimes

To strictly prevent data leakage and evaluate real-world physical generalization, datasets are divided into four distinct distributions:

| Distribution Regime | Friction Coefficient ($\mu$) | Object Mass ($M$) | Center of Mass Offset | Surface Compliance ($K_p$) | Clearance $\delta$ (Peg) | Actuator Delay ($\tau$) | Episode Count |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. In-Distribution (ID Train)** | $[0.40, 0.70]$ | $[0.25, 0.45]\,\text{kg}$ | Nominal ($\pm 2\,\text{mm}$) | $1.0 \times \text{nominal}$ | $0.50\,\text{mm} \pm 0.1$ | $10\,\text{ms}$ (1 step) | **10,000 episodes** |
| **2. In-Distribution (ID Val/Test)** | $[0.40, 0.70]$ (Held-out seeds) | $[0.25, 0.45]\,\text{kg}$ | Nominal ($\pm 2\,\text{mm}$) | $1.0 \times \text{nominal}$ | $0.50\,\text{mm} \pm 0.1$ | $10\,\text{ms}$ | **1,000 episodes** |
| **3. Physical OOD (Friction Shift)** | $[0.10, 0.25]$ (Low) / $[0.85, 1.30]$ (High) | $[0.10, 0.80]\,\text{kg}$ | Extreme ($\pm 15\,\text{mm}$) | $[0.4, 2.5] \times \text{nominal}$ | $[0.15, 1.20]\,\text{mm}$ | $20\text{–}40\,\text{ms}$ | **1,000 episodes** |
| **4. Transition-Stress (Critical)** | $[0.20, 0.80]$ | $[0.20, 0.60]\,\text{kg}$ | Targeted at boundary | Non-linear restitution | Critical wedge zone | Variable jitter | **1,000 episodes** |
| **5. Planner-Selected (Search)** | Evaluated during online CEM / MPPI search against candidate world models | — | — | — | — | — | **1,000 episodes** |

*Leakage Prevention Mandate:* Episode seeds and object geometry meshes are partitioned strictly at the configuration level. No frame from a training trajectory appears in validation or test sets.

---

## 4. Evaluated Baseline Models & Architectures

All baselines operate on identical observation sequences $(s_{t-K:t}, a_{t-K:t-1})$ and predict future horizon $H \in \{1, 3, 5, 10, 20, 48\}$:

1. **Baseline B1: Deterministic MLP/GRU Dynamics Model**
   - Point prediction $\hat{s}_{t+k} = f_\theta(s_t, a_t)$. Loss: $\mathcal{L} = \|s_{t+k} - \hat{s}_{t+k}\|_2^2$.
2. **Baseline B2: Heteroscedastic Gaussian Model (Probabilistic Single Head)**
   - Predicts mean and diagonal covariance $\hat{s}_{t+k} \sim \mathcal{N}(\boldsymbol{\mu}_\theta, \operatorname{diag}(\boldsymbol{\sigma}_\theta^2))$. Loss: Gaussian Negative Log-Likelihood (NLL).
3. **Baseline B3: Bootstrapped Deep Ensemble (Li et al., 2025/2026 Style)**
   - Ensemble of $E=5$ independently initialized networks. Epistemic uncertainty measured via ensemble variance:
     $$\sigma_{\text{ens}}^2(s, a) = \frac{1}{E}\sum_{e=1}^E \|\boldsymbol{\mu}_e(s, a) - \bar{\boldsymbol{\mu}}(s, a)\|^2$$
4. **Baseline B4: Contact-Stratified Conformalized Ensemble (CaPTURe Style)**
   - Particle spread with non-conformity calibration conditioned on active contact mode $\Sigma_k$. Outputs valid $(1-\alpha)$ confidence region.
5. **Proposed Framework: HOROS PROBE-1 Trustworthy Contact World Model**
   - Contact-Stratified Conformalized Ensembles + Epistemic Uncertainty Penalties + Downstream **Predictive Control Barrier Function (p-CBF)** runtime safety filter.

---

## 5. Frozen Evaluation Metrics

### 5.1 Multi-Step Prediction Fidelity
- **State RMSE:**
  $$\operatorname{RMSE}_x(H) = \sqrt{\frac{1}{N H} \sum_{i=1}^N \sum_{k=1}^H \|\mathbf{x}_{t+k}^{(i)} - \hat{\mathbf{x}}_{t+k}^{(i)}\|_2^2}$$
- **Contact Wrench RMSE:** $\operatorname{RMSE}_F(H)$ evaluated specifically for normal force $F_n$ and tangential force $F_t$.
- **Contact Transition F1-Score:** Harmonic mean of precision and recall on predicting discrete contact stratum transitions $\Sigma_i \rightarrow \Sigma_j$.

### 5.2 Uncertainty Calibration Quality
- **Stratified Expected Calibration Error (ECE):**
  $$\operatorname{ECE}(\Sigma_k) = \sum_{b=1}^B \frac{|B_b|}{N_k} \left| \operatorname{acc}(B_b) - \operatorname{conf}(B_b) \right|$$
  computed separately for each contact stratum $\Sigma_k$.
- **Empirical Coverage Error:**
  $$\Delta_{\text{cov}}(\alpha, \Sigma_k) = \left| (1 - \alpha) - \frac{1}{N_k} \sum_{i \in \Sigma_k} \mathbb{I}\left( s_{t+1}^{(i)} \in \hat{\mathcal{C}}_{1-\alpha}(s_t, a_t) \right) \right|$$

### 5.3 Planner Exploitation & Closed-Loop Performance
- **Planner Exploitation Gap (PEG):**
  $$\operatorname{PEG} = \mathbb{E}_{\boldsymbol{\tau} \sim \pi_{\text{CEM}}^{\hat{M}}} \left[ J_{\hat{M}}(\boldsymbol{\tau}) \right] - \mathbb{E}_{\boldsymbol{\tau} \sim \pi_{\text{CEM}}^{\hat{M}}} \left[ J_{\text{Simulator}}(\boldsymbol{\tau}) \right]$$
  Measures how severely the optimizing planner overestimates the true physical reward/cost.
- **Safety Violation Rate (SVR):**
  $$\operatorname{SVR} = \frac{\text{Episodes with } \|\mathbf{F}\| > F_{\max} \text{ or drop/jam}}{\text{Total Episodes}} \times 100\%$$
- **Closed-Loop Task Success Rate (SR%):** Percentage of test episodes reaching successful seating or stable lift within timeout.

