"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Stage P2.6: Contact-Aware Safety Coordination
Module: Intervention Telemetry Logger (Workstream A)

Instruments every control decision and safety intervention with high-resolution
multimodal telemetry:
1. Contact Mode (stratum / predicted physical mode)
2. Normal Force & Shear Force profiles (Fn, Ft per contact point)
3. Slip Ratio (||Ft|| / (mu * Fn)) & Friction Cone utilization
4. Predictive Control Barrier Values (h_slip, h_crush, h_normal)
5. Proposed vs Filtered Action delta (action distortion norm ||a_prop - a_filt||)
6. Consecutive Intervention Streak counter
7. Task Progress (millimeter coordinates: z-lift or insertion depth)
"""

import os
import json
from typing import Dict, Any, List, Optional, Tuple
import numpy as np


class InterventionTelemetryLogger:
    def __init__(self, task: str = "multifinger_lift"):
        self.task = task
        self.episodes: List[Dict[str, Any]] = []
        self._current_episode: Optional[Dict[str, Any]] = None
        self._current_streak: int = 0

    def start_episode(self, episode_id: int, model_name: str, configuration: str, seed: int):
        self._current_streak = 0
        self._current_episode = {
            "episode_id": episode_id,
            "model_name": model_name,
            "configuration": configuration,
            "seed": seed,
            "task": self.task,
            "decisions": [],
            "summary": {}
        }

    def log_decision(
        self,
        step_idx: int,
        obs: Dict[str, Any],
        proposed_action: np.ndarray,
        filtered_action: np.ndarray,
        intervened: bool,
        filter_info: Optional[Dict[str, Any]] = None,
        task_progress_mm: float = 0.0,
        contact_mode: int = 0
    ) -> Dict[str, Any]:
        if self._current_episode is None:
            raise RuntimeError("Must call start_episode before log_decision")

        filter_info = filter_info or {}
        a_prop = np.asarray(proposed_action, dtype=float)
        a_filt = np.asarray(filtered_action, dtype=float)
        distortion_norm = float(np.linalg.norm(a_prop - a_filt))

        if intervened:
            self._current_streak += 1
        else:
            self._current_streak = 0

        # Extract contact mechanics from obs if available
        fn_profile = []
        ft_profile = []
        slip_ratios = []

        if "normal_forces" in obs and obs["normal_forces"] is not None:
            fn_profile = [float(x) for x in obs["normal_forces"]]
        elif "finger_normal_force" in obs and obs["finger_normal_force"] is not None:
            fn_profile = [float(x) for x in obs["finger_normal_force"]]

        if "finger_shear_force" in obs and obs["finger_shear_force"] is not None:
            raw_ft = obs["finger_shear_force"]
            try:
                ft_arr = np.asarray(raw_ft, dtype=float)
                if ft_arr.ndim == 1:
                    ft_profile = [float(abs(x)) for x in ft_arr]
                elif ft_arr.ndim == 2:
                    ft_profile = [float(np.linalg.norm(x)) for x in ft_arr]
            except Exception:
                ft_profile = []
        elif "shear_forces" in obs and obs["shear_forces"] is not None:
            raw_ft = obs["shear_forces"]
            try:
                ft_arr = np.asarray(raw_ft, dtype=float)
                if ft_arr.ndim == 1:
                    ft_profile = [float(abs(x)) for x in ft_arr]
                elif ft_arr.ndim == 2:
                    ft_profile = [float(np.linalg.norm(x)) for x in ft_arr]
            except Exception:
                ft_profile = []

        if "slip_ratios" in obs and obs["slip_ratios"] is not None:
            slip_ratios = [float(x) for x in obs["slip_ratios"]]

        max_slip = float(np.max(slip_ratios)) if slip_ratios else float(filter_info.get("max_slip_ratio", 0.0))
        mean_fn = float(np.mean(fn_profile)) if fn_profile else float(filter_info.get("mean_normal_force", 0.0))

        # Barrier values
        h_slip = float(filter_info.get("h_slip", 1.0 - max_slip))
        h_crush = float(filter_info.get("h_crush", 25.0 - (max(fn_profile) if fn_profile else 0.0)))

        decision_record = {
            "step_idx": step_idx,
            "contact_mode": int(contact_mode),
            "contact_mode_name": obs.get("stratum_name", "Unknown"),
            "task_progress_mm": round(float(task_progress_mm), 4),
            "intervened": bool(intervened),
            "streak_length": int(self._current_streak),
            "proposed_action": [round(float(x), 4) for x in a_prop],
            "filtered_action": [round(float(x), 4) for x in a_filt],
            "action_distortion_norm": round(distortion_norm, 5),
            "normal_forces_N": [round(float(x), 4) for x in fn_profile],
            "normal_force_mean_N": round(mean_fn, 4),
            "shear_forces_N": [round(float(x), 4) for x in ft_profile],
            "slip_ratios": [round(float(x), 4) for x in slip_ratios] if slip_ratios else ([round(max_slip, 4)] * len(fn_profile) if fn_profile else []),
            "max_slip_ratio": round(max_slip, 4),
            "barrier_h_slip": round(h_slip, 4),
            "barrier_h_crush": round(h_crush, 4),
            "filter_reason": filter_info.get("intervention_reason", "none" if not intervened else "slip_constraint")
        }

        self._current_episode["decisions"].append(decision_record)
        return decision_record

    def end_episode(
        self,
        task_success: bool,
        safety_violated: bool,
        stalled: bool,
        final_progress_mm: float
    ):
        if self._current_episode is None:
            return

        decisions = self._current_episode["decisions"]
        n_dec = len(decisions)
        n_interv = sum(1 for d in decisions if d["intervened"])
        streaks = [d["streak_length"] for d in decisions]
        distortions = [d["action_distortion_norm"] for d in decisions if d["intervened"]]

        self._current_episode["summary"] = {
            "total_decisions": n_dec,
            "total_interventions": n_interv,
            "intervention_rate": round(float(n_interv / max(1, n_dec)), 4),
            "max_streak": int(max(streaks)) if streaks else 0,
            "mean_distortion_norm": round(float(np.mean(distortions)), 4) if distortions else 0.0,
            "task_success": bool(task_success),
            "safety_violated": bool(safety_violated),
            "stalled": bool(stalled),
            "final_progress_mm": round(float(final_progress_mm), 4)
        }

        self.episodes.append(self._current_episode)
        self._current_episode = None

    def get_aggregate_telemetry(self) -> Dict[str, Any]:
        if not self.episodes:
            return {}

        total_eps = len(self.episodes)
        total_dec = sum(ep["summary"]["total_decisions"] for ep in self.episodes)
        total_int = sum(ep["summary"]["total_interventions"] for ep in self.episodes)
        success_cnt = sum(1 for ep in self.episodes if ep["summary"]["task_success"])
        violation_cnt = sum(1 for ep in self.episodes if ep["summary"]["safety_violated"])
        stall_cnt = sum(1 for ep in self.episodes if ep["summary"]["stalled"])
        progress_vals = [ep["summary"]["final_progress_mm"] for ep in self.episodes]
        max_streaks = [ep["summary"]["max_streak"] for ep in self.episodes]

        # Mode breakdown of interventions
        interventions_by_mode: Dict[int, int] = {}
        decisions_by_mode: Dict[int, int] = {}
        for ep in self.episodes:
            for d in ep["decisions"]:
                m = d["contact_mode"]
                decisions_by_mode[m] = decisions_by_mode.get(m, 0) + 1
                if d["intervened"]:
                    interventions_by_mode[m] = interventions_by_mode.get(m, 0) + 1

        mode_stats = {}
        for m, total_m in decisions_by_mode.items():
            int_m = interventions_by_mode.get(m, 0)
            mode_stats[str(m)] = {
                "decisions": total_m,
                "interventions": int_m,
                "intervention_rate": round(float(int_m / total_m), 4)
            }

        return {
            "total_episodes": total_eps,
            "total_decisions": total_dec,
            "total_interventions": total_int,
            "intervention_rate": round(float(total_int / max(1, total_dec)), 4),
            "success_count": success_cnt,
            "success_rate": round(float(success_cnt / total_eps), 4),
            "violation_count": violation_cnt,
            "violation_rate": round(float(violation_cnt / total_eps), 4),
            "stall_count": stall_cnt,
            "stall_rate": round(float(stall_cnt / total_eps), 4),
            "progress_mean_mm": round(float(np.mean(progress_vals)), 4) if progress_vals else 0.0,
            "progress_max_mm": round(float(np.max(progress_vals)), 4) if progress_vals else 0.0,
            "mean_max_streak": round(float(np.mean(max_streaks)), 2) if max_streaks else 0.0,
            "max_observed_streak": int(max(max_streaks)) if max_streaks else 0,
            "interventions_by_contact_mode": mode_stats
        }

    def save_json(self, filepath: str):
        os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
        data = {
            "task": self.task,
            "aggregate": self.get_aggregate_telemetry(),
            "episodes": self.episodes
        }
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
