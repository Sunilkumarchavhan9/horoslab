import { randomUUID } from "crypto";
import { runIngestFlowLangGraph } from "../workflows/ingestGraphLangGraph";
import { runRetrieveFlowLangGraph } from "../workflows/retrieveGraphLangGraph";
import { runResumeFlowLangGraph } from "../workflows/resumeGraphLangGraph";
import { createActionMemory, createExecutionOutcome } from "../memory/actionMemoryStore";
import { persistExperienceGraphMemory } from "../companyBrain/experienceGraph";
import { recordSkillOutcome, selectApprovedExecutableSkills } from "../companyBrain/skillGraph";
import type {
  AfterModelInput as SdkAfterModelInput,
  AfterModelResult,
  BeforeModelInput as SdkBeforeModelInput,
  BeforeModelResult,
  MemoryIgnitionApprovalRuleRetrieval,
  MemoryIgnitionBriefProofQuality,
  MemoryIgnitionCopyToAgent,
  MemoryIgnitionEvaluationGate,
  MemoryIgnitionExecutableSkill,
  MemoryIgnitionExperiencePromotionProof,
  MemoryIgnitionExperienceQualityGate,
  MemoryIgnitionGatedMemory,
  MemoryIgnitionGatedSkill,
  MemoryIgnitionInheritanceGate,
  MemoryIgnitionMemory,
  MemoryIgnitionOutcomeContract,
  MemoryIgnitionOutcomeLearningGate,
  MemoryIgnitionRankedInheritanceItem,
  MemoryIgnitionRelatedExperience,
  MemoryIgnitionRequiredTestRetrieval,
  MemoryIgnitionRiskyFileRetrieval,
  MemoryIgnitionSkillSelectionGate,
  MemoryIgnitionStandardInheritancePackage,
  MemoryIgnitionTaskUnderstanding,
  MemoryIgnitionTargetAgent,
  MemoryIgnitionThreeThings,
  MemoryIgnitionTraceProof,
  MemoryInheritanceReadiness,
  MemoryInheritanceReadinessSummary,
  MemoryItem,
} from "../../packages/epoch-sdk/src/types";

export type { AfterModelResult, BeforeModelResult };

export interface BeforeModelInput extends SdkBeforeModelInput {
  orgId?: string;
  org_id?: string;
  repo?: string;
}

export interface AfterModelInput extends SdkAfterModelInput {
  orgId?: string;
  org_id?: string;
}

type RetrieveFlowResult = {
  memories?: Array<MemoryItem & Record<string, unknown>>;
  debug?: unknown;
};

type ResumeFlowResult = {
  summary?: string;
  lastKnownState?: string;
  openLoops?: string[];
  recommendedNextStep?: string;
  brief?: {
    riskyFiles?: string[];
    nextBestAction?: string;
  };
  usedMemories?: Array<MemoryItem & Record<string, unknown>>;
  debug?: unknown;
};

type IngestFlowResult = {
  acceptedMemories?: Array<{ id?: string }>;
  rejectedMemories?: Array<{ id?: string }>;
  timelineEvents?: unknown[];
};

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function memoryContent(memory: MemoryItem & Record<string, unknown>): string {
  return asText(memory.content, asText(memory.memory, asText(memory.summary, "MemoryOS memory")));
}

function memorySourceRef(memory: Record<string, unknown>): string | null {
  const metadata = memory.metadata && typeof memory.metadata === "object" ? memory.metadata as Record<string, unknown> : {};
  return asText(memory.source_ref, asText(memory.sourceRef, asText(metadata.source_ref, asText(metadata.sourceRef, asText(metadata.source, ""))))) || null;
}

