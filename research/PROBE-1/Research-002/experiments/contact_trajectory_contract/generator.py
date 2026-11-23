"""Single-contact rollouts from the frozen Contact Physics v2 kernel.

This module imports the kernel. It does not reimplement Hertz, Cattaneo-Mindlin,
or LuGre, and it does not call CompliantPreLiftContactEnv.
"""

from __future__ import annotations

import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import List, Sequence

import numpy as np

from .provenance import KERNEL_PACKAGE, compare_kernel_hashes
from .schema import (
    FIXTURE_CONFIGS,
    LOCKED_SEED_INTERVALS,
    OBSERVABLE_CHANNELS,
    OBSERVABLE_COLUMN,
    TrajectoryConfig,
)


REGISTRY_PATH = (
    Path(__file__).resolve().parents[1]
    / "stage3_production_readiness"
    / "stage3_3_seed_registry.json"
)


class SeedAllocationError(ValueError):
    """Raised when a caller tries to use a locked production, reserve, or pilot seed."""


class DomainRejection(ValueError):
    """Raised when the frozen kernel rejects the step under require_valid_domain."""


@dataclass(frozen=True)
class GeneratedEpisode:
    config: TrajectoryConfig
    observable: np.ndarray
    commanded_velocity: np.ndarray
    normal_force: np.ndarray
    tangential_force: np.ndarray
    tangential_displacement: np.ndarray
    slip_speed: np.ndarray
    applied_velocity: np.ndarray
    stick_radius: np.ndarray
    bristle_deflection: np.ndarray
    is_gross_slipping: np.ndarray
    regime: tuple
    gross_slip_index: int
    kernel_hashes: dict
    kernel_hash_comparison: dict
    normal_indentation_m: float
    contact_radius_m: float


def assert_research_seed(seed: int, registry_path: Path = REGISTRY_PATH) -> None:
    """Refuse production slots, reserve seeds, pilot seeds, and prior diagnostic bands."""

    seed = int(seed)
    for low, high in LOCKED_SEED_INTERVALS:
        if low <= seed <= high:
            raise SeedAllocationError(
                f"Seed {seed} falls in locked interval [{low}, {high}]"
            )
    if not registry_path.is_file():
        raise FileNotFoundError(f"Seed registry is missing: {registry_path}")
    registry = json.loads(registry_path.read_text(encoding="utf-8"))
    allocated = _collect_registry_seeds(registry)
    if seed in allocated:
        raise SeedAllocationError(f"Seed {seed} is present in {registry_path.name}")


