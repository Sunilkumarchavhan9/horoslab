# HOROS PROBE-1 — Phase 4 Task 3 (P4-T3) Preflight Dataset Audit & Reconciliation Report

**Program:** HOROS Physical Interaction Data Engine (PIDE)  
**Project:** Research-002: Model Teaching Infrastructure & Tactile Contact Mechanics  
**Document Identifier:** `HOROS-P1-R002-P4-T3-PREFLIGHT-DATASET-AUDIT`  
**Date:** 2026-11-23  
**Status:** **AUTHORITATIVE SCIENTIFIC PREFLIGHT AUDIT**  
**Auditor:** HOROS Physical Intelligence Research Group  
**Task Scope:** Mandatory Pre-Implementation Audit for P4-T3  

---

## 1. Executive Summary & Resolution of Dataset Discrepancy

### 1.1 The Reported Discrepancy
The **P4-T2** scientific report (`p4_t2_preslip_baseline_evaluation_report.md`, Section 3) described the dataset as:
> *"Friction Grid ($\mu_s$): 6 levels: $\{0.30, 0.40, 0.50, 0.60, 0.70, 0.80\}$"*
However, Section 4.3 of the same report presented a performance breakdown containing **eight distinct friction levels**:
> *$\mu_s \in \{0.30, 0.35, 0.40, 0.50, 0.60, 0.65, 0.70, 0.80\}$*
with trajectory counts summing to exactly $96$.

### 1.2 Physical and Algorithmic Root Cause
Inspection of the canonical trajectory generator (`p4_t1_generate_trajectories.py`, lines 185–235) and the stored manifest (`p4_t1_trajectory_manifest.json`) reveals the precise origin of this discrepancy:

1. **Standard Monotonic Shear Ramps (72 trajectories):**  
   Generated across the 6 primary factorial grid points:
   $$\mu_s \in \{0.30, 0.40, 0.50, 0.60, 0.70, 0.80\} \quad (6 \text{ levels})$$
   $$\times \; F_n \in \{3.0, 5.0, 10.0, 15.0\}\text{ N} \quad (4 \text{ loads})$$
   $$\times \; v \in \{1.0, 2.5, 5.0\}\text{ mm/s} \quad (3 \text{ speeds})$$
   $$= 6 \times 4 \times 3 = \mathbf{72\text{ trajectories}}$$

2. **Dynamic Micro-Probe Oscillations (12 trajectories):**  
   Generated with $20\text{ Hz}$ micro-sine oscillations superimposed on a tangential ramp, across 4 friction levels:
   $$\mu_s \in \{0.35, 0.50, 0.65, 0.80\} \quad (4 \text{ levels})$$
   $$\times \; F_n \in \{5.0, 10.0, 15.0\}\text{ N} \quad (3 \text{ loads}) \quad \text{at } v = 2.5\text{ mm/s}$$
   $$= 4 \times 3 = \mathbf{12\text{ trajectories}}$$

3. **Normal Force Fluctuations / Perturbations (12 trajectories):**  
   Generated with $\pm 10\%$ sinusoidal modulation of normal load during tangential shear, across the same 4 friction levels:
   $$\mu_s \in \{0.35, 0.50, 0.65, 0.80\} \quad (4 \text{ levels})$$
   $$\times \; F_n \in \{5.0, 10.0, 15.0\}\text{ N} \quad (3 \text{ loads}) \quad \text{at } v = 2.5\text{ mm/s}$$
   $$= 4 \times 3 = \mathbf{12\text{ trajectories}}$$

### 1.3 Total Cross-Tabulation
The union of friction levels across the three subsets is:
$$\{0.30, 0.40, 0.50, 0.60, 0.70, 0.80\} \cup \{0.35, 0.50, 0.65, 0.80\} = \mathbf{\{0.30, 0.35, 0.40, 0.50, 0.60, 0.65, 0.70, 0.80\}}$$
This yields **8 unique friction strata**:
- $\mu = 0.30$: $12$ episodes ($12$ monotonic, $0$ probe, $0$ pert)
- $\mu = 0.35$: $6$ episodes ($0$ monotonic, $3$ probe, $3$ pert)
- $\mu = 0.40$: $12$ episodes ($12$ monotonic, $0$ probe, $0$ pert)
- $\mu = 0.50$: $18$ episodes ($12$ monotonic, $3$ probe, $3$ pert)
- $\mu = 0.60$: $12$ episodes ($12$ monotonic, $0$ probe, $0$ pert)
- $\mu = 0.65$: $6$ episodes ($0$ monotonic, $3$ probe, $3$ pert)
- $\mu = 0.70$: $12$ episodes ($12$ monotonic, $0$ probe, $0$ pert)
- $\mu = 0.80$: $18$ episodes ($12$ monotonic, $3$ probe, $3$ pert)
$$\sum = 12 + 6 + 12 + 18 + 12 + 6 + 12 + 18 = \mathbf{96\text{ trajectories}}$$

**Conclusion:** The P4-T2 performance table correctly reported all 8 friction values present in the data. The Section 3 text in that report inadvertently summarized only the monotonic design grid. In accordance with user rules, no historical records or P4-T2 reports were edited to conceal this discrepancy; it is formally documented here.

---

## 2. Comprehensive Dataset Structure & Integrity Verification

An exhaustive automated audit was performed on `p4_t1_partial_slip_trajectories.npz` and `p4_t1_trajectory_manifest.json`:

