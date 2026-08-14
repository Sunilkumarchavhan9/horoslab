"use client";

import { useMemo, useState } from "react";
import { Activity, AlertTriangle, ArrowRight, Rocket, Shield, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemePreference } from "@/lib/continuity-lab/use-theme-preference";
import { useMissionStore } from "../../runtime/store";
import { useMissionRuntimeData } from "../../runtime/mission-runtime-data";

export function MissionActiveView() {
  const { setView, setSelection } = useMissionStore();
  const { missions, missionRows, loading, error } = useMissionRuntimeData();
  const { resolved } = useThemePreference();
  const isDark = resolved === "dark";

  const activeMissions = missionRows;

  const summary = useMemo(() => {
    const running = missions.filter((mission) => (mission.state ?? "").toLowerCase() === "running");
    const waiting = missions.filter((mission) => (mission.state ?? "").toLowerCase() === "waiting_review");
    const blocked = missions.filter((mission) => (mission.state ?? "").toLowerCase() === "failed");
    const completed = missions.filter((mission) => (mission.state ?? "").toLowerCase() === "completed");

    const averageDurationMs = (() => {
      const durations = completed
        .map((mission) => {
          const startedAt = new Date(mission.startedAt ?? mission.executionRun?.startedAt ?? "").getTime();
          const completedAt = new Date(mission.completedAt ?? mission.executionRun?.finishedAt ?? "").getTime();
          if (!Number.isFinite(startedAt) || !Number.isFinite(completedAt) || completedAt <= startedAt) return null;
          return completedAt - startedAt;
        })
        .filter((value): value is number => typeof value === "number");

      if (durations.length === 0) return null;
      return durations.reduce((total, duration) => total + duration, 0) / durations.length;
    })();

    const formatAverage = (durationMs: number | null) => {
      if (!durationMs) return "Pending";
      const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return minutes > 0 ? `${minutes}m ${seconds.toString().padStart(2, "0")}s` : `${seconds}s`;
    };

    const plannedSteps = running.reduce((acc, mission) => {
      const plan = mission.executionRun?.planner as { plan?: unknown[] } | undefined;
      return acc + (Array.isArray(plan?.plan) ? plan.plan.length : 1);
    }, 0);

    return {
      active: running.length,
      plannedSteps,
      waiting: waiting.length,
      blocked: blocked.length,
      completedToday: completed.length,
      avgDuration: formatAverage(averageDurationMs),
    };
  }, [missions]);

  const handleCreateMission = () => setView("planner");

  const bgCard = isDark ? "bg-[#121212] border-white/10" : "bg-card border-border";
  const textMuted = isDark ? "text-white/50" : "text-foreground/50";

  return (
    <div className={cn("flex flex-col h-full w-full relative", isDark ? "bg-[#0a0a0a]" : "bg-[#F9F9F9]")}>
      <header className={cn("px-6 py-6 border-b shrink-0 z-10 flex flex-col gap-6", isDark ? "border-white/5 bg-[#0a0a0a]" : "border-border bg-[#F9F9F9]")}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className={cn("text-xl font-semibold tracking-tight", isDark ? "text-white" : "text-foreground")}>Active Missions</h1>
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5", isDark ? "bg-[#eef7ee]/10 text-[#4ade80]" : "bg-[#eef7ee] text-[#2a7b2a]")}>
                <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isDark ? "bg-[#4ade80]" : "bg-[#2a7b2a]")} />
                Live Control
              </span>
            </div>
            <p className={cn("text-[13px] mt-1", textMuted)}>Live software-change missions, evidence, verification, and learning.</p>
          </div>

          <div className="flex items-center gap-6">
            <div className={cn("flex items-center gap-6 mr-4 border-r pr-6", isDark ? "border-white/10" : "border-border")}>
              <div className="flex flex-col">
                <span className={cn("text-[11px] font-medium uppercase tracking-wider", textMuted)}>Active Missions</span>
                <span className={cn("text-[18px] font-semibold", isDark ? "text-white" : "text-foreground")}>{summary.active}</span>
              </div>
              <div className="flex flex-col">
                <span className={cn("text-[11px] font-medium uppercase tracking-wider", textMuted)}>Planned Steps</span>
                <span className={cn("text-[18px] font-semibold", isDark ? "text-white" : "text-foreground")}>{summary.plannedSteps}</span>
              </div>
              <div className="flex flex-col">
                <span className={cn("text-[11px] font-medium uppercase tracking-wider", textMuted)}>Waiting Approval</span>
                <span className={cn("text-[18px] font-semibold text-amber-500")}>{summary.waiting}</span>
              </div>
              <div className="flex flex-col">
                <span className={cn("text-[11px] font-medium uppercase tracking-wider", textMuted)}>Blocked</span>
                <span className={cn("text-[18px] font-semibold text-red-500")}>{summary.blocked}</span>
              </div>
              <div className="flex flex-col">
                <span className={cn("text-[11px] font-medium uppercase tracking-wider", textMuted)}>Completed Today</span>
                <span className={cn("text-[18px] font-semibold", isDark ? "text-[#4ade80]" : "text-[#2a7b2a]")}>{summary.completedToday}</span>
              </div>
              <div className="flex flex-col">
                <span className={cn("text-[11px] font-medium uppercase tracking-wider", textMuted)}>Average Duration</span>
                <span className={cn("text-[18px] font-semibold", isDark ? "text-white" : "text-foreground")}>{summary.avgDuration}</span>
              </div>
            </div>

            <button
              onClick={handleCreateMission}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-1.5 bg-[#0f52ff] text-white rounded-md text-[13px] font-semibold hover:bg-[#0f52ff]/90 transition-colors disabled:opacity-60"
            >
              <Target className="size-4" />
              Plan Software Change
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative">
          <div className="flex items-center gap-3 mb-6">
            <div className={cn("flex items-center gap-2 px-3 py-1.5 bg-card dark:bg-[#121212] border rounded-md text-[13px] flex-1 max-w-sm transition-colors cursor-text", isDark ? "border-white/10 text-white" : "border-border text-foreground")}>
              <Activity className="size-4 shrink-0 opacity-50" />
              <input
                type="text"
                placeholder="Live mission data is sourced from the backend."
                disabled
                className="bg-transparent border-none outline-none w-full placeholder:opacity-50"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center w-full min-h-[400px] text-center border-2 border-dashed rounded-md border-border dark:border-white/10 bg-muted/50 dark:bg-white/[0.02]">
              <Rocket className="size-12 mb-4 text-foreground/20 dark:text-white/20" />
              <h3 className="text-lg font-semibold mb-1 text-foreground/80 dark:text-white/80">Loading missions</h3>
              <p className={cn("text-[14px] max-w-sm mb-6", textMuted)}>Fetching the live Mission runtime state from the backend.</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center w-full min-h-[400px] text-center border-2 border-dashed rounded-md border-red-500/20 bg-red-500/5">
              <AlertTriangle className="size-12 mb-4 text-red-500/70" />
              <h3 className="text-lg font-semibold mb-1 text-red-500">Mission runtime unavailable</h3>
              <p className={cn("text-[14px] max-w-sm mb-6", textMuted)}>{error}</p>
            </div>
          ) : activeMissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center w-full min-h-[400px] text-center border-2 border-dashed rounded-md border-border dark:border-white/10 bg-muted/50 dark:bg-white/[0.02]">
              <Rocket className="size-12 mb-4 text-foreground/20 dark:text-white/20" />
              <h3 className="text-lg font-semibold mb-1 text-foreground/80 dark:text-white/80">No Active Missions</h3>
              <p className={cn("text-[14px] max-w-sm mb-4", textMuted)}>Plan a verified software-change mission, generate its steps, then start execution.</p>
              <button
                onClick={handleCreateMission}
                className="flex items-center gap-2 px-5 py-2 bg-[#0f52ff] text-white rounded-md text-[13px] font-semibold hover:bg-[#0f52ff]/90 transition-colors"
              >
                <Target className="size-4" /> Plan Software Change
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-max pb-10 pr-2">
              {activeMissions.map((mission) => (
                <div
                  key={mission.id}
                  className={cn("group rounded-md border p-6 flex flex-col hover:transition-all relative overflow-hidden cursor-pointer", bgCard)}
                  onClick={() => setSelection({ id: mission.id, type: "mission" })}
                >
                  {mission.status === "running" && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/10">
                      <div className="h-full bg-[#0f52ff]" style={{ width: `${mission.progress}%` }} />
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-3 mt-1">
                    <div className="flex flex-col">
                      <h3 className="font-semibold text-[15px] text-foreground">{mission.name}</h3>
                      <span className={cn("text-[12px]", textMuted)}>{mission.institution}</span>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-[4px] tracking-widest uppercase border",
                      mission.status === "running"
                        ? "bg-[#0f52ff]/10 text-[#0f52ff] border-[#0f52ff]/20"
                        : mission.status === "waiting_review"
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : "bg-muted dark:bg-white/10 text-foreground/60 dark:text-white/60 border-transparent",
                    )}>
                      {mission.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 text-[12px] mb-6">
                    <div className="flex flex-col">
                      <span className={textMuted}>Planner</span>
                      <div className="flex items-center gap-1.5 font-medium mt-0.5">
                        <Shield className="size-3.5 text-green-500" /> {mission.planner}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className={textMuted}>Execution</span>
                      <span className="font-medium mt-0.5">{mission.executionStatus}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className={textMuted}>Evidence</span>
                      <span className="font-medium mt-0.5">{mission.evidence} items</span>
                    </div>
                    <div className="flex flex-col">
                      <span className={textMuted}>Verification</span>
                      <span className="font-medium mt-0.5">{mission.verificationDecision}</span>
                    </div>
                  </div>

                  <div className={cn("absolute bottom-0 left-0 w-full p-3 flex items-center justify-between gap-2 border-t opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200", isDark ? "bg-[#121212] border-white/10" : "bg-card border-border")}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelection({ id: mission.id, type: "mission" });
                        setView("execution");
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-[#0f52ff] text-white text-[12px] font-medium hover:bg-[#0f52ff]/90 transition-colors"
                    >
                      <ArrowRight className="size-3.5" /> Workspace
                    </button>
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded-md hover:bg-accent dark:hover:bg-card/10 transition-colors" title="Inspect" onClick={(e) => { e.stopPropagation(); setSelection({ id: mission.id, type: "mission" }); }}>
                        <Target className="size-4 opacity-70" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
