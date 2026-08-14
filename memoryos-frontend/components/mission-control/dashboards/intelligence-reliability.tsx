"use client";

import React, { useState } from "react";
import { Search, ListFilter, Calendar, Activity, ChevronDown, CheckCircle2, XCircle, AlertTriangle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useInspector } from "../universal-inspector";
import { useProductionIntelligence } from "./use-production-intelligence";
import { LiveFilterDropdown } from "../ui/live-filter-dropdown";

const MOCK_RELIABILITY = [
    { 
        id: "REL-M01",
        targetType: "Mission",
        target: "Monthly Payroll",
        success: "98.2%",
        failure: "1.8%",
        recovery: "1.5%",
        humanReview: "0.3%",
        confidence: "High",
        sampleSize: "1,245"
    },
    { 
        id: "REL-W01",
        targetType: "Worker",
        target: "v1.2.4 Worker",
        success: "94.5%",
        failure: "5.5%",
        recovery: "4.0%",
        humanReview: "1.5%",
        confidence: "Medium",
        sampleSize: "892"
    },
    { 
        id: "REL-I01",
        targetType: "Institution",
        target: "Acme Corp",
        success: "99.1%",
        failure: "0.9%",
        recovery: "0.8%",
        humanReview: "0.1%",
        confidence: "High",
        sampleSize: "5,432"
    },
];

export function IntelligenceReliability({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [searchQuery, setSearchQuery] = useState("");
    const [targetFilter, setTargetFilter] = useState("All");
    const intelligence = useProductionIntelligence(workspaceId);
    const reliability = intelligence.reliability.length ? intelligence.reliability.map((item) => ({
        id: String(item.id ?? "reliability"), targetType: "Worker", target: String(item.workerId ?? "Workspace"), success: `${Number(item.successRate ?? 0) * 100}%`, failure: `${Number(item.failureRate ?? 0) * 100}%`, recovery: `${Number(item.recoveryRate ?? 0) * 100}%`, humanReview: `${Number(item.humanInterventionRate ?? 0) * 100}%`, confidence: String(item.confidence ?? "-"), sampleSize: String(item.sampleSize ?? 0),
    })) : [];
    const visibleReliability = reliability.filter((row) => JSON.stringify(row).toLowerCase().includes(searchQuery.trim().toLowerCase()) && (targetFilter === "All" || row.targetType === targetFilter));

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col shrink-0 border-b border-border bg-card">
                <div className="flex items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Reliability</h1>
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
                        
                        <LiveFilterDropdown label="Target Type" value={targetFilter} options={["All", ...Array.from(new Set(reliability.map((row) => row.targetType)))]} onChange={setTargetFilter} />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background/50 custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1400px]">
                    <thead className="sticky top-0 bg-card z-10 shadow-[0_1px_0_rgba(255,255,255,0.1)]">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold">Target Type</th>
                            <th className="px-4 py-3 font-semibold">Target</th>
                            <th className="px-4 py-3 font-semibold">Success Rate</th>
                            <th className="px-4 py-3 font-semibold">Failure Rate</th>
                            <th className="px-4 py-3 font-semibold">Recovery Rate</th>
                            <th className="px-4 py-3 font-semibold">Human Review Rate</th>
                            <th className="px-4 py-3 font-semibold">Confidence</th>
                            <th className="px-4 py-3 font-semibold text-right">Sample Size</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {visibleReliability.map((row) => (
                            <tr 
                                key={row.id} 
                                onClick={() => openInspector("intelligence", { type: "reliability", data: row })}
                                className="group hover:bg-muted/30 transition-colors cursor-pointer"
                            >
                                <td className="px-6 py-4">
                                    <Badge variant="outline" className="font-mono text-[10px] tracking-wide bg-muted/20">
                                        {row.targetType}
                                    </Badge>
                                </td>
                                <td className="px-4 py-4 font-semibold text-foreground">{row.target}</td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-1.5 font-mono text-xs text-emerald-500 font-semibold">
                                        <CheckCircle2 className="size-3.5" /> {row.success}
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-1.5 font-mono text-xs text-red-500 font-semibold">
                                        <XCircle className="size-3.5" /> {row.failure}
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-1.5 font-mono text-xs text-blue-500 font-semibold">
                                        <AlertTriangle className="size-3.5" /> {row.recovery}
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-1.5 font-mono text-xs text-orange-500 font-semibold">
                                        <User className="size-3.5" /> {row.humanReview}
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <Badge variant="outline" className={cn(
                                        "font-mono text-[10px] tracking-wide",
                                        row.confidence === "High" ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/5" :
                                        row.confidence === "Medium" ? "text-orange-500 border-orange-500/30 bg-orange-500/5" :
                                        "text-red-500 border-red-500/30 bg-red-500/5"
                                    )}>
                                        {row.confidence}
                                    </Badge>
                                </td>
                                <td className="px-4 py-4 text-right font-mono text-xs text-muted-foreground">{row.sampleSize}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
