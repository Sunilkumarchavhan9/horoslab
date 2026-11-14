"""Unit and integration tests for the HOROS Model Teaching Infrastructure.

Verifies:
1. Teacher Model Registry registration, filtering, serialization, and provenance hashing.
2. Teacher Inference Engine querying, deterministic caching, rate limits, and async batching.
3. External Teacher REST API adapter schema formatting, response validation, and token tracking.
4. Synthetic Experience Factory execution on authoritative PROBE-1 simulation environments:
   - CompliantPreLiftContactEnv
   - PegInHoleEnv
5. Physics Validation Engine (Grounded Firewall):
   - Analytic sanity & kinematic velocity limits
   - Simulator geometric boundary checks
   - Privileged parameter (Coulomb cone) firewall gatekeeping
6. Student Distillation Engine:
   - Verified zero ground-truth contact mode leakage into history observations
   - Bitwise invariance of history input tensors under ground-truth mode perturbation
   - Strict collation of ground-truth modes exclusively into training loss targets
7. Student Evaluation Engine:
   - Explicit software smoke test labeling (is_smoke_test=True) and prominent disclaimers
   - Multi-horizon rollout MSE calculation
   - Read-only checkpoint loading of frozen B1-B3 baselines
"""

from __future__ import annotations

import copy
import json
import os
import sys
import tempfile
from pathlib import Path
from typing import Any, Dict, List

import numpy as np
import pytest

R002_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
for p in (R002_ROOT, os.path.join(R002_ROOT, "src")):
    if p not in sys.path:
        sys.path.insert(0, p)

from teaching import (
    AdversarialMockTeacher,
    BenchmarkResults,
    DeterministicMockTeacher,
    EnvironmentSamplingSpec,
    ExternalRestApiTeacher,
    PhysicsValidationEngine,
    StudentDistillationEngine,
    StudentEvaluationEngine,
    SyntheticEpisodeRecord,
    SyntheticExperienceFactory,
    TeacherInferenceEngine,
    TeacherModelDescriptor,
    TeacherModelRegistry,
    TeacherProvider,
    TeacherQueryPayload,
    ValidationVerdict,
)


@pytest.fixture
def clean_registry() -> TeacherModelRegistry:
    return TeacherModelRegistry()


@pytest.fixture
def valid_deterministic_descriptor() -> TeacherModelDescriptor:
    return TeacherModelDescriptor(
        model_id="test_teacher_det_v1",
        display_name="Test Deterministic Teacher",
        version="1.0.0",
        provider=TeacherProvider.MOCK_DETERMINISTIC,
        supported_modalities=["state_vector"],
        capabilities=["trajectory_proposal"],
        license="internal_test",
        has_representations=True,
        representation_dim=64,
    )


# -----------------------------------------------------------------------------
# Module 01: Teacher Model Registry Tests
# -----------------------------------------------------------------------------

def test_registry_registration_and_retrieval(
    clean_registry: TeacherModelRegistry, valid_deterministic_descriptor: TeacherModelDescriptor
) -> None:
    reg = clean_registry
    desc = valid_deterministic_descriptor

    reg.register(desc)
    assert reg.has(desc.model_id)
    retrieved = reg.get(desc.model_id)
    assert retrieved.model_id == desc.model_id
    assert retrieved.version == desc.version

    # Filtering
    avail = reg.list_available(capability="trajectory_proposal")
    assert len(avail) == 1
    assert avail[0].model_id == desc.model_id

    empty_filter = reg.list_available(capability="non_existent_capability")
    assert len(empty_filter) == 0


def test_registry_validation_errors() -> None:
    with pytest.raises(ValueError, match="model_id must be a non-empty string"):
        TeacherModelDescriptor(
            model_id="",
            display_name="Invalid",
            version="1.0.0",
            provider=TeacherProvider.MOCK_DETERMINISTIC,
            supported_modalities=["state_vector"],
            capabilities=["test"],
            license="test",
        )


def test_registry_manifest_export_import(
    clean_registry: TeacherModelRegistry, valid_deterministic_descriptor: TeacherModelDescriptor
) -> None:
    clean_registry.register(valid_deterministic_descriptor)

    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        clean_registry.export_manifest(tmp_path)
        new_reg = TeacherModelRegistry()
        new_reg.import_manifest(tmp_path)

        assert new_reg.has(valid_deterministic_descriptor.model_id)
        imported = new_reg.get(valid_deterministic_descriptor.model_id)
        assert imported.model_id == valid_deterministic_descriptor.model_id
        assert imported.provider == TeacherProvider.MOCK_DETERMINISTIC
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


