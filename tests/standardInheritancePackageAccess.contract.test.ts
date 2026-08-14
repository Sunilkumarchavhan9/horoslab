import { randomUUID } from "crypto";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryOsApp } from "../server/app";
import { TestMemoryStoreAdapter } from "./helpers/testMemoryStoreAdapter";
import { getMemoryStoreAdapter, resetMemoryStoreAdapter, setMemoryStoreAdapter } from "../lib/adapters/registry";
import { MEMORYOS_ORG_ID_HEADER } from "../lib/auth/orgScope";
import type { Memory } from "../lib/memory/types";
import { createEpochClient } from "../packages/epoch-sdk/src";
import { makeToken } from "./helpers/authToken";

function buildMemory(input: Partial<Memory> & Pick<Memory, "id" | "userId" | "content" | "summary">): Memory {
  const now = new Date().toISOString();
  return {
    type: "project",
    importanceScore: 0.9,
    confidence: 0.9,
    source: "import",
    status: "active",
    createdAt: now,
    updatedAt: now,
    evidenceCount: 1,
    ...input,
  };
}

describe("Standard Inheritance Package access compatibility", () => {
  const app = createMemoryOsApp();

  beforeEach(() => {
    process.env.MEMORY_STORE_PROVIDER = "prisma";
    setMemoryStoreAdapter(new TestMemoryStoreAdapter());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetMemoryStoreAdapter();
  });

  it("keeps API, SDK, and MCP on the same gated package without leaking blocked memory or skill content", async () => {
    const userId = `u_standard_package_${randomUUID().slice(0, 8)}`;
    const orgId = `org_standard_package_${randomUUID().slice(0, 8)}`;
    const project = `standard-package-${randomUUID().slice(0, 8)}`;
    const authHeader = `Bearer ${await makeToken(userId)}`;
    const now = new Date().toISOString();
    const store = getMemoryStoreAdapter();

    await store.saveMemory({
      memory: buildMemory({
        id: "mem-ready-auth-risk",
        userId,
        orgId,
        type: "project",
        summary: "Auth connector risk rule is source-backed.",
        content: `Auth connector risk rule for ${project}: run auth connector tests before editing callback handling.`,
        contractVersion: "memoryos.contract.v1",
        contractCategory: "risky_file",
        companyBrainType: "risk",
        sourceRef: "github:pull/standard-package-auth-risk",
        traceProof: {
          sourceType: "github",
          sourceRef: "github:pull/standard-package-auth-risk",
          evidence: ["github:pull/standard-package-auth-risk"],
          confidence: 0.94,
          capturedAt: now,
        },
        freshness: { status: "fresh", checkedAt: now },
        conflict: { status: "none", conflictsWith: [], checkedAt: now },
        graph: {
          nodeId: "risk:auth-connector",
          nodeType: "risk",
          edgeRefs: [`project:${project}`, "file:server/routes/connector.routes.ts"],
        },
        proofQuality: {
          score: 92,
          status: "strong",
          productionReady: true,
          reasons: ["Source proof and graph lineage are present."],
          gaps: [],
          assessedAt: now,
        },
        files: ["server/routes/connector.routes.ts"],
      }),
    });

    await store.saveMemory({
      memory: buildMemory({
        id: "mem-stale-shortcut",
        userId,
        orgId,
        type: "project",
        summary: "Stale auth shortcut must be blocked.",
        content: `DO NOT LEAK STALE AUTH SHORTCUT for ${project}. This old shortcut bypasses callback verification.`,
        contractVersion: "memoryos.contract.v1",
        contractCategory: "policy",
        companyBrainType: "process",
        sourceRef: "slack:old-auth-shortcut",
        traceProof: {
          sourceType: "slack",
          sourceRef: "slack:old-auth-shortcut",
          evidence: ["slack:old-auth-shortcut"],
          confidence: 0.9,
          capturedAt: now,
        },
        freshness: { status: "stale", checkedAt: now },
        conflict: { status: "none", conflictsWith: [], checkedAt: now },
        graph: {
          nodeId: "process:old-auth-shortcut",
          nodeType: "process",
          edgeRefs: [`project:${project}`],
        },
        proofQuality: {
          score: 82,
          status: "usable",
          productionReady: true,
          reasons: ["Old source proof exists."],
          gaps: [],
          assessedAt: now,
        },
      }),
    });

    await store.saveMemory({
      memory: buildMemory({
        id: "skill-safe-auth",
        userId,
        orgId,
        type: "learning",
        summary: "Skill Candidate: Safe auth connector workflow",
        content: [
          "Skill: Safe auth connector workflow",
          "Skill status: approved",
          "Trigger: Update connector auth handling without leaking workspace data.",
          "Steps: Inspect auth middleware | Change callback handling | Run auth connector tests",
          "Required tests: npx vitest run tests/memoryIgnitionAgenticRuntime.contract.test.ts",
          "Past mistakes: Workspace leakage through loose callback state.",
          "Evidence: experience:safe-auth",
          "Source experience: exp-safe-auth",
          "Risk level: high",
          "Version: 0.1.0",
          "Supported agents: codex",
          `Inheritance rules: Use for ${project} connector auth work | Require source proof before execution`,
        ].join("\n"),
        contractVersion: "memoryos.contract.v1",
        contractCategory: "runbook",
        sourceRef: "skill_candidate:experience:exp-safe-auth",
        traceProof: {
          sourceType: "experience",
          sourceRef: "experience:safe-auth",
          evidence: ["experience:safe-auth"],
          confidence: 0.93,
          capturedAt: now,
        },
        graph: {
          nodeId: "skill:safe-auth",
          nodeType: "process",
          edgeRefs: [`project:${project}`, "experience:exp-safe-auth"],
        },
      }),
    });

    await store.saveMemory({
      memory: buildMemory({
        id: "skill-deprecated-auth",
        userId,
        orgId,
        type: "learning",
        summary: "Skill Candidate: Deprecated auth shortcut",
        content: [
          "Skill: DO NOT LEAK DEPRECATED AUTH SHORTCUT",
          "Skill status: approved",
          "Trigger: Update connector auth handling without leaking workspace data.",
          "Steps: Use old shortcut",
          "Required tests: npm test -- deprecated-auth-shortcut",
          "Evidence: experience:deprecated-auth",
          "Source experience: exp-deprecated-auth",
          "Risk level: high",
          "Version: 0.1.0",
          "Supported agents: codex",
          `Inheritance rules: deprecated do not use for ${project}`,
        ].join("\n"),
        contractVersion: "memoryos.contract.v1",
        contractCategory: "runbook",
        sourceRef: "skill_candidate:experience:exp-deprecated-auth",
        traceProof: {
          sourceType: "experience",
          sourceRef: "experience:deprecated-auth",
          evidence: ["experience:deprecated-auth"],
          confidence: 0.88,
          capturedAt: now,
        },
        graph: {
          nodeId: "skill:deprecated-auth",
          nodeType: "process",
          edgeRefs: [`project:${project}`, "experience:exp-deprecated-auth"],
        },
      }),
    });

    const requestPayload = {
      question: "Update connector auth handling without leaking workspace data.",
      task_intent: "Update connector auth handling without leaking workspace data.",
      agent_id: "codex",
      project,
      mode: "retrieve" as const,
      topK: 8,
      risk_level: "high",
      available_tools: ["read_files", "edit_files", "terminal", "tests"],
    };

    const apiBrief = await request(app)
      .post("/api/memory/memoryignition/brief")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, orgId)
      .send(requestPayload);

    expect(apiBrief.status).toBe(200);
    const apiPackage = apiBrief.body.data.standard_inheritance_package;
    expect(apiPackage).toEqual(expect.objectContaining({
      version: "standard_inheritance_package.v1",
      task: expect.objectContaining({ target_agent: "codex" }),
      outcome_contract: expect.objectContaining({
        version: "outcome_contract.v1",
        endpoint: "/api/memory/memoryignition/outcome",
        sdk_method: "memoryos.saveOutcome",
        mcp_tool: "memoryignition_save_outcome",
        required_fields: expect.arrayContaining(["future_agent_lesson"]),
      }),
      gates: expect.objectContaining({
        memory: expect.objectContaining({ version: "phase5.inheritance_gate.v1" }),
        skill: expect.objectContaining({ version: "phase5.skill_gate.v1" }),
      }),
    }));
    expect(apiPackage.memories.map((memory: { id: string }) => memory.id)).toContain("mem-ready-auth-risk");
    expect(apiPackage.memories.map((memory: { id: string }) => memory.id)).not.toContain("mem-stale-shortcut");
    expect(apiPackage.withheld_memories).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "mem-stale-shortcut",
        source_ref: expect.any(String),
        status: "blocked",
        reason: expect.any(String),
        failed_steps: expect.any(Array),
      }),
    ]));
    expect(apiPackage.executable_skills.map((skill: { id: string }) => skill.id)).toContain("skill-safe-auth");
    expect(apiPackage.withheld_skills).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "skill-deprecated-auth" }),
    ]));
    expect(apiPackage.required_tests).toEqual(expect.arrayContaining([
      "npx vitest run tests/memoryIgnitionAgenticRuntime.contract.test.ts",
    ]));
    expect(apiPackage.required_tests).not.toContain("npm test -- deprecated-auth-shortcut");
    expect(JSON.stringify(apiPackage)).not.toContain("DO NOT LEAK STALE AUTH SHORTCUT");
    expect(JSON.stringify(apiPackage)).not.toContain("DO NOT LEAK DEPRECATED AUTH SHORTCUT");

    const mcpBrief = await request(app)
      .post("/api/mcp/invoke")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, orgId)
      .send({
        name: "memoryignition_get_brief",
        input: requestPayload,
      });

    expect(mcpBrief.status).toBe(200);
    const mcpPackage = mcpBrief.body.data.result.standard_inheritance_package;
    expect(mcpPackage).toMatchObject({
      version: "standard_inheritance_package.v1",
      task: expect.objectContaining({ target_agent: "codex" }),
      outcome_contract: expect.objectContaining({
        version: "outcome_contract.v1",
        mcp_tool: "memoryignition_save_outcome",
      }),
    });
    expect(mcpPackage.memories.map((memory: { id: string }) => memory.id)).toEqual(apiPackage.memories.map((memory: { id: string }) => memory.id));
    expect(mcpPackage.executable_skills.map((skill: { id: string }) => skill.id)).toEqual(apiPackage.executable_skills.map((skill: { id: string }) => skill.id));
    expect(mcpPackage.withheld_memories.map((memory: { id: string }) => memory.id)).toEqual(apiPackage.withheld_memories.map((memory: { id: string }) => memory.id));
    expect(mcpPackage.withheld_skills.map((skill: { id: string }) => skill.id)).toEqual(apiPackage.withheld_skills.map((skill: { id: string }) => skill.id));
    expect(JSON.stringify(mcpPackage)).not.toContain("DO NOT LEAK STALE AUTH SHORTCUT");
    expect(JSON.stringify(mcpPackage)).not.toContain("DO NOT LEAK DEPRECATED AUTH SHORTCUT");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: apiBrief.body.data }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const sdkClient = createEpochClient({
      apiKey: "mk_standard_package_test",
      baseUrl: "http://localhost:3011",
    });

    const sdkPackage = await sdkClient.createInheritancePackage(requestPayload);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3011/api/memory/memoryignition/brief",
      expect.objectContaining({ method: "POST" }),
    );
    expect(sdkPackage).toMatchObject({
      version: "standard_inheritance_package.v1",
      task: expect.objectContaining({ target_agent: "codex" }),
      outcome_contract: expect.objectContaining({
        version: "outcome_contract.v1",
        sdk_method: "memoryos.saveOutcome",
      }),
    });
    expect(sdkPackage.memories.map((memory) => memory.id)).toEqual(apiPackage.memories.map((memory: { id: string }) => memory.id));
    expect(sdkPackage.executable_skills.map((skill) => skill.id)).toEqual(apiPackage.executable_skills.map((skill: { id: string }) => skill.id));
    expect(JSON.stringify(sdkPackage)).not.toContain("DO NOT LEAK STALE AUTH SHORTCUT");
    expect(JSON.stringify(sdkPackage)).not.toContain("DO NOT LEAK DEPRECATED AUTH SHORTCUT");
  }, 120000);
});
