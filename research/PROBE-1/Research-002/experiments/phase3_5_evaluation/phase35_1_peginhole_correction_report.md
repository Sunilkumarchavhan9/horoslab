# HOROS PROBE-1 — Research-002: Phase 3.5.1 Targeted Peg-in-Hole Correction Report

**Program Status:** Targeted Phase 3.5.1 Remediation Complete (Scope strictly limited to `C13–C18` Peg-in-Hole; Phase 3.6–3.8 remains unauthorized pending review)  
**Immutable Archives Preserved:** All four original 570-episode Phase 3.5 JSON archives and both Phase 3.5 Closure Addendum files remain byte-for-byte unchanged (`SHA-256` verified before and after execution).  
**Re-Evaluated Scope:** `6` Peg-in-Hole closed-loop cells (`C13–C18`, `25` episodes/cell = `150` episodes; preserved frozen seeds `6200–6224`; frozen horizon `H = 50`; frozen Phase 3.4 checkpoints and `PredictiveCBFSafetyFilter` unchanged).

---

## Executive Summary

Phase 3.5.1 resolved the Peg-in-Hole closed-loop planner reward sign inversion identified during the Phase 3.5 Scientific Closure Review and instrumented why five of six Peg-in-Hole cells (`C14–C18`, `125/125` episodes) previously stalled in free space at `0.000 N` peak force.

Two compounding defects caused the original `0/150 (0.0%)` seating failure and `150/150 (100.0%)` temporal truncation:
1. **Reward Sign Inversion (`3.5.1-A`):** The original `reward_fn` inside `PlannerEvaluator` and `MiningEvaluator` negated `-min(0.0, peg_z) * 5.0`, penalizing insertion below the hole rim (`z < 0 mm`) by `-5.0/mm` (`z = -50 mm -> -250.0`) so that `z = 0.0 mm` (`15.0 mm` depth) was the global maximum.
2. **CEM Step-Scale & Cold-Start Bottleneck + World-Model Bias (`3.5.1-B`):** `CEMPlanner` and `UncertaintyPenalizedCEM` defaulted to scalar `init_std = 0.5` (`10%` of Task 1's `[-5, 5] mm/step` translational bound vs `50%` on Task 2's `[-1, 1]`), with `60 x 2` cold-started planning iterations per step. Fixing the reward alone (`Reward-Fix Only 60x2`) still left **all six cells at `0/6 (0.0%)` seating** in paired 6-seed diagnostics (`C16`: `0/6` contact, `1.53 mm` mean depth; `C14/C15`: `0.00 N` force). Under `M0_passive`, learned upward free-space drift (`+1.70 to +4.11 mm/step` at `a=0`) and strong negative correlation between downward motion and uncertainty (`M0|B2 corr(dz, alea) = -0.9037`; `M0|B3 corr(dz, epi) = -0.8915`) caused `C14/C15` to actively avoid downward motion (`z -> +18 to +24 mm`).

Restoring a monotone physical reward toward seating (`z = -50.0 mm`, capped at `50 mm`, over-penetration penalized) together with Task-1-scaled CEM exploration (`num_candidates = 100`, `cem_iterations = 3`, `init_std = [0.5, 0.5, 1.5, 0.3, 0.3, 0.1]`, shifted trajectory `warm_start = True`) unlocked full hole insertion on In-Distribution (`Peg-ID`, `0.50 mm` clearance) geometry under `M4|B3` (`C18`) while starkly exposing real sim/control/OOD limits:

