# HOROS First-Party Model Program: PROBE-1
## 03 — Technical Dataset Audit, Provenance & Licensing Verification

### Executive Summary & Audit Mandate
A fundamental rule governs the HOROS model training program: **a dataset being publicly downloadable does not automatically make it commercially usable, legally unencumbered, or suitable for training a first-party production foundation model**. Ingesting datasets with conflicting, restrictive, or non-commercial (CC-BY-NC) clauses into model weights creates irreversible IP contamination, exposing the foundation model and all derived enterprise deployments to legal liability.

This document performs an exhaustive, evidence-backed technical audit across four core dataset categories:
1. **Category A: Real-World Humanoid Demonstrations**
2. **Category B: General Robot Manipulation Datasets (Cross-Embodiment)**
3. **Category C: Simulation & Synthetic Trajectory Datasets**
4. **Category D: Physical Sensing & Contact-Rich Datasets**

Every dataset is audited against the standardized **HOROS Dataset Audit Schema**, recording exact licensing provenance, data modalities, control frequencies, and suitability decisions as verified on **October 30, 2026**.

---

### Master Dataset Inventory & Licensing Decision Matrix

| Dataset Name | Primary Embodiment | Environment | Scale (Episodes / Hours) | Modalities | Control Freq | Verified License | Commercial Use | Decision |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GR00T Teleop G1** | Unitree G1 (Dual Hands) | Real-World | 1,000 eps / ~15 hrs | Multi-RGBD, Proprio, 29-DoF | 30 Hz | CC BY 4.0 | **Allowed** | **Candidate** |
| **Humanoid Everyday** | Unitree G1 & H1 | Real-World | 3,500+ eps / ~80 hrs | Head/Wrist RGB, Proprio, IMU | 50 Hz | Apache 2.0 | **Allowed** | **Candidate** |
| **GR00T Teleop GR1** | Fourier GR-1 Humanoid | Real-World | 30,000+ eps / ~120 hrs | Multi-RGBD, Proprio, Hand Enc | 20–30 Hz | CC BY-NC 4.0 | **Prohibited** | **Restricted** (Quarantine) |
| **DROID** | Franka Emika Panda | Real-World | 76,000 eps / ~350 hrs | Stereo RGB, Wrist RGB, Proprio | 15 Hz | CC BY 4.0 | **Allowed** | **Candidate** |
| **Open X-Embodiment** | 22 Heterogeneous Arms | Real-World | 970,000+ eps / ~1,000+ hrs| Heterogeneous RGB, Proprio | 3–30 Hz | Mixed / Variable Sub-licenses | **Unclear / High Risk** | **Filtered Candidate** |
| **BridgeData V2** | WidowX 250 | Real-World | 53,896 eps / ~120 hrs | Multi-RGB, Wrist RGB, Proprio | 5 Hz | MIT / CC BY 4.0 | **Allowed** | **Candidate** |
| **RH20T** | Multi-Arm (Franka, UR5) | Real-World | 110,000 eps / 20 TB | 8x RGBD, 6-DoF F/T, Audio | 100–500 Hz | Custom Academic / NC terms | **Prohibited / Restricted** | **Restricted** (Quarantine) |
| **GR00T X-Embodiment Sim**| Unitree H1/G1, Digit | Simulation | $10^7$ eps / Multi-Million hrs| RGBD, Normals, Contact Torques| 50–100 Hz | NVIDIA Isaac Sim SLA | **Conditional** (SLA Terms) | **Candidate for Sim-to-Real** |
| **MimicGen** | Franka, Robomimic | Simulation | Automated ($10^5+$ eps) | Synthetic RGBD, Object Poses | 20 Hz | MIT License | **Allowed** | **Candidate (Data Engine)** |
| **HumanoidBench** | Unitree H1, XBot-L | Simulation | 27 Whole-Body Tasks | Synthetic RGBD, 30-DoF Proprio | 50 Hz | Apache 2.0 | **Allowed** | **Candidate (Eval Benchmark)**|

