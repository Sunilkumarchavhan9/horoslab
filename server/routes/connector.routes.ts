import { Router, type Response as ExpressResponse } from "express";
import { mkdirSync } from "fs";
import jwt from "jsonwebtoken";
import path from "path";
import {
  ConnectorManager,
  type ConnectorType,
} from "../../lib/integrations/connectorManager";
import { GitHubClient } from "../../lib/integrations/github";
import { GoogleClient } from "../../lib/integrations/google";
import { MicrosoftClient } from "../../lib/integrations/microsoft";
import { GmailClient } from "../../lib/integrations/gmail";
import { SlackClient } from "../../lib/integrations/slack";
import { ZendeskClient } from "../../lib/integrations/zendesk";
import { JiraClient } from "../../lib/integrations/jira";
import { LinearClient } from "../../lib/integrations/linear";
import {
  EngineeringSignalFilesClient,
  defaultEngineeringSignalRoot,
  isEngineeringSignalConnectorType,
} from "../../lib/integrations/engineeringSignalFiles";
import { writeEngineeringSignalExportUpload } from "../../lib/integrations/engineeringSignalUpload";
import {
  appendConnectorSyncLog,
  listConnectorSyncLogs,
} from "../../lib/integrations/syncLogStore";
import {
  DEFAULT_MEMORY_PIPELINE_CONNECTOR,
  prioritizeDefaultConnector,
} from "../../lib/integrations/defaultConnector";
import {
  buildConnectorFreshness,
  resolveConnectorStaleThresholdSeconds,
} from "../../lib/integrations/connectorFreshness";
import {
  getConnectorAutoSyncStatus,
  serializeConnectorAutoSync,
} from "../../lib/integrations/connectorAutoSyncScheduler";
import {
  buildConnectorPermissionDiagnostics,
  connectorPermissionBlockerMessage,
} from "../../lib/integrations/connectorPermissions";
import { prisma } from "../../lib/storage/prismaClient";
import {
  getPrismaConnectorDatasourceWarning,
  hasPrismaConnectorDatasourceUrl,
  isPrismaDatabaseUnavailableError,
} from "../../lib/storage/prismaErrorUtils";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendApiSuccess, sendApiError, buildApiMeta } from "./api-response";
import { randomUUID } from "crypto";
import {
  canConsumeConnectorSyncRecords,
  consumeConnectorSyncRecords,
  getBillingStateForUser,
} from "../../lib/billing/store";

import {
  connectorStorageId,
  connectorUserFilter,
  normalizeOrgId,
  readOrgIdFromRequest,
} from "../../lib/auth/orgScope";
import { requireAuth } from "../middleware/auth";
import { verifyAuthorizationHeader } from "../../lib/auth/verifyToken";
import {
  approveAndExecuteGitHubProposal,
  getGitHubProfileForUser,
  listGitHubReposForUser,
  mergeGitHubPullRequest,
  proposeGitHubExecution,
} from "../../lib/integrations/githubExecution";
import {
  listGitHubRepoBranches,
  listGitHubRepoContents,
  listGitHubPullRequests,
  getGitHubPullRequestDetail,
  readGitHubRepoFile,
} from "../../lib/integrations/githubRepoBrowser";
import { listGitHubExecutionProposalsForUser } from "../../lib/integrations/githubExecutionStore";
import type { GitHubExecutionKind } from "../../lib/integrations/githubExecutionStore";
import {
  patchCompanyBrainFunnelProgress,
  recordConnectorIngestionToFunnel,
  patchContinuityFunnelStep,
} from "../../lib/companyBrain/funnelStore";
import {
  getCompanyModelConfig,
  saveCompanyModelConfig,
} from "../../lib/runtime/companyModelProvider";
import {
  listRepoIndexStatuses,
  summarizeIndexedRepos,
} from "../../lib/integrations/repoIndexStatus";
import { emitMemoryRealtimeEvent } from "../../lib/memory/realtimeEventBus";
import { ingestConnectorSync } from "../../lib/reality/ingestion/realityIngestion";

export const connectorRouter = Router();
type ConnectorRealtimeEvent = {
  kind: "connector_update" | "sync_log";
  userId: string;
  payload: Record<string, unknown>;
};
const CONNECTOR_STREAMS = new Map<string, Set<ExpressResponse>>();

async function reconcileLegacyConnectorScope(userId: string, orgId?: string): Promise<void> {
  if (!orgId) return;

  const legacyRows = await prisma.connector.findMany({
    where: { userId, orgId: null },
    select: {
      type: true,
      status: true,
      configJson: true,
      lastSyncAt: true,
      recordCount: true,
    },
  });

  for (const legacy of legacyRows) {
    if (legacy.status !== "connected" || !legacy.configJson) continue;
    const scopedId = connectorStorageId(userId, legacy.type, orgId);
    const scoped = await prisma.connector.findUnique({
      where: { id: scopedId },
      select: { status: true, configJson: true },
    });
    if (!scoped || scoped.status === "connected") continue;

    await prisma.connector.update({
      where: { id: scopedId },
      data: {
        status: "connected",
        configJson: legacy.configJson,
        lastSyncAt: legacy.lastSyncAt,
        recordCount: legacy.recordCount,
        updatedAt: new Date(),
      },
    });
  }
}
const PREMIUM_CONNECTORS = new Set<ConnectorType>([
  "github",
  "google_drive",
  "onedrive",
  "gmail",
  "slack",
  "zendesk",
  "jira",
  "linear",
]);

function emitConnectorEvent(event: ConnectorRealtimeEvent): void {
  const sinks = CONNECTOR_STREAMS.get(event.userId);
  if (!sinks || sinks.size === 0) return;
  const line = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of sinks) {
    try {
      res.write(line);
    } catch {
      // stale connection; cleanup happens on close handler.
    }
  }
}

if (!process.env.CONNECTOR_OAUTH_STATE_SECRET) {
  throw new Error("CONNECTOR_OAUTH_STATE_SECRET is required");
}
const STATE_SECRET = process.env.CONNECTOR_OAUTH_STATE_SECRET;
const DB_RETRY_COOLDOWN_MS = 30_000;
const CONNECTOR_SYNC_LOCK_MS = 5 * 60 * 1000;
let dbUnavailableUntil = 0;

function isDbUnavailableError(error: unknown): boolean {
  return isPrismaDatabaseUnavailableError(error);
}

function isInDbCooldown(): boolean {
  return Date.now() < dbUnavailableUntil;
}

function markDbUnavailableNow(): void {
  dbUnavailableUntil = Date.now() + DB_RETRY_COOLDOWN_MS;
}

function getConnectorConfig(
  value: string | null | undefined,
): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
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

async function updateFunnelAfterConnectorSync(
  userId: string,
  orgId: string | undefined,
  type: string,
  contractCounts: Record<string, number>,
): Promise<void> {
  if (Object.keys(contractCounts).length === 0) return;
  try {
    await recordConnectorIngestionToFunnel(userId, {
      source: type,
      contractCountsDelta: contractCounts,
      orgId,
    });
  } catch (error) {
    console.warn(
      "[ConnectorRouter] Company Brain funnel ingestion update failed:",
      error,
    );
  }
}

function toSingleString(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first : "";
  }
  return "";
}

function resolveLocalFilesRootPath(value: unknown): string | undefined {
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }
  const resolved = path.resolve(value.trim());
  const workspaceRoot = process.cwd();
  const relative = path.relative(workspaceRoot, resolved);
  const insideWorkspace =
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
  if (
    !insideWorkspace &&
    process.env.LOCAL_FILES_ALLOW_OUTSIDE_WORKSPACE !== "true"
  ) {
    throw new Error("Local files root must be inside the MemoryOS workspace.");
  }
  return resolved;
}

function titleFromType(type: string): string {
  return type
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isWorkspaceFileConnector(
  type: string,
): type is
  | "local_files"
  | "ide_chats"
  | "cursor_chats"
  | "vs_code_chats"
  | "codex_chats"
  | "chatgpt_chats"
  | "windsurf_chats"
  | "devin_chats"
  | "ci_cd_logs"
  | "deployment_errors" {
  return type === "local_files" || isEngineeringSignalConnectorType(type);
}

function defaultWorkspaceConnectorRoot(type: string): string {
  return isEngineeringSignalConnectorType(type)
    ? defaultEngineeringSignalRoot(type)
    : process.cwd();
}

function workspaceConnectorDisplayName(type: string): string {
  if (type === "local_files") return "Local Files";
  if (type === "ide_chats") return "IDE Chats";
  if (type === "cursor_chats") return "Cursor Chats";
  if (type === "vs_code_chats") return "VS Code Chats";
  if (type === "codex_chats") return "Codex Chats";
  if (type === "chatgpt_chats") return "ChatGPT Chats";
  if (type === "windsurf_chats") return "Windsurf Chats";
  if (type === "devin_chats") return "Devin Chats";
  if (type === "ci_cd_logs") return "CI/CD Logs";
  if (type === "deployment_errors") return "Deployment Errors";
  return titleFromType(type);
}

async function isConnectorAllowedByPlan(
  userId: string,
  type: ConnectorType,
): Promise<boolean> {
  const plan = (await getBillingStateForUser(userId)).plan;
  if (
    isWorkspaceFileConnector(type) ||
    type === "github" ||
    type === "slack" ||
    type === "linear"
  )
    return true;
  if (!PREMIUM_CONNECTORS.has(type)) return true;
  return plan !== "Free";
}

async function maskConnectorByPlan(
  userId: string,
  connector: {
    type: string;
    status: string;
    configJson: string | null;
  } & Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const typed = connector.type as ConnectorType;
  const allowed = await isConnectorAllowedByPlan(userId, typed);
  if (allowed) {
    return connector;
  }
  return {
    ...connector,
    status: "not_connected",
    configJson: JSON.stringify({ lockedByPlan: true }),
  };
}

function serializeConnectorForList(connector: Record<string, unknown>): {
  type: string;
  status: string;
  recordCount: number;
  sourceItemCount: number;
  lastSyncAt: string | null;
  lastFailureReason: string | null;
  contractCounts: Record<string, number>;
  autoSync: ReturnType<typeof serializeConnectorAutoSync>;
} {
  const type = typeof connector.type === "string" ? connector.type : "unknown";
  const config = getConnectorConfig(
    typeof connector.configJson === "string" ? connector.configJson : null,
  );
  const contractCounts = getContractCounts(config.lastContractCounts);
  const rawRecordCount =
    typeof connector.recordCount === "number" &&
    Number.isFinite(connector.recordCount)
      ? connector.recordCount
      : 0;
  const derivedRecordCount = Object.values(contractCounts).reduce(
    (sum, count) => sum + count,
    0,
  );
  return {
    type,
    status:
      typeof connector.status === "string" ? connector.status : "not_connected",
    recordCount: Math.max(rawRecordCount, derivedRecordCount),
    sourceItemCount:
      typeof config.lastSourceItemCount === "number" && Number.isFinite(config.lastSourceItemCount)
        ? config.lastSourceItemCount
        : 0,
    lastSyncAt:
      typeof connector.lastSyncAt === "string" &&
      connector.lastSyncAt.length > 0
        ? connector.lastSyncAt
        : null,
    lastFailureReason:
      typeof config.lastFailureReason === "string" && config.lastFailureReason.length > 0
        ? config.lastFailureReason
        : null,
    contractCounts,
    autoSync: serializeConnectorAutoSync(
      typeof connector.configJson === "string" ? connector.configJson : null,
      type,
    ),
  };
}

/**
 * List all connectors for the current user.
 */
connectorRouter.get(
  "/events",
  asyncHandler(async (req, res) => {
    const token = toSingleString(req.query.token);
    const verified = await verifyAuthorizationHeader(
      token ? `Bearer ${token}` : req.header("authorization"),
    );
    if (!verified) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const userId = verified.userId;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    res.write(
      `event: ready\ndata: ${JSON.stringify({ ok: true, userId })}\n\n`,
    );

    const existingSinks = CONNECTOR_STREAMS.get(userId);
    const sinks: Set<ExpressResponse> =
      existingSinks ?? new Set<ExpressResponse>();
    if (!existingSinks) {
      CONNECTOR_STREAMS.set(userId, sinks);
    }
    sinks.add(res);

    const heartbeat = setInterval(() => {
      try {
        res.write(
          `event: ping\ndata: {"ts":"${new Date().toISOString()}"}\n\n`,
        );
      } catch {
        // ignored
      }
    }, 15000);

    req.on("close", () => {
      clearInterval(heartbeat);
      const current = CONNECTOR_STREAMS.get(userId);
      if (!current) return;
      current.delete(res);
      if (current.size === 0) CONNECTOR_STREAMS.delete(userId);
    });
  }),
);

connectorRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    let requestOrgId = readOrgIdFromRequest(req) ?? req.authOrgId;
    if (!requestOrgId) {
      const existingScoped = await prisma.connector.findFirst({
        where: { userId: req.authUserId, orgId: { not: null } },
        orderBy: { updatedAt: "desc" },
        select: { orgId: true },
      });
      requestOrgId = existingScoped?.orgId ?? undefined;
    }
    if (!hasPrismaConnectorDatasourceUrl()) {
      const warning = getPrismaConnectorDatasourceWarning();
      sendApiSuccess(
        res,
        200,
        {
          connectors: [],
          backendAvailable: false,
          ...(warning ? { warning } : {}),
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    if (isInDbCooldown()) {
      sendApiSuccess(
        res,
        200,
        {
          connectors: [],
          backendAvailable: false,
          warning: "Database unavailable. Using cached outage cooldown.",
          retryAfterMs: Math.max(0, dbUnavailableUntil - Date.now()),
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    try {
      await reconcileLegacyConnectorScope(req.authUserId, requestOrgId);
      const storedConnectors = await prisma.connector.findMany({
        where: connectorUserFilter({
          userId: req.authUserId,
          orgId: requestOrgId,
        }),
      });
      const visibleConnectors = prioritizeDefaultConnector(
        storedConnectors.filter((connector) => connector.type !== "notion"),
      );
      const planAwareConnectors = await Promise.all(
        visibleConnectors.map((connector) =>
          maskConnectorByPlan(req.authUserId, connector),
        ),
      );
      const connectorSummaries = planAwareConnectors.map((connector) =>
        serializeConnectorForList(connector as Record<string, unknown>),
      );
      dbUnavailableUntil = 0;
      sendApiSuccess(
        res,
        200,
        { connectors: connectorSummaries, backendAvailable: true },
        buildApiMeta(req, startedAt),
      );
    } catch (error) {
      if (isDbUnavailableError(error)) {
        markDbUnavailableNow();
        sendApiSuccess(
          res,
          200,
          {
            connectors: [],
            backendAvailable: false,
            warning: "Database unavailable. Returning empty connector list.",
          },
          buildApiMeta(req, startedAt),
        );
        return;
      }
      throw error;
    }
  }),
);

connectorRouter.get(
  "/logs",
  requireAuth,
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const logs = await listConnectorSyncLogs(req.authUserId, req.authOrgId);
    sendApiSuccess(res, 200, { logs }, buildApiMeta(req, startedAt));
  }),
);

connectorRouter.get(
  "/auto-sync/status",
  requireAuth,
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    sendApiSuccess(
      res,
      200,
      getConnectorAutoSyncStatus(),
      buildApiMeta(req, startedAt),
    );
  }),
);

