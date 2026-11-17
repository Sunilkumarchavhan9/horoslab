"""
Phase 3.7.2 Readiness & Governance Tests:
Verifies frozen Phase 3.7.2 specification, fresh disjoint seed pools (>=9000),
dataset SHA-256 integrity, U1-U5 pre-registered acceptance gates, zero training flags,
and 100% SHA-256 immutability of Phase 3.4-3.7.1 checkpoints/archives & Safety v1.0.
"""

from __future__ import annotations

import hashlib
import json
import os
import sys

import numpy as np

R002_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
for p in (R002_ROOT, os.path.join(R002_ROOT, "src")):
    if p not in sys.path:
        sys.path.insert(0, p)

from src.integrated.calibration_runner import PHASE3_SEED_POOLS
from src.integrated.peginhole_phase352_controller import PILOT_SEEDS
from src.integrated.phase34_pipeline import _sha256_file
from src.integrated.phase36_validation_protocol import PHASE36_SEED_BLOCKS
from src.integrated.phase37_2_protocol import (
    HISTORICAL_MAX_SEED,
    PHASE37_2_DATASET_MANIFEST_REL,
    PHASE37_2_MANIFEST_REL,
    PHASE37_2_READINESS_REL,
    PHASE37_2_SEED_FLOOR,
    PHASE37_2_SEED_POOLS,
    PHASE37_2_SPEC_REL,
    verify_phase37_2_readiness,
    verify_phase37_2_seed_disjointness,
)


def test_phase37_2_seed_pools_strictly_disjoint_and_above_historical():
    audit = verify_phase37_2_seed_disjointness()
    assert audit["disjoint_verified"] == 1
    assert audit["historical_overlap_count"] == 0
    assert audit["calib_val_overlap_count"] == 0
    assert audit["below_floor_count"] == 0
    assert audit["total_calib_episodes"] == 180
    assert audit["total_val_episodes"] == 160
    assert audit["total_phase37_2_episodes"] == 340

    all_historical = set(range(0, HISTORICAL_MAX_SEED + 1))
    for v in PHASE3_SEED_POOLS.values():
        all_historical.update(v)
    all_historical.update(PILOT_SEEDS)
    for v in PHASE36_SEED_BLOCKS.values():
        all_historical.update(v)

    calib_set = set()
    val_set = set()
    for pool_name, seeds in PHASE37_2_SEED_POOLS.items():
        assert all(s >= PHASE37_2_SEED_FLOOR for s in seeds)
        assert all(s not in all_historical for s in seeds)
        if "_calib_" in pool_name:
            calib_set.update(seeds)
        else:
            val_set.update(seeds)
    assert calib_set.isdisjoint(val_set)


def test_phase37_2_manifest_frozen_and_workstreams_gates_complete():
    manifest_path = os.path.join(R002_ROOT, PHASE37_2_MANIFEST_REL)
    assert os.path.exists(manifest_path)
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    assert manifest["execution_status"] == "DESIGN_FROZEN_AWAITING_EXECUTION_AUTHORIZATION"
    assert not bool(manifest["training_permitted"])
    assert not bool(manifest["candidate_evaluation_executed"])

    recorded_sha = manifest["manifest_sha256"]
    body = {k: v for k, v in manifest.items() if k != "manifest_sha256"}
    recomputed = hashlib.sha256(json.dumps(body, sort_keys=True).encode("utf-8")).hexdigest()
    assert recorded_sha == recomputed

    track_ids = [w["track_id"] for w in manifest["workstreams"]]
    assert track_ids == ["3.7.2-A", "3.7.2-B", "3.7.2-C", "3.7.2-D", "3.7.2-E"]
    assert all(not bool(w["training_permitted"]) for w in manifest["workstreams"])

    gates = manifest["acceptance_gates"]
    assert set(gates.keys()) == {
        "U1_frozen_baseline_parity",
        "U2_ood_discrimination_improvement",
        "U3_conformal_coverage_and_risk_coverage",
        "U4_temporal_inference_and_diversity",
        "U5_seed_disjointness_and_artifact_immutability",
    }
    u1_ref = gates["U1_frozen_baseline_parity"]["frozen_reference"]
    assert u1_ref["M4_acmm_B3_transition_auroc_total_std"] == 0.4169
    assert u1_ref["M4_acmm_B3_transition_auroc_epistemic_std"] == 0.4627
    assert u1_ref["M4_acmm_B3_ood_lowmu_auroc_total_std"] == 0.3347
    assert u1_ref["M4_acmm_B3_ood_lowmu_auroc_epistemic_std"] == 0.4450
    assert gates["U2_ood_discrimination_improvement"]["thresholds"]["task2_overall_transition_auroc_min"] == 0.75
    assert gates["U3_conformal_coverage_and_risk_coverage"]["thresholds"]["ood_episode_coverage_min"] == 0.85


def test_phase37_2_datasets_npz_loadable_and_sha256_verified():
    ds_man_path = os.path.join(R002_ROOT, PHASE37_2_DATASET_MANIFEST_REL)
    assert os.path.exists(ds_man_path)
    with open(ds_man_path, "r", encoding="utf-8") as f:
        ds_man = json.load(f)

    expected_pools = set(PHASE37_2_SEED_POOLS.keys())
    assert set(ds_man["splits"].keys()) == expected_pools
    assert len(ds_man["episode_manifest"]) == 340

    for pool_name, split_meta in ds_man["splits"].items():
        npz_path = os.path.join(R002_ROOT, split_meta["relative_path"])
        assert os.path.exists(npz_path)
        assert _sha256_file(npz_path) == split_meta["sha256"]

        with np.load(npz_path, allow_pickle=False) as data:
            seeds = data["episode_seeds"].tolist()
            assert seeds == PHASE37_2_SEED_POOLS[pool_name]
            n_ep = len(seeds)
            n_tr = int(np.sum(data["episode_lengths"]))
            assert n_ep == split_meta["num_episodes"]
            assert n_tr == split_meta["num_transitions"]
            assert data["states"].shape[0] == n_tr
            assert data["next_states"].shape == data["states"].shape
            assert data["actions"].shape[0] == n_tr
            assert data["modes"].shape[0] == n_tr
            assert data["wrenches"].shape[0] == n_tr
            ep_meta_list = json.loads(str(data["episode_metadata_json"][0]))
            assert len(ep_meta_list) == n_ep


def test_phase37_2_upstream_immutability_and_readiness_report():
    readiness = verify_phase37_2_readiness(R002_ROOT)
    assert readiness["status"] == "PHASE_3_7_2_READY_DESIGN_FROZEN"
    assert readiness["immutable_sha256_mismatches"] == 0
    assert bool(readiness["specification_present"]) is True
    assert not bool(readiness["training_permitted"])
    assert not bool(readiness["candidate_evaluation_executed"])

    spec_path = os.path.join(R002_ROOT, PHASE37_2_SPEC_REL)
    report_path = os.path.join(R002_ROOT, PHASE37_2_READINESS_REL)
    assert os.path.exists(spec_path)
    assert os.path.exists(report_path)
    with open(report_path, "r", encoding="utf-8") as f:
        report = json.load(f)
    assert report["specification_sha256"] == _sha256_file(spec_path)
    assert report["manifest_sha256"] == readiness["manifest_sha256"]
