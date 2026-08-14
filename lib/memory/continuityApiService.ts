import { loadProjectDriftBriefLines } from "../companyBrain/operationalLoopService";
import { listOperationalLoops } from "../companyBrain/operationalLoopStore";
import type { OperationalLoop, OperationalLoopState } from "../companyBrain/operationalLoopTypes";
import {
  compileOperationalMap,
  type OperationalMapNode,
} from "../companyBrain/operationalMapCompiler";
import type {
  ContinuityScorePayload,
  DecisionHistoryEntry,
  ExecutionHistoryPayload,
  MemoryWhyPayload,
  ProjectStateSnapshot,
  RankedNextAction,
} from "../api/continuityApiTypes";
import { projectMatchesMemory } from "../continuity/projectScope";
import { explainMemory } from "./explainMemory";
import { listActionMemories, listActionMemoriesWithLineage } from "./actionMemoryStore";
import { listMemories } from "./listMemory";
import { planResume } from "./resumePlanner";
import {
  resolveMemorySourceFiles,
  resolveMemorySourceRef,
} from "./sourceMetadata";
import type { Memory, MemoryContractCategory } from "./types";
import { retrieveRelevantMemory } from "./retrieveRelevantMemory";

export type ContinuityApiScope = {
  userId: string;
  orgId?: string;
  projectId: string;
};

const TERMINAL_LOOP_STATES = new Set<OperationalLoopState>([
  "completed",
  "failed",
  "rolled_back",
]);

function filterMemoriesForProject(memories: Memory[], projectId: string): Memory[] {
  return memories.filter((memory) => projectMatchesMemory(projectId, memory));
}

function memoryConfidence(memory: Memory): number {
  return Math.max(0, Math.min(1, memory.importanceScore ?? 0));
}

async function findActiveLoop(scope: ContinuityApiScope): Promise<OperationalLoop | null> {
  const loops = await listOperationalLoops(scope.userId, {
    orgId: scope.orgId,
    projectId: scope.projectId,
    limit: 10,
  });
  const active = loops.find((loop) => !TERMINAL_LOOP_STATES.has(loop.currentState));
  if (active) return active;

  const recent = await listOperationalLoops(scope.userId, {
    orgId: scope.orgId,
    limit: 20,
  });
  const projectKey = scope.projectId.trim().toLowerCase();
  return (
    recent.find((loop) => {
      if (TERMINAL_LOOP_STATES.has(loop.currentState)) return false;
      if (loop.projectId?.trim().toLowerCase() === projectKey) return true;
      return projectKey.length > 0 && loop.goal.toLowerCase().includes(projectKey);
    }) ?? null
  );
}

async function findLastAction(scope: ContinuityApiScope) {
  const actions = await listActionMemories(scope.userId, {
    orgId: scope.orgId,
    limit: 40,
  });
  const projectKey = scope.projectId.trim().toLowerCase();
  return (
    actions.find((entry) => {
      if (entry.projectId?.trim().toLowerCase() === projectKey) return true;
      const blob = `${entry.action} ${entry.reason}`.toLowerCase();
      return projectKey.length > 0 && blob.includes(projectKey);
    }) ?? null
  );
}

export async function getProjectStateSnapshot(
  scope: ContinuityApiScope,
): Promise<ProjectStateSnapshot> {
  const [resume, activeLoop, driftBrief, lastAction] = await Promise.all([
    planResume({
      userId: scope.userId,
      orgId: scope.orgId,
      project: scope.projectId,
      question: "What is the current project state?",
    }),
    findActiveLoop(scope),
    loadProjectDriftBriefLines(
      { userId: scope.userId, orgId: scope.orgId },
      scope.projectId,
      4,
    ),
    findLastAction(scope),
  ]);

  return {
    projectId: scope.projectId,
    briefSummary: {
      currentGoal: resume.brief.currentGoal,
      whatChangedRecently: resume.brief.whatChangedRecently,
      openBlockers: resume.brief.openBlockers,
      nextBestAction: resume.brief.nextBestAction,
    },
    activeLoop: activeLoop
      ? {
          loopId: activeLoop.id,
          goal: activeLoop.goal,
          state: activeLoop.currentState,
          updatedAt: activeLoop.updatedAt,
        }
      : null,
    driftFlag: driftBrief.hasUnresolvedHighDrift,
    driftSummary: driftBrief.lines[0] ?? null,
    lastAction,
    resumeConfidenceScore: resume.brief.resumeConfidence.score,
  };
}

