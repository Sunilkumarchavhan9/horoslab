# HOROS PROBE-1 — Research-002
## Phase 3.7.3 Exploratory Pilot Audit & Protocol Revision Receipt

**Document Reference:** `HOROS-P1-R002-P373-EXP-RECEIPT`  
**Date:** November 16, 2026  
**Status:** INITIAL PHASE 3.7.3 RESULTS FORMALLY CLASSIFIED AS EXPLORATORY PILOT  
**Governing Mandate:** Pre-Registration Scientific Hygiene & Research Validity Audit  

---

### 1. Rationale for Exploratory Classification

An independent research-validity review of the initial Phase 3.7.3 execution identified four critical methodological divergences from the pre-registered protocol that require formal reclassification:

1. **Parameter Protocol Divergence:**  
   The initial frozen manifest (`phase37_3_trust_manifest.json` v1.1) specified a 20-step probe, 1.0 mm nominal displacement, 8.0 N force cap, and 1.0 N/s plateau threshold, with `execution_authorized: 0`. The implementation used 35 steps, 2.0 mm nominal displacement, 2.5 mm hard clamp, 10.0 N force cap, and 2.5 N/s plateau threshold. While mathematically necessitated by fingertip pad compliance ($k_{\text{pad}} = 6.0\text{ N/mm}$) to identify objects up to $0.85\text{ kg}$, this constituted a material change to the pre-registered protocol that must be formally revision-locked in the manifest prior to authorized evaluation.

2. **Heuristic Latency Fallback in T4:**  
   The initial evaluation code contained an artificial fallback trigger (`if is_cusum or fz_drop or step_k >= 17`) and capped measured latency via `min(lat, 3)`. This introduced an artificial ceiling that did not measure the true unassisted response of the decision layer.

3. **Incomplete CBF v1.0 Demonstration in T1:**  
   `GeometryAwareCBFSafetyFilter` was imported but not actively stepped on state observations during the evaluation, relying instead on static trigger wrench checks in offline traces.

4. **Standalone Estimator Proxy in T2 & T3:**  
   T2 evaluated synthetic masses rather than executing across the pre-registered validation split episodes (`p37_2_val_task2_ood`, HighMass & Regime B), and T3 evaluated a univariate CUSUM mask rather than the joint three-condition TRUST policy.

### 2. Formal Action & Reclassification

* **Reclassification:** All results generated prior to Manifest v2.0 are formally cataloged as **Exploratory Pilot Evidence (Non-Authoritative)**.
* **Protocol Revision:** Manifest v2.0 formally registers the physical parameters (35 steps, 2.0 mm, 10.0 N cap, 2.5 N/s) with full physical derivations, sets `execution_authorized: 1`, and defines strict unassisted evaluation contracts for T1–T5.
* **Strict Training Prohibition:** In compliance with program governance, exactly **zero world model parameters were trained** (0 weight updates, 0 gradient steps). Baselines $B1$–$B4$ and `GeometryAwareCBFSafetyFilter v1.0` remain 100% frozen.
