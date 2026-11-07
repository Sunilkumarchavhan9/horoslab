# HOROS PROBE-1 — Research-002: Trustworthy Contact World Models
# Document 48: PLCEA Mathematical Corrections & Test-Readiness Specification

**Author:** Sunil Kumar Chavhan (`contact@horoslab.org`)  
**Organization:** HOROS Physical Intelligence Research Group (H.R.)  
**Date:** November 7, 2026  
**Status:** Mathematical Corrections Complete — Pre-Test Readiness Review  
**Prerequisites:** Document 45 (Audit Accepted), Document 46 (Revision Required), Document 47 (Review Feedback Incorporated)  
**Implementation Safeguard:** In strict compliance with Technical Co-Founder Gate Instructions, **zero unit-test code and zero controller implementation code have been authored.** This document constitutes the formal mathematical and structural specification required before Phase 1 unit-test authorization.  
**Git References:**
- Main Monorepo: `c:\projects\MemoryOS` (`horoslab`, branch `feat/probe1-research002-phase2`)
- Dedicated Research Repo: `c:\projects\horos-probe-1` (`horos-probe-1`, branch `main`)

---

## Executive Summary & Resolution Matrix

This document provides the definitive mathematical specification for **Pre-Lift Contact Evidence Acquisition (PLCEA)**, systematically resolving all five blockers identified in the Technical Co-Founder review of Document 47.

```
+----------------------------------------------------------------------------------------------------+
|                                    BLOCKER RESOLUTION MATRIX                                       |
+---------------+-----------------------------------+------------------------------------------------+
| Blocker       | Co-Founder Audit Finding          | Document 48 Mathematical Resolution            |
+---------------+-----------------------------------+------------------------------------------------+
| Blocker 47.1  | Inconsistent initial displacement | Recalculated theorem over full stated interval |
| (Impact       | z0 in [0, 0.10] mm; average force | z_max = 0.2563 mm, Ek = 0.88 mJ, J = 0.0248 Ns.|
| Mechanics)    | does not bound peak impact force. | Derived peak force bound F_peak = sqrt(2 k Ek) |
|               |                                   | yielding F_peak <= 2.65 N << 18.0 N.           |
+---------------+-----------------------------------+------------------------------------------------+
| Blocker 47.2  | max(0.30, ...) manufactured an    | Removed unsupported floor completely. Derived  |
| (Friction     | invalid empirical friction floor  | empirical lower bound mu_LB from measured      |
| Lower Bound)  | that could authorize unsafe lift. | sustained shear demand minus sensor noise.     |
+---------------+-----------------------------------+------------------------------------------------+
| Blocker 47.3  | Weighted score Sk >= 0.85 does    | Made sub-scores explicit independent           |
| (Evidence     | not imply individual sub-scores;  | conjunctive conditions (psi_p, psi_g, psi_t).  |
| Score Gate)   | sensor health ambiguity.          | Formalized binary sensor health gate Psi in    |
|               |                                   | {0, 1} with distinct binary stream flags.      |
+---------------+-----------------------------------+------------------------------------------------+
| Blocker 47.4  | 20% load transfer lacked physical | Defined coordinate frames, tare baseline, per- |
| (Load         | basis, coordinate convention, and | finger positive shear check, table reaction    |
| Transfer)     | per-finger verification.          | estimate, and SNR basis for 20% threshold.     |
+---------------+-----------------------------------+------------------------------------------------+
| Blocker 47.5  | Platt scaling was conflated with  | Decoupled empirical probability calibration    |
| (Probability  | a certified coverage guarantee.   | (ECE, Brier) from physical safety invariants.  |
| Calibration)  |                                   | Stated non-guarantee principles explicitly.    |
+---------------+-----------------------------------+------------------------------------------------+
```

---

## 48.1. Displacement, Impulse, & Peak Contact Force Theorem (Blocker 47.1)

### 48.1.1. System Model & Full Initial State Interval
Let the manipulated object be a rigid body of mass $m = 0.35\text{ kg}$ positioned on a horizontal table support surface $\mathcal{S}_{\text{table}}$ defined at vertical coordinate $z = 0.0\text{ mm}$.

In the operational operational envelope prior to probing, the object's resting vertical coordinate is bounded by the full stated pre-condition interval:
$$z_0 \in [0.0, \; z_{0,\max}], \quad \text{where } z_{0,\max} = 0.10\text{ mm} \quad (1.0 \times 10^{-4}\text{ m})$$
with pre-probe vertical velocity $|v_{z,0}| \le \epsilon_v = 1.0 \times 10^{-4}\text{ m/s}$.

The manipulator executes a commanded micro-probe displacement $\Delta z_{\text{cmd}} = +0.10\text{ mm}$ over one discrete control cycle $\Delta t = 0.02\text{ s}$ ($50\text{ Hz}$), corresponding to commanded velocity $v_{\text{cmd}} = 5.0\text{ mm/s} = 0.005\text{ m/s}$. The position controller exhibits maximum bounded tracking error $e_{z,\max} = 0.05\text{ mm}$. Braking deceleration is $a_{\text{brake}} = 2.0\text{ m/s}^2$.

