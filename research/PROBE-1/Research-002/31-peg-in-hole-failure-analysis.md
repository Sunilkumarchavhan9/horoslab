# HOROS PROBE-1 — Research-002
## Stage P2.5 Remediation: Precision Peg-in-Hole Failure Analysis
**Program:** HOROS PROBE-1 — Humanoid Robotics & Physical AI  
**Project:** Research-002: Trustworthy Action-Conditioned Contact World Models  
**Document:** `31-peg-in-hole-failure-analysis.md`  
**Status:** Diagnostic Failure Audit  

---

## 1. The Gating Failure: 0/150 Completed Insertions

In Stage P2.5, across all five dataset conditions ($M_0$ through $M_4$), evaluated across 30 held-out test episodes over a 25-step horizon ($H=25$, $dt=0.02$ s), the benchmark reported:
- **Completed Insertions:** $0/30$ (0.0%, 95% Wilson CI: [0.00, 11.35]%) in every condition (0/150 pooled).
- **Failure Taxonomy:** $30/30$ episodes classified as **Temporal Truncation ($F_{\text{trunc}}$)** in every condition.
- **Mean Progress:**
  - $M_0$ Passive: $10.62$ mm (Max: $14.41$ mm)
  - $M_1$ Random: $12.00$ mm (Max: $15.02$ mm)
  - $M_2$ Boundary: $11.45$ mm (Max: $14.96$ mm)
  - $M_3$ Uncertainty: $12.00$ mm (Max: $13.95$ mm)
  - $M_4$ ACMM: $11.45$ mm (Max: $14.30$ mm)

The peg consistently descended from its initial height ($z_{\text{init}} = +15.0 \pm 1.0$ mm) to the hole entrance ($z \approx 0.0$ mm), but **never penetrated into the hole chamber ($z \le -5.0$ mm)**.

---

## 2. Root Cause Analysis

We identified three compounding mechanisms responsible for the universal $F_{\text{trunc}}$ outcome:

### 2.1 The Inverted Depth Reward Artifact (Primary Cause)
In `MiningEvaluator` and `PlannerEvaluator`, the planner's reward function was specified as:

$$R_{\text{eval}}(s) = - \Big( 2.0 \cdot \|\text{pos}_{xy}\| + 1.5 \cdot \max(0.0, z) - 5.0 \cdot \min(0.0, z) + 0.1 \cdot \|F\| \Big)$$

Let us analyze the sign of the insertion term $-5.0 \cdot \min(0.0, z)$ under the outer negative sign:
- When the peg is above the hole ($z = +15.0$ mm):
  $$\min(0.0, 15.0) = 0.0, \quad \max(0.0, 15.0) = 15.0 \implies R(s) = -22.5$$
- When the peg reaches the entrance ($z = 0.0$ mm):
  $$\min(0.0, 0.0) = 0.0, \quad \max(0.0, 0.0) = 0.0 \implies R(s) = 0.0$$
- When the peg attempts to insert deeper ($z = -10.0$ mm):
  $$\min(0.0, -10.0) = -10.0 \implies -5.0 \cdot (-10.0) = +50.0 \implies R(s) = -50.0$$
- When the peg reaches the seating threshold ($z = -50.0$ mm):
  $$\min(0.0, -50.0) = -50.0 \implies -5.0 \cdot (-50.0) = +250.0 \implies R(s) = -250.0$$

**Mathematical Consequence:**  
The objective function has a steep global maximum situated exactly at the hole entrance ($z = 0.0$ mm). Any trajectory that descends past $z = 0$ is penalized at a rate of $-5.0$ per millimeter of depth. The CEM trajectory optimizer correctly converged to the peak of its given objective function: it drove the peg down from $+15$ mm to $0$ mm (yielding exactly the observed $11.5$–$15.0$ mm progress) and then actively maintained the peg hovering at the chamfer rim.

---

### 2.2 Travel Kinematics and Step Limits
The physical geometry of the fixture:
- Initial peg tip height: $z_{\text{init}} = +15.0$ mm.
- Chamfer contact zone: $z = 0.0$ mm.
- Seating threshold: $z_{\text{seated}} \le -50.0$ mm.
- Total required travel distance: $\Delta z = 15.0 - (-50.0) = 65.0$ mm.

With action command bounds clamped to $|dz| \le 5.0$ mm/step:
- Under unconstrained free motion, the absolute theoretical minimum is $65.0 / 5.0 = 13$ steps.
- In compliant contact with hole clearance ($0.5$ mm) and friction ($\mu = 0.5$), radial contact compliance and chamfer alignment dampen effective velocity:
  $$dz_{\text{effective}} \approx 1.5 - 2.5\text{ mm/step}$$
- A 25-step horizon provides at most $12 \times 5.0 + 13 \times 2.0 = 86$ mm of theoretical travel under perfect alignment. Any lateral correction or orientation re-alignment consumes steps. Expanding the evaluation horizon to $H = 40$ or $H = 60$ steps provides the required temporal budget for compliant chamfer search and insertion.

---

### 2.3 p-CBF Force Barrier Clamping
In `PredictiveCBFSafetyFilter`:
```python
# Force Barrier: prevent excessive downward plunge when contact force is near limit
h_force = self.max_normal_force - force_norm
if candidate_action[2] < -1.0 and h_force < 10.0:
    certified_action[2] = max(-0.2, candidate_action[2] * (h_force / 10.0))
    intervened = True
```
When the peg tip touches the chamfer rim, normal force spikes to $20$–$28$ N (below $F_{\max} = 35$ N, but with $h_{\text{force}} < 10$ N). The filter aggressively clamps downward velocity from $-5.0$ mm/step to $-0.2$ mm/step. When combined with the reward artifact penalizing $z < 0$, the planner never attempted to overcome the chamfer friction cone.

---

## 3. Remediation Strategy for Task 1

To isolate these factors rigorously without post-hoc goal moving:
1. **Preserve Physical Thresholds:** The success criterion remains strictly $z \le -50.0$ mm (50 mm insertion).
2. **Correct Objective Formulation:**
   - Test **Objective A (Corrected Linear):**  
     $$R_A(s) = -(2.0 \cdot \|\text{pos}_{xy}\| + 1.5 \cdot \max(0, z) + 5.0 \cdot \min(0, z) + 0.1 \cdot \|F\|)$$  
     (where $\min(0, z)$ is negative, so adding it inside the negated expression produces $+5.0$ reward per mm depth).
   - Test **Objective B (Seating-Guided):**  
     $$R_B(s) = 5.0 \cdot \max(0, -z) - 2.0 \cdot \|\text{pos}_{xy}\| - 0.5 \cdot \|\text{rot}_{xy}\| - 0.05 \cdot \|F\| + 100 \cdot \mathbb{I}(\text{seated})$$
3. **Horizon Sweep:** Evaluate $H \in \{25, 40, 60\}$ to measure whether temporal truncation converts to physical seating.
4. **Safety Filter Ablation:** Test with p-CBF ON and OFF to measure the damping effect of $h_{\text{force}}$.

