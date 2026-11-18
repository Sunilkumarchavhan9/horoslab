# HOROS PROBE-1 — Research-002
## Stage 3.3 Production Dataset Generation Protocol

**Program:** HOROS PROBE-1 — Autonomous Robotic Manipulation World Model  
**Project:** Research-002: Model Teaching Infrastructure & World Model Pre-training  
**Stage:** Stage 3.3 — Production Dataset Readiness and Generation Protocol  
**Protocol Identifier:** `HOROS-P1-R002-STAGE3.3-PROD-GEN-PROTOCOL`  
**Date:** 2026-11-17  
**Status:** **READY FOR AUTHORIZATION** (Preparation complete; Production generation locked pending sign-off)  
**Parent Pilot Certifications:**
- Stage 3.2.1 Commit: `298b0227` (Canonical) / `223a7af` (Mirror)
- Stage 3.2.2 Commit: `691d7bf7` (Canonical) / `42b35c9d` (Mirror)  
**Target Dataset Volume:** 1,000 Verified Synthetic Physical Episodes (500 Compliant Prelift, 500 Peg-in-Hole)  

---

### 1. Executive Summary & Governance Charter

This protocol establishes the authoritative, immutable operational specification for generating the 1,000-episode Research-002 production dataset. Following the successful certification of the 40-episode physical interaction pilot in Stage 3.2.2, this document codifies every scenario distribution, parameter domain, seed mapping, acceptance criterion, data-separation boundary, and governance check required to execute Stage 3.3B production generation safely and deterministically.

#### Governance Directives (Stage 3.3A Mandate)
1. **Strict Generation Lock:** No production trajectories shall be synthesized under Stage 3.3A. Generation is strictly reserved for Stage 3.3B following independent authorization.
2. **Pilot Artifact Preservation:** The 40 certified pilot trajectories (`experiments/stage3_preflight/pilot/accepted/`), pilot manifests, and pilot reports shall remain permanently immutable. Pilot seeds shall not be reused.
3. **Model Training Lockdown:** Zero student-model parameter updates, gradient computations, optimizer steps, or checkpoint alterations are permitted.
4. **Stage 3.0 Architectural Freeze:** The underlying infrastructure files (`src/teaching/factory.py`, `src/teaching/validator.py`, `src/teaching/__init__.py`, `src/teaching/inference.py`, `tests/test_p38_stage3_preflight.py`), Baselines B1–B4, and CBF v1.0 remain strictly frozen.

---

### 2. Task Allocation & Scientific Rationale

The production dataset comprises exactly 1,000 physical interaction episodes partitioned equally across two complementary robotic contact tasks. The stratum allocations are purposefully structured to provide balanced coverage across nominal mechanics, critical friction/mass boundaries, transient impacts, and non-linear constraint geometries.

```
Total Production Dataset: 1,000 Episodes
├── Task 1: Compliant Prelift (500 Episodes)
│   ├── Nominal Stratum: 250 Episodes (50%)
│   ├── Probe Stratum: 150 Episodes (30%)
│   └── Nonstationary Stratum: 100 Episodes (20%)
│       ├── Regime A (Friction Drop): 50 Episodes (10%)
│       └── Regime B (Mass Influx): 50 Episodes (10%)
└── Task 2: Peg-in-Hole (500 Episodes)
    ├── Nominal Stratum: 250 Episodes (50%)
    ├── Impact Stratum: 150 Episodes (30%)
    └── Wedging Stratum: 100 Episodes (20%)
```

#### 2.1 Compliant Prelift (500 Episodes, Horizon $H=20$, $\Delta t=0.01\text{ s}$)
- **Nominal Stratum (250 episodes, 50%):**
  - *Parameter Range:* $\mu \in [0.40, 0.80]$, $m \in [0.30, 0.55]\text{ kg}$, clearance $c = 0.5\text{ mm}$.
  - *Scientific Rationale:* Establishes standard multi-finger grasp prelift dynamics. Induces stable elastomeric pad deformation, shear engagement ($F_z \ge 0.50\text{ N}$), and authentic positive workpiece liftoff ($z_{\text{obj}} \in [0.002, 0.354]\text{ mm}$). Provides the world model with the core distribution of successful non-slip manipulation transitions.
