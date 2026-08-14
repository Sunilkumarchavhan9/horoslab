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
      name: `MCP Workspace ${userId}`,
      plan: "Free",
      region: "us",
    },
  });
}

describe("Epoch MCP status route", () => {
  beforeEach(async () => {
    await resetPrismaRuntimeDataStores();
    await prisma.webhookDelivery.deleteMany();
    await prisma.webhookEndpoint.deleteMany();
    await prisma.agentAccessEvent.deleteMany();
    await prisma.agentAccessKey.deleteMany();
    await prisma.workspace.deleteMany();
  });

  it("returns a workspace-scoped MCP snapshot", async () => {
    const userId = "epoch-mcp-status";
    const token = await makeToken(userId);
    const workspace = await seedWorkspace(userId);

    const response = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/developer/mcp/status`)
      .set("authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.data.workspaceId).toBe(workspace.id);
    expect(response.body.data.mcp).toEqual(expect.objectContaining({
      workspaceId: workspace.id,
      server: expect.objectContaining({
        transport: expect.any(String),
        version: expect.any(String),
        status: expect.any(String),
      }),
    }));
  });
});
