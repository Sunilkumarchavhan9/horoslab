"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronDown, RefreshCw, Key, Globe, Database, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "@/components/mission-control/universal-inspector";
import { useAiExecutionOverview } from "../../use-ai-execution-overview";
import { LiveFilterDropdown } from "@/components/mission-control/ui/live-filter-dropdown";

type ProviderRow = {
    id: string;
    provider: string;
    status: string;
    regions: string;
    auth: string;
    apiVersion: string;
    updated: string;
};

export function ProvidersView({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [regionFilter, setRegionFilter] = useState("All");
    const [providers, setProviders] = useState<ProviderRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const overview = useAiExecutionOverview(workspaceId);

    const fetchProviders = React.useCallback(async () => {
        try {
            setIsLoading(true);
            setProviders(overview.catalog.map((item) => ({
                id: String(item.id ?? item.provider ?? "provider"),
                provider: String(item.provider ?? item.name ?? "-"),
                status: item.available === false ? "Unavailable" : String(item.status ?? "-"),
                regions: Array.isArray(item.regions) ? item.regions.map(String).join(", ") : String(item.region ?? "-"),
                auth: String(item.auth ?? item.authType ?? "-"),
                apiVersion: String(item.apiVersion ?? item.version ?? "-"),
                updated: item.updatedAt ? new Date(String(item.updatedAt)).toLocaleString() : "-",
            })) as ProviderRow[]);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [overview.catalog]);

    useEffect(() => {
        fetchProviders();
    }, [fetchProviders]);

    const visibleProviders = providers.filter((provider) =>
        (statusFilter === "All" || provider.status === statusFilter) &&
        (regionFilter === "All" || provider.regions === regionFilter) &&
        `${provider.provider} ${provider.auth} ${provider.apiVersion}`.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const toggleRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRows(newSet);
    };

    const toggleAll = () => {
        if (selectedRows.size === visibleProviders.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(visibleProviders.map(p => p.id)));
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 bg-background">
                <div className="flex items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Providers</h1>
                    <button 
                        onClick={fetchProviders}
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
                        
                        <LiveFilterDropdown label="Status" value={statusFilter} options={["All", ...Array.from(new Set(providers.map((provider) => provider.status)))]} onChange={setStatusFilter} />
                        <LiveFilterDropdown label="Region" value={regionFilter} options={["All", ...Array.from(new Set(providers.map((provider) => provider.regions)))]} onChange={setRegionFilter} />
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-xs font-medium text-muted-foreground">{visibleProviders.length} Providers</span>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead className="sticky top-0 bg-card z-10">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === visibleProviders.length && visibleProviders.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold w-48">Provider</th>
                            <th className="px-4 py-3 font-semibold w-32">Status</th>
                            <th className="px-4 py-3 font-semibold w-48">Region</th>
                            <th className="px-4 py-3 font-semibold w-32">Authentication</th>
                            <th className="px-4 py-3 font-semibold w-32">API Version</th>
                            <th className="px-4 py-3 font-semibold w-40">Updated</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {isLoading && providers.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground text-sm">Loading providers...</td>
                            </tr>
                        ) : visibleProviders.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground text-sm">No providers found.</td>
                            </tr>
                        ) : visibleProviders.map((record) => (
                            <tr 
                                key={record.id} 
                                onClick={() => openInspector("ai_provider" as any, { ...record, name: record.provider })}
                                className={cn(
                                    "group hover:bg-muted/30 transition-colors cursor-pointer",
                                    selectedRows.has(record.id) ? "bg-primary/5 hover:bg-primary/10" : ""
                                )}
                            >
                                <td className="px-6 py-4" onClick={(e) => toggleRow(record.id, e)}>
                                    <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.has(record.id)} readOnly />
                                </td>
                                <td className="px-4 py-4 font-medium text-foreground flex items-center gap-2">
                                    <Database className="size-4 text-primary" />
                                    {record.provider}
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        record.status === "Active" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                        record.status === "Degraded" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                        "bg-red-500/10 text-red-500 border border-red-500/20"
                                    )}>
                                        {record.status}
                                    </span>
                                </td>
                                <td className="px-4 py-4 font-medium text-foreground flex items-center gap-2">
                                    <Globe className="size-3.5 text-muted-foreground" />
                                    {record.regions}
                                </td>
                                <td className="px-4 py-4 font-medium text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Key className="size-3.5" />
                                        {record.auth}
                                    </div>
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {record.apiVersion}
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