# -----------------------------------------------------------------------------
# Module 02: Teacher Inference Engine Tests (Mock & Real REST Adapter)
# -----------------------------------------------------------------------------

def test_inference_deterministic_query_and_caching(
    clean_registry: TeacherModelRegistry, valid_deterministic_descriptor: TeacherModelDescriptor
) -> None:
    reg = clean_registry
    desc = valid_deterministic_descriptor
    reg.register(desc)

    with tempfile.TemporaryDirectory() as tmp_cache:
        engine = TeacherInferenceEngine(reg, cache_dir=tmp_cache)
        adapter = DeterministicMockTeacher(desc)
        engine.register_adapter(desc.model_id, adapter)

        payload = TeacherQueryPayload(
            task_id="compliant_prelift",
            query_type="trajectory_proposal",
            current_state=np.zeros(23, dtype=np.float32),
            target_horizon=10,
            seed=42,
            request_representations=True,
        )

        res1 = engine.query(desc.model_id, payload)
        assert res1.cached is False
        assert res1.candidate_actions.shape == (10, 5)
        assert res1.latent_representations is not None
        assert res1.latent_representations.shape == (10, 64)

        # Second query: must be retrieved directly from disk cache
        res2 = engine.query(desc.model_id, payload)
        assert res2.cached is True
        assert np.array_equal(res1.candidate_actions, res2.candidate_actions)


def test_inference_adversarial_error_handling(clean_registry: TeacherModelRegistry) -> None:
    desc = TeacherModelDescriptor(
        model_id="adv_teacher",
        display_name="Adversarial Teacher",
        version="1.0.0",
        provider=TeacherProvider.MOCK_ADVERSARIAL,
        supported_modalities=["state_vector"],
        capabilities=["stress_testing"],
        license="internal",
    )
    clean_registry.register(desc)

    engine = TeacherInferenceEngine(clean_registry, max_retries=2, backoff_factor=0.01)
    adapter = AdversarialMockTeacher(desc, fault_mode="timeout_error")
    engine.register_adapter(desc.model_id, adapter)

    payload = TeacherQueryPayload(
        task_id="peg_in_hole",
        query_type="trajectory_proposal",
        current_state=np.zeros(15, dtype=np.float32),
        target_horizon=5,
    )

    # First attempt fails with TimeoutError, second succeeds
    res = engine.query(desc.model_id, payload)
    assert res.candidate_actions.shape == (5, 6)
    assert adapter.call_count == 2


def test_external_teacher_adapter_and_async_batch(clean_registry: TeacherModelRegistry) -> None:
    desc = TeacherModelDescriptor(
        model_id="gpt-4o-physics-teacher",
        display_name="External Commercial Teacher",
        version="2026-v1",
        provider=TeacherProvider.EXTERNAL_REST_API,
        supported_modalities=["state_vector", "instruction"],
        capabilities=["macro_trajectory_teacher"],
        license="commercial_api",
        endpoint_url="mock://api.openai.com/v1/chat/completions",
    )
    clean_registry.register(desc)

    adapter = ExternalRestApiTeacher(
        descriptor=desc,
        endpoint_url="mock://api.openai.com/v1/chat/completions",
        api_key_env_var="MOCK_PROVIDER_TOKEN_ENV_NAME",
        provider_format="openai",
        rate_limit_rpm=600,
    )

    engine = TeacherInferenceEngine(clean_registry, max_concurrency=4)
    engine.register_adapter(desc.model_id, adapter)

    payloads = [
        TeacherQueryPayload(
            task_id="compliant_prelift",
            query_type="trajectory_proposal",
            current_state=np.zeros(23, dtype=np.float32),
            target_horizon=15,
            seed=100 + i,
        )
        for i in range(4)
    ]

    # Asynchronous parallel batch query
    results = engine.query_batch(desc.model_id, payloads, max_workers=4)
    assert len(results) == 4
    for r in results:
        assert r.candidate_actions.shape == (15, 5)
        assert r.token_usage.get("prompt_tokens", 0) > 0


# -----------------------------------------------------------------------------
# Module 03: Synthetic Experience Factory Tests (Authoritative Simulators)
# -----------------------------------------------------------------------------

