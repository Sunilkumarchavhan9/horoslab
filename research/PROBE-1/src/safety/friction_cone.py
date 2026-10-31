"""
Polyhedral Inner-Approximation of 3D Coulomb Friction Cone.
"""
from __future__ import annotations

import numpy as np
from typing import Tuple, List


class PolyhedralFrictionCone:
    """
    8-Sided Inscribed Regular Polyhedral Approximation of Coulomb Friction Cone.
    Guarantees strict inner-approximation (conservative safety):
    For all f in Polyhedron: ||f_T||_2 <= mu * f_N.
    Geometric conservatism = 1 - cos(pi / 8) approx 7.61%.
    """

    def __init__(self, n_sides: int = 8):
        assert n_sides >= 4 and n_sides % 2 == 0, "n_sides must be an even integer >= 4"
        self.n_sides = n_sides
        self.half_angle = np.pi / n_sides
        self.cos_half_angle = float(np.cos(self.half_angle))  # cos(pi/8) approx 0.9238795
        self.geometric_conservatism = float(1.0 - self.cos_half_angle)  # approx 7.612%

        # 2D facet normals in tangential plane
        self.facet_normals = []
        for j in range(n_sides):
            phi_j = (2.0 * np.pi * j + np.pi) / n_sides
            self.facet_normals.append(np.array([np.cos(phi_j), np.sin(phi_j)], dtype=np.float64))
        self.facet_normals = np.array(self.facet_normals)  # Shape: (n_sides, 2)

    def get_linear_constraints(
        self,
        normal_vector: np.ndarray,
        mu_min: float,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Generate constraint matrix C_cone in R^{n_sides x 3} and normal scaling:
        C_cone * f_c <= 0 where local normal axis is aligned with normal_vector.
        Specifically, for each facet j:
        c_j^T f_T - mu_min * cos(pi/8) * f_N <= 0.
        """
        # Construct orthonormal contact frame [t1, t2, n]
        n = normal_vector / (np.linalg.norm(normal_vector) + 1e-12)
        # Select arbitrary non-collinear vector
        if abs(n[0]) < 0.8:
            t1 = np.cross(n, np.array([1.0, 0.0, 0.0]))
        else:
            t1 = np.cross(n, np.array([0.0, 1.0, 0.0]))
        t1 = t1 / np.linalg.norm(t1)
        t2 = np.cross(n, t1)

        # Contact frame basis R_c = [t1, t2, n]
        R_c = np.column_stack([t1, t2, n])  # Shape: (3, 3)

        # In contact frame, f_local = R_c^T * f_world = [f_t1, f_t2, f_N]^T
        # Facet constraint: [c_j[0], c_j[1], -mu_min * cos(pi/8)] * f_local <= 0
        A_local = np.zeros((self.n_sides, 3), dtype=np.float64)
        for j in range(self.n_sides):
            A_local[j, 0] = self.facet_normals[j, 0]
            A_local[j, 1] = self.facet_normals[j, 1]
            A_local[j, 2] = -mu_min * self.cos_half_angle

        # Transform to world/palm frame: A_world = A_local @ R_c^T
        A_world = A_local @ R_c.T
        return A_world, R_c

    def is_inside_exact_cone(self, f_c: np.ndarray, normal_vector: np.ndarray, mu: float) -> bool:
        """Evaluate exact circular Coulomb cone: ||f_T||_2 <= mu * f_N and f_N >= 0."""
        n = normal_vector / (np.linalg.norm(normal_vector) + 1e-12)
        f_N = float(np.dot(f_c, n))
        if f_N < 0.0:
            return False
        f_T = f_c - f_N * n
        return float(np.linalg.norm(f_T)) <= (mu * f_N + 1e-9)

    def is_inside_polyhedron(
        self, f_c: np.ndarray, normal_vector: np.ndarray, mu_min: float
    ) -> bool:
        """Evaluate 8-sided inscribed polyhedral cone."""
        A_world, _ = self.get_linear_constraints(normal_vector, mu_min)
        # All halfspaces must be <= 0
        residuals = A_world @ f_c
        n = normal_vector / (np.linalg.norm(normal_vector) + 1e-12)
        f_N = float(np.dot(f_c, n))
        return bool(np.all(residuals <= 1e-7)) and (f_N >= 0.0)

    def verify_inner_approximation_property(
        self, normal_vector: np.ndarray, mu: float, num_samples: int = 5000, seed: int = 42
    ) -> Tuple[bool, float]:
        """
        Numerically verifies that ANY point satisfying the polyhedral constraints
        STRICTLY satisfies the exact circular cone (i.e. Polyhedron subset of Cone).
        Returns:
            strictly_inner: True if zero violations across all samples.
            max_circular_ratio: Maximum ||f_T|| / (mu * f_N) observed inside polyhedron (must be <= 1.0).
        """
        rng = np.random.default_rng(seed)
        A_world, R_c = self.get_linear_constraints(normal_vector, mu)

        n = normal_vector / (np.linalg.norm(normal_vector) + 1e-12)
        max_ratio = 0.0
        violations = 0

        for _ in range(num_samples):
            # Sample f_N uniformly in [1.0, 20.0] N
            f_N = rng.uniform(1.0, 20.0)
            # Sample random tangential angle and radius up to circumscribed bound
            angle = rng.uniform(0.0, 2.0 * np.pi)
            radius = rng.uniform(0.0, 1.2 * mu * f_N)
            f_t1 = radius * np.cos(angle)
            f_t2 = radius * np.sin(angle)

            f_local = np.array([f_t1, f_t2, f_N], dtype=np.float64)
            f_world = R_c @ f_local

            # Check if inside polyhedron
            in_poly = bool(np.all(A_world @ f_world <= 1e-8))

            if in_poly:
                # Must be strictly inside circular cone
                ratio = np.sqrt(f_t1**2 + f_t2**2) / (mu * f_N)
                if ratio > max_ratio:
                    max_ratio = ratio
                if ratio > 1.0 + 1e-6:
                    violations += 1

        strictly_inner = (violations == 0) and (max_ratio <= 1.0 + 1e-6)
        return strictly_inner, float(max_ratio)
