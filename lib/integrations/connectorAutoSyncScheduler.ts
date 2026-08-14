import { randomUUID } from "crypto";
import { existsSync } from "fs";
import path from "path";
import { ConnectorManager, type ConnectorType } from "./connectorManager";
import {
  defaultEngineeringSignalRoot,
  isEngineeringSignalConnectorType,
  type EngineeringSignalConnectorType,
} from "./engineeringSignalFiles";
import { appendConnectorSyncLog } from "./syncLogStore";
import { prisma } from "../storage/prismaClient";
import {
  getPrismaConnectorDatasourceWarning,
  hasPrismaConnectorDatasourceUrl,
  isPrismaDatabaseUnavailableError,
} from "../storage/prismaErrorUtils";
import { orgRequestContext } from "../auth/orgScope";
import {
  canConsumeConnectorSyncRecords,
  consumeConnectorSyncRecords,
} from "../billing/store";
import { recordConnectorIngestionToFunnel } from "../companyBrain/funnelStore";

type ConnectorRow = {
  id: string;
  userId: string;
  orgId: string | null;
  type: string;
  status: string;
  configJson: string | null;
};

type AutoSyncConfig = Record<string, unknown> & {
  accessToken?: string;
  recentItemKeys?: unknown;
  lastCheckpointAt?: string;
  autoSyncEnabled?: boolean;
  autoSyncIntervalSeconds?: number;
  autoSyncNextRunAt?: string;
  autoSyncBackoffUntil?: string;
  autoSyncLastRunAt?: string;
  autoSyncLastStatus?: string;
  autoSyncLastError?: string | null;
  syncStartedAt?: string | null;
  retryCount?: number;
  lastFailureAt?: string | null;
  lastFailureReason?: string | null;
  lastContractCounts?: Record<string, number>;
};

type AutoSyncRuntimeStatus = {
  enabled: boolean;
  intervalSeconds: number;
  active: boolean;
  lastSweepAt: string | null;
  nextSweepAt: string | null;
  runningConnectors: number;
  lastError: string | null;
};

const AUTO_SYNC_SWEEP_MS = Math.max(
  5_000,
  Number(process.env.CONNECTOR_AUTO_SYNC_SWEEP_MS ?? 15_000),
);
const DEFAULT_INTERVALS_SECONDS: Partial<Record<ConnectorType, number>> = {
  local_files: Number(
    process.env.CONNECTOR_AUTO_SYNC_LOCAL_FILES_SECONDS ?? 120,
  ),
  ide_chats: Number(process.env.CONNECTOR_AUTO_SYNC_IDE_CHATS_SECONDS ?? 120),
  cursor_chats: Number(
    process.env.CONNECTOR_AUTO_SYNC_CURSOR_CHATS_SECONDS ?? 120,
  ),
  vs_code_chats: Number(
    process.env.CONNECTOR_AUTO_SYNC_VS_CODE_CHATS_SECONDS ?? 120,
  ),
  codex_chats: Number(
    process.env.CONNECTOR_AUTO_SYNC_CODEX_CHATS_SECONDS ?? 120,
  ),
  chatgpt_chats: Number(
    process.env.CONNECTOR_AUTO_SYNC_CHATGPT_CHATS_SECONDS ?? 120,
  ),
  windsurf_chats: Number(
    process.env.CONNECTOR_AUTO_SYNC_WINDSURF_CHATS_SECONDS ?? 120,
  ),
  devin_chats: Number(
    process.env.CONNECTOR_AUTO_SYNC_DEVIN_CHATS_SECONDS ?? 120,
  ),
  ci_cd_logs: Number(process.env.CONNECTOR_AUTO_SYNC_CI_CD_LOGS_SECONDS ?? 120),
  deployment_errors: Number(
    process.env.CONNECTOR_AUTO_SYNC_DEPLOYMENT_ERRORS_SECONDS ?? 120,
  ),
  slack: Number(process.env.CONNECTOR_AUTO_SYNC_SLACK_SECONDS ?? 300),
  github: Number(process.env.CONNECTOR_AUTO_SYNC_GITHUB_SECONDS ?? 900),
  linear: Number(process.env.CONNECTOR_AUTO_SYNC_LINEAR_SECONDS ?? 900),
  jira: Number(process.env.CONNECTOR_AUTO_SYNC_JIRA_SECONDS ?? 900),
  zendesk: Number(process.env.CONNECTOR_AUTO_SYNC_ZENDESK_SECONDS ?? 900),
  gmail: Number(process.env.CONNECTOR_AUTO_SYNC_GMAIL_SECONDS ?? 900),
};
const MIN_INTERVAL_SECONDS = Math.max(
  30,
  Number(process.env.CONNECTOR_AUTO_SYNC_MIN_INTERVAL_SECONDS ?? 60),
);
const BACKOFF_BASE_SECONDS = Math.max(
  60,
  Number(process.env.CONNECTOR_AUTO_SYNC_BACKOFF_BASE_SECONDS ?? 300),
);
const BACKOFF_MAX_SECONDS = Math.max(
  BACKOFF_BASE_SECONDS,
  Number(process.env.CONNECTOR_AUTO_SYNC_BACKOFF_MAX_SECONDS ?? 3600),
);

