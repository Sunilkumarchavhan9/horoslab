import { beforeEach, describe, expect, it, vi } from "vitest";
import { afterModel, beforeModel } from "../lib/SDK/memoryHooks";

const mocks = vi.hoisted(() => ({
  runRetrieveFlowLangGraph: vi.fn(),
  runResumeFlowLangGraph: vi.fn(),
  runIngestFlowLangGraph: vi.fn(),
  createActionMemory: vi.fn(),
  createExecutionOutcome: vi.fn(),
  persistExperienceGraphMemory: vi.fn(),
  selectApprovedExecutableSkills: vi.fn(),
  recordSkillOutcome: vi.fn(),
}));

vi.mock("../lib/workflows/retrieveGraphLangGraph", () => ({
  runRetrieveFlowLangGraph: mocks.runRetrieveFlowLangGraph,
}));

vi.mock("../lib/workflows/resumeGraphLangGraph", () => ({
  runResumeFlowLangGraph: mocks.runResumeFlowLangGraph,
}));

vi.mock("../lib/workflows/ingestGraphLangGraph", () => ({
  runIngestFlowLangGraph: mocks.runIngestFlowLangGraph,
}));

vi.mock("../lib/memory/actionMemoryStore", () => ({
  createActionMemory: mocks.createActionMemory,
  createExecutionOutcome: mocks.createExecutionOutcome,
}));

vi.mock("../lib/companyBrain/experienceGraph", () => ({
  persistExperienceGraphMemory: mocks.persistExperienceGraphMemory,
}));

vi.mock("../lib/companyBrain/skillGraph", () => ({
  selectApprovedExecutableSkills: mocks.selectApprovedExecutableSkills,
  recordSkillOutcome: mocks.recordSkillOutcome,
}));

