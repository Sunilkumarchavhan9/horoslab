"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronDown, RefreshCw, AlertTriangle, ShieldAlert, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "@/components/mission-control/universal-inspector";
import { useAiExecutionOverview } from "../../use-ai-execution-overview";
import { LiveFilterDropdown } from "@/components/mission-control/ui/live-filter-dropdown";

type FailoverRow = {
    id: string;
    mission: string;
    failedProvider: string;
    fallbackWorker: string;
    fallbackModel: string;
    retryCount: number;
    finalOutcome: string;
    status: string;
    occurred: string;
    updated: string;
};

export function FailoversView({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [missionFilter, setMissionFilter] = useState("All");
    const [providerFilter, setProviderFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [outcomeFilter, setOutcomeFilter] = useState("All");
    const [failovers, setFailovers] = useState<FailoverRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const overview = useAiExecutionOverview(workspaceId);

    const fetchFailovers = React.useCallback(async () => {
        try {
            setIsLoading(true);
            setFailovers(overview.executions.filter((item) => item.success === false).map((item) => ({
                id: String(item.id ?? "execution"),
                mission: String(item.missionId ?? "-"),
                failedProvider: String(item.providerId ?? item.provider ?? "-"),
                fallbackWorker: String(item.fallbackWorkerId ?? item.fallbackWorker ?? "-"),
                fallbackModel: String(item.fallbackModel ?? "-"),
                retryCount: Number(item.retryCount ?? item.retries ?? 0),
                finalOutcome: String(item.finalOutcome ?? item.outcome ?? "-"),
                status: String(item.status ?? "-"),
                occurred: item.createdAt ? new Date(String(item.createdAt)).toLocaleString() : "-",
                updated: item.updatedAt ? new Date(String(item.updatedAt)).toLocaleString() : "-",
            })) as FailoverRow[]);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [overview.executions]);

    useEffect(() => {
        fetchFailovers();
    }, [fetchFailovers]);

    const visibleFailovers = failovers.filter((failover) =>
        (missionFilter === "All" || failover.mission === missionFilter) &&
        (providerFilter === "All" || failover.failedProvider === providerFilter) &&
        (statusFilter === "All" || failover.status === statusFilter) &&
        (outcomeFilter === "All" || failover.finalOutcome === outcomeFilter) &&
        `${failover.mission} ${failover.failedProvider} ${failover.fallbackModel}`.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const toggleRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRows(newSet);
    };

    const toggleAll = () => {
        if (selectedRows.size === visibleFailovers.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(visibleFailovers.map(f => f.id)));
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 bg-background">
                <div className="flex items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Failover History</h1>
                    <button 
                        onClick={fetchFailovers}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
                        Refresh
                    </button>
                </div>

                {/* Toolbar */}
                <div className="relative z-30 flex items-center justify-between px-6 py-3 bg-muted/20 overflow-visible">
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
                        
                        <LiveFilterDropdown label="Mission" value={missionFilter} options={["All", ...Array.from(new Set(failovers.map((failover) => failover.mission)))]} onChange={setMissionFilter} />
                        <LiveFilterDropdown label="Provider" value={providerFilter} options={["All", ...Array.from(new Set(failovers.map((failover) => failover.failedProvider)))]} onChange={setProviderFilter} />
                        <LiveFilterDropdown label="Status" value={statusFilter} options={["All", ...Array.from(new Set(failovers.map((failover) => failover.status)))]} onChange={setStatusFilter} />
                        <LiveFilterDropdown label="Outcome" value={outcomeFilter} options={["All", ...Array.from(new Set(failovers.map((failover) => failover.finalOutcome)))]} onChange={setOutcomeFilter} />
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-xs font-medium text-muted-foreground">{failovers.length} Failovers</span>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === visibleFailovers.length && visibleFailovers.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold w-32">Mission</th>
                            <th className="px-4 py-3 font-semibold w-40">Failed Provider</th>
                            <th className="px-4 py-3 font-semibold w-40">Fallback Worker</th>
                            <th className="px-4 py-3 font-semibold w-40">Fallback Model</th>
                            <th className="px-4 py-3 font-semibold w-24 text-center">Retry Count</th>
                            <th className="px-4 py-3 font-semibold w-32">Final Outcome</th>
                            <th className="px-4 py-3 font-semibold w-32">Status</th>
                            <th className="px-4 py-3 font-semibold w-40">Occurred</th>
                            <th className="px-4 py-3 font-semibold w-40">Updated</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {isLoading && failovers.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="px-6 py-8 text-center text-muted-foreground text-sm">Loading failovers...</td>
                            </tr>
                        ) : visibleFailovers.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="px-6 py-8 text-center text-muted-foreground text-sm">No failovers found.</td>
                            </tr>
                        ) : visibleFailovers.map((record) => (
                            <tr 
                                key={record.id} 
                                onClick={() => openInspector("failover_record" as any, { ...record, name: `Failover ${record.id.substring(0, 8)}` })}
                                className={cn(
                                    "group hover:bg-muted/30 transition-colors cursor-pointer",
                                    selectedRows.has(record.id) ? "bg-primary/5 hover:bg-primary/10" : ""
                                )}
                            >
                                <td className="px-6 py-4" onClick={(e) => toggleRow(record.id, e)}>
                                    <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.has(record.id)} readOnly />
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] font-bold text-foreground">
                                    {record.mission}
                                </td>
                                <td className="px-4 py-4 font-medium text-foreground flex items-center gap-2">
                                    <ShieldAlert className="size-4 text-red-500" />
                                    {record.failedProvider}
                                </td>
                                <td className="px-4 py-4 font-medium text-muted-foreground flex items-center gap-2">
                                    <ArrowRightLeft className="size-3.5 text-zinc-400" />
                                    {record.fallbackWorker}
                                </td>
                                <td className="px-4 py-4 font-medium text-muted-foreground">
                                    {record.fallbackModel}
                                </td>
                                <td className="px-4 py-4 font-mono text-foreground text-center">
                                    {record.retryCount}
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        record.finalOutcome === "Recovered" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                        "bg-red-500/10 text-red-500 border border-red-500/20"
                                    )}>
                                        {record.finalOutcome}
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        record.status === "Resolved" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                                        "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                    )}>
                                        {record.status === "Pending" && <AlertTriangle className="size-3" />}
                                        {record.status}
                                    </span>
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {record.occurred}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {record.updated}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
