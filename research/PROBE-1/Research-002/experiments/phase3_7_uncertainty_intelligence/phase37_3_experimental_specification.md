# HOROS PROBE-1 — Research-002
## Phase 3.7.3 Experimental Specification: Trust-Aware World Model Architecture

**Author:** Antigravity AI Assistant & HOROS Research-002 Team  
**Date:** November 13, 2026  
**Status:** Pre-Registration Draft — Ready for Authorization (Execution Forbidden Until Approved)  
**Parent Investigation:** PROBE-1 Research-002 (Uncertainty Intelligence & Calibration)  
**Precondition:** Phase 3.7.2 Closed and Adjudicated  
**Frozen Baselines:** $B1$ (deterministic), $B2$ (probabilistic), $B3$ (5-member ensemble), $B4$ (conformal)

---

### 1. Executive Summary & Scientific Motivation

In Phase 3.7.2, we established three critical empirical findings:
1. **Temporal Innovation (`C2`):** CUSUM accumulation on causal prediction residuals reliably detects non-stationary physical regime shifts (Regime A friction step detected with AUROC **`0.8247`**).
2. **History-Conditioned Invariants (`C3`):** Causal interaction histories ($L=10$) spanning pad stretch, contact force, and tangential slip velocity identify latent friction ($\mu$ $R^2 = 0.38$, Spearman $\rho = 0.43$) and discriminate low-friction shifts (`LowMu` AUROC **`0.7946`**, $p = 0.04897$).
3. **Mode-Stratified Conformal Calibration (`C5`):** Mode-normalized nonconformity bounds restore joint multi-step coverage under severe OOD conditions to **`96.67%`** (ID–OOD gap $0.0333 \le 0.05$) and prevent dynamic impact undercoverage.
4. **The Physical Unobservability Bottleneck:** Under passive prelift dwell, object mass is mathematically unobservable ($R^2 = -0.07$, Regime B AUROC = $0.6158$) because normal force equals commanded grip force and the supporting surface absorbs residual weight.

**Objective of Phase 3.7.3:**  
To design, implement, and benchmark the **HOROS Trust-Aware World Model Architecture**—a decision layer that evaluates every model prediction in real-time and executes a **Tri-State Policy**:
$$\mathcal{D}(s_t, a_t, h_{t-L:t}) \in \{\text{TRUST}, \text{PROBE}, \text{ABSTAIN}\}$$

This layer prevents the robot from acting on ungrounded or overconfident physical predictions, commands active exploratory maneuvers to resolve latent physical ambiguities, and enforces safe fallback to `GeometryAwareCBFSafetyFilter v1.0` whenever physical invariants are violated.

---

### 2. Tri-State Decision Layer Architecture

```mermaid
flowchart TD
    subgraph S["Online Physical Observations"]
        O1["State s_t & Action a_t"]
        O2["ATI Nano17 Wrench (F_t, tau_t)"]
        O3["Interaction History h_{t-L:t}"]
    end

    subgraph WM["Frozen World Model (B1-B3)"]
        W1["Candidate Next State Prediction s_hat_{t+1}"]
        W2["Predicted Contact Mode m_hat_{t+1}"]
        W3["Ensemble Epistemic Std sigma_epi"]
    end

    subgraph TA["Trust-Aware Evaluation Layer"]
        T1["Signal 1: Mode-Stratified Conformal Radius R_conf (C5)"]
        T2["Signal 2: CUSUM Innovation Drift S_t (C2)"]
        T3["Signal 3: Latent Invariant Support & Feature Probing z_hist (C3)"]
    end

    subgraph D["Tri-State Decision Policy"]
        direction TB
        DEC{"Evaluate Decision Rule"}
        D_TRUST["TRUST: Forward s_hat_{t+1} to Controller"]
        D_PROBE["PROBE: Command Micro-Vertical Excitation Delta F_z"]
        D_ABSTAIN["ABSTAIN: Trigger Safe Hold (CBF Filter v1.0)"]
    end

    O1 & O2 & O3 --> WM
    WM --> W1 & W2 & W3
    W1 & W2 & W3 --> TA
    O2 & O3 --> TA
    TA --> T1 & T2 & T3
    T1 & T2 & T3 --> DEC
    DEC -->|All Signals Nominal| D_TRUST
    DEC -->|Contact Established + Latent Ambiguity| D_PROBE
    DEC -->|Regime Shift or Clearance Violation| D_ABSTAIN
```

