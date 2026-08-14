import { describe, expect, it } from "vitest";
import { authorizeEpochEnterpriseAction, buildEpochAuditExport, decideEpochRetention, governEpochBudget } from "../lib/epoch/enterpriseControls";

describe("Phase J enterprise controls", () => {
  it("enforces role, workspace, and project boundaries", () => {
    expect(authorizeEpochEnterpriseAction({ role: "operator", action: "mission.execute", subjectWorkspaceId: "w1", requestWorkspaceId: "w1" }).allowed).toBe(true);
    expect(authorizeEpochEnterpriseAction({ role: "operator", action: "policy.manage", subjectWorkspaceId: "w1", requestWorkspaceId: "w1" }).allowed).toBe(false);
    expect(authorizeEpochEnterpriseAction({ role: "admin", action: "evidence.read", subjectWorkspaceId: "w1", requestWorkspaceId: "w2" }).reason).toBe("workspace_scope_mismatch");
  });

  it("respects legal holds and budget limits", () => {
    expect(decideEpochRetention({ expiresAt: "2020-01-01T00:00:00.000Z", legalHold: true }).retained).toBe(true);
    expect(decideEpochRetention({ expiresAt: "2020-01-01T00:00:00.000Z", legalHold: false }).retained).toBe(false);
    expect(governEpochBudget({ budgetCents: 100, spentCents: 80, requestedCents: 20 }).allowed).toBe(true);
    expect(governEpochBudget({ budgetCents: 100, spentCents: 80, requestedCents: 21 }).reason).toBe("budget_would_be_exceeded");
  });

  it("produces a versioned immutable audit export", () => {
    expect(buildEpochAuditExport({ workspaceId: "w1", records: [] })).toMatchObject({ version: "epoch.audit-export.v1", workspaceId: "w1", immutable: true });
  });
});
