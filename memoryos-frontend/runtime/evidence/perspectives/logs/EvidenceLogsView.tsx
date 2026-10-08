"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building,
  ChevronDown,
  ChevronRight,
  FileText,
  Filter,
  History,
  RefreshCw,
  Rocket,
  Scale as GovIcon,
  Search,
  ShieldCheck,
  Target,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMissionStore } from "../../../missions/runtime/store";
import { useMissionRuntimeData } from "../../../missions/runtime/mission-runtime-data";
import type { HorosMissionDetail } from "@/lib/horos-api";

type MissionTimelineEvent = NonNullable<HorosMissionDetail["timeline"]>[number];

type MissionLogEntry = {
  id: string;
  time: string;
  worker: string;
  mission: string;
  action: string;
  evidence: string;
  status: string;
  icon: typeof Activity;
};

function formatTime(value?: string | null): string {
  if (!value) return "--:--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--:--";
  return date.toLocaleTimeString([], { hour12: false });
}

function mapExecutionLog(entry: unknown, index: number, missionId: string): MissionLogEntry {
  if (typeof entry === "string") {
    return {
      id: `log-${index + 1}`,
      time: formatTime(null),
      worker: "HOROS Mission Runtime",
      mission: missionId,
      action: entry,
      evidence: missionId,
      status: "Verified",
      icon: Activity,
    };
  }

  if (entry && typeof entry === "object") {
    const record = entry as Record<string, unknown>;
    const action = [record.action, record.label, record.message, record.note, record.type].find(
      (value) => typeof value === "string" && value.trim().length > 0,
    ) as string | undefined;

    return {
      id: String(record.id ?? `log-${index + 1}`),
      time: formatTime(
        typeof record.timestamp === "string" ? record.timestamp : typeof record.createdAt === "string" ? record.createdAt : null,
      ),
      worker: typeof record.worker === "string" ? record.worker : typeof record.actor === "string" ? record.actor : "HOROS Mission Runtime",
      mission: typeof record.mission === "string" ? record.mission : missionId,
      action: action ?? "Mission runtime log entry",
      evidence: typeof record.evidence === "string" ? record.evidence : missionId,
      status: typeof record.status === "string" ? record.status : "Verified",
      icon: Activity,
    };
  }

  return {
    id: `log-${index + 1}`,
    time: formatTime(null),
    worker: "HOROS Mission Runtime",
    mission: missionId,
    action: "Mission runtime log entry",
    evidence: missionId,
    status: "Verified",
    icon: Activity,
  };
}

function mapTimelineLog(entry: MissionTimelineEvent, index: number, missionId: string): MissionLogEntry {
  const stage = entry.stage ?? "Timeline event";
  const normalized = stage.toLowerCase();
  const icon = normalized.includes("verify")
    ? ShieldCheck
    : normalized.includes("evidence")
      ? FileText
      : normalized.includes("approval")
        ? Target
        : normalized.includes("run")
          ? Zap
          : Activity;

  return {
    id: entry.id ?? `timeline-${index + 1}`,
    time: formatTime(entry.timestamp),
    worker: "Mission Runtime",
    mission: missionId,
    action: entry.note ?? stage,
    evidence: entry.id ?? missionId,
    status: entry.status ?? "Verified",
    icon,
  };
}

