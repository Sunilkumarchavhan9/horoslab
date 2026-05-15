import { describe, expect, it } from "vitest";
import request from "supertest";
import { createMemoryOsApp } from "../server/app";

describe("API Versioning Contract", () => {
  const app = createMemoryOsApp();

  it("supports versioned health endpoint", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body?.status).toBe("ok");
    expect(res.body?.companyBrain).toMatchObject({
      activeSchedulers: expect.any(Number),
      bootstrappedUsers: expect.any(Number),
      queueBackendMode: expect.stringMatching(/^(file|redis)$/),
      staleWorkers: expect.any(Number),
      totalUsers: expect.any(Number),
      usersWithEnabledSources: expect.any(Number),
    });
  });

  it("adds compatibility headers on legacy memory routes", async () => {
    const res = await request(app).get("/api/memory/list");

    expect(res.status).toBe(401);
    expect(res.headers["x-api-version"]).toBe("1");
    expect(res.headers.deprecation).toBe("true");
  });

  it("adds version header on versioned memory routes", async () => {
    const res = await request(app).get("/api/v1/memory/list");

    expect(res.status).toBe(401);
    expect(res.headers["x-api-version"]).toBe("1");
  });
});
