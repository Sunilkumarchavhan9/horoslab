# HOROS PROBE-1 — Pre-Slip Qualification Pilot: Feasibility Report

**Date:** 2026-11-19  
**Inspection:** source only. The simulator was not executed. No episodes were generated.  
**Recommendation:** **NO-GO**

The simulator can change friction without changing mass, and it can keep a grasp stuck with slip exactly zero. It cannot expose friction in any observation while that no-slip branch is active. Friction enters the contact law only on the step that also writes a slip velocity of at least 0.0005 m/s. A safe probe that does not slip therefore cannot predict a friction-induced slip before the first slip sample. That is a property of this contact law, verified from the source, not a missing script.

## 1. Components

| Quantity | Where it is computed | What the controller is allowed to see |
| :--- | :--- | :--- |
| Friction | `CompliantPreLiftContactEnv.mu_true`. Set in `__init__` and `reset`. Changed only by `_apply_nonstationary_regime` when `regime == "A"`. File: `src/environment/compliant_prelift_env.py`. | Not in `_get_obs`. Present in `get_environment_state` and `step_history`. |
| Mass | `object_mass`. Independent constructor and `reset` argument. Changed only by `_apply_nonstationary_regime` when `regime == "B"`. | Not in `_get_obs`. Present in `get_environment_state` and `step_history`. |
| Normal force | `step`, radial indent: `fn[i] = k_norm * indent_mm` with `k_norm` default 4.0 N/mm. Contact test inside the cone uses `fn > 0.10` N. | `finger_fn` in `_get_obs`, after AR(1) noise. The noise is not applied to slip. |
| Tangential force | `step`, `candidate_ft_z = k_pad * stretch` with `k_pad` default 1500 N/m, then the cone test below. | `finger_ft` in `_get_obs`, with tangential noise. |
| Slip velocity | `actual_slip_vel`, copied to `slip_vel_mps` and returned as `delta_dot_t`. | `delta_dot_t`. Also state channels 16:20 via `extract_env_state_and_wrench`. |
| Contact mode | `classify_contact_mode` in `src/contact_modes/contact_mode_definitions.py`. For this task, sliding is declared when in-contact `max abs(delta_dot_t) >= slip_vel_threshold_mps`, default `1e-4` m/s. | Mode labels are privileged. The slip sample they use is the same `delta_dot_t`. |
| Peg-in-hole friction | `PegInHoleEnv.friction_coeff` in `src/environment/peg_in_hole_env.py`. Constant for the episode. No Regime A step. | Not the prelift slip channel. This feasibility result is about the prelift contact law. |

`_get_obs` returns `finger_pos`, `finger_fn`, `finger_ft`, `obj_pos`, `obj_vel`, `a_z`, `delta_dot_t`, `dt_ms`, and `gamma`. It does not return `mu_true`, `object_mass`, or `step_count`. The caller can count steps. `step_count` and `sim_time_s` live on the environment and in `step_history`.

## 2. Friction and mass are separate parameters

`__init__` and `reset` take `mu_true` and `object_mass` as separate arguments. Regime A assigns a new `mu_true` and does not assign `object_mass`. Regime B assigns a new `object_mass` and does not assign `mu_true`. `create_env_from_manifest` passes both through. `SyntheticExperienceFactory.sample_stratified_scenario` draws them separately for nominal and probe strata.

There is no method that sets an arbitrary friction schedule. The only in-step schedule is Regime A: one step from `regime_a_initial_mu` (default 0.60) to `regime_a_changed_mu` (default 0.24) when `step_count >= regime_a_transition_step` (default 15), with an optional later recovery. Writing `env.mu_true` from outside between steps is possible because it is a public attribute, and the next `step` reads it. That is not a supported schedule API, and this inspection did not do it.

## 3. Friction can change while slip stays zero, and that change is invisible

In `step`, after the regime update:

```text
max_static_ft = step_mu_used * fn[i]
if candidate_ft_z[i] <= max_static_ft:
    actual_ft_z[i] = candidate_ft_z[i]
    slip = 0
else:
    actual_ft_z[i] = 0.90 * max_static_ft
    slip = max(0.0005, abs(commanded_velocity))
```

`candidate_ft_z` is `k_pad` times stretch. It does not read `mu_true`. On the first branch, force and slip do not read `mu_true` either. Two episodes with different friction, the same squeeze, and the same lift, produce the same observations for every step that stays inside both cones.

The second branch is the first time friction affects an observation. That same branch writes slip of at least 0.0005 m/s. The classifier threshold is 0.0001 m/s, so this sample is already the first observable slip sample.

A zero lift command (`action[4] = 0`) keeps commanded velocity at 0. If the stored stretch is still inside the new cone, the friction assignment does not create slip. The observations before and after that assignment match. The previously certified Regime A pilot is the other case: the scripted 0.050 mm/step lift was already outside the 0.24 cone, so slip appeared on the transition sample. That pilot does not show a silent friction change. It shows the coupled case. It was not re-run here.

## 4. No safe probe informs friction without causing slip

