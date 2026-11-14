# Phase 3.7.1 Diagnostic Report: Epistemic Uncertainty Collapse & Inversion Under OOD

**Program:** HOROS PROBE-1 — Research-002  
**Execution Mode:** `READ_ONLY_FROZEN_CHECKPOINTS_AND_ARCHIVES` (`training_permitted = False`, zero recalibration, zero planner/safety changes)  
**Phase 3.7 Frozen Manifest SHA-256:** `391a652c93e9d0a844f2a1f5f2f07cc0c3d5239a46eb64ffb0f68b4560085795`  
**Machine-Readable Companion:** [`phase37_1_epistemic_ood_diagnostics.json`](./phase37_1_epistemic_ood_diagnostics.json)

---

## 1. Executive Synthesis & Exact U1 Baseline Reproduction

All archived Phase 3.5 `M4_acmm` `B3` OOD AUROC anomalies reproduce with `0.0000` discrepancy from frozen Phase 3.4 checkpoints:

| Benchmark Metric | Archived Phase 3.5 | Reproduced Phase 3.7.1 | Delta |
| --- | --- | --- | --- |
| `M4_acmm` `B3` Task 2 OOD `total_std` AUROC | `0.4169` | `0.4169` | `0.0000` |
| `M4_acmm` `B3` Task 2 OOD `epistemic_std` AUROC | `0.4627` | `0.4627` | `0.0000` |
| `M4_acmm` `B3` OOD-LowMu `total_std` AUROC | `0.3347` | `0.3347` | `0.0000` |
| `M4_acmm` `B3` OOD-LowMu `epistemic_std` AUROC | `0.4450` | `0.4450` | `0.0000` |
| `M0_passive` `B3` Task 2 OOD `total_std` AUROC | `0.5115` | `0.5115` | `0.0000` |
| `M0_passive` `B3` Task 2 OOD `epistemic_std` AUROC | `0.5511` | `0.5511` | `0.0000` |

### Root-Cause Explanation: Four Coupled Mechanisms Behind `M4_acmm B3` OOD Collapse

1. **Feature-Support Alignment with Active Boundary Mining (Not Normalization Distortion):** Normalized z-space AUROC (`M4 B3`: `0.4161` total / `0.4615` epistemic) matches physical-unit AUROC (`0.4169` / `0.4627`), demonstrating that `FeatureStandardizer` scaling does not cause the inversion; the collapse occurs directly inside the normalized ensemble outputs (`epi_z` mean `1.1916` ID → `1.0700` OOD; `tot_z` `3.1673` → `2.9215`).
2. **Within-Mode Collapse Dominates Over Mode-Mix Shift:** `M4_acmm` trained on `n=1,190` actively mined transitions heavily concentrated in contact modes (`Mode 2 = 498`, `Mode 3 = 361`, `Mode 4 = 270`, vs `Mode 0 = 61`, `Mode 1 = 0`). Although `OOD-LowMu` shifts `51.3%` (`337/657`) of transitions into `Mode 3 (Sliding)`, counterfactual re-weighting of ID per-mode means by OOD mode weights shows mode-mix shift contributes `+0.0092`, whereas **within-mode collapse** contributes `-0.1052` (>100% of the `-0.0960` net epistemic drop).
3. **Confident Extrapolation Under Unobservable Latent Physics (`mu_true`, `object_mass`):** Within `Mode 3 (Sliding)`, `M4 B3` epistemic std drops `0.9771` (ID) → `0.7877` (OOD, within-mode AUROC `0.3768`; total AUROC `0.2468`) and aleatoric std drops `3.2230` → `2.5013`. While `B3` ensemble disagreement accurately tracks its own hidden-space distance (`Spearman(Hidden 1-NN, epi_std) = 0.853` ID / `0.8795` OOD), `OOD-LowMu Mode 3` settles into sustained high-normal-force clamping (`mean fn = 18.889 N` vs ID `3.588 N`) with smaller per-step `|slip|` (`0.116` vs `0.867`). Because `mu_true` is unobserved in `s_t`, these points map *closer* to `M4`'s boundary-mined high-force manifold in standardized input Mahalanobis (`12.036` vs ID `30.25`) and LayerNorm hidden 1-NN space (`1.4234` vs `1.7106`).
4. **Shared Inductive Bias & Aleatoric Dominance Across Identically Initialized Bootstrap Members:** All `5` `B3` heads share identical MLP-LayerNorm architecture (`hidden_dim=64`, `45` epochs, `100%` gradient-clipped at `1.0`, shared scaler). In `M4_acmm`, epistemic variance (`1.3769` ID / `1.0766` OOD) is dwarfed by shared ensemble bias² (`9.9587` ID / `8.9067` OOD; `Epi/Bias² = 0.1383` ID, `0.1209` OOD) and by aleatoric variance (`~83–84%` of `total_var`; `B2` alone yields `0.4234` OOD AUROC). Pairwise member error correlation is `0.8489` (ID) and rises to `0.8666` (OOD), while predicted delta cosine similarity rises from `0.7686` to `0.8265`.

