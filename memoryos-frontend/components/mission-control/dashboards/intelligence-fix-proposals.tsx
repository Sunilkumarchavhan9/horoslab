"use client";

import React, { useState } from "react";
import { Search, ListFilter, Calendar, CheckCircle2, ShieldAlert, AlertTriangle, FileText, Bot, ScrollText, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useInspector } from "../universal-inspector";
import { useProductionIntelligence } from "./use-production-intelligence";
import { approveDhyraFixProposal } from "@/lib/dhyra-api";
import { LiveFilterDropdown } from "../ui/live-filter-dropdown";

const MOCK_PROPOSALS = [
    { 
        id: "FIX-814", 
        type: "Prompt Update",
        target: "Checkout Assistant",
        risk: "Low",
        author: "Alice System",
        reviewer: "Pending",
        status: "Proposed",
        created: "2026-08-01 10:15"
    },
    { 
        id: "FIX-813", 
        type: "Tool Change",
        target: "API Circuit Breaker",
        risk: "High",
        author: "Alice System",
        reviewer: "Sarah Chen",
        status: "Approved",
        created: "2026-08-01 09:30"
    },
    { 
        id: "FIX-812", 
        type: "Policy Update",
        target: "Retry Strategy",
        risk: "Medium",
        author: "System Monitor",
        reviewer: "System",
        status: "Merged",
        created: "2026-08-01 08:00"
    },
];

export function IntelligenceFixProposals({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [riskFilter, setRiskFilter] = useState("All");
    const [approving, setApproving] = useState<string | null>(null);
    const intelligence = useProductionIntelligence(workspaceId);
    const proposals = intelligence.fixes.length ? intelligence.fixes.map((item) => ({
        id: String(item.id ?? "proposal"), type: String(item.kind ?? "Fix"), target: String(item.clusterId ?? "-"), risk: String(item.risk ?? "-"), author: String(item.proposedBy ?? "-"), reviewer: String(item.approvedBy ?? "Pending"), status: String(item.status ?? "draft"), created: item.createdAt ? new Date(String(item.createdAt)).toLocaleString() : "-",
    })) : [];
    const visibleProposals = proposals.filter((row) => JSON.stringify(row).toLowerCase().includes(searchQuery.trim().toLowerCase()) && (statusFilter === "All" || String(row.status) === statusFilter) && (riskFilter === "All" || String(row.risk) === riskFilter));
    const approveProposal = async (proposalId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        if (!workspaceId || approving) return;
        setApproving(proposalId);
        try {
            await approveDhyraFixProposal(workspaceId, proposalId);
        } finally {
            setApproving(null);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col shrink-0 border-b border-border bg-card">
                <div className="flex items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Fix Proposals</h1>
                    <div className="flex items-center gap-3">
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
                        
                        <LiveFilterDropdown label="Status" value={statusFilter} options={["All", ...Array.from(new Set(proposals.map((row) => String(row.status))))]} onChange={setStatusFilter} />
                        <LiveFilterDropdown label="Risk Level" value={riskFilter} options={["All", ...Array.from(new Set(proposals.map((row) => String(row.risk))))]} onChange={setRiskFilter} />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background/50 custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10 shadow-[0_1px_0_rgba(255,255,255,0.1)]">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold">Proposal ID</th>
                            <th className="px-4 py-3 font-semibold">Type</th>
                            <th className="px-4 py-3 font-semibold">Target</th>
                            <th className="px-4 py-3 font-semibold">Risk Level</th>
                            <th className="px-4 py-3 font-semibold">Author</th>
                            <th className="px-4 py-3 font-semibold">Reviewer</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Created</th>
                            <th className="px-4 py-3 font-semibold">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {visibleProposals.map((row) => (
                            <tr 
                                key={row.id} 
                                onClick={() => openInspector("intelligence", { type: "fix-proposal", data: row })}
                                className="group hover:bg-muted/30 transition-colors cursor-pointer"
                            >
                                <td className="px-6 py-4 font-mono text-xs text-blue-400 font-semibold">{row.id}</td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2 text-xs font-medium">
                                        {row.type === "Prompt Update" ? <FileText className="size-3.5 text-muted-foreground" /> :
                                         row.type === "Tool Change" ? <Bot className="size-3.5 text-muted-foreground" /> : 
                                         <ScrollText className="size-3.5 text-muted-foreground" />}
                                        {row.type}
                                    </div>
                                </td>
                                <td className="px-4 py-4 font-medium text-foreground">{row.target}</td>
                                <td className="px-4 py-4">
                                    <Badge variant="outline" className={cn(
                                        "font-mono text-[10px] tracking-wide flex w-fit items-center gap-1.5",
                                        row.risk === "Low" ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/5" :
                                        row.risk === "Medium" ? "text-orange-500 border-orange-500/30 bg-orange-500/5" :
                                        "text-red-500 border-red-500/30 bg-red-500/5"
                                    )}>
                                        {row.risk}
                                    </Badge>
                                </td>
                                <td className="px-4 py-4 text-xs font-medium text-muted-foreground">{row.author}</td>
                                <td className="px-4 py-4 text-xs font-medium text-muted-foreground">{row.reviewer}</td>
                                <td className="px-4 py-4">
                                    <Badge variant="outline" className={cn(
                                        "font-mono text-[10px] tracking-wide",
                                        row.status === "Proposed" ? "text-blue-500 border-blue-500/30 bg-blue-500/5" :
                                        row.status === "Approved" ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/5" :
                                        "text-indigo-500 border-indigo-500/30 bg-indigo-500/5"
                                    )}>
                                        {row.status}
                                    </Badge>
                                </td>
                                <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{row.created}</td>
                                <td className="px-4 py-4"><button disabled={approving === row.id || row.status !== "Proposed"} onClick={(event) => void approveProposal(row.id, event)} className="rounded border border-emerald-500/30 px-2 py-1 text-[10px] font-semibold text-emerald-500 disabled:opacity-40">{approving === row.id ? "Approving..." : "Approve"}</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
