import { z } from "zod";
import {
  COMPANY_BRAIN_MEMORY_TYPES,
  MEMORY_CONTRACT_CATEGORIES,
  MEMORY_CONTRACT_VERSION,
} from "../../lib/memory/types";

const NonEmptyTrimmedString = z.string().trim().min(1);

export const MemoryContractCategorySchema = z.enum(MEMORY_CONTRACT_CATEGORIES);

export const MemoryContractItemSchema = z.object({
  contract_version: z.literal(MEMORY_CONTRACT_VERSION).default(MEMORY_CONTRACT_VERSION),
  category: MemoryContractCategorySchema,
  content: NonEmptyTrimmedString,
  source: NonEmptyTrimmedString.optional(),
  confidence: z.number().min(0).max(1).optional(),
  why_selected: NonEmptyTrimmedString.optional(),
});

export const MemoryContractSchema = z.object({
  contract_version: z.literal(MEMORY_CONTRACT_VERSION).default(MEMORY_CONTRACT_VERSION),
  goal: NonEmptyTrimmedString.optional(),
  constraints: z.array(NonEmptyTrimmedString).max(20).optional(),
  decisions: z.array(NonEmptyTrimmedString).max(30).optional(),
  runbooks: z.array(NonEmptyTrimmedString).max(30).optional(),
  incidents: z.array(NonEmptyTrimmedString).max(30).optional(),
  preferences: z.array(NonEmptyTrimmedString).max(30).optional(),
  policies: z.array(NonEmptyTrimmedString).max(30).optional(),
  open_risks: z.array(NonEmptyTrimmedString).max(30).optional(),
  next_actions: z.array(NonEmptyTrimmedString).max(30).optional(),
  items: z.array(MemoryContractItemSchema).max(80).optional(),
});

export const GovernancePolicySchema = z.object({
  ttlHours: z.number().int().min(1).max(720).default(168),
  retentionClass: z.enum(["short", "standard", "long"]).default("standard"),
  pinCriticalDecisions: z.boolean().default(true),
  redactSecrets: z.boolean().default(true),
  requireManualReviewForHighRisk: z.boolean().default(false),
  mode: z.enum(["balanced", "strict", "enterprise"]).default("balanced"),
});

export const ProcessMemorySchema = z.object({
  userId: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
  message: z.string().trim().min(1).optional(),
  contract: MemoryContractSchema.optional(),
  enforceContract: z.boolean().optional().default(false),
  governance: GovernancePolicySchema.optional(),
}).refine((value) => Boolean(value.message) || Boolean(value.contract), {
  message: "message or contract is required",
  path: ["message"],
});

const VoiceSourceSchema = z.enum(["pipecat"]);
const VoiceSpeakerSchema = z.enum(["user", "assistant", "system"]);
const VoiceSentimentSchema = z.enum(["positive", "neutral", "negative"]);

export const VoiceSessionStartSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  source: VoiceSourceSchema.default("pipecat"),
  workspace: z.string().min(1).optional(),
  project: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const VoiceChunkIngestSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  chunk: z.string().min(1, "chunk is required"),
  chunkIndex: z.number().int().nonnegative().optional(),
  speaker: VoiceSpeakerSchema.optional(),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
  workspace: z.string().min(1).optional(),
  project: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).max(20).optional(),
  sentiment: VoiceSentimentSchema.optional(),
});

export const VoiceSessionEndSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  finalSummary: z.string().min(1).optional(),
});

export const ProjectStateSchema = z.object({
  projectName: z.string().optional(),
  systemGoal: z.string().optional(),
  activeConstraints: z.array(z.string()).optional(),
  preferences: z.array(z.string()).optional(),
  executionPlan: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(100).optional(),
  missingInfo: z.array(z.string()).optional(),
});

export const VoiceChatSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  message: z.string().min(1, "message is required"),
  threadId: z.string().min(1).optional(),
  workspace: z.string().min(1).optional(),
  project: z.string().min(1).optional(),
  agentId: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  mode: z.enum(["chat", "handoff", "next_step", "execute"]).optional(),
  useCompanyBrain: z.boolean().optional(),
  injectedProjectState: ProjectStateSchema.optional(),
  governance: GovernancePolicySchema.optional(),
});

export const RetrieveMemorySchema = z.object({
  userId: z.string().min(1).optional(),
  question: z.string().min(1, "question is required"),
  topK: z.number().int().positive().max(20).optional(),
  includeArchived: z.boolean().optional(),
  workspace: z.string().min(1).optional(),
  project: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
  repo: z.string().min(1).optional(),
  service: z.string().min(1).optional(),
  environment: z.string().min(1).optional(),
  taskId: z.string().min(1).optional(),
});

