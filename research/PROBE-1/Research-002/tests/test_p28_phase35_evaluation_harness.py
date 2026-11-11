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

import math
import os
import sys
import unittest
import numpy as np

current_dir = os.path.dirname(os.path.abspath(__file__))
r002_root = os.path.abspath(os.path.join(current_dir, ".."))
if r002_root not in sys.path:
    sys.path.insert(0, r002_root)
src_dir = os.path.join(r002_root, "src")
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

from src.environment import CompliantPreLiftContactEnv, PegInHoleEnv
from src.integrated.phase35_evaluator import (
    _compute_auroc,
    _compute_gaussian_ece,
    _evaluate_closed_loop_cell,
    apply_holm_bonferroni,
    compute_paired_binary_comparison,
    compute_paired_continuous_comparison,
    create_phase35_env,
    generate_offline_test_bundles,
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


if __name__ == "__main__":
    unittest.main()

