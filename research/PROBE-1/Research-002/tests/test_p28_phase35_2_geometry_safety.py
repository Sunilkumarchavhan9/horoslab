"""Phase 3.5.2 acceptance tests: geometry-aware predictive CBF, clearance modes, two-phase control, Task 2 non-regression."""

import os
import sys

import numpy as np
import pytest

R002_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
R002_SRC = os.path.join(R002_ROOT, "src")
if R002_ROOT not in sys.path:
    sys.path.insert(0, R002_ROOT)
if R002_SRC not in sys.path:
    sys.path.insert(0, R002_SRC)

from src.environment import step_env_compatible
from src.environment.peg_in_hole_env import PegInHoleEnv
from src.integrated.peginhole_phase352_controller import (
    InsertionPhase,
    PHYSICAL_CONDITIONS,
    TwoPhasePegInHoleController,
    build_frozen_pilot_manifest,
    build_metrology_clearance_spec,
)
from src.integrated.phase35_evaluator import create_phase35_env
from src.coordination import plcea_substitutor
from src.integrated.safety_evaluator import SafetyEvaluator
from src.planners.cem_planner import CEMPlanner
from src.planners.uncertainty_penalized_cem import UncertaintyPenalizedCEM
from src.safety.geometry_cbf_safety_filter import (
    ClearanceMode,
    ClearanceSpecification,
    GeometryAwareCBFSafetyFilter,
    compute_critical_wedge_angle,
    extract_controller_visible_pih_obs,
)
from src.safety.pcbf_safety_filter import PredictiveCBFSafetyFilter


def _make_obs(
    pos=(0.0, 0.0, 5.0),
    vel=(0.0, 0.0, 0.0),
    rot=(0.0, 0.0, 0.0),
    wrench=(0.0, 0.0, 0.0, 0.0, 0.0, 0.0),
    stratum=0,
    clearance=0.18,
    friction=0.85,
):
    return {
        "pos": np.array(pos, dtype=np.float64),
        "vel": np.array(vel, dtype=np.float64),
        "rot": np.array(rot, dtype=np.float64),
        "wrench": np.array(wrench, dtype=np.float64),
        "stratum": int(stratum),
        "step": 1,
        "clearance": float(clearance),
        "friction": float(friction),
    }


def test_critical_wedge_angle_matches_exact_geometry():
    assert compute_critical_wedge_angle(0.50, 80.0) == pytest.approx(0.71616025, abs=1e-4)
    assert compute_critical_wedge_angle(0.25, 80.0) == pytest.approx(0.35809464, abs=1e-4)
    assert compute_critical_wedge_angle(0.18, 80.0) == pytest.approx(0.25782952, abs=1e-4)
    assert compute_critical_wedge_angle(0.0, 80.0) == 0.0


def test_zero_oracle_leakage_across_filter_and_controller():
    flt_a = GeometryAwareCBFSafetyFilter(
        clearance_spec=ClearanceSpecification(mode=ClearanceMode.UNKNOWN_CLEARANCE),
        enable_shadow_baseline=False,
    )
    flt_b = GeometryAwareCBFSafetyFilter(
        clearance_spec=ClearanceSpecification(mode=ClearanceMode.UNKNOWN_CLEARANCE),
        enable_shadow_baseline=False,
    )
    obs_oracle = _make_obs(pos=(0.3, -0.2, 1.0), rot=(0.4, -0.3, 0.0), clearance=99.0, friction=0.01)
    obs_stripped = extract_controller_visible_pih_obs(obs_oracle)
    assert "clearance" not in obs_stripped and "friction" not in obs_stripped

    raw = np.array([2.5, -2.5, -4.0, 1.5, -1.5, 0.0], dtype=np.float64)
    act_1, meta_1 = flt_a.filter_action(obs_oracle, raw)
    act_2, meta_2 = flt_b.filter_action(obs_stripped, raw)
    np.testing.assert_allclose(act_1, act_2, atol=0.0, rtol=0.0)
    assert meta_1["reason"] == meta_2["reason"]
    assert meta_1["c_safe_mm"] == meta_2["c_safe_mm"]


