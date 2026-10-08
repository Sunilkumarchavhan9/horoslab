"use client";

import React, { useEffect, useState } from "react";
import { 
    Search, Filter, Download, ChevronDown, ChevronLeft, ChevronRight,
    CheckCircle2, XCircle, ShieldAlert, AlertOctagon,
    Clock, UserCircle2, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "../universal-inspector";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { listHorosMissions, type HorosMissionDetail } from "@/lib/horos-api";
import { exportLiveRows } from "../export-live-rows";
import { LiveFilterDropdown } from "../ui/live-filter-dropdown";

type OpsApprovalRow = {
    id: string;
    missionId: string;
    missionName: string;
    requester: string;
    approver: string;
    reason: string;
    risk: "Low" | "Medium" | "High" | "Critical";
    confidence: number;
    requiredPolicies: number;
    deadline: string;
    status: "Pending" | "Approved" | "Rejected" | "Escalated" | "Request Changes";
};

const MOCK_OPS_APPROVALS: OpsApprovalRow[] = [
    { id: "APP-5012", missionId: "MSN-8991", missionName: "Payment Gateway Upgrade", requester: "Database Agent", approver: "Sarah Jenkins", reason: "Access Production DB", risk: "High", confidence: 85, requiredPolicies: 3, deadline: "11:15:22", status: "Pending" },
    { id: "APP-5013", missionId: "MSN-8984", missionName: "Monthly Reporting", requester: "Reporting Agent", approver: "Finance Team", reason: "Policy Override Request", risk: "Low", confidence: 99, requiredPolicies: 1, deadline: "17:00:00", status: "Approved" },
    { id: "APP-5014", missionId: "MSN-8995", missionName: "API Data Sync", requester: "Sync Agent", approver: "Sarah Jenkins", reason: "Wait for Execution Gate", risk: "Medium", confidence: 45, requiredPolicies: 2, deadline: "12:00:00", status: "Rejected" },
    { id: "APP-5015", missionId: "MSN-8996", missionName: "Log Archival", requester: "Archive Agent", approver: "Security Officer", reason: "Security Gate Review", risk: "Critical", confidence: 12, requiredPolicies: 5, deadline: "08:00:00", status: "Escalated" },
];

function toApprovalRows(missions: HorosMissionDetail[]): OpsApprovalRow[] {
    return missions.flatMap((mission) => (mission.authorityPolicies || []).filter((policy) => policy.needsApproval).map((policy) => ({
        id: policy.id,
        missionId: mission.id,
        missionName: mission.title || mission.id,
        requester: "Mission runtime",
        approver: "Authorized reviewer",
        reason: policy.name || "Policy approval required",
        risk: policy.blocked ? "Critical" : "Medium",
        confidence: 0,
        requiredPolicies: 1,
        deadline: "-",
        status: policy.blocked ? "Pending" : "Approved",
    })));
}

export function OperationsApprovals({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [approvals, setApprovals] = useState<OpsApprovalRow[]>([]);
    const [filters, setFilters] = useState<Record<string, string>>({});
    const visibleApprovals = approvals.filter((row) => {
        const query = searchQuery.trim().toLowerCase();
        const matches = (key: string, value: string) => !filters[key] || filters[key] === "All" || filters[key] === value;
        return (!query || JSON.stringify(row).toLowerCase().includes(query)) && matches("Mission", row.missionId) && matches("Requester", row.requester) && matches("Approver", row.approver) && matches("Status", row.status) && matches("Risk", row.risk);
    });
    const optionsFor = (key: keyof OpsApprovalRow) => ["All", ...Array.from(new Set(approvals.map((row) => String(row[key]))))];
    const setFilter = (key: string, value: string) => setFilters((current) => ({ ...current, [key]: value }));

    useEffect(() => {
        if (!workspaceId) {
            setApprovals([]);
            return;
        }
        let cancelled = false;
        const load = async () => {
            try {
                const missions = await listHorosMissions(workspaceId);
                if (!cancelled) setApprovals(toApprovalRows(missions));
            } catch {
                if (!cancelled) setApprovals([]);
            }
        };
        void load();
        const interval = window.setInterval(() => void load(), 5000);
        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [workspaceId]);

    const toggleRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRows(newSet);
    };

    const toggleAll = () => {
        if (selectedRows.size === approvals.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(approvals.map(m => m.id)));
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 border-b border-border bg-card">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <ShieldAlert className="size-5 text-amber-500" />
                            Operations Approvals
                        </h1>
                        <span className="text-xs text-muted-foreground mt-1">Which decisions require humans?</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => exportLiveRows("horos-approvals.json", visibleApprovals)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-sm">
                            <Download className="size-3.5" />
                            Export
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between px-6 py-3 bg-muted/20 border-t border-border overflow-visible">
                    <div className="flex items-center gap-4 flex-1 overflow-visible pb-1">
                        <div className="relative w-64 shrink-0">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="Search Approvals..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-8 pl-9 pr-3 text-xs bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/70 text-foreground shadow-sm"
                            />
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                            <LiveFilterDropdown label="Mission" value={filters.Mission} options={optionsFor("missionId")} onChange={(value) => setFilter("Mission", value)} />
                            <LiveFilterDropdown label="Requester" value={filters.Requester} options={optionsFor("requester")} onChange={(value) => setFilter("Requester", value)} />
                            <LiveFilterDropdown label="Approver" value={filters.Approver} options={optionsFor("approver")} onChange={(value) => setFilter("Approver", value)} />
                            <LiveFilterDropdown label="Status" value={filters.Status} options={optionsFor("status")} onChange={(value) => setFilter("Status", value)} />
                            <LiveFilterDropdown label="Risk" value={filters.Risk} options={optionsFor("risk")} onChange={(value) => setFilter("Risk", value)} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background/50">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10 shadow-[0_1px_0_rgba(255,255,255,0.1)]">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === approvals.length && approvals.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold w-32">Approval ID</th>
                            <th className="px-4 py-3 font-semibold w-48">Mission</th>
                            <th className="px-4 py-3 font-semibold w-40">Requester</th>
                            <th className="px-4 py-3 font-semibold w-40">Approver</th>
                            <th className="px-4 py-3 font-semibold w-48">Reason</th>
                            <th className="px-4 py-3 font-semibold w-24">Risk</th>
                            <th className="px-4 py-3 font-semibold w-32">Confidence</th>
                            <th className="px-4 py-3 font-semibold w-32">Required Policies</th>
                            <th className="px-4 py-3 font-semibold w-32">Due By</th>
                            <th className="px-4 py-3 font-semibold w-32">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {visibleApprovals.map((approval) => (
                            <tr 
                                key={approval.id} 
                                onClick={() => openInspector("approval", { ...approval, context: 'operations' })}
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
                                <td className="px-4 py-4 text-muted-foreground font-medium">
                                    {approval.reason}
                                </td>
                                <td className="px-4 py-4">
                                    <Badge variant="outline" className={cn(
                                        "font-mono text-[10px] tracking-wide",
                                        approval.risk === "Low" ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/5" :
                                        approval.risk === "Medium" ? "text-amber-500 border-amber-500/30 bg-amber-500/5" :
                                        approval.risk === "High" ? "text-orange-500 border-orange-500/30 bg-orange-500/5" :
                                        "text-red-500 border-red-500/30 bg-red-500/5"
                                    )}>
                                        {approval.risk === "Critical" && <AlertOctagon className="size-3 mr-1" />}
                                        {approval.risk}
                                    </Badge>
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
                                    <span className="font-mono text-[12px] font-bold text-foreground">{approval.requiredPolicies}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "text-sm font-medium",
                                        approval.status === "Pending" ? "text-amber-500" : "text-muted-foreground"
                                    )}>
                                        {approval.deadline}
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        approval.status === "Pending" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                        approval.status === "Approved" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                        approval.status === "Rejected" ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                                        "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                                    )}>
                                        {approval.status === "Pending" && <Clock className="size-3" />}
                                        {approval.status === "Approved" && <CheckCircle2 className="size-3" />}
                                        {approval.status === "Rejected" && <XCircle className="size-3" />}
                                        {approval.status === "Escalated" && <ShieldAlert className="size-3" />}
                                        {approval.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-card shrink-0">
                        <span className="text-xs text-muted-foreground">Showing {approvals.length} approvals</span>
            </div>
        </div>
    );
}
