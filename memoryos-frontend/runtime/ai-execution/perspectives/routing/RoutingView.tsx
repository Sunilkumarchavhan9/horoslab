"use client";

import React, { useState, useEffect } from "react";
import { Search, RefreshCw, Route, CheckCircle2, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "@/components/mission-control/universal-inspector";
import { useAiExecutionOverview } from "../../use-ai-execution-overview";
import { LiveFilterDropdown } from "@/components/mission-control/ui/live-filter-dropdown";
import { executeDhyraAiTest } from "@/lib/dhyra-api";

type RoutingRow = {
    id: string;
    mission: string;
    worker: string;
    model: string;
    provider: string;
    strategy: string;
    latency: string;
    cost: string;
    privacyLevel: string;
    status: string;
    updated: string;
};

export function RoutingView({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [missionFilter, setMissionFilter] = useState("All");
    const [workerFilter, setWorkerFilter] = useState("All");
    const [providerFilter, setProviderFilter] = useState("All");
    const [strategyFilter, setStrategyFilter] = useState("All");
    const [routings, setRoutings] = useState<RoutingRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [testPrompt, setTestPrompt] = useState("Return exactly: DHYRA_TEST_OK");
    const [testResult, setTestResult] = useState<string | null>(null);
    const [testError, setTestError] = useState<string | null>(null);
    const [testing, setTesting] = useState(false);
    const overview = useAiExecutionOverview(workspaceId);

    const fetchRouting = React.useCallback(async () => {
        try {
            setIsLoading(true);
            const executions = overview.executions.map((execution) => {
                const provider = execution.provider && typeof execution.provider === "object"
                    ? (execution.provider as Record<string, unknown>).displayName ?? (execution.provider as Record<string, unknown>).provider
                    : execution.provider;
                const success = execution.success !== false;
                return {
                    id: String(execution.id ?? `execution-${execution.createdAt ?? Date.now()}`),
                    mission: String(execution.missionId ?? "No mission"),
                    worker: String(execution.workerId ?? "No worker"),
                    model: String(execution.model ?? "-"),
                    provider: String(provider ?? execution.providerId ?? "-"),
                    strategy: "execution",
                    latency: typeof execution.latencyMs === "number" ? `${execution.latencyMs}ms` : "-",
                    cost: typeof execution.estimatedCost === "number" ? `$${execution.estimatedCost.toFixed(4)}` : "-",
                    privacyLevel: String(execution.privacy ?? "tenant"),
                    status: success ? "Completed" : "Failed",
                    updated: execution.createdAt ? new Date(String(execution.createdAt)).toLocaleString() : "-",
                };
            });
            const endpoints = overview.endpoints.map((route) => ({
                id: String(route.id ?? "route"),
                mission: "Catalog route",
                worker: String(route.workerId ?? "No worker"),
                model: String(route.model ?? "-"),
                provider: String(route.provider ?? route.endpoint ?? "-"),
                strategy: "catalog",
                latency: typeof route.latencyMs === "number" ? `${route.latencyMs}ms` : "-",
                cost: typeof route.costPer1kTokens === "number" ? `$${route.costPer1kTokens.toFixed(4)}/1k` : "-",
                privacyLevel: String(route.privacy ?? "-"),
                status: String(route.available === false ? "Unavailable" : "Available"),
                updated: "-",
            }));
            setRoutings((executions.length > 0 ? executions : endpoints) as RoutingRow[]);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [overview.endpoints, overview.executions]);

    useEffect(() => {
        fetchRouting();
    }, [fetchRouting]);

    const visibleRoutings = routings.filter((route) =>
        (missionFilter === "All" || route.mission === missionFilter) &&
        (workerFilter === "All" || route.worker === workerFilter) &&
        (providerFilter === "All" || route.provider === providerFilter) &&
        (strategyFilter === "All" || route.strategy === strategyFilter) &&
        `${route.mission} ${route.worker} ${route.model} ${route.provider}`.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const toggleRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRows(newSet);
    };

    const toggleAll = () => {
        if (selectedRows.size === visibleRoutings.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(visibleRoutings.map(r => r.id)));
    };

    const runExecutionTest = async () => {
        if (!workspaceId || testing || !testPrompt.trim()) return;
        setTesting(true);
        setTestResult(null);
        setTestError(null);
        try {
            const result = await executeDhyraAiTest(workspaceId, testPrompt.trim());
            const output = result.output ?? result.text ?? result.content ?? result;
            setTestResult(typeof output === "string" ? output : JSON.stringify(output));
        } catch (error) {
            setTestError(error instanceof Error ? error.message : "AI execution test failed.");
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 bg-background">
                <div className="flex items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Routing Explorer</h1>
                    <div className="flex items-center gap-2">
                        <button onClick={runExecutionTest} disabled={testing || !workspaceId} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm disabled:opacity-50">{testing ? "Running..." : "Run AI test"}</button>
                        <button onClick={fetchRouting} disabled={isLoading} className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm disabled:opacity-50"><RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />Refresh</button>
                    </div>
                </div>

                <div className="mx-6 mb-3 rounded-md border border-border bg-muted/20 p-3">
                    <label className="block text-xs font-semibold text-foreground">Live OpenRouter test<input value={testPrompt} onChange={(event) => setTestPrompt(event.target.value)} className="mt-2 h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" /></label>
                    {testResult ? <p className="mt-2 text-xs text-emerald-600">Response: {testResult}</p> : null}
                    {testError ? <p className="mt-2 text-xs text-red-600">{testError}</p> : null}
                    <p className="mt-2 text-xs text-muted-foreground">Standalone provider tests have no mission or worker assignment. Mission runs populate those fields.</p>
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
                        
                        <LiveFilterDropdown label="Mission" value={missionFilter} options={["All", ...Array.from(new Set(routings.map((route) => route.mission)))]} onChange={setMissionFilter} />
                        <LiveFilterDropdown label="Worker" value={workerFilter} options={["All", ...Array.from(new Set(routings.map((route) => route.worker)))]} onChange={setWorkerFilter} />
                        <LiveFilterDropdown label="Provider" value={providerFilter} options={["All", ...Array.from(new Set(routings.map((route) => route.provider)))]} onChange={setProviderFilter} />
                        <LiveFilterDropdown label="Routing Strategy" value={strategyFilter} options={["All", ...Array.from(new Set(routings.map((route) => route.strategy)))]} onChange={setStrategyFilter} />
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-xs font-medium text-muted-foreground">{routings.length} Routes</span>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === visibleRoutings.length && visibleRoutings.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold w-32">Mission</th>
                            <th className="px-4 py-3 font-semibold w-40">Selected Worker</th>
                            <th className="px-4 py-3 font-semibold w-40">Selected Model</th>
                            <th className="px-4 py-3 font-semibold w-32">Provider</th>
                            <th className="px-4 py-3 font-semibold w-40">Routing Strategy</th>
                            <th className="px-4 py-3 font-semibold w-32">Latency</th>
                            <th className="px-4 py-3 font-semibold w-32">Cost</th>
                            <th className="px-4 py-3 font-semibold w-32">Privacy Level</th>
                            <th className="px-4 py-3 font-semibold w-32">Status</th>
                            <th className="px-4 py-3 font-semibold w-44">Updated</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {isLoading && routings.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="px-6 py-8 text-center text-muted-foreground text-sm">Loading routes...</td>
                            </tr>
                        ) : visibleRoutings.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="px-6 py-8 text-center text-muted-foreground text-sm">No routing history found.</td>
                            </tr>
                        ) : visibleRoutings.map((record) => (
                            <tr 
                                key={record.id} 
                                onClick={() => openInspector("intelligence", { ...record, name: `Route ${record.id.substring(0, 8)}` })}
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
                                <td className="px-4 py-4 font-medium text-foreground">
                                    {record.worker}
                                </td>
                                <td className="px-4 py-4 font-medium text-foreground">
                                    {record.model}
                                </td>
                                <td className="px-4 py-4 font-medium text-muted-foreground">
                                    {record.provider}
                                </td>
                                <td className="px-4 py-4 font-medium text-muted-foreground flex items-center gap-2">
                                    <Route className="size-3.5 text-blue-500" />
                                    {record.strategy}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-foreground">
                                    {record.latency}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-foreground">
                                    {record.cost}
                                </td>
                                <td className="px-4 py-4 text-muted-foreground">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-500/10 text-zinc-500 border border-zinc-500/20">
                                        <Navigation className="size-3" />
                                        {record.privacyLevel}
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        record.status === "Completed" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                        "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                    )}>
                                        {record.status === "Completed" && <CheckCircle2 className="size-3" />}
                                        {record.status}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-xs text-muted-foreground">{record.updated}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
