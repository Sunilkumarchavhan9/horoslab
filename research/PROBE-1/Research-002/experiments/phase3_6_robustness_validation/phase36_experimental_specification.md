# HOROS PROBE-1 — Research-002 Phase 3.6 Experimental Specification & Readiness Dossier

**Phase:** 3.6 — Robustness Validation of Geometry-Aware Contact Manipulation (`DESIGN_FROZEN_AWAITING_EXECUTION_AUTHORIZATION`)  
**Frozen Safety Architecture:** `v1.0-phase3.5.2-accepted` (`GeometryAwareCBFSafetyFilter` + `TwoPhasePegInHoleController`)  
**Frozen Validation Manifest:** `manifests/phase36_validation_manifest.json` (`manifest_sha256: 620f8a7875a00b3e70818d905eda2e971e96044022782cfdc559e94edcebb5e1`)  
**Protocol Module / Readiness Preflight:** `src/integrated/phase36_validation_protocol.py` / `scripts/prepare_phase36_validation.py`

> [!IMPORTANT]
> **Authorization Boundary:** Only Phase 3.6 protocol design and readiness are authorized here. All `1,215` planned validation episodes remain **unexecuted** pending review and execution authorization of this specification. `B1–B4` weights, `B4` calibration artifacts, Phase 3.4 bundles, and Safety Architecture `v1.0` stay **100% frozen**.

---

## 1. Scientific Objective & Six Workstreams

**Core Question:** Can `GeometryAwareCBFSafetyFilter v1.0` paired with frozen learned world models (`B1–B4`) maintain zero catastrophic safety violations while sustaining high physical seating and contact acquisition across the full ID/OOD operating envelope, unseen geometries, extreme initial misalignment, and mid-insertion disturbances?

| Workstream | Objective | Artifacts / Execution Scope |
|---|---|---|
| **3.6.1** | Freeze Safety Architecture v1.0, shadow baseline policy, and pre-registered protocol | `phase36_validation_protocol.py`, `phase36_validation_manifest.json`, SHA-256 lock |
| **3.6.2** | Validate ID + all four OOD corners (`N=60`/corner paired Mode A & B on `M4|B3`, + `M4|B1`, `M0|B3`) | `775` episodes on `300` fresh seeds (`8000–8299`) |
| **3.6.3** | Test unseen interior interpolations + below-domain/high-friction boundaries | `240` episodes across `12` cells (`8300–8539`) |
| **3.6.4** | Stress-test extreme radial offset, high tilt, near-rim entry, and mid-insertion impulses | `120` episodes across `4` stress modes (`8600–8719`) |
| **3.6.5** | Evaluate fail-closed fault/metrology rejection, recovery, and shadow `PredictiveCBF` diffs | `30` targeted fault scenarios (`8720–8749`) + step logs from Tracks `3.6.2–3.6.4` |
| **3.6.6** | Verify Task 2 non-regression (`ID` + `4 OOD strata`) and produce final statistical report | `50` Task 2 episodes (`8800–8849`) + paired statistical comparison |

---

## 2. Sample Size Justification & Statistical Power (`3.6.1`)

To tighten the Phase 3.5.2 pilot bound (`0 / 30 -> 9.503%` overall, `39.304%` per 6-episode condition) to `<= 5.0%` per individual physical condition under zero observed violations:
- Required binomial sample count at 95% one-sided Clopper-Pearson confidence ($\alpha = 0.05$):  
  $$N_{\min} = \left\lceil \frac{\ln(0.05)}{\ln(1 - 0.05)} \right\rceil = 59 \implies \text{chosen } N = 60 \text{ episodes per corner}.$$
- **Realized 1-sided 95% UCB for `0` observed violations (`M4_acmm | B3`):**
  - Per single condition (`N = 60`, Mode A or Mode B individually): **`4.8703%`** (`<= 5.0%`)
  - Across all 4 OOD corners per mode (`N = 240`): **`1.2405%`**
  - Overall across ID + OOD per mode (`N = 300`): **`0.9936%`**
  - Pooled `M4_acmm | B3` (`Mode A + Mode B`, `N = 600`): **`0.4980%`**

---

## 3. Physical-Condition Matrix & Evaluation Budget (`1,215` Episodes)

### Track `3.6.2` — Primary Physical Envelope (`775` Episodes, Paired Seeds `8000–8299`)
- **Physical corners (`5`):** `ID (0.50, 0.50)`, `OOD_mu075_clr018 (0.75, 0.18)`, `OOD_mu075_clr025 (0.75, 0.25)`, `OOD_mu085_clr018 (0.85, 0.18)`, `OOD_mu085_clr025 (0.85, 0.25)`.
- **Per-corner allocation (`155` episodes × `5` corners = `775`):**
  - `M4_acmm | B3 | Mode A (estimated_clearance)`: `60` episodes (`UCB_95 = 4.87%`)
  - `M4_acmm | B3 | Mode B (unknown_clearance)`: `60` episodes paired on the exact same `60` seeds (`UCB_95 = 4.87%`)
  - `M4_acmm | B1 | Mode B`: `20` episodes (first `20` seeds per corner, deterministic WM check, `UCB_95 = 13.91%`)
  - `M0_passive | B3 | Mode B`: `15` episodes (first `15` seeds per corner, tracked **separately** so free-space stalls are never pooled into `M4` in-contact safety claims)