export async function getRankedNextActions(
  scope: ContinuityApiScope,
  limit: number,
): Promise<RankedNextAction[]> {
  const [resume, listed] = await Promise.all([
    planResume({
      userId: scope.userId,
      orgId: scope.orgId,
      project: scope.projectId,
      question: "What should we do next?",
      topK: 8,
    }),
    listMemories({ userId: scope.userId, orgId: scope.orgId, limit: 120 }),
  ]);

  const contractActions = filterMemoriesForProject(listed.memories, scope.projectId)
    .filter((memory) => memory.contractCategory === "next_action")
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime() ||
        memoryConfidence(right) - memoryConfidence(left),
    )
    .map((memory, index): RankedNextAction => ({
      id: `memory:${memory.id}`,
      text: memory.summary?.trim() || memory.content.trim(),
      source: "contract_memory",
      contractCategory: memory.contractCategory,
      rank: index + 1,
      confidence: memoryConfidence(memory),
      memoryId: memory.id,
    }));

  const briefActions = resume.brief.nextRecommendedActions.map((text, index): RankedNextAction => ({
    id: `brief:${index}`,
    text,
    source: "resume_brief",
    rank: contractActions.length + index + 1,
    confidence: resume.brief.resumeConfidence.score / 100,
  }));

  const seen = new Set<string>();
  const merged: RankedNextAction[] = [];
  if (resume.brief.nextBestAction.trim()) {
    const key = resume.brief.nextBestAction.trim().toLowerCase();
    seen.add(key);
    merged.push({
      id: "brief:next-best",
      text: resume.brief.nextBestAction,
      source: "resume_brief",
      rank: 1,
      confidence: resume.brief.resumeConfidence.score / 100,
    });
  }
  for (const action of [...contractActions, ...briefActions]) {
    const key = action.text.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push({ ...action, rank: merged.length + 1 });
  }

  return merged.slice(0, limit);
}

export async function getDecisionHistory(
  scope: ContinuityApiScope,
  limit: number,
): Promise<DecisionHistoryEntry[]> {
  const listed = await listMemories({ userId: scope.userId, orgId: scope.orgId, limit: 150 });
  return filterMemoriesForProject(listed.memories, scope.projectId)
    .filter((memory): memory is Memory & { contractCategory: MemoryContractCategory } =>
      Boolean(memory.contractCategory),
    )
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, limit)
    .map((memory) => ({
      memoryId: memory.id,
      summary: memory.summary?.trim() || memory.content.trim().slice(0, 240),
      content: memory.content,
      contractCategory: memory.contractCategory,
      updatedAt: memory.updatedAt,
      confidence: memoryConfidence(memory),
      sourceRef: resolveMemorySourceRef(memory),
      files: resolveMemorySourceFiles(memory),
    }));
}

export type OperationalMapSectionChild = {
  id: string;
  label: string;
  type: string;
};

export type OperationalMapSection = {
  sectionId: string;
  label: string;
  nodeCount: number;
  contractCategories: MemoryContractCategory[];
  children: OperationalMapSectionChild[];
};

const OPERATIONAL_SECTION_BY_CATEGORY: Partial<
  Record<MemoryContractCategory, { sectionId: string; label: string }>
> = {
  decision: { sectionId: "decisions", label: "Decisions" },
  runbook: { sectionId: "runbooks", label: "Runbooks" },
  incident: { sectionId: "incidents", label: "Incidents" },
  blocker: { sectionId: "blockers", label: "Blockers" },
  bug: { sectionId: "bugs", label: "Bugs" },
  architecture_note: { sectionId: "architecture", label: "Architecture" },
  preference: { sectionId: "preferences", label: "Preferences" },
  policy: { sectionId: "policies", label: "Policies" },
  previous_attempt: { sectionId: "previous-attempts", label: "Previous attempts" },
  model_tool_update: { sectionId: "model-tool-updates", label: "Model & tool updates" },
  risky_file: { sectionId: "risky-files", label: "Risky files" },
  next_action: { sectionId: "next-actions", label: "Next actions" },
};

