# HOROS PROBE-1 — Research-002
## Stage 3.3 Storage, Data Integrity & Security Specification

**Program:** HOROS PROBE-1 — Autonomous Robotic Manipulation World Model  
**Project:** Research-002: Model Teaching Infrastructure & World Model Pre-training  
**Document:** Storage, Data Integrity & Security Specification  
**Document Identifier:** `HOROS-P1-R002-STAGE3.3-STORAGE-SECURITY-SPEC`  
**Date:** 2026-11-17  
**Status:** **APPROVED SPECIFICATION**  

---

### 1. Storage Architecture & Directory Hierarchy

Production dataset artifacts generated in Stage 3.3B shall reside in a dedicated, isolated directory tree under `experiments/stage3_production/`.

```
experiments/stage3_production/
├── accepted/
│   ├── syn_compliant_prelift_stage3_pilot_controller_v1_seed3311000.npz
│   ├── syn_compliant_prelift_stage3_pilot_controller_v1_seed3311000.privileged.json
│   ├── ... (1,000 .npz files + 1,000 .privileged.json files)
│   └── syn_peg_in_hole_stage3_pilot_controller_v1_seed3325099.privileged.json
├── rejected/
│   ├── (Any candidate episodes rejected by validation or physical interaction checks)
│   └── syn_<task>_<model_id>_seed<seed>.privileged.json
├── accepted_manifest.json          # Master manifest of 1,000 accepted episodes with SHA-256
├── rejected_manifest.json          # Permanent audit record of any rejected attempts
├── stage3_3_production_report.json # Machine-readable execution scorecard
└── stage3_3_execution_report.md    # Human-readable scientific audit report
```

---

### 2. Storage Sizing & Capacity Budget

Empirical sizing based on the certified Stage 3.2.2 pilot confirms that the complete 1,000-episode production dataset requires minimal storage overhead, allowing direct version-controlled tracking in Git:

| Artifact Type | Count | Average Size | Total Size Budget | Storage Mode |
| :--- | :---: | :---: | :---: | :--- |
| **Observation Archives (`.npz`)** | 1,000 | $4.2\text{ KB}$ | $\approx 4.2\text{ MB}$ | Model-visible training input |
| **Privileged Records (`.privileged.json`)** | 1,000 | $5.5\text{ KB}$ | $\approx 5.5\text{ MB}$ | Privileged ground-truth audit |
| **Accepted Manifest (`.json`)** | 1 | $750\text{ KB}$ | $\approx 0.75\text{ MB}$ | Complete provenance registry |
| **Rejected Manifest (`.json`)** | 1 | $< 50\text{ KB}$ | $\approx 0.05\text{ MB}$ | Rejection audit trail |
| **Execution Reports (`.json`, `.md`)** | 2 | $30\text{ KB}$ | $\approx 0.06\text{ MB}$ | Summary and audit scorecards |
| **Total Production Dataset Footprint** | **2,004 files** | — | **$\approx 10.6\text{ MB}$** | **Git-tracked repository asset** |

---

### 3. Data Integrity & Cryptographic Auditing

#### 3.1 Checksum Registry (SHA-256)
Every generated file is hashed immediately upon creation using standard SHA-256. These digests are committed directly to `accepted_manifest.json`:
- `observation_sha256`: Hexadecimal SHA-256 hash of the `.npz` file.
- `privileged_sha256`: Hexadecimal SHA-256 hash of the `.privileged.json` file.
- `provenance_hash`: Mathematical SHA-256 hash computed over internal trajectory tensors.

#### 3.2 Immutability & Write-Once Policy
- Production artifacts are **Write-Once, Read-Many (WORM)**.
- Once generated and certified, individual episode files must NEVER be overwritten, appended to, or modified.
- CI pipeline enforcements verify that Git commits do not alter previously certified SHA-256 digests.

---

### 4. Security & Data Separation Enforcement

To guarantee zero contamination of student world models:
1. **Dataloader Isolation:**
   - Training dataloaders must point exclusively to `experiments/stage3_production/accepted/*.npz`.
   - Access to `.privileged.json` files is restricted to validation evaluators and audit scripts.
2. **Zero-Leakage Assertion at Ingestion:**
   - Every training batch loader must run a pre-ingestion check ensuring that no keys in `FORBIDDEN_PRIVILEGED_KEYS` exist in memory:
   ```python
   def assert_no_privileged_leak(batch_dict: dict) -> None:
       for key in batch_dict:
           assert key not in FORBIDDEN_PRIVILEGED_KEYS, f"Security Violation: Leaked {key}"
   ```

---

### 5. Backup, Retention & Multi-Repository Mirroring

1. **Mirror Redundancy:**
   - Canonical repository (`horoslab`) and Public Mirror (`horos-probe-1`) maintain identical copies of the full dataset.
   - Dual-push guarantees off-site synchronization.
2. **Long-Term Retention:**
   - Dataset is permanently preserved as part of the immutable research record.
   - Stage 3.5 dataset freeze will tag the commit as `v3.5-dataset-freeze`.
