"""Provenance for P4-T1 episodes.

The hash construction follows SyntheticEpisodeRecord.compute_record_hash in
Research-002/src/teaching/factory.py: a domain prefix, then every covered
field, with the hash field itself excluded. The Stage 3 field list is not
reused, because that record is a different schema.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Dict, Mapping

import numpy as np

from .schema import EPISODE_HASH_PREFIX, OBSERVABLE_HASH_PREFIX, PRIVILEGED_HASH_PREFIX


KERNEL_PACKAGE = Path(__file__).resolve().parents[1] / "contact_physics_v2"
HASH_MANIFEST = KERNEL_PACKAGE / "reports" / "source_hash_manifest.txt"


def sha256_file(path: Path) -> str:
    hasher = hashlib.sha256()
    hasher.update(path.read_bytes())
    return hasher.hexdigest()


def load_kernel_hash_manifest(manifest_path: Path = HASH_MANIFEST) -> Dict[str, str]:
    """Parse ``source_hash_manifest.txt`` into {relative posix path: hex}."""

    found: Dict[str, str] = {}
    for raw in manifest_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        digest, relative = line.split(None, 1)
        found[relative.replace("\\", "/")] = digest
    if not found:
        raise ValueError(f"No hashes parsed from {manifest_path}")
    return found


def kernel_source_hashes(kernel_root: Path = KERNEL_PACKAGE) -> Dict[str, str]:
    """SHA-256 of the on-disk bytes for each manifest path. No newline rewrite."""

    manifest = load_kernel_hash_manifest(kernel_root / "reports" / "source_hash_manifest.txt")
    computed: Dict[str, str] = {}
    for relative in manifest:
        path = kernel_root / relative
        if not path.is_file():
            raise FileNotFoundError(f"Manifest entry missing on disk: {path}")
        computed[relative] = sha256_file(path)
    return computed


def compare_kernel_hashes(kernel_root: Path = KERNEL_PACKAGE) -> Dict[str, object]:
    """Compare on-disk bytes with ``source_hash_manifest.txt``.

    A CRLF working copy whose LF normalization matches the manifest is reported
    as ``newline_only``. Any other disagreement is ``content_mismatch``. This
    function does not rewrite the kernel or the manifest.
    """

    manifest = load_kernel_hash_manifest(kernel_root / "reports" / "source_hash_manifest.txt")
    raw_hashes = kernel_source_hashes(kernel_root)
    newline_only = []
    content_mismatch = []
    matched_raw = []
    for relative, expected in manifest.items():
        raw = raw_hashes[relative]
        if raw == expected:
            matched_raw.append(relative)
            continue
        path = kernel_root / relative
        normalized = hashlib.sha256(path.read_bytes().replace(b"\r\n", b"\n")).hexdigest()
        if normalized == expected:
            newline_only.append(relative)
        else:
            content_mismatch.append(
                {
                    "path": relative,
                    "manifest_sha256": expected,
                    "working_tree_sha256": raw,
                    "lf_normalized_sha256": normalized,
                }
            )
    return {
        "manifest_path": "reports/source_hash_manifest.txt",
        "working_tree_sha256": raw_hashes,
        "matched_raw": matched_raw,
        "newline_only": newline_only,
        "content_mismatch": content_mismatch,
        "exact_match": len(newline_only) == 0 and len(content_mismatch) == 0,
    }


def hash_observable(observable: np.ndarray) -> str:
    array = np.ascontiguousarray(observable, dtype="<f8")
    hasher = hashlib.sha256()
    hasher.update(OBSERVABLE_HASH_PREFIX)
    hasher.update(f"{array.shape[0]},{array.shape[1]}".encode("utf-8"))
    hasher.update(array.tobytes())
    return hasher.hexdigest()


def _canonical_privileged_body(privileged: Mapping[str, object]) -> bytes:
    body = {
        key: value
        for key, value in privileged.items()
        if key not in {"privileged_sha256", "episode_sha256"}
    }
    return json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


def hash_privileged(privileged: Mapping[str, object]) -> str:
    hasher = hashlib.sha256()
    hasher.update(PRIVILEGED_HASH_PREFIX)
    hasher.update(_canonical_privileged_body(privileged))
    return hasher.hexdigest()


def hash_episode(episode_id: str, seed: int, observable_sha256: str, privileged_sha256: str) -> str:
    """Same construction style as compute_record_hash, for this schema."""

    hasher = hashlib.sha256()
    hasher.update(EPISODE_HASH_PREFIX)
    hasher.update(episode_id.encode("utf-8"))
    hasher.update(str(int(seed)).encode("utf-8"))
    hasher.update(observable_sha256.encode("utf-8"))
    hasher.update(privileged_sha256.encode("utf-8"))
    return hasher.hexdigest()
