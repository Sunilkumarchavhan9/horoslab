# HOROS PROBE-1 — Research-002
## Stage 3.2.2 Execution Report: Contact Label Ontology and Causal Event Verification

**Author:** HOROS Research-002  
**Date:** 2026-11-17 18:50:00  
**Program:** HOROS PROBE-1 — Research-002  
**Stage:** Stage 3.2.2 — Contact Label Ontology and Causal Event Verification  
**Protocol:** HOROS-P1-R002-STAGE3.2.2-ONTOLOGY-CAUSAL  
**Parent canonical commit:** `298b0227a66bfcc3916ac07c987aa7257b333b13`  
**Parent mirror commit:** `223a7afb33cf6ce4ddee766066c84c3d21f0857e`  
**Overall Status:** **PASSED**  
**Trajectories regenerated:** False  
**World Model Training Permitted:** 0  
**World Model Training Performed:** False  
**Parameters Trained:** 0  
**Prelift Episode Length:** 20 steps (dt = 0.01 s)  
**Peg-in-Hole Episode Length:** 30 steps (dt = 0.01 s)  

---

### 1. Executive Summary & Remediation Scorecard

Stage 3.2.2 certifies the existing 40-episode pilot. The recorded episode files are unchanged. Two certification errors from Stage 3.2.1 are corrected:

1. **Contact-mode ontology.** The Stage 3.2.1 report listed four classifier classes and assigned the wrong names to IDs 1, 2, and 3. The authoritative `ContactMode` enum has seven classes. Saved numeric mode labels were not remapped.
2. **Regime A causality.** Acceptance now requires the measured friction sequence and slip on the post-transition post-action states of each Regime A episode. A maximum taken over the whole episode is not used.

Retained physical checks:

- **Nominal:** Object lift $z_{\text{obj}} > 0.001\text{ mm}$.
- **Probe:** Coulomb slip $\max \|\dot{\delta}_t\| \ge 0.0005\text{ m/s}$.
- **Regime B:** Mass increment $0.0025\text{ kg}$ at every timestep, ending at $0.400\text{ kg}$, with $F_n \ge 0.50\text{ N}$ and $F_z \ge 0.50\text{ N}$.
- **Wedging:** The same post-action index $t$ has simulator stratum 3, insertion depth $> 5.0\text{ mm}$ in telemetry and in `next_states[t]`, and $|z_{\text{telem}} - z_{\text{state}}| < 10^{-3}\text{ mm}$.

### 1.1 Authoritative classifier contact modes

Source: `src/contact_modes/contact_mode_definitions.py`, enum `ContactMode`, map `MODE_NAMES`.

| ID | Enum name | Display name |
| :--- | :--- | :--- |
| 0 | `FREE` | Free |
| 1 | `FIRST_CONTACT` | FirstContact |
| 2 | `STICKING` | Sticking |
| 3 | `SLIDING` | Sliding |
| 4 | `IMPACT` | Impact |
| 5 | `JAMMING` | Jamming |
| 6 | `RELEASE` | Release |

Histogram integers in this report use these IDs. Bin 1 is `FIRST_CONTACT`. Bin 2 is `STICKING`. Bin 3 is `SLIDING`. Bin 4 is `IMPACT`. Bin 5 is `JAMMING`. Bin 6 is `RELEASE`.

### 1.2 Simulator contact strata

This is a separate label system owned by the peg-in-hole simulator. It is not `ContactMode`.

| ID | Stratum |
| :--- | :--- |
| 0 | FREE |
| 1 | IMPACT |
| 2 | SLIDING |
| 3 | WEDGING |
| 4 | SEATED |

Classifier mode 3 is `SLIDING`. Simulator stratum 3 is `WEDGING`. Those two IDs must not be read as the same event.

Wedging episodes reached simulator stratum 3: **True**.  
Classifier mode `JAMMING` (ID 5) emitted on those episodes: **False**.  
Stratum 3 reached without classifier jamming: **True**.  
Wedging classifier modes observed: [0, 1, 2].  
Wedging simulator strata observed: [0, 1, 2, 3].

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
- **Timestep Mode Histogram:** {'0': 10, '4': 10, '2': 179, '3': 1}
- **Episode Mode Presence:** {'0': 10, '2': 10, '4': 10, '3': 1}

##### Stratum: `probe` (6 episodes)
- **Normal Force:** Peak total $F_n = 11.26\text{ N}$ (per finger: $2.85\text{ N}$)
- **Vertical Shear Force:** Peak $F_z = 3.99\text{ N}$
- **Max Slip Velocity ($\max |\dot{\delta}_t|$):** $0.005000\text{ m/s}$
- **Vertical Displacement:** Max lift $= 0.0000\text{ mm}$, Final lift $= 0.0000\text{ mm}$
- **Observed Contact Modes:** [0, 2, 3, 4]
- **Timestep Mode Histogram:** {'0': 6, '4': 6, '2': 67, '3': 41}
- **Episode Mode Presence:** {'0': 6, '2': 6, '3': 6, '4': 6}

