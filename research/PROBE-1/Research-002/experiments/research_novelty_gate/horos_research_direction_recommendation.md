# HOROS PROBE-1 — Research Direction Recommendation

**Document:** Research Novelty Gate, deliverable 6  
**Date:** 2026-11-19  
**Recommendation:** do not implement HCTT, do not generate the registered 1,000 episodes, and do not train. Revise the question and the dataset specification. The highest-ranked direction is a qualification experiment, and even that experiment is not authorized by this note.

The 60-episode active mass result, R² 0.6537, is a force-balance calculation `Fz / g`. It is not evidence that a model learned latent mass. That sentence applies to every direction below.

## 1. Three directions

Scores are qualitative judgements from the papers retrieved and the repository measurements. They are not experimental results.

| Rank | Direction | Scientific novelty | Prior-art overlap | Feasibility in the current simulator | Data now available | Measurable contribution if it succeeds | Reproducibility | Real-world validation required before any external claim |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Safe probe versus passive observation for a silent friction or mass change, scored before the first slip sample, with a linear baseline and frozen B1–B4 | Narrow. The conjunction was not found in the retrieved papers. The pieces around it are occupied | High with ContactGuard, PANDAS, incipient-slip tactile papers, and classical system identification | High. The simulator already sets μ and mass and records slip. The controller and the episode design do not yet implement the probe | Insufficient. Pilot and Phase 3.7 traces can only show that the passive prefix is silent | A yes or no on whether the probe adds pre-slip information | High if seeds, thresholds, and logs are frozen before the test split is read | A simulator pass would still be a simulator result. Hardware would be a later study |
| 2 | Calibrated abstention on the existing reactive slip detector, without claiming pre-slip forecast | Low. Phase 3.7.3 already reports precision 0.9149 at coverage 0.7254, and Phase 3.7.2 already failed the OOD calibration gate | High with SAFE, FAIL-Detect, conformal prediction, and the HOROS trust policy | High | The existing OOD archives and pilot can support a re-analysis | A calibration curve for a detector. Useful engineering, weak research claim | High | Not required to re-analyze logged scores. Required before claiming robot safety |
| 3 | Train a contact world model, including HCTT, on the registered 1,000 episodes | Low. ContactWorld, ViTacWorld, DexTouch-WM, and TouchWorld already study contact world models, with vision and tactile images HOROS does not have | Direct | The model can be coded later. The scientific comparison cannot be hosted by the registered data | The 1,000 episodes do not exist, and the design does not contain the required probe contrast | A lower simulator prediction error would not establish the hypothesis | The training stack is specified and locked, but the label contract still says five modes while the classifier has seven | A simulation loss is not a robot result |

Direction 3 is the one this gate rejects for now.

## 2. Highest-ranked direction

### Research question

Can a safe, action-conditioned probe, which itself produces no slip, identify a friction or mass change that was invisible under passive holding, and can that identification forecast whether a later challenge action will slip, with a score logged before the first slip sample?

### Hypothesis

`[HYPOTHESIS]` On a factorial set of friction and mass values, the active-probe arm will exceed the passive arm by at least 0.10 AUROC, exceed a linear model trained on the same probe traces, and reach friction R² and mass R² of at least 0.60, with expected calibration error at most 0.10. The logged decision will precede `t_slip` as defined by slip `>= 1.0e-4` m/s. The passive arm on a silent change will remain at or below 0.60 AUROC. If the passive arm is already informative, the hypothesis that probing supplies the missing information is rejected.

### Protocol

Use `horos_pre_failure_prediction_experiment_design.md`. Do not add an HCTT arm. Do not use the Stage 3.3B seed registry as the dataset.

### Success

All of the pre-registered inequalities in that protocol hold on a test split that was not used to choose thresholds, and the contamination rate during probing is at most 10%.

### Rejection

Any one of the rejection conditions in that protocol is sufficient. In particular:

- passive observations already predict the silent change
- the probe does not beat the linear baseline
- friction and mass are not separately identified
- the winning decision occurs at or after the first slip sample
- the score is uncalibrated
- the intervention works by refusing almost every challenge
- the quoted mass R² is the T2 `Fz / g` figure rather than the model's estimate at `t_dec`

## 3. Decision against the four branches

1. **Weak novelty.** Applies to HCTT and to any claim of generic pre-failure or contact-world-model novelty. Change that question before spending compute. This gate does so.
2. **Plausible, but the data are insufficient.** Applies to the narrowed probe question. Revise the experiment and the dataset specification. Do not generate the current 1,000 episodes for this purpose.
3. **Feasibility established.** Not met. The protocol is written, and it has not been registered or run.
4. **Train HCTT.** Not met. A linear baseline has to win the comparison first, on data that can falsify it.

## 4. Authorization still required

This note does not authorize implementation, a new seed registry, episode generation, reserve allocation, optimizer updates, or edits to B1–B4, CBF v1.0, Stage 3.0, or the vNext manifest. The next human decision is whether to register the qualification experiment as a separate specification.