def test_mode_a_estimated_clearance_lcb_and_fail_closed():
    flt = GeometryAwareCBFSafetyFilter()
    spec_ok = ClearanceSpecification(
        mode=ClearanceMode.ESTIMATED_CLEARANCE,
        c_hat_mm=0.25,
        sigma_c_mm=0.025,
        k_sigma=2.0,
    )
    obs = _make_obs(pos=(0.0, 0.0, 1.0), stratum=0)
    _, meta_ok = flt.filter_action(obs, np.array([0.0, 0.0, -2.0, 0.0, 0.0, 0.0]), clearance_spec=spec_ok)
    assert not meta_ok["fail_closed"]
    assert meta_ok["c_safe_mm"] == pytest.approx(0.20, abs=1e-9)

    bad_specs = [
        ClearanceSpecification(mode=ClearanceMode.ESTIMATED_CLEARANCE, c_hat_mm=None, sigma_c_mm=0.02),
        ClearanceSpecification(mode=ClearanceMode.ESTIMATED_CLEARANCE, c_hat_mm=float("nan"), sigma_c_mm=0.02),
        ClearanceSpecification(mode=ClearanceMode.ESTIMATED_CLEARANCE, c_hat_mm=0.10, sigma_c_mm=0.04, k_sigma=2.0),
        ClearanceSpecification(mode=ClearanceMode.ESTIMATED_CLEARANCE, c_hat_mm=0.25, sigma_c_mm=-0.01),
    ]
    for bad_spec in bad_specs:
        act, meta = flt.filter_action(obs, np.array([0.0, 0.0, -4.0, 0.0, 0.0, 0.0]), clearance_spec=bad_spec)
        assert meta["fail_closed"] is True
        assert meta["entry_allowed"] is False
        assert act[2] >= 0.0


def test_mode_b_unknown_clearance_domain_limits_and_contact_falsification():
    flt = GeometryAwareCBFSafetyFilter()
    obs_free = _make_obs(pos=(0.0, 0.0, 1.0), stratum=0)
    for bad_env_spec in (
        ClearanceSpecification(mode=ClearanceMode.UNKNOWN_CLEARANCE, allow_below_validated_domain=True),
        ClearanceSpecification(mode=ClearanceMode.UNKNOWN_CLEARANCE, min_possible_clearance_mm=0.10),
    ):
        act, meta = flt.filter_action(obs_free, np.array([0.0, 0.0, -4.0, 0.0, 0.0, 0.0]), clearance_spec=bad_env_spec)
        assert meta["fail_closed"] is True
        assert act[2] >= 0.0

    # Runtime falsification: peg is inside nominal r<=0.18 but real fixture (say c=0.10) exerts wall force > 1.0 N
    valid_mode_b = ClearanceSpecification(mode=ClearanceMode.UNKNOWN_CLEARANCE)
    obs_false_domain = _make_obs(
        pos=(0.12, 0.0, -2.0),
        wrench=(-4.0, 0.0, -0.5, 0.0, -0.1, 0.1),
        stratum=2,
        clearance=0.10,
    )
    act, meta = flt.filter_action(obs_false_domain, np.array([0.0, 0.0, -3.0, 0.0, 0.0, 0.0]), clearance_spec=valid_mode_b)
    assert meta["fail_closed"] is True
    assert meta["reason"] == "contact_resistance_below_validated_domain"
    assert act[2] > 0.0


def test_all_strata_all_corners_adversarial_actions_stay_safe():
    spec = ClearanceSpecification(mode=ClearanceMode.UNKNOWN_CLEARANCE)
    flt = GeometryAwareCBFSafetyFilter(clearance_spec=spec, enable_shadow_baseline=True)
    adversarial_actions = [
        np.array([5.0, 5.0, -5.0, 2.0, 2.0, 0.0]),
        np.array([-5.0, 4.0, -5.0, -2.0, 2.0, 0.0]),
        np.array([0.0, 0.0, -5.0, 0.0, 0.0, 0.0]),
        np.array([3.5, -3.5, -2.0, 1.5, -1.5, 0.5]),
    ]
    for _, mu, clr in PHYSICAL_CONDITIONS:
        for stratum in range(5):
            # 1) Misaligned pre-entry state must never cross z <= 0
            obs_pre = _make_obs(
                pos=(1.5, -1.2, 0.6),
                rot=(1.0, -0.8, 0.0),
                stratum=stratum,
                clearance=clr,
                friction=mu,
            )
            for raw in adversarial_actions:
                safe_act, meta = flt.filter_action(obs_pre, raw)
                assert obs_pre["pos"][2] + safe_act[2] > 0.0
                assert np.linalg.norm(obs_pre["pos"][:2] + safe_act[:2]) <= meta["c_safe_mm"] * flt.r_gate_fraction + 1e-6

            # 2) Sudden transition test from just above z=0 with aligned or slightly displaced state into env
            env = PegInHoleEnv(dt=0.02, clearance=clr, friction_coeff=mu, seed=7501)
            obs = env.reset()
            for raw in adversarial_actions:
                env.peg_pos = np.array([0.05, 0.05, 0.3], dtype=np.float64)
                env.peg_rot = np.array([0.05, -0.05, 0.0], dtype=np.float64)
                env.peg_vel = np.zeros(3, dtype=np.float64)
                env.contact_wrench = np.zeros(6, dtype=np.float64)
                obs_t = env._get_obs()
                safe_act, _ = flt.filter_action(obs_t, raw)
                next_obs, _, _, info = step_env_compatible(env, safe_act, task="peg_in_hole", require_reward=False)
                assert np.linalg.norm(next_obs["wrench"][:3]) <= 35.0
                assert np.linalg.norm(next_obs["wrench"][3:6]) <= 7.0
                assert not info["safety_violated"]


