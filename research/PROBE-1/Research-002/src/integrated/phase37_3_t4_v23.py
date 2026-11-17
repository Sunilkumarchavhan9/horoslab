"""
HOROS PROBE-1 — Research-002: Phase 3.7.3 v2.3 Gate T4.

Closed-loop friction-step detection under the frozen protocol
HOROS-P1-R002-P373-T4-v2.3. Uses TrustAwareWorldModel and the registered
Regime A transition. Does not fit thresholds on the scored episodes and does
not update world-model parameters.
"""

from __future__ import annotations

import hashlib
import os
from typing import Any, Dict, List, Optional

import numpy as np

from src.environment.compliant_prelift_env import CompliantPreLiftContactEnv
from src.integrated.phase37_2_experiments import (
    _compute_mode_norm_innov,
    _forward_b3_detailed,
    _predict_modes_nonprivileged,
)
from src.integrated.phase37_3_trust_policy import TriState, TrustAwareWorldModel, TrustPolicyConfig


PROTOCOL_ID = "HOROS-P1-R002-P373-T4-v2.3"
TRANSITION_STEP = 15
EPISODE_HORIZON = 40
DT_S = 0.01
REGISTERED_MASS_KG = 0.350
GRAVITY_MPS2 = 9.80665
K_PAD_PER_FINGER_NPM = 1500.0
N_FINGERS = 4
SQUEEZE_MM = 2.0
TRANSITION_SEEDS = (6117, 6118, 6119, 6120)
CONTROL_SEEDS = (6117, 6118, 6119, 6120)


def identification_lift_mm(mass_kg: float = REGISTERED_MASS_KG, probe_quantum_mm: float = 0.05) -> float:
    """Pad stretch that reaches registered weight, plus one frozen probe quantum."""
    weight_n = float(mass_kg) * GRAVITY_MPS2
    k_total = N_FINGERS * K_PAD_PER_FINGER_NPM
    return float((weight_n / k_total) * 1000.0 + probe_quantum_mm)


def _json_float(value: Optional[float], ndigits: int = 6) -> Optional[float]:
    if value is None:
        return None
    return round(float(value), ndigits)


def _state_vector(obs: Dict[str, Any]) -> np.ndarray:
    slip = np.abs(np.asarray(obs["delta_dot_t"], dtype=np.float32))
    return np.concatenate(
        [
            np.asarray(obs["finger_pos"], dtype=np.float32).reshape(-1),
            np.asarray(obs["finger_fn"], dtype=np.float32).reshape(-1),
            slip.reshape(-1),
            np.asarray(obs["obj_pos"], dtype=np.float32).reshape(-1),
        ]
    ).astype(np.float32)


def _policy_observation(obs: Dict[str, Any], state_vec: np.ndarray) -> Dict[str, Any]:
    """Observable channels only. mu_true and object_mass are not copied in."""
    fn = np.asarray(obs["finger_fn"], dtype=np.float32)
    ft = np.asarray(obs["finger_ft"], dtype=np.float32)
    wrenches = np.array(
        [float(np.sum(fn)), float(np.sum(ft[:, 0])), float(np.sum(ft[:, 1]))],
        dtype=np.float32,
    )
    return {
        "finger_pos": state_vec[4:8].astype(np.float32),
        "finger_fn": fn,
        "finger_ft": ft,
        "wrenches": wrenches,
        "delta_dot_t": np.asarray(obs["delta_dot_t"], dtype=np.float32).copy(),
    }


def _protocol_sha256(r002_root: Optional[str]) -> Optional[str]:
    if not r002_root:
        return None
    path = os.path.join(
        r002_root,
        "experiments",
        "phase3_7_uncertainty_intelligence",
        "phase37_3_v23_t4_protocol.md",
    )
    if not os.path.isfile(path):
        return None
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        digest.update(handle.read())
    return digest.hexdigest()


