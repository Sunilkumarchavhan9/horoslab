# HOROS PROBE-1 — Research-002 Phase 3.5.2 Telemetry Integrity Addendum

**Scope:** Step-by-step read-only telemetry audit of the frozen 30-episode Phase 3.5.2 pilot ([phase35_2_pilot_manifest.json](phase35_2_pilot_manifest.json), `sha256: a95aaf1de06b631bbd04791374446edeec0a5ca71dc4d19ab524759fcfd212b4`) with **zero modifications** to the controller, CBF filter, CEM planners, frozen checkpoints, calibration artifacts, or archived JSON files.  
**Audit Script:** `scripts/audit_phase35_2_telemetry_integrity.py`  
**Machine-Readable Audit Log:** `experiments/phase3_5_2_safety_investigation/phase35_2_telemetry_audit.json`  
**Replay Parity Check:** `exact_parity_verified = 1` across all 30 episodes (`steps_executed`, `final_z_mm`, `final_radial_err_mm`, `final_tilt_deg`, `max_force_n`, `max_torque_nm`, `seated_success`, `cbf_modified_steps`, and `shadow_would_pass_unsafe_steps` match `phase35_2_investigation.json`, `sha256: 39d45530dbf24b7a875a8003f5b15a29c3488ab2fada69d4175cb8f3f1e2efd5`).

---

## 1. Force and Torque Channel Integrity & Distributions

### Channel & Unit Verification (All `1,148` Simulation Steps Across `30` Episodes)
- **Channel parity:** Across all `1,148` steps executed (`688` free-space steps with `z > 0`, `460` in-bore steps with `z <= 0`), `env.contact_wrench` (direct physics engine state in `src/environment/peg_in_hole_env.py`), `obs["wrench"]` returned by `step_env_compatible`, controller-visible `visible_obs["wrench"]`, and `SafetyEvaluator.check_safety_violation(obs)` matched with **`max_abs_diff = 0.0`** (no clipping, no normalization, no overwriting, and terminal/seating steps are all included).
- **Physical units verified in `PegInHoleEnv`:**
  - Forces (`contact_wrench[:3]`) are in **Newtons (`N`)**: `contact_stiffness = 5000.0 N/m`, `penetration * 1e-3 m`, `contact_damping = 100.0 N/(m/s)`, clear-bore axial viscous sliding friction `Fz = -0.5 * friction_coeff N`.
  - Torques (`contact_wrench[3:6]`) are in **Newton-meters (`N*m`)**: `peg_length = 80.0 mm` (`0.5e-3 * 80 = 0.04 m` lever arm), `Tz = 0.05 * Fn`.
- **Why peak force is `0.425 N` and torque is `0.0 N*m`:** Phase A (`PRE_ENTRY_ALIGN`) centered lateral error (`r -> 0.0 mm`) and tilt (`tilt -> 0.0 deg`) in free space (`z > 0`) **before** fixture entry on every descending episode, and Phase B held centered alignment through the bore. Consequently, `wall_penetration_steps (r > c_true) = 0` across all `460` in-bore steps (`max_radial_in_bore_mm = 0.0`, `max_tilt_in_bore_deg = 0.0`), so the physical force observed in the bore is pure axial viscous sliding friction `|-0.5 * mu_true|`: `0.250 N` at `mu = 0.50`, `0.375 N` at `mu = 0.75`, and `0.425 N` at `mu = 0.85`.

### Per-Step Force (`N`) and Torque (`N*m`) Distributions

| Slice | Step Count | Force Min / p50 / p95 / Max (Mean) [`N`] | Torque Min / p50 / p95 / Max (Mean) [`N*m`] |
|---|---:|---|---|
| **All simulation steps** | 1,148 | `0.0 / 0.0 / 0.425 / 0.425` (`0.146908`) | `0.0 / 0.0 / 0.0 / 0.0` (`0.0`) |
| **In-bore steps (`z <= 0`)** | 460 | `0.25 / 0.375 / 0.425 / 0.425` (`0.366630`) | `0.0 / 0.0 / 0.0 / 0.0` (`0.0`) |
| **Terminal step per episode** | 30 | `0.0 / 0.375 / 0.425 / 0.425` (`0.246667`) | `0.0 / 0.0 / 0.0 / 0.0` (`0.0`) |

