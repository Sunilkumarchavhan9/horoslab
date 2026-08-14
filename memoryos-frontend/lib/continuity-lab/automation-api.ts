import { consoleApiFetch } from "@/lib/console-api";
import { getOrCreateMemoryToken } from "@/lib/memory-token";
import {
  readClerkOrganizationId,
  readDevConsoleOrganizationId,
  syncMemoryOSOrgCookie,
} from "@/lib/org-scope-client";
import { broadcastAutomationsChanged } from "@/lib/continuity-lab/automation-events";
import {
  readAutomationStorage,
  saveAutomationStorage,
  type RecentAutomation,
  type SavedAutomation,
} from "@/lib/continuity-lab/automation-storage";

export type AutomationsListScope = "all" | "mine";

export type AutomationRunStatus = "queued" | "running" | "completed" | "failed";

export type AutomationRun = {
  id: string;
  automationId: string;
  status: AutomationRunStatus;
  triggerType: "manual" | "schedule" | "webhook" | "github" | "slack" | "linear";
  startedBy: string;
  startedAt: string;
  updatedAt: string;
  finishedAt?: string;
  sessionPath?: string;
  error?: string;
  metadata: Record<string, unknown>;
};

export type AutomationTriggerJob = {
  id: string;
  orgId: string;
  automationId: string;
  enqueuedBy: string;
  triggerType: AutomationRun["triggerType"];
  payload: Record<string, unknown>;
  enqueuedAt: string;
};

export type AutomationsListResponse = {
  orgId: string;
  automations: SavedAutomation[];
  recentAutomations: RecentAutomation[];
  currentUserId?: string;
  realtimeStatus: "sse";
  executionStatus: "manual_trigger_supported";
  executionNote: string;
};

export type AutomationResponse = {
  orgId: string;
  automation: SavedAutomation;
  runs?: AutomationRun[];
  realtimeStatus: "sse";
  executionStatus: "manual_trigger_supported";
  executionNote: string;
};

export type CreateAutomationRunInput = {
  status?: AutomationRunStatus;
  triggerType?: AutomationRun["triggerType"];
  sessionPath?: string;
  error?: string;
  metadata?: Record<string, unknown>;
};

export type TriggerAutomationInput = {
  triggerType?: AutomationRun["triggerType"];
  payload?: Record<string, unknown>;
};

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: unknown; ok?: boolean };
  if (record.ok === false) return null;
  return (record.data ?? payload) as T;
}

function upsertAutomationCache(
  automation: SavedAutomation,
  options?: { orgId?: string; recentAutomations?: RecentAutomation[]; broadcast?: boolean },
): void {
  const state = readAutomationStorage();
  const automations = [
    automation,
    ...state.automations.filter((row) => row.id !== automation.id),
  ];
  saveAutomationStorage(
    {
      automations,
      recentAutomations: options?.recentAutomations ?? state.recentAutomations,
    },
    {
      orgId: options?.orgId,
      broadcast: false,
      reason: "api-upsert",
    },
  );
  if (options?.broadcast !== false) {
    broadcastAutomationsChanged({
      orgId: options?.orgId,
      automation,
      automations,
      recentAutomations: options?.recentAutomations ?? state.recentAutomations,
      updatedAt: new Date().toISOString(),
      reason: "api-upsert",
    });
  }
}

function applyListCache(response: AutomationsListResponse): AutomationsListResponse {
  saveAutomationStorage(
    {
      automations: response.automations,
      recentAutomations: response.recentAutomations ?? [],
    },
    { orgId: response.orgId, broadcast: false, reason: "api-list" },
  );
  broadcastAutomationsChanged({
    orgId: response.orgId,
    automations: response.automations,
    recentAutomations: response.recentAutomations,
    updatedAt: new Date().toISOString(),
    reason: "api-list",
  });
  return response;
}

export async function fetchAutomationsFromApi(
  scope: AutomationsListScope = "all",
): Promise<AutomationsListResponse | null> {
  try {
    const query = scope === "mine" ? "?scope=mine" : "?scope=all";
    const res = await consoleApiFetch(`/api/memory/automations${query}`);
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<AutomationsListResponse>(payload);
    if (!data?.orgId || !Array.isArray(data.automations)) return null;
    return applyListCache({
      ...data,
      recentAutomations: Array.isArray(data.recentAutomations) ? data.recentAutomations : [],
    });
  } catch {
    return null;
  }
}

