"use client";

import React, { useState } from "react";
import { 
    Search, ChevronDown, ChevronLeft, ChevronRight,
    CheckCircle2, XCircle,
    Banknote, PauseCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "@/components/mission-control/universal-inspector";
import { Progress } from "@/components/ui/progress";

type BudgetRow = {
    id: string;
    missionId: string;
    missionName: string;
    institution: string;
    budgetType: string;
    costLimit: string;
    currentCost: string;
    costPercentage: number;
    attemptLimit: number;
    attemptsUsed: number;
    timeLimit: string;
    runtime: string;
    status: "Active" | "Paused" | "Exceeded" | "Completed";
};

const MOCK_BUDGETS: BudgetRow[] = [
    { id: "BGT-1041", missionId: "MSN-8991", missionName: "Payment Gateway Upgrade", institution: "Engineering", budgetType: "Financial", costLimit: "$5,000", currentCost: "$4,100", costPercentage: 82, attemptLimit: 5, attemptsUsed: 2, timeLimit: "72h", runtime: "48h", status: "Active" },
    { id: "BGT-1042", missionId: "MSN-8984", missionName: "Monthly Reporting", institution: "Finance", budgetType: "Compute", costLimit: "1,000 hrs", currentCost: "950 hrs", costPercentage: 95, attemptLimit: 3, attemptsUsed: 3, timeLimit: "24h", runtime: "23h", status: "Exceeded" },
    { id: "BGT-1043", missionId: "MSN-8995", missionName: "API Data Sync", institution: "Engineering", budgetType: "Tokens", costLimit: "10M", currentCost: "2M", costPercentage: 20, attemptLimit: 10, attemptsUsed: 1, timeLimit: "48h", runtime: "5h", status: "Active" },
    { id: "BGT-1044", missionId: "MSN-8996", missionName: "Log Archival", institution: "Security", budgetType: "Compute", costLimit: "500 hrs", currentCost: "100 hrs", costPercentage: 20, attemptLimit: 2, attemptsUsed: 0, timeLimit: "12h", runtime: "2h", status: "Paused" },
];

export function GovernanceBudgetsView() {
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
        if (selectedRows.size === MOCK_BUDGETS.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(MOCK_BUDGETS.map(m => m.id)));
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 border-b border-border bg-card">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Banknote className="size-5 text-emerald-500" />
                            Budgets & Limits
                        </h1>
                        <span className="text-xs text-muted-foreground mt-1">Prevent missions from exceeding operational limits.</span>
                    </div>
                </div>

                <div className="flex items-center justify-between px-6 py-3 bg-muted/20 border-t border-border overflow-x-auto custom-scrollbar">
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="relative w-64 shrink-0">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="Search Budgets..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-8 pl-9 pr-3 text-xs bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/70 text-foreground"
                            />
                        </div>
                        <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0 shadow-sm">
                            Mission <ChevronDown className="size-3" />
                        </button>
                        <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0 shadow-sm">
                            Institution <ChevronDown className="size-3" />
                        </button>
                        <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0 shadow-sm">
                            Budget Type <ChevronDown className="size-3" />
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
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === MOCK_BUDGETS.length && MOCK_BUDGETS.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold w-48">Mission</th>
                            <th className="px-4 py-3 font-semibold w-32">Institution</th>
                            <th className="px-4 py-3 font-semibold w-32">Budget Type</th>
                            <th className="px-4 py-3 font-semibold w-32">Cost Limit</th>
                            <th className="px-4 py-3 font-semibold w-40">Current Cost</th>
                            <th className="px-4 py-3 font-semibold w-24 text-center">Attempts</th>
                            <th className="px-4 py-3 font-semibold w-32">Runtime Limit</th>
                            <th className="px-4 py-3 font-semibold w-32">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {MOCK_BUDGETS.map((budget) => (
                            <tr 
                                key={budget.id} 
                                onClick={() => openInspector("budget" as any, { ...budget, context: 'governance', name: `Budget Limit for ${budget.missionId}` })}
                                className={cn(
                                    "group hover:bg-muted/30 transition-colors cursor-pointer",
                                    selectedRows.has(budget.id) ? "bg-primary/5 hover:bg-primary/10" : ""
                                )}
                            >
                                <td className="px-6 py-4" onClick={(e) => toggleRow(budget.id, e)}>
                                    <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.has(budget.id)} readOnly />
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-mono text-[11px] text-muted-foreground">{budget.missionId}</span>
                                        <span className="font-medium text-foreground">{budget.missionName}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-muted-foreground">
                                    {budget.institution}
                                </td>
                                <td className="px-4 py-4 text-muted-foreground">
                                    {budget.budgetType}
                                </td>
                                <td className="px-4 py-4 font-mono text-[12px]">
                                    {budget.costLimit}
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between font-mono text-[12px]">
                                            <span className={cn(
                                                "font-medium",
                                                budget.costPercentage > 90 ? "text-red-500" :
                                                budget.costPercentage > 75 ? "text-amber-500" :
                                                "text-foreground"
                                            )}>{budget.currentCost}</span>
                                            <span className="text-muted-foreground">{budget.costPercentage}%</span>
                                        </div>
                                        <Progress value={budget.costPercentage} className={cn(
                                            "h-1.5",
                                            budget.costPercentage > 90 ? "[&>div]:bg-red-500" :
                                            budget.costPercentage > 75 ? "[&>div]:bg-amber-500" :
                                            "[&>div]:bg-emerald-500"
                                        )} />
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className="font-mono text-[12px] text-muted-foreground">
                                        {budget.attemptsUsed} / {budget.attemptLimit}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-muted-foreground">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-mono text-[12px]">{budget.runtime} <span className="text-muted-foreground/50">/ {budget.timeLimit}</span></span>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        budget.status === "Active" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                        budget.status === "Exceeded" ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                                        budget.status === "Paused" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                        "bg-muted text-muted-foreground border border-border" // Completed
                                    )}>
                                        {budget.status === "Active" && <CheckCircle2 className="size-3" />}
                                        {budget.status === "Exceeded" && <XCircle className="size-3" />}
                                        {budget.status === "Paused" && <PauseCircle className="size-3" />}
                                        {budget.status === "Completed" && <CheckCircle2 className="size-3" />}
                                        {budget.status}
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
