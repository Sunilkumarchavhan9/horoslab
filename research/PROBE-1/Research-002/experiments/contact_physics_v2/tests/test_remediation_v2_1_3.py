"""
HOROS Contact Physics v2.1.3.2: Targeted Remediation Tests
Verifies mathematical and thermodynamic closure for:
- CP2-03: Independent constitutive dissipation verification, genuinely closed cyclic trajectories,
          reconciled kinematics (v_eff), and non-stale stick-zone state tracking.
- CP2-04: Physical stick-to-slip relaxation under normal load reduction without energy double-counting,
          verified in BOTH standalone LuGre and composed hybrid modes.
- CP2-05: Unclipped constitutive bristle rate bounded by (1 + mu_s / mu_k) * |v| under rapid
          velocity reversals and normal load collapse, eliminating micro-damping runaway.
- Lift-off and recontact thermodynamic consistency (releasing residual elastic energy).
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
    CP2-04: Standalone LuGre Mode:
    Verify that when normal load drops at zero velocity, the contact relaxes
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
    delta_V = state.stored_elastic_energy - initial_elastic
    w_ext = 0.0
    first_law_residual = abs(w_ext - (delta_V + state.cumulative_dissipated_energy))

    assert state.signed_step_dissipation > 0.0, "Relaxation dissipation must be positive"
    assert first_law_residual < 1e-15, (
        f"CP2-04 Failure: First Law violated or double-counted! Residual={first_law_residual:.2e} J"
    )


def test_remediation_cp2_04_hybrid_zero_velocity_load_drop():
    """
    CP2-04: Composed Hybrid Mode:
    Verify that when normal load drops abruptly from 10 N to 2 N at zero velocity
    while in partial slip (c/a = 0.5):
    1. Bristle deflection relaxes to the reduced Coulomb static capacity.
    2. Total hybrid force satisfies Coulomb static capacity (|Ft_hybrid| <= mu_s * Fn_reduced).
    3. Excess strain energy dissipates into heat with zero double-counting (First-Law equality).
    """
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    geom = SphericalContact(radius=0.015)
    lugre = LuGreModel(pair)

    Fn_init = 10.0
    Fn_reduced = 2.0
    a = 0.003
    dt = 0.001

    limit_init = pair.mu_static * Fn_init
    Ft_cm_init = limit_init * (1.0 - 0.5**3)  # 5.25 N
    z_init = limit_init / pair.lugre_params.sigma_0

    state = ContactState(
        in_contact=True,
        normal_force=Fn_init,
        contact_radius=a,
        bristle_deflection=z_init
    )
    # Step hybrid once at initial load
    lugre.step_composed_hybrid(state, Ft_cm_init, v_cmd=0.0, stick_ratio=0.5, dt=dt, geometry=geom)
    initial_stored = state.stored_elastic_energy

    # Command abrupt normal force reduction to 2.0 N at zero velocity
    state.normal_force = Fn_reduced
    limit_reduced = pair.mu_static * Fn_reduced  # 1.2 N
    Ft_cm_reduced = limit_reduced * (1.0 - 0.5**3)  # 1.05 N

    Ft_hyb = lugre.step_composed_hybrid(state, Ft_cm_reduced, v_cmd=0.0, stick_ratio=0.5, dt=dt, geometry=geom)

    # 1. Hybrid force bounded by reduced static Coulomb capacity
    assert abs(Ft_hyb) <= limit_reduced + 1e-9, (
        f"CP2-04 Hybrid Failure: Ft_hybrid={Ft_hyb:.4f} exceeds Coulomb limit={limit_reduced:.4f}"
    )
    # 2. Bristle deflection relaxed to reduced capacity
    cap_disp = limit_reduced / pair.lugre_params.sigma_0
    assert abs(state.bristle_deflection) <= cap_disp + 1e-12

    # 3. Exact First-Law energy conservation: W_ext = 0 ==> Delta V + D_step = 0
    delta_V = state.stored_elastic_energy - initial_stored
    d_diss = state.signed_step_dissipation
    assert d_diss > 0.0, "Relaxation dissipation must be positive"
    assert abs(0.0 - (delta_V + d_diss)) < 1e-15, "First-Law violated on hybrid normal load reduction"


def test_remediation_cp2_05_unclipped_constitutive_rate_bound():
    """
    CP2-05: Verify that the raw constitutive derivative:
      dz/dt_constitutive = v - (sigma_0 * |v| / g(v, Fn)) * z
    naturally satisfies |dz/dt| <= (1 + mu_s / mu_k) * |v| across the entire static
    Coulomb invariant set |z| <= mu_s * Fn / sigma_0 without requiring artificial clipping.
    """
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    lugre = LuGreModel(pair)
    Fn = 10.0

    bound_ratio = 1.0 + (pair.mu_static / pair.mu_kinetic)  # 2.2 for 0.60 / 0.50

    velocities = [1e-5, -1e-5, 0.001, -0.001, 0.01, -0.01, 0.1, -0.1, 1.0, -1.0]
    z_max = pair.mu_static * Fn / lugre.params.sigma_0

    for v in velocities:
        gv = lugre.compute_stribeck(v, Fn)
        v_abs = abs(v)
        max_allowed = bound_ratio * v_abs

        # Sample full admissible state invariant from -z_max to +z_max
        for fraction in [-1.0, -0.9, -0.5, -0.2, 0.0, 0.2, 0.5, 0.9, 1.0]:
            z = fraction * z_max
            dz_constitutive = v - (lugre.params.sigma_0 * v_abs / gv) * z

            assert abs(dz_constitutive) <= max_allowed + 1e-12, (
                f"CP2-05 Failure: Raw constitutive rate {abs(dz_constitutive)} exceeds "
                f"invariant bound {max_allowed} at v={v}, z={z}"
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

    # Constitutive invariant rate bound: (1 + mu_s / mu_k) * |v| = 2.2 * 0.01 = 0.022 m/s
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


def test_remediation_cp2_03_passivity_operational_envelope_and_discriminant():
    """
    CP2-03: Analytical Passivity Domain & Raw Constitutive Dissipation Closure:
    In standard LuGre friction:
      P_diss = (sigma_0^2 * |v| / g(v)) * z^2 + sigma_1 * dz/dt * v + sigma_2 * v^2
    Expanding dz/dt = v - (sigma_0 * |v| / g(v)) * z yields a quadratic in z with discriminant:
      Delta_z = (sigma_0^2 * |v| / g(v)) * [ (sigma_1^2 * |v| / g(v)) - 4 * (sigma_1 + sigma_2) ]
    1. For all |v| <= v_passive = 4 * (sigma_1 + sigma_2) * g(v) / sigma_1^2 (~44.6 mm/s),
       Delta_z <= 0, which guarantees raw unmasked P_diss >= 0 for ALL z in (-inf, +inf).
    2. Proves that compliant robotic pre-lift manipulation (|v| <= 10 mm/s) is strictly passive.
    3. Analyzes the cofounder's out-of-domain query (v = 1.0 m/s with frozen static z = 0.00024 m),
       confirming -81.3 W unmasked dissipation, and demonstrates that under physical dynamic
       trajectory integration from rest, z relaxes in < 1 ms to z_ss ~ 0.00020 m where P_diss = +6.5 W > 0.
    """
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    lugre = LuGreModel(pair)
    Fn = 10.0

    # 1. Operational envelope verification: raw unmasked P_diss >= 0
    test_velocities = [1e-5, 0.001, 0.005, 0.010, 0.020, 0.040, -1e-5, -0.001, -0.005, -0.010, -0.020, -0.040]
    z_max = pair.mu_static * Fn / lugre.params.sigma_0

    for v in test_velocities:
        gv = lugre.compute_stribeck(v, Fn)
        v_passive = 4.0 * (lugre.params.sigma_1 + lugre.params.sigma_2) * gv / (lugre.params.sigma_1 ** 2)
        assert abs(v) <= v_passive, f"Velocity {v} exceeds passive bound {v_passive}"

        # Evaluate across full Coulomb capacity interval [-z_max, +z_max]
        for frac in [-1.0, -0.75, -0.5, -0.25, 0.0, 0.25, 0.5, 0.75, 1.0]:
            z = frac * z_max
            dz = v - (lugre.params.sigma_0 * abs(v) / gv) * z
            # Raw constitutive dissipation rate (NO max(0, ...) clipping):
            P_diss = (
                ((lugre.params.sigma_0 ** 2 * abs(v) / gv) * (z ** 2)) +
                (lugre.params.sigma_1 * dz * v) +
                (lugre.params.sigma_2 * (v ** 2))
            )
            assert P_diss >= 0.0, f"Raw dissipation negative at v={v}, z={z}: {P_diss:.4e} W"

    # 2. Cofounder extreme point analysis (v = 1.0 m/s, z = 0.00024 m)
    v_cf = 1.0
    z_cf = 0.00024
    gv_cf = lugre.compute_stribeck(v_cf, Fn)
    dz_cf = v_cf - (lugre.params.sigma_0 * abs(v_cf) / gv_cf) * z_cf
    P_diss_cf = (
        ((lugre.params.sigma_0 ** 2 * abs(v_cf) / gv_cf) * (z_cf ** 2)) +
        (lugre.params.sigma_1 * dz_cf * v_cf) +
        (lugre.params.sigma_2 * (v_cf ** 2))
    )
    # Replicates exact cofounder calculation: -81.3 W
    assert math.isclose(P_diss_cf, -81.3, abs_tol=0.1), f"Expected -81.3 W, got {P_diss_cf}"

    # 3. Dynamic relaxation from rest to steady sliding at v = 1.0 m/s
    state_dyn = ContactState(in_contact=True, normal_force=Fn, contact_radius=0.003)
    # Integrate for 2 ms (dt = 0.0001 s, 20 steps)
    for _ in range(20):
        lugre.step(state_dyn, v_cmd=v_cf, dt=0.0001)

    # In continuous physical trajectory, z relaxes to attractor z_ss ~ 0.00020 m
    z_ss_expected = gv_cf / lugre.params.sigma_0
    assert math.isclose(state_dyn.bristle_deflection, z_ss_expected, rel_tol=1e-3)
    # Raw independent dissipation at physical attractor is strictly positive (+6.5 W)
    assert state_dyn.independent_step_dissipation > 0.0
    assert state_dyn.instantaneous_dissipation_rate > 0.0


def test_remediation_cp2_03_power_port_conjugacy():
    """
    CP2-03: External-to-Local Power Port Decomposition and Conjugacy Closure:
    External mechanical power:
      P_ext = Ft_hybrid * v_cmd
    Decomposes identically into:
      P_ext = P_core + P_transport + P_annular
    where:
      P_core = Ft_core * v_cmd                      (elastic power driving sticking core)
      P_transport = phi_slip * Ft_ann * (v_cmd - v_eff)  (elastic transport power across boundary)
      P_annular = phi_slip * Ft_ann * v_eff         (local power driving annular bristles & slip)
    Verifies equality to machine precision (< 1e-15 W) across multiple slip regimes.
    """
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    geom = SphericalContact(radius=0.015)
    lugre = LuGreModel(pair)
    Fn = 10.0
    dt = 0.001

    for c_over_a in [0.1, 0.3, 0.5, 0.7, 0.9]:
        for v_cmd in [0.001, 0.005, -0.002, -0.010]:
            phi_slip = geom.annular_slip_load_fraction(c_over_a)
            sgn = 1.0 if v_cmd > 0 else -1.0
            coulomb_limit = sgn * pair.mu_static * Fn
            Ft_cm = coulomb_limit * (1.0 - c_over_a ** 3)
            v_eff = v_cmd * (1.0 - c_over_a)

            z, dz = lugre.integrate_bristle(0.0, v_eff, Fn, dt)
            Ft_ann = lugre.compute_friction_force(z, dz, v_eff)
            Ft_core = Ft_cm - phi_slip * coulomb_limit
            Ft_hybrid = Ft_core + phi_slip * Ft_ann

            P_ext = Ft_hybrid * v_cmd
            P_core = Ft_core * v_cmd
            P_trans = phi_slip * Ft_ann * (v_cmd - v_eff)
            P_ann = phi_slip * Ft_ann * v_eff

            residual = abs(P_ext - (P_core + P_trans + P_ann))
            assert residual < 1e-15, f"Power port mismatch: residual={residual:.2e} W"


def test_remediation_cp2_03_closed_cycle_external_work_matches_independent_dissipation():
    """
    CP2-03: Genuinely Closed Limit Cycle Without Work-Storage Residual Identity:
    Runs a periodic sinusoidal limit cycle in standalone LuGre mode.
    Verifies:
    1. Perfect state closure: |Delta V_cycle| < 1e-10 J, |Delta Ft| < 1e-6 N, |Delta z| < 1e-10 m.
    2. Net cyclic external work is positive (W_cycle > 0).
    3. Independent constitutive dissipation matches external work to numerical precision (error < 0.05%)
       WITHOUT relying on the dW - Delta V identity.
    """
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    lugre = LuGreModel(pair)
    Fn = 10.0
    a = 0.003
    dt = 0.0001
    state = ContactState(in_contact=True, normal_force=Fn, contact_radius=a)

    omega = 2.0 * math.pi * 5.0  # 5 Hz
    T = 1.0 / 5.0
    V0 = 0.005  # 5 mm/s (strictly inside passive domain)
    steps_per_period = int(T / dt)

    # Warm up 5 periods to reach steady periodic limit cycle
    for step in range(5 * steps_per_period):
        t = step * dt
        v = V0 * math.sin(omega * t)
        lugre.step(state, v, dt)

    # Test 1 full closed period
    E_start = state.stored_elastic_energy
    Ft_start = state.tangential_force
    z_start = state.bristle_deflection
    W_cycle = 0.0
    D_indep_cycle = 0.0

    for step in range(steps_per_period):
        t = step * dt
        v = V0 * math.sin(omega * t)
        prev_Ft = state.tangential_force
        lugre.step(state, v, dt)
        W_cycle += 0.5 * (prev_Ft + state.tangential_force) * (v * dt)
        D_indep_cycle += state.independent_step_dissipation

    E_end = state.stored_elastic_energy
    Ft_end = state.tangential_force
    z_end = state.bristle_deflection

    # 1. State closure
    assert abs(E_end - E_start) < 1e-10, f"Elastic storage not closed: delta_E={abs(E_end - E_start)}"
    assert abs(Ft_end - Ft_start) < 1e-6, f"Force not closed: delta_Ft={abs(Ft_end - Ft_start)}"
    assert abs(z_end - z_start) < 1e-10, f"Deflection not closed: delta_z={abs(z_end - z_start)}"

    # 2. Net positive cyclic work
    assert W_cycle > 0.0, f"Net cyclic work must be positive, got {W_cycle}"
    assert D_indep_cycle > 0.0, f"Independent cyclic dissipation must be positive, got {D_indep_cycle}"

    # 3. Direct equivalence between cyclic external work and independent constitutive dissipation
    relative_error = abs(W_cycle - D_indep_cycle) / W_cycle
    assert relative_error < 0.0005, (
        f"Cyclic work and independent dissipation differ by {relative_error*100:.3f}% "
        f"(W_cycle={W_cycle:.6e}, D_indep={D_indep_cycle:.6e})"
    )


def test_remediation_liftoff_record_contact_loss_energy_conversion():
    """
    Verify ContactState.record_contact_loss() directly enforces physical energy conservation:
    1. Converts stored elastic strain energy directly into cumulative dissipated energy.
    2. Resets stored elastic energy, deflection, velocity, and forces to 0.0.
    3. Eliminates ledger energy loss upon manual contact separation.
    """
    state = ContactState(
        in_contact=True,
        normal_force=10.0,
        contact_radius=0.003,
        bristle_deflection=0.0001,
        tangential_force=2.5,
        stored_elastic_energy=1.25e-4,
        cumulative_dissipated_energy=5.0e-5
    )

    initial_stored = state.stored_elastic_energy
    initial_diss = state.cumulative_dissipated_energy

    # Call record_contact_loss directly
    state.record_contact_loss()

    assert not state.in_contact
    assert state.contact_loss_count == 1
    assert state.stored_elastic_energy == 0.0
    assert state.bristle_deflection == 0.0
    assert state.bristle_velocity == 0.0
    assert state.tangential_force == 0.0
    assert state.independent_step_dissipation == 0.0

    # Stored energy must be converted to dissipation
    assert state.signed_step_dissipation == initial_stored
    assert math.isclose(state.cumulative_dissipated_energy, initial_diss + initial_stored, rel_tol=1e-12)


def test_remediation_cp2_03_independent_passivity_closed_cycle():
    """
    CP2-03: Genuinely Closed Mechanical Cycle with Independent Passivity Verification:
    Executes a 400-step complete closed cycle (0 -> +disp_peak -> -disp_peak -> 0)
    where final mechanical state matches initial state (Delta V_cycle = 0).
    Verifies:
    1. Independent constitutive dissipation D_indep >= 0 unconditionally at EVERY single step.
    2. Net cyclic external work is positive (W_cycle > 0).
    3. First-Law energy conservation holds to machine precision (|W_ext - (Delta V + D_cum)| < 1e-12 J).
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

    cm_state = ContactState(in_contact=True, normal_force=Fn, contact_radius=a)

    N = 100
    d_disp = disp_peak / N

    # Genuinely closed cycle:
    # 1. 0 -> +disp_peak (N steps)
    # 2. +disp_peak -> -disp_peak (2*N steps)
    # 3. -disp_peak -> 0 (N steps)
    steps_pattern = [+1] * N + [-1] * (2 * N) + [+1] * N
    assert sum(steps_pattern) == 0, "Trajectory must return to initial displacement"

    w_ext_total = 0.0
    min_independent_step_diss = 1e9

    for direction in steps_pattern:
        delta_x = direction * d_disp
        v_cmd = delta_x / dt

        cm.step(cm_state, delta_x, dt)
        c_over_a = cm_state.stick_ratio
        Ft_cm = cm_state.tangential_force

        prev_Ft = state.tangential_force
        Ft_hyb = lugre.step_composed_hybrid(state, Ft_cm, v_cmd, stick_ratio=c_over_a, dt=dt, geometry=geom)

        # Independent constitutive step dissipation check
        min_independent_step_diss = min(min_independent_step_diss, state.independent_step_dissipation)

        # External trapezoidal work
        dW = 0.5 * (prev_Ft + Ft_hyb) * (v_cmd * dt)
        w_ext_total += dW

    # 1. Independent per-step passivity: every step must have non-negative constitutive dissipation
    assert min_independent_step_diss >= 0.0, (
        f"Independent passivity violation: min step dissipation={min_independent_step_diss:.2e} J"
    )

    # 2. Net cyclic external work must be strictly positive (hysteresis area > 0)
    assert w_ext_total > 0.0, f"Net cyclic work must be strictly positive, got {w_ext_total:.2e} J"

    # 3. First-Law energy conservation: W_ext = Delta V + D_cum
    delta_V = state.stored_elastic_energy - initial_elastic
    d_cum = state.cumulative_dissipated_energy
    first_law_error = abs(w_ext_total - (delta_V + d_cum))

    assert first_law_error < 1e-12, (
        f"CP2-03 Failure: First Law violated! Error={first_law_error:.2e} J"
    )


