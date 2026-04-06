import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createMemoryOsApp } from "../server/app";
import { makeToken } from "./helpers/authToken";
import { resetRuntimeDataStores } from "./helpers/resetDataDir";

describe("Memory MVP Status E2E", () => {
  const app = createMemoryOsApp();

  beforeEach(() => {
    resetRuntimeDataStores();
  });

  it("returns on_track when stores, retrieval config, and eval baseline are valid", async () => {
    const token = await makeToken("u_mvp_status_e2e");

    const res = await request(app)
      .get("/api/memory/mvp/status")
      .set("authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("on_track");
    expect(res.body.checks.storesIntegrity).toBe(true);
    expect(res.body.checks.retrievalConfigLoaded).toBe(true);
    expect(res.body.checks.baselineReportPresent).toBe(true);
    expect(res.body.checks.evalPassRateAtLeast90).toBe(true);
    expect(res.body.metrics.evalPassRate).toBeGreaterThanOrEqual(90);
    expect(res.body.metrics.totalEvalCases).toBeGreaterThan(0);
    expect((res.body.completed as unknown[]).length).toBeGreaterThan(0);
  });
});

