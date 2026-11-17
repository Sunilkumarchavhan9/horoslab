# HOROS PROBE-1 — Research-002: Phase 3.5 Scientific Closure Addendum (Document 53 v1.1)

**Immutable Original Archive Hashes Preserved (`SHA-256`):**
- `phase35_offline_120ep_results.json`: `0d700fdec06324ce76c687c3557358c4e4232c1f1d8e9923000883fe201812f1`
- `phase35_closed_loop_450ep_results.json`: `8bb42e1a852c9dc61446d9f4fd689c596b1763e675b81a5754aa0ae0bc859653`
- `phase35_statistical_comparison.json`: `b4f90493b84c2414ce5f97f3143be69e562edb0e5559c9d292318430fc409fec`
- `phase35_master_report.json`: `3945a8cc988c990933470dfec31efd651f808819ae4933325b5eb772ba7ec745`

All machine-readable addendum results live in [`phase35_closure_addendum.json`](./phase35_closure_addendum.json).

---

## 1. APS Correction Using Frozen Phase 3.4 Calibrated Quantiles

**Closed-loop replay check:** Code audit across `CEMPlanner`, `UncertaintyPenalizedCEM`, `PredictiveCBFSafetyFilter`, and `_evaluate_closed_loop_cell` confirms that `predict_mode_set` and `aps_quantile` are passive offline diagnostics only and never entered closed-loop action selection or safety filtering (`C01–C18`). No 570-episode replay is required.

Recomputing APS mode prediction sets from the saved frozen model logits with the calibrated thresholds in `b4_conformal_calibration.json` (`B1 == B2 == B3` shared classifier head per `(task, condition)`):

| Offline Pool | Condition | Legacy `0.90` Cov (`Set Size`) | Calibrated `aps_quantile` (`Phase 3.4`) | Calibrated Cov (`95% Wilson CI`) | Calibrated Set Size |
| :--- | :--- | :--- | :---: | :--- | :---: |
| `offline_test_id` ($n=1192$) | `M0_passive` | `1138/1192 (95.47%)` (`2.7248`) | `0.950168` | **`1163/1192 (97.57%)`** `[96.53, 98.30]` | `3.4673` |
| `offline_test_id` ($n=1192$) | `M4_acmm` | `1078/1192 (90.44%)` (`3.0361`) | `0.968662` | **`1168/1192 (97.99%)`** `[97.02, 98.64]` | `4.3003` |
| `offline_test_ood` ($n=1493$) | `M0_passive` | `1442/1493 (96.58%)` (`2.6477`) | `0.950168` | **`1461/1493 (97.86%)`** `[96.99, 98.48]` | `3.1902` |
| `offline_test_ood` ($n=1493$) | `M4_acmm` | `1183/1493 (79.24%)` (`2.9886`) | `0.968662` | **`1253/1493 (83.92%)`** `[81.98, 85.70]` | `3.9591` |
| `offline_test_peg_in_hole` ($n=1115$) | `M0_passive` | `677/1115 (60.72%)` (`1.6233`) | `0.991423` | **`1061/1115 (95.16%)`** `[93.73, 96.27]` | `3.8825` |
| `offline_test_peg_in_hole` ($n=1115$) | `M4_acmm` | `1077/1115 (96.59%)` (`2.7076`) | `0.924364` | **`1097/1115 (98.39%)`** `[97.46, 98.98]` | `3.2395` |

Under OOD dynamics, `M4_acmm` APS coverage remains below the 90% nominal target (`83.92%`, `CI=[81.98, 85.70]`) even with the calibrated `0.968662` quantile. Regression guard `validate_aps_quantile_matches_calibrated` now raises `ValueError` on any future quantile mismatch.

---

## 2. Task 2 OOD Detection AUROC Audit (Label Convention & Score Direction)