A probe action is a squeeze in `action[0:4]` and a vertical increment in `action[4]`, clipped to `[-2, 2]` mm and `[-2, 5]` mm. While the resulting candidate force stays inside the cone, the measured shear is the spring force. It is the same at μ 0.60 and μ 0.24. The probe has not measured friction.

To make the low-friction episode look different, the candidate force has to exceed `0.24 * Fn`. For that episode the step is the slipping branch. The information and the slip sample are the same index. There is no third state. Contact slip is exactly 0, or at least 0.0005 m/s. The comment on that line says the floor is above 0.10 mm/s. The code sets 0.0005 m/s, which is 0.5 mm/s.

Before contact (`fn < 0.10` N), slip is set to the commanded velocity even though the tangential force is zero. A nonzero lift before the grasp therefore looks like slip. Any later definition of "first slip sample" has to ignore steps with `fn < 0.10` N, or the index is not Coulomb slip.

Mass is different. After liftoff with slip still zero, the equilibrium shear uses `object_mass * (gravity + a_z) / 4`. That can vary with mass while the sticking branch is active. The Phase 3.7.3 mass R² of 0.6537 is this force balance, `Fz / g`. It is not a learned latent, and it is not a friction measurement.

## 5. Timestamps exist, and they do not add a pre-slip friction signal

`step_history[t]` stores `step`, `sim_time_s`, privileged `mu_true`, privileged `object_mass_kg`, forces, and object height after the integration that used that step's friction. `_get_obs` for the same step exposes `delta_dot_t` and `dt_ms`. A log can be written before the next action is sent. None of those pre-slip controller fields depends on friction while the sticking branch is active.

## 6. Controlled independent variation

Constant pairs can be chosen by `reset(mu_true=..., object_mass=...)` or by the stratified sampler. Seeds determine the draws: `RandomState(seed)` in `sample_stratified_scenario`, with pilot seeds `3100000 + task*10000 + stratum*1000 + index`. Nominal prelift draws friction from `[0.40, 0.80]` and mass from `[0.30, 0.55]` independently. Probe draws wider ranges independently. Nonstationary episodes do not: even indices are Regime A at fixed 0.60 then 0.24 and mass 0.350 kg, odd indices are Regime B at fixed friction 0.60 and a mass ramp.

Held-out seeds can separate constant-parameter episodes. They cannot create a silent, identifiable friction change that the contact law does not emit.

## 7. Existing trajectory entry points

These scripts exist. None was run for this check.

| Script | Role |
| :--- | :--- |
| `scripts/run_stage3_pilot.py` | Scripted close, indent, and 0.050 mm/step lift. Regime A couples the friction step to the slip acceptance test. |
| `src/integrated/phase37_3_evaluator.py` | Closed-loop trust policy on frozen checkpoints. Gate T4 abstains on the slip sample. |
| `src/integrated/phase37_4_evaluator.py` | Recovery latch after that abstention. |
| `src/environment/compliant_prelift_env.py` `create_env_from_manifest` | Builds one environment from a manifest. |

There is no existing script whose action schedule stays inside the post-change cone and then reads friction from the sticking observations. That script cannot be written against this contact law, because those observations do not contain friction.

## 8. Baselines without modifying them

`load_hybrid_checkpoint` in `src/integrated/model_training_runner.py` loads B1, B2, or B3 with `torch.load` and `load_state_dict`, then sets `eval()`. `load_b3_ensemble_from_members` loads the five member files. Checkpoints are under `checkpoints/phase3_4/{compliant_prelift,peg_in_hole}/{M0_passive,M4_acmm}/`. Calling `predict_with_uncertainty` or the deterministic `forward` does not require an optimizer step.

The reactive detector is a threshold on `delta_dot_t` or on state channels 16:20. Phase 3.7.3 uses the reason `SLIP_COLLAPSE` on the transition step. That comparison can be computed from logged arrays. It does not require edits to B1–B4 or to `src/safety/geometry_cbf_safety_filter.py`.

Running that comparison would be an execution. This check did not run it. The comparison also cannot answer the pre-slip question: the reactive rule's decision time is the slip sample by definition, and the frozen models do not receive `mu_true`.

## 9. Seed separation

Yes for constant episodes. `scenario_seed` is a pure function of task, stratum, and index. A later protocol can hold out indices without using the production registry. Production seeds at base `3300000`, and the 300 reserve seeds, were not allocated.

## 10. Invalidity

The experiment is scientifically invalid in this simulator for the reason in sections 3 and 4. Additional limits, if the question were changed later:

- Slip has no incipient band. Real tactile precursors are not represented.
- Free-space vertical commands are written into the slip channel.
- Regime A has one transition time and one pair of friction values.
- Sensor noise is applied to force, not to `delta_dot_t`, and the noise is not a function of friction.
- Peg-in-hole has no mid-episode friction step and no four-channel slip velocity.

## Recommendation

**NO-GO.** Do not authorize a pilot that claims safe probing predicts friction-induced slip before the first slip sample. The sticking law gives the probe no friction signal until the slipping step. Fix the methodology, or change the simulator's contact law under a separate authorization, before collecting that evidence. Mass identification while stuck is a different question and is not this gate.
