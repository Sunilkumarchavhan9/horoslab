# HOROS PROBE-1 — Research-002
## Phase 3.7.2 Experimental Specification: Contact-Mode-Aware Uncertainty and Calibration

**Program:** HOROS PROBE-1 — Research-002 (*Trustworthy Action-Conditioned Contact World Models*)  
**Stage:** Phase 3.7.2 — Experimental Protocol & Readiness Specification  
**Execution Status:** `DESIGN_FROZEN_AWAITING_EXECUTION_AUTHORIZATION` (`training_permitted = 0`, `candidate_evaluation_executed = 0`)  
**Frozen Manifest:** [`manifests/phase37_2_uncertainty_manifest.json`](../../manifests/phase37_2_uncertainty_manifest.json) (`manifest_sha256`: `3fbd26f9c428649b1a8485fa43bab6476b3a603f6e5477b8992e65461b94e700`)  
**Dataset Manifest:** [`datasets/phase3_7_2/phase37_2_dataset_manifest.json`](../../datasets/phase3_7_2/phase37_2_dataset_manifest.json) (`sha256`: `c6fd3f60f982fc6ab08bb0e232b503a404dd47bd4ca6e78b89f0f635a80ba337`)

---

## 1. Scientific Problem Statement & Preconditions

Phase 3.7.1 (`phase37_1_epistemic_ood_diagnostic_report.md`) verified that on frozen `M4_acmm B3`, out-of-distribution (OOD) uncertainty is inverted relative to physical prediction difficulty:

- **Task 2 Frozen `M4_acmm B3` OOD vs ID AUROC:** `0.4169` (`total_std`), `0.4627` (`epistemic_std`)
- **Task 2 Frozen `M4_acmm B3` `OOD-LowMu` vs ID AUROC:** `0.3347` (`total_std`), `0.4450` (`epistemic_std`)
- **Task 2 Frozen `M0_passive B3` OOD vs ID AUROC:** `0.5115` (`total_std`), `0.5511` (`epistemic_std`)
- **Phase 3.7.1 Epistemic Gap Decomposition:** Overall observed epistemic delta `-0.0960`, explained predominantly by within-mode suppression (`-0.1052`) partially offset by contact-mode mix shift (`+0.0092`).
- **Matched Conformal Calibration (`M4_acmm B4`):** Episode-level coverage drops from `38/40 (95.0%)` on ID (`3000–3039`) to `32/40 (80.0%)` on OOD (`3040–3079`), driven by `7/14 (50.0%)` coverage under `OOD-LowMu`.

**Governance & Freeze Policy:**
1. **Zero Unauthorized Retraining:** No new world models (`B1–B4`) or candidate methods are trained or evaluated under this specification freeze (`training_permitted = 0`).
2. **Upstream Immutability:** All Phase 3.4 `B1–B4` checkpoints, calibration artifacts, Phase 3.5 / 3.5.1 / 3.5.2 / 3.6 / 3.7.1 archives, and `GeometryAwareCBFSafetyFilter` (Safety Architecture v1.0) remain SHA-256 locked.
3. **Seed Hygiene:** All historical evaluation/training/calibration seeds lie strictly in `0..8849`. Phase 3.7.2 uses exclusively fresh seeds `>= 9000` (`9000..9359`), strictly partitioned into calibration (`9000..9179`) and held-out validation (`9200..9359`).

---

## 2. Five Workstreams (`3.7.2-A` through `3.7.2-E`)

| Workstream | Scope | Objective & Design Focus |
|---|---|---|
| **3.7.2-A** | **Contact-Mode-Aware Uncertainty** | Estimate and normalize uncertainty separately per physical `ContactMode` (`0: Free`, `1: FirstContact`, `2: Sticking`, `3: Sliding`, `4: Impact`, `5: Jamming`, `6: Release`) so low-variance sliding/free-space transitions are not masked by pooled ID sticking statistics. |
| **3.7.2-B** | **History-Conditioned Physical Inference** | Construct causal sliding-window histories (`L in {5, 10}` steps) over state, action, finger normal forces, slip velocity, and frozen 1-step innovation residuals to infer latent friction (`mu`), effective mass shifts, and non-stationary regime transitions (`RegimeA`, `RegimeB`). |
| **3.7.2-C** | **Contact-Mode-Aware Conformal Calibration** | Design mode-normalized multi-horizon nonconformity scores fitted strictly on fresh calibration ID pools (`p37_2_calib_task2_id`, ID slice of `p37_2_calib_pih`) to recover OOD episode coverage continuity without peeking at validation or Phase 3.5/3.6 eval seeds. |
| **3.7.2-D** | **B3 Ensemble Diversity and Correlated Errors** | Quantify per-mode pairwise member residual correlation, variance inflation factor (VIF), and `Epi / Bias^2` across `B3`'s `E = 5` identically initialized MLP-LayerNorm ensemble members, and benchmark post-hoc decorrelation and frozen-feature distance hybrids prior to deciding if architectural retraining is warranted. |
| **3.7.2-E** | **OOD Detection Evaluation** | Evaluate all candidate uncertainty/inference scores on strictly untouched validation pools (`9200..9359`) reporting transition- and episode-level AUROC, AUPRC, FPR@95TPR, Risk-Coverage AURC, Spearman error-uncertainty correlation, bootstrap 95% CIs (`B = 2000`), and Holm-Bonferroni significance tests. |

