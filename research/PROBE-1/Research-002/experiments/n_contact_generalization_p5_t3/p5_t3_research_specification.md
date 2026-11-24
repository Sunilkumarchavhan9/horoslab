# HOROS PROBE-1 — Phase 5 Task 3 (P5-T3)
# N-Contact Generalization & Cooperative Physical Intelligence: Research Specification

**Project:** HOROS Physical Interaction Data Engine (PIDE)  
**Research Program:** PROBE-1  
**Milestone:** P5-T3 — N-Contact Generalization & Cooperative Physical Intelligence  
**Previous Milestones:** P5-T1 (Single-Contact Adaptive Preload), P5-T2 (Two-Contact Cooperative Force Allocation)  
**Research Mode:** Simulation-First (Live Hardware Integration Strictly Prohibited)  
**Date:** November 2026  
**Document Status:** Pre-Registered Frozen Specification  

---

## 1. Executive Summary & Research Questions

Phase 5 Task 3 (P5-T3) extends HOROS physical intelligence from two-contact cooperative force allocation (P5-T2) to generalized $N$-contact topologies ($N \in \{3, 4, 5\}$). While P5-T2 demonstrated that cooperative preload planning improves grasp stability over fixed symmetric clamping in two-finger planar interaction, multi-contact grasp mechanics introduce high-dimensional internal force null spaces, coupled tangential shearing, and asymmetric contact constraints.

### Primary Research Questions
1. **RQ1 (Topology Scaling):** Does learned uncertainty-aware cooperative force allocation scale reliably across three, four, and five independently observable contact points without requiring retuning or topological re-architecting?
2. **RQ2 (Wrench Null-Space Coordination):** Can cooperative force allocation exploit the grasp matrix wrench null space to dynamically reinforce internal grip squeeze without inducing lateral object acceleration or unwanted tilt?
3. **RQ3 (Contact Loss Recovery):** When a finger suddenly loses contact, can the remaining $N-1$ fingers dynamically detect the loss and cooperatively redistribute the missing constraint to prevent object drop?
4. **RQ4 (Force-Budget Fairness):** Under strict total-force budgets ($\sum F_{n,i} \le N \times 8.0\,\text{N}$, Protocol B), does dynamic cooperative allocation maintain grasp stability superior to fixed-total and equal-force clamping?

---

## 2. Mathematical Formulations & Rigid-Body Mechanics

### 2.1 Object Grasp Matrix $\mathbf{G}(\theta)$
For an object with planar pose $\mathbf{q} = [x, y, \theta]^T \in \mathbb{R}^2 \times \mathbb{S}^1$, radius $R$, and mass $m$, the grasp matrix maps contact forces $\mathbf{f}_c = [F_{n,0}, F_{t,0}, \dots, F_{n,N-1}, F_{t,N-1}]^T \in \mathbb{R}^{2N}$ to the object-level resultant wrench $\mathbf{w} \in \mathbb{R}^3$:

$$\mathbf{w} = \begin{bmatrix} F_x \\ F_y \\ \tau_z \end{bmatrix} = \mathbf{G}(\theta) \mathbf{f}_c$$

For contact $i$ at angle $\phi_i = \theta + \phi_{0,i}$:
- Inward contact normal in world frame: $\hat{\mathbf{n}}_{w,i} = [-\cos\phi_i, -\sin\phi_i]^T$
- Tangential vector in world frame: $\hat{\mathbf{t}}_{w,i} = [-\sin\phi_i, \cos\phi_i]^T$
- Contact point position relative to object center: $\mathbf{r}_{w,i} = [R\cos\phi_i, R\sin\phi_i]^T$

The net force applied by contact $i$ on the object is:

$$\mathbf{f}_i = F_{n,i} \hat{\mathbf{n}}_{w,i} - F_{t,i} \hat{\mathbf{t}}_{w,i}$$

where tangential force $F_{t,i}$ opposes relative motion. The resulting 2D cross product for torque is:

$$\tau_i = (\mathbf{r}_{w,i} \times \mathbf{f}_i)_z = -R F_{t,i}$$

