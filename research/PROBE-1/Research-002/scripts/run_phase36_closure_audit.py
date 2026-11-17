"""Execute Phase 3.6 G3 Clarification & G6 Task 2 Non-Regression Adjudication Audit."""

import os
import sys

script_dir = os.path.dirname(os.path.abspath(__file__))
r002_root = os.path.abspath(os.path.join(script_dir, ".."))
if r002_root not in sys.path:
    sys.path.insert(0, r002_root)
src_dir = os.path.join(r002_root, "src")
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

from src.integrated.phase36_closure_audit import run_phase36_closure_audit


if __name__ == "__main__":
    doc = run_phase36_closure_audit(r002_root=r002_root)
    par = doc["g6_phase35_50seed_replay_parity"]
    adj = doc["final_six_gate_adjudicated_matrix"]
    print(
        f"Phase 3.6 Closure Audit | 50-seed Task 2 parity={par['exact_parity_count']}/{par['n_replayed']} "
        f"(mismatches={par['mismatch_count']}) | config_identical={doc['g6_task2_config_parity']['all_config_identical']} | "
        f"all_six_gates_adjudicated={adj['all_six_gates_passed_adjudicated']}",
        flush=True,
    )

