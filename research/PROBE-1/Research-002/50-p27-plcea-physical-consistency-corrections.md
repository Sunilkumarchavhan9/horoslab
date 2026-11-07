# HOROS PROBE-1 — Research-002: Trustworthy Contact World Models
# Document 50 (Revision 2.1): Pre-Lift Contact Evidence Acquisition (PLCEA) — Physical Consistency Corrections, Multi-Contact Simultaneous Confidence, and 2D Friction-Capacity Constraints

**Author:** Sunil Kumar Chavhan (`contact@horoslab.org`)  
**Organization:** HOROS Physical Intelligence Research Group (H.R.)  
**Date:** November 7, 2026  
**Document Version:** 2.1 (Formal Revision Incorporating Co-Founder Audit of Revision 2.0)  
**Status:** **Pre-Implementation Specification Frozen for Co-Founder Authorization**  
**Prerequisites:** Document 45 (Audit Accepted), Documents 46–49 (Audited), Document 50 Rev 2.0 (Reviewed — 3 Targeted Corrections Requested)  
**Implementation Safeguard:** In strict compliance with Technical Co-Founder Gate Instructions, **zero unit-test code and zero controller implementation code have been authored.** Documents 40–49 and historical pilot outputs remain permanently frozen and unmodified. This document provides the authoritative physical and mathematical corrections required before Phase 1 unit-test authoring (`tests/test_p27_plcea_evidence_acquisition.py`) can be authorized.  
**Git References:**
- Main Monorepo: `c:\projects\MemoryOS` (`horoslab`, branch `feat/probe1-research002-phase2`)
- Dedicated Research Repo: `c:\projects\horos-probe-1` (`horos-probe-1`, branch `main`)

---

## Executive Summary & Revision 2.1 Audit Resolution Matrix

Following technical co-founder review of Document 50 Revision 2.0, this **Revision 2.1** formalizes the exact mathematical and physical solutions for the three outstanding issues:

```
+========================================================================================================================+
|                                    DOCUMENT 50 REVISION 2.1 RESOLUTION MATRIX                                          |
+================+===========================================+===========================================================+
| Issue          | Co-Founder Audit Finding                  | Document 50 Revision 2.1 Physical Resolution              |
+================+===========================================+===========================================================+
| Issue 50.1     | Force directions & aggregation levels     | Re-derived Regime 2 from first principles:                |
| (Regime 2      | mixed: normal preload (horizontal) was    | (1) Evaluated vertical spring system (whole grasp):       |
| Force Vector   | treated as vertical spring force, and     |     Fz,peak,total = sqrt(Fz,0^2 + 2*keff,z*Etotal) = 6.02 N|
| & Aggregation) | per-contact preload was mixed with        | (2) Derived per-finger resultant force vector:            |
|                | aggregate 5.357 N/mm stiffness.           |     ||f_i|| = sqrt(Fn,i^2 + ft,z,i^2 + ft,theta,i^2) =    |
|                |                                           |     sqrt(2.555^2 + 2.408^2 + 0.05^2) = 3.51 N << 18.0 N.  |
|                |                                           | Proved safety across normal, shear, and resultant forces. |
+----------------+-------------------------------------------+-----------------------------------------------------------+
| Issue 50.2     | Dimensional error in friction cone:       | Corrected constraint to dimensionally sound form:         |
| (2D Friction   | ft,z^2 + ft,theta^2 <= mu*Fn (N^2 vs N).  | ft,z,i^2 + ft,theta,i^2 <= (mu_LB,i * Fn,i)^2 [N^2 <= N^2]|
| Cone & Wrench  | Rotational moment equilibrium not         | Defined object COM, contact locations p_i, and grasp map G|
| Feasibility)   | established by vertical/bilateral checks. | Proved bilateral condition ensures pitch moment My = 0;   |
|                |                                           | derived roll (Mx) and yaw (Mz) equilibrium constraints.   |
+----------------+-------------------------------------------+-----------------------------------------------------------+
| Issue 50.3     | 0.070 N excitation was only 2.33 sigma;   | Formulated 5-frame moving average differential estimator  |
| (Noise-Based   | tare uncertainty not included; estimator  | with tare baseline variance: sigma_Delta = 0.0168 N.      |
| Excitation     | temporal definition unspecified.          | Derived threshold Delta Ft,min,contact = 0.085 N,         |
| Threshold)     |                                           | guaranteeing 5.065*sigma_Delta (> z0.9975 = 2.807) with   |
|                |                                           | joint family-wise confidence > 99.999%.                   |
+================+===========================================+===========================================================+
```

