# HOROS PROBE-1 — Pre-Slip Pilot Safety Contract

**Date:** 2026-11-19  
**Status:** Contract for an experiment that is **not authorized**. The feasibility result is NO-GO.  
**Inspection:** source only. No rollout was executed.

## 1. Existing force limits, already in the prelift acceptance checks

These limits are properties of the current pilot, not a new safety filter.

| Limit | Value | Where it is enforced today |
| :--- | :--- | :--- |
| Per-finger normal force | `<= 20.0` N | `scripts/run_stage3_pilot.py` interaction check |
| Total normal force | `<= 20.0` N | same |
| Vertical shear | `<= 15.0` N | same |
| Action clip | squeeze `[-2, 2]` mm, lift `[-2, 5]` mm | `CompliantPreLiftContactEnv.step` |
| Geometry CBF | frozen file `src/safety/geometry_cbf_safety_filter.py` | not modified and not invoked by this check |

The cone test uses `fn > 0.10` N. The classifier uses total normal force `0.05` N in the prelift branch. Those are different thresholds. A safety statement has to say which one it means. This contract uses `0.10` N, because that is the branch in `step` that decides sticking versus Coulomb slip.

## 2. Slip is not a continuous safety margin

On contact, slip is written as exactly 0 or as `max(0.0005, abs(commanded_velocity))` m/s. There is no action that produces a slip of `1e-4` m/s while remaining a graded warning. A contract that says "stop at 1e-4 m/s incipient slip" cannot be implemented. The integrator never emits that value during contact.

## 3. What "safe" would have required

A probe would be safe, for this question, only if every finger stayed at or above 0.10 N, normal and shear stayed inside the caps above, and `delta_dot_t` stayed at 0, **and** the resulting observation still depended on friction. The first three can be true together. The fourth is false on the sticking branch. The contract therefore cannot be satisfied by an action schedule. It fails before a numerical force check.

## 4. Commands that are not evidence

- Nonzero lift while `fn < 0.10` N writes the commanded velocity into `delta_dot_t`. That is free motion, not a contact-safety event.
- Regime A with the scripted lift exceeds the post-change cone on the change step. The slip is the failure, not a probe that avoided it.
- Assigning `env.mu_true` from the caller between steps is a privileged write. It was not used here. If a later protocol uses it, the write has to be logged as an intervention and still cannot create a pre-slip friction observation under the current equations.

## 5. Frozen artifacts

This check did not modify B1–B4 checkpoints, CBF v1.0, Stage 3.0 teaching files, or authorization manifests. A future execution is still required to load checkpoints with `eval()` and without `optimizer.step`.
