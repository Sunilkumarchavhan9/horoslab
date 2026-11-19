# HOROS PROBE-1 — Competitive Landscape

**Document:** Research Novelty Gate, deliverable 1  
**Date:** 2026-11-19  
**Status:** Qualification only. No implementation, training, or data generation.  
**Evidence labels:** `[PAPER]` retrieved paper text; `[ABSTRACT]` abstract or DOI record only; `[VENDOR]` company page, not a peer-reviewed result; `[REPO]` this repository.

This note places HOROS next to generalist robot systems and contact-specific research. It does not treat their reported success rates as comparable to HOROS metrics.

## 1. What HOROS is, as of the checked commits

`[REPO]` Canonical `Sunilkumarchavhan9/horoslab` and mirror `Sunilkumarchavhan9/horos-probe-1` are both on `feat/probe1-stage33-production-readiness`.

| Repository | Remote head checked against `origin` |
| :--- | :--- |
| horoslab | `94cfa8d788d54490fd50ce8ccab7a71837671cc9` |
| horos-probe-1 | `53bf1ad0ef8baf99ef79b4d65c5de393a9b738c4` |

`[REPO]` The executed world models are frozen Phase 3.4 single-step MLPs: B1 deterministic, B2 probabilistic, B3 five-member ensemble, B4 conformal calibration. `HybridContactStateModel` wraps one of those models with a contact-mode classifier. `TrustAwareWorldModel` is a `TRUST` / `PROBE` / `ABSTAIN` policy over the frozen models. Phase 3.7.4 adds a recovery latch. The History-Conditioned Temporal Transformer (HCTT) is a locked specification with `training_permitted: 0`. No HCTT module or checkpoint exists. The modality contract is proprioceptive and contact-wrench simulation, not vision and not a camera-based tactile image.

HOROS is therefore not in the same product category as a vision-language-action foundation model, and it has not demonstrated a trained contact world model beyond the frozen baselines.

## 2. Generalist robot systems

These systems solve broad task execution. None of the sources below is evidence that they identify latent friction and mass, or that they forecast slip before the first observable slip sample, under a calibrated abstention rule.

| System | Source and date | What the source actually states | Evidence class | Relevance to the candidate HOROS question |
| :--- | :--- | :--- | :--- | :--- |
| NVIDIA Isaac GR00T N1.7 | Hugging Face blog, 17 April 2026. https://huggingface.co/blog/nvidia/gr00t-n1-7 | 3B-parameter open vision-language-action model. Cosmos-Reason2-2B plus a 32-layer diffusion transformer. Inputs are RGB, language, and proprioception. | `[VENDOR]` | Different problem: general humanoid action generation. No contact-parameter identification result was retrieved. |
| Google DeepMind Gemini Robotics 2.5 | DeepMind blog. https://deepmind.google/blog/gemini-robotics-2-5-accelerates-real-world-physical-intelligence/ | Company reports a Mercedes-Benz / Apptronik Apollo 2 pick-and-pack proof of concept at 96% success, plus higher success and faster completion than its previous baselines on internal evaluations. The page says the model was evaluated across a broad task range; this gate did not independently reproduce a "200+ tasks" table. | `[VENDOR]` | A task-success claim for a VLA. It is not a pre-slip forecasting or friction-identification result. |
| Figure Helix 2.5 | Figure news, retrieved as the 30-home post. https://www.figure.ai/news/helix-2-5-zero-shot-30-home-generalization | Company reports three whole-body behaviors in 30 previously unseen homes. Index pretraining raised zero-shot full-task success from 9% to 56% in their blind evaluation. No partial credit. | `[VENDOR]` | Generalization across homes, not contact-property identification. |
| Skild S1 | NVIDIA blog on Skild S1. https://blogs.nvidia.com/blog/skild-ai-s1-physical-ai/ | Company and NVIDIA describe one-video in-context learning without weight updates. Skild's reported per-step success on new multistep tasks is about 66%, against 9% for a comparison system. A separate September 2026 note, cited by a secondary survey, describes simulated self-play. | `[VENDOR]` | Video-conditioned task learning. Not a measured pre-slip physical probe. |
| Physical Intelligence π | Embodied Wire survey, 28 September 2026, citing company releases. https://embodiedwire.com/robot-foundation-models-compared | Open weights exist for π0, π0-FAST, and π0.5. π0.7 was announced 16 April 2026 without public weights. | `[VENDOR]` secondary survey | A VLA family. This gate did not retrieve a π paper that answers the HOROS probing question. |

## 3. Contact-specific research that blocks a broad novelty claim

The methods in `horos_contact_world_model_prior_art_matrix.md` already cover:

- vision-tactile world models for contact-rich tasks
- action-conditioned rollout generation
- human-touch supervision of tactile dynamics
- predictive tactile goals plus reactive correction
- aborting a risky action before contact, using an action-conditioned latent forecast
- millisecond-scale slip-risk warning from tactile sensing

`[REPO]` HOROS's own memo `research/PROBE-1/14-existing-research-and-prior-art.md` (31 October 2026) already marks isolated incipient-slip prediction as solved by PANDAS and by the IROS 2024 GelSight Video Vision Transformer result. That internal conclusion still holds after this literature pass.

## 4. Consequence for positioning

A defensible HOROS statement cannot be "we built a contact-aware world model" or "we predict manipulation failure before it happens." Both claims are already occupied.

The only candidate that remains worth qualifying is narrower: whether a **safe physical probe**, chosen as an action, reveals a hidden friction or mass change **before any slip sample exists**, and whether the resulting prediction is calibrated. That candidate is a hypothesis. Section 4 of the novelty assessment records where it overlaps existing work and where this repository has not tested it.
