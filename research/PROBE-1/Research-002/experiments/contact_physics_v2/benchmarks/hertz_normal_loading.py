"""
HOROS Contact Physics v2: Hertz Normal Loading Benchmark
Compares numerical normal contact model against classical analytical Hertzian
and flat punch solutions for force and contact area scaling.
"""

import math
import sys
import os

# Add parent directory to path for independent execution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from contact.geometry import SphericalContact, FlatPunchContact
from contact.material import create_silicone_aluminum_pair
from contact.normal_contact import NormalContactModel


def run_hertz_normal_benchmark() -> dict:
    """
    Executes Hertz normal loading validation.
    Returns dictionary with max relative error, R^2, and pass status.
    """
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    E_star = pair.equivalent_youngs_modulus
    R = 0.015  # 15 mm radius sphere

    geom_sphere = SphericalContact(radius=R)
    model_sphere = NormalContactModel(geom_sphere, pair)

    # 1. Spherical Hertzian Sweep
    indentations = [i * 1e-5 for i in range(1, 101)]  # 10 um to 1 mm
    max_force_rel_err = 0.0
    max_radius_rel_err = 0.0

    for delta_n in indentations:
        Fn_num, a_num, kn_num = model_sphere.compute_from_indentation(delta_n)

        # Analytical Hertz
        a_exact = math.sqrt(R * delta_n)
        Fn_exact = (4.0 / 3.0) * E_star * math.sqrt(R) * (delta_n ** 1.5)
        kn_exact = 2.0 * E_star * a_exact

        err_f = abs(Fn_num - Fn_exact) / Fn_exact
        err_a = abs(a_num - a_exact) / a_exact

        max_force_rel_err = max(max_force_rel_err, err_f)
        max_radius_rel_err = max(max_radius_rel_err, err_a)

    # 2. Inversion Accuracy Check
    max_inv_rel_err = 0.0
    test_forces = [0.1, 0.5, 1.0, 5.0, 10.0, 20.0]
    for Fn_target in test_forces:
        delta_inv, a_inv, _ = model_sphere.compute_indentation_from_force(Fn_target)
        Fn_recomputed, _, _ = model_sphere.compute_from_indentation(delta_inv)
        err_inv = abs(Fn_recomputed - Fn_target) / Fn_target
        max_inv_rel_err = max(max_inv_rel_err, err_inv)

    # 3. Flat Punch Linear Scaling Check
    a_punch = 0.005  # 5 mm
    geom_punch = FlatPunchContact(punch_radius=a_punch, corner_radius=0.0)
    model_punch = NormalContactModel(geom_punch, pair)
    max_punch_rel_err = 0.0

    for delta_n in indentations:
        Fn_num, a_num, kn_num = model_punch.compute_from_indentation(delta_n)
        Fn_exact = 2.0 * E_star * a_punch * delta_n
        err_punch = abs(Fn_num - Fn_exact) / Fn_exact
        max_punch_rel_err = max(max_punch_rel_err, err_punch)

    passed = (max_force_rel_err < 1e-6 and
              max_radius_rel_err < 1e-6 and
              max_inv_rel_err < 1e-6 and
              max_punch_rel_err < 1e-6)

    return {
        "benchmark": "Hertz Normal Loading",
        "spherical_max_force_rel_error": max_force_rel_err,
        "spherical_max_radius_rel_error": max_radius_rel_err,
        "inversion_max_rel_error": max_inv_rel_err,
        "flat_punch_max_rel_error": max_punch_rel_err,
        "status": "PASS" if passed else "FAIL"
    }


if __name__ == "__main__":
    res = run_hertz_normal_benchmark()
    print(res)
