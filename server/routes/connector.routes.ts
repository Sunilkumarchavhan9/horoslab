import { Router, type Response as ExpressResponse } from "express";
import jwt from "jsonwebtoken";
import { ConnectorManager, type ConnectorType } from "../../lib/integrations/connectorManager";
import { GitHubClient } from "../../lib/integrations/github";
import { GoogleClient } from "../../lib/integrations/google";
import { MicrosoftClient } from "../../lib/integrations/microsoft";
import { GmailClient } from "../../lib/integrations/gmail";
import { SlackClient } from "../../lib/integrations/slack";
import { ZendeskClient } from "../../lib/integrations/zendesk";
import { JiraClient } from "../../lib/integrations/jira";
import { appendConnectorSyncLog, listConnectorSyncLogs } from "../../lib/integrations/syncLogStore";
import { prisma } from "../../lib/storage/prismaClient";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendApiSuccess, sendApiError, buildApiMeta } from "./api-response";
import { randomUUID } from "crypto";
import {
  canConsumeConnectorSyncRecords,
  consumeConnectorSyncRecords,
  getBillingStateForUser,
} from "../../lib/billing/store";

import { requireAuth } from "../middleware/auth";
import { verifyAuthorizationHeader } from "../../lib/auth/verifyToken";
import {
  approveAndExecuteGitHubProposal,
  listGitHubReposForUser,
  proposeGitHubExecution,
} from "../../lib/integrations/githubExecution";
import { listGitHubRepoContents, readGitHubRepoFile } from "../../lib/integrations/githubRepoBrowser";
import { listGitHubExecutionProposalsForUser } from "../../lib/integrations/githubExecutionStore";
import type { GitHubExecutionKind } from "../../lib/integrations/githubExecutionStore";

