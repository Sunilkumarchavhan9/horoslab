"use client";

import { useEffect, useMemo, useState } from "react";
import { PlayCircle, Target, ShieldCheck, Box, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgentStore } from "../../store";
import { listProductAgentSessions, type ProductAgentSession } from "@/lib/product-agent-api";

function formatDuration(startedAt?: string | null): string {
  if (!startedAt) return "Unknown";
  const diff = Date.now() - new Date(startedAt).getTime();
  if (!Number.isFinite(diff) || diff < 0) return "Unknown";
  const totalSeconds = Math.max(0, Math.round(diff / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds.toString().padStart(2, "0")}s` : `${seconds}s`;
}

export function AgentsRunningView() {
  const { selectEntity, selectedEntity } = useAgentStore();
  const [sessions, setSessions] = useState<ProductAgentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      setSessions(await listProductAgentSessions({ limit: 25 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load live agent sessions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, []);

  const activeSessions = useMemo(
    () => sessions.filter((session) => session.status === "active"),
    [sessions],
  );

  return (
    <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-card dark:bg-[#111] text-foreground dark:text-[#eee]">
      <div className="flex items-center justify-between gap-4 px-8 py-6 border-b border-border dark:border-[#333]">
        <div className="flex items-center gap-3">
          <div className="size-8 bg-[#111] dark:bg-white text-white dark:text-foreground flex items-center justify-center shrink-0">
            <PlayCircle className="size-4" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold leading-none">Running Agents</h1>
            <p className="text-[12px] text-muted-foreground dark:text-muted-foreground mt-1">
              Live product-agent sessions currently executing in the backend.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadSessions()}
          className="inline-flex items-center gap-2 px-3 py-2 bg-[#111] dark:bg-white text-white dark:text-foreground rounded-md text-[12px] font-bold hover:bg-[#333] dark:hover:bg-[#ccc] transition-colors"
        >
          <RefreshCw className="size-3.5" />
          Refresh
        </button>
      </div>

      <div className="flex flex-col w-full overflow-y-auto divide-y divide-[#eee] dark:divide-[#333]">
        {loading ? (
          <div className="p-8 text-[13px] text-muted-foreground dark:text-muted-foreground">Loading live sessions...</div>
        ) : error ? (
          <div className="p-8 text-[13px] text-red-500">{error}</div>
        ) : activeSessions.length === 0 ? (
          <div className="p-8 text-[13px] text-muted-foreground dark:text-muted-foreground">No active agent sessions are running yet.</div>
        ) : (
          activeSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => selectEntity(session.agentId)}
              className={cn(
                "flex flex-col p-8 transition-all cursor-pointer group w-full",
                selectedEntity === session.agentId ? "bg-muted/50 dark:bg-[#1a1a1a]" : "bg-card dark:bg-[#111] hover:bg-muted/50 dark:hover:bg-[#1a1a1a]",
              )}
            >
              <div className="flex items-center justify-between border-b border-border dark:border-[#333] pb-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="size-10 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
                    <Loader2 className="size-4 text-emerald-500 animate-spin" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[18px] font-bold">{session.agentId}</span>
                    <span className="text-[11px] font-mono text-muted-foreground dark:text-muted-foreground uppercase bg-[#eee] dark:bg-[#222] px-2 py-0.5 w-fit">
                      {session.id}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">Time Active</span>
                  <span className="text-[16px] font-mono font-bold">{formatDuration(session.createdAt)}</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-8">
                <div className="flex flex-col gap-2 col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground flex items-center gap-1.5">
                    <Target className="size-3" /> Goal
                  </span>
                  <span className="text-[15px] font-bold">{session.goal ?? "No goal recorded"}</span>
                  <span className="text-[13px] text-muted-foreground dark:text-muted-foreground">
                    Project: {session.projectId ?? "none"}
                  </span>
                </div>

                <div className="flex flex-col gap-2 border-l border-border dark:border-[#333] pl-8">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="size-3" /> Status
                  </span>
                  <span className="text-[13px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-3 py-1.5 w-fit">
                    {session.status}
                  </span>
                </div>

                <div className="flex flex-col gap-2 border-l border-border dark:border-[#333] pl-8">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground flex items-center gap-1.5">
                    <Box className="size-3" /> Updated
                  </span>
                  <span className="text-[13px] text-muted-foreground dark:text-muted-foreground">
                    {new Date(session.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