def test_experience_factory_generation_with_real_simulators(
    clean_registry: TeacherModelRegistry, valid_deterministic_descriptor: TeacherModelDescriptor
) -> None:
    reg = clean_registry
    desc = valid_deterministic_descriptor
    reg.register(desc)

    engine = TeacherInferenceEngine(reg)
    engine.register_adapter(desc.model_id, DeterministicMockTeacher(desc))

    spec = EnvironmentSamplingSpec(
        friction_range=(0.20, 0.80),
        mass_range_kg=(0.25, 0.50),
        clearance_range_mm=(0.20, 1.00),
        default_episode_length=20,
        dt_s=0.01,
    )
    factory = SyntheticExperienceFactory(engine, sampling_spec=spec)

    # 1. Test Task 2: CompliantPreLiftContactEnv
    ep_prelift = factory.generate_episode("compliant_prelift", desc.model_id, seed=123)
    assert ep_prelift.states.shape == (20, 23)
    assert ep_prelift.actions.shape == (20, 5)
    assert ep_prelift.next_states.shape == (20, 23)
    assert ep_prelift.wrenches.shape == (20, 6)
    assert ep_prelift.env_metadata["simulator_env"] == "CompliantPreLiftContactEnv"
    assert len(ep_prelift.provenance_hash) == 64

    # 2. Test Task 1: PegInHoleEnv
    ep_peg = factory.generate_episode("peg_in_hole", desc.model_id, seed=456)
    assert ep_peg.states.shape == (20, 15)
    assert ep_peg.actions.shape == (20, 6)
    assert ep_peg.next_states.shape == (20, 15)
    assert ep_peg.wrenches.shape == (20, 6)
    assert ep_peg.env_metadata["simulator_env"] == "PegInHoleEnv"

    # Determinism check
    ep_prelift_dup = factory.generate_episode("compliant_prelift", desc.model_id, seed=123)
    assert np.array_equal(ep_prelift.states, ep_prelift_dup.states)
    assert ep_prelift.provenance_hash == ep_prelift_dup.provenance_hash


# -----------------------------------------------------------------------------
# Module 04: Physics Validation Engine (Grounded Firewall) Tests
# -----------------------------------------------------------------------------

def test_physics_firewall_analytic_vs_geometric_vs_privileged() -> None:
    validator = PhysicsValidationEngine(
        max_normal_force_n=20.0,
        max_shear_force_n=15.0,
        max_linear_velocity_mps=0.10,
        max_penetration_mm=0.50,
        friction_margin=0.10,
    )

    T = 20
    states = np.zeros((T, 23), dtype=np.float32)
    actions = np.zeros((T, 5), dtype=np.float32)
    wrenches = np.zeros((T, 6), dtype=np.float32)

    # Valid baseline trajectory
    rep_valid = validator.validate_trajectory("compliant_prelift", states, actions, wrenches)
    assert rep_valid.is_valid is True
    assert rep_valid.verdict == ValidationVerdict.PHYSICALLY_VALID

    # 1. Analytic Kinematic Bound: Velocity limit violation
    actions_fast = actions.copy()
    actions_fast[5, 4] = 2.50  # 2.50 mm/step at dt=0.01 -> 0.25 m/s > 0.10 m/s
    rep_fast = validator.validate_trajectory("compliant_prelift", states, actions_fast, wrenches)
    assert rep_fast.is_valid is False
    assert rep_fast.verdict == ValidationVerdict.REJECTED_KINEMATIC_LIMIT

    # 2. Analytic Force Bound: Normal crush force violation
    states_crush = states.copy()
    states_crush[3, 12:16] = 6.0  # 4 * 6.0 = 24.0 N > 20.0 N
    rep_crush = validator.validate_trajectory("compliant_prelift", states_crush, actions, wrenches)
    assert rep_crush.is_valid is False
    assert rep_crush.verdict == ValidationVerdict.REJECTED_FORCE_LIMIT

    # 3. Privileged Parameter Firewall: Coulomb cone violation using mu_sim
    states_contact = states.copy()
    states_contact[2, 12:16] = 2.5  # Fn = 10.0 N
    wrenches_slip = wrenches.copy()
    wrenches_slip[2, 2] = 8.0  # Shear = 8.0 N -> Ratio = 0.80 >> mu_sim = 0.50
    rep_slip = validator.validate_trajectory(
        "compliant_prelift",
        states_contact,
        actions,
        wrenches_slip,
        env_metadata={"initial_mu_true": 0.50},
    )
    assert rep_slip.is_valid is False
    assert rep_slip.verdict == ValidationVerdict.REJECTED_FRICTION_CONE

    # 4. Simulator Geometric Boundary: Table penetration
    states_pen = states.copy()
    states_pen[7, 22] = -1.20  # Penetration = 1.20 mm deeper than 0.50 mm
    rep_pen = validator.validate_trajectory("compliant_prelift", states_pen, actions, wrenches)
    assert rep_pen.is_valid is False
    assert rep_pen.verdict == ValidationVerdict.REJECTED_PENETRATION


