import { afterEach, describe, expect, it, vi } from "vitest";
import { createEpochClient } from "../packages/epoch-sdk/src";

const outcomeContract = {
  version: "outcome_contract.v1",
  required: true,
  required_after: "agent_action",
  endpoint: "/api/memory/memoryignition/outcome",
  sdk_method: "memoryos.saveOutcome",
  mcp_tool: "memoryignition_save_outcome",
  required_fields: ["outcome_status", "files_touched", "tests_passed", "tests_failed", "what_worked", "what_failed", "future_agent_lesson"],
  optional_fields: ["used_skill_ids", "risky_files_touched", "approvals_used", "trace_proof_ids"],
  hooks: ["Call memoryignition_save_outcome after acting."],
  trace_lineage: "Inheritance Event -> Outcome -> Experience -> Future MemoryIgnition Brief",
  enforcement: "required_for_outcome_learning",
} as const;

const standardBrief = {
  contextText: "MemoryIgnition brief",
  memories: [],
  source: "retrieve",
  relevant_memories: [],
  executable_skills: [],
  past_mistakes: [],
  risky_files: [],
  required_tests: ["npx tsc --noEmit"],
  forbidden_actions: [],
  approval_rules: {
    risk_level: "medium",
    derived_risk_level: "medium",
    approval_required: false,
    reason: "No risky files matched.",
    allowed_tools: ["read_files"],
    risk_signals: [],
  },
  recommended_first_action: "Review trace proof.",
  trace_proof: [],
  outcome_hooks: ["Call memoryignition_save_outcome after acting."],
  brief_proof_quality: {
    score: 80,
    grade: "B",
    status: "caution",
    trusted: false,
    checks: [],
    missing_requirements: [],
    recommendations: [],
  },
  evaluation_gate: {
    status: "caution",
    can_inherit: true,
    can_execute: true,
    requires_human_review: false,
    reason: "Brief can be inherited.",
    blockers: [],
    warnings: [],
    next_required_actions: [],
  },
  task_understanding: {
    task: "Ship SDK compatibility",
    task_intent: "Ship SDK compatibility",
    target_agent: "codex",
    source_mode: "retrieve",
    risk_level: "medium",
    available_tools: ["read_files"],
  },
  target_agent: {
    id: "codex",
    supported: true,
    delivery: "sdk",
  },
  inheritance_sections: {
    relevant_memory_count: 0,
    past_failure_count: 0,
    risky_file_count: 0,
    required_test_count: 1,
    approval_rule_count: 1,
    trace_proof_count: 0,
    approved_skill_count: 1,
    outcome_hook_count: 1,
  },
  past_failure_retrieval: [],
  risky_file_retrieval: [],
  required_test_retrieval: [
    {
      command: "npx tsc --noEmit",
      source: "approved_skill",
      source_ids: ["skill-approved-1"],
      reason: "Required by approved skill.",
    },
  ],
  approval_rule_retrieval: [
    {
      risk_level: "medium",
      approval_required: false,
      reason: "No risky files matched.",
      risk_signals: [],
      allowed_tools: ["read_files"],
    },
  ],
  skill_inheritance_proofs: [
    {
      skill_id: "skill-approved-1",
      skill_name: "SDK compatibility workflow",
      version: "0.1.0",
      approval_status: "approved",
      source_experience_id: "exp-1",
      source_ref: "skill_candidate:experience:exp-1",
      evidence: ["experience:exp-1"],
      required_tests: ["npx tsc --noEmit"],
      inheritance_rules: ["Keep API/SDK/MCP package shapes aligned."],
      supported_agent_types: ["codex"],
      confidence: 0.9,
      success_rate: null,
      lineage: "Experience -> Skill -> Approval -> MemoryIgnition Brief",
    },
  ],
  three_things: {
    version: "memoryignition_three_things.v1",
    what_agent_needs_to_know: ["The SDK compatibility workflow must preserve API, SDK, and MCP package shapes."],
    what_agent_must_be_careful_about: ["Keep the outcome contract and required tests aligned."],
    what_agent_should_do_next: ["Review trace proof.", "Save outcome after acting."],
    readiness_summary: "caution · medium risk · 0 proof links",
  },
  ready_to_send_prompt: "## Skill Inheritance Proof",
  standard_inheritance_package: {
    version: "standard_inheritance_package.v1",
    generated_at: "2026-06-24T00:00:00.000Z",
    workspace_id: null,
    agent_id: "codex",
    delivery: "sdk",
    task: {
      task: "Ship SDK compatibility",
      intent: "Ship SDK compatibility",
      risk_level: "medium",
      target_agent: "codex",
      source_mode: "retrieve",
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
      risky_files: [],
      forbidden_actions: [],
      risk_signals: [],
    },
    approval_rules: {
      risk_level: "medium",
      derived_risk_level: "medium",
      approval_required: false,
      reason: "No risky files matched.",
      allowed_tools: ["read_files"],
      risk_signals: [],
    },
    required_tests: ["npx tsc --noEmit"],
    trace_proof: [],
    gates: {
      memory: {
        version: "phase5.inheritance_gate.v1",
        status: "open",
        can_inherit: true,
        inherited_count: 0,
        review_count: 0,
        blocked_count: 0,
        withheld_count: 0,
        policy: "ready_and_review_only",
        next_actions: [],
      },
      skill: {
        version: "phase5.skill_gate.v1",
        status: "open",
        can_execute_skills: true,
        executable_count: 0,
        review_count: 0,
        blocked_count: 0,
        withheld_count: 0,
        policy: "approved_compatible_source_backed_only",
        next_actions: [],
      },
      proof: {
        status: "caution",
        can_inherit: true,
        can_execute: true,
        requires_human_review: false,
        reason: "Brief can be inherited.",
        blockers: [],
        warnings: [],
        next_required_actions: [],
      },
    },
    outcome_contract: outcomeContract,
    outcome: {
      hooks: ["Call memoryignition_save_outcome after acting."],
      save_required: true,
      contract: outcomeContract,
    },
  },
};