---

## 2. Epistemic & Aleatoric Variance Distributions (ID vs OOD)

| Condition / Split | n | Error L2 Mean (SD) | Epistemic Std Mean (Med, IQR) | Aleatoric Std Mean (Med, IQR) | Total Std Mean (Med, IQR) | Norm-z Epi Mean | Norm-z Tot Mean |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `M0_passive` ID | `1192` | `2.5216` (`2.4807`) | `0.6005` (`0.4806`, `0.5368`) | `2.4058` (`1.9729`, `1.5565`) | `2.4839` (`2.0331`, `1.5938`) | `0.7864` | `2.7098` |
| `M0_passive` OOD | `1493` | `2.0982` (`2.1962`) | `0.681` (`0.6127`, `0.7956`) | `2.4654` (`2.0837`, `1.8296`) | `2.5646` (`2.1929`, `1.9751`) | `0.8669` | `2.7445` |
| `M4_acmm` ID | `1192` | `2.6048` (`1.7822`) | `1.018` (`1.0542`, `1.0784`) | `2.6088` (`2.4458`, `0.8112`) | `2.8607` (`2.7391`, `0.7913`) | `1.1916` | `3.1673` |
| `M4_acmm` OOD | `1493` | `2.5742` (`1.5105`) | `0.922` (`0.7851`, `0.7431`) | `2.4473` (`2.3204`, `0.8294`) | `2.6567` (`2.5889`, `0.9357`) | `1.07` | `2.9215` |

---

## 3. OOD Regime Behavior (`LowMu`, `HighMass`, `Regime A`, `Regime B`)

| Sub-Stratum | n | `M4` Err Mean | `M4` Epi Std (AUROC) | `M4` Tot Std (AUROC) | `M0` Epi Std (AUROC) | `M0` Tot Std (AUROC) | `M4` Norm-z Tot AUROC |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `OOD-HighMass` | `423` | `2.6717` | `0.8927` (`0.4459`) | `2.7444` (`0.469`) | `0.6101` (`0.4957`) | `2.3876` (`0.4666`) | `0.4815` |
| `OOD-LowMu` | `657` | `2.5593` | `0.8683` (`0.445`) | `2.4915` (`0.3347`) | `0.806` (`0.6584`) | `2.7856` (`0.583`) | `0.3188` |
| `OOD-RegimeA-FrictionStep` | `222` | `2.5723` | `1.1479` (`0.565`) | `2.9802` (`0.5756`) | `0.4824` (`0.352`) | `2.1611` (`0.3463`) | `0.6036` |
| `OOD-RegimeB-MassInflux` | `191` | `2.4119` | `0.9089` (`0.442`) | `2.6549` (`0.4`) | `0.6386` (`0.5361`) | `2.6656` (`0.5569`) | `0.3879` |

