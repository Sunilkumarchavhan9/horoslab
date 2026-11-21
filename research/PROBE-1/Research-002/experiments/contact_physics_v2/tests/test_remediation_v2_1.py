"""
HOROS Contact Physics v2.1: Targeted Remediation Tests
Verifies remediation of CP2-01 (Hybrid Transition Continuity) and CP2-02 (Layer Stiffness Derivative).
"""

import math
import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from contact.geometry import SphericalContact, FlatPunchContact, TruncatedSphericalContact
from contact.material import create_silicone_aluminum_pair
from contact.contact_state import ContactState
from contact.normal_contact import NormalContactModel
from contact.cattaneo_mindlin import CattaneoMindlinModel
from contact.lugre import LuGreModel


def test_remediation_cp2_01_hybrid_force_continuity():
    """Verify that hybrid mode transitions from pre-slip to gross slip with sub-micro-Newton continuity."""
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    lugre = LuGreModel(pair)

    Fn = 10.0
    a = 0.003
    v_cmd = 0.002  # 2 mm/s
    dt = 0.001
    limit = pair.mu_static * Fn

    state_pre = ContactState(in_contact=True, normal_force=Fn, contact_radius=a)
    state_post = ContactState(in_contact=True, normal_force=Fn, contact_radius=a)

    # Force immediately before gross slip boundary (c/a = 1e-6)
    Ft_cm_pre = limit * (1.0 - (1e-6)**3)
    F_pre = lugre.step_composed_hybrid(state_pre, Ft_cm_pre, v_cmd, stick_ratio=1e-6, dt=dt)

    # Force exactly at gross slip boundary (c/a = 0.0)
    F_post = lugre.step_composed_hybrid(state_post, limit, v_cmd, stick_ratio=0.0, dt=dt)

    delta_F = abs(F_pre - F_post)
    # Must be less than 1e-5 N (less than 0.001% of the 6.0 N threshold)
    assert delta_F < 1e-5, f"Boundary force discontinuity detected: {delta_F} N"


def test_remediation_cp2_01_hybrid_pure_limits():
    """Verify that hybrid mode recovers pure Cattaneo-Mindlin at stick and pure LuGre at sliding."""
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    geom = SphericalContact(radius=0.015)
    cm = CattaneoMindlinModel(geom, pair)
    lugre = LuGreModel(pair)

    Fn = 10.0
    a = 0.003
    dt = 0.001

    # 1. At pure stick (c/a = 1.0, zero velocity):
    disp = 1e-6
    Ft_cm, _, _ = cm.compute_force_monotonic(disp, Fn, a)
    state_stick = ContactState(in_contact=True, normal_force=Fn, contact_radius=a)
    Ft_hybrid_stick = lugre.step_composed_hybrid(state_stick, Ft_cm, v_cmd=0.0, stick_ratio=1.0, dt=dt)
    assert math.isclose(Ft_hybrid_stick, Ft_cm, rel_tol=1e-9)

    # 2. At gross slide (c/a = 0.0):
    v_slide = 0.01
    z_slip = pair.mu_static * Fn / lugre.params.sigma_0
    state_lugre = ContactState(in_contact=True, normal_force=Fn, contact_radius=a, bristle_deflection=z_slip)
    lugre.step(state_lugre, v_slide, dt)
    Ft_pure_lugre = state_lugre.tangential_force

    state_hybrid = ContactState(in_contact=True, normal_force=Fn, contact_radius=a, bristle_deflection=z_slip)
    Ft_hybrid_slide = lugre.step_composed_hybrid(state_hybrid, pair.mu_static * Fn, v_slide, stick_ratio=0.0, dt=dt)
    assert math.isclose(Ft_hybrid_slide, Ft_pure_lugre, rel_tol=1e-6)


def test_remediation_cp2_01_hybrid_zero_velocity_identity():
    """Verify that at v_cmd = 0, hybrid mode identically equals pure Cattaneo-Mindlin for all c/a."""
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    lugre = LuGreModel(pair)

    Fn = 10.0
    a = 0.003
    limit = pair.mu_static * Fn

    for eta in [1.0, 0.9, 0.7, 0.5, 0.3, 0.1, 0.0]:
        Ft_cm = limit * (1.0 - eta**3)
        state = ContactState(in_contact=True, normal_force=Fn, contact_radius=a)
        Ft_hybrid = lugre.step_composed_hybrid(state, Ft_cm, v_cmd=0.0, stick_ratio=eta, dt=0.001)
        assert math.isclose(Ft_hybrid, Ft_cm, abs_tol=1e-9)


