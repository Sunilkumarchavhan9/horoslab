# HOROS PROBE-1 — Research-002
## Stage 3.2.2 Completion Report

**Stage:** 3.2.2 — Contact Label Ontology and Causal Event Verification  
**Branch:** `feat/probe1-stage32-pilot-remediation`  
**Protocol:** `HOROS-P1-R002-STAGE3.2.2-ONTOLOGY-CAUSAL`  
**Date:** 2026-11-17  
**Parent canonical commit:** `298b0227a66bfcc3916ac07c987aa7257b333b13` (`Sunilkumarchavhan9/horoslab`)  
**Parent mirror commit:** `223a7afb33cf6ce4ddee766066c84c3d21f0857e` (`Sunilkumarchavhan9/horos-probe-1`)  
**Publication commits:** recorded after this report is committed; see the branch heads below once the publication commit lands.

## Decision

The saved 40-episode pilot passes the corrected checks. The trajectories were not regenerated. Stage 3.3 production generation was not started. No student-model training was performed.

## Issue A — Contact-mode ontology

The Stage 3.2.1 certification listed four classifier classes and assigned the wrong names to IDs 1, 2, and 3. The implementation in `src/contact_modes/contact_mode_definitions.py` is unchanged and remains authoritative:

| ID | Enum name | Display name |
| ---: | :--- | :--- |
| 0 | FREE | Free |
| 1 | FIRST_CONTACT | FirstContact |
| 2 | STICKING | Sticking |
| 3 | SLIDING | Sliding |
| 4 | IMPACT | Impact |
| 5 | JAMMING | Jamming |
| 6 | RELEASE | Release |

Simulator contact strata stay a separate system: 0 FREE, 1 IMPACT, 2 SLIDING, 3 WEDGING, 4 SEATED. Classifier mode 3 is sliding. Simulator stratum 3 is wedging. Saved numeric labels were not remapped.

All 40 privileged episode mode arrays contain only members of `ContactMode`. The four wedging episodes reach simulator stratum 3. Their classifier labels are FREE, FIRST_CONTACT, and STICKING. Classifier `JAMMING` (ID 5) was not emitted. That fact is now part of the certification, because a wedging stratum must not be read as classifier jamming or as classifier sliding.

## Issue B — Regime A friction-to-slip timing

Indexing used for the causal check:

- `t` is the post-action index shared by `step_mu_true[t]` and `next_states[t, 16:20]`.
- Simulator `step_count` is `t + 1`.
- Friction changes when `step_count >= 15`, so the first recorded sample at 0.24 is `t = 14`.
- Slip acceptance uses only `t >= 14`. The whole-episode peak is not the acceptance statistic.

Both saved Regime A episodes pass independently:

| Episode | Seed | Transition index | Simulator step | Pre-transition μ | Post-transition μ | Pre-transition peak slip | First slip index | Post-transition peak slip |
| :--- | ---: | ---: | ---: | :--- | :--- | ---: | ---: | ---: |
| `syn_compliant_prelift_stage3_pilot_controller_v1_seed3113000` | 3113000 | 14 | 15 | 0.60 × 14 | 0.24 × 6 | 0 m/s | 14 | 0.00500 m/s |
| `syn_compliant_prelift_stage3_pilot_controller_v1_seed3113002` | 3113002 | 14 | 15 | 0.60 × 14 | 0.24 × 6 | 0 m/s | 14 | 0.00500 m/s |

`regime_a_slip_triggered` is true only because both episodes verify the friction sequence and then exceed 0.0010 m/s after that index. A regression constructs a trajectory whose slip is entirely before the transition and asserts that the acceptance function rejects it.

Regime B still requires a mass increment of 0.0025 kg at every timestep, ending at 0.400 kg. The four wedging episodes still require the same post-action index for stratum 3, insertion depth above 5.0 mm, and state/telemetry agreement. Privileged keys remain absent from the 40 model-visible NPZ files. Accepted manifest length is 40. Rejected manifest length is 0.

## Evidence preserved

Episode NPZ files, privileged JSON files, and both manifests were not rewritten.

- Accepted manifest SHA-256: `515ea08aa30716ab957365da81757c258491b31595a87dd3e3e0ab129ee241e2`
- Rejected manifest SHA-256: `a5338d955b09046ec0b16f3a9625b7955c763aae07dc722e474e6078745f932f`
- Canonical/mirror artifact comparison: 80 accepted episode files matched, plus both manifests.

## Verification logs

Canonical `research/PROBE-1/Research-002`, `PYTHONPATH=.;src`, `python -m pytest tests -q --tb=line`:

```
262 passed in 36.27s
```

Mirror `Research-002`, same command:

```
262 passed in 34.22s
```

Dedicated pilot file `tests/test_p39_stage3_pilot.py`: `16 passed`. That file now locks the seven-class enum, checks every saved mode label, separates classifier mode 3 from simulator stratum 3, and reads both Regime A privileged JSON files and NPZ files directly.

## Governance

- Stage 3.0 files were not modified: `src/teaching/factory.py`, `src/teaching/validator.py`, `src/teaching/__init__.py`, `src/teaching/inference.py`, `tests/test_p38_stage3_preflight.py`.
- B1–B4 and CBF v1.0 were not modified.
- Training permitted: 0. Training performed: false. Parameters trained: 0. No gradient steps, no optimizer updates, no checkpoint edits.
- Stage 3.3 generation of 1,000 episodes remains prohibited until a separate authorization.
- Stage 4 world-model training was not started.

## What remains after this stage

1. Stage 3.3 may generate 500 Prelift and 500 Peg-in-Hole episodes only after formal authorization.
2. Stage 3.4 audits validity, distributions, leakage, coverage, and reproducibility.
3. Stage 3.5 freezes the dataset, manifests, checksums, and splits.
4. Stage 4 requests authorization for the first HOROS world-model training run.