- **`C18 (M4_acmm | B3)` achieved `8/25 (32.0%)` seating overall (`95% CI [17.21%, 51.59%]`), driven by `8/10 (80.0%)` ID seating (`7/10 = 70.0%` clean without violation, depth `63.53 mm`) vs `0/15 (0.0%)` OOD seating (`15/15` dynamic crush at `0.18–0.25 mm` tight clearance).**
- **Across all `150` re-evaluated episodes**, seating rose from `0/150 (0.0%)` to `10/150 (6.67%)` (`McNemar exact p = 1.953125e-03`, Holm `2.734200e-02`), and mean insertion depth increased from `7.32 mm` to `20.28 mm` (`+12.96 mm`, `Wilcoxon p = 1.669761e-16`, Holm `2.504642e-15`; in `M4_acmm`: `8.04 -> 30.50 mm`, `Holm p = 7.392522e-13`).
- **Critical Negative & Safety Findings Remain Unchanged:** Within Phase 3.5.1 (`N=75` per training condition), pooled `M4` vs `M0` seating difference (`8/75 = 10.67%` vs `2/75 = 2.67%`) is **not** statistically significant (`McNemar p = 1.093750e-01`, Holm `4.375000e-01`), while `M4` safety violations (`68/75 = 90.67%`) significantly exceed `M0` (`23/75 = 30.67%`, `p = 5.684342e-14`, Holm `4.547474e-13`) because `M4` aggressively enters tight OOD clearances (`0/90` OOD success across `ID-only` world models and `PredictiveCBFSafetyFilter` hardcoded at `1.8 deg` critical wedge angle vs `0.258–0.358 deg` true OOD physics) whereas `M0|B2/B3` never reach contact (`0/50` contact).

---

## 1. Scope & Archive Immutability Verification

| Artifact | Verification Status | SHA-256 |
|---|---|---|
| `phase35_offline_120ep_results.json` | Unchanged (Original Phase 3.5) | `0d700fdec06324ce76c687c3557358c4e4232c1f1d8e9923000883fe201812f1` |
| `phase35_closed_loop_450ep_results.json` | Unchanged (Original Phase 3.5) | `8bb42e1a852c9dc61446d9f4fd689c596b1763e675b81a5754aa0ae0bc859653` |
| `phase35_statistical_comparison.json` | Unchanged (Original Phase 3.5) | `b4f90493b84c2414ce5f97f3143be69e562edb0e5559c9d292318430fc409fec` |
| `phase35_master_report.json` | Unchanged (Original Phase 3.5) | `3945a8cc988c990933470dfec31efd651f808819ae4933325b5eb772ba7ec745` |
| `phase35_closure_addendum.json` | Unchanged (Closure Addendum) | `87bae105f7d78eb92faec7f33a158d733af252a863aaf1005d6d0c8a772fab47` |
| `phase35_closure_addendum_report.md` | Unchanged (Closure Addendum) | `cadaf4419ecb1d8e840a24e59db2ab43a46913480d55caec1fd1741582619693` |

- **Task 2 (`compliant_prelift`, `C01–C12`) & Offline Suite (`3000–3119`):** Untouched. Vector `init_std` and `warm_start` default to `None` / `False` in `CEMPlanner`, `UncertaintyPenalizedCEM`, and `PlannerEvaluator`, keeping Task 2 behavior bit-for-bit compatible.
- **Total Run Accounting:** `150` episodes (`6` cells x `25` seeds `6200–6224`: `10` ID `6200–6209` + `15` OOD `6210–6224`), `H = 50`, runtime `423.59 s`.

---

## 2. Workstream `3.5.1-A`: Canonical Peg-in-Hole Reward Correction

Implemented canonical [`compute_peg_in_hole_planner_reward`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/planners/cem_planner.py) (re-exported in [`planner_evaluator.py`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/integrated/planner_evaluator.py)) in physical units (`mm`, `deg`, `N`, `N*m`), wired uniformly into both `PlannerEvaluator` and `MiningEvaluator`:
- Hover above rim: `-2.0 * max(0.0, peg_z)`
- Bounded insertion depth: `+5.0 * min(max(0.0, -peg_z), 50.0)`
- Over-penetration beyond `-50.0 mm`: `-3.0 * max(0.0, -peg_z - 50.0)`
- Seating bonus gated on low load: `+50.0` iff `peg_z <= -50.0` and `||w|| < 15.0 N`
- Alignment & load deterrence: `-8.0 * ||pos[:2]|| - 4.0 * ||rot[:2]|| - 0.1 * ||w|| - 3.0 * max(0.0, ||w|| - 30.0)`
- Smooth lateral/tilt control regularization: `-0.8 * ||a[:2]||^2 - 0.5 * ||a[3:5]||^2` (leaves pure vertical plunge unpenalized)

### Exact Depth & Constraint Checkpoints (`x = y = tilt = wrench = 0`, `a = 0`)

