"""HOROS Model Teaching Infrastructure.

Provides the six-module architecture for teacher model registration, inference,
synthetic physical experience generation, physics validation, distillation dataset
preparation, and baseline evaluation.
"""

from teaching.registry import (
    TeacherModelDescriptor,
    TeacherModelRegistry,
    TeacherProvider,
)
from teaching.inference import (
    AdversarialMockTeacher,
    BaseTeacherAdapter,
    DeterministicMockTeacher,
    TeacherInferenceEngine,
    TeacherInferenceResult,
    TeacherQueryPayload,
)
from teaching.validator import (
    PhysicsValidationEngine,
    ValidationReport,
    ValidationVerdict,
)
from teaching.factory import (
    EnvironmentSamplingSpec,
    SyntheticEpisodeRecord,
    SyntheticExperienceFactory,
)
from teaching.distiller import (
    StudentDistillationEngine,
    StudentTrainingBatch,
    TrainingDatasetManifest,
)
from teaching.evaluator import (
    BenchmarkResults,
    StudentEvaluationEngine,
)

__all__ = [
    "TeacherProvider",
    "TeacherModelDescriptor",
    "TeacherModelRegistry",
    "TeacherQueryPayload",
    "TeacherInferenceResult",
    "BaseTeacherAdapter",
    "DeterministicMockTeacher",
    "AdversarialMockTeacher",
    "TeacherInferenceEngine",
    "ValidationVerdict",
    "ValidationReport",
    "PhysicsValidationEngine",
    "EnvironmentSamplingSpec",
    "SyntheticEpisodeRecord",
    "SyntheticExperienceFactory",
    "StudentTrainingBatch",
    "TrainingDatasetManifest",
    "StudentDistillationEngine",
    "BenchmarkResults",
    "StudentEvaluationEngine",
]
