import { describe, expect, it } from "vitest";
import { detectExecutionDrift } from "../lib/companyBrain/driftDetection";
import type { ExecutionProposal } from "../lib/companyBrain/executionTypes";
import type { OperationalLoop } from "../lib/companyBrain/operationalLoopTypes";

function buildLoop(overrides: Partial<OperationalLoop> = {}): OperationalLoop {
  return {
    id: "cb_loop_test",
    userId: "u_drift",
    goal: "Ship resume drift detection for MemoryOS continuity",
    currentState: "executing",
    linkedProposalIds: ["prop_1"],
    linkedActionMemoryIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {},
    ...overrides,
  };
}

function buildProposal(overrides: Partial<ExecutionProposal> = {}): ExecutionProposal {
  return {
    id: "prop_1",
    userId: "u_drift",
    adapter: "generic",
    actionType: "noop",
    payload: {},
    status: "pending",
    riskTier: "medium",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedByUserId: null,
    executedAt: null,
    rejectionReason: null,
    secondFactorVerified: false,
    result: null,
    error: null,
    ...overrides,
  };
}

describe("driftDetection.contract (P2.2)", () => {
  it("detects failed_execution when proposal failed", () => {
    const report = detectExecutionDrift({
      loop: buildLoop(),
      proposal: buildProposal({ status: "failed", error: "Adapter not implemented" }),
      executionOutcome: { status: "failed", resultSummary: "Adapter not implemented" },
    });
    expect(report?.driftType).toBe("failed_execution");
    expect(report?.severity).toBe("high");
    expect(report?.correctiveSteps.length).toBeGreaterThan(0);
  });

  it("detects scope_creep when files exceed the plan", () => {
    const report = detectExecutionDrift({
      loop: buildLoop({ currentState: "completed" }),
      proposal: buildProposal({
        status: "executed",
        payload: { filePath: "lib/companyBrain/driftDetection.ts" },
        result: { ok: true, detail: "done" },
      }),
      filesChanged: [
        "lib/companyBrain/driftDetection.ts",
        "lib/companyBrain/operationalLoopService.ts",
        "server/routes/companyBrain.routes.ts",
      ],
      executionOutcome: { status: "executed", resultSummary: "done" },
    });
    expect(report?.driftType).toBe("scope_creep");
  });

  it("detects goal_mismatch when outcome text diverges from loop goal", () => {
    const report = detectExecutionDrift({
      loop: buildLoop({
        goal: "Migrate billing database schema to Postgres 16",
        currentState: "completed",
      }),
      proposal: buildProposal({
        status: "executed",
        actionType: "marketing_email",
        result: { ok: true, detail: "Published holiday newsletter campaign" },
      }),
      executionOutcome: {
        status: "executed",
        goal: "marketing_email blast",
        resultSummary: "Published holiday newsletter campaign",
      },
    });
    expect(report?.driftType).toBe("goal_mismatch");
  });

  it("detects partial_completion when GitHub execution lacks external ref", () => {
    const report = detectExecutionDrift({
      loop: buildLoop({ currentState: "completed" }),
      proposal: buildProposal({
        status: "executed",
        adapter: "github",
        actionType: "pull_request",
        payload: { owner: "acme", repo: "app" },
        result: { ok: true, detail: "PR opened" },
      }),
      executionOutcome: {
        status: "executed",
        resultSummary: "PR opened",
        externalRef: null,
      },
    });
    expect(report?.driftType).toBe("partial_completion");
    expect(report?.severity).toBe("high");
  });

  it("detects stale_goal for long-running open loops", () => {
    const staleCreated = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const report = detectExecutionDrift({
      loop: buildLoop({
        currentState: "awaiting_approval",
        createdAt: staleCreated,
        updatedAt: staleCreated,
      }),
      proposal: buildProposal({ status: "pending" }),
      nowMs: Date.now(),
    });
    expect(report?.driftType).toBe("stale_goal");
  });

  it("returns null when executed outcome aligns with goal and plan", () => {
    const goal = "Add drift detection module for operational loops";
    const report = detectExecutionDrift({
      loop: buildLoop({ goal, currentState: "completed" }),
      proposal: buildProposal({
        status: "executed",
        adapter: "generic",
        actionType: "drift_check",
        payload: { filePath: "lib/companyBrain/driftDetection.ts" },
        result: { ok: true, detail: `Completed drift detection module for operational loops` },
      }),
      filesChanged: ["lib/companyBrain/driftDetection.ts"],
      executionOutcome: {
        status: "executed",
        goal: `generic drift_check`,
        resultSummary: "Completed drift detection module for operational loops",
      },
    });
    expect(report).toBeNull();
  });
});
