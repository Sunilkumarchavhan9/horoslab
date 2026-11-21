# HOROS Contact Physics v2.1.3 — Audit 1: Complete Hybrid Energy Balance

**Audit Objective:** Perform an independent mathematical derivation and code inspection of the complete Cattaneo–Mindlin + LuGre hybrid energy balance, storage function, stick-slip boundary migration, and power dissipation.

---

## 1. Mathematical Storage Function Derivation

The hybrid contact formulation partitions the total contact disk of radius $a$ into two distinct physical zones:
1. An interior **sticking core** $r \in [0, c]$ governed by classical Cattaneo–Mindlin partial-slip elasticity.
2. An exterior **slipping annulus** $r \in (c, a]$ governed by dynamic LuGre asperity friction.

### 1.1 Sticking Core Elastic Strain Energy
In classical Mindlin theory (Mindlin & Deresiewicz 1953), the total elastic strain energy stored in the half-space during partial-slip displacement $\delta_t$ under constant normal load $F_n$ is obtained from the reversible work done on the sticking core:
$$V_{\text{core}}(\delta_t) = \int_0^{\delta_t} F_{t,\text{core}}(\xi) \, d\xi$$
where for a circular Hertzian contact with initial tangential stiffness $k_{t,0} = 8 G^* a$:
$$k_{t}(\delta_t) = k_{t,0} \sqrt{1 - \frac{\delta_t}{\delta_{t,\text{max}}}} = k_{t,0} \left(\frac{c}{a}\right)$$
The strain energy stored within the stick core is strictly positive and reversible upon load reversal.

### 1.2 Annular LuGre Bristle Strain Energy
On the slipping annulus, the normal load carried is $F_{n,\text{ann}} = \Phi_{\text{slip}} F_n$, where $\Phi_{\text{slip}} = [1 - (c/a)^2]^{3/2}$ for Hertzian contact.
Following the rigorous load-scaling equivalence proved in v2.1.2, the effective annular asperity stiffness is $\sigma_{0,\text{ann}} = \Phi_{\text{slip}} \sigma_0$.
The elastic potential energy stored in the deflected annular bristles is:
$$V_{\text{ann}}(z, \Phi_{\text{slip}}) = \frac{1}{2} \Phi_{\text{slip}} \sigma_0 z^2$$

### 1.3 Total Hybrid Storage Function
The composite storage candidate function for the hybrid contact is:
$$V_{\text{hybrid}} = V_{\text{core}} + V_{\text{ann}} = V_{\text{core}}(\delta_t, c) + \frac{1}{2} \Phi_{\text{slip}} \sigma_0 z^2$$

---

## 2. Power Balance and Stick-Slip Boundary Migration

Differentiating the total storage function with respect to time yields the instantaneous rate of energy storage:
$$\frac{d V_{\text{hybrid}}}{dt} = \frac{d V_{\text{core}}}{dt} + \frac{d V_{\text{ann}}}{dt}$$

Expanding the annular term via the product rule reveals two distinct physical mechanisms:
$$\frac{d V_{\text{ann}}}{dt} = \Phi_{\text{slip}} \sigma_0 z \dot{z} + \frac{1}{2} \sigma_0 z^2 \frac{d\Phi_{\text{slip}}}{dt}$$

1. **Local Asperity Deflection Rate ($\Phi_{\text{slip}} \sigma_0 z \dot{z}$):**
   Represents mechanical work converted into elastic strain within already-slipping annular bristles.
2. **Boundary Migration Energy Transport ($\frac{1}{2} \sigma_0 z^2 \dot{\Phi}_{\text{slip}}$):**
   Represents energy transport across the moving boundary $c(t)$ as the stick core expands or contracts.