##### Stratum: `nonstationary` (4 episodes)
- **Normal Force:** Peak total $F_n = 11.27\text{ N}$ (per finger: $2.85\text{ N}$)
- **Vertical Shear Force:** Peak $F_z = 4.04\text{ N}$
- **Max Slip Velocity ($\max |\dot{\delta}_t|$):** $0.005000\text{ m/s}$
- **Vertical Displacement:** Max lift $= 0.2540\text{ mm}$, Final lift $= 0.1270\text{ mm}$
- **Observed Contact Modes:** [0, 2, 3, 4]
- **Timestep Mode Histogram:** {'0': 4, '4': 4, '2': 60, '3': 12}
- **Episode Mode Presence:** {'0': 4, '2': 4, '3': 2, '4': 4}

#### Empirical Nonstationary Regime Verification:

Step indexing used for Regime A:

- `t` is the shared post-action index of `step_mu_true[t]` and `next_states[t]`.
- Simulator `step_count` is `t + 1`. The friction update runs at the start of `step()` after `step_count` increments, and it changes friction when `step_count >= 15`.
- Slip is the maximum absolute value of `next_states[t, 16:20]`, in m/s, and is evaluated only for `t` greater than or equal to the transition index.
- Pre-transition slip is reported and is excluded from `regime_a_slip_triggered`.

- **Regime A (friction transition, then slip):**
  - Episodes evaluated: seeds [3113000, 3113002]
  - Friction sequence verified on every Regime A episode: **True**
  - Post-transition slip verified independently on both episodes: **True**
  - Slip criterion: `post_transition_only`
  - Pre-transition slip used for acceptance: **False**
  - Post-transition peak slip across episodes: $0.00500\text{ m/s}$
  - Definition: maximum of per-episode post-transition peak absolute slip; indices before the friction transition are excluded

  - Episode `syn_compliant_prelift_stage3_pilot_controller_v1_seed3113000` seed 3113000:
    - Transition post-action index `t=14` (simulator step_count 15)
    - Pre-transition friction length 14: [0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6]
    - Post-transition friction length 6: [0.24, 0.24, 0.24, 0.24, 0.24, 0.24]
    - Friction sequence verified: **True**
    - First post-transition slip index `t=14` (simulator step_count 15)
    - Pre-transition peak slip: $0.00000\text{ m/s}$
    - Post-transition peak slip: $0.00500\text{ m/s}$
    - Episode passed: **True**

  - Episode `syn_compliant_prelift_stage3_pilot_controller_v1_seed3113002` seed 3113002:
    - Transition post-action index `t=14` (simulator step_count 15)
    - Pre-transition friction length 14: [0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6]
    - Post-transition friction length 6: [0.24, 0.24, 0.24, 0.24, 0.24, 0.24]
    - Friction sequence verified: **True**
    - First post-transition slip index `t=14` (simulator step_count 15)
    - Pre-transition peak slip: $0.00000\text{ m/s}$
    - Post-transition peak slip: $0.00500\text{ m/s}$
    - Episode passed: **True**

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
- **Timestep Mode Histogram:** {'0': 155, '1': 10, '2': 135}
- **Episode Mode Presence:** {'0': 10, '1': 10, '2': 10}

##### Stratum: `impact` (6 episodes)
- **Contact Force:** Peak resultant force $= 9.96\text{ N}$ ($< 35.0\text{ N}$ safety limit)
- **Contact Torque:** Peak resultant torque $= 0.40\text{ Nm}$ ($< 7.0\text{ Nm}$ safety limit)
- **Insertion Depth:** Maximum insertion depth $= 14.01\text{ mm}$ (lowest z: $-14.01\text{ mm}$)
- **Simulator Contact Strata Observed:** [0, 1, 2] (Wedging stratum 3 attained: False)
- **Observed Contact Modes:** [0, 1, 2, 3]
- **Timestep Mode Histogram:** {'0': 100, '3': 25, '1': 6, '2': 49}
- **Episode Mode Presence:** {'0': 6, '1': 6, '3': 5, '2': 4}

##### Stratum: `wedging` (4 episodes)
- **Contact Force:** Peak resultant force $= 4.56\text{ N}$ ($< 35.0\text{ N}$ safety limit)
- **Contact Torque:** Peak resultant torque $= 0.29\text{ Nm}$ ($< 7.0\text{ Nm}$ safety limit)
- **Insertion Depth:** Maximum insertion depth $= 5.67\text{ mm}$ (lowest z: $-5.67\text{ mm}$)
- **Simulator Contact Strata Observed:** [0, 1, 2, 3] (Wedging stratum 3 attained: True)
- **Observed Contact Modes:** [0, 1, 2]
- **Timestep Mode Histogram:** {'0': 66, '1': 7, '2': 47}
- **Episode Mode Presence:** {'0': 4, '1': 4, '2': 4}

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
- **World Model Parameters Trained:** 0 (zero gradient steps, zero optimizer updates, no checkpoint modifications)
- **Stage 3.0 Codebase:** frozen (`src/teaching/factory.py`, `src/teaching/validator.py`, `src/teaching/__init__.py`, `tests/test_p38_stage3_preflight.py`, `src/teaching/inference.py`)
- **B1–B4 and CBF v1.0:** frozen
- **Production 1,000-episode generation (Stage 3.3):** prohibited until a separate formal authorization
- **Numeric contact labels:** not remapped
- **Report SHA-256:** `ee9e21ae910753fc1e1e663ff0e971148e1b7d1c48bc0a767c852b8f8da0b244`