#### Mathematical Formulation of the Tri-State Rules

1. **State 1: $\text{TRUST}$ (High Calibration & Physical Consistency)**
   A world model prediction $\hat{s}_{t+1}$ is deemed trustworthy if and only if all three validation checks hold simultaneously:
   $$\mathcal{C}_{\text{trust}} = \left\{ S_t \le \tau_{\text{cusum}} \right\} \land \left\{ R_{\text{conf}}^{(m_t)}(\alpha) \le \Delta_{\text{safe}} \right\} \land \left\{ d_{\text{feat}}(h_{t-L:t}, \mathcal{D}_{\text{cal}}) \le \tau_{\text{feat}} \right\}$$
   *Where:*
   - $S_t$ is the residual CUSUM statistic: $S_t = \max(0, S_{t-1} + \|s_t - \hat{s}_t\|_{\Sigma^{-1}} - \kappa_{\text{ref}})$.
   - $R_{\text{conf}}^{(m_t)}$ is the calibrated nonconformity radius for predicted contact mode $m_t$ at target coverage $1-\alpha = 0.90$.
   - $\Delta_{\text{safe}}$ is the physical safety threshold derived from geometry (e.g. lateral clearance $c$ for peg-in-hole; maximum allowable pad stretch for prelift).
   - $d_{\text{feat}}$ is the Mahalanobis/k-NN distance to the calibrated in-distribution feature support.
   *Action:* $\hat{s}_{t+1}$ is passed directly to the model-based trajectory optimizer.

2. **State 2: $\text{PROBE}$ (Active Information Gathering)**
   Triggered when contact is established ($m_t \in \{\text{Sticking}, \text{FirstContact}\}$), the CUSUM statistic is nominal ($S_t \le \tau_{\text{cusum}}$), but latent physical parameters (specifically object mass $m_{\text{obj}}$ or friction limit $\mu$) exhibit high epistemic uncertainty ($\sigma_{\text{latent}} > \tau_{\text{probe}}$):
   $$\mathcal{C}_{\text{probe}} = \left\{ m_t \in \text{ContactModes} \right\} \land \left\{ S_t \le \tau_{\text{cusum}} \right\} \land \left( \sigma_{\mu} > \tau_{\mu} \lor \sigma_{m} > \tau_{m} \right)$$
   *Active Physical Probing Protocol:*
   - Rather than committing to an unverified high-acceleration lift trajectory, the controller commands a calibrated micro-excitation action:
     $$a_{\text{probe}} = [v_x = 0, v_y = 0, v_z = +v_{\text{probe}}, \Delta F_{\text{grip}} = 0]^T$$
   - The probe lifts the fingers at low velocity ($v_{\text{probe}} = 2\text{ mm/s}$) over a short horizon ($\Delta t = 5\text{ steps} = 50\text{ ms}$).
   - *Physical Observability:* The vertical force sensor measures the gradient of shear force $dF_z / dt = k_{\text{pad}} v_z$. If $F_z$ plateaus before liftoff, $\mu$ is immediately identified ($\mu = F_z^{\text{plateau}} / F_N$). If liftoff occurs, object acceleration $\ddot{z}$ directly reveals mass: $m_{\text{obj}} = (F_z^{\text{lift}} - F_N^{\text{table}}) / (g + \ddot{z})$.
   - Once the probe confirms the parameter, the state transitions to $\text{TRUST}$.

3. **State 3: $\text{ABSTAIN}$ (Proactive Safety Fallback)**
   Triggered when any safety or validity constraint is breached:
   $$\mathcal{C}_{\text{abstain}} = \left\{ S_t > \tau_{\text{cusum}} \right\} \lor \left\{ R_{\text{conf}}^{(m_t)} > \Delta_{\text{safe}} \right\} \lor \left\{ \text{Slippage Detected with Low Friction} \right\}$$
   *Action:* The model immediately flags the prediction as ungrounded. Control is transferred to `GeometryAwareCBFSafetyFilter v1.0` in deterministic safe hold:
   - Command zero velocity: $v_x = 0, v_y = 0, v_z = 0, \omega = 0$.
   - Maintain clamping normal force: $F_N = F_{\text{clamp}}$.
   - Issue structured telemetry fault code: `ERR_WM_ABSTAIN_REGIME_DRIFT` or `ERR_WM_ABSTAIN_CONFORMAL_OVERFLOW`.

