"""End-to-End Demonstration of the HOROS Model Teaching Infrastructure.

Demonstrates:
1. Teacher model registration with metadata, licensing, and provenance hashing.
2. Inference queries using deterministic and adversarial mock teachers.
3. Synthetic physical experience generation across randomized parameters.
4. Physics Validation Engine enforcing the Grounded Firewall.
5. Distillation dataset preparation and zero-leakage manifest generation.
6. Baseline evaluation reporting against frozen B1-B3 models.
"""

from __future__ import annotations

import os
import sys
import time
from pathlib import Path

import numpy as np

# Add src and r002 root to sys.path
SCRIPT_DIR = Path(__file__).resolve().parent
R002_ROOT = SCRIPT_DIR.parent
if str(R002_ROOT / "src") not in sys.path:
    sys.path.insert(0, str(R002_ROOT / "src"))
if str(R002_ROOT) not in sys.path:
    sys.path.insert(0, str(R002_ROOT))

from teaching import (
    AdversarialMockTeacher,
    DeterministicMockTeacher,
    EnvironmentSamplingSpec,
    PhysicsValidationEngine,
    StudentDistillationEngine,
    StudentEvaluationEngine,
    SyntheticExperienceFactory,
    TeacherInferenceEngine,
    TeacherModelDescriptor,
    TeacherModelRegistry,
    TeacherProvider,
    ValidationVerdict,
)


