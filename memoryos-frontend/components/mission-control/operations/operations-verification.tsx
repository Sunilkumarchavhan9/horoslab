"use client";

import React, { useEffect, useState } from "react";
import { 
    Search, Download,
    BadgeCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "../universal-inspector";
import { Progress } from "@/components/ui/progress";
import { listDhyraVerificationRuns, type DhyraVerificationRunHistoryItem } from "@/lib/dhyra-api";
import { LiveFilterDropdown } from "../ui/live-filter-dropdown";
import { exportLiveRows } from "../export-live-rows";

type VerificationRow = {
    id: string;
    mission: string;
    execution: string;
    verifier: string;
    pass: number;
    fail: number;
    unknown: number;
    confidenceScore: number;
    evidenceCoverage: number;
    certificate: string;
    completed: string;
    updated: string;
};

function toVerificationRow(run: DhyraVerificationRunHistoryItem): VerificationRow {
    const decision = String(run.finalDecision || "UNKNOWN").toUpperCase();
    const evidenceSummary = run.evidenceSummary ?? {};
    const evidenceCount = Number(evidenceSummary.count ?? evidenceSummary.evidenceCount ?? 0);
    const checklistCount = Array.isArray(run.checklist) ? run.checklist.length : 0;
    const reportedCoverage = Number(evidenceSummary.coverage ?? 0);
    return {
        id: run.id,
        mission: run.mission?.title || run.missionId || "Mission verification",
        execution: run.executionRun?.id || "-",
        verifier: "Runtime verifier",
        pass: decision === "PASS" ? 1 : 0,
        fail: decision === "FAIL" ? 1 : 0,
        unknown: decision === "UNKNOWN" ? 1 : 0,
        confidenceScore: Math.round((run.confidence || 0) * (run.confidence && run.confidence <= 1 ? 100 : 1)),
        evidenceCoverage: reportedCoverage || (checklistCount > 0 ? Math.min(100, Math.round((evidenceCount / checklistCount) * 100)) : evidenceCount > 0 ? 100 : 0),
        certificate: run.certificate?.id || "-",
        completed: run.createdAt ? new Date(run.createdAt).toLocaleString() : "-",
        updated: run.createdAt ? new Date(run.createdAt).toLocaleString() : "-",
    };
}

export function OperationsVerification({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [verifications, setVerifications] = useState<VerificationRow[]>([]);
    const [filters, setFilters] = useState<Record<string, string>>({});
    const confidenceOptions = ["All", "90-100", "70-89", "0-69"];
    const coverageOptions = ["All", "90-100", "70-89", "0-69"];
    const inRange = (value: number, range?: string) => {
        if (!range || range === "All") return true;
        if (range === "90-100") return value >= 90;
        if (range === "70-89") return value >= 70 && value < 90;
        return value < 70;
    };
    const visibleVerifications = verifications.filter((row) => {
        const query = searchQuery.trim().toLowerCase();
        const matches = (key: string, value: string) => !filters[key] || filters[key] === "All" || filters[key] === value;
        return (!query || JSON.stringify(row).toLowerCase().includes(query)) && matches("Mission", row.mission) && matches("Execution", row.execution) && matches("Verifier", row.verifier) && matches("Result", row.fail > 0 ? "Failed" : row.unknown > 0 ? "Warning" : "Passed") && inRange(row.confidenceScore, filters.Confidence) && inRange(row.evidenceCoverage, filters.Coverage);
    });
    const setFilter = (key: string, value: string) => setFilters((current) => ({ ...current, [key]: value }));

    useEffect(() => {
        if (!workspaceId) {
            return;
        }
        let cancelled = false;
        const load = async () => {
            try {
                const result = await listDhyraVerificationRuns(workspaceId);
                if (!cancelled) setVerifications(result.verifications.map(toVerificationRow));
            } catch {
                if (!cancelled) setVerifications([]);
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
        if (selectedRows.size === verifications.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(verifications.map(m => m.id)));
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 border-b border-border bg-card">
                <div className="flex items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Verification & Validation</h1>
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => exportLiveRows("dhyra-verifications.json", visibleVerifications)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-sm">
                            <Download className="size-3.5" />
                            Export Report
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between px-6 py-3 bg-muted/20 border-t border-border overflow-visible">
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="relative w-48 shrink-0">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="Search verifications..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-8 pl-9 pr-3 text-xs bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/70 text-foreground"
                            />
                        </div>
                        
                        <LiveFilterDropdown label="Mission" value={filters.Mission} options={["All", ...Array.from(new Set(verifications.map((row) => row.mission)))]} onChange={(value) => setFilter("Mission", value)} />
                        <LiveFilterDropdown label="Execution" value={filters.Execution} options={["All", ...Array.from(new Set(verifications.map((row) => row.execution)))]} onChange={(value) => setFilter("Execution", value)} />
                        <LiveFilterDropdown label="Verifier" value={filters.Verifier} options={["All", ...Array.from(new Set(verifications.map((row) => row.verifier)))]} onChange={(value) => setFilter("Verifier", value)} />
                        <LiveFilterDropdown label="Result" value={filters.Result} options={["All", "Passed", "Warning", "Failed"]} onChange={(value) => setFilter("Result", value)} />
                        <LiveFilterDropdown label="Confidence" value={filters.Confidence} options={confidenceOptions} onChange={(value) => setFilter("Confidence", value)} />
                        <LiveFilterDropdown label="Coverage" value={filters.Coverage} options={coverageOptions} onChange={(value) => setFilter("Coverage", value)} />
                        <div className="h-4 w-px bg-border mx-1 shrink-0" />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background/50">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10 shadow-[0_1px_0_rgba(255,255,255,0.1)]">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === verifications.length && verifications.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold">Verification ID</th>
                            <th className="px-4 py-3 font-semibold min-w-[150px]">Mission</th>
                            <th className="px-4 py-3 font-semibold">Execution</th>
                            <th className="px-4 py-3 font-semibold">Verifier</th>
                            <th className="px-4 py-3 font-semibold text-center text-emerald-500">PASS</th>
                            <th className="px-4 py-3 font-semibold text-center text-red-500">FAIL</th>
                            <th className="px-4 py-3 font-semibold text-center text-orange-500">UNKNOWN</th>
                            <th className="px-4 py-3 font-semibold w-32">Confidence</th>
                            <th className="px-4 py-3 font-semibold w-32">Evidence Coverage</th>
                            <th className="px-4 py-3 font-semibold">Certificate</th>
                            <th className="px-4 py-3 font-semibold">Completed</th>
                            <th className="px-4 py-3 font-semibold">Updated</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {visibleVerifications.map((vr) => (
                            <tr 
                                key={vr.id} 
                                onClick={() => openInspector("verification", { ...vr, name: vr.id })}
                                className={cn(
                                    "group hover:bg-muted/30 transition-colors cursor-pointer",
                                    selectedRows.has(vr.id) ? "bg-primary/5 hover:bg-primary/10" : ""
                                )}
                            >
                                <td className="px-6 py-4" onClick={(e) => toggleRow(vr.id, e)}>
                                    <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.has(vr.id)} readOnly />
                                </td>
                                <td className="px-4 py-4 font-mono font-bold text-foreground">
                                    {vr.id}
                                </td>
                                <td className="px-4 py-4">
                                    <span className="font-medium text-[13px]">{vr.mission}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="text-[12px] font-mono text-muted-foreground">{vr.execution}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                        <BadgeCheck className="size-3.5 text-muted-foreground" />
                                        <span className="text-[12px] font-mono text-muted-foreground">{vr.verifier}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className="font-mono text-[12px] text-emerald-500 font-bold">{vr.pass}</span>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className="font-mono text-[12px] text-red-500 font-bold">{vr.fail}</span>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className="font-mono text-[12px] text-orange-500 font-bold">{vr.unknown}</span>
                                </td>
                                <td className="px-4 py-4">
                                    {vr.completed === "--" ? (
                                        <span className="text-[11px] text-muted-foreground">--</span>
                                    ) : (
                                        <div className="flex flex-col gap-1.5 w-full">
                                            <div className="flex justify-between items-center text-[10px] font-mono font-bold text-muted-foreground">
                                                <span>{vr.confidenceScore}%</span>
                                            </div>
                                            <Progress value={vr.confidenceScore} className={cn("h-1.5", vr.fail > 0 ? "bg-red-500/20" : vr.unknown > 0 ? "bg-orange-500/20" : "bg-emerald-500/20")} indicatorClassName={vr.fail > 0 ? "bg-red-500" : vr.unknown > 0 ? "bg-orange-500" : "bg-emerald-500"} />
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-4">
                                    {vr.completed === "--" ? (
                                        <span className="text-[11px] text-muted-foreground">--</span>
                                    ) : (
                                        <div className="flex flex-col gap-1.5 w-full">
                                            <div className="flex justify-between items-center text-[10px] font-mono font-bold text-muted-foreground">
                                                <span>{vr.evidenceCoverage}%</span>
                                            </div>
                                            <Progress value={vr.evidenceCoverage} className="h-1.5" />
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "text-[11px] font-mono font-semibold",
                                        vr.certificate === "--" ? "text-muted-foreground" : "text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"
                                    )}>{vr.certificate}</span>
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {vr.completed}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {vr.updated}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="px-6 py-3 border-t border-border bg-card shrink-0">
                <span className="text-xs font-medium text-muted-foreground">Showing {visibleVerifications.length} of {verifications.length} verifications</span>
            </div>
        </div>
    );
}
