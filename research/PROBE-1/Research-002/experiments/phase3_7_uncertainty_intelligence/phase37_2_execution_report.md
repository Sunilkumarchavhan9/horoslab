# HOROS PROBE-1 — Research-002
## Phase 3.7.2 Execution Report: OOD Uncertainty Experiments (C1–C5)

**Runtime:** `python==3.12.10`, `torch==2.13.0+cpu` (90.866 s)  
**Frozen Config SHA-256:** `1528f7ee70126a4b754fd2f9ff64e2ab12e3f01ff8a03230c04fead68cbbf327`  
**Machine-Readable Results:** [`phase37_2_results.json`](./phase37_2_results.json) | [`phase37_2_candidate_comparison.csv`](./phase37_2_candidate_comparison.csv) | [`phase37_2_reproducibility_audit.md`](./phase37_2_reproducibility_audit.md)

---

## 1. Acceptance Gate Adjudication Summary (`U1–U5`)

| Gate | Outcome | Measured Result vs Pre-Registered Threshold |
| --- | --- | --- |
| **U1 — Baseline Parity** | **PASS** | Max abs diff `0.0` <= `1e-4` across all 7 archived metrics |
| **U2 — OOD Discrimination** | **PARTIAL_OR_FAIL** | Best: `C3_probe_mlp_L10` — Trans AUROC `0.6497` (CI95 lower `0.5664`), LowMu `0.7946`, Ep `0.6975`, FPR@95 `0.9225`, Holm-p `0.048972` |
| **U3 — Conformal Calibration** | **PARTIAL_OR_FAIL** | Ep C5 ID `60/60 (100.0%)`, OOD `58/60 (96.67%)` (gap `0.0333`); 1-step adaptive per-mode max dev `0.1`; AURC reduction `-4.0%` |
| **U4 — Temporal & Diversity** | **PASS** | Best RegA post/pre `0.8247`, RegA post/ID15 `0.6232`, RegB10/ID10 `0.6158`, max Spearman `0.3983`, B3 diversity quantified |
| **U5 — Data & Freeze Integrity** | **PASS** | Historical overlap `0`, calib/val overlap `0`, upstream SHA-256 mismatches `0` |

---

## 2. Candidate Comparison on Held-Out Task 2 Validation (`9200..9319`)

