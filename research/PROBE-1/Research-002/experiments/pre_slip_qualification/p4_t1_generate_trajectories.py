"""
HOROS PROBE-1 — Phase 4 Task 1 (P4-T1)
Canonical Partial-Slip Trajectory Generation Suite

Generates and persists high-fidelity partial-slip contact trajectories using
the certified Contact Physics v2.1.3.11 hybrid kernel (Cattaneo-Mindlin + LuGre).

Covers:
- Friction variations: mu_s in [0.30, 0.40, 0.50, 0.60, 0.70, 0.80]
- Normal loads: Fn in [3.0, 5.0, 10.0, 15.0] N
- Loading velocities: v in [1.0, 2.5, 5.0] mm/s
- Loading profiles: Monotonic ramp, micro-probe oscillation, normal force perturbation
- Clean and realistic tactile sensor noise channels (ATI Nano17 grade: sigma_F=0.02 N, sigma_delta=0.5 um)
"""

import os
import sys
import math
import json
import numpy as np
from typing import Dict, Any, List, Tuple

# Set up module path to contact_physics_v2
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
CP_V2_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "contact_physics_v2"))
if CP_V2_DIR not in sys.path:
    sys.path.insert(0, CP_V2_DIR)

from contact.geometry import SphericalContact
from contact.material import create_silicone_aluminum_pair, FrictionPair
from contact.contact_state import ContactState
from contact.cattaneo_mindlin import CattaneoMindlinModel
from contact.lugre import LuGreModel


def generate_single_trajectory(
    traj_id: int,
    mu_s: float,
    mu_k: float,
    Fn_nominal: float,
    v_nominal: float,
    loading_type: str = "monotonic",
    dt: float = 0.001,
    max_steps: int = 2500,
    post_slip_steps: int = 50,
    noise_seed: int = 42,
) -> Dict[str, Any]:
    """
    Generates a single contact trajectory with time-series signals and metadata.
    """
    np.random.seed(noise_seed)

    pair = create_silicone_aluminum_pair(mu_static=mu_s, mu_kinetic=mu_k)
    geom = SphericalContact(radius=0.015)  # 15 mm elastomeric fingertip
    cm = CattaneoMindlinModel(geom, pair)
    lugre = LuGreModel(pair)

    # Hertzian contact radius at nominal normal force
    E_star = pair.equivalent_youngs_modulus
    a_nominal = (3.0 * Fn_nominal * geom.radius / (4.0 * E_star)) ** (1.0 / 3.0)
    kt_0_theoretical = 8.0 * pair.equivalent_shear_modulus * a_nominal

    cm_state = ContactState(in_contact=True, normal_force=Fn_nominal, contact_radius=a_nominal)
    lugre_state = ContactState(in_contact=True, normal_force=Fn_nominal, contact_radius=a_nominal)

    t_list: List[float] = []
    ft_list: List[float] = []
    fn_list: List[float] = []
    disp_list: List[float] = []
    stick_ratio_list: List[float] = []
    phi_slip_list: List[float] = []
    true_kt_list: List[float] = []
    slip_vel_list: List[float] = []
    is_gross_list: List[bool] = []

    gross_slip_step = -1
    gross_slip_time = -1.0
    post_slip_count = 0

    step = 0
    while step < max_steps:
        t_current = step * dt

        # Determine normal force profile
        if loading_type == "Fn_perturbation":
            # +/- 10% normal force sinusoidal modulation at 15 Hz
            Fn_current = Fn_nominal * (1.0 + 0.10 * math.sin(2.0 * math.pi * 15.0 * t_current))
        else:
            Fn_current = Fn_nominal

        a_current = (3.0 * Fn_current * geom.radius / (4.0 * E_star)) ** (1.0 / 3.0)
        cm_state.normal_force = Fn_current
        cm_state.contact_radius = a_current
        lugre_state.normal_force = Fn_current
        lugre_state.contact_radius = a_current

        # Determine tangential velocity command
        if loading_type == "micro_probe":
            # Dynamic probing oscillation: 20 Hz micro-sine superimposed on ramp
            v_cmd = v_nominal + 0.001 * math.cos(2.0 * math.pi * 20.0 * t_current)
        else:
            v_cmd = v_nominal

        # Step hybrid synchronized kernel
        Ft_total, v_applied = lugre.step_hybrid_synchronized(
            cm_model=cm,
            cm_state=cm_state,
            state=lugre_state,
            v_cmd=v_cmd,
            dt=dt,
            geometry=geom,
            enforce_passivity_envelope=True,
        )

        c_over_a = cm_state.stick_ratio
        phi_slip = 1.0 - (c_over_a ** 3) if c_over_a < 1.0 else 0.0
        is_gross = cm_state.is_gross_slipping

        t_list.append(t_current)
        ft_list.append(Ft_total)
        fn_list.append(Fn_current)
        disp_list.append(cm_state.tangential_displacement)
        stick_ratio_list.append(c_over_a)
        phi_slip_list.append(phi_slip)
        true_kt_list.append(cm_state.tangent_stiffness)
        slip_vel_list.append(lugre_state.applied_slip_velocity)
        is_gross_list.append(is_gross)

        if is_gross and gross_slip_step < 0:
            gross_slip_step = step
            gross_slip_time = t_current

        if gross_slip_step >= 0:
            post_slip_count += 1
            if post_slip_count >= post_slip_steps:
                break

        step += 1

    t_arr = np.array(t_list, dtype=np.float64)
    ft_arr = np.array(ft_list, dtype=np.float64)
    fn_arr = np.array(fn_list, dtype=np.float64)
    disp_arr = np.array(disp_list, dtype=np.float64)
    stick_ratio_arr = np.array(stick_ratio_list, dtype=np.float64)
    phi_slip_arr = np.array(phi_slip_list, dtype=np.float64)
    true_kt_arr = np.array(true_kt_list, dtype=np.float64)
    slip_vel_arr = np.array(slip_vel_list, dtype=np.float64)
    is_gross_arr = np.array(is_gross_list, dtype=bool)

    # Add realistic sensor noise (ATI Nano17 specs: sigma_F=0.02 N, sigma_delta=0.5 um)
    noisy_ft = ft_arr + np.random.normal(0.0, 0.02, size=len(ft_arr))
    noisy_fn = fn_arr + np.random.normal(0.0, 0.02, size=len(fn_arr))
    noisy_disp = disp_arr + np.random.normal(0.0, 0.5e-6, size=len(disp_arr))

    return {
        "traj_id": traj_id,
        "mu_static": mu_s,
        "mu_kinetic": mu_k,
        "Fn_nominal": Fn_nominal,
        "v_nominal": v_nominal,
        "loading_type": loading_type,
        "dt": dt,
        "total_steps": len(t_arr),
        "gross_slip_step": gross_slip_step,
        "gross_slip_time": gross_slip_time,
        "kt_0_theoretical": kt_0_theoretical,
        "a_nominal": a_nominal,
        # Time-series
        "time": t_arr,
        "force_t": ft_arr,
        "force_n": fn_arr,
        "disp": disp_arr,
        "stick_ratio": stick_ratio_arr,
        "phi_slip": phi_slip_arr,
        "true_kt": true_kt_arr,
        "slip_velocity": slip_vel_arr,
        "is_gross_slipping": is_gross_arr,
        "noisy_force_t": noisy_ft,
        "noisy_force_n": noisy_fn,
        "noisy_disp": noisy_disp,
    }


