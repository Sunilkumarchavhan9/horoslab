import { broadcastLabSchedulesChanged } from "@/lib/continuity-lab/lab-schedules-events";
import type { LabSchedule } from "@/lib/continuity-lab/lab-schedules-types";

const STORAGE_KEY = "memoryos-lab-schedules-cache";

type CachePayload = {
  orgId: string;
  schedules: LabSchedule[];
  updatedAt?: string;
};

export function readLabSchedulesCache(): CachePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachePayload;
    if (!parsed?.orgId || !Array.isArray(parsed.schedules)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLabSchedulesCache(
  payload: CachePayload,
  options?: { broadcast?: boolean },
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  if (options?.broadcast !== false) {
    broadcastLabSchedulesChanged({
      orgId: payload.orgId,
      schedules: payload.schedules,
      updatedAt: payload.updatedAt,
    });
  }
}
