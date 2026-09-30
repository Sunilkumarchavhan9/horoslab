import type { DhyraTMShellSyncSnapshot } from "@/lib/continuity-lab/dhyratm-shell-sync";

async function unwrap<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | { data?: T; error?: { message?: string } | string }
    | T
    | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? typeof payload.error === "string"
          ? payload.error
          : payload.error?.message ?? "Shell sync request failed."
        : "Shell sync request failed.";
    throw new Error(message);
  }

  if (payload && typeof payload === "object" && "data" in payload && payload.data) {
    return payload.data;
  }

  return payload as T;
}

export async function fetchDhyraTMShellSync(
  threadId: string,
): Promise<DhyraTMShellSyncSnapshot> {
  const response = await fetch(
    `/api/runtime/threads/${encodeURIComponent(threadId)}/shell/sync`,
    {
      cache: "no-store",
    },
  );

  const payload = await unwrap<{ shell: DhyraTMShellSyncSnapshot | null }>(response);
  if (!payload.shell) {
    throw new Error("Shell sync payload was empty.");
  }
  return payload.shell;
}
