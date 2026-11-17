# HOROS PROBE-1 — Research-002
## Comprehensive Dataset Inventory, Integrity Audit & Stage 3 Generation Plan

**Document Reference:** `HOROS-P1-R002-DATA-AUDIT-001`  
**Date:** November 16, 2026  
**Status:** 12-DATASET AUDIT COMPLETE & VERIFIED — STAGE 3 DATA COLLECTION PLAN LOCKED  
**Program:** HOROS PROBE-1 — Research-002  

---

### 1. 12-Dataset Inventory & Bitwise Integrity Audit

All 12 historical dataset archives across Phase 3.4 and Phase 3.7.2 have been fully audited on disk. Episode counts, transition step counts, file sizes, and raw SHA-256 checksums have been independently verified against frozen manifests (`manifests/phase34_dataset_manifest.json` and `datasets/phase3_7_2/phase37_2_dataset_manifest.json`).

| # | Task / Modality | Dataset Identifier | Relative File Path | Episodes | Steps | Size (Bytes) | SHA-256 Hash | Manifest Match |
| :-: | :--- | :--- | :--- | :-: | :-: | :-: | :--- | :-: |
| 1 | Compliant Prelift | `compliant_prelift__calibration` | `datasets/phase3_4/compliant_prelift_calibration.npz` | 60 | 1,874 | 189,839 | `8cdd6a5cabf4e847d78f49d4aa7daec3a70a1e1f729ff18414896194fd2df214` | **100% MATCH** |
| 2 | Compliant Prelift | `compliant_prelift__M0_passive` | `datasets/phase3_4/compliant_prelift_M0_passive.npz` | 60 | 3,000 | 303,695 | `46e916a551a00ed4f7ad655ff80ef3bc268381c770b03b8462bcfd7add1c11e8` | **100% MATCH** |
| 3 | Compliant Prelift | `compliant_prelift__M4_acmm` | `datasets/phase3_4/compliant_prelift_M4_acmm.npz` | 60 | 1,190 | 122,692 | `e86e54cd5b841b24d48e7ef08e9364ddcb528b6993c0ae02588191334fa2486d` | **100% MATCH** |
| 4 | Peg-in-Hole | `peg_in_hole__calibration` | `datasets/phase3_4/peg_in_hole_calibration.npz` | 60 | 1,630 | 178,349 | `b8692278b581e3cbbe87ac0b47d4d0f72b25cfeadf44298e78e00ee0dd822bfa` | **100% MATCH** |
| 5 | Peg-in-Hole | `peg_in_hole__M0_passive` | `datasets/phase3_4/peg_in_hole_M0_passive.npz` | 60 | 2,311 | 232,169 | `f22e2a497918317047a105b7447f365b94b346050523ba3392b24df91977f431` | **100% MATCH** |
| 6 | Peg-in-Hole | `peg_in_hole__M4_acmm` | `datasets/phase3_4/peg_in_hole_M4_acmm.npz` | 60 | 1,532 | 183,847 | `4176dde2b86a1d623192b8740eb35069d6f75ce8d903a1006a8b30d0c461a12d` | **100% MATCH** |
| 7 | Peg-in-Hole | `p37_2_calib_pih` | `datasets/phase3_7_2/p37_2_calib_pih.npz` | 60 | 1,802 | 209,983 | `ebd00c347fea1231f284f18bb8ff3ffb86baef2aa3f4eb60dfb6c6ba68ce02f4` | **100% MATCH** |
| 8 | Compliant Prelift | `p37_2_calib_task2_id` | `datasets/phase3_7_2/p37_2_calib_task2_id.npz` | 60 | 1,887 | 196,733 | `ebbbf97c9276e87d0c3eb1a4737d6eec43eb2594a974ea0a1c6a2185db2d3229` | **100% MATCH** |
| 9 | Compliant Prelift | `p37_2_calib_task2_ood` | `datasets/phase3_7_2/p37_2_calib_task2_ood.npz` | 60 | 2,369 | 245,692 | `14ac53c05d614f7a28e35cf8dae33ee3c9f592233da354728d3e9154f24c30c3` | **100% MATCH** |
| 10 | Peg-in-Hole | `p37_2_val_pih` | `datasets/phase3_7_2/p37_2_val_pih.npz` | 40 | 1,133 | 133,633 | `ba3781798376f0da99b9cf9cb33b664d6db87cc40ef0ce05f77174db4ae78631` | **100% MATCH** |
| 11 | Compliant Prelift | `p37_2_val_task2_id` | `datasets/phase3_7_2/p37_2_val_task2_id.npz` | 60 | 1,846 | 184,332 | `eb3b7c6ab0fb902d130c25a07530669fcf78c35bb5db93406a4a15998a18357a` | **100% MATCH** |
| 12 | Compliant Prelift | `p37_2_val_task2_ood` | `datasets/phase3_7_2/p37_2_val_task2_ood.npz` | 60 | 2,219 | 219,931 | `ef1ec9bd73e59d99723ecdbf7ff2783bf2f06873ea808bfd6fca554c2eaec8d2` | **100% MATCH** |

