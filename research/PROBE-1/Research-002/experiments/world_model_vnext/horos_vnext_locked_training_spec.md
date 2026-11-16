# HOROS PROBE-1 — Research-002
## Authoritative Locked Training & Benchmark Specification: HOROS World Model vNext

**Document Reference:** `HOROS-P1-R002-SPEC-LOCKED-001`  
**Date:** November 16, 2026  
**Status:** ARCHITECTURE & BENCHMARK GATES AUTHORITATIVELY LOCKED (Training Awaiting Formal User Authorization)  
**Parent Manifest:** `manifests/horos_world_model_vnext_manifest.json` (Schema v1.1)  
**Parent Specification:** `experiments/world_model_vnext/horos_world_model_vnext_spec.md`  
**Superceded Drafts:** Resolves and supersedes the preliminary 4-layer/128-dim/20% MSE draft mentioned in `horos_training_readiness_update.md`.  

---

### 1. Architectural Reconciliation & Authoritative Lock

A divergence existed between early preliminary notes in `horos_training_readiness_update.md` (which referenced a lightweight 4-layer / 128-dim / 4-head draft targetting 20% MSE reduction) and the authoritative model manifest (`manifests/horos_world_model_vnext_manifest.json`) and specification (`experiments/world_model_vnext/horos_world_model_vnext_spec.md`).

This document formally locks the single approved architecture for HOROS World Model vNext:

| Architectural Hyperparameter | Preliminary Draft (Superceded) | Authoritative Locked Specification | Rationale for Lock |
| :--- | :--- | :--- | :--- |
| **Model Family** | HCTT-Base | **History-Conditioned Temporal Transformer (HCTT)** | Causal temporal attention over multi-modal interaction tokens |
| **Transformer Layers** | 4 | **6 Decoder Layers** | Required depth to model non-linear contact mode transitions and slip |
| **Hidden Dimension ($d_{\text{model}}$)** | 128 | **256** | Accommodates 23-D prelift + 15-D peg states mapped via task projections |
| **Attention Heads** | 4 | **8 Heads ($d_{\text{head}} = 32$)** | Allows parallel attention to wrench dynamics, inertia, and pad strain |
| **Positional Encoding** | Learned Absolute | **Rotary Position Embeddings (RoPE)** | Preserves relative temporal distance across rolling history windows |
| **Observation Window ($H_{\text{hist}}$)** | 10 steps ($100\text{ ms}$) | **10 steps ($100\text{ ms}$)** | Fully captures pad deformation dynamics and force rate of change |
| **Prediction Horizons** | 1, 5, 10 | **1, 3, 5, 10, 20 steps** | Validates both single-step contact stability and 20-step multi-horizon rollouts |
| **Privileged Leakage** | Barred | **STRICTLY FORBIDDEN** | Input strictly limited to continuous forces, pad strain, velocity, $\hat{p}(m_{t-1})$ |

---

### 2. Multi-Horizon Benchmark Acceptance Targets

The benchmark performance criteria relative to frozen baselines ($B1$ deterministic MLP, $B2$ probabilistic MLP, $B3$ 5-member ensemble, $B4$ conformal calibration) are locked as follows:

| Benchmark Criterion | Superceded Target | Authoritative Locked Gate | Baseline Performance ($B3$) | Verification Split |
| :--- | :--- | :--- | :--- | :--- |
| **Multi-Horizon MSE Reduction** | $\ge 20\%$ | **$\ge \mathbf{40.0\%}$ Reduction** | $0.0084$ (Task 1), $0.0142$ (Task 2) | Multi-step rollouts ($H \in [5, 20]$) |
| **Latent Friction Identifiability** | Unspecified | **$R^2 \ge 0.60$** ($\rho \ge 0.65$) | $R^2 = 0.38$ (Phase 3.7.2 $C3$) | Causal interaction histories ($L=10$) |
| **Latent Mass Identifiability** | Passive dwell | **$R^2 \ge 0.60$** ($\rho \ge 0.70$) | $R^2 = -0.07$ (Passive dwell) | Closed-loop force-gated micro-lift ($350\text{ ms}$) |
| **Contact Mode Macro F1** | $\ge 0.85$ | **$\ge \mathbf{0.85}$** (All 5 modes) | $0.62$ ($B3$ naive) | Non-privileged observable sensor features |
| **OOD Discrimination AUROC** | Unspecified | **$\ge \mathbf{0.85}$** | $0.7946$ (LowMu), $0.8247$ (Regime A) | CUSUM innovation & history embeddings |
| **Conformal Calibration Coverage** | $\ge 90.0\%$ | **$\ge \mathbf{90.0\%}$ Across All Modes** | Mode-dependent ($78\%$–$96\%$) | Nominal $1-\alpha = 0.90$ with mode stratification |

---

### 3. Training & Distillation Governance Rules

1. **Simulator Grounding Primacy:** External teacher foundation models (OpenAI, Anthropic, Gemini) provide auxiliary geometric and semantic priors, counterfactual hypotheses, and representation distillation targets. All physical ground truth (forces, accelerations, kinematics) is grounded strictly in deterministic physics simulator execution (`CompliantPreLiftContactEnv` and `PegInHoleEnv`).
2. **Strict Zero-Leakage Enforcement:**
   - No simulator ground-truth contact modes ($m_{\text{true}} \in \{0, 1, 2, 3, 4\}$).
   - No ground-truth friction coefficient ($\mu_{\text{true}}$).
   - No ground-truth object mass ($m_{\text{obj}}$).
   - No ground-truth peg-hole clearance ($c_{\text{clearance}}$).
3. **Loss Function Formulation:**
   $$\mathcal{L}_{\text{total}} = 1.0 \cdot \mathcal{L}_{\text{sim\_dynamics}} + 0.5 \cdot \mathcal{L}_{\text{mode\_focal}} + 0.25 \cdot \mathcal{L}_{\text{sys\_id}} + 0.10 \cdot \mathcal{L}_{\text{distill}}$$
4. **Training Authorization Barrier:**
   - This document locks the specification for implementation and code preparation.
   - **No gradient steps, optimizer updates, or parameter learning shall occur until formal user authorization for Stage 3 execution is granted.**
