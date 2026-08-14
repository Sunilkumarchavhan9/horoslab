"use client";

import { Activity, CheckCircle2, Clock, Play, ShieldCheck, Workflow } from "lucide-react";
import { type EpochInstitutionDetail } from "@/lib/epoch-api";

function formatRuntime(startedAt?: string | null, finishedAt?: string | null): string {
 if (!startedAt) return "—";
 const start = new Date(startedAt).getTime();
 if (!Number.isFinite(start)) return "—";
 const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
 if (!Number.isFinite(end) || end < start) return "—";
 const totalSeconds = Math.max(0, Math.round((end - start) / 1000));
 if (totalSeconds < 60) return `${totalSeconds}s`;
 const minutes = Math.floor(totalSeconds / 60);
 const seconds = totalSeconds % 60;
 if (minutes < 60) return `${minutes}m ${seconds}s`;
 const hours = Math.floor(minutes / 60);
 const remainingMinutes = minutes % 60;
 return `${hours}h ${remainingMinutes}m`;
}

function readState(missionState?: string | null): string {
 return (missionState ?? "draft").replace(/_/g, " ");
}

function getHealthLabel(institution: EpochInstitutionDetail): string {
 const latestMission = institution.missions?.[0] ?? null;
 const status = (institution.status ?? institution.currentState ?? "").toLowerCase();
 const latestDecision = latestMission?.verificationRun?.finalDecision?.toUpperCase?.() ?? "";
 const latestMissionState = (latestMission?.state ?? "").toLowerCase();

 if (status === "archived" || latestMissionState === "failed" || latestDecision === "FAIL") {
 return "Attention";
 }
 if (latestMissionState === "waiting_review" || latestDecision === "REVIEW") {
 return "Needs Review";
 }
 if (latestMissionState === "running") {
 return "Running";
 }
 return "Healthy";
}

function getHealthTone(health: string) {
 switch (health) {
 case "Healthy":
 case "Running":
 return "text-emerald-700 bg-emerald-50 border-emerald-200";
 case "Needs Review":
 return "text-amber-700 bg-amber-50 border-amber-200";
 case "Attention":
 return "text-red-700 bg-red-50 border-red-200";
 default:
 return "text-slate-700 bg-slate-50 border-slate-200";
 }
}

