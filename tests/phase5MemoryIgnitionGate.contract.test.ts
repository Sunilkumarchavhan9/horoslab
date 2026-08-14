import request from "supertest";
import { describe, expect, it } from "vitest";
import { createMemoryOsApp } from "../server/app";
import { makeToken } from "./helpers/authToken";

describe("Phase 5 MemoryIgnition runtime gate", () => {
  const app = createMemoryOsApp();

  it("runs before-agent, risk-check, trace proof evaluation, and outcome learning from one backend gate", async () => {
    const userId = `u_phase5_gate_${Date.now()}`;
    const authHeader = `Bearer ${await makeToken(userId)}`;

    const gate = await request(app)
      .post("/api/memory/memoryignition/run-gate")
      .set("authorization", authHeader)
      .send({
        task: "Verify MemoryIgnition runtime before deployment.",
        project: "memoryos",
        repo_or_task: "memoryos",
        agent_id: "codex",
        risk_level: "medium",
      });

    expect(gate.status).toBe(200);
    expect(gate.body.data).toEqual(expect.objectContaining({
      generatedAt: expect.any(String),
      status: expect.stringMatching(/ready|partial|blocked/),
      ready: expect.any(Boolean),
      passed: expect.any(Number),
      total: 4,
      checks: expect.arrayContaining([
        expect.objectContaining({ id: "before_agent", label: "Before-agent brief" }),
        expect.objectContaining({ id: "risk_check", label: "Risk check" }),
        expect.objectContaining({ id: "trace_proof", label: "Trace proof" }),
        expect.objectContaining({ id: "outcome_learning", label: "Outcome learning" }),
      ]),
      risk: expect.objectContaining({
        approvalRequired: expect.any(Boolean),
        derivedRiskLevel: expect.any(String),
        requiredTestCount: expect.any(Number),
      }),
    }));
    expect(gate.body.data.passed).toBeGreaterThanOrEqual(3);
    expect(gate.body.data.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "before_agent", ok: true }),
      expect.objectContaining({ id: "risk_check", ok: true }),
      expect.objectContaining({ id: "outcome_learning", ok: true }),
    ]));
  });
});
