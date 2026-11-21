# HOROS PROBE-1 — Airborne Friction Observability Counterexample

**Document Identifier:** `HOROS-P1-R002-AIRBORNE-FRICTION-OBSERVABILITY-COUNTEREXAMPLE`  
**Date:** 2026-11-20  
**Phase:** Stage 3.3 Research Qualification / Counterexample Audit  
**Author:** HOROS Physical Intelligence Research Group  
**Status:** **DISCOVERY AUDIT & MATHEMATICAL DERIVATION**  

---

### 1. Executive Summary

This investigation reassesses the initial categorical NO-GO regarding friction observability in the HOROS simulation environment. CodeRabbit identified a specific execution branch in `CompliantPreLiftContactEnv.step()` where model-visible observations (`finger_ft` shear force and `finger_pos` vertical coordinate) vary as a direct function of the hidden parameter `step_mu_used` while the recorded slip velocity `actual_slip_vel` remains strictly zero (`0.0 m/s`).

This document provides:
1. The line-by-line code trace identifying the counterexample.
2. The exact mathematical conditions necessary and sufficient for its emergence.
3. A physical vs. numerical artifact analysis.
4. An assessment of whether this signal can support a pre-failure prediction claim.

---

### 2. Code Trace in `CompliantPreLiftContactEnv.step()`

