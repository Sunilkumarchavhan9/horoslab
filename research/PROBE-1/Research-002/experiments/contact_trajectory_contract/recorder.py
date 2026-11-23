"""Write the observable NPZ and the privileged sidecar.

Separation follows the Stage 3 production adapter: model-visible bytes and
privileged supervision live in different files. A failed generation deletes
any destination that was already present, so a domain rejection cannot leave
a partial artifact.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np

from .generator import DomainRejection, GeneratedEpisode, generate_episode
from .provenance import hash_episode, hash_observable, hash_privileged
from .schema import (
    OBSERVABLE_CHANNELS,
    PRIVILEGED_FORBIDDEN_IN_OBSERVABLE,
    SCHEMA_VERSION,
    TrajectoryConfig,
)


@dataclass(frozen=True)
class RecordedTrajectory:
    observable_path: Path
    privileged_path: Path
    observable_sha256: str
    privileged_sha256: str
    episode_sha256: str
    episode: GeneratedEpisode


def generate_and_record(config: TrajectoryConfig, output_dir: Path) -> RecordedTrajectory:
    output_dir.mkdir(parents=True, exist_ok=True)
    observable_path = output_dir / f"{config.episode_id}.npz"
    privileged_path = output_dir / f"{config.episode_id}.privileged.json"
    partials = _partial_paths(observable_path, privileged_path)
    try:
        episode = generate_episode(config)
        return _commit(episode, observable_path, privileged_path)
    except Exception:
        _delete(observable_path, privileged_path, *partials)
        raise


def privileged_document(episode: GeneratedEpisode, observable_sha256: str) -> dict:
    config = episode.config
    document = {
        "schema_version": SCHEMA_VERSION,
        "episode_id": config.episode_id,
        "seed": int(config.seed),
        "action_semantics": (
            "commanded_velocity is the tangential velocity command in m/s. "
            "applied_velocity is the passivity-bounded actuator velocity and is privileged."
        ),
        "observation_semantics": (
            "The observable array columns are commanded_velocity, normal_force, "
            "tangential_force, tangential_displacement, and slip_speed. "
            "slip_speed is CattaneoMindlinModel state.slip_velocity after the synchronized step."
        ),
        "mu_static": float(config.mu_static),
        "mu_kinetic": float(config.mu_kinetic),
        "normal_force_command_n": float(config.normal_force_n),
        "commanded_velocity_m_s": float(config.commanded_velocity_m_s),
        "radius_m": float(config.radius_m),
        "dt_s": float(config.dt_s),
        "geometry": config.geometry,
        "require_valid_domain": bool(config.require_valid_domain),
        "normal_indentation_m": episode.normal_indentation_m,
        "contact_radius_m": episode.contact_radius_m,
        "gross_slip_index": int(episode.gross_slip_index),
        "regime": list(episode.regime),
        "stick_radius": episode.stick_radius.tolist(),
        "bristle_deflection": episode.bristle_deflection.tolist(),
        "bristle_state": episode.bristle_deflection.tolist(),
        "applied_velocity": episode.applied_velocity.tolist(),
        "is_gross_slipping": [bool(flag) for flag in episode.is_gross_slipping.tolist()],
        "kernel_source_hashes": episode.kernel_hashes,
        "kernel_hash_comparison": {
            "exact_match": episode.kernel_hash_comparison["exact_match"],
            "newline_only": episode.kernel_hash_comparison["newline_only"],
            "content_mismatch": episode.kernel_hash_comparison["content_mismatch"],
        },
        "observable_sha256": observable_sha256,
    }
    document["privileged_sha256"] = hash_privileged(document)
    document["episode_sha256"] = hash_episode(
        config.episode_id,
        config.seed,
        observable_sha256,
        document["privileged_sha256"],
    )
    return document


def assert_observable_package_is_sealed(path: Path) -> np.ndarray:
    """Load an NPZ and refuse privileged names anywhere in its keys or string payloads."""

    with np.load(path, allow_pickle=False) as archive:
        keys = set(archive.files)
        forbidden = [name for name in PRIVILEGED_FORBIDDEN_IN_OBSERVABLE if name in keys]
        if forbidden:
            raise DomainRejection(f"Privileged keys inside observable NPZ: {forbidden}")
        for key in keys:
            payload = archive[key]
            if payload.dtype.kind in {"U", "S", "O"}:
                text = " ".join(np.array(payload).astype(str).ravel().tolist())
                leaked = [name for name in PRIVILEGED_FORBIDDEN_IN_OBSERVABLE if name in text.split()]
                if leaked:
                    raise DomainRejection(f"Privileged token {leaked} stored in NPZ field {key}")
        if "observable" not in keys or "channel_names" not in keys:
            raise DomainRejection("Observable NPZ is missing observable or channel_names")
        names = tuple(str(item) for item in archive["channel_names"].tolist())
        if names != OBSERVABLE_CHANNELS:
            raise DomainRejection(f"Channel names {names} do not match the schema")
        observable = np.ascontiguousarray(archive["observable"], dtype=np.float64)
    if observable.ndim != 2 or observable.shape[1] != len(OBSERVABLE_CHANNELS):
        raise DomainRejection(f"Observable shape {observable.shape} is not (T, 5)")
    return observable


def _commit(episode: GeneratedEpisode, observable_path: Path, privileged_path: Path) -> RecordedTrajectory:
    observable_sha = hash_observable(episode.observable)
    document = privileged_document(episode, observable_sha)
    header = {
        "schema_version": np.asarray(SCHEMA_VERSION),
        "episode_id": np.asarray(episode.config.episode_id),
        "seed": np.asarray(episode.config.seed, dtype=np.int64),
        "channel_names": np.asarray(OBSERVABLE_CHANNELS),
        "observable": np.ascontiguousarray(episode.observable, dtype="<f8"),
        "observable_sha256": np.asarray(observable_sha),
        "privileged_sha256": np.asarray(document["privileged_sha256"]),
        "kernel_source_hashes_json": np.asarray(
            json.dumps(episode.kernel_hashes, sort_keys=True, separators=(",", ":"))
        ),
    }
    partial_npz = observable_path.with_name(observable_path.name + ".partial")
    partial_json = privileged_path.with_name(privileged_path.name + ".partial")
    np.savez_compressed(partial_npz, **header)
    # savez_compressed appends .npz if the name does not end with .npz.
    written_partial = partial_npz if partial_npz.is_file() else Path(str(partial_npz) + ".npz")
    partial_json.write_text(_dumps(document), encoding="utf-8")
    os.replace(written_partial, observable_path)
    os.replace(partial_json, privileged_path)
    return RecordedTrajectory(
        observable_path=observable_path,
        privileged_path=privileged_path,
        observable_sha256=observable_sha,
        privileged_sha256=document["privileged_sha256"],
        episode_sha256=document["episode_sha256"],
        episode=episode,
    )


def _dumps(document: dict) -> str:
    return json.dumps(document, sort_keys=True, indent=2, ensure_ascii=True) + "\n"


def _partial_paths(*paths: Path) -> Iterable[Path]:
    extra = []
    for path in paths:
        extra.append(path.with_name(path.name + ".partial"))
        extra.append(Path(str(path.with_name(path.name + ".partial")) + ".npz"))
    return extra


def _delete(*paths: Path) -> None:
    for path in paths:
        if path.is_file():
            path.unlink()