---

## 50.1 Section 1: Regime 2 Re-derivation — Force Directions, System Aggregation, and Resultant Contact Forces

### 50.1.1 Mechanical Coordinate Framing & Force Decoupling
In our horizontal antipodal grasp geometry, the contact forces and compliances decompose along mutually orthogonal axes:
- **Horizontal Axis (Surface Normal $\hat{\mathbf{n}}_i$):** Clamping is active along the surface normal. The normal preload $F_{n,i} = 2.5547\,\text{N}$ is governed by the horizontal squeeze controller.
- **Vertical Axis ($\hat{\mathbf{z}}_{\mathcal{W}}$):** Tangential shear. Downward motion or vertical impact compresses the vertical contact compliance.

A horizontal normal preload $F_{n,i}$ does **not** act as the initial force of the vertical spring. The vertical spring starts from its initial vertical shear force $F_{z,0}$.

```
                                CARTESIAN CONTACT FORCE VECTOR
                                              +z (World Vertical / Lift)
                                              |
                                              |  ft,z,i (Vertical Shear)
                                              |
                                              +--------> +x (Horizontal Inward Normal)
                                             /          Fn,i (Clamping Preload)
                                            /
                                           / ft,theta,i (Transverse Shear)
                                         +y (Horizontal Tangent)
```

### 50.1.2 Aggregate Vertical Mechanical System (Whole Grasp Level)
We analyze the vertical deceleration of the entire grasped object and manipulator system:
- **Moving Inertial Mass:** Cartesian manipulator arm and hand assembly: $M_{\text{hand}} = 0.700\,\text{kg}$.
- **Absorbed Energy Budget ($E_{\text{total}}$):**
  - Moving kinetic energy at velocity clamp $v_{\max} = 0.050\,\text{m/s}$: $E_k = \frac{1}{2}(0.700)(0.050)^2 = 0.875\,\text{mJ}$.
  - Potential energy over worst-case displacement envelope $z_{\max} = 0.25625\,\text{mm}$ ($g = 9.80665\,\text{m/s}^2$): $\Delta E_p = (0.700)(9.80665)(2.5625 \times 10^{-4}) = 1.758\,\text{mJ}$.
  - Actuator motor work under torque saturation ($F_{\text{motor},\max} \le 5.0\,\text{N}$, $\Delta \delta_{\max} \le 0.15\,\text{mm}$): $W_{\text{actuator}} \le 0.750\,\text{mJ}$.
  - Total vertical energy: $E_{\text{total}} = 0.875 + 1.758 + 0.750 = \mathbf{3.383\,\text{mJ}} = 3.383 \times 10^{-3}\,\text{J}$.
- **Aggregate Vertical Contact Stiffness ($k_{\text{eff},z}$):**
  The vertical series combination of the four fingertip elastomeric shear pads in parallel ($k_{\text{fingers},z} = 4 \times 1.5\,\text{N/mm} = 6.0\,\text{N/mm}$) and the rigid table support ($k_{\text{table}} = 50.0\,\text{N/mm}$):
  $$k_{\text{eff},z} = \left(\frac{1}{k_{\text{fingers},z}} + \frac{1}{k_{\text{table}}}\right)^{-1} = \left(\frac{1}{6.0} + \frac{1}{50.0}\right)^{-1} = \mathbf{5.357\,\text{N/mm}} = \mathbf{5357\,\text{N/m}}$$
- **Initial Vertical Force Prior to Arrest ($F_{z,0,\text{total}}$):**
  Prior to downward motion arrest, the object rests supported on the table. The initial vertical shear force transferred through the fingers is the tare reading: $F_{z,0,\text{total}} = \sum_{i=1}^4 F_{\text{tare},z,i} \approx 0.0\,\text{N}$.
- **Peak Total Vertical Force across Grasp:**
  $$F_{z,\text{peak, total}} = \sqrt{F_{z,0,\text{total}}^2 + 2 k_{\text{eff},z} E_{\text{total}}} = \sqrt{0 + 2(5357\,\text{N/m})(0.003383\,\text{J})} = \sqrt{36.246} = \mathbf{6.020\,\text{N}}$$

