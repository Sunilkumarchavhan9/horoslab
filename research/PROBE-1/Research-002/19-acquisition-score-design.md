# HOROS PROBE-1 — Research-002
## Stage P2.4: Acquisition Score Design & Multi-Objective Ranking
**Program:** HOROS PROBE-1 — Humanoid Robotics & Physical AI  
**Project:** Research-002: Trustworthy Action-Conditioned Contact World Models  
**Document:** 19-acquisition-score-design.md  
**Status:** Mathematical Specification  

---

## 1. Multi-Objective Acquisition Formulation

Given a candidate trajectory rollout $\tau = \{(s_t, a_t, s_{t+1}, \Sigma_t, F_t)\}_{t=0}^{H-1}$ generated in the training simulator by candidate sampling, the total acquisition score $A(\tau)$ is defined as a convex combination of five normalized epistemic, physical, and behavioral signals:

$$A(\tau) = \sum_{k=1}^5 w_k \cdot \tilde{U}_k(\tau)$$

$$\text{subject to} \quad w_k \ge 0, \quad \sum_{k=1}^5 w_k = 1.0$$

where $\tilde{U}_k(\tau) \in [0, 1]$ is the min-max normalized value of raw signal $U_k(\tau)$ evaluated across the candidate trajectory batch $\mathcal{B} = \{\tau_1, \ldots, \tau_B\}$:

$$\tilde{U}_k(\tau) = \frac{U_k(\tau) - \min_{\tau' \in \mathcal{B}} U_k(\tau')}{\max_{\tau' \in \mathcal{B}} U_k(\tau') - \min_{\tau' \in \mathcal{B}} U_k(\tau') + \epsilon}$$

with numerical stabilizer $\epsilon = 10^{-6}$.

---

## 2. Detailed Mathematical Formulation of the 5 Signals

### 2.1 Signal 1: Contact-Mode Classification Entropy ($U_{\text{mode}}$)
Quantifies predictive mode ambiguity over the 7 discrete contact strata:
$$\Sigma = \{\text{Free}, \text{FirstContact}, \text{Sticking}, \text{Sliding}, \text{Impact}, \text{Jamming}, \text{Release}\}$$

For candidate step $t$, the classifier outputs probability distribution $p(m_t = k \mid s_t, a_t)$. The Shannon entropy is:
$$H_t = - \sum_{k=1}^7 p(m_t = k) \ln\left(p(m_t = k) + \epsilon_{\text{prob}}\right)$$
The trajectory signal is the mean entropy across the horizon:
$$U_{\text{mode}}(\tau) = \frac{1}{H} \sum_{t=0}^{H-1} H_t$$
*Physical interpretation:* Peaks at contact onset, slip boundary, and transition between sliding and wedging.

### 2.2 Signal 2: Epistemic Prediction Disagreement ($U_{\text{disagreement}}$)
Measures ensemble epistemic variance across $M=3$ bootstrap world model instances:
$$\hat{s}_{t+1}^{(m)} = f_{\theta_m}(s_t, a_t), \quad m \in \{1, \ldots, M\}$$
$$\bar{s}_{t+1} = \frac{1}{M} \sum_{m=1}^M \hat{s}_{t+1}^{(m)}$$
$$U_{\text{disagreement}}(\tau) = \frac{1}{H} \sum_{t=0}^{H-1} \left( \frac{1}{M} \sum_{m=1}^M \left\| \hat{s}_{t+1}^{(m)} - \bar{s}_{t+1} \right\|_2^2 \right)$$
*Physical interpretation:* High when candidate actions enter unexplored dynamic regimes where parameter uncertainty is elevated.

### 2.3 Signal 3: Physical Contact-Boundary Proximity ($U_{\text{boundary}}$)
Measures proximity to the Coulomb friction cone boundary and geometric wedging envelope:
1. **Coulomb Friction Cone Proximity:**
   $$\Delta_{\text{friction}}(t) = \left| \|F_t^{\text{tangential}}\| - \mu F_t^{\text{normal}} \right|$$
   $$\phi_{\text{friction}}(t) = \exp\left( - \frac{\Delta_{\text{friction}}(t)}{\sigma_{\text{friction}}} \right)$$
   where $\sigma_{\text{friction}} = 2.0$ N.
2. **Geometric Wedging Envelope Proximity (Peg-in-Hole):**
   $$\theta_{\text{crit}} = \arctan\left(\frac{2\delta}{L}\right)$$
   $$\Delta_{\text{wedge}}(t) = \left| \|\text{rot}_{\text{tilt}}(t)\| - \theta_{\text{crit}} \right|$$
   $$\phi_{\text{wedge}}(t) = \exp\left( - \frac{\Delta_{\text{wedge}}(t)}{\sigma_{\text{wedge}}} \right)$$
   where $\sigma_{\text{wedge}} = 0.5^\circ$.
3. **Composite Boundary Proximity:**
   $$U_{\text{boundary}}(\tau) = \frac{1}{H} \sum_{t=0}^{H-1} \left[ \phi_{\text{friction}}(t) + \phi_{\text{wedge}}(t) \right]$$

### 2.4 Signal 4: Planner Optimism / Exploitation Severity ($U_{\text{optimism}}$)
Quantifies the optimizer's curse on candidate actions by comparing world model predicted return against realized rollout return:
$$U_{\text{optimism}}(\tau) = \max\left(0.0, \hat{J}_{\text{WM}}(\tau) - J_{\text{sim}}(\tau)\right)$$
*Physical interpretation:* Targets the exact failure mode observed in P2.3 Task 2 ($\text{PEG} = 7,616.27$), penalizing model overconfidence and acquiring data where the simulator contradicts the planner.

### 2.5 Signal 5: Failure & Recovery Value ($U_{\text{recovery}}$)
Rewards trajectories containing dynamic state corrections:
$$U_{\text{recovery}}(\tau) = \sum_{t=0}^{H-2} R(t) + 3.0 \cdot \mathbf{1}_{\text{goal\_achieved}}(\tau)$$
where $R(t) = 1.0$ if:
- Contact slips and regains traction ($m_t = \text{IncipientSlip} \to m_{t+1} = \text{Sticking}$).
- Peg wedges and unjams ($m_t = \text{Wedging} \to m_{t+1} = \text{ChamferSliding}$).
- Object undergoes dynamic load transfer without dropping.

---

## 3. Weight Configurations

| Configuration | $w_1$ (Mode) | $w_2$ (Disag.) | $w_3$ (Boundary) | $w_4$ (Optimism) | $w_5$ (Recovery) | Intended Use |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Equal Baseline** | $0.20$ | $0.20$ | $0.20$ | $0.20$ | $0.20$ | Primary benchmark D4 |
| **Boundary Focused** | $0.10$ | $0.10$ | **$0.60$** | $0.10$ | $0.10$ | Strategy D2 |
| **Uncertainty Focused**| **$0.50$** | **$0.50$** | $0.00$ | $0.00$ | $0.00$ | Strategy D3 |
| **Optimism Focused** | $0.10$ | $0.10$ | $0.10$ | **$0.50$** | $0.20$ | Anti-exploitation ablation |

---

## 4. Deterministic Ranking & Selection Property

To ensure 100% reproducibility across experiment runs:
1. Trajectories are scored and ordered deterministically by composite score $A(\tau)$.
2. Ties are resolved by trajectory index $i$, guaranteeing invariant ranking given identical random seeds.
3. Redundant trajectories are filtered by the Episode Deduplicator prior to admission into the training replay store.