export const connectorRouter = Router();
type ConnectorRealtimeEvent = {
  kind: "connector_update" | "sync_log";
  userId: string;
  payload: Record<string, unknown>;
};
const CONNECTOR_STREAMS = new Map<string, Set<ExpressResponse>>();
const PREMIUM_CONNECTORS = new Set<ConnectorType>([
  "github",
  "google_drive",
  "onedrive",
  "gmail",
  "slack",
  "zendesk",
  "jira",
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
  if (!error || typeof error !== "object") return false;
  const maybeCode =
    "code" in error && typeof (error as { code?: unknown }).code === "string"
      ? (error as { code: string }).code
      : "";
  const maybeMessage =
    "message" in error && typeof (error as { message?: unknown }).message === "string"
      ? (error as { message: string }).message
      : "";
  return maybeCode === "P1001" || maybeMessage.includes("Can't reach database server");
}

function isInDbCooldown(): boolean {
  return Date.now() < dbUnavailableUntil;
}

function markDbUnavailableNow(): void {
  dbUnavailableUntil = Date.now() + DB_RETRY_COOLDOWN_MS;
}

function getConnectorConfig(value: string | null | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function getContractCounts(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, number>>((counts, [key, count]) => {
    if (typeof count === "number" && Number.isFinite(count) && count > 0) {
      counts[key] = count;
    }
    return counts;
  }, {});
}

function toSingleString(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first : "";
  }
  return "";
}

async function isConnectorAllowedByPlan(userId: string, type: ConnectorType): Promise<boolean> {
  const plan = (await getBillingStateForUser(userId)).plan;
  if (type === "local_files") return true;
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
  lastSyncAt: string | null;
  contractCounts: Record<string, number>;
} {
  const config = getConnectorConfig(
    typeof connector.configJson === "string" ? connector.configJson : null,
  );
  return {
    type: typeof connector.type === "string" ? connector.type : "unknown",
    status: typeof connector.status === "string" ? connector.status : "not_connected",
    recordCount:
      typeof connector.recordCount === "number" && Number.isFinite(connector.recordCount)
        ? connector.recordCount
        : 0,
    lastSyncAt:
      typeof connector.lastSyncAt === "string" && connector.lastSyncAt.length > 0
        ? connector.lastSyncAt
        : null,
    contractCounts: getContractCounts(config.lastContractCounts),
  };
}


/**
 * List all connectors for the current user.
 */
connectorRouter.get(
  "/events",
  asyncHandler(async (req, res) => {
    const token = toSingleString(req.query.token);
    const verified = await verifyAuthorizationHeader(token ? `Bearer ${token}` : req.header("authorization"));
    if (!verified) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const userId = verified.userId;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    res.write(`event: ready\ndata: ${JSON.stringify({ ok: true, userId })}\n\n`);

    const existingSinks = CONNECTOR_STREAMS.get(userId);
    const sinks: Set<ExpressResponse> = existingSinks ?? new Set<ExpressResponse>();
    if (!existingSinks) {
      CONNECTOR_STREAMS.set(userId, sinks);
    }
    sinks.add(res);

    const heartbeat = setInterval(() => {
      try {
        res.write(`event: ping\ndata: {"ts":"${new Date().toISOString()}"}\n\n`);
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
      const storedConnectors = await prisma.connector.findMany({
        where: { userId: req.authUserId },
      });
      const visibleConnectors = storedConnectors.filter((connector) => connector.type !== "notion");
      const planAwareConnectors = await Promise.all(
        visibleConnectors.map((connector) => maskConnectorByPlan(req.authUserId, connector)),
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
  })
);

connectorRouter.get(
  "/logs",
  requireAuth,
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const logs = listConnectorSyncLogs(req.authUserId);
    sendApiSuccess(res, 200, { logs }, buildApiMeta(req, startedAt));
  }),
);

connectorRouter.get(
  "/health",
  requireAuth,
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    if (isInDbCooldown()) {
      sendApiSuccess(
        res,
        200,
        {
          diagnostics: [],
          backendAvailable: false,
          warning: "Database unavailable. Connector diagnostics temporarily disabled.",
          retryAfterMs: Math.max(0, dbUnavailableUntil - Date.now()),
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    try {
      const connectors = await prisma.connector.findMany({
        where: { userId: req.authUserId },
      });
      dbUnavailableUntil = 0;
      const visibleConnectors = connectors.filter((connector) => connector.type !== "notion");
      const diagnostics = await Promise.all(visibleConnectors.map(async (connector) => {
        const allowed = await isConnectorAllowedByPlan(req.authUserId, connector.type as ConnectorType);
        const config = connector.configJson ? JSON.parse(connector.configJson) : {};
        return {
          type: connector.type,
          status: allowed ? connector.status : "not_connected",
          auth: {
            configured: allowed && Boolean(config.accessToken || connector.type === "local_files"),
            mode: connector.type === "local_files" ? "workspace" : "oauth2",
          },
          transport: {
            protocol: connector.type === "local_files" ? "filesystem" : "https",
            healthy: allowed && (connector.status === "connected" || connector.status === "syncing"),
          },
          retry: {
            enabled: true,
            retryCount: typeof config.retryCount === "number" ? config.retryCount : 0,
            lastFailureAt: typeof config.lastFailureAt === "string" ? config.lastFailureAt : null,
            lastFailureReason: typeof config.lastFailureReason === "string" ? config.lastFailureReason : null,
          },
          checkpoints: {
            lastCheckpointAt: typeof config.lastCheckpointAt === "string" ? config.lastCheckpointAt : null,
            recentItemKeysCount: Array.isArray(config.recentItemKeys) ? config.recentItemKeys.length : 0,
            slackCursor: typeof config.cursor === "string" ? config.cursor : null,
            slackLastMessageTs: typeof config.lastMessageTs === "string" ? config.lastMessageTs : null,
            gmailLastMessageId: typeof config.lastMessageId === "string" ? config.lastMessageId : null,
            gmailLastCheckpointEpochMs:
              typeof config.lastCheckpointEpochMs === "number" ? config.lastCheckpointEpochMs : null,
          },
          contractCounts: getContractCounts(config.lastContractCounts),
          tokens: {
            hasRefreshToken:
              allowed && typeof config.refreshToken === "string" && config.refreshToken.length > 0,
            lastTokenRefreshAt:
              allowed && typeof config.lastTokenRefreshAt === "string" ? config.lastTokenRefreshAt : null,
            hasAccessToken:
              allowed && typeof config.accessToken === "string" && config.accessToken.length > 0,
          },
          safety: {
            mcpSafeMetadata: true,
            policyCompatible: true,
          },
        };
      }));
      sendApiSuccess(
        res,
        200,
        {
          diagnostics,
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
            backendAvailable: false,
            warning: "Database unavailable. Connector diagnostics temporarily disabled.",
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
    const { type } = req.params;
    const userId = req.authUserId;
    const startedAt = Date.now();
    if (type === "notion") {
      sendApiError(res, 410, {
        code: "CONNECTOR_DISABLED",
        message: "Notion connector is currently disabled.",
      }, buildApiMeta(req, startedAt));
      return;
    }
    const typed = type as ConnectorType;
    const bypassPlanGate = typed === "github";
    if (!bypassPlanGate && !(await isConnectorAllowedByPlan(userId, typed))) {
      const plan = (await getBillingStateForUser(userId)).plan;
      sendApiError(res, 402, {
        code: "UPGRADE_REQUIRED",
        message: `${type} connector requires Pro or higher.`,
        details: { connector: type, currentPlan: plan, minimumPlan: "Pro" },
      }, buildApiMeta(req, startedAt));
      return;
    }

    // Create a secure state token to prevent CSRF and carry userId
    const state = jwt.sign({ userId, type }, STATE_SECRET, { expiresIn: "15m" });

    let authorizeUrl = "";
    
    // Helper to generate a mock callback URL for local dev / demos
    const getMockCallbackUrl = () => {
      const baseUrl = process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN || "http://localhost:3001";
      return `${baseUrl}/api/connector/callback?code=mock_demo_code&state=${state}`;
    };

    if (type === "github") {
      authorizeUrl = process.env.GITHUB_CLIENT_ID 
        ? GitHubClient.getAuthorizeUrl(state) 
        : getMockCallbackUrl();
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
      authorizeUrl = process.env.SLACK_CLIENT_ID
        ? SlackClient.getAuthorizeUrl(state)
        : getMockCallbackUrl();
    } else if (type === "zendesk") {
      authorizeUrl = process.env.ZENDESK_CLIENT_ID
        ? ZendeskClient.getAuthorizeUrl(state)
        : getMockCallbackUrl();
    } else if (type === "jira") {
      authorizeUrl = process.env.JIRA_CLIENT_ID
        ? JiraClient.getAuthorizeUrl(state)
        : getMockCallbackUrl();
    } else {
      sendApiError(res, 400, {
        code: "INVALID_CONNECTOR",
        message: `OAuth for ${type} is not yet implemented.`,
      }, buildApiMeta(req, startedAt));
      return;
    }

    sendApiSuccess(res, 200, { authorizeUrl }, buildApiMeta(req, startedAt));
  })
);

/**
 * OAuth Callback handler.
 */
connectorRouter.get(
  "/callback",
  asyncHandler(async (req, res) => {
    const { code, state } = req.query;

    if (!code || !state || typeof code !== "string" || typeof state !== "string") {
      res.status(400).send("Invalid callback parameters.");
      return;
    }

    try {
      // 1. Verify state
      const decoded = jwt.verify(state, STATE_SECRET) as { userId: string; type: string };
      const { userId, type } = decoded;
      if (type === "notion") {
        res.status(410).send("Notion connector is currently disabled.");
        return;
      }

      let accessToken = "";
      let googleRefreshToken: string | undefined;
      if (code === "mock_demo_code") {
        accessToken = `mock_token_${type}_${Date.now()}`;
      } else if (type === "github") {
        accessToken = await GitHubClient.getAccessToken(code);
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
        accessToken = await JiraClient.getAccessToken(code);
      } else {
        throw new Error(`Unsupported connector type: ${type}`);
      }

      // 2. Store or update connector in DB
      const tokenConfig: Record<string, unknown> = { accessToken };
      if ((type === "google_drive" || type === "gmail") && googleRefreshToken) {
        tokenConfig.refreshToken = googleRefreshToken;
      }

      await prisma.connector.upsert({
        where: { id: `${userId}_${type}` }, // Simplified ID for lookup
        create: {
          id: `${userId}_${type}`,
          userId,
          type,
          name: type.charAt(0).toUpperCase() + type.slice(1),
          status: "connected",
          configJson: JSON.stringify(tokenConfig), // In prod, encrypt this!
          lastSyncAt: new Date().toISOString(),
        },
        update: {
          status: "connected",
          configJson: JSON.stringify(tokenConfig),
          updatedAt: new Date(),
        },
      });

      // 3. Trigger initial sync in background (never block OAuth callback response)
      if (!accessToken.startsWith("mock_token_")) {
        void (async () => {
          try {
            const result = await ConnectorManager.triggerSync(userId, type as ConnectorType, accessToken);
            const contractCounts = getContractCounts(result.contractCounts);
            await prisma.connector.update({
              where: { id: `${userId}_${type}` },
              data: {
                status: "connected",
                lastSyncAt: new Date().toISOString(),
                configJson: JSON.stringify({
                  ...tokenConfig,
                  lastContractCounts: contractCounts,
                }),
              },
            });
            emitConnectorEvent({
              kind: "sync_log",
              userId,
              payload: {
                type,
                status: "success",
                extractedCount: result.extractedCount,
                contractCounts,
                message: `${type} initial sync completed`,
                at: new Date().toISOString(),
              },
            });
          } catch (error) {
            console.error(`[ConnectorRouter] Initial ${type} sync failed:`, error);
            const message = error instanceof Error ? error.message : "Initial sync failed";
            await prisma.connector.update({
              where: { id: `${userId}_${type}` },
              data: {
                status: "connected",
                configJson: JSON.stringify({
                  ...tokenConfig,
                  lastFailureAt: new Date().toISOString(),
                  lastFailureReason: message,
                }),
              },
            }).catch(() => undefined);
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
          status: "connected",
          at: new Date().toISOString(),
        },
      });

      // 4. Redirect back to frontend
      const frontendUrl = process.env.OPENROUTER_HTTP_REFERER || "http://localhost:3000";
      res.redirect(`${frontendUrl}/developer-console?tab=Data%20Sources&connected=${type}`);
    } catch (error) {
      console.error("[ConnectorRouter] Callback error:", error);
      res.status(500).send("Authentication failed. Please try again.");
    }
  })
);

/**
 * Trigger a real-time sync for a specific connector.
 */
connectorRouter.post(
  "/local_files/connect",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.authUserId;
    const startedAt = Date.now();

    await prisma.connector.upsert({
      where: { id: `${userId}_local_files` },
      create: {
        id: `${userId}_local_files`,
        userId,
        type: "local_files",
        name: "Local Files",
        status: "connected",
        configJson: JSON.stringify({ mode: "workspace" }),
        lastSyncAt: new Date().toISOString(),
      },
      update: {
        status: "connected",
        updatedAt: new Date(),
      },
    });

    sendApiSuccess(
      res,
      200,
      { message: "Local Files connector enabled." },
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
  "/:type/unlock",
  requireAuth,
  asyncHandler(async (req, res) => {
    const type = toSingleString(req.params.type);
    const userId = req.authUserId;
    const startedAt = Date.now();
    if (type === "notion") {
      sendApiError(res, 410, {
        code: "CONNECTOR_DISABLED",
        message: "Notion connector is currently disabled.",
      }, buildApiMeta(req, startedAt));
      return;
    }
    const connectorId = `${userId}_${type}`;

    const connector = await prisma.connector.findUnique({
      where: { id: connectorId },
    });
    if (!connector) {
      sendApiError(res, 404, {
        code: "NOT_FOUND",
        message: `Connector ${type} not found.`,
      }, buildApiMeta(req, startedAt));
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

    appendConnectorSyncLog({
      id: randomUUID(),
      userId,
      type,
      status: "success",
      extractedCount: 0,
      message: `Sync lock cleared for ${type}`,
      at: new Date().toISOString(),
    });
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

    sendApiSuccess(res, 200, { message: `Unlocked ${type}.` }, buildApiMeta(req, startedAt));
  }),
);

connectorRouter.post(
  "/:type/sync",
  requireAuth,
  asyncHandler(async (req, res) => {
    const type = toSingleString(req.params.type);
    const userId = req.authUserId;
    const startedAt = Date.now();
    if (type === "notion") {
      sendApiError(res, 410, {
        code: "CONNECTOR_DISABLED",
        message: "Notion connector is currently disabled.",
      }, buildApiMeta(req, startedAt));
      return;
    }
    const typed = type as ConnectorType;
    const bypassPlanGate = typed === "github";
    if (!bypassPlanGate && !(await isConnectorAllowedByPlan(userId, typed))) {
      const plan = (await getBillingStateForUser(userId)).plan;
      sendApiError(res, 402, {
        code: "UPGRADE_REQUIRED",
        message: `${type} connector requires Pro or higher.`,
        details: { connector: type, currentPlan: plan, minimumPlan: "Pro" },
      }, buildApiMeta(req, startedAt));
      return;
    }

    // Return immediately so frontend/proxy never waits on connector sync work.
    sendApiSuccess(res, 202, {
      message: `Sync queued for ${type}.`,
    }, buildApiMeta(req, startedAt));

    void (async () => {
      try {
      const connector = await prisma.connector.findUnique({
        where: { id: `${userId}_${type}` },
      });

      if (!connector || (connector.status !== "connected" && connector.status !== "syncing" && connector.status !== "error")) {
        appendConnectorSyncLog({
          id: randomUUID(),
          userId,
          type,
          status: "error",
          extractedCount: 0,
          message: `${type} is not connected or requires re-authentication.`,
          at: new Date().toISOString(),
        });
        return;
      }

      const config = getConnectorConfig(connector.configJson);
      const accessToken = typeof config.accessToken === "string" ? config.accessToken : undefined;
      const previousCheckpoint = typeof config.lastCheckpointAt === "string" ? config.lastCheckpointAt : undefined;
      const recentItemKeys = Array.isArray(config.recentItemKeys)
        ? config.recentItemKeys.filter((item): item is string => typeof item === "string")
        : [];
      const syncStartedAt = typeof config.syncStartedAt === "string" ? config.syncStartedAt : undefined;
      const isLocked = connector.status === "syncing" &&
        syncStartedAt &&
        Date.now() - new Date(syncStartedAt).getTime() < CONNECTOR_SYNC_LOCK_MS;
      if (isLocked) {
        appendConnectorSyncLog({
          id: randomUUID(),
          userId,
          type,
          status: "error",
          extractedCount: 0,
          message: `${type} sync is already running.`,
          at: new Date().toISOString(),
        });
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
          let syncAttempts = 1;
          let contractCounts: Record<string, number> = {};
          if (type === "local_files") {
            const result = await ConnectorManager.triggerSync(userId, "local_files", undefined, undefined, recentItemKeys);
            extractedCount = result.extractedCount;
            dedupeKeys = Array.isArray(result.dedupeKeys) ? result.dedupeKeys : [];
            syncAttempts = typeof result.attempts === "number" ? result.attempts : 1;
            contractCounts = getContractCounts(result.contractCounts);
          } else if (accessToken && accessToken.startsWith("mock_token_")) {
            extractedCount = Math.floor(Math.random() * 20) + 5;
            checkpoint = new Date().toISOString();
            contractCounts = {};
          } else {
            if (!accessToken) {
              throw new Error(`${type} access token missing. Reconnect this source.`);
            }
            let syncToken = accessToken;
            if ((type === "google_drive" || type === "gmail") && typeof config.refreshToken === "string" && config.refreshToken.length > 0) {
              try {
                const refreshed = type === "gmail"
                  ? await GmailClient.refreshAccessToken(config.refreshToken)
                  : await GoogleClient.refreshAccessToken(config.refreshToken);
                if (type === "gmail") {
                  syncToken = refreshed.accessToken;
                  config.accessToken = refreshed.accessToken;
                  if (refreshed.refreshToken) config.refreshToken = refreshed.refreshToken;
                  config.lastTokenRefreshAt = new Date().toISOString();
                } else {
                  syncToken = refreshed.accessToken;
                  config.accessToken = refreshed.accessToken;
                  if (refreshed.refreshToken) config.refreshToken = refreshed.refreshToken;
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
            );
            extractedCount = result.extractedCount;
            checkpoint = typeof result.checkpoint === "string" ? result.checkpoint : undefined;
            dedupeKeys = Array.isArray(result.dedupeKeys) ? result.dedupeKeys : [];
            syncAttempts = typeof result.attempts === "number" ? result.attempts : 1;
            contractCounts = getContractCounts(result.contractCounts);
            if (type === "slack") {
              const slackCursor = (result as unknown as { cursor?: unknown }).cursor;
              const slackLastMessageTs = (result as unknown as { lastMessageTs?: unknown }).lastMessageTs;
              if (typeof slackCursor === "string" && slackCursor.length > 0) config.cursor = slackCursor;
              if (typeof slackLastMessageTs === "string" && slackLastMessageTs.length > 0) config.lastMessageTs = slackLastMessageTs;
            }
            if (type === "gmail") {
              const gmailLastMessageId = (result as unknown as { lastMessageId?: unknown }).lastMessageId;
              const gmailLastCheckpointEpochMs = (result as unknown as { lastCheckpointEpochMs?: unknown }).lastCheckpointEpochMs;
              if (typeof gmailLastMessageId === "string" && gmailLastMessageId.length > 0) config.lastMessageId = gmailLastMessageId;
              if (typeof gmailLastCheckpointEpochMs === "number") config.lastCheckpointEpochMs = gmailLastCheckpointEpochMs;
            }
          }
          const nextRecentItemKeys = Array.from(new Set([...recentItemKeys, ...dedupeKeys])).slice(-500);
          const quota = await canConsumeConnectorSyncRecords({ userId, amount: extractedCount });
          if (!quota.allowed) {
            throw new Error(`Connector sync record limit reached for ${quota.plan}.`);
          }
          const consumed = await consumeConnectorSyncRecords({ userId, amount: extractedCount });

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
                lastContractCounts: contractCounts,
                syncStartedAt: null,
                retryCount: 0,
                lastFailureAt: null,
                lastFailureReason: null,
              }),
            },
          });

          appendConnectorSyncLog({
            id: randomUUID(),
            userId,
            type,
            status: "success",
            extractedCount,
            contractCounts,
            message: `Sync completed for ${type} (attempts=${syncAttempts})`,
            at: new Date().toISOString(),
          });
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
          console.log(`[ConnectorRouter] ${type} async sync complete user=${userId} extracted=${extractedCount} used=${consumed.used}/${consumed.limit}`);
      } catch (error) {
          try {
            const existing = await prisma.connector.findUnique({
              where: { id: `${userId}_${type}` },
            });
            const currentConfig = getConnectorConfig(existing?.configJson);
            await prisma.connector.update({
              where: { id: `${userId}_${type}` },
              data: {
                status: "connected",
                configJson: JSON.stringify({
                  ...currentConfig,
                  syncStartedAt: null,
                  retryCount: typeof currentConfig.retryCount === "number" ? currentConfig.retryCount + 1 : 1,
                  lastFailureAt: new Date().toISOString(),
                  lastFailureReason: error instanceof Error ? error.message : "sync_failed",
                }),
              },
            });
          } catch {
            // ignore retry bookkeeping failures
          }
          appendConnectorSyncLog({
            id: randomUUID(),
            userId,
            type,
            status: "error",
            extractedCount: 0,
            message: error instanceof Error ? error.message : "Failed to sync connector",
            at: new Date().toISOString(),
          });
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
              message: error instanceof Error ? error.message : "Failed to sync connector",
              at: new Date().toISOString(),
            },
          });
      }
    } catch (error) {
      console.error(`[ConnectorRouter] Failed to queue sync for ${type}:`, error);
      appendConnectorSyncLog({
        id: randomUUID(),
        userId,
        type,
        status: "error",
        extractedCount: 0,
        message: error instanceof Error ? error.message : "Failed to queue connector sync",
        at: new Date().toISOString(),
      });
    }
    })();
    return;
  })
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
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "owner and repo are required" }, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const result = await listGitHubRepoContents({
        userId: req.authUserId,
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
          message: error instanceof Error ? error.message : "Could not list repository contents.",
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
          message: error instanceof Error ? error.message : "Could not read file.",
        },
        buildApiMeta(req, startedAt),
      );
    }
  }),
);

