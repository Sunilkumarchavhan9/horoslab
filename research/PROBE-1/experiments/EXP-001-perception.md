# HOROS PROBE-1 Experiment Specification
## EXP-001: Multimodal Physical Perception Baseline

* **Experiment ID:** EXP-001
* **Title:** Multimodal Physical State Estimation Under Visual Occlusion
* **Research Hypothesis:** Hypothesis 1 — Transforming multi-rate sensory streams (RGB-D, proprioception, 6-axis IMU, and tactile arrays) into a unified physical representation reduces 6-DoF state-estimation error by $\ge 35\%$ during visual occlusion compared to vision-only foundation baselines.
* **Research Question:** Does adding high-frequency proprioception, IMU, and tactile tokens prevent state estimation divergence when external camera views are obstructed by robot limbs or handled objects?
* **Baseline Models:**
  1. *Vision-Only Baseline:* SigLIP-SO400M + DINOv2 visual backbone (OpenVLA perception style).
  2. *Vision + Proprioception Baseline:* Octo modular tokenization baseline (RGB + low-dimensional joint positions).
* **Proposed Method:** PROBE-1 Multimodal Physical Tokenizer: Dual visual stream + 200 Hz joint twist encoder + 6-DoF IMU acceleration encoder + high-density optical tactile shear field tokenizer mapped into a shared 512-dimensional embedding space.
* **Datasets:**
  * In-distribution: DROID (350 hrs) + Humanoid Everyday (80 hrs).
  * Out-of-distribution: 100 physical Unitree G1 walking and reaching trials collected with artificial visual occlusions (cardboard obstructions, direct camera lens masking).
* **Training Configuration:**
  * 32x NVIDIA H100 GPUs (FSDP mixed-precision bfloat16).
  * Masked Physical Autoencoding (MPA) loss with 40% random sensory masking.
  * Batch size: 256; Learning rate: $2 \times 10^{-4}$ with cosine decay.
* **Evaluation Environment:** Physical Unitree G1 humanoid walking across a 10-meter indoor laboratory path tracked by a calibrated Vicon optical motion capture system (millimeter-level ground truth).
* **Hardware Requirements:** Onboard NVIDIA Jetson Thor / Drive Thor connected to G1 low-level sensor bus via CAN-FD / EtherCAT.
* **Independent Variables:** Sensory input configuration: (1) Vision-only, (2) Vision + Depth, (3) Vision + Proprio + IMU, (4) Full Multimodal Physical Suite.
* **Dependent Variables:** 6-DoF base pose error (mm / degrees), joint angle RMSE (rad), state estimation latency (ms).
* **Control Variables:** Robot walking trajectory, ambient lighting, walking velocity ($1.2\text{ m/s}$), floor friction.
* **Metrics:** Translation error $e_{\text{trans}}$, rotation error $e_{\text{rot}}$, temporal consistency jitter $\sigma_{\text{jitter}}$, P95 inference latency.
* **Sample-Size Justification:** $N = 100$ physical walking trials under identical path conditions provides $95\%$ power to detect a $2.0$ mm translation difference at $\alpha = 0.01$.
* **Statistical Analysis:** Two-way repeated-measures ANOVA with Tukey's HSD post-hoc test; 95% bootstrap confidence intervals.
* **Ablation Studies:**
  * Ablate IMU tokens to assess drift accumulation.
  * Ablate tactile tokens during hand-table contact phases.
  * Vary visual occlusion duration ($0.5\text{s}, 1.0\text{s}, 2.0\text{s}$).
* **Failure Conditions:** Translation error exceeds $25$ mm during 1.0 s of occlusion, or P95 latency exceeds $5.0$ ms.
* **Reproducibility Requirements:** Docker container with pinned CUDA 12.4, PyTorch 2.5, Vicon tracker bridge, and immutable dataset SHA-256 hashes.
* **Expected Outcome:** Multimodal fusion maintains $< 8$ mm translation error under complete visual occlusion, whereas vision-only baselines diverge to $> 45$ mm.
* **Decision Criteria:** Hypothesis 1 is supported if the Full Multimodal Suite achieves $\ge 35\%$ lower translation/rotation error ($p < 0.01$) with P95 latency $< 5.0$ ms.