| `peg_z (mm)` | Depth Below Rim (`mm`) | Corrected Reward | Legacy Buggy Reward | Interpretation |
|---:|---:|---:|---:|---|
| `+15.0` | `0.0` | **`-30.0`** | `-22.5` | Hovering at start position |
| `0.0` | `0.0` | **`0.0`** | `0.0` | Rim entry (former false global peak) |
| `-2.0` | `2.0` | **`+10.0`** | `-10.0` | Shallow insertion |
| `-25.0` | `25.0` | **`+125.0`** | `-125.0` | Mid-hole monotonic gain |
| **`-50.0`** | **`50.0`** | **`+300.0`** | **`-250.0`** | **Unique global peak (seating threshold)** |
| `-60.0` | `60.0` | `+270.0` | `-300.0` | Over-penetration penalized |
| `-80.0` | `80.0` | `+210.0` | `-400.0` | Deep overrun strongly penalized |

Additional verified checks (`PlannerEvaluator == MiningEvaluator` to `< 1e-9`):
- Alignment at `z = -25 mm`: `125.0` aligned vs `109.0` (`2 mm` lateral error) and `117.0` (`2 deg` tilt).
- Load sensitivity: `299.5` seated (`-50 mm, 5 N`) vs `248.0` wedged (`-50 mm, 20 N`, seating bonus disabled); `75.5` overloaded (`-25 mm, 45 N`).
- Action effort sensitivity at `z = -10 mm`: `50.0` for pure plunge `[0,0,-4,0,0,0]` vs `42.6` for noisy lateral/tilt `[2,2,-4,1,1,0]`.

---

## 3. Workstream `3.5.1-B`: Free-Space Stall Diagnostics & Reward-Only Ablation

### 3.1 Pre-Edit World Model Free-Space Bias & Uncertainty Coupling (`z = 15.0 mm`)

| Model | Zero-Action `[dx, dy, dz] (mm)` | `dz_pred` at `a_z = -5` | Linear `dz / da_z` | `Epi` (`a_z = -5` / `0`) | `Alea` (`a_z = -5` / `0`) | `Corr(dz, Epi)` | `Corr(dz, Alea)` |
|---|---|---:|---:|---:|---:|---:|---:|
| `M0 \| B1` | `[+0.561, -0.734, +4.105]` | `-7.419` | `1.983` | `0.00 / 0.00` | `0.00 / 0.00` | `0.000` | `0.000` |
| `M0 \| B2` | `[+1.132, -0.482, +2.157]` | `-7.859` | `1.366` | `0.00 / 0.00` | `212.26 / 139.64` | `0.000` | **`-0.9037`** |
| `M0 \| B3` | `[+0.254, -0.023, +1.695]` | `-7.876` | `1.291` | `67.34 / 44.28` | `179.94 / 126.31` | **`-0.8915`** | `-0.7133` |
| `M4 \| B1` | `[+0.484, +0.540, -1.487]` | `-3.930` | `0.644` | `0.00 / 0.00` | `0.00 / 0.00` | `0.000` | `0.000` |
| `M4 \| B2` | `[+0.430, +0.340, -1.782]` | `-3.733` | `0.617` | `0.00 / 0.00` | `89.57 / 78.24` | `0.000` | **`+0.8134`** |
| `M4 \| B3` | `[+0.047, +0.069, -1.497]` | `-3.904` | `0.580` | **`14.28 / 61.13`** | `85.53 / 92.02` | **`+0.9612`** | `+0.9004` |

**Mechanistic Explanation of Free-Space Stalls:**
- Because `M0_passive` lacked mined Mode 1–3 trajectories (`tr = 0`), its models learned an **upward free-space zero-action bias** (`+1.70 to +4.11 mm/step`) AND predicted sharply higher uncertainty for negative `dz` (`M0|B2 corr(dz, alea) = -0.9037`, `M0|B3 corr(dz, epi) = -0.8915`). Under `UncertaintyPenalizedCEM` (`beta = 1.5`), descending incurred a ~`2,130` cumulative uncertainty penalty (`C14` trace), driving `z` upward from `14.27 -> 23.92 mm` instead of descending.
- Under `M4_acmm`, zero-action bias was **downward** (`-1.49 to -1.78 mm/step`), and `M4|B3` epistemic norm **dropped** cleanly on downward trajectories (`14.28` at `a_z = -5` vs `61.13` at `a_z = 0`, `corr(dz, epi) = +0.9612`), confirming why `M4|B3` was uniquely positioned to plunge cleanly once the inverted reward and undersized `init_std = 0.5` were corrected.

