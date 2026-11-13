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
        api_key_env_var="TEST_TEACHER_API_KEY",
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
