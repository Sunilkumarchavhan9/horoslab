"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.2 Execution: Reproducible Multi-Horizon Conformal Calibration Benchmark
Evaluates marginal coverage across 7 modes and 5 horizons H in {1, 3, 5, 10, 20},
and simultaneous trajectory-level coverage on held-out test episodes.
"""

import sys
import os
import json
import time
import numpy as np
import torch
import torch.optim as optim

current_dir = os.path.dirname(os.path.abspath(__file__))
r002_root = os.path.dirname(os.path.dirname(current_dir))
r002_src = os.path.join(r002_root, "src")
sys.path.insert(0, r002_src)

from environment import PegInHoleEnv, MultifingerLiftEnv
from contact_modes import (
    ContactMode,
    MODE_NAMES,
    classify_contact_mode,
    ContactModeClassifier,
    HybridContactStateModel,
)
from models import DeterministicWorldModel
from conformal import MultiHorizonQuantileEngine, HORIZONS, NUM_MODES


def set_seed(seed: int = 42):
    np.random.seed(seed)
    torch.manual_seed(seed)


def collect_episodes(env, num_episodes: int = 40, task: str = "peg_in_hole", max_steps: int = 30):
    """Collects rollout trajectories with state, action, and ground-truth contact mode."""
    trajectories = []

    for ep in range(num_episodes):
        obs = env.reset()
        done = False
        steps = 0

        states, actions, modes = [], [], []
        prev_obs = None

        while not done and steps < max_steps:
            if task == "peg_in_hole":
                s_vec = np.concatenate([obs["pos"], obs["vel"], obs["rot"], obs["wrench"]])
                action = np.array([
                    np.random.normal(0, 0.4),
                    np.random.normal(0, 0.4),
                    -1.2 + np.random.normal(0, 0.2),
                    np.random.normal(0, 0.15),
                    np.random.normal(0, 0.15),
                    0.0
                ])
                mode = classify_contact_mode(obs, prev_state=prev_obs, task=task)
            else:
                s_vec = np.concatenate([
                    obs["finger_pos"].flatten(),
                    obs["finger_fn"],
                    obs["slip_ratio"],
                    obs["obj_pos"]
                ])
                action = np.array([
                    0.4 + np.random.normal(0, 0.1),
                    0.4 + np.random.normal(0, 0.1),
                    0.4 + np.random.normal(0, 0.1),
                    0.4 + np.random.normal(0, 0.1),
                    0.8 + np.random.normal(0, 0.2)
                ])
                mode = classify_contact_mode(obs, prev_state=prev_obs, task=task)

            states.append(s_vec)
            actions.append(action)
            modes.append(int(mode))

            prev_obs = obs
            obs, reward, done, info = env.step(action)
            steps += 1

        if len(states) >= 22:
            trajectories.append({
                "states": np.array(states, dtype=np.float32),
                "actions": np.array(actions, dtype=np.float32),
                "modes": np.array(modes, dtype=np.int64),
            })

    return trajectories


def run_calibration_pipeline(task: str = "peg_in_hole"):
    print(f"\n>>> Running Multi-Horizon Calibration for Task: {task.upper()} ...", flush=True)

    if task == "peg_in_hole":
        env = PegInHoleEnv(seed=42)
        state_dim = 15
        action_dim = 6
    else:
        env = MultifingerLiftEnv(seed=42)
        state_dim = 23
        action_dim = 5

    # 1. Collect Dataset partitioned strictly by Episode
    print("  Collecting episodes (Train: 30, Calib: 40, Test: 30) ...", flush=True)
    train_trajs = collect_episodes(env, num_episodes=30, task=task)
    calib_trajs = collect_episodes(env, num_episodes=40, task=task)
    test_trajs = collect_episodes(env, num_episodes=30, task=task)

    # 2. Train Reference Dynamics Model & Mode Classifier
    print("  Training dynamics model and 7-mode classifier ...", flush=True)
    all_train_s, all_train_a, all_train_next_s, all_train_m = [], [], [], []
    for traj in train_trajs:
        s = traj["states"]
        a = traj["actions"]
        m = traj["modes"]
        for t in range(len(s) - 1):
            all_train_s.append(s[t])
            all_train_a.append(a[t])
            all_train_next_s.append(s[t+1])
            all_train_m.append(m[t+1])

    s_t = torch.tensor(np.array(all_train_s))
    a_t = torch.tensor(np.array(all_train_a))
    next_s_t = torch.tensor(np.array(all_train_next_s))
    m_t = torch.tensor(np.array(all_train_m), dtype=torch.long)

    det_model = DeterministicWorldModel(state_dim, action_dim, hidden_dim=64)
    opt_det = optim.Adam(det_model.parameters(), lr=1e-3)
    for _ in range(50):
        opt_det.zero_grad()
        loss = torch.mean((det_model(s_t, a_t) - next_s_t) ** 2)
        loss.backward()
        opt_det.step()

    mode_classifier = ContactModeClassifier(state_dim, action_dim, hidden_dim=64, num_modes=NUM_MODES)
    opt_mode = optim.Adam(mode_classifier.parameters(), lr=1e-3)
    loss_fn = torch.nn.CrossEntropyLoss()
    for _ in range(50):
        opt_mode.zero_grad()
        loss_m = loss_fn(mode_classifier(s_t, a_t), m_t)
        loss_m.backward()
        opt_mode.step()

    hybrid_model = HybridContactStateModel(det_model, mode_classifier)

    # 3. Generate Rollout Predictions on Calibration Episodes
    print("  Generating multi-step rollouts on calibration episodes ...", flush=True)
    calib_rollout_data = []
    for traj in calib_trajs:
        states = traj["states"]
        actions = traj["actions"]
        modes = traj["modes"]

        # Run 20-step rollout from t=0
        rollout = hybrid_model.predict_multistep(states[0], actions[:22], horizon=21)
        calib_rollout_data.append({
            "true_states": states[:21],
            "pred_states": rollout["states"][:21],
            "true_modes": modes[:21],
            "pred_modes": rollout["predicted_modes"][:21],
        })

    # 4. Calibrate Quantile Engine (Mode x Horizon Q and lambda_sim)
    print("  Calibrating Multi-Horizon Quantile Tensor Q in R^{7 x 5} ...", flush=True)
    engine = MultiHorizonQuantileEngine(alpha=0.10, min_cell_samples=5)
    engine.calibrate(calib_rollout_data)

    # 5. Evaluate on Held-Out Test Episodes
    print("  Evaluating on independent held-out test episodes ...", flush=True)
    test_rollout_data = []
    for traj in test_trajs:
        states = traj["states"]
        actions = traj["actions"]
        modes = traj["modes"]

        rollout = hybrid_model.predict_multistep(states[0], actions[:22], horizon=21)
        test_rollout_data.append({
            "true_states": states[:21],
            "pred_states": rollout["states"][:21],
            "true_modes": modes[:21],
            "pred_modes": rollout["predicted_modes"][:21],
        })

    metrics = engine.evaluate_coverage(test_rollout_data)

    print(f"  Target Coverage: {metrics['target_coverage'] * 100:.1f}%")
    print(f"  Simultaneous Trajectory Coverage: {metrics['simultaneous_trajectory_coverage'] * 100:.1f}%")
    print(f"  Simultaneous Inflation Lambda: {metrics['lambda_sim_inflation']}")
    print(f"  Marginal Coverage by Horizon: {metrics['marginal_coverage_per_horizon']}")

    return {
        "task": task,
        "quantile_matrix_Q": engine.Q.tolist(),
        "lambda_sim_inflation": metrics["lambda_sim_inflation"],
        "marginal_coverage_per_horizon": metrics["marginal_coverage_per_horizon"],
        "simultaneous_trajectory_coverage": metrics["simultaneous_trajectory_coverage"],
        "target_coverage": metrics["target_coverage"],
    }


def main():
    print("=" * 80)
    print("HOROS PROBE-1 — Research-002: Stage P2.2 Calibration Benchmark Runner")
    print("=" * 80)
    set_seed(42)

    peg_results = run_calibration_pipeline("peg_in_hole")
    lift_results = run_calibration_pipeline("multifinger_lift")

    final_report = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "method": "MultiHorizonQuantileEngine",
        "horizons": HORIZONS,
        "modes": [MODE_NAMES[ContactMode(k)] for k in range(NUM_MODES)],
        "task_1_peg_in_hole": peg_results,
        "task_2_multifinger_lift": lift_results,
    }

    report_path = os.path.join(current_dir, "calibration_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(final_report, f, indent=2)

    print(f"\nMaster Calibration Report successfully written to:\n  {report_path}")
    print("=" * 80)


if __name__ == "__main__":
    main()
