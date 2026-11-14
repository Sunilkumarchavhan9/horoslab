# HOROS PROBE-1 — Research-002: Stage 2 Follow-Up Force Contract Correction Report

**Document Reference:** `HOROS-P1-R002-FCC-001`  
**Date:** 2026-11-14  
**Status:** COMPLETED & VERIFIED  
**Repository Branch:** `feat/probe1-research002-phase2` (Canonical `MemoryOS`) / `main` (Public Mirror `horos-probe-1`)  
**Scope:** Task 2 Physical Force Mapping, Sensor-Frame Coordinate Transformations, Downstream Estimator/Validator Rectification  

---

## 1. Problem Identification and Physical Defect Analysis

During independent source code review on GitHub following Stage 2 remediation, a critical physical data mapping bug was identified in `src/selection_aware/counterfactual_rollout.py`:

```python
# PREVIOUS DEFECTIVE IMPLEMENTATION:
wrench = np.pad(obs["finger_fn"][:4], (0, 2)).astype(np.float32)
```

In the physical simulation environment `CompliantPreLiftContactEnv`, the simulation step generates two distinct fingertip force signals:
1. `finger_fn`: Four normal fingertip forces (scalar normal clamping forces exerted against the elastomeric pads).
2. `finger_ft`: Four tangential fingertip force vectors (including circumferential shear and vertical pad shear).

The previous implementation padded the four normal forces with two zeros and labelled the resulting 6-D vector as a Cartesian wrench. This representation created two critical physical downstream bugs:

### Problem A — Contact-Mode Estimator Misclassification
The observable contact-mode probability estimator in `src/teaching/distiller.py` interpreted the 6-D vector as a Cartesian wrench $[F_x, F_y, F_z, \tau_x, \tau_y, \tau_z]$:
$$\hat{F}_N = \|\text{wrench}[:2]\| = \sqrt{F_{n,0}^2 + F_{n,1}^2}$$
$$\hat{F}_z = |\text{wrench}[2]| = F_{n,2}$$

For a balanced, stationary grasp with four equal normal clamping forces $N$ and zero vertical shear:
$$\frac{\hat{F}_z}{\hat{F}_N} = \frac{N}{\sqrt{N^2 + N^2}} = \frac{1}{\sqrt{2}} \approx 0.7071$$

Because the contact-mode classifier used a sliding friction threshold of $0.70$, an equally loaded, stationary, non-slipping grasp was systematically misclassified as **Mode 3 (Sliding)** rather than **Mode 2 (Sticking)**.

### Problem B — Friction Validator Firewall Failure
The physics validation engine in `src/teaching/validator.py` similarly read `wrench[2]` as the vertical shear force $F_z$. Consequently:
- The Coulomb friction cone criterion $F_{\text{shear}} \le \mu_{\text{true}} F_N$ was evaluated against the third finger's normal clamping force $F_{n,2}$ rather than the actual tangential shear force.
- High normal clamping forces could trigger false friction cone rejections, while massive tangential slip could evade detection if normal force was moderate.
- Tilting torques about the object center were assumed to be zero rather than computed from the physical cross-product of lever arms and forces.

---

## 2. Mathematical Formalization of Physical Force Contract

To resolve these defects, we formalized the complete coordinate transformation and aggregation contract for multi-finger prelift grasping in `src/selection_aware/counterfactual_rollout.py`:

### 2.1 Coordinate Frame Definitions
- **Object Frame:** Origin at workpiece center of mass $\mathbf{p}_{\text{obj}} = [x_{\text{obj}}, y_{\text{obj}}, z_{\text{obj}}]^T \in \mathbb{R}^3$ (in millimeters).
- **Fingertip Positions:** $\mathbf{p}_i = [x_i, y_i, z_i]^T \in \mathbb{R}^3$ for $i \in \{0, 1, 2, 3\}$.
- **Fingertip Lever Arms:**
  $$\mathbf{r}_i = 10^{-3} \cdot (\mathbf{p}_i - \mathbf{p}_{\text{obj}}) \in \mathbb{R}^3 \quad (\text{meters})$$
  In-plane radial projection: $r_{xy,i} = \sqrt{r_{i,x}^2 + r_{i,y}^2}$.

