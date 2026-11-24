"""
HOROS PROBE-1 — Phase 5 Task 3 (P5-T3)
N-Contact Controller Suite & Allocation Behavior Tests
File: test_p5_t3_controllers.py

Verifies:
1. All 7 controllers execute without error across N=3, 4, 5.
2. Cooperative redistribution: when one contact experiences low margin/high shear,
   the cooperative allocator increases normal force on the threatened contact.
3. Protocol B budget enforcement: total normal force respects the assigned budget.
"""

import os
import sys
import math
import pytest
import numpy as np

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
RESEARCH_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))

for p in (CURRENT_DIR, RESEARCH_DIR):
    if p not in sys.path:
        sys.path.insert(0, p)

from controller_baselines import (
    EqualForcePerContactController,
    FixedTotalForceController,
    RuleBasedCooperativeController,
    PredictiveMarginBalancingController,
    IndependentP5T1AdaptiveController,
    P5T2LearnedCooperativeExtension,
)
from cooperative_n_contact_controller import LearnedUncertaintyAwareNContactController


@pytest.mark.parametrize("n", [3, 4, 5])
def test_all_controllers_step_execution(n):
    """Verify that all 7 controllers step correctly for N=3, 4, and 5."""
    controllers = [
        EqualForcePerContactController(num_contacts=n, nominal_fn=8.0),
        FixedTotalForceController(num_contacts=n, total_force=n * 8.0),
        RuleBasedCooperativeController(num_contacts=n, base_fn=8.0),
        PredictiveMarginBalancingController(num_contacts=n, base_fn=8.0),
        IndependentP5T1AdaptiveController(num_contacts=n, nominal_preloads=[8.0] * n),
        P5T2LearnedCooperativeExtension(num_contacts=n, base_fn=8.0),
        LearnedUncertaintyAwareNContactController(num_contacts=n, base_fn=8.0),
    ]

    mock_obs = {
        "time": 0.050,
        "step": 50,
        "num_contacts": n,
        "contacts": [
            {
                "contact_id": i,
                "force_n": 8.0,
                "force_t": 1.5 if i == 0 else 0.5,
                "disp": 1e-5,
                "slip_velocity": 0.0,
                "is_active": True,
            }
            for i in range(n)
        ],
        "object_tilt": 0.01,
        "object_pos": [0.0, 0.0],
        "total_force_n": float(n * 8.0),
    }

    for ctrl in controllers:
        ctrl.reset([8.0] * n)
        out = ctrl.step(mock_obs)
        assert "cmd_fn" in out
        assert len(out["cmd_fn"]) == n
        for val in out["cmd_fn"]:
            assert 3.0 <= val <= 25.0


def test_cooperative_redistribution_to_threatened_contact():
    """Verify that the learned controller shifts normal force toward a threatened contact."""
    ctrl = LearnedUncertaintyAwareNContactController(num_contacts=3, base_fn=8.0)
    ctrl.reset([8.0, 8.0, 8.0])

    # Contact 0 has high shear ratio (approaching slip: Ft/Fn = 3.2 / 8.0 = 0.40)
    # Contacts 1 and 2 are relaxed (Ft/Fn = 0.4 / 8.0 = 0.05)
    mock_obs = {
        "time": 0.10,
        "step": 100,
        "num_contacts": 3,
        "contacts": [
            {"contact_id": 0, "force_n": 8.0, "force_t": 3.2, "disp": 2e-5, "slip_velocity": 0.0, "is_active": True},
            {"contact_id": 1, "force_n": 8.0, "force_t": 0.4, "disp": 2e-6, "slip_velocity": 0.0, "is_active": True},
            {"contact_id": 2, "force_n": 8.0, "force_t": 0.4, "disp": 2e-6, "slip_velocity": 0.0, "is_active": True},
        ],
        "object_tilt": 0.0,
        "object_pos": [0.0, 0.0],
        "total_force_n": 24.0,
    }

    out = ctrl.step(mock_obs)
    cmd = out["cmd_fn"]

    # Contact 0 must receive higher commanded normal force than relaxed contacts 1 and 2
    assert cmd[0] > cmd[1]
    assert cmd[0] > cmd[2]


def test_protocol_b_force_budget_enforcement():
    """Verify that under Protocol B, total normal force strictly obeys the pre-allocated budget."""
    total_budget = 24.0  # 3 contacts * 8 N
    ctrl = LearnedUncertaintyAwareNContactController(num_contacts=3, base_fn=8.0, total_force_budget=total_budget)
    ctrl.reset([8.0, 8.0, 8.0])

    # Mock high-risk scenario where unconstrained targets would exceed 30 N
    mock_obs = {
        "time": 0.10,
        "step": 100,
        "num_contacts": 3,
        "contacts": [
            {"contact_id": 0, "force_n": 8.0, "force_t": 3.5, "disp": 3e-5, "slip_velocity": 0.001, "is_active": True},
            {"contact_id": 1, "force_n": 8.0, "force_t": 3.0, "disp": 2e-5, "slip_velocity": 0.001, "is_active": True},
            {"contact_id": 2, "force_n": 8.0, "force_t": 2.5, "disp": 2e-5, "slip_velocity": 0.0, "is_active": True},
        ],
        "object_tilt": 0.05,
        "object_pos": [0.0, 0.0],
        "total_force_n": 24.0,
    }

    for _ in range(50):
        out = ctrl.step(mock_obs)

    # Total commanded force must not exceed budget by more than rate limit tolerance
    total_cmd = sum(out["cmd_fn"])
    assert total_cmd <= total_budget + 0.10