let schedulerTimer: NodeJS.Timeout | null = null;
let lastSweepAt: string | null = null;
let nextSweepAt: string | null = null;
let lastError: string | null = null;
let dbUnavailableUntil = 0;
const runningConnectorIds = new Set<string>();
const EXPLICIT_OPT_IN_ENGINEERING_SIGNAL_TYPES =
  new Set<EngineeringSignalConnectorType>([
    "ide_chats",
    "cursor_chats",
    "vs_code_chats",
    "windsurf_chats",
  ]);

function nowIso(): string {
  return new Date().toISOString();
}

function connectorAutoSyncEnabled(): boolean {
  const configured = process.env.CONNECTOR_AUTO_SYNC_ENABLED?.trim().toLowerCase();
  if (configured === "true") return true;
  if (configured === "false" || configured === "0") return false;
  return process.env.NODE_ENV === "production";
}

function parseConfig(value: string | null | undefined): AutoSyncConfig {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object"
      ? (parsed as AutoSyncConfig)
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
    if (typeof count === "number" && Number.isFinite(count) && count > 0) {
      counts[key] = count;
    }
    return counts;
  }, {});
}

function connectorIntervalSeconds(
  type: ConnectorType,
  config: AutoSyncConfig,
): number {
  const configured = Number(config.autoSyncIntervalSeconds);
  const fallback = DEFAULT_INTERVALS_SECONDS[type] ?? 900;
  const raw =
    Number.isFinite(configured) && configured > 0 ? configured : fallback;
  return Math.max(MIN_INTERVAL_SECONDS, Math.floor(raw));
}

function isConnectorType(value: string): value is ConnectorType {
  return [
    "github",
    "linear",
    "google_drive",
    "onedrive",
    "gmail",
    "slack",
    "local_files",
    "ide_chats",
    "cursor_chats",
    "vs_code_chats",
    "codex_chats",
    "chatgpt_chats",
    "windsurf_chats",
    "devin_chats",
    "ci_cd_logs",
    "deployment_errors",
    "zendesk",
    "jira",
  ].includes(value);
}

function configuredRootExists(rootPath: unknown): boolean {
  return (
    typeof rootPath === "string" &&
    rootPath.trim().length > 0 &&
    existsSync(path.resolve(rootPath))
  );
}

function isApiBackedEngineeringSignalConfigured(
  type: EngineeringSignalConnectorType,
  config: AutoSyncConfig,
): boolean {
  return (
    (type === "ci_cd_logs" && config.provider === "github_actions") ||
    (type === "deployment_errors" && config.provider === "sentry") ||
    (type === "devin_chats" && config.provider === "devin")
  );
}

export function isAutoSyncSourceConfigured(
  type: ConnectorType,
  config: AutoSyncConfig,
): boolean {
  if (type === "local_files") return true;
  if (!isEngineeringSignalConnectorType(type)) return true;
  if (
    EXPLICIT_OPT_IN_ENGINEERING_SIGNAL_TYPES.has(type) &&
    (process.env.CONNECTOR_AUTO_SYNC_HIDDEN_IDE_CHATS_ENABLED !== "true" ||
      config.autoSyncEnabled !== true)
  ) {
    return false;
  }
  if (isApiBackedEngineeringSignalConfigured(type, config)) return true;
  if (configuredRootExists(config.rootPath)) return true;
  return existsSync(defaultEngineeringSignalRoot(type));
}

function shouldAutoSync(
  row: ConnectorRow,
  config: AutoSyncConfig,
  nowMs: number,
): boolean {
  if (!isConnectorType(row.type)) return false;
  if (row.status !== "connected" && row.status !== "error") return false;
  if (!isAutoSyncSourceConfigured(row.type, config)) return false;
  if (config.autoSyncEnabled === false) return false;
  if (runningConnectorIds.has(row.id)) return false;
  const backoffUntil =
    typeof config.autoSyncBackoffUntil === "string"
      ? Date.parse(config.autoSyncBackoffUntil)
      : NaN;
  if (Number.isFinite(backoffUntil) && backoffUntil > nowMs) return false;
  const nextRunAt =
    typeof config.autoSyncNextRunAt === "string"
      ? Date.parse(config.autoSyncNextRunAt)
      : NaN;
  if (Number.isFinite(nextRunAt)) return nextRunAt <= nowMs;
  const lastSyncAt =
    typeof config.lastCheckpointAt === "string"
      ? Date.parse(config.lastCheckpointAt)
      : NaN;
  if (!Number.isFinite(lastSyncAt)) return true;
  return (
    nowMs - lastSyncAt >= connectorIntervalSeconds(row.type, config) * 1000
  );
}