describe("MemoryIgnition Phase 1 hooks contract", () => {
  beforeEach(() => {
    mocks.runRetrieveFlowLangGraph.mockReset();
    mocks.runResumeFlowLangGraph.mockReset();
    mocks.runIngestFlowLangGraph.mockReset();
    mocks.createActionMemory.mockReset();
    mocks.createExecutionOutcome.mockReset();
    mocks.persistExperienceGraphMemory.mockReset();
    mocks.selectApprovedExecutableSkills.mockReset();
    mocks.selectApprovedExecutableSkills.mockResolvedValue({ skills: [], traceProof: [] });
    mocks.recordSkillOutcome.mockReset();
  });

  it("beforeModel returns the Phase 1 MemoryIgnition contract for retrieval", async () => {
    mocks.runRetrieveFlowLangGraph.mockResolvedValue({
      memories: [
        {
          id: "m-risk-1",
          memory: "Previous attempt failed in memoryos-frontend/app/page.tsx during theme wiring.",
          memoryType: "project",
          contractCategory: "previous_attempt",
          finalScore: 0.91,
          importanceScore: 0.8,
          recencyScore: 0.7,
          typeRelevanceScore: 0.8,
          semanticScore: 0.9,
          continuityBoost: 0.1,
          updatedAt: "2026-06-18T00:00:00.000Z",
          metadata: {
            sourceRef: "github:pull/42",
            files: ["memoryos-frontend/app/page.tsx"],
          },
        },
        {
          id: "m-stale-1",
          memory: "Old deployment shortcut says edit blocked/stale-deploy.tsx without review.",
          memoryType: "project",
          contractCategory: "decision",
          finalScore: 0.88,
          importanceScore: 0.8,
          recencyScore: 0.2,
          typeRelevanceScore: 0.7,
          semanticScore: 0.8,
          continuityBoost: 0.1,
          updatedAt: "2025-01-01T00:00:00.000Z",
          metadata: {
            sourceRef: "slack:old-deploy-policy",
            files: ["blocked/stale-deploy.tsx"],
            freshness: { status: "stale" },
          },
        },
      ],
      debug: [
        {
          id: "m-risk-1",
          semanticScore: 0.9,
          typeRelevanceScore: 0.8,
          importanceScore: 0.8,
          recencyScore: 0.7,
          continuityBoost: 0.1,
          intent: "bug_recall",
          weightsUsed: { semantic: 0.5, typeRelevance: 0.2, importance: 0.2, recency: 0.1 },
          reasonTags: ["previous_attempt", "project"],
          contributions: { semantic: 0.45, typeRelevance: 0.16, importance: 0.16, recency: 0.07, continuity: 0.1, total: 0.91 },
          finalScore: 0.91,
          lifecycle: { latestEventType: null, latestReason: null, latestChangedAt: null },
        },
        {
          id: "m-stale-1",
          semanticScore: 0.8,
          typeRelevanceScore: 0.7,
          importanceScore: 0.8,
          recencyScore: 0.2,
          continuityBoost: 0.1,
          intent: "deployment_policy",
          weightsUsed: { semantic: 0.5, typeRelevance: 0.2, importance: 0.2, recency: 0.1 },
          reasonTags: ["decision", "stale"],
          contributions: { semantic: 0.4, typeRelevance: 0.14, importance: 0.16, recency: 0.02, continuity: 0.1, total: 0.88 },
          finalScore: 0.88,
          lifecycle: { latestEventType: null, latestReason: null, latestChangedAt: null },
        },
      ],
    });

    const result = await beforeModel({
      userId: "u_phase1",
      question: "Prepare the agent for theme bug fix",
      workspace_id: "workspace-alpha",
      agent_id: "codex",
      repo_or_task: "memoryos",
      task_intent: "Fix theme regression",
      available_tools: ["read", "edit"],
      risk_level: "high",
      topK: 5,
    });

    expect(result.source).toBe("retrieve");
    expect(result.relevant_memories).toHaveLength(1);
    expect(result.relevant_memories.map((memory) => memory.id)).not.toContain("m-stale-1");
    expect(result.past_mistakes[0]?.id).toBe("m-risk-1");
    expect(result.risky_files).toContain("memoryos-frontend/app/page.tsx");
    expect(result.risky_files).not.toContain("blocked/stale-deploy.tsx");
    expect(result.approval_rules).toMatchObject({
      risk_level: "high",
      derived_risk_level: "high",
      approval_required: true,
      allowed_tools: ["read", "edit"],
    });
    expect(result.approval_rules.risk_signals).toContain("powerful_tool_available");
    expect(result.recommended_first_action).toContain("Fix theme regression");
    expect(result.three_things).toEqual(expect.objectContaining({
      version: "memoryignition_three_things.v1",
      what_agent_needs_to_know: expect.arrayContaining([
        expect.any(String),
      ]),
      what_agent_must_be_careful_about: expect.arrayContaining([
        expect.stringContaining("memoryos-frontend/app/page.tsx"),
      ]),
      what_agent_should_do_next: expect.arrayContaining([
        expect.stringContaining("Fix theme regression"),
      ]),
      readiness_summary: expect.stringContaining("high risk"),
    }));
    expect(result.trace_proof[0]).toMatchObject({
      memory_id: "m-risk-1",
      source_ref: "github:pull/42",
      contract_category: "previous_attempt",
      files: ["memoryos-frontend/app/page.tsx"],
    });
    expect(result.outcome_hooks).toEqual(expect.arrayContaining([
      expect.stringContaining("memoryignition_save_outcome"),
    ]));
    expect(result.brief_proof_quality).toMatchObject({
      score: 75,
      grade: "B",
      status: "caution",
      trusted: false,
      missing_requirements: expect.arrayContaining(["Approved skills", "Required tests"]),
    });
    expect(result.evaluation_gate).toMatchObject({
      status: "caution",
      can_inherit: true,
      can_execute: false,
      requires_human_review: true,
      reason: expect.stringContaining("review"),
      warnings: expect.arrayContaining([
        expect.stringContaining("proof is not strong enough"),
      ]),
    });
    expect(result.brief_proof_quality.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "memory_evidence", ok: true }),
      expect.objectContaining({ id: "trace_proof", ok: true }),
      expect.objectContaining({ id: "approved_skills", ok: false }),
    ]));
    expect(result.task_understanding).toMatchObject({
      task: "Prepare the agent for theme bug fix",
      task_intent: "Fix theme regression",
      target_agent: "codex",
      source_mode: "retrieve",
      risk_level: "high",
      available_tools: ["read", "edit"],
    });
    expect(result.target_agent).toMatchObject({
      id: "codex",
      supported: true,
      delivery: "copy_prompt",
    });
    expect(result.inheritance_sections).toMatchObject({
      relevant_memory_count: 1,
      past_failure_count: 1,
      risky_file_count: 1,
      trace_proof_count: 1,
      outcome_hook_count: expect.any(Number),
    });
    expect(result.past_failure_retrieval).toEqual([
      expect.objectContaining({
        memory_id: "m-risk-1",
        source_ref: "github:pull/42",
        files: ["memoryos-frontend/app/page.tsx"],
        reason: expect.stringContaining("previous_attempt"),
      }),
    ]);
    expect(result.risky_file_retrieval).toEqual([
      expect.objectContaining({
        file: "memoryos-frontend/app/page.tsx",
        source_memory_ids: ["m-risk-1"],
        approval_required: true,
      }),
    ]);
    expect(result.required_test_retrieval).toEqual([]);
    expect(result.approval_rule_retrieval).toEqual([
      expect.objectContaining({
        risk_level: "high",
        approval_required: true,
        risk_signals: expect.arrayContaining(["powerful_tool_available"]),
      }),
    ]);
    expect(result.ready_to_send_prompt).toContain("# MemoryIgnition Brief");
    expect(result.ready_to_send_prompt).toContain("## Inheritance Gate");
    expect(result.ready_to_send_prompt).toContain("## Withheld Memory");
    expect(result.ready_to_send_prompt).toContain("## Withheld Source Trust");
    expect(result.ready_to_send_prompt).toContain("Source memory withheld from prompt.");
    expect(result.ready_to_send_prompt).toContain("Failed checks:");
    expect(result.ready_to_send_prompt).toContain("Withheld by inheritance gate");
    expect(result.ready_to_send_prompt).not.toContain("m-stale-1");
    expect(result.ready_to_send_prompt).not.toContain("Old deployment shortcut");
    expect(result.ready_to_send_prompt).not.toContain("blocked/stale-deploy.tsx");
    expect(result.ready_to_send_prompt).toContain("## Task Understanding");
    expect(result.ready_to_send_prompt).toContain("## Past Failures / Mistakes");
    expect(result.ready_to_send_prompt).toContain("## Highest-Ranked Inheritance");
    expect(result.ready_to_send_prompt).toContain("## Risky Files");
    expect(result.ready_to_send_prompt).toContain("## Required Tests");
    expect(result.ready_to_send_prompt).toContain("## Trace Proof");
    expect(result.ready_to_send_prompt).toContain("## Outcome Contract");
    expect(result.ready_to_send_prompt).toContain("outcome_contract.v1");
    expect(result.ready_to_send_prompt).toContain("memoryignition_save_outcome");
    expect(result.ready_to_send_prompt).toContain("future_agent_lesson");
    expect(result.inheritance_ranking).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "m-risk-1",
        kind: "past_failure",
        source_ref: "github:pull/42",
        why_selected: expect.arrayContaining(["source-backed"]),
      }),
      expect.objectContaining({
        kind: "risky_file",
        proof_complete: true,
        agent_instruction: expect.stringContaining("risk"),
      }),
    ]));
    expect(result.brief_quality_engine).toMatchObject({
      version: "phase3.v1",
      readiness: "review_required",
      task_relevance_score: expect.any(Number),
      proof_coverage: expect.any(Number),
      ranking_policy: expect.stringContaining("task relevance"),
    });
    expect(result.copy_to_agent).toMatchObject({
      target_agent: "codex",
      delivery: "copy_prompt",
      outcome_required: true,
      prompt: expect.stringContaining("# MemoryIgnition Brief"),
    });
    expect(result.memory_inheritance_readiness).toMatchObject({
      version: "inheritance_readiness.v1",
      total: 2,
      ready: expect.any(Number),
      review: expect.any(Number),
      blocked: expect.any(Number),
      readyRatio: expect.any(Number),
      status: expect.stringMatching(/^(ready|review|blocked)$/),
      nextActions: expect.any(Array),
      memories: [
        expect.objectContaining({
          memoryId: "m-risk-1",
          sourceRef: "github:pull/42",
          steps: expect.arrayContaining([
            expect.objectContaining({ id: "source", ok: true }),
            expect.objectContaining({ id: "memory", ok: true }),
            expect.objectContaining({ id: "brief" }),
          ]),
        }),
        expect.objectContaining({
          memoryId: "m-stale-1",
          sourceRef: "slack:old-deploy-policy",
          status: "blocked",
          steps: expect.arrayContaining([
            expect.objectContaining({ id: "freshness", ok: false }),
            expect.objectContaining({ id: "brief", ok: false }),
          ]),
        }),
      ],
    });
    expect(result.inheritance_gate).toMatchObject({
      version: "phase5.inheritance_gate.v1",
      status: "review_required",
      can_inherit: true,
      inherited_count: 0,
      review_count: 1,
      blocked_count: 1,
      withheld_count: 1,
      policy: "ready_and_review_only",
    });
    expect(result.inherited_memories.map((item) => item.memory.id)).toEqual([]);
    expect(result.review_memories.map((item) => item.memory.id)).toEqual(["m-risk-1"]);
    expect(result.blocked_memories.map((item) => item.memory.id)).toEqual(["m-stale-1"]);
    expect(result.inheritance_ranking.map((item) => item.id)).not.toContain("m-stale-1");
    expect(result.standard_inheritance_package).toMatchObject({
      version: "standard_inheritance_package.v1",
      delivery: "copy_prompt",
      task: expect.objectContaining({
        target_agent: "codex",
        intent: "Fix theme regression",
        source_mode: "retrieve",
      }),
      context: expect.objectContaining({
        relevant_memory_count: 1,
        executable_skill_count: 0,
      }),
      memories: [
        expect.objectContaining({
          id: "m-risk-1",
          source_ref: "github:pull/42",
        }),
      ],
      withheld_memories: [
        expect.objectContaining({
          id: "m-stale-1",
          source_ref: "slack:old-deploy-policy",
          status: "blocked",
          reason: expect.any(String),
          failed_steps: expect.arrayContaining([
            expect.objectContaining({
              id: "freshness",
              label: "Freshness",
              detail: expect.any(String),
            }),
          ]),
        }),
      ],
      gates: expect.objectContaining({
        memory: expect.objectContaining({ version: "phase5.inheritance_gate.v1" }),
        skill: expect.objectContaining({ version: "phase5.skill_gate.v1" }),
      }),
      outcome_contract: expect.objectContaining({
        version: "outcome_contract.v1",
        required: true,
        endpoint: "/api/memory/memoryignition/outcome",
        sdk_method: "memoryos.saveOutcome",
        mcp_tool: "memoryignition_save_outcome",
        required_fields: expect.arrayContaining(["future_agent_lesson"]),
        trace_lineage: "Inheritance Event -> Outcome -> Experience -> Future MemoryIgnition Brief",
      }),
      outcome: expect.objectContaining({
        contract: expect.objectContaining({ version: "outcome_contract.v1" }),
      }),
    });
    expect(result.standard_inheritance_package.memories.map((memory) => memory.id)).not.toContain("m-stale-1");
    expect(result.standard_inheritance_package.trace_proof.map((trace) => trace.memory_id)).not.toContain("m-stale-1");
    expect(JSON.stringify(result.standard_inheritance_package)).not.toContain("Old deployment shortcut");
    expect(mocks.selectApprovedExecutableSkills).toHaveBeenCalledWith(expect.objectContaining({
      userId: "u_phase1",
      project: "memoryos",
      taskIntent: "Fix theme regression",
      agentId: "codex",
    }));
    expect(result.executable_skills).toEqual([]);
  });

  it("beforeModel injects approved executable skills with trace proof", async () => {
    mocks.runRetrieveFlowLangGraph.mockResolvedValue({
      memories: [],
      debug: [],
    });
    mocks.selectApprovedExecutableSkills.mockResolvedValue({
      skills: [
        {
          id: "skill-approved-1",
          name: "Reusable workflow: safe onboarding email changes",
          trigger: "Fix onboarding email failure handling.",
          steps: ["Separate signup success from email retry.", "Run onboarding email tests."],
          required_tests: ["npm test -- onboarding-email"],
          past_mistakes: ["Welcome email failure was coupled to signup success."],
          tools_allowed: [],
          forbidden_actions: [],
          approval_required: false,
          risk_level: "medium",
          evidence: ["experience:exp-1"],
          confidence: 0.9,
          success_rate: null,
          supported_agent_types: ["codex"],
          inheritance_rules: ["Include source proof when inherited by a future agent."],
          status: "approved",
          version: "0.1.0",
          source_experience_id: "exp-1",
          source_ref: "skill_candidate:experience:exp-1",
        },
        {
          id: "skill-devin-only",
          name: "Devin-only release automation",
          trigger: "Run autonomous release automation.",
          steps: ["Open release session.", "Deploy with Devin."],
          required_tests: ["npm test -- release"],
          past_mistakes: [],
          tools_allowed: [],
          forbidden_actions: [],
          approval_required: true,
          risk_level: "high",
          evidence: ["experience:exp-devin"],
          confidence: 0.91,
          success_rate: null,
          supported_agent_types: ["devin"],
          inheritance_rules: ["Only Devin can execute this autonomous release skill."],
          status: "approved",
          version: "0.1.0",
          source_experience_id: "exp-devin",
          source_ref: "skill_candidate:experience:exp-devin",
        },
      ],
      traceProof: [],
    });

    const result = await beforeModel({
      userId: "u_phase1",
      orgId: "org_alpha",
      question: "Prepare onboarding email task",
      project: "memoryos",
      task_intent: "Fix onboarding email failure handling.",
      agent_id: "codex",
    });

    expect(result.executable_skills).toHaveLength(1);
    expect(result.executable_skills[0]).toMatchObject({
      id: "skill-approved-1",
      status: "approved",
      required_tests: ["npm test -- onboarding-email"],
    });
    expect(result.executable_skills.map((skill) => skill.id)).not.toContain("skill-devin-only");
    expect(result.trace_proof).toEqual(expect.arrayContaining([
      expect.objectContaining({
        memory_id: "skill-approved-1",
        source_type: "approved_skill",
        source_ref: "skill_candidate:experience:exp-1",
        contract_category: "runbook",
      }),
    ]));
    expect(result.trace_proof.map((trace) => trace.memory_id)).not.toContain("skill-devin-only");
    expect(result.required_tests).toEqual(["npm test -- onboarding-email"]);
    expect(result.required_tests).not.toContain("npm test -- release");
    expect(result.skill_inheritance_proofs).toEqual([
      expect.objectContaining({
        skill_id: "skill-approved-1",
        skill_name: "Reusable workflow: safe onboarding email changes",
        source_experience_id: "exp-1",
        approval_status: "approved",
        evidence: ["experience:exp-1"],
        required_tests: ["npm test -- onboarding-email"],
        inheritance_rules: ["Include source proof when inherited by a future agent."],
        supported_agent_types: ["codex"],
        lineage: "Experience -> Skill -> Approval -> MemoryIgnition Brief",
      }),
    ]);
    expect(result.ready_to_send_prompt).toContain("## Skill Inheritance Proof");
    expect(result.ready_to_send_prompt).toContain("## Skill Selection Gate");
    expect(result.ready_to_send_prompt).toContain("## Withheld Skills");
    expect(result.ready_to_send_prompt).toContain("Experience -> Skill -> Approval -> MemoryIgnition Brief");
    expect(result.ready_to_send_prompt).toContain("Source experience: exp-1");
    expect(result.ready_to_send_prompt).toContain("Skill withheld by skill gate");
    expect(result.ready_to_send_prompt).not.toContain("Devin-only release automation");
    expect(result.ready_to_send_prompt).not.toContain("npm test -- release");
    expect(result.skill_gate).toMatchObject({
      version: "phase5.skill_gate.v1",
      status: "review_required",
      can_execute_skills: true,
      executable_count: 1,
      blocked_count: 1,
      withheld_count: 1,
      policy: "approved_compatible_source_backed_only",
    });
    expect(result.executable_skill_records.map((item) => item.skill.id)).toEqual(["skill-approved-1"]);
    expect(result.blocked_skills.map((item) => item.skill.id)).toEqual(["skill-devin-only"]);
    expect(result.inheritance_ranking.map((item) => item.id)).not.toContain("skill-devin-only");
    expect(result.standard_inheritance_package.executable_skills.map((skill) => skill.id)).toEqual(["skill-approved-1"]);
    expect(result.standard_inheritance_package.withheld_skills.map((skill) => skill.id)).toEqual(["skill-devin-only"]);
    expect(result.standard_inheritance_package.outcome_contract).toMatchObject({
      version: "outcome_contract.v1",
      mcp_tool: "memoryignition_save_outcome",
    });
    expect(result.standard_inheritance_package.required_tests).toEqual(["npm test -- onboarding-email"]);
    expect(result.standard_inheritance_package.required_tests).not.toContain("npm test -- release");
    expect(result.standard_inheritance_package.trace_proof.map((trace) => trace.memory_id)).not.toContain("skill-devin-only");
    expect(JSON.stringify(result.standard_inheritance_package)).not.toContain("Devin-only release automation");
    expect(result.brief_proof_quality).toMatchObject({
      score: 80,
      grade: "B",
      status: "caution",
      trusted: false,
      missing_requirements: expect.arrayContaining(["Company memory"]),
    });
    expect(result.evaluation_gate).toMatchObject({
      status: "blocked",
      can_inherit: false,
      can_execute: false,
      blockers: expect.arrayContaining(["No Company Brain memory was inherited."]),
    });
  });

  it("beforeModel preserves resume output while adding trace proof and first action", async () => {
    mocks.runResumeFlowLangGraph.mockResolvedValue({
      summary: "Resume MemoryOS Phase 1.",
      lastKnownState: "Contract hardening is in progress.",
      openLoops: ["Finish gate coverage."],
      recommendedNextStep: "Run the Phase 1 gate.",
      brief: {
        riskyFiles: ["server/routes/memory.routes.ts"],
        nextBestAction: "Run the Phase 1 gate.",
      },
      usedMemories: [
        {
          id: "m-next-1",
          content: "Next action: run phase1 gate.",
          summary: "Run phase1 gate",
          memoryType: "project",
          contractCategory: "next_action",
          finalScore: 0.88,
          importanceScore: 0.8,
          reasonTags: ["next_action"],
          updatedAt: "2026-06-18T00:00:00.000Z",
          metadata: { source: "memoryos_ingest" },
        },
      ],
      debug: { project: "memoryos", retrieval: [] },
    });

    const result = await beforeModel({
      userId: "u_phase1",
      question: "Resume project",
      project: "memoryos",
      mode: "resume",
      risk_level: "low",
    });

    expect(result.contextText).toContain("Resume MemoryOS Phase 1.");
    expect(result.recommended_first_action).toBe("Run the Phase 1 gate.");
    expect(result.risky_files).toContain("server/routes/memory.routes.ts");
    expect(result.trace_proof[0]).toMatchObject({
      memory_id: "m-next-1",
      source_ref: "memoryos_ingest",
    });
    expect(result.brief_proof_quality).toMatchObject({
      score: 75,
      grade: "B",
      status: "caution",
      trusted: false,
    });
    expect(result.evaluation_gate).toMatchObject({
      status: "caution",
      can_inherit: true,
      can_execute: false,
      requires_human_review: true,
    });
  });

  it("afterModel records outcome and returns an experience draft", async () => {
    mocks.runIngestFlowLangGraph.mockResolvedValue({
      acceptedMemories: [
        {
          id: "m-after-1",
          updatedAt: "2026-06-18T00:00:00.000Z",
        },
      ],
      rejectedMemories: [],
      timelineEvents: [],
    });
    mocks.createActionMemory.mockResolvedValue({
      id: "act_mem_phase1",
      updatedAt: "2026-06-18T00:00:01.000Z",
    });
    mocks.createExecutionOutcome.mockResolvedValue({
      id: "exec_out_phase1",
      createdAt: "2026-06-18T00:00:02.000Z",
    });
    mocks.persistExperienceGraphMemory.mockResolvedValue({
      id: "exp_phase1",
      sourceRef: "experience:after_model:act_mem_phase1",
      updatedAt: "2026-06-18T00:00:03.000Z",
    });
    mocks.recordSkillOutcome.mockResolvedValue({
      id: "skill_phase1",
      confidence: 0.93,
      success_rate: 100,
    });

    const result = await afterModel({
      userId: "u_phase1",
      orgId: "org_phase1",
      threadId: "thread-1",
      repo_or_task: "memoryos",
      task_intent: "Patch MemoryIgnition contract",
      outcome: "Contract fields added and tests created.",
      outcome_status: "success",
      files_touched: ["lib/SDK/memoryHooks.ts"],
      tests_passed: ["npx vitest run tests/memoryIgnitionHooks.contract.test.ts"],
      tests_failed: ["npm run phase4:outcome:gate"],
      what_worked: "Outcome capture created action memory and experience.",
      what_failed: "Phase 4 gate still needs implementation.",
      future_agent_lesson: "Future agents should save outcome evidence immediately after acting.",
      used_skill_ids: ["skill_phase1"],
      send_event_id: "send_phase4_outcome",
      target_agent: "codex",
      target_format: "codex_prompt",
    });

    expect(result.outcome_recorded).toBe(true);
    expect(result.acceptedCount).toBe(1);
    expect(result.action_memory_id).toBe("act_mem_phase1");
    expect(result.execution_outcome_id).toBe("exec_out_phase1");
    expect(result.experience_record_id).toBe("exp_phase1");
    expect(result.skill_outcomes).toEqual([
      {
        skill_id: "skill_phase1",
        status: "success",
        confidence: 0.93,
        success_rate: 100,
      },
    ]);
    expect(result.outcome_learning).toMatchObject({
      version: "phase4.v1",
      status: "recorded",
      future_inheritance_ready: true,
      experience_record_id: "exp_phase1",
      lesson_stored: "Future agents should save outcome evidence immediately after acting.",
      next_brief_query: expect.stringContaining("Patch MemoryIgnition contract"),
      trace_complete: true,
      learning_signals: expect.arrayContaining([
        "outcome-captured",
        "experience-record-created",
        "future-agent-lesson-stored",
      ]),
    });
    expect(result.outcome_learning_gate).toMatchObject({
      version: "phase4.outcome_gate.v1",
      status: "ready",
      future_inheritance_ready: true,
      can_update_memory: true,
      can_update_experience: true,
      can_update_skill_confidence: true,
      score: 100,
      promoted_signals: expect.arrayContaining([
        "future-inheritance-ready",
        "experience-updated",
        "test-evidence-recorded",
        "skill-confidence-update-allowed",
      ]),
      blocked_updates: [],
      checks: expect.arrayContaining([
        expect.objectContaining({ id: "outcome", ok: true, required: true }),
        expect.objectContaining({ id: "experience", ok: true, required: true }),
        expect.objectContaining({ id: "lesson", ok: true, required: true }),
        expect.objectContaining({ id: "tests", ok: true }),
      ]),
    });
    expect(result.outcome_proof).toMatchObject({
      version: "memoryignition_outcome_proof.v1",
      send_event_id: "send_phase4_outcome",
      target_agent: "codex",
      target_format: "codex_prompt",
      source_ref: "send_phase4_outcome",
      lineage: "Send Now -> Agent Work -> Outcome -> Experience -> Future-Agent Inheritance",
      outcome_recorded: true,
      future_inheritance_ready: true,
      memory_updated: true,
      experience_updated: true,
      skill_confidence_updated: true,
      evidence: expect.arrayContaining([
        "send-now:send_phase4_outcome",
        "action-memory:act_mem_phase1",
        "execution-outcome:exec_out_phase1",
        "experience:exp_phase1",
        "skill-used:skill_phase1",
      ]),
      missing_evidence: [],
      next_brief_query: expect.stringContaining("Patch MemoryIgnition contract"),
    });
    expect(result.experience_promotion).toMatchObject({
      version: "memoryignition_experience_promotion.v1",
      promoted: true,
      experience_record_id: "exp_phase1",
      source_outcome_event_id: result.outcome_proof.outcome_event_id,
      source_send_event_id: "send_phase4_outcome",
      source_ref: "experience:after_model:act_mem_phase1",
      lineage: "Outcome Proof -> Experience Record -> MemoryIgnition Brief",
      evidence: expect.arrayContaining([
        expect.stringContaining("outcome-proof:"),
        "send-now:send_phase4_outcome",
        "experience:exp_phase1",
      ]),
      missing_evidence: [],
      future_agent_instruction: expect.stringContaining("Future agents should save outcome evidence"),
      next_brief_query: expect.stringContaining("Patch MemoryIgnition contract"),
    });
    expect(result.experience_draft).toMatchObject({
      problem: "Patch MemoryIgnition contract",
      outcome: "Contract fields added and tests created.",
      lesson: "Future agents should save outcome evidence immediately after acting.",
      status: "draft",
    });
    expect(result.experience_timeline).toEqual(expect.arrayContaining([
      expect.objectContaining({
        step: "outcome_captured",
        status: "recorded",
        ref: "send_phase4_outcome",
      }),
      expect.objectContaining({
        step: "experience_record",
        status: "recorded",
        ref: "exp_phase1",
      }),
      expect.objectContaining({
        step: "skill_outcome",
        status: "recorded",
      }),
    ]));
    expect(result.trace_proof).toEqual(expect.arrayContaining([
      expect.objectContaining({
      accepted_memory_id: "m-after-1",
      source_type: "after_model",
      source_ref: "send_phase4_outcome",
      }),
      expect.objectContaining({
        action_memory_id: "act_mem_phase1",
        source_type: "action_memory",
        source_ref: "send_phase4_outcome",
      }),
      expect.objectContaining({
        execution_outcome_id: "exec_out_phase1",
        source_type: "execution_outcome",
        source_ref: "send_phase4_outcome",
      }),
      expect.objectContaining({
        experience_record_id: result.experience_record_id,
        source_type: "experience_record",
      }),
      expect.objectContaining({
        skill_id: "skill_phase1",
        source_type: "skill_outcome",
        source_ref: "send_phase4_outcome",
      }),
    ]));
    expect(mocks.createActionMemory).toHaveBeenCalledWith(expect.objectContaining({
      userId: "u_phase1",
      outcome: "success",
      sourceType: "continuity",
      sourceId: "send_phase4_outcome",
      metadata: expect.objectContaining({
        tests_passed: ["npx vitest run tests/memoryIgnitionHooks.contract.test.ts"],
        tests_failed: ["npm run phase4:outcome:gate"],
        what_worked: "Outcome capture created action memory and experience.",
        what_failed: "Phase 4 gate still needs implementation.",
        future_agent_lesson: "Future agents should save outcome evidence immediately after acting.",
        send_event_id: "send_phase4_outcome",
        target_agent: "codex",
        target_format: "codex_prompt",
      }),
    }));
    expect(mocks.createExecutionOutcome).toHaveBeenCalledWith(expect.objectContaining({
      actionMemoryId: "act_mem_phase1",
      status: "executed",
      connectorAdapter: "memory.after_model",
    }));
    expect(mocks.persistExperienceGraphMemory).toHaveBeenCalledWith(expect.objectContaining({
      userId: "u_phase1",
      orgId: "org_phase1",
      sourceType: "after_model",
      sourceRef: "act_mem_phase1",
      task: "Patch MemoryIgnition contract",
      files: ["lib/SDK/memoryHooks.ts"],
      tests: [
        "npx vitest run tests/memoryIgnitionHooks.contract.test.ts",
        "npm run phase4:outcome:gate",
      ],
      evidence: expect.arrayContaining([
        "test-passed:npx vitest run tests/memoryIgnitionHooks.contract.test.ts",
        "test-failed:npm run phase4:outcome:gate",
      ]),
      lesson: "Future agents should save outcome evidence immediately after acting.",
    }));
    expect(mocks.recordSkillOutcome).toHaveBeenCalledWith(expect.objectContaining({
      userId: "u_phase1",
      orgId: "org_phase1",
      skillId: "skill_phase1",
      status: "success",
      sourceRef: "send_phase4_outcome",
      experienceRecordId: "exp_phase1",
      executionOutcomeId: "exec_out_phase1",
    }));
  });

  it("afterModel saves weak outcomes but blocks full inheritance promotion until evidence exists", async () => {
    mocks.runIngestFlowLangGraph.mockResolvedValue({
      acceptedMemories: [],
      rejectedMemories: [],
      timelineEvents: [],
    });
    mocks.createActionMemory.mockResolvedValue({
      id: "act_mem_weak",
      updatedAt: "2026-06-18T00:20:01.000Z",
    });
    mocks.createExecutionOutcome.mockResolvedValue(null);
    mocks.persistExperienceGraphMemory.mockResolvedValue(null);

    const result = await afterModel({
      userId: "u_phase4_weak",
      threadId: "weak-run-1",
      repo_or_task: "memoryos",
      task_intent: "Investigate runtime issue",
      outcome: "Looked at the issue but did not finish.",
      outcome_status: "unknown",
    });

    expect(result.outcome_recorded).toBe(true);
    expect(result.outcome_learning).toMatchObject({
      future_inheritance_ready: false,
      status: "partial",
      missing_signals: expect.arrayContaining(["experience record", "files changed", "test evidence"]),
    });
    expect(result.outcome_learning_gate).toMatchObject({
      version: "phase4.outcome_gate.v1",
      status: "partial",
      future_inheritance_ready: false,
      can_update_memory: false,
      can_update_experience: false,
      can_update_skill_confidence: false,
      blocked_updates: expect.arrayContaining([
        "future inheritance promotion",
        "experience graph update",
      ]),
      checks: expect.arrayContaining([
        expect.objectContaining({ id: "experience", ok: false, required: true }),
        expect.objectContaining({ id: "files", ok: false }),
        expect.objectContaining({ id: "tests", ok: false }),
      ]),
    });
    expect(result.experience_promotion).toMatchObject({
      version: "memoryignition_experience_promotion.v1",
      promoted: false,
      experience_record_id: null,
      missing_evidence: expect.arrayContaining([
        "outcome learning gate",
        "experience record",
      ]),
    });
  });

  it("turns an outcome into experience that the next MemoryIgnition brief can inherit", async () => {
    let persistedExperience: Parameters<typeof mocks.persistExperienceGraphMemory>[0] | null = null;

    mocks.runIngestFlowLangGraph.mockResolvedValue({
      acceptedMemories: [],
      rejectedMemories: [],
      timelineEvents: [],
    });
    mocks.createActionMemory.mockResolvedValue({
      id: "act_outcome_next",
      updatedAt: "2026-06-18T00:10:01.000Z",
    });
    mocks.createExecutionOutcome.mockResolvedValue({
      id: "exec_outcome_next",
      createdAt: "2026-06-18T00:10:02.000Z",
    });
    mocks.persistExperienceGraphMemory.mockImplementation(async (input) => {
      persistedExperience = input;
      return {
        id: "exp_outcome_next",
        sourceRef: "experience:after_model:act_outcome_next",
        updatedAt: "2026-06-18T00:10:03.000Z",
      };
    });

    const outcome = await afterModel({
      userId: "u_phase4",
      threadId: "brief-run-1",
      repo_or_task: "memoryos",
      task_intent: "Fix onboarding email failure handling",
      outcome: "Signup now succeeds even when welcome email delivery times out.",
      outcome_status: "success",
      files_touched: ["app/api/onboarding/route.ts", "lib/email.ts"],
      tests_passed: ["npm test -- onboarding-email"],
      what_worked: "Separated user creation success from email retry failure.",
      future_agent_lesson: "Do not fail signup only because welcome email delivery fails.",
    });

    expect(outcome.outcome_learning.future_inheritance_ready).toBe(true);
    expect(outcome.experience_promotion).toMatchObject({
      version: "memoryignition_experience_promotion.v1",
      promoted: true,
      experience_record_id: "exp_outcome_next",
      source_outcome_event_id: outcome.outcome_proof.outcome_event_id,
      lineage: "Outcome Proof -> Experience Record -> MemoryIgnition Brief",
      future_agent_instruction: expect.stringContaining("Do not fail signup"),
    });
    expect(persistedExperience).toMatchObject({
      task: "Fix onboarding email failure handling",
      lesson: "Do not fail signup only because welcome email delivery fails.",
      futureAgentInstruction: expect.stringContaining("Do not fail signup"),
      files: ["app/api/onboarding/route.ts", "lib/email.ts"],
      tests: ["npm test -- onboarding-email"],
    });

    mocks.runRetrieveFlowLangGraph.mockResolvedValue({
      memories: [
        {
          id: "exp_outcome_next",
          memory: [
            `Task: ${persistedExperience?.task}`,
            `Outcome: ${persistedExperience?.outcome}`,
            `Lesson: ${persistedExperience?.lesson}`,
            `Future-agent instruction: ${persistedExperience?.futureAgentInstruction}`,
            `Files: ${(persistedExperience?.files ?? []).join(" | ")}`,
            `Tests: ${(persistedExperience?.tests ?? []).join(" | ")}`,
          ].join("\n"),
          memoryType: "project",
          contractCategory: "previous_attempt",
          finalScore: 0.94,
          updatedAt: "2026-06-18T00:10:03.000Z",
          metadata: {
            sourceRef: "experience:after_model:act_outcome_next",
            files: persistedExperience?.files ?? [],
          },
        },
      ],
      debug: [
        {
          id: "exp_outcome_next",
          reasonTags: ["experience", "previous_attempt", "outcome_learning"],
          finalScore: 0.94,
        },
      ],
    });

    const nextBrief = await beforeModel({
      userId: "u_phase4",
      question: "Prepare agent to work on onboarding email timeout handling",
      repo_or_task: "memoryos",
      task_intent: "Fix onboarding email failure handling",
      agent_id: "codex",
      risk_level: "medium",
      available_tools: ["read", "edit", "tests"],
    });

    expect(nextBrief.relevant_memories).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "exp_outcome_next",
        content: expect.stringContaining("Do not fail signup only because welcome email delivery fails."),
      }),
    ]));
    expect(nextBrief.related_experiences).toEqual([
      expect.objectContaining({
        experience_id: "exp_outcome_next",
        task: "Fix onboarding email failure handling",
        outcome: "Signup now succeeds even when welcome email delivery times out.",
        lesson: "Do not fail signup only because welcome email delivery fails.",
        future_agent_instruction: expect.stringContaining("Do not fail signup"),
        files: ["app/api/onboarding/route.ts", "lib/email.ts"],
        tests: ["npm test -- onboarding-email"],
        quality_status: "ready_for_inheritance",
        trace_lineage: "Source -> Outcome -> Experience -> Next MemoryIgnition Brief",
      }),
    ]);
    expect(nextBrief.experience_quality_gate).toMatchObject({
      version: "phase5.v1",
      total_related_experiences: 1,
      ready_for_inheritance: 1,
      selected_experience_ids: ["exp_outcome_next"],
      next_actions: expect.arrayContaining([
        expect.stringContaining("Include ready experiences"),
      ]),
    });
    expect(nextBrief.experience_promotion_proofs).toEqual([
      expect.objectContaining({
        version: "memoryignition_experience_promotion.v1",
        promoted: true,
        experience_record_id: "exp_outcome_next",
        source_ref: "experience:after_model:act_outcome_next",
        lineage: "Outcome Proof -> Experience Record -> MemoryIgnition Brief",
        evidence: expect.arrayContaining([
          "experience:exp_outcome_next",
          "experience:after_model:act_outcome_next",
          "test:npm test -- onboarding-email",
        ]),
        future_agent_instruction: expect.stringContaining("Do not fail signup"),
        next_brief_query: "Fix onboarding email failure handling",
      }),
    ]);
    expect(nextBrief.past_failure_retrieval).toEqual(expect.arrayContaining([
      expect.objectContaining({
        memory_id: "exp_outcome_next",
        source_ref: "experience:after_model:act_outcome_next",
      }),
    ]));
    expect(nextBrief.required_tests).toContain("npm test -- onboarding-email");
    expect(nextBrief.ready_to_send_prompt).toContain("Do not fail signup only because welcome email delivery fails.");
    expect(nextBrief.ready_to_send_prompt).toContain("## Related Experiences");
    expect(nextBrief.inheritance_ranking).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "exp_outcome_next",
        kind: "past_failure",
        proof_complete: true,
      }),
    ]));
  });
});
