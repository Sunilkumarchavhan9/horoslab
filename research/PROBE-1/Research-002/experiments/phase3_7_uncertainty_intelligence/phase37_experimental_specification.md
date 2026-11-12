# Phase 3.7 Experimental Specification: Epistemic Uncertainty & Trust-Aware World-Model Intelligence

**Status:** `DESIGN_FROZEN_AWAITING_EXECUTION_AUTHORIZATION`  
**Program Version:** `v1.0-phase3.7-spec-frozen`  
**Protocol Schema:** `phase3_7_uncertainty_protocol_v1`  
**Frozen Manifest:** [`manifests/phase37_uncertainty_manifest.json`](../../manifests/phase37_uncertainty_manifest.json)  
**Manifest SHA-256:** `391a652c93e9d0a844f2a1f5f2f07cc0c3d5239a46eb64ffb0f68b4560085795`  
**Precondition:** Phase 3.6 Formal Six-Gate Adjudication Passed (`closure_adjudicated_six_gates = 1`, `manifests/phase36_validation_manifest.json` core SHA-256 prefix `e3209e0d...` / closure SHA-256 `b25cb1f09e447228543bb8b0e3b712ac970af4e0ddf1759247351648c082492c`)

---

## 1. Execution & Immutability Policy

- **Design-Only Readiness Phase:** Zero model training, zero checkpoint modification, zero closed-loop campaign runs, and zero test-pool execution are authorized under this specification.
- **Checkpoint Freeze Policy:** All Phase 3.4 `B1–B4` checkpoints remain frozen throughout Track `3.7.1` diagnostics and initial `3.7.2` calibration analysis. No Phase 3.4, Phase 3.5, Phase 3.5.1, Phase 3.5.2, Safety Architecture v1.0, or Phase 3.6 files or archives may be modified.
- **Strict Seed Hygiene:** Zero overlap with prior training, calibration, offline, closed-loop, and Phase 3.6 robustness validation seed pools (`0..8849`). Evaluation pools may never be used for training, normalization fitting, or conformal threshold selection.

---

## 2. Archived Phase 3.5 Uncertainty & Conformal Baselines (Frozen Reference)

All baselines below are reproduced directly from archived Phase 3.5 evidence (`phase35_closure_addendum.json`, SHA-256 `87bae105f7d78eb92faec7f33a158d733af252a863aaf1005d6d0c8a772fab47`):

| Metric | Value | Source Scope |
| --- | --- | --- |
| `M0_passive` `B2` transition AUROC (`total_std`) | `0.5318` | Phase 3.5 120-ep offline audit |
| `M0_passive` `B3` transition AUROC (`total_std`) | `0.5115` | Phase 3.5 120-ep offline audit |
| `M0_passive` `B3` transition AUROC (`epistemic_std`) | `0.5511` | Phase 3.5 120-ep offline audit |
| `M4_acmm` `B3` transition AUROC (`total_std`) | `0.4169` | Phase 3.5 120-ep offline audit |
| `M4_acmm` `B3` transition AUROC (`epistemic_std`) | `0.4627` | Phase 3.5 120-ep offline audit |
| `M4_acmm` `B3` OOD-LowMu AUROC (`total_std`) | `0.3347` | Phase 3.5 120-ep offline audit |
| `M4_acmm` `B3` OOD-LowMu AUROC (`epistemic_std`) | `0.4450` | Phase 3.5 120-ep offline audit |
| `B4` matched `EpisodeConformalEngine` ID joint coverage | `38/40` (`95.0%`) | Phase 3.5 matched conformal event |
| `B4` matched `EpisodeConformalEngine` OOD joint coverage (`M0`) | `35/40` (`87.5%`) | Phase 3.5 matched conformal event |
| `B4` matched `EpisodeConformalEngine` OOD joint coverage (`M4`) | `32/40` (`80.0%`) | Phase 3.5 matched conformal event |

