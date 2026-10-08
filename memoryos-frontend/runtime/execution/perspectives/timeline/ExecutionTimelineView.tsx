"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  FileText,
  Key,
  RefreshCw,
  ShieldCheck,
  Target,
  UserCheck,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMissionStore } from "../../../missions/runtime/store";
import { useMissionRuntimeData } from "../../../missions/runtime/mission-runtime-data";
import type { HorosMissionDetail } from "@/lib/horos-api";

type MissionTimelineEvent = NonNullable<HorosMissionDetail["timeline"]>[number];

function formatTime(value?: string | null): string {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function iconForStage(stage?: string): { icon: typeof Target; color: string; bg: string } {
  const normalized = (stage ?? "").toLowerCase();
  if (normalized.includes("approval")) return { icon: UserCheck, color: "text-amber-500", bg: "bg-amber-500/10" };
  if (normalized.includes("verify")) return { icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" };
  if (normalized.includes("evidence") || normalized.includes("artifact")) return { icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" };
  if (normalized.includes("execute") || normalized.includes("run") || normalized.includes("worker")) return { icon: Zap, color: "text-foreground", bg: "bg-muted" };
  if (normalized.includes("lease")) return { icon: Key, color: "text-amber-500", bg: "bg-amber-500/10" };
  if (normalized.includes("complete") || normalized.includes("finish")) return { icon: CheckCircle2, color: "text-background", bg: "bg-foreground" };
  return { icon: Target, color: "text-foreground", bg: "bg-muted" };
}

export function ExecutionTimelineView() {
  const { selection } = useMissionStore();
  const { missions, loading, error, getMission } = useMissionRuntimeData();
  const [mission, setMission] = useState<HorosMissionDetail | null>(null);
  const [missionLoading, setMissionLoading] = useState(false);
  const [missionError, setMissionError] = useState<string | null>(null);

  const selectedMissionId = selection?.type === "mission" ? selection.id : missions[0]?.id ?? null;

  useEffect(() => {
    let cancelled = false;
    const loadMission = async () => {
      if (!selectedMissionId) {
        setMission(null);
        return;
      }

      setMissionLoading(true);
      setMissionError(null);
      try {
        const detail = await getMission(selectedMissionId);
        if (!cancelled) {
          setMission(detail);
        }
      } catch (err) {
        if (!cancelled) {
          setMissionError(err instanceof Error ? err.message : "Failed to load execution timeline.");
        }
      } finally {
        if (!cancelled) {
          setMissionLoading(false);
        }
      }
    };

    void loadMission();
    return () => {
      cancelled = true;
    };
  }, [getMission, selectedMissionId]);

  const timeline = useMemo(
    () => (Array.isArray(mission?.timeline) ? (mission.timeline as MissionTimelineEvent[]) : []),
    [mission],
  );
  const status = (mission?.state ?? "draft").toLowerCase();

  return (
    <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-background text-foreground">
      <div className="flex items-center gap-4 px-8 py-6 border-b border-border bg-card shrink-0">
        <div className="size-10 bg-foreground text-background flex items-center justify-center rounded-sm shrink-0">
          <Activity className="size-5" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-[18px] font-bold leading-none tracking-tight">Execution Narrative</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Live mission timeline loaded from the backend mission record.
          </p>
        </div>
        <button
          type="button"
          className="ml-auto inline-flex items-center gap-2 px-3 py-2 bg-muted text-foreground rounded-sm text-[12px] font-bold hover:bg-muted/80 transition-colors border border-border"
          onClick={() => {
            if (!selectedMissionId) return;
            setMissionLoading(true);
            void getMission(selectedMissionId)
              .then((detail) => setMission(detail))
              .catch((err) => setMissionError(err instanceof Error ? err.message : "Failed to refresh timeline."))
              .finally(() => setMissionLoading(false));
          }}
        >
          <RefreshCw className="size-4" />
          Refresh
        </button>
      </div>

      <div className="flex flex-col w-full overflow-y-auto bg-background">
        <div className="flex items-center justify-between px-8 py-3 bg-muted/30 border-b border-border sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Tracing Execution:</span>
            <span className="text-[11px] font-mono font-bold text-foreground bg-card border border-border px-2 py-0.5 rounded-sm">
              {mission?.id ?? selectedMissionId ?? "No mission selected"}
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-sm uppercase tracking-wider">
            {status === "completed" ? "Verified Run" : status}
          </span>
        </div>

        <div className="flex flex-col w-full p-8 relative max-w-4xl mx-auto pb-16">
          <div className="absolute left-[79px] top-8 bottom-16 w-px bg-border z-0" />

          {loading || missionLoading ? (
            <div className="text-[13px] text-muted-foreground">Loading live mission timeline...</div>
          ) : error ? (
            <div className="text-[13px] text-red-500 flex items-center gap-2">
              <AlertTriangle className="size-4" />
              {error}
            </div>
          ) : missionError ? (
            <div className="text-[13px] text-red-500 flex items-center gap-2">
              <AlertTriangle className="size-4" />
              {missionError}
            </div>
          ) : timeline.length === 0 ? (
            <div className="text-[13px] text-muted-foreground">No timeline events have been recorded for the selected mission yet.</div>
          ) : (
            timeline.map((event, index) => {
              const { icon: Icon, color, bg } = iconForStage(event.stage ?? event.note);
              return (
                <div key={event.id ?? `timeline-${index}`} className="flex items-start gap-6 mb-8 relative z-10 group cursor-pointer">
                  <div className="flex flex-col items-end w-[120px] shrink-0 pt-1.5 pr-4 relative">
                    <span className="text-[12px] font-mono text-muted-foreground">{formatTime(event.timestamp)}</span>
                  </div>

                  <div
                    className={cn(
                      "size-10 rounded-sm border flex items-center justify-center shrink-0 transition-all shadow-sm z-10",
                      bg,
                      index === timeline.length - 1 ? "border-foreground" : "border-border group-hover:border-foreground/30",
                    )}
                  >
                    <Icon className={cn("size-5", index === timeline.length - 1 ? "text-background" : color)} />
                  </div>

                  <div className="flex flex-col justify-center flex-1 bg-card border border-border p-5 rounded-sm shadow-sm group-hover:border-foreground/20 transition-colors mt-0.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[15px] font-bold text-foreground tracking-tight group-hover:text-blue-500 transition-colors">
                        {event.stage ?? "Mission event"}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm border border-border">
                        {event.id ?? "timeline"}
                      </span>
                    </div>
                    <span className="text-[13px] text-muted-foreground leading-relaxed">
                      {event.note ?? "Backend timeline event recorded by the mission runtime."}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          <div className="flex items-center gap-6 relative z-10 opacity-50">
            <div className="w-[120px] shrink-0" />
            <div className="size-10 flex items-center justify-center shrink-0">
              <CircleDashed className="size-5 text-muted-foreground animate-spin-slow" />
            </div>
            <div className="flex-1">
              <span className="text-[12px] font-mono text-muted-foreground">End of Trace</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