# -----------------------------------------------------------------------------
# Module 05: Student Distillation Engine Tests (Strict Non-Leakage)
# -----------------------------------------------------------------------------

def test_distillation_zero_mode_leakage_strict_invariance() -> None:
    """CRITICAL REGRESSION TEST: Verifies that mutating simulator ground-truth modes

    (ep.modes) produces ZERO change in observation history feature tensors.
    """
    distiller = StudentDistillationEngine(history_horizon=5, future_horizon=10, batch_size=2)

    T = 25
    states = np.ones((T, 23), dtype=np.float32) * 0.1
    actions = np.zeros((T, 5), dtype=np.float32)
    next_states = np.ones((T, 23), dtype=np.float32) * 0.15
    wrenches = np.ones((T, 6), dtype=np.float32) * 0.5
    next_wrenches = np.ones((T, 6), dtype=np.float32) * 0.6
    orig_modes = np.full(T, 2, dtype=np.int64)  # Ground-truth: Sticking (2)

    ep_orig = SyntheticEpisodeRecord(
        episode_id="ep_orig",
        seed=1,
        task="compliant_prelift",
        states=states,
        actions=actions,
        next_states=next_states,
        wrenches=wrenches,
        next_wrenches=next_wrenches,
        modes=orig_modes,
        rewards=np.zeros(T, dtype=np.float32),
        env_metadata={"initial_mu_true": 0.50, "initial_mass_kg": 0.35},
        provenance_hash="orig_hash",
    )

    # Create mutated episode with completely different ground-truth modes
    ep_mutated = copy.deepcopy(ep_orig)
    ep_mutated.modes = np.full(T, 4, dtype=np.int64)  # Mutate all modes to Seated (4)
    ep_mutated.provenance_hash = "mutated_hash"

    batches_orig, manifest_orig = distiller.prepare_dataset_batches("compliant_prelift", [ep_orig])
    batches_mutated, manifest_mutated = distiller.prepare_dataset_batches("compliant_prelift", [ep_mutated])

    # 1. Assert bitwise identical history observation tensors!
    assert np.array_equal(batches_orig[0].history_obs, batches_mutated[0].history_obs)
    assert np.array_equal(batches_orig[0].future_actions, batches_mutated[0].future_actions)

    # 2. Assert ground-truth mode targets reflect the respective ground truths (available ONLY as target loss)
    assert np.all(batches_orig[0].target_modes == 2)
    assert np.all(batches_mutated[0].target_modes == 4)

    # 3. Assert automated verification passed
    assert manifest_orig.zero_leakage_verified is True
    assert manifest_mutated.zero_leakage_verified is True


def test_distillation_leakage_verification_method() -> None:
    distiller = StudentDistillationEngine(history_horizon=5, future_horizon=10)

    T = 20
    ep = SyntheticEpisodeRecord(
        episode_id="ep_check",
        seed=42,
        task="compliant_prelift",
        states=np.zeros((T, 23), dtype=np.float32),
        actions=np.zeros((T, 5), dtype=np.float32),
        next_states=np.zeros((T, 23), dtype=np.float32),
        wrenches=np.zeros((T, 6), dtype=np.float32),
        next_wrenches=np.zeros((T, 6), dtype=np.float32),
        modes=np.zeros(T, dtype=np.int64),
        rewards=np.zeros(T, dtype=np.float32),
        env_metadata={"initial_mu_true": 0.50, "initial_mass_kg": 0.35},
    )

    assert distiller.verify_zero_leakage([ep]) is True


# -----------------------------------------------------------------------------
# Module 06: Student Evaluation Engine Tests (Smoke Test Flagging)
# -----------------------------------------------------------------------------

