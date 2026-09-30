"use client";

import React, { useState } from "react";
import { Search, ListFilter, Calendar, PlayCircle, Download, CheckCircle2, XCircle, RotateCcw, Box, User, ArrowRightLeft, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useInspector } from "../universal-inspector";
import { useProductionIntelligence } from "./use-production-intelligence";
import { exportLiveRows } from "../export-live-rows";
import { LiveFilterDropdown } from "../ui/live-filter-dropdown";

const MOCK_REPLAYS = [
    { 
        id: "RPL-1049", 
        mission: "Monthly Payroll",
        baseline: "v1.2.4 Worker",
        candidate: "v1.3.0 Worker (Beta)",
        started: "2026-08-01 10:15",
        completed: "2026-08-01 10:18",
        result: "Diverged"
    },
    { 
        id: "RPL-1048", 
        mission: "Vendor Onboarding",
        baseline: "Standard Model",
        candidate: "Fine-tuned Model",
        started: "2026-08-01 09:30",
        completed: "2026-08-01 09:32",
        result: "Matched"
    },
    { 
        id: "RPL-1047", 
        mission: "Monthly Payroll",
        baseline: "v1.2.4 Worker",
        candidate: "v1.2.5 Worker",
        started: "2026-08-01 08:00",
        completed: "2026-08-01 08:05",
        result: "Matched"
    },
];

export function IntelligenceReplays({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const intelligence = useProductionIntelligence(workspaceId);
    const replays = intelligence.replays.length ? intelligence.replays.map((item) => ({
        id: String(item.id ?? "replay"), mission: String(item.missionId ?? "-"), baseline: String(item.sourceRunId ?? "-"), candidate: String(item.variant ?? "-"),
        started: item.createdAt ? new Date(String(item.createdAt)).toLocaleString() : "-", completed: "-", result: String(item.status ?? "pending"),
    })) : [];
    const visibleReplays = replays.filter((row) => JSON.stringify(row).toLowerCase().includes(searchQuery.trim().toLowerCase()) && (statusFilter === "All" || String(row.result) === statusFilter));

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col shrink-0 border-b border-border bg-card">
                <div className="flex items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Replays</h1>
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => exportLiveRows("dhyra-replays.json", visibleReplays)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-sm">
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
                        
                        <LiveFilterDropdown label="Result" value={statusFilter} options={["All", ...Array.from(new Set(replays.map((row) => String(row.result))))]} onChange={setStatusFilter} />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background/50 custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10 shadow-[0_1px_0_rgba(255,255,255,0.1)]">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold">Replay ID</th>
                            <th className="px-4 py-3 font-semibold">Mission</th>
                            <th className="px-4 py-3 font-semibold">Baseline</th>
                            <th className="px-4 py-3 font-semibold">Candidate</th>
                            <th className="px-4 py-3 font-semibold">Result</th>
                            <th className="px-4 py-3 font-semibold">Started</th>
                            <th className="px-4 py-3 font-semibold">Completed</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {visibleReplays.map((row) => (
                            <tr 
                                key={row.id} 
                                onClick={() => openInspector("intelligence", { type: "replay", data: row })}
                                className="group hover:bg-muted/30 transition-colors cursor-pointer"
                            >
                                <td className="px-6 py-4 font-mono text-xs text-blue-400 font-semibold">{row.id}</td>
                                <td className="px-4 py-4 font-semibold text-foreground">{row.mission}</td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Box className="size-3.5" /> {row.baseline}
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                        <User className="size-3.5" /> {row.candidate}
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <Badge variant="outline" className={cn(
                                        "font-mono text-[10px] tracking-wide flex w-fit items-center gap-1.5",
                                        row.result === "Matched" ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/5" :
                                        row.result === "Diverged" ? "text-orange-500 border-orange-500/30 bg-orange-500/5" :
                                        "text-red-500 border-red-500/30 bg-red-500/5"
                                    )}>
                                        {row.result === "Matched" && <CheckCircle2 className="size-3" />}
                                        {row.result === "Diverged" && <ArrowRightLeft className="size-3" />}
                                        {row.result === "Failed" && <XCircle className="size-3" />}
                                        {row.result}
                                    </Badge>
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
