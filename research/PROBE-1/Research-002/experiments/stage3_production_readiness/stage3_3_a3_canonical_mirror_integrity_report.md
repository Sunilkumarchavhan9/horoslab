# HOROS PROBE-1 — Research-002
## Stage 3.3A.3 Canonical / Mirror Integrity & Parity Report

**Program:** HOROS PROBE-1 — Autonomous Robotic Manipulation World Model  
**Phase:** Stage 3.3A.3 — Independent Production Audit  
**Document Identifier:** `HOROS-P1-R002-STAGE3.3A3-CANONICAL-MIRROR-INTEGRITY-REPORT`  
**Date:** 2026-11-19  
**Auditor:** Independent Technical Auditor  
**Disposition:** **PASS** (100% Bitwise Blob Parity Established)  

---

### 1. Scope & Objective

This report documents the multi-repository parity and branch synchronization between the canonical research repository (`Sunilkumarchavhan9/horoslab`) and the public mirror repository (`Sunilkumarchavhan9/horos-probe-1`). The audit establishes authoritative commit baselines, verifies clean working trees, and confirms bitwise Git blob parity across all Stage 3.3 deliverables.

---

### 2. Repository Commit Baseline & Discrepancy Resolution

| Repository | Role | Branch | Authoritative Commit SHA | Verification Method | Remote Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`horoslab`** | Canonical | `feat/probe1-stage33-production-readiness` | `a8b5eae5ccbb357c8a514b1065c62f175e3807ae` | `git rev-parse HEAD` & `git ls-remote` | Synced with `origin` |
| **`horos-probe-1`** | Public Mirror | `feat/probe1-stage33-production-readiness` | `c9a552e86bee552520c1fa7ec883f89d45ee9f25` | `git rev-parse HEAD` & `git ls-remote` | Synced with `origin` |

#### Resolution of Reported Discrepancy
- Initial Stage 3.3A.2 commits were reported as `84f1eaeb` (canonical) and `59d3aba` (mirror) with 298 passing tests.
- Following CodeRabbit automated PR review, remediations were committed in `a8b5eae5` and `c9a552e` to harden dataloader next-state checks, wedging state-depth alignment, and add 2 regression tests (300 total tests).
- Inspection of `git ls-remote origin feat/probe1-stage33-production-readiness` confirmed that the remote branches on GitHub point to `a8b5eae5` and `c9a552e`.
- These commits represent the authoritative, active baseline.

---

### 3. Working Tree Cleanliness & Untracked Files Audit

An inspection via `git status --porcelain` was conducted on both repositories:

1. **Canonical Repository (`c:\projects\MemoryOS`):**
   - Research Tree (`research/PROBE-1/Research-002/`): **100% clean**, zero unstaged changes.
   - Out-of-Scope Files Preserved (Untracked / Uncommitted):
     - `memoryos-frontend/components/horos/views/reality-view.tsx` (Uncommitted frontend prototype).
     - `.agents/rules/git-push.md` (Local IDE instruction rule).
     - `.vscode/settings.json` (Local editor path configuration).
     - `pyrightconfig.json` (Local language server path configuration).
2. **Mirror Repository (`C:\projects\horos-probe-1`):**
   - Research Tree (`Research-002/`): **100% clean**, zero unstaged changes.
   - Out-of-Scope Files Preserved (Untracked):
     - `pyrightconfig.json` (Local language server path configuration).

---

### 4. Bitwise Git Blob Parity Table

All files were hashed independently on both filesystems using `git hash-object`. Note that the canonical repository stores research assets under `research/PROBE-1/Research-002/`, while the mirror stores them at `Research-002/`. The hashes represent file content bit-streams:

| Git Blob SHA-1 | Canonical File Path | Mirror File Path | Parity |
| :--- | :--- | :--- | :---: |
| `7d02dceda47366cff2d59a6ba6fdbc233358000e` | `scripts/stage3_production_adapter.py` | `scripts/stage3_production_adapter.py` | **MATCH** |
| `522462e353ea8a2b58c966064786168ca9a7126f` | `tests/test_p41_stage3_production_contract.py` | `tests/test_p41_stage3_production_contract.py` | **MATCH** |
| `a5b547d8ef9e21574305d7b75faed6e07b8902d4` | `tests/test_p42_stage3_3a2_production_gate.py` | `tests/test_p42_stage3_3a2_production_gate.py` | **MATCH** |
| `131e659e38cb93e09d34913c06189f042314cbf3` | `experiments/.../stage3_3_a1_completion_report.md` | `experiments/.../stage3_3_a1_completion_report.md` | **MATCH** |
| `256a8357f5e6608f7467112e33bd6e0b156330b1` | `experiments/.../stage3_3_acceptance_specification.md` | `experiments/.../stage3_3_acceptance_specification.md` | **MATCH** |
| `28bc063580f8fb2c5975330255410c045eb6231a` | `experiments/.../stage3_3_contact_ontology_clarification.md` | `experiments/.../stage3_3_contact_ontology_clarification.md` | **MATCH** |
| `0bc2d14d17491165cda0c79b1630cae3aa722985` | `experiments/.../stage3_3_authorization_checklist.md` | `experiments/.../stage3_3_authorization_checklist.md` | **MATCH** |
| `e5bccbaabeb8c0b0f3180dd48e56c0da63b86089` | `experiments/.../stage3_3_dataset_schema.md` | `experiments/.../stage3_3_dataset_schema.md` | **MATCH** |
| `0b8d2790ceb806411ae4216433701de2fb4c59c3` | `experiments/.../stage3_3_production_generation_protocol.md` | `experiments/.../stage3_3_production_generation_protocol.md` | **MATCH** |
| `a2b5d21874fef44f643471558a04b301f50fc976` | `experiments/.../stage3_3_reproducibility_specification.md` | `experiments/.../stage3_3_reproducibility_specification.md` | **MATCH** |
| `58392b2fb9d8a2fc898cc940d1747d501cd5013f` | `experiments/.../stage3_3_storage_and_security_specification.md` | `experiments/.../stage3_3_storage_and_security_specification.md` | **MATCH** |
| `f46e638a8f648edcb132df3ade069b810983d87c` | `experiments/.../stage3_3_readiness_test_report.md` | `experiments/.../stage3_3_readiness_test_report.md` | **MATCH** |
| `bf477d3a5393667a1fb0381149a23eec7964fa0b` | `experiments/.../stage3_3_a2_completion_report.md` | `experiments/.../stage3_3_a2_completion_report.md` | **MATCH** |
| `61e0f4a566b5ea39a0c1dfd784e5b8692a409e0c` | `experiments/.../stage3_3_a2_canonical_mirror_parity_report.md` | `experiments/.../stage3_3_a2_canonical_mirror_parity_report.md` | **MATCH** |
| `35fc2e35d8b514e147af41227937942c1b8b4a67` | `.github/workflows/research-002-tests.yml` | `.github/workflows/research-002-tests.yml` | **MATCH** |

**Parity Summary:**
- Total Files Evaluated: 15
- Bitwise Matches: 15 ($100.0\%$)
- Mismatches: **0**

---

### 5. Conclusion

Canonical and mirror repositories exhibit 100% bitwise parity across all production gate artifacts, CI configurations, and test suites. Both remotes are synchronized on branch `feat/probe1-stage33-production-readiness`.
