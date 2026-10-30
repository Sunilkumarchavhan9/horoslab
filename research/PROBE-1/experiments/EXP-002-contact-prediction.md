# HOROS PROBE-1 Experiment Specification
## EXP-002: Contact-Aware Anticipatory Slip Prediction

* **Experiment ID:** EXP-002
* **Title:** Anticipatory Friction Cone Margin & Slip Modeling
* **Research Hypothesis:** Hypothesis 2 — Explicitly supervising an anticipatory contact prediction head with predicted friction cone margin $\Delta \mu_{t+H}$ enables proactive grip regulation, increasing grasp stability by $\ge 40\%$ and detecting slip $\ge 25$ ms prior to physical onset.
* **Research Question:** Can learned contact normal and shear prediction anticipate impending slip under dynamic torso accelerations, compared to purely reactive tactile controllers?
* **Baseline Models:**
  1. *Reactive GelSight Baseline:* SOTA optical slip detector (Yuan et al., MIT) executing grip increases only after shear displacement exceeds $0.5$ mm.
  2. *Current-Based Grip Baseline:* Standard robot gripper current/torque thresholding policy.
* **Proposed Method:** PROBE-1 Anticipatory Friction Head: Predicts contact normal force $\hat{F}_N$ and tangential shear $\hat{F}_T$ over a 50 ms future window conditioned on commanded torso momentum. Computes margin $\Delta \mu = \mu F_N - \|F_T\|$; modulates motor current before shear slips.
* **Datasets:**
  * 50,000 synthetic contact interactions in Isaac Lab with varying friction coefficients ($\mu \in [0.1, 0.9]$).
  * 2,000 physical contact grasp sequences collected on HOROS tactile test cell.
* **Training Configuration:**
  * 8x H100 GPUs; Multi-task loss combining normal angle MSE, shear magnitude MSE, and binary slip cross-entropy.
  * Optimizer: AdamW, lr: $1 \times 10^{-4}$, weight decay: $0.01$.
* **Evaluation Environment:** Unitree G1 dexterous hand mounted on a dynamic 3-axis motion rig equipped with an external ATI Mini40 6-axis load cell.
* **Hardware Requirements:** High-density optical tactile fingertips (GelSight / DIGIT) sampled at 60 Hz + 500 Hz ATI load cell ground truth.
* **Independent Variables:** Object surface material (smooth acrylic, polished metal, oiled glass, deformable rubber, dry wood) and torso acceleration ($0.5\text{ m/s}^2$ to $3.0\text{ m/s}^2$).
* **Dependent Variables:** Slip detection lead time $\Delta t_{\text{lead}}$ (ms), micro-slip displacement (mm), object drop count.
* **Control Variables:** Grip initial contact position, object weight ($0.2\text{ kg} - 1.5\text{ kg}$), ambient temperature.
* **Metrics:** Slip anticipation lead time ($\text{ms}$), contact normal angular error ($\theta_{\text{normal}}$), grasp stability ratio ($G_{\text{stab}}$), drop rate ($R_{\text{drop}}$).
* **Sample-Size Justification:** $N = 200$ dynamic shake-and-accelerate trials across 20 challenge objects ($90\%$ power to detect a $15$ ms lead time delta at $\alpha = 0.01$).
* **Statistical Analysis:** Paired t-tests for continuous lead time; Fisher's exact test for drop failure counts; 95% bootstrap confidence intervals.
* **Ablation Studies:**
  * Without tactile sensing (joint currents only).
  * Binary contact switch instead of continuous optical shear maps.
  * Zero anticipation horizon ($H=0$, pure reactive mode).
* **Failure Conditions:** Slip lead time $< 0$ ms (reactive only), or normal angular error $> 20^\circ$.
* **Reproducibility Requirements:** Raw load cell CSV traces, tactile video clips, and model weights archived with deterministic test scripts.
* **Expected Outcome:** PROBE-1 detects impending slip $28\text{--}35$ ms before physical displacement occurs, eliminating drops during dynamic motion.
* **Decision Criteria:** Hypothesis 2 is supported if grasp stability increases by $\ge 40\%$ and mean slip lead time is $\ge 25$ ms ($p < 0.01$) without crushing delicate objects.

