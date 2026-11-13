"""Teacher Inference Engine for HOROS Model Teaching Infrastructure.

Provides async/batched querying of teacher models, deterministic response caching,
failure recovery, provenance tracking, and mock/adversarial teacher adapters.
"""

from __future__ import annotations

import hashlib
import json
import os
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np

from teaching.registry import TeacherModelDescriptor, TeacherModelRegistry, TeacherProvider


@dataclass
class TeacherQueryPayload:
    """Standardized input contract for teacher model queries."""
    task_id: str
    query_type: str
    current_state: np.ndarray
    observation_history: Optional[np.ndarray] = None
    text_instruction: str = "Perform compliant manipulation towards task goal."
    target_horizon: int = 20
    seed: int = 42
    request_representations: bool = False

    def compute_payload_hash(self) -> str:
        """Computes deterministic SHA-256 hash of payload query contents."""
        hasher = hashlib.sha256()
        hasher.update(self.task_id.encode("utf-8"))
        hasher.update(self.query_type.encode("utf-8"))
        hasher.update(self.current_state.tobytes())
        if self.observation_history is not None:
            hasher.update(self.observation_history.tobytes())
        hasher.update(self.text_instruction.encode("utf-8"))
        hasher.update(str(self.target_horizon).encode("utf-8"))
        hasher.update(str(self.seed).encode("utf-8"))
        hasher.update(str(self.request_representations).encode("utf-8"))
        return hasher.hexdigest()


@dataclass
class TeacherInferenceResult:
    """Standardized output contract returned by teacher models."""
    model_id: str
    candidate_actions: np.ndarray  # Shape: (H, action_dim)
    predicted_states: Optional[np.ndarray] = None  # Shape: (H, state_dim)
    predicted_modes: Optional[np.ndarray] = None  # Shape: (H,)
    predicted_confidence: float = 1.0
    latent_representations: Optional[np.ndarray] = None  # Shape: (H, rep_dim) or (rep_dim,)
    provenance_hash: str = ""
    cached: bool = False
    latency_ms: float = 0.0


class BaseTeacherAdapter(ABC):
    """Abstract interface for model execution adapters."""

    def __init__(self, descriptor: TeacherModelDescriptor):
        self.descriptor = descriptor

    @abstractmethod
    def infer(self, payload: TeacherQueryPayload) -> TeacherInferenceResult:
        """Executes inference on the underlying teacher model."""
        pass


class DeterministicMockTeacher(BaseTeacherAdapter):
    """Deterministic mock teacher generating smooth, physically plausible candidate actions."""

    def infer(self, payload: TeacherQueryPayload) -> TeacherInferenceResult:
        start_t = time.perf_counter()
        rng = np.random.RandomState(payload.seed)
        action_dim = 5 if payload.task_id == "compliant_prelift" else 6
        H = payload.target_horizon

        # Generate smooth, bounded velocity actions
        base_t = np.linspace(0, 1, H)
        actions = np.zeros((H, action_dim), dtype=np.float32)

        if payload.task_id == "compliant_prelift":
            # [vx, vy, vz, omega, F_grip]
            actions[:, 0] = 0.002 * np.sin(2 * np.pi * base_t) + rng.normal(0, 0.0005, H)
            actions[:, 1] = 0.001 * np.cos(2 * np.pi * base_t) + rng.normal(0, 0.0005, H)
            actions[:, 2] = 0.005 * base_t  # Gentle upward lift velocity
            actions[:, 3] = 0.0
            actions[:, 4] = 8.0 + 0.5 * np.sin(np.pi * base_t)  # Safe grip normal force
        else:
            # Peg in hole: [vx, vy, vz, wx, wy, wz]
            actions[:, 0] = 0.001 * np.cos(np.pi * base_t)
            actions[:, 1] = 0.001 * np.sin(np.pi * base_t)
            actions[:, 2] = -0.005  # Downward insertion velocity
            actions[:, 3:] = 0.0

        representations = None
        if payload.request_representations and self.descriptor.has_representations:
            rep_dim = self.descriptor.representation_dim or 128
            representations = rng.normal(0, 1, (H, rep_dim)).astype(np.float32)
            representations /= np.linalg.norm(representations, axis=-1, keepdims=True) + 1e-8

        latency_ms = (time.perf_counter() - start_t) * 1000.0
        prov_hash = hashlib.sha256(
            f"{self.descriptor.model_id}:{payload.compute_payload_hash()}:{actions.tobytes()}".encode("utf-8")
        ).hexdigest()

        return TeacherInferenceResult(
            model_id=self.descriptor.model_id,
            candidate_actions=actions,
            predicted_confidence=0.92,
            latent_representations=representations,
            provenance_hash=prov_hash,
            cached=False,
            latency_ms=latency_ms,
        )


