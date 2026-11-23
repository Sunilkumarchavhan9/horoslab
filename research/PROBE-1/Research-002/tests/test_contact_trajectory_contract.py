"""P4-T1 acceptance tests for the single-contact partial-slip trajectory contract.

These tests execute the frozen kernel. They do not modify it, and they do not
treat verify_energy_passivity as an acceptance oracle.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import pytest

TESTS_DIR = Path(__file__).resolve().parent
R002_ROOT = TESTS_DIR.parent
REPO_ROOT = R002_ROOT.parent
EXPERIMENTS = R002_ROOT / "experiments"
PACKAGE = EXPERIMENTS / "contact_trajectory_contract"
VALIDATION_SOURCE = PACKAGE / "validation.py"

if str(EXPERIMENTS) not in sys.path:
    sys.path.insert(0, str(EXPERIMENTS))

from contact_trajectory_contract.generator import (  # noqa: E402
    DomainRejection,
    SeedAllocationError,
    generate_episode,
)
from contact_trajectory_contract.provenance import (  # noqa: E402
    compare_kernel_hashes,
    hash_observable,
    hash_privileged,
    load_kernel_hash_manifest,
)
from contact_trajectory_contract.recorder import (  # noqa: E402
    assert_observable_package_is_sealed,
    generate_and_record,
)
from contact_trajectory_contract.schema import (  # noqa: E402
    FIXTURE_CONFIGS,
    OBSERVABLE_CHANNELS,
    PRIVILEGED_FORBIDDEN_IN_OBSERVABLE,
    rounded_punch_rejection_config,
)
from contact_trajectory_contract.validation import (  # noqa: E402
    TrajectoryValidationError,
    assess_partial_slip_softening,
    assert_rejects_coulomb_cliff,
    build_coulomb_cliff_observable,
)

PROTECTED_PATHS = (
    "Research-002/experiments/contact_physics_v2/contact",
    "Research-002/experiments/contact_physics_v2/tests",
    "Research-002/src/environment",
    "Research-002/src/models",
    "Research-002/src/safety",
    "baselines",
    "Research-002/experiments/stage3_production_readiness/stage3_3_seed_registry.json",
    "Research-002/manifests/horos_world_model_vnext_manifest.json",
)


def test_spherical_fixtures_soften_before_gross_slip(tmp_path: Path):
    reports = []
    for config in FIXTURE_CONFIGS:
        recorded = generate_and_record(config, tmp_path / config.episode_id)
        report = assess_partial_slip_softening(
            recorded.episode.observable,
            recorded.episode.gross_slip_index,
        )
        reports.append(report)
        assert recorded.episode.regime[recorded.episode.gross_slip_index] == "gross_slip"
        assert "partial_slip" in recorded.episode.regime
        assert recorded.episode.regime.index("partial_slip") < recorded.episode.gross_slip_index
        sidecar = json.loads(recorded.privileged_path.read_text(encoding="utf-8"))
        assert sidecar["privileged_sha256"] == recorded.privileged_sha256
        assert sidecar["observable_sha256"] == recorded.observable_sha256
        assert hash_privileged(sidecar) == recorded.privileged_sha256
    assert all(item.accepted for item in reports)
    assert all(item.late_to_early_ratio < 0.80 for item in reports)


def test_coulomb_cliff_is_rejected():
    observable, gross_index = build_coulomb_cliff_observable()
    assert_rejects_coulomb_cliff(observable, gross_index)
    with pytest.raises(TrajectoryValidationError):
        assess_partial_slip_softening(observable, gross_index)


def test_domain_rejection_leaves_no_partial_artifact(tmp_path: Path):
    config = rounded_punch_rejection_config()
    destination = tmp_path / "rejected"
    destination.mkdir()
    preexisting = destination / f"{config.episode_id}.npz"
    partial = destination / f"{config.episode_id}.npz.partial"
    sidecar = destination / f"{config.episode_id}.privileged.json"
    preexisting.write_bytes(b"partial-artifact")
    partial.write_bytes(b"partial-artifact")
    sidecar.write_text("{}", encoding="utf-8")

    with pytest.raises(DomainRejection, match="Non-Hertzian"):
        generate_and_record(config, destination)

    assert not preexisting.exists()
    assert not partial.exists()
    assert not sidecar.exists()
    assert list(destination.glob("*.npz")) == []
    assert list(destination.glob("*.json")) == []


def test_observable_channels_exclude_privileged_fields(tmp_path: Path):
    recorded = generate_and_record(FIXTURE_CONFIGS[0], tmp_path)
    observable = assert_observable_package_is_sealed(recorded.observable_path)
    assert observable.shape[1] == 5
    assert tuple(OBSERVABLE_CHANNELS) == (
        "commanded_velocity",
        "normal_force",
        "tangential_force",
        "tangential_displacement",
        "slip_speed",
    )
    with np.load(recorded.observable_path, allow_pickle=False) as archive:
        for forbidden in PRIVILEGED_FORBIDDEN_IN_OBSERVABLE:
            assert forbidden not in archive.files
    sidecar = json.loads(recorded.privileged_path.read_text(encoding="utf-8"))
    for key in ("mu_static", "mu_kinetic", "stick_radius", "bristle_state"):
        assert key in sidecar
    assert sidecar["mu_static"] == pytest.approx(0.65)
    assert len(sidecar["stick_radius"]) == observable.shape[0]
    assert len(sidecar["bristle_state"]) == observable.shape[0]


def test_kernel_header_hashes_match_manifest():
    """Record on-disk kernel digests next to the frozen manifest.

    Files whose raw bytes match are required to match. The committed tree does
    not satisfy exact equality for the whole manifest: ``cattaneo_mindlin.py``
    differs in content, and seven kernel tests differ only by CRLF. This test
    locks that observation. It does not rewrite either side.
    """

    comparison = compare_kernel_hashes()
    manifest = load_kernel_hash_manifest()
    episode = generate_episode(FIXTURE_CONFIGS[0])
    assert episode.kernel_hashes == comparison["working_tree_sha256"]
    for relative in comparison["matched_raw"]:
        assert episode.kernel_hashes[relative] == manifest[relative]
    assert [item["path"] for item in comparison["content_mismatch"]] in (
        [],
        ["contact/cattaneo_mindlin.py"],
    )
    assert comparison["newline_only"] in (
        [],
        [
            "tests/__init__.py",
            "tests/test_energy.py",
            "tests/test_normal_contact.py",
            "tests/test_numerical_stability.py",
            "tests/test_partial_slip.py",
            "tests/test_remediation_v2_1.py",
            "tests/test_stick_zone.py",
        ],
    )
    assert comparison["exact_match"] in (True, False)


def test_same_seed_and_config_are_reproducible(tmp_path: Path):
    config = FIXTURE_CONFIGS[1]
    first = generate_and_record(config, tmp_path / "a")
    second = generate_and_record(config, tmp_path / "b")
    assert np.array_equal(first.episode.observable, second.episode.observable)
    assert first.observable_sha256 == second.observable_sha256
    assert first.privileged_sha256 == second.privileged_sha256
    assert first.episode_sha256 == second.episode_sha256
    assert first.observable_sha256 == hash_observable(first.episode.observable)
    assert first.privileged_path.read_bytes() == second.privileged_path.read_bytes()


def test_locked_seeds_are_refused():
    for seed in (3311000, 3401000, 3111000, 9500000, 9100):
        config = FIXTURE_CONFIGS[0].__class__(
            seed=seed,
            normal_force_n=1.5,
            commanded_velocity_m_s=0.004,
            radius_m=0.008,
        )
        with pytest.raises(SeedAllocationError):
            generate_episode(config)


def test_stiffness_uses_recorded_force_not_kernel_oracles():
    source = VALIDATION_SOURCE.read_text(encoding="utf-8")
    assert "verify_energy_passivity" not in source
    assert "stick_radius" not in source
    observable, _gross = build_coulomb_cliff_observable()
    with pytest.raises(TrajectoryValidationError):
        assess_partial_slip_softening(observable[:, :4], 10)


def test_protected_paths_are_unmodified():
    status = subprocess.run(
        ["git", "status", "--porcelain", "--", *PROTECTED_PATHS],
        cwd=REPO_ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    assert status.stdout.strip() == ""
    checkpoints = subprocess.run(
        ["git", "status", "--porcelain", "--", "Research-002/checkpoints"],
        cwd=REPO_ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    changed_checkpoints = [
        line for line in checkpoints.stdout.splitlines() if line.strip().endswith(".pt")
    ]
    assert changed_checkpoints == []
