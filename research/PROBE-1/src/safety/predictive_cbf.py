"""
Robust Discrete-Time Predictive Control Barrier Functions (p-CBF) with Object-Level Wrench Feasibility.
"""
from __future__ import annotations

import numpy as np
from typing import List, Tuple, Dict
from .friction_cone import PolyhedralFrictionCone


class DiscreteTimePredictiveCBF:
    """
    Constructs discrete-time p-CBF constraints for multi-fingered grasping:
    1. Polyhedral anti-slip friction cone constraints (8 facets per finger)
    2. Maximum normal force crush limits (anti-damage)
    3. Minimum normal force contact maintenance limits
    4. Object-level grasp wrench spatial balance G * f_c = w_req
    """

    def __init__(
        self,
        num_fingers: int = 4,
        f_min: float = 1.0,
        f_max: float = 18.0,
        gamma_slip: float = 0.20,
        gamma_force: float = 0.20,
    ):
        self.num_fingers = num_fingers
        self.f_min = float(f_min)
        self.f_max = float(f_max)
        self.gamma_slip = float(gamma_slip)
        self.gamma_force = float(gamma_force)
        self.friction_cone = PolyhedralFrictionCone(n_sides=8)

    def build_qp_matrices(
        self,
        lambdas: List[np.ndarray],           # List of R^{3 x n_q}
        biases: List[np.ndarray],            # List of R^3
        normals: List[np.ndarray],           # List of R^3
        mu_calibrated: List[float],          # Lower calibrated friction interval
        f_c_current: List[np.ndarray],       # Current contact forces R^3
        G_grasp: np.ndarray,                 # Grasp matrix R^{6 x 3M}
        w_req: np.ndarray,                   # Required spatial wrench R^6
        u_min: np.ndarray,                   # Joint accel lower bound
        u_max: np.ndarray,                   # Joint accel upper bound
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """
        Builds affine inequality A_ineq @ u <= b_ineq and equality A_eq @ u = b_eq.
        
        Variables:
            u in R^{n_q}
        Returns:
            A_ineq, b_ineq, A_eq, b_eq
        """
        n_q = lambdas[0].shape[1]
        M = self.num_fingers

        A_ineq_rows = []
        b_ineq_rows = []

        # 1. Anti-slip polyhedral constraints (8 per finger = 32 constraints)
        for i in range(M):
            Lambda_i = lambdas[i]
            bias_i = biases[i]
            n_i = normals[i] / (np.linalg.norm(normals[i]) + 1e-12)
            mu_i = mu_calibrated[i]

            A_cone, _ = self.friction_cone.get_linear_constraints(n_i, mu_i)
            # A_cone @ f_{c, i}(k+1) <= (1 - gamma_slip) * max(0, A_cone @ f_{c, i}(k))
            # f_{c, i}(k+1) = Lambda_i @ u + bias_i
            # => (A_cone @ Lambda_i) @ u <= (1 - gamma_slip) * p_curr - A_cone @ bias_i
            p_curr = np.minimum(0.0, A_cone @ f_c_current[i])  # <= 0 when safe
            rhs_slip = (1.0 - self.gamma_slip) * p_curr - (A_cone @ bias_i)

            A_ineq_rows.append(A_cone @ Lambda_i)
            b_ineq_rows.append(rhs_slip)

            # 2. Maximum normal crush force constraint: n_i^T f_{c, i}(k+1) <= F_max
            # n_i^T Lambda_i u <= F_max - n_i^T bias_i
            A_crush = n_i.reshape(1, 3) @ Lambda_i
            b_crush = np.array([self.f_max - float(np.dot(n_i, bias_i))])
            A_ineq_rows.append(A_crush)
            b_ineq_rows.append(b_crush)

            # 3. Minimum normal contact force constraint: -n_i^T f_{c, i}(k+1) <= -F_min
            # -n_i^T Lambda_i u <= -F_min + n_i^T bias_i
            A_contact = -n_i.reshape(1, 3) @ Lambda_i
            b_contact = np.array([-self.f_min + float(np.dot(n_i, bias_i))])
            A_ineq_rows.append(A_contact)
            b_ineq_rows.append(b_contact)

        # 4. Joint acceleration physical limits: u <= u_max, -u <= -u_min
        I_nq = np.eye(n_q, dtype=np.float64)
        A_ineq_rows.append(I_nq)
        b_ineq_rows.append(u_max)
        A_ineq_rows.append(-I_nq)
        b_ineq_rows.append(-u_min)

        A_ineq = np.vstack(A_ineq_rows)
        b_ineq = np.concatenate(b_ineq_rows)

        # 5. Object-level grasp wrench equality: G @ f_c(k+1) = w_req
        # Stacking Lambda and biases across all fingers
        Lambda_stacked = np.vstack(lambdas)        # R^{3M x n_q}
        bias_stacked = np.concatenate(biases)      # R^{3M}

        A_eq = G_grasp @ Lambda_stacked            # R^{6 x n_q}
        b_eq = w_req - G_grasp @ bias_stacked      # R^6

        return A_ineq, b_ineq, A_eq, b_eq

