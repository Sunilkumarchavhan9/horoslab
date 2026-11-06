# HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
## Document 42: Stage P2.6 Experiment 02 Readiness Gate & Controlled Pilot Protocol

**Author:** Sunil Kumar Chavhan (`contact@horoslab.org`)  
**Role:** Founder & Lead Researcher, HOROS Physical Intelligence  
**Co-Founder Governance Status:** Phase 1 Provisionally Accepted; Corrective Phase 2 Implementation Audited; Phase 3 Controlled Pilot Authorized (50 Episodes); Full Matrix Blocked  
**Runtime Environment:** Python 3.12.10, NumPy 2.5.2, OSQP 0.6.7.post3, PyTorch 2.6.0+cu124  
**Primary Reference:** [Document 40 Revision 2.1](40-p26-exp02-action-substitution-mathematical-specification.md), [Document 41](41-p26-action-substitutor-implementation-audit.md)  
**Target Module:** [`src/coordination/action_substitutor.py`](src/coordination/action_substitutor.py)  
**Test Suite:** [`tests/test_p26_action_substitution.py`](tests/test_p26_action_substitution.py) (23 tests, 52 total Research-002 suite)

---

### 1. Resolution of the Three Code-Review Blockers

In accordance with the co-founder readiness review, three additional structural and dimensional blockers have been mathematically defined, implemented in code, and verified by adversarial tests.

#### Blocker A — Missing Shear Lift Authorization Elimination
- **Defect Mechanism:**  
  Previously, `substitute_action` invoked `calculate_regularized_slip_ratios(fn_arr, ft_arr, allow_unmeasured_estimate=True)`. When tactile shear forces were absent (`ft_arr is None`), this calculated a nominal gravity-based shear load ($F_{t,i} = mg / N_f = 1.226\,\text{N}$). Downstream velocity logic evaluated `has_slip_risk` against this unmeasured estimate, inadvertently allowing variants E02-B, E02-C, and E02-D to authorize upward lift without empirical tactile evidence.
- **Physical Rationale:**  
  In nonstationary physical manipulation, nominal load assumptions fail during dynamic contact events (accelerations, torsional slip, asymmetric finger roll-off). An unmeasured nominal estimate cannot establish safe friction capacity.
- **Corrective Implementation:**  
  1. If shear telemetry is missing (`shear_measured == False`), upward lift ($a_{\text{prop}}[4] > 0$) is **unconditionally arrested** ($a_{\text{sub}}[4] = 0.0\,\text{mm/step}, v_z = 0.0\,\text{m/s}$) under the dedicated branch:
     $$\text{branch} = \text{"Branch\_Unmeasured\_Shear\_Lift\_Blocked"}$$
  2. Downward motion ($a_{\text{prop}}[4] \le 0$) remains permitted subject to the physical table collision guard ($z_{\text{obj}} + a_{\text{lift}} \ge 0$).
  3. Any nominal calculation is strictly flagged in diagnostic telemetry as:
     $$\text{"shear\_source"}: \text{"unmeasured\_nominal\_diagnostic"}$$
     and is never ingested into motion authorization.

---

#### Blocker B — Strict Telemetry Shape, Dimension & Finiteness Enforcement
- **Defect Mechanism:**  
  Array validation inspected scalar lengths or first dimensions (`shape[0] == N_f`), but did not verify exact tensor dimensionality. Inputs such as nested 2D normal forces `[[1, 2, 3, 4]]`, scalar floats `3.0`, 3D shear arrays `(4, 2, 2)`, malformed action shapes `(6,)` or `(1, 5)`, and non-finite `obj_pos` vectors could cause broadcast ambiguity or uncaught exceptions.
- **Corrective Implementation:**  
  Strict shape and type contracts enforced prior to numerical processing:
  1. **Normal Forces:** Strictly 1D numpy float array of shape `(self.N_f,)` ($N_f = 4$) with non-negative, finite elements.
  2. **Shear Forces:** Strictly 1D vector of magnitudes `(self.N_f,)` or 2D tangential force vectors `(self.N_f, 2)` with all elements finite.
  3. **Object Position:** Strictly 1D vector of shape `(3,)` with all coordinates finite, or finite scalar `lift_height`.
  4. **Proposed Action:** Strictly 1D vector of shape `(5,)` with all elements finite.
  Any shape, dimension, or finiteness violation immediately routes execution to safe arrest (`_safe_arrest_action` or `sensor_fault` fallback with $a_{\text{sub}} = \mathbf{0}, v_z = 0.0$).

