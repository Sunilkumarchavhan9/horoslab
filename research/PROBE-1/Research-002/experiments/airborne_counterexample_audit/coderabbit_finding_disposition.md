# HOROS PROBE-1 — CodeRabbit Review Finding Adjudication

**Document Identifier:** `HOROS-P1-R002-CODERABBIT-FINDING-DISPOSITION`  
**Date:** 2026-11-20  
**Phase:** Stage 3.3 Research Qualification / Counterexample Audit  
**Author:** HOROS Physical Intelligence Research Group  
**Status:** **FORMAL ADJUDICATION REPORT**  

---

### 1. Executive Summary

This report delivers the explicit technical adjudication of all outstanding CodeRabbit review findings across Canonical Pull Request #43 (`Sunilkumarchavhan9/horoslab`) and Mirror Pull Request #13 (`Sunilkumarchavhan9/horos-probe-1`). Each finding has been independently investigated against source physics, test coverage, and mathematical invariants.

---

### 2. Systematic Adjudication Matrix

#### Finding 1: Airborne Equilibrium Friction Observability Counterexample
- **Target File:** `src/environment/compliant_prelift_env.py:501-504`
- **Description:** Line 503 `actual_ft_z[i] = min(step_mu_used * self.fn[i], eq_ft_z)` makes observed shear force and pad displacement depend on friction while recorded slip is zero.
- **Classification:** **VALID IN CODE; NUMERICAL ARTIFACT; NEEDS EXPERIMENT.**
- **Evidence:** Source code analysis confirms that when $0.98 W \le \mu F_N < W$, the simulator executes the clean-tracking branch ($a_z = \dot{v}_{\text{cmd}}$) while clamping force to $\mu F_n$.
- **Required Correction:** Formalize this branch in scientific specifications. Acknowledge the $0.98$ deadband as an unphysical kinematic hold.
- **Scientific Impact:** Replaces categorical NO-GO with CONDITIONAL disposition.

#### Finding 2: Free-Space Finger Slip Velocity False Alarm
- **Target File:** `src/environment/compliant_prelift_env.py:448`
- **Description:** When $F_n < 0.10\text{ N}$, `actual_slip_vel[i] = cmd_vel_mps` registers false slip during pre-grasp approach.
- **Classification:** **VALID DEFECT IN PREVIOUS METRIC AUDIT.**
- **Evidence:** Lines 445–450 set `actual_slip_vel[i] = cmd_vel_mps` when $F_{n,i} < 0.10\text{ N}$. If the arm approaches at $5\text{ mm/s}$, `delta_dot_t` outputs $0.005\text{ m/s} > 0.0001\text{ m/s}$.
- **Required Correction:** Correct the slip-event metric to require concurrent normal contact: $\mathcal{E}_{\text{slip}} \iff \exists i \text{ s.t. } (F_{n,i} \ge 0.10\text{ N}) \land (|\dot{\delta}_i| \ge 0.0005\text{ m/s})$.
- **Scientific Impact:** Eliminates spurious pre-contact slip detections from audit timelines.

#### Finding 3: Strict Enforcement of Probe Force Limits
- **Target File:** `experiments/pre_slip_qualification/pre_slip_pilot_safety_contract.md`
- **Description:** Every evaluated trial must explicitly enforce the $20.0\text{ N}$ total normal force limit and $15.0\text{ N}$ vertical shear force limit.
- **Classification:** **VALID REQUIREMENT.**
- **Evidence:** Existing pilot runner checks in `run_stage3_pilot.py` impose these caps. They must be active on every probing action.
- **Required Correction:** Integrate $F_N \le 20.0\text{ N}$ and $F_t \le 15.0\text{ N}$ constraints into `slip_and_failure_event_timing_spec.md`.
- **Scientific Impact:** Disqualifies overly aggressive probing actions from claiming false success.

