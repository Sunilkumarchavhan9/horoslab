import { consoleApiFetch } from "@/lib/console-api";
import { broadcastLabSchedulesChanged } from "@/lib/continuity-lab/lab-schedules-events";
import { readLabSchedulesCache, saveLabSchedulesCache } from "@/lib/continuity-lab/lab-schedules-storage";
import type {
  LabSchedule,
  LabScheduleDraft,
  LabSchedulesListScope,
} from "@/lib/continuity-lab/lab-schedules-types";

export type LabSchedulesListResponse = {
  orgId: string;
  schedules: LabSchedule[];
  currentUserId?: string;
  executionStatus: "persist_only";
  executionNote: string;
};

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: unknown; ok?: boolean };
  if (record.ok === false) return null;
  return (record.data ?? payload) as T;
}

function applyListCache(response: LabSchedulesListResponse): LabSchedulesListResponse {
  saveLabSchedulesCache(
    {
      orgId: response.orgId,
      schedules: response.schedules,
    },
    { broadcast: false },
  );
  broadcastLabSchedulesChanged({
    orgId: response.orgId,
    schedules: response.schedules,
  });
  return response;
}

export async function fetchLabSchedulesFromApi(
  scope: LabSchedulesListScope = "mine",
): Promise<LabSchedulesListResponse | null> {
  try {
    const query = scope === "mine" ? "?scope=mine" : "?scope=all";
    const res = await consoleApiFetch(`/api/memory/lab-schedules${query}`);
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<LabSchedulesListResponse>(payload);
    if (!data?.orgId || !Array.isArray(data.schedules)) return null;
    return applyListCache(data);
  } catch {
    return null;
  }
}

export async function createLabScheduleOnApi(
  draft: LabScheduleDraft,
): Promise<LabSchedule | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-schedules", {
      method: "POST",
      body: JSON.stringify(draft),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{ schedule?: LabSchedule; orgId?: string }>(payload);
    if (!data?.schedule) return null;
    const cached = readLabSchedulesCache();
    if (cached && data.orgId === cached.orgId) {
      saveLabSchedulesCache(
        {
          orgId: cached.orgId,
          schedules: [data.schedule, ...cached.schedules.filter((s) => s.id !== data.schedule!.id)],
        },
        { broadcast: false },
      );
    }
    if (data.orgId) broadcastLabSchedulesChanged({ orgId: data.orgId });
    return data.schedule;
  } catch {
    return null;
  }
}

export async function patchLabScheduleOnApi(
  scheduleId: string,
  partial: Partial<LabScheduleDraft>,
): Promise<LabSchedule | null> {
  try {
    const res = await consoleApiFetch(`/api/memory/lab-schedules/${encodeURIComponent(scheduleId)}`, {
      method: "PATCH",
      body: JSON.stringify(partial),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{ schedule?: LabSchedule; orgId?: string }>(payload);
    if (!data?.schedule) return null;
    const cached = readLabSchedulesCache();
    if (cached && data.orgId === cached.orgId) {
      saveLabSchedulesCache(
        {
          orgId: cached.orgId,
          schedules: cached.schedules.map((row) =>
            row.id === data.schedule!.id ? data.schedule! : row,
          ),
        },
        { broadcast: false },
      );
    }
    const orgId = data.orgId ?? cached?.orgId;
    if (orgId) broadcastLabSchedulesChanged({ orgId });
    return data.schedule;
  } catch {
    return null;
  }
}

export async function deleteLabScheduleOnApi(scheduleId: string): Promise<boolean> {
  try {
    const res = await consoleApiFetch(
      `/api/memory/lab-schedules/${encodeURIComponent(scheduleId)}`,
      { method: "DELETE" },
    );
    if (!res.ok) return false;
    const payload = await res.json().catch(() => null);
    const data = unwrapData<{ orgId?: string }>(payload);
    const cached = readLabSchedulesCache();
    const orgId = data?.orgId ?? cached?.orgId;
    if (cached && orgId) {
      saveLabSchedulesCache(
        {
          orgId,
          schedules: cached.schedules.filter((row) => row.id !== scheduleId),
        },
        { broadcast: false },
      );
    }
    if (orgId) broadcastLabSchedulesChanged({ orgId });
    return true;
  } catch {
    return false;
  }
}

export type LabScheduleResponse = {
  orgId: string;
  schedule: LabSchedule;
  executionStatus: "persist_only";
  executionNote: string;
};

export async function fetchLabScheduleFromApi(
  scheduleId: string,
): Promise<LabScheduleResponse | null> {
  try {
    const res = await consoleApiFetch(
      `/api/memory/lab-schedules/${encodeURIComponent(scheduleId)}`,
    );
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<LabScheduleResponse>(payload);
    if (!data?.orgId || !data.schedule) return null;
    return data;
  } catch {
    return null;
  }
}

export async function loadLabSchedulesHybrid(
  scope: LabSchedulesListScope = "mine",
): Promise<LabSchedulesListResponse | null> {
  return fetchLabSchedulesFromApi(scope);
}

export function loadLabSchedulesLocalFallback(orgId: string): LabSchedulesListResponse {
  const cached = readLabSchedulesCache();
  if (cached && cached.orgId === orgId) {
    return {
      orgId,
      schedules: cached.schedules,
      executionStatus: "persist_only",
      executionNote: "",
    };
  }
  return {
    orgId,
    schedules: [],
    executionStatus: "persist_only",
    executionNote: "",
  };
}
