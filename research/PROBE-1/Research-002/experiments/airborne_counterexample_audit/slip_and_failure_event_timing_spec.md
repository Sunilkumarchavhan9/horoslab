# HOROS PROBE-1 — Slip & Failure Event Timing Specification

**Document Identifier:** `HOROS-P1-R002-SLIP-FAILURE-TIMING-SPEC`  
**Date:** 2026-11-20  
**Phase:** Stage 3.3 Research Qualification / Counterexample Audit  
**Author:** HOROS Physical Intelligence Research Group  
**Status:** **AUTHORITATIVE TIMING & EVENT SPECIFICATION**  

---

### 1. Correction of Free-Space False Slip Anomaly

#### Defect Identification
In [`CompliantPreLiftContactEnv.step()`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/environment/compliant_prelift_env.py#L445-L450):
```python
for i in range(4):
    if self.fn[i] < 0.10:
        self.pad_stretch_m[i] = 0.0
        actual_ft_z[i] = 0.0
        actual_slip_vel[i] = cmd_vel_mps  # <--- DEFECT: sets slip to commanded velocity in free space!
        continue
```
When the arm moves vertically before the fingertips close on the object, `actual_slip_vel` registers the commanded arm velocity (e.g. $5.0\text{ mm/s} = 0.005\text{ m/s}$), which exceeds the classifier slip threshold ($0.0001\text{ m/s}$). Naive timestamp audits mistakenly identify this pre-grasp free motion as an early Coulomb slip event.

#### Corrected Authoritative Slip Definition
A physical Coulomb slip event occurs at timestep $t$ if and only if **both** contact normal force and slip velocity thresholds are simultaneously satisfied on at least one finger:

$$\mathcal{E}_{\text{slip}}(t) \iff \exists i \in \{0,1,2,3\} \quad \text{s.t.} \quad \left( F_{n,i}[t] \ge 0.10\text{ N} \right) \;\land\; \left( \|\dot{\delta}_i[t]\| \ge 0.0005\text{ m/s} \right)$$

The true first Coulomb slip sample is:
$$t_{\text{slip}} = \min \left\{ t \in \{0, \dots, T\} : \mathcal{E}_{\text{slip}}(t) \text{ is TRUE} \right\}$$

---

### 2. Event Sequence & Milestone Timestamps

For every evaluated trajectory, six distinct timestamps must be logged:

```
t=0                      t_contact            t_dec                t_slip             t_drop
 ├───────────────────────────┼──────────────────┼────────────────────┼───────────────────┤
 │     Free Approach         │   Active Probe   │   Forecast Emitted │   Support Failed  │
 │ (Fn < 0.10 N)             │ (Fn >= 0.10 N)   │ (Strict Pre-Slip)  │ (Slip Triggered)  │
```

1. **$t_{\text{contact}}$ (Contact Touchdown):**
   First step where all four fingers achieve solid contact:
   $$t_{\text{contact}} = \min \{ t : \min_{i} F_{n,i}[t] \ge 0.10\text{ N} \}$$
2. **$t_{\text{probe}}$ (Probing Window):**
   Active perturbation window $[t_{\text{probe,start}}, t_{\text{probe,end}}]$. Must satisfy safety bounds.
3. **$t_{\text{dec}}$ (Decision / Forecast Timestamp):**
   The timestamp where the world model emits its failure prediction $P(\text{failure})$ or abstention signal.
   **Strict Invariant:** $t_{\text{dec}} < t_{\text{slip}}$.
4. **$t_{\text{slip}}$ (Coulomb Slip Onset):**
   First occurrence of genuine Coulomb slip under the corrected definition above.
5. **$t_{\text{degrade}}$ (Support Degradation Onset):**
   First step where total shear capacity falls below holding requirement ($\sum_i F_{t,i} < 0.98 m_{\text{obj}} g$).
6. **$t_{\text{drop}}$ (Terminal Catastrophic Failure):**
   First step where $z_{\text{obj}} \le 10^{-6}\text{ m}$ after liftoff, triggering `dropped = True`.

---

### 3. Lead Time Formulation: Forecasting vs. Reactive Detection

The scientific validity of any predictive claim is determined by the signed lead time:

$$\tau_{\text{lead}} = t_{\text{slip}} - t_{\text{dec}}$$

| Lead Time Regime | Classification | Scientific Validity |
| :---: | :--- | :--- |
| $\tau_{\text{lead}} > 0$ ($t_{\text{dec}} < t_{\text{slip}}$) | **Genuine Pre-Slip Forecast** | **VALID RESEARCH CLAIM.** Model forecasted failure before any sensor observed slip. |
| $\tau_{\text{lead}} = 0$ ($t_{\text{dec}} = t_{\text{slip}}$) | **Reactive Slip Detection** | **REACTIVE.** Identifies slip at the instant of occurrence. (e.g. Phase 3.7.3 `SLIP_COLLAPSE`). |
| $\tau_{\text{lead}} < 0$ ($t_{\text{dec}} > t_{\text{slip}}$) | **Post-Failure Latch** | **RETROACTIVE.** Classifies a failure that has already transpired. |

---

### 4. Safety Constraints Enforced on Every Trial

Every trial must enforce physical containment within approved safety boundaries:
1. **Total Normal Force:**
   $$\sum_{i=0}^3 F_{n,i}[t] \le 20.0\text{ N} \quad \forall t$$
2. **Single Finger Normal Force:**
   $$F_{n,i}[t] \le 20.0\text{ N} \quad \forall i, t$$
3. **Total Shear Force:**
   $$\sum_{i=0}^3 F_{t,z,i}[t] \le 15.0\text{ N} \quad \forall t$$
4. **Action Command Limits:**
   $$\Delta x_{\text{squeeze}} \in [-2.0, 2.0]\text{ mm}, \quad \Delta z_{\text{arm}} \in [-2.0, 5.0]\text{ mm}$$

Any episode violating these thresholds is marked **UNSAFE_VIOLATION** and disqualified from successful evaluation.
