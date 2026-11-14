"""
HOROS PROBE-1 — Research-002: Trustworthy Action-Conditioned Contact World Models
Task 2 (Extended Compliant Pre-Lift): CompliantPreLiftContactEnv & OOD Nonstationary Regimes A/B

Physically compliant pre-lift contact environment implementing Document 50 mechanics and
Document 53 v1.1 reproducible OOD evaluation regimes:
- Nominal (ID / P2.7 baseline): Constant friction mu_true and constant object_mass.
- Regime A (Nonstationary Friction Step): Deterministic friction transition 0.60 -> 0.24 at step 15.
- Regime B (Mass Influx): Uncapped deterministic mass ramp (+0.25 kg/s) driven strictly by episode
  simulation time (sim_time_s = step_count * dt) starting from t = 0.0 s:
      object_mass(t) = initial_object_mass + 0.25 * max(0.0, sim_time_s - trigger_time_s)
  (Documented protocol note: Document 53 v1.1 specifies '0.35 -> 0.60 kg at +0.25 kg/s' without a
   cap—at dt=0.01 s, t=1.00 s yields 0.60 kg, and t=0.50 s [H=50] yields 0.475 kg. Consistent with
   Research-001 tacsl_harness.py and H5.3 boundary rules, no artificial mass cap is imposed.)

Invariant: True friction mu_true is NEVER exposed in controller observation dicts (_get_obs);
friction transitions and mass trajectories are observable via environment state, step histories,
and reproducible episode manifests.
"""

from __future__ import annotations
import copy
import json
import math
import os
from typing import Dict, Any, List, Optional, Tuple
import numpy as np


COMPLIANT_PRELIFT_REGIME_SPECS: Dict[str, Dict[str, Any]] = {
    "nominal": {
        "regime_id": "nominal",
        "name": "Nominal Stationary Compliant Pre-Lift",
        "description": "Stationary physical parameters across full episode.",
        "dt_s": 0.01,
        "gravity_mps2": 9.80665,
        "nonstationary": False,
        "initial_friction": 0.50,
        "initial_mass_kg": 0.350,
    },
    "A": {
        "regime_id": "Regime_A",
        "name": "Friction Step",
        "description": "Deterministic step drop in contact friction 0.60 -> 0.24 at simulation step 15.",
        "dt_s": 0.01,
        "gravity_mps2": 9.80665,
        "nonstationary": True,
        "initial_friction": 0.60,
        "changed_friction": 0.24,
        "transition_step": 15,
        "initial_mass_kg": 0.350,
        "episode_seeds": [6117, 6118, 6119, 6120],
    },
    "B": {
        "regime_id": "Regime_B",
        "name": "Dynamic Mass Influx",
        "description": "Deterministic continuous payload mass ramp (+0.25 kg/s) from episode simulation time t=0.0 s.",
        "dt_s": 0.01,
        "gravity_mps2": 9.80665,
        "nonstationary": True,
        "initial_friction": 0.60,
        "initial_mass_kg": 0.350,
        "mass_change_rate_kg_s": 0.25,
        "trigger": "episode_simulation_time",
        "trigger_time_s": 0.0,
        "mass_cap_kg": None,
        "ramp_formula": "object_mass(t) = initial_mass_kg + mass_change_rate_kg_s * max(0.0, sim_time_s - trigger_time_s)",
        "episode_seeds": [6121, 6122, 6123, 6124],
    },
}

_REGIME_ALIASES: Dict[str, str] = {
    "nominal": "nominal",
    "id": "nominal",
    "a": "A",
    "regime_a": "A",
    "friction_step": "A",
    "b": "B",
    "regime_b": "B",
    "mass_influx": "B",
    "dynamic_mass_influx": "B",
}


def normalize_regime_name(regime: Optional[str]) -> str:
    """Normalizes OOD regime identifiers to canonical keys {'nominal', 'A', 'B'}."""
    if regime is None:
        return "nominal"
    key = str(regime).strip().lower()
    if key not in _REGIME_ALIASES:
        raise ValueError(
            f"Unsupported CompliantPreLiftContactEnv regime '{regime}'. Expected nominal, A (Regime_A), or B (Regime_B)."
        )
    return _REGIME_ALIASES[key]


