import { normalizeOrgId, resolveRequestOrgId } from "../auth/orgScope";
import { getConnectorFreshnessCountsForUser } from "../integrations/connectorFreshnessSummary";
import { listContinuityThreads } from "../continuity/continuityThreadStore";
import { getRecentMemories } from "../memory/recentMemoryStore";
import {
  getRuntimeStoreBackend,
  type RuntimeStoreBackend,
} from "../storage/runtimeStoreBackend";
import { getCompanyBrainStoreBackend } from "./platformStore";
import { getQueueBackendInfo, type QueueBackendMode } from "./queueBackend";
import { countExecutionProposalStats } from "./executionProposalStore";
import { getTrustBenchmarkMetrics, type TrustBenchmarkMetrics } from "./trustBenchmarkMetrics";
import { getLastTrustGateRun, type LastTrustGateRun } from "./trustGateStatus";
import { getOperationalArtifact } from "../operational/artifactStore";

export type CompanyBrainKpis = {
  generatedAt: string;
  orgId: string | null;
  connectorFreshness: Awaited<ReturnType<typeof getConnectorFreshnessCountsForUser>>;
  execution: {
    last7d: {
      pending: number;
      approved: number;
      executed: number;
      failed: number;
      rejected: number;
    };
    allTime: {
      pending: number;
      approved: number;
      executed: number;
      failed: number;
      rejected: number;
    };
    pendingApprovals: number;
    /** Executed / (executed + failed) for terminal outcomes in the last 7 days. */
    successRatePercent: number | null;
    /** Same ratio across all terminal execution proposals. */
    approvalToSuccessRatePercent: number | null;
  };
  continuity: {
    activeThreads: number;
    totalThreads: number;
    avgCheckpointsPerThread: number | null;
  };
  retrieval: {
    precisionPercent: number | null;
    benchmarkGeneratedAt: string | null;
    source: TrustBenchmarkMetrics["source"];
    evalScript: TrustBenchmarkMetrics["evalScript"];
  };
  resume: {
    successRatePercent: number | null;
    benchmarkGeneratedAt: string | null;
    source: TrustBenchmarkMetrics["source"];
    evalScript: TrustBenchmarkMetrics["evalScript"];
  };
  memory: {
    recentCount: number;
  };
  phase1: {
    weeklyActiveTeamsTarget: number;
    /** Observed from real continuity activity in the last 7 days. */
    weeklyActiveTeamsObserved: number;
    activeWorkspaces7d: number;
    continuityActions7d: number;
    source: "continuity_threads_7d";
    lastGate: {
      status: "pass" | "fail" | "missing";
      generatedAt: string | null;
      failedChecks: number | null;
      totalChecks: number | null;
      reportPath: string;
    };
  };
  ops: {
    queueBackendMode: QueueBackendMode;
    platformStoreBackend: ReturnType<typeof getCompanyBrainStoreBackend>;
    runtimeStoreBackend: RuntimeStoreBackend;
  };
  lastGateRun: LastTrustGateRun;
};

function terminalSuccessRatePercent(executed: number, failed: number): number | null {
  const terminal = executed + failed;
  if (terminal <= 0) return null;
  return Math.round((executed / terminal) * 1000) / 10;
}

async function readLastPhase1GateStatus(): Promise<{
  status: "pass" | "fail" | "missing";
  generatedAt: string | null;
  failedChecks: number | null;
  totalChecks: number | null;
  reportPath: string;
}> {
  const reportPath = "operational_artifacts:phase_gate/phase1-e2e-gate";
  const artifact = await getOperationalArtifact<{
    generatedAt?: string;
    summary?: { failed?: number; total?: number };
  }>({
    kind: "phase_gate",
    name: "phase1-e2e-gate",
  });

  if (artifact?.data) {
    const failed = Number(artifact.data.summary?.failed ?? 0);
    const total = Number(artifact.data.summary?.total ?? 0);
    return {
      status: failed > 0 ? "fail" : "pass",
      generatedAt:
        typeof artifact.data.generatedAt === "string" ? artifact.data.generatedAt : null,
      failedChecks: Number.isFinite(failed) ? failed : null,
      totalChecks: Number.isFinite(total) ? total : null,
      reportPath,
    };
  }
  return {
    status: "missing",
    generatedAt: null,
    failedChecks: null,
    totalChecks: null,
    reportPath,
  };
}

