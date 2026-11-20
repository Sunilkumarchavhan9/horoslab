# HOROS PROBE-1 — World Model Training Implications & Baseline Progression

**Program:** HOROS Physical Intelligence Research Group  
**Project:** Research-002: Model Teaching Infrastructure & Contact Mechanics  
**Document Identifier:** `HOROS-P1-R002-WORLD-MODEL-TRAINING-IMPLICATIONS`  
**Date:** 2026-11-20  
**Status:** **AUTHORITATIVE RESEARCH STRATEGY**  

---

### 1. Executive Summary

The upgrade from ideal Coulomb mechanics (`v1`) to Cattaneo-Mindlin partial-slip compliance (`v2`) fundamentally transforms the physical learning problem for the HOROS world model.

In `v1`, slip was an unobservable step discontinuity ($\partial F_t / \partial \mu = 0$ in all pre-slip states). No model could forecast failure without either observing post-slip motion or exploiting mass confounding. In `v2`, the physical interface continuously broadcasts its proximity to slip through non-linear stiffness degradation:
$$k_t(F_t) = k_{t,0} \left( 1 - \frac{F_t}{\mu F_n} \right)^{1/3}$$

This document analyzes how this physical signal unlocks genuine pre-slip failure forecasting ($\tau_{\text{lead}} \in [20, 50]\text{ ms}$), establishes the mathematical formulation of the world model's prediction task, and defines a rigorous **5-Level Baseline Progression** that must precede any deployment of the Hierarchical Contact Transformer (HCTT).

---

### 2. Physical Transformation of the Prediction Task

#### 2.1 The Observable Precursor Signal
Under `CompliantPreLiftContactEnv-v2`, as a robotic gripper lifts an object or executes active probing motions, the tangential force $F_t$ rises. Concurrently:
1. The stick core radius $c(t)$ shrinks from $a$ toward $0$.
2. The instantaneous stiffness $k_t = \Delta F_t / \Delta \delta_t$ softens monotonically.
3. The high-frequency vibrotactile noise power $\sigma_t^2(t)$ increases due to microscopic asperity rearrangement in the annular slip zone.

```
 Force & Stiffness Trajectories
 Force Ft       ^                  * Gross Slip Cliff (v1 only)
                |                 /
                |                /  Smooth Softening Trajectory (v2)
                |         . - - '
                |       /
                |     /
                +----------------------------------------------------> Time
 Tangent        ^
 Stiffness kt   |============\
                |             \     <--- PRE-SLIP OBSERVABILITY WINDOW (20-50 ms)
                |              \         kt drops by 50-80% before gross slip!
                |               \
                +----------------+-----------------------------------> Time
                                t_pre      t_gross_slip
```

#### 2.2 Formal World Model Prediction Objective
Rather than attempting to predict an instantaneous cliff-edge step, the world model is trained to predict the **Dynamic Grasp Stability Margin** $M_t$:
$$M_t = 1.0 - \frac{F_{t,t}}{\mu F_{n,t}} = \left( \frac{c_t}{a_t} \right)^3 \in [0.0, 1.0]$$

Given action-observation history $\mathcal{H}_t = (\mathbf{o}_{t-H:t}, \mathbf{a}_{t-H:t})$, the world model forecasts:
1. **Margin Rollout:** $\hat{M}_{t+k} = f_\theta(\mathcal{H}_t, \mathbf{a}_{t:t+k-1})$ for $k \in \{1, \dots, K\}$.
2. **Time-to-Gross-Slip:** $\hat{\tau}_{\text{slip}} = \min \{ k \mid \hat{M}_{t+k} \le 0.05 \} \cdot \Delta t$.
3. **Epistemic Uncertainty:** $\hat{\sigma}_M(t+k)$ calibrated via conformal prediction.

---

### 3. The 5-Level Baseline Progression Prior to HCTT

To adhere to strict scientific methodology, complex transformer world models must not be deployed until simple classical and deep baselines establish clear performance benchmarks.

```
       [ Level 5: HCTT (Hierarchical Contact Transformer) ]
                                ^
                                |
      [ Level 4: Conformal Uncertainty Filter (B3/B4) ]
                                ^
                                |
        [ Level 3: Temporal Recurrent Models (GRU/TCN) ]
                                ^
                                |
          [ Level 2: Supervised Force-MLP (B1/B2) ]
                                ^
                                |
    [ Level 1: RLS / Kalman Filter Compliance Estimator ]
                                ^
                                |
            [ Level 0: Static Force-Ratio Heuristic ]
```

#### Level 0: Static Force-Ratio Heuristic (Passive Rule)
- **Model:** Fixed threshold on static load ratio:
  $$\text{Alarm if } \frac{\sum F_{t,i}}{\sum F_{n,i}} \ge \bar{\mu}_{\text{prior}} \cdot (1 - \gamma_{\text{margin}})$$
