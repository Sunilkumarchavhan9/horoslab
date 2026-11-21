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

Four contract errors from the Stage 3.3A.1 review and five CodeRabbit review items were corrected in `scripts/stage3_production_adapter.py` and the Stage 3.3 specifications. Frozen Stage 3.0 files, the contact-mode enum, B1–B4, and CBF v1.0 were not modified.

| Issue | Source | Resolution |
| :--- | :--- | :--- |
| A. Model-input leakage | Independent Review & CodeRabbit | Training packages carry only model-visible observation arrays. Opaque HMAC-SHA256 filenames (`<sample_id>.npz`) with no seeds, tasks, or episode IDs. Training directory refuses colocated `.privileged.json` or audit manifests. |
| B. Dataloader next-state validation | CodeRabbit Major 4 | `ProductionTrainingDataloader._load_archive()` validates both `(states, wrenches)` and `(next_states, next_wrenches)` with `assert_tensor_channels_clean()`. |
| C. State-depth alignment at JAMMING | CodeRabbit Major 5 | Wedging verification checks same-timestep physical depth alignment: $\lvert z_{\text{telem}}[t] - z_{\text{state}}[t]\rvert < 10^{-3}\text{ mm}$ and $z_{\text{state}}[t] > 5.0\text{ mm}$ for every `ContactMode.JAMMING` step. |
| D. Peg state layout documentation | CodeRabbit Major 2 | Documented both 15-D full physical layout (`pos`, `vel`, `rot`, `wrench`) from `extract_env_state_and_wrench` and 12-D kinematic layout in `stage3_3_dataset_schema.md`. |
| E. Training/Audit tier segregation | CodeRabbit Major 1 & Minor 3 | Formally separated `training/` (`<sample_id>.npz` only) and `audit/` (`.privileged.json` and `.audit.json`) in protocol and storage specs. |
| F. Rim impact | Review & CodeRabbit Minor 1 | Rim collision event $\mathcal{E} = \{t : \text{step\_contact\_stratum}[t] = 1\}$. Impulse $J_{\mathcal{E}} > 10^{-6}\text{ N}\cdot\text{s}$, rising force rate $\dot{F} > 0.01\text{ N/s}$. Added to Section 5.1 of generation protocol. |
| G. `ContactMode.JAMMING` ontology | Review & CodeRabbit Minor 2 | Frozen enum preserved. Renamed test to `test_wedging_alignment_and_jamming_geometric_lock()`. Clarified 7-class ontology and physical criteria for valid vs invalid JAMMING. |
| H. Reserve seeds | Independent Review | Verified formula $3{,}390{,}000 + 10{,}000 \cdot \text{task} + 1{,}000 \cdot \text{stratum} + \text{index}$. All 300 seeds remain `UNALLOCATED_LOCKED`. |

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

Canonical Research-002 suite:

```text
300 passed in 32.83s
```

Mirror Research-002 suite:

```text
300 passed in 31.45s
```

Stage 3.3A.2 and 3.3A.1 contract tests together:

```text
28 passed in 2.14s
```

The new regressions in `tests/test_p42_stage3_3a2_production_gate.py` cover direct identifier leakage, a registry-join attack, a privileged telemetry copy inside a state channel, dataloader refusal of a colocated audit file, dataloader tensor validation of next-state pairs, state-depth misalignment on JAMMING steps, a transform that reinserts `seed`, positive/negative/counterfactual impact cases, valid jamming, invalid jamming, sliding, genuine wedging, all 300 reserve seeds, and replay of all six task/stratum pairs against the serialized audit hash.

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