---

## 3. Candidate Methods Designed (Awaiting Execution Authorization)

Each candidate approach operates strictly read-only on frozen `M0_passive` and `M4_acmm` world-model weights unless an explicit retraining addendum is later authorized:

1. **Method C1 — Contact-Mode-Normalized Epistemic & Feature Distance (`3.7.2-A`):**
   - For each `ContactMode m in {0..6}`, compute empirical location/scale references (`median_m`, `iqr_m`) and diagonal-Mahalanobis / kNN distance `d_feat(z_t | m)` in the frozen backbone penultimate representation strictly on fresh ID calibration transitions (`9000..9059` for Task 2, ID subset of `9120..9179` for Task 1).
   - Compare scalar per-mode standardized epistemic score `z_epi(s, a | m)` against hybrid mode-aware score `S_C1(s, a, m) = w_e * z_epi(s, a | m) + w_d * z_feat(z_t | m)` tuned exclusively via ID/calib-OOD splits (`9000..9119`), never touching validation `9200..9359`.
2. **Method C2 — Causal Temporal Innovation & Residual CUSUM (`3.7.2-B`):**
   - Track causal sliding windows (`L in {5, 10}`) of standardized 1-step world-model prediction innovations `e_t = s_{t+1} - mu_hat(s_t, a_t)` across kinematics, normal force `fn`, object position, and slip velocity, computing rolling RMS error and one-sided Page-Hinkley / CUSUM change statistics.
   - Evaluates immediate online anomaly accumulation under `OOD-LowMu`, `OOD-HighMass`, and step/influx onsets in `RegimeA` and `RegimeB`.
3. **Method C3 — History-Conditioned Latent Physics Estimator (`3.7.2-B`):**
   - Extract causal window summaries (`L in {5, 10}`) combining action impulses, normal-force/slip ratios (`||v_slip||`, `sum fn`, vertical acceleration vs finger forces) and frozen latent embeddings to regress/classify latent physical regime mismatch (`LowMu` slip signature, `HighMass` inertial lag, `RegimeA`/`RegimeB` drift).
4. **Method C4 — Ensemble Error-Correlation Diagnostics & Precision Weighting (`3.7.2-D`):**
   - Compute `5 x 5` per-mode residual correlation matrix `R_m` across `B3` ensemble heads (`M0` and `M4`), effective ensemble size `E_eff(m)`, and `Epi / Bias^2` ratio.
   - Evaluate covariance-whitened member disagreement `d^T R_m^{-1} d` vs unweighted trace variance to separate genuine multi-head diversity from shared inductive bias.
5. **Method C5 — Mode-Normalized Difficulty-Scaled Conformal Calibration (`3.7.2-C`):**
   - Replace unnormalized scalar residual scoring in `EpisodeConformalEngine` (`alpha = 0.10`, `HORIZONS = {1, 3, 5, 10, 20}`) with nonconformity normalized by the candidate mode-aware/temporal uncertainty denominator `sigma_mode_temp(s_t, a_t, m_t, H)` fitted strictly on fresh calibration seeds (`9000..9059`, `9120..9143`).
   - Enforces zero leakage across calibration (`9000..9179`), validation (`9200..9359`), and historical Phase 3.5/3.6 evaluation pools (`<= 8849`).

---

## 4. Fresh Disjoint Datasets & Seed Allocation

All `340` Phase 3.7.2 episodes (`11,256` transitions total: `6,058` calibration + `5,198` validation) were deterministically generated at `horizon_max = 50` using `ContactBoundarySampler` and `CompliantPreLiftContactEnv` / `PegInHoleEnv` with **0 intersections** against all historical seeds `0..8849`.

