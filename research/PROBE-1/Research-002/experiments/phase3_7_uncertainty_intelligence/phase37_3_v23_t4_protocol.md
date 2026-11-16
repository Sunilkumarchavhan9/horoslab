# HOROS PROBE-1 — Research-002
## Phase 3.7.3 v2.3 Protocol: Genuine T4 Friction-Change Detection

**Protocol ID:** `HOROS-P1-R002-P373-T4-v2.3`  
**Status:** FROZEN BEFORE THE SCORED RUN  
**Manifest:** `phase37_3_trust_manifest_v2.0` (unchanged)  
**Frozen artifacts:** B1–B4, GeometryAwareCBFSafetyFilter v1.0, historical Phase 3.4 and Phase 3.7.2 datasets  

This protocol is the evaluation definition for Gate T4. Thresholds are the Manifest v2.0 `TrustPolicyConfig` values already used by Gates T1–T3, including `tau_cusum_prelift = 2.50` and `tau_feat` equal to the in-distribution calibration 95th percentile. No threshold is fit on the T4 episodes.

### Question

After the policy has established contact, identified mass from observable force, and entered `TRUST`, how many control steps elapse before the first `ABSTAIN` once Regime A applies the registered friction step `0.60 → 0.24` at step 15?

A latency of zero is a detection on the first observation generated under the new friction. It is not a detection if `ABSTAIN` was already the decision at step 14.

### Episodes

| Set | Seeds | Regime | Friction |
| :--- | :--- | :--- | :--- |
| Transition | 6117, 6118, 6119, 6120 | A | 0.60 until step 15, then 0.24 |
| Control | 6117, 6118, 6119, 6120 | nominal | 0.60 for the whole episode |

Mass is the registered Regime A mass, `0.350 kg`. Episode length is 40 steps at `dt = 0.01 s`. The length is the recording window. A miss remains a miss; latency is not replaced by `40 - 15` and is not clipped at 3 steps.

### Maneuver (pre-registered from environment constants)

Documented geometry: fingertips start at radius `36.5 mm`, object radius `35.0 mm`, normal stiffness `4.0 N/mm`, pad stiffness `1500 N/m` per finger.

1. **Step 1, contact and load.** Squeeze `2.0 mm` per finger (the existing action clip) and lift by

   `dz_mm = (0.350 * 9.80665) / (4 * 1500) * 1000 + 0.05`.

   The first term is the pad stretch at which shear reaches the registered weight. The added `0.05 mm` is one frozen probe quantum (`arm_dz_per_step_mm`). This maneuver is scenario setup. It is not an input feature, and `mu_true` is not passed to the policy.

2. **Steps 2–40.** The action is the action returned by `TrustAwareWorldModel.evaluate_decision`. The nominal setpoint forwarded in `TRUST` is the frozen probe velocity, `0.05 mm/step`. `PROBE` and `ABSTAIN` actions remain the policy's own actions.

Mass identification uses `ActiveMicroLiftEstimator` on measured `Fz` only.

### Decision record

After each environment step, one decision is recorded at that step index. The decision inputs are the post-step observation:

- `finger_fn`, `finger_ft`, and `delta_dot_t` are the simulator measurements. `delta_dot_t` is never overwritten.
- Feature vector matches the existing 7-D contract: `state[4:8]` and `[sum(Fn), sum(Ft_theta), sum(Ft_z)]`.
- One-step innovation is the frozen B3 residual of the action just applied, normalized with the calibration C2 reference, and passed as `recent_residuals`.
- Contact mode is the frozen B3 mode head. No mode is injected to force a conformal breach.

### Metrics

- **Pre-transition state:** decision at step 14.
- **Detection:** first step `k >= 15` whose decision is `ABSTAIN`. Latency is `k - 15` steps and `(k - 15) * 10 ms`.
- **False abstentions:** `ABSTAIN` decisions with step `< 15` on transition episodes.
- **Missed detections:** transition episodes with no `ABSTAIN` at any step `>= 15`.
- **Controls:** the same counts, with no friction step.

### Acceptance

| Metric | Requirement |
| :--- | :--- |
| Pre-transition state | `TRUST` at step 14 on every transition episode |
| Mean detection latency | `<= 3` steps, over detected episodes, with zero misses |
| Mean latency in time | `<= 30 ms` |
| Synthetic slip injection | None |
| Artificial fallback | None |
| Latency capping | None |
| False abstentions | Explicitly measured |

Student-model training stays disabled.
