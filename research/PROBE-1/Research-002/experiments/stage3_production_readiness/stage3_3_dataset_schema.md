# HOROS PROBE-1 — Research-002
## Stage 3.3 Production Dataset Schema Specification

**Program:** HOROS PROBE-1 — Autonomous Robotic Manipulation World Model  
**Project:** Research-002: Model Teaching Infrastructure & World Model Pre-training  
**Document:** Dataset Schema Specification  
**Document Identifier:** `HOROS-P1-R002-STAGE3.3-DATASET-SCHEMA`  
**Date:** 2026-11-17  
**Status:** **APPROVED SPECIFICATION**  

---

### 1. Two-Tier Data Architecture Overview

The Research-002 Stage 3 production dataset enforces a strict two-tier data separation architecture:
1. **Tier 1: Model-Visible Observation Package (`<episode_id>.npz`)**
   The self-contained, model-permissible training input. It contains solely sensor observations and kinematic states accessible to an embodied agent in real deployment.
2. **Tier 2: Privileged Simulator Ground-Truth Package (`<episode_id>.privileged.json`)**
   The authoritative scientific evidence package. It stores unobservable simulator physics parameters, step-by-step empirical telemetry, contact classifications, and validation receipts.

```
+-----------------------------------------------------------------------------------+
|                           PRODUCTION EPISODE ARTIFACTS                            |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|   +------------------------------------+   +----------------------------------+   |
|   |   MODEL-VISIBLE OBSERVATIONS       |   |   PRIVILEGED EVIDENCE PACKAGE    |   |
|   |   <episode_id>.npz                 |   |   <episode_id>.privileged.json   |   |
|   |   (Compressed NumPy Archive)       |   |   (JSON Metadata Package)        |   |
|   +------------------------------------+   +----------------------------------+   |
|   | • states: (T, D) float32           |   | • episode_id, seed, task         |   |
|   | • actions: (T, A) float32          |   | • stratum, regime                |   |
|   | • next_states: (T, D) float32      |   | • provenance_hash                |   |
|   | • wrenches: (T, 6) float32         |   | • sample_id to seed map          |   |
|   | • next_wrenches: (T, 6) float32    |   | • modes: (T,) ContactMode IDs    |   |
|   | • sample_id: opaque HMAC           |   | • rewards, including oracle      |   |
|   | • task: string                     |   |     bonuses                      |   |
|   |                                    |   | • env_metadata:                  |   |
|   |                                    |   |     - step_mu_true (T,)          |   |
|   |                                    |   |     - step_contact_stratum (T,)  |   |
|   +------------------------------------+   |     - step_insertion_depth_mm    |   |
|   | ZERO PRIVILEGED KEYS ALLOWED       |   |     - step_torque_norm_nm (T,)   |   |
|   +------------------------------------+   | • validation_verdict & metrics   |   |
|                                            +----------------------------------+   |
+-----------------------------------------------------------------------------------+
```

---

### 2. Model-Visible Observation Schema (`.npz`)

