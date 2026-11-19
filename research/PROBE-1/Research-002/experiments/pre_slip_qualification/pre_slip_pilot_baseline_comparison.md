# HOROS PROBE-1 — Pre-Slip Baseline Comparison

**Date:** 2026-11-19  
**Status:** Comparison of what the baselines can see. No checkpoint was loaded and no trajectory was rolled out.  
**Recommendation:** **NO-GO.** None of the baselines can be evaluated as a pre-slip friction forecast until the contact law exposes friction before slip.

## 1. Reactive slip detection

The detector reads `delta_dot_t` from `_get_obs`, or state channels 16:20. The prelift classifier declares sliding at `1e-4` m/s. `CompliantPreLiftContactEnv.step` writes contact slip as 0 or at least 0.0005 m/s.

Phase 3.7.3 Gate T4, on seeds 6117–6120, is `TRUST` at step 14 and `ABSTAIN` at step 15 with reason `SLIP_COLLAPSE`. That decision uses the first post-transition observation. Its lead time against the first slip sample is zero. It is the detection baseline. It is not a forecast.

Phase 3.7.4 keeps the latch after slip returns to zero on a later hold. That is memory of a slip that already happened.

## 2. Frozen B1–B4

| Model | Class | Checkpoint pattern | Read-only entry point |
| :--- | :--- | :--- | :--- |
| B1 | `DeterministicWorldModel` | `checkpoints/phase3_4/<task>/<condition>/b1_deterministic.pt` | `load_hybrid_checkpoint` |
| B2 | `ProbabilisticWorldModel` | `b2_probabilistic.pt` | same |
| B3 | `EnsembleWorldModel`, five members | `b3_ensemble.pt` and `b3_member_0.pt` through `b3_member_4.pt` | `load_hybrid_checkpoint` or `load_b3_ensemble_from_members` |
| B4 | Conformal thresholds stored with the Phase 3.4 runs | JSON beside the checkpoints | read the stored quantiles; do not refit |

`load_hybrid_checkpoint` calls `hybrid.eval()`. A later comparison may call `predict_with_uncertainty(state, action)` on observations at indices strictly before the first Coulomb slip sample. The models do not take `mu_true`. On the sticking branch those observations do not depend on `mu_true`, so a residual, a variance, or a conformal score computed from them cannot rank a silent friction change. Phase 3.7.2 already measured the ensemble's transition AUROC near 0.48 to 0.51 when the change is scored more broadly. That number is not a pre-slip result, and it was not recomputed here.

## 3. Linear temporal baseline

A logistic or ridge model on the last 1, 5, or 10 sticking frames has the same inputs as B1. Those frames do not contain friction. Beating B1 with that linear model, or losing to it, would not show pre-slip identification. Both would be fitting a signal the contact law does not emit.

## 4. Mass baseline, kept separate

The Phase 3.7.3 active micro-lift reports mass R² 0.6537 from plateau `Fz / g` on 60 episodes. Passive 10-step history reports mass R² −0.0705. The first number is a force calculation during a lift that stayed stuck. It is not a B1–B4 latent and it is not a friction score.

## 5. What a later comparison is allowed to report

Only after a contact observation depends on friction at a logged time before the first Coulomb slip sample:

1. Passive hold.
2. The action that created that observation.
3. The reactive rule, whose lead time must be reported as zero if it fires on the slip sample.
4. B1, B2, B3 variance, and B4, all in `eval`, with no optimizer step.
5. A linear model on the same legal frames.

Until then, publishing an AUROC for this question would mix detection with forecast. This check does not publish one.