function isWithinLastDays(iso: string | undefined, days: number): boolean {
  if (!iso) return false;
  const at = Date.parse(iso);
  if (!Number.isFinite(at)) return false;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return at >= cutoff;
}

export async function getCompanyBrainKpis(input: {
  userId: string;
  orgId?: string;
}): Promise<CompanyBrainKpis> {
  const scopedOrgId = resolveRequestOrgId(input.orgId);
  const orgId = normalizeOrgId(scopedOrgId) ?? null;

  const [connectorFreshness, executionStats, activeThreads, allThreads, recentMemories, trustBenchmark] =
    await Promise.all([
      getConnectorFreshnessCountsForUser(input.userId),
      countExecutionProposalStats(input.userId, scopedOrgId),
      listContinuityThreads({
        userId: input.userId,
        orgId: scopedOrgId,
        status: "active",
      }),
      listContinuityThreads({
        userId: input.userId,
        orgId: scopedOrgId,
      }),
      getRecentMemories(input.userId, scopedOrgId),
      getTrustBenchmarkMetrics(),
    ]);

  const checkpointTotals = activeThreads.reduce(
    (sum, thread) => sum + (Array.isArray(thread.checkpoints) ? thread.checkpoints.length : 0),
    0,
  );
  const avgCheckpointsPerThread =
    activeThreads.length > 0
      ? Math.round((checkpointTotals / activeThreads.length) * 10) / 10
      : null;
  const recentThreads = allThreads.filter((thread) => isWithinLastDays(thread.updatedAt, 7));
  const activeWorkspaces7d = new Set(
    recentThreads
      .map((thread) => thread.workspace?.trim().toLowerCase())
      .filter((workspace): workspace is string => Boolean(workspace)),
  ).size;
  const continuityActions7d = recentThreads.reduce((sum, thread) => {
    const retrievalCount = Array.isArray(thread.retrievals)
      ? thread.retrievals.filter((retrieval) => isWithinLastDays(retrieval.createdAt, 7)).length
      : 0;
    const checkpointCount = Array.isArray(thread.checkpoints)
      ? thread.checkpoints.filter((checkpoint) => isWithinLastDays(checkpoint.createdAt, 7)).length
      : 0;
    const handoffCount = Array.isArray(thread.handoffs)
      ? thread.handoffs.filter((handoff) => isWithinLastDays(handoff.timestamp, 7)).length
      : 0;
    return sum + retrievalCount + checkpointCount + handoffCount;
  }, 0);
  const weeklyActiveTeamsObserved = Math.max(activeWorkspaces7d, continuityActions7d > 0 ? 1 : 0);
  const lastPhase1Gate = await readLastPhase1GateStatus();
  const lastGateRun = await getLastTrustGateRun();

  return {
    generatedAt: new Date().toISOString(),
    orgId,
    connectorFreshness,
    execution: {
      last7d: executionStats.last7d,
      allTime: executionStats.allTime,
      pendingApprovals: executionStats.pendingApprovals,
      successRatePercent: terminalSuccessRatePercent(
        executionStats.last7d.executed,
        executionStats.last7d.failed,
      ),
      approvalToSuccessRatePercent: terminalSuccessRatePercent(
        executionStats.allTime.executed,
        executionStats.allTime.failed,
      ),
    },
    continuity: {
      activeThreads: activeThreads.length,
      totalThreads: allThreads.length,
      avgCheckpointsPerThread,
    },
    retrieval: {
      precisionPercent: trustBenchmark.retrievalPrecisionPercent,
      benchmarkGeneratedAt: trustBenchmark.generatedAt,
      source: trustBenchmark.source,
      evalScript: trustBenchmark.evalScript,
    },
    resume: {
      successRatePercent: trustBenchmark.resumeSuccessRatePercent,
      benchmarkGeneratedAt: trustBenchmark.generatedAt,
      source: trustBenchmark.source,
      evalScript: trustBenchmark.evalScript,
    },
    memory: {
      recentCount: recentMemories.length,
    },
    phase1: {
      weeklyActiveTeamsTarget: 10,
      weeklyActiveTeamsObserved,
      activeWorkspaces7d,
      continuityActions7d,
      source: "continuity_threads_7d",
      lastGate: lastPhase1Gate,
    },
    ops: {
      queueBackendMode: getQueueBackendInfo().mode,
      platformStoreBackend: getCompanyBrainStoreBackend(),
      runtimeStoreBackend: getRuntimeStoreBackend(),
    },
    lastGateRun,
  };
}
