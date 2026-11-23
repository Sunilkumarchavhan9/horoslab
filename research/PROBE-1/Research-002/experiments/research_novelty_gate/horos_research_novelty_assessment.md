# HOROS PROBE-1 — Research Novelty Assessment

**Document:** Research Novelty Gate, deliverable 3  
**Date:** 2026-11-19  
**Checked commits:** horoslab `94cfa8d788d54490fd50ce8ccab7a71837671cc9`; horos-probe-1 `53bf1ad0ef8baf99ef79b4d65c5de393a9b738c4`. Both match `origin/feat/probe1-stage33-production-readiness`.  
**Decision of this gate:** the broad claim is not novel. The narrowed claim is plausible only as an unrun experiment, and the registered Stage 3.3B dataset cannot host it.

Evidence labels: `[REPO]`, `[PAPER]`, `[ABSTRACT]`, `[VENDOR]`, `[HYPOTHESIS]`, `[UNRESOLVED]`.

## 1. Baseline verification

### 1.1 Frozen models

`[REPO]` Checkpoints under `research/PROBE-1/Research-002/checkpoints/phase3_4/` contain B1, B2, and B3 weights for peg-in-hole and compliant prelift, each under `M0_passive` and `M4_acmm`, including the five B3 members. B1 is `DeterministicWorldModel`, a two-hidden-layer MLP of width 128 that predicts a state residual from the current state and action. B2 is the probabilistic MLP. B3 is an ensemble of five probabilistic MLPs. B4 is the conformal calibration stored beside those runs. Phase 3.7.3 Gate T5 reports zero SHA-256 mismatches on 21 frozen artifacts and zero parameter updates.

`[REPO]` `HybridContactStateModel` does not implement a new dynamics network. It calls the wrapped continuous model and a `ContactModeClassifier`. `TrustAwareWorldModel` holds a frozen base model and emits `TRUST`, `PROBE`, or `ABSTAIN`.

### 1.2 Phase 3.7.3 and 3.7.4, read as measurements

`[REPO]` Phase 3.7.3, manifest `535b6c191e9d26d83a012d95ad96f44519503f16432f645aba9f0fcc6718276a`, overall PASS, training performed false:

| Gate | Result | What it is, and what it is not |
| :--- | :--- | :--- |
| T1 | 0 violations in 90 abstention interventions | A safety-filter check on recorded or safe-hold actions. Not a forecast. |
| T2 | R² 0.6537 and correlation 0.8065 on 60 episodes; passive dwell R² −0.0705 | Mass from a force plateau, `Fz / g`, during an active micro-lift. **Not evidence that a world model learned latent mass.** |
| T3 | Trust precision 0.9149 on 1339 of 1846 transitions, coverage 0.7254 | Decision quality of the policy wrapper on frozen predictions. |
| T4 | Abstention latency 0 steps on seeds 6117–6120 | `TRUST` at step 14, `ABSTAIN` at step 15 with reason `SLIP_COLLAPSE`. This is post-slip detection on the first slipped sample. |
| T5 | 0 hash mismatches | Freeze audit. |

`[REPO]` Phase 3.7.4.2, manifest `70015bcc1b2c70e4e63c0580468c46cdc40723c98efedc246b63f637f55aaf16`, training performed false. On four simulated episodes, recovery succeeds when the simulator restores friction from 0.24 to 0.60, and fails closed when it does not. Recovery starts after the latch. It does not restore the physical property, and it does not act before the slip.

### 1.3 Uncertainty experiments

`[REPO]` Phase 3.7.2:

| Quantity | Measured value | Gate |
| :--- | :--- | :--- |
| Friction R², Task 2, 10-step probe MLP | 0.378 | Locked vNext target is 0.60. Not met. |
| Friction R², peg-in-hole, 10-step MLP | 0.2198 | Not met. |
| Mass R², same passive 10-step MLP | −0.0705 | Passive history does not identify mass. |
| B3 total-std transition AUROC | 0.4811 | Near chance. |
| B3 epistemic-std transition AUROC | 0.5051 | Near chance. |
| Best separate detector, `C3_probe_mlp_L10` | Transition AUROC 0.6497, false-positive rate at 95% recall 0.9225 | Below the 0.85 target. U2 is partial or fail. |
| Regime A before the switch | Not separable from in-distribution | Stated in the Phase 3.7.2 report. |

### 1.4 Data and the untrained specification

