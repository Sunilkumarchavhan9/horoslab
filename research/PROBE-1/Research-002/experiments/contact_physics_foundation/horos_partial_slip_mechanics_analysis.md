# HOROS PROBE-1 — Partial Slip Mechanics & Non-Linear Compliance Analysis

**Program:** HOROS Physical Intelligence Research Group  
**Project:** Research-002: Model Teaching Infrastructure & Contact Mechanics  
**Document Identifier:** `HOROS-P1-R002-PARTIAL-SLIP-MECHANICS-ANALYSIS`  
**Date:** 2026-11-20  
**Status:** **AUTHORITATIVE SCIENTIFIC SPECIFICATION**  

---

### 1. Executive Summary & Problem Formulation

The empirical diagnosis of HOROS PROBE-1 ([`s4_diagnostic_experiment_report.md`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/experiments/s4_diagnostic_experiment/s4_diagnostic_experiment_report.md)) demonstrated that the existing simulator ([`compliant_prelift_env.py`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/environment/compliant_prelift_env.py)) exhibits **zero pre-slip observability** ($R^2 \le 0.0$ for friction identification; 0 pre-slip forecasting lead time). The physical cause is the use of an idealized Amontons-Coulomb friction law coupled to a linear tangential spring:
$$F_t = k_{\text{pad}} \Delta z, \quad k_{\text{pad}} = \text{const} = 1500\text{ N/m}$$

Under this model, the tangent compliance $d\Delta z / dF_t = 1/k_{\text{pad}}$ is strictly invariant right up to the macroscopic slip boundary $F_t = \mu F_n$, at which point the contact transitions instantaneously from zero slip velocity to gross kinetic sliding. In real physical contact between an elastomeric robotic fingertip and a rigid workpiece, catastrophic slip is preceded by **incipient slip (partial slip)**: an annular peripheral region begins to slip while the inner core remains stuck.

This document details the continuum mechanics of partial slip, derives the non-linear compliance equations of Cattaneo-Mindlin and generalized elastomeric contact, and provides the exact mathematical foundation for `CompliantPreLiftContactEnv-v2`.

---

### 2. Continuum Contact Mechanics Foundation

#### 2.1 Hertz Normal Contact Mechanics
Consider an elastic body of radius $R$ pressed against a flat half-space under a normal load $F_n$. The effective elastic modulus $E^*$ is:
$$\frac{1}{E^*} = \frac{1 - \nu_1^2}{E_1} + \frac{1 - \nu_2^2}{E_2}$$
where $E_i$ and $\nu_i$ are Young's modulus and Poisson's ratio of the fingertip elastomer and workpiece.

The contact radius $a$ and normal indentation depth $\delta_n$ are given by Hertz's classical relations:
$$a(F_n) = \left( \frac{3 F_n R}{4 E^*} \right)^{1/3}$$
$$\delta_n(F_n) = \frac{a^2}{R} = \left( \frac{9 F_n^2}{16 R E^{*2}} \right)^{1/3}$$

The normal pressure distribution over the contact disk $0 \le r \le a$ is parabolic:
$$p(r) = p_0 \sqrt{1 - \left(\frac{r}{a}\right)^2}, \quad p_0 = \frac{3 F_n}{2 \pi a^2}$$

#### 2.2 Cattaneo-Mindlin Tangential Loading & Partial Slip
When a monotonically increasing tangential force $F_t$ is applied parallel to the contact interface under constant normal force $F_n$, the shear traction $q(r)$ would theoretically diverge to infinity at the contact perimeter $r = a$ under pure sticking conditions (Mindlin, 1949). Because real surfaces cannot sustain infinite shear stress, local slip must occur wherever $q(r) \ge \mu p(r)$.

As established independently by Cattaneo (1938) and Mindlin (1949), the contact disk divides into two distinct zones:
1. **Stick Core ($0 \le r \le c$):** Microscopic displacement is purely elastic; no slip occurs.
2. **Annular Slip Region ($c < r \le a$):** Micro-sliding occurs; shear traction is capped by the local Coulomb limit: $q(r) = \mu p(r)$.

```
   |<--------------------- 2a --------------------->|
   |              Contact Patch Area                |
   |        |<---------- 2c --------->|             |
   [ Slip ] [       Stick Core        ] [  Slip   ]
   +--------+-------------------------+-----------+
   r = -a   r = -c                   r = c       r = a
```

The stick core radius $c$ is related analytically to the applied tangential load ratio $F_t / (\mu F_n)$:
$$\frac{c}{a} = \left( 1 - \frac{F_t}{\mu F_n} \right)^{1/3}$$

