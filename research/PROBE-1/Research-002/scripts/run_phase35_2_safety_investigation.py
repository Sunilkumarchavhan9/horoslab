"""Runner for HOROS PROBE-1 Research-002 Phase 3.5.2 Safety Investigation & Frozen 30-Episode Pilot."""

import os
import sys

script_dir = os.path.dirname(os.path.abspath(__file__))
r002_root = os.path.abspath(os.path.join(script_dir, ".."))
if r002_root not in sys.path:
    sys.path.insert(0, r002_root)
src_dir = os.path.join(r002_root, "src")
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

from src.integrated.peginhole_phase352_controller import run_phase35_2_safety_investigation


if __name__ == "__main__":
    doc = run_phase35_2_safety_investigation(r002_root=r002_root)
    pr = doc["pilot_results"]
    print(
        f"Phase 3.5.2 completed in {doc['elapsed_seconds']}s | "
        f"pilot={pr['total_episodes']} ep | viol={pr['safety_violations']} | "
        f"crush={pr['dynamic_crush_terminations']} | seated={pr['seated_successes']} | "
        f"shadow_unsafe_steps={pr['total_shadow_would_pass_unsafe_steps']}"
    )

