# HOROS PROBE-1 — Research-002
## Stage 3.3A.3 Reproducibility & Frozen Infrastructure Report

**Program:** HOROS PROBE-1 — Autonomous Robotic Manipulation World Model  
**Phase:** Stage 3.3A.3 — Independent Production Audit  
**Document Identifier:** `HOROS-P1-R002-STAGE3.3A3-REPRODUCIBILITY-REPORT`  
**Date:** 2026-11-19  
**Auditor:** Independent Technical Auditor  
**Disposition:** **PASS**  

---

### 1. Scope & Objective

This report provides empirical evidence of deterministic reproducibility across the canonical repository (`Sunilkumarchavhan9/horoslab`) and public mirror (`Sunilkumarchavhan9/horos-probe-1`). The audit independently re-executed the test suites, recomputed cryptographic digests of the certified pilot trajectories, and inspected frozen Stage 3.0 files.

---

### 2. Test Suite Reproduction Evidence

The test suite was executed independently on both repositories from the authoritative baseline commits:

| Repository | Baseline Commit | Total Tests | Passed | Failed | Runtime | Date/Time Verified |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Canonical (`horoslab`)** | `a8b5eae5` | 300 | 300 | 0 | $32.83\text{ s}$ | 2026-11-19 00:06 UTC+5:30 |
| **Mirror (`horos-probe-1`)** | `c9a552e` | 300 | 300 | 0 | $34.84\text{ s}$ | 2026-11-19 00:17 UTC+5:30 |
| **Stage 3.3 Contract Suite (`P41` + `P42`)** | `a8b5eae5` | 28 | 28 | 0 | $2.14\text{ s}$ | 2026-11-19 00:05 UTC+5:30 |

*Distinction from prior reports:* Prior Stage 3.3A.2 reports reported 298 passing tests under commits `84f1eaeb` and `59d3aba`. The current independent run establishes that 300/300 tests pass under commits `a8b5eae5` and `c9a552e`, reflecting the addition of `test_jamming_label_with_depth_misalignment_is_rejected` and `test_dataloader_validates_next_states_pair`.

---

### 3. Certified Pilot Trajectory Preservation Audit

The 40 certified pilot trajectories generated in Stage 3.1 and certified in Stage 3.2.2 were independently re-hashed and compared against the authoritative manifest `experiments/stage3_preflight/pilot/accepted_manifest.json`:

- **Total Registered Pilot Episodes:** 40
- **Observation Files Checked (`.npz`):** 40
- **Privileged Files Checked (`.privileged.json`):** 40
- **Bitwise Hash Matches:**
  - Observation NPZ files: $40/40$ ($100.0\%$) matched `observation_sha256`.
  - Privileged JSON files: $40/40$ ($100.0\%$) matched `privileged_sha256`.
- **Digest Mismatches:** **0**
- **Regenerations / Overwrites:** **0** (Invariant preserved).

---

### 4. Frozen Stage 3.0 Infrastructure Audit

The auditor performed cryptographic tree comparisons and Git diff inspections against the Stage 3.0 freeze commits (`af22f63` on canonical, `e9e2616` on mirror):

```bash
git diff af22f63 HEAD -- research/PROBE-1/Research-002/src/teaching \
                         research/PROBE-1/Research-002/src/contact_modes \
                         research/PROBE-1/Research-002/src/environment \
                         research/PROBE-1/Research-002/src/safety
```

- **Output:** Empty string (Zero lines modified).
- **Inspected Subsystems:**
  1. `src/teaching/`: `factory.py`, `inference.py`, `validator.py` (Unmodified).
  2. `src/contact_modes/`: `contact_mode_definitions.py` (Unmodified, 7 classes frozen).
  3. `src/environment/`: `peg_in_hole_env.py`, `compliant_prelift_env.py` (Unmodified).
  4. `src/safety/`: `geometry_cbf_safety_filter.py`, `pcbf_safety_filter.py`, `pcbf_tuned_filter.py` (Unmodified).
  5. **Baselines B1–B4:** Unmodified.
  6. **Control Barrier Function (CBF v1.0):** Unmodified.

---

### 5. Deterministic Scenario Replay Verification

Using `verify_deterministic_reproducibility()`, all six task and stratum configurations were independently replayed across two independent factory instances:

| Task | Stratum | Scenario Seed | Initial Prov. Hash | Replayed Prov. Hash | Parity |
| :--- | :--- | :---: | :---: | :---: | :---: |
| Compliant Prelift | Nominal | 3311000 | `23cf1007...` | `23cf1007...` | **MATCH** |
| Compliant Prelift | Probe | 3312000 | `3690d200...` | `3690d200...` | **MATCH** |
| Compliant Prelift | Nonstationary | 3313000 | `bbd4eb07...` | `bbd4eb07...` | **MATCH** |
| Peg-in-Hole | Nominal | 3321000 | `764c679a...` | `764c679a...` | **MATCH** |
| Peg-in-Hole | Impact | 3324000 | `7d7e48d3...` | `7d7e48d3...` | **MATCH** |
| Peg-in-Hole | Wedging | 3325000 | `ebcf773c...` | `ebcf773c...` | **MATCH** |

All replayed trajectories produced mathematically identical 64-character SHA-256 provenance digests under analytical Python/NumPy execution.
