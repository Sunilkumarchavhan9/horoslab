import { consoleApiFetch } from "@/lib/console-api";
import { broadcastLabReviewSettingsChanged } from "@/lib/continuity-lab/lab-review-settings-events";
import {
  readLabReviewSettings,
  saveLabReviewSettings,
  type LabReviewEnrolledRepo,
  type LabReviewEnrolledUser,
  type LabReviewSettings,
} from "@/lib/continuity-lab/lab-review-settings-storage";

export type LabReviewSettingsResponse = {
  orgId: string;
  settings: LabReviewSettings;
  updatedAt?: string;
};

export type ReviewEnrolledReposResponse = {
  orgId: string;
  enrolledRepos: LabReviewEnrolledRepo[];
  enrolledUsers: LabReviewEnrolledUser[];
  settings: LabReviewSettings;
  currentUserId: string;
  currentUserEnrolled: boolean;
  updatedAt?: string;
  automationStatus: "enrollment_only";
  automationNote: string;
};

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: unknown; ok?: boolean };
  if (record.ok === false) return null;
  return (record.data ?? payload) as T;
}

function toSettings(record: LabReviewSettings & { updatedAt?: string }): LabReviewSettings {
  const { updatedAt: _updatedAt, ...settings } = record;
  return settings;
}

function applyRemoteSettings(response: LabReviewSettingsResponse): LabReviewSettingsResponse {
  saveLabReviewSettings(response.settings, { broadcast: false });
  broadcastLabReviewSettingsChanged({
    settings: response.settings,
    orgId: response.orgId,
    updatedAt: response.updatedAt,
  });
  return response;
}

export async function fetchLabReviewSettingsFromApi(): Promise<LabReviewSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-review-settings");
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabReviewSettings;
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toSettings(data.settings as LabReviewSettings & { updatedAt?: string });
    return applyRemoteSettings({
      orgId: data.orgId,
      settings,
      updatedAt: data.updatedAt,
    });
  } catch {
    return null;
  }
}

export async function patchLabReviewSettingsToApi(
  partial: Partial<LabReviewSettings>,
): Promise<LabReviewSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-review-settings", {
      method: "PATCH",
      body: JSON.stringify(partial),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabReviewSettings;
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toSettings(data.settings as LabReviewSettings & { updatedAt?: string });
    return applyRemoteSettings({
      orgId: data.orgId,
      settings,
      updatedAt: data.updatedAt,
    });
  } catch {
    return null;
  }
}

export async function fetchReviewEnrolledReposFromApi(): Promise<ReviewEnrolledReposResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/review/enrolled-repos");
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<ReviewEnrolledReposResponse>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toSettings(data.settings as LabReviewSettings & { updatedAt?: string });
    saveLabReviewSettings(settings, { broadcast: false });
    broadcastLabReviewSettingsChanged({
      settings,
      orgId: data.orgId,
      updatedAt: data.updatedAt,
    });
    return { ...data, settings };
  } catch {
    return null;
  }
}

export async function loadLabReviewSettingsHybrid(): Promise<LabReviewSettingsResponse | null> {
  const remote = await fetchLabReviewSettingsFromApi();
  if (remote) return remote;
  return null;
}

export function loadLabReviewSettingsLocalFallback(orgId: string | null): {
  orgId: string;
  settings: LabReviewSettings;
} {
  return {
    orgId: orgId ?? "",
    settings: readLabReviewSettings(),
  };
}