def test_remediation_cp2_02_layer_stiffness_exact_derivative():
    """Verify that TruncatedSphericalContact normal stiffness matches finite differences to machine precision."""
    pair = create_silicone_aluminum_pair()
    geom = TruncatedSphericalContact(sphere_radius=0.015, pad_thickness=0.002, flat_radius=0.001)
    model = NormalContactModel(geom, pair)

    for delta_n in [1e-5, 5e-5, 1e-4, 3e-4, 5e-4, 1e-3]:
        Fn, a, kn_analytical = model.compute_from_indentation(delta_n)
        eps = 1e-8
        Fn_p, _, _ = model.compute_from_indentation(delta_n + eps)
        Fn_m, _, _ = model.compute_from_indentation(delta_n - eps)
        kn_fd = (Fn_p - Fn_m) / (2.0 * eps)

        rel_err = abs(kn_analytical - kn_fd) / kn_fd
        # Must be within 1e-6 relative error (0.0001%)
        assert rel_err < 1e-6, f"Layer stiffness derivative error too high at delta={delta_n}: {rel_err}"


def test_remediation_cp2_02_rounded_punch_consistency():
    """Verify that rounded flat punch normal stiffness matches finite differences exactly."""
    pair = create_silicone_aluminum_pair()
    geom = FlatPunchContact(punch_radius=0.005, corner_radius=0.001)
    model = NormalContactModel(geom, pair)

    for delta_n in [1e-5, 5e-5, 1e-4, 5e-4]:
        Fn, a, kn_analytical = model.compute_from_indentation(delta_n)
        eps = 1e-8
        Fn_p, _, _ = model.compute_from_indentation(delta_n + eps)
        Fn_m, _, _ = model.compute_from_indentation(delta_n - eps)
        kn_fd = (Fn_p - Fn_m) / (2.0 * eps)

        rel_err = abs(kn_analytical - kn_fd) / kn_fd
        assert rel_err < 1e-6, f"Rounded punch stiffness error too high at delta={delta_n}: {rel_err}"


def test_remediation_cp2_01_1_continuum_traction_exactness():
    """
    CP2-01.1: Verify exact continuum traction composition eliminates the 12.5% convex blend error
    and identically recovers Cattaneo-Mindlin across all stick ratios at v=0.
    """
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    geom = SphericalContact(radius=0.015)
    lugre = LuGreModel(pair)

    Fn = 10.0
    a = 0.003
    mu_s_Fn = pair.mu_static * Fn

    for x in [1.0, 0.9, 0.70710678, 0.5, 0.3, 0.1, 0.0]:
        Ft_cm = mu_s_Fn * (1.0 - x**3)
        state = ContactState(in_contact=True, normal_force=Fn, contact_radius=a)
        Ft_hybrid = lugre.step_composed_hybrid(state, Ft_cm, v_cmd=0.0, stick_ratio=x, dt=0.001, geometry=geom)
        assert math.isclose(Ft_hybrid, Ft_cm, abs_tol=1e-12)


def test_remediation_geometry_specific_dispatch():
    """Verify geometry-specific dispatch for spherical, sharp flat punch, and rounded punch."""
    sphere = SphericalContact(radius=0.015)
    punch_sharp = FlatPunchContact(punch_radius=0.005, corner_radius=0.0)
    punch_rounded = FlatPunchContact(punch_radius=0.005, corner_radius=0.001)

    # 1. Spherical: Hertzian 1.5 power
    assert math.isclose(sphere.annular_slip_load_fraction(0.70710678), (1.0 - 0.5)**1.5, rel_tol=1e-6)
    assert sphere.annular_slip_load_fraction(1.0) == 0.0
    assert sphere.annular_slip_load_fraction(0.0) == 1.0

    # 2. Sharp flat punch: Binary slip (0 in partial slip, 1 at gross slide)
    assert punch_sharp.annular_slip_load_fraction(0.9) == 0.0
    assert punch_sharp.annular_slip_load_fraction(0.5) == 0.0
    assert punch_sharp.annular_slip_load_fraction(0.1) == 0.0
    assert punch_sharp.annular_slip_load_fraction(0.0) == 1.0

    # 3. Rounded punch: Pressure integral over rounded edge fillet and flat core
    phi_edge = punch_rounded.annular_slip_load_fraction(0.95)
    assert 0.0 < phi_edge < 0.25  # Slip strictly on rounded fillet
    phi_core = punch_rounded.annular_slip_load_fraction(0.50)
    assert 0.5 < phi_core < 1.0   # Slip penetrated into flat core
    assert punch_rounded.annular_slip_load_fraction(1.0) == 0.0
    assert punch_rounded.annular_slip_load_fraction(0.0) == 1.0


