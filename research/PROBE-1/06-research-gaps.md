# HOROS First-Party Model Program: PROBE-1
## 06 — Critical Research Gaps & Deficiencies

### 1. Gap 1: Tactile Blindness in SOTA Foundation Models
* **Deficiency:** Nearly 98% of public robotics models rely solely on external cameras. However, during precise manipulation, the robot's own hands, grippers, and arms create complete visual occlusion of the contact patch.
* **PROBE-1 Solution:** Incorporate high-resolution tactile pressure distributions as first-class input tokens into the low-level policy, training explicit slip-prediction heads conditioned on shear stress differentials.

### 2. Gap 2: Catastrophic Compounding Errors in Open-Loop Rollouts
* **Deficiency:** When a VLA makes a micro-error at step $t=1$, the downstream observation at step $t=2$ shifts out-of-distribution (OOD). Models without continuous feedback trajectory correction diverge exponentially, leading to task failure.
* **PROBE-1 Solution:** Receding-horizon action chunking with high-frequency flow-matching replanning. The policy generates 32-step chunks but executes only the first 4 steps before re-conditioning on new sensory feedback.

### 3. Gap 3: Sim-to-Real Contact Discrepancy (The Reality Gap)
* **Deficiency:** Rigid-body simulators (e.g. standard PhysX, MuJoCo) approximate contact as instantaneous impulse constraints with idealized Coulomb friction, failing to replicate soft fingertip deformation, micro-slip, and backlash.
* **PROBE-1 Solution:** Tactile domain translation via CycleGAN/Diffusion surrogates, paired with real-world low-level impedance control compensation trained on real hardware telemetry.

### 4. Gap 4: Zero Formal Safety Guarantees in Neural Policies
* **Deficiency:** Neural network policies produce unbounded outputs. An OOD visual hallucination can command maximum velocity toward a human operator or the robot's own torso.
* **PROBE-1 Solution:** Architecture-level decoupling. PROBE-1 neural outputs are treated as **intent proposals**, which must pass through a real-time Quadratic Program (QP) / Control Barrier Function (CBF) filter that strictly enforces torque, velocity, and self-collision invariants.
