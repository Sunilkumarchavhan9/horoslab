# HOROS PROBE-1 Research-002 — Phase 3.6 Closure Addendum (`G3` Clarification & `G6` Adjudication)

**Date:** 2026-11-12  
**Companion Archives:**  
- Executed 1,215-Episode Campaign (preserved untouched): [`phase36_validation_results.json`](./phase36_validation_results.json) (`sha256: 0f6415347918d289f30989ab31859f217438378f2210bfbfdff5b06d832909cd`)  
- Formal Closure Adjudication & 50-Seed Parity Archive: [`phase36_closure_adjudication.json`](./phase36_closure_adjudication.json)  
- Frozen Protocol Manifest (unchanged): [`manifests/phase36_validation_manifest.json`](../../manifests/phase36_validation_manifest.json) (`manifest_sha256: 620f8a7875a00b3e70818d905eda2e971e96044022782cfdc559e94edcebb5e1`)

---

## 1. Final Six-Gate Acceptance Matrix (`G1–G6`)

No additional physical-condition episodes were executed for this addendum, and the original `phase36_validation_results.json` file remains byte-for-byte unchanged (preserving its original automated flag `G6.passed = 0`, `all_six_gates_passed = 0` derived from an erroneous hardcoded `task2_id_success_rate == 1.0` & `force_gt_25n_episodes == 0` check). Formal adjudication via [`phase36_closure_audit.py`](../../src/integrated/phase36_closure_audit.py) confirms all six gates pass under the frozen Task 2 non-regression standard.

| Gate | Automated JSON Flag (`results.json`) | Adjudicated Status (`closure_adjudication.json`) | Verified Evidence Summary |
|---|---|---|---|
| **G1** Zero dynamic crush (`>40 N / >8 Nm`) & `SafetyEvaluator` (`>35 N / >7 Nm`) across `3.6.2–3.6.4` | **PASS (`1`)** | **PASS (`1`)** | `0 / 1,135` Peg-in-Hole violations (`g1_halted = False`), `0` wall penetration steps, max force `0.475 N`, max torque `0.0000 N*m`. |
| **G2** Valid-domain `M4_acmm` seating (`>=90%`) & bore contact (`>=95%`) | **PASS (`1`)** | **PASS (`1`)** | `859 / 860 (99.88%)` seated (`B3: 760/760`, `B1: 99/100`), `860 / 860 (100.0%)` contact acquisition (`M0` separated). |
| **G3** Below-domain (`0.14 mm`) & Track `3.6.5` fault refusal | **PASS (`1`)** | **PASS (`1` — Clarified below)** | `20/20` proactive `0.14 mm` Mode B refusal (`0` bore entry); `30/30` fault scenarios fail-closed; `0/80` boundary violations. |
| **G4** Pose, tilt, near-rim & mid-insertion impulse safety (`3.6.4`) | **PASS (`1`)** | **PASS (`1`)** | `0 / 120` crush/force violations; `120 / 120 (100.0%)` seated recovery (`30/30` mid-insertion impulses recovered). |
| **G5** Zero oracle leakage & shadow-only baseline | **PASS (`1`)** | **PASS (`1`)** | `oracle_max_abs_diff = 0.0` across Mode A & Mode B; `PredictiveCBFSafetyFilter` shadow-only (`686` unsafe candidate steps caught). |
| **G6** SHA-256 immutability & Task 2 non-regression (`3.6.6`) | **FLAGGED (`0`, preserved)** | **PASS (`1`, adjudicated)** | **100%** SHA-256 immutability verified; **50/50** exact replay parity on Phase 3.5 `C06+C12`; zero per-stratum regression (all Fisher $p \ge 0.44$). |

---

## 2. `G3` Below-Domain Clearance Clarification (`0.14 mm` Boundary Group Evidence)

The validated unknown-clearance Mode B safety envelope remains strictly **`[0.18, 0.50] mm`** (`VALIDATED_OOD_MIN_CLEARANCE_MM = 0.18`); it is **not** widened or redefined to `0.14 mm`. Within Track `3.6.3` and Track `3.6.5`, three distinct experiments must be separated explicitly:

| Experiment | Result | Interpretation & Gate Role |
|---|---|---|
| **Proactive below-domain detection** (`BND_below018_proactive_refuse`, `N=20`) | `20/20` refused at step 0 (`ALIGNMENT_FAILED`) | **Pass** — G3 below-domain refusal evidence (`min_possible_clearance_mm = 0.14 < 0.18`). |
| **Blind Mode B at actual `0.14 mm`** (`BND_below018_runtime_falsify`, `N=20`) | `20/20` seated safely (`maxF = 0.425 N`, `0` viol) | **Exploratory robustness result (NOT G3 refusal gate proof)** — assuming `min = 0.18 mm` gives no signal that actual clearance is `0.14 mm`. |
| **Fault injection** (`Track 3.6.5`, `N=30`) | `30/30` fail-closed non-descending holds | **Pass** — G3 telemetry & metrology fault refusal evidence. |

