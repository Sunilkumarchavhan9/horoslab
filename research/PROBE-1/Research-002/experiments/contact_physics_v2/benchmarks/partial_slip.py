"""
HOROS Contact Physics v2: Partial Slip Benchmark
Validates stick-zone radius contraction, annular slip area expansion,
and adherence to the 1/3-power law for spherical contact.
"""

import math
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from contact.geometry import SphericalContact, FlatPunchContact
from contact.material import create_silicone_aluminum_pair
from contact.cattaneo_mindlin import CattaneoMindlinModel


def run_partial_slip_benchmark() -> dict:
    """
    Executes partial slip benchmark.
    Tests stick radius ratio (c/a) and slip area fraction across load ratios.
    """
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    R = 0.015
    geom_sphere = SphericalContact(radius=R)
    cm_model = CattaneoMindlinModel(geom_sphere, pair)

    Fn = 8.0
    a = 0.0025
    limit = pair.mu_static * Fn

    # 1. Spherical Stick Core Contraction Check
    ratios = [0.0, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99]
    max_stick_rel_error = 0.0

    for r in ratios:
        Ft = r * limit
        c_num, stick_ratio_num = cm_model.compute_stick_radius(Ft, Fn, a)
        ratio_exact = (1.0 - r) ** (1.0 / 3.0)

        err = abs(stick_ratio_num - ratio_exact)
        max_stick_rel_error = max(max_stick_rel_error, err)

    # 2. Gross Slip Boundary Check
    c_slip, stick_ratio_slip = cm_model.compute_stick_radius(1.001 * limit, Fn, a)
    gross_slip_exact = (c_slip == 0.0 and stick_ratio_slip == 0.0)

    # 3. Flat Punch Absence of Annular Slip Check
    geom_punch = FlatPunchContact(punch_radius=a, corner_radius=0.0)
    cm_punch = CattaneoMindlinModel(geom_punch, pair)
    _, stick_punch_50 = cm_punch.compute_stick_radius(0.5 * limit, Fn, a)
    _, stick_punch_99 = cm_punch.compute_stick_radius(0.99 * limit, Fn, a)
    _, stick_punch_slip = cm_punch.compute_stick_radius(1.01 * limit, Fn, a)

    punch_correct = (stick_punch_50 == 1.0 and stick_punch_99 == 1.0 and stick_punch_slip == 0.0)

    passed = (max_stick_rel_error < 1e-6 and gross_slip_exact and punch_correct)

    return {
        "benchmark": "Stick-Zone & Partial Slip Scaling",
        "spherical_max_stick_ratio_error": max_stick_rel_error,
        "gross_slip_boundary_confirmed": gross_slip_exact,
        "flat_punch_binary_slip_confirmed": punch_correct,
        "status": "PASS" if passed else "FAIL"
    }


if __name__ == "__main__":
    res = run_partial_slip_benchmark()
    print(res)