class AdversarialMockTeacher(BaseTeacherAdapter):
    """Adversarial mock teacher injecting physical and computational failure modes."""

    def __init__(self, descriptor: TeacherModelDescriptor, fault_mode: str = "kinematic_overflow"):
        super().__init__(descriptor)
        self.fault_mode = fault_mode

    def infer(self, payload: TeacherQueryPayload) -> TeacherInferenceResult:
        action_dim = 5 if payload.task_id == "compliant_prelift" else 6
        H = payload.target_horizon

        if self.fault_mode == "timeout_error":
            raise TimeoutError("Simulated external teacher API connection timed out (HTTP 504).")

        if self.fault_mode == "corrupted_output":
            actions = np.full((H, action_dim), np.nan, dtype=np.float32)
        elif self.fault_mode == "kinematic_overflow":
            # Command velocity of 0.8 m/s (far exceeds robot safe velocity 0.05 m/s)
            actions = np.full((H, action_dim), 0.80, dtype=np.float32)
        elif self.fault_mode == "crush_force":
            actions = np.zeros((H, action_dim), dtype=np.float32)
            if payload.task_id == "compliant_prelift":
                actions[:, 4] = 45.0  # Destructive normal force >> 20.0 N limit!
        elif self.fault_mode == "friction_cone_violation":
            actions = np.zeros((H, action_dim), dtype=np.float32)
            if payload.task_id == "compliant_prelift":
                actions[:, 0] = 0.04  # Aggressive lateral move
                actions[:, 4] = 0.0   # ZERO normal force (violates Coulomb cone)
        elif self.fault_mode == "mesh_penetration":
            actions = np.zeros((H, action_dim), dtype=np.float32)
            actions[:, 2] = -0.05  # Drive straight through rigid floor
        else:
            actions = np.zeros((H, action_dim), dtype=np.float32)

        prov_hash = hashlib.sha256(
            f"{self.descriptor.model_id}:fault:{self.fault_mode}:{actions.tobytes()}".encode("utf-8")
        ).hexdigest()

        return TeacherInferenceResult(
            model_id=self.descriptor.model_id,
            candidate_actions=actions,
            predicted_confidence=0.10,
            latent_representations=None,
            provenance_hash=prov_hash,
            cached=False,
            latency_ms=1.5,
        )


class TeacherInferenceEngine:
    """Manages teacher queries, execution adapters, deterministic disk caching, and retries."""

    def __init__(
        self,
        registry: TeacherModelRegistry,
        cache_dir: Optional[str] = None,
        max_retries: int = 2,
        backoff_factor: float = 0.05,
    ):
        self.registry = registry
        self.cache_dir = Path(cache_dir) if cache_dir else None
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self._adapters: Dict[str, BaseTeacherAdapter] = {}

        if self.cache_dir:
            self.cache_dir.mkdir(parents=True, exist_ok=True)

    def register_adapter(self, model_id: str, adapter: BaseTeacherAdapter) -> None:
        """Binds a model ID to an execution adapter."""
        if not self.registry.has(model_id):
            raise KeyError(f"Cannot register adapter for unknown model '{model_id}'.")
        self._adapters[model_id] = adapter

    def query(self, model_id: str, payload: TeacherQueryPayload) -> TeacherInferenceResult:
        """Executes query with deterministic caching and retry handling."""
        if model_id not in self._adapters:
            raise KeyError(f"No adapter registered for teacher model '{model_id}'.")

        cache_path = self._get_cache_path(model_id, payload)
        if cache_path and cache_path.is_file():
            cached_result = self._load_cache(cache_path)
            if cached_result is not None:
                cached_result.cached = True
                return cached_result

        adapter = self._adapters[model_id]
        last_exception: Optional[Exception] = None

        for attempt in range(self.max_retries + 1):
            try:
                result = adapter.infer(payload)
                if cache_path:
                    self._save_cache(cache_path, result)
                return result
            except Exception as exc:
                last_exception = exc
                if attempt < self.max_retries:
                    time.sleep(self.backoff_factor * (2 ** attempt))

        raise RuntimeError(
            f"Teacher inference failed for model '{model_id}' after {self.max_retries + 1} attempts: {last_exception}"
        ) from last_exception

    def query_batch(
        self, model_id: str, payloads: List[TeacherQueryPayload]
    ) -> List[TeacherInferenceResult]:
        """Queries a teacher with a batch of payloads."""
        return [self.query(model_id, p) for p in payloads]

    def _get_cache_path(self, model_id: str, payload: TeacherQueryPayload) -> Optional[Path]:
        if not self.cache_dir:
            return None
        payload_hash = payload.compute_payload_hash()
        cache_key = hashlib.sha256(f"{model_id}:{payload_hash}".encode("utf-8")).hexdigest()
        return self.cache_dir / f"{cache_key}.npz"

    def _load_cache(self, path: Path) -> Optional[TeacherInferenceResult]:
        try:
            data = np.load(path, allow_pickle=True)
            rep = data["latent_representations"] if "latent_representations" in data.files else None
            if rep is not None and (not hasattr(rep, "shape") or rep.shape == ()):
                rep = None
            return TeacherInferenceResult(
                model_id=str(data["model_id"]),
                candidate_actions=data["candidate_actions"],
                predicted_states=data["predicted_states"] if "predicted_states" in data.files else None,
                predicted_modes=data["predicted_modes"] if "predicted_modes" in data.files else None,
                predicted_confidence=float(data["predicted_confidence"]),
                latent_representations=rep,
                provenance_hash=str(data["provenance_hash"]),
                cached=True,
                latency_ms=0.1,
            )
        except Exception:
            return None

    def _save_cache(self, path: Path, result: TeacherInferenceResult) -> None:
        try:
            kwargs: Dict[str, Any] = {
                "model_id": result.model_id,
                "candidate_actions": result.candidate_actions,
                "predicted_confidence": result.predicted_confidence,
                "provenance_hash": result.provenance_hash,
            }
            if result.predicted_states is not None:
                kwargs["predicted_states"] = result.predicted_states
            if result.predicted_modes is not None:
                kwargs["predicted_modes"] = result.predicted_modes
            if result.latent_representations is not None:
                kwargs["latent_representations"] = result.latent_representations
            np.savez_compressed(path, **kwargs)
        except Exception:
            pass