function nextRunDate(
  type: ConnectorType,
  config: AutoSyncConfig,
  fromMs = Date.now(),
): string {
  return new Date(
    fromMs + connectorIntervalSeconds(type, config) * 1000,
  ).toISOString();
}

function backoffDate(config: AutoSyncConfig): string {
  const retryCount =
    typeof config.retryCount === "number" ? config.retryCount : 0;
  const seconds = Math.min(
    BACKOFF_MAX_SECONDS,
    BACKOFF_BASE_SECONDS * Math.pow(2, Math.max(0, retryCount)),
  );
  return new Date(Date.now() + seconds * 1000).toISOString();
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

async function syncConnector(row: ConnectorRow): Promise<void> {
  if (!isConnectorType(row.type)) return;
  const type = row.type;
  runningConnectorIds.add(row.id);
  const config = parseConfig(row.configJson);
  const startedAt = nowIso();

  try {
    const accessToken =
      typeof config.accessToken === "string" ? config.accessToken : undefined;
    const recentItemKeys = Array.isArray(config.recentItemKeys)
      ? config.recentItemKeys.filter(
          (item): item is string => typeof item === "string",
        )
      : [];
    const previousCheckpoint =
      typeof config.lastCheckpointAt === "string"
        ? config.lastCheckpointAt
        : undefined;

    await prisma.connector.update({
      where: { id: row.id },
      data: {
        status: "syncing",
        configJson: JSON.stringify({
          ...config,
          syncStartedAt: startedAt,
          autoSyncLastRunAt: startedAt,
          autoSyncLastStatus: "syncing",
          autoSyncLastError: null,
        }),
      },
    });

    const syncToken = accessToken;
    if (
      type !== "local_files" &&
      !isEngineeringSignalConnectorType(type) &&
      !syncToken
    ) {
      throw new Error(`${type} access token missing. Reconnect this source.`);
    }

    const result = await orgRequestContext.run(
      { orgId: row.orgId ?? undefined },
      () =>
        ConnectorManager.triggerSync(
          row.userId,
          type,
          syncToken,
          previousCheckpoint,
          recentItemKeys,
          config,
        ),
    );

    const extractedCount = result.extractedCount;
    const dedupeKeys = Array.isArray(result.dedupeKeys)
      ? result.dedupeKeys
      : [];
    const checkpoint =
      typeof result.checkpoint === "string" ? result.checkpoint : undefined;
    const contractCounts = getContractCounts(result.contractCounts);
    const nextRecentItemKeys = Array.from(
      new Set([...recentItemKeys, ...dedupeKeys]),
    ).slice(-500);

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
          ...(checkpoint ? { lastCheckpointAt: checkpoint } : {}),
          recentItemKeys: nextRecentItemKeys,
          lastContractCounts: contractCounts,
          syncStartedAt: null,
          retryCount: 0,
          lastFailureAt: null,
          lastFailureReason: null,
          autoSyncEnabled: config.autoSyncEnabled !== false,
          autoSyncIntervalSeconds: connectorIntervalSeconds(type, config),
          autoSyncNextRunAt: nextRunDate(type, config),
          autoSyncBackoffUntil: null,
          autoSyncLastRunAt: startedAt,
          autoSyncLastStatus: "success",
          autoSyncLastError: null,
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
      message: `Auto-sync completed for ${type}.`,
    });
  } catch (error) {
    const latest = await prisma.connector.findUnique({ where: { id: row.id } });
    const latestConfig = parseConfig(latest?.configJson ?? row.configJson);
    const message = error instanceof Error ? error.message : "auto_sync_failed";
    const retryCount =
      typeof latestConfig.retryCount === "number"
        ? latestConfig.retryCount + 1
        : 1;

    await prisma.connector.update({
      where: { id: row.id },
      data: {
        status: "connected",
        configJson: JSON.stringify({
          ...latestConfig,
          syncStartedAt: null,
          retryCount,
          lastFailureAt: nowIso(),
          lastFailureReason: message,
          autoSyncEnabled: latestConfig.autoSyncEnabled !== false,
          autoSyncIntervalSeconds: connectorIntervalSeconds(type, latestConfig),
          autoSyncBackoffUntil: backoffDate({ ...latestConfig, retryCount }),
          autoSyncLastRunAt: startedAt,
          autoSyncLastStatus: "error",
          autoSyncLastError: message,
        }),
      },
    });

    await appendLog({
      userId: row.userId,
      orgId: row.orgId,
      type: row.type,
      status: "error",
      extractedCount: 0,
      message: `Auto-sync failed for ${type}: ${message}`,
    });
  } finally {
    runningConnectorIds.delete(row.id);
  }
}

