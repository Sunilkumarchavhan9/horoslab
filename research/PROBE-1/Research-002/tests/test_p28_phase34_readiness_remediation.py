"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.8 / Phase 3.4.1 — Training Readiness Remediation Verification Suite

Verifies resolution of Blockers 1–4 ahead of Phase 3.4.2–3.4.5 training:
1. Production CompliantPreLiftContactEnv wiring & hidden mu_true blindness.
2. Task 2 delta_dot_t sliding mode classification & task-specific dt (0.01 vs 0.02 s).
3. Step API compatibility across 2-tuple (obs, done) and 4-tuple (obs, r, done, info)
   with non-fabricated Task 2 evaluation rewards vs None when unrequested.
4. Exact early-termination transition/action/state alignment without fake padding.
5. Archived 60-episode dataset bundles & manifest verification + strict seed separation.
6. Shared per-task M0+M4 training-only z-score normalization & physical variance inverse transform.
7. Uniform global gradient clipping (max_grad_norm = 1.0) & clip frequency logging across B1–B3.
8. Independent B3 five-member persistence & B4 + APS + Episode + MultiHorizon serialization.
"""

from __future__ import annotations
import copy
import json
import math
import os
import sys
import tempfile
import unittest
import numpy as np
import torch

current_dir = os.path.dirname(os.path.abspath(__file__))
r002_root = os.path.abspath(os.path.join(current_dir, ".."))
if r002_root not in sys.path:
    sys.path.insert(0, r002_root)
src_dir = os.path.join(r002_root, "src")
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

from src.contact_modes.contact_mode_definitions import ContactMode, classify_contact_mode
from src.contact_modes.hybrid_contact_state_model import HybridContactStateModel
from src.contact_modes.contact_mode_classifier import ContactModeClassifier
from src.environment import (
    CompliantPreLiftContactEnv,
    MultifingerLiftEnv,
    PegInHoleEnv,
    compute_task2_eval_reward,
    get_env_dt,
    step_env_compatible,
)
from src.integrated.calibration_runner import PHASE3_SEED_POOLS, verify_disjoint_seed_pools
from src.integrated.model_training_runner import (
    ModelTrainingRunner,
    load_b3_ensemble_from_members,
    load_hybrid_checkpoint,
)
from src.integrated.phase34_pipeline import (
    PHASE34_B4_MIN_STRATUM_SAMPLES,
    Phase34TrainingPipeline,
    _sha256_file,
    fit_shared_task_scaler_from_splits,
    generate_phase34_datasets,
    load_phase34_dataset_bundle,
)
from src.integrated.planner_evaluator import PlannerEvaluator
from src.mining.contact_boundary_sampler import ContactBoundarySampler
from src.mining.mining_evaluator import MiningEvaluator
from src.models.deterministic_wm import DeterministicWorldModel
from src.models.ensemble_wm import EnsembleWorldModel
from src.models.normalization import FeatureStandardizer
from src.models.probabilistic_wm import ProbabilisticWorldModel
from src.models.stratified_conformal_wm import ContactStratifiedConformalWM
from src.selection_aware.counterfactual_rollout import (
    CounterfactualRolloutEngine,
    extract_env_state_and_wrench,
)
from src.selection_aware.planner_fingerprint import PlannerFingerprint


class TestPhase34ReadinessRemediation(unittest.TestCase):
    """Comprehensive verification for Phase 3.4.1 Blockers 1–4."""

    def setUp(self):
        np.random.seed(42)
        torch.manual_seed(42)

    # 1. Task 2 environment wiring
    def test_01_task2_uses_production_compliant_prelift_env(self):
        pe = PlannerEvaluator(task="multifinger_lift", eval_horizon=5, seed=42)
        env_pe = pe.create_env(seed=1000)
        self.assertIsInstance(env_pe, CompliantPreLiftContactEnv)
        self.assertAlmostEqual(env_pe.dt, 0.01, places=9)
        obs = env_pe.reset()
        self.assertNotIn("mu_true", obs)
        self.assertNotIn("slip_ratio", obs)
        self.assertIn("delta_dot_t", obs)

        sampler = ContactBoundarySampler(task="compliant_prelift", seed=42)
        batch = sampler.generate_candidate_batch(
            strategy="D4_acmm", num_candidates=3, start_seed=1000, horizon=10
        )
        self.assertEqual(len(batch), 3)
        for ep in batch:
            self.assertEqual(ep["task"], "compliant_prelift")
            self.assertAlmostEqual(ep["dt_s"], 0.01, places=9)
            self.assertEqual(ep["realized_states"].shape[1], 23)

    # 2. Contact-mode labeling on Task 2 delta_dot_t
    def test_02_contact_mode_sliding_from_task2_delta_dot_t_signals(self):
        prev_obs = {
            "finger_fn": np.array([4.0, 4.0, 4.0, 4.0]),
            "delta_dot_t": np.zeros(4),
            "obj_vel": np.zeros(3),
            "dt_ms": 10.0,
        }
        stick_obs = {
            "finger_fn": np.array([4.0, 4.0, 4.0, 4.0]),
            "delta_dot_t": np.array([0.0, 0.0, 0.0, 0.0]),
            "obj_vel": np.zeros(3),
            "dt_ms": 10.0,
        }
        slip_obs = {
            "finger_fn": np.array([4.0, 4.0, 4.0, 4.0]),
            "delta_dot_t": np.array([0.0005, 0.0005, 0.0005, 0.0005]),
            "obj_vel": np.zeros(3),
            "dt_ms": 10.0,
        }
        # Free non-contact finger having delta_dot_t while only touching fingers stick must NOT false-trigger SLIDING
        partial_touch_stick = {
            "finger_fn": np.array([4.0, 4.0, 0.0, 0.0]),
            "delta_dot_t": np.array([0.0, 0.0, 0.05, 0.05]),
            "obj_vel": np.zeros(3),
            "dt_ms": 10.0,
        }

        self.assertEqual(
            classify_contact_mode(stick_obs, prev_state=prev_obs, task="compliant_prelift"),
            ContactMode.STICKING,
        )
        self.assertEqual(
            classify_contact_mode(slip_obs, prev_state=prev_obs, task="compliant_prelift"),
            ContactMode.SLIDING,
        )
        self.assertEqual(
            classify_contact_mode(partial_touch_stick, prev_state=prev_obs, task="compliant_prelift"),
            ContactMode.STICKING,
        )

        # Confirm real CompliantPreLiftContactEnv low-friction slide triggers ContactMode.SLIDING once squeeze stabilizes
        env = CompliantPreLiftContactEnv(mu_true=0.12, dt=0.01, seed=42)
        obs = env.reset()
        modes_seen = []
        for t in range(15):
            sq = 0.5 if t < 5 else 0.0
            act = np.array([sq, sq, sq, sq, 0.0 if t < 5 else 1.0], dtype=float)
            next_obs, _ = env.step(act)
            modes_seen.append(classify_contact_mode(next_obs, prev_state=obs, dt=0.01, task="compliant_prelift"))
            obs = next_obs
        self.assertIn(ContactMode.SLIDING, modes_seen)

    # 3. Time-step handling (0.01 s Task 2 vs 0.02 s Task 1)
    def test_03_task_specific_dt_respected(self):
        env_t1 = PegInHoleEnv(seed=42)
        env_t2 = CompliantPreLiftContactEnv(seed=42)
        self.assertAlmostEqual(get_env_dt(env_t1, "peg_in_hole"), 0.02, places=9)
        self.assertAlmostEqual(get_env_dt(env_t2, "compliant_prelift"), 0.01, places=9)

        # Delta Fn = +8.0 N -> df/dt is 800 N/s at dt=0.01 (IMPACT > 500) vs 400 N/s at dt=0.02 (STICKING)
        prev_t2 = {"finger_fn": np.full(4, 1.0), "delta_dot_t": np.zeros(4), "obj_vel": np.zeros(3), "dt_ms": 10.0}
        curr_t2 = {"finger_fn": np.full(4, 3.0), "delta_dot_t": np.zeros(4), "obj_vel": np.zeros(3), "dt_ms": 10.0}
        self.assertEqual(classify_contact_mode(curr_t2, prev_state=prev_t2, task="compliant_prelift"), ContactMode.IMPACT)

        prev_t1 = {"wrench": np.array([0, 0, -1.0, 0, 0, 0]), "rot": np.zeros(3), "vel": np.zeros(3)}
        curr_t1 = {"wrench": np.array([0, 0, -9.0, 0, 0, 0]), "rot": np.zeros(3), "vel": np.zeros(3)}
        self.assertEqual(classify_contact_mode(curr_t1, prev_state=prev_t1, task="peg_in_hole"), ContactMode.STICKING)

    # 4 & 5. Step API compatibility & Reward semantics
    def test_04_and_05_step_api_compatibility_and_reward_semantics(self):
        env_2tuple = CompliantPreLiftContactEnv(mu_true=0.60, seed=42)
        env_2tuple.reset()
        # Apply inward squeeze -> fn > 0 so force_err != 0 -> physical reward is nonzero
        obs2, rew_eval, done2, info2 = step_env_compatible(
            env_2tuple, np.array([1.8, 1.8, 1.8, 1.8, 0.0]), task="compliant_prelift", require_reward=True
        )
        self.assertEqual(info2["step_api"], "two_tuple")
        self.assertIsNotNone(rew_eval)
        self.assertNotAlmostEqual(rew_eval, 0.0, places=6)
        self.assertNotIn("mu_true", info2)

        # When caller does not require reward, None is returned cleanly (never fabricated 0.0)
        _, rew_unreq, _, info2_norew = step_env_compatible(
            env_2tuple, np.array([0.2, 0.2, 0.2, 0.2, 0.5]), task="compliant_prelift", require_reward=False
        )
        self.assertIsNone(rew_unreq)
        self.assertEqual(info2_norew["step_api"], "two_tuple")

        # 4-tuple PegInHoleEnv preserves original reward verbatim
        env_4tuple = PegInHoleEnv(seed=42)
        env_4tuple.reset()
        _, rew4, _, info4 = step_env_compatible(
            env_4tuple, np.array([0.0, 0.0, -2.0, 0.0, 0.0, 0.0]), task="peg_in_hole", require_reward=False
        )
        self.assertEqual(info4["step_api"], "four_tuple")
        self.assertIsInstance(rew4, float)

        # Verify CounterfactualRolloutEngine & PlannerEvaluator work end-to-end on CompliantPreLiftContactEnv
        env_cf = CompliantPreLiftContactEnv(mu_true=0.60, seed=6000)
        env_cf.reset()
        dummy_wm = HybridContactStateModel(
            DeterministicWorldModel(23, 5, hidden_dim=16),
            ContactModeClassifier(23, 5, hidden_dim=16, num_modes=7),
        )
        pe = PlannerEvaluator(
            task="compliant_prelift", eval_horizon=5, plan_horizon=3, num_candidates=6, cem_iterations=1, seed=42
        )
        out = pe.evaluate_policy(dummy_wm, num_episodes=1, start_seed=6000, use_safety_filter=True)
        self.assertEqual(out["goal_progress"]["unit"], "height_mm")
        self.assertEqual(out["target_b_episodes"][0]["steps"], 5)

    # 6. Early termination transition/action/state alignment
    def test_06_early_termination_alignment_zero_padding(self):
        sampler_t2 = ContactBoundarySampler(task="compliant_prelift", seed=42, mu=0.60)
        env_t2 = CompliantPreLiftContactEnv(mu_true=0.60, dt=0.01, seed=42)
        traj_t2 = sampler_t2.sample_task2_boundary_trajectory(env_t2, horizon=50, exploration_mode="coordinated")
        n_steps_t2 = traj_t2["episode_length"]
        self.assertLess(n_steps_t2, 50)  # Early lift completion before H=50
        self.assertEqual(len(traj_t2["actions"]), n_steps_t2)
        self.assertEqual(len(traj_t2["realized_states"]), n_steps_t2)
        self.assertEqual(len(traj_t2["realized_next_states"]), n_steps_t2)
        self.assertEqual(len(traj_t2["realized_modes"]), n_steps_t2)
        self.assertEqual(len(traj_t2["realized_rewards"]), n_steps_t2)

        sampler_t1 = ContactBoundarySampler(task="peg_in_hole", seed=42)
        env_t1 = PegInHoleEnv(seed=42)
        traj_t1 = sampler_t1.sample_task1_boundary_trajectory(env_t1, horizon=50, exploration_mode="insertion")
        n_steps_t1 = traj_t1["episode_length"]
        self.assertLess(n_steps_t1, 50)  # Early seating before H=50
        self.assertEqual(len(traj_t1["actions"]), n_steps_t1)
        self.assertEqual(len(traj_t1["realized_states"]), n_steps_t1)
        self.assertEqual(len(traj_t1["realized_next_states"]), n_steps_t1)

        runner = ModelTrainingRunner(task="compliant_prelift", seed=42)
        extracted = runner.extract_transitions([traj_t2])
        self.assertEqual(len(extracted), n_steps_t2)

    # 7, 8, 9. Archived Phase 3.4 Dataset Manifest, Seed Separation & Round-Trip Serialization
    def test_07_08_09_archived_dataset_manifest_seed_separation_and_serialization(self):
        manifest_path = os.path.join(r002_root, "manifests", "phase34_dataset_manifest.json")
        self.assertTrue(os.path.exists(manifest_path), f"Missing archived manifest {manifest_path}")
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)
        json.dumps(manifest, allow_nan=False)

        self.assertEqual(manifest["cross_split_intersections"], {
            "train_vs_calibration": 0,
            "train_vs_eval": 0,
            "calibration_vs_eval": 0,
            "train_or_calib_vs_excluded_pilot": 0,
        })
        verify_disjoint_seed_pools()

        expected_splits = {
            "peg_in_hole__M0_passive": list(range(1100, 1160)),
            "peg_in_hole__M4_acmm": list(range(1100, 1160)),
            "compliant_prelift__M0_passive": list(range(1000, 1060)),
            "compliant_prelift__M4_acmm": list(range(1000, 1060)),
            "peg_in_hole__calibration": list(range(2100, 2160)),
            "compliant_prelift__calibration": list(range(2000, 2060)),
        }
        self.assertEqual(set(manifest["splits"].keys()), set(expected_splits.keys()))

        dataset_dir = os.path.join(r002_root, "datasets", "phase3_4")
        for split_key, exp_seeds in expected_splits.items():
            s_info = manifest["splits"][split_key]
            self.assertEqual(s_info["num_episodes"], 60)
            self.assertEqual(s_info["seeds"], exp_seeds)
            npz_path = os.path.join(dataset_dir, s_info["npz_filename"])
            self.assertTrue(os.path.exists(npz_path))
            self.assertEqual(_sha256_file(npz_path), s_info["sha256"])

            loaded = load_phase34_dataset_bundle(npz_path)
            self.assertEqual(len(loaded["episodes"]), 60)
            self.assertEqual(len(loaded["transitions"]), s_info["num_transitions"])
            for ep in loaded["episodes"]:
                self.assertEqual(len(ep["actions"]), ep["episode_length"])
                self.assertEqual(len(ep["realized_states"]), ep["episode_length"])
                self.assertEqual(len(ep["realized_next_states"]), ep["episode_length"])
                self.assertIn("termination_reason", ep)
                self.assertIn("env_config", ep)
                self.assertIn("software_revision", ep)

        # Sliding mode (3) must actually appear in CompliantPreLift splits
        self.assertGreater(manifest["splits"]["compliant_prelift__M0_passive"]["mode_histogram"]["3"], 0)
        self.assertGreater(manifest["splits"]["compliant_prelift__M4_acmm"]["mode_histogram"]["3"], 0)
        self.assertGreater(manifest["splits"]["compliant_prelift__calibration"]["mode_histogram"]["3"], 0)

    # 12. Shared training-only normalization & exact inverse variance transform
    def test_12_training_only_normalization_and_inverse_transform(self):
        # Include constant zero feature dim=3 to test min_std safe floor
        rng = np.random.RandomState(42)
        s0 = rng.normal(10.0, 20.0, size=(30, 15)).astype(np.float32)
        s0[:, 3] = 5.0  # constant channel
        a0 = rng.normal(0.0, 2.0, size=(30, 6)).astype(np.float32)
        ns0 = s0 + rng.normal(0.5, 50.0, size=(30, 15)).astype(np.float32)
        ns0[:, 3] = 5.0  # constant residual channel

        m0_trans = [(s0[i], a0[i], ns0[i], i % 7) for i in range(20)]
        m4_trans = [(s0[i], a0[i], ns0[i], (i + 1) % 7) for i in range(20, 30)]

        scaler = fit_shared_task_scaler_from_splits("peg_in_hole", m0_trans, m4_trans, min_std=1e-4)
        self.assertEqual(scaler.fit_source, "combined_M0_plus_M4_training_only")
        self.assertEqual(scaler.num_fit_transitions, 30)
        self.assertAlmostEqual(float(scaler.state_std[3]), 1e-4, places=7)
        self.assertIn(3, scaler.clamped_dims["state"])
        self.assertIn(3, scaler.clamped_dims["delta"])

        # Inverse transform identity test
        s_t = torch.tensor(s0[:5])
        ns_t = torch.tensor(ns0[:5])
        target_norm = scaler.normalize_target_next_state_tensor(s_t, ns_t)
        rec_phys = scaler.inverse_transform_next_state_tensor(s_t, target_norm)
        torch.testing.assert_close(rec_phys, ns_t, atol=1e-4, rtol=1e-4)

        # Variance scaling identity: Var_phys = delta_std^2 * Var_norm
        var_norm = torch.ones((5, 15), dtype=torch.float32) * 0.25
        var_phys = scaler.inverse_transform_variance_tensor(var_norm)
        expected_var_phys = 0.25 * (torch.tensor(scaler.delta_std) ** 2)
        torch.testing.assert_close(var_phys[0], expected_var_phys, atol=1e-5, rtol=1e-5)

        # Round-trip serialization
        reloaded = FeatureStandardizer.from_dict(scaler.to_dict())
        np.testing.assert_allclose(reloaded.delta_std, scaler.delta_std, atol=1e-7)

    # 13. Uniform global gradient clipping across B1–B3
    def test_13_uniform_gradient_clipping_b1_b2_b3(self):
        rng = np.random.RandomState(42)
        transitions = [
            (
                rng.normal(0, 1, 15).astype(np.float32),
                rng.normal(0, 1, 6).astype(np.float32),
                rng.normal(0, 500, 15).astype(np.float32),  # extreme residuals to force pre-clip > 1.0 when unnormalized
                i % 7,
            )
            for i in range(40)
        ]
        # Force normalize=False and higher lr so initial gradients strictly exceed 1.0, confirming clip_count > 0 across B1, B2, B3
        runner = ModelTrainingRunner(
            task="peg_in_hole", hidden_dim=32, epochs=5, lr=1e-2, seed=42, max_grad_norm=1.0, normalize=False
        )
        for arch in ("B1", "B2", "B3"):
            _, stats = runner.train_hybrid_model(transitions, model_type=arch, return_stats=True)
            gc = stats["grad_clip_stats"]
            self.assertEqual(gc["max_grad_norm"], 1.0)
            self.assertGreater(gc["max_pre_clip_grad_norm"], 1.0, msg=f"{arch} should trigger grad clipping")
            self.assertGreater(gc["clip_count"], 0)
            self.assertGreater(gc["clip_frequency"], 0.0)
            self.assertEqual(len(gc["pre_clip_grad_norms"]), gc["steps"])

    # 10, 11, 14. B3 5-member persistence, B4 + APS + Episode/MH artifacts & end-to-end reproducibility
    def test_10_11_14_pipeline_b3_b4_aps_serialization_and_reproducibility(self):
        dataset_dir = os.path.join(r002_root, "datasets", "phase3_4")
        m0_b = load_phase34_dataset_bundle(os.path.join(dataset_dir, "peg_in_hole_M0_passive.npz"))
        m4_b = load_phase34_dataset_bundle(os.path.join(dataset_dir, "peg_in_hole_M4_acmm.npz"))
        cal_b = load_phase34_dataset_bundle(os.path.join(dataset_dir, "peg_in_hole_calibration.npz"))

        # Use tiny 4-episode train slices (preserving full 60-ep calibration pool so N_calib=60 floor triggers validly!)
        def slice_ep(bundle, n):
            eps = bundle["episodes"][:n]
            trans = [
                (ep["realized_states"][t], ep["actions"][t], ep["realized_next_states"][t], int(ep["realized_modes"][t]))
                for ep in eps
                for t in range(len(ep["actions"]))
            ]
            return {"task": bundle["task"], "condition": bundle["condition"], "episodes": eps, "transitions": trans}

        m0_small = slice_ep(m0_b, 4)
        m4_small = slice_ep(m4_b, 4)

        with tempfile.TemporaryDirectory() as tmpdir:
            dir_a = os.path.join(tmpdir, "run_a")
            dir_b = os.path.join(tmpdir, "run_b")
            pipe_a = Phase34TrainingPipeline(checkpoint_root=dir_a, hidden_dim=32, epochs=2, lr=2e-3, max_grad_norm=1.0, seed=42)
            pipe_b = Phase34TrainingPipeline(checkpoint_root=dir_b, hidden_dim=32, epochs=2, lr=2e-3, max_grad_norm=1.0, seed=42)

            res_a = pipe_a.train_and_calibrate_task("peg_in_hole", m0_small, m4_small, cal_b)
            res_b = pipe_b.train_and_calibrate_task("peg_in_hole", m0_small, m4_small, cal_b)

            # Reproducibility: shared M0+M4 normalization stats must be identical
            self.assertEqual(res_a["shared_normalization"], res_b["shared_normalization"])
            # M0 and M4 conditions must carry the EXACT SAME shared normalization stats
            c_m0 = res_a["conditions"]["M0_passive"]
            c_m4 = res_a["conditions"]["M4_acmm"]
            b1_m0, p1_m0 = load_hybrid_checkpoint(c_m0["checkpoints"]["B1"])
            b1_m4, p1_m4 = load_hybrid_checkpoint(c_m4["checkpoints"]["B1"])
            self.assertEqual(p1_m0["normalization"], p1_m4["normalization"])
            self.assertEqual(p1_m0["training_config"]["max_grad_norm"], 1.0)

            # Verify B3 ensemble + all 5 independent member checkpoints & uncertainty decomposition
            member_paths = c_m4["checkpoints"]["B3_members"]
            self.assertEqual(len(member_paths), 5)
            for idx, mp in enumerate(member_paths):
                self.assertTrue(os.path.exists(mp))
            reconstructed_b3, member_payloads = load_b3_ensemble_from_members(
                member_paths, ensemble_checkpoint_path=c_m4["checkpoints"]["B3"]
            )
            loaded_b3, _ = load_hybrid_checkpoint(c_m4["checkpoints"]["B3"])
            self.assertEqual(len(member_payloads), 5)
            seeds = [mp["bootstrap_seed"] for mp in member_payloads]
            self.assertEqual(len(set(seeds)), 5)
            for mp in member_payloads:
                self.assertIn("bootstrap_provenance", mp)
                self.assertEqual(len(mp["loss_history"]), 2)
                self.assertIn("indices_sha256", mp["bootstrap_provenance"])

            s_test = torch.tensor(cal_b["transitions"][0][0], dtype=torch.float32).unsqueeze(0)
            a_test = torch.tensor(cal_b["transitions"][0][1], dtype=torch.float32).unsqueeze(0)
            m_rec, epi_rec, alea_rec = reconstructed_b3.predict_with_uncertainty(s_test, a_test)
            m_orig, epi_orig, alea_orig = loaded_b3.predict_with_uncertainty(s_test, a_test)
            torch.testing.assert_close(m_rec, m_orig, atol=1e-6, rtol=1e-6)
            torch.testing.assert_close(epi_rec, epi_orig, atol=1e-6, rtol=1e-6)
            torch.testing.assert_close(alea_rec, alea_orig, atol=1e-6, rtol=1e-6)
            self.assertGreater(float(epi_rec.sum().item()), 0.0)
            self.assertGreater(float(alea_rec.sum().item()), 0.0)

            # Verify B4 + APS + Episode + MultiHorizon serialization & reconstruction
            b4_path = c_m4["checkpoints"]["B4"]
            self.assertTrue(os.path.exists(b4_path))
            reconstructed_b4, b4_art = Phase34TrainingPipeline.reconstruct_b4_from_artifacts(
                b4_path, c_m4["checkpoints"]["B1"]
            )
            self.assertEqual(b4_art["b4_contact_stratified"]["min_stratum_samples"], PHASE34_B4_MIN_STRATUM_SAMPLES)
            self.assertEqual(b4_art["b4_contact_stratified"]["min_stratum_samples"], 29)
            self.assertIn("aps_calibration", b4_art)
            self.assertTrue(0.0 <= b4_art["aps_calibration"]["aps_quantile"] <= 1.0)
            self.assertIn("episode_conformal_calibration", b4_art)
            self.assertTrue(b4_art["episode_conformal_calibration"]["diagnostics"]["calibrated"])
            self.assertIn("multihorizon_quantile_calibration", b4_art)
            self.assertTrue(b4_art["multihorizon_quantile_calibration"]["diagnostics"]["calibrated"])
            json.dumps(b4_art, allow_nan=False)

            pred_mu, radius = reconstructed_b4.predict_region(
                cal_b["transitions"][0][0], cal_b["transitions"][0][1], stratum=0
            )
            self.assertEqual(pred_mu.shape, (15,))
            self.assertTrue(math.isfinite(radius) and radius > 0.0)

            # Cross-run exact reproducibility between dir_a and dir_b
            self.assertEqual(
                res_a["conditions"]["M4_acmm"]["b4_calibration_summary"],
                res_b["conditions"]["M4_acmm"]["b4_calibration_summary"],
            )
            self.assertEqual(
                res_a["conditions"]["M4_acmm"]["training_stats"]["B3"]["member_provenance"],
                res_b["conditions"]["M4_acmm"]["training_stats"]["B3"]["member_provenance"],
            )

    def test_14_repeated_dataset_generation_bit_identical(self):
        """Reproducibility: repeated generate_phase34_datasets calls produce identical episode arrays and metadata."""
        small_pools = {
            "training_compliant_prelift": [1000, 1001],
            "training_peg_in_hole": [1100, 1101],
            "calib_compliant_prelift": [2000, 2001],
            "calib_peg_in_hole": [2100, 2101],
            "offline_test_id": [3000],
            "offline_test_ood": [3040],
            "offline_test_peg_in_hole": [3080],
            "closed_loop_id": [6000],
            "closed_loop_ood": [6100],
            "closed_loop_peg_in_hole": [6200],
            "excluded_p26_pilot": [42],
        }
        with tempfile.TemporaryDirectory() as tmpdir:
            m1 = generate_phase34_datasets(
                dataset_dir=os.path.join(tmpdir, "ds1"),
                manifest_path=os.path.join(tmpdir, "m1.json"),
                horizon=12,
                seed_pools=small_pools,
            )
            m2 = generate_phase34_datasets(
                dataset_dir=os.path.join(tmpdir, "ds2"),
                manifest_path=os.path.join(tmpdir, "m2.json"),
                horizon=12,
                seed_pools=small_pools,
            )
            self.assertEqual(set(m1["splits"].keys()), set(m2["splits"].keys()))
            for k in m1["splits"]:
                self.assertEqual(m1["splits"][k]["sha256"], m2["splits"][k]["sha256"])
                self.assertEqual(m1["splits"][k]["seeds"], m2["splits"][k]["seeds"])
                self.assertEqual(m1["splits"][k]["mode_histogram"], m2["splits"][k]["mode_histogram"])


if __name__ == "__main__":
    unittest.main()
