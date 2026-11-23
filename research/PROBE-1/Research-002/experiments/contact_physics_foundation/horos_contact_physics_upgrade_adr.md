# Architecture Decision Record: Contact Mechanics Engine Upgrade for Pre-Slip Intelligence

**ADR Identifier:** `ADR-HOROS-008`  
**Program:** HOROS Physical Intelligence Research Group  
**Project:** Research-002: Model Teaching Infrastructure & Contact Mechanics  
**Date:** 2026-11-20  
**Status:** **APPROVED (ARCHITECTURE BASELINE)**  
**Supercedes:** `ADR-HOROS-006` (Compliant Prelift Environment v1.0)  

---

### 1. Context & Problem Statement

HOROS PROBE-1 was conceived to investigate whether active safe probing and tactile world models can forecast contact failure (frictional slip) before macroscopic sliding occurs.

On 2026-11-19, an empirical diagnostic experiment comprising 160 controlled trials ([`s4_diagnostic_experiment_report.md`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/experiments/s4_diagnostic_experiment/s4_diagnostic_experiment_report.md)) conclusively established that the existing simulation engine ([`compliant_prelift_env.py`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/environment/compliant_prelift_env.py)):
1. **Exhibits zero pre-slip friction observability:** In pre-slip states (table sticking S1, anchored hold S3), tangential force depends strictly on pad displacement ($k_{\text{pad}} \Delta z$) or object mass ($m_{\text{obj}} g$), with zero mathematical dependence on friction ($R^2 \le 0.0$, $r = +0.003$).
2. **Has zero pre-slip forecasting lead time:** Warning before slip onset is strictly $\tau_{\text{lead}} = 0\text{ steps}$.
3. **Bypasses State S4 completely ($0/160$ realizations):** The airborne equilibrium deadband is a measure-zero numerical artifact spanning only $10.2\text{ }\mu\text{m}$ of indentation.
4. **Suffers from severe mass confounding ($R^2 = 0.9998$):** A model trained to forecast slip on this simulator simply learns to weigh the object.

Proceeding with Stage 3.3B dataset generation (1,000 episodes) and HCTT world-model training on this simulator would produce scientifically invalid research. HOROS requires an immediate, principled upgrade to its contact mechanics simulation foundation.

---

### 2. Decision: Dual-Stage Evolutionary Architecture

The HOROS Research and Architecture Committee unanimously approves a **Dual-Stage Architecture Evolution Strategy**:

```
+---------------------------------------------------------------------------------------------------+
| [ Phase 1: Immediate Scientific Foundation ]                                                      |
| In-House Extended Python/NumPy Kernel: CompliantPreLiftContactEnv-v2                              |
| - Cattaneo-Mindlin non-linear compliance softening: kt(Ft) = kt,0 * (1 - Ft/(mu*Fn))^(1/3)        |
| - Multi-annular contact patch discretization & LuGre micro-slip dynamics                          |
| - 100% CI reproducibility, zero external heavyweight dependencies, immediate verification         |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| [ Phase 2: High-Throughput Scalability & Hardware Alignment ]                                     |
| NVIDIA Warp / Isaac Lab Custom GPU Physics Kernel                                                  |
| - Port Phase 1 validated constitutive equations to differentiable NVIDIA Warp kernels             |
| - Vectorized GPU rollouts (10^6 steps/sec) for large-scale world-model pre-training               |
| - Synthetic vision-tactile rendering (GelSight / TacTip) via Omniverse RTX                         |
+---------------------------------------------------------------------------------------------------+
```

---

### 3. Alternatives Considered & Explicit Rejection Rationales

#### Alternative 1: Proceed with Current Simulator and Train HCTT
- *Rationale for Rejection:* **FATAL SCIENTIFIC FLAW.** Because $\partial F_t / \partial \mu = 0$ in all pre-slip states, no neural network or world model can mathematically infer $\mu$ or forecast slip before it occurs. Training HCTT now would waste computational budget and generate pseudo-scientific artifacts driven by mass confounding.

#### Alternative 2: Switch Immediately to Antioch Continuum Solver
- *Rationale for Rejection:* **OPERATIONAL UNVIABILITY.** Antioch step solve time is $50 - 250\text{ ms}$ per step ($1000\times$ slower than real time). It lacks Gymnasium APIs and multi-environment parallelism. Migrating to Antioch would halt all research progress for an estimated 3–6 months. Antioch is designated strictly as an offline calibration reference.

#### Alternative 3: Switch Immediately to MuJoCo 3.x
- *Rationale for Rejection:* **INSUFFICIENT CONTACT PHYSICS.** Standard MuJoCo enforces contact via convex optimization of rigid velocity constraints. It models friction using rigid Coulomb cones without partial slip. Migrating to MuJoCo would incur significant engineering migration costs while replicating the exact same cliff-edge slip failure mode.

#### Alternative 4: Switch Immediately to NVIDIA Isaac Sim / PhysX 5 Out-of-the-Box
- *Rationale for Rejection:* **PREMATURE INFRASTRUCTURE OVERHEAD.** Standard PhysX 5 also uses regularized rigid Coulomb friction without Cattaneo-Mindlin compliance softening. It requires developing custom kernels regardless, while simultaneously introducing heavy GPU driver dependencies that break standard GitHub Actions CI.

---

### 4. Implementation Plan & Governance Milestones

The upgrade follows four strict, gated implementation phases:

1. **Phase 1: Analytical Mechanics Implementation (Weeks 1–2)**
   - Author `CompliantPreLiftContactEnv-v2` in a clean, isolated branch.
   - Implement Hertz normal hardening, Cattaneo-Mindlin compliance softening, and LuGre micro-damping.
   - Zero changes to existing v1 environment files; zero modifications to B1–B4 or CBF v1.0 baselines.
2. **Phase 2: Benchmark Certification (`HOROS-CB-v1`) (Weeks 3–4)**
   - Execute all 10 protocols from `horos_contact_benchmark_specification.md`.
   - Verify: $R^2(\hat{\mu}, \mu_{\text{true}}) \ge 0.85$, pre-slip warning $\tau_{\text{lead}} \ge 20\text{ ms}$, pass rate $10/10$.
3. **Phase 3: Active Probing & Pre-Slip Baseline Progression (Weeks 5–6)**
   - Develop safe active micro-probing controllers.
   - Benchmark simple baselines (compliance estimator, Kalman filter, TCN) before deploying HCTT.
4. **Phase 4: Research Novelty Gate & Production Unlocking (Week 7+)**
   - Convene Research Review Board to inspect certified pre-slip forecasting metrics.
   - Only upon unanimous board authorization will Stage 3.3B production data generation be unlocked.

---

### 5. Architectural Invariants & Governance Constraints

The following governance rules remain strictly enforced:
- **Rule 1 (Data Lock):** Stage 3.3B production dataset generation remains **LOCKED**.
- **Rule 2 (Seed Lock):** All 1,000 production seeds (`3,300,000` series) and 300 reserve seeds (`3,390,000` series) remain **UNALLOCATED_LOCKED**.
- **Rule 3 (Zero Training):** HCTT world-model training and optimizer updates remain **FROZEN**.
- **Rule 4 (No Remote Push):** All architecture deliverables remain local until explicit review by the principal investigator.

---

### 6. Document Sign-Off & Traceability

- **Architectural Lead:** HOROS Principal Simulation Architect
- **Co-Signers:** Research Lead, Robotics Systems Lead, AI Safety Officer
- **Status:** **APPROVED & RECORDED AS ADR-HOROS-008**