export const ContinueMemorySchema = z.object({
  question: z.string().min(1, "question is required"),
  mode: z.enum(["build_next", "debug_next", "learn_next"]).optional(),
  topK: z.number().int().positive().max(20).optional(),
  includeArchived: z.boolean().optional(),
  workspace: z.string().min(1).optional(),
  project: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
  repo: z.string().min(1).optional(),
  service: z.string().min(1).optional(),
  environment: z.string().min(1).optional(),
  taskId: z.string().min(1).optional(),
});

export const ResumeMemorySchema = z.object({
  project: z.string().min(1, "project is required"),
  question: z.string().min(1, "question is required"),
  topK: z.number().int().positive().max(20).optional(),
  includeArchived: z.boolean().optional(),
  workspace: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
  repo: z.string().min(1).optional(),
  service: z.string().min(1).optional(),
  environment: z.string().min(1).optional(),
  taskId: z.string().min(1).optional(),
});

export const ResumePromptSchema = ResumeMemorySchema.extend({
  target: z.enum(["cursor", "codex", "claude_code"]).optional(),
});

export const HandoffMemorySchema = z.object({
  project: z.string().min(1, "project is required"),
  question: z.string().min(1, "question is required"),
  topK: z.number().int().positive().max(20).optional(),
  includeArchived: z.boolean().optional(),
  workspace: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
  repo: z.string().min(1).optional(),
  service: z.string().min(1).optional(),
  environment: z.string().min(1).optional(),
  taskId: z.string().min(1).optional(),
});

export const MemoryStatusPatchSchema = z.object({
  status: z.enum(["active", "stale", "contradicted", "archived", "merged"]),
});

export const RetrievalWeightsSchema = z.object({
  semantic: z.number().min(0).max(1),
  typeRelevance: z.number().min(0).max(1),
  importance: z.number().min(0).max(1),
  recency: z.number().min(0).max(1),
});