### 3.2 Three-Stage Instrumented Trace (`C14 M0|B2` & `C18 M4|B3`, ID Seed `6200` & OOD Seed `6210`)

| Cell / Seed | Configuration | `z` Start -> End (`mm`) | Depth (`mm`) | Contact Step | `F_max (N)` | Mean Raw `dz` | Mean Exec `dz` | `CBF Plunge / Tilt / Lat` | Unc Penalty | Outcome |
|---|---|---|---:|---:|---:|---:|---:|---|---:|---|
| `C14` (`6200` ID) | `1. Buggy 60x2 std=0.5` | `14.27 -> 8.88` | `6.12` | `None` | `0.00` | `-0.1078` | `-0.1078` | `0 / 23 / 0` | `2134.3` | Truncated (free space) |
| `C14` (`6200` ID) | `2. RewardFix 60x2 std=0.5` | `14.27 -> 14.26` | `0.74` | `None` | `0.00` | `-0.0003` | `-0.0003` | `0 / 8 / 0` | `2159.6` | Truncated (uncertainty halt) |
| `C14` (`6200` ID) | `3. Scaled 100x3 warmstart` | `14.27 -> 23.92` | `0.00` | `None` | `0.00` | `+0.1930` | `+0.1930` | `0 / 27 / 0` | `2136.9` | Truncated (upward avoid) |
| `C18` (`6200` ID) | `1. Buggy 60x2 std=0.5` | `14.27 -> 5.50` | `9.50` | `None` | `0.00` | `-0.1755` | `-0.1755` | `0 / 25 / 0` | `836.3` | Truncated (reward peak at `z=0`) |
| `C18` (`6200` ID) | `2. RewardFix 60x2 std=0.5` | `14.27 -> -2.96` | `17.96` | `40` | `22.07` | `-0.3449` | `-0.3449` | `0 / 21 / 2` | `860.0` | Truncated (`18 mm` at `t=50`) |
| **`C18` (`6200` ID)** | **`3. Scaled 100x3 warmstart`** | **`14.27 -> -50.45`** | **`65.45`** | **`6`** | **`6.09`** | **`-4.5736`** | **`-4.5736`** | **`0 / 1 / 5`** | **`361.9`** | **Clean Seated (`15` steps)** |
| `C18` (`6210` OOD) | `1. Buggy 60x2 std=0.5` | `14.43 -> 1.62` | `13.38` | `None` | `0.00` | `-0.2561` | `-0.2561` | `0 / 27 / 0` | `821.9` | Truncated (free space) |
| `C18` (`6210` OOD) | `2. RewardFix 60x2 std=0.5` | `14.43 -> -1.54` | `16.54` | `40` | `25.43` | `-0.3196` | `-0.3196` | `0 / 22 / 0` | `909.6` | Truncated (`16.5 mm` at `t=50`) |
| `C18` (`6210` OOD) | `3. Scaled 100x3 warmstart` | `14.43 -> -4.98` | `19.98` | `4` | **`236.25`** | `-4.0624` | `-3.2673` | `1 / 1 / 0` | `515.7` | **Dynamic Crush (`0.18 mm` clr)** |

Notice that `PredictiveCBFSafetyFilter` force plunge dampening fired `0` times across every pre-fix and reward-fix-only free-space trace (`max_abs(raw_dz - exec_dz) == 0.0`). In OOD seed `6210` (`0.18 mm` clearance), plunge damping engaged once (`step 4+`), reducing `exec_dz` by up to `4.77 mm/step`, yet the tight wedging angle (`0.258 deg` vs hardcoded `1.8 deg`) produced a `236.25 N` impact force spike by step `6`.

### 3.3 Paired 6-Seed Ablation: Reward Fix Only (`60x2, std=0.5`) vs Phase 3.5.1 Scaled CEM (`100x3, vec std, warmstart`)

Evaluated on paired seeds `[6200, 6201, 6202, 6210, 6211, 6212]` (`3` ID + `3` OOD):

