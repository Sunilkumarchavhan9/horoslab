import { getMemoryTool, memoryTools } from "@/lib/memory/MCP";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

describe("Memory MCP contract", () => {
  beforeEach(() => {
    mocks.beforeModel.mockReset();
    mocks.afterModel.mockReset();
    mocks.runHandoffFlowLangGraph.mockReset();
  });

  it("registers the expected MCP tool names", () => {
    const names = memoryTools.map((tool) => tool.name);

    expect(names).toContain("memory.before_model");
    expect(names).toContain("memory.after_model");
    expect(names).toContain("memory.handoff");
    expect(names).toContain("memoryignition_get_brief");
    expect(names).toContain("memoryignition_search_memory");
    expect(names).toContain("memoryignition_search_experiences");
    expect(names).toContain("memoryignition_list_lessons");
    expect(names).toContain("memoryignition_list_failure_patterns");
    expect(names).toContain("memoryignition_list_root_causes");
    expect(names).toContain("memoryignition_send_now");
    expect(names).toContain("memoryignition_save_outcome");
    expect(names).toContain("memoryignition_create_handoff");
  });

  it("looks up a tool by name", () => {
    const tool = getMemoryTool("memory.before_model");

    expect(tool).toBeDefined();
    expect(tool?.name).toBe("memory.before_model");
  });

  it("executes beforeModel through the MCP wrapper", async () => {
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

    const tool = getMemoryTool("memory.before_model");
    const input = {
      userId: "u1",
      question: "what should I build next?",
    };

    const result = await tool!.execute(input);

    expect(mocks.beforeModel).toHaveBeenCalledWith(input);
    expect(result).toHaveProperty("source", "retrieve");
  });

  it("executes MemoryIgnition get brief alias with resume mode", async () => {
    mocks.beforeModel.mockResolvedValue({
      contextText: "MemoryIgnition brief",
      memories: [],
      source: "resume",
      skill_inheritance_proofs: [
        {
          skill_id: "skill-1",
          skill_name: "Safe migration workflow",
          version: "0.1.0",
          approval_status: "approved",
          source_experience_id: "exp-1",
          source_ref: "skill_candidate:experience:exp-1",
          evidence: ["experience:exp-1"],
          required_tests: ["npx tsc --noEmit"],
          inheritance_rules: ["Only inherit after approval."],
          supported_agent_types: ["codex"],
          confidence: 0.9,
          success_rate: null,
          lineage: "Experience -> Skill -> Approval -> MemoryIgnition Brief",
        },
      ],
    });

    const tool = getMemoryTool("memoryignition_get_brief");
    const input = {
      userId: "u1",
      question: "ship codex bridge",
      agent_id: "codex",
    };

    const result = await tool!.execute(input);

    expect(mocks.beforeModel).toHaveBeenCalledWith({
      ...input,
      mode: "resume",
    });
    expect(result).toHaveProperty("source", "resume");
    expect(result).toHaveProperty("skill_inheritance_proofs");
    expect(result).toMatchObject({
      skill_inheritance_proofs: [
        expect.objectContaining({
          skill_id: "skill-1",
          lineage: "Experience -> Skill -> Approval -> MemoryIgnition Brief",
        }),
      ],
    });
  });

  it("executes MemoryIgnition send-now with a standard inheritance package", async () => {
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

    const tool = getMemoryTool("memoryignition_send_now");
    const input = {
      userId: "u1",
      question: "ship codex bridge",
      agent_id: "codex",
      target_agent: "codex",
      target_format: "codex_prompt",
      safety_mode: "balanced",
    };

    const result = await tool!.execute(input);

    expect(mocks.beforeModel).toHaveBeenCalledWith({
      ...input,
      mode: "resume",
    });
    expect(result).toMatchObject({
      version: "memoryignition_send_now.v1",
      target_agent: "codex",
      target_format: "codex_prompt",
      payload: "Send this to Codex.",
      standard_inheritance_package: expect.objectContaining({
        version: "standard_inheritance_package.v1",
      }),
    });
  });

  it("executes afterModel through the MCP wrapper", async () => {
    mocks.afterModel.mockResolvedValue({
      acceptedCount: 1,
      rejectedCount: 0,
    });

    const tool = getMemoryTool("memory.after_model");
    const input = {
      userId: "u2",
      message: "I fixed the SDK tests",
      modelResponse: "Next wire MCP.",
      threadId: "thread-1",
    };

    const result = await tool!.execute(input);

    expect(mocks.afterModel).toHaveBeenCalledWith(input);
    expect(result).toHaveProperty("acceptedCount", 1);
  });

  it("executes handoff workflow through the MCP wrapper", async () => {
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

    const tool = getMemoryTool("memory.handoff");
    const input = {
      userId: "u3",
      project: "memoryos",
      question: "prepare a handoff",
      workspace: "ws-alpha",
      threadId: "thread-7",
    };

    const result = await tool!.execute(input);

    expect(mocks.runHandoffFlowLangGraph).toHaveBeenCalledWith(input);
    expect(result).toHaveProperty("summary");
  });
});
