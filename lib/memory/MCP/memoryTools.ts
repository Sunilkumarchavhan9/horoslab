import {
  afterModel,
  beforeModel,
  type AfterModelInput,
  type AfterModelResult,
  type BeforeModelInput,
  type BeforeModelResult,
} from "../../SDK/memoryHooks";
import { randomUUID } from "crypto";
import { runHandoffFlowLangGraph } from "../../workflows/handoffGraphLangGraph";
import type { HandoffPlannerResult } from "../handoffPlanner";
import { executePreflight, type PreflightInput } from "../preflightLogic";
import { listProductAgents } from "../../agents/productAgents";
import {
  createProductAgentSession,
  getProductAgentSession,
} from "../../agents/productAgentSessionStore";
import { getMemoryForUser } from "../listMemory";
import {
  getContinuityScore,
  getProjectStateSnapshot,
  getRankedNextActions,
  type ContinuityApiScope,
} from "../continuityApiService";
import {
  listExperienceLessons,
  listFailurePatterns,
  listRootCauses,
  searchVerificationExperiences,
} from "../../realityCompiler/experienceInsights";
import {
  buildExperienceRecommendations,
  findSimilarExperiences,
} from "../../realityCompiler/experienceRecommendation";

export type McpTool<Input, Output> = {
  name: string;
  description: string;
  execute: (input: Input) => Promise<Output>;
};

export type HandoffToolInput = {
  userId: string;
  project: string;
  question: string;
  workspace?: string;
  threadId?: string;
  topK?: number;
  includeArchived?: boolean;
};

export type ExperienceQueryToolInput = {
  userId: string;
  query?: string;
  limit?: number;
  verdict?: "PASS" | "FAIL" | "UNKNOWN";
  orgId?: string;
  org_id?: string;
};

export type ExperienceSimilarityToolInput = ExperienceQueryToolInput & {
  experienceId?: string;
  repository?: string;
};

export const beforeModelTool: McpTool<BeforeModelInput, BeforeModelResult> = {
  name: "memory.before_model",
  description: "Retrieve continuity context before a model call.",
  async execute(input) {
    return beforeModel(input);
  },
};

export const afterModelTool: McpTool<AfterModelInput, AfterModelResult> = {
  name: "memory.after_model",
  description: "Persist memory context after a model or user turn.",
  async execute(input) {
    return afterModel(input);
  },
};

export const handoffTool: McpTool<HandoffToolInput, HandoffPlannerResult> = {
  name: "memory.handoff",
  description: "Generate a handoff package for another human or agent.",
  async execute(input) {
    return runHandoffFlowLangGraph(input);
  },
};

export const preflightTool: McpTool<PreflightInput, Awaited<ReturnType<typeof executePreflight>>> = {
  name: "memoryos.preflight",
  description: "Returns the project state, decisions, blockers, active tasks, relevant files, and next recommended action before an AI agent continues work.",
  async execute(input) {
    return executePreflight(input);
  },
};

export type ListProductAgentsInput = Record<string, never>;

export const listProductAgentsTool: McpTool<ListProductAgentsInput, { agents: ReturnType<typeof listProductAgents> }> = {
  name: "memory.list_product_agents",
  description: "List MemoryOS native product agents and their allowed tools.",
  async execute() {
    return { agents: listProductAgents() };
  },
};

export type StartAgentSessionInput = {
  userId: string;
  agentId: string;
  orgId?: string;
  projectId?: string;
  goal?: string;
  goalId?: string;
};

export const startAgentSessionTool: McpTool<
  StartAgentSessionInput,
  { sessionId: string; session: Awaited<ReturnType<typeof createProductAgentSession>>; agent: ReturnType<typeof listProductAgents>[number] }
