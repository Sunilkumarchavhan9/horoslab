"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, CircleDashed, CheckCircle2, Database, FileText, Play, ShieldAlert, ShieldCheck, Target, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemePreference } from "@/lib/continuity-lab/use-theme-preference";
import { useMissionStore } from "../../runtime/store";
import { useMissionRuntimeData } from "../../runtime/mission-runtime-data";
import type { EpochMissionDetail } from "@/lib/epoch-api";

type MissionTimelineEvent = {
  id?: string;
  stage?: string;
  status?: string;
  note?: string;
  timestamp?: string;
};

function pickMissionState(mission?: EpochMissionDetail | null): string {
  return (mission?.state ?? "draft").toLowerCase();
}

export function MissionExecutionView() {
  const { selection, setSelection } = useMissionStore();
  const { missions, getMission } = useMissionRuntimeData();
  const [mission, setMission] = useState<EpochMissionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { resolved } = useThemePreference();
  const isDark = resolved === "dark";

  const selectedMissionId = selection?.type === "mission" ? selection.id : missions[0]?.id ?? null;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const load = async () => {
      if (!selectedMissionId) {
        setMission(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const detail = await getMission(selectedMissionId);
        if (!cancelled) {
          setMission(detail);
          const isTerminal = detail?.state === "completed" || detail?.state === "failed";
          const learningReady = Boolean(detail?.memoryRecord);
          if (!isTerminal || !learningReady) {
            timer = setTimeout(() => void load(), 1500);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load mission execution data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [getMission, selectedMissionId]);

  const steps = useMemo(() => {
    const plan = mission?.executionRun?.planner as { plan?: unknown[] } | undefined;
    if (Array.isArray(plan?.plan) && plan.plan.length > 0) {
      return plan.plan.map((step, index) => ({ id: `${mission?.id ?? "mission"}-${index}`, label: typeof step === "string" ? step : `Step ${index + 1}` }));
    }

    return [
      { id: "step-1", label: "Planner assembled the mission plan" },
      { id: "step-2", label: "Executor began work" },
      { id: "step-3", label: "Verification is evaluating the result" },
    ];
  }, [mission]);

  const logs = useMemo(() => {
    const executionLogs = Array.isArray(mission?.executionRun?.logs) ? mission?.executionRun?.logs : [];
    return executionLogs.map((entry, index) => ({
      id: index,
      text: typeof entry === "string" ? entry : JSON.stringify(entry),
    }));
  }, [mission]);

  const timeline = (Array.isArray(mission?.timeline) ? mission.timeline : []) as MissionTimelineEvent[];

  return (
    <div className={cn("flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-background text-foreground", isDark ? "bg-[#0a0a0a]" : "bg-background")}>
      <div className={cn("flex flex-col shrink-0", isDark ? "bg-[#121212]" : "bg-card")}>
        <div className={cn("flex items-center justify-between px-8 py-5 border-b", isDark ? "border-white/10" : "border-border")}>
          <div className="flex items-center gap-4">
            <div className="size-10 bg-foreground text-background flex items-center justify-center rounded-sm shrink-0">
              <Activity className="size-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <span className="text-[18px] font-bold leading-none tracking-tight">{mission?.title ?? "Mission Execution"}</span>
                <span className="text-[11px] font-mono bg-muted px-2 py-0.5 rounded-sm text-muted-foreground">{mission?.id ?? "No mission selected"}</span>
              </div>
              <p className="text-[13px] text-muted-foreground mt-1">{mission?.objective ?? "Select a mission to view its live execution state."}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Execution Status</span>
              <div className="flex items-center gap-2">
                <div className={cn("size-2 rounded-full", pickMissionState(mission) === "running" ? "bg-blue-500 animate-pulse" : "bg-emerald-500")} />
                <span className={cn("text-[13px] font-bold uppercase tracking-wider", pickMissionState(mission) === "running" ? "text-blue-600 dark:text-blue-500" : "text-emerald-600 dark:text-emerald-500")}>
                  {pickMissionState(mission)}
                </span>
              </div>
            </div>
            <div className="w-[1px] h-8 bg-border" />
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Verification</span>
              <span className="text-[14px] font-mono font-medium">{mission?.verificationRun?.finalDecision ?? "Pending"}</span>
            </div>
            <div className="w-[1px] h-8 bg-border" />
            <button
              onClick={() => mission?.id && setSelection({ id: mission.id, type: "mission" })}
              className="flex items-center justify-center size-8 rounded-sm border border-border bg-card hover:bg-muted transition-colors text-muted-foreground hover:text-red-500"
              title="Re-select mission"
            >
              <Target className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex flex-col w-[320px] shrink-0 border-r border-border bg-muted/10">
          <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
            <Target className="size-4 text-muted-foreground" />
            <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Execution Flow</span>
          </div>
          <div className="flex flex-col p-4 overflow-y-auto">
            {loading ? (
              <div className="text-sm text-muted-foreground p-4">Loading live mission execution...</div>
            ) : error ? (
              <div className="text-sm text-red-500 p-4">{error}</div>
            ) : steps.map((step, index) => {
              const isActive = index === 1 && pickMissionState(mission) === "running";
              const isComplete = index === 0 || pickMissionState(mission) === "completed";
              return (
                <div key={step.id} className={cn("flex items-start gap-4 p-3 border rounded-md mb-4 relative z-10", isActive ? "border-blue-500/30 bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.1)]" : "border-border bg-card")}>
                  {isComplete ? <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> : isActive ? <CircleDashed className="size-4 text-blue-500 shrink-0 mt-0.5 animate-[spin_3s_linear_infinite]" /> : <div className="size-4 rounded-sm bg-muted-foreground/20 flex items-center justify-center shrink-0 mt-0.5"><span className="text-[10px] font-bold text-muted-foreground">{index + 1}</span></div>}
                  <div className="flex flex-col gap-1">
                    <span className="text-[13px] font-bold">{step.label}</span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {index === 0 ? "Planner" : index === 1 ? "Executor" : "Verifier"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col flex-1 min-w-0 border-r border-border bg-card">
          <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="size-4 text-muted-foreground" />
              <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Live Agent Activity</span>
            </div>
            <span className="text-[11px] font-mono bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded-sm">
              {pickMissionState(mission) === "running" ? "Running" : "Live"}
            </span>
          </div>

          <div className="flex-1 p-6 overflow-y-auto font-mono text-[13px] bg-black text-gray-300 flex flex-col gap-2">
            {logs.length === 0 ? (
              <div className="text-gray-500">No execution logs are available yet.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <span className="text-gray-600 shrink-0 select-none">{String(log.id).padStart(2, "0")}</span>
                  <span className="text-purple-400">[EXEC]</span>
                  <span>{log.text}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col w-[380px] shrink-0 bg-muted/10">
          <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
            <CheckCircle2 className="size-4 text-muted-foreground" />
            <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Verification & Impact</span>
          </div>

          <div className="flex flex-col p-6 gap-6 overflow-y-auto">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-foreground">
                <FileText className="size-4 text-muted-foreground" />
                Evidence Gathered
              </div>
              <div className="flex flex-col gap-2">
                {(mission?.evidence ?? []).length > 0 ? (
                  mission!.evidence!.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 border border-border rounded-md bg-card">
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1">
                        <span className="text-[13px] font-bold">{item.summary ?? item.kind ?? item.id}</span>
                        <span className="text-[11px] text-muted-foreground">Captured by the backend mission runner.</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[13px] text-muted-foreground">No evidence has been recorded yet.</div>
                )}
              </div>
            </div>

            <div className="w-full h-px bg-border" />

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-foreground">
                <ShieldCheck className="size-4 text-muted-foreground" />
                Policy Verification
              </div>
              <div className="flex flex-col gap-2">
                {(mission?.authorityPolicies ?? []).length > 0 ? (
                  mission!.authorityPolicies!.map((policy) => (
                    <div key={policy.id} className="flex items-center justify-between p-3 border border-border rounded-md bg-card">
                      <div className="flex items-center gap-2">
                        {policy.blocked ? <ShieldAlert className="size-4 text-red-500" /> : <CheckCircle2 className="size-4 text-emerald-500" />}
                        <span className="text-[13px] font-medium">{policy.name ?? "Mission Authority Policy"}</span>
                      </div>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider", policy.blocked ? "text-red-600 bg-red-500/10" : policy.needsApproval ? "text-blue-600 bg-blue-500/10" : "text-emerald-600 bg-emerald-500/10")}>
                        {policy.blocked ? "BLOCKED" : policy.needsApproval ? "REVIEW" : "PASSED"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-[13px] text-muted-foreground">No authority policies are attached to this mission.</div>
                )}
              </div>
            </div>

            <div className="w-full h-px bg-border" />

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-foreground">
                <Database className="size-4 text-muted-foreground" />
                Timeline
              </div>
              <div className="flex flex-col p-4 border border-border rounded-md bg-card gap-3">
                {(timeline.length > 0 ? timeline : [{ stage: "mission", note: "No timeline events yet." }]).map((item, index) => (
                  <div key={item.id ?? `timeline-${index}`} className="flex items-center gap-2 text-[12px]">
                    <span className="font-mono text-muted-foreground w-20">{item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}</span>
                    <span className="font-medium">{item.note ?? item.stage ?? "Event"}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full h-px bg-border" />

            <div className="flex items-center gap-3 p-3 border border-border rounded-md bg-card">
              <div className="size-8 rounded-md bg-purple-50 flex items-center justify-center">
                <Play className="size-4 text-purple-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-foreground">Mission Impact</span>
                <span className="text-[11px] text-blue-600 hover:underline cursor-pointer">Live state is driven by the backend mission record.</span>
              </div>
            </div>

            <div className="w-full h-px bg-border" />

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-foreground">
                <CheckCircle2 className="size-4 text-muted-foreground" />
                Settlement
              </div>
              <div className="flex flex-col gap-2">
                {mission?.certificate ? (
                  <div className="flex flex-col gap-2 p-3 border border-emerald-500/20 rounded-md bg-emerald-500/5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px] font-bold text-foreground">{mission.certificate.summary ?? "Settlement certificate issued"}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-sm">
                        {mission.certificate.status ?? "ISSUED"}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      Certificate {mission.certificate.id} · {mission.certificate.createdAt ? new Date(mission.certificate.createdAt).toLocaleString() : "Issued by backend"}
                    </span>
                  </div>
                ) : (
                  <div className="text-[13px] text-muted-foreground">No certificate has been issued yet.</div>
                )}
              </div>
            </div>

            <div className="w-full h-px bg-border" />

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-foreground">
                <FileText className="size-4 text-muted-foreground" />
                Learning Artifact
              </div>
              <div className="flex flex-col gap-2">
                {mission?.memoryRecord ? (
                  <div className="flex flex-col gap-2 p-3 border border-blue-500/20 rounded-md bg-blue-500/5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px] font-bold text-foreground">{mission.memoryRecord.summary ?? "Learning artifact recorded"}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-sm">
                        {mission.memoryRecord.status ?? "RECORDED"}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      Memory record {mission.memoryRecord.id} · {mission.memoryRecord.updatedAt ? new Date(mission.memoryRecord.updatedAt).toLocaleString() : "Stored by backend"}
                    </span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {(mission.memoryRecord.lessons ?? []).map((lesson) => (
                        <span key={lesson} className="text-[10px] font-medium bg-card border border-border px-2 py-0.5 rounded-sm">
                          {lesson}
                        </span>
                      ))}
                      {(mission.memoryRecord.suggestedImprovements ?? []).map((improvement) => (
                        <span key={improvement} className="text-[10px] font-medium bg-card border border-border px-2 py-0.5 rounded-sm">
                          {improvement}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-[13px] text-muted-foreground">No learning artifact has been recorded yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
