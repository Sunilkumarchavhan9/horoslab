"""
HOROS Contact Physics v2.1.3: Targeted Remediation Tests
Verifies remediation of:
- CP2-03: Complete Hybrid Energy Balance and Moving Stick-Slip Boundary Transport
- CP2-04: Zero-Velocity Normal Load Reduction and Physical Stick-to-Slip Relaxation
- CP2-05: Normal-Load Collapse without Negative Dissipation (Constitutive Damping)
- Improved Temporal Trapezoidal Work Integration
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
    physically so that tangential force strictly satisfies Coulomb capacity (|Ft| <= mu_s * Fn).
    """
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    lugre = LuGreModel(pair)

    Fn_init = 10.0
    Fn_reduced = 2.0
    a = 0.003
    dt = 0.001

    # Prime contact at high load Fn = 10 N to static threshold
    z_max_10 = (pair.mu_static * Fn_init) / pair.lugre_params.sigma_0
    state = ContactState(in_contact=True, normal_force=Fn_init, contact_radius=a,
                         bristle_deflection=z_max_10)

    # Command abrupt normal force reduction to 2.0 N at zero velocity
    state.normal_force = Fn_reduced
    lugre.step(state, v_cmd=0.0, dt=dt)

    cap_reduced = pair.mu_static * Fn_reduced  # 1.2 N
    assert state.tangential_force <= cap_reduced + 1e-9, (
        f"CP2-04 Failure: Tangential force {state.tangential_force:.4f} N exceeds "
        f"Coulomb capacity {cap_reduced:.4f} N after normal load reduction!"
    )
    assert abs(state.bristle_deflection) <= (cap_reduced / pair.lugre_params.sigma_0) + 1e-12
    assert state.signed_step_dissipation >= 0.0, "Relaxation dissipation must be non-negative"


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
    # Bristle velocity must be bounded by sliding velocity
    assert abs(state.bristle_velocity) <= abs(v_slide) + 1e-9


def test_remediation_cp2_03_hybrid_coupled_energy_balance():
    """
    CP2-03: Verify that step_composed_hybrid maintains a complete, thermodynamically consistent
    hybrid energy balance across stick-slip boundary migration, updating stored elastic energy
    and positive dissipation.
    """
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    geom = SphericalContact(radius=0.015)
    cm = CattaneoMindlinModel(geom, pair)
    lugre = LuGreModel(pair)

    state = ContactState(in_contact=True, normal_force=10.0, contact_radius=0.003)
    dt = 0.001
    min_step_diss = 1e9

    # 100-step dynamic trajectory with moving stick-slip boundary
    for i in range(100):
        t = i * dt
        v_cmd = 0.002 * math.sin(2.0 * math.pi * 5.0 * t)  # 5 Hz oscillation
        c_over_a = 0.5 + 0.45 * math.cos(2.0 * math.pi * 2.0 * t)  # c/a varies between 0.05 and 0.95
        limit = pair.mu_static * 10.0
        Ft_cm = limit * (1.0 - c_over_a**3)

        total_Ft = lugre.step_composed_hybrid(state, Ft_cm, v_cmd, stick_ratio=c_over_a, dt=dt, geometry=geom)
        min_step_diss = min(min_step_diss, state.signed_step_dissipation)

    # Hybrid energy state variables must be actively populated:
    assert state.stored_elastic_energy > 0.0, "Hybrid stored elastic energy must be tracked"
    assert state.cumulative_dissipated_energy > 0.0, "Hybrid cumulative dissipation must be positive"
    assert min_step_diss >= -1e-12, f"CP2-03 Failure: Negative hybrid step dissipation {min_step_diss} J"


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

    # 4. Under moderate acceleration (20% velocity variation), trapezoidal error is < 3%
    v_mod_start = 0.005
    v_mod_end = 0.006
    st_mod = ContactState(in_contact=True, normal_force=10.0, contact_radius=0.003)
    lugre.step(st_mod, v_cmd=v_mod_start, dt=1e-5)
    Ft_m_start = st_mod.tangential_force

    W_mod_true = 0.0
    for i in range(N):
        v_i = v_mod_start + (v_mod_end - v_mod_start) * (i + 0.5) / N
        prev_Ft = st_mod.tangential_force
        lugre.step(st_mod, v_cmd=v_i, dt=dt_sub)
        W_mod_true += 0.5 * (prev_Ft + st_mod.tangential_force) * (v_i * dt_sub)
    Ft_m_end = st_mod.tangential_force

    W_mod_trap = 0.5 * (Ft_m_start * v_mod_start + Ft_m_end * v_mod_end) * dt
    err_mod_trap = abs(W_mod_trap - W_mod_true) / W_mod_true
    assert err_mod_trap < 0.03, f"Moderate acceleration error too high: {err_mod_trap*100:.2f}%"
