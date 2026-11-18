# HOROS PROBE-1 — Research-002
## Stage 3.3A.2 Completion Report: Final Production Gate Hardening

**Program:** HOROS PROBE-1 — Autonomous Robotic Manipulation World Model  
**Phase:** Stage 3.3A.2 — Final Production Gate Hardening  
**Document Identifier:** `HOROS-P1-R002-STAGE3.3A2-COMPLETION-REPORT`  
**Date:** 2026-11-18  
**Branch:** `feat/probe1-stage33-production-readiness`  
**Starting commits:** canonical `8b067a5c`, mirror `d960aac`  
**Status:** **READY FOR INDEPENDENT AUDIT**  
**Production episodes generated:** 0  
**Optimizer updates:** 0  

---

### 1. What changed

Four contract errors from the Stage 3.3A.1 review are corrected in `scripts/stage3_production_adapter.py`. Frozen Stage 3.0 files, the contact-mode enum, B1–B4, and CBF v1.0 were not modified.

| Issue | Resolution |
| :--- | :--- |
| A. Model-input leakage | Training packages no longer carry `seed`, `episode_id`, `provenance_hash`, or raw `rewards`. The sample id is an HMAC under an audit salt. The salt and the seed map stay in the audit record. The dataloader refuses a training directory that also contains the audit manifest, a privileged JSON file, or the seed registry. State channels are checked against the approved widths and rejected if they copy `step_mu_true`, mass, or contact-stratum telemetry. |
| B. Rim impact | Acceptance no longer uses a global force magnitude. The rim event is simulator stratum 1. Impulse and rising rate are computed only on that event. Force ≤ 35 N and torque ≤ 7 N·m are separate gates. |
| C. `ContactMode.JAMMING` | The frozen enum is unchanged: JAMMING is two-point geometric wedging / mechanical lock. A label is accepted during simulator WEDGING only when the same timestep is stratum 3, deeper than 5 mm, and above 15 N lateral force. A label during sliding, or without that lock, is rejected. Wedging without a JAMMING label is still accepted. |
| D. Reserve seeds | The registry already matched `3_390_000 + task_code*10_000 + stratum_code*1_000 + reserve_index`. The 3.3A.1 report listed the wrong ranges. Those ranges are corrected. All 300 seeds remain `UNALLOCATED_LOCKED`. |

### 2. Impact criterion

Peg-in-hole contact in the frozen environment is a penalty force, `Fn = 5000 N/m * penetration`, not a rigid shock. The factory steps at 0.01 s, not the environment class default of 0.02 s. Certified pilot rim contacts (seeds `3124000`–`3124005`) have event impulses of 0.0012–0.0996 N·s. Document 12's 2.0 N·s alternative is unreachable under the 35 N cap at 0.01 s (one step is at most 0.35 N·s) and would reject every certified pilot rim contact. It is not the gate.

The gate is:

- Event set `E = {t : step_contact_stratum[t] = 1}`
- `r(t) = (||F(t)|| - ||F(t-1)||) / 0.01` in N/s, using `||F(-1)|| = 0`
- `J_E = Σ_{t in E} ||F(t)|| * 0.01` in N·s
- Pass the dynamic test only if `E` is non-empty, `J_E > 1e-6 N·s`, and the peak rising rate on `E` is `> 0.01 N/s`
- Those floors are one telemetry quantum (1e-4 N) over one control step
- A force peak outside `E` does not count
- Classifier mode 4 does not replace `E`

### 3. Test evidence

Canonical Research-002 suite, with unrelated dirty pilot files stashed so the run matches the committed pilot artifacts:

```text
298 passed in 31.74s
```

Mirror Research-002 suite, after copying only these gate files into `C:\projects\horos-probe-1\Research-002`:

```text
298 passed in 30.88s
```

Stage 3.3A.2 and 3.3A.1 contract tests together:

```text
26 passed in 2.41s
```

The new regressions are in `tests/test_p42_stage3_3a2_production_gate.py`. They cover direct identifier leakage, a registry-join attack, a privileged telemetry copy inside a state channel, dataloader refusal of a colocated audit file, a transform that reinserts `seed`, positive/negative/counterfactual impact cases, valid jamming, invalid jamming, sliding, genuine wedging, all 300 reserve seeds, and replay of all six task/stratum pairs against the serialized audit hash.

One full-suite run without the stash failed `test_regime_a_slip_is_after_friction_transition` because the working tree already had an uncommitted edit to `stage3_pilot_report.json`. That file was not part of this change. With that edit stashed, the same test passed.

### 4. Reproducibility limits

Bitwise replay is claimed only for the frozen analytical environments, NumPy `RandomState`, and `dt = 0.01` s. It is not a claim about another physics engine or a GPU. Opaque sample ids depend on the audit salt and are not part of the physics hash. Details are in `stage3_3_reproducibility_specification.md`.

### 5. CI and branch protection

`.github/workflows/research-002-tests.yml` runs the Research-002 pytest suite on pull requests and on pushes to `main` and this branch. Required check name: `Research-002 pytest`.

GitHub CLI is not authenticated in this session (`gh auth login` has not been run), so branch protection was not changed and a remote Actions run was not observed. The required protection, once an admin enables it, is: require the `Research-002 pytest` check before merging this branch to `main`. Until that remote setting exists, protection is documented here rather than enabled.

### 6. Invariants

- Production episodes generated: 0
- Pilot episodes regenerated: 0
- Optimizer updates: 0
- Frozen Stage 3.0 paths: unchanged (`git diff` on `src/teaching`, `src/contact_modes`, `src/safety`, and `src/environment` was empty)
- Primary production seed formula: unchanged
- Reserve seeds: still locked
