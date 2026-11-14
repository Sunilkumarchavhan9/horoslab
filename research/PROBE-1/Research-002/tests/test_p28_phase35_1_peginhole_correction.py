"""
HOROS PROBE-1 — Research-002: Phase 3.5.1 Peg-in-Hole Planner Reward & CEM Correction Tests

Covers:
1. Canonical Peg-in-Hole planner reward monotonicity toward z = -50.0 mm, upper-bound deterrence
   beyond z = -50.0 mm, seating bonus gating on wrench load, lateral/tilt alignment penalties,
   wrench/effort regularization, and PlannerEvaluator / MiningEvaluator consistency without
   altering Task 2 (compliant_prelift) reward behavior.
2. Vector init_std & seed propagation across CEMPlanner and UncertaintyPenalizedCEM while
   preserving exact backward-compatible 0.5 scalar default for Task 2.
3. Phase 3.5 archive immutability (original 4 JSONs + closure addendum files) and integrity of
   Phase 3.5.1 150-episode C13-C18 correction outputs.
"""

from __future__ import annotations

import hashlib
import json
import os
import sys
import numpy as np
import pytest
import torch

R002_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if R002_ROOT not in sys.path:
    sys.path.insert(0, R002_ROOT)
SRC_DIR = os.path.join(R002_ROOT, "src")
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from src.integrated.planner_evaluator import PlannerEvaluator, compute_peg_in_hole_planner_reward
from src.mining.mining_evaluator import MiningEvaluator
from src.planners.cem_planner import CEMPlanner
from src.planners.uncertainty_penalized_cem import UncertaintyPenalizedCEM
from src.integrated.phase35_closure_addendum import verify_archived_phase35_immutability


def _make_pih_state(
    z_mm: float,
    x_mm: float = 0.0,
    y_mm: float = 0.0,
    rx_deg: float = 0.0,
    ry_deg: float = 0.0,
    wrench_z_n: float = 0.0,
) -> np.ndarray:
    s = np.zeros(15, dtype=np.float64)
    s[0] = x_mm
    s[1] = y_mm
    s[2] = z_mm
    s[6] = rx_deg
    s[7] = ry_deg
    s[11] = wrench_z_n
    return s


