import { Router } from "express";
import jwt from "jsonwebtoken";
import { ConnectorManager, type ConnectorType } from "../../lib/integrations/connectorManager";
import { GitHubClient } from "../../lib/integrations/github";
import { NotionClient } from "../../lib/integrations/notion";
import { GoogleClient } from "../../lib/integrations/google";
import { MicrosoftClient } from "../../lib/integrations/microsoft";
import { appendConnectorSyncLog, listConnectorSyncLogs } from "../../lib/integrations/syncLogStore";
import { prisma } from "../../lib/storage/prismaClient";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendApiSuccess, sendApiError, buildApiMeta } from "./api-response";
import { randomUUID } from "crypto";

import { requireAuth } from "../middleware/auth";

export const connectorRouter = Router();

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


/**
 * List all connectors for the current user.
 */
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
    } else if (type === "onedrive") {
      authorizeUrl = process.env.MICROSOFT_CLIENT_ID 
        ? MicrosoftClient.getAuthorizeUrl(state) 
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
      } else if (type === "onedrive") {
        accessToken = await MicrosoftClient.getAccessToken(code);
      } else {
        throw new Error(`Unsupported connector type: ${type}`);
      }

      // 2. Store or update connector in DB
      const tokenConfig: Record<string, unknown> = { accessToken };
      if (type === "google_drive" && googleRefreshToken) {
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
        const result = await ConnectorManager.triggerSync(
          userId,
          type as ConnectorType,
          accessToken,
          previousCheckpoint,
          recentItemKeys,
        );
        extractedCount = result.extractedCount;
        checkpoint = typeof result.checkpoint === "string" ? result.checkpoint : undefined;
        dedupeKeys = Array.isArray(result.dedupeKeys) ? result.dedupeKeys : [];
        syncAttempts = typeof result.attempts === "number" ? result.attempts : 1;
      }
      const nextRecentItemKeys = Array.from(new Set([...recentItemKeys, ...dedupeKeys])).slice(-500);
      
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

      sendApiSuccess(res, 200, {
        message: `Successfully synced ${type}.`,
        extractedCount
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
      sendApiError(res, 500, {
        code: "SYNC_FAILED",
        message: error instanceof Error ? error.message : "Failed to sync connector"
      }, buildApiMeta(req, Date.now()));
    }
  })
);


