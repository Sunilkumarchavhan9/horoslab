import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMemoryOsApp } from "../server/app";
import { makeToken } from "./helpers/authToken";
import { TestMemoryStoreAdapter } from "./helpers/testMemoryStoreAdapter";
import { resetMemoryStoreAdapter, setMemoryStoreAdapter } from "../lib/adapters/registry";

describe("MemoryIgnition agentic runtime contract", () => {
  const app = createMemoryOsApp();

  beforeEach(() => {
    process.env.MEMORY_STORE_PROVIDER = "prisma";
    setMemoryStoreAdapter(new TestMemoryStoreAdapter());
  });

  afterEach(() => {
    resetMemoryStoreAdapter();
  });

  it("exposes before-agent, before-action, during-action, risk, and outcome moments as one agentic runtime", async () => {
    const userId = `u_memoryignition_agentic_${Date.now()}`;
    const authHeader = `Bearer ${await makeToken(userId)}`;
    const basePayload = {
      project: "memoryos",
      repo_or_task: "memoryos",
      task: "Prepare a future agent to change auth-sensitive connector code.",
      task_intent: "Update connector auth handling without leaking workspace data.",
      agent_id: "codex",
      mode: "retrieve",
      risk_level: "high",
      available_tools: ["read_files", "edit_files", "terminal", "tests"],
      current_files: ["server/middleware/auth.ts", "server/routes/connector.routes.ts"],
      proposed_action: "Edit auth middleware and connector callback handling.",
    };

    const beforeAgent = await request(app)
      .post("/api/memory/memoryignition/before-agent")
      .set("authorization", authHeader)
      .send(basePayload);

    expect(beforeAgent.status).toBe(200);
    expect(beforeAgent.body.data).toEqual(expect.objectContaining({
      runtime_moment: "before_agent",
      relevant_memories: expect.any(Array),
      executable_skills: expect.any(Array),
      trace_proof: expect.any(Array),
      standard_inheritance_package: expect.objectContaining({
        version: "standard_inheritance_package.v1",
        task: expect.objectContaining({ target_agent: "codex" }),
      }),
      action_guard: expect.objectContaining({
        allowed: expect.any(Boolean),
        approval_required: expect.any(Boolean),
        required_tests: expect.any(Array),
        forbidden_actions: expect.any(Array),
      }),
      internal_agents: expect.objectContaining({
        intent_agent: expect.objectContaining({ status: "completed" }),
        retrieval_agent: expect.objectContaining({ status: "completed" }),
        skill_selector_agent: expect.objectContaining({ status: "completed" }),
        guardian_agent: expect.objectContaining({
          status: expect.stringMatching(/allowed|approval_required|blocked/),
        }),
        outcome_agent: expect.objectContaining({ status: "waiting_for_after_agent" }),
      }),
    }));

    const beforeAction = await request(app)
      .post("/api/memory/memoryignition/before-action")
      .set("authorization", authHeader)
      .send({
        ...basePayload,
        command: "apply_patch server/middleware/auth.ts",
      });

    expect(beforeAction.status).toBe(200);
    expect(beforeAction.body.data).toEqual(expect.objectContaining({
      runtime_moment: "before_action",
      action_guard: expect.objectContaining({
        action: expect.stringContaining("Edit auth middleware"),
        gate_status: expect.stringMatching(/trusted|caution|weak|blocked/),
        matched_risky_files: expect.any(Array),
        matched_forbidden_actions: expect.any(Array),
        missing_required_tests: expect.any(Array),
        approval_request: expect.objectContaining({
          id: expect.stringMatching(/^mi_appr_/),
          status: "pending",
          source: "memoryignition_guard",
        }),
        guard_proof: expect.objectContaining({
          version: "memoryignition_guard_proof.v1",
          moment: "before_action",
          status: expect.stringMatching(/allowed|approval_required|blocked/),
          checks: expect.arrayContaining([
            expect.objectContaining({ id: "brief_gate" }),
            expect.objectContaining({ id: "risky_files" }),
            expect.objectContaining({ id: "forbidden_actions" }),
            expect.objectContaining({ id: "approval" }),
            expect.objectContaining({ id: "required_tests" }),
            expect.objectContaining({ id: "trace_proof" }),
          ]),
          trace_proof_ids: expect.any(Array),
          next_required_actions: expect.any(Array),
        }),
      }),
      internal_agents: expect.objectContaining({
        guardian_agent: expect.objectContaining({
          approval_required: expect.any(Boolean),
        }),
      }),
    }));

    const duringAction = await request(app)
      .post("/api/memory/memoryignition/during-action")
      .set("authorization", authHeader)
      .send({
        ...basePayload,
        action: "Agent is about to touch auth callback code.",
        command: "npm test -- auth connector",
      });

    expect(duringAction.status).toBe(200);
    expect(duringAction.body.data.runtime_moment).toBe("during_action");
    expect(duringAction.body.data.action_guard).toEqual(expect.objectContaining({
      allowed: expect.any(Boolean),
      blocked: expect.any(Boolean),
      next_required_actions: expect.any(Array),
      guard_proof: expect.objectContaining({
        version: "memoryignition_guard_proof.v1",
        moment: "during_action",
      }),
    }));

    const risk = await request(app)
      .post("/api/memory/memoryignition/risk-check")
      .set("authorization", authHeader)
      .send(basePayload);

    expect(risk.status).toBe(200);
    expect(risk.body.data).toEqual(expect.objectContaining({
      allowed: expect.any(Boolean),
      action_guard: expect.objectContaining({
        risk_level: expect.any(String),
        allowed: expect.any(Boolean),
        blocked: expect.any(Boolean),
        guard_proof: expect.objectContaining({
          version: "memoryignition_guard_proof.v1",
          moment: "risk_check",
          status: expect.stringMatching(/allowed|approval_required|blocked/),
        }),
        approval_request: expect.objectContaining({
          id: expect.stringMatching(/^mi_appr_/),
          status: "pending",
        }),
      }),
      internal_agents: expect.objectContaining({
        guardian_agent: expect.objectContaining({
          status: expect.stringMatching(/allowed|approval_required|blocked/),
        }),
      }),
      standard_inheritance_package: expect.objectContaining({
        version: "standard_inheritance_package.v1",
        risk_rules: expect.objectContaining({
          risky_files: expect.any(Array),
        }),
      }),
    }));

    const sendNow = await request(app)
      .post("/api/memory/memoryignition/send-now")
      .set("authorization", authHeader)
      .send({
        ...basePayload,
        target_agent: "codex",
        target_format: "codex_prompt",
        safety_mode: "balanced",
        related_reasoning_ids: ["reasoning:agentic-runtime:auth-sensitive-connector"],
        reasoning_context: {
          reasoning_id: "reasoning:agentic-runtime:auth-sensitive-connector",
          task: "Prepare a future agent to change auth-sensitive connector code.",
          source_type: "support",
          source_ref: "ticket:connector-auth-17",
          reasoning_quality: {
            status: "agent_ready",
            score: 92,
          },
          linked_experiences: [
            {
              task: "Adjust connector auth handling after a failed callback flow.",
              source_ref: "experience:connector-auth-failure",
            },
          ],
          recommended_first_action: "Inspect auth middleware and connector callback handling before editing.",
        },
      });

    expect(sendNow.status).toBe(200);
    expect(sendNow.body.data).toEqual(expect.objectContaining({
      version: "memoryignition_send_now.v1",
      send_event_id: expect.stringMatching(/^send_/),
      target_agent: "codex",
      target_format: "codex_prompt",
      payload: expect.any(String),
      json_package: expect.objectContaining({
        reasoning_context: expect.objectContaining({
          reasoning_id: "reasoning:agentic-runtime:auth-sensitive-connector",
        }),
      }),
      standard_inheritance_package: expect.objectContaining({
        version: "standard_inheritance_package.v1",
      }),
      three_things: expect.objectContaining({
        version: "memoryignition_three_things.v1",
      }),
      readiness: expect.objectContaining({
        can_execute: expect.any(Boolean),
        approval_required: expect.any(Boolean),
      }),
    }));
    expect(sendNow.body.data.payload).toContain("## Reasoning Lineage");
    expect(sendNow.body.data.payload).toContain("Linked Experiences");
    expect(sendNow.body.data.payload).toContain("Reasoning Brief Next Step");
    const sendEventId = sendNow.body.data.send_event_id as string;

    await new Promise((resolve) => setTimeout(resolve, 50));
    const realtimeHistory = await request(app)
      .get("/api/memory/events/history?limit=20")
      .set("authorization", authHeader);

    expect(realtimeHistory.status).toBe(200);
    expect(realtimeHistory.body.events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: "agent_run_started",
        source: "memory-ignition",
        subject: expect.objectContaining({
          type: "run",
          id: sendEventId,
        }),
        payload: expect.objectContaining({
          route: "memoryignition/send-now",
          sendEventId,
          targetAgent: "codex",
          targetFormat: "codex_prompt",
          outcomeRequired: true,
          packageVersion: "standard_inheritance_package.v1",
        }),
      }),
    ]));

    const outcome = await request(app)
      .post("/api/memory/memoryignition/after-agent")
      .set("authorization", authHeader)
      .send({
        repo_or_task: "memoryos",
        task_intent: basePayload.task_intent,
        agent_id: "codex",
        outcome_status: "success",
        outcome: "Agentic runtime guard produced a traceable decision before action.",
        tests_passed: ["npx vitest run tests/memoryIgnitionAgenticRuntime.contract.test.ts"],
        future_agent_lesson: "Use before-action and during-action before risky connector/auth edits.",
        send_event_id: sendEventId,
        target_agent: "codex",
        target_format: "codex_prompt",
      });

    expect(outcome.status).toBe(200);
    expect(outcome.body.data).toEqual(expect.objectContaining({
      outcome_recorded: true,
      outcome_proof: expect.objectContaining({
        version: "memoryignition_outcome_proof.v1",
        send_event_id: sendEventId,
        target_agent: "codex",
        target_format: "codex_prompt",
        lineage: "Send Now -> Agent Work -> Outcome -> Experience -> Future-Agent Inheritance",
      }),
    }));

    await new Promise((resolve) => setTimeout(resolve, 50));
    const outcomeRealtimeHistory = await request(app)
      .get("/api/memory/events/history?limit=40")
      .set("authorization", authHeader);

    expect(outcomeRealtimeHistory.status).toBe(200);
    expect(outcomeRealtimeHistory.body.events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: "future_instruction_created",
        source: "memory-ignition",
        subject: expect.objectContaining({
          type: "future_instruction",
        }),
        payload: expect.objectContaining({
          sendEventId,
          instruction: "Use before-action and during-action before risky connector/auth edits.",
          status: expect.stringMatching(/ready|needs_review/),
          futureInheritanceReady: expect.any(Boolean),
        }),
      }),
    ]));

    const timeline = await request(app)
      .get("/api/memory/memoryignition/runtime-timeline")
      .set("authorization", authHeader);

    expect(timeline.status).toBe(200);
    expect(timeline.body.data).toEqual(expect.objectContaining({
      version: "memoryignition_runtime_timeline.v1",
      totalEvents: expect.any(Number),
      completedRequiredMoments: 6,
      requiredMomentCount: 6,
      moments: expect.objectContaining({
        before_agent: expect.any(Number),
        before_action: expect.any(Number),
        during_action: expect.any(Number),
        risk_check: expect.any(Number),
        send_now: expect.any(Number),
        after_agent: expect.any(Number),
      }),
      items: expect.arrayContaining([
        expect.objectContaining({ moment: "before_agent" }),
        expect.objectContaining({ moment: "before_action" }),
        expect.objectContaining({ moment: "during_action" }),
        expect.objectContaining({ moment: "risk_check" }),
        expect.objectContaining({ moment: "send_now" }),
        expect.objectContaining({ moment: "after_agent" }),
      ]),
    }));
  }, 120000);

  it("blocks runtime actions when the requested tool is outside the agent permission policy", async () => {
    const userId = `u_memoryignition_policy_${Date.now()}`;
    const authHeader = `Bearer ${await makeToken(userId)}`;

    const denied = await request(app)
      .post("/api/memory/memoryignition/before-action")
      .set("authorization", authHeader)
      .send({
        project: "memoryos",
        repo_or_task: "memoryos",
        task: "Prepare a future agent to inspect production auth behavior.",
        task_intent: "Inspect auth behavior without shell access.",
        agent_id: "codex",
        risk_level: "medium",
        available_tools: ["read_files"],
        tool_name: "terminal",
        command: "npm run build",
        proposed_action: "Run a shell command to build the frontend.",
      });

    expect(denied.status).toBe(200);
    expect(denied.body.data).toEqual(expect.objectContaining({
      runtime_moment: "before_action",
      runtime_policy: expect.objectContaining({
        version: "memoryignition_runtime_policy.v1",
        agent_id: "codex",
        allowed_tools: ["read_files"],
        requested_tool: "terminal",
        tool_allowed: false,
        denied_tools: ["terminal"],
        status: "blocked",
        next_required_actions: expect.arrayContaining([
          expect.stringContaining("Grant terminal"),
        ]),
      }),
      action_guard: expect.objectContaining({
        allowed: false,
        blocked: true,
        reason: expect.stringContaining("Requested tool is not allowed by runtime policy."),
        runtime_policy: expect.objectContaining({
          requested_tool: "terminal",
          tool_allowed: false,
        }),
        approval_request: expect.objectContaining({
          id: expect.stringMatching(/^mi_appr_/),
          status: "pending",
        }),
        guard_proof: expect.objectContaining({
          version: "memoryignition_guard_proof.v1",
          status: "blocked",
          runtime_policy: expect.objectContaining({
            requested_tool: "terminal",
            denied_tools: ["terminal"],
          }),
          checks: expect.arrayContaining([
            expect.objectContaining({
              id: "tool_permission",
              ok: false,
              detail: expect.stringContaining("not in allowed tools"),
            }),
          ]),
          next_required_actions: expect.arrayContaining([
            expect.stringContaining("Grant terminal"),
          ]),
        }),
      }),
      internal_agents: expect.objectContaining({
        guardian_agent: expect.objectContaining({
          status: "blocked",
          denied_tools: 1,
        }),
      }),
    }));

    const timeline = await request(app)
      .get("/api/memory/memoryignition/runtime-timeline")
      .set("authorization", authHeader);

    expect(timeline.status).toBe(200);
    expect(timeline.body.data.items).toEqual(expect.arrayContaining([
      expect.objectContaining({
        moment: "before_action",
        runtimePolicy: expect.objectContaining({
          version: "memoryignition_runtime_policy.v1",
          requested_tool: "terminal",
          tool_allowed: false,
          denied_tools: ["terminal"],
          next_required_actions: expect.arrayContaining([
            expect.stringContaining("Grant terminal"),
          ]),
        }),
        proofChainSteps: expect.arrayContaining([
          "runtime_policy_checked",
          "tool_permission_blocked",
        ]),
      }),
    ]));
  }, 120000);

  it("uses the saved workspace runtime policy when an agent omits available tools", async () => {
    const userId = `u_memoryignition_workspace_policy_${Date.now()}`;
    const authHeader = `Bearer ${await makeToken(userId)}`;

    const savedPolicy = await request(app)
      .patch("/api/memory/memoryignition/runtime-policy")
      .set("authorization", authHeader)
      .send({
        defaultAllowedTools: ["read_files"],
        agentPolicies: [
          { agentType: "codex", allowedTools: ["read_files", "tests"] },
        ],
        riskPolicies: [
          { riskLevel: "high", allowedTools: ["read_files"], requireApproval: true },
        ],
      });

    expect(savedPolicy.status).toBe(200);
    expect(savedPolicy.body.data).toEqual(expect.objectContaining({
      version: "memoryignition_runtime_policy_settings.v1",
      defaultAllowedTools: ["read_files"],
      agentPolicies: expect.arrayContaining([
        expect.objectContaining({ agentType: "codex", allowedTools: ["read_files", "tests"] }),
      ]),
    }));

    const denied = await request(app)
      .post("/api/memory/memoryignition/before-action")
      .set("authorization", authHeader)
      .send({
        project: "memoryos",
        repo_or_task: "memoryos",
        task: "Prepare Codex to run a production build.",
        task_intent: "Run a shell command without passing available tools.",
        agent_id: "codex",
        risk_level: "medium",
        tool_name: "terminal",
        command: "npm run build",
        proposed_action: "Run a shell command to build the frontend.",
      });

    expect(denied.status).toBe(200);
    expect(denied.body.data.runtime_policy).toEqual(expect.objectContaining({
      version: "memoryignition_runtime_policy.v1",
      policy_settings_version: "memoryignition_runtime_policy_settings.v1",
      policy_source: "agent_policy",
      policy_id: "agent:codex",
      allowed_tools: ["read_files", "tests"],
      requested_tool: "terminal",
      tool_allowed: false,
      denied_tools: ["terminal"],
      status: "blocked",
    }));
    expect(denied.body.data.action_guard).toEqual(expect.objectContaining({
      allowed: false,
      blocked: true,
      guard_proof: expect.objectContaining({
        runtime_policy: expect.objectContaining({
          policy_source: "agent_policy",
          requested_tool: "terminal",
          tool_allowed: false,
        }),
      }),
    }));

    const allowed = await request(app)
      .post("/api/memory/memoryignition/before-action")
      .set("authorization", authHeader)
      .send({
        project: "memoryos",
        repo_or_task: "memoryos",
        task: "Prepare Codex to run tests.",
        task_intent: "Run tests without passing available tools.",
        agent_id: "codex",
        risk_level: "medium",
        tool_name: "tests",
        command: "npx vitest run tests/memoryIgnitionAgenticRuntime.contract.test.ts",
        proposed_action: "Run the MemoryIgnition runtime contract tests.",
      });

    expect(allowed.status).toBe(200);
    expect(allowed.body.data.runtime_policy).toEqual(expect.objectContaining({
      policy_source: "agent_policy",
      policy_id: "agent:codex",
      allowed_tools: ["read_files", "tests"],
      requested_tool: "tests",
      tool_allowed: true,
      denied_tools: [],
      status: "satisfied",
    }));

    const highRisk = await request(app)
      .post("/api/memory/memoryignition/before-action")
      .set("authorization", authHeader)
      .send({
        project: "memoryos",
        repo_or_task: "memoryos",
        task: "Prepare Codex to run tests before high-risk auth work.",
        task_intent: "Run tests before high-risk auth work.",
        agent_id: "codex",
        risk_level: "high",
        tool_name: "tests",
        command: "npx vitest run tests/memoryIgnitionAgenticRuntime.contract.test.ts",
        proposed_action: "Run the MemoryIgnition runtime contract tests before auth-sensitive work.",
      });

    expect(highRisk.status).toBe(200);
    expect(highRisk.body.data.runtime_policy).toEqual(expect.objectContaining({
      policy_source: "agent_policy",
      policy_id: "agent:codex",
      approval_required_by_policy: true,
      approval_policy_id: "risk:high",
      requested_tool: "tests",
      tool_allowed: true,
      denied_tools: [],
    }));
    expect(highRisk.body.data.action_guard).toEqual(expect.objectContaining({
      approval_required: true,
      governance_decision: expect.objectContaining({
        version: "memoryignition_guardian_governance_decision.v1",
        approval_required: true,
        approval_sources: expect.arrayContaining(["runtime_policy:risk:high"]),
        runtime_policy_id: "agent:codex",
        approval_policy_id: "risk:high",
      }),
      guard_proof: expect.objectContaining({
        governance_decision: expect.objectContaining({
          approval_sources: expect.arrayContaining(["runtime_policy:risk:high"]),
        }),
      }),
    }));
  }, 120000);
});