export async function getOperationalMapSections(
  scope: ContinuityApiScope,
): Promise<{
  sections: OperationalMapSection[];
  nodes: OperationalMapNode[];
  edges: ReturnType<typeof compileOperationalMap>["edges"];
}> {
  const listed = await listMemories({ userId: scope.userId, orgId: scope.orgId, limit: 200 });
  const projectMemories = filterMemoriesForProject(listed.memories, scope.projectId);
  const compiled = compileOperationalMap({ memories: projectMemories });
  const sectionCounts = new Map<string, OperationalMapSection>();

  for (const node of compiled.nodes) {
    const category = node.contractCategory;
    if (!category) continue;
    const mapped = OPERATIONAL_SECTION_BY_CATEGORY[category];
    if (!mapped) continue;
    const child: OperationalMapSectionChild = {
      id: node.id,
      label: node.label,
      type: node.type,
    };
    const existing = sectionCounts.get(mapped.sectionId);
    if (existing) {
      existing.nodeCount += 1;
      if (existing.children.length < 12) {
        existing.children.push(child);
      }
      continue;
    }
    sectionCounts.set(mapped.sectionId, {
      sectionId: mapped.sectionId,
      label: mapped.label,
      nodeCount: 1,
      contractCategories: [category],
      children: [child],
    });
  }

  return {
    sections: Array.from(sectionCounts.values()).sort((a, b) => a.label.localeCompare(b.label)),
    nodes: compiled.nodes,
    edges: compiled.edges,
  };
}

export async function getContinuityScore(scope: ContinuityApiScope): Promise<ContinuityScorePayload> {
  const resume = await planResume({
    userId: scope.userId,
    orgId: scope.orgId,
    project: scope.projectId,
    question: "Continuity score",
  });
  return resume.brief.resumeConfidence;
}

export async function explainMemoryWhy(
  scope: ContinuityApiScope,
  memoryId: string,
): Promise<MemoryWhyPayload | null> {
  const explained = await explainMemory({ memoryId, userId: scope.userId });
  if (!explained) return null;

  const retrieval = await retrieveRelevantMemory({
    userId: scope.userId,
    question: `${scope.projectId} continuity context`,
    project: scope.projectId,
    topK: 12,
  });
  const ranked = retrieval.memories.find((memory) => memory.id === memoryId);
  const debug = retrieval.debug.find((item) => item.id === memoryId);
  const contractCategory =
    ranked?.contractCategory ??
    (typeof explained.memory.rawMetadata.contractCategory === "string"
      ? (explained.memory.rawMetadata.contractCategory as MemoryContractCategory)
      : undefined);

  const whySelected = ranked
    ? `Ranked in project retrieval with final score ${ranked.finalScore.toFixed(3)}${
        debug?.reasonTags?.length ? ` (${debug.reasonTags.join(", ")})` : ""
      }.`
    : explained.explanation.whySaved;

  return {
    memoryId,
    whySelected,
    source: explained.memory.source,
    confidence: explained.memory.confidence,
    contractCategory,
    explanation: {
      whySaved: explained.explanation.whySaved,
      status: explained.explanation.status,
      stalenessBucket: explained.explanation.stalenessBucket,
    },
  };
}

export async function getExecutionHistory(
  scope: ContinuityApiScope,
  limit: number,
  sourceId?: string,
): Promise<ExecutionHistoryPayload> {
  const items = await listActionMemoriesWithLineage(scope.userId, {
    orgId: scope.orgId,
    limit,
    sourceId,
  });
  const projectKey = scope.projectId.trim().toLowerCase();
  const filtered = projectKey
    ? items.filter((entry) => {
        const action = entry.actionMemory;
        if (action.projectId?.trim().toLowerCase() === projectKey) return true;
        const blob = `${action.action} ${action.reason}`.toLowerCase();
        return blob.includes(projectKey);
      })
    : items;

  return {
    items: filtered,
    actions: filtered.map((entry) => entry.actionMemory),
    count: filtered.length,
  };
}
