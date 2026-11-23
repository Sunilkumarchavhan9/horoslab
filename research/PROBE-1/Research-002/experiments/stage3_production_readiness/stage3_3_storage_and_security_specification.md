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

Production dataset artifacts generated in Stage 3.3B shall reside in a dedicated, isolated directory tree under `experiments/stage3_production/`, strictly partitioned into separate training and audit tiers:

```
experiments/stage3_production/
├── training/                       # Model-visible training tier (student dataloaders read this)
│   ├── <sample_id_001>.npz         # Opaque HMAC-SHA256 filename; allowed observation tensors only
│   ├── <sample_id_002>.npz
│   └── ... (1,000 .npz files; ZERO privileged metadata, zero seeds, zero task names in filenames)
├── audit/                          # Privileged audit tier (isolated from training dataloaders)
│   ├── syn_compliant_prelift_..._seed3311000.privileged.json
│   ├── syn_compliant_prelift_..._seed3311000.audit.json
│   ├── ... (1,000 .privileged.json + 1,000 .audit.json files)
│   └── stage3_3_audit_manifest.json  # Full join mapping of sample_id -> canonical_id, seed & ground truth
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

A top-level key allowlist is not sufficient. The public seed registry maps `seed` and slot aliases such as `prod_peg_in_hole_wedging_099` to friction, mass, clearance and pose. Those identifiers must not enter the training archive.

#### 4.1 Model-visible training inputs

Legitimate model inputs are sensor and kinematic measurements:

| Tensor | Peg-in-hole channels | Compliant prelift channels | Privileged? |
| :--- | :--- | :--- | :--- |
| `states`, `next_states` | Frozen extractor is 15-D: position, velocity, orientation, sensor wrench. A 12-D kinematic projection is also accepted. | 23-D: fingertip positions, normal forces, slip velocities, workpiece position | No, if the width matches and no channel copies `step_mu_true`, `step_object_mass_kg`, or `step_contact_stratum` |
| `wrenches`, `next_wrenches` | 6-D force/torque sensor, N and N·m | 6-D resultant wrench | No |
| `actions` | Commanded motion | Commanded squeeze and lift | No |
| `sample_id` | Opaque HMAC-SHA256 hex | Opaque HMAC-SHA256 hex | No, if the audit salt is absent |
| `task` | Task name only | Task name only | No |

Not model inputs:

- `seed`, `episode_id`, `slot_alias`, `canonical_episode_id`, `provenance_hash` — reconstructable joins
- `rewards` — the frozen peg reward adds $+100$ for seated and $-50$ for jammed or safety violation
- `modes`, friction, mass, clearance, contact stratum, teacher suggestions

The audit manifest holds the sample-id-to-seed map, simulator ground truth, environment metadata and provenance. `ProductionTrainingDataloader` refuses a training directory that also contains that manifest, a privileged JSON file, or the seed registry. Caching and batch transforms are re-validated and cannot reinsert `seed`.

#### 4.2 Dataloader isolation

Training dataloaders read only the model-visible `.npz` archives. They do not open `.privileged.json` or the audit manifest. Phase 3.4 `load_phase34_dataset_bundle` is not the production loader: it expects modes and episode metadata and must not be pointed at production training archives.

---

### 5. Backup, Retention & Multi-Repository Mirroring

1. **Mirror Redundancy:**
   - Canonical repository (`horoslab`) and Public Mirror (`horos-probe-1`) maintain identical copies of the full dataset.
   - Dual-push guarantees off-site synchronization.
2. **Long-Term Retention:**
   - Dataset is permanently preserved as part of the immutable research record.
   - Stage 3.5 dataset freeze will tag the commit as `v3.5-dataset-freeze`.