def test_evaluation_engine_smoke_test_and_disclaimer() -> None:
    evaluator = StudentEvaluationEngine()

    N, H, D = 10, 20, 23
    gt_traj = np.ones((N, H, D), dtype=np.float32)
    pred_traj = np.ones((N, H, D), dtype=np.float32) * 1.05

    mu = np.linspace(0.2, 0.8, N)
    mass = np.linspace(0.3, 0.6, N)

    res = evaluator.evaluate_synthetic_smoke_test(
        model_id="test_pipeline_check",
        task="compliant_prelift",
        pred_trajectories=pred_traj,
        gt_trajectories=gt_traj,
        pred_mu=mu,
        gt_mu=mu,
        pred_mass=mass,
        gt_mass=mass,
    )

    assert isinstance(res, BenchmarkResults)
    assert res.is_smoke_test is True
    assert "SOFTWARE PIPELINE SMOKE TEST" in res.disclaimer
    assert "Exactly 0 student model parameters were updated" in res.disclaimer

    report = evaluator.render_report_md(res)
    assert "SOFTWARE PIPELINE SMOKE TEST ONLY" in report
    assert "No World Model vNext student training" in report
    assert "Pipeline Smoke Test:** `True`" in report


def test_evaluation_engine_checkpoint_loader_interface() -> None:
    evaluator = StudentEvaluationEngine()
    # Checkpoint loading contract
    checkpoint_path = os.path.join(
        R002_ROOT, "checkpoints", "phase3_4", "compliant_prelift", "M4_acmm", "b1_deterministic.pt"
    )
    if os.path.exists(checkpoint_path):
        model, payload = evaluator.load_frozen_baseline_checkpoint(checkpoint_path)
        assert model is not None
        assert payload["architecture_id"] == "B1"


# -----------------------------------------------------------------------------
# Module 07: Physical Data Contract and Invariance Tests
# -----------------------------------------------------------------------------

def test_prelift_resultant_wrench_analytical_cases() -> None:
    from src.selection_aware.counterfactual_rollout import compute_prelift_resultant_wrench

    # 4 finger symmetric arrangement around cylinder at r = 35 mm, z = 40 mm, workpiece at z = 10 mm
    finger_pos = np.array([
        [-35.0, 0.0, 40.0],
        [35.0, 0.0, 40.0],
        [0.0, 35.0, 40.0],
        [0.0, -35.0, 40.0],
    ], dtype=np.float32)
    obj_pos = np.array([0.0, 0.0, 10.0], dtype=np.float32)

    # Case 1: 4 equal normal forces (4.0 N each), 0 shear -> Net wrench is exactly zero
    fn_equal = np.array([4.0, 4.0, 4.0, 4.0], dtype=np.float32)
    ft_zero = np.zeros((4, 2), dtype=np.float32)
    w_case1 = compute_prelift_resultant_wrench(finger_pos, obj_pos, fn_equal, ft_zero)
    np.testing.assert_allclose(w_case1, np.zeros(6), atol=1e-5)

    # Case 2: 4 equal normal forces (4.0 N), uniform 1.0 N vertical pad shear -> Fz = 4.0 N, zero net torque
    ft_uniform_lift = np.zeros((4, 2), dtype=np.float32)
    ft_uniform_lift[:, 1] = 1.0
    w_case2 = compute_prelift_resultant_wrench(finger_pos, obj_pos, fn_equal, ft_uniform_lift)
    np.testing.assert_allclose(w_case2[:3], [0.0, 0.0, 4.0], atol=1e-5)
    np.testing.assert_allclose(w_case2[3:], [0.0, 0.0, 0.0], atol=1e-5)

    # Case 3: Uneven vertical shear: Finger 0 has 2.0 N vertical shear, Finger 1 has 0.0 N
    # Lever arm r_0_x = -0.035 m, F_z = 2.0 N -> Torque tau_y = -0.035 * 2.0 = -0.070 Nm (or +0.070 depending on coordinate sign)
    ft_uneven = np.zeros((4, 2), dtype=np.float32)
    ft_uneven[0, 1] = 2.0
    w_case3 = compute_prelift_resultant_wrench(finger_pos, obj_pos, fn_equal, ft_uneven)
    assert abs(w_case3[2] - 2.0) < 1e-5
    # Torque about Y axis must be non-zero from unbalanced shear at lever arm 35 mm
    assert abs(abs(w_case3[4]) - 0.070) < 1e-4

    # Case 4: Permutation invariance: cyclic shift of fingers preserves resultant force and torque magnitude
    shift_pos = np.roll(finger_pos, 1, axis=0)
    shift_fn = np.roll(fn_equal, 1)
    shift_ft = np.roll(ft_uneven, 1, axis=0)
    w_shifted = compute_prelift_resultant_wrench(shift_pos, obj_pos, shift_fn, shift_ft)
    assert abs(w_shifted[2] - w_case3[2]) < 1e-5
    assert abs(np.linalg.norm(w_shifted[3:]) - np.linalg.norm(w_case3[3:])) < 1e-4


