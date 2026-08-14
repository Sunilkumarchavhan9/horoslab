import { randomUUID } from "crypto";
import { existsSync, readdirSync, statSync, type Dirent } from "fs";
import path from "path";
import { orgRequestContext } from "../auth/orgScope";
import {
  canConsumeConnectorSyncRecords,
  consumeConnectorSyncRecords,
} from "../billing/store";
import { recordConnectorIngestionToFunnel } from "../companyBrain/funnelStore";
import { prisma } from "../storage/prismaClient";
import {
  getPrismaConnectorDatasourceWarning,
  hasPrismaConnectorDatasourceUrl,
  isPrismaDatabaseUnavailableError,
} from "../storage/prismaErrorUtils";
import { ConnectorManager, type ConnectorType } from "./connectorManager";
import {
  defaultEngineeringSignalRoot,
  isEngineeringSignalConnectorType,
  type EngineeringSignalConnectorType,
} from "./engineeringSignalFiles";
import { appendConnectorSyncLog } from "./syncLogStore";

type ConnectorRow = {
  id: string;
  userId: string;
  orgId: string | null;
  type: string;
  status: string;
  configJson: string | null;
};

type LiveWatcherConfig = Record<string, unknown> & {
  provider?: string;
  rootPath?: string;
  recentItemKeys?: unknown;
  lastCheckpointAt?: string;
  liveWatchEnabled?: boolean;
  liveWatchLastSignature?: string;
  liveWatchLastRunAt?: string;
  liveWatchLastStatus?: string;
  liveWatchLastError?: string | null;
  syncStartedAt?: string | null;
  lastContractCounts?: Record<string, number>;
};

export type EngineeringSignalDirectorySignature = {
  exists: boolean;
  fileCount: number;
  latestMtimeMs: number;
  totalSize: number;
  signature: string;
};

type LiveWatcherRuntimeStatus = {
  enabled: boolean;
  active: boolean;
  intervalMs: number;
  lastSweepAt: string | null;
  nextSweepAt: string | null;
  runningConnectors: number;
  lastError: string | null;
};

const WATCH_INTERVAL_MS = Math.max(
  1_000,
  Number(process.env.ENGINEERING_SIGNAL_LIVE_WATCH_INTERVAL_MS ?? 2_000),
);
const MAX_FILES = Math.max(
  25,
  Number(process.env.ENGINEERING_SIGNAL_LIVE_WATCH_MAX_FILES ?? 250),
);
const ALLOWED_EXTENSIONS = new Set([
  ".md",
  ".mdx",
  ".txt",
  ".json",
  ".jsonl",
  ".yaml",
  ".yml",
  ".log",
  ".out",
]);
const IGNORED_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  ".git",
  "coverage",
  ".turbo",
  ".cache",
]);

let watcherTimer: NodeJS.Timeout | null = null;
let lastSweepAt: string | null = null;
let nextSweepAt: string | null = null;
let lastError: string | null = null;
let dbUnavailableUntil = 0;
const runningConnectorIds = new Set<string>();

function nowIso(): string {
  return new Date().toISOString();
}

function parseConfig(value: string | null | undefined): LiveWatcherConfig {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object"
      ? (parsed as LiveWatcherConfig)
      : {};
  } catch {
    return {};
  }
}

function getContractCounts(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.entries(value as Record<string, unknown>).reduce<
    Record<string, number>
  >((counts, [key, count]) => {
    if (typeof count === "number" && Number.isFinite(count) && count > 0)
      counts[key] = count;
    return counts;
  }, {});
}

function isApiBackedEngineeringSignal(config: LiveWatcherConfig): boolean {
  return (
    config.provider === "github_actions" ||
    config.provider === "sentry" ||
    config.provider === "devin"
  );
}

export function shouldLiveWatchEngineeringSignal(
  type: string,
  config: LiveWatcherConfig,
): type is EngineeringSignalConnectorType {
  if (!isEngineeringSignalConnectorType(type)) return false;
  if (config.liveWatchEnabled === false) return false;
  if (isApiBackedEngineeringSignal(config)) return false;
  return true;
}

function connectorRootPath(
  type: EngineeringSignalConnectorType,
  config: LiveWatcherConfig,
): string {
  return typeof config.rootPath === "string" &&
    config.rootPath.trim().length > 0
    ? path.resolve(config.rootPath)
    : defaultEngineeringSignalRoot(type);
}