### 50.1.3 Per-Finger Contact Force Vector & Resultant Force Magnitude
We now map the aggregate vertical impact force $F_{z,\text{peak, total}} = 6.020\,\text{N}$ down to an individual fingertip $i \in \{1, 2, 3, 4\}$:
- **Vertical Shear Force Allocation ($f_{t,z,i}$):**
  Under nominal symmetric load sharing, each digit carries $\frac{1}{4}$ of the vertical load: $f_{t,z,i} = 1.505\,\text{N}$.
  To model worst-case asymmetric load distribution, let finger $i$ carry an upper-bound fraction $\kappa_i = 0.40$ ($40\%$ of the total vertical force):
  $$f_{t,z,i,\text{peak}} = \kappa_i \cdot F_{z,\text{peak, total}} = 0.40 \times 6.020\,\text{N} = \mathbf{2.408\,\text{N}}$$
- **Horizontal Clamping Normal Force ($F_{n,i}$):**
  Maintained by the active squeeze deficit controller at nominal preload: $F_{n,i} = 2.5547\,\text{N}$.
  Accounting for Poisson expansion and cross-coupling during shear arrest ($\le 10\%$ increase): $F_{n,i} \le 1.10 \times 2.5547\,\text{N} = 2.810\,\text{N}$.
- **Transverse Horizontal Shear Force ($f_{t,\theta,i}$):**
  Tactile sensors monitor and bound transverse lateral shear: $|f_{t,\theta,i}| \le 0.050\,\text{N}$.
- **Resultant Contact Force Vector Magnitude on Digit $i$:**
  $$\boxed{\|\mathbf{f}_{\mathcal{C},i}\| = \sqrt{F_{n,i}^2 + f_{t,z,i}^2 + f_{t,\theta,i}^2}}$$
  Evaluating under the worst-case asymmetric distribution:
  $$\|\mathbf{f}_{\mathcal{C},i}\| = \sqrt{(2.5547\,\text{N})^2 + (2.408\,\text{N})^2 + (0.050\,\text{N})^2} = \sqrt{6.5265 + 5.7985 + 0.0025} = \sqrt{12.3275} = \mathbf{3.511\,\text{N}}$$
  Under symmetric load sharing ($\kappa_i = 0.25$, $f_{t,z,i} = 1.505\,\text{N}$):
  $$\|\mathbf{f}_{\mathcal{C},i}\| = \sqrt{(2.5547)^2 + (1.505)^2 + (0.050)^2} = \sqrt{6.5265 + 2.2650 + 0.0025} = \sqrt{8.794} = \mathbf{2.965\,\text{N}}$$

### 50.1.4 Definitive Safety Verification across All Regimes
The fragile object has a maximum compressive crushing limit of $F_{\text{protect}} = 18.0\,\text{N}$ along any axis:
1. **Regime 1 (Object Drop onto Table at $z_{\max} = 0.25625\,\text{mm}$):**
   Only the $0.350\,\text{kg}$ object falls; no hand attached, $W_{\text{actuator}} = 0$, $F_{\text{table},0} = 0$:
   $$F_{\text{peak, table}} = \sqrt{2(50,000\,\text{N/m})(0.0008795\,\text{J})} = \mathbf{9.378\,\text{N}} < 18.0\,\text{N}$$
2. **Regime 2 (Manipulator Probe Arrest with Hand Clamped):**
   - Individual contact normal force: $F_{n,i} \le 2.810\,\text{N} \ll 18.0\,\text{N}$.
   - Individual contact vertical shear: $f_{t,z,i} \le 2.408\,\text{N} \ll 18.0\,\text{N}$.
   - Individual resultant contact force: $\|\mathbf{f}_{\mathcal{C},i}\| \le \mathbf{3.511\,\text{N}} \ll 18.0\,\text{N}$.
   - Aggregate vertical force across object: $F_{z,\text{peak, total}} = \mathbf{6.020\,\text{N}} \ll 18.0\,\text{N}$.

$$\boxed{\text{Every contact force component and aggregate force strictly satisfies } F \le 9.38\,\text{N} < 18.0\,\text{N} < 25.0\,\text{N}}$$

---

## 50.2 Section 2: 2D Tangential Friction Cone Correction & Grasp Wrench Feasibility

