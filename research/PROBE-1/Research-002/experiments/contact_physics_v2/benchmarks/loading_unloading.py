"""
HOROS Contact Physics v2: Loading-Unloading Hysteresis Benchmark
Validates Mindlin-Deresiewicz cyclic tangential hysteresis and thermodynamic energy passivity.
"""

import math
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from contact.geometry import SphericalContact
from contact.material import create_silicone_aluminum_pair
from contact.contact_state import ContactState
from contact.cattaneo_mindlin import CattaneoMindlinModel


def run_loading_unloading_benchmark() -> dict:
    """
    Executes a complete Mindlin-Deresiewicz cyclic loading loop:
    0 -> +disp_max -> -disp_max -> +disp_max.
    Verifies closed hysteresis curve, non-negative dissipated energy (passivity),
    and absence of numerical instability.
    """
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    R = 0.015
    geom = SphericalContact(radius=R)
    cm_model = CattaneoMindlinModel(geom, pair)

    Fn = 10.0
    a = 0.003
    limit = pair.mu_static * Fn

    # Target maximum displacement at 70% of gross slip threshold
    kt_0 = cm_model.compute_initial_tangential_stiffness(a)
    disp_max = cm_model.compute_displacement_monotonic(0.70 * limit, Fn, a)

    # Simulation setup
    dt = 0.001
    state = ContactState()
    state.in_contact = True
    state.normal_force = Fn
    state.contact_radius = a

    N_steps_half = 500
    d_disp = disp_max / N_steps_half

    # Branch 1: 0 to +disp_max
    for _ in range(N_steps_half):
        cm_model.step(state, +d_disp, dt)
    Ft_peak_pos = state.tangential_force
    E_diss_1 = state.cumulative_dissipated_energy

    # Branch 2: +disp_max to -disp_max
    for _ in range(2 * N_steps_half):
        cm_model.step(state, -d_disp, dt)
    Ft_peak_neg = state.tangential_force
    E_diss_2 = state.cumulative_dissipated_energy

    # Branch 3: -disp_max to +disp_max
    for _ in range(2 * N_steps_half):
        cm_model.step(state, +d_disp, dt)
    Ft_final = state.tangential_force
    E_diss_3 = state.cumulative_dissipated_energy

    # Verifications
    passivity_verified = state.verify_energy_passivity()
    energy_strictly_dissipated = (E_diss_3 > E_diss_2 > E_diss_1 > 0.0)
    symmetry_error = abs(abs(Ft_peak_pos) - abs(Ft_peak_neg)) / limit
    closure_error = abs(Ft_final - Ft_peak_pos) / limit

    passed = (passivity_verified and
              energy_strictly_dissipated and
              symmetry_error < 0.01 and
              closure_error < 0.01)

    return {
        "benchmark": "Mindlin-Deresiewicz Hysteresis Loop",
        "passivity_verified": passivity_verified,
        "energy_strictly_dissipated": energy_strictly_dissipated,
        "total_dissipated_energy_J": state.cumulative_dissipated_energy,
        "symmetry_error": symmetry_error,
        "loop_closure_error": closure_error,
        "status": "PASS" if passed else "FAIL"
    }


if __name__ == "__main__":
    res = run_loading_unloading_benchmark()
    print(res)
