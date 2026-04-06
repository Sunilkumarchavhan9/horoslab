import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createMemoryOsApp } from "../server/app";
import { makeToken } from "./helpers/authToken";
import { resetRuntimeDataStores } from "./helpers/resetDataDir";

describe("Memory System Health E2E", () => {
  const app = createMemoryOsApp();

  beforeEach(() => {
    resetRuntimeDataStores();
  });

  it("returns ok status with all checks true after app boot", async () => {
    const token = await makeToken("u_system_health_e2e");

    const res = await request(app)
      .get("/api/memory/system/health")
      .set("authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.checks.storesIntegrity).toBe(true);
    expect(res.body.checks.retrievalConfigLoaded).toBe(true);
    expect(res.body.checks.baselineReportPresent).toBe(true);
  });
});