export function InstitutionDetailOverview({
 institution,
 onLaunchMission,
 launching = false,
}: {
 institution: EpochInstitutionDetail;
 onLaunchMission?: () => void;
 launching?: boolean;
}) {
 const missions = institution.missions ?? [];
 const activeMissions = missions.filter((mission) => {
 const state = (mission.state ?? "").toLowerCase();
 return state === "running" || state === "waiting_review";
 });
 const completedMissions = missions.filter((mission) => (mission.state ?? "").toLowerCase() === "completed");
 const pendingMissions = missions.filter((mission) => (mission.state ?? "").toLowerCase() === "waiting_review");
 const successCount = missions.filter((mission) => mission.verificationRun?.finalDecision === "PASS").length;
 const successRate = missions.length > 0 ? Math.round((successCount / missions.length) * 100) : null;

 const completedDurations = completedMissions
 .map((mission) => formatRuntime(mission.executionRun?.startedAt, mission.executionRun?.finishedAt))
 .filter((value) => value !== "—");
 const averageRuntime = completedDurations.length > 0 ? completedDurations[0] : "—";

 const healthLabel = getHealthLabel(institution);
 const templateName = institution.template?.name ?? "No template";
 const configPieces = [
 institution.category ?? "general",
 institution.version ?? "1.0.0",
 `Policies ${institution.authorityPolicies?.length ?? 0}`,
 `Integrations ${institution.integrations?.length ?? 0}`,
 `Members ${institution.memberCount ?? 0}`,
 ];

 return (
 <div className="w-full flex flex-col gap-6 pb-12">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <div className="rounded-md border border-border bg-card p-6 ">
 <div className="flex items-center gap-2 text-muted-foreground">
 <Activity className="size-4" />
 <span className="text-[13px] font-medium uppercase tracking-wider">Type</span>
 </div>
 <div className="mt-3 text-[28px] font-semibold text-foreground">{institution.category ?? "general"}</div>
 <div className="mt-1 text-[12px] text-muted-foreground">{templateName}</div>
 </div>

 <div className="rounded-md border border-border bg-card p-6 ">
 <div className="flex items-center gap-2 text-muted-foreground">
 <ShieldCheck className="size-4" />
 <span className="text-[13px] font-medium uppercase tracking-wider">Health</span>
 </div>
 <div className={`mt-3 inline-flex items-center rounded-full border px-3 py-1 text-[13px] font-semibold ${getHealthTone(healthLabel)}`}>
 {healthLabel}
 </div>
 <div className="mt-3 text-[12px] text-muted-foreground">Live from institution and mission state.</div>
 </div>

 <div className="rounded-md border border-border bg-card p-6 ">
 <div className="flex items-center gap-2 text-muted-foreground">
 <Workflow className="size-4" />
 <span className="text-[13px] font-medium uppercase tracking-wider">Running</span>
 </div>
 <div className="mt-3 text-[28px] font-semibold text-foreground">{activeMissions.length}</div>
 <div className="mt-1 text-[12px] text-green-600 font-medium">Active right now</div>
 </div>

 <div className="rounded-md border border-border bg-card p-6 ">
 <div className="flex items-center gap-2 text-muted-foreground">
 <Play className="size-4" />
 <span className="text-[13px] font-medium uppercase tracking-wider">Completed</span>
 </div>
 <div className="mt-3 text-[28px] font-semibold text-foreground">{completedMissions.length}</div>
 <div className="mt-1 text-[12px] text-muted-foreground">
 {successRate !== null ? `${successRate}% success rate` : "No completed missions yet"}
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
 <div className="rounded-md border border-border bg-card overflow-hidden">
 <div className="flex items-center justify-between gap-6 border-b border-border bg-card px-6 py-6">
 <div>
 <h3 className="text-[16px] font-semibold text-foreground">Mission Queue</h3>
 <p className="text-[13px] text-muted-foreground">
 {missions.length} live missions, {pendingMissions.length} pending review
 </p>
 </div>
 <div className="text-[12px] text-muted-foreground">
 Avg runtime {averageRuntime}
 </div>
 </div>

 <div className="divide-y divide-[#eee]">
 {missions.length === 0 ? (
 <div className="px-6 py-8 text-[13px] text-muted-foreground">No missions have been created for this institution yet.</div>
 ) : (
 missions.map((mission) => {
 const decision = mission.verificationRun?.finalDecision ?? "REVIEW";
 const runtime = formatRuntime(mission.executionRun?.startedAt, mission.executionRun?.finishedAt);
 return (
 <div key={mission.id} className="px-6 py-6 flex items-start justify-between gap-6 hover:bg-muted/50">
 <div className="min-w-0">
 <div className="flex items-center gap-2">
 <Play className="size-4 text-[#0f52ff]" />
 <div className="min-w-0">
 <div className="truncate text-[14px] font-semibold text-foreground">{mission.title ?? "Untitled mission"}</div>
 <div className="mt-0.5 truncate text-[13px] text-muted-foreground">{mission.objective ?? "No objective provided."}</div>
 </div>
 </div>
 </div>
 <div className="shrink-0 text-right">
 <div className="text-[12px] text-muted-foreground">{readState(mission.state)}</div>
 <div className="mt-1 flex items-center justify-end gap-2 text-[12px] text-muted-foreground">
 <span className="inline-flex items-center gap-1 rounded border border-border bg-muted/50 px-2 py-0.5">
 <Clock className="size-3.5" />
 {runtime}
 </span>
 <span className="inline-flex items-center gap-1 rounded border border-border bg-muted/50 px-2 py-0.5">
 <CheckCircle2 className="size-3.5" />
 {decision}
 </span>
 </div>
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>

 <div className="flex flex-col gap-6">
 <div className="rounded-md border border-border bg-card p-6 ">
 <h3 className="text-[16px] font-semibold text-foreground">Configuration</h3>
 <p className="mt-1 text-[13px] text-muted-foreground">What this institution is configured to do.</p>
 <div className="mt-4 flex flex-wrap gap-2">
 {configPieces.map((piece) => (
 <span key={piece} className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-[12px] font-medium text-foreground/90">
 {piece}
 </span>
 ))}
 </div>
 </div>

 <div className="rounded-md border border-border bg-card p-6 flex flex-col gap-3">
 <button
 className="btn-glossy-blue h-10 w-full gap-2 text-[13.5px] font-medium disabled:opacity-60 disabled:cursor-not-allowed"
 onClick={onLaunchMission}
 disabled={!onLaunchMission || launching}
 >
 <Play className="size-4" />
 {launching ? "Launching..." : "Launch Mission"}
 </button>
 <div className="text-center text-[12px] text-muted-foreground">
 Trigger a new run in this institution.
 </div>
 <div className="grid grid-cols-2 gap-3 pt-2">
 <div className="rounded-md border border-border bg-muted/50 p-3">
 <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Policies</div>
 <div className="mt-1 text-[14px] font-semibold text-foreground">{institution.authorityPolicies?.length ?? 0}</div>
 </div>
 <div className="rounded-md border border-border bg-muted/50 p-3">
 <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Members</div>
 <div className="mt-1 text-[14px] font-semibold text-foreground">{institution.memberCount ?? 0}</div>
 </div>
 <div className="rounded-md border border-border bg-muted/50 p-3">
 <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Integrations</div>
 <div className="mt-1 text-[14px] font-semibold text-foreground">{institution.integrations?.length ?? 0}</div>
 </div>
 <div className="rounded-md border border-border bg-muted/50 p-3">
 <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Template</div>
 <div className="mt-1 truncate text-[14px] font-semibold text-foreground">{institution.template?.name ?? "None"}</div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