- **Probe Stratum (150 episodes, 30%):**
  - *Parameter Range:* $\mu \in [0.15, 0.85]$, $m \in [0.30, 0.90]\text{ kg}$, clearance $c = 0.5\text{ mm}$.
  - *Scientific Rationale:* Evaluates high-mass and low-friction physical boundary regimes. Under upward micro-lift ($5.0\text{ mm/s}$), the required shear force exceeds the Coulomb limit ($\mu F_n$), inducing controlled macroscopic pad sliding ($\max \|\dot{\delta}_t\| \ge 0.0005\text{ m/s}$) while the workpiece safely rests on the substrate table ($z_{\text{obj}} = 0.0\text{ mm}$). Trains the world model to differentiate adhesive shear stretch from slip transitions.
- **Nonstationary Stratum (100 episodes, 20%):**
  - *Regime A — Dynamic Friction Collapse (50 episodes, index % 2 == 0):*
    - *Dynamics:* Workpiece initialized at $\mu = 0.60, m = 0.350\text{ kg}$. At step 15 ($t=14$ post-action index), simulator friction collapses instantaneously to $\mu = 0.24$.
    - *Scientific Rationale:* Tests causal physical detection under sudden parameter degradation. Requires the world model to recognize friction shifts from sensor telemetry without privileged indicators. Slip must strictly follow the transition ($\max_{t \ge 14} \|\dot{\delta}_t\| > 0.0010\text{ m/s}$).
  - *Regime B — Dynamic Mass Influx (50 episodes, index % 2 == 1):*
    - *Dynamics:* Workpiece initialized at $m = 0.350\text{ kg}, \mu = 0.60$. Starting at $t=0$, mass increases continuously at $+0.25\text{ kg/s}$ ($+0.0025\text{ kg/step}$), reaching exactly $0.400\text{ kg}$ at step 20 ($t=19$).
    - *Scientific Rationale:* Tests force adaptation and inertial change under continuous physical accretion. Requires the grasp to maintain stable hold ($F_n \ge 0.50\text{ N}, F_z \ge 0.50\text{ N}$) without dropped object failure.

#### 2.2 Peg-in-Hole Assembly (500 Episodes, Horizon $H=30$, $\Delta t=0.01\text{ s}$)
- **Nominal Insertion Stratum (250 episodes, 50%):**
  - *Parameter Range:* Clearance $c \in [0.40, 1.50]\text{ mm}$, $\mu \in [0.30, 0.70]$, radial offset $r \in [0.0, 0.30]\text{ mm}$, tilt angle $\theta \in [0.0, 0.20]^\circ$.
  - *Scientific Rationale:* Smooth compliance descent past the chamfer boundary into the cylindrical hole fixture ($z < 0$, max insertion $> 12.0\text{ mm}$). Captures free-space to operational space impedance compliance, establishing baseline unconstrained assembly distributions.
- **Impact & Chamfer Collision Stratum (150 episodes, 30%):**
  - *Parameter Range:* Clearance $c \in [0.50, 2.00]\text{ mm}$, $\mu \in [0.30, 0.70]$, radial offset $r \in [0.50, 2.00]\text{ mm}$, tilt angle $\theta \in [0.0, 0.50]^\circ$.
  - *Scientific Rationale:* Deliberate geometric misalignment causing rim impact upon chamfer contact. Generates peak contact forces ($F \in [5.0, 15.0]\text{ N} \le 35.0\text{ N}$) and torques ($\tau \in [0.2, 1.0]\text{ Nm} \le 7.0\text{ Nm}$). Trains the world model on high-frequency contact impulses and impedance correction forces.