connectorRouter.get(
  "/github/repos",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const limitRaw = typeof req.query.limit === "string" ? Number(req.query.limit) : 40;
    try {
      const repos = await listGitHubReposForUser(req.authUserId, limitRaw);
      sendApiSuccess(res, 200, { repos }, buildApiMeta(req, startedAt));
    } catch (error) {
      sendApiError(
        res,
        400,
        {
          code: "GITHUB_REPOS_LIST_FAILED",
          message: error instanceof Error ? error.message : "Could not list repositories.",
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
      kindRaw === "brief_file_commit" || kindRaw === "pull_request" ? kindRaw : "issue_comment";
    const issueNumber =
      typeof body.issueNumber === "number" ? body.issueNumber : Number(body.issueNumber);
    const pullTitle = typeof body.pullTitle === "string" ? body.pullTitle : undefined;
    const headBranch = typeof body.headBranch === "string" ? body.headBranch : undefined;
    const baseBranch = typeof body.baseBranch === "string" ? body.baseBranch : undefined;
    const filePath = typeof body.filePath === "string" ? body.filePath : undefined;

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
      sendApiSuccess(res, 201, { proposal }, buildApiMeta(req, startedAt));
    } catch (error) {
      sendApiError(
        res,
        400,
        {
          code: "GITHUB_EXECUTION_PROPOSE_FAILED",
          message: error instanceof Error ? error.message : "Could not create proposal.",
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
    const proposals = listGitHubExecutionProposalsForUser(req.authUserId, 30);
    sendApiSuccess(res, 200, { proposals }, buildApiMeta(req, startedAt));
  }),
);

connectorRouter.post(
  "/github/execution/:proposalId/approve",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const proposalId = typeof req.params.proposalId === "string" ? req.params.proposalId : "";
    if (!proposalId) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "proposalId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const proposal = await approveAndExecuteGitHubProposal({
        userId: req.authUserId,
        proposalId,
      });
      sendApiSuccess(res, 200, { proposal }, buildApiMeta(req, startedAt));
    } catch (error) {
      sendApiError(
        res,
        400,
        {
          code: "GITHUB_EXECUTION_APPROVE_FAILED",
          message: error instanceof Error ? error.message : "Could not execute proposal.",
        },
        buildApiMeta(req, startedAt),
      );
    }
  }),
);