def test_contact_mode_estimator_physical_invariance() -> None:
    from src.teaching.distiller import estimate_observable_mode_probabilities

    # State: 12 kinematics, 4 normal forces [12:16], 4 slip vels [16:20], 3 obj pos [20:23]
    state = np.zeros(23, dtype=np.float32)
    state[12:16] = [2.5, 2.5, 2.5, 2.5]  # 4 equal normal forces = 10 N total
    state[16:20] = [0.0, 0.0, 0.0, 0.0]  # Zero slip velocity
    wrench_zero_shear = np.zeros(6, dtype=np.float32)  # Zero resultant shear Fz=0

    # 4 equal normal forces with zero shear MUST be Mode 2 (Sticking), NEVER Sliding (Mode 3)
    probs_sticking = estimate_observable_mode_probabilities(wrench_zero_shear, state)
    assert np.argmax(probs_sticking) == 2  # Mode 2 is Sticking
    assert probs_sticking[2] > 0.70
    assert probs_sticking[3] <= 0.10  # Mode 3 (Sliding) is suppressed

    # Genuine vertical shear Fz = 8.8 N (88% of 10 N, exceeds 85% sliding threshold)
    wrench_high_shear = np.array([0.0, 0.0, 8.8, 0.0, 0.0, 0.0], dtype=np.float32)
    probs_sliding = estimate_observable_mode_probabilities(wrench_high_shear, state)
    assert np.argmax(probs_sliding) == 3  # Mode 3 is Sliding
    assert probs_sliding[3] > 0.50

    # Physical slip velocity v_slip = 0.005 m/s (5 mm/s > 0.1 mm/s threshold)
    state_slipping = state.copy()
    state_slipping[16] = 0.005
    probs_slip_vel = estimate_observable_mode_probabilities(wrench_zero_shear, state_slipping)
    assert np.argmax(probs_slip_vel) == 3
    assert probs_slip_vel[3] > 0.50


def test_physics_validator_coulomb_cone_and_torque() -> None:
    validator = PhysicsValidationEngine()

    T = 10
    states = np.zeros((T, 23), dtype=np.float32)
    states[:, 12:16] = 2.5  # 10 N normal force total
    actions = np.zeros((T, 5), dtype=np.float32)

    # Case 1: Valid shear: Fz = 1.0 N, FN = 10.0 N, mu_true = 0.50 -> Fz / FN = 0.10 <= 0.50
    wrenches_valid = np.zeros((T, 6), dtype=np.float32)
    wrenches_valid[:, 2] = 1.0  # Fz = 1.0 N
    v_valid = validator.validate_trajectory(
        task_id="compliant_prelift",
        states=states,
        actions=actions,
        wrenches=wrenches_valid,
        env_metadata={"initial_mu_true": 0.50, "initial_mass_kg": 0.35},
    )
    assert v_valid.verdict == ValidationVerdict.PHYSICALLY_VALID
    assert v_valid.is_valid is True

    # Case 2: Friction cone violation: Fz = 8.0 N > mu * FN = 0.50 * 10.0 N = 5.0 N
    wrenches_invalid = np.zeros((T, 6), dtype=np.float32)
    wrenches_invalid[:, 2] = 8.0  # Fz = 8.0 N
    v_invalid = validator.validate_trajectory(
        task_id="compliant_prelift",
        states=states,
        actions=actions,
        wrenches=wrenches_invalid,
        env_metadata={"initial_mu_true": 0.50, "initial_mass_kg": 0.35},
    )
    assert v_invalid.verdict == ValidationVerdict.REJECTED_FRICTION_CONE
    assert v_invalid.is_valid is False

    # Case 3: Excessive tilting torque violation: tau = 3.5 Nm > 2.0 Nm
    wrenches_torque = np.zeros((T, 6), dtype=np.float32)
    wrenches_torque[:, 2] = 1.0
    wrenches_torque[:, 4] = 3.5  # Tau_y = 3.5 Nm
    v_torque = validator.validate_trajectory(
        task_id="compliant_prelift",
        states=states,
        actions=actions,
        wrenches=wrenches_torque,
        env_metadata={"initial_mu_true": 0.50, "initial_mass_kg": 0.35},
    )
    assert v_torque.verdict == ValidationVerdict.REJECTED_FORCE_LIMIT
    assert v_torque.is_valid is False


