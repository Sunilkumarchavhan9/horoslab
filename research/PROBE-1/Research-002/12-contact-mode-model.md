# HOROS PROBE-1 — Research-002
# Stage P2.1: Seven-Mode Contact Representation & Hybrid Dynamics Model

**Document ID:** HOROS-PROBE1-R002-DOC-12  
**Project:** HOROS PROBE-1 — Humanoid Robotics  
**Topic:** Trustworthy Action-Conditioned Contact World Models  
**Stage:** P2.1 Architectural Specification  
**Author:** HOROS Research Team  

---

## 1. Seven-Mode Discrete Contact Manifold Definition

The discrete physical contact state $\Sigma_t \in \{0, 1, 2, 3, 4, 5, 6\}$ is rigorously partitioned based on normal force $F_n$, tangential shear force $\|F_t\|$, Coulomb friction limit $\mu F_n$, relative velocity $v_{\text{rel}}$, and lateral wedging moments:

```
                                  [CONTACT STATE SPACE M]
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
             No Contact (Fn = 0)                         Rigid Contact (Fn > 0)
             ├─ Mode 0: Free Motion                      │
             └─ Mode 6: Release (Separation)             ├─ Mode 1: First Contact (Touchdown)
                                                         ├─ Mode 2: Sticking Equilibrium
                                                         ├─ Mode 3: Tangential Sliding
                                                         ├─ Mode 4: Dynamic Impact Shock
                                                         └─ Mode 5: Wedging / Mechanical Jamming
```

### Mathematical Definitions & Threshold Conditions:

| Mode Index | Mode Name | Physical Description | Strict Classification Conditions |
| :--- | :--- | :--- | :--- |
| **$\Sigma_0$** | **`Free`** | Manipulator / object moves through open space without contact forces. | $F_n \le 10^{-3}\,\text{N}$ and $\|F_t\| \le 10^{-3}\,\text{N}$. |
| **$\Sigma_1$** | **`FirstContact`** | Initial surface touchdown / touch detection onset. | $0 < F_n \le F_{\text{detect}}$ ($F_{\text{detect}} = 0.5\,\text{N}$) with $v_{\text{normal}} < 0$. |
| **$\Sigma_2$** | **`Sticking`** | Stable static contact equilibrium inside Coulomb friction cone. | $F_n > F_{\text{detect}}$ and $\|F_t\| < \mu F_n - \epsilon_{\text{slip}}$ ($\|v_{\text{rel}}\| \le 1.0\,\text{mm/s}$). |
| **$\Sigma_3$** | **`Sliding`** | Tangential slip along surface at Coulomb friction boundary. | $F_n > F_{\text{detect}}$ and $\|F_t\| \ge \mu F_n - \epsilon_{\text{slip}}$ with $\|v_{\text{rel}}\| > 1.0\,\text{mm/s}$. |
| **$\Sigma_4$** | **`Impact`** | Collision impact shock; rapid impulse shock or deceleration. | $\Delta F_n / \Delta t > 500\,\text{N/s}$ or impulse shock $\|J_n\| > 2.0\,\text{N}\cdot\text{s}$. |
| **$\Sigma_5$** | **`Jamming`** | Two-point mechanical wedging / geometric lock under high lateral force. | Lateral wrench $\|F_{\text{lateral}}\| > 15.0\,\text{N}$ and peg tilt $\theta > \arctan(2\delta/L)$. |
| **$\Sigma_6$** | **`Release`** | Contact detachment / separation breaking surface contact. | $F_n \le F_{\text{detect}}$ while normal velocity directed outward ($v_{\text{normal}} > 2.0\,\text{mm/s}$). |

---

## 2. Prevention of Future-Information Leakage

### The Non-Leakage Principle:
At prediction time $t$, given history $(\mathbf{x}_{\le t}, \mathbf{a}_{\le t})$ and a candidate action sequence $\mathbf{a}_{t:t+H-1}$, the future ground truth modes $\Sigma_{t+1:t+H}$ are **unobserved**.

Conditioning the prediction region on $\Sigma_{t+h}^{\text{true}}$ is illegal:
$$\hat{\mathcal{C}}_{t+h} \neq f(\mathbf{x}_t, \mathbf{a}, \mathbf{\Sigma}_{t+h}^{\text{true}}) \quad \text{[LEAKAGE]}$$

### Non-Leaking Hybrid Dynamics Architecture:
1. **Continuous State & Wrench Predictor:**
   $$\hat{\mathbf{x}}_{t+h} = \mathbf{x}_{t+h-1} + f_\theta(\hat{\mathbf{x}}_{t+h-1}, \mathbf{a}_{t+h-1})$$
2. **Contact Mode Softmax Classifier:**
   $$\hat{\mathbf{p}}_{t+h} = \operatorname{softmax}\left( g_\phi(\hat{\mathbf{x}}_{t+h-1}, \mathbf{a}_{t+h-1}) \right) \in \Delta^6$$
3. **Conformal Mode Prediction Set (Adaptive Prediction Sets - APS):**
   $$\hat{\mathcal{S}}_{1-\alpha_{\text{mode}}}(\mathbf{x}_t, \mathbf{a}) = \left\{ k \in \{0, \dots, 6\} : \sum_{j=1}^{\operatorname{rank}(k)} \hat{p}_{(j)} \le \tau_{1-\alpha_{\text{mode}}} \right\}$$
4. **Leakage-Free Conformal State Prediction Region:**
   The continuous prediction region is computed as the union across all candidate modes in the conformal mode set:
   $$\hat{\mathcal{C}}_{1-\alpha}(\mathbf{x}_t, \mathbf{a}, h) = \bigcup_{k \in \hat{\mathcal{S}}} \left\{ \mathbf{y} \in \mathbb{R}^{d_x} : \|\mathbf{y} - \hat{\mathbf{x}}_{t+h}\| \le \hat{q}_{1-\alpha}(k, h) \right\}$$
   guaranteeing joint mode-and-state coverage without peeking at the realized future mode.
