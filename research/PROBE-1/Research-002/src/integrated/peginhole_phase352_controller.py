"""Phase 3.5.2 Geometry-Aware Two-Phase Peg-in-Hole Controller, Stall Ablation, and Pilot Runner.

Implements:
- 3.5.2-C: Explicit two-phase state machine (PRE_ENTRY_ALIGN -> INSERTION_CONSTRAINED -> SEATED_TERMINAL / ALIGNMENT_FAILED)
- 3.5.2-B: Dual clearance modes (Mode A metrology LCB vs Mode B validated-domain 0.18 mm fallback) with zero oracle leakage
- 3.5.2-D: Single-factor free-space stall isolation for M0 B2/B3 vs M4 B1/B3 (frozen weights)
- 3.5.2-F: Frozen <=30-episode instrumented pilot (seeds 7500-7529, 6 configs x 5 conditions) with live
  GeometryAwareCBFSafetyFilter and read-only shadow PredictiveCBFSafetyFilter.
"""

from __future__ import annotations

from enum import Enum
import hashlib
import json
import os
import time
from typing import Any, Dict, List, Optional, Sequence, Tuple

import numpy as np
import torch

from src.environment import step_env_compatible
from src.environment.peg_in_hole_env import PegInHoleEnv
from src.integrated.calibration_runner import PHASE3_SEED_POOLS, verify_disjoint_seed_pools
from src.integrated.phase34_pipeline import _sha256_file, get_runtime_reproducibility_metadata
from src.integrated.phase35_closure_addendum import verify_archived_phase35_immutability
from src.integrated.phase35_evaluator import PEG_OOD_CORNERS, verify_phase34_artifacts_and_load
from src.integrated.planner_evaluator import PlannerEvaluator, compute_peg_in_hole_planner_reward
from src.integrated.safety_evaluator import SafetyEvaluator
from src.integrated.statistical_analysis import to_json_serializable
from src.planners.cem_planner import CEMPlanner
from src.planners.uncertainty_penalized_cem import UncertaintyPenalizedCEM
from src.safety.geometry_cbf_safety_filter import (
    ClearanceMode,
    ClearanceSpecification,
    GeometryAwareCBFSafetyFilter,
    VALIDATED_OOD_MIN_CLEARANCE_MM,
    extract_controller_visible_pih_obs,
)
from src.selection_aware.counterfactual_rollout import extract_env_state_and_wrench

PILOT_SEEDS: Tuple[int, ...] = tuple(range(7500, 7530))

# 5 physical conditions: ID (0.50, 0.50) + all 4 validated OOD corners
PHYSICAL_CONDITIONS: Tuple[Tuple[str, float, float], ...] = (
    ("ID", 0.50, 0.50),
    ("OOD_mu075_clr018", 0.75, 0.18),
    ("OOD_mu075_clr025", 0.75, 0.25),
    ("OOD_mu085_clr018", 0.85, 0.18),
    ("OOD_mu085_clr025", 0.85, 0.25),
)

# 6 controller/clearance configurations -> 6 x 5 = 30 episodes total
PILOT_CONTROLLER_CONFIGS: Tuple[Tuple[str, str, ClearanceMode], ...] = (
    ("M4_acmm", "B3", ClearanceMode.ESTIMATED_CLEARANCE),
    ("M4_acmm", "B3", ClearanceMode.UNKNOWN_CLEARANCE),
    ("M4_acmm", "B1", ClearanceMode.ESTIMATED_CLEARANCE),
    ("M4_acmm", "B1", ClearanceMode.UNKNOWN_CLEARANCE),
    ("M0_passive", "B3", ClearanceMode.ESTIMATED_CLEARANCE),
    ("M0_passive", "B3", ClearanceMode.UNKNOWN_CLEARANCE),
)

BASELINE_INIT_STD: Tuple[float, ...] = (0.5, 0.5, 1.5, 0.3, 0.3, 0.1)


class InsertionPhase(str, Enum):
    PRE_ENTRY_ALIGN = "PRE_ENTRY_ALIGN"
    INSERTION_CONSTRAINED = "INSERTION_CONSTRAINED"
    SEATED_TERMINAL = "SEATED_TERMINAL"
    ALIGNMENT_FAILED = "ALIGNMENT_FAILED"