The complete shear traction distribution $q(r)$ across the contact disk is:
$$q(r) = \begin{cases} 
\frac{3 \mu F_n}{2 \pi a^2} \left[ \sqrt{1 - (r/a)^2} - \frac{c}{a} \sqrt{1 - (r/c)^2} \right], & 0 \le r \le c \\ 
\mu p(r) = \frac{3 \mu F_n}{2 \pi a^2} \sqrt{1 - (r/a)^2}, & c < r \le a 
\end{cases}$$

---

### 3. Non-Linear Compliance and Tangent Stiffness

#### 3.1 Closed-Form Tangential Displacement
Integrating the surface traction field yields the non-linear relationship between tangential force $F_t$ and relative displacement $\delta_t$:
$$\delta_t(F_t) = \frac{3 \mu F_n (2 - \nu)}{16 G^* a} \left[ 1 - \left( 1 - \frac{F_t}{\mu F_n} \right)^{2/3} \right]$$
where $G^*$ is the equivalent shear modulus:
$$\frac{1}{G^*} = \frac{2 - \nu_1}{G_1} + \frac{2 - \nu_2}{G_2}$$

At small loads ($F_t \ll \mu F_n$), series expansion yields the initial linear elastic stiffness $k_{t,0}$:
$$1 - \left( 1 - \frac{F_t}{\mu F_n} \right)^{2/3} \approx \frac{2}{3} \frac{F_t}{\mu F_n} \implies \delta_t \approx \frac{(2 - \nu)}{8 G^* a} F_t$$
$$k_{t,0} = \left. \frac{d F_t}{d \delta_t} \right|_{F_t = 0} = \frac{8 G^* a(F_n)}{2 - \nu}$$

#### 3.2 Tangent Stiffness Softening Function
Differentiating $F_t$ with respect to $\delta_t$ yields the instantaneous tangent stiffness $k_t(F_t)$:
$$k_t(F_t) = \frac{d F_t}{d \delta_t} = k_{t,0} \cdot \left( 1 - \frac{F_t}{\mu F_n} \right)^{1/3}$$

This expression reveals the fundamental physical phenomenon missing from the current simulator:
1. **At zero shear ($F_t = 0$):** $k_t = k_{t,0}$.
2. **At $50\%$ slip capacity ($F_t = 0.5 \mu F_n$):** $k_t = k_{t,0} (0.5)^{1/3} \approx 0.794 \cdot k_{t,0}$ ($20.6\%$ softening).
3. **At $90\%$ slip capacity ($F_t = 0.9 \mu F_n$):** $k_t = k_{t,0} (0.1)^{1/3} \approx 0.464 \cdot k_{t,0}$ ($53.6\%$ softening).
4. **At $99\%$ slip capacity ($F_t = 0.99 \mu F_n$):** $k_t = k_{t,0} (0.01)^{1/3} \approx 0.215 \cdot k_{t,0}$ ($78.5\%$ softening).
5. **At gross slip ($F_t \to \mu F_n$):** $k_t \to 0$, and compliance $C_t = 1/k_t \to \infty$.

```
 Tangent Stiffness kt / kt,0
 1.0 |========\
 0.8 |         \
 0.6 |          \
 0.4 |           \
 0.2 |            \
 0.0 +-------------+----+----+----+----+---> Ft / (mu * Fn)
     0.0          0.2  0.4  0.6  0.8  1.0
```

#### 3.3 Physical Significance for Pre-Slip Forecasting
In Cattaneo-Mindlin mechanics, **frictional information is encoded in the tangent stiffness well before gross slip occurs.** Specifically:
$$\mu = \frac{F_t}{F_n \left[ 1 - \left( \frac{k_t(F_t)}{k_{t,0}} \right)^3 \right]}$$

By applying a dynamic probing motion or observing the force-displacement gradient during lift:
$$\hat{k}_t = \frac{\Delta F_t}{\Delta \delta_t}$$
An active controller or world model can estimate the proximity to slip and identify $\mu$ while the inner stick core $c > 0$ remains firmly anchored!

---

### 4. Generalization to Elastomeric Fingertip Pads

While the classical Cattaneo-Mindlin formulation assumes spherical elastic geometries, robotic fingertips typically feature flat or gently curved elastomeric pads (e.g. silicone, polyurethane).

#### 4.1 Multi-Annular Discretization Model
To capture non-spherical geometries and spatial pressure distributions while maintaining real-time execution ($< 1\text{ ms}$ per step), the contact interface is discretized into $M$ concentric annular rings (or an $N \times N$ cell grid):
- Area of ring $j$: $A_j$
- Normal force in ring $j$: $F_{n,j} = P_j A_j$, where $\sum_j F_{n,j} = F_n$
- Tangential elastic displacement: $\mathbf{u}_j$
- Local elastic bristle stiffness: $\sigma_{0,j}$

Each ring follows local Coulomb saturation:
$$F_{t,j} = \min\left( \sigma_{0,j} \|\mathbf{u}_j\|, \; \mu F_{n,j} \right) \cdot \frac{\mathbf{u}_j}{\|\mathbf{u}_j\|}$$

