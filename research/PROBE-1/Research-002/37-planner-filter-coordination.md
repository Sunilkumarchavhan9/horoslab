# HOROS PROBE-1 — Research-002
## Stage P2.6: Planner-Filter Coordination Architecture
**Program:** HOROS PROBE-1 — Humanoid Robotics & Physical AI  
**Project:** Research-002: Trustworthy Action-Conditioned Contact World Models  
**Document:** `37-planner-filter-coordination.md`  
**Status:** Architecture Specification  

---

## 1. Bi-Directional Coordination vs. Decoupled Screening

In decoupled screening (Stage P2.5), the planner and filter operate without shared state:
$$\text{Planner} \xrightarrow{\quad a_{\text{planner}} \quad} \text{Filter} \xrightarrow{\quad a_{\text{exec}} = \Pi(a_{\text{planner}}) \quad} \text{Robot}$$

The planner is blind to why its proposed action was modified, and the filter is blind to the planner's ultimate objective.

In **Stage P2.6 Contact-Aware Coordination**, the planner and filter share barrier information at both planning time and execution time:

```
Decision Step t: Current State s_t
       │
       ▼
┌────────────────────────────────────────────────────────┐
│  Phase 1: Barrier-Feasible Action Polytope             │
│  Computes required preload F_n and max lift velocity   │
└────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────┐
│  Phase 2: Preload-Prioritized CEM Rollout               │
│  Rolls out N=60 candidates via Hybrid World Model     │
│  Penalizes sequences entering incipient slip/crush     │
│  Selects elite candidate sequence A*                   │
└────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────┐
│  Phase 3: Action Substitution Execution Layer          │
│  Evaluates real observation s_t                        │
│  Applies analytic preload boost & shear velocity scale │
└────────────────────────────────────────────────────────┘
       │
       ▼
  Execution in Simulator / Robot Hardware
```

---

## 2. Preload-Prioritized Sampling

In standard CEM, the initial Gaussian mean for actions is $\mu_a = [0, 0, 0, 0, 0]$. Squeezing and lifting are sampled symmetrically with variance $\sigma = 0.5$.

In **Preload-Prioritized Coordination**:
- If total normal force $F_n < 16.0$ N and object is on the ground ($z \le 0.5$ mm):
  $$\mu_{\text{squeeze}} \leftarrow +0.5\text{ mm/step}, \quad \mu_{\text{lift}} \leftarrow 0.0\text{ mm/step}$$
- The CEM sampling distribution is naturally centered in the preloading regime during the initial steps, ensuring the trajectory optimizer explores squeezing before commanding lift.
- Once $F_n \ge 16.0$ N (sufficient friction to support $7.85$ N gravity load with margin), the sampling distribution unlocks vertical lift commands ($\mu_{\text{lift}} \leftarrow +2.5$ mm/step).

---

## 3. The Unified Safety Coordinator Interface

The coordinator class `ContactAwareSafetyCoordinator` manages the full pipeline:
1. `plan_coordinated_action(current_state, reward_fn)`: Generates safe candidate trajectory via preload-prioritized CEM.
2. `substitute_and_certify(obs, proposed_action)`: Applies analytic Action Substitution, computing exact preload boost and velocity scaling.
3. `log_telemetry()`: Serializes high-fidelity 8-channel diagnostic records for every decision.

