# HOROS PROBE-1 Experiment Specification
## EXP-003: Action-Conditioned Dynamics & SDF Rollout

* **Experiment ID:** EXP-003
* **Title:** Action-Conditioned Multi-Step Dynamics Prediction Under Signed Distance Field Constraints
* **Research Hypothesis:** Hypothesis 3 — Conditioning an action-conditioned latent world model on explicit geometric Signed Distance Fields (SDFs) and non-penetration penalties bounds multi-step rollout error ($\text{NFPE}$) below $15.0\%$ over a 50-step horizon ($1.0$ second) without physical inter-penetration.
* **Research Question:** Can a neural world model accurately forecast 32-DoF humanoid physical trajectories without experiencing the compounding autoregressive drift common in unconstrained video models?
* **Baseline Models:**
  1. *Unconstrained RSSM Baseline:* DreamerV3 categorical state-space model trained on whole-body humanoid states.
  2. *Action-Conditioned Diffusion Baseline:* UniSim / AVDC style latent diffusion model.
* **Proposed Method:** PROBE-1 Geometry-Constrained Latent World Model: Causal transformer trunk operating on vector-quantized physical state tokens, regularized with an explicit non-penetration barrier loss:
  $$\mathcal{L}_{\text{SDF}} = \max(0, -\phi(\hat{\mathbf{x}}_{\text{contact}}))$$
  where $\phi(\mathbf{x})$ is the signed distance field computed from head stereo depth.
* **Datasets:**
  * 100,000 multi-step trajectories from Isaac Lab H1/G1 simulations + 10,000 real trajectories from Humanoid Everyday.
* **Training Configuration:**
  * 16x NVIDIA H100 GPUs (FSDP); batch size: 128 chunks; sequence length: 64 steps.
  * Optimizer: AdamW, lr: $1.5 \times 10^{-4}$ with warm-up.
* **Evaluation Environment:** Isaac Sim 4.2 physics environment with randomized obstacle configurations and tabletop objects.
* **Hardware Requirements:** Dedicated dual-GPU inference node (NVIDIA RTX 4090 / L40S) for evaluating rollout latency.
* **Independent Variables:** Prediction horizon length $H \in \{10, 25, 50\}$ steps and presence of the geometric SDF constraint loss.
* **Dependent Variables:** Normalized Future Prediction Error ($\text{NFPE}$), penetration depth (mm), execution time per predicted step (ms).
* **Control Variables:** Robot kinematics (Unitree G1 URDF), initial state distribution, commanded action chunk magnitude.
* **Metrics:** Dimensionless Normalized Future Prediction Error ($\text{NFPE}(H)$), collision boundary false negative rate, penetration volume ($V_{\text{pen}}$).
* **Sample-Size Justification:** $N = 1,000$ test trajectory segments from held-out real and simulated validation sets.
* **Statistical Analysis:** Repeated-measures ANOVA over horizon steps; Mann-Whitney U test for non-normal penetration distributions.
* **Ablation Studies:**
  * Remove SDF constraint loss (evaluating pure neural trajectory drift).
  * Vary latent quantization codebook size ($K \in \{256, 1024, 4096\}$).
  * Test forward prediction with vs. without measured joint torque history.
* **Failure Conditions:** $\text{NFPE}(H=50) > 0.150$ ($15.0\%$), or predicted inter-penetration depth $> 5.0$ mm.
* **Reproducibility Requirements:** Pinned random seeds for rollout initialization; deterministic Isaac Sim physics stepper ($dt = 0.005$ s).
* **Expected Outcome:** Unconstrained baselines drift to $\text{NFPE} \approx 32\text{--}45\%$ by step 50 with frequent object merging, while PROBE-1 maintains $\text{NFPE} \le 12.8\%$ with zero penetration.
* **Decision Criteria:** Hypothesis 3 is supported if $\text{NFPE}(H=50) \le 0.150$ and penetration violations occur in $< 0.1\%$ of rollout steps ($p < 0.001$).
