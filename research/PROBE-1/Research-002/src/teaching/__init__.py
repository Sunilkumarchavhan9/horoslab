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
    ExternalRestApiTeacher,
    TeacherInferenceEngine,
    TeacherInferenceResult,
    TeacherQueryPayload,
)
from teaching.validator import (
    PIH_TASK_LIMITS,
    PRELIFT_TASK_LIMITS,
    PhysicsValidationEngine,
    TaskPhysicsLimits,
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
    "ExternalRestApiTeacher",
    "TeacherInferenceEngine",
    "TaskPhysicsLimits",
    "PRELIFT_TASK_LIMITS",
    "PIH_TASK_LIMITS",
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

