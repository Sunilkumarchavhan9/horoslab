# HOROS Contact Physics v2: Independent Equation & Continuum Mechanics Audit

**Program:** HOROS Physical Intelligence Research Group  
**Project:** Research-002: Model Teaching Infrastructure & Contact Mechanics  
**Document Identifier:** `HOROS-P1-R002-INDEPENDENT-EQUATION-AUDIT`  
**Date:** 2026-11-20  
**Audit Target:** `experiments/contact_physics_v2/contact/`  
**Review Type:** Independent First-Principles Mathematical & Continuum Review  
**Auditor Disposition:** **CONDITIONAL PASS**  

---

### 1. Audit Scope & Review Charter

This audit provides an independent, first-principles mathematical and continuum mechanics derivation of every governing equation implemented in the **HOROS Contact Physics v2 Reference Kernel**.

In compliance with the audit charter:
1. The kernel's internal benchmark functions and self-reported metrics are **not** treated as an oracle.
2. Every constitutive relation is derived from classical continuum tribology (Hertz 1882, Cattaneo 1938, Mindlin 1949, Mindlin & Deresiewicz 1953, Johnson 1985).
3. Underlying assumptions, geometric constraints, material boundary conditions, and approximations are cataloged explicitly.

---

### 2. Independent Derivation & Verification of Governing Equations

#### 2.1 Composite Elastic Moduli & Half-Space Assumptions
In [`contact/material.py`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/experiments/contact_physics_v2/contact/material.py) (lines 75–93):
- **Composite Young's Modulus ($E^*$):**
  $$\frac{1}{E^*} = \frac{1 - \nu_1^2}{E_1} + \frac{1 - \nu_2^2}{E_2}$$
  *Continuum Basis:* Derived from the Boussinesq problem for normal surface deflection $w(r)$ of an isotropic elastic half-space under concentrated surface traction. Matches Johnson (1985) eq. 4.21.
  *Assumption:* Strictly valid for linear, isotropic, homogeneous elastic bodies where contact dimensions are small compared to the radii of curvature ($a \ll R$).
- **Mindlin Equivalent Shear Modulus ($G^*$):**
  $$\frac{1}{G^*} = \frac{2 - \nu_1}{G_1} + \frac{2 - \nu_2}{G_2}$$
  *Continuum Basis:* Derived from the Cerruti problem for tangential surface deflection $u_x(r)$ under shear traction. Matches Johnson (1985) eq. 7.15 and Mindlin (1949) eq. 15.
  *Initial Tangential Stiffness:*
  $$k_{t,0} = 8 G^* a = \frac{8 a}{\frac{2 - \nu_1}{G_1} + \frac{2 - \nu_2}{G_2}}$$
  When the counterbody (workpiece) is rigid ($E_2, G_2 \to \infty$):
  $$k_{t,0} = \frac{8 G_1 a}{2 - \nu_1}$$
  *Audit Finding:* Verified. The implementation in `cattaneo_mindlin.py` line 34 computes $k_{t,0} = 8 G^* a$ with zero discrepancy.

#### 2.2 Normal Contact Mechanics
In [`contact/normal_contact.py`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/experiments/contact_physics_v2/contact/normal_contact.py) (lines 27–43):
- **Spherical Indentation (Hertz 1882):**
  $$F_n(\delta_n) = \frac{4}{3} E^* R^{1/2} \delta_n^{3/2}, \quad a(\delta_n) = \sqrt{R \delta_n} = \left(\frac{3 F_n R}{4 E^*}\right)^{1/3}$$
  *Tangent Stiffness:* $k_n = \frac{d F_n}{d \delta_n} = 2 E^* R^{1/2} \delta_n^{1/2} = 2 E^* a$.
  *Finite-Difference Verification:* Verified against independent numerical derivative with relative error $1.7 \times 10^{-9}$ (machine precision).
- **Flat Cylindrical Punch (Boussinesq 1885):**
  $$F_n(\delta_n) = 2 E^* a \delta_n, \quad k_n = 2 E^* a = \text{const}$$
  *Audit Finding:* Verified. Accurately models a flat punch of constant radius $a$, exhibiting zero power-law softening.

