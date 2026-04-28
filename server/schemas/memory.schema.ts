import { z } from "zod";

export const ProcessMemorySchema = z.object({
  userId: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
  message: z.string().min(1, "message is required"),
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
