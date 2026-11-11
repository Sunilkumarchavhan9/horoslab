"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.8 / Phase 3.4 — Dedicated Dataset Generation & Training/Calibration Pipeline

Resolves Phase 3.4.1 Blockers 2–4 cleanly while preserving frozen Baselines (Docs 00–53,
plcea_substitutor.py, and H1–H5 physics/OOD invariants):
1. Dedicated deterministic 60-episode dataset generator strictly partitioned by task & pool:
   - PegInHole:        M0_passive (1100–1159, 60 ep), M4_acmm (1100–1159, 60 ep), calib (2100–2159, 60 ep)
   - CompliantPreLift: M0_passive (1000–1059, 60 ep), M4_acmm (1000–1059, 60 ep), calib (2000–2059, 60 ep)
2. Shared per-task z-score standardization fitted strictly on pooled (M0 + M4) training transitions.
3. Uniform global gradient-norm clipping (max_grad_norm = 1.0) across B1, B2, and all 5 B3 members.
4. Complete checkpoint persistence:
   - b1_deterministic.pt, b2_probabilistic.pt
   - b3_ensemble.pt + independent b3_member_0.pt .. b3_member_4.pt with bootstrap provenance
   - b4_conformal_calibration.json (B4 ContactStratifiedConformalWM + operational 29 floor +
     ContactModeClassifier APS + EpisodeConformalEngine + MultiHorizonQuantileEngine calibration)
