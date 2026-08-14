/* eslint-disable @typescript-eslint/no-explicit-any */
import { extractMemory } from "../memory/extractMemory";
import { upsertRecentMemory } from "../memory/recentMemoryStore";
import { GitHubClient } from "./github";
import { NotionClient } from "./notion";
import { GoogleClient } from "./google";
import { MicrosoftClient } from "./microsoft";
import { LocalFilesClient } from "./localFiles";
import {
  EngineeringSignalFilesClient,
  isEngineeringSignalConnectorType,
} from "./engineeringSignalFiles";
import { GmailClient } from "./gmail";
import { SlackClient } from "./slack";
import { ZendeskClient } from "./zendesk";
import { JiraClient } from "./jira";
import { LinearClient } from "./linear";
import { GitHubActionsClient } from "./githubActions";
import { SentryClient } from "./sentry";
import { DevinClient } from "./devin";
import { randomUUID } from "crypto";

export type ConnectorType =
  | "github"
  | "notion"
  | "google_drive"
  | "onedrive"
  | "gmail"
  | "slack"
  | "local_files"
  | "ide_chats"
  | "cursor_chats"
  | "vs_code_chats"
  | "codex_chats"
  | "chatgpt_chats"
  | "windsurf_chats"
  | "devin_chats"
  | "ci_cd_logs"
  | "deployment_errors"
  | "zendesk"
  | "jira"
  | "linear";

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
  sourceItemCount?: number;
  checkpoint?: string;
  dedupeKeys?: string[];
  attempts?: number;
  contractCounts?: Record<string, number>;
  repoFullNames?: string[];
  repoPullRequestsByRepo?: Record<
    string,
    Array<{
      number: number;
      title: string;
      state: string;
      updatedAt: string | null;
      htmlUrl: string | null;
    }>
  >;
};

const CONNECTOR_SYNC_MAX_ATTEMPTS = Math.max(1, Number(process.env.CONNECTOR_SYNC_MAX_ATTEMPTS ?? 3));
const CONNECTOR_SYNC_BACKOFF_MS = Math.max(100, Number(process.env.CONNECTOR_SYNC_BACKOFF_MS ?? 750));
const CONNECTOR_SYNC_ATTEMPT_TIMEOUT_MS = Math.max(
  5_000,
  Number(process.env.CONNECTOR_SYNC_ATTEMPT_TIMEOUT_MS ?? 30_000),
);

class ConnectorSyncAttemptTimeoutError extends Error {
  readonly noInlineRetry = true;

  constructor(label: string) {
    super(`${label} timed out after ${CONNECTOR_SYNC_ATTEMPT_TIMEOUT_MS}ms`);
    this.name = "ConnectorSyncAttemptTimeoutError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withSyncAttemptTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => {
          reject(new ConnectorSyncAttemptTimeoutError(label));
        }, CONNECTOR_SYNC_ATTEMPT_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export function isInlineRetryableSyncError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if ("noInlineRetry" in error && (error as { noInlineRetry?: unknown }).noInlineRetry === true) return false;
  const maybeStatus = "status" in error ? Number((error as { status?: unknown }).status) : NaN;
  if (Number.isFinite(maybeStatus) && maybeStatus >= 500) return true;
  const message =
    "message" in error && typeof (error as { message?: unknown }).message === "string"
      ? (error as { message: string }).message.toLowerCase()
      : "";
  return (
    message.includes("timeout")
    || message.includes("fetch failed")
    || message.includes("network")
    || message.includes("enotfound")
    || message.includes("etimedout")
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
      const value = await withSyncAttemptTimeout(run(), label);
      return { value, attempts };
    } catch (error) {
      lastError = error;
      if (attempts >= CONNECTOR_SYNC_MAX_ATTEMPTS || !isInlineRetryableSyncError(error)) break;
      const backoff = CONNECTOR_SYNC_BACKOFF_MS * Math.pow(2, attempts - 1);
      console.warn(`[ConnectorManager] ${label} failed attempt=${attempts}, retrying in ${backoff}ms`);
      await sleep(backoff);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`${label} failed`);
}

