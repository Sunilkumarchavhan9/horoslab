"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.4 — Active Contact-Mode Mining: Evaluator Harness

Trains world models on augmented datasets (D0, D1, D2, D3, D4) and evaluates:
1. Contact Mode Classification Macro-F1 across all 7 contact strata.
2. Next-step state & contact force prediction RMSE.
3. Multi-horizon rollout RMSE across H in {1, 3, 5, 10, 20}.
4. Conformal calibration coverage & prediction interval widths.
5. Downstream closed-loop manipulation performance under the 50-step closed-loop horizon.
"""

from __future__ import annotations
import math
import copy
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
import torch
import torch.optim as optim

from src.contact_modes.contact_mode_definitions import ContactMode, NUM_MODES, classify_contact_mode
from src.contact_modes.contact_mode_classifier import ContactModeClassifier
from src.contact_modes.hybrid_contact_state_model import HybridContactStateModel
from src.models.deterministic_wm import DeterministicWorldModel
from src.models.stratified_conformal_wm import ContactStratifiedConformalWM
from src.planners.cem_planner import CEMPlanner
from src.environment.peg_in_hole_env import PegInHoleEnv
from src.environment.multifinger_lift_env import MultifingerLiftEnv
from src.environment.compliant_prelift_env import CompliantPreLiftContactEnv
from src.environment.step_adapter import step_env_compatible
from src.selection_aware.counterfactual_rollout import extract_env_state_and_wrench
from src.selection_aware.episode_conformal_engine import EpisodeConformalEngine, compute_wilson_ci


class MiningEvaluator:
    """
    Trains and evaluates world models trained on D0, D1, D2, D3, and D4 active datasets.
    """

    def __init__(
        self,
        task: str = "peg_in_hole",
        eval_horizon: int = 50,
        test_episodes_count: int = 30,
        seed: int = 42
    ):
        self.task = task
        self.eval_horizon = eval_horizon
        self.test_episodes_count = test_episodes_count
        self.seed = seed

        if task == "peg_in_hole":
            self.state_dim = 15
            self.action_dim = 6
            self.action_bounds = (np.array([-5.0, -5.0, -5.0, -2.0, -2.0, -2.0]),
                                  np.array([5.0, 5.0, 5.0, 2.0, 2.0, 2.0]))
            def reward_fn(s, a):
                peg_z = s[2]
                lateral_err = np.linalg.norm(s[:2])
                wrench_norm = np.linalg.norm(s[9:15]) if len(s) >= 15 else np.linalg.norm(s[:3])
                # Direct downward guidance + lateral centering penalty
                return -float(lateral_err * 2.0 + max(0.0, peg_z) * 1.5 - min(0.0, peg_z) * 5.0 + wrench_norm * 0.1)
            self.reward_fn = reward_fn
        else:
            self.state_dim = 23
            self.action_dim = 5
            self.action_bounds = (np.array([-1.0, -1.0, -1.0, -1.0, -1.0]),
                                  np.array([1.0, 1.0, 1.0, 1.0, 1.0]))
            def reward_fn(s, a):
                obj_z = s[22] if len(s) >= 23 else s[2]
                slip = np.linalg.norm(s[16:20]) if len(s) >= 23 else 0.0
                force_err = abs(np.sum(s[12:16]) - 16.0) if len(s) >= 23 else 0.0
                return float(obj_z * 15.0 - slip * 5.0 - force_err * 0.1)
            self.reward_fn = reward_fn

    def extract_transitions_from_episodes(self, episodes: List[Dict[str, Any]]) -> List[Tuple[np.ndarray, np.ndarray, np.ndarray, int]]:
        """Extracts (s_t, a_t, s_{t+1}, m_t) transitions from an episode list."""
        transitions = []
        for ep in episodes:
            states = ep.get("realized_states")
            actions = ep.get("actions")
            modes = ep.get("realized_modes")

            if states is None or len(states) < 2 or actions is None:
                continue

            H = min(len(states) - 1, len(actions))
            for t in range(H):
                s_t = states[t]
                a_t = actions[t]
                s_next = states[t + 1]
                m_t = int(modes[t]) if modes is not None and len(modes) > t else 0
                transitions.append((s_t, a_t, s_next, m_t))

        return transitions

    def train_world_model(
        self,
        training_transitions: List[Tuple[np.ndarray, np.ndarray, np.ndarray, int]],
        epochs: int = 50,
        lr: float = 2e-3
    ) -> HybridContactStateModel:
        """Trains deterministic state model and contact mode classifier on transitions."""
        torch.manual_seed(self.seed)
        np.random.seed(self.seed)

        s_arr = torch.tensor(np.array([x[0] for x in training_transitions]), dtype=torch.float32)
        a_arr = torch.tensor(np.array([x[1] for x in training_transitions]), dtype=torch.float32)
        next_s_arr = torch.tensor(np.array([x[2] for x in training_transitions]), dtype=torch.float32)
        m_arr = torch.tensor(np.array([x[3] for x in training_transitions]), dtype=torch.long)

        det_wm = DeterministicWorldModel(self.state_dim, self.action_dim, hidden_dim=64)
        opt_wm = optim.Adam(det_wm.parameters(), lr=lr)
        for _ in range(epochs):
            opt_wm.zero_grad()
            loss = torch.mean((det_wm(s_arr, a_arr) - next_s_arr) ** 2)
            loss.backward()
            opt_wm.step()

        mode_clf = ContactModeClassifier(self.state_dim, self.action_dim, hidden_dim=64, num_modes=NUM_MODES)
        opt_clf = optim.Adam(mode_clf.parameters(), lr=lr)
        loss_ce = torch.nn.CrossEntropyLoss()
        for _ in range(epochs):
            opt_clf.zero_grad()
            loss = loss_ce(mode_clf(s_arr, a_arr), m_arr)
            loss.backward()
            opt_clf.step()

        return HybridContactStateModel(det_wm, mode_clf)

    def evaluate_offline_predictions(
        self,
        hybrid_wm: HybridContactStateModel,
        test_transitions: List[Tuple[np.ndarray, np.ndarray, np.ndarray, int]],
    ) -> Dict[str, Any]:
        """
        Evaluates 1-step prediction RMSE, uncertainty decomposition (B2/B3), and mode macro-F1.
        """
        if len(test_transitions) == 0:
            return {"state_rmse": 0.0, "mode_f1": 0.0, "force_rmse": 0.0}

        s_arr = torch.tensor(np.array([x[0] for x in test_transitions]), dtype=torch.float32)
        a_arr = torch.tensor(np.array([x[1] for x in test_transitions]), dtype=torch.float32)
        true_s_next = np.array([x[2] for x in test_transitions])
        true_s_tensor = torch.tensor(true_s_next, dtype=torch.float32)
        true_modes = np.array([x[3] for x in test_transitions])

        with torch.no_grad():
            if hasattr(hybrid_wm, "predict_with_uncertainty"):
                pred_t, epi_var_t, alea_var_t = hybrid_wm.predict_with_uncertainty(s_arr, a_arr)
                pred_s = pred_t.numpy()
                epi_var_np = torch.clamp(epi_var_t, min=0.0).numpy()
                alea_var_np = torch.clamp(alea_var_t, min=0.0).numpy()
            else:
                res = hybrid_wm.continuous_model(s_arr, a_arr)
                pred_t = res[0] if isinstance(res, tuple) else res
                pred_s = pred_t.numpy()
                epi_var_np = np.zeros_like(pred_s)
                alea_var_np = res[1].numpy() if isinstance(res, tuple) and len(res) >= 2 else np.zeros_like(pred_s)

            if hasattr(hybrid_wm, "predict_mode_logits"):
                logits = hybrid_wm.predict_mode_logits(s_arr, a_arr).numpy()
            else:
                logits = hybrid_wm.mode_classifier(s_arr, a_arr).numpy()
            pred_modes = np.argmax(logits, axis=-1)

        state_rmse = float(np.sqrt(np.mean((pred_s - true_s_next) ** 2)))

        # Wrench RMSE (indices 9:15 for peg_in_hole, 12:16 for multifinger_lift)
        if self.task == "peg_in_hole":
            force_rmse = float(np.sqrt(np.mean((pred_s[:, 9:15] - true_s_next[:, 9:15]) ** 2)))
        else:
            force_rmse = float(np.sqrt(np.mean((pred_s[:, 12:16] - true_s_next[:, 12:16]) ** 2)))

        # Uncertainty decomposition & Gaussian NLL (when predictive variance > 0)
        epi_std_mean = float(np.mean(np.linalg.norm(np.sqrt(epi_var_np), axis=-1)))
        alea_std_mean = float(np.mean(np.linalg.norm(np.sqrt(alea_var_np), axis=-1)))
        total_var_np = epi_var_np + alea_var_np
        gaussian_nll: Optional[float] = None
        if float(np.max(total_var_np)) > 0.0:
            if hasattr(hybrid_wm, "compute_nll"):
                with torch.no_grad():
                    gaussian_nll = round(
                        float(hybrid_wm.compute_nll(s_arr, a_arr, true_s_tensor).item()),
                        4,
                    )
            elif hasattr(hybrid_wm.continuous_model, "compute_nll"):
                with torch.no_grad():
                    gaussian_nll = round(
                        float(hybrid_wm.continuous_model.compute_nll(s_arr, a_arr, true_s_tensor).item()),
                        4,
                    )
            else:
                tv = np.maximum(total_var_np, 1e-6)
                nll_val = 0.5 * np.mean(np.sum(((true_s_next - pred_s) ** 2) / tv + np.log(tv), axis=-1))
                gaussian_nll = round(float(nll_val), 4)

        # Macro-F1 across 7 modes
        f1_scores = []
        for m in range(NUM_MODES):
            tp = np.sum((pred_modes == m) & (true_modes == m))
            fp = np.sum((pred_modes == m) & (true_modes != m))
            fn = np.sum((pred_modes != m) & (true_modes == m))
            precision = tp / max(1, tp + fp)
            recall = tp / max(1, tp + fn)
            denom = precision + recall
            f1 = (2 * precision * recall / denom) if denom > 0 else 0.0
            f1_scores.append(f1)

        macro_f1 = float(np.mean(f1_scores))

        return {
            "architecture_id": getattr(hybrid_wm, "architecture_id", type(hybrid_wm.continuous_model).__name__),
            "state_rmse": round(state_rmse, 4),
            "force_rmse": round(force_rmse, 4),
            "mode_macro_f1": round(macro_f1, 4),
            "epistemic_uncertainty_mean": round(epi_std_mean, 4),
            "aleatoric_uncertainty_mean": round(alea_std_mean, 4),
            "gaussian_nll": gaussian_nll,
        }

    def evaluate_multihorizon_offline(
        self,
        hybrid_wm: HybridContactStateModel,
        test_episodes: List[Dict[str, Any]],
        horizons: Tuple[int, ...] = (1, 3, 5, 10, 20),
    ) -> Dict[str, Any]:
        """
        Executes multi-step open-loop rollouts on held-out episodes over H in {1, 3, 5, 10, 20}
        without zero-padding short/terminated sequences, and computes component-wise RMSE via
        compute_multihorizon_rmse.
        """
        from src.integrated.statistical_analysis import compute_multihorizon_rmse

        pred_trajs: List[Optional[np.ndarray]] = []
        true_trajs: List[Optional[np.ndarray]] = []
        pred_tan_list: List[Optional[np.ndarray]] = []
        true_tan_list: List[Optional[np.ndarray]] = []
        epi_by_h: Dict[int, List[float]] = {h: [] for h in horizons}
        alea_by_h: Dict[int, List[float]] = {h: [] for h in horizons}

        max_h = max(horizons)
        for ep in test_episodes:
            states = ep.get("realized_states")
            actions = ep.get("actions")
            if states is None or actions is None or len(states) < 2 or len(actions) < 1:
                continue

            rollout_len = min(len(actions), len(states) - 1, max_h)
            if rollout_len <= 0:
                continue

            rollout = hybrid_wm.predict_multistep(
                init_state=np.asarray(states[0], dtype=np.float32),
                action_sequence=np.asarray(actions[:rollout_len], dtype=np.float32),
                horizon=rollout_len,
                task=self.task,
            )
            pred_trajs.append(rollout["states"])
            true_trajs.append(np.asarray(states[1 : 1 + rollout_len], dtype=np.float32))

            p_tf = ep.get("pred_tangential_forces")
            t_tf = ep.get("true_tangential_forces")
            pred_tan_list.append(np.asarray(p_tf[:rollout_len], dtype=np.float32) if p_tf is not None else None)
            true_tan_list.append(np.asarray(t_tf[:rollout_len], dtype=np.float32) if t_tf is not None else None)

            epi_arr = rollout.get("epistemic_uncertainties")
            alea_arr = rollout.get("aleatoric_uncertainties")
            for h in horizons:
                h_idx = h - 1
                if h_idx < rollout_len:
                    if epi_arr is not None and h_idx < len(epi_arr):
                        epi_by_h[h].append(float(epi_arr[h_idx]))
                    if alea_arr is not None and h_idx < len(alea_arr):
                        alea_by_h[h].append(float(alea_arr[h_idx]))

        has_ext_tan = any(p is not None and t is not None for p, t in zip(pred_tan_list, true_tan_list))
        mh_res = compute_multihorizon_rmse(
            pred_trajectories=pred_trajs,
            true_trajectories=true_trajs,
            horizons=horizons,
            task=self.task,
            pred_tangential_forces=pred_tan_list if has_ext_tan else None,
            true_tangential_forces=true_tan_list if has_ext_tan else None,
            detailed=True,
        )
        mh_res["architecture_id"] = getattr(hybrid_wm, "architecture_id", type(hybrid_wm.continuous_model).__name__)
        mh_res["uncertainty_by_horizon"] = {
            str(h): {
                "valid_samples": len(epi_by_h[h]),
                "epistemic_mean": round(float(np.mean(epi_by_h[h])), 4) if len(epi_by_h[h]) > 0 else None,
                "aleatoric_mean": round(float(np.mean(alea_by_h[h])), 4) if len(alea_by_h[h]) > 0 else None,
            }
            for h in horizons
        }
        return mh_res

    def evaluate_conformal_b4(
        self,
        b4_model: ContactStratifiedConformalWM,
        test_transitions: List[Tuple[np.ndarray, np.ndarray, np.ndarray, int]],
    ) -> Dict[str, Any]:
        """
        Evaluates B4 (ContactStratifiedConformalWM) strictly via conformal interval coverage,
        radius widths, and calibration fallback diagnostics (kept distinct from B2/B3).
        """
        if len(test_transitions) == 0:
            raise ValueError("Cannot evaluate B4 with 0 test transitions.")

        s_arr = np.array([x[0] for x in test_transitions], dtype=np.float32)
        a_arr = np.array([x[1] for x in test_transitions], dtype=np.float32)
        true_s_next = np.array([x[2] for x in test_transitions], dtype=np.float32)
        true_modes = np.array([int(x[3]) for x in test_transitions], dtype=np.int64)

        b4_cov = b4_model.evaluate_coverage(s_arr, a_arr, true_s_next, true_modes)

        # Point prediction accuracy of B4's underlying mean predictor for complete reporting
        preds = np.array(
            [b4_model.predict_region(s_arr[i], a_arr[i], int(true_modes[i]))[0] for i in range(len(s_arr))],
            dtype=np.float32,
        )
        point_state_rmse = float(np.sqrt(np.mean((preds - true_s_next) ** 2)))
        if self.task == "peg_in_hole":
            point_force_rmse = float(np.sqrt(np.mean((preds[:, 9:15] - true_s_next[:, 9:15]) ** 2)))
        else:
            point_force_rmse = float(np.sqrt(np.mean((preds[:, 12:16] - true_s_next[:, 12:16]) ** 2)))

        b4_cov["task"] = self.task
        b4_cov["point_state_rmse"] = round(point_state_rmse, 4)
        b4_cov["point_force_rmse"] = round(point_force_rmse, 4)
        return b4_cov

    def evaluate_downstream_manipulation(
        self,
        hybrid_wm: HybridContactStateModel,
        num_episodes: int = 30,
        start_seed: int = 3000
    ) -> Dict[str, Any]:
        """
        Evaluates closed-loop CEM control performance under the 50-step closed-loop horizon.
        """
        planner = CEMPlanner(
            hybrid_wm, self.action_dim, self.action_bounds,
            horizon=10, num_samples=60, elite_fraction=0.15, num_iterations=2
        )

        success_count = 0
        violation_count = 0
        stall_count = 0
        progress_vals = []
        action_mags = []

        for ep_idx in range(num_episodes):
            ep_seed = start_seed + ep_idx
            if self.task == "peg_in_hole":
                env = PegInHoleEnv(seed=ep_seed)
            elif self.task == "legacy_multifinger_lift":
                env = MultifingerLiftEnv(seed=ep_seed)
            else:
                env = CompliantPreLiftContactEnv(mu_true=0.50, dt=0.01, seed=ep_seed)
            obs = env.reset()

            for step in range(self.eval_horizon):
                s_vec, _ = extract_env_state_and_wrench(obs, self.task)
                action, _ = planner.plan(s_vec, self.reward_fn)
                action_mags.append(float(np.linalg.norm(action)))

                obs, _, done, _ = step_env_compatible(env, action, task=self.task, require_reward=False)
                if done:
                    break

            is_success = bool(
                env.seated if self.task == "peg_in_hole"
                else getattr(env, "object_lifted", getattr(env, "lifted", False))
            )
            max_fn_obs = float(np.max(obs.get("finger_fn", np.zeros(4)))) if "finger_fn" in obs else 0.0
            is_viol = bool(
                getattr(env, "safety_violated", False)
                or getattr(env, "crush_violated", max_fn_obs > 25.0)
            )
            is_stall = bool(
                getattr(env, "object_dropped", getattr(env, "dropped", False))
                or getattr(env, "jammed", False)
            )

            if is_success: success_count += 1
            if is_viol: violation_count += 1
            if is_stall: stall_count += 1

            if self.task == "peg_in_hole":
                prog = max(0.0, -float(env.peg_pos[2]))
            else:
                prog = max(0.0, float(env.obj_pos[2]))
            progress_vals.append(prog)

        succ_rate = round(success_count / num_episodes, 4)
        ci_low, ci_high = compute_wilson_ci(success_count, num_episodes, 0.95)

        return {
            "eval_horizon_steps": self.eval_horizon,
            "test_episodes": num_episodes,
            "success_count": success_count,
            "success_rate": succ_rate,
            "success_formatted": f"{success_count}/{num_episodes} ({round(succ_rate*100, 2)}%)",
            "success_ci_95": [round(ci_low * 100, 2), round(ci_high * 100, 2)],
            "mean_goal_progress": round(float(np.mean(progress_vals)), 2),
            "max_goal_progress": round(float(np.max(progress_vals)), 2),
            "goal_progress_unit": "mm_depth" if self.task == "peg_in_hole" else "height_mm",
            "safety_violations": f"{violation_count}/{num_episodes} ({round(violation_count/num_episodes*100, 2)}%)",
            "stall_rate": f"{stall_count}/{num_episodes} ({round(stall_count/num_episodes*100, 2)}%)",
            "mean_action_magnitude": round(float(np.mean(action_mags)), 3),
        }
