# HOROS PROBE-1 — Stage 3.0 Dataset Generation Preflight

Status: infrastructure hardened and regression-tested. The 40-episode pilot and the 1,000-episode production set were not generated.

No world-model parameter training, optimizer step, gradient update, or checkpoint modification was performed.

## What changed

- `src/teaching/factory.py`
  - Deterministic stratified sampling for the approved 500 + 500 plan: Prelift 250 nominal / 150 probing / 100 non-stationary, Peg-in-Hole 250 nominal / 150 impacts / 100 wedging.
  - Pilot counts are the proportional prefix 10/6/4 and 10/6/4. Index 0 of a pilot stratum uses the same seed as index 0 of the production stratum.
  - Scenario seed is `3100000 + task_code*10000 + stratum_code*1000 + index`.
  - `SyntheticEpisodeRecord.compute_record_hash()` is versioned `stage3-episode-hash-v2` and covers every stored field except the hash itself, including `next_wrenches`, `rewards`, and teacher provenance.
  - Model-visible observations and privileged simulator ground truth are written as separate artifacts: `{episode_id}.npz` and `{episode_id}.privileged.json`.
- `src/teaching/validator.py`
  - `PhysicsValidationEngine()` with no task limits keeps the historical scalar checks, so existing teaching tests still bind the old envelopes.
  - `PhysicsValidationEngine.for_tasks()` installs task profiles.
  - Prelift acceptance remains a total fingertip-normal cap of 20 N, a per-finger cap of 20 N, a shear cap of 15 N, and a torque cap of 2.0 Nm. Those caps were not raised.
  - Peg-in-Hole acceptance uses the SafetyEvaluator resultant: 35 N force and 7 Nm torque. The simulator crush trip of 40 N / 8 Nm is recorded in the rejection text and is not the acceptance limit.
  - `partition_episodes()` keeps rejected episodes and their reports instead of dropping them.
- `src/teaching/__init__.py` exports the task-limit profiles.
- `tests/test_p38_stage3_preflight.py` covers counts, deterministic stratum coverage, hash coverage, physics rejection, privileged-key exclusion, frozen historical artifact hashes, and a short stratified round trip.
- `scripts/run_stage3_pilot.py` is the Stage 3.1 instrument. It was not executed.

## Executed checks

Canonical repository, `research/PROBE-1/Research-002`:

```text
python -m pytest tests -q --tb=line
246 passed in 33.38s
exit code 0
```

Public mirror, `c:\projects\horos-probe-1\Research-002`, after copying the five Stage 3.0 files:

```text
python -m pytest tests -q --tb=line
246 passed in 31.80s
exit code 0
```

File parity after the copy, SHA-256:

| File | SHA-256 |
| --- | --- |
| `src/teaching/factory.py` | `07608fdf5faccc29264acb7a736750ed0d3e2a2eedef91f2b1fd062bb7aa084a` |
| `src/teaching/validator.py` | `7f7d778f898ffb1e24541a9e891ba9768c85eab0f5a963c2bf6f07f662a490fd` |
| `src/teaching/__init__.py` | `51845e41ad6dc61d5f4faeedabc2b85ad69d16edcaca4e92b7c0192f1c804a7a` |
| `tests/test_p38_stage3_preflight.py` | `cf6b9fd2606b6cd7c070a6103da3eaf96d24da1562221329e834cb9fe155b375` |
| `scripts/run_stage3_pilot.py` | `f0a6efb2a196431e444c103d533e19759d2b7d388dd76a59c668b601f356b8a1` |

The frozen 21-artifact registry imported from `phase37_3_evaluator.py` still matches the files on disk. Historical datasets, baseline checkpoints, Manifest v2.0, CBF v1.0, and B1–B4 were not edited.

## Checks that were not run

- `python scripts/run_stage3_pilot.py` was not executed. No pilot acceptance count, rejection count, or trajectory statistic is claimed.
- The 1,000-episode production generation was not started.

## Known limitations

- Callers that construct `PhysicsValidationEngine()` without `for_tasks()` still follow the historical scalar force path. Stage 3 validation must use `for_tasks()`.
- The factory stores the extracted state and wrench. The raw peg-in-hole observation dictionary still contains friction and clearance inside the simulator; those keys are not copied into the model-visible archive.
- `DeterministicMockTeacher` is unchanged. Its prelift squeeze can remain short of contact. That is a property of the frozen teacher, not a raised physics limit.
- Non-stationary friction changes still come from the existing Regime A / Regime B environment schedule.
- Peg insertion height is still drawn by the environment RNG after the seed is set. Lateral offset and tilt are explicit only on the stratified path.

## Git

Implementation commit, which contains the pipeline, tests, pilot script, and this report before the SHA lines below were added:

- Canonical `horoslab`, branch `feat/probe1-stage3-preflight`: `0196748f4cd6044fe1c035c62f3ff1e95c375d49`
- Public mirror `horos-probe-1`, branch `feat/probe1-stage3-preflight`: `1a62a92ebce3ae42d4d0ab57d34b640a4ac67768`

A follow-up commit on each branch records these SHAs. Unrelated dirty files in the canonical worktree were left unstaged.
