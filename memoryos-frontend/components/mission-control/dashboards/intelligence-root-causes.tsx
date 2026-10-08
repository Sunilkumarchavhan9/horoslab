"use client";

import React, { useState } from "react";
import { Search, Filter, Download, Plus, Target, CheckCircle2, ChevronDown, ListFilter, Calendar, Eye, User, Link2, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useInspector } from "../universal-inspector";
import { useProductionIntelligence } from "./use-production-intelligence";
import { exportLiveRows } from "../export-live-rows";
import { LiveFilterDropdown } from "../ui/live-filter-dropdown";

const MOCK_ROOT_CAUSES = [
    { 
        id: "RC-4091", 
        hypothesis: "API Gateway rate limit is too strict for concurrent agent requests.",
        cluster: "CLUS-901",
        confidence: 0.92,
        evidenceCount: 14,
        status: "Confirmed",
        created: "2026-08-01 08:30",
        updated: "15m ago",
        reviewer: "Alice System"
    },
    { 
        id: "RC-4092", 
        hypothesis: "JSON parser fails on unescaped quotes within the model's raw output.",
        cluster: "CLUS-902",
        confidence: 0.78,
        evidenceCount: 8,
        status: "Under Review",
        created: "2026-08-01 09:15",
        updated: "2m ago",
        reviewer: "Bob Developer"
    },
    { 
        id: "RC-4093", 
        hypothesis: "The context window fills up with redundant debug logs, causing eviction of core system prompts.",
        cluster: "CLUS-904",
        confidence: 0.45,
        evidenceCount: 2,
        status: "Hypothesis",
        created: "2026-08-01 06:12",
        updated: "1h ago",
        reviewer: "Unassigned"
    },
    { 
        id: "RC-4094", 
        hypothesis: "Settlement script holds a lock on the ledger table while making an external HTTP call.",
        cluster: "CLUS-905",
        confidence: 0.98,
        evidenceCount: 4,
        status: "Confirmed",
        created: "2026-07-31 14:00",
        updated: "5h ago",
        reviewer: "Charlie DbAdmin"
    },
];

export function IntelligenceRootCauses({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const intelligence = useProductionIntelligence(workspaceId);
    const rootCauses = intelligence.rootCauses.length ? intelligence.rootCauses.map((item) => ({
        id: String(item.id ?? "root-cause"), hypothesis: String(item.hypothesis ?? "-"), cluster: String(item.clusterId ?? "-"), confidence: Number(item.confidence ?? 0),
        evidenceCount: Array.isArray(item.evidence) ? item.evidence.length : Number(item.evidenceCount ?? 0), status: String(item.status ?? "Hypothesis"), created: item.createdAt ? new Date(String(item.createdAt)).toLocaleString() : "-", updated: "-", reviewer: "-",
    })) : [];
    const visibleRootCauses = rootCauses.filter((row) => JSON.stringify(row).toLowerCase().includes(searchQuery.trim().toLowerCase()) && (statusFilter === "All" || String(row.status) === statusFilter));

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col shrink-0 border-b border-border bg-card">
                <div className="flex items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Root Causes</h1>
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => exportLiveRows("horos-root-causes.json", visibleRootCauses)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-sm">
                            <Download className="size-3.5" />
                            Export
                        </button>
                    </div>
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
                        
                        <LiveFilterDropdown label="Status" value={statusFilter} options={["All", ...Array.from(new Set(rootCauses.map((row) => String(row.status))))]} onChange={setStatusFilter} />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background/50 custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10 shadow-[0_1px_0_rgba(255,255,255,0.1)]">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold">Root Cause ID</th>
                            <th className="px-4 py-3 font-semibold">Hypothesis</th>
                            <th className="px-4 py-3 font-semibold">Cluster</th>
                            <th className="px-4 py-3 font-semibold">Confidence</th>
                            <th className="px-4 py-3 font-semibold text-center">Evidence</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Updated</th>
                            <th className="px-4 py-3 font-semibold">Reviewer</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {visibleRootCauses.map((row) => (
                            <tr 
                                key={row.id} 
                                onClick={() => openInspector("intelligence", { type: "root-cause", data: row })}
                                className="group hover:bg-muted/30 transition-colors cursor-pointer"
                            >
                                <td className="px-6 py-4 font-mono text-xs text-blue-400 font-semibold">{row.id}</td>
                                <td className="px-4 py-4 font-medium text-foreground max-w-[300px] truncate">{row.hypothesis}</td>
                                <td className="px-4 py-4 font-mono text-xs text-muted-foreground hover:text-blue-400 transition-colors">{row.cluster}</td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className={cn("h-full rounded-full", row.confidence > 0.8 ? "bg-emerald-500" : row.confidence > 0.5 ? "bg-blue-500" : "bg-orange-500")} 
                                                style={{ width: `${row.confidence * 100}%` }} 
                                            />
                                        </div>
                                        <span className="font-mono text-xs font-bold">{(row.confidence * 100).toFixed(0)}%</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className="inline-flex items-center justify-center bg-muted/50 border border-border/50 text-xs font-mono font-bold text-muted-foreground rounded px-2 py-0.5">
                                        {row.evidenceCount} traces
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                    <Badge variant="outline" className={cn(
                                        "font-mono text-[10px] tracking-wide",
                                        row.status === "Confirmed" ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/5" :
                                        row.status === "Under Review" ? "text-blue-500 border-blue-500/30 bg-blue-500/5" :
                                        "text-orange-500 border-orange-500/30 bg-orange-500/5"
                                    )}>
                                        {row.status}
                                    </Badge>
                                </td>
                                <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{row.updated}</td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <User className="size-3.5" /> {row.reviewer}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
