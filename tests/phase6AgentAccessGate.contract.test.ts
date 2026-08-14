import request from "supertest";
import { describe, expect, it } from "vitest";
import { createMemoryOsApp } from "../server/app";
import { makeToken } from "./helpers/authToken";

describe("Phase 6 Agent Access gate", () => {
  const app = createMemoryOsApp();

  it("reports missing outcomes for issued MemoryIgnition packages", async () => {
    const userId = `u_phase6_missing_outcome_${Date.now()}`;
    const jwt = `Bearer ${await makeToken(userId)}`;

    const briefRes = await request(app)
      .post("/api/memory/memoryignition/brief")
      .set("authorization", jwt)
      .send({
        question: "Issue a brief without saving outcome yet.",
        task_intent: "Issue a brief without saving outcome yet.",
        agent_id: "codex",
        project: "memoryos",
        mode: "retrieve",
        topK: 3,
      });

    expect(briefRes.status).toBe(200);
    expect(briefRes.body.data.standard_inheritance_package).toEqual(expect.objectContaining({
      outcome_contract: expect.objectContaining({ version: "outcome_contract.v1" }),
    }));

    const statusRes = await request(app)
      .get("/api/memory/agent-access/status")
      .set("authorization", jwt);

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.protocolProof).toEqual(expect.objectContaining({
      outcomeContractVersion: "outcome_contract.v1",
      outcomePendingCount: 1,
      outcomeContractStatus: "pending",
      pendingOutcomeBriefs: expect.arrayContaining([
        expect.objectContaining({
          standardPackageVersion: "standard_inheritance_package.v1",
        }),
      ]),
    }));
    expect(statusRes.body.data.compatibilityReport.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "outcome_learning", ok: false }),
      expect.objectContaining({ id: "outcome_contract", ok: true }),
    ]));

    const outcomeRes = await request(app)
      .post("/api/memory/memoryignition/outcome")
      .set("authorization", jwt)
      .send({
        repo_or_task: "memoryos",
        task_intent: "Issue a brief without saving outcome yet.",
        agent_id: "agent-access-dashboard",
        outcome_status: "success",
        outcome: "Agent Access dashboard closed the missing outcome for the latest issued brief.",
        files_touched: [],
        tests_passed: ["agent-access:outcome-contract"],
        tests_failed: [],
        what_worked: "The dashboard saved outcome learning through the live MemoryIgnition outcome endpoint.",
        what_failed: "No failure reported while closing the outcome contract.",
        future_agent_lesson: "Every issued MemoryIgnition package must be followed by a saved outcome.",
        tool_calls: ["/api/memory/memoryignition/brief", "/api/memory/memoryignition/outcome"],
        risk_level: "medium",
      });

    expect(outcomeRes.status).toBe(200);
    expect(outcomeRes.body.data).toEqual(expect.objectContaining({
      outcome_recorded: true,
      experience_timeline: expect.arrayContaining([
        expect.objectContaining({ step: "outcome_captured", status: "recorded" }),
      ]),
    }));

    const satisfiedStatusRes = await request(app)
      .get("/api/memory/agent-access/status")
      .set("authorization", jwt);

    expect(satisfiedStatusRes.status).toBe(200);
    expect(satisfiedStatusRes.body.data.protocolProof).toEqual(expect.objectContaining({
      outcomePendingCount: 0,
      outcomeContractStatus: "satisfied",
      outcomeRequestCount: expect.any(Number),
    }));
    expect(satisfiedStatusRes.body.data.protocolProof.outcomeRequestCount).toBeGreaterThanOrEqual(1);
    expect(satisfiedStatusRes.body.data.compatibilityReport.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "outcome_learning", ok: true }),
      expect.objectContaining({ id: "outcome_contract", ok: true }),
    ]));
  });

  it("runs the dashboard gate and records API, MCP, and outcome proof telemetry", async () => {
    const userId = `u_phase6_dashboard_gate_${Date.now()}`;
    const jwt = `Bearer ${await makeToken(userId)}`;

    const gateRes = await request(app)
      .post("/api/memory/agent-access/run-gate")
      .set("authorization", jwt)
      .send({ task: "Dashboard button proves Phase 6 protocol wiring." });

    expect(gateRes.status).toBe(200);
    expect(gateRes.body.data).toEqual(expect.objectContaining({
      status: "ready",
      ready: true,
      passed: expect.any(Number),
      total: expect.any(Number),
      key: expect.objectContaining({
        mode: "scoped",
        status: "active",
        contentTag: "agent-memory-protocol",
      }),
      checks: expect.arrayContaining([
        expect.objectContaining({ id: "scoped_token", ok: true }),
        expect.objectContaining({ id: "api_brief", ok: true }),
        expect.objectContaining({ id: "mcp_brief", ok: true }),
        expect.objectContaining({ id: "standard_package", ok: true }),
        expect.objectContaining({ id: "outcome_saved", ok: true }),
      ]),
    }));
    expect(gateRes.body.data.passed).toBe(gateRes.body.data.total);

    const statusRes = await request(app)
      .get("/api/memory/agent-access/status")
      .set("authorization", jwt);

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.protocolProof.apiBriefRequestCount).toBeGreaterThanOrEqual(1);
    expect(statusRes.body.data.protocolProof.mcpBriefRequestCount).toBeGreaterThanOrEqual(1);
    expect(statusRes.body.data.protocolProof.outcomeRequestCount).toBeGreaterThanOrEqual(1);
    expect(statusRes.body.data.protocolProof.mcpRequestCount).toBeGreaterThanOrEqual(2);
    expect(statusRes.body.data.protocolProof.standardPackageVersion).toBe("standard_inheritance_package.v1");
    expect(statusRes.body.data.protocolProof.standardPackageReady).toBe(true);
    expect(statusRes.body.data.protocolProof.apiStandardPackageRequestCount).toBeGreaterThanOrEqual(1);
    expect(statusRes.body.data.protocolProof.mcpStandardPackageRequestCount).toBeGreaterThanOrEqual(1);
    expect(statusRes.body.data.protocolProof.outcomeContractVersion).toBe("outcome_contract.v1");
    expect(statusRes.body.data.protocolProof.outcomePendingCount).toBe(0);
    expect(statusRes.body.data.protocolProof.outcomeContractStatus).toBe("satisfied");
    expect(statusRes.body.data.compatibilityReport).toEqual(expect.objectContaining({
      version: "agent_access_compatibility.v1",
      ready: true,
      status: "ready",
      checks: expect.arrayContaining([
        expect.objectContaining({ id: "api_standard_package", ok: true }),
        expect.objectContaining({ id: "mcp_standard_package", ok: true }),
        expect.objectContaining({ id: "package_version", ok: true }),
        expect.objectContaining({ id: "outcome_contract", ok: true }),
        expect.objectContaining({ id: "outcome_learning", ok: true }),
      ]),
    }));
  });

  it("proves scoped API, MCP brief, outcome learning, and Agent Access telemetry end to end", async () => {
    const userId = `u_phase6_gate_${Date.now()}`;
    const jwt = `Bearer ${await makeToken(userId)}`;

    const tokenRes = await request(app)
      .post("/api/memory/api-keys/agent-access")
      .set("authorization", jwt)
      .send({ name: "phase6-gate-agent", expires: "1 year" });

    expect(tokenRes.status).toBe(201);
    expect(tokenRes.body.token).toMatch(/^mk_/);
    expect(tokenRes.body.key).toMatchObject({
      mode: "scoped",
      status: "active",
      contentTag: "agent-memory-protocol",
    });
    expect(tokenRes.body.key.endpoints).toEqual(
      expect.arrayContaining(["memoryignition_brief", "outcome", "mcp_invoke", "trace_proof"]),
    );

    const apiToken = `Bearer ${tokenRes.body.token}`;
    const task = "Phase 6 gate proves API SDK MCP inheritance package.";

    const apiBrief = await request(app)
      .post("/api/memory/memoryignition/brief")
      .set("authorization", apiToken)
      .send({
        question: task,
        task_intent: task,
        agent_id: "codex",
        project: "memoryos",
        mode: "retrieve",
        topK: 5,
        available_tools: ["read_files", "terminal"],
        risk_level: "medium",
      });

    expect(apiBrief.status).toBe(200);
    expect(apiBrief.body.data).toEqual(expect.objectContaining({
      contextText: expect.any(String),
      source: expect.stringMatching(/retrieve|resume/),
      relevant_memories: expect.any(Array),
      executable_skills: expect.any(Array),
      skill_inheritance_proofs: expect.any(Array),
      trace_proof: expect.any(Array),
      outcome_hooks: expect.arrayContaining([
        expect.stringContaining("memoryignition_save_outcome"),
      ]),
      ready_to_send_prompt: expect.stringContaining("MemoryIgnition Brief"),
      standard_inheritance_package: expect.objectContaining({
        version: "standard_inheritance_package.v1",
        delivery: expect.stringMatching(/api|sdk|mcp|copy_prompt/),
        task: expect.objectContaining({
          target_agent: "codex",
        }),
        outcome: expect.objectContaining({
          save_required: expect.any(Boolean),
        }),
        outcome_contract: expect.objectContaining({
          version: "outcome_contract.v1",
          endpoint: "/api/memory/memoryignition/outcome",
          sdk_method: "memoryos.saveOutcome",
          mcp_tool: "memoryignition_save_outcome",
        }),
      }),
      evaluation_gate: expect.objectContaining({
        can_inherit: expect.any(Boolean),
        can_execute: expect.any(Boolean),
      }),
    }));

    const mcpBrief = await request(app)
      .post("/api/mcp/invoke")
      .set("authorization", apiToken)
      .send({
        name: "memoryignition_get_brief",
        input: {
          question: task,
          task_intent: task,
          agent_id: "codex",
          project: "memoryos",
          mode: "retrieve",
          topK: 5,
          available_tools: ["read_files", "terminal"],
          risk_level: "medium",
        },
      });

    expect(mcpBrief.status).toBe(200);
    expect(mcpBrief.body.data).toMatchObject({
      name: "memoryignition_get_brief",
      result: expect.objectContaining({
        ready_to_send_prompt: expect.stringContaining("MemoryIgnition Brief"),
        standard_inheritance_package: expect.objectContaining({
          version: "standard_inheritance_package.v1",
          task: expect.objectContaining({ target_agent: "codex" }),
          outcome_contract: expect.objectContaining({
            version: "outcome_contract.v1",
            mcp_tool: "memoryignition_save_outcome",
          }),
        }),
        skill_inheritance_proofs: expect.any(Array),
        evaluation_gate: expect.objectContaining({
          can_inherit: expect.any(Boolean),
        }),
      }),
    });

    const mcpOutcome = await request(app)
      .post("/api/mcp/invoke")
      .set("authorization", apiToken)
      .send({
        name: "memoryignition_save_outcome",
        input: {
          outcome: "Phase 6 gate completed API and MCP inheritance proof.",
          outcome_status: "success",
          tests_passed: ["phase6:agent-access:gate"],
          tests_failed: [],
          what_worked: "Scoped token called API brief, MCP brief, and outcome learning.",
          future_agent_lesson: "Use Agent Access status to verify protocol calls before deployment.",
          tool_calls: ["POST /api/memory/memoryignition/brief", "POST /api/mcp/invoke"],
          risk_level: "medium",
        },
      });

    expect(mcpOutcome.status).toBe(200);
    expect(mcpOutcome.body.data.result).toEqual(expect.objectContaining({
      outcome_recorded: true,
      experience_timeline: expect.arrayContaining([
        expect.objectContaining({ step: "outcome_captured", status: "recorded" }),
      ]),
    }));

    const blockedProcess = await request(app)
      .post("/api/memory/process")
      .set("authorization", apiToken)
      .send({ message: "Scoped Agent Access token must not write arbitrary memories." });

    expect(blockedProcess.status).toBe(403);
    expect(blockedProcess.body).toHaveProperty("error", "API key scope does not allow this endpoint");

    const statusRes = await request(app)
      .get("/api/memory/agent-access/status")
      .set("authorization", jwt);

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data).toEqual(expect.objectContaining({
      keys: expect.arrayContaining([
        expect.objectContaining({
          id: tokenRes.body.key.id,
          contentTag: "agent-memory-protocol",
          requests24h: expect.any(Number),
          usage: expect.objectContaining({
            requestCount: expect.any(Number),
            requests24h: expect.any(Number),
            successCount: expect.any(Number),
            errorCount: expect.any(Number),
            apiRequestCount: expect.any(Number),
            mcpRequestCount: expect.any(Number),
            briefRequestCount: expect.any(Number),
            outcomeRequestCount: expect.any(Number),
            traceProofRequestCount: expect.any(Number),
            standardPackageRequestCount: expect.any(Number),
            lastRequestAt: expect.any(String),
            lastStatus: expect.stringMatching(/Success|Error/),
            observedEndpoints: expect.any(Array),
          }),
        }),
      ]),
      protocolProof: expect.objectContaining({
        requestCount: expect.any(Number),
        apiBriefRequestCount: expect.any(Number),
        mcpBriefRequestCount: expect.any(Number),
        briefRequestCount: expect.any(Number),
        outcomeRequestCount: expect.any(Number),
        mcpRequestCount: expect.any(Number),
        standardPackageVersion: "standard_inheritance_package.v1",
        standardPackageReady: true,
        apiStandardPackageRequestCount: expect.any(Number),
        mcpStandardPackageRequestCount: expect.any(Number),
        standardPackageRequestCount: expect.any(Number),
        packageMemoryCount: expect.any(Number),
        packageSkillCount: expect.any(Number),
        packageTraceProofCount: expect.any(Number),
        outcomeContractVersion: "outcome_contract.v1",
        outcomePendingCount: 0,
        outcomeContractStatus: "satisfied",
        latestBrief: expect.objectContaining({
          relevantMemoryCount: expect.any(Number),
          executableSkillCount: expect.any(Number),
          skillProofCount: expect.any(Number),
          traceProofCount: expect.any(Number),
          standardPackageVersion: "standard_inheritance_package.v1",
          standardPackageReady: true,
          outcomeContractVersion: "outcome_contract.v1",
        }),
      }),
      compatibilityReport: expect.objectContaining({
        version: "agent_access_compatibility.v1",
        ready: true,
        status: "ready",
        summary: expect.objectContaining({
          standardPackageVersion: "standard_inheritance_package.v1",
          apiStandardPackageRequestCount: expect.any(Number),
          mcpStandardPackageRequestCount: expect.any(Number),
          outcomePendingCount: 0,
          outcomeContractVersion: "outcome_contract.v1",
        }),
      }),
    }));
    expect(statusRes.body.data.protocolProof.requestCount).toBeGreaterThanOrEqual(4);
    expect(statusRes.body.data.protocolProof.apiBriefRequestCount).toBeGreaterThanOrEqual(1);
    expect(statusRes.body.data.protocolProof.mcpBriefRequestCount).toBeGreaterThanOrEqual(1);
    expect(statusRes.body.data.protocolProof.briefRequestCount).toBeGreaterThanOrEqual(2);
    expect(statusRes.body.data.protocolProof.outcomeRequestCount).toBeGreaterThanOrEqual(1);
    expect(statusRes.body.data.protocolProof.mcpRequestCount).toBeGreaterThanOrEqual(2);

    const activeKey = statusRes.body.data.keys.find((key: { id: string }) => key.id === tokenRes.body.key.id);
    expect(activeKey.usage.requestCount).toBeGreaterThanOrEqual(3);
    expect(activeKey.usage.apiRequestCount).toBeGreaterThanOrEqual(1);
    expect(activeKey.usage.mcpRequestCount).toBeGreaterThanOrEqual(2);
    expect(activeKey.usage.standardPackageRequestCount).toBeGreaterThanOrEqual(2);

    for (const tool of ["memoryignition_get_brief", "memoryignition_risk_check", "memoryignition_save_outcome"]) {
      const testerRes = await request(app)
        .post(`/api/memory/agent-access/keys/${tokenRes.body.key.id}/mcp-test`)
        .set("authorization", jwt)
        .send({
          tool,
          task: "Dashboard MCP tester proves selected token protocol telemetry.",
        });

      expect(testerRes.status).toBe(200);
      expect(testerRes.body.data).toEqual(expect.objectContaining({
        tool,
        requestId: expect.any(String),
        key: expect.objectContaining({
          id: tokenRes.body.key.id,
          usage: expect.objectContaining({
            requestCount: expect.any(Number),
            mcpRequestCount: expect.any(Number),
          }),
        }),
      }));
    }

    const keyTimeline = await request(app)
      .get(`/api/memory/agent-access/keys/${tokenRes.body.key.id}/requests?limit=20`)
      .set("authorization", jwt);

    expect(keyTimeline.status).toBe(200);
    expect(keyTimeline.body.data).toEqual(expect.objectContaining({
      key: expect.objectContaining({
        id: tokenRes.body.key.id,
        usage: expect.objectContaining({
          requestCount: expect.any(Number),
          apiRequestCount: expect.any(Number),
          mcpRequestCount: expect.any(Number),
          standardPackageRequestCount: expect.any(Number),
        }),
      }),
      usage: expect.objectContaining({
        requestCount: expect.any(Number),
        standardPackageRequestCount: expect.any(Number),
      }),
      count: expect.any(Number),
      requests: expect.arrayContaining([
        expect.objectContaining({
          requestId: expect.any(String),
          method: expect.any(String),
          path: expect.any(String),
          status: expect.stringMatching(/Success|Error/),
          isApi: expect.any(Boolean),
          isMcp: expect.any(Boolean),
          standardPackageVersion: expect.anything(),
          packageMemoryCount: expect.any(Number),
          packageSkillCount: expect.any(Number),
          packageTraceProofCount: expect.any(Number),
        }),
      ]),
    }));
    expect(keyTimeline.body.data.usage.requestCount).toBeGreaterThanOrEqual(6);
    expect(keyTimeline.body.data.usage.standardPackageRequestCount).toBeGreaterThanOrEqual(4);

    const forbiddenTimeline = await request(app)
      .get("/api/memory/agent-access/keys/key_not_owned/requests")
      .set("authorization", jwt);

    expect(forbiddenTimeline.status).toBe(404);

    const revokeRes = await request(app)
      .post(`/api/memory/api-keys/${tokenRes.body.key.id}/revoke`)
      .set("authorization", jwt);

    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.key).toEqual(expect.objectContaining({
      id: tokenRes.body.key.id,
      status: "revoked",
      revokedAt: expect.any(String),
    }));

    const revokedStatus = await request(app)
      .get("/api/memory/agent-access/status")
      .set("authorization", jwt);

    expect(revokedStatus.status).toBe(200);
    expect(revokedStatus.body.data.keys).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: tokenRes.body.key.id })]),
    );
  }, 30_000);
});