describe("MemoryOS SDK MemoryIgnition package contract", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the standard MemoryIgnition brief endpoint for createBrief and beforeModel", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: standardBrief }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createEpochClient({
      apiKey: "mk_test",
      baseUrl: "http://localhost:3011",
    });

    const created = await client.createBrief({
      question: "Ship SDK compatibility",
      agent_id: "codex",
    });
    const before = await client.beforeModel({
      userId: "u1",
      question: "Ship SDK compatibility",
      agent_id: "codex",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:3011/api/memory/memoryignition/brief",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:3011/api/memory/memoryignition/brief",
      expect.objectContaining({ method: "POST" }),
    );
    expect(created.skill_inheritance_proofs[0]).toMatchObject({
      skill_id: "skill-approved-1",
      lineage: "Experience -> Skill -> Approval -> MemoryIgnition Brief",
    });
    expect(before).toMatchObject({
      ready_to_send_prompt: expect.stringContaining("Skill Inheritance Proof"),
      three_things: expect.objectContaining({
        version: "memoryignition_three_things.v1",
        what_agent_needs_to_know: expect.arrayContaining([expect.any(String)]),
        what_agent_must_be_careful_about: expect.arrayContaining([expect.any(String)]),
        what_agent_should_do_next: expect.arrayContaining([expect.any(String)]),
      }),
      evaluation_gate: expect.objectContaining({ can_execute: true }),
      standard_inheritance_package: expect.objectContaining({
        version: "standard_inheritance_package.v1",
        delivery: "sdk",
      }),
      skill_inheritance_proofs: [
        expect.objectContaining({ source_experience_id: "exp-1" }),
      ],
    });
  });

  it("returns the canonical standard inheritance package directly for SDK consumers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: standardBrief }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createEpochClient({
      apiKey: "mk_test",
      baseUrl: "http://localhost:3011",
    });

    const pkg = await client.createInheritancePackage({
      question: "Ship SDK compatibility",
      agent_id: "codex",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3011/api/memory/memoryignition/brief",
      expect.objectContaining({ method: "POST" }),
    );
    expect(pkg).toMatchObject({
      version: "standard_inheritance_package.v1",
      delivery: "sdk",
      task: expect.objectContaining({ target_agent: "codex" }),
      outcome_contract: expect.objectContaining({
        version: "outcome_contract.v1",
        endpoint: "/api/memory/memoryignition/outcome",
        sdk_method: "memoryos.saveOutcome",
        mcp_tool: "memoryignition_save_outcome",
        required_fields: expect.arrayContaining(["future_agent_lesson"]),
      }),
      outcome: expect.objectContaining({ save_required: true }),
    });
  });

  it("uses the MemoryIgnition Send Now endpoint for target-agent delivery", async () => {
    const sendNowPayload = {
      version: "memoryignition_send_now.v1",
      send_event_id: "send_test",
      sent_at: "2026-06-24T00:00:00.000Z",
      target_agent: "codex",
      target_format: "codex_prompt",
      target_format_label: "Codex-ready prompt",
      safety_mode: "balanced",
      delivery: "sdk",
      outcome_required: true,
      preview: "MemoryIgnition package",
      payload: "MemoryIgnition package",
      json_package: {},
      standard_inheritance_package: standardBrief.standard_inheritance_package,
      three_things: standardBrief.three_things,
      readiness: {
        score: 80,
        status: "caution",
        can_execute: true,
        approval_required: false,
        risk_level: "medium",
      },
      next: "Save outcome.",
      brief: standardBrief,
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: sendNowPayload }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createEpochClient({
      apiKey: "mk_test",
      baseUrl: "http://localhost:3011",
    });

    const result = await client.sendNow({
      question: "Ship SDK compatibility",
      agent_id: "codex",
      target_agent: "codex",
      target_format: "codex_prompt",
      safety_mode: "balanced",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3011/api/memory/memoryignition/send-now",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("codex_prompt"),
      }),
    );
    expect(result).toMatchObject({
      version: "memoryignition_send_now.v1",
      target_agent: "codex",
      standard_inheritance_package: expect.objectContaining({
        version: "standard_inheritance_package.v1",
      }),
    });
  });

  it("returns Guardian action proof from the SDK risk-check endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          allowed: false,
          risk_level: "high",
          approval_required: true,
          action_guard: {
            action: "Edit auth middleware",
            allowed: false,
            blocked: true,
            approval_required: true,
            risk_level: "high",
            gate_status: "blocked",
            reason: "Proposed action touches risky files and requires approval.",
            risky_files: ["server/middleware/auth.ts"],
            required_tests: ["npx tsc --noEmit"],
            forbidden_actions: ["Do not deploy before approval."],
            recommended_first_action: "Request approval.",
            next_required_actions: ["Record human approval before touching matched risky files."],
            matched_risky_files: ["server/middleware/auth.ts"],
            matched_forbidden_actions: [],
            missing_required_tests: ["npx tsc --noEmit"],
            guard_proof: {
              version: "memoryignition_guard_proof.v1",
              status: "blocked",
              moment: "risk_check",
              action: "Edit auth middleware",
              allowed: false,
              blocked: true,
              approval_required: true,
              reason: "Proposed action touches risky files and requires approval.",
              checks: [
                { id: "brief_gate", label: "Brief execution gate", ok: false, detail: "Approval required." },
                { id: "risky_files", label: "Risky files", ok: false, detail: "1 risky file matched." },
              ],
              matched_risky_files: ["server/middleware/auth.ts"],
              matched_forbidden_actions: [],
              missing_required_tests: ["npx tsc --noEmit"],
              trace_proof_ids: ["mem-auth"],
              next_required_actions: ["Record human approval before touching matched risky files."],
            },
          },
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createEpochClient({
      apiKey: "mk_test",
      baseUrl: "http://localhost:3011",
    });

    const result = await client.riskCheck({
      question: "Edit auth middleware",
      risk_level: "high",
      current_files: ["server/middleware/auth.ts"],
      proposed_action: "Edit auth middleware",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3011/api/memory/memoryignition/risk-check",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("current_files"),
      }),
    );
    expect(result.action_guard).toMatchObject({
      blocked: true,
      matched_risky_files: ["server/middleware/auth.ts"],
      missing_required_tests: ["npx tsc --noEmit"],
      guard_proof: expect.objectContaining({
        version: "memoryignition_guard_proof.v1",
        status: "blocked",
        moment: "risk_check",
      }),
    });
  });

  it("sends outcome-learning fields to the standard MemoryIgnition outcome endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          acceptedCount: 1,
          rejectedCount: 0,
          outcome_recorded: true,
          outcome_proof: {
            version: "memoryignition_outcome_proof.v1",
            outcome_event_id: "outcome_test",
            send_event_id: "send_test",
            target_agent: "codex",
            target_format: "codex_prompt",
            source_ref: "send_test",
            lineage: "Send Now -> Agent Work -> Outcome -> Experience -> Future-Agent Inheritance",
            outcome_recorded: true,
            future_inheritance_ready: true,
            memory_updated: true,
            experience_updated: true,
            skill_confidence_updated: false,
            evidence: ["send-now:send_test"],
            missing_evidence: [],
            next_brief_query: "Retrieve prior outcome and experience for: SDK compatibility",
          },
          experience_promotion: {
            version: "memoryignition_experience_promotion.v1",
            promoted: true,
            experience_record_id: "exp_sdk",
            source_outcome_event_id: "outcome_test",
            source_send_event_id: "send_test",
            source_ref: "experience:after_model:act_sdk",
            lineage: "Outcome Proof -> Experience Record -> MemoryIgnition Brief",
            evidence: ["outcome-proof:outcome_test", "send-now:send_test", "experience:exp_sdk"],
            missing_evidence: [],
            future_agent_instruction: "Keep SDK and MCP contracts aligned with API.",
            next_brief_query: "Retrieve prior outcome and experience for: SDK compatibility",
          },
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createEpochClient({
      apiKey: "mk_test",
      baseUrl: "http://localhost:3011",
    });

    const result = await client.afterModel({
      userId: "u1",
      outcome: "SDK compatibility shipped.",
      outcome_status: "success",
      tests_passed: ["npx tsc --noEmit"],
      future_agent_lesson: "Keep SDK and MCP contracts aligned with API.",
      send_event_id: "send_test",
      target_agent: "codex",
      target_format: "codex_prompt",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3011/api/memory/memoryignition/outcome",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("send_event_id"),
      }),
    );
    expect(result).toMatchObject({
      acceptedCount: 1,
      outcome_recorded: true,
      outcome_proof: expect.objectContaining({
        version: "memoryignition_outcome_proof.v1",
        send_event_id: "send_test",
      }),
      experience_promotion: expect.objectContaining({
        version: "memoryignition_experience_promotion.v1",
        promoted: true,
        experience_record_id: "exp_sdk",
      }),
    });
  });
});