#### Finding 4: Decoupling Passive Friction from Active Mass Identification
- **Target File:** `src/integrated/phase37_3_trust_policy.py:93-165`
- **Description:** The $R^2 = 0.6537$ mass identification result in Phase 3.7.3 must not be claimed as evidence of learned latent friction.
- **Classification:** **VALID SCIENTIFIC INVARIANT.**
- **Evidence:** `ActiveMicroLiftEstimator` operates strictly on $F_z = m g$ during liftoff plateau. It computes an analytical force balance, not a learned latent representation, and contains zero friction estimation.
- **Required Correction:** Document strict separation: mass identification is a vertical force balance; friction identification requires tangential cone excitation.
- **Scientific Impact:** Preserves boundary between active weighing and friction forecasting.

#### Finding 5: Baseline Rejection Criteria & Lead Time Definition
- **Target File:** `experiments/pre_slip_qualification/pre_slip_pilot_baseline_comparison.md`
- **Description:** Reactive slip detection fires on the exact step of slip onset; its lead time must be documented as zero steps ($\Delta t = 0$).
- **Classification:** **VALID METHODOLOGICAL RULE.**
- **Evidence:** Phase 3.7.3 `SLIP_COLLAPSE` evaluates `max_slip_vel > 0.0010 m/s`, which triggers on post-transition index 15. Lead time relative to slip is 0 steps.
- **Required Correction:** Rejection protocol must classify any rule with $\tau_{\text{lead}} \le 0$ as reactive detection, not forecasting.
- **Scientific Impact:** Enforces rigorous separation between early detection and genuine prediction.

#### Finding 6: Matched Factorial Matrix Requirement
- **Target File:** `experiments/pre_slip_qualification/pre_slip_pilot_protocol.md`
- **Description:** Evaluating friction changes without matched constant-mass controls allows models to confound mass with friction.
- **Classification:** **VALID EXPERIMENTAL DESIGN.**
- **Evidence:** Safety factor $S = \mu F_N / (m g)$ is symmetric under proportional scaling of $\mu$ or $1/m$.
- **Required Correction:** Specify balanced $4 \times 4$ factorial design in `matched_friction_mass_comparison_design.md`.
- **Scientific Impact:** Prevents false claims of friction identification on un-controlled datasets.

#### Finding 7: Sensor Noise Impact on Narrow Marginal Deadband
- **Target File:** `src/environment/compliant_prelift_env.py:536-547`
- **Description:** AR(1) sensor noise ($\sigma_t = 0.008\text{ N}$) may mask the $2\%$ force signal in the $0.98 \le \mu F_N / W < 1.00$ window.
- **Classification:** **VALID PHYSICAL CONSTRAINT.**
- **Evidence:** For $0.350\text{ kg}$ workpiece, the $2\%$ force difference is $\approx 0.0686\text{ N}$ total ($0.017\text{ N/finger}$). With single-step noise $\sigma_t = 0.008\text{ N}$, SNR per finger is $\approx 2.1$.
- **Required Correction:** Multi-step averaging over $\ge 10$ steps required to achieve $\text{SNR} \ge 3.0$.
- **Scientific Impact:** Establishes theoretical upper bound on detection accuracy in noisy real-world settings.

#### Finding 8: Stage 3.3B Production Dataset Inadequacy
- **Target File:** `experiments/stage3_production_readiness/stage3_3_seed_registry.json`
- **Description:** The 1,000 registered Stage 3.3B episodes cannot validate the pre-slip hypothesis.
- **Classification:** **VALID AUDIT VERDICT.**
- **Evidence:** Registered Regime A has only 1 step transition at index 14 ($0.60 \to 0.24$) coupled with an immediate slipping lift. No sub-threshold probing or matched parameter crosses exist.
- **Required Correction:** Keep Stage 3.3B locked. Do not generate episodes or allocate seeds.
- **Scientific Impact:** Prevents expenditure of compute on an unsuited dataset.

---

### 3. Review Thread Disposition Summary

All 8 major review topics across PR #43 and PR #13 are **formally adjudicated**. Every valid defect has been addressed in specifications and experimental designs, establishing a rigorous basis for future research qualification.
