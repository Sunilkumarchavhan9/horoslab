"""Stage 3.1 pilot: 20 Prelift and 20 Peg-in-Hole scenarios.

Does not generate the 1,000-episode production dataset and does not train.
"""

from __future__ import annotations

import hashlib
import json
import os
import sys
from pathlib import Path

import numpy as np

SCRIPT_DIR = Path(__file__).resolve().parent
R002_ROOT = SCRIPT_DIR.parent
for path in (R002_ROOT, R002_ROOT / "src"):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

from teaching.factory import (  # noqa: E402
    OBSERVATION_ARRAY_FIELDS,
    STAGE3_PILOT_COUNTS,
    EnvironmentSamplingSpec,
    SyntheticExperienceFactory,
)
from teaching.inference import DeterministicMockTeacher, TeacherInferenceEngine  # noqa: E402
from teaching.registry import TeacherModelDescriptor, TeacherModelRegistry, TeacherProvider  # noqa: E402
from teaching.validator import PhysicsValidationEngine  # noqa: E402


EPISODE_LENGTH = 20
TRAINING_PERFORMED = False


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        digest.update(handle.read())
    return digest.hexdigest()


def main() -> int:
    if TRAINING_PERFORMED:
        raise RuntimeError("Pilot refuses to run when training is enabled")
    registry = TeacherModelRegistry()
    descriptor = TeacherModelDescriptor(
        model_id="stage3_pilot_teacher_v1",
        display_name="Stage 3 pilot teacher",
        version="1.0.0",
        provider=TeacherProvider.MOCK_DETERMINISTIC,
        supported_modalities=["state_vector"],
        capabilities=["trajectory_proposal"],
        license="internal_horos_research",
        has_representations=False,
        deterministic_seed_supported=True,
    )
    registry.register(descriptor)
    engine = TeacherInferenceEngine(registry)
    engine.register_adapter(descriptor.model_id, DeterministicMockTeacher(descriptor))
    factory = SyntheticExperienceFactory(
        engine,
        sampling_spec=EnvironmentSamplingSpec(default_episode_length=EPISODE_LENGTH, dt_s=0.01, enable_regime_shifts=False),
    )
    validator = PhysicsValidationEngine.for_tasks()
    out_root = R002_ROOT / "experiments" / "stage3_preflight" / "pilot"
    accepted_root = out_root / "accepted"
    rejected_root = out_root / "rejected"
    accepted_root.mkdir(parents=True, exist_ok=True)
    rejected_root.mkdir(parents=True, exist_ok=True)

    summary = {
        "protocol": "HOROS-P1-R002-STAGE3.1-PILOT",
        "training_performed": False,
        "parameters_trained": 0,
        "episode_length": EPISODE_LENGTH,
        "tasks": {},
    }
    for task, counts in STAGE3_PILOT_COUNTS.items():
        episodes = []
        for stratum, count in counts.items():
            for index in range(count):
                episodes.append(
                    factory.generate_stratified_episode(
                        task, descriptor.model_id, stratum, index, episode_length=EPISODE_LENGTH
                    )
                )
        accepted, rejected, reports = validator.partition_episodes(task, episodes)
        task_summary = {
            "generated": len(episodes),
            "accepted": len(accepted),
            "rejected": len(rejected),
            "strata": counts,
            "rejections": [],
            "finite": True,
            "privileged_leaks": [],
            "reproduced": True,
        }
        for episode, report in zip(episodes, reports):
            for name in OBSERVATION_ARRAY_FIELDS:
                if not np.all(np.isfinite(getattr(episode, name))):
                    task_summary["finite"] = False
            leaks = episode.leaked_privileged_keys()
            if leaks:
                task_summary["privileged_leaks"].extend(leaks)
        for episode, report in zip(episodes, reports):
            stratum = str(episode.env_metadata["stratum"])
            index = next(
                i for i in range(counts[stratum])
                if factory.scenario_seed(task, stratum, i) == int(episode.seed)
            )
            duplicate = factory.generate_stratified_episode(
                task, descriptor.model_id, stratum, index, episode_length=EPISODE_LENGTH
            )
            if duplicate.provenance_hash != episode.provenance_hash:
                task_summary["reproduced"] = False
            destination = accepted_root if report.is_valid else rejected_root
            factory.output_dir = destination
            obs_path, privileged_path = factory.write_separated_artifacts(episode)
            if not report.is_valid:
                task_summary["rejections"].append({
                    "episode_id": episode.episode_id,
                    "stratum": stratum,
                    "seed": int(episode.seed),
                    "verdict": report.verdict.value,
                    "failure_step": report.failure_step,
                    "detail": report.violation_details,
                    "observation_sha256": _sha256(obs_path),
                    "privileged_sha256": _sha256(privileged_path),
                })
        task_summary["observation_files"] = len(list(accepted_root.glob(f"syn_{task}_*.npz")))
        summary["tasks"][task] = task_summary
        print(
            f"{task}: generated {len(episodes)}, accepted {len(accepted)}, "
            f"rejected {len(rejected)}, finite {task_summary['finite']}, "
            f"reproduced {task_summary['reproduced']}"
        )

    report_path = out_root / "stage3_pilot_report.json"
    with open(report_path, "w", encoding="utf-8") as handle:
        json.dump(summary, handle, indent=2)
        handle.write("\n")
    print(f"wrote {report_path}")
    failed = any(
        (not row["finite"]) or row["privileged_leaks"] or (not row["reproduced"]) or row["generated"] != 20
        for row in summary["tasks"].values()
    )
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
