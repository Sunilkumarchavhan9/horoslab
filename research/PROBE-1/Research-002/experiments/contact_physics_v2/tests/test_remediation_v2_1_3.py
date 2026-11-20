"""
HOROS Contact Physics v2.1.3.1: Targeted Remediation Tests
Verifies mathematical and thermodynamic closure for:
- CP2-03: Reconciled hybrid kinematics (v_eff), non-stale stick-zone state tracking,
          and exact First-Law energy conservation (W_ext = Delta V + D_cum) across cyclic boundaries.
- CP2-04: Physical stick-to-slip relaxation under normal load reduction without energy double-counting.
- CP2-05: Constitutive bristle rate bounded by (1 + mu_s / mu_k) * |v| under rapid velocity reversals
          and normal load collapse, eliminating micro-damping explosion and negative dissipation.
- Trapezoidal temporal work integration convergence.
"""

import math
import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from contact.geometry import SphericalContact, FlatPunchContact, TruncatedSphericalContact
from contact.material import create_silicone_aluminum_pair
from contact.contact_state import ContactState
from contact.cattaneo_mindlin import CattaneoMindlinModel
from contact.lugre import LuGreModel


def test_remediation_cp2_04_zero_velocity_load_drop():
    """
    CP2-04: Verify that when normal load drops at zero velocity, the contact relaxes
    physically so that tangential force strictly satisfies Coulomb capacity (|Ft| <= mu_s * Fn),
    and exact First-Law energy conservation holds without double-counting (W_ext = Delta V + D_cum).
    """
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    lugre = LuGreModel(pair)

    Fn_init = 10.0
    Fn_reduced = 2.0
    a = 0.003
    dt = 0.001

    # Prime contact at high load Fn = 10 N to static threshold
    z_max_10 = (pair.mu_static * Fn_init) / pair.lugre_params.sigma_0
    initial_elastic = 0.5 * pair.lugre_params.sigma_0 * (z_max_10 ** 2)

    # Initialize state with deflection AND stored elastic energy consistently
    state = ContactState(
        in_contact=True,
        normal_force=Fn_init,
        contact_radius=a,
        bristle_deflection=z_max_10,
        stored_elastic_energy=initial_elastic
    )

    # Command abrupt normal force reduction to 2.0 N at zero velocity
    state.normal_force = Fn_reduced
    lugre.step(state, v_cmd=0.0, dt=dt)

    cap_reduced = pair.mu_static * Fn_reduced  # 1.2 N
    assert state.tangential_force <= cap_reduced + 1e-9, (
        f"CP2-04 Failure: Tangential force {state.tangential_force:.4f} N exceeds "
        f"Coulomb capacity {cap_reduced:.4f} N after normal load reduction!"
    )
    assert abs(state.bristle_deflection) <= (cap_reduced / pair.lugre_params.sigma_0) + 1e-12

    # Verify First Law: W_ext = Delta V + D_cum (with W_ext = 0 at zero velocity)
    # Delta V = V_reduced - V_initial < 0
    # D_cum = - Delta V > 0
    delta_V = state.stored_elastic_energy - initial_elastic
    w_ext = 0.0
    first_law_residual = abs(w_ext - (delta_V + state.cumulative_dissipated_energy))

    assert state.signed_step_dissipation > 0.0, "Relaxation dissipation must be positive"
    assert first_law_residual < 1e-15, (
        f"CP2-04 Failure: First Law violated or double-counted! Residual={first_law_residual:.2e} J"
    )


