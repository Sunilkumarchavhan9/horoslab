"use client";

import React, { useEffect, useState } from "react";
import { 
    Search, Filter, Download, ChevronDown, ChevronLeft, ChevronRight,
    Play, Pause, RefreshCw, XCircle, Clock, Server, CheckCircle2,
    ListTree, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "../universal-inspector";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { listHorosExecutions, type HorosExecutionRun } from "@/lib/horos-api";
import { exportLiveRows } from "../export-live-rows";
import { LiveFilterDropdown } from "../ui/live-filter-dropdown";

type ExecutionRow = {
    id: string;
    mission: string;
    worker: string;
    plannerState: "Planning" | "Idle" | "Complete";
    executorState: "Running" | "Idle" | "Error" | "Waiting";
    reviewerState: "Reviewing" | "Idle" | "Approved" | "Rejected";
    queuePosition: number | null;
    status: "Running" | "Queued" | "Failed" | "Completed" | "Paused";
    progress: number;
    started: string;
    duration: string;
    retries: number;
    timeoutEvents: number;
    cancellations: number;
    updated: string;
    priority: "High" | "Medium" | "Low";
    institution: string;
};

function ExecutionFilterDropdown({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
    return <LiveFilterDropdown label={label} value={value} options={options} onChange={onChange} />;
}

const MOCK_EXECUTIONS: ExecutionRow[] = [
    { id: "EX-4412", mission: "MSN-8991: Payment Gateway", worker: "WRK-9004", institution: "INST-CORE", plannerState: "Complete", executorState: "Running", reviewerState: "Idle", status: "Running", progress: 45, queuePosition: null, started: "10:15:22", duration: "00:14:32", retries: 0, timeoutEvents: 0, cancellations: 0, updated: "Just now", priority: "High" },
    { id: "EX-4413", mission: "MSN-8984: Quarterly Report", worker: "WRK-9001", institution: "INST-FINANCE", plannerState: "Complete", executorState: "Error", reviewerState: "Idle", status: "Failed", progress: 95, queuePosition: null, started: "10:20:00", duration: "00:05:41", retries: 2, timeoutEvents: 1, cancellations: 0, updated: "5m ago", priority: "Medium" },
    { id: "EX-4414", mission: "MSN-8995: Sync CRM Users", worker: "Unassigned", institution: "INST-SALES", plannerState: "Complete", executorState: "Waiting", reviewerState: "Idle", status: "Queued", progress: 0, queuePosition: 1, started: "--", duration: "--", retries: 0, timeoutEvents: 0, cancellations: 0, updated: "15m ago", priority: "Low" },
    { id: "EX-4415", mission: "MSN-8996: Audit Logs Archive", worker: "WRK-9002", institution: "INST-SEC", plannerState: "Complete", executorState: "Idle", reviewerState: "Reviewing", status: "Running", progress: 99, queuePosition: null, started: "09:00:11", duration: "01:45:00", retries: 1, timeoutEvents: 0, cancellations: 0, updated: "1h ago", priority: "High" },
    { id: "EX-4416", mission: "MSN-8997: Update DNS", worker: "System", institution: "INST-OPS", plannerState: "Complete", executorState: "Idle", reviewerState: "Approved", status: "Completed", progress: 100, queuePosition: null, started: "08:15:00", duration: "00:02:14", retries: 0, timeoutEvents: 0, cancellations: 0, updated: "2h ago", priority: "High" },
];

function StatusBadge({ status }: { status: ExecutionRow["status"] }) {
    switch (status) {
        case "Running": return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-wider"><Play className="size-3" /> Running</span>;
        case "Queued": return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 text-orange-500 border border-orange-500/20 uppercase tracking-wider"><ListTree className="size-3" /> Queued</span>;
        case "Completed": return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-wider"><CheckCircle2 className="size-3" /> Completed</span>;
        case "Failed": return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-500 border border-red-500/20 uppercase tracking-wider"><XCircle className="size-3" /> Failed</span>;
        case "Paused": return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border uppercase tracking-wider"><Pause className="size-3" /> Paused</span>;
    }
}

function toExecutionRow(execution: HorosExecutionRun): ExecutionRow {
    const raw = execution as HorosExecutionRun & Record<string, unknown>;
    const status = execution.status?.toLowerCase();
    const normalizedStatus: ExecutionRow["status"] = status === "completed" || status === "done" ? "Completed" : status === "failed" ? "Failed" : status === "queued" ? "Queued" : status === "paused" ? "Paused" : "Running";
    return {
        id: execution.id,
        mission: execution.missionTitle || execution.missionId || "Mission execution",
        worker: typeof execution.executor?.workerId === "string" ? execution.executor.workerId : "Runtime assigned",
        institution: execution.institutionId || "-",
        plannerState: execution.planner ? "Complete" : "Idle",
        executorState: normalizedStatus === "Failed" ? "Error" : normalizedStatus === "Queued" ? "Waiting" : normalizedStatus === "Completed" ? "Idle" : "Running",
        reviewerState: execution.reviewer ? "Reviewing" : "Idle",
        status: normalizedStatus,
        progress: Number(raw.progress ?? (normalizedStatus === "Completed" ? 100 : normalizedStatus === "Failed" ? 0 : 0)),
        queuePosition: raw.queuePosition == null ? null : Number(raw.queuePosition),
        started: execution.startedAt ? new Date(execution.startedAt).toLocaleTimeString() : "--",
        duration: execution.finishedAt ? "Completed" : "-",
        retries: Number(raw.retryCount ?? raw.retries ?? 0),
        timeoutEvents: Number(raw.timeoutEvents ?? 0),
        cancellations: Number(raw.cancellationCount ?? raw.cancellations ?? 0),
        updated: execution.finishedAt ? new Date(execution.finishedAt).toLocaleString() : "Live",
        priority: String(raw.priority || "Medium").toLowerCase() === "high" ? "High" : String(raw.priority || "Medium").toLowerCase() === "low" ? "Low" : "Medium",
    };
}

export function OperationsExecutions({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [executions, setExecutions] = useState<ExecutionRow[]>([]);
    const [filters, setFilters] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!workspaceId) {
            setExecutions([]);
            return;
        }
        let cancelled = false;
        const load = async () => {
            try {
                const items = await listHorosExecutions(workspaceId);
                if (!cancelled) setExecutions(items.map(toExecutionRow));
            } catch {
                if (!cancelled) setExecutions([]);
            }
        };
        void load();
        const interval = window.setInterval(() => void load(), 5000);
        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [workspaceId]);

    const toggleRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRows(newSet);
    };

    const toggleAll = () => {
        if (selectedRows.size === visibleExecutions.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(visibleExecutions.map(m => m.id)));
    };

    const visibleExecutions = executions.filter((execution) => {
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch = !query || [execution.id, execution.mission, execution.worker, execution.institution].some((value) => value.toLowerCase().includes(query));
        const matches = (key: string, value: string) => !filters[key] || filters[key] === "All" || value === filters[key];
        return matchesSearch && matches("Mission", execution.mission) && matches("Worker", execution.worker) && matches("Institution", execution.institution) && matches("State", execution.status) && matches("Planner", execution.plannerState) && matches("Executor", execution.executorState) && matches("Reviewer", execution.reviewerState) && matches("Queue", execution.queuePosition == null ? "Not queued" : "Queued") && matches("Priority", execution.priority);
    });

    const setFilter = (key: string, value: string) => setFilters((current) => ({ ...current, [key]: value }));
    const filterOptions = (key: keyof ExecutionRow, extra: string[] = []) => ["All", ...extra, ...Array.from(new Set(executions.map((execution) => String(execution[key]))))];

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 border-b border-border bg-card">
                <div className="flex items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Mission Executions</h1>
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => exportLiveRows("horos-executions.json", visibleExecutions)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-sm">
                            <Download className="size-3.5" />
                            Export
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between px-6 py-3 bg-muted/20 border-t border-border overflow-visible">
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="relative w-48 shrink-0">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-8 pl-9 pr-3 text-xs bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/70 text-foreground"
                            />
                        </div>
                        
                        <ExecutionFilterDropdown label="Mission" value={filters.Mission ?? "All"} options={filterOptions("mission")} onChange={(value) => setFilter("Mission", value)} />
                        <ExecutionFilterDropdown label="Worker" value={filters.Worker ?? "All"} options={filterOptions("worker")} onChange={(value) => setFilter("Worker", value)} />
                        <ExecutionFilterDropdown label="Institution" value={filters.Institution ?? "All"} options={filterOptions("institution")} onChange={(value) => setFilter("Institution", value)} />
                        <ExecutionFilterDropdown label="State" value={filters.State ?? "All"} options={filterOptions("status")} onChange={(value) => setFilter("State", value)} />
                        <ExecutionFilterDropdown label="Planner" value={filters.Planner ?? "All"} options={filterOptions("plannerState")} onChange={(value) => setFilter("Planner", value)} />
                        <ExecutionFilterDropdown label="Executor" value={filters.Executor ?? "All"} options={filterOptions("executorState")} onChange={(value) => setFilter("Executor", value)} />
                        <ExecutionFilterDropdown label="Reviewer" value={filters.Reviewer ?? "All"} options={filterOptions("reviewerState")} onChange={(value) => setFilter("Reviewer", value)} />
                        <ExecutionFilterDropdown label="Queue" value={filters.Queue ?? "All"} options={["All", "Queued", "Not queued"]} onChange={(value) => setFilter("Queue", value)} />
                        <ExecutionFilterDropdown label="Priority" value={filters.Priority ?? "All"} options={filterOptions("priority")} onChange={(value) => setFilter("Priority", value)} />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background/50">
                <table className="w-full text-left border-collapse min-w-[2000px]">
                    <thead className="sticky top-0 bg-card z-10 shadow-[0_1px_0_rgba(255,255,255,0.1)]">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === executions.length && executions.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold">Execution ID</th>
                            <th className="px-4 py-3 font-semibold min-w-[200px]">Mission</th>
                            <th className="px-4 py-3 font-semibold">Worker</th>
                            <th className="px-4 py-3 font-semibold text-center">Planner State</th>
                            <th className="px-4 py-3 font-semibold text-center">Executor State</th>
                            <th className="px-4 py-3 font-semibold text-center">Reviewer State</th>
                            <th className="px-4 py-3 font-semibold text-center">Queue Pos</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold w-32">Progress</th>
                            <th className="px-4 py-3 font-semibold">Started</th>
                            <th className="px-4 py-3 font-semibold">Duration</th>
                            <th className="px-4 py-3 font-semibold text-center">Retries</th>
                            <th className="px-4 py-3 font-semibold text-center">Timeout</th>
                            <th className="px-4 py-3 font-semibold text-center">Cancellation</th>
                            <th className="px-4 py-3 font-semibold">Updated</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {visibleExecutions.map((ex) => (
                            <tr 
                                key={ex.id} 
                                onClick={() => openInspector("execution", { ...ex, name: ex.id })}
                                className={cn(
                                    "group hover:bg-muted/30 transition-colors cursor-pointer",
                                    selectedRows.has(ex.id) ? "bg-primary/5 hover:bg-primary/10" : ""
                                )}
                            >
                                <td className="px-6 py-4" onClick={(e) => toggleRow(ex.id, e)}>
                                    <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.has(ex.id)} readOnly />
                                </td>
                                <td className="px-4 py-4 font-mono font-bold text-foreground">
                                    {ex.id}
                                </td>
                                <td className="px-4 py-4">
                                    <span className="font-medium text-[13px]">{ex.mission}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                        <Server className="size-3.5 text-muted-foreground" />
                                        <span className={cn(
                                            "text-[12px] font-mono",
                                            ex.worker === "Unassigned" ? "text-muted-foreground italic" : "text-foreground"
                                        )}>{ex.worker}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className={cn(
                                        "text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded",
                                        ex.plannerState === "Planning" ? "bg-blue-500/20 text-blue-500" :
                                        ex.plannerState === "Complete" ? "bg-emerald-500/20 text-emerald-500" :
                                        "bg-muted text-muted-foreground"
                                    )}>{ex.plannerState}</span>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className={cn(
                                        "text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded",
                                        ex.executorState === "Running" ? "bg-blue-500/20 text-blue-500" :
                                        ex.executorState === "Error" ? "bg-red-500/20 text-red-500" :
                                        ex.executorState === "Waiting" ? "bg-orange-500/20 text-orange-500" :
                                        "bg-muted text-muted-foreground"
                                    )}>{ex.executorState}</span>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className={cn(
                                        "text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded",
                                        ex.reviewerState === "Reviewing" ? "bg-purple-500/20 text-purple-500" :
                                        ex.reviewerState === "Approved" ? "bg-emerald-500/20 text-emerald-500" :
                                        ex.reviewerState === "Rejected" ? "bg-red-500/20 text-red-500" :
                                        "bg-muted text-muted-foreground"
                                    )}>{ex.reviewerState}</span>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    {ex.queuePosition !== null ? (
                                        <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30">Pos: {ex.queuePosition}</Badge>
                                    ) : (
                                        <span className="text-muted-foreground/50">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-4">
                                    <StatusBadge status={ex.status} />
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex flex-col gap-1.5 w-full">
                                        <div className="flex justify-between items-center text-[10px] font-mono font-bold text-muted-foreground">
                                            <span>{ex.progress}%</span>
                                        </div>
                                        <Progress value={ex.progress} className={cn("h-1.5", ex.status === "Failed" ? "bg-red-500/20" : "")} indicatorClassName={ex.status === "Failed" ? "bg-red-500" : ""} />
                                    </div>
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {ex.started}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {ex.duration}
                                </td>
                                <td className="px-4 py-4 text-center font-mono text-[11px]">
                                    <span className={ex.retries > 0 ? "text-yellow-500 font-bold" : "text-muted-foreground"}>{ex.retries}</span>
                                </td>
                                <td className="px-4 py-4 text-center font-mono text-[11px]">
                                    <span className={ex.timeoutEvents > 0 ? "text-red-500 font-bold" : "text-muted-foreground"}>{ex.timeoutEvents}</span>
                                </td>
                                <td className="px-4 py-4 text-center font-mono text-[11px]">
                                    <span className={ex.cancellations > 0 ? "text-red-500 font-bold" : "text-muted-foreground"}>{ex.cancellations}</span>
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {ex.updated}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="px-6 py-3 border-t border-border bg-card shrink-0">
                <span className="text-xs font-medium text-muted-foreground">Showing {visibleExecutions.length} of {executions.length} executions</span>
            </div>
        </div>
    );
}