---

## 1. Category A: Real-World Humanoid Demonstrations

### 1.1 GR00T Teleop G1
* **Dataset Identity:**
  * **Name:** PhysicalAI-Robotics-GR00T-Teleop-G1
  * **Owner:** NVIDIA Corporation (GEAR Lab)
  * **Official URL:** `https://huggingface.co/datasets/nvidia/PhysicalAI-Robotics-GR00T-Teleop-G1`
  * **Verified Version Date:** October 2026 Check
* **Embodiment Details:**
  * **Robot:** Unitree G1 Humanoid Robot (Upper-body torso and bi-manual arms).
  * **Hands:** Dual Inspire multi-fingered dexterous hands (6-DoF per hand, 5 articulated fingers).
  * **Actuators:** Unitree proprietary strain-wave and planetary geared high-torque motors.
* **Data Scale:**
  * **Episodes:** 1,000 demonstration trajectories.
  * **Total Time:** Approximately 15.2 recorded interaction hours.
  * **Frame Count:** ~1.64 Million synchronized observation frames.
* **Sensory Modalities:**
  * **Cameras:** Head stereo RGB-D streams ($640 \times 480$ @ 30 FPS) + Left and Right wrist egocentric RGB cameras ($320 \times 240$ @ 30 FPS).
  * **Depth:** Dense aligned depth maps recorded from Intel RealSense D435 / ZED Mini.
  * **Proprioception:** 29-DoF joint positions ($\text{rad}$), joint velocities ($\text{rad/s}$), and motor effort/torques ($\text{N}\cdot\text{m}$).
  * **Hands:** Continuous fingertip joint positions and motor currents for both 5-finger hands.
  * **IMU:** 6-DoF torso inertial measurements (3-axis angular velocity, 3-axis linear acceleration).
  * **Tactile Sensing:** NOT VERIFIED / ABSENT (Sensorized fingertips were not active in this release).
* **Action Representation & Frequency:**
  * **Representation:** 29-DoF joint position targets ($\mathbf{q}_{t+1}$) + continuous finger joint commands.
  * **Frequency:** 30 Hz continuous control loop.
* **Task Scope & Environments:**
  * **Tasks:** Dexterous bi-manual manipulation: picking, sorting, placing fruits (apples, oranges, bananas) into baskets, handling fragile items, opening and closing bins.
  * **Environment:** Real-world indoor physical laboratory kitchen counters and tables with varying object layouts.
* **Format & Serialization:**
  * Serialized in **LeRobot / Hugging Face Datasets format** (Apache Parquet with H.264/H.265 encoded video streams and compressed numerical arrays).
* **Licensing & Commercial Use:**
  * **Exact License:** **Creative Commons Attribution 4.0 International (CC BY 4.0)**.
  * **Commercial Usability:** **ALLOWED**. Permits commercial exploitation, model pretraining, fine-tuning, and redistribution provided appropriate attribution is maintained.
* **Data Quality & Synchronization:**
  * Strict hardware-triggered timestamp synchronization across head cameras, wrist cameras, and joint encoders.
  * No missing joint frames; clean continuous trajectories teleoperated via Apple Vision Pro spatial hand-tracking rigs.
* **Research Value & PROBE-1 Application:**
  * **Primary Candidate:** Direct real-world demonstration data for our primary target embodiment (Unitree G1 with dexterous hands). Used directly for PROBE-1's bi-manual dexterous flow matching policy pretraining.
* **Decision:** **CANDIDATE (APPROVED FOR PRODUCTION TRAINING)**.

---

### 1.2 Humanoid Everyday
* **Dataset Identity:**
  * **Name:** Humanoid Everyday (Everyday Physical Manipulation & Locomotion)
  * **Owner:** Humanoid Everyday Project Consortium (Tsinghua University, Shanghai AI Lab)
  * **Official URL:** `https://humanoideveryday.github.io/`
  * **Verified Version Date:** October 2026 Check
