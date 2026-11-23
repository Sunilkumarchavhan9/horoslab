# HOROS PROBE-1 — Research-002
## Stage 3.3A.5 Report 4: Production Seed Reconciliation & Reserve Integrity

**Program:** HOROS PROBE-1 — Autonomous Robotic Manipulation World Model  
**Phase:** Stage 3.3A.5 — Final Production Readiness Sign-Off  
**Document Identifier:** `HOROS-P1-R002-STAGE3.3A5-REPORT4-SEED-RECONCILIATION`  
**Date:** 2026-11-19  
**Registry File:** `experiments/stage3_production_readiness/stage3_3_seed_registry.json`  
**Status:** **AUDITED, RECONCILED & 100% VERIFIED**  

---

### 1. Executive Summary

This report establishes the complete mathematical verification of the 1,000 production episode seeds and the 300 reserve seeds defined in `stage3_3_seed_registry.json` (Registry Version 1.0.0).

All 1,000 production seeds are verified unique, correctly allocated across approved strata, disjoint from pilot seeds, and all 300 reserve seeds are confirmed in `UNALLOCATED_LOCKED` status.

---

### 2. Production Dataset Stratification & Seed Ranges (1,000 Episodes)

The 1,000 production episodes are partitioned equally between Compliant Prelift (500) and Peg-in-Hole (500) across six strata:

| Task | Stratum | Target Count | Seed Allocation Range | Seed Count | Verification Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Compliant Prelift** | `nominal` | 250 | `[3311000, 3311249]` | 250 | **VERIFIED UNIQUE** |
| **Compliant Prelift** | `probe` | 150 | `[3312000, 3312149]` | 150 | **VERIFIED UNIQUE** |
| **Compliant Prelift** | `nonstationary` | 100 | `[3313000, 3313099]` | 100 | **VERIFIED UNIQUE** |
| **Peg-in-Hole** | `nominal` | 250 | `[3321000, 3321249]` | 250 | **VERIFIED UNIQUE** |
| **Peg-in-Hole** | `impact` | 150 | `[3324000, 3324149]` | 150 | **VERIFIED UNIQUE** |
| **Peg-in-Hole** | `wedging` | 100 | `[3325000, 3325099]` | 100 | **VERIFIED UNIQUE** |
| **Total Production** | — | **1,000** | — | **1,000** | **0 DUPLICATES** |

---

### 3. Pilot Collision Verification (40 Pilot Seeds)

- Pilot seeds are drawn from the legacy `3,100,000` preflight series (e.g., `3111000..3111009`, `3121000..3121009`, etc.).
- Cross-comparison of `accepted_manifest.json` (40 certified pilot seeds) against the 1,000 production seeds confirms:
  - **Collision Count:** **0** (Empty intersection: $\mathcal{S}_{\text{pilot}} \cap \mathcal{S}_{\text{prod}} = \emptyset$).
  - Full pilot isolation is guaranteed.

---

### 4. Reserve Seed Pool Verification (300 Reserve Seeds)

To guarantee reproducible, non-silent failure handling without silent retries or on-the-fly random seeds, a reserve seed pool is registered:

| Task | Stratum | Reserve Count | Reserve Seed Range | Status |
| :--- | :--- | :---: | :---: | :---: |
| **Compliant Prelift** | `nominal` | 50 | `[3401000, 3401049]` | `UNALLOCATED_LOCKED` |
| **Compliant Prelift** | `probe` | 50 | `[3402000, 3402049]` | `UNALLOCATED_LOCKED` |
| **Compliant Prelift** | `nonstationary` | 50 | `[3403000, 3403049]` | `UNALLOCATED_LOCKED` |
| **Peg-in-Hole** | `nominal` | 50 | `[3411000, 3411049]` | `UNALLOCATED_LOCKED` |
| **Peg-in-Hole** | `impact` | 50 | `[3414000, 3414049]` | `UNALLOCATED_LOCKED` |
| **Peg-in-Hole** | `wedging` | 50 | `[3415000, 3415049]` | `UNALLOCATED_LOCKED` |
| **Total Reserve Pool** | — | **300** | — | **100% LOCKED** |

#### Strict Reserve Invariants:
1. **Zero Seed Collision:**
   - Reserve seeds $\cap$ Production seeds = $\emptyset$ (0 collisions).
   - Reserve seeds $\cap$ Pilot seeds = $\emptyset$ (0 collisions).
2. **Lock Status:** Every single reserve seed entry in `stage3_3_seed_registry.json` has `status: "UNALLOCATED_LOCKED"`.
3. **No Dynamic Substitution:** The production adapter does not automatically draw from the reserve pool. Rejections are permanently committed to `rejected_manifest.json`. Any reserve seed allocation requires an explicit, audited allocation manifest in Stage 3.4.
