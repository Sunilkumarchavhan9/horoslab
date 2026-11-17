"""
HOROS PROBE-1 — Research-002: Phase 3.4.1 Dataset Generation & Verification CLI

Generates and archives ONLY the Phase 3.4 dataset bundles and manifest (360 episodes):
- PegInHole:        M0_passive (1100-1159, 60 ep), M4_acmm (1100-1159, 60 ep), calibration (2100-2159, 60 ep)
- CompliantPreLift: M0_passive (1000-1059, 60 ep), M4_acmm (1000-1059, 60 ep), calibration (2000-2059, 60 ep)

Note: Does NOT launch B1/B2/B3 model training or B4 conformal calibration.
"""

from __future__ import annotations
import json
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
r002_root = os.path.abspath(os.path.join(current_dir, ".."))
repo_root = os.path.abspath(os.path.join(r002_root, "..", "..", ".."))
if r002_root not in sys.path:
    sys.path.insert(0, r002_root)
if os.path.join(r002_root, "src") not in sys.path:
    sys.path.insert(0, os.path.join(r002_root, "src"))

from src.integrated.phase34_pipeline import (
    PHASE34_DEFAULT_HORIZON,
    generate_phase34_datasets,
)


def main():
    dataset_dir = os.path.join(r002_root, "datasets", "phase3_4")
    manifest_path = os.path.join(r002_root, "manifests", "phase34_dataset_manifest.json")

    manifest = generate_phase34_datasets(
        dataset_dir=dataset_dir,
        manifest_path=manifest_path,
        horizon=PHASE34_DEFAULT_HORIZON,
        repo_root=repo_root,
    )

    print(f"Manifest written: {manifest_path}")
    print(f"Runtime: {manifest['runtime_environment']}")
    print(f"Cross-split intersections: {manifest['cross_split_intersections']}")
    for split_key, info in manifest["splits"].items():
        print(
            f"  {split_key}: {info['num_episodes']} ep, {info['num_transitions']} trans, "
            f"seeds={info['seed_range']}, modes={info['mode_histogram']}, "
            f"term={info['termination_reason_counts']}"
        )


if __name__ == "__main__":
    main()
