# HOROS PROBE-1 — Research-002: Stage 2 Task 2 Unified Physical Data Contract Closure

**Document Reference:** `HOROS-P1-R002-STAGE2-TASK2-CLOSURE`  
**Date:** 2026-11-14  
**Status:** COMPLETED & VERIFIED  
**Repository Synchrony:** Canonical (`MemoryOS`) & Public Mirror (`horos-probe-1`)  
**Execution Boundary:** Strictly Non-Training Remediation (0 student weight updates, 0 gradient steps)

---

## 1. Executive Summary

During independent GitHub source verification of Stage 2 commit `4de5c57` (canonical) and `3919e25` (mirror), a critical legacy extraction branch was identified in `Research-002/src/selection_aware/counterfactual_rollout.py`. While `compute_prelift_resultant_wrench()` had been successfully implemented to compute the true 6-axis Cartesian wrench from normal and tangential shear contact forces, `extract_env_state_and_wrench()` retained an explicit clause:
```python
elif legacy_padding or task == "multifinger_lift" or "finger_ft" not in obs:
    wrench = np.pad(obs["finger_fn"][:4], (0, 2)).astype(np.float32)
```
This clause caused any caller specifying `task == "multifinger_lift"` to bypass the modern physical wrench computation, returning four scalar normal forces padded with two zeros (`[fn0, fn1, fn2, fn3, 0, 0]`). Consequently, downstream modules reading `wrench[2]` interpreted a padded zero as vertical shear, while `wrench[3:]` remained zero despite real physical lever-arm torques.

This defect has now been **permanently eliminated**:
1. **Unified Physical Contract Across All Task 2 Identifiers:** Every Task 2 identifier (`compliant_prelift`, `compliant_lift`, `multifinger_lift`) now computes the genuine 6-axis Cartesian wrench via `compute_prelift_resultant_wrench()` whenever interacting with modern simulation or teaching pipelines.
2. **Missing Channel Rejection:** Any missing or `None` `finger_ft` observation for a Task 2 environment in modern mode raises an immediate, descriptive `ValueError`.
3. **Explicit Legacy Adapter:** Historical Phase 3.4/3.5 $B1$–$B4$ checkpoint evaluation compatibility is preserved via a dedicated, standalone function: `extract_legacy_checkpoint_state_and_wrench()`. Legacy representation is strictly prohibited from silently entering modern distillation or validation.
4. **Downstream Pipeline Firewalls:** Both `StudentDistillationEngine` and `PhysicsValidationEngine` actively inspect incoming wrench tensors and immediately reject legacy-padded representations (`[fn0, fn1, fn2, fn3, 0, 0]`).

---

## 2. Mathematical & Coordinate Transformation Contract

The workpiece frame is centered at `obj_pos` with Cartesian axes $X, Y, Z$. For each finger $i \in \{0, 1, 2, 3\}$:
- Lever arm: $\mathbf{r}_i = (\mathbf{p}_i - \mathbf{p}_{\text{obj}}) \times 10^{-3} \text{ m}$.
- Radial distance in workpiece $XY$-plane: $r_{xy,i} = \|\mathbf{r}_{i,xy}\|_2$.
- Inward radial normal unit vector: $\hat{\mathbf{n}}_i = -[r_{i,x}/r_{xy,i},\; r_{i,y}/r_{xy,i},\; 0]^T$.
- Circumferential shear unit vector: $\hat{\mathbf{u}}_{\theta,i} = [-r_{i,y}/r_{xy,i},\; r_{i,x}/r_{xy,i},\; 0]^T$.
- Vertical pad shear unit vector: $\hat{\mathbf{u}}_z = [0,\; 0,\; 1]^T$.
- 3D contact force on workpiece:
  $$\mathbf{F}_i = F_{n,i}\,\hat{\mathbf{n}}_i + F_{t,\theta,i}\,\hat{\mathbf{u}}_{\theta,i} + F_{t,z,i}\,\hat{\mathbf{u}}_z \quad (\text{N})$$
- Torque about workpiece center of mass:
  $$\boldsymbol{\tau}_i = \mathbf{r}_i \times \mathbf{F}_i \quad (\text{N}\cdot\text{m})$$
- Net Cartesian resultant wrench:
  $$\mathbf{W} = \left[ \sum_{i=1}^4 F_{i,x},\; \sum_{i=1}^4 F_{i,y},\; \sum_{i=1}^4 F_{i,z},\; \sum_{i=1}^4 \tau_{i,x},\; \sum_{i=1}^4 \tau_{i,y},\; \sum_{i=1}^4 \tau_{i,z} \right]^T$$

Under this contract:
- $\mathbf{W}[2]$ strictly represents net vertical shear force $F_z^{\text{net}} = \sum_{i=1}^4 F_{t,z,i}$ in Newtons.
- $\mathbf{W}[3:]$ strictly represents 3D resultant torque $(\tau_x, \tau_y, \tau_z)$ in Newton-meters.
- Total normal clamping force is obtained from the dedicated sensor channels $\sum \mathbf{s}[12:16]$ in Newtons.

---

