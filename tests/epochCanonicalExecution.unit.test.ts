import { describe, expect, it } from "vitest";
import { evaluateExecutionGuard, prepareCanonicalExecution } from "../lib/epoch/canonical";
import type { AuthorityGrant, Policy, StateSnapshot } from "../lib/epoch/canonical";

const now = new Date("2026-08-17T00:00:00.000Z");
const policy: Policy = {
  contractVersion: "epoch.canonical.v1", id: "policy-1", workspaceId: "workspace-1", createdAt: now.toISOString(), updatedAt: now.toISOString(), correlation: { correlationId: "c-1", traceId: "t-1" }, name: "Canary", scope: "mission", decision: "allow", permissions: ["deploy.canary"], restrictions: [],
};
const grant: AuthorityGrant = {
  contractVersion: "epoch.canonical.v1", id: "grant-1", workspaceId: "workspace-1", createdAt: now.toISOString(), updatedAt: now.toISOString(), correlation: { correlationId: "c-1", traceId: "t-1" }, policyId: "policy-1", grantedBy: "user-1", subjectId: "agent-1", actionTypes: ["deploy.canary"], resourceIds: ["service-1"], status: "active",
};
const state: StateSnapshot = {
  contractVersion: "epoch.canonical.v1", id: "state-1", workspaceId: "workspace-1", createdAt: now.toISOString(), updatedAt: now.toISOString(), correlation: { correlationId: "c-1", traceId: "t-1" }, environmentId: "env-1", version: 2, observedAt: now.toISOString(), facts: [], freshness: "fresh", integritySha256: "a".repeat(64),
};

describe("Epoch canonical execution guard", () => {
  it("allows only fresh, policy-permitted, authority-scoped actions", () => {
    expect(evaluateExecutionGuard({ action: "deploy.canary", targetResourceId: "service-1", policy, authority: grant, state, now })).toMatchObject({ status: "allowed" });
    expect(evaluateExecutionGuard({ action: "delete.production", targetResourceId: "service-1", policy, authority: grant, state, now }).status).toBe("blocked");
    expect(evaluateExecutionGuard({ action: "deploy.canary", targetResourceId: "other-service", policy, authority: grant, state, now }).reasons).toContain("authority grant does not cover this target");
  });

  it("blocks stale state and preserves human approval as a separate state", () => {
    expect(evaluateExecutionGuard({ action: "deploy.canary", targetResourceId: "service-1", policy, authority: grant, state: { ...state, freshness: "stale" }, now }).status).toBe("blocked");
    const approval = prepareCanonicalExecution({ workspaceId: "workspace-1", missionId: "mission-1", action: "deploy.canary", target: { resourceId: "service-1" }, authorityGrant: grant, policy: { ...policy, decision: "approval" }, state, correlationId: "c-1", traceId: "t-1", now });
    expect(approval.guard.status).toBe("approval_required");
    expect(approval.execution?.state).toBe("prepared");
  });
});