- **Convention verified correct:** Positive class `y = 1` = OOD (`offline_test_ood`, $n=1493$); negative class `y = 0` = ID (`offline_test_id`, $n=1192$); higher uncertainty std predicts OOD. No sign reversal applied.
- **`M4_acmm` empirical distributions:** Under `M4`, ID transitions exhibit **higher** predicted uncertainty than OOD transitions (`B2` total std mean `2.5902` vs `2.4153`; `B3` total std `2.8607` vs `2.6567`; `B3` epistemic std `1.0180` vs `0.9220`).
  - Per-stratum `M4` `B3` transition AUROC (`total / epistemic`): `OOD-LowMu` (`0.3347 / 0.4450`, mean tot `2.4915`), `OOD-HighMass` (`0.4690 / 0.4459`, mean tot `2.7444`), `OOD-RegimeB` (`0.4000 / 0.4420`, mean tot `2.6549`), `OOD-RegimeA` (`0.5756 / 0.5650`, mean tot `2.9802`).
  - Episode-level `M4 B3` mean-uncertainty AUROC: `0.4469` (total std), `0.5425` (epistemic std).
- **`M0_passive` baseline:** Slightly above chance overall (`B2` `0.5318`; `B3` total `0.5115`, epistemic `0.5511`), driven mainly by `OOD-LowMu` (`0.6120` `B2`, `0.5830 / 0.6584` `B3`) while `OOD-RegimeA` drops to `0.3647` / `0.3463`.
- **Conclusion retained:** `M4_acmm` does **not** provide reliable uncertainty-based OOD detection on Task 2.

---

## 3. Task 2 One-Step RMSE vs. Multi-Horizon `H=1` Reconciliation

Both metrics use the exact same 23-D physical state units and identical single-step model forward pass (`max_abs_diff <= 3.8147e-06`), with equal-weight MSE across 23 dims ($\text{RMSE} = \sqrt{\text{mean}(\text{err}^2)}$). The apparent divergence reflects **disjoint time-step populations**:

- `one_step.state_rmse` evaluates **all timesteps** $t = 0\dots T_i-1$ (`n = 1,192` ID, `1,493` OOD).
- `multihorizon_rmse['1']` evaluates **only initial transitions** $t = 0$ (`n = 40` per pool).

| Pool | Cond. | Arch. | All-$t$ 1-Step (`all23`) | $t=0$ Only = `MH H=1` (`all23` / `fn_12_16`) | $t \ge 1$ Only (`all23` / `fn_12_16`) |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **ID** | `M0` | `B1 / B2 / B3` | `0.7303 / 0.7546 / 0.7374` | `0.4344 / 0.3665 / 0.3209` (`fn`: `0.8721 / 0.7303 / 0.6385`) | `0.7384 / 0.7645 / 0.7477` (`fn`: `1.1039 / 1.2053 / 1.1753`) |
| **ID** | `M4` | `B1 / B2 / B3` | `0.6162 / 0.6785 / 0.6580` | **`0.7028 / 1.0472 / 1.0543`** (`fn`: **`1.6125 / 2.4614 / 2.4830`**) | `0.6130 / 0.6620 / 0.6399` (`fn`: `1.1121 / 1.1796 / 1.1465`) |
| **OOD** | `M0` | `B1 / B2 / B3` | `0.6320 / 0.6629 / 0.6332` | `0.4368 / 0.3707 / 0.3245` (`fn`: `0.8716 / 0.7346 / 0.6426`) | `0.6366 / 0.6691 / 0.6396` (`fn`: `1.0986 / 1.2001 / 1.1355`) |
| **OOD** | `M4` | `B1 / B2 / B3` | `0.5608 / 0.6259 / 0.6223` | **`0.7176 / 1.0597 / 1.0574`** (`fn`: **`1.6488 / 2.4903 / 2.4962`**) | `0.5559 / 0.6096 / 0.6059` (`fn`: `0.9874 / 1.0653 / 1.0872`) |

`M4` (trained primarily on in-contact boundary steps, only `61` Free-mode samples vs `1014` in `M0`) over-predicts normal-force engagement on step $t=0$ (`fn = 1.61–2.50 N` in `M4`, especially on `coordinated`/`friction_boundary` strategies up to `3.1118 N`), while outperforming `M0` on sustained-contact transitions $t \ge 1$.

---