## 3. Implementation Details

### 3.1 Refactored Extractor in `counterfactual_rollout.py`

```python
def extract_env_state_and_wrench(
    obs: Dict[str, Any],
    task: str = "peg_in_hole",
    legacy_compatibility_mode: bool = False,
    legacy_padding: bool = False,
) -> Tuple[np.ndarray, np.ndarray]:
    """Helper to extract consistent state vector (state_dim) and 6-axis wrench (6)."""
    if task == "peg_in_hole":
        s_vec = np.concatenate([
            obs["pos"], obs["vel"],
            obs["rot"], obs["wrench"]
        ]).astype(np.float32)
        wrench = obs["wrench"].astype(np.float32)
    elif task in ("compliant_prelift", "compliant_lift", "multifinger_lift"):
        slip_or_vel = (
            obs["slip_ratio"]
            if "slip_ratio" in obs
            else np.abs(np.asarray(obs["delta_dot_t"], dtype=np.float32))
        )
        s_vec = np.concatenate([
            obs["finger_pos"].flatten(),
            obs["finger_fn"],
            slip_or_vel,
            obs["obj_pos"]
        ]).astype(np.float32)

        is_legacy = bool(legacy_compatibility_mode or legacy_padding)
        if is_legacy:
            wrench = np.pad(obs["finger_fn"][:4], (0, 2)).astype(np.float32)
        else:
            if "finger_ft" not in obs or obs["finger_ft"] is None:
                raise ValueError(
                    f"Task 2 modern physical force contract requires 'finger_ft' tangential force observations for task '{task}'. "
                    f"Missing 'finger_ft' channel in observation dictionary. To evaluate legacy checkpoints requiring padded "
                    f"representation, explicitly call extract_legacy_checkpoint_state_and_wrench() or pass legacy_compatibility_mode=True."
                )
            wrench = compute_prelift_resultant_wrench(
                obs["finger_pos"],
                obs["obj_pos"],
                obs["finger_fn"],
                obs["finger_ft"],
            )
    else:
        raise ValueError(
            f"Unknown task identifier: '{task}'. Expected 'peg_in_hole', 'compliant_prelift', "
            f"'compliant_lift', or 'multifinger_lift'."
        )
    return s_vec, wrench


def extract_legacy_checkpoint_state_and_wrench(
    obs: Dict[str, Any],
    task: str = "multifinger_lift",
) -> Tuple[np.ndarray, np.ndarray]:
    """Explicit legacy adapter strictly for evaluating frozen Phase 3.4/3.5 B1-B4 checkpoints."""
    return extract_env_state_and_wrench(obs, task=task, legacy_compatibility_mode=True)
```

### 3.2 Distiller Firewall in `distiller.py`

In `StudentDistillationEngine.extract_nonprivileged_step()`:
```python
if len(wrench) != 6:
    raise ValueError(f"Malformed wrench vector: expected 6 elements [Fx, Fy, Fz, Tx, Ty, Tz], got {len(wrench)}")
if len(state) >= 16 and np.sum(state[12:16]) > 0.5:
    if np.allclose(wrench[:4], state[12:16], atol=1e-4) and abs(wrench[4]) < 1e-6 and abs(wrench[5]) < 1e-6:
        raise ValueError(
            "Legacy padded wrench [fn_0, fn_1, fn_2, fn_3, 0, 0] detected in modern distillation pipeline. "
            "Modern distillation requires 6-axis Cartesian resultant wrench [Fx, Fy, Fz, Tx, Ty, Tz]."
        )
```

### 3.3 Validator Firewall in `validator.py`

In `PhysicsValidationEngine.validate_trajectory()`:
```python
if task_id in ("compliant_prelift", "compliant_lift", "multifinger_lift"):
    if len(s_t) >= 16 and np.sum(s_t[12:16]) > 0.5:
        if len(w_t) >= 6 and np.allclose(w_t[:4], s_t[12:16], atol=1e-4) and abs(w_t[4]) < 1e-6 and abs(w_t[5]) < 1e-6:
            return ValidationReport(
                verdict=ValidationVerdict.REJECTED_FORCE_LIMIT,
                is_valid=False,
                failure_step=t,
                violation_details=(
                    f"Step {t}: Legacy padded wrench representation [fn_0, fn_1, fn_2, fn_3, 0, 0] "
                    f"detected in modern teaching pipeline. Task 2 requires 6-axis resultant wrench [Fx, Fy, Fz, Tx, Ty, Tz]."
                ),
            )
```

---

## 4. Verification & Compatibility Audit

1. **All Three Task 2 Identifiers Tested:** `compliant_prelift`, `compliant_lift`, and `multifinger_lift` are identically routed through `compute_prelift_resultant_wrench()`.
2. **Backward Compatibility Preserved:** Phase 2.8 hybrid model test harness `tests/test_p28_harness_remediation.py` explicitly invokes `extract_legacy_checkpoint_state_and_wrench()`, validating that frozen checkpoints retain full backward evaluation compatibility without contaminating modern pipelines.
3. **Regression Test Suite:** 202 passed across the complete suite.