---

#### Blocker C — Initialization Domain Validation
- **Defect Mechanism:**  
  The `ContactAwareActionSubstitutor` constructor lacked defensive range checks, allowing mathematically unviable configurations (negative mass, negative stiffness, inverted ceilings, non-positive timesteps) to initialize without error.
- **Corrective Implementation:**  
  Mandatory parameter domain validation in `__init__`, raising `ValueError` on any physical violation:
  - $m > 0$ and finite
  - $g > 0$ and finite
  - $N_f \ge 1$ and integer
  - $\mu > 0$ and finite
  - $k_{\text{elastic}} > 0$ and finite
  - $\gamma \ge 1.0$ and finite
  - $\eta \in (0.0, 1.0]$ and finite
  - $\Delta t > 0$ and finite
  - $F_{\text{ceiling}} > 0$ and finite
  - $F_{\text{hard\_limit}} > F_{\text{ceiling}}$ (strict ceiling hierarchy: $18.0\,\text{N} < 25.0\,\text{N}$)
  - $0 < F_{\text{min\_valid}} < F_{\text{ceiling}}$ ($0.10\,\text{N} < 18.0\,\text{N}$)
  - $K_p > 0$ and $K_{\text{retract}} > 0$

---

### 2. Comprehensive 23-Test Verification Matrix

The action substitution test suite [`tests/test_p26_action_substitution.py`](tests/test_p26_action_substitution.py) now provides 100% coverage across baseline kinematics, edge cases, and adversarial attacks:

| Group | Test ID | Target Specification |
| :--- | :--- | :--- |
| **Squeeze** | `test_01` | Force deficit $\Delta F_n = \max(0, F_{\text{req}} - F_n)$ with $F_{\text{req}} = 2.5547\,\text{N}$. |
| | `test_02` | Proportional command $\Delta a = K_p (\Delta F_n / k_{\text{el}})$, clipped to $[-2.0, 2.0]\,\text{mm/step}$. |
| **Anti-Crush** | `test_03` | Proportional active retraction for $F_n \ge 18.0\,\text{N}$ ($K_{\text{retract}} = 1.5\,\text{step}^{-1}$). |
| | `test_04` | Hard environment limit saturation at $25.0\,\text{N}$ ($-2.0\,\text{mm/step}$). |
| **Lift** | `test_05` | Upward acceleration $a_{z,\max}$ and stateful velocity integration in Branch 1 with measured shear. |
| | `test_06` | Stale velocity safeguard: preload deficit strictly resets $v_z = 0.0$. |
| **Downward** | `test_07` | Branch 2 negative command pass-through and table collision guard $z_{\text{obj}} + a_{\text{lift}} \ge 0$. |
| **Contact Loss** | `test_08` | Per-finger asymmetric fallback: unseated finger searches ($+0.20$), seated fingers hold ($0.0$). |
| **Friction** | `test_09` | Multi-finger friction bound governed by weakest contact $\min_i(F_{n,i})$. |
| **Clamp Release** | `test_10` | E02-A release condition: preload satisfied and $\rho_i \le \eta$ with measured shear. |
| **Input Faults** | `test_11` | NaN, Inf, zero friction, and negative forces safely trigger Branch 3 fallback. |
| **Determinism** | `test_12` | Bitwise identical outputs on identical inputs. |
| **Units** | `test_13` | Explicit dimensional audit for all physical quantities. |
| **Adversarial** | `test_14` | Asymmetric contact loss (0.05 N) + protective ceiling (22 N) + hard limit (26 N) combined. |
| | `test_15` | NaN/Inf shear telemetry rejected to sensor fault, cannot bypass slip checks. |
| | `test_16` | Missing shear telemetry strictly blocks E02-A clamp release. |
| | `test_17` | Independent boundary behavior: 20 N active retraction ($-0.75\,\text{mm}$) vs 25 N hard saturation ($-2.00\,\text{mm}$). |
| | `test_18` | Malformed proposed actions (None, shape `(3,)`, NaN) safely arrested. |
| **Blocker C** | `test_19` | Constructor domain validation: rejects negative mass, zero dt, negative stiffness, inverted ceilings. |
| **Blocker B** | `test_20` | Strict normal force shape validation: rejects nested 2D, scalar, oversized, and truncated arrays. |
| | `test_21` | Strict shear force shape validation: rejects 3D, wrong width 2D, truncated; accepts valid 2D `(4, 2)`. |
| | `test_22` | Strict object position and action shape validation: rejects 4-element positions, NaN positions, 2D actions, oversized actions. |
| **Blocker A** | `test_23` | Missing shear unconditionally blocks upward lift across all variants; permits safe descent. |

