"use client";

import React, { useState, useEffect } from "react";
import { Search, RefreshCw, DollarSign, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "@/components/mission-control/universal-inspector";
import { useAiExecutionOverview } from "../../use-ai-execution-overview";
import { LiveFilterDropdown } from "@/components/mission-control/ui/live-filter-dropdown";

type CostRow = {
    id: string;
    mission: string;
    provider: string;
    model: string;
    tokenUsage: string;
    gpuHours: string;
    providerCost: string;
    missionCost: string;
    currency: string;
    updated: string;
};

export function CostsView({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [missionFilter, setMissionFilter] = useState("All");
    const [providerFilter, setProviderFilter] = useState("All");
    const [currencyFilter, setCurrencyFilter] = useState("All");
    const [costs, setCosts] = useState<CostRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const overview = useAiExecutionOverview(workspaceId);

    const fetchCosts = React.useCallback(async () => {
        try {
            setIsLoading(true);
            const live = Array.isArray(overview.costs.byProvider) ? overview.costs.byProvider as Array<Record<string, unknown>> : [];
            setCosts(live.map((cost) => ({ id: String(cost.providerId ?? "provider"), mission: String(cost.missionId ?? "-"), provider: String(cost.provider ?? cost.providerId ?? "-"), model: String(cost.model ?? "-"), tokenUsage: String(Number(cost.inputTokens ?? 0) + Number(cost.outputTokens ?? 0)), gpuHours: Number(cost.gpuHours ?? 0).toFixed(4), providerCost: Number(cost.estimatedCost ?? 0).toFixed(4), missionCost: Number(cost.estimatedCost ?? 0).toFixed(4), currency: String(cost.currency ?? "USD"), updated: cost.updatedAt ? new Date(String(cost.updatedAt)).toLocaleString() : "-" })) as CostRow[]);
            /* 
            if (res.ok) {
                const { data } = await res.json();
                setCosts(data.map((c: any) => ({
                    id: c.id,
                    mission: c.agentRunId || "MSN-Unknown",
                    provider: c.provider?.displayName || c.provider?.provider || "Unknown Provider",
                    model: c.model || "Unknown Model",
                    tokenUsage: (c.inputTokens + c.outputTokens).toLocaleString(),
                    gpuHours: "0.00",
                    providerCost: c.estimatedCost.toFixed(5),
                    missionCost: c.estimatedCost.toFixed(5),
                    currency: "USD",
                    updated: new Date(c.createdAt).toLocaleString()
                })));
            }
        */
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [overview.costs]);

    useEffect(() => {
        fetchCosts();
    }, [fetchCosts]);

    const visibleCosts = costs.filter((cost) =>
        (missionFilter === "All" || cost.mission === missionFilter) &&
        (providerFilter === "All" || cost.provider === providerFilter) &&
        (currencyFilter === "All" || cost.currency === currencyFilter) &&
        `${cost.mission} ${cost.provider} ${cost.model}`.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const toggleRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRows(newSet);
    };

    const toggleAll = () => {
        if (selectedRows.size === visibleCosts.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(visibleCosts.map(c => c.id)));
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 bg-background">
                <div className="flex items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Cost Explorer</h1>
                    <button 
                        onClick={fetchCosts}
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
                        
                        <LiveFilterDropdown label="Mission" value={missionFilter} options={["All", ...Array.from(new Set(costs.map((cost) => cost.mission)))]} onChange={setMissionFilter} />
                        <LiveFilterDropdown label="Provider" value={providerFilter} options={["All", ...Array.from(new Set(costs.map((cost) => cost.provider)))]} onChange={setProviderFilter} />
                        <LiveFilterDropdown label="Currency" value={currencyFilter} options={["All", ...Array.from(new Set(costs.map((cost) => cost.currency)))]} onChange={setCurrencyFilter} />
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-xs font-medium text-muted-foreground">{costs.length} Records</span>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === visibleCosts.length && visibleCosts.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold w-32">Mission</th>
                            <th className="px-4 py-3 font-semibold w-40">Provider</th>
                            <th className="px-4 py-3 font-semibold w-40">Model</th>
                            <th className="px-4 py-3 font-semibold w-32">Token Usage</th>
                            <th className="px-4 py-3 font-semibold w-32">GPU Hours</th>
                            <th className="px-4 py-3 font-semibold w-32">Provider Cost</th>
                            <th className="px-4 py-3 font-semibold w-32">Mission Cost</th>
                            <th className="px-4 py-3 font-semibold w-24">Currency</th>
                            <th className="px-4 py-3 font-semibold w-40">Updated</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {isLoading && costs.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="px-6 py-8 text-center text-muted-foreground text-sm">Loading costs...</td>
                            </tr>
                        ) : visibleCosts.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="px-6 py-8 text-center text-muted-foreground text-sm">No cost records found.</td>
                            </tr>
                        ) : visibleCosts.map((record) => (
                            <tr 
                                key={record.id} 
                                onClick={() => openInspector("intelligence", { ...record, name: `Cost ${record.id.substring(0, 8)}` })}
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
                                    <Database className="size-3.5 text-zinc-400" />
                                    {record.provider}
                                </td>
                                <td className="px-4 py-4 font-medium text-muted-foreground">
                                    {record.model}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-foreground">
                                    {record.tokenUsage}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-foreground">
                                    {record.gpuHours}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-emerald-500 font-medium">
                                    ${record.providerCost}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-emerald-500 font-medium flex items-center gap-1.5">
                                    <DollarSign className="size-3.5 text-emerald-500" />
                                    {record.missionCost}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {record.currency}
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