def test_01_reward_monotonic_to_seating_and_bounded_beyond():
    """
    3.5.1-A: Verifies exact physical reward values at key depths z = +15, 0, -2, -25, -50, -60, -80 mm,
    strict monotonicity into the hole, capped progress beyond -50 mm, alignment/wrench deterrence,
    PlannerEvaluator == MiningEvaluator wiring, and untouched Task 2 compliant_prelift reward.
    """
    a_zero = np.zeros(6, dtype=np.float64)
    checkpoints = [
        (15.0, -30.0),
        (0.0, 0.0),
        (-2.0, 10.0),
        (-25.0, 125.0),
        (-50.0, 300.0),
        (-60.0, 270.0),
        (-80.0, 210.0),
    ]
    vals = []
    for z_mm, expected in checkpoints:
        r = compute_peg_in_hole_planner_reward(_make_pih_state(z_mm), a_zero)
        assert abs(r - expected) < 1e-6, f"At z={z_mm}: got {r}, expected {expected}"
        vals.append(r)

    # Monotonic increase from +15 -> 0 -> -2 -> -25 -> -50 mm
    assert vals[0] < vals[1] < vals[2] < vals[3] < vals[4]
    # Over-penetration beyond -50 mm must decrease reward (peak at seating z = -50 mm)
    assert vals[4] > vals[5] > vals[6]

    # Lateral & tilt misalignment penalties at z = -25 mm
    r_aligned = compute_peg_in_hole_planner_reward(_make_pih_state(-25.0), a_zero)
    r_lat_2mm = compute_peg_in_hole_planner_reward(_make_pih_state(-25.0, x_mm=2.0), a_zero)
    r_tilt_2deg = compute_peg_in_hole_planner_reward(_make_pih_state(-25.0, rx_deg=2.0), a_zero)
    assert r_lat_2mm == pytest.approx(r_aligned - 16.0, abs=1e-6)
    assert r_tilt_2deg == pytest.approx(r_aligned - 8.0, abs=1e-6)

    # Wrench penalty and seating bonus gating (>= 15 N disables seating bonus; > 30 N adds excess load penalty)
    r_seat_clean = compute_peg_in_hole_planner_reward(_make_pih_state(-50.0, wrench_z_n=5.0), a_zero)
    r_seat_wedged = compute_peg_in_hole_planner_reward(_make_pih_state(-50.0, wrench_z_n=20.0), a_zero)
    r_heavy_wedge = compute_peg_in_hole_planner_reward(_make_pih_state(-25.0, wrench_z_n=45.0), a_zero)
    assert r_seat_clean == pytest.approx(300.0 - 0.5, abs=1e-6)
    assert r_seat_wedged == pytest.approx(250.0 - 2.0, abs=1e-6)
    assert r_heavy_wedge < r_aligned - 49.0

    # Smooth lateral/tilt action regularization preserves pure z action
    r_pure_z = compute_peg_in_hole_planner_reward(
        _make_pih_state(-10.0), np.array([0.0, 0.0, -4.0, 0.0, 0.0, 0.0])
    )
    r_lateral_jitter = compute_peg_in_hole_planner_reward(
        _make_pih_state(-10.0), np.array([2.0, 2.0, -4.0, 1.0, 1.0, 0.0])
    )
    assert r_pure_z == pytest.approx(50.0, abs=1e-6)
    assert r_lateral_jitter < r_pure_z - 7.0

    # Canonical wiring consistency between PlannerEvaluator and MiningEvaluator
    pe = PlannerEvaluator(task="peg_in_hole", num_candidates=4, cem_iterations=1)
    me = MiningEvaluator(task="peg_in_hole")
    probe_s = _make_pih_state(-12.5, x_mm=0.4, rx_deg=0.5, wrench_z_n=4.0)
    probe_a = np.array([0.5, -0.2, -3.5, 0.1, 0.0, 0.0])
    assert pe.reward_fn(probe_s, probe_a) == pytest.approx(me.reward_fn(probe_s, probe_a), abs=1e-8)

    # Task 2 compliant_prelift remains untouched and usable
    pe_t2 = PlannerEvaluator(task="compliant_prelift", num_candidates=4, cem_iterations=1)
    s_t2 = np.zeros(23, dtype=np.float64)
    s_t2[2] = 0.030  # 30 mm above lift height
    assert isinstance(pe_t2.reward_fn(s_t2, np.zeros(5)), float)


class _DummyLinearWorldModel:
    """Minimal mock hybrid world model implementing predict_with_uncertainty for CEM tests."""

    def __init__(self, state_dim: int = 15, action_dim: int = 6):
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.training = False

    def eval(self):
        self.training = False

    def predict_with_uncertainty(self, curr_states: torch.Tensor, actions: torch.Tensor):
        nxt = curr_states.clone()
        nxt[:, :3] = nxt[:, :3] + actions[:, :3]
        epi = torch.zeros_like(nxt)
        alea = torch.zeros_like(nxt)
        return nxt, epi, alea


