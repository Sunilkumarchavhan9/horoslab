# HOROS PROBE-1 — Phase 5 Task 1 (P5-T1)
# Reproducibility Protocol & Git Manifest Verification

**Project:** HOROS Physical Interaction Data Engine (PIDE)  
**Research Program:** PROBE-1  
**Milestone:** Phase 5 Task 1 (P5-T1)  
**Target:** Adaptive Pre-Contact Preload Planning Suite  
**Date:** 2026-11-23  
**Status:** **100% REPRODUCIBLE & VERIFIED**  

---

## 1. System Environment & Execution Context

| Component | Specification |
|---|---|
| **Operating System** | Windows 11 Enterprise (x86_64) |
| **Python Runtime** | Python 3.12.10 |
| **Deep Learning Framework** | PyTorch 2.5.1+cpu |
| **Scientific Computing** | NumPy 2.2.3, SciPy 1.15.2 |
| **Testing Harness** | PyTest 9.0.2 |
| **Canonical Workspace** | `c:\projects\MemoryOS` |
| **Mirror Workspace** | `C:\projects\horos-probe-1` |
| **Target Git Branch** | `feat/probe1-stage33-production-readiness` |

---

## 2. Seed Allocation & Governance Invariants

- **Reserved Research Seed Range:** `4500001` through `4500300` (strictly non-overlapping with production seeds `3300000+`, reserve seeds `3390000+`, P4-T3 seeds `4300000+`, or P4-T4B seeds `4400000+`).
- **Protected Core Simulation Components (100% Immutable):**
  - Contact Physics v2.1.3.11: `experiments/contact_physics_v2/contact/*` (Lugre, Cattaneo-Mindlin, Normal Contact, Material, Energy Accounting).
  - Simulator v1: `CompliantPreLiftContactEnv`.
  - Stage 3.3B Quality Gates: `experiments/pre_slip_qualification/*`.
- **Causality & Non-Leakage Contract:**
  - Evaluated planners and closed-loop controllers receive strictly causal, noisy observable telemetry:
    $$\mathbf{y}_{\text{obs}}(t) = [F_t(t) + \epsilon_F, F_n(t) + \epsilon_F, \delta(t) + \epsilon_\delta, v_{\text{cmd}}(t), v_{\text{slip}}(t)]$$
  - Zero access to privileged simulation state ($c(t), a(t), \mu_s, \mu_k$).

---

## 3. Git Blob Hash Manifest (P5-T1 Suite)

All 10 deliverable artifacts in `research/PROBE-1/Research-002/experiments/adaptive_preload_p5_t1/` are indexed with their exact SHA-1 Git blob hashes:

| File Name | Git Blob Hash (SHA-1) | Purpose |
|---|---|---|
| `probe_design.py` | `906aa05bf5ca727e5a359defb7854d806febb746` | Controlled tactile micro-probe module & feature extraction |
| `contact_condition_estimator.py` | `780b925cbd6e87c918454be3292c09c84447f264` | Rule-based & learned uncertainty-aware contact estimators |
| `adaptive_preload_planner.py` | `b34b050364e1d526c6d73c5d3f12ba21373b61fb` | Preload planning suite (Fixed 3/5/8/12N, Rule-Based, Learned) |
| `grasp_simulation_env_p5_t1.py` | `d232f1d8264054616c2fcb11b2d25582bca4fc0c` | 3-phase simulation environment with rate-limited actuation |
| `test_p5_t1_adaptive_preload.py` | `4fa2f0aa3d7212998befb11c7fad02408c52758f` | 8-point unit test suite verifying contracts and invariants |
| `run_p5_t1_experiments.py` | `b0f8efe1cfa76cc591935b668d36add736c560cb` | 300-scenario factorial benchmark runner & statistics |
| `p5_t1_evaluation_summary.json` | `3c934f5a04b82bdd92ed75ff4ba936cf095a759f` | Machine-readable benchmark evaluation records & matrix |
| `p5_t1_research_specification.md` | `2725e172196618d544952b63d78d6750038b977e` | Pre-registered Stage B8 research specification |
| `p5_t1_scientific_evaluation_report.md` | `cef8d993f4833ef709630b288464c479e72e95ab` | Full scientific audit and contact mechanics evaluation report |
| `p5_t1_reproducibility_report.md` | *(This document)* | Independent reproducibility protocol & verification guide |

---

## 4. Exact Execution Instructions

### 4.1 Unit Test Suite Execution
To verify all 8 unit tests in standard sandboxed mode:

```bash
pytest research/PROBE-1/Research-002/experiments/adaptive_preload_p5_t1/test_p5_t1_adaptive_preload.py -v
```

**Expected Result:**
```
============================== 8 passed in 2.03s ==============================
```

All 8 tests must pass:
1. `test_controlled_probe_safety_invariant`: $c/a \ge 0.85$ and $0$ gross slips across all $\mu$.
2. `test_probe_feature_extraction`: causal features ($F_{n,\text{mean}}, F_{t,\max}, K_{t,\text{init}}, R_{\text{probe}}$).
3. `test_rule_based_contact_estimator`: correct stratum differentiation on probe ratios.
4. `test_learned_estimator_uncertainty_fallback`: fallback triggers under high variance.
5. `test_preload_planners_suite`: all 6 planners produce bounded commands ($3.0 \le F_n \le 25.0$).
6. `test_causality_and_observability_contract`: zero privileged state leakage in observation dict.
7. `test_simulation_reproducibility`: identical observations on repeated seeded runs.
8. `test_protection_invariants`: core physics and simulator files remain unmodified.

### 4.2 Full 300-Scenario Benchmark Execution
To re-run the complete factorial benchmark ($1,800$ closed-loop grasping episodes across 6 planners):

```bash
python research/PROBE-1/Research-002/experiments/adaptive_preload_p5_t1/run_p5_t1_experiments.py
```

**Expected Result:**
- Execution completes in $\approx 50\,\text{s}$ on CPU.
- Output JSON generated at `p5_t1_evaluation_summary.json`.
- Learned Adaptive Preload Planner achieves $65.33\%$ overall success.
- McNemar test vs Fixed 5 N yields $\chi^2 = 14.06, p = 8.84 \times 10^{-5} < 0.0001$.
- Probe slip count is exactly 0.
- Overall milestone verdict: `CONDITIONAL_PASS`.

---

## 5. Independent Verification Checklist

- [x] All 8 unit tests pass cleanly in `test_p5_t1_adaptive_preload.py`.
- [x] All 99 regression tests across `research/PROBE-1/Research-002/experiments/` pass.
- [x] Protected physics kernel (`contact_physics_v2/contact/*`) untouched.
- [x] Simulator v1 (`CompliantPreLiftContactEnv`) untouched.
- [x] Production seeds (`3300000+`) and reserve seeds (`3390000+`) untouched.
- [x] P4-T4B final evidence reconciliation deliverables complete and verified.
- [x] P5-T1 evaluation summary JSON contains complete matched scenario data.
- [x] Git blob hashes verified and documented.
