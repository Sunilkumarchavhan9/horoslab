import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "crypto";
import request from "supertest";
import { makeToken } from "./helpers/authToken";
import { createMemoryOsApp } from "../server/app";
import { TestMemoryStoreAdapter } from "./helpers/testMemoryStoreAdapter";
import { resetMemoryStoreAdapter, setMemoryStoreAdapter } from "../lib/adapters/registry";
import { MEMORYOS_ORG_ID_HEADER } from "../lib/auth/orgScope";
import { selectApprovedExecutableSkills } from "../lib/companyBrain/skillGraph";

describe("Company Brain Phase 4 Skill Graph contract", () => {
  const app = createMemoryOsApp();
  let userId = "u_company_brain_skill_contract";
  let authHeader = "";

  beforeEach(async () => {
    userId = `u_company_brain_skill_contract_${randomUUID().slice(0, 8)}`;
    process.env.MEMORY_STORE_PROVIDER = "prisma";
    setMemoryStoreAdapter(new TestMemoryStoreAdapter());
    authHeader = `Bearer ${await makeToken(userId)}`;
  });

  afterEach(() => {
    resetMemoryStoreAdapter();
  });

  it("generates pending skill candidates from evidence-backed experience and supports approval", async () => {
    const project = "phase4-skill-project";
    await request(app)
      .post("/api/memory/company-brain/experience/capture")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_skill_alpha")
      .send({
        workspace: "Skill Workspace",
        project,
        sourceType: "codex",
        sourceRef: "run:onboarding-email-safe-fix",
        task: "Fix onboarding email failure handling.",
        problem: "Welcome email failure was coupled to signup success.",
        context: "A prior agent run showed signup should succeed even when email retry is needed.",
        action: "Separated user creation from welcome email delivery and logged retry evidence.",
        outcome: "Signup remains successful and email failure is retried asynchronously.",
        lesson: "Do not rollback user creation because a non-critical welcome email failed.",
        futureAgentInstruction: "When touching onboarding email logic, test signup success and email failure separately.",
        evidence: ["codex:run:onboarding-email-safe-fix", "test:onboarding-email"],
        files: ["app/api/onboarding/route.ts", "lib/email.ts"],
        tests: ["npm test -- onboarding-email"],
        riskLevel: "medium",
      });

    const generate = await request(app)
      .post("/api/memory/company-brain/skills/candidates/generate")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_skill_alpha")
      .send({ project });

    expect(generate.status).toBe(200);
    expect(generate.body.generatedCount).toBe(1);
    expect(generate.body.pendingCount).toBe(1);
    expect(generate.body.approvedCount).toBe(0);
    expect(generate.body.candidates[0]).toMatchObject({
      name: expect.stringContaining("Fix onboarding email"),
      status: "pending",
      trigger: "Fix onboarding email failure handling.",
      requiredTests: expect.arrayContaining(["npm test -- onboarding-email"]),
      supportedAgents: expect.arrayContaining(["codex", "devin"]),
      traceProof: expect.objectContaining({
        sourceType: "experience",
      }),
    });

    const candidateId = generate.body.candidates[0].id as string;
    const approve = await request(app)
      .post(`/api/memory/company-brain/skills/${candidateId}/review`)
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_skill_alpha")
      .send({ decision: "approve", note: "Evidence is sufficient for future-agent inheritance." });

    expect(approve.status).toBe(200);
    expect(approve.body.candidate).toMatchObject({
      id: candidateId,
      status: "approved",
      sourceExperienceId: expect.any(String),
    });

    const overview = await request(app)
      .get(`/api/memory/company-brain/skills/overview?project=${project}`)
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_skill_alpha");

    expect(overview.status).toBe(200);
    expect(overview.body.totalCandidates).toBe(1);
    expect(overview.body.approvedCount).toBe(1);
    expect(overview.body.approvedSkills[0]).toMatchObject({
      id: candidateId,
      status: "approved",
      sourceExperienceId: expect.any(String),
      inheritanceRules: expect.arrayContaining([
        expect.stringContaining("Do not inject until a human approves"),
      ]),
    });

    const selected = await selectApprovedExecutableSkills({
      userId,
      orgId: "org_skill_alpha",
      project,
      taskIntent: "Fix onboarding email failure handling.",
      agentId: "codex",
    });

    expect(selected.skills).toHaveLength(1);
    expect(selected.skills[0]).toMatchObject({
      id: candidateId,
      status: "approved",
      required_tests: ["npm test -- onboarding-email"],
      source_experience_id: expect.any(String),
    });
    expect(selected.traceProof[0]).toMatchObject({
      memoryId: candidateId,
      sourceType: "approved_skill",
      sourceRef: expect.stringContaining("skill_candidate:experience:"),
    });

    const ignition = await request(app)
      .post("/api/memory/memoryignition/before-agent")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_skill_alpha")
      .send({
        project,
        question: "Prepare Codex for onboarding email work.",
        task_intent: "Fix onboarding email failure handling.",
        agent_id: "codex",
        mode: "retrieve",
      });

    expect(ignition.status).toBe(200);
    expect(ignition.body.data.executable_skills).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: candidateId,
        status: "approved",
        required_tests: ["npm test -- onboarding-email"],
      }),
    ]));
    expect(ignition.body.data.required_tests).toEqual(expect.arrayContaining([
      "npm test -- onboarding-email",
    ]));
    expect(ignition.body.data.trace_proof).toEqual(expect.arrayContaining([
      expect.objectContaining({
        memory_id: candidateId,
        source_type: "approved_skill",
        contract_category: "runbook",
      }),
    ]));
    expect(ignition.body.data.outcome_hooks).toEqual(expect.arrayContaining([
      expect.stringContaining("memoryignition_save_outcome"),
    ]));
    expect(ignition.body.data.brief_proof_quality).toEqual(expect.objectContaining({
      score: expect.any(Number),
      grade: expect.stringMatching(/A|B|C|D/),
      status: expect.stringMatching(/trusted|caution|weak|blocked/),
      checks: expect.arrayContaining([
        expect.objectContaining({ id: "trace_proof" }),
        expect.objectContaining({ id: "approved_skills", ok: true }),
        expect.objectContaining({ id: "required_tests", ok: true }),
      ]),
    }));
    expect(ignition.body.data.evaluation_gate).toEqual(expect.objectContaining({
      status: expect.stringMatching(/trusted|caution|weak|blocked/),
      can_inherit: expect.any(Boolean),
      can_execute: expect.any(Boolean),
      requires_human_review: expect.any(Boolean),
      next_required_actions: expect.any(Array),
    }));

    const riskCheck = await request(app)
      .post("/api/memory/memoryignition/risk-check")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_skill_alpha")
      .send({
        project,
        question: "Check gate before onboarding email work.",
        task_intent: "Fix onboarding email failure handling.",
        agent_id: "codex",
        mode: "retrieve",
      });

    expect(riskCheck.status).toBe(200);
    expect(riskCheck.body.data.evaluation_gate).toEqual(expect.objectContaining({
      can_execute: expect.any(Boolean),
      status: expect.stringMatching(/trusted|caution|weak|blocked/),
    }));
    expect(riskCheck.body.data.allowed).toBe(riskCheck.body.data.evaluation_gate.can_execute);

    const traceProof = await request(app)
      .get(`/api/memory/memory/${candidateId}/trace-proof`)
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_skill_alpha");

    expect(traceProof.status).toBe(200);
    expect(traceProof.body.data).toEqual(expect.objectContaining({
      memoryId: candidateId,
      summary: expect.stringContaining("Skill Candidate"),
      contractCategory: "runbook",
      sourceRef: expect.stringContaining("skill_candidate:experience:"),
      proofComplete: true,
      lineage: expect.stringContaining("Source -> Memory"),
    }));
    expect(traceProof.body.data.traceProof).toEqual(expect.objectContaining({
      sourceType: "experience",
      sourceRef: "experience:codex:run:onboarding-email-safe-fix",
      evidence: expect.arrayContaining(["codex:run:onboarding-email-safe-fix"]),
    }));

    const outcome = await request(app)
      .post("/api/memory/memoryignition/outcome-learn")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_skill_alpha")
      .send({
        threadId: "thread-skill-success-1",
        repo_or_task: project,
        task_intent: "Fix onboarding email failure handling.",
        outcome: "Agent used the approved workflow and tests passed.",
        outcome_status: "success",
        files_touched: ["app/api/onboarding/route.ts"],
        used_skill_ids: [candidateId],
        agent_id: "codex",
      });

    expect(outcome.status).toBe(200);
    expect(outcome.body.data.skill_outcomes).toEqual([
      expect.objectContaining({
        skill_id: candidateId,
        status: "success",
        success_rate: 100,
      }),
    ]);

    const learnedOverview = await request(app)
      .get(`/api/memory/company-brain/skills/overview?project=${project}`)
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_skill_alpha");

    expect(learnedOverview.status).toBe(200);
    expect(learnedOverview.body.outcomeCount).toBe(1);
    expect(learnedOverview.body.averageSuccessRate).toBe(100);
    expect(learnedOverview.body.approvedSkills[0]).toMatchObject({
      id: candidateId,
      successRate: 100,
      outcomeCount: 1,
      successCount: 1,
      failureCount: 0,
    });
  });

  it("keeps generated skill candidates isolated by organization", async () => {
    const project = "phase4-skill-isolation";
    await request(app)
      .post("/api/memory/company-brain/experience/capture")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_skill_alpha")
      .send({
        project,
        sourceType: "github",
        sourceRef: "pull/112",
        task: "Patch deploy rollback validation.",
        problem: "Rollback skipped worker health checks.",
        context: "Incident review confirmed workers must be checked after rollback.",
        action: "Added worker health validation steps.",
        outcome: "Rollback runbook now validates service health.",
        lesson: "Future agents must validate worker health before marking rollback complete.",
        futureAgentInstruction: "Run worker health checks after rollback and attach evidence.",
        evidence: ["github:pull/112"],
        tests: ["npm run test:workers"],
      });

    const alphaGenerate = await request(app)
      .post("/api/memory/company-brain/skills/candidates/generate")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_skill_alpha")
      .send({ project });
    const candidateId = alphaGenerate.body.candidates[0].id as string;

    const betaOverview = await request(app)
      .get(`/api/memory/company-brain/skills/overview?project=${project}`)
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_skill_beta");

    expect(betaOverview.status).toBe(200);
    expect(betaOverview.body.totalCandidates).toBe(0);

    const betaReview = await request(app)
      .post(`/api/memory/company-brain/skills/${candidateId}/review`)
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_skill_beta")
      .send({ decision: "approve" });

    expect(betaReview.status).toBe(404);

    const betaSelected = await selectApprovedExecutableSkills({
      userId,
      orgId: "org_skill_beta",
      project,
      taskIntent: "Patch deploy rollback validation.",
      agentId: "codex",
    });

    expect(betaSelected.skills).toHaveLength(0);
  });
});
