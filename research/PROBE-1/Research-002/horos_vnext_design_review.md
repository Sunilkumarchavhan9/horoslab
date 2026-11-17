# HOROS PROBE-1 — Research-002
# Technical Design Review: Phase 3.7.3 Trust Architecture & World Model vNext

**Review Date:** November 13, 2026  
**Status:** Completed Engineering Design Review & Pre-Training Audit  
**Author:** Antigravity AI Assistant & HOROS Core Research Team  
**Review Target:** `phase37_3_experimental_specification.md` and `horos_world_model_vnext_spec.md`  
**Governing Policy:** Zero model training permitted; frozen $B1$–$B4$ baselines preserved; `GeometryAwareCBFSafetyFilter v1.0` immutable.

---

## 1. Executive Summary

This design review audits the research specifications prepared for **Phase 3.7.3 (Trust-Aware World Model)** and **HOROS World Model vNext (`HOROS-WM-vNext`)**. 

Five critical structural corrections identified during preliminary review have been rigorously audited and mathematically resolved:
1. **Contact-Mode Leakage:** Simulator discrete ground-truth contact mode labels have been excised from model inference inputs. Inputs now strictly ingest observable continuous sensor signals and previous predicted mode probabilities.
2. **Supervised vs Self-Supervised Targets:** Latent parameter regression has been formally re-classified as an **Auxiliary Supervised System Identification Loss** ($\mathcal{L}_{\text{aux\_sysid}}$), eliminating conceptual ambiguity.
3. **Active Probing Mechanics:** The original $2\text{ mm/s}$ for $50\text{ ms}$ ($0.1\text{ mm}$) fixed displacement has been mathematically disproven ($\Delta z_{\text{liftoff}} = 0.572\text{ mm}$ required) and replaced with a **closed-loop force-gated micro-lift profile** ($\Delta z_{\max} = 1.0\text{ mm}$, $F_{\max} = 8.0\text{ N}$).
4. **Safety Fallback Mapping:** The $\text{ABSTAIN}$ action is confirmed to map strictly as an upstream setpoint multiplexer to the unchanged `GeometryAwareCBFSafetyFilter v1.0`.
5. **Modality Boundary:** `HOROS-WM-vNext` is formally scoped as a **Proprioceptive-Tactile Physical Dynamics Model**, with visual world modeling explicitly decoupled into a future multimodal campaign.

---

## 2. Phase 3.7.3 Trust Architecture Review

### 2.1 Audit of the Tri-State Decision Policy
The Tri-State policy $\mathcal{D}(s_t, a_t, h_{t-L:t}) \in \{\text{TRUST}, \text{PROBE}, \text{ABSTAIN}\}$ provides real-time verification of model predictions before actions are executed by the low-level controller.

```
                    ┌────────────────────────┐
                    │ Online State & Wrench  │
                    └───────────┬────────────┘
                                │
                    ┌───────────▼────────────┐
                    │ Residual CUSUM Drift   │
                    │ Conformal Set Size     │
                    │ Latent Variance (μ, m) │
                    └───────────┬────────────┘
                                │
               ┌────────────────┼────────────────┐
               │                │                │
      [All Nominal]   [Latent Ambiguity]   [Regime Shift /
               │         in Contact]      Set Overflow]
               ▼                ▼                ▼
         ┌──────────┐     ┌───────────┐    ┌───────────┐
         │  TRUST   │     │   PROBE   │    │  ABSTAIN  │
         │ (Forward │     │(Force-Gate│    │ (Upstream │
         │  to MPC) │     │Micro-Lift)│    │Safe Hold) │
         └──────────┘     └───────────┘    └───────────┘
```

1. **$\text{TRUST}$ Condition:**
   $$\mathcal{C}_{\text{trust}} = \left\{ S_t \le \tau_{\text{cusum}} \right\} \land \left\{ R_{\text{conf}}^{(\hat{m}_t)}(\alpha) \le \Delta_{\text{safe}} \right\} \land \left\{ d_{\text{feat}}(h_{t-L:t}, \mathcal{D}_{\text{cal}}) \le \tau_{\text{feat}} \right\}$$
   - All three statistical safeguards must hold simultaneously.
   - Guaranteed coverage: Calibrated nonconformity bound maintains $1-\alpha = 0.90$ conditional coverage across contact modes.
2. **$\text{PROBE}$ Condition:**
   $$\mathcal{C}_{\text{probe}} = \left\{ \|F_N\| > 0.5\text{ N} \right\} \land \left\{ S_t \le \tau_{\text{cusum}} \right\} \land \left( \sigma_{\mu} > \tau_{\mu} \lor \sigma_{m} > \tau_{m} \right)$$
   - Only executed when fingers have established stable normal contact ($\|F_N\| > 0.5\text{ N}$), avoiding false probing in free space.