def generate_episode(config: TrajectoryConfig, *, check_seed: bool = True) -> GeneratedEpisode:
    """Roll one spherical or rejection geometry until the first gross-slip sample.

    ``require_valid_domain=False`` is required to keep the gross-slip sample.
    The frozen kernel raises ValueError on spherical gross slip when that flag
    is true (see LuGreModel.step_composed_hybrid). That flag is still the
    mechanism for the domain-rejection test.
    """

    if check_seed:
        assert_research_seed(config.seed)
    hash_comparison = compare_kernel_hashes()
    hashes = hash_comparison["working_tree_sha256"]
    kernel = _load_kernel()

    pair = kernel.create_silicone_aluminum_pair(
        mu_static=config.mu_static,
        mu_kinetic=config.mu_kinetic,
    )
    geometry = _make_geometry(kernel, config)
    normal_model = kernel.NormalContactModel(geometry, pair)
    indentation, radius, _stiffness = normal_model.compute_indentation_from_force(config.normal_force_n)
    if radius <= 0.0 or config.normal_force_n <= 0.0:
        raise DomainRejection("Normal contact did not establish a positive contact radius")

    cm_model = kernel.CattaneoMindlinModel(geometry, pair)
    lugre = kernel.LuGreModel(pair)
    cm_state = kernel.ContactState(
        in_contact=True,
        normal_force=config.normal_force_n,
        contact_radius=radius,
        normal_indentation=indentation,
    )
    lugre_state = kernel.ContactState(
        in_contact=True,
        normal_force=config.normal_force_n,
        contact_radius=radius,
        normal_indentation=indentation,
    )

    commanded: List[float] = []
    normal_force: List[float] = []
    tangential_force: List[float] = []
    displacement: List[float] = []
    slip_speed: List[float] = []
    applied: List[float] = []
    stick_radius: List[float] = []
    bristle: List[float] = []
    gross: List[bool] = []
    regime: List[str] = []

    try:
        for _step in range(int(config.max_steps)):
            total_force, applied_velocity = lugre.step_hybrid_synchronized(
                cm_model,
                cm_state,
                lugre_state,
                float(config.commanded_velocity_m_s),
                float(config.dt_s),
                geometry,
                enforce_passivity_envelope=True,
                require_valid_domain=bool(config.require_valid_domain),
            )
            commanded.append(float(config.commanded_velocity_m_s))
            normal_force.append(float(lugre_state.normal_force))
            tangential_force.append(float(total_force))
            displacement.append(float(cm_state.tangential_displacement))
            slip_speed.append(float(cm_state.slip_velocity))
            applied.append(float(applied_velocity))
            stick_radius.append(float(cm_state.stick_radius))
            bristle.append(float(lugre_state.bristle_deflection))
            is_gross = bool(cm_state.is_gross_slipping)
            gross.append(is_gross)
            regime.append(_regime(is_gross, cm_state.slip_velocity))
            if is_gross:
                break
        else:
            raise RuntimeError(
                f"Gross slip was not reached within {config.max_steps} steps "
                f"for seed {config.seed}"
            )
    except ValueError as error:
        raise DomainRejection(str(error)) from error

    observable = np.column_stack(
        [
            np.asarray(commanded, dtype=np.float64),
            np.asarray(normal_force, dtype=np.float64),
            np.asarray(tangential_force, dtype=np.float64),
            np.asarray(displacement, dtype=np.float64),
            np.asarray(slip_speed, dtype=np.float64),
        ]
    )
    if observable.shape[1] != len(OBSERVABLE_CHANNELS):
        raise RuntimeError("Observable channel count drifted from the schema")
    gross_index = int(np.flatnonzero(np.asarray(gross, dtype=bool))[0])
    return GeneratedEpisode(
        config=config,
        observable=observable,
        commanded_velocity=observable[:, OBSERVABLE_COLUMN["commanded_velocity"]],
        normal_force=observable[:, OBSERVABLE_COLUMN["normal_force"]],
        tangential_force=observable[:, OBSERVABLE_COLUMN["tangential_force"]],
        tangential_displacement=observable[:, OBSERVABLE_COLUMN["tangential_displacement"]],
        slip_speed=observable[:, OBSERVABLE_COLUMN["slip_speed"]],
        applied_velocity=np.asarray(applied, dtype=np.float64),
        stick_radius=np.asarray(stick_radius, dtype=np.float64),
        bristle_deflection=np.asarray(bristle, dtype=np.float64),
        is_gross_slipping=np.asarray(gross, dtype=bool),
        regime=tuple(regime),
        gross_slip_index=gross_index,
        kernel_hashes=hashes,
        kernel_hash_comparison=hash_comparison,
        normal_indentation_m=float(indentation),
        contact_radius_m=float(radius),
    )


def default_fixture_configs() -> Sequence[TrajectoryConfig]:
    return FIXTURE_CONFIGS


def _regime(is_gross: bool, slip_velocity: float) -> str:
    if is_gross:
        return "gross_slip"
    if slip_velocity > 0.0:
        return "partial_slip"
    return "sticking"


def _make_geometry(kernel: object, config: TrajectoryConfig):
    if config.geometry == "spherical":
        return kernel.SphericalContact(radius=float(config.radius_m))
    if config.geometry == "rounded_punch":
        return kernel.FlatPunchContact(
            punch_radius=float(config.punch_radius_m),
            corner_radius=float(config.corner_radius_m),
        )
    raise ValueError(f"Unsupported geometry {config.geometry!r}")


def _load_kernel():
    root = str(KERNEL_PACKAGE)
    if root not in sys.path:
        sys.path.insert(0, root)
    from contact.cattaneo_mindlin import CattaneoMindlinModel
    from contact.contact_state import ContactState
    from contact.geometry import FlatPunchContact, SphericalContact
    from contact.lugre import LuGreModel
    from contact.material import create_silicone_aluminum_pair
    from contact.normal_contact import NormalContactModel

    class _Kernel:
        pass

    kernel = _Kernel()
    kernel.CattaneoMindlinModel = CattaneoMindlinModel
    kernel.ContactState = ContactState
    kernel.FlatPunchContact = FlatPunchContact
    kernel.SphericalContact = SphericalContact
    kernel.LuGreModel = LuGreModel
    kernel.create_silicone_aluminum_pair = create_silicone_aluminum_pair
    kernel.NormalContactModel = NormalContactModel
    return kernel


def _collect_registry_seeds(node: object) -> set:
    found: set = set()

    def walk(value: object) -> None:
        if isinstance(value, dict):
            seed = value.get("seed")
            if isinstance(seed, int) and not isinstance(seed, bool):
                found.add(seed)
            for child in value.values():
                walk(child)
        elif isinstance(value, list):
            if len(value) == 2 and all(isinstance(item, int) and not isinstance(item, bool) for item in value):
                low, high = int(value[0]), int(value[1])
                if 0 < high - low <= 5000:
                    found.update(range(low, high + 1))
            for child in value:
                walk(child)

    walk(node)
    return found

