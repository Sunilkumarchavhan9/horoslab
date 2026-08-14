/**
 * Runtime helpers and connector state for Continuity Lab.
 * Native sessions embed only the sandbox VS Code URL (see openhands-api.fetchVsCodePanelUrl).
 * buildLabIframeSrc is legacy for the unused full-page OH iframe session component.
 */

import { consoleAuthHeaders } from "@/lib/console-api";
import {
  parseRuntimeSettings,
  type RuntimeSettings,
} from "@/lib/continuity-lab/runtime-settings";

export {
  parseRuntimeSettings,
  resolveModelReady,
  type RuntimeSettings,
} from "@/lib/continuity-lab/runtime-settings";

type ConnectorRepoPayload = {
  fullName?: string;
  full_name?: string;
  full_name_with_owner?: string;
  name?: string;
  private?: boolean;
  is_private?: boolean;
  defaultBranch?: string;
  default_branch?: string;
  default_branch_ref?: string;
  default_branch_name?: string;
  updatedAt?: string | null;
  updated_at?: string | null;
};

export type MemoryOsConnectorState = {
  type: "memoryos:connector-state";
  payload: {
    github: {
      connected: boolean;
      status: string;
      records: number;
      lastSyncAt: string | null;
      profile: {
        login: string;
        name: string | null;
        avatarUrl: string | null;
        htmlUrl: string | null;
      } | null;
      repos: Array<{
        fullName: string;
        private: boolean;
        defaultBranch: string;
        updatedAt: string | null;
      }>;
    };
  };
};

export const EMPTY_CONNECTOR_STATE: MemoryOsConnectorState = {
  type: "memoryos:connector-state",
  payload: {
    github: {
      connected: false,
      status: "not_connected",
      records: 0,
      lastSyncAt: null,
      profile: null,
      repos: [],
    },
  },
};

const CONNECTOR_STATE_STORAGE_KEY = "memoryos.connectorState";
let githubStateRefreshInFlight: Promise<void> | null = null;

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: unknown };
  return (record.data ?? payload) as T;
}

function readPersistedConnectorState(): MemoryOsConnectorState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONNECTOR_STATE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      (parsed as { type?: unknown }).type === "memoryos:connector-state" &&
      typeof (parsed as { payload?: unknown }).payload === "object"
    ) {
      return parsed as MemoryOsConnectorState;
    }
  } catch {
    // Ignore malformed cache entries and fall back to live state.
  }
  return null;
}

function writePersistedConnectorState(state: MemoryOsConnectorState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONNECTOR_STATE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota / privacy mode failures.
  }
}

function clearPersistedConnectorState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CONNECTOR_STATE_STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
}

function connectorRepoToSummary(repo: ConnectorRepoPayload): MemoryOsConnectorState["payload"]["github"]["repos"][number] {
  return {
    fullName:
      repo.fullName ??
      repo.full_name ??
      repo.full_name_with_owner ??
      repo.name ??
      "",
    private: Boolean(repo.private ?? repo.is_private),
    defaultBranch:
      repo.defaultBranch ??
      repo.default_branch ??
      repo.default_branch_ref ??
      repo.default_branch_name ??
      "main",
    updatedAt: repo.updatedAt ?? repo.updated_at ?? null,
  };
}

