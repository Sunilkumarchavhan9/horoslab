# HOROS First-Party Model Program: PROBE-1
## 05 — Benchmark Design & Evaluation Suite

### 1. Multi-Tiered Evaluation Methodology
Evaluation is structured across three concentric tiers to prevent simulation overfitting and guarantee physical safety:

```
┌───────────────────────────────────────────────────────────────┐
│ Tier 1: Digital Physics Sim Benchmarks (Scale: 10,000+ runs)  │
│ - Isaac Lab Bi-manual Benchmark                               │
│ - Robosuite & LIBERO Long-Horizon Suite                       │
│ - Humanoid Locomotion Disturbance Suite                       │
└──────────────────────────────┬────────────────────────────────┘
                               │ Promoted Candidates
                               ▼
┌───────────────────────────────────────────────────────────────┐
│ Tier 2: Real-World Twin Test Cells (Scale: 200 runs)           │
│ - Standardized Peg-in-Hole Assembly (1mm, 0.5mm clearance)    │
│ - Articulated Cabinet & Drawer Sequencing                     │
│ - Dynamic Ball Catching & Object Throwing                     │
└──────────────────────────────┬────────────────────────────────┘
                               │ Certified Safe Models
                               ▼
┌───────────────────────────────────────────────────────────────┐
│ Tier 3: Unconstrained Physical Validation (Scale: 50 missions) │
│ - Humanoid Bipedal Navigation through Crowded Office          │
│ - Industrial Tool Handling & Cable Routing                    │
│ - Extreme Disturbance Recovery (push, slip, payload drop)     │
└───────────────────────────────────────────────────────────────┘
```

### 2. Standardized Tasks & Evaluation Metrics

#### Task Category A: Bi-manual Fine Manipulation
1. **Precision Dual-Arm Insertion:** Two arms coordinate to align and insert a flexible cable connector into an oscillating socket.
   * *Metric:* Success rate within 30 seconds; peak contact force ($< 15\text{ N}$).
2. **Dynamic In-Hand Reorientation:** Rotate an irregular object (drill, bottle, block) using multi-finger tactile sensing without dropping.
   * *Metric:* Angular displacement achieved before drop; slip events detected and arrested.

#### Task Category B: Full-Body Humanoid Locomotion & Manipulation
1. **Push-Recovery Under Load:** Humanoid carrying a 10 kg payload receives a lateral 120 N impulse force at the torso.
   * *Metric:* Footstep recovery count; zero fall events; pitch/roll angle $< 12^\circ$.
2. **Whole-Body Reaching & Lifting:** Bend knees, adjust pelvis, balance on uneven slope, grasp heavy object from floor, and place onto high shelf.
   * *Metric:* Center-of-mass stability margin; joint torque saturation percentage.

### 3. Automated Benchmark Scoring Formula
The PROBE-1 Comprehensive Score ($S_{\text{PROBE}}$) is computed as:
$$S_{\text{PROBE}} = 0.40 \cdot R_{\text{task}} + 0.25 \cdot (1 - P_{\text{force}}) + 0.20 \cdot F_{\text{norm}} + 0.15 \cdot S_{\text{safety}}$$
where:
* $R_{\text{task}} \in [0, 1]$ is task completion success rate.
* $P_{\text{force}} \in [0, 1]$ is normalized peak force violation penalty.
* $F_{\text{norm}} = \min(1.0, f_{\text{hz}} / 100.0)$ is normalized control frequency adherence.
* $S_{\text{safety}} \in \{0, 1\}$ is binary compliance with independent safety limit checks.
