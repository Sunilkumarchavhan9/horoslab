# HOROS PROBE-1 — Research-002
## Trustworthy Action-Conditioned Contact World Models
**Research Charter: v0.1**  
**Date:** 2 November 2026  
**Program:** HOROS PROBE-1 — Humanoid Robotics  
**Status:** Problem framing and prior-work audit in progress. No model training or novelty claim has been approved.

---

### 1. Program Placement
Research-002 is the second research project within HOROS PROBE-1. It extends the program's established focus on physical perception, contact dynamics, slip, collision, action-conditioned future states, robot task prediction, and recovery.

It is not a separate model program and does not replace PROBE-1's first research paper on uncertainty-aware safe adaptation for multifingered grasping.

---

### 2. Problem Statement
A robot needs to predict the physical consequences of a candidate action before executing it. In contact-rich manipulation, small errors in friction, contact geometry, compliance, or timing can change a predicted grasp, insertion, or push into a slip, collision, or failure.

A learned world model introduces a second problem: a planner can repeatedly search the model for actions with high predicted value. It may therefore select actions in regions where the model is systematically overconfident or wrong. Average prediction error on a held-out dataset does not reveal whether the model remains trustworthy on the actions that the planner actually chooses.

#### Central Research Question
> **How can a learned, action-conditioned contact world model predict multi-step physical outcomes and expose unreliable predictions when a planner searches over candidate actions, especially around contact-mode transitions and under unseen physical conditions?**

#### Supporting Questions
1. How does prediction error and uncertainty change across free motion, contact onset, sticking, sliding, slip, separation, and impact?
2. Does planner optimization create a measurable gap between model-predicted outcomes and outcomes realized in the simulator or physical system?
3. Do uncertainty estimates remain calibrated on the planner-selected action distribution, rather than only on the offline training or test distribution?
4. Can an independent runtime safety mechanism reject unreliable or unsafe candidates without making the controller excessively conservative?

---

### 3. Working Hypothesis
A contact world model evaluated only by average next-state error can appear accurate while remaining unreliable at contact transitions and on actions selected by an optimizing planner. Evaluation conditioned on contact regime, rollout horizon, physical distribution shift, and planner selection will expose failure modes that conventional average-case evaluation misses. A calibrated uncertainty signal combined with independent runtime assurance should reduce unsafe planner decisions at a measurable performance cost that can be quantified.

*This is a hypothesis. It is not yet an established result.*

---

### 4. Prior-Work Audit: What is Already Established

| Work | Established Contribution | Consequence for Research-002 |
| :--- | :--- | :--- |
| **OmniVTA (2026)**, *arXiv:2603.19201* | Visuo-tactile world modeling, short-horizon contact evolution, large visuo-tactile-action dataset, contact-aware policy and fast tactile feedback. | We cannot claim that predicting tactile/contact evolution and closing the loop is new by itself. |
| **ContactWorld (2026)**, *arXiv:2606.13877* | Benchmark and representation study over 12 contact-rich tasks, with visual, point-cloud and tactile modalities and model-predictive planning. | A benchmark cannot simply be described as the first contact-rich vision-tactile benchmark. Its existing tasks and data should be evaluated for reuse. |
| **CaPTURe (2026)**, *arXiv:2608.09166* | Particle-based, contact-aware conformal prediction regions for one-step future configurations in stratified configuration spaces; conditions calibration on state, action, and candidate future contact stratum; evaluates a marble maze and peg-in-hole insertion. | Contact-aware uncertainty and conformal coverage are already studied. Our distinction must concern learned multi-step world-model predictions under planner-selected actions, not merely contact-conditioned calibration. |
| **DexTouch-WM (2026)**, *arXiv:2609.20649* | Action-conditioned visual and bilateral tactile prediction, with human-to-robot data transfer and use as a surrogate environment. | Action-conditioned tactile world modeling and transfer are established directions. |
| **DexTacWAM (2026)**, *arXiv:2609.24976* | Visuo-tactile world-action modeling of multi-finger contact evolution for dexterous manipulation. | A new visuo-tactile world-action architecture alone would be a weak novelty claim. |
| **TouchWorld (2026)**, *arXiv:2607.07287* | Hierarchical predictive/reactive tactile control for contact-rich manipulation. | Fast tactile correction and hierarchical planning have close prior art. |
| **RoboWM-Bench (2026)**, *arXiv:2604.19092* | Embodiment-grounded evaluation of whether generated manipulation futures can be executed. | Visual realism alone is not enough; executable physical outcomes must be checked. |
| **Uncertainty-Aware Robotic WM (2025/2026)**, *arXiv:2504.16680* | Epistemic uncertainty and uncertainty-penalized offline model-based RL, including real-robot manipulation and locomotion. | General uncertainty-aware robotic world models are not new. We must isolate the contact- and planner-selection-specific failure mode. |
| **Imperfect World Models are Exploitable (2026)**, *arXiv:2605.15960* | Formalizes model exploitation as model-induced policy preference reversing the true-environment preference. | Planner/model exploitation already has a formal research foundation. Our evaluation should operationalize it in contact-rich robot manipulation. |
| **Policy-Aware Simulator Learning (2026)**, *arXiv:2605.29032* | Adversarial policy-aware simulator learning, critic-guided error discovery, and active data selection. | We cannot claim the general idea of policy-aware model learning or exploitation resistance as new. |