"""

from __future__ import annotations
import copy
import hashlib
import json
import math
import os
import platform
import subprocess
import sys
import time
from typing import Any, Dict, List, Optional, Sequence, Tuple
import numpy as np
import torch

from src.contact_modes.contact_mode_definitions import MODE_NAMES, NUM_MODES, classify_contact_mode
from src.environment.compliant_prelift_env import CompliantPreLiftContactEnv
from src.environment.peg_in_hole_env import PegInHoleEnv
from src.environment.step_adapter import get_env_dt, is_compliant_prelift_task, step_env_compatible
from src.integrated.calibration_runner import (
    CalibrationRunner,
    PHASE3_SEED_POOLS,
    verify_disjoint_seed_pools,
)
from src.integrated.model_training_runner import (
    ModelTrainingRunner,
    load_b3_ensemble_from_members,
    load_hybrid_checkpoint,
)
from src.integrated.statistical_analysis import HORIZONS, to_json_serializable
from src.mining.acquisition_scorer import AcquisitionScorer
from src.mining.contact_boundary_sampler import ContactBoundarySampler
from src.mining.episode_deduplicator import EpisodeDeduplicator
from src.models.normalization import FeatureStandardizer
from src.models.stratified_conformal_wm import ContactStratifiedConformalWM
from src.conformal.multihorizon_quantile_engine import MultiHorizonQuantileEngine
from src.selection_aware.counterfactual_rollout import extract_env_state_and_wrench
from src.selection_aware.episode_conformal_engine import (
    PRIMARY_ALPHA,
    PRIMARY_N_CALIB,
    PRIMARY_TARGET_COVERAGE,
)


PHASE34_B4_MIN_STRATUM_SAMPLES = 29
PHASE34_DEFAULT_HORIZON = 50
PHASE34_TASKS = ("peg_in_hole", "compliant_prelift")
PHASE34_TRAINING_CONDITIONS = ("M0_passive", "M4_acmm")


def canonical_phase34_task(task: str) -> str:
    if task == "peg_in_hole":
        return "peg_in_hole"
    if is_compliant_prelift_task(task):
        return "compliant_prelift"
    raise ValueError(f"Unsupported Phase 3.4 task '{task}'.")


def get_runtime_reproducibility_metadata(repo_root: Optional[str] = None) -> Dict[str, Any]:
    """Captures exact software/hardware versions and current git revision."""
    git_rev = "unknown"
    if repo_root is not None:
        try:
            proc = subprocess.run(
                ["git", "-C", repo_root, "rev-parse", "--short", "HEAD"],
                capture_output=True,
                text=True,
                timeout=3,
                check=False,
            )
            if proc.returncode == 0 and proc.stdout.strip():
                git_rev = proc.stdout.strip()
        except Exception:
            git_rev = "unknown"

    return {
        "python_version": sys.version.split()[0],
        "torch_version": torch.__version__,
        "numpy_version": np.__version__,
        "cuda_available": bool(torch.cuda.is_available()),
        "device": "cpu",
        "cpu_count": int(os.cpu_count() or 1),
        "platform": platform.platform(),
        "software_revision": git_rev,
    }


def _sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            chunk = f.read(65536)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def _create_phase34_env(task: str, seed: int) -> Tuple[Any, Dict[str, Any]]:
    t_key = canonical_phase34_task(task)
    if t_key == "peg_in_hole":
        env = PegInHoleEnv(dt=0.02, seed=int(seed))
        env_cfg = {
            "env_class": "PegInHoleEnv",
            "dt_s": 0.02,
            "clearance_mm": float(env.clearance),
            "friction_coeff": float(env.friction_coeff),
            "peg_length_mm": float(env.peg_length),
            "state_dim": 15,
            "action_dim": 6,
            "regime": "nominal",
        }
        return env, env_cfg

    env = CompliantPreLiftContactEnv(
        mu_true=0.50,
        object_mass=0.350,
        dt=0.01,
        seed=int(seed),
        regime="nominal",
    )
    env_cfg = {
        "env_class": "CompliantPreLiftContactEnv",
        "dt_s": 0.01,
        "initial_mu_true_hidden": 0.50,
        "object_mass_kg": 0.350,
        "state_dim": 23,
        "action_dim": 5,
        "regime": "nominal",
    }
    return env, env_cfg


def _collect_single_episode(
    task: str,
    condition: str,
    ep_seed: int,
    ep_index: int,
    horizon: int,
    software_revision: str,
) -> Dict[str, Any]:
    t_key = canonical_phase34_task(task)
    sampler_task = "peg_in_hole" if t_key == "peg_in_hole" else "compliant_prelift"
    sampler = ContactBoundarySampler(task=sampler_task, seed=int(ep_seed), mu=0.50)
    env, env_cfg = _create_phase34_env(t_key, seed=int(ep_seed))
    env_cfg["horizon_max"] = int(horizon)

    if t_key == "peg_in_hole":
        if condition == "M0_passive":
            exp_mode = "random"
            strategy_name = "M0_passive_random"
        elif condition == "M4_acmm":
            exp_mode = "insertion" if (ep_index % 3 == 0) else "boundary"
            strategy_name = f"M4_acmm_{exp_mode}"
        elif condition == "calibration":
            cycle = ep_index % 3
            exp_mode = ("insertion", "boundary", "random")[cycle]
            strategy_name = f"calib_{exp_mode}"
        else:
            raise ValueError(f"Unsupported Phase 3.4 condition '{condition}'.")
        traj = sampler.sample_task1_boundary_trajectory(env, horizon=horizon, exploration_mode=exp_mode)
    else:
        if condition == "M0_passive":
            exp_mode = "random"
            strategy_name = "M0_passive_random"
        elif condition == "M4_acmm":
            exp_mode = "coordinated" if (ep_index % 3 == 0) else "friction_boundary"
            strategy_name = f"M4_acmm_{exp_mode}"
        elif condition == "calibration":
            cycle = ep_index % 3
            exp_mode = ("coordinated", "friction_boundary", "random")[cycle]
            strategy_name = f"calib_{exp_mode}"
        else:
            raise ValueError(f"Unsupported Phase 3.4 condition '{condition}'.")
        traj = sampler.sample_task2_boundary_trajectory(env, horizon=horizon, exploration_mode=exp_mode)

    scorer = AcquisitionScorer(mu=0.50)
    raw_sig = scorer.score_trajectory_raw(traj, task=sampler_task)
    modes_arr = np.asarray(traj["realized_modes"], dtype=np.int64)
    initial_mode = int(modes_arr[0]) if len(modes_arr) > 0 else 0

    ep_record = dict(traj)
    ep_record["task"] = t_key
    ep_record["condition"] = condition
    ep_record["strategy"] = strategy_name
    ep_record["episode_id"] = f"p34_{t_key}_{condition}_{ep_seed}"
    ep_record["seed"] = int(ep_seed)
    ep_record["episode_index"] = int(ep_index)
    ep_record["env_config"] = env_cfg
    ep_record["software_revision"] = software_revision
    ep_record["initial_mode"] = initial_mode
    ep_record["raw_acquisition_signals"] = {k: round(float(v), 6) for k, v in raw_sig.items()}
    return ep_record


def _serialize_dataset_split_npz(
    npz_path: str,
    task: str,
    condition: str,
    episodes: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Serializes both episode-level boundaries/arrays and transition-level tuples cleanly into .npz.
    Guarantees zero action/state length mismatch on early termination.
    """
    os.makedirs(os.path.dirname(npz_path), exist_ok=True)
    ep_lengths = np.array([int(ep["episode_length"]) for ep in episodes], dtype=np.int64)
    ep_seeds = np.array([int(ep["seed"]) for ep in episodes], dtype=np.int64)
    ep_offsets = np.zeros(len(episodes) + 1, dtype=np.int64)
    ep_offsets[1:] = np.cumsum(ep_lengths)

    states_cat = np.concatenate([ep["realized_states"] for ep in episodes], axis=0).astype(np.float32)
    next_states_cat = np.concatenate([ep["realized_next_states"] for ep in episodes], axis=0).astype(np.float32)
    actions_cat = np.concatenate([ep["actions"] for ep in episodes], axis=0).astype(np.float32)
    wrenches_cat = np.concatenate([ep["realized_wrenches"] for ep in episodes], axis=0).astype(np.float32)
    next_wrenches_cat = np.concatenate([ep["realized_next_wrenches"] for ep in episodes], axis=0).astype(np.float32)
    modes_cat = np.concatenate([ep["realized_modes"] for ep in episodes], axis=0).astype(np.int64)
    rewards_cat = np.concatenate([ep["realized_rewards"] for ep in episodes], axis=0).astype(np.float32)

    ep_meta = [
        {
            "episode_id": ep["episode_id"],
            "seed": int(ep["seed"]),
            "episode_index": int(ep["episode_index"]),
            "task": ep["task"],
            "condition": ep["condition"],
            "strategy": ep["strategy"],
            "episode_length": int(ep["episode_length"]),
            "termination_reason": str(ep["termination_reason"]),
            "initial_mode": int(ep["initial_mode"]),
            "dt_s": float(ep["dt_s"]),
            "success": bool(ep["success"]),
            "safety_violated": bool(ep["safety_violated"]),
            "stall": bool(ep["stall"]),
            "final_progress": round(float(ep["final_progress"]), 6),
            "realized_return": round(float(ep["realized_return"]), 6),
            "acquisition_score": float(ep.get("acquisition_score", 0.0)),
            "acquisition_rank": int(ep.get("acquisition_rank", ep["episode_index"] + 1)),
            "min_diversity_distance": ep.get("min_diversity_distance"),
            "env_config": ep["env_config"],
            "software_revision": ep["software_revision"],
        }
        for ep in episodes
    ]

    np.savez_compressed(
        npz_path,
        task=np.array([task]),
        condition=np.array([condition]),
        episode_seeds=ep_seeds,
        episode_lengths=ep_lengths,
        episode_offsets=ep_offsets,
        states=states_cat,
        next_states=next_states_cat,
        actions=actions_cat,
        wrenches=wrenches_cat,
        next_wrenches=next_wrenches_cat,
        modes=modes_cat,
        rewards=rewards_cat,
        episode_metadata_json=np.array([json.dumps(ep_meta, allow_nan=False)]),
    )

    mode_counts = {str(m): int(np.sum(modes_cat == m)) for m in range(NUM_MODES)}
    term_counts: Dict[str, int] = {}
    for m in ep_meta:
        r = m["termination_reason"]
        term_counts[r] = term_counts.get(r, 0) + 1

    return {
        "npz_filename": os.path.basename(npz_path),
        "relative_path": f"datasets/phase3_4/{os.path.basename(npz_path)}",
        "sha256": _sha256_file(npz_path),
        "num_episodes": len(episodes),
        "num_transitions": int(len(states_cat)),
        "seeds": [int(s) for s in ep_seeds.tolist()],
        "seed_range": [int(ep_seeds[0]), int(ep_seeds[-1])],
        "state_dim": int(states_cat.shape[1]),
        "action_dim": int(actions_cat.shape[1]),
        "mode_histogram": mode_counts,
        "termination_reason_counts": term_counts,
        "episodes_metadata": ep_meta,
    }