- **Two-Point Wedging Stratum (100 episodes, 20%):**
  - *Parameter Range:* Clearance $c \in [0.10, 0.40]\text{ mm}$, $\mu \in [0.20, 0.60]$, radial offset $r \in [0.0, \max(0.5c, 0.05)]\text{ mm}$, tilt angle $\theta \in [\theta_c + 0.5^\circ, \theta_c + 3.0^\circ]$, where critical angle $\theta_c = \arctan(2c / L_{\text{peg}})$ with $L_{\text{peg}} = 80.0\text{ mm}$.
  - *Scientific Rationale:* Recreates the classic robotic assembly failure mode where peg orientation exceeds critical tilt, producing simultaneous two-point contact at the hole rim and hole wall. Authoritative simulator `contact_stratum = 3` must occur at insertion depth $> 5.0\text{ mm}$ with bounded forces ($\le 10.0\text{ N} \ll 35.0\text{ N}$) and torques ($\le 1.0\text{ Nm} \ll 7.0\text{ Nm}$).

---

### 3. Production Seed Registry & Domain Partitioning

To guarantee absolute scientific isolation between preflight pilot experiments and production datasets, Stage 3.3 establishes a dedicated production seed namespace.

#### 3.1 Seed Formula & Namespace Definition
Every production episode seed is deterministically assigned via the closed formula:
$$\text{seed} = 3\,300\,000 + 10\,000 \cdot \text{task\_code} + 1\,000 \cdot \text{stratum\_code} + \text{index}$$

Where:
- $\text{task\_code} \in \{1: \text{compliant\_prelift},\, 2: \text{peg\_in\_hole}\}$
- $\text{stratum\_code} \in \{1: \text{nominal},\, 2: \text{probe},\, 3: \text{nonstationary},\, 4: \text{impact},\, 5: \text{wedging}\}$
- $\text{index} \in [0, N_{\text{stratum}} - 1]$

#### 3.2 Allocation Table

| Task | Stratum | Count | Index Range | Seed Range | Pilot Overlap |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `compliant_prelift` | `nominal` | 250 | $0 \dots 249$ | `3311000` – `3311249` | **0** (Pilot: `3111000`–`3111009`) |
| `compliant_prelift` | `probe` | 150 | $0 \dots 149$ | `3312000` – `3312149` | **0** (Pilot: `3112000`–`3112005`) |
| `compliant_prelift` | `nonstationary` | 100 | $0 \dots 99$ | `3313000` – `3313099` | **0** (Pilot: `3113000`–`3113003`) |
| `peg_in_hole` | `nominal` | 250 | $0 \dots 249$ | `3321000` – `3321249` | **0** (Pilot: `3121000`–`3121009`) |
| `peg_in_hole` | `impact` | 150 | $0 \dots 149$ | `3324000` – `3324149` | **0** (Pilot: `3124000`–`3124005`) |
| `peg_in_hole` | `wedging` | 100 | $0 \dots 99$ | `3325000` – `3325099` | **0** (Pilot: `3125000`–`3125003`) |
| **Total** | | **1,000** | | `3311000` – `3325099` | **Strictly 0 collisions** |

The master production seed registry is formalized in [`stage3_3_seed_registry.json`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/experiments/stage3_production_readiness/stage3_3_seed_registry.json).

---

### 4. Controller & Simulator Specifications

#### 4.1 Teacher Controller (`Stage3PilotController` v1.1.0)
- **Compliant Prelift Control Profile:**
  - $t = 0$: Rapid inward finger translation $\Delta x = 1.40\text{ mm}$ (closes initial $1.5\text{ mm}$ gap to $0.1\text{ mm}$).
  - $t = 1$: Indentation clamp $\Delta x = 0.80\text{ mm}$ (establishes $0.70\text{ mm}$ elastomeric pad compression, generating total normal clamping force $F_n \approx 11.26\text{ N}$).
  - $t \ge 2$: Constant clamp hold ($\Delta x = 0.0\text{ mm}$), commanded micro-lift $dz = +0.050\text{ mm/step}$ ($v_z = 5.0\text{ mm/s} \ll 100.0\text{ mm/s}$ kinematic limit).
- **Peg-in-Hole Control Profile:**
  - Downward descent velocity $dz = -0.95\text{ mm/step}$ ($v_z = 0.095\text{ m/s} < 0.100\text{ m/s}$ kinematic velocity limit).
  - Lateral offset command $dx = +0.020\text{ mm/step}$ ($v_x = 2.0\text{ mm/s}$) driving contact boundary engagement across all hole tolerances.

