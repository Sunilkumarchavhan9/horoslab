# HOROS PROBE-1 — Research-002
# Training Readiness Assessment: HOROS World Model vNext

**Date:** November 13, 2026  
**Status:** Readiness Assessment — Training NOT Authorized (Pre-Training Audit)  
**Author:** Antigravity AI Assistant & HOROS Engineering Governance  
**Scope:** Training Readiness for `HOROS-WM-vNext` (Proprioceptive-Tactile Foundation)  
**Governing Rule:** Await explicit user authorization before initiating any student model training.

---

## 1. Executive Summary

This report evaluates the readiness of the HOROS research platform to transition from single-step baseline world models ($B1$–$B4$) to the history-conditioned foundation model (`HOROS-WM-vNext`).

**Overall Assessment:** **NOT READY FOR IMMEDIATE TRAINING.**  
While the architectural specification and data contracts are complete and validated, three prerequisite engineering layers must be implemented and tested first:
1. Implementation of the **Model Teaching Infrastructure** (Modules 01–06).
2. Synthetic generation and validation of **active contact-mining and probing trajectories**.
3. Offline calibration and formal sign-off on the **Phase 3.7.3 Trust-Aware World Model**.

---

## 2. Readiness Scorecard: What Is Ready vs Incomplete

| Component / Layer | Status | Read-Only Audit & Verification | Missing Dependencies |
| :--- | :---: | :--- | :--- |
| **Research Specifications** | **READY** | `phase37_3_experimental_specification.md` and `horos_world_model_vnext_spec.md` complete and reviewed. | None. |
| **Anti-Leakage Data Contracts** | **READY** | Non-privileged inputs ($s, a, w, \hat{p}(m)$) defined; ground-truth simulator modes barred. | None. |
| **Historical Datasets** | **READY** | 12 existing archives (21,981 transitions) validated and checksummed. | None for proprioception. |
| **Teacher Model Registry** | **INCOMPLETE** | Registry schema specified; no physical teacher models registered or credentialed. | Registry implementation & API setup. |
| **Teacher Inference Engine** | **INCOMPLETE** | Architecture specified; async batching and schema normalization unbuilt. | Code implementation & integration. |
| **Physics Validation Engine** | **INCOMPLETE** | Validation rules (kinematics, friction cone, penetration) defined; simulator hooks unbuilt. | MuJoCo / PyBullet validator script. |
| **Synthetic Experience Factory** | **INCOMPLETE** | Randomization distributions specified; automated batch synthesis pipeline unbuilt. | Experience generation runner. |
| **Visual / Video Modality** | **INCOMPLETE** | 100% absent from existing data. | Synthetic camera rendering pipeline. |
| **Phase 3.7.3 Verification** | **INCOMPLETE** | Specification frozen; active probing experiment unexecuted. | Experimental execution authorization. |

---

## 3. Dataset Audit & Utilization Matrix

### 3.1 Datasets Immediately Ready for Use (Proprioceptive-Tactile)
The following 12 datasets in `datasets/phase3_4/` and `datasets/phase3_7_2/` are verified and loadable for proprioceptive-tactile dynamics training:

| Dataset Identifier | Task | Transitions | Role in vNext Training |
| :--- | :--- | :---: | :--- |
| `compliant_prelift_calibration.npz` | Prelift | 1,874 | Pre-training baseline dynamics |
| `compliant_prelift_M0_passive.npz` | Prelift | 3,000 | Passive trajectory regularization |
| `compliant_prelift_M4_acmm.npz` | Prelift | 1,190 | Active contact mining dynamics |
| `peg_in_hole_calibration.npz` | Peg-in-Hole | 1,630 | Baseline insertion dynamics |
| `peg_in_hole_M0_passive.npz` | Peg-in-Hole | 2,311 | Free-space approach dynamics |
| `peg_in_hole_M4_acmm.npz` | Peg-in-Hole | 1,532 | Contact boundary dynamics |
| `p37_2_calib_task2_id.npz` | Prelift | 1,887 | In-distribution contact calibration |
| `p37_2_calib_task2_ood.npz` | Prelift | 2,369 | Out-of-distribution friction/mass training |
| `p37_2_calib_pih.npz` | Peg-in-Hole | 1,802 | Frozen calibration split |
| `p37_2_val_task2_id.npz` | Prelift | 1,846 | Held-out validation split (`seeds 9200..9259`) |
| `p37_2_val_task2_ood.npz` | Prelift | 2,219 | Held-out OOD validation split (`seeds 9260..9319`) |
| `p37_2_val_pih.npz` | Peg-in-Hole | 1,133 | Held-out Task 1 validation (`seeds 9320..9359`) |

