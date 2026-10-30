# HOROS First-Party Model Program: SHARED
## 03 — Common Dataset Standards, Data Contracts & Registry

### 1. Unified Multimodal Physical Data Specification (HOROS-Physical-Spec-v1)
All physical trajectory and field datasets in HOROS adhere to a standardized hierarchical HDF5 / Parquet serialization specification:

```
HOROS_DATASET_ROOT/
├── manifest.json                  # Cryptographic SHA-256 hashes, license, provenance
├── metadata/
│   ├── coordinate_frame.yaml      # Coordinate convention (Right-handed, Z-up, ENU)
│   ├── units.yaml                 # SI standard (meters, seconds, Pascals, Newtons)
│   └── sensor_calibration.json    # Camera intrinsics, extrinsics, IMU noise densities
└── episodes/
    ├── episode_000000.parquet     # Compressed observation/action/field tensors
    └── episode_000001.parquet
```

### 2. Data Governance, Provenance & Licensing Invariants
1. **Lineage Invariant:** Every dataset record includes the generating platform (physical hardware serial number, software simulation engine commit hash, solver parameters).
2. **License Compliance Audit:**
   * Datasets containing open-source data (e.g. OXE, DROID, OpenFOAM public sweeps) maintain explicit upstream attribution.
   * Strict boundary between commercial proprietary test telemetry and permissive open research datasets.
3. **Automated Quality Filtering Pipeline:**
   * Automated rejection of trajectories with sensor NaN values, encoder packet drops, or unphysical acceleration spikes ($> 50g$).
   * In CFD fields, automated validation of mass balance residuals before ingestion into training buffers.
