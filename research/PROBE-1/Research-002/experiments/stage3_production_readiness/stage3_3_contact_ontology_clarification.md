# HOROS PROBE-1 — Research-002
## Stage 3.3 Contact Mode Ontology & Jamming Reconciliation

**Program:** HOROS PROBE-1 — Autonomous Robotic Manipulation World Model  
**Project:** Research-002: Model Teaching Infrastructure & World Model Pre-training  
**Document:** Contact Mode Ontology & Mechanical Lock Clarification  
**Document Identifier:** `HOROS-P1-R002-STAGE3.3-CONTACT-ONTOLOGY-CLARIFICATION`  
**Date:** 2026-11-18  
**Status:** **APPROVED CLARIFICATION**  

---

### 1. Architectural Scope & Purpose

This document provides the definitive reconciliation between:
1. The **Frozen Stage 3.0 Discrete Contact Mode Ontology** (`ContactMode` in `src/contact_modes/contact_mode_definitions.py`).
2. The **Simulator Contact Strata** in `src/environment/peg_in_hole_env.py`.
3. The physical mechanics of two-point wedging versus force-balance mechanical locking (jamming) during automated peg-in-hole assembly.

---

### 2. Frozen Stage 3.0 Ontology Preservation

The seven-class discrete contact manifold enum `ContactMode` defined in Stage 3.0 remains **100% frozen and unmodified**:

```python
class ContactMode(IntEnum):
    FREE = 0            # No rigid contact (Fn = 0)
    FIRST_CONTACT = 1   # Touchdown / initial contact onset (0 < Fn <= F_detect)
    STICKING = 2        # Static contact equilibrium inside Coulomb friction cone
    SLIDING = 3         # Tangential slip on surface at Coulomb boundary
    IMPACT = 4          # Dynamic collision impact shock / rapid force jump
    JAMMING = 5         # Two-point geometric wedging / mechanical lock
    RELEASE = 6         # Detachment / separation breaking contact
```

**Invariant:** Under no circumstances shall this enum definition or its integer mappings be altered.

---

### 3. Decoupling: Classifier Modes vs. Simulator Strata

A fundamental distinction must be maintained between classifier outputs and simulator telemetry:

| Domain | Source | Values / Identifiers | Physical Meaning |
| :--- | :--- | :--- | :--- |
| **Simulator Contact Stratum** | `PegInHoleEnv.contact_stratum` | `0: FREE`<br>`1: RIM_IMPACT`<br>`2: CHAMFER_SLIDE`<br>`3: TWO_POINT_WEDGING`<br>`4: SEATED` | Ground-truth boundary geometry evaluated inside the physics engine. |
| **Classifier Contact Mode** | `classify_contact_mode()` | `0: FREE`<br>`1: FIRST_CONTACT`<br>`2: STICKING`<br>`3: SLIDING`<br>`4: IMPACT`<br>`5: JAMMING`<br>`6: RELEASE` | Sensory manifold classified from observable physical signals ($F_n, F_t, \theta, \dot{\mathbf{x}}$). |

**Prohibition on Direct Index Equating:**
- Simulator Stratum 3 is `TWO_POINT_WEDGING`.
- Classifier Mode 3 is `ContactMode.SLIDING`.
- These indices share no semantic equivalence. Stratum 3 must never be mapped to Mode 3.

---

### 4. Mechanics of Wedging and Jamming

Following the classical manipulation mechanics established by Whitney (1982) and Caine (1989):