def build_metrology_clearance_spec(
    mode: ClearanceMode,
    nominal_clearance_mm: float,
    seed: int,
    sigma_c_mm: float = 0.025,
    k_sigma: float = 2.0,
) -> ClearanceSpecification:
    """Create a controller-visible ClearanceSpecification without exposing env oracle fields.

    For Mode A (ESTIMATED_CLEARANCE), simulates an independent pre-task gage/metrology
    measurement centered at the bench fixture's batch nominal specification + bounded
    measurement noise, yielding a conservative LCB ``c_hat - k_sigma * sigma_c``.
    For Mode B (UNKNOWN_CLEARANCE), uses no fixture-specific estimate at all.
    """
    if mode == ClearanceMode.ESTIMATED_CLEARANCE:
        rng = np.random.RandomState(91000 + int(seed))
        # Bounded conservative metrology noise in [-0.5*sigma, +0.5*sigma]
        bias = float(rng.uniform(-0.5 * sigma_c_mm, 0.5 * sigma_c_mm))
        return ClearanceSpecification(
            mode=ClearanceMode.ESTIMATED_CLEARANCE,
            c_hat_mm=round(float(nominal_clearance_mm + bias), 6),
            sigma_c_mm=float(sigma_c_mm),
            k_sigma=float(k_sigma),
        )
    return ClearanceSpecification(
        mode=ClearanceMode.UNKNOWN_CLEARANCE,
        c_robust_mm=VALIDATED_OOD_MIN_CLEARANCE_MM,
        allow_below_validated_domain=False,
        min_possible_clearance_mm=VALIDATED_OOD_MIN_CLEARANCE_MM,
    )