As the macroscopic pad displacement $\Delta \mathbf{z}$ increases:
1. Outer rings (where $P_j$ is lower) saturate first and begin micro-sliding.
2. Inner rings (where $P_j$ is highest) remain anchored in elastic stick.
3. The aggregate force $F_t = \sum_j F_{t,j}$ automatically reproduces the continuous softening curve without requiring numerical root-finding.

#### 4.2 Dynamic LuGre Friction Formulation
For continuous, rate-dependent transitions including the Stribeck effect and frictional damping, the distributed LuGre model defines internal bristle deflection $z(t)$:
$$\frac{dz}{dt} = v - \frac{\sigma_0 |v|}{g(v)} z$$
$$g(v) = F_C + (F_S - F_C) e^{-(v / v_s)^\alpha}$$
$$F_t = \sigma_0 z + \sigma_1 \frac{dz}{dt} + \sigma_2 v$$
where:
- $\sigma_0$: Tangential bristle stiffness ($\approx 10^4 - 10^5\text{ N/m}$)
- $\sigma_1$: Micro-damping coefficient ($\approx 10^2\text{ N}\cdot\text{s/m}$)
- $\sigma_2$: Viscous friction coefficient ($\approx 10^1\text{ N}\cdot\text{s/m}$)
- $F_C = \mu_k F_n$: Coulomb kinetic friction force
- $F_S = \mu_s F_n$: Static friction threshold ($\mu_s > \mu_k$)
- $v_s$: Stribeck reference velocity ($\approx 10^{-3}\text{ m/s}$)

Under steady pre-sliding ($v \to 0$):
$$\frac{dz}{dv} \approx 1 \implies \frac{dF_t}{d\delta} = \sigma_0 \left( 1 - \frac{\sigma_0 z}{F_S} \right)$$
which closely mirrors the Cattaneo-Mindlin compliance degradation.

---

### 5. Architectural Upgrade Specifications for HOROS Simulator

To replace the defective ideal Coulomb implementation without introducing uncontrolled third-party dependencies, the following algorithmic specifications are established for `CompliantPreLiftContactEnv-v2`:

```
+-------------------------------------------------------------------------+
|                  CompliantPreLiftContactEnv-v2 Architecture              |
|                                                                         |
|  1. Normal Mechanics:                                                   |
|     Fn,i = kn * (R_obj - r_i)^alpha  (alpha = 1.5, Hertzian hardening)  |
|     Contact Patch Radius: a_i = sqrt(R_eff * delta_n,i)                 |
|                                                                         |
|  2. Tangential Partial-Slip Engine:                                     |
|     ft_candidate = kt_0 * delta_z                                       |
|     slip_ratio = ft_candidate / (mu * Fn,i)                             |
|     stick_ratio = max(0.0, 1.0 - slip_ratio)^(1/3)                      |
|                                                                         |
|  3. Softened Traction & Micro-Displacement:                             |
|     Ft,i = mu * Fn,i * [1.0 - stick_ratio^3]  (Continuously softened)   |
|     Micro-slip velocity: v_micro,i = v_cmd * (1.0 - stick_ratio)        |
|     Gross slip occurs strictly when stick_ratio == 0.0                  |
|                                                                         |
|  4. Acoustic Emission / Vibrotactile Signal:                            |
|     Sensor noise variance sigma_t(t) scales inversely with stick_ratio  |
|     sigma_t = sigma_base + sigma_pre_slip * (1.0 - stick_ratio)^2       |
+-------------------------------------------------------------------------+
```

### 6. Verification & Mathematical Invariants

Any implementation of `CompliantPreLiftContactEnv-v2` must satisfy three formal invariants:
1. **Monotonic Softening Invariant:**
   $$\frac{\partial^2 F_t}{\partial \delta_t^2} \le 0 \quad \forall F_t \in [0, \mu F_n)$$
2. **Smooth Boundary Limit Invariant:**
   $$\lim_{F_t \to \mu F_n^-} \frac{d F_t}{d \delta_t} = 0$$
3. **Observability Invariant:**
   Under active probing $\Delta \delta_t$, the regression coefficient $R^2$ of estimated $\hat{\mu}$ from $\hat{k}_t$ satisfies:
   $$R^2(\hat{\mu}, \mu_{\text{true}}) \ge 0.85 \quad \text{for } F_t \ge 0.5 \mu F_n$$

---

### 7. Document Traceability & Sign-Off

- **Authors:** HOROS Physical Intelligence Simulation Working Group
- **Verification:** Closed-form mathematical proof derived from Cattaneo (1938) and Mindlin (1949).
- **Implementation Status:** Architecture baseline for `CompliantPreLiftContactEnv-v2`.