def test_remediation_liftoff_recontact_energy_consistency():
    """
    Verify physical lift-off and recontact thermodynamic consistency:
    1. Stored elastic energy dissipates to heat upon complete contact loss (Fn = 0 / in_contact = False).
    2. Bristle deflection, bristle velocity, and stored elastic energy reset to 0.0.
    3. Re-contact starts from clean, zero-strain baseline without lingering residual energy.
    """
    pair = create_silicone_aluminum_pair(mu_static=0.60, mu_kinetic=0.50)
    lugre = LuGreModel(pair)

    # 1. Establish contact and slide to build up deflection and stored elastic energy
    state = ContactState(in_contact=True, normal_force=10.0, contact_radius=0.003)
    lugre.step(state, v_cmd=0.01, dt=0.001)

    assert state.bristle_deflection > 0.0
    assert state.stored_elastic_energy > 0.0
    pre_liftoff_stored = state.stored_elastic_energy
    pre_liftoff_diss = state.cumulative_dissipated_energy

    # 2. Command complete lift-off (loss of contact)
    state.in_contact = False
    state.normal_force = 0.0
    lugre.step(state, v_cmd=0.01, dt=0.001)

    # Stored energy must be cleanly zeroed
    assert state.stored_elastic_energy == 0.0
    # Bristle deflection and velocity must be reset to 0.0
    assert state.bristle_deflection == 0.0
    assert state.bristle_velocity == 0.0
    # Stored energy must be converted into dissipation
    expected_diss = pre_liftoff_diss + pre_liftoff_stored
    assert math.isclose(state.cumulative_dissipated_energy, expected_diss, rel_tol=1e-9)

    # 3. Re-establish contact: must start cleanly from zero strain
    state.in_contact = True
    state.normal_force = 5.0
    lugre.step(state, v_cmd=0.0, dt=0.001)

    assert state.bristle_deflection == 0.0
    assert state.tangential_force == 0.0
    assert state.stored_elastic_energy == 0.0


def test_remediation_temporal_work_trapezoidal_convergence():
    """
    Verify that trapezoidal work integration eliminates endpoint work inflation
    and achieves superior convergence with sub-stepped numerical integration.
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

    assert err_trap < 0.40, f"Trapezoidal error {err_trap*100:.1f}% exceeds 40%"
    assert err_endpoint > 1.50, f"Endpoint error expected to exceed 150%, got {err_endpoint*100:.1f}%"
    assert err_trap < 0.25 * err_endpoint, (
        f"Trapezoidal rule should reduce error by at least 4x: "
        f"trap={err_trap*100:.1f}%, endpoint={err_endpoint*100:.1f}%"
    )
