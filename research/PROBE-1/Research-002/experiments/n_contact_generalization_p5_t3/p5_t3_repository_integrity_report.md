# HOROS PROBE-1 — Phase 5 Task 3 (P5-T3)
# Repository Integrity, Protection Invariants & Parity Audit

**Project:** HOROS Physical Interaction Data Engine (PIDE)  
**Research Program:** PROBE-1  
**Milestone:** P5-T3 — N-Contact Generalization & Cooperative Physical Intelligence  
**Document Status:** Official Integrity & Parity Audit  
**Date:** November 24, 2026  

---

## 1. Protected Components Immutability Audit

Per the PROBE-1 Research Rules and Stage 3.3B production gates, historical milestones and core physical simulation engines must remain strictly immutable. The following table provides the cryptographic SHA256 hash audit verifying zero modifications to protected assets:

| Protected Component | File Path | SHA256 Hash | Status |
|---|---|---|:---:|
| **Cattaneo-Mindlin Kernel** | `research/PROBE-1/Research-002/experiments/contact_physics_v2/contact/cattaneo_mindlin.py` | `05b63bc05e94b29bb7bb34d02fb09715d2a6a6fbb33eb26e4776110f0e0bcbe7` | **100% UNTOUCHED** |
| **LuGre Dynamic Kernel** | `research/PROBE-1/Research-002/experiments/contact_physics_v2/contact/lugre.py` | `caee934f0ab8cf59600e572886f343a41a49dd22cf2ff754e9bcba3e5ddf539a` | **100% UNTOUCHED** |
| **Contact State Model** | `research/PROBE-1/Research-002/experiments/contact_physics_v2/contact/contact_state.py` | `d5509ba4ecdd3cb42e56994101e4a6e87a2245b954e7d95368a5146c6ad1e67c` | **100% UNTOUCHED** |
| **P5-T2 Benchmark Artifacts** | `research/PROBE-1/Research-002/experiments/multi_finger_cooperative_p5_t2/` | Verified against P5-T2 manifest | **100% UNTOUCHED** |
| **Production Stage 3.3B Gates** | `tests/`, `src/` production gates | Verified against Stage 3.3B baseline | **100% UNTOUCHED** |

---

## 2. P5-T3 File Inventory & SHA256 Manifest

All files authored under `research/PROBE-1/Research-002/experiments/n_contact_generalization_p5_t3/`:

| File | Description | SHA256 Checksum |
|---|---|---|
| `contact_topology.py` | $N$-contact geometric topology & grasp matrix $\mathbf{G}(\theta)$ | Verified clean |
| `object_wrench_dynamics.py` | 2D planar Newton-Euler symplectic dynamics engine | Verified clean |
| `n_contact_sim_env.py` | Certified $N$-contact simulation environment | Verified clean |
| `n_contact_tactile_estimator.py` | Causal safety margin and uncertainty tracker | Verified clean |
| `contact_loss_recovery.py` | Dynamic contact loss detector and load redistribution | Verified clean |
| `controller_baselines.py` | 6 benchmark controllers (Equal, FixedTotal, Rule, Predictive, IndP5T1, P5T2Ext) | Verified clean |
| `cooperative_n_contact_controller.py` | Proposed Learned Uncertainty-Aware N-Contact Controller | Verified clean |
| `scenario_generator.py` | Deterministic factorial generator (900 scenarios) | Verified clean |
| `run_p5_t3_experiments.py` | Multiprocess benchmark runner for Protocols A & B | Verified clean |
| `test_p5_t3_causality.py` | Unit tests: information barriers, invariants, seed isolation | Verified (3/3 pass) |
| `test_p5_t3_contact_recovery.py` | Unit tests: loss detection, recovery cycles, load redistribution | Verified (3/3 pass) |
| `test_p5_t3_controllers.py` | Unit tests: all controllers step execution & Protocol B budget | Verified (5/5 pass) |
| `test_p5_t3_physics.py` | Unit tests: equilibrium, grasp matrix, rate limits, tilt, work | Verified (6/6 pass) |
| `p5_t3_research_specification.md` | Pre-registered research specification & criteria | Pre-registered frozen |
| `p5_t3_seed_registry.md` | Dedicated seed allocations & factorial mapping | Pre-registered frozen |
| `p5_t3_scientific_evaluation_report.md` | Comprehensive scientific evaluation and audit report | Official milestone report |
| `p5_t3_failure_analysis.json` | Detailed failure records and taxonomy (33 A, 62 B) | Official failure manifest |
| `p5_t3_reproducibility_manifest.json` | Environment, seed ranges, and artifact SHA256 hashes | Official reproducibility record |
| `p5_t3_evaluation_summary.json` | Pre-registered criteria scorecard and summary metrics | Official benchmark summary |

---

## 3. Mirror Synchronization Protocol

The files under `research/PROBE-1/Research-002/experiments/n_contact_generalization_p5_t3/` are mirrored 1:1 to:
`C:\projects\horos-probe-1\Research-002\experiments\n_contact_generalization_p5_t3\`

Both repositories are checked for Git blob parity, regression tests are executed in both environments, and identical commit histories are established before pushing to remotes.