The phenomenon occurs in [`src/environment/compliant_prelift_env.py`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/environment/compliant_prelift_env.py#L487-L514):

```python
# Line 465: Dynamic branch check
if prev_obj_z_m <= 1e-6:
    # Table contact branch (z_obj == 0.0)
    ...
else:
    # Line 487: Object is airborne (prev_obj_z_m > 1e-6)
    max_holdable = float(np.sum(actual_ft_z))
    if max_holdable < weight_n * 0.98 or np.any(actual_slip_vel > 1e-4):
        # Object slips and drops under gravity
        ...
    else:
        # Line 497: Track arm velocity cleanly without slipping
        a_z = (cmd_vel_mps - prev_vel_z_mps) / self.dt
        new_vel_z_mps = cmd_vel_mps
        new_obj_z_m = max(0.0, prev_obj_z_m + new_vel_z_mps * self.dt)
        eq_ft_z = step_mass_used * (self.gravity + a_z) / 4.0
        for i in range(4):
            actual_ft_z[i] = min(step_mu_used * self.fn[i], max(0.0, eq_ft_z))
            self.pad_stretch_m[i] = actual_ft_z[i] / self.k_pad

# Line 506: Finger position update
for i in range(4):
    self.finger_pos[i, 2] = self.obj_pos[2] + 40.0 + self.pad_stretch_m[i] * 1000.0

# Line 513: Observation preparation
self.ft = np.column_stack([ft_theta, actual_ft_z])
self.slip_vel_mps = actual_slip_vel
```

---

### 3. Mathematical Derivation of Observability Conditions

#### 3.1 Pre-Conditions for Entering the Clean Airborne Hold
For the execution flow to reach line 501 without triggering a drop:
1. **Airborne State:** The object must already have lifted off the table:
   $$z_{\text{obj}}(t-1) > 10^{-6}\text{ m}$$
2. **Pre-Step Shear Feasibility:** During candidate shear evaluation (lines 436–455), candidate stretch satisfied Coulomb static friction on every contact:
   $$\forall i \in \{0,1,2,3\}, \quad k_{\text{pad}}(\Delta z_{\text{prev},i} + \Delta z_{\text{arm}}) \le \mu_{\text{true}} F_{n,i} \implies \text{actual\_slip\_vel}[i] = 0.0$$
3. **Weight Support Threshold (0.98 Deadband):**
   $$\sum_{i=0}^3 \text{actual\_ft\_z}[i] \ge 0.98 \cdot W = 0.98 \cdot m_{\text{obj}} g$$

#### 3.2 Friction Dependence in Force Clamping
At line 503, the equilibrium force per finger is:
$$F_{\text{eq},z} = \frac{m_{\text{obj}}(g + a_z)}{4}$$
For steady hold or constant velocity ($a_z = 0$), $F_{\text{eq},z} = \frac{m_{\text{obj}} g}{4}$.

The post-clamp shear force is:
$$F_{t,z,i} = \min\left( \mu_{\text{true}} F_{n,i}, \; F_{\text{eq},z} \right)$$

Two operational regimes emerge:

- **Regime 1: Fully Anchored Equilibrium ($\mu_{\text{true}} F_{n,i} \ge F_{\text{eq},z}$ for all $i$)**
  $$F_{t,z,i} = F_{\text{eq},z} = \frac{m_{\text{obj}} g}{4}$$
  $$\Delta z_{\text{pad},i} = \frac{m_{\text{obj}} g}{4 k_{\text{pad}}}$$
  *Observability:* Force and pad stretch depend strictly on $m_{\text{obj}}$ and $g$. They are **completely independent of $\mu_{\text{true}}$**.

- **Regime 2: Marginal Capacity Hold / Asymmetric Grasp ($\mu_{\text{true}} F_{n,i} < F_{\text{eq},z}$ for some or all $i$)**
  If $\mu_{\text{true}} F_{n,i} < \frac{m_{\text{obj}} g}{4}$ while globally $\sum_{i} \mu_{\text{true}} F_{n,i} \ge 0.98 \cdot m_{\text{obj}} g$:
  $$F_{t,z,i} = \mu_{\text{true}} F_{n,i}$$
  $$\Delta z_{\text{pad},i} = \frac{\mu_{\text{true}} F_{n,i}}{k_{\text{pad}}}$$
  *Observability:* 
  - `finger_ft[i, 1]` outputs $\mu_{\text{true}} F_{n,i}$ (observable in model inputs).
  - `finger_pos[i, 2]` shifts by $\frac{\mu_{\text{true}} F_{n,i}}{k_{\text{pad}}} \times 1000\text{ mm}$ (observable in model inputs).
  - `delta_dot_t[i]` remains $0.0\text{ m/s}$ (no slip is recorded).

---

### 4. Physical Realism vs. Numerical Artifact

| Evaluation Criterion | Physical Reality | Current Simulator Implementation | Scientific Validity |
| :--- | :--- | :--- | :--- |
| **Equation of Motion** | $\Sigma F_z = F_t - m g = m a_z$. If $F_t < m g$, the object must accelerate downwards ($a_z < 0$). | The simulator forces kinematic tracking: $a_z = \dot{v}_{\text{cmd}}$ and $v_z = v_{\text{cmd}}$ despite $F_t < m g$. | **Numerical Artifact.** Momentum is not conserved in the marginal deadband. |
| **Slip Definition** | When tangential shear reaches $\mu F_n$, contact enters kinetic Coulomb slip ($\dot{\delta} > 0$). | Shear force is clamped to $\mu F_n$, but `actual_slip_vel` is left at $0.0$ because candidate shear didn't exceed the boundary in the earlier sub-step. | **Numerical Artifact.** Suppresses physical slip velocity while imposing kinetic saturation. |
| **Asymmetric Load Redistribution** | In a compliant hand, if finger 0 saturates at $\mu F_{n,0}$, the workpiece shifts until fingers 1–3 absorb the surplus. | The simulator evaluates each finger independently against $W/4$. The unheld load is discarded rather than transferred to adjacent fingers. | **Simplification.** Lacks coupled spatial statics. |

---

### 5. Can This Support Pre-Failure Prediction?

1. **Timing Relative to Lift:** The counterexample exists **only when the object is already airborne** ($z_{\text{obj}} > 10^{-6}\text{ m}$). It is completely absent during table-supported pre-lift ($z_{\text{obj}} = 0$).
2. **Timing Relative to Support Degradation:** The observation of $\mu$ occurs **simultaneously with support degradation** (at least one finger has saturated its friction capacity). It is not a precursor; it is a manifestation of partial saturation.
3. **Margin Width:** In symmetric grasps, this phenomenon exists only in the narrow $2\%$ friction window:
   $$0.98 \le \frac{\mu_{\text{true}} F_N}{m_{\text{obj}} g} < 1.00$$
   For a $0.350\text{ kg}$ object ($W = 3.432\text{ N}$), this represents an aggregate force difference of only $0.0686\text{ N}$ across 4 fingers ($0.017\text{ N/finger}$). With sensor noise $\sigma_t = 0.008\text{ N}$, the single-step SNR is $\approx 2.1$.

### 6. Conclusion

CodeRabbit correctly identified that `CompliantPreLiftContactEnv.step()` contains a code path where observations depend on $\mu$ while recorded slip is zero. However, detailed derivation demonstrates that this phenomenon is a **numerical equilibrium clamping artifact in the airborne hold branch**, not a genuine pre-contact physical precursor. 

The previous NO-GO is formally refined to **CONDITIONAL**: while mathematical observability exists under specific parameter configurations, its reliance on unphysical momentum clamping and airborne-only preconditions precludes claiming general pre-slip forecasting under the current contact law.