*(Free-space `z > 0` accounts for the remaining `688` steps, all at `0.0 N` / `0.0 N*m`.)*

---

## 2. Physical Seating Validity (`20 / 20` Seated Episodes)

Every one of the `20` seated episodes (`M4_acmm | B3/B1 × Mode A/B` across ID and all 4 OOD corners) passed **`physically_valid_bore_insertion = True`**:
1. Started misaligned above the rim (`z0 = 14.07–15.91 mm`, `r0` up to `2.08 mm`, `tilt0` up to `1.24 deg`),
2. Aligned inside `z > 0` so at entry (`entry_step` `5–16`), `entry_r_mm = 0.0 <= c_true` and `entry_tilt_deg = 0.0 <= theta_crit_true`,
3. Traversed `19–30` physical in-bore steps (`z <= 0`), staying strictly within `[0, c_true]` radially (`wall_penetration_steps = 0`) while experiencing `stratum = 2` (Sliding) axial friction `Fz = -0.5 * mu_true`,
4. Crossed `-peg_pos[2] >= 50.0 mm` (`final_z_mm` from `-50.0045` to `-53.3795 mm`) with `terminal_lateral_force = 0.0 N < 10.0 N`, `terminal_stratum = 4 ("Seated")`, and `env.seated = True`.

The remaining `10` episodes (`M0_passive | B3`, `M0_passive | B1` not in pilot; `M0_passive | B3` Modes A & B × 5 regimes) stayed in free space (`z > 0`) with `0.0 N` peak force and `0` violations.