connectorRouter.get(
  "/index-status",
  requireAuth,
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const orgId = readOrgIdFromRequest(req) ?? req.authOrgId;
    const reposRaw = req.query.repos;
    const reposParam = Array.isArray(reposRaw) ? reposRaw[0] : reposRaw;
    const repoFullNames =
      typeof reposParam === "string" && reposParam.trim().length > 0
        ? reposParam
            .split(",")
            .map((value) => value.trim())
            .filter((value) => value.includes("/"))
        : undefined;
    const summaryOnly =
      req.query.summary === "1" || req.query.summary === "true";

    if (summaryOnly) {
      const summary = await summarizeIndexedRepos(req.authUserId, orgId);
      sendApiSuccess(res, 200, summary, buildApiMeta(req, startedAt));
      return;
    }

    const repos = await listRepoIndexStatuses(
      req.authUserId,
      orgId,
      repoFullNames,
    );
    sendApiSuccess(
      res,
      200,
      {
        repos,
        githubSyncInProgress: repos.some((repo) => repo.generating),
      },
      buildApiMeta(req, startedAt),
    );
  }),
);

connectorRouter.get(
  "/health",
  requireAuth,
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    if (!hasPrismaConnectorDatasourceUrl()) {
      const warning = getPrismaConnectorDatasourceWarning();
      sendApiSuccess(
        res,
        200,
        {
          diagnostics: [],
          freshness: [],
          staleThresholdSeconds: resolveConnectorStaleThresholdSeconds(),
          backendAvailable: false,
          ...(warning ? { warning } : {}),
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    if (isInDbCooldown()) {
      sendApiSuccess(
        res,
        200,
        {
          diagnostics: [],
          freshness: [],
          staleThresholdSeconds: resolveConnectorStaleThresholdSeconds(),
          backendAvailable: false,
          warning:
            "Database unavailable. Connector diagnostics temporarily disabled.",
          retryAfterMs: Math.max(0, dbUnavailableUntil - Date.now()),
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    try {
      const requestOrgId = readOrgIdFromRequest(req) ?? req.authOrgId;
      const connectors = await prisma.connector.findMany({
        where: connectorUserFilter({
          userId: req.authUserId,
          orgId: requestOrgId,
        }),
      });
      dbUnavailableUntil = 0;
      const visibleConnectors = prioritizeDefaultConnector(
        connectors.filter((connector) => connector.type !== "notion"),
      );
      const recentSyncLogs = await listConnectorSyncLogs(
        req.authUserId,
        requestOrgId,
      );
      const lastErrorByType = new Map<string, string>();
      const latestLogByType = new Map<
        string,
        { status: string; message?: string }
      >();
      for (const log of recentSyncLogs) {
        if (!latestLogByType.has(log.type)) {
          latestLogByType.set(log.type, {
            status: log.status,
            message: log.message,
          });
        }
      }
      for (const [type, log] of latestLogByType) {
        if (log.status === "error" && log.message?.trim()) {
          lastErrorByType.set(type, log.message.trim());
        }
      }

      const diagnostics = await Promise.all(
        visibleConnectors.map(async (connector) => {
          const allowed = await isConnectorAllowedByPlan(
            req.authUserId,
            connector.type as ConnectorType,
          );
          const config = connector.configJson
            ? JSON.parse(connector.configJson)
            : {};
          const apiBackedEngineeringSignal =
            isWorkspaceFileConnector(connector.type) &&
            typeof config.provider === "string";
          return {
            type: connector.type,
            status: allowed ? connector.status : "not_connected",
            auth: {
              configured:
                allowed &&
                Boolean(
                  config.accessToken ||
                  isWorkspaceFileConnector(connector.type),
                ),
              mode: apiBackedEngineeringSignal
                ? "api"
                : isWorkspaceFileConnector(connector.type)
                  ? "workspace"
                  : "oauth2",
            },
            transport: {
              protocol:
                apiBackedEngineeringSignal ||
                !isWorkspaceFileConnector(connector.type)
                  ? "https"
                  : "filesystem",
              healthy:
                allowed &&
                (connector.status === "connected" ||
                  connector.status === "syncing"),
            },
            retry: {
              enabled: true,
              retryCount:
                typeof config.retryCount === "number" ? config.retryCount : 0,
              lastFailureAt:
                typeof config.lastFailureAt === "string"
                  ? config.lastFailureAt
                  : null,
              lastFailureReason:
                typeof config.lastFailureReason === "string"
                  ? config.lastFailureReason
                  : null,
            },
            autoSync: serializeConnectorAutoSync(
              connector.configJson,
              connector.type,
            ),
            checkpoints: {
              lastCheckpointAt:
                typeof config.lastCheckpointAt === "string"
                  ? config.lastCheckpointAt
                  : null,
              recentItemKeysCount: Array.isArray(config.recentItemKeys)
                ? config.recentItemKeys.length
                : 0,
              slackCursor:
                typeof config.cursor === "string" ? config.cursor : null,
              slackLastMessageTs:
                typeof config.lastMessageTs === "string"
                  ? config.lastMessageTs
                  : null,
              slackSyncDiagnostics:
                config.lastSlackSyncDiagnostics &&
                typeof config.lastSlackSyncDiagnostics === "object"
                  ? config.lastSlackSyncDiagnostics
                  : null,
              gmailLastMessageId:
                typeof config.lastMessageId === "string"
                  ? config.lastMessageId
                  : null,
              gmailLastCheckpointEpochMs:
                typeof config.lastCheckpointEpochMs === "number"
                  ? config.lastCheckpointEpochMs
                  : null,
              jiraProjectKeys: Array.isArray(config.projectKeys)
                ? config.projectKeys
                : null,
              jiraAuthMode:
                typeof config.authMode === "string" ? config.authMode : null,
              jiraSyncDiagnostics:
                config.lastJiraSyncDiagnostics &&
                typeof config.lastJiraSyncDiagnostics === "object"
                  ? config.lastJiraSyncDiagnostics
                  : null,
              linearTeamKeys: Array.isArray(config.teamKeys)
                ? config.teamKeys
                : null,
              linearAuthMode:
                typeof config.authMode === "string" ? config.authMode : null,
              linearSyncDiagnostics:
                config.lastLinearSyncDiagnostics &&
                typeof config.lastLinearSyncDiagnostics === "object"
                  ? config.lastLinearSyncDiagnostics
                  : null,
              devinSyncDiagnostics:
                config.lastDevinSyncDiagnostics &&
                typeof config.lastDevinSyncDiagnostics === "object"
                  ? config.lastDevinSyncDiagnostics
                  : null,
            },
            contractCounts: getContractCounts(config.lastContractCounts),
            tokens: {
              hasRefreshToken:
                allowed &&
                typeof config.refreshToken === "string" &&
                config.refreshToken.length > 0,
              lastTokenRefreshAt:
                allowed && typeof config.lastTokenRefreshAt === "string"
                  ? config.lastTokenRefreshAt
                  : null,
              hasAccessToken:
                allowed &&
                typeof config.accessToken === "string" &&
                config.accessToken.length > 0,
            },
            permissions: buildConnectorPermissionDiagnostics({
              type: connector.type,
              allowed,
              config,
              status: connector.status,
              apiBackedEngineeringSignal,
              isWorkspaceConnector: isWorkspaceFileConnector(connector.type),
              orgId: requestOrgId,
            }),
            safety: {
              mcpSafeMetadata: true,
              policyCompatible: true,
            },
          };
        }),
      );

      const freshness = visibleConnectors.map((connector) => {
        const allowed = diagnostics.find(
          (item) => item.type === connector.type,
        );
        const status = allowed?.status ?? connector.status;
        const config = getConnectorConfig(connector.configJson);
        const lastSyncAt =
          typeof connector.lastSyncAt === "string" &&
          connector.lastSyncAt.length > 0
            ? connector.lastSyncAt
            : null;
        const rawRecordCount =
          typeof connector.recordCount === "number" &&
          Number.isFinite(connector.recordCount)
            ? connector.recordCount
            : 0;
        const derivedRecordCount = Object.values(
          getContractCounts(config.lastContractCounts),
        ).reduce((sum, count) => sum + count, 0);
        return buildConnectorFreshness({
          type: connector.type,
          status,
          lastSyncAt,
          recordCount: Math.max(rawRecordCount, derivedRecordCount),
          lastFailureReason:
            typeof config.lastFailureReason === "string"
              ? config.lastFailureReason
              : null,
          lastFailureAt:
            typeof config.lastFailureAt === "string"
              ? config.lastFailureAt
              : null,
          lastSyncLogError: lastErrorByType.get(connector.type) ?? null,
        });
      });

      sendApiSuccess(
        res,
        200,
        {
          diagnostics,
          freshness,
          autoSync: getConnectorAutoSyncStatus(),
          staleThresholdSeconds: resolveConnectorStaleThresholdSeconds(),
          backendAvailable: true,
        },
        buildApiMeta(req, startedAt),
      );
    } catch (error) {
      if (isDbUnavailableError(error)) {
        markDbUnavailableNow();
        sendApiSuccess(
          res,
          200,
          {
            diagnostics: [],
            freshness: [],
            staleThresholdSeconds: resolveConnectorStaleThresholdSeconds(),
            backendAvailable: false,
            warning:
              "Database unavailable. Connector diagnostics temporarily disabled.",
          },
          buildApiMeta(req, startedAt),
        );
        return;
      }
      throw error;
    }
  }),
);

/**
 * Start OAuth flow for a connector.
 */
connectorRouter.get(
  "/:type/authorize",
  requireAuth,
  asyncHandler(async (req, res) => {
    const type = toSingleString(req.params.type);
    const { returnTo } = req.query;
    const userId = req.authUserId;
    let requestOrgId = readOrgIdFromRequest(req) ?? req.authOrgId;
    if (!requestOrgId) {
      const existingScoped = await prisma.connector.findFirst({
        where: { userId, type, orgId: { not: null } },
        orderBy: { updatedAt: "desc" },
        select: { orgId: true },
      });
      requestOrgId = existingScoped?.orgId ?? undefined;
    }
    const startedAt = Date.now();
    if (type === "notion") {
      sendApiError(
        res,
        410,
        {
          code: "CONNECTOR_DISABLED",
          message: "Notion connector is currently disabled.",
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const typed = type as ConnectorType;
    const bypassPlanGate = typed === DEFAULT_MEMORY_PIPELINE_CONNECTOR;
    if (!bypassPlanGate && !(await isConnectorAllowedByPlan(userId, typed))) {
      const plan = (await getBillingStateForUser(userId)).plan;
      sendApiError(
        res,
        402,
        {
          code: "UPGRADE_REQUIRED",
          message: `${type} connector requires Pro or higher.`,
          details: { connector: type, currentPlan: plan, minimumPlan: "Pro" },
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const frontendOriginHeader = req.get("x-memoryos-frontend-origin")?.trim();
    const frontendOrigin =
      frontendOriginHeader && /^https?:\/\//i.test(frontendOriginHeader)
        ? frontendOriginHeader.replace(/\/$/, "")
        : "";
    const redirectUri = frontendOrigin
      ? `${frontendOrigin}/api/connector/callback`
      : process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL || "";
    const configuredRedirectUri =
      process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL || "";
    const redirectOrigin = redirectUri ? new URL(redirectUri).origin : "";
    const configuredRedirectOrigin = configuredRedirectUri
      ? new URL(configuredRedirectUri).origin
      : "";

    if (
      type === "github" &&
      process.env.GITHUB_CLIENT_ID &&
      configuredRedirectOrigin &&
      redirectOrigin &&
      configuredRedirectOrigin !== redirectOrigin
    ) {
      sendApiError(
        res,
        409,
        {
          code: "OAUTH_CALLBACK_MISMATCH",
          message:
            `GitHub OAuth app callback is configured for ${configuredRedirectOrigin}, ` +
            `but this dev session is using ${redirectOrigin}. ` +
            `Create a local GitHub OAuth app with callback ${redirectUri}, or open the matching deployed app.`,
          details: {
            connector: type,
            configuredCallback: configuredRedirectUri,
            requestedCallback: redirectUri,
          },
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    // Create a secure state token to prevent CSRF and carry callback continuity.
    const state = jwt.sign(
      { userId, type, redirectUri, orgId: requestOrgId, returnTo },
      STATE_SECRET,
      { expiresIn: "15m" },
    );

    const requiredRealOAuthConfig: Record<string, boolean> = {
      github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      slack: Boolean(process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET),
      linear: Boolean(process.env.LINEAR_CLIENT_ID && process.env.LINEAR_CLIENT_SECRET),
      jira: Boolean(process.env.JIRA_CLIENT_ID && process.env.JIRA_CLIENT_SECRET),
    };
    // Keep deterministic callback coverage in the test harness without allowing
    // production or normal local sessions to create fake provider connections.
    const allowMockOAuth = process.env.NODE_ENV === "test" || process.env.VITEST === "true";
    if (type in requiredRealOAuthConfig && !requiredRealOAuthConfig[type] && !allowMockOAuth) {
      sendApiError(
        res,
        503,
        {
          code: "OAUTH_NOT_CONFIGURED",
          message: `${type} real OAuth is not configured. Add the provider client ID and secret before connecting.`,
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    let authorizeUrl = "";

    // Helper to generate a mock callback URL for local dev / demos
    const getMockCallbackUrl = () => {
      const callbackUrl =
        redirectUri ||
        process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL ||
        "http://localhost:3000/api/connector/callback";
      const url = new URL(callbackUrl);
      url.searchParams.set("code", "mock_demo_code");
      url.searchParams.set("state", state);
      return url.toString();
    };

    if (type === "github") {
      authorizeUrl = allowMockOAuth && !requiredRealOAuthConfig.github
        ? getMockCallbackUrl()
        : GitHubClient.getAuthorizeUrl(state, redirectUri);
    } else if (type === "google_drive") {
      authorizeUrl = process.env.GOOGLE_CLIENT_ID
        ? GoogleClient.getAuthorizeUrl(state)
        : getMockCallbackUrl();
    } else if (type === "gmail") {
      authorizeUrl = process.env.GOOGLE_CLIENT_ID
        ? GmailClient.getAuthorizeUrl(state)
        : getMockCallbackUrl();
    } else if (type === "onedrive") {
      authorizeUrl = process.env.MICROSOFT_CLIENT_ID
        ? MicrosoftClient.getAuthorizeUrl(state)
        : getMockCallbackUrl();
    } else if (type === "slack") {
      authorizeUrl = allowMockOAuth && !requiredRealOAuthConfig.slack
        ? getMockCallbackUrl()
        : SlackClient.getAuthorizeUrl(state);
    } else if (type === "zendesk") {
      authorizeUrl = process.env.ZENDESK_CLIENT_ID
        ? ZendeskClient.getAuthorizeUrl(state)
        : getMockCallbackUrl();
    } else if (type === "jira") {
      authorizeUrl = allowMockOAuth && !requiredRealOAuthConfig.jira
        ? getMockCallbackUrl()
        : JiraClient.getAuthorizeUrl(state);
    } else if (type === "linear") {
      authorizeUrl = allowMockOAuth && !requiredRealOAuthConfig.linear
        ? getMockCallbackUrl()
        : LinearClient.getAuthorizeUrl(state);
    } else {
      sendApiError(
        res,
        400,
        {
          code: "INVALID_CONNECTOR",
          message: `OAuth for ${type} is not yet implemented.`,
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    sendApiSuccess(res, 200, { authorizeUrl }, buildApiMeta(req, startedAt));
  }),
);

/**
 * OAuth Callback handler.
 */
connectorRouter.get(
  "/callback",
  asyncHandler(async (req, res) => {
    const { code, state } = req.query;

    if (
      !code ||
      !state ||
      typeof code !== "string" ||
      typeof state !== "string"
    ) {
      res.status(400).send("Invalid callback parameters.");
      return;
    }

    try {
      // 1. Verify state
      const decoded = jwt.verify(state, STATE_SECRET) as {
        userId: string;
        type: string;
        redirectUri?: string;
        orgId?: string;
        returnTo?: string;
      };
      const { userId, type } = decoded;
      const oauthOrgId = normalizeOrgId(decoded.orgId);
      const connectorId = connectorStorageId(userId, type, oauthOrgId);
      if (type === "notion") {
        res.status(410).send("Notion connector is currently disabled.");
        return;
      }

      let accessToken = "";
      let googleRefreshToken: string | undefined;
      let jiraRefreshToken: string | undefined;
      if (code === "mock_demo_code") {
        accessToken = `mock_token_${type}_${Date.now()}`;
      } else if (type === "github") {
        accessToken = await GitHubClient.getAccessToken(
          code,
          decoded.redirectUri,
        );
      } else if (type === "google_drive") {
        const tokens = await GoogleClient.getAccessToken(code);
        accessToken = tokens.accessToken;
        googleRefreshToken = tokens.refreshToken;
      } else if (type === "gmail") {
        const tokens = await GmailClient.getAccessToken(code);
        accessToken = tokens.accessToken;
        googleRefreshToken = tokens.refreshToken;
      } else if (type === "onedrive") {
        accessToken = await MicrosoftClient.getAccessToken(code);
      } else if (type === "slack") {
        accessToken = await SlackClient.getAccessToken(code);
      } else if (type === "zendesk") {
        accessToken = await ZendeskClient.getAccessToken(code);
      } else if (type === "jira") {
        const tokens = await JiraClient.getOAuthTokens(code);
        accessToken = tokens.accessToken;
        jiraRefreshToken = tokens.refreshToken;
      } else if (type === "linear") {
        accessToken = await LinearClient.getAccessToken(code);
      } else {
        throw new Error(`Unsupported connector type: ${type}`);
      }

      // 2. Store or update connector in DB
      const tokenConfig: Record<string, unknown> = { accessToken };
      if ((type === "google_drive" || type === "gmail") && googleRefreshToken) {
        tokenConfig.refreshToken = googleRefreshToken;
      }
      if (type === "jira") {
        tokenConfig.authMode = "oauth";
        if (jiraRefreshToken) tokenConfig.refreshToken = jiraRefreshToken;
      }
      if (type === "linear") {
        tokenConfig.authMode = "oauth";
      }

      await prisma.connector.upsert({
        where: { id: connectorId },
        create: {
          id: connectorId,
          userId,
          orgId: oauthOrgId ?? null,
          type,
          name: type.charAt(0).toUpperCase() + type.slice(1),
          status: "connected",
          configJson: JSON.stringify(tokenConfig), // In prod, encrypt this!
          lastSyncAt: new Date().toISOString(),
        },
        update: {
          status: "connected",
          orgId: oauthOrgId ?? null,
          configJson: JSON.stringify(tokenConfig),
          updatedAt: new Date(),
        },
      });

      if (type === "github") {
        void patchCompanyBrainFunnelProgress(
          userId,
          { connectGithub: true },
          oauthOrgId ?? undefined,
        ).catch(() => undefined);
      }

      // 3. Trigger initial sync in background (never block OAuth callback response)
      if (!accessToken.startsWith("mock_token_")) {
        void (async () => {
          try {
            const result = await ConnectorManager.triggerSync(
              userId,
              type as ConnectorType,
              accessToken,
              undefined,
              undefined,
              tokenConfig,
            );
            const contractCounts = getContractCounts(result.contractCounts);
            const linearDiagnostics =
              type === "linear"
                ? (result as { diagnostics?: unknown }).diagnostics
                : undefined;
            await prisma.connector.update({
              where: { id: connectorId },
              data: {
                status: "connected",
                lastSyncAt: new Date().toISOString(),
                recordCount: { increment: result.extractedCount },
                configJson: JSON.stringify({
                  ...tokenConfig,
                  lastContractCounts: contractCounts,
                  lastSourceItemCount: result.sourceItemCount ?? 0,
                  recentItemKeys: Array.isArray(result.dedupeKeys)
                    ? result.dedupeKeys.slice(-500)
                    : [],
                  lastFailureAt: null,
                  lastFailureReason: null,
                  ...(linearDiagnostics && typeof linearDiagnostics === "object"
                    ? { lastLinearSyncDiagnostics: linearDiagnostics }
                    : {}),
                }),
              },
            });
            await updateFunnelAfterConnectorSync(
              userId,
              oauthOrgId ?? undefined,
              type,
              contractCounts,
            );
            await appendConnectorSyncLog(
              {
                id: `oauth-sync-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                userId,
                orgId: oauthOrgId ?? undefined,
                type,
                status: "success",
                extractedCount: result.extractedCount,
                contractCounts,
                message: `${type} initial sync completed; ${result.sourceItemCount ?? 0} provider records read.`,
                at: new Date().toISOString(),
              },
              oauthOrgId ?? undefined,
            );
            emitConnectorEvent({
              kind: "sync_log",
              userId,
              payload: {
                type,
                status: "success",
                extractedCount: result.extractedCount,
                sourceItemCount: result.sourceItemCount ?? 0,
                contractCounts,
                message: `${type} initial sync completed`,
                at: new Date().toISOString(),
              },
            });
          } catch (error) {
            console.error(
              `[ConnectorRouter] Initial ${type} sync failed:`,
              error,
            );
            const message =
              error instanceof Error ? error.message : "Initial sync failed";
            await prisma.connector
              .update({
                where: { id: connectorId },
                data: {
                  status: "error",
                  configJson: JSON.stringify({
                    ...tokenConfig,
                    lastFailureAt: new Date().toISOString(),
                    lastFailureReason: message,
                  }),
                },
              })
              .catch(() => undefined);
            await appendConnectorSyncLog(
              {
                id: `oauth-sync-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                userId,
                orgId: oauthOrgId ?? undefined,
                type,
                status: "error",
                extractedCount: 0,
                message,
                at: new Date().toISOString(),
              },
              oauthOrgId ?? undefined,
            ).catch(() => undefined);
            emitConnectorEvent({
              kind: "sync_log",
              userId,
              payload: {
                type,
                status: "error",
                message,
                at: new Date().toISOString(),
              },
            });
          }
        })();
      }
      emitConnectorEvent({
        kind: "connector_update",
        userId,
        payload: {
          type,
          status: "syncing",
          at: new Date().toISOString(),
        },
      });

      // 4. Complete OAuth in the popup tab. The opener remains on Mission
      // Control and refreshes from the connector event/polling path.
      const frontendUrl = decoded.redirectUri
        ? new URL(decoded.redirectUri).origin
        : process.env.OPENROUTER_HTTP_REFERER || "http://localhost:3000";
      const params = new URLSearchParams({ provider: type, status: "connected" });
      res.redirect(`${frontendUrl}/connector/callback-complete?${params.toString()}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown callback error";
      console.error("[ConnectorRouter] Callback error:", {
        message,
        connectorStatePresent: typeof state === "string" && state.length > 0,
        codePresent: typeof code === "string" && code.length > 0,
      });
      let frontendUrl =
        process.env.OPENROUTER_HTTP_REFERER || "http://localhost:3000";
      try {
        const decoded =
          typeof state === "string"
            ? (jwt.decode(state) as { redirectUri?: string; returnTo?: string } | null)
            : null;
        if (decoded?.redirectUri) {
          frontendUrl = new URL(decoded.redirectUri).origin;
        }
      } catch {
        // Keep the configured fallback.
      }
      const params = new URLSearchParams({
        provider: typeof state === "string" ? String((jwt.decode(state) as { type?: string } | null)?.type ?? "connector") : "connector",
        status: "error",
        detail: message.slice(0, 180),
      });
      res.redirect(`${frontendUrl}/connector/callback-complete?${params.toString()}`);
    }
  }),
);

/**
 * Trigger a real-time sync for a specific connector.
 */
connectorRouter.post(
  "/github/connect",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.authUserId;
    const orgId = req.authOrgId;
    const connectorId = connectorStorageId(userId, "github", orgId);
    const startedAt = Date.now();
    const body = (req.body ?? {}) as Record<string, unknown>;
    const accessToken =
      typeof body.accessToken === "string" ? body.accessToken.trim() : "";

    if (!accessToken) {
      sendApiError(
        res,
        400,
        {
          code: "GITHUB_TOKEN_INVALID",
          message: "accessToken is required for GitHub connect.",
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const tokenConfig: Record<string, unknown> = {
      authMode: "pat",
      accessToken,
    };

    await prisma.connector.upsert({
      where: { id: connectorId },
      create: {
        id: connectorId,
        userId,
        orgId: normalizeOrgId(orgId) ?? null,
        type: "github",
        name: "GitHub",
        status: "connected",
        configJson: JSON.stringify(tokenConfig),
        lastSyncAt: new Date().toISOString(),
      },
      update: {
        status: "connected",
        orgId: normalizeOrgId(orgId) ?? null,
        configJson: JSON.stringify(tokenConfig),
        updatedAt: new Date(),
      },
    });

    void patchCompanyBrainFunnelProgress(
      userId,
      { connectGithub: true },
      orgId ?? undefined,
    ).catch(() => undefined);

    sendApiSuccess(
      res,
      200,
      {
        message: "GitHub connected with access token. Initial sync queued.",
      },
      buildApiMeta(req, startedAt),
    );

    emitConnectorEvent({
      kind: "connector_update",
      userId,
      payload: {
        type: "github",
        status: "connected",
        at: new Date().toISOString(),
      },
    });

    void (async () => {
      try {
        const result = await ConnectorManager.triggerSync(
          userId,
          "github",
          accessToken,
          undefined,
          undefined,
          tokenConfig,
        );
        const contractCounts = getContractCounts(result.contractCounts);
        const dedupeKeys = Array.isArray(result.dedupeKeys)
          ? result.dedupeKeys
          : [];
        await prisma.connector.update({
          where: { id: connectorId },
          data: {
            status: "connected",
            lastSyncAt: new Date().toISOString(),
            recordCount: { increment: result.extractedCount },
            configJson: JSON.stringify({
              ...tokenConfig,
              ...(typeof result.checkpoint === "string"
                ? { lastCheckpointAt: result.checkpoint }
                : {}),
              recentItemKeys: dedupeKeys.slice(-500),
              repoFullNames: Array.isArray((result as { repoFullNames?: unknown }).repoFullNames)
                ? (result as { repoFullNames?: string[] }).repoFullNames?.filter(
                    (item): item is string => typeof item === "string" && item.includes("/"),
                  ).slice(-500) ?? []
                : [],
              repoPullRequestsByRepo:
                (result as { repoPullRequestsByRepo?: unknown }).repoPullRequestsByRepo &&
                typeof (result as { repoPullRequestsByRepo?: unknown }).repoPullRequestsByRepo === "object"
                  ? (result as { repoPullRequestsByRepo?: unknown }).repoPullRequestsByRepo
                  : {},
              lastContractCounts: contractCounts,
              retryCount: 0,
              lastFailureAt: null,
              lastFailureReason: null,
            }),
          },
        });
        await updateFunnelAfterConnectorSync(
          userId,
          orgId ?? undefined,
          "github",
          contractCounts,
        );
        await appendConnectorSyncLog(
          {
            id: randomUUID(),
            userId,
            type: "github",
            status: "success",
            extractedCount: result.extractedCount,
            message: `github initial token sync completed (attempts=${result.attempts ?? 1})`,
            at: new Date().toISOString(),
          },
          orgId,
        );
        emitConnectorEvent({
          kind: "sync_log",
          userId,
          payload: {
            type: "github",
            status: "success",
            extractedCount: result.extractedCount,
            contractCounts,
            message: "github initial token sync completed",
            at: new Date().toISOString(),
          },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Initial GitHub sync failed";
        await prisma.connector
          .update({
            where: { id: connectorId },
            data: {
              status: "connected",
              configJson: JSON.stringify({
                ...tokenConfig,
                lastFailureAt: new Date().toISOString(),
                lastFailureReason: message,
              }),
            },
          })
          .catch(() => undefined);
        await appendConnectorSyncLog(
          {
            id: randomUUID(),
            userId,
            type: "github",
            status: "error",
            extractedCount: 0,
            message,
            at: new Date().toISOString(),
          },
          orgId,
        );
        emitConnectorEvent({
          kind: "sync_log",
          userId,
          payload: {
            type: "github",
            status: "error",
            message,
            at: new Date().toISOString(),
          },
        });
      }
    })();
  }),
);

connectorRouter.post(
  "/jira/connect",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.authUserId;
    const orgId = req.authOrgId;
    const connectorId = connectorStorageId(userId, "jira", orgId);
    const startedAt = Date.now();
    const body = (req.body ?? {}) as Record<string, unknown>;
    const siteUrl = typeof body.siteUrl === "string" ? body.siteUrl.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const apiToken =
      typeof body.apiToken === "string" ? body.apiToken.trim() : "";
    const projectKeys = Array.isArray(body.projectKeys)
      ? body.projectKeys
          .map((item) =>
            typeof item === "string" ? item.trim().toUpperCase() : "",
          )
          .filter((item) => item.length > 0)
      : typeof body.projectKey === "string" && body.projectKey.trim()
        ? [body.projectKey.trim().toUpperCase()]
        : [];

    if (!siteUrl || !email || !apiToken) {
      sendApiError(
        res,
        400,
        {
          code: "JIRA_PAT_INVALID",
          message:
            "siteUrl, email, and apiToken are required for Jira PAT connect.",
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const tokenConfig: Record<string, unknown> = {
      authMode: "pat",
      siteUrl,
      email,
      accessToken: apiToken,
      projectKeys,
    };

    await prisma.connector.upsert({
      where: { id: connectorId },
      create: {
        id: connectorId,
        userId,
        orgId: normalizeOrgId(orgId) ?? null,
        type: "jira",
        name: "Jira",
        status: "connected",
        configJson: JSON.stringify(tokenConfig),
        lastSyncAt: new Date().toISOString(),
      },
      update: {
        status: "connected",
        orgId: normalizeOrgId(orgId) ?? null,
        configJson: JSON.stringify(tokenConfig),
        updatedAt: new Date(),
      },
    });

    sendApiSuccess(
      res,
      200,
      {
        message: "Jira connected with API token.",
        projectKeys,
      },
      buildApiMeta(req, startedAt),
    );

    void (async () => {
      try {
        const result = await ConnectorManager.triggerSync(
          userId,
          "jira",
          apiToken,
          undefined,
          undefined,
          tokenConfig,
        );
        const contractCounts = getContractCounts(result.contractCounts);
        const jiraDiagnostics = (result as { diagnostics?: unknown })
          .diagnostics;
        const cloudId = (result as { cloudId?: unknown }).cloudId;
        const browseBaseUrl = (result as { browseBaseUrl?: unknown })
          .browseBaseUrl;
        await prisma.connector.update({
          where: { id: connectorId },
          data: {
            status: "connected",
            lastSyncAt: new Date().toISOString(),
            configJson: JSON.stringify({
              ...tokenConfig,
              ...(typeof cloudId === "string" ? { cloudId } : {}),
              ...(typeof browseBaseUrl === "string" ? { browseBaseUrl } : {}),
              lastContractCounts: contractCounts,
              ...(jiraDiagnostics && typeof jiraDiagnostics === "object"
                ? { lastJiraSyncDiagnostics: jiraDiagnostics }
                : {}),
            }),
          },
        });
        await updateFunnelAfterConnectorSync(
          userId,
          orgId ?? undefined,
          "jira",
          contractCounts,
        );
        emitConnectorEvent({
          kind: "sync_log",
          userId,
          payload: {
            type: "jira",
            status: "success",
            extractedCount: result.extractedCount,
            contractCounts,
            message: "jira initial PAT sync completed",
            at: new Date().toISOString(),
          },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Initial sync failed";
        await prisma.connector
          .update({
            where: { id: connectorId },
            data: {
              status: "connected",
              configJson: JSON.stringify({
                ...tokenConfig,
                lastFailureAt: new Date().toISOString(),
                lastFailureReason: message,
              }),
            },
          })
          .catch(() => undefined);
        emitConnectorEvent({
          kind: "sync_log",
          userId,
          payload: {
            type: "jira",
            status: "error",
            message,
            at: new Date().toISOString(),
          },
        });
      }
    })();

    emitConnectorEvent({
      kind: "connector_update",
      userId,
      payload: {
        type: "jira",
        status: "connected",
        at: new Date().toISOString(),
      },
    });
  }),
);

connectorRouter.post(
  "/linear/connect",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.authUserId;
    const orgId = req.authOrgId;
    const connectorId = connectorStorageId(userId, "linear", orgId);
    const startedAt = Date.now();
    const body = (req.body ?? {}) as Record<string, unknown>;
    const accessToken =
      typeof body.accessToken === "string"
        ? body.accessToken.trim()
        : typeof body.apiKey === "string"
          ? body.apiKey.trim()
          : "";
    const teamKeys = Array.isArray(body.teamKeys)
      ? body.teamKeys
          .map((item) =>
            typeof item === "string" ? item.trim().toUpperCase() : "",
          )
          .filter((item) => item.length > 0)
      : typeof body.teamKey === "string" && body.teamKey.trim()
        ? [body.teamKey.trim().toUpperCase()]
        : [];

    if (!accessToken) {
      sendApiError(
        res,
        400,
        {
          code: "LINEAR_TOKEN_INVALID",
          message: "accessToken or apiKey is required for Linear connect.",
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const tokenConfig: Record<string, unknown> = {
      authMode: "api_key",
      accessToken,
      teamKeys,
    };

    await prisma.connector.upsert({
      where: { id: connectorId },
      create: {
        id: connectorId,
        userId,
        orgId: normalizeOrgId(orgId) ?? null,
        type: "linear",
        name: "Linear",
        status: "connected",
        configJson: JSON.stringify(tokenConfig),
        lastSyncAt: new Date().toISOString(),
      },
      update: {
        status: "connected",
        orgId: normalizeOrgId(orgId) ?? null,
        configJson: JSON.stringify(tokenConfig),
        updatedAt: new Date(),
      },
    });

    sendApiSuccess(
      res,
      200,
      {
        message: "Linear connected with API key.",
        teamKeys,
      },
      buildApiMeta(req, startedAt),
    );

    emitConnectorEvent({
      kind: "connector_update",
      userId,
      payload: {
        type: "linear",
        status: "connected",
        at: new Date().toISOString(),
      },
    });

    void (async () => {
      try {
        const result = await ConnectorManager.triggerSync(
          userId,
          "linear",
          accessToken,
          undefined,
          undefined,
          tokenConfig,
        );
        const contractCounts = getContractCounts(result.contractCounts);
        const linearDiagnostics = (result as { diagnostics?: unknown })
          .diagnostics;
        const dedupeKeys = Array.isArray(result.dedupeKeys)
          ? result.dedupeKeys
          : [];
        await prisma.connector.update({
          where: { id: connectorId },
          data: {
            status: "connected",
            lastSyncAt: new Date().toISOString(),
            recordCount: { increment: result.extractedCount },
            configJson: JSON.stringify({
              ...tokenConfig,
              ...(typeof result.checkpoint === "string"
                ? { lastCheckpointAt: result.checkpoint }
                : {}),
              recentItemKeys: dedupeKeys.slice(-500),
              lastContractCounts: contractCounts,
              ...(linearDiagnostics && typeof linearDiagnostics === "object"
                ? { lastLinearSyncDiagnostics: linearDiagnostics }
                : {}),
              retryCount: 0,
              lastFailureAt: null,
              lastFailureReason: null,
            }),
          },
        });
        await updateFunnelAfterConnectorSync(
          userId,
          orgId ?? undefined,
          "linear",
          contractCounts,
        );
        await appendConnectorSyncLog(
          {
            id: randomUUID(),
            userId,
            type: "linear",
            status: "success",
            extractedCount: result.extractedCount,
            contractCounts,
            message: `linear initial API key sync completed (attempts=${result.attempts ?? 1})`,
            at: new Date().toISOString(),
          },
          orgId,
        );
        emitConnectorEvent({
          kind: "sync_log",
          userId,
          payload: {
            type: "linear",
            status: "success",
            extractedCount: result.extractedCount,
            contractCounts,
            message: "linear initial API key sync completed",
            at: new Date().toISOString(),
          },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Initial Linear sync failed";
        await prisma.connector
          .update({
            where: { id: connectorId },
            data: {
              status: "connected",
              configJson: JSON.stringify({
                ...tokenConfig,
                lastFailureAt: new Date().toISOString(),
                lastFailureReason: message,
              }),
            },
          })
          .catch(() => undefined);
        await appendConnectorSyncLog(
          {
            id: randomUUID(),
            userId,
            type: "linear",
            status: "error",
            extractedCount: 0,
            message,
            at: new Date().toISOString(),
          },
          orgId,
        );
        emitConnectorEvent({
          kind: "sync_log",
          userId,
          payload: {
            type: "linear",
            status: "error",
            message,
            at: new Date().toISOString(),
          },
        });
      }
    })();
  }),
);

connectorRouter.post(
  "/local_files/connect",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.authUserId;
    const orgId = req.authOrgId;
    const connectorId = connectorStorageId(userId, "local_files", orgId);
    const startedAt = Date.now();
    const body = req.body as { rootPath?: unknown };
    let rootPath: string | undefined;
    try {
      rootPath = resolveLocalFilesRootPath(body.rootPath);
    } catch (error) {
      sendApiError(
        res,
        400,
        {
          code: "LOCAL_FILES_ROOT_INVALID",
          message:
            error instanceof Error
              ? error.message
              : "Invalid local files root.",
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const configJson = JSON.stringify({
      mode: "workspace",
      ...(rootPath ? { rootPath } : {}),
    });

    await prisma.connector.upsert({
      where: { id: connectorId },
      create: {
        id: connectorId,
        userId,
        orgId: normalizeOrgId(orgId) ?? null,
        type: "local_files",
        name: "Local Files",
        status: "connected",
        configJson,
        lastSyncAt: new Date().toISOString(),
      },
      update: {
        status: "connected",
        orgId: normalizeOrgId(orgId) ?? null,
        configJson,
        updatedAt: new Date(),
      },
    });

    sendApiSuccess(
      res,
      200,
      {
        message: "Local Files connector enabled.",
        rootPath: rootPath ?? process.cwd(),
      },
      buildApiMeta(req, startedAt),
    );
    emitConnectorEvent({
      kind: "connector_update",
      userId,
      payload: {
        type: "local_files",
        status: "connected",
        at: new Date().toISOString(),
      },
    });
  }),
);

connectorRouter.post(
  "/:type/connect",
  requireAuth,
  asyncHandler(async (req, res) => {
    const type = toSingleString(req.params.type);
    const userId = req.authUserId;
    const orgId = req.authOrgId;
    const startedAt = Date.now();

    if (!isEngineeringSignalConnectorType(type)) {
      sendApiError(
        res,
        400,
        {
          code: "CONNECTOR_CONNECT_UNSUPPORTED",
          message: `${type} does not support direct workspace connect.`,
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const body = req.body as { rootPath?: unknown };

    if (type === "ci_cd_logs" && typeof body.rootPath !== "string") {
      const githubConnector = await prisma.connector.findUnique({
        where: { id: connectorStorageId(userId, "github", orgId) },
      });
      const githubConfig = getConnectorConfig(githubConnector?.configJson);
      const githubAccessToken =
        githubConnector?.status === "connected" &&
        typeof githubConfig.accessToken === "string"
          ? githubConfig.accessToken
          : undefined;
      if (!githubAccessToken) {
        sendApiError(
          res,
          409,
          {
            code: "GITHUB_REQUIRED",
            message:
              "Connect GitHub first. CI/CD logs use GitHub Actions for the Phase 1 live connector.",
          },
          buildApiMeta(req, startedAt),
        );
        return;
      }

      const connectorId = connectorStorageId(userId, type, orgId);
      const configJson = JSON.stringify({
        mode: "api",
        provider: "github_actions",
        sourceConnector: "github",
        sourceConnectorId: githubConnector?.id,
        accessToken: githubAccessToken,
      });

      await prisma.connector.upsert({
        where: { id: connectorId },
        create: {
          id: connectorId,
          userId,
          orgId: normalizeOrgId(orgId) ?? null,
          type,
          name: workspaceConnectorDisplayName(type),
          status: "connected",
          configJson,
          lastSyncAt: new Date().toISOString(),
        },
        update: {
          status: "connected",
          orgId: normalizeOrgId(orgId) ?? null,
          configJson,
          updatedAt: new Date(),
        },
      });

      sendApiSuccess(
        res,
        200,
        {
          message: "CI/CD Logs connected through GitHub Actions.",
          provider: "github_actions",
        },
        buildApiMeta(req, startedAt),
      );
      emitConnectorEvent({
        kind: "connector_update",
        userId,
        payload: {
          type,
          status: "connected",
          at: new Date().toISOString(),
        },
      });
      return;
    }

    if (type === "deployment_errors" && typeof body.rootPath !== "string") {
      const requestBody = req.body as {
        accessToken?: unknown;
        orgSlug?: unknown;
        projectSlugs?: unknown;
        baseUrl?: unknown;
      };
      const accessToken =
        typeof requestBody.accessToken === "string" &&
        requestBody.accessToken.trim()
          ? requestBody.accessToken.trim()
          : process.env.SENTRY_AUTH_TOKEN;
      const orgSlug =
        typeof requestBody.orgSlug === "string" && requestBody.orgSlug.trim()
          ? requestBody.orgSlug.trim()
          : process.env.SENTRY_ORG_SLUG;
      const projectSlugs = Array.isArray(requestBody.projectSlugs)
        ? requestBody.projectSlugs.filter(
            (item): item is string =>
              typeof item === "string" && item.trim().length > 0,
          )
        : (process.env.SENTRY_PROJECT_SLUGS || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
      const baseUrl =
        typeof requestBody.baseUrl === "string" && requestBody.baseUrl.trim()
          ? requestBody.baseUrl.trim()
          : process.env.SENTRY_API_BASE_URL;

      if (!accessToken || !orgSlug) {
        sendApiError(
          res,
          409,
          {
            code: "SENTRY_CONFIG_REQUIRED",
            message:
              "Configure SENTRY_AUTH_TOKEN and SENTRY_ORG_SLUG before connecting Deployment errors.",
          },
          buildApiMeta(req, startedAt),
        );
        return;
      }

      const connectorId = connectorStorageId(userId, type, orgId);
      const configJson = JSON.stringify({
        mode: "api",
        provider: "sentry",
        accessToken,
        orgSlug,
        projectSlugs,
        ...(baseUrl ? { baseUrl } : {}),
      });

      await prisma.connector.upsert({
        where: { id: connectorId },
        create: {
          id: connectorId,
          userId,
          orgId: normalizeOrgId(orgId) ?? null,
          type,
          name: workspaceConnectorDisplayName(type),
          status: "connected",
          configJson,
          lastSyncAt: new Date().toISOString(),
        },
        update: {
          status: "connected",
          orgId: normalizeOrgId(orgId) ?? null,
          configJson,
          updatedAt: new Date(),
        },
      });

      sendApiSuccess(
        res,
        200,
        {
          message: "Deployment errors connected through Sentry.",
          provider: "sentry",
          projectSlugs,
        },
        buildApiMeta(req, startedAt),
      );
      emitConnectorEvent({
        kind: "connector_update",
        userId,
        payload: {
          type,
          status: "connected",
          at: new Date().toISOString(),
        },
      });
      return;
    }

    if (type === "devin_chats" && typeof body.rootPath !== "string") {
      const requestBody = req.body as {
        accessToken?: unknown;
        token?: unknown;
        devinOrgId?: unknown;
        orgId?: unknown;
        baseUrl?: unknown;
      };
      const accessToken =
        typeof requestBody.accessToken === "string" &&
        requestBody.accessToken.trim()
          ? requestBody.accessToken.trim()
          : typeof requestBody.token === "string" && requestBody.token.trim()
            ? requestBody.token.trim()
            : process.env.DEVIN_SERVICE_USER_TOKEN ||
              process.env.DEVIN_API_TOKEN;
      const devinOrgId =
        typeof requestBody.devinOrgId === "string" &&
        requestBody.devinOrgId.trim()
          ? requestBody.devinOrgId.trim()
          : typeof requestBody.orgId === "string" && requestBody.orgId.trim()
            ? requestBody.orgId.trim()
            : process.env.DEVIN_ORG_ID;
      const baseUrl =
        typeof requestBody.baseUrl === "string" && requestBody.baseUrl.trim()
          ? requestBody.baseUrl.trim()
          : process.env.DEVIN_API_BASE_URL;

      if (!accessToken || !devinOrgId) {
        sendApiError(
          res,
          409,
          {
            code: "DEVIN_CONFIG_REQUIRED",
            message:
              "Configure DEVIN_SERVICE_USER_TOKEN and DEVIN_ORG_ID before connecting Devin.",
          },
          buildApiMeta(req, startedAt),
        );
        return;
      }

      const connectorId = connectorStorageId(userId, type, orgId);
      const configJson = JSON.stringify({
        mode: "api",
        provider: "devin",
        accessToken,
        devinOrgId,
        ...(baseUrl ? { baseUrl } : {}),
      });

      await prisma.connector.upsert({
        where: { id: connectorId },
        create: {
          id: connectorId,
          userId,
          orgId: normalizeOrgId(orgId) ?? null,
          type,
          name: workspaceConnectorDisplayName(type),
          status: "connected",
          configJson,
          lastSyncAt: new Date().toISOString(),
        },
        update: {
          status: "connected",
          orgId: normalizeOrgId(orgId) ?? null,
          configJson,
          updatedAt: new Date(),
        },
      });

      sendApiSuccess(
        res,
        200,
        {
          message: "Devin connected through the Devin API.",
          provider: "devin",
          devinOrgId,
        },
        buildApiMeta(req, startedAt),
      );
      emitConnectorEvent({
        kind: "connector_update",
        userId,
        payload: {
          type,
          status: "connected",
          at: new Date().toISOString(),
        },
      });
      return;
    }

    const connectorId = connectorStorageId(userId, type, orgId);
    let rootPath: string | undefined;
    try {
      rootPath = resolveLocalFilesRootPath(body.rootPath);
    } catch (error) {
      sendApiError(
        res,
        400,
        {
          code: "WORKSPACE_SIGNAL_ROOT_INVALID",
          message:
            error instanceof Error
              ? error.message
              : "Invalid workspace signal root.",
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const resolvedRoot = rootPath ?? defaultWorkspaceConnectorRoot(type);
    if (isEngineeringSignalConnectorType(type)) {
      mkdirSync(resolvedRoot, { recursive: true });
    }

    const configJson = JSON.stringify({
      mode: "workspace",
      rootPath: resolvedRoot,
      ...(isEngineeringSignalConnectorType(type)
        ? { liveWatchEnabled: true }
        : {}),
    });

    await prisma.connector.upsert({
      where: { id: connectorId },
      create: {
        id: connectorId,
        userId,
        orgId: normalizeOrgId(orgId) ?? null,
        type,
        name: workspaceConnectorDisplayName(type),
        status: "connected",
        configJson,
        lastSyncAt: new Date().toISOString(),
      },
      update: {
        status: "connected",
        orgId: normalizeOrgId(orgId) ?? null,
        configJson,
        updatedAt: new Date(),
      },
    });

    sendApiSuccess(
      res,
      200,
      {
        message: `${workspaceConnectorDisplayName(type)} connector enabled.`,
        rootPath: resolvedRoot,
        liveWatchEnabled: isEngineeringSignalConnectorType(type),
      },
      buildApiMeta(req, startedAt),
    );
    emitConnectorEvent({
      kind: "connector_update",
      userId,
      payload: {
        type,
        status: "connected",
        at: new Date().toISOString(),
      },
    });
  }),
);

connectorRouter.post(
  "/:type/upload",
  requireAuth,
  asyncHandler(async (req, res) => {
    const type = toSingleString(req.params.type);
    const userId = req.authUserId;
    const orgId = req.authOrgId;
    const startedAt = Date.now();

    if (!isEngineeringSignalConnectorType(type)) {
      sendApiError(
        res,
        400,
        {
          code: "EXPORT_UPLOAD_UNSUPPORTED",
          message: `${type} does not support export upload.`,
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const body = req.body as {
      filename?: unknown;
      content?: unknown;
    };
    const filename = typeof body.filename === "string" ? body.filename : "";
    const content = typeof body.content === "string" ? body.content : "";
    if (!filename.trim() || !content.trim()) {
      sendApiError(
        res,
        400,
        {
          code: "EXPORT_UPLOAD_INVALID",
          message: "filename and content are required.",
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const connectorId = connectorStorageId(userId, type, orgId);
    const existing = await prisma.connector.findUnique({
      where: { id: connectorId },
    });
    const existingConfig = getConnectorConfig(existing?.configJson);
    const uploadRootPath =
      typeof existingConfig.uploadRootPath === "string"
        ? existingConfig.uploadRootPath
        : typeof existingConfig.rootPath === "string" &&
            existingConfig.mode !== "api"
          ? existingConfig.rootPath
          : defaultEngineeringSignalRoot(type);

    let upload;
    try {
      upload = writeEngineeringSignalExportUpload({
        type,
        rootPath: uploadRootPath,
        filename,
        content,
      });
    } catch (error) {
      sendApiError(
        res,
        400,
        {
          code: "EXPORT_UPLOAD_WRITE_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Could not write export upload.",
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const recentItemKeys = Array.isArray(existingConfig.uploadRecentItemKeys)
      ? existingConfig.uploadRecentItemKeys.filter(
          (item): item is string => typeof item === "string",
        )
      : Array.isArray(existingConfig.recentItemKeys) &&
          existingConfig.mode !== "api"
        ? existingConfig.recentItemKeys.filter(
            (item): item is string => typeof item === "string",
          )
        : [];

    try {
      await prisma.connector.upsert({
        where: { id: connectorId },
        create: {
          id: connectorId,
          userId,
          orgId: normalizeOrgId(orgId) ?? null,
          type,
          name: workspaceConnectorDisplayName(type),
          status: "syncing",
          configJson: JSON.stringify({
            mode: "workspace",
            rootPath: upload.rootPath,
            uploadRootPath: upload.rootPath,
            syncStartedAt: new Date().toISOString(),
          }),
          lastSyncAt: new Date().toISOString(),
        },
        update: {
          status: "syncing",
          orgId: normalizeOrgId(orgId) ?? null,
          configJson: JSON.stringify({
            ...existingConfig,
            uploadRootPath: upload.rootPath,
            syncStartedAt: new Date().toISOString(),
          }),
          updatedAt: new Date(),
        },
      });

      const result = await EngineeringSignalFilesClient.sync({
        userId,
        type,
        rootPath: upload.rootPath,
        recentItemKeys,
      });
      const extractedCount = result.extractedCount;
      const contractCounts = getContractCounts(result.contractCounts);
      const dedupeKeys = Array.isArray(result.dedupeKeys)
        ? result.dedupeKeys
        : [];
      const nextRecentItemKeys = Array.from(
        new Set([...recentItemKeys, ...dedupeKeys]),
      ).slice(-500);

      const quota = await canConsumeConnectorSyncRecords({
        userId,
        amount: extractedCount,
      });
      if (!quota.allowed) {
        throw new Error(
          `Connector sync record limit reached for ${quota.plan}.`,
        );
      }
      await consumeConnectorSyncRecords({ userId, amount: extractedCount });
      await updateFunnelAfterConnectorSync(userId, orgId, type, contractCounts);

      await prisma.connector.update({
        where: { id: connectorId },
        data: {
          status: "connected",
          lastSyncAt: new Date().toISOString(),
          recordCount: { increment: extractedCount },
          configJson: JSON.stringify({
            ...existingConfig,
            ...(existingConfig.mode !== "api"
              ? { mode: "workspace", rootPath: upload.rootPath }
              : {}),
            uploadRootPath: upload.rootPath,
            uploadRecentItemKeys: nextRecentItemKeys,
            lastContractCounts: {
              ...getContractCounts(existingConfig.lastContractCounts),
              ...contractCounts,
            },
            lastCheckpointAt: new Date().toISOString(),
            syncStartedAt: null,
            lastFailureAt: null,
            lastFailureReason: null,
          }),
        },
      });

      await appendConnectorSyncLog(
        {
          id: randomUUID(),
          userId,
          type,
          status: "success",
          extractedCount,
          contractCounts,
          message: `Uploaded ${filename} into ${workspaceConnectorDisplayName(type)} (${extractedCount} memories).`,
          at: new Date().toISOString(),
        },
        orgId,
      );
      emitConnectorEvent({
        kind: "connector_update",
        userId,
        payload: {
          type,
          status: "connected",
          extractedCount,
          at: new Date().toISOString(),
        },
      });
      emitConnectorEvent({
        kind: "sync_log",
        userId,
        payload: {
          type,
          status: "success",
          extractedCount,
          contractCounts,
          message: `Uploaded ${filename} into ${workspaceConnectorDisplayName(type)}.`,
          at: new Date().toISOString(),
        },
      });

      sendApiSuccess(
        res,
        200,
        {
          message: `${workspaceConnectorDisplayName(type)} export uploaded.`,
          extractedCount,
          contractCounts,
          rootPath: upload.rootPath,
          relativePath: upload.relativePath,
          sizeBytes: upload.sizeBytes,
        },
        buildApiMeta(req, startedAt),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Export upload sync failed.";
      await prisma.connector
        .update({
          where: { id: connectorId },
          data: {
            status: "connected",
            configJson: JSON.stringify({
              ...existingConfig,
              uploadRootPath: upload.rootPath,
              syncStartedAt: null,
              lastFailureAt: new Date().toISOString(),
              lastFailureReason: message,
            }),
          },
        })
        .catch(() => undefined);
      await appendConnectorSyncLog(
        {
          id: randomUUID(),
          userId,
          type,
          status: "error",
          extractedCount: 0,
          message,
          at: new Date().toISOString(),
        },
        orgId,
      );
      sendApiError(
        res,
        400,
        {
          code: "EXPORT_UPLOAD_SYNC_FAILED",
          message,
        },
        buildApiMeta(req, startedAt),
      );
    }
  }),
);

connectorRouter.post(
  "/:type/disconnect",
  requireAuth,
  asyncHandler(async (req, res) => {
    const type = toSingleString(req.params.type);
    const userId = req.authUserId;
    let requestOrgId = readOrgIdFromRequest(req) ?? req.authOrgId;
    if (!requestOrgId) {
      const existingScoped = await prisma.connector.findFirst({
        where: { userId, type, orgId: { not: null } },
        orderBy: { updatedAt: "desc" },
        select: { orgId: true },
      });
      requestOrgId = existingScoped?.orgId ?? undefined;
    }
    await reconcileLegacyConnectorScope(userId, requestOrgId);
    const connectorId = connectorStorageId(userId, type, requestOrgId);
    const startedAt = Date.now();

    const connector = await prisma.connector.findUnique({
      where: { id: connectorId },
    });
    if (!connector) {
      sendApiSuccess(
        res,
        200,
        { message: `${type} was not connected.` },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const config = getConnectorConfig(connector.configJson);
    const restConfig = { ...config };
    delete restConfig.accessToken;
    delete restConfig.refreshToken;
    delete restConfig.tokenType;
    delete restConfig.scope;
    delete restConfig.syncStartedAt;

    await prisma.connector.update({
      where: { id: connectorId },
      data: {
        status: "not_connected",
        recordCount: 0,
        lastSyncAt: null,
        configJson: JSON.stringify(restConfig),
      },
    });

    emitConnectorEvent({
      kind: "connector_update",
      userId,
      payload: {
        type,
        status: "not_connected",
        at: new Date().toISOString(),
      },
    });

    sendApiSuccess(
      res,
      200,
      { message: `Disconnected ${type}.` },
      buildApiMeta(req, startedAt),
    );
  }),
);

connectorRouter.post(
  "/:type/unlock",
  requireAuth,
  asyncHandler(async (req, res) => {
    const type = toSingleString(req.params.type);
    const userId = req.authUserId;
    const connectorId = connectorStorageId(userId, type, req.authOrgId);
    const startedAt = Date.now();
    if (type === "notion") {
      sendApiError(
        res,
        410,
        {
          code: "CONNECTOR_DISABLED",
          message: "Notion connector is currently disabled.",
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const connector = await prisma.connector.findUnique({
      where: { id: connectorId },
    });
    if (!connector) {
      sendApiError(
        res,
        404,
        {
          code: "NOT_FOUND",
          message: `Connector ${type} not found.`,
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const config = getConnectorConfig(connector.configJson);
    await prisma.connector.update({
      where: { id: connectorId },
      data: {
        status: "connected",
        configJson: JSON.stringify({
          ...config,
          syncStartedAt: null,
        }),
      },
    });

    await appendConnectorSyncLog(
      {
        id: randomUUID(),
        userId,
        type,
        status: "success",
        extractedCount: 0,
        message: `Sync lock cleared for ${type}`,
        at: new Date().toISOString(),
      },
      req.authOrgId,
    );
    emitConnectorEvent({
      kind: "sync_log",
      userId,
      payload: {
        type,
        status: "success",
        message: `Sync lock cleared for ${type}`,
        at: new Date().toISOString(),
      },
    });

    sendApiSuccess(
      res,
      200,
      { message: `Unlocked ${type}.` },
      buildApiMeta(req, startedAt),
    );
  }),
);

connectorRouter.post(
  "/:type/sync",
  requireAuth,
  asyncHandler(async (req, res) => {
    const type = toSingleString(req.params.type);
    const userId = req.authUserId;
    const scopedOrgId = req.authOrgId;
    const scopedConnectorId = connectorStorageId(userId, type, scopedOrgId);
    const startedAt = Date.now();
    if (type === "notion") {
      sendApiError(
        res,
        410,
        {
          code: "CONNECTOR_DISABLED",
          message: "Notion connector is currently disabled.",
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const typed = type as ConnectorType;
    const bypassPlanGate = typed === DEFAULT_MEMORY_PIPELINE_CONNECTOR;
    if (!bypassPlanGate && !(await isConnectorAllowedByPlan(userId, typed))) {
      const plan = (await getBillingStateForUser(userId)).plan;
      sendApiError(
        res,
        402,
        {
          code: "UPGRADE_REQUIRED",
          message: `${type} connector requires Pro or higher.`,
          details: { connector: type, currentPlan: plan, minimumPlan: "Pro" },
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    // Return immediately so frontend/proxy never waits on connector sync work.
    sendApiSuccess(
      res,
      202,
      {
        message: `Sync queued for ${type}.`,
      },
      buildApiMeta(req, startedAt),
    );

    void (async () => {
      try {
        const connector = await prisma.connector.findUnique({
          where: { id: scopedConnectorId },
        });

        if (
          !connector ||
          (connector.status !== "connected" &&
            connector.status !== "syncing" &&
            connector.status !== "error")
        ) {
          await appendConnectorSyncLog(
            {
              id: randomUUID(),
              userId,
              type,
              status: "error",
              extractedCount: 0,
              message: `${type} is not connected or requires re-authentication.`,
              at: new Date().toISOString(),
            },
            scopedOrgId,
          );
          return;
        }

        const config = getConnectorConfig(connector.configJson);
        const accessToken =
          typeof config.accessToken === "string"
            ? config.accessToken
            : undefined;
        const apiBackedEngineeringSignal =
          isWorkspaceFileConnector(type) && typeof config.provider === "string";
        const permissionBlocker = connectorPermissionBlockerMessage({
          type,
          permissions: buildConnectorPermissionDiagnostics({
            type,
            allowed: true,
            config,
            status: connector.status,
            apiBackedEngineeringSignal,
            isWorkspaceConnector: isWorkspaceFileConnector(type),
            orgId: scopedOrgId,
          }),
        });
        if (permissionBlocker) {
          throw new Error(permissionBlocker);
        }
        const previousCheckpoint =
          typeof config.lastCheckpointAt === "string"
            ? config.lastCheckpointAt
            : undefined;
        const recentItemKeys = Array.isArray(config.recentItemKeys)
          ? config.recentItemKeys.filter(
              (item): item is string => typeof item === "string",
            )
          : [];
        const syncStartedAt =
          typeof config.syncStartedAt === "string"
            ? config.syncStartedAt
            : undefined;
        let syncAttempts = 1;
        const isLocked =
          connector.status === "syncing" &&
          syncStartedAt &&
          Date.now() - new Date(syncStartedAt).getTime() <
            CONNECTOR_SYNC_LOCK_MS;
        if (isLocked) {
          await appendConnectorSyncLog(
            {
              id: randomUUID(),
              userId,
              type,
              status: "error",
              extractedCount: 0,
              message: `${type} sync is already running.`,
              at: new Date().toISOString(),
            },
            scopedOrgId,
          );
          return;
        }

        await prisma.connector.update({
          where: { id: connector.id },
          data: {
            status: "syncing",
            configJson: JSON.stringify({
              ...config,
              syncStartedAt: new Date().toISOString(),
            }),
          },
        });

        try {
          let extractedCount = 0;
          let checkpoint: string | undefined;
          let dedupeKeys: string[] = [];
          let contractCounts: Record<string, number> = {};
          let repoFullNames: string[] = [];
          let repoPullRequestsByRepo: Record<string, unknown> = {};
          if (type === "ci_cd_logs" && config.provider === "github_actions") {
            if (!accessToken) {
              throw new Error(
                "GitHub Actions token missing. Reconnect GitHub, then reconnect CI/CD logs.",
              );
            }
            const result = await ConnectorManager.triggerSync(
              userId,
              type as ConnectorType,
              accessToken,
              previousCheckpoint,
              recentItemKeys,
              config,
            );
            extractedCount = result.extractedCount;
            checkpoint =
              typeof result.checkpoint === "string"
                ? result.checkpoint
                : undefined;
            dedupeKeys = Array.isArray(result.dedupeKeys)
              ? result.dedupeKeys
              : [];
            syncAttempts =
              typeof result.attempts === "number" ? result.attempts : 1;
            contractCounts = getContractCounts(result.contractCounts);
            const githubActionsDiagnostics = (
              result as unknown as { diagnostics?: unknown }
            ).diagnostics;
            if (
              githubActionsDiagnostics &&
              typeof githubActionsDiagnostics === "object"
            ) {
              config.lastGitHubActionsSyncDiagnostics =
                githubActionsDiagnostics;
            }
          } else if (
            type === "deployment_errors" &&
            config.provider === "sentry"
          ) {
            if (!accessToken) {
              throw new Error(
                "Sentry token missing. Configure Sentry and reconnect Deployment errors.",
              );
            }
            const result = await ConnectorManager.triggerSync(
              userId,
              type as ConnectorType,
              accessToken,
              previousCheckpoint,
              recentItemKeys,
              config,
            );
            extractedCount = result.extractedCount;
            checkpoint =
              typeof result.checkpoint === "string"
                ? result.checkpoint
                : undefined;
            dedupeKeys = Array.isArray(result.dedupeKeys)
              ? result.dedupeKeys
              : [];
            syncAttempts =
              typeof result.attempts === "number" ? result.attempts : 1;
            contractCounts = getContractCounts(result.contractCounts);
            const sentryDiagnostics = (
              result as unknown as { diagnostics?: unknown }
            ).diagnostics;
            if (sentryDiagnostics && typeof sentryDiagnostics === "object") {
              config.lastSentrySyncDiagnostics = sentryDiagnostics;
            }
          } else if (isWorkspaceFileConnector(type)) {
            const result = await ConnectorManager.triggerSync(
              userId,
              type,
              undefined,
              undefined,
              recentItemKeys,
              config,
            );
            extractedCount = result.extractedCount;
            dedupeKeys = Array.isArray(result.dedupeKeys)
              ? result.dedupeKeys
              : [];
            syncAttempts =
              typeof result.attempts === "number" ? result.attempts : 1;
            contractCounts = getContractCounts(result.contractCounts);
          } else if (accessToken && accessToken.startsWith("mock_token_")) {
            extractedCount = Math.floor(Math.random() * 20) + 5;
            checkpoint = new Date().toISOString();
            contractCounts = {};
          } else {
            if (!accessToken) {
              throw new Error(
                `${type} access token missing. Reconnect this source.`,
              );
            }
            let syncToken = accessToken;
            if (
              (type === "google_drive" || type === "gmail") &&
              typeof config.refreshToken === "string" &&
              config.refreshToken.length > 0
            ) {
              try {
                const refreshed =
                  type === "gmail"
                    ? await GmailClient.refreshAccessToken(config.refreshToken)
                    : await GoogleClient.refreshAccessToken(
                        config.refreshToken,
                      );
                if (type === "gmail") {
                  syncToken = refreshed.accessToken;
                  config.accessToken = refreshed.accessToken;
                  if (refreshed.refreshToken)
                    config.refreshToken = refreshed.refreshToken;
                  config.lastTokenRefreshAt = new Date().toISOString();
                } else {
                  syncToken = refreshed.accessToken;
                  config.accessToken = refreshed.accessToken;
                  if (refreshed.refreshToken)
                    config.refreshToken = refreshed.refreshToken;
                  config.lastTokenRefreshAt = new Date().toISOString();
                }
              } catch {
                // fall back to existing token; sync path will surface auth error if expired
              }
            }
            const result = await ConnectorManager.triggerSync(
              userId,
              type as ConnectorType,
              syncToken,
              previousCheckpoint,
              recentItemKeys,
              config,
            );
            extractedCount = result.extractedCount;
            checkpoint =
              typeof result.checkpoint === "string"
                ? result.checkpoint
                : undefined;
            dedupeKeys = Array.isArray(result.dedupeKeys)
              ? result.dedupeKeys
              : [];
            syncAttempts =
              typeof result.attempts === "number" ? result.attempts : 1;
            contractCounts = getContractCounts(result.contractCounts);
            if (type === "slack") {
              const slackCursor = (result as unknown as { cursor?: unknown })
                .cursor;
              const slackLastMessageTs = (
                result as unknown as { lastMessageTs?: unknown }
              ).lastMessageTs;
              const slackDiagnostics = (
                result as unknown as { diagnostics?: unknown }
              ).diagnostics;
              if (typeof slackCursor === "string" && slackCursor.length > 0)
                config.cursor = slackCursor;
              if (
                typeof slackLastMessageTs === "string" &&
                slackLastMessageTs.length > 0
              )
                config.lastMessageTs = slackLastMessageTs;
              if (slackDiagnostics && typeof slackDiagnostics === "object") {
                config.lastSlackSyncDiagnostics = slackDiagnostics;
              }
            }
            if (type === "gmail") {
              const gmailLastMessageId = (
                result as unknown as { lastMessageId?: unknown }
              ).lastMessageId;
              const gmailLastCheckpointEpochMs = (
                result as unknown as { lastCheckpointEpochMs?: unknown }
              ).lastCheckpointEpochMs;
              if (
                typeof gmailLastMessageId === "string" &&
                gmailLastMessageId.length > 0
              )
                config.lastMessageId = gmailLastMessageId;
              if (typeof gmailLastCheckpointEpochMs === "number")
                config.lastCheckpointEpochMs = gmailLastCheckpointEpochMs;
            }
            if (type === "jira") {
              const jiraDiagnostics = (
                result as unknown as { diagnostics?: unknown }
              ).diagnostics;
              const cloudId = (result as unknown as { cloudId?: unknown })
                .cloudId;
              const browseBaseUrl = (
                result as unknown as { browseBaseUrl?: unknown }
              ).browseBaseUrl;
              if (jiraDiagnostics && typeof jiraDiagnostics === "object") {
                config.lastJiraSyncDiagnostics = jiraDiagnostics;
              }
              if (typeof cloudId === "string" && cloudId.length > 0)
                config.cloudId = cloudId;
              if (typeof browseBaseUrl === "string" && browseBaseUrl.length > 0)
                config.browseBaseUrl = browseBaseUrl;
            }
            if (type === "linear") {
              const linearDiagnostics = (
                result as unknown as { diagnostics?: unknown }
              ).diagnostics;
              if (linearDiagnostics && typeof linearDiagnostics === "object") {
                config.lastLinearSyncDiagnostics = linearDiagnostics;
              }
            }
            if (type === "devin_chats") {
              const devinDiagnostics = (
                result as unknown as { diagnostics?: unknown }
              ).diagnostics;
              if (devinDiagnostics && typeof devinDiagnostics === "object") {
                config.lastDevinSyncDiagnostics = devinDiagnostics;
              }
            }
            repoFullNames = Array.isArray((result as { repoFullNames?: unknown }).repoFullNames)
              ? (result as { repoFullNames?: string[] }).repoFullNames?.filter(
                  (item): item is string => typeof item === "string" && item.includes("/"),
                ).slice(-500) ?? []
              : [];
            repoPullRequestsByRepo =
              (result as { repoPullRequestsByRepo?: unknown }).repoPullRequestsByRepo &&
              typeof (result as { repoPullRequestsByRepo?: unknown }).repoPullRequestsByRepo === "object"
                ? (result as { repoPullRequestsByRepo?: unknown }).repoPullRequestsByRepo as Record<string, unknown>
                : {};
          }
          const nextRecentItemKeys = Array.from(
            new Set([...recentItemKeys, ...dedupeKeys]),
          ).slice(-500);
          const quota = await canConsumeConnectorSyncRecords({
            userId,
            amount: extractedCount,
          });
          if (!quota.allowed) {
            throw new Error(
              `Connector sync record limit reached for ${quota.plan}.`,
            );
          }
          const consumed = await consumeConnectorSyncRecords({
            userId,
            amount: extractedCount,
          });

          await prisma.connector.update({
            where: { id: connector.id },
            data: {
              status: "connected",
              lastSyncAt: new Date().toISOString(),
              recordCount: { increment: extractedCount },
              configJson: JSON.stringify({
                ...config,
                ...(checkpoint ? { lastCheckpointAt: checkpoint } : {}),
                recentItemKeys: nextRecentItemKeys,
                repoFullNames,
                repoPullRequestsByRepo,
                lastContractCounts: contractCounts,
                syncStartedAt: null,
                retryCount: 0,
                lastFailureAt: null,
                lastFailureReason: null,
              }),
            },
          });

          const syncLogMessage =
            type === "slack" &&
            config.lastSlackSyncDiagnostics &&
            typeof config.lastSlackSyncDiagnostics === "object"
              ? (() => {
                  const stats = config.lastSlackSyncDiagnostics as {
                    channelsSynced?: number;
                    channelsListed?: number;
                    messagesSeen?: number;
                    messagesSkipped?: number;
                    historyErrors?: string[];
                  };
                  const channels = `${stats.channelsSynced ?? 0}/${stats.channelsListed ?? 0}`;
                  const errors =
                    Array.isArray(stats.historyErrors) &&
                    stats.historyErrors.length > 0
                      ? `; channel_errors=${stats.historyErrors.length}`
                      : "";
                  return `Sync completed for slack (attempts=${syncAttempts}); channels=${channels}; messages=${stats.messagesSeen ?? 0}; skipped=${stats.messagesSkipped ?? 0}${errors}`;
                })()
              : type === "jira" &&
                  config.lastJiraSyncDiagnostics &&
                  typeof config.lastJiraSyncDiagnostics === "object"
                ? (() => {
                    const stats = config.lastJiraSyncDiagnostics as {
                      issuesSynced?: number;
                      issuesListed?: number;
                      commentsSeen?: number;
                      commentsSkipped?: number;
                      commentErrors?: string[];
                    };
                    const issues = `${stats.issuesSynced ?? 0}/${stats.issuesListed ?? 0}`;
                    const errors =
                      Array.isArray(stats.commentErrors) &&
                      stats.commentErrors.length > 0
                        ? `; comment_errors=${stats.commentErrors.length}`
                        : "";
                    return `Sync completed for jira (attempts=${syncAttempts}); issues=${issues}; comments=${stats.commentsSeen ?? 0}; skipped=${stats.commentsSkipped ?? 0}${errors}`;
                  })()
                : type === "linear" &&
                    config.lastLinearSyncDiagnostics &&
                    typeof config.lastLinearSyncDiagnostics === "object"
                  ? (() => {
                      const stats = config.lastLinearSyncDiagnostics as {
                        issuesSynced?: number;
                        issuesListed?: number;
                        commentsSeen?: number;
                        commentsSkipped?: number;
                      };
                      const issues = `${stats.issuesSynced ?? 0}/${stats.issuesListed ?? 0}`;
                      return `Sync completed for linear (attempts=${syncAttempts}); issues=${issues}; comments=${stats.commentsSeen ?? 0}; skipped=${stats.commentsSkipped ?? 0}`;
                    })()
                  : type === "devin_chats" &&
                      config.lastDevinSyncDiagnostics &&
                      typeof config.lastDevinSyncDiagnostics === "object"
                    ? (() => {
                        const stats = config.lastDevinSyncDiagnostics as {
                          sessionsSynced?: number;
                          sessionsListed?: number;
                          sessionsSkipped?: number;
                        };
                        const sessions = `${stats.sessionsSynced ?? 0}/${stats.sessionsListed ?? 0}`;
                        return `Sync completed for devin_chats (attempts=${syncAttempts}); sessions=${sessions}; skipped=${stats.sessionsSkipped ?? 0}`;
                      })()
                    : `Sync completed for ${type} (attempts=${syncAttempts})`;

          await updateFunnelAfterConnectorSync(
            userId,
            scopedOrgId,
            type,
            contractCounts,
          );
          await appendConnectorSyncLog(
            {
              id: randomUUID(),
              userId,
              type,
              status: "success",
              extractedCount,
              contractCounts,
              message: syncLogMessage,
              at: new Date().toISOString(),
            },
            scopedOrgId,
          );
          emitConnectorEvent({
            kind: "connector_update",
            userId,
            payload: {
              type,
              status: "connected",
              extractedCount,
              contractCounts,
              at: new Date().toISOString(),
            },
          });
          emitConnectorEvent({
            kind: "sync_log",
            userId,
            payload: {
              type,
              status: "success",
              extractedCount,
              contractCounts,
              message: `Sync completed for ${type} (attempts=${syncAttempts})`,
              at: new Date().toISOString(),
            },
          });
          const syncAt = new Date().toISOString();
          emitMemoryRealtimeEvent({
            kind: "source_synced",
            userId,
            orgId: scopedOrgId ?? null,
            source: "continuity",
            subject: {
              type: "source",
              id: `${type}:${scopedConnectorId}`,
              label: `${type} source sync`,
            },
            payload: {
              connectorType: type,
              connectorId: scopedConnectorId,
              status: "success",
              extractedCount,
              contractCounts,
              checkpoint: checkpoint ?? null,
              syncAttempts,
              at: syncAt,
            },
          });
          try {
            ingestConnectorSync({
              connectorType: type,
              userId,
              orgId: scopedOrgId ?? null,
              connectorId: scopedConnectorId,
              extractedCount,
              checkpoint: checkpoint ?? null,
              syncAttempts,
              status: "success",
              contractCounts,
              ...(type === "github" && Array.isArray(repoFullNames) ? { repoFullNames } : {}),
              ...(type === "slack" &&
              config.lastSlackSyncDiagnostics &&
              typeof config.lastSlackSyncDiagnostics === "object"
                ? { diagnostics: config.lastSlackSyncDiagnostics as Record<string, unknown> }
                : {}),
            });
          } catch (error) {
            console.warn("[ConnectorRouter] Reality ingestion bridge failed:", error);
          }
          if (extractedCount > 0) {
            emitMemoryRealtimeEvent({
              kind: "memory_extracted",
              userId,
              orgId: scopedOrgId ?? null,
              source: "continuity",
              subject: {
                type: "memory",
                id: `${type}:${scopedConnectorId}`,
                label: `${type} extracted memory`,
              },
              payload: {
                connectorType: type,
                connectorId: scopedConnectorId,
                extractedCount,
                contractCounts,
                checkpoint: checkpoint ?? null,
                syncAttempts,
                at: syncAt,
              },
            });
          }
          console.log(
            `[ConnectorRouter] ${type} async sync complete user=${userId} extracted=${extractedCount} used=${consumed.used}/${consumed.limit}`,
          );
        } catch (error) {
          try {
            const existing = await prisma.connector.findUnique({
              where: { id: scopedConnectorId },
            });
            const currentConfig = getConnectorConfig(existing?.configJson);
            await prisma.connector.update({
              where: { id: scopedConnectorId },
              data: {
                status: "connected",
                configJson: JSON.stringify({
                  ...currentConfig,
                  syncStartedAt: null,
                  retryCount:
                    typeof currentConfig.retryCount === "number"
                      ? currentConfig.retryCount + 1
                      : 1,
                  lastFailureAt: new Date().toISOString(),
                  lastFailureReason:
                    error instanceof Error ? error.message : "sync_failed",
                }),
              },
            });
          } catch {
            // ignore retry bookkeeping failures
          }
          await appendConnectorSyncLog(
            {
              id: randomUUID(),
              userId,
              type,
              status: "error",
              extractedCount: 0,
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to sync connector",
              at: new Date().toISOString(),
            },
            scopedOrgId,
          );
          emitConnectorEvent({
            kind: "connector_update",
            userId,
            payload: {
              type,
              status: "error",
              error: error instanceof Error ? error.message : "sync_failed",
              at: new Date().toISOString(),
            },
          });
          emitConnectorEvent({
            kind: "sync_log",
            userId,
            payload: {
              type,
              status: "error",
              extractedCount: 0,
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to sync connector",
              at: new Date().toISOString(),
            },
          });
          emitMemoryRealtimeEvent({
            kind: "source_synced",
            userId,
            orgId: scopedOrgId ?? null,
            source: "continuity",
            subject: {
              type: "source",
              id: `${type}:${scopedConnectorId}`,
              label: `${type} source sync`,
            },
            payload: {
              connectorType: type,
              connectorId: scopedConnectorId,
              status: "error",
              error: error instanceof Error ? error.message : "sync_failed",
              extractedCount: 0,
              syncAttempts,
              at: new Date().toISOString(),
            },
          });
        }
      } catch (error) {
        console.error(
          `[ConnectorRouter] Failed to queue sync for ${type}:`,
          error,
        );
        await appendConnectorSyncLog(
          {
            id: randomUUID(),
            userId,
            type,
            status: "error",
            extractedCount: 0,
            message:
              error instanceof Error
                ? error.message
                : "Failed to queue connector sync",
            at: new Date().toISOString(),
          },
          scopedOrgId,
        );
      }
    })();
    return;
  }),
);

connectorRouter.get(
  "/github/repos/:owner/:repo/branches",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const owner = typeof req.params.owner === "string" ? req.params.owner : "";
    const repo = typeof req.params.repo === "string" ? req.params.repo : "";
    const limitRaw =
      typeof req.query.limit === "string" ? Number(req.query.limit) : 100;
    if (!owner || !repo) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "owner and repo are required" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    try {
      const result = await listGitHubRepoBranches({
        userId: req.authUserId,
        orgId: req.authOrgId,
        owner,
        repo,
        limit: Number.isFinite(limitRaw) ? limitRaw : 100,
      });
      sendApiSuccess(res, 200, result, buildApiMeta(req, startedAt));
    } catch (error) {
      sendApiError(
        res,
        400,
        {
          code: "GITHUB_BRANCHES_LIST_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Could not list repository branches.",
        },
        buildApiMeta(req, startedAt),
      );
    }
  }),
);

connectorRouter.get(
  "/github/repos/:owner/:repo/contents",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const owner = typeof req.params.owner === "string" ? req.params.owner : "";
    const repo = typeof req.params.repo === "string" ? req.params.repo : "";
    const path = typeof req.query.path === "string" ? req.query.path : "";
    const ref = typeof req.query.ref === "string" ? req.query.ref : undefined;
    if (!owner || !repo) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "owner and repo are required" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    try {
      const result = await listGitHubRepoContents({
        userId: req.authUserId,
        orgId: req.authOrgId,
        owner,
        repo,
        path,
        ref,
      });
      sendApiSuccess(res, 200, result, buildApiMeta(req, startedAt));
    } catch (error) {
      sendApiError(
        res,
        400,
        {
          code: "GITHUB_CONTENTS_LIST_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Could not list repository contents.",
        },
        buildApiMeta(req, startedAt),
      );
    }
  }),
);

connectorRouter.get(
  "/github/repos/:owner/:repo/file",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const owner = typeof req.params.owner === "string" ? req.params.owner : "";
    const repo = typeof req.params.repo === "string" ? req.params.repo : "";
    const filePath = typeof req.query.path === "string" ? req.query.path : "";
    const ref = typeof req.query.ref === "string" ? req.query.ref : undefined;
    if (!owner || !repo || !filePath) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "owner, repo, and path are required" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    try {
      const result = await readGitHubRepoFile({
        userId: req.authUserId,
        orgId: req.authOrgId,
        owner,
        repo,
        path: filePath,
        ref,
      });
      sendApiSuccess(res, 200, result, buildApiMeta(req, startedAt));
    } catch (error) {
      sendApiError(
        res,
        400,
        {
          code: "GITHUB_FILE_READ_FAILED",
          message:
            error instanceof Error ? error.message : "Could not read file.",
        },
        buildApiMeta(req, startedAt),
      );
    }
  }),
);

connectorRouter.get(
  "/github/profile",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    try {
      const profile = await getGitHubProfileForUser(
        req.authUserId,
        req.authOrgId,
      );
      sendApiSuccess(res, 200, { profile }, buildApiMeta(req, startedAt));
    } catch (error) {
      console.warn(
        "[ConnectorRouter] GitHub profile lookup degraded:",
        error instanceof Error ? error.message : error,
      );
      sendApiSuccess(
        res,
        200,
        { profile: null },
        buildApiMeta(req, startedAt, { degraded: true }),
      );
    }
  }),
);

connectorRouter.put(
  "/openrouter/company-model",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const body = req.body as {
      apiKey?: unknown;
      model?: unknown;
      baseUrl?: unknown;
      providerName?: unknown;
    };

    const model = typeof body.model === "string" ? body.model.trim() : "";
    if (!model) {
      sendApiError(
        res,
        400,
        { code: "COMPANY_MODEL_INVALID", message: "Model id is required." },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    try {
      const saved = await saveCompanyModelConfig(
        req.authUserId,
        {
          ...(typeof body.apiKey === "string" && body.apiKey.trim()
            ? { apiKey: body.apiKey.trim() }
            : {}),
          model,
          baseUrl:
            typeof body.baseUrl === "string"
              ? body.baseUrl.trim() || null
              : body.baseUrl === null
                ? null
                : undefined,
          providerName:
            typeof body.providerName === "string"
              ? body.providerName.trim()
              : undefined,
        },
        req.authOrgId,
      );

      sendApiSuccess(
        res,
        200,
        {
          model: saved.model,
          baseUrl: saved.baseUrl ?? null,
          providerName: saved.providerName ?? null,
          apiKeySet: true,
        },
        buildApiMeta(req, startedAt),
      );
    } catch (error) {
      sendApiError(
        res,
        400,
        {
          code: "COMPANY_MODEL_SAVE_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Could not save company model settings.",
        },
        buildApiMeta(req, startedAt),
      );
    }
  }),
);

connectorRouter.get(
  "/openrouter/runtime-config",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const config = await getCompanyModelConfig(req.authUserId, req.authOrgId);

    if (!config) {
      sendApiError(
        res,
        404,
        {
          code: "OPENROUTER_RUNTIME_CONFIG_MISSING",
          message:
            "No OpenRouter company model saved. Add your API key in Continuity Lab → Company Model → Save.",
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    sendApiSuccess(
      res,
      200,
      {
        apiKey: config.apiKey,
        model: config.model,
        baseUrl: config.baseUrl ?? null,
        providerName: config.providerName ?? null,
      },
      buildApiMeta(req, startedAt),
    );
  }),
);

connectorRouter.get(
  "/github/runtime-token",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const connector = await prisma.connector.findFirst({
      where: {
        ...connectorUserFilter({
          userId: req.authUserId,
          orgId: req.authOrgId,
        }),
        type: "github",
        status: {
          in: ["connected", "syncing", "error"],
        },
      },
      select: { configJson: true },
    });

    let accessToken = "";
    try {
      const config = connector?.configJson
        ? (JSON.parse(connector.configJson) as { accessToken?: unknown })
        : {};
      accessToken =
        typeof config.accessToken === "string" ? config.accessToken : "";
    } catch {
      accessToken = "";
    }

    if (!accessToken) {
      sendApiError(
        res,
        404,
        {
          code: "GITHUB_RUNTIME_TOKEN_MISSING",
          message: "GitHub is not connected for runtime repository access.",
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    sendApiSuccess(
      res,
      200,
      { provider: "github", host: "github.com", token: accessToken },
      buildApiMeta(req, startedAt),
    );
  }),
);

connectorRouter.get(
  "/github/health",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const connector = await prisma.connector.findFirst({
      where: {
        ...connectorUserFilter({
          userId: req.authUserId,
          orgId: req.authOrgId,
        }),
        type: "github",
        status: {
          in: ["connected", "syncing", "error", "not_connected"],
        },
      },
      select: {
        status: true,
        lastSyncAt: true,
        recordCount: true,
        configJson: true,
      },
    });

    const config = getConnectorConfig(connector?.configJson);
    const repoFullNames = Array.isArray(config.repoFullNames)
      ? config.repoFullNames.filter(
          (item): item is string => typeof item === "string" && item.includes("/"),
        )
      : [];
    const repoPullRequestsByRepo =
      config.repoPullRequestsByRepo &&
      typeof config.repoPullRequestsByRepo === "object" &&
      !Array.isArray(config.repoPullRequestsByRepo)
        ? (config.repoPullRequestsByRepo as Record<string, unknown>)
        : {};

    sendApiSuccess(
      res,
      200,
      {
        connected: Boolean(connector && connector.status !== "not_connected"),
        status: connector?.status ?? "not_connected",
        lastSyncAt: connector?.lastSyncAt ?? null,
        recordCount: connector?.recordCount ?? 0,
        hasAccessToken:
          typeof config.accessToken === "string" && config.accessToken.length > 0,
        repoCount: repoFullNames.length,
        repoPullRequestRepoCount: Object.keys(repoPullRequestsByRepo).length,
        lastFailureAt:
          typeof config.lastFailureAt === "string"
            ? config.lastFailureAt
            : null,
        lastFailureReason:
          typeof config.lastFailureReason === "string"
            ? config.lastFailureReason
            : null,
        syncStartedAt:
          typeof config.syncStartedAt === "string"
            ? config.syncStartedAt
            : null,
        retryCount:
          typeof config.retryCount === "number" ? config.retryCount : 0,
      },
      buildApiMeta(req, startedAt),
    );
  }),
);

connectorRouter.get(
  "/github/repos",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const limitRaw =
      typeof req.query.limit === "string" ? Number(req.query.limit) : 40;
    try {
      const repos = await listGitHubReposForUser(
        req.authUserId,
        limitRaw,
        req.authOrgId,
      );
      sendApiSuccess(res, 200, { repos }, buildApiMeta(req, startedAt));
    } catch (error) {
      console.warn(
        "[ConnectorRouter] GitHub repo listing degraded:",
        error instanceof Error ? error.message : error,
      );
      sendApiSuccess(
        res,
        200,
        { repos: [] },
        buildApiMeta(req, startedAt, { degraded: true }),
      );
    }
  }),
);

connectorRouter.get(
  "/github/repos/:owner/:repo/pulls",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const owner = typeof req.params.owner === "string" ? req.params.owner : "";
    const repo = typeof req.params.repo === "string" ? req.params.repo : "";
    const limitRaw =
      typeof req.query.limit === "string" ? Number(req.query.limit) : 50;
    if (!owner || !repo) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "owner and repo are required" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    try {
      const pulls = await listGitHubPullRequests({
        userId: req.authUserId,
        orgId: req.authOrgId,
        owner,
        repo,
        limit: Number.isFinite(limitRaw) ? limitRaw : 50,
      });
      sendApiSuccess(res, 200, { items: pulls }, buildApiMeta(req, startedAt));
    } catch (error) {
      sendApiError(
        res,
        400,
        {
          code: "GITHUB_PULLS_LIST_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Could not list pull requests.",
        },
        buildApiMeta(req, startedAt),
      );
    }
  }),
);

connectorRouter.get(
  "/github/repos/:owner/:repo/pulls/:number",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const owner = typeof req.params.owner === "string" ? req.params.owner : "";
    const repo = typeof req.params.repo === "string" ? req.params.repo : "";
    const numberRaw = Number(req.params.number);
    if (!owner || !repo || !Number.isFinite(numberRaw)) {
      sendApiError(
        res,
        400,
        {
          code: "BAD_REQUEST",
          message: "owner, repo, and number are required",
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    try {
      const pullRequest = await getGitHubPullRequestDetail({
        userId: req.authUserId,
        orgId: req.authOrgId,
        owner,
        repo,
        number: numberRaw,
      });
      sendApiSuccess(res, 200, { pullRequest }, buildApiMeta(req, startedAt));
    } catch (error) {
      sendApiError(
        res,
        400,
        {
          code: "GITHUB_PULL_REQUEST_LOAD_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Could not load pull request.",
        },
        buildApiMeta(req, startedAt),
      );
    }
  }),
);

connectorRouter.post(
  "/github/repos/:owner/:repo/pulls/:number/merge",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const owner = typeof req.params.owner === "string" ? req.params.owner : "";
    const repo = typeof req.params.repo === "string" ? req.params.repo : "";
    const numberRaw = Number(req.params.number);
    const body = req.body as Record<string, unknown>;
    const mergeMethod =
      body.mergeMethod === "merge" ||
      body.mergeMethod === "squash" ||
      body.mergeMethod === "rebase"
        ? body.mergeMethod
        : undefined;
    const commitTitle =
      typeof body.commitTitle === "string" ? body.commitTitle : undefined;
    const commitMessage =
      typeof body.commitMessage === "string" ? body.commitMessage : undefined;
    const expectedHeadSha =
      typeof body.expectedHeadSha === "string"
        ? body.expectedHeadSha
        : undefined;

    if (!owner || !repo || !Number.isFinite(numberRaw)) {
      sendApiError(
        res,
        400,
        {
          code: "BAD_REQUEST",
          message: "owner, repo, and number are required",
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    try {
      const mergeResult = await mergeGitHubPullRequest({
        userId: req.authUserId,
        orgId: req.authOrgId,
        owner,
        repo,
        number: numberRaw,
        mergeMethod,
        commitTitle,
        commitMessage,
        expectedHeadSha,
      });
      const orgId = readOrgIdFromRequest(req);
      void patchContinuityFunnelStep(req.authUserId, "executed", {
        orgId,
      }).catch((error) => {
        console.warn("[CompanyBrainFunnel] merged PR patch failed:", error);
      });
      sendApiSuccess(res, 200, { mergeResult }, buildApiMeta(req, startedAt));
    } catch (error) {
      sendApiError(
        res,
        400,
        {
          code: "GITHUB_PULL_REQUEST_MERGE_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Could not merge pull request.",
        },
        buildApiMeta(req, startedAt),
      );
    }
  }),
);

connectorRouter.post(
  "/github/execution/propose",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const body = req.body as Record<string, unknown>;
    const owner = typeof body.owner === "string" ? body.owner : "";
    const repo = typeof body.repo === "string" ? body.repo : "";
    const commentBody = typeof body.body === "string" ? body.body : "";
    const kindRaw = typeof body.kind === "string" ? body.kind : "issue_comment";
    const kind: GitHubExecutionKind =
      kindRaw === "brief_file_commit" || kindRaw === "pull_request"
        ? kindRaw
        : "issue_comment";
    const issueNumber =
      typeof body.issueNumber === "number"
        ? body.issueNumber
        : Number(body.issueNumber);
    const pullTitle =
      typeof body.pullTitle === "string" ? body.pullTitle : undefined;
    const headBranch =
      typeof body.headBranch === "string" ? body.headBranch : undefined;
    const baseBranch =
      typeof body.baseBranch === "string" ? body.baseBranch : undefined;
    const filePath =
      typeof body.filePath === "string" ? body.filePath : undefined;

    try {
      const proposal = await proposeGitHubExecution({
        userId: req.authUserId,
        kind,
        owner,
        repo,
        body: commentBody,
        issueNumber: Number.isFinite(issueNumber) ? issueNumber : undefined,
        pullTitle,
        headBranch,
        baseBranch,
        filePath,
      });
      void patchContinuityFunnelStep(req.authUserId, "proposalCreated", {
        orgId: readOrgIdFromRequest(req),
      }).catch((error) => {
        console.warn(
          "[CompanyBrainFunnel] proposalCreated patch failed:",
          error,
        );
      });
      sendApiSuccess(res, 201, { proposal }, buildApiMeta(req, startedAt));
    } catch (error) {
      sendApiError(
        res,
        400,
        {
          code: "GITHUB_EXECUTION_PROPOSE_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Could not create proposal.",
        },
        buildApiMeta(req, startedAt),
      );
    }
  }),
);

connectorRouter.get(
  "/github/execution/proposals",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const proposals = await listGitHubExecutionProposalsForUser(req.authUserId, 30);
    sendApiSuccess(res, 200, { proposals }, buildApiMeta(req, startedAt));
  }),
);

connectorRouter.post(
  "/github/execution/:proposalId/approve",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const proposalId =
      typeof req.params.proposalId === "string" ? req.params.proposalId : "";
    if (!proposalId) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "proposalId is required" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    try {
      const proposal = await approveAndExecuteGitHubProposal({
        userId: req.authUserId,
        proposalId,
      });
      const orgId = readOrgIdFromRequest(req);
      void patchContinuityFunnelStep(req.authUserId, "approved", {
        orgId,
      }).catch((error) => {
        console.warn("[CompanyBrainFunnel] approved patch failed:", error);
      });
      if (proposal.status === "executed") {
        void patchContinuityFunnelStep(req.authUserId, "executed", {
          orgId,
        }).catch((error) => {
          console.warn("[CompanyBrainFunnel] executed patch failed:", error);
        });
      }
      sendApiSuccess(res, 200, { proposal }, buildApiMeta(req, startedAt));
    } catch (error) {
      sendApiError(
        res,
        400,
        {
          code: "GITHUB_EXECUTION_APPROVE_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Could not execute proposal.",
        },
        buildApiMeta(req, startedAt),
      );
    }
  }),
);
