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
  message: z.string().trim().min(1).optional(),
  modelResponse: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
  contract: z.object({
    goal: z.string().trim().min(1).optional(),
    constraints: z.array(z.string().trim().min(1)).max(20).optional(),
    decisions: z.array(z.string().trim().min(1)).max(30).optional(),
    open_risks: z.array(z.string().trim().min(1)).max(30).optional(),
    next_actions: z.array(z.string().trim().min(1)).max(30).optional(),
  }).optional(),
  enforceContract: z.boolean().optional(),
}).refine((value) => Boolean(value.message) || Boolean(value.contract), {
  message: "message or contract is required",
  path: ["message"],
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