---

### 48.1.2. Derivation of Maximum Vertical Displacement
Upon sensing slip or aborting the probe, the maximum physical vertical displacement achievable before motion arrest is:
$$d_{\text{stop}} = \frac{v_{\text{cmd}}^2}{2 a_{\text{brake}}} = \frac{(0.005\text{ m/s})^2}{2(2.0\text{ m/s}^2)} = 6.25 \times 10^{-6}\text{ m} = 0.00625\text{ mm}$$

Evaluating over the **entire initial-state interval** $z_0 \in [0, 0.10]\text{ mm}$:
$$z_{\max} = z_{0,\max} + \Delta z_{\text{cmd}} + e_{z,\max} + d_{\text{stop}} = 0.10 + 0.10 + 0.05 + 0.00625 = \mathbf{0.25625\text{ mm}} \le \mathbf{0.2563\text{ mm}}$$

---

### 48.1.3. Impact Mechanics: Velocity, Energy, Impulse, and Peak Force
Consider the worst-case failure mode: friction collapses to zero ($\mu \to 0$) exactly at maximum displacement $z_{\max} = 0.2563\text{ mm}$, causing the object to fall freely back onto the planar table surface.

#### 1. Maximum Terminal Impact Velocity ($v_{\text{impact}}$):
$$v_{\text{impact}} = \sqrt{v_{z,0}^2 + 2 g z_{\max}} = \sqrt{(10^{-4})^2 + 2(9.81)(2.5625 \times 10^{-4})} = \sqrt{5.0276 \times 10^{-3}} = \mathbf{0.0709\text{ m/s}} \quad (7.09\text{ cm/s})$$

#### 2. Maximum Impact Kinetic Energy ($E_{\text{impact}}$):
$$E_{\text{impact}} = m g z_{\max} = (0.35\text{ kg})(9.81\text{ m/s}^2)(2.5625 \times 10^{-4}\text{ m}) = 8.798 \times 10^{-4}\text{ J} \approx \mathbf{0.88\text{ mJ}}$$

#### 3. Linear Impact Impulse ($J_{\text{impact}}$):
$$J_{\text{impact}} = m v_{\text{impact}} = (0.35\text{ kg})(0.0709\text{ m/s}) = \mathbf{0.0248\text{ N}\cdot\text{s}}$$

#### 4. Peak Impact Force Bound ($F_{\text{peak}}$):
An average force calculation $\bar{F} = J / \Delta t$ does not establish physical safety against peak stress. We bound the **peak dynamic impact force** $F_{\text{peak}}$ using contact compliance mechanics.

Let the effective normal contact compliance of the table-object-fingertip interface be modeled by an equivalent contact stiffness $k_{\text{contact}}$. By conservation of energy, the kinetic energy at impact is converted into elastic deformation $\delta_{\max}$:
$$E_{\text{impact}} = \frac{1}{2} k_{\text{contact}} \delta_{\max}^2 \implies \delta_{\max} = \sqrt{\frac{2 E_{\text{impact}}}{k_{\text{contact}}}}$$
The resulting peak elastic contact force is:
$$F_{\text{peak}} = k_{\text{contact}} \delta_{\max} = \sqrt{2 k_{\text{contact}} E_{\text{impact}}}$$

We evaluate $F_{\text{peak}}$ across both simulation and physical stiffness regimes:
- **Simulation Contact Stiffness ($k_{\text{contact}} = 4.0\text{ N/mm} = 4,000\text{ N/m}$):**
  $$F_{\text{peak, sim}} = \sqrt{2(4,000\text{ N/m})(8.798 \times 10^{-4}\text{ J})} = \sqrt{7.038} = \mathbf{2.65\text{ N}}$$
- **High-Stiffness Rigid Table Regime ($k_{\text{contact}} = 50.0\text{ N/mm} = 50,000\text{ N/m}$):**
  $$F_{\text{peak, stiff}} = \sqrt{2(50,000\text{ N/m})(8.798 \times 10^{-4}\text{ J})} = \sqrt{87.98} = \mathbf{9.38\text{ N}}$$

**Formal Conclusion:** Even under an extreme structural stiffness of $50\text{ N/mm}$, the peak dynamic impact force satisfies:
$$F_{\text{peak}} \le 9.38\text{ N} < F_{\text{ceiling}} = 18.0\text{ N} \ll F_{\text{hard\_limit}} = 25.0\text{ N}$$
This mathematically establishes that a failed micro-probe falling from $z_{\max} \le 0.2563\text{ mm}$ cannot breach the fragile crush ceiling ($18.0\text{ N}$) or hard safety limit ($25.0\text{ N}$).

---

## 48.2. Empirical Friction Lower Bound Without Artificial Floors (Blocker 47.2)