### 2.2 Local Contact Basis Vectors
For each finger $i$ positioned around the cylindrical workpiece ($r_{xy,i} > 10^{-6}\text{ m}$):
- **Inward Normal Unit Vector:** $\hat{\mathbf{n}}_i = \left[-\frac{r_{i,x}}{r_{xy,i}}, -\frac{r_{i,y}}{r_{xy,i}}, 0\right]^T$
- **Circumferential Tangential Unit Vector:** $\hat{\mathbf{u}}_{\theta,i} = \left[-\frac{r_{i,y}}{r_{xy,i}}, \frac{r_{i,x}}{r_{xy,i}}, 0\right]^T$
- **Vertical Pad Shear Unit Vector:** $\hat{\mathbf{u}}_{z} = [0, 0, 1]^T$

### 2.3 Individual Fingertip Force Vector
Each fingertip exerts a 3D contact force on the workpiece:
$$\mathbf{F}_i = F_{n,i} \hat{\mathbf{n}}_i + F_{t,\theta,i} \hat{\mathbf{u}}_{\theta,i} + F_{t,z,i} \hat{\mathbf{u}}_z \quad (\text{Newtons})$$

### 2.4 Resultant Cartesian Force and Torque Aggregation
The net contact wrench $\mathbf{W} \in \mathbb{R}^6$ acting on the rigid workpiece is:
$$\mathbf{F}^{\text{net}} = \sum_{i=0}^3 \mathbf{F}_i = \begin{bmatrix} \sum F_{i,x} \\ \sum F_{i,y} \\ \sum F_{t,z,i} \end{bmatrix}$$
$$\boldsymbol{\tau}^{\text{net}} = \sum_{i=0}^3 (\mathbf{r}_i \times \mathbf{F}_i) \quad (\text{N}\cdot\text{m})$$
$$\mathbf{W} = \left[ F_x^{\text{net}}, F_y^{\text{net}}, F_z^{\text{net}}, \tau_x^{\text{net}}, \tau_y^{\text{net}}, \tau_z^{\text{net}} \right]^T$$

This calculation is implemented in `compute_prelift_resultant_wrench()` in `src/selection_aware/counterfactual_rollout.py`.

---

## 3. Downstream Module Corrections

### 3.1 Contact-Mode Estimator (`src/teaching/distiller.py`)
The observable contact-mode probability estimator `estimate_observable_mode_probabilities(wrench, state)` was refactored:
- **Total Normal Clamping Force:** $F_N^{\text{total}} = \sum \mathbf{s}[12:16]$ (genuine normal forces).
- **Vertical Shear Force:** $F_z^{\text{shear}} = |W_2|$ (true vertical resultant from $F_{t,z}$).
- **Maximum Fingertip Slip Velocity:** $v_{\text{slip}} = \max_{i} |\mathbf{s}[16+i]|$.
- **Mode Classification Logic:**
  - If $F_N^{\text{total}} < 0.10\text{ N} \implies$ **Mode 0 (Free Space)**.
  - If $v_{\text{slip}} \ge 10^{-4}\text{ m/s}$ ($0.1\text{ mm/s}$) or $F_z^{\text{shear}} / F_N^{\text{total}} > 0.85 \implies$ **Mode 3 (Sliding)** ($p \ge 0.55$).
  - If $F_N^{\text{total}} \ge 0.10\text{ N}$, $v_{\text{slip}} < 10^{-4}\text{ m/s}$, and $F_z^{\text{shear}} / F_N^{\text{total}} \le 0.85 \implies$ **Mode 2 (Sticking)** ($p \ge 0.82$).

### 3.2 Physics Validation Firewall (`src/teaching/validator.py`)
In `PhysicsValidationEngine.validate_trajectory()`:
- **Friction Cone Gatekeeper:** Normal force $F_N = \sum \mathbf{s}_t[12:16]$ and shear force $F_{\text{shear}} = |W_2|$ are compared directly:
  $$F_{\text{shear}} \le \mu_{\text{true}} F_N + \epsilon_{\text{cone}}$$
- **Tilting Torque Gatekeeper:** Rather than assuming $\boldsymbol{\tau} = \mathbf{0}$, the resultant torque magnitude $\tau = \|\mathbf{W}[3:]\|$ is checked against the physical tipping threshold $\tau_{\text{max}} = 2.0\text{ N}\cdot\text{m}$. Trajectories exhibiting extreme eccentric loading are rejected with `REJECTED_FORCE_LIMIT`.

