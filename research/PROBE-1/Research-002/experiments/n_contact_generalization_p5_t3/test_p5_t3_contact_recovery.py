"""
HOROS PROBE-1 — Phase 5 Task 3 (P5-T3)
N-Contact Contact Loss and Recovery Tests
File: test_p5_t3_contact_recovery.py

Verifies:
1. Contact loss event handling: when contact k drops, environment does not crash or emit NaN.
2. Learned controller detects loss and redistributes normal load to surviving contacts.
3. Multi-contact recovery: re-establishing contact ramps force back up cleanly.
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

from contact_topology import ContactTopology
from n_contact_sim_env import NContactGraspEnvP5T3
from cooperative_n_contact_controller import LearnedUncertaintyAwareNContactController


def test_contact_loss_in_simulation():
    """Verify that contact loss is simulated cleanly without NaN or infinite values."""
    topo = ContactTopology.create_symmetric_radial(num_contacts=4, object_radius=0.040, object_mass=0.50)
    env = NContactGraspEnvP5T3(topology=topo, seed=4700040)

    # Schedule contact loss on contact 1 at t = 50 ms
    loss_events = [{"contact_id": 1, "t_loss": 0.050, "t_recov": None}]
    obs = env.reset(contact_loss_events=loss_events)

    for step in range(100):
        obs, done, info = env.step(cmd_fn_list=[8.0] * 4)

    # Contact 1 should be inactive and zero force
    assert not topo.contacts[1].is_active
    assert info["fn_list"][1] == 0.0
    assert info["ft_list"][1] == 0.0
    # Other 3 contacts remain active
    assert info["active_contacts_count"] == 3
    assert not math.isnan(info["max_disp_m"])
    assert not math.isnan(info["max_tilt_rad"])


def test_learned_controller_load_redistribution_on_contact_loss():
    """Verify that the learned controller redistributes force to surviving contacts upon contact loss."""
    ctrl = LearnedUncertaintyAwareNContactController(num_contacts=4, base_fn=8.0)
    ctrl.reset([8.0] * 4)

    # Mock obs where contact 2 has dropped (force_n = 0, is_active = False)
    mock_obs = {
        "time": 0.060,
        "step": 60,
        "num_contacts": 4,
        "contacts": [
            {"contact_id": 0, "force_n": 8.0, "force_t": 1.0, "disp": 1e-5, "slip_velocity": 0.0, "is_active": True},
            {"contact_id": 1, "force_n": 8.0, "force_t": 1.0, "disp": 1e-5, "slip_velocity": 0.0, "is_active": True},
            {"contact_id": 2, "force_n": 0.0, "force_t": 0.0, "disp": 0.0, "slip_velocity": 0.0, "is_active": False},
            {"contact_id": 3, "force_n": 8.0, "force_t": 1.0, "disp": 1e-5, "slip_velocity": 0.0, "is_active": True},
        ],
        "object_tilt": 0.0,
        "object_pos": [0.0, 0.0],
        "total_force_n": 24.0,
    }

    out = ctrl.step(mock_obs)
    cmd = out["cmd_fn"]

    # Contact 2 should be commanded 0
    assert cmd[2] == 0.0
    # Surviving contacts 0, 1, 3 should see target increase above 8.0 (rate-limited step: > 8.0)
    for idx in (0, 1, 3):
        assert cmd[idx] >= 8.05, f"Surviving contact {idx} did not receive redistributed load: {cmd[idx]}"


def test_contact_recovery_cycle():
    """Verify that contact recovery re-engages the finger cleanly."""
    topo = ContactTopology.create_symmetric_radial(num_contacts=3, object_radius=0.040, object_mass=0.50)
    env = NContactGraspEnvP5T3(topology=topo, seed=4700050)

    # Contact 0 drops at 30 ms and recovers at 70 ms
    loss_events = [{"contact_id": 0, "t_loss": 0.030, "t_recov": 0.070}]
    env.reset(contact_loss_events=loss_events)

    for _ in range(120):
        obs, done, info = env.step(cmd_fn_list=[8.0] * 3)

    # After 120 ms, contact 0 should be re-engaged and active
    assert topo.contacts[0].is_active
    assert info["active_contacts_count"] == 3
    assert info["fn_list"][0] >= 3.0