---

### 3. Five Research Workstreams in Phase 3.7.3

| Workstream | Investigation Focus | Key Research Question |
| :--- | :--- | :--- |
| **3.7.3-A** | **Tri-State Decision Calibration** | How should thresholds $(\tau_{\text{cusum}}, \tau_{\text{conf}}, \tau_{\text{feat}})$ be calibrated jointly on ID calibration data to optimize the trade-off between task throughput and safety? |
| **3.7.3-B** | **Active Vertical Probing for Mass Identifiability** | Can a 50 ms micro-vertical probe raise mass identification $R^2$ from $-0.07$ (passive baseline) to $\ge 0.60$ without dropping the object or violating contact stability? |
| **3.7.3-C** | **Probing-to-Trust Latency & Stability** | How many probing timesteps are required to transition from $\text{PROBE} \to \text{TRUST}$, and does the probe induce unwanted limit cycles or force overshoot? |
| **3.7.3-D** | **Abstention Safety & CBF Coordination** | Under abrupt friction collapse ($\mu = 0.60 \to 0.12$) or mass influx ($+0.25\text{ kg/s}$), does immediate $\text{ABSTAIN}$ prevent $100\%$ of crush/slip failures compared to naive $B3$ execution? |
| **3.7.3-E** | **Task 1 Peg-in-Hole Generalization** | Does active micro-probing in peg-in-hole (spiral torque probe) identify hole clearance and tilt before insertion jamming occurs? |

---

### 4. Pre-Registered Acceptance Gates (T1–T5)

To guarantee scientific rigor, Phase 3.7.3 establishes five explicit pre-registered acceptance gates:

| Gate | Acceptance Criteria | Target Threshold | Validation Dataset |
| :--- | :--- | :--- | :--- |
| **T1 — Safety Under Abstention** | Safety filter violations when $\text{ABSTAIN}$ is triggered under catastrophic shifts | **`0 / N` violations (`0.0%`)** | `p37_2_val_task2_ood` (60 episodes) |
| **T2 — Active Mass Identifiability** | $R^2$ and Spearman $\rho$ of latent mass estimation under active vertical probe | **$R^2 \ge 0.60$, $\rho \ge 0.70$** (Baseline: $R^2 = -0.07$) | `p37_2_val_task2_ood` (Regime B & HighMass) |
| **T3 — Tri-State Decision Quality** | Precision of $\text{TRUST}$ decisions (fraction of trusted predictions with error within conformal radius) | **Precision $\ge 0.90$** | Held-out validation splits |
| **T4 — Abstention Latency** | Timesteps between abrupt regime shift (Regime A $t=15$) and $\text{ABSTAIN}$ trigger | **$\le 3$ steps ($\le 30\text{ ms}$)** | `p37_2_val_task2_ood` (Regime A) |
| **T5 — Zero Checkpoint Tampering** | Bitwise immutability of $B1$–$B4$ checkpoints, safety filter code, and existing dataset files | **`0` SHA-256 mismatches** | Entire repository audit |

---

### 5. Frozen Boundaries & Governance

1. **No Training Permitted:** Phase 3.7.3 is an inference-time decision architecture. No world model weights shall be adjusted or fine-tuned.
2. **Immutable Calibration Artifacts:** The frozen Phase 3.4 $B4$ calibration JSON files on disk must remain strictly read-only.
3. **Safety Filter Primacy:** The trust-aware layer cannot override or bypass `GeometryAwareCBFSafetyFilter v1.0`; it acts as an upstream gating mechanism.
4. **Non-Privileged Inputs:** Ground-truth parameters ($\mu_{\text{true}}, m_{\text{obj}}, c_{\text{hole}}$) are strictly barred from the decision layer and probing estimator.
5. **Execution Hold:** No code execution or simulation runs shall begin until this specification and its accompanying manifest are formally approved.
