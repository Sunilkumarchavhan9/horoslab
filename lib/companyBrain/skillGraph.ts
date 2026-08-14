import { listMemories } from "../memory/listMemory";
import type { CompanyBrainTraceProof, Memory } from "../memory/types";
import { getMemoryStoreAdapter } from "../adapters/registry";
import { upsertRecentMemory } from "../memory/recentMemoryStore";
import { recordMemoryCreatedEvent } from "../memory/timelineMemory";

export type ExecutableSkill = {
  id: string;
  name: string;
  trigger: string;
  steps: string[];
  required_tests: string[];
  past_mistakes: string[];
  tools_allowed: string[];
  forbidden_actions: string[];
  approval_required: boolean;
  risk_level: string;
  evidence: string[];
  confidence: number;
  success_rate: number | null;
  supported_agent_types: string[];
  inheritance_rules: string[];
  status: "approved";
  version: string;
  source_experience_id: string;
  source_ref: string | null;
  outcome_history: SkillOutcomeHistoryEntry[];
  trace_proof?: CompanyBrainTraceProof;
};

export type SkillOutcomeStatus = "success" | "failed" | "rolled_back" | "unknown";

export type SkillOutcomeHistoryEntry = {
  outcomeId: string;
  status: SkillOutcomeStatus;
  sourceRef: string;
  agentId: string | null;
  experienceRecordId: string | null;
  executionOutcomeId: string | null;
  recordedAt: string;
};

export type SkillCandidateView = {
  id: string;
  name: string;
  trigger: string;
  steps: string[];
  requiredTests: string[];
  pastMistakes: string[];
  evidence: string[];
  sourceExperienceId: string;
  riskLevel: string;
  status: "pending" | "approved" | "rejected";
  version: string;
  confidence: number;
  successRate: number | null;
  outcomeCount: number;
  successCount: number;
  failureCount: number;
  supportedAgents: string[];
  inheritanceRules: string[];
  updatedAt: string;
  traceProof: Memory["traceProof"];
};

export type ApprovedSkillSelection = {
  skills: ExecutableSkill[];
  traceProof: Array<{
    memoryId: string;
    sourceType: string;
    sourceRef: string | null;
    confidence: number;
    evidence: string[];
  }>;
};

function readMemoryLabel(content: string, label: string): string {
  const lines = content.split("\n");
  return lines.find((line) => line.toLowerCase().startsWith(`${label.toLowerCase()}:`))
    ?.slice(label.length + 1)
    .trim() ?? "";
}