## 4. Peg-in-Hole $H=50$ Temporal Truncation Root-Cause Analysis (`C13–C18`)

All 150 episodes (`C13–C18`) ran all 50 steps (`temporal_truncation`), whereas open-loop offline `insertion` trajectories seated `14/14` episodes in `15.71` mean steps (`52.03 mm` depth). Two root causes explain `0/150` seating:

1. **Reward sign inversion at `z < 0` in `PlannerEvaluator.reward_fn`:** `-float(lateral_err * 2.0 + max(0.0, peg_z) * 1.5 - min(0.0, peg_z) * 5.0 + wrench_norm * 0.1)` penalizes insertion below `peg_z = 0.0` at `-5.0 * |z|`, creating an artificial reward peak at `peg_z = 0.0 mm` (`depth = 15.0 mm`). In `C13` (`M0|B1`), the peg enters contact (`step 24` Peg-ID, `step 35` Peg-OOD) and stops oscillating around `z ≈ -2.2..-2.7 mm` (`16.12 mm` mean depth, max `17.87 mm`).
2. **Free-space stall and lateral drift in `C14–C18` (`125/125` episodes never contact):** Mean max contact force across every episode in `C14–C18` is **`0.000 N`**. CEM descent velocity is weak (`raw_cand_dz_mean = -0.09..-0.26 mm/step`) with lateral drift (`2.6–13.7 mm` radial offset), while in `C15` (`M0|B3`) epistemic uncertainty penalty pushes `z` **upward** (`14.3 -> 27.5 mm`, `0.00 mm` progress). `PredictiveCBFSafetyFilter` force plunge dampening triggered `0` times (`exec_dz_mean == raw_cand_dz_mean` in all traces).

---

## 5. B4 Episode-Level Simultaneous Joint Coverage Audit

All `n = 40` denominators per pool and frozen Bonferroni quantiles are verified exact (`0` recalibration). The original `2.5%–17.5%` (Task 2) and `45.0%` (Task 1) rates reflected evaluating `EpisodeConformalEngine` quantiles (calibrated under **$L_\infty$ norm over `HORIZONS = {1, 3, 5, 10, 20}` with `compute_aps_score`**) on a stricter mismatched event (**$L_2$ norm over all steps $1\dots T_{\text{avail}}$ up to 50 with $1-p_y$**).

| Pool | Cond. | Archived `L2, all steps, 1-p(y)` (`state / wrench / mode / SIM`) | Exact Matched `L_inf, HORIZONS, compute_aps_score` (`state / wrench / mode / SIM`) | Exact Matched Simultaneous `95% CI` |
| :--- | :--- | :--- | :--- | :--- |
| **ID** | `M0` | `10.0% / 45.0% / 42.5% / 2.5%` (`1/40`) | `39/40 / 39/40 / 40/40 /` **`38/40 (95.0%)`** | `[83.50, 98.62]` |
| **ID** | `M4` | `17.5% / 67.5% / 97.5% / 17.5%` (`7/40`) | `39/40 / 39/40 / 40/40 /` **`38/40 (95.0%)`** | `[83.50, 98.62]` |
| **OOD** | `M0` | `10.0% / 25.0% / 35.0% / 5.0%` (`2/40`) | `38/40 / 36/40 / 39/40 /` **`35/40 (87.5%)`** | `[73.89, 94.54]` |
| **OOD** | `M4` | `30.0% / 62.5% / 85.0% / 17.5%` (`7/40`) | `38/40 / 40/40 / 34/40 /` **`32/40 (80.0%)`** | `[65.24, 89.50]` |
| **Peg** | `M0` | `65.0% / 47.5% / 100.0% / 45.0%` (`18/40`) | `38/40 / 40/40 / 39/40 /` **`37/40 (92.5%)`** | `[80.14, 97.42]` |
| **Peg** | `M4` | `60.0% / 55.0% / 55.0% / 45.0%` (`18/40`) | `39/40 / 37/40 / 35/40 /` **`32/40 (80.0%)`** | `[65.24, 89.50]` |