| Cell | Config A (`Reward-Fix Only 60x2`): Seat / Contact / Viol / Mean Depth | Config B (`Reward + Scaled CEM 100x3`): Seat / Contact / Viol / Mean Depth |
|---|---|---|
| `C13 (M0\|B1)` | `0/6 (0.0%)` \| `4/6 (66.7%)` \| `0/6 (0.0%)` \| `15.70 mm` | `0/6 (0.0%)` \| `6/6 (100.0%)` \| `6/6 (100.0%)` \| `27.10 mm` |
| `C14 (M0\|B2)` | `0/6 (0.0%)` \| `0/6 (0.0%)` \| `0/6 (0.0%)` \| `1.85 mm` | `0/6 (0.0%)` \| `0/6 (0.0%)` \| `0/6 (0.0%)` \| `0.00 mm` |
| `C15 (M0\|B3)` | `0/6 (0.0%)` \| `0/6 (0.0%)` \| `0/6 (0.0%)` \| `0.00 mm` | `0/6 (0.0%)` \| `0/6 (0.0%)` \| `0/6 (0.0%)` \| `0.00 mm` |
| `C16 (M4\|B1)` | `0/6 (0.0%)` \| `0/6 (0.0%)` \| `0/6 (0.0%)` \| `1.53 mm` | `0/6 (0.0%)` \| `6/6 (100.0%)` \| `6/6 (100.0%)` \| `30.46 mm` |
| `C17 (M4\|B2)` | `0/6 (0.0%)` \| `2/6 (33.3%)` \| `1/6 (16.7%)` \| `13.79 mm` | `0/6 (0.0%)` \| `6/6 (100.0%)` \| `6/6 (100.0%)` \| `31.41 mm` |
| **`C18 (M4\|B3)`** | `0/6 (0.0%)` \| `6/6 (100.0%)` \| `1/6 (16.7%)` \| `18.07 mm` | **`3/6 (50.0%)`** \| `6/6 (100.0%)` \| `3/6 (50.0%)` \| **`45.48 mm`** |

Reward correction alone left all `36/36` ablation episodes unseated (`0/6` even in `C18`) because `std_z = 0.5` restricted open-loop rollouts to `-0.35 mm/step` (`17.5 mm` over `50` steps). Adding `init_std = [0.5, 0.5, 1.5, 0.3, 0.3, 0.1]`, `100 x 3`, and warm-starting unlocked `3/3` ID seatings on `C18` (`6200–6202`: `65.45, 66.07, 66.95 mm`).

---

## 4. Workstream `3.5.1-C`: Full `150`-Episode Re-Evaluation (`C13–C18`, `H = 50`, Seeds `6200–6224`)

### 4.1 Per-Cell Closed-Loop Results (`N = 25` per Cell)

| Cell | Cond \| Arch | Success (95% Wilson CI) | Violations | Clean Success | Contact (`F>0`) | Depth Mean / Med (IQR) `mm` | `F_max` Mean (`N`) | Trunc / Crush Tax | Step PEG Mean | Lat p50/p95 (`ms`) | B4 1-Step |
|---|---|---|---:|---:|---:|---:|---:|---|---:|---:|---|
| `C13` | `M0 \| B1` | `2/25 (8.0%)` `[2.22, 24.97]` | `23/25 (92.0%)` | `2/25 (8.0%)` | `25/25 (100%)` | `30.15 / 22.92 (17.45)` | `67.76` | `0 / 23` | `362.43` | `67.4 / 79.3` | `180/239 (75.31%)` |
| `C14` | `M0 \| B2` | `0/25 (0.0%)` `[0.00, 13.32]` | `0/25 (0.0%)` | `0/25 (0.0%)` | `0/25 (0.0%)` | `0.00 / 0.00 (0.00)` | `0.00` | `25 / 0` | `-672.48` | `71.1 / 91.0` | `N/A` |
| `C15` | `M0 \| B3` | `0/25 (0.0%)` `[0.00, 13.32]` | `0/25 (0.0%)` | `0/25 (0.0%)` | `0/25 (0.0%)` | `0.00 / 0.00 (0.00)` | `0.00` | `25 / 0` | `-1523.49` | `114.5 / 131.0` | `N/A` |
| `C16` | `M4 \| B1` | `0/25 (0.0%)` `[0.00, 13.32]` | `25/25 (100.0%)` | `0/25 (0.0%)` | `25/25 (100%)` | `24.89 / 19.53 (9.44)` | `86.61` | `0 / 25` | `702.87` | `70.1 / 80.9` | `195/240 (81.25%)` |
| `C17` | `M4 \| B2` | `0/25 (0.0%)` `[0.00, 13.32]` | `25/25 (100.0%)` | `0/25 (0.0%)` | `25/25 (100%)` | `26.59 / 19.86 (16.22)` | `119.92` | `0 / 25` | `832.19` | `71.1 / 87.9` | `N/A` |
| **`C18`** | **`M4 \| B3`** | **`8/25 (32.0%)`** `[17.21, 51.59]` | **`18/25 (72.0%)`** | **`7/25 (28.0%)`** | **`25/25 (100%)`** | **`40.02 / 27.30 (45.04)`** | **`63.93`** | **`0 / 17`** | **`955.04`** | `112.3 / 127.3` | `N/A` |

