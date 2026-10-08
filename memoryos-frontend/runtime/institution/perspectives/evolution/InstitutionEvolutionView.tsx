"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Target, Dna, Box, ShieldCheck, Flag, GitCommit, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getHorosInstitutionHistory, listHorosInstitutions, readActiveHorosWorkspaceId, type HorosInstitutionHistory } from "@/lib/horos-api";

function historyIcon(type?: string) {
  const normalized = (type ?? "").toLowerCase();
  if (normalized.includes("mission")) return Target;
  if (normalized.includes("policy")) return ShieldCheck;
  if (normalized.includes("version")) return GitCommit;
  if (normalized.includes("memory")) return Box;
  if (normalized.includes("genome")) return Dna;
  return Flag;
}

function historyColor(type?: string) {
  const normalized = (type ?? "").toLowerCase();
  if (normalized.includes("mission")) return "text-blue-500";
  if (normalized.includes("policy")) return "text-rose-500";
  if (normalized.includes("version")) return "text-emerald-500";
  if (normalized.includes("memory")) return "text-purple-500";
  if (normalized.includes("genome")) return "text-amber-500";
  return "text-foreground";
}

function formatDate(value?: string): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

export function InstitutionEvolutionView() {
  const [history, setHistory] = useState<HorosInstitutionHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const workspaceId = readActiveHorosWorkspaceId();

  const loadHistory = useCallback(async () => {
    if (!workspaceId) {
      setHistory(null);
      setLoading(false);
      setError("No active HOROS workspace is available.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const institutions = await listHorosInstitutions(workspaceId);
      const firstInstitution = institutions[0];
      if (!firstInstitution) {
        setHistory(null);
        return;
      }
      setHistory(await getHorosInstitutionHistory(workspaceId, firstInstitution.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load institution evolution.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const events = [
    ...(history?.versions ?? []).map((version) => ({
      id: version.id,
      title: version.version ?? "Version update",
      date: formatDate(version.createdAt),
      desc: `Snapshot ${version.snapshot ? "recorded" : "captured"} for ${history?.institution?.name ?? "the institution"}.`,
      icon: GitCommit,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    })),
    ...(history?.runtimeEvents ?? []).slice(0, 8).map((event) => ({
      id: event.id,
      title: event.type ?? "Runtime event",
      date: formatDate(event.timestamp),
      desc: `Backend event for ${history?.institution?.name ?? "the institution"}.`,
      icon: historyIcon(event.type),
      color: historyColor(event.type),
      bg: "bg-muted",
    })),
  ];

  return (
    <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-background text-foreground">
      <div className="flex items-center justify-between gap-4 px-8 py-6 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-4">
          <div className="size-10 bg-foreground text-background flex items-center justify-center rounded-sm shrink-0">
            <Activity className="size-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[18px] font-bold leading-none tracking-tight">Institution Evolution</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Live institution history and runtime events from the backend.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadHistory()}
          className="flex items-center gap-2 bg-muted text-foreground px-4 py-2 rounded-sm text-[13px] font-bold hover:bg-muted/80 transition-colors border border-border"
        >
          <RefreshCw className="size-4" /> Refresh
        </button>
      </div>

      <div className="flex-1 w-full overflow-y-auto bg-background relative py-16 px-8">
        {loading ? (
          <div className="max-w-4xl mx-auto text-[13px] text-muted-foreground">Loading live history...</div>
        ) : error ? (
          <div className="max-w-4xl mx-auto text-[13px] text-red-500">{error}</div>
        ) : !history || events.length === 0 ? (
          <div className="max-w-4xl mx-auto text-[13px] text-muted-foreground">No institution history is available yet.</div>
        ) : (
          <div className="max-w-4xl mx-auto relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-border to-emerald-500/50 -translate-x-1/2 z-0 rounded-full" />

            <div className="flex flex-col gap-12 w-full">
              {events.map((node, i) => {
                const isEven = i % 2 === 0;
                const Icon = node.icon;
                return (
                  <div key={node.id} className="relative flex items-center w-full z-10 group">
                    <div className={cn("flex-1 flex", isEven ? "justify-end pr-16" : "justify-start opacity-0 pointer-events-none")}>
                      <div className="flex flex-col items-end text-right bg-card border border-border p-6 rounded-sm w-[360px] group-hover:border-foreground/20 transition-colors shadow-sm">
                        <span className="text-[12px] font-mono text-muted-foreground mb-2">{node.date}</span>
                        <h3 className="text-[16px] font-bold text-foreground mb-2">{node.title}</h3>
                        <p className="text-[13px] text-muted-foreground leading-relaxed">{node.desc}</p>
                      </div>
                    </div>

                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
                      <div className={cn("size-16 rounded-full border-4 border-background flex items-center justify-center transition-transform duration-500 group-hover:scale-110 shadow-sm", node.bg)}>
                        <Icon className={cn("size-6", node.color)} />
                      </div>
                    </div>

                    <div className={cn("flex-1 flex", !isEven ? "justify-start pl-16" : "justify-start opacity-0 pointer-events-none")}>
                      <div className="flex flex-col items-start text-left bg-card border border-border p-6 rounded-sm w-[360px] group-hover:border-foreground/20 transition-colors shadow-sm">
                        <span className="text-[12px] font-mono text-muted-foreground mb-2">{node.date}</span>
                        <h3 className="text-[16px] font-bold text-foreground mb-2">{node.title}</h3>
                        <p className="text-[13px] text-muted-foreground leading-relaxed">{node.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
