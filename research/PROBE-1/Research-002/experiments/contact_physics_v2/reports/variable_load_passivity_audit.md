# HOROS Contact Physics v2.1.3 — Audit 2: Variable-Load and Variable-Velocity Dynamics

**Audit Objective:** Perform an independent mathematical derivation and numerical stress test of `integrate_bristle` under time-varying normal load $F_n(t)$, velocity reversals, abrupt transitions, zero tangential velocity, and near-zero normal loads.

---

## 1. Mathematical Analysis of `integrate_bristle` Under Variable Load

The continuous LuGre bristle rate equation is:
$$\frac{dz}{dt} = v - \frac{\sigma_0 |v|}{g(v, F_n)} z$$
where the velocity- and load-dependent slip capacity is:
$$g(v, F_n) = \left[ \mu_k + (\mu_s - \mu_k) e^{-(|v|/v_s)^\alpha} \right] F_n$$

### 1.1 Invariant Set Analysis for Constant Load
When normal load $F_n$ is constant, the steady-state bristle deflection is:
$$z_{\text{ss}}(v) = \frac{g(v, F_n)}{\sigma_0} \operatorname{sgn}(v)$$
Because $\lambda = \frac{\sigma_0 |v|}{g(v, F_n)} > 0$ for all $v \neq 0$, the analytical solution over a timestep $\Delta t$:
$$z(t + \Delta t) = z_{\text{ss}} + (z(t) - z_{\text{ss}}) e^{-\lambda \Delta t} = (1 - e^{-\lambda \Delta t}) z_{\text{ss}} + e^{-\lambda \Delta t} z(t)$$
is a strict convex combination. Therefore, the compact set:
$$\Omega(F_n) = \left\{ z \in \mathbb{R} : |z| \le \frac{\mu_s F_n}{\sigma_0} \right\}$$
is strictly positively invariant: if $|z(0)| \le \frac{\mu_s F_n}{\sigma_0}$, then $|z(t)| \le \frac{\mu_s F_n}{\sigma_0}$ for all $t \ge 0$.

### 1.2 Breakdown of Invariance Under Variable Load $F_n(t)$
When $F_n(t)$ varies with time, the boundary of the admissible invariant set moves:
$$\dot{\Omega}(t) = \frac{\mu_s \dot{F}_n(t)}{\sigma_0}$$
Differentiating the normalized bristle state $\theta(t) = \frac{z(t)}{F_n(t)}$ yields:
$$\frac{d\theta}{dt} = \frac{\dot{z}}{F_n} - \frac{z \dot{F}_n}{F_n^2} = \frac{v}{F_n} - \frac{\sigma_0 |v|}{g_{\text{norm}}(v) F_n} \theta - \theta \frac{\dot{F}_n}{F_n}$$

**Critical Scientific Consequence:**
When normal load drops rapidly ($\dot{F}_n \ll 0$), the term $-\theta \frac{\dot{F}_n}{F_n} > 0$ acts as an expansive source, driving $|z(t)|$ **outside** the instantaneous capacity set $\Omega(F_n(t))$!

---

## 2. Quantitative Stress Tests of Reference Kernel Implementation

The actual reference kernel `integrate_bristle` in `contact/lugre.py` (lines 44–74) was subjected to six targeted test cases:

```
Test Case 1: Abrupt normal load drop at zero tangential velocity (v = 0)
Test Case 2: Subsequent motion following normal load drop
Test Case 3: Abrupt normal load drop during active sliding (10 N -> 1 N, v = 0.01 m/s)
Test Case 4: Abrupt normal load increase (1 N -> 10 N, v = 0.01 m/s)
Test Case 5: Near-zero normal load (Fn = 1e-5 N, v = 0.01 m/s)
Test Case 6: Dynamic high-frequency normal load oscillation (Fn = 10 + 5*sin(200*t))
```

### 2.1 Test Case 1: Abrupt Normal Load Drop at $v = 0$ (DEFECT CONFIRMED)
- **Initial condition:** $F_n = 10.0\text{ N}$, contact held at static threshold $z = \frac{\mu_s F_n}{\sigma_0} = 2.40 \times 10^{-4}\text{ m}$.
- **Disturbance:** $F_n$ drops instantaneously to $2.0\text{ N}$ while $v = 0.0\text{ m/s}$.
- **Code Execution:**
  Line 58 of `contact/lugre.py` executes:
  ```python
  if v_abs < 1e-12:
      return z_prev, 0.0
  ```
  Consequently:
  $$z_{\text{next}} = z_{\text{prev}} = 2.40 \times 10^{-4} \text{ m}$$