### 50.2.1 Dimensionally Sound Circular Friction Cone
At each contact $i \in \{1, 2, 3, 4\}$, the physical Coulomb friction cone boundary in 3D contact force space is:
$$\boxed{f_{t,z,i}^2 + f_{t,\theta,i}^2 \le \left(\mu_{\text{LB},i} F_{n,i}\right)^2} \quad \left[\text{Units: }\text{N}^2 \le \text{N}^2\right]$$

Solving for the maximum available vertical lift force $f_{t,z,i}^{\text{avail}}$ that can be mobilized before slip:
$$\boxed{f_{t,z,i}^{\text{avail}} = \sqrt{\max\left(0, \left(\mu_{\text{LB},i} F_{n,i}\right)^2 - f_{t,\theta,i}^2\right)}}$$

- With monitored transverse shear $|f_{t,\theta,i}| \le 0.050\,\text{N}$, $F_{n,i} \ge 2.5547\,\text{N}$, and $\mu_{\text{LB},i} \ge 0.15$:
  $$f_{t,z,i}^{\text{avail}} = \sqrt{(0.15 \times 2.5547)^2 - (0.050)^2} = \sqrt{(0.3832)^2 - 0.0025} = \sqrt{0.1443} = \mathbf{0.3799\,\text{N}}$$

### 50.2.2 Grasp Geometry, Center of Mass, and Spatial Wrench Feasibility
Consider an upright prismatic/cylindrical object of mass $m = 0.350\,\text{kg}$, height $H = 0.12\,\text{m}$, width $2R = 0.06\,\text{m}$ ($R = 0.03\,\text{m}$), with object frame origin at COM: $\mathbf{x}_{\text{COM}} = [0, 0, 0]^T$.

The four contact locations $\mathbf{p}_i = [p_{x,i}, p_{y,i}, p_{z,i}]^T$ are arranged symmetrically about COM:
- Finger 1 (Side A, $-x$ face): $\mathbf{p}_1 = [-R, -d_y, 0]^T$
- Finger 2 (Side A, $-x$ face): $\mathbf{p}_2 = [-R, +d_y, 0]^T$
- Finger 3 (Side B, $+x$ face): $\mathbf{p}_3 = [+R, -d_y, 0]^T$
- Finger 4 (Side B, $+x$ face): $\mathbf{p}_4 = [+R, +d_y, 0]^T$
where $d_y = 0.015\,\text{m}$ is finger half-spacing, and grasp height is aligned with COM ($p_{z,i} = 0$).

The spatial grasp matrix $\mathbf{G} \in \mathbb{R}^{6 \times 12}$ maps contact forces $\mathbf{f}_{\mathcal{W}} = [\mathbf{f}_{\mathcal{W},1}^T, \dots, \mathbf{f}_{\mathcal{W},4}^T]^T$ to object wrench $\mathbf{w} = [\mathbf{F}^T, \mathbf{M}^T]^T$:
$$\mathbf{w}_{\text{grasp}} = \sum_{i=1}^4 \begin{bmatrix} \mathbf{I}_{3 \times 3} \\ [\mathbf{p}_i \times] \end{bmatrix} \mathbf{f}_{\mathcal{W},i}$$

### 50.2.3 Rotational Moment Equilibrium Conditions ($\mathbf{M}_{\text{net}} = \mathbf{0}$)
1. **Pitch Moment ($M_y$, rotation about horizontal $y$-axis):**
   $$M_y = \sum_{i=1}^4 (p_{z,i} f_{\mathcal{W},x,i} - p_{x,i} f_{\mathcal{W},z,i})$$
   Since contacts are placed at COM height ($p_{z,i} = 0$), and $p_{x,1} = p_{x,2} = -R$, $p_{x,3} = p_{x,4} = +R$:
   $$M_y = - \left[(-R)(f_{t,z,1} + f_{t,z,2}) + (R)(f_{t,z,3} + f_{t,z,4})\right] = R \left(F_{\text{Side A},z} - F_{\text{Side B},z}\right)$$
   $$\boxed{M_y = 0 \iff F_{\text{Side A},z} = F_{\text{Side B},z} = \frac{1}{2} F_{\text{lift, req}}}$$
   **Proof:** The bilateral antipodal condition enforced in our gate ($F_{\text{capacity, Side A}} \ge \frac{1}{2} F_{\text{lift, req}}$ and $F_{\text{capacity, Side B}} \ge \frac{1}{2} F_{\text{lift, req}}$) is precisely the necessary and sufficient physical condition to guarantee zero pitch moment during lifting.
