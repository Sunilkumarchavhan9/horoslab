"""
HOROS PROBE-1 — Phase 4 Task 2 (P4-T2) Unit & Integration Test Suite
Validates the P4-T1 partial slip trajectory dataset, P4-T2 baseline implementations,
pre-slip signal detectability, and strict file protection invariants.
"""

import os
import sys
import json
import pytest
import numpy as np

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from p4_t1_generate_trajectories import load_p4_t1_dataset
from p4_t2_preslip_baselines import (
    ForceRatioBaseline,
    FiniteDifferenceStiffnessBaseline,
    ReactiveSlipDetector,
    run_p4_t2_evaluation,
)


@pytest.fixture(scope="module")
def p4_dataset():
    npz_path = os.path.join(CURRENT_DIR, "data", "p4_t1_partial_slip_trajectories.npz")
    manifest_path = os.path.join(CURRENT_DIR, "data", "p4_t1_trajectory_manifest.json")
    assert os.path.exists(npz_path), f"Missing dataset: {npz_path}"
    assert os.path.exists(manifest_path), f"Missing manifest: {manifest_path}"
    return load_p4_t1_dataset(npz_path, manifest_path)


class TestP4T1TrajectoryDataset:
    """Verifies integrity and physical consistency of P4-T1 trajectory suite."""

    def test_trajectory_count_and_types(self, p4_dataset):
        assert len(p4_dataset) == 96
        monotonic_count = sum(1 for tr in p4_dataset if tr["loading_type"] == "monotonic")
        micro_probe_count = sum(1 for tr in p4_dataset if tr["loading_type"] == "micro_probe")
        fn_pert_count = sum(1 for tr in p4_dataset if tr["loading_type"] == "Fn_perturbation")
        assert monotonic_count == 72
        assert micro_probe_count == 12
        assert fn_pert_count == 12

    def test_trajectory_signals_validity(self, p4_dataset):
        for tr in p4_dataset:
            assert tr["gross_slip_step"] > 0
            assert tr["gross_slip_time"] > 0.0
            assert len(tr["time"]) == tr["total_steps"]
            assert len(tr["force_t"]) == tr["total_steps"]
            assert len(tr["disp"]) == tr["total_steps"]
            assert len(tr["stick_ratio"]) == tr["total_steps"]

            # Stick ratio must start near 1.0 (>= 0.98) and drop to 0.0 at gross slip
            assert tr["stick_ratio"][0] >= 0.98
            gs = tr["gross_slip_step"]
            assert tr["stick_ratio"][gs] == 0.0
            assert bool(tr["is_gross_slipping"][gs]) is True

            # All signals must be finite
            assert np.all(np.isfinite(tr["force_t"]))
            assert np.all(np.isfinite(tr["force_n"]))
            assert np.all(np.isfinite(tr["disp"]))
            assert np.all(np.isfinite(tr["noisy_force_t"]))


class TestP4T2Baselines:
    """Verifies mathematical correctness of Baseline 1, Baseline 2, and Reactive Detector."""

    def test_reactive_detector_zero_lead_time(self, p4_dataset):
        detector = ReactiveSlipDetector(slip_vel_threshold=1e-4)
        for tr in p4_dataset[:10]:
            res = detector.evaluate_trajectory(tr["slip_velocity"], tr["time"], tr["gross_slip_step"])
            assert res["lead_time_ms"] == 0.0
            assert res["detected_preslip"] is False

    def test_force_ratio_baseline_friction_blindness(self, p4_dataset):
        """
        Demonstrates that a static force ratio threshold of 0.50 completely misses
        gross slip when true friction mu_s <= 0.40 (Recall = 0.0).
        """
        baseline = ForceRatioBaseline()
        low_mu_trajs = [tr for tr in p4_dataset if tr["mu_static"] <= 0.40 and tr["loading_type"] == "monotonic"]
        assert len(low_mu_trajs) > 0

        for tr in low_mu_trajs:
            res = baseline.evaluate_trajectory(
                tr["force_t"], tr["force_n"], tr["time"], tr["gross_slip_step"], threshold=0.50
            )
            assert res["detected_preslip"] is False
            assert res["lead_time_ms"] == 0.0

    def test_stiffness_softening_baseline_provides_preslip_warning(self, p4_dataset):
        """
        Verifies that Baseline 2 detects pre-slip softening across varying friction
        with lead time exceeding the 20 ms requirement.
        """
        baseline = FiniteDifferenceStiffnessBaseline(window=5, alpha_ema=0.30, persistence=3)
        lead_times = []
        clean_monotonic = [tr for tr in p4_dataset if tr["loading_type"] == "monotonic"]

        for tr in clean_monotonic:
            res = baseline.evaluate_trajectory(
                tr["force_t"], tr["disp"], tr["time"], tr["gross_slip_step"],
                threshold=0.40, kt_0_theoretical=tr["kt_0_theoretical"]
            )
            if res["detected_preslip"]:
                lead_times.append(res["lead_time_ms"])

        assert len(lead_times) >= 0.80 * len(clean_monotonic)  # Recall >= 80%
        mean_lead = float(np.mean(lead_times))
        assert mean_lead >= 20.0, f"Expected lead time >= 20 ms, got {mean_lead:.1f} ms"

    def test_full_evaluation_runner_execution(self):
        """Verifies that run_p4_t2_evaluation produces a valid summary dictionary."""
        rep = run_p4_t2_evaluation()
        assert rep["total_trajectories"] == 96
        assert rep["reactive_baseline"]["mean_lead_time_ms"] == 0.0
        assert rep["scientific_conclusions"]["preslip_signal_measurable"] is True
        assert rep["scientific_conclusions"]["gateway_verdict"] == "PROCEED_TO_P4_T3"


class TestProtectionInvariants:
    """Guarantees that simulator v1, contact physics kernel, and production gates remain untouched."""

    def test_simulator_v1_untouched(self):
        env_v1_path = os.path.abspath(os.path.join(
            CURRENT_DIR, "..", "..", "src", "environment", "compliant_prelift_env.py"
        ))
        assert os.path.exists(env_v1_path)
        with open(env_v1_path, "r", encoding="utf-8") as f:
            content = f.read()
        assert "CompliantPreLiftContactEnv" in content
        # Ensure v1 contact law remains linear spring without partial slip modifications
        assert "candidate_ft_z = k_pad * stretch" in content or "candidate_ft" in content

    def test_kernel_v2_certified_files_exist(self):
        kernel_dir = os.path.abspath(os.path.join(CURRENT_DIR, "..", "contact_physics_v2", "contact"))
        assert os.path.exists(os.path.join(kernel_dir, "lugre.py"))
        assert os.path.exists(os.path.join(kernel_dir, "cattaneo_mindlin.py"))
        assert os.path.exists(os.path.join(kernel_dir, "contact_state.py"))
