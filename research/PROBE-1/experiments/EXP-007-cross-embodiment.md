# HOROS PROBE-1 Experiment Specification
## EXP-007: Cross-Embodiment Centroidal Momentum Transfer

* **Experiment ID:** EXP-007
* **Title:** Zero-Shot and Few-Shot Cross-Embodiment Policy Transfer via Centroidal Dynamics
* **Research Hypothesis:** Hypothesis 4 — Projecting multimodal humanoid locomotion and manipulation trajectories into morphology-invariant centroidal momentum coordinates ($h_{\text{lin}}, h_{\text{ang}}$) and kinematic screw spaces enables zero-shot or low-shot ($\le 50$ demonstrations) adaptation to an unseen humanoid embodiment, achieving $\ge 70\%$ task success compared to $< 25\%$ for direct unnormalized joint-space policy transfer.
* **Research Question:** Can a foundation model trained primarily on one humanoid morphology (e.g., Unitree H1: $1.8\text{ m}, 47\text{ kg}$) effectively control a structurally disparate humanoid (e.g., Unitree G1: $1.3\text{ m}, 35\text{ kg}$) without retraining the foundational physical trunk?
* **Baseline Models:**
  1. *Direct Joint Angle VLA:* Foundation model mapping tokens directly to raw normalized joint target positions ($q \in \mathbb{R}^{D}$).
  2. *Embodiment ID Token Conditioned Model:* Model conditioned on categorical embodiment tokens (`embodiment_id = H1` vs `G1`) with independent linear output projection heads per robot.
  3. *Unconstrained Retrained Policy:* Baseline policy trained from scratch on 50 G1 demonstrations (sample efficiency baseline).
* **Proposed Method:** PROBE-1 Centroidal Dynamics Transfer Head:
  * Policy outputs invariant spatial wrench and centroidal momentum trajectories: $\dot{h}_{\text{base}} = [f_{\text{ext}}; \tau_{\text{ext}}] \in \mathbb{R}^6$ and operational space end-effector twists.
  * Embodiment-specific Whole-Body Kinematics & Inverse Dynamics Layer: Maps centroidal momentum targets into robot-specific joint torques/positions using robot URDF kinematics and mass matrix $M(q)$.
* **Datasets:**
  * Pretraining Source: 500 hours of Unitree H1 humanoid walking, payload carrying, and manipulation demonstrations (from Stanford Humanoid Everyday and synthetic Isaac Lab logs).
  * Target Adaptation Split: 0 to 50 physical Unitree G1 teleoperated demonstrations for target tasks (walking over obstacles, carrying a box, placing a cup).
* **Training Configuration:**
  * 32x NVIDIA H100 GPUs, bfloat16.
  * Pretrained trunk frozen; fine-tuning only the lightweight embodiment-specific low-level adapter weights (2M parameters) with LoRA rank 16 on target robot data.
* **Evaluation Environment:**
  * Digital: Isaac Sim transfer tests across 3 humanoid URDFs (Unitree H1, Unitree G1, Boston Dynamics Atlas model).
  * Physical Hardware: Unitree G1 humanoid executing tasks trained primarily on H1 demonstration data.
* **Hardware Requirements:** Unitree G1 and Unitree H1 humanoid robots with onboard real-time compute (Jetson Orin/Thor) and external motion tracking.
* **Independent Variables:**
  1. Representation space: Direct joint angles vs. embodiment tokens vs. invariant centroidal momentum coordinates.
  2. Adaptation data budget: $N_{\text{adapt}} \in \{0, 10, 25, 50, 100\}$ target robot demonstrations.
* **Dependent Variables:** Task success rate (%), fall/instability rate, whole-body balance margin (Zero-Moment Point deviation from support polygon), tracking error of target end-effector path.
* **Control Variables:** Target path geometry, walking speed, floor friction, obstacle dimensions.
* **Metrics:** Few-shot task success rate, sample efficiency curve (success vs. demonstration count), mean ZMP tracking margin ($d_{\text{ZMP}}$).
* **Sample-Size Justification:** $N = 50$ physical test trials per adaptation condition ($5 \times 50 = 250$ trials) provides $> 90\%$ statistical power to verify a $30\%$ absolute difference in task success at $\alpha = 0.01$.
* **Statistical Analysis:** Mixed-design ANOVA (representation space $\times$ sample size) with post-hoc pairwise t-tests with Bonferroni correction.
* **Ablation Studies:**
  * Ablate centroidal momentum coordinates and evaluate operational space Cartesian end-effector targets alone.
  * Evaluate transfer under artificial mass variations ($\pm 20\%$ torso mass error in URDF).
  * Evaluate cross-embodiment transfer with mismatched degrees of freedom (23-DoF H1 to 29-DoF G1).
* **Failure Conditions:** Robot falls on $> 30\%$ of runs, ZMP escapes the support polygon during steady gait, or end-effector tracking diverges by $> 15\text{ cm}$.
* **Reproducibility Requirements:** Exact URDF/MJCF files for Unitree H1 and G1, public Git commit of centroidal projection mapping library, and standardized calibration routines.
* **Expected Outcome:** Zero-shot centroidal transfer achieves $55\%$ success on G1; fine-tuning with only 25 demonstrations elevates success to $78\%$, whereas direct joint policies fail ($< 10\%$ success) due to mismatched kinematic kinematic links.
* **Decision Criteria:** Hypothesis 4 is supported if the centroidal momentum representation achieves $\ge 70\%$ success with $\le 50$ target robot demonstrations and shows statistically superior zero-shot stability ($p < 0.001$) over direct joint policies.