def test_02_cem_vector_init_std_backward_compatible_with_task2():
    """
    Verifies default scalar init_std=0.5 preservation for Task 2 and vector init_std / seed
    support on both CEMPlanner (B1) and UncertaintyPenalizedCEM (B2/B3).
    """
    bounds = (np.array([-5.0, -5.0, -5.0, -2.0, -2.0, -2.0]), np.array([5.0, 5.0, 5.0, 2.0, 2.0, 2.0]))
    wm = _DummyLinearWorldModel()
    s0 = _make_pih_state(15.0)

    cem_default = CEMPlanner(wm, action_dim=6, action_bounds=bounds, horizon=5, num_samples=16, num_iterations=2)
    assert cem_default.init_std is None
    up_default = UncertaintyPenalizedCEM(
        wm, action_dim=6, action_bounds=bounds, horizon=5, num_samples=16, num_iterations=2
    )
    assert up_default.init_std is None

    vec_std = [0.5, 0.5, 1.5, 0.3, 0.3, 0.1]
    cem_vec = CEMPlanner(
        wm, action_dim=6, action_bounds=bounds, horizon=5, num_samples=32, num_iterations=3, init_std=vec_std, seed=7
    )
    act1, info1 = cem_vec.plan(s0, compute_peg_in_hole_planner_reward)
    assert act1[2] < -1.0, f"Expected downward z action under corrected reward, got {act1}"
    assert "best_trajectory" in info1 and info1["best_trajectory"].shape == (5, 6)

    up_vec = UncertaintyPenalizedCEM(
        wm, action_dim=6, action_bounds=bounds, horizon=5, num_samples=32, num_iterations=3, init_std=vec_std, seed=7
    )
    act2, info2 = up_vec.plan(s0, compute_peg_in_hole_planner_reward, warm_start_mean=info1["best_trajectory"])
    assert act2[2] < -1.0, f"Expected downward z action in UncertaintyPenalizedCEM, got {act2}"
    assert "best_trajectory" in info2 and info2["best_trajectory"].shape == (5, 6)


def test_03_peginhole_351_artifacts_and_archive_immutability():
    """
    3.5.1-C: Verifies original Phase 3.5 570-ep JSON archives + addendum files remain untouched,
    and validates the Phase 3.5.1 C13-C18 150-episode report artifact if generated.
    """
    eval_dir = os.path.join(R002_ROOT, "experiments", "phase3_5_evaluation")
    verify_archived_phase35_immutability(eval_dir)

    addendum_json = os.path.join(eval_dir, "phase35_closure_addendum.json")
    assert os.path.exists(addendum_json)

    corr_json = os.path.join(eval_dir, "phase35_1_peginhole_correction.json")
    corr_md = os.path.join(eval_dir, "phase35_1_peginhole_correction_report.md")
    if not os.path.exists(corr_json):
        pytest.skip("Phase 3.5.1 C13-C18 correction artifact not yet generated")

    with open(corr_json, "r", encoding="utf-8") as f:
        doc = json.load(f)

    assert os.path.exists(corr_md), "Markdown report for Phase 3.5.1 must accompany JSON artifact"
    assert doc["episode_accounting"]["total_re_evaluated_episodes"] == 150
    assert doc["episode_accounting"]["eval_horizon_steps"] == 50
    assert doc["episode_accounting"]["seeds"] == list(range(6200, 6225))
    assert len(doc["cells"]) == 6
    for cid in ("C13", "C14", "C15", "C16", "C17", "C18"):
        cell = doc["cells"][cid]
        assert cell["num_episodes"] == 25
        assert cell["seeds"] == list(range(6200, 6225))
        assert cell["task"] == "peg_in_hole"
        assert cell["eval_horizon_steps"] == 50

    # Verify exact nonzero p-values with scientific strings across all comparisons
    for comp in doc["statistical_comparisons"]["within_phase351_m4_vs_m0_paired"]:
        p_key = "mcnemar_exact_p" if "mcnemar_exact_p" in comp else "wilcoxon_p"
        assert float(comp[p_key]) > 0.0
        assert isinstance(comp[f"{p_key}_sci"], str) and "e" in comp[f"{p_key}_sci"]
    for comp in doc["statistical_comparisons"]["before_vs_after_phase35_paired"]:
        p_key = "mcnemar_exact_p" if "mcnemar_exact_p" in comp else "wilcoxon_p"
        assert float(comp[p_key]) > 0.0
        assert isinstance(comp[f"{p_key}_sci"], str) and "e" in comp[f"{p_key}_sci"]

    # Confirm immutability sha256 receipt of original archives recorded cleanly
    for fname, sha in doc["archive_immutability_sha256s"].items():
        actual = hashlib.sha256(open(os.path.join(eval_dir, fname), "rb").read()).hexdigest()
        assert actual == sha