def test_peginhole_wrench_invariance() -> None:
    from src.selection_aware.counterfactual_rollout import extract_env_state_and_wrench

    obs_pih = {
        "pos": np.array([0.1, -0.2, 5.0], dtype=np.float32),
        "vel": np.array([0.0, 0.0, -1.0], dtype=np.float32),
        "rot": np.array([0.02, -0.01, 0.0], dtype=np.float32),
        "wrench": np.array([1.5, -2.0, 12.0, 0.05, -0.04, 0.02], dtype=np.float32),
    }
    s, w = extract_env_state_and_wrench(obs_pih, task="peg_in_hole")
    assert len(s) == 15
    assert len(w) == 6
    np.testing.assert_array_equal(w, obs_pih["wrench"])


# -----------------------------------------------------------------------------
# Module 08: External Teacher Provider Adapter & HTTP Mock Tests
# -----------------------------------------------------------------------------

def test_external_teacher_provider_headers() -> None:
    MOCK_PROVIDER_TOKEN_PLACEHOLDER = "mock-provider-credential-value"

    desc = TeacherModelDescriptor(
        model_id="test_ext_provider_headers",
        display_name="Test External Headers",
        version="1.0.0",
        provider=TeacherProvider.EXTERNAL_REST_API,
        endpoint_url="http://127.0.0.1:8080/v1",
        supported_modalities=["state_vector"],
        capabilities=["trajectory_proposal"],
        license="commercial",
    )

    # OpenAI / Generic
    teacher_openai = ExternalRestApiTeacher(
        descriptor=desc,
        endpoint_url="http://127.0.0.1:8080/v1/chat",
        api_key_env_var="MOCK_OPENAI_KEY_VAR",
        provider_format="openai",
    )
    headers_openai = teacher_openai.get_request_headers(MOCK_PROVIDER_TOKEN_PLACEHOLDER)
    assert headers_openai["Authorization"] == f"Bearer {MOCK_PROVIDER_TOKEN_PLACEHOLDER}"

    # Anthropic
    teacher_anthropic = ExternalRestApiTeacher(
        descriptor=desc,
        endpoint_url="http://127.0.0.1:8080/v1/messages",
        api_key_env_var="MOCK_ANTHROPIC_KEY_VAR",
        provider_format="anthropic",
    )
    headers_anthropic = teacher_anthropic.get_request_headers(MOCK_PROVIDER_TOKEN_PLACEHOLDER)
    assert headers_anthropic["x-api-key"] == MOCK_PROVIDER_TOKEN_PLACEHOLDER
    assert headers_anthropic["anthropic-version"] == "2023-06-01"
    assert "Authorization" not in headers_anthropic

    # Gemini
    teacher_gemini = ExternalRestApiTeacher(
        descriptor=desc,
        endpoint_url="http://127.0.0.1:8080/v1/models/gemini",
        api_key_env_var="MOCK_GEMINI_KEY_VAR",
        provider_format="gemini",
    )
    headers_gemini = teacher_gemini.get_request_headers(MOCK_PROVIDER_TOKEN_PLACEHOLDER)
    assert headers_gemini["x-goog-api-key"] == MOCK_PROVIDER_TOKEN_PLACEHOLDER
    assert "Authorization" not in headers_gemini


