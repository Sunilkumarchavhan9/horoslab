import { describe, expect, it } from "vitest";
import request from "supertest";
import { prisma } from "../lib/storage/prismaClient";
import { updateEpochExecutionCheckpoint } from "../lib/epoch/epochStore";
import { createMemoryOsApp } from "../server/app";
import { makeToken } from "./helpers/authToken";

describe("V12 authenticated mission release gate", () => {
  it("persists a worker lease and mission queue across an app restart", async () => {
    const databaseUrl = process.env.DATABASE_URL ?? "";
    if (!/_test(?:\b|_)/i.test(databaseUrl) && !/testdb/i.test(databaseUrl)) {
      throw new Error("Refusing to run the release-gate integration test against a shared development database. Set DATABASE_URL to an isolated test database.");
    }
    const userId = "v12-release-owner";
    const otherUserId = "v12-release-other";
    const token = await makeToken(userId);
    const otherToken = await makeToken(otherUserId);
    const workspace = await prisma.workspace.create({
      data: {
        userId,
        ownerId: userId,
        name: "V12 Release Gate Workspace",
        plan: "Free",
        region: "us",
      },
    });
    const institution = await prisma.epochInstitution.create({
      data: {
        workspaceId: workspace.id,
        userId,
        name: "Release Gate Institution",
        summary: "Database-backed authenticated mission test.",
      },
    });

    const firstApp = createMemoryOsApp();
    const missionResponse = await request(firstApp)
      .post(`/api/epoch/workspaces/${workspace.id}/missions`)
      .set("authorization", `Bearer ${token}`)
      .send({
        institutionId: institution.id,
        title: "Verify a production migration",
        objective: "Validate the migration and preserve proof after restart.",
        plan: ["prepare", "execute", "verify"],
        acceptanceCriteria: ["migration is applied", "verification evidence exists"],
      });

    expect(missionResponse.status).toBe(201);
    const missionId = missionResponse.body.data.mission.id as string;

    const workerResponse = await request(firstApp)
      .post(`/api/epoch/workspaces/${workspace.id}/workers`)
      .set("authorization", `Bearer ${token}`)
      .send({
        kind: "software",
        name: "release-gate-worker",
        capabilities: ["migration", "verification"],
        projectScope: { workspaceId: workspace.id },
        maxConcurrency: 1,
      });

    expect(workerResponse.status).toBe(201);
    const workerId = workerResponse.body.data.worker.id as string;

    const decoyMissionResponse = await request(firstApp)
      .post(`/api/epoch/workspaces/${workspace.id}/missions`)
      .set("authorization", `Bearer ${token}`)
      .send({
        institutionId: institution.id,
        title: "Decoy queued mission",
        objective: "Remain ahead of the targeted worker job.",
      });
    expect(decoyMissionResponse.status).toBe(201);
    const decoyMissionId = decoyMissionResponse.body.data.mission.id as string;
    const decoyEnqueueResponse = await request(firstApp)
      .post(`/api/epoch/workspaces/${workspace.id}/queue/enqueue`)
      .set("authorization", `Bearer ${token}`)
      .send({
        missionId: decoyMissionId,
        institutionId: institution.id,
        type: "execute",
        payload: { requiredCapabilities: ["migration"] },
      });
    expect(decoyEnqueueResponse.status).toBe(201);

    const enqueueResponse = await request(firstApp)
      .post(`/api/epoch/workspaces/${workspace.id}/queue/enqueue`)
      .set("authorization", `Bearer ${token}`)
      .send({
        missionId,
        institutionId: institution.id,
        type: "execute",
        payload: { requiredCapabilities: ["migration"] },
      });

    expect(enqueueResponse.status).toBe(201);
    const jobId = enqueueResponse.body.data.job.id as string;
    expect((await prisma.epochQueueJob.findUnique({ where: { id: jobId } }))?.status).toBe("queued");

    // A new app instance must recover the queue from PostgreSQL, not process memory.
    const restartedApp = createMemoryOsApp();
    const recoveredQueue = await request(restartedApp)
      .get(`/api/epoch/workspaces/${workspace.id}/queue?status=queued`)
      .set("authorization", `Bearer ${token}`);

    expect(recoveredQueue.status).toBe(200);
    expect(recoveredQueue.body.data.jobs.map((job: { id: string }) => job.id)).toContain(jobId);

    const leaseResponse = await request(restartedApp)
      .post(`/api/epoch/workspaces/${workspace.id}/queue/lease`)
      .set("authorization", `Bearer ${token}`)
      .send({ workerId, missionId, limit: 1, leaseMs: 60000 });

    expect(leaseResponse.status).toBe(200);
    expect(leaseResponse.body.data.jobs).toHaveLength(1);
    expect(leaseResponse.body.data.jobs[0].id).toBe(jobId);
    const fencingToken = leaseResponse.body.data.fencingTokens[jobId] as number;

    const leasedRow = await prisma.epochQueueJob.findUnique({ where: { id: jobId } });
    expect(leasedRow?.status).toBe("leased");
    expect(leasedRow?.leaseOwner).toBe(workerId);

    const checkpoint = await updateEpochExecutionCheckpoint({
      workspaceId: workspace.id,
      missionId,
      userId,
      stepId: "execute",
      status: "started",
    });
    expect(checkpoint?.currentStep).toBe("execute");

    const acknowledged = await request(restartedApp)
      .post(`/api/epoch/workspaces/${workspace.id}/queue/${jobId}/ack`)
      .set("authorization", `Bearer ${token}`)
      .send({ workerId, fencingToken });

    expect(acknowledged.status).toBe(200);
    expect(acknowledged.body.data.job.status).toBe("done");
    expect((await prisma.epochQueueJob.findUnique({ where: { id: jobId } }))?.status).toBe("done");

    const recoveredMission = await request(restartedApp)
      .get(`/api/epoch/workspaces/${workspace.id}/missions/${missionId}`)
      .set("authorization", `Bearer ${token}`);
    expect(recoveredMission.status).toBe(200);
    expect(recoveredMission.body.data.mission.proof.lastCheckpoint.stepId).toBe("execute");

    const foreignRead = await request(restartedApp)
      .get(`/api/epoch/workspaces/${workspace.id}/missions/${missionId}`)
      .set("authorization", `Bearer ${otherToken}`);
    expect(foreignRead.status).toBe(404);

    const foreignWorkspaceRead = await request(restartedApp)
      .get(`/api/epoch/workspaces/${workspace.id}/missions`)
      .set("authorization", `Bearer ${otherToken}`);
    expect(foreignWorkspaceRead.status).toBe(404);

  }, 15000);
});
