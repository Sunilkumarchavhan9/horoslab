"""HOROS PROBE-1 — Research-002: Regression Suite for the Stage 3.2.2 pilot.

Verifies the saved 40-episode pilot, the seven-class ContactMode ontology, and the
Regime A friction-to-slip timing. Simulator contact stratum 3 (wedging) stays a
separate label from classifier mode 3 (sliding).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Dict

import numpy as np
import pytest

R002_SRC = Path(__file__).resolve().parents[1] / "src"
if str(R002_SRC) not in sys.path:
    sys.path.insert(0, str(R002_SRC))

from contact_modes.contact_mode_definitions import ContactMode, MODE_NAMES, NUM_MODES  # noqa: E402

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
    assert pih.get("wedging_aligned_verified") == "PASS"

    wedging_stats = pih["stratum_statistics"]["wedging"]
    assert wedging_stats["wedging_stratum_attained"] is True
    assert 3 in wedging_stats["strata_observed"]
    assert wedging_stats["max_insertion_mm"] > 5.0
    assert wedging_stats["max_force_n"] <= 35.0
    assert wedging_stats["max_torque_nm"] <= 7.0
    assert wedging_stats["wedging_aligned_count"] == 4

    # Direct artifact-level verification for all 4 wedging episodes
    wedging_manifest_eps = [m for m in accepted_manifest if m["task"] == "peg_in_hole" and m["stratum"] == "wedging"]
    assert len(wedging_manifest_eps) == 4
    for ep_entry in wedging_manifest_eps:
        metrics = ep_entry["metrics"]
        assert metrics["wedging_stratum_attained"] is True
        assert metrics["max_insertion_mm"] > 5.0
        assert metrics["interaction_passed"] is True
        assert len(metrics["wedging_aligned_steps"]) > 0

        # Load privileged file and observation file directly from disk
        priv_path = PILOT_DIR / "accepted" / f"{ep_entry['episode_id']}.privileged.json"
        npz_path = PILOT_DIR / "accepted" / f"{ep_entry['episode_id']}.npz"
        assert priv_path.is_file()
        assert npz_path.is_file()

        with open(priv_path, "r", encoding="utf-8") as handle:
            priv_data = json.load(handle)
        with np.load(npz_path, allow_pickle=False) as npz_data:
            next_states = npz_data["next_states"]

        meta = priv_data["env_metadata"]
        strata = meta["step_contact_stratum"]
        telem_depths = meta["step_insertion_depth_mm"]

        for t in metrics["wedging_aligned_steps"]:
            # 1. Authoritative simulator contact stratum 3
            assert strata[t] == 3
            # 2. Simulator telemetry insertion depth > 5.0 mm
            assert telem_depths[t] > 5.0
            # 3. Model-visible post-action state insertion depth > 5.0 mm
            state_depth = float(max(0.0, -next_states[t, 2]))
            assert state_depth > 5.0
            # 4. Strict physical consistency between telemetry and state array
            assert abs(telem_depths[t] - state_depth) < 1e-3


def test_prelift_event_specific_acceptance(pilot_report: Dict[str, Any], accepted_manifest: list[Dict[str, Any]]) -> None:
    prelift = pilot_report["tasks"]["compliant_prelift"]
    assert prelift["physical_interaction_verified"] is True

    prelift_eps = [m for m in accepted_manifest if m["task"] == "compliant_prelift"]
    assert len(prelift_eps) == 20

    for ep_entry in prelift_eps:
        metrics = ep_entry["metrics"]
        stratum = ep_entry["stratum"]
        assert metrics["interaction_passed"] is True
        assert metrics["event_specific_passed"] is True
        assert metrics["max_fn_finger_n"] <= 20.0
        assert metrics["max_total_fn_n"] <= 20.0
        assert metrics["max_fz_shear_n"] <= 15.0

        if stratum == "nominal":
            # Nominal: positive object lift off table above numerical tolerance (z > 0.001 mm)
            assert metrics["event_type"] == "nominal_positive_lift"
            assert metrics["max_lift_mm"] > 0.001
            assert 0.002 <= metrics["max_lift_mm"] <= 0.354
        elif stratum == "probe":
            # Probe: expected probing/sliding response with measured slip velocity >= 0.0005 m/s
            assert metrics["event_type"] == "probe_coulomb_slip"
            assert metrics["max_slip_mps"] >= 0.0005
        elif stratum == "nonstationary":
            priv_path = PILOT_DIR / "accepted" / f"{ep_entry['episode_id']}.privileged.json"
            with open(priv_path, "r", encoding="utf-8") as handle:
                priv_data = json.load(handle)
            regime = priv_data["env_metadata"].get("regime")
            if regime == "A":
                assert metrics["event_type"] == "regime_a_friction_collapse_slip"
                assert metrics["max_slip_mps"] > 0.0010
            elif regime == "B":
                assert metrics["event_type"] == "regime_b_mass_influx_hold"
                assert metrics["max_total_fn_n"] >= 0.50
                assert metrics["max_fz_shear_n"] >= 0.50


def test_manifest_consistency_and_zero_rejections() -> None:
    acc_path = PILOT_DIR / "accepted_manifest.json"
    rej_path = PILOT_DIR / "rejected_manifest.json"
    assert acc_path.is_file()
    assert rej_path.is_file()

    with open(acc_path, "r", encoding="utf-8") as handle:
        acc_entries = json.load(handle)
    with open(rej_path, "r", encoding="utf-8") as handle:
        rej_entries = json.load(handle)

    # Rejection manifest must be non-null and empty
    assert len(acc_entries) == 40
    assert len(rej_entries) == 0

    import hashlib
    for entry in acc_entries:
        assert entry["is_valid"] is True
        obs_file = PILOT_DIR / "accepted" / f"{entry['episode_id']}.npz"
        priv_file = PILOT_DIR / "accepted" / f"{entry['episode_id']}.privileged.json"
        assert obs_file.is_file()
        assert priv_file.is_file()

        with open(obs_file, "rb") as handle:
            obs_sha = hashlib.sha256(handle.read()).hexdigest()
        with open(priv_file, "rb") as handle:
            priv_sha = hashlib.sha256(handle.read()).hexdigest()
        assert obs_sha == entry["observation_sha256"]
        assert priv_sha == entry["privileged_sha256"]


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
    privileged_field_names = {
        "modes", "mu_true", "initial_mu_true", "object_mass", "initial_mass_kg",
        "clearance_mm", "clearance", "step_mu_true", "step_object_mass_kg",
        "step_contact_stratum", "step_insertion_depth_mm", "step_force_norm_n",
        "step_torque_norm_nm"
    }

    # Verify ALL 40 observation packages for zero leakage
    for entry in accepted_manifest:
        npz_path = PILOT_DIR / "accepted" / f"{entry['episode_id']}.npz"
        privileged_path = PILOT_DIR / "accepted" / f"{entry['episode_id']}.privileged.json"

        assert npz_path.is_file()
        assert privileged_path.is_file()

        with np.load(npz_path, allow_pickle=False) as archive:
            keys = set(archive.files)
            # Model-visible archive must NEVER expose privileged simulator fields
            leaks = keys.intersection(privileged_field_names)
            assert len(leaks) == 0, f"Leaked keys in {npz_path}: {leaks}"

        with open(privileged_path, "r", encoding="utf-8") as handle:
            privileged_data = json.load(handle)
            # Privileged JSON correctly holds ground truth
            assert "modes" in privileged_data
            assert "env_metadata" in privileged_data


AUTHORITATIVE_CONTACT_MODES = (
    (0, "FREE", "Free"),
    (1, "FIRST_CONTACT", "FirstContact"),
    (2, "STICKING", "Sticking"),
    (3, "SLIDING", "Sliding"),
    (4, "IMPACT", "Impact"),
    (5, "JAMMING", "Jamming"),
    (6, "RELEASE", "Release"),
)
REGIME_A_SLIP_THRESHOLD_MPS = 0.0010


def test_contact_mode_ontology_matches_enum() -> None:
    assert NUM_MODES == 7
    assert len(list(ContactMode)) == 7
    for value, enum_name, display_name in AUTHORITATIVE_CONTACT_MODES:
        mode = ContactMode(value)
        assert mode.name == enum_name
        assert MODE_NAMES[mode] == display_name
        assert int(mode) == value
    assert int(ContactMode.SLIDING) == 3
    assert int(ContactMode.JAMMING) == 5
    assert ContactMode.SLIDING.name != "WEDGING"


def test_saved_episode_modes_belong_to_contact_mode_enum(accepted_manifest: list[Dict[str, Any]]) -> None:
    assert len(accepted_manifest) == 40
    for entry in accepted_manifest:
        privileged_path = PILOT_DIR / "accepted" / f"{entry['episode_id']}.privileged.json"
        with open(privileged_path, "r", encoding="utf-8") as handle:
            privileged = json.load(handle)
        for label in privileged["modes"]:
            assert int(label) in ContactMode
            assert ContactMode(int(label)).name == AUTHORITATIVE_CONTACT_MODES[int(label)][1]


def test_classifier_mode_3_is_sliding_and_stratum_3_is_wedging(
    pilot_report: Dict[str, Any],
    accepted_manifest: list[Dict[str, Any]],
) -> None:
    ontology = pilot_report["ontology"]
    assert ontology["numeric_labels_remapped"] is False
    assert ontology["classifier_mode_3"] == "SLIDING"
    assert ontology["simulator_stratum_3"] == "WEDGING"
    assert ontology["classifier_mode_3_is_not_simulator_stratum_3"] is True
    assert ontology["contact_modes"][3]["enum_name"] == "SLIDING"
    assert ontology["simulator_contact_strata"][3]["name"] == "WEDGING"
    assert ontology["simulator_stratum_3_reached_without_classifier_jamming"] is True
    assert ontology["classifier_jamming_emitted_on_wedging_episodes"] is False

    execution_report = (PILOT_DIR / "stage3_2_execution_report.md").read_text(encoding="utf-8")
    assert "3 | `SLIDING` | Sliding" in execution_report
    assert "3 | WEDGING" in execution_report
    assert "ID 3 Sticking" not in execution_report
    assert "$1$: Impact, $2$: Sliding, $3$: Sticking" not in execution_report

    wedging_entries = [entry for entry in accepted_manifest if entry["task"] == "peg_in_hole" and entry["stratum"] == "wedging"]
    assert len(wedging_entries) == 4
    for entry in wedging_entries:
        privileged_path = PILOT_DIR / "accepted" / f"{entry['episode_id']}.privileged.json"
        with open(privileged_path, "r", encoding="utf-8") as handle:
            privileged = json.load(handle)
        modes = [int(mode) for mode in privileged["modes"]]
        strata = [int(value) for value in privileged["env_metadata"]["step_contact_stratum"]]
        assert 3 in strata
        assert ContactMode(3).name == "SLIDING"
        assert int(ContactMode.JAMMING) not in modes
        assert "WEDGING" not in {ContactMode(mode).name for mode in modes}


def test_regime_a_slip_is_after_friction_transition(pilot_report: Dict[str, Any]) -> None:
    regime = pilot_report["tasks"]["compliant_prelift"]["regime_verification"]
    assert regime["regime_a_slip_criterion"] == "post_transition_only"
    assert regime["regime_a_pre_transition_slip_used_for_acceptance"] is False
    assert regime["regime_a_slip_triggered"] is True
    assert regime["regime_a_friction_transition_verified"] is True
    episodes = regime["regime_a_episodes"]
    assert len(episodes) == 2
    assert pilot_report["trajectories_regenerated"] is False
    assert pilot_report["protocol"] == "HOROS-P1-R002-STAGE3.2.2-ONTOLOGY-CAUSAL"

    reported_ids = []
    for recorded in episodes:
        episode_id = recorded["episode_id"]
        reported_ids.append(episode_id)
        privileged_path = PILOT_DIR / "accepted" / f"{episode_id}.privileged.json"
        npz_path = PILOT_DIR / "accepted" / f"{episode_id}.npz"
        with open(privileged_path, "r", encoding="utf-8") as handle:
            privileged = json.load(handle)
        mu = [float(value) for value in privileged["env_metadata"]["step_mu_true"]]
        with np.load(npz_path) as archive:
            next_states = archive["next_states"]
        slip = np.max(np.abs(next_states[:, 16:20]), axis=1)

        transition_index = recorded["transition_index"]
        assert transition_index == 14
        assert recorded["simulator_step_count"] == 15
        assert mu[:transition_index] == [0.60] * transition_index
        assert mu[transition_index:] == [0.24] * (len(mu) - transition_index)
        assert recorded["pre_transition_mu_values"] == [0.60] * transition_index
        assert recorded["post_transition_mu_values"] == [0.24] * (len(mu) - transition_index)

        pre_peak = float(np.max(slip[:transition_index]))
        post_slip = slip[transition_index:]
        post_peak = float(np.max(post_slip))
        qualifying = [index for index in range(transition_index, len(slip)) if float(slip[index]) > REGIME_A_SLIP_THRESHOLD_MPS]
        assert pre_peak <= REGIME_A_SLIP_THRESHOLD_MPS
        assert post_peak > REGIME_A_SLIP_THRESHOLD_MPS
        assert qualifying
        assert qualifying[0] == recorded["first_post_transition_slip_index"]
        assert qualifying[0] >= transition_index
        assert recorded["first_post_transition_slip_simulator_step"] == qualifying[0] + 1
        assert abs(recorded["post_transition_peak_slip_mps"] - post_peak) < 1e-8
        assert abs(recorded["pre_transition_peak_slip_mps"] - pre_peak) < 1e-8
        assert recorded["passed"] is True
        assert recorded["indexing"]["slip_window"] == "post_transition_only"
        # The pre-transition peak alone does not satisfy the acceptance threshold.
        assert pre_peak <= REGIME_A_SLIP_THRESHOLD_MPS < post_peak

    assert regime["regime_a_episode_ids"] == reported_ids
    execution_report = (PILOT_DIR / "stage3_2_execution_report.md").read_text(encoding="utf-8")
    for episode_id in reported_ids:
        assert episode_id in execution_report


def test_regime_b_mass_increments_every_timestep(accepted_manifest: list[Dict[str, Any]]) -> None:
    regime_b = [
        entry
        for entry in accepted_manifest
        if entry["task"] == "compliant_prelift" and entry["stratum"] == "nonstationary"
    ]
    checked = 0
    for entry in regime_b:
        privileged_path = PILOT_DIR / "accepted" / f"{entry['episode_id']}.privileged.json"
        with open(privileged_path, "r", encoding="utf-8") as handle:
            meta = json.load(handle)["env_metadata"]
        if meta.get("regime") != "B":
            continue
        mass = np.asarray(meta["step_object_mass_kg"], dtype=np.float64)
        assert mass.shape == (20,)
        assert np.allclose(np.diff(mass), 0.0025, atol=1e-4)
        assert abs(float(mass[-1]) - 0.400) < 1e-4
        checked += 1
    assert checked == 2


def test_acceptance_function_rejects_slip_before_the_friction_transition() -> None:
    import importlib.util

    script_path = R002_ROOT / "scripts" / "run_stage3_pilot.py"
    spec = importlib.util.spec_from_file_location("run_stage3_pilot_stage322", script_path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)

    friction = [0.60] * 14 + [0.24] * 6
    states = np.zeros((20, 23), dtype=np.float64)
    states[:14, 16] = 0.05
    rejected = module.verify_regime_a_causal_slip(friction, states)
    assert rejected["friction_sequence_verified"] is True
    assert rejected["pre_transition_peak_slip_mps"] > REGIME_A_SLIP_THRESHOLD_MPS
    assert rejected["post_transition_peak_slip_mps"] <= REGIME_A_SLIP_THRESHOLD_MPS
    assert rejected["post_transition_slip_verified"] is False
    assert rejected["passed"] is False
    assert rejected["pre_transition_slip_used_for_acceptance"] is False

    states[14, 16] = 0.005
    accepted = module.verify_regime_a_causal_slip(friction, states)
    assert accepted["transition_index"] == 14
    assert accepted["first_post_transition_slip_index"] == 14
    assert accepted["passed"] is True
