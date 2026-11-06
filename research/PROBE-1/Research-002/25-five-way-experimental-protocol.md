# HOROS PROBE-1 — Research-002
## Stage P2.5: Five-Way Experimental Protocol
**Program:** HOROS PROBE-1 — Humanoid Robotics & Physical AI  
**Project:** Research-002: Trustworthy Action-Conditioned Contact World Models  
**Document:** 25-five-way-experimental-protocol.md  
**Status:** Protocol Specification  

---

## 1. Experimental Protocol Architecture

The Stage P2.5 benchmark runs under a strictly controlled evaluation harness:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   STAGE P2.5 BENCHMARK HARNESS                         │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Five Training Datasets (D0, D1, D2, D3, D4)                         │
│                           │                                            │
│                           ▼                                            │
│ 2. Standardized Model Training (45 epochs, Adam lr=2e-3, seed=42/84)  │
│                           │                                            │
│                           ▼                                            │
│ 3. Dual Conformal Calibration (40 calibration episodes per task)       │
│    - Regime 1: CMS-PSACD (Mode-stratified, Planner-matched Target A)  │
│    - Regime 2: Unstratified Split Conformal (Ablation baseline)        │
│                           │                                            │
│                           ▼                                            │
│ 4. Closed-Loop Manipulation Evaluation (30 held-out test episodes)     │
│    - Target A: Counterfactual open-loop execution                      │
│    - Target B: Receding-horizon replanned execution                    │
│    - Safety Filter: Disabled vs Enabled (p-CBF)                        │
│                           │                                            │
│                           ▼                                            │
│ 5. Aggregation, Statistical Analysis, & Wilson 95% Confidence Intervals│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Standardized Task Configurations

### 2.1 Task 1: Precision Peg-in-Hole Insertion
- **Clearance:** $\delta = 0.50$ mm, Peg Length: $L = 80.0$ mm, Hole Depth: $60.0$ mm.
- **Initial Pose:** $z_{\text{init}} = +15.0 \pm 1.0$ mm, lateral error $\le 2.0$ mm, tilt $\le 1.0^\circ$.
- **Success Criterion:** Seated depth $-z_{\text{peg}} \ge 50.0$ mm with lateral wrench $< 10.0$ N.
- **Evaluation Horizon:** $H = 25$ steps (at max $5.0$ mm/step $\to$ capacity $125.0$ mm displacement).
- **Safety Limit:** $\|F\| \le 40.0$ N, $\|\tau\| \le 8.0$ N$\cdot$m.

### 2.2 Task 2: Multifingered Dexterous Grasp-and-Lift
- **Object Mass:** $m = 0.35$ kg, Friction: $\mu = 0.50$, Max Crush Force: $25.0$ N per finger.
- **Initial Finger Radius:** $r = 38.0$ mm (Object radius: $r = 35.0$ mm).
- **Success Criterion:** Stable object lift $z_{\text{obj}} \ge 5.0$ mm without object drop or crush violation.
- **Evaluation Horizon:** $H = 25$ steps.
- **Coordinated Phase Protocol:** Squeeze $\to$ Normal Preload $\to$ Lift $\to$ Slip Recovery.

---

## 3. Five Tested Conditions

| ID | Data Source | Data Description | Calibration Engine | Evaluation Mode |
| :--- | :--- | :--- | :--- | :--- |
| **M0** | $D_0$ Passive | 25 random exploration episodes | CMS-PSACD | Open-loop & Closed-loop |
| **M1** | $D_1$ Random | 25 passive + 40 random episodes | CMS-PSACD | Open-loop & Closed-loop |
| **M2** | $D_2$ Boundary | 25 passive + 40 boundary episodes | CMS-PSACD | Open-loop & Closed-loop |
| **M3** | $D_3$ Uncertainty| 25 passive + 40 uncertainty episodes | CMS-PSACD | Open-loop & Closed-loop |
| **M4** | $D_4$ Combined | 25 passive + 40 ACMM episodes | CMS-PSACD | Open-loop & Closed-loop |

---

## 4. Random Seeds & Partition Manifest

- **Task 1 Base Seed:** 42  
  - Training episodes: Seeds `100–124` (D0), `2000–2119` (Active pools)
  - Calibration episodes: Seeds `4000–4039` (40 episodes)
  - Test episodes: Seeds `5000–5029` (30 held-out episodes)
- **Task 2 Base Seed:** 84  
  - Training episodes: Seeds `100–124` (D0), `2000–2119` (Active pools)
  - Calibration episodes: Seeds `4000–4039` (40 episodes)
  - Test episodes: Seeds `5000–5029` (30 held-out episodes)

*Invariant Guarantee:* Calibration and test seeds are completely distinct from all active mining seeds.