#### 2.3 Tangential Compliance & Cattaneo–Mindlin Partial Slip
In [`contact/cattaneo_mindlin.py`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/experiments/contact_physics_v2/contact/cattaneo_mindlin.py) (lines 76–141):
- **Monotonic Displacement Function:**
  Mindlin (1949) proved that applying shear force $F_t < \mu F_n$ induces a central circular stick core of radius $c$ surrounded by an annular slip zone $c < r \le a$:
  $$\frac{c}{a} = \left( 1 - \frac{F_t}{\mu F_n} \right)^{1/3}$$
  Integrating the traction distribution over the contact area yields the relative tangential displacement $\delta_t$:
  $$\delta_t(F_t) = \frac{3 \mu F_n (2 - \nu)}{16 G a} \left[ 1 - \left( 1 - \frac{F_t}{\mu F_n} \right)^{2/3} \right] = \frac{3 \mu F_n}{2 k_{t,0}} \left[ 1 - \left( 1 - \frac{F_t}{\mu F_n} \right)^{2/3} \right]$$
  The maximum pre-sliding displacement before gross slip ($F_t = \mu F_n$) is:
  $$\delta_{t,\text{max}} = \frac{3 \mu F_n}{2 k_{t,0}}$$
- **Inverse Force Relation:**
  Inverting the displacement equation for $F_t(\delta_t)$:
  $$F_t(\delta_t) = \mu F_n \left[ 1 - \left( 1 - \frac{\delta_t}{\delta_{t,\text{max}}} \right)^{3/2} \right]$$
  Differentiating with respect to $\delta_t$:
  $$k_t(\delta_t) = \frac{d F_t}{d \delta_t} = \mu F_n \cdot \frac{3}{2} \left( 1 - \frac{\delta_t}{\delta_{t,\text{max}}} \right)^{1/2} \cdot \frac{1}{\delta_{t,\text{max}}} = k_{t,0} \left( 1 - \frac{\delta_t}{\delta_{t,\text{max}}} \right)^{1/2} = k_{t,0} \frac{c}{a}$$
  *Finite-Difference Verification:* Tested against numerical central differences $\frac{F_t(\delta_t+\epsilon) - F_t(\delta_t-\epsilon)}{2\epsilon}$ at 6 load ratios ($0.10 \le F_t / (\mu F_n) \le 0.95$). Max relative error was $7.0 \times 10^{-10}$.

#### 2.4 Tangential Traction Distribution $q(r)$
In [`contact/cattaneo_mindlin.py`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/experiments/contact_physics_v2/contact/cattaneo_mindlin.py) (lines 143–166):
$$q(r) = \begin{cases} 
\frac{3 \mu F_n}{2 \pi a^2} \left[ \sqrt{1 - (r/a)^2} - \frac{c}{a} \sqrt{1 - (r/c)^2} \right], & 0 \le r \le c \\ 
\mu p(r) = \frac{3 \mu F_n}{2 \pi a^2} \sqrt{1 - (r/a)^2}, & c < r \le a 
\end{cases}$$
- *Equilibrium Verification:* Integrating $2 \pi \int_0^a q(r) r dr$ yields:
  $$2 \pi \left[ \int_0^a \frac{3 \mu F_n}{2 \pi a^2} \sqrt{1 - (r/a)^2} r dr - \frac{c}{a} \int_0^c \frac{3 \mu F_n}{2 \pi a^2} \sqrt{1 - (r/c)^2} r dr \right] = \mu F_n \left[ 1 - \left(\frac{c}{a}\right)^3 \right] = F_t$$
  *Audit Finding:* Mathematically exact. Proves that total traction balances the applied shear force with zero residual error.

---

### 3. Mindlin–Deresiewicz Hysteresis & Loading Reversal

In [`contact/cattaneo_mindlin.py`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/experiments/contact_physics_v2/contact/cattaneo_mindlin.py) (lines 208–220):
Upon reversing the tangential displacement from turning point $(\delta_t^*, F_t^*)$, Mindlin & Deresiewicz (1953) proved that an annular zone of *counter-slip* forms from $b \le r \le a$, with inner stick core $0 \le r \le b$:
$$\frac{b}{a} = \left( 1 - \frac{F_t^* - F_t}{2 \mu F_n} \right)^{1/3}$$
The resulting force change follows the doubled-monotonic relation:
$$F_t^* - F_t = 2 F_t^{\text{monotonic}}\left( \frac{\delta_t^* - \delta_t}{2} \right)$$
*Audit Finding:* The implementation enforces this doubled-monotonic relation directly. Full cyclic integration verifies that the loop closes symmetrically at $(-\delta_t^*, -F_t^*)$.

