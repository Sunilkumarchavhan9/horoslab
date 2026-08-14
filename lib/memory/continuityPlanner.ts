import { retrieveRelevantMemory, type RankedMemory } from "./retrieveRelevantMemory";
import { listActionMemories } from "./actionMemoryStore";
import type { ContinuityScope } from "../adapters/adapters";
import type { MemoryContractCategory, MemoryType } from "./types";

export type ContinuityMode = "build_next" | "debug_next" | "learn_next";

export interface ContinuityPlannerInput {
  userId: string;
  question: string;
  mode?: ContinuityMode;
  topK?: number;
  includeArchived?: boolean;
  previousCheckpoint?: Record<string, unknown> | null;
}

export interface ContinuityPlannerScopedInput
  extends ContinuityPlannerInput,
    ContinuityScope {}

export interface ContinuityUsedMemory {
  id: string;
  content: string;
  memoryType?: MemoryType;
  contractCategory?: MemoryContractCategory;
  summary?: string;
  source?: string;
  finalScore: number;
  importanceScore: number;
  updatedAt?: string;
}

export interface ContinuityPlannerResult {
  nextActions: string[];
  usedMemories: ContinuityUsedMemory[];
  debug: {
    mode: ContinuityMode;
    retrieval: Array<{
      id: string;
      semanticScore: number;
      typeRelevanceScore: number;
      importanceScore: number;
      recencyScore: number;
      continuityBoost: number;
      intent: string;
      weightsUsed: {
        semantic: number;
        typeRelevance: number;
        importance: number;
        recency: number;
      };
      finalScore: number;
    }>;
  };
}

type PreviousContinuityContext = {
  previousNextActions?: string[];
  previousMode?: string;
};

function getMetadataSummary(memory: RankedMemory): string | undefined {
  const metadata = memory.metadata;
  if (!metadata || typeof metadata !== "object") return undefined;
  const raw = (metadata as Record<string, unknown>).summary;
  return typeof raw === "string" && raw.length > 0 ? raw : undefined;
}

function getMetadataSource(memory: RankedMemory): string | undefined {
  const metadata = memory.metadata;
  if (!metadata || typeof metadata !== "object") return undefined;
  const raw = (metadata as Record<string, unknown>).source;
  return typeof raw === "string" && raw.length > 0 ? raw : undefined;
}

function toUsedMemory(memory: RankedMemory): ContinuityUsedMemory {
  const fallbackSummary = getMetadataSummary(memory);

  return {
    id: memory.id,
    content: memory.memory ?? fallbackSummary ?? "No memory content",
    memoryType: memory.memoryType,
    contractCategory: memory.contractCategory,
    summary: fallbackSummary,
    source: getMetadataSource(memory),
    finalScore: memory.finalScore,
    importanceScore: memory.importanceScore,
    updatedAt: memory.updatedAt,
  };
}

function cleanText(value: string | undefined, limit = 260): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  if (!normalized) return undefined;
  return normalized.length > limit ? `${normalized.slice(0, limit - 3)}...` : normalized;
}

async function loadMythicUsedMemories(
  input: ContinuityPlannerScopedInput,
): Promise<ContinuityUsedMemory[]> {
  const scopeKey = input.project?.trim().toLowerCase() ?? input.repo?.trim().toLowerCase() ?? "";
  const actions = await listActionMemories(input.userId, { limit: 30 });

  return actions
    .filter((entry) => entry.outcome === "success")
    .filter((entry) => entry.sourceType === "continuity" || entry.sourceType === "github_execution")
    .filter((entry) => {
      const metadata = entry.metadata;
      const tags = Array.isArray(metadata?.provenanceTags)
        ? metadata.provenanceTags.filter((value): value is string => typeof value === "string")
        : [];
      if (!tags.some((tag) => tag.startsWith("mythic_"))) {
        return false;
      }

      if (scopeKey.length === 0) {
        return true;
      }

      const haystack = [
        entry.projectId,
        entry.workspace,
        entry.action,
        entry.reason,
        typeof metadata?.repo === "string" ? metadata.repo : undefined,
      ]
        .filter((value): value is string => typeof value === "string" && value.length > 0)
        .join(" ")
        .toLowerCase();

      return haystack.includes(scopeKey);
    })
    .slice(0, 3)
    .map((entry, index) => {
      const summary = cleanText(`${entry.action}: ${entry.reason}`) ?? entry.action;
      return {
        id: entry.id,
        content: summary,
        memoryType: "episodic",
        contractCategory: "previous_attempt",
        summary,
        source: `mythic_execution:${entry.sourceId ?? entry.id}`,
        finalScore: Math.max(0.55, 0.9 - index * 0.05),
        importanceScore: 0.85,
        updatedAt: entry.updatedAt,
      } satisfies ContinuityUsedMemory;
    });
}

