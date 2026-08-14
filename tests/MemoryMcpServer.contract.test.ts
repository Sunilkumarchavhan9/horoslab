import { beforeEach, describe, expect, it, vi } from "vitest";
import { invokeMemoryTool, listMemoryTools } from "@/lib/memory/MCP";

const mocks = vi.hoisted(() => ({
  beforeModel: vi.fn(),
  afterModel: vi.fn(),
  runHandoffFlowLangGraph: vi.fn(),
}));

vi.mock("../lib/SDK/memoryHooks", () => ({
  beforeModel: mocks.beforeModel,
  afterModel: mocks.afterModel,
}));

vi.mock("../lib/workflows/handoffGraphLangGraph", () => ({
  runHandoffFlowLangGraph: mocks.runHandoffFlowLangGraph,
}));

const outcomeContract = {
  version: "outcome_contract.v1",
  required: true,
  required_after: "agent_action",
  endpoint: "/api/memory/memoryignition/outcome",
  sdk_method: "memoryos.saveOutcome",
  mcp_tool: "memoryignition_save_outcome",
  required_fields: ["outcome_status", "files_touched", "tests_passed", "tests_failed", "what_worked", "what_failed", "future_agent_lesson"],
  optional_fields: ["used_skill_ids", "risky_files_touched", "approvals_used", "trace_proof_ids"],
  hooks: [],
  trace_lineage: "Inheritance Event -> Outcome -> Experience -> Future MemoryIgnition Brief",
  enforcement: "required_for_outcome_learning",
} as const;