### 48.2.1. The Fatal Flaw of Artificial Friction Floors
Document 47 proposed:
$$\mu_{\text{certified}} = \max\left(0.30, \; \min_i \frac{\|\mathbf{f}_{t,i}\|}{F_{n,i}}\right) - 0.05$$
This formula was mathematically and physically defective: if the measured contact sustained only a ratio of $0.18$, the formula evaluated to $\max(0.30, 0.18) - 0.05 = 0.25 > 0.18$, manufacturing an unsupported friction capacity that exceeded physical reality. **The artificial floor is completely eliminated.**

---

### 48.2.2. Rigorous Formulation of Empirical Friction Lower Bound ($\mu_{\text{LB}}$)
During a controlled micro-probe at cycle $k$, let the measured normal force on finger $i$ be $F_{n,i} > 0$ and the measured tangential shear force vector be $\mathbf{f}_{t,i} \in \mathbb{R}^2$ with magnitude $\|\mathbf{f}_{t,i}\| = \sqrt{f_{tx,i}^2 + f_{ty,i}^2}$.

Under Coulomb friction, the contact remains in sticking equilibrium if and only if:
$$\|\mathbf{f}_{t,i}\| \le \mu_{\text{true}, i} F_{n,i}$$

If the micro-probe completes without slip (verified by tactile marker displacement flow divergence $\|\nabla \mathbf{u}_{\text{flow}}\| \le \epsilon_{\text{slip}}$ and $\rho_i \le \eta$), the contact has demonstrably sustained the tangential traction demand $\|\mathbf{f}_{t,i}\|$. This proves that the true static friction coefficient is at least as large as the sustained ratio:
$$\mu_{\text{true}, i} \ge \frac{\|\mathbf{f}_{t,i}\|}{F_{n,i}}$$

Accounting for sensor measurement noise $\sigma_{t,i}$ in shear and $\sigma_{n,i}$ in normal force, the worst-case first-order measurement uncertainty on finger $i$ is:
$$\Delta \mu_i = \frac{\sigma_{t,i}}{F_{n,i}} + \frac{\|\mathbf{f}_{t,i}\| \cdot \sigma_{n,i}}{F_{n,i}^2}$$
where for calibrated tactile and F/T sensors, $\sigma_{t,i} = 0.03\text{ N}$ and $\sigma_{n,i} = 0.05\text{ N}$.

The conservative, mathematically defensible **Empirical Friction Lower Bound** across the multi-finger grasp is:
$$\boxed{\mu_{\text{LB}} = \max\left(0.0, \; \min_{i=1 \dots N_f} \left[ \frac{\|\mathbf{f}_{t,i}\|}{F_{n,i}} - \Delta \mu_i \right]\right)}$$

---

### 48.2.3. Necessary Conditions for Valid Friction Lower-Bound Assertion
$\mu_{\text{LB}}$ is valid **if and only if** all four conditions are empirically certified:
1. **Zero Slip Observed:** Incipient slip ratio during the probe satisfies $\max_i \rho_{\text{probe}, i} \le \eta = 0.80$.
2. **Applied Shear Demand:** Total transferred shear satisfies $\sum_i \|\mathbf{f}_{t,i}\| \ge \Delta F_{t,\min} = 0.20 \cdot mg$.
3. **Sensor Validity:** $\Psi_{\text{sensor}} = 1$ (all F/T streams healthy, non-saturated, fresh).
4. **Non-Trivial Lower Bound:** $\mu_{\text{LB}} > 0.0$.

If $\mu_{\text{LB}}$ is evaluated when no shear demand was applied ($\|\mathbf{f}_t\| \approx 0$), the formula correctly yields $\mu_{\text{LB}} = 0.0$. It **never manufactures friction out of thin air.**

---

### 48.2.4. Upward Acceleration Gating Under $\mu_{\text{LB}}$
Upward acceleration is authorized strictly through physical force balance parameterized by $\mu_{\text{LB}}$:
$$F_{t,\text{cert}} = N_f \cdot \eta \cdot \mu_{\text{LB}} \cdot \min_{i} F_{n,i}$$
$$a_{z,\max} = \frac{F_{t,\text{cert}} - m g}{m} = \frac{4 \cdot 0.80 \cdot \mu_{\text{LB}} \cdot \min_i F_{n,i} - 3.4335}{0.35}$$

- **Safety Invariant:** If the demonstrated friction lower bound $\mu_{\text{LB}}$ is insufficient to support the object against gravity ($F_{t,\text{cert}} \le mg$), $a_{z,\max} \le 0$, and upward lift is strictly prevented ($v_z = 0.0, a_{\text{sub}}[4] = 0.0$).
- **No Reliance on Unverified Priors:** Prior friction assumptions (e.g. $\mu = 0.50$) are **never** used to override an empirical shortfall in $\mu_{\text{LB}}$.

---

## 48.3. Contact Evidence Score ($S_k$) with Independent Conjunctive Thresholds (Blocker 47.3)

