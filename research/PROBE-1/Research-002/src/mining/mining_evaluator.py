"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.4 — Active Contact-Mode Mining: Evaluator Harness

Trains world models on augmented datasets (D0, D1, D2, D3, D4) and evaluates:
1. Contact Mode Classification Macro-F1 across all 7 contact strata.
2. Next-step state & contact force prediction RMSE.
3. Multi-horizon rollout RMSE across H in {1, 3, 5, 10, 20}.
4. Conformal calibration coverage & prediction interval widths.
5. Downstream closed-loop manipulation performance under corrected 25-step horizon.
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
from src.planners.cem_planner import CEMPlanner
from src.environment.peg_in_hole_env import PegInHoleEnv
from src.environment.multifinger_lift_env import MultifingerLiftEnv
from src.selection_aware.counterfactual_rollout import extract_env_state_and_wrench
from src.selection_aware.episode_conformal_engine import EpisodeConformalEngine, compute_wilson_ci


class MiningEvaluator:
    """
    Trains and evaluates world models trained on D0, D1, D2, D3, and D4 active datasets.
    """

    def __init__(
        self,
        task: str = "peg_in_hole",
        eval_horizon: int = 25,
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
                obj_z = s[20] if len(s) >= 23 else s[2]
                slip = np.linalg.norm(s[16:20]) if len(s) >= 23 else 0.0
                force_err = abs(np.sum(s[8:12]) - 16.0) if len(s) >= 23 else 0.0
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
        test_transitions: List[Tuple[np.ndarray, np.ndarray, np.ndarray, int]]
    ) -> Dict[str, float]:
        """Evaluates 1-step prediction RMSE and mode classification macro-F1 on held-out transitions."""
        if len(test_transitions) == 0:
            return {"state_rmse": 0.0, "mode_f1": 0.0, "force_rmse": 0.0}

        s_arr = torch.tensor(np.array([x[0] for x in test_transitions]), dtype=torch.float32)
        a_arr = torch.tensor(np.array([x[1] for x in test_transitions]), dtype=torch.float32)
        true_s_next = np.array([x[2] for x in test_transitions])
        true_modes = np.array([x[3] for x in test_transitions])

        with torch.no_grad():
            pred_s = hybrid_wm.continuous_model(s_arr, a_arr).numpy()
            logits = hybrid_wm.mode_classifier(s_arr, a_arr).numpy()
            pred_modes = np.argmax(logits, axis=-1)

        state_rmse = float(np.sqrt(np.mean((pred_s - true_s_next) ** 2)))

        # Wrench RMSE (indices 9:15 for peg_in_hole, 8:12 for multifinger_lift)
        if self.task == "peg_in_hole":
            force_rmse = float(np.sqrt(np.mean((pred_s[:, 9:15] - true_s_next[:, 9:15]) ** 2)))
        else:
            force_rmse = float(np.sqrt(np.mean((pred_s[:, 8:12] - true_s_next[:, 8:12]) ** 2)))

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
            "state_rmse": round(state_rmse, 4),
            "force_rmse": round(force_rmse, 4),
            "mode_macro_f1": round(macro_f1, 4),
        }

    def evaluate_downstream_manipulation(
        self,
        hybrid_wm: HybridContactStateModel,
        num_episodes: int = 30,
        start_seed: int = 3000
    ) -> Dict[str, Any]:
        """
        Evaluates closed-loop CEM control performance under corrected 25-step horizon.
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
            env = PegInHoleEnv(seed=ep_seed) if self.task == "peg_in_hole" else MultifingerLiftEnv(seed=ep_seed)
            obs = env.reset()

            for step in range(self.eval_horizon):
                s_vec, _ = extract_env_state_and_wrench(obs, self.task)
                action, _ = planner.plan(s_vec, self.reward_fn)
                action_mags.append(float(np.linalg.norm(action)))

                obs, r, done, info = env.step(action)
                if done: break

            is_success = bool(env.seated if self.task == "peg_in_hole" else getattr(env, "object_lifted", False))
            is_viol = bool(getattr(env, "safety_violated", False) or getattr(env, "crush_violated", False))
            is_stall = bool(getattr(env, "object_dropped", False) or getattr(env, "jammed", False))

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
            "safety_violations": f"{violation_count}/{num_episodes} ({round(violation_count/num_episodes*100, 2)}%)",
            "stall_rate": f"{stall_count}/{num_episodes} ({round(stall_count/num_episodes*100, 2)}%)",
            "mean_action_magnitude": round(float(np.mean(action_mags)), 3),
        }
