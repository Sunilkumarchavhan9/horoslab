import { describe, expect, it } from "vitest";
import request from "supertest";
import { createMemoryOsApp } from "../server/app";
import { makeToken } from "./helpers/authToken";

describe("Memory System Health Route Contract", () => {
  const app = createMemoryOsApp();

  it("returns 401 when auth header is missing", async () => {
    const res = await request(app).get("/api/memory/system/health");

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "Unauthorized");
  });

  it("returns 200 with expected health payload keys", async () => {
    const token = await makeToken("u_system_health_contract");

    const res = await request(app)
      .get("/api/memory/system/health")
      .set("authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status");
    expect(res.body).toHaveProperty("checkedAt");
    expect(res.body).toHaveProperty("checks");
    expect(res.body.checks).toHaveProperty("storesIntegrity");
    expect(res.body.checks).toHaveProperty("retrievalConfigLoaded");
    expect(res.body.checks).toHaveProperty("baselineReportPresent");
  });
});
