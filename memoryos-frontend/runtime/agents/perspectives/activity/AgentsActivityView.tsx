"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Target, Database, FileText, Scale, ShieldCheck, XOctagon, RefreshCw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgentStore } from "../../store";
import { getAgentRunsSummary, listAgentRuns } from "@/lib/agent-runs-api";
import type { MasterplanAgentRunDetail } from "@/lib/masterplan-api";
import { readActiveEpochWorkspaceId } from "@/lib/epoch-api";

type ActivityEntry = {
  id: string;
  time: string;
  type: string;
  icon: typeof Activity;
  desc: string;
  color: string;
};

function iconForType(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes("mission")) return Target;
  if (normalized.includes("repository") || normalized.includes("read")) return Database;
  if (normalized.includes("evidence")) return FileText;
  if (normalized.includes("policy")) return Scale;
  if (normalized.includes("verify")) return ShieldCheck;
  if (normalized.includes("failed") || normalized.includes("error")) return XOctagon;
  return Activity;
}

function colorForType(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes("mission")) return "text-foreground dark:text-[#eee]";
  if (normalized.includes("repository")) return "text-blue-500";
  if (normalized.includes("evidence")) return "text-purple-500";
  if (normalized.includes("policy")) return "text-amber-500";
  if (normalized.includes("verify")) return "text-emerald-500";
  if (normalized.includes("failed") || normalized.includes("error")) return "text-rose-500";
  return "text-muted-foreground";
}

function formatTime(value?: string): string {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function flattenEvents(runs: MasterplanAgentRunDetail[]): ActivityEntry[] {
  const entries: ActivityEntry[] = [];

  for (const run of runs) {
    const runEvents = Array.isArray(run.events) ? run.events : [];
    if (runEvents.length === 0) {
      entries.push({
        id: `${run.id}-status`,
        time: formatTime(run.startedAt),
        type: `Agent Run ${run.status}`,
        icon: iconForType(run.status),
        desc: `${run.targetAgent} · ${run.status}`,
        color: colorForType(run.status),
      });
      continue;
    }

    for (const event of runEvents) {
      entries.push({
        id: event.id,
        time: formatTime(event.timestamp),
        type: event.type,
        icon: iconForType(event.type),
        desc: `${run.targetAgent} · ${event.payload?.summary ? String(event.payload.summary) : run.status}`,
        color: colorForType(event.type),
      });
    }
  }

  return entries.sort((a, b) => a.time.localeCompare(b.time)).slice(-50).reverse();
}

export function AgentsActivityView() {
  const { selectEntity } = useAgentStore();
  const [runs, setRuns] = useState<MasterplanAgentRunDetail[]>([]);
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getAgentRunsSummary>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = readActiveEpochWorkspaceId() ?? undefined;

  const loadActivity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryPayload, runRows] = await Promise.all([
        getAgentRunsSummary(workspaceId),
        listAgentRuns({ workspaceId }),
      ]);
      setSummary(summaryPayload);
      setRuns(runRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load agent activity.");
      setSummary(null);
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadActivity();
  }, [loadActivity]);

  const entries = useMemo(() => flattenEvents(runs), [runs]);

  const metrics = summary?.totals ?? {
    totalRuns: runs.length,
    running: runs.filter((run) => run.status === "running").length,
    completed: runs.filter((run) => run.status === "completed").length,
    failed: runs.filter((run) => run.status === "failed").length,
    cancelled: runs.filter((run) => run.status === "cancelled").length,
    needsOutcome: 0,
    outcomeCoverage: 0,
    avgDurationMs: 0,
  };

  return (
    <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-card dark:bg-[#111] text-foreground dark:text-[#eee]">
      <div className="flex items-center justify-between gap-4 px-8 py-6 border-b border-border dark:border-[#333]">
        <div className="flex items-center gap-3">
          <div className="size-8 bg-[#111] dark:bg-white text-white dark:text-foreground flex items-center justify-center shrink-0">
            <Activity className="size-4" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold leading-none">Agent Activity</h1>
            <p className="text-[12px] text-muted-foreground dark:text-muted-foreground mt-1">
              Live agent-run events from the backend.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadActivity()}
          className="inline-flex items-center gap-2 px-3 py-2 bg-[#111] dark:bg-white text-white dark:text-foreground rounded-md text-[12px] font-bold hover:bg-[#333] dark:hover:bg-[#ccc] transition-colors"
        >
          <RefreshCw className="size-3.5" />
          Refresh
        </button>
      </div>

      <div className="flex items-center justify-between gap-4 px-8 py-4 border-b border-border dark:border-[#333] bg-muted/50 dark:bg-[#1a1a1a] text-[12px]">
        <span className="font-mono text-muted-foreground dark:text-muted-foreground">{metrics.totalRuns} runs</span>
        <span className="font-mono text-muted-foreground dark:text-muted-foreground">{metrics.running} running</span>
        <span className="font-mono text-muted-foreground dark:text-muted-foreground">{metrics.completed} completed</span>
        <span className="font-mono text-muted-foreground dark:text-muted-foreground">{metrics.failed} failed</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Backend wired</span>
      </div>

      <div className="flex flex-col w-full h-full overflow-y-auto">
        {loading ? (
          <div className="p-8 text-[13px] text-muted-foreground dark:text-muted-foreground">Loading live agent activity...</div>
        ) : error ? (
          <div className="p-8 text-[13px] text-red-500 flex items-center gap-2">
            <AlertTriangle className="size-4" />
            {error}
          </div>
        ) : (
          <div className="flex flex-col w-full">
            <div className="flex items-center justify-between px-8 py-4 bg-muted/50 dark:bg-[#1a1a1a] border-b border-border dark:border-[#333]">
              <h2 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">
                Recent Activity Stream
              </h2>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-500/20">
                Live Updates
              </span>
            </div>

            <div className="flex flex-col w-full">
              {entries.length === 0 ? (
                <div className="p-8 text-[13px] text-muted-foreground dark:text-muted-foreground">No agent activity has been recorded yet.</div>
              ) : (
                entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-stretch group hover:bg-muted/50 dark:hover:bg-[#1a1a1a] transition-colors border-b border-border dark:border-[#333] w-full cursor-pointer"
                    onClick={() => selectEntity(entry.id)}
                  >
                    <div className="flex flex-col items-center w-[80px] shrink-0 border-r border-border dark:border-[#333] py-6 relative">
                      <div className="absolute top-0 bottom-0 w-px bg-[#eee] dark:bg-[#333] z-0" />
                      <div className="size-8 rounded-full bg-card dark:bg-[#111] border-2 border-[#111] dark:border-border flex items-center justify-center shrink-0 z-10 relative group-hover:border-blue-500 transition-colors">
                        <entry.icon className={cn("size-4", entry.color)} />
                      </div>
                    </div>

                    <div className="flex flex-col justify-center flex-1 px-8 py-6">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[15px] font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{entry.type}</span>
                        <span className="text-[12px] font-mono text-muted-foreground dark:text-muted-foreground bg-[#eee] dark:bg-[#222] px-3 py-1 rounded">
                          {entry.time}
                        </span>
                      </div>
                      <span className="text-[13px] text-muted-foreground dark:text-muted-foreground font-mono">{entry.desc}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
