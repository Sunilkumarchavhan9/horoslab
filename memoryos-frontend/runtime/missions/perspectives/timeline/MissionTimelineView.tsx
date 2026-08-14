"use client";

import { useMemo } from "react";
import { Activity, ArrowRight, CheckCircle2, FileText, ShieldCheck, Target, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemePreference } from "@/lib/continuity-lab/use-theme-preference";
import { useMissionStore } from "../../runtime/store";
import { useMissionRuntimeData } from "../../runtime/mission-runtime-data";

type TimelineItem = {
  id: string;
  missionId: string;
  title: string;
  time: string;
  detail: string;
  icon: typeof Target;
  color: string;
  bg: string;
  border: string;
};

export function MissionTimelineView() {
  const { setView, setSelection } = useMissionStore();
  const { missions } = useMissionRuntimeData();

  const { resolved } = useThemePreference();
  const isDark = resolved === "dark";

  const events = useMemo<TimelineItem[]>(() => {
    const iconForStage = (stage?: string) => {
      switch ((stage ?? "").toLowerCase()) {
        case "execution":
          return Activity;
        case "verification":
          return ShieldCheck;
        case "certificate":
          return CheckCircle2;
        case "authority":
          return UserCheck;
        case "planner":
          return FileText;
        default:
          return Target;
      }
    };

    return missions
      .flatMap((mission) =>
        (Array.isArray(mission.timeline) ? mission.timeline : []).map((entry, index) => ({
          id: `${mission.id}:${entry.id ?? index}`,
          missionId: mission.id,
          title: entry.note ?? entry.stage ?? mission.title ?? mission.objective ?? "Mission event",
          time: entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Unknown",
          detail: `${mission.title ?? mission.objective ?? "Mission"} · ${entry.status ?? "update"}`,
          icon: iconForStage(entry.stage),
          color:
            (entry.status ?? "").toLowerCase() === "completed" || (entry.status ?? "").toLowerCase() === "issued"
              ? "text-emerald-500"
              : (entry.status ?? "").toLowerCase() === "blocked" || (entry.status ?? "").toLowerCase() === "failed"
                ? "text-red-500"
                : "text-blue-500",
          bg:
            (entry.status ?? "").toLowerCase() === "completed" || (entry.status ?? "").toLowerCase() === "issued"
              ? "bg-emerald-500/10"
              : (entry.status ?? "").toLowerCase() === "blocked" || (entry.status ?? "").toLowerCase() === "failed"
                ? "bg-red-500/10"
                : "bg-blue-500/10",
          border:
            (entry.status ?? "").toLowerCase() === "completed" || (entry.status ?? "").toLowerCase() === "issued"
              ? "border-emerald-500/20"
              : (entry.status ?? "").toLowerCase() === "blocked" || (entry.status ?? "").toLowerCase() === "failed"
                ? "border-red-500/20"
                : "border-blue-500/20",
        })),
      )
      .sort((a, b) => b.time.localeCompare(a.time))
      .slice(0, 12);
  }, [missions]);

  return (
    <div className={cn("flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-background text-foreground", isDark ? "bg-[#0a0a0a]" : "bg-background")}>
      <div className={cn("flex items-center gap-3 px-8 py-6 border-b border-border bg-card shrink-0", isDark ? "bg-[#121212]" : "bg-card")}>
        <div className="size-10 bg-foreground text-background flex items-center justify-center rounded-sm shrink-0">
          <Activity className="size-5" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-[18px] font-bold leading-none tracking-tight">Execution Timeline</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Live operational narrative and system event stream.</p>
        </div>
      </div>

      <div className="flex flex-col w-full h-full overflow-y-auto">
        <div className="flex items-center justify-between px-8 py-4 bg-muted/30 border-b border-border sticky top-0 z-10">
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Live Event Stream</h2>
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-sm">
            <div className="size-2 rounded-full bg-emerald-500 animate-ping absolute" />
            <div className="size-2 rounded-full bg-emerald-500 relative" />
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider">Listening</span>
          </div>
        </div>

        <div className="flex flex-col w-full px-8 py-4 pb-12">
          {events.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">No mission timeline events are available yet.</div>
          ) : (
            events.map((event, index) => (
              <div key={event.id} className="flex items-stretch group cursor-pointer" onClick={() => { setSelection({ id: event.missionId, type: "mission" }); setView("execution"); }}>
                <div className="flex flex-col items-center w-[60px] shrink-0 relative">
                  {index !== events.length - 1 && <div className="absolute top-[28px] bottom-[-28px] w-px bg-border group-hover:bg-foreground/30 transition-colors z-0" />}
                  <div className={cn("size-8 rounded-full border flex items-center justify-center shrink-0 z-10 relative mt-3 transition-colors", event.bg, event.border)}>
                    <event.icon className={cn("size-4", event.color)} />
                  </div>
                </div>

                <div className="flex flex-col justify-center flex-1 py-3 pl-4">
                  <div className="flex flex-col border border-border rounded-md bg-card hover:border-foreground/30 transition-colors p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold text-foreground">{event.title}</span>
                        <ArrowRight className="size-3.5 text-muted-foreground" />
                        <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">{event.missionId}</span>
                      </div>
                      <span className="text-[12px] font-mono text-muted-foreground">{event.time}</span>
                    </div>
                    <span className="text-[13px] text-muted-foreground leading-relaxed">{event.detail}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
