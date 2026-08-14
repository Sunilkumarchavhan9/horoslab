import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "crypto";
import request from "supertest";
import { createMemoryOsApp } from "../server/app";
import { makeToken } from "./helpers/authToken";
import { prisma } from "../lib/storage/prismaClient";
import { resetRuntimeDataStoresForTests } from "./helpers/resetDataDir";
import { MEMORYOS_ORG_ID_HEADER } from "../lib/auth/orgScope";
import { setMemoryStoreAdapter, resetMemoryStoreAdapter } from "../lib/adapters/registry";
import { TestMemoryStoreAdapter } from "./helpers/testMemoryStoreAdapter";
import { verificationScopeKey } from "../lib/realityCompiler/experienceScope";

describe("Experience retrieval contract", () => {
  const app = createMemoryOsApp();
  let userId = "u_experience_routes_contract";
  let authHeader = "";
  const orgId = "org_experience_phase2_alpha";

  beforeEach(async () => {
    userId = `u_experience_routes_contract_${randomUUID().slice(0, 8)}`;
    process.env.MEMORY_STORE_PROVIDER = "prisma";
    setMemoryStoreAdapter(new TestMemoryStoreAdapter());
    await resetRuntimeDataStoresForTests();
    authHeader = `Bearer ${await makeToken(userId)}`;
  });

  afterEach(() => {
    resetMemoryStoreAdapter();
  });

  it("searches experiences and retrieves lessons, failure patterns, and root causes", async () => {
    const workspaceId = verificationScopeKey(userId, orgId);
    const experienceOneId = `exp-${randomUUID().slice(0, 8)}-1`;
    const experienceTwoId = `exp-${randomUUID().slice(0, 8)}-2`;
    const experienceThreeId = `exp-${randomUUID().slice(0, 8)}-3`;

    await prisma.experienceRecord.create({
      data: {
        id: experienceOneId,
        workspaceId,
        outcomeId: `outcome-${randomUUID().slice(0, 8)}-1`,
        title: "FAIL payment rollback guardrails",
        summary: "Rollback failed because worker health validation was skipped.",
        lesson: "Validate worker health before declaring rollback complete.",
        proof: {
          repository: "sunil/payment",
          pullRequestNumber: 41,
          verdict: "FAIL",
          confidence: 84,
          mission: {
            owner: "sunil",
            repo: "payment",
            title: "Fix rollback guardrails",
            url: null,
            headSha: "abc123",
            baseRef: "main",
            headRef: "rollback-fix",
          },
          problem: "Rollback lacked worker health validation.",
          rootCause: "Rollback skipped worker health validation.",
          wrongAttempts: ["Revert without worker health checks."],
          correctSolution: "Add worker health validation to rollback closeout.",
          evidence: {
            summary: "Missing post-rollback validation",
            findings: ["worker health never checked"],
            files: [
              {
                path: "server/routes/deploy.ts",
                status: "modified",
                additions: 3,
                deletions: 0,
                changes: 3,
                patchAvailable: true,
              },
            ],
          },
          tests: ["pnpm test -- rollback"],
          lesson: "Validate worker health before declaring rollback complete.",
          bestPractice: "Verify workers before rollback closeout.",
          antiPattern: "Skipping rollback health validation.",
          files: ["server/routes/deploy.ts"],
          language: "TypeScript",
          framework: "Node.js",
        },
        confidence: 84,
        status: "captured",
      },
    });

    await prisma.experienceRecord.create({
      data: {
        id: experienceTwoId,
        workspaceId,
        outcomeId: `outcome-${randomUUID().slice(0, 8)}-2`,
        title: "FAIL payment rollback guardrails duplicate",
        summary: "Rollback failed because the worker health check was still missing.",
        lesson: "Validate worker health before declaring rollback complete.",
        proof: {
          repository: "sunil/payment",
          pullRequestNumber: 42,
          verdict: "FAIL",
          confidence: 88,
          mission: {
            owner: "sunil",
            repo: "payment",
            title: "Patch rollback checklist",
            url: null,
            headSha: "def456",
            baseRef: "main",
            headRef: "rollback-checklist",
          },
          problem: "Rollback checklist still missed worker validation.",
          rootCause: "Rollback skipped worker health validation.",
          wrongAttempts: ["Revert without worker health checks."],
          correctSolution: "Add worker health validation to rollback closeout.",
          evidence: {
            summary: "The operator closed the rollback without checking workers.",
            findings: ["missing worker health probe"],
            files: [
              {
                path: "server/routes/deploy.ts",
                status: "modified",
                additions: 2,
                deletions: 1,
                changes: 3,
                patchAvailable: true,
              },
            ],
          },
          tests: ["pnpm test -- rollback"],
          lesson: "Validate worker health before declaring rollback complete.",
          bestPractice: "Check workers before the rollback is marked done.",
          antiPattern: "Skipping rollback health validation.",
          files: ["server/routes/deploy.ts"],
          language: "TypeScript",
          framework: "Node.js",
        },
        confidence: 88,
        status: "captured",
      },
    });

    await prisma.experienceRecord.create({
      data: {
        id: experienceThreeId,
        workspaceId,
        outcomeId: `outcome-${randomUUID().slice(0, 8)}-3`,
        title: "PASS onboarding experience capture",
        summary: "Verification stayed green because signup logic stayed decoupled.",
        lesson: "Keep verification decoupled from optional notification delivery.",
        proof: {
          repository: "sunil/onboarding",
          pullRequestNumber: 18,
          verdict: "PASS",
          confidence: 91,
          mission: {
            owner: "sunil",
            repo: "onboarding",
            title: "Stabilize signup flow",
            url: null,
            headSha: "ghi789",
            baseRef: "main",
            headRef: "signup-stability",
          },
          problem: "Signup success should not depend on email delivery.",
          rootCause: "Notification delivery is an optional side effect.",
          wrongAttempts: ["Block signup on email delivery."],
          correctSolution: "Allow signup to finish even if email retries later.",
          evidence: {
            summary: "The verification passed with a clean evidence trail.",
            findings: ["signup stayed decoupled"],
            files: [
              {
                path: "app/api/onboarding/route.ts",
                status: "modified",
                additions: 4,
                deletions: 1,
                changes: 5,
                patchAvailable: true,
              },
            ],
          },
          tests: ["pnpm test -- onboarding"],
          lesson: "Keep verification decoupled from optional notification delivery.",
          bestPractice: "Preserve the evidence trail and retry notifications independently.",
          antiPattern: "Blocking activation on a non-critical email path.",
          files: ["app/api/onboarding/route.ts"],
          language: "TypeScript",
          framework: "Next.js",
        },
        confidence: 91,
        status: "captured",
      },
    });

    const search = await request(app)
      .get("/api/experience/search?query=rollback&limit=10")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, orgId);

    expect(search.status).toBe(200);
    expect(search.body.total).toBe(2);
    expect(search.body.results[0]).toMatchObject({
      repository: "sunil/payment",
      verdict: "FAIL",
    });
    expect(search.body.results[0].matchReasons).toEqual(expect.arrayContaining([expect.stringContaining("rollback")]));

    const lessons = await request(app)
      .get("/api/experience/lessons?query=rollback&limit=10")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, orgId);

    expect(lessons.status).toBe(200);
    expect(lessons.body.total).toBe(1);
    expect(lessons.body.lessons[0]).toMatchObject({
      count: 2,
      lesson: "Validate worker health before declaring rollback complete.",
    });

    const failurePatterns = await request(app)
      .get("/api/experience/failure-patterns?query=rollback&limit=10")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, orgId);

    expect(failurePatterns.status).toBe(200);
    expect(failurePatterns.body.total).toBe(1);
    expect(failurePatterns.body.patterns[0]).toMatchObject({
      count: 2,
      antiPattern: "Skipping rollback health validation.",
    });

    const rootCauses = await request(app)
      .get("/api/experience/root-causes?query=rollback&limit=10")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, orgId);

    expect(rootCauses.status).toBe(200);
    expect(rootCauses.body.total).toBe(1);
    expect(rootCauses.body.rootCauses[0]).toMatchObject({
      count: 2,
      rootCause: "Rollback skipped worker health validation.",
    });

    const similar = await request(app)
      .get(`/api/experience/similar?experienceId=${experienceOneId}&limit=10`)
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, orgId);

    expect(similar.status).toBe(200);
    expect(similar.body.experienceId).toBe(experienceOneId);
    expect(similar.body.total).toBe(2);
    expect(similar.body.results[0]).toMatchObject({
      repository: "sunil/payment",
    });

    const recommendations = await request(app)
      .get("/api/experience/recommendations?query=rollback&limit=10")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, orgId);

    expect(recommendations.status).toBe(200);
    expect(recommendations.body.total).toBeGreaterThan(0);
    expect(recommendations.body.recommendations[0]).toMatchObject({
      type: expect.any(String),
      confidence: expect.any(Number),
    });
  });

  it("keeps retrieved experiences isolated by organization", async () => {
    const alphaWorkspaceId = verificationScopeKey(userId, orgId);
    const betaWorkspaceId = verificationScopeKey(userId, "org_experience_phase2_beta");

    await prisma.experienceRecord.create({
      data: {
        id: `exp-${randomUUID().slice(0, 8)}-a`,
        workspaceId: alphaWorkspaceId,
        outcomeId: `outcome-${randomUUID().slice(0, 8)}-a`,
        title: "Alpha root cause",
        summary: "Alpha only",
        lesson: "Alpha lesson",
        proof: {
          repository: "sunil/alpha",
          pullRequestNumber: 7,
          verdict: "FAIL",
          rootCause: "Alpha root cause",
          antiPattern: "Alpha anti-pattern",
          lesson: "Alpha lesson",
          files: ["alpha.ts"],
          language: "TypeScript",
          framework: "Node.js",
        },
        confidence: 80,
        status: "captured",
      },
    });

    await prisma.experienceRecord.create({
      data: {
        id: `exp-${randomUUID().slice(0, 8)}-b`,
        workspaceId: betaWorkspaceId,
        outcomeId: `outcome-${randomUUID().slice(0, 8)}-b`,
        title: "Beta root cause",
        summary: "Beta only",
        lesson: "Beta lesson",
        proof: {
          repository: "sunil/beta",
          pullRequestNumber: 9,
          verdict: "FAIL",
          rootCause: "Beta root cause",
          antiPattern: "Beta anti-pattern",
          lesson: "Beta lesson",
          files: ["beta.ts"],
          language: "TypeScript",
          framework: "Node.js",
        },
        confidence: 81,
        status: "captured",
      },
    });

    const alpha = await request(app)
      .get("/api/experience/search?query=root&limit=10")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, orgId);

    const beta = await request(app)
      .get("/api/experience/search?query=root&limit=10")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_experience_phase2_beta");

    expect(alpha.status).toBe(200);
    expect(beta.status).toBe(200);
    expect(alpha.body.total).toBe(1);
    expect(beta.body.total).toBe(1);
    expect(alpha.body.results[0].repository).toBe("sunil/alpha");
    expect(beta.body.results[0].repository).toBe("sunil/beta");
  });
});
