# HOROS First-Party Model Program: PROBE-1
## 07 — Phased Experiment Plan & Training Roadmap

### Phase 1: Physical Perception & Representation Pre-training (Weeks 1–4)
* **Compute:** 32x NVIDIA H100 80GB SXM5.
* **Data:** Ego4D, DROID, RH20T visual streams + 10M synthetic frames.
* **Objective:** Train multimodal physical perception backbone. Self-supervised objectives:
  1. Masked visual autoencoding with 3D point cloud reconstruction.
  2. Action-conditioned future latent visual feature prediction (temporal contrastive learning).
  3. Contact patch segmentation and depth estimation from monocular camera inputs.

### Phase 2: Cross-Embodiment Base Policy Training (Weeks 5–8)
* **Compute:** 64x NVIDIA H100 GPUs.
* **Architecture:** PROBE-1 Base (3.8B parameter sparse MoE visual-language trunk + 45M flow matching head).
* **Dataset:** Unified HOROS-Embodied-v1 mix (OXE curated, DROID, Isaac Lab synthetic sweeps).
* **Objective:** Train generalized flow-matching velocity field $v_\theta(a_t, t, \mathbf{o}_t, \mathbf{g})$ to predict continuous trajectory chunks given task text instructions and visual state.

### Phase 3: Tactile & High-Rate Proprioceptive Conditioning (Weeks 9–12)
* **Compute:** 32x NVIDIA H100 GPUs.
* **Dataset:** 5,000 hours of bi-manual teleoperation data with synchronized GelSight tactile arrays and 100 Hz joint torque telemetry.
* **Objective:** Fine-tune low-level Flow-Matching policy with dense tactile and torque inputs. Optimize inference engine using TensorRT-LLM and FlashAttention-3 for $< 10$ ms latency.

### Phase 4: Sim-to-Real Reinforcement Learning & Distillation (Weeks 13–16)
* **Compute:** 32x H100 (Sim parallel rollouts) + Physical Humanoid Fleet (4 rigs).
* **Method:** Policy improvement via safe Reinforcement Learning with Human Feedback (RLHF) and Real-World Failure Mining (RFT - Replay Fine-Tuning).
* **Verification:** Full evaluation across Tier 1, Tier 2, and Tier 3 benchmark suites.
