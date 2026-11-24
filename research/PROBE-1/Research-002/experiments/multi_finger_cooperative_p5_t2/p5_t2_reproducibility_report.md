# HOROS PROBE-1 — Phase 5 Task 2 (P5-T2)
# Reproducibility Protocol & Git Manifest Verification

**Project:** HOROS Physical Interaction Data Engine (PIDE)  
**Research Program:** PROBE-1  
**Milestone:** Phase 5 Task 2 (P5-T2)  
**Target:** Multi-Finger Cooperative Preload Distribution & Tactile Balancing Suite  
**Date:** 2026-11-23  
**Status:** **100% REPRODUCIBLE & VERIFIED**  

---

## 1. System Environment & Execution Context

| Component | Specification |
|---|---|
| **Operating System** | Windows 11 Enterprise (x86_64) |
| **Python Runtime** | Python 3.12.10 |
| **Deep Learning Framework** | PyTorch 2.5.1+cpu |
| **Scientific Computing** | NumPy 2.2.3, SciPy 1.15.2 |
| **Testing Harness** | PyTest 9.0.2 |
| **Canonical Workspace** | `c:\projects\MemoryOS` |
| **Mirror Workspace** | `C:\projects\horos-probe-1` |
| **Target Git Branch** | `feat/probe1-stage33-production-readiness` |

---

## 2. Seed Allocation & Governance Invariants

- **Reserved Research Seed Range:** Strictly `4600001` through `4600300` (strictly non-overlapping with production seeds `3300000+`, reserve seeds `3390000+`, P4-T3 seeds `4300000+`, P4-T4B seeds `4400000+`, or P5-T1 seeds `4500001`–`4500300`).
- **Protected Core Simulation Components (100% Immutable):**
  - Contact Physics v2.1.3.11: `experiments/contact_physics_v2/contact/*` (Lugre, Cattaneo-Mindlin, Normal Contact, Material, Energy Accounting).
  - Simulator v1: `CompliantPreLiftContactEnv`.
  - Stage 3.3B Quality Gates: `experiments/pre_slip_qualification/*`.
- **Causality & Non-Leakage Contract:**
  - Evaluated controllers receive strictly causal, noisy observable telemetry:
    $$\mathbf{y}_{\text{obs},i}(t) = [F_{n,i}(t) + \epsilon_F, F_{t,i}(t) + \epsilon_F, \delta_{t,i}(t) + \epsilon_\delta, v_{\text{slip},i}(t)]$$
    along with object tilt $\theta(t) + \epsilon_\theta$.
  - Zero access to privileged oracle states: sticking core radius $c_i(t)$, contact patch radius $a_i(t)$, or static friction $\mu_{s,i}$.
- **Physical Actuator Constraints:**
  - Actuator rate limits $|\dot{F}_{n,i}| \le 50.0\,\text{N/s}$ ($0.05\,\text{N/ms}$) and safety bounds $[3.0, 25.0]\,\text{N}$ per finger strictly enforced.

---

## 3. Git Blob Hash Manifest (P5-T2 Deliverables)

All deliverable artifacts in `research/PROBE-1/Research-002/experiments/multi_finger_cooperative_p5_t2/` are indexed with their SHA-1 Git blob hashes:

| File Name | Git Blob Hash (SHA-1) | Purpose |
|---|---|---|
| `cooperative_preload_controllers.py` | `ff6bed557d0c6766a2655985a8733a76d9d429c1` | 6 multi-finger controllers (Equal, Fixed Total, Rule-Based, Predictive, Indep P5-T1, Learned Coop) |
| `multi_finger_sim_env.py` | `aa8167bd3163afd7e93ad591ad2cee80dbd0834f` | Coupled 2D planar object dynamics & multi-contact simulation |
| `tactile_finger_estimator.py` | `6b0ff2c74caf52b1f1f1ea672a7388907d3d1507` | Causal per-finger stability margin and uncertainty tracking |
| `test_p5_t2_multi_finger.py` | `e825df08e8ffa22410d1a3b27084f5f6656d05fb` | 9-point unit test suite verifying contracts, physics, and safety |
| `run_p5_t2_experiments.py` | `d917bd3c7c0c3598b4d329a81fff928a2269a28a` | 300-scenario factorial benchmark runner & statistics |
| `p5_t2_evaluation_summary.json` | `1f00cd32ee5cb2ced5076c3a33bbd4690fe497c6` | Machine-readable benchmark evaluation summary & Stage B9 matrix |
| `p5_t2_failure_analysis.json` | `b0547efd11e57db09709bda563d5dd37e6ed09fc` | Failure mode taxonomy and physics breakdown |
| `p5_t2_research_specification.md` | `99b625e58504bbf8e2444cdb221996794c412802` | Pre-registered Stage B9 research specification |
| `p5_t2_scientific_evaluation_report.md` | `eff655ebe5bd90ad8ac617ac0cc98b87252099e0` | Full scientific audit and multi-finger contact evaluation report |
| `p5_t1_evidence_revalidation.py` | `b0d3be8f48d2249dea8f098b965465ae68d6397f` | Part A P5-T1 evidence revalidation script |
| `p5_t1_revalidation_summary.json` | `12ea0fd7ccdf6453c89562f0cac81001f872ef42` | Part A P5-T1 revalidation summary data |
| `p5_t1_evidence_revalidation_audit.md` | `fce6101e717da6ac480fc3c3d671e3d181408ca4` | Part A P5-T1 revalidation markdown audit |

---

## 4. Exact Reproduction Command Protocol

To verify and reproduce all results from scratch in an independent environment:

```powershell
# 1. Run unit test suite (9 tests, expected: 9 passed in ~2s)
pytest research/PROBE-1/Research-002/experiments/multi_finger_cooperative_p5_t2/test_p5_t2_multi_finger.py -v

# 2. Run P5-T1 Part A evidence revalidation
python research/PROBE-1/Research-002/experiments/multi_finger_cooperative_p5_t2/p5_t1_evidence_revalidation.py

# 3. Execute 300-scenario multi-finger benchmark (seeds 4600001 - 4600300)
python research/PROBE-1/Research-002/experiments/multi_finger_cooperative_p5_t2/run_p5_t2_experiments.py

# 4. Verify Git blob hashes
Get-ChildItem -Path research/PROBE-1/Research-002/experiments/multi_finger_cooperative_p5_t2 -File | ForEach-Object { "$($_.Name): $(git hash-object $_.FullName)" }
```
