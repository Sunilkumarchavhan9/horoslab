import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createMemoryOsApp } from "../server/app";
import { makeToken } from "./helpers/authToken";
import { __resetRateLimitForTests } from "../server/middleware/rateLimit";

describe("Memory API safety contracts", () => {
  const app = createMemoryOsApp();

  beforeEach(() => {
    __resetRateLimitForTests();
  });

  it("adds x-request-id header on responses", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.headers["x-request-id"]).toBeTruthy();
    expect(typeof res.headers["x-request-id"]).toBe("string");
  });

  it("does not rate limit /api/health", async () => {
    for (let i = 0; i < 70; i += 1) {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
    }
  });

  it("rate limits /api/memory routes per user", async () => {
    const token = await makeToken("u_safety_limit");

    let lastStatus = 200;
    let lastHeaders: Record<string, string | string[] | undefined> = {};

    for (let i = 0; i < 61; i += 1) {
      const res = await request(app)
        .get("/api/memory/timeline")
        .set("authorization", `Bearer ${token}`);
      lastStatus = res.status;
      lastHeaders = res.headers;
    }

    expect(lastStatus).toBe(429);
    expect(lastHeaders["x-ratelimit-limit"]).toBeTruthy();
    expect(lastHeaders["x-ratelimit-remaining"]).toBeTruthy();
    expect(lastHeaders["x-ratelimit-reset"]).toBeTruthy();
    expect(lastHeaders["retry-after"]).toBeTruthy();

    const res = await request(app)
      .get("/api/memory/timeline")
      .set("authorization", `Bearer ${token}`);

    expect(res.status).toBe(429);
    expect(res.body).toHaveProperty("error", "Too many requests");
    expect(res.body).toHaveProperty("retryAfterSeconds");
    expect(typeof res.body.retryAfterSeconds).toBe("number");
  });
});