def load_phase34_dataset_bundle(npz_path: str) -> Dict[str, Any]:
    """
    Round-trip loader reconstructing aligned episode-level dicts and flat transition tuples
    from a serialized Phase 3.4 .npz dataset bundle.
    """
    with np.load(npz_path, allow_pickle=False) as data:
        task = str(data["task"][0])
        condition = str(data["condition"][0])
        offsets = data["episode_offsets"]
        states = data["states"]
        next_states = data["next_states"]
        actions = data["actions"]
        wrenches = data["wrenches"]
        next_wrenches = data["next_wrenches"]
        modes = data["modes"]
        rewards = data["rewards"]
        ep_meta = json.loads(str(data["episode_metadata_json"][0]))

    episodes: List[Dict[str, Any]] = []
    transitions: List[Tuple[np.ndarray, np.ndarray, np.ndarray, int]] = []

    for idx, meta in enumerate(ep_meta):
        lo, hi = int(offsets[idx]), int(offsets[idx + 1])
        s_ep = states[lo:hi].copy()
        ns_ep = next_states[lo:hi].copy()
        a_ep = actions[lo:hi].copy()
        w_ep = wrenches[lo:hi].copy()
        nw_ep = next_wrenches[lo:hi].copy()
        m_ep = modes[lo:hi].copy()
        r_ep = rewards[lo:hi].copy()

        ep = dict(meta)
        ep.update({
            "realized_states": s_ep,
            "realized_next_states": ns_ep,
            "actions": a_ep,
            "realized_wrenches": w_ep,
            "realized_next_wrenches": nw_ep,
            "realized_modes": m_ep,
            "realized_rewards": r_ep,
            "realized_return": float(np.sum(r_ep)),
        })
        episodes.append(ep)

        for t in range(len(a_ep)):
            transitions.append((s_ep[t], a_ep[t], ns_ep[t], int(m_ep[t])))

    return {
        "task": task,
        "condition": condition,
        "episodes": episodes,
        "transitions": transitions,
        "metadata": ep_meta,
    }