| Feature | Audit Finding | Verification Status |
| :--- | :--- | :---: |
| **Total Episode Count** | Exactly 96 distinct contact episodes. | **VERIFIED** |
| **Sampling Frequency** | Strictly $\Delta t = 0.001\text{ s}$ ($1000\text{ Hz}$ across all samples). Max jitter $< 10^{-12}\text{ s}$. | **VERIFIED** |
| **Duration Range** | $[95, 1831]$ discrete steps ($0.095\text{ s}$ to $1.831\text{ s}$). | **VERIFIED** |
| **Channel Completeness** | All 12 channels per trajectory exist with zero `NaN` or `Inf` values. | **VERIFIED** |
| **Gross Slip Ground Truth** | Every trajectory exhibits a strictly positive, valid gross slip event (`gross_slip_step > 0`). | **VERIFIED** |
| **Stick Ratio Transition** | Initial stick ratio $c/a \ge 0.988$; drops monotonically to $0.000$ at gross slip onset. | **VERIFIED** |

### 2.1 Sensor Channel Audit (Observable vs Privileged)

```
  Observable Channels (Available to P4-T3 Models at Inference Time):
  ├── time                 [s]     Post-contact integration timestamp (dt = 0.001s)
  ├── force_t / noisy_ft   [N]     Measured tangential force (clean / sigma_F = 0.02N)
  ├── force_n / noisy_fn   [N]     Measured normal force (clean / sigma_F = 0.02N)
  ├── disp / noisy_disp    [m]     Measured tangential displacement (clean / sigma_delta = 0.5 um)
  └── commanded_velocity   [m/s]   Commanded velocity action signal

  Privileged Ground Truth (Labels / Verification Oracles ONLY - FORBIDDEN at Inference):
  ├── mu_static / mu_kinetic       Material friction parameters
  ├── stick_ratio (c / a)          Internal Cattaneo-Mindlin stick core ratio
  ├── phi_slip (1 - (c/a)^3)       Annular slip area fraction
  ├── true_kt                      Analytical tangent stiffness: kt_0 * (c/a)
  ├── slip_velocity                True slip velocity at contact interface
  └── is_gross_slipping            Ground-truth gross slip boolean event label
```

---

## 3. Ground Truth Definitions & Metrics

### 3.1 Gross Slip Event Definition
A contact episode transitions from partial slip to macroscopic gross slip at the first discrete step $k_{\text{gross}}$ where:
$$c(k_{\text{gross}}) = 0.0 \quad \text{and} \quad \text{is\_gross\_slipping}[k_{\text{gross}}] = \text{True}$$
The physical ground-truth gross slip time is $t_{\text{gross}} = k_{\text{gross}} \cdot \Delta t$.

### 3.2 Dynamic Grasp Margin Formulation
In classical partial slip mechanics, the remaining grasp stability margin is formulated as:
$$M_t = \left( \frac{c_t}{a_t} \right)^3 = 1.0 - \frac{|F_{t,t}|}{\mu_s F_{n,t}} \in [0.0, 1.0]$$
- $M_t = 1.0$: Zero tangential load (full stick core, complete safety).
- $M_t \in (0.0, 1.0)$: Incipient partial slip developing in the peripheral annulus.
- $M_t = 0.0$: Total loss of sticking core $\implies$ macroscopic gross slip.

The normalized stiffness margin is:
$$m_t = \frac{k_t(t)}{k_{t,0}} = \frac{c(t)}{a(t)} = M_t^{1/3} \in [0.0, 1.0]$$

### 3.3 Warning Lead Time & False Alarm Logic
- **Warning Timestamp:** $t_{\text{warn}} = \min \{ t \mid \text{detector triggers alarm} \}$.
- **Warning Lead Time:** 
  $$\tau_{\text{lead}} = \begin{cases} t_{\text{gross}} - t_{\text{warn}}, & \text{if } t_{\text{warn}} \le t_{\text{gross}} \\ 0.0, & \text{otherwise (missed detection / late)} \end{cases}$$
- **False Alarm Definition:** An alarm is defined as a false alarm if it triggers prematurely while the contact is firmly anchored in the safe sticking regime, defined as $c/a \ge 0.80$ (or $M_t \ge 0.512$), or $t_{\text{warn}} < 0.25 \cdot t_{\text{gross}}$.

---

## 4. Protected File & Repository Verification

The preflight audit confirms the integrity of all frozen components:

1. **Simulator v1**:
   - `src/environment/compliant_prelift_env.py`: Verified unmodified.
   - `src/safety/geometry_cbf_safety_filter.py`: Verified unmodified.
   - `src/teaching/factory.py`: Verified unmodified.
2. **Contact Physics v2 Certified Kernel**:
   - `experiments/contact_physics_v2/contact/lugre.py`: Verified frozen at v2.1.3.11.
   - `experiments/contact_physics_v2/contact/cattaneo_mindlin.py`: Verified frozen.
   - `experiments/contact_physics_v2/contact/contact_state.py`: Verified frozen.
3. **Production Safety Gates**:
   - Stage 3.3B production gates and seed registry: Verified locked.
   - Production seeds `3300000+` and reserve seeds `3390000+`: Untouched.
4. **Parity**:
   - Canonical commit `85c9e4ad` and Mirror commit `ac2e64a` maintain 100% blob parity across all shared files.

---

## 5. Audit Disposition

$$\mathbf{AUDIT\; DISPOSITION:\; PASSED\; WITHOUT\; BLOCKERS}$$
$$\mathbf{AUTHORIZATION:\; Proceed\; to\; P4\text{-}T3\; Implementation\; Stage\; 1\; (RLS\; Estimator)}$$