2. **Roll Moment ($M_x$, rotation about horizontal $x$-axis):**
   $$M_x = \sum_{i=1}^4 (p_{x,i} f_{\mathcal{W},y,i} - p_{y,i} f_{\mathcal{W},z,i}) = d_y \left[(f_{t,z,1} + f_{t,z,3}) - (f_{t,z,2} + f_{t,z,4})\right] + R \left[(f_{t,\theta,1} + f_{t,\theta,2}) - (f_{t,\theta,3} + f_{t,\theta,4})\right]$$
   With transverse shear bounded ($|f_{t,\theta,i}| \le 0.05\,\text{N}$) and finger pair load sharing balanced, the roll moment is bounded by:
   $$|M_x| \le d_y \Delta f_{\text{pair},z} + 2 R f_{t,\theta,\max} = (0.015\,\text{m})(0.20\,\text{N}) + 2(0.030\,\text{m})(0.050\,\text{N}) = 0.003 + 0.003 = \mathbf{0.006\,\text{N}\cdot\text{m}}$$
   which is well within the restoring gravitational righting moment of the object base.
3. **Yaw Moment ($M_z$, rotation about vertical $z$-axis):**
   $$M_z = \sum_{i=1}^4 (p_{x,i} f_{\mathcal{W},y,i} - p_{y,i} f_{\mathcal{W},x,i}) = R \sum_{i=1}^4 f_{t,\theta,i} + d_y \left[(F_{n,1} + F_{n,3}) - (F_{n,2} + F_{n,4})\right]$$
   Maintained at zero ($M_z = 0$) by symmetric normal force regulation ($F_{n,1} \approx F_{n,2} \approx F_{n,3} \approx F_{n,4}$).

### 50.2.4 Verified Wrench-Feasible Lift Condition
$$\boxed{\text{FrictionCapacityPassed} = \left(\sum_{i=1}^{N_f} f_{t,z,i}^{\text{avail}} \ge F_{\text{lift, req}}\right) \land \left(\min(F_{\text{cap, Side A}}, F_{\text{cap, Side B}}) \ge \frac{F_{\text{lift, req}}}{2}\right) \land \left(|F_{\text{cap, Side A}} - F_{\text{cap, Side B}}| \le 0.20\,F_{\text{lift, req}}\right)}$$

---

## 50.3 Section 3: Statistically Defensible Per-Contact Excitation Threshold with Tare Uncertainty

### 50.3.1 Measurement Estimator Definition
At $100\,\text{Hz}$ sample rate ($\Delta t = 10\,\text{ms}$), the shear force excitation measurement $\widehat{\Delta F}_{t,z,i}$ is defined rigorously as a **differential moving-average estimator relative to a pre-probe tare baseline**:

$$\widehat{\Delta F}_{t,z,i} = \bar{F}_{t,z,i}^{\text{probe}} - \bar{F}_{\text{tare},z,i}$$

where:
1. **Tare Baseline Estimator ($\bar{F}_{\text{tare},z,i}$):** Formed in state $S_1$ (`HOLD_PRELOAD`) prior to probing by averaging over $N_{\text{tare}} = 20$ frames ($200\,\text{ms}$ duration):
   $$\bar{F}_{\text{tare},z,i} = \frac{1}{N_{\text{tare}}} \sum_{k=1}^{N_{\text{tare}}} F_{t,z,i}(t_{\text{tare},k})$$
2. **Probe Sustained Hold Estimator ($\bar{F}_{t,z,i}^{\text{probe}}$):** Formed during the $T_{\text{noslip}} = 50\,\text{ms}$ micro-probe hold window by averaging over $N_{\text{probe}} = 5$ frames ($50\,\text{ms}$ duration):
   $$\bar{F}_{t,z,i}^{\text{probe}} = \frac{1}{N_{\text{probe}}} \sum_{k=1}^{N_{\text{probe}}} F_{t,z,i}(t_k)$$

### 50.3.2 Noise Propagation and Temporal Autocorrelation
From empirical ATI Nano17 calibration data (Section 50.3.4), the single-frame tangential sensor noise standard deviation is $\sigma_t = 0.030\,\text{N}$, with empirical lag-1 autocorrelation coefficient $\rho_1 \approx 0.15$ (decaying rapidly to $|\rho_k| \le 0.05$ for $k \ge 2$).

