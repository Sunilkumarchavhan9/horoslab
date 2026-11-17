# HOROS PROBE-1 — Research-002
## Stage 3.3 Acceptance & Rejection Specification

**Program:** HOROS PROBE-1 — Autonomous Robotic Manipulation World Model  
**Project:** Research-002: Model Teaching Infrastructure & World Model Pre-training  
**Document:** Production Acceptance & Rejection Specification  
**Document Identifier:** `HOROS-P1-R002-STAGE3.3-ACCEPTANCE-SPEC`  
**Date:** 2026-11-17  
**Status:** **APPROVED SPECIFICATION** (Locked to Stage 3.2.2 Standards)  

---

### 1. Architectural Scope & Acceptance Model

Every episode synthesized in Stage 3.3 must pass a dual-stage gatekeeper before being accepted into the production dataset:
$$\text{Accepted} = \text{PhysicsValid}(\text{record}) \land \text{InteractionValid}(\text{record})$$

Neither check alone is sufficient:
1. `PhysicsValid`: Evaluates general conservation and stability bounds (finite values, force limits, kinematic limits) via `PhysicsValidationEngine`.
2. `InteractionValid`: Evaluates domain-specific contact physics, causal event sequences, and geometric constraints via `verify_physical_interaction()`.

Any failure at either gate causes immediate rejection. Rejection is strictly non-retrying: failed scenarios are permanently archived in `rejected_manifest.json`.

---

### 2. Physical Limits & Safety Envelopes

Every episode must stay within the authoritative physical limits defined in `TaskPhysicsLimits`:

#### 2.1 Compliant Prelift Safety Bounds
- **Normal Force per Finger:** $\max_t F_{n,i}(t) \le 20.0\text{ N}$ (for each finger $i \in \{1, 2, 3, 4\}$).
- **Total Grip Force:** $\max_t \sum_{i=1}^4 F_{n,i}(t) \le 20.0\text{ N}$.
- **Minimum Grip Force:** $\max_t \sum_{i=1}^4 F_{n,i}(t) \ge 0.50\text{ N}$ (ensures contact establishment).
- **Vertical Shear Force:** $\max_t |F_z(t)| \le 15.0\text{ N}$.
- **Minimum Vertical Shear Force:** $\max_t |F_z(t)| \ge 0.50\text{ N}$ (ensures shear pad stretch).
- **Kinematic Finger Velocity:** $\max_t \|\mathbf{v}_i(t)\| \le 100.0\text{ mm/s}$.
- **Kinematic Workpiece Velocity:** $\max_t \|\mathbf{v}_{\text{obj}}(t)\| \le 100.0\text{ mm/s}$.

#### 2.2 Peg-in-Hole Assembly Safety Bounds
- **Resultant Contact Force:** $\max_t \|\mathbf{F}(t)\| \le 35.0\text{ N}$.
- **Resultant Contact Torque:** $\max_t \|\boldsymbol{\tau}(t)\| \le 7.0\text{ Nm}$.
- **Minimum Contact Force:** $\max_t \|\mathbf{F}(t)\| > 0.0\text{ N}$ (ensures interaction occurred).
- **Insertion Attainment:** $\min_t z_{\text{peg}}(t) \le 0.0\text{ mm}$ (peg enters hole fixture).
- **Kinematic Peg Velocity:** $\max_t \|\mathbf{v}_{\text{peg}}(t)\| \le 100.0\text{ mm/s}$.

---

### 3. Contact Mode Ontology & Stratum Separation

Stage 3.2.2 established the authoritative separation between **Classifier Contact Modes** and **Simulator Contact Strata**.

#### 3.1 ContactMode Seven-Class Ontology
Every timestep $t \in [0, T-1]$ has a discrete classification label $m_t \in \{0, 1, 2, 3, 4, 5, 6\}$:
- `0: ContactMode.FREE` — Separation distance $> 0$, $F_n < 0.1\text{ N}$.
- `1: ContactMode.FIRST_CONTACT` — Impact transition step ($\Delta F_n > 0.5\text{ N}$).
- `2: ContactMode.STICKING` — Contact active ($F_n \ge 0.5\text{ N}$), tangential velocity $\|\dot{\delta}\| < 0.001\text{ m/s}$.
- `3: ContactMode.SLIDING` — Contact active ($F_n \ge 0.5\text{ N}$), Coulomb sliding velocity $\|\dot{\delta}\| \ge 0.001\text{ m/s}$.
- `4: ContactMode.IMPACT` — Normal force impulse exceeding contact stiffness derivative threshold.
- `5: ContactMode.JAMMING` — Mechanical jamming (friction-locked wedge without geometric two-point constraint).
- `6: ContactMode.RELEASE` — Breaking contact ($\Delta F_n < -0.5\text{ N}$, transitioning to Free).

