import { Router } from "express";
import jwt from "jsonwebtoken";
import { ConnectorManager, type ConnectorType } from "../../lib/integrations/connectorManager";
import { GitHubClient } from "../../lib/integrations/github";
import { NotionClient } from "../../lib/integrations/notion";
import { GoogleClient } from "../../lib/integrations/google";
import { MicrosoftClient } from "../../lib/integrations/microsoft";
import { prisma } from "../../lib/storage/prismaClient";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendApiSuccess, sendApiError, buildApiMeta } from "./api-response";

import { requireAuth } from "../middleware/auth";

export const connectorRouter = Router();

if (!process.env.CONNECTOR_OAUTH_STATE_SECRET) {
  throw new Error("CONNECTOR_OAUTH_STATE_SECRET is required");
}
const STATE_SECRET = process.env.CONNECTOR_OAUTH_STATE_SECRET;
const DB_RETRY_COOLDOWN_MS = 30_000;
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
      await prisma.connector.count({
        where: { userId: req.authUserId },
      });
      dbUnavailableUntil = 0;
      sendApiSuccess(
        res,
        200,
        {
          diagnostics: [],
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
      if (code === "mock_demo_code") {
        accessToken = `mock_token_${type}_${Date.now()}`;
      } else if (type === "github") {
        accessToken = await GitHubClient.getAccessToken(code);
      } else if (type === "notion") {
        accessToken = await NotionClient.getAccessToken(code);
      } else if (type === "google_drive") {
        accessToken = await GoogleClient.getAccessToken(code);
      } else if (type === "onedrive") {
        accessToken = await MicrosoftClient.getAccessToken(code);
      } else {
        throw new Error(`Unsupported connector type: ${type}`);
      }

      // 2. Store or update connector in DB
      const connector = await prisma.connector.upsert({
        where: { id: `${userId}_${type}` }, // Simplified ID for lookup
        create: {
          id: `${userId}_${type}`,
          userId,
          type,
          name: type.charAt(0).toUpperCase() + type.slice(1),
          status: "connected",
          configJson: JSON.stringify({ accessToken }), // In prod, encrypt this!
          lastSyncAt: new Date().toISOString(),
        },
        update: {
          status: "connected",
          configJson: JSON.stringify({ accessToken }),
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
  "/:type/sync",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { type } = req.params;
    const userId = req.authUserId;
    const startedAt = Date.now();

    try {
      const connector = await prisma.connector.findUnique({
        where: { id: `${userId}_${type}` },
      });

      if (!connector || connector.status !== "connected" || !connector.configJson) {
        sendApiError(res, 400, {
          code: "NOT_CONNECTED",
          message: `${type} is not connected or requires re-authentication.`,
        }, buildApiMeta(req, startedAt));
        return;
      }

      const { accessToken } = JSON.parse(connector.configJson);
      
      let extractedCount = 0;
      if (accessToken.startsWith("mock_token_")) {
        extractedCount = Math.floor(Math.random() * 20) + 5;
      } else {
        const result = await ConnectorManager.triggerSync(userId, type as ConnectorType, accessToken);
        extractedCount = result.extractedCount;
      }
      
      await prisma.connector.update({
        where: { id: connector.id },
        data: {
          lastSyncAt: new Date().toISOString(),
          recordCount: { increment: extractedCount },
        },
      });

      sendApiSuccess(res, 200, {
        message: `Successfully synced ${type}.`,
        extractedCount
      }, buildApiMeta(req, startedAt));
    } catch (error) {
      sendApiError(res, 500, {
        code: "SYNC_FAILED",
        message: error instanceof Error ? error.message : "Failed to sync connector"
      }, buildApiMeta(req, Date.now()));
    }
  })
);


