import type { EpochMissionState } from "./epochStore";

export const EPOCH_MISSION_STATES = [
  "draft",
  "running",
  "waiting_review",
  "completed",
  "failed",
  "cancelled",
] as const satisfies readonly EpochMissionState[];

const TRANSITIONS: Record<EpochMissionState, readonly EpochMissionState[]> = {
  draft: ["running", "waiting_review", "failed", "cancelled"],
  running: ["waiting_review", "failed", "cancelled"],
  waiting_review: ["running", "completed", "failed", "cancelled"],
  completed: [],
  // A failed mission may be retried through its original governance gate.
  // Repository missions return to human review; ordinary missions return to draft.
  failed: ["draft", "waiting_review"],
  cancelled: [],
};

export class EpochMissionTransitionError extends Error {
  readonly code = "INVALID_MISSION_TRANSITION";

  constructor(
    readonly from: EpochMissionState,
    readonly to: EpochMissionState,
  ) {
    super(`Mission cannot transition from ${from} to ${to}`);
    this.name = "EpochMissionTransitionError";
  }
}

export function canTransitionMission(
  from: EpochMissionState,
  to: EpochMissionState,
): boolean {
  return from === to || TRANSITIONS[from].includes(to);
}

export function assertMissionTransition(
  from: EpochMissionState,
  to: EpochMissionState,
): void {
  if (!canTransitionMission(from, to)) {
    throw new EpochMissionTransitionError(from, to);
  }
}