class TwoPhasePegInHoleController:
    """Explicit two-phase controller pairing CEM planning with GeometryAwareCBFSafetyFilter."""

    def __init__(
        self,
        hybrid_wm: Any,
        planner: Any,
        safety_filter: GeometryAwareCBFSafetyFilter,
        clearance_spec: ClearanceSpecification,
        max_align_steps: int = 15,
        hover_z_mm: float = 1.5,
        reward_fn=compute_peg_in_hole_planner_reward,
        use_warm_start: bool = False,
    ):
        self.hybrid_wm = hybrid_wm
        self.planner = planner
        self.safety_filter = safety_filter
        self.clearance_spec = clearance_spec
        self.max_align_steps = int(max_align_steps)
        self.hover_z_mm = float(hover_z_mm)
        self.reward_fn = reward_fn
        self.use_warm_start = bool(use_warm_start)
        self.reset()

    def reset(self) -> None:
        self.phase = InsertionPhase.PRE_ENTRY_ALIGN
        self.align_steps = 0
        self.alignment_failure_reason: Optional[str] = None
        self.warm_mean: Optional[np.ndarray] = None
        self.safety_filter.reset_episode_state()

    def select_action(self, raw_obs: Dict[str, Any]) -> Tuple[np.ndarray, Dict[str, Any]]:
        visible_obs = extract_controller_visible_pih_obs(raw_obs)
        s_curr, _ = extract_env_state_and_wrench(visible_obs, "peg_in_hole")
        pos = np.asarray(visible_obs["pos"], dtype=np.float64)
        rot = np.asarray(visible_obs["rot"], dtype=np.float64)
        wrench = np.asarray(visible_obs["wrench"], dtype=np.float64)

        lateral_f = float(np.linalg.norm(wrench[:2]))
        if -pos[2] >= 50.0 and lateral_f < 10.0:
            self.phase = InsertionPhase.SEATED_TERMINAL
            zero_act = np.zeros(6, dtype=np.float64)
            return zero_act, {
                "phase": self.phase.value,
                "raw_planner_action": zero_act.tolist(),
                "nominal_phase_action": zero_act.tolist(),
                "safe_action": zero_act.tolist(),
                "cbf_meta": {"is_safe": True, "modified": False, "reason": "seated_hold"},
                "plan_info": {},
            }

        plan_kwargs = {"warm_start_mean": self.warm_mean} if (self.use_warm_start and self.warm_mean is not None) else {}
        planner_act, plan_info = self.planner.plan(s_curr, self.reward_fn, **plan_kwargs)
        cand_seq = plan_info.get("best_trajectory")
        if self.use_warm_start and cand_seq is not None and len(cand_seq) > 1:
            self.warm_mean = np.vstack([cand_seq[1:], cand_seq[-1:]])

        nominal_action = np.asarray(planner_act, dtype=np.float64).copy()
        ok_clr, c_safe, theta_crit_deg, refusal_reason = self.safety_filter.resolve_safe_clearance(
            clearance_spec=self.clearance_spec,
            pos_xy=pos[:2],
            z_mm=float(pos[2]),
            wrench=wrench,
        )

        if not ok_clr:
            self.phase = InsertionPhase.ALIGNMENT_FAILED
            self.alignment_failure_reason = refusal_reason or "clearance_refused"
        elif self.phase == InsertionPhase.PRE_ENTRY_ALIGN:
            r_gate = self.safety_filter.r_gate_fraction * c_safe
            tilt_gate = self.safety_filter.tilt_gate_fraction * theta_crit_deg
            r_curr = float(np.linalg.norm(pos[:2]))
            tilt_curr = float(np.linalg.norm(rot[:2]))
            aligned_now = (r_curr <= r_gate) and (tilt_curr <= tilt_gate)

            if pos[2] <= 0.0 and aligned_now:
                self.phase = InsertionPhase.INSERTION_CONSTRAINED
            elif not aligned_now:
                self.align_steps += 1
                if self.align_steps > self.max_align_steps:
                    self.phase = InsertionPhase.ALIGNMENT_FAILED
                    self.alignment_failure_reason = "pre_entry_alignment_timeout"
                else:
                    # Explicit Phase A centering & uprighting above z > 0 (never plunge blindly)
                    nominal_action[:2] = np.clip(-pos[:2], -5.0, 5.0)
                    nominal_action[3:5] = np.clip(-rot[:2], -2.0, 2.0)
                    nominal_action[2] = float(np.clip(self.hover_z_mm - pos[2], -2.0, 5.0))
                    nominal_action[5] = 0.0
            else:
                # Aligned within (r_gate, tilt_gate) at z > 0: keep centered/upright, permit planner dz
                nominal_action[:2] = np.clip(-pos[:2], -5.0, 5.0)
                nominal_action[3:5] = np.clip(-rot[:2], -2.0, 2.0)
                if pos[2] + nominal_action[2] <= 0.0:
                    self.phase = InsertionPhase.INSERTION_CONSTRAINED
        elif self.phase == InsertionPhase.INSERTION_CONSTRAINED:
            # Phase B keeps centering & uprighting bias while planner drives vertical progress
            nominal_action[:2] = np.clip(-pos[:2], -5.0, 5.0)
            nominal_action[3:5] = np.clip(-rot[:2], -2.0, 2.0)
            nominal_action[5] = 0.0

        # Query world-model 1-step wrench UCB if model supports it (CBF remains independent of it for bounds)
        wm_pred_w = None
        wm_std_w = None
        if self.hybrid_wm is not None and hasattr(self.hybrid_wm, "predict_with_uncertainty"):
            with torch.no_grad():
                st = torch.tensor(s_curr, dtype=torch.float32).unsqueeze(0)
                at = torch.tensor(nominal_action, dtype=torch.float32).unsqueeze(0)
                mean_ns, epi_v, alea_v = self.hybrid_wm.predict_with_uncertainty(st, at)
                ns_np = mean_ns.squeeze(0).numpy()
                tot_std = torch.sqrt(torch.clamp(epi_v + alea_v, min=0.0)).squeeze(0).numpy()
                if len(ns_np) >= 15:
                    wm_pred_w = ns_np[9:15]
                    wm_std_w = tot_std[9:15]

        allow_entry = self.phase != InsertionPhase.ALIGNMENT_FAILED
        safe_action, cbf_meta = self.safety_filter.filter_action(
            visible_obs,
            nominal_action,
            clearance_spec=self.clearance_spec,
            wm_pred_wrench=wm_pred_w,
            wm_pred_wrench_std=wm_std_w,
            allow_entry_phase=allow_entry,
        )
        if cbf_meta.get("fail_closed", False) and self.phase == InsertionPhase.PRE_ENTRY_ALIGN:
            self.phase = InsertionPhase.ALIGNMENT_FAILED
            self.alignment_failure_reason = str(cbf_meta.get("reason", "fail_closed"))

        return safe_action, {
            "phase": self.phase.value,
            "alignment_failure_reason": self.alignment_failure_reason,
            "align_steps": int(self.align_steps),
            "c_safe_mm": float(c_safe),
            "theta_crit_deg": float(theta_crit_deg),
            "raw_planner_action": np.asarray(planner_act, dtype=np.float64).tolist(),
            "nominal_phase_action": nominal_action.tolist(),
            "safe_action": safe_action.tolist(),
            "cbf_meta": cbf_meta,
            "plan_info": {
                k: v
                for k, v in plan_info.items()
                if k != "best_trajectory"
            },
        }


