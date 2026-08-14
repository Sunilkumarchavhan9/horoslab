import "dotenv/config";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../lib/storage/prismaClient";
import { createMemoryOsApp } from "../server/app";
import { runEpochWorkerTick } from "../lib/epoch/epochWorker";
import { makeToken } from "./helpers/authToken";

const app = createMemoryOsApp();

describe("authenticated Epoch mission HTTP flow", () => {
  let workspaceId = "";

  afterEach(async () => {
    if (workspaceId) {
      await prisma.workspace.delete({ where: { id: workspaceId } }).catch(() => undefined);
      workspaceId = "";
    }
  });

  it("runs an authenticated mission from API creation through evidence and verification", async () => {
    if (!process.env.EPOCH_OPENROUTER_AI_API_KEY) {
      throw new Error("EPOCH_OPENROUTER_AI_API_KEY_missing_for_integration_test");
    }

    process.env.EPOCH_WORKER_AI_ENABLED = "true";
    process.env.EPOCH_WORKER_AI_PROVIDER = "openrouter";
    process.env.EPOCH_WORKER_AI_MODEL = "openrouter/free";

    const userId = `u_epoch_http_${Date.now()}`;
    const token = await makeToken(userId);
    const workspace = await prisma.workspace.create({
      data: {
        userId,
        ownerId: userId,
        name: "Authenticated Epoch HTTP Integration",
        plan: "Free",
        region: "us",
      },
    });
    workspaceId = workspace.id;

    const institution = await prisma.epochInstitution.create({
      data: {
        workspaceId,
        userId,
        name: "Authenticated HTTP Institution",
        summary: "Mission integration proof",
      },
    });

    const missionResponse = await request(app)
      .post(`/api/epoch/workspaces/${workspaceId}/missions`)
      .set("authorization", `Bearer ${token}`)
      .send({
        institutionId: institution.id,
        title: "Authenticated worker mission",
        objective: "Return a concise verified result",
        plan: ["execute", "verify"],
        acceptanceCriteria: ["Worker returned output"],
        authority: {
          name: "Authenticated HTTP approval policy",
          canExecute: true,
          needsApproval: true,
          blocked: false,
          permissions: ["mission.execute", "evidence.write", "mission.verify"],
          budgets: {},
          approvals: ["human"],
          checks: [],
        },
      });

    expect(missionResponse.status).toBe(201);
    const missionId = missionResponse.body.data.mission.id as string;

    const queueResponse = await request(app)
      .post(`/api/epoch/workspaces/${workspaceId}/missions/${missionId}/queue`)
      .set("authorization", `Bearer ${token}`)
      .send({
        type: "execute",
        payload: {
          humanApproval: "approved",
          checklist: ["Worker returned output"],
          confidence: 95,
          approvals: ["authenticated_http_test"],
        },
      });

    expect(queueResponse.status).toBe(201);
    expect(queueResponse.body.data.job.missionId).toBe(missionId);

    for (let attempt = 0; attempt < 20; attempt += 1) {
      await runEpochWorkerTick();
      const progress = await prisma.epochMission.findUnique({ where: { id: missionId }, select: { state: true } });
      if (progress?.state === "completed" || progress?.state === "failed") break;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    const controlResponse = await request(app)
      .get(`/api/epoch/workspaces/${workspaceId}/missions/${missionId}/control`)
      .set("authorization", `Bearer ${token}`);

    expect(controlResponse.status).toBe(200);
    const control = controlResponse.body.data.control;
    expect(control.mission.id).toBe(missionId);
    expect(control.mission.state).toBe("completed");
    expect(control.execution.executor).toMatchObject({
      status: "completed",
      provider: "openrouter",
      model: "openrouter/free",
    });
    expect(control.evidence.some((item: { kind: string }) => item.kind === "ai_output")).toBe(true);
    expect(control.verification).not.toBeNull();

    const stored = await prisma.epochMission.findUnique({
      where: { id: missionId },
      include: { memoryRecord: true, executionRun: true, evidence: true, verificationRun: true },
    });
    expect(stored?.state).toBe("completed");
    expect(stored?.executionRun?.executor).toMatchObject({
      status: "completed",
      provider: "openrouter",
      model: "openrouter/free",
    });
    expect(stored?.evidence.some((item) => item.kind === "ai_output")).toBe(true);
    expect(stored?.verificationRun).not.toBeNull();
    expect(stored?.memoryRecord).not.toBeNull();
  }, 120_000);
});