**Summary Totals:**
- Total Audited Episodes: **700 episodes**
- Total Audited Transition Steps: **22,993 steps**
- Bitwise Immutability: **100.0% (0 mismatches across all 12 archives)**

---

### 2. Missing Physical Data & Coverage Gaps

While the 12 existing datasets provide comprehensive coverage for evaluating single-step baseline world models ($B1$–$B4$) and diagnostic OOD shifts, they exhibit three critical coverage gaps for training **HOROS World Model vNext**:

1. **Active Probing Interaction Data:**
   - Existing datasets consist primarily of passive grasp-dwell or fixed trajectory sweeps.
   - *Gap:* World Model vNext requires training on dynamic transitions where the agent commands exploratory micro-lifts to identify mass and friction. Without active probing examples in the training distribution, the model cannot learn to correlate force rate-of-change ($dF_z/dt$) with object weight.
2. **Boundary-Impact & Jamming Dynamics (Peg-in-Hole):**
   - Phase 3.4 datasets focus primarily on smooth insertion trajectories.
   - *Gap:* Chamfer edge impacts, two-point wedging, and peg jamming produce sharp wrench discontinuities. The model requires dedicated interaction episodes at boundary contact angles.
3. **Continuous Friction & Mass Coverage:**
   - Phase 3.7.2 tested discrete OOD strata (e.g. fixed $\mu = 0.24$ or mass influx $+0.25\text{ kg/s}$).
   - *Gap:* Foundation model training requires dense continuous sweeps across friction $\mu \in [0.15, 0.90]$ and mass $m \in [0.25, 0.95]\text{ kg}$.

---

### 3. Stage 3 Synthetic Data Generation Plan

Upon formal user authorization of Stage 3, the Model Teaching Infrastructure (`ExperienceFactory` + `PhysicsValidationEngine`) will generate $N \ge 1,000$ physics-validated interaction scenarios:

#### A. Task 2 — Compliant Prelift Scenarios ($N = 500$ episodes)
- **Nominal Interaction ($N = 250$):** Gripper squeeze, normal force regulation ($12$–$20\text{ N}$), compliant lifting trajectories.
- **Active Force-Gated Probing ($N = 150$):** Closed-loop micro-lift profiles ($v_z = 5\text{ mm/s}$, $\Delta z \le 2.0\text{ mm}$) across varying mass ($0.30$ to $0.90\text{ kg}$) and friction ($\mu \in [0.15, 0.85]$).
- **Abrupt Non-Stationary Shifts ($N = 100$):** Mid-trajectory friction collapse (emulating contact with lubricant) and mass shifts.

#### B. Task 1 — Peg-in-Hole Scenarios ($N = 500$ episodes)
- **Nominal Alignment & Insertion ($N = 250$):** Spiral search, chamfer acquisition, and cylindrical engagement.
- **Boundary-Impact Scenarios ($N = 150$):** Off-axis impacts at chamfer perimeter ($r_{\text{offset}} \in [0.5, 2.0]\text{ mm}$), measuring peak normal reactions ($15$–$30\text{ N}$).
- **Wedging & Jamming Dynamics ($N = 100$):** Two-point wedging transitions at clearance bounds ($c \in [0.10, 0.40]\text{ mm}$) and tilt angles exceeding critical wedging limit ($\theta > \theta_{\text{crit}}$).

#### C. Validation & Anti-Leakage Quality Firewall
Every generated episode must satisfy:
1. **Kinematic & Force Feasibility:** Max force $< 35\text{ N}$ (PiH) and $< 20\text{ N}$ (Prelift). Zero NaN/Inf state values.
2. **Unified 6-Axis Cartesian Contract:** All wrench observations computed via `compute_prelift_resultant_wrench` or ATI Nano17 transducer.
3. **Strict Non-Privileged Firewall:** Observation history files contain zero privileged ground-truth fields (`mu_true`, `object_mass`, `clearance_mm`, `ContactMode`).