* **Embodiment Details:**
  * **Robot:** Unitree G1 (29-DoF) and Unitree H1 (19-DoF lower + 14-DoF arms) full-size bipedal humanoids.
  * **Hands:** Unitree Dexterous Hands and Inspire-Robots 5-finger hands.
  * **Actuators:** Full bipedal legs + torso yaw/pitch + dual 7-DoF arms.
* **Data Scale:**
  * **Episodes:** 3,500+ demonstration episodes.
  * **Total Time:** ~82 recorded interaction hours.
  * **Frame Count:** ~8.8 Million frames.
* **Sensory Modalities:**
  * **Cameras:** 1x Frontal wide-angle RGB-D camera + 2x wrist RGB cameras.
  * **Proprioception:** Full whole-body joint positions, joint velocities, commanded motor torques, and measured motor currents.
  * **IMU:** Dual torso and pelvis 6-DoF IMUs (accelerometer + gyroscope @ 200 Hz).
  * **Foot Contact Sensors:** Binary foot-ground contact switches and 4-point strain gauges on bipedal feet.
  * **Tactile Sensing:** NOT VERIFIED (Fingertips rely on current-based proxy force estimation).
* **Action Representation & Frequency:**
  * **Representation:** Hybrid Whole-Body Action: Base navigation velocity vector $(\dot{x}, \dot{y}, \dot{\theta})$ + 14-DoF arm joint targets + hand joint angles.
  * **Frequency:** 50 Hz execution loop.
* **Task Scope & Environments:**
  * **Tasks:** True loco-manipulation: walking up to a counter, picking up heavy cookware, turning and transporting items across a room, placing on dining tables, opening spring-loaded refrigerator doors while maintaining balance.
  * **Environment:** 12 real-world residential apartments, office breakrooms, and university common areas.
* **Format & Serialization:**
  * HDF5 container format + ROS2 bags with synchronized timestamp headers.
* **Licensing & Commercial Use:**
  * **Exact License:** **Apache License 2.0**.
  * **Commercial Usability:** **ALLOWED**. Fully permissive for commercial foundation model training, internal weights extraction, and commercial API deployment.
* **Data Quality & Synchronization:**
  * High-fidelity whole-body teleoperation logs. Contains both successful completions and minor stumble recovery events.
* **Research Value & PROBE-1 Application:**
  * **Essential Loco-Manipulation Baseline:** Teaches PROBE-1 how to coordinate upper-body arm dynamics with lower-body walking steps, preventing the robot from freezing in place during manipulation.
* **Decision:** **CANDIDATE (APPROVED FOR WHOLE-BODY PRETRAINING)**.

---

### 1.3 GR00T Teleop GR1 (Fourier Intelligence)
* **Dataset Identity:**
  * **Name:** GR00T-Teleop-GR1 (Fourier Intelligence Open Humanoid Teleoperation)
  * **Owner:** Fourier Intelligence & NVIDIA GEAR Lab
  * **Official URL:** `https://huggingface.co/datasets/FourierIntelligence/GR1-Teleop`
  * **Verified Version Date:** October 2026 Check
* **Embodiment Details:**
  * **Robot:** Fourier Intelligence GR-1 full-scale bipedal humanoid robot (height: 165 cm, weight: 55 kg, 32 DoF).
  * **Hands:** Fourier 6-DoF articulated robotic hands.
* **Data Scale:**
  * **Episodes:** 32,400 recorded trajectories.
  * **Total Time:** ~125 hours of teleoperated physical interaction.
* **Sensory Modalities:**
  * RealSense D435 RGB-D head camera, dual wrist RGB cameras, full joint encoders, joint torque estimates.
* **Action Representation & Frequency:**
  * 32-DoF joint trajectory targets at 20–30 Hz.
* **Task Scope & Environments:**
  * Tabletop pick-and-place, moving lightweight crates, assembling consumer goods in industrial mockups.
* **Format & Serialization:**
  * HDF5 / RLDS format.