function countContractCategories(
  candidates: Array<{ contractCategory?: string }>,
): Record<string, number> {
  return candidates.reduce<Record<string, number>>((counts, candidate) => {
    if (candidate.contractCategory) {
      counts[candidate.contractCategory] = (counts[candidate.contractCategory] ?? 0) + 1;
    }
    return counts;
  }, {});
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
      return { success: true, extractedCount: 0, contractCounts: {} };
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
      extractedCount: candidates.length,
      contractCounts: countContractCategories(candidates),
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
    connectorConfig?: Record<string, unknown>,
  ): Promise<ConnectorSyncResult> {
    if (process.env.CONNECTOR_SYNC_VERBOSE_LOGS === "true") {
      console.log(`[ConnectorManager] Triggering ${type} sync for user ${userId}`);
    }

    if (type === "local_files") {
      const localRootPath =
        typeof connectorConfig?.rootPath === "string" ? connectorConfig.rootPath : undefined;
      const { value, attempts } = await withRetry(
        () => LocalFilesClient.sync({ userId, recentItemKeys, rootPath: localRootPath }),
        "local_files sync",
      );
      return { ...value, attempts };
    }

    if (type === "ci_cd_logs" && connectorConfig?.provider === "github_actions") {
      if (!accessToken) {
        throw new Error("ci_cd_logs GitHub Actions sync requires a GitHub access token. Connect GitHub first.");
      }
      const { value, attempts } = await withRetry(
        () => GitHubActionsClient.sync({ userId, accessToken, since, recentItemKeys }),
        "github_actions ci_cd_logs sync",
      );
      return { ...value, attempts };
    }

    if (type === "deployment_errors" && connectorConfig?.provider === "sentry") {
      if (!accessToken) {
        throw new Error("deployment_errors Sentry sync requires a Sentry auth token.");
      }
      const sentryConfig = connectorConfig ?? {};
      const { value, attempts } = await withRetry(
        () =>
          SentryClient.sync({
            userId,
            accessToken,
            since,
            recentItemKeys,
            config: {
              orgSlug: typeof sentryConfig.orgSlug === "string" ? sentryConfig.orgSlug : undefined,
              baseUrl: typeof sentryConfig.baseUrl === "string" ? sentryConfig.baseUrl : undefined,
              projectSlugs: Array.isArray(sentryConfig.projectSlugs)
                ? sentryConfig.projectSlugs.filter((item): item is string => typeof item === "string")
                : undefined,
            },
          }),
        "sentry deployment_errors sync",
      );
      return { ...value, attempts };
    }

    if (type === "devin_chats" && connectorConfig?.provider === "devin") {
      const devinConfig = connectorConfig ?? {};
      const devinAccessToken =
        typeof devinConfig.accessToken === "string" && devinConfig.accessToken.trim()
          ? devinConfig.accessToken.trim()
          : accessToken;
      const devinOrgId =
        typeof devinConfig.devinOrgId === "string" && devinConfig.devinOrgId.trim()
          ? devinConfig.devinOrgId.trim()
          : "";
      if (!devinAccessToken || !devinOrgId) {
        throw new Error("devin_chats Devin API sync requires DEVIN_SERVICE_USER_TOKEN and DEVIN_ORG_ID.");
      }
      const { value, attempts } = await withRetry(
        () =>
          DevinClient.sync({
            userId,
            accessToken: devinAccessToken,
            orgId: devinOrgId,
            baseUrl: typeof devinConfig.baseUrl === "string" ? devinConfig.baseUrl : undefined,
            since,
            recentItemKeys,
          }),
        "devin devin_chats sync",
      );
      return { ...value, attempts };
    }

    if (isEngineeringSignalConnectorType(type)) {
      const localRootPath =
        typeof connectorConfig?.rootPath === "string" ? connectorConfig.rootPath : undefined;
      const { value, attempts } = await withRetry(
        () => EngineeringSignalFilesClient.sync({ userId, type, recentItemKeys, rootPath: localRootPath }),
        `${type} sync`,
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

    if (type === "zendesk") {
      const { value, attempts } = await withRetry(
        () => ZendeskClient.sync({ userId, accessToken, since, recentItemKeys }),
        "zendesk sync",
      );
      return { ...value, attempts };
    }

    if (type === "jira") {
      const jiraConfig = connectorConfig ?? {};
      const { value, attempts } = await withRetry(
        () =>
          JiraClient.sync({
            userId,
            accessToken,
            since,
            recentItemKeys,
            config: {
              authMode: jiraConfig.authMode === "pat" ? "pat" : "oauth",
              siteUrl: typeof jiraConfig.siteUrl === "string" ? jiraConfig.siteUrl : undefined,
              email: typeof jiraConfig.email === "string" ? jiraConfig.email : undefined,
              projectKeys: Array.isArray(jiraConfig.projectKeys)
                ? jiraConfig.projectKeys.filter((item): item is string => typeof item === "string")
                : undefined,
              cloudId: typeof jiraConfig.cloudId === "string" ? jiraConfig.cloudId : undefined,
              browseBaseUrl:
                typeof jiraConfig.browseBaseUrl === "string" ? jiraConfig.browseBaseUrl : undefined,
            },
          }),
        "jira sync",
      );
      return { ...value, attempts };
    }

    if (type === "linear") {
      const linearConfig = connectorConfig ?? {};
      const { value, attempts } = await withRetry(
        () =>
          LinearClient.sync({
            userId,
            accessToken,
            since,
            recentItemKeys,
            config: {
              authMode: linearConfig.authMode === "oauth" ? "oauth" : "api_key",
              teamKeys: Array.isArray(linearConfig.teamKeys)
                ? linearConfig.teamKeys.filter((item): item is string => typeof item === "string")
                : undefined,
            },
          }),
        "linear sync",
      );
      return { ...value, attempts };
    }

    // Fallback for types not yet fully implemented
    console.warn(`[ConnectorManager] Sync for ${type} is not fully implemented yet.`);

    return { success: true, extractedCount: 0 };
  }
};