| Ep | Seed | Condition | Config / Mode | Steps | Entry `t` (`z<=0`) | Bore Steps | `final_z` (mm) | Terminal `Fz` (`N`) | Stratum | Valid? |
|---:|---:|---|---|---:|---:|---:|---:|---:|---|---|
| 0 | 7500 | `ID` | `M4/B3/ModeA` | 37 | 7 | 30 | -51.2376 | -0.250 | `4 (Seated)` | Yes |
| 1 | 7501 | `ID` | `M4/B3/ModeB` | 29 | 9 | 20 | -52.7308 | -0.250 | `4 (Seated)` | Yes |
| 2 | 7502 | `ID` | `M4/B1/ModeA` | 33 | 8 | 25 | -51.7041 | -0.250 | `4 (Seated)` | Yes |
| 3 | 7503 | `ID` | `M4/B1/ModeB` | 38 | 13 | 25 | -52.6368 | -0.250 | `4 (Seated)` | Yes |
| 6 | 7506 | `OOD_mu075_clr018` | `M4/B3/ModeA` | 34 | 9 | 25 | -51.7071 | -0.375 | `4 (Seated)` | Yes |
| 7 | 7507 | `OOD_mu075_clr018` | `M4/B3/ModeB` | 32 | 10 | 22 | -51.2518 | -0.375 | `4 (Seated)` | Yes |
| 8 | 7508 | `OOD_mu075_clr018` | `M4/B1/ModeA` | 36 | 9 | 27 | -50.5901 | -0.375 | `4 (Seated)` | Yes |
| 9 | 7509 | `OOD_mu075_clr018` | `M4/B1/ModeB` | 38 | 16 | 22 | -51.0978 | -0.375 | `4 (Seated)` | Yes |
| 12 | 7512 | `OOD_mu075_clr025` | `M4/B3/ModeA` | 35 | 9 | 26 | -52.8210 | -0.375 | `4 (Seated)` | Yes |
| 13 | 7513 | `OOD_mu075_clr025` | `M4/B3/ModeB` | 31 | 11 | 20 | -51.1814 | -0.375 | `4 (Seated)` | Yes |
| 14 | 7514 | `OOD_mu075_clr025` | `M4/B1/ModeA` | 35 | 10 | 25 | -50.0045 | -0.375 | `4 (Seated)` | Yes |
| 15 | 7515 | `OOD_mu075_clr025` | `M4/B1/ModeB` | 30 | 10 | 20 | -53.1372 | -0.375 | `4 (Seated)` | Yes |
| 18 | 7518 | `OOD_mu085_clr018` | `M4/B3/ModeA` | 30 | 8 | 22 | -52.1167 | -0.425 | `4 (Seated)` | Yes |
| 19 | 7519 | `OOD_mu085_clr018` | `M4/B3/ModeB` | 30 | 10 | 20 | -50.1677 | -0.425 | `4 (Seated)` | Yes |
| 20 | 7520 | `OOD_mu085_clr018` | `M4/B1/ModeA` | 38 | 10 | 28 | -50.3574 | -0.425 | `4 (Seated)` | Yes |
| 21 | 7521 | `OOD_mu085_clr018` | `M4/B1/ModeB` | 27 | 7 | 20 | -50.6373 | -0.425 | `4 (Seated)` | Yes |
| 24 | 7524 | `OOD_mu085_clr025` | `M4/B3/ModeA` | 26 | 6 | 20 | -52.5612 | -0.425 | `4 (Seated)` | Yes |
| 25 | 7525 | `OOD_mu085_clr025` | `M4/B3/ModeB` | 29 | 5 | 24 | -50.2937 | -0.425 | `4 (Seated)` | Yes |
| 26 | 7526 | `OOD_mu085_clr025` | `M4/B1/ModeA` | 26 | 7 | 19 | -52.9041 | -0.425 | `4 (Seated)` | Yes |
| 27 | 7527 | `OOD_mu085_clr025` | `M4/B1/ModeB` | 34 | 14 | 20 | -53.3795 | -0.425 | `4 (Seated)` | Yes |

---

## 3. Clearance Modes & Oracle Independence (`Mode A` vs `Mode B`)

- **Oracle independence check:** Stripping `obs["clearance"]` and `obs["friction"]` vs mutating them to `(clearance=999.0, friction=0.01)` produced **`oracle_leakage_diffs_on_mode_test = 0`** across all `30` pilot episode specs.
- **Mode A (`estimated_clearance`, `15` episodes):** Used deterministic simulated metrology `c_hat_mm` with `sigma_c_mm = 0.025 mm`, `k_sigma = 2.0`, yielding conservative lower confidence bound `c_safe = c_hat - 0.050 mm`:
  - On `c_true = 0.50 mm` (ep `0, 2, 4`): `c_hat in [0.496743, 0.504447]`, `c_safe in [0.446743, 0.454447] mm`, `theta_crit_used in [0.639886, 0.650919] deg` (margin `+0.045553` to `+0.053257 mm`).
  - On `c_true = 0.25 mm` (ep `12, 14, 16, 24, 26, 28`): `c_hat in [0.247606, 0.261374]`, `c_safe in [0.197606, 0.211374] mm`, `theta_crit_used in [0.283047, 0.302768] deg` (margin `+0.038626` to `+0.052394 mm`).
  - On `c_true = 0.18 mm` (ep `6, 8, 10, 18, 20, 22`): `c_hat in [0.173361, 0.191679]`, `c_safe in [0.123361, 0.141679] mm`, `theta_crit_used in [0.176701, 0.202939] deg` (margin `+0.038321` to `+0.056639 mm`).
- **Mode B (`unknown_clearance`, `15` episodes):** Used `c_hat = None` and fixed `c_safe = 0.180 mm` (`theta_crit_used = 0.257829 deg`) uniformly across ALL `c_true in {0.50, 0.25, 0.18} mm` (margins `+0.320, +0.070, 0.000 mm`), completely independent of `env.clearance`.