> **Note on `B4` Event Separation:** Uncalibrated low percentages (`2.5%–17.5%` Task 2, `45.0%` Task 1) in `phase35_offline_120ep_results.json` evaluated L2 norms over steps `1..T_avail` with `1-p(y)` mode scores against Bonferroni quantiles calibrated under `EpisodeConformalEngine` ($L_\infty$ over horizons `H in {1,3,5,10,20}` with `compute_aps_score`). Under the matched event, ID meets nominal coverage (`95.0%`) while OOD degrades to `87.5%` (`M0`) and `80.0%` (`M4`).

---

## 3. Authorized Research Workstreams (Awaiting Execution Approval)

### Track `3.7.1`: Diagnose Epistemic Uncertainty Collapse & Inversion Under OOD
- **Mode:** `READ_ONLY_FROZEN_CHECKPOINTS_AND_ARCHIVES` (`training_permitted = 0`)
- **Archived & Offline Inputs:**
  - `experiments/phase3_5_evaluation/phase35_offline_120ep_results.json`
  - `experiments/phase3_5_evaluation/phase35_closed_loop_450ep_results.json`
  - `experiments/phase3_6_robustness_validation/phase36_validation_results.json`
  - `datasets/phase3_4/{offline_test_id,offline_test_ood,offline_test_peg_in_hole}`
- **Diagnostic Axes:**
  1. Epistemic vs. aleatoric variance decomposition across `B2` and `B3` (5-member ensemble disagreement vs. predicted heteroscedastic variance).
  2. Normalization scaling & input saturation analysis in `src/models/normalization.py` explaining lower `total_std` under OOD-LowMu (`0.3347`) and OOD-HighMass (`0.469`).
  3. Contact-mode transition stratification (`strata 0..4`) comparing true MSE/MAE against predicted `epistemic_std` and `total_std` across horizons `H in {1,3,5,10,20}`.
  4. Feature/latent representation shift metrics (Mahalanobis / kNN feature distance vs. ensemble disagreement) on frozen `M0_passive` and `M4_acmm` encoders.

### Track `3.7.2`: Contact-Mode-Aware Uncertainty Quantification & Conformal Calibration Design
- **Mode:** `FROZEN_BASE_MODELS_CALIBRATION_DESIGN_NO_RETRAINING` (`training_permitted = 0`)
- **Design Components:**
  1. Contact-mode-conditioned nonconformity normalization separating free-space, impact, sliding, wedging, and seated strata.
  2. Stratified OOD detection evaluation metrics: AUROC, AUPRC, FPR@95TPR, Spearman error-uncertainty correlation, and selective Risk-Coverage / AURC.
  3. `B4` conformal coverage recovery target under OOD (closing the matched ID `95.0%` vs. OOD `80.0%` `M4` / `87.5%` `M0` gap without contaminating evaluation seeds).
  4. Strict disjointness guarantee preserving all prior seed pools (`<= 8849`).

### Track `3.7.3`: Uncertainty-Conditioned Planning & World-Model Trust Arbitration Design
- **Mode:** `SPECIFICATION_AND_ABALATION_PROTOCOL` (`training_permitted = 0`)
- **Design Components:**
  1. Trust-gate arbitration rule: when normalized/hybrid epistemic + distance-aware OOD score flags unreliable rollouts, shrink effective planning horizon `H_eff`, increase uncertainty penalty, or abstain toward conservative `GeometryAwareCBFSafetyFilter` tube limits.
  2. Dual-task evaluation matrix spanning Task 1 (Peg-in-Hole OOD & boundary stress) and Task 2 (CompliantPreLift OOD-LowMu / HighMass / RegimeA / RegimeB).
  3. Non-degradation invariant: zero increase in safety violations (preserving the Phase 3.6 `0/1,135` PiH physical safety record) and maintained Task 1 valid-domain seating (`>= 95%`).

---

## 4. Acceptance Gates (`U1–U5`)