> = {
  name: "memory.start_agent_session",
  description:
    "Start a scoped product-agent session. Pass agentId (memory-engineer | engineering-continuity | ide-context). Use returned sessionId as X-MemoryOS-Agent-Session-Id on continuity and execution calls.",
  async execute(input) {
    const session = await createProductAgentSession(
      input.userId,
      {
        agentId: input.agentId,
        projectId: input.projectId ?? null,
        goal: input.goal ?? null,
        goalId: input.goalId ?? null,
      },
      input.orgId,
    );
    const agent = listProductAgents().find((entry) => entry.id === session.agentId);
    if (!agent) {
      throw new Error(`Unknown product agent "${input.agentId}".`);
    }
    return { sessionId: session.id, session, agent };
  },
};

export type GetAgentSessionInput = {
  userId: string;
  sessionId: string;
  orgId?: string;
};

export const getAgentSessionTool: McpTool<
  GetAgentSessionInput,
  { session: NonNullable<Awaited<ReturnType<typeof getProductAgentSession>>> } | { error: string }
> = {
  name: "memory.get_agent_session",
  description: "Fetch an active product-agent session by id.",
  async execute(input) {
    const session = await getProductAgentSession(input.userId, input.sessionId, input.orgId);
    if (!session) {
      return { error: "Session not found" };
    }
    return { session };
  },
};

export type ProjectContinuityToolInput = {
  userId: string;
  projectId: string;
  orgId?: string;
};

export const projectStateTool: McpTool<
  ProjectContinuityToolInput,
  Awaited<ReturnType<typeof getProjectStateSnapshot>>
> = {
  name: "memory.project_state",
  description:
    "Project continuity snapshot for agent resume — brief summary, active loop, drift, last action, and resume confidence. Call before continuing an interrupted task.",
  async execute(input) {
    const scope: ContinuityApiScope = {
      userId: input.userId,
      projectId: input.projectId,
      orgId: input.orgId,
    };
    return getProjectStateSnapshot(scope);
  },
};

export type NextActionsToolInput = ProjectContinuityToolInput & {
  limit?: number;
};

export const nextActionsTool: McpTool<
  NextActionsToolInput,
  { actions: Awaited<ReturnType<typeof getRankedNextActions>>; count: number }
> = {
  name: "memory.next_actions",
  description: "Ranked next actions from contract next_action memories and resume brief.",
  async execute(input) {
    const scope: ContinuityApiScope = {
      userId: input.userId,
      projectId: input.projectId,
      orgId: input.orgId,
    };
    const limit = Math.min(Math.max(input.limit ?? 10, 1), 30);
    const actions = await getRankedNextActions(scope, limit);
    return { actions, count: actions.length };
  },
};

export const continuityScoreTool: McpTool<
  ProjectContinuityToolInput,
  Awaited<ReturnType<typeof getContinuityScore>>
> = {
  name: "memory.continuity_score",
  description: "0-100 continuity score with factor breakdown for a project.",
  async execute(input) {
    const scope: ContinuityApiScope = {
      userId: input.userId,
      projectId: input.projectId,
      orgId: input.orgId,
    };
    return getContinuityScore(scope);
  },
};

export type MemoryIgnitionBriefInput = BeforeModelInput & {
  task?: string;
  task_intent?: string;
};

export const memoryIgnitionGetBriefTool: McpTool<MemoryIgnitionBriefInput, BeforeModelResult> = {
  name: "memoryignition_get_brief",
  description:
    "Get the standard MemoryIgnition inheritance package before an agent acts: task, reasoning, context, memories, experiences, approved skills, risk rules, approvals, outcome hooks, and trace proof.",
  async execute(input) {
    return beforeModel({
      ...input,
      question: input.question ?? input.task ?? input.task_intent ?? "Prepare MemoryIgnition brief.",
      mode: input.mode ?? "resume",
    });
  },
};

export const memoryIgnitionSearchMemoryTool: McpTool<BeforeModelInput, BeforeModelResult> = {
  name: "memoryignition_search_memory",
  description: "Search MemoryOS Company Brain memory for task-relevant context before a Codex turn.",
  async execute(input) {
    return beforeModel({
      ...input,
      mode: input.mode ?? "retrieve",
    });
  },
};

export type MemoryIgnitionSendNowTargetFormat =
  | "human_prompt"
  | "agent_prompt"
  | "codex_prompt"
  | "cursor_prompt"
  | "claude_prompt"
  | "devin_task"
  | "mcp_response"
  | "api_json"
  | "cli_output"
  | "custom_json";

