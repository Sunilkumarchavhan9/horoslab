import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { makeToken } from "./helpers/authToken";
import { createMemoryOsApp } from "../server/app";

describe("Memory requests route contract", () => {
  const app = createMemoryOsApp();
  const authUserId = "u_requests_contract";
  let authHeader = "";

  beforeEach(async () => {
    authHeader = `Bearer ${await makeToken(authUserId)}`;
  });

  it("returns 400 for invalid limit", async () => {
    const res = await request(app)
      .get("/api/memory/requests?limit=0")
      .set("authorization", authHeader);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Invalid query");
    expect(res.body).toHaveProperty("details.limit");
  });

  it("returns 400 for invalid status", async () => {
    const res = await request(app)
      .get("/api/memory/requests?status=bad")
      .set("authorization", authHeader);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Invalid query");
    expect(res.body).toHaveProperty("details.status");
  });

  it("accepts case-insensitive status filter and returns normalized filters", async () => {
    await request(app)
      .post("/api/memory/retrieve")
      .set("authorization", authHeader)
      .send({ question: "test memory requests status filter" });

    const res = await request(app)
      .get("/api/memory/requests?status=success&range=7d&limit=5")
      .set("authorization", authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("requests");
    expect(res.body).toHaveProperty("count");
    expect(res.body).toHaveProperty("filters.status", "Success");
    expect(res.body).toHaveProperty("filters.range", "7d");
    expect(res.body).toHaveProperty("filters.limit", 5);
  });
});