def generate_p4_t1_dataset(
    output_dir: str = None,
) -> Tuple[str, str, Dict[str, Any]]:
    """
    Generates the canonical P4-T1 partial slip trajectory suite across the parameter grid.
    Saves data to .npz and summary manifest to .json.
    """
    if output_dir is None:
        output_dir = os.path.join(CURRENT_DIR, "data")
    os.makedirs(output_dir, exist_ok=True)

    mu_levels = [0.30, 0.40, 0.50, 0.60, 0.70, 0.80]
    fn_levels = [3.0, 5.0, 10.0, 15.0]  # Normal load in N
    v_levels = [0.001, 0.0025, 0.005]  # Velocity in m/s (1.0, 2.5, 5.0 mm/s)

    trajectories: List[Dict[str, Any]] = []
    traj_id = 0

    # 1. Standard Monotonic Ramps (72 trajectories)
    for mu in mu_levels:
        mu_k = 0.85 * mu
        for fn in fn_levels:
            for v in v_levels:
                traj = generate_single_trajectory(
                    traj_id=traj_id,
                    mu_s=mu,
                    mu_k=mu_k,
                    Fn_nominal=fn,
                    v_nominal=v,
                    loading_type="monotonic",
                    noise_seed=1000 + traj_id,
                )
                trajectories.append(traj)
                traj_id += 1

    # 2. Dynamic Micro-Probe Oscillations (12 trajectories across varied mu and Fn)
    for mu in [0.35, 0.50, 0.65, 0.80]:
        mu_k = 0.85 * mu
        for fn in [5.0, 10.0, 15.0]:
            traj = generate_single_trajectory(
                traj_id=traj_id,
                mu_s=mu,
                mu_k=mu_k,
                Fn_nominal=fn,
                v_nominal=0.0025,
                loading_type="micro_probe",
                noise_seed=2000 + traj_id,
            )
            trajectories.append(traj)
            traj_id += 1

    # 3. Normal Force Fluctuations (12 trajectories)
    for mu in [0.35, 0.50, 0.65, 0.80]:
        mu_k = 0.85 * mu
        for fn in [5.0, 10.0, 15.0]:
            traj = generate_single_trajectory(
                traj_id=traj_id,
                mu_s=mu,
                mu_k=mu_k,
                Fn_nominal=fn,
                v_nominal=0.0025,
                loading_type="Fn_perturbation",
                noise_seed=3000 + traj_id,
            )
            trajectories.append(traj)
            traj_id += 1

    total_trajectories = len(trajectories)

    # Package into arrays for .npz storage
    npz_path = os.path.join(output_dir, "p4_t1_partial_slip_trajectories.npz")
    manifest_path = os.path.join(output_dir, "p4_t1_trajectory_manifest.json")

    # Serialize trajectories
    save_dict = {}
    manifest_records = []
    for t_idx, tr in enumerate(trajectories):
        prefix = f"traj_{t_idx:03d}_"
        save_dict[f"{prefix}time"] = tr["time"]
        save_dict[f"{prefix}force_t"] = tr["force_t"]
        save_dict[f"{prefix}force_n"] = tr["force_n"]
        save_dict[f"{prefix}disp"] = tr["disp"]
        save_dict[f"{prefix}stick_ratio"] = tr["stick_ratio"]
        save_dict[f"{prefix}phi_slip"] = tr["phi_slip"]
        save_dict[f"{prefix}true_kt"] = tr["true_kt"]
        save_dict[f"{prefix}slip_velocity"] = tr["slip_velocity"]
        save_dict[f"{prefix}is_gross_slipping"] = tr["is_gross_slipping"]
        save_dict[f"{prefix}noisy_force_t"] = tr["noisy_force_t"]
        save_dict[f"{prefix}noisy_force_n"] = tr["noisy_force_n"]
        save_dict[f"{prefix}noisy_disp"] = tr["noisy_disp"]

        record = {
            "traj_id": tr["traj_id"],
            "mu_static": tr["mu_static"],
            "mu_kinetic": tr["mu_kinetic"],
            "Fn_nominal": tr["Fn_nominal"],
            "v_nominal": tr["v_nominal"],
            "loading_type": tr["loading_type"],
            "total_steps": tr["total_steps"],
            "gross_slip_step": tr["gross_slip_step"],
            "gross_slip_time": tr["gross_slip_time"],
            "kt_0_theoretical": tr["kt_0_theoretical"],
            "a_nominal": tr["a_nominal"],
        }
        manifest_records.append(record)

    save_dict["num_trajectories"] = np.array([total_trajectories], dtype=np.int32)
    np.savez_compressed(npz_path, **save_dict)

    manifest_summary = {
        "suite": "HOROS P4-T1 Partial Slip Trajectory Dataset",
        "date": "2026-11-23",
        "contact_kernel": "HOROS Contact Physics v2.1.3.11 (Cattaneo-Mindlin + LuGre)",
        "total_trajectories": total_trajectories,
        "loading_breakdown": {
            "monotonic": sum(1 for m in manifest_records if m["loading_type"] == "monotonic"),
            "micro_probe": sum(1 for m in manifest_records if m["loading_type"] == "micro_probe"),
            "Fn_perturbation": sum(1 for m in manifest_records if m["loading_type"] == "Fn_perturbation"),
        },
        "friction_range": [min(mu_levels), max(mu_levels)],
        "normal_force_range": [min(fn_levels), max(fn_levels)],
        "trajectories": manifest_records,
    }

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest_summary, f, indent=2)

    return npz_path, manifest_path, manifest_summary