def build_ood_regime_manifests() -> Dict[str, Any]:
    """Builds the complete reproducible JSON manifest dictionary for Research-002 OOD regimes."""
    return {
        "manifest_id": "HOROS-PROBE1-R002-OOD-MANIFEST-v1.0",
        "environment": "CompliantPreLiftContactEnv",
        "task": "compliant_prelift",
        "observation_schema": {
            "state_vector_dim": 23,
            "layout": {
                "0:12": "finger_pos (4x3 mm)",
                "12:16": "finger_fn (4 normal forces N)",
                "16:20": "slip_velocity (4 delta_dot_t m/s)",
                "20:23": "obj_pos (3 mm)",
            },
        },
        "regimes": copy.deepcopy(COMPLIANT_PRELIFT_REGIME_SPECS),
        "protocol_ood_strata_seeds_6100_6124": {
            "ood_low_mu": {
                "seeds": list(range(6100, 6109)),
                "mu_values": [0.12, 0.18, 0.22],
                "object_mass_kg": 0.350,
            },
            "ood_high_mass": {
                "seeds": list(range(6109, 6117)),
                "object_mass_values_kg": [0.55, 0.70],
                "mu_true": 0.40,
            },
            "ood_regime_a_friction_step": {
                "seeds": [6117, 6118, 6119, 6120],
                "regime": "A",
                "initial_friction": 0.60,
                "changed_friction": 0.24,
                "transition_step": 15,
                "object_mass_kg": 0.350,
            },
            "ood_regime_b_mass_influx": {
                "seeds": [6121, 6122, 6123, 6124],
                "regime": "B",
                "initial_mass_kg": 0.350,
                "mass_change_rate_kg_s": 0.25,
                "trigger": "episode_simulation_time",
                "mass_cap_kg": None,
                "mu_true": 0.60,
            },
        },
    }