### 3.3 Historical Baseline & Test Harness Preservation
In `src/selection_aware/counterfactual_rollout.py`, `extract_env_state_and_wrench()` supports backward compatibility:
- When `task == "multifinger_lift"` or `legacy_padding=True`, it returns the legacy 4 normal forces padded with 2 zeros to maintain exact compatibility with frozen $B1$–$B4$ checkpoint evaluators and Phase 2.8 test harnesses.
- For modern Task 2 pipelines (`task == "compliant_prelift"` with `legacy_padding=False`), it computes the true 6-axis Cartesian resultant wrench.

---

## 4. Verification and Analytical Test Results

Four dedicated analytical test cases were implemented in `tests/test_p34_teaching_infrastructure.py`:

| Test Name | Analytical Condition | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| `test_prelift_resultant_wrench_analytical_cases` (Case 1) | 4 equal normal forces ($4\text{ N}$), zero shear | $\mathbf{W} = [0, 0, 0, 0, 0, 0]$ | $[0, 0, 0, 0, 0, 0]$ | **PASS** |
| `test_prelift_resultant_wrench_analytical_cases` (Case 2) | 4 equal normal forces ($4\text{ N}$), uniform $1\text{ N}$ vertical shear | $\mathbf{W} = [0, 0, 4.0, 0, 0, 0]$ | $[0, 0, 4.0, 0, 0, 0]$ | **PASS** |
| `test_prelift_resultant_wrench_analytical_cases` (Case 3) | Uneven shear: Finger 0 has $2\text{ N}$, Finger 1 has $0\text{ N}$ at $r=35\text{ mm}$ | $F_z = 2\text{ N}$, $\tau_y = 0.070\text{ N}\cdot\text{m}$ | $F_z = 2.0$, $|\tau_y| = 0.070$ | **PASS** |
| `test_prelift_resultant_wrench_analytical_cases` (Case 4) | Cyclic permutation of fingertip array indices | Invariant net force & torque | Identical $\|F\|, \|\tau\|$ | **PASS** |
| `test_contact_mode_estimator_physical_invariance` | 4 equal normal forces ($10\text{ N}$), zero shear, zero slip | Mode 2 (Sticking) $p > 0.70$, Mode 3 $p \le 0.10$ | Mode 2 ($p=0.82$), Mode 3 ($p=0.10$) | **PASS** |
| `test_contact_mode_estimator_physical_invariance` | Normal force $10\text{ N}$, shear $8.8\text{ N}$ ($F_z/F_N = 0.88 > 0.85$) | Mode 3 (Sliding) $p > 0.50$ | Mode 3 ($p=0.55$) | **PASS** |
| `test_contact_mode_estimator_physical_invariance` | Slip velocity $v_{\text{slip}} = 5\text{ mm/s} \ge 0.1\text{ mm/s}$ | Mode 3 (Sliding) dominant | Mode 3 ($p=0.55$) | **PASS** |
| `test_physics_validator_coulomb_cone_and_torque` | $F_N=10\text{ N}, F_{\text{shear}}=1\text{ N}, \mu=0.50$ | `PHYSICALLY_VALID` | `PHYSICALLY_VALID` | **PASS** |
| `test_physics_validator_coulomb_cone_and_torque` | $F_N=10\text{ N}, F_{\text{shear}}=8\text{ N}, \mu=0.50$ | `REJECTED_FRICTION_CONE` | `REJECTED_FRICTION_CONE` | **PASS** |
| `test_physics_validator_coulomb_cone_and_torque` | Tilting torque $\tau = 3.5\text{ N}\cdot\text{m} > 2.0\text{ N}\cdot\text{m}$ | `REJECTED_FORCE_LIMIT` | `REJECTED_FORCE_LIMIT` | **PASS** |
| `test_peginhole_wrench_invariance` | Task 1 PegInHole 6-axis ATI wrench extraction | Exact bitwise preservation | Exact match | **PASS** |

---

## 5. Compliance and Non-Training Guarantee

- **Zero Student Model Parameter Updates:** Exactly 0 weights altered, 0 gradients computed.
- **Frozen Baselines Intact:** Checkpoints $B1$, $B2$, $B3$, $B4$ and `GeometryAwareCBFSafetyFilter v1.0` remain 100% frozen.
- **Full Test Suite Status:** **196 / 196 tests passing**.