#### 2.1 File Format & Packing
- **Format:** Standard NumPy compressed zip archive (`np.savez_compressed`), serialized with `allow_pickle=False`.
- **Naming Convention:** `<sample_id>.npz`
  - Filename is strictly the 64-character lowercase hex string of the opaque `sample_id` (HMAC-SHA256).
  - Example: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.npz`
  - Reconstructable identifiers (`seed`, `task`, `model_id`, `episode_id`) are **forbidden** in the training file path.
  - Canonical identifiers (`syn_<task>_<model_id>_seed<seed>`) are stored strictly in the separate audit tier (`audit/<canonical_episode_id>.privileged.json` and `audit/<canonical_episode_id>.audit.json`).

#### 2.2 Tensor Definitions & Shapes

| Field Name | Type | Shape | Units | Physical Description |
| :--- | :--- | :--- | :--- | :--- |
| `states` | `float32` | $(T, D)$ | Mixed | Pre-action state vector at time $t$ |
| `actions` | `float32` | $(T, A)$ | mm / deg | Commanded action executed at time $t$ |
| `next_states` | `float32` | $(T, D)$ | Mixed | Post-action state resulting from action $t$ |
| `wrenches` | `float32` | $(T, 6)$ | N, Nm | Pre-action sensor wrench $[F_x, F_y, F_z, T_x, T_y, T_z]$ |
| `next_wrenches` | `float32` | $(T, 6)$ | N, Nm | Post-action sensor wrench resulting from action $t$ |
| `rewards` | not in the training archive | — | — | Audit only. The frozen peg reward adds seated and jammed bonuses. |
| `sample_id` | String | Scalar | N/A | Opaque HMAC-SHA256 identifier. Not a seed and not a slot alias. |
| `task` | String | Scalar | N/A | Task name. Not a join key by itself. |

#### 2.3 Task State Vector Dimensionality ($D$)
- **Task 1: Compliant Prelift ($D = 23$, Horizon $T = 20$):**
  - Indices `0..11` (12 floats): 3D Cartesian positions $[x, y, z]$ of 4 elastomeric fingertips (FL, FR, RL, RR) in mm.
  - Indices `12..15` (4 floats): Fingertip normal forces $[F_{n,1}, F_{n,2}, F_{n,3}, F_{n,4}]$ in N.
  - Indices `16..19` (4 floats): Fingertip tangential slip velocities $[\dot{\delta}_1, \dot{\delta}_2, \dot{\delta}_3, \dot{\delta}_4]$ in m/s.
  - Indices `20..22` (3 floats): Workpiece Cartesian position $[x_{\text{obj}}, y_{\text{obj}}, z_{\text{obj}}]$ in mm.
- **Task 2: Peg-in-Hole ($D \in \{12, 15\}$, Horizon $T = 30$):**
  - **Full Physical Layout ($D = 15$, exported by `extract_env_state_and_wrench`):**
    - Indices `0..2` (3 floats): Peg tip position $[x, y, z]$ relative to hole coordinate frame in mm.
    - Indices `3..5` (3 floats): Peg linear velocity $[\dot{x}, \dot{y}, \dot{z}]$ in mm/s.
    - Indices `6..8` (3 floats): Peg orientation Euler angles $[\phi, \theta, \psi]$ in radians.
    - Indices `9..14` (6 floats): 6-axis ATI wrist reaction wrench $[F_x, F_y, F_z, T_x, T_y, T_z]$ in N, Nm.
  - **Kinematic-Only Layout ($D = 12$, supported by approved state widths):**
    - Indices `0..2` (3 floats): Peg tip position $[x, y, z]$ relative to hole coordinate frame in mm.
    - Indices `3..5` (3 floats): Peg orientation Euler angles $[\phi, \theta, \psi]$ in degrees.
    - Indices `6..8` (3 floats): Peg linear velocity $[\dot{x}, \dot{y}, \dot{z}]$ in mm/s.
    - Indices `9..11` (3 floats): Peg angular velocity $[\omega_x, \omega_y, \omega_z]$ in deg/s.

#### 2.4 Task Action Vector Dimensionality ($A$)
- **Task 1: Compliant Prelift ($A = 5$):**
  - Indices `0..3` (4 floats): Commanded finger squeeze displacements $[\Delta x_1, \Delta x_2, \Delta x_3, \Delta x_4]$ in mm.
  - Index `4` (1 float): Commanded palm vertical lift displacement $dz$ in mm/step.
- **Task 2: Peg-in-Hole ($A = 6$):**
  - Indices `0..2` (3 floats): Commanded Cartesian delta translations $[dx, dy, dz]$ in mm/step.
  - Indices `3..5` (3 floats): Commanded delta Euler rotations $[d\phi, d\theta, d\psi]$ in deg/step.

#### 2.5 Forbidden Privileged Keys (Zero-Leakage Invariant)
The model-visible `.npz` archive must NEVER contain any of the following fields:
```python
FORBIDDEN_PRIVILEGED_KEYS = {
    "modes",
    "mu_true",
    "initial_mu_true",
    "object_mass",
    "initial_mass_kg",
    "clearance_mm",
    "clearance",
    "contact_mode",
    "contactmode",
    "friction",
    "step_mu_true",
    "step_object_mass_kg",
    "step_contact_stratum",
    "step_insertion_depth_mm",
    "step_force_norm_n",
    "step_torque_norm_nm",
    "env_metadata",
    "env_metadata_json",
}
```

---

### 3. Privileged Ground-Truth Schema (`.privileged.json`)

#### 3.1 File Format
- **Format:** Formatted JSON (`indent=2, sort_keys=True`), UTF-8 encoded.
- **Naming Convention:** `syn_<task>_<model_id>_seed<seed>.privileged.json`

#### 3.2 Top-Level Schema

```json
{
  "episode_id": "syn_compliant_prelift_stage3_pilot_controller_v1_seed3311000",
  "seed": 3311000,
  "task": "compliant_prelift",
  "provenance_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "observation_sha256": "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
  "modes": [0, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  "env_metadata": {
    "clearance_mm": 0.5,
    "dt_s": 0.01,
    "initial_mass_kg": 0.35,
    "initial_mu_true": 0.6,
    "regime": "nominal",
    "simulator_env": "CompliantPreLiftContactEnv",
    "step_force_norm_n": [0.0, 11.26, 11.26, ...],
    "step_insertion_depth_mm": [0.0, 0.0, ...],
    "step_contact_stratum": [0, 2, 2, ...],
    "step_mu_true": [0.6, 0.6, 0.6, ...],
    "step_object_mass_kg": [0.35, 0.35, 0.35, ...],
    "step_torque_norm_nm": [0.0, 0.0, ...],
    "stratum": "nominal"
  },
  "teacher_suggestions": {
    "candidate_actions": [...],
    "teacher_confidence": 0.95,
    "teacher_id": "stage3_pilot_controller_v1"
  }
}
```

---

### 4. Classification & Stratum Ontologies

#### 4.1 Seven-Class ContactMode Ontology (`src/contact_modes/contact_mode_definitions.py`)
Classified at every timestep from kinematic and sensor observation:

| ID | Enum Identifier | Display Name | Physical Condition |
| :---: | :--- | :--- | :--- |
| **0** | `ContactMode.FREE` | Free Space | $F_n < 0.1\text{ N}$, no contact established |
| **1** | `ContactMode.FIRST_CONTACT` | First Contact | Initial impact / touch event ($\Delta F_n > 0.5\text{ N}$) |
| **2** | `ContactMode.STICKING` | Sticking | In contact ($F_n \ge 0.5\text{ N}$), slip velocity $\|\dot{\delta}\| < 0.001\text{ m/s}$ |
| **3** | `ContactMode.SLIDING` | Sliding | In contact ($F_n \ge 0.5\text{ N}$), Coulomb slip $\|\dot{\delta}\| \ge 0.001\text{ m/s}$ |
| **4** | `ContactMode.IMPACT` | Impact Impulse | High derivative normal impulse, collision spike |
| **5** | `ContactMode.JAMMING` | Geometric jamming | Two-point geometric wedging / mechanical lock. Valid during simulator WEDGING only when the same timestep has depth $> 5\,\text{mm}$ and lateral force $> 15\,\text{N}$. Not a remap of stratum 3. |
| **6** | `ContactMode.RELEASE` | Contact Release | Breaking contact, normal force decaying to zero |

#### 4.2 Authoritative Simulator Contact Strata
Maintained directly by simulation environment physics solvers:

| Stratum ID | Stratum Name | Task Context | Physical Mechanic |
| :---: | :--- | :--- | :--- |
| **0** | `FREE` | All Tasks | Workpiece unconstrained in open space |
| **1** | `IMPACT` | Peg-in-Hole | Chamfer rim collision, transient reaction wrench |
| **2** | `SLIDING` | All Tasks | Chamfer slide or finger pad sliding friction |
| **3** | `WEDGING` | Peg-in-Hole | Two-point geometric binding exceeding critical tilt angle $\theta_c$ |
| **4** | `SEATED` | Peg-in-Hole | Full insertion depth reached, seated at hole base |

---

### 5. Dataset Manifest Schemas

#### 5.1 Accepted Manifest (`accepted_manifest.json`)
List of dictionaries, exactly 1,000 entries upon completion:
```json
{
  "episode_id": "prod_compliant_prelift_nominal_000",
  "task": "compliant_prelift",
  "stratum": "nominal",
  "seed": 3311000,
  "is_valid": true,
  "verdict": "PHYSICALLY_VALID",
  "provenance_hash": "...",
  "observation_sha256": "...",
  "privileged_sha256": "...",
  "metrics": {
    "contact_attained": true,
    "forces_bounded": true,
    "shear_attained": true,
    "contact_modes_attained": true,
    "event_specific_passed": true,
    "event_type": "nominal_positive_lift",
    "max_fn_finger_n": 2.846,
    "max_total_fn_n": 11.273,
    "max_fz_shear_n": 5.398,
    "max_slip_mps": 0.005,
    "max_lift_mm": 0.154,
    "final_lift_mm": 0.154,
    "modes_observed": [0, 2, 4],
    "interaction_passed": true
  }
}
```

#### 5.2 Rejected Manifest (`rejected_manifest.json`)
Audit trail of any candidate episode rejected by physics limits or interaction gates:
```json
{
  "episode_id": "prod_peg_in_hole_wedging_042",
  "task": "peg_in_hole",
  "stratum": "wedging",
  "seed": 3325042,
  "verdict": "REJECTED_FORCE_LIMIT",
  "failure_step": 18,
  "detail": "Contact force 36.2 N exceeded maximum limit of 35.0 N",
  "observation_sha256": "...",
  "privileged_sha256": "..."
}
```
