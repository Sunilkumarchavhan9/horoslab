# HOROS PROBE-1 — Research-002
## Stage P2.4: Active Data Collection Protocol & Episode Deduplication
**Program:** HOROS PROBE-1 — Humanoid Robotics & Physical AI  
**Project:** Research-002: Trustworthy Action-Conditioned Contact World Models  
**Document:** 21-active-data-collection-protocol.md  
**Status:** Protocol Specification  

---

## 1. Active Data Collection Workflow

The active mining loop operates in iterative rounds to acquire high-value training trajectories:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ACMM ACTIVE MINING LOOP                         │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Current World Model f_θ & Contact Mode Classifier C_ϕ               │
│                            │                                           │
│                            ▼                                           │
│ 2. Propose Candidate Rollouts (N_cand = 150) in Training Simulator    │
│    - Random Perturbation (D1)                                          │
│    - Boundary Perturbation (D2)                                        │
│    - Coordinated Physical Trajectories (D4)                           │
│                            │                                           │
│                            ▼                                           │
│ 3. Score Candidates via Acquisition Scorer: A(τ)                       │
│    - Entropy + Disagreement + Boundary + Optimism + Recovery           │
│                            │                                           │
│                            ▼                                           │
│ 4. Episode Deduplication (Trajectory Distance Metric d_traj > threshold)│
│                            │                                           │
│                            ▼                                           │
│ 5. Select Top-K Candidates (K = 60 budget per strategy)                │
│                            │                                           │
│                            ▼                                           │
│ 6. Admit into Augmented Training Store D_augmented = D0 ∪ D_mined     │
│                            │                                           │
│                            ▼                                           │
│ 7. Retrain World Model & Evaluate on Untouched Benchmark               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Trajectory Deduplication Specification

Acquiring identical or near-identical failure modes wastes collection budget and biases training data. We enforce a **Trajectory Diversity Filter**:

### 2.1 Trajectory Distance Metric
For two candidate trajectories $\tau_A = \{s_t^A\}_{t=0}^{H-1}$ and $\tau_B = \{s_t^B\}_{t=0}^{H-1}$ with contact mode sequences $M_A = \{m_t^A\}_{t=0}^{H-1}$ and $M_B = \{m_t^B\}_{t=0}^{H-1}$:

$$d(\tau_A, \tau_B) = \frac{1}{H} \sum_{t=0}^{H-1} \frac{\|s_t^A - s_t^B\|_2}{\bar{\sigma}_{\text{state}}} + \lambda_{\text{mode}} \cdot \left(1.0 - \frac{1}{H} \sum_{t=0}^{H-1} \mathbf{1}_{m_t^A = m_t^B}\right)$$

where $\bar{\sigma}_{\text{state}}$ is the standard deviation vector of states across the training set, and $\lambda_{\text{mode}} = 0.50$.

### 2.2 Admission Rule
Candidates are processed in descending order of acquisition score $A(\tau)$. A candidate trajectory $\tau^*$ is admitted to the selected pool $\mathcal{S}$ if and only if:
$$\min_{\tau \in \mathcal{S}} d(\tau^*, \tau) \ge d_{\text{min}}$$
where $d_{\text{min}} = 0.25$. If a candidate violates this distance threshold, it is marked as redundant and rejected.

---

## 3. Data Integrity & Frozen Split Invariance

1. **Untouched Test and Calibration Sets:**  
   The 40 calibration episodes and 30 test episodes generated in Stage P2.3 remain strictly untouched. Active mining runs exclusively in the training simulator instance.
2. **Deterministic Random Seeding:**  
   Candidate generation uses explicit seed offsets (`start_seed = 2000`) distinct from all prior calibration and test seeds.
3. **Artifact Provenance:**  
   Every mined trajectory is logged with its SHA-256 state hash, timestamp, acquisition breakdown scores, and selection rank.
