"use client";

import React, { useState } from "react";
import { 
    Search, ChevronDown, ChevronLeft, ChevronRight,
    CheckCircle2, XCircle, Download, BookOpen, ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "@/components/mission-control/universal-inspector";

type AuditRow = {
    id: string;
    timestamp: string;
    event: string;
    missionId: string;
    worker: string;
    actor: string;
    correlationId: string;
    result: string;
    status: "Success" | "Failed" | "Warning";
};

const MOCK_AUDIT_LOGS: AuditRow[] = [
    { id: "AUD-9901", timestamp: "2026-08-01 10:15:22", event: "Policy Evaluated: Network Access", missionId: "MSN-8991", worker: "wrk-pool-a1", actor: "System Agent", correlationId: "corr_9a8b7c6d", result: "Granted", status: "Success" },
    { id: "AUD-9902", timestamp: "2026-08-01 10:14:10", event: "Budget Limit Exceeded", missionId: "MSN-8984", worker: "wrk-pool-b2", actor: "Reporting Agent", correlationId: "corr_8b7c6d5e", result: "Execution Paused", status: "Failed" },
    { id: "AUD-9903", timestamp: "2026-08-01 10:12:05", event: "Approval Requested", missionId: "MSN-8995", worker: "wrk-pool-c3", actor: "Sync Agent", correlationId: "corr_7c6d5e4f", result: "Pending Human Review", status: "Warning" },
    { id: "AUD-9904", timestamp: "2026-08-01 10:05:00", event: "Mission Completed", missionId: "MSN-8977", worker: "wrk-pool-a1", actor: "System Agent", correlationId: "corr_6d5e4f3g", result: "Success - Evidence Saved", status: "Success" },
];

export function GovernanceLedgerView() {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");

    const toggleRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRows(newSet);
    };

    const toggleAll = () => {
        if (selectedRows.size === MOCK_AUDIT_LOGS.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(MOCK_AUDIT_LOGS.map(m => m.id)));
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 border-b border-border bg-card">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <BookOpen className="size-5 text-indigo-500" />
                            Audit Explorer
                        </h1>
                        <span className="text-xs text-muted-foreground mt-1">Complete governance and compliance history.</span>
                    </div>
                    <button className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm">
                        <Download className="size-3.5" />
                        Export
                    </button>
                </div>

                <div className="flex items-center justify-between px-6 py-3 bg-muted/20 border-t border-border overflow-x-auto custom-scrollbar">
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="relative w-64 shrink-0">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="Search Audit Logs..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-8 pl-9 pr-3 text-xs bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/70 text-foreground"
                            />
                        </div>
                        <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0 shadow-sm">
                            Mission <ChevronDown className="size-3" />
                        </button>
                        <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0 shadow-sm">
                            Worker <ChevronDown className="size-3" />
                        </button>
                        <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0 shadow-sm">
                            Institution <ChevronDown className="size-3" />
                        </button>
                        <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0 shadow-sm">
                            Actor <ChevronDown className="size-3" />
                        </button>
                        <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0 shadow-sm">
                            Event Type <ChevronDown className="size-3" />
                        </button>
                        <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0 shadow-sm">
                            Date Range <ChevronDown className="size-3" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background/50 custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10 shadow-[0_1px_0_rgba(255,255,255,0.1)]">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === MOCK_AUDIT_LOGS.length && MOCK_AUDIT_LOGS.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold w-40">Timestamp</th>
                            <th className="px-4 py-3 font-semibold w-64">Event</th>
                            <th className="px-4 py-3 font-semibold w-32">Mission</th>
                            <th className="px-4 py-3 font-semibold w-32">Worker</th>
                            <th className="px-4 py-3 font-semibold w-32">Actor</th>
                            <th className="px-4 py-3 font-semibold w-40">Correlation ID</th>
                            <th className="px-4 py-3 font-semibold w-48">Result</th>
                            <th className="px-4 py-3 font-semibold w-24">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {MOCK_AUDIT_LOGS.map((log) => (
                            <tr 
                                key={log.id} 
                                onClick={() => openInspector("audit" as any, { ...log, context: 'governance', name: `Audit Log ${log.id}` })}
                                className={cn(
                                    "group hover:bg-muted/30 transition-colors cursor-pointer",
                                    selectedRows.has(log.id) ? "bg-primary/5 hover:bg-primary/10" : ""
                                )}
                            >
                                <td className="px-6 py-4" onClick={(e) => toggleRow(log.id, e)}>
                                    <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.has(log.id)} readOnly />
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {log.timestamp}
                                </td>
                                <td className="px-4 py-4 font-medium text-foreground">
                                    {log.event}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {log.missionId}
                                </td>
                                <td className="px-4 py-4 text-muted-foreground">
                                    {log.worker}
                                </td>
                                <td className="px-4 py-4 text-muted-foreground">
                                    {log.actor}
                                </td>
                                <td className="px-4 py-4">
                                    <span className="font-mono text-[11px] bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground border border-border/50">
                                        {log.correlationId}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-muted-foreground">
                                    {log.result}
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        log.status === "Success" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                        log.status === "Warning" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                        "bg-red-500/10 text-red-500 border border-red-500/20" // Failed
                                    )}>
                                        {log.status === "Success" && <CheckCircle2 className="size-3" />}
                                        {log.status === "Warning" && <ShieldAlert className="size-3" />}
                                        {log.status === "Failed" && <XCircle className="size-3" />}
                                        {log.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
