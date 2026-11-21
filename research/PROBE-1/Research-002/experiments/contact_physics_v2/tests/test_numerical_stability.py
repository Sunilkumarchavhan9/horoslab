"""
Unit tests for HOROS Contact Physics v2: Numerical Stability & Edge Cases
"""

import math
import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from contact.geometry import SphericalContact, FlatPunchContact
from contact.material import create_silicone_aluminum_pair
from contact.cattaneo_mindlin import CattaneoMindlinModel
from contact.lugre import LuGreModel
from contact.contact_state import ContactState


def test_zero_normal_force_stability():
    """Verify models handle Fn = 0.0 without division by zero, NaN, or exceptions."""
    pair = create_silicone_aluminum_pair()
    geom = SphericalContact(radius=0.015)
    cm = CattaneoMindlinModel(geom, pair)
    lugre = LuGreModel(pair)

    state = ContactState()
    state.in_contact = False
    state.normal_force = 0.0
    state.contact_radius = 0.0

    # Cattaneo-Mindlin step with zero Fn
    cm.step(state, 1e-4, 0.01)
    assert not math.isnan(state.tangential_force)
    assert state.tangential_force == 0.0
    assert state.stick_radius == 0.0

    # LuGre step with zero Fn
    lugre.step(state, 0.05, 0.01)
    assert not math.isnan(state.tangential_force)
    assert state.tangential_force == 0.0


def test_abrupt_extreme_velocity_stability():
    """Verify LuGre exponential integrator remains stable under extreme velocity jumps."""
    pair = create_silicone_aluminum_pair()
    lugre = LuGreModel(pair)

    state = ContactState()
    state.in_contact = True
    state.normal_force = 10.0
    state.contact_radius = 0.003

    # Step with 10 m/s jump
    lugre.step(state, 10.0, 0.001)
    assert not math.isnan(state.tangential_force)
    assert not math.isinf(state.tangential_force)
    assert not math.isnan(state.bristle_deflection)

    # Immediate reverse jump to -10 m/s
    lugre.step(state, -10.0, 0.001)
    assert not math.isnan(state.tangential_force)
    assert not math.isinf(state.tangential_force)


def test_timestep_robustness():
    """Verify stability across small (10 us) and large (50 ms) timesteps."""
    pair = create_silicone_aluminum_pair()
    geom = SphericalContact(radius=0.015)
    cm = CattaneoMindlinModel(geom, pair)

    for dt in [1e-5, 1e-4, 1e-3, 1e-2, 5e-2]:
        state = ContactState()
        state.in_contact = True
        state.normal_force = 5.0
        state.contact_radius = 0.002

        # Step 5 times with displacement
        for _ in range(5):
            cm.step(state, 1e-6, dt)
            assert not math.isnan(state.tangential_force)
            assert not math.isinf(state.tangential_force)
            assert state.verify_energy_passivity()


def test_composition_strategy_no_double_counting():
    """
    Verify hybrid composed mode does not double-count tangential stiffness
    while capturing micro-damping and post-slip kinetic transitions.
    """
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    geom = SphericalContact(radius=0.015)
    cm = CattaneoMindlinModel(geom, pair)
    lugre = LuGreModel(pair)

    state = ContactState()
    state.in_contact = True
    state.normal_force = 10.0
    state.contact_radius = 0.003

    # In sticking core under zero velocity:
    # Composed force must equal pure Cattaneo-Mindlin force exactly
    a = state.contact_radius
    Fn = state.normal_force
    disp = 1e-6  # small displacement
    Ft_cm, kt_cm, _ = cm.compute_force_monotonic(disp, Fn, a)
    _, stick_ratio = cm.compute_stick_radius(Ft_cm, Fn, a)

    Ft_hybrid = lugre.step_composed_hybrid(state, Ft_cm, v_cmd=0.0, stick_ratio=stick_ratio, dt=0.001)

    assert math.isclose(Ft_hybrid, Ft_cm, rel_tol=1e-9)
