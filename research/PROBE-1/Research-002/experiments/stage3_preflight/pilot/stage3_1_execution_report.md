# HOROS PROBE-1 — Research-002
## Stage 3.2.1 Execution Report: Final Evidence and Acceptance Corrections

> Stage 3.2.2 correction: the four-class contact-mode legend below is not the training ontology. The authoritative `ContactMode` IDs are 0 FREE, 1 FIRST_CONTACT, 2 STICKING, 3 SLIDING, 4 IMPACT, 5 JAMMING, and 6 RELEASE. Simulator contact stratum 3 remains WEDGING and is a different label system. See `stage3_2_execution_report.md`. Numeric labels were not remapped.

**Author:** Antigravity AI Assistant & HOROS Research-002 Team  
**Date:** 2026-11-17 15:30:00  
**Program:** HOROS PROBE-1 — Research-002  
**Stage:** Stage 3.2.1 — Final Evidence and Acceptance Corrections  
**Protocol:** HOROS-P1-R002-STAGE3.2.1-FINAL-EVIDENCE  
**Overall Status:** **PASSED**  
**World Model Training Permitted:** 0  
**World Model Training Performed:** False  
**Parameters Trained:** 0  
**Prelift Episode Length:** 20 steps (dt = 0.01 s)  
**Peg-in-Hole Episode Length:** 30 steps (dt = 0.01 s)  

---

### 1. Executive Summary & Remediation Scorecard

Stage 3.2.1 delivers the **final evidence and acceptance corrections** for the 40-episode physical interaction pilot (20 Compliant Prelift and 20 Peg-in-Hole), resolving all remaining scientific verification gaps before production dataset construction:

1. **Prelift Event-Specific Acceptance Standardized:**
   - Evaluates post-action state arrays (`next_states[:, :]`) and post-action wrench arrays (`next_wrenches[:, :]`).
   - Replaced generic displacement with distinct, measurable physical criteria per stratum:
     - **Nominal:** Positive object lift above documented numerical tolerance ($z_{\text{obj}} > 0.001\text{ mm}$, observed range $[0.0022, 0.3540]\text{ mm}$).
     - **Probe:** Expected Coulomb slip velocity ($\max \|\dot{\delta}_t\| \ge 0.0005\text{ m/s}$, observed $0.0050\text{ m/s}$) with object securely held on table ($z_{\text{obj}} = 0.0\text{ mm}$).
     - **Nonstationary Regime A:** Measured friction collapse at step 15 ($0.60 \to 0.24$) triggering slip ($\max \|\dot{\delta}_t\| > 0.0010\text{ m/s}$, observed $0.0050\text{ m/s}$).
     - **Nonstationary Regime B:** Continuous mass influx ($0.25\text{ kg/s}$ reaching $0.400\text{ kg}$) with safe clamping hold ($F_n \ge 0.50\text{ N}$, $F_z \ge 0.50\text{ N}$).
   - Strict adherence to physical safety envelopes across all 20 episodes ($F_n \le 20.0\text{ N}$, $F_z \le 15.0\text{ N}$).

2. **Peg-in-Hole Post-Action State/Telemetry Alignment:**
   - Evaluates post-action state arrays (`next_states[:, :3]`) and matching post-action privileged telemetry (`step_insertion_depth_mm`, `step_contact_stratum`).
   - For 100% of wedging episodes (4/4), confirmed that the **exact same timestep $t$** satisfies:
     - `step_contact_stratum[t] == 3` (simulator contact stratum 3: wedging)
     - `step_insertion_depth_mm[t] > 5.0 mm` (simulator empirical depth)
     - `next_states[t]` insertion depth ($\max(0.0, -z) > 5.0\text{ mm}$)
     - Physical consistency between state depth and telemetry depth: $|z_{\text{telem}} - z_{\text{state}}| < 10^{-3}\text{ mm}$ (observed $< 10^{-4}\text{ mm}$).
   - Compliant force bounds ($\le 35.0\text{ N}$) and torque bounds ($\le 7.0\text{ Nm}$) strictly maintained.

3. **Precise Terminology Distinction:**
   - **Contact Mode:** Superseded by Stage 3.2.2. Authoritative `ContactMode` IDs are 0 FREE, 1 FIRST_CONTACT, 2 STICKING, 3 SLIDING, 4 IMPACT, 5 JAMMING, 6 RELEASE. The previous line that called ID 3 Sticking was incorrect.
   - **Simulator Contact Stratum:** Authoritative ground-truth simulator physics stratum ($0$: Free, $1$: Impact, $2$: Sliding, $3$: Wedging, $4$: Seated).