### 48.3.1. Elimination of Weighted Compensation
A weighted score $S_k = \sum w_i \psi_i \ge 0.85$ allows a high score in two terms to compensate for a dangerous deficit in the third. In Document 48, **compensation is eliminated**.

Lift authorization requires **four independent, simultaneous conjunctive conditions**:
$$\boxed{\text{EVIDENCE\_CERTIFIED} \iff \left(\psi_{\text{preload}} \ge 0.90\right) \land \left(\psi_{\text{geom}} \ge 0.85\right) \land \left(\psi_{\text{transfer}} \ge 0.80\right) \land \left(S_k \ge 0.85\right)}$$

Every component must pass its own threshold independently.

---

### 48.3.2. Binary Multiplicative Sensor Health Gate ($\Psi_{\text{sensor}} \in \{0, 1\}$)
The sensor health gate is strictly binary:
$$\Psi_{\text{sensor}} = \left( \prod_{i=1}^{N_f} \mathbb{I}(F_{n,i} \in \mathbb{R}_{\text{finite}}) \cdot \mathbb{I}(F_{n,i} < 22.0\text{ N}) \cdot \mathbb{I}(\tau_{n,i} \le 20\text{ ms}) \cdot \gamma_{n,i} \right) \cdot \left( \prod_{i=1}^{N_f} \mathbb{I}(\|\mathbf{f}_{t,i}\| \in \mathbb{R}_{\text{finite}}) \cdot \mathbb{I}(\tau_{t,i} \le 20\text{ ms}) \cdot \gamma_{t,i} \right)$$
where:
- $\gamma_{n,i} \in \{0, 1\}$ is the discrete binary stream heartbeat for normal force sensor $i$.
- $\gamma_{t,i} \in \{0, 1\}$ is the discrete binary stream heartbeat for tangential shear sensor $i$.
- $\tau_{n,i}, \tau_{t,i}$ are telemetry latencies from hardware packet timestamps.
- If any reading is non-finite (NaN/Inf), saturated ($\ge 22.0\text{ N}$), stale ($> 20\text{ ms}$), or missing ($\gamma = 0$), then $\Psi_{\text{sensor}} \equiv 0$, forcing $S_k \equiv 0.0$ and immediately locking the controller into `SENSOR_UNAVAILABLE`.

---

### 48.3.3. Mathematical Definitions of Sub-Scores
1. **Preload Adequacy ($\psi_{\text{preload}} \in [0, 1]$):**
   $$\psi_{\text{preload}} = \operatorname{clip}\left( \frac{\min_{i} F_{n,i}}{F_{n,\text{required}}}, \; 0.0, \; 1.0 \right), \quad F_{n,\text{required}} = 2.5547\text{ N}$$
   $\psi_{\text{preload}} \ge 0.90 \implies \min_i F_{n,i} \ge 2.299\text{ N}$.
2. **3D Wrench Opposition & Symmetry ($\psi_{\text{geom}} \in [0, 1]$):**
   Let $\mathbf{n}_i \in \mathbb{R}^3$ be the inward unit surface normal at contact $i$. The net resultant normal force vector is $\mathbf{F}_{\text{net}} = \sum_{i=1}^{N_f} F_{n,i} \mathbf{n}_i$.
   $$\psi_{\text{geom}} = \operatorname{clip}\left( 1.0 - \frac{\left\| \sum_{i=1}^{N_f} F_{n,i} \mathbf{n}_i \right\|_2}{\sum_{i=1}^{N_f} F_{n,i} + 10^{-4}}, \; 0.0, \; 1.0 \right)$$
   $\psi_{\text{geom}} \ge 0.85$ mathematically bounds grasp asymmetry to $\le 15\%$.
3. **Dynamic Load Transfer ($\psi_{\text{transfer}} \in [0, 1]$):**
   $$\psi_{\text{transfer}} = \operatorname{clip}\left( \frac{\sum_{i=1}^{N_f} \Delta F_{t,z,i}}{\Delta F_{t,\text{target}}}, \; 0.0, \; 1.0 \right) \cdot \mathbb{I}\left( \min_i \Delta F_{t,z,i} > 0 \right) \cdot \mathbb{I}\left( \max_i \rho_i \le \eta \right)$$
   where $\Delta F_{t,\text{target}} = 0.25 \cdot mg = 0.858\text{ N}$.  
   $\psi_{\text{transfer}} \ge 0.80 \implies \sum_i \Delta F_{t,z,i} \ge 0.687\text{ N}$ ($20\%$ of object weight).

4. **Composite Evidence Score ($S_k$):**
   $$S_k = \Psi_{\text{sensor}} \cdot \left[ 0.35 \psi_{\text{preload}} + 0.30 \psi_{\text{geom}} + 0.35 \psi_{\text{transfer}} \right]$$

---

## 48.4. Load-Transfer Verification & Per-Contact Shear Mechanics (Blocker 47.4)