#### 4.2 Simulator Configuration
- **Integrator:** Semi-implicit Euler, physical timestep $\Delta t = 0.01\text{ s}$ ($100\text{ Hz}$).
- **Compliance Model:** 4-finger elastomeric contact model with Kelvin-Voigt viscoelastic normal compliance ($k_n = 4000\text{ N/m}$, $b_n = 50\text{ Ns/m}$) and tangential LuGre/Coulomb friction pad dynamics.
- **Impedance Dynamics:** 6-DOF operational space Cartesian compliance controller ($K_p = \text{diag}(1500, 1500, 2000)\text{ N/m}$, $K_d = \text{diag}(60, 60, 80)\text{ Ns/m}$).

---

### 5. Acceptance Criteria & Failure Accounting

Every synthesized trajectory must satisfy both Physics Envelope Validation AND Physical-Interaction Acceptance. Rejection rules are fail-closed: if any criterion fails, the episode is marked rejected and logged.

#### 5.1 Acceptance Rules Checklist

```
Episode Acceptance = [Physics Engine Valid] AND [Interaction Criteria Satisfied]
```

1. **Physics Engine Validation:**
   - No non-finite values (NaN, Inf) in any observation or state array.
   - Force limits: Prelift finger $F_n \le 20.0\text{ N}$, total $F_n \le 20.0\text{ N}$, shear $F_z \le 15.0\text{ N}$. Peg-in-Hole resultant $F \le 35.0\text{ N}$, torque $\tau \le 7.0\text{ Nm}$.
   - Kinematic velocity limits: Prelift $\le 100\text{ mm/s}$, Peg-in-Hole $\le 100\text{ mm/s}$.
2. **ContactMode Ontology Classification:**
   - Every timestep's classified contact mode must belong to the approved 7-class ontology (`0: FREE`, `1: FIRST_CONTACT`, `2: STICKING`, `3: SLIDING`, `4: IMPACT`, `5: JAMMING`, `6: RELEASE`).
   - Classifier labels are not remapped from simulator strata. Simulator stratum 3 is WEDGING. Classifier ID 5 is `ContactMode.JAMMING`, the frozen geometric lock. A JAMMING label is valid only when that timestep is also stratum 3, deeper than 5 mm, and above 15 N lateral force. Sliding is classifier ID 3 and is not JAMMING.
3. **Prelift Event-Specific Verification:**
   - *Nominal:* $\max(z_{\text{obj}}) > 0.001\text{ mm}$ (positive liftoff).
   - *Probe:* $\max \|\dot{\delta}_t\| \ge 0.0005\text{ m/s}$ (Coulomb slip) and workpiece rests on table ($z_{\text{obj}} = 0.0\text{ mm}$).
   - *Regime A:* $\mu$ steps verify $0.60 \to 0.24$ at step 15 ($t=14$), and causal post-transition slip $\max_{t \ge 14} \|\dot{\delta}_t\| > 0.0010\text{ m/s}$. Pre-transition slip cannot satisfy acceptance.
   - *Regime B:* Step mass verifies continuous influx $+0.0025\text{ kg/step}$, reaching $0.400\text{ kg}$ at step 20, with clamping hold $F_n \ge 0.50\text{ N}, F_z \ge 0.50\text{ N}$.
4. **Peg-in-Hole Event-Aligned Rim-Impact Verification:**
   - Evaluated strictly on the rim collision event set: $\mathcal{E} = \{t : \text{step\_contact\_stratum}[t] = 1\}$.
   - Event impulse must be strictly positive: $J_{\mathcal{E}} = \sum_{t \in \mathcal{E}} \|\mathbf{F}(t)\| \Delta t > 10^{-6}\text{ N}\cdot\text{s}$.
   - Rising force rate across event onset must satisfy: $\dot{F} > 0.01\text{ N/s}$.
   - Resultant contact force and torque bounded throughout: $\max_t \|\mathbf{F}(t)\| \le 35.0\text{ N}$, $\max_t \|\boldsymbol{\tau}(t)\| \le 7.0\text{ Nm}$.
   - Force peaks occurring outside $\mathcal{E}$ are rejected as unaligned.
