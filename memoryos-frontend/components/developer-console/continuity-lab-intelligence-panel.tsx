"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ContinuityLabGitHubExecution } from "@/components/developer-console/continuity-lab-github-execution";
import { markFunnelBriefLoaded } from "@/lib/company-brain-funnel";
import { getOrCreateMemoryTokenWithRetry } from "@/lib/memory-token";

type ConnectorRow = {
  type: string;
  status?: string;
  lastSyncAt?: string | null;
};

type ContinueBrief = {
  currentGoal?: string;
  openBlockers?: string[];
  riskyFiles?: string[];
  nextBestAction?: string;
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

export function ContinuityLabIntelligencePanel({
  workspace,
  project,
  threadId,
  hasActiveSession,
  onBriefLoaded,
  onAnalyzeRisk,
  autoloadBrief = false,
  embedGitHubExecution = true,
}: {
  workspace: string;
  project: string;
  threadId: string;
  hasActiveSession: boolean;
  onBriefLoaded?: (brief: ContinueBrief) => void;
  onAnalyzeRisk?: (summary: string) => void;
  autoloadBrief?: boolean;
  /** When false, GitHub UI lives only in the IDE review column. */
  embedGitHubExecution?: boolean;
}) {
  const [memoryCount, setMemoryCount] = useState(0);
  const [connectedCount, setConnectedCount] = useState(0);
  const [brief, setBrief] = useState<ContinueBrief | null>(null);
  const [githubConnected, setGithubConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [briefLoading, setBriefLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadIntel = useCallback(async () => {
    setLoading(true);
    try {
      const [connectorRes, listRes] = await Promise.all([
        authFetch("/api/connector"),
        authFetch("/api/memory/list?limit=50"),
      ]);

      let connectors: ConnectorRow[] = [];
      if (connectorRes.ok) {
        const payload = (await connectorRes.json()) as {
          data?: { connectors?: ConnectorRow[] };
          connectors?: ConnectorRow[];
        };
        connectors = payload.data?.connectors ?? payload.connectors ?? [];
      }

      let count = 0;
      if (listRes.ok) {
        const listPayload = (await listRes.json()) as {
          data?: { memories?: unknown[]; count?: number };
          count?: number;
        };
        const memories = listPayload.data?.memories;
        count =
          typeof listPayload.data?.count === "number"
            ? listPayload.data.count
            : typeof listPayload.count === "number"
              ? listPayload.count
              : Array.isArray(memories)
                ? memories.length
                : 0;
      }

      const connected = connectors.filter((c) => c.status === "connected");
      setConnectedCount(connected.length);
      setGithubConnected(connected.some((c) => c.type === "github"));
      setMemoryCount(count);
    } catch {
      // best-effort
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadIntel();
    const timer = window.setInterval(() => void loadIntel(), 30_000);
    return () => window.clearInterval(timer);
  }, [loadIntel]);

  async function loadContinueBrief() {
    if (!hasActiveSession) return;
    setBriefLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/memory/resume/brief", {
        method: "POST",
        body: JSON.stringify({
          project,
          question: "Continue this project from organizational memory.",
          topK: 8,
          workspace,
          threadId,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? `Brief failed (${res.status})`);
      }
      const payload = (await res.json()) as { ok?: boolean; data?: ContinueBrief };
      const next = payload.data ?? null;
      if (!next) throw new Error("Empty brief.");
      setBrief(next);
      markFunnelBriefLoaded();
      onBriefLoaded?.(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load brief.");
    } finally {
      setBriefLoading(false);
    }
  }

  const autoloadBriefRef = useRef(false);
  useEffect(() => {
    if (!autoloadBrief || !hasActiveSession || autoloadBriefRef.current) return;
    autoloadBriefRef.current = true;
    void loadContinueBrief();
  }, [autoloadBrief, hasActiveSession, threadId]);

  async function analyzeRiskyFiles() {
    if (!hasActiveSession) return;
    setBriefLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/memory/retrieve", {
        method: "POST",
        body: JSON.stringify({
          question: "Risky or fragile areas in this project?",
          topK: 8,
          workspace,
          project,
          threadId,
        }),
      });
      if (!res.ok) throw new Error(`Retrieve failed (${res.status})`);
      const payload = (await res.json()) as {
        data?: { memories?: Array<{ memory?: string }> };
        memories?: Array<{ memory?: string }>;
      };
      const memories = payload.data?.memories ?? payload.memories ?? [];
      const summary = memories
        .map((m) => m.memory)
        .filter(Boolean)
        .slice(0, 5)
        .join("\n\n");
      onAnalyzeRisk?.(summary || "No risk signals in memory yet.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Risk scan failed.");
    } finally {
      setBriefLoading(false);
    }
  }

  return (
    <div className="space-y-4 text-sm text-[#ececec]">
      <div>
        <h3 className="text-sm font-medium">Workspace memory</h3>
        <p className="mt-1 text-xs text-[#8e8e8e]">
          {loading
            ? "Loading…"
            : `${connectedCount} sources · ${memoryCount} memories`}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <ToolButton
          disabled={!hasActiveSession || briefLoading}
          onClick={() => void loadContinueBrief()}
        >
          {briefLoading ? "Loading…" : "Continue brief"}
        </ToolButton>
        <ToolButton
          disabled={!hasActiveSession || briefLoading}
          onClick={() => void analyzeRiskyFiles()}
        >
          Risk scan
        </ToolButton>
        <ToolButton onClick={() => void loadIntel()}>Refresh</ToolButton>
      </div>

      {brief ? (
        <div className="rounded-xl bg-white/5 px-3 py-3 text-xs leading-5 text-[#d4d4d4]">
          {brief.currentGoal ? <p>{brief.currentGoal}</p> : null}
          {brief.nextBestAction ? (
            <p className="mt-2 text-[#8e8e8e]">Next: {brief.nextBestAction}</p>
          ) : null}
        </div>
      ) : null}

      {embedGitHubExecution ? (
        <ContinuityLabGitHubExecution
          githubConnected={githubConnected}
          suggestedBody={
            brief
              ? [
                  brief.currentGoal ? `Goal: ${brief.currentGoal}` : "",
                  brief.nextBestAction ? `Next: ${brief.nextBestAction}` : "",
                ]
                  .filter(Boolean)
                  .join("\n")
              : undefined
          }
        />
      ) : null}

      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

function ToolButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#ececec] transition hover:bg-white/10 disabled:opacity-40"
    >
      {children}
    </button>
  );
}