| Metric / Check | Required | Prelift Observed | Peg-in-Hole Observed | Status |
| :--- | :--- | :--- | :--- | :---: |
| **Generated Count** | Exactly 20 per task | **20** | **20** | **PASS** |
| **Accepted Count** | 20 / 20 (both physics & interaction) | **20 / 20** | **20 / 20** | **PASS** |
| **Rejected Count** | Rejection tracking active | **0** | **0** | **PASS** |
| **Physical Interaction Criteria** | 100% of accepted | **PASS** | **PASS** | **PASS** |
| **Genuine Wedging (Stratum 3)** | 4/4 wedging episodes | N/A | **PASS** | **PASS** |
| **Wedging State/Telemetry Alignment** | Identical timestep $t$ ($|z_t - d_t| < 10^{-3}\text{ mm}$) | N/A | **PASS** | **PASS** |
| **Empirical Telemetry Verified** | Measured from sim | **PASS** | **PASS** | **PASS** |
| **Finite Array Elements** | 100% finite | **PASS** | **PASS** | **PASS** |
| **Zero Privileged Leaks** | Exactly 0 keys | **0 leaks** | **0 leaks** | **PASS** |
| **Deterministic Reproduction** | 100% match | **PASS** | **PASS** | **PASS** |

---

### 2. Compliant Prelift Physical Trajectory Statistics

- **Total Generated:** 20 episodes (10 nominal, 6 probe, 4 nonstationary)
- **Total Accepted:** 20 / 20 (100.0%)
- **Episode Length:** 20 steps

#### Per-Stratum Metrics:

##### Stratum: `nominal` (10 episodes)
- **Normal Force:** Peak total $F_n = 11.27\text{ N}$ (per finger: $2.85\text{ N}$)
- **Vertical Shear Force:** Peak $F_z = 5.40\text{ N}$
- **Max Slip Velocity ($\max |\dot{\delta}_t|$):** $0.005000\text{ m/s}$
- **Vertical Displacement:** Max lift $= 0.3540\text{ mm}$, Final lift $= 0.1584\text{ mm}$
- **Observed Contact Modes:** [0, 2, 3, 4]
- **Timestep Mode Histogram:** {0: 10, 4: 10, 2: 179, 3: 1}
- **Episode Mode Presence:** {0: 10, 2: 10, 4: 10, 3: 1}

##### Stratum: `probe` (6 episodes)
- **Normal Force:** Peak total $F_n = 11.26\text{ N}$ (per finger: $2.85\text{ N}$)
- **Vertical Shear Force:** Peak $F_z = 3.99\text{ N}$
- **Max Slip Velocity ($\max |\dot{\delta}_t|$):** $0.005000\text{ m/s}$
- **Vertical Displacement:** Max lift $= 0.0000\text{ mm}$, Final lift $= 0.0000\text{ mm}$
- **Observed Contact Modes:** [0, 2, 3, 4]
- **Timestep Mode Histogram:** {0: 6, 4: 6, 2: 67, 3: 41}
- **Episode Mode Presence:** {0: 6, 2: 6, 3: 6, 4: 6}

##### Stratum: `nonstationary` (4 episodes)
- **Normal Force:** Peak total $F_n = 11.27\text{ N}$ (per finger: $2.85\text{ N}$)
- **Vertical Shear Force:** Peak $F_z = 4.04\text{ N}$
- **Max Slip Velocity ($\max |\dot{\delta}_t|$):** $0.005000\text{ m/s}$
- **Vertical Displacement:** Max lift $= 0.2540\text{ mm}$, Final lift $= 0.1270\text{ mm}$
- **Observed Contact Modes:** [0, 2, 3, 4]
- **Timestep Mode Histogram:** {0: 4, 4: 4, 2: 60, 3: 12}
- **Episode Mode Presence:** {0: 4, 2: 4, 3: 2, 4: 4}

#### Empirical Nonstationary Regime Verification:
- **Regime A (Friction Drop Transition):**
  - Episodes evaluated: seeds [3113000, 3113002]
  - Measured simulator friction: confirmed transition from $\mu = 0.60$ (steps 0–14) to $\mu = 0.24$ (steps 15–19) directly from `step_mu_true` telemetry.
  - Empirical transition verified: **True**.
  - Physical slip triggered upon friction drop: **True** (Peak slip velocity: $0.00500\text{ m/s}$).