Because radial normal forces pass directly through the circular object center, $(\mathbf{r}_{w,i} \times \hat{\mathbf{n}}_{w,i})_z = 0$, normal forces generate zero net torque about the center of mass in symmetric circular geometry. Torque resistance is provided entirely by the tangential friction forces.

### 2.2 Wrench Equilibrium & Null-Space Decomposition
The grasp matrix partitions into normal and tangential components:

$$\mathbf{G}(\theta) = [\mathbf{G}_n(\theta) \mid \mathbf{G}_t(\theta)]$$

To maintain static equilibrium under external wrench $\mathbf{w}_{\text{ext}}$, the contact forces must satisfy:

$$\mathbf{G}_n \mathbf{f}_n + \mathbf{G}_t \mathbf{f}_t + \mathbf{w}_{\text{ext}} = \mathbf{0}$$

Any vector $\mathbf{f}_{n,\text{null}} \in \ker(\mathbf{G}_n)$ satisfies $\mathbf{G}_n \mathbf{f}_{n,\text{null}} = \mathbf{0}$ and represents internal grasp squeeze. For symmetric radial topologies:
- $N=3$: $\ker(\mathbf{G}_n)$ is 1-dimensional, spanned by $[1, 1, 1]^T$. Internal squeeze must be reinforced uniformly.
- $N=4$: $\ker(\mathbf{G}_n)$ is 2-dimensional, permitting independent adjustment of opposing contact pairs ($0 \leftrightarrow 2$ and $1 \leftrightarrow 3$).
- $N=5$: $\ker(\mathbf{G}_n)$ is 3-dimensional, permitting distributed continuous rebalancing.

### 2.3 Coupled Object Dynamics (Planar Newton-Euler)
The rigid body evolves under symplectic Euler integration with time step $\Delta t = 1\,\text{ms}$:

$$\mathbf{v}(t + \Delta t) = \mathbf{v}(t) + \frac{\Delta t}{m} \left( \sum_{i=1}^N \mathbf{f}_i(t) + \mathbf{f}_{\text{ext}}(t) \right)$$

$$\omega(t + \Delta t) = \omega(t) + \frac{\Delta t}{I_{zz}} \left( \sum_{i=1}^N \tau_i(t) + \tau_{\text{ext}}(t) \right)$$

$$\mathbf{x}(t + \Delta t) = \mathbf{x}(t) + \Delta t \mathbf{v}(t + \Delta t)$$

$$\theta(t + \Delta t) = \theta(t) + \Delta t \omega(t + \Delta t)$$

where moment of inertia $I_{zz} = \frac{1}{2} m R^2$.

---

## 3. Contact Physics Kernels & Actuator Limits

Each contact point $i \in \{0, \dots, N-1\}$ is modeled using the certified HOROS Contact Physics v2.1.3.11 kernels:
1. **Cattaneo-Mindlin Partial-Slip Elastic Kernel:** Solves the core sticking radius $c_i(t)$ and annular slip distribution under changing normal force $F_{n,i}(t)$.
2. **LuGre Dynamic Friction Kernel:** Tracks micro-bristle deflection $z_i(t)$ with Stribeck friction dynamics and viscous damping $\sigma_{2,i}$.
3. **Synchronized Hybrid Stepper (`step_hybrid_synchronized`):** Couples tangential force evolution with normal indentation rate $\dot{\delta}_n$, enforcing strict passivity bounds and energy conservation.

### Actuator Physical Constraints
- **Normal Force Safety Bounds:** $F_{n,i} \in [3.0, 25.0]\,\text{N}$ per finger.
- **Actuator Slew Rate Limit:** $|\dot{F}_{n,i}| \le 50.0\,\text{N/s}$ ($0.05\,\text{N/step}$ at $\Delta t = 1\,\text{ms}$).
- **Rate-Limited Update Rule:**
  
  $$\Delta F_{n,i} = \text{clip}(F_{n,i}^{\text{target}} - F_{n,i}(t), -0.05\,\text{N}, +0.05\,\text{N})$$
  $$F_{n,i}(t + \Delta t) = \text{clip}(F_{n,i}(t) + \Delta F_{n,i}, 3.0\,\text{N}, 25.0\,\text{N})$$

---

## 4. Benchmark Architecture & Controllers

Seven distinct grasp controllers are evaluated across all 900 scenarios:

