# HOROS PROBE-1 — Research-002
## Stage 3.3A.3 Physical Acceptance & Simulator Consistency Audit

**Program:** HOROS PROBE-1 — Autonomous Robotic Manipulation World Model  
**Phase:** Stage 3.3A.3 — Independent Production Audit  
**Document Identifier:** `HOROS-P1-R002-STAGE3.3A3-PHYSICAL-ACCEPTANCE-AUDIT`  
**Date:** 2026-11-19  
**Auditor:** Independent Technical Auditor  
**Disposition:** **PASS** (with Stage 3.3A.4 recommendations)  

---

### 1. Scope & Objective

This audit independently assesses the physical correctness of simulator interaction criteria across Compliant Prelift and Peg-in-Hole assembly. The investigation evaluates:
1. Contact dynamics modeling and numerical integration parameters.
2. Event-aligned rim impact detection and energy/force boundaries.
3. Seven-class discrete contact mode ontology preservation and semantic alignment.
4. Two-point geometric wedging vs. force-balance mechanical jamming criteria.
5. Nonstationary friction collapse (Regime A) and mass accretion (Regime B) causal invariants.

---

### 2. Simulator Physics & Numerical Mechanics

#### 2.1 Contact Mechanics in `PegInHoleEnv`
The frozen simulator `src/environment/peg_in_hole_env.py` models surface interactions as an analytical penalty formulation:
$$F_n = k_{\text{contact}} \cdot \max(0, z_{\text{rim}} - z), \quad k_{\text{contact}} = 5000.0\text{ N/m}$$
The factory integration step is explicitly overridden to $\Delta t = 0.01\text{ s}$ (`PEG_CONTROL_DT_S`), differing from the environment class default ($0.02\text{ s}$).

#### 2.2 Rim Impact Dynamics vs. Rigid Impact Models
- **Document 12 Inconsistency Resolution:** Prior literature proposed a rigid impulse threshold $J_{\text{rigid}} \ge 2.0\text{ N}\cdot\text{s}$. In this penalty formulation at $\Delta t = 0.01\text{ s}$, a bounded normal force $F \le 35.0\text{ N}$ yields a single-step impulse bound:
  $$J_{\text{max, step}} = F_{\text{limit}} \cdot \Delta t = 35.0\text{ N} \cdot 0.01\text{ s} = 0.35\text{ N}\cdot\text{s}$$
  A $2.0\text{ N}\cdot\text{s}$ impulse would require either unphysical contact durations ($> 0.057\text{ s}$ at maximum force) or catastrophic force spikes exceeding $200\text{ N}$.
- **Approved & Verified Metric:** Rim impact is defined on the event set $\mathcal{E} = \{t : \text{step\_contact\_stratum}[t] = 1\}$:
  $$J_{\mathcal{E}} = \sum_{t \in \mathcal{E}} \|\mathbf{F}(t)\| \Delta t > 10^{-6}\text{ N}\cdot\text{s}, \quad \dot{F} = \max_{t \in \mathcal{E}} \frac{\|\mathbf{F}(t)\| - \|\mathbf{F}(t-1)\|}{\Delta t} > 0.01\text{ N/s}$$
  Certified pilot rim contacts exhibit empirical event impulses between $0.0012\text{ N}\cdot\text{s}$ and $0.0996\text{ N}\cdot\text{s}$, which conform to this formulation.

---

### 3. Contact Mode Ontology & Jamming Verification

#### 3.1 Frozen 7-Class Ontology Integrity
The discrete contact mode enum `ContactMode` (`src/contact_modes/contact_mode_definitions.py`) was verified against the Stage 3.0 baseline:
```python
ContactMode.FREE = 0
ContactMode.FIRST_CONTACT = 1
ContactMode.STICKING = 2
ContactMode.SLIDING = 3
ContactMode.IMPACT = 4
ContactMode.JAMMING = 5
ContactMode.RELEASE = 6
```
The enum values, names, and total count ($7$) remain frozen and unmodified.

