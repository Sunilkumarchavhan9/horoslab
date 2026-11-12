"""
HOROS PROBE-1 — Research-002: Prepare & Freeze Phase 3.7.2 Specification Artifacts

Generates fresh disjoint calibration (9000..9179) and validation (9200..9359) datasets,
freezes manifests/phase37_2_uncertainty_manifest.json, runs full immutability &
disjointness verification, and writes experiments/phase3_7_uncertainty_intelligence/phase37_2_readiness_report.json.

Does NOT execute any model training or candidate uncertainty evaluation.
"""

from __future__ import annotations

import json
import os
import sys
import time

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
R002_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
for p in (R002_ROOT, os.path.join(R002_ROOT, "src")):
    if p not in sys.path:
        sys.path.insert(0, p)

from src.integrated.phase34_pipeline import _sha256_file
from src.integrated.phase37_2_protocol import (
    PHASE37_2_READINESS_REL,
    PHASE37_2_SPEC_REL,
    build_phase37_2_manifest,
    generate_phase37_2_datasets,
    verify_phase37_2_readiness,
)
from src.integrated.statistical_analysis import to_json_serializable


def main() -> None:
    t0 = time.time()
    dataset_info = generate_phase37_2_datasets(R002_ROOT, horizon=50)
    manifest = build_phase37_2_manifest(R002_ROOT, dataset_info=dataset_info)
    readiness = verify_phase37_2_readiness(R002_ROOT)

    spec_path = os.path.join(R002_ROOT, PHASE37_2_SPEC_REL)
    readiness_report = {
        "program": "HOROS PROBE-1 — Research-002",
        "stage": "Phase 3.7.2 — Contact-Mode-Aware Uncertainty and Calibration (Design Freeze & Readiness)",
        "elapsed_s": round(time.time() - t0, 3),
        "specification_path": PHASE37_2_SPEC_REL.replace("\\", "/"),
        "specification_sha256": _sha256_file(spec_path) if os.path.exists(spec_path) else None,
        "readiness_checks": readiness,
        "dataset_splits_summary": {
            k: {
                "split_role": v["split_role"],
                "task": v["task"],
                "regime": v["regime"],
                "seed_range": v["seed_range"],
                "num_episodes": v["num_episodes"],
                "num_transitions": v["num_transitions"],
                "sub_stratum_counts": v["sub_stratum_counts"],
                "mode_histogram_named": v["mode_histogram_named"],
                "sha256": v["sha256"],
            }
            for k, v in dataset_info["dataset_manifest"]["splits"].items()
        },
        "manifest_sha256": manifest["manifest_sha256"],
    }

    report_path = os.path.join(R002_ROOT, PHASE37_2_READINESS_REL)
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(to_json_serializable(readiness_report), f, indent=2)

    print(json.dumps(to_json_serializable(readiness_report), indent=2))


if __name__ == "__main__":
    main()