def test_remediation_cp2_05_velocity_reversal_bounded_dynamics():
    """
    CP2-05: Verify constitutive bristle rate and micro-damping dynamics under rapid velocity reversal.
    Under reversal, the exact invariant bound is |dz/dt| <= (1 + mu_s / mu_k) * |v|.
    Verifies that no micro-damping explosion occurs, step dissipation is non-negative,
    and First-Law energy conservation holds.
    """
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    lugre = LuGreModel(pair)

    v_forward = 0.01   # +10 mm/s
    v_reverse = -0.01  # -10 mm/s
    dt = 0.0005
    Fn = 10.0
    a = 0.003

    state = ContactState(in_contact=True, normal_force=Fn, contact_radius=a)

    # 1. Forward motion to steady sliding state
    for _ in range(50):
        lugre.step(state, v_cmd=v_forward, dt=dt)

    assert state.bristle_deflection > 0.0
    assert state.tangential_force > 0.0

    # 2. Command instantaneous velocity reversal
    prev_stored = state.stored_elastic_energy
    prev_diss = state.cumulative_dissipated_energy
    prev_Ft = state.tangential_force

    lugre.step(state, v_cmd=v_reverse, dt=dt)

    # Constitutive invariant rate bound: (1 + mu_s / mu_k) * |v| = (1 + 0.60/0.50) * 0.01 = 0.022 m/s
    bound_ratio = 1.0 + (pair.mu_static / pair.mu_kinetic)
    max_allowed_bristle_rate = bound_ratio * abs(v_reverse)

    assert abs(state.bristle_velocity) <= max_allowed_bristle_rate + 1e-9, (
        f"CP2-05 Failure: Bristle velocity {abs(state.bristle_velocity):.4f} m/s exceeds "
        f"invariant bound {max_allowed_bristle_rate:.4f} m/s on reversal!"
    )

    # Step dissipation during reversal must remain non-negative
    assert state.signed_step_dissipation >= -1e-12, (
        f"CP2-05 Failure: Negative dissipation on reversal: {state.signed_step_dissipation} J"
    )

    # First-Law energy conservation on the step
    dW = 0.5 * (prev_Ft + state.tangential_force) * (v_reverse * dt)
    d_elastic = state.stored_elastic_energy - prev_stored
    d_diss = state.cumulative_dissipated_energy - prev_diss
    assert abs(dW - (d_elastic + d_diss)) < 1e-15, "First Law violated on velocity reversal step"


def test_remediation_cp2_05_normal_load_collapse_no_negative_dissipation():
    """
    CP2-05: Verify that when normal load collapses to near-zero (1e-5 N) during active sliding,
    constitutive bristle velocity evaluation prevents damping explosion and negative dissipation.
    """
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    lugre = LuGreModel(pair)

    v_slide = 0.01  # 10 mm/s
    dt = 0.001
    a = 0.003

    # Prime contact at 10 N
    state = ContactState(in_contact=True, normal_force=10.0, contact_radius=a)
    lugre.step(state, v_cmd=v_slide, dt=dt)

    # Collapse normal force by 6 orders of magnitude
    state.normal_force = 1e-5
    lugre.step(state, v_cmd=v_slide, dt=dt)

    # Tangential force must remain aligned with velocity (no sign flip from runaway damping)
    assert state.tangential_force * v_slide > 0.0, (
        f"CP2-05 Failure: Tangential force {state.tangential_force} N flipped against velocity {v_slide}"
    )
    # Dissipation must be non-negative
    assert state.signed_step_dissipation >= -1e-12, (
        f"CP2-05 Failure: Negative step dissipation {state.signed_step_dissipation} J on load collapse"
    )
    # Bristle velocity must be bounded by constitutive invariant
    bound = (1.0 + pair.mu_static / pair.mu_kinetic) * abs(v_slide)
    assert abs(state.bristle_velocity) <= bound + 1e-9