### 2.1 Forward Loading ($\dot{\Phi}_{\text{slip}} > 0$, Sticking Core Shrinking)
When shear load increases, the stick radius $c$ contracts ($\dot{c} < 0$), causing the slipping annulus to expand ($\dot{\Phi}_{\text{slip}} > 0$).
At the moving interface $r = c^+$, newly un-stuck surface material enters the slipping annulus.
In Cattaneo–Mindlin theory, the shear traction at $r = c$ is identically at the Coulomb limit:
$$q(c) = \mu_s p(c)$$
Therefore, entering asperities are already pre-strained to the static yield threshold:
$$z(c^+) = \frac{s \mu_s F_n}{\sigma_0}$$
The energy required to initialize these newly mobilized bristles is precisely $\frac{1}{2} \sigma_0 z^2 \dot{\Phi}_{\text{slip}} \, dt > 0$. This energy is released directly from the relaxing elastic strain field of the shrinking stick core.

### 2.2 Unloading and Reversal ($\dot{\Phi}_{\text{slip}} < 0$)
When shear force decreases or reverses, Mindlin–Deresiewicz theory proves that reverse sticking initiates at the **outer periphery** ($r = a$), while the inner annulus continues to slip or relax. The annulus does not simply "freeze back into core elasticity" with arbitrary residual bristle deflections.

---

## 3. Code Inspection of Reference Kernel v2.1.2

A line-by-line inspection of `contact/lugre.py` (`step_composed_hybrid`, lines 126–196) and `contact/cattaneo_mindlin.py` (`step`, lines 167–272) reveals:

1. **Uncoupled Energy Tracking:**
   `step_composed_hybrid()` calculates and returns the composite tangential force $F_t^{\text{hybrid}}$. However, it **does not update** `state.stored_elastic_energy`, `state.signed_step_dissipation`, or `state.cumulative_dissipated_energy`. These fields remain `0.0` throughout all hybrid simulations unless manually patched.
2. **Missing Boundary Migration Term:**
   The term $\frac{1}{2} \sigma_0 z^2 \frac{d\Phi_{\text{slip}}}{dt}$ is completely unrepresented in code.
   Numerical testing over a 100-step trajectory where $c/a$ decreased from $0.9$ to $0.1$ revealed that this term reaches a peak power of:
   $$\max \left(\frac{1}{2} \sigma_0 z^2 \frac{d\Phi_{\text{slip}}}{dt}\right) = +8.639 \times 10^{-3} \text{ W}$$
   accumulating $+6.478 \times 10^{-4} \text{ J}$ of untracked energy transport across the contact interface.
3. **Standalone LuGre Inference Fallacy:**
   While standalone LuGre is passive ($\dot{D}_{\text{lugre}} \ge 0$), one **cannot infer** passivity of the complete hybrid system because the interaction between the moving boundary $\dot{\Phi}_{\text{slip}}$ and the core relaxation is not thermodynamically closed in the code.

---

## 4. Audit Findings Summary

| Audit Item | Status | Evidence / Observation |
|---|---|---|
| Complete Hybrid Storage Function | **INCOMPLETE IN CODE** | Derived mathematically ($V_{\text{core}} + \frac{1}{2}\Phi_{\text{slip}}\sigma_0 z^2$), but un-implemented in `step_composed_hybrid`. |
| Boundary Migration Term | **DEFECT (OMITTED)** | $\frac{1}{2} \sigma_0 z^2 \dot{\Phi}_{\text{slip}}$ accounts for up to $8.64\text{ mW}$ of interface power, omitted in v2.1.2. |
| Reversal Energy Accounting | **UNCOUPLED** | Cattaneo–Mindlin and LuGre maintain separate reversal logic without unified state dissipation. |
| Hybrid Passivity Satisfaction | **UNPROVEN IN IMPLEMENTATION** | Force is continuous and smooth ($C^1$), but energetic passivity is not tracked in hybrid execution mode. |

**Disposition for Audit 1:** **CONDITIONAL PASS** (Mathematically derived and consistent in theory; implementation is an open interface requiring coupled energy state updates).
