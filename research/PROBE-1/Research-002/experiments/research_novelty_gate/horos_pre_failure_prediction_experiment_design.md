# HOROS PROBE-1 — Pre-Failure Prediction Experiment Design

**Document:** Research Novelty Gate, deliverable 4  
**Date:** 2026-11-19  
**Status:** Proposed protocol. Not registered. Not authorized to run, generate data, or train.  
**Purpose:** Define a falsification test that cannot count post-slip detection as a forecast.

## 1. Claim under test

`[HYPOTHESIS]` A safe, action-conditioned probe identifies a hidden friction or mass change and supports a failure forecast that is logged before the first observable slip sample. The score is calibrated, and the intervention that uses it also starts before that sample.

This document does not assert that the claim is true.

## 2. Observable slip, defined before any model runs

`[REPO]` The contact-mode classifier treats compliant-prelift slip as real when the maximum absolute tangential pad velocity on fingers in contact is at least `1e-4` m/s. The Stage 3.2.2 acceptance test uses a higher event threshold, `0.0010` m/s, after the friction transition.

For this protocol the **first observable slip index** `t_slip` is the smallest post-action index `t` at which

`max |next_states[t, 16:20]| >= 1.0e-4`.

That is the classifier's own physical threshold. Using the looser 0.0010 m/s threshold would let a model see a tactile velocity that the classifier already calls slip and still claim a forecast. That is early detection, and it does not count.

If the episode never crosses `1.0e-4` m/s, `t_slip` is undefined and the failure label must come from a later, separately declared task action, not from a relabeling of the probe.

## 3. Information sets

At a decision time `t_dec` the model may read:

- post-action states and wrenches at indices `0 .. t_dec` inclusive
- actions at indices `0 .. t_dec` inclusive
- its own previous outputs

It may not read, at training or inference for the scored decision:

- any state, wrench, slip, mode, or label at `t > t_dec`
- `mu_true`, `object_mass`, clearance, contact stratum, or any privileged audit field
- the value of `t_slip` or a feature that was computed using `t_slip`

Training labels may use the privileged trace **offline** to build the target. The input vector at `t_dec` may not contain those fields. A run is invalid if an input column is a function of a future index or of `mu_true`.

## 4. Two phases inside one episode

The episode is split so that probing is not the same action as the action being judged.

1. **Probe window.** From a declared start `t_probe` to `t_dec`. The only legal probe actions are those that the safety predicate below accepts.
2. **Held-out challenge.** After `t_dec`, one pre-registered challenge action is applied. The binary label `Y` is 1 if that challenge produces `t_slip` at or after its first sample. The forecast must have been written before the challenge starts.

A prediction made at the first challenge sample that already contains slip is a detection. It is scored only in the reactive baseline column.

## 5. Arms

All arms share the same held-out episodes and the same challenge. They differ only in the information and actions available before `t_dec`.

| Arm | Actions before the decision | Legal inputs | What a win would mean |
| :--- | :--- | :--- | :--- |
| P0 Passive | The nominal clamp and hold. No tangential or lift excitation. | Observations through `t_dec` under that policy. | A silent friction change is invisible, so AUROC should stay near 0.5. A result far above 0.5 means the change was already observable and the "silent parameter" premise is false. |
| P1 Safe active probe | A registered pair: a sub-threshold tangential shear, then a sub-threshold vertical load. | Observations through `t_dec`, including the probe response. | This is the only arm that can support the hypothesis. |
| R Reactive slip detector | Any policy. | The first sample with slip `>= 1.0e-4` m/s. | Reference for detection. Its lead time relative to `t_slip` is zero by construction. |
| B Frozen B1–B4 | Same actions as the arm they are attached to. | Current state and action only, matching how those models were built. Ensemble variance and conformal score at `t_dec`. No future rollout counted as an observation. | Tests whether the existing uncertainty signal carries pre-slip information. |
| L Linear temporal baseline | Same actions as P0 or P1. | A logistic or ridge model on the last `L` in `{1, 5, 10}` observation frames at `t_dec`. | Must be beaten before any transformer is considered. |

No HCTT arm is included. Adding one before L loses to, or fails to beat, L would not be interpretable.

## 6. Probe safety predicate

A probe action is admissible only if, on the pre-registered nominal calibration set, it produces zero samples with slip `>= 1.0e-4` m/s and the normal force on every finger stays at or below 20 N and shear at or below 15 N. Those force caps are the existing prelift acceptance caps. `[REPO]`

