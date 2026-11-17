"""HOROS PROBE-1 — Research-002: Regression Suite for Stage 3.1 Pilot Execution.

Verifies:
1. Deliverable artifacts exist on disk and follow expected schemas.
2. Zero student model training guarantee (0 parameters updated, 0 gradient steps).
3. False-success prevention (zero accepted episodes or missing interactions fail).
4. Full 40-episode execution: 20 Prelift and 20 Peg-in-Hole across all strata.
5. Physical-interaction criteria satisfied (forces, torques, slip, insertion, contact modes).
6. Nonstationary OOD transitions verified (Regime A friction drop, Regime B mass influx).
7. Strict separation of model-visible observations and privileged simulator ground truth.
8. Deterministic reproducibility from scenario seeds.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

import numpy as np
import pytest

TESTS_DIR = Path(__file__).resolve().parent
R002_ROOT = TESTS_DIR.parent
PILOT_DIR = R002_ROOT / "experiments" / "stage3_preflight" / "pilot"


@pytest.fixture(scope="module")
def pilot_report() -> Dict[str, Any]:
    report_path = PILOT_DIR / "stage3_pilot_report.json"
    assert report_path.is_file(), f"Missing pilot report JSON at {report_path}"
    with open(report_path, "r", encoding="utf-8") as handle:
        return json.load(handle)


@pytest.fixture(scope="module")
def accepted_manifest() -> list[Dict[str, Any]]:
    manifest_path = PILOT_DIR / "accepted_manifest.json"
    assert manifest_path.is_file(), f"Missing accepted manifest JSON at {manifest_path}"
    with open(manifest_path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def test_pilot_deliverables_exist() -> None:
    assert (PILOT_DIR / "stage3_pilot_report.json").is_file()
    assert (PILOT_DIR / "stage3_1_execution_report.md").is_file()
    assert (PILOT_DIR / "accepted_manifest.json").is_file()
    assert (PILOT_DIR / "rejected_manifest.json").is_file()

    accepted_dir = PILOT_DIR / "accepted"
    assert accepted_dir.is_dir()
    npz_files = list(accepted_dir.glob("*.npz"))
    privileged_files = list(accepted_dir.glob("*.privileged.json"))
    assert len(npz_files) == 40
    assert len(privileged_files) == 40


def test_zero_training_guarantee(pilot_report: Dict[str, Any]) -> None:
    assert pilot_report.get("training_performed") is False
    assert pilot_report.get("parameters_trained") == 0


def test_pilot_execution_counts_and_all_criteria_passed(pilot_report: Dict[str, Any]) -> None:
    assert pilot_report.get("all_criteria_passed") is True
    assert pilot_report.get("protocol") == "HOROS-P1-R002-STAGE3.1-PILOT"

    prelift = pilot_report["tasks"]["compliant_prelift"]
    assert prelift["generated"] == 20
    assert prelift["accepted"] == 20
    assert prelift["rejected"] == 0
    assert prelift["finite"] is True
    assert prelift["reproduced"] is True
    assert prelift["physical_interaction_verified"] is True
    assert prelift["strata"] == {"nominal": 10, "probe": 6, "nonstationary": 4}

    pih = pilot_report["tasks"]["peg_in_hole"]
    assert pih["generated"] == 20
    assert pih["accepted"] == 20
    assert pih["rejected"] == 0
    assert pih["finite"] is True
    assert pih["reproduced"] is True
    assert pih["physical_interaction_verified"] is True
    assert pih["strata"] == {"nominal": 10, "impact": 6, "wedging": 4}


def test_prelift_physical_interaction_statistics(pilot_report: Dict[str, Any]) -> None:
    prelift = pilot_report["tasks"]["compliant_prelift"]
    stats = prelift["stratum_statistics"]

    for stratum in ("nominal", "probe", "nonstationary"):
        data = stats[stratum]
        # Contact attained: normal forces established
        assert data["max_total_fn_n"] >= 0.50
        assert data["max_fn_finger_n"] <= 20.0
        assert data["max_total_fn_n"] <= 20.0
        # Vertical shear force present
        assert data["max_fz_n"] >= 0.50
        assert data["max_fz_n"] <= 15.0
        # Contact modes include non-free modes (e.g. 2, 3, 4)
        assert set(data["modes_observed"]) - {0} != set()


def test_peg_in_hole_physical_interaction_statistics(pilot_report: Dict[str, Any]) -> None:
    pih = pilot_report["tasks"]["peg_in_hole"]
    stats = pih["stratum_statistics"]

    for stratum in ("nominal", "impact", "wedging"):
        data = stats[stratum]
        # Insertion into hole fixture achieved (z < 0)
        assert data["min_z_mm"] <= 0.0
        assert data["max_insertion_mm"] > 0.0
        # Force and torque within safety limits
        assert data["max_force_n"] > 0.0
        assert data["max_force_n"] <= 35.0
        assert data["max_torque_nm"] <= 7.0
        # Non-free contact modes observed
        assert set(data["modes_observed"]) - {0} != set()


def test_nonstationary_regimes_verified(pilot_report: Dict[str, Any]) -> None:
    regime_res = pilot_report["tasks"]["compliant_prelift"]["regime_verification"]
    assert regime_res["regime_a_slip_triggered"] is True
    assert regime_res["regime_a_peak_slip_mps"] > 0.0010
    assert len(regime_res["regime_a_seeds"]) == 2
    assert len(regime_res["regime_b_seeds"]) == 2
    assert regime_res["regime_b_final_mass_kg"] > 0.395


def test_privileged_data_separation(accepted_manifest: list[Dict[str, Any]]) -> None:
    assert len(accepted_manifest) == 40
    sample = accepted_manifest[0]
    npz_path = PILOT_DIR / "accepted" / f"{sample['episode_id']}.npz"
    privileged_path = PILOT_DIR / "accepted" / f"{sample['episode_id']}.privileged.json"

    assert npz_path.is_file()
    assert privileged_path.is_file()

    with np.load(npz_path, allow_pickle=False) as archive:
        keys = set(archive.files)
        # Model-visible archive must NEVER expose privileged simulator fields
        assert "modes" not in keys
        assert "mu_true" not in keys
        assert "initial_mu_true" not in keys
        assert "initial_mass_kg" not in keys
        assert "clearance_mm" not in keys

    with open(privileged_path, "r", encoding="utf-8") as handle:
        privileged_data = json.load(handle)
        # Privileged JSON correctly holds ground truth
        assert "modes" in privileged_data
        assert "env_metadata" in privileged_data
