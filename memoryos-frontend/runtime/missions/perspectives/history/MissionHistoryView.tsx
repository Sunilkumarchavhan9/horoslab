"use client";

import { useMemo, useState } from "react";
import { Search, Calendar, User, Building, CheckCircle2, XCircle, ArrowDown, Play, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemePreference } from "@/lib/continuity-lab/use-theme-preference";
import { useMissionStore } from "../../runtime/store";
import { useMissionRuntimeData } from "../../runtime/mission-runtime-data";

export function MissionHistoryView() {
  const { setView, setSelection } = useMissionStore();
  const { historyCards, loading, error } = useMissionRuntimeData();
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { resolved } = useThemePreference();
  const isDark = resolved === "dark";
  const bgCard = isDark ? "bg-[#121212] border-white/10" : "bg-card border-border";
  const textMuted = isDark ? "text-white/50" : "text-foreground/50";

  const visibleHistory = useMemo(
    () =>
      historyCards.filter((event) =>
        `${event.missionName} ${event.institution} ${event.owner} ${event.status}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [historyCards, query],
  );

  const summary = useMemo(() => {
    const total = historyCards.length;
    const passed = historyCards.filter((event) => event.status === "PASS").length;
    const failed = historyCards.filter((event) => event.status === "FAIL").length;
    return { total, passed, failed };
  }, [historyCards]);

  return (
    <div className={cn("flex flex-col h-full w-full relative", isDark ? "bg-[#0a0a0a]" : "bg-[#F9F9F9]")}>
      <header className={cn("px-6 py-6 border-b shrink-0 z-10 flex flex-col gap-6", isDark ? "border-white/5 bg-[#0a0a0a]" : "border-border bg-[#F9F9F9]")}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className={cn("text-xl font-semibold tracking-tight", isDark ? "text-white" : "text-foreground")}>Mission History</h1>
            </div>
            <p className={cn("text-[13px] mt-1", textMuted)}>Linear timeline of past completed missions.</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className={cn("text-[11px] font-medium uppercase tracking-wider", textMuted)}>Total</span>
              <span className={cn("text-[18px] font-semibold", isDark ? "text-white" : "text-foreground")}>{summary.total}</span>
            </div>
            <div className="flex flex-col">
              <span className={cn("text-[11px] font-medium uppercase tracking-wider", textMuted)}>Passed</span>
              <span className={cn("text-[18px] font-semibold text-green-500")}>{summary.passed}</span>
            </div>
            <div className="flex flex-col">
              <span className={cn("text-[11px] font-medium uppercase tracking-wider", textMuted)}>Failed</span>
              <span className={cn("text-[18px] font-semibold text-red-500")}>{summary.failed}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className={cn("w-[240px] shrink-0 border-r p-6 space-y-6 overflow-y-auto custom-scrollbar hidden md:block", isDark ? "border-white/10" : "border-border")}>
          <div className="space-y-3">
            <h3 className={cn("text-[12px] font-semibold uppercase tracking-wider opacity-60", isDark ? "text-white" : "text-foreground")}>Filters</h3>
            <div className="space-y-2">
              <button className={cn("w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] border", isDark ? "bg-card/5 border-white/10 text-white" : "bg-muted border-border text-foreground")}>
                <div className="flex items-center gap-2"><Building className="size-3.5 opacity-70" /> Institution</div>
                <ChevronDown className="size-3.5 opacity-50" />
              </button>
              <button className={cn("w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] border border-transparent hover:border-border dark:hover:border-white/10", isDark ? "text-white" : "text-foreground hover:bg-accent")}>
                <div className="flex items-center gap-2"><Calendar className="size-3.5 opacity-70" /> Date Range</div>
                <ChevronDown className="size-3.5 opacity-50" />
              </button>
              <button className={cn("w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] border border-transparent hover:border-border dark:hover:border-white/10", isDark ? "text-white" : "text-foreground hover:bg-accent")}>
                <div className="flex items-center gap-2"><User className="size-3.5 opacity-70" /> Owner</div>
                <ChevronDown className="size-3.5 opacity-50" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className={cn("px-6 py-6 border-b flex items-center gap-6 shrink-0", isDark ? "border-white/10" : "border-border")}>
            <div className={cn("flex items-center gap-2 px-3 py-2 rounded-md text-[13px] w-full max-w-md border transition-colors cursor-text", isDark ? "bg-[#121212] border-white/10 text-white" : "bg-card border-border text-foreground")}>
              <Search className="size-4 shrink-0 opacity-50" />
              <input
                type="text"
                placeholder="Search history..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="outline-none bg-transparent w-full placeholder:opacity-50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center min-h-[320px] text-sm text-muted-foreground">Loading mission history...</div>
            ) : error ? (
              <div className="flex items-center justify-center min-h-[320px] text-sm text-red-500">{error}</div>
            ) : visibleHistory.length === 0 ? (
              <div className="flex items-center justify-center min-h-[320px] text-sm text-muted-foreground">No completed missions yet.</div>
            ) : (
              visibleHistory.map((event) => (
                <div key={event.id} className="flex gap-6">
                  <div className="w-24 shrink-0 pt-1 text-right">
                    <div className={cn("text-[13px] font-medium", isDark ? "text-white" : "text-foreground")}>{event.date}</div>
                    <div className={cn("text-[11px] mt-0.5", textMuted)}>{event.duration}</div>
                  </div>

                  <div className="relative flex flex-col items-center">
                    <div className={cn("size-3 rounded-full z-10 mt-1.5", event.status === "PASS" ? "bg-green-500" : "bg-red-500")} />
                    <div className={cn("w-px h-full absolute top-3", isDark ? "bg-card/10" : "bg-black/10")} />
                  </div>

                  <div className="flex-1 pb-8 pr-2">
                    <div
                      onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                      className={cn("rounded-md border p-6 cursor-pointer transition-all", bgCard, expandedId === event.id ? "ring-1 ring-black/10 dark:ring-white/20" : "")}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {event.status === "PASS" ? <CheckCircle2 className="size-4 text-green-500" /> : <XCircle className="size-4 text-red-500" />}
                          <h3 className={cn("font-semibold text-[15px]", isDark ? "text-white" : "text-foreground")}>{event.missionName}</h3>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelection({ id: event.id, type: "mission" });
                            setView("execution");
                          }}
                          className={cn("px-3 py-1 text-[12px] font-medium rounded-md border flex items-center gap-1.5 transition-colors", isDark ? "hover:bg-card/10 border-white/20 text-white" : "hover:bg-accent border-border text-foreground")}
                        >
                          <Play className="size-3" /> Replay
                        </button>
                      </div>

                      <div className="flex items-center gap-6 text-[12px] mb-4">
                        <span className={cn("flex items-center gap-1.5", textMuted)}><Building className="size-3.5" /> {event.institution}</span>
                        <span className={cn("flex items-center gap-1.5", textMuted)}><User className="size-3.5" /> {event.owner}</span>
                      </div>

                      {expandedId === event.id && (
                        <div className="mt-4 pt-4 border-t border-border dark:border-white/5">
                          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 dark:before:via-slate-700 before:to-transparent">
                            <div className="flex flex-col gap-0 pl-1">
                              {event.nodes.map((node, i) => (
                                <div key={i} className="flex flex-col items-start pb-4 last:pb-0">
                                  <div className="flex items-center gap-3 relative">
                                    <div className="flex items-center justify-center w-6 h-6 shrink-0 relative z-10">
                                      <ArrowDown className="size-3.5 text-foreground/30 dark:text-white/30" />
                                    </div>
                                    <div className={cn("px-3 py-1.5 rounded border text-[13px]", isDark ? "bg-[#1a1a1a] border-white/5 text-white" : "bg-card border-border text-foreground")}>
                                      <span className="font-medium mr-2">{node.label}</span>
                                      <span className="opacity-50 text-[11px]">{node.time}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
