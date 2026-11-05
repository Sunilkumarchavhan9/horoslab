# HOROS PROBE-1 — Research-002
# Reference Dynamics Models & Uncertainty Architectures

**Document ID:** HOROS-PROBE1-R002-DOC-05  
**Project:** HOROS PROBE-1 — Humanoid Robotics  
**Topic:** Trustworthy Action-Conditioned Contact World Models  
**Status:** Step 2 Model Formulation Complete  
**Author:** HOROS Research Team  

---

## 1. Mathematical Formulation & Architecture Overview

In accordance with Section 7 and Section 11 (Step 5) of Research Charter v0.1, this document details the mathematical formulations, network topologies, loss functions, and inference contracts for the four reference baseline models implemented in [`src/models/`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/models).

Every model consumes a continuous robot-object observation vector $\mathbf{s}_t \in \mathbb{R}^{d_s}$ and candidate control action $\mathbf{a}_t \in \mathbb{R}^{d_a}$ to predict multi-step future state evolution $\mathbf{s}_{t+1:t+H}$ across open-loop horizons $H \in \{1, 3, 5, 10, 20\}$.

---

## 2. Baseline Model Formulations

### 2.1 Baseline B1: Deterministic Action-Conditioned Dynamics Model (ContactWorld Baseline)
- **Concept:** Replicates the standard Joint-Embedding Predictive Architecture (JEPA) / recurrent forward model utilized in ContactWorld (Zhang et al., 2026).
- **Architecture:** Residual Multi-Layer Perceptron (MLP) with Layer Normalization and SiLU activations:
  $$\hat{\mathbf{s}}_{t+1} = \mathbf{s}_t + f_\theta(\mathbf{s}_t, \mathbf{a}_t)$$
- **Loss Function:** Pure deterministic Mean Squared Error (MSE):
  $$\mathcal{L}_{\text{det}}(\theta) = \frac{1}{B} \sum_{i=1}^B \|\mathbf{s}_{t+1}^{(i)} - \hat{\mathbf{s}}_{t+1}^{(i)}\|_2^2$$
- **Core Limitation:** Completely blind to epistemic and aleatoric uncertainty. Point predictions in unvisited contact manifolds provide no penalty signal to optimizing planners, exposing the downstream controller to severe model exploitation.

---

### 2.2 Baseline B2: Heteroscedastic Gaussian World Model (Probabilistic Single Head)
- **Concept:** Predicts an explicit Gaussian distribution over next-state residuals, capturing data-dependent (aleatoric) observation noise:
  $$\hat{\mathbf{s}}_{t+1} \sim \mathcal{N}\left(\boldsymbol{\mu}_\theta(\mathbf{s}_t, \mathbf{a}_t), \operatorname{diag}(\boldsymbol{\sigma}_\theta^2(\mathbf{s}_t, \mathbf{a}_t))\right)$$
- **Loss Function:** Gaussian Negative Log-Likelihood (NLL) with softplus clamping:
  $$\mathcal{L}_{\text{NLL}}(\theta) = \frac{1}{2B} \sum_{i=1}^B \left[ \sum_{j=1}^{d_s} \left( \frac{(s_{t+1, j}^{(i)} - \mu_j^{(i)})^2}{\sigma_j^{2(i)}} + \log \sigma_j^{2(i)} \right) \right]$$
- **Core Limitation:** Assumes unimodal Gaussian error distribution. Fails catastrophically around non-Gaussian contact mode switches (e.g., sticking vs. slipping bifurcation).

---

### 2.3 Baseline B3: Bootstrapped Deep Ensemble (Li et al., 2025/2026 Baseline)
- **Concept:** Employs an ensemble of $E=5$ independently initialized probabilistic neural networks, each trained on bootstrapped subsets of the offline dataset $\mathcal{D}$.
- **Uncertainty Decomposition:**
  1. *Ensemble Mean:*
     $$\bar{\boldsymbol{\mu}}(\mathbf{s}, \mathbf{a}) = \frac{1}{E} \sum_{e=1}^E \boldsymbol{\mu}_e(\mathbf{s}, \mathbf{a})$$
  2. *Epistemic Uncertainty (Model Disagreement):*
     $$\boldsymbol{\sigma}_{\text{ens}}^2(\mathbf{s}, \mathbf{a}) = \frac{1}{E} \sum_{e=1}^E \|\boldsymbol{\mu}_e(\mathbf{s}, \mathbf{a}) - \bar{\boldsymbol{\mu}}(\mathbf{s}, \mathbf{a})\|^2$$
  3. *Aleatoric Uncertainty (Sensory Noise):*
     $$\boldsymbol{\sigma}_{\text{aleatoric}}^2(\mathbf{s}, \mathbf{a}) = \frac{1}{E} \sum_{e=1}^E \boldsymbol{\sigma}_e^2(\mathbf{s}, \mathbf{a})$$
- **Planner Objective (Uncertainty-Penalized CEM):**
  $$J_{\text{pen}}(\boldsymbol{\tau}) = \sum_{t=1}^H \left[ r(\hat{\mathbf{s}}_t, \mathbf{a}_t) - \beta \|\boldsymbol{\sigma}_{\text{ens}}(\hat{\mathbf{s}}_t, \mathbf{a}_t)\|_2 \right]$$
- **Core Limitation:** Disagreement shrinks when all ensemble members share inductive architectural biases, failing to prevent optimization against joint systematic blindspots at impact boundaries.

---

### 2.4 Baseline B4: Contact-Stratified Conformal World Model (CaPTURe Baseline)
- **Concept:** Implements Split Conformal Prediction conditioned on the discrete physical contact stratum $\Sigma_k \in \{0, 1, \dots, K-1\}$.
- **Non-Conformity Score:**
  $$R_i = \|\mathbf{s}_{t+1}^{\text{true}} - \hat{\mathbf{s}}_{t+1}^{(i)}\|_2$$
- **Conformal Quantile per Stratum:**
  $$\hat{q}_{1-\alpha}(\Sigma_k) = \operatorname{Quantile}\left( \{R_i\}_{i \in \Sigma_k}, \frac{\lceil(N_k + 1)(1 - \alpha)\rceil}{N_k} \right)$$
- **Guaranteed Prediction Region:**
  $$\hat{\mathcal{C}}_{1-\alpha}(\mathbf{s}, \mathbf{a}, \Sigma_k) = \left\{ \mathbf{y} \in \mathbb{R}^{d_s} : \|\mathbf{y} - \hat{\mathbf{s}}\| \le \hat{q}_{1-\alpha}(\Sigma_k) \right\}$$
  yielding distribution-free coverage:
  $$\mathbb{P}\left(\mathbf{s}_{t+1} \in \hat{\mathcal{C}}_{1-\alpha}(\mathbf{s}_t, \mathbf{a}_t, \Sigma_k) \mid \Sigma_k \right) \ge 1 - \alpha$$

