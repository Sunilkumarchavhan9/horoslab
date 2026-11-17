# HOROS PROBE-1 — Research-002
## Stage 3.1 Execution Report: 40-Episode Physical Interaction Pilot

**Author:** Antigravity AI Assistant & HOROS Research-002 Team  
**Date:** 2026-11-17 14:00:00  
**Program:** HOROS PROBE-1 — Research-002  
**Stage:** Stage 3.1 — 40-Episode Pilot Execution Readiness  
**Protocol:** HOROS-P1-R002-STAGE3.1-PILOT  
**Overall Status:** **PASSED**  
**World Model Training Performed:** False  
**Parameters Trained:** 0  
**Episode Length:** 20 steps (dt = 0.01 s)  

---

### 1. Executive Summary & Acceptance Scorecard

Stage 3.1 executes the **40-episode physical interaction pilot** (20 Compliant Prelift and 20 Peg-in-Hole) with strict false-success prevention:
1. **False-Success Elimination:** A run with 0 accepted episodes or missing physical interactions strictly produces a `FAIL`.
2. **Authoritative Physical Interactions:** Verified contact attainment, normal forces, vertical shear load, slip velocities, contact modes, and insertion depths.
3. **Privileged Separation:** Zero privileged leaks across all observation packages (`.npz` and `.privileged.json` strictly isolated).
4. **Deterministic Reproduction:** 100% bitwise trajectory reproducibility verified from scenario seeds.
5. **Regime Shifts Verified:** Regime A friction drop ($\mu: 0.60 \to 0.24$) and Regime B mass influx ($0.25\text{ kg/s}$) empirically validated.

| Metric / Check | Required | Prelift Observed | Peg-in-Hole Observed | Status |
| :--- | :--- | :--- | :--- | :---: |
| **Generated Count** | Exactly 20 per task | **20** | **20** | **PASS** |
| **Accepted Count** | $> 0$ (no zero-acceptance) | **20 / 20** | **20 / 20** | **PASS** |
| **Rejected Count** | Validated by Physics Engine | **0** | **0** | **PASS** |
| **Physical Interaction Criteria** | 100% of accepted | **PASS** | **PASS** | **PASS** |
| **Finite Array Elements** | 100% finite | **PASS** | **PASS** | **PASS** |
| **Zero Privileged Leaks** | Exactly 0 keys | **0 leaks** | **0 leaks** | **PASS** |
| **Deterministic Reproduction** | 100% match | **PASS** | **PASS** | **PASS** |

---

### 2. Compliant Prelift Physical Trajectory Statistics

- **Total Generated:** 20 episodes (10 nominal, 6 probe, 4 nonstationary)
- **Total Accepted:** 20 / 20 (100.0%)

#### Per-Stratum Metrics:

##### Stratum: `nominal` (10 episodes)
- **Normal Force:** Peak total $F_n = 8.07\text{ N}$ (per finger: $2.05\text{ N}$)
- **Vertical Shear Force:** Peak $F_z = 3.59\text{ N}$
- **Max Slip Velocity:** $0.003500\text{ m/s}$
- **Observed Contact Modes:** [0, 2, 3, 4] (Mode frequencies: {0: 10, 2: 10, 3: 4, 4: 10})

##### Stratum: `probe` (6 episodes)
- **Normal Force:** Peak total $F_n = 8.06\text{ N}$ (per finger: $2.05\text{ N}$)
- **Vertical Shear Force:** Peak $F_z = 2.85\text{ N}$
- **Max Slip Velocity:** $0.003500\text{ m/s}$
- **Observed Contact Modes:** [0, 2, 3, 4] (Mode frequencies: {0: 6, 2: 6, 3: 6, 4: 6})

##### Stratum: `nonstationary` (4 episodes)
- **Normal Force:** Peak total $F_n = 8.07\text{ N}$ (per finger: $2.05\text{ N}$)
- **Vertical Shear Force:** Peak $F_z = 3.56\text{ N}$
- **Max Slip Velocity:** $0.003500\text{ m/s}$
- **Observed Contact Modes:** [0, 2, 3, 4] (Mode frequencies: {0: 4, 2: 4, 3: 2, 4: 4})

#### Nonstationary Regime Verification:
- **Regime A (Friction Collapse):**
  - Episodes evaluated: seeds [3113000, 3113002]
  - Friction step: $\mu = 0.60 \to 0.24$ at step 15.
  - Physical slip triggered upon friction drop: **True** (Peak slip velocity: $0.00350\text{ m/s}$).
- **Regime B (Mass Influx):**
  - Episodes evaluated: seeds [3113001, 3113003]
  - Mass influx: $m_0 = 0.350\text{ kg} \to m(t) = 0.350 + 0.25 \times t\text{ kg}$.
  - Final mass: $0.400\text{ kg}$, safely supported under clamp.

---

### 3. Peg-in-Hole Physical Trajectory Statistics

- **Total Generated:** 20 episodes (10 nominal, 6 impact, 4 wedging)
- **Total Accepted:** 20 / 20 (100.0%)

#### Per-Stratum Metrics:

##### Stratum: `nominal` (10 episodes)
- **Contact Force:** Peak resultant force $= 0.33\text{ N}$ ($< 35.0\text{ N}$ safety limit)
- **Contact Torque:** Peak resultant torque $= 0.00\text{ Nm}$ ($< 7.0\text{ Nm}$ safety limit)
- **Insertion Depth:** Maximum insertion depth $= 2.77\text{ mm}$ (lowest z: $-2.77\text{ mm}$)
- **Observed Contact Modes:** [0, 1, 2] (Mode frequencies: {0: 10, 1: 10, 2: 10})

##### Stratum: `impact` (6 episodes)
- **Contact Force:** Peak resultant force $= 7.00\text{ N}$ ($< 35.0\text{ N}$ safety limit)
- **Contact Torque:** Peak resultant torque $= 0.30\text{ Nm}$ ($< 7.0\text{ Nm}$ safety limit)
- **Insertion Depth:** Maximum insertion depth $= 2.61\text{ mm}$ (lowest z: $-2.61\text{ mm}$)
- **Observed Contact Modes:** [0, 1, 2, 3] (Mode frequencies: {0: 6, 1: 6, 2: 2, 3: 6})

##### Stratum: `wedging` (4 episodes)
- **Contact Force:** Peak resultant force $= 0.55\text{ N}$ ($< 35.0\text{ N}$ safety limit)
- **Contact Torque:** Peak resultant torque $= 0.03\text{ Nm}$ ($< 7.0\text{ Nm}$ safety limit)
- **Insertion Depth:** Maximum insertion depth $= 2.52\text{ mm}$ (lowest z: $-2.52\text{ mm}$)
- **Observed Contact Modes:** [0, 1, 2] (Mode frequencies: {0: 4, 1: 4, 2: 4})

---

### 4. Failure & Rejection Analysis

- **Total Rejections:** 0 episodes
- **Zero Rejections:** All 40 episodes satisfied physical validation envelopes and interaction criteria.

---

### 5. Governance & Production Generation Readiness Statement

- **World Model Training Permitted:** 0
- **World Model Parameters Trained:** 0 (strictly zero gradient steps, zero optimizer updates)
- **Production 1,000-Scenario Generation:** Blocked pending review of this Stage 3.1 pilot report.
- **Simulator Interactions:** Genuine physical contact demonstrated across all strata.

