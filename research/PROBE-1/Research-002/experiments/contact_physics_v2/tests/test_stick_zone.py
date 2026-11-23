"""
Unit tests for HOROS Contact Physics v2: Stick-Zone Evolution & Annular Traction
"""

import math
import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from contact.geometry import SphericalContact, FlatPunchContact
from contact.material import create_silicone_aluminum_pair
from contact.cattaneo_mindlin import CattaneoMindlinModel


def test_stick_core_radius_scaling():
    """Verify stick core radius c follows (c/a) = (1 - Ft/(mu*Fn))^(1/3) for sphere."""
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    geom = SphericalContact(radius=0.015)
    model = CattaneoMindlinModel(geom, pair)

    Fn = 10.0
    a = 0.003
    limit = pair.mu_static * Fn

    # Test load ratios
    test_cases = [
        (0.0, 1.0),
        (0.5, 0.5 ** (1.0 / 3.0)),      # ~ 0.7937
        (0.875, 0.125 ** (1.0 / 3.0)),  # 0.5000 exactly
        (0.999, 0.001 ** (1.0 / 3.0)),  # 0.1000 exactly
    ]

    for ratio, expected_ratio in test_cases:
        Ft = ratio * limit
        c, stick_ratio = model.compute_stick_radius(Ft, Fn, a)
        assert math.isclose(stick_ratio, expected_ratio, rel_tol=1e-5)
        assert math.isclose(c, a * expected_ratio, rel_tol=1e-5)


def test_traction_stick_slip_zones():
    """
    Verify radial traction q(r) matches Cattaneo-Mindlin distribution:
    - Inner stick core (r <= c): q(r) < mu * p(r)
    - Outer annular slip region (c < r <= a): q(r) == mu * p(r)
    """
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    geom = SphericalContact(radius=0.015)
    model = CattaneoMindlinModel(geom, pair)

    Fn = 10.0
    a = 0.003
    limit = pair.mu_static * Fn
    Ft = 0.50 * limit

    c, _ = model.compute_stick_radius(Ft, Fn, a)
    assert 0.0 < c < a

    # 1. Inside stick core: r = 0.5 * c
    r_stick = 0.5 * c
    q_stick = model.compute_traction_distribution(r_stick, Ft, Fn, a)
    # Local coulomb limit mu * p(r)
    p0 = 1.5 * Fn / (math.pi * (a ** 2))
    p_stick = p0 * math.sqrt(1.0 - (r_stick / a) ** 2)
    coulomb_limit_stick = pair.mu_static * p_stick

    assert q_stick < coulomb_limit_stick

    # 2. Inside slip annulus: r = 0.5 * (c + a)
    r_slip = 0.5 * (c + a)
    q_slip = model.compute_traction_distribution(r_slip, Ft, Fn, a)
    p_slip = p0 * math.sqrt(1.0 - (r_slip / a) ** 2)
    coulomb_limit_slip = pair.mu_static * p_slip

    assert math.isclose(q_slip, coulomb_limit_slip, rel_tol=1e-6)
