import {
  assignThreadExecutionTask,
  appendThreadExecutionLog,
  createThreadArtifact,
  createThreadHandoff,
  getContinuityThread,
  setThreadExecutionPlan,
  type ContinuityArtifact,
  type ContinuityAgentHandoff,
  type ContinuityThread,
} from "./continuityThreadStore";

export interface ActivateMythicPlanInput {
  userId: string;
  threadId: string;
  steps: string[];
  orgId?: string;
}

export interface ActivateMythicPlanResult {
  thread: ContinuityThread;
  handoff: ContinuityAgentHandoff;
  artifact: ContinuityArtifact;
  taskId: string;
}

function sanitizeSteps(steps: string[]): string[] {
  return steps
    .map((step) => step.trim())
    .filter(Boolean)
    .filter((step, index, values) => values.indexOf(step) === index)
    .slice(0, 12);
}

function buildTaskId(thread: ContinuityThread): string {
  return `MYTHIC-${thread.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function buildCompressedContext(thread: ContinuityThread, steps: string[]): string {
  const goal = thread.goal?.trim() || thread.title.trim();
  const repo = thread.repoPath?.trim();
  const summary = [
    `Goal: ${goal}`,
    `Workspace: ${thread.workspace}`,
    `Project: ${thread.project}`,
    repo ? `Repo: ${repo}` : undefined,
    `First step: ${steps[0]}`,
    steps.length > 1 ? `Remaining steps: ${steps.slice(1).join(" | ")}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");

  return summary.slice(0, 4000);
}

function buildArtifactContent(thread: ContinuityThread, taskId: string, steps: string[]): string {
  const lines = [
    `Task: ${taskId}`,
    `Thread: ${thread.title}`,
    `Goal: ${thread.goal?.trim() || thread.title.trim()}`,
    `Workspace: ${thread.workspace}`,
    `Project: ${thread.project}`,
    "",
    "Execution Plan:",
    ...steps.map((step, index) => `${index + 1}. ${step}`),
    "",
    "Activation Notes:",
    "- Plan persisted to runtime thread",
    "- Initial manager -> coder handoff generated",
    "- Ready for execute/start when the operator wants to run the plan",
  ];

  return lines.join("\n").slice(0, 20000);
}

export async function activateMythicPlan(
  input: ActivateMythicPlanInput,
): Promise<ActivateMythicPlanResult | null> {
  const thread = await getContinuityThread(input.userId, input.threadId, input.orgId);
  if (!thread) return null;

  const steps = sanitizeSteps(input.steps);
  if (steps.length === 0) {
    throw new Error("Cannot activate Mythic plan without at least one step");
  }

  const plannedThread = await setThreadExecutionPlan(
    input.userId,
    input.threadId,
    steps,
    input.orgId,
  );
  if (!plannedThread) return null;

  const taskId = buildTaskId(plannedThread);
  await assignThreadExecutionTask(
    input.userId,
    input.threadId,
    { taskId, activeRole: "manager" },
    input.orgId,
  );
  const artifactCreated = await createThreadArtifact(
    input.userId,
    input.threadId,
    {
      type: "log",
      producer: "manager",
      consumers: ["coder", "reviewer", "verifier"],
      title: "Mythic execution plan",
      description: "Activation brief for the first implementation handoff.",
      content: buildArtifactContent(plannedThread, taskId, steps),
      tags: ["mythic", "execution-plan", "handoff"],
      stage: "plan",
    },
    input.orgId,
  );
  if (!artifactCreated) return null;

  const handoffCreated = await createThreadHandoff(
    input.userId,
    input.threadId,
    {
      source: "manager",
      target: "coder",
      taskId,
      payload: {
        artifacts: [artifactCreated.artifact.uri],
      },
      metadata: {
        confidence: 0.88,
        completeness: 0.96,
        notes: "Execution plan activated and ready for implementation.",
      },
      requirements: [
        `Start with the first plan step: ${steps[0]}`,
        "Preserve existing runtime contracts while implementing changes.",
        "Attach code/test artifacts before handing work to review.",
      ],
      compressedContext: buildCompressedContext(plannedThread, steps),
    },
    input.orgId,
  );
  if (!handoffCreated) return null;

  await appendThreadExecutionLog(
    input.userId,
    input.threadId,
    "info",
    `Mythic plan activated with ${steps.length} steps under ${taskId}`,
    input.orgId,
  );

  const latestThread = await getContinuityThread(input.userId, input.threadId, input.orgId);
  if (!latestThread) return null;

  return {
    thread: latestThread,
    artifact: artifactCreated.artifact,
    handoff: handoffCreated.handoff,
    taskId,
  };
}