def build_planner_for_condition(
    hybrid_wm: Any,
    arch: str,
    seed_offset: int = 42,
    num_candidates: int = 60,
    cem_iterations: int = 2,
    init_std: Sequence[float] = BASELINE_INIT_STD,
    beta_override: Optional[float] = None,
) -> Tuple[Any, Dict[str, Any]]:
    """Build baseline or single-factor ablated CEM planner matching Phase 3.5/3.5.1 wiring."""
    if beta_override is not None:
        bounds = (
            np.array([-5.0, -5.0, -5.0, -2.0, -2.0, -2.0], dtype=np.float64),
            np.array([5.0, 5.0, 5.0, 2.0, 2.0, 2.0], dtype=np.float64),
        )
        planner = UncertaintyPenalizedCEM(
            ensemble_model=hybrid_wm,
            action_dim=6,
            action_bounds=bounds,
            horizon=10,
            num_samples=num_candidates,
            elite_fraction=0.15,
            num_iterations=cem_iterations,
            beta=float(beta_override),
            uncertainty_source="auto",
            seed=seed_offset,
            init_std=list(init_std),
        )
        return planner, {"planner_class": "UncertaintyPenalizedCEM", "beta": float(beta_override)}

    pe = PlannerEvaluator(
        task="peg_in_hole",
        eval_horizon=50,
        plan_horizon=10,
        num_candidates=num_candidates,
        elite_fraction=0.15,
        cem_iterations=cem_iterations,
        seed=seed_offset,
        init_std=list(init_std),
    )
    planner, planner_id, planner_cls, _, unc_src = pe._create_planner_for_model(
        hybrid_wm=hybrid_wm,
        architecture_id=arch,
        planner_type="auto",
        uncertainty_beta=1.5,
        uncertainty_source="auto",
    )
    return planner, {"planner_class": planner_cls, "planner_id": planner_id, "unc_src": unc_src}