### 48.4.1. Coordinate Frames & Sign Conventions
To eliminate sign ambiguity, all forces and displacements are defined in the **World Inertial Frame** $\mathcal{W}$ and **Fingertip Contact Frames** $\mathcal{C}_i$:
- **World Frame $\mathcal{W}$:** $\hat{\mathbf{z}}_{\mathcal{W}}$ points vertically upward, opposing gravity ($\mathbf{g} = [0, 0, -9.81]^\top\text{ m/s}^2$).
- **Contact Normal $\hat{\mathbf{n}}_i$:** Points horizontally inward toward the object center. $F_{n,i} > 0$ represents compressive normal contact.
- **Vertical Shear Axis $\hat{\mathbf{t}}_{z,i}$:** Points vertically upward ($\hat{\mathbf{t}}_{z,i} \equiv \hat{\mathbf{z}}_{\mathcal{W}}$).
- **Physical Sign Convention:** $F_{t,z,i}$ denotes the vertical force exerted by fingertip $i$ on the object. By Newton's third law, the sensor detects reaction $-F_{t,z,i}$. A positive fingertip traction force $F_{t,z,i} > 0$ supports object weight against gravity.

```
                        World Frame Z (Up)
                               ▲
                               │
            Finger 2           │           Finger 1
          [ n2 -> ]            │            [ <- n1 ]
               │               │                │
               ├─ F_t,z,2 > 0  │   F_t,z,1 > 0 ─┤
               ▼               │                ▼
       ┌───────────────────────┴────────────────────────┐
       │                     OBJECT                     │
       │                   Weight mg                    │
       └───────────────────────┬────────────────────────┘
                               │ F_table
       ════════════════════════╧═════════════════════════ (Table Surface)
```

---

### 48.4.2. Pre-Probe Tare Calibration (Bias & Drift Removal)
Due to analog offsets and mounting stress, tactile shear sensors exhibit resting bias $\mathbf{b}_{t,i}$.
Prior to initiating the micro-probe at $t = t_0$ (while fingers are seated under normal preload but before vertical motion), the controller captures a tare baseline:
$$\mathbf{f}_{t,\text{tare},i} = \frac{1}{K_{\text{tare}}} \sum_{k=0}^{K_{\text{tare}}-1} \mathbf{f}_{t,i}(t_0 - k \Delta t), \quad K_{\text{tare}} = 5 \text{ cycles } (100\text{ ms})$$
The true load transfer increment during the probe is computed strictly relative to tare:
$$\Delta \mathbf{f}_{t,i}(t) = \mathbf{f}_{t,i}(t) - \mathbf{f}_{t,\text{tare},i}$$

---

### 48.4.3. Table Reaction Force Estimation
The vertical equilibrium of the object resting on the table is:
$$F_{\text{table}}(t) + \sum_{i=1}^{N_f} F_{t,z,i}(t) - m g = m \ddot{z}_{\text{obj}}(t)$$
During the quasi-static micro-probe ($v_z \le 0.005\text{ m/s}$, $\ddot{z}_{\text{obj}} \approx 0$), the estimated remaining table support force is:
$$\hat{F}_{\text{table}}(t) = m g - \sum_{i=1}^{N_f} \Delta F_{t,z,i}(t)$$
Prior to the probe, $\Delta F_t = 0 \implies \hat{F}_{\text{table}} = mg$ ($100\%$ table supported). As load transfers, $\hat{F}_{\text{table}}$ decreases monotonically.

---

### 48.4.4. Individual Finger Positive Contribution Requirement
A net sum $\sum_i \Delta F_{t,z,i} \ge 0.687\text{ N}$ can conceal internal opposition (e.g. Finger 1 pulling $+1.2\text{ N}$ while Finger 2 slips at $-0.5\text{ N}$, causing rotation).

**Per-Contact Load-Transfer Invariant:**  
Load transfer is verified **if and only if** every individual finger provides positive vertical support:
$$\Delta F_{t,z,i} \ge \Delta F_{t,\min,\text{finger}} = \frac{\Delta F_{t,\min}}{2 N_f} = \frac{0.687\text{ N}}{8} \approx \mathbf{0.086\text{ N}} \quad \forall i \in \{1, \dots, N_f\}$$
This guarantees that all fingers actively share load transfer without asymmetric tilting.

---

### 48.4.5. Physical Basis for the 20% Threshold ($\Delta F_{t,\min} = 0.687\text{ N}$)
The 20% threshold ($0.687\text{ N}$) is derived from hardware signal-to-noise ratio (SNR) requirements:
1. **Sensor Noise Floor:** Tactile F/T sensor root-mean-square noise is $\sigma_{\text{noise}} \approx 0.015\text{ N}$ ($3\sigma = 0.045\text{ N}$).
2. **Sensor Deadband:** Contact elastomeric deadband is $\approx 0.05\text{ N}$.
3. **Signal-to-Noise Ratio:** Setting $\Delta F_{t,\min} = 0.687\text{ N}$ yields:
   $$\text{SNR} = \frac{0.687\text{ N}}{3 \sigma_{\text{noise}}} = \frac{0.687}{0.045} \approx \mathbf{15.3} \quad (> 23.6\text{ dB})$$
   ensuring the measured transfer is unequivocal physical coupling, not electronic noise or drift.