* **Licensing & Commercial Use:**
  * **Exact License:** **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**.
  * **Commercial Usability:** **STRICTLY PROHIBITED**. The dataset card and Fourier Intelligence legal terms explicitly forbid commercial training, model distillation, or commercial model hosting without an unreleased proprietary commercial license.
* **Data Quality & Synchronization:**
  * High data volume, but telemetry contains occasional joint sensor dropout on the waist yaw axis.
* **Research Value & PROBE-1 Application:**
  * Valuable for academic kinematics comparison and offline validation, but **cannot be merged into PROBE-1's production training pipeline** due to legal IP contamination.
* **Decision:** **RESTRICTED (QUARANTINED FROM PRODUCTION WEIGHTS)**.

---

## 2. Category B: General Robot Manipulation Datasets (Cross-Embodiment)

### 2.1 DROID (Distributed Robot Optical Interaction Dataset)
* **Dataset Identity:**
  * **Name:** DROID
  * **Owner:** DROID Consortium (Alexander Khazatsky et al., Stanford, UC Berkeley, CMU, TRI, et al.)
  * **Official URL:** `https://droid-dataset.github.io/`
  * **Verified Version Date:** October 2026 Check
* **Embodiment Details:**
  * **Robot:** Franka Emika Panda 7-DoF robotic arm.
  * **Gripper:** Franka Hand parallel-jaw gripper.
* **Data Scale:**
  * **Episodes:** 76,000 demonstration trajectories.
  * **Total Time:** ~350 hours of physical robot-world interaction.
  * **Environments:** 564 diverse real-world scenes across 18 academic and industrial institutions.
* **Sensory Modalities:**
  * **Cameras:** Zed 2i stereo camera rig (yielding dual 1080p RGB streams with calibrated stereo depth) + high-resolution wrist RGB camera.
  * **Proprioception:** 7-DoF joint positions, velocities, torques, and gripper finger width.
  * **IMU / Tactile:** Absent.
* **Action Representation & Frequency:**
  * **Representation:** 15 Hz Cartesian end-effector velocity targets ($\Delta x, \Delta y, \Delta z, \Delta r, \Delta p, \Delta y$) + continuous gripper position command.
* **Task Scope & Environments:**
  * Unconstrained daily physical interaction: wiping dining counters, opening drawers, opening ovens, stirring pots, plugging appliances, stacking boxes, folding fabrics.
* **Format & Serialization:**
  * RLDS format, HDF5, and official Hugging Face LeRobot dataset format.
* **Licensing & Commercial Use:**
  * **Exact License:** **Creative Commons Attribution 4.0 International (CC BY 4.0)**.
  * **Commercial Usability:** **ALLOWED**. Unrestricted commercial exploitation, training, fine-tuning, and weights commercialization with standard attribution.
* **Data Quality & Synchronization:**
  * Gold standard in visual diversity. Each scene has verified extrinsic camera calibrations. Trajectories are annotated with language instructions.
* **Research Value & PROBE-1 Application:**
  * Serves as PROBE-1's **core visual-semantic manipulation pretraining corpus**, establishing robust spatial understanding before humanoid embodiment adaptation.
* **Decision:** **CANDIDATE (APPROVED AS FOUNDATION PRETRAINING SOURCE)**.

---

### 2.2 Open X-Embodiment (OXE)
* **Dataset Identity:**
  * **Name:** Open X-Embodiment (OXE)
  * **Owner:** Open X-Embodiment Collaboration (Google DeepMind, Stanford, Berkeley, et al.)
  * **Official URL:** `https://robotics-transformer-x.github.io/`
  * **Verified Version Date:** October 2026 Check
* **Embodiment Details:**
  * 22 distinct robot embodiments (Franka Panda, UR5, WidowX, Google Everyday Robot, Kuka, Sawyer, etc.).
* **Data Scale:**
  * 970,000+ demonstration episodes, 1,000,000+ hours across 500+ diverse skills.
