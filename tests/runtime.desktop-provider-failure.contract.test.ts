import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { makeToken } from "./helpers/authToken";

const originalProvider = process.env.MEMORYOSTM_DESKTOP_PROVIDER;
const originalBaseUrl = process.env.MEMORYOSTM_DESKTOP_PROVIDER_BASE_URL;

describe("runtime desktop provider failure handling", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.MEMORYOSTM_DESKTOP_PROVIDER = "external";
    process.env.MEMORYOSTM_DESKTOP_PROVIDER_BASE_URL = "";
  });

  afterEach(() => {
    process.env.MEMORYOSTM_DESKTOP_PROVIDER = originalProvider;
    process.env.MEMORYOSTM_DESKTOP_PROVIDER_BASE_URL = originalBaseUrl;
  });

  it("returns 502 and surfaces provider error when external provider is misconfigured", async () => {
    const { createMemoryOsApp } = await import("../server/app");
    const app = createMemoryOsApp();
    const authHeader = `Bearer ${await makeToken("u_runtime_desktop_failure")}`;

    const createRes = await request(app)
      .post("/api/runtime/threads")
      .set("authorization", authHeader)
      .send({ title: "Desktop error thread", workspace: "default", project: "memoryos" });
    const threadId = createRes.body.data.thread.id as string;

    const startRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/desktop/start`)
      .set("authorization", authHeader)
      .send({ osType: "ubuntu" });
    expect(startRes.status).toBe(502);
    expect(startRes.body.error.code).toBe("DESKTOP_PROVIDER_UNAVAILABLE");

    const threadRes = await request(app)
      .get(`/api/runtime/threads/${threadId}`)
      .set("authorization", authHeader);
    expect(threadRes.status).toBe(200);
    expect(threadRes.body.data.thread.desktopSession.state).toBe("error");
    expect(threadRes.body.data.thread.desktopSession.runtimeMessage).toContain(
      "MEMORYOSTM_DESKTOP_PROVIDER_BASE_URL",
    );
  }, 15000);
});
