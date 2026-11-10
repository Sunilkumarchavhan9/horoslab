# HOROS PROBE-1 — Research-002: Trustworthy Contact World Models
# Document 53: Research-002 World Model Evaluation Protocol (Phase 3 Transition Audit & Corrected Specification)

**Author:** Sunil Kumar Chavhan (`sunil@horoslab.org`)  
**Organization:** HOROS Physical Intelligence Research Group (H.R.)  
**Date:** November 10, 2026  
**Document Version:** 1.1 (Statistical Derivations, 18×25 Matrix & Episode Accounting Corrected)  
**Status:** **Revision 1.1 Ready for Protocol Freeze (No Python Remediation or Model Training Executed Yet)**  
**Preserved Frozen Baselines:**  
- Phase 1 PLCEA Tests: `a7f0cb59` (`MemoryOS`) / `3d35ab4` (`horos-probe-1`)  
- Phase 2 PLCEA Controller: `0442d0f2` (`MemoryOS`) / `09d6311` (`horos-probe-1`)  
- Historical Documents `00`–`52` & Existing `84/84` Test Suite Preserved Intact (`84 passed in 4.82s` verified post-cleanup)  
**Physical Safety & Simulator Scope Disclaimer:** All empirical simulations authorized under this protocol execute inside pure-Python deterministic/stochastic contact models plus calibrated ATI Nano17 bench noise baselines (`ati_nano17_10k_baseline.npz`). **No Isaac Sim runtime, PhysX backend, `GrootTeleopG1Dataset` HDF5 files, or physical robot hardware exist in this workspace.** Simulation performance under this protocol **does not** demonstrate real-world robotic capability and **does not** authorize live hardware manipulation.

---

## Executive Intent & Transition to Phase 3

With Phases 1–2 completing and freezing the [`PLCEAActionSubstitutor`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/coordination/plcea_substitutor.py) evidence-acquisition infrastructure, Phase 3 returns directly to the scientific core of HOROS PROBE-1 Research-002:

> **Does an action-conditioned contact world model trained via active contact-mode mining (`M4`) predict contact state trajectories, discrete modes, wrench/slip dynamics, and calibrated uncertainty more accurately than a passive world model (`M0`) — including under unseen friction, payload, and jamming conditions — and measurably improve closed-loop manipulation outcomes across deterministic (`B1`), probabilistic (`B2`), and ensemble (`B3`) planner architectures?**

This document enforces strict scientific separation across:
1. **What is implemented in code** across `MemoryOS` and `horos-probe-1`,
2. **What has been verified through software unit/integration tests and scripted simulations**, and
3. **What has been scientifically demonstrated vs. what remains unproven**.

---

## Part I — Implemented vs. Validated vs. Unproven (Cross-Repository Audit)

### 1. Component & Evidence Classification Table