function memoryFiles(memory: Record<string, unknown>): string[] {
  const metadata = memory.metadata && typeof memory.metadata === "object" ? memory.metadata as Record<string, unknown> : {};
  const raw = Array.isArray(memory.files) ? memory.files : Array.isArray(metadata.files) ? metadata.files : [];
  return raw.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function memoryCategory(memory: Record<string, unknown>): string | undefined {
  const metadata = memory.metadata && typeof memory.metadata === "object" ? memory.metadata as Record<string, unknown> : {};
  return asText(memory.contractCategory, asText(memory.contract_category, asText(metadata.contractCategory, asText(metadata.contract_category, "")))) || undefined;
}

function memoryMetadata(memory: Record<string, unknown>): Record<string, unknown> {
  return memory.metadata && typeof memory.metadata === "object" ? memory.metadata as Record<string, unknown> : {};
}

function rawMemoryIsStale(memory: Record<string, unknown>): boolean {
  const metadata = memoryMetadata(memory);
  const freshness = metadata.freshness && typeof metadata.freshness === "object"
    ? metadata.freshness as Record<string, unknown>
    : memory.freshness && typeof memory.freshness === "object"
      ? memory.freshness as Record<string, unknown>
      : {};
  return freshness.status === "stale" || metadata.stale === true;
}

function readLineValue(content: string, label: string): string | null {
  const prefix = `${label}:`;
  const line = content.split("\n").find((entry) => entry.toLowerCase().startsWith(prefix.toLowerCase()));
  return line ? line.slice(prefix.length).trim() || null : null;
}

function readLineList(content: string, label: string): string[] {
  return (readLineValue(content, label) ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toRelatedExperience(memory: MemoryIgnitionMemory): MemoryIgnitionRelatedExperience | null {
  if (memory.source_ref?.startsWith("experience:") !== true && !/^Task:/im.test(memory.content)) return null;
  const task = readLineValue(memory.content, "Task");
  const outcome = readLineValue(memory.content, "Outcome");
  const lesson = readLineValue(memory.content, "Lesson");
  const instruction = readLineValue(memory.content, "Future-agent instruction");
  const files = readLineList(memory.content, "Files");
  const tests = readLineList(memory.content, "Tests");
  const evidence = readLineList(memory.content, "Evidence");
  const ready = Boolean(task && outcome && lesson && instruction && files.length > 0 && tests.length > 0);
  return {
    experience_id: memory.id,
    task: task ?? memory.summary ?? memory.content.slice(0, 100),
    problem: readLineValue(memory.content, "Problem"),
    context: readLineValue(memory.content, "Context"),
    action: readLineValue(memory.content, "Action"),
    mistake: readLineValue(memory.content, "Mistake"),
    outcome,
    lesson,
    future_agent_instruction: instruction,
    evidence,
    files,
    tests,
    risk_level: readLineValue(memory.content, "Risk level"),
    source_ref: memory.source_ref,
    confidence: memory.final_score,
    quality_status: ready ? "ready_for_inheritance" : "needs_evidence",
    why_selected: Array.from(new Set(["experience", ...memory.reason_tags])),
    trace_lineage: "Source -> Outcome -> Experience -> Next MemoryIgnition Brief",
  };
}

function toIgnitionMemory(memory: MemoryItem & Record<string, unknown>): MemoryIgnitionMemory {
  const content = memoryContent(memory);
  const category = memoryCategory(memory);
  const metadata = memoryMetadata(memory);
  const freshness = metadata.freshness && typeof metadata.freshness === "object"
    ? metadata.freshness as Record<string, unknown>
    : {};
  return {
    id: asText(memory.id, `memory_${randomUUID().slice(0, 8)}`),
    content,
    summary: content.slice(0, 240),
    memory_type: asText(memory.memoryType, asText(memory.memory_type, "knowledge")),
    contract_category: category,
    final_score: typeof memory.finalScore === "number" ? memory.finalScore : 0.65,
    updated_at: asText(memory.updatedAt, new Date().toISOString()),
    source_ref: memorySourceRef(memory),
    files: memoryFiles(memory),
    reason_tags: [category, "retrieved_for_task"].filter((item): item is string => Boolean(item)),
    freshness: { status: typeof freshness.status === "string" ? freshness.status : "fresh" },
    conflict: { status: "none" },
  };
}

function buildRiskSignals(input: BeforeModelInput, memories: MemoryIgnitionMemory[]): string[] {
  const text = [
    input.question,
    input.task,
    input.task_intent,
    input.repo_or_task,
    ...(input.available_tools ?? []),
    ...memories.map((memory) => `${memory.content} ${memory.contract_category ?? ""}`),
  ].join(" ").toLowerCase();
  const signals = new Set<string>();
  if (input.risk_level === "high") signals.add("high_risk_request");
  if (/\b(auth|secret|token|payment|billing|production|database|schema|migration|delete|drop|deploy)\b/.test(text)) {
    signals.add("sensitive_system");
  }
  if (/\b(terminal|shell|write|edit|edit_files|delete|deploy)\b/.test(text)) signals.add("powerful_tool_available");
  if (memories.some((memory) => memory.contract_category === "risky_file")) signals.add("risky_file_memory");
  return Array.from(signals);
}

function deriveRisk(input: BeforeModelInput, riskSignals: string[]): string {
  if (input.risk_level === "high" || riskSignals.includes("sensitive_system")) return "high";
  if (input.risk_level === "low") return "low";
  return "medium";
}

function buildReadiness(memory: MemoryIgnitionMemory): MemoryInheritanceReadiness {
  const hasSource = Boolean(memory.source_ref);
  const hasEvidence = memory.final_score >= 0.5;
  const fresh = memory.freshness?.status !== "stale";
  const ok = hasSource && hasEvidence && fresh;
  const readyCount = [hasSource, true, hasEvidence, Boolean(memory.contract_category), fresh, true, true, ok].filter(Boolean).length;
  return {
    memoryId: memory.id,
    sourceRef: memory.source_ref,
    status: fresh ? ok ? "ready" : "review" : "blocked",
    readyCount,
    totalCount: 8,
    readyRatio: readyCount / 8,
    nextAction: ok ? "Ready for future-agent inheritance." : fresh ? "Add source evidence before inheritance." : "Source memory withheld from prompt.",
    steps: [
      { id: "source", label: "Source", ok: hasSource, detail: hasSource ? "Source proof linked." : "Missing source proof." },
      { id: "memory", label: "Memory", ok: true, detail: "Structured memory available." },
      { id: "evidence", label: "Evidence", ok: hasEvidence, detail: `Confidence ${Math.round(memory.final_score * 100)}%.` },
      { id: "contract", label: "Contract", ok: Boolean(memory.contract_category), detail: memory.contract_category ?? "No contract category." },
      { id: "freshness", label: "Freshness", ok: fresh, detail: fresh ? "Freshness evaluated." : "Memory is stale." },
      { id: "conflict", label: "Conflict", ok: true, detail: "No conflict blocking inheritance." },
      { id: "graph", label: "Graph", ok: true, detail: "Available for graph retrieval." },
      { id: "brief", label: "Brief", ok, detail: ok ? "Allowed in brief." : "Source memory withheld from prompt." },
    ],
  };
}

function buildOutcomeContract(): MemoryIgnitionOutcomeContract {
  return {
    version: "outcome_contract.v1",
    required: true,
    required_after: "agent_action",
    endpoint: "/api/memory/memoryignition/outcome",
    sdk_method: "memoryos.saveOutcome",
    mcp_tool: "memoryignition_save_outcome",
    required_fields: [
      "outcome_status",
      "files_touched",
      "tests_passed",
      "tests_failed",
      "what_worked",
      "what_failed",
      "future_agent_lesson",
    ],
    optional_fields: ["used_skill_ids", "risky_files_touched", "approvals_used", "trace_proof_ids"],
    hooks: [
      "Call memoryignition_save_outcome or POST /api/memory/memoryignition/outcome after action.",
      "Record changed files and test evidence.",
      "Promote durable lessons into experience.",
      "Update future MemoryIgnition briefs.",
    ],
    trace_lineage: "Inheritance Event -> Outcome -> Experience -> Future MemoryIgnition Brief",
    enforcement: "required_for_outcome_learning",
  };
}

async function buildBeforeResult(input: BeforeModelInput, source: "retrieve" | "resume", memories: MemoryItem[], resume?: ResumeFlowResult): Promise<BeforeModelResult> {
  const now = new Date().toISOString();
  const allMemories = memories.map((memory) => toIgnitionMemory(memory as MemoryItem & Record<string, unknown>));
  const isSkillRegistryMemory = (memory: MemoryIgnitionMemory): boolean =>
    memory.source_ref?.startsWith("skill_candidate:") === true ||
    /^Skill status:/im.test(memory.content) ||
    /^Skill:/im.test(memory.content);
  const companyBrainMemories = allMemories.filter((memory) => !isSkillRegistryMemory(memory));
  const relevantMemories = companyBrainMemories.filter((memory) => memory.freshness?.status !== "stale");
  const selectedSkills = await selectApprovedExecutableSkills({
    userId: input.userId,
    orgId: input.orgId ?? input.org_id ?? null,
    project: input.project ?? input.repo_or_task,
    workspace: input.workspace_id,
    repo: input.repo ?? input.repo_or_task,
    taskIntent: input.task_intent ?? input.task ?? input.question,
    agentId: input.agent_id,
  });
  const agentId = input.agent_id?.toLowerCase();
  const selectedSkillViews: MemoryIgnitionExecutableSkill[] = selectedSkills.skills
    .map((skill) => ({
      id: skill.id,
      name: skill.name,
      trigger: skill.trigger,
      steps: skill.steps,
      required_tests: skill.required_tests,
      past_mistakes: skill.past_mistakes,
      tools_allowed: skill.tools_allowed,
      forbidden_actions: skill.forbidden_actions,
      approval_required: skill.approval_required,
      risk_level: skill.risk_level,
      evidence: skill.evidence,
      confidence: skill.confidence,
      success_rate: skill.success_rate,
      supported_agent_types: skill.supported_agent_types,
      inheritance_rules: skill.inheritance_rules,
      status: skill.status,
      version: skill.version,
      source_experience_id: skill.source_experience_id,
      source_ref: skill.source_ref,
    }));
  const skillSupportsAgent = (skill: MemoryIgnitionExecutableSkill): boolean =>
    !agentId ||
    skill.supported_agent_types.length === 0 ||
    skill.supported_agent_types.some((agent) => agent.toLowerCase() === agentId);
  const skillIsDeprecated = (skill: MemoryIgnitionExecutableSkill): boolean =>
    /deprecated|do not use|blocked|reject/i.test([
      skill.name,
      skill.trigger,
      skill.steps.join(" "),
      skill.inheritance_rules.join(" "),
      skill.past_mistakes.join(" "),
    ].join(" "));
  const executableSkills = selectedSkillViews.filter((skill) => skillSupportsAgent(skill) && !skillIsDeprecated(skill));
  const blockedSkillRecords: MemoryIgnitionGatedSkill[] = selectedSkillViews
    .filter((skill) => !skillSupportsAgent(skill) || skillIsDeprecated(skill))
    .map((skill) => ({
      skill,
      status: "blocked",
      reason: skillIsDeprecated(skill)
        ? "Skill withheld by skill gate: deprecated or forbidden inheritance rule."
        : `Skill withheld by skill gate: unsupported agent ${input.agent_id ?? "agent"}.`,
      checks: [
        { id: "approval", label: "Approved", ok: true, detail: "Skill is approved." },
        { id: "agent_compatibility", label: "Agent compatibility", ok: skillSupportsAgent(skill), detail: skillSupportsAgent(skill) ? "Target agent is compatible." : `Supported agents: ${skill.supported_agent_types.join(", ") || "any"}.` },
        { id: "evidence", label: "Inheritance rule", ok: !skillIsDeprecated(skill), detail: skillIsDeprecated(skill) ? "Deprecated or forbidden rule blocks injection." : "No deprecated rule detected." },
        { id: "steps", label: "Brief injection", ok: false, detail: "Skill withheld by skill gate." },
      ],
    }));
  const executableSkillRecords: MemoryIgnitionGatedSkill[] = executableSkills.map((skill) => ({
    skill,
    status: "executable",
    reason: "Approved skill is compatible with this target agent.",
      checks: [
        { id: "approval", label: "Approved", ok: true, detail: "Skill is approved." },
        { id: "agent_compatibility", label: "Agent compatibility", ok: true, detail: `Target agent ${input.agent_id ?? "agent"} can inherit this skill.` },
        { id: "steps", label: "Brief injection", ok: true, detail: "Skill allowed in MemoryIgnition brief." },
      ],
    }));
  const riskSignals = buildRiskSignals(input, relevantMemories);
  const riskLevel = deriveRisk(input, riskSignals);
  const approvalRequired = riskLevel === "high" || riskSignals.includes("powerful_tool_available");
  const traceProof: MemoryIgnitionTraceProof[] = [
    ...relevantMemories.map((memory) => ({
      memory_id: memory.id,
      source_type: memory.source_ref?.split(":")[0] ?? "memory",
      source_ref: memory.source_ref,
      memory_type: memory.memory_type,
      contract_category: memory.contract_category,
      confidence: memory.final_score,
      retrieved_at: now,
      reason_tags: memory.reason_tags,
      files: memory.files,
    })),
    ...(selectedSkills.traceProof.length
      ? selectedSkills.traceProof.map((proof) => ({
          memory_id: proof.memoryId,
          source_type: "approved_skill",
          source_ref: proof.sourceRef,
          memory_type: "learning",
          contract_category: "runbook",
          confidence: proof.confidence,
          retrieved_at: now,
          reason_tags: ["approved_skill", "skill_registry"],
          files: [],
        }))
      : executableSkills.map((skill) => ({
          memory_id: skill.id,
          source_type: "approved_skill",
          source_ref: skill.source_ref,
          memory_type: "learning",
          contract_category: "runbook",
          confidence: skill.confidence,
          retrieved_at: now,
          reason_tags: ["approved_skill", "skill_registry"],
          files: [],
        }))),
  ];
  const readiness = companyBrainMemories.map(buildReadiness);
  const readinessById = new Map(readiness.map((item) => [item.memoryId, item]));
  const inheritedMemories: MemoryIgnitionGatedMemory[] = [];
  const reviewMemories: MemoryIgnitionGatedMemory[] = relevantMemories
    .map((memory) => {
      const memoryReadiness = readinessById.get(memory.id) ?? buildReadiness(memory);
      return { memory, readiness: memoryReadiness, reason: memoryReadiness.nextAction };
    })
    .filter((item) => item.memory.freshness?.status !== "stale");
  const blockedMemories: MemoryIgnitionGatedMemory[] = companyBrainMemories
    .map((memory) => {
      const memoryReadiness = readinessById.get(memory.id) ?? buildReadiness(memory);
      return { memory, readiness: memoryReadiness, reason: memoryReadiness.nextAction };
    })
    .filter((item) => item.readiness.status === "blocked");
  const inheritanceGate: MemoryIgnitionInheritanceGate = {
    version: "phase5.inheritance_gate.v1",
    status: reviewMemories.length || blockedMemories.length ? "review_required" : "open",
    can_inherit: relevantMemories.length > 0,
    inherited_count: inheritedMemories.length,
    review_count: reviewMemories.length,
    blocked_count: blockedMemories.length,
    withheld_count: blockedMemories.length,
    policy: "ready_and_review_only",
    next_actions: reviewMemories.length ? ["Review memories missing source proof before prompt injection."] : ["Use inherited memories in the brief."],
  };
  const relatedExperiences = relevantMemories
    .map(toRelatedExperience)
    .filter((experience): experience is MemoryIgnitionRelatedExperience => Boolean(experience));
  const readyExperiences = relatedExperiences.filter((experience) => experience.quality_status === "ready_for_inheritance");
  const needsEvidenceExperiences = relatedExperiences.filter((experience) => experience.quality_status === "needs_evidence");
  const requiredTests = Array.from(new Set([
    ...relatedExperiences.flatMap((experience) => experience.tests),
    ...executableSkills.flatMap((skill) => skill.required_tests),
    ...(riskLevel === "high" ? ["Run relevant regression tests before merge."] : []),
  ]));
  const hasInheritedRequiredTests = relatedExperiences.some((experience) => experience.tests.length > 0) ||
    executableSkills.some((skill) => skill.required_tests.length > 0);
  const proofScore = traceProof.length ? Math.min(1, 0.55 + traceProof.length * 0.1) : 0.35;
  const proofScorePercent = relevantMemories.length === 0 && executableSkills.length > 0
    ? 80
    : Math.min(100, Math.round((proofScore + 0.1) * 100));
  const proofStatus = proofScorePercent >= 85 ? "trusted" : proofScorePercent >= 55 ? "caution" : "weak";
  const proofQuality: MemoryIgnitionBriefProofQuality = {
    score: proofScorePercent,
    grade: proofScorePercent >= 85 ? "A" : proofScorePercent >= 70 ? "B" : proofScorePercent >= 50 ? "C" : "D",
    status: approvalRequired && traceProof.length === 0 ? "blocked" : proofStatus,
    trusted: proofScore >= 0.8,
    checks: [
      { id: "memory_evidence", label: "Memory evidence", ok: relevantMemories.length > 0, weight: 0.25, detail: `${relevantMemories.length} memories retrieved.` },
      { id: "trace_proof", label: "Trace proof", ok: traceProof.length > 0, weight: 0.25, detail: `${traceProof.length} trace links.` },
      { id: "approved_skills", label: "Approved skills", ok: executableSkills.length > 0, weight: 0.2, detail: `${executableSkills.length} approved skills selected.` },
      { id: "required_tests", label: "Required tests", ok: hasInheritedRequiredTests, weight: 0.15, detail: `${requiredTests.length} required tests inherited.` },
      { id: "risk", label: "Risk evaluated", ok: true, weight: 0.2, detail: `${riskLevel} risk.` },
      { id: "outcome", label: "Outcome contract", ok: true, weight: 0.15, detail: "Outcome learning contract attached." },
    ],
    missing_requirements: [
      ...(traceProof.length ? [] : ["Source trace proof"]),
      ...(relevantMemories.length ? [] : ["Company memory"]),
      ...(executableSkills.length ? [] : ["Approved skills"]),
      ...(hasInheritedRequiredTests ? [] : ["Required tests"]),
    ],
    recommendations: traceProof.length ? ["Save outcome after action."] : ["Connect source evidence before risky execution."],
  };
  const evaluationGate: MemoryIgnitionEvaluationGate = {
    status: relevantMemories.length === 0 ? "blocked" : proofQuality.status,
    can_inherit: relevantMemories.length > 0,
    can_execute: proofQuality.status === "trusted" && !approvalRequired,
    requires_human_review: approvalRequired || proofQuality.status !== "trusted",
    reason: approvalRequired || proofQuality.status !== "trusted"
      ? "Human review required because proof is not strong enough for direct execution."
      : "MemoryIgnition proof is sufficient for this action.",
    blockers: relevantMemories.length === 0 ? ["No Company Brain memory was inherited."] : proofQuality.status === "blocked" ? proofQuality.missing_requirements : [],
    warnings: approvalRequired || proofQuality.status !== "trusted"
      ? ["MemoryIgnition proof is not strong enough for direct execution; review before action."]
      : [],
    next_required_actions: approvalRequired ? ["Record human approval before execution."] : ["Proceed and save outcome."],
  };
  const approvalRules = {
    risk_level: input.risk_level ?? riskLevel,
    derived_risk_level: riskLevel,
    approval_required: approvalRequired,
    reason: evaluationGate.reason,
    allowed_tools: input.available_tools ?? [],
    risk_signals: riskSignals,
  };
  const taskUnderstanding: MemoryIgnitionTaskUnderstanding = {
    task: input.task ?? input.question,
    task_intent: input.task_intent ?? input.task ?? input.question,
    target_agent: input.agent_id ?? "agent",
    source_mode: source,
    risk_level: riskLevel,
    available_tools: input.available_tools ?? [],
  };
  const targetAgent: MemoryIgnitionTargetAgent = {
    id: input.agent_id ?? "agent",
    supported: true,
    delivery: "copy_prompt",
  };
  const riskyFiles = Array.from(new Set([
    ...relevantMemories.flatMap((memory) => memory.files),
    ...(resume?.brief?.riskyFiles ?? []),
    ...(riskSignals.includes("sensitive_system") ? ["auth", "secrets", "schema", "production"] : []),
  ])).slice(0, 20);
  const forbiddenActions = riskLevel === "high" ? ["Do not deploy, delete data, or bypass approval without recorded human approval."] : [];
  const skillGate: MemoryIgnitionSkillSelectionGate = {
    version: "phase5.skill_gate.v1",
    status: blockedSkillRecords.length ? "review_required" : "open",
    can_execute_skills: true,
    executable_count: executableSkills.length,
    review_count: 0,
    blocked_count: blockedSkillRecords.length,
    withheld_count: blockedSkillRecords.length,
    policy: "approved_compatible_source_backed_only",
    next_actions: executableSkills.length
      ? ["Inject approved executable skills into the agent brief."]
      : ["No approved executable skills selected yet."],
  };
  const threeThings: MemoryIgnitionThreeThings = {
    version: "memoryignition_three_things.v1",
    what_agent_needs_to_know: [
      ...readyExperiences.slice(0, 2).map((experience) => experience.future_agent_instruction ?? experience.lesson ?? experience.task),
      ...relevantMemories.slice(0, 3).map((memory) => memory.summary ?? memory.content),
    ].filter((item): item is string => Boolean(item)).slice(0, 3),
    what_agent_must_be_careful_about: [
      approvalRequired ? "Human approval is required before action." : "Save the outcome after action.",
      ...riskyFiles,
      ...forbiddenActions,
    ].slice(0, 3),
    what_agent_should_do_next: [
      taskUnderstanding.task_intent
        ? `Continue with: ${taskUnderstanding.task_intent}`
        : evaluationGate.next_required_actions[0] ?? "Proceed with the safest next action.",
    ],
    readiness_summary: `${proofQuality.status} · ${riskLevel} risk · ${traceProof.length} proof links`,
  };
  const rankedMemoryItems: MemoryIgnitionRankedInheritanceItem[] = relevantMemories.map((memory) => ({
    id: memory.id,
    kind: toRelatedExperience(memory) || memory.contract_category === "previous_attempt" || /fail|mistake|incident|bug/i.test(memory.content)
      ? "past_failure"
      : "memory",
    title: memory.summary ?? memory.content.slice(0, 80),
    source_ref: memory.source_ref,
    score: memory.final_score,
    confidence: memory.final_score,
    proof_complete: Boolean(memory.source_ref),
    freshness: "fresh",
    why_selected: Array.from(new Set([
      ...(memory.source_ref ? ["source-backed"] : []),
      ...memory.reason_tags,
    ])),
    agent_instruction: `Consider this memory before acting: ${memory.summary ?? memory.content.slice(0, 140)}`,
    source_ids: [memory.id],
    files: memory.files,
  }));
  const rankedRiskItems: MemoryIgnitionRankedInheritanceItem[] = riskyFiles.map((file) => ({
    id: `risky_file:${file}`,
    kind: "risky_file",
    title: file,
    source_ref: null,
    score: 0.8,
    confidence: 0.8,
    proof_complete: true,
    freshness: "fresh",
    why_selected: ["risky_file"],
    agent_instruction: `Treat ${file} as a risk-sensitive file before editing.`,
    source_ids: relevantMemories.filter((memory) => memory.files.includes(file)).map((memory) => memory.id),
    files: [file],
  }));
  const ranked = [...rankedMemoryItems, ...rankedRiskItems];
  const pastFailureRetrieval = relevantMemories
    .filter((memory) =>
      memory.contract_category === "previous_attempt" ||
      /fail|mistake|incident|bug|lesson|outcome/i.test(memory.content),
    )
    .map((memory) => ({
      memory_id: memory.id,
      summary: memory.summary ?? memory.content.slice(0, 180),
      source_ref: memory.source_ref,
      confidence: memory.final_score,
      files: memory.files,
      reason: memory.contract_category ?? memory.reason_tags.join(", ") ?? "previous outcome learning",
    }));
  const outcomeContract = buildOutcomeContract();
  const readyToSendPrompt = [
    "# MemoryIgnition Brief",
    `Task: ${taskUnderstanding.task_intent}`,
    "",
    "## Task Understanding",
    `Agent: ${taskUnderstanding.target_agent}`,
    `Mode: ${taskUnderstanding.source_mode}`,
    "",
    "## Inheritance Gate",
    `Status: ${evaluationGate.status}`,
    `Risk: ${riskLevel}`,
    "",
    "## Withheld Memory",
    "Source memory withheld from prompt.",
    "Failed checks: freshness, source trust, or proof coverage.",
    "Withheld by inheritance gate.",
    "",
    "## Withheld Source Trust",
    "Source memory withheld from prompt.",
    "",
    "## Past Failures / Mistakes",
    pastFailureRetrieval.length
      ? pastFailureRetrieval.map((failure) => `- ${failure.summary}`).join("\n")
      : "- None",
    "",
    "## Highest-Ranked Inheritance",
    ranked.length ? ranked.slice(0, 3).map((item) => `- ${item.title}`).join("\n") : "- None",
    "",
    "## Risky Files",
    riskyFiles.length ? riskyFiles.map((file) => `- ${file}`).join("\n") : "- None",
    "",
    "## Related Experiences",
    relatedExperiences.length
      ? relatedExperiences.map((experience) => [
          `- ${experience.task}`,
          experience.lesson ? `  Lesson: ${experience.lesson}` : null,
          experience.future_agent_instruction ? `  Future-agent instruction: ${experience.future_agent_instruction}` : null,
          experience.tests.length ? `  Required tests: ${experience.tests.join(", ")}` : null,
        ].filter(Boolean).join("\n")).join("\n")
      : "- None found",
    "",
    "## Required Tests",
    requiredTests.length ? requiredTests.map((test) => `- ${test}`).join("\n") : "- None",
    "",
    "## Trace Proof",
    traceProof.length ? traceProof.map((trace) => `- ${trace.memory_id}: ${trace.source_ref ?? "no source"}`).join("\n") : "- None",
    "",
    "## Outcome Contract",
    `${outcomeContract.version} via ${outcomeContract.mcp_tool}`,
    `Required fields: ${outcomeContract.required_fields.join(", ")}`,
    "",
    "## Skill Inheritance Proof",
    executableSkills.length
      ? executableSkills.map((skill) => [
          `- ${skill.name}`,
          `  Source experience: ${skill.source_experience_id}`,
          "  Lineage: Experience -> Skill -> Approval -> MemoryIgnition Brief",
          skill.required_tests.length ? `  Required tests: ${skill.required_tests.join(", ")}` : null,
        ].filter(Boolean).join("\n")).join("\n")
      : "- None",
    "",
    "## Skill Selection Gate",
    `Status: ${skillGate.status}`,
    `Executable: ${skillGate.executable_count}`,
    `Withheld: ${skillGate.withheld_count}`,
    "",
    "## Withheld Skills",
    blockedSkillRecords.length
      ? blockedSkillRecords.map(({ reason }) => `- ${reason}`).join("\n")
      : "- None",
    "",
    "## Next Action",
    threeThings.what_agent_should_do_next.join("\n"),
  ].join("\n");
  const standardPackage: MemoryIgnitionStandardInheritancePackage = {
    version: "standard_inheritance_package.v1",
    generated_at: now,
    workspace_id: input.workspace_id ?? null,
    agent_id: input.agent_id ?? null,
    delivery: "copy_prompt",
    task: {
      task: taskUnderstanding.task,
      intent: taskUnderstanding.task_intent,
      risk_level: riskLevel,
      target_agent: taskUnderstanding.target_agent,
      source_mode: source,
    },
    context: {
      recommended_first_action: resume?.recommendedNextStep ?? evaluationGate.next_required_actions[0] ?? null,
      relevant_memory_count: relevantMemories.length,
      related_experience_count: relatedExperiences.length,
      executable_skill_count: executableSkills.length,
    },
    memories: relevantMemories.map((memory) => ({
      id: memory.id,
      summary: memory.summary ?? memory.content,
      source_ref: memory.source_ref,
      contract_category: memory.contract_category,
      confidence: memory.final_score,
      files: memory.files,
    })),
    review_memories: reviewMemories.map(({ memory, reason }) => ({
      id: memory.id,
      summary: memory.summary ?? memory.content,
      source_ref: memory.source_ref,
      reason,
    })),
    withheld_memories: blockedMemories.map(({ memory, readiness, reason }) => ({
      id: memory.id,
      source_ref: memory.source_ref,
      status: readiness.status,
      reason,
      failed_steps: readiness.steps.filter((step) => !step.ok).map(({ id, label, detail }) => ({ id, label, detail })),
    })),
    experiences: relatedExperiences,
    executable_skills: executableSkills,
    review_skills: [],
    withheld_skills: blockedSkillRecords.map(({ skill, reason }) => ({
      id: skill.id,
      reason,
    })),
    risk_rules: { risky_files: riskyFiles, forbidden_actions: forbiddenActions, risk_signals: riskSignals },
    approval_rules: approvalRules,
    required_tests: requiredTests,
    trace_proof: traceProof,
    gates: { memory: inheritanceGate, skill: skillGate, proof: evaluationGate },
    outcome_contract: outcomeContract,
    outcome: { hooks: outcomeContract.hooks, save_required: true, contract: outcomeContract },
  };
  const contextText = source === "resume"
    ? [resume?.summary, resume?.lastKnownState, ...(resume?.openLoops ?? []), resume?.recommendedNextStep].filter(Boolean).join("\n")
    : relevantMemories.map((memory) => memory.content).join("\n");
  const readinessSummary: MemoryInheritanceReadinessSummary = {
    version: "inheritance_readiness.v1",
    total: readiness.length,
    ready: readiness.filter((item) => item.status === "ready").length,
    review: readiness.filter((item) => item.status === "review").length,
    blocked: 0,
    readyRatio: readiness.length ? readiness.filter((item) => item.status === "ready").length / readiness.length : 0,
    status: blockedMemories.length ? "blocked" : reviewMemories.length ? "review" : "ready",
    nextActions: inheritanceGate.next_actions,
    memories: readiness,
  };
  return {
    contextText,
    memories,
    source,
    traceId: `trace_${randomUUID().slice(0, 12)}`,
    workspace_id: input.workspace_id,
    agent_id: input.agent_id,
    task_intent: taskUnderstanding.task_intent,
    relevant_memories: relevantMemories,
    executable_skills: executableSkills,
    past_mistakes: relevantMemories.filter((memory) => /fail|mistake|incident|bug/i.test(memory.content)),
    risky_files: riskyFiles,
    required_tests: requiredTests,
    forbidden_actions: forbiddenActions,
    approval_rules: approvalRules,
    recommended_first_action: resume?.recommendedNextStep ?? `Continue with: ${taskUnderstanding.task_intent}`,
    trace_proof: traceProof,
    outcome_hooks: outcomeContract.hooks,
    brief_proof_quality: proofQuality,
    evaluation_gate: evaluationGate,
    task_understanding: taskUnderstanding,
    target_agent: targetAgent,
    inheritance_sections: {
      relevant_memory_count: relevantMemories.length,
      past_failure_count: relevantMemories.filter((memory) => /fail|mistake|incident|bug/i.test(memory.content)).length,
      risky_file_count: riskyFiles.length,
      required_test_count: requiredTests.length,
      approval_rule_count: approvalRequired ? 1 : 0,
      trace_proof_count: traceProof.length,
      approved_skill_count: executableSkills.length,
      outcome_hook_count: outcomeContract.hooks.length,
    },
    past_failure_retrieval: pastFailureRetrieval,
    risky_file_retrieval: riskyFiles.map((file): MemoryIgnitionRiskyFileRetrieval => ({
      file,
      source_memory_ids: relevantMemories
        .filter((memory) => memory.files.includes(file))
        .map((memory) => memory.id)
        .slice(0, 5),
      approval_required: approvalRequired,
      reason: "Matched high-risk task or risky memory.",
    })),
    required_test_retrieval: requiredTests
      .filter((command) => command !== "Run relevant regression tests before merge.")
      .map((command): MemoryIgnitionRequiredTestRetrieval => ({
      command,
      source: "memory",
      source_ids: relevantMemories.map((memory) => memory.id).slice(0, 5),
      reason: "Required by high-risk MemoryIgnition guard.",
    })),
    approval_rule_retrieval: [{
      risk_level: riskLevel,
      approval_required: approvalRequired,
      reason: approvalRules.reason,
      risk_signals: riskSignals,
      allowed_tools: approvalRules.allowed_tools,
    } satisfies MemoryIgnitionApprovalRuleRetrieval],
    skill_inheritance_proofs: executableSkills.map((skill) => ({
      skill_id: skill.id,
      skill_name: skill.name,
      version: skill.version,
      approval_status: "approved" as const,
      source_experience_id: skill.source_experience_id,
      source_ref: skill.source_ref,
      evidence: skill.evidence,
      required_tests: skill.required_tests,
      inheritance_rules: skill.inheritance_rules,
      supported_agent_types: skill.supported_agent_types,
      confidence: skill.confidence,
      success_rate: skill.success_rate,
      lineage: "Experience -> Skill -> Approval -> MemoryIgnition Brief" as const,
    })),
    three_things: threeThings,
    ready_to_send_prompt: readyToSendPrompt,
    inheritance_ranking: ranked,
    brief_quality_engine: {
      version: "phase3.v1",
      generated_at: now,
      readiness: proofQuality.status === "blocked" ? "blocked" : evaluationGate.requires_human_review ? "review_required" : "trusted",
      task_relevance_score: proofScore,
      proof_coverage: traceProof.length ? 1 : 0,
      top_reasons: riskSignals.length ? riskSignals : ["memory_retrieval"],
      missing_core_sections: proofQuality.missing_requirements,
      ranking_policy: "task relevance + proof first memoryignition v1",
    },
    copy_to_agent: {
      target_agent: targetAgent.id,
      delivery: targetAgent.delivery,
      prompt: readyToSendPrompt,
      outcome_required: true,
      setup_hint: "Use MemoryOS API, SDK, MCP, or copy prompt delivery.",
    } satisfies MemoryIgnitionCopyToAgent,
    related_experiences: relatedExperiences,
    experience_promotion_proofs: relatedExperiences.map((experience) => ({
      version: "memoryignition_experience_promotion.v1" as const,
      promoted: experience.quality_status === "ready_for_inheritance",
      experience_record_id: experience.experience_id,
      source_outcome_event_id: null,
      source_send_event_id: null,
      source_ref: experience.source_ref,
      lineage: "Outcome Proof -> Experience Record -> MemoryIgnition Brief" as const,
      evidence: Array.from(new Set([
        `experience:${experience.experience_id}`,
        ...(experience.source_ref ? [experience.source_ref] : []),
        ...experience.evidence,
        ...experience.tests.map((test) => `test:${test}`),
      ])),
      missing_evidence: experience.quality_status === "ready_for_inheritance" ? [] : ["experience evidence"],
      future_agent_instruction: experience.future_agent_instruction,
      next_brief_query: experience.task,
    })),
    experience_quality_gate: {
      version: "phase5.v1",
      total_related_experiences: relatedExperiences.length,
      ready_for_inheritance: readyExperiences.length,
      needs_evidence: needsEvidenceExperiences.length,
      stale: 0,
      conflicting: 0,
      selected_experience_ids: readyExperiences.map((experience) => experience.experience_id),
      next_actions: readyExperiences.length
        ? ["Include ready experiences in the MemoryIgnition brief."]
        : ["Capture outcome after action to create reusable experience."],
    } satisfies MemoryIgnitionExperienceQualityGate,
    memory_inheritance_readiness: readinessSummary,
    inheritance_gate: inheritanceGate,
    inherited_memories: inheritedMemories,
    review_memories: reviewMemories,
    blocked_memories: blockedMemories,
    skill_gate: skillGate,
    executable_skill_records: executableSkillRecords,
    review_skills: [],
    blocked_skills: blockedSkillRecords,
    standard_inheritance_package: standardPackage,
  };
}

export async function beforeModel(input: BeforeModelInput): Promise<BeforeModelResult> {
  if (input.mode === "resume") {
    const result = await runResumeFlowLangGraph({
      userId: input.userId,
      project: input.project ?? input.repo_or_task ?? "default",
      question: input.question,
      topK: input.topK,
      includeArchived: input.includeArchived,
    }) as unknown as ResumeFlowResult;
    return await buildBeforeResult(input, "resume", result.usedMemories ?? [], result);
  }

  const result = await runRetrieveFlowLangGraph({
    userId: input.userId,
    question: input.question,
    topK: input.topK,
    includeArchived: input.includeArchived,
  }) as unknown as RetrieveFlowResult;
  return await buildBeforeResult(input, "retrieve", result.memories ?? []);
}

function buildOutcomeProof(input: AfterModelInput, acceptedCount: number): AfterModelResult["outcome_proof"] {
  const outcomeEventId = `outcome_${randomUUID().slice(0, 12)}`;
  const sourceRef = input.send_event_id ?? `after_model:${outcomeEventId}`;
  const missing = [
    input.files_touched?.length ? null : "files_touched",
    input.tests_passed?.length || input.tests_failed?.length ? null : "test outcome",
    input.future_agent_lesson ? null : "future_agent_lesson",
  ].filter((item): item is string => Boolean(item));
  return {
    version: "memoryignition_outcome_proof.v1",
    outcome_event_id: outcomeEventId,
    send_event_id: input.send_event_id ?? null,
    target_agent: input.target_agent ?? input.agent_id ?? null,
    target_format: input.target_format ?? null,
    source_ref: sourceRef,
    lineage: "Send Now -> Agent Work -> Outcome -> Experience -> Future-Agent Inheritance",
    outcome_recorded: true,
    future_inheritance_ready: missing.length === 0,
    memory_updated: acceptedCount > 0,
    experience_updated: Boolean(input.future_agent_lesson || input.outcome),
    skill_confidence_updated: Boolean(input.used_skill_ids?.length || input.skill_ids?.length),
    approvals_used: input.approvals_used ?? [],
    evidence: [
      ...(input.send_event_id ? [`send-now:${input.send_event_id}`] : []),
      ...(input.files_touched ?? []).map((file) => `file:${file}`),
      ...(input.tests_passed ?? []).map((test) => `test_passed:${test}`),
      ...(input.tests_failed ?? []).map((test) => `test_failed:${test}`),
      ...(input.used_skill_ids ?? input.skill_ids ?? []).map((skillId) => `skill-used:${skillId}`),
      ...(input.approvals_used ?? []).map((approval) => `approval:${approval}`),
      ...(input.risky_files_touched ?? []).map((file) => `risky_file:${file}`),
      ...(input.trace_proof_ids ?? []).map((trace) => `trace:${trace}`),
      ...(input.relatedReasoningIds ?? []).map((reasoningId) => `reasoning:${reasoningId}`),
    ],
    missing_evidence: missing,
    next_brief_query: input.task_intent ?? input.future_agent_lesson ?? input.outcome ?? input.message ?? "Use latest outcome learning.",
  };
}

function buildOutcomeGate(
  input: AfterModelInput,
  proof: AfterModelResult["outcome_proof"],
  lifecycle?: {
    actionMemoryId?: string | null;
    executionOutcomeId?: string | null;
    experienceRecordId?: string | null;
    skillOutcomeCount?: number;
    memoryUpdated?: boolean;
  },
): MemoryIgnitionOutcomeLearningGate {
  const hasTestEvidence = Boolean(input.tests_passed?.length || input.tests_failed?.length);
  const hasFiles = Boolean(input.files_touched?.length);
  const hasLesson = Boolean(input.future_agent_lesson);
  const canUpdateMemory = Boolean(lifecycle?.memoryUpdated);
  const hasActionMemory = Boolean(lifecycle?.actionMemoryId);
  const canUpdateExperience = Boolean(lifecycle?.experienceRecordId);
  const canUpdateSkillConfidence = Boolean(lifecycle?.skillOutcomeCount);
  const futureReady = Boolean(hasActionMemory && canUpdateExperience && hasFiles && hasTestEvidence && hasLesson);
  const checks = [
    { id: "outcome", label: "Outcome", ok: Boolean(input.outcome ?? input.outcome_status ?? input.message), required: true, detail: input.outcome ?? input.message ?? "No outcome body." },
    { id: "action_memory", label: "Action memory", ok: Boolean(lifecycle?.actionMemoryId), required: false, detail: lifecycle?.actionMemoryId ?? "Action memory was not created." },
    { id: "execution_outcome", label: "Execution outcome", ok: Boolean(lifecycle?.executionOutcomeId), required: false, detail: lifecycle?.executionOutcomeId ?? input.outcome_status ?? "No explicit status." },
    { id: "experience", label: "Experience", ok: canUpdateExperience, required: true, detail: lifecycle?.experienceRecordId ?? (proof.experience_updated ? "Experience signal present." : "Missing lesson/outcome.") },
    { id: "lesson", label: "Lesson", ok: Boolean(input.future_agent_lesson), required: true, detail: input.future_agent_lesson ?? "Missing future-agent lesson." },
    { id: "files", label: "Files", ok: Boolean(input.files_touched?.length), required: false, detail: `${input.files_touched?.length ?? 0} files.` },
    { id: "tests", label: "Tests", ok: Boolean(input.tests_passed?.length || input.tests_failed?.length), required: false, detail: `${(input.tests_passed?.length ?? 0) + (input.tests_failed?.length ?? 0)} tests.` },
    { id: "skill_outcome", label: "Skill outcome", ok: canUpdateSkillConfidence, required: false, detail: `${lifecycle?.skillOutcomeCount ?? 0} skills updated.` },
    { id: "approval", label: "Approval proof", ok: Boolean(input.approvals_used?.length), required: false, detail: `${input.approvals_used?.length ?? 0} approval request(s).` },
  ] satisfies MemoryIgnitionOutcomeLearningGate["checks"];
  const required = checks.filter((check) => check.required);
  const passed = required.filter((check) => check.ok).length;
  const score = required.length ? Math.round((passed / required.length) * 100) : 100;
  const promotedSignals = [
    futureReady ? "future-inheritance-ready" : null,
    canUpdateMemory ? "memory-updated" : null,
    canUpdateExperience ? "experience-updated" : null,
    hasTestEvidence ? "test-evidence-recorded" : null,
    canUpdateSkillConfidence ? "skill-confidence-update-allowed" : null,
  ].filter((signal): signal is string => Boolean(signal));
  const blockedUpdates = [
    futureReady ? null : "future inheritance promotion",
    canUpdateExperience ? null : "experience graph update",
    hasFiles ? null : "files changed",
    hasTestEvidence ? null : "test evidence",
    hasLesson ? null : "future-agent lesson",
  ].filter((signal): signal is string => Boolean(signal));
  return {
    version: "phase4.outcome_gate.v1",
    status: futureReady ? "ready" : score > 0 ? "partial" : "blocked",
    future_inheritance_ready: futureReady,
    can_update_memory: canUpdateMemory,
    can_update_experience: canUpdateExperience,
    can_update_skill_confidence: canUpdateSkillConfidence,
    score,
    checks,
    promoted_signals: promotedSignals,
    blocked_updates: blockedUpdates,
    next_actions: futureReady ? ["Use this outcome in the next MemoryIgnition brief."] : ["Add missing lesson/outcome evidence."],
  };
}

export async function afterModel(input: AfterModelInput): Promise<AfterModelResult> {
  let message = input.message;
  if (!message && input.contract) message = JSON.stringify(input.contract);
  if (input.modelResponse) {
    message = `User: ${input.message ?? ""}\nAssistant: ${input.modelResponse}`;
  }
  let result: IngestFlowResult;
  try {
    result = await runIngestFlowLangGraph({
      userId: input.userId,
      threadId: input.threadId,
      message: message ?? input.outcome ?? input.future_agent_lesson ?? "MemoryIgnition outcome",
    }) as IngestFlowResult;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.warn(`[MemoryIgnition] optional ingest skipped during outcome save: ${detail}`);
    result = { acceptedMemories: [], rejectedMemories: [] };
  }
  const acceptedCount = result.acceptedMemories?.length ?? 0;
  const rejectedCount = result.rejectedMemories?.length ?? 0;
  const initialProof = buildOutcomeProof(input, acceptedCount);
  const sourceRef = initialProof.source_ref;
  const outcomeStatus = input.outcome_status ?? "recorded";
  const actionOutcome = outcomeStatus === "success"
    ? "success"
    : outcomeStatus === "rolled_back"
      ? "rolled_back"
      : "failed";
  const actionMemory = await createActionMemory({
    userId: input.userId,
    orgId: input.orgId ?? input.org_id ?? null,
    projectId: input.repo_or_task ?? null,
    action: input.task_intent ?? input.message ?? input.outcome ?? "MemoryIgnition outcome captured",
    reason: input.future_agent_lesson ?? input.what_worked ?? input.outcome ?? "Outcome captured for future-agent inheritance.",
    filesChanged: input.files_touched ?? [],
    outcome: actionOutcome,
    followUps: input.future_agent_lesson ? [input.future_agent_lesson] : [],
    sourceType: "continuity",
    sourceId: sourceRef,
    metadata: {
      thread_id: input.threadId ?? null,
      repo_or_task: input.repo_or_task ?? null,
      task_intent: input.task_intent ?? null,
      tests_passed: input.tests_passed ?? [],
      tests_failed: input.tests_failed ?? [],
      what_worked: input.what_worked ?? null,
      what_failed: input.what_failed ?? null,
      future_agent_lesson: input.future_agent_lesson ?? null,
      used_skill_ids: input.used_skill_ids ?? input.skill_ids ?? [],
      approvals_used: input.approvals_used ?? [],
      send_event_id: input.send_event_id ?? null,
      target_agent: input.target_agent ?? input.agent_id ?? null,
      target_format: input.target_format ?? null,
      risk_level: input.risk_level ?? null,
      related_reasoning_ids: input.relatedReasoningIds ?? [],
    },
  });
  const executionOutcome = await createExecutionOutcome({
    actionMemoryId: actionMemory.id,
    userId: input.userId,
    orgId: input.orgId ?? input.org_id ?? null,
    goal: input.task_intent ?? input.repo_or_task ?? null,
    planSummary: input.message ?? null,
    resultSummary: input.outcome ?? input.modelResponse ?? null,
    status: outcomeStatus === "success" ? "executed" : outcomeStatus === "failed" ? "failed" : outcomeStatus,
    errorMessage: input.what_failed ?? null,
    connectorAdapter: "memory.after_model",
    externalRef: sourceRef,
  });
  const shouldPersistExperience = Boolean(input.future_agent_lesson && (input.outcome || input.modelResponse || input.message));
  const experience = shouldPersistExperience
    ? await persistExperienceGraphMemory({
        userId: input.userId,
        orgId: input.orgId ?? input.org_id ?? null,
        sourceType: "after_model",
        sourceRef: actionMemory.id,
        task: input.task_intent ?? input.repo_or_task ?? "MemoryIgnition outcome",
        problem: input.task_intent ?? input.repo_or_task ?? "Agent outcome captured",
        context: input.repo_or_task ?? input.workspace_id ?? "MemoryIgnition runtime",
        action: input.message ?? input.modelResponse ?? input.outcome ?? "Agent acted.",
        mistake: input.what_failed ?? null,
        outcome: input.outcome ?? outcomeStatus,
        lesson: input.future_agent_lesson ?? "Capture outcome for future agents.",
        futureAgentInstruction: input.future_agent_lesson ?? "Review this outcome before repeating the work.",
        evidence: [
          `outcome-proof:${initialProof.outcome_event_id}`,
          sourceRef === input.send_event_id ? `send-now:${sourceRef}` : sourceRef,
          `action-memory:${actionMemory.id}`,
          ...(executionOutcome?.id ? [`execution-outcome:${executionOutcome.id}`] : []),
          ...(input.tests_passed ?? []).map((test) => `test-passed:${test}`),
          ...(input.tests_failed ?? []).map((test) => `test-failed:${test}`),
          ...(input.files_touched ?? []).map((file) => `file:${file}`),
        ],
        files: input.files_touched ?? [],
        tests: [...(input.tests_passed ?? []), ...(input.tests_failed ?? [])],
        riskLevel: input.risk_level ?? "medium",
        relatedReasoningIds: input.relatedReasoningIds ?? [],
        eventReason: "MemoryIgnition outcome promoted into Experience Graph for future-agent inheritance.",
      })
    : null;
  const skillOutcomes = await Promise.all(
    (input.used_skill_ids ?? input.skill_ids ?? []).map(async (skillId) => {
      const updated = await recordSkillOutcome({
        userId: input.userId,
        orgId: input.orgId ?? input.org_id ?? null,
        skillId,
        status: outcomeStatus,
        sourceRef,
        agentId: input.agent_id ?? null,
        experienceRecordId: experience?.id ?? null,
        executionOutcomeId: executionOutcome?.id ?? null,
      });
      return {
        skill_id: skillId,
        status: outcomeStatus,
        confidence: updated?.confidence ?? (outcomeStatus === "failed" ? 0.45 : 0.75),
        success_rate: updated?.success_rate ?? null,
      };
    }),
  );
  const proof: AfterModelResult["outcome_proof"] = {
    ...initialProof,
    memory_updated: acceptedCount > 0,
    experience_updated: Boolean(experience?.id),
    skill_confidence_updated: skillOutcomes.length > 0,
    future_inheritance_ready: Boolean(
      experience?.id &&
      input.future_agent_lesson &&
      input.files_touched?.length &&
      (input.tests_passed?.length || input.tests_failed?.length),
    ),
    evidence: Array.from(new Set([
      ...initialProof.evidence,
      `action-memory:${actionMemory.id}`,
      ...(executionOutcome?.id ? [`execution-outcome:${executionOutcome.id}`] : []),
      ...(experience?.id ? [`experience:${experience.id}`] : []),
      ...skillOutcomes.map((outcome) => `skill-used:${outcome.skill_id}`),
    ])),
    missing_evidence: [
      ...(experience?.id ? [] : ["experience record"]),
      ...(input.files_touched?.length ? [] : ["files changed"]),
      ...(input.tests_passed?.length || input.tests_failed?.length ? [] : ["test evidence"]),
      ...(input.future_agent_lesson ? [] : ["future-agent lesson"]),
    ],
  };
  const gate = buildOutcomeGate(input, proof, {
    actionMemoryId: actionMemory.id,
    executionOutcomeId: executionOutcome?.id ?? null,
    experienceRecordId: experience?.id ?? null,
    skillOutcomeCount: skillOutcomes.length,
    memoryUpdated: acceptedCount > 0,
  });
  const promotion: MemoryIgnitionExperiencePromotionProof = {
    version: "memoryignition_experience_promotion.v1",
    promoted: Boolean(experience?.id),
    experience_record_id: experience?.id ?? null,
    source_outcome_event_id: proof.outcome_event_id,
    source_send_event_id: input.send_event_id ?? null,
    source_ref: experience?.sourceRef ?? proof.source_ref,
    lineage: "Outcome Proof -> Experience Record -> MemoryIgnition Brief",
    evidence: [
      `outcome-proof:${proof.outcome_event_id}`,
      ...proof.evidence,
      ...(experience?.id ? [`experience:${experience.id}`] : []),
    ],
    missing_evidence: gate.future_inheritance_ready ? [] : ["outcome learning gate", ...proof.missing_evidence],
    future_agent_instruction: input.future_agent_lesson ?? null,
    next_brief_query: proof.next_brief_query,
  };
  return {
    acceptedCount,
    rejectedCount,
    contractFieldCount: input.contract ? Object.keys(input.contract).length : undefined,
    traceId: `trace_${randomUUID().slice(0, 12)}`,
    outcome_recorded: true,
    experience_draft: {
      problem: input.task_intent ?? null,
      context: input.repo_or_task ?? null,
      action: input.message ?? null,
      mistake: input.what_failed ?? null,
      outcome: input.outcome ?? null,
      lesson: input.future_agent_lesson ?? null,
      status: "draft",
    },
    experience_timeline: [{
      step: "outcome_captured",
      status: "recorded",
      detail: input.outcome ?? input.message ?? "Outcome captured.",
      ref: proof.source_ref,
      recorded_at: new Date().toISOString(),
    }, {
      step: "action_memory",
      status: "recorded",
      detail: "Agent action memory recorded.",
      ref: actionMemory.id,
      recorded_at: actionMemory.updatedAt,
    }, {
      step: "execution_outcome",
      status: "recorded",
      detail: "Execution outcome recorded.",
      ref: executionOutcome?.id,
      recorded_at: executionOutcome?.createdAt ?? new Date().toISOString(),
    }, {
      step: "experience_record",
      status: experience?.id ? "recorded" : "skipped",
      detail: experience?.id ? "Experience Graph record created." : "Missing future-agent lesson or outcome evidence.",
      ref: experience?.id,
      recorded_at: experience?.updatedAt ?? new Date().toISOString(),
    }, {
      step: "skill_outcome",
      status: skillOutcomes.length > 0 ? "recorded" : "skipped",
      detail: `${skillOutcomes.length} approved skill outcome(s) updated.`,
      ref: skillOutcomes.map((outcome) => outcome.skill_id).join(",") || undefined,
      recorded_at: new Date().toISOString(),
    }],
    trace_proof: [
      {
        accepted_memory_id: result.acceptedMemories?.[0]?.id,
        source_type: "after_model",
        source_ref: proof.source_ref,
        recorded_at: new Date().toISOString(),
      },
      {
        action_memory_id: actionMemory.id,
        source_type: "action_memory",
        source_ref: proof.source_ref,
        recorded_at: actionMemory.updatedAt,
      },
      {
        execution_outcome_id: executionOutcome?.id,
        source_type: "execution_outcome",
        source_ref: proof.source_ref,
        recorded_at: executionOutcome?.createdAt ?? new Date().toISOString(),
      },
      ...(experience?.id ? [{
        experience_record_id: experience.id,
        source_type: "experience_record" as const,
        source_ref: experience.sourceRef ?? proof.source_ref,
        recorded_at: experience.updatedAt,
      }] : []),
      ...skillOutcomes.map((outcome) => ({
        skill_id: outcome.skill_id,
        source_type: "skill_outcome" as const,
        source_ref: proof.source_ref,
        recorded_at: new Date().toISOString(),
      })),
    ],
    action_memory_id: actionMemory.id,
    execution_outcome_id: executionOutcome?.id,
    experience_record_id: experience?.id,
    skill_outcomes: skillOutcomes,
    outcome_proof: proof,
    experience_promotion: promotion,
    outcome_learning: {
      version: "phase4.v1",
      status: gate.status === "ready" ? "recorded" : "partial",
      future_inheritance_ready: gate.future_inheritance_ready,
      experience_record_id: promotion.experience_record_id,
      lesson_stored: input.future_agent_lesson ?? null,
      future_agent_instruction: input.future_agent_lesson ?? null,
      next_brief_query: proof.next_brief_query,
      trace_complete: proof.missing_evidence.length === 0,
      learning_signals: Array.from(new Set([
        "outcome-captured",
        ...(experience?.id ? ["experience-record-created"] : []),
        ...(input.future_agent_lesson ? ["future-agent-lesson-stored"] : []),
        ...gate.promoted_signals,
      ])),
      missing_signals: [
        ...(experience?.id ? [] : ["experience record"]),
        ...(input.files_touched?.length ? [] : ["files changed"]),
        ...(input.tests_passed?.length || input.tests_failed?.length ? [] : ["test evidence"]),
        ...(input.future_agent_lesson ? [] : ["future-agent lesson"]),
      ],
    },
    outcome_learning_gate: gate,
  };
}
