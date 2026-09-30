"use client";

import React, { useState } from "react";
import { 
    Search, Download, ChevronDown, ListTree, Calendar, 
    ArrowUpRight, ArrowDownRight, Clock, Activity, ShieldAlert, RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "../universal-inspector";
import { Badge } from "@/components/ui/badge";
import { useProductionIntelligence } from "./use-production-intelligence";
import { exportLiveRows } from "../export-live-rows";
import { LiveFilterDropdown } from "../ui/live-filter-dropdown";

type ProductionRow = {
    id: string; // Interaction ID
    mission: string;
    institution: string;
    worker: string;
    conversation: string;
    failureScore: number;
    frictionSignal: string | null;
    churnSignal: "High" | "Medium" | "Low" | null;
    conversionStage: string | null;
    userFeedback: string | null;
    status: "Success" | "Failed" | "Abandoned" | "Processing";
    created: string;
};

const MOCK_PRODUCTIONS: ProductionRow[] = [
    { id: "INT-8490", mission: "User Login", institution: "Acme Corp", worker: "System", conversation: "CONV-10A", failureScore: 0.85, frictionSignal: "Auth Timeout", churnSignal: "High", conversionStage: "Authentication", userFeedback: "Negative", status: "Failed", created: "2m ago" },
    { id: "INT-8492", mission: "Checkout Flow", institution: "Acme Corp", worker: "GPT-4", conversation: "CONV-10B", failureScore: 0.95, frictionSignal: "Cart Error", churnSignal: "High", conversionStage: "Payment Intent", userFeedback: null, status: "Abandoned", created: "5m ago" },
    { id: "INT-8491", mission: "Data Sync", institution: "Globex", worker: "Claude-3", conversation: "CONV-10C", failureScore: 0.45, frictionSignal: "Slow Load", churnSignal: "Low", conversionStage: "Processing", userFeedback: null, status: "Success", created: "12m ago" },
    { id: "INT-8495", mission: "User Login", institution: "Initech", worker: "System", conversation: "CONV-10D", failureScore: 0.05, frictionSignal: null, churnSignal: null, conversionStage: "Authentication", userFeedback: "Positive", status: "Success", created: "15m ago" },
    { id: "INT-8496", mission: "Report Gen", institution: "Acme Corp", worker: "GPT-4", conversation: "CONV-10E", failureScore: 0.15, frictionSignal: "Rate Limit (429)", churnSignal: "Medium", conversionStage: "Export", userFeedback: null, status: "Processing", created: "22m ago" }
];

function MetricBlock({ title, value, trend, positive, alert }: { title: string, value: string, trend?: string, positive?: boolean, alert?: boolean }) {
    return (
        <div className="p-4 bg-card/40 backdrop-blur-sm border border-border/30 rounded-lg flex flex-col justify-center shadow-sm relative overflow-hidden">
            {alert && <div className="absolute top-0 right-0 w-8 h-8 bg-red-500/10 rounded-bl-full border-b border-l border-red-500/20" />}
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1.5 line-clamp-1">{title}</span>
            <div className="flex items-end gap-2">
                <span className={cn("text-xl font-bold font-mono", alert ? "text-red-500" : "text-foreground")}>{value}</span>
                {trend && (
                    <span className={cn("text-[10px] font-bold pb-1 flex items-center", positive ? "text-emerald-500" : "text-red-500")}>
                        {positive ? <ArrowUpRight className="size-3 mr-0.5" /> : <ArrowDownRight className="size-3 mr-0.5" />}
                        {trend}
                    </span>
                )}
            </div>
        </div>
    );
}

export function IntelligenceProduction({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState({ mission: "All", institution: "All", worker: "All", category: "All" });
    const intelligence = useProductionIntelligence(workspaceId);
    const productions = intelligence.interactions.length ? intelligence.interactions.map((item) => ({
        id: String(item.id ?? "interaction"), mission: String(item.missionId ?? "-"), institution: String(item.institutionId ?? "-"),
        worker: String(item.workerId ?? "-"), conversation: String(item.executionId ?? "-"), failureScore: Number(item.failureScore ?? 0),
        frictionSignal: item.frictionSignal ? String(item.frictionSignal) : null, churnSignal: item.churnSignal ? String(item.churnSignal) as "High" : null,
        conversionStage: item.conversionStage ? String(item.conversionStage) : null, userFeedback: item.userFeedback ? String(item.userFeedback) : null,
        status: item.abandoned ? "Abandoned" as const : item.failureScore && Number(item.failureScore) > 0.5 ? "Failed" as const : "Success" as const,
        created: item.capturedAt ? new Date(String(item.capturedAt)).toLocaleString() : "-",
    })) : [];
    const visibleProductions = productions.filter((row) => {
        if (!JSON.stringify(row).toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
        if (filters.mission !== "All" && row.mission !== filters.mission) return false;
        if (filters.institution !== "All" && row.institution !== filters.institution) return false;
        if (filters.worker !== "All" && row.worker !== filters.worker) return false;
        if (filters.category !== "All" && row.frictionSignal !== filters.category) return false;
        return true;
    });
    const failureCount = intelligence.signals.length;
    const averageFailureScore = productions.length === 0 ? null : productions.reduce((total, row) => total + row.failureScore, 0) / productions.length;
    const highChurnCount = productions.filter((row) => row.churnSignal === "High").length;

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* KPI Cards Header */}
            <div className="p-6 pb-0 shrink-0">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
                    <MetricBlock title="Interactions" value={String(productions.length)} />
                    <MetricBlock title="Failure Signals" value={String(failureCount)} />
                    <MetricBlock title="Avg Failure Score" value={averageFailureScore == null ? "-" : averageFailureScore.toFixed(2)} />
                    <MetricBlock title="User Frustration" value={highChurnCount > 0 ? String(highChurnCount) : "-"} alert={highChurnCount > 0} />
                    <MetricBlock title="Conversion Drop" value="-" />
                    <MetricBlock title="Churn Risk" value={highChurnCount > 0 ? "High" : "-"} alert={highChurnCount > 0} />
                </div>
            </div>

            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 border-y border-border bg-card">
                <div className="flex items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Production Intelligence</h1>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-2 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                            <span className="relative flex size-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                            </span>
                            Live Feed Active
                        </span>
                        <button type="button" onClick={() => exportLiveRows("dhyra-production-interactions.json", visibleProductions)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-sm">
                            <Download className="size-3.5" />
                            Export
                        </button>
                    </div>
                </div>

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
                        
                        <LiveFilterDropdown label="Mission" value={filters.mission} options={["All", ...Array.from(new Set(productions.map((row) => row.mission)))]} onChange={(value) => setFilters((current) => ({ ...current, mission: value }))} />
                        <LiveFilterDropdown label="Institution" value={filters.institution} options={["All", ...Array.from(new Set(productions.map((row) => row.institution)))]} onChange={(value) => setFilters((current) => ({ ...current, institution: value }))} />
                        <LiveFilterDropdown label="Worker" value={filters.worker} options={["All", ...Array.from(new Set(productions.map((row) => row.worker)))]} onChange={(value) => setFilters((current) => ({ ...current, worker: value }))} />
                        <LiveFilterDropdown label="Failure Category" value={filters.category} options={["All", ...Array.from(new Set(productions.map((row) => row.frictionSignal).filter((value): value is string => Boolean(value))))]} onChange={(value) => setFilters((current) => ({ ...current, category: value }))} />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background/50">
                <table className="w-full text-left border-collapse min-w-[1600px]">
                    <thead className="sticky top-0 bg-card z-10 shadow-[0_1px_0_rgba(255,255,255,0.1)]">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold">Interaction</th>
                            <th className="px-4 py-3 font-semibold">Mission</th>
                            <th className="px-4 py-3 font-semibold">Institution</th>
                            <th className="px-4 py-3 font-semibold">Worker</th>
                            <th className="px-4 py-3 font-semibold">Conversation</th>
                            <th className="px-4 py-3 font-semibold">Failure Score</th>
                            <th className="px-4 py-3 font-semibold">Friction Signal</th>
                            <th className="px-4 py-3 font-semibold">Churn Signal</th>
                            <th className="px-4 py-3 font-semibold">Conversion Stage</th>
                            <th className="px-4 py-3 font-semibold">User Feedback</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Created</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {visibleProductions.map((row) => (
                            <tr 
                                key={row.id} 
                                onClick={() => openInspector("intelligence", { type: "production", data: row })}
                                className="group hover:bg-muted/30 transition-colors cursor-pointer"
                            >
                                <td className="px-6 py-4 font-mono text-xs text-blue-400 font-semibold">{row.id}</td>
                                <td className="px-4 py-4 font-medium text-foreground">{row.mission}</td>
                                <td className="px-4 py-4 text-muted-foreground">{row.institution}</td>
                                <td className="px-4 py-4 text-muted-foreground">{row.worker}</td>
                                <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{row.conversation}</td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className={cn("h-full rounded-full", row.failureScore > 0.8 ? "bg-red-500" : row.failureScore > 0.5 ? "bg-orange-500" : "bg-emerald-500")} 
                                                style={{ width: `${row.failureScore * 100}%` }} 
                                            />
                                        </div>
                                        <span className="font-mono text-xs font-bold">{row.failureScore}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    {row.frictionSignal ? (
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-500 bg-orange-500/10 px-2 py-1 rounded">
                                            <ShieldAlert className="size-3" /> {row.frictionSignal}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground/50">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-4">
                                    {row.churnSignal ? (
                                        <Badge variant="outline" className={cn(
                                            "font-mono text-[10px] tracking-wide",
                                            row.churnSignal === "High" ? "text-red-500 border-red-500/30 bg-red-500/5" :
                                            row.churnSignal === "Medium" ? "text-orange-500 border-orange-500/30 bg-orange-500/5" :
                                            "text-blue-500 border-blue-500/30 bg-blue-500/5"
                                        )}>
                                            {row.churnSignal}
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground/50">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-4 text-muted-foreground">{row.conversionStage || "-"}</td>
                                <td className="px-4 py-4">
                                    {row.userFeedback === "Negative" ? (
                                        <span className="text-red-500 flex items-center gap-1.5"><RotateCcw className="size-3" /> Negative</span>
                                    ) : row.userFeedback === "Positive" ? (
                                        <span className="text-emerald-500 flex items-center gap-1.5"><Activity className="size-3" /> Positive</span>
                                    ) : (
                                        <span className="text-muted-foreground/50">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-4">
                                    <Badge variant="outline" className={cn(
                                        "font-mono text-[10px] tracking-wide",
                                        row.status === "Success" ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/5" :
                                        row.status === "Failed" ? "text-red-500 border-red-500/30 bg-red-500/5" :
                                        row.status === "Abandoned" ? "text-orange-500 border-orange-500/30 bg-orange-500/5" :
                                        "text-blue-500 border-blue-500/30 bg-blue-500/5"
                                    )}>
                                        {row.status}
                                    </Badge>
                                </td>
                                <td className="px-4 py-4 font-mono text-xs text-muted-foreground flex items-center gap-1.5 mt-1.5"><Clock className="size-3.5" /> {row.created}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
