import { randomUUID } from "node:crypto";

export type MissionStep = {
  id: string;
  title: string;
  dependsOn: string[];
  acceptanceCriteria: string[];
};

export type MissionCheckpoint = {
  stepId: string;
  status: "started" | "completed" | "failed";
  attempt: number;
  recordedAt: string;
  evidenceIds: string[];
};

export type MissionLoopMetadata = {
  objectiveVersion: number;
  acceptanceCriteria: string[];
  steps: MissionStep[];
  checkpoints: MissionCheckpoint[];
  cancellation: { requested: boolean; requestedAt?: string; reason?: string };
};

export function buildMissionLoopMetadata(input: {
  objective: string;
  acceptanceCriteria?: string[];
  plan?: string[];
  previous?: Partial<MissionLoopMetadata>;
}): MissionLoopMetadata {
  const steps = (input.plan?.length ? input.plan : ["Clarify objective", "Execute mission", "Verify result"]).map((title, index) => ({
    id: `step_${index + 1}`,
    title,
    dependsOn: index === 0 ? [] : [`step_${index}`],
    acceptanceCriteria: input.acceptanceCriteria?.length ? input.acceptanceCriteria : [`Complete: ${title}`],
  }));
  return {
    objectiveVersion: Math.max(1, Number(input.previous?.objectiveVersion ?? 0) + 1),
    acceptanceCriteria: input.acceptanceCriteria?.length ? input.acceptanceCriteria : [`Mission objective satisfied: ${input.objective}`],
    steps,
    checkpoints: input.previous?.checkpoints ?? [],
    cancellation: input.previous?.cancellation ?? { requested: false },
  };
}

export function readyMissionSteps(metadata: MissionLoopMetadata): MissionStep[] {
  const completed = new Set(metadata.checkpoints.filter((checkpoint) => checkpoint.status === "completed").map((checkpoint) => checkpoint.stepId));
  return metadata.steps.filter((step) => !completed.has(step.id) && step.dependsOn.every((dependency) => completed.has(dependency)));
}

export function recordMissionCheckpoint(
  metadata: MissionLoopMetadata,
  input: Omit<MissionCheckpoint, "recordedAt">,
): MissionLoopMetadata {
  return {
    ...metadata,
    checkpoints: [
      ...metadata.checkpoints.filter((checkpoint) => checkpoint.stepId !== input.stepId || checkpoint.status === "completed"),
      { ...input, recordedAt: new Date().toISOString() },
    ],
  };
}

export function requestMissionCancellation(metadata: MissionLoopMetadata, reason?: string): MissionLoopMetadata {
  return {
    ...metadata,
    cancellation: { requested: true, requestedAt: new Date().toISOString(), reason },
  };
}

export function canPerformPrivilegedAction(metadata: MissionLoopMetadata): boolean {
  return !metadata.cancellation.requested;
}

export function isExecutionTimedOut(startedAt: Date | string, timeoutMs: number, now = new Date()): boolean {
  return now.getTime() - new Date(startedAt).getTime() >= Math.max(1, timeoutMs);
}

export function deterministicAssurance(input: {
  evidenceCount: number;
  acceptancePassed: boolean;
  humanApproval: "approved" | "rejected" | "review";
  confidence: number;
}): "PASS" | "FAIL" | "UNKNOWN" {
  if (input.humanApproval === "rejected") return "FAIL";
  if (input.humanApproval === "review") return "UNKNOWN";
  if (input.evidenceCount === 0 || !input.acceptancePassed || input.confidence < 70) return "FAIL";
  return "PASS";
}

export function createMissionCorrelation(): { correlationId: string; traceId: string } {
  const id = randomUUID().slice(0, 12);
  return { correlationId: `corr_${id}`, traceId: `trace_${id}` };
}
