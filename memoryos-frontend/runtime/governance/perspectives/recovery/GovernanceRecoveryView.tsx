"use client";

import React, { useState } from "react";
import { 
    Search, ChevronDown, ChevronLeft, ChevronRight,
    CheckCircle2, XCircle, ShieldAlert,
    RefreshCw, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "@/components/mission-control/universal-inspector";

type RecoveryPolicyRow = {
    id: string;
    policy: string;
    failureType: string;
    retryPolicy: string;
    escalation: string;
    fallback: string;
    status: "Active" | "Draft" | "Archived";
    version: string;
    institution: string;
};

const MOCK_RECOVERY_POLICIES: RecoveryPolicyRow[] = [
    { id: "POL-7001", policy: "Network Timeout Default", failureType: "Connection Timeout", retryPolicy: "Exponential Backoff (max 3)", escalation: "Auto-Escalate to Operator", fallback: "Offline Cache Agent", status: "Active", version: "v2.1", institution: "Engineering" },
    { id: "POL-7002", policy: "Authentication Failure", failureType: "401 Unauthorized", retryPolicy: "No Retry", escalation: "Escalate immediately", fallback: "Halt Execution", status: "Active", version: "v1.0", institution: "Security" },
    { id: "POL-7003", policy: "API Rate Limit", failureType: "429 Too Many Requests", retryPolicy: "Linear Delay (60s)", escalation: "None", fallback: "Wait & Retry", status: "Active", version: "v1.4", institution: "Engineering" },
    { id: "POL-7004", policy: "Agent Crash Recovery", failureType: "OOM / Crash", retryPolicy: "Restart Agent (max 1)", escalation: "Halt & Escalate", fallback: "Failover Pool", status: "Draft", version: "v0.9", institution: "Platform" },
];

export function GovernanceRecoveryView() {
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
        if (selectedRows.size === MOCK_RECOVERY_POLICIES.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(MOCK_RECOVERY_POLICIES.map(m => m.id)));
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 border-b border-border bg-card">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <RefreshCw className="size-5 text-blue-500" />
                            Recovery Policies
                        </h1>
                        <span className="text-xs text-muted-foreground mt-1">Define what happens after failures.</span>
                    </div>
                </div>

                <div className="flex items-center justify-between px-6 py-3 bg-muted/20 border-t border-border overflow-x-auto custom-scrollbar">
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="relative w-64 shrink-0">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="Search Recovery Policies..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-8 pl-9 pr-3 text-xs bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/70 text-foreground"
                            />
                        </div>
                        <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0 shadow-sm">
                            Recovery Type <ChevronDown className="size-3" />
                        </button>
                        <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0 shadow-sm">
                            Institution <ChevronDown className="size-3" />
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
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === MOCK_RECOVERY_POLICIES.length && MOCK_RECOVERY_POLICIES.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold w-56">Policy</th>
                            <th className="px-4 py-3 font-semibold w-40">Failure Type</th>
                            <th className="px-4 py-3 font-semibold w-48">Retry Policy</th>
                            <th className="px-4 py-3 font-semibold w-40">Escalation</th>
                            <th className="px-4 py-3 font-semibold w-40">Fallback</th>
                            <th className="px-4 py-3 font-semibold w-24">Status</th>
                            <th className="px-4 py-3 font-semibold w-24">Version</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {MOCK_RECOVERY_POLICIES.map((policy) => (
                            <tr 
                                key={policy.id} 
                                onClick={() => openInspector("recovery_policy" as any, { ...policy, context: 'governance', name: policy.policy })}
                                className={cn(
                                    "group hover:bg-muted/30 transition-colors cursor-pointer",
                                    selectedRows.has(policy.id) ? "bg-primary/5 hover:bg-primary/10" : ""
                                )}
                            >
                                <td className="px-6 py-4" onClick={(e) => toggleRow(policy.id, e)}>
                                    <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.has(policy.id)} readOnly />
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-mono text-[11px] text-muted-foreground">{policy.id}</span>
                                        <span className="font-medium text-foreground">{policy.policy}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">
                                        <ShieldAlert className="size-3" />
                                        {policy.failureType}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-muted-foreground">
                                    {policy.retryPolicy}
                                </td>
                                <td className="px-4 py-4 text-muted-foreground">
                                    {policy.escalation}
                                </td>
                                <td className="px-4 py-4 text-muted-foreground">
                                    {policy.fallback}
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        policy.status === "Active" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                        policy.status === "Draft" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                        "bg-muted text-muted-foreground border border-border" // Archived
                                    )}>
                                        {policy.status === "Active" && <CheckCircle2 className="size-3" />}
                                        {policy.status === "Draft" && <Zap className="size-3" />}
                                        {policy.status === "Archived" && <XCircle className="size-3" />}
                                        {policy.status}
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="font-mono text-[12px] text-muted-foreground font-medium">
                                        {policy.version}
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
