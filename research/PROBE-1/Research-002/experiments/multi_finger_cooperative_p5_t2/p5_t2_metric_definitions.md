# HOROS PROBE-1 — Phase 5 Task 2 (P5-T2)
# Standard Metric Definitions & Measurement Conventions

**Task:** P5-T2 (Two-Contact Cooperative Grasping)  
**Document:** `p5_t2_metric_definitions.md`  
**Purpose:** Formally specify exact mathematical formulas, physical dimensions, sign conventions, and aggregation protocols for all reported telemetry and performance metrics.

---

## 1. Grasp Reliability Metrics

### 1.1 Episode Grasp Success ($S_{\text{grasp}}$)
- **Mathematical Definition:**
  $$S_{\text{grasp}} = \mathbb{I}\left( \neg \text{is\_gross\_slipping} \land \neg \text{object\_dropped} \land (t_{\text{final}} \ge 0.500\,\text{s}) \right)$$
- **Object Drop Thresholds:**
  $$\text{object\_dropped} \iff (|y_{\text{obj}}| > 0.020\,\text{m}) \lor (|\theta_{\text{obj}}| > 0.350\,\text{rad} \approx 20.05^{\circ})$$
- **Units:** Boolean $\in \{0, 1\}$.
- **Aggregation:** Mean across episodes $N_{\text{ep}}$:
  $$\bar{S} = \frac{1}{N_{\text{ep}}} \sum_{k=1}^{N_{\text{ep}}} S_{\text{grasp},k}$$

---

## 2. Force, Work, and Energy Metrics

### 2.1 Normal Force Impulse ($I_n$)
- **Mathematical Definition:**
  $$I_n = \int_0^{T_{\text{ep}}} \left( F_{n,1}(t) + F_{n,2}(t) \right) dt$$
- **Physical Meaning:** Time-integral of total normal clamping force applied to the workpiece. Represents total physical force exposure.
- **Physical Units:** Newton-seconds ($\text{N}\cdot\text{s}$).
- **Distinction Notice:** $I_n$ is **NOT** energy or mechanical work. Labeling impulse as energy is mathematically and physically invalid.

### 2.2 Normal Actuator Mechanical Work ($W_{\text{act}}$)
- **Mathematical Definition:**
  $$W_{\text{act}} = \sum_{i=1}^2 \int_0^{T_{\text{ep}}} F_{n,i}(t) \cdot \max\left(0, \frac{d\delta_{n,i}}{dt}\right) dt$$
  where $\delta_{n,i} = a_i^2 / R_i$ is normal elastic indentation of fingertip $i$.
- **Physical Meaning:** The positive mechanical work expended by the normal force actuators against the workpiece elastic contact stiffness.
- **Physical Units:** Joules ($\text{J}$) or millijoules ($\text{mJ}$).

### 2.3 Tangential Work of Friction ($W_{\text{tang}}$)
- **Mathematical Definition:**
  $$W_{\text{tang}} = \sum_{i=1}^2 \int_0^{T_{\text{ep}}} |F_{t,i}(t) \cdot v_{\text{rel},i}(t)| dt$$
- **Physical Meaning:** Mechanical dissipation and shear work at the contact interface.
- **Physical Units:** Joules ($\text{J}$) or millijoules ($\text{mJ}$).

---

## 3. Kinematic Stability & Tilt Metrics

### 3.1 Peak Episode Tilt Angle ($\theta_{\max}$)
- **Mathematical Definition:**
  $$\theta_{\max} = \max_{t \in [0, T_{\text{ep}}]} |\theta(t)|$$
  where $\theta(t)$ is the rotational pitch displacement of the workpiece about its center of mass.
- **Physical Units:** Radians ($\text{rad}$) or Degrees ($^{\circ}$).

### 3.2 Benchmark Mean Maximum Tilt ($\bar{\theta}_{\max}$)
- **Mathematical Definition:**
  $$\bar{\theta}_{\max} = \frac{1}{N_{\text{ep}}} \sum_{k=1}^{N_{\text{ep}}} \theta_{\max,k}$$
- **Reported Values:**
  - `EqualForce_Fixed8N`: $2.3804^{\circ}$ across all 300 benchmark episodes.
  - `LearnedUncertaintyCooperative`: $1.2339^{\circ}$ across all 300 benchmark episodes.

### 3.3 Benchmark Worst-Case Peak Tilt ($\theta_{\max}^{\text{worst}}$)
- **Mathematical Definition:**
  $$\theta_{\max}^{\text{worst}} = \max_{k \in \{1 \dots N_{\text{ep}}\}} \theta_{\max,k}$$
- **Reported Values:**
  - `EqualForce_Fixed8N`: $20.1041^{\circ}$ (Episode 213, Seed 4600214, under off-center tangential shock; hit drop ceiling $0.35\,\text{rad}$).
  - `LearnedUncertaintyCooperative`: $6.6768^{\circ}$ (Episode 238, Seed 4600239).

---

## 4. Force Distribution & Asymmetry Metrics

### 4.1 Force Imbalance Index ($\mathcal{I}_{\text{imb}}$)
- **Mathematical Definition:**
  $$\mathcal{I}_{\text{imb}} = \frac{1}{T_{\text{ep}}} \int_0^{T_{\text{ep}}} \frac{|F_{n,1}(t) - F_{n,2}(t)|}{\max(1.0, F_{n,1}(t) + F_{n,2}(t))} dt$$
- **Physical Meaning:** Degree of normal force asymmetry. In a 2-finger pinch grasp, $\mathcal{I}_{\text{imb}} > 0$ produces net lateral acceleration on the object squeeze axis:
  $$m \ddot{x} = (F_{n,2} - F_{n,1}) - c_x \dot{x}$$
- **Units:** Dimensionless $\in [0, 1]$.
