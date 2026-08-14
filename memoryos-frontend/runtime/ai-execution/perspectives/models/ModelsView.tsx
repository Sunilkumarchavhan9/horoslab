"use client";

import React, { useState, useEffect } from "react";
import { Search, RefreshCw, Bot, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "@/components/mission-control/universal-inspector";
import { useAiExecutionOverview } from "../../use-ai-execution-overview";
import { LiveFilterDropdown } from "@/components/mission-control/ui/live-filter-dropdown";

type ModelRow = {
    id: string;
    name: string;
    provider: string;
    contextWindow: string;
    modalities: string[];
    toolCalling: boolean;
    structuredOutput: boolean;
    reasoning: boolean;
    version: string;
    status: string;
};

function hasCapability(capabilities: string[], ...names: string[]): boolean {
    const normalized = new Set(capabilities.map((capability) => capability.toLowerCase().replace(/[\s-]/g, "_")));
    return names.some((name) => normalized.has(name));
}

function modelModalities(capabilities: string[]): string[] {
    const modalities: string[] = [];
    if (hasCapability(capabilities, "vision")) modalities.push("Vision");
    if (hasCapability(capabilities, "audio")) modalities.push("Audio");
    if (hasCapability(capabilities, "ocr")) modalities.push("OCR");
    return modalities;
}

export function ModelsView({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [providerFilter, setProviderFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [models, setModels] = useState<ModelRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const overview = useAiExecutionOverview(workspaceId);

    const fetchModels = React.useCallback(async () => {
        try {
            setIsLoading(true);
            setModels(overview.catalog.map((item) => {
                const rawCapabilities = Array.isArray(item.capabilities)
                    ? item.capabilities.filter((value): value is string => typeof value === "string")
                    : [];
                return {
                    id: String(item.id ?? item.model ?? "model"),
                    name: String(item.model ?? item.name ?? "-"),
                    provider: String(item.provider ?? "-"),
                    contextWindow: typeof item.contextWindow === "number" ? item.contextWindow.toLocaleString() : "-",
                    modalities: modelModalities(rawCapabilities),
                    toolCalling: hasCapability(rawCapabilities, "tools", "tool_calling", "function_calling"),
                    structuredOutput: hasCapability(rawCapabilities, "structured_output", "structuredoutput"),
                    reasoning: hasCapability(rawCapabilities, "reasoning"),
                    version: String(item.version ?? "-"),
                    status: item.available === false ? "Unavailable" : "Available",
                };
            }) as ModelRow[]);
            /* 
            if (res.ok) {
                const { data } = await res.json();
                setModels(data);
            }
        */
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [overview.catalog]);

    useEffect(() => {
        fetchModels();
    }, [fetchModels]);

    const visibleModels = models.filter((model) =>
        (providerFilter === "All" || model.provider === providerFilter) &&
        (statusFilter === "All" || model.status === statusFilter) &&
        `${model.name} ${model.provider} ${model.version}`.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const toggleRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRows(newSet);
    };

    const toggleAll = () => {
        if (selectedRows.size === visibleModels.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(visibleModels.map(m => m.id)));
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 bg-background">
                <div className="flex items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Models</h1>
                    <button 
                        onClick={fetchModels}
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
                        
                        <LiveFilterDropdown label="Provider" value={providerFilter} options={["All", ...Array.from(new Set(models.map((model) => model.provider)))]} onChange={setProviderFilter} />
                        <LiveFilterDropdown label="Status" value={statusFilter} options={["All", ...Array.from(new Set(models.map((model) => model.status)))]} onChange={setStatusFilter} />
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-xs font-medium text-muted-foreground">{visibleModels.length} Models</span>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === visibleModels.length && visibleModels.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold w-48">Model</th>
                            <th className="px-4 py-3 font-semibold w-32">Provider</th>
                            <th className="px-4 py-3 font-semibold w-32">Context Window</th>
                            <th className="px-4 py-3 font-semibold w-32">Modalities</th>
                            <th className="px-4 py-3 font-semibold w-32 text-center">Tool Calling</th>
                            <th className="px-4 py-3 font-semibold w-32 text-center">Structured Output</th>
                            <th className="px-4 py-3 font-semibold w-32 text-center">Reasoning</th>
                            <th className="px-4 py-3 font-semibold w-32">Version</th>
                            <th className="px-4 py-3 font-semibold w-32">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {isLoading && models.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="px-6 py-8 text-center text-muted-foreground text-sm">Loading models...</td>
                            </tr>
                        ) : visibleModels.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="px-6 py-8 text-center text-muted-foreground text-sm">No models found.</td>
                            </tr>
                        ) : visibleModels.map((record) => (
                            <tr 
                                key={record.id} 
                                onClick={() => openInspector("intelligence", { ...record, name: record.name })}
                                className={cn(
                                    "group hover:bg-muted/30 transition-colors cursor-pointer",
                                    selectedRows.has(record.id) ? "bg-primary/5 hover:bg-primary/10" : ""
                                )}
                            >
                                <td className="px-6 py-4" onClick={(e) => toggleRow(record.id, e)}>
                                    <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.has(record.id)} readOnly />
                                </td>
                                <td className="px-4 py-4 font-bold text-foreground flex items-center gap-2">
                                    <Bot className="size-4 text-zinc-400" />
                                    {record.name}
                                </td>
                                <td className="px-4 py-4 font-medium text-muted-foreground">
                                    {record.provider}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {record.contextWindow}
                                </td>
                                <td className="px-4 py-4 font-medium text-foreground">
                                    {record.modalities.length > 0 ? record.modalities.join(", ") : "-"}
                                </td>
                                <td className="px-4 py-4 text-center">
                                    {record.toolCalling ? <ShieldCheck aria-label="Supported" className="size-4 text-emerald-500 mx-auto" /> : "-"}
                                </td>
                                <td className="px-4 py-4 text-center">
                                    {record.structuredOutput ? <ShieldCheck aria-label="Supported" className="size-4 text-emerald-500 mx-auto" /> : "-"}
                                </td>
                                <td className="px-4 py-4 text-center">
                                    {record.reasoning ? <ShieldCheck aria-label="Supported" className="size-4 text-amber-500 mx-auto" /> : "-"}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {record.version}
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        record.status === "Active" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                        record.status === "Beta" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                        "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20"
                                    )}>
                                        {record.status}
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
