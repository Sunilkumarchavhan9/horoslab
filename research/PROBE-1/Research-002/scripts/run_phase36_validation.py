"""Executable campaign script for HOROS PROBE-1 Research-002 Phase 3.6 Validation."""

import os
import sys

script_dir = os.path.dirname(os.path.abspath(__file__))
r002_root = os.path.abspath(os.path.join(script_dir, ".."))
if r002_root not in sys.path:
    sys.path.insert(0, r002_root)
src_dir = os.path.join(r002_root, "src")
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

from src.integrated.phase36_validation_runner import run_phase36_validation_campaign


if __name__ == "__main__":
    doc = run_phase36_validation_campaign(r002_root=r002_root, progress_callback=lambda m: print(m, flush=True))
    gates = doc["acceptance_gates"]
    print(
        f"Phase 3.6 {doc['execution_status']} in {doc['elapsed_seconds']}s | "
        f"executed={doc['total_executed_episodes']}/{doc['total_planned_episodes']} | "
        f"g1_halted={doc['g1_halted']} | all_six_gates_passed={gates['all_six_gates_passed']}",
        flush=True,
    )
    if not gates["all_six_gates_passed"]:
        sys.exit(2)

