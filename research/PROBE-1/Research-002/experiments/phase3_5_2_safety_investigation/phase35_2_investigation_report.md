# HOROS PROBE-1 — Research-002 Phase 3.5.2 Investigation Report

**Topic:** Geometry-Aware Safety, Clearance Uncertainty Ablation, Two-Phase Contact Control, and Free-Space Stall Isolation  
**Pilot Manifest:** `experiments/phase3_5_2_safety_investigation/phase35_2_pilot_manifest.json` (`sha256: a95aaf1de06b631bbd04791374446edeec0a5ca71dc4d19ab524759fcfd212b4`)  
**Machine-Readable Results:** `experiments/phase3_5_2_safety_investigation/phase35_2_investigation.json`

---

## 1. Root-Cause Verification of Baseline `PredictiveCBFSafetyFilter`

Four structural defects in the preserved baseline `src/safety/pcbf_safety_filter.py` caused the Phase 3.5.1 contact/wedging crashes (90 dynamic-crush terminations + 1 seated violation = 91/150 overall, 60/60 in contacting OOD cells):

1. **Threshold mismatch (`1.8 deg` vs exact geometry):** With peg length `L = 80.0 mm`, `theta_crit(c) = degrees(arctan2(2*c, 80.0))` yields:
   - ID (`c = 0.50 mm`): `0.716 deg` (`1.8 deg` is `2.51x` too loose)
   - OOD (`c = 0.25 mm`): `0.358 deg` (`1.8 deg` is `5.03x` too loose)
   - OOD (`c = 0.18 mm`): `0.258 deg` (`1.8 deg` is `6.98x` too loose)
2. **Reactive wrench check instead of next-step geometry:** Checking current `wrench == 0` allows unaligned high-plunge transitions from `z > 0` into `z <= 0` in one step.
3. **Hardcoded lateral threshold and stratum skipping:** `radial_dist > 0.4` exceeds OOD clearances `0.18–0.25 mm`, and gating on `stratum in [2, 3]` skips both `stratum = 0` (free space) and `stratum = 1` (chamfer impact).
4. **Unconstrained lateral/tilt axes & colinear friction:** Clamping only `action[2]` leaves `action[:2]` and `action[3:5]` unprojected, while colinear radial friction makes lateral wall load `1.5 * Fn` (`<= 1.749 * Fn` total at `mu = 0.90`) plus wedging amplification `1 + 3 * (tilt / theta_crit)`.

---

## 2. Geometry-Aware Two-Phase Architecture (`3.5.2-A`, `3.5.2-B`, `3.5.2-C`)

- **Filter (`src/safety/geometry_cbf_safety_filter.py`):**
  - Strips privileged keys (`clearance`, `friction`) at entry via `extract_controller_visible_pih_obs`.
  - Jointly projects candidate next lateral position `(pos_xy + a_xy)` and next tilt `(rot_xy + a_34)` into conservative tubes (`r_gate = 0.65 * c_safe`, `tilt_gate = 0.70 * theta_crit(c_safe)` in pre-entry; `r_tube = 0.85 * c_safe`, `tilt_tube = 0.75 * theta_crit(c_safe)` during insertion) across all strata `0..4`.
  - Computes next-step conservative force/torque upper bounds incorporating wall stiffness/damping, friction upper bound `0.90`, and wedging multiplier, combined via `max(...)` with optional world-model wrench UCB so overconfident world-model predictions cannot relax safety.
  - Fails closed (halts downward/lateral motion or retracts to `z > 0`) on non-finite observations, invalid actions, invalid world-model inputs, or invalid/out-of-domain clearance.
- **Clearance Modes (`3.5.2-B`):**
  - **Mode A (`estimated_clearance`):** Independent pre-task gage/metrology estimate `(c_hat_mm, sigma_c_mm=0.025, k_sigma=2.0)` yielding LCB `c_safe = c_hat - k_sigma * sigma_c >= 0.05 mm`.
  - **Mode B (`unknown_clearance`):** Conservative validated-domain bound `c_robust = 0.18 mm` strictly bounded to `allow_below_validated_domain = False, min_possible_clearance >= 0.18 mm`, with runtime falsification that latches refusal (`contact_resistance_below_validated_domain`) if radial wall resistance `> 1.0 N` occurs inside `r <= 0.18 mm`.
- **Two-Phase Controller (`src/integrated/peginhole_phase352_controller.py`):**
  - Explicit states: `PRE_ENTRY_ALIGN -> INSERTION_CONSTRAINED -> SEATED_TERMINAL` and `ALIGNMENT_FAILED` (holds safely above `z > 0` if alignment times out or clearance check refuses).

---

## 3. Free-Space Stall Investigation (`3.5.2-D`, Seed `3080`, `z_start = 14.265 mm`, 20 Steps)

Keeping `B1–B3` weights frozen, baseline vs single-factor ablations on `M0_passive / B3`:

