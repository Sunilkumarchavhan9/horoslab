"""
HOROS PROBE-1 — Phase 5 Task 3 (P5-T3)
N-Contact Generalization & Cooperative Physical Intelligence
File: contact_topology.py

Implements generalized N-contact topology representations, geometric contact points,
and the grasp wrench matrix G mapping contact normal and tangential forces to the 
shared 2D object wrench.
"""

import math
import numpy as np
from dataclasses import dataclass, field
from typing import List, Tuple, Dict, Any, Optional

import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
RESEARCH_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))
CP_V2_DIR = os.path.abspath(os.path.join(RESEARCH_DIR, "experiments", "contact_physics_v2"))

for p in (CURRENT_DIR, RESEARCH_DIR, CP_V2_DIR):
    if p not in sys.path:
        sys.path.insert(0, p)

from contact.geometry import SphericalContact
from contact.material import create_silicone_aluminum_pair, FrictionPair


@dataclass
class ContactPoint:
    """Represents an individual physical contact point on the workpiece surface."""
    contact_id: int
    pos_rel: np.ndarray             # [rx, ry] relative to object center of mass (in object frame)
    normal: np.ndarray              # [nx, ny] inward unit normal in object frame
    tangent: np.ndarray             # [tx, ty] unit tangent in object frame (tx = -ny, ty = nx)
    fingertip_radius: float = 0.015 # 15 mm default radius
    mu_static: float = 0.55         # Static friction coefficient
    mu_kinetic: float = 0.4675      # Kinetic friction coefficient (0.85 * mu_s)
    youngs_modulus_star: float = 1.589e6 # Silicone-aluminum equivalent E*
    shear_modulus_star: float = 2.667e5  # Silicone-aluminum equivalent G*
    is_active: bool = True          # Contact validity status (False if finger lost contact)

    def world_position(self, obj_pos: np.ndarray, theta: float) -> np.ndarray:
        """Computes contact position in world coordinates."""
        cos_t = math.cos(theta)
        sin_t = math.sin(theta)
        rot = np.array([[cos_t, -sin_t], [sin_t, cos_t]])
        return obj_pos + rot @ self.pos_rel

    def world_normal(self, theta: float) -> np.ndarray:
        """Computes inward contact normal in world coordinates."""
        cos_t = math.cos(theta)
        sin_t = math.sin(theta)
        rot = np.array([[cos_t, -sin_t], [sin_t, cos_t]])
        return rot @ self.normal

    def world_tangent(self, theta: float) -> np.ndarray:
        """Computes contact tangent in world coordinates."""
        cos_t = math.cos(theta)
        sin_t = math.sin(theta)
        rot = np.array([[cos_t, -sin_t], [sin_t, cos_t]])
        return rot @ self.tangent


