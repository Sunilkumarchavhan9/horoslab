# HOROS PROBE-1 — Research-002
# Phase 2 Mathematical Formulation: Contact-Mode-Stratified, Planner-Selection-Aware Conformal Dynamics (CMS-PSACD)

**Document ID:** HOROS-PROBE1-R002-DOC-10  
**Project:** HOROS PROBE-1 — Humanoid Robotics  
**Topic:** Trustworthy Action-Conditioned Contact World Models  
**Status:** Phase 2 Mathematical & Algorithmic Formulation Frozen  
**Author:** HOROS Research Team  

---

## 1. Research Question & Methodological Motivation

### Central Research Question
> **Can we maintain reliable multi-step physical prediction coverage when a planner actively selects actions from a learned contact world model, particularly around discontinuous contact-mode transitions?**

### Why Existing Conformal Methods Are Insufficient
Existing conformal prediction frameworks in robotics (e.g., CaPTURe, conformal humanoid MPC) suffer from two fundamental vulnerabilities:
1. **Single-Step / Horizon Collapse:** They calibrate only 1-step errors ($H=1$). In multi-step model-predictive control ($H \in [5, 48]$), compounding epistemic errors break marginal coverage guarantees.
2. **The Optimizer's Distribution Shift:** Conformal quantiles are traditionally fitted on passive offline demonstrations $\mathcal{D}_{\text{offline}}$. When an optimizer (CEM/MPPI) searches over thousands of candidates, it samples from the extreme tail of the action space $\mathcal{D}_{\text{planner}}$, causing severe under-coverage precisely where the planner is most confident.

To solve this, **CMS-PSACD** integrates four novel mathematical components:
1. A **Hybrid Contact-State Representation** separating continuous physical evolution from discrete manifold switching.
2. **Mode- and Horizon-Conditioned Conformal Quantiles** $(\Sigma_k, H)$.
3. **Planner-Selection-Aware Calibration** evaluated on the optimizing planner's action distribution.
4. **Active Contact-Mode Mining (ACMM)** targeted at physical failure boundaries.

---

## 2. Component 1: Hybrid Contact-State Representation

The physical system state is modeled as a hybrid dynamical system $(\mathbf{x}_t, \Sigma_t) \in \mathcal{X} \times \mathcal{M}$, where $\mathcal{X}$ is the continuous state space and $\mathcal{M} = \{0, 1, 2, 3, 4, 5, 6\}$ denotes the discrete contact manifold:

$$\Sigma_t \in \begin{cases}
\Sigma_0: \text{Free Motion} & \text{No rigid contact } (F_n = 0) \\
\Sigma_1: \text{First Contact / Touchdown} & \text{Initial contact onset } (0 < F_n \le F_{\text{detect}}) \\
\Sigma_2: \text{Sticking Equilibrium} & \text{Stable contact inside Coulomb cone } (\|F_t\| < \mu F_n - \epsilon) \\
\Sigma_3: \text{Tangential Sliding} & \text{Continuous shear motion on surface } (\|F_t\| = \mu F_n, v_{\text{rel}} > 0) \\
\Sigma_4: \text{Impact / Boundary Collision} & \text{Discontinuous restitution shock } (\Delta v_{\text{normal}} < 0) \\
\Sigma_5: \text{Wedging / Jamming} & \text{Multi-point kinematic lock } (F_{\text{lateral}} > F_{\text{threshold}}) \\
\Sigma_6: \text{Release / Contact Separation} & \text{Breaking contact } (F_n \rightarrow 0, v_{\text{normal}} > 0)
\end{cases}$$

### Continuous State-Wrench Vector:
$$\mathbf{x}_t = \left[ \mathbf{q}_t, \dot{\mathbf{q}}_t, \mathbf{p}_t^{\text{obj}}, \mathbf{v}_t^{\text{obj}}, \mathbf{F}_t^{\text{contact}}, \boldsymbol{\tau}_t^{\text{contact}} \right]^T \in \mathbb{R}^{d_x}$$

---

## 3. Component 2: Mode- and Horizon-Conditioned Conformal Quantiles

Rather than computing a single global conformal scalar $\hat{q}_{1-\alpha}$, CMS-PSACD constructs a **two-dimensional conformal quantile tensor**:
$$\mathbf{Q} \in \mathbb{R}^{|\mathcal{M}| \times H_{\max}}$$
where each entry $\hat{q}_{1-\alpha}(\Sigma_k, h)$ corresponds to the conformal radius for contact mode $\Sigma_k$ at rollout horizon step $h \in \{1, 2, \dots, H\}$.

