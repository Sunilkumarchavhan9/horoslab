"""
Multi-Contact Hand and Object Dynamics with Hunt-Crossley Nonlinear Compliant Contact.
"""
from __future__ import annotations

import numpy as np
from typing import Dict, List, Tuple, Optional


class HuntCrossleyContactModel:
    """
    Nonlinear elastomeric Hunt-Crossley contact model.
    F_N = k_n * delta_n^n + chi_n * delta_n^m * dot_delta_n  (for delta_n > 0)
    F_T = min(k_t * delta_t + d_t * dot_delta_t, mu * F_N)
    """

    def __init__(
        self,
        k_n: float = 2000.0,
        chi_n: float = 50.0,
        n: float = 1.2,
        m: float = 1.0,
        k_t: float = 800.0,
        d_t: float = 30.0,
    ):
        self.k_n = float(k_n)
        self.chi_n = float(chi_n)
        self.n = float(n)
        self.m = float(m)
        self.k_t = float(k_t)
        self.d_t = float(d_t)

    def compute_force(
        self,
        delta_n: float,
        dot_delta_n: float,
        delta_t: np.ndarray,
        dot_delta_t: np.ndarray,
        mu: float,
    ) -> Tuple[float, np.ndarray, float]:
        """
        Compute normal force, tangential shear force vector, and slip ratio.
        """
        if delta_n <= 0.0:
            return 0.0, np.zeros(2, dtype=np.float64), 0.0

        # Nonlinear Hunt-Crossley normal force
        fn_elastic = self.k_n * (delta_n ** self.n)
        fn_damping = self.chi_n * (delta_n ** self.m) * dot_delta_n
        f_n = max(0.0, fn_elastic + fn_damping)

        if f_n <= 1e-6:
            return 0.0, np.zeros(2, dtype=np.float64), 0.0

        # Viscoelastic tangential shear force
        f_t_raw = self.k_t * delta_t + self.d_t * dot_delta_t
        f_t_norm = np.linalg.norm(f_t_raw)
        max_tangential = mu * f_n

        if f_t_norm > max_tangential and f_t_norm > 1e-9:
            f_t = (max_tangential / f_t_norm) * f_t_raw
            slip_ratio = 1.0
        else:
            f_t = f_t_raw
            slip_ratio = f_t_norm / (max_tangential + 1e-9)

        return f_n, f_t, float(slip_ratio)

    def compute_stiffness_and_damping(
        self, delta_n: float, dot_delta_n: float
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Compute effective local 3x3 stiffness (K_c) and damping (D_c) matrices.
        Local frame: z-axis is normal, x,y are tangential.
        """
        if delta_n <= 1e-6:
            return np.zeros((3, 3), dtype=np.float64), np.zeros((3, 3), dtype=np.float64)

        # d(F_N)/d(delta_n)
        k_nn = self.k_n * self.n * (delta_n ** (self.n - 1.0))
        if self.m >= 1.0:
            k_nn += self.chi_n * self.m * (delta_n ** (self.m - 1.0)) * dot_delta_n
        k_nn = max(10.0, k_nn)

        # d(F_N)/d(dot_delta_n)
        d_nn = self.chi_n * (delta_n ** self.m)
        d_nn = max(1.0, d_nn)

        K_c = np.diag([self.k_t, self.k_t, k_nn])
        D_c = np.diag([self.d_t, self.d_t, d_nn])
        return K_c, D_c


class MultiContactHandDynamics:
    """
    Kinematics and Jacobians for an M-fingered anthropomorphic / dexterous hand.
    Configured by default for an Allegro-type 16-DoF 4-fingered hand (4 joints x 4 fingers).
    """

    def __init__(self, num_fingers: int = 4, joints_per_finger: int = 4):
        self.num_fingers = num_fingers
        self.joints_per_finger = joints_per_finger
        self.n_q = num_fingers * joints_per_finger

        # Base finger root mounting positions in palm frame (meters)
        self.finger_bases = np.array([
            [0.05,  0.03, 0.0],   # Index
            [0.05,  0.00, 0.0],   # Middle
            [0.05, -0.03, 0.0],   # Ring / Pinky
            [-0.02, 0.04, -0.02], # Thumb
        ], dtype=np.float64)

        # Link lengths per finger (meters): proximal, intermediate, distal
        self.link_lengths = np.array([0.054, 0.038, 0.025], dtype=np.float64)

    def forward_kinematics(self, q: np.ndarray) -> List[np.ndarray]:
        """
        Compute spatial positions p_{c, i} of each fingertip contact in palm frame.
        """
        assert len(q) == self.n_q
        contact_positions = []
        for i in range(self.num_fingers):
            idx = i * self.joints_per_finger
            q_f = q[idx : idx + self.joints_per_finger]
            base = self.finger_bases[i]

            # Planar / spatial kinematics approximation for multi-link finger
            th1, th2, th3, th4 = q_f[0], q_f[1], q_f[2], q_f[3]
            # Yaw rotation around z
            r_yaw = np.array([
                [np.cos(th1), -np.sin(th1), 0.0],
                [np.sin(th1),  np.cos(th1), 0.0],
                [0.0,          0.0,         1.0]
            ])
            # Pitch displacement in x-z plane
            l1, l2, l3 = self.link_lengths
            x_pitch = l1 * np.cos(th2) + l2 * np.cos(th2 + th3) + l3 * np.cos(th2 + th3 + th4)
            z_pitch = -(l1 * np.sin(th2) + l2 * np.sin(th2 + th3) + l3 * np.sin(th2 + th3 + th4))
            p_local = np.array([x_pitch, 0.0, z_pitch])
            p_finger = base + r_yaw @ p_local
            contact_positions.append(p_finger)

        return contact_positions

    def contact_jacobians(self, q: np.ndarray) -> List[np.ndarray]:
        """
        Compute contact point Jacobians J_{c, i}(q) in R^{3 x n_q} via analytical/finite difference.
        """
        contact_positions = self.forward_kinematics(q)
        jacobians = []
        eps = 1e-6
        for i in range(self.num_fingers):
            J_i = np.zeros((3, self.n_q), dtype=np.float64)
            p0 = contact_positions[i]
            # Perturb each joint of finger i
            idx_start = i * self.joints_per_finger
            for j in range(self.joints_per_finger):
                q_pert = q.copy()
                q_pert[idx_start + j] += eps
                p_pert = self.forward_kinematics(q_pert)[i]
                J_i[:, idx_start + j] = (p_pert - p0) / eps
            jacobians.append(J_i)
        return jacobians


class ObjectSpatialDynamics:
    """
    Rigid-body spatial dynamics and grasp matrix computation for manipulated object.
    """

    def __init__(self, nominal_mass: float = 0.40, nominal_inertia: Optional[np.ndarray] = None):
        self.mass = float(nominal_mass)
        if nominal_inertia is None:
            # Cylinder / prism approximation: diag(0.002, 0.002, 0.001) kg m^2
            self.inertia = np.diag([0.0025, 0.0025, 0.0015]).astype(np.float64)
        else:
            self.inertia = np.array(nominal_inertia, dtype=np.float64)
        self.gravity = np.array([0.0, 0.0, -9.81], dtype=np.float64)

    @staticmethod
    def skew_symmetric(r: np.ndarray) -> np.ndarray:
        """Construct 3x3 skew-symmetric matrix [r]_x."""
        return np.array([
            [0.0, -r[2], r[1]],
            [r[2], 0.0, -r[0]],
            [-r[1], r[0], 0.0]
        ], dtype=np.float64)

    def grasp_matrix(self, contact_positions: List[np.ndarray], com: np.ndarray) -> np.ndarray:
        """
        Construct grasp matrix G(q) in R^{6 x 3M}:
        G = [ I_3            ...  I_3
              [p_{c,1}-com]_x ... [p_{c,M}-com]_x ]
        """
        M = len(contact_positions)
        G = np.zeros((6, 3 * M), dtype=np.float64)
        for i, p_c in enumerate(contact_positions):
            r = p_c - com
            G[0:3, 3*i : 3*(i+1)] = np.eye(3, dtype=np.float64)
            G[3:6, 3*i : 3*(i+1)] = self.skew_symmetric(r)
        return G

    def required_wrench(
        self,
        mass: float,
        inertia: np.ndarray,
        v_dot_des: np.ndarray,
        omega: np.ndarray,
        omega_dot_des: np.ndarray,
    ) -> np.ndarray:
        """
        Compute required spatial wrench w_req in R^6 to counteract gravity and track accelerations:
        w_req = [ m * (g - v_dot_des)
                  I * omega_dot_des + omega x (I * omega) ]
        Note: Contact forces on object sum to +F_c, so F_c = m*(v_dot - g) => w_c = G f_c.
        Thus to maintain equilibrium under gravity: sum(F_c) + m*g = m*v_dot => G f_c = m*(v_dot - g) + ...
        We formulate w_req such that G * f_c = w_req satisfies Newton-Euler balance.
        """
        f_req = mass * (v_dot_des - self.gravity)
        tau_req = inertia @ omega_dot_des + np.cross(omega, inertia @ omega)
        return np.concatenate([f_req, tau_req])