export const BulkImportSyncSchema = z.object({
  sourceId: z.string().min(1, "sourceId is required"),
  payload: z.array(z.record(z.string(), z.unknown())),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const Phase2DecisionMemorySchema = z.object({
  decision: NonEmptyTrimmedString,
  why: NonEmptyTrimmedString,
  who: z.array(NonEmptyTrimmedString).min(1).max(20),
  alternatives: z.array(NonEmptyTrimmedString).max(20).optional(),
  source: NonEmptyTrimmedString.optional(),
  project: NonEmptyTrimmedString.optional(),
  threadId: NonEmptyTrimmedString.optional(),
});

const Phase2IncidentMemorySchema = z.object({
  rootCause: NonEmptyTrimmedString,
  fix: NonEmptyTrimmedString,
  lessonsLearned: z.array(NonEmptyTrimmedString).min(1).max(20),
  source: NonEmptyTrimmedString.optional(),
  project: NonEmptyTrimmedString.optional(),
  threadId: NonEmptyTrimmedString.optional(),
});

const Phase2ArchitectureMemorySchema = z.object({
  adr: NonEmptyTrimmedString,
  tradeoffs: z.array(NonEmptyTrimmedString).min(1).max(30),
  constraints: z.array(NonEmptyTrimmedString).min(1).max(30),
  source: NonEmptyTrimmedString.optional(),
  project: NonEmptyTrimmedString.optional(),
  threadId: NonEmptyTrimmedString.optional(),
});

const Phase2ProcessMemorySchema = z.object({
  workflowType: z.enum(["deploy", "escalation", "onboarding", "support", "other"]),
  workflow: NonEmptyTrimmedString,
  steps: z.array(NonEmptyTrimmedString).min(1).max(40),
  source: NonEmptyTrimmedString.optional(),
  project: NonEmptyTrimmedString.optional(),
  threadId: NonEmptyTrimmedString.optional(),
});

const Phase2StructuredMemorySchema = z.object({
  type: z.enum(COMPANY_BRAIN_MEMORY_TYPES),
  title: NonEmptyTrimmedString,
  whatHappened: NonEmptyTrimmedString,
  whyItMatters: NonEmptyTrimmedString,
  evidence: z.array(NonEmptyTrimmedString).min(1).max(30),
  source: NonEmptyTrimmedString,
  project: NonEmptyTrimmedString.optional(),
  workspace: NonEmptyTrimmedString.optional(),
  threadId: NonEmptyTrimmedString.optional(),
  confidence: z.number().min(0).max(1).optional(),
  freshness: z.enum(["fresh", "aging", "stale"]).optional(),
  conflictsWith: z.array(NonEmptyTrimmedString).max(20).optional(),
  shouldInheritBy: z.array(NonEmptyTrimmedString).max(20).optional(),
  tags: z.array(NonEmptyTrimmedString).max(20).optional(),
});

const Phase2RawSignalSchema = z.object({
  sourceType: NonEmptyTrimmedString,
  sourceRef: NonEmptyTrimmedString,
  body: NonEmptyTrimmedString,
  title: NonEmptyTrimmedString.optional(),
  occurredAt: NonEmptyTrimmedString.optional(),
  author: NonEmptyTrimmedString.optional(),
  url: NonEmptyTrimmedString.optional(),
  type: z.enum(COMPANY_BRAIN_MEMORY_TYPES).optional(),
  tags: z.array(NonEmptyTrimmedString).max(20).optional(),
});

const Phase2SlackSignalSchema = z.object({
  channelId: NonEmptyTrimmedString,
  channelName: NonEmptyTrimmedString.optional(),
  messageTs: NonEmptyTrimmedString,
  threadTs: NonEmptyTrimmedString.optional(),
  userId: NonEmptyTrimmedString.optional(),
  text: NonEmptyTrimmedString,
  permalink: NonEmptyTrimmedString.optional(),
});

const Phase2JiraSignalSchema = z.object({
  issueId: NonEmptyTrimmedString,
  issueKey: NonEmptyTrimmedString,
  summary: NonEmptyTrimmedString,
  description: NonEmptyTrimmedString.optional(),
  status: NonEmptyTrimmedString.optional(),
  priority: NonEmptyTrimmedString.optional(),
  assignee: NonEmptyTrimmedString.optional(),
  labels: z.array(NonEmptyTrimmedString).max(30).optional(),
  resolution: NonEmptyTrimmedString.optional(),
  updatedAt: NonEmptyTrimmedString.optional(),
  url: NonEmptyTrimmedString.optional(),
  commentBody: NonEmptyTrimmedString.optional(),
  commentAuthor: NonEmptyTrimmedString.optional(),
});

export const CompanyBrainPhase2CaptureSchema = z
  .object({
    workspace: NonEmptyTrimmedString.optional(),
    project: NonEmptyTrimmedString.optional(),
    threadId: NonEmptyTrimmedString.optional(),
    rawSignals: z.array(Phase2RawSignalSchema).max(500).optional(),
    slackSignals: z.array(Phase2SlackSignalSchema).max(500).optional(),
    jiraSignals: z.array(Phase2JiraSignalSchema).max(500).optional(),
    memories: z.array(Phase2StructuredMemorySchema).max(200).optional(),
    decisionMemories: z.array(Phase2DecisionMemorySchema).max(100).optional(),
    incidentMemories: z.array(Phase2IncidentMemorySchema).max(100).optional(),
    architectureMemories: z.array(Phase2ArchitectureMemorySchema).max(100).optional(),
    processMemories: z.array(Phase2ProcessMemorySchema).max(100).optional(),
  })
  .refine(
    (value) =>
      (value.memories?.length ?? 0) > 0 ||
      (value.rawSignals?.length ?? 0) > 0 ||
      (value.slackSignals?.length ?? 0) > 0 ||
      (value.jiraSignals?.length ?? 0) > 0 ||
      (value.decisionMemories?.length ?? 0) > 0 ||
      (value.incidentMemories?.length ?? 0) > 0 ||
      (value.architectureMemories?.length ?? 0) > 0 ||
      (value.processMemories?.length ?? 0) > 0,
    {
      message:
        "At least one memory item is required across rawSignals, slackSignals, jiraSignals, memories, decisionMemories, incidentMemories, architectureMemories, or processMemories.",
      path: ["memories"],
    },
  );

export const CompanyBrainReasoningCaptureSchema = z.object({
  workspace: NonEmptyTrimmedString.optional(),
  project: NonEmptyTrimmedString.optional(),
  sourceType: NonEmptyTrimmedString,
  sourceRef: NonEmptyTrimmedString,
  customerPain: NonEmptyTrimmedString,
  productPriority: NonEmptyTrimmedString,
  task: NonEmptyTrimmedString,
  executionContext: NonEmptyTrimmedString,
  evidence: z.array(NonEmptyTrimmedString).min(1).max(30),
  relatedMemoryIds: z.array(NonEmptyTrimmedString).max(30).optional(),
  impactedFiles: z.array(NonEmptyTrimmedString).max(30).optional(),
  assumptions: z.array(NonEmptyTrimmedString).max(20).optional(),
  decisionPoints: z.array(NonEmptyTrimmedString).max(20).optional(),
  riskSignals: z.array(NonEmptyTrimmedString).max(20).optional(),
  requiredTests: z.array(NonEmptyTrimmedString).max(20).optional(),
  nextActions: z.array(NonEmptyTrimmedString).max(20).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export const CompanyBrainReasoningBriefSchema = z.object({
  project: NonEmptyTrimmedString.optional(),
  reasoningId: NonEmptyTrimmedString.optional(),
  task: NonEmptyTrimmedString.optional(),
  targetAgent: NonEmptyTrimmedString.optional(),
  includeRelatedMemories: z.boolean().optional().default(true),
}).refine((value) => Boolean(value.reasoningId) || Boolean(value.task), {
  message: "reasoningId or task is required",
  path: ["reasoningId"],
});

export const CompanyBrainExperienceCaptureSchema = z.object({
  workspace: NonEmptyTrimmedString.optional(),
  project: NonEmptyTrimmedString.optional(),
  sourceType: NonEmptyTrimmedString,
  sourceRef: NonEmptyTrimmedString,
  task: NonEmptyTrimmedString,
  problem: NonEmptyTrimmedString,
  context: NonEmptyTrimmedString,
  action: NonEmptyTrimmedString,
  mistake: NonEmptyTrimmedString.optional(),
  outcome: NonEmptyTrimmedString,
  lesson: NonEmptyTrimmedString,
  futureAgentInstruction: NonEmptyTrimmedString,
  evidence: z.array(NonEmptyTrimmedString).min(1).max(40),
  relatedMemoryIds: z.array(NonEmptyTrimmedString).max(30).optional(),
  relatedReasoningIds: z.array(NonEmptyTrimmedString).max(30).optional(),
  files: z.array(NonEmptyTrimmedString).max(40).optional(),
  tests: z.array(NonEmptyTrimmedString).max(30).optional(),
  riskLevel: z.enum(["low", "medium", "high", "blocked"]).optional(),
  status: z.enum(["captured", "reviewed", "skill_candidate", "archived"]).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export const MemoryIgnitionBeforeAgentSchema = z.object({
  workspace_id: NonEmptyTrimmedString.optional(),
  agent_id: NonEmptyTrimmedString.optional(),
  agent_type: NonEmptyTrimmedString.optional(),
  repo: NonEmptyTrimmedString.optional(),
  repo_or_task: NonEmptyTrimmedString.optional(),
  project: NonEmptyTrimmedString.optional(),
  task: NonEmptyTrimmedString.optional(),
  question: NonEmptyTrimmedString.optional(),
  task_intent: NonEmptyTrimmedString.optional(),
  current_files: z.array(NonEmptyTrimmedString).max(100).optional(),
  proposed_action: NonEmptyTrimmedString.optional(),
  action: NonEmptyTrimmedString.optional(),
  tool_name: NonEmptyTrimmedString.optional(),
  command: NonEmptyTrimmedString.optional(),
  available_tools: z.array(NonEmptyTrimmedString).max(100).optional(),
  risk_level: NonEmptyTrimmedString.optional(),
  workspace: NonEmptyTrimmedString.optional(),
  threadId: NonEmptyTrimmedString.optional(),
  topK: z.number().int().positive().max(20).optional(),
  includeArchived: z.boolean().optional(),
  mode: z.enum(["retrieve", "resume"]).optional(),
  related_reasoning_ids: z.array(NonEmptyTrimmedString).max(30).optional(),
  reasoning_context: z.object({
    reasoning_id: NonEmptyTrimmedString,
    task: NonEmptyTrimmedString,
    source_type: NonEmptyTrimmedString,
    source_ref: NonEmptyTrimmedString,
    reasoning_quality: z.object({
      status: NonEmptyTrimmedString,
      score: z.number().int().min(0).max(100),
    }).optional(),
    linked_experiences: z.array(z.object({
      task: NonEmptyTrimmedString,
      source_ref: NonEmptyTrimmedString,
    })).max(20).optional(),
    recommended_first_action: NonEmptyTrimmedString.optional(),
  }).optional(),
}).refine((value) => Boolean(value.question) || Boolean(value.task) || Boolean(value.task_intent), {
  message: "question, task, or task_intent is required",
  path: ["question"],
});

export const MemoryIgnitionSendNowSchema = z.object({
  workspace_id: NonEmptyTrimmedString.optional(),
  agent_id: NonEmptyTrimmedString.optional(),
  agent_type: NonEmptyTrimmedString.optional(),
  repo: NonEmptyTrimmedString.optional(),
  repo_or_task: NonEmptyTrimmedString.optional(),
  project: NonEmptyTrimmedString.optional(),
  task: NonEmptyTrimmedString.optional(),
  question: NonEmptyTrimmedString.optional(),
  task_intent: NonEmptyTrimmedString.optional(),
  current_files: z.array(NonEmptyTrimmedString).max(100).optional(),
  available_tools: z.array(NonEmptyTrimmedString).max(100).optional(),
  risk_level: NonEmptyTrimmedString.optional(),
  workspace: NonEmptyTrimmedString.optional(),
  threadId: NonEmptyTrimmedString.optional(),
  topK: z.number().int().positive().max(20).optional(),
  includeArchived: z.boolean().optional(),
  mode: z.enum(["retrieve", "resume"]).optional(),
  target_agent: NonEmptyTrimmedString.optional(),
  target_format: z.enum([
    "human_prompt",
    "agent_prompt",
    "codex_prompt",
    "cursor_prompt",
    "claude_prompt",
    "devin_task",
    "mcp_response",
    "api_json",
    "cli_output",
    "custom_json",
  ]).default("agent_prompt"),
  safety_mode: z.enum(["fast", "balanced", "strict"]).default("balanced"),
  related_reasoning_ids: z.array(NonEmptyTrimmedString).max(30).optional(),
  reasoning_context: z.object({
    reasoning_id: NonEmptyTrimmedString,
    task: NonEmptyTrimmedString,
    source_type: NonEmptyTrimmedString,
    source_ref: NonEmptyTrimmedString,
    reasoning_quality: z.object({
      status: NonEmptyTrimmedString,
      score: z.number().int().min(0).max(100),
    }).optional(),
    linked_experiences: z.array(z.object({
      task: NonEmptyTrimmedString,
      source_ref: NonEmptyTrimmedString,
    })).max(20).optional(),
    recommended_first_action: NonEmptyTrimmedString.optional(),
  }).optional(),
}).refine((value) => Boolean(value.question) || Boolean(value.task) || Boolean(value.task_intent), {
  message: "question, task, or task_intent is required",
  path: ["question"],
});

export const MemoryIgnitionOutcomeLearnSchema = z.object({
  message: NonEmptyTrimmedString.optional(),
  modelResponse: NonEmptyTrimmedString.optional(),
  threadId: NonEmptyTrimmedString.optional(),
  workspace_id: NonEmptyTrimmedString.optional(),
  agent_id: NonEmptyTrimmedString.optional(),
  repo_or_task: NonEmptyTrimmedString.optional(),
  task_intent: NonEmptyTrimmedString.optional(),
  outcome: NonEmptyTrimmedString.optional(),
  outcome_status: NonEmptyTrimmedString.optional(),
  files_touched: z.array(NonEmptyTrimmedString).max(100).optional(),
  tests_passed: z.array(NonEmptyTrimmedString).max(100).optional(),
  tests_failed: z.array(NonEmptyTrimmedString).max(100).optional(),
  what_worked: NonEmptyTrimmedString.optional(),
  what_failed: NonEmptyTrimmedString.optional(),
  future_agent_lesson: NonEmptyTrimmedString.optional(),
  tool_calls: z.array(NonEmptyTrimmedString).max(100).optional(),
  used_skill_ids: z.array(NonEmptyTrimmedString).max(50).optional(),
  skill_ids: z.array(NonEmptyTrimmedString).max(50).optional(),
  approvals_used: z.array(NonEmptyTrimmedString).max(50).optional(),
  risky_files_touched: z.array(NonEmptyTrimmedString).max(100).optional(),
  trace_proof_ids: z.array(NonEmptyTrimmedString).max(100).optional(),
  related_reasoning_ids: z.array(NonEmptyTrimmedString).max(30).optional(),
  send_event_id: NonEmptyTrimmedString.optional(),
  target_agent: NonEmptyTrimmedString.optional(),
  target_format: NonEmptyTrimmedString.optional(),
  risk_level: NonEmptyTrimmedString.optional(),
  contract: z.object({
    goal: NonEmptyTrimmedString.optional(),
    constraints: z.array(NonEmptyTrimmedString).max(20).optional(),
    decisions: z.array(NonEmptyTrimmedString).max(30).optional(),
    open_risks: z.array(NonEmptyTrimmedString).max(30).optional(),
    next_actions: z.array(NonEmptyTrimmedString).max(30).optional(),
  }).optional(),
  enforceContract: z.boolean().optional(),
}).refine((value) => Boolean(value.message) || Boolean(value.contract) || Boolean(value.outcome) || Boolean(value.modelResponse), {
  message: "message, outcome, modelResponse, or contract is required",
  path: ["message"],
});
