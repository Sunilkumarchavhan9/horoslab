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
});
