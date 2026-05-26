"use client";

import { useCallback, useEffect, useState } from "react";
import { getOrCreateMemoryTokenWithRetry } from "@/lib/memory-token";

export type ConnectorStatus = {
  type: string;
  label: string;
  status: "connected" | "disconnected" | "error";
  lastSyncAt: string | null;
};

export type ContinueBrief = {
  currentGoal?: string;
  openBlockers?: string[];
  riskyFiles?: string[];
  nextBestAction?: string;
};

const CONNECTOR_LABELS: Record<string, string> = {
  github: "GitHub",
  slack: "Slack",
  jira: "Jira",
  notion: "Notion",
  gmail: "Gmail",
  zendesk: "Zendesk",
  google_drive: "Google Drive",
  onedrive: "OneDrive",
  local_files: "Local files",
};

async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getOrCreateMemoryTokenWithRetry({ attempts: 2, delayMs: 200 });
  if (!token) throw new Error("Missing auth token");
  return fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

export function useContinuityLabIntel(workspace: string, project: string, threadId: string) {
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([]);
  const [memoryCount, setMemoryCount] = useState(0);
  const [brief, setBrief] = useState<ContinueBrief | null>(null);
  const [loading, setLoading] = useState(true);

  const loadConnectors = useCallback(async () => {
    try {
      const res = await authFetch("/api/connector");
      if (!res.ok) return;
      const payload = (await res.json()) as {
        data?: { connectors?: Array<{ type: string; status?: string; lastSyncAt?: string | null }> };
        connectors?: Array<{ type: string; status?: string; lastSyncAt?: string | null }>;
      };
      const rows = payload.data?.connectors ?? payload.connectors ?? [];
      setConnectors(
        rows.map((c) => ({
          type: c.type,
          label: CONNECTOR_LABELS[c.type] ?? c.type,
          status:
            c.status === "connected" ? "connected" : c.status === "error" ? "error" : "disconnected",
          lastSyncAt: c.lastSyncAt ?? null,
        })),
      );
    } catch {
      // best-effort
    }
  }, []);

  const loadMemoryCount = useCallback(async () => {
    try {
      const res = await authFetch("/api/memory/list?limit=1");
      if (!res.ok) return;
      const payload = (await res.json()) as { data?: { count?: number }; count?: number };
      setMemoryCount(payload.data?.count ?? payload.count ?? 0);
    } catch {
      // best-effort
    }
  }, []);

  const loadBrief = useCallback(async () => {
    try {
      const res = await authFetch("/api/memory/resume/brief", {
        method: "POST",
        body: JSON.stringify({
          project,
          question: "Continue project — blockers, risky files, next action.",
          topK: 8,
          workspace,
          threadId,
        }),
      });
      if (!res.ok) return;
      const payload = (await res.json()) as { data?: ContinueBrief };
      setBrief(payload.data ?? null);
    } catch {
      // best-effort
    }
  }, [project, workspace, threadId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadConnectors(), loadMemoryCount()]);
    setLoading(false);
  }, [loadConnectors, loadMemoryCount]);

  useEffect(() => {
    void refresh();
    const t = window.setInterval(() => void refresh(), 25_000);
    return () => window.clearInterval(t);
  }, [refresh]);

  return {
    connectors,
    memoryCount,
    brief,
    setBrief,
    loadBrief,
    loading,
    refresh,
    githubConnected: connectors.some((c) => c.type === "github" && c.status === "connected"),
  };
}