def _run_episode(
    *,
    seed: int,
    regime: str,
    world_model: Any,
    mode_conformal_bounds: Dict[int, float],
    feature_reference: Dict[str, Any],
    c2_reference: Dict[str, Any],
    config: TrustPolicyConfig,
    nominal_action: np.ndarray,
    identification_action: np.ndarray,
) -> Dict[str, Any]:
    env = CompliantPreLiftContactEnv(
        mu_true=0.60,
        object_mass=REGISTERED_MASS_KG,
        dt=DT_S,
        seed=int(seed),
        regime=regime,
        regime_a_initial_mu=0.60,
        regime_a_changed_mu=0.24,
        regime_a_transition_step=TRANSITION_STEP,
    )
    obs = env.reset()
    model = TrustAwareWorldModel(
        base_world_model=world_model,
        mode_conformal_bounds=mode_conformal_bounds,
        feature_reference=feature_reference,
        c2_reference=c2_reference,
        config=config,
        task="compliant_prelift",
    )
    model.reset_episode()

    pending_action = identification_action.astype(np.float32).copy()
    prev_state: Optional[np.ndarray] = None
    prev_action: Optional[np.ndarray] = None
    decisions: List[Dict[str, Any]] = []

    for _ in range(EPISODE_HORIZON):
        prev_state = _state_vector(obs)
        prev_action = pending_action.copy()
        obs, _done = env.step(pending_action)
        step = int(env.step_count)
        state_vec = _state_vector(obs)
        residuals = None
        pred_mode = 0
        if prev_state is not None and prev_action is not None:
            detail = _forward_b3_detailed(world_model, prev_state[None, :], prev_action[None, :])
            pred_modes, _logits = _predict_modes_nonprivileged(world_model, detail["x_norm"])
            pred_mode = int(pred_modes[0])
            innovation = _compute_mode_norm_innov(
                detail["mu_phys"] - state_vec[None, :],
                pred_modes,
                c2_reference["focus_dims"],
                c2_reference["mode_mu"],
                c2_reference["mode_sd"],
            )
            residuals = [float(innovation[0])]

        decision = model.evaluate_decision(
            _policy_observation(obs, state_vec),
            nominal_action,
            pred_contact_mode=pred_mode,
            recent_residuals=residuals,
        )
        fn_total = float(np.sum(obs["finger_fn"]))
        fz_total = float(np.sum(np.asarray(obs["finger_ft"])[:, 1]))
        slip_max = float(np.max(obs["delta_dot_t"]))
        decisions.append(
            {
                "step": step,
                "sim_time_s": _json_float(env.sim_time_s, 4),
                "state": decision.state.value,
                "reason": decision.reason,
                "contact_established": bool(fn_total >= config.fn_contact_threshold_n),
                "mass_identified": bool(model.latent_mass_identified),
                "estimated_mass_kg": _json_float(model.estimated_mass, 6),
                "total_fn_n": _json_float(fn_total, 4),
                "total_fz_n": _json_float(fz_total, 4),
                "max_slip_mps": _json_float(slip_max, 6),
                "cusum_statistic": _json_float(decision.cusum_statistic, 4),
                "feature_distance": _json_float(decision.feature_distance, 4),
                "predicted_mode": int(pred_mode),
            }
        )
        pending_action = np.asarray(decision.action, dtype=np.float32).copy()

    by_step = {row["step"]: row for row in decisions}
    pre = by_step.get(TRANSITION_STEP - 1)
    false_rows = [row for row in decisions if row["step"] < TRANSITION_STEP and row["state"] == TriState.ABSTAIN.value]
    post_rows = [row for row in decisions if row["step"] >= TRANSITION_STEP]
    detection = next((row for row in post_rows if row["state"] == TriState.ABSTAIN.value), None)
    events = env.get_environment_state().get("regime_events", [])
    transition_event = next((event for event in events if event.get("event") == "regime_a_friction_step"), None)

    latency_steps = None if detection is None else int(detection["step"] - TRANSITION_STEP)
    return {
        "seed": int(seed),
        "regime": regime,
        "friction_transition_applied": transition_event is not None,
        "transition_step": int(transition_event["step"]) if transition_event else None,
        "transition_time_s": _json_float(transition_event["sim_time_s"], 4) if transition_event else None,
        "transition_from_mu": _json_float(transition_event["from_mu"], 4) if transition_event else None,
        "transition_to_mu": _json_float(transition_event["to_mu"], 4) if transition_event else None,
        "step14_state": None if pre is None else pre["state"],
        "step14_reason": None if pre is None else pre["reason"],
        "step14_mass_identified": False if pre is None else bool(pre["mass_identified"]),
        "step14_contact_established": False if pre is None else bool(pre["contact_established"]),
        "step14_estimated_mass_kg": None if pre is None else pre["estimated_mass_kg"],
        "false_abstentions_before_transition": len(false_rows),
        "false_abstention_steps": [int(row["step"]) for row in false_rows],
        "false_abstention_reasons": [row["reason"] for row in false_rows],
        "detection_step": None if detection is None else int(detection["step"]),
        "detection_reason": None if detection is None else detection["reason"],
        "detection_slip_mps": None if detection is None else detection["max_slip_mps"],
        "detection_fz_n": None if detection is None else detection["total_fz_n"],
        "latency_steps": latency_steps,
        "latency_ms": None if latency_steps is None else _json_float(latency_steps * DT_S * 1000.0, 2),
        "missed_detection": bool(regime == "A" and detection is None),
        "post_transition_abstentions": sum(1 for row in post_rows if row["state"] == TriState.ABSTAIN.value),
        "decisions": decisions,
    }