1. **Geometric Wedging (Simulator Stratum 3):**
   - Occurs when opposite ends of the peg contact opposite walls of the hole fixture simultaneously at a tilt angle exceeding the critical geometric clearance angle:
     $$\theta \ge \theta_c = \arctan\left(\frac{2 c}{L_p}\right)$$
     where $c$ is radial clearance $c = R_{\text{hole}} - R_{\text{peg}}$ and $L_p$ is insertion depth / contact length (Whitney 1982).
   - Wedging is a **geometric kinematic state**. Once wedging occurs, the normal vectors at the two contact points oppose each other.
   - Depending on applied forces, a wedged peg can experience:
     - Quasi-static compliant sliding down the walls (`ContactMode.SLIDING` 3).
     - Static friction equilibrium (`ContactMode.STICKING` 2).
     - Mechanical lock under high lateral force (`ContactMode.JAMMING` 5).

2. **Mechanical Jamming (Classifier Mode 5):**
   - Occurs when applied forces and moments fall outside the insertion compliance cone, causing the contact forces to lock against the friction cones:
     $$F_t > 15.0\text{ N} \quad \text{and} \quad \theta > 1.8^\circ$$
   - In PROBE-1 Stage 3.0, `classify_contact_mode()` explicitly designates this condition as `ContactMode.JAMMING = 5`.

---

### 5. Production Acceptance Rules for Wedging & Jamming

The Stage 3.3A.1 blanket prohibition (`5 not in modes`) is formally rescinded and replaced with physical validity criteria:

#### 5.1 Valid `JAMMING` Label During Wedging
A `ContactMode.JAMMING` (5) classification is **scientifically valid and accepted** if and only if all of the following hold at the same timestep $t$:
1. Simulator Contact Stratum is active wedging: $\text{step\_contact\_stratum}[t] = 3$.
2. State-depth alignment is verified: telemetry insertion depth $z_{\text{telem}}[t] > 5.0\text{ mm}$, model-visible post-action state depth $z_{\text{state}}[t] = \max(0.0, -next\_states[t, 2]) > 5.0\text{ mm}$, and $|z_{\text{telem}}[t] - z_{\text{state}}[t]| < 10^{-3}\text{ mm}$.
3. Lateral contact force indicates a genuine mechanical lock: $\|\mathbf{F}_t(t)\| > 15.0\text{ N}$.
4. Instantaneous physical state tilt exceeds the geometric lock gate: $\theta_{\text{state}}(t) = \|\mathbf{rot}_{xy}(t)\| > 1.8^\circ$ derived directly from state vector ($D \in \{12, 15\}$).

#### 5.2 Invalid / Spurious `JAMMING` Label (Causes Immediate Rejection)
A scenario is **REJECTED** if `ContactMode.JAMMING` (5) is emitted under any of the following invalid conditions:
1. **Free-Space Jamming:** Mode 5 emitted when $F_n < 0.01\text{ N}$ or $z_{\text{depth}} \le 0.0\text{ mm}$.
2. **Chamfer / Sliding Jamming:** Mode 5 emitted during stratum 2 (`CHAMFER_SLIDE`) or when lateral force is low ($\|\mathbf{F}_t\| \le 15.0\text{ N}$).
3. **Low-Tilt Jamming:** Mode 5 emitted when instantaneous state tilt $\theta_{\text{state}} \le 1.8^\circ$.
4. **Misaligned Depth Jamming:** Mode 5 emitted when telemetry depth and model-visible state depth diverge ($|z_{\text{telem}}[t] - z_{\text{state}}[t]| \ge 10^{-3}\text{ mm}$) or model-visible state depth is shallow ($z_{\text{state}}[t] \le 5.0\text{ mm}$).
5. **Non-Wedging Jamming:** Mode 5 emitted in nominal or impact strata, where simulator stratum 3 wedging is not active. (Validated universally across all strata).

#### 5.3 Valid Wedging Without Jamming
Wedging scenarios where compliant downward insertion proceeds without exceeding $15.0\text{ N}$ lateral force will exhibit valid `ContactMode.STICKING` (2) and `ContactMode.SLIDING` (3). These episodes are **fully valid and accepted** provided the state/telemetry depth alignment ($z_{\text{telem}} = z_{\text{state}} > 5.0\text{ mm}$) at stratum 3 is verified.