export async function fetchAutomationFromApi(
  automationId: string,
): Promise<AutomationResponse | null> {
  try {
    const res = await consoleApiFetch(
      `/api/memory/automations/${encodeURIComponent(automationId)}`,
    );
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<AutomationResponse>(payload);
    if (!data?.orgId || !data.automation) return null;
    upsertAutomationCache(data.automation, { orgId: data.orgId });
    return data;
  } catch {
    return null;
  }
}

export async function createAutomationOnApi(
  input: Omit<SavedAutomation, "id" | "createdAt" | "updatedAt">,
): Promise<SavedAutomation | null> {
  try {
    const res = await consoleApiFetch("/api/memory/automations", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<AutomationResponse>(payload);
    if (!data?.automation) return null;
    upsertAutomationCache(data.automation, { orgId: data.orgId });
    return data.automation;
  } catch {
    return null;
  }
}

export async function patchAutomationOnApi(
  automationId: string,
  partial: Partial<Omit<SavedAutomation, "id" | "createdAt" | "updatedAt">>,
): Promise<SavedAutomation | null> {
  try {
    const res = await consoleApiFetch(
      `/api/memory/automations/${encodeURIComponent(automationId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(partial),
      },
    );
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<AutomationResponse>(payload);
    if (!data?.automation) return null;
    upsertAutomationCache(data.automation, { orgId: data.orgId });
    return data.automation;
  } catch {
    return null;
  }
}

export async function deleteAutomationOnApi(automationId: string): Promise<boolean> {
  try {
    const res = await consoleApiFetch(
      `/api/memory/automations/${encodeURIComponent(automationId)}`,
      { method: "DELETE" },
    );
    if (!res.ok) return false;
    const payload = await res.json().catch(() => null);
    const data = unwrapData<{ orgId?: string; automationId?: string }>(payload);
    const state = readAutomationStorage();
    const automations = state.automations.filter((row) => row.id !== automationId);
    const recentAutomations = state.recentAutomations.filter((row) => row.id !== automationId);
    saveAutomationStorage(
      { automations, recentAutomations },
      { orgId: data?.orgId, broadcast: false, reason: "api-delete" },
    );
    broadcastAutomationsChanged({
      orgId: data?.orgId,
      automationId,
      automations,
      recentAutomations,
      updatedAt: new Date().toISOString(),
      reason: "api-delete",
    });
    return true;
  } catch {
    return false;
  }
}

export async function touchAutomationOnApi(
  automationId: string,
): Promise<RecentAutomation[] | null> {
  try {
    const res = await consoleApiFetch(
      `/api/memory/automations/${encodeURIComponent(automationId)}/touch`,
      { method: "POST", body: JSON.stringify({}) },
    );
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{ orgId?: string; recentAutomations?: RecentAutomation[] }>(payload);
    if (!Array.isArray(data?.recentAutomations)) return null;
    const state = readAutomationStorage();
    saveAutomationStorage(
      { recentAutomations: data.recentAutomations },
      { orgId: data.orgId, broadcast: false, reason: "api-recent" },
    );
    broadcastAutomationsChanged({
      orgId: data.orgId,
      automations: state.automations,
      recentAutomations: data.recentAutomations,
      updatedAt: new Date().toISOString(),
      reason: "api-recent",
    });
    return data.recentAutomations;
  } catch {
    return null;
  }
}

export async function createAutomationRunOnApi(
  automationId: string,
  input: CreateAutomationRunInput,
): Promise<AutomationRun | null> {
  try {
    const res = await consoleApiFetch(
      `/api/memory/automations/${encodeURIComponent(automationId)}/runs`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{ orgId?: string; automationId?: string; run?: AutomationRun }>(payload);
    if (!data?.run) return null;
    broadcastAutomationsChanged({
      orgId: data.orgId,
      updatedAt: new Date().toISOString(),
      reason: "api-run",
    });
    return data.run;
  } catch {
    return null;
  }
}

export async function triggerAutomationOnApi(
  automationId: string,
  input: TriggerAutomationInput = {},
): Promise<AutomationTriggerJob | null> {
  try {
    const res = await consoleApiFetch(
      `/api/memory/automations/${encodeURIComponent(automationId)}/trigger`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      automationId?: string;
      job?: AutomationTriggerJob;
      executionStatus?: "queued";
    }>(payload);
    if (!data?.job) return null;
    broadcastAutomationsChanged({
      orgId: data.orgId,
      automationId: data.automationId ?? automationId,
      updatedAt: new Date().toISOString(),
      reason: "api-trigger-queued",
    });
    return data.job;
  } catch {
    return null;
  }
}

type AutomationSsePayload = {
  orgId?: string;
  automation?: SavedAutomation;
  automationId?: string;
  recentAutomations?: RecentAutomation[];
};

function parseAutomationEvent(event: MessageEvent): AutomationSsePayload | null {
  try {
    const parsed = JSON.parse(String(event.data)) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as AutomationSsePayload) : null;
  } catch {
    return null;
  }
}

function applyAutomationEvent(payload: AutomationSsePayload, reason: string): void {
  const state = readAutomationStorage();
  if (payload.automation) {
    upsertAutomationCache(payload.automation, {
      orgId: payload.orgId,
      recentAutomations: payload.recentAutomations,
    });
    return;
  }
  if (payload.automationId && reason === "sse-delete") {
    const automations = state.automations.filter((row) => row.id !== payload.automationId);
    const recentAutomations =
      payload.recentAutomations ??
      state.recentAutomations.filter((row) => row.id !== payload.automationId);
    saveAutomationStorage(
      { automations, recentAutomations },
      { orgId: payload.orgId, broadcast: false, reason },
    );
    broadcastAutomationsChanged({
      orgId: payload.orgId,
      automationId: payload.automationId,
      automations,
      recentAutomations,
      updatedAt: new Date().toISOString(),
      reason,
    });
    return;
  }
  if (payload.recentAutomations) {
    saveAutomationStorage(
      { recentAutomations: payload.recentAutomations },
      { orgId: payload.orgId, broadcast: false, reason },
    );
    broadcastAutomationsChanged({
      orgId: payload.orgId,
      automations: state.automations,
      recentAutomations: payload.recentAutomations,
      updatedAt: new Date().toISOString(),
      reason,
    });
    return;
  }
  broadcastAutomationsChanged({
    orgId: payload.orgId,
    updatedAt: new Date().toISOString(),
    reason,
  });
}

export function subscribeAutomationEvents(): () => void {
  if (typeof window === "undefined" || typeof EventSource === "undefined") {
    return () => undefined;
  }

  let closed = false;
  let source: EventSource | null = null;

  void (async () => {
    const token = await getOrCreateMemoryToken();
    if (closed || !token) return;

    syncMemoryOSOrgCookie(readClerkOrganizationId() ?? readDevConsoleOrganizationId());
    source = new EventSource(`/api/memory/automations/events?token=${encodeURIComponent(token)}`);

    source.addEventListener("automation-upserted", (event) => {
      const payload = parseAutomationEvent(event);
      if (payload) applyAutomationEvent(payload, "sse-upsert");
    });
    source.addEventListener("automation-deleted", (event) => {
      const payload = parseAutomationEvent(event);
      if (payload) applyAutomationEvent(payload, "sse-delete");
    });
    source.addEventListener("automation-recent-updated", (event) => {
      const payload = parseAutomationEvent(event);
      if (payload) applyAutomationEvent(payload, "sse-recent");
    });
    source.addEventListener("automation-run-created", (event) => {
      const payload = parseAutomationEvent(event);
      if (payload) applyAutomationEvent(payload, "sse-run");
    });
    source.addEventListener("automation-trigger-queued", (event) => {
      const payload = parseAutomationEvent(event);
      if (payload) applyAutomationEvent(payload, "sse-trigger-queued");
    });
    source.addEventListener("automation-trigger-failed", (event) => {
      const payload = parseAutomationEvent(event);
      if (payload) applyAutomationEvent(payload, "sse-trigger-failed");
    });
  })();

  return () => {
    closed = true;
    source?.close();
  };
}