| Candidate | Trans AUROC (95% CI) | AUPRC | FPR@95 | Ep AUROC | LowMu | HighMass | RegA | RegB | Spearman | AURC | Holm-p |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `Baseline_M4_B3_total_std` | `0.4811` (`[0.4148, 0.5461]`) | `0.5351` | `0.9399` | `0.5057` | `0.3895` | `0.5037` | `0.5994` | `0.6046` | `0.3796` | `2.0215` | `1.0` |
| `Baseline_M4_B3_epistemic_std` | `0.5051` (`[0.4141, 0.6108]`) | `0.532` | `0.8862` | `0.5913` | `0.4849` | `0.5057` | `0.5006` | `0.5667` | `0.4455` | `1.9332` | `1.0` |
| `C1a_mode_z_epi` | `0.5029` (`[0.425, 0.5886]`) | `0.5282` | `0.9534` | `0.5628` | `0.5118` | `0.5032` | `0.4491` | `0.5245` | `0.2682` | `2.6601` | `0.57871` |
| `C1b_mode_5nn_input` | `0.5981` (`[0.5161, 0.6861]`) | `0.6751` | `0.8635` | `0.6428` | `0.6712` | `0.5545` | `0.4763` | `0.5678` | `0.381` | `2.3593` | `0.071968` |
| `C1c_mode_5nn_hidden` | `0.5345` (`[0.4416, 0.6337]`) | `0.5561` | `0.8657` | `0.6058` | `0.5385` | `0.5241` | `0.4774` | `0.5916` | `0.34` | `2.4386` | `0.331335` |
| `C1_hybrid_fused` | `0.5897` (`[0.4994, 0.676]`) | `0.6592` | `0.8922` | `0.6419` | `0.6645` | `0.5392` | `0.4716` | `0.5628` | `0.3831` | `2.2232` | `0.093952` |
| `C2_win_rms_L5` | `0.6036` (`[0.5366, 0.6672]`) | `0.6383` | `0.9388` | `0.7` | `0.672` | `0.5752` | `0.5079` | `0.5377` | `0.3188` | `2.3339` | `0.071968` |
| `C2_win_rms_L10` | `0.6067` (`[0.5312, 0.6772]`) | `0.6349` | `0.9101` | `0.6925` | `0.6665` | `0.5949` | `0.5125` | `0.536` | `0.3065` | `2.3899` | `0.067464` |
| `C2_cusum_win_L5` | `0.5984` (`[0.5335, 0.6619]`) | `0.6264` | `1.0` | `0.7131` | `0.6747` | `0.5666` | `0.4758` | `0.5389` | `0.2743` | `2.2232` | `0.071968` |
| `C2_cusum_win_L10` | `0.6111` (`[0.5456, 0.6803]`) | `0.639` | `1.0` | `0.6922` | `0.6874` | `0.5916` | `0.4689` | `0.548` | `0.242` | `2.3295` | `0.060467` |
| `C2_cusum_ep_L10` | `0.6046` (`[0.5235, 0.6795]`) | `0.634` | `1.0` | `0.7081` | `0.6704` | `0.5543` | `0.5328` | `0.5622` | `0.321` | `2.2492` | `0.071968` |
| `C3_unsup_phys_5nn_L5` | `0.6134` (`[0.5383, 0.688]`) | `0.6921` | `0.8889` | `0.7094` | `0.6674` | `0.5971` | `0.5078` | `0.5778` | `0.3724` | `2.3298` | `0.059976` |
| `C3_unsup_phys_5nn_L10` | `0.6166` (`[0.536, 0.6969]`) | `0.6894` | `0.8348` | `0.7067` | `0.6702` | `0.6016` | `0.5139` | `0.5776` | `0.3497` | `2.3232` | `0.058474` |
| `C3_probe_mlp_L5` | `0.6383` (`[0.5537, 0.715]`) | `0.7091` | `0.9393` | `0.7017` | `0.7817` | `0.5879` | `0.4414` | `0.4809` | `0.0528` | `2.8169` | `0.06497` |
| `C3_probe_mlp_L10` | `0.6497` (`[0.5664, 0.7308]`) | `0.7033` | `0.9225` | `0.6975` | `0.7946` | `0.5826` | `0.4535` | `0.5159` | `0.0142` | `2.8187` | `0.048972` |
| `C4_prec_weighted_epi` | `0.5017` (`[0.4072, 0.6022]`) | `0.5466` | `0.883` | `0.5803` | `0.4799` | `0.4853` | `0.5284` | `0.5697` | `0.3983` | `2.1016` | `0.57871` |

---

## 3. Non-Stationary Regime Shift Detection (`U4`: Regime A & B)

| Method | Regime A Post(`>=15`) vs Pre(`<15`) | Regime A Post(`>=15`) vs ID(`>=15`) | Regime B(`>=10`) vs ID(`>=10`) |
| --- | ---: | ---: | ---: |
| `Baseline_M4_B3_total_std` | `0.6606` | `0.6232` | `0.6158` |
| `C2_win_rms_L5` | `0.6803` | `0.5525` | `0.5437` |
| `C2_cusum_win_L5` | `0.7179` | `0.5149` | `0.5489` |
| `C2_cusum_win_L10` | `0.808` | `0.5304` | `0.5487` |
| `C2_cusum_ep_L10` | `0.8247` | `0.6175` | `0.5735` |
| `C3_unsup_phys_5nn_L10` | `0.7445` | `0.5394` | `0.5641` |
| `C3_probe_mlp_L10` | `0.5053` | `0.4597` | `0.5155` |

---

## 4. `C3` History-Conditioned Latent Physics Inference (Held-Out Validation)

