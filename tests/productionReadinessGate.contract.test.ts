import request from "supertest";
import { describe, expect, it } from "vitest";
import { createMemoryOsApp } from "../server/app";
import { makeToken } from "./helpers/authToken";

describe("Production Readiness gate", () => {
  const app = createMemoryOsApp();

  it("returns live deploy readiness for Phase 1 through Phase 7 local MVP", async () => {
    const userId = `u_production_readiness_${Date.now()}`;
    const jwt = `Bearer ${await makeToken(userId)}`;

    const response = await request(app)
      .post("/api/memory/production-readiness/run-gate")
      .set("authorization", jwt)
      .send({
        project: "memoryos",
        workspace: "test",
        agentId: "codex",
        task: "Verify local production readiness gate contract for Phase 1 through Phase 7 MVP.",
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(expect.objectContaining({
      generatedAt: expect.any(String),
      status: expect.stringMatching(/ready|partial|blocked/),
      ready: expect.any(Boolean),
      passed: expect.any(Number),
      total: 8,
      phases: expect.any(Array),
      deploymentBlockers: expect.any(Array),
      requiredBeforeDeploy: expect.any(Array),
      next: expect.any(String),
      accessLayer: expect.objectContaining({
        compatibilityReady: expect.any(Boolean),
        compatibilityStatus: expect.stringMatching(/ready|partial|blocked/),
        apiStandardPackageRequestCount: expect.any(Number),
        mcpStandardPackageRequestCount: expect.any(Number),
      }),
      agentAccessCompatibility: expect.objectContaining({
        version: "agent_access_compatibility.v1",
        ready: expect.any(Boolean),
        status: expect.stringMatching(/ready|partial|blocked/),
        checks: expect.arrayContaining([
          expect.objectContaining({ id: "api_standard_package", ok: expect.any(Boolean) }),
          expect.objectContaining({ id: "mcp_standard_package", ok: expect.any(Boolean) }),
          expect.objectContaining({ id: "package_version", ok: expect.any(Boolean) }),
        ]),
        summary: expect.objectContaining({
          apiStandardPackageRequestCount: expect.any(Number),
          mcpStandardPackageRequestCount: expect.any(Number),
        }),
      }),
      memoryIgnitionRuntime: expect.objectContaining({
        version: "memoryignition_runtime_timeline.v1",
        status: expect.stringMatching(/ready|partial|blocked/),
        ready: expect.any(Boolean),
        totalEvents: expect.any(Number),
        completedRequiredMoments: expect.any(Number),
        requiredMomentCount: 6,
        moments: expect.objectContaining({
          before_agent: expect.any(Number),
          before_action: expect.any(Number),
          during_action: expect.any(Number),
          risk_check: expect.any(Number),
          send_now: expect.any(Number),
          after_agent: expect.any(Number),
        }),
        items: expect.any(Array),
        next: expect.any(String),
      }),
    }));
    expect(response.body.data.agentAccessCompatibility.summary).toHaveProperty("standardPackageVersion");
    expect(response.body.data.phases.map((phase: { id: string }) => phase.id)).toEqual([
      "phase1",
      "phase2",
      "phase2_5",
      "phase3",
      "phase4",
      "phase5",
      "phase6",
      "phase7",
    ]);
    expect(response.body.data.phases).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "phase1",
        title: expect.any(String),
        status: expect.stringMatching(/ready|partial|blocked/),
        metrics: expect.any(Object),
        proof: expect.any(Array),
        blockers: expect.any(Array),
      }),
      expect.objectContaining({
        id: "phase5",
        metrics: expect.objectContaining({
          runtimeTimelineReady: expect.any(Boolean),
          completedRuntimeMoments: expect.any(Number),
          requiredRuntimeMoments: 6,
        }),
      }),
      expect.objectContaining({
        id: "phase3",
        metrics: expect.objectContaining({
          traceProofItems: expect.any(Number),
          readyPrompt: expect.any(Boolean),
        }),
      }),
    ]));
  }, 15000);
});
