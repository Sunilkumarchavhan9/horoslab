"""
HOROS Contact Physics v2: Stick Zone Evolution & Traction Benchmark
Validates radial tangential traction field q(r) integration against applied shear force Ft.
"""

import math
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from contact.geometry import SphericalContact
from contact.material import create_silicone_aluminum_pair
from contact.cattaneo_mindlin import CattaneoMindlinModel


def run_stick_zone_evolution_benchmark() -> dict:
    """
    Executes numerical integration of surface traction field q(r):
    Ft_integrated = 2 * pi * integral_0^a q(r) * r dr
    and compares to applied tangential force Ft.
    """
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    R = 0.015
    geom_sphere = SphericalContact(radius=R)
    cm_model = CattaneoMindlinModel(geom_sphere, pair)

    Fn = 10.0
    a = 0.003
    limit = pair.mu_static * Fn  # 6.0 N

    test_ratios = [0.2, 0.4, 0.6, 0.8, 0.95]
    max_integral_rel_error = 0.0

    # Numerical integration using trapezoidal rule with 10,000 radial samples
    N_radial = 10000
    dr = a / N_radial

    for ratio in test_ratios:
        Ft_target = ratio * limit
        c, _ = cm_model.compute_stick_radius(Ft_target, Fn, a)

        integral = 0.0
        for i in range(N_radial):
            r1 = i * dr
            r2 = (i + 1) * dr
            r_mid = 0.5 * (r1 + r2)

            q_val = cm_model.compute_traction_distribution(r_mid, Ft_target, Fn, a)
            integral += 2.0 * math.pi * q_val * r_mid * dr

        rel_err = abs(integral - Ft_target) / Ft_target
        max_integral_rel_error = max(max_integral_rel_error, rel_err)

    passed = (max_integral_rel_error < 0.005)  # Within 0.5% for 10k radial discrete points

    return {
        "benchmark": "Traction Field Integration",
        "max_traction_integral_rel_error": max_integral_rel_error,
        "sample_count": len(test_ratios),
        "status": "PASS" if passed else "FAIL"
    }


if __name__ == "__main__":
    res = run_stick_zone_evolution_benchmark()
    print(res)
