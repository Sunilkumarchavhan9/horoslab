"""CLI runner for PROBE-1 Research-002 Phase 3.7.2: OOD Uncertainty Experiments.

Executes baseline reproduction (U1), candidate calibration and validation (C1-C5),
bootstrap confidence intervals and hypothesis tests (U2-U4), and reproducibility
audits (U5). Emits deliverables to experiments/phase3_7_uncertainty_intelligence/.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run HOROS PROBE-1 Research-002 Phase 3.7.2 OOD uncertainty experiments."
    )
    parser.add_argument(
        "--r002-root",
        type=str,
        default=None,
        help="Path to research/PROBE-1/Research-002 directory. Defaults to script parent.",
    )
    parser.add_argument(
        "--repo-root",
        type=str,
        default=None,
        help="Path to MemoryOS repository root. Defaults to 3 levels above script.",
    )
    args = parser.parse_args()

    script_path = Path(__file__).resolve()
    r002_root = Path(args.r002_root).resolve() if args.r002_root else script_path.parents[1]
    repo_root = Path(args.repo_root).resolve() if args.repo_root else script_path.parents[3]

    src_dir = r002_root / "src"
    if str(src_dir) not in sys.path:
        sys.path.insert(0, str(src_dir))
    if str(r002_root) not in sys.path:
        sys.path.insert(0, str(r002_root))

    print(f"=== HOROS PROBE-1 Research-002 Phase 3.7.2 Execution ===")
    print(f"R002 Root: {r002_root}")
    print(f"Repo Root: {repo_root}")

    start_time = time.time()
    from integrated.phase37_2_experiments import run_phase37_2_experiments

    try:
        results = run_phase37_2_experiments(str(r002_root), repo_root=str(repo_root))
        elapsed = time.time() - start_time
        print(f"\nExecution finished in {elapsed:.2f}s")
        print("\n--- Gate Summary ---")
        gate_summary = results.get("gate_summary", {})
        for gate, info in gate_summary.items():
            status = info.get("status") if isinstance(info, dict) else info
            print(f"  {gate}: {status}")

        print("\nDeliverables generated:")
        deliverables = results.get("deliverables", {})
        if deliverables:
            for name, rel_path in deliverables.items():
                print(f"  - {name}: {rel_path}")
        else:
            for key in ["results_json_rel", "candidate_comparison_csv_rel", "execution_report_md_rel", "reproducibility_audit_md_rel"]:
                val = results.get(key)
                if val:
                    print(f"  - {val}")

        return 0
    except Exception as exc:
        print(f"\nPhase 3.7.2 execution failed: {exc}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())

