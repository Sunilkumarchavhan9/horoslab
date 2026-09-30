"use client";

import React, { useState, useEffect } from "react";
import { Search, RefreshCw, Activity, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "@/components/mission-control/universal-inspector";
import { useAiExecutionOverview } from "../../use-ai-execution-overview";
import { probeDhyraAiProviderHealth } from "@/lib/dhyra-api";
import { LiveFilterDropdown } from "@/components/mission-control/ui/live-filter-dropdown";

type ProviderHealthRow = {
    id: string;
    provider: string;
    uptime: string;
    latency: string;
    errorRate: string;
    rateLimits: string;
    degradation: string;
    incidents: number;
    status: string;
    updated: string;
};

function displayHealthStatus(value: unknown): string {
    const status = String(value ?? "-").toLowerCase();
    return status === "healthy" ? "Healthy" : status === "degraded" ? "Degraded" : status === "offline" ? "Offline" : status === "unconfigured" ? "Unconfigured" : "-";
}

export function ProviderHealthView({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [providerFilter, setProviderFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [degradationFilter, setDegradationFilter] = useState("All");
    const [healthChecks, setHealthChecks] = useState<ProviderHealthRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProbing, setIsProbing] = useState(false);
    const [lastProbeAt, setLastProbeAt] = useState<string | null>(null);
    const overview = useAiExecutionOverview(workspaceId);

    const fetchHealth = React.useCallback(async () => {
        try {
            setIsLoading(true);
            const latestCheckAt = overview.providerHealth.reduce<string | null>((latest, health) => {
                const checkedAt = typeof health.checked_at === "string" ? health.checked_at : null;
                return checkedAt && (!latest || checkedAt > latest) ? checkedAt : latest;
            }, null);
            if (!lastProbeAt || !latestCheckAt || latestCheckAt >= lastProbeAt) {
                setHealthChecks(overview.providerHealth.map((health) => ({ id: String(health.provider ?? "provider"), provider: String(health.provider ?? "-"), status: displayHealthStatus(health.status), latency: String(health.latency_ms ?? "-"), uptime: String(health.uptime ?? "-"), errorRate: String(health.errorRate ?? "-"), rateLimits: String(health.rateLimits ?? "-"), degradation: String(health.degradation ?? "-"), incidents: Number(health.incidents ?? 0), updated: health.checked_at ? new Date(String(health.checked_at)).toLocaleString() : "-" })) as ProviderHealthRow[]);
            }
            /* 
            if (res.ok) {
                const { data } = await res.json();
                setHealthChecks(data.map((h: any) => ({
                    id: h.id,
                    provider: h.provider,
                    uptime: h.status === "healthy" ? "99.99%" : "98.5%",
                    latency: h.latencyMs ? `${h.latencyMs}ms` : "150ms",
                    errorRate: h.status === "healthy" ? "0.01%" : "1.2%",
                    rateLimits: "Normal",
                    degradation: "None",
                    incidents: h.status === "healthy" ? 0 : 1,
                    status: h.status === "healthy" ? "Healthy" : "Degraded",
                    updated: new Date(h.checkedAt).toLocaleString()
                })));
            }
        */
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [lastProbeAt, overview.providerHealth]);

    useEffect(() => {
        fetchHealth();
    }, [fetchHealth]);

    const visibleHealthChecks = healthChecks.filter((health) =>
        (providerFilter === "All" || health.provider === providerFilter) &&
        (statusFilter === "All" || health.status === statusFilter) &&
        (degradationFilter === "All" || health.degradation === degradationFilter) &&
        `${health.provider} ${health.status} ${health.latency}`.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const probeHealth = async () => {
        if (!workspaceId || isProbing) return;
        setIsProbing(true);
        try {
            const result = await probeDhyraAiProviderHealth(workspaceId, ["openrouter"]);
            setLastProbeAt(result.probedAt);
            setHealthChecks(result.health.map((item) => ({
                id: String(item.provider ?? "provider"),
                provider: String(item.provider ?? "-"),
                status: displayHealthStatus(item.status),
                latency: String(item.latencyMs ?? item.latency_ms ?? "-"),
                uptime: String(item.uptime ?? "-"),
                errorRate: String(item.errorRate ?? "-"),
                rateLimits: String(item.rateLimits ?? "-"),
                degradation: String(item.degradation ?? "-"),
                incidents: Number(item.incidents ?? 0),
                updated: new Date(result.probedAt).toLocaleString(),
            })));
        } finally {
            setIsProbing(false);
        }
    };

    const toggleRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRows(newSet);
    };

    const toggleAll = () => {
        if (selectedRows.size === visibleHealthChecks.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(visibleHealthChecks.map(h => h.id)));
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 bg-background">
                <div className="flex items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Provider Health Dashboard</h1>
                    <div className="flex items-center gap-2">
                        <button onClick={probeHealth} disabled={isProbing || !workspaceId} className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50">
                            <Activity className={cn("size-3.5", isProbing && "animate-pulse")} />
                            {isProbing ? "Probing..." : "Probe Health"}
                        </button>
                        <button onClick={fetchHealth} disabled={isLoading} className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm disabled:opacity-50">
                            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
                            Refresh
                        </button>
                    </div>
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
                        
                        <LiveFilterDropdown label="Provider" value={providerFilter} options={["All", ...Array.from(new Set(healthChecks.map((health) => health.provider)))]} onChange={setProviderFilter} />
                        <LiveFilterDropdown label="Status" value={statusFilter} options={["All", ...Array.from(new Set(healthChecks.map((health) => health.status)))]} onChange={setStatusFilter} />
                        <LiveFilterDropdown label="Degradation" value={degradationFilter} options={["All", ...Array.from(new Set(healthChecks.map((health) => health.degradation)))]} onChange={setDegradationFilter} />
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-xs font-medium text-muted-foreground">{healthChecks.length} Records</span>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === visibleHealthChecks.length && visibleHealthChecks.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold w-40">Provider</th>
                            <th className="px-4 py-3 font-semibold w-32">Uptime</th>
                            <th className="px-4 py-3 font-semibold w-32">Latency</th>
                            <th className="px-4 py-3 font-semibold w-32">Error Rate</th>
                            <th className="px-4 py-3 font-semibold w-32">Rate Limits</th>
                            <th className="px-4 py-3 font-semibold w-32">Degradation</th>
                            <th className="px-4 py-3 font-semibold w-32 text-center">Incidents</th>
                            <th className="px-4 py-3 font-semibold w-32">Status</th>
                            <th className="px-4 py-3 font-semibold w-40">Updated</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {isLoading && healthChecks.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="px-6 py-8 text-center text-muted-foreground text-sm">Loading health checks...</td>
                            </tr>
                        ) : visibleHealthChecks.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="px-6 py-8 text-center text-muted-foreground text-sm">No health records found.</td>
                            </tr>
                        ) : visibleHealthChecks.map((record) => (
                            <tr 
                                key={record.id} 
                        onClick={() => openInspector("intelligence", { ...record, name: `${record.provider} Health` })}
                                className={cn(
                                    "group hover:bg-muted/30 transition-colors cursor-pointer",
                                    selectedRows.has(record.id) ? "bg-primary/5 hover:bg-primary/10" : ""
                                )}
                            >
                                <td className="px-6 py-4" onClick={(e) => toggleRow(record.id, e)}>
                                    <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.has(record.id)} readOnly />
                                </td>
                                <td className="px-4 py-4 font-bold text-foreground flex items-center gap-2">
                                    <Activity className="size-4 text-blue-500" />
                                    {record.provider}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-emerald-500 font-medium">
                                    {record.uptime}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-foreground">
                                    {record.latency}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-foreground">
                                    {record.errorRate}
                                </td>
                                <td className="px-4 py-4 font-medium text-foreground">
                                    {record.rateLimits}
                                </td>
                                <td className="px-4 py-4 font-medium text-muted-foreground">
                                    {record.degradation}
                                </td>
                                <td className="px-4 py-4 text-center font-mono text-foreground">
                                    {record.incidents}
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        record.status === "Healthy" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                        "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                    )}>
                                        {record.status === "Healthy" && <CheckCircle2 className="size-3" />}
                                        {record.status === "Degraded" && <AlertCircle className="size-3" />}
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
