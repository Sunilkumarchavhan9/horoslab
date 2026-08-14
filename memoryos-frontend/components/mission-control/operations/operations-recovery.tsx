"use client";

import React, { useEffect, useState } from "react";
import { 
    Search, Filter, Download, ChevronDown, ChevronLeft, ChevronRight,
    RefreshCcw, PlayCircle, RotateCcw, XCircle, AlertCircle, ShieldAlert, CheckCircle2,
    Clock, Cpu, GitMerge
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "../universal-inspector";
import { Badge } from "@/components/ui/badge";
import { listEpochRecoveryEscalations } from "@/lib/epoch-api";
import { exportLiveRows } from "../export-live-rows";
import { LiveFilterDropdown } from "../ui/live-filter-dropdown";

type RecoveryRow = {
    id: string;
    mission: string;
    execution: string;
    failure: string;
    strategy: "Checkpoint Resume" | "Fallback Worker" | "Rollback" | "Manual Intervention";
    retryCount: number;
    fallback: string;
    checkpoint: string;
    status: "Recovering" | "Failed" | "Resolved" | "Awaiting Input";
    started: string;
    duration: string;
};

const MOCK_RECOVERIES: RecoveryRow[] = [
    { id: "REC-104", mission: "MSN-8991", execution: "EX-4412", failure: "Rate Limit Exceeded (429)", strategy: "Checkpoint Resume", retryCount: 3, fallback: "N/A", checkpoint: "CHK-33A", status: "Recovering", started: "10:15:22", duration: "4m 12s" },
    { id: "REC-105", mission: "MSN-8984", execution: "EX-4413", failure: "Worker OOM Crash", strategy: "Fallback Worker", retryCount: 1, fallback: "High-Memory Node", checkpoint: "CHK-01B", status: "Resolved", started: "09:30:00", duration: "1m 05s" },
    { id: "REC-106", mission: "MSN-8995", execution: "EX-4414", failure: "API Schema Mismatch", strategy: "Manual Intervention", retryCount: 0, fallback: "N/A", checkpoint: "CHK-99F", status: "Awaiting Input", started: "08:15:00", duration: "3h 10m" },
    { id: "REC-107", mission: "MSN-8996", execution: "EX-4415", failure: "Data Corruption Detected", strategy: "Rollback", retryCount: 0, fallback: "N/A", checkpoint: "CHK-LAST-KNOWN-GOOD", status: "Failed", started: "07:00:00", duration: "12m 45s" },
    { id: "REC-108", mission: "MSN-8997", execution: "EX-4416", failure: "Network Timeout", strategy: "Checkpoint Resume", retryCount: 2, fallback: "Secondary Region API", checkpoint: "CHK-22X", status: "Resolved", started: "06:15:00", duration: "45s" },
];

function toRecoveryRow(record: Record<string, unknown>): RecoveryRow {
    const status = String(record.status || "open").toLowerCase();
    return {
        id: String(record.id || "recovery"),
        mission: String(record.missionId || "Mission"),
        execution: String(record.executionRunId || "-"),
        failure: String(record.reason || record.error || "Recovery escalation"),
        strategy: String(record.strategy || record.recoveryStrategy || "Manual Intervention") as RecoveryRow["strategy"],
        retryCount: Number(record.retryCount || 0),
        fallback: String(record.fallbackWorkerId || "-"),
        checkpoint: String(record.checkpointId || "-"),
        status: status === "resolved" ? "Resolved" : status === "failed" ? "Failed" : "Awaiting Input",
        started: record.createdAt ? new Date(String(record.createdAt)).toLocaleString() : "-",
        duration: "-",
    };
}

export function OperationsRecovery({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [recoveries, setRecoveries] = useState<RecoveryRow[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!workspaceId) {
            setRecoveries([]);
            return;
        }
        let cancelled = false;
        const load = async () => {
            try {
                const items = await listEpochRecoveryEscalations(workspaceId);
                if (!cancelled) setRecoveries(items.map(toRecoveryRow));
            } catch {
                if (!cancelled) setRecoveries([]);
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
        if (selectedRows.size === recoveries.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(recoveries.map(m => m.id)));
    };

    const visibleRecoveries = recoveries.filter((row) => {
        const query = searchQuery.trim().toLowerCase();
        const matches = (key: string, value: string) => !filters[key] || filters[key] === "All" || filters[key] === value;
        return (!query || JSON.stringify(row).toLowerCase().includes(query)) && matches("Mission", row.mission) && matches("Strategy", row.strategy) && matches("Status", row.status) && matches("Failure Type", row.failure);
    });
    const optionsFor = (key: keyof RecoveryRow) => ["All", ...Array.from(new Set(recoveries.map((row) => String(row[key]))))];
    const setFilter = (key: string, value: string) => setFilters((current) => ({ ...current, [key]: value }));

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 border-b border-border bg-card">
                <div className="flex items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Mission Recovery</h1>
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => exportLiveRows("epoch-recovery.json", visibleRecoveries)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-sm">
                            <Download className="size-3.5" />
                            Export Recovery Log
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between px-6 py-3 bg-muted/20 border-t border-border overflow-visible">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-64">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="Search by Mission, Error..." 
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                className="w-full h-8 pl-9 pr-3 text-xs bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/70 text-foreground"
                            />
                        </div>
                        
                        <div className="flex items-center gap-2 overflow-visible">
                            <LiveFilterDropdown label="Mission" value={filters.Mission} options={optionsFor("mission")} onChange={(value) => setFilter("Mission", value)} />
                            <LiveFilterDropdown label="Strategy" value={filters.Strategy} options={optionsFor("strategy")} onChange={(value) => setFilter("Strategy", value)} />
                            <LiveFilterDropdown label="Status" value={filters.Status} options={optionsFor("status")} onChange={(value) => setFilter("Status", value)} />
                            <LiveFilterDropdown label="Failure Type" value={filters["Failure Type"]} options={optionsFor("failure")} onChange={(value) => setFilter("Failure Type", value)} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background/50">
                <table className="w-full text-left border-collapse min-w-[1400px]">
                    <thead className="sticky top-0 bg-card z-10 shadow-[0_1px_0_rgba(255,255,255,0.1)]">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === recoveries.length && recoveries.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold">Recovery ID</th>
                            <th className="px-4 py-3 font-semibold">Mission</th>
                            <th className="px-4 py-3 font-semibold">Execution</th>
                            <th className="px-4 py-3 font-semibold">Failure Error</th>
                            <th className="px-4 py-3 font-semibold">Recovery Strategy</th>
                            <th className="px-4 py-3 font-semibold text-center w-20">Retries</th>
                            <th className="px-4 py-3 font-semibold">Fallback Node</th>
                            <th className="px-4 py-3 font-semibold">Checkpoint</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Started</th>
                            <th className="px-4 py-3 font-semibold">Duration</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {visibleRecoveries.map((recovery) => (
                            <tr 
                                key={recovery.id} 
                                onClick={() => openInspector("recovery", recovery)}
                                className={cn(
                                    "group hover:bg-muted/30 transition-colors cursor-pointer",
                                    selectedRows.has(recovery.id) ? "bg-primary/5 hover:bg-primary/10" : ""
                                )}
                            >
                                <td className="px-6 py-4" onClick={(e) => toggleRow(recovery.id, e)}>
                                    <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.has(recovery.id)} readOnly />
                                </td>
                                <td className="px-4 py-4">
                                    <span className="font-mono text-[12px] font-bold text-foreground">{recovery.id}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="font-mono text-[12px] font-semibold text-foreground">{recovery.mission}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="font-mono text-[11px] text-muted-foreground">{recovery.execution}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="text-[13px] font-semibold text-red-500">{recovery.failure}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <Badge variant="outline" className={cn(
                                        "font-mono text-[10px] tracking-wide",
                                        recovery.strategy === "Checkpoint Resume" ? "text-blue-500 border-blue-500/30" :
                                        recovery.strategy === "Fallback Worker" ? "text-purple-500 border-purple-500/30" :
                                        recovery.strategy === "Rollback" ? "text-red-500 border-red-500/30" :
                                        "text-orange-500 border-orange-500/30"
                                    )}>
                                        {recovery.strategy}
                                    </Badge>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className={cn(
                                        "text-[12px] font-mono font-bold",
                                        recovery.retryCount > 0 ? "text-orange-500" : "text-muted-foreground"
                                    )}>{recovery.retryCount} / 3</span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="text-[12px] font-mono text-muted-foreground">{recovery.fallback}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="text-[12px] font-mono text-blue-500 font-semibold">{recovery.checkpoint}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        recovery.status === "Recovering" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                                        recovery.status === "Resolved" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                        recovery.status === "Failed" ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                                        "bg-orange-500/10 text-orange-500 border border-orange-500/20" // Awaiting Input
                                    )}>
                                        {recovery.status === "Recovering" && <RefreshCcw className="size-3 animate-spin-slow" />}
                                        {recovery.status === "Resolved" && <CheckCircle2 className="size-3" />}
                                        {recovery.status === "Failed" && <XCircle className="size-3" />}
                                        {recovery.status === "Awaiting Input" && <AlertCircle className="size-3" />}
                                        {recovery.status}
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="text-[12px] font-mono text-muted-foreground">{recovery.started}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="text-[12px] font-mono font-semibold text-foreground">{recovery.duration}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="px-6 py-3 border-t border-border bg-card shrink-0">
                <span className="text-xs font-medium text-muted-foreground">Showing {visibleRecoveries.length} of {recoveries.length} recoveries</span>
            </div>
        </div>
    );
}