*(Note: Cell table `Step PEG Mean` averages per executed step `n = 239..1250`, whereas paired episode tests below compare episode-level `peg_mean` across `N = 25` episodes: e.g., `C18` episode-mean PEG = `812.68`, `C13` = `247.51`, `C16` = `575.67`, `C17` = `690.42`.)*

### 4.2 Disaggregated `Peg-ID (N=10)` vs `Peg-OOD (N=15)` Breakdown

| Cell | Model | ID Success (`6200–6209`, `clr=0.50 mm`) | ID Violations | ID Clean Success | ID Depth Mean (`mm`) | OOD Success (`6210–6224`, `clr=0.18/0.25 mm`) | OOD Violations | OOD Depth Mean (`mm`) |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| `C13` | `M0\|B1` | `2/10 (20.0%)` | `8/10 (80.0%)` | `2/10 (20.0%)` | `46.37` | `0/15 (0.0%)` | `15/15 (100.0%)` | `19.34` |
| `C14` | `M0\|B2` | `0/10 (0.0%)` | `0/10 (0.0%)` | `0/10 (0.0%)` | `0.00` | `0/15 (0.0%)` | `0/15 (0.0%)` | `0.00` |
| `C15` | `M0\|B3` | `0/10 (0.0%)` | `0/10 (0.0%)` | `0/10 (0.0%)` | `0.00` | `0/15 (0.0%)` | `0/15 (0.0%)` | `0.00` |
| `C16` | `M4\|B1` | `0/10 (0.0%)` | `10/10 (100.0%)` | `0/10 (0.0%)` | `34.66` | `0/15 (0.0%)` | `15/15 (100.0%)` | `18.38` |
| `C17` | `M4\|B2` | `0/10 (0.0%)` | `10/10 (100.0%)` | `0/10 (0.0%)` | `38.26` | `0/15 (0.0%)` | `15/15 (100.0%)` | `18.81` |
| **`C18`** | **`M4\|B3`** | **`8/10 (80.0%)`** | **`3/10 (30.0%)`** | **`7/10 (70.0%)`** | **`63.53`** | **`0/15 (0.0%)`** | **`15/15 (100.0%)`** | **`24.35`** |

**Pooled Marginals:**
- **`M0_passive (N=75)`:** Success `2/75 (2.67%)`, Violations `23/75 (30.67%)`, Contact `25/75 (33.33%)`, Mean depth `10.05 mm` (`med = 0.00`).
- **`M4_acmm (N=75)`:** Success `8/75 (10.67%)`, Violations `68/75 (90.67%)`, Clean `7/75 (9.33%)`, Contact `75/75 (100.0%)`, Mean depth `30.50 mm` (`med = 21.07`).
- **`ID (N=60)` vs `OOD (N=90)`:** `10/60 (16.67%)` vs `0/90 (0.0%)` success; `31/60 (51.67%)` vs `60/90 (66.67%)` violations; `30.47 mm` vs `13.48 mm` mean depth.
- **ID Inspection of `C18` (`M4|B3`):** `8/10` ID seeds seated cleanly within `15–22` steps (`65.45–67.54 mm` depth; `Fmax = 6.09–31.57 N` on the `7` clean successes; `6207` seated at `65.88 mm` with peak transient `36.21 N > 35 N`; `6203` & `6209` hit `dynamic_crush` at `103.94 N` and `110.44 N`). All `15/15` OOD tight-clearance episodes (`0.18–0.25 mm`) wedged (`dynamic_crush`).

