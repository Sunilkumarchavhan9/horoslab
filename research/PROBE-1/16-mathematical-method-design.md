# PROBE-1 Mathematical Methodology & Experimental Design
**HOROS First-Party Model Program: Physical Humanoid Foundation Architecture**  
**Document ID:** HOROS-PROBE1-16-MATHEMATICAL-METHOD-DESIGN  
**Creation Date:** October 31, 2026  
**Status:** Authoritative Mathematical Specification & Experimental Blueprint  
**Parent Document:** [`research/PROBE-1/15-primary-contribution-selection.md`](file:///c:/projects/MemoryOS/research/PROBE-1/15-primary-contribution-selection.md)  

---

## Executive Summary & Engineering Objective

This document formalizes the complete mathematical methodology, algorithmic architecture, and reproducible experimental protocols for **HOROS PROBE-1**. In accordance with the charter established in Document 15, the research focuses on:

> **Core Research Question:**  
> *Can a multifingered robot estimate changing contact stability and its predictive uncertainty from synchronized tactile and proprioceptive observations, and adapt finger forces through a robust predictive safety controller when surface friction, payload mass, and center of mass change simultaneously during dynamic object manipulation?*

To transition this question into a defensible scientific contribution, this specification resolves five foundational mathematical and engineering challenges:
1. **Action-Dependent Contact Dynamics:** Deriving the explicit mapping from candidate joint actuation commands $\mathbf{u}_k$ to predicted future contact wrenches $\mathbf{f}_{c, i}(k+1)$ and stability states through multi-body contact kinematics.
2. **Conformal Uncertainty Quantification under Distribution Shift:** Formulating an epistemic deep ensemble estimator calibrated via Conformalized Quantile Regression (CQR) with non-exchangeable adaptive temporal coverage for sequential robotic time-series.
3. **Robust Discrete-Time Predictive Control Barrier Functions (p-CBF):** Formulating a set-theoretic safety filter guaranteeing friction-cone adherence and crush-force avoidance over uncertainty bounding sets.
4. **Optimization Formulation Analysis (QP vs. SOCP):** Establishing the formal mathematical equivalence, conservatism trade-offs, and solve-time characteristics between Second-Order Cone Programs (SOCP) and polyhedral Quadratic Programs (QP).
5. **Deterministic Real-Time Execution:** Specifying a sub-millisecond active-set QP solver architecture with hard hardware interrupts, watchdog timers, and provably passive impedance fallbacks on the **Isaac Lab v2.3 / Isaac Sim 5.1 (TacSL)** simulation stack and physical multi-finger hardware.

---

## 16.1 Formal Problem Definition and Notation

### Notation Conventions
* Vectors are denoted in bold lowercase ($\mathbf{x}, \mathbf{u}, \mathbf{q}$); matrices in bold uppercase ($\mathbf{M}, \mathbf{J}, \mathbf{W}$).
* Subscript $k \in \mathbb{N}$ denotes discrete time steps with sampling interval $\Delta t = 10\text{ ms}$ ($100\text{ Hz}$).
* Index $i \in \{1, \dots, M\}$ indexes the $M$ active robotic fingertips (contacts).
* Hat $\hat{(\cdot)}$ denotes an estimated or predicted quantity; tilde $\tilde{(\cdot)}$ denotes estimation error.
* $[\cdot]_N$ and $[\cdot]_T$ denote normal scalar and 2D tangential shear force projections relative to the local contact frame.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             SYSTEM STATE & PARAMETER LEDGER                 │
├──────────────────────┬─────────────┬────────────┬───────────────────────────┤
│ Variable             │ Dimension   │ Source     │ Definition                │
├──────────────────────┼─────────────┼────────────┼───────────────────────────┤
│ q_k, \dot{q}_k       │ R^{n_q}     │ Measured   │ Joint positions & vel.    │
│ \tau_{meas, k}       │ R^{n_q}     │ Measured   │ Joint actuator torques    │
│ I_{tact, i, k}       │ R^{H x W x 3│ Measured   │ Optical tactile image (i) │
├──────────────────────┼─────────────┼────────────┼───────────────────────────┤
│ v_{o, k}, \omega_{o,k│ R^3, R^3    │ Estimated  │ Object linear & ang. vel. │
│ p_{c, i, k}          │ R^3         │ Kinematics │ Contact point spatial pos.│
│ n_{c, i, k}          │ R^3         │ Estimated  │ Contact surface normal    │
├──────────────────────┼─────────────┼────────────┼───────────────────────────┤
│ \mu_{i, k}           │ R           │ Estimated  │ Friction coefficient (i)  │
│ m_{o, k}             │ R           │ Estimated  │ Object mass               │
│ c_{o, k}             │ R^3         │ Estimated  │ Object Center of Mass     │
│ I_{o, k}             │ R^{3 x 3}   │ Estimated  │ Object inertia tensor     │
├──────────────────────┼─────────────┼────────────┼───────────────────────────┤
│ u_k                  │ R^{n_q}     │ Control    │ Commanded joint accel. \ddot{q}│
└──────────────────────┴─────────────┴────────────┴───────────────────────────┘
```

The composite physical state $\mathbf{x}_k$ and time-varying environmental parameter vector $\boldsymbol{\theta}_k$ are:
$$\mathbf{x}_k = \left[ \mathbf{q}_k, \, \dot{\mathbf{q}}_k, \, \mathbf{v}_{o, k}, \, \boldsymbol{\omega}_{o, k}, \, \mathbf{z}_{c, k} \right]^T \in \mathcal{X} \subset \mathbb{R}^{2n_q + 6 + d_c}$$
$$\boldsymbol{\theta}_k = \left[ \mu_1, \dots, \mu_M, \, m_o, \, \mathbf{c}_o^T, \, \text{vec}(\mathbf{I}_o)^T \right]^T \in \Theta \subset \mathbb{R}^{M + 1 + 3 + 9}$$
where $\mathbf{z}_{c, k}$ denotes the latent elastomeric contact deformation state.

---

## 16.2 Robot, Contact, and Object Dynamics

### 16.2.1 Multi-Fingered Hand Dynamics
The continuous equations of motion for an $M$-fingered hand with $n_q$ actuated joints are:
$$\mathbf{M}(\mathbf{q})\ddot{\mathbf{q}} + \mathbf{C}(\mathbf{q}, \dot{\mathbf{q}})\dot{\mathbf{q}} + \mathbf{g}(\mathbf{q}) = \boldsymbol{\tau} - \sum_{i=1}^M \mathbf{J}_{c, i}^T(\mathbf{q}) \mathbf{f}_{c, i}$$
where:
* $\mathbf{M}(\mathbf{q}) \in \mathbb{R}^{n_q \times n_q}$ is the symmetric positive-definite hand inertia matrix.
* $\mathbf{C}(\mathbf{q}, \dot{\mathbf{q}})\dot{\mathbf{q}} \in \mathbb{R}^{n_q}$ represents Coriolis and centrifugal wrenches.
* $\mathbf{g}(\mathbf{q}) \in \mathbb{R}^{n_q}$ is the gravity torque vector.
* $\mathbf{J}_{c, i}(\mathbf{q}) = \frac{\partial \mathbf{p}_{c, i}}{\partial \mathbf{q}} \in \mathbb{R}^{3 \times n_q}$ is the contact point Jacobian for fingertip $i$.
* $\mathbf{f}_{c, i} \in \mathbb{R}^3$ is the contact force exerted by fingertip $i$ on the object.

### 16.2.2 Object Spatial Dynamics under Nonstationary Contacts
The rigid-body dynamics of the manipulated object in the world frame are governed by the Newton-Euler equations:
$$\begin{bmatrix} m_o(t) \mathbf{I}_3 & \mathbf{0} \\ \mathbf{0} & \mathbf{I}_o(t) \end{bmatrix} \begin{bmatrix} \dot{\mathbf{v}}_o \\ \dot{\boldsymbol{\omega}}_o \end{bmatrix} + \begin{bmatrix} m_o(t) \mathbf{g} \\ \boldsymbol{\omega}_o \times (\mathbf{I}_o(t) \boldsymbol{\omega}_o) \end{bmatrix} = \sum_{i=1}^M \begin{bmatrix} \mathbf{f}_{c, i} \\ (\mathbf{p}_{c, i} - \mathbf{c}_o(t)) \times \mathbf{f}_{c, i} \end{bmatrix} + \mathbf{w}_{\text{ext}}(t)$$
where $\mathbf{w}_{\text{ext}}(t) \in \mathbb{R}^6$ represents external dynamic disturbances (e.g., table impacts, moving liquid momentum).

### 16.2.3 Action-Dependent Contact Force Coupling
Unlike free-space motion, contact forces $\mathbf{f}_{c, i}$ are fundamentally coupled to robot joint accelerations $\ddot{\mathbf{q}}$. Assuming a compliant Hunt-Crossley elastomeric contact model at each fingertip ($F_N = k \delta^n + \chi \delta^m \dot{\delta}$), we linearize the contact wrench around the operating penetration depth $\boldsymbol{\delta}_k$ and penetration velocity $\dot{\boldsymbol{\delta}}_k$:
$$\mathbf{f}_{c, i} \approx \mathbf{K}_{c, i} (\mathbf{p}_{\text{finger}, i}(\mathbf{q}) - \mathbf{p}_{\text{obj}, i}) + \mathbf{D}_{c, i} (\mathbf{v}_{\text{finger}, i} - \mathbf{v}_{\text{obj}, i})$$
where the effective local stiffness $\mathbf{K}_{c, i} \triangleq \left. \frac{\partial \mathbf{f}_{c, i}}{\partial \boldsymbol{\delta}} \right|_{\mathbf{x}_k}$ and damping $\mathbf{D}_{c, i} \triangleq \left. \frac{\partial \mathbf{f}_{c, i}}{\partial \dot{\boldsymbol{\delta}}} \right|_{\mathbf{x}_k}$ account for nonlinear indentation geometry and material dissipation.

Over a discrete control interval $\Delta t$, the candidate joint acceleration command $\mathbf{u}_k = \ddot{\mathbf{q}}_k$ updates the fingertip position and velocity according to:
$$\Delta \mathbf{p}_{\text{finger}, i} \approx \mathbf{J}_{c, i}(\mathbf{q}_k) \dot{\mathbf{q}}_k \Delta t + \frac{1}{2} \mathbf{J}_{c, i}(\mathbf{q}_k) \mathbf{u}_k \Delta t^2$$
$$\Delta \mathbf{v}_{\text{finger}, i} \approx \mathbf{J}_{c, i}(\mathbf{q}_k) \mathbf{u}_k \Delta t$$

Substituting both the position update ($\frac{1}{2}\Delta t^2$) and velocity update ($\Delta t$) into the linearized contact dynamics yields:
$$\mathbf{f}_{c, i}(k+1) = \mathbf{f}_{c, i}(k) + \left( \frac{1}{2} \Delta t^2 \mathbf{K}_{c, i} + \Delta t \mathbf{D}_{c, i} \right) \mathbf{J}_{c, i}(\mathbf{q}_k) \mathbf{u}_k + \Delta t \mathbf{K}_{c, i} \mathbf{J}_{c, i}(\mathbf{q}_k) \dot{\mathbf{q}}_k - \Delta t \mathbf{K}_{c, i} \mathbf{v}_{\text{obj}, i}(k) + \mathbf{w}_{\text{lin}, i}(k)$$

Defining the **Control-to-Force Sensitivity Matrix** $\mathbf{\Lambda}_i(\mathbf{q}_k) \in \mathbb{R}^{3 \times n_q}$:
$$\mathbf{\Lambda}_i(\mathbf{q}_k) \triangleq \left( \frac{1}{2} \Delta t^2 \mathbf{K}_{c, i} + \Delta t \mathbf{D}_{c, i} \right) \mathbf{J}_{c, i}(\mathbf{q}_k)$$
the predicted contact force is explicitly affine in control input $\mathbf{u}_k$:
$$\mathbf{f}_{c, i}(k+1) = \mathbf{\Lambda}_i(\mathbf{q}_k) \mathbf{u}_k + \mathbf{f}_{c, i}^{\text{bias}}(\mathbf{x}_k, \boldsymbol{\theta}_k) + \mathbf{w}_{\text{lin}, i}(k)$$
where $\mathbf{w}_{\text{lin}, i}(k)$ denotes the local Jacobian and Hunt-Crossley linearization truncation error, bounded experimentally by $\|\mathbf{w}_{\text{lin}, i}\| \le \epsilon_{\text{jac}}$. This affine structure mathematically guarantees that control action $\mathbf{u}_k$ directly steers contact forces at step $k+1$.

### 16.2.4 Object-Level Grasp Matrix and Wrench Feasibility
Friction cone satisfaction at individual fingertips is necessary, but insufficient to prevent object drop or uncontrolled rotational slippage. The combined contact forces across all $M$ active contacts must balance the object's net dynamic spatial wrench.

We define the composite grasp matrix $\mathbf{G}(\mathbf{q}_k) \in \mathbb{R}^{6 \times 3M}$:
$$\mathbf{G}(\mathbf{q}_k) = \begin{bmatrix} \mathbf{I}_3 & \mathbf{I}_3 & \dots & \mathbf{I}_3 \\ [\mathbf{p}_{c, 1}(\mathbf{q}_k) - \mathbf{c}_o(k)]_\times & [\mathbf{p}_{c, 2}(\mathbf{q}_k) - \mathbf{c}_o(k)]_\times & \dots & [\mathbf{p}_{c, M}(\mathbf{q}_k) - \mathbf{c}_o(k)]_\times \end{bmatrix}$$
where $[\mathbf{r}]_\times \in \mathbb{R}^{3 \times 3}$ denotes the skew-symmetric cross-product matrix.

Under dynamic payload mass $m_o(k)$, shifting center-of-mass $\mathbf{c}_o(k)$, and nominal object acceleration $[\dot{\mathbf{v}}_o^{\text{des}}, \dot{\boldsymbol{\omega}}_o^{\text{des}}]^T$, the required dynamic spatial wrench $\mathbf{w}_{\text{req}}(k) \in \mathbb{R}^6$ is:
$$\mathbf{w}_{\text{req}}(k) = \begin{bmatrix} m_o(k) \left( \mathbf{g} - \dot{\mathbf{v}}_o^{\text{des}}(k) \right) \\ \mathbf{I}_o(k) \dot{\boldsymbol{\omega}}_o^{\text{des}}(k) + \boldsymbol{\omega}_o(k) \times (\mathbf{I}_o(k) \boldsymbol{\omega}_o(k)) \end{bmatrix}$$

Object-level wrench feasibility requires:
$$\mathbf{G}(\mathbf{q}_k) \mathbf{f}_c(k+1) = \mathbf{w}_{\text{req}}(k)$$
Stacking the contact sensitivities $\mathbf{\Lambda} = [\mathbf{\Lambda}_1^T, \dots, \mathbf{\Lambda}_M^T]^T \in \mathbb{R}^{3M \times n_q}$ and bias vectors $\mathbf{f}_c^{\text{bias}}$, the object-level wrench balance condition in terms of control action $\mathbf{u}_k$ becomes:
$$\mathbf{G}(\mathbf{q}_k) \mathbf{\Lambda}(\mathbf{q}_k) \mathbf{u}_k + \mathbf{G}(\mathbf{q}_k) \mathbf{f}_c^{\text{bias}}(\mathbf{x}_k, \boldsymbol{\theta}_k) = \mathbf{w}_{\text{req}}(k)$$
This object-level wrench constraint couples multi-finger force distribution directly to total object equilibrium, ensuring that payload mass influx and center-of-mass excursions are actively counteracted by the multi-finger grasp.

---

## 16.3 Sensor Model and Synchronization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MULTI-RATE SENSORY SYNCHRONIZATION PIPELINE            │
├─────────────────────┬──────────────┬──────────────┬─────────────────────────┤
│ Sensor Stream       │ Hardware Bus │ Native Rate  │ Synchronized Rate       │
├─────────────────────┼──────────────┼──────────────┼─────────────────────────┤
│ Proprioception q, dq│ EtherCAT     │ 1,000 Hz     │ Downsampled to 100 Hz   │
│ Optical Tactile (M) │ USB 3.0 Gen2 │ 60 Hz        │ Zero-order hold / Interp│
│ Wrist Force-Torque  │ EtherCAT/CAN │ 500 Hz       │ Causal moving average   │
└─────────────────────┴──────────────┴──────────────┴─────────────────────────┘
```

* **Master Cycle Period:** $\Delta t = 10.0\text{ ms}$ ($100\text{ Hz}$).
* **Hardware Timestamp Locking:** Proprioception packets are hardware-timestamped via EtherCAT distributed clocks ($< 20\ \mu\text{s}$ jitter). Optical tactile frames are timestamped at camera shutter trigger.
* **Temporal Alignment:** Tactile optical flows $\Delta \mathbf{I}_{\text{tact}}$ are computed over sliding 2-frame windows and interpolated to the current $10\text{ ms}$ control boundary.

---

## 16.4 Multi-Contact State Estimator

The estimator ingests history window $\mathcal{H}_k = \{ \mathbf{q}_\tau, \dot{\mathbf{q}}_\tau, \boldsymbol{\tau}_\tau, \mathbf{I}_{\text{tact}, 1:M, \tau} \}_{\tau=k-H+1}^k$ of length $H = 10$ steps ($100\text{ ms}$).

```
                             [SENSORY INPUT STREAMS]
          Tactile Frames I_{tact, 1:M}             Proprioception q, \dot{q}, \tau
                      │                                          │
                      ▼                                          ▼
            [Tactile Patch CNN]                        [1D Causal ConvNet]
         (Spatial Shear Extraction)                 (Kinematic Trajectory Encoding)
                      │                                          │
                      └────────────────────┬─────────────────────┘
                                           │
                                           ▼
                            [Deep Ensemble Latent Core]
                            (E = 5 Multi-Head Ensembles)
                                           │
                      ┌────────────────────┼────────────────────┐
                      ▼                    ▼                    ▼
             [Friction Head]         [Contact Force Head]  [Object Inertial Head]
             \hat{\mu}_i, \sigma_\mu \hat{f}_{c,i}, \sigma_f   \hat{m}_o, \hat{c}_o
```

### Deep Ensemble Formulation
To capture epistemic uncertainty resulting from out-of-distribution materials and unseen objects, the estimator consists of an ensemble of $E = 5$ neural networks parameterized by $\mathbf{w}^{(e)}$:
$$\hat{\mathbf{y}}_k^{(e)} = f_{\mathbf{w}^{(e)}}(\mathcal{H}_k) = \left[ \hat{\mu}_{i, k}^{(e)}, \, \hat{f}_{N, i, k}^{(e)}, \, \hat{\mathbf{f}}_{T, i, k}^{(e)}, \, \hat{m}_{o, k}^{(e)}, \, \hat{\mathbf{c}}_{o, k}^{(e)} \right]$$
The ensemble predictive mean and epistemic variance are:
$$\bar{\mathbf{y}}_k = \frac{1}{E} \sum_{e=1}^E \hat{\mathbf{y}}_k^{(e)}, \qquad \boldsymbol{\Sigma}_{\text{epistemic}, k} = \frac{1}{E-1} \sum_{e=1}^E (\hat{\mathbf{y}}_k^{(e)} - \bar{\mathbf{y}}_k)(\hat{\mathbf{y}}_k^{(e)} - \bar{\mathbf{y}}_k)^T$$

---

## 16.5 Friction, Force, and Object-Property Estimation

### 16.5.1 Tangential Shear & Friction Estimation
Friction coefficient $\mu_i$ is estimated continuously using incipient slip boundary tracking. Let $\mathbf{u}_{\text{marker}, j}$ denote tactile marker displacement vectors in the peripheral region $\mathcal{R}_{\text{periph}}$ of fingertip $i$. The friction estimator loss is:
$$\mathcal{L}_{\mu} = \sum_{i=1}^M \left\| \hat{\mu}_i - \frac{\| \mathbf{f}_{T, i} \|_2}{f_{N, i}} \right\|^2 \cdot \mathbb{I}(\text{macro-slip}) + \lambda_{\text{incip}} \text{BCE}(\hat{p}_{\text{incip}, i}, y_{\text{incip}, i})$$

### 16.5.2 Object Mass and Center of Mass Tracking
Aggregating Newton-Euler force balances across all contacts, the object mass and center of mass satisfy:
$$m_o (\mathbf{g} - \dot{\mathbf{v}}_o) = - \sum_{i=1}^M \mathbf{f}_{c, i}, \qquad \mathbf{c}_o \times \sum_{i=1}^M \mathbf{f}_{c, i} = \sum_{i=1}^M (\mathbf{p}_{c, i} \times \mathbf{f}_{c, i}) - \mathbf{I}_o \dot{\boldsymbol{\omega}}_o$$
The network outputs continuous recursive estimates $\hat{m}_{o, k}$ and $\hat{\mathbf{c}}_{o, k}$ regularized by these physical balance laws.

---

## 16.6 Uncertainty Estimation and Conformal Calibration

### 16.6.1 The Breakdown of Standard Conformal Prediction in Robotics
Standard Split Conformal Prediction guarantees $1 - \delta$ marginal coverage:
$$\mathbb{P}(y_{n+1} \in \hat{\mathcal{C}}(x_{n+1})) \ge 1 - \delta$$
under the strict mathematical premise that data samples $(x_k, y_k)$ are **independent and identically distributed (i.i.d.) or exchangeable**.
In closed-loop robotic manipulation, tactile time-series exhibit **intense temporal autocorrelation** and **continuous nonstationary distribution shifts** (e.g., sudden lubrication steps, continuous fluid influx, dynamic tilt). Under such shifts, exchangeability is fundamentally violated, and standard conformal prediction intervals suffer severe empirical undercoverage during transitions.

### 16.6.2 Conformalized Quantile Regression (CQR) with Adaptive Coverage (ACI)
To address distribution shift and non-exchangeability without invalid claims of deterministic guarantees, PROBE-1 implements **Adaptive Conformal Inference (ACI, Gibbs & Candès, 2021/2024)**:

1. **Quantile Base Predictors:** The deep ensemble outputs conditional lower quantile $\hat{q}_{\alpha_t/2}(x_k)$ and upper quantile $\hat{q}_{1-\alpha_t/2}(x_k)$ for friction $\mu_i$ and normal force $f_{N, i}$.
2. **Conformal Non-Conformity Score:** Evaluated over calibration split $\mathcal{D}_{\text{cal}}$:
   $$E_k = \max \left( \hat{q}_{\alpha_t/2}(x_k) - y_k, \, y_k - \hat{q}_{1-\alpha_t/2}(x_k) \right)$$
3. **Adaptive Threshold Update ($100\text{ Hz}$ online recursion):**
   $$\alpha_{k+1} = \alpha_k + \gamma (\delta - \text{err}_k), \quad \text{where } \text{err}_k = \mathbb{I}(y_k \notin \hat{\mathcal{C}}_k)$$
   where $\delta \in (0, 1)$ is the target miscoverage rate (e.g., $\delta = 0.05$ for $95\%$ nominal coverage) and $\gamma > 0$ is the adaptation rate parameter.
4. **Theoretical Scope and Asymptotic Guarantee:**
   ACI guarantees that the empirical miscoverage converges asymptotically to target $\delta$ in the long run:
   $$\lim_{T \to \infty} \frac{1}{T} \sum_{k=1}^T \text{err}_k = \delta$$
   > [!IMPORTANT]
   > **Mathematical Caveat on Instantaneous Coverage:**  
   > ACI guarantees long-run average coverage under arbitrary distribution shift; it does **not** guarantee conditional coverage $\mathbb{P}(y_k \in \hat{\mathcal{C}}_k \mid x_k) \ge 1 - \delta$ at any single isolated timestep $k$. Therefore:
   > - The estimated lower bound must be designated an **Adaptive Calibrated Friction Prediction Interval**, not a deterministic or certified lower bound.
   > - The downstream safety controller must treat this calibrated lower interval as an uncertainty-discounted risk buffer, rather than an absolute physical guarantee.
   > - Empirical coverage $1 - \hat{\delta}$ must be evaluated and reported independently across each perturbation regime (Regimes A, B, C, and D) to monitor conditional coverage drops during sharp transitions.
5. **Adaptive Calibrated Friction Prediction Interval:**
   The conservative lower interval for contact friction is:
   $$\mu_{i, \min}(k) = \max \left( \mu_{\text{floor}}, \, \hat{\mu}_i(k) - Q_{1-\alpha_k}(E) \right)$$
   where $\mu_{\text{floor}} = 0.05$ represents the physical lower limit of the test apparatus (corresponding to boundary lubrication of polished PTFE/Teflon). If $\hat{\mu}_i(k) - Q_{1-\alpha_k}(E) < \mu_{\text{floor}}$, the system triggers a **Low-Friction Caution Alert** ($\text{FLAG}_{\text{lubrication}} = 1$), warning the supervisory task planner that friction estimation is approaching the hardware measurement boundary.

---

## 16.7 Safe-Set and Contact-Stability Formulation

The system must satisfy two fundamental safety criteria across all contacts $i \in \{1, \dots, M\}$:

```
                  SAFE CONTACT OPERATING REGION (FRICTION CONE)
                           f_N (Normal Force)
                               ▲
                               │           / Slip Boundary (f_T = \mu * f_N)
                               │          /
        F_damage ──────────────┼─────────/─── Max Crush Limit (Damage Barrier)
                               │        /|
                               │ SAFE  / │
                               │ REGION  │
                               │      /  │
        f_{N,min} ─────────────┼─────/───┴─── Min Contact Maintenance
                               │    /
                               │   /
                               └──/───────────► f_T (Tangential Shear Force)
```

1. **Anti-Slip Friction Cone Barrier:**
   $$h_{\text{slip}, i}(\mathbf{x}, \boldsymbol{\theta}) = \mu_i f_{N, i} - \| \mathbf{f}_{T, i} \|_2 \ge 0$$
2. **Anti-Crush Damage Barrier:**
   $$h_{\text{damage}, i}(\mathbf{x}) = F_{\text{damage}, i} - f_{N, i} \ge 0$$
3. **Minimum Contact Maintenance:**
   $$h_{\text{contact}, i}(\mathbf{x}) = f_{N, i} - f_{N, \min} \ge 0$$

The safe operating set $\mathcal{S} \subset \mathcal{X}$ is the intersection:
$$\mathcal{S} = \left\{ \mathbf{x} \in \mathcal{X} \;\middle|\; h_{\text{slip}, i}(\mathbf{x}) \ge 0, \; h_{\text{damage}, i}(\mathbf{x}) \ge 0, \; h_{\text{contact}, i}(\mathbf{x}) \ge 0, \; \forall i \in \{1, \dots, M\} \right\}$$

---

## 16.8 Robust Discrete-Time Predictive CBF Derivation

### 16.8.1 Discrete-Time Barrier Condition
In discrete time with sampling interval $\Delta t$, enforcing forward invariance of safe set $\mathcal{S}$ requires that for all $x_k \in \mathcal{S}$:
$$h_i(x_{k+1}, \theta_{k+1}) - (1 - \gamma_i) h_i(x_k, \theta_k) \ge 0, \quad \gamma_i \in (0, 1]$$
where $\gamma_i$ dictates the convergence rate toward the safety boundary.

### 16.8.2 Substituting Action-Dependent Dynamics
Substituting the affine contact force prediction from Section 16.2.3:
$$\mathbf{f}_{c, i}(k+1) = \mathbf{\Lambda}_i(\mathbf{q}_k) \mathbf{u}_k + \mathbf{f}_{c, i}^{\text{bias}}(k)$$
Decomposing into normal and tangential components:
$$f_{N, i}(k+1) = \mathbf{n}_i^T \left( \mathbf{\Lambda}_i \mathbf{u}_k + \mathbf{f}_{c, i}^{\text{bias}} \right)$$
$$\mathbf{f}_{T, i}(k+1) = (\mathbf{I} - \mathbf{n}_i \mathbf{n}_i^T) \left( \mathbf{\Lambda}_i \mathbf{u}_k + \mathbf{f}_{c, i}^{\text{bias}} \right)$$

### 16.8.3 The Robust Worst-Case Formulation
Under uncertainty set $\mathcal{U}_k = [\mu_{i, \min}, \mu_{i, \max}] \times \mathcal{W}_f$, the robust barrier condition requires:
$$\inf_{\mu_i \in [\mu_{i, \min}, \mu_{i, \max}], \, \mathbf{w} \in \mathcal{W}} \left[ \mu_i f_{N, i}(k+1) - \| \mathbf{f}_{T, i}(k+1) \|_2 \right] \ge (1 - \gamma_i) \left( \hat{\mu}_i(k) f_{N, i}(k) - \| \mathbf{f}_{T, i}(k) \|_2 \right)$$
Evaluating the infimum analytically yields the **Robust Action-Dependent Safety Constraint**:
$$\mu_{i, \min}(k) \mathbf{n}_i^T \mathbf{\Lambda}_i \mathbf{u}_k - \| (\mathbf{I} - \mathbf{n}_i \mathbf{n}_i^T) \mathbf{\Lambda}_i \mathbf{u}_k + \mathbf{f}_{T, i}^{\text{bias}} \|_2 \ge b_i(x_k, \hat{\theta}_k)$$
where scalar offset $b_i(x_k, \hat{\theta}_k)$ is:
$$b_i = (1 - \gamma_i) h_i(x_k) - \mu_{i, \min}(k) \mathbf{n}_i^T \mathbf{f}_{c, i}^{\text{bias}} + k_{\text{margin}} \sigma_{\text{composite}, i}$$

---

## 16.9 QP versus SOCP Controller Formulation

### 16.9.1 Exact Second-Order Cone Program (SOCP)
Because the tangential constraint involves the Euclidean norm $\| \mathbf{f}_{T, i} \|_2$, the exact Coulomb friction cone constraint is naturally expressed as a Second-Order Cone (SOC):
$$\min_{\mathbf{u}, \boldsymbol{\delta}_s} \frac{1}{2} \| \mathbf{u} - \mathbf{u}_{\text{nom}} \|_{\mathbf{W}}^2 + \rho \sum_{i=1}^M \delta_{s, i}^2$$
subject to:
$$\left( \mu_{i, \min} \mathbf{n}_i^T \mathbf{\Lambda}_i \mathbf{u} - b_i + \delta_{s, i}, \; (\mathbf{I} - \mathbf{n}_i \mathbf{n}_i^T) \mathbf{\Lambda}_i \mathbf{u} + \mathbf{f}_{T, i}^{\text{bias}} \right) \in \mathcal{K}_{\text{SOC}}^{3}, \quad \forall i \in \{1, \dots, M\}$$
$$\mathbf{G}(\mathbf{q}_k) \mathbf{\Lambda}(\mathbf{q}_k) \mathbf{u} + \mathbf{G}(\mathbf{q}_k) \mathbf{f}_c^{\text{bias}}(\mathbf{x}_k, \boldsymbol{\theta}_k) = \mathbf{w}_{\text{req}}(k)$$
$$\mathbf{u}_{\min} \le \mathbf{u} \le \mathbf{u}_{\max}, \quad \boldsymbol{\delta}_s \ge \mathbf{0}$$

* **Algorithm & Solver:** Primal-Dual Interior-Point Method (Clarabel / ECOS).
* **Advantage:** Exact representation of the circular Coulomb friction cone; zero geometric conservatism.
* **Disadvantage:** Interior-point SOCP solvers exhibit solve times of **$1.85\text{--}3.50\text{ ms}$** on embedded ARM64 Cortex-A78 cores, exceeding the $1.0\text{ ms}$ computational budget.

### 16.9.2 Polyhedral Approximation Quadratic Program (QP)
To guarantee deterministic execution within the $1.0\text{ ms}$ internal computational budget, the continuous circular friction cone in the 2D tangential plane is approximated by an $N_{\text{sides}} = 8$-sided regular inscribed polygon $\mathcal{P}_8$.

#### Mathematical Proof of Conservative Inner Approximation
Let the circular friction cone in the local contact tangent plane $(f_{T, x}, f_{T, y})$ be:
$$\mathcal{C}_i \triangleq \left\{ \mathbf{f}_{T, i} \in \mathbb{R}^2 \;\middle|\; \|\mathbf{f}_{T, i}\|_2 \le \mu_{i, \min} f_{N, i} \right\}$$
which defines a disk of radius $R_i = \mu_{i, \min} f_{N, i}$.

Consider an inscribed regular 8-sided polygon $\mathcal{P}_{8, i}$ whose 8 vertices lie directly on the boundary of disk $\mathcal{C}_i$ at angles $\theta_j = \frac{2\pi j}{8}$ for $j \in \{0, \dots, 7\}$:
$$\mathbf{v}_{j, i} = R_i \begin{bmatrix} \cos(2\pi j / 8) \\ \sin(2\pi j / 8) \end{bmatrix}$$
The unit normal to each facet is $\mathbf{c}_j = [\cos(\phi_j), \sin(\phi_j)]^T$ where $\phi_j = \frac{2\pi j + \pi}{8}$. The orthogonal distance from the origin to each facet is:
$$d_{\text{facet}} = R_i \cos\left(\frac{\pi}{8}\right) \approx 0.92388 \, R_i$$

The half-space representation of the inscribed polygon is:
$$\mathbf{c}_j^T \mathbf{f}_{T, i} \le \mu_{i, \min} \cos\left(\frac{\pi}{8}\right) f_{N, i}, \quad \forall j \in \{0, \dots, 7\}$$

**Proof that $\mathcal{P}_{8, i} \subset \mathcal{C}_i$:**  
By definition, the polygon $\mathcal{P}_{8, i}$ is the convex hull of its vertices $\{\mathbf{v}_{0, i}, \dots, \mathbf{v}_{7, i}\}$. For any point $\mathbf{f} \in \mathcal{P}_{8, i}$, there exist convex weights $\lambda_j \ge 0$ with $\sum_{j=0}^7 \lambda_j = 1$ such that $\mathbf{f} = \sum_{j=0}^7 \lambda_j \mathbf{v}_{j, i}$. By the triangle inequality and convexity of the Euclidean norm:
$$\|\mathbf{f}\|_2 = \left\| \sum_{j=0}^7 \lambda_j \mathbf{v}_{j, i} \right\|_2 \le \sum_{j=0}^7 \lambda_j \|\mathbf{v}_{j, i}\|_2 = \sum_{j=0}^7 \lambda_j R_i = R_i = \mu_{i, \min} f_{N, i}$$
Therefore, **every point inside the inscribed polygon strictly satisfies the true circular friction cone condition**. The polyhedral approximation is provably an **inner approximation**, ensuring that no unsafe force outside the circular friction cone can ever be admitted.

The geometric conservatism along the facet midpoints is:
$$\eta_{\text{cons}} = 1 - \cos\left(\frac{\pi}{8}\right) = 1 - 0.92388 = 0.07612 \quad (\approx 7.61\%)$$

Substituting the affine contact force prediction from Section 16.2.3, this yields 8 linear inequality constraints per contact:
$$\mathbf{c}_j^T \left( (\mathbf{I} - \mathbf{n}_i \mathbf{n}_i^T) \mathbf{\Lambda}_i \mathbf{u} + \mathbf{f}_{T, i}^{\text{bias}} \right) \le \mu_{i, \min} \cos\left(\frac{\pi}{8}\right) \mathbf{n}_i^T \left( \mathbf{\Lambda}_i \mathbf{u} + \mathbf{f}_{c, i}^{\text{bias}} \right) - b_i + \delta_{s, i}, \quad j \in \{0, \dots, 7\}$$

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          QP VS. SOCP FORMULATION COMPARISON                 │
├───────────────────────────────┬──────────────────────┬──────────────────────┤
│ Metric / Dimension            │ Polyhedral QP (8-Side│ Exact SOCP           │
├───────────────────────────────┼──────────────────────┼──────────────────────┤
│ Underlying Algorithm          │ Augmented Lagrangian │ Primal-Dual IPM      │
│                               │ / Active-Set Method  │ (Interior-Point)     │
│ Constraint Geometry           │ 8 Inscribed Facets   │ Continuous Cone      │
│ Geometric Conservatism        │ 7.61% (Inscribed)    │ 0.0% (Exact)         │
│ Approximation Direction       │ Strictly Inner (Safe)│ Exact Boundary       │
│ Solve Time (ARM64 Cortex-A78) │ 0.35 - 0.72 ms       │ 1.85 - 3.40 ms       │
│ Sub-ms Budget Compliance (<1ms│ GUARANTEED (P99.9)   │ EXCEEDS BUDGET (>1ms)│
│ Software Solvers              │ ProxSuite (Active-Set│ Clarabel / ECOS      │
│                               │ / OSQP (ADMM)        │                      │
└───────────────────────────────┴──────────────────────┴──────────────────────┘
```

**Architectural Decision:**  
PROBE-1 adopts the **8-Sided Polyhedral QP** as its primary real-time controller to strictly satisfy the $\le 1.0\text{ ms}$ computation budget, retaining the exact SOCP as an offline simulation evaluation baseline.

---

## 16.10 Feasibility Handling, Slack Relaxation, and Safety Fallback

### 16.10.1 Separation of Hard Safety Sets and Soft Slack Variables
In real-time optimization, slack variables $\delta_{s, i} \ge 0$ penalized quadratically by $\rho \|\boldsymbol{\delta}_s\|_2^2$ ($\rho = 10^5$) are introduced solely to prevent solver mathematical infeasibility when aggressive physical disturbances abruptly push the state outside the barrier.

> [!WARNING]
> **Safety Set Relaxation Semantics:**  
> A non-zero slack value $\delta_{s, i} > \epsilon_{\text{slack}}$ (with $\epsilon_{\text{slack}} = 10^{-4}$) means the **true physical safety barrier is violated**. Optimization feasibility does not constitute safety compliance.

### 16.10.2 Four-State Controller Runtime State Machine

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SAFETY FILTER FOUR-STATE RUNTIME MACHINE                │
│                                                                             │
│   Cycle Start: Ingest x_k, \hat{\theta}_k, \sigma_k                         │
│        │                                                                    │
│        ▼                                                                    │
│   [Formulate Polyhedral QP]                                                 │
│        │                                                                    │
│        ▼                                                                    │
│   [Launch Solver with 1.0 ms POSIX Timer Interrupt]                         │
│        │                                                                    │
│   ┌────┴──────────────────────────┬────────────────────────┐                │
│   ▼                               ▼                        ▼                │
│ Status = Converged        Status = Converged          Status != Converged   │
│ ||\delta_s|| <= \epsilon  ||\delta_s|| > \epsilon     OR Timeout (t > 1 ms) │
│ Execution Time <= 0.8 ms  (Slack Relaxed)                  │                │
│   │                               │                        │                │
│   ▼                               ▼                        ▼                │
│ [STATE: NOMINAL_SAFE]     [STATE: EMERGENCY_RELAXED]  [STATE: CRITICAL_FAIL]│
│ Dispatch u* to robot      Dispatch u* + Trigger       ENGAGE PASSIVE BRAKE  │
│                           Emergency Transition Check  u_{safe} = -K_d * dq  │
│                                   │                   (12 microseconds)     │
│                                   ▼                        │                │
│                           Exceeds 2 cycles?                │                │
│                           YES ─────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **`STATE_NOMINAL_SAFE` ($\text{Status} = 0, \|\boldsymbol{\delta}_s\|_\infty \le \epsilon_{\text{slack}}, t_{\text{solve}} \le 1.0\text{ ms}$):**  
   The candidate control input $\mathbf{u}^*$ strictly satisfies the discrete-time barrier condition and object wrench balance. Dispatch $\mathbf{u}^*$ to low-level motor controllers.
2. **`STATE_EMERGENCY_RELAXED` ($\text{Status} = 0, \|\boldsymbol{\delta}_s\|_\infty > \epsilon_{\text{slack}}, t_{\text{solve}} \le 1.0\text{ ms}$):**  
   The QP converged only by mathematically relaxing the barrier. An emergency caution alert is logged. The controller allows at most $N_{\text{relax}} = 2$ consecutive relaxed steps ($20\text{ ms}$) to recover normal contact before forcing an automatic transition to passive braking.
3. **`STATE_CRITICAL_FAIL` ($\text{Status} \ne 0$ or $t_{\text{solve}} > 1.0\text{ ms}$):**  
   Primal/dual infeasibility or watchdog timer expiration triggers instantaneous fallback within $12\ \mu\text{s}$:
   $$\mathbf{u}_{\text{safe}} = -\mathbf{K}_d \dot{\mathbf{q}}$$

### 16.10.3 Dual-Objective Fallback Acceptance Criteria
The safe fallback routine must be evaluated independently against two distinct engineering criteria:
* **Robot Hardware Safety:** Actuator torques and joint velocities must remain strictly within mechanical and thermal thresholds during braking, preventing high-speed joint limit impacts or inverter tripping.
* **Object Retention & Damage Mitigation:** The passive damping response must dissipate object kinetic energy smoothly, preventing projectile ejection or explosive contact fractures during grasp relinquishment.

---

## 16.11 TacSL Simulation Environment & Domain Randomization

### 16.11.1 Pinned Environment Versions
* **Simulation Framework:** NVIDIA **Isaac Lab v2.3**
* **Underlying Engine:** NVIDIA **Isaac Sim 5.1** (Ubuntu 22.04 LTS, CUDA 12.4.1)
* **Physics Backend:** GPU-accelerated PhysX with continuous collision detection (CCD)
* **Tactile Sensor Plugin:** **TacSL** (contributed Isaac Lab sensor module generating high-resolution elastomeric normal/shear contact deformation fields and simulated RGB marker displacements).

### 16.11.2 Multi-Variable Domain Randomization Matrix
During training in Isaac Lab, physical properties are randomized independently across parallel environments:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ISAAC LAB TACSL DOMAIN RANDOMIZATION MATRIX              │
├───────────────────────────────┬────────────────────┬────────────────────────┤
│ Parameter                     │ Base Nominal Value │ Randomized Range       │
├───────────────────────────────┼────────────────────┼────────────────────────┤
│ Friction Coefficient \mu_i    │ 0.50               │ U[0.10, 1.20]          │
│ Object Mass m_o               │ 0.40 kg            │ U[0.10 kg, 1.50 kg]    │
│ Dynamic Mass Influx (Liquid)  │ 0.00 kg/s          │ U[0.05, 0.30 kg/s]     │
│ CoM Offset Vector c_o         │ [0, 0, 0] cm       │ U[-6.0 cm, +6.0 cm]    │
│ Contact Surface Compliance K_c│ 1,500 N/m          │ U[600, 3,500 N/m]      │
│ Tactile Sensor Optical Gain   │ 1.00               │ U[0.70, 1.30]          │
│ Actuator Torque Latency       │ 2.0 ms             │ U[1.0 ms, 8.0 ms]      │
└───────────────────────────────┴────────────────────┴────────────────────────┘
```

### 16.11.3 TacSL Sensor Output Ground-Truth Validation Protocol
Because simulated elastomeric and optical deformation fields can exhibit numerical artifacts or force discrepancies under stiff contact, **simulated TacSL sensor outputs must not be treated as ground truth without explicit calibration**.

Before training data generation or model evaluation:
1. **Indenter Calibration Bench:** In Isaac Lab, a standardized test bench applies known normal forces $F_N \in [0.5, 20.0]\text{ N}$ and tangential shear loads $F_T \in [0.0, 10.0]\text{ N}$ against the simulated elastomeric sensor surface using flat, spherical, and cylindrical indenters.
2. **Acceptance Threshold:** Simulated normal force estimates and shear displacement fields must agree with applied PhysX rigid-body contact wrenches within $\le 5.0\%$ root-mean-square error across the full operating range.
3. **Discrepancy Compensation:** Any systematic nonlinear offset or shear attenuation observed in TacSL's optical marker simulation is corrected using an empirical lookup table and polynomial calibration layer prior to downstream training ingestion.

---

## 16.12 Training and Evaluation Data Protocols

### 16.12.1 Procedural Data Generation
* **Simulation Volume:** 2,048 parallel environments in Isaac Lab v2.3 generating $250,000$ episodes ($100\text{ Hz}$ state-action-tactile chunks, 100 steps per episode).
* **Nonstationary Regimes:**
  * *Regime A (Friction Step):* Surface friction drops instantaneously by $60\%$ mid-grasp (simulating lubricant).
  * *Regime B (Mass Influx):* Object mass increases continuously at $0.2\text{ kg/s}$ (simulating pouring liquid).
  * *Regime C (CoM Precession):* Object is tilted dynamically at $45^\circ/\text{s}$, inducing shifting gravitational moments.
  * *Regime D (Joint Nonstationarity):* Simultaneous execution of Regimes A, B, and C.

---

## 16.13 Experimental Baselines and Ablations

### Six Core Experimental Protocols
* **EXP-001 (Contact State Estimation):** Evaluates tracking RMSE of $\hat{\mu}_i, \hat{f}_{N, i}, \hat{\mathbf{f}}_{T, i}$ against ground truth under unseen materials.
* **EXP-002 (Uncertainty Calibration):** Evaluates Expected Calibration Error (ECE) and empirical coverage $1 - \hat{\delta}$ of the adaptive conformal prediction sets.
* **EXP-003 (Simultaneous Physical Perturbations):** Evaluates grasp survival time and drop rates under Regime D (simultaneous friction + mass + CoM shift).
* **EXP-004 (Safety-Controller Comparative Evaluation):** Benchmarks against $B1$ (Fixed Force), $B2$ (Reactive Slip Squeeze), $B3$ (Unconstrained Flow Policy), and $B4$ (Deterministic Tactile MPC).
* **EXP-005 (Comprehensive Ablation Suite):**
  * *Ablation 1:* Remove tactile shear inputs (proprioception-only).
  * *Ablation 2:* Remove conformal uncertainty margins ($k_{\text{margin}} = 0$).
  * *Ablation 3:* Replace QP with unconstrained PD reflex.
  * *Ablation 4:* Remove action-dependent dynamics coupling ($\mathbf{\Lambda}_i = \mathbf{0}$).
* **EXP-006 (Real-Time Hardware Timing):** Profiles solver iteration counts, execution latency, deadline miss rates, and watchdog recovery across $10,000$ continuous physical cycles.

---

## 16.14 Metrics and Statistical Analysis

### Concrete Performance Metrics
1. **Object Drop Rate ($P_{\text{drop}}$):** Percentage of trials where contact normal forces reach zero before task completion.
2. **Crush Violation Rate ($P_{\text{crush}}$):** Percentage of trials where peak normal force exceeds structural limit $F_{\text{damage}} = 18.0\text{ N}$.
3. **Grasp Survival Time ($t_{\text{survive}}$):** Time (seconds) grasp stability is maintained under continuous nonstationary perturbation.
4. **Normalized Tracking Error:** RMSE on friction $\hat{\mu}$ and contact wrench $\hat{\mathbf{f}}_c$.
5. **Coverage Calibration ($1 - \hat{\delta}$):** Percentage of test timesteps where true parameters lie inside conformal prediction sets.
6. **Controller Solve Latency:** P50, P95, and P99.9 execution time (ms).

### Statistical Significance Protocols
* Multi-trial paired comparisons ($N = 200$ randomized test seeds per condition).
* Paired McNemar's test for binary failure outcomes (drop and crush rates) evaluated at $\alpha = 0.01$.
* Wilcoxon signed-rank test for continuous survival times and contact forces.

---

## 16.15 Real-Time Performance and Reproducibility

### 16.15.1 Real-Time Hardware Architecture & Computational Budget Breakdown
* **Target Embedded Compute:** NVIDIA Jetson AGX Orin / Jetson Thor (ARM Cortex-A78AE / Grace CPU cores).
* **OS Environment:** Ubuntu 22.04 LTS with real-time `PREEMPT_RT` patch.
* **Control Loop Period:** Master control cycle period is $\Delta t = 10.0\text{ ms}$ ($100\text{ Hz}$).
* **Internal Computational Budget Allocation ($10.0\text{ ms}$ total):**
  * Sensory Ingestion & Optical Flow: $2.5\text{ ms}$
  * Deep Ensemble + Conformal Quantile Inference: $4.5\text{ ms}$
  * **QP Predictive Safety Filter Solve Budget:** $\le 1.0\text{ ms}$ (strict internal watchdog deadline)
  * EtherCAT Bus Serialization & Low-Level Actuator Dispatch: $1.0\text{ ms}$
  * Operating System & Safety Margin: $1.0\text{ ms}$
* **Timing Metric Reporting Protocol:**  
  Because high percentiles mask tail spikes and hard deadline violations, timing benchmarks must report:
  * Median (P50), P95, P99, and P99.9 latencies.
  * Explicit **Worst-Case Execution Time (WCET)** across continuous operational blocks ($N \ge 10,000$ cycles).
  * Any cycle where solver execution exceeds $1.0\text{ ms}$ is counted as a **Computational Deadline Fault**, triggering the passive braking fallback regardless of whether the broader $10.0\text{ ms}$ cycle has elapsed.

### 16.15.2 Reproducibility Checklist
* All simulation code pinned to Isaac Lab v2.3 and Isaac Sim 5.1.
* Fixed random seeds `[42, 1337, 2026, 8888, 9999]`.
* Serialized dataset checkpoints with SHA-256 integrity verification.
* C++20 standalone safety filter package with deterministic unit tests.

---

## 16.16 Limitations, Assumptions, and Failure Conditions

1. **Hunt-Crossley Contact Assumption:** Assumes point contact with soft linear/polynomial damping; does not model complex torsional adhesive suction or non-Coulomb elastomeric stiction.
2. **Conformal Exchangeability Decay:** Rapidly switching between radically disparate materials (e.g., silicone to Teflon) induces temporary coverage degradation until adaptive conformal inference (ACI) recalibrates.
3. **Actuator Torque Saturation:** If external disturbance wrenches exceed maximum actuator torque capabilities ($\sum \mathbf{J}_c^T f > \boldsymbol{\tau}_{\max}$), the QP becomes fundamentally infeasible and physical drop is inevitable.

---

## 16.17 Conclusion & Transition to Document 17

Document 16 establishes a mathematically sound, action-dependent, and uncertainty-calibrated control design. We proceed to **Document 17: Experimental Implementation**, where the smallest reproducible implementation (Isaac Lab TacSL simulation testbed and ProxSuite C++ safety filter) will be built and validated.