def run_free_space_stall_ablations(models_pih: Dict[str, Any]) -> Dict[str, Any]:
    """3.5.2-D: Single-factor free-space stall ablations keeping B1-B3 weights frozen."""
    baseline_probe_specs = [
        ("M4_acmm", "B3", None, False, BASELINE_INIT_STD, "live_geom"),
        ("M4_acmm", "B1", None, False, BASELINE_INIT_STD, "live_geom"),
        ("M0_passive", "B3", None, False, BASELINE_INIT_STD, "live_geom"),
        ("M0_passive", "B2", None, False, BASELINE_INIT_STD, "live_geom"),
    ]
    # Single-factor sweeps around M0_passive/B3 (keep only 1 factor varying per row)
    single_factor_specs = [
        # Factor 1: uncertainty penalty beta (keeping warm_start=False, init_std=BASELINE, cbf=live_geom)
        ("beta_1.5", "M0_passive", "B3", 1.5, False, BASELINE_INIT_STD, "live_geom"),
        ("beta_0.25", "M0_passive", "B3", 0.25, False, BASELINE_INIT_STD, "live_geom"),
        ("beta_0.0", "M0_passive", "B3", 0.0, False, BASELINE_INIT_STD, "live_geom"),
        # Factor 2: warm_start (keeping beta=1.5, init_std=BASELINE, cbf=live_geom)
        ("warm_start_false", "M0_passive", "B3", 1.5, False, BASELINE_INIT_STD, "live_geom"),
        ("warm_start_true", "M0_passive", "B3", 1.5, True, BASELINE_INIT_STD, "live_geom"),
        # Factor 3: init_std on dz (keeping beta=1.5, warm_start=False, cbf=live_geom)
        ("init_std_1.5", "M0_passive", "B3", 1.5, False, BASELINE_INIT_STD, "live_geom"),
        ("init_std_3.0", "M0_passive", "B3", 1.5, False, (0.5, 0.5, 3.0, 0.3, 0.3, 0.1), "live_geom"),
        # Factor 4: safety filter mode (keeping beta=1.5, warm_start=False, init_std=BASELINE)
        ("cbf_live_geom", "M0_passive", "B3", 1.5, False, BASELINE_INIT_STD, "live_geom"),
        ("cbf_none", "M0_passive", "B3", 1.5, False, BASELINE_INIT_STD, "none"),
    ]

    def _run_probe(
        label: str,
        cond: str,
        arch: str,
        beta_ov: Optional[float],
        warm_start: bool,
        init_std: Sequence[float],
        cbf_mode: str,
        horizon_steps: int = 20,
        seed: int = 3080,
    ) -> Dict[str, Any]:
        wm = models_pih[cond][arch]
        wm.eval()
        planner, pmeta = build_planner_for_condition(
            wm, arch, seed_offset=42, init_std=init_std, beta_override=beta_ov
        )
        np.random.seed(42 + seed)
        if hasattr(planner, "rng") and planner.rng is not None:
            planner.rng = np.random.RandomState(42 + seed)

        env = PegInHoleEnv(dt=0.02, clearance=0.50, friction_coeff=0.50, seed=seed)
        obs = env.reset()
        spec = ClearanceSpecification(mode=ClearanceMode.UNKNOWN_CLEARANCE)
        geom_filter = GeometryAwareCBFSafetyFilter(clearance_spec=spec)

        # Zero-action predicted world-model drift at initial free-space state
        s0, _ = extract_env_state_and_wrench(extract_controller_visible_pih_obs(obs), "peg_in_hole")
        with torch.no_grad():
            z_mean, _, _ = wm.predict_with_uncertainty(
                torch.tensor(s0, dtype=torch.float32).unsqueeze(0),
                torch.zeros((1, 6), dtype=torch.float32),
            )
        zero_action_drift_z = float(z_mean.squeeze(0).numpy()[2] - s0[2])

        raw_dz: List[float] = []
        exec_dz: List[float] = []
        cand_dz_mean: List[float] = []
        cand_dz_std: List[float] = []
        elite_dz_mean: List[float] = []
        elite_dz_std: List[float] = []
        unc_penalties: List[float] = []
        pred_returns: List[float] = []
        z_hist = [float(env.peg_pos[2])]
        r_hist = [float(np.linalg.norm(env.peg_pos[:2]))]
        warm_mean = None
        contact_step: Optional[int] = None

        for step in range(horizon_steps):
            vis_obs = extract_controller_visible_pih_obs(obs)
            s_curr, _ = extract_env_state_and_wrench(vis_obs, "peg_in_hole")
            pk = {"warm_start_mean": warm_mean} if (warm_start and warm_mean is not None) else {}
            a_raw, pinfo = planner.plan(s_curr, compute_peg_in_hole_planner_reward, **pk)
            cseq = pinfo.get("best_trajectory")
            if warm_start and cseq is not None and len(cseq) > 1:
                warm_mean = np.vstack([cseq[1:], cseq[-1:]])

            raw_dz.append(float(a_raw[2]))
            cand_dz_mean.append(float(pinfo.get("cand_first_action_mean", [0] * 6)[2]))
            cand_dz_std.append(float(pinfo.get("cand_first_action_std", [0] * 6)[2]))
            elite_dz_mean.append(float(pinfo.get("elite_first_action_mean", [0] * 6)[2]))
            elite_dz_std.append(float(pinfo.get("elite_first_action_std", [0] * 6)[2]))
            unc_penalties.append(float(pinfo.get("best_uncertainty_penalty", 0.0)))
            pred_returns.append(float(pinfo.get("best_predicted_return", 0.0)))

            if cbf_mode == "live_geom":
                a_exec, _ = geom_filter.filter_action(vis_obs, a_raw.copy(), clearance_spec=spec)
            else:
                a_exec = np.clip(a_raw.copy(), [-5, -5, -5, -2, -2, -2], [5, 5, 5, 2, 2, 2])
            exec_dz.append(float(a_exec[2]))

            obs, _, done, _ = step_env_compatible(env, a_exec, task="peg_in_hole", require_reward=False)
            z_hist.append(float(env.peg_pos[2]))
            r_hist.append(float(np.linalg.norm(env.peg_pos[:2])))
            if contact_step is None and (env.peg_pos[2] <= 0.0 or float(np.linalg.norm(obs["wrench"][:3])) > 0.5):
                contact_step = step
            if done:
                break

        return {
            "label": label,
            "condition": cond,
            "architecture": arch,
            "planner_meta": pmeta,
            "warm_start": bool(warm_start),
            "init_std_dz": float(init_std[2]),
            "cbf_mode": cbf_mode,
            "zero_action_wm_drift_dz_mm": round(zero_action_drift_z, 4),
            "mean_raw_dz_mm": round(float(np.mean(raw_dz)), 4),
            "mean_exec_dz_mm": round(float(np.mean(exec_dz)), 4),
            "mean_cand_dz_mean_mm": round(float(np.mean(cand_dz_mean)), 4),
            "mean_cand_dz_std_mm": round(float(np.mean(cand_dz_std)), 4),
            "mean_elite_dz_mean_mm": round(float(np.mean(elite_dz_mean)), 4),
            "mean_elite_dz_std_mm": round(float(np.mean(elite_dz_std)), 4),
            "mean_uncertainty_penalty": round(float(np.mean(unc_penalties)), 4),
            "mean_predicted_return": round(float(np.mean(pred_returns)), 4),
            "z_start_mm": round(z_hist[0], 4),
            "z_end_mm": round(z_hist[-1], 4),
            "radial_drift_end_mm": round(r_hist[-1], 4),
            "contact_established": contact_step is not None,
            "first_contact_step": contact_step,
        }

    baseline_comparison = [
        _run_probe(f"{c}_{a}", c, a, b, ws, istd, cm)
        for (c, a, b, ws, istd, cm) in baseline_probe_specs
    ]
    single_factor_ablations = [
        _run_probe(lbl, c, a, b, ws, istd, cm)
        for (lbl, c, a, b, ws, istd, cm) in single_factor_specs
    ]
    return {
        "probe_seed": 3080,
        "horizon_steps": 20,
        "baseline_comparison": baseline_comparison,
        "single_factor_ablations": single_factor_ablations,
    }


