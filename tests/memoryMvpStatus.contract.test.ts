import { describe, expect, it } from "vitest";
import request from "supertest";
import { createMemoryOsApp } from "../server/app";
import { makeToken } from "./helpers/authToken";

describe("Memory MVP Status Route Contract", () => {
  const app = createMemoryOsApp();

  it("returns 401 when auth header is missing", async () => {
    const res = await request(app).get("/api/memory/mvp/status");

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "Unauthorized");
  });

  it("returns 200 with expected mvp status payload keys", async () => {
    const token = await makeToken("u_mvp_status_contract");

    const res = await request(app)
      .get("/api/memory/mvp/status")
      .set("authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status");
    expect(res.body).toHaveProperty("checkedAt");
    expect(res.body).toHaveProperty("checks");
    expect(res.body).toHaveProperty("metrics");
    expect(res.body).toHaveProperty("completed");
    expect(res.body).toHaveProperty("pending");

    expect(res.body.checks).toHaveProperty("storesIntegrity");
    expect(res.body.checks).toHaveProperty("retrievalConfigLoaded");
    expect(res.body.checks).toHaveProperty("baselineReportPresent");
    expect(res.body.checks).toHaveProperty("evalPassRateAtLeast90");

    expect(res.body.metrics).toHaveProperty("evalPassRate");
    expect(res.body.metrics).toHaveProperty("totalEvalCases");

    expect(Array.isArray(res.body.completed)).toBe(true);
    expect(Array.isArray(res.body.pending)).toBe(true);
  });
});

