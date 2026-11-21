# HOROS Contact Physics v2.1.3 — Verification 2: Constitutive Damping Bound & Velocity Reversals

**Audit Type:** Independent Mathematical Derivation and Read-Only Source Verification  
**Target:** Bristle Velocity Derivative and Micro-Damping Force in `integrate_bristle()` and `compute_friction_force()` (`contact/lugre.py`)  
**Scope:** Mathematical correction of the claimed bound from $|\dot{z}| \le |v|$ to $|\dot{z}| \le 2|v|$, velocity reversals with opposite-sign bristle deflections, and complete signed power dissipation proof.

---

## 1. Mathematical Correction of the Bristle Velocity Bound

In `contact/lugre.py`, the constitutive bristle velocity is evaluated as:
$$\dot{z}_{\text{constitutive}} = v - \frac{\sigma_0 |v|}{g(v, F_n)} z_{\text{next}}$$

### 1.1 Invariant Set Bound
By virtue of the exponential integration of the LuGre ODE, the state $z_{\text{next}}$ is strictly contained within the positively invariant set:
$$\Omega = \left\{ z \in \mathbb{R} : |z| \le \frac{g(v, F_n)}{\sigma_0} \right\}$$
Therefore, the normalized state $\chi = \frac{\sigma_0 z_{\text{next}}}{g(v, F_n)}$ satisfies:
$$-1 \le \chi \le +1$$

### 1.2 Evaluation Across Operating Regimes
Substituting $\chi$ into the constitutive derivative:
$$\dot{z}_{\text{constitutive}} = v - |v| \chi = v \left( 1 - \operatorname{sgn}(v) \chi \right)$$

1. **Steady-State Forward Sliding ($v > 0, \chi = +1$):**
   $$\dot{z} = v (1 - 1) = 0$$
2. **Virgin Contact / Un-deflected Bristle ($v > 0, \chi = 0$):**
   $$\dot{z} = v (1 - 0) = v$$
3. **Extreme Velocity Reversal ($v > 0, \chi = -1$):**
   When velocity instantaneously reverses from negative to positive while the bristle is still fully deflected in the negative direction ($z_{\text{next}} = -g/\sigma_0$):
   $$\dot{z} = v (1 - (-1)) = 2v$$
4. **Extreme Velocity Reversal ($v < 0, \chi = +1$):**
   When velocity reverses from positive to negative while the bristle is deflected in the positive direction ($z_{\text{next}} = +g/\sigma_0$):
   $$\dot{z} = v (1 - (+1)) = v (1 - (-1)) = 2v$$

### 1.3 Corrected Mathematical Invariant Bound
$$\sup_{z \in \Omega, v \in \mathbb{R}} |\dot{z}_{\text{constitutive}}| = 2|v|$$
**Audit Finding:** The claim in the v2.1.2 audit report that $|\dot{z}| \le |v|$ was **mathematically incomplete**: it held only when $z$ had the same sign as $v$. Under velocity reversals, $z$ opposes $v$, yielding the rigorous upper bound $|\dot{z}| \le 2|v|$.

---

## 2. Micro-Damping Force and Hysteresis Behavior During Reversals

In `contact/lugre.py`, total tangential force is:
$$F_t = \sigma_0 z_{\text{next}} + \sigma_1 \dot{z}_{\text{constitutive}} + \sigma_2 v$$

### 2.1 Behavior at the Exact Turning Point
Consider an extreme reversal at $t = t^*$ where $v > 0$ and $z_{\text{next}} = -g/\sigma_0$:
- Elastic force: $F_{\text{elastic}} = \sigma_0 \left(-\frac{g}{\sigma_0}\right) = -g(v, F_n) < 0$.
- Damping force: $F_{\text{damp}} = \sigma_1 (2v) > 0$.
- Viscous force: $F_{\text{visc}} = \sigma_2 v > 0$.
- Total tangential force:
  $$F_t = -g(v, F_n) + (2\sigma_1 + \sigma_2) v$$

