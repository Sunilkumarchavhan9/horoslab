import { createActionMemory, createExecutionOutcome } from "../memory/actionMemoryStore";
import type { ContinuityThread } from "./continuityThreadStore";

function summarizePlan(thread: ContinuityThread): string {
  return thread.plan.length > 0 ? thread.plan.join(" | ") : thread.title;
}

function collectChangedFiles(thread: ContinuityThread): string[] {
  return thread.artifacts
    .map((artifact) => artifact.metadata.sourceChangeId)
    .filter((value): value is string => typeof value === "string" && value.length > 0);
}

export async function recordSuccessfulMythicRun(input: {
  userId: string;
  orgId?: string;
  thread: ContinuityThread;
  prUrl?: string | null;
}): Promise<void> {
  const { thread } = input;
  const actionMemory = await createActionMemory({
    userId: input.userId,
    orgId: input.orgId ?? null,
    projectId: thread.project,
    workspace: thread.workspace,
    action: `Mythic execution completed: ${thread.title}`,
    reason: thread.goal?.trim() || thread.title,
    filesChanged: collectChangedFiles(thread),
    outcome: "success",
    followUps: [
      "Reuse this execution lineage for resume and handoff planning.",
      "Reuse verification evidence for similar debug/build-next contexts.",
    ],
    sourceType: "continuity",
    sourceId: thread.id,
    metadata: {
      provenanceTags: [
        "mythic_execution",
        "mythic_handoff",
        "mythic_verification",
        "mythic_pr",
      ],
      threadId: thread.id,
      taskId: thread.executionState.taskId ?? null,
      linkedPrs: thread.linkedPrs,
      artifactUris: thread.artifacts.map((artifact) => artifact.uri),
      handoffIds: thread.handoffs.map((handoff) => handoff.id),
    },
  });

  await createExecutionOutcome({
    actionMemoryId: actionMemory.id,
    userId: input.userId,
    orgId: input.orgId ?? null,
    goal: thread.goal ?? thread.title,
    planSummary: summarizePlan(thread),
    resultSummary: `Mythic run completed with ${thread.artifacts.length} artifacts and ${thread.handoffs.length} handoffs.`,
    status: "completed",
    connectorAdapter: input.prUrl ? "github" : "continuity",
    externalRef: input.prUrl ?? null,
  });
}