def build_frozen_pilot_manifest() -> Dict[str, Any]:
    """Build and freeze the exact 30-episode Phase 3.5.2 pilot manifest BEFORE running."""
    pool_audit = verify_disjoint_seed_pools()
    existing_all: set[int] = set()
    for name, pool in PHASE3_SEED_POOLS.items():
        if name != "excluded_p26_pilot":
            existing_all.update(int(s) for s in pool)
    overlap = sorted(set(PILOT_SEEDS).intersection(existing_all))
    if overlap:
        raise RuntimeError(f"Pilot seeds overlap frozen Phase 3 pools: {overlap}")

    episodes: List[Dict[str, Any]] = []
    idx = 0
    for phys_label, mu, clr in PHYSICAL_CONDITIONS:
        for cond, arch, clr_mode in PILOT_CONTROLLER_CONFIGS:
            seed = int(PILOT_SEEDS[idx])
            episodes.append({
                "episode_index": idx,
                "seed": seed,
                "physical_condition": phys_label,
                "friction_coeff": float(mu),
                "true_clearance_mm": float(clr),
                "world_model_condition": cond,
                "architecture": arch,
                "clearance_mode": clr_mode.value,
                "active_safety_filter": "GeometryAwareCBFSafetyFilter",
                "shadow_safety_filter": "PredictiveCBFSafetyFilter",
                "eval_horizon": 50,
            })
            idx += 1

    assert len(episodes) == 30, f"Pilot must be <=30 episodes, got {len(episodes)}"
    manifest = {
        "schema_version": "phase3_5_2_pilot_manifest_v1",
        "max_episodes_cap": 30,
        "total_episodes": len(episodes),
        "seed_range": [int(PILOT_SEEDS[0]), int(PILOT_SEEDS[-1])],
        "disjoint_from_phase3_pools": True,
        "phase3_seed_pool_audit": pool_audit,
        "episodes": episodes,
    }
    canonical = json.dumps(manifest, sort_keys=True).encode("utf-8")
    manifest["manifest_sha256"] = hashlib.sha256(canonical).hexdigest()
    return manifest