The probe is not allowed to search until slip appears. If a trial crosses `1.0e-4` m/s during the probe window, that trial is marked `PROBE_CONTAMINATED` and cannot support a pre-slip claim.

## 7. Factorial conditions

The simulator can set friction and mass independently. The design has to use that, because Stage 3.3B does not.

| Factor | Levels required for a valid test | Why |
| :--- | :--- | :--- |
| Friction before the challenge | At least four values spanning the current nominal and probe ranges, not only 0.60 and 0.24 | Two-point interpolation is not identification. |
| Friction profile | Constant, one step change at a known index, and one ramp | A single step at index 14 is not a profile. |
| Mass | At least four values, crossed with friction | Separates `Fz / g` from the friction margin. |
| Change epoch | The parameter change occurs, and the probe is then run, while slip is still zero | This is the silent-change case. |
| Challenge | One lift or shear large enough that some friction-mass pairs slip and others do not | Creates the label without putting the label into the probe. |

Mass and friction are reported separately. A model that predicts only the product `mu * Fn` does not pass the identification clause.

The existing T2 result, R² 0.6537 from `Fz / g`, may be cited only as a non-learned force-balance reference. It is not a model-identification result. `[REPO]`

## 8. Splits

- Fit probes, thresholds, and the linear baseline on a training split of seeds.
- Select thresholds on a validation split.
- Report once on a test split of seeds whose friction and mass values include levels withheld from training.
- Do not tune on the 40 certified pilot episodes and then quote those same episodes as the result. They may be used to check that the passive Regime A prefix reproduces the already measured fact that pre-transition slip is zero.
- The four Phase 3.7.4 seeds 6117–6120 are a smoke test, not a sample size.

## 9. Metrics and the lead-time proof

Primary metrics, all computed on the test split:

| Metric | Definition for this protocol |
| :--- | :--- |
| AUROC and AUPRC | Rank of `P(Y=1)` issued at `t_dec`. |
| Lead time | `t_slip - t_dec`, in steps and milliseconds, only if the logged decision timestamp is strictly less than `t_slip`. If `t_slip` is undefined, lead time is not claimed. |
| False-alarm rate | Fraction of `Y=0` test episodes with `P(Y=1)` above the frozen threshold. |
| Task outcome | Whether the intervention that used the score avoided the challenge slip without exceeding the force caps. |
| Friction R² and Spearman correlation | Privileged `mu` versus the estimate at `t_dec`, on uncontaminated probes. |
| Mass R² and Spearman correlation | Privileged mass versus the estimate at `t_dec`. |
| Brier score, expected calibration error, risk-coverage | Of `P(Y=1)` at `t_dec`, not of a score computed after `t_slip`. |

Proof that the decision preceded the signal:

1. Write the score, the threshold comparison, and `t_dec` to an append-only log before the challenge action is sent.
2. After the episode, compute `t_slip` from the trace.
3. Discard the forecast if `t_dec >= t_slip` or if any input frame has index `>= t_slip`.
4. Publish the count of discarded forecasts. A method that only wins after discarding is a detector.

## 10. Pre-registered rejection

Reject the hypothesis if any of the following is true on the frozen test split:

- P0 passive AUROC on silent friction changes exceeds 0.60. The change was already observable, so the probing premise is the wrong problem.
- P1 does not exceed P0 by at least 0.10 AUROC, and does not exceed the linear baseline L trained on the same P1 traces.
- P1 friction R² is below 0.60 or mass R² is below 0.60, or the two estimates are interchangeable under a swap of the labels.
- Any reported lead time uses a decision at or after `t_slip`.
- Expected calibration error of the pre-slip score is above 0.10, or the risk-coverage curve does not dominate the constant-probability baseline.
- The intervention reduces challenge failures only by refusing all challenges, with false-alarm rate above 0.50.
- More than 10% of P1 trials are `PROBE_CONTAMINATED`.

These thresholds are proposal numbers for a future registration. They are not results.

## 11. What this protocol will not support

It will not justify HCTT. It will not justify generating the current 1,000-episode Stage 3.3B set. It will not convert the T2 force-balance R² into a learned-mass result. A later architecture comparison is allowed only after P1 beats L and B3 on this protocol.