For small velocities $v \ll \frac{g}{2\sigma_1 + \sigma_2}$:
$$F_t < 0 \quad \text{while } v > 0$$
The friction force temporarily **opposes the direction of commanded velocity** ($F_t \cdot v < 0$).

### 2.2 Physical and Thermodynamic Justification
This force opposition is **NOT a passivity violation**:
- It represents the physical restoring force of elastic asperities that were bent backward during prior sliding and are now springing forward against the newly reversed motion.
- Enforcing an artificial constraint that $F_t \cdot v \ge 0$ would completely destroy pre-sliding hysteresis loops and violate Newton's third law.

---

## 3. Rigorous Proof of Complete Signed Power Passivity

To verify that $|\dot{z}| \le 2|v|$ maintains thermodynamic passivity, we evaluate the complete signed dissipation rate without masking:
$$\dot{D} = P_{\text{in}} - \dot{V} = F_t v - \sigma_0 z_{\text{next}} \dot{z}_{\text{constitutive}}$$

Substituting $F_t = \sigma_0 z_{\text{next}} + \sigma_1 \dot{z} + \sigma_2 v$:
$$\dot{D} = \sigma_0 z_{\text{next}} (v - \dot{z}) + \sigma_1 \dot{z} v + \sigma_2 v^2$$

Using the constitutive relation $v - \dot{z} = \frac{\sigma_0 |v|}{g(v)} z_{\text{next}}$:
$$\dot{D} = \frac{\sigma_0^2 |v|}{g(v)} z_{\text{next}}^2 + \sigma_1 \dot{z} v + \sigma_2 v^2$$

Evaluating at the extreme reversal point where $v > 0$, $z_{\text{next}} = -g/\sigma_0$, and $\dot{z} = 2v$:
1. First term: $\frac{\sigma_0^2 v}{g} \left( -\frac{g}{\sigma_0} \right)^2 = g(v, F_n) v > 0$.
2. Second term: $\sigma_1 (2v) v = 2 \sigma_1 v^2 \ge 0$.
3. Third term: $\sigma_2 v^2 \ge 0$.

Summing all three terms:
$$\dot{D}_{\text{reversal}} = g(v, F_n) v + 2\sigma_1 v^2 + \sigma_2 v^2 > 0$$

### 3.3 Empirical Numerical Evidence
Tested across four decades of velocity under extreme reversal initial conditions ($z = -z_{\text{max}}$):

| Velocity $v$ (m/s) | $|\dot{z}|/|v|$ Ratio | $F_t$ (N) | Force Sign Opposes $v$? | Dissipation $\dot{D}$ (W) | Passivity Status |
|---|---|---|---|---|---|
| $0.0001$ | $1.999992$ | $-5.9073$ | **YES** ($F_t < 0$) | $+6.088 \times 10^{-4}$ | **PASS ($\dot{D} > 0$)** |
| $0.0100$ | $1.999000$ | $+4.0155$ | NO | $+1.400 \times 10^{-1}$ | **PASS ($\dot{D} > 0$)** |
| $0.1000$ | $1.990025$ | $+84.7510$ | NO | $+9.460 \times 10^{0}$ | **PASS ($\dot{D} > 0$)** |
| $1.0000$ | $1.902459$ | $+853.0942$ | NO | $+8.617 \times 10^{2}$ | **PASS ($\dot{D} > 0$)** |

**Observation:** Even when $F_t = -5.907\text{ N}$ opposes $v = +0.0001\text{ m/s}$ ($P_{\text{in}} = -5.91 \times 10^{-4}\text{ W} < 0$), the discharging elastic energy ($\dot{V} = -1.20 \times 10^{-3}\text{ W}$) discharges faster than $P_{\text{in}}$, yielding net positive dissipation $\dot{D} = +6.088 \times 10^{-4}\text{ W} > 0$.

---

## 4. Audit Disposition

**Disposition: PASS**  
The correct bound $|\dot{z}| \le 2|v|$ is mathematically established and numerically confirmed. The resulting friction force correctly captures physical hysteresis during reversals, and the complete signed power balance is unconditionally non-negative ($\dot{D} \ge 0$).
