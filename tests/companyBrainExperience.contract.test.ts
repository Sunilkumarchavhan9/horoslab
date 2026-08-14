import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "crypto";
import request from "supertest";
import { makeToken } from "./helpers/authToken";
import { createMemoryOsApp } from "../server/app";
import { TestMemoryStoreAdapter } from "./helpers/testMemoryStoreAdapter";
import { resetMemoryStoreAdapter, setMemoryStoreAdapter } from "../lib/adapters/registry";
import { MEMORYOS_ORG_ID_HEADER } from "../lib/auth/orgScope";

describe("Company Brain Phase 3 Experience Graph contract", () => {
  const app = createMemoryOsApp();
  let userId = "u_company_brain_experience_contract";
  let authHeader = "";

  beforeEach(async () => {
    userId = `u_company_brain_experience_contract_${randomUUID().slice(0, 8)}`;
    process.env.MEMORY_STORE_PROVIDER = "prisma";
    setMemoryStoreAdapter(new TestMemoryStoreAdapter());
    authHeader = `Bearer ${await makeToken(userId)}`;
  });

  afterEach(() => {
    resetMemoryStoreAdapter();
  });

  it("captures a real work outcome as reusable future-agent experience", async () => {
    const project = "phase3-experience-project";
    const capture = await request(app)
      .post("/api/memory/company-brain/experience/capture")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_experience_alpha")
      .send({
        workspace: "Experience Workspace",
        project,
        sourceType: "codex",
        sourceRef: "run:welcome-email-fix",
        task: "Fix welcome email fallback after signup.",
        problem: "Signup completed but email failure caused users to retry onboarding.",
        context: "The agent inherited reasoning context and inspected email delivery before changing signup.",
        action: "Separated signup success from welcome email delivery and added retry logging.",
        mistake: "Previous attempt tied email delivery to onboarding success.",
        outcome: "Signup now succeeds while email retry is recorded.",
        lesson: "Do not block activation on non-critical notification delivery.",
        futureAgentInstruction: "Before changing onboarding, preserve user creation and isolate notification failures.",
        evidence: ["codex:run:welcome-email-fix", "test:auth-onboarding"],
        files: ["app/api/onboarding/route.ts", "lib/email.ts"],
        tests: ["npm test -- onboarding"],
        riskLevel: "medium",
      });

    expect(capture.status).toBe(200);
    expect(capture.body.acceptedCount).toBe(1);
    expect(capture.body.experienceRecord).toMatchObject({
      task: "Fix welcome email fallback after signup.",
      problem: expect.stringContaining("Signup completed"),
      outcome: expect.stringContaining("Signup now succeeds"),
      lesson: expect.stringContaining("Do not block activation"),
      futureAgentInstruction: expect.stringContaining("Before changing onboarding"),
      files: expect.arrayContaining(["lib/email.ts"]),
      tests: expect.arrayContaining(["npm test -- onboarding"]),
      traceProof: expect.objectContaining({
        sourceType: "codex",
        sourceRef: expect.stringContaining("experience:codex:run:welcome-email-fix"),
      }),
    });
    expect(capture.body.inheritanceAddition).toMatchObject({
      lesson: expect.stringContaining("Do not block activation"),
      futureAgentInstruction: expect.stringContaining("preserve user creation"),
    });

    const overview = await request(app)
      .get(`/api/memory/company-brain/experience/overview?project=${project}`)
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_experience_alpha");

    expect(overview.status).toBe(200);
    expect(overview.body.totalExperienceRecords).toBe(1);
    expect(overview.body.traceProofCoverage).toBe(100);
    expect(overview.body.inheritanceReadiness).toMatchObject({
      version: "experience_inheritance_readiness.v1",
      readyForNextBrief: 1,
      needsReviewForNextBrief: 0,
      blockedFromNextBrief: 0,
      score: 100,
      nextAction: expect.stringContaining("Run MemoryIgnition Brief"),
    });
    expect(overview.body.inheritanceReadiness.records[0]).toMatchObject({
      task: "Fix welcome email fallback after signup.",
      status: "ready",
      score: 100,
      readyForNextBrief: true,
      missing: [],
      checks: expect.arrayContaining([
        expect.objectContaining({ id: "source_proof", ok: true }),
        expect.objectContaining({ id: "evidence", ok: true }),
        expect.objectContaining({ id: "future_agent_instruction", ok: true }),
      ]),
    });
    expect(overview.body.records[0]).toMatchObject({
      task: "Fix welcome email fallback after signup.",
      riskLevel: "medium",
      status: "captured",
      sourceType: "codex",
    });
    expect(overview.body.graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "produced" }),
        expect.objectContaining({ type: "teaches" }),
      ]),
    );
    expect(overview.body.inheritanceAdditions[0]).toMatchObject({
      task: "Fix welcome email fallback after signup.",
      lesson: expect.stringContaining("Do not block activation"),
    });
    expect(overview.body.outcomeLearningTimeline[0]).toMatchObject({
      task: "Fix welcome email fallback after signup.",
      sourceRef: expect.stringContaining("experience:codex:run:welcome-email-fix"),
      outcome: expect.stringContaining("Signup now succeeds"),
      lesson: expect.stringContaining("Do not block activation"),
      tests: expect.arrayContaining(["npm test -- onboarding"]),
      traceProofComplete: true,
      lineage: "Source -> Experience -> Lesson -> Next MemoryIgnition Brief",
    });
  });

  it("keeps experience records isolated by organization", async () => {
    const project = "phase3-org-isolation";
    await request(app)
      .post("/api/memory/company-brain/experience/capture")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_experience_alpha")
      .send({
        project,
        sourceType: "github",
        sourceRef: "pull/91",
        task: "Patch deploy rollback runbook.",
        problem: "Rollback steps were missing service health validation.",
        context: "Incident review showed deploy was reverted without checking workers.",
        action: "Added worker health validation to rollback runbook.",
        outcome: "Rollback runbook now includes service checks.",
        lesson: "Future agents must validate worker health before declaring rollback complete.",
        futureAgentInstruction: "Run worker health checks after rollback and attach evidence.",
        evidence: ["github:pull/91"],
      });

    const alpha = await request(app)
      .get(`/api/memory/company-brain/experience/overview?project=${project}`)
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_experience_alpha");
    const beta = await request(app)
      .get(`/api/memory/company-brain/experience/overview?project=${project}`)
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_experience_beta");

    expect(alpha.status).toBe(200);
    expect(beta.status).toBe(200);
    expect(alpha.body.totalExperienceRecords).toBe(1);
    expect(beta.body.totalExperienceRecords).toBe(0);
  });

  it("promotes action-memory outcomes into Experience Graph records automatically", async () => {
    const project = "phase3-action-memory-project";
    const action = await request(app)
      .post("/api/memory/action-memory")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_experience_action")
      .send({
        workspace: "Experience Workspace",
        projectId: project,
        action: "codex:fix_signup_email",
        reason: "Codex separated signup success from welcome email retry failure.",
        outcome: "success",
        filesChanged: ["app/api/onboarding/route.ts", "lib/email.ts"],
        followUps: ["Run onboarding regression tests before merge."],
        sourceType: "continuity",
        sourceId: "codex-run-001",
      });

    expect(action.status).toBe(201);
    expect(action.body.data.experienceRecord).toMatchObject({
      task: "codex:fix_signup_email",
      problem: expect.stringContaining("signup success"),
      lesson: expect.stringContaining("successful action outcome"),
      futureAgentInstruction: expect.stringContaining("app/api/onboarding/route.ts"),
      sourceType: "action_memory",
      files: expect.arrayContaining(["lib/email.ts"]),
      traceProof: expect.objectContaining({
        sourceType: "action_memory",
      }),
    });

    const overview = await request(app)
      .get(`/api/memory/company-brain/experience/overview?project=${project}`)
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_experience_action");

    expect(overview.status).toBe(200);
    expect(overview.body.totalExperienceRecords).toBe(1);
    expect(overview.body.records[0]).toMatchObject({
      task: "codex:fix_signup_email",
      sourceType: "action_memory",
      status: "captured",
    });
    expect(overview.body.inheritanceReadiness).toMatchObject({
      version: "experience_inheritance_readiness.v1",
      readyForNextBrief: 1,
      score: 100,
    });
    expect(overview.body.inheritanceReadiness.records[0]).toMatchObject({
      status: "ready",
      readyForNextBrief: true,
      checks: expect.arrayContaining([
        expect.objectContaining({ id: "execution_context", ok: true }),
      ]),
    });
    expect(overview.body.inheritanceAdditions[0].futureAgentInstruction).toContain("Review impacted files");
    expect(overview.body.outcomeLearningTimeline[0]).toMatchObject({
      task: "codex:fix_signup_email",
      sourceRef: expect.stringContaining("experience:action_memory:"),
      files: expect.arrayContaining(["lib/email.ts"]),
      traceProofComplete: true,
    });
  });
});