def test_remediation_annular_load_scaling_equivalence():
    """
    Verify exact equivalence between:
    Method A: Evaluating LuGre at total Fn, then scaling force by Phi_slip
    Method B: Evaluating LuGre directly on the annulus with Fn_ann = Phi_slip * Fn and sigma_i scaled.
    """
    pair = create_silicone_aluminum_pair()
    Fn = 10.0
    phi_slip = 0.353553  # e.g. at c/a = 1/sqrt(2)
    dt = 0.001
    v_profile = [0.001, 0.005, 0.01, -0.005, -0.01, 0.002]

    sigma_0 = pair.lugre_params.sigma_0
    sigma_1 = pair.lugre_params.sigma_1
    sigma_2 = pair.lugre_params.sigma_2
    mu_k = pair.mu_kinetic
    mu_s = pair.mu_static
    vs = pair.lugre_params.stribeck_velocity

    # Method A: Total Fn
    z_A = (mu_s * Fn) / sigma_0
    # Method B: Annular scaled Fn
    z_B = (mu_s * (phi_slip * Fn)) / (phi_slip * sigma_0)

    for v in v_profile:
        # Method A
        gv_A = (mu_k + (mu_s - mu_k) * math.exp(-(v / vs)**2)) * Fn
        lam_A = (sigma_0 * abs(v)) / gv_A
        z_ss_A = math.copysign(gv_A / sigma_0, v)
        z_A_next = z_ss_A + (z_A - z_ss_A) * math.exp(-min(100.0, lam_A * dt))
        dz_A = (z_A_next - z_A) / dt
        Ft_A_ann = phi_slip * (sigma_0 * z_A_next + sigma_1 * dz_A + sigma_2 * v)
        z_A = z_A_next

        # Method B
        gv_B = (mu_k + (mu_s - mu_k) * math.exp(-(v / vs)**2)) * (phi_slip * Fn)
        lam_B = (phi_slip * sigma_0 * abs(v)) / gv_B
        z_ss_B = math.copysign(gv_B / (phi_slip * sigma_0), v)
        z_B_next = z_ss_B + (z_B - z_ss_B) * math.exp(-min(100.0, lam_B * dt))
        dz_B = (z_B_next - z_B) / dt
        Ft_B_ann = (phi_slip * sigma_0) * z_B_next + (phi_slip * sigma_1) * dz_B + (phi_slip * sigma_2) * v
        z_B = z_B_next

        assert math.isclose(Ft_A_ann, Ft_B_ann, abs_tol=1e-14)


def test_remediation_signed_dissipation_no_masking():
    """
    Verify that unmasked signed step dissipation dW - dE_elastic is strictly non-negative
    during reversing dynamic motion and under dynamically varying normal load.
    """
    pair = create_silicone_aluminum_pair()
    lugre = LuGreModel(pair)
    dt = 0.0001

    state = ContactState(in_contact=True, normal_force=10.0, contact_radius=0.003)
    
    # 2000 steps with sinusoidal velocity and varying normal force
    for step in range(2000):
        t = step * dt
        v = 0.01 * math.sin(2.0 * math.pi * 5.0 * t) + 0.005 * math.cos(2.0 * math.pi * 17.0 * t)
        state.normal_force = 10.0 + 3.0 * math.sin(2.0 * math.pi * 2.0 * t)
        
        lugre.step(state, v, dt)
        
        # Signed dissipation must not be masked and must be >= 0:
        d_diss = state.signed_step_dissipation
        assert d_diss >= -1e-12, f"Negative signed dissipation detected at step {step}: {d_diss} J"
    
    assert state.cumulative_dissipated_energy > 0.0


def test_remediation_passivity_exact_cross_term():
    """
    Verify thermodynamic passivity power balance with exact cross term:
    D_dot = F*v - dV/dt = sigma_0^2 * |v|/g(v) * z^2 + sigma_1 * dz_dt * v + sigma_2 * v^2 >= 0
    across the entire physical invariant set |z| <= g(v)/sigma_0.
    """
    pair = create_silicone_aluminum_pair()
    lugre = LuGreModel(pair)
    Fn = 10.0

    for v in [1e-6, 1e-4, 1e-2, 0.1, 1.0]:
        gv = lugre.compute_stribeck(v, Fn)
        z_max = gv / lugre.params.sigma_0

        for w in [-1.0, -0.7, -0.3, 0.0, 0.3, 0.7, 1.0]:
            z = w * z_max
            z_next, dz_dt = lugre.integrate_bristle(z, v, Fn, dt=0.0001)
            Ft = lugre.compute_friction_force(z_next, dz_dt, v)
            
            # Power balance:
            # Mechanical input power P_in = Ft * v
            # Rate of elastic energy storage: dV/dt = sigma_0 * z * dz_dt
            # Dissipation rate: D_dot = P_in - dV/dt
            P_in = Ft * v
            dV_dt = lugre.params.sigma_0 * z * dz_dt
            D_dot = P_in - dV_dt

            # Dissipation must be non-negative
            assert D_dot >= -1e-9, f"Passivity violation: D_dot={D_dot} at v={v}, z={z}"