def run_frozen_pilot(
    manifest: Dict[str, Any],
    models_pih: Dict[str, Any],
) -> Dict[str, Any]:
    """Execute the exact frozen <=30-episode pilot manifest without modification."""
    if len(manifest["episodes"]) > 30:
        raise ValueError("Phase 3.5.2 pilot strictly capped at <=30 episodes.")

    safety_eval = SafetyEvaluator(task="peg_in_hole")
    records: List[Dict[str, Any]] = []

    for entry in manifest["episodes"]:
        seed = int(entry["seed"])
        cond = entry["world_model_condition"]
        arch = entry["architecture"]
        clr_mode = ClearanceMode(entry["clearance_mode"])
        wm = models_pih[cond][arch]
        wm.eval()

        planner, pmeta = build_planner_for_condition(wm, arch, seed_offset=42)
        np.random.seed(42 + seed)
        if hasattr(planner, "rng") and planner.rng is not None:
            planner.rng = np.random.RandomState(42 + seed)

        env = PegInHoleEnv(
            dt=0.02,
            clearance=float(entry["true_clearance_mm"]),
            friction_coeff=float(entry["friction_coeff"]),
            seed=seed,
        )
        clr_spec = build_metrology_clearance_spec(clr_mode, float(entry["true_clearance_mm"]), seed)
        geom_filter = GeometryAwareCBFSafetyFilter(clearance_spec=clr_spec, enable_shadow_baseline=True)
        controller = TwoPhasePegInHoleController(wm, planner, geom_filter, clr_spec)

        obs = env.reset()
        controller.reset()
        max_force = 0.0
        max_torque = 0.0
        safety_violated_eval = False
        safety_violated_env = False
        jammed = False
        seated = False
        term_reason = "horizon_reached"
        phases_visited: List[str] = []
        raw_dz_series: List[float] = []
        safe_dz_series: List[float] = []
        steps_exec = 0

        for step in range(int(entry["eval_horizon"])):
            safe_act, step_meta = controller.select_action(obs)
            phases_visited.append(step_meta["phase"])
            raw_dz_series.append(float(step_meta["raw_planner_action"][2]))
            safe_dz_series.append(float(safe_act[2]))

            obs, _, done, info = step_env_compatible(env, safe_act, task="peg_in_hole", require_reward=False)
            steps_exec += 1

            fn = float(np.linalg.norm(obs["wrench"][:3]))
            tn = float(np.linalg.norm(obs["wrench"][3:6]))
            max_force = max(max_force, fn)
            max_torque = max(max_torque, tn)
            step_violated, _ = safety_eval.check_safety_violation(obs)
            if step_violated:
                safety_violated_eval = True
            if info.get("safety_violated", False):
                safety_violated_env = True
            if info.get("jammed", False):
                jammed = True
            if info.get("seated", False):
                seated = True

            if done:
                if seated:
                    term_reason = "seated"
                elif safety_violated_env:
                    term_reason = "dynamic_crush_terminated"
                elif jammed:
                    term_reason = "jammed"
                else:
                    term_reason = "done_other"
                break

        records.append({
            "episode_index": entry["episode_index"],
            "seed": seed,
            "physical_condition": entry["physical_condition"],
            "friction_coeff": entry["friction_coeff"],
            "true_clearance_mm": entry["true_clearance_mm"],
            "world_model_condition": cond,
            "architecture": arch,
            "clearance_mode": clr_mode.value,
            "planner_class": pmeta["planner_class"],
            "steps_executed": steps_exec,
            "final_z_mm": round(float(env.peg_pos[2]), 4),
            "final_radial_err_mm": round(float(np.linalg.norm(env.peg_pos[:2])), 4),
            "final_tilt_deg": round(float(np.linalg.norm(env.peg_rot[:2])), 4),
            "final_phase": controller.phase.value,
            "phases_visited": sorted(set(phases_visited)),
            "alignment_failed": controller.phase == InsertionPhase.ALIGNMENT_FAILED,
            "alignment_failure_reason": controller.alignment_failure_reason,
            "seated_success": seated,
            "safety_violation": bool(safety_violated_eval or safety_violated_env),
            "dynamic_crush_terminated": safety_violated_env,
            "jammed": jammed,
            "termination_reason": term_reason,
            "max_force_n": round(max_force, 4),
            "max_torque_nm": round(max_torque, 4),
            "mean_raw_dz_mm": round(float(np.mean(raw_dz_series)) if raw_dz_series else 0.0, 4),
            "mean_safe_dz_mm": round(float(np.mean(safe_dz_series)) if safe_dz_series else 0.0, 4),
            "cbf_modified_steps": int(geom_filter.modified_steps),
            "shadow_would_pass_unsafe_steps": int(geom_filter.shadow_would_pass_unsafe_steps),
        })

    n = len(records)
    return {
        "total_episodes": n,
        "safety_violations": sum(1 for r in records if r["safety_violation"]),
        "dynamic_crush_terminations": sum(1 for r in records if r["dynamic_crush_terminated"]),
        "seated_successes": sum(1 for r in records if r["seated_success"]),
        "alignment_failures": sum(1 for r in records if r["alignment_failed"]),
        "jams": sum(1 for r in records if r["jammed"]),
        "max_observed_force_n": max((r["max_force_n"] for r in records), default=0.0),
        "max_observed_torque_nm": max((r["max_torque_nm"] for r in records), default=0.0),
        "total_cbf_modified_steps": sum(r["cbf_modified_steps"] for r in records),
        "total_shadow_would_pass_unsafe_steps": sum(r["shadow_would_pass_unsafe_steps"] for r in records),
        "episodes": records,
    }


