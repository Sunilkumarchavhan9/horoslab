"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.5 — Five-Way Integrated Evaluation: Experiment Orchestrator

Master orchestrator executing the complete Five-Way Integrated Evaluation:
- 5 Mining Conditions: M0 (D0 Passive), M1 (D1 Random), M2 (D2 Boundary), M3 (D3 Uncertainty), M4 (D4 Combined ACMM).
- Dual Conformal Regimes: CMS-PSACD (7-mode stratified) vs Unstratified Split Conformal Baseline.
- Dual Targets: Target A (Open-Loop Candidate in Clone) vs Target B (Receding Horizon).
- Safety Ablation: Runtime p-CBF Filter Enabled vs Disabled.
- Master Reporting: Exact counts, Wilson 95% CIs, and Failure Taxonomy.
"""

from __future__ import annotations
import os
import sys
import time
import copy
import json
from typing import Dict, Any, List, Tuple, Optional, Sequence
import numpy as np
import torch

from src.mining.trajectory_selector import TrajectorySelector
from src.mining.mining_evaluator import MiningEvaluator
from src.integrated.model_training_runner import ModelTrainingRunner, normalize_architecture_id
from src.integrated.calibration_runner import (
    CalibrationRunner,
    get_phase3_task_pools,
    verify_disjoint_seed_pools,
)
from src.integrated.planner_evaluator import PlannerEvaluator
from src.integrated.safety_evaluator import SafetyEvaluator
from src.integrated.statistical_analysis import (
    HORIZONS,
    format_count_pct,
    compute_wilson_ci,
    compute_multihorizon_rmse,
    compute_multihorizon_rmses,
    compute_mode_confusion_and_f1,
    compute_peg_statistics,
    to_json_serializable,
)


class ExperimentOrchestrator:
    """
    Coordinates end-to-end P2.5 integrated benchmark for a given manipulation task.
    """

    def __init__(
        self,
        task: str = "peg_in_hole",
        eval_horizon: int = 50,
        test_episodes_count: int = 30,
        calib_episodes_count: int = 60,
        active_budget: int = 40,
        alpha: float = 0.10,
        seed: int = 42,
    ):
        self.task = task
        self.eval_horizon = eval_horizon
        self.test_episodes_count = test_episodes_count
        self.calib_episodes_count = calib_episodes_count
        self.active_budget = active_budget
        self.alpha = float(alpha)
        self.seed = seed

        self.mining_evaluator = MiningEvaluator(
            task=task,
            eval_horizon=eval_horizon,
            test_episodes_count=test_episodes_count,
            seed=seed,
        )
        self.training_runner = ModelTrainingRunner(task=task, seed=seed)
        self.calibration_runner = CalibrationRunner(
            alpha=self.alpha,
            min_calib_episodes=None,
            min_stratum_samples=29,
            seed=seed,
        )
        if self.calib_episodes_count < self.calibration_runner.min_calib_episodes:
            raise ValueError(
                f"calib_episodes_count={self.calib_episodes_count} violates minimum calibration pool "
                f"N_calib >= {self.calibration_runner.min_calib_episodes} for alpha={self.alpha}."
            )
        self.disjoint_pool_audit = verify_disjoint_seed_pools()
        self.task_seed_pools = get_phase3_task_pools(self.task, alpha=self.alpha)

        self.planner_evaluator = PlannerEvaluator(
            task=task,
            eval_horizon=eval_horizon,
            plan_horizon=10,
            num_candidates=60,
            elite_fraction=0.15,
            cem_iterations=2,
            seed=seed,
        )
        self.safety_evaluator = SafetyEvaluator(task=task)

    def evaluate_architecture_suite(
        self,
        training_episodes: List[Dict[str, Any]],
        calib_raw_episodes: List[Dict[str, Any]],
        test_raw_episodes: List[Dict[str, Any]],
        architectures: Sequence[str] = ("B1", "B2", "B3", "B4"),
        epochs: int = 45,
        lr: Optional[float] = None,
        run_closed_loop: bool = True,
        closed_loop_episodes: int = 10,
        closed_loop_start_seed: Optional[int] = None,
        use_safety_filter: bool = True,
        uncertainty_beta: float = 1.5,
        ensemble_size: int = 5,
    ) -> Dict[str, Any]:
        """
        Trains and evaluates B1–B4 world-model architectures independently on separated splits:
        - B1 (DeterministicWorldModel + CEMPlanner)
        - B2 (ProbabilisticWorldModel + aleatoric UncertaintyPenalizedCEM)
        - B3 (EnsembleWorldModel E=5 + epistemic UncertaintyPenalizedCEM)
        - B4 (ContactStratifiedConformalWM calibrated strictly on disjoint calibration transitions)
        """
        train_transitions = self.training_runner.extract_transitions(training_episodes)
        calib_transitions = self.training_runner.extract_transitions(calib_raw_episodes)
        test_transitions = self.mining_evaluator.extract_transitions_from_episodes(test_raw_episodes)

        requested = [normalize_architecture_id(a) for a in architectures]
        trained = self.training_runner.train_all_architectures(
            training_transitions=train_transitions,
            calib_transitions=calib_transitions if "B4" in requested else None,
            architectures=requested,
            epochs=epochs,
            lr=lr,
            alpha=self.alpha,
            ensemble_size=ensemble_size,
        )
        models = trained["models"]
        train_stats = trained["stats"]

        cl_seed = closed_loop_start_seed
        if cl_seed is None:
            cl_seed = (
                self.task_seed_pools["closed_loop_eval"][0]
                if "closed_loop_eval" in self.task_seed_pools
                else self.task_seed_pools["closed_loop_id"][0]
            )

        architecture_results: Dict[str, Any] = {}
        for arch in ("B1", "B2", "B3"):
            if arch not in models:
                continue
            model = models[arch]
            offline_1step = self.mining_evaluator.evaluate_offline_predictions(model, test_transitions)
            offline_mh = self.mining_evaluator.evaluate_multihorizon_offline(
                model, test_raw_episodes, horizons=HORIZONS
            )

            entry: Dict[str, Any] = {
                "architecture_id": arch,
                "model_class": type(model.continuous_model).__name__,
                "is_conformal_architecture": False,
                "training_stats": train_stats[arch],
                "offline_1step": offline_1step,
                "offline_multihorizon_rmse": offline_mh,
            }

            if run_closed_loop:
                cl_res = self.planner_evaluator.evaluate_policy(
                    hybrid_wm=model,
                    num_episodes=closed_loop_episodes,
                    start_seed=cl_seed,
                    use_safety_filter=use_safety_filter,
                    architecture_id=arch,
                    planner_type="auto",
                    uncertainty_beta=uncertainty_beta,
                )
                entry["closed_loop"] = {
                    "planner_identity": cl_res["planner_identity"],
                    "planner_type": cl_res["planner_type"],
                    "uncertainty_source": cl_res["uncertainty_source"],
                    "uncertainty_beta": cl_res["uncertainty_beta"],
                    "uncertainty_summary": cl_res["uncertainty_summary"],
                    "task_success": cl_res["task_success"],
                    "safety_violations": cl_res["safety_violations"],
                    "stall_rate": cl_res["stall_rate"],
                    "goal_progress": cl_res["goal_progress"],
                    "planner_exploitation_gap": cl_res["planner_exploitation_gap"],
                    "target_a_multihorizon_rmse": cl_res["target_a_multihorizon_rmse"],
                }

            architecture_results[arch] = entry

        if "B4" in models:
            b4_model = models["B4"]
            b4_eval = self.mining_evaluator.evaluate_conformal_b4(b4_model, test_transitions)
            architecture_results["B4"] = {
                "architecture_id": "B4",
                "model_class": "ContactStratifiedConformalWM",
                "is_conformal_architecture": True,
                "training_stats": train_stats["B4"],
                "conformal_evaluation": b4_eval,
            }

        return {
            "task": self.task,
            "horizons": list(HORIZONS),
            "architectures": architecture_results,
        }

    def run_benchmark(
        self,
        output_dir: Optional[str] = None,
        architectures: Sequence[str] = ("B1", "B2", "B3", "B4"),
        train_epochs: int = 45,
    ) -> Dict[str, Any]:
        """
        Executes full Five-Way Integrated Evaluation across conditions M0 through M4.
        """
        print(f"\n================================================================================", flush=True)
        print(f"  HOROS PROBE-1: STAGE P2.5 INTEGRATED EVALUATION — TASK: {self.task.upper()}", flush=True)
        print(f"================================================================================", flush=True)

        t0 = time.time()
        np.random.seed(self.seed)
        torch.manual_seed(self.seed)

        train_start_seed = self.task_seed_pools["training"][0]
        calib_start_seed = self.task_seed_pools["calibration"][0]
        offline_start_seed = (
            self.task_seed_pools["offline_eval"][0]
            if "offline_eval" in self.task_seed_pools
            else self.task_seed_pools["offline_eval_id"][0]
        )
        closed_loop_start_seed = (
            self.task_seed_pools["closed_loop_eval"][0]
            if "closed_loop_eval" in self.task_seed_pools
            else self.task_seed_pools["closed_loop_id"][0]
        )

        # 1. Dataset Generation: D0 Passive Baseline (strictly inside task training seed range)
        print(f"  [1/4] Mining D0 baseline dataset (25 passive episodes, start_seed={train_start_seed})...", flush=True)
        d0_selector = TrajectorySelector(task=self.task, budget=25, seed=self.seed)
        d0_res = d0_selector.mine_trajectories(
            strategy="D1_random",
            num_candidates=25,
            start_seed=train_start_seed,
            horizon=self.eval_horizon,
        )
        d0_episodes = d0_res["admitted_trajectories"]

        # 2. Held-Out Evaluation Partitions (Strictly disjoint calibration & test pools)
        print(
            f"  [2/4] Generating held-out calibration (N={self.calib_episodes_count}, start_seed={calib_start_seed}) "
            f"and test (N={self.test_episodes_count}, start_seed={offline_start_seed}) partitions...",
            flush=True,
        )
        calib_selector = TrajectorySelector(task=self.task, budget=self.calib_episodes_count, seed=self.seed + 800)
        calib_res = calib_selector.mine_trajectories(
            strategy="D4_acmm",
            num_candidates=self.calib_episodes_count * 2,
            start_seed=calib_start_seed,
            horizon=self.eval_horizon,
        )
        calib_raw_episodes = calib_res["admitted_trajectories"]

        test_selector = TrajectorySelector(task=self.task, budget=self.test_episodes_count, seed=self.seed + 999)
        test_res = test_selector.mine_trajectories(
            strategy="D4_acmm",
            num_candidates=self.test_episodes_count * 2,
            start_seed=offline_start_seed,
            horizon=self.eval_horizon,
        )
        test_raw_episodes = test_res["admitted_trajectories"]
        test_offline_transitions = self.mining_evaluator.extract_transitions_from_episodes(test_raw_episodes)

        # Active selector for mining D1 - D4
        active_selector = TrajectorySelector(task=self.task, budget=self.active_budget, d_min=0.20, seed=self.seed + 200)

        conditions = [
            ("M0_passive", "D0_passive"),
            ("M1_random", "D1_random"),
            ("M2_boundary", "D2_boundary"),
            ("M3_uncertainty", "D3_uncertainty"),
            ("M4_acmm", "D4_acmm"),
        ]

        condition_results = {}

        # 3. Benchmark Loop across 5 Conditions
        for cond_name, strat in conditions:
            print(f"\n  ----------------------------------------------------------------", flush=True)
            print(f"  >>> EXECUTING CONDITION: {cond_name} (Strategy: {strat})", flush=True)
            print(f"  ----------------------------------------------------------------", flush=True)
            t_cond_start = time.time()

            if strat == "D0_passive":
                active_eps = []
                mining_meta = {
                    "strategy": "D0_passive",
                    "admitted_count": 0,
                    "unique_modes": d0_res["unique_contact_modes"],
                    "num_unique_modes": d0_res["num_unique_modes"],
                }
            else:
                cand_mult = 3 if strat == "D4_acmm" else 2
                mine_res = active_selector.mine_trajectories(
                    strategy=strat,
                    num_candidates=self.active_budget * cand_mult,
                    start_seed=train_start_seed + 25,
                    horizon=self.eval_horizon,
                )
                active_eps = mine_res["admitted_trajectories"]
                mining_meta = {
                    "strategy": strat,
                    "admitted_count": len(active_eps),
                    "unique_modes": mine_res["unique_contact_modes"],
                    "num_unique_modes": mine_res["num_unique_modes"],
                    "success_count_in_mined": mine_res["success_count_in_mined"],
                }

            training_episodes = d0_episodes + active_eps
            train_transitions = self.training_runner.extract_transitions(training_episodes)
            print(f"    [Train] Training B1-B4 models on {len(training_episodes)} episodes ({len(train_transitions)} transitions)...", flush=True)

            arch_suite = self.evaluate_architecture_suite(
                training_episodes=training_episodes,
                calib_raw_episodes=calib_raw_episodes,
                test_raw_episodes=test_raw_episodes,
                architectures=architectures,
                epochs=train_epochs,
                run_closed_loop=True,
                closed_loop_episodes=self.test_episodes_count,
                closed_loop_start_seed=closed_loop_start_seed,
                use_safety_filter=True,
            )

            # Primary B1 reference model for legacy condition-level summary + CMS-PSACD transfer gap
            model = self.training_runner.train_hybrid_model(train_transitions, epochs=train_epochs, model_type="B1")
            offline_acc = self.mining_evaluator.evaluate_offline_predictions(model, test_offline_transitions)
            offline_mh = self.mining_evaluator.evaluate_multihorizon_offline(
                model, test_raw_episodes, horizons=HORIZONS
            )
            print(f"    [Offline] State RMSE: {offline_acc['state_rmse']}, Force RMSE: {offline_acc['force_rmse']}, Mode Macro-F1: {offline_acc['mode_macro_f1']}", flush=True)

            # Receding-Horizon Evaluation with p-CBF filter enabled (Target A & B)
            print(
                f"    [Closed-Loop] Evaluating {self.test_episodes_count} test episodes "
                f"(p-CBF ON, H={self.eval_horizon}, start_seed={closed_loop_start_seed})...",
                flush=True,
            )
            eval_pcbf_on = self.planner_evaluator.evaluate_policy(
                hybrid_wm=model,
                num_episodes=self.test_episodes_count,
                start_seed=closed_loop_start_seed,
                use_safety_filter=True,
                architecture_id="B1",
            )

            # Safety filter ablation: evaluate without p-CBF
            print(
                f"    [Ablation] Evaluating {self.test_episodes_count} test episodes without p-CBF filter...",
                flush=True,
            )
            eval_pcbf_off = self.planner_evaluator.evaluate_policy(
                hybrid_wm=model,
                num_episodes=self.test_episodes_count,
                start_seed=closed_loop_start_seed,
                use_safety_filter=False,
                architecture_id="B1",
            )

            # Conformal Calibration: CMS-PSACD vs Unstratified Baseline (disjoint task calibration pool)
            print(
                f"    [Calibration] Calibrating conformal engines on {self.calib_episodes_count} Target A "
                f"episodes (start_seed={calib_start_seed})...",
                flush=True,
            )
            calib_a_res = self.planner_evaluator.evaluate_policy(
                hybrid_wm=model,
                num_episodes=self.calib_episodes_count,
                start_seed=calib_start_seed,
                use_safety_filter=True,
                architecture_id="B1",
            )
            calib_a_episodes = calib_a_res["target_a_episodes"]

            # Fit CMS-PSACD engine
            cms_engine = self.calibration_runner.calibrate_cms_psacd(calib_a_episodes)
            unstrat_quantiles = self.calibration_runner.calibrate_unstratified_baseline(calib_a_episodes)

            # Evaluate calibration regimes on test Target A and Target B
            calib_eval_a = self.calibration_runner.evaluate_calibration_regimes(
                engine_cms=cms_engine,
                unstrat_quantiles=unstrat_quantiles,
                test_episodes=eval_pcbf_on["target_a_episodes"],
            )

            calib_eval_b = self.calibration_runner.evaluate_calibration_regimes(
                engine_cms=cms_engine,
                unstrat_quantiles=unstrat_quantiles,
                test_episodes=eval_pcbf_on["target_b_episodes"],
            )

            cov_a_sim = calib_eval_a["cms_psacd"]["joint_simultaneous"]["rate"]
            cov_b_sim = calib_eval_b["cms_psacd"]["joint_simultaneous"]["rate"]
            transfer_gap = round(cov_a_sim - cov_b_sim, 4)

            elapsed_cond = round(time.time() - t_cond_start, 2)
            print(f"    [Result] Success: {eval_pcbf_on['task_success']['formatted']}, Transfer Gap: {transfer_gap}, Elapsed: {elapsed_cond}s", flush=True)

            condition_results[cond_name] = {
                "condition": cond_name,
                "strategy": strat,
                "dataset_size_episodes": len(training_episodes),
                "dataset_size_transitions": len(train_transitions),
                "mining_metadata": mining_meta,
                "offline_accuracy": offline_acc,
                "offline_multihorizon_rmse": offline_mh,
                "architecture_evaluations": arch_suite["architectures"],
                "closed_loop_performance": {
                    "planner_identity": eval_pcbf_on["planner_identity"],
                    "task_success": eval_pcbf_on["task_success"],
                    "safety_violations": eval_pcbf_on["safety_violations"],
                    "stall_rate": eval_pcbf_on["stall_rate"],
                    "goal_progress": eval_pcbf_on["goal_progress"],
                    "mean_action_magnitude": eval_pcbf_on["mean_action_magnitude"],
                    "planner_exploitation_gap": eval_pcbf_on["planner_exploitation_gap"],
                    "target_a_multihorizon_rmse": eval_pcbf_on["target_a_multihorizon_rmse"],
                },
                "calibration_ablation": {
                    "calibration_diagnostics": cms_engine.get_calibration_diagnostics(),
                    "calibration_start_seed": calib_start_seed,
                    "target_a_evaluation": calib_eval_a,
                    "target_b_evaluation": calib_eval_b,
                    "closed_loop_transfer_gap": {
                        "delta_transfer": transfer_gap,
                        "c_target_a": cov_a_sim,
                        "c_target_b": cov_b_sim,
                    },
                    "unstratified_quantiles": unstrat_quantiles,
                },
                "safety_audit": eval_pcbf_on["safety_audit"],
                "safety_ablation_unfiltered": {
                    "task_success": eval_pcbf_off["task_success"],
                    "safety_violations": eval_pcbf_off["safety_violations"],
                    "stall_rate": eval_pcbf_off["stall_rate"],
                    "goal_progress": eval_pcbf_off["goal_progress"],
                },
                "elapsed_seconds": elapsed_cond,
            }

        total_elapsed = round(time.time() - t0, 2)

        master_report = {
            "program": "HOROS PROBE-1 — Humanoid Robotics & Physical AI",
            "project": "Research-002: Trustworthy Action-Conditioned Contact World Models",
            "stage": "P2.5/P2.8: Integrated Evaluation",
            "task": self.task,
            "eval_horizon_steps": self.eval_horizon,
            "test_episodes_count": self.test_episodes_count,
            "calibration_episodes_count": self.calib_episodes_count,
            "disjoint_pool_audit": self.disjoint_pool_audit,
            "total_runtime_seconds": total_elapsed,
            "conditions": condition_results,
        }

        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
            report_path = os.path.join(output_dir, f"p25_{self.task}_master_report.json")
            with open(report_path, "w", encoding="utf-8") as f:
                json.dump(to_json_serializable(master_report), f, indent=2, allow_nan=False)
            print(f"\n Master benchmark report saved to: {report_path}", flush=True)

        return master_report
