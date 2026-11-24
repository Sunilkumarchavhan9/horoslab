# HOROS PROBE-1 — Phase 5 Task 3 (P5-T3)
# Seed Registry & Deterministic Scenario Mapping

**Project:** HOROS Physical Interaction Data Engine (PIDE)  
**Research Program:** PROBE-1  
**Milestone:** P5-T3 — N-Contact Generalization & Cooperative Physical Intelligence  
**Document Status:** Frozen Deterministic Registry  
**Total Evaluation Scenarios:** 900  

---

## 1. Reserved Seed Blocks & Partitioning

To ensure absolute isolation between development, evaluation, and future stress testing, the following dedicated seed ranges are pre-registered and strictly partitioned:

| Partition | Seed Range | Count | Purpose |
|---|---|---|---|
| **P5-T3 Validation & Unit Tests** | `4700001` – `4700900` | 900 | Unit tests, regression assertions, algorithm tuning |
| **P5-T3 Held-Out Benchmark (Protocols A & B)** | `4710001` – `4710900` | 900 | Official pre-registered 900-scenario benchmark |
| **P5-T3 Stress & Adversarial Evaluation** | `4720001` – `4720300` | 300 | Future exploratory stress testing |
| **Protected Production Seeds** | `3300000+`, `3390000+` | N/A | Production stage gates (STRICTLY IMMUTABLE) |

---

## 2. Factorial Scenario Mapping (Seeds 4710001 – 4710900)

The 900 held-out evaluation scenarios are structured as a balanced factorial grid: 3 topologies $\times$ 3 strata $\times$ 5 disturbance regimes.

### 2.1 Topology $N=3$ (Seeds 4710001 – 4710300)
- **Stratum 1 (Symmetric Friction, Centered Load):** Seeds `4710001` – `4710100` (100 episodes)
  - $\mu_i = 0.55$, $r_i = 15.0\,\text{mm}$, $d_{\text{offset}} = 0\,\text{mm}$, disturbances cyclically sampled from `[shear_ramp, fast_ramp, micro_probe, tangential_shock, torque_perturbation]`.
- **Stratum 2 (Asymmetric / Heterogeneous Friction):** Seeds `4710101` – `4710200` (100 episodes)
  - $\mu = [0.35, 0.75, 0.55]$, $r_i = 15.0\,\text{mm}$, $d_{\text{offset}} = 0\,\text{mm}$.
- **Stratum 3 (Asymmetric Geometry & Off-Center Torque):** Seeds `4710201` – `4710300` (100 episodes)
  - Fingertip radii $r = [12, 14, 16]\,\text{mm}$, $\mu = [0.50, 0.53, 0.56]$, $d_{\text{offset}} = 20\,\text{mm}$.
  - Seeds `4710281` – `4710300` (20 episodes): Dynamic contact loss injected at $t = 150\,\text{ms}$, recovery at $t = 350\,\text{ms}$.

### 2.2 Topology $N=4$ (Seeds 4710301 – 4710600)
- **Stratum 1 (Symmetric Friction, Centered Load):** Seeds `4710301` – `4710400` (100 episodes)
  - $\mu_i = 0.55$, $r_i = 15.0\,\text{mm}$, $d_{\text{offset}} = 0\,\text{mm}$.
- **Stratum 2 (Asymmetric / Heterogeneous Friction):** Seeds `4710401` – `4710500` (100 episodes)
  - $\mu = [0.35, 0.75, 0.45, 0.65]$, $r_i = 15.0\,\text{mm}$, $d_{\text{offset}} = 0\,\text{mm}$.
- **Stratum 3 (Asymmetric Geometry & Off-Center Torque):** Seeds `4710501` – `4710600` (100 episodes)
  - Fingertip radii $r = [12, 14, 16, 18]\,\text{mm}$, $\mu = [0.50, 0.53, 0.56, 0.59]$, $d_{\text{offset}} = 20\,\text{mm}$.
  - Seeds `4710581` – `4710600` (20 episodes): Dynamic contact loss injected at $t = 150\,\text{ms}$, recovery at $t = 350\,\text{ms}$.

### 2.3 Topology $N=5$ (Seeds 4710601 – 4710900)
- **Stratum 1 (Symmetric Friction, Centered Load):** Seeds `4710601` – `4710700` (100 episodes)
  - $\mu_i = 0.55$, $r_i = 15.0\,\text{mm}$, $d_{\text{offset}} = 0\,\text{mm}$.
- **Stratum 2 (Asymmetric / Heterogeneous Friction):** Seeds `4710701` – `4710800` (100 episodes)
  - $\mu = [0.35, 0.75, 0.40, 0.65, 0.55]$, $r_i = 15.0\,\text{mm}$, $d_{\text{offset}} = 0\,\text{mm}$.
- **Stratum 3 (Asymmetric Geometry & Off-Center Torque):** Seeds `4710801` – `4710900` (100 episodes)
  - Fingertip radii $r = [12, 14, 16, 18, 20]\,\text{mm}$, $\mu = [0.50, 0.53, 0.56, 0.59, 0.62]$, $d_{\text{offset}} = 20\,\text{mm}$.
  - Seeds `4710881` – `4710900` (20 episodes): Dynamic contact loss injected at $t = 150\,\text{ms}$, recovery at $t = 350\,\text{ms}$.

---

## 3. Deterministic Reproduction Instructions

To reproduce the exact benchmark results from this registry:

```bash
# 1. Run full unit and integration test suite
pytest research/PROBE-1/Research-002/experiments/n_contact_generalization_p5_t3/ -v

# 2. Execute full 900-scenario benchmark across Protocol A and Protocol B
python research/PROBE-1/Research-002/experiments/n_contact_generalization_p5_t3/run_p5_t3_experiments.py
```

The runner enforces deterministic pseudo-random seeds via `np.random.RandomState(cfg['seed'])` for all sensor noise and initial micro-variations.
