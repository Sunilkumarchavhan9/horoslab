import { getMemoryOSOrgHeaders } from "@/lib/org-scope-client";

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: unknown };
  return (record.data ?? payload) as T;
}

export async function authorizeConnector(type: string): Promise<void> {
  // Open from the user click before awaiting the API so popup blockers do not
  // prevent provider OAuth, while keeping Mission Control open in this tab.
  const authWindow = typeof window !== "undefined" ? window.open("about:blank", "_blank") : null;
  if (!authWindow) {
    throw new Error("Allow pop-ups for Mission Control to connect this provider.");
  }

  try {
    const returnTo = typeof window !== "undefined" ? window.location.pathname : "/mission-control";
    const response = await fetch(`/api/connector/${type}/authorize?returnTo=${encodeURIComponent(returnTo)}`, {
      headers: {
        accept: "application/json",
        ...getMemoryOSOrgHeaders(),
        "X-MemoryOS-Frontend-Origin":
          typeof window !== "undefined" ? window.location.origin : "",
      },
      credentials: "same-origin",
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | { data?: { authorizeUrl?: string }; error?: string | { message?: string }; message?: string }
      | null;

    if (!response.ok) {
      const err =
        typeof payload?.error === "string"
          ? payload.error
          : payload?.error && typeof payload.error === "object"
            ? payload.error.message
            : payload?.message;
      throw new Error(err ?? `Could not start ${type} authorization (${response.status})`);
    }

    const authorizeUrl = unwrapData<{ authorizeUrl?: string }>(payload)?.authorizeUrl;
    if (!authorizeUrl) {
      throw new Error("Missing authorize URL from connector endpoint.");
    }

    authWindow.location.href = authorizeUrl;
  } catch (error) {
    authWindow.close();
    throw error;
  }
}

export async function disconnectConnector(type: string): Promise<void> {
  const response = await fetch(`/api/connector/${type}/disconnect`, {
    method: "POST",
    // Let the server-side connector proxy derive the Clerk identity. The
    // legacy console token can identify a different user than the visible
    // Mission Control workspace and disconnect the wrong connector row.
    headers: {
      accept: "application/json",
      ...getMemoryOSOrgHeaders(),
    },
    credentials: "same-origin",
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | { data?: { message?: string }; error?: string | { message?: string }; message?: string }
    | null;

  if (!response.ok) {
    const err =
      typeof payload?.error === "string"
        ? payload.error
        : payload?.error && typeof payload.error === "object"
          ? payload.error.message
          : payload?.message;
    throw new Error(err ?? `Could not disconnect ${type} (${response.status})`);
  }
}

export async function syncConnector(type: string): Promise<void> {
  const response = await fetch(`/api/connector/${type}/sync`, {
    method: "POST",
    headers: {
      accept: "application/json",
      ...getMemoryOSOrgHeaders(),
    },
    credentials: "same-origin",
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | { error?: string | { message?: string }; message?: string }
    | null;
  if (!response.ok && response.status !== 202) {
    const error =
      typeof payload?.error === "string"
        ? payload.error
        : payload?.error && typeof payload.error === "object"
          ? payload.error.message
          : payload?.message;
    throw new Error(error ?? `Could not sync ${type} (${response.status})`);
  }
}
