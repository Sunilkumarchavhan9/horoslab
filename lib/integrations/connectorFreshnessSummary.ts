import { connectorUserFilter, resolveRequestOrgId } from "../auth/orgScope";
import { prisma } from "../storage/prismaClient";
import { hasPrismaConnectorDatasourceUrl } from "../storage/prismaErrorUtils";
import {
  buildConnectorFreshness,
  type ConnectorFreshnessLabel,
  type ConnectorFreshnessSnapshot,
} from "./connectorFreshness";
import { listConnectorSyncLogs } from "./syncLogStore";

function getConnectorConfig(value: string | null | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export type ConnectorFreshnessCounts = {
  total: number;
  fresh: number;
  stale: number;
  error: number;
  syncing: number;
  offline: number;
  /** Share of monitored (non-offline) connectors that are fresh. */
  freshPercent: number | null;
  /** Mean sync lag (seconds) across connectors with a known last sync. */
  avgLagSeconds: number | null;
};

function emptyCounts(): ConnectorFreshnessCounts {
  return {
    total: 0,
    fresh: 0,
    stale: 0,
    error: 0,
    syncing: 0,
    offline: 0,
    freshPercent: null,
    avgLagSeconds: null,
  };
}

function averageLagSeconds(snapshots: ConnectorFreshnessSnapshot[]): number | null {
  const lags = snapshots
    .map((snapshot) => snapshot.freshnessLagSeconds)
    .filter((value): value is number => value !== null && Number.isFinite(value));
  if (lags.length === 0) return null;
  return Math.round(lags.reduce((sum, value) => sum + value, 0) / lags.length);
}

export function summarizeConnectorFreshnessSnapshots(
  snapshots: ConnectorFreshnessSnapshot[],
): ConnectorFreshnessCounts {
  return {
    ...summarizeConnectorFreshnessLabels(snapshots.map((snapshot) => snapshot.freshness)),
    avgLagSeconds: averageLagSeconds(snapshots),
  };
}

export function summarizeConnectorFreshnessLabels(
  labels: ConnectorFreshnessLabel[],
): ConnectorFreshnessCounts {
  const counts = emptyCounts();
  counts.total = labels.length;
  for (const label of labels) {
    if (label === "fresh") counts.fresh += 1;
    else if (label === "stale") counts.stale += 1;
    else if (label === "error") counts.error += 1;
    else if (label === "syncing") counts.syncing += 1;
    else counts.offline += 1;
  }
  const monitored = counts.fresh + counts.stale + counts.error + counts.syncing;
  counts.freshPercent = monitored > 0 ? Math.round((counts.fresh / monitored) * 1000) / 10 : null;
  counts.avgLagSeconds = null;
  return counts;
}

/** Build freshness snapshots for a user's connectors (same rules as GET /api/connector/health). */
export async function listConnectorFreshnessSnapshotsForUser(
  userId: string,
  orgId?: string,
): Promise<ConnectorFreshnessSnapshot[]> {
  if (!hasPrismaConnectorDatasourceUrl()) {
    return [];
  }
  const scopedOrgId = resolveRequestOrgId(orgId);
  const connectors = await prisma.connector.findMany({
    where: connectorUserFilter({ userId, orgId: scopedOrgId }),
  });
  const visibleConnectors = connectors.filter((connector) => connector.type !== "notion");
  const recentSyncLogs = await listConnectorSyncLogs(userId, scopedOrgId);
  const lastErrorByType = new Map<string, string>();
  for (const log of recentSyncLogs) {
    if (log.status !== "error" || lastErrorByType.has(log.type)) continue;
    if (log.message?.trim()) {
      lastErrorByType.set(log.type, log.message.trim());
    }
  }

  return visibleConnectors.map((connector) => {
    const config = getConnectorConfig(connector.configJson);
    const lastSyncAt =
      typeof connector.lastSyncAt === "string" && connector.lastSyncAt.length > 0
        ? connector.lastSyncAt
        : null;
    return buildConnectorFreshness({
      type: connector.type,
      status: connector.status,
      lastSyncAt,
      recordCount:
        typeof connector.recordCount === "number" && Number.isFinite(connector.recordCount)
          ? connector.recordCount
          : 0,
      lastFailureReason:
        typeof config.lastFailureReason === "string" ? config.lastFailureReason : null,
      lastFailureAt: typeof config.lastFailureAt === "string" ? config.lastFailureAt : null,
      lastSyncLogError: lastErrorByType.get(connector.type) ?? null,
    });
  });
}

/** Build freshness labels for a user's connectors (same rules as GET /api/connector/health). */
export async function listConnectorFreshnessLabelsForUser(userId: string): Promise<ConnectorFreshnessLabel[]> {
  const snapshots = await listConnectorFreshnessSnapshotsForUser(userId);
  return snapshots.map((snapshot) => snapshot.freshness);
}

export async function getConnectorFreshnessCountsForUser(
  userId: string,
): Promise<ConnectorFreshnessCounts> {
  try {
    const snapshots = await listConnectorFreshnessSnapshotsForUser(userId);
    return summarizeConnectorFreshnessSnapshots(snapshots);
  } catch {
    return emptyCounts();
  }
}