#### Preliminary Gap Candidate
The literature suggests a narrow, testable gap at the intersection of:
- learned multi-step, action-conditioned contact dynamics;
- calibration evaluated on actions selected by a planner, not only offline samples;
- contact-transition and physical-shift stress tests;
- closed-loop measurement of planner exploitation and runtime safety.

*Novelty status: candidate only. This review is not exhaustive. No claim of first, state of the art, or new method is authorized until the closest papers, supplementary material, code, and benchmark protocols have been compared directly.*

---

### 5. Benchmark Reuse and Implementation Feasibility
#### ContactWorld is the first baseline candidate
The public ContactWorld repository contains Isaac Gym environments for 12 contact-rich manipulation tasks, six sensing modalities, datasets/checkpoints, a JEPA-style vision-tactile world model, CEM planning, multi-step rollout evaluation, and closed-loop planning scripts. Its README states that default rollout evaluation uses ground-truth, zero, or random action modes with a six-step horizon, and that planner goal-offset settings include 12, 24, 36, and 48 steps. The visible model architecture source includes an action-conditioned recurrent predictor and multimodal vision/tactile fusion. A targeted source scan did not find explicit uncertainty/variance/log-variance terms in the inspected architecture file. This makes ContactWorld a strong starting point for a baseline replication and planner-selection stress test rather than building a new benchmark from zero.

- **Repository:** `https://github.com/PokuangZhou/ContactWorld`
- **Important environment constraint:** Its installation script clones ManiFeel, downloads an Isaac Gym Preview TacSL package, and stages additional assets. It requires a separate environment setup. HOROS should not run that installer inside the existing PROBE-1 Isaac Sim 5.1 / Isaac Lab 2.3 environment.

#### CaPTURe is the uncertainty baseline candidate
CaPTURe's stated target is a one-step prediction region for the next robot configuration, conditioned on state/action and the future contact stratum. It operates in a stratified configuration space and uses particle predictions with contact-aware conformal calibration. It should be reproduced or compared as a strong contact-aware uncertainty baseline. Research-002 must go beyond restating that capability by testing multi-step learned world-state prediction and planner-induced selection effects.

---

### 6. Proposed Experimental Scope
Start with a controlled simulation study. Do not begin by training the planned large dynamics head. First determine whether the benchmark and evaluation protocol expose a reproducible failure mode.

#### Candidate Tasks
1. **Peg-in-hole insertion:** clearance, alignment error, friction, contact onset, wedging, and insertion force.
2. **Grasp-and-lift under changing contact:** friction variation, object mass/centre-of-mass shift, incipient slip, and object drop.
3. **Push/slide with stick-slip transitions:** changing surface friction, force, object motion, and contact separation.

The first two tasks are the proposed minimum pair. The third is an extension if the first two produce a coherent evaluation protocol.

#### Observation/State Channels
- **Robot proprioception:** joint position, velocity, and commanded action.
- **Object state:** pose and velocity, with simulator ground truth retained for evaluation.
- **Contact state:** contact onset, contact locations, contact mode, normal/tangential force, and slip indicators.
- **Sensors:** RGB-D or point cloud plus force/tactile channels where the simulator supports them.
- **Physical parameters:** friction, mass, geometry, compliance, restitution, sensor noise, and action/actuator delay.