export type MemoryIgnitionSendNowInput = BeforeModelInput & {
  task?: string;
  task_intent?: string;
  target_agent?: string;
  target_format?: MemoryIgnitionSendNowTargetFormat;
  safety_mode?: "fast" | "balanced" | "strict";
};

function memoryIgnitionSendNowFormatLabel(format: MemoryIgnitionSendNowTargetFormat): string {
  const labels: Record<MemoryIgnitionSendNowTargetFormat, string> = {
    human_prompt: "Human-readable brief",
    agent_prompt: "Generic agent prompt",
    codex_prompt: "Codex-ready prompt",
    cursor_prompt: "Cursor-ready prompt",
    claude_prompt: "Claude-ready prompt",
    devin_task: "Devin task brief",
    mcp_response: "MCP response",
    api_json: "API JSON package",
    cli_output: "CLI output",
    custom_json: "Custom JSON package",
  };
  return labels[format];
}

export const memoryIgnitionSendNowTool: McpTool<
  MemoryIgnitionSendNowInput,
  {
    version: "memoryignition_send_now.v1";
    send_event_id: string;
    sent_at: string;
    target_agent: string;
    target_format: MemoryIgnitionSendNowTargetFormat;
    target_format_label: string;
    safety_mode: "fast" | "balanced" | "strict";
    delivery: string;
    outcome_required: boolean;
    preview: string;
    payload: string;
    json_package: Record<string, unknown>;
    standard_inheritance_package: BeforeModelResult["standard_inheritance_package"];
    three_things: BeforeModelResult["three_things"];
    readiness: {
      score: number;
      status: string;
      can_execute: boolean;
      approval_required: boolean;
      risk_level: string;
    };
    next: string;
    brief: BeforeModelResult;
  }
> = {
  name: "memoryignition_send_now",
  description: "Generate the final target-agent delivery payload from the standard MemoryIgnition inheritance package.",
  async execute(input) {
    const brief = await beforeModel({
      ...input,
      question: input.question ?? input.task ?? input.task_intent ?? "Prepare MemoryIgnition package for target agent.",
      mode: input.mode ?? "resume",
    });
    const targetAgent = input.target_agent ?? input.agent_id ?? brief.target_agent?.id ?? "generic-agent";
    const targetFormat = input.target_format ?? "agent_prompt";
    const safetyMode = input.safety_mode ?? "balanced";
    const prompt = brief.copy_to_agent?.prompt ?? brief.ready_to_send_prompt ?? brief.contextText ?? "No MemoryIgnition prompt generated.";
    const jsonPackage = {
      target_agent: targetAgent,
      target_format: targetFormat,
      safety_mode: safetyMode,
      three_things: brief.three_things,
      standard_inheritance_package: brief.standard_inheritance_package,
      outcome_contract: brief.standard_inheritance_package.outcome_contract,
    };
    const payload =
      targetFormat === "api_json" || targetFormat === "custom_json" || targetFormat === "mcp_response"
        ? JSON.stringify(jsonPackage, null, 2)
        : targetFormat === "cli_output"
          ? [`memoryos prepare ${JSON.stringify(input.task ?? input.task_intent ?? input.question)} --agent ${targetAgent}`, "", prompt].join("\n")
          : prompt;

    return {
      version: "memoryignition_send_now.v1",
      send_event_id: `send_${randomUUID().slice(0, 12)}`,
      sent_at: new Date().toISOString(),
      target_agent: targetAgent,
      target_format: targetFormat,
      target_format_label: memoryIgnitionSendNowFormatLabel(targetFormat),
      safety_mode: safetyMode,
      delivery: brief.target_agent?.delivery ?? "mcp",
      outcome_required: Boolean(brief.standard_inheritance_package.outcome?.save_required),
      preview: payload.slice(0, 1200),
      payload,
      json_package: jsonPackage,
      standard_inheritance_package: brief.standard_inheritance_package,
      three_things: brief.three_things,
      readiness: {
        score: brief.brief_proof_quality.score,
        status: brief.evaluation_gate.status,
        can_execute: brief.evaluation_gate.can_execute,
        approval_required: brief.approval_rules.approval_required,
        risk_level: brief.approval_rules.derived_risk_level,
      },
      next: "Send this package to the target agent, then save outcome so future agents inherit the lesson.",
      brief,
    };
  },
};