export function buildEngineeringSignalDirectorySignature(
  rootPath: string,
  maxFiles = MAX_FILES,
): EngineeringSignalDirectorySignature {
  if (!existsSync(rootPath)) {
    return {
      exists: false,
      fileCount: 0,
      latestMtimeMs: 0,
      totalSize: 0,
      signature: "missing",
    };
  }

  const files: string[] = [];
  const stack = [path.resolve(rootPath)];

  while (stack.length > 0 && files.length < maxFiles) {
    const current = stack.pop();
    if (!current) break;

    let entries: Dirent[];
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (files.length >= maxFiles) break;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) stack.push(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!ALLOWED_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
        continue;
      try {
        const stats = statSync(fullPath);
        if (stats.size > 0 && stats.size <= 3_000_000) files.push(fullPath);
      } catch {
        // Ignore files that are being written or are unreadable.
      }
    }
  }

  let latestMtimeMs = 0;
  let totalSize = 0;
  const parts: string[] = [];
  for (const filePath of files.sort()) {
    try {
      const stats = statSync(filePath);
      latestMtimeMs = Math.max(latestMtimeMs, stats.mtimeMs);
      totalSize += stats.size;
      const relativePath = path
        .relative(rootPath, filePath)
        .replace(/\\/g, "/");
      parts.push(`${relativePath}:${stats.size}:${Math.floor(stats.mtimeMs)}`);
    } catch {
      // Ignore files that changed between discovery and stat.
    }
  }

  return {
    exists: true,
    fileCount: files.length,
    latestMtimeMs,
    totalSize,
    signature: parts.join("|") || "empty",
  };
}

async function appendLog(input: {
  userId: string;
  orgId: string | null;
  type: string;
  status: "success" | "error";
  extractedCount: number;
  contractCounts?: Record<string, number>;
  message: string;
}): Promise<void> {
  await appendConnectorSyncLog(
    {
      id: randomUUID(),
      userId: input.userId,
      type: input.type,
      status: input.status,
      extractedCount: input.extractedCount,
      contractCounts: input.contractCounts,
      message: input.message,
      at: nowIso(),
    },
    input.orgId ?? undefined,
  );
}

