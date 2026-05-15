/* eslint-disable @typescript-eslint/no-explicit-any */
import { extractMemory } from "../memory/extractMemory";
import { upsertRecentMemory } from "../memory/recentMemoryStore";
import { GitHubClient } from "./github";
import { NotionClient } from "./notion";
import { GoogleClient } from "./google";
import { MicrosoftClient } from "./microsoft";
import { LocalFilesClient } from "./localFiles";
import { GmailClient } from "./gmail";
import { SlackClient } from "./slack";
import { randomUUID } from "crypto";

export type ConnectorType =
  | "github"
  | "notion"
  | "google_drive"
  | "onedrive"
  | "gmail"
  | "slack"
  | "local_files";

export interface ConnectorPayload {
  userId: string;
  source: ConnectorType;
  externalId: string;
  content: string;
  metadata?: Record<string, any>;
}

export type ConnectorSyncResult = {
  success: boolean;
  extractedCount: number;
  checkpoint?: string;
  dedupeKeys?: string[];
  attempts?: number;
};

const CONNECTOR_SYNC_MAX_ATTEMPTS = Math.max(1, Number(process.env.CONNECTOR_SYNC_MAX_ATTEMPTS ?? 3));
const CONNECTOR_SYNC_BACKOFF_MS = Math.max(100, Number(process.env.CONNECTOR_SYNC_BACKOFF_MS ?? 750));

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableSyncError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeStatus = "status" in error ? Number((error as { status?: unknown }).status) : NaN;
  if (Number.isFinite(maybeStatus) && maybeStatus >= 500) return true;
  const message =
    "message" in error && typeof (error as { message?: unknown }).message === "string"
      ? (error as { message: string }).message.toLowerCase()
      : "";
  return (
    message.includes("timeout")
    || message.includes("network")
    || message.includes("temporar")
    || message.includes("econnreset")
    || message.includes("429")
    || message.includes("rate limit")
  );
}

async function withRetry<T>(run: () => Promise<T>, label: string): Promise<{ value: T; attempts: number }> {
  let attempts = 0;
  let lastError: unknown;
  while (attempts < CONNECTOR_SYNC_MAX_ATTEMPTS) {
    attempts += 1;
    try {
      const value = await run();
      return { value, attempts };
    } catch (error) {
      lastError = error;
      if (attempts >= CONNECTOR_SYNC_MAX_ATTEMPTS || !isRetryableSyncError(error)) break;
      const backoff = CONNECTOR_SYNC_BACKOFF_MS * Math.pow(2, attempts - 1);
      console.warn(`[ConnectorManager] ${label} failed attempt=${attempts}, retrying in ${backoff}ms`);
      await sleep(backoff);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`${label} failed`);
}

/**
 * The ConnectorManager is the central hub for processing real-time data 
 * from external sources like Notion, GitHub, and Drive.
 */
export const ConnectorManager = {
  /**
   * Processes an incoming real-time signal from a connected source.
   * This handles the extraction of "Developer Memory" from raw content.
   */
  async processSignal(payload: ConnectorPayload) {
    console.log(`[ConnectorManager] Processing signal from ${payload.source}:${payload.externalId}`);

    // 1. Extract Memories using the core memory engine
    const candidates = extractMemory({
      userId: payload.userId,
      message: payload.content
    });

    if (candidates.length === 0) {
      console.log(`[ConnectorManager] No memories extracted from ${payload.source} payload.`);
      return { success: true, extractedCount: 0 };
    }

    // 2. Commit extracted memories to the store
    const now = new Date().toISOString();
    for (const candidate of candidates) {
      await upsertRecentMemory({
        ...candidate,
        id: randomUUID(),
        source: "chat", // Only allowed types: chat, system, import
        status: "active",
        createdAt: now,
        updatedAt: now,
        importanceScore: 0.8,
        confidence: 0.9,
        evidenceCount: 1,
        developerSignals: {
          ...candidate.developerSignals,
          // We can't easily add arbitrary metadata here without updating DeveloperSignals,
          // so we keep the extracted signals.
        }
      });
    }

    console.log(`[ConnectorManager] Successfully committed ${candidates.length} memories from ${payload.source}`);

    return {
      success: true,
      extractedCount: candidates.length
    };
  },

  /**
   * Triggers a real sync for a specific connector.
   */
  async triggerSync(
    userId: string,
    type: ConnectorType,
    accessToken?: string,
    since?: string,
    recentItemKeys?: string[],
  ): Promise<ConnectorSyncResult> {
    console.log(`[ConnectorManager] Triggering ${type} sync for user ${userId}`);

    if (type === "local_files") {
      const { value, attempts } = await withRetry(
        () => LocalFilesClient.sync({ userId, recentItemKeys }),
        "local_files sync",
      );
      return { ...value, attempts };
    }

    if (!accessToken) {
      throw new Error(`${type} access token is required for sync.`);
    }

    if (type === "github") {
      const { value, attempts } = await withRetry(
        () => GitHubClient.sync({ userId, accessToken, since, recentItemKeys }),
        "github sync",
      );
      return { ...value, attempts };
    }

    if (type === "notion") {
      const { value, attempts } = await withRetry(
        () => NotionClient.sync({ userId, accessToken, since, recentItemKeys }),
        "notion sync",
      );
      return { ...value, attempts };
    }

    if (type === "google_drive") {
      const { value, attempts } = await withRetry(
        () => GoogleClient.sync({ userId, accessToken }),
        "google_drive sync",
      );
      return { ...value, attempts };
    }

    if (type === "onedrive") {
      const { value, attempts } = await withRetry(
        () => MicrosoftClient.sync({ userId, accessToken }),
        "onedrive sync",
      );
      return { ...value, attempts };
    }

    if (type === "gmail") {
      const { value, attempts } = await withRetry(
        () => GmailClient.sync({ userId, accessToken, since, recentItemKeys }),
        "gmail sync",
      );
      return { ...value, attempts };
    }

    if (type === "slack") {
      const { value, attempts } = await withRetry(
        () => SlackClient.sync({ userId, accessToken, since, recentItemKeys }),
        "slack sync",
      );
      return { ...value, attempts };
    }

    // Fallback for types not yet fully implemented
    console.warn(`[ConnectorManager] Sync for ${type} is not fully implemented yet.`);

    return { success: true, extractedCount: 0 };
  }
};
