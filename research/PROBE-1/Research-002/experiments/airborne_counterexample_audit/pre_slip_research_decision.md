# HOROS PROBE-1 — Pre-Slip Research Decision & Recommendation

**Document Identifier:** `HOROS-P1-R002-PRE-SLIP-RESEARCH-DECISION`  
**Date:** 2026-11-20  
**Phase:** Stage 3.3 Research Qualification / Counterexample Audit  
**Author:** HOROS Physical Intelligence Research Group  
**Disposition:** **CONDITIONAL — INVESTIGATION REQUIRED BEFORE COMMITMENT**  

---

### 1. Executive Decision Summary

Based on independent inspection of the simulation source code, mathematical derivation of the airborne equilibrium clamp, and CodeRabbit counterexample review, HOROS adopts a **CONDITIONAL** research disposition:

1. **Previous Categorical NO-GO is Rescinded:** The prior assertion that "no observation in the simulator can depend on friction before slip occurs" was overly broad, as it examined only the ground-supported pre-lift phase ($z_{\text{obj}} = 0$).
2. **Current Feasibility Status is CONDITIONAL:** Observability of $\mu$ without recorded slip exists in the airborne hold branch ([`compliant_prelift_env.py:503`](file:///c:/projects/MemoryOS/research/PROBE-1/Research-002/src/environment/compliant_prelift_env.py#L503)). However, this signal is a numerical clamping artifact of an unphysical kinematic hold in the $0.98$ weight deadband, and it exists only *after* the object is already airborne.
3. **Pre-Lift Table Ground Forecasting Remains REFUTED:** While resting on the table, sticking contact is strictly governed by $F_t = k_{\text{pad}} \Delta z$, which is mathematically independent of $\mu$. Probing on the table cannot predict post-lift slip without intentionally crossing the Coulomb cone on the table.

---

### 2. Decision Tree & Progression Criteria

```
                              [Airborne Investigation]
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
            [Signal Useful]                           [Signal Degraded]
         (SNR > 3, Decoupled)                      (Artifact / Confounded)
                    │                                         │
                    ▼                                         ▼
         [CONDITIONAL PASS]                              [FINAL NO-GO]
   Authorize isolated micro-pilot               Halt current WM line; upgrade
    on matched factorial split                 contact law to Cattaneo-Mindlin
```

#### Qualification Gates:
- **Gate 1 (Artifact Adjudication):** Determine whether downstream world models exploit the unphysical $0.98$ deadband clamp as an unintended shortcut.
- **Gate 2 (Factorial Decoupling):** Demonstrate that an action-conditioned model distinguishes pure friction drops from pure mass increases in the $4 \times 4$ matched grid with $R^2 \ge 0.60$.
- **Gate 3 (Noise Robustness):** Confirm that the signal persists above AR(1) thermal noise ($\text{SNR} \ge 3.0$).

---

### 3. Immediate Prohibitions (Governance Constraints)

To preserve scientific integrity and prevent wasted compute:
- **NO HCTT Implementation:** Do not build or train Hierarchical Contact-Transformer models until the physical signal is proven sound.
- **NO Production Dataset Generation:** Stage 3.3B (1,000 production episodes) remains **LOCKED**. The current dataset manifest does not contain the matched factorial splits required to validate this hypothesis.
- **NO Reserve Seed Consumption:** All 300 reserve seeds (`3,390,000` series) remain `UNALLOCATED_LOCKED`.
- **NO Simulator Replacement:** Do not migrate to Antioch, Isaac Gym, or external engines until the internal simulator dynamics are fully cataloged and understood.

---

### 4. Summary of Research Recommendation

Proceed with an **isolated, small-scale diagnostic study** using dedicated research seeds (strictly outside the production registry) to evaluate the $4 \times 4$ matched factorial grid in `CompliantPreLiftContactEnv`. If the airborne signal cannot be separated from mass or is drowned out by AR(1) sensor noise, formally declare **NO-GO** and reformulate the manipulation research agenda.