5. **Peg-in-Hole Wedging Verification:**
   - Timestep alignment: There must exist at least one timestep $t$ where simultaneously:
     1. Simulator `step_contact_stratum[t] == 3`
     2. Telemetry insertion depth `step_insertion_depth_mm[t] > 5.0 mm`
     3. Model-visible post-action state insertion depth $\max(0.0, -next\_states[t, 2]) > 5.0\text{ mm}$
     4. Physical consistency $|z_{\text{telem}}[t] - z_{\text{state}}[t]| < 10^{-3}\text{ mm}$.
   - Every `ContactMode.JAMMING` step must satisfy state/telemetry depth alignment ($|z_{\text{telem}} - z_{\text{state}}| < 10^{-3}\text{ mm}$ at $z > 5.0\text{ mm}$), lateral force $> 15.0\text{ N}$, and tilt $> 1.8^\circ$.

#### 5.2 Zero Silent Retry / Overwrite Policy
- Failed episodes are **NEVER** silently regenerated, discarded, or retried under altered seeds.
- Every rejected episode is permanently written to `experiments/stage3_production/rejected/` with its complete `.npz`, `.privileged.json`, and an entry in `rejected_manifest.json` recording verdict, failure step, and violation details.
- **Safety Circuit Breaker:** If the cumulative rejection rate in any stratum exceeds $5.0\%$ during production generation, generation halts immediately for investigation.

---

### 6. Two-Tier Data Separation & Packaging

To eliminate observation leakage while preserving complete scientific provenance, production artifacts are partitioned into two strictly segregated directory tiers:

1. **Model-Visible Training Tier (`training/<sample_id>.npz`):**
   - Stored in a dedicated `training/` directory containing ONLY model-visible compressed NumPy archives.
   - Files are named strictly by their opaque 64-character HMAC-SHA256 hex string (`<sample_id>.npz`).
   - Contains ONLY model-permissible tensors: `states`, `actions`, `next_states`, `wrenches`, `next_wrenches`, `sample_id`, `task`.
   - **Strict Zero-Leakage Guarantee:** Reconstructable identifiers (`seed`, `episode_id`, `slot_alias`, `canonical_episode_id`, `provenance_hash`, `rewards`) and simulator ground-truth quantities (`modes`, `mu_true`, `object_mass`, `clearance_mm`, `step_contact_stratum`, etc.) are **strictly forbidden**.
   - `ProductionTrainingDataloader` refuses any directory containing colocated audit manifests, seed registries, or `.privileged.json` files.
2. **Privileged Audit Tier (`audit/<canonical_episode_id>.privileged.json` & `.audit.json`):**
   - Stored in a separate `audit/` directory isolated from student model dataloaders.
   - Contains authoritative simulator ground truth: step-by-step telemetry (`step_mu_true`, `step_object_mass_kg`, `step_contact_stratum`, `step_insertion_depth_mm`, `step_force_norm_n`, `step_torque_norm_nm`), 7-class `ContactMode` arrays, full environmental metadata, teacher suggestion records, the HMAC audit salt, and the join mapping from `sample_id` to `canonical_episode_id` and `seed`.

---

### 7. Governance, CI & Branch Protection

1. **Production Branch:** `feat/probe1-stage33-production-readiness` (Preparation & Test Phase).
2. **Branch Protection:**
   - All tests in `tests/test_p40_stage3_production_readiness.py` must pass ($100\%$).
   - Full regression suite (262+ tests) must pass on both Canonical and Public Mirror.
   - Exact bitwise Git blob parity (`git hash-object`) must be verified on all deliverables across repositories.
3. **Execution Gate:** Generating the 1,000 production episodes requires formal user authorization of [`stage3_3_authorization_checklist.md`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/experiments/stage3_production_readiness/stage3_3_authorization_checklist.md).