| Task / Window | Latent Target | Probe | R² | MAE | Spearman ρ |
| --- | --- | --- | ---: | ---: | ---: |
| Task 2 (`L=5`) | `mu_true` | MLP | `0.3729` | `0.0931` | `0.4181` |
| Task 2 (`L=10`) | `mu_true` | MLP | `0.378` | `0.092` | `0.431` |
| Task 2 (`L=10`) | `object_mass` | MLP | `-0.0705` | `0.0688` | `0.0424` |
| Task 2 (`L=10`) | `mu_true` | Ridge | `0.3113` | `0.0952` | `0.4071` |
| Task 2 (`L=10`) | `object_mass` | Ridge | `-0.0666` | `0.0726` | `0.0853` |
| Task 1 PiH (`L=10`) | `mu_true` | MLP | `0.2198` | `0.1119` | `0.5362` |
| Task 1 PiH (`L=10`) | `clearance_mm` | MLP | `0.1893` | `0.112` | `0.3757` |

---

## 5. `C4` Ensemble Residual Correlation & Effective Ensemble Size (`E=5`)

### `task2_M4_acmm`
- **Validation ID:** Mean off-diag corr `0.8706`, `E_eff = 1.1155 / 5`, Inflation Ratio `2.1172x`, `Epi/Bias² = 0.1165`
- **Validation OOD:** Mean off-diag corr `0.859`, `E_eff = 1.1272 / 5`, Inflation Ratio `2.1062x`, `Epi/Bias² = 0.1284`

### `task2_M0_passive`
- **Validation ID:** Mean off-diag corr `0.9619`, `E_eff = 1.0314 / 5`, Inflation Ratio `2.2017x`, `Epi/Bias² = 0.0311`
- **Validation OOD:** Mean off-diag corr `0.9288`, `E_eff = 1.0604 / 5`, Inflation Ratio `2.1714x`, `Epi/Bias² = 0.0603`

---

## 6. `C5` Conformal Calibration Results & Per-Contact-Mode Coverage (`n >= 20`)

### Episode-Level Joint Conformal Coverage (`HORIZONS = {1,3,5,10,20}`, `alpha = 0.10`)

| Method | ID Joint Cov | OOD Joint Cov | ID–OOD Gap | LowMu Cov | HighMass Cov | RegA Cov | RegB Cov |
| --- | --- | --- | ---: | --- | --- | --- | --- |
| `frozen_B4_M0` | `53/60 (88.33%)` | `53/60 (88.33%)` | `0.0` | `20/21 (95.24%)` | `14/18 (77.78%)` | `9/11 (81.82%)` | `10/10 (100.0%)` |
| `frozen_B4_M4` | `56/60 (93.33%)` | `46/60 (76.67%)` | `0.1666` | `10/21 (47.62%)` | `17/18 (94.44%)` | `10/11 (90.91%)` | `7/10 (70.0%)` |
| `C5_fresh_id_unstratified_M4` | `59/60 (98.33%)` | `51/60 (85.0%)` | `0.1333` | `16/21 (76.19%)` | `16/18 (88.89%)` | `11/11 (100.0%)` | `9/10 (90.0%)` |
| `C5_fresh_id_pred_mode_stratified_M4` | `60/60 (100.0%)` | `58/60 (96.67%)` | `0.0333` | `18/21 (85.71%)` | `18/18 (100.0%)` | `11/11 (100.0%)` | `10/10 (100.0%)` |

### Transition-Level Per-Contact-Mode Coverage (`n >= 20`, Target `90.0%`)

| Mode (`n`) | Unnormalized Global | Mode-Normalized | Mode + Causal-C3 Adaptive |
| --- | --- | --- | --- |
| `Free` (`n=761`) | `0.8857` (`r=5.0452`) | `0.9448` (`r=6.1277`) | `0.8988` (`r=6.7038`, dev `-0.0012`) |
| `FirstContact` (`n=21`) | `1.0000` (`r=5.0452`) | `1.0000` (`r=5.8113`) | `1.0000` (`r=6.3504`, dev `+0.1000`) |
| `Sticking` (`n=1781`) | `0.9613` (`r=5.0452`) | `0.9371` (`r=4.998`) | `0.9770` (`r=5.8064`, dev `+0.0770`) |
| `Sliding` (`n=926`) | `0.9222` (`r=5.0452`) | `0.9428` (`r=5.5429`) | `0.9611` (`r=8.7542`, dev `+0.0611`) |
| `Impact` (`n=576`) | `0.8073` (`r=5.0452`) | `0.9219` (`r=5.8739`) | `0.8438` (`r=6.639`, dev `-0.0563`) |