def test_learned_uncertainty_independence_and_invalid_inputs_fail_closed():
    flt = GeometryAwareCBFSafetyFilter(
        clearance_spec=ClearanceSpecification(mode=ClearanceMode.UNKNOWN_CLEARANCE),
    )
    raw = np.array([4.5, 0.0, -3.0, 1.5, 0.0, 0.0], dtype=np.float64)
    # 1) Aligned at z=0.5 with huge lateral+tilt excursion + zero WM prediction: must still project xy & tilt inside tube
    obs_aligned = _make_obs(pos=(0.0, 0.0, 0.5), rot=(0.0, 0.0, 0.0), stratum=0)
    safe_aligned, meta_aligned = flt.filter_action(
        obs_aligned,
        raw,
        wm_pred_wrench=np.zeros(6),
        wm_pred_wrench_std=np.zeros(6),
    )
    assert abs(obs_aligned["pos"][0] + safe_aligned[0]) <= meta_aligned["c_safe_mm"] + 1e-6
    assert abs(obs_aligned["rot"][0] + safe_aligned[3]) <= meta_aligned["theta_crit_deg"] + 1e-6

    # 2) Misaligned at z=0.5 with zero WM prediction: must block z <= 0 entry despite zero WM uncertainty
    obs_misaligned = _make_obs(pos=(0.3, 0.0, 0.5), rot=(0.0, 0.0, 0.0), stratum=0)
    safe_act, meta = flt.filter_action(
        obs_misaligned,
        raw,
        wm_pred_wrench=np.zeros(6),
        wm_pred_wrench_std=np.zeros(6),
    )
    assert obs_misaligned["pos"][2] + safe_act[2] > 0.0
    assert abs(obs_misaligned["pos"][0] + safe_act[0]) <= meta["c_safe_mm"] + 1e-6
    assert abs(obs_misaligned["rot"][0] + safe_act[3]) <= meta["theta_crit_deg"] + 1e-6

    # Invalid / NaN inputs fail closed
    obs = obs_misaligned
    obs_nan = _make_obs()
    obs_nan["pos"][0] = np.nan
    act_nan, meta_nan = flt.filter_action(obs_nan, raw)
    assert meta_nan["fail_closed"] is True
    assert act_nan[2] >= 0.0

    act_bad_wm, meta_bad_wm = flt.filter_action(
        obs,
        raw,
        wm_pred_wrench=np.array([0.0, 0.0, np.inf, 0.0, 0.0, 0.0]),
    )
    assert meta_bad_wm["fail_closed"] is True
    assert act_bad_wm[2] >= 0.0