| Domain | Implemented in Code | Verified Through Software Tests & Scripted Simulation | Scientifically Demonstrated vs. Unproven |
|---|---|---|---|
| **PLCEA Safety Controller** | [`PLCEAActionSubstitutor`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/coordination/plcea_substitutor.py), [`PLCEAGateEvaluator`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/coordination/plcea_substitutor.py), `PLCEAState` (`S0`–`S6`), 10 independent authorization gates (`G1`–`G10`). | **84/84 tests PASS** (`15` Phase 1 invariant tests + `12` Phase 2 controller & `CompliantPreLiftContactEnv` tests + `57` regression tests). | **Verified as safe evidence-acquisition infrastructure in software/compliant simulation.** Not the world model research outcome; real hardware safety remains unvalidated. |
| **World-Model Architectures (`B1`–`B4`)** | [`DeterministicWorldModel`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/models/deterministic_wm.py) (`B1`), [`ProbabilisticWorldModel`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/models/probabilistic_wm.py) (`B2`), [`EnsembleWorldModel`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/models/ensemble_wm.py) (`B3`, `E=5`), [`ContactStratifiedConformalWM`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/models/stratified_conformal_wm.py) (`B4`). | Only `B1` (`DeterministicWorldModel` via [`ModelTrainingRunner`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/integrated/model_training_runner.py)) was executed across P2.2–P2.6. P1 stress test (`results_stress_test.json`) ran `B1`/`B2`/`B3`/`B4` at `15 ep/regime` (`0.0%` task success across all policies). | **Unproven:** Head-to-head comparison of `B1`, `B2`, and `B3` across passive (`M0`) vs. ACMM (`M4`) datasets, with `HybridContactStateModel` currently returning `state_uncertainty == 0.0`. Zero saved `.pt`/`.pth` checkpoints exist on disk. |
| **7 Contact Modes & Hybrid Dynamics** | [`ContactMode`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/contact_modes/contact_mode_definitions.py) (`0..6`), rule labeler, 7-class MLP + APS [`ContactModeClassifier`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/contact_modes/contact_mode_classifier.py), [`HybridContactStateModel`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/contact_modes/hybrid_contact_state_model.py). | P2.5 (`30 ep` ID test, 1-step): macro-F1 rose from `0.1216` (`M0`) to `0.3175` (`M4`) on `peg_in_hole`, and `0.0189` (`M0`) to `0.2429` (`M4`) on `multifinger_lift`; 1-step `state_rmse` fell `1.1554 -> 0.7759` (`multifinger_lift`). | **Partially supported in 1-step nominal ID.** Overall macro-F1 remains `<= 0.3547` (P2.4) / `<= 0.3175` (P2.5). **Code Defect G1:** [`HybridContactStateModel`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/contact_modes/hybrid_contact_state_model.py#L115-L120) slices `states[:, 9:15]` for forces even on 23-D Task 2 states (mixing `finger_pos` indices `9:12` with `fn[0:3]`), mismatched with [`extract_env_state_and_wrench`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/selection_aware/counterfactual_rollout.py#L28-L36) (`[fn0, fn1, fn2, 0, 0, 0]`). |
| **Multi-Horizon Prediction (`H={1,3,5,10,20}`)** | `predict_multistep` on all 4 models; [`MultiHorizonQuantileEngine`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/conformal/multihorizon_quantile_engine.py); [`compute_multihorizon_rmse`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/integrated/statistical_analysis.py#L57). | P2.2 logged open-loop `Q` growth (`H=1..20`: `2.4962 -> 59.2326` Task 1, `4.5199 -> 13.2868` Task 2; simultaneous cov `0.964`, `0.900`). P2.3 stopped at `H=10`; P2.5 `H=20` logged `0` decisions. | **Unproven:** [`compute_multihorizon_rmse`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/integrated/statistical_analysis.py#L57) is imported in [`experiment_orchestrator.py`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/integrated/experiment_orchestrator.py#L32) and **never invoked** (Defect G2); P2.4–P2.6 only logged 1-step offline RMSE. No closed-loop `H=1..20` error curves exist for `B1`–`B3`. |
| **Uncertainty & Conformal Engines** | [`EpisodeConformalEngine`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/selection_aware/episode_conformal_engine.py), [`CalibrationRunner`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/integrated/calibration_runner.py), [`MultiHorizonQuantileEngine`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/conformal/multihorizon_quantile_engine.py), [`CAPOnlineSelectivePredictor`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/selection_aware/cap_online_selective.py). | P2.3 (`N_calib=40` at `alpha=0.10`) yielded finite simultaneous Target A (`90.0%`–`93.33%`), Target B (`96.67%`–`100.0%`), and CAP FCR (`2.0%` `[3/150]`, `5.44%` `[8/147]`). Unstratified `Calib-B` failed badly (`0/30`–`4/30` joint in P2.5). | **Statistically Compromised Prior Runs:** (a) **P2.2 Defect G3:** all 7 mode rows in `calibration_report.json` are identical global fallbacks (`< 15` cell samples); (b) **P2.5 Defect G4:** `n_calib=25 < 29` forced `k_joint = 26 > 25` -> `q_*_joint = inf` (`100.0%` coverage / `delta_transfer=0.0` across all 10 conditions while [`calibration_runner.py`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/integrated/calibration_runner.py#L126-L130) serialized marginal quantiles). |
| **Environments, Planners & Control Baselines** | R002: [`PegInHoleEnv`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/environment/peg_in_hole_env.py), [`MultifingerLiftEnv`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/environment/multifinger_lift_env.py), test-only [`CompliantPreLiftContactEnv`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/tests/test_p27_plcea_controller_integration.py#L48-L242), [`CEMPlanner`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/planners/cem_planner.py), [`UncertaintyPenalizedCEM`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/planners/uncertainty_penalized_cem.py). R001: [`baselines.py`](file:///c:/projects/horos-probe-1/baselines/baselines.py), [`tacsl_harness.py`](file:///c:/projects/horos-probe-1/simulation/tacsl_harness.py) Regimes A–D. | On nominal `MultifingerLiftEnv` (`mu=0.50, m=0.35 kg, H=25`): unfiltered `C1_open` reached `16/30` (P2.4 `D2`), `13/30` / `9/30` (P2.5 `M2`/`M4`), `6/30` (P2.5 Rem `M4`), `8/30` (P2.6 Exp01 `M4`); `M0` scored `0/30`; legacy `p-CBF` scored `0/30`; P2.6 `50-ep` pilot (`ActionSubstitutor`) `14/50` (`M4+E02_A 5/5`) with `0/50` violations (`Fn <= 18.49 N`). `PegInHoleEnv` scored `0/30` across all P1–P2.5 Rem runs (`max depth 8.04 mm`). | **Code Defect G5:** [`PegInHoleEnv.step`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/environment/peg_in_hole_env.py#L158-L160) overwrites `self.peg_pos` before computing `peg_vel`, zeroing free-space velocity; `-50 mm` seating unreachable in `H <= 40`; [`PlannerEvaluator`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/integrated/planner_evaluator.py#L345) labels mm as `"meters_height"`. **Unproven:** Closed-loop `B1`/`B2`/`B3` + `PLCEA` under unseen `mu`, `m`, and nonstationary Regimes A/B (`0/450` episodes run). |
| **Datasets, Sensor Baselines & Simulators** | `ati_nano17_10k_baseline.npz` (`sigma_n=0.0479 N`, `sigma_t=0.0271 N`, `rho1=0.1355`, `sigma_delta=0.0150 N`, `adopted_threshold=0.085 N`), [`groot_teleop_g1.py`](file:///c:/projects/horos-probe-1/datasets/groot_teleop_g1.py), [`experiment_manifests.json`](file:///c:/projects/horos-probe-1/manifests/experiment_manifests.json). | Only `ati_nano17_10k_baseline.npz` verified present on disk across both repos. Research-002 simulation uses CPU NumPy environments (`dt=10 ms` / `20 ms`). | **Unavailable External Assets:** Zero `.h5` files (`GrootTeleopG1Dataset`), zero Isaac Sim 5.1 / Isaac Lab v2.3 / PhysX 5 / TacSL execution, zero physical robot hardware trials. |

### 2. External Data, Simulator Availability & Explicit Validation Gates

| Resource | Workspace Status | Phase 3 Permitted Claim / Gate |
|---|---|---|
| ATI Nano17 sensor noise baseline (`ati_nano17_10k_baseline.npz`) | **Available** | Calibrated AR(1) sensor noise injection (`1x` / `2x`) permitted in simulation |
| Pure-Python compliant & rigid-contact simulators | **Available** | Controlled prediction, uncertainty calibration, ID/OOD planner evaluation authorized |
| `GrootTeleopG1Dataset` HDF5 files (`*.h5`) | **Not Available** | **External Validation Gate E1:** Real-world multimodal tactile dataset ingestion |
| NVIDIA Isaac Sim 5.1 / Isaac Lab v2.3 / PhysX 5 | **Not Available** | **External Validation Gate E2:** High-fidelity GPU contact physics & TacSL validation |
| Physical Allegro/DexH10 hand + ATI Nano17 bench | **Not Available** | **External Validation Gate E3 & E4:** Physical manipulation & hardware safety certification |

> **Governance Covenant:** Simulation metrics produced under this protocol evaluate algorithmic efficacy within modeled Python contact mechanics and calibrated sensor noise; they must never be reported as demonstrated real-world robotic capability until External Gates `E1`–`E4` are independently passed.

---

## Part II — Statistical Calibration Sample-Size Derivation (Correction #1)

### 1. Exact Finite-Sample Order-Statistic Feasibility Thresholds

For split-conformal calibration on $n$ exchangeable calibration scores $S_1, \dots, S_n$ at nominal per-test miscoverage level $\beta$, the finite-sample quantile selects rank:
$$k = \left\lceil (n + 1)(1 - \beta) \right\rceil$$

A finite quantile ($k \le n$, avoiding $q = +\infty$) requires $(n+1)(1-\beta) \le n$, equivalently:
$$\beta \ge \frac{1}{n+1} \implies n \ge \left\lceil \frac{1}{\beta} \right\rceil - 1$$

When simultaneous coverage across **3 channels** (`state`, `wrench`, `mode`) uses Bonferroni allocation $\beta = \alpha / 3$ at family-wise miscoverage rate $\alpha$:
$$\frac{\alpha}{3} \ge \frac{1}{n + 1} \implies n_{\min,\text{joint}}(\alpha) = \left\lceil \frac{3}{\alpha} \right\rceil - 1$$

| Family-Wise Miscoverage $\alpha$ (Target Coverage $1-\alpha$) | Marginal Single-Channel $\beta = \alpha$ ($n_{\min,\text{marg}}$) | 3-Channel Bonferroni $\beta = \alpha/3$ ($n_{\min,\text{joint}}$) | Status of Order Statistic at $n = n_{\min}$ | Recommended Phase 3 Count for Interior Non-Max Rank |
|---|---|---|---|---|
| **10%** ($\alpha = 0.10$, **90%** target) | $9$ | **$29$** ($\alpha/3 = 0.03333$) | $k = 29/29$ (sample maximum only; high variance) | **$N_{\text{calib}} = 60$** ($k_{\text{joint}} = 59/60$, interior rank; $k_{\text{marg}} = 55/60$) |
| **5%** ($\alpha = 0.05$, **95%** target) | $19$ | **$59$** ($\alpha/3 = 0.01667$) | $k = 59/59$ (sample maximum only; even $n=60$ gives $k=60/60$) | **$N_{\text{calib}} = 120$** ($k_{\text{joint}} = 119/120$, interior rank; $k_{\text{marg}} = 115/120$) |
| **1%** ($\alpha = 0.01$, **99%** target) | $99$ | **$299$** ($\alpha/3 = 0.00333$) | $k = 299/299$ (sample maximum only) | **$N_{\text{calib}} \ge 600$** ($k_{\text{joint}} = 599/600$) |

> **Critical Epistemic Distinction:** $n_{\min,\text{joint}}$ (`29`, `59`, `299`) is strictly a **finite-quantile mathematical feasibility floor** where the threshold degenerates to the single largest residual $\max_{i \le n} S_i$. It **does not guarantee tight interval widths or low conditional coverage variance**.

### 2. Explicit Confidence Target & Calibration Budget Assignment Per Engine

To eliminate conflicting sample-size claims across modules, every calibration engine in Research-002 is locked to an explicit target $\alpha$, calibration unit, feasibility floor, and Phase 3 calibration allocation:

| Calibration Engine / Module | Target Coverage ($1-\alpha$) & $\alpha$ | Calibration Unit | Multiplicity Correction | Feasibility Floor ($n_{\min}$) | Adopted Phase 3 Calibration Pool & Stratification Rule |
|---|---|---|---|---|---|
| [`EpisodeConformalEngine`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/selection_aware/episode_conformal_engine.py) & [`CalibrationRunner`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/integrated/calibration_runner.py) (Primary) | **90%** ($\alpha = 0.10$) | Independent Episodes | 3-channel Bonferroni ($\alpha/3 = 0.03333$) for joint; $\alpha = 0.10$ for marginal | **$29$** ep (joint)<br>**$9$** ep (marginal) | **$N_{\text{calib}} = 60$ episodes** per `(Model × Planner)` pool (`k_joint = 59/60`, interior). **Stratification rule:** Per-mode `stratified_q_joint[m]` only permitted when mode count $m_n \ge 29$; otherwise **must fall back to finite global `q_*_joint` and explicitly log `fallback_to_global=True`** (fixing legacy `min_stratum_samples=5` producing `inf` for $5 \le m_n \le 28$). |
| `EpisodeConformalEngine` (Optional Secondary Sensitivity Check) | **95%** ($\alpha = 0.05$) | Independent Episodes | 3-channel Bonferroni ($\alpha/3 = 0.01667$) | **$59$** ep (joint)<br>**$19$** ep (marginal) | If executed as a secondary check, requires dedicated **$N_{\text{calib}} = 120$ episodes** (`k_joint = 119/120`). **Never evaluated on $n=60$**, where $k=60/60$ collapses to sample max. |
| [`MultiHorizonQuantileEngine`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/conformal/multihorizon_quantile_engine.py) (`Q in R^{7 x 5}` + `lambda_sim`) | **90%** ($\alpha = 0.10$) | Fold 1: Transitions per `(mode k, horizon h)`<br>Fold 2: Trajectory max over `HORIZONS` | Per-cell $\alpha = 0.10$; Fold 2 global simultaneous $\lambda_{\text{sim}}$ at $\alpha = 0.10$ across $5$ horizons | Fold 1: **$9$** trans/cell (code quality floor `min_cell_samples=15`)<br>Fold 2: **$9$** trajectories | Uses the **`60`-episode ID calibration pool** split **30 ep Fold 1** (`~1,500` transitions at `H=50`) + **30 ep Fold 2** (`k_traj = 28/30`, interior). Logs exact Fold-1 sample count $n_{k,h}$ and fallback source (`empirical_cell`, `mode_fallback`, `global_fallback`) for every cell in $Q$. |
| [`ContactStratifiedConformalWM`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/models/stratified_conformal_wm.py) (`B4` 1-step) | **90%** ($\alpha = 0.10$) | Transitions per contact stratum `k` | Single-channel per-stratum $\alpha = 0.10$ | **$9$** trans/stratum (`> 10` quality guard in code) | Transitions from the `60`-episode calibration pool (`~3,000` transitions); explicitly logs empirical quantile vs `2.0` fallback triggers per stratum. |
| [`ContactModeClassifier`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/contact_modes/contact_mode_classifier.py) APS (`calibrate_aps`) | **90%** ($\alpha_{\text{mode}} = 0.10$) standalone; **96.67%** ($\alpha/3$) inside joint | Transitions (standalone) / Episodes (joint) | Single-channel or Bonferroni $\alpha/3$ | **$9$** trans (standalone)<br>**$29$** ep (joint) | Calibrated alongside `MultiHorizon` / `EpisodeConformal` on `60` episodes (`alpha = 0.10`). |
| [`CAPOnlineSelectivePredictor`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/selection_aware/cap_online_selective.py) | **90%** (Target FCR $\le 0.10$) | Selected decisions in sliding buffer (`window_size=100`) | Single-channel $\alpha = 0.10$ | **$9$** selected steps in buffer | Online sliding window up to `100` selected steps (`m < 9` explicitly flagged uncalibrated). |
| Research-001 `AdaptiveConformalInference` ([`experiment_manifests.json`](file:///c:/projects/horos-probe-1/manifests/experiment_manifests.json)) | **95%** ($\delta = 0.05$, $\gamma = 0.02$) | Sequential online timesteps | Adaptive threshold update $\alpha_{t+1}$ | N/A (online ACI recursion) | Tracked cleanly as Research-001 online baseline comparator; never mixed with Research-002 static split-conformal tables. |

---

## Part III — Corrected 450-Episode Closed-Loop Matrix & Separate 120-Episode Offline Accounting (Corrections #2 & #3)

### 1. Reconciled Factorial Design (`2 × 3 × 3 × 25 = 450` Closed-Loop Episodes)

Following technical co-founder review, the closed-loop evaluation is organized as a **completely balanced 3-factor factorial experiment (`18 cells × 25 episodes/cell = 450 closed-loop episodes`)**:

- **Factor 1 — World Model Training Regime (`2`):**
  - **`M0` (Passive Baseline World Model):** Trained on baseline/behavioral exploration trajectories collected under nominal ID parameters (`seeds 1000–1059`).
  - **`M4` (Action-Conditioned Contact World Model via ACMM):** Trained on an identically sized `60`-episode budget actively curated via Active Contact-Mode Mining (`ACMM`, `seeds 1000–1059`) under nominal ID parameters.
- **Factor 2 — Model Architecture & Planner Stack (`3`):**
  - **`B1` (Deterministic Planner):** [`DeterministicWorldModel`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/models/deterministic_wm.py) + [`CEMPlanner`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/planners/cem_planner.py) (+ frozen [`PLCEAActionSubstitutor`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/coordination/plcea_substitutor.py) on CompliantPreLift; `p-CBF` on PegInHole).
  - **`B2` (Probabilistic Planner):** [`ProbabilisticWorldModel`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/models/probabilistic_wm.py) + uncertainty-aware CEM (heteroscedastic predicted `std` penalty / `logvar` bounds + `PLCEA` / `p-CBF`).
  - **`B3` (Ensemble Planner):** [`EnsembleWorldModel`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/models/ensemble_wm.py) (`E=5` bootstrapped probabilistic heads) + [`UncertaintyPenalizedCEM`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/planners/uncertainty_penalized_cem.py) (`epistemic + aleatoric` disagreement penalty + `PLCEA` / `p-CBF`).
- **Factor 3 — Evaluation Regime (`3`, `150 episodes` per regime):**
  - **`ID` (`CompliantPreLiftContactEnv` Nominal In-Distribution, `H=50`, `dt=0.01 s`, ATI `1x` noise):** `mu_true = 0.50`, `object_mass = 0.350 kg`. Identical to training distribution physics, evaluated on strictly held-out test seeds.
  - **`OOD` (`CompliantPreLiftContactEnv` Unseen Physics & Nonstationarity, `H=50`, `dt=0.01 s`):** Zero-shot evaluation across three reproducible strata per `25`-episode cell (always reported both disaggregated per sub-regime and aggregated for the cell):
    - *OOD-LowMu (`9 ep`: seeds `6100–6108`):* `mu_true ∈ {0.12, 0.18, 0.22}` (`3` each) at `m = 0.350 kg` (adversarial slip & unachievable feasibility boundaries testing safe `S5` aborts vs. drops).
    - *OOD-HighMass (`8 ep`: seeds `6109–6116`):* `object_mass ∈ {0.55, 0.70} kg` (`4` each) at `mu_true = 0.40`.
    - *OOD-Nonstationary (`8 ep`: seeds `6117–6124`):* `4` × **Regime A** friction step (`0.60 -> 0.24` at step 15) + `4` × **Regime B** mass influx (`0.35 -> 0.60 kg` at `+0.25 kg/s`).
  - **`PegInHole` (`PegInHoleEnv` Post-Fix Insertion Benchmark, `H=50`, `dt=0.02 s`, `peg_vel` fixed):** Cross-task contact geometry regime stratified per `25`-episode cell:
    - *Peg-ID (`10 ep`: seeds `6200–6209`):* `mu = 0.50`, `clearance = 0.50 mm`.
    - *Peg-OOD (`15 ep`: seeds `6210–6224`):* `mu ∈ {0.75, 0.85}`, `clearance ∈ {0.18, 0.25} mm` (jamming/wedging boundary stress).

### 2. Full 18-Cell Matrix (`18 × 25 = 450` Closed-Loop Episodes)

| Cell ID | Model (Data) | Planner | Regime | Paired Seed Block | `N` | Pre-Registered Primary Contrast |
|---|---|---|---|---|---|---|
| `C01` | `M0` (Passive) | `B1` (Det) | `ID` | `6000–6024` | 25 | Baseline passive deterministic reference |
| `C02` | `M0` (Passive) | `B2` (Prob) | `ID` | `6000–6024` | 25 | `M0` heteroscedastic noise awareness on ID |
| `C03` | `M0` (Passive) | `B3` (Ens) | `ID` | `6000–6024` | 25 | `M0` ensemble caution without ACMM coverage |
| `C04` | `M4` (ACMM) | `B1` (Det) | `ID` | `6000–6024` | 25 | `M4 vs M0` data-mining gain under `B1` (`C04 vs C01`) |
| `C05` | `M4` (ACMM) | `B2` (Prob) | `ID` | `6000–6024` | 25 | `M4 vs M0` under `B2` (`C05 vs C02`) & `B2 vs B1` |
| `C06` | `M4` (ACMM) | `B3` (Ens) | `ID` | `6000–6024` | 25 | Full proposed stack on ID (`C06 vs C03, C04, C05`) |
| `C07` | `M0` (Passive) | `B1` (Det) | `OOD` | `6100–6124` | 25 | Passive deterministic failure/PEG under unseen physics |
| `C08` | `M0` (Passive) | `B2` (Prob) | `OOD` | `6100–6124` | 25 | Passive probabilistic OOD behavior |
| `C09` | `M0` (Passive) | `B3` (Ens) | `OOD` | `6100–6124` | 25 | Passive ensemble OOD behavior |
| `C10` | `M4` (ACMM) | `B1` (Det) | `OOD` | `6100–6124` | 25 | `M4` OOD accuracy without epistemic caution (`C10 vs C07`) |
| `C11` | `M4` (ACMM) | `B2` (Prob) | `OOD` | `6100–6124` | 25 | Aleatoric-only vs epistemic OOD generalization |
| `C12` | `M4` (ACMM) | `B3` (Ens) | `OOD` | `6100–6124` | 25 | Core PROBE-1 OOD test: ACMM + Ensemble caution (`C12 vs C09, C10, C11`) |
| `C13` | `M0` (Passive) | `B1` (Det) | `PegInHole` | `6200–6224` | 25 | Cross-task passive deterministic baseline |
| `C14` | `M0` (Passive) | `B2` (Prob) | `PegInHole` | `6200–6224` | 25 | Cross-task passive probabilistic |
| `C15` | `M0` (Passive) | `B3` (Ens) | `PegInHole` | `6200–6224` | 25 | Cross-task passive ensemble |
| `C16` | `M4` (ACMM) | `B1` (Det) | `PegInHole` | `6200–6224` | 25 | Cross-task ACMM deterministic (`C16 vs C13`) |
| `C17` | `M4` (ACMM) | `B2` (Prob) | `PegInHole` | `6200–6224` | 25 | Cross-task ACMM probabilistic |
| `C18` | `M4` (ACMM) | `B3` (Ens) | `PegInHole` | `6200–6224` | 25 | Cross-task ACMM ensemble (`C18 vs C15, C16, C17`) |
| **Total** | **2 (`M0, M4`)** | **3 (`B1, B2, B3`)** | **3 (`ID, OOD, Peg`)** | **Paired per Regime** | **450** | **18 × 25 = 450 Closed-Loop Evaluation Episodes** |

### 3. Complete Episode Accounting & Seed Isolation (`570` Total Evaluation Episodes)

Every episode across training, conformal calibration, offline testing, and closed-loop testing is tracked separately to guarantee **zero data leakage** and **zero episode double-counting**:

| Episode Pool | Purpose & Target Engines | Episode Count | Seed Range | Excluded / Pooled Status |
|---|---|---|---|---|
| **Closed-Loop Benchmark Matrix** (`18 × 25`) | `C01`–`C18` (Dimensions D5, D6) | **450** (`150` per regime) | `ID`: `6000–6024`<br>`OOD`: `6100–6124`<br>`PegInHole`: `6200–6224` | **Core 450-ep Matrix.** Paired seeds across `M0` vs `M4` and `B1`/`B2`/`B3` (`75` unique scenarios × `6` policies). |
| **Additional Offline OOD & Conformal Test Pool** | Multi-horizon `H∈{1,3,5,10,20}`, 7-mode F1, ATI `1x/2x` noise, `NLL`/`ECE`, Target A/B finite coverage, `B4` / CAP verification (Dimensions D1–D4) | **120** (`40` ID + `40` OOD + `40` Peg) | `3000–3119` (`40` ID `3000–3039`, `40` OOD `3040–3079`, `40` Peg `3080–3119`) | **Tracked separately from 450** (`450 + 120 = 570` **total evaluation episodes**). Same 120 trajectories reused consistently across `{M0, M4} × {B1, B2, B3, B4}` for paired comparison. |
| **Total Phase 3 Evaluation Budget** | **Combined Closed-Loop + Offline Evaluation** | **570** (`450 + 120`) | `3000–3119`, `6000–6224` | Reported cleanly as **450 Closed-Loop + 120 Offline = 570 Total Evaluation Episodes**. |
| **Pre-Eval Conformal Calibration Pool** | Calibrates `alpha = 0.10` engines (`EpisodeConformalEngine`, `MultiHorizonQuantileEngine` Fold 1+2, `B4`, APS) | `60` ep per ID calibration pool (`2000–2059` Lift, `2100–2159` Peg) | `2000–2059` (CompliantLift ID)<br>`2100–2159` (PegInHole ID) | Separate calibration set; excluded from the `570` evaluation episodes. *(Optional $\alpha=0.05$ check adds `2000–2119` if run.)* |
| **Pre-Eval Training & ACMM Mining Pool** | Generates passive (`M0`) vs ACMM (`M4`) datasets under nominal ID only | `60` ep per `(Dataset × Env)` | `1000–1059` (CompliantLift ID)<br>`1100–1159` (PegInHole ID) | Separate training pool; identical data per regime shared across `B1`, `B2`, `B3`. |
| **P2.6 Historical Pilot Pool** | Previous P2.6 `ActionSubstitutor` pilot (`14/50` success) | `50` historical episodes | `{42, 142, 242, 342, 442}` (`ep 0..4`) | **Permanently Excluded (0/50 pooled).** |

---

## Part IV — Evaluation Metrics, Effect Sizes & Statistical Rigor

For every cell (`N = 25`), every `(Model × Regime)` margin (`N = 75`), every `(Planner × Regime)` margin (`N = 50`), every Regime (`N = 150`), and the grand `M0 vs M4` contrast (`N = 225`):

1. **Uncertainty Bounds on All Proportions (Success Rate, Safe Abort Rate, Hard Violation Rate, Coverage):** Exact **Wilson 95% score confidence intervals** (`0/25 -> [0.00%, 13.32%]`, `0/75 -> [0.00%, 4.87%]`, `0/150 -> [0.00%, 2.50%]`, `0/225 -> [0.00%, 1.68%]`), avoiding Wald normal approximations.
2. **Paired Hypothesis Tests (`M0 vs M4` and `B1 vs B2 vs B3` on Identical Seeds):**
   - Binary manipulation outcomes (`task_success`, `safe_outcome = authorized_lift OR justified_S5_abort_on_unachievable_mu`, `hard_violation`): **McNemar exact / Edwards-corrected test** (`b vs c` discordant pairs) + **Odds Ratio & Risk Difference with 95% Newcombe-Wilson CI**.
   - Continuous outcomes (`RMSE_s(H)`, `PEG`, `goal_progress_mm`, `force_rmse`, `step_latency_ms`): **Mean ± SD, Median [IQR]**, **Paired Wilcoxon signed-rank test** (`p`-value with Holm-Bonferroni multiplicity correction across primary comparisons), and **matched-pairs rank-biserial correlation $r$ + paired Cohen's $d_z$ effect sizes**.
3. **Six-Dimension Evaluation Checklist:**
   - **D1 State Prediction:** Multi-horizon `RMSE_s(H)` (`H ∈ {1, 3, 5, 10, 20}`) disaggregated into kinematics, `obj_pos`, normal/tangential forces, and slip velocity.
   - **D2 Contact Dynamics:** Class-balanced 7-mode Macro-F1 (reporting per-mode F1 on `1: INCIPIENT_TOUCH`, `4: SLIP_TRANSITION`, `5: JAM_OR_WEDGE`), transition timing error (`steps`), APS set size vs. coverage.
   - **D3 Tactile Perception:** Force/shear RMSE under `1x` vs `2x` calibrated ATI Nano17 AR(1) noise (`rho1 = 0.1355`) and TacSL linear gain/offset drift; pre-lift vs post-probe `mu_hat` error vs hidden `mu_true`.
   - **D4 Uncertainty Calibration:** Marginal & finite simultaneous `q_*_joint` coverage (Target A & Target B, asserting `q_*_joint < inf`), per-mode coverage gap & Fold-1 `n_{k,h}` fallback report, NLL, ECE, OOD epistemic std AUROC vs prediction error, CAP FCR.
   - **D5 OOD Generalization:** `RMSE_OOD / RMSE_ID` ratio, coverage retention `Cov_OOD` vs `90%`, epistemic disagreement lead-time (`steps`) prior to slip/drop/jam onset, disaggregated across *OOD-LowMu*, *OOD-HighMass*, *OOD-Nonstationary (Regimes A/B)*, and *Peg-OOD*.
   - **D6 Closed-Loop Manipulation:** Task success, hard safety violations (`Fn >= 18 N / 25 N`, drop while lifted), PLCEA authorization sensitivity/specificity against analytical grasp feasibility ($4\mu_{\text{true}} F_{n,\max} \ge W$), Planner Exploitation Gap (`PEG`), and CPU step latency (`p50`/`p95 ms`).

---

## Part V — Phase 3 Roadmap & Authorizations

Following technical co-founder alignment:

| Stage | Scope | Execution Status & Authorization Gate |
|---|---|---|
| **Phase 1** | 15 PLCEA evidence-acquisition & invariant tests | **Complete** (`a7f0cb59` / `3d35ab4`) |
| **Phase 2** | `PLCEAActionSubstitutor` controller & 12 integration tests (`84/84 PASS`) | **Complete** (`0442d0f2` / `09d6311`) |
| **Phase 3.1–3.2** | Cross-repository infrastructure audit & **Document 53 Revision 1.1** (`18×25=450` + `120` offline, $\alpha$-explicit conformal derivation, Implemented/Validated/Unproven breakdown) | **Completed & Dedicated Commit Synchronized — Pending Protocol Freeze Sign-Off** |
| **Phase 3.3** | Harness remediation in separate commit(s): fix `HybridContactStateModel` 23-D wrench slice (`12:16`), enforce finite `N_calib=60` / stratified floor $m_n \ge 29$ fallback logging, wire [`compute_multihorizon_rmse`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/integrated/statistical_analysis.py#L57) & `B1`/`B2`/`B3` (`B4`), fix `PegInHoleEnv` `peg_vel` & unit labels, promote `CompliantPreLiftContactEnv` + Regimes A/B; add **separate** remediation test file while keeping `plcea_substitutor.py`, historical tests (`84/84`), and Docs `00`–`52` intact | **Authorized Immediately Following Protocol Freeze Approval** |
| **Phase 3.4** | Train & archive checkpoints (`M0`, `M4` × `B1`, `B2`, `B3`) on `1000–1059` / `1100–1159`; establish comparable baseline metrics | Pending Phase 3.3 |
| **Phase 3.5** | Run the **450-episode (`18 × 25`) closed-loop matrix** (`C01`–`C18`) | Pending Phase 3.4 |
| **Phase 3.6** | Evaluate OOD generalization across unseen friction, payload, nonstationary Regimes A/B, and the **120-episode offline pool** (`3000–3119`) | Pending Phase 3.5 |
| **Phase 3.7** | Statistical analysis: Wilson 95% CIs, paired McNemar/Wilcoxon, effect sizes, Holm-Bonferroni correction, strict RFC 8259 JSON verification | Pending Phase 3.6 |
| **Phase 3.8** | **Document 54: World Model Evaluation Results** & empirical Go/No-Go assessment ahead of external simulation/hardware gates | Pending Phase 3.7 |

---

*HOROS PROBE-1 Research-002 — Document 53 Revision 1.1 prepared for protocol freeze before Phase 3.3 harness remediation.*