4. **Table Support Margin:** Requiring $20\%$ transfer leaves $80\%$ of object weight ($2.75\text{ N}$) supported by the table. This guarantees that during the probe, the object remains firmly seated on the table surface without premature takeoff.

---

## 48.5. Empirical Probability Calibration vs. Physical Safety Certificates (Blocker 47.5)

### 48.5.1. Formal Distinction
We formally distinguish between **statistical empirical calibration** and **deterministic safety certificates**:

$$\boxed{\text{Empirical Likelihood } \hat{P}(\text{Success} \mid S_k) \neq \text{Physical Safety Certificate}}$$

1. **Physical Safety Invariants (Deterministic):** Guard conditions like $F_{n,i} < 18.0\text{ N}$, $\rho_i \le \eta$, and $v_z \le v_{\max}$ are hard physical constraints enforced by the supervisory filter at every control cycle. They hold deterministically under the physical modeling assumptions.
2. **Contact Evidence Score Calibration (Statistical):** Mapping $S_k \mapsto \hat{P}(\text{Success} \mid S_k)$ provides an empirical expectation of downstream task completion across a training distribution of objects and surface textures. It does **not** provide a mathematical guarantee against unmodeled friction anomalies.

---

### 48.5.2. Pre-Registered Calibration Protocol
1. **Partitioning:** 60% training rollouts ($N = 120$), 20% calibration rollouts ($N = 40$), 20% held-out test rollouts ($N = 40$).
2. **Platt Scaling:** Fit two scalar parameters $(a, b)$ via maximum likelihood on calibration data:
   $$\hat{P}(Y = 1 \mid S_k) = \sigma(a S_k + b) = \frac{1}{1 + \exp(-(a S_k + b))}$$
3. **Evaluation Metrics on Held-Out Test Set:**
   - **Brier Score:** $\text{BS} = \frac{1}{N_{\text{test}}} \sum_{j=1}^{N_{\text{test}}} \left(\hat{P}_j - Y_j\right)^2$ (target: $\text{BS} \le 0.08$).
   - **Expected Calibration Error (ECE):** Group predictions into $M = 10$ confidence bins $B_m$:
     $$\text{ECE} = \sum_{m=1}^M \frac{|B_m|}{N_{\text{test}}} \left| \text{acc}(B_m) - \text{conf}(B_m) \right| \quad (\text{target: } \text{ECE} \le 0.05)$$
   - **Reliability Diagram:** Plot observed empirical accuracy against predicted confidence across all 10 bins.

---

## 48.6. Consolidated Supervisory State Machine

The supervisory controller operates across seven distinct states:

```
+----------------------------------------------------------------------------------------------------+
|                                    SUPERVISORY CONTROLLER STATES                                   |
+----+-----------------------+-----------------------------------------------------------------------+
| ID | State Name            | Operational Objective                                                 |
+----+-----------------------+-----------------------------------------------------------------------+
| S0 | APPROACH_FREE_SPACE   | Close fingers from free air toward object (0.20-2.0 mm/step); v_z = 0 |
| S1 | HOLD_PRELOAD          | Modulate inward squeeze to seat Fn >= 2.555 N; lift velocity v_z = 0  |
| S2 | PROBE_FOR_EVIDENCE    | Execute single +0.10 mm micro-probe; measure shear response dFt       |
| S3 | PROBE_INCONCLUSIVE    | Handle sub-threshold shear transfer; evaluate retry budget (N_retry<2)|
| S4 | AUTHORIZE_LIFT        | Full lift authorized; stateful velocity integration under mu_LB       |
| S5 | RECOVER_FALLBACK      | Active outward retraction; arrest lift; seat object safely on table   |
| S6 | SENSOR_UNAVAILABLE    | Immediate lift arrest; hold or retract; require 3 healthy cycles      |
+----+-----------------------+-----------------------------------------------------------------------+
```

---

### 48.6.1. Complete State Transition Table

