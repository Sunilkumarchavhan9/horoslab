"use client";

import React, { useEffect, useState } from "react";
import { 
    Search, Filter, Download, ChevronDown, RefreshCw, 
    Play, Activity, ShieldCheck, AlertTriangle, CheckCircle2,
    Clock, Cpu, Server, FileText, Zap, Globe, Plus, Bell, XCircle, RotateCcw, Box, ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useInspector } from "../universal-inspector";
import {
    getHorosAuditTrail,
    getHorosMissionControlSnapshot,
    listHorosWorkers,
    type HorosMissionControlSnapshot,
} from "@/lib/horos-api";

export function CommandCenterDashboard({ workspaceId, onCreateMission }: { workspaceId?: string | null; onCreateMission?: () => void }) {
    const { openInspector } = useInspector();
    const [snapshot, setSnapshot] = useState<HorosMissionControlSnapshot | null>(null);
    const [runningMissions, setRunningMissions] = useState<Array<Record<string, any>>>([]);
    const [workerFleet, setWorkerFleet] = useState<Array<Record<string, any>>>([]);
    const [liveActivity, setLiveActivity] = useState<Array<Record<string, any>>>([]);
    const [recentFailures, setRecentFailures] = useState<Array<Record<string, any>>>([]);
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
    const [refreshNonce, setRefreshNonce] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [rangeIndex, setRangeIndex] = useState(0);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [alertsOpen, setAlertsOpen] = useState(false);
    const ranges = [
        { value: "24h", label: "Last 24 hours" },
        { value: "7d", label: "Last 7 days" },
        { value: "30d", label: "Last 30 days" },
    ];

    useEffect(() => {
        if (!workspaceId) return;
        let cancelled = false;
        setIsRefreshing(true);
        const load = async () => {
            const [nextSnapshot, workers, audit] = await Promise.all([
                getHorosMissionControlSnapshot(workspaceId, { range: ranges[rangeIndex].value }),
                listHorosWorkers(workspaceId),
                getHorosAuditTrail(workspaceId),
            ]);
            if (cancelled) return;
            setLastUpdated(new Date());
            setIsRefreshing(false);
            setSnapshot(nextSnapshot);
            setRunningMissions((nextSnapshot.recent?.missions ?? []).map((mission) => ({
                mission: mission.id,
                objective: mission.objective ?? mission.title ?? "No objective",
                institution: (mission as any).institution?.name ?? "Unassigned",
                worker: (mission as any).worker?.name ?? "Runtime assigned",
                stage: mission.currentStep ?? mission.state ?? "Queued",
                progress: mission.state === "completed" ? 100 : mission.state === "running" ? 50 : 0,
                verification: mission.verificationRun?.finalDecision ?? "Pending",
                started: mission.startedAt ? new Date(mission.startedAt).toLocaleTimeString() : "-",
                duration: "-",
                priority: "Runtime",
            })));
            setWorkerFleet(workers.map((worker) => ({
                worker: String(worker.id ?? worker.name ?? "Worker"),
                status: String(worker.status ?? "Unknown"),
                assignments: Number(worker.assignments ?? 0),
                heartbeat: worker.lastHeartbeat ? new Date(String(worker.lastHeartbeat)).toLocaleString() : "-",
                latency: worker.latency == null ? "-" : `${worker.latency}ms`,
                reliability: `${Number(worker.reliability ?? 0).toFixed(1)}%`,
                version: String(worker.version ?? "-"),
                health: String(worker.health ?? worker.status ?? "Unknown"),
            })));
            const events = [...audit.runtimeEvents, ...audit.auditLogs, ...audit.deadLetters];
            setLiveActivity(events.slice(0, 8).map((event, index) => ({
                type: String(event.type ?? event.kind ?? "Runtime"),
                message: String(event.message ?? event.description ?? event.label ?? "Runtime event"),
                time: event.createdAt ? new Date(String(event.createdAt)).toLocaleString() : "-",
                color: "text-blue-500",
                bg: "bg-blue-500/10",
                key: String(event.id ?? index),
            })));
            setRecentFailures(audit.deadLetters.slice(0, 8).map((failure, index) => ({
                mission: String(failure.missionId ?? "-"),
                failure: String(failure.type ?? failure.error ?? "Dead letter"),
                worker: String(failure.workerId ?? "-"),
                rootCause: String(failure.message ?? failure.description ?? "Unresolved"),
                recovery: String(failure.status ?? "Review required"),
                occurred: failure.createdAt ? new Date(String(failure.createdAt)).toLocaleString() : "-",
                key: String(failure.id ?? index),
            })));
        };
        void load().catch(() => { if (!cancelled) setIsRefreshing(false); });
        const interval = autoRefreshEnabled
            ? window.setInterval(() => void load().catch(() => { if (!cancelled) setIsRefreshing(false); }), 5000)
            : undefined;
        return () => {
            cancelled = true;
            if (interval) window.clearInterval(interval);
        };
    }, [workspaceId, autoRefreshEnabled, refreshNonce, rangeIndex]);

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* TOOLBAR */}
            <div className="relative z-30 flex flex-col shrink-0 border-b border-border bg-card">
                <div className="flex items-center justify-between px-6 py-3">
                    <div></div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setRangeIndex((current) => (current + 1) % ranges.length)}
                            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                            title="Change the backend snapshot range"
                        >
                            <Clock className="size-3.5" /> {ranges[rangeIndex].label}
                        </button>
                        <button
                            onClick={() => setAutoRefreshEnabled((enabled) => !enabled)}
                            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                            title="Toggle live polling"
                        >
                            <RefreshCw className={cn("size-3.5", autoRefreshEnabled && "animate-spin")} /> Auto Refresh: {autoRefreshEnabled ? "On" : "Off"}
                        </button>
                        <button
                            onClick={() => setRefreshNonce((value) => value + 1)}
                            className="p-1.5 rounded-none hover:bg-muted text-muted-foreground transition-colors"
                            title={lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString()}` : "Refresh now"}
                        >
                            <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
                        </button>
                        <button onClick={() => setAlertsOpen((open) => !open)} className="p-1.5 rounded-none hover:bg-muted text-muted-foreground transition-colors relative" title="View live runtime alerts">
                            <Bell className="size-4" />
                            {recentFailures.length > 0 ? <span className="absolute top-1 right-1 size-1.5 bg-red-500 rounded-full ring-2 ring-card"></span> : null}
                            {alertsOpen ? (
                                <div className="absolute right-0 top-9 z-50 w-80 border border-border bg-card p-3 text-left shadow-xl">
                                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-foreground">
                                        <span>Live alerts</span>
                                        <span className="text-muted-foreground">{recentFailures.length}</span>
                                    </div>
                                    {recentFailures.length === 0 ? (
                                        <div className="py-3 text-xs text-muted-foreground">No active runtime alerts.</div>
                                    ) : recentFailures.slice(0, 5).map((failure) => (
                                        <div key={failure.key} className="border-t border-border py-2 text-xs">
                                            <div className="font-semibold text-red-500">{failure.failure}</div>
                                            <div className="text-muted-foreground">{failure.mission} · {failure.occurred}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </button>
                        <div className="h-4 w-px bg-border"></div>
                        <button onClick={onCreateMission} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-none bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
                            <Plus className="size-3.5" />
                            Create Mission
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-background/50 p-0 flex flex-col gap-1">
                
                {/* MISSION OVERVIEW (KPI CARDS) */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1 mb-1 px-1 pt-1">
                    <div className="flex flex-col gap-1 p-3 bg-card border border-border rounded-sm">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Mission KPIs</span>
                        <div className="flex items-center gap-2 mt-1">
                            <Zap className="size-4 text-blue-500" />
                            <span className="text-lg font-bold">{snapshot?.overview.missions ?? 0}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 p-3 bg-card border border-border rounded-sm">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Mission Queue</span>
                        <div className="flex items-center gap-2 mt-1">
                            <Box className="size-4 text-orange-500" />
                            <span className="text-lg font-bold">{snapshot?.queue.status.queued ?? 0}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 p-3 bg-card border border-border rounded-sm">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Executions</span>
                        <div className="flex items-center gap-2 mt-1">
                            <Play className="size-4 text-emerald-500" />
                            <span className="text-lg font-bold">{snapshot?.queue.status.leased ?? 0}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 p-3 bg-card border border-border rounded-sm">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Worker Fleet</span>
                        <div className="flex items-center gap-2 mt-1">
                            <Cpu className="size-4 text-purple-500" />
                            <span className="text-lg font-bold">{workerFleet.filter((worker) => /active|running|idle/i.test(String(worker.status))).length}/{workerFleet.length}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 p-3 bg-card border border-border rounded-sm">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Verify Queue</span>
                        <div className="flex items-center gap-2 mt-1">
                            <ShieldCheck className="size-4 text-blue-400" />
                            <span className="text-lg font-bold">{snapshot?.overview.verifications ?? 0}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 p-3 bg-card border border-border rounded-sm">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Evidence</span>
                        <div className="flex items-center gap-2 mt-1">
                            <FileText className="size-4 text-slate-400" />
                            <span className="text-lg font-bold">{snapshot?.overview.evidence ?? 0}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 p-3 bg-card border border-border rounded-sm bg-yellow-500/5 border-yellow-500/20">
                        <span className="text-[10px] uppercase font-bold text-yellow-600 dark:text-yellow-500">Approvals</span>
                        <div className="flex items-center gap-2 mt-1">
                            <AlertTriangle className="size-4 text-yellow-600 dark:text-yellow-500" />
                            <span className="text-lg font-bold text-yellow-600 dark:text-yellow-500">{snapshot?.overview.verifications ?? 0}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 p-3 bg-card border border-border rounded-sm">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Runtime Health</span>
                        <div className="flex items-center gap-2 mt-1">
                            <Activity className="size-4 text-emerald-500" />
                            <span className="text-lg font-bold text-emerald-500">{workerFleet.length > 0 ? "Live" : "-"}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 p-3 bg-red-500/5 border border-red-500/20 rounded-sm">
                        <span className="text-[10px] uppercase font-bold text-red-500">Critical Alerts</span>
                        <div className="flex items-center gap-2 mt-1">
                            <XCircle className="size-4 text-red-500" />
                            <span className="text-lg font-bold text-red-500">{snapshot?.queue.status.failed ?? 0}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 p-3 bg-card border border-border rounded-sm">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">System Status</span>
                        <div className="flex items-center gap-2 mt-1">
                            <Server className="size-4 text-emerald-500" />
                            <span className="text-sm font-bold text-emerald-500">Online</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 p-3 bg-card border border-border rounded-sm">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Dead Letters</span>
                        <div className="flex items-center gap-2 mt-1">
                            <Box className="size-4 text-muted-foreground" />
                            <span className="text-lg font-bold text-muted-foreground">{snapshot?.queue.status.deadLettered ?? 0}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 p-3 bg-card border border-border rounded-sm">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Active Load</span>
                        <div className="flex items-center gap-2 mt-1">
                            <Activity className="size-4 text-blue-500" />
                            <span className="text-sm font-bold text-blue-500">Moderate</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-1 flex-1">
                    {/* LEFT COLUMN: Main Tables */}
                    <div className="lg:col-span-2 flex flex-col gap-1 h-full">
                        
                        {/* RUNNING MISSIONS */}
                        <div className="flex flex-col bg-card border-t border-b border-r border-border rounded-none shadow-sm overflow-hidden flex-1">
                            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/10">
                                <h2 className="text-sm font-bold flex items-center gap-2">
                                    <Play className="size-4 text-blue-500" /> Running Missions
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead className="bg-muted/30">
                                        <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/50">
                                            <th className="px-4 py-2 font-semibold">Mission & Objective</th>
                                            <th className="px-4 py-2 font-semibold">Institution</th>
                                            <th className="px-4 py-2 font-semibold">Worker</th>
                                            <th className="px-4 py-2 font-semibold">Stage</th>
                                            <th className="px-4 py-2 font-semibold w-24">Progress</th>
                                            <th className="px-4 py-2 font-semibold">Verification</th>
                                            <th className="px-4 py-2 font-semibold">Started</th>
                                            <th className="px-4 py-2 font-semibold">Duration</th>
                                            <th className="px-4 py-2 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {runningMissions.map((m, i) => (
                                            <tr key={i} onClick={() => openInspector("mission", { ...m, workspaceId })} className="hover:bg-muted/30 transition-colors cursor-pointer">
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold font-mono">{m.mission}</span>
                                                        <span className="text-[11px] text-muted-foreground">{m.objective}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-[11px] font-mono">{m.institution}</td>
                                                <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{m.worker}</td>
                                                <td className="px-4 py-3 text-[11px] uppercase font-bold text-blue-500">{m.stage}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col gap-1 w-full">
                                                        <div className="flex justify-end text-[9px] font-bold text-muted-foreground">
                                                            <span>{m.progress}%</span>
                                                        </div>
                                                        <Progress value={m.progress} className="h-1 rounded-none" />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-[11px] text-muted-foreground">{m.verification}</td>
                                                <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{m.started}</td>
                                                <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{m.duration}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <button onClick={() => openInspector("mission", { ...m, workspaceId })} className="text-[10px] uppercase font-bold text-blue-500 hover:underline">Open</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* WORKER FLEET */}
                        <div className="flex flex-col bg-card border-t border-b border-r border-border rounded-none shadow-sm overflow-hidden flex-1">
                            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/10">
                                <h2 className="text-sm font-bold flex items-center gap-2">
                                    <Cpu className="size-4 text-purple-500" /> Worker Fleet
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead className="bg-muted/30">
                                        <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/50">
                                            <th className="px-4 py-2 font-semibold">Worker</th>
                                            <th className="px-4 py-2 font-semibold">Status</th>
                                            <th className="px-4 py-2 font-semibold">Health</th>
                                            <th className="px-4 py-2 font-semibold">Assignments</th>
                                            <th className="px-4 py-2 font-semibold">Heartbeat</th>
                                            <th className="px-4 py-2 font-semibold">Latency</th>
                                            <th className="px-4 py-2 font-semibold">Reliability</th>
                                            <th className="px-4 py-2 font-semibold">Runtime Ver</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {workerFleet.map((w, i) => (
                                            <tr key={i} onClick={() => openInspector("worker", { ...w, workspaceId })} className="hover:bg-muted/30 transition-colors cursor-pointer">
                                                <td className="px-4 py-3 font-bold font-mono text-foreground">{w.worker}</td>
                                                <td className="px-4 py-3">
                                                    <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded-none", w.status === "Active" ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500")}>{w.status}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={cn("text-[11px] font-semibold flex items-center gap-1.5", w.health === "Healthy" ? "text-emerald-500" : "text-orange-500")}>
                                                        {w.health === "Healthy" ? <CheckCircle2 className="size-3" /> : <AlertTriangle className="size-3" />}
                                                        {w.health}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-[11px]">{w.assignments}</td>
                                                <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{w.heartbeat}</td>
                                                <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{w.latency}</td>
                                                <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{w.reliability}</td>
                                                <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{w.version}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Feeds & Actions */}
                    <div className="flex flex-col gap-1 h-full">
                        
                        {/* QUICK ACTIONS */}
                        <div className="flex flex-col bg-card border-t border-b border-l border-border rounded-none shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-border/50 bg-muted/10">
                                <h2 className="text-sm font-bold flex items-center gap-2">
                                    <Zap className="size-4 text-yellow-500" /> Quick Actions
                                </h2>
                            </div>
                            <div className="p-4 grid grid-cols-2 gap-2">
                                <button onClick={onCreateMission} className="flex items-center gap-2 p-2 rounded-none border border-border hover:bg-muted transition-colors text-xs font-semibold text-foreground">
                                    <Plus className="size-3.5 text-blue-500" /> Create Mission
                                </button>
                            </div>
                        </div>

                        {/* RECENT FAILURES */}
                        <div className="flex flex-col bg-card border-t border-b border-l border-border rounded-none shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-red-500/5">
                                <h2 className="text-sm font-bold flex items-center gap-2 text-red-500">
                                    <ShieldAlert className="size-4" /> Recent Failures
                                </h2>
                            </div>
                            <div className="flex flex-col divide-y divide-border/50">
                                {recentFailures.map((f, i) => (
                                    <div key={i} className="p-3 flex flex-col gap-2 hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold font-mono text-sm text-foreground">{f.mission}</span>
                                            <span className="text-[10px] text-muted-foreground">{f.occurred}</span>
                                        </div>
                                        <span className="text-xs text-red-500 font-semibold">{f.failure}</span>
                                        <div className="flex flex-col gap-1 text-[11px] text-muted-foreground mt-1">
                                            <span><span className="font-semibold text-foreground/70">Root Cause:</span> {f.rootCause}</span>
                                            <span><span className="font-semibold text-foreground/70">Worker:</span> {f.worker}</span>
                                            <span><span className="font-semibold text-foreground/70">Recovery:</span> {f.recovery}</span>
                                        </div>
                                        <div className="mt-1 flex justify-end">
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* LIVE ACTIVITY */}
                        <div className="flex flex-col bg-card border-t border-b border-l border-border rounded-none shadow-sm overflow-hidden flex-1">
                            <div className="p-4 border-b border-border/50 bg-muted/10">
                                <h2 className="text-sm font-bold flex items-center gap-2">
                                    <Activity className="size-4 text-blue-500" /> Live Activity Feed
                                </h2>
                            </div>
                            <div className="p-4 flex flex-col gap-4 relative before:absolute before:inset-y-4 before:left-[19px] before:w-px before:bg-border/50 overflow-y-auto max-h-[300px] custom-scrollbar">
                                {liveActivity.map((a, i) => (
                                    <div key={i} className="flex gap-3 relative z-10 items-start">
                                        <div className={cn("size-2.5 rounded-full mt-1 shrink-0 ring-4 ring-card", a.color.replace("text-", "bg-"))} />
                                        <div className="flex flex-col gap-1 w-full min-w-0 bg-muted/30 p-2 rounded-none border border-border/50">
                                            <div className="flex items-center justify-between w-full">
                                                <span className={cn("font-bold text-[10px] uppercase tracking-wider", a.color)}>{a.type}</span>
                                                <span className="text-[10px] font-mono text-muted-foreground">{a.time}</span>
                                            </div>
                                            <span className="text-xs text-foreground leading-relaxed">{a.message}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