`[REPO]` On disk: 6 Phase 3.4 archives, 6 Phase 3.7.2 archives, and 40 certified Stage 3.2.2 pilot episodes. `experiments/stage3_production/` does not exist. The seed registry lists 1,000 production slots and 300 reserve seeds, all reserves marked `UNALLOCATED_LOCKED`. No reserve was allocated in this gate.

`[REPO]` `manifests/horos_world_model_vnext_manifest.json` status is `SPECIFICATION_FROZEN_AWAITING_TRAINING_AUTHORIZATION`, with `training_permitted` 0 and `execution_authorized` 0. The locked spec still scores "all 5 modes" and forbids ground-truth modes in `{0,1,2,3,4}`. Stage 3.2.2 and the Stage 3.3 protocol use seven `ContactMode` classes. That contract conflict is unresolved. It is another reason not to train.

## 2. Candidate question

`[HYPOTHESIS]` Can safe, action-conditioned physical probing identify changing contact properties and forecast manipulation failure before the first observable slip event, with calibrated uncertainty and a safe intervention policy?

## 3. Has this problem already been solved?

**The broad problem has been solved in pieces. The full conjunction has not been shown by the papers retrieved here, and HOROS has not shown it either.**

| Piece | Status |
| :--- | :--- |
| Predict a contact failure before committing to contact | `[PAPER]` ContactGuard does this for gripper closure from RGB and the planned action. Live AUC 0.904–0.966 on four grasp settings. |
| Warn about slip tens of milliseconds ahead | `[ABSTRACT]` PANDAS reports 32 ms lead and 94.6% sensitivity. `[ABSTRACT]` The IROS 2024 GelSight transformer reports prediction up to five frames before labelled onset. These may be incipient-slip detection rather than prediction from a signal-free state. |
| Model future tactile observations under actions | `[PAPER]` ViTacWorld, DexTouch-WM, and TouchWorld. |
| Correct after contact error is felt | `[PAPER]` TouchWorld's residual layer. `[REPO]` HOROS Phase 3.7.4 after `SLIP_COLLAPSE`. |
| Know a friction change that has produced no observation yet | `[REPO]` Phase 3.7.2 says the pre-switch window is not separable. `[HYPOTHESIS]` A passive model cannot know it. No retrieved paper claims otherwise for a silent parameter. |
| Separate friction and mass with a safe probe, then calibrate the pre-slip score | `[UNRESOLVED]` Not in the retrieved papers as a joint result. Not in the HOROS measurements. The T2 mass number is `Fz / g`, not a learned latent. |

## 4. Where active probing can add information

`[HYPOTHESIS]` If friction changes and the contact force remains inside the friction cone, slip is zero both before and after the change. The observation can be identical. A passive classifier then has nothing to use. An action that increases tangential load without crossing the cone can reveal the margin. An action that lifts against gravity without slip can reveal mass from the force balance. Those are two different probes. A single slipping lift confounds them: low friction and high mass can both produce slip.

`[REPO]` The current pilot controller does not run that pair of probes. After two clamp steps it commands a constant 5 mm/s lift. In Regime A the acceptance test requires slip after the friction drop. The experiment therefore records the failure. It does not ask for a prediction made while slip is still zero.

## 5. Overlap that forbids a novelty sentence

Do not write that HOROS would be first to:

- build a contact-aware world model
- predict manipulation failure before contact
- forecast slip from tactile signals
- combine prediction with a reactive correction
- use active excitation to estimate a contact parameter

Each of those has a closer paper in the matrix. A future HOROS claim is allowed only if an experiment isolates the silent-parameter case and beats a simple probe-and-regress baseline, a reactive slip detector, and the frozen B1–B4 scores under a pre-registered rule that rejects any decision contaminated by the first slip sample.

## 6. Gate outcome

| Later decision branch | This gate's assignment |
| :--- | :--- |
| Novelty is weak, so change the question before spending compute | Applies to HCTT, to a generic contact world model, and to generic pre-failure prediction. |
| Novelty is plausible but the data are insufficient | Applies only to the silent-parameter, safe-probe conjunction. |
| Novelty and feasibility are established, so register an experiment and then consider data generation | Not yet. The protocol in the experiment-design note is a proposal, not a registered trial. |
| Implement HCTT after valid data exist | Not authorized. A temporal linear baseline has to come first, and only after a data specification that can falsify the hypothesis. |
