"""Fast CI smoke tests for Phase 3.6 validation campaign runner & fault injection harness."""

import os
import sys

R002_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
R002_SRC = os.path.join(R002_ROOT, "src")
if R002_ROOT not in sys.path:
    sys.path.insert(0, R002_ROOT)
if R002_SRC not in sys.path:
    sys.path.insert(0, R002_SRC)

from src.integrated.peginhole_phase352_controller import build_metrology_clearance_spec
from src.integrated.phase35_evaluator import verify_phase34_artifacts_and_load
from src.integrated.phase36_validation_runner import (
    FROZEN_MANIFEST_SHA256,
    _create_task2_env_for_phase36,
    _exact_mcnemar_two_sided_p,
    _run_single_pih_episode,
    _run_track_365_fault_injection,
    verify_frozen_phase36_manifest,
)
from src.integrated.planner_evaluator import PlannerEvaluator
from src.integrated.safety_evaluator import SafetyEvaluator
from src.safety.geometry_cbf_safety_filter import ClearanceMode
from src.selection_aware.counterfactual_rollout import extract_env_state_and_wrench


def test_frozen_phase36_manifest_integrity():
    manifest = verify_frozen_phase36_manifest(R002_ROOT)
    assert manifest["manifest_sha256"] == FROZEN_MANIFEST_SHA256
    assert manifest["evaluation_budget"]["total_campaign_episodes"] == 1215


def test_track_365_fault_injection_and_oracle_invariance():
    artifacts = verify_phase34_artifacts_and_load(R002_ROOT)
    models_pih = artifacts["models"]["peg_in_hole"]
    res = _run_track_365_fault_injection(R002_ROOT, models_pih)
    assert res["n_scenarios"] == 30
    assert res["passed_scenarios"] == 30
    assert res["g5_oracle_zero_leakage_verified"] is True
    assert res["g5_oracle_invariance_max_abs_diff"] == 0.0


def test_single_pih_smoke_episode_and_mcnemar():
    artifacts = verify_phase34_artifacts_and_load(R002_ROOT)
    wm = artifacts["models"]["peg_in_hole"]["M4_acmm"]["B3"]
    wm.eval()
    clr_spec = build_metrology_clearance_spec(ClearanceMode.UNKNOWN_CLEARANCE, 0.18, 8180)
    rec = _run_single_pih_episode(
        cell_id="smoke_ood",
        track="smoke",
        seed=8180,
        friction_coeff=0.85,
        true_clearance_mm=0.18,
        wm=wm,
        wm_condition="M4_acmm",
        arch="B3",
        clr_spec=clr_spec,
        safety_eval=SafetyEvaluator(task="peg_in_hole"),
        eval_horizon=50,
    )
    assert rec["safety_violation"] is False
    assert rec["dynamic_crush_terminated"] is False
    assert rec["max_force_n"] <= 35.0
    assert _exact_mcnemar_two_sided_p(0, 0) == 1.0
    assert _exact_mcnemar_two_sided_p(10, 0) < 0.01


def test_task2_single_step_compatibility():
    artifacts = verify_phase34_artifacts_and_load(R002_ROOT)
    wm = artifacts["models"]["compliant_prelift"]["M4_acmm"]["B3"]
    wm.eval()
    pe = PlannerEvaluator(task="compliant_prelift", eval_horizon=5, plan_horizon=10, num_candidates=10, cem_iterations=1, seed=42)
    planner, *_ = pe._create_planner_for_model(hybrid_wm=wm, architecture_id="B3", planner_type="auto")
    se = SafetyEvaluator(task="compliant_prelift")
    sf = se.create_safety_filter()
    env, _ = _create_task2_env_for_phase36("ID-Nominal", 8800)
    obs = env.reset()
    s_curr, _ = extract_env_state_and_wrench(obs, "compliant_prelift")
    act, _ = planner.plan(s_curr, pe.reward_fn)
    chosen, _, _ = sf.filter_action(current_state=obs, candidate_action=act.copy(), task="compliant_prelift")
    assert chosen.shape == (len(act),)
