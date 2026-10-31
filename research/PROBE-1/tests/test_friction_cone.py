"""
Unit tests for Polyhedral Friction Cone and Inner Approximation Proof.
"""
import pytest
import numpy as np
import sys
import os

src_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../src"))
root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if src_path not in sys.path:
    sys.path.insert(0, src_path)
if root_path not in sys.path:
    sys.path.insert(0, root_path)

from safety.friction_cone import PolyhedralFrictionCone


def test_polyhedral_geometry_and_conservatism():
    cone = PolyhedralFrictionCone(n_sides=8)
    assert cone.n_sides == 8
    # Exact geometric conservatism = 1 - cos(pi/8) = 1 - 0.9238795325... = 0.07612046... (7.61%)
    expected_conservatism = 1.0 - np.cos(np.pi / 8.0)
    assert np.isclose(cone.geometric_conservatism, expected_conservatism, atol=1e-6)
    assert 0.076 < cone.geometric_conservatism < 0.077


def test_inner_approximation_randomized_proof():
    cone = PolyhedralFrictionCone(n_sides=8)

    # Test across multiple surface orientations and friction coefficients
    test_normals = [
        np.array([0.0, 0.0, 1.0]),
        np.array([0.0, 1.0, 0.0]),
        np.array([1.0, 1.0, 1.0]) / np.sqrt(3),
        np.array([-0.3, 0.8, 0.5]) / np.linalg.norm([-0.3, 0.8, 0.5]),
    ]
    test_mus = [0.15, 0.35, 0.60, 0.95]

    for n in test_normals:
        for mu in test_mus:
            strictly_inner, max_ratio = cone.verify_inner_approximation_property(
                normal_vector=n, mu=mu, num_samples=3000, seed=42
            )
            assert strictly_inner, f"Violation of inner approximation for n={n}, mu={mu}"
            assert max_ratio <= 1.000001, f"Max ratio {max_ratio} exceeded 1.0"


def test_linear_constraints_shape():
    cone = PolyhedralFrictionCone(n_sides=8)
    normal = np.array([0.0, 0.0, 1.0])
    A_world, R_c = cone.get_linear_constraints(normal, mu_min=0.5)
    assert A_world.shape == (8, 3)
    assert R_c.shape == (3, 3)
    # Check orthogonality of R_c
    assert np.allclose(R_c.T @ R_c, np.eye(3), atol=1e-6)


def test_polyhedron_rejection_of_unsafe_tangential_loads():
    cone = PolyhedralFrictionCone(n_sides=8)
    normal = np.array([0.0, 0.0, 1.0])
    mu = 0.5
    f_N = 10.0

    # Inside both cone and polyhedron: small shear force (||f_T|| = 2.0 < 0.9238 * 5.0 = 4.619)
    f_safe = np.array([2.0, 0.0, f_N])
    assert cone.is_inside_exact_cone(f_safe, normal, mu)
    assert cone.is_inside_polyhedron(f_safe, normal, mu)

    # Outside circular cone: large shear force (||f_T|| = 6.0 > 5.0)
    f_unsafe = np.array([6.0, 0.0, f_N])
    assert not cone.is_inside_exact_cone(f_unsafe, normal, mu)
    assert not cone.is_inside_polyhedron(f_unsafe, normal, mu)

    # In the conservative boundary margin along the facet midpoint (angle pi/8):
    # Radius = 4.8 N is inside circular cone (4.8 <= 5.0 N), but outside inscribed 8-gon facet (4.8 > 4.619 N)
    phi_mid = np.pi / 8.0
    f_margin = np.array([4.8 * np.cos(phi_mid), 4.8 * np.sin(phi_mid), f_N])
    assert cone.is_inside_exact_cone(f_margin, normal, mu)
    assert not cone.is_inside_polyhedron(f_margin, normal, mu), "Inscribed polygon should conservatively reject margin point"
