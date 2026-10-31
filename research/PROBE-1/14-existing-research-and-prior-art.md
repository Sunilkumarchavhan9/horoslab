# PROBE-1 Prior-Art Mapping, Research Gap Verification, and Novelty Stress Test
**HOROS First-Party Model Program: Physical Humanoid Foundation Architecture**  
**Document ID:** HOROS-PROBE1-14-PRIOR-ART-VERIFICATION  
**Creation Date:** October 31, 2026  
**Status:** Canonical Prior-Art Benchmark & Novelty Stress Test  
**Parent Documents:** 
* [`research/PROBE-1/12-real-world-problem-discovery.md`](file:///c:/projects/MemoryOS/research/PROBE-1/12-real-world-problem-discovery.md)
* [`research/PROBE-1/13-existing-models-and-methods-evaluation.md`](file:///c:/projects/MemoryOS/research/PROBE-1/13-existing-models-and-methods-evaluation.md)

---

## Executive Summary & Stress Test Mandate

The primary purpose of this document is to conduct an aggressive, skeptical **novelty stress test** on the research directions proposed for HOROS PROBE-1. 

A thorough examination of the recent literature (2024–2026) reveals that multiple research laboratories have already demonstrated tactile slip prediction, online friction estimation, dynamic payload adaptation, and tactile integration into Vision-Language-Action (VLA) foundation models. Consequently, HOROS cannot claim novelty based on broad, generic assertions such as "adding tactile sensing to a VLA" or "predicting slip before it occurs."

This document systematically maps the exact empirical and theoretical boundary of existing published research. It decomposes the proposed Track 1 research question into individual testable claims, cross-references them against leading prior art, and identifies the precise unresolved scientific limitations that can form a defensible, peer-reviewed scientific contribution.

---

## 14.1 Decomposing the Proposed Research Question into Individual Scientific Claims

In [`13-existing-models-and-methods-evaluation.md`](file:///c:/projects/MemoryOS/research/PROBE-1/13-existing-models-and-methods-evaluation.md), the candidate research question for Track 1 was formulated as:

> *"Can an embodied robot predict continuous changes in contact stability from high-frequency tactile shear and proprioceptive dynamics, and execute safe, closed-loop grip adaptation under previously unseen object geometries, surface friction variations, and dynamic payload shifts during the execution of general manipulation tasks?"*

To evaluate whether this question contains a genuine research gap, we decompose it into five distinct scientific claims:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   DECOMPOSITION OF CANDIDATE RESEARCH CLAIMS                                │
├───────┬───────────────────────────────────┬─────────────────────────────────────────────────────────────────┤
│ Claim │ Scientific Assertion              │ Specific Operational Capability                                 │
├───────┼───────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ C1    │ Predictive Contact Instability    │ Predicting incipient slip and stability transitions from        │
│       │ Sensing                           │ optical tactile elastomer shear before macro-slip occurs.       │
├───────┼───────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ C2    │ Dynamic Payload & Center-of-Mass  │ Estimating and compensating for moving liquid slosh, mass shifts│
│       │ Compensation                      │ and shifting centers of mass purely from touch and joint states.│
├───────┼───────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ C3    │ Synchronized Online Friction      │ Estimating Coulomb friction coefficients dynamically to track   │
│       │ Estimation & Gentle Grasping      │ the safe grasping margin without crushing delicate objects.     │
├───────┼───────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ C4    │ Multi-Rate Dual-Stream VLA        │ Coordinating a slow semantic reasoning trunk (5–10 Hz) with     │
│       │ Coordination                      │ a high-frequency reactive tactile control stream (50–200 Hz).   │
├───────┼───────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ C5    │ Joint Nonstationary Physical      │ Simultaneously handling unknown friction, shifting mass, and    │
│       │ Generalization                    │ external dynamic disturbances within an end-to-end task.        │
└───────┴───────────────────────────────────┴─────────────────────────────────────────────────────────────────┘
```

---

## 14.2 Mapping Existing Tactile Sensing, Slip Prediction, and Grip-Force Control Methods

We examine the foundational literature on tactile sensing, slip detection, and classical adaptive grip control:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               PRIOR ART: PREDICTIVE SLIP & DYNAMIC GRASP CONTROL                            │
├────────────────────┬──────────────┬───────────────┬──────────────┬──────────────────┬───────────────────────┤
│ Method / Paper     │ Venue & Year │ Sensor Type   │ Prediction   │ Demonstrated     │ Key Limitations       │
│                    │              │               │ Lead Time    │ Accuracy         │                       │
├────────────────────┼──────────────┼───────────────┼──────────────┼──────────────────┼───────────────────────┤
│ GelSight Shear     │ ICRA 2015 /  │ GelSight      │ Zero lead    │ Marker tracking  │ Classical PD reflex;  │
│ (Yuan et al.)      │ Sensors 2017 │ Elastomer     │ (Post-slip)  │ on parallel jaws │ no learned dynamics.  │
├────────────────────┼──────────────┼───────────────┼──────────────┼──────────────────┼───────────────────────┤
│ ViViT Incipient    │ IROS 2024    │ GelSight Mini │ Up to 5      │ 99.0% on 10      │ Binary classification;│
│ Slip (SINTEF/MIT)  │ [DOI below]  │ Video         │ frames lead  │ unseen objects   │ no closed-loop grip   │
│                    │              │               │ (~83 ms)     │                  │ adaptation policy.    │
├────────────────────┼──────────────┼───────────────┼──────────────┼──────────────────┼───────────────────────┤
│ PANDAS             │ IROS 2025    │ Multi-view RGB│ 32 ms early  │ 94.6% slip       │ Parallel-jaw gripper; │
│ (Yan et al.)       │ [DOI below]  │ + GelSight    │ warning lead │ sensitivity;     │ tabletop drop trials; │
│                    │              │               │              │ 28 ms response   │ isolated task.        │
├────────────────────┼──────────────┼───────────────┼──────────────┼──────────────────┼───────────────────────┤
│ Grasp Stability    │ Sensors 2024 │ Tactile array │ Continuous   │ 98.90% state     │ CNN-LSTM classifier;  │
│ Transitions (Zhao) │ (PMC/MDPI)   │ images        │ transition   │ transition acc.  │ offline evaluation on │
│                    │              │               │ detection    │ (changing mass)  │ recorded datasets.    │
└────────────────────┴──────────────┴───────────────┴──────────────┴──────────────────┴───────────────────────┘
```
* **SINTEF / MIT (IROS 2024):** Parag et al., *"Learning incipient slip with GelSight sensors: Attention Classification with Video Vision Transformers"*, [DOI:10.1109/IROS58592.2024.10802058](https://doi.org/10.1109/IROS58592.2024.10802058).
* **PANDAS (IROS 2025):** Yan et al., *"PANDAS: Prediction and Detection of Accurate Slippage"*, [DOI:10.1109/IROS60139.2025.11246395](https://doi.org/10.1109/IROS60139.2025.11246395).
* **Zhao et al. (Sensors 2024):** *"Detecting Transitions from Stability to Instability in Robotic Grasping Based on Tactile Perception"*, [PMC11358941](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11358941/).

### Assessment of Claim C1 (Predictive Contact Instability)
* **Status:** **ALREADY SOLVED IN ISOLATION.** Both PANDAS (32 ms lead time, 94.6% sensitivity) and SINTEF (5 frames lead time, 99% accuracy) have established predictive slip sensing on unseen objects. Proposing incipient slip detection in isolation is unoriginal.

---

## 14.3 Mapping Tactile-VLA and Vision-Tactile-Language-Action Foundation Models

We map generalist Vision-Language-Action (VLA) foundation models incorporating tactile sensing:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PRIOR ART: TACTILE-VLA FOUNDATION MODELS                                  │
├────────────────────┬──────────────┬───────────────┬──────────────┬──────────────────┬───────────────────────┤
│ Model / System     │ Venue & Year │ Tactile Input │ Action Space │ Reported Gain /  │ Licensing & Code      │
│                    │              │ Formulation   │ & Rate       │ Performance      │ Release Status        │
├────────────────────┼──────────────┼───────────────┼──────────────┼──────────────────┼───────────────────────┤
│ VLA-Touch          │ RA-L 2026    │ Pretrained    │ Residual     │ Demonstrated on  │ Open Weights & Code;  │
│ (Bi et al.)        │ [2507.17294] │ Tactile-LLM + │ Diffusion    │ peg insertion,   │ arXiv:2507.17294      │
│                    │              │ DIGIT patches │ Policy 50 Hz │ wiping, grasping │                       │
├────────────────────┼──────────────┼───────────────┼──────────────┼──────────────────┼───────────────────────┤
│ AT-VLA             │ CVPR 2026    │ Adaptive      │ Dual-stream  │ 40 ms reaction;  │ Open Code & Checkpts; │
│ (Li et al.)        │ [2605.07308] │ Tactile       │ fast tactile │ contact-rich     │ arXiv:2605.07308      │
│                    │              │ Injection     │ loop (25 Hz) │ manipulation     │                       │
├────────────────────┼──────────────┼───────────────┼──────────────┼──────────────────┼───────────────────────┤
│ VTLA               │ 2025         │ Visual-Tactile│ Preference   │ Insertion tasks; │ Open Code;            │
│ (arXiv:2505.09577) │              │ Embeddings    │ RL Policy    │ sim-to-real      │ arXiv:2505.09577      │
├────────────────────┼──────────────┼───────────────┼──────────────┼──────────────────┼───────────────────────┤
│ N₀-VTLA            │ July 2026    │ Latent        │ Diffusion    │ Pretrained on    │ Open Benchmark;       │
│ (NeoteAI/Fudan)    │ [2607.23782] │ Tactile Tokens│ Action Expert│ NeoData; real    │ arXiv:2607.23782      │
│                    │              │ (Predictive)  │ (100 Hz)     │ robot evaluated  │                       │
├────────────────────┼──────────────┼───────────────┼──────────────┼──────────────────┼───────────────────────┤
│ TacClaw-Infinity   │ October 2026 │ Optical UMI   │ Flow-matching│ π0.5 success:    │ Data Open             │
│ (Daimon Robotics)  │ [2610.20320] │ TacClaw claws │ π0.5 / StarVLA│ 50% -> 74%       │ (CC BY-NC-SA 4.0);    │
│                    │              │ (10k hours)   │ (50 Hz)      │ across 3 robots  │ Code Forthcoming      │
├────────────────────┼──────────────┼───────────────┼──────────────┼──────────────────┼───────────────────────┤
│ Figure Helix 02    │ Jan 2026     │ 3-gram sens.  │ System 1 VLA │ Commercial       │ Proprietary & Closed  │
│ (Figure AI)        │ Announcement │ fingertip touch│ 200 Hz; S0   │ autonomous       │ (Non-reproducible)    │
│                    │              │ + palm cameras│ 1 kHz RL     │ household tasks  │                       │
└────────────────────┴──────────────┴───────────────┴──────────────┴──────────────────┴───────────────────────┘
```

### Assessment of Claim C4 (Multi-Rate Dual-Stream VLA Coordination)
* **Status:** **PARTIALLY SOLVED.** Both AT-VLA (CVPR 2026, 40 ms reaction stream) and $N_0$-VTLA (July 2026, latent predictive tactile tokens) explicitly decouple slow VLM semantics from fast tactile action refinement. 
* Proposing a "dual-frequency architecture connecting a VLA to a tactile encoder" has already been demonstrated. HOROS must differentiate on **what the fast stream computes** (e.g., continuous Lyapunov/barrier stability guarantees vs. unconstrained diffusion steps).

---

## 14.4 Investigating Dynamic Friction, Payload, Center-of-Mass, and External Disturbances

We examine prior art explicitly addressing changing physical dynamics during manipulation:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               PRIOR ART: DYNAMIC FORCES, FRICTION & PAYLOAD ADAPTATION                      │
├────────────────────┬──────────────┬───────────────┬──────────────┬──────────────────┬───────────────────────┤
│ Paper / System     │ Venue & Year │ Sensor Type   │ Dynamic      │ Controlled       │ Experimental          │
│                    │              │               │ Perturbation │ Variable         │ Platform              │
├────────────────────┼──────────────┼───────────────┼──────────────┼──────────────────┼───────────────────────┤
│ Shear-Based Grasp  │ IEEE T-RO    │ Biomimetic    │ Moving liquid│ Normal & shear   │ Pisa/IIT SoftHand     │
│ Control (Ford et al│ 2025         │ microTac      │ mass; weight │ force tracking   │ (Underactuated        │
│ [DOI below]        │              │ arrays        │ transitions  │ on 5 fingers     │ Anthropomorphic)      │
├────────────────────┼──────────────┼───────────────┼──────────────┼──────────────────┼───────────────────────┤
│ Tracing Energy Flow│ IEEE RA-L    │ Tactile array │ Dynamic mass │ Virtual energy   │ Multi-finger Hand;    │
│ (Kuo et al.)       │ Feb 2026     │ power         │ variations & │ container force  │ Hardware & Sim        │
│                    │              │ monitoring    │ unknown props│ optimization     │ Experiments           │
├────────────────────┼──────────────┼───────────────┼──────────────┼──────────────────┼───────────────────────┤
│ Online Friction    │ arXiv 2026   │ Vision-based  │ Unknown and  │ Particle-filter  │ Parallel Jaw Gripper; │
│ Estimation (Niu)   │ [2602.02026] │ tactile sensor│ changing     │ friction adapt.; │ gentle grasp bench.   │
│                    │              │               │ friction     │ grip force       │                       │
├────────────────────┼──────────────┼───────────────┼──────────────┼──────────────────┼───────────────────────┤
│ Transitions to     │ Sensors 2024 │ High-res      │ Adding water/│ Grasp stability  │ Parallel Jaw Gripper; │
│ Instability (Zhao) │ (PMC)        │ tactile image │ weight during│ classification   │ dynamic pouring.      │
│                    │              │               │ manipulation │ (98.90%)         │                       │
└────────────────────┴──────────────┴───────────────┴──────────────┴──────────────────┴───────────────────────┘
```
* **Shear-Based Grasp Control (IEEE T-RO 2025):** Ford et al., *"Shear-Based Grasp Control for Multifingered Underactuated Tactile Robotic Hands"*, [IEEE T-RO Vol. 41, pp. 3113–3128, 2025](https://doi.org/10.1109/TRO.2025.3563046).
* **Tracing Energy Flow (IEEE RA-L 2026):** Kuo et al., *"Tracing Energy Flow: Learning Tactile-Based Grasping Force Control to Reduce Slippage in Dynamic Object Interaction"*, [IEEE RA-L Vol. 11, no. 2, 2026](https://doi.org/10.1109/LRA.2025.3524670).
* **Synchronized Online Friction Estimation (arXiv 2026):** Niu et al., *"Synchronized Online Friction Estimation and Adaptive Grasp Control for Robust Gentle Grasp"*, [arXiv:2602.02026](https://arxiv.org/abs/2602.02026).

### Assessment of Claims C2 & C3 (Payload Adaptation & Online Friction)
* **Status:** **INDIVIDUALLY DEMONSTRATED.**
  * Dynamic mass changes and shifting liquid payloads have been studied by Zhao et al. (2024) and Ford et al. (IEEE T-RO 2025).
  * Online friction estimation coupled to adaptive grip control has been studied by Niu et al. (2026).
  * Force optimization under unknown object properties has been studied by Kuo et al. (IEEE RA-L 2026).

---

## 14.5 Comparing Humanoid, Anthropomorphic Hand, and Parallel-Gripper Experiments

A critical finding from literature analysis is the **embodiment divide**:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   EMBODIMENT & MANIPULATION COMPLEXITY DIVIDE                               │
├────────────────────┬─────────────────────────────┬───────────────────────────┬──────────────────────────────┤
│ Embodiment Class   │ Representative Systems      │ Degrees of Freedom        │ Physical Coupling Dynamics   │
├────────────────────┼─────────────────────────────┼───────────────────────────┼──────────────────────────────┤
│ Parallel Jaws      │ PANDAS, SINTEF, Niu et al., │ 1 DoF grip;               │ Decoupled from robot base;   │
│ (1-DoF Grippers)   │ Zhao et al., VLA-Touch      │ static arm mount          │ 1D normal force regulation.  │
├────────────────────┼─────────────────────────────┼───────────────────────────┼──────────────────────────────┤
│ Multi-Fingered     │ Ford et al. (Pisa/IIT),     │ 5–16 DoF hand;            │ Multi-contact force balance; │
│ Anthropomorphic    │ Tracing Energy Flow         │ fixed wrist mount         │ torsional slip & rolling.    │
├────────────────────┼─────────────────────────────┼───────────────────────────┼──────────────────────────────┤
│ Full Humanoid      │ WT-UMI, Figure Helix 02,    │ 23–29 DoF full body;      │ Whole-body momentum coupling;│
│ Loco-Manipulation  │ HULK, Workhorse             │ floating bipedal base     │ bipedal balance vs arm force.│
└────────────────────┴─────────────────────────────┴───────────────────────────┴──────────────────────────────┤
```
* **WT-UMI (Jang et al., Georgia Tech, 2026):** *"WT-UMI: Tactile-based Whole-Body Manipulation via Force-Supervised Contact-Aware Planning"*, [arXiv:2606.01234](https://arxiv.org/abs/2606.01234). Introduces a wearable whole-body tactile interface enabling humanoids to execute contact-aware tasks with force supervision.
* **Finding:** While parallel-jaw grippers dominate academic tactile papers, **anthropomorphic hands mounted on floating-base humanoids introduce non-linear dynamic momentum coupling** where arm reaction forces threaten bipedal stability.

---

## 14.6 Exact Overlaps and Unresolved Experimental Limitations

Synthesizing Sections 14.2–14.5 identifies the exact overlaps between prior art and HOROS candidate ideas:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      PRIOR ART OVERLAPS & REMAINING LIMITATIONS                             │
├───────────────────────────────┬─────────────────────────────┬───────────────────────────────────────────────┤
│ Capability                    │ State of Existing Art       │ Critical Unresolved Limitation                │
├───────────────────────────────┼─────────────────────────────┼───────────────────────────────────────────────┤
│ Incipient Slip Detection      │ Solved (PANDAS, SINTEF:     │ Tested almost exclusively on rigid objects in │
│                               │ 94–99% accuracy, 32 ms lead)│ isolated parallel-jaw drop tests.             │
├───────────────────────────────┼─────────────────────────────┼───────────────────────────────────────────────┤
│ Tactile-Augmented VLAs        │ Demonstrated (TacClaw,      │ Policies operate via open-loop chunking or    │
│                               │ VLA-Touch, AT-VLA, N0-VTLA) │ discrete prompt adjustments; no continuous    │
│                               │                             │ physical safety boundary under sensor noise.  │
├───────────────────────────────┼─────────────────────────────┼───────────────────────────────────────────────┤
│ Dynamic Mass Compensation     │ Demonstrated (Zhao, Ford)   │ Evaluated on isolated pouring/lifting tasks;  │
│                               │                             │ not integrated with language-conditioned VLAs.│
├───────────────────────────────┼─────────────────────────────┼───────────────────────────────────────────────┤
│ Online Friction Estimation    │ Demonstrated (Niu et al.)   │ Evaluated on flat parallel jaws; not tested   │
│                               │                             │ under simultaneous mass shifts or humanoids.  │
├───────────────────────────────┼─────────────────────────────┼───────────────────────────────────────────────┤
│ Humanoid Whole-Body Touch     │ Emerging (WT-UMI, Helix 02) │ Helix is closed; WT-UMI relies on teleop data │
│                               │                             │ and lacks open-weights VLA generalization.    │
└───────────────────────────────┴─────────────────────────────┴───────────────────────────────────────────────┘
```

---

## 14.7 Claim-by-Claim Novelty and Evidence Matrix

We rigorously assess the five decomposed claims (C1–C5) against published literature:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CLAIM-BY-CLAIM NOVELTY & EVIDENCE MATRIX                                 │
├───────┬───────────────────────────────┬────────────────────────────┬─────────────┬──────────────────────────┤
│ Claim │ Scientific Assertion          │ Key Counter-Prior Art      │ Novelty     │ Strategic Action         │
│       │                               │                            │ Status      │ for HOROS                │
├───────┼───────────────────────────────┼────────────────────────────┼─────────────┼──────────────────────────┤
│ C1    │ Incipient slip prediction     │ PANDAS (IROS 2025),        │ NOT NOVEL   │ REJECT as standalone     │
│       │ within 25–35 ms               │ SINTEF (IROS 2024)         │ (Solved)    │ novelty claim.           │
├───────┼───────────────────────────────┼────────────────────────────┼─────────────┼──────────────────────────┤
│ C2    │ Dynamic mass & CoM shift      │ Ford et al. (T-RO 2025),   │ NOT NOVEL   │ Treat as existing        │
│       │ adaptation                    │ Zhao et al. (Sensors 2024) │ (Solved)    │ baseline capability.     │
├───────┼───────────────────────────────┼────────────────────────────┼─────────────┼──────────────────────────┤
│ C3    │ Synchronized online friction  │ Niu et al. (arXiv 2026),   │ NOT NOVEL   │ Integrate existing       │
│       │ estimation                    │ Tracing Energy Flow (2026) │ (Solved)    │ estimator formulation.   │
├───────┼───────────────────────────────┼────────────────────────────┼─────────────┼──────────────────────────┤
│ C4    │ Multi-rate dual-stream        │ AT-VLA (CVPR 2026),        │ PARTIALLY   │ Differentiate via        │
│       │ tactile-VLA coordination      │ N₀-VTLA (July 2026)        │ SOLVED      │ formal safety barriers.  │
├───────┼───────────────────────────────┼────────────────────────────┼─────────────┼──────────────────────────┤
│ C5    │ Joint Nonstationary Physical  │ No existing paper combines │ GENUINE     │ ADOPT as the core        │
│       │ Contact Adaptation under VLA  │ all four nonstationarities │ UNRESOLVED  │ research foundation for  │
│       │ Long-Horizon Instruction      │ within a single framework  │ SCIENTIFIC  │ Document 15.             │
│       │                               │ on dexterous humanoids.    │ GAP         │                          │
└───────┴───────────────────────────────┴────────────────────────────┴─────────────┴──────────────────────────┘
```

---

## 14.8 Dataset, Code, Licensing, Hardware, and Reproducibility Reality Check

A scientific proposal must be grounded in executable hardware and clean legal data:

1. **The TacClaw-Infinity Licensing Barrier:**
   * TacClaw-Infinity represents the largest public VTLA dataset ($10,000\text{ hours}$), but its **CC BY-NC-SA 4.0 license** prohibits commercial deployment. Furthermore, training code has not yet been released.
   * **Verdict:** HOROS cannot adopt TacClaw-Infinity as its primary foundation pretraining asset without violating first-party commercial requirements.
2. **The GR00T-Teleop-G1 Tactile Absence:**
   * The canonical `GR00T-Teleop-G1` dataset contains no physical tactile measurements (`tactile_available = 0.0`, verified in Step 11 unit tests).
   * **Verdict:** Pretraining or evaluating tactile feedback cannot rely on `GR00T-Teleop-G1` alone.
3. **Hardware Acquisition Feasibility for HOROS:**
   * To execute real physical experiments, HOROS must deploy:
     * Platform: **Unitree G1 humanoid** with **DexH10 dexterous hands**.
     * Tactile Instrumentation: Two options:
       * *Option A (Physical Sensors):* Mount commercially available **GelSight Mini** or **DIGIT** optical tactile sensors onto the fingertips of DexH10 hands ($4\text{ units} \times \$850 \approx \$3,400$).
       * *Option B (Isaac Lab Soft Contact Simulation):* Pretrain and benchmark in Isaac Lab 4.2 using GPU-accelerated elastomeric contact simulation with domain randomization over friction ($\mu \in [0.1, 1.2]$), object mass ($\pm 50\%$), and center of mass offsets ($\pm 5\text{ cm}$).

---

## 14.9 Preliminary Go / No-Go Decision on the Three Candidate Gaps

We perform a strict go/no-go evaluation on the three candidate research gaps:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     CANDIDATE GAP GO / NO-GO EVALUATION                                     │
├───────────────────────────────────┬──────────────────────────────────────────┬──────────────────────────────┤
│ Candidate Research Gap            │ Evaluation Findings & Risks              │ Decision Verdict             │
├───────────────────────────────────┼──────────────────────────────────────────┼──────────────────────────────┤
│ Candidate Gap 1:                  │ Existing works test friction (Niu 2026), │ CONDITIONAL GO               │
│ Joint Nonstationary Contact       │ mass (Zhao 2024), and CoM (Ford 2025) in │ Strongest thesis candidate.  │
│ Adaptation (Simultaneous friction,│ isolation. No prior work handles joint   │ Requires rigorous multi-axis │
│ mass, and CoM transitions).       │ nonstationary shifts under VLA control.  │ physical testbed.            │
├───────────────────────────────────┼──────────────────────────────────────────┼──────────────────────────────┤
│ Candidate Gap 2:                  │ AT-VLA (CVPR 2026) and N0-VTLA (2026)    │ CONDITIONAL GO               │
│ Multi-Rate Tactile Intelligence   │ have already demonstrated dual-stream    │ Must not claim dual-stream   │
│ (Fast tactile reflex + slow VLA). │ tactile injection. Novelty exists only if│ as novel; differentiate via  │
│                                   │ coupled with formal stability guarantees.│ Lyapunov/CBF invariance.     │
├───────────────────────────────────┼──────────────────────────────────────────┼──────────────────────────────┤
│ Candidate Gap 3:                  │ Safe grip adaptation under sensor noise  │ CONDITIONAL GO               │
│ Uncertainty-Aware Physical Safety │ and OOD materials remains unresolved.    │ High industry demand;        │
│ under Unfamiliar Materials.       │ Most VLAs fail unpredictably under OOD.  │ complements Gap 1 & Gap 2.   │
└───────────────────────────────────┴──────────────────────────────────────────┴──────────────────────────────┘
```

### Synthesis of the Go Decision for Document 15
HOROS will **NOT** claim novelty on:
* Proposing slip prediction (solved by PANDAS / SINTEF).
* Proposing online friction estimation (solved by Niu et al. 2026).
* Proposing a dual-stream tactile VLA (solved by AT-VLA 2026).

HOROS **CAN DEFEND NOVELTY** on:
> **The Unified Nonstationary Contact Thesis:**  
> Developing an embodied foundation architecture capable of **continuous, closed-loop contact stability adaptation under simultaneous, nonstationary physical shifts** (concurrent unknown friction, shifting payload mass, and dynamic center-of-mass excursions) guarded by **uncertainty-calibrated predictive Control Barrier Functions (p-CBF)** on dexterous multi-fingered humanoid hardware.

---

## Conclusion & Transition to Document 15

Document 14 successfully stress-tests the literature, clears away invalid novelty claims, and establishes the precise scientific boundary. We proceed to **Document 15: Primary Research Thesis Selection** to formalize HOROS PROBE-1's scientific charter.

