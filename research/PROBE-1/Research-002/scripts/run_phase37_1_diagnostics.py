"""
Executes Phase 3.7.1 Read-only Diagnosis of Epistemic Uncertainty Under OOD
and generates the machine-readable JSON + Markdown diagnostic deliverables.
"""

from __future__ import annotations

import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
R002_ROOT = os.path.dirname(SCRIPT_DIR)
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(R002_ROOT)))
sys.path.insert(0, R002_ROOT)
sys.path.insert(0, os.path.join(R002_ROOT, "src"))

from src.integrated.phase37_1_ood_diagnostics import (
    PHASE37_1_REPORT_JSON_REL,
    PHASE37_1_REPORT_MD_REL,
    run_phase37_1_epistemic_diagnostics,
)


def main() -> int:
    doc = run_phase37_1_epistemic_diagnostics(R002_ROOT, repo_root=REPO_ROOT)
    u1 = doc["u1_baseline_reproduction"]
    dec4 = doc["task2_conditions"]["M4_acmm"]["simpson_mode_vs_within_decomposition"]
    print(
        "Phase 3.7.1 Diagnostics Complete | "
        f"U1 max_diff={u1['max_abs_diff']} | "
        f"M4 OOD AUROC(tot={u1['reproduced']['M4_B3_transition_total_auroc']}, "
        f"epi={u1['reproduced']['M4_B3_transition_epistemic_auroc']}, "
        f"LowMu_tot={u1['reproduced']['M4_B3_lowmu_total_auroc']}) | "
        f"epi_delta={dec4['observed_epi_delta_ood_minus_id']} "
        f"(mode_mix={dec4['mode_mix_shift_component']}, within_mode={dec4['within_mode_collapse_component']}) | "
        f"json={PHASE37_1_REPORT_JSON_REL} | md={PHASE37_1_REPORT_MD_REL}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