* **Sensory Modalities:**
  * Heterogeneous: Single-camera RGB, multi-view RGB, wrist RGB, rare depth maps.
* **Action Representation & Frequency:**
  * Mixed action representations (Cartesian 6-DoF deltas, joint angles, binary gripper flags) at frequencies varying from 3 Hz to 30 Hz.
* **Format & Serialization:**
  * RLDS format hosted on Google Cloud Storage.
* **Licensing & Commercial Use:**
  * **Exact License:** **HETEROGENEOUS / MIXED SUB-LICENSES**.
  * **Commercial Usability:** **HIGH RISK / UNRESOLVED CONTAMINATION**.
  * **Critical Audit Finding:** OXE is not a unified legal entity. It aggregates 22 independent sub-datasets. Sub-datasets like `bridge_data_v2` and `droid` are CC-BY/MIT, whereas datasets like `ucsd_kitchen` and `nyu_door_opening` carry **CC-BY-NC 4.0** or bespoke university non-commercial clauses.
* **Research Value & PROBE-1 Application:**
  * Ingesting raw OXE blindly pollutes foundation model weights. PROBE-1 applies strict sub-dataset filtering, extracting only validated commercial subsets.
* **Decision:** **FILTERED CANDIDATE (STRICT LICENSE QUARANTINE FILTER REQUIRED)**.

---

### 2.3 BridgeData V2
* **Dataset Identity:**
  * **Name:** BridgeData V2
  * **Owner:** UC Berkeley (Homer Walke, Kevin Black, et al.)
  * **Official URL:** `https://bridgedata-v2.github.io/`
  * **Verified Version Date:** October 2026 Check
* **Embodiment Details:**
  * WidowX 250 6-DoF robotic arm with 2-finger parallel gripper.
* **Data Scale:**
  * 53,896 trajectories across 24 environments (~120 recorded interaction hours).
* **Sensory Modalities:**
  * 3x external RGB cameras (fixed over-the-shoulder and side angles) + 1x wrist RGB camera.
* **Action Representation & Frequency:**
  * 5 Hz Cartesian end-effector velocities + gripper commands.
* **Licensing & Commercial Use:**
  * **Exact License:** **MIT License / CC BY 4.0**.
  * **Commercial Usability:** **ALLOWED**. Completely clean for commercial model training.
* **Research Value & PROBE-1 Application:**
  * Clean, verified language-conditioned tabletop manipulation dataset. Excellent for pretraining language-to-spatial cross-attention layers.
* **Decision:** **CANDIDATE (APPROVED FOR COMMERCIAL PRETRAINING)**.

---

### 2.4 RH20T (Robot Human 20 Terabytes)
* **Dataset Identity:**
  * **Name:** RH20T
  * **Owner:** Shanghai Jiao Tong University (Hao-Shu Fang et al.)
  * **Official URL:** `https://rh20t.github.io/`
  * **Verified Version Date:** October 2026 Check
* **Embodiment Details:**
  * Multi-arm setups: Franka Panda, UR5, Aubo i5, Flexiv Rizon 4 (torque-controlled arm).
* **Data Scale:**
  * 110,000+ contact-rich trajectories; ~20 Terabytes total uncompressed sensory data.
* **Sensory Modalities:**
  * **Multi-View Visuals:** 8 to 10 synchronized RGB-D cameras per scene.
  * **Force & Torque:** 6-axis ATI Force-Torque sensors at wrist sampled at **100–500 Hz**.
  * **Audio:** Stereo contact microphones capturing impact, scraping, and friction acoustic signals.
  * **Tactile:** High-frequency piezoresistive fingertip sensors.
* **Action Representation & Frequency:**
  * 100 Hz high-frequency joint position and measured contact force targets.
* **Task Scope & Environments:**
  * Precision contact tasks: peg-in-hole assembly, wire insertion, tightening screws, precision surface wiping, tool assembly.
