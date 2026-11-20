"""
Unit tests for HOROS Contact Physics v2: Normal Contact Mechanics
"""

import math
import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from contact.geometry import SphericalContact, FlatPunchContact, TruncatedSphericalContact
from contact.material import (
    ElasticMaterial,
    FrictionPair,
    SILICONE_30A,
    ALUMINUM_6061,
    create_silicone_aluminum_pair,
)
from contact.normal_contact import NormalContactModel
from contact.contact_state import ContactState


def test_material_bounds():
    """Verify material parameter validation rejects unphysical values."""
    with pytest.raises(ValueError, match="Young's modulus must be positive"):
        ElasticMaterial("BadModulus", youngs_modulus=-1.0, poissons_ratio=0.3)

    with pytest.raises(ValueError, match="Poisson's ratio must be in"):
        ElasticMaterial("BadPoisson", youngs_modulus=1e6, poissons_ratio=0.55)

    with pytest.raises(ValueError, match="Kinetic friction .* cannot exceed static friction"):
        FrictionPair(SILICONE_30A, ALUMINUM_6061, mu_static=0.4, mu_kinetic=0.6)


def test_hertzian_spherical_scaling():
    """Verify Hertzian force scales strictly as delta_n^(1.5) and contact radius as delta_n^(0.5)."""
    pair = create_silicone_aluminum_pair()
    R = 0.020  # 20 mm
    geom = SphericalContact(radius=R)
    model = NormalContactModel(geom, pair)

    d1 = 1e-4  # 0.1 mm
    d2 = 4e-4  # 0.4 mm (4x indentation)

    F1, a1, kn1 = model.compute_from_indentation(d1)
    F2, a2, kn2 = model.compute_from_indentation(d2)

    # In Hertz theory:
    # F2 / F1 = (d2 / d1)^1.5 = 4^1.5 = 8.0
    # a2 / a1 = (d2 / d1)^0.5 = 4^0.5 = 2.0
    # kn2 / kn1 = 2.0
    assert math.isclose(F2 / F1, 8.0, rel_tol=1e-6)
    assert math.isclose(a2 / a1, 2.0, rel_tol=1e-6)
    assert math.isclose(kn2 / kn1, 2.0, rel_tol=1e-6)


def test_flat_punch_linear_scaling():
    """Verify flat cylindrical punch exhibits constant stiffness and linear force scaling."""
    pair = create_silicone_aluminum_pair()
    a_punch = 0.005  # 5 mm
    geom = FlatPunchContact(punch_radius=a_punch, corner_radius=0.0)
    model = NormalContactModel(geom, pair)

    d1 = 1e-4
    d2 = 3e-4  # 3x indentation

    F1, a1, kn1 = model.compute_from_indentation(d1)
    F2, a2, kn2 = model.compute_from_indentation(d2)

    assert a1 == a_punch
    assert a2 == a_punch
    assert math.isclose(F2 / F1, 3.0, rel_tol=1e-6)
    assert math.isclose(kn1, kn2, rel_tol=1e-6)


def test_zero_and_negative_contact_behavior():
    """Verify zero normal force and zero contact radius when indentation <= 0."""
    pair = create_silicone_aluminum_pair()
    geom = SphericalContact(radius=0.015)
    model = NormalContactModel(geom, pair)

    for d in [0.0, -1e-6, -0.01]:
        Fn, a, kn = model.compute_from_indentation(d)
        assert Fn == 0.0
        assert a == 0.0
        assert kn == 0.0

    state = ContactState()
    model.update_state(state, delta_n=-1e-4, time=0.01, dt=0.01)
    assert not state.in_contact
    assert state.normal_force == 0.0


def test_finite_thickness_elastomeric_layer():
    """Verify thin elastomeric layer exhibits increased stiffness due to substrate confinement."""
    pair = create_silicone_aluminum_pair()
    R = 0.020
    h_thin = 0.002  # 2 mm layer

    geom_hertz = SphericalContact(radius=R)
    geom_layer = TruncatedSphericalContact(sphere_radius=R, pad_thickness=h_thin, flat_radius=0.0)

    model_hertz = NormalContactModel(geom_hertz, pair)
    model_layer = NormalContactModel(geom_layer, pair)

    d = 5e-4  # 0.5 mm
    F_hertz, _, _ = model_hertz.compute_from_indentation(d)
    F_layer, _, _ = model_layer.compute_from_indentation(d)

    # Confinement increases force relative to infinite half-space Hertz
    assert F_layer > F_hertz