class ContactTopology:
    """
    Manages an arbitrary N-contact grasping topology on a 2D planar workpiece.
    Supports N = 3, 4, 5, or higher contact topologies.
    """

    def __init__(
        self,
        contacts: List[ContactPoint],
        object_mass: float = 0.50,
        object_radius: float = 0.040,   # 40 mm radius disk/polygon
        object_height: float = 0.080,   # 80 mm height
    ):
        self.contacts = contacts
        self.num_contacts = len(contacts)
        self.m_obj = float(object_mass)
        self.r_obj = float(object_radius)
        self.h_obj = float(object_height)
        # Moment of inertia for uniform circular disk about CM: I = 0.5 * m * r^2
        self.I_obj = float(0.5 * self.m_obj * (self.r_obj ** 2))

    def get_grasp_matrix(self, theta: float = 0.0) -> np.ndarray:
        """
        Constructs the 3 x (2N) grasp matrix G(theta) relating contact forces to object wrench:
            W_obj = G(theta) * [Fn_1, Ft_1, Fn_2, Ft_2, ...]^T
        where W_obj = [F_x, F_y, tau_z]^T.
        """
        G = np.zeros((3, 2 * self.num_contacts))
        cos_t = math.cos(theta)
        sin_t = math.sin(theta)
        rot = np.array([[cos_t, -sin_t], [sin_t, cos_t]])

        for i, cp in enumerate(self.contacts):
            if not cp.is_active:
                continue
            r_w = rot @ cp.pos_rel
            n_w = rot @ cp.normal
            t_w = rot @ cp.tangent

            col_n = 2 * i
            col_t = 2 * i + 1

            # Normal force contribution: Fn * n_w
            G[0, col_n] = n_w[0]
            G[1, col_n] = n_w[1]
            G[2, col_n] = r_w[0] * n_w[1] - r_w[1] * n_w[0]

            # Tangential force contribution: - Ft * t_w (friction opposes relative slip)
            G[0, col_t] = - t_w[0]
            G[1, col_t] = - t_w[1]
            G[2, col_t] = - (r_w[0] * t_w[1] - r_w[1] * t_w[0])

        return G

    @classmethod
    def create_symmetric_radial(
        cls,
        num_contacts: int,
        object_radius: float = 0.040,
        object_mass: float = 0.50,
        mu_static: float = 0.55,
        fingertip_radius: float = 0.015,
    ) -> "ContactTopology":
        """
        Creates a symmetric radial contact topology with N contacts evenly spaced at 2*pi/N.
        For example:
          - N = 3: 0, 120, 240 degrees
          - N = 4: 0, 90, 180, 270 degrees
          - N = 5: 0, 72, 144, 216, 288 degrees
        """
        contacts = []
        d_phi = 2.0 * math.pi / float(num_contacts)

        for i in range(num_contacts):
            phi = float(i) * d_phi
            # Position on surface of disk
            pos = np.array([object_radius * math.cos(phi), object_radius * math.sin(phi)])
            # Inward normal points toward center: [-cos(phi), -sin(phi)]
            normal = np.array([-math.cos(phi), -math.sin(phi)])
            # Tangent perpendicular to normal: counter-clockwise
            tangent = np.array([-math.sin(phi), math.cos(phi)])

            pair = create_silicone_aluminum_pair(mu_static=mu_static, mu_kinetic=0.85 * mu_static)

            contacts.append(ContactPoint(
                contact_id=i,
                pos_rel=pos,
                normal=normal,
                tangent=tangent,
                fingertip_radius=fingertip_radius,
                mu_static=mu_static,
                mu_kinetic=0.85 * mu_static,
                youngs_modulus_star=pair.equivalent_youngs_modulus,
                shear_modulus_star=pair.equivalent_shear_modulus,
                is_active=True,
            ))

        return cls(contacts=contacts, object_mass=object_mass, object_radius=object_radius)

    @classmethod
    def create_asymmetric_radial(
        cls,
        angles_deg: List[float],
        object_radius: float = 0.040,
        object_mass: float = 0.50,
        mu_list: Optional[List[float]] = None,
        radii_list: Optional[List[float]] = None,
    ) -> "ContactTopology":
        """
        Creates an asymmetric radial topology with arbitrary contact angles and per-contact material/geometry.
        """
        contacts = []
        n = len(angles_deg)
        if mu_list is None:
            mu_list = [0.55] * n
        if radii_list is None:
            radii_list = [0.015] * n

        for i, angle in enumerate(angles_deg):
            phi = math.radians(angle)
            pos = np.array([object_radius * math.cos(phi), object_radius * math.sin(phi)])
            normal = np.array([-math.cos(phi), -math.sin(phi)])
            tangent = np.array([-math.sin(phi), math.cos(phi)])

            mu = mu_list[i]
            pair = create_silicone_aluminum_pair(mu_static=mu, mu_kinetic=0.85 * mu)

            contacts.append(ContactPoint(
                contact_id=i,
                pos_rel=pos,
                normal=normal,
                tangent=tangent,
                fingertip_radius=radii_list[i],
                mu_static=mu,
                mu_kinetic=0.85 * mu,
                youngs_modulus_star=pair.equivalent_youngs_modulus,
                shear_modulus_star=pair.equivalent_shear_modulus,
                is_active=True,
            ))

        return cls(contacts=contacts, object_mass=object_mass, object_radius=object_radius)
