"use client";

import React, { useState } from "react";
import { Search, ListFilter, Calendar, ChevronDown, CheckCircle2, TrendingUp, Sparkles, FileText, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useInspector } from "../universal-inspector";
import { useProductionIntelligence } from "./use-production-intelligence";
import { LiveFilterDropdown } from "../ui/live-filter-dropdown";

const MOCK_IMPROVEMENTS = [
    { 
        id: "IMP-492",
        proposal: "FIX-813",
        before: "94.5% Success",
        after: "98.2% Success",
        delta: "+3.7%",
        verification: "A/B Replay",
        status: "Verified",
        version: "v1.2.5"
    },
    { 
        id: "IMP-491",
        proposal: "FIX-812",
        before: "4.5s Latency",
        after: "2.1s Latency",
        delta: "-2.4s",
        verification: "Live Canary",
        status: "Deployed",
        version: "v1.2.4"
    },
    { 
        id: "IMP-490",
        proposal: "FIX-809",
        before: "$0.04/task",
        after: "$0.02/task",
        delta: "-50%",
        verification: "Shadow Run",
        status: "Verified",
        version: "v1.2.3"
    },
];

export function IntelligenceImprovements({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const intelligence = useProductionIntelligence(workspaceId);
    const improvements = intelligence.improvements.length ? intelligence.improvements.map((item) => ({
        id: String(item.id ?? "improvement"), proposal: String(item.clusterId ?? "-"), before: JSON.stringify(item.baseline ?? "-"), after: JSON.stringify(item.after ?? "-"), delta: JSON.stringify(item.delta ?? "-"), verification: "Replay", status: item.verified ? "Verified" : "Pending", version: "-",
    })) : [];
    const visibleImprovements = improvements.filter((row) => JSON.stringify(row).toLowerCase().includes(searchQuery.trim().toLowerCase()) && (statusFilter === "All" || String(row.status) === statusFilter));

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col shrink-0 border-b border-border bg-card">
                <div className="flex items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Improvements</h1>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between px-6 py-3 bg-muted/20 border-t border-border overflow-visible">
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
                        
                        <LiveFilterDropdown label="Status" value={statusFilter} options={["All", ...Array.from(new Set(improvements.map((row) => String(row.status))))]} onChange={setStatusFilter} />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background/50 custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10 shadow-[0_1px_0_rgba(255,255,255,0.1)]">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold">Improvement ID</th>
                            <th className="px-4 py-3 font-semibold">Related Proposal</th>
                            <th className="px-4 py-3 font-semibold">Before</th>
                            <th className="px-4 py-3 font-semibold">After</th>
                            <th className="px-4 py-3 font-semibold">Delta</th>
                            <th className="px-4 py-3 font-semibold">Verification</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold text-right">Version</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {visibleImprovements.map((row) => (
                            <tr 
                                key={row.id} 
                                onClick={() => openInspector("intelligence", { type: "improvement", data: row })}
                                className="group hover:bg-muted/30 transition-colors cursor-pointer"
                            >
                                <td className="px-6 py-4 font-mono text-xs text-amber-500 font-semibold flex items-center gap-2">
                                    <Sparkles className="size-3.5" />
                                    {row.id}
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer w-fit">
                                        <FileText className="size-3" />
                                        {row.proposal}
                                    </div>
                                </td>
                                <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{row.before}</td>
                                <td className="px-4 py-4 font-mono text-xs text-foreground font-semibold flex items-center gap-2">
                                    <ArrowRight className="size-3 text-muted-foreground" />
                                    {row.after}
                                </td>
                                <td className="px-4 py-4">
                                    <Badge variant="outline" className={cn(
                                        "font-mono text-[10px] tracking-wide",
                                        row.delta.startsWith("+") ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/5" : "text-blue-500 border-blue-500/30 bg-blue-500/5"
                                    )}>
                                        <TrendingUp className="size-3 mr-1" />
                                        {row.delta}
                                    </Badge>
                                </td>
                                <td className="px-4 py-4 text-xs font-medium text-muted-foreground">{row.verification}</td>
                                <td className="px-4 py-4">
                                    <Badge variant="outline" className={cn(
                                        "font-mono text-[10px] tracking-wide",
                                        row.status === "Verified" ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/5" : "text-blue-500 border-blue-500/30 bg-blue-500/5"
                                    )}>
                                        <CheckCircle2 className="size-3 mr-1" />
                                        {row.status}
                                    </Badge>
                                </td>
                                <td className="px-4 py-4 text-right font-mono text-xs text-muted-foreground">{row.version}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
