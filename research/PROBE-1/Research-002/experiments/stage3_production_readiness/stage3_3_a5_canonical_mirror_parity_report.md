# HOROS PROBE-1 — Research-002
## Stage 3.3A.5 Canonical / Mirror Parity Report

**Program:** HOROS PROBE-1 — Autonomous Robotic Manipulation World Model  
**Phase:** Stage 3.3A.5 — Final Production Readiness Sign-Off  
**Document Identifier:** `HOROS-P1-R002-STAGE3.3A5-CANONICAL-MIRROR-PARITY-REPORT`  
**Date:** 2026-11-19  
**Method:** `git hash-object` on the working tree file in each repository.  
**Result:** All production gate files match bit-for-bit. Mismatches: 0.

The mirror stores Research-002 at `Research-002/`. The canonical repository stores the same tree at `research/PROBE-1/Research-002/`. Hashes below are of file contents, not of the directory paths.

| Git Blob SHA-1 | Canonical File Path | Mirror File Path | Parity |
| :--- | :--- | :--- | :---: |
| `f062d15b4eed76c89ca0e3a53ca7d25eb8b98743` | `scripts/stage3_production_adapter.py` | `scripts/stage3_production_adapter.py` | **MATCH** |
| `0676fc252e3a9496d2ff90405d8839d7f46f8393` | `tests/test_p41_stage3_production_contract.py` | `tests/test_p41_stage3_production_contract.py` | **MATCH** |
| `ba08e7667442b18659e42f346dd9487e1fe31480` | `tests/test_p42_stage3_3a2_production_gate.py` | `tests/test_p42_stage3_3a2_production_gate.py` | **MATCH** |
| `821fb7b1e914e33d8e733ffdb81fba15df7c8f77` | `experiments/.../stage3_3_acceptance_specification.md` | `experiments/.../stage3_3_acceptance_specification.md` | **MATCH** |
| `649e3d9d0f288e206c430b539ef0f8e0901b49dd` | `experiments/.../stage3_3_contact_ontology_clarification.md` | `experiments/.../stage3_3_contact_ontology_clarification.md` | **MATCH** |
| `b25cf1cc7965e082b4e14a7b6f45a8849b1595bf` | `experiments/.../stage3_3_production_generation_protocol.md` | `experiments/.../stage3_3_production_generation_protocol.md` | **MATCH** |
| `33aa9e36f29b3649ca1d2ae91b3ef94125435bd7` | `experiments/.../stage3_3_dataset_schema.md` | `experiments/.../stage3_3_dataset_schema.md` | **MATCH** |
| `d7a47dcddcb6bdac7bd35c2eda802971020f555f` | `experiments/.../stage3_3_seed_registry.json` | `experiments/.../stage3_3_seed_registry.json` | **MATCH** |
| `f34d0d5af70b46684177a939daad3cca16a6684a` | `experiments/.../stage3_3_a5_ci_verification_report.md` | `experiments/.../stage3_3_a5_ci_verification_report.md` | **MATCH** |
| `5ea4b17b4204e399423fcc82668295bc62c05dd7` | `experiments/.../stage3_3_a5_coderabbit_resolution_report.md` | `experiments/.../stage3_3_a5_coderabbit_resolution_report.md` | **MATCH** |
| `fb02421cdfc685390265601dc4abf9be4c0067ac` | `experiments/.../stage3_3_a5_branch_protection_report.md` | `experiments/.../stage3_3_a5_branch_protection_report.md` | **MATCH** |
| `83f091b8239087bf5d5c5f64fb5dcbcd65536d6f` | `experiments/.../stage3_3_a5_seed_reconciliation_report.md` | `experiments/.../stage3_3_a5_seed_reconciliation_report.md` | **MATCH** |
| `74fc61c6959e5b6f0b81bea3c2b834efdcd7c08e` | `experiments/.../stage3_3_a5_final_integrity_and_signoff_report.md` | `experiments/.../stage3_3_a5_final_integrity_and_signoff_report.md` | **MATCH** |

This parity report is copied byte-for-byte to the mirror. Its own hash is verified across both repositories.