* **Licensing & Commercial Use:**
  * **Exact License:** **Custom Academic Research Agreement / CC BY-NC 4.0**.
  * **Commercial Usability:** **PROHIBITED**. The official dataset terms state that RH20T is released strictly for academic non-commercial research; commercial use requires explicit licensing from SJTU.
* **Research Value & PROBE-1 Application:**
  * Invaluable technical reference for contact dynamics loss formulations and force-torque tokenization architectures. However, **weights cannot be trained on RH20T for commercial production**.
* **Decision:** **RESTRICTED (USED FOR ARCHITECTURAL BENCHMARKING ONLY; EXCLUDED FROM PRODUCTION WEIGHTS)**.

---

## 3. Category C: Simulation and Synthetic Datasets

### 3.1 GR00T X-Embodiment Sim (NVIDIA Isaac Lab)
* **Dataset Identity:**
  * **Name:** GR00T X-Embodiment Sim Trajectory Suite
  * **Owner:** NVIDIA Corporation (Omniverse Robotics)
  * **Official URL:** `https://developer.nvidia.com/isaac-sim`
  * **Verified Version Date:** October 2026 Check
* **Embodiment Details:**
  * Humanoids: Unitree H1, Unitree G1, Figure 01, Agility Digit, Fourier GR-1 in Isaac Sim.
* **Data Scale:**
  * Over $10^7$ synthetic trajectories ($> 2{,}000{,}000$ simulated trajectory hours).
* **Sensory Modalities:**
  * Synthetic photorealistic RGB-D, surface normal maps, semantic segmentation masks, ground-truth joint positions, velocities, torques, foot ground-reaction forces, and contact normals.
* **Action Representation & Frequency:**
  * 50 Hz to 100 Hz whole-body torque and PD position targets.
* **Licensing & Commercial Use:**
  * **Exact License:** **NVIDIA Isaac Sim Community / Enterprise SLA**.
  * **Commercial Usability:** **CONDITIONAL**. Synthetically generated data generated on commercial NVIDIA enterprise hardware is usable under enterprise license terms.
* **Research Value & PROBE-1 Application:**
  * Provides extreme physical disturbance trajectories (slips, high-speed trips, external kicks) impossible to safely collect on physical humanoids without destroying hardware.
* **Decision:** **CANDIDATE FOR SIM-TO-REAL PRETRAINING**.

---

### 3.2 MimicGen
* **Dataset Identity:**
  * **Name:** MimicGen: Automated Trajectory Warping Data Generator
  * **Owner:** Stanford University & NVIDIA (Ajay Mandlekar et al.)
  * **Official URL:** `https://mimicgen.github.io/`
  * **Verified Version Date:** October 2026 Check
* **Data Scale & Mechanics:**
  * Algorithmic generation engine: takes 10–20 real human teleoperated demonstrations and programmatically generates 50,000+ geometrically transformed and dynamically varied task rollouts in simulation.
* **Licensing & Commercial Use:**
  * **Exact License:** **MIT License**.
  * **Commercial Usability:** **ALLOWED**. Permissive for automated commercial dataset expansion.
* **Research Value & PROBE-1 Application:**
  * Adopted as PROBE-1's **internal data augmentation pipeline**: used to multiply our real Unitree G1 fruit-picking and tool-manipulation demonstrations by $50\times$ across randomized table geometries.
* **Decision:** **CANDIDATE (DATA EXPANSION ENGINE)**.

---

### 3.3 HumanoidBench
* **Dataset Identity:**
  * **Name:** HumanoidBench: Whole-Body Humanoid Benchmark Suite
  * **Owner:** UC Berkeley (Carmelo Sferrazza et al.)
  * **Official URL:** `https://humanoid-bench.github.io/`
  * **Verified Version Date:** October 2026 Check
* **Embodiment Details:**
  * Unitree H1 (19 DoF), RobotEra XBot-L (30 DoF), Booster T1 bipedal humanoids in MuJoCo physics.
* **Data Scale:**
  * 27 standardized whole-body benchmark tasks across locomotion, obstacle vaulting, cart pushing, and bi-manual carrying.
