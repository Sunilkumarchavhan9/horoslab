import { z } from "zod";

const NonEmptyTrimmedString = z.string().trim().min(1);

export const MemoryContractSchema = z.object({
  goal: NonEmptyTrimmedString.optional(),
  constraints: z.array(NonEmptyTrimmedString).max(20).optional(),
  decisions: z.array(NonEmptyTrimmedString).max(30).optional(),
  open_risks: z.array(NonEmptyTrimmedString).max(30).optional(),
  next_actions: z.array(NonEmptyTrimmedString).max(30).optional(),
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
});

export const ContinueMemorySchema = z.object({
  question: z.string().min(1, "question is required"),
  mode: z.enum(["build_next", "debug_next", "learn_next"]).optional(),
  topK: z.number().int().positive().max(20).optional(),
  includeArchived: z.boolean().optional(),
  workspace: z.string().min(1).optional(),
  project: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
});

export const ResumeMemorySchema = z.object({
  project: z.string().min(1, "project is required"),
  question: z.string().min(1, "question is required"),
  topK: z.number().int().positive().max(20).optional(),
  includeArchived: z.boolean().optional(),
  workspace: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
});

export const HandoffMemorySchema = z.object({
  project: z.string().min(1, "project is required"),
  question: z.string().min(1, "question is required"),
  topK: z.number().int().positive().max(20).optional(),
  includeArchived: z.boolean().optional(),
  workspace: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
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
