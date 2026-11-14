"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Phase 3.5 Evaluation Harness & Statistical Contrasts Verification Suite

Verifies all Document 53 v1.1 Phase 3.5 constraints without touching frozen Phase 1–3.4 files:
1. Phase 3.4 dataset & checkpoint SHA-256 pre-flight gate and B3 member reconstruction parity.
2. Offline 120-episode seed reconciliation (3000-3119), 15-D vs 23-D isolation, and OOD stratum mapping.
3. Closed-loop environment instantiations across ID (6000-6024), OOD strata + Regimes A/B
   (6100-6124), and Peg-ID/Peg-OOD (6200-6224).
4. Closed-loop cell evaluation contract preserving failed/dropped/truncated episodes & latency.
5. Exact paired McNemar, Newcombe-Wilson, Wilcoxon signed-rank, Holm-Bonferroni, Gaussian ECE,
   and rank-based AUROC statistical helpers + strict RFC 8259 JSON serializability.
"""

from __future__ import annotations

import json
import math
import os
import sys
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

from src.environment import CompliantPreLiftContactEnv, PegInHoleEnv
from src.integrated.phase35_closure_addendum import verify_archived_phase35_immutability
from src.integrated.phase35_evaluator import (
    _compute_auroc,
    _compute_gaussian_ece,
    _evaluate_classifier_and_aps,
    _evaluate_closed_loop_cell,
    apply_holm_bonferroni,
    compute_paired_binary_comparison,
    compute_paired_continuous_comparison,
    create_phase35_env,
    format_exact_pvalue,
    generate_offline_test_bundles,
    validate_aps_quantile_matches_calibrated,
    verify_phase34_artifacts_and_load,
)
from src.integrated.statistical_analysis import to_json_serializable


class TestPhase35EvaluationHarness(unittest.TestCase):
    """Contract and statistical verification suite for Phase 3.5."""

    def test_01_phase34_checkpoint_sha256_gate_and_loading(self):
        ctx = verify_phase34_artifacts_and_load(r002_root)
        self.assertTrue(ctx["disjoint_pool_audit"]["disjoint_verified"])
        self.assertEqual(ctx["disjoint_pool_audit"]["pairwise_overlap_count"], 0)
        self.assertEqual(set(ctx["models"].keys()), {"peg_in_hole", "compliant_prelift"})
        for task in ("peg_in_hole", "compliant_prelift"):
            for cond in ("M0_passive", "M4_acmm"):
                pack = ctx["models"][task][cond]
                self.assertIn("B1", pack)
                self.assertIn("B2", pack)
                self.assertIn("B3", pack)
                self.assertIn("B4", pack)
                self.assertTrue(pack["B4"].calibrated)
                self.assertIsNotNone(pack["b4_artifact"])

    def test_02_offline_120_episode_seed_reconciliation_and_strata(self):
        bundles = generate_offline_test_bundles(horizon=25)
        self.assertEqual(set(bundles.keys()), {"offline_test_id", "offline_test_ood", "offline_test_peg_in_hole"})
        id_seeds = [ep["seed"] for ep in bundles["offline_test_id"]]
        ood_seeds = [ep["seed"] for ep in bundles["offline_test_ood"]]
        peg_seeds = [ep["seed"] for ep in bundles["offline_test_peg_in_hole"]]

        self.assertEqual(id_seeds, list(range(3000, 3040)))
        self.assertEqual(ood_seeds, list(range(3040, 3080)))
        self.assertEqual(peg_seeds, list(range(3080, 3120)))

        ood_strata = {ep["env_meta"]["sub_stratum"] for ep in bundles["offline_test_ood"]}
        self.assertEqual(
            ood_strata,
            {"OOD-LowMu", "OOD-HighMass", "OOD-RegimeA-FrictionStep", "OOD-RegimeB-MassInflux"},
        )
        peg_strata = {ep["env_meta"]["sub_stratum"] for ep in bundles["offline_test_peg_in_hole"]}
        self.assertEqual(peg_strata, {"Peg-ID", "Peg-OOD"})

        for ep in bundles["offline_test_id"] + bundles["offline_test_ood"]:
            self.assertEqual(ep["realized_states"].shape[1], 23)
            self.assertEqual(ep["actions"].shape[1], 5)
            self.assertEqual(len(ep["realized_states"]), len(ep["actions"]))
        for ep in bundles["offline_test_peg_in_hole"]:
            self.assertEqual(ep["realized_states"].shape[1], 15)
            self.assertEqual(ep["actions"].shape[1], 6)
            self.assertEqual(len(ep["realized_states"]), len(ep["actions"]))

    def test_03_closed_loop_env_stratum_mapping_and_hidden_mu(self):
        # ID
        env_id, m_id = create_phase35_env("ID", 6000)
        self.assertIsInstance(env_id, CompliantPreLiftContactEnv)
        self.assertEqual(m_id["sub_stratum"], "ID-Nominal")
        self.assertAlmostEqual(env_id.mu_true, 0.50, places=9)
        self.assertAlmostEqual(env_id.object_mass, 0.350, places=9)
        self.assertNotIn("mu_true", env_id.reset())

        # OOD nonstationary Regime A (6117) and Regime B (6121)
        env_a, m_a = create_phase35_env("OOD", 6117)
        self.assertEqual(m_a["sub_stratum"], "OOD-RegimeA-FrictionStep")
        self.assertEqual(env_a.regime, "A")
        env_b, m_b = create_phase35_env("OOD", 6121)
        self.assertEqual(m_b["sub_stratum"], "OOD-RegimeB-MassInflux")
        self.assertEqual(env_b.regime, "B")

        # PegInHole ID (6200) and OOD (6210)
        env_p1, m_p1 = create_phase35_env("PegInHole", 6200)
        env_p2, m_p2 = create_phase35_env("PegInHole", 6210)
        self.assertIsInstance(env_p1, PegInHoleEnv)
        self.assertEqual(m_p1["sub_stratum"], "Peg-ID")
        self.assertAlmostEqual(env_p1.clearance, 0.50, places=9)
        self.assertEqual(m_p2["sub_stratum"], "Peg-OOD")
        self.assertIn(env_p2.friction_coeff, (0.75, 0.85))
        self.assertIn(env_p2.clearance, (0.18, 0.25))

    def test_04_closed_loop_cell_smoke_preserves_all_episode_metadata(self):
        ctx = verify_phase34_artifacts_and_load(r002_root)
        wm = ctx["models"]["compliant_prelift"]["M4_acmm"]["B3"]
        b4 = ctx["models"]["compliant_prelift"]["M4_acmm"]["B4"]
        cell = _evaluate_closed_loop_cell(
            cell_id="C12_smoke",
            task="compliant_prelift",
            condition="M4_acmm",
            arch="B3",
            regime="OOD",
            seeds=[6100, 6117],
            hybrid_wm=wm,
            b4_model=b4,
            eval_horizon=8,
            seed_offset=42,
        )
        self.assertEqual(cell["num_episodes"], 2)
        self.assertEqual(len(cell["episodes"]), 2)
        self.assertEqual([e["seed"] for e in cell["episodes"]], [6100, 6117])
        self.assertEqual(cell["episodes"][0]["sub_stratum"], "OOD-LowMu")
        self.assertEqual(cell["episodes"][1]["sub_stratum"], "OOD-RegimeA-FrictionStep")
        self.assertGreater(cell["cpu_step_latency_ms"]["p50"], 0.0)
        for ep in cell["episodes"]:
            self.assertIn("termination_reason", ep)
            self.assertIn("failure_mode", ep)
            self.assertTrue(ep["all_finite"])
        to_json_serializable(cell)

    def test_05_statistical_comparison_and_calibration_helpers(self):
        # Paired binary McNemar & Newcombe-Wilson
        m4_b = [True] * 10 + [False] * 5
        m0_b = [False] * 8 + [True] * 2 + [False] * 5
        b_res = compute_paired_binary_comparison(m4_b, m0_b, "test_bin")
        self.assertEqual(b_res["discordant_pairs"]["m4_only_b"], 8)
        self.assertEqual(b_res["discordant_pairs"]["m0_only_c"], 0)
        self.assertLess(b_res["mcnemar_exact_p"], 0.01)

        # Paired Wilcoxon & Cohen's dz
        m4_c = np.linspace(1.0, 2.0, 20)
        m0_c = m4_c + 1.5
        c_res = compute_paired_continuous_comparison(m4_c, m0_c, "test_cont")
        self.assertAlmostEqual(c_res["diff_m4_minus_m0_summary"]["mean"], -1.5, places=4)
        self.assertLess(c_res["wilcoxon_p"], 0.001)
        self.assertAlmostEqual(c_res["rank_biserial_r"], -1.0, places=4)

        # Holm-Bonferroni monotonicity
        items = [{"p": 0.01}, {"p": 0.04}, {"p": 0.03}]
        apply_holm_bonferroni(items, "p")
        self.assertAlmostEqual(items[0]["p_holm_adjusted"], 0.03, places=6)
        self.assertAlmostEqual(items[2]["p_holm_adjusted"], 0.06, places=6)
        self.assertAlmostEqual(items[1]["p_holm_adjusted"], 0.06, places=6)

        # Gaussian ECE on standard normal sample should be small
        rng = np.random.RandomState(42)
        y = rng.normal(0.0, 1.0, size=(2000, 4))
        ece = _compute_gaussian_ece(np.zeros_like(y), y, np.ones_like(y))
        self.assertLess(ece["ece"], 0.05)
        self.assertEqual(_compute_auroc(np.array([0.1, 0.2, 0.8, 0.9]), np.array([0, 0, 1, 1])), 1.0)
        self.assertIsNone(_compute_auroc(np.array([0.1, 0.2]), np.array([0, 0])))

    def test_06_aps_calibrated_quantile_enforced_and_mismatch_rejected(self):
        ctx = verify_phase34_artifacts_and_load(r002_root)
        expected = {
            ("compliant_prelift", "M0_passive"): 0.950168,
            ("compliant_prelift", "M4_acmm"): 0.968662,
            ("peg_in_hole", "M0_passive"): 0.991423,
            ("peg_in_hole", "M4_acmm"): 0.924364,
        }
        for (task, cond), exp_q in expected.items():
            pack = ctx["models"][task][cond]
            self.assertAlmostEqual(pack["calibrated_aps_quantile"], exp_q, places=6)
            for arch in ("B1", "B2", "B3"):
                wm = pack[arch]
                self.assertAlmostEqual(float(wm.mode_classifier.aps_quantile), exp_q, places=6)
                validate_aps_quantile_matches_calibrated(wm, pack["b4_artifact"])

        # Regression: evaluation MUST fail if APS quantile diverges (e.g., stale 0.90) from calibrated artifact
        wm_bad = ctx["models"]["compliant_prelift"]["M0_passive"]["B1"]
        b4_art = ctx["models"]["compliant_prelift"]["M0_passive"]["b4_artifact"]
        old_q = wm_bad.mode_classifier.aps_quantile
        try:
            wm_bad.mode_classifier.aps_quantile = 0.90
            with self.assertRaises(ValueError):
                validate_aps_quantile_matches_calibrated(wm_bad, b4_art)
            dummy_s = np.zeros(wm_bad.continuous_model.state_dim, dtype=np.float32)
            dummy_a = np.zeros(wm_bad.continuous_model.action_dim, dtype=np.float32)
            with self.assertRaises(ValueError):
                _evaluate_classifier_and_aps(
                    wm_bad,
                    [(dummy_s, dummy_a, dummy_s, 0)],
                    {"0": 10},
                    calibrated_aps_quantile=b4_art,
                )
        finally:
            wm_bad.mode_classifier.aps_quantile = old_q

    def test_07_exact_pvalue_never_rounds_to_zero_and_holm_preserved(self):
        # 26 vs 0 and 37 vs 3 discordant pairs must yield strictly positive exact p-values (~2.98e-8, ~1.95e-8)
        b_succ = compute_paired_binary_comparison([True] * 26 + [False] * 199, [False] * 225, "grand_succ")
        self.assertGreater(b_succ["mcnemar_exact_p"], 0.0)
        self.assertAlmostEqual(b_succ["mcnemar_exact_p"], 2.9802322387695312e-08, places=14)
        self.assertEqual(b_succ["mcnemar_exact_p_sci"], "2.980232e-08")

        b_viol = compute_paired_binary_comparison(
            [True] * 4 + [True] * 37 + [False] * 3 + [False] * 181,
            [True] * 4 + [False] * 37 + [True] * 3 + [False] * 181,
            "grand_viol",
        )
        self.assertGreater(b_viol["mcnemar_exact_p"], 0.0)
        self.assertAlmostEqual(b_viol["mcnemar_exact_p"], 1.946500560734421e-08, places=14)
        self.assertEqual(b_viol["mcnemar_exact_p_sci"], "1.946501e-08")

        # Continuous n=25 untied strictly positive difference yields exact nonzero Wilcoxon p = 2 * 2^(-25) = 5.960464e-08
        c_res = compute_paired_continuous_comparison(np.arange(1.0, 26.0), np.zeros(25), "wilcoxon_n25_untied")
        self.assertGreater(c_res["wilcoxon_p"], 0.0)
        self.assertEqual(c_res["wilcoxon_p_sci"], "5.960464e-08")

        apply_holm_bonferroni([b_succ, b_viol], "mcnemar_exact_p")
        self.assertGreater(b_succ["mcnemar_exact_p_holm_adjusted"], 0.0)
        self.assertGreater(b_viol["mcnemar_exact_p_holm_adjusted"], 0.0)
        self.assertIn("e-08", b_succ["mcnemar_exact_p_holm_adjusted_sci"])

    def test_08_phase35_archived_artifacts_unchanged_and_addendum_reconciled(self):
        eval_dir = os.path.join(r002_root, "experiments", "phase3_5_evaluation")
        hashes = verify_archived_phase35_immutability(eval_dir)
        self.assertEqual(len(hashes), 4)

        addendum_path = os.path.join(eval_dir, "phase35_closure_addendum.json")
        self.assertTrue(os.path.exists(addendum_path), "Phase 3.5 closure addendum JSON must exist.")
        with open(addendum_path, "r", encoding="utf-8") as f:
            addendum = json.load(f)

        required_sections = {
            "preserved_original_archive_sha256s",
            "aps_corrected",
            "ood_auroc_audit",
            "task2_1step_vs_h1_reconciliation",
            "peginhole_truncation_audit",
            "b4_joint_coverage_audit",
            "exact_nonzero_pvalues",
            "safety_vs_success_analysis",
        }
        self.assertTrue(required_sections.issubset(addendum.keys()))
        self.assertFalse(addendum["aps_corrected"]["closed_loop_influence_audit"]["aps_influenced_closed_loop_planner_or_safety"])

        # Verify no exact p-value inside the addendum statistical correction section is 0.0
        def _assert_nonzero_p(obj):
            if isinstance(obj, dict):
                for k, v in obj.items():
                    if k in ("wilcoxon_p", "wilcoxon_p_holm_adjusted", "mcnemar_exact_p", "mcnemar_exact_p_holm_adjusted"):
                        self.assertGreater(float(v), 0.0)
                    else:
                        _assert_nonzero_p(v)
            elif isinstance(obj, list):
                for item in obj:
                    _assert_nonzero_p(item)

        _assert_nonzero_p(addendum["exact_nonzero_pvalues"])


if __name__ == "__main__":
    unittest.main()

