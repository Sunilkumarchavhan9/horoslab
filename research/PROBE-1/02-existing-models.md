# HOROS First-Party Model Program: PROBE-1
## 02 — Technical Audit of Existing Models

### 1. Comparative Matrix of SOTA Baselines

| Model | Organization | Architecture / Trunk | Action Representation | Control Freq | Multimodal Inputs | Weight Status | License | Key Deficiencies |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **π0** | Physical Intelligence | Flow Matching + VLM Trunk | Continuous Flow Matching | 50 Hz | RGB, Joint Proprioception | Closed | Proprietary | Proprietary, no tactile integration, high edge compute req |
| **OpenVLA-7B** | Stanford / Berkeley | Llama-2-7B + SigLIP + DINOv2 | 256-bin Discrete Autoregression | ~3-5 Hz | RGB, Text | Open | Apache 2.0 | High latency (>200ms), single-arm bias, no force/torque |
| **Octo-Base** | Octo Model Team | Transformer + Diffusion Head | Continuous Denoising Diffusion | 10-20 Hz | RGB, Wrist Cam, Proprio | Open | MIT | Struggles with high-DoF humanoid bi-manual tasks |
| **ACT** | Stanford | C-VAE + Transformer | Action Chunks (16-100 steps) | 30-50 Hz | RGB, Joint Pos | Open | MIT | Requires per-task teleop data, poor zero-shot transfer |
| **GR-1** | Fourier Intelligence | GPT-style Transformer | Autoregressive Action Prediction | 10 Hz | RGB, Ego Video | Semi-Open | Research Only | Low frequency, unverified stability in dynamic contact |
| **RoboCodeX** | ByteDance | VLM + Code Generation | API Call / Waypoints | <1 Hz | RGB, Text | Open | Apache 2.0 | High-level planning only, cannot execute closed-loop motor control |

### 2. Architectural Deep-Dive into Failure Modes
1. **OpenVLA-7B Action Drift:**
   * Discretization causes oscillatory motor commands when target poses lie between quantization boundaries.
   * Lack of temporal chunking results in myopic single-step decisions vulnerable to compounding error.
2. **Diffusion Policy Latency Bottleneck:**
   * Standard 10–20 step DDIM sampling induces 60–120 ms latency per query, limiting reactive slip compensation. Flow matching with single-step or few-step Euler integration is required.
3. **Absence of Closed-Loop Joint Torque Feedback:**
   * Baselines output kinematic targets (joint positions $\mathbf{q}_{t+1}$ or Cartesian end-effector velocities $\Delta \mathbf{x}$). When physical obstructions occur, positional control generates catastrophic motor over-currents without safety limits.
