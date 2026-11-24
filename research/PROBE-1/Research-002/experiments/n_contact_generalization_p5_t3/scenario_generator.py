"""
HOROS PROBE-1 — Phase 5 Task 3 (P5-T3)
N-Contact Generalization & Cooperative Physical Intelligence
File: scenario_generator.py

Generates 900 matched factorial benchmark scenarios across N=3, 4, 5 topologies:
- N=3: Seeds 4710001 - 4710300 (300 scenarios)
- N=4: Seeds 4710301 - 4710600 (300 scenarios)
- N=5: Seeds 4710601 - 4710900 (300 scenarios)
Factorial strata per topology:
  - Stratum 1: Symmetric Friction (mu_i = 0.55, centered load)
  - Stratum 2: Asymmetric / Mixed Friction (mu_i varying from 0.35 to 0.75, centered load)
  - Stratum 3: Asymmetric Geometry & Off-Center Loading (d_offset = 20 mm, torque perturbations, varied radii)
Disturbance regimes (20 eps per stratum):
  - shear_ramp, fast_ramp (8 mm/s), micro_probe (10 Hz), tangential_shock, torque_perturbation
"""

import math
from typing import Dict, Any, List


def generate_900_benchmark_configs() -> Dict[int, List[Dict[str, Any]]]:
    """Generates 900 benchmark configs grouped by N (300 each for N=3, 4, 5)."""
    configs_by_n = {3: [], 4: [], 5: []}
    disturbances = ["shear_ramp", "fast_ramp", "micro_probe", "tangential_shock", "torque_perturbation"]
    velocities = [0.002, 0.003, 0.004]

    seed_counter = 4710001

    for n in (3, 4, 5):
        configs = []
        scenario_id = 0

        # Stratum 1: Symmetric Friction (100 episodes)
        for i in range(100):
            dist = disturbances[i % len(disturbances)]
            v = 0.008 if dist == "fast_ramp" else velocities[i % len(velocities)]
            configs.append({
                "scenario_id": scenario_id,
                "seed": seed_counter,
                "num_contacts": n,
                "stratum": "symmetric_friction",
                "topology_type": "symmetric_radial",
                "object_radius": 0.040,
                "object_mass": 0.50,
                "mu_list": [0.55] * n,
                "radii_list": [0.015] * n,
                "load_offset_y": 0.0,
                "disturbance_type": dist,
                "v_shear": v,
                "contact_loss_events": [],
            })
            seed_counter += 1
            scenario_id += 1

        # Stratum 2: Asymmetric / Mixed Friction (100 episodes)
        for i in range(100):
            dist = disturbances[i % len(disturbances)]
            v = 0.008 if dist == "fast_ramp" else velocities[i % len(velocities)]
            # Generate heterogeneous friction distribution across contacts
            if n == 3:
                mu_list = [0.35, 0.75, 0.55]
            elif n == 4:
                mu_list = [0.35, 0.75, 0.45, 0.65]
            else: # n == 5
                mu_list = [0.35, 0.75, 0.40, 0.65, 0.55]

            configs.append({
                "scenario_id": scenario_id,
                "seed": seed_counter,
                "num_contacts": n,
                "stratum": "asymmetric_friction",
                "topology_type": "symmetric_radial",
                "object_radius": 0.040,
                "object_mass": 0.50,
                "mu_list": mu_list,
                "radii_list": [0.015] * n,
                "load_offset_y": 0.0,
                "disturbance_type": dist,
                "v_shear": v,
                "contact_loss_events": [],
            })
            seed_counter += 1
            scenario_id += 1

        # Stratum 3: Asymmetric Geometry & Off-Center Loading / Torque (100 episodes)
        for i in range(100):
            dist = disturbances[i % len(disturbances)]
            v = 0.008 if dist == "fast_ramp" else velocities[i % len(velocities)]
            # Varied fingertip radii and off-center loading
            radii = [0.012 + (j * 0.002) for j in range(n)]
            mu_list = [0.50 + (j * 0.03) for j in range(n)]

            # In 20 episodes of Stratum 3, inject a contact loss event to test recovery
            loss_events = []
            if i >= 80:
                loss_events = [{"contact_id": 0, "t_loss": 0.150, "t_recov": 0.350}]

            configs.append({
                "scenario_id": scenario_id,
                "seed": seed_counter,
                "num_contacts": n,
                "stratum": "off_center_and_torque",
                "topology_type": "symmetric_radial",
                "object_radius": 0.040,
                "object_mass": 0.50,
                "mu_list": mu_list,
                "radii_list": radii,
                "load_offset_y": 0.020,  # 20 mm load offset inducing torque
                "disturbance_type": dist,
                "v_shear": v,
                "contact_loss_events": loss_events,
            })
            seed_counter += 1
            scenario_id += 1

        configs_by_n[n] = configs

    return configs_by_n
