# HOROS First-Party Model Program: PROBE-1
## 01 — Comprehensive Literature Review

### 1. Taxonomy of Embodied Foundation Models
The current landscape of robotic foundation models can be categorized into four distinct architectural lineages:

1. **Discrete Autoregressive VLAs (Vision-Language-Action):**
   * *RT-1 (Brohan et al., 2022) & RT-2 (Brohan et al., 2023):* Formulated robot action prediction as text token generation by tokenizing continuous action spaces into discrete bins (typically 256 bins per dimension). While leveraging pre-trained vision-language representations, this formulation incurs high inference latency ($>150$ ms TTFT), poor spatial resolution, and inability to capture multimodal trajectory distributions.
   * *OpenVLA (Kim et al., 2024):* Open-source 7B parameter VLA based on Llama-2/Prismatic VLM, demonstrating strong semantic generalization but suffering from low control frequency (3–5 Hz) and absence of proprioceptive and tactile grounding.

2. **Diffusion & Flow Matching Policies:**
   * *Diffusion Policy (Chi et al., 2023):* Formulated visual manipulation as continuous trajectory denoising via DDPM/DDIM. Excellent at capturing multimodal human demonstration distributions, avoiding discretization artifacts.
   * *Action Chunking with Transformers (ACT) (Zhao et al., 2023):* Combines Conditional VAE with transformer decoders to predict temporal action sequences (chunks), significantly mitigating compounding execution errors.
   * *π0 (Physical Intelligence, 2024):* Flow matching policy built upon a visual language trunk, operating at 50 Hz through continuous-time flow generation. Represents SOTA in complex physical dexterity but remains closed-weight and proprietary.

3. **Pretrained Multi-Embodiment Transformers:**
   * *Octo (Team Octo et al., 2024):* Diffusion-based policy trained on Open X-Embodiment (OXE). Employs modular tokenizers for different robot observation and action spaces.
   * *RoboCat (Bousmalis et al., 2023):* Self-improving foundation agent producing actions across diverse robot arms through iterative data generation and fine-tuning.

4. **World Models for Embodied AI:**
   * *Genie (Bruce et al., 2024) & GAIA-1 (Wayve, 2023):* Action-conditioned video generative world models predicting future visual latent states.
   * *UniSim (Yang et al., 2023):* Universal physics simulator combining simulation data and real-world video into an action-controllable world model.

### 2. Critical Evaluation & Theoretical Limitations
* **The Tokenization Dilemma:** Discretizing continuous 6-DoF poses and joint velocities into uniform tokens breaks kinematic continuity and introduces quantization noise, severely impairing fine-tolerance assembly ($<2$ mm tolerances).
* **The Bandwidth-Latency Mismatch:** Large language/visual backbones require 50–200 ms forward pass times, making them structurally incompatible with the 100–500 Hz control loops required for stable legged locomotion and contact impact absorption.
* **Tactile Blindness:** Almost all contemporary VLAs operate purely on vision and language, ignoring tactile, slip, and proprioceptive dynamics. Vision is inherently occluded during contact manipulation.