#### 3.2 Invariant: Mode vs Stratum Decoupling
- **Simulator Contact Strata** represent authoritative ground-truth boundary states in simulation: `0: FREE, 1: IMPACT, 2: SLIDING, 3: WEDGING, 4: SEATED`.
- **Prohibition:** Simulator stratum 3 (`WEDGING`) must NEVER be equated with or remapped to classifier ID 5 (`JAMMING`) or classifier ID 3 (`SLIDING`).
- In all wedging episodes, classifier modes must consist solely of valid physical modes (`FREE`, `FIRST_CONTACT`, `STICKING`), and must not emit spurious `JAMMING` labels.

---

### 4. Task & Stratum Specific Acceptance Criteria

#### 4.1 Compliant Prelift Task

##### A. Nominal Stratum (250 episodes)
1. `contact_attained`: Peak total normal force $\ge 0.50\text{ N}$.
2. `forces_bounded`: Finger $F_n \le 20.0\text{ N}$, total $F_n \le 20.0\text{ N}$, shear $F_z \le 15.0\text{ N}$.
3. `shear_attained`: Peak vertical shear force $|F_z| \ge 0.50\text{ N}$.
4. `contact_modes_attained`: At least one non-free contact mode observed ($\exists t: m_t \ne 0$).
5. `event_specific_passed`: **Positive Workpiece Liftoff:**
   $$\max_t z_{\text{obj}}(t) > 0.001\text{ mm}$$
   Across the 250 nominal scenarios, $\max_t z_{\text{obj}}$ must fall within the certified range $[0.002, 0.354]\text{ mm}$.

##### B. Probe Stratum (150 episodes)
1. `contact_attained`: Peak total normal force $\ge 0.50\text{ N}$.
2. `forces_bounded`: All force envelopes respected.
3. `shear_attained`: Peak vertical shear force $\ge 0.50\text{ N}$.
4. `event_specific_passed`: **Controlled Coulomb Sliding:**
   $$\max_t \|\dot{\delta}_t\| \ge 0.0005\text{ m/s}$$
   Workpiece remains resting on the table substrate ($\max_t z_{\text{obj}}(t) = 0.0\text{ mm}$). Workpiece lift is strictly prohibited in the probe stratum.

##### C. Nonstationary Stratum — Regime A (50 episodes, index % 2 == 0)
1. `friction_transition_verified`: Telemetry `step_mu_true` verifies:
   - Steps $0 \le t \le 13$ (simulator steps $1 \dots 14$): $\mu(t) = 0.60$.
   - Steps $14 \le t \le 19$ (simulator steps $15 \dots 20$): $\mu(t) = 0.24$.
2. `event_specific_passed`: **Causal Post-Transition Slip:**
   $$\max_{t \ge 14} \|\dot{\delta}_t\| > 0.0010\text{ m/s}$$
   *Causal Invariant:* Slip occurring prior to the transition ($t < 14$) CANNOT satisfy the acceptance test. If $\max_{t < 14} \|\dot{\delta}_t\| > 0.0010\text{ m/s}$ but $\max_{t \ge 14} \|\dot{\delta}_t\| \le 0.0010\text{ m/s}$, the episode is REJECTED.

##### D. Nonstationary Stratum — Regime B (50 episodes, index % 2 == 1)
1. `mass_influx_verified`: Telemetry `step_object_mass_kg` verifies:
   - Initial mass at $t=0$: $m(0) = 0.3525\text{ kg}$ (simulator step 1 after step 0 influx).
   - Influx rate: $\Delta m = 0.0025\text{ kg/step} \pm 10^{-4}\text{ kg}$ ($0.25\text{ kg/s}$).
   - Final mass at $t=19$ (step 20): $m(19) = 0.400\text{ kg} \pm 10^{-4}\text{ kg}$.
