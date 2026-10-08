import { getMemoryOSOrgHeaders } from "@/lib/org-scope-client";

export type ConnectorListRow = {
  type: string;
  status: string;
  recordCount?: number;
  sourceItemCount?: number;
  lastFailureReason?: string | null;
};

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: unknown };
  return (record.data ?? payload) as T;
}

export function unwrapConnectors(payload: unknown): ConnectorListRow[] {
  const data = unwrapData<{ connectors?: ConnectorListRow[] }>(payload);
  return Array.isArray(data?.connectors) ? data.connectors : [];
}

export function isConnectorConnected(status: string | undefined): boolean {
  return status === "connected" || status === "syncing";
}

export async function fetchConnectorList(): Promise<ConnectorListRow[]> {
  try {
    // The connector proxy resolves the authenticated Clerk user server-side.
    // Do not send the legacy MemoryOS token here: in local development it can
    // belong to user-demo and overwrite the real user's HOROS status.
    const res = await fetch("/api/connector", {
      headers: {
        accept: "application/json",
        ...getMemoryOSOrgHeaders(),
      },
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) return [];
    return unwrapConnectors(await res.json().catch(() => null));
  } catch {
    return [];
  }
}

export function connectorStatus(
  list: ConnectorListRow[],
  type: string,
): string | undefined {
  return list.find((c) => c.type === type)?.status;
}