async function runLiveSync(
  row: ConnectorRow,
  type: EngineeringSignalConnectorType,
  signature: string,
): Promise<void> {
  const startedAt = nowIso();
  const config = parseConfig(row.configJson);
  const previousCheckpoint =
    typeof config.lastCheckpointAt === "string"
      ? config.lastCheckpointAt
      : undefined;
  const recentItemKeys = Array.isArray(config.recentItemKeys)
    ? config.recentItemKeys.filter(
        (item): item is string => typeof item === "string",
      )
    : [];

  await prisma.connector.update({
    where: { id: row.id },
    data: {
      status: "syncing",
      configJson: JSON.stringify({
        ...config,
        syncStartedAt: startedAt,
        liveWatchLastRunAt: startedAt,
        liveWatchLastStatus: "syncing",
        liveWatchLastError: null,
      }),
    },
  });

  try {
    const result = await orgRequestContext.run(
      { orgId: row.orgId ?? undefined },
      () =>
        ConnectorManager.triggerSync(
          row.userId,
          type as ConnectorType,
          undefined,
          previousCheckpoint,
          recentItemKeys,
          config,
        ),
    );

    const extractedCount = result.extractedCount;
    const contractCounts = getContractCounts(result.contractCounts);
    const dedupeKeys = Array.isArray(result.dedupeKeys)
      ? result.dedupeKeys
      : [];
    const nextRecentItemKeys = Array.from(
      new Set([...recentItemKeys, ...dedupeKeys]),
    ).slice(-500);
    const checkpoint =
      typeof result.checkpoint === "string" ? result.checkpoint : nowIso();

    const quota = await canConsumeConnectorSyncRecords({
      userId: row.userId,
      amount: extractedCount,
    });
    if (!quota.allowed) {
      throw new Error(`Connector sync record limit reached for ${quota.plan}.`);
    }
    await consumeConnectorSyncRecords({
      userId: row.userId,
      amount: extractedCount,
    });

    await prisma.connector.update({
      where: { id: row.id },
      data: {
        status: "connected",
        lastSyncAt: nowIso(),
        recordCount: { increment: extractedCount },
        configJson: JSON.stringify({
          ...config,
          lastCheckpointAt: checkpoint,
          recentItemKeys: nextRecentItemKeys,
          lastContractCounts: contractCounts,
          syncStartedAt: null,
          lastFailureAt: null,
          lastFailureReason: null,
          liveWatchEnabled: config.liveWatchEnabled !== false,
          liveWatchLastSignature: signature,
          liveWatchLastRunAt: startedAt,
          liveWatchLastStatus: "success",
          liveWatchLastError: null,
        }),
      },
    });

    if (Object.keys(contractCounts).length > 0) {
      await recordConnectorIngestionToFunnel(row.userId, {
        source: row.type,
        contractCountsDelta: contractCounts,
        orgId: row.orgId ?? undefined,
      }).catch(() => undefined);
    }

    await appendLog({
      userId: row.userId,
      orgId: row.orgId,
      type: row.type,
      status: "success",
      extractedCount,
      contractCounts,
      message: `Live local sync completed for ${type}.`,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "engineering_signal_live_sync_failed";
    const latest = await prisma.connector.findUnique({ where: { id: row.id } });
    const latestConfig = parseConfig(latest?.configJson ?? row.configJson);

    await prisma.connector.update({
      where: { id: row.id },
      data: {
        status: "connected",
        configJson: JSON.stringify({
          ...latestConfig,
          syncStartedAt: null,
          lastFailureAt: nowIso(),
          lastFailureReason: message,
          liveWatchEnabled: latestConfig.liveWatchEnabled !== false,
          liveWatchLastSignature: signature,
          liveWatchLastRunAt: startedAt,
          liveWatchLastStatus: "error",
          liveWatchLastError: message,
        }),
      },
    });

    await appendLog({
      userId: row.userId,
      orgId: row.orgId,
      type: row.type,
      status: "error",
      extractedCount: 0,
      message: `Live local sync failed for ${type}: ${message}`,
    });
  }
}

async function maybeSyncConnector(row: ConnectorRow): Promise<void> {
  const config = parseConfig(row.configJson);
  if (!shouldLiveWatchEngineeringSignal(row.type, config)) return;
  if (row.status !== "connected" && row.status !== "error") return;
  if (runningConnectorIds.has(row.id)) return;

  const rootPath = connectorRootPath(row.type, config);
  const signature =
    buildEngineeringSignalDirectorySignature(rootPath).signature;
  if (config.liveWatchLastSignature === signature) return;

  if (typeof config.liveWatchLastSignature !== "string") {
    await prisma.connector.update({
      where: { id: row.id },
      data: {
        configJson: JSON.stringify({
          ...config,
          liveWatchEnabled: config.liveWatchEnabled !== false,
          liveWatchLastSignature: signature,
          liveWatchLastStatus: "watching",
          liveWatchLastError: null,
        }),
      },
    });
    return;
  }

  runningConnectorIds.add(row.id);
  try {
    await runLiveSync(row, row.type, signature);
  } finally {
    runningConnectorIds.delete(row.id);
  }
}

function isInDbCooldown(): boolean {
  return Date.now() < dbUnavailableUntil;
}

function markDbUnavailableNow(): void {
  dbUnavailableUntil = Date.now() + WATCH_INTERVAL_MS;
  nextSweepAt = new Date(dbUnavailableUntil).toISOString();
}

async function sweepEngineeringSignals(): Promise<void> {
  lastSweepAt = nowIso();
  if (isInDbCooldown()) {
    nextSweepAt = new Date(dbUnavailableUntil).toISOString();
    return;
  }
  nextSweepAt = new Date(Date.now() + WATCH_INTERVAL_MS).toISOString();
  if (!hasPrismaConnectorDatasourceUrl()) {
    lastError = getPrismaConnectorDatasourceWarning();
    return;
  }

  try {
    const connectors = await prisma.connector.findMany({
      where: {
        status: { in: ["connected", "error"] },
        type: {
          in: [
            "ide_chats",
            "cursor_chats",
            "vs_code_chats",
            "codex_chats",
            "chatgpt_chats",
            "windsurf_chats",
            "devin_chats",
            "ci_cd_logs",
            "deployment_errors",
          ],
        },
      },
      select: {
        id: true,
        userId: true,
        orgId: true,
        type: true,
        status: true,
        configJson: true,
      },
      take: 100,
    });

    for (const connector of connectors) {
      void maybeSyncConnector(connector);
    }
    lastError = null;
  } catch (error) {
    if (isPrismaDatabaseUnavailableError(error)) {
      lastError = "Database unavailable";
      markDbUnavailableNow();
      return;
    }
    lastError =
      error instanceof Error
        ? error.message
        : "engineering_signal_live_watch_failed";
    console.warn("[EngineeringSignalLiveWatch] sweep failed:", error);
  }
}

export function startEngineeringSignalLiveWatcher(): LiveWatcherRuntimeStatus {
  if (process.env.ENGINEERING_SIGNAL_LIVE_WATCH_ENABLED === "false") {
    return getEngineeringSignalLiveWatcherStatus();
  }
  if (!hasPrismaConnectorDatasourceUrl()) {
    lastError = getPrismaConnectorDatasourceWarning();
    nextSweepAt = null;
    return getEngineeringSignalLiveWatcherStatus();
  }
  if (watcherTimer) return getEngineeringSignalLiveWatcherStatus();
  nextSweepAt = new Date(Date.now() + WATCH_INTERVAL_MS).toISOString();
  watcherTimer = setInterval(() => {
    void sweepEngineeringSignals();
  }, WATCH_INTERVAL_MS);
  void sweepEngineeringSignals();
  return getEngineeringSignalLiveWatcherStatus();
}

export function stopEngineeringSignalLiveWatcher(): LiveWatcherRuntimeStatus {
  if (watcherTimer) {
    clearInterval(watcherTimer);
    watcherTimer = null;
  }
  nextSweepAt = null;
  return getEngineeringSignalLiveWatcherStatus();
}

export function getEngineeringSignalLiveWatcherStatus(): LiveWatcherRuntimeStatus {
  return {
    enabled: process.env.ENGINEERING_SIGNAL_LIVE_WATCH_ENABLED !== "false",
    active: Boolean(watcherTimer),
    intervalMs: WATCH_INTERVAL_MS,
    lastSweepAt,
    nextSweepAt,
    runningConnectors: runningConnectorIds.size,
    lastError,
  };
}
