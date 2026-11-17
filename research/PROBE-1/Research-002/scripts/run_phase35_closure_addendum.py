"""
Runner for HOROS PROBE-1 Research-002 Phase 3.5 Scientific Closure Addendum.
Generates experiments/phase3_5_evaluation/phase35_closure_addendum.json without modifying
the frozen original 570-episode evaluation archives.
"""

import os
import sys

script_dir = os.path.dirname(os.path.abspath(__file__))
r002_root = os.path.abspath(os.path.join(script_dir, ".."))
repo_root = os.path.abspath(os.path.join(r002_root, "..", "..", ".."))
if r002_root not in sys.path:
    sys.path.insert(0, r002_root)
src_dir = os.path.join(r002_root, "src")
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

from src.integrated.phase35_closure_addendum import generate_phase35_closure_addendum


if __name__ == "__main__":
    addendum = generate_phase35_closure_addendum(
        r002_root=r002_root,
        repo_root=repo_root if os.path.exists(os.path.join(repo_root, ".git")) else None,
    )
    print(
        f"Phase 3.5 closure addendum written successfully. Verified immutable archives: "
        f"{len(addendum['preserved_original_archive_sha256s'])}."
    )