### Track `3.6.3` — Unseen Interpolation & Boundary Stress (`240` Episodes, Seeds `8300–8539`)
- **8 unseen interior combinations (`160` ep, `20` ep/cell, `8300–8459`):**
  `(0.60, 0.35)`, `(0.65, 0.22)`, `(0.80, 0.20)`, `(0.75, 0.22)`, `(0.85, 0.21)` under Mode B (`unknown_clearance`); `(0.60, 0.20)`, `(0.70, 0.30)`, `(0.80, 0.35)` under Mode A (`estimated_clearance`).
- **4 boundary stress cells (`80` ep, `20` ep/cell, `8460–8539`):**
  1. `BND_below018_runtime_falsify` `(0.85, 0.14)` Mode B (`c_robust=0.18`): validates runtime `contact_resistance_below_validated_domain` detection & safe retract (`z > 0`) before dynamic crush.
  2. `BND_below018_proactive_refuse` `(0.85, 0.14)` Mode B (`min_possible_clearance=0.14`): validates proactive refusal prior to entry.
  3. `BND_below018_mode_a_valid` `(0.85, 0.14)` Mode A (`c_hat=0.14, sigma=0.015 -> c_safe=0.11`): validates valid narrow-metrology adaptation below `0.18 mm`.
  4. `BND_high_mu095_clr018` `(0.95, 0.18)` Mode B: stress-tests friction above `0.85` corner.

### Track `3.6.4` — Pose, Tilt, Near-Rim & Disturbance Stress (`120` Episodes, Seeds `8600–8719`)
Worst-case OOD corner `(mu = 0.85, c = 0.18 mm)`, `M4_acmm | B3 | Mode B`, `30` episodes each (`UCB_95 = 9.503%`/mode):
- `STRESS_A_large_radial_offset` (`8600–8629`): `r0 in [2.5, 4.5] mm`, low start `z0 in [2.0, 5.0] mm`
- `STRESS_B_high_initial_tilt` (`8630–8659`): `tilt0 in [1.2, 2.5] deg` (`4.6x–9.7x` OOD `theta_crit = 0.258 deg`)
- `STRESS_C_near_rim_contact_acq` (`8660–8689`): `z0 in [0.25, 1.0] mm` + immediate plunge probe
- `STRESS_D_mid_insertion_impulse` (`8690–8719`): `20 N` / `2.0 deg` lateral+tilt disturbance at `z ~ -15 mm`

### Track `3.6.5` (`30` Scenarios, `8720–8749`) & Track `3.6.6` (`50` Ep, `8800–8849`)
- **Track `3.6.5`:** Fault-injection fail-closed checks (`10` non-finite state/wrench + `10` invalid/narrow Mode A metrology + `10` invalid stratum / non-finite WM predictions), plus step-by-step live vs read-only shadow `PredictiveCBFSafetyFilter` comparison across Tracks `3.6.2–3.6.4`.
- **Track `3.6.6`:** Task 2 (`CompliantPreLiftContactEnv`) ID + all 4 OOD strata × `10` ep = `50` episodes verifying zero Task 2 regression.

---

## 4. Seed Disjointness & Budget Summary

Total unique fresh seeds allocated: **`740` seeds (`pairwise_overlap_count = 0`)** across all Phase 3 training (`1000–1159`), calibration (`2000–2359`), offline (`3000–3119`), Phase 3.5 closed-loop (`6000–6224`), P2.6 excluded, and Phase 3.5.2 pilot (`7500–7529`) pools.
- **Total Evaluation Episodes:** **`1,215`** (`775 + 240 + 120 + 30 + 50`)
- **Estimated Single-Host CPU Runtime (at `2.15 s/ep` empirical Phase 3.5.2 rate):** **`~43.5 minutes`** (can be checkpointed cleanly per track).

---

## 5. Pre-Registered Safety & Statistical Acceptance Gates

- **G1 (Zero Catastrophic Violations):** `0` dynamic-crush (`> 40 N / > 8 Nm`) and `0` `SafetyEvaluator` (`> 35 N / > 7 Nm`) violations across Tracks `3.6.2`, `3.6.3`, and `3.6.4`.
- **G2 (Non-Degenerate Contact & Seating):** Valid-domain `M4_acmm` episodes achieve `>= 90%` seating success and `>= 95%` physical bore contact acquisition (`M0_passive` reported separately).
- **G3 (Boundary & Fault Refusal):** `100%` of below-domain `0.14 mm` Mode B & fault-injected trials refuse cleanly / hold `z > 0` with `0` violations.
- **G4 (Pose & Impulse Safety):** `0` dynamic-crush violations in Track `3.6.4`, with transparent separation between `seated_success` and `ALIGNMENT_FAILED` hold rates.
- **G5 (Oracle & Shadow Isolation):** Zero sensitivity to `obs["clearance"]` / `obs["friction"]` mutation; baseline `PredictiveCBFSafetyFilter` executed strictly read-only in shadow mode.
- **G6 (Immutability & Task 2 Non-Regression):** Exact SHA-256 preservation of Safety Architecture `v1.0`, `B1–B4` checkpoints, Phase 3.4/3.5/3.5.1/3.5.2 artifacts, and Task 2 parity.