| Gate ID | Criterion |
| --- | --- |
| `U1_root_cause_attribution_reproducible` | Deterministic reproduction of Phase 3.5 `M4_acmm` `B3` OOD AUROC (`0.4169` transition `total_std` / `0.3347` LowMu) and quantitative decomposition of epistemic vs. aleatoric variance inversion. |
| `U2_mode_conditioned_ood_discrimination` | Calibrated contact-mode-aware detector achieves statistically validated improvement over frozen baseline AUROC (`>= 0.75` OOD vs. ID without training on Phase 3.5/3.6 evaluation pools). |
| `U3_conformal_coverage_and_risk_coverage` | Improved selective Risk-Coverage AURC and bounded OOD conformal coverage gap while keeping `B1–B4` checkpoints untouched unless explicit Phase 3.7 execution retraining addendum is authorized. |
| `U4_safety_and_task1_non_regression` | Preserve `0/1,135` PiH crush/`SafetyEvaluator` violations and valid-domain seating under any trust-gated planner integration. |
| `U5_strict_artifact_and_seed_hygiene` | `100%` SHA-256 immutability of Phase 3.4, 3.5, 3.6 archives and Safety Architecture v1.0; zero overlap with all prior seed pools (`0..8849`). |

---

## 5. Locked Upstream SHA-256 Inventory

### Phase 3.5 Archive (`locked_phase35_archive_sha256`)
- `phase35_offline_120ep_results.json`: `0d700fdec06324ce76c687c3557358c4e4232c1f1d8e9923000883fe201812f1`
- `phase35_closed_loop_450ep_results.json`: `8bb42e1a852c9dc61446d9f4fd689c596b1763e675b81a5754aa0ae0bc859653`
- `phase35_statistical_comparison.json`: `b4f90493b84c2414ce5f97f3143be69e562edb0e5559c9d292318430fc409fec`
- `phase35_master_report.json`: `3945a8cc988c990933470dfec31efd651f808819ae4933325b5eb772ba7ec745`

### Safety Architecture v1.0 & Prior Manifests (`locked_safety_v1_sha256`)
- `src/safety/pcbf_safety_filter.py`: `458ce865e34b27c9b1233bb477a994e1caa09e66b48a9da1b4b02a5b0b366277`
- `src/coordination/plcea_substitutor.py`: `0f4980e37e1b2776f20769582f5f3492b6aa7c3aa18a85243bf5d9faac5ea924`
- `experiments/phase3_5_evaluation/phase35_closure_addendum.json`: `87bae105f7d78eb92faec7f33a158d733af252a863aaf1005d6d0c8a772fab47`
- `experiments/phase3_5_evaluation/phase35_1_peginhole_correction.json`: `c3ffb50362e21cff7f889c2c5784addaf4886b8ec0afccff864a6954e5817b93`
- `manifests/phase34_dataset_manifest.json`: `29281d1d8b6b003961ca5457690bebb3cc8282040bb480fa555ac9ed8fd93256`
- `manifests/ood_regime_manifests.json`: `96125f1588c2e517be170fb9fde727cc424ce8a3d472ea59d4bd2f5f768f2d66`
- `src/safety/geometry_cbf_safety_filter.py`: `77e26c13ddc5b3cd5824604f11ccf08c61379b5f3a9965365de0be654e34d58e`
- `src/integrated/peginhole_phase352_controller.py`: `cb68e66727a892f2f96f819fb1d134e264136ccb5c227b7de37f95dc163545a0`
- `experiments/phase3_5_2_safety_investigation/phase35_2_pilot_manifest.json`: `a95aaf1de06b631bbd04791374446edeec0a5ca71dc4d19ab524759fcfd212b4`
- `experiments/phase3_5_2_safety_investigation/phase35_2_investigation.json`: `39d45530dbf24b7a875a8003f5b15a29c3488ab2fada69d4175cb8f3f1e2efd5`
- `experiments/phase3_5_2_safety_investigation/phase35_2_telemetry_audit.json`: `25b47afa9b77d3a141290b9163fcd71f86afb8cacc8af0c453abc31b750754c0`

### Phase 3.6 Validation & Closure (`locked_phase36_archive_sha256`)
- `manifests/phase36_validation_manifest.json`: `e3209e0d631f8496386a5e3792ec233532e9dc767944dacf8a3cb25a4adffd6f`
- `experiments/phase3_6_robustness_validation/phase36_validation_results.json`: `0f6415347918d289f30989ab31859f217438378f2210bfbfdff5b06d832909cd`
- `experiments/phase3_6_robustness_validation/phase36_closure_adjudication.json`: `b25cb1f09e447228543bb8b0e3b712ac970af4e0ddf1759247351648c082492c`
