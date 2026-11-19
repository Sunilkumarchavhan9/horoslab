# HOROS PROBE-1 — Stage 3.3B Dataset Suitability

**Document:** Research Novelty Gate, deliverable 5  
**Date:** 2026-11-19  
**Checked registry:** `experiments/stage3_production_readiness/stage3_3_seed_registry.json`, version 1.0.0, protocol `HOROS-P1-R002-STAGE3.3-PROD-GEN-PROTOCOL`.  
**Checked specification:** `stage3_3_production_generation_protocol.md`.  
**Action taken:** none. No seeds allocated. No episodes generated. `experiments/stage3_production/` is absent.

## 1. What the registry contains

`[REPO]` The registry assigns 1,000 episodes and leaves 300 reserve seeds `UNALLOCATED_LOCKED`. Production seeds use base `3300000` and do not overlap the 40 pilot seeds. Reserve base is `3390000`, with 50 seeds per stratum.

| Task | Stratum | Count | Seed range | Dynamics the protocol specifies |
| :--- | :--- | ---: | :--- | :--- |
| Compliant prelift | Nominal | 250 | 3311000–3311249 | Constant μ in [0.40, 0.80], mass in [0.30, 0.55] kg, then the scripted lift |
| Compliant prelift | Probe | 150 | 3312000–3312149 | Wider μ [0.15, 0.85] and mass [0.30, 0.90] kg. The lift is required to slip at or above 0.0005 m/s while the object stays on the table |
| Compliant prelift | Regime A | 50 | even indices in 3313000–3313099 | One step, μ 0.60 to 0.24, at post-action index 14. Acceptance requires slip after that index above 0.0010 m/s |
| Compliant prelift | Regime B | 50 | odd indices in 3313000–3313099 | Mass ramp 0.350 to 0.400 kg at 0.0025 kg per step, μ fixed at 0.60, hold without drop |
| Peg-in-hole | Nominal | 250 | 3321000–3321249 | Constant clearance, friction, offset, and small tilt |
| Peg-in-hole | Impact | 150 | 3324000–3324149 | Misalignment and rim contact |
| Peg-in-hole | Wedging | 100 | 3325000–3325099 | Two-point geometric wedge. Simulator stratum 3 is required |

The controller is the same open-loop script for every prelift episode: close, indent, then lift at 0.050 mm per step. Peg-in-hole is a constant descent plus a constant lateral offset. `[REPO]`

## 2. Suitability against the proposed experiment

| Requirement | Present in the registered 1,000? | Consequence |
| :--- | :--- | :--- |
| Controlled friction changes | Only Regime A, and only one step from 0.60 to 0.24 | No ramps, no third friction value, no change at any other time |
| Several friction values | Nominal and probe strata sample a range, but each episode is a constant draw except Regime A | Cannot separate interpolation across two points from identification |
| Several transition profiles | One instantaneous step | A model can memorize "index 14" |
| Active friction-probing actions that stay below slip | No. The probe stratum is defined by producing slip. Regime A is accepted only if slip follows the step | There is no uncontaminated pre-slip probe response |
| Mass variation | Yes, as a sampled constant, plus one ramp of 0.05 kg | The ramp is small and always paired with μ 0.60 |
| Active mass identification separate from slip | The scripted lift either slips or lifts. There is no sub-threshold weighing action distinct from the challenge | The T2 `Fz / g` procedure is not what this controller records |
| Pre-slip observations | Regime A has 14 pre-transition steps, and the pilot measurement showed zero slip there | Those steps are the passive arm. Phase 3.7.2 already found them inseparable from the unshifted distribution. They do not contain the active-probe factor |
| Contact-mode transitions | The seven-class classifier will label whatever the scripted contact does | Labels exist only after generation. They are not a substitute for a pre-slip forecast target |
| Nominal and shifted conditions | Yes, as strata | The shift that matters for the hypothesis is confounded with the slip label |
| Held-out parameter levels | Not reserved. The ranges are filled by the seed formula | A split taken after generation can still hold out seeds, but it cannot create probe actions that were not simulated |
| Privileged fields kept out of the model input | The protocol forbids them in the training package | That leakage control is necessary and is not the missing piece |

## 3. Missing strata and fields

The following are absent from the specification and were not added:

- a silent friction change followed by a sub-threshold shear probe
- a silent mass change followed by a sub-threshold vertical probe
- a factorial cross of at least four friction values and four masses
- more than one change time and more than one change shape
- an explicit `t_dec` log written before the challenge
- a contamination flag for slip during the probe
- a challenge action that is not the same command as the probe
- peg-in-hole episodes with a friction or mass change at all

Generating the registered 1,000 episodes would produce a larger copy of the pilot distribution. It would not create the contrast between passive observation and safe probing.

## 4. What the 40 certified episodes can still be used for

`[REPO]` The two Regime A pilot episodes, seeds 3113000 and 3113002, have pre-transition slip of 0 and post-transition slip of 0.005 m/s starting at index 14. They can confirm that the passive prefix is silent. They cannot estimate AUROC, calibration, or identification. Four episodes in Phase 3.7.4 are the same limitation.

## 5. Disposition

Stage 3.3B, as registered, is **not suitable** for the candidate hypothesis. This is a specification gap, not a reason to allocate reserve seeds. A revised specification would be a new authorization request. Until that request exists, the 1,000 slots and the 300 reserve seeds stay unallocated.
