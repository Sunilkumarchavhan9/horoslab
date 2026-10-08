"use client";

import React, { useState } from "react";
import { 
    Search, ChevronDown, ChevronLeft, ChevronRight,
    RefreshCw, FileCheck, CheckCircle2, XCircle, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "@/components/mission-control/universal-inspector";

type OutcomeRow = {
    id: string;
    mission: string;
    institution: string;
    outcome: string;
    worker: string;
    lessons: number;
    mistakes: number;
    improvements: number;
    status: "Success" | "Failed" | "Warning";
    completed: string;
    updated: string;
};

export function MissionOutcomesView() {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [outcomes, setOutcomes] = useState<OutcomeRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOutcomes = React.useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/horos/settlement/outcomes");
            if (res.ok) {
                const { data } = await res.json();
                setOutcomes(data.map((o: any) => ({
                    id: o.id,
                    mission: o.mission?.title || o.missionId || "Unknown Mission",
                    institution: o.institution?.name || o.institutionId || "Unknown Institution",
                    outcome: "Mission Outcome",
                    worker: "System Agent",
                    lessons: Array.isArray(o.lessons) ? o.lessons.length : 0,
                    mistakes: Array.isArray(o.mistakes) ? o.mistakes.length : 0,
                    improvements: Array.isArray(o.suggestedImprovements) ? o.suggestedImprovements.length : 0,
                    status: "Success",
                    completed: new Date(o.createdAt).toLocaleString(),
                    updated: new Date(o.updatedAt).toLocaleString()
                })));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchOutcomes();
    }, [fetchOutcomes]);

    const toggleRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRows(newSet);
    };

    const toggleAll = () => {
        if (selectedRows.size === outcomes.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(outcomes.map(m => m.id)));
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 border-b border-border bg-card">
                <div className="flex items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Mission Outcomes</h1>
                    <button 
                        onClick={fetchOutcomes}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
                        Refresh
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between px-6 py-3 bg-muted/20 border-t border-border overflow-x-auto custom-scrollbar">
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
                        
                        <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0">
                            Mission <ChevronDown className="size-3" />
                        </button>
                        <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0">
                            Institution <ChevronDown className="size-3" />
                        </button>
                        <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0">
                            Outcome Type <ChevronDown className="size-3" />
                        </button>
                        <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0">
                            Worker <ChevronDown className="size-3" />
                        </button>
                        <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0">
                            Status <ChevronDown className="size-3" />
                        </button>
                        <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0">
                            <Calendar className="size-3.5" /> Date Range
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-xs font-medium text-muted-foreground">{outcomes.length} Outcomes Found</span>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background/50 custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10 shadow-[0_1px_0_rgba(255,255,255,0.1)]">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === outcomes.length && outcomes.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold w-32">Mission</th>
                            <th className="px-4 py-3 font-semibold w-56">Outcome</th>
                            <th className="px-4 py-3 font-semibold w-24 text-center">Lessons</th>
                            <th className="px-4 py-3 font-semibold w-24 text-center">Mistakes</th>
                            <th className="px-4 py-3 font-semibold w-32 text-center">Improvements</th>
                            <th className="px-4 py-3 font-semibold w-24">Status</th>
                            <th className="px-4 py-3 font-semibold w-32">Completed</th>
                            <th className="px-4 py-3 font-semibold w-32">Updated</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {isLoading && outcomes.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-6 py-8 text-center text-muted-foreground text-sm">Loading outcomes...</td>
                            </tr>
                        ) : outcomes.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-6 py-8 text-center text-muted-foreground text-sm">No outcomes found.</td>
                            </tr>
                        ) : outcomes.map((record) => (
                            <tr 
                                key={record.id} 
                                onClick={() => openInspector("mission_outcome" as any, { ...record, context: 'settlement', name: `Outcome ${record.id}` })}
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
                                    {record.outcome}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-foreground text-center">
                                    {record.lessons}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-foreground text-center">
                                    {record.mistakes}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-foreground text-center">
                                    {record.improvements}
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        record.status === "Success" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                        record.status === "Warning" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                        "bg-red-500/10 text-red-500 border border-red-500/20"
                                    )}>
                                        {record.status === "Success" && <CheckCircle2 className="size-3" />}
                                        {record.status === "Warning" && <RefreshCw className="size-3" />}
                                        {record.status === "Failed" && <XCircle className="size-3" />}
                                        {record.status}
                                    </span>
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {record.completed}
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
