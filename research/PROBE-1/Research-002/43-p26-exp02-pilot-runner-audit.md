# HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
## Document 43: Stage P2.6 Experiment 02 Pilot Runner Audit & Telemetry Instrumentation

**Author:** Sunil Kumar Chavhan (`contact@horoslab.org`)  
**Role:** Founder & Lead Researcher, HOROS Physical Intelligence  
**Co-Founder Governance Status:** Pilot Authorization Held Pending Runner Corrections; Full Matrix Blocked  
**Referenced Commits:**  
- Main Repository (`horoslab`): [`6d19928f`](https://github.com/Sunilkumarchavhan9/horoslab/commit/6d19928f)  
- Dedicated Research Repository (`horos-probe-1`): [`b6c5b03`](https://github.com/Sunilkumarchavhan9/horos-probe-1/commit/b6c5b03)  
- Target Runner: [`experiments/p26_safety_coordination/run_p26_exp02_pilot.py`](experiments/p26_safety_coordination/run_p26_exp02_pilot.py)  
- Test File: [`tests/test_p26_pilot_runner.py`](tests/test_p26_pilot_runner.py)

---

### 1. Executive Summary & Audit Findings

During the co-founder readiness review of the pre-registered pilot runner, four defects were identified in [`experiments/p26_safety_coordination/run_p26_exp02_pilot.py`](experiments/p26_safety_coordination/run_p26_exp02_pilot.py). These defects did not compromise the underlying controller logic in `action_substitutor.py`, but prevented accurate empirical evaluation of the pre-registered pilot criteria.

In accordance with HOROS research governance, the 50-episode simulation pilot execution was held until all four runner defects were resolved, unit tested, and dry-run verified.

---

### 2. Forensic Analysis of the Four Runner Defects & Physical Fixes

#### Issue 1: Unlogged Eight-Channel Step Telemetry
- **Defect Mechanism:**  
  The runner instantiated `telemetry = InterventionTelemetryLogger()`, but never invoked `log_decision(...)` inside the control loop. Only cell-level scalar summaries were returned, failing to produce the pre-registered 1,250 step-level records across the eight required channels.
- **Physical Rationale:**  
  Evaluating contact-mode transitions (e.g. from sticking to incipient micro-slip) requires granular, step-by-step telemetry of barrier values, forces, and action distortion norms. Without decision-level traces, limit cycles cannot be verified.
- **Corrective Implementation:**  
  Inside the per-step simulation loop:
  1. `telemetry.start_episode(episode_id, model_name, variant, ep_seed)` is called at step 0.
  2. For every step $t \in [0, 24]$, `telemetry.log_decision(...)` records:
     - Channel 1: `contact_mode` (integer & stratum name via `classify_contact_mode`)
     - Channel 2: `normal_forces` ($[F_{n,0}, F_{n,1}, F_{n,2}, F_{n,3}]$ in Newtons)
     - Channel 3: `shear_forces` ($[F_{t,0}, F_{t,1}, F_{t,2}, F_{t,3}]$ in Newtons)
     - Channel 4: `max_slip_ratio` ($\max_i \rho_i$ and regularized per-contact ratios)
     - Channel 5: `barrier_values` ($h_{\text{slip}}$ and $h_{\text{crush}}$)
     - Channel 6: `proposed_vs_filtered` ($a_{\text{prop}}$, $a_{\text{sub}}$, distortion norm $\|a_{\text{prop}} - a_{\text{sub}}\|$)
     - Channel 7: `streak_length` (consecutive clamped steps within the episode)
     - Channel 8: `task_progress_mm` (vertical object coordinate $z_{\text{obj}}$)
  3. `telemetry.end_episode(...)` finalizes episode records into `telemetry.episodes`.

---

#### Issue 2: Incorrect Episode Accounting on Task Failure
- **Defect Mechanism:**  
  The global episode counter `total_episodes_run` was nested inside `if success:`, causing failed episodes to be omitted from the total count. As a consequence, a condition with 2 successes and 3 failures would report `total_episodes_run = 2` instead of `5`.
- **Corrective Implementation:**  
  Separated completed and successful episode counters:
  - `episodes_completed`: incremented unconditionally at the end of every episode loop.
  - `episodes_successful`: incremented strictly when task success is achieved ($z_{\text{obj}} \ge 2.0\,\text{mm}$).
  - `success_rate`: rigorously defined as $\frac{\text{episodes\_successful}}{\text{episodes\_completed}}$.

---

#### Issue 3: Missing Two-Step 18 N Active Retraction Damping Evaluation
- **Defect Mechanism:**  
  Document 42 pre-registered that any transient excursion into $F_n \ge 18.0\,\text{N}$ must arrest or reverse force growth within two control steps ($\le 20\,\text{ms}$). The runner checked only the $25.0\,\text{N}$ hard limit, leaving this primary dynamic damping criterion unmeasured.
- **Physical Rationale:**  
  The $18.0\,\text{N}$ ceiling represents the threshold of structural risk for fragile objects. Proportional outward retraction ($K_{\text{retract}} = 1.5\,\text{step}^{-1}$) must demonstrate that dynamic kinetic energy is dissipated without climbing toward the $25.0\,\text{N}$ destruction limit.
- **Corrective Implementation:**  
  Implemented dynamic trajectory tracking for all contact excursions:
  1. At step $t$, if finger $i$ exhibits $F_{n,i}(t) \ge 18.0\,\text{N}$:
     Record entry threshold $F_{\text{threshold}} = F_{n,i}(t)$.
  2. Monitor steps $t+1$ and $t+2$:
     - If $F_{n,i}(t+1) \le F_{\text{threshold}}$ or $F_{n,i}(t+2) \le F_{\text{threshold}}$, mark excursion as **DAMPED** (growth arrested/reversed within $\le 2$ steps).
     - If $F_{n,i}(t+1) > F_{\text{threshold}}$ and $F_{n,i}(t+2) > F_{\text{threshold}}$, mark excursion as **DAMPING FAILURE**.
  3. Report metrics: `total_18N_excursions`, `damped_18N_excursions`, `failed_18N_damping`, and `damping_success_rate`.

---

#### Issue 4: Inter-Episode Clamp Streak Leakage & E02-C/M4 Isolation
- **Defect Mechanism:**  
  `current_clamp_streak` was initialized outside the episode loop, allowing consecutive clamped steps from the tail of episode $k$ to append to the start of episode $k+1$.
- **Corrective Implementation:**  
  1. `current_clamp_streak = 0` is strictly reset at the start of every episode.
  2. Isolated streak tracking for the critical comparative pair:
     $$\text{streak\_comparison} = \begin{cases} \text{baseline\_C2 under M4}: & \text{max consecutive clamped streak} \\ \text{E02\_C under M4}: & \text{max consecutive clamped streak} \end{cases}$$
     Directly proving whether E02-C eliminates the $12\text{--}16$ step baseline deadband streak.

---

### 3. Verification Test Suite: `tests/test_p26_pilot_runner.py`

A dedicated test suite validates the corrected runner without executing long simulation rollouts:

| Test ID | Test Target | Verification Proof |
| :--- | :--- | :--- |
| `test_01_episode_accounting_on_failure` | Issue 2 | Runs mock runner with 5 forced failures: asserts `episodes_completed == 5`, `episodes_successful == 0`, `success_rate == 0.0`. |
| `test_02_eight_channel_telemetry_schema` | Issue 1 | Verifies that logged decisions contain all 8 required channels with valid types, non-empty profiles, and finite values. |
| `test_03_eighteen_newton_damping_evaluation` | Issue 3 | Tests 18 N tracker with damped force profiles vs runaway profiles: asserts correct classification of damping success and failure. |
| `test_04_inter_episode_streak_reset` | Issue 4 | Runs two sequential clamped episodes: asserts streak resets to 0 at episode boundary and does not sum across episodes. |
| `test_05_dry_run_allocation_integrity` | Planning | Asserts dry-run mode returns exactly 10 cells, 50 planned episodes, and 1,250 decision slots. |

---

### 4. Dry-Run Plan Matrix

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                     P2.6 EXPERIMENT 02 DRY-RUN PROTOCOL MATRIX                         │
├────────────────────┬─────────────┬─────────────┬───────────┬──────────────┬────────────┤
│ Cell Key           │ Model       │ Variant     │ Episodes  │ Decisions    │ Seeds      │
├────────────────────┼─────────────┼─────────────┼───────────┼──────────────┼────────────┤
│ M2__baseline_C2    │ M2_boundary │ baseline_C2 │ 5         │ 125          │ 42,142,242,│
│ M2__E02_A          │ M2_boundary │ E02_A       │ 5         │ 125          │ 342,442    │
│ M2__E02_B          │ M2_boundary │ E02_B       │ 5         │ 125          │            │
│ M2__E02_C          │ M2_boundary │ E02_C       │ 5         │ 125          │            │
│ M2__E02_D          │ M2_boundary │ E02_D       │ 5         │ 125          │            │
│ M4__baseline_C2    │ M4_acmm     │ baseline_C2 │ 5         │ 125          │            │
│ M4__E02_A          │ M4_acmm     │ E02_A       │ 5         │ 125          │            │
│ M4__E02_B          │ M4_acmm     │ E02_B       │ 5         │ 125          │            │
│ M4__E02_C          │ M4_acmm     │ E02_C       │ 5         │ 125          │            │
│ M4__E02_D          │ M4_acmm     │ E02_D       │ 5         │ 125          │            │
├────────────────────┴─────────────┴─────────────┼───────────┼──────────────┼────────────┤
│ TOTAL (10 Cells)                               │ 50        │ 1,250        │            │
└────────────────────────────────────────────────┴───────────┴──────────────┴────────────┘
```

---

### 5. Signoff & Authorization Request

```
========================================================================================
HOROS PROBE-1 RESEARCH-002: P2.6 PILOT RUNNER AUDIT
Document: 43-p26-exp02-pilot-runner-audit.md
Four Runner Defects: RESOLVED & UNIT TESTED
Runner Tests: 5/5 PASSING
Action Substitution Suite: 23/23 PASSING
Full Research-002 Suite: 57/57 PASSING (0 REGRESSIONS)
Dry-Run Verification: 50 Episodes / 10 Cells / 1,250 Decision Slots Confirmed
Pilot Execution Status: READY FOR CO-FOUNDER AUTHORIZATION
========================================================================================
```
