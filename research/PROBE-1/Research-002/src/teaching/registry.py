"""Teacher Model Registry for HOROS Model Teaching Infrastructure.

Manages external foundation models, internal specialized world models, and mock
teachers with versioning, capability tagging, licensing, and provenance hashing.
"""

from __future__ import annotations

import copy
import hashlib
import json
import os
from dataclasses import asdict, dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional


class TeacherProvider(str, Enum):
    """Supported provider classes for teacher models."""
    LOCAL_CHECKPOINT = "local_checkpoint"
    EXTERNAL_REST_API = "external_rest_api"
    MOCK_DETERMINISTIC = "mock_deterministic"
    MOCK_ADVERSARIAL = "mock_adversarial"


@dataclass(frozen=True)
class TeacherModelDescriptor:
    """Immutable metadata contract defining a registered teacher model."""
    model_id: str
    display_name: str
    version: str
    provider: TeacherProvider
    supported_modalities: List[str]
    capabilities: List[str]
    license: str
    has_representations: bool = False
    representation_dim: Optional[int] = None
    endpoint_url: Optional[str] = None
    local_weights_path: Optional[str] = None
    rate_limit_rpm: int = 60
    deterministic_seed_supported: bool = True
    metadata: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not self.model_id or not isinstance(self.model_id, str):
            raise ValueError("model_id must be a non-empty string.")
        if not self.version or not isinstance(self.version, str):
            raise ValueError("version must be a non-empty string.")
        if not self.supported_modalities:
            raise ValueError("supported_modalities must contain at least one modality.")
        if not self.capabilities:
            raise ValueError("capabilities must contain at least one capability.")
        if self.has_representations and (self.representation_dim is None or self.representation_dim <= 0):
            raise ValueError("representation_dim must be positive when has_representations is True.")
        if self.provider == TeacherProvider.EXTERNAL_REST_API and not self.endpoint_url:
            raise ValueError("endpoint_url is required for external REST API teachers.")

    def compute_descriptor_hash(self) -> str:
        """Computes deterministic SHA-256 fingerprint of descriptor configuration."""
        content = {
            "model_id": self.model_id,
            "version": self.version,
            "provider": self.provider.value,
            "modalities": sorted(self.supported_modalities),
            "capabilities": sorted(self.capabilities),
            "license": self.license,
            "has_representations": self.has_representations,
            "representation_dim": self.representation_dim,
            "endpoint_url": self.endpoint_url,
            "local_weights_path": self.local_weights_path,
        }
        encoded = json.dumps(content, sort_keys=True).encode("utf-8")
        return hashlib.sha256(encoded).hexdigest()


class TeacherModelRegistry:
    """Central registry and governance catalog for teacher models."""

    def __init__(self) -> None:
        self._registry: Dict[str, TeacherModelDescriptor] = {}

    def register(self, descriptor: TeacherModelDescriptor) -> None:
        """Registers a new teacher model descriptor."""
        if descriptor.model_id in self._registry:
            existing = self._registry[descriptor.model_id]
            if existing.version == descriptor.version:
                raise ValueError(
                    f"Teacher model '{descriptor.model_id}' version '{descriptor.version}' is already registered."
                )
        self._registry[descriptor.model_id] = descriptor

    def unregister(self, model_id: str) -> None:
        """Removes a model from the registry."""
        if model_id not in self._registry:
            raise KeyError(f"Teacher model '{model_id}' is not registered.")
        del self._registry[model_id]

    def get(self, model_id: str) -> TeacherModelDescriptor:
        """Retrieves a registered teacher model descriptor."""
        if model_id not in self._registry:
            raise KeyError(f"Teacher model '{model_id}' is not registered.")
        return self._registry[model_id]

    def has(self, model_id: str) -> bool:
        """Returns True if the model is registered."""
        return model_id in self._registry

    def list_available(
        self,
        capability: Optional[str] = None,
        modality: Optional[str] = None,
        provider: Optional[TeacherProvider] = None,
    ) -> List[TeacherModelDescriptor]:
        """Filters registered models by capability, modality, and provider."""
        results: List[TeacherModelDescriptor] = []
        for desc in self._registry.values():
            if capability and capability not in desc.capabilities:
                continue
            if modality and modality not in desc.supported_modalities:
                continue
            if provider and desc.provider != provider:
                continue
            results.append(desc)
        return sorted(results, key=lambda x: x.model_id)

    def compute_provenance_hash(self, model_id: str) -> str:
        """Computes provenance hash combining descriptor and local weights if available."""
        desc = self.get(model_id)
        desc_hash = desc.compute_descriptor_hash()
        if desc.local_weights_path and os.path.isfile(desc.local_weights_path):
            with open(desc.local_weights_path, "rb") as f:
                weights_hash = hashlib.sha256(f.read()).hexdigest()
            combined = f"{desc_hash}:{weights_hash}".encode("utf-8")
            return hashlib.sha256(combined).hexdigest()
        return desc_hash

    def export_manifest(self, filepath: str) -> str:
        """Exports registry catalog as a structured JSON manifest."""
        manifest_data: Dict[str, Any] = {
            "schema_version": "teacher_model_registry_manifest_v1.0",
            "model_count": len(self._registry),
            "teachers": {},
        }
        for model_id, desc in self._registry.items():
            d_dict = asdict(desc)
            d_dict["provider"] = desc.provider.value
            d_dict["provenance_hash"] = self.compute_provenance_hash(model_id)
            manifest_data["teachers"][model_id] = d_dict

        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(manifest_data, f, indent=2)
        return str(path)

    def import_manifest(self, filepath: str) -> int:
        """Imports teachers from a registry manifest JSON file."""
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        imported_count = 0
        teachers = data.get("teachers", {})
        for model_id, raw_desc in teachers.items():
            raw_desc_copy = copy.deepcopy(raw_desc)
            raw_desc_copy.pop("provenance_hash", None)
            raw_desc_copy["provider"] = TeacherProvider(raw_desc_copy["provider"])
            desc = TeacherModelDescriptor(**raw_desc_copy)
            self.register(desc)
            imported_count += 1
        return imported_count

