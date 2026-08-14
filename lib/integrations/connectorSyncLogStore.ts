import { connectorUserFilter, normalizeOrgId } from "../auth/orgScope";
import { prisma } from "../storage/prismaClient";

const MAX_STORED_LOGS = 200;
const MAX_LIST_LOGS = 50;

/** API / JSON file shape (unchanged for clients). */
export type ConnectorSyncLog = {
  id: string;
  userId: string;
  orgId?: string;
  type: string;
  status: "success" | "error";
  extractedCount: number;
  contractCounts?: Record<string, number>;
  message: string;
  at: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

function parseMetadata(raw: string | null | undefined): {
  message?: string;
  contractCounts?: Record<string, number>;
} {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as {
      message?: unknown;
      contractCounts?: unknown;
    };
    const contractCounts =
      parsed.contractCounts && typeof parsed.contractCounts === "object"
        ? (parsed.contractCounts as Record<string, number>)
        : undefined;
    const message = typeof parsed.message === "string" ? parsed.message : undefined;
    return { message, contractCounts };
  } catch {
    return {};
  }
}

function rowToApiLog(row: {
  id: string;
  userId: string;
  orgId: string | null;
  connectorType: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  itemsSynced: number;
  errorMessage: string | null;
  metadataJson: string | null;
}): ConnectorSyncLog {
  const meta = parseMetadata(row.metadataJson);
  const status = row.status === "error" ? "error" : "success";
  const message =
    row.errorMessage?.trim() ||
    meta.message?.trim() ||
    (status === "success" ? `Sync ${row.connectorType}` : "Sync failed");
  return {
    id: row.id,
    userId: row.userId,
    ...(row.orgId ? { orgId: row.orgId } : {}),
    type: row.connectorType,
    status,
    extractedCount: row.itemsSynced,
    ...(meta.contractCounts ? { contractCounts: meta.contractCounts } : {}),
    message,
    at: row.finishedAt ?? row.startedAt,
  };
}

function apiLogToRow(entry: ConnectorSyncLog): {
  id: string;
  userId: string;
  orgId: string | null;
  connectorType: string;
  status: string;
  startedAt: string;
  finishedAt: string;
  itemsSynced: number;
  errorMessage: string | null;
  metadataJson: string | null;
} {
  const at = entry.at || nowIso();
  const status = entry.status === "error" ? "error" : "success";
  const metadata: Record<string, unknown> = {};
  if (entry.contractCounts && Object.keys(entry.contractCounts).length > 0) {
    metadata.contractCounts = entry.contractCounts;
  }
  if (status === "success" && entry.message.trim()) {
    metadata.message = entry.message.trim();
  }
  return {
    id: entry.id,
    userId: entry.userId,
    orgId: normalizeOrgId(entry.orgId) ?? null,
    connectorType: entry.type,
    status,
    startedAt: at,
    finishedAt: at,
    itemsSynced: entry.extractedCount,
    errorMessage: status === "error" ? entry.message.trim() || "sync_failed" : null,
    metadataJson: Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
  };
}

async function appendPostgres(entry: ConnectorSyncLog): Promise<void> {
  const row = apiLogToRow(entry);
  await prisma.connectorSyncLog.create({
    data: row,
  });
  const scope = connectorUserFilter({ userId: entry.userId, orgId: entry.orgId });
  const excess = await prisma.connectorSyncLog.findMany({
    where: scope,
    orderBy: { startedAt: "desc" },
    skip: MAX_STORED_LOGS,
    select: { id: true },
  });
  if (excess.length > 0) {
    await prisma.connectorSyncLog.deleteMany({
      where: { id: { in: excess.map((row) => row.id) } },
    });
  }
}

async function listPostgres(userId: string, orgId?: string): Promise<ConnectorSyncLog[]> {
  const rows = await prisma.connectorSyncLog.findMany({
    where: connectorUserFilter({ userId, orgId }),
    orderBy: { startedAt: "desc" },
    take: MAX_LIST_LOGS,
  });
  return rows.map(rowToApiLog);
}

export async function appendConnectorSyncLog(
  entry: ConnectorSyncLog,
  orgId?: string,
): Promise<void> {
  const next: ConnectorSyncLog = {
    ...entry,
    orgId: normalizeOrgId(entry.orgId) ?? normalizeOrgId(orgId),
  };

  await appendPostgres(next);
}

export async function listConnectorSyncLogs(
  userId: string,
  orgId?: string,
): Promise<ConnectorSyncLog[]> {
  const scopedOrgId = normalizeOrgId(orgId);

  return listPostgres(userId, scopedOrgId);
}

export function getConnectorSyncLogStoreBackend(): "postgres" {
  return "postgres";
}
