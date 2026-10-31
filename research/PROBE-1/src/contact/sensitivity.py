"""
Action-Dependent Contact Force Sensitivity and Forward Prediction.
"""
from __future__ import annotations

import numpy as np
from typing import List, Tuple
from .dynamics import HuntCrossleyContactModel, MultiContactHandDynamics


class ContactForceSensitivity:
    """
    Computes affine action-dependent sensitivity mapping:
    f_{c, i}(k+1) = Lambda_i(q_k) * u_k + f_{c, i}^{bias}(x_k, theta_k)
    where u_k = ddot{q}_k (joint acceleration).
    """

    def __init__(self, hand_dynamics: MultiContactHandDynamics, contact_model: HuntCrossleyContactModel, dt: float = 0.01):
        self.hand = hand_dynamics
        self.contact_model = contact_model
        self.dt = float(dt)

    def compute_sensitivity_and_bias(
        self,
        q: np.ndarray,
        dq: np.ndarray,
        f_c_current: List[np.ndarray],
        v_obj: List[np.ndarray],
        penetrations: List[float],
        penetration_rates: List[float],
    ) -> Tuple[List[np.ndarray], List[np.ndarray]]:
        """
        Compute Lambda_i and f_{c, i}^bias for each fingertip.
        Lambda_i in R^{3 x n_q}, f_{bias} in R^3.
        """
        jacobians = self.hand.contact_jacobians(q)
        lambdas = []
        biases = []

        dt = self.dt
        for i in range(self.hand.num_fingers):
            J_i = jacobians[i]
            delta_n = penetrations[i]
            dot_delta_n = penetration_rates[i]

            K_c, D_c = self.contact_model.compute_stiffness_and_damping(delta_n, dot_delta_n)

            # Combined sensitivity accounting for position update (0.5*dt^2) and velocity update (dt)
            effective_gain = 0.5 * (dt ** 2) * K_c + dt * D_c
            Lambda_i = effective_gain @ J_i

            # Bias term: f(k) + dt * K_c * J_i * dq - dt * K_c * v_obj
            v_finger = J_i @ dq
            f_bias = f_c_current[i] + dt * (K_c @ (v_finger - v_obj[i]))

            lambdas.append(Lambda_i)
            biases.append(f_bias)

        return lambdas, biases

    def predict_forces(
        self,
        u: np.ndarray,
        lambdas: List[np.ndarray],
        biases: List[np.ndarray],
    ) -> List[np.ndarray]:
        """
        Predict contact forces f_{c, i}(k+1) for given candidate acceleration u.
        """
        predicted = []
        for i in range(len(lambdas)):
            f_pred = lambdas[i] @ u + biases[i]
            predicted.append(f_pred)
        return predicted

    def finite_difference_check(
        self,
        q: np.ndarray,
        dq: np.ndarray,
        u_nom: np.ndarray,
        f_c_current: List[np.ndarray],
        v_obj: List[np.ndarray],
        penetrations: List[float],
        penetration_rates: List[float],
        eps: float = 1e-5,
    ) -> float:
        """
        Validate sensitivity Lambda_i against numerical finite difference:
        d(f_{c, i}(k+1)) / du_j approx (f(u + eps*e_j) - f(u - eps*e_j)) / (2*eps).
        Returns maximum absolute difference across all contact components and joints.
        """
        lambdas, biases = self.compute_sensitivity_and_bias(
            q, dq, f_c_current, v_obj, penetrations, penetration_rates
        )

        max_err = 0.0
        n_q = len(q)

        for i in range(self.hand.num_fingers):
            Lambda_ana = lambdas[i]
            Lambda_num = np.zeros_like(Lambda_ana)

            for j in range(n_q):
                u_plus = u_nom.copy()
                u_plus[j] += eps
                f_plus = self.predict_forces(u_plus, lambdas, biases)[i]

                u_minus = u_nom.copy()
                u_minus[j] -= eps
                f_minus = self.predict_forces(u_minus, lambdas, biases)[i]

                grad_num = (f_plus - f_minus) / (2.0 * eps)
                Lambda_num[:, j] = grad_num

            err = np.max(np.abs(Lambda_ana - Lambda_num))
            if err > max_err:
                max_err = err

        return float(max_err)

