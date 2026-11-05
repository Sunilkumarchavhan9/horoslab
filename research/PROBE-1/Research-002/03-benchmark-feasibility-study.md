# HOROS PROBE-1 — Research-002
# Technical Feasibility & Baseline Codebase Inspection: ContactWorld & CaPTURe

**Document ID:** HOROS-PROBE1-R002-DOC-03  
**Project:** HOROS PROBE-1 — Humanoid Robotics  
**Topic:** Trustworthy Action-Conditioned Contact World Models  
**Status:** Step 1 Codebase Feasibility Completed  
**Author:** HOROS Research Team  

---

## 1. Executive Summary & Feasibility Goals

Section 11, Step 3 of the Research Charter requires a rigorous technical feasibility audit of the two primary baseline candidates:
1. **ContactWorld** (`https://github.com/PokuangZhou/ContactWorld`) — for multi-modal contact world modeling and CEM planning.
2. **CaPTURe** (`https://github.com/Marques-P/captures`) — for particle-based contact-stratified conformal uncertainty calibration.

The core objective is to decide:
- *Can either repository be executed directly as our benchmark?*
- *What environment isolation boundaries are mandatory to prevent contaminating the active HOROS PROBE-1 Isaac Sim 5.1 / Isaac Lab 2.3 infrastructure?*
- *Should we build a clean, native Isaac Lab benchmark paired with isolated baseline reproduction?*

---

## 2. Detailed Inspection of ContactWorld

### 2.1 Repository Architecture & Assets
- **Repository URL:** `https://github.com/PokuangZhou/ContactWorld`
- **Tracked Tasks (12 Contact-Rich Tasks):**
  - Peg-in-hole (square, round, hexagonal)
  - USB insertion
  - Gear assembly
  - Block sliding with friction transitions
  - In-hand reorientation
  - Bottle cap unscrewing
- **Sensing Modalities Tracked:**
  - Joint positions & velocities (proprioception)
  - External RGB-D cameras (wrist + static third-person)
  - High-density tactile arrays (DIGIT & GelSight taxels simulated via TacSL)
  - 3D point clouds extracted from depth cameras

### 2.2 Deep Architectural Code Scan
Inspection of ContactWorld's core modeling files (`models/jepa_world_model.py`, `models/recurrent_predictor.py`, `planner/cem.py`):
1. **Predictive Backbone:**
   - Visual encoder: Vision Transformer (ViT-S/16) or lightweight ResNet-18.
   - Tactile encoder: 2D CNN extracting taxel displacement embeddings.
   - Multimodal fusion: Cross-attention layer fusing visual, tactile, and proprioceptive features into a latent representation $z_t \in \mathbb{R}^{512}$.
   - Predictor head: Recurrent GRU / MLP taking $(z_t, a_t)$ and outputting next latent state $\hat{z}_{t+1}$.
2. **Uncertainty Audit (Zero Explicit Uncertainty):**
   - The loss function is strictly deterministic MSE / InfoNCE:
     $$\mathcal{L}_{\text{JEPA}} = \|\text{StopGrad}(z_{t+1}) - \hat{z}_{t+1}\|_2^2$$
   - **No variance ($\sigma^2$), no log-variance head, no heteroscedastic loss, and no ensemble heads are implemented.**
   - The model makes deterministic point predictions and cannot quantify when it enters out-of-distribution physical regimes.
3. **Planner Architecture:**
   - Cross-Entropy Method (CEM) sampling 1,000 action trajectories of horizon $H \in \{6, 12, 24, 48\}$.
   - Elite fraction: $\alpha = 0.10$ (top 100 trajectories).
   - Iterations: $N_{\text{iter}} = 5 \text{ to } 10$.
   - **Planner Vulnerability:** Because the predictive head is completely deterministic, CEM aggressively exploits unpenalized high-reward predictions where the model's physics are invalid.

### 2.3 Software Dependencies & Environment Conflict Audit
The installation script (`install.sh`) executes:
```bash
# ContactWorld install chain:
git clone https://github.com/PokuangZhou/ManiFeel.git
cd ManiFeel && pip install -e .
wget https://.../IsaacGym_Preview_4_Package.tar.gz
tar -xvf IsaacGym_Preview_4_Package.tar.gz
pip install -e isaacgym/python
pip install -e TacSL/
```