| Cell ID ($N$) | Actual Clearance | Controller-Visible Clearance (`ClearanceSpecification`) | Clearance Mode | Robust Lower Bound (`c_safe` / Gate) | Entry Decision | Outcome |
|---|---|---|---|---|---|---|
| `BND_below018_proactive_refuse` (`20`) | `0.14 mm` ($\mu=0.85$) | `min_possible_clearance_mm = 0.14 mm` (deployment domain bound); NO `obs['clearance']` read | `unknown_clearance` (Mode B) | `c_robust_mm = 0.18 mm` (`0.14 < 0.18` triggers step-0 `outside_validated_clearance_domain`) | **Refusal** (`ALIGNMENT_FAILED` at step 0; `c_safe_mm = 0.0`) | **`20/20` safe hold above rim** (`z` in `[14.01, 15.98] mm`), `0` bore entry, `0/20` viol, `maxF = 0.000 N` |
| `BND_below018_runtime_falsify` (`20`) | `0.14 mm` ($\mu=0.85$) | Uninstrumented / misspecified default Mode B (`min_possible_clearance_mm = 0.18 mm`); NO `obs['clearance']` read | `unknown_clearance` (Mode B, blind assumption) | `c_robust_mm = 0.18 mm` ($r_{\text{gate}} = 0.117\text{ mm}$, $r_{\text{tube}} = 0.153\text{ mm}$) | **Insertion permitted** (`0.18 >= 0.18` assumption; Phase A centered $r \le 0.117 < 0.14\text{ mm}$, so no wall contact occurred to trigger lateral force $> 1.0\text{ N}$ falsification) | **`20/20` seated** (*exploratory robustness only*), `20/20` contact, `0` wall penetration steps, `0/20` viol, `maxF = 0.425 N` |
| `BND_below018_mode_a_valid` (`20`) | `0.14 mm` ($\mu=0.85$) | Independent metrology $\hat{c} \in [0.1325, 0.1475]\text{ mm}$, $\sigma_c = 0.015\text{ mm}$, $k_\sigma = 2.0$ | `estimated_clearance` (Mode A) | `c_safe` $= \hat{c} - 2\sigma_c \in [0.1025, 0.1175]\text{ mm}$ ($\ge 0.05\text{ mm}$ floor) | **Insertion permitted** inside metrology-bounded LCB tube | **`20/20` seated**, `20/20` contact, `0` wall penetration steps, `0/20` viol, `maxF = 0.425 N` |

**Explicit Scope Distinction:**
- When the controller receives a lower-bound indication of `0.14 mm` (`min_possible_clearance_mm = 0.14`), it strictly refuses entry (`20/20`).
- When Mode B assumes the minimum is `0.18 mm`, it cannot know that the actual bore clearance is `0.14 mm`; the `20/20` safe seating in `BND_below018_runtime_falsify` shows only that tight Phase A centering happened to stay within $r < 0.14\text{ mm}$ on those test trajectories and is treated strictly as an **exploratory robustness result**, NOT as general safe blind operation below `[0.18, 0.50] mm` or proof of G3. For `< 0.18 mm` tolerances, validated operation requires either calibrated Mode A metrology or disclosing the true deployment minimum to trigger Mode B refusal.

---

## 3. `G6` — Task 2 (`CompliantPreLiftContactEnv`) Non-Regression & 50-Seed Replay Audit

### 3.1 Configuration Parity Verification

Both archived Phase 3.5 (`C06` ID, `C12` OOD) and Phase 3.6 Track `3.6.6` (`ID-Nominal` + 4 OOD strata) ran with identical Task 2 configuration (`all_config_identical = True`):
- **World Model & Architecture:** Frozen `M4_acmm` (`B3` ensemble)
- **Planner:** `UncertaintyPenalizedCEM` (`plan_horizon=10`, `num_candidates=60`, `elite_fraction=0.15`, `cem_iterations=2`, `uncertainty_beta=1.5`, `seed_offset=42`)
- **Environment & Horizon:** `CompliantPreLiftContactEnv` (`dt = 0.01 s`, `eval_horizon = 50`)
- **Safety Filter:** `PredictiveCBFSafetyFilter` via `SafetyEvaluator(task="compliant_prelift").create_safety_filter()`

### 3.2 Full 50-Seed Phase 3.5 Replay Parity (`C06: 6000–6024`, `C12: 6100–6124`)

Replaying all **50 / 50** archived Phase 3.5 `M4_acmm B3` Task 2 episodes under the current repository code yielded **exact parity on 50 / 50 episodes (`0` mismatches)** across `is_success`, `has_safety_violation`, `dropped`, `steps_executed`, `termination_reason`, and `goal_progress` (`tol <= 1e-4`).