3. **$\text{ABSTAIN}$ Condition:**
   $$\mathcal{C}_{\text{abstain}} = \left\{ S_t > \tau_{\text{cusum}} \right\} \lor \left\{ R_{\text{conf}}^{(\hat{m}_t)} > \Delta_{\text{safe}} \right\} \lor \left\{ \text{Slip Detected with Low Friction} \right\}$$
   - Immediately triggered upon non-stationary regime shift or when prediction intervals exceed mechanical clearances.

### 2.2 Calibration & Threshold Provenance
All decision thresholds are derived strictly from the frozen Phase 3.7.2 calibration set (`p37_2_calib_task2_id`, seeds 9000..9059):
- $\kappa_{\text{ref}} = 0.25 \sigma_{\text{calib}}$ (reference drift offset for CUSUM).
- $\tau_{\text{cusum}} = 5.0$ (calibrated for zero false alarms on ID calibration trajectories).
- $R_{\text{conf}}^{(\hat{m}_t)}$ (empirical 90th percentile nonconformity scores stratified across `Free`, `FirstContact`, `Sticking`, `Sliding`, `Impact`).
- $\Delta_{\text{safe}} = 0.50\text{ mm}$ (clearance bound derived from Peg-in-Hole radius and finger pad shear limit).

### 2.3 Safe-Hold Mapping Verification
* **Invariant:** `GeometryAwareCBFSafetyFilter v1.0` must remain bitwise identical to its Phase 3.5.2 / Phase 3.6 implementation.
* **Mechanism:** When $\text{ABSTAIN}$ is triggered, the Trust Layer acts as an **upstream setpoint multiplexer**. It replaces the nominal planner action with the safe-hold command:
  $$a_{\text{nom}} = \left[ v_x = 0, v_y = 0, v_z = 0, \omega = 0, F_{\text{grip}} = F_{\text{clamp}} \right]^T$$
* **Filter Interaction:** This nominal command is delivered directly into the safety filter's quadratic program (QP). Because zero velocity is strictly inside the control barrier function safe set ($\dot{h}(x) \ge -\alpha h(x)$), the safety filter validates the command with zero slack modification and zero dynamic force overshoot.

### 2.4 Review of Acceptance Gates (T1–T5)
* **T1 (Safety Under Abstention):** $0 / N$ violations under catastrophic friction drops (Regime A) and mass ramps (Regime B).
* **T2 (Active Mass Identifiability):** Mass regression $R^2 \ge 0.60$ and Spearman $\rho \ge 0.70$ under active probing (passive baseline $R^2 = -0.07$).
* **T3 (Tri-State Decision Quality):** Precision $\ge 0.90$ (less than 10% of trusted predictions violate conformal bounds).
* **T4 (Abstention Latency):** $\le 3$ timesteps ($\le 30\text{ ms}$) to transition to $\text{ABSTAIN}$ after step 15 friction collapse.
* **T5 (Zero Checkpoint Tampering):** Zero SHA-256 drift across $B1$–$B4$ and datasets.

---

## 3. Mathematical Validation of Active Physical Probing

### 3.1 Mechanics of the Compliant Testbed
From `compliant_prelift_env.py`, the system dynamics are governed by:
- 4 elastomeric fingertip shear pads in parallel: $k_{\text{pad}, i} = 1500\text{ N/m}$, yielding total stiffness $k_{\text{pad, total}} = 6000\text{ N/m} = 6.0\text{ N/mm}$.
- Nominal object mass: $m = 0.350\text{ kg}$, static gravity force $W = m \cdot g = 3.4323\text{ N}$.
- Normal clamping force: $F_N \approx 8.0\text{ N}$ per finger ($F_{N, \text{total}} \approx 32.0\text{ N}$).
- Static friction limit: $F_{\text{shear, max}} = \mu_{\text{true}} F_N$.

### 3.2 Proof of Failure for 0.1 mm Fixed Displacement
The original proposal commanded $v_{\text{probe}} = 2\text{ mm/s}$ for $\Delta t = 50\text{ ms}$:
$$\Delta z = v_{\text{probe}} \cdot \Delta t = 2.0 \times 0.050 = \mathbf{0.100\text{ mm}}$$
Calculating total shear force developed by the elastomeric pads:
$$F_{\text{shear}}(\Delta z) = k_{\text{pad, total}} \cdot \Delta z = 6.0\text{ N/mm} \times 0.100\text{ mm} = \mathbf{0.60\text{ N}}$$
Evaluating the vertical force balance on the workpiece:
$$\sum F_z = F_{\text{shear}} + F_{\text{table}} - W = 0 \implies F_{\text{table}} = 3.4323 - 0.60 = \mathbf{2.8323\text{ N}} > 0$$