---

## 5. Paired Statistical Comparisons (Exact Nonzero `p`-Values & Holm-Bonferroni)

### 5.1 Within Phase 3.5.1: `M4_acmm` vs `M0_passive` & Planner Contrasts

| Contrast | Metric | `M4` (or `Arch A`) | `M0` (or `Arch B`) | Effect / Diff | Exact Unadjusted `p` (`*_sci`) | Holm Adjusted `p` |
|---|---|---|---|---:|---|---|
| `C16 vs C13 (B1)` | Success | `0/25 (0.0%)` | `2/25 (8.0%)` | `RD = -0.08` | `5.000000e-01` | `1.000000e+00` |
| `C16 vs C13 (B1)` | Violations | `25/25 (100.0%)` | `23/25 (92.0%)` | `RD = +0.08` | `5.000000e-01` | `1.000000e+00` |
| `C16 vs C13 (B1)` | Depth (`mm`) | `24.89` | `30.15` | `-5.26 mm (d_z = -0.32)` | `5.157626e-02` | `5.157600e-02` |
| `C17 vs C14 (B2)` | Depth (`mm`) | `26.59` | `0.00` | `+26.59 mm (d_z = 2.16)` | `5.960464e-08` | `3.576279e-07` |
| **`C18 vs C15 (B3)`** | **Success** | **`8/25 (32.0%)`** | **`0/25 (0.0%)`** | **`RD = +0.32`** | **`7.812500e-03`** | **`3.906000e-02`** |
| `C18 vs C15 (B3)` | Violations | `18/25 (72.0%)` | `0/25 (0.0%)` | `RD = +0.72` | `7.629395e-06` | `4.577637e-05` |
| `C18 vs C15 (B3)` | Depth (`mm`) | `40.02` | `0.00` | `+40.02 mm (d_z = 1.89)` | `5.960464e-08` | `3.576279e-07` |
| **`Peg M4 vs M0 (N=75)`** | **Success** | **`8/75 (10.67%)`** | **`2/75 (2.67%)`** | **`RD = +0.08`** | **`1.093750e-01`** | **`4.375000e-01` (NS)** |
| **`Peg M4 vs M0 (N=75)`** | **Violations** | **`68/75 (90.67%)`** | **`23/75 (30.67%)`** | **`RD = +0.60`** | **`5.684342e-14`** | **`4.547474e-13`** |
| `Peg M4 vs M0 (N=75)` | Depth (`mm`) | `30.50` | `10.05` | `+20.45 mm (d_z = 0.80)` | `1.252364e-08` | `8.766551e-08` |
| `M4: B3 vs B1` | Success | `8/25 (32.0%)` | `0/25 (0.0%)` | `RD = +0.32` | `7.812500e-03` | `4.687200e-02` |
| `M4: B3 vs B2` | Success | `8/25 (32.0%)` | `0/25 (0.0%)` | `RD = +0.32` | `7.812500e-03` | `4.687200e-02` |

### 5.2 Paired Before (`Phase 3.5`) vs After (`Phase 3.5.1`) Across Matched Seeds (`6200–6224`)