export function EvidenceLogsView() {
  const { selection } = useMissionStore();
  const { missions, loading, error, getMission } = useMissionRuntimeData();
  const [mission, setMission] = useState<HorosMissionDetail | null>(null);
  const [missionLoading, setMissionLoading] = useState(false);
  const [missionError, setMissionError] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [query, setQuery] = useState("");

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
          setMissionError(err instanceof Error ? err.message : "Failed to load mission logs.");
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

  const logs = useMemo(() => {
    const executionLogs = Array.isArray(mission?.executionRun?.logs) ? mission.executionRun.logs : [];
    const timelineEvents = Array.isArray(mission?.timeline) ? mission.timeline : [];
    const missionId = mission?.id ?? selectedMissionId ?? "mission";
    return [
      ...executionLogs.map((entry, index) => mapExecutionLog(entry, index, missionId)),
      ...timelineEvents.map((entry, index) => mapTimelineLog(entry, index, missionId)),
    ];
  }, [mission, selectedMissionId]);

  const visibleLogs = useMemo(
    () =>
      logs.filter((log) =>
        `${log.id} ${log.worker} ${log.mission} ${log.action} ${log.evidence} ${log.status}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [logs, query],
  );

  return (
    <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-background text-foreground overflow-y-auto">
      <div className="flex flex-col w-full min-h-full bg-card overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-8 py-6 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-4">
            <div className="size-10 bg-foreground text-background flex items-center justify-center rounded-sm shrink-0">
              <Activity className="size-5" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[18px] font-bold leading-none tracking-tight">Structured Execution Logs</h1>
              <p className="text-[13px] text-muted-foreground mt-1">
                Live mission execution logs and timeline events loaded from the backend mission record.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-2 bg-muted text-foreground rounded-sm text-[12px] font-bold hover:bg-muted/80 transition-colors border border-border"
            onClick={() => {
              if (!selectedMissionId) return;
              setMissionLoading(true);
              void getMission(selectedMissionId)
                .then((detail) => setMission(detail))
                .catch((err) => setMissionError(err instanceof Error ? err.message : "Failed to refresh logs."))
                .finally(() => setMissionLoading(false));
            }}
          >
            <RefreshCw className="size-4" />
            Refresh
          </button>
        </div>

        <div className="flex items-center gap-4 px-8 py-3 bg-card border-b border-border shrink-0">
          <div className="flex items-center gap-2 flex-1 relative">
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs by action or evidence ID..."
              className="w-full bg-muted/30 border border-border rounded-sm pl-9 pr-4 py-1.5 text-[13px] text-foreground focus:outline-none focus:border-foreground/30 transition-colors placeholder:text-muted-foreground/70"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
              <span className="text-[10px] font-mono text-muted-foreground border border-border bg-card px-1.5 py-0.5 rounded-sm">⌘K</span>
            </div>

            {isSearchFocused && (
              <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-card border border-border rounded-sm shadow-md z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="px-4 py-2 border-b border-border/50 bg-muted/30">
                  <span className="text-[11px] font-bold text-muted-foreground">Search tips</span>
                </div>

                <div className="flex flex-col py-2">
                  <button className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 transition-colors w-full text-left group">
                    <div className="flex items-center gap-3">
                      <Building className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="text-[13px] font-medium text-foreground">
                        <span className="font-bold">inst:</span> - Search Institutions
                      </span>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <button className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 transition-colors w-full text-left group">
                    <div className="flex items-center gap-3">
                      <Rocket className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="text-[13px] font-medium text-foreground">
                        <span className="font-bold">mis:</span> - Search Missions
                      </span>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <button className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 transition-colors w-full text-left group">
                    <div className="flex items-center gap-3">
                      <FileText className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="text-[13px] font-medium text-foreground">
                        <span className="font-bold">evid:</span> - Search Evidence
                      </span>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <button className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 transition-colors w-full text-left group">
                    <div className="flex items-center gap-3">
                      <History className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="text-[13px] font-medium text-foreground">
                        <span className="font-bold">rec:</span> - Search Memory Records
                      </span>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <button className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 transition-colors w-full text-left group">
                    <div className="flex items-center gap-3">
                      <GovIcon className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="text-[13px] font-medium text-foreground">
                        <span className="font-bold">gov:</span> - Search Governance Policies
                      </span>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-border shrink-0" />

          <div className="flex items-center gap-2 shrink-0">
            <button className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-sm text-[12px] font-medium text-muted-foreground hover:bg-muted/50 transition-colors bg-card">
              <Filter className="size-3.5" /> Mission <ChevronDown className="size-3" />
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-sm text-[12px] font-medium text-muted-foreground hover:bg-muted/50 transition-colors bg-card">
              Worker <ChevronDown className="size-3" />
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-sm text-[12px] font-medium text-muted-foreground hover:bg-muted/50 transition-colors bg-card">
              Time <ChevronDown className="size-3" />
            </button>
          </div>
        </div>

        <div className="flex items-center px-8 py-3 bg-muted/30 border-b border-border shrink-0 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <div className="w-[120px]">Time</div>
          <div className="w-[140px]">Worker</div>
          <div className="w-[160px]">Mission</div>
          <div className="flex-[2]">Action</div>
          <div className="w-[160px]">Evidence ID</div>
          <div className="w-[100px] text-right">Status</div>
        </div>

        <div className="flex flex-col overflow-y-auto divide-y divide-border/50">
          {loading || missionLoading ? (
            <div className="p-8 text-[13px] text-muted-foreground">Loading live mission logs...</div>
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
          ) : visibleLogs.length === 0 ? (
            <div className="p-8 text-[13px] text-muted-foreground">No execution logs are available yet for the selected mission.</div>
          ) : (
            visibleLogs.map((log) => (
              <div key={log.id} className="flex items-center px-8 py-3 hover:bg-muted/30 transition-colors w-full group bg-card">
                <div className="w-[120px] shrink-0">
                  <span className="text-[12px] font-mono text-muted-foreground">{log.time}</span>
                </div>

                <div className="w-[140px] shrink-0">
                  <span className="text-[11px] font-mono text-foreground">{log.worker}</span>
                </div>

                <div className="w-[160px] shrink-0">
                  <span className="text-[11px] font-mono text-muted-foreground">{log.mission}</span>
                </div>

                <div className="flex-[2] flex items-center gap-3">
                  <log.icon className="size-3.5 text-muted-foreground" />
                  <span className="text-[13px] font-medium text-foreground tracking-tight">{log.action}</span>
                </div>

                <div className="w-[160px] shrink-0">
                  <span className="text-[11px] font-mono font-bold text-foreground bg-muted border border-border px-1.5 py-0.5 rounded-sm hover:text-blue-500 transition-colors cursor-pointer flex items-center w-fit gap-1.5">
                    {log.evidence} <ArrowRight className="size-3" />
                  </span>
                </div>

                <div className="w-[100px] shrink-0 text-right">
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      String(log.status).toLowerCase().includes("ver") ? "text-emerald-600 dark:text-emerald-500" : "text-muted-foreground",
                    )}
                  >
                    {log.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-center py-6 bg-card shrink-0 border-t border-border">
          <div className="text-[12px] font-medium text-muted-foreground">Live backend log view. Pagination is disabled until the log service exposes cursors.</div>
        </div>
      </div>
    </div>
  );
}
