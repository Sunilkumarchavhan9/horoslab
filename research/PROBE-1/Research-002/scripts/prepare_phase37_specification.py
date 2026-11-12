"""Readiness & Specification Generator for Phase 3.7 (Design-Only, Zero Execution)."""

import os
import sys

script_dir = os.path.dirname(os.path.abspath(__file__))
r002_root = os.path.abspath(os.path.join(script_dir, ".."))
if r002_root not in sys.path:
    sys.path.insert(0, r002_root)
src_dir = os.path.join(r002_root, "src")
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

from src.integrated.phase37_uncertainty_protocol import run_phase37_readiness_preflight


if __name__ == "__main__":
    summary = run_phase37_readiness_preflight(r002_root=r002_root, write_manifest=True)
    print(
        f"Phase 3.7 readiness verified (design-only): {summary['workstream_count']} workstreams | "
        f"status={summary['execution_status']} | sha256={summary['manifest_sha256'][:16]}...",
        flush=True,
    )