def test_remediation_cp2_03_hybrid_coupled_energy_balance():
    """
    CP2-03: Verify that step_composed_hybrid maintains complete thermodynamic consistency
    and exact First-Law energy conservation (W_ext = Delta V + D_cum) across cyclic stick-slip
    boundary migration (both expanding and contracting stick zone), with non-stale state tracking.
    """
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    geom = SphericalContact(radius=0.015)
    cm = CattaneoMindlinModel(geom, pair)
    lugre = LuGreModel(pair)

    Fn = 10.0
    a = 0.003
    dt = 0.0005
    limit = pair.mu_static * Fn
    disp_peak = cm.compute_displacement_monotonic(0.50 * limit, Fn, a)

    state = ContactState(in_contact=True, normal_force=Fn, contact_radius=a)
    initial_elastic = state.stored_elastic_energy

    # Maintain independent Cattaneo-Mindlin quasistatic kinematics state to drive hybrid
    cm_state = ContactState(in_contact=True, normal_force=Fn, contact_radius=a)

    N = 100
    d_disp = disp_peak / N
    w_ext_total = 0.0
    min_step_diss = 1e9

    # Multi-cycle loading, unloading, and reloading trajectory:
    # 1. Loading: 0 -> +disp_peak (stick zone contracts, annulus expands)
    # 2. Unloading: +disp_peak -> -disp_peak (stick zone expands, then contracts in reverse)
    # 3. Reloading: -disp_peak -> +disp_peak (stick zone expands, then contracts)
    steps_pattern = [+1] * N + [-1] * (2 * N) + [+1] * (2 * N)

    for step_idx, direction in enumerate(steps_pattern):
        delta_x = direction * d_disp
        v_cmd = delta_x / dt

        # Advance Cattaneo-Mindlin elastoplastic kinematics
        cm.step(cm_state, delta_x, dt)
        c_over_a = cm_state.stick_ratio
        Ft_cm = cm_state.tangential_force

        prev_Ft = state.tangential_force
        # Advance composed hybrid model (which owns the physical contact state & energetics)
        Ft_hyb = lugre.step_composed_hybrid(state, Ft_cm, v_cmd, stick_ratio=c_over_a, dt=dt, geometry=geom)

        # Verify state.stick_ratio was updated and is not stale
        assert math.isclose(state.stick_ratio, c_over_a, rel_tol=1e-9), "state.stick_ratio must not be stale"

        # Trapezoidal external work
        dW = 0.5 * (prev_Ft + Ft_hyb) * (v_cmd * dt)
        w_ext_total += dW
        min_step_diss = min(min_step_diss, state.signed_step_dissipation)

    # 1. Verify exact First-Law energy conservation: W_ext = Delta V + D_cum
    delta_V = state.stored_elastic_energy - initial_elastic
    d_cum = state.cumulative_dissipated_energy
    first_law_error = abs(w_ext_total - (delta_V + d_cum))

    assert first_law_error < 1e-12, (
        f"CP2-03 Failure: First Law violated! W_ext={w_ext_total:.6e}, Delta_V={delta_V:.6e}, "
        f"D_cum={d_cum:.6e}, Error={first_law_error:.2e} J"
    )

    # 2. Verify non-negative cumulative dissipation and physical passivity bound
    assert d_cum > 0.0, "Cumulative dissipation over closed hysteresis cycle must be positive"
    assert min_step_diss >= -5e-6, f"CP2-03 Failure: Unphysical negative step dissipation: {min_step_diss:.2e} J"


def test_remediation_temporal_work_trapezoidal_convergence():
    """
    Verify that trapezoidal work integration eliminates the massive endpoint work inflation
    (>170% error) and achieves superior convergence with sub-stepped numerical integration.
    """
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    lugre = LuGreModel(pair)

    state_trap = ContactState(in_contact=True, normal_force=10.0, contact_radius=0.003)
    state_sub = ContactState(in_contact=True, normal_force=10.0, contact_radius=0.003)

    dt = 0.001
    v_start = 0.001
    v_end = 0.010

    # Prime both states
    lugre.step(state_trap, v_cmd=v_start, dt=1e-5)
    lugre.step(state_sub, v_cmd=v_start, dt=1e-5)
    Ft_start = state_trap.tangential_force

    # 1. Ground truth: 100 sub-steps integrating continuous work
    N = 100
    dt_sub = dt / N
    W_true = 0.0
    for i in range(N):
        v_i = v_start + (v_end - v_start) * (i + 0.5) / N
        prev_Ft = state_sub.tangential_force
        lugre.step(state_sub, v_cmd=v_i, dt=dt_sub)
        W_true += 0.5 * (prev_Ft + state_sub.tangential_force) * (v_i * dt_sub)
    Ft_end = state_sub.tangential_force

    # 2. Single step with trapezoidal integration
    W_trap = 0.5 * (Ft_start * v_start + Ft_end * v_end) * dt

    # 3. Single step with naive endpoint integration
    W_endpoint = Ft_end * v_end * dt

    err_trap = abs(W_trap - W_true) / W_true
    err_endpoint = abs(W_endpoint - W_true) / W_true

    # Trapezoidal error must be dramatically lower than naive endpoint inflation
    assert err_trap < 0.40, f"Trapezoidal error {err_trap*100:.1f}% exceeds 40%"
    assert err_endpoint > 1.50, f"Endpoint error expected to exceed 150%, got {err_endpoint*100:.1f}%"
    assert err_trap < 0.25 * err_endpoint, (
        f"Trapezoidal rule should reduce error by at least 4x: "
        f"trap={err_trap*100:.1f}%, endpoint={err_endpoint*100:.1f}%"
    )
