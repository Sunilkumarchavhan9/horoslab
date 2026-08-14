import { describe, expect, it } from "vitest";
import { approveEpochCopilotDraft, assertEpochCopilotMayApply, createEpochCopilotDraft } from "../lib/epoch/copilotRuntime";
import { EpochPrivateMarketplace, signEpochMarketplaceManifest } from "../lib/epoch/marketplaceRuntime";
import { buildEpochFailureSignals, buildEpochRootCauseRecord, captureEpochProductionInteraction, clusterEpochProductionFailures, compareEpochReplay, createEpochFixProposal, createEpochRegressionDraft, createEpochReplaySession, computeEpochReliabilityMetric, redactEpochProductionText, verifyEpochImprovement } from "../lib/epoch/productionIntelligence";

describe("V12 late-phase backend contracts", () => {
  it("requires independent approval before a copilot draft can apply", () => {
    const draft = createEpochCopilotDraft({ id: "d1", workspaceId: "ws1", authorId: "user-1", kind: "operations", content: { action: "retry" } });
    expect(() => approveEpochCopilotDraft({ draft, workspaceId: "ws1", approverId: "user-1" })).toThrow("separation_of_duties");
    const approved = approveEpochCopilotDraft({ draft, workspaceId: "ws1", approverId: "user-2" });
    expect(() => assertEpochCopilotMayApply(approved)).not.toThrow();
  });

  it("publishes and revokes signed private marketplace assets", () => {
    const base = { id: "worker.example", version: "1.0.0", kind: "worker" as const, publisherId: "org-1", compatibleApi: "v1", permissions: ["tool.files.read"], contentHash: "sha256:asset" };
    const marketplace = new EpochPrivateMarketplace();
    const manifest = marketplace.publish({ ...base, signature: signEpochMarketplaceManifest(base, "secret"), status: "active" }, "secret");
    expect(manifest.status).toBe("active");
    expect(marketplace.revoke(base.id, base.version)?.status).toBe("revoked");
  });

  it("turns production failures into clusters and reviewable regression drafts", () => {
    const first = captureEpochProductionInteraction({ id: "i1", workspaceId: "ws1", missionId: "m1", workerId: "w1", input: "Create pull request", output: "wrong branch", latencyMs: 1200, toolFailures: 1, retries: 3, userFeedback: "negative", turns: 4, abandoned: false });
    const second = captureEpochProductionInteraction({ id: "i2", workspaceId: "ws1", missionId: "m2", workerId: "w1", input: "Create pull request", output: "wrong branch", latencyMs: 1300, toolFailures: 1, retries: 3, userFeedback: "negative", turns: 4, abandoned: false });
    const cluster = clusterEpochProductionFailures([first, second], "ws1")[0];
    expect(cluster.count).toBe(2);
    expect(createEpochRegressionDraft({ id: "r1", workspaceId: "ws1", clusterId: cluster.id, interaction: first, expected: "PR is created on the requested branch", verification: "PR branch matches acceptance criteria" }).status).toBe("draft");
  });

  it("detects product friction and conversion signals from production usage", () => {
    const interaction = captureEpochProductionInteraction({
      id: "i-friction",
      workspaceId: "ws1",
      missionId: "m-friction",
      input: "Connect my workspace",
      output: "Please try again",
      latencyMs: 1_200,
      toolFailures: 0,
      retries: 2,
      turns: 9,
      abandoned: true,
      repeatedQuestionCount: 3,
      setupStep: "connect_workspace",
      supportEscalated: true,
      conversionDropped: true,
      humanEdited: true,
    });

    expect(interaction.signals).toEqual(expect.arrayContaining([
      "repeated_question",
      "setup_friction",
      "support_escalation",
      "churn_risk",
      "conversion_dropoff",
      "human_edit",
    ]));
    expect(interaction.failureScore).toBeGreaterThan(70);
  });

  it("redacts credentials before production content is persisted", () => {
    const sanitized = redactEpochProductionText("Authorization: Bearer abc123 secret=top-secret api_key=sk-example-value");
    expect(sanitized).not.toContain("abc123");
    expect(sanitized).not.toContain("top-secret");
    expect(sanitized).not.toContain("sk-example-value");
    expect(sanitized).toContain("[REDACTED]");
  });

  it("completes the Phase M failure-to-improvement loop", () => {
    const interaction = captureEpochProductionInteraction({ id: "i3", workspaceId: "ws1", missionId: "m3", workerId: "w3", input: "Deploy change", output: "deployment failed", latencyMs: 12_000, toolFailures: 2, retries: 3, userFeedback: "negative", turns: 22, abandoned: true });
    const signals = buildEpochFailureSignals(interaction);
    const cluster = clusterEpochProductionFailures([interaction], "ws1")[0];
    const rootCause = buildEpochRootCauseRecord({ id: "rc1", workspaceId: "ws1", cluster, signals });
    const evaluation = createEpochRegressionDraft({ id: "eval1", workspaceId: "ws1", clusterId: cluster.id, interaction, expected: "Deployment succeeds", verification: "Deployment health checks pass" });
    const replay = createEpochReplaySession({ id: "replay1", workspaceId: "ws1", missionId: "m3", variant: { fix: "retry policy" } });
    const result = compareEpochReplay({ id: "result1", workspaceId: "ws1", replaySessionId: replay.id, baseline: { score: 20 }, candidate: { score: 90 } });
    const fix = createEpochFixProposal({ id: "fix1", workspaceId: "ws1", clusterId: cluster.id, kind: "recovery", proposal: "Add bounded deployment recovery", risk: "medium", rollback: "Restore prior recovery policy" });
    const reliability = computeEpochReliabilityMetric({ id: "rel1", workspaceId: "ws1", windowStart: new Date("2026-01-01"), windowEnd: new Date("2026-01-02"), sampleSize: 10, successes: 8, failures: 2, recoveries: 1, humanInterventions: 1 });
    const improvement = verifyEpochImprovement({ id: "imp1", workspaceId: "ws1", clusterId: cluster.id, baseline: { failureRate: 0.8 }, after: { failureRate: 0.1 } });
    expect({ signals: signals.length, rootCause: rootCause.status, evaluation: evaluation.status, replay: result.status, fix: fix.status, reliability: reliability.successRate, improvement: improvement.verified }).toEqual({ signals: 8, rootCause: "draft", evaluation: "draft", replay: "pass", fix: "draft", reliability: 0.8, improvement: true });
  });
});
