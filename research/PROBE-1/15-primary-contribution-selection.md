# PROBE-1 Primary Research Thesis Selection: Uncertainty-Aware Safe Adaptation for Multifingered Grasping Under Jointly Changing Contact Conditions
**HOROS First-Party Model Program: Physical Humanoid Foundation Architecture**  
**Document ID:** HOROS-PROBE1-15-PRIMARY-CONTRIBUTION  
**Creation Date:** October 31, 2026  
**Status:** Authoritative Research Thesis & Scientific Contribution Charter  
**Parent Documents:**
* [`research/PROBE-1/12-real-world-problem-discovery.md`](file:///c:/projects/MemoryOS/research/PROBE-1/12-real-world-problem-discovery.md)
* [`research/PROBE-1/13-existing-models-and-methods-evaluation.md`](file:///c:/projects/MemoryOS/research/PROBE-1/13-existing-models-and-methods-evaluation.md)
* [`research/PROBE-1/14-existing-research-and-prior-art.md`](file:///c:/projects/MemoryOS/research/PROBE-1/14-existing-research-and-prior-art.md)

---

## Executive Summary & Strategic Commitment

Following exhaustive problem discovery (Doc 12), frontier model evaluation (Doc 13), and a rigorous prior-art novelty stress test (Doc 14), this document makes a single, precise, and falsifiable scientific commitment for **HOROS PROBE-1**.

Rather than attempting an unmanageably broad program—such as pretraining a 3.8B foundation model, deploying full-body humanoid locomotion, or claiming unproven zero-shot autonomy—HOROS narrows its research focus to the foundational physical bottleneck of dexterous manipulation: **safe, closed-loop multifinger grasp adaptation under joint nonstationary physical contact transitions**.

The selected research program focuses on a multi-fingered robotic hand instrumented with tactile sensors and proprioceptive feedback. It formulates a coupled architecture combining **calibrated contact-state uncertainty estimation** with a **robust predictive safety filter**, systematically stress-testing performance when friction, payload mass, and center of mass change simultaneously during dynamic physical interactions.

---

## 15.1 Research Problem and Motivation

Robotic manipulation in real-world environments—such as assisted eldercare, surgical assistance, domestic tasks, and delicate manufacturing—fails predominantly at the physical contact interface. When a robot lifts a slippery glass, pours liquid from a compliant container, or handles an object with shifting contents, the contact state is nonstationary:
1. **Frictional Nonstationarity:** Surface friction coefficients $\mu(t)$ vary dynamically due to moisture, condensation, dust, or material non-uniformity.
2. **Inertial Nonstationarity:** Object mass $m(t)$ and the spatial center of mass $\mathbf{p}_{\text{CoM}}(t)$ shift dynamically as liquids slosh or payloads transfer.
3. **Contact Geometry Nonstationarity:** Micro-slip causes relative movement between the fingertip elastomers and the object surface, shifting contact normals $\mathbf{n}_i(t)$ and local curvature.

Current robotic systems respond to these conditions either through high-gain over-squeezing (which crushes fragile objects, tears soft tissues, or exceeds motor torque limits) or open-loop trajectory execution (which results in catastrophic object drops when friction drops or mass shifts). Existing foundation models ($\pi_0, \pi_{0.5}$, OpenVLA) remain largely open-loop across multi-step action chunks, lacking the closed-loop tactile reflex required to stabilize dynamic contact transitions in real time.

---

## 15.2 Evidence and Synthesis from Documents 12–14

The selection of this research focus is directly grounded in empirical findings from the preceding research stages:

1. **Human Needs Assessment (Doc 12):** Contact dynamics and slip regulation represent the single highest-frequency failure mode across healthcare, eldercare, and precision assembly.
2. **Frontier Model Audit (Doc 13):** Frontier VLAs ($\pi_0, \pi_{0.5}$, GR00T) are functionally tactile-blind or execute action chunks open-loop. While recent models like TacClaw-Infinity ([arXiv:2610.20320](https://arxiv.org/abs/2610.20320)) and VLA-Touch ([arXiv:2507.17294](https://arxiv.org/abs/2507.17294)) prove that tactile conditioning improves task success, they operate without formal safety boundaries or closed-loop uncertainty adaptation.
3. **Novelty Stress Test & Prior-Art Boundary (Doc 14):**
   * *Incipient slip prediction* has already been demonstrated ([SINTEF IROS 2024](https://doi.org/10.1109/IROS58592.2024.10802058), [PANDAS IROS 2025](https://doi.org/10.1109/IROS60139.2025.11246395)).
   * *Isolated dynamic mass adaptation* has been demonstrated ([Zhao et al. Sensors 2024](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11358941/), [Ford et al. IEEE T-RO 2025](https://doi.org/10.1109/TRO.2025.3563046)).
   * *Isolated online friction estimation* has been demonstrated ([Niu et al. arXiv:2602.02026](https://arxiv.org/abs/2602.02026)).
   * *Tactile Control Barrier Functions* have been applied to parallel jaws ([Robust Adaptive Safe Robotic Grasping, 2025](https://arxiv.org/abs/2503.xxxxx)).
   * *Tactile multi-finger MPC* has been demonstrated ([CoorGrasp ICRA 2026](https://ada-grasp-ctrl.github.io)).

**The Core Finding:** What remains experimentally unproven is the **coordinated adaptation of multifinger forces under simultaneous, multi-variable physical nonstationarities (friction + mass + CoM shifts) governed by calibrated state uncertainty and predictive safety filtering**.

---

## 15.3 Comparison of the Three Candidate Research Tracks

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CANDIDATE RESEARCH TRACK COMPARISON MATRIX                               │
├───────────────────────────────┬─────────────────────────────┬───────────────────────────┬───────────────────┤
│ Evaluation Dimension          │ Track 1: Safe Multifinger   │ Track 2: Failure-Aware    │ Track 3: Whole-   │
│                               │ Grasp Adaptation (SELECTED) │ Episodic Memory           │ Body Loco-Manip   │
├───────────────────────────────┼─────────────────────────────┼───────────────────────────┼───────────────────┤
│ Scientific Focus              │ Contact stability, friction,│ Non-parametric failure    │ Whole-body balance│
│                               │ uncertainty & safety filter │ retrieval & avoidance     │ under heavy loads │
├───────────────────────────────┼─────────────────────────────┼───────────────────────────┼───────────────────┤
│ Hardware Risk & Cost          │ Low/Moderate (Desk testbed; │ Low (Pure software /      │ High (Severe fall │
│                               │ multi-finger hand rig)      │ workstation retrieval)    │ & hardware damage)│
├───────────────────────────────┼─────────────────────────────┼───────────────────────────┼───────────────────┤
│ Prior-Art Saturation          │ Moderate (Requires strict   │ High (RT-Cache 2025,      │ High (HULK 2026,  │
│                               │ scope & joint nonstation.)  │ FailSafe 2025 out)        │ Workhorse 2026)   │
├───────────────────────────────┼─────────────────────────────┼───────────────────────────┼───────────────────┤
│ Measurability & Rigor         │ Millimeter slip, Newton     │ Binary avoidance &        │ Fall counts, ZMP  │
│                               │ forces, calibrated ECE      │ task retention %          │ stability margins │
├───────────────────────────────┼─────────────────────────────┼───────────────────────────┼───────────────────┤
│ Feasibility with Current Lab  │ High via Isaac Lab TacSL    │ High via open datasets    │ Low (Requires G1  │
│ Resources                     │ & benchtop multi-finger rig │ & FAISS indexing          │ safety gantry)    │
└───────────────────────────────┴─────────────────────────────┴───────────────────────────┴───────────────────┘
```

**Selection Verdict:** **Track 1** is selected because it directly tackles the physical contact reality gap, exhibits clear metric measurability, and operates safely on an isolated benchtop multi-finger testbed before risking full humanoid hardware.

---

## 15.4 Selected Primary Research Question

The authoritative research question for HOROS PROBE-1 is defined as:

> **Primary Research Question:**  
> *Can a multifingered robotic hand estimate changing contact stability and its predictive uncertainty from synchronized tactile and proprioceptive observations, and adapt finger forces through a robust predictive safety controller when surface friction, payload mass, and center of mass change simultaneously during dynamic object manipulation?*

---

## 15.5 Central Scientific Hypothesis

> **Central Scientific Hypothesis:**  
> Explicitly conditioning a multi-finger force controller on **calibrated contact-state uncertainty** ($\sigma_{\text{contact}}$) and enforcing **high-order discrete Control Barrier Functions (CBFs)** over an action-conditioned prediction horizon achieves:
> 1. A statistically significant reduction in object-drop rates under simultaneous nonstationary friction and mass shifts relative to uncalibrated or decoupled adaptive baselines;
> 2. Zero instances of structural crush damage on delicate or compliant objects by bounding peak normal forces within certified physical margins;
> 3. Sub-millisecond deterministic safety filter execution ($\le 1.0\text{ ms}$) suitable for $\ge 100\text{ Hz}$ closed-loop embedded control.

---

## 15.6 Proposed Research Contributions

The PROBE-1 research program will deliver three primary contributions:

1. **Unified Multi-Contact Uncertainty Estimator:** A causal neural-statistical estimator ingesting synchronized high-frequency tactile elastomer streams and joint proprioception to predict friction coefficients $\hat{\mu}_i(t)$, local contact normal/shear forces $[\hat{f}_{N,i}, \hat{f}_{T,i}]$, and distance to the friction cone boundary, equipped with calibrated epistemic uncertainty ($\hat{\sigma}_i(t)$) via temperature-scaled conformal prediction.
2. **Robust Predictive Grasp-Safety Filter:** A convex optimization framework (active-set Quadratic Program) that monitors the safety margin across all active finger contacts:
   $$h_i(s_t) = \mu_i f_{N,i} - \| \mathbf{f}_{T,i} \|_2 - \beta \sigma_i \ge 0$$
   minimizing deviations from the primary task controller while guaranteeing friction-cone compliance and actuator torque bounds.
3. **Rigorous Nonstationary Physical Benchmark:** A standardized, reproducible benchmark protocol testing multi-finger grasping under **simultaneous nonstationary perturbations** (concurrent liquid mass injection, platform tilting, and frictional surface transitions), comparing against classical, RL, and modern VLA baselines.

---

## 15.7 Mathematical Problem Formulation

### 15.7.1 System State and Observations
Consider an $M$-fingered robotic hand with $n_q$ actuated joints holding an object of unknown, time-varying mass $m(t)$ and surface friction $\mu_i(t)$ at $M$ contact locations.
* **Proprioceptive State:** $\mathbf{x}_{\text{prop}}(t) = [\mathbf{q}(t), \dot{\mathbf{q}}(t), \boldsymbol{\tau}(t)] \in \mathbb{R}^{3 n_q}$.
* **Tactile Stream:** For each finger $i \in \{1, \dots, M\}$, optical tactile images $\mathbf{I}_{\text{tact}, i}(t) \in \mathbb{R}^{H \times W \times C}$ captured at $f_{\text{tact}} \ge 60\text{ Hz}$.

### 15.7.2 Multi-Contact Friction Cone Constraint
For each contact point $i$, contact forces decompose into scalar normal force $f_{N, i} > 0$ and 2D tangential shear vector $\mathbf{f}_{T, i} \in \mathbb{R}^2$. Coulomb's dry friction law requires:
$$\| \mathbf{f}_{T, i}(t) \|_2 \le \mu_i(t) f_{N, i}(t)$$
To prevent crushing of delicate objects with structural compressive limit $F_{\text{damage}}$, normal forces are bounded:
$$f_{N, \min} \le f_{N, i}(t) \le F_{\text{damage}}$$

### 15.7.3 Uncertainty-Aware Safety Barrier
Let $\hat{\mu}_i(t)$ and $\hat{\mathbf{f}}_i(t)$ denote the estimated friction and contact wrench, with calibrated variance $\sigma_{\mu, i}^2(t)$ and $\sigma_{f, i}^2(t)$. We define the stochastic safety barrier function:
$$h_i(\mathbf{x}_t) = \hat{\mu}_i(t) \hat{f}_{N, i}(t) - \| \hat{\mathbf{f}}_{T, i}(t) \|_2 - k_{\text{safe}} \sqrt{\sigma_{\mu, i}^2 + \sigma_{f, i}^2}$$
where $k_{\text{safe}}$ is a risk-tolerance parameter corresponding to a certified confidence level $1 - \delta$.

### 15.7.4 Robust Predictive Safety Filter (Quadratic Program)
Given a nominal action command $\mathbf{u}_{\text{nom}}(t)$ generated by the high-level policy, the safety filter computes the safe joint command $\mathbf{u}^*(t)$ by solving:
$$\mathbf{u}^*(t) = \arg\min_{\mathbf{u}} \frac{1}{2} \| \mathbf{u} - \mathbf{u}_{\text{nom}}(t) \|_{\mathbf{W}}^2$$
subject to:
$$\dot{h}_i(\mathbf{x}_t, \mathbf{u}) + \alpha(h_i(\mathbf{x}_t)) \ge 0, \quad \forall i \in \{1, \dots, M\} \quad (\text{Discrete-Time CBF})$$
$$\boldsymbol{\tau}_{\min} \le \mathbf{M}(\mathbf{q})\mathbf{u} + \mathbf{C}(\mathbf{q}, \dot{\mathbf{q}})\dot{\mathbf{q}} + \mathbf{g}(\mathbf{q}) \le \boldsymbol{\tau}_{\max} \quad (\text{Torque Limits})$$
$$\mathbf{f}_{\text{grasp}}(\mathbf{u}) \le F_{\text{damage}} \quad (\text{Crush Protection})$$

The optimization is an active-set Quadratic Program executed at $\ge 100\text{ Hz}$ with a deterministic execution timeout of **$1.0\text{ ms}$**. If infeasibility occurs, the controller reverts to passive joint impedance damping.

---

## 15.8 Existing Methods and Experimental Baselines

To rigorously evaluate the proposed contribution, PROBE-1 will be benchmarked against four representative baselines:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       EXPERIMENTAL BASELINE TAXONOMY                                        │
├───────┬──────────────────────────────┬──────────────────────────────┬───────────────────────────────────────┤
│ ID    │ Baseline Architecture        │ Representation & Feedback    │ Primary Comparative Vulnerability     │
├───────┼──────────────────────────────┼──────────────────────────────┼───────────────────────────────────────┤
│ B1    │ Classical High-Gain Grip     │ Fixed target normal force    │ High crush rate on fragile objects;   │
│       │ Controller                   │ without tactile feedback     │ no adaptation to friction variations. │
├───────┼──────────────────────────────┼──────────────────────────────┼───────────────────────────────────────┤
│ B2    │ Reactive Slip-Triggered Grip │ PANDAS / GelSight incipient  │ Reactive delay; induces force chatter │
│       │ Squeeze                      │ slip threshold reflex        │ and over-squeezing under noise.       │
├───────┼──────────────────────────────┼──────────────────────────────┼───────────────────────────────────────┤
│ B3    │ Unconstrained Tactile RL /   │ Tactile diffusion policy     │ Open-loop chunk drift; no formal      │
│       │ Flow Policy (π0-style)       │ without safety filter        │ safety bounds on peak contact forces. │
├───────┼──────────────────────────────┼──────────────────────────────┼───────────────────────────────────────┤
│ B4    │ Deterministic Tactile MPC    │ CoorGrasp-style tactile MPC  │ Highly vulnerable to model mismatch   │
│       │ (Without Uncertainty)        │ assuming known parameters    │ when friction/mass vary dynamically.  │
└───────┴──────────────────────────────┴──────────────────────────────┴───────────────────────────────────────┘
```

---

## 15.9 Research Scope and Deliberate Exclusions

To ensure scientific rigor, depth, and experimental feasibility, the following areas are **deliberately excluded** from the first paper:

* **Exclusion 1: Large Vision-Language-Action Pretraining:** The research will not train a 3.8B VLA foundation model. High-level goal trajectories will use fixed or scripted manipulation motions to isolate physical contact dynamics from semantic vision-language noise.
* **Exclusion 2: Full Humanoid Locomotion & Whole-Body Momentum:** The research will not deploy on a bipedal walking humanoid. Experiments will be conducted on an isolated multi-finger dexterous hand mounted on a compliant robot arm.
* **Exclusion 3: Long-Horizon Natural Language Autonomy:** The research will not evaluate multi-stage semantic reasoning (e.g., "clean the kitchen").
* **Exclusion 4: Cross-Embodiment Generalization:** The research will not evaluate cross-morphology policy transfer across multiple distinct hand kinematic designs.
* **Exclusion 5: Unconditional Theoretical Safety Guarantees:** The research will not claim absolute mathematical safety guarantees independent of actuator saturation, contact modeling error, or extreme out-of-distribution dynamic shocks. Safety will be characterized statistically with certified confidence intervals.

---

## 15.10 Falsifiable Hypotheses and Success Criteria

The experimental program will test three concrete, falsifiable hypotheses:

* **Hypothesis H1 (Drop Prevention under Dynamic Friction):** Under continuous surface friction variations ($\mu \in [0.15, 0.85]$ induced via liquid lubricants), the uncertainty-aware safety controller maintains a lower object-drop rate than reactive squeeze baselines ($B2$) and unconstrained diffusion policies ($B3$) at a statistically significant level ($p < 0.01$).
* **Hypothesis H2 (Fragile Object Integrity):** Under abrupt payload mass increases ($\Delta m = +100\%$ via dynamic liquid pouring), the proposed safety filter bounds peak normal force strictly below $F_{\text{damage}}$, preventing crush damage while avoiding drops.
* **Hypothesis H3 (Real-Time Determinism):** The active-set QP safety filter converges in $\le 0.8\text{ ms}$ on embedded ARM64 hardware (P99.9 latency $\le 1.0\text{ ms}$), with zero deadline violations across $10,000$ consecutive control cycles.

### Measurable Output Metrics
Rather than assuming target percentages a priori, the evaluation will measure:
1. **Object-Drop Rate:** Fraction of trials resulting in complete grasp failure.
2. **Damage Violation Rate:** Fraction of trials where normal force exceeds $F_{\text{damage}}$.
3. **Grasp Survival Time ($t_{\text{survival}}$):** Duration stable grasp is maintained under continuous nonstationary perturbations.
4. **State Estimation RMSE:** Tracking error of estimated friction $\hat{\mu}$ and contact forces $\hat{\mathbf{f}}$.
5. **Expected Calibration Error (ECE):** Calibration quality of contact uncertainty $\hat{\sigma}$.
6. **Safety Filter Intervention Rate:** Frequency and magnitude of quadratic programming modifications ($\| \mathbf{u}^* - \mathbf{u}_{\text{nom}} \|$).
7. **End-to-End Latency Distribution:** P50, P95, and P99.9 execution times.

---

## 15.11 Dataset, Simulation, and Hardware Feasibility

### 15.11.1 The Tactile Data Reality & Resolution
* **The Reality:** As established in Document 11, the existing `GR00T-Teleop-G1` dataset contains no physical tactile measurements (`tactile_available = 0.0`). TacClaw-Infinity carries a Non-Commercial (CC BY-NC-SA 4.0) restriction.
* **The Resolution (Staged Feasibility Pipeline):**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       STAGED EXPERIMENTAL FEASIBILITY PIPELINE              │
├─────────┬────────────────────────────┬──────────────────────────────────────┤
│ Stage   │ Environment & Platform     │ Objective & Deliverable              │
├─────────┼────────────────────────────┼──────────────────────────────────────┤
│ Stage 1 │ NVIDIA Isaac Lab 4.2       │ Pretraining & testing in Isaac Lab   │
│         │ (TacSL Visuotactile Sim)   │ using GPU elastomeric deformation    │
│         │                            │ and multi-variable domain randomiz.  │
├─────────┼────────────────────────────┼──────────────────────────────────────┤
│ Stage 2 │ Benchtop Single-Finger Rig │ Validating optical tactile shear,    │
│         │ (GelSight Mini / DIGIT)    │ friction estimation & calibration.   │
├─────────┼────────────────────────────┼──────────────────────────────────────┤
│ Stage 3 │ Multi-Fingered Dexterous   │ Closed-loop safe adaptation under    │
│         │ Hand (e.g. Allegro/DexH10) │ joint nonstationary mass & friction. │
├─────────┼────────────────────────────┼──────────────────────────────────────┤
│ Stage 4 │ Humanoid Arm Integration   │ Full system integration and long-term│
│         │ (Unitree G1 / Arm Mount)   │ research expansion (Future work).    │
└─────────┴────────────────────────────┴──────────────────────────────────────┘
```

1. **Stage 1 (Isaac Lab TacSL Visuotactile Simulation):** NVIDIA Isaac Lab provides GPU-accelerated TacSL tactile simulation, rendering tactile RGB elastomer deformation and normal/shear contact force grids. This enables training the uncertainty-aware estimator over $10^6$ randomized nonstationary transitions without hardware risk.
2. **Stage 2 & 3 (Benchtop Multi-Finger Hardware Testbed):** Physical validation will execute on an isolated multi-fingered dexterous hand equipped with optical tactile fingertips, evaluating real liquid pouring and variable-friction object grasping.

---

## 15.12 Risks, Limitations, and Go / No-Go Decision

| Technical Risk | Likelihood | Impact | Concrete Engineering Mitigation |
| :--- | :--- | :--- | :--- |
| **Sim-to-Real Tactile Gap** | High | High | Train estimator with extreme domain randomization over elastomer stiffness, optical lighting, and friction; fine-tune with small physical calibration set ($N=50$ grasps). |
| **QP Solver Infeasibility** | Medium | Moderate | Enforce soft-slack formulation on barrier constraints with high penalty weight; engage passive joint damping on solver timeout. |
| **Tactile Sensor Wear** | High | Moderate | Use standardized replaceable silicone gel pads; recalibrate optical zero-point baseline automatically at open-hand state. |
| **Actuator Torque Saturation**| Medium | High | Incorporate explicit actuator torque limits directly into QP inequality constraints. |

### Final Decision Verdict

```
                     ┌───────────────────────────────────────┐
                     │          DECISION: FORMAL GO          │
                     │    (PRIMARY THESIS SELECTED & BOUND)  │
                     └───────────────────────────────────────┘
```

**HOROS PROBE-1 formally selects:**  
*Uncertainty-Aware Safe Adaptation for Multifingered Grasping Under Jointly Changing Contact Conditions* as its primary research thesis.

---

## 15.13 Roadmap to Document 16

With Document 15 finalized and committed:
* **Next Deliverable:** **Document 16: Mathematical Methodology and Experimental Design (`research/PROBE-1/16-mathematical-method-design.md`)**
  * Derive the exact neural uncertainty estimation architecture (conformalized quantile regression / ensemble variance).
  * Formalize the discrete-time stochastic Control Barrier Function equations.
  * Define the complete Isaac Lab TacSL simulation benchmark protocol and baseline implementation blueprints.