def load_p4_t1_dataset(npz_path: str, manifest_path: str) -> List[Dict[str, Any]]:
    """
    Loads trajectories from .npz and .json manifest.
    """
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    data = np.load(npz_path)
    loaded_trajectories = []

    for tr_meta in manifest["trajectories"]:
        t_idx = tr_meta["traj_id"]
        prefix = f"traj_{t_idx:03d}_"
        traj_dict = dict(tr_meta)
        traj_dict["time"] = data[f"{prefix}time"]
        traj_dict["force_t"] = data[f"{prefix}force_t"]
        traj_dict["force_n"] = data[f"{prefix}force_n"]
        traj_dict["disp"] = data[f"{prefix}disp"]
        traj_dict["stick_ratio"] = data[f"{prefix}stick_ratio"]
        traj_dict["phi_slip"] = data[f"{prefix}phi_slip"]
        traj_dict["true_kt"] = data[f"{prefix}true_kt"]
        traj_dict["slip_velocity"] = data[f"{prefix}slip_velocity"]
        traj_dict["is_gross_slipping"] = data[f"{prefix}is_gross_slipping"]
        traj_dict["noisy_force_t"] = data[f"{prefix}noisy_force_t"]
        traj_dict["noisy_force_n"] = data[f"{prefix}noisy_force_n"]
        traj_dict["noisy_disp"] = data[f"{prefix}noisy_disp"]
        loaded_trajectories.append(traj_dict)

    return loaded_trajectories


if __name__ == "__main__":
    print("Generating P4-T1 partial slip trajectory suite...")
    npz, manifest, summary = generate_p4_t1_dataset()
    print(f"Generated {summary['total_trajectories']} trajectories successfully.")
    print(f"Data saved to: {npz}")
    print(f"Manifest saved to: {manifest}")