- **Non-Stationary Regimes (`Regime A` & `Regime B`):** For `M4_acmm B3`, `OOD-RegimeA-FrictionStep` is the *only* stratum above `0.50` (`0.5650` epi / `0.5756` tot) due to post-switch sliding transients (`epi` `1.1367` pre → `1.1591` post; `tot` `2.8157` → `3.1447`). Conversely, `OOD-RegimeB-MassInflux` exhibits pre-switch epistemic collapse (`0.8779` pre → `0.9397` post, AUROC `0.4000` tot / `0.4420` epi).

---

## 4. Prediction Error vs Uncertainty Relationship & Multi-Horizon Divergence

| Condition | Pool | Spearman(Err, Epi) | Spearman(Err, Tot) | AURC (Epi) | AURC (Tot) | Oracle AURC | Risk@50% (Epi) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `M0_passive` | ID | `0.5616` | `0.5773` | `1.6162` | `1.5814` | `1.1475` | `1.5784` |
| `M0_passive` | OOD | `0.2379` | `0.333` | `1.5491` | `1.4485` | `0.9161` | `1.7544` |
| `M4_acmm` | ID | `0.4597` | `0.4072` | `1.8186` | `1.9176` | `1.2282` | `2.2244` |
| `M4_acmm` | OOD | `0.4046` | `0.3537` | `1.954` | `1.9999` | `1.3727` | `2.1583` |

### Multi-Horizon Rollout Error Divergence vs Shrinking Epistemic Uncertainty (`M4_acmm B3`)

| Horizon `H` | ID Rollout Err L2 | OOD Rollout Err L2 | ID Epi Std | OOD Epi Std | Epi AUROC | Tot AUROC |
| --- | --- | --- | --- | --- | --- | --- |
| `H=1` | `4.7465` | `4.7324` | `0.7519` | `0.786` | `0.5181` | `0.5175` |
| `H=3` | `5.6264` | `5.2308` | `0.7981` | `0.8169` | `0.5319` | `0.4944` |
| `H=5` | `6.8736` | `6.5558` | `0.653` | `0.6841` | `0.5312` | `0.4688` |
| `H=10` | `11.9132` | `14.0812` | `0.8188` | `0.7807` | `0.5319` | `0.4069` |
| `H=20` | `27.547` | `32.0972` | `0.8833` | `0.8145` | `0.4078` | `0.2727` |

Even as `H=20` open-loop error diverges higher under OOD (`32.097` vs `27.547`, +16.5%) and `object_pos_16_19` 1-step RMSE worsens (`0.0712` → `0.0837`), `M4 B3` predicted uncertainty shrinks monotonically (`H=20` `total_std` AUROC drops to `0.2727`).

---

## 5. Contact-Mode Stratification (`M4_acmm` vs `M0_passive`)

| Mode | Train `M4`/`M0` | ID Frac | OOD Frac | `M4` ID→OOD Epi | `M4` Mode AUROC (Epi / Tot) | `M0` ID→OOD Epi | `M0` Mode AUROC (Epi / Tot) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `0 (Free)` | `61` / `1014` | `0.179` | `0.205` | `1.3281` → `1.3033` | `0.4683` / `0.437` | `0.292` → `0.2827` | `0.4633` / `0.4728` |
| `1 (FirstContact)` | `0` / `39` | `0.003` | `0.007` | `1.3136` → `1.3216` | `0.55` / `0.2` | `0.2792` → `0.2543` | `0.35` / `0.575` |
| `2 (Sticking)` | `498` / `1484` | `0.551` | `0.327` | `0.9688` → `0.9088` | `0.4862` / `0.4362` | `0.6495` → `0.6052` | `0.4521` / `0.4553` |
| `3 (Sliding)` | `361` / `212` | `0.146` | `0.321` | `0.9771` → `0.7877` | `0.3768` / `0.2468` | `0.7893` → `0.9833` | `0.6974` / `0.6305` |
| `4 (Impact)` | `270` / `251` | `0.121` | `0.141` | `0.8254` → `0.6842` | `0.4625` / `0.4318` | `0.6142` → `0.7682` | `0.6654` / `0.6158` |

---

## 6. Cross-Task (`Peg-in-Hole`) & Closed-Loop Consistency

