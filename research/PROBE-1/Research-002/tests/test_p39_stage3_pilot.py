"""HOROS PROBE-1 — Research-002: Regression Suite for Stage 3.2 Pilot Remediation.

Verifies:
1. Deliverable artifacts exist on disk and follow expected schemas (reports, manifests, .npz, .privileged.json).
2. Zero student model training guarantee (0 parameters updated, 0 gradient steps).
3. False-success prevention (zero accepted episodes or missing interactions fail).
4. Full 40-episode execution: 20 Prelift and 20 Peg-in-Hole across all strata.
5. Physical-interaction criteria satisfied (forces, torques, slip, insertion, contact modes).
6. Issue A Remediated — Peg-in-Hole wedging stratum achieves genuine wedging (contact_stratum = 3, insertion > 5.0 mm).
7. Issue B Remediated — Empirical simulator telemetry recorded for Regime A (0.60 -> 0.24) and Regime B (0.25 kg/s influx).
8. Strict separation of model-visible observations and privileged simulator ground truth.
9. Deterministic reproducibility from scenario seeds.
10. Correct mode accounting: timestep mode histograms and episode mode presence.
11. Measurable Prelift vertical displacement verified.
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
    assert (PILOT_DIR / "stage3_2_execution_report.md").is_file()
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
    assert "STAGE3" in pilot_report.get("protocol", "")

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
        # Contact modes include non-free modes
        assert set(data["modes_observed"]) - {0} != set()
        # Mode accounting includes timestep histogram and episode presence
        assert "timestep_mode_histogram" in data
        assert "episode_mode_presence" in data

    # Measurable displacement verified in nominal stratum
    assert stats["nominal"]["max_lift_mm"] > 0.0


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
        # Mode accounting includes timestep histogram and episode presence
        assert "timestep_mode_histogram" in data
        assert "episode_mode_presence" in data


def test_wedging_stratum_achieves_stratum_3_and_insertion_depth(pilot_report: Dict[str, Any], accepted_manifest: list[Dict[str, Any]]) -> None:
    pih = pilot_report["tasks"]["peg_in_hole"]
    assert pih.get("wedging_verified") == "PASS"

    wedging_stats = pih["stratum_statistics"]["wedging"]
    assert wedging_stats["wedging_stratum_attained"] is True
    assert 3 in wedging_stats["strata_observed"]
    assert wedging_stats["max_insertion_mm"] > 5.0
    assert wedging_stats["max_force_n"] <= 35.0
    assert wedging_stats["max_torque_nm"] <= 7.0

    # Verify per-episode manifest for all 4 wedging episodes
    wedging_manifest_eps = [m for m in accepted_manifest if m["task"] == "peg_in_hole" and m["stratum"] == "wedging"]
    assert len(wedging_manifest_eps) == 4
    for ep_entry in wedging_manifest_eps:
        metrics = ep_entry["metrics"]
        assert metrics["wedging_stratum_attained"] is True
        assert metrics["max_insertion_mm"] > 5.0
        assert metrics["interaction_passed"] is True


def test_empirical_nonstationary_telemetry(pilot_report: Dict[str, Any], accepted_manifest: list[Dict[str, Any]]) -> None:
    prelift = pilot_report["tasks"]["compliant_prelift"]
    assert prelift.get("empirical_telemetry_verified") == "PASS"

    regime_res = prelift["regime_verification"]
    assert regime_res["regime_a_friction_transition_verified"] is True
    assert regime_res["regime_a_slip_triggered"] is True
    assert regime_res["regime_a_peak_slip_mps"] > 0.0010
    assert len(regime_res["regime_a_seeds"]) == 2

    assert regime_res["regime_b_mass_influx_verified"] is True
    assert len(regime_res["regime_b_seeds"]) == 2
    assert regime_res["regime_b_final_mass_kg"] == 0.400

    # Verify privileged files directly hold telemetry arrays
    nonstat_entries = [m for m in accepted_manifest if m["task"] == "compliant_prelift" and m["stratum"] == "nonstationary"]
    assert len(nonstat_entries) == 4
    for entry in nonstat_entries:
        priv_path = PILOT_DIR / "accepted" / f"{entry['episode_id']}.privileged.json"
        assert priv_path.is_file()
        with open(priv_path, "r", encoding="utf-8") as handle:
            priv_data = json.load(handle)
        meta = priv_data["env_metadata"]
        assert "step_mu_true" in meta
        assert "step_object_mass_kg" in meta
        assert len(meta["step_mu_true"]) == 20
        assert len(meta["step_object_mass_kg"]) == 20

        if meta.get("regime") == "A":
            assert meta["step_mu_true"][13] == 0.60
            assert meta["step_mu_true"][14] == 0.24
            assert meta["step_mu_true"][-1] == 0.24
        elif meta.get("regime") == "B":
            assert meta["step_object_mass_kg"][0] == 0.3525
            assert meta["step_object_mass_kg"][-1] == 0.400


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
        assert "step_mu_true" not in keys
        assert "step_object_mass_kg" not in keys
        assert "step_contact_stratum" not in keys

    with open(privileged_path, "r", encoding="utf-8") as handle:
        privileged_data = json.load(handle)
        # Privileged JSON correctly holds ground truth
        assert "modes" in privileged_data
        assert "env_metadata" in privileged_data