| Probe / Single-Factor Setting | `zero_act_drift_dz` (mm) | `mean_raw_dz` (mm) | `mean_cand_dz` (mean / std) | `mean_elite_dz` (mean / std) | `mean_unc_penalty` | `mean_pred_ret` | `z_end` (mm) | Contact? |
|---|---:|---:|---|---:|---:|---:|---:|---|
| `M4_acmm_B3` (baseline) | `-1.3545` | `-2.402` | `-0.8381 / 1.1835` | `-1.7121 / 0.9851` | `501.34` | `748.66` | `-33.7751` | Yes (step 8) |
| `M4_acmm_B1` (baseline) | `-1.4134` | `-1.6702` | `-0.5936 / 1.3797` | `-1.33 / 1.0601` | `0.00` | `561.46` | `-19.1385` | Yes (step 9) |
| `M0_passive_B3` (`beta=1.5`) | `+1.7317` | `+0.969` | `+0.4213 / 1.3703` | `+0.7426 / 1.26` | `604.57` | `-764.87` | `+33.6445` | No |
| `M0_passive_B2` (`beta=1.5`) | `+2.1366` | `+0.0592` | `+0.0223 / 1.2822` | `+0.0101 / 1.1471` | `2162.83` | `-539.55` | `+15.4491` | No |
| **Factor `beta = 0.25`** | `+1.7317` | `-1.988` | `-0.5781 / 1.3177` | `-1.2361 / 1.0861` | `334.81` | `283.52` | `-25.4943` | Yes (step 11) |
| **Factor `beta = 0.0`** | `+1.7317` | `-2.4269` | `-1.133 / 1.2358` | `-2.1214 / 1.0075` | `0.00` | `758.68` | `-34.2731` | Yes (step 7) |
| **Factor `warm_start = True`** | `+1.7317` | `+2.1613` | `+2.0106 / 1.1155` | `+2.1247 / 0.8292` | `453.00` | `-1059.90` | `+57.4919` | No |
| **Factor `init_std_dz = 3.0`** | `+1.7317` | `+0.6193` | `+0.7699 / 2.3046` | `+1.0473 / 2.2346` | `621.01` | `-772.67` | `+26.6518` | No |
| **Factor `cbf_mode = none`** | `+1.7317` | `+1.1702` | `+0.4178 / 1.3515` | `+0.892 / 1.1621` | `617.55` | `-791.96` | `+37.6699` | No |

**Conclusion:** `M0_passive` stall in free space is driven primarily by the interaction between positive upward zero-action model drift (`+1.73 mm` B3, `+2.14 mm` B2) and high `UncertaintyPenalizedCEM` penalty (`beta = 1.5`, penalty `604.57–2162.83`) penalizing unexplored downward trajectories more strongly than the depth reward gradient. Reducing `beta` alone (`1.5 -> 0.25 -> 0.0`) restores monotonic descent and contact; warm-starting amplifies upward drift; wider `init_std` and removing CBF do not eliminate stall.

---

## 4. Frozen 30-Episode Instrumented Pilot (`3.5.2-F`, Seeds `7500–7529`)

Disjoint from all Phase 3 pools (`pairwise_overlap_count = 0`). 6 configs × 5 physical conditions = 30 episodes (`eval_horizon = 50`). Total runtime: `64.384 s`.

### Aggregate Results
- **Total Episodes:** `30` (max cap: `30`)
- **Safety Violations (`> 35 N` / `> 7 N*m`):** `0 / 30` (`0.0%`)
- **Dynamic Crush Terminations (`> 40 N` / `> 8 N*m`):** `0 / 30` (`0.0%`)
- **Max Observed Force / Torque:** `0.425 N` / `0.0 N*m` (strictly pure viscous bore friction during centered insertion)
- **Seated Successes:** `20 / 30` (`20 / 20` on `M4_acmm`, `0 / 10` on stalled `M0_passive`)
- **Alignment Failures / Jams:** `0 / 30` / `0 / 30`
- **Live Geometry CBF Modified Steps:** `13` (vs **14** unsafe raw/nominal steps that shadow `PredictiveCBFSafetyFilter` would have passed unclipped)

### Breakdown by Configuration & Clearance Mode (`5` physical regimes each)

| World Model | Arch | Clearance Mode | Episodes | Seated | Violations | Crushes | Max Force (N) | Shadow Unsafe Steps |
|---|---|---|---:|---:|---:|---:|---:|---:|
| `M4_acmm` | `B3` | `estimated_clearance` (Mode A) | 5 | 5 | 0 | 0 | 0.425 | 7 |
| `M4_acmm` | `B3` | `unknown_clearance` (Mode B) | 5 | 5 | 0 | 0 | 0.425 | 7 |
| `M4_acmm` | `B1` | `estimated_clearance` (Mode A) | 5 | 5 | 0 | 0 | 0.425 | 0 |
| `M4_acmm` | `B1` | `unknown_clearance` (Mode B) | 5 | 5 | 0 | 0 | 0.425 | 0 |
| `M0_passive` | `B3` | `estimated_clearance` (Mode A) | 5 | 0 | 0 | 0 | 0.000 | 0 |
| `M0_passive` | `B3` | `unknown_clearance` (Mode B) | 5 | 0 | 0 | 0 | 0.000 | 0 |

---

## 5. Immutability Verification

Verified before and after execution:
- All Phase 3.4 dataset bundles and B1/B2/B3/B4 checkpoints verified via `verify_phase34_artifacts_and_load` (SHA-256 + B3 5-member parity).
- Phase 3.5 570-ep archive (`phase35_archives_verified = 1`), `phase35_closure_addendum.json`, `phase35_1_peginhole_correction.json`, `src/safety/pcbf_safety_filter.py`, `src/coordination/plcea_substitutor.py`, `manifests/phase34_dataset_manifest.json`, and `manifests/ood_regime_manifests.json` preserved byte-for-byte unchanged (`immutability_receipt` recorded in `phase35_2_investigation.json`).