**Critical Conflict Findings:**
| Dependency | ContactWorld Requirement | HOROS PROBE-1 Production Standard | Compatibility Status |
| :--- | :--- | :--- | :--- |
| **Physics Engine** | Isaac Gym Preview 4 (Deprecated PhysX 4) | Isaac Sim 5.1 / Isaac Lab 2.3 (PhysX 5 + GPU Tensor API) | **FATAL INCOMPATIBILITY** |
| **Python Version** | Python 3.7 / 3.8 | Python 3.10 / 3.11 | Incompatible |
| **CUDA / Torch** | CUDA 11.7 / PyTorch 1.13 | CUDA 12.2 / PyTorch 2.3+ | ABI Incompatible |
| **Simulator Model** | Legacy `.urdf` standalone meshes | Modern Universal Scene Description (USD) + RigidContactView | Non-transferable |

### 2.4 Licensing Audit
- Inspection of the root repository and sub-packages did not reveal an OSI-approved open-source license file (no `LICENSE` or `LICENSE.md` file).
- The embedded Isaac Gym Preview 4 binaries and assets carry NVIDIA's restrictive developer license, which prohibits redistribution.
- **Rule:** We cannot vendor or redistribute ContactWorld code inside the primary HOROS PROBE-1 codebase.

---

## 3. Detailed Inspection of CaPTURe

### 3.1 Mathematical & Code Formulation
- **Repository URL:** `https://github.com/Marques-P/captures`
- **Method:** Split Conformal Prediction for particle ensembles in Stratified Configuration Spaces:
  1. Forward propagation of a particle cloud $\{q_{t+1}^{(i)}\}_{i=1}^P$ using learned or physics-based transition models.
  2. Classification of contact strata $\Sigma(q, a) \in \{\text{Free}, \text{Contact}_1, \dots, \text{Contact}_K\}$.
  3. Non-conformity score function:
     $$s_i = \min_{j} \|q_{t+1}^{\text{true}} - q_{t+1}^{(j)}\| \cdot w(\Sigma_k)$$
  4. Conformal quantile computation $\hat{q}_{1-\alpha}$ over held-out calibration trajectories.
- **Code Portability:**
  - Implemented cleanly in standard PyTorch, NumPy, and SciPy.
  - Does **not** require Isaac Gym Preview; can evaluate against PyBullet, Pinocchio, or Isaac Lab contact logs.
- **Feasibility Assessment:**
  **Highly Reusable.** We can import and adapt CaPTURe’s particle-based conformal calibration routines directly into our research harness.

---

## 4. Benchmark Decision: Two-Tier Architecture

To protect our production environment while ensuring 100% fair baseline comparison, HOROS PROBE-1 adopts a **Two-Tier Architecture**:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    HOROS PROBE-1 RESEARCH-002 ARCHITECTURE                      │
├─────────────────────────────────────────────────┬───────────────────────────────┤
│ Tier 1: Isolated Baseline Replica Container    │ Tier 2: Native HOROS Benchmark│
│ (Docker / Conda `env-contactworld`)             │ (Isaac Sim 5.1 / Isaac Lab 2.3)│
├─────────────────────────────────────────────────┼───────────────────────────────┤
│ • Ubuntu 20.04 / Python 3.8 / CUDA 11.7         │ • Ubuntu 22.04 / Python 3.10  │
│ • Isaac Gym Preview 4 + TacSL                   │ • Isaac Lab 2.3 + PhysX 5 GPU │
│ • Cloned ContactWorld repo & weights            │ • High-frequency ContactSensor│
│ • Replicates exact reported CoRL numbers        │ • State-Wrench-Mode tuples    │
│ • Tests CEM exploitation on original model      │ • Evaluates all 5 baselines   │
│ • Outputs trajectory logs & metrics to JSON     │ • Runs p-CBF runtime safety   │
└─────────────────────────────────────────────────┴───────────────────────────────┘
```

### Strategic Advantages of This Design:
1. **Zero Contamination:** The active PROBE-1 development workstation remains clean; legacy Isaac Gym dependencies are quarantined inside a dedicated Docker container.
2. **Defensible Science:** Reviewers cannot claim that baselines were handicapped or misimplemented, because ContactWorld's original checkpoints and scripts run in their native environment.
3. **Future-Proof Benchmark:** The native Isaac Lab 2.3 benchmark provides reproducible USD assets, accurate friction cones, and high-speed multi-GPU rollouts for the entire robotics community.
