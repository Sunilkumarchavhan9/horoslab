"""Unit and integration tests for the HOROS Model Teaching Infrastructure.

Verifies:
1. Teacher Model Registry registration, filtering, serialization, and provenance hashing.
2. Teacher Inference Engine querying, deterministic caching, and failure handling.
3. Synthetic Experience Factory physical scenario generation and domain randomization.
4. Physics Validation Engine (Grounded Firewall) rejecting kinematic, force, friction, and penetration violations.
5. Student Distillation Engine zero-leakage tensor assembly and auxiliary target collation.
6. Student Evaluation Engine multi-horizon MSE, R2, and AUROC benchmarking.
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
    # Invalid model ID
    with pytest.raises(ValueError, match="model_id must be a non-empty string"):
        TeacherModelDescriptor(
            model_id="",
            display_name="Invalid",
            version="1.0.0",
            provider=TeacherProvider.MOCK_DETERMINISTIC,
            supported_modalities=["state"],
            capabilities=["test"],
            license="test",
        )

    # Missing REST endpoint
    with pytest.raises(ValueError, match="endpoint_url is required for external REST API"):
        TeacherModelDescriptor(
            model_id="external_api_model",
            display_name="External",
            version="1.0.0",
            provider=TeacherProvider.EXTERNAL_REST_API,
            supported_modalities=["state"],
            capabilities=["test"],
            license="test",
            endpoint_url=None,
        )

    # Duplicate registration
    reg = TeacherModelRegistry()
    desc = TeacherModelDescriptor(
        model_id="dup_test",
        display_name="Dup",
        version="1.0.0",
        provider=TeacherProvider.MOCK_DETERMINISTIC,
        supported_modalities=["state"],
        capabilities=["test"],
        license="test",
    )
    reg.register(desc)
    with pytest.raises(ValueError, match="already registered"):
        reg.register(desc)


def test_registry_manifest_export_import(
    clean_registry: TeacherModelRegistry, valid_deterministic_descriptor: TeacherModelDescriptor
) -> None:
    reg = clean_registry
    reg.register(valid_deterministic_descriptor)

    with tempfile.TemporaryDirectory() as tmp_dir:
        manifest_file = Path(tmp_dir) / "test_registry.json"
        reg.export_manifest(str(manifest_file))
        assert manifest_file.is_file()

        new_reg = TeacherModelRegistry()
        imported_count = new_reg.import_manifest(str(manifest_file))
        assert imported_count == 1
        assert new_reg.has(valid_deterministic_descriptor.model_id)


# -----------------------------------------------------------------------------
# Module 02: Teacher Inference Engine Tests
# -----------------------------------------------------------------------------

def test_inference_deterministic_query_and_caching(
    clean_registry: TeacherModelRegistry, valid_deterministic_descriptor: TeacherModelDescriptor
) -> None:
    reg = clean_registry
    reg.register(valid_deterministic_descriptor)

    with tempfile.TemporaryDirectory() as tmp_dir:
        engine = TeacherInferenceEngine(reg, cache_dir=tmp_dir)
        adapter = DeterministicMockTeacher(valid_deterministic_descriptor)
        engine.register_adapter(valid_deterministic_descriptor.model_id, adapter)

        payload = TeacherQueryPayload(
            task_id="compliant_prelift",
            query_type="trajectory_proposal",
            current_state=np.zeros(23, dtype=np.float32),
            target_horizon=10,
            seed=101,
            request_representations=True,
        )

        res1 = engine.query(valid_deterministic_descriptor.model_id, payload)
        assert res1.cached is False
        assert res1.candidate_actions.shape == (10, 5)
        assert res1.latent_representations is not None
        assert res1.latent_representations.shape == (10, 64)

        # Repeated query must hit cache
        res2 = engine.query(valid_deterministic_descriptor.model_id, payload)
        assert res2.cached is True
        np.testing.assert_allclose(res1.candidate_actions, res2.candidate_actions)


def test_inference_adversarial_error_handling(clean_registry: TeacherModelRegistry) -> None:
    adv_desc = TeacherModelDescriptor(
        model_id="adv_timeout_teacher",
        display_name="Adversarial Timeout",
        version="1.0.0",
        provider=TeacherProvider.MOCK_ADVERSARIAL,
        supported_modalities=["state_vector"],
        capabilities=["stress"],
        license="test",
    )
    clean_registry.register(adv_desc)

    engine = TeacherInferenceEngine(clean_registry, max_retries=1, backoff_factor=0.01)
    adapter = AdversarialMockTeacher(adv_desc, fault_mode="timeout_error")
    engine.register_adapter(adv_desc.model_id, adapter)

    payload = TeacherQueryPayload(
        task_id="compliant_prelift",
        query_type="test",
        current_state=np.zeros(23, dtype=np.float32),
        seed=42,
    )

    with pytest.raises(RuntimeError, match="Teacher inference failed"):
        engine.query(adv_desc.model_id, payload)


# -----------------------------------------------------------------------------
# Module 03: Synthetic Experience Factory Tests
# -----------------------------------------------------------------------------

def test_experience_factory_generation(
    clean_registry: TeacherModelRegistry, valid_deterministic_descriptor: TeacherModelDescriptor
) -> None:
    clean_registry.register(valid_deterministic_descriptor)
    engine = TeacherInferenceEngine(clean_registry)
    adapter = DeterministicMockTeacher(valid_deterministic_descriptor)
    engine.register_adapter(valid_deterministic_descriptor.model_id, adapter)

    spec = EnvironmentSamplingSpec(default_episode_length=20)
    factory = SyntheticExperienceFactory(engine, sampling_spec=spec)

    ep = factory.generate_episode("compliant_prelift", valid_deterministic_descriptor.model_id, seed=123)
    assert ep.states.shape == (20, 23)
    assert ep.actions.shape == (20, 5)
    assert ep.next_states.shape == (20, 23)
    assert ep.wrenches.shape == (20, 6)
    assert ep.modes.shape == (20,)
    assert ep.provenance_hash != ""

    # Verify teacher suggestion isolation
    assert "candidate_actions" in ep.teacher_suggestions
    assert ep.teacher_suggestions["teacher_id"] == valid_deterministic_descriptor.model_id


# -----------------------------------------------------------------------------
# Module 04: Physics Validation Engine (Grounded Firewall) Tests
# -----------------------------------------------------------------------------

def test_physics_firewall_valid_and_rejections() -> None:
    validator = PhysicsValidationEngine(
        max_normal_force_n=20.0,
        max_shear_force_n=15.0,
        max_linear_velocity_mps=0.10,
        max_penetration_mm=0.50,
    )

    T = 10
    states = np.zeros((T, 23), dtype=np.float32)
    actions = np.zeros((T, 5), dtype=np.float32)
    wrenches = np.zeros((T, 6), dtype=np.float32)

    # 1. Valid nominal trajectory
    actions[:, 4] = 8.0  # Safe normal force
    wrenches[:, 2] = 2.0  # Safe shear force
    rep_valid = validator.validate_trajectory("compliant_prelift", states, actions, wrenches)
    assert rep_valid.is_valid is True
    assert rep_valid.verdict == ValidationVerdict.PHYSICALLY_VALID

    # 2. Kinematic limit violation
    actions_fast = actions.copy()
    actions_fast[3, 0] = 0.50  # Velocity = 0.50 m/s >> 0.10 m/s
    rep_fast = validator.validate_trajectory("compliant_prelift", states, actions_fast, wrenches)
    assert rep_fast.is_valid is False
    assert rep_fast.verdict == ValidationVerdict.REJECTED_KINEMATIC_LIMIT
    assert rep_fast.failure_step == 3

    # 3. Force limit violation (Crush force)
    actions_crush = actions.copy()
    actions_crush[5, 4] = 35.0  # Normal force = 35 N >> 20 N
    rep_crush = validator.validate_trajectory("compliant_prelift", states, actions_crush, wrenches)
    assert rep_crush.is_valid is False
    assert rep_crush.verdict == ValidationVerdict.REJECTED_FORCE_LIMIT

    # 4. Friction cone violation
    actions_slip = actions.copy()
    actions_slip[:, 4] = 2.0  # Low normal force = 2 N
    wrenches_slip = wrenches.copy()
    wrenches_slip[:, 2] = 10.0  # High shear force = 10 N -> Ratio = 5.0 >> mu=0.60
    rep_slip = validator.validate_trajectory(
        "compliant_prelift", states, actions_slip, wrenches_slip, env_metadata={"initial_mu_true": 0.60}
    )
    assert rep_slip.is_valid is False
    assert rep_slip.verdict == ValidationVerdict.REJECTED_FRICTION_CONE

    # 5. Penetration violation
    states_pen = states.copy()
    states_pen[7, 8] = -1.2  # Penetration = -1.2 mm deeper than -0.5 mm
    rep_pen = validator.validate_trajectory("compliant_prelift", states_pen, actions, wrenches)
    assert rep_pen.is_valid is False
    assert rep_pen.verdict == ValidationVerdict.REJECTED_PENETRATION


# -----------------------------------------------------------------------------
# Module 05: Student Distillation Engine Tests
# -----------------------------------------------------------------------------

def test_distillation_zero_leakage_and_batching() -> None:
    distiller = StudentDistillationEngine(history_horizon=5, future_horizon=10, batch_size=2)

    T = 25
    states = np.zeros((T, 23), dtype=np.float32)
    actions = np.zeros((T, 5), dtype=np.float32)
    next_states = np.zeros((T, 23), dtype=np.float32)
    wrenches = np.zeros((T, 6), dtype=np.float32)
    next_wrenches = np.zeros((T, 6), dtype=np.float32)
    modes = np.full(T, 2, dtype=np.int64)
    rewards = np.zeros(T, dtype=np.float32)

    ep1 = SyntheticEpisodeRecord(
        episode_id="ep1",
        seed=1,
        task="compliant_prelift",
        states=states,
        actions=actions,
        next_states=next_states,
        wrenches=wrenches,
        next_wrenches=next_wrenches,
        modes=modes,
        rewards=rewards,
        env_metadata={"initial_mu_true": 0.50, "initial_mass_kg": 0.35},
        provenance_hash="hash1",
    )
    ep2 = copy.deepcopy(ep1)
    ep2.episode_id = "ep2"
    ep2.provenance_hash = "hash2"

    batches, manifest = distiller.prepare_dataset_batches("compliant_prelift", [ep1, ep2])

    assert manifest.zero_leakage_verified is True
    assert len(batches) > 0
    b = batches[0]
    assert b.history_obs.shape[1] == 5  # H_hist = 5
    assert b.future_actions.shape[1] == 10  # H_fut = 10
    assert b.target_next_states.shape[1] == 10
    assert b.target_mu.shape[0] == len(b.history_obs)
    assert b.target_mass.shape[0] == len(b.history_obs)


# -----------------------------------------------------------------------------
# Module 06: Student Evaluation Engine Tests
# -----------------------------------------------------------------------------

def test_evaluation_engine_metrics_and_reporting() -> None:
    evaluator = StudentEvaluationEngine()

    N, H, D = 10, 20, 23
    gt_traj = np.ones((N, H, D), dtype=np.float32)
    pred_traj = np.ones((N, H, D), dtype=np.float32) * 1.05  # Slight offset

    mu = np.linspace(0.2, 0.8, N)
    mass = np.linspace(0.3, 0.6, N)

    res = evaluator.evaluate_synthetic_run(
        model_id="test_student_wm",
        task="compliant_prelift",
        pred_trajectories=pred_traj,
        gt_trajectories=gt_traj,
        pred_mu=mu,
        gt_mu=mu,
        pred_mass=mass,
        gt_mass=mass,
    )

    assert isinstance(res, BenchmarkResults)
    assert res.friction_id_r2 == 1.0  # Perfect fit
    assert res.mass_id_r2 == 1.0
    assert 10 in res.multi_horizon_mse

    report = evaluator.render_report_md(res)
    assert "# Model Evaluation Benchmark Report" in report
    assert "| $H=10$ |" in report
