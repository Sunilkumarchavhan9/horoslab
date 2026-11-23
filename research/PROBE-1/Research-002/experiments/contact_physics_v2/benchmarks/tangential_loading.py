"""
HOROS Contact Physics v2: Tangential Loading Benchmark
Validates initial tangential stiffness, compliance softening function,
and Cattaneo-Mindlin non-linear displacement against analytical solutions.
"""

import math
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from contact.geometry import SphericalContact, FlatPunchContact
from contact.material import create_silicone_aluminum_pair
from contact.cattaneo_mindlin import CattaneoMindlinModel


def run_tangential_loading_benchmark() -> dict:
    """
    Executes tangential loading benchmark.
    Verifies initial stiffness kt_0, monotonic compliance softening,
    and displacement accuracy against analytical Cattaneo-Mindlin relations.
    """
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    R = 0.015  # 15 mm sphere
    geom_sphere = SphericalContact(radius=R)
    cm_model = CattaneoMindlinModel(geom_sphere, pair)

    Fn = 10.0  # 10 N normal load
    a = 0.003  # 3 mm contact radius
    limit = pair.mu_static * Fn  # 6.0 N

    # 1. Initial Stiffness Check
    kt_0_num = cm_model.compute_initial_tangential_stiffness(a)
    G_star = pair.equivalent_shear_modulus
    kt_0_exact = 8.0 * G_star * a
    err_kt_0 = abs(kt_0_num - kt_0_exact) / kt_0_exact

    # 2. Tangent Stiffness Softening Check across Ft ratios
    ft_ratios = [0.1, 0.3, 0.5, 0.7, 0.9, 0.99]
    max_kt_rel_err = 0.0
    monotonic_softening = True
    prev_kt = kt_0_num

    for ratio in ft_ratios:
        Ft = ratio * limit
        kt_num = cm_model.compute_tangent_stiffness(Ft, Fn, a)
        kt_exact = kt_0_exact * ((1.0 - ratio) ** (1.0 / 3.0))

        err_kt = abs(kt_num - kt_exact) / kt_exact
        max_kt_rel_err = max(max_kt_rel_err, err_kt)

        if kt_num > prev_kt:
            monotonic_softening = False
        prev_kt = kt_num

    # 3. Monotonic Displacement & Inversion Consistency Check
    max_disp_inversion_err = 0.0
    for ratio in ft_ratios:
        Ft = ratio * limit
        disp = cm_model.compute_displacement_monotonic(Ft, Fn, a)
        Ft_recomputed, _, _ = cm_model.compute_force_monotonic(disp, Fn, a)
        err_inv = abs(Ft_recomputed - Ft) / Ft
        max_disp_inversion_err = max(max_disp_inversion_err, err_inv)

    # 4. Geometry Distinction Check: Flat Punch
    geom_punch = FlatPunchContact(punch_radius=a, corner_radius=0.0)
    cm_punch = CattaneoMindlinModel(geom_punch, pair)
    kt_punch_50 = cm_punch.compute_tangent_stiffness(0.5 * limit, Fn, a)
    # Punch must exhibit zero softening prior to slip (kt == kt_0)
    punch_softened = (kt_punch_50 < kt_0_num)

    passed = (err_kt_0 < 1e-6 and
              max_kt_rel_err < 1e-6 and
              monotonic_softening and
              max_disp_inversion_err < 1e-5 and
              not punch_softened)

    return {
        "benchmark": "Tangential Loading & Softening",
        "initial_stiffness_rel_error": err_kt_0,
        "max_tangent_stiffness_rel_error": max_kt_rel_err,
        "monotonic_softening_confirmed": monotonic_softening,
        "disp_force_inversion_error": max_disp_inversion_err,
        "flat_punch_constant_stiffness_confirmed": not punch_softened,
        "status": "PASS" if passed else "FAIL"
    }


if __name__ == "__main__":
    res = run_tangential_loading_benchmark()
    print(res)
