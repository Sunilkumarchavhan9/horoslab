"use client";

import React, { useState } from "react";
import { 
    Search, Filter, Download, ChevronDown, ChevronLeft, ChevronRight,
    CheckCircle2, XCircle, ShieldAlert,
    Clock, UserCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "@/components/mission-control/universal-inspector";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

type ApprovalRow = {
    id: string;
    missionId: string;
    missionName: string;
    approvalType: string;
    requester: string;
    approver: string;
    confidence: number;
    status: "Pending" | "Approved" | "Rejected" | "Escalated" | "Request Changes";
    created: string;
    dueDate: string;
};

const MOCK_APPROVALS: ApprovalRow[] = [
    { id: "APP-5012", missionId: "MSN-8991", missionName: "Payment Gateway Upgrade", approvalType: "Resource Access", requester: "Database Agent", approver: "Sarah Jenkins", confidence: 85, status: "Pending", created: "10:15:22", dueDate: "11:15:22" },
    { id: "APP-5013", missionId: "MSN-8984", missionName: "Monthly Reporting", approvalType: "Policy Override", requester: "Reporting Agent", approver: "Finance Team", confidence: 99, status: "Approved", created: "09:30:00", dueDate: "17:00:00" },
    { id: "APP-5014", missionId: "MSN-8995", missionName: "API Data Sync", approvalType: "Execution Gate", requester: "Sync Agent", approver: "Sarah Jenkins", confidence: 45, status: "Rejected", created: "08:15:00", dueDate: "12:00:00" },
    { id: "APP-5015", missionId: "MSN-8996", missionName: "Log Archival", approvalType: "Security Gate", requester: "Archive Agent", approver: "Security Officer", confidence: 12, status: "Escalated", created: "07:00:00", dueDate: "08:00:00" },
];

export function GovernanceApprovalsView() {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");

    const toggleRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRows(newSet);
    };

    const toggleAll = () => {
        if (selectedRows.size === MOCK_APPROVALS.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(MOCK_APPROVALS.map(m => m.id)));
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 border-b border-border bg-card">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <ShieldAlert className="size-5 text-amber-500" />
                            Approval Queue
                        </h1>
                        <span className="text-xs text-muted-foreground mt-1">Human governance before autonomous execution.</span>
                    </div>
                </div>

                <div className="flex items-center justify-between px-6 py-3 bg-muted/20 border-t border-border overflow-x-auto custom-scrollbar">
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="relative w-64 shrink-0">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="Search Approvals..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-8 pl-9 pr-3 text-xs bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/70 text-foreground"
                            />
                        </div>
                        <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0 shadow-sm">
                            Mission <ChevronDown className="size-3" />
                        </button>
                        <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0 shadow-sm">
                            Policy <ChevronDown className="size-3" />
                        </button>
                        <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0 shadow-sm">
                            Approver <ChevronDown className="size-3" />
                        </button>
                        <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0 shadow-sm">
                            Priority <ChevronDown className="size-3" />
                        </button>
                        <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0 shadow-sm">
                            Status <ChevronDown className="size-3" />
                        </button>
                        <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0 shadow-sm">
                            Date Range <ChevronDown className="size-3" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background/50 custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10 shadow-[0_1px_0_rgba(255,255,255,0.1)]">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === MOCK_APPROVALS.length && MOCK_APPROVALS.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold w-32">Approval</th>
                            <th className="px-4 py-3 font-semibold w-48">Mission</th>
                            <th className="px-4 py-3 font-semibold w-40">Approval Type</th>
                            <th className="px-4 py-3 font-semibold w-40">Requester</th>
                            <th className="px-4 py-3 font-semibold w-40">Approver</th>
                            <th className="px-4 py-3 font-semibold w-32">Confidence</th>
                            <th className="px-4 py-3 font-semibold w-32">Status</th>
                            <th className="px-4 py-3 font-semibold w-32">Created</th>
                            <th className="px-4 py-3 font-semibold w-32">Due Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {MOCK_APPROVALS.map((approval) => (
                            <tr 
                                key={approval.id} 
                                onClick={() => openInspector("approval", { ...approval, context: 'governance' })}
                                className={cn(
                                    "group hover:bg-muted/30 transition-colors cursor-pointer",
                                    selectedRows.has(approval.id) ? "bg-primary/5 hover:bg-primary/10" : ""
                                )}
                            >
                                <td className="px-6 py-4" onClick={(e) => toggleRow(approval.id, e)}>
                                    <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.has(approval.id)} readOnly />
                                </td>
                                <td className="px-4 py-4">
                                    <span className="font-mono text-[12px] font-semibold text-foreground">{approval.id}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-mono text-[11px] text-muted-foreground">{approval.missionId}</span>
                                        <span className="font-medium text-foreground">{approval.missionName}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-muted-foreground">
                                    {approval.approvalType}
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                        <UserCircle2 className="size-4 text-muted-foreground" />
                                        <span className="font-medium">{approval.requester}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                        <UserCircle2 className="size-4 text-muted-foreground" />
                                        <span className="font-medium">{approval.approver}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <Progress value={approval.confidence} className={cn(
                                            "h-1.5 w-16",
                                            approval.confidence > 90 ? "[&>div]:bg-emerald-500" :
                                            approval.confidence > 60 ? "[&>div]:bg-amber-500" :
                                            "[&>div]:bg-red-500"
                                        )} />
                                        <span className="text-xs font-medium text-muted-foreground">{approval.confidence}%</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        approval.status === "Pending" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                        approval.status === "Approved" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                        approval.status === "Rejected" ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                                        "bg-purple-500/10 text-purple-500 border border-purple-500/20" // Escalated
                                    )}>
                                        {approval.status === "Pending" && <Clock className="size-3" />}
                                        {approval.status === "Approved" && <CheckCircle2 className="size-3" />}
                                        {approval.status === "Rejected" && <XCircle className="size-3" />}
                                        {approval.status === "Escalated" && <ShieldAlert className="size-3" />}
                                        {approval.status}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-muted-foreground">
                                    {approval.created}
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "text-sm font-medium",
                                        approval.status === "Pending" ? "text-amber-500" : "text-muted-foreground"
                                    )}>
                                        {approval.dueDate}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
