"use client";

import { ScrollText, FileJson, Clock3, PlayCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { type DhyraMissionDetail } from "@/lib/dhyra-api";

function stringifyLogEntry(entry: unknown): string {
 if (typeof entry === "string") return entry;
 if (entry instanceof Error) return entry.message;
 if (entry && typeof entry === "object") {
 try {
 return JSON.stringify(entry, null, 2);
 } catch {
 return "[unserializable log entry]";
 }
 }
 return String(entry);
}

function formatTime(value?: string | null): string {
 if (!value) return "Unknown";
 const timestamp = new Date(value).getTime();
 if (!Number.isFinite(timestamp)) return "Unknown";
 return new Date(timestamp).toLocaleString();
}

export function MissionDetailLogs({ mission }: { mission: DhyraMissionDetail }) {
 const executionLogs = Array.isArray(mission.executionRun?.logs) ? mission.executionRun.logs : [];
 const timeline = Array.isArray(mission.timeline) ? mission.timeline : [];
 const latestTimeline = timeline[0] ?? null;
 const logCount = executionLogs.length;

 return (
 <div className="w-full flex flex-col pt-2 pb-16 gap-6 px-6">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <div className="rounded-md border border-border bg-card p-6 ">
 <div className="flex items-center gap-2 text-muted-foreground">
 <ScrollText className="size-4" />
 <span className="text-[13px] font-medium uppercase tracking-wider">Logs</span>
 </div>
 <div className="mt-3 text-[28px] font-semibold text-foreground">{logCount}</div>
 <div className="mt-1 text-[12px] text-muted-foreground">Execution log entries</div>
 </div>

 <div className="rounded-md border border-border bg-card p-6 ">
 <div className="flex items-center gap-2 text-muted-foreground">
 <CheckCircle2 className="size-4" />
 <span className="text-[13px] font-medium uppercase tracking-wider">Status</span>
 </div>
 <div className="mt-3 text-[28px] font-semibold text-foreground">{mission.state?.replace(/_/g, " ") ?? "draft"}</div>
 <div className="mt-1 text-[12px] text-muted-foreground">{mission.verificationRun?.finalDecision ?? "REVIEW"} decision</div>
 </div>

 <div className="rounded-md border border-border bg-card p-6 ">
 <div className="flex items-center gap-2 text-muted-foreground">
 <Clock3 className="size-4" />
 <span className="text-[13px] font-medium uppercase tracking-wider">Latest Event</span>
 </div>
 <div className="mt-3 text-[18px] font-semibold text-foreground">{latestTimeline?.stage ?? "—"}</div>
 <div className="mt-1 text-[12px] text-muted-foreground">{formatTime(latestTimeline?.timestamp)}</div>
 </div>

 <div className="rounded-md border border-border bg-card p-6 ">
 <div className="flex items-center gap-2 text-muted-foreground">
 <AlertTriangle className="size-4" />
 <span className="text-[13px] font-medium uppercase tracking-wider">Certificate</span>
 </div>
 <div className="mt-3 text-[18px] font-semibold text-foreground">{mission.certificate?.status ?? "Pending"}</div>
 <div className="mt-1 text-[12px] text-muted-foreground">{mission.certificate?.createdAt ? formatTime(mission.certificate.createdAt) : "Not issued yet"}</div>
 </div>
 </div>

 <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
 <div className="rounded-md border border-border bg-card overflow-hidden">
 <div className="flex items-center justify-between gap-6 border-b border-border bg-card px-6 py-6">
 <div>
 <h3 className="text-[16px] font-semibold text-foreground">Execution Stream</h3>
 <p className="text-[13px] text-muted-foreground">Live logs from planner, executor, reviewer, and human approval.</p>
 </div>
 <div className="text-[12px] text-muted-foreground">Run {mission.executionRun?.id ?? "pending"}</div>
 </div>

 <div className="divide-y divide-[#eee]">
 {executionLogs.length === 0 ? (
 <div className="px-6 py-8 text-[13px] text-muted-foreground">No execution logs have been recorded for this mission yet.</div>
 ) : (
 executionLogs.map((entry, index) => (
 <div key={index} className="px-6 py-6 flex items-start gap-3">
 <div className="mt-0.5 size-8 rounded-full border border-border bg-muted/50 flex items-center justify-center shrink-0">
 <FileJson className="size-4 text-[#0f52ff]" />
 </div>
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-2">
 <span className="text-[13px] font-semibold text-foreground">Log {index + 1}</span>
 <span className="text-[12px] text-muted-foreground">execution</span>
 </div>
 <pre className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-6 text-foreground/80 bg-muted/50 border border-border rounded-md p-3 overflow-x-auto">
 {stringifyLogEntry(entry)}
 </pre>
 </div>
 </div>
 ))
 )}
 </div>
 </div>

 <div className="rounded-md border border-border bg-card overflow-hidden">
 <div className="flex items-center justify-between gap-6 border-b border-border bg-card px-6 py-6">
 <div>
 <h3 className="text-[16px] font-semibold text-foreground">Mission Events</h3>
 <p className="text-[13px] text-muted-foreground">Lifecycle notes captured from the mission timeline.</p>
 </div>
 <div className="text-[12px] text-muted-foreground">{timeline.length} events</div>
 </div>

 <div className="divide-y divide-[#eee]">
 {timeline.length === 0 ? (
 <div className="px-6 py-8 text-[13px] text-muted-foreground">No mission timeline events recorded yet.</div>
 ) : (
 timeline.map((event, index) => (
 <div key={event.id ?? index} className="px-6 py-6 flex items-start gap-3">
 <div className="mt-0.5 size-8 rounded-full border border-border bg-muted/50 flex items-center justify-center shrink-0">
 <PlayCircle className="size-4 text-foreground" />
 </div>
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-2">
 <span className="text-[13px] font-semibold text-foreground">{event.stage ?? "event"}</span>
 <span className="text-[12px] text-muted-foreground">{event.status ?? "updated"}</span>
 </div>
 <div className="mt-1 text-[13px] text-muted-foreground">{event.note ?? "No note provided."}</div>
 <div className="mt-2 text-[12px] text-muted-foreground">{formatTime(event.timestamp)}</div>
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
