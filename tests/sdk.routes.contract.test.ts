import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../lib/storage/prismaClient";
import { createMemoryOsApp } from "../server/app";
import { makeToken } from "./helpers/authToken";
import { resetPrismaRuntimeDataStores } from "./helpers/resetDataDir";

const app = createMemoryOsApp();

async function seedWorkspace(userId: string) {
  return prisma.workspace.create({
    data: {
      userId,
      ownerId: userId,
      name: `SDK Workspace ${userId}`,
      plan: "Free",
      region: "us",
    },
  });
}

describe("SDK backend routes", () => {
  beforeEach(async () => {
    await resetPrismaRuntimeDataStores();
    await prisma.webhookDelivery.deleteMany();
    await prisma.webhookEndpoint.deleteMany();
    await prisma.agentAccessEvent.deleteMany();
    await prisma.agentToken.deleteMany();
    await prisma.agentAccessKey.deleteMany();
    await prisma.workspace.deleteMany();
  });

  it("returns SDK stats, versions, methods, and releases", async () => {
    const userId = "sdk-backend";
    const token = await makeToken(userId);
    const workspace = await seedWorkspace(userId);

    const stats = await request(app)
      .get(`/api/sdk/stats?workspaceId=${workspace.id}`)
      .set("authorization", `Bearer ${token}`);

    expect(stats.status).toBe(200);
    expect(stats.body.ok).toBe(true);
    expect(stats.body.data.workspaceId).toBe(workspace.id);
    expect(stats.body.data.sdk).toEqual(expect.objectContaining({
      sdkVersion: expect.any(String),
      sdkDownloads: expect.any(Number),
      activeSdkClients: expect.any(Number),
    }));
    expect(Array.isArray(stats.body.data.versions)).toBe(true);
    expect(Array.isArray(stats.body.data.methods)).toBe(true);
    expect(Array.isArray(stats.body.data.releases)).toBe(true);

    const versions = await request(app)
      .get(`/api/sdk/versions?workspaceId=${workspace.id}`)
      .set("authorization", `Bearer ${token}`);

    expect(versions.status).toBe(200);
    expect(versions.body.data.versions).toEqual(expect.arrayContaining([
      expect.objectContaining({ packageName: "@epochtm/sdk" }),
      expect.objectContaining({ packageName: "@epochtm/api" }),
      expect.objectContaining({ packageName: "@epochtm/mcp" }),
    ]));

    const methods = await request(app)
      .get(`/api/sdk/methods?workspaceId=${workspace.id}`)
      .set("authorization", `Bearer ${token}`);

    expect(methods.status).toBe(200);
    expect(Array.isArray(methods.body.data.methods)).toBe(true);

    const releases = await request(app)
      .get(`/api/sdk/releases?workspaceId=${workspace.id}`)
      .set("authorization", `Bearer ${token}`);

    expect(releases.status).toBe(200);
    expect(releases.body.data.releases).toEqual(expect.arrayContaining([
      expect.objectContaining({ packageName: "@epochtm/sdk", channel: "latest" }),
    ]));
  });
});