| Split Pool | Role | Task / Regime | Seeds | Episodes | Transitions | Sub-Strata Counts | SHA-256 |
|---|---|---|---|---:|---:|---|---|
| `p37_2_calib_task2_id` | Calibration (ID fit) | CompliantPreLift / ID | `9000..9059` | 60 | 1,887 | `ID-Nominal: 60` | `ebbbf97c9276e87daea92ba94882f8bdb699f82930a19f843fe869a2b990f25b` |
| `p37_2_calib_task2_ood` | Calibration (dev OOD) | CompliantPreLift / OOD | `9060..9119` | 60 | 2,369 | `LowMu: 21`, `HighMass: 18`, `RegimeA: 11`, `RegimeB: 10` | `14ac53c05d614f7a240ab54f8cea6da7ff7b7d0485a9abd0a559c6200c392e30` |
| `p37_2_calib_pih` | Calibration | PegInHole / Mixed | `9120..9179` | 60 | 1,802 | `Peg-ID: 24`, `Peg-OOD: 36` | `ebd00c347fea1231a15da48c9d3969038f24b1f68699a304101fee9483e51afa` |
| `p37_2_val_task2_id` | **Held-Out Validation** | CompliantPreLift / ID | `9200..9259` | 60 | 1,846 | `ID-Nominal: 60` | `eb3b7c6ab0fb902d14b9ca598e1cfc5c0d068ef7e4dbd5a8415c085aa7af9c3a` |
| `p37_2_val_task2_ood` | **Held-Out Validation** | CompliantPreLift / OOD | `9260..9319` | 60 | 2,219 | `LowMu: 21`, `HighMass: 18`, `RegimeA: 11`, `RegimeB: 10` | `ef1ec9bd73e59d99fa35fb34b3d0b29ecc228e6200389dbd6483ffc44c58bc53` |
| `p37_2_val_pih` | **Held-Out Validation** | PegInHole / Mixed | `9320..9359` | 40 | 1,133 | `Peg-ID: 16`, `Peg-OOD: 24` | `ba3781798376f0da38cb2ee773a3aa71ff983f4166f1eba4efdd57ab258a9598` |

### Contact-Mode Transition Coverage Across Splits

| Split Pool | Free (`0`) | FirstContact (`1`) | Sticking (`2`) | Sliding (`3`) | Impact (`4`) | Jamming (`5`) | Release (`6`) |
|---|---:|---:|---:|---:|---:|---:|---:|
| `p37_2_calib_task2_id` | 323 | 8 | 981 | 275 | 300 | 0 | 0 |
| `p37_2_calib_task2_ood` | 261 | 12 | 889 | 812 | 395 | 0 | 0 |
| `p37_2_calib_pih` | 985 | 64 | 333 | 410 | 8 | 2 | 0 |
| `p37_2_val_task2_id` | 428 | 12 | 926 | 233 | 247 | 0 | 0 |
| `p37_2_val_task2_ood` | 333 | 9 | 855 | 693 | 329 | 0 | 0 |
| `p37_2_val_pih` | 591 | 48 | 219 | 263 | 5 | 6 | 1 |

---

## 5. Pre-Registered Acceptance Gates (`U1–U5`)

Phase 3.7.2 candidate execution (once authorized) will be judged against the following locked thresholds:

| Gate | Name | Pre-Registered Acceptance Criteria |
|---|---|---|
| **U1** | Frozen Baseline Parity | Reproduce frozen `M4_acmm B3` Phase 3.7.1 OOD AUROCs (`0.4169` total, `0.4627` epi; `OOD-LowMu`: `0.3347` total, `0.4450` epi) within `<= 1e-4` and record uncalibrated frozen baseline performance on fresh `p37_2_val_*` pools. |
| **U2** | OOD Discrimination Improvement | On strictly untouched `p37_2_val_task2_*` (`9200..9319`): transition OOD AUROC `>= 0.75`, `OOD-LowMu` transition AUROC `>= 0.75`, episode OOD AUROC `>= 0.80`, `FPR@95TPR <= 0.65`, bootstrap 95% CI lower bound `> 0.70`, and Holm-Bonferroni `p < 0.05` over frozen `B3`. |
| **U3** | Mode-Conditioned Conformal Recovery | Fitting strictly on `p37_2_calib_*` (`alpha = 0.10`): held-out ID episode coverage `>= 0.88`, OOD episode coverage `>= 0.85`, ID-OOD gap `<= 0.05`, selective Risk-Coverage AURC reduction `>= 25%` vs frozen `B3/B4`, and per-mode deviation `<= 0.08` (`n >= 20`). |
| **U4** | Temporal Inference & Diversity Diagnostics | Causal sliding-window estimator detects non-stationary regimes (`RegimeA` step / `RegimeB` influx) post-onset with AUROC `>= 0.80`, positive error-uncertainty Spearman `rho >= 0.25`, and complete `E = 5` `B3` residual correlation & `Epi / Bias^2` reporting. |
| **U5** | Seed Hygiene & Immutability | `0` overlaps with historical pools `0..8849`, `0` overlap between calibration and validation splits, `0` SHA-256 mismatches across frozen Phase 3.4–3.7.1 & Safety Architecture v1.0, and `training_permitted = 0` throughout the specification freeze. |

---

## 6. Reproducibility & Verification Commands

- Artifact generation & manifest freeze:
  `python research/PROBE-1/Research-002/scripts/prepare_phase37_2.py`
- Readiness & governance test suite:
  `python -m pytest tests/test_p32_phase37_2_readiness.py -v`
