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
  workspace_id: z.string().min(1).optional(),
  agent_id: z.string().min(1).optional(),
  repo_or_task: z.string().min(1).optional(),
  task_intent: z.string().min(1).optional(),
  available_tools: z.array(z.string().min(1)).max(100).optional(),
  risk_level: z.string().min(1).optional(),
  workspace: z.string().min(1).optional(),
  project: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
  repo: z.string().min(1).optional(),
  org_id: z.string().min(1).optional(),
  orgId: z.string().min(1).optional(),
  mode: z.enum(["retrieve", "resume"]).optional(),
  topK: z.number().int().positive().max(20).optional(),
  includeArchived: z.boolean().optional(),
});

const memoryIgnitionSendNowInputSchema = beforeModelInputSchema.extend({
  task: z.string().min(1).optional(),
  target_agent: z.string().min(1).optional(),
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
  ]).optional(),
  safety_mode: z.enum(["fast", "balanced", "strict"]).optional(),
});

const experienceQueryInputSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  query: z.string().min(1).optional(),
  limit: z.number().int().positive().max(50).optional(),
  verdict: z.enum(["PASS", "FAIL", "UNKNOWN"]).optional(),
  orgId: z.string().min(1).optional(),
  org_id: z.string().min(1).optional(),
});

const experienceSimilarityInputSchema = experienceQueryInputSchema.extend({
  experienceId: z.string().min(1).optional(),
  repository: z.string().min(1).optional(),
});

const afterModelInputSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  message: z.string().trim().min(1).optional(),
  modelResponse: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
  workspace_id: z.string().min(1).optional(),
  agent_id: z.string().min(1).optional(),
  repo_or_task: z.string().min(1).optional(),
  task_intent: z.string().min(1).optional(),
  org_id: z.string().min(1).optional(),
  orgId: z.string().min(1).optional(),
  outcome: z.string().min(1).optional(),
  outcome_status: z.string().min(1).optional(),
  files_touched: z.array(z.string().min(1)).max(100).optional(),
  tool_calls: z.array(z.string().min(1)).max(100).optional(),
  tests_passed: z.array(z.string().min(1)).max(100).optional(),
  tests_failed: z.array(z.string().min(1)).max(100).optional(),
  what_worked: z.string().min(1).optional(),
  what_failed: z.string().min(1).optional(),
  future_agent_lesson: z.string().min(1).optional(),
  used_skill_ids: z.array(z.string().min(1)).max(50).optional(),
  skill_ids: z.array(z.string().min(1)).max(50).optional(),
  send_event_id: z.string().min(1).optional(),
  target_agent: z.string().min(1).optional(),
  target_format: z.string().min(1).optional(),
  risk_level: z.string().min(1).optional(),
  contract: z.object({
    goal: z.string().trim().min(1).optional(),
    constraints: z.array(z.string().trim().min(1)).max(20).optional(),
    decisions: z.array(z.string().trim().min(1)).max(30).optional(),
    open_risks: z.array(z.string().trim().min(1)).max(30).optional(),
    next_actions: z.array(z.string().trim().min(1)).max(30).optional(),
  }).optional(),
  enforceContract: z.boolean().optional(),
}).refine((value) => Boolean(value.message) || Boolean(value.contract) || Boolean(value.outcome) || Boolean(value.modelResponse), {
  message: "message, outcome, modelResponse, or contract is required",
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

const preflightInputSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  projectId: z.string().min(1).optional(),
  agentId: z.string().min(1).optional(),
  tool: z.string().min(1).optional(),
  task: z.string().min(1).optional(),
  mode: z.string().min(1).optional(),
  currentFiles: z.array(z.string().min(1)).optional(),
});

const listProductAgentsInputSchema = z.object({}).passthrough();

const startAgentSessionInputSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  agentId: z.string().min(1, "agentId is required"),
  orgId: z.string().min(1).optional(),
  projectId: z.string().min(1).optional(),
  goal: z.string().min(1).optional(),
  goalId: z.string().min(1).optional(),
});

const getAgentSessionInputSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  sessionId: z.string().min(1, "sessionId is required"),
  orgId: z.string().min(1).optional(),
});

const projectContinuityInputSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  projectId: z.string().min(1, "projectId is required"),
  orgId: z.string().min(1).optional(),
});

const nextActionsInputSchema = projectContinuityInputSchema.extend({
  limit: z.number().int().positive().max(30).optional(),
});

const toolInputSchemas = {
  "memory.before_model": beforeModelInputSchema,
  "memory.after_model": afterModelInputSchema,
  "memory.handoff": handoffInputSchema,
  "memoryignition_get_brief": beforeModelInputSchema.extend({
    task: z.string().min(1).optional(),
  }),
  "memoryignition_search_memory": beforeModelInputSchema,
  "memoryignition_send_now": memoryIgnitionSendNowInputSchema,
  "memoryignition_risk_check": beforeModelInputSchema.extend({
    task: z.string().min(1).optional(),
  }),
  "memoryignition_save_outcome": afterModelInputSchema,
  "memoryignition_create_handoff": handoffInputSchema,
  "memoryignition_get_trace_proof": z.object({
    userId: z.string().min(1, "userId is required"),
    memoryId: z.string().min(1, "memoryId is required"),
  }),
  "memoryignition_search_experiences": experienceQueryInputSchema,
  "memoryignition_list_lessons": experienceQueryInputSchema,
  "memoryignition_list_failure_patterns": experienceQueryInputSchema,
  "memoryignition_list_root_causes": experienceQueryInputSchema,
  "memoryignition_find_similar_experiences": experienceSimilarityInputSchema,
  "memoryignition_get_experience_recommendations": experienceSimilarityInputSchema,
  "memoryos.preflight": preflightInputSchema,
  "memory.list_product_agents": listProductAgentsInputSchema,
  "memory.start_agent_session": startAgentSessionInputSchema,
  "memory.get_agent_session": getAgentSessionInputSchema,
  "memory.project_state": projectContinuityInputSchema,
  "memory.next_actions": nextActionsInputSchema,
  "memory.continuity_score": projectContinuityInputSchema,
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
