# HOROS First-Party Model Program: PROBE-1
## 03 — Dataset Audit, Data Contracts & Pipeline

### 1. Public Robotics Data Repositories

#### A. Open X-Embodiment (OXE)
* **Scale:** 1.0M+ robot trajectories, 22 different robot embodiments, 500+ skills.
* **Formats:** RLDS (Reinforcement Learning Dataset format) via TensorFlow Datasets.
* **Limitations:** Overwhelmingly single-arm tabletop manipulation (Franka Panda, UR5, WidowX). Very sparse bi-manual or mobile humanoid trajectories ($< 3\%$ of dataset). Inconsistent camera calibrations and coordinate frames.

#### B. DROID (Distributed Robot Optical Interaction Dataset)
* **Scale:** 76 hours of bi-manual and single-arm interaction across 564 diverse real-world scenes.
* **Quality:** High visual diversity, dual-camera RGB, carefully calibrated Franka arms.
* **Utility for PROBE-1:** Excellent source for pre-training visual representation and general manipulation affordances.

#### C. Humanoid & Dexterous Datasets
* **RH20T:** 110,000+ contact-rich manipulation trajectories with multi-view cameras, force-torque, and audio.
* **Ego4D / Ego-Exo4D:** 3,600+ hours of egocentric daily human activities. Essential for pre-training physical visual affordance priors before embodiment mapping.
* **DexYCB & OakInk:** High-resolution 3D hand-object interaction datasets with ground truth mesh pose and contact maps.

### 2. Synthetic Simulation Data Pipeline
To satisfy the demand for dynamic contact and locomotion recovery data, PROBE-1 employs an automated high-throughput simulation generation engine:
1. **Physics Engines:** NVIDIA Isaac Sim / Isaac Lab (Omniverse PhysX 5 GPU-accelerated dynamics) + MuJoCo Warp for ultra-fast trajectory rollout.
2. **Domain Randomization Parameters:**
   * Friction coefficients ($\mu \in [0.15, 1.2]$)
   * Link masses and center-of-mass perturbations ($\pm 15\%$)
   * Sensor noise and observation delays ($5\text{--}35$ ms)
   * Visual texture and lighting randomization (procedural PBR materials)
3. **Data Generation Capacity:** $100{,}000$ simulated trajectory hours generated per 24-hour cluster sweep across 64x H100 GPUs.

### 3. Unified Data Contract Schema (HOROS-Embodied-v1)
All trajectory records conform to the schema:
```json
{
  "trajectory_id": "probe1_real_bimanual_084920",
  "timestamp_ns": 1793390400000000000,
  "embodiment": "unitree_g1_dual_dexhand",
  "hz": 100,
  "observations": {
    "rgb_head": {"shape": [3, 480, 640], "encoding": "h265"},
    "rgb_wrist_left": {"shape": [3, 240, 320], "encoding": "h265"},
    "rgb_wrist_right": {"shape": [3, 240, 320], "encoding": "h265"},
    "proprio_joint_pos": {"dim": 29, "unit": "rad"},
    "proprio_joint_vel": {"dim": 29, "unit": "rad_s"},
    "proprio_joint_torque": {"dim": 29, "unit": "nm"},
    "tactile_left": {"dim": [16, 16], "unit": "kpa"},
    "tactile_right": {"dim": [16, 16], "unit": "kpa"},
    "imu": {"accel": [3], "gyro": [3]}
  },
  "actions": {
    "action_chunk": {"horizon": 32, "dim": 29, "type": "joint_impedance_target"},
    "gripper_left": {"horizon": 32, "dim": 6, "type": "continuous_finger_positions"},
    "gripper_right": {"horizon": 32, "dim": 6, "type": "continuous_finger_positions"}
  },
  "safety_envelope": {
    "max_torque_limit": [29],
    "collision_proximity_margin_m": 0.05
  }
}
```
