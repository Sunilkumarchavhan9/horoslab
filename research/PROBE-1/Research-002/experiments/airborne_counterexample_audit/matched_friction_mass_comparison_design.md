# HOROS PROBE-1 — Matched Friction vs. Mass Factorial Comparison Design

**Document Identifier:** `HOROS-P1-R002-MATCHED-FRICTION-MASS-DESIGN`  
**Date:** 2026-11-20  
**Phase:** Stage 3.3 Research Qualification / Counterexample Audit  
**Author:** HOROS Physical Intelligence Research Group  
**Status:** **EXPERIMENTAL DESIGN SPECIFICATION**  

---

### 1. The Confounding Challenge

In physical manipulation, both lower friction $\mu$ and higher mass $m_{\text{obj}}$ reduce the grasp safety margin:
$$S = \frac{\mu F_N}{m_{\text{obj}} g}$$
If an agent observes an anomalous force profile or an impending slip, a naive world model cannot distinguish whether:
- The workpiece gained mass (e.g. mass influx in Regime B), or
- The contact surface lost traction (e.g. friction step in Regime A).

To prevent deceptive performance claims, any qualification experiment must decouple $\mu$ and $m_{\text{obj}}$ through a **strictly balanced $4 \times 4$ factorial design**.

---

### 2. The $4 \times 4$ Factorial Grid

The experimental matrix spans four levels of friction and four levels of mass:

$$\mu \in \{0.24, 0.36, 0.48, 0.60\} \quad \times \quad m_{\text{obj}} \in \{0.300, 0.400, 0.500, 0.600\}\text{ kg}$$

| Mass \ Friction | $\mu = 0.24$ (Low) | $\mu = 0.36$ (Medium-Low) | $\mu = 0.48$ (Medium-High) | $\mu = 0.60$ (High) |
| :---: | :---: | :---: | :---: | :---: |
| **$m = 0.300\text{ kg}$** | Cell (1,1): $S = 0.816$ (Slip) | Cell (1,2): $S = 1.224$ (Hold) | Cell (1,3): $S = 1.632$ (Hold) | Cell (1,4): $S = 2.040$ (Hold) |
| **$m = 0.400\text{ kg}$** | Cell (2,1): $S = 0.612$ (Slip) | Cell (2,2): $S = 0.918$ (Slip) | Cell (2,3): $S = 1.224$ (Hold) | Cell (2,4): $S = 1.530$ (Hold) |
| **$m = 0.500\text{ kg}$** | Cell (3,1): $S = 0.490$ (Slip) | Cell (3,2): $S = 0.734$ (Slip) | Cell (3,3): $S = 0.979$ (Marginal) | Cell (3,4): $S = 1.224$ (Hold) |
| **$m = 0.600\text{ kg}$** | Cell (4,1): $S = 0.408$ (Slip) | Cell (4,2): $S = 0.612$ (Slip) | Cell (4,3): $S = 0.816$ (Slip) | Cell (4,4): $S = 1.020$ (Marginal) |

*(Assuming normal clamping force $F_N = 10.0\text{ N}$, $F_{n,i} = 2.5\text{ N/finger}$)*

---

### 3. Matched Contrast Protocols

#### 3.1 Contrast Arm 1: Pure Friction Variation (Constant Mass $m = 0.400\text{ kg}$)
- **Condition:** Compare Cell (2,1) [$\mu = 0.24$], Cell (2,2) [$\mu = 0.36$], Cell (2,3) [$\mu = 0.48$], and Cell (2,4) [$\mu = 0.60$].
- **Hypothesis Test:** A model predicting slip must correlate its failure risk strictly with $\mu$, with zero variation attributed to mass.
- **Observable Contrast in State S4:** If clamping force is tuned to $F_N = 3.33\text{ N}$ ($F_N \mu \approx 0.99 W$), shear forces scale directly with $\mu$ ($F_t = \mu F_N$).

#### 3.2 Contrast Arm 2: Pure Mass Variation (Constant Friction $\mu = 0.48$)
- **Condition:** Compare Cell (1,3) [$m = 0.300\text{ kg}$], Cell (2,3) [$m = 0.400\text{ kg}$], Cell (3,3) [$m = 0.500\text{ kg}$], and Cell (4,3) [$m = 0.600\text{ kg}$].
- **Hypothesis Test:** A model predicting slip must correlate failure risk strictly with $m$, with zero variation attributed to $\mu$.
- **Observable Contrast in State S3:** In fully anchored hold, shear forces scale directly with $m$ ($F_t = m g / 4$).

#### 3.3 Contrast Arm 3: Iso-Capacity Diagonal ($S \approx 1.224$)
- **Condition:** Compare Cell (1,2) [$\mu=0.36, m=0.300$], Cell (2,3) [$\mu=0.48, m=0.400$], and Cell (3,4) [$\mu=0.60, m=0.500$].
- **Critical Benchmark:** All three configurations exhibit identical static safety factors ($S = 1.224$).
- **Success Criterion:** The world model must predict **identical stability survival probabilities** despite having completely different underlying physical parameters.

---

### 4. Noise, Acceleration, and Action Controls

To eliminate confounding dynamics:
1. **Kinematic Decoupling:** Action commands during the diagnostic window must enforce zero vertical acceleration:
   $$v_{\text{arm}} = 0.0\text{ mm/s} \implies a_z = 0.0\text{ m/s}^2$$
2. **Sensor Noise SNR Floor:** AR(1) sensor noise on tangential force has innovation standard deviation $\sigma_t = 0.008\text{ N}$ with correlation $\rho = 0.1355$. Over a 10-step averaging window, noise standard error is:
   $$\sigma_{\bar{F}} = \frac{\sigma_t}{\sqrt{10}} \approx 0.0025\text{ N}$$
   Every evaluated parameter step must produce a force difference $\Delta F_t \ge 3 \sigma_{\bar{F}} = 0.0075\text{ N}$ to be declared observable.
3. **Safety Clamps:** Every trial enforces $F_N \le 20.0\text{ N}$ aggregate normal force and $F_t \le 15.0\text{ N}$ shear force. Any trial exceeding these bounds is disqualified.