**Total Available Data:** 21,981 transitions across 700 episodes.

### 3.2 Additional Data That Must Be Synthesized
To train `HOROS-WM-vNext` effectively, two targeted dataset expansions are required:
1. **Force-Gated Probing Dataset:** $\approx 100$ episodes exhibiting the newly validated micro-lift profile ($v_z = 5\text{ mm/s}$, $\Delta z = 1.0\text{ mm}$, plateau identification) across diverse masses ($m \in [0.1, 2.5]\text{ kg}$). This is required to train the Auxiliary System ID Head ($\hat{m}_{\text{obj}}$).
2. **Dynamic Boundary Oversampling:** Rare contact transitions (`FirstContact` mode has only 21 transitions in validation) must be augmented by synthesizing 2,000 additional boundary impact events.

---

## 4. Required Teacher Capabilities & Compute Resources

### 4.1 Teacher Model Requirements
The Model Teaching Infrastructure requires two distinct teacher capabilities:
1. **Geometric & Affordance Teacher (External VLM / API):**
   - Capability: High-level subgoal proposals and approach vector generation.
   - Candidate: Gemini 1.5 Pro / Flash or specialized robotics VLA models via clean REST API.
   - Role: Auxiliary candidate trajectory proposal.
2. **Physical Expert Teachers (Internal Frozen Checkpoints):**
   - Capability: High-precision contact classification.
   - Models: Frozen $B3$ ACMM model heads and Phase 3.5.2 geometry controllers.

### 4.2 Compute & Memory Budget
For training the History-Conditioned Temporal Transformer (HCTT):
- **Model Parameters:** $\approx 4.8\text{M}$ parameters ($d_{\text{model}} = 256$, 6 layers, 8 heads).
- **Batch Size:** 32 sequence chunks (each chunk = 10 historical steps + 20 future steps = 30 tokens).
- **Training Steps:** 50,000 gradient steps with AdamW ($\text{lr} = 3 \times 10^{-4}$, cosine decay).
- **Compute Hardware:** 1 $\times$ NVIDIA RTX 4090 / A100 GPU (or equivalent local GPU).
- **Estimated Training Time:** $\approx 45\text{--}60\text{ minutes}$ on a single GPU (or $\approx 4.5\text{ hours}$ on 12-core CPU).
- **Memory Footprint:** $< 4.0\text{ GB}$ VRAM.

---

## 5. Strict Gate Criteria Required Before Training Authorization

Before any training script is executed, the following milestones must be achieved:

```
[ ] Milestone 1: Implementation of Teacher Model Registry & Inference Engine
[ ] Milestone 2: Implementation & Unit Testing of Physics Validation Engine (Firewall)
[ ] Milestone 3: Generation of 100 Force-Gated Active Probing Calibration Trajectories
[ ] Milestone 4: Execution & Adjudication of Phase 3.7.3 Trust-Aware Architecture
[ ] Milestone 5: Submission of Formal Training Authorization Request
```

### Governance Invariants
- Zero modification to Phase 3.4 $B1$–$B4$ checkpoints.
- Zero modification to `GeometryAwareCBFSafetyFilter v1.0`.
- Zero simulator ground-truth leakage into model inference inputs.
- Phase 3.7.3 experiments and vNext training must remain isolated in separate directories and manifests.
