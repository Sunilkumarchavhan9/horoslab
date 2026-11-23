# P4-T1 Single-Contact Partial-Slip Trajectory Contract

**Status:** Implementation contract for an offline writer. This document does not authorize Stage 3.3B, reserve-seed allocation, or HCTT training.

## Purpose

Record action-conditioned trajectories from the frozen Contact Physics v2 kernel so a later evaluator can measure tangential stiffness from the samples themselves. The writer calls the kernel. It does not copy its equations.

## Reused interfaces

| Call | Role |
|---|---|
| `NormalContactModel.compute_indentation_from_force` | Constant normal load, indentation, and contact radius at the initial condition |
| `CattaneoMindlinModel` | Partial-slip state advanced inside the synchronized step |
| `LuGreModel.step_hybrid_synchronized` | One hybrid step. Returns `(total_Ft, v_applied)` |
| `ContactState` | Separate Cattaneo–Mindlin and LuGre records |
| `SphericalContact` | Fixture geometry |
| `FlatPunchContact` with `corner_radius > 0` | Domain-rejection geometry |
| `create_silicone_aluminum_pair` | Silicone 30A on aluminum 6061 |

Provenance follows the prefix-and-excluded-self-hash pattern of `SyntheticEpisodeRecord.compute_record_hash` in `Research-002/src/teaching/factory.py`. The Stage 3 field list is not reused. File separation follows `stage3_production_adapter.py`: the model-visible NPZ and the privileged JSON are different artifacts.

## Action and observation

The action is `commanded_velocity`, the tangential velocity command in metres per second.

`step_hybrid_synchronized` may clamp that command to `v_passive(Fn)`. The clamped value is `applied_velocity`. It is stored in the privileged sidecar because the observable schema has exactly five columns and the action column must remain the command.

Observable columns, in order:

1. `commanded_velocity` (m/s)
2. `normal_force` (N)
3. `tangential_force` (N), the hybrid `total_Ft`
4. `tangential_displacement` (m), from the Cattaneo–Mindlin state
5. `slip_speed` (m/s), `CattaneoMindlin` `state.slip_velocity` after the step

`slip_speed` during partial slip is the kernel's annular speed `(1 - c/a) * v_applied`. The LuGre bristle deflection is not copied into this column.

## Privileged sidecar

`*.privileged.json` holds `mu_static`, `mu_kinetic`, `stick_radius`, `bristle_state` (the bristle deflection series), regime labels, `applied_velocity`, the gross-slip index, and the kernel source hashes. Its SHA-256 is computed with `privileged_sha256` and `episode_sha256` excluded, then both digests are stored. The observable SHA-256 is inside the sidecar so the two files refer to each other.

## Domain flag

`LuGreModel.step_composed_hybrid(..., require_valid_domain=True)` raises `ValueError` on spherical gross slip and on a rounded punch at any stick ratio. A trajectory that must contain the gross-slip sample therefore uses `require_valid_domain=False`, which the kernel already supports. The rejection test uses a rounded punch with `require_valid_domain=True`. On that `ValueError` the writer deletes the destination NPZ, the sidecar, and any `.partial` file.

## Stiffness criterion

For a strictly increasing tangential displacement at constant normal force:

```text
K_t[i] = abs( (F_t[i+1] - F_t[i]) / (delta_t[i+1] - delta_t[i]) )
```

Intervals that end on or after the first gross-slip sample are excluded. The remaining series must contain at least 30 samples, the median of the last 30 percent must be below 80 percent of the median of the first 20 percent, and the least-squares slope must be negative.

This comparison reads recorded force and displacement only. It does not read stick radius and it does not call `verify_energy_passivity`.

A negative control holds `K_t` constant and then cuts the force in one sample. That series fails the criterion.

## Provenance

Each episode stores the SHA-256 of the kernel bytes that were imported, and a comparison against `Research-002/experiments/contact_physics_v2/reports/source_hash_manifest.txt`.

On this working tree the comparison is not an exact match. `contact/cattaneo_mindlin.py` is committed as `68a6a2f4a7efe642252dfb88199df795e2d84be87cc3f53f86f5e8b03a5a9c19`. The manifest still lists `a7fe0d6eba427be03fe77ab2229984cf671a01c1bcee89515a1f5efe7a4f15f7`. Seven files under `contact_physics_v2/tests/` match the manifest only after CRLF bytes are rewritten to LF. `contact/lugre.py` and the other `contact/` modules match the manifest as raw bytes. This package does not edit those files or the manifest.

## Seeds

Fixture seeds are `4100101`, `4100102`, and `4100103`. The writer refuses any seed inside the production interval `3300000–3325999`, the reserve interval `3390000–3415999`, the pilot span `3111000–3125003`, Phase 3.7.2 seeds `9000–9359`, the S4 band `9500000–9509999`, or any seed integer stored in `stage3_3_seed_registry.json`. The registry file is opened read-only.

## What this contract does not establish

One spherical contact is not a four-finger grasp. The hybrid finite-difference stiffness is not monotone at very small commanded speeds; the fixtures use commands that still sit under the passivity limit and that do show a net drop. Real fingertip radius, fillet, and thickness are not measured here. Hardware curves are not attached. Passing this contract does not unlock Stage 3.3B or the Hierarchical Contact Transformer.
