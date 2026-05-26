"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { markFunnelBriefLoaded } from "@/lib/company-brain-funnel";
import { getOrCreateMemoryTokenWithRetry } from "@/lib/memory-token";

export type ContinueBrief = {
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

export function ContinuityLabProjectPlan({
  workspace,
  project,
  threadId,
  hasActiveSession,
  autoloadBrief = false,
  onBriefLoaded,
  onExplainPlan,
  connectedTools,
}: {
  workspace: string;
  project: string;
  threadId: string;
  hasActiveSession: boolean;
  autoloadBrief?: boolean;
  onBriefLoaded?: (brief: ContinueBrief) => void;
  onExplainPlan?: () => void;
  connectedTools?: string[];
}) {
  const [brief, setBrief] = useState<ContinueBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContinueBrief = useCallback(async () => {
    if (!hasActiveSession) return;
    setLoading(true);
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
      setError(e instanceof Error ? e.message : "Could not load plan.");
    } finally {
      setLoading(false);
    }
  }, [hasActiveSession, project, workspace, threadId, onBriefLoaded]);

  const autoloadRef = useRef(false);
  useEffect(() => {
    if (!autoloadBrief || !hasActiveSession || autoloadRef.current) return;
    autoloadRef.current = true;
    void loadContinueBrief();
  }, [autoloadBrief, hasActiveSession, loadContinueBrief]);

  useEffect(() => {
    if (!hasActiveSession) {
      setBrief(null);
      autoloadRef.current = false;
    }
  }, [hasActiveSession]);

  return (
    <div className="shrink-0 border-b border-white/[0.08] bg-[#1a1a1a] p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#8e8e8e]">
            Project plan
          </p>
          <p className="mt-0.5 text-xs text-[#6b6b6b]">From Company Brain memory</p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            disabled={!hasActiveSession || loading}
            onClick={() => void loadContinueBrief()}
            className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-[#ececec] hover:bg-white/5 disabled:opacity-40"
          >
            {loading ? "…" : "Refresh"}
          </button>
          <button
            type="button"
            disabled={!hasActiveSession || loading}
            onClick={onExplainPlan}
            className="rounded-md bg-[#ececec] px-2 py-1 text-[10px] font-medium text-[#1a1a1a] disabled:opacity-40"
          >
            Explain plan
          </button>
        </div>
      </div>

      {!hasActiveSession ? (
        <p className="mt-2 text-xs text-[#8e8e8e]">
          Send a message to start a session — the plan loads from Slack, Jira, GitHub, and memory.
        </p>
      ) : brief ? (
        <div className="mt-2 space-y-2 text-xs leading-relaxed text-[#d4d4d4]">
          {brief.currentGoal ? (
            <p>
              <span className="text-[#8e8e8e]">Goal · </span>
              {brief.currentGoal}
            </p>
          ) : null}
          {brief.openBlockers && brief.openBlockers.length > 0 ? (
            <p>
              <span className="text-[#8e8e8e]">Blockers · </span>
              {brief.openBlockers.join(" · ")}
            </p>
          ) : null}
          {brief.riskyFiles && brief.riskyFiles.length > 0 ? (
            <p>
              <span className="text-[#8e8e8e]">Risky · </span>
              {brief.riskyFiles.slice(0, 5).join(", ")}
            </p>
          ) : null}
          {brief.nextBestAction ? (
            <p className="rounded-md bg-white/5 px-2 py-1.5 text-[#ececec]">
              <span className="text-[#8e8e8e]">Next · </span>
              {brief.nextBestAction}
            </p>
          ) : null}
        </div>
      ) : loading ? (
        <p className="mt-2 text-xs text-[#8e8e8e]">Loading plan from memory…</p>
      ) : (
        <p className="mt-2 text-xs text-[#8e8e8e]">
          Click Refresh to load the continue brief, or Explain plan to hear it from the agent.
        </p>
      )}

      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}

      {connectedTools && connectedTools.length > 0 ? (
        <p className="mt-2 text-[10px] text-[#6b6b6b]">
          Sources: {connectedTools.join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