1. **Equal Force Per Contact (EqualForce):** Commands fixed nominal force $F_{n,i} = 8.0\,\text{N}$ on all active fingers.
2. **Fixed Total Force (FixedTotal):** Symmetrically divides a fixed total force budget $F_{n,\text{total}} = N \times 8.0\,\text{N}$ equally among active fingers ($F_{n,i} = F_{n,\text{total}} / N_{\text{active}}$).
3. **Rule-Based Cooperative (RuleBased):** Heuristically transfers force toward contacts with high shear ratios $\xi_i = |F_{t,i}| / F_{n,i}$.
4. **Predictive Margin Balancing (Predictive):** Uses causal tactile estimators to forecast remaining physical safety margin $m_i(t)$ and commands proportional compensation $K_m (m_{\text{safe}} - m_i)$.
5. **Independent P5-T1 Adaptive (IndependentP5T1):** Pre-allocates preloads independently for each contact based on local friction classification without inter-finger communication.
6. **P5-T2 Learned Cooperative Extension (P5T2Extension):** Naive extension of the two-contact learned allocator to $N$ contacts.
7. **Proposed Controller: Learned Uncertainty-Aware N-Contact Controller (`LearnedUncertaintyAwareNContact`):**
   - Causal tactile tracking of local stability margins $\hat{m}_i(t)$ and epistemic uncertainty variances $\sigma_{u,i}^2(t)$.
   - Cooperative margin balancing decomposing into grasp null-space uniform squeeze reinforcement ($K_m \min_j(\text{deficit}_j)$) and differential margin redistribution ($K_m (\text{deficit}_i - \bar{\text{deficit}})$).
   - Epistemic uncertainty fallback bonus ($K_u \sigma_{u,i}^2$).
   - Dynamic contact loss detection and directional load transfer.
   - Strictly causal operation with rate-limiting and force budget enforcement.

---

## 5. Pre-Registered Acceptance Criteria (Stage B10)

| Criterion | Target Metric | Full PASS Requirement | Conditional PASS Requirement |
|---|---|---|---|
| **C1. Overall Success** | Pooled grasp success across 900 episodes | $\ge 85.0\%$ | $\ge 80.0\%$ |
| **C2. Topology Generalization** | Stratified success for $N=3, 4, 5$ | $\ge 80.0\%$ for each topology | $\ge 75.0\%$ for each topology |
| **C3. Comparative Performance** | Superiority over EqualForce baseline | $\ge +5.0\%$ diff, paired exact $p < 0.05$ | Statistically significant ($p < 0.05$) |
| **C4. Force-Budget Fairness** | Protocol B ($\sum F_n \le N \times 8.0\,\text{N}$) | Success $\ge$ FixedTotal baseline | Success within 2% of FixedTotal |
| **C5. Contact Recovery** | Recovery from unexpected finger loss | $\ge 80.0\%$ pooled recovery | $\ge 70.0\%$ on force-closure topologies ($N \ge 4$) |
| **C6. Physical Consistency** | Symplectic energy/wrench conservation | Zero violations | Zero violations |
| **C7. Causal Telemetry** | Information barrier audit | Zero oracle leaks | Zero oracle leaks |
| **C8. Actuator Safety** | Bound and rate limits | Zero rate/bound violations | Zero rate/bound violations |
| **C9. Real-Time Latency** | Execution time per step | P95 latency $\le 0.80\,\text{ms}$ | P95 latency $\le 1.00\,\text{ms}$ |
| **C10. Reproducibility** | Seed deterministic replay | 100% matched replay | 100% matched replay |

---

## 6. Pre-Registered Failure Handling & Non-Closure Theorem

If a specific topology lacks mathematical force closure during contact loss (e.g., $N=3$ reduced to two non-antipodal contacts at $120^\circ$ where friction cone angle $\phi < 30^\circ$), this failure mode shall be documented as a structural mechanical limitation rather than a software defect, provided:
1. The mathematical proof of non-closure is formally derived from Coulomb friction bounds and Salisbury & Roth grasp theorems.
2. The controller demonstrates valid recovery on all topologies where force closure is mathematically preserved ($N \ge 4$).
3. The controller achieves superior recovery compared to all baseline controllers across the full benchmark.
