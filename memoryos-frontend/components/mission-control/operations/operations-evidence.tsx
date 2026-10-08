"use client";

import React, { useEffect, useState } from "react";
import { 
    Search, Filter, Download, ChevronDown, ChevronLeft, ChevronRight,
    FileCode2, CheckCircle2, ShieldCheck, FileJson, XCircle, Clock, Server, FileText, Database, ShieldAlert, Image as ImageIcon, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "../universal-inspector";
import { Badge } from "@/components/ui/badge";
import { listHorosEvidence, type HorosEvidence } from "@/lib/horos-api";
import { LiveFilterDropdown } from "../ui/live-filter-dropdown";
import { exportLiveRows } from "../export-live-rows";

type EvidenceRow = {
    id: string;
    mission: string;
    execution: string;
    worker: string;
    artifactType: "Log" | "JSON" | "Database Dump" | "Code" | "Screenshot";
    hash: string;
    verificationStatus: "Verified" | "Pending" | "Failed" | "Tampered";
    retention: string;
    status: "Active" | "Archived" | "Purged";
    createdAt: string;
    size: string;
};

const MOCK_EVIDENCE: EvidenceRow[] = [
    { id: "EVD-9921", mission: "MSN-8991: Payment Gateway", execution: "EX-4412", worker: "WRK-9004", artifactType: "Database Dump", hash: "sha256:8f2a...91b4", verificationStatus: "Verified", retention: "7 Years", status: "Active", createdAt: "10:16:44", size: "45.2 MB" },
    { id: "EVD-9922", mission: "MSN-8991: Payment Gateway", execution: "EX-4412", worker: "WRK-9004", artifactType: "JSON", hash: "sha256:1a9c...0f22", verificationStatus: "Verified", retention: "1 Year", status: "Active", createdAt: "10:17:12", size: "12 KB" },
    { id: "EVD-9923", mission: "MSN-8984: Quarterly Report", execution: "EX-4413", worker: "WRK-9001", artifactType: "Log", hash: "sha256:77c1...b5a1", verificationStatus: "Pending", retention: "30 Days", status: "Active", createdAt: "10:21:05", size: "1.4 MB" },
    { id: "EVD-9924", mission: "MSN-8996: Audit Logs", execution: "EX-4415", worker: "WRK-9002", artifactType: "Screenshot", hash: "sha256:4d8e...9011", verificationStatus: "Failed", retention: "30 Days", status: "Active", createdAt: "09:05:30", size: "2.1 MB" },
    { id: "EVD-9925", mission: "MSN-8997: Update DNS", execution: "EX-4416", worker: "System", artifactType: "Code", hash: "sha256:cc90...aa12", verificationStatus: "Tampered", retention: "1 Year", status: "Archived", createdAt: "08:16:22", size: "4 KB" },
];

function ArtifactIcon({ type }: { type: EvidenceRow["artifactType"] }) {
    switch (type) {
        case "Log": return <FileText className="size-4 text-slate-500" />;
        case "JSON": return <FileJson className="size-4 text-yellow-500" />;
        case "Database Dump": return <Database className="size-4 text-blue-500" />;
        case "Code": return <FileCode2 className="size-4 text-purple-500" />;
        case "Screenshot": return <ImageIcon className="size-4 text-emerald-500" />;
    }
}

function VerificationBadge({ status }: { status: EvidenceRow["verificationStatus"] }) {
    switch (status) {
        case "Verified": return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-wider"><ShieldCheck className="size-3" /> Verified</span>;
        case "Pending": return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-wider"><Clock className="size-3" /> Pending</span>;
        case "Failed": return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-500 border border-red-500/20 uppercase tracking-wider"><XCircle className="size-3" /> Failed</span>;
        case "Tampered": return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/20 text-red-500 border border-red-500/50 uppercase tracking-wider animate-pulse"><ShieldAlert className="size-3" /> Tampered</span>;
    }
}

function toEvidenceRow(evidence: HorosEvidence): EvidenceRow {
    const raw = evidence as HorosEvidence & Record<string, unknown>;
    const kind = String(raw.kind || raw.contentType || "Log");
    const artifactType: EvidenceRow["artifactType"] = kind.toLowerCase().includes("json") ? "JSON" : kind.toLowerCase().includes("code") ? "Code" : kind.toLowerCase().includes("image") ? "Screenshot" : kind.toLowerCase().includes("database") ? "Database Dump" : "Log";
    return {
        id: evidence.id,
        mission: String(raw.missionId || "Mission evidence"),
        execution: String(raw.executionRunId || "-"),
        worker: String(raw.workerId || "Runtime worker"),
        artifactType,
        hash: String(raw.sha256 || raw.hash || "Not recorded"),
        verificationStatus: String(raw.verificationStatus || raw.verificationDecision || "PENDING").toUpperCase() === "PASS" || String(raw.verificationStatus || "").toLowerCase() === "verified" ? "Verified" : String(raw.verificationStatus || raw.verificationDecision || "").toUpperCase() === "FAIL" ? "Failed" : String(raw.integrityStatus || "").toLowerCase() === "tampered" ? "Tampered" : "Pending",
        retention: String(raw.retentionClass || "Policy controlled"),
        status: String(raw.status || "active").toLowerCase() === "archived" ? "Archived" : String(raw.status || "active").toLowerCase() === "purged" ? "Purged" : "Active",
        createdAt: evidence.createdAt ? new Date(evidence.createdAt).toLocaleString() : "-",
        size: String(raw.size || "-")
    };
}

export function OperationsEvidence({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
    const [filters, setFilters] = useState<Record<string, string>>({});
    const visibleEvidence = evidence.filter((row) => {
        const query = searchQuery.trim().toLowerCase();
        const matches = (key: string, value: string) => !filters[key] || filters[key] === "All" || filters[key] === value;
        return (!query || JSON.stringify(row).toLowerCase().includes(query)) && matches("Mission", row.mission) && matches("Execution", row.execution) && matches("Worker", row.worker) && matches("Evidence Type", row.artifactType) && matches("Verification", row.verificationStatus) && matches("Retention", row.retention);
    });
    const optionsFor = (key: keyof EvidenceRow) => ["All", ...Array.from(new Set(evidence.map((row) => String(row[key]))))];
    const setFilter = (key: string, value: string) => setFilters((current) => ({ ...current, [key]: value }));

    useEffect(() => {
        if (!workspaceId) {
            setEvidence([]);
            return;
        }
        let cancelled = false;
        const load = async () => {
            try {
                const result = await listHorosEvidence(workspaceId);
                if (!cancelled) setEvidence(result.items.map(toEvidenceRow));
            } catch {
                if (!cancelled) setEvidence([]);
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
        if (selectedRows.size === evidence.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(evidence.map(m => m.id)));
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 border-b border-border bg-card">
                <div className="flex items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Mission Evidence</h1>
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => exportLiveRows("horos-evidence.json", visibleEvidence)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-sm">
                            <Download className="size-3.5" />
                            Export Package
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between px-6 py-3 bg-muted/20 border-t border-border overflow-visible">
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="relative w-48 shrink-0">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="Search hashes, IDs..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-8 pl-9 pr-3 text-xs bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/70 text-foreground"
                            />
                        </div>
                        
                        <LiveFilterDropdown label="Mission" value={filters.Mission} options={optionsFor("mission")} onChange={(value) => setFilter("Mission", value)} />
                        <LiveFilterDropdown label="Execution" value={filters.Execution} options={optionsFor("execution")} onChange={(value) => setFilter("Execution", value)} />
                        <LiveFilterDropdown label="Worker" value={filters.Worker} options={optionsFor("worker")} onChange={(value) => setFilter("Worker", value)} />
                        <LiveFilterDropdown label="Evidence Type" value={filters["Evidence Type"]} options={optionsFor("artifactType")} onChange={(value) => setFilter("Evidence Type", value)} />
                        <LiveFilterDropdown label="Verification" value={filters.Verification} options={optionsFor("verificationStatus")} onChange={(value) => setFilter("Verification", value)} />
                        <LiveFilterDropdown label="Retention" value={filters.Retention} options={optionsFor("retention")} onChange={(value) => setFilter("Retention", value)} />
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
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === evidence.length && evidence.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold">Evidence ID</th>
                            <th className="px-4 py-3 font-semibold min-w-[200px]">Mission</th>
                            <th className="px-4 py-3 font-semibold">Execution</th>
                            <th className="px-4 py-3 font-semibold">Worker</th>
                            <th className="px-4 py-3 font-semibold">Evidence Type</th>
                            <th className="px-4 py-3 font-semibold">Captured</th>
                            <th className="px-4 py-3 font-semibold">Verification</th>
                            <th className="px-4 py-3 font-semibold">Hash</th>
                            <th className="px-4 py-3 font-semibold">Bundle</th>
                            <th className="px-4 py-3 font-semibold">Retention</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {visibleEvidence.map((ev) => (
                            <tr 
                                key={ev.id} 
                                onClick={() => openInspector("evidence", { ...ev, name: ev.id })}
                                className={cn(
                                    "group hover:bg-muted/30 transition-colors cursor-pointer",
                                    selectedRows.has(ev.id) ? "bg-primary/5 hover:bg-primary/10" : ""
                                )}
                            >
                                <td className="px-6 py-4" onClick={(e) => toggleRow(ev.id, e)}>
                                    <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.has(ev.id)} readOnly />
                                </td>
                                <td className="px-4 py-4 font-mono font-bold text-foreground">
                                    {ev.id}
                                </td>
                                <td className="px-4 py-4">
                                    <span className="font-medium text-[13px]">{ev.mission}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="text-[12px] font-mono text-muted-foreground">{ev.execution}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                        <Server className="size-3.5 text-muted-foreground" />
                                        <span className="text-[12px] font-mono text-foreground">{ev.worker}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2 text-[13px]">
                                        <ArtifactIcon type={ev.artifactType} />
                                        <span>{ev.artifactType}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {ev.createdAt}
                                </td>
                                <td className="px-4 py-4">
                                    <VerificationBadge status={ev.verificationStatus} />
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {ev.hash}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {ev.size}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {ev.retention}
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "text-[10px] uppercase font-bold tracking-wider",
                                        ev.status === "Active" ? "text-emerald-500" : "text-muted-foreground"
                                    )}>{ev.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="px-6 py-3 border-t border-border bg-card shrink-0">
                <span className="text-xs font-medium text-muted-foreground">Showing {visibleEvidence.length} of {evidence.length} evidence records</span>
            </div>
        </div>
    );
}