export type MemoryIgnitionRiskCheckInput = BeforeModelInput & {
  task?: string;
  task_intent?: string;
  risk_level?: string;
};

export const memoryIgnitionRiskCheckTool: McpTool<
  MemoryIgnitionRiskCheckInput,
  {
    allowed: boolean;
    approval_required: boolean;
    risky_files: string[];
    required_tests: string[];
      forbidden_actions: string[];
      recommended_first_action: string | null;
      trace_proof: BeforeModelResult["trace_proof"];
      brief_proof_quality: BeforeModelResult["brief_proof_quality"];
      evaluation_gate: BeforeModelResult["evaluation_gate"];
      skill_inheritance_proofs: BeforeModelResult["skill_inheritance_proofs"];
      standard_inheritance_package: BeforeModelResult["standard_inheritance_package"];
    }
  > = {
  name: "memoryignition_risk_check",
  description: "Check MemoryIgnition risk, approvals, required tests, forbidden actions, and trace proof before tool use.",
  async execute(input) {
    const brief = await beforeModel({
      ...input,
      question: input.question ?? input.task ?? input.task_intent ?? "Check MemoryIgnition risk.",
      mode: input.mode ?? "resume",
    });
      const blocked = !brief.evaluation_gate.can_execute;
      return {
        allowed: !blocked,
        approval_required: brief.approval_rules.approval_required,
        risky_files: brief.risky_files,
        required_tests: brief.required_tests,
        forbidden_actions: brief.forbidden_actions,
        recommended_first_action: brief.recommended_first_action,
        trace_proof: brief.trace_proof,
        brief_proof_quality: brief.brief_proof_quality,
        evaluation_gate: brief.evaluation_gate,
        skill_inheritance_proofs: brief.skill_inheritance_proofs,
        standard_inheritance_package: brief.standard_inheritance_package,
      };
    },
  };

export const memoryIgnitionSaveOutcomeTool: McpTool<AfterModelInput, AfterModelResult> = {
  name: "memoryignition_save_outcome",
  description:
    "Save Codex task outcome back to MemoryOS so future agents inherit what changed, what worked, and what failed.",
  async execute(input) {
    return afterModel(input);
  },
};

export type MemoryIgnitionTraceProofInput = {
  userId: string;
  memoryId: string;
};

export const memoryIgnitionGetTraceProofTool: McpTool<
  MemoryIgnitionTraceProofInput,
  {
    memoryId: string;
    summary: string;
    traceProof: unknown;
    proofComplete: boolean;
    lineage: string;
  } | { error: string }
> = {
  name: "memoryignition_get_trace_proof",
  description: "Get source-backed trace proof for a Company Brain memory by id.",
  async execute(input) {
    const memory = await getMemoryForUser({ userId: input.userId, memoryId: input.memoryId });
    if (!memory) return { error: "Memory not found" };
    return {
      memoryId: memory.id,
      summary: memory.summary,
      traceProof: memory.traceProof ?? null,
      proofComplete: Boolean(memory.traceProof),
      lineage: "Source -> Memory -> Experience -> Skill -> Inheritance Event -> Outcome",
    };
  },
};

export const memoryIgnitionSearchExperiencesTool: McpTool<
  ExperienceQueryToolInput,
  Awaited<ReturnType<typeof searchVerificationExperiences>>
> = {
  name: "memoryignition_search_experiences",
  description: "Search verified Mission Control experiences for lessons, root causes, and evidence-backed PR outcomes.",
  async execute(input) {
    return searchVerificationExperiences({
      userId: input.userId,
      orgId: input.orgId ?? input.org_id,
      query: input.query,
      limit: input.limit,
      verdict: input.verdict,
    });
  },
};