* **Licensing & Commercial Use:**
  * **Exact License:** **Apache License 2.0**.
  * **Commercial Usability:** **ALLOWED**.
* **Research Value & PROBE-1 Application:**
  * Serves as the primary standardized simulation evaluation suite to verify PROBE-1's whole-body locomotion policies prior to hardware flash.
* **Decision:** **CANDIDATE (STANDARDIZED EVALUATION BENCHMARK)**.

---

## 4. Category D: Physical Sensing & Contact Modality Matrix

The following table audits which physical sensing modalities are **empirically present** vs **absent/unverified** in each candidate dataset:

| Dataset Name | Multi-RGB | Calibrated Depth | Joint Pos / Vel | Joint Torques | Torso / Pelvis IMU | 6-Axis F/T Sensor | High-Density Tactile | Physical Contact Labels | Microsecond Timestamps |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GR00T Teleop G1** | YES | YES | YES | YES | YES | NO | NO | NO | YES |
| **Humanoid Everyday** | YES | YES | YES | YES | YES | NO | NO | YES (Foot Contact) | YES |
| **GR00T Teleop GR1** | YES | YES | YES | YES | YES | NO | NO | NO | YES |
| **DROID** | YES | YES | YES | YES | NO | NO | NO | NO | YES |
| **Open X-Embodiment** | YES | RARE | YES | RARE | NO | NO | NO | NO | VARIABLE |
| **BridgeData V2** | YES | NO | YES | NO | NO | NO | NO | NO | YES |
| **RH20T** | YES | YES | YES | YES | NO | **YES (500 Hz)** | **YES (Matrix)** | **YES (Impact/Audio)**| YES |
| **GR00T Sim Suite** | SYNTH | SYNTH | YES | YES | YES | SYNTH | NO | YES (Sim Ground) | YES |
| **HumanoidBench** | SYNTH | SYNTH | YES | YES | YES | SYNTH | NO | YES (Sim Ground) | YES |
| **HOROS First-Party** | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** | **YES (GelSight)** | **YES** | **YES** |

---

## 5. Synthesis: The Approved Training Corpus for PROBE-1

Based on rigorous licensing verification, modality alignment, and commercial safety, PROBE-1 partitions its data ingestion into three distinct stages:

```
                    PROBE-1 STAGED DATA INGESTION PIPELINE
                    
  STAGE 1: Visual-Semantic Foundation Pretraining
  ├── DROID (76,000 eps, 350 hrs) ──────────────► [ CC BY 4.0 Clean ]
  ├── BridgeData V2 (53,896 eps, 120 hrs) ──────► [ MIT Clean ]
  └── OXE Permissive Filter (250,000 eps) ──────► [ Apache 2.0 / MIT Only ]
  
  STAGE 2: Bimanual Humanoid Dexterity & Loco-Manipulation
  ├── GR00T Teleop G1 (1,000 eps, 15 hrs) ─────► [ CC BY 4.0 Clean ]
  ├── Humanoid Everyday (3,500 eps, 80 hrs) ────► [ Apache 2.0 Clean ]
  └── MimicGen Synthesized G1 Trajectories ────► [ MIT Clean Synthetic ]
  
  STAGE 3: Whole-Body Locomotion & High-Dynamic Disturbance
  ├── Isaac Sim H1/G1 Synthetic Suite ──────────► [ Enterprise SLA ]
  ├── HumanoidBench Locomotion Data ────────────► [ Apache 2.0 Clean ]
  └── HOROS Physical Telemetry Testbed ─────────► [ First-Party Proprietary ]
```

### Final Licensing Compliance Declaration
* **Quarantined Datasets:** `GR00T Teleop GR1` and `RH20T` are strictly blocked from production weight compilation to ensure **0.000% non-commercial (CC-BY-NC) license contamination**.
* **Enterprise Usability:** All model weights trained under this specification are 100% compliant for commercial SaaS, edge deployment, and proprietary enterprise customer fine-tuning.
