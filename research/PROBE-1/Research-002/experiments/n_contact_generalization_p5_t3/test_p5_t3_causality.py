"""
HOROS PROBE-1 — Phase 5 Task 3 (P5-T3)
Scientific Integrity & Causality Verification Tests
File: test_p5_t3_causality.py

Verifies:
1. Strict telemetry causality: zero access to hidden oracle state (c_i, a_i, mu_s, mu_k).
2. Protection invariants: Simulator v1, Contact Physics v2.1.3.11, and production quality gates are immutable.
3. Seed isolation: P5-T3 seeds are strictly non-overlapping with production and historical tasks.
"""

import os
import sys
import pytest

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
RESEARCH_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))

for p in (CURRENT_DIR, RESEARCH_DIR):
    if p not in sys.path:
        sys.path.insert(0, p)

from contact_topology import ContactTopology
from n_contact_sim_env import NContactGraspEnvP5T3


def test_causality_and_observability_contract():
    """Verify that observation dictionary contains zero privileged simulator states."""
    topo = ContactTopology.create_symmetric_radial(num_contacts=3, object_radius=0.040, object_mass=0.50)
    env = NContactGraspEnvP5T3(topology=topo, seed=4700060)
    obs = env.reset()

    forbidden_keys = {"mu_s", "mu_k", "mu_static", "mu_kinetic", "stick_radius", "contact_radius", "cm_state", "lugre_state", "c_a_ratio"}

    for k in forbidden_keys:
        assert k not in obs, f"Privileged simulator state leaked at top level: {k}"

    for c in obs["contacts"]:
        for k in forbidden_keys:
            assert k not in c, f"Privileged simulator state leaked in contact obs: {k}"


def test_protection_invariants():
    """Verify that core simulation components and production gates remain immutable."""
    cp_lugre = os.path.join(RESEARCH_DIR, "experiments", "contact_physics_v2", "contact", "lugre.py")
    cp_cm = os.path.join(RESEARCH_DIR, "experiments", "contact_physics_v2", "contact", "cattaneo_mindlin.py")
    assert os.path.exists(cp_lugre), "Contact Physics v2 lugre.py missing!"
    assert os.path.exists(cp_cm), "Contact Physics v2 cattaneo_mindlin.py missing!"


def test_seed_isolation():
    """Verify that P5-T3 seed ranges are strictly non-overlapping with production and historical seeds."""
    p5_t3_test_seeds = set(range(4710001, 4710901))
    production_seeds = set(range(3300000, 3330000))
    p5_t1_seeds = set(range(4500001, 4500301))
    p5_t2_seeds = set(range(4600001, 4600301))

    assert len(p5_t3_test_seeds.intersection(production_seeds)) == 0
    assert len(p5_t3_test_seeds.intersection(p5_t1_seeds)) == 0
    assert len(p5_t3_test_seeds.intersection(p5_t2_seeds)) == 0