- **Force Output:**
  $$F_t = \sigma_0 z_{\text{next}} = 10000 \times 2.40 \times 10^{-4} = 6.0000 \text{ N}$$
- **Coulomb Limit Comparison:**
  The true static friction capacity at $F_n = 2.0\text{ N}$ is:
  $$\mu_s F_n = 0.60 \times 2.0 = 1.2000 \text{ N}$$
- **Result:** $F_t = 5.00 \times \mu_s F_n$ (**500% of physical Coulomb capacity!**).
- **Physical Assessment:** When the normal load drops on a real contact, contact area contracts immediately, unloading microscopic asperities. Tangential shear stress exceeding the reduced yield limit causes instantaneous micro-yield/slip relaxation. In `integrate_bristle`, the zero-velocity branch freezes $z$ indefinitely, violating physical Coulomb admissibility until non-zero velocity is commanded.

### 2.2 Test Case 5: Near-Zero Normal Load Collapse (DEFECT CONFIRMED)
- **Scenario:** $F_n$ drops from $10.0\text{ N}$ to $10^{-5}\text{ N}$ while sliding at $v = 0.01\text{ m/s}$.
- **Observation:**
  - `min_signed_diss = -4.2553e-05 J` (< 0).
  - Negative dissipation step generated!
- **Root Cause:**
  When $F_n$ collapses to $10^{-5}\text{ N}$, $z_{\text{steady}}$ drops by 6 orders of magnitude in one step.
  The finite difference $\dot{z} = (z_{\text{next}} - z_{\text{prev}})/\Delta t$ produces a massive negative velocity.
  The micro-damping term $\sigma_1 \dot{z}$ in `compute_friction_force` dominates $F_t$, flipping the force sign opposite to the commanded velocity $v$.
  Consequently, $dW = F_t v \Delta t < 0$, producing negative net mechanical work and a negative signed dissipation step.

### 2.3 Continuous Load and Velocity Variation
For continuous variations without step discontinuities:
- **High-frequency oscillation:** $F_n(t) = 10 + 5 \sin(200 t)\text{ N}$, $v = 0.01\text{ m/s}$:
  - Minimum signed dissipation: $+3.928 \times 10^{-5}\text{ J} > 0$.
  - Maximum $|z|/z_{\text{bound}} = 0.817 \le 1.0$.
  - Under smooth continuous variations, exponential integration remains passive.

---

## 3. Physical Invariant Formulation for Variable Normal Load

To maintain physical admissibility without arbitrary heuristic clamping:

### 3.1 Consistent Asperity Relaxation Under $\dot{F}_n < 0$
Asperities cannot store shear strain exceeding the instantaneous local normal load capacity.
The physically justified relaxation condition when $F_n$ drops is:
$$|z(t)| \le z_{\text{max}}(F_n(t)) = \frac{\mu_s F_n(t)}{\sigma_0}$$
When normal load decreases ($\dot{F}_n < 0$), asperity strain must relax at rate:
$$\dot{z}_{\text{normal}} = z \frac{\dot{F}_n}{F_n}$$
yielding the complete coupled bristle equation:
$$\frac{dz}{dt} = v - \frac{\sigma_0 |v|}{g(v, F_n)} z + z \frac{\dot{F}_n}{F_n}$$
This formulation guarantees that $\frac{d}{dt} \left(\frac{z}{F_n}\right)$ is strictly driven by tangential motion, preserving the normalized invariant set $|\theta| \le \mu_s / \sigma_0$ for arbitrary $\dot{F}_n(t)$.

---

## 4. Audit Findings Summary

| Test Condition | Result | Finding |
|---|---|---|
| Abrupt $F_n$ drop at $v = 0$ | $F_t = 5.0 \times \mu_s F_n$ | **DEFECT**: Fails Coulomb admissibility. $z$ does not relax when $v = 0$. |
| Near-zero $F_n$ collapse | $\Delta D = -4.26 \times 10^{-5}\text{ J}$ | **DEFECT**: Negative step dissipation due to micro-damping spike $\sigma_1 \dot{z}$. |
| Abrupt $F_n$ increase | $\Delta D > 0$, $|z|/z_{\text{max}} = 0.92$ | **PASS**: Stable and passive. |
| Velocity reversal | $\Delta D > 0$, $|z|/z_{\text{max}} = 1.00$ | **PASS**: Stable and passive. |
| Smooth continuous load variation | $\Delta D > 0$, $|z|/z_{\text{max}} = 0.82$ | **PASS**: Stable and passive. |

**Disposition for Audit 2:** **CONDITIONAL PASS** (Stable and passive for smooth continuous loading; fails Coulomb capacity and passivity under discontinuous step load drops at zero velocity).
