# HOROS PROBE-1 — Research-002
## Stage P2.4: Contact Boundary Sampling & Physical Exploration
**Program:** HOROS PROBE-1 — Humanoid Robotics & Physical AI  
**Project:** Research-002: Trustworthy Action-Conditioned Contact World Models  
**Document:** 20-contact-boundary-sampling.md  
**Status:** Algorithmic Specification  

---

## 1. Physical Mechanics of Contact Boundaries

Passive data collection fails in contact manipulation because random actions almost never linger near unstable equilibrium boundaries. Contact dynamics exhibit severe hybrid discontinuities:
1. **Coulomb Friction Cone Boundary:**  
   $$\mathcal{F}_{\text{cone}} = \left\{ (F_n, F_t) \in \mathbb{R}_+ \times \mathbb{R}^2 \mid \|F_t\| \le \mu F_n \right\}$$
   - Inside ($\|F_t\| < \mu F_n$): Sticking regime (bilateral constraint, velocity $v_t = 0$).
   - On boundary ($\|F_t\| = \mu F_n$): Incipient slip transition (tangential acceleration onset).
   - Outside ($\|F_t\| > \mu F_n$): Gross slip (unilateral dissipative sliding).
2. **Two-Point Wedging Envelope (Peg-in-Hole Insertion):**  
   $$\theta_{\text{crit}} = \arctan\left(\frac{2\delta}{L}\right)$$
   where $\delta$ is diametral clearance and $L$ is insertion depth.
   - For tilt angle $\theta < \theta_{\text{crit}}$: Free clearance or single-point sliding.
   - For tilt angle $\theta \ge \theta_{\text{crit}}$: Two-point contact wedging occurs, multiplying reaction forces by factor $\kappa = 1 + 3\frac{\theta}{\theta_{\text{crit}}}$.

---

## 2. Active Boundary Sampling Algorithms

### 2.1 Friction Boundary Perturbation (Task 2)
To generate candidate trajectories grazing the friction cone:
1. **Normal Force Target Preload:**  
   Command inward finger squeeze to establish nominal preload $F_n^* \in [6.0, 15.0]$ N.
2. **Critical Shear Velocity Sweep:**  
   Compute critical lift acceleration:
   $$a_{z, \text{crit}} = \frac{\mu \sum_{i=1}^4 F_{n, i}}{m_{\text{obj}}} - g$$
   Perturb arm vertical command $a_z \sim \mathcal{N}(a_{z, \text{crit}}, \sigma_a^2)$ to systematically oscillate across the sticking-to-slip transition.

### 2.2 Wedging Boundary Perturbation (Task 1)
To generate trajectories testing wedging and chamfer transitions:
1. **Nominal Downward Feed:** Command downward velocity $\Delta z \in [-3.0, -5.0]$ mm/step.
2. **Boundary Angular Dither:**  
   Apply angular perturbation $\theta_{\text{tilt}} \sim \mathcal{U}(0.8 \cdot \theta_{\text{crit}}, 1.2 \cdot \theta_{\text{crit}})$.
3. **Lateral Search Dither:**  
   Dither lateral position $\Delta x, \Delta y \in [-0.8\delta, +0.8\delta]$ to explore rim impact and chamfer sliding without inducing irreversible hard jamming.

---

## 3. Coordinated Manipulation Exploration Policy (Task 2)

Unlike naive random exploration (which acts blindly in $[-1, 1]$ on all 5 DoFs), the coordinated exploration policy generates structured multi-phase candidates:
- **Phase 1 (Contact Establishment, Steps 0–2):** Inward squeeze commands $a_{0:3} \in [1.0, 2.0]$ mm/step; vertical lift $a_4 = 0.0$.
- **Phase 2 (Preload Stabilization, Steps 3–4):** Normal force feedback regulation to maintain $F_n \in [8, 16]$ N.
- **Phase 3 (Dynamic Lift Sweep, Steps 5–15):** Upward arm velocity $a_4 \in [0.5, 3.0]$ mm/step while modulating finger squeeze to probe the friction boundary.
- **Phase 4 (Grip Retention / Slip Recovery, Steps 16–25):** Compensatory squeeze adjustments if slip is detected ($\Delta a_{0:3} = +1.0$ mm upon incipient slip).

This policy guarantees that the active candidate pool contains realistic, physically rich contact data.
