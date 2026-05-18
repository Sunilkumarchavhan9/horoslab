import { Router, type Response as ExpressResponse } from "express";
import jwt from "jsonwebtoken";
import { ConnectorManager, type ConnectorType } from "../../lib/integrations/connectorManager";
import { GitHubClient } from "../../lib/integrations/github";
import { NotionClient } from "../../lib/integrations/notion";
import { GoogleClient } from "../../lib/integrations/google";
import { MicrosoftClient } from "../../lib/integrations/microsoft";
import { GmailClient } from "../../lib/integrations/gmail";
import { SlackClient } from "../../lib/integrations/slack";
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

export const connectorRouter = Router();
type ConnectorRealtimeEvent = {
  kind: "connector_update" | "sync_log";
  userId: string;
  payload: Record<string, unknown>;
};
const CONNECTOR_STREAMS = new Map<string, Set<ExpressResponse>>();
const PREMIUM_CONNECTORS = new Set<ConnectorType>([
  "github",
  "notion",
  "google_drive",
  "onedrive",
  "gmail",
  "slack",
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
      const connectors = await prisma.connector.findMany({
        where: { userId: req.authUserId },
      });
      dbUnavailableUntil = 0;
      sendApiSuccess(res, 200, { connectors, backendAvailable: true }, buildApiMeta(req, startedAt));
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
      const diagnostics = connectors.map((connector) => {
        const config = connector.configJson ? JSON.parse(connector.configJson) : {};
        return {
          type: connector.type,
          status: connector.status,
          auth: {
            configured: Boolean(config.accessToken || connector.type === "local_files"),
            mode: connector.type === "local_files" ? "workspace" : "oauth2",
          },
          transport: {
            protocol: connector.type === "local_files" ? "filesystem" : "https",
            healthy: connector.status === "connected" || connector.status === "syncing",
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
          tokens: {
            hasRefreshToken: typeof config.refreshToken === "string" && config.refreshToken.length > 0,
            lastTokenRefreshAt: typeof config.lastTokenRefreshAt === "string" ? config.lastTokenRefreshAt : null,
            hasAccessToken: typeof config.accessToken === "string" && config.accessToken.length > 0,
          },
          safety: {
            mcpSafeMetadata: true,
            policyCompatible: true,
          },
        };
      });
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
    } else if (type === "notion") {
      authorizeUrl = process.env.NOTION_CLIENT_ID 
        ? NotionClient.getAuthorizeUrl(state) 
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

      let accessToken = "";
      let googleRefreshToken: string | undefined;
      if (code === "mock_demo_code") {
        accessToken = `mock_token_${type}_${Date.now()}`;
      } else if (type === "github") {
        accessToken = await GitHubClient.getAccessToken(code);
      } else if (type === "notion") {
        accessToken = await NotionClient.getAccessToken(code);
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

      // 3. Trigger initial sync
      if (!accessToken.startsWith("mock_token_")) {
        await ConnectorManager.triggerSync(userId, type as ConnectorType, accessToken);
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

    try {
      const connector = await prisma.connector.findUnique({
        where: { id: `${userId}_${type}` },
      });

      if (!connector || (connector.status !== "connected" && connector.status !== "syncing" && connector.status !== "error")) {
        sendApiError(res, 400, {
          code: "NOT_CONNECTED",
          message: `${type} is not connected or requires re-authentication.`,
        }, buildApiMeta(req, startedAt));
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
        sendApiError(res, 409, {
          code: "SYNC_IN_PROGRESS",
          message: `${type} sync is already running.`,
        }, buildApiMeta(req, startedAt));
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
      
      let extractedCount = 0;
      let checkpoint: string | undefined;
      let dedupeKeys: string[] = [];
      let syncAttempts = 1;
      if (type === "local_files") {
        const result = await ConnectorManager.triggerSync(userId, "local_files", undefined, undefined, recentItemKeys);
        extractedCount = result.extractedCount;
        dedupeKeys = Array.isArray(result.dedupeKeys) ? result.dedupeKeys : [];
        syncAttempts = typeof result.attempts === "number" ? result.attempts : 1;
      } else if (accessToken && accessToken.startsWith("mock_token_")) {
        extractedCount = Math.floor(Math.random() * 20) + 5;
        checkpoint = new Date().toISOString();
      } else {
        if (!accessToken) {
          sendApiError(res, 400, {
            code: "NOT_CONNECTED",
            message: `${type} access token missing. Reconnect this source.`,
          }, buildApiMeta(req, startedAt));
          return;
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
        sendApiError(res, 402, {
          code: "CONNECTOR_SYNC_LIMIT_REACHED",
          message: `Connector sync record limit reached for ${quota.plan}.`,
          details: {
            plan: quota.plan,
            used: quota.used,
            limit: quota.limit,
            requested: extractedCount,
            minimumPlan: "Pro",
          },
        }, buildApiMeta(req, startedAt));
        return;
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
          message: `Sync completed for ${type} (attempts=${syncAttempts})`,
          at: new Date().toISOString(),
        },
      });

      sendApiSuccess(res, 200, {
        message: `Successfully synced ${type}.`,
        extractedCount,
        connectorUsage: {
          used: consumed.used,
          limit: consumed.limit,
          plan: consumed.plan,
        },
      }, buildApiMeta(req, startedAt));
    } catch (error) {
      try {
        const existing = await prisma.connector.findUnique({
          where: { id: `${userId}_${type}` },
        });
        const config = getConnectorConfig(existing?.configJson);
        await prisma.connector.update({
          where: { id: `${userId}_${type}` },
          data: {
            status: "error",
            configJson: JSON.stringify({
              ...config,
              syncStartedAt: null,
              retryCount: typeof config.retryCount === "number" ? config.retryCount + 1 : 1,
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
      sendApiError(res, 500, {
        code: "SYNC_FAILED",
        message: error instanceof Error ? error.message : "Failed to sync connector"
      }, buildApiMeta(req, Date.now()));
    }
  })
);