---

### 4. Identified Theoretical Deviations & Discrepancies

#### Discrepancy AUDIT-EQ-01: Underestimated Tangent Stiffness in Layer Confinement Model
In [`contact/normal_contact.py`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/experiments/contact_physics_v2/contact/normal_contact.py) line 73:
```python
Fn = Fn_base * confinement_factor
kn = (2.0 * E_star * a) * confinement_factor
```
- **Mathematical Error:** The product rule dictates:
  $$\frac{d F_n}{d \delta_n} = \frac{d F_{n,\text{base}}}{d \delta_n} C_h + F_{n,\text{base}} \frac{d C_h}{d \delta_n}$$
  Because $C_h(a/h)$ increases with indentation depth ($a = r_{\text{flat}} + \sqrt{R \delta_n}$), $\frac{d C_h}{d \delta_n} > 0$.
- **Measured Impact:** For a $2\text{ mm}$ elastomer layer under $0.5\text{ mm}$ indentation, the reported analytical stiffness is $25,889.2\text{ N/m}$, whereas the true finite-difference stiffness is $31,490.5\text{ N/m}$ (**$17.8\%$ underestimation**).

#### Discrepancy AUDIT-EQ-02: Normal Force Integration in Rounded Punch Model
In [`contact/normal_contact.py`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/experiments/contact_physics_v2/contact/normal_contact.py) lines 53–56:
```python
kn = 2.0 * E_star * a_eff
Fn = kn * delta_n
```
- **Mathematical Error:** When edge rounding $r_c > 0$ is present, $a_{\text{eff}}(\delta_n)$ varies with indentation depth. Therefore, $F_n = \int k_n(x) dx \ne k_n(\delta_n) \cdot \delta_n$.
- **Measured Impact:** Finite-difference evaluation reveals a **$5.32\%$ discrepancy** between reported $k_n$ ($17,904.7\text{ N/m}$) and true incremental stiffness ($18,910.0\text{ N/m}$).

---

### 5. Equation Audit Summary

| Component | Classical Equation | Implementation Status | Discrepancy |
| :--- | :--- | :---: | :---: |
| **Normal Spherical Contact** | Hertz (1882) | Exact | $0.00\%$ |
| **Normal Flat Punch (Sharp)** | Boussinesq (1885) | Exact | $0.00\%$ |
| **Normal Layer Confinement** | Waters-Guduru (2010) | Approximate ($k_n$ derivative omitted) | **$-17.79\%$** |
| **Normal Rounded Punch** | Shtaerman (1949) | Approximate ($F_n$ secular integral) | **$-5.32\%$** |
| **Mindlin Initial Shear Stiffness** | Mindlin (1949) | Exact ($k_{t,0} = 8 G^* a$) | $0.00\%$ |
| **Cattaneo Partial Slip Softening** | Cattaneo (1938) | Exact ($k_t = k_{t,0}(c/a)$) | $0.00\%$ |
| **Stick Core Contraction** | Mindlin (1949) | Exact ($c/a = (1 - F_t/\mu F_n)^{1/3}$) | $0.00\%$ |
| **Traction Integral Balance** | Mindlin (1949) | Exact ($2\pi \int q r dr = F_t$) | $0.00\%$ |
| **M-D Reversal Hysteresis** | Mindlin-Deresiewicz (1953) | Exact ($\Delta F = 2 F_{\text{mono}}(\Delta \delta / 2)$) | $0.00\%$ |

---

### 6. Disposition & Mandatory Corrections

- **Disposition:** **CONDITIONAL PASS**
- **Mandatory Correction 1:** In `NormalContactModel.compute_from_indentation`, update `TruncatedSphericalContact` to include $F_{n,\text{base}} \frac{d C_h}{d \delta_n}$ in tangent stiffness calculation.
- **Mandatory Correction 2:** For `FlatPunchContact` with $r_c > 0$, integrate normal force as $F_n = \int_0^{\delta_n} 2 E^* a_{\text{eff}}(x) dx$ to preserve exact tangent consistency.