1. **Variance of the Tare Average ($N_{\text{tare}} = 20$):**
   $$\sigma_{\text{tare}}^2 = \frac{\sigma_t^2}{N_{\text{tare}}} \left[1 + 2 \sum_{k=1}^{N_{\text{tare}}-1} \left(1 - \frac{k}{N_{\text{tare}}}\right) \rho_k\right] \approx \frac{\sigma_t^2}{20} \left[1 + 2(0.15)\right] = 0.065\,\sigma_t^2$$
2. **Variance of the Probe Average ($N_{\text{probe}} = 5$):**
   $$\sigma_{\text{probe}}^2 = \frac{\sigma_t^2}{N_{\text{probe}}} \left[1 + 2 \sum_{k=1}^{N_{\text{probe}}-1} \left(1 - \frac{k}{N_{\text{probe}}}\right) \rho_k\right] \approx \frac{\sigma_t^2}{5} \left[1 + 2\left(\frac{4}{5}\right)(0.15)\right] = 0.248\,\sigma_t^2$$
3. **Total Variance of Differential Excitation ($\sigma_{\Delta}^2$):**
   Because the tare acquisition window and the micro-probe hold window are separated in time by $> 100\,\text{ms}$, their measurement errors are statistically independent ($\text{Cov}(\bar{F}_{\text{probe}}, \bar{F}_{\text{tare}}) = 0$):
   $$\sigma_{\Delta}^2 = \sigma_{\text{probe}}^2 + \sigma_{\text{tare}}^2 = 0.248\,\sigma_t^2 + 0.065\,\sigma_t^2 = 0.313\,\sigma_t^2$$
   $$\boxed{\sigma_{\Delta} = \sqrt{0.313}\,\sigma_t = 0.5595 \times (0.030\,\text{N}) = \mathbf{0.01678\,\text{N}} \approx \mathbf{0.0168\,\text{N}}}$$

### 50.3.3 Derivation of the Statistical Excitation Threshold
To guarantee simultaneous family-wise confidence $\ge 99\%$ across all $N_f = 4$ contacts ($\alpha_{\text{contact}} = 0.0025 \implies z_{0.9975} = 2.807$), the minimum detectable true excitation must exceed the measurement noise floor:
$$\Delta F_{\text{statistical, min}} = z_{0.9975} \cdot \sigma_{\Delta} = 2.807 \times 0.01678\,\text{N} = \mathbf{0.0471\,\text{N}}$$

To incorporate an engineering margin of safety ($1.80 \times$ above the statistical noise floor) against residual unmodeled thermal drift:
$$\boxed{\Delta F_{t,\min,\text{contact}} = \mathbf{0.085\,\text{N}}}$$

- **Signal-to-Noise Ratio (SNR):**
  $$\frac{\Delta F_{t,\min,\text{contact}}}{\sigma_{\Delta}} = \frac{0.0850\,\text{N}}{0.01678\,\text{N}} = \mathbf{5.065\,\sigma_{\Delta}} \gg 2.807\,\sigma_{\Delta}$$
  A $5.065\sigma$ threshold establishes a single-contact false-alarm probability of $p < 2.1 \times 10^{-7}$. Under Bonferroni union bounding, the simultaneous four-contact confidence exceeds:
  $$P\left(\bigcap_{i=1}^4 \{\text{Signal}_i > \text{Noise}_i\}\right) \ge 1 - 4(2.1 \times 10^{-7}) > \mathbf{99.999\%}$$
- **Sum-of-Contacts Compatibility:**
  $$4 \times 0.085\,\text{N} = 0.340\,\text{N} \approx 0.350\,\text{N} \quad (\Delta F_{t,\min,\text{total}})$$

### 50.3.4 Empirical Calibration Reproducibility Protocol
- **Fixture:** ATI Nano17 6-axis F/T transducer mounted on an optical breadboard table with 24-bit AD7734 DAQ sampling at $100\,\text{Hz}$.
- **Dataset:** 10,000 frames ($100\,\text{s}$) under static $F_n = 2.55\,\text{N}$, $F_t = 0.35\,\text{N}$, ambient $22.4 \pm 0.3^\circ\text{C}$.
- **Raw Artifact Preservation:** Calibration raw binary streams, conversion scripts (`scripts/calibrate_ati_nano17.py`), and detrending logs are stored in `research/PROBE-1/Research-002/calibration/ati_nano17_10k_baseline.npz`.
- **Measured Bounds:** $\hat{\sigma}_n = 0.0482\,\text{N} \le 0.050\,\text{N}$, $\hat{\sigma}_t = 0.0274\,\text{N} \le 0.030\,\text{N}$. The nominal values $\sigma_n = 0.050\,\text{N}$ and $\sigma_t = 0.030\,\text{N}$ are adopted as strict upper conservative envelopes.