- **Task 1 (`Peg-in-Hole` `B3`):** Confirms structural generality—`M4_acmm` drops from `epi=50.4196` / `tot=122.701` on `Peg-ID` to `epi=44.9022` / `tot=117.7719` on `Peg-OOD` (AUROC `epi=0.4877`, `tot=0.4891`), while `M0_passive` increases (`epi=97.1609` → `111.3826`, `tot=281.9454` → `297.2719`; AUROC `epi=0.5713`, `tot=0.5236`).
- **Task 2 Closed-Loop 450-ep Archive:** `C06 (M4|B3|ID)` mean epistemic uncertainty is `1.2786` (`aleatoric=2.3158`), dropping to `1.1366` (`aleatoric=2.1924`) in `C12 (M4|B3|OOD)` despite OOD difficulty and `2/25` safety violations. Meanwhile `M0|B3` stays slightly higher in OOD (`C03` `0.4477` → `C09` `0.4577`).

---

## 7. `B4` Conformal Coverage Reference (Zero Recalibration)

- **`offline_test_id`:** Both `M0_passive` and `M4_acmm` achieve exact matched nominal simultaneous coverage at **`38/40` (`95.0%`)** (`state=97.5%`, `wrench=97.5%`, `mode=100.0%`).
- **`offline_test_ood` (`M4_acmm`: `32/40 = 80.0%` vs `M0_passive`: `35/40 = 87.5%`):** Sub-stratum dissection shows **7 of 8 `M4_acmm` conformal misses occur in `OOD-LowMu`** (`7/14 = 50.0%` joint; `state=0.857`, `wrench=1.000`, `mode=0.643`), while `OOD-HighMass` (`11/12 = 91.7%`), `RegimeA` (`7/7 = 100.0%`), and `RegimeB` (`7/7 = 100.0%`) total `25/26 (96.2%)`. Thus `M4`'s OOD conformal deficit is concentrated precisely in the `LowMu` sliding-mode regime where ensemble & APS calibration rely on nominal friction assumptions.

---

## 8. Limitations, Scientific Conclusions & Next-Step Justification (Phase 3.7.2)

- **Limitations:** Offline `n=40/pool` evaluation episodes limit statistical precision in `Mode 1 (FirstContact)` (`4` ID / `10` OOD transitions) and `RegimeA/B` (`7` episodes each). Latent `mu_true` and `object_mass` are physically unobservable in single-step state `s_t`, so single-step `(s_t, a_t)` distance alone cannot detect static parameter shifts before contact slip/acceleration residuals accumulate over multi-step windows.
- **Design Implication for Track `3.7.2` (No Retraining Required Initially):** Because `M4 B3` already tracks its normalized/hidden support distance reliably (`Spearman >= 0.85`), **contact-mode-conditioned conformal/Mahalanobis scoring** combined with short-window physics-residual surprise (separating `Mode 0..4` and weighting kinematic + APS mode nonconformity instead of uncalibrated physical L2 variance) directly addresses both Simpson's-paradox mode-mix bias and `OOD-LowMu` confident extrapolation without modifying frozen `B1–B4` weights.

---

## 9. Reproducibility & Source Integrity Receipts

- **Python / PyTorch:** `3.12.10` / `torch==2.13.0+cpu` (`numpy==2.5.2`)
- **Phase 3.4 Dataset Manifest SHA-256:** `29281d1d8b6b003961ca5457690bebb3cc8282040bb480fa555ac9ed8fd93256`
- **Phase 3.4 Training Report SHA-256:** `eda6781cdd075f02922ab00e89807b50530dd928a2eece5bb9dfbc058e3fa644`
- **Phase 3.6 Validation Manifest SHA-256:** `e3209e0d631f8496386a5e3792ec233532e9dc767944dacf8a3cb25a4adffd6f`
- **Phase 3.6 Results SHA-256:** `0f6415347918d289f30989ab31859f217438378f2210bfbfdff5b06d832909cd`
- Full per-checkpoint (`B1–B4` + `b3_member_0..4`), per-dataset, and per-archive SHA-256 hashes are recorded in `phase37_1_epistemic_ood_diagnostics.json` (`source_verification`).
