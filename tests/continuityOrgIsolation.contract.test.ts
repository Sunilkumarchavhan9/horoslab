import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { MEMORYOS_ORG_ID_HEADER } from "../lib/auth/orgScope";
import { makeToken } from "./helpers/authToken";
import { createMemoryOsApp } from "../server/app";

describe("Continuity org isolation", () => {
  const app = createMemoryOsApp();
  const authUserId = "u_auth_org_isolation";
  let authHeader = "";

  beforeEach(async () => {
    authHeader = `Bearer ${await makeToken(authUserId)}`;
  });

  it("does not return threads from another org for the same user", async () => {
    const createRes = await request(app)
      .post("/api/runtime/threads")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_alpha")
      .send({
        title: "Org Alpha Thread",
        workspace: "default",
        project: "memoryos",
      });

    expect(createRes.status).toBe(201);
    const threadId = createRes.body.data.thread.id as string;

    const crossOrgGet = await request(app)
      .get(`/api/runtime/threads/${threadId}`)
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_beta");

    expect(crossOrgGet.status).toBe(404);

    const sameOrgGet = await request(app)
      .get(`/api/runtime/threads/${threadId}`)
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_alpha");

    expect(sameOrgGet.status).toBe(200);
    expect(sameOrgGet.body.data.thread.id).toBe(threadId);

    const crossOrgList = await request(app)
      .get("/api/runtime/threads?project=memoryos")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_beta");

    expect(crossOrgList.status).toBe(200);
    expect(
      crossOrgList.body.data.threads.some((thread: { id: string }) => thread.id === threadId),
    ).toBe(false);
  });
});