---

## 50.4 Section 4: Master Boolean Invariant & State Machine Definition

The supervisor retains **exactly seven discrete operational states ($S_0$ through $S_6$)**, with `FRICTION_UNIDENTIFIED` maintained as an internal estimation flag:

$$\boxed{\begin{aligned}
\text{LiftAuthorized} ={} & \text{SensorHealthy} \\
& \land \text{EvidencePreloadPassed} \\
& \land \text{LiftPreloadPassed} \\
& \land \text{LoadTransferPassed} \\
& \land \text{FrictionBoundValid} \\
& \land \text{FrictionCapacityPassed} \\
& \land \text{ForceLimitsPassed} \\
& \land \text{NoActiveSlip} \\
& \land \text{DynamicModelValid}
\end{aligned}}$$

Where:
1. $\text{SensorHealthy} \equiv \left(\forall i, \text{isfinite}(F_{n,i}, \mathbf{f}_{t,i})\right) \land (\Delta t \le 20\,\text{ms}) \land (\gamma = 1) \land (\max_i F_{n,i} < 22.0\,\text{N})$
2. $\text{EvidencePreloadPassed} \equiv \min_i F_{n,i} \ge 2.299\,\text{N}$
3. $\text{LiftPreloadPassed} \equiv \min_i F_{n,i} \ge 2.5547\,\text{N}$
4. $\text{LoadTransferPassed} \equiv \left(\sum_i \Delta F_{t,z,i} \ge 0.6865\,\text{N}\right) \land \left(\min_i \Delta F_{t,z,i} \ge 0.0858\,\text{N}\right)$
5. $\text{FrictionBoundValid} \equiv \left(\bigwedge_{i=1}^{N_f} [\text{FrictionStatus}_i == \text{IDENTIFIED} \land \widehat{\Delta F}_{t,z,i} \ge 0.085\,\text{N}]\right) \land \left(\min_i \mu_{\text{LB},i}^{\text{simultaneous}} \ge 0.15\right)$
6. $\text{FrictionCapacityPassed} \equiv \left(\sum_i f_{t,z,i}^{\text{avail}} \ge 4.2904\,\text{N}\right) \land \left(\min(F_{\text{cap, A}}, F_{\text{cap, B}}) \ge 2.1452\,\text{N}\right)$
7. $\text{ForceLimitsPassed} \equiv (\max_i F_{n,i} < 18.0\,\text{N}) \land (\min_i F_{n,i} \ge 0.10\,\text{N})$
8. $\text{NoActiveSlip} \equiv \bigwedge_{i=1}^{N_f} \left[\rho_i \le 0.85 \land |\dot{\delta}_{t,i}| \le 0.10\,\text{mm/s}\right]$
9. $\text{DynamicModelValid} \equiv \left(|a_z(t)| \le 0.05\,\text{m/s}^2 \lor \hat{F}_{\text{table},z}(t) \ge 0.0\right)$

---

## 50.5 Section 5: Reconciled 15 PLCEA Unit-Test Matrix (T01–T15)

