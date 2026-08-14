"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronDown, RefreshCw, Cpu, Activity, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "@/components/mission-control/universal-inspector";
import { useAiExecutionOverview } from "../../use-ai-execution-overview";
import { LiveFilterDropdown } from "@/components/mission-control/ui/live-filter-dropdown";

type WorkerRow = {
    id: string;
    name: string;
    type: string;
    provider: string;
    runtime: string;
    status: string;
    region: string;
    currentMissions: number;
    health: string;
    reliability: string;
    latency: string;
    updated: string;
};

export function WorkersView({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");
    const [providerFilter, setProviderFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [workers, setWorkers] = useState<WorkerRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const overview = useAiExecutionOverview(workspaceId);

    const fetchWorkers = React.useCallback(async () => {
        try {
            setIsLoading(true);
            setWorkers(overview.endpoints.map((worker) => ({ id: String(worker.id ?? "worker"), name: String(worker.name ?? worker.id ?? "Worker"), type: String(worker.kind ?? "AI"), provider: String(worker.provider ?? "-"), runtime: String(worker.model ?? "-"), status: String(worker.status ?? "registered"), region: String(worker.region ?? "-"), currentMissions: Number(worker.activeMissions ?? 0), health: String(worker.health ?? "-"), reliability: String(worker.reliability ?? "-"), latency: String(worker.latency ?? "-"), updated: worker.updatedAt ? new Date(String(worker.updatedAt)).toLocaleString() : "-" })) as WorkerRow[]);
            /* 
            if (res.ok) {
                const { data } = await res.json();
                setWorkers(data.map((w: any) => ({
                    id: w.id,
                    name: w.name || w.id,
                    type: w.kind || "General",
                    provider: w.provider || "System",
                    runtime: w.protocolVersion || "v1",
                    status: w.status === "available" ? "Idle" : w.status === "busy" ? "Executing" : "Offline",
                    region: "US East",
                    currentMissions: w.activeLeases || 0,
                    health: "Optimal",
                    reliability: "99.9%",
                    latency: "12ms",
                    updated: new Date(w.updatedAt).toLocaleString()
                })));
            }
        */
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [overview.endpoints]);

    useEffect(() => {
        fetchWorkers();
    }, [fetchWorkers]);

    const visibleWorkers = workers.filter((worker) =>
        (typeFilter === "All" || worker.type === typeFilter) &&
        (providerFilter === "All" || worker.provider === providerFilter) &&
        (statusFilter === "All" || worker.status === statusFilter) &&
        `${worker.name} ${worker.runtime} ${worker.region}`.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const toggleRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRows(newSet);
    };

    const toggleAll = () => {
        if (selectedRows.size === visibleWorkers.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(visibleWorkers.map(w => w.id)));
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 bg-background">
                <div className="flex items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">AI Workers</h1>
                    <button 
                        onClick={fetchWorkers}
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
                        
                        <LiveFilterDropdown label="Worker Type" value={typeFilter} options={["All", ...Array.from(new Set(workers.map((worker) => worker.type)))]} onChange={setTypeFilter} />
                        <LiveFilterDropdown label="Provider" value={providerFilter} options={["All", ...Array.from(new Set(workers.map((worker) => worker.provider)))]} onChange={setProviderFilter} />
                        <LiveFilterDropdown label="Status" value={statusFilter} options={["All", ...Array.from(new Set(workers.map((worker) => worker.status)))]} onChange={setStatusFilter} />
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-xs font-medium text-muted-foreground">{visibleWorkers.length} Workers</span>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === visibleWorkers.length && visibleWorkers.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold w-48">Worker</th>
                            <th className="px-4 py-3 font-semibold w-32">Type</th>
                            <th className="px-4 py-3 font-semibold w-32">Provider</th>
                            <th className="px-4 py-3 font-semibold w-32">Runtime</th>
                            <th className="px-4 py-3 font-semibold w-32">Status</th>
                            <th className="px-4 py-3 font-semibold w-32">Region</th>
                            <th className="px-4 py-3 font-semibold w-32">Current Missions</th>
                            <th className="px-4 py-3 font-semibold w-32">Health</th>
                            <th className="px-4 py-3 font-semibold w-32">Reliability</th>
                            <th className="px-4 py-3 font-semibold w-32">Latency</th>
                            <th className="px-4 py-3 font-semibold w-40">Updated</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {isLoading && workers.length === 0 ? (
                            <tr>
                                <td colSpan={12} className="px-6 py-8 text-center text-muted-foreground text-sm">Loading workers...</td>
                            </tr>
                        ) : visibleWorkers.length === 0 ? (
                            <tr>
                                <td colSpan={12} className="px-6 py-8 text-center text-muted-foreground text-sm">No workers found.</td>
                            </tr>
                        ) : visibleWorkers.map((record) => (
                            <tr 
                                key={record.id} 
                                onClick={() => openInspector("ai_worker" as any, { ...record, name: record.name })}
                                className={cn(
                                    "group hover:bg-muted/30 transition-colors cursor-pointer",
                                    selectedRows.has(record.id) ? "bg-primary/5 hover:bg-primary/10" : ""
                                )}
                            >
                                <td className="px-6 py-4" onClick={(e) => toggleRow(record.id, e)}>
                                    <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.has(record.id)} readOnly />
                                </td>
                                <td className="px-4 py-4 font-bold text-foreground flex items-center gap-2">
                                    <Cpu className="size-4 text-blue-500" />
                                    {record.name}
                                </td>
                                <td className="px-4 py-4 font-medium text-foreground">
                                    {record.type}
                                </td>
                                <td className="px-4 py-4 font-medium text-muted-foreground">
                                    {record.provider}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {record.runtime}
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        record.status === "Idle" ? "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20" :
                                        record.status === "Executing" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                                        "bg-red-500/10 text-red-500 border border-red-500/20"
                                    )}>
                                        {record.status === "Executing" && <Activity className="size-3" />}
                                        {record.status === "Idle" && <Clock className="size-3" />}
                                        {record.status}
                                    </span>
                                </td>
                                <td className="px-4 py-4 font-medium text-foreground">
                                    {record.region}
                                </td>
                                <td className="px-4 py-4 font-mono text-foreground">
                                    {record.currentMissions}
                                </td>
                                <td className="px-4 py-4">
                                    <span className="text-emerald-500 font-medium">{record.health}</span>
                                </td>
                                <td className="px-4 py-4 font-mono text-foreground">
                                    {record.reliability}
                                </td>
                                <td className="px-4 py-4 font-mono text-foreground">
                                    {record.latency}
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
