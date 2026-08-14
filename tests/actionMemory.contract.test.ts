import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { existsSync, unlinkSync } from "fs";
import path from "path";
import { afterEach } from "vitest";
import { MEMORYOS_ORG_ID_HEADER } from "../lib/auth/orgScope";
import { makeToken } from "./helpers/authToken";
import { createMemoryOsApp } from "../server/app";
import { listActionMemories } from "../lib/memory/actionMemoryStore";
import { TestMemoryStoreAdapter } from "./helpers/testMemoryStoreAdapter";
import { resetMemoryStoreAdapter, setMemoryStoreAdapter } from "../lib/adapters/registry";

const ACTION_MEMORY_STORE_PATH = path.join(process.cwd(), "data", "action-memory.json");

describe("Action memory contract", () => {
  const app = createMemoryOsApp();
  const authUserId = "u_action_memory_contract";
  let authHeader = "";

  beforeEach(async () => {
    authHeader = `Bearer ${await makeToken(authUserId)}`;
    process.env.MEMORY_STORE_PROVIDER = "prisma";
    setMemoryStoreAdapter(new TestMemoryStoreAdapter());
    if (existsSync(ACTION_MEMORY_STORE_PATH)) {
      unlinkSync(ACTION_MEMORY_STORE_PATH);
    }
  });

  afterEach(() => {
    resetMemoryStoreAdapter();
  });

  it("creates manual action memory via POST /api/memory/action-memory", async () => {
    const res = await request(app)
      .post("/api/memory/action-memory")
      .set("authorization", authHeader)
      .send({
        action: "manual:test_action",
        reason: "Contract test create",
        outcome: "success",
        filesChanged: ["lib/example.ts"],
        sourceType: "manual",
      });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.actionMemory.action).toBe("manual:test_action");
    expect(res.body.data.actionMemory.outcome).toBe("success");
    expect(res.body.data.actionMemory.filesChanged).toEqual(["lib/example.ts"]);
  });

  it("lists action history via GET /api/memory/action-history", async () => {
    await request(app)
      .post("/api/memory/action-memory")
      .set("authorization", authHeader)
      .send({
        action: "manual:list_test",
        reason: "List contract test",
      });

    const res = await request(app)
      .get("/api/memory/action-history?limit=10")
      .set("authorization", authHeader);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.count).toBeGreaterThanOrEqual(1);
    expect(
      res.body.data.actions.some(
        (entry: { action: string }) => entry.action === "manual:list_test",
      ),
    ).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.items.length).toBe(res.body.data.count);
    expect(res.body.data.items[0]).toMatchObject({
      actionMemory: expect.objectContaining({ action: expect.any(String) }),
      approvalTraces: expect.any(Array),
    });
  });

  it("does not return action memories from another org for the same user", async () => {
    const createRes = await request(app)
      .post("/api/memory/action-memory")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_action_alpha")
      .send({
        action: "github:issue_comment",
        reason: "Org alpha execution",
        sourceType: "github_execution",
        sourceId: "cb_exec_alpha_001",
      });

    expect(createRes.status).toBe(201);
    const actionId = createRes.body.data.actionMemory.id as string;

    const crossOrgList = await request(app)
      .get("/api/memory/action-history")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_action_beta");

    expect(crossOrgList.status).toBe(200);
    expect(
      crossOrgList.body.data.actions.some((entry: { id: string }) => entry.id === actionId),
    ).toBe(false);

    const sameOrgList = await request(app)
      .get("/api/memory/action-history")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_action_alpha");

    expect(sameOrgList.status).toBe(200);
    expect(
      sameOrgList.body.data.actions.some((entry: { id: string }) => entry.id === actionId),
    ).toBe(true);

    const storeScoped = await listActionMemories(authUserId, { orgId: "org_action_alpha" });
    expect(storeScoped.some((entry) => entry.id === actionId)).toBe(true);
    const otherOrgScoped = await listActionMemories(authUserId, { orgId: "org_action_beta" });
    expect(otherOrgScoped.some((entry) => entry.id === actionId)).toBe(false);
  });

  it("returns 400 for invalid action-history limit", async () => {
    const res = await request(app)
      .get("/api/memory/action-history?limit=0")
      .set("authorization", authHeader);

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});