export const memoryIgnitionListLessonsTool: McpTool<
  ExperienceQueryToolInput,
  Awaited<ReturnType<typeof listExperienceLessons>>
> = {
  name: "memoryignition_list_lessons",
  description: "List reusable lessons extracted from verified pull request missions.",
  async execute(input) {
    return listExperienceLessons({
      userId: input.userId,
      orgId: input.orgId ?? input.org_id,
      query: input.query,
      limit: input.limit,
    });
  },
};

export const memoryIgnitionListFailurePatternsTool: McpTool<
  ExperienceQueryToolInput,
  Awaited<ReturnType<typeof listFailurePatterns>>
> = {
  name: "memoryignition_list_failure_patterns",
  description: "List recurring failure patterns from verified pull request missions.",
  async execute(input) {
    return listFailurePatterns({
      userId: input.userId,
      orgId: input.orgId ?? input.org_id,
      query: input.query,
      limit: input.limit,
    });
  },
};

export const memoryIgnitionListRootCausesTool: McpTool<
  ExperienceQueryToolInput,
  Awaited<ReturnType<typeof listRootCauses>>
> = {
  name: "memoryignition_list_root_causes",
  description: "List root causes extracted from verified pull request missions.",
  async execute(input) {
    return listRootCauses({
      userId: input.userId,
      orgId: input.orgId ?? input.org_id,
      query: input.query,
      limit: input.limit,
    });
  },
};

export const memoryIgnitionFindSimilarExperiencesTool: McpTool<
  ExperienceSimilarityToolInput,
  Awaited<ReturnType<typeof findSimilarExperiences>>
> = {
  name: "memoryignition_find_similar_experiences",
  description: "Find similar verified experiences for a mission, repository, or query.",
  async execute(input) {
    return findSimilarExperiences({
      userId: input.userId,
      orgId: input.orgId ?? input.org_id,
      query: input.query,
      limit: input.limit,
      verdict: input.verdict,
      experienceId: input.experienceId,
      repository: input.repository,
    });
  },
};

export const memoryIgnitionGetExperienceRecommendationsTool: McpTool<
  ExperienceSimilarityToolInput,
  Awaited<ReturnType<typeof buildExperienceRecommendations>>
> = {
  name: "memoryignition_get_experience_recommendations",
  description: "Build experience-backed recommendations for the next verification or fix.",
  async execute(input) {
    return buildExperienceRecommendations({
      userId: input.userId,
      orgId: input.orgId ?? input.org_id,
      query: input.query,
      limit: input.limit,
      verdict: input.verdict,
      repository: input.repository,
    });
  },
};

export const memoryIgnitionCreateHandoffTool: McpTool<HandoffToolInput, HandoffPlannerResult> = {
  name: "memoryignition_create_handoff",
  description: "Create a MemoryOS handoff package for another agent or future Codex session.",
  async execute(input) {
    return runHandoffFlowLangGraph(input);
  },
};

export const memoryTools = [
  beforeModelTool,
  afterModelTool,
  handoffTool,
  memoryIgnitionGetBriefTool,
  memoryIgnitionSearchMemoryTool,
  memoryIgnitionSendNowTool,
  memoryIgnitionRiskCheckTool,
  memoryIgnitionSaveOutcomeTool,
  memoryIgnitionSearchExperiencesTool,
  memoryIgnitionListLessonsTool,
  memoryIgnitionListFailurePatternsTool,
  memoryIgnitionListRootCausesTool,
  memoryIgnitionFindSimilarExperiencesTool,
  memoryIgnitionGetExperienceRecommendationsTool,
  memoryIgnitionCreateHandoffTool,
  memoryIgnitionGetTraceProofTool,
  preflightTool,
  listProductAgentsTool,
  startAgentSessionTool,
  getAgentSessionTool,
  projectStateTool,
  nextActionsTool,
  continuityScoreTool,
] as const;

export function getMemoryTool(name: string): McpTool<unknown, unknown> | undefined {
  return memoryTools.find((tool) => tool.name === name) as McpTool<unknown, unknown> | undefined;
}
