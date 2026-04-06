import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createMemoryOsApp } from "../server/app";

describe("Metrics Route Contract", () => {
  const originalToken = process.env.METRICS_TOKEN;

  afterEach(() => {
    process.env.METRICS_TOKEN = originalToken;
  });

  it("returns prometheus metrics text when token is not configured", async () => {
    delete process.env.METRICS_TOKEN;
    const app = createMemoryOsApp();

    const res = await request(app).get("/api/metrics");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/plain");
    expect(res.text).toContain("memoryos_http_requests_total");
  });

  it("returns 401 when metrics token is configured but missing from request", async () => {
    process.env.METRICS_TOKEN = "metrics-secret-token";
    const app = createMemoryOsApp();

    const res = await request(app).get("/api/metrics");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });
});