function splitMemoryLabel(content: string, label: string): string[] {
  return readMemoryLabel(content, label)
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readOutcomeHistory(content: string): SkillOutcomeHistoryEntry[] {
  return content
    .split("\n")
    .filter((line) => line.startsWith("Skill outcome: "))
    .map((line) => line.slice("Skill outcome: ".length).trim())
    .map((raw) => {
      try {
        const parsed = JSON.parse(raw) as Partial<SkillOutcomeHistoryEntry>;
        if (!parsed.outcomeId || !parsed.status || !parsed.sourceRef || !parsed.recordedAt) return null;
        const status = normalizeSkillOutcomeStatus(parsed.status);
        return {
          outcomeId: parsed.outcomeId,
          status,
          sourceRef: parsed.sourceRef,
          agentId: typeof parsed.agentId === "string" ? parsed.agentId : null,
          experienceRecordId: typeof parsed.experienceRecordId === "string" ? parsed.experienceRecordId : null,
          executionOutcomeId: typeof parsed.executionOutcomeId === "string" ? parsed.executionOutcomeId : null,
          recordedAt: parsed.recordedAt,
        };
      } catch {
        return null;
      }
    })
    .filter((entry): entry is SkillOutcomeHistoryEntry => Boolean(entry));
}

function normalizeSkillOutcomeStatus(value: string): SkillOutcomeStatus {
  const normalized = value.toLowerCase();
  if (normalized === "success" || normalized === "succeeded" || normalized === "executed" || normalized === "done") return "success";
  if (normalized === "rolled_back" || normalized === "rollback") return "rolled_back";
  if (normalized === "failed" || normalized === "failure" || normalized === "error") return "failed";
  return "unknown";
}

function successRateFrom(outcomes: SkillOutcomeHistoryEntry[]): number | null {
  if (outcomes.length === 0) return null;
  const successes = outcomes.filter((outcome) => outcome.status === "success").length;
  return Math.round((successes / outcomes.length) * 100);
}

function updateOrAppendLine(content: string, label: string, value: string): string {
  const prefix = `${label}:`;
  const lines = content.split("\n");
  const index = lines.findIndex((line) => line.toLowerCase().startsWith(prefix.toLowerCase()));
  const nextLine = `${label}: ${value}`;
  if (index >= 0) {
    lines[index] = nextLine;
    return lines.join("\n");
  }
  return [...lines, nextLine].join("\n");
}

function textMatches(value: string | undefined, query: string): boolean {
  return Boolean(value?.toLowerCase().includes(query.toLowerCase()));
}

function memoryMatchesScope(memory: Memory, input: { project?: string; workspace?: string; repo?: string }): boolean {
  const graphRefs = memory.graph?.edgeRefs ?? [];
  const signals = [
    ...(memory.developerSignals?.projectArea ?? []),
    ...(memory.developerSignals?.goal ?? []),
    memory.summary,
    memory.content,
  ];

  const checks = [
    input.project ? [`project:${input.project}`, input.project] : null,
    input.workspace ? [`workspace:${input.workspace}`, input.workspace] : null,
    input.repo ? [`repo:${input.repo}`, input.repo] : null,
  ].filter((item): item is string[] => Array.isArray(item));

  if (checks.length === 0) return true;

  return checks.some(([edgeRef, value]) =>
    graphRefs.includes(edgeRef) || signals.some((signal) => textMatches(signal, value)),
  );
}

export function parseSkillGraphCandidate(memory: Memory): SkillCandidateView | null {
  if (!(memory.sourceRef ?? "").startsWith("skill_candidate:")) return null;
  const status = readMemoryLabel(memory.content, "Skill status");
  const normalizedStatus =
    status === "approved" || status === "rejected" || status === "pending"
      ? status
      : "pending";
  const outcomes = readOutcomeHistory(memory.content);
  const successCount = outcomes.filter((outcome) => outcome.status === "success").length;
  const failureCount = outcomes.filter((outcome) => outcome.status === "failed" || outcome.status === "rolled_back").length;

  return {
    id: memory.id,
    name: readMemoryLabel(memory.content, "Skill") || memory.summary.replace(/^Skill Candidate:\s*/i, ""),
    trigger: readMemoryLabel(memory.content, "Trigger"),
    steps: splitMemoryLabel(memory.content, "Steps"),
    requiredTests: splitMemoryLabel(memory.content, "Required tests"),
    pastMistakes: splitMemoryLabel(memory.content, "Past mistakes"),
    evidence: memory.traceProof?.evidence ?? splitMemoryLabel(memory.content, "Evidence"),
    sourceExperienceId: readMemoryLabel(memory.content, "Source experience"),
    riskLevel: readMemoryLabel(memory.content, "Risk level") || "medium",
    status: normalizedStatus,
    version: readMemoryLabel(memory.content, "Version") || "0.1.0",
    confidence: memory.confidence,
    successRate: successRateFrom(outcomes),
    outcomeCount: outcomes.length,
    successCount,
    failureCount,
    supportedAgents: splitMemoryLabel(memory.content, "Supported agents"),
    inheritanceRules: splitMemoryLabel(memory.content, "Inheritance rules"),
    updatedAt: memory.updatedAt,
    traceProof: memory.traceProof,
  };
}

function parseApprovedExecutableSkill(memory: Memory): ExecutableSkill | null {
  if (memory.status !== "active") return null;
  if (memory.freshness?.status === "stale") return null;
  if (memory.conflict?.status === "possible_conflict") return null;
  const candidate = parseSkillGraphCandidate(memory);
  if (!candidate || candidate.status !== "approved") return null;

  const requiredTests = candidate.requiredTests.filter(
    (test) => !/reviewer must define/i.test(test),
  );
  const outcomes = readOutcomeHistory(memory.content);

  return {
    id: candidate.id,
    name: candidate.name,
    trigger: candidate.trigger,
    steps: candidate.steps,
    required_tests: requiredTests,
    past_mistakes: candidate.pastMistakes.filter((item) => item !== "None captured"),
    tools_allowed: [],
    forbidden_actions: [],
    approval_required: /high|critical|blocked/i.test(candidate.riskLevel),
    risk_level: candidate.riskLevel,
    evidence: candidate.evidence,
    confidence: candidate.confidence,
    success_rate: candidate.successRate,
    supported_agent_types: candidate.supportedAgents,
    inheritance_rules: candidate.inheritanceRules,
    status: "approved",
    version: candidate.version,
    source_experience_id: candidate.sourceExperienceId,
    source_ref: memory.sourceRef ?? null,
    outcome_history: outcomes,
    ...(memory.traceProof ? { trace_proof: memory.traceProof } : {}),
  };
}

export async function selectApprovedExecutableSkills(input: {
  userId: string;
  orgId?: string | null;
  project?: string;
  workspace?: string;
  repo?: string;
  taskIntent?: string;
  agentId?: string;
  limit?: number;
}): Promise<ApprovedSkillSelection> {
  const result = await listMemories({
    userId: input.userId,
    ...(input.orgId ? { orgId: input.orgId } : {}),
    status: "active",
    type: "learning",
    limit: 200,
  });

  const agentId = input.agentId?.toLowerCase();
  const taskText = input.taskIntent?.toLowerCase();
  const limit = Math.min(Math.max(input.limit ?? 8, 1), 20);

  const skills = result.memories
    .filter((memory) => memoryMatchesScope(memory, input))
    .map(parseApprovedExecutableSkill)
    .filter((skill): skill is ExecutableSkill => Boolean(skill))
    .filter((skill) => {
      if (!agentId) return true;
      return skill.supported_agent_types.length === 0 || skill.supported_agent_types.some((agent) => agent.toLowerCase() === agentId);
    })
    .map((skill) => {
      const relevanceText = [
        skill.name,
        skill.trigger,
        skill.steps.join(" "),
        skill.inheritance_rules.join(" "),
      ].join(" ").toLowerCase();
      const taskBoost = taskText && relevanceText.includes(taskText) ? 0.05 : 0;
      return { skill, score: Math.min(1, skill.confidence + taskBoost) };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ skill }) => skill);

  return {
    skills,
    traceProof: skills.map((skill) => ({
      memoryId: skill.id,
      sourceType: "approved_skill",
      sourceRef: skill.source_ref,
      confidence: skill.confidence,
      evidence: skill.evidence,
    })),
  };
}

