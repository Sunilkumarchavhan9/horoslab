"""Phase 3.6 Readiness & Manifest Freeze Script (Design-Only — Does NOT execute the validation campaign)."""

import os
import sys

script_dir = os.path.dirname(os.path.abspath(__file__))
r002_root = os.path.abspath(os.path.join(script_dir, ".."))
if r002_root not in sys.path:
    sys.path.insert(0, r002_root)
src_dir = os.path.join(r002_root, "src")
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

from src.integrated.phase36_validation_protocol import run_phase36_readiness_preflight


if __name__ == "__main__":
    receipt = run_phase36_readiness_preflight(r002_root=r002_root, write_manifest=True)
    print(
        f"Phase 3.6 readiness verified (design-only): {receipt['total_campaign_episodes']} planned episodes | "
        f"{receipt['total_unique_seeds']} fresh disjoint seeds | sha256={receipt['manifest_sha256'][:16]}..."
    )
