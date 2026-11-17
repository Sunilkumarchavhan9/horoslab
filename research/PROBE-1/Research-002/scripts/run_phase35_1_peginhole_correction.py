"""
Runner for HOROS PROBE-1 Research-002 Phase 3.5.1 Targeted Peg-in-Hole Correction.
Executes 3.5.1-A reward verification, 3.5.1-B stall diagnostics/ablation, and
3.5.1-C 150-episode closed-loop re-evaluation of C13-C18 without overwriting
any frozen Phase 3.5 570-episode or closure addendum artifacts.
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

from src.integrated.phase35_1_correction import run_phase35_1_peginhole_correction


if __name__ == "__main__":
    doc = run_phase35_1_peginhole_correction(
        r002_root=r002_root,
        repo_root=repo_root if os.path.exists(os.path.join(repo_root, ".git")) else None,
    )
    print(
        f"Phase 3.5.1 completed in {doc['total_runtime_seconds']}s: "
        f"{doc['episode_accounting']['total_re_evaluated_episodes']} episodes across "
        f"{len(doc['cells'])} cells."
    )