function isInDbCooldown(): boolean {
  return Date.now() < dbUnavailableUntil;
}

function markDbUnavailableNow(): void {
  dbUnavailableUntil = Date.now() + AUTO_SYNC_SWEEP_MS;
  nextSweepAt = new Date(dbUnavailableUntil).toISOString();
}

async function sweepConnectors(): Promise<void> {
  const now = Date.now();
  lastSweepAt = nowIso();
  if (isInDbCooldown()) {
    nextSweepAt = new Date(dbUnavailableUntil).toISOString();
    return;
  }
  nextSweepAt = new Date(now + AUTO_SYNC_SWEEP_MS).toISOString();
  if (!hasPrismaConnectorDatasourceUrl()) {
    lastError = getPrismaConnectorDatasourceWarning();
    return;
  }
  try {
    const connectors = await prisma.connector.findMany({
      where: {
        status: { in: ["connected", "error"] },
        type: { in: Object.keys(DEFAULT_INTERVALS_SECONDS) },
      },
      select: {
        id: true,
        userId: true,
        orgId: true,
        type: true,
        status: true,
        configJson: true,
      },
      take: 50,
    });

    const due = connectors.filter((connector) =>
      shouldAutoSync(connector, parseConfig(connector.configJson), now),
    );
    for (const connector of due.slice(0, 5)) {
      void syncConnector(connector);
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
        : "connector_auto_sync_sweep_failed";
    console.warn("[ConnectorAutoSync] sweep failed:", error);
  }
}

export function startConnectorAutoSyncScheduler(): AutoSyncRuntimeStatus {
  if (!connectorAutoSyncEnabled()) {
    return getConnectorAutoSyncStatus();
  }
  if (!hasPrismaConnectorDatasourceUrl()) {
    lastError = getPrismaConnectorDatasourceWarning();
    nextSweepAt = null;
    return getConnectorAutoSyncStatus();
  }
  if (schedulerTimer) return getConnectorAutoSyncStatus();
  nextSweepAt = new Date(Date.now() + AUTO_SYNC_SWEEP_MS).toISOString();
  schedulerTimer = setInterval(() => {
    void sweepConnectors();
  }, AUTO_SYNC_SWEEP_MS);
  void sweepConnectors();
  return getConnectorAutoSyncStatus();
}

export function stopConnectorAutoSyncScheduler(): AutoSyncRuntimeStatus {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
  nextSweepAt = null;
  return getConnectorAutoSyncStatus();
}

export function getConnectorAutoSyncStatus(): AutoSyncRuntimeStatus {
  return {
    enabled: connectorAutoSyncEnabled(),
    intervalSeconds: Math.floor(AUTO_SYNC_SWEEP_MS / 1000),
    active: Boolean(schedulerTimer),
    lastSweepAt,
    nextSweepAt,
    runningConnectors: runningConnectorIds.size,
    lastError,
  };
}

export function serializeConnectorAutoSync(
  configJson: string | null | undefined,
  type: string,
): {
  enabled: boolean;
  intervalSeconds: number;
  nextRunAt: string | null;
  backoffUntil: string | null;
  lastRunAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
} {
  const config = parseConfig(configJson);
  const typed = isConnectorType(type) ? type : "github";
  return {
    enabled: config.autoSyncEnabled !== false,
    intervalSeconds: connectorIntervalSeconds(typed, config),
    nextRunAt:
      typeof config.autoSyncNextRunAt === "string"
        ? config.autoSyncNextRunAt
        : null,
    backoffUntil:
      typeof config.autoSyncBackoffUntil === "string"
        ? config.autoSyncBackoffUntil
        : null,
    lastRunAt:
      typeof config.autoSyncLastRunAt === "string"
        ? config.autoSyncLastRunAt
        : null,
    lastStatus:
      typeof config.autoSyncLastStatus === "string"
        ? config.autoSyncLastStatus
        : null,
    lastError:
      typeof config.autoSyncLastError === "string"
        ? config.autoSyncLastError
        : null,
  };
}