- **Regime B (Continuous Mass Influx):**
  - Episodes evaluated: seeds [3113001, 3113003]
  - Measured simulator mass: confirmed continuous influx rate of $0.25\text{ kg/s}$ ($0.0025\text{ kg/step}$) directly from `step_object_mass_kg` telemetry.
  - Initial mass: $0.350\text{ kg} \to$ Final mass: $0.400\text{ kg}$ at step 20.
  - Empirical mass influx rate verified: **True**.

---

### 3. Peg-in-Hole Physical Trajectory Statistics

- **Total Generated:** 20 episodes (10 nominal, 6 impact, 4 wedging)
- **Total Accepted:** 20 / 20 (100.0%)
- **Episode Length:** 30 steps

#### Per-Stratum Metrics:

##### Stratum: `nominal` (10 episodes)
- **Contact Force:** Peak resultant force $= 0.39\text{ N}$ ($< 35.0\text{ N}$ safety limit)
- **Contact Torque:** Peak resultant torque $= 0.02\text{ Nm}$ ($< 7.0\text{ Nm}$ safety limit)
- **Insertion Depth:** Maximum insertion depth $= 14.17\text{ mm}$ (lowest z: $-14.17\text{ mm}$)
- **Simulator Contact Strata Observed:** [0, 2] (Wedging stratum 3 attained: False)
- **Observed Contact Modes:** [0, 1, 2]
- **Timestep Mode Histogram:** {0: 155, 1: 10, 2: 135}
- **Episode Mode Presence:** {0: 10, 1: 10, 2: 10}

##### Stratum: `impact` (6 episodes)
- **Contact Force:** Peak resultant force $= 9.96\text{ N}$ ($< 35.0\text{ N}$ safety limit)
- **Contact Torque:** Peak resultant torque $= 0.40\text{ Nm}$ ($< 7.0\text{ Nm}$ safety limit)
- **Insertion Depth:** Maximum insertion depth $= 14.01\text{ mm}$ (lowest z: $-14.01\text{ mm}$)
- **Simulator Contact Strata Observed:** [0, 1, 2] (Wedging stratum 3 attained: False)
- **Observed Contact Modes:** [0, 1, 2, 3]
- **Timestep Mode Histogram:** {0: 100, 3: 25, 1: 6, 2: 49}
- **Episode Mode Presence:** {0: 6, 1: 6, 3: 5, 2: 4}

##### Stratum: `wedging` (4 episodes)
- **Contact Force:** Peak resultant force $= 4.56\text{ N}$ ($< 35.0\text{ N}$ safety limit)
- **Contact Torque:** Peak resultant torque $= 0.29\text{ Nm}$ ($< 7.0\text{ Nm}$ safety limit)
- **Insertion Depth:** Maximum insertion depth $= 5.67\text{ mm}$ (lowest z: $-5.67\text{ mm}$)
- **Simulator Contact Strata Observed:** [0, 1, 2, 3] (Wedging stratum 3 attained: True)
- **Observed Contact Modes:** [0, 1, 2]
- **Timestep Mode Histogram:** {0: 66, 1: 7, 2: 47}
- **Episode Mode Presence:** {0: 4, 1: 4, 2: 4}

#### Wedging Stratum State/Telemetry Alignment Detail:
- All 4 wedging scenarios demonstrated authentic two-point wedging transitions.
- Simulator `contact_stratum = 3` occurred when insertion depth exceeded $5.0\text{ mm}$ and tilt exceeded critical angle.
- Insertion depths achieved: $5.67\text{ mm}$.
- Resultant forces in wedging remained safely compliant ($\le 4.56\text{ N} < 35.0\text{ N}$).
- **Exact Timestep Alignment:** Verified that across all 4 wedging episodes, multiple timesteps simultaneously show `step_contact_stratum[t] == 3`, `step_insertion_depth_mm[t] > 5.0`, and post-action `next_states[t]` depth $> 5.0\text{ mm}$ with $|z_{\text{telem}} - z_{\text{state}}| < 10^{-4}\text{ mm}$.

---

### 4. Failure & Rejection Analysis

- **Total Rejections:** 0 episodes
- **Zero Rejections:** All 40 episodes satisfied physical validation envelopes and physical-interaction criteria.

---

### 5. Governance & Production Generation Readiness Statement

- **World Model Training Permitted:** 0
- **World Model Parameters Trained:** 0 (strictly zero gradient steps, zero optimizer updates)
- **Stage 3.0 Codebase:** 100% frozen (no modifications to `src/teaching/factory.py`, `src/teaching/validator.py`, `src/teaching/__init__.py`, `tests/test_p38_stage3_preflight.py`, `src/teaching/inference.py`).
- **Production 1,000-Scenario Generation (Stage 3.3):** Blocked pending formal review and authorization of this Stage 3.2.1 remediation report.

