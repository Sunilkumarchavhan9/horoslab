# HOROS PROBE-1 — Research-002
## Stage P2.6: Contact-Aware Action Substitution & Intervention Design
**Program:** HOROS PROBE-1 — Humanoid Robotics & Physical AI  
**Project:** Research-002: Trustworthy Action-Conditioned Contact World Models  
**Document:** `36-contact-aware-intervention-design.md`  
**Status:** Architecture Specification  

---

## 1. The Fundamental Flaw of Decoupled Clamping

Decoupled Control Barrier Functions (CBFs) treat candidate actions as single variables to be projected onto safe half-spaces. In manipulation with frictional contact:
$$h_{\text{slip}}(s) = 1.0 - \frac{\|F_t\|}{\mu F_n} \ge 0$$

When the planner proposes an arm lift command $a_{\text{lift}} > 0$:
1. Upward acceleration requires vertical shear $F_t = m(g + \ddot{z})$.
2. If current normal preload $F_n$ is insufficient to keep $\text{slip} \le 0.85$, the standard CBF clamps $a_{\text{lift}} \leftarrow 0$.
3. **The Resulting Pathology:** Setting $a_{\text{lift}} = 0$ does not teach the robot to grasp more firmly; it simply arrests the robot. When the robot stops lifting, $F_t$ drops back to static gravity load, but without vertical velocity, the task cannot advance. At the next step, the planner commands lift again, and the filter clamps again.

---

## 2. The Action Substitution Principle

Rather than treating safety intervention as a negative veto ($a_{\text{lift}} = 0$), **Action Substitution** solves for the joint projection $(a_{\text{sqz}}^*, a_{\text{lift}}^*)$ that maximizes task progress while guaranteeing barrier satisfaction:

$$\max_{a \in \mathcal{A}} \quad a_{\text{lift}} - \lambda \|a - a_{\text{planner}}\|^2$$
$$\text{subject to} \quad \frac{\|F_t(s, a_{\text{lift}})\|_2}{\mu F_n(s, a_{\text{sqz}})} \le \text{slip}_{\text{safe}} \quad (0.85)$$
$$F_{n, i}(s, a_{\text{sqz}}) \le F_{\text{crush}} \quad (20.0\text{ N})$$

### 2.1 Analytic Closed-Form Action Projection
In discrete-time impedance execution:
1. **Normal Force Preload Deficit:**  
   Given gravity load $F_g = mg$, the required minimum normal force to support the object with safety margin $\gamma = 0.80$ across $N_f = 4$ fingers is:
   $$F_{n, \text{required}} = \frac{F_g}{N_f \cdot \mu \cdot \gamma} = \frac{7.848}{4 \cdot 0.50 \cdot 0.80} = 4.905\text{ N/finger}$$
   $$\text{Deficit: } \Delta F_{n, i} = \max\left(0.0, F_{n, \text{required}} - F_{n, i}\right)$$
2. **Preload Squeeze Substitution:**  
   With fingertip contact stiffness $k_{\text{contact}} \approx 4.0\text{ N/mm}$, the required inward squeeze increment is:
   $$\Delta a_{\text{sqz}, i} = \frac{\Delta F_{n, i}}{k_{\text{contact}}} = \frac{\Delta F_{n, i}}{4.0}$$
   $$a_{\text{sqz}, i}^{\text{substituted}} = \max\left(a_{\text{sqz}, i}^{\text{planner}}, \min\left(1.5, \Delta a_{\text{sqz}, i}\right)\right)$$
3. **Feasible Lift Capacity Scaling:**  
   Instead of setting $a_{\text{lift}} = 0$, scale vertical velocity to match current friction capacity:
   $$a_{\text{lift}}^{\text{substituted}} = a_{\text{lift}}^{\text{planner}} \cdot \max\left(0.0, \min\left(1.0, \frac{\mu \sum F_{n, i}}{F_g \cdot 1.15}\right)\right)$$

### 2.2 Dynamic Transient Micro-Slip Window
During initial contact lift-off, shear force develops before normal force fully equilibrates. We implement a **Transient Slip Credit**:
- If $\text{slip} \in [0.85, 0.95]$ and $\dot{F}_n > 0.5$ N/step (normal force is actively increasing), allow $a_{\text{lift}} > 0$ for up to $\tau_{\text{transient}} = 2$ consecutive steps ($40$ ms).
- If $\text{slip} > 0.95$ or $\dot{F}_n \le 0$, immediately enforce full velocity arrest to prevent gross slip.