| Scope | Metric | Phase 3.5.1 | Phase 3.5 | Diff | Exact Unadjusted `p` (`*_sci`) | Holm Adjusted `p` |
|---|---|---|---:|---:|---|---|
| `C13` | Depth (`mm`) | `30.15` | `16.12` | `+14.03 mm (d_z = 0.86)` | `1.192093e-07` | `7.748604e-07` |
| `C13` | Violations | `23/25 (92.0%)` | `0/25 (0.0%)` | `RD = +0.92` | `2.384186e-07` | `3.814697e-06` |
| `C14` | Depth (`mm`) | `0.00` | `3.68` | `-3.68 mm (d_z = -1.37)` | `4.009965e-05` | `1.202989e-04` |
| `C16` | Contact / Viol | `25/25 (100%)` | `0/25 (0.0%)` | `RD = +1.00` | `5.960464e-08` | `1.251698e-06` |
| `C16` | Depth (`mm`) | `24.89` | `5.29` | `+19.59 mm (d_z = 1.51)` | `5.960464e-08` | `7.748604e-07` |
| `C17` | Contact / Viol | `25/25 (100%)` | `0/25 (0.0%)` | `RD = +1.00` | `5.960464e-08` | `1.251698e-06` |
| `C17` | Depth (`mm`) | `26.59` | `8.57` | `+18.02 mm (d_z = 1.41)` | `5.960464e-08` | `7.748604e-07` |
| **`C18`** | **Success** | **`8/25 (32.0%)`** | **`0/25 (0.0%)`** | **`RD = +0.32`** | **`7.812500e-03`** | `1.015560e-01` |
| `C18` | Depth (`mm`) | `40.02` | `10.26` | `+29.76 mm (d_z = 1.37)` | `5.960464e-08` | `7.748604e-07` |
| **`All M4 (N=75)`** | **Depth (`mm`)** | **`30.50`** | **`8.04`** | **`+22.46 mm (d_z = 1.32)`** | **`5.280373e-14`** | **`7.392522e-13`** |
| **`All C13–C18 (N=150)`** | **Success** | **`10/150 (6.67%)`** | **`0/150 (0.0%)`** | **`RD = +0.0667`** | **`1.953125e-03`** | **`2.734200e-02`** |
| **`All C13–C18 (N=150)`** | **Depth (`mm`)** | **`20.28`** | **`7.32`** | **`+12.96 mm (d_z = 0.74)`** | **`1.669761e-16`** | **`2.504642e-15`** |

---

## 6. Target-A Multi-Horizon RMSE (`C13–C18`)

| Cell | `H = 1` | `H = 3` | `H = 5` | `H = 10` | Valid Samples (`H = 1 / 3 / 5 / 10`) |
|---|---:|---:|---:|---:|---|
| `C13 (M0\|B1)` | `65.928` | `143.805` | `191.318` | `333.386` | `239 / 157 / 96 / 51` |
| `C14 (M0\|B2)` | `25.728` | `29.278` | `34.085` | `62.357` | `1250 / 1250 / 1250 / 1250` |
| `C15 (M0\|B3)` | `16.814` | `15.255` | `16.196` | `20.428` | `1250 / 1250 / 1250 / 1250` |
| `C16 (M4\|B1)` | `34.279` | `39.409` | `41.711` | `34.965` | `240 / 139 / 80 / 37` |
| `C17 (M4\|B2)` | `34.666` | `33.620` | `25.791` | `24.489` | `248 / 138 / 85 / 41` |
| `C18 (M4\|B3)` | `25.663` | `31.047` | `34.649` | `23.539` | `309 / 238 / 169 / 57` |

*(No closed-loop plan horizon exceeded `10` steps, so `H = 20` sample count is `0`.)*

---

## 7. Scientific Limitations & Readiness Assessment

1. **Defect Resolved:** Reward sign inversion and Task-1 CEM translational under-scaling/cold-starting are fixed and verified; pre-fix free-space truncation (`150/150` temporal truncation in `C13–C18`) dropped to `0/25` in `C13`, `C16`, `C17`, and `C18` (`M0|B2/B3` `C14/C15` remain `25/25` truncated because passive uncertainty regularization keeps the peg in free space).
2. **Real Physical Limits Exposed (Not Overclaimed):**
   - **`M4|B3` works cleanly on ID Peg-in-Hole (`8/10 = 80.0%` success, `70.0%` clean)** where ensemble epistemic uncertainty rewards genuine trajectory confidence (`corr(dz, epi) = +0.9612`), outperforming both `M0|B3` (`p = 7.8125e-03`) and `M4|B1/B2` (`p = 7.8125e-03`).
   - **OOD (`0.18–0.25 mm` tight clearance) remains `0/90 (0.0%)` across all six cells** due to the unmodeled ~`2x–2.8x` tightening of critical wedging angle (`0.716 deg -> 0.258–0.358 deg`) relative to ID training data and `PredictiveCBFSafetyFilter`'s fixed `1.8 deg` threshold.
   - Across pooled `M4` vs `M0` (`N=75`), seating improvement (`10.67%` vs `2.67%`, Holm `p = 0.4375`) is not statistically significant, whereas safety violations (`90.67%` vs `30.67%`, Holm `p = 4.55e-13`) are strongly elevated under `M4` because entering the hole triggers tight-clearance OOD collisions that uncertainty-averse `M0|B2/B3` avoid altogether.
