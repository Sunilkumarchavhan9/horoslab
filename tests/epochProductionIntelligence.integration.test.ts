import "dotenv/config";
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../lib/storage/prismaClient";
import { approvePersistedEpochFixProposal, listEpochProductionIntelligence, persistEpochFixProposal, persistEpochImprovementMetric, persistEpochReliabilityMetric, persistEpochReplayResult, persistEpochReplaySession } from "../lib/epoch/productionIntelligenceStore";
import { persistEpochProductionInteraction } from "../lib/epoch/latePhaseStore";

describe("Phase M persisted production intelligence", () => {
  let workspaceId = "";

  afterEach(async () => {
    if (workspaceId) {
      await prisma.workspace.delete({ where: { id: workspaceId } }).catch(() => undefined);
      workspaceId = "";
    }
  });

  it("persists production friction, clusters it, and creates reviewed-work inputs", async () => {
    const userId = `u_phase_m_${Date.now()}`;
    const workspace = await prisma.workspace.create({
      data: { userId, ownerId: userId, name: "Phase M persistence proof", plan: "Free", region: "us" },
    });
    workspaceId = workspace.id;
    const institution = await prisma.epochInstitution.create({
      data: { workspaceId, userId, name: "Phase M institution", summary: "Production intelligence proof" },
    });
    const mission = await prisma.epochMission.create({
      data: {
        workspaceId,
        institutionId: institution.id,
        userId,
        title: "Connect workspace",
        objective: "Connect a workspace without user confusion",
        plan: ["connect", "verify"],
      },
    });

    const interaction = await persistEpochProductionInteraction({
      id: `interaction_${Date.now()}`,
      workspaceId,
      missionId: mission.id,
      workerId: "worker-phase-m",
      input: "Connect my workspace",
      output: "Please try again",
      latencyMs: 1_250,
      toolFailures: 1,
      retries: 2,
      userFeedback: "negative",
      turns: 9,
      abandoned: true,
      repeatedQuestionCount: 3,
      setupStep: "connect_workspace",
      supportEscalated: true,
      conversionDropped: true,
      humanEdited: true,
    });

    const intelligence = await listEpochProductionIntelligence({ workspaceId, limit: 20 });
    expect(interaction.failureScore).toBeGreaterThan(70);
    expect(intelligence.interactions).toHaveLength(1);
    expect(intelligence.signals.some((signal) => signal.kind === "setup_friction")).toBe(true);
    expect(intelligence.signals.some((signal) => signal.kind === "conversion_dropoff")).toBe(true);
    expect(intelligence.clusters).toHaveLength(1);
    expect(intelligence.rootCauses[0]?.status).toBe("draft");
    expect(intelligence.evaluations[0]?.status).toBe("draft");
  }, 30_000);

  it("persists replay comparisons, reviewed-fix inputs, reliability, and improvement", async () => {
    const userId = `u_phase_m_loop_${Date.now()}`;
    const workspace = await prisma.workspace.create({
      data: { userId, ownerId: userId, name: "Phase M loop proof", plan: "Free", region: "us" },
    });
    workspaceId = workspace.id;
    const institution = await prisma.epochInstitution.create({
      data: { workspaceId, userId, name: "Phase M loop institution", summary: "Replay proof" },
    });
    const mission = await prisma.epochMission.create({
      data: { workspaceId, institutionId: institution.id, userId, title: "Replay mission", objective: "Replay a failed mission safely", plan: ["execute", "verify"] },
    });
    const clusterId = "cluster_phase_m_loop";
    const replay = await persistEpochReplaySession({
      id: "replay_phase_m_loop",
      workspaceId,
      missionId: mission.id,
      variant: { promptVersion: "candidate-2", policy: "bounded-retry" },
    });
    const replayResult = await persistEpochReplayResult({
      id: "replay_result_phase_m_loop",
      workspaceId,
      replaySessionId: replay.id,
      baseline: { score: 40, failureRate: 0.6 },
      candidate: { score: 90, failureRate: 0.1 },
    });
    const fix = await persistEpochFixProposal({
      id: "fix_phase_m_loop",
      workspaceId,
      clusterId,
      proposedBy: userId,
      kind: "recovery",
      proposal: "Use bounded retry policy from the replay candidate.",
      risk: "medium",
      rollback: "Restore the previous retry policy version.",
    });
    await expect(approvePersistedEpochFixProposal({ workspaceId, proposalId: fix.id, approverId: userId })).rejects.toThrow("separation_of_duties");
    const approvedFix = await approvePersistedEpochFixProposal({ workspaceId, proposalId: fix.id, approverId: "reviewer-phase-m" });
    const reliability = await persistEpochReliabilityMetric({
      id: "reliability_phase_m_loop",
      workspaceId,
      workerId: "worker-phase-m",
      windowStart: new Date("2026-01-01"),
      windowEnd: new Date("2026-01-02"),
      sampleSize: 10,
      successes: 9,
      failures: 1,
      recoveries: 1,
      humanInterventions: 1,
    });
    const improvement = await persistEpochImprovementMetric({
      id: "improvement_phase_m_loop",
      workspaceId,
      clusterId,
      baseline: { failureRate: 0.6 },
      after: { failureRate: 0.1 },
    });

    const intelligence = await listEpochProductionIntelligence({ workspaceId, limit: 20 });
    expect(replayResult.status).toBe("pass");
    expect(fix.status).toBe("draft");
    expect(approvedFix?.status).toBe("approved");
    expect(reliability.successRate).toBe(0.9);
    expect(improvement.verified).toBe(true);
    expect(intelligence.replays[0]?.status).toBe("completed");
    expect(intelligence.fixes[0]?.status).toBe("approved");
    expect(intelligence.reliability[0]?.sampleSize).toBe(10);
    expect(intelligence.improvements[0]?.verified).toBe(true);
  }, 30_000);
});