def test_two_phase_controller_alignment_failure_and_safe_insertion():
    class _DummyPlungingPlanner:
        def plan(self, state, reward_fn, **kwargs):
            return np.array([2.5, -2.5, -4.0, 1.2, -1.2, 0.0], dtype=np.float64), {
                "best_predicted_return": 100.0,
                "best_trajectory": None,
            }

    # Case A: unalignable (below validated domain) -> ALIGNMENT_FAILED, stays z > 0
    bad_spec = ClearanceSpecification(
        mode=ClearanceMode.UNKNOWN_CLEARANCE,
        min_possible_clearance_mm=0.10,
    )
    ctrl_fail = TwoPhasePegInHoleController(
        hybrid_wm=None,
        planner=_DummyPlungingPlanner(),
        safety_filter=GeometryAwareCBFSafetyFilter(clearance_spec=bad_spec),
        clearance_spec=bad_spec,
    )
    env_fail = PegInHoleEnv(dt=0.02, clearance=0.18, friction_coeff=0.85, seed=7502)
    obs = env_fail.reset()
    ctrl_fail.reset()
    for _ in range(10):
        act, _ = ctrl_fail.select_action(obs)
        obs, _, _, _ = step_env_compatible(env_fail, act, task="peg_in_hole", require_reward=False)
        assert obs["pos"][2] > 0.0
    assert ctrl_fail.phase == InsertionPhase.ALIGNMENT_FAILED

    # Case B: toughest OOD corner (0.85, 0.18) with Mode B -> aligns in z > 0 then seats safely with 0 violations
    spec_ok = build_metrology_clearance_spec(ClearanceMode.UNKNOWN_CLEARANCE, 0.18, seed=7503)
    ctrl_ok = TwoPhasePegInHoleController(
        hybrid_wm=None,
        planner=_DummyPlungingPlanner(),
        safety_filter=GeometryAwareCBFSafetyFilter(clearance_spec=spec_ok),
        clearance_spec=spec_ok,
    )
    env_ok = PegInHoleEnv(dt=0.02, clearance=0.18, friction_coeff=0.85, seed=7503)
    obs = env_ok.reset()
    ctrl_ok.reset()
    max_f = 0.0
    max_t = 0.0
    for _ in range(50):
        act, _ = ctrl_ok.select_action(obs)
        obs, _, done, info = step_env_compatible(env_ok, act, task="peg_in_hole", require_reward=False)
        max_f = max(max_f, float(np.linalg.norm(obs["wrench"][:3])))
        max_t = max(max_t, float(np.linalg.norm(obs["wrench"][3:6])))
        assert not info["safety_violated"]
        if done:
            break
    assert max_f <= 35.0
    assert max_t <= 7.0
    assert env_ok.seated
    assert ctrl_ok.phase in (InsertionPhase.INSERTION_CONSTRAINED, InsertionPhase.SEATED_TERMINAL)


def test_task2_non_regression_and_baseline_filter_preserved():
    base_filter = PredictiveCBFSafetyFilter()
    assert base_filter.critical_wedge_angle == 1.8

    # Verify Task 2 ID + all 4 OOD strata work unmodified
    safety_t2 = SafetyEvaluator(task="compliant_prelift").create_safety_filter()
    assert plcea_substitutor.WORKPIECE_MASS_KG == pytest.approx(0.350, abs=1e-9)

    task2_seeds = [("ID", 3000), ("OOD", 3040), ("OOD", 3054), ("OOD", 3066), ("OOD", 3073)]
    for reg, seed in task2_seeds:
        env, meta = create_phase35_env(reg, seed)
        obs = env.reset()
        act_t2 = np.array([0.0, 0.0, 0.0, 0.0, 0.5], dtype=np.float64)
        a_safe, _, _ = safety_t2.filter_action(obs, act_t2, task="compliant_prelift")
        res = step_env_compatible(env, a_safe, task="compliant_prelift", require_reward=False)
        assert len(res) == 4
        assert meta["task"] == "compliant_prelift"


def test_pilot_manifest_frozen_bounds_and_cem_stats():
    m1 = build_frozen_pilot_manifest()
    m2 = build_frozen_pilot_manifest()
    assert m1["total_episodes"] == 30 <= 30
    assert m1["manifest_sha256"] == m2["manifest_sha256"]
    assert m1["disjoint_from_phase3_pools"] is True
    assert len({e["seed"] for e in m1["episodes"]}) == 30

    import torch
    bounds = (
        np.array([-5.0, -5.0, -5.0, -2.0, -2.0, -2.0], dtype=np.float64),
        np.array([5.0, 5.0, 5.0, 2.0, 2.0, 2.0], dtype=np.float64),
    )

    class _LinWM:
        def eval(self):
            return self

        def __call__(self, s, a):
            return s + a[:, :3].sum(dim=-1, keepdim=True) * 0.01

    wm = _LinWM()
    cem = CEMPlanner(wm, action_dim=6, action_bounds=bounds, horizon=2, num_samples=12, elite_fraction=0.25, num_iterations=2, seed=7)
    _, info = cem.plan(np.zeros(15), lambda s, a: -float(np.sum(a ** 2)))
    assert len(info["cand_first_action_mean"]) == 6
    assert len(info["elite_first_action_std"]) == 6

    class _UncWM:
        def eval(self):
            return self

        def predict_with_uncertainty(self, s, a):
            return s.clone(), torch.ones_like(s) * 0.1, torch.ones_like(s) * 0.05

    ucem = UncertaintyPenalizedCEM(_UncWM(), action_dim=6, action_bounds=bounds, horizon=2, num_samples=12, elite_fraction=0.25, num_iterations=2, seed=7)
    _, uinfo = ucem.plan(np.zeros(15), lambda s, a: -float(np.sum(a ** 2)))
    assert len(uinfo["cand_first_action_mean"]) == 6
    assert len(uinfo["elite_first_action_std"]) == 6
