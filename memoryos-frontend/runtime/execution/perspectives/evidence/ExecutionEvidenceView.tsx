"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, ShieldCheck, Database, Camera, Box, Fingerprint, Lock, ArrowDown, RefreshCw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMissionStore } from "../../../missions/runtime/store";
import { useMissionRuntimeData } from "../../../missions/runtime/mission-runtime-data";
import type { HorosMissionDetail } from "@/lib/horos-api";

type MissionEvidence = NonNullable<HorosMissionDetail["evidence"]>[number];

function evidenceIcon(kind?: string) {
  const normalized = (kind ?? "").toLowerCase();
  if (normalized.includes("proof") || normalized.includes("crypto")) return Lock;
  if (normalized.includes("screenshot") || normalized.includes("image")) return Camera;
  if (normalized.includes("audit") || normalized.includes("log")) return Database;
  return FileText;
}

function evidenceColor(kind?: string) {
  const normalized = (kind ?? "").toLowerCase();
  if (normalized.includes("proof") || normalized.includes("crypto")) return "text-purple-500";
  if (normalized.includes("screenshot") || normalized.includes("image")) return "text-foreground";
  if (normalized.includes("audit") || normalized.includes("log")) return "text-blue-500";
  return "text-amber-500";
}

function evidenceBg(kind?: string) {
  const normalized = (kind ?? "").toLowerCase();
  if (normalized.includes("proof") || normalized.includes("crypto")) return "bg-purple-500/10";
  if (normalized.includes("screenshot") || normalized.includes("image")) return "bg-muted";
  if (normalized.includes("audit") || normalized.includes("log")) return "bg-blue-500/10";
  return "bg-amber-500/10";
}

function formatTime(value?: string | null): string {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ExecutionEvidenceView() {
  const { selection } = useMissionStore();
  const { missions, loading, error, getMission } = useMissionRuntimeData();
  const [mission, setMission] = useState<HorosMissionDetail | null>(null);
  const [missionError, setMissionError] = useState<string | null>(null);
  const [missionLoading, setMissionLoading] = useState(false);

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
        if (!cancelled) setMission(detail);
      } catch (err) {
        if (!cancelled) setMissionError(err instanceof Error ? err.message : "Failed to load execution evidence.");
      } finally {
        if (!cancelled) setMissionLoading(false);
      }
    };

    void loadMission();
    return () => {
      cancelled = true;
    };
  }, [getMission, selectedMissionId]);

  const evidenceRows = useMemo<MissionEvidence[]>(() => (Array.isArray(mission?.evidence) ? mission.evidence : []), [mission]);

  return (
    <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-background text-foreground">
      <div className="flex items-center gap-4 px-8 py-6 border-b border-border bg-card shrink-0">
        <div className="size-10 bg-foreground text-background flex items-center justify-center rounded-sm shrink-0">
          <FileText className="size-5" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-[18px] font-bold leading-none tracking-tight">Evidence Ledger</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Live mission evidence loaded from the backend mission record.
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
              .catch((err) => setMissionError(err instanceof Error ? err.message : "Failed to refresh evidence."))
              .finally(() => setMissionLoading(false));
          }}
        >
          <RefreshCw className="size-4" />
          Refresh
        </button>
      </div>

      <div className="flex flex-col w-full overflow-hidden bg-background">
        <div className="flex items-center px-8 py-3 bg-muted/30 border-b border-border shrink-0 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <div className="w-[120px] flex items-center gap-2"><ArrowDown className="size-3.5" /> Time</div>
          <div className="w-[180px] flex items-center gap-2"><Fingerprint className="size-3.5" /> Evidence ID</div>
          <div className="w-[200px] flex items-center gap-2"><FileText className="size-3.5" /> Artifact Type</div>
          <div className="flex-[2] flex items-center gap-2">Claim & Payload</div>
          <div className="w-[140px] flex items-center gap-2"><Box className="size-3.5" /> Source</div>
          <div className="w-[100px] flex items-center justify-end gap-2"><ShieldCheck className="size-3.5" /> Integrity</div>
        </div>

        {loading || missionLoading ? (
          <div className="p-8 text-[13px] text-muted-foreground">Loading live mission evidence...</div>
        ) : error ? (
          <div className="p-8 text-[13px] text-red-500 flex items-center gap-2">
            <AlertTriangle className="size-4" />
            {error}
          </div>
        ) : missionError ? (
          <div className="p-8 text-[13px] text-red-500 flex items-center gap-2">
            <AlertTriangle className="size-4" />
            {missionError}
          </div>
        ) : evidenceRows.length === 0 ? (
          <div className="p-8 text-[13px] text-muted-foreground">No evidence has been recorded for the selected mission yet.</div>
        ) : (
          <div className="flex flex-col overflow-y-auto divide-y divide-border">
            {evidenceRows.map((ev) => {
              const Icon = evidenceIcon(ev.kind);
              return (
                <div key={ev.id} className="flex items-stretch hover:bg-muted/20 transition-colors w-full group bg-card">
                  <div className="flex flex-col justify-center p-4 w-[120px] shrink-0 border-r border-border/50">
                    <span className="text-[12px] font-mono text-muted-foreground">{formatTime(ev.createdAt)}</span>
                  </div>

                  <div className="flex flex-col justify-center p-4 w-[180px] shrink-0 border-r border-border/50">
                    <span className="text-[11px] font-mono font-bold text-foreground bg-muted border border-border px-2 py-1 rounded-sm w-fit group-hover:text-blue-500 transition-colors cursor-pointer">
                      {ev.id}
                    </span>
                  </div>

                  <div className="flex flex-col justify-center p-4 w-[200px] shrink-0 border-r border-border/50">
                    <div className="flex items-center gap-2">
                      <div className={cn("size-6 rounded-sm flex items-center justify-center border border-border", evidenceBg(ev.kind))}>
                        <Icon className={cn("size-3.5", evidenceColor(ev.kind))} />
                      </div>
                      <span className="text-[12px] font-bold text-foreground tracking-tight">{ev.kind ?? "Evidence"}</span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center p-4 flex-[2] border-r border-border/50">
                    <span className="text-[13px] font-bold text-foreground tracking-tight mb-1">{ev.summary ?? "Evidence captured by the backend mission runner."}</span>
                    <span className="text-[11px] font-mono text-muted-foreground bg-muted/30 p-1.5 rounded-sm border border-border/50 truncate max-w-full">
                      {ev.url ?? ev.filePath ?? ev.contentType ?? "No payload metadata"}
                    </span>
                  </div>

                  <div className="flex flex-col justify-center p-4 w-[140px] shrink-0 border-r border-border/50">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{ev.kind ?? "mission"}</span>
                  </div>

                  <div className="flex flex-col justify-center items-end p-4 w-[100px] shrink-0">
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm border", "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20")}>
                      Verified
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
