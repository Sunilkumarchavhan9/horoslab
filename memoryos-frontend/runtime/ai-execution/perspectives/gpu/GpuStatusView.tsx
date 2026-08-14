"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronDown, RefreshCw, Cpu, Activity, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "@/components/mission-control/universal-inspector";
import { useAiExecutionOverview } from "../../use-ai-execution-overview";
import { LiveFilterDropdown } from "@/components/mission-control/ui/live-filter-dropdown";

type GpuRow = {
    id: string;
    node: string;
    region: string;
    utilization: number;
    vram: number;
    temp: number;
    queue: number;
    throughput: string;
    status: string;
    updated: string;
};

export function GpuStatusView({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [regionFilter, setRegionFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [gpus, setGpus] = useState<GpuRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const overview = useAiExecutionOverview(workspaceId);

    const fetchGpus = React.useCallback(async () => {
        try {
            setIsLoading(true);
            setGpus(overview.endpoints.map((gpu) => ({ id: String(gpu.id ?? "gpu"), node: String(gpu.name ?? gpu.id ?? "GPU worker"), region: String(gpu.region ?? "-"), utilization: Number(gpu.utilization ?? 0), vram: Number(gpu.vram ?? 0), temp: Number(gpu.temperature ?? 0), queue: Number(gpu.queue ?? 0), throughput: String(gpu.throughput ?? "-"), status: String(gpu.status ?? "-"), updated: String(gpu.updatedAt ?? "-") })) as GpuRow[]);
            /* 
            if (res.ok) {
                const { data } = await res.json();
                setGpus(data.map((g: any) => ({
                    ...g,
                    updated: new Date(g.updated).toLocaleString()
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
        fetchGpus();
    }, [fetchGpus]);

    const visibleGpus = gpus.filter((gpu) =>
        (regionFilter === "All" || gpu.region === regionFilter) &&
        (statusFilter === "All" || gpu.status === statusFilter) &&
        `${gpu.node} ${gpu.region} ${gpu.status}`.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const toggleRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRows(newSet);
    };

    const toggleAll = () => {
        if (selectedRows.size === visibleGpus.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(visibleGpus.map(g => g.id)));
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 bg-background">
                <div className="flex items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">GPU Registry</h1>
                    <button 
                        onClick={fetchGpus}
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
                        
                        <LiveFilterDropdown label="Region" value={regionFilter} options={["All", ...Array.from(new Set(gpus.map((gpu) => gpu.region)))]} onChange={setRegionFilter} />
                        <LiveFilterDropdown label="Status" value={statusFilter} options={["All", ...Array.from(new Set(gpus.map((gpu) => gpu.status)))]} onChange={setStatusFilter} />
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-xs font-medium text-muted-foreground">{gpus.length} GPUs Online</span>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === visibleGpus.length && visibleGpus.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold w-40">GPU</th>
                            <th className="px-4 py-3 font-semibold w-40">Node</th>
                            <th className="px-4 py-3 font-semibold w-32">Region</th>
                            <th className="px-4 py-3 font-semibold w-32">Utilization</th>
                            <th className="px-4 py-3 font-semibold w-32">VRAM</th>
                            <th className="px-4 py-3 font-semibold w-32">Temperature</th>
                            <th className="px-4 py-3 font-semibold w-32">Queue Length</th>
                            <th className="px-4 py-3 font-semibold w-32">Throughput</th>
                            <th className="px-4 py-3 font-semibold w-32">Status</th>
                            <th className="px-4 py-3 font-semibold w-32">Updated</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {isLoading && gpus.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="px-6 py-8 text-center text-muted-foreground text-sm">Loading GPU metrics...</td>
                            </tr>
                        ) : visibleGpus.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="px-6 py-8 text-center text-muted-foreground text-sm">No GPUs found.</td>
                            </tr>
                        ) : visibleGpus.map((record) => (
                            <tr 
                                key={record.id} 
                                onClick={() => openInspector("gpu_node" as any, { ...record, name: record.node })}
                                className={cn(
                                    "group hover:bg-muted/30 transition-colors cursor-pointer",
                                    selectedRows.has(record.id) ? "bg-primary/5 hover:bg-primary/10" : ""
                                )}
                            >
                                <td className="px-6 py-4" onClick={(e) => toggleRow(record.id, e)}>
                                    <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.has(record.id)} readOnly />
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] font-bold text-foreground flex items-center gap-2">
                                    <Cpu className="size-4 text-purple-500" />
                                    {record.id}
                                </td>
                                <td className="px-4 py-4 font-medium text-foreground">
                                    {record.node}
                                </td>
                                <td className="px-4 py-4 font-medium text-muted-foreground">
                                    {record.region}
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500" style={{ width: `${record.utilization}%` }} />
                                        </div>
                                        <span className="font-mono text-[11px]">{record.utilization}%</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px]">
                                    {record.vram}%
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] flex items-center gap-1.5">
                                    <Thermometer className="size-3.5 text-orange-500" />
                                    {record.temp}°C
                                </td>
                                <td className="px-4 py-4 font-mono text-foreground">
                                    {record.queue}
                                </td>
                                <td className="px-4 py-4 font-mono text-foreground">
                                    {record.throughput}
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        record.status === "Active" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                        record.status === "Under Load" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                        "bg-red-500/10 text-red-500 border border-red-500/20"
                                    )}>
                                        {record.status === "Under Load" && <Activity className="size-3" />}
                                        {record.status}
                                    </span>
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