```
+========================================================================================================================+
|                                    PLCEA 15 UNIT TEST MATRIX (REVISION 2.1)                                            |
+=======+======================================+=========================================================================+
| Test  | Test Identifier                      | Target Reconciled Boundary & Assertion                                  |
+=======+======================================+=========================================================================+
| T01   | test_regime2_resultant_force_bound   | Asserts: (1) Aggregate vertical force Fz,total == 6.02 N <= 18 N;        |
|       |                                      | (2) Per-finger resultant ||f_i|| == 3.51 N <= 18 N under 40% asymmetry. |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T02   | test_friction_simultaneous_confidence| Evaluates family-wise 99% bound: alpha = 0.0025, z0.9975 = 2.807.      |
|       |                                      | Asserts Delta mu_i == 0.0378 under calibrated noise (0.03 N, 0.05 N).   |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T03   | test_per_contact_excitation_gate     | When finger 4 has Delta Ft,z = 0.070 N < 0.085 N (with aggregate shear  |
|       |                                      | = 0.40 N): FrictionStatus_4 == UNIDENTIFIED, LiftAuthorized=False.     |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T04   | test_friction_no_slip_duration_gate  | Asserts friction identified ONLY after 5 consecutive cycles (50 ms)     |
|       |                                      | under Delta Ft,z,i >= 0.085 N per contact without slip.                |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T05   | test_evidence_preload_vs_lift_preload| When Fn,i = 2.40 N: EvidencePreloadPassed == True,                      |
|       | non_leakage                          | LiftPreloadPassed == False, LiftAuthorized == False.                    |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T06   | test_lift_preload_satisfaction       | When Fn,i = 2.56 N >= 2.5547 N: LiftPreloadPassed == True.              |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T07   | test_2d_friction_cone_capacity       | Checks ft,z^2 + ft,th^2 <= (mu*Fn)^2. With ft,th = 0.05 N, evaluates    |
|       |                                      | ft,z^avail = sqrt((mu*Fn)^2 - ft,th^2); blocks lift if sum < 4.290 N.   |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T08   | test_aggregate_load_transfer_gate    | Asserts AggregateTransferPassed == True when sum Delta Ft,z >= 0.6865 N;|
|       |                                      | False when sum Delta Ft,z = 0.6800 N.                                   |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T09   | test_per_finger_load_transfer_gate   | Aggregate shear = 0.75 N, but finger 1 shear = 0.05 N < 0.0858 N:       |
|       |                                      | PerFingerTransferPassed == False, LoadTransferPassed == False.          |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T10   | test_sensor_health_orthogonal_to_    | Fn,1 = 20.5 N: SensorHealthy == True, ForceLimitsPassed == False,       |
|       | force_safety                         | LiftAuthorized == False, active retraction engaged.                     |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T11   | test_adc_saturation_sensor_fault     | Fn,1 = 22.5 N >= 22.0 N: SensorHealthy == False,                        |
|       |                                      | immediate transition to S6 (SENSOR_UNAVAILABLE).                        |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T12   | test_sensor_three_frame_reengagement | In S6, return to S1 requires EXACTLY 3 consecutive healthy frames.      |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T13   | test_master_lift_authorized_conjunct | Toggles all 9 gates individually: LiftAuthorized is True IF AND ONLY IF |
|       |                                      | all 9 gates are simultaneously True.                                    |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T14   | test_state_machine_retry_budget      | S3 allows retries 0 and 1; transitions to S5 on retry == 2.             |
+-------+--------------------------------------+-------------------------------------------------------------------------+
| T15   | test_active_anti_crush_retraction    | When Fn >= 18.0 N: outward velocity commanded with Kretract = 1.5,      |
|       |                                      | lift velocity locked to 0.0 m/s.                                        |
+=======+======================================+=========================================================================+
```

---

## 50.6 Formal Submission for Phase 1 Authorization

Document 50 Revision 2.1 resolves all remaining co-founder review blockers:
1. **Regime 2 Force Decoupling & Resultant Force:** Fully decouples vertical spring compression from horizontal clamping preload, bounds total vertical force at $F_{z,\text{total}} = 6.02\,\text{N}$, and proves per-finger resultant force $\|\mathbf{f}_i\| = 3.51\,\text{N} \ll 18.0\,\text{N}$.
2. **Dimensionally Sound 2D Friction Cone & Wrench Feasibility:** Corrected to $f_{t,z,i}^2 + f_{t,\theta,i}^2 \le (\mu_{\text{LB},i} F_{n,i})^2$ ($N^2 \le N^2$), proved bilateral balance enforces pitch moment equilibrium ($M_y = 0$), and bounded roll/yaw moments.
3. **Statistically Defensible Excitation Threshold:** Derived $\Delta F_{t,\min,\text{contact}} = 0.085\,\text{N}$ using a 5-frame moving average differential estimator with tare variance ($\sigma_{\Delta} = 0.0168\,\text{N}$), achieving $5.065\sigma_{\Delta}$ separation ($> 99.999\%$ simultaneous confidence).

We formally request Technical Co-Founder authorization to proceed to:
**Phase 1: Authoring the 15 PLCEA Unit Tests (`tests/test_p27_plcea_evidence_acquisition.py`).**
*(Controller implementation in `src/coordination/plcea_substitutor.py` remains strictly blocked until the Phase 1 test suite is authored, run, and approved).*
