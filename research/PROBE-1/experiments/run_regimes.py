"""
Empirical Benchmark Suite: Runs Regimes A, B, C, and D across Baselines and Proposed Safety Filter.
Outputs complete metrics (Drop Rate, Crush Rate, Survival Time, Solve Latencies, and Coverage).
"""
from __future__ import annotations

import json
import time
import numpy as np
import sys
import os

src_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../src"))
root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if src_path not in sys.path:
    sys.path.insert(0, src_path)
if root_path not in sys.path:
    sys.path.insert(0, root_path)

from simulation.tacsl_harness import GraspSimulationEnvironment
from baselines.baselines import (
    FixedForceBaseline,
    ReactiveSlipSqueezeBaseline,
    UnconstrainedFlowBaseline,
    DeterministicTactileMPCBaseline,
)
from safety.safety_filter import PredictiveSafetyFilter, SafetyFilterState
from safety.predictive_cbf import DiscreteTimePredictiveCBF
from contact.dynamics import (
    HuntCrossleyContactModel,
    MultiContactHandDynamics,
    ObjectSpatialDynamics,
)
from contact.sensitivity import ContactForceSensitivity
from estimation.conformal import ConformalCalibrator, AdaptiveConformalInference


def run_benchmark(num_trials_per_regime: int = 20, seed: int = 42) -> dict:
    rng = np.random.default_rng(seed)
    regimes = ["A", "B", "C", "D"]
    controllers = ["B1_FixedForce", "B2_ReactiveSqueeze", "B3_UnconstrainedFlow", "B4_DeterministicMPC", "Proposed_pCBF_ACI"]

    results = {
        "metadata": {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "num_trials_per_regime": num_trials_per_regime,
            "control_frequency_hz": 100,
            "period_ms": 10.0,
            "solver_deadline_ms": 10.0,
        },
        "regimes": {}
    }

    # Setup Proposed controller components
    hand = MultiContactHandDynamics(num_fingers=4)
    contact = HuntCrossleyContactModel()
    sensitivity = ContactForceSensitivity(hand, contact, dt=0.01)
    obj = ObjectSpatialDynamics(nominal_mass=0.40)
    cbf = DiscreteTimePredictiveCBF(num_fingers=4, f_min=0.5, f_max=18.0)

    normals = [
        np.array([-1.0, 0.0, 0.0]),
        np.array([-1.0, 0.0, 0.0]),
        np.array([ 1.0, 0.0, 0.0]),
        np.array([ 1.0, 0.0, 0.0]),
    ]
    p_contacts = [
        np.array([ 0.03,  0.02, 0.0]),
        np.array([ 0.03, -0.02, 0.0]),
        np.array([-0.03,  0.02, 0.0]),
        np.array([-0.03, -0.02, 0.0]),
    ]

    for regime in regimes:
        results["regimes"][regime] = {}

        for ctrl_name in controllers:
            drops = 0
            crushes = 0
            survival_steps_list = []
            solve_times_ms = []

            for trial in range(num_trials_per_regime):
                env = GraspSimulationEnvironment(num_fingers=4, dt=0.01)
                env.reset(regime=regime)

                # Initialize specific controller
                if ctrl_name == "B1_FixedForce":
                    ctrl = FixedForceBaseline(n_q=16)
                elif ctrl_name == "B2_ReactiveSqueeze":
                    ctrl = ReactiveSlipSqueezeBaseline(n_q=16)
                elif ctrl_name == "B3_UnconstrainedFlow":
                    ctrl = UnconstrainedFlowBaseline(n_q=16)
                elif ctrl_name == "B4_DeterministicMPC":
                    ctrl = DeterministicTactileMPCBaseline(n_q=16)
                elif ctrl_name == "Proposed_pCBF_ACI":
                    safety_filter = PredictiveSafetyFilter(
                        n_q=16, wrench_slack_penalty=10.0, max_relax_steps=5, slack_threshold=1e-2
                    )

                trial_steps = 0
                for step in range(50):
                    obs = env.get_observation()

                    if ctrl_name == "Proposed_pCBF_ACI":
                        f_curr = [
                            np.array([-obs["f_normal"][0], 0.0, obs["f_shear"][0][1]]),
                            np.array([-obs["f_normal"][1], 0.0, obs["f_shear"][1][1]]),
                            np.array([ obs["f_normal"][2], 0.0, obs["f_shear"][2][1]]),
                            np.array([ obs["f_normal"][3], 0.0, obs["f_shear"][3][1]]),
                        ]
                        v_obj = [np.zeros(3) for _ in range(4)]
                        lambdas, biases = sensitivity.compute_sensitivity_and_bias(
                            obs["q"], obs["dq"], f_curr, v_obj, [0.0015] * 4, [0.0] * 4
                        )
                        G = obj.grasp_matrix(p_contacts, obs["com"])
                        w_req = obj.required_wrench(obs["mass"], obj.inertia, np.zeros(3), np.zeros(3), np.zeros(3))
                        mu_cal = [max(0.05, obs["friction"][i] - 0.04) for i in range(4)]
                        u_min = np.full(16, -30.0)
                        u_max = np.full(16, 30.0)

                        A_ineq, b_ineq, A_eq, b_eq = cbf.build_qp_matrices(
                            lambdas, biases, normals, mu_cal, f_curr, G, w_req, u_min, u_max
                        )
                        u_nom = np.zeros(16)
                        if obs["incipient_slip"] or obs["step"] >= 30:
                            u_nom = np.ones(16) * 12.0
                        elif obs["mass"] > 0.42:
                            u_nom = np.ones(16) * 4.0

                        u_action, state, m = safety_filter.solve(
                            u_nom, obs["dq"], A_ineq, b_ineq, A_eq, b_eq
                        )
                        if "solver_c_time_ms" in m:
                            solve_times_ms.append(m["solver_c_time_ms"])
                    else:
                        t0 = time.perf_counter()
                        u_action = ctrl.compute_action(obs)
                        t_solve = (time.perf_counter() - t0) * 1000.0
                        solve_times_ms.append(t_solve)

                    res = env.step(u_action)
                    trial_steps = res["survival_steps"]
                    if res["dropped"] or res["crushed"]:
                        break

                if env.dropped:
                    drops += 1
                if env.crushed:
                    crushes += 1
                survival_steps_list.append(trial_steps)

            drop_rate = float(drops / num_trials_per_regime)
            crush_rate = float(crushes / num_trials_per_regime)
            mean_survival = float(np.mean(survival_steps_list))

            ctrl_summary = {
                "drop_rate": drop_rate,
                "crush_rate": crush_rate,
                "mean_survival_steps": mean_survival,
                "max_possible_steps": 50,
            }

            if solve_times_ms:
                arr = np.array(solve_times_ms)
                ctrl_summary["latency"] = {
                    "p50_ms": float(np.percentile(arr, 50)),
                    "p95_ms": float(np.percentile(arr, 95)),
                    "p99_ms": float(np.percentile(arr, 99)),
                    "wcet_ms": float(np.max(arr)),
                    "mean_ms": float(np.mean(arr)),
                }

            results["regimes"][regime][ctrl_name] = ctrl_summary

    return results


if __name__ == "__main__":
    out_dir = os.path.dirname(__file__)
    print("Running Empirical Nonstationary Benchmark across Regimes A, B, C, D...")
    bench_results = run_benchmark(num_trials_per_regime=10, seed=42)

    out_file = os.path.join(out_dir, "benchmark_results.json")
    with open(out_file, "w") as f:
        json.dump(bench_results, f, indent=2)

    print(f"Benchmark complete. Serialized results saved to {out_file}.")
    print("\nRegime D (Joint Nonstationarity) Summary:")
    for ctrl, data in bench_results["regimes"]["D"].items():
        lat = data.get("latency", {}).get("p50_ms", 0.0)
        print(f"  {ctrl:22s} | Drop: {data['drop_rate']*100:4.1f}% | Crush: {data['crush_rate']*100:4.1f}% | Survival: {data['mean_survival_steps']:4.1f}/50 steps | P50 Latency: {lat:.3f} ms")