def get_ood_episode_manifest(seed: int, regime: Optional[str] = None) -> Dict[str, Any]:
    """
    Returns an explicit, reproducible episode manifest for the specified seed and/or OOD regime.
    Matches Document 53 v1.1 OOD block 6100-6124 when regime is omitted inside that range.
    """
    if regime is not None:
        norm = normalize_regime_name(regime)
        spec = copy.deepcopy(COMPLIANT_PRELIFT_REGIME_SPECS[norm])
        return {
            "seed": int(seed),
            "environment": "CompliantPreLiftContactEnv",
            "task": "compliant_prelift",
            "regime": norm,
            "regime_spec": spec,
            "mu_true": float(spec["initial_friction"]),
            "object_mass": float(spec["initial_mass_kg"]),
            "dt": float(spec["dt_s"]),
        }

    # Document 53 OOD stratum lookup by seed inside 6100..6124
    if 6100 <= seed <= 6108:
        mu_choices = (0.12, 0.18, 0.22)
        mu_val = mu_choices[(seed - 6100) // 3]
        return {
            "seed": int(seed),
            "environment": "CompliantPreLiftContactEnv",
            "task": "compliant_prelift",
            "stratum": "OOD-LowMu",
            "regime": "nominal",
            "regime_spec": copy.deepcopy(COMPLIANT_PRELIFT_REGIME_SPECS["nominal"]),
            "mu_true": float(mu_val),
            "object_mass": 0.350,
            "dt": 0.01,
        }
    if 6109 <= seed <= 6116:
        mass_choices = (0.55, 0.70)
        mass_val = mass_choices[(seed - 6109) // 4]
        return {
            "seed": int(seed),
            "environment": "CompliantPreLiftContactEnv",
            "task": "compliant_prelift",
            "stratum": "OOD-HighMass",
            "regime": "nominal",
            "regime_spec": copy.deepcopy(COMPLIANT_PRELIFT_REGIME_SPECS["nominal"]),
            "mu_true": 0.40,
            "object_mass": float(mass_val),
            "dt": 0.01,
        }
    if 6117 <= seed <= 6120:
        spec = copy.deepcopy(COMPLIANT_PRELIFT_REGIME_SPECS["A"])
        return {
            "seed": int(seed),
            "environment": "CompliantPreLiftContactEnv",
            "task": "compliant_prelift",
            "stratum": "OOD-RegimeA-FrictionStep",
            "regime": "A",
            "regime_spec": spec,
            "mu_true": float(spec["initial_friction"]),
            "object_mass": float(spec["initial_mass_kg"]),
            "dt": float(spec["dt_s"]),
        }
    if 6121 <= seed <= 6124:
        spec = copy.deepcopy(COMPLIANT_PRELIFT_REGIME_SPECS["B"])
        return {
            "seed": int(seed),
            "environment": "CompliantPreLiftContactEnv",
            "task": "compliant_prelift",
            "stratum": "OOD-RegimeB-MassInflux",
            "regime": "B",
            "regime_spec": spec,
            "mu_true": float(spec["initial_friction"]),
            "object_mass": float(spec["initial_mass_kg"]),
            "dt": float(spec["dt_s"]),
        }

    # Nominal ID default
    spec = copy.deepcopy(COMPLIANT_PRELIFT_REGIME_SPECS["nominal"])
    return {
        "seed": int(seed),
        "environment": "CompliantPreLiftContactEnv",
        "task": "compliant_prelift",
        "stratum": "ID-Nominal",
        "regime": "nominal",
        "regime_spec": spec,
        "mu_true": float(spec["initial_friction"]),
        "object_mass": float(spec["initial_mass_kg"]),
        "dt": float(spec["dt_s"]),
    }


def create_env_from_manifest(manifest: Dict[str, Any]) -> "CompliantPreLiftContactEnv":
    """Instantiates CompliantPreLiftContactEnv directly from a reproducible episode manifest."""
    regime = manifest.get("regime", "nominal")
    spec = manifest.get("regime_spec", COMPLIANT_PRELIFT_REGIME_SPECS[normalize_regime_name(regime)])
    return CompliantPreLiftContactEnv(
        mu_true=float(manifest.get("mu_true", spec.get("initial_friction", 0.60))),
        object_mass=float(manifest.get("object_mass", spec.get("initial_mass_kg", 0.350))),
        dt=float(manifest.get("dt", spec.get("dt_s", 0.01))),
        seed=int(manifest.get("seed", 2026)),
        regime=regime,
        regime_a_initial_mu=float(spec.get("initial_friction", 0.60)),
        regime_a_changed_mu=float(spec.get("changed_friction", 0.24)),
        regime_a_transition_step=int(spec.get("transition_step", 15)),
        regime_b_mass_rate_kg_s=float(spec.get("mass_change_rate_kg_s", 0.25)),
        regime_b_trigger_time_s=float(spec.get("trigger_time_s", 0.0)),
    )


class CompliantPreLiftContactEnv:
    """
    Physically compliant pre-lift contact testbed implementing Document 50 mechanics
    and Document 53 OOD Regimes A/B:
    - 4 elastomeric fingertip shear pads in parallel (k_pads = 6000 N/m = 6.0 N/mm total, 1.5 N/mm per finger)
    - Table vertical compliance k_table = 50000 N/m = 50.0 N/mm
    - Rigid workpiece nominal mass = 0.350 kg (static weight W = 3.4323 N under g = 9.80665 m/s^2)
    - Normal radial contact stiffness k_normal = 4.0 N/mm per finger
    - Coulomb slip occurs physically if ||ft_i|| > mu_true * Fn_i
    - True friction mu_true is NEVER exposed to the controller (hidden world parameter)
    """

    def __init__(
        self,
        mu_true: float = 0.60,
        object_mass: float = 0.350,
        gravity: float = 9.80665,
        dt: float = 0.01,
        k_pad_per_finger_npm: float = 1500.0,  # 4 * 1500 = 6000 N/m total
        k_normal_per_finger_npmm: float = 4.0,
        noise_std_n: float = 0.015,
        noise_std_t: float = 0.008,
        seed: int = 2026,
        regime: Optional[str] = None,
        regime_a_initial_mu: float = 0.60,
        regime_a_changed_mu: float = 0.24,
        regime_a_transition_step: int = 15,
        regime_b_mass_rate_kg_s: float = 0.25,
        regime_b_trigger_time_s: float = 0.0,
    ):
        self.regime = normalize_regime_name(regime)
        self.regime_a_initial_mu = float(regime_a_initial_mu)
        self.regime_a_changed_mu = float(regime_a_changed_mu)
        self.regime_a_transition_step = int(regime_a_transition_step)
        self.regime_b_mass_rate_kg_s = float(regime_b_mass_rate_kg_s)
        self.regime_b_trigger_time_s = float(regime_b_trigger_time_s)

        # Preserve caller-supplied mu_true unless Regime A explicitly requests protocol default
        if self.regime == "A" and math.isclose(mu_true, 0.60, rel_tol=1e-9):
            self.initial_mu_true = float(self.regime_a_initial_mu)
        else:
            self.initial_mu_true = float(mu_true)
        self.initial_object_mass = float(object_mass)

        self.mu_true = float(self.initial_mu_true)
        self.object_mass = float(self.initial_object_mass)
        self.gravity = float(gravity)
        self.dt = float(dt)
        self.k_pad = float(k_pad_per_finger_npm)
        self.k_norm = float(k_normal_per_finger_npmm)
        self.noise_std_n = float(noise_std_n)
        self.noise_std_t = float(noise_std_t)
        self.seed = int(seed)
        self.rng = np.random.RandomState(self.seed)
        self.reset()

    def reset(
        self,
        mu_true: Optional[float] = None,
        seed: Optional[int] = None,
        object_mass: Optional[float] = None,
        regime: Optional[str] = None,
    ):
        if regime is not None:
            self.regime = normalize_regime_name(regime)
        if mu_true is not None:
            self.initial_mu_true = float(mu_true)
        elif self.regime == "A":
            self.initial_mu_true = float(self.regime_a_initial_mu)
        if object_mass is not None:
            self.initial_object_mass = float(object_mass)
        if seed is not None:
            self.seed = int(seed)
            self.rng = np.random.RandomState(self.seed)

        # Clean reset guarantees zero OOD leakage across episode boundaries
        self.mu_true = float(self.initial_mu_true)
        self.object_mass = float(self.initial_object_mass)
        self._regime_a_triggered = False

        self.obj_pos = np.array([0.0, 0.0, 0.0], dtype=float)  # mm
        self.obj_vel = np.array([0.0, 0.0, 0.0], dtype=float)  # mm/s
        self.obj_acc_z = 0.0  # m/s^2
        # Fingers start 1.5 mm away from object radius 35.0 mm (free space)
        self.finger_pos = np.array(
            [
                [36.5, 0.0, 40.0],
                [-36.5, 0.0, 40.0],
                [0.0, 36.5, 40.0],
                [0.0, -36.5, 40.0],
            ],
            dtype=float,
        )
        self.pad_stretch_m = np.zeros(4, dtype=float)
        self.fn = np.zeros(4, dtype=float)
        self.ft = np.zeros((4, 2), dtype=float)  # [ft_theta, ft_z]
        self.slip_vel_mps = np.zeros(4, dtype=float)
        self.dropped = False
        self.lifted = False
        self.step_count = 0
        self.sim_time_s = 0.0
        self.prev_noise_n = np.zeros(4, dtype=float)
        self.prev_noise_t = np.zeros(4, dtype=float)

        self.regime_events: List[Dict[str, Any]] = []
        self.friction_history: List[float] = [float(self.mu_true)]
        self.mass_history: List[float] = [float(self.object_mass)]
        self.step_history: List[Dict[str, Any]] = []

        return self._get_obs()

    def _apply_nonstationary_regime(self):
        """
        Applies deterministic OOD regime parameter transitions using simulation step and
        simulation time (never wall-clock time) without resetting unrelated physical state.
        """
        if self.regime == "A":
            if (not self._regime_a_triggered) and (self.step_count >= self.regime_a_transition_step):
                prev_mu = float(self.mu_true)
                self.mu_true = float(self.regime_a_changed_mu)
                self._regime_a_triggered = True
                self.regime_events.append({
                    "event": "regime_a_friction_step",
                    "step": int(self.step_count),
                    "sim_time_s": float(self.sim_time_s),
                    "from_mu": prev_mu,
                    "to_mu": float(self.mu_true),
                })
        elif self.regime == "B":
            elapsed_s = max(0.0, self.sim_time_s - self.regime_b_trigger_time_s)
            self.object_mass = float(self.initial_object_mass + self.regime_b_mass_rate_kg_s * elapsed_s)

    def step(self, action: np.ndarray):
        self.step_count += 1
        self.sim_time_s = round(self.step_count * self.dt, 9)

        # Apply OOD nonstationary parameter updates before physics dynamics for this step
        self._apply_nonstationary_regime()
        step_mu_used = float(self.mu_true)
        step_mass_used = float(self.object_mass)

        squeeze = np.clip(action[:4], -2.0, 2.0)
        arm_dz_mm = float(np.clip(action[4], -2.0, 5.0))
        arm_dz_m = arm_dz_mm * 1e-3

        # 1. Update radial squeeze indentation -> normal forces
        obj_radius = 35.0
        for i in range(4):
            r_curr = float(np.linalg.norm(self.finger_pos[i, :2]))
            r_new = max(28.0, r_curr - squeeze[i])
            u = self.finger_pos[i, :2] / max(1e-6, r_curr)
            self.finger_pos[i, :2] = u * r_new
            indent_mm = max(0.0, obj_radius - r_new)
            self.fn[i] = self.k_norm * indent_mm if indent_mm > 0.0 else 0.0

        # 2. Compliant tangential pad stretch vs table reaction & Coulomb slip limit
        prev_vel_z_mps = self.obj_vel[2] * 1e-3
        weight_n = step_mass_used * self.gravity
        prev_obj_z_m = self.obj_pos[2] * 1e-3
        cmd_vel_mps = arm_dz_m / self.dt

        # Candidate object upward motion (restrained on table until total shear >= W, then inertial lift)
        tentative_stretch_m = self.pad_stretch_m + arm_dz_m
        candidate_ft_z = np.where(self.fn > 0.10, self.k_pad * np.maximum(0.0, tentative_stretch_m), 0.0)

        # Check physical Coulomb cone at each contact (transverse perturbation near zero)
        ft_theta = np.zeros(4, dtype=float)
        actual_slip_vel = np.zeros(4, dtype=float)
        actual_ft_z = np.zeros(4, dtype=float)

        for i in range(4):
            if self.fn[i] < 0.10:
                self.pad_stretch_m[i] = 0.0
                actual_ft_z[i] = 0.0
                actual_slip_vel[i] = cmd_vel_mps
                continue

            max_static_ft = step_mu_used * self.fn[i]
            if candidate_ft_z[i] <= max_static_ft:
                actual_ft_z[i] = candidate_ft_z[i]
                self.pad_stretch_m[i] = tentative_stretch_m[i]
                actual_slip_vel[i] = 0.0
            else:
                # Coulomb slip occurs! Pad slips at kinetic limit 0.90 * mu_true * Fn
                actual_ft_z[i] = 0.90 * max_static_ft
                self.pad_stretch_m[i] = actual_ft_z[i] / self.k_pad
                actual_slip_vel[i] = max(0.0005, abs(cmd_vel_mps))  # > 0.10 mm/s physical slip velocity!

        total_ft_z = float(np.sum(actual_ft_z))

        # 3. Rigid-body vertical dynamics of object
        if prev_obj_z_m <= 1e-6:
            if total_ft_z > weight_n and np.all(actual_slip_vel <= 1e-4):
                # Liftoff achieved! Object follows compliant equilibrium acceleration
                a_z = min(cmd_vel_mps / self.dt, (total_ft_z - weight_n) / step_mass_used)
                a_z = max(0.0, min(0.040, a_z))
                new_vel_z_mps = prev_vel_z_mps + a_z * self.dt
                if abs(cmd_vel_mps - prev_vel_z_mps) <= 0.050 * self.dt:
                    new_vel_z_mps = max(0.0, cmd_vel_mps)
                    a_z = (new_vel_z_mps - prev_vel_z_mps) / self.dt
                new_obj_z_m = max(0.0, prev_obj_z_m + new_vel_z_mps * self.dt)
                self.pad_stretch_m = actual_ft_z / self.k_pad
                # Clamp actual shear to balanced dynamic equilibrium force
                eq_ft_z = step_mass_used * (self.gravity + a_z) / 4.0
                for i in range(4):
                    if actual_slip_vel[i] == 0.0 and eq_ft_z <= step_mu_used * self.fn[i]:
                        actual_ft_z[i] = eq_ft_z
                        self.pad_stretch_m[i] = eq_ft_z / self.k_pad
            else:
                a_z = 0.0
                new_vel_z_mps = 0.0
                new_obj_z_m = 0.0
        else:
            # Object is airborne
            max_holdable = float(np.sum(actual_ft_z))
            if max_holdable < weight_n * 0.98 or np.any(actual_slip_vel > 1e-4):
                # Object slips and drops under gravity
                a_z = max(-self.gravity, (max_holdable - weight_n) / step_mass_used)
                new_vel_z_mps = prev_vel_z_mps + a_z * self.dt
                new_obj_z_m = max(0.0, prev_obj_z_m + new_vel_z_mps * self.dt)
                if new_obj_z_m <= 1e-6:
                    self.dropped = True
            else:
                # Track arm velocity cleanly without slipping
                a_z = (cmd_vel_mps - prev_vel_z_mps) / self.dt
                new_vel_z_mps = cmd_vel_mps
                new_obj_z_m = max(0.0, prev_obj_z_m + new_vel_z_mps * self.dt)
                eq_ft_z = step_mass_used * (self.gravity + a_z) / 4.0
                for i in range(4):
                    actual_ft_z[i] = min(step_mu_used * self.fn[i], max(0.0, eq_ft_z))
                    self.pad_stretch_m[i] = actual_ft_z[i] / self.k_pad

        # Update finger vertical coordinate identically to hand z = obj_z + pad_stretch (relative offset + 40mm)
        self.obj_pos[2] = new_obj_z_m * 1000.0
        self.obj_vel[2] = new_vel_z_mps * 1000.0
        self.obj_acc_z = a_z
        for i in range(4):
            self.finger_pos[i, 2] = self.obj_pos[2] + 40.0 + self.pad_stretch_m[i] * 1000.0

        self.ft = np.column_stack([ft_theta, actual_ft_z])
        self.slip_vel_mps = actual_slip_vel
        if self.obj_pos[2] >= 5.0 and not self.dropped:
            self.lifted = True

        self.friction_history.append(step_mu_used)
        self.mass_history.append(step_mass_used)
        self.step_history.append({
            "step": int(self.step_count),
            "sim_time_s": float(self.sim_time_s),
            "mu_true": step_mu_used,
            "object_mass_kg": step_mass_used,
            "obj_z_mm": float(self.obj_pos[2]),
            "obj_vel_z_mm_s": float(self.obj_vel[2]),
            "total_fn_n": float(np.sum(self.fn)),
            "total_ft_z_n": float(np.sum(actual_ft_z)),
            "lifted": bool(self.lifted),
            "dropped": bool(self.dropped),
        })

        return self._get_obs(), self.obj_pos[2] >= 20.0

    def _get_obs(self):
        # Apply AR(1) stationary thermal + white sensor noise
        rho1 = 0.1355
        innov_n = self.rng.normal(0.0, self.noise_std_n * math.sqrt(1 - rho1 ** 2), 4)
        innov_t = self.rng.normal(0.0, self.noise_std_t * math.sqrt(1 - rho1 ** 2), 4)
        self.prev_noise_n = rho1 * self.prev_noise_n + innov_n
        self.prev_noise_t = rho1 * self.prev_noise_t + innov_t

        fn_meas = np.where(self.fn > 0.05, np.maximum(0.0, self.fn + self.prev_noise_n), 0.0)
        ft_meas = self.ft.copy()
        if np.any(self.fn > 0.05):
            ft_meas[:, 1] = ft_meas[:, 1] + np.where(self.fn > 0.05, self.prev_noise_t, 0.0)

        return {
            "finger_pos": self.finger_pos.copy(),
            "finger_fn": fn_meas,
            "finger_ft": ft_meas,
            "obj_pos": self.obj_pos.copy(),
            "obj_vel": self.obj_vel.copy(),
            "a_z": self.obj_acc_z,
            "delta_dot_t": self.slip_vel_mps.copy(),
            "dt_ms": self.dt * 1000.0,
            "gamma": 1,
        }

    def get_environment_state(self) -> Dict[str, Any]:
        """
        Returns the full physical environment state (including nonstationary mu_true and object_mass)
        for testing and logging while keeping controller observations blind to mu_true.
        """
        return {
            "step": int(self.step_count),
            "sim_time_s": float(self.sim_time_s),
            "regime": self.regime,
            "mu_true": float(self.mu_true),
            "object_mass": float(self.object_mass),
            "obj_pos": self.obj_pos.copy(),
            "obj_vel": self.obj_vel.copy(),
            "finger_pos": self.finger_pos.copy(),
            "fn": self.fn.copy(),
            "ft": self.ft.copy(),
            "lifted": bool(self.lifted),
            "dropped": bool(self.dropped),
            "regime_events": copy.deepcopy(self.regime_events),
        }

    def get_episode_manifest(self) -> Dict[str, Any]:
        """Returns complete, reproducible JSON-serializable episode configuration & trace manifest."""
        spec = copy.deepcopy(COMPLIANT_PRELIFT_REGIME_SPECS[self.regime])
        if self.regime == "A":
            spec["initial_friction"] = float(self.initial_mu_true)
            spec["changed_friction"] = float(self.regime_a_changed_mu)
            spec["transition_step"] = int(self.regime_a_transition_step)
        elif self.regime == "B":
            spec["initial_mass_kg"] = float(self.initial_object_mass)
            spec["mass_change_rate_kg_s"] = float(self.regime_b_mass_rate_kg_s)
            spec["trigger_time_s"] = float(self.regime_b_trigger_time_s)
            spec["mass_cap_kg"] = None

        return {
            "environment": "CompliantPreLiftContactEnv",
            "task": "compliant_prelift",
            "seed": int(self.seed),
            "dt_s": float(self.dt),
            "gravity_mps2": float(self.gravity),
            "regime": self.regime,
            "regime_config": spec,
            "initial_state": {
                "mu_true": float(self.initial_mu_true),
                "object_mass_kg": float(self.initial_object_mass),
            },
            "current_state": {
                "step": int(self.step_count),
                "sim_time_s": float(self.sim_time_s),
                "mu_true": float(self.mu_true),
                "object_mass_kg": float(self.object_mass),
                "obj_z_mm": float(self.obj_pos[2]),
                "lifted": bool(self.lifted),
                "dropped": bool(self.dropped),
            },
            "steps_executed": int(self.step_count),
            "regime_events": copy.deepcopy(self.regime_events),
            "friction_history": [round(float(x), 6) for x in self.friction_history],
            "mass_history": [round(float(x), 6) for x in self.mass_history],
            "step_records": copy.deepcopy(self.step_history),
        }