export async function recordSkillOutcome(input: {
  userId: string;
  orgId?: string | null;
  skillId: string;
  status: string;
  sourceRef: string;
  agentId?: string | null;
  experienceRecordId?: string | null;
  executionOutcomeId?: string | null;
}): Promise<ExecutableSkill | null> {
  const memories = await listMemories({
    userId: input.userId,
    ...(input.orgId ? { orgId: input.orgId } : {}),
    status: "active",
    type: "learning",
    limit: 200,
  });
  const memory = memories.memories.find((candidate) => candidate.id === input.skillId);
  if (!memory || !(memory.sourceRef ?? "").startsWith("skill_candidate:")) return null;
  const skill = parseApprovedExecutableSkill(memory);
  if (!skill) return null;

  const now = new Date().toISOString();
  const existingOutcomes = readOutcomeHistory(memory.content);
  const outcomeId = `${input.sourceRef}:${input.skillId}`;
  const withoutDuplicate = existingOutcomes.filter((outcome) => outcome.outcomeId !== outcomeId);
  const nextOutcome: SkillOutcomeHistoryEntry = {
    outcomeId,
    status: normalizeSkillOutcomeStatus(input.status),
    sourceRef: input.sourceRef,
    agentId: input.agentId ?? null,
    experienceRecordId: input.experienceRecordId ?? null,
    executionOutcomeId: input.executionOutcomeId ?? null,
    recordedAt: now,
  };
  const nextOutcomes = [...withoutDuplicate, nextOutcome].slice(-50);
  const successRate = successRateFrom(nextOutcomes);
  const successes = nextOutcomes.filter((outcome) => outcome.status === "success").length;
  const failures = nextOutcomes.filter((outcome) => outcome.status === "failed" || outcome.status === "rolled_back").length;
  const confidenceDelta = nextOutcome.status === "success" ? 0.03 : nextOutcome.status === "unknown" ? 0 : -0.06;
  const nextConfidence = Math.max(0.35, Math.min(0.98, memory.confidence + confidenceDelta));

  let nextContent = memory.content
    .split("\n")
    .filter((line) => !line.startsWith("Skill outcome: "))
    .join("\n");
  nextContent = updateOrAppendLine(nextContent, "Success rate", successRate === null ? "Not enough outcomes" : `${successRate}%`);
  nextContent = updateOrAppendLine(nextContent, "Outcome count", String(nextOutcomes.length));
  nextContent = updateOrAppendLine(nextContent, "Success count", String(successes));
  nextContent = updateOrAppendLine(nextContent, "Failure count", String(failures));
  nextContent = updateOrAppendLine(nextContent, "Last outcome status", nextOutcome.status);
  nextContent = [
    nextContent,
    ...nextOutcomes.map((outcome) => `Skill outcome: ${JSON.stringify(outcome)}`),
  ].join("\n");

  const nextMemory: Memory = {
    ...memory,
    content: nextContent,
    confidence: nextConfidence,
    updatedAt: now,
    evidenceCount: Math.max(memory.evidenceCount, (memory.traceProof?.evidence?.length ?? 0) + nextOutcomes.length),
    traceProof: memory.traceProof
      ? {
          ...memory.traceProof,
          evidence: Array.from(new Set([
            ...memory.traceProof.evidence,
            input.sourceRef,
            ...(input.experienceRecordId ? [`experience:${input.experienceRecordId}`] : []),
            ...(input.executionOutcomeId ? [`execution-outcome:${input.executionOutcomeId}`] : []),
          ])).slice(-80),
          confidence: nextConfidence,
          capturedAt: now,
        }
      : undefined,
  };
  await getMemoryStoreAdapter().saveMemory({ memory: nextMemory });
  await upsertRecentMemory(nextMemory, input.orgId ?? undefined);
  await recordMemoryCreatedEvent(
    nextMemory,
    `Phase 4 skill outcome recorded (${nextOutcome.status}).`,
  );
  return parseApprovedExecutableSkill(nextMemory);
}