- **Role:** Establishes the performance floor without tactile compliance intelligence.

#### Level 1: Recursive Least Squares (RLS) Compliance Estimator
- **Model:** Closed-form recursive regression tracking online stiffness:
  $$\hat{k}_{t,t} = \hat{k}_{t,t-1} + \mathbf{K}_t (\Delta F_{t,t} - \hat{k}_{t,t-1} \Delta \delta_{t,t})$$
  $$\hat{\mu}_t = \frac{F_{t,t}}{F_{n,t} \left[ 1 - (\hat{k}_{t,t} / k_{t,0})^3 \right]}$$
- **Role:** Pure analytical baseline; verifies whether first-principles filtering alone is sufficient for pre-slip forecasting without deep learning.

#### Level 2: Supervised Force-History MLP (B1/B2 Architecture)
- **Model:** 4-layer feedforward network with LayerNorm processing a $10$-step history window of forces and displacements:
  $$\hat{M}_{t+1}, \hat{\mu} = \text{MLP}_\theta([\mathbf{F}_{t-10:t}, \boldsymbol{\delta}_{t-10:t}])$$
- **Role:** Benchmarks non-temporal deep representation capacity.

#### Level 3: Temporal Sequence Models (TCN & GRU)
- **Model:** Causal Dilated Temporal Convolutional Network (TCN) and Bidirectional Gated Recurrent Unit (GRU) capturing micro-vibrations and multi-step rate dependencies.
- **Role:** Benchmarks temporal dynamics and memory without attention overhead.

#### Level 4: Conformal Prediction Uncertainty Filter (B3/B4 Architecture)
- **Model:** Non-conformity score function evaluated over Level 3 predictions:
  $$\hat{\mathcal{C}}_{1-\alpha}(t+k) = \left[ \hat{M}_{t+k} - q_{1-\alpha}, \; \hat{M}_{t+k} + q_{1-\alpha} \right]$$
- **Role:** Enforces finite-sample coverage guarantees ($1 - \alpha = 0.95$) to eliminate false alarms and guarantee safety certificates.

#### Level 5: Hierarchical Contact Transformer (HCTT)
- **Model:** Action-conditioned generative latent world model with hierarchical spatial-temporal attention, autoregressive latent imagination, and cross-attention between vision and multi-finger tactile tokens.
- **Deployment Criteria:** Authorized only if HCTT demonstrates statistically significant improvements over Levels 1–4 on multi-axis, out-of-distribution friction surfaces.

---

### 4. Quantitative Evaluation Metrics & Scientific Novelty Gates

Any world model evaluated on `CompliantPreLiftContactEnv-v2` must be assessed across five rigorous metrics:

| Metric | Mathematical Definition | Minimum Gate for Research Novelty |
| :--- | :---: | :---: |
| **Pre-Slip Forecasting Lead Time** | $\tau_{\text{lead}} = t_{\text{gross\_slip}} - t_{\text{alarm}}$ | $\ge \mathbf{20.0\text{ ms}}$ ($2$ discrete steps at $100\text{ Hz}$) |
| **Friction Identification $R^2$** | $R^2(\hat{\mu}_{\text{pre\_slip}}, \mu_{\text{true}})$ | $\ge \mathbf{0.85}$ across $\mu \in [0.20, 0.70]$ |
| **Mass-Independence Correlation** | $\|r(\hat{\mu}, m_{\text{obj}})\|$ | $\le \mathbf{0.10}$ (Strict zero mass confounding) |
| **Pre-Slip Alarm Precision** | $\text{True Alarms} / (\text{True} + \text{False Alarms})$ | $\ge \mathbf{95.0\%}$ |
| **Reflexive Slip Prevention Rate** | $\%$ of impending slips arrested via CBF | $\ge \mathbf{90.0\%}$ |

---

### 5. Summary & Operational Directives

1. **Do not train HCTT on v1:** All resources dedicated to training HCTT on the old simulator are suspended.
2. **Prioritize the compliance signal:** The primary research novelty of HOROS PROBE-1 lies in detecting non-linear elastomeric compliance softening before slip, not in predicting generic rigid collisions.
3. **Enforce baseline progression:** Every tier from Level 0 to Level 4 must be benchmarked and recorded before any large-scale HCTT world-model training is initiated.

---

### 6. Document Traceability & Sign-Off

- **Authors:** HOROS Physical Intelligence Research Group
- **Document Identifier:** `HOROS-P1-R002-WORLD-MODEL-TRAINING-IMPLICATIONS`
- **Status:** Strategic baseline approved for Phase 1.
