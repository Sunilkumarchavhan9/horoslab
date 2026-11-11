"""
HOROS PROBE-1 — Research-002: Phase 3.5 Offline (120 ep) & Closed-Loop (18x25 = 450 ep) Evaluation Runner

Loads strictly verified accepted Phase 3.4 checkpoints and manifests, executes the frozen
Document 53 Revision 1.1 evaluation protocol (570 total evaluation episodes), and writes
strict RFC 8259 JSON reports under experiments/phase3_5_evaluation/.
"""

from __future__ import annotations

import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
r002_root = os.path.abspath(os.path.join(current_dir, ".."))
repo_root = os.path.abspath(os.path.join(r002_root, "..", "..", ".."))
if r002_root not in sys.path:
    sys.path.insert(0, r002_root)
if os.path.join(r002_root, "src") not in sys.path:
    sys.path.insert(0, os.path.join(r002_root, "src"))

from src.integrated.phase35_evaluator import run_phase35_evaluation


if __name__ == "__main__":
    master = run_phase35_evaluation(
        r002_root=r002_root,
        repo_root=repo_root,
        eval_horizon=50,
        seed_offset=42,
    )
    acc = master["episode_accounting"]
    print(
        f"Phase 3.5 evaluation completed: {acc['offline_episodes']} offline + "
        f"{acc['closed_loop_episodes']} closed-loop = {acc['total_evaluation_episodes']} total episodes "
        f"in {master['total_runtime_seconds']}s."
    )