def run_demonstration() -> int:
    print("=== HOROS Model Teaching Infrastructure: End-to-End Demonstration ===")
    start_time = time.time()

    demo_artifacts_dir = R002_ROOT / "experiments" / "model_teaching_infrastructure" / "demo_artifacts"
    demo_artifacts_dir.mkdir(parents=True, exist_ok=True)
    cache_dir = demo_artifacts_dir / "cache"

    # -------------------------------------------------------------
    # 1. Module 01: Teacher Model Registry
    # -------------------------------------------------------------
    print("\n[Step 1] Initializing Teacher Model Registry...")
    registry = TeacherModelRegistry()

    # Register deterministic baseline teacher
    det_desc = TeacherModelDescriptor(
        model_id="mock_teacher_deterministic_v1",
        display_name="Deterministic Physical Prior Teacher v1",
        version="1.0.0",
        provider=TeacherProvider.MOCK_DETERMINISTIC,
        supported_modalities=["state_vector", "proprioceptive_wrench"],
        capabilities=["trajectory_proposal", "compliant_grip_guidance"],
        license="internal_horos_research",
        has_representations=True,
        representation_dim=128,
        deterministic_seed_supported=True,
    )
    registry.register(det_desc)
    print(f"  - Registered: {det_desc.model_id} (hash: {det_desc.compute_descriptor_hash()[:12]}...)")

    # Register adversarial teacher for physics firewall testing
    adv_desc = TeacherModelDescriptor(
        model_id="mock_teacher_adversarial_v1",
        display_name="Adversarial Stress Teacher v1",
        version="1.0.0",
        provider=TeacherProvider.MOCK_ADVERSARIAL,
        supported_modalities=["state_vector"],
        capabilities=["stress_testing", "boundary_violation_injection"],
        license="internal_horos_research",
        has_representations=False,
    )
    registry.register(adv_desc)
    print(f"  - Registered: {adv_desc.model_id} (hash: {adv_desc.compute_descriptor_hash()[:12]}...)")

    manifest_path = demo_artifacts_dir / "registered_teachers_manifest.json"
    registry.export_manifest(str(manifest_path))
    print(f"  - Exported registry manifest to: {manifest_path.name}")

    # -------------------------------------------------------------
    # 2. Module 02: Teacher Inference Engine
    # -------------------------------------------------------------
    print("\n[Step 2] Querying Teacher Models via Inference Engine...")
    inference_engine = TeacherInferenceEngine(registry, cache_dir=str(cache_dir))

    det_adapter = DeterministicMockTeacher(det_desc)
    adv_adapter = AdversarialMockTeacher(adv_desc, fault_mode="friction_cone_violation")

    inference_engine.register_adapter(det_desc.model_id, det_adapter)
    inference_engine.register_adapter(adv_desc.model_id, adv_adapter)

    # -------------------------------------------------------------
    # 3. Module 03: Synthetic Experience Factory
    # -------------------------------------------------------------
    print("\n[Step 3] Generating Synthetic Physical Trajectories...")
    spec = EnvironmentSamplingSpec(
        friction_range=(0.15, 0.90),
        mass_range_kg=(0.20, 0.60),
        default_episode_length=30,
        dt_s=0.01,
    )
    factory = SyntheticExperienceFactory(inference_engine, sampling_spec=spec, output_dir=str(demo_artifacts_dir / "episodes"))

    # Generate valid episodes using deterministic teacher
    episodes = factory.generate_batch(
        task="compliant_prelift",
        teacher_id=det_desc.model_id,
        seeds=[1001, 1002, 1003, 1004],
    )
    print(f"  - Synthesized {len(episodes)} compliant prelift episodes from {det_desc.model_id}.")

    # Generate adversarial episode
    adv_ep = factory.generate_episode(
        task="compliant_prelift",
        teacher_id=adv_desc.model_id,
        seed=9999,
    )
    # Manually inject friction violation into adversarial episode to verify firewall
    adv_ep.actions[:, 0] = 0.08  # Excessive lateral velocity command
    adv_ep.wrenches[:, 2] = 14.0  # Excessive shear force with low grip
    all_episodes = episodes + [adv_ep]
    print(f"  - Injected 1 adversarial stress episode for firewall testing.")

    # -------------------------------------------------------------
    # 4. Module 04: Physics Validation Engine (Grounded Firewall)
    # -------------------------------------------------------------
    print("\n[Step 4] Running Physics Validation Engine (Grounded Firewall)...")
    validator = PhysicsValidationEngine(
        max_normal_force_n=20.0,
        max_shear_force_n=15.0,
        max_linear_velocity_mps=0.10,
    )

    validated_episodes, reports = validator.filter_and_label_batch("compliant_prelift", all_episodes)
    print(f"  - Total Evaluated: {len(reports)}")
    valid_count = sum(1 for r in reports if r.is_valid)
    rejected_count = sum(1 for r in reports if not r.is_valid)
    print(f"  - Accepted (Physically Validated): {valid_count}")
    print(f"  - Rejected by Firewall: {rejected_count}")

    for idx, r in enumerate(reports):
        ep_id = all_episodes[idx].episode_id
        if r.is_valid:
            print(f"    * {ep_id}: {r.verdict.value} (Max Fn: {r.max_normal_force_n:.2f} N, Max Fz: {r.max_shear_force_n:.2f} N)")
        else:
            print(f"    * {ep_id}: {r.verdict.value} -> {r.violation_details}")

    assert valid_count == 4, f"Expected 4 valid episodes, got {valid_count}"
    assert rejected_count == 1, f"Expected 1 rejected episode, got {rejected_count}"

    # -------------------------------------------------------------
    # 5. Module 05: Distillation & Training Dataset Preparation
    # -------------------------------------------------------------
    print("\n[Step 5] Preparing Student Distillation Dataset (Zero Leakage)...")
    distiller = StudentDistillationEngine(history_horizon=10, future_horizon=15, batch_size=2)
    batches, dataset_manifest = distiller.prepare_dataset_batches("compliant_prelift", validated_episodes)

    print(f"  - Manifest ID: {dataset_manifest.manifest_id}")
    print(f"  - Total Sequence Batches: {len(batches)}")
    print(f"  - Total Transitions: {dataset_manifest.total_transitions}")
    print(f"  - Zero Ground-Truth Leakage Verified: {dataset_manifest.zero_leakage_verified}")
    print(f"  - Dataset SHA-256: {dataset_manifest.data_sha256[:16]}...")

    distill_manifest_path = demo_artifacts_dir / "distillation_manifest.json"
    distiller.export_manifest(dataset_manifest, str(distill_manifest_path))

    # Verify batch tensor contract
    sample_b = batches[0]
    print(f"  - Batch History Tensor Shape: {sample_b.history_obs.shape} (B, H_hist, input_dim)")
    print(f"  - Batch Future Action Shape: {sample_b.future_actions.shape} (B, H_fut, action_dim)")
    print(f"  - Target Next States Shape: {sample_b.target_next_states.shape} (B, H_fut, state_dim)")

    # -------------------------------------------------------------
    # 6. Module 06: Baseline Evaluation Engine (Software Smoke Test)
    # -------------------------------------------------------------
    print("\n[Step 6] Running Student Evaluation Engine Interface Verification (Software Smoke Test)...")
    print("  [DISCLAIMER] Verifying metric calculation contracts and report formatting only.")
    print("  [DISCLAIMER] Exactly 0 student model parameters updated. No vNext model superiority claimed.")
    evaluator = StudentEvaluationEngine()

    N_eval = 20
    H_eval = 20
    D_state = 23
    rng = np.random.RandomState(42)

    gt_traj = rng.normal(0, 1, (N_eval, H_eval, D_state))
    pred_traj = gt_traj + rng.normal(0, 0.15, (N_eval, H_eval, D_state))

    gt_mu = np.linspace(0.20, 0.80, N_eval)
    pred_mu = gt_mu + rng.normal(0, 0.03, N_eval)

    gt_mass = np.linspace(0.25, 0.55, N_eval)
    pred_mass = gt_mass + rng.normal(0, 0.02, N_eval)

    id_scores = rng.normal(0.2, 0.05, 50)
    ood_scores = rng.normal(0.8, 0.08, 50)

    bench_results = evaluator.evaluate_synthetic_smoke_test(
        model_id="HOROS-WM-vNext-smoke-test-pipeline-check",
        task="compliant_prelift",
        pred_trajectories=pred_traj,
        gt_trajectories=gt_traj,
        pred_mu=pred_mu,
        gt_mu=gt_mu,
        pred_mass=pred_mass,
        gt_mass=gt_mass,
        ood_scores=(id_scores, ood_scores),
    )

    report_md = evaluator.render_report_md(bench_results)
    eval_report_path = demo_artifacts_dir / "evaluation_benchmark_report.md"
    with open(eval_report_path, "w", encoding="utf-8") as f:
        f.write(report_md)

    print(f"  - Smoke Test Status: is_smoke_test={bench_results.is_smoke_test}")
    print(f"  - Metric Pipeline Contract Verification: Overall Pass = {bench_results.overall_pass}")
    print(f"  - Generated Smoke Test Evaluation Report: {eval_report_path.name}")

    elapsed = time.time() - start_time
    print(f"\n=== Demonstration Completed Successfully in {elapsed:.2f}s ===")
    return 0


if __name__ == "__main__":
    sys.exit(run_demonstration())