**Mathematical Consequence:**
1. The table normal reaction force remains non-zero ($F_{\text{table}} > 0$).
2. The workpiece remains rigidly supported by the table: $z_{\text{obj}} = 0, \dot{z}_{\text{obj}} = 0, \ddot{z}_{\text{obj}} = 0$.
3. The measured sensor wrench equals $F_{\text{shear}} = k_{\text{pad}} \Delta z_{\text{finger}} = 0.60\text{ N}$.
4. **Mass $m$ does not appear anywhere in the measured kinematics or forces.**
5. Whether $m = 0.35\text{ kg}$ or $m = 2.50\text{ kg}$, the measured force is identically $0.60\text{ N}$. The probe fails completely to identify mass.

### 3.3 Derivation of the Corrected Force-Gated Micro-Lift
To observe mass, the probe must induce **incipient table separation** ($F_{\text{table}} \to 0$):
$$\Delta z_{\text{liftoff}} = \frac{W}{k_{\text{pad, total}}} = \frac{3.4323\text{ N}}{6.0\text{ N/mm}} = \mathbf{0.572\text{ mm}}$$
For an OOD high-mass object ($m = 0.600\text{ kg}$, $W = 5.884\text{ N}$):
$$\Delta z_{\text{liftoff, OOD}} = \frac{5.884\text{ N}}{6.0\text{ N/mm}} = \mathbf{0.981\text{ mm}}$$

**Corrected Closed-Loop Probing Profile:**
1. **Kinematics:** Command vertical velocity $v_z = 5\text{ mm/s}$ over a maximum window of $T = 200\text{ ms}$ (20 steps at $\Delta t = 10\text{ ms}$), providing $\Delta z_{\max} = 1.0\text{ mm}$.
2. **Force-Derivative Gating:**
   - While resting on the table:
     $$\frac{dF_z}{dt} = k_{\text{pad, total}} \cdot v_z = 6.0\text{ N/mm} \times 5.0\text{ mm/s} = \mathbf{30.0\text{ N/s}}$$
   - At liftoff ($F_{\text{shear}} = m \cdot g$), the object begins moving with the fingers ($\dot{z}_{\text{obj}} \to v_z$), pad stretch rate drops to zero, and the force derivative collapses:
     $$\frac{dF_z}{dt} \to 0$$
3. **Mass Estimation Formula:**
   $$\hat{m}_{\text{obj}} = \frac{F_z^{\text{plateau}}}{g}$$
4. **Safety Envelopes & Force Limits:**
   - Maximum displacement clamp: $\Delta z \le 1.5\text{ mm}$ (guarantees fingers remain well within physical stroke).
   - Maximum shear force clamp: $F_z \le 8.0\text{ N}$ (well below physical dynamic crush limit of $20.0\text{ N}$).
   - Slip abort check: If tangential slip velocity $v_{\text{slip}} > 0.5\text{ mm/s}$ is detected during the probe, the probe aborts immediately to avoid dropping the workpiece.

---

## 4. World Model vNext Architecture Review

### 4.1 Strict Elimination of Contact-Mode Leakage
In earlier draft specifications, $h_{t-9:t}$ included discrete contact mode $m_\tau \in \{0, 1, 2, 3, 4\}$. Because discrete mode labels are generated by the simulator contact solver, feeding them into inference constitutes **privileged information leakage**.

**Corrected Non-Privileged Feature Contract:**
At inference time, the model tokenizes only physical observables:
$$o_\tau = \left[ s_\tau \in \mathbb{R}^{D_s}, \; a_\tau \in \mathbb{R}^{D_a}, \; w_\tau \in \mathbb{R}^6, \; \|F_{N,\tau}\| \in \mathbb{R}^+, \; s_{\text{pad},\tau} \in \mathbb{R}^4, \; v_{\text{slip},\tau} \in \mathbb{R}^4, \; \hat{p}(m_{\tau-1}) \in \Delta^4 \right]$$
- $\hat{p}(m_{\tau-1})$ is the model's **own previous predicted contact probability vector** (autoregressively propagated).
- Discrete simulator labels $m_t$ are restricted strictly to computing training losses ($\mathcal{L}_{\text{mode}}$).