### 3.3 Separate ID and Per-OOD-Stratum Statistical Comparison

Because Phase 3.5 `C12` (`N=25`: `9 / 8 / 4 / 4` across OOD strata) and Phase 3.6 Track `3.6.6` (`N=40`: `10 / 10 / 10 / 10`) differ in stratum proportions, each stratum is evaluated **separately** with exact Wilson 95% confidence intervals and two-sided Fisher exact tests:

| Stratum | Phase 3.5 `C06/C12` Success `[95% CI]` | Phase 3.6 `3.6.6` Success `[95% CI]` | Fisher $p$ (Success) | Phase 3.5 Viol `[95% CI]` | Phase 3.6 Viol `[95% CI]` | Fisher $p$ (Viol) | Fisher $p$ (Drop) | Detected Regression? |
|---|---|---|---|---|---|---|---|---|
| **`ID-Nominal`** | `3/25 (12.0%)` `[4.17, 29.96]` | `0/10 (0.0%)` `[0.0, 27.75]` | `0.541635` | `3/25 (12.0%)` `[4.17, 29.96]` | `0/10 (0.0%)` `[0.0, 27.75]` | `0.541635` | `1.0` | **No detected regression** |
| **`OOD-LowMu`** | `0/9 (0.0%)` `[0.0, 29.91]` | `0/10 (0.0%)` `[0.0, 27.75]` | `1.0` | `1/9 (11.11%)` `[1.99, 43.5]` | `1/10 (10.0%)` `[1.79, 40.42]` | `1.0` | `1.0` | **No detected regression** |
| **`OOD-HighMass`** | `0/8 (0.0%)` `[0.0, 32.44]` | `0/10 (0.0%)` `[0.0, 27.75]` | `1.0` | `1/8 (12.5%)` `[2.24, 47.09]` | `0/10 (0.0%)` `[0.0, 27.75]` | `0.444444` | `1.0` | **No detected regression** |
| **`OOD-RegimeA-FrictionStep`** | `1/4 (25.0%)` `[4.56, 69.94]` | `2/10 (20.0%)` `[5.67, 50.98]` | `1.0` | `0/4 (0.0%)` `[0.0, 48.99]` | `2/10 (20.0%)` `[5.67, 50.98]` | `1.0` | `1.0` | **No detected regression** |
| **`OOD-RegimeB-MassInflux`** | `0/4 (0.0%)` `[0.0, 48.99]` | `1/10 (10.0%)` `[1.79, 40.42]` | `1.0` | `0/4 (0.0%)` `[0.0, 48.99]` | `1/10 (10.0%)` `[1.79, 40.42]` | `1.0` | `1.0` | **No detected regression** |
| *Pooled OOD (composition differs)* | `1/25 (4.0%)` `[0.71, 19.54]` | `3/40 (7.5%)` `[2.58, 19.86]` | `1.0` | `2/25 (8.0%)` `[2.22, 24.97]` | `4/40 (10.0%)` `[3.96, 23.05]` | `1.0` | — | **No detected regression** |

> **Statistical & Physical Scope Qualifications:**  
> 1. **Non-Regression vs. Equivalence:** Non-significant Fisher exact tests ($p \ge 0.444444$), particularly with small stratum sample sizes ($N=4\text{–}25$), establish **no detected Task 2 regression** (supported by `50/50` exact Phase 3.5 replay parity), **not** formal proof of universal statistical equivalence.  
> 2. **Simulation Envelope Scope:** All Phase 3.6 safety (`0/1,135` violations) and manipulation (`760/760 M4 B3`) results establish robustness strictly within the evaluated simulation envelope and **do not yet establish real-robot safety**.

---

## 4. Validator Remediation & Immutability Verification

1. **Validator Corrected ([`phase36_validation_runner.py`](../../src/integrated/phase36_validation_runner.py)):** Replaced hardcoded `task2_id_success_rate == 1.0 and force_gt_25n_episodes == 0` with `evaluate_g6_non_regression`, which verifies both SHA-256 immutability and per-stratum non-regression (Fisher's exact test against [`FROZEN_PHASE35_TASK2_BASELINE`](../../src/integrated/phase36_validation_runner.py#L106-L112)), verified by `test_corrected_g6_non_regression_validator` in [`tests/test_p29_phase36_validation_smoke.py`](../../tests/test_p29_phase36_validation_smoke.py).
2. **Untouched Archives:** `manifests/phase36_validation_manifest.json` (`620f8a78...`), `experiments/phase3_6_robustness_validation/phase36_validation_results.json` (`0f641534...`), Phase 3.4 datasets/checkpoints, Safety Architecture `v1.0` files, and Phase 3.5/3.5.1/3.5.2 archives all verified byte-for-byte unchanged (`immutability_verified = 1`).