def generate_phase34_datasets(
    dataset_dir: str,
    manifest_path: str,
    horizon: int = PHASE34_DEFAULT_HORIZON,
    seed_pools: Optional[Dict[str, List[int]]] = None,
    repo_root: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generates and serializes all 6 required 60-episode datasets for Phase 3.4:
      - PegInHole:        M0_passive (1100–1159), M4_acmm (1100–1159), calibration (2100–2159)
      - CompliantPreLift: M0_passive (1000–1059), M4_acmm (1000–1059), calibration (2000–2059)
    Validates strict disjointness across training, calibration, offline eval, closed-loop eval,
    and excluded P2.6 pilot pools before writing any artifact.
    """
    pool_audit = verify_disjoint_seed_pools()
    pools = seed_pools or PHASE3_SEED_POOLS
    runtime_meta = get_runtime_reproducibility_metadata(repo_root=repo_root)
    sw_rev = runtime_meta["software_revision"]

    split_specs = [
        ("peg_in_hole", "M0_passive", list(pools["training_peg_in_hole"])),
        ("peg_in_hole", "M4_acmm", list(pools["training_peg_in_hole"])),
        ("compliant_prelift", "M0_passive", list(pools["training_compliant_prelift"])),
        ("compliant_prelift", "M4_acmm", list(pools["training_compliant_prelift"])),
        ("peg_in_hole", "calibration", list(pools["calib_peg_in_hole"])),
        ("compliant_prelift", "calibration", list(pools["calib_compliant_prelift"])),
    ]

    # Assert strict zero overlap between training and calibration/eval/pilot pools
    all_train_seeds = set(pools["training_peg_in_hole"]) | set(pools["training_compliant_prelift"])
    all_calib_seeds = set(pools["calib_peg_in_hole"]) | set(pools["calib_compliant_prelift"])
    all_eval_seeds = (
        set(pools["offline_test_id"])
        | set(pools["offline_test_ood"])
        | set(pools["offline_test_peg_in_hole"])
        | set(pools["closed_loop_id"])
        | set(pools["closed_loop_ood"])
        | set(pools["closed_loop_peg_in_hole"])
    )
    excluded_seeds = set(pools["excluded_p26_pilot"])
    if (all_train_seeds & all_calib_seeds) or (all_train_seeds & all_eval_seeds) or (all_calib_seeds & all_eval_seeds):
        raise ValueError("Seed intersection violation detected between train, calibration, and eval splits.")
    if (all_train_seeds & excluded_seeds) or (all_calib_seeds & excluded_seeds):
        raise ValueError("Seed intersection detected with excluded P2.6 historical pilot pool.")

    os.makedirs(dataset_dir, exist_ok=True)
    os.makedirs(os.path.dirname(manifest_path), exist_ok=True)

    bundles_summary: Dict[str, Any] = {}
    for task, condition, seed_list in split_specs:
        episodes: List[Dict[str, Any]] = []
        for idx, ep_seed in enumerate(seed_list):
            ep = _collect_single_episode(
                task=task,
                condition=condition,
                ep_seed=int(ep_seed),
                ep_index=idx,
                horizon=horizon,
                software_revision=sw_rev,
            )
            episodes.append(ep)

        if condition == "M4_acmm":
            scorer = AcquisitionScorer(mu=0.50)
            dedup = EpisodeDeduplicator(d_min=0.0)
            ranked = scorer.rank_trajectories(episodes, task=task)
            admitted, _ = dedup.filter_and_select(ranked, budget=len(seed_list))
            # Restore deterministic ascending seed order after logging acquisition ranks & diversity
            episodes = sorted(admitted, key=lambda e: int(e["seed"]))

        npz_name = f"{task}_{condition}.npz"
        npz_path = os.path.join(dataset_dir, npz_name)
        split_summary = _serialize_dataset_split_npz(npz_path, task=task, condition=condition, episodes=episodes)
        split_summary["npz_filename"] = npz_name
        bundles_summary[f"{task}__{condition}"] = split_summary

    manifest = {
        "manifest_id": "HOROS-PROBE1-R002-PHASE3.4-DATASETS-v1.0",
        "generated_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "horizon_max": int(horizon),
        "runtime_environment": runtime_meta,
        "seed_pool_disjoint_audit": pool_audit,
        "cross_split_intersections": {
            "train_vs_calibration": len(all_train_seeds & all_calib_seeds),
            "train_vs_eval": len(all_train_seeds & all_eval_seeds),
            "calibration_vs_eval": len(all_calib_seeds & all_eval_seeds),
            "train_or_calib_vs_excluded_pilot": len((all_train_seeds | all_calib_seeds) & excluded_seeds),
        },
        "normalization_policy": {
            "type": "per_feature_zscore",
            "scope": "per_task_shared_across_M0_and_M4",
            "fit_splits_only": ["M0_passive", "M4_acmm"],
            "excluded_from_fit": ["calibration", "offline_eval", "closed_loop_eval"],
        },
        "splits": bundles_summary,
    }

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(to_json_serializable(manifest), f, indent=2, allow_nan=False)

    return manifest


def fit_shared_task_scaler_from_splits(
    task: str,
    m0_transitions: Sequence[Tuple[np.ndarray, np.ndarray, np.ndarray, int]],
    m4_transitions: Sequence[Tuple[np.ndarray, np.ndarray, np.ndarray, int]],
    min_std: float = 1e-4,
) -> FeatureStandardizer:
    """
    Fits a single shared per-feature z-score scaler on combined M0 + M4 training transitions ONLY.
    Keeps M0 and M4 models strictly aligned in identical normalized coordinates without touching
    calibration or evaluation splits.
    """
    combined = list(m0_transitions) + list(m4_transitions)
    return FeatureStandardizer.fit_from_transitions(
        combined,
        min_std=min_std,
        task=canonical_phase34_task(task),
        fit_source="combined_M0_plus_M4_training_only",
    )


def _evaluate_model_multistep_on_episodes(
    hybrid_model,
    episodes: List[Dict[str, Any]],
    task: str,
    horizons: Tuple[int, ...] = HORIZONS,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Generates episode-level conformal evaluation records from disjoint calibration episodes
    WITHOUT modifying model weights. Respects variable episode lengths without fake padding.
    """
    t_key = canonical_phase34_task(task)
    conformal_eps: List[Dict[str, Any]] = []
    mh_trajs: List[Dict[str, Any]] = []

    for ep in episodes:
        states = ep["realized_states"]
        next_states = ep["realized_next_states"]
        actions = ep["actions"]
        wrenches = ep["realized_next_wrenches"]
        modes = ep["realized_modes"]

        avail = len(actions)
        if avail == 0:
            continue

        rollout = hybrid_model.predict_multistep(
            init_state=states[0],
            action_sequence=actions[:avail],
            horizon=avail,
            task=t_key,
        )
        pred_states = rollout["states"]
        pred_wrenches = rollout["contact_forces"]
        pred_modes = rollout["predicted_modes"]
        pred_probs = rollout["mode_probabilities"]

        conformal_eps.append({
            "episode_id": ep["episode_id"],
            "seed": int(ep["seed"]),
            "initial_mode": int(ep.get("initial_mode", modes[0])),
            "decisions": [{
                "step": 0,
                "pred_states": pred_states[:avail],
                "realized_states": next_states[:avail],
                "pred_wrenches": pred_wrenches[:avail],
                "realized_wrenches": wrenches[:avail],
                "pred_modes": pred_modes[:avail],
                "pred_mode_probs": pred_probs[:avail],
                "realized_modes": modes[:avail],
            }],
        })
        mh_trajs.append({
            "true_states": next_states[:avail],
            "pred_states": pred_states[:avail],
            "true_modes": modes[:avail],
            "pred_modes": pred_modes[:avail],
        })

    return conformal_eps, mh_trajs


class Phase34TrainingPipeline:
    """
    Auditable Phase 3.4 training & conformal calibration pipeline supporting:
    - Shared per-task z-score standardization on pooled M0+M4 training splits
    - Uniform global gradient clipping (max_grad_norm = 1.0) across B1, B2, and E=5 B3 members
    - Complete checkpoint archival including independent B3 member files b3_member_0..4.pt
    - Complete non-neural B4 + APS + Episode + MultiHorizon conformal artifact serialization
    """

    def __init__(
        self,
        checkpoint_root: str,
        hidden_dim: int = 64,
        epochs: int = 45,
        lr: float = 2e-3,
        max_grad_norm: float = 1.0,
        alpha: float = PRIMARY_ALPHA,
        min_stratum_samples: int = PHASE34_B4_MIN_STRATUM_SAMPLES,
        seed: int = 42,
    ):
        self.checkpoint_root = checkpoint_root
        self.hidden_dim = int(hidden_dim)
        self.epochs = int(epochs)
        self.lr = float(lr)
        self.max_grad_norm = float(max_grad_norm)
        self.alpha = float(alpha)
        self.min_stratum_samples = int(min_stratum_samples)
        self.seed = int(seed)

    def calibrate_b4_artifacts(
        self,
        task: str,
        condition: str,
        b1_model,
        b1_checkpoint_path: str,
        calib_bundle: Dict[str, Any],
        calib_manifest_sha256: Optional[str],
        output_dir: str,
    ) -> Dict[str, Any]:
        """
        Executes non-neural B4 calibration on the disjoint calibration split and persists
        B4 stratified conformal quantiles, APS calibration, episode conformal summaries, and
        multi-horizon quantile diagnostics in strict RFC 8259 JSON.
        """
        t_key = canonical_phase34_task(task)
        calib_transitions = calib_bundle["transitions"]
        calib_episodes = calib_bundle["episodes"]
        if len(calib_transitions) == 0 or len(calib_episodes) == 0:
            raise ValueError("Disjoint calibration bundle must contain transitions and episodes.")

        runner = ModelTrainingRunner(
            task=t_key,
            hidden_dim=self.hidden_dim,
            epochs=self.epochs,
            lr=self.lr,
            seed=self.seed,
            max_grad_norm=self.max_grad_norm,
            normalize=True,
        )

        # 1. Scalar L2 B4 ContactStratifiedConformalWM (operational floor=29 in physical units)
        b4_model = runner.calibrate_conformal_b4(
            base_model=b1_model,
            calib_transitions=calib_transitions,
            alpha=self.alpha,
            num_strata=NUM_MODES,
            min_stratum_samples=self.min_stratum_samples,
        )

        s_cal = np.array([x[0] for x in calib_transitions], dtype=np.float32)
        a_cal = np.array([x[1] for x in calib_transitions], dtype=np.float32)
        t_cal = np.array([x[2] for x in calib_transitions], dtype=np.float32)
        m_cal = np.array([int(x[3]) for x in calib_transitions], dtype=np.int64)
        b4_calib_cov = b4_model.evaluate_coverage(s_cal, a_cal, t_cal, m_cal)

        # 2. APS threshold calibration on disjoint calibration split
        aps_q = b1_model.calibrate_mode_aps(s_cal, a_cal, m_cal, alpha_mode=self.alpha)
        aps_covered = 0
        aps_set_sizes: List[int] = []
        with torch.no_grad():
            s_t = torch.tensor(s_cal, dtype=torch.float32)
            a_t = torch.tensor(a_cal, dtype=torch.float32)
            s_in, a_in = b1_model._prepare_inputs(s_t, a_t)
            s_in_np, a_in_np = s_in.numpy(), a_in.numpy()
            for i in range(len(m_cal)):
                m_set = b1_model.mode_classifier.predict_mode_set(s_in_np[i], a_in_np[i])
                aps_set_sizes.append(len(m_set))
                if int(m_cal[i]) in m_set:
                    aps_covered += 1

        aps_summary = {
            "alpha_mode": self.alpha,
            "aps_quantile": round(float(aps_q), 6),
            "num_calibration_transitions": int(len(m_cal)),
            "calibration_set_coverage": round(aps_covered / max(1, len(m_cal)), 4),
            "mean_prediction_set_size": round(float(np.mean(aps_set_sizes)), 4),
        }

        # 3. Episode-level CMS-PSACD vs Unstratified & Multi-Horizon calibration summaries
        conformal_eps, mh_trajs = _evaluate_model_multistep_on_episodes(
            b1_model, calib_episodes, task=t_key, horizons=HORIZONS
        )
        calib_runner = CalibrationRunner(
            alpha=self.alpha,
            horizons=HORIZONS,
            min_calib_episodes=PRIMARY_N_CALIB if len(calib_episodes) >= PRIMARY_N_CALIB else len(calib_episodes),
            min_stratum_samples=self.min_stratum_samples,
            seed=self.seed,
        )
        cms_engine = calib_runner.calibrate_cms_psacd(
            conformal_eps,
            enforce_n_calib=(len(calib_episodes) >= PRIMARY_N_CALIB),
        )
        unstrat = calib_runner.calibrate_unstratified_baseline(conformal_eps, strict=False)
        mh_engine = MultiHorizonQuantileEngine(alpha=self.alpha, min_cell_samples=15)
        mh_engine.calibrate(mh_trajs)
        mh_diag = mh_engine.get_calibration_diagnostics()

        b4_artifact = {
            "architecture_id": "B4",
            "model_class": "ContactStratifiedConformalWM",
            "is_conformal_architecture": True,
            "note": (
                "Non-neural split-conformal calibration evaluated strictly on the disjoint "
                "60-episode calibration pool in original physical feature units."
            ),
            "task": t_key,
            "training_condition": condition,
            "calibration_split": calib_bundle.get("condition", "calibration"),
            "calibration_seeds": [int(ep["seed"]) for ep in calib_episodes],
            "num_calibration_episodes": len(calib_episodes),
            "num_calibration_transitions": len(calib_transitions),
            "calibration_manifest_sha256": calib_manifest_sha256,
            "base_model_checkpoint": os.path.basename(b1_checkpoint_path),
            "base_model_sha256": _sha256_file(b1_checkpoint_path) if os.path.exists(b1_checkpoint_path) else None,
            "b4_contact_stratified": b4_model.to_dict(),
            "b4_calibration_fit_summary": {
                "empirical_coverage_on_calib": b4_calib_cov["empirical_coverage"],
                "mean_interval_radius": b4_calib_cov["mean_interval_radius"],
                "mean_l2_error": b4_calib_cov["mean_l2_error"],
                "per_stratum_calibration_fit": b4_calib_cov["per_stratum_coverage"],
            },
            "aps_calibration": aps_summary,
            "episode_conformal_calibration": {
                "diagnostics": cms_engine.get_calibration_diagnostics(),
                "joint_quantiles": {
                    "q_state_joint": cms_engine.q_state_joint,
                    "q_wrench_joint": cms_engine.q_wrench_joint,
                    "q_mode_joint": cms_engine.q_mode_joint,
                },
                "marginal_quantiles": {
                    "q_state_marginal": cms_engine.q_state_marginal,
                    "q_wrench_marginal": cms_engine.q_wrench_marginal,
                    "q_mode_marginal": cms_engine.q_mode_marginal,
                },
                "unstratified_baseline": unstrat,
            },
            "multihorizon_quantile_calibration": {
                "diagnostics": mh_diag,
                "Q_matrix": mh_engine.Q.tolist(),
                "q_global": mh_engine.q_global.tolist(),
                "q_mode": mh_engine.q_mode.tolist(),
            },
        }

        os.makedirs(output_dir, exist_ok=True)
        out_path = os.path.join(output_dir, "b4_conformal_calibration.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(to_json_serializable(b4_artifact), f, indent=2, allow_nan=False)

        b4_artifact["artifact_path"] = out_path
        return b4_artifact

    @staticmethod
    def reconstruct_b4_from_artifacts(
        b4_artifact_path: str,
        b1_checkpoint_path: str,
    ) -> Tuple[ContactStratifiedConformalWM, Dict[str, Any]]:
        """Reconstructs live calibrated B4 conformal wrapper from saved JSON + B1 checkpoint."""
        b1_model, _ = load_hybrid_checkpoint(b1_checkpoint_path)
        with open(b4_artifact_path, "r", encoding="utf-8") as f:
            artifact = json.load(f)
        b4_model = ContactStratifiedConformalWM.from_dict(
            artifact["b4_contact_stratified"], base_model=b1_model
        )
        aps_q = artifact.get("aps_calibration", {}).get("aps_quantile")
        if aps_q is not None:
            b1_model.mode_classifier.aps_quantile = float(aps_q)
        return b4_model, artifact

    def train_and_calibrate_task(
        self,
        task: str,
        m0_bundle: Dict[str, Any],
        m4_bundle: Dict[str, Any],
        calib_bundle: Dict[str, Any],
        calib_manifest_sha256: Optional[str] = None,
        repo_root: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Executes complete per-task Phase 3.4 training (B1, B2, B3 with E=5 per-member ckpts)
        and calibration (B4 + APS + Episode + MultiHorizon) using a shared task-level z-score scaler
        fitted strictly on combined M0 + M4 training data.
        """
        t_key = canonical_phase34_task(task)
        shared_scaler = fit_shared_task_scaler_from_splits(
            t_key, m0_bundle["transitions"], m4_bundle["transitions"]
        )
        runtime_meta = get_runtime_reproducibility_metadata(repo_root=repo_root)

        runner = ModelTrainingRunner(
            task=t_key,
            hidden_dim=self.hidden_dim,
            epochs=self.epochs,
            lr=self.lr,
            seed=self.seed,
            max_grad_norm=self.max_grad_norm,
            normalize=True,
        )

        condition_bundles = {"M0_passive": m0_bundle, "M4_acmm": m4_bundle}
        task_results: Dict[str, Any] = {
            "task": t_key,
            "shared_normalization": shared_scaler.to_dict(),
            "runtime_environment": runtime_meta,
            "conditions": {},
        }

        for cond_name, train_bundle in condition_bundles.items():
            cond_dir = os.path.join(self.checkpoint_root, t_key, cond_name)
            os.makedirs(cond_dir, exist_ok=True)
            extra_meta = {
                "condition": cond_name,
                "training_seeds": [int(ep["seed"]) for ep in train_bundle["episodes"]],
                "calibration_seeds": [int(ep["seed"]) for ep in calib_bundle["episodes"]],
                "runtime_environment": runtime_meta,
            }

            trained = runner.train_all_architectures(
                training_transitions=train_bundle["transitions"],
                calib_transitions=calib_bundle["transitions"],
                architectures=("B1", "B2", "B3"),
                epochs=self.epochs,
                lr=self.lr,
                alpha=self.alpha,
                ensemble_size=5,
                feature_scaler=shared_scaler,
                checkpoint_dir=cond_dir,
                min_stratum_samples=self.min_stratum_samples,
                extra_metadata=extra_meta,
            )

            b1_ckpt = os.path.join(cond_dir, "b1_deterministic.pt")
            b4_artifact = self.calibrate_b4_artifacts(
                task=t_key,
                condition=cond_name,
                b1_model=trained["models"]["B1"],
                b1_checkpoint_path=b1_ckpt,
                calib_bundle=calib_bundle,
                calib_manifest_sha256=calib_manifest_sha256,
                output_dir=cond_dir,
            )

            task_results["conditions"][cond_name] = {
                "checkpoint_dir": cond_dir,
                "checkpoints": {
                    "B1": b1_ckpt,
                    "B2": os.path.join(cond_dir, "b2_probabilistic.pt"),
                    "B3": os.path.join(cond_dir, "b3_ensemble.pt"),
                    "B3_members": [os.path.join(cond_dir, f"b3_member_{i}.pt") for i in range(5)],
                    "B4": b4_artifact["artifact_path"],
                },
                "training_stats": trained["stats"],
                "b4_calibration_summary": b4_artifact["b4_calibration_fit_summary"],
                "aps_calibration": b4_artifact["aps_calibration"],
            }

        return task_results