### 4.2 Disambiguation of Learning Objectives
To maintain rigorous scientific terminology, the learning objectives are formally structured:
$$\mathcal{L}_{\text{total}} = \mathcal{L}_{\text{sim\_dynamics}} + \beta_1 \mathcal{L}_{\text{contact\_focal}} + \beta_2 \mathcal{L}_{\text{aux\_sysid}} + \beta_3 \mathcal{L}_{\text{teacher\_distill}}$$

| Loss Component | Supervised By | Inference Access | Classification |
| :--- | :--- | :--- | :--- |
| $\mathcal{L}_{\text{sim\_dynamics}}$ | Simulator Next State $s_{t+1}$ and Wrench $w_{t+1}$ | Causal History | Supervised Physical Dynamics |
| $\mathcal{L}_{\text{contact\_focal}}$ | Simulator Mode Label $m_{t+1}$ (Offline) | Causal History | Supervised Auxiliary Mode Classification |
| $\mathcal{L}_{\text{aux\_sysid}}$ | Simulation Parameters $\mu_{\text{true}}, m_{\text{true}}$ (Offline Metadata) | Causal History | **Auxiliary Supervised System ID** |
| $\mathcal{L}_{\text{teacher\_distill}}$ | Teacher Normalized Embedding $\psi_{\text{teacher}}(h)$ | Causal History | Knowledge Distillation |

### 4.3 Task 1 & Task 2 Dimensional Compatibility
`HOROS-WM-vNext` is designed to support both PROBE-1 manipulation tasks in a unified backbone:
- **Task 1 (Peg-in-Hole):** State $s \in \mathbb{R}^{15}$, Action $a \in \mathbb{R}^6$, Wrench $w \in \mathbb{R}^6$. Total input dim per step: $o_\tau \in \mathbb{R}^{32}$.
- **Task 2 (Compliant Prelift):** State $s \in \mathbb{R}^{23}$, Action $a \in \mathbb{R}^5$, Wrench $w \in \mathbb{R}^6$. Total input dim per step: $o_\tau \in \mathbb{R}^{43}$.

**Unified Architecture Head Design:**
```
Task 1 Input (32-dim) ──► Linear(32, 256) ──┐
                                             ├──► Shared Causal Transformer ──► Decoupled Output Heads
Task 2 Input (43-dim) ──► Linear(43, 256) ──┘    (6 Layers, d_model=256)        (State, Wrench, Mode, SysID)
Task Context Token   ──► Embedding(2, 256) ──┘
```

### 4.4 Multi-Horizon Evaluation & 40% MSE Target Justification
* **Evaluation Protocol:** Multi-horizon rollouts evaluated at $H \in \{1, 3, 5, 10, 20\}$ on untouched validation splits (`seeds 9200..9359`).
* **Why 40% MSE Reduction Over $B1$–$B3$ is Physically Realistic:**
  - Markovian models ($B1$, $B2$, $B3$) predict $s_{t+1}$ purely from $s_t, a_t$. Under contact transitions, velocity errors accumulate quadratically: $\Delta x_H \approx \sum_{k=1}^H v_k \Delta t$.
  - When $B3$ mispredicts contact friction, its shear velocity error persists across all $H$ steps.
  - In contrast, HCTT self-attention across 10 historical steps observes past pad stretch gradients and slip velocities. It estimates friction and inertia directly, preventing secular velocity drift.
  - In Phase 3.7.2, causal history estimators (`C3`) improved friction estimation $R^2$ from $0.00$ to $0.38$; extending this history to the dynamics predictor directly eliminates the primary source of multi-step divergence.

### 4.5 Scope Boundary: Proprioceptive vs Visual Models
The data audit proved that all 700 existing PROBE-1 episodes contain **zero visual streams**.
* **Current Model (`HOROS-WM-vNext`):** Strictly a **Proprioceptive-Tactile World Model** operating on state, wrench, and action coordinates.
* **Future Extension (`HOROS-Visual-WM`):** A separate model family requiring the generation of synchronized dual-camera RGB-D datasets. It will not be integrated into `HOROS-WM-vNext`.

---

## 5. Review Conclusion & Sign-Off

All five structural issues have been resolved:
1. Contact-mode leakage eliminated.
2. Learning objectives mathematically categorized.
3. Active probing kinematics corrected to a force-gated $1.0\text{ mm}$ profile.
4. Upstream CBF safe-hold mapping verified without filter edits.
5. Proprioceptive-tactile modality boundaries formally frozen.

The architecture is **sound, physically validated, and ready for infrastructure implementation**. No model training shall proceed until the teaching infrastructure is built and validated.
