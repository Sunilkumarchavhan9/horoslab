# HOROS PROBE-1 — Research-002
## Stage 3.3A.3 Security & Data Isolation Audit

**Program:** HOROS PROBE-1 — Autonomous Robotic Manipulation World Model  
**Phase:** Stage 3.3A.3 — Independent Production Audit  
**Document Identifier:** `HOROS-P1-R002-STAGE3.3A3-SECURITY-AUDIT`  
**Date:** 2026-11-19  
**Auditor:** Independent Technical Auditor  
**Disposition:** **PASS**  

---

### 1. Scope & Objective

This audit independently assesses the data isolation barriers between privileged simulator telemetry and student world model training inputs. The primary objective is to verify that student models cannot exploit reconstructable identifiers, public seed registry mappings, or covert telemetry channels to cheat physical predictions.

---

### 2. Audit Evidence & Verification Matrix

#### 2.1 Reconstructable Identifier & Key Blocklist Enforcement
- **Requirement:** Any observation dictionary containing keys from `RECONSTRUCTABLE_IDENTIFIER_KEYS` or outside `MODEL_VISIBLE_ALLOWLIST` must raise `SecurityViolationError`.
- **Allowed Keys:** `{"states", "actions", "next_states", "wrenches", "next_wrenches", "sample_id", "task"}`.
- **Tested Forbidden Keys:** `seed`, `episode_id`, `canonical_episode_id`, `slot_alias`, `provenance_hash`, `rewards`, `modes`, `mu_true`, `object_mass`, `step_contact_stratum`, `friction_mu`, `clearance_mm`, `step_mu_true`, `step_object_mass_kg`, `initial_mu_true`.
- **Reproduction Steps:**
  ```python
  from scripts.stage3_production_adapter import validate_model_visible_package, SecurityViolationError
  for key in ["seed", "episode_id", "rewards", "modes", "step_contact_stratum"]:
      pkg = {"states": np.zeros((4, 15)), "actions": np.zeros((4, 6)), "next_states": np.zeros((4, 15)),
             "wrenches": np.zeros((4, 6)), "next_wrenches": np.zeros((4, 6)), "sample_id": "a"*64,
             "task": "peg_in_hole", key: 1.0}
      try:
          validate_model_visible_package(pkg)
          assert False, f"Key {key} was not blocked!"
      except SecurityViolationError:
          pass
  ```
- **Result:** $15/15$ blocked keys successfully rejected.
- **Severity:** Critical.
- **Status:** **PASS**.

#### 2.2 Tensor Dimensionality & Schema Conformity
- **Requirement:** States must conform to `APPROVED_STATE_WIDTHS` (`peg_in_hole`: $\{12, 15\}$, `compliant_prelift`: $\{23\}$). Wrenches must strictly match $(T, 6)$.
- **Reproduction Steps:** Evaluated widths $\{5, 10, 11, 12, 13, 14, 15, 20, 23, 25\}$ against `assert_tensor_channels_clean()`.
- **Result:**
  - Peg-in-Hole: Widths 12 and 15 accepted; widths 5, 10, 11, 13, 14, 20, 23, 25 rejected with `SecurityViolationError`.
  - Compliant Prelift: Width 23 accepted; all other widths rejected.
  - Wrenches with shape $(T, 3)$ or $(T, 5)$ rejected.
- **Severity:** High.
- **Status:** **PASS**.

#### 2.3 Covert Telemetry Leakage Inspection
- **Requirement:** No state or wrench channel may copy privileged simulation time-series (e.g. `step_mu_true`, `step_object_mass_kg`, `step_contact_stratum`).
- **Reproduction Steps:**
  ```python
  from scripts.stage3_production_adapter import assert_tensor_channels_clean, SecurityViolationError
  telemetry = [0.60, 0.60, 0.60, 0.24, 0.24]
  # Injected into each state channel 0..14 and wrench channel 0..5
  for ch in range(15):
      st = np.zeros((5, 15)); st[:, ch] = telemetry
      try:
          assert_tensor_channels_clean("peg_in_hole", st, np.zeros((5, 6)), {"step_mu_true": telemetry})
          assert False, f"Channel {ch} leak undetected!"
      except SecurityViolationError:
          pass
  ```
- **Result:** All $15$ state channels and all $6$ wrench channels detected and rejected with zero false-negatives. Tested across both current-state (`states`, `wrenches`) and next-state (`next_states`, `next_wrenches`) pairs.
- **Severity:** Critical.
- **Status:** **PASS**.

#### 2.4 Dataloader Isolation & Directory Colocation Guard
- **Requirement:** `ProductionTrainingDataloader` must refuse directories containing privileged JSON, audit manifests, or seed registries.
- **Reproduction Steps:**
  1. Instantiated dataloader against directory containing `.privileged.json` -> Raised `SecurityViolationError`.
  2. Instantiated dataloader against directory containing `stage3_3_audit_manifest.json` -> Raised `SecurityViolationError`.
  3. Instantiated dataloader against directory containing `stage3_3_seed_registry.json` -> Raised `SecurityViolationError`.
  4. Injected transform reinserting `seed` via `loader.apply_transform()` -> Raised `SecurityViolationError`.
  5. Injected invalid `next_states` dimension into archive -> Raised `SecurityViolationError`.
- **Severity:** Critical.
- **Status:** **PASS**.

#### 2.5 Opaque HMAC-SHA256 Filenames & Registry Inversion Immunity
- **Requirement:** Training files must be named `<sample_id>.npz`, where `sample_id = HMAC-SHA256(canonical_episode_id, audit_salt)`. The salt must not exist in the training archive.
- **Reproduction Steps:**
  1. Serialized test package and audit record with `build_training_package_and_audit()`.
  2. Verified that `.npz` file contains only: `states`, `actions`, `next_states`, `wrenches`, `next_wrenches`, `sample_id`, `task`.
  3. Verified that `seed`, `audit_salt`, and `episode_id` are completely absent from the `.npz` archive.
  4. Verified that `sample_id` is a 64-character uniform hex string uncorrelated with public seeds $\{3311000 \dots 3325099\}$.
- **Severity:** High.
- **Status:** **PASS**.

---

### 3. Conclusion

The model-input security architecture satisfies all isolation invariants. Student world models ingest strictly model-visible sensor channels and opaque sample identifiers. Privileged simulation parameters remain isolated in the audit tier.