function pickFirstByType(
  memories: ContinuityUsedMemory[],
  type: MemoryType,
): ContinuityUsedMemory | undefined {
  return memories.find((m) => m.memoryType === type);
}

function buildActions(
  mode: ContinuityMode,
  question: string,
  used: ContinuityUsedMemory[],
): string[] {
  const project = pickFirstByType(used, "project");
  const learning = pickFirstByType(used, "learning");
  const preference = pickFirstByType(used, "preference");
  const episodic = pickFirstByType(used, "episodic");
  const mythic = used.find((memory) => memory.source?.startsWith("mythic_execution:"));

  const actions: string[] = [];

  if (mode === "build_next") {
    if (mythic) actions.push(`Reuse this successful Mythic execution path: ${mythic.content}`);
    if (project) actions.push(`Continue this project thread: ${project.content}`);
    if (preference) actions.push(`Use preferred stack/style: ${preference.content}`);
    if (learning) actions.push(`Add one feature that uses your learning focus: ${learning.content}`);
  }

  if (mode === "debug_next") {
    if (mythic) actions.push(`Start from prior Mythic evidence before debugging: ${mythic.content}`);
    if (episodic) actions.push(`Re-check similar bug pattern: ${episodic.content}`);
    if (project) actions.push(`Reproduce inside current project flow: ${project.content}`);
    if (preference) actions.push(`Apply your known technical preference while fixing: ${preference.content}`);
  }

  if (mode === "learn_next") {
    if (mythic) actions.push(`Study why this Mythic run succeeded: ${mythic.content}`);
    if (learning) actions.push(`Study this next: ${learning.content}`);
    if (project) actions.push(`Practice learning directly in project work: ${project.content}`);
    if (preference) actions.push(`Use your preferred tools while learning: ${preference.content}`);
  }

  if (actions.length === 0) {
    actions.push(`Break this question into one concrete next task: ${question}`);
    actions.push("Define success criteria for that task in one sentence.");
    actions.push("Execute the smallest testable step and record outcome.");
  }

  return actions.slice(0, 3);
}

function getPreviousContinuityContext(
  previousCheckpoint: Record<string, unknown> | null | undefined,
): PreviousContinuityContext {
  if (!previousCheckpoint) {
    return {};
  }

  const rawResult = previousCheckpoint.result;
  if (!rawResult || typeof rawResult !== "object") {
    return {};
  }

  const result = rawResult as Record<string, unknown>;
  const rawDebug =
    result.debug && typeof result.debug === "object"
      ? (result.debug as Record<string, unknown>)
      : undefined;

  return {
    previousNextActions: Array.isArray(result.nextActions)
      ? result.nextActions.filter(
          (value): value is string => typeof value === "string" && value.length > 0,
        )
      : undefined,
    previousMode:
      typeof result.mode === "string"
        ? result.mode
        : typeof rawDebug?.mode === "string"
          ? rawDebug.mode
          : undefined,
  };
}

function mergeNextActions(
  currentNextActions: string[],
  previousNextActions?: string[],
): string[] {
  return [...currentNextActions, ...(previousNextActions ?? [])]
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 5);
}

export async function planContinuity(
  input: ContinuityPlannerScopedInput,
): Promise<ContinuityPlannerResult> {
  const mode: ContinuityMode = input.mode ?? "build_next";
  const previousContext = getPreviousContinuityContext(input.previousCheckpoint);

  const [retrieval, mythicUsedMemories] = await Promise.all([
    retrieveRelevantMemory({
      userId: input.userId,
      question: input.question,
      topK: input.topK ?? 5,
      includeArchived: input.includeArchived ?? false,
      ...(input.workspace ? { workspace: input.workspace } : {}),
      ...(input.project ? { project: input.project } : {}),
      ...(input.threadId ? { threadId: input.threadId } : {}),
      ...(input.repo ? { repo: input.repo } : {}),
      ...(input.service ? { service: input.service } : {}),
      ...(input.environment ? { environment: input.environment } : {}),
      ...(input.taskId ? { taskId: input.taskId } : {}),
    }),
    loadMythicUsedMemories(input),
  ]);

  const usedMemories = Array.from(
    new Map(
      [...mythicUsedMemories, ...retrieval.memories.map(toUsedMemory)].map((memory) => [
        memory.id,
        memory,
      ]),
    ).values(),
  );
  const currentNextActions = buildActions(mode, input.question, usedMemories);
  const nextActions =
    usedMemories.length === 0 && previousContext.previousNextActions?.length
      ? previousContext.previousNextActions
      : mergeNextActions(currentNextActions, previousContext.previousNextActions);

  return {
    nextActions,
    usedMemories,
    debug: {
      mode,
      retrieval: retrieval.debug,
    },
  };
}