def test_external_teacher_anthropic_content_blocks_parsing() -> None:
    desc = TeacherModelDescriptor(
        model_id="test_ext_anthropic_parser",
        display_name="Test Anthropic Parser",
        version="1.0.0",
        provider=TeacherProvider.EXTERNAL_REST_API,
        endpoint_url="http://127.0.0.1:8080/v1",
        supported_modalities=["state_vector"],
        capabilities=["trajectory_proposal"],
        license="commercial",
    )
    teacher = ExternalRestApiTeacher(
        descriptor=desc,
        endpoint_url="http://127.0.0.1:8080/v1/messages",
        api_key_env_var="MOCK_ANTHROPIC_PARSER_KEY",
        provider_format="anthropic",
    )

    anthropic_raw_resp = {
        "id": "msg_01XyZ",
        "type": "message",
        "role": "assistant",
        "content": [
            {
                "type": "text",
                "text": json.dumps({
                    "actions": [[0.1, 0.2, 0.3, 0.4, 0.5], [0.6, 0.7, 0.8, 0.9, 1.0]],
                    "reasoning": "Prelift squeeze grasp stabilization.",
                }),
            }
        ],
        "usage": {"input_tokens": 42, "output_tokens": 28},
    }

    payload = TeacherQueryPayload(
        task_id="compliant_prelift",
        query_type="trajectory_proposal",
        current_state=np.zeros(23, dtype=np.float32),
        target_horizon=2,
        seed=42,
    )

    actions, usage = teacher.validate_and_parse_response(anthropic_raw_resp, payload)
    assert actions.shape == (2, 5)
    np.testing.assert_allclose(actions[0], [0.1, 0.2, 0.3, 0.4, 0.5], atol=1e-5)
    np.testing.assert_allclose(actions[1], [0.6, 0.7, 0.8, 0.9, 1.0], atol=1e-5)
    assert usage["prompt_tokens"] == 42
    assert usage["completion_tokens"] == 28


def test_external_teacher_http_server_mock_real_network_call() -> None:
    import http.server
    import threading

    received_headers = {}
    received_body = {}

    class MockHandler(http.server.BaseHTTPRequestHandler):
        def do_POST(self):
            nonlocal received_headers, received_body
            try:
                for h in self.headers:
                    received_headers[h.lower()] = self.headers[h]
                length = int(self.headers.get("content-length", 0))
                body_bytes = self.rfile.read(length)
                received_body = json.loads(body_bytes.decode("utf-8"))

                resp_payload = {
                    "id": "chatcmpl_mock_123",
                    "choices": [{
                        "message": {
                            "content": json.dumps({
                                "actions": [[0.05, 0.05, 0.05, 0.05, 1.0]],
                                "reasoning": "Stable upward lift action.",
                            })
                        }
                    }],
                    "usage": {"prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30},
                }
                resp_bytes = json.dumps(resp_payload).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(resp_bytes)))
                self.end_headers()
                self.wfile.write(resp_bytes)
            except Exception as e:
                import traceback
                traceback.print_exc()
                self.send_error(500, str(e))

        def log_message(self, format, *args):
            pass  # Silence stderr logs

    server = http.server.HTTPServer(("127.0.0.1", 0), MockHandler)
    port = server.server_port
    server_thread = threading.Thread(target=server.handle_request)
    server_thread.daemon = True
    server_thread.start()

    desc = TeacherModelDescriptor(
        model_id="test_ext_real_http_call",
        display_name="Test Real HTTP Call",
        version="1.0.0",
        provider=TeacherProvider.EXTERNAL_REST_API,
        endpoint_url="http://127.0.0.1:8080/v1",
        supported_modalities=["state_vector"],
        capabilities=["trajectory_proposal"],
        license="commercial",
    )

    teacher = ExternalRestApiTeacher(
        descriptor=desc,
        endpoint_url=f"http://127.0.0.1:{port}/v1/chat/completions",
        api_key_env_var="MOCK_TEST_AUTH_KEY_VAR",
        provider_format="openai",
        rate_limit_rpm=1000,
    )

    payload = TeacherQueryPayload(
        task_id="compliant_prelift",
        query_type="trajectory_proposal",
        current_state=np.zeros(23, dtype=np.float32),
        target_horizon=1,
        seed=42,
    )

    result = teacher.infer(payload)
    server_thread.join(timeout=2.0)
    server.server_close()

    assert received_headers.get("authorization") == "Bearer mock_test_token"
    assert "compliant_prelift" in received_body["messages"][1]["content"]
    assert len(result.candidate_actions) == 1
    np.testing.assert_allclose(result.candidate_actions[0], [0.05, 0.05, 0.05, 0.05, 1.0], atol=1e-5)
    assert teacher.total_prompt_tokens == 10
    assert teacher.total_completion_tokens == 20