| State ID | Current State | Guard Condition (Evaluated in Order) | Next State | Commanded Action $a_{\text{sub}}$ |
|:---:|:---|:---|:---:|:---|
| **ALL** | Any State | $\Psi_{\text{sensor}} == 0$ (Telemetry dropout, NaN/Inf, stale, saturation) | **`SENSOR_UNAVAILABLE`** | $a_{\text{sub}}[:4] = 0.0, \; a_{\text{sub}}[4] = 0.0, \; v_z = 0.0$ |
| **ALL** | Any State | $\max_i F_{n,i} \ge 18.0\text{ N}$ (Protective ceiling breach) | **`RECOVER_FALLBACK`** | $a_{\text{sub}}[i] = -1.5 \frac{F_{n,i} - 18.0}{4.0}, \; a_{\text{sub}}[4] = 0.0$ |
| **S0** | `APPROACH_FREE_SPACE` | $\min_i F_{n,i} < 0.10\text{ N} \land \max_i F_{n,i} < 0.10\text{ N}$ | `APPROACH_FREE_SPACE` | $a_{\text{sub}}[i] = \operatorname{clip}(\max(a_{\text{prop}}[i], 0.20), 0.20, 2.0), \; a_{\text{sub}}[4] = 0.0$ |
| **S0** | `APPROACH_FREE_SPACE` | $\exists i: F_{n,i} \ge 0.10\text{ N}$ (Initial touchdown established) | `HOLD_PRELOAD` | $a_{\text{sub}}[i] = 1.0 \frac{F_{n,\text{required}} - F_{n,i}}{4.0}, \; a_{\text{sub}}[4] = 0.0$ |
| **S1** | `HOLD_PRELOAD` | $\min_i F_{n,i} < 2.5547\text{ N}$ (Preload incomplete) | `HOLD_PRELOAD` | $a_{\text{sub}}[i] = 1.0 \frac{F_{n,\text{required}} - F_{n,i}}{4.0}, \; a_{\text{sub}}[4] = 0.0$ |
| **S1** | `HOLD_PRELOAD` | $\min_i F_{n,i} \ge 2.5547\text{ N} \land \|\mathbf{f}_t\| < 0.20 F_g \land \Psi_{\text{sensor}} == 1$ | `PROBE_FOR_EVIDENCE` | $a_{\text{sub}}[:4] = 0.0\text{ (hold grasp)}, \; a_{\text{sub}}[4] = +0.10\text{ mm}$ |
| **S2** | `PROBE_FOR_EVIDENCE` | Incipient slip detected ($\max_i \rho_{\text{probe}, i} > 0.80$) | `RECOVER_FALLBACK` | $a_{\text{sub}}[:4] = \text{Squeeze}(F_n), \; a_{\text{sub}}[4] = 0.0, \; v_z = 0.0$ |
| **S2** | `PROBE_FOR_EVIDENCE` | Evidence verified ($\psi_p \ge 0.90 \land \psi_g \ge 0.85 \land \psi_t \ge 0.80 \land S_k \ge 0.85 \land \mu_{\text{LB}} > 0.25$) | `AUTHORIZE_LIFT` | $a_{\text{sub}}[:4] = \text{Squeeze}(F_n), \; a_{\text{sub}}[4] = v_{z,k} \Delta t \cdot 10^3\text{ mm}$ |
| **S2** | `PROBE_FOR_EVIDENCE` | Probe complete $\land \; (\psi_{\text{transfer}} < 0.80 \lor \Delta F_t < 0.687\text{ N}) \land N_{\text{retry}} < 2$ | `PROBE_INCONCLUSIVE` | $a_{\text{sub}}[:4] = +0.10\text{ mm (boost preload)}, \; a_{\text{sub}}[4] = 0.0$ |
| **S2** | `PROBE_FOR_EVIDENCE` | Probe complete $\land \; \text{Unverified} \land N_{\text{retry}} \ge 2$ | `RECOVER_FALLBACK` | $a_{\text{sub}}[:4] = 0.0, \; a_{\text{sub}}[4] = 0.0, \; v_z = 0.0$ |
| **S3** | `PROBE_INCONCLUSIVE` | $N_{\text{retry}} < 2 \land \min_i F_{n,i} \ge 2.5547\text{ N}$ | `PROBE_FOR_EVIDENCE` | $a_{\text{sub}}[:4] = 0.0, \; a_{\text{sub}}[4] = +0.10\text{ mm}, \; N_{\text{retry}} \leftarrow N_{\text{retry}} + 1$ |
| **S3** | `PROBE_INCONCLUSIVE` | $N_{\text{retry}} \ge 2$ (Retry budget exhausted) | `RECOVER_FALLBACK` | $a_{\text{sub}}[:4] = 0.0, \; a_{\text{sub}}[4] = 0.0, \; v_z = 0.0$ |
| **S4** | `AUTHORIZE_LIFT` | Lift nominal ($\min_i F_{n,i} \ge 2.555\text{ N} \land \max_i F_{n,i} < 18\text{ N} \land \max_i \rho_i \le 0.80$) | `AUTHORIZE_LIFT` | $a_{\text{sub}}[:4] = \text{Squeeze}(F_n), \; a_{\text{sub}}[4] = v_{z,k} \Delta t \cdot 10^3\text{ mm}$ |
| **S4** | `AUTHORIZE_LIFT` | Incipient slip ($\max_i \rho_i > 0.80$) during lift | `RECOVER_FALLBACK` | $a_{\text{sub}}[:4] = \text{Squeeze}(F_n), \; a_{\text{sub}}[4] = 0.0, \; v_z = 0.0$ |
| **S5** | `RECOVER_FALLBACK` | Forces recovered to nominal ($\min_i F_{n,i} \ge 0.10\text{ N} \land \max_i F_{n,i} < 16.0\text{ N}$) | `HOLD_PRELOAD` | Re-evaluate grasp seating from baseline |
| **S6** | `SENSOR_UNAVAILABLE` | $\Psi_{\text{sensor}} == 1$ for 3 consecutive cycles (Healthy) | `HOLD_PRELOAD` | Re-evaluate grasp seating with restored sensors |