describe("Memory MCP server contract", () => {
  beforeEach(() => {
    mocks.beforeModel.mockReset();
    mocks.afterModel.mockReset();
    mocks.runHandoffFlowLangGraph.mockReset();
  });

  it("lists memory MCP tools", () => {
    const tools = listMemoryTools();

    expect(tools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "memory.before_model" }),
        expect.objectContaining({ name: "memory.after_model" }),
        expect.objectContaining({ name: "memory.handoff" }),
        expect.objectContaining({ name: "memoryignition_get_brief" }),
        expect.objectContaining({ name: "memoryignition_send_now" }),
        expect.objectContaining({ name: "memoryignition_save_outcome" }),
        expect.objectContaining({ name: "memoryignition_search_experiences" }),
        expect.objectContaining({ name: "memoryignition_list_lessons" }),
        expect.objectContaining({ name: "memoryignition_list_failure_patterns" }),
        expect.objectContaining({ name: "memoryignition_list_root_causes" }),
      ]),
    );
  });

  it("returns a clean error for an unknown memory tool", async () => {
    const result = await invokeMemoryTool("memory.unknown", {});

    expect(result).toEqual({
      code: "NOT_FOUND",
      error: "Unknown memory tool: memory.unknown",
    });
  });

  it("returns a validation error for bad memory.before_model input", async () => {
    const result = await invokeMemoryTool("memory.before_model", {
      userId: "u1",
    });

    expect(result).toEqual({
      code: "BAD_REQUEST",
      error: "Invalid memory tool input",
      details: expect.any(Object),
    });
  });

  it("invokes memory.before_model through the dispatcher", async () => {
    mocks.beforeModel.mockResolvedValue({
      contextText: "1. [project] User is building MemoryOS",
      memories: [
        {
          id: "m1",
          content: "User is building MemoryOS",
          memoryType: "project",
          finalScore: 0.95,
        },
      ],
      source: "retrieve",
    });

    const input = {
      userId: "u1",
      question: "what should I build next?",
    };

    const result = await invokeMemoryTool("memory.before_model", input);

    expect(mocks.beforeModel).toHaveBeenCalledWith(input);
    expect(result).toHaveProperty("source", "retrieve");
  });

  it("invokes memory.after_model through the dispatcher", async () => {
    mocks.afterModel.mockResolvedValue({
      acceptedCount: 1,
      rejectedCount: 0,
    });

    const input = {
      userId: "u2",
      message: "I fixed the SDK tests",
      modelResponse: "Next wire MCP.",
      threadId: "thread-1",
    };

    const result = await invokeMemoryTool("memory.after_model", input);

    expect(mocks.afterModel).toHaveBeenCalledWith(input);
    expect(result).toHaveProperty("acceptedCount", 1);
  });

  it("invokes memoryignition_get_brief through the dispatcher", async () => {
    mocks.beforeModel.mockResolvedValue({
      contextText: "Codex inherited MemoryOS context",
      memories: [],
      source: "resume",
    });

    const input = {
      userId: "u1",
      question: "prepare Codex bridge",
      agent_id: "codex",
    };

    const result = await invokeMemoryTool("memoryignition_get_brief", input);

    expect(mocks.beforeModel).toHaveBeenCalledWith({
      ...input,
      mode: "resume",
    });
    expect(result).toHaveProperty("source", "resume");
  });

  it("invokes memoryignition_risk_check with the evaluation gate", async () => {
    mocks.beforeModel.mockResolvedValue({
      contextText: "Codex inherited MemoryOS context",
      memories: [],
      source: "resume",
      approval_rules: {
        approval_required: true,
      },
      risky_files: ["server/routes/memory.routes.ts"],
      required_tests: ["npx tsc --noEmit"],
      forbidden_actions: ["Do not deploy before approval."],
      recommended_first_action: "Review trace proof.",
      trace_proof: [],
      brief_proof_quality: {
        score: 70,
        grade: "B",
        status: "caution",
        trusted: false,
        checks: [],
        missing_requirements: ["Approved skills"],
        recommendations: ["Approve skill before autonomous execution."],
      },
      evaluation_gate: {
        status: "caution",
        can_inherit: true,
        can_execute: false,
        requires_human_review: true,
        reason: "Brief can be inherited only with review before execution.",
        blockers: [],
        warnings: ["Approval is required."],
        next_required_actions: ["Record approval before execution."],
      },
      skill_inheritance_proofs: [
        {
          skill_id: "skill-approved-1",
          skill_name: "Safe backend route change",
          version: "0.1.0",
          approval_status: "approved",
          source_experience_id: "exp-1",
          source_ref: "skill_candidate:experience:exp-1",
          evidence: ["experience:exp-1"],
          required_tests: ["npx tsc --noEmit"],
          inheritance_rules: ["Use only after approval."],
          supported_agent_types: ["codex"],
          confidence: 0.9,
          success_rate: null,
          lineage: "Experience -> Skill -> Approval -> MemoryIgnition Brief",
        },
      ],
      standard_inheritance_package: {
        version: "standard_inheritance_package.v1",
        generated_at: "2026-06-24T00:00:00.000Z",
        workspace_id: null,
        agent_id: "codex",
        delivery: "mcp",
        task: {
          task: "check risky Codex action",
          intent: "check risky Codex action",
          risk_level: "medium",
          target_agent: "codex",
          source_mode: "resume",
        },
        context: {
          recommended_first_action: "Review trace proof.",
          relevant_memory_count: 0,
          related_experience_count: 0,
          executable_skill_count: 0,
        },
        memories: [],
        review_memories: [],
        withheld_memories: [],
        experiences: [],
        executable_skills: [],
        review_skills: [],
        withheld_skills: [],
        risk_rules: {
          risky_files: ["server/routes/memory.routes.ts"],
          forbidden_actions: ["Do not deploy before approval."],
          risk_signals: [],
        },
        approval_rules: {
          approval_required: true,
        },
        required_tests: ["npx tsc --noEmit"],
        trace_proof: [],
        gates: {
          memory: { version: "phase5.inheritance_gate.v1" },
          skill: { version: "phase5.skill_gate.v1" },
          proof: {
            status: "caution",
            can_execute: false,
          },
        },
        outcome_contract: outcomeContract,
        outcome: {
          hooks: [],
          save_required: false,
          contract: outcomeContract,
        },
      },
    });

    const input = {
      userId: "u1",
      question: "check risky Codex action",
      agent_id: "codex",
    };

    const result = await invokeMemoryTool("memoryignition_risk_check", input);

    expect(mocks.beforeModel).toHaveBeenCalledWith({
      ...input,
      mode: "resume",
    });
    expect(result).toMatchObject({
      allowed: false,
      approval_required: true,
      evaluation_gate: expect.objectContaining({
        status: "caution",
        can_execute: false,
      }),
      skill_inheritance_proofs: [
        expect.objectContaining({
          skill_id: "skill-approved-1",
          lineage: "Experience -> Skill -> Approval -> MemoryIgnition Brief",
        }),
      ],
      standard_inheritance_package: expect.objectContaining({
        version: "standard_inheritance_package.v1",
        delivery: "mcp",
        outcome_contract: expect.objectContaining({
          version: "outcome_contract.v1",
          mcp_tool: "memoryignition_save_outcome",
        }),
      }),
    });
  });

  it("accepts outcome learning fields through the MCP dispatcher", async () => {
    mocks.afterModel.mockResolvedValue({
      acceptedCount: 1,
      rejectedCount: 0,
      outcome_recorded: true,
    });

    const input = {
      userId: "u2",
      outcome: "Codex shipped the SDK compatibility slice.",
      outcome_status: "success",
      tests_passed: ["npx tsc --noEmit"],
      tests_failed: [],
      what_worked: "SDK and MCP shared the same brief shape.",
      future_agent_lesson: "Keep API/SDK/MCP inheritance contracts in sync.",
      used_skill_ids: ["skill-approved-1"],
    };

    const result = await invokeMemoryTool("memoryignition_save_outcome", input);

    expect(mocks.afterModel).toHaveBeenCalledWith(input);
    expect(result).toMatchObject({
      acceptedCount: 1,
      outcome_recorded: true,
    });
  });

  it("invokes memory.after_model with contract-only payload", async () => {
    mocks.afterModel.mockResolvedValue({
      acceptedCount: 1,
      rejectedCount: 0,
      contractFieldCount: 3,
    });

    const input = {
      userId: "u2",
      contract: {
        goal: "Ship MCP contract support.",
        decisions: ["Use MCP invoke as the shared contract path."],
        next_actions: ["Add contract-only MCP tests."],
      },
      enforceContract: true,
      threadId: "thread-contract-1",
    };

    const result = await invokeMemoryTool("memory.after_model", input);

    expect(mocks.afterModel).toHaveBeenCalledWith(input);
    expect(result).toHaveProperty("acceptedCount", 1);
    expect(result).toHaveProperty("contractFieldCount", 3);
  });

  it("invokes memory.handoff through the dispatcher", async () => {
    mocks.runHandoffFlowLangGraph.mockResolvedValue({
      summary: "Handoff for MemoryOS.",
      currentState: "Trust layer work is in progress.",
      openLoops: ["Finish the MCP wrapper tests."],
      recommendedNextActions: ["Wire the MCP registry export."],
      keyMemories: [],
      debug: {
        project: "memoryos",
        retrieval: [],
      },
    });

    const input = {
      userId: "u3",
      project: "memoryos",
      question: "prepare a handoff",
      workspace: "ws-alpha",
      threadId: "thread-7",
    };

    const result = await invokeMemoryTool("memory.handoff", input);

    expect(mocks.runHandoffFlowLangGraph).toHaveBeenCalledWith(input);
    expect(result).toHaveProperty("summary");
  });

  it("invokes memoryignition_send_now through the dispatcher", async () => {
    mocks.beforeModel.mockResolvedValue({
      contextText: "MemoryIgnition package",
      memories: [],
      source: "resume",
      ready_to_send_prompt: "Send this to Codex.",
      copy_to_agent: { prompt: "Send this to Codex." },
      target_agent: { id: "codex", delivery: "mcp" },
      three_things: {
        version: "memoryignition_three_things.v1",
        what_agent_needs_to_know: ["Use source-backed memory."],
        what_agent_must_be_careful_about: ["Save outcome."],
        what_agent_should_do_next: ["Act safely."],
        readiness_summary: "ready",
      },
      brief_proof_quality: { score: 80 },
      evaluation_gate: { status: "caution", can_execute: true },
      approval_rules: { approval_required: false, derived_risk_level: "medium" },
      standard_inheritance_package: {
        version: "standard_inheritance_package.v1",
        outcome_contract: { version: "outcome_contract.v1" },
        outcome: { save_required: true },
      },
    });

    const input = {
      userId: "u1",
      question: "prepare Codex bridge",
      agent_id: "codex",
      target_agent: "codex",
      target_format: "codex_prompt",
      safety_mode: "balanced",
    };

    const result = await invokeMemoryTool("memoryignition_send_now", input);

    expect(mocks.beforeModel).toHaveBeenCalledWith({
      ...input,
      mode: "resume",
    });
    expect(result).toMatchObject({
      version: "memoryignition_send_now.v1",
      target_agent: "codex",
      target_format: "codex_prompt",
      payload: "Send this to Codex.",
    });
  });
});
