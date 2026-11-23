"""
HOROS Contact Physics v2: Comprehensive Benchmark Runner
Executes all 5 analytical contact benchmarks and aggregates results.
"""

import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from benchmarks.hertz_normal_loading import run_hertz_normal_benchmark
from benchmarks.tangential_loading import run_tangential_loading_benchmark
from benchmarks.partial_slip import run_partial_slip_benchmark
from benchmarks.stick_zone_evolution import run_stick_zone_evolution_benchmark
from benchmarks.loading_unloading import run_loading_unloading_benchmark


def run_all_benchmarks() -> dict:
    results = [
        run_hertz_normal_benchmark(),
        run_tangential_loading_benchmark(),
        run_partial_slip_benchmark(),
        run_stick_zone_evolution_benchmark(),
        run_loading_unloading_benchmark()
    ]

    all_passed = all(r.get("status") == "PASS" for r in results)
    summary = {
        "suite": "HOROS Contact Physics v2 Reference Kernel Benchmark Suite",
        "total_benchmarks": len(results),
        "passed_count": sum(1 for r in results if r.get("status") == "PASS"),
        "overall_status": "ALL_PASS" if all_passed else "FAILURES_DETECTED",
        "details": results
    }
    return summary


if __name__ == "__main__":
    report = run_all_benchmarks()
    print(json.dumps(report, indent=2))
