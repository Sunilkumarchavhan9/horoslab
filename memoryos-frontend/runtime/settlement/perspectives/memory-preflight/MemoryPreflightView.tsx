"use client";

import React, { useState } from "react";
import {
    Search, ChevronDown, ChevronLeft, ChevronRight,
    RefreshCw, BrainCircuit, ExternalLink, Network, Database
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "@/components/mission-control/universal-inspector";

type MemoryRow = {
    id: string;
    mission: string;
    institution: string;
    memoryType: string;
    source: string;
    relevance: "High" | "Medium" | "Low";
    created: string;
    updated: string;
};

export function MemoryPreflightView() {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [memories, setMemories] = useState<MemoryRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchMemories = React.useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/epoch/settlement/memories");
            if (res.ok) {
                const { data } = await res.json();
                setMemories(data.map((m: any) => ({
                    id: m.id,
                    mission: m.linkedOutcome || "N/A",
                    institution: "System",
                    memoryType: m.type,
                    source: m.sourceItemId || "System",
                    relevance: m.confidenceScore > 80 ? "High" : m.confidenceScore > 50 ? "Medium" : "Low",
                    created: new Date(m.createdAt).toLocaleString(),
                    updated: new Date(m.updatedAt).toLocaleString()
                })));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchMemories();
    }, [fetchMemories]);

    const toggleRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRows(newSet);
    };

    const toggleAll = () => {
        if (selectedRows.size === memories.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(memories.map(m => m.id)));
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 border-b border-border bg-card">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <BrainCircuit className="size-5 text-indigo-500" />
                            Memory Preflight
                        </h1>
                        <span className="text-xs text-muted-foreground mt-1">Prepare relevant memory before mission execution.</span>
                    </div>
                    <button 
                        onClick={fetchMemories}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
                        Refresh
                    </button>
                </div>

                <div className="flex items-center justify-between px-6 py-3 bg-muted/20 border-t border-border">
                    <div className="flex items-center gap-4 flex-1 overflow-x-auto custom-scrollbar pb-1">
                        <div className="relative w-64 shrink-0">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search Memory..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-8 pl-9 pr-3 text-xs bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/70 text-foreground shadow-sm"
                            />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shadow-sm">
                                Mission
                                <ChevronDown className="size-3" />
                            </button>
                            <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shadow-sm">
                                Institution
                                <ChevronDown className="size-3" />
                            </button>
                            <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shadow-sm">
                                Memory Type
                                <ChevronDown className="size-3" />
                            </button>
                            <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shadow-sm">
                                Status
                                <ChevronDown className="size-3" />
                            </button>
                            <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shadow-sm">
                                Date Range
                                <ChevronDown className="size-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background/50">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10 shadow-[0_1px_0_rgba(255,255,255,0.1)]">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === memories.length && memories.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold w-40">Memory Record</th>
                            <th className="px-4 py-3 font-semibold w-32">Mission</th>
                            <th className="px-4 py-3 font-semibold w-40">Institution</th>
                            <th className="px-4 py-3 font-semibold w-48">Memory Type</th>
                            <th className="px-4 py-3 font-semibold w-40">Source</th>
                            <th className="px-4 py-3 font-semibold w-32">Relevance</th>
                            <th className="px-4 py-3 font-semibold w-32">Created</th>
                            <th className="px-4 py-3 font-semibold w-32">Updated</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {isLoading && memories.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-6 py-8 text-center text-muted-foreground text-sm">Loading memories...</td>
                            </tr>
                        ) : memories.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-6 py-8 text-center text-muted-foreground text-sm">No memories found.</td>
                            </tr>
                        ) : memories.map((record) => (
                            <tr
                                key={record.id}
                                onClick={() => openInspector("memory_preflight" as any, { ...record, context: 'settlement', name: `Memory ${record.id}` })}
                                className={cn(
                                    "group hover:bg-muted/30 transition-colors cursor-pointer",
                                    selectedRows.has(record.id) ? "bg-primary/5 hover:bg-primary/10" : ""
                                )}
                            >
                                <td className="px-6 py-4" onClick={(e) => toggleRow(record.id, e)}>
                                    <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.has(record.id)} readOnly />
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] font-bold text-foreground flex items-center gap-2">
                                    <Database className="size-3.5 text-indigo-400" />
                                    {record.id}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {record.mission}
                                </td>
                                <td className="px-4 py-4 font-medium text-foreground">
                                    {record.institution}
                                </td>
                                <td className="px-4 py-4">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                                        {record.memoryType}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-muted-foreground">
                                    {record.source}
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        record.relevance === "High" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                            record.relevance === "Medium" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                                "bg-muted text-muted-foreground border border-border"
                                    )}>
                                        {record.relevance}
                                    </span>
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {record.created}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {record.updated}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-card shrink-0">
                <span className="text-xs text-muted-foreground">Showing {memories.length} memories</span>
                <div className="flex items-center gap-2">
                    <button className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50">
                        <ChevronLeft className="size-4" />
                    </button>
                    <button className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50">
                        <ChevronRight className="size-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
