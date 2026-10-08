"use client";

import React, { useState } from "react";
import { Search, Filter, Download, Plus, Target, CheckCircle2, ChevronDown, ListFilter, Calendar, Activity, XCircle, Database, GitBranch, PlayCircle, BarChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useInspector } from "../universal-inspector";
import { useProductionIntelligence } from "./use-production-intelligence";
import { exportLiveRows } from "../export-live-rows";
import { LiveFilterDropdown } from "../ui/live-filter-dropdown";

const MOCK_EVALUATIONS = [
    { 
        id: "EVAL-7721", 
        mission: "Checkout Flow",
        dataset: "Staging Latency Set (v2)",
        scenario: "API Gateway 504 Simulation",
        status: "Passed",
        coverage: 0.98,
        started: "2026-08-01 09:20",
        completed: "2026-08-01 09:25"
    },
    { 
        id: "EVAL-7720", 
        mission: "User Login",
        dataset: "Auth Edge Cases",
        scenario: "Malformed Token Handling",
        status: "Running",
        coverage: 0.45,
        started: "2026-08-01 09:45",
        completed: "-"
    },
    { 
        id: "EVAL-7719", 
        mission: "Data Sync",
        dataset: "Concurrent Writes (10k)",
        scenario: "Ledger Deadlock Test",
        status: "Failed",
        coverage: 1.0,
        started: "2026-08-01 08:00",
        completed: "2026-08-01 08:15"
    },
    { 
        id: "EVAL-7718", 
        mission: "Data Sync",
        dataset: "Concurrent Writes (1k)",
        scenario: "Ledger Deadlock Baseline",
        status: "Passed",
        coverage: 1.0,
        started: "2026-08-01 07:45",
        completed: "2026-08-01 07:50"
    },
];

export function IntelligenceEvaluations({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const intelligence = useProductionIntelligence(workspaceId);
    const evaluations = intelligence.evaluations.length ? intelligence.evaluations.map((item) => ({
        id: String(item.id ?? "evaluation"), mission: String(item.missionId ?? item.clusterId ?? "-"), dataset: String(item.input ?? "Production regression"), scenario: String(item.verification ?? "-"),
        status: String(item.status ?? "Draft"), coverage: Number(item.coverage ?? 0), started: item.createdAt ? new Date(String(item.createdAt)).toLocaleString() : "-", completed: "-",
    })) : [];
    const visibleEvaluations = evaluations.filter((row) => JSON.stringify(row).toLowerCase().includes(searchQuery.trim().toLowerCase()) && (statusFilter === "All" || String(row.status) === statusFilter));

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col shrink-0 border-b border-border bg-card">
                <div className="flex items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Evaluations</h1>
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => exportLiveRows("horos-evaluations.json", visibleEvaluations)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-sm">
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
                        
                        <LiveFilterDropdown label="Status" value={statusFilter} options={["All", ...Array.from(new Set(evaluations.map((row) => String(row.status))))]} onChange={setStatusFilter} />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background/50 custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10 shadow-[0_1px_0_rgba(255,255,255,0.1)]">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold">Evaluation ID</th>
                            <th className="px-4 py-3 font-semibold">Mission</th>
                            <th className="px-4 py-3 font-semibold">Dataset</th>
                            <th className="px-4 py-3 font-semibold">Scenario</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold text-center">Coverage</th>
                            <th className="px-4 py-3 font-semibold">Started</th>
                            <th className="px-4 py-3 font-semibold">Completed</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {visibleEvaluations.map((row) => (
                            <tr 
                                key={row.id} 
                                onClick={() => openInspector("intelligence", { type: "evaluation", data: row })}
                                className="group hover:bg-muted/30 transition-colors cursor-pointer"
                            >
                                <td className="px-6 py-4 font-mono text-xs text-blue-400 font-semibold">{row.id}</td>
                                <td className="px-4 py-4 font-semibold text-foreground">{row.mission}</td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Database className="size-3.5" /> {row.dataset}
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <GitBranch className="size-3.5" /> {row.scenario}
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <Badge variant="outline" className={cn(
                                        "font-mono text-[10px] tracking-wide flex w-fit items-center gap-1.5",
                                        row.status === "Passed" ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/5" :
                                        row.status === "Failed" ? "text-red-500 border-red-500/30 bg-red-500/5" :
                                        "text-blue-500 border-blue-500/30 bg-blue-500/5"
                                    )}>
                                        {row.status === "Passed" && <CheckCircle2 className="size-3" />}
                                        {row.status === "Failed" && <XCircle className="size-3" />}
                                        {row.status === "Running" && <Activity className="size-3" />}
                                        {row.status}
                                    </Badge>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="font-mono text-xs font-bold">{(row.coverage * 100).toFixed(0)}%</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{row.started}</td>
                                <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{row.completed}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
