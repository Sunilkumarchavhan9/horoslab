import { getMemoryOSOrgHeaders } from "@/lib/org-scope-client";

type ApiEnvelope<T> =
  | { ok: true; data: T; meta?: unknown }
  | { ok: false; error?: { code?: string; message?: string }; meta?: unknown };

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | T | null;

  if (!response.ok) {
    const message = payload && typeof payload === "object" && "error" in payload ? payload.error?.message : null;
    throw new Error(message || `Continuity feedback request failed (${response.status}).`);
  }

  if (payload && typeof payload === "object" && "ok" in payload) {
    if (payload.ok) return payload.data;
    throw new Error(payload.error?.message || "Continuity feedback request failed.");
  }

  return payload as T;
}

async function feedbackFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      accept: "application/json",
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...getMemoryOSOrgHeaders(),
      ...(init?.headers ?? {}),
    },
  });

  return readJson<T>(response);
}

export type ContinuityFeedbackInput = {
  kind: "resume" | "handoff" | "before_model" | "after_model";
  rating: number;
  useful?: boolean;
  requestId?: string;
  project?: string;
  agentId?: string;
  missingContext?: string[];
  wrongContext?: string[];
  shouldRemember?: string[];
  note?: string;
};

export type ContinuityFeedbackRecord = ContinuityFeedbackInput & {
  id: string;
  userId: string;
  orgId: string | null;
  createdAt: string;
};

export async function createContinuityFeedback(input: ContinuityFeedbackInput): Promise<{ feedback: ContinuityFeedbackRecord }> {
  return feedbackFetch<{ feedback: ContinuityFeedbackRecord }>("/api/memory/continuity-feedback", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
