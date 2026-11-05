# HOROS PROBE-1 — Research-002
# Stage P2.2: Multi-Horizon Conformal Calibration Engine

**Document ID:** HOROS-PROBE1-R002-DOC-13  
**Project:** HOROS PROBE-1 — Humanoid Robotics  
**Topic:** Trustworthy Action-Conditioned Contact World Models  
**Stage:** P2.2 Mathematical Specification  
**Author:** HOROS Research Team  

---

## 1. Conformal Quantile Tensor Architecture

In accordance with Condition 2, the calibration engine constructs a two-dimensional quantile tensor conditioning prediction intervals simultaneously on discrete contact mode $\Sigma_k$ and autoregressive forecast horizon $h$:

$$\mathbf{Q} \in \mathbb{R}^{7 \times 5} \quad \text{for } \Sigma_k \in \{0, \dots, 6\} \text{ and } h \in \{1, 3, 5, 10, 20\}$$

```
          [HORIZON STEPS (H)]
          h=1      h=3      h=5      h=10     h=20
        ┌────────┬────────┬────────┬────────┬────────┐
Mode 0  │  q_0,1 │  q_0,3 │  q_0,5 │  q_0,10│  q_0,20│  (Free Motion)
Mode 1  │  q_1,1 │  q_1,3 │  q_1,5 │  q_1,10│  q_1,20│  (First Contact / Touchdown)
Mode 2  │  q_2,1 │  q_2,3 │  q_2,5 │  q_2,10│  q_2,20│  (Sticking Equilibrium)
Mode 3  │  q_3,1 │  q_3,3 │  q_3,5 │  q_3,10│  q_3,20│  (Tangential Sliding)
Mode 4  │  q_4,1 │  q_4,3 │  q_4,5 │  q_4,10│  q_4,20│  (Impact Shock)
Mode 5  │  q_5,1 │  q_5,3 │  q_5,5 │  q_5,10│  q_5,20│  (Wedging / Jamming)
Mode 6  │  q_6,1 │  q_6,3 │  q_6,5 │  q_6,10│  q_6,20│  (Release / Separation)
        └────────┴────────┴────────┴────────┴────────┘
```

---

## 2. Marginal Horizon Coverage vs. Simultaneous Trajectory Coverage

### 2.1 Marginal Horizon Coverage (Point-wise Guarantee)
For each fixed horizon $h \in \{1, 3, 5, 10, 20\}$ and contact stratum $\Sigma_k$:
- Residual non-conformity score:
  $$R_i(k, h) = \|\mathbf{x}_{t+h}^{\text{true}} - \hat{\mathbf{x}}_{t+h}^{(i)}\|_2$$
- Conformal quantile:
  $$\hat{q}_{1-\alpha}(k, h) = \operatorname{Quantile}\left( \{R_i(k, h)\}_{i \in \Sigma_k}, \frac{\lceil(N_{k,h} + 1)(1 - \alpha)\rceil}{N_{k,h}} \right)$$
- Finite-sample marginal coverage guarantee:
  $$\mathbb{P}\left( \mathbf{x}_{t+h} \in \hat{\mathcal{C}}_{1-\alpha}(k, h) \mid \Sigma_k \right) \ge 1 - \alpha$$

---

### 2.2 Simultaneous Trajectory Coverage (Trajectory-level Guarantee)
In closed-loop model-predictive control, planning over a horizon requires the model to remain accurate across **all** intermediate steps simultaneously.

If marginal coverage is $90\%$ at each of $K=5$ horizons, the joint probability that the true trajectory violates at least one horizon can be as high as $5 \times 10\% = 50\%$ by the union bound!

To guarantee simultaneous trajectory-level coverage $\ge 1 - \alpha$, we calibrate a single trajectory inflation scalar $\lambda_{\text{sim}}$:
1. Max studentized trajectory score:
   $$S_i^{\text{traj}} = \max_{h \in \{1, 3, 5, 10, 20\}} \left( \frac{\|\mathbf{x}_{t+h}^{\text{true}} - \hat{\mathbf{x}}_{t+h}^{(i)}\|_2}{\hat{q}_{1-\alpha}(\hat{\Sigma}_{t+h}, h)} \right)$$
2. Trajectory inflation quantile:
   $$\hat{\lambda}_{1-\alpha} = \operatorname{Quantile}\left( \{S_i^{\text{traj}}\}_{i=1}^{N_{\text{traj}}}, \frac{\lceil(N_{\text{traj}} + 1)(1 - \alpha)\rceil}{N_{\text{traj}}} \right)$$
3. Guaranteed simultaneous prediction region:
   $$\hat{\mathcal{C}}_{1-\alpha}^{\text{traj}}(\mathbf{x}_t, \mathbf{a}, h) = \left\{ \mathbf{y} \in \mathcal{X} : \|\mathbf{y} - \hat{\mathbf{x}}_{t+h}\| \le \hat{\lambda}_{1-\alpha} \cdot \hat{q}_{1-\alpha}(\hat{\Sigma}_{t+h}, h) \right\}$$
   yielding the simultaneous trajectory theorem:
   $$\mathbb{P}\left( \forall h \in \{1, 3, 5, 10, 20\}, \; \mathbf{x}_{t+h} \in \hat{\mathcal{C}}_{1-\alpha}^{\text{traj}}(\mathbf{x}_t, \mathbf{a}, h) \right) \ge 1 - \alpha$$

---

## 3. Sample Size Thresholds & Hierarchical Pooling

To prevent small-sample overfitting in rare contact modes (e.g., Jamming $\Sigma_5$ or Impact $\Sigma_4$):
- **Cell Sample Requirement:** $N_{k, h} \ge 30$ transitions.
- **Hierarchical Pooling Fallback:** If $N_{k, h} < 30$:
  1. Pool across all horizons for mode $k$: $\hat{q}_{\text{mode}}(k) = \operatorname{Quantile}(\bigcup_h R(k, h), 1 - \alpha)$.
  2. If total mode count $< 30$, fall back to unstratified marginal quantile: $\hat{q}_{\text{global}}(h) = \operatorname{Quantile}(\bigcup_k R(k, h), 1 - \alpha)$.
