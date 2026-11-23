"""
Unit tests for HOROS Contact Physics v2: Tangential Partial-Slip Contact
"""

import math
import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from contact.geometry import SphericalContact, FlatPunchContact
from contact.material import create_silicone_aluminum_pair
from contact.cattaneo_mindlin import CattaneoMindlinModel
from contact.contact_state import ContactState


def test_initial_tangential_stiffness():
    """Verify Mindlin initial stiffness kt_0 = 8 * G* * a."""
    pair = create_silicone_aluminum_pair()
    geom = SphericalContact(radius=0.015)
    model = CattaneoMindlinModel(geom, pair)

    a = 0.003
    kt_0 = model.compute_initial_tangential_stiffness(a)
    expected = 8.0 * pair.equivalent_shear_modulus * a
    assert math.isclose(kt_0, expected, rel_tol=1e-9)


def test_monotonic_compliance_softening():
    """Verify tangent stiffness kt(Ft) decreases monotonically as Ft -> mu_s * Fn for sphere."""
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    geom = SphericalContact(radius=0.015)
    model = CattaneoMindlinModel(geom, pair)

    Fn = 10.0
    a = 0.003
    limit = pair.mu_static * Fn

    kt_values = []
    ratios = [0.0, 0.2, 0.4, 0.6, 0.8, 0.95, 0.99]
    for r in ratios:
        kt = model.compute_tangent_stiffness(r * limit, Fn, a)
        kt_values.append(kt)

    # Check strictly decreasing
    for i in range(len(kt_values) - 1):
        assert kt_values[i] > kt_values[i + 1]

    # Verify at 99% load capacity, stiffness has degraded by ~78.5%
    kt_0 = kt_values[0]
    kt_99 = kt_values[-1]
    expected_ratio = (1.0 - 0.99) ** (1.0 / 3.0)  # 0.01^(1/3) ~ 0.2154
    assert math.isclose(kt_99 / kt_0, expected_ratio, rel_tol=1e-4)


def test_geometry_dependent_softening_distinction():
    """Verify that flat punch does NOT exhibit 1/3-power softening, keeping geometry laws distinct."""
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    a = 0.003
    Fn = 10.0
    limit = pair.mu_static * Fn

    geom_sphere = SphericalContact(radius=0.015)
    geom_punch = FlatPunchContact(punch_radius=a, corner_radius=0.0)

    model_sphere = CattaneoMindlinModel(geom_sphere, pair)
    model_punch = CattaneoMindlinModel(geom_punch, pair)

    kt_sphere_80 = model_sphere.compute_tangent_stiffness(0.80 * limit, Fn, a)
    kt_punch_80 = model_punch.compute_tangent_stiffness(0.80 * limit, Fn, a)

    kt_0 = model_punch.compute_initial_tangential_stiffness(a)

    # Sphere softens: kt_sphere < kt_0
    assert kt_sphere_80 < kt_0
    # Flat punch does not soften prior to slip: kt_punch == kt_0
    assert math.isclose(kt_punch_80, kt_0, rel_tol=1e-9)


def test_gross_sliding_transition_and_kinetic_drop():
    """Verify state transitions to gross sliding with kinetic friction when displacement exceeds limit."""
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    geom = SphericalContact(radius=0.015)
    model = CattaneoMindlinModel(geom, pair)

    Fn = 10.0
    a = 0.003
    limit_static = pair.mu_static * Fn    # 6.0 N
    limit_kinetic = pair.mu_kinetic * Fn  # 5.0 N

    kt_0 = model.compute_initial_tangential_stiffness(a)
    delta_t_max = (1.5 * limit_static) / kt_0

    # 1. Below limit: in partial slip
    Ft_sub, kt_sub, is_gross_sub = model.compute_force_monotonic(0.90 * delta_t_max, Fn, a)
    assert not is_gross_sub
    assert abs(Ft_sub) < limit_static

    # 2. Beyond limit: in gross sliding
    Ft_sup, kt_sup, is_gross_sup = model.compute_force_monotonic(1.20 * delta_t_max, Fn, a)
    assert is_gross_sup
    assert math.isclose(abs(Ft_sup), limit_kinetic, rel_tol=1e-6)
    assert kt_sup == 0.0
