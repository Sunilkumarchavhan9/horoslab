# HOROS PROBE-1 — Research-002
## Stage P2.5: Closed-Loop Planner Evaluation & Target A/B Protocols
**Program:** HOROS PROBE-1 — Humanoid Robotics & Physical AI  
**Project:** Research-002: Trustworthy Action-Conditioned Contact World Models  
**Document:** 27-closed-loop-planner-evaluation.md  
**Status:** Evaluation Protocol  

---

## 1. Dual-Target Evaluation Protocol

A central finding of Stage P2.3 is that open-loop planned candidate sequences (**Target A**) and closed-loop receding-horizon policies (**Target B**) represent two distinct physical estimands:

```
Decision Step t
       │
       ├── Target A: Execute open-loop candidate sequence a*_{t:t+H} in clone without replanning
       │             --> Directly evaluates optimizer's selected prediction vs clone physics
       │
       └── Target B: Execute full receding-horizon policy with online CEM replanning at every step
                     --> Evaluates closed-loop deployment trajectory with dynamic feedback
```

### 1.1 Target A: Open-Loop Candidate Evaluation
- Clones simulator state at decision $t$.
- Executes the planned candidate action sequence $a_{t:t+H}^*$ without replanning.
- Directly evaluates whether the optimizer exploited model inaccuracies at candidate selection time.

### 1.2 Target B: Closed-Loop Receding-Horizon Evaluation
- Executes action $a_t = a_{t, 0}^*$ in the simulator.
- Advances state to $s_{t+1}$.
- Generates a new candidate population at $t+1$ using updated state feedback.
- Tests whether online closed-loop replanning stabilizes prediction drift over the 25-step horizon.

---

## 2. Planner Configuration

- **Optimizer:** Batched Cross-Entropy Method (CEM) Trajectory Optimizer.
- **Population Size:** $N_{\text{pop}} = 60$ candidates.
- **Elite Fraction:** $\rho = 0.15$ ($N_{\text{elites}} = 9$).
- **Iterations:** $K_{\text{iter}} = 2$.
- **Planning Horizon:** $H_{\text{plan}} = 10$ steps.
- **Warm Starting:** Decayed mean update $\mu \leftarrow 0.8 \mu_{\text{elites}} + 0.2 \mu$.

---

## 3. Quantifying Closed-Loop Transfer Degradation

We define the **Closed-Loop Transfer Gap ($\Delta_{\text{transfer}}$)**:

$$\Delta_{\text{transfer}} = C_{\text{Target A}} - C_{\text{Target B}}$$

- $\Delta_{\text{transfer}} > 0$: Multi-step replanning introduces compounding distribution shift that degrades open-loop conformal validity.
- $\Delta_{\text{transfer}} \le 0$: Closed-loop feedback corrections compensate for open-loop model error, preserving or improving coverage.