function queueGithubStateRefresh(
  headers: Headers,
  nextState: MemoryOsConnectorState,
  persistedState: MemoryOsConnectorState | null,
): void {
  if (githubStateRefreshInFlight) return;
  githubStateRefreshInFlight = Promise.all([
    fetch("/api/connector/github/profile", { headers, cache: "no-store" })
      .then((r) => r.json())
      .then((p) =>
        unwrapData<{
          profile?: MemoryOsConnectorState["payload"]["github"]["profile"];
        }>(p),
      )
      .catch(() => null),
    fetch("/api/connector/github/repos?limit=20", {
      headers,
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((p) =>
        unwrapData<{
          repos?: MemoryOsConnectorState["payload"]["github"]["repos"];
        }>(p),
      )
      .catch(() => null),
  ])
    .then(([profilePayload, reposPayload]) => {
      const resolvedState: MemoryOsConnectorState = {
        ...nextState,
        payload: {
          github: {
            ...nextState.payload.github,
            profile:
              profilePayload?.profile ??
              persistedState?.payload.github.profile ??
              null,
            repos: Array.isArray(reposPayload?.repos)
              ? reposPayload.repos.map(connectorRepoToSummary)
              : persistedState?.payload.github.repos ?? [],
          },
        },
      };

      if (resolvedState.payload.github.connected) {
        writePersistedConnectorState(resolvedState);
      }
    })
    .catch(() => undefined)
    .finally(() => {
      githubStateRefreshInFlight = null;
    });
}

export function resolveLabPath(): string {
  const configured =
    process.env.NEXT_PUBLIC_CONTINUITY_LAB_URL ??
    process.env.NEXT_PUBLIC_OPENHANDS_WORKSPACE_URL;
  if (configured?.trim()) {
    try {
      const url = new URL(configured.trim(), "http://localhost");
      return `${url.pathname}${url.search}`;
    } catch {
      const trimmed = configured.trim().replace(/\/$/, "");
      return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    }
  }
  return "/openhands/";
}

export function buildLabIframeSrc(conversationId?: string | null): string {
  const basePath = resolveLabPath();
  let path = basePath;
  if (conversationId && conversationId !== "new") {
    const normalized = conversationId.startsWith("/")
      ? conversationId
      : `/conversations/${encodeURIComponent(conversationId)}`;
    const prefix = basePath.replace(/\/?$/, "");
    path = `${prefix}${normalized.startsWith("/") ? normalized : `/${normalized}`}`;
  }
  try {
    const url = new URL(
      path,
      typeof window !== "undefined"
        ? window.location.origin
        : "http://127.0.0.1:3000",
    );
    url.searchParams.set("memoryosEmbedded", "1");
    return url.pathname + url.search;
  } catch {
    const separator = path.includes("?") ? "&" : "?";
    return `${path}${separator}memoryosEmbedded=1`;
  }
}

export function resolveLabOrigin(labSrc: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return new URL(labSrc, window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
}

export type ConnectorStateLoadResult = {
  state: MemoryOsConnectorState;
  backendAvailable: boolean;
};

function resolveConnectorBackendAvailable(
  payload: unknown,
  responseOk: boolean,
): boolean {
  if (!responseOk) return false;
  if (!payload || typeof payload !== "object") return true;
  const record = payload as {
    data?: { backendAvailable?: boolean };
    meta?: { proxyFallback?: boolean };
  };
  if (record.meta?.proxyFallback) return false;
  if (record.data?.backendAvailable === false) return false;
  const unwrapped = unwrapData<{ backendAvailable?: boolean }>(payload);
  return unwrapped?.backendAvailable !== false;
}

export async function loadConnectorState(): Promise<ConnectorStateLoadResult> {
  const headers = await consoleAuthHeaders();
  const requestHeaders = new Headers(headers);
  const persistedState = readPersistedConnectorState();
  if (!requestHeaders.get("Authorization")) {
    return {
      state: persistedState ?? EMPTY_CONNECTOR_STATE,
      backendAvailable: false,
    };
  }

  try {
    const connectorsResponse = await fetch("/api/connector", {
      headers,
      cache: "no-store",
    });
    if (connectorsResponse.status === 429) {
      return { state: EMPTY_CONNECTOR_STATE, backendAvailable: false };
    }

    const rawPayload = await connectorsResponse.json().catch(() => null);
    const backendAvailable = resolveConnectorBackendAvailable(
      rawPayload,
      connectorsResponse.ok,
    );
    if (!connectorsResponse.ok) {
      return {
        state: persistedState ?? EMPTY_CONNECTOR_STATE,
        backendAvailable,
      };
    }

    const connectorsPayload = unwrapData<{
      connectors?: Array<{
        type: string;
        status: string;
        recordCount?: number;
        lastSyncAt?: string | null;
      }>;
      backendAvailable?: boolean;
    }>(rawPayload);

    const github = connectorsPayload?.connectors?.find(
      (c) => c.type === "github",
    );
    const connected =
      github?.status === "connected" || github?.status === "syncing";
    const stickyConnected = Boolean(persistedState?.payload.github.connected);
    const effectiveConnected = connected || stickyConnected;
    const nextState: MemoryOsConnectorState = {
      type: "memoryos:connector-state",
      payload: {
        github: {
          connected: effectiveConnected,
          status:
            connected
              ? github?.status ?? "connected"
              : persistedState?.payload.github.status ?? github?.status ?? "not_connected",
          records:
            connected
              ? github?.recordCount ?? 0
              : persistedState?.payload.github.records ?? github?.recordCount ?? 0,
          lastSyncAt:
            connected
              ? github?.lastSyncAt ?? persistedState?.payload.github.lastSyncAt ?? null
              : persistedState?.payload.github.lastSyncAt ?? github?.lastSyncAt ?? null,
          profile: null,
          repos: [],
        },
      },
    };

    const resolvedState: MemoryOsConnectorState = {
      ...nextState,
      payload: {
        github: {
          ...nextState.payload.github,
          profile: persistedState?.payload.github.profile ?? null,
          repos: persistedState?.payload.github.repos ?? [],
        },
      },
    };

    if (effectiveConnected) {
      queueGithubStateRefresh(requestHeaders, nextState, persistedState);
    }

    if (resolvedState.payload.github.connected) {
      writePersistedConnectorState(resolvedState);
    } else {
      if (!stickyConnected) {
        clearPersistedConnectorState();
      }
    }

    return {
      state: resolvedState,
      backendAvailable,
    };
  } catch {
    return {
      state: persistedState ?? EMPTY_CONNECTOR_STATE,
      backendAvailable: false,
    };
  }
}

export async function syncRuntimeCredentials(): Promise<void> {
  await Promise.all([
    fetch("/api/runtime/github-provider-token", {
      method: "POST",
      cache: "no-store",
    }).catch(() => null),
    fetch("/api/runtime/openrouter-provider-key", {
      method: "POST",
      cache: "no-store",
    }).catch(() => null),
  ]);
}

export async function fetchRuntimeSettings(): Promise<RuntimeSettings | null> {
  try {
    const res = await fetch("/api/runtime/company-model", {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const raw = (await res.json().catch(() => null)) as {
      data?: RuntimeSettings;
      model?: string | null;
      apiKeySet?: boolean;
    } | null;
    const payload = raw?.data ?? raw;
    return parseRuntimeSettings(
      payload && typeof payload === "object"
        ? {
            llm_api_key_set: Boolean(
              (payload as RuntimeSettings).llm_api_key_set ?? raw?.apiKeySet,
            ),
            llm_model:
              (payload as RuntimeSettings).llm_model ??
              (typeof raw?.model === "string" ? raw.model : null),
            agent_settings: (payload as RuntimeSettings).agent_settings,
          }
        : null,
    );
  } catch {
    return null;
  }
}
