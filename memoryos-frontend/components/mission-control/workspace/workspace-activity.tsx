"use client";

import React, { useEffect, useState } from "react";
import { 
    Search, Filter, Download, ChevronDown, ChevronLeft, ChevronRight,
    AlertCircle, AlertTriangle, Info, CheckCircle2,
    Calendar, Server, Activity, ArrowRight, XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "../universal-inspector";
import { getHorosAuditTrail } from "@/lib/horos-api";
import { LiveFilterDropdown } from "../ui/live-filter-dropdown";

type EventRow = {
    id: string;
    timestamp: string;
    severity: "INFO" | "WARN" | "ERROR" | "CRITICAL";
    message: string;
    eventType: string;
    missionId: string;
    workerId: string;
    executionId: string;
    institutionId: string;
    actor: string;
    state: "Triggered" | "Processing" | "Completed" | "Failed";
    result: string;
    correlationId: string;
    source: string;
};

function SeverityIcon({ severity }: { severity: EventRow["severity"] }) {
    switch (severity) {
        case "INFO": return <Info className="size-4 text-blue-500" />;
        case "WARN": return <AlertTriangle className="size-4 text-yellow-500" />;
        case "ERROR": return <AlertCircle className="size-4 text-red-500" />;
        case "CRITICAL": return <XCircle className="size-4 text-rose-600" />;
    }
}

export function WorkspaceActivity({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [events, setEvents] = useState<EventRow[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [severityFilter, setSeverityFilter] = useState("All");
    const [filters, setFilters] = useState<Record<string, string>>({});
    const exportEvents = () => {
        const blob = new Blob([JSON.stringify(visibleEvents, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "horos-activity.json";
        anchor.click();
        URL.revokeObjectURL(url);
    };
    useEffect(() => {
        if (!workspaceId) return;
        let cancelled = false;
        const load = () => getHorosAuditTrail(workspaceId).then((payload) => {
            if (cancelled) return;
            setEvents([...payload.runtimeEvents, ...payload.auditLogs, ...payload.deadLetters].map((item, index) => ({ id: String(item.id ?? `event-${index}`), timestamp: item.createdAt || item.timestamp ? new Date(String(item.createdAt ?? item.timestamp)).toLocaleString() : "-", severity: (String(item.severity ?? "INFO").toUpperCase()) as EventRow["severity"], message: String(item.message ?? item.label ?? item.description ?? "Runtime event"), eventType: String(item.type ?? item.kind ?? "audit"), missionId: String(item.missionId ?? "-"), workerId: String(item.workerId ?? "-"), executionId: String(item.executionId ?? "-"), institutionId: String(item.institutionId ?? "-"), actor: String(item.actor ?? "HOROS runtime"), state: String(item.status ?? "Completed") as EventRow["state"], result: String(item.status ?? "Recorded"), correlationId: String(item.correlationId ?? "-"), source: String(item.source ?? "HOROS") })));
        }).catch(() => undefined);
        void load();
        const interval = window.setInterval(() => void load(), 5000);
        return () => { cancelled = true; window.clearInterval(interval); };
    }, [workspaceId]);

    const toggleRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRows(newSet);
    };

    const toggleAll = () => {
        if (selectedRows.size === events.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(events.map(m => m.id)));
    };

    const visibleEvents = events.filter((event) => {
        const query = searchQuery.trim().toLowerCase();
        const matches = (key: string, value: string) => !filters[key] || filters[key] === "All" || filters[key] === value;
        const range = filters["Date Range"];
        const age = range && range !== "All" ? Date.now() - new Date(event.timestamp).getTime() : 0;
        const withinRange = !range || range === "All" || (Number.isFinite(age) && age <= (range === "24 hours" ? 86_400_000 : range === "7 days" ? 604_800_000 : 2_592_000_000));
        return withinRange && (!query || JSON.stringify(event).toLowerCase().includes(query)) && (severityFilter === "All" || event.severity === severityFilter) &&
            matches("Mission", event.missionId) && matches("Execution", event.executionId) && matches("Worker", event.workerId) && matches("Institution", event.institutionId) && matches("Event Type", event.eventType) && matches("Correlation ID", event.correlationId);
    });
    const optionsFor = (key: keyof EventRow) => ["All", ...Array.from(new Set(events.map((event) => String(event[key]))))];
    const setFilter = (key: string, value: string) => setFilters((current) => ({ ...current, [key]: value }));

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 border-b border-border bg-card">
                <div className="flex items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Event Explorer</h1>
                    <div className="flex items-center gap-2">
                        <button onClick={exportEvents} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors shadow-sm">
                            <Download className="size-3.5" />
                            Export Logs
                        </button>
                    </div>
                </div>

                <div className="relative z-30 flex items-center justify-between px-6 py-3 bg-muted/20 border-t border-border overflow-visible">
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="relative w-72 shrink-0">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="Search event payload, message, correlation ID..." 
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                className="w-full h-8 pl-9 pr-3 text-xs bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/70 text-foreground"
                            />
                        </div>
                        <LiveFilterDropdown label="Mission" value={filters.Mission} options={optionsFor("missionId")} onChange={(value) => setFilter("Mission", value)} />
                        <LiveFilterDropdown label="Execution" value={filters.Execution} options={optionsFor("executionId")} onChange={(value) => setFilter("Execution", value)} />
                        <LiveFilterDropdown label="Worker" value={filters.Worker} options={optionsFor("workerId")} onChange={(value) => setFilter("Worker", value)} />
                        <LiveFilterDropdown label="Institution" value={filters.Institution} options={optionsFor("institutionId")} onChange={(value) => setFilter("Institution", value)} />
                        <LiveFilterDropdown label="Severity" value={severityFilter} options={["All", "INFO", "WARN", "ERROR", "CRITICAL"]} onChange={setSeverityFilter} />
                        <LiveFilterDropdown label="Event Type" value={filters["Event Type"]} options={optionsFor("eventType")} onChange={(value) => setFilter("Event Type", value)} />
                        <LiveFilterDropdown label="Correlation ID" value={filters["Correlation ID"]} options={optionsFor("correlationId")} onChange={(value) => setFilter("Correlation ID", value)} />
                        <LiveFilterDropdown label="Date Range" value={filters["Date Range"]} options={["All", "24 hours", "7 days", "30 days"]} onChange={(value) => setFilter("Date Range", value)} />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background/50 custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1400px]">
                    <thead className="sticky top-0 bg-card z-10 shadow-[0_1px_0_rgba(255,255,255,0.1)]">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === events.length && events.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold w-40">Timestamp</th>
                            <th className="px-4 py-3 font-semibold w-72">Event Type / Message</th>
                            <th className="px-4 py-3 font-semibold">Mission</th>
                            <th className="px-4 py-3 font-semibold">Execution</th>
                            <th className="px-4 py-3 font-semibold">Worker</th>
                            <th className="px-4 py-3 font-semibold">Institution</th>
                            <th className="px-4 py-3 font-semibold">Actor</th>
                            <th className="px-4 py-3 font-semibold">Correlation ID</th>
                            <th className="px-4 py-3 font-semibold text-center">Status</th>
                            <th className="px-4 py-3 font-semibold">Source</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {visibleEvents.map((event) => (
                            <tr 
                                key={event.id} 
                                onClick={() => openInspector("event", event)}
                                className={cn(
                                    "group hover:bg-muted/30 transition-colors cursor-pointer",
                                    selectedRows.has(event.id) ? "bg-primary/5 hover:bg-primary/10" : "",
                                    event.severity === "ERROR" ? "bg-red-500/5 hover:bg-red-500/10" : "",
                                    event.severity === "CRITICAL" ? "bg-rose-600/10 hover:bg-rose-600/20" : ""
                                )}
                            >
                                <td className="px-6 py-4" onClick={(e) => toggleRow(event.id, e)}>
                                    <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.has(event.id)} readOnly />
                                </td>
                                <td className="px-4 py-4">
                                    <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">{event.timestamp}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 shrink-0"><SeverityIcon severity={event.severity} /></div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-semibold text-foreground">{event.eventType}</span>
                                            <span className={cn(
                                                "font-medium",
                                                event.severity === "ERROR" ? "text-red-500" :
                                                event.severity === "CRITICAL" ? "text-rose-500 font-bold" :
                                                event.severity === "WARN" ? "text-yellow-500" :
                                                "text-foreground"
                                            )}>{event.message}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="text-foreground text-[13px] font-mono">{event.missionId}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="text-[12px] font-mono text-muted-foreground">{event.executionId}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="text-[12px] font-mono text-muted-foreground">{event.workerId}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="text-[12px] font-mono text-muted-foreground">{event.institutionId}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="text-foreground text-[13px]">{event.actor}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="font-mono text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">{event.correlationId}</span>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
                                        event.state === "Completed" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                        event.state === "Failed" ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                                        event.state === "Processing" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                                        "bg-muted text-muted-foreground border border-border"
                                    )}>
                                        {event.state}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-xs text-muted-foreground">
                                    {event.source}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
