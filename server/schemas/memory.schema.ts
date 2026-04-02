import { z } from "zod";

export const ProcessMemorySchema = z.object({
  userId: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
  message: z.string().min(1, "message is required"),
});

export const RetrieveMemorySchema = z.object({
  userId: z.string().min(1).optional(),
  question: z.string().min(1, "question is required"),
  topK: z.number().int().positive().max(20).optional(),
  includeArchived: z.boolean().optional(),
});

export const ContinueMemorySchema = z.object({
  question: z.string().min(1, "question is required"),
  mode: z.enum(["build_next", "debug_next", "learn_next"]).optional(),
  topK: z.number().int().positive().max(20).optional(),
  includeArchived: z.boolean().optional(),
});

export const ResumeMemorySchema = z.object({
  project: z.string().min(1, "project is required"),
  question: z.string().min(1, "question is required"),
  topK: z.number().int().positive().max(20).optional(),
  includeArchived: z.boolean().optional(),
});

export const MemoryStatusPatchSchema = z.object({
  status: z.enum(["active", "archived", "merged"]),
});

export const RetrievalWeightsSchema = z.object({
  semantic: z.number().min(0).max(1),
  typeRelevance: z.number().min(0).max(1),
  importance: z.number().min(0).max(1),
  recency: z.number().min(0).max(1),
});