### Non-Conformity Score Formulation:
For a candidate rollout trajectory of length $H$, the multi-step non-conformity score is evaluated as:
$$R_i(h \mid \Sigma_k) = \frac{\|\mathbf{x}_{t+h}^{\text{true}} - \hat{\mathbf{x}}_{t+h}^{(i)}\|_2}{\sqrt{\operatorname{Tr}(\hat{\boldsymbol{\Sigma}}_{t+h}^{(i)}) + \epsilon}}$$
normalizing the Euclidean error by the predicted heteroscedastic covariance trace.

### Quantile Calibration:
Given $N_k$ calibration episodes exhibiting mode $\Sigma_k$ at horizon $h$:
$$\hat{q}_{1-\alpha}(\Sigma_k, h) = \operatorname{Quantile}\left( \{R_i(h \mid \Sigma_k)\}_{i=1}^{N_k}, \frac{\lceil(N_k + 1)(1 - \alpha)\rceil}{N_k} \right)$$

### Valid Guaranteed Multi-Step Prediction Region:
$$\hat{\mathcal{C}}_{1-\alpha}(\mathbf{x}_t, \mathbf{a}_{t:t+h-1}, \Sigma_k, h) = \left\{ \mathbf{y} \in \mathcal{X} : \|\mathbf{y} - \hat{\mathbf{x}}_{t+h}\| \le \hat{q}_{1-\alpha}(\Sigma_k, h) \cdot \sqrt{\operatorname{Tr}(\hat{\boldsymbol{\Sigma}}_{t+h})} \right\}$$
guaranteeing finite-sample coverage per mode and horizon:
$$\mathbb{P}\left( \mathbf{x}_{t+h} \in \hat{\mathcal{C}}_{1-\alpha}(\Sigma_k, h) \mid \Sigma_k \right) \ge 1 - \alpha$$

---

## 4. Component 3: Planner-Selection-Aware Calibration (PSAC)

To defeat the "Optimizer's Curse," calibration data cannot be static offline demonstrations. CMS-PSACD introduces an iterative calibration feedback loop:

```
┌────────────────────────────────────────────────────────────────────────┐
│             PLANNER-SELECTION-AWARE CALIBRATION LOOP (PSAC)            │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Forward World Model M_hat trained on offline dataset D_0            │
│ 2. Planner (CEM / MPPI) optimizes over M_hat:                          │
│      a*_tau = argmax_a E_{M_hat}[ R(s, a) ]                            │
│ 3. Selected action candidates a*_tau deployed in ground-truth simulator│
│ 4. Residual errors recorded strictly on the PLANNER'S distribution:    │
│      R_planner = ||x_true(a*) - x_pred(a*)||                          │
│ 5. Conformal quantiles updated via importance-weighted conformal shift:│
│      w(a) = P_planner(a) / P_behavior(a)                               │
│      q_PSAC = WeightedQuantile(R_planner, 1 - alpha)                   │
└────────────────────────────────────────────────────────────────────────┘
```

By calibrating quantiles on the actions that the optimizer actually chooses, the prediction region automatically expands in regions where the planner attempts to exploit model inaccuracies!

---

## 5. Component 4: Active Contact-Mode Mining (ACMM)

Rather than uniform random domain randomization, ACMM actively directs dataset collection toward the physical bifurcation boundaries where contact transitions are unstable:

1. **Friction Cone Boundary Mining:**
   Target sampling where the tangential-to-normal force ratio approaches Coulomb slip:
   $$\left| \frac{\|\mathbf{F}_t\|}{F_n} - \mu \right| \le \delta_{\mu}$$
2. **Critical Wedging Angle Mining:**
   Target sampling where the peg tilt angle approaches the two-point wedging threshold:
   $$\left| \theta_{\text{tilt}} - \arctan\left(\frac{2\delta}{L}\right) \right| \le \delta_{\theta}$$
3. **Incipient Slip Dynamics Mining:**
   Target sampling where differential taxel displacement indicates onset of slip before gross velocity divergence.

---

## 6. Phase 2 Five-Way Comparison Matrix

To be executed in Phase 2 across both tasks:

| Model # | Architecture Configuration | Uncertainty Quantification | Calibration Strategy | p-CBF Safety Filter |
| :--- | :--- | :--- | :--- | :--- |
| **M1** | Deterministic Dynamics | None | None | Disabled / Enabled |
| **M2** | Deep Ensemble (5 Heads) | Epistemic variance $\sigma_{\text{ens}}$ | Gaussian variance penalty | Disabled / Enabled |
| **M3** | Standard Conformal Dynamics | Split Conformal Prediction | Unstratified marginal | Disabled / Enabled |
| **M4** | Contact-Stratified Conformal | Mode-conditioned Conformal | Stratified on passive $\mathcal{D}_{\text{offline}}$ | Disabled / Enabled |
| **M5 (Proposed)** | **CMS-PSACD + ACMM** | **Mode $\times$ Horizon Conformal** | **Planner-Selection-Aware (PSAC)** | **Disabled / Certified Enabled** |
