# HOROS First-Party Model Program: PROBE-1
## 04 — Architecture Comparison & Trade-off Study

### 1. Candidate Architectures Evaluated

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Candidate A: Monolithic Autoregressive Transformer (OpenVLA / RT-2 Style)   │
│ [Sensors + Text] ──► [Large 7B-14B Autoregressive LLM] ──► [Discrete Action]│
└─────────────────────────────────────────────────────────────────────────────┘
  ❌ Pros: Maximum semantic reasoning transfer from LLMs.
  ❌ Cons: Severe latency (>150ms), action quantization jitter, no high-rate feedback.

┌─────────────────────────────────────────────────────────────────────────────┐
│ Candidate B: Hybrid Visual Backbone + Denoising Diffusion Head (Octo Style) │
│ [Vision ViT] ──► [Cross-Attention] ──► [Diffusion UNet/Transformer] ──────►  │
└─────────────────────────────────────────────────────────────────────────────┘
  ⚠️ Pros: Continuous action distribution, good multimodal trajectory capture.
  ⚠️ Cons: 10-20 denoising steps require high compute; marginal tactile support.

┌─────────────────────────────────────────────────────────────────────────────┐
│ Candidate C (Selected for PROBE-1):                                         │
│ Dual-Frequency Hierarchical Flow VLA (HOROS-DualFlow)                       │
│                                                                             │
│ [High-Level Semantic Stream (10 Hz)]                                        │
│  Vision-Language Backbone (3B-7B MoE) ──► Latent Task Embedding              │
│                                                   │                         │
│                                                   ▼                         │
│ [Low-Level Flow Matching Controller (100 Hz)]                               │
│  [Latent Goal] + [Proprio + Tactile + IMU] ──► [Lightweight Flow MLP-Mixer] │
│                                                   │                         │
│                                                   ▼                         │
│                                         [32-step Action Chunk (0.32s)]      │
│                                                   │                         │
│                                                   ▼                         │
│                                    [Independent Safety Verifier]            │
└─────────────────────────────────────────────────────────────────────────────┘
  ✅ Pros: Sub-10ms control step, zero discretization loss, continuous flow.
```

### 2. Deep Comparison Matrix

| Architectural Metric | Monolithic VLA (A) | Diffusion Policy (B) | PROBE-1 DualFlow (C) |
| :--- | :--- | :--- | :--- |
| **High-Level Visual Reasoner** | 7B-14B Dense Transformer | None / Pre-trained ViT | 3.8B Sparse MoE (1.1B active) |
| **Low-Level Motor Generator** | Autoregressive Next-Token | 100M DDIM Diffusion Model | 45M Flow-Matching Transformer |
| **Action Parameterization** | Discretized ($N=256$) | Continuous ($\mathbb{R}^D$) | Continuous Flow Velocity field |
| **Control Rate** | 3–5 Hz | 15–30 Hz | **100–200 Hz** |
| **Inference Latency (TTFT)** | 180 ms | 65 ms | **8.5 ms** (Low-level flow step) |
| **Tactile Integration** | Textualized / Tokenized | Tokenized Sensor Vector | Native Temporal Point Cloud / Force Tensor |
| **Multi-modal Action Density**| Poor (argmax or temp sample)| High (captures modes) | **Highest (continuous optimal transport)** |

### 3. Selection Rationale for PROBE-1
The Dual-Frequency Flow Matching architecture is selected because humanoid robotics cannot compromise on control frequency. A robot arm dropping an object requires motor torque adjustments within 20 milliseconds; waiting 180 ms for an autoregressive LLM to emit 29 discrete tokens inevitably results in dropped objects or hardware damage. Decoupling high-level vision-language planning from low-level flow generation delivers SOTA semantic reasoning with hard real-time reactive control.
