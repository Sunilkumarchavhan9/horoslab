import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "crypto";
import request from "supertest";
import { makeToken } from "./helpers/authToken";
import { createMemoryOsApp } from "../server/app";
import { TestMemoryStoreAdapter } from "./helpers/testMemoryStoreAdapter";
import { resetMemoryStoreAdapter, setMemoryStoreAdapter } from "../lib/adapters/registry";
import { MEMORYOS_ORG_ID_HEADER } from "../lib/auth/orgScope";

describe("MemoryOS Phase 1-6 inheritance spine contract", () => {
  const app = createMemoryOsApp();
  let userId = "u_inheritance_spine_contract";
  let authHeader = "";

  beforeEach(async () => {
    userId = `u_inheritance_spine_contract_${randomUUID().slice(0, 8)}`;
    process.env.MEMORY_STORE_PROVIDER = "prisma";
    setMemoryStoreAdapter(new TestMemoryStoreAdapter());
    authHeader = `Bearer ${await makeToken(userId)}`;
  });

  afterEach(() => {
    resetMemoryStoreAdapter();
  });

  it("reports real local-production readiness across source, memory, reasoning, brief, outcome, experience, proof views, and connectors", async () => {
    const project = "phase-1-to-6-spine";
    const orgId = "org_inheritance_spine";

    const phase2 = await request(app)
      .post("/api/memory/company-brain/phase2/capture")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, orgId)
      .send({
        workspace: "Inheritance Workspace",
        project,
        memories: [
          {
            type: "risk",
            title: "Onboarding email changes need separate signup tests",
            whatHappened:
              "A prior source showed welcome email failure must not rollback user creation.",
            whyItMatters:
              "Future agents need this risk memory before touching onboarding email code.",
            evidence: ["github:pull/17", "slack:#eng-onboarding", "app/api/onboarding/route.ts"],
            source: "github:pull/17",
            shouldInheritBy: ["codex", "devin"],
          },
          {
            type: "decision",
            title: "Slack incident notes are source evidence for onboarding fixes",
            whatHappened:
              "The engineering channel recorded that onboarding email failures should be retried without blocking signup.",
            whyItMatters:
              "Future agents need communication context before changing onboarding behavior.",
            evidence: ["slack:#eng-onboarding/1729.22", "app/api/onboarding/route.ts"],
            source: "slack:#eng-onboarding/1729.22",
            shouldInheritBy: ["codex"],
          },
          {
            type: "customer_issue",
            title: "Linear issue MEM-106 tracks signup activation pain",
            whatHappened:
              "A customer issue showed new users abandon activation when welcome email state is unclear.",
            whyItMatters:
              "Future agents need product priority context before changing signup and email code.",
            evidence: ["linear:MEM-106", "lib/email.ts"],
            source: "linear:MEM-106",
            shouldInheritBy: ["codex", "devin"],
          },
          {
            type: "agent_action",
            title: "Codex run separated signup success from email retry",
            whatHappened:
              "A Codex run inspected onboarding and email code before proposing a retry-safe implementation.",
            whyItMatters:
              "Future coding agents should inherit what the previous agent already tried.",
            evidence: ["codex:run:onboarding-email", "npm test -- --run onboarding-email"],
            source: "codex:run:onboarding-email",
            shouldInheritBy: ["codex"],
          },
        ],
      });

    expect(phase2.status).toBe(200);
    const memoryId = phase2.body.acceptedMemories[0].id as string;

    const reasoning = await request(app)
      .post("/api/memory/company-brain/reasoning/capture")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, orgId)
      .send({
        workspace: "Inheritance Workspace",
        project,
        sourceType: "linear",
        sourceRef: "MEM-106",
        customerPain: "New users abandon activation when welcome email behavior is unclear.",
        productPriority: "Protect signup success while making email failure observable.",
        task: "Fix onboarding welcome email failure handling.",
        executionContext:
          "Use Company Brain risk memory, inspect app/api/onboarding/route.ts and lib/email.ts, then run focused tests.",
        evidence: ["linear:MEM-106", "github:pull/17"],
        relatedMemoryIds: [memoryId],
        impactedFiles: ["app/api/onboarding/route.ts", "lib/email.ts"],
        requiredTests: ["npm test -- --run onboarding-email"],
      });

    expect(reasoning.status).toBe(200);
    const reasoningId = reasoning.body.reasoningChain.id as string;

    const experience = await request(app)
      .post("/api/memory/company-brain/experience/capture")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, orgId)
      .send({
        workspace: "Inheritance Workspace",
        project,
        sourceType: "codex",
        sourceRef: "codex:run:onboarding-email",
        task: "Fix onboarding welcome email failure handling.",
        problem: "Signup success was coupled to welcome email delivery.",
        context: "The reasoning chain and risk memory require separate handling.",
        action: "Separated user creation from email retry and preserved trace proof.",
        outcome: "Signup can succeed while email failure is retried.",
        lesson: "Do not rollback user creation when a non-critical welcome email fails.",
        futureAgentInstruction:
          "When touching onboarding email logic, test signup success and email failure separately.",
        evidence: ["codex:run:onboarding-email", "npm test -- --run onboarding-email"],
        relatedMemoryIds: [memoryId],
        relatedReasoningIds: [reasoningId],
        files: ["app/api/onboarding/route.ts", "lib/email.ts"],
        tests: ["npm test -- --run onboarding-email"],
        riskLevel: "medium",
      });

    expect(experience.status).toBe(200);

    const generated = await request(app)
      .post("/api/memory/company-brain/skills/candidates/generate")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, orgId)
      .send({ project });

    expect(generated.status).toBe(200);
    expect(generated.body.generatedCount).toBe(1);
    const skillId = generated.body.candidates[0].id as string;

    const approved = await request(app)
      .post(`/api/memory/company-brain/skills/${skillId}/review`)
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, orgId)
      .send({ decision: "approve", note: "Required for local production inheritance spine proof." });

    expect(approved.status).toBe(200);

    const apiKey = await request(app)
      .post("/api/memory/api-keys/codex")
      .set("authorization", authHeader)
      .send({ expires: "1 year" });

    expect(apiKey.status).toBe(201);

    const spine = await request(app)
      .get(`/api/memory/company-brain/inheritance-spine?project=${project}&task=${encodeURIComponent("Fix onboarding welcome email failure handling.")}&agentId=codex`)
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, orgId);

    expect(spine.status).toBe(200);
    expect(spine.body.localProductionReady).toBe(true);
    expect(spine.body.readyPhaseCount).toBe(8);
    expect(spine.body.blockers).toEqual([]);
    expect(spine.body.phases).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "phase1", status: "ready" }),
        expect.objectContaining({ id: "phase2", status: "ready" }),
        expect.objectContaining({ id: "phase2_5", status: "ready" }),
        expect.objectContaining({ id: "phase3", status: "ready" }),
        expect.objectContaining({ id: "phase4", status: "ready" }),
        expect.objectContaining({ id: "phase5", status: "ready" }),
        expect.objectContaining({ id: "phase6", status: "ready" }),
        expect.objectContaining({ id: "phase7", status: "ready" }),
      ]),
    );
    expect(spine.body.proofChain).toMatchObject({
      source: expect.objectContaining({ sourceType: expect.any(String) }),
      memory: expect.objectContaining({ memoryId: expect.any(String), proofQuality: expect.any(String) }),
      reasoning: expect.objectContaining({ reasoningId }),
      experience: expect.objectContaining({ sourceRef: expect.stringContaining("codex:run:onboarding-email") }),
      skill: expect.objectContaining({ skillId, status: "approved" }),
      inheritanceEvent: expect.objectContaining({ memoryIgnitionTraceCount: expect.any(Number) }),
      lineage:
        "Source -> Company Brain Memory -> Reasoning Graph -> Experience -> Approved Skill -> MemoryIgnition -> Outcome Learning",
    });
    expect(spine.body.memoryIgnition).toMatchObject({
      relevantMemoryCount: expect.any(Number),
      executableSkillCount: 1,
      traceProofCount: expect.any(Number),
    });
    expect(spine.body.accessLayer).toMatchObject({
      activeApiKeyCount: expect.any(Number),
      sdkPackageExists: true,
      mcpPackageExists: true,
      compatibilityStatus: expect.any(String),
      apiStandardPackageRequestCount: expect.any(Number),
      mcpStandardPackageRequestCount: expect.any(Number),
      packageTraceProofCount: expect.any(Number),
    });
    expect(spine.body.agentAccessCompatibility).toMatchObject({
      version: "agent_access_compatibility.v1",
      status: expect.any(String),
      passed: expect.any(Number),
      total: expect.any(Number),
      summary: expect.objectContaining({
        apiStandardPackageRequestCount: expect.any(Number),
        mcpStandardPackageRequestCount: expect.any(Number),
      }),
    });
    expect(spine.body.agentAccessCompatibility.summary).toHaveProperty("standardPackageVersion");
  }, 15000);
});