---

### 3. Pre-Registered Engineering Smoke-Test Pilot Protocol

To establish empirical operational readiness without jumping prematurely into the full factorial matrix, a **50-episode pre-registered pilot** is specified:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        P2.6 EXPERIMENT 02 SMOKE-TEST PILOT                             │
├────────────────────┬───────────────────────────────────────────────────────────────────┤
│ Scope              │ 5 Variants × 2 Contact Regimes × 5 Episodes = 50 Episodes         │
│ Variants           │ E02-A (Clamp Release), E02-B (Velocity Controller Only),          │
│                    │ E02-C (Coordinated Preload + Velocity), E02-D (Integrated Model), │
│                    │ baseline_C2 (Negative Control: Rigid p-CBF Clamping)              │
│ Contact Regimes    │ M2 (Touchdown / Initial Seating), M4 (Incipient Micro-Slip)       │
│ Allocation         │ 5 episodes per cell (seeds: 42, 142, 242, 342, 442)               │
│ Telemetry Logging  │ Complete 8-channel step logs (25 steps/ep = 1,250 decision steps) │
└────────────────────┴───────────────────────────────────────────────────────────────────┘
```

#### Pre-Registered Pilot Acceptance Criteria
1. **Hard Limit Safety (Primary Invariant):** Zero observed normal forces exceeding $25.0\,\text{N}$ across all 50 episodes ($0/50$).
2. **Protective Crush Damping:** For any transient excursion into $F_n \ge 18.0\,\text{N}$, active proportional retraction must arrest or reverse normal force growth within 2 control steps ($\le 20\,\text{ms}$).
3. **Limit Cycle Elimination in E02-C:** Max consecutive clamped streak length under M4 must drop from the baseline C2 deadband streak ($12\text{--}16$ steps) to $\le 3$ steps.
4. **Execution Integrity:** Zero uncaught exceptions, zero NaN telemetry values, zero malformed action dispatches.

#### Non-Pooling Rule
Pilot episodes are executed strictly for **engineering smoke verification**. In accordance with scientific research discipline, pilot episodes shall **never be pooled** with the final evaluation matrix ($N = 90$ per condition, seeds $\{100, 200, 300\}$).

---

### 4. Scientific Epistemology: Empirical Observations vs. Formal Certificates

HOROS maintains strict empirical honesty regarding safety claims:
- **Simulation Invariant Statement:** An observation of $0$ violations across $N = 50$ or $N = 90$ simulated episodes does **not** constitute a mathematical proof of certified physical safety.
- **Statistical Upper Bound:** Under an exact two-sided 95% Wilson confidence interval, $0/50$ zero-violation observations establish an empirical upper failure rate bound of **$7.13\%$**, while $0/90$ establishes **$4.09\%$**.
- **Real-World Transfer Distinction:** Contact mechanics in simulation (Hunt-Crossley spring-damper, Coulomb friction cone approximation) reflect nominal models. Real hardware encounters unmodeled high-frequency stick-slip dynamics, sensor transport lag, and thermal friction drift. Controller outputs are strictly bounded runtime filters, not unconditioned guarantees.

---

### 5. Authorization & Verification Record

```
========================================================================================
HOROS PROBE-1 RESEARCH-002: P2.6 EXPERIMENT 02 READINESS GATE
Document: 42-p26-exp02-readiness-and-pilot-protocol.md
Status: BLOCKERS A, B, C CLOSED & ADVERSARIALLY VERIFIED
Action Substitution Suite: 23/23 PASSING
Full Research-002 Suite: 52/52 PASSING (0 REGRESSIONS)
Pilot Allocation: 50 Episodes Pre-Registered (5 variants × 2 modes × 5 episodes)
Full Factorial Simulation Matrix (450 episodes): STRICTLY BLOCKED PENDING PILOT REVIEW
========================================================================================
```

