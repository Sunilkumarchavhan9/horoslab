# Phase 3.7.2 Reproducibility, Data Integrity & Leakage Audit

**Execution Status During Freeze:** `training_permitted = False`, `immutable_sha256_mismatches = 0`  
**Frozen Candidate Config SHA-256:** `1528f7ee70126a4b754fd2f9ff64e2ab12e3f01ff8a03230c04fead68cbbf327`  
**Phase 3.7.2 Manifest SHA-256:** `3fbd26f9c428649b1a8485fa43bab6476b3a603f6e5477b8992e65461b94e700`  
**Phase 3.7.2 Dataset Manifest SHA-256:** `c6fd3f60f982fc6ab08bb0e232b503a404dd47bd4ca6e78b89f0f635a80ba337`

## 1. Seed & Split Separation Audit

- Historical maximum seed across Phases 2.6–3.6: `8849` (`<= 8849`)
- Phase 3.7.2 seed floor: `9000` (`>= 9000`)
- Historical overlap count: `0`
- Calibration (`9000..9179`, `180` ep) vs Validation (`9200..9359`, `160` ep) overlap count: `0`

## 2. Dataset SHA-256 Integrity (Verified Before & After Execution)

| Split | SHA-256 |
| --- | --- |
| `p37_2_calib_task2_id` | `ebbbf97c9276e87daea92ba94882f8bdb699f82930a19f843fe869a2b990f25b` |
| `p37_2_calib_task2_ood` | `14ac53c05d614f7a240ab54f8cea6da7ff7b7d0485a9abd0a559c6200c392e30` |
| `p37_2_calib_pih` | `ebd00c347fea1231a15da48c9d3969038f24b1f68699a304101fee9483e51afa` |
| `p37_2_val_task2_id` | `eb3b7c6ab0fb902d14b9ca598e1cfc5c0d068ef7e4dbd5a8415c085aa7af9c3a` |
| `p37_2_val_task2_ood` | `ef1ec9bd73e59d99fa35fb34b3d0b29ecc228e6200389dbd6483ffc44c58bc53` |
| `p37_2_val_pih` | `ba3781798376f0da38cb2ee773a3aa71ff983f4166f1eba4efdd57ab258a9598` |

## 3. Anti-Leakage & Frozen-Boundary Compliance

- `B1–B4` Phase 3.4 world-model checkpoints: **unchanged** (`0` gradient steps on world models; SHA-256 parity verified).
- Phase 3.4 `B4` conformal JSON files: **unchanged** (`C5` computed in-memory only).
- `GeometryAwareCBFSafetyFilter v1.0`: **unchanged** (`0` planner or safety filter edits).
- Privileged simulator state (`mu_true`, `object_mass`, `clearance`, ground-truth `ContactMode`): **excluded** from all inference feature extractors; true `ContactMode` and OOD labels used exclusively for post-hoc U1–U5 evaluation.
