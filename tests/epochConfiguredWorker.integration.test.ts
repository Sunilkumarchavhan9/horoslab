import "dotenv/config";
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../lib/storage/prismaClient";
import { enqueueEpochJob } from "../lib/epoch/epochQueue";
import { runEpochWorkerTick } from "../lib/epoch/epochWorker";

describe("configured AI worker database integration", () => {
  let workspaceId = "";
  let missionId = "";

  afterEach(async () => {
    if (workspaceId) await prisma.workspace.delete({ where: { id: workspaceId } }).catch(() => undefined);
    workspaceId = "";
    missionId = "";
  });

  it("runs one mission through configured OpenRouter worker execution", async () => {
    if (!process.env.EPOCH_OPENROUTER_AI_API_KEY) throw new Error("EPOCH_OPENROUTER_AI_API_KEY_missing_for_integration_test");
    process.env.EPOCH_WORKER_AI_ENABLED = "true";
    process.env.EPOCH_WORKER_AI_PROVIDER = "openrouter";
    process.env.EPOCH_WORKER_AI_MODEL = "openrouter/free";
    const userId = `u_configured_worker_${Date.now()}`;
    const workspace = await prisma.workspace.create({ data: { userId, ownerId: userId, name: "Configured Worker Integration", plan: "Free", region: "us" } });
    workspaceId = workspace.id;
    const institution = await prisma.epochInstitution.create({ data: { workspaceId, userId, name: "Configured Worker Institution", summary: "Local configured worker proof" } });
    const mission = await prisma.epochMission.create({ data: { workspaceId, institutionId: institution.id, userId, title: "Configured worker proof", objective: "Return a concise verified result", plan: ["execute", "verify"], state: "draft" } });
    missionId = mission.id;
    await enqueueEpochJob({ workspaceId, institutionId: institution.id, missionId, userId, type: "execute", payload: { humanApproval: "approved", checklist: ["Worker returned output"], confidence: 95, approvals: ["worker"] } });
    await runEpochWorkerTick();
    const stored = await prisma.epochMission.findUnique({ where: { id: missionId }, include: { executionRun: true, evidence: true, verificationRun: true, certificate: true, memoryRecord: true } });
    expect(stored?.executionRun?.executor).toMatchObject({ status: "completed", provider: "openrouter", model: "openrouter/free" });
    expect(stored?.evidence.some((item) => item.kind === "ai_output")).toBe(true);
    expect(stored?.verificationRun).not.toBeNull();
  }, 120_000);
});
