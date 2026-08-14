import { describe, expect, it } from "vitest";
import request from "supertest";
import { prisma } from "../lib/storage/prismaClient";
import { createMemoryOsApp } from "../server/app";
import { makeToken } from "./helpers/authToken";

describe("Phase D live recovery runtime gate", () => {
  it("persists real checkpoint, policy, and escalation behavior through the API", async () => {
    const databaseUrl = process.env.DATABASE_URL ?? "";
    if (!/_test(?:\b|_)/i.test(databaseUrl) && !/testdb/i.test(databaseUrl)) {
      throw new Error("Refusing to run the live recovery gate against a shared development database.");
    }

    const userId = `phase-d-live-${Date.now()}`;
    const token = await makeToken(userId);
    const workspace = await prisma.workspace.create({
      data: { userId, ownerId: userId, name: `Phase D Live ${Date.now()}`, plan: "Free", region: "us" },
    });
    const app = createMemoryOsApp();
    const auth = { authorization: `Bearer ${token}` };

    const institution = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/institutions`)
      .set(auth)
      .send({ name: "Phase D Live Institution", summary: "Real recovery gate" });
    expect(institution.status).toBe(201);

    const mission = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/missions`)
      .set(auth)
      .send({ institutionId: institution.body.data.institution.id, title: "Phase D live mission", objective: "Exercise governed recovery routes." });
    expect(mission.status).toBe(201);
    const missionId = mission.body.data.mission.id as string;

    const worker = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/workers`)
      .set(auth)
      .send({ kind: "ai_agent", name: "Phase D live worker", capabilities: ["tools", "checkpoints"], maxConcurrency: 1 });
    expect(worker.status).toBe(201);
    const workerId = worker.body.data.worker.id as string;

    const session = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/agents/sessions`)
      .set(auth)
      .send({ missionId, workerId, framework: "custom_worker" });
    expect(session.status).toBe(201);
    const sessionId = session.body.data.session.id as string;

    const deniedTool = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/agents/sessions/${sessionId}/tool-calls/authorize`)
      .set(auth)
      .send({ id: "tool-live-denied", tool: "shell.execute", permissions: ["tool.shell.execute"], blockedTools: ["shell.execute"], approvalGranted: true });
    expect(deniedTool.status).toBe(200);
    expect(deniedTool.body.data.decision.policy.decision).toBe("deny");

    const checkpoint = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/agents/sessions/${sessionId}/checkpoint`)
      .set(auth)
      .send({ state: { step: "execute", attempt: 1 }, toolCallIds: ["tool-live-1"] });
    expect(checkpoint.status).toBe(200);

    const resumed = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/agents/sessions/${sessionId}/resume`)
      .set(auth)
      .send({});
    expect(resumed.status).toBe(200);
    expect(resumed.body.data.state).toEqual({ step: "execute", attempt: 1 });

    const escalation = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/missions/${missionId}/recovery-escalations`)
      .set(auth)
      .send({ reason: "provider fallback requires operator approval", payload: { action: "fallback_provider", source: "phase-d-live" } });
    expect(escalation.status).toBe(201);
    const escalationId = escalation.body.data.escalation.id as string;

    const listed = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/recovery-escalations?missionId=${missionId}`)
      .set(auth);
    expect(listed.status).toBe(200);
    expect(listed.body.data.escalations.map((item: { id: string }) => item.id)).toContain(escalationId);

    const resolved = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/recovery-escalations/${escalationId}/resolve`)
      .set(auth)
      .send({ resolution: "Operator approved fallback after reviewing evidence." });
    expect(resolved.status).toBe(200);
    expect(resolved.body.data.resolved).toBe(true);
  }, 20_000);
});