2. `event_specific_passed`: **Active Clamping Hold:**
   $$\max_t \sum_{i=1}^4 F_{n,i}(t) \ge 0.50\text{ N} \quad \text{and} \quad \max_t |F_z(t)| \ge 0.50\text{ N}$$
   Workpiece remains held without slip failure under mass accretion.

---

#### 4.2 Peg-in-Hole Assembly Task

##### A. Nominal Stratum (250 episodes)
1. `insertion_attained`: Lowest vertical position $\min_t z(t) \le 0.0\text{ mm}$ (maximum insertion $\max(0, -z) > 10.0\text{ mm}$).
2. `contact_attained`: Contact force $> 0.0\text{ N}$.
3. `forces_bounded`: Resultant force $\le 35.0\text{ N}$, torque $\le 7.0\text{ Nm}$.
4. `stratum_specific_passed`: **Zero Wedging:**
   $$3 \notin \text{step\_contact\_stratum}$$

##### B. Impact Stratum (150 episodes)
1. `insertion_attained`: $\min_t z(t) \le 0.0\text{ mm}$.
2. `forces_bounded`: Resultant force $\le 35.0\text{ N}$, torque $\le 7.0\text{ Nm}$.
3. `stratum_specific_passed`: **Authentic Rim Impact Established:**
   $$(1 \in \text{step\_contact\_stratum} \lor 4 \in \text{modes}) \land (\max_t \|\mathbf{F}(t)\| \ge 1.0\text{ N}) \land (\max_t \|\mathbf{F}(t)\| \le 35.0\text{ N}) \land (\max_t \|\boldsymbol{\tau}(t)\| \le 7.0\text{ Nm})$$
   Both kinematic collision detection (simulator stratum 1 `RIM_IMPACT` or classified mode 4 `ContactMode.IMPACT`) AND authentic dynamic force impulse ($\ge 1.0\text{ N}$) are strictly required. Infinitesimal forces or unconfirmed impacts are rejected.

##### C. Wedging Stratum (100 episodes)
1. `insertion_attained`: $\min_t z(t) \le 0.0\text{ mm}$.
2. `forces_bounded`: Compliant resultant force $\le 35.0\text{ N}$ (typically $\le 6.0\text{ N}$), torque $\le 7.0\text{ Nm}$ (typically $\le 0.5\text{ Nm}$).
3. `stratum_specific_passed`: **Exact Timestep State/Telemetry Wedging Alignment & Jamming Prohibition:**
   There must exist at least one timestep $t$ such that ALL four conditions hold simultaneously at index $t$:
   $$\begin{cases}
   \text{step\_contact\_stratum}[t] = 3 \\
   \text{step\_insertion\_depth\_mm}[t] > 5.0\text{ mm} \\
   \max(0.0, -next\_states[t, 2]) > 5.0\text{ mm} \\
   |\text{step\_insertion\_depth\_mm}[t] - \max(0.0, -next\_states[t, 2])| < 10^{-3}\text{ mm}
   \end{cases}$$
   And classifier mode 5 (`ContactMode.JAMMING`) is strictly forbidden across all timesteps:
   $$5 \notin \text{modes}$$

---

### 5. Failure Accounting, Reserve Pool & Security Guard

1. **No Silent Reseeding:** Under no circumstances shall a rejected scenario be re-run with a perturbed seed, parameter offset, or modified teacher command.
2. **Rejection Persistence:** Every rejected episode is saved to `experiments/stage3_production/rejected/` and recorded in `rejected_manifest.json` with fail-closed status and diagnostic metadata.
3. **Pre-registered Reserve Pool:** A dedicated reserve pool of 300 seeds (base $3,390,000$, 50 reserve seeds per stratum across 6 strata) is locked in `stage3_3_seed_registry.json`. Reserve seeds cannot be silently consumed; they require explicit audit and authorization during Stage 3.4.
4. **Model-Visible Allowlist & Zero Leakage:** Dataloader inputs must strictly adhere to `MODEL_VISIBLE_ALLOWLIST`. Any presence of privileged quantities (`mu_true`, `object_mass`, `step_contact_stratum`, `env_metadata`, etc.) triggers an immediate `SecurityViolationError`.
5. **5% Rejection Circuit Breaker:**
   - If cumulative rejections in any stratum exceed $5.0\%$ ($>12$ in nominal, $>7$ in probe/impact, $>5$ in nonstationary/wedging), generation is automatically paused.
   - Requires engineering review to inspect simulator dynamics before resuming.
