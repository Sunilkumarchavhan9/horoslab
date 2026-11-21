"""
Unit tests for HOROS Contact Physics v2: Energy Passivity & Thermodynamic Invariants
"""

import math
import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from contact.geometry import SphericalContact
from contact.material import create_silicone_aluminum_pair
from contact.cattaneo_mindlin import CattaneoMindlinModel
from contact.lugre import LuGreModel
from contact.contact_state import ContactState


def test_monotonic_loading_energy_passivity():
    """Verify that under monotonic tangential displacement, dissipated energy is strictly >= 0."""
    pair = create_silicone_aluminum_pair()
    geom = SphericalContact(radius=0.015)
    model = CattaneoMindlinModel(geom, pair)

    state = ContactState()
    state.in_contact = True
    state.normal_force = 10.0
    state.contact_radius = 0.003

    dt = 0.001
    d_disp = 1e-6  # 1 um per step

    for _ in range(200):
        model.step(state, d_disp, dt)
        assert state.cumulative_dissipated_energy >= -1e-12
        assert state.stored_elastic_energy >= -1e-12
        assert state.verify_energy_passivity()


def test_closed_hysteresis_dissipation_positive():
    """Verify that a complete loading-unloading-reloading cycle dissipates positive net energy."""
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    geom = SphericalContact(radius=0.015)
    model = CattaneoMindlinModel(geom, pair)

    state = ContactState()
    state.in_contact = True
    state.normal_force = 10.0
    state.contact_radius = 0.003
    limit = pair.mu_static * state.normal_force

    kt_0 = model.compute_initial_tangential_stiffness(state.contact_radius)
    disp_peak = model.compute_displacement_monotonic(0.60 * limit, state.normal_force, state.contact_radius)

    dt = 0.001
    N = 100
    d_step = disp_peak / N

    # Loading to +disp_peak
    for _ in range(N):
        model.step(state, +d_step, dt)
    E_diss_after_loading = state.cumulative_dissipated_energy

    # Unloading to -disp_peak
    for _ in range(2 * N):
        model.step(state, -d_step, dt)
    E_diss_after_reversal = state.cumulative_dissipated_energy

    # Reloading back to +disp_peak
    for _ in range(2 * N):
        model.step(state, +d_step, dt)
    E_diss_final = state.cumulative_dissipated_energy

    # Hysteresis loop must continuously accumulate positive dissipated frictional work
    assert E_diss_final > E_diss_after_reversal > E_diss_after_loading >= 0.0
    assert state.verify_energy_passivity()


def test_lugre_energy_passivity():
    """Verify that standalone LuGre dynamic friction satisfies energy passivity under oscillation."""
    pair = create_silicone_aluminum_pair()
    lugre = LuGreModel(pair)

    state = ContactState()
    state.in_contact = True
    state.normal_force = 10.0
    state.contact_radius = 0.003

    dt = 0.001
    for t_step in range(500):
        t = t_step * dt
        v_osc = 0.01 * math.sin(2.0 * math.pi * 10.0 * t)  # 10 Hz velocity oscillation
        lugre.step(state, v_osc, dt)
        assert state.verify_energy_passivity()
        assert state.cumulative_dissipated_energy >= 0.0