---

## 4. Safety Interventions (`13` Live Projections) & Shadow Comparison (`14` Flags)

Every live intervention occurred on `M4_acmm / B3`, triggered by `predictive_contact_barrier` when B3's learned wrench UCB (`|wm_pred_wrench| + 2 * total_std`) exceeded `operational_force_limit = 24.0 N`, while preserving lateral/tilt centering and clamping downward `dz < 0` to `0.0`:

| Ep / Seed | Regime / Mode | Step `t` | `pre_z` (mm) | Nominal `a_z` -> Safe `a_z` | Live CBF Reason | Shadow `PredictiveCBF` |
|---:|---|---:|---:|---|---|---|
| 0 / 7500 | `ID / ModeA` | `t=0` | `15.90896` | `-2.00000 -> 0.00000` | `predictive_contact_barrier` | `ok` (unsafe pass) |
| 0 / 7500 | `ID / ModeA` | `t=33` | `-49.55090` | `-1.18806 -> 0.00000` | `predictive_contact_barrier` | `ok` (unsafe pass) |
| 0 / 7500 | `ID / ModeA` | `t=34` | `-49.55090` | `-1.57508 -> 0.00000` | `predictive_contact_barrier` | `ok` (unsafe pass) |
| 0 / 7500 | `ID / ModeA` | `t=35` | `-49.55090` | `-0.52272 -> 0.00000` | `predictive_contact_barrier` | `ok` (unsafe pass) |
| 1 / 7501 | `ID / ModeB` | `t=0` | `15.35888` | `-2.00000 -> 0.00000` | `predictive_contact_barrier` | `ok` (unsafe pass) |
| 1 / 7501 | `ID / ModeB` | `t=1` | `15.35888` | `-1.05440 -> 0.00000` | `predictive_contact_barrier` | `ok` (unsafe pass) |
| 6 / 7506 | `OOD_mu075_clr018 / ModeA` | `t=0` | `15.20294` | `-2.00000 -> 0.00000` | `predictive_contact_barrier` | `ok` (unsafe pass) |
| 6 / 7506 | `OOD_mu075_clr018 / ModeA` | `t=32` | `-48.70833` | `-2.60231 -> 0.00000` | `predictive_contact_barrier` | `ok` (unsafe pass) |
| 7 / 7507 | `OOD_mu075_clr018 / ModeB` | `t=0` | `14.94324` | `-2.00000 -> 0.00000` | `predictive_contact_barrier` | `ok` (unsafe pass) |
| 12 / 7512 | `OOD_mu075_clr025 / ModeA` | `t=33` | `-48.01976` | `-5.00000 -> 0.00000` | `predictive_contact_barrier` | `ok` (unsafe pass) |
| 13 / 7513 | `OOD_mu075_clr025 / ModeB` | `t=0` | `15.76721` | `-2.00000 -> 0.00000` | `predictive_contact_barrier` | `ok` (unsafe pass) |
| 19 / 7519 | `OOD_mu085_clr018 / ModeB` | `t=0` | `15.19100` | `-2.00000 -> 0.00000` | `predictive_contact_barrier` | `ok` (unsafe pass) |
| 25 / 7525 | `OOD_mu085_clr025 / ModeB` | `t=27` | `-45.29371` | `-1.41496 -> 0.00000` | `predictive_contact_barrier` | `ok` (unsafe pass) |

**Accounting for the `14th` shadow unsafe flag:** In Ep `25` (`seed 7525`, `OOD_mu085_clr025`, `M4/B3/ModeB`) at `t=26` (`pre_z = -45.29371 mm`), the nominal action had `a_z = +0.33477 mm >= 0` (`safe_action == nominal_phase_action`, so `cbf_modified = False`), yet `predictive_contact_barrier` still raised a warning reason due to `wm_force_ucb > 24.0 N`; shadow `PredictiveCBFSafetyFilter` returned `"ok"`, yielding `14` shadow unsafe flags alongside the `13` modified live steps. Notice these are shadow policy indications on B3's learned uncertainty UCB, not 14 observed simulator crushes.