#### Prediction Contract
Given a history of observations and actions plus a candidate action or action chunk, predict a finite future horizon of task-relevant physical quantities:
- robot and object state evolution;
- contact-mode transitions;
- normal/tangential force or contact-wrench quantities;
- slip, separation, impact, insertion, or grasp-failure events;
- uncertainty associated with those predictions.

The first implementation should be state-centric and physically measurable. Pixel/video generation is not a requirement for the first experiment.

---

### 7. Experimental Design
#### Data Regimes
- **In-distribution:** train and test ranges overlap, with episode-level and random-seed separation.
- **Physical OOD:** held-out friction, mass, geometry, compliance, and sensor/actuator perturbations.
- **Transition stress:** targeted sampling around contact onset, stick-slip, separation, impact, and wedging.
- **Planner-selected:** actions/trajectories selected by optimization against the learned model, separated from passive or behavior-policy test data.

*Avoid leakage across train/validation/test by splitting physical configurations and episode seeds, not merely adjacent frames.*

#### Baseline Families to Implement or Reproduce
1. Deterministic action-conditioned dynamics model.
2. Probabilistic single model.
3. Deep ensemble or another epistemic-uncertainty baseline.
4. Contact-regime-conditioned calibration baseline.
5. Particle-based/contact-aware conformal baseline informed by CaPTURe.
6. Model-predictive planner with and without uncertainty penalties.
7. Independent safety filter/runtime monitor, evaluated separately from the learned model.

---

### 8. Metrics
- **Prediction quality:** multi-step RMSE on robot/object state and contact force across horizons $H \in \{1, 3, 5, 10, 20\}$.
- **Contact fidelity:** precision, recall, and F1 on contact-mode transitions and slip/separation events.
- **Uncertainty quality:** negative log-likelihood, expected calibration error (ECE), sharpness, and empirical coverage on defined confidence sets.
- **Planner exploitation gap:** performance drop or constraint-violation increase when switching from model-predicted reward/cost to ground-truth execution.
- **Closed-loop task performance:** task success rate, execution time, peak force, and damage/failure rates.
- **Safety assurance:** rate of rejected unsafe candidates and false-positive rejections of safe actions.

---

### 9. Candidate Contribution Package
1. A reproducible evaluation protocol for planner-selected, action-conditioned contact-world predictions.
2. A set of contact-transition and physical-shift stress tests that reveal calibration and exploitation failures.
3. A baseline comparison separating prediction quality, uncertainty quality, planner behavior, and independent runtime safety.
4. If a consistent failure mode is found, a new calibration/verification or data-acquisition method specifically targeted at that failure mode.

---

### 10. Explicit Exclusions for the First Phase
- Do not begin pretraining a 250M dynamics head yet.
- Do not claim a new tactile foundation model.
- Do not claim contact-aware conformal prediction as new.
- Do not conflate visual plausibility with physical correctness.
- Do not claim real-robot validation until hardware experiments have been conducted.
- Do not change the official project title unless the literature audit demonstrates that the current title is materially misleading.

---

### 11. Immediate Execution Sequence
1. **Read the closest work in full:** CaPTURe, ContactWorld, OmniVTA, DexTacWAM, DexTouch-WM, the uncertainty-aware robotic world model, Imperfect World Models are Exploitable, and Policy-Aware Simulator Learning.
2. **Build a paper-comparison matrix:** covering representation, predicted variables, action conditioning, horizon, uncertainty method, planner, contact regimes, OOD protocol, evaluation metrics, hardware/simulator, data/code availability, and limitations.
3. **Inspect ContactWorld and CaPTURe code/data:** to decide whether they can serve as baselines or whether a small custom Isaac Lab benchmark is required.
4. **Freeze the first two tasks:** environment version, physical randomization ranges, action representation, and train/validation/test split.
5. **Implement deterministic and probabilistic reference dynamics models:** before proposing a new method.
6. **Run the planner-selection stress test:** and only then select the research algorithm.

---

### 12. Decision Gate
Proceed to a new method only if the baseline experiment demonstrates at least one reproducible failure that existing baselines do not adequately resolve, such as:
- conditional uncertainty becomes miscalibrated around contact transitions;
- planner-selected actions have significantly worse error or risk than behavior-distribution actions;
- standard uncertainty penalties fail to detect model exploitation;
- a safety filter reduces violations but creates an unacceptable task-success or conservatism cost.

If existing methods already solve the measured problem, revise the research question rather than manufacture novelty.