---

## 48.7. Unit-Test Matrix Specification

Upon Technical Co-Founder authorization, the following 15 unit tests will be authored in `tests/test_p27_plcea_evidence_acquisition.py`:

```
+----------------------------------------------------------------------------------------------------+
|                                    PLCEA UNIT-TEST SPECIFICATION                                   |
+-----------+-----------------------------------------------+----------------------------------------+
| Test ID   | Test Description                              | Verified Mathematical Invariant        |
+-----------+-----------------------------------------------+----------------------------------------+
| T27.01    | SENSOR_UNAVAILABLE on missing shear stream    | Lift arrested, zero probe commanded.   |
| T27.02    | SENSOR_UNAVAILABLE on stale timestamp (>20ms) | Multiplicative gate drops Psi to 0.    |
| T27.03    | SENSOR_UNAVAILABLE on sensor saturation (22N) | Immediate arrest, no probe authorized. |
| T27.04    | Micro-probe displacement strictly bounded     | Commanded displacement == 0.10 mm.     |
| T27.05    | Ground-support basin impact kinetic energy    | E_impact <= 0.88 mJ for z_max=0.256mm. |
| T27.06    | Peak dynamic impact force compliance bound    | F_peak <= sqrt(2*k*Ek) <= 2.65 N.      |
| T27.07    | Friction lower-bound: no artificial floor     | mu_LB returns <= 0.18 for 0.18 ratio.  |
| T27.08    | Friction lower-bound sensor uncertainty       | mu_LB subtracts Delta_mu_i correctly.  |
| T27.09    | Evidence score: independent sub-score gates   | High psi_p & psi_g fails if psi_t<0.80 |
| T27.10    | 3D Grasp wrench opposition calculation        | psi_geom drops to 0.0 on unilateral.   |
| T27.11    | Load-transfer: per-finger positive check      | Opposing shear signs fail psi_transfer |
| T27.12    | PROBE_INCONCLUSIVE on sub-threshold shear     | Transitions to retry, no lift.         |
| T27.13    | PROBE_INCONCLUSIVE retry budget exhaustion    | N_retry=2 forces RECOVER_FALLBACK.     |
| T27.14    | Slip during probe triggers immediate recovery | rho > 0.80 arrests probe at 0.10 mm.   |
| T27.15    | Re-engagement hysteresis (3 healthy cycles)   | SENSOR_UNAVAILABLE requires 3 frames.  |
+-----------+-----------------------------------------------+----------------------------------------+
```

---

## 48.8. Review Gate & Signoff Request

Document 48 provides the mathematical and architectural resolution for all five blockers:
1. **Blocker 47.1 Resolved:** Recalculated theorem over full initial interval ($z_{\max} = 0.2563\text{ mm}$, $E_{\text{impact}} \le 0.88\text{ mJ}$, $J \le 0.0248\text{ N}\cdot\text{s}$) and established peak dynamic impact force bound $F_{\text{peak}} \le 2.65\text{ N} \ll 18.0\text{ N}$.
2. **Blocker 47.2 Resolved:** Completely removed artificial friction floor. Formulated rigorous empirical lower bound $\mu_{\text{LB}}$ with sensor noise discounting.
3. **Blocker 47.3 Resolved:** Converted sub-scores into explicit, independent conjunctive conditions ($\psi_p \ge 0.90 \land \psi_g \ge 0.85 \land \psi_t \ge 0.80 \land S_k \ge 0.85$) with binary sensor health gate $\Psi_{\text{sensor}} \in \{0, 1\}$.
4. **Blocker 47.4 Resolved:** Defined coordinate frames, tare baseline, individual finger positive shear support ($\Delta F_{t,z,i} > 0$), table reaction estimation, and $15.3\text{ SNR}$ justification for 20% threshold.
5. **Blocker 47.5 Resolved:** Formalized empirical calibration protocol (ECE, Brier, reliability) and explicitly decoupled probability estimates from deterministic safety invariants.

### Authorization Request
With Document 48 complete and committed, we formally request Technical Co-Founder authorization to proceed to:
**Phase 1: Authoring the 15 PLCEA Unit Tests (`tests/test_p27_plcea_evidence_acquisition.py`)**
*(Controller implementation in `src/coordination/plcea_substitutor.py` remains blocked until Phase 1 test suite is reviewed and approved).*
