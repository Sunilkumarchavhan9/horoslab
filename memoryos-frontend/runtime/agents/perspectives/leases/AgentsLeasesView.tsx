"use client";

import { useEffect, useState } from "react";
import { Key, ArrowRight, ShieldAlert, ShieldCheck, Clock, FileText, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgentStore } from "../../store";
import { listProductAgentSessions, type ProductAgentSession } from "@/lib/product-agent-api";

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

export function AgentsLeasesView() {
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
      setError(err instanceof Error ? err.message : "Failed to load live agent leases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, []);

  return (
    <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-card dark:bg-[#111] text-foreground dark:text-[#eee]">
      <div className="flex items-center justify-between gap-4 px-8 py-6 border-b border-border dark:border-[#333]">
        <div className="flex items-center gap-3">
          <div className="size-8 bg-[#111] dark:bg-white text-white dark:text-foreground flex items-center justify-center shrink-0">
            <Key className="size-4" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold leading-none">Capability Leases</h1>
            <p className="text-[12px] text-muted-foreground dark:text-muted-foreground mt-1">
              Product-agent sessions and their current lease-like state from the backend.
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
          <div className="p-8 text-[13px] text-muted-foreground dark:text-muted-foreground">Loading live lease data...</div>
        ) : error ? (
          <div className="p-8 text-[13px] text-red-500">{error}</div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-[13px] text-muted-foreground dark:text-muted-foreground">No product-agent sessions are available yet.</div>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => selectEntity(session.agentId)}
              className={cn(
                "flex flex-col p-8 transition-all relative overflow-hidden group w-full text-left",
                selectedEntity === session.agentId ? "bg-muted/50 dark:bg-[#1a1a1a]" : "bg-card dark:bg-[#111] hover:bg-muted/50 dark:hover:bg-[#1a1a1a]",
                session.status === "ended" && "opacity-70",
              )}
            >
              <div className="flex items-center justify-between w-full border-b border-border dark:border-[#333] pb-6 mb-6">
                <div className="flex items-center gap-4">
                  <span className="text-[18px] font-bold font-mono">{session.id}</span>
                  <span
                    className={cn(
                      "px-3 py-1 rounded-sm text-[11px] font-bold tracking-wider uppercase",
                      session.status === "active" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white",
                    )}
                  >
                    {session.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[12px] font-bold text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                  <Clock className="size-4" /> Updated:{" "}
                  <span className={cn("font-mono", session.status === "active" ? "text-foreground dark:text-[#eee]" : "text-rose-500")}>
                    {formatUpdatedAt(session.updatedAt)}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-8 w-full">
                <div className="flex flex-col gap-3 flex-[0.8]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">Agent</span>
                  <span className="text-[14px] font-mono font-bold bg-[#eee] dark:bg-[#222] px-3 py-1.5 w-fit">{session.agentId}</span>
                  <span className="text-[13px] text-muted-foreground dark:text-muted-foreground mt-2">
                    Goal: <br />
                    <span className="font-mono text-foreground dark:text-[#eee]">{session.goal ?? "No goal recorded"}</span>
                  </span>
                </div>

                <ArrowRight className="size-4 text-[#ccc] dark:text-muted-foreground shrink-0 mt-8" />

                <div className="flex flex-col gap-3 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground flex items-center gap-1.5">
                    <Key className="size-3" /> Session Scope
                  </span>
                  <div className="flex flex-col gap-2">
                    <span className="text-[13px] font-bold text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-1.5">
                      {session.projectId ?? "No project scope"}
                    </span>
                    <span className="text-[13px] text-muted-foreground dark:text-muted-foreground">Goal ID: {session.goalId ?? "none"}</span>
                  </div>
                </div>

                <ArrowRight className="size-4 text-[#ccc] dark:text-muted-foreground shrink-0 mt-8" />

                <div className="flex flex-col gap-3 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground flex items-center gap-1.5">
                    <FileText className="size-3" /> Session Model
                  </span>
                  <span className="text-[13px] font-bold bg-muted/50 dark:bg-[#1a1a1a] border border-border dark:border-[#333] px-3 py-1.5">
                    {session.model ?? "default"}
                  </span>
                </div>

                <ArrowRight className="size-4 text-[#ccc] dark:text-muted-foreground shrink-0 mt-8" />

                <div className="flex flex-col gap-3 flex-[0.8]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground flex items-center gap-1.5">
                    {session.status === "active" ? <ShieldCheck className="size-3 text-emerald-500" /> : <ShieldAlert className="size-3 text-rose-500" />}
                    Authorization
                  </span>
                  <span className="text-[14px] font-bold">{session.status === "active" ? "Active" : "Ended"}</span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
