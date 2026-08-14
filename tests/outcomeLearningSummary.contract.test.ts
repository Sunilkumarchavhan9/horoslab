import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMemoryOsApp } from "../server/app";
import { TestMemoryStoreAdapter } from "./helpers/testMemoryStoreAdapter";
import { resetMemoryStoreAdapter, setMemoryStoreAdapter } from "../lib/adapters/registry";
import { makeToken } from "./helpers/authToken";

describe("MemoryIgnition outcome learning summary", () => {
  const app = createMemoryOsApp();

  beforeEach(() => {
    process.env.MEMORY_STORE_PROVIDER = "prisma";
    setMemoryStoreAdapter(new TestMemoryStoreAdapter());
  });

  afterEach(() => {
    resetMemoryStoreAdapter();
  });

  it("summarizes real outcome learning, skill updates, drift signals, and future inheritance readiness", async () => {
    const userId = `u_outcome_learning_${Date.now()}`;
    const authHeader = `Bearer ${await makeToken(userId)}`;

    const outcome = await request(app)
      .post("/api/memory/memoryignition/outcome")
      .set("authorization", authHeader)
      .send({
        repo_or_task: "memoryos",
        task_intent: "Patch approval-to-outcome runtime proof.",
        agent_id: "codex",
        outcome_status: "success",
        outcome: "Runtime proof chain shipped and tests passed.",
        files_touched: ["server/routes/memory.routes.ts"],
        tests_passed: ["npx tsc --noEmit"],
        tests_failed: ["npm run old-runtime-gate"],
        what_failed: "Old runtime page did not show outcome-linked approvals.",
        future_agent_lesson: "Future agents must verify outcome learning after approval-backed runtime work.",
        used_skill_ids: ["skill_runtime_proof"],
        send_event_id: "send_runtime_proof",
        target_agent: "codex",
        target_format: "codex_prompt",
      });

    expect(outcome.status).toBe(200);

    const summary = await request(app)
      .get("/api/memory/memoryignition/outcome-learning")
      .set("authorization", authHeader);

    expect(summary.status).toBe(200);
    expect(summary.body.data).toEqual(expect.objectContaining({
      version: "memoryignition_outcome_learning_summary.v1",
      status: "ready",
      ready: true,
      metrics: expect.objectContaining({
        outcomesRecorded: expect.any(Number),
        futureInheritanceReady: expect.any(Number),
        skillsImproved: 1,
        skillConfidenceUpdates: 1,
        driftReports: 1,
        repeatedBugsReduced: 1,
        agentSuccessAfterInheritance: 100,
      }),
      learningEvents: expect.arrayContaining([
        expect.objectContaining({
          type: "outcome_recorded",
          task: "Patch approval-to-outcome runtime proof.",
          lesson: "Future agents must verify outcome learning after approval-backed runtime work.",
          skills: ["skill_runtime_proof"],
          futureInheritanceReady: true,
          traceComplete: false,
        }),
      ]),
      skillImprovements: expect.arrayContaining([
        expect.objectContaining({
          skillId: "skill_runtime_proof",
          signal: "confidence_update_allowed",
          status: "ready_for_update",
        }),
      ]),
      driftReports: expect.arrayContaining([
        expect.objectContaining({
          report: "Old runtime page did not show outcome-linked approvals.",
          signal: "1 failed test(s)",
          status: "learning_recorded",
        }),
      ]),
      outcomeSignals: expect.arrayContaining([
        expect.objectContaining({
          label: "future_inheritance_ready",
          status: "ready",
          evidence: expect.arrayContaining([
            "test_passed:npx tsc --noEmit",
            "test_failed:npm run old-runtime-gate",
            "skill:skill_runtime_proof",
          ]),
        }),
      ]),
    }));
  }, 120000);
});
