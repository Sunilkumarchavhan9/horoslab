# HOROS PROBE-1 — Pre-Slip Pilot Protocol

**Date:** 2026-11-19  
**Status:** Not authorized to run. The feasibility check returned NO-GO.  
**This document records the protocol that was inspected and the rule that would make a later protocol valid.**

## 1. Question this protocol is not allowed to claim

A model forecasts friction-induced slip from a probe that does not itself slip. The current `CompliantPreLiftContactEnv.step` contact law cannot host that claim. See `pre_slip_pilot_feasibility_report.md`.

## 2. Definitions, fixed from the source

| Symbol | Definition | Source |
| :--- | :--- | :--- |
| `t` | Post-action index. Simulator `step_count` is `t + 1` because `step` increments before the regime update and the integration. | `CompliantPreLiftContactEnv.step` |
| Contact | `fn[i] >= 0.10` N before the cone test. Below that, `delta_dot_t` is the commanded velocity, not Coulomb slip. | `step` |
| First Coulomb slip sample | Smallest `t` with contact established and `max abs(delta_dot_t) >= 1e-4` m/s. On the slipping branch the value is at least 0.0005 m/s, so the two thresholds mark the same sample. | `step` and `classify_contact_mode` |
| Sticking | Contact and candidate shear `<= mu_true * fn`. Slip is written as 0. Shear is `k_pad * stretch` and does not depend on `mu_true`. | `step` |
| Privileged | `mu_true`, `object_mass`, modes, `step_history` friction and mass. Legal as offline labels. Illegal as model inputs. | `_get_obs` versus `get_environment_state` |

## 3. What a valid protocol would have to show before any pilot

A later authorization has to name an observation, available at `t_dec`, whose distribution changes with friction while `t_dec` is strictly before the first Coulomb slip sample. In the current source that observation does not exist. Force, stretch, and zero slip are invariant to `mu_true` on the sticking branch.

Until that observation exists, the protocol below is a prohibition, not a run card.

## 4. Prohibited designs

1. Treating Regime A plus the 0.050 mm/step lift as a pre-slip forecast. The certified pilot slipped on the transition sample. That is detection.
2. Calling a sub-threshold lift a friction probe. While it stays inside the cone at both 0.60 and 0.24, the observations match.
3. Calling the first slipping step a forecast because the log timestamp is the same step. The integration has already applied the new friction and written slip.
4. Using `Fz / g` mass R² as evidence about friction or about a learned latent.
5. Using production seeds `3300000+` or reserve seeds `3390000+`.

## 5. If the contact law is changed later

That change is a different authorization. It is not part of this NO-GO. Any replacement law has to be inspected again, without assuming a precursor exists, and the sticking branch has to be re-read to see whether friction appears in an observation before slip is written.

## 6. Seed rule if a different question is authorized

Constant friction and mass can be separated by `reset(mu_true, object_mass)` and by `scenario_seed` in `src/teaching/factory.py`. Those seeds are for a future registered protocol. This NO-GO does not allocate them.
