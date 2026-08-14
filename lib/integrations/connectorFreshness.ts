/**
 * Connector sync freshness — lag, stale thresholds, and operator-facing status labels.
 */

export type ConnectorFreshnessLabel = "fresh" | "stale" | "error" | "syncing" | "offline";

export type ConnectorFreshnessInput = {
  type: string;
  status: string;
  lastSyncAt: string | null;
  recordCount: number;
  lastFailureReason?: string | null;
  lastFailureAt?: string | null;
  lastSyncLogError?: string | null;
};

export type ConnectorFreshnessSnapshot = {
  type: string;
  status: string;
  lastSyncAt: string | null;
  recordCount: number;
  freshnessLagSeconds: number | null;
  stale: boolean;
  staleThresholdSeconds: number;
  lastError: string | null;
  syncInProgress: boolean;
  freshness: ConnectorFreshnessLabel;
};

const DEFAULT_STALE_SECONDS = 3600;

/** Per-type defaults when CONNECTOR_FRESHNESS_STALE_SECONDS is unset. */
const STALE_SECONDS_BY_TYPE: Record<string, number> = {
  github: 3600,
  local_files: 7200,
  ide_chats: 7200,
  cursor_chats: 7200,
  vs_code_chats: 7200,
  codex_chats: 7200,
  chatgpt_chats: 7200,
  windsurf_chats: 7200,
  devin_chats: 7200,
  ci_cd_logs: 3600,
  deployment_errors: 3600,
  google_drive: 7200,
  onedrive: 7200,
  gmail: 3600,
  slack: 1800,
  zendesk: 3600,
  jira: 3600,
};

function parsePositiveInt(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function resolveConnectorStaleThresholdSeconds(type?: string): number {
  const global = parsePositiveInt(process.env.CONNECTOR_FRESHNESS_STALE_SECONDS);
  if (global) return global;
  if (type && STALE_SECONDS_BY_TYPE[type]) return STALE_SECONDS_BY_TYPE[type];
  return DEFAULT_STALE_SECONDS;
}

function summarizeError(...candidates: Array<string | null | undefined>): string | null {
  for (const value of candidates) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed.length > 240 ? `${trimmed.slice(0, 240).trim()}…` : trimmed;
    }
  }
  return null;
}

function parseTimestamp(value: string | null | undefined): number | null {
  if (!value?.trim()) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

export function buildConnectorFreshness(input: ConnectorFreshnessInput): ConnectorFreshnessSnapshot {
  const staleThresholdSeconds = resolveConnectorStaleThresholdSeconds(input.type);
  const syncInProgress = input.status === "syncing";
  const lastError = summarizeError(
    input.status === "error" ? input.lastFailureReason : null,
    input.lastFailureReason,
    input.lastSyncLogError,
  );

  if (input.status === "not_connected" || input.status === "pending") {
    return {
      type: input.type,
      status: input.status,
      lastSyncAt: input.lastSyncAt,
      recordCount: input.recordCount,
      freshnessLagSeconds: null,
      stale: false,
      staleThresholdSeconds,
      lastError,
      syncInProgress,
      freshness: "offline",
    };
  }

  if (syncInProgress) {
    return {
      type: input.type,
      status: input.status,
      lastSyncAt: input.lastSyncAt,
      recordCount: input.recordCount,
      freshnessLagSeconds: null,
      stale: false,
      staleThresholdSeconds,
      lastError,
      syncInProgress: true,
      freshness: "syncing",
    };
  }

  if (input.status === "error" || lastError) {
    const lastSyncMs = parseTimestamp(input.lastSyncAt);
    const freshnessLagSeconds =
      lastSyncMs !== null ? Math.max(0, Math.floor((Date.now() - lastSyncMs) / 1000)) : null;
    return {
      type: input.type,
      status: input.status,
      lastSyncAt: input.lastSyncAt,
      recordCount: input.recordCount,
      freshnessLagSeconds,
      stale: true,
      staleThresholdSeconds,
      lastError,
      syncInProgress: false,
      freshness: "error",
    };
  }

  const lastSyncMs = parseTimestamp(input.lastSyncAt);
  const freshnessLagSeconds =
    lastSyncMs !== null ? Math.max(0, Math.floor((Date.now() - lastSyncMs) / 1000)) : null;
  const stale =
    input.status === "connected" &&
    (freshnessLagSeconds === null || freshnessLagSeconds > staleThresholdSeconds);

  return {
    type: input.type,
    status: input.status,
    lastSyncAt: input.lastSyncAt,
    recordCount: input.recordCount,
    freshnessLagSeconds,
    stale,
    staleThresholdSeconds,
    lastError,
    syncInProgress: false,
    freshness: stale ? "stale" : "fresh",
  };
}