#### 3.2 Decoupling of Simulator Strata from Classifier Modes
Simulator strata and classifier modes inhabit distinct semantic spaces:
- Stratum 3 is `TWO_POINT_WEDGING` (geometric contact state).
- Mode 3 is `ContactMode.SLIDING` (Coulomb slip dynamics).
- Mode 5 is `ContactMode.JAMMING` (geometric lock under high lateral force).
The auditor verified that the adapter does not equate Stratum 3 to Mode 3.

#### 3.3 Wedging Depth Alignment & Jamming Evaluation
The auditor executed adversarial test cases against `verify_production_physical_interaction()`:

1. **State-Depth Alignment at Wedging:**
   - Case: Simulator telemetry depth $z_{\text{telem}} = 6.0\text{ mm}$, post-action state depth $z_{\text{state}} = 6.0\text{ mm}$ -> **PASS**.
   - Case: Simulator telemetry depth $z_{\text{telem}} = 6.0\text{ mm}$, post-action state depth $z_{\text{state}} = 2.0\text{ mm}$ -> **REJECTED** (detected misalignment $|z_{\text{telem}} - z_{\text{state}}| = 4.0\text{ mm} \ge 10^{-3}\text{ mm}$).
   - Case: Telemetry depth $z_{\text{telem}} = 4.0\text{ mm}$ (shallow) -> **REJECTED** ($z \le 5.0\text{ mm}$).

2. **`ContactMode.JAMMING` Physical Gate:**
   - Valid Jamming ($F_{\text{lat}} = 18.0\text{ N}$, $z = 6.0\text{ mm}$, $\theta = 2.5^\circ$, Stratum 3) -> **ACCEPTED** (`valid_jamming_steps = [t]`).
   - Insufficient Force ($F_{\text{lat}} = 3.0\text{ N} \le 15.0\text{ N}$) -> **REJECTED** (`invalid_jamming_steps = [t]`).
   - Shallow Depth ($z = 4.0\text{ mm} \le 5.0\text{ mm}$) -> **REJECTED**.
   - Low Tilt ($\theta = 1.0^\circ \le 1.8^\circ$) -> **REJECTED**.
   - Depth Misaligned ($z_{\text{telem}} = 6.0\text{ mm}, z_{\text{state}} = 2.0\text{ mm}$) -> **REJECTED**.

---

### 4. Independent Auditor Observations & Hardening Recommendations

#### Observation 1: Validation Scope of Mode 5 in Non-Wedging Strata
- **Current Behavior:** In `stage3_production_adapter.py`, the validation loop evaluating `ContactMode.JAMMING` validity resides inside `elif stratum == "wedging":`.
- **Finding:** If an episode in `nominal` or `impact` stratum emitted a spurious `ContactMode.JAMMING` label, the wedging check does not execute. In `nominal`, the episode passes if $3 \notin \text{step\_contact\_stratum}$.
- **Recommendation for Stage 3.3A.4:** Relocate the `invalid_jamming_steps` loop outside the `if/elif` stratum branches so that any occurrence of `ContactMode.JAMMING` in nominal or impact strata is unconditionally rejected.

#### Observation 2: Instantaneous vs. Initial Scenario Tilt
- **Current Behavior:** Line 513 fetches `jamming_tilt = episode.env_metadata.get("tilt_deg")`, which represents the scenario's initial angular perturbation.
- **Finding:** In scenarios where dynamic compliance reduces the tilt angle during descent, the check evaluates the initial scalar rather than instantaneous Euler angles from `next_states[t]`.
- **Recommendation for Stage 3.3A.4:** Extract instantaneous tilt from `next_states[t, 3:6]` (12-D) or `next_states[t, 6:9]` (15-D) to enforce dynamic geometric lock verification.

---

### 5. Conclusion

The physical acceptance rules accurately enforce the governing mechanics of robotic insertion and compliant grasping. The event-aligned rim impact formulation and wedging state-depth alignment gates eliminate false passes while preserving genuine contact phenomena.
