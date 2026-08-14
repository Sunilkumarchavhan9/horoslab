"use client";

import React, { useState } from "react";
import { Search, Filter, Download, ListFilter, Calendar, ChevronDown, Network, Database, BrainCircuit, Activity, CircleDot, PlayCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useInspector } from "../universal-inspector";
import { useProductionIntelligence } from "./use-production-intelligence";
import { exportLiveRows } from "../export-live-rows";
import { LiveFilterDropdown } from "../ui/live-filter-dropdown";

const MOCK_CLUSTERS = [
    { 
        id: "CLUS-901", 
        title: "Auth Gateway Timeouts", 
        category: "Network", 
        frequency: "High (412/hr)", 
        score: "0.85", 
        interactions: 850, 
        missions: 3, 
        workers: 1, 
        status: "Investigating", 
        updated: "2m ago" 
    },
    { 
        id: "CLUS-902", 
        title: "Malformed Tool Output JSON", 
        category: "Logic", 
        frequency: "Medium (45/hr)", 
        score: "0.42", 
        interactions: 120, 
        missions: 12, 
        workers: 4, 
        status: "Open", 
        updated: "15m ago" 
    },
    { 
        id: "CLUS-903", 
        title: "Rate Limit (HTTP 429) on Scrape", 
        category: "Network", 
        frequency: "Low (5/hr)", 
        score: "0.15", 
        interactions: 15, 
        missions: 1, 
        workers: 2, 
        status: "Resolved", 
        updated: "1h ago" 
    },
    { 
        id: "CLUS-904", 
        title: "Context Window Exceeded", 
        category: "Compute", 
        frequency: "Medium (22/hr)", 
        score: "0.66", 
        interactions: 45, 
        missions: 5, 
        workers: 2, 
        status: "Mitigated", 
        updated: "3h ago" 
    },
    { 
        id: "CLUS-905", 
        title: "Database Deadlock on Settlement", 
        category: "Database", 
        frequency: "Critical (2/hr)", 
        score: "0.95", 
        interactions: 4, 
        missions: 1, 
        workers: 1, 
        status: "Open", 
        updated: "5h ago" 
    }
];

export function IntelligenceClusters({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [severityFilter, setSeverityFilter] = useState("All");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const intelligence = useProductionIntelligence(workspaceId);
    const clusters = intelligence.clusters.length ? intelligence.clusters.map((item) => ({
        id: String(item.id ?? "cluster"), title: String(item.name ?? item.title ?? item.kind ?? "Failure cluster"), category: String(item.category ?? "Failure"),
        frequency: String(item.frequency ?? item.count ?? "-"), score: String(item.averageFailureScore ?? item.score ?? "-"), interactions: Number(item.interactionCount ?? 0),
        missions: Number(item.missionCount ?? 0), workers: Number(item.workerCount ?? 0), status: String(item.status ?? "Open"), updated: item.updatedAt ? new Date(String(item.updatedAt)).toLocaleString() : "-",
    })) : [];
    const visibleClusters = clusters.filter((row) => JSON.stringify(row).toLowerCase().includes(searchQuery.trim().toLowerCase()) && (statusFilter === "All" || String(row.status) === statusFilter) && (categoryFilter === "All" || row.category === categoryFilter) && (severityFilter === "All" || (severityFilter === "High" ? Number(row.score) >= 0.7 : severityFilter === "Medium" ? Number(row.score) >= 0.4 && Number(row.score) < 0.7 : Number(row.score) < 0.4)));

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col shrink-0 border-b border-border bg-card">
                <div className="flex items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Failure Clusters</h1>
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => exportLiveRows("epoch-failure-clusters.json", visibleClusters)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-sm">
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
                        
                        <LiveFilterDropdown label="Severity" value={severityFilter} options={["All", "High", "Medium", "Low"]} onChange={setSeverityFilter} />
                        <LiveFilterDropdown label="Category" value={categoryFilter} options={["All", ...Array.from(new Set(clusters.map((row) => row.category)))]} onChange={setCategoryFilter} />
                        <LiveFilterDropdown label="Status" value={statusFilter} options={["All", ...Array.from(new Set(clusters.map((row) => String(row.status))))]} onChange={setStatusFilter} />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background/50 custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1400px]">
                    <thead className="sticky top-0 bg-card z-10 shadow-[0_1px_0_rgba(255,255,255,0.1)]">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold">Cluster</th>
                            <th className="px-4 py-3 font-semibold">Title</th>
                            <th className="px-4 py-3 font-semibold">Category</th>
                            <th className="px-4 py-3 font-semibold">Frequency</th>
                            <th className="px-4 py-3 font-semibold">Avg Score</th>
                            <th className="px-4 py-3 font-semibold text-right">Interactions</th>
                            <th className="px-4 py-3 font-semibold text-right">Missions</th>
                            <th className="px-4 py-3 font-semibold text-right">Workers</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Updated</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {visibleClusters.map((row) => (
                            <tr 
                                key={row.id} 
                                onClick={() => openInspector("intelligence", { type: "cluster", data: row })}
                                className="group hover:bg-muted/30 transition-colors cursor-pointer"
                            >
                                <td className="px-6 py-4 font-mono text-xs text-blue-400 font-semibold">{row.id}</td>
                                <td className="px-4 py-4 font-semibold text-foreground max-w-[250px] truncate">{row.title}</td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        {row.category === "Network" ? <Network className="size-3.5" /> : 
                                         row.category === "Database" ? <Database className="size-3.5" /> : 
                                         row.category === "Compute" ? <Activity className="size-3.5" /> : 
                                         <BrainCircuit className="size-3.5" />}
                                        {row.category}
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-xs font-medium text-foreground">{row.frequency}</td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className={cn("h-full rounded-full", parseFloat(row.score) > 0.8 ? "bg-red-500" : parseFloat(row.score) > 0.5 ? "bg-orange-500" : "bg-blue-500")} 
                                                style={{ width: `${parseFloat(row.score) * 100}%` }} 
                                            />
                                        </div>
                                        <span className="font-mono text-xs font-bold">{row.score}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 font-mono text-xs text-right text-muted-foreground">{row.interactions}</td>
                                <td className="px-4 py-4 font-mono text-xs text-right text-muted-foreground">{row.missions}</td>
                                <td className="px-4 py-4 font-mono text-xs text-right text-muted-foreground">{row.workers}</td>
                                <td className="px-4 py-4">
                                    <Badge variant="outline" className={cn(
                                        "font-mono text-[10px] tracking-wide",
                                        row.status === "Investigating" ? "text-orange-500 border-orange-500/30 bg-orange-500/5" :
                                        row.status === "Open" ? "text-red-500 border-red-500/30 bg-red-500/5" :
                                        row.status === "Mitigated" ? "text-blue-500 border-blue-500/30 bg-blue-500/5" :
                                        "text-emerald-500 border-emerald-500/30 bg-emerald-500/5"
                                    )}>
                                        {row.status}
                                    </Badge>
                                </td>
                                <td className="px-4 py-4 font-mono text-xs text-muted-foreground flex items-center gap-1.5"><Clock className="size-3.5" /> {row.updated}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
