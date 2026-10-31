"""
Real-Time Quadratic Program Predictive Safety Filter with Four-State Decision Machine.
"""
from __future__ import annotations

import enum
import time
import numpy as np
import scipy.sparse as sp
import osqp
from typing import Tuple, Dict, Any, List, Optional
from control.fallback import PassiveImpedanceFallback


class SafetyFilterState(enum.Enum):
    NOMINAL_SAFE = "NOMINAL_SAFE"
    EMERGENCY_RELAXED = "EMERGENCY_RELAXED"
    CRITICAL_FAIL = "CRITICAL_FAIL"
    TIMEOUT = "TIMEOUT"


class PredictiveSafetyFilter:
    """
    Real-Time 8-Sided Polyhedral QP Safety Filter with Soft Slack Variables and Passive Fallback.
    Solves:
      min_{u, delta_s, delta_w} 0.5 * ||u - u_nom||_W^2 + 0.5 * rho_s * ||delta_s||^2 + 0.5 * rho_w * ||delta_w||^2
    Subject to:
      A_ineq * u - delta_s <= b_ineq
      A_eq * u - delta_w = b_eq
      delta_s >= 0
    """

    def __init__(
        self,
        n_q: int = 16,
        slack_penalty: float = 1e5,
        wrench_slack_penalty: float = 1e4,
        slack_threshold: float = 1e-4,
        max_relax_steps: int = 2,
        watchdog_timeout_ms: float = 10.0,
    ):
        self.n_q = n_q
        self.rho_s = float(slack_penalty)
        self.rho_w = float(wrench_slack_penalty)
        self.slack_threshold = float(slack_threshold)
        self.max_relax_steps = max_relax_steps
        self.watchdog_timeout_ms = float(watchdog_timeout_ms)

        self.consecutive_relax_count = 0
        self.fallback = PassiveImpedanceFallback(n_q=n_q)

        # Performance timing ledger
        self.solve_times_ms: List[float] = []
        self.solver_c_times_ms: List[float] = []
        self.state_history: List[SafetyFilterState] = []

    def solve(
        self,
        u_nom: np.ndarray,
        dq: np.ndarray,
        A_ineq: np.ndarray,
        b_ineq: np.ndarray,
        A_eq: np.ndarray,
        b_eq: np.ndarray,
        W_weight: Optional[np.ndarray] = None,
    ) -> Tuple[np.ndarray, SafetyFilterState, Dict[str, Any]]:
        """
        Solves the constrained safety QP within the watchdog budget.
        Returns:
            u_command: Final acceleration command sent to motors (either u* or u_safe)
            state: Controller operational state (NOMINAL_SAFE, EMERGENCY_RELAXED, CRITICAL_FAIL, TIMEOUT)
            metrics: Performance metrics (latency, slacks, solver iterations)
        """
        t0 = time.perf_counter()

        n_q = self.n_q
        n_ineq = A_ineq.shape[0]
        n_eq = A_eq.shape[0]

        if W_weight is None:
            W = np.eye(n_q, dtype=np.float64)
        else:
            W = W_weight

        # Decision variables: z = [ u (n_q), delta_s (n_ineq), delta_w (n_eq) ]
        n_vars = n_q + n_ineq + n_eq

        # Quadratic objective: 0.5 * z^T P z + q_obj^T z
        P_diag = np.concatenate([
            np.diag(W),
            self.rho_s * np.ones(n_ineq, dtype=np.float64),
            self.rho_w * np.ones(n_eq, dtype=np.float64),
        ])
        P = sp.diags(P_diag, format="csc")

        q_obj = np.concatenate([
            -W @ u_nom,
            np.zeros(n_ineq + n_eq, dtype=np.float64)
        ])

        # Constraints in OSQP format: l <= A_osqp * z <= u_osqp
        # 1. A_ineq * u - delta_s <= b_ineq  =>  -inf <= A_ineq * u - delta_s <= b_ineq
        # 2. A_eq * u - delta_w = b_eq        =>  b_eq <= A_eq * u - delta_w <= b_eq
        # 3. delta_s >= 0                     =>  0 <= delta_s <= +inf

        A1 = sp.hstack([
            sp.csc_matrix(A_ineq),
            -sp.eye(n_ineq, format="csc"),
            sp.csc_matrix((n_ineq, n_eq))
        ], format="csc")
        l1 = np.full(n_ineq, -np.inf, dtype=np.float64)
        u1 = b_ineq

        A2 = sp.hstack([
            sp.csc_matrix(A_eq),
            sp.csc_matrix((n_eq, n_ineq)),
            -sp.eye(n_eq, format="csc")
        ], format="csc")
        l2 = b_eq
        u2 = b_eq

        A3 = sp.hstack([
            sp.csc_matrix((n_ineq, n_q)),
            sp.eye(n_ineq, format="csc"),
            sp.csc_matrix((n_ineq, n_eq))
        ], format="csc")
        l3 = np.zeros(n_ineq, dtype=np.float64)
        u3 = np.full(n_ineq, np.inf, dtype=np.float64)

        A_osqp = sp.vstack([A1, A2, A3], format="csc")
        l_osqp = np.concatenate([l1, l2, l3])
        u_osqp = np.concatenate([u1, u2, u3])

        # Setup OSQP solver
        solver = osqp.OSQP()
        solver.setup(
            P=P,
            q=q_obj,
            A=A_osqp,
            l=l_osqp,
            u=u_osqp,
            verbose=False,
            eps_abs=1e-3,
            eps_rel=1e-3,
            max_iter=1000,
            adaptive_rho=True,
            check_termination=10,
        )

        res = solver.solve()
        t1 = time.perf_counter()
        solve_time_ms = (t1 - t0) * 1000.0
        c_time_ms = float(res.info.run_time * 1000.0) if hasattr(res.info, "run_time") else solve_time_ms
        self.solve_times_ms.append(solve_time_ms)
        self.solver_c_times_ms.append(c_time_ms)

        # Check Watchdog Deadline
        if solve_time_ms > self.watchdog_timeout_ms:
            u_safe, fb_stats = self.fallback.execute_fallback(dq)
            state = SafetyFilterState.TIMEOUT
            self.state_history.append(state)
            metrics = {
                "solve_time_ms": solve_time_ms,
                "solver_c_time_ms": c_time_ms,
                "status": "timeout",
                "max_slack": 0.0,
                "fallback_stats": fb_stats,
            }
            return u_safe, state, metrics

        # Check Solver Convergence
        if res.info.status != "solved":
            u_safe, fb_stats = self.fallback.execute_fallback(dq)
            state = SafetyFilterState.CRITICAL_FAIL
            self.state_history.append(state)
            metrics = {
                "solve_time_ms": solve_time_ms,
                "status": res.info.status,
                "max_slack": 0.0,
                "fallback_stats": fb_stats,
            }
            return u_safe, state, metrics

        # Extract solution
        z_opt = res.x
        u_opt = z_opt[:n_q]
        delta_s_opt = z_opt[n_q : n_q + n_ineq]
        delta_w_opt = z_opt[n_q + n_ineq :]

        max_slack = float(np.max(delta_s_opt))

        # Evaluate safety state machine
        if max_slack > self.slack_threshold:
            self.consecutive_relax_count += 1
            if self.consecutive_relax_count > self.max_relax_steps:
                # Emergency relaxation exceeded allowed cycles -> Trigger fallback
                u_safe, fb_stats = self.fallback.execute_fallback(dq)
                state = SafetyFilterState.CRITICAL_FAIL
                self.state_history.append(state)
                metrics = {
                    "solve_time_ms": solve_time_ms,
                    "status": "relaxation_limit_exceeded",
                    "max_slack": max_slack,
                    "fallback_stats": fb_stats,
                }
                return u_safe, state, metrics
            else:
                state = SafetyFilterState.EMERGENCY_RELAXED
        else:
            self.consecutive_relax_count = 0
            state = SafetyFilterState.NOMINAL_SAFE

        self.state_history.append(state)
        metrics = {
            "solve_time_ms": solve_time_ms,
            "solver_c_time_ms": c_time_ms,
            "status": res.info.status,
            "max_slack": max_slack,
            "wrench_residual_norm": float(np.linalg.norm(delta_w_opt)),
            "iterations": res.info.iter,
        }
        return u_opt, state, metrics

    def get_timing_statistics(self) -> Dict[str, float]:
        """Compute P50, P95, P99, P99.9, and WCET statistics."""
        if not self.solve_times_ms:
            return {}
        arr = np.array(self.solve_times_ms)
        c_arr = np.array(self.solver_c_times_ms)
        return {
            "p50_ms": float(np.percentile(arr, 50)),
            "p95_ms": float(np.percentile(arr, 95)),
            "p99_ms": float(np.percentile(arr, 99)),
            "p99_9_ms": float(np.percentile(arr, 99.9)),
            "wcet_ms": float(np.max(arr)),
            "mean_ms": float(np.mean(arr)),
            "solver_c_p50_ms": float(np.percentile(c_arr, 50)),
            "solver_c_wcet_ms": float(np.max(c_arr)),
            "sample_count": len(arr),
        }