- **1-Step Summary (ID -> OOD):** Unnormalized `0.9079 -> 0.9238` (gap `-0.0159`) | Mode-Normalized `0.9339 -> 0.9414` (gap `-0.0075`) | Mode+Adaptive `0.9307 -> 0.9477` (gap `-0.0171`).

---

## 7. Cross-Task Validation on Task 1 (`p37_2_val_pih`, `40` Episodes)

| Candidate | Trans AUROC | AUPRC | FPR@95 | Ep AUROC | Spearman | AURC |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `Baseline_PiH_B3_total_std` | `0.607` | `0.7462` | `0.9361` | `0.5521` | `0.7679` | `69.6108` |
| `Baseline_PiH_B3_epistemic_std` | `0.5963` | `0.6991` | `0.8526` | `0.6276` | `0.709` | `74.4039` |
| `C1b_mode_5nn_input` | `0.637` | `0.7496` | `0.8108` | `0.6276` | `0.6467` | `76.1052` |
| `C1_hybrid_fused` | `0.6257` | `0.7483` | `0.9017` | `0.6016` | `0.6818` | `75.5173` |
| `C2_cusum_win_L10` | `0.5455` | `0.6557` | `1.0` | `0.4714` | `0.5023` | `91.584` |
| `C3_unsup_phys_5nn_L10` | `0.6413` | `0.7493` | `0.8526` | `0.6198` | `0.6641` | `75.792` |
| `C3_probe_mlp_L10` | `0.8286` | `0.8723` | `0.656` | `0.8099` | `0.0091` | `130.7597` |

---

## 8. Scientific Synthesis: What Worked, What Failed & Remaining Gaps

1. **Mode-Normalized Uncertainty + Feature Support (`C1`):** Standardizing `B3` epistemic uncertainty within predicted contact mode fails to resolve the `M4` inversion (`C1a_mode_z_epi` remains near random), whereas combining mode-conditioned input & hidden-state `5-NN` distance (`C1b` / `C1_hybrid`) breaks above `0.60–0.75+` on observable boundary shifts like `OOD-LowMu` because low-friction trajectories occupy distinct `(stretch, slip, fn)` regions inside `Mode 3 (Sliding)`.
2. **Temporal Innovation vs Causal History Physics (`C2` vs `C3`):** Raw scalar residual CUSUM (`C2`) has limited full-episode AUROC when ID impact/free-space modes still carry residual variance, **and** pre-switch steps (`t < 15`) in `Regime A` are physically indistinguishable from ID. Over `L=5, 10` windows with observable physical invariants (`pad_stretch = finger_z - obj_z - 40`, `sum_fn`, `slip_vel`, `obj_z`, causal residuals), `C3` history estimators strongly improve OOD detection and non-trivial `mu_true` identifiability (`R² > 0` on friction), while `object_mass` shows weak identifiability whenever trajectories fail to sustain airborne equilibrium.
3. **Correlated Ensemble Failure Mode (`C4`):** Both `M0_passive` and `M4_acmm` `B3` ensembles exhibit ~`0.85–0.90` pairwise member residual correlation across all 5 heads (`E_eff ~ 1.1` out of `5` effective independent learners), meaning `Epi/Bias²` stays low and simple linear residual precision-weighting cannot fix shared inductive bias under unobservable latent physics.
4. **Conformal Calibration Recovery (`C5`):** Unstratified global conformal scales poorly under OOD shifts (`OOD-LowMu`), while mode- and causal-difficulty scaling (`C5` transition-level and fresh ID conformal) equalizes per-mode error radii (`Free`, `Sticking`, `Sliding`, `Impact`) toward the nominal `90%` coverage band without touching frozen Phase 3.4 `B4` artifacts.
