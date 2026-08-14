import { randomUUID } from "crypto";
import { getMemoryStoreAdapter } from "../adapters/registry";
import { recordMemoryCreatedEvent } from "../memory/timelineMemory";
import { upsertRecentMemory } from "../memory/recentMemoryStore";
import type { Memory } from "../memory/types";

export type PersistExperienceGraphMemoryInput = {
  userId: string;
  orgId?: string | null;
  workspace?: string | null;
  project?: string | null;
  sourceType: string;
  sourceRef: string;
  task: string;
  problem: string;
  context: string;
  action: string;
  mistake?: string | null;
  outcome: string;
  lesson: string;
  futureAgentInstruction: string;
  evidence: string[];
  files?: string[];
  tests?: string[];
  relatedMemoryIds?: string[];
  relatedReasoningIds?: string[];
  riskLevel?: string;
  status?: "captured" | "reviewed" | "skill_candidate" | "archived" | string;
  confidence?: number;
  eventReason?: string;
};

function compactGraphLabel(value: string): string {
  const compacted = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return compacted || "unknown";
}

export async function persistExperienceGraphMemory(
  input: PersistExperienceGraphMemoryInput,
): Promise<Memory> {
  const now = new Date().toISOString();
  const project = input.project?.trim() || undefined;
  const workspace = input.workspace?.trim() || undefined;
  const files = input.files ?? [];
  const tests = input.tests ?? [];
  const relatedMemoryIds = input.relatedMemoryIds ?? [];
  const relatedReasoningIds = input.relatedReasoningIds ?? [];
  const evidence = input.evidence.length > 0 ? input.evidence : [`${input.sourceType}:${input.sourceRef}`];
  const riskLevel = input.riskLevel ?? "medium";
  const experienceStatus = input.status ?? "captured";
  const sourceRef = `experience:${input.sourceType}:${input.sourceRef}`;

  const memory: Memory = {
    id: randomUUID(),
    userId: input.userId,
    orgId: input.orgId ?? undefined,
    type: "project",
    summary: `Experience: ${input.task}`,
    content: [
      `Task: ${input.task}`,
      `Problem: ${input.problem}`,
      `Context: ${input.context}`,
      `Action: ${input.action}`,
      `Mistake: ${input.mistake?.trim() || "None captured"}`,
      `Outcome: ${input.outcome}`,
      `Lesson: ${input.lesson}`,
      `Future-agent instruction: ${input.futureAgentInstruction}`,
      `Evidence: ${evidence.join(" | ")}`,
      files.length > 0 ? `Files: ${files.join(" | ")}` : undefined,
      tests.length > 0 ? `Tests: ${tests.join(" | ")}` : undefined,
      `Risk level: ${riskLevel}`,
      `Experience status: ${experienceStatus}`,
      project ? `Project: ${project}` : undefined,
      workspace ? `Workspace: ${workspace}` : undefined,
    ]
      .filter((part): part is string => Boolean(part))
      .join("\n"),
    importanceScore: riskLevel === "high" || riskLevel === "blocked" ? 0.94 : 0.88,
    confidence: input.confidence ?? 0.9,
    source: "import",
    status: experienceStatus === "archived" ? "archived" : "active",
    createdAt: now,
    updatedAt: now,
    evidenceCount: Math.max(1, evidence.length),
    contractVersion: "memoryos.contract.v1",
    contractCategory: "previous_attempt",
    companyBrainType: "execution",
    sourceRef,
    files,
    traceProof: {
      sourceType: input.sourceType,
      sourceRef,
      evidence,
      confidence: input.confidence ?? 0.9,
      capturedAt: now,
    },
    freshness: {
      status: "fresh",
      checkedAt: now,
    },
    conflict: {
      status: "none",
      conflictsWith: [],
      checkedAt: now,
    },
    graph: {
      nodeId: `experience:${randomUUID().slice(0, 8)}`,
      nodeType: "execution",
      edgeRefs: [
        project ? `project:${project}` : undefined,
        workspace ? `workspace:${workspace}` : undefined,
        `source:${input.sourceType}:${input.sourceRef}`,
        `outcome:${compactGraphLabel(input.outcome)}`,
        `lesson:${compactGraphLabel(input.lesson)}`,
        ...relatedMemoryIds.map((id) => `memory:${id}`),
        ...relatedReasoningIds.map((id) => `reasoning:${id}`),
        ...files.map((file) => `file:${file}`),
        ...tests.map((test) => `test:${test}`),
      ].filter((value): value is string => Boolean(value)),
    },
    developerSignals: {
      projectArea: [project, workspace, input.task, ...files].filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0,
      ),
      goal: [
        input.problem,
        input.action,
        input.outcome,
        input.lesson,
        input.futureAgentInstruction,
      ],
    },
  };

  await getMemoryStoreAdapter().saveMemory({ memory });
  await upsertRecentMemory(memory, input.orgId ?? undefined);
  await recordMemoryCreatedEvent(
    memory,
    input.eventReason ?? "Experience Graph memory captured from real work outcome for future-agent inheritance.",
  );

  return memory;
}