---

## 5. Results Separated Across ID and All Four OOD Corners

| Physical Condition (`mu`, `c_true`) | Episodes | Seated | Violations | Max Force (`N`) | Max Torque (`N*m`) | Max Bore `r` (`mm`) | Max Bore Tilt (`deg`) | Live CBF Mods | Shadow Unsafe Flags | 1-Sided 95% UCB (`p_viol`) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `ID` (`0.50`, `0.50 mm`) | 6 | 4 | 0 | 0.250 | 0.0 | 0.0 | 0.0 | 6 | 6 | 39.30% |
| `OOD_mu075_clr018` (`0.75`, `0.18 mm`) | 6 | 4 | 0 | 0.375 | 0.0 | 0.0 | 0.0 | 3 | 3 | 39.30% |
| `OOD_mu075_clr025` (`0.75`, `0.25 mm`) | 6 | 4 | 0 | 0.375 | 0.0 | 0.0 | 0.0 | 2 | 2 | 39.30% |
| `OOD_mu085_clr018` (`0.85`, `0.18 mm`) | 6 | 4 | 0 | 0.425 | 0.0 | 0.0 | 0.0 | 1 | 1 | 39.30% |
| `OOD_mu085_clr025` (`0.85`, `0.25 mm`) | 6 | 4 | 0 | 0.425 | 0.0 | 0.0 | 0.0 | 1 | 2 | 39.30% |
| **Total Pilot** | **30** | **20** | **0** | **0.425** | **0.0** | **0.0** | **0.0** | **13** | **14** | **9.503%** |

*Statistical interpretation:* `0 / 30` establishes strong mechanism promise with one-sided 95% Clopper-Pearson upper confidence bound `1 - 0.05**(1/30) = 9.503%` overall (`39.304%` per 6-episode stratum). Full statistical validation across unseen poses, clearances, and contact transitions awaits Phase 3.6 once authorized.

---

## 6. Artifact Integrity & Repository Status

Verified before and after the read-only telemetry audit:
- `src/safety/pcbf_safety_filter.py`: `458ce865e34b27c9b1233bb477a994e1caa09e66b48a9da1b4b02a5b0b366277`
- `src/coordination/plcea_substitutor.py`: `0f4980e37e1b2776f20769582f5f3492b6aa7c3aa18a85243bf5d9faac5ea924`
- `experiments/phase3_5_evaluation/phase35_closure_addendum.json`: `87bae105f7d78eb92faec7f33a158d733af252a863aaf1005d6d0c8a772fab47`
- `experiments/phase3_5_evaluation/phase35_1_peginhole_correction.json`: `c3ffb50362e21cff7f889c2c5784addaf4886b8ec0afccff864a6954e5817b93`
- `manifests/phase34_dataset_manifest.json`: `29281d1d8b6b003961ca5457690bebb3cc8282040bb480fa555ac9ed8fd93256`
- `manifests/ood_regime_manifests.json`: `96125f1588c2e517be170fb9fde727cc424ce8a3d472ea59d4bd2f5f768f2d66`
- `phase35_2_pilot_manifest.json`: `a95aaf1de06b631bbd04791374446edeec0a5ca71dc4d19ab524759fcfd212b4` (unchanged)
- `phase35_2_investigation.json`: `39d45530dbf24b7a875a8003f5b15a29c3488ab2fada69d4175cb8f3f1e2efd5` (unchanged)
- `phase35_archives_verified = 1`; Phase 3.4 datasets, B1–B4 checkpoints, and baseline controllers unchanged.
- Phase 3.5.2 implementation commits: `MemoryOS` `cbce9962` (`152 passed in 18.89s`), `horos-probe-1` `8af9760` (`152 passed, 1 warning in 18.35s`).