Even under the exact matched event definition, `M4_acmm` drops below 90% in OOD (`80.0%`) and PegInHole (`80.0%`) due to contact-mode and wrench distribution shift, and full-horizon $L_2$ trajectory coverage (`2.5%–45.0%`) remains an authentic experimental gap beyond step `20`.

---

## 6. Exact Nonzero Statistical Reporting (`round(p, 6)` Corrections)

In the archived files, `round(p, 6)` truncated `20` offline and `49` closed-loop $p$-values `< 5e-7` to `0.0`. Full exact values (`format_exact_pvalue`) are restored in `phase35_closure_addendum.json`, including:
- **Grand `M4` vs `M0` ($N=225$) task success (`26 vs 0`):** $p = 2.980232 \times 10^{-8}$.
- **Grand `M4` vs `M0` ($N=225$) safety violations (`37 vs 3`):** $p = 1.946501 \times 10^{-8}$.
- **Grand `M4` vs `M0` ($N=225$) PEG (`Wilcoxon`):** $p = 5.789716 \times 10^{-27}$.
- **Cell PegInHole progress (`C16–C18 vs C13–C15`):** raw $p \in [5.960464 \times 10^{-8}, 1.788139 \times 10^{-7}]$, Holm $p \in [5.364418 \times 10^{-7}, 1.251698 \times 10^{-6}]$.
- **Offline Task 2 $H=1$ (`M4 vs M0`):** $p = 4.804430 \times 10^{-8}$ (`B1`), $3.033956 \times 10^{-8}$ (`B2/B3`), Holm $p = 2.402215 \times 10^{-7} / 1.516978 \times 10^{-7}$.

---

## 7. Explicit M4 Success-vs-Safety Analysis (`C01–C12`)

| Cell | Config | Clean Success (`Safe`) | Unsafe Success (`Viol`) | Fail (`Safe`) | Fail (`Unsafe`) | Drops | `Fn > 25 N` | Safe / Unsafe Peak `Fn` (N) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `C01–C03` | `M0 \| B1–B3 \| ID` | `0 / 0 / 0` | `0 / 0 / 0` | `19 / 25 / 25` | `6 / 0 / 0` | `6 / 0 / 0` | `0 / 0 / 0` | `21.29, 21.28, 20.11 / 20.79 (C01)` |
| `C04` | `M4 \| B1 \| ID` | `3` | `0` | `14` | `8` | `0` | `8` | `23.46 / 26.80` |
| `C05` | `M4 \| B2 \| ID` | **`9`** | `3` | `12` | `1` | `0` | `4` | `22.71 / 26.90` |
| `C06` | `M4 \| B3 \| ID` | `3` | `0` | `19` | `3` | `1` | `2` | `21.87 / 24.53` |
| `C07–C09` | `M0 \| B1–B3 \| OOD` | `0 / 0 / 0` | `0 / 0 / 0` | `24 / 25 / 25` | `1 / 0 / 0` | `1 / 0 / 0` | `0 / 0 / 0` | `20.93, 21.55, 20.20 / 20.59 (C07)` |
| `C10` | `M4 \| B1 \| OOD` | `0` | `1` | `14` | `10` | `1` | `10` | `23.40 / 26.96` |
| `C11` | `M4 \| B2 \| OOD` | **`1`** | **`5`** | `11` | `8` | `0` | `13` | `23.29 / 26.79` |
| `C12` | `M4 \| B3 \| OOD` | `1` | `0` | `22` | `2` | `0` | `2` | `22.18 / 26.74` |

All `150` ID and `150` OOD episodes are analytically grasp-feasible ($4\mu \cdot 18\text{ N} \ge mg$). Under OOD (`C11`), `5/6` `M4|B2` successes violated the `25 N` crush threshold (mean peak `Fn` `26.79 N`), leaving only `1/25` (`RegimeA`) clean safe success (`LowMu`: `0/9` clean, `7/9` crush; `HighMass`: `0/8` clean, `4/8` crush). `B3` epistemic penalization curtailed crush violations (`3/25` ID, `2/25` OOD) alongside lower task success (`4/50` combined).
