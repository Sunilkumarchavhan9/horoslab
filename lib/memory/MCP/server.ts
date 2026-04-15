import { z } from "zod";
import { getMemoryTool, memoryTools } from "./memoryTools";

export type MemoryToolDescriptor = {
  name: string;
  description: string;
};

export type InvokeMemoryToolError = {
  code: "BAD_REQUEST" | "NOT_FOUND";
  error: string;
  details?: unknown;
};

const beforeModelInputSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  question: z.string().min(1, "question is required"),
  workspace: z.string().min(1).optional(),
  project: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
  mode: z.enum(["retrieve", "resume"]).optional(),
  topK: z.number().int().positive().max(20).optional(),
  includeArchived: z.boolean().optional(),
});

const afterModelInputSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  message: z.string().min(1, "message is required"),
  modelResponse: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
});

const handoffInputSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  project: z.string().min(1, "project is required"),
  question: z.string().min(1, "question is required"),
  workspace: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
  topK: z.number().int().positive().max(20).optional(),
  includeArchived: z.boolean().optional(),
});

const toolInputSchemas = {
  "memory.before_model": beforeModelInputSchema,
  "memory.after_model": afterModelInputSchema,
  "memory.handoff": handoffInputSchema,
} as const;

export function listMemoryTools(): MemoryToolDescriptor[] {
  return memoryTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
  }));
}

export async function invokeMemoryTool(
  name: string,
  input: unknown,
): Promise<unknown | InvokeMemoryToolError> {
  const tool = getMemoryTool(name);

  if (!tool) {
    return {
      code: "NOT_FOUND",
      error: `Unknown memory tool: ${name}`,
    };
  }

  const inputSchema = toolInputSchemas[name as keyof typeof toolInputSchemas];
  if (!inputSchema) {
    return {
      code: "NOT_FOUND",
      error: `No input schema is registered for memory tool: ${name}`,
    };
  }

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      code: "BAD_REQUEST",
      error: "Invalid memory tool input",
      details: parsed.error.flatten(),
    };
  }

  const result = await tool.execute(parsed.data as never);
  return result;
}
