import { describe, expect, it } from "vitest";
import request from "supertest";
import { createMemoryOsApp } from "../server/app";

describe("API Versioning Contract", () => {
  const app = createMemoryOsApp();

  it("supports versioned health endpoint", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
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