def run_t4_v23_experiment(
    *,
    world_model: Any,
    mode_conformal_bounds: Dict[int, float],
    feature_reference: Dict[str, Any],
    c2_reference: Dict[str, Any],
    config: TrustPolicyConfig,
    r002_root: Optional[str] = None,
) -> Dict[str, Any]:
    """Runs the frozen v2.3 transition and control episodes and adjudicates Gate T4."""
    probe_quantum_mm = float(config.arm_dz_per_step_mm)
    lift_mm = identification_lift_mm(REGISTERED_MASS_KG, probe_quantum_mm)
    identification_action = np.array([SQUEEZE_MM, SQUEEZE_MM, SQUEEZE_MM, SQUEEZE_MM, lift_mm], dtype=np.float32)
    nominal_action = np.array([0.0, 0.0, 0.0, 0.0, probe_quantum_mm], dtype=np.float32)

    common = dict(
        world_model=world_model,
        mode_conformal_bounds=mode_conformal_bounds,
        feature_reference=feature_reference,
        c2_reference=c2_reference,
        config=config,
        nominal_action=nominal_action,
        identification_action=identification_action,
    )
    transition = [_run_episode(seed=seed, regime="A", **common) for seed in TRANSITION_SEEDS]
    controls = [_run_episode(seed=seed, regime="nominal", **common) for seed in CONTROL_SEEDS]

    pre_trust = all(ep["step14_state"] == TriState.TRUST.value for ep in transition)
    pre_mass = all(ep["step14_mass_identified"] and ep["step14_contact_established"] for ep in transition)
    missed = int(sum(1 for ep in transition if ep["missed_detection"]))
    latencies = [int(ep["latency_steps"]) for ep in transition if ep["latency_steps"] is not None]
    mean_steps = float(np.mean(latencies)) if latencies and missed == 0 and len(latencies) == len(transition) else None
    mean_ms = None if mean_steps is None else float(mean_steps * DT_S * 1000.0)
    false_abstentions = int(sum(ep["false_abstentions_before_transition"] for ep in transition))
    control_false = int(sum(ep["false_abstentions_before_transition"] for ep in controls))
    control_post = int(sum(ep["post_transition_abstentions"] for ep in controls))

    latency_ok = mean_steps is not None and mean_steps <= 3.0 and mean_ms is not None and mean_ms <= 30.0
    passed = bool(pre_trust and pre_mass and missed == 0 and latency_ok)

    def _public_episode(ep: Dict[str, Any]) -> Dict[str, Any]:
        published = dict(ep)
        published["pre_transition_decision"] = {
            "step": TRANSITION_STEP - 1,
            "state": ep["step14_state"],
            "reason": ep["step14_reason"],
            "mass_identified": ep["step14_mass_identified"],
            "contact_established": ep["step14_contact_established"],
            "estimated_mass_kg": ep["step14_estimated_mass_kg"],
        }
        published["post_transition_decision"] = {
            "step": ep["detection_step"],
            "state": None if ep["detection_step"] is None else TriState.ABSTAIN.value,
            "reason": ep["detection_reason"],
        }
        return published

    return {
        "protocol_id": PROTOCOL_ID,
        "protocol_sha256": _protocol_sha256(r002_root),
        "status": "PASS" if passed else "FAIL",
        "mean_latency_contact_steps": None if mean_steps is None else round(mean_steps, 2),
        "mean_latency_contact_ms": None if mean_ms is None else round(mean_ms, 2),
        "latencies_contact_engaged": latencies,
        "pre_transition_state_required": "TRUST",
        "pre_transition_all_trust_at_step_14": pre_trust,
        "pre_transition_contact_and_mass_identified": pre_mass,
        "false_abstentions_before_transition": false_abstentions,
        "missed_detections": missed,
        "synthetic_slip_injection": False,
        "artificial_fallback_removed": True,
        "uncapped_evaluation": True,
        "latency_capping": False,
        "threshold_steps": 3.0,
        "threshold_ms": 30.0,
        "identification_lift_mm": round(lift_mm, 4),
        "nominal_lift_mm_per_step": probe_quantum_mm,
        "episode_horizon_steps": EPISODE_HORIZON,
        "control_false_abstentions_before_step_15": control_false,
        "control_abstentions_after_step_14": control_post,
        "transition_episodes": [_public_episode(ep) for ep in transition],
        "control_episodes": [_public_episode(ep) for ep in controls],
        "description": (
            "Closed-loop Regime A detection latency from the step-15 friction transition "
            "after an observed TRUST decision at step 14. No synthetic slip, no fallback, no latency cap."
        ),
    }
