# HOROS First-Party Model Program: PROBE-1
## 00 — Research Objective & Strategic Charter

### 1. Executive Summary & Core Mission
PROBE-1 is HOROS's first-party foundation model program for **humanoid robotics and embodied physical intelligence**. The primary objective of PROBE-1 is to bridge the gap between multimodal perceptual understanding and high-frequency, dynamic physical actuation. Unlike conventional vision-language-action (VLA) models that treat robot control as slow, discrete token autoregression, PROBE-1 develops a unified, dual-frequency physical runtime capable of bi-manual dexterity, real-time tactile feedback integration, dynamic balance recovery, and provable safety compliance.

### 2. Primary Research Objectives
1. **Unified Physical Representation:** Develop an action-conditioned foundation representation that jointly embeds multi-camera visual streams (RGB + Depth), joint proprioception (positions, velocities, torques), high-density tactile arrays (e.g., GelSight/DIGIT optical-tactile and resistive matrix), and 6-DoF inertial measurement units (IMU).
2. **Dual-Frequency Control Architecture:** Decouple semantic task planning and spatial scene decomposition (10 Hz high-level transformer planner) from reactive impedance control, contact slip prevention, and trajectory flow matching (50–200 Hz low-level policy).
3. **Contact and Dynamics Modeling:** Explicitly predict action-conditioned contact events, friction cone adherence, and collision manifolds rather than relying exclusively on ungrounded end-effector poses.
4. **Independent Verifiable Safety Boundary:** Enforce strict deterministic safety barriers (joint torque saturation limits, control Lyapunov functions, self-collision avoidance, and hard E-stop contracts) outside the stochastic neural network forward pass.
5. **Horos Runtime Integration:** Full compilation to HOROS Reality Fabric runtime with continuous mission-level telemetry profiling, zero-copy RDMA buffer sharing, and automated real-to-sim-to-real feedback loops.

### 3. Quantitative Success Metrics & KPIs
* **Latency & Frequency:** Low-level action policy inference $\le 10$ ms latency (steady-state 100 Hz output rate) with $< 2$ ms jitter on edge GPU compute (NVIDIA Jetson Thor / Drive Thor or single RTX 4090/L40S).
* **Dexterous Manipulation Success:** $\ge 88\%$ zero-shot and few-shot task completion across 50 standardized bi-manual dexterous assembly, tool manipulation, and articulated object opening tasks.
* **Locomotion & Disturbance Rejection:** Dynamic omnidirectional locomotion recovery under external lateral impulses up to $150\text{ N}\cdot\text{s}$ without falling or joint limit violation.
* **Tactile Slip Prevention:** In-hand slip detection and micro-force adjustment response time $< 25$ ms.
* **Safety Violations:** $0.000\%$ uncontained torque, workspace, or collision boundary violations through independent safety guard integration.

### 4. Hardware Platforms & Target Embodiments
* **Humanoid Bipedal Platforms:** Unitree H1/G1, Figure 01/02, Boston Dynamics Atlas (electric), Agility Digit, and proprietary HOROS physical test rigs.
* **Dexterous Manipulators:** 16-24 DoF bi-manual humanoid hands with multi-axis fingertip tactile arrays.
* **Sensory Modalities:** 4x global shutter RGB-D cameras (head stereo + wrist stereo), 6-axis wrist force-torque sensors, full-body joint encoders, and high-frequency IMUs.