def collect_immutable_file_hashes(r002_root: str) -> Dict[str, str]:
    """Capture SHA-256 digests of frozen baseline files that must remain untouched."""
    rel_paths = (
        "src/safety/pcbf_safety_filter.py",
        "src/coordination/plcea_substitutor.py",
        "experiments/phase3_5_evaluation/phase35_closure_addendum.json",
        "experiments/phase3_5_evaluation/phase35_1_peginhole_correction.json",
        "manifests/phase34_dataset_manifest.json",
        "manifests/ood_regime_manifests.json",
    )
    out: Dict[str, str] = {}
    for rel in rel_paths:
        full = os.path.join(r002_root, rel)
        if os.path.exists(full):
            out[rel] = _sha256_file(full)
    return out


def verify_immutable_hashes_unchanged(r002_root: str, pre_hashes: Dict[str, str]) -> Dict[str, Any]:
    eval_dir = os.path.join(r002_root, "experiments", "phase3_5_evaluation")
    archive_ok = True
    if os.path.exists(eval_dir):
        verify_archived_phase35_immutability(eval_dir)
    post_hashes = collect_immutable_file_hashes(r002_root)
    mismatches = [
        k for k in pre_hashes if post_hashes.get(k) != pre_hashes[k]
    ]
    if mismatches:
        raise RuntimeError(f"Immutable baseline files modified: {mismatches}")
    return {
        "phase35_archives_verified": archive_ok,
        "checked_files": sorted(post_hashes.keys()),
        "hashes": post_hashes,
    }


def run_phase35_2_safety_investigation(
    r002_root: str,
    out_dir: Optional[str] = None,
) -> Dict[str, Any]:
    """Execute the full Phase 3.5.2 investigation and freeze & run the <=30-episode pilot."""
    t0 = time.perf_counter()
    if out_dir is None:
        out_dir = os.path.join(r002_root, "experiments", "phase3_5_2_safety_investigation")
    os.makedirs(out_dir, exist_ok=True)

    pre_hashes = collect_immutable_file_hashes(r002_root)
    loaded = verify_phase34_artifacts_and_load(r002_root)
    models_pih = loaded["models"]["peg_in_hole"]

    # Freeze pilot manifest BEFORE executing pilot episodes
    manifest = build_frozen_pilot_manifest()
    manifest_path = os.path.join(out_dir, "phase35_2_pilot_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(to_json_serializable(manifest), f, indent=2)
    manifest_sha = _sha256_file(manifest_path)

    stall_ablations = run_free_space_stall_ablations(models_pih)
    pilot_results = run_frozen_pilot(manifest, models_pih)

    # Verify manifest and immutable baseline archives stayed unmodified
    if _sha256_file(manifest_path) != manifest_sha:
        raise RuntimeError("Frozen pilot manifest was modified during run!")
    immutability_receipt = verify_immutable_hashes_unchanged(r002_root, pre_hashes)

    output_doc = {
        "schema_version": "phase3_5_2_safety_investigation_v1",
        "elapsed_seconds": round(time.perf_counter() - t0, 3),
        "reproducibility": get_runtime_reproducibility_metadata(r002_root),
        "pilot_manifest_path": "experiments/phase3_5_2_safety_investigation/phase35_2_pilot_manifest.json",
        "pilot_manifest_sha256": manifest_sha,
        "stall_ablations": stall_ablations,
        "pilot_results": pilot_results,
        "immutability_receipt": immutability_receipt,
    }
    out_path = os.path.join(out_dir, "phase35_2_investigation.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(to_json_serializable(output_doc), f, indent=2)
    return output_doc
