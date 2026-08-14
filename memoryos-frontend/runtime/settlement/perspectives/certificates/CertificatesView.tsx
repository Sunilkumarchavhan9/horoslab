"use client";

import React, { useState } from "react";
import { 
    Search, ChevronDown, ChevronLeft, ChevronRight,
    RefreshCw, CheckCircle2, XCircle, FileBadge2, ShieldCheck, Download, Clock, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "@/components/mission-control/universal-inspector";

type CertificateRow = {
    id: string;
    mission: string;
    institution: string;
    issued: string;
    issuer: string;
    version: string;
    status: string;
};

export function CertificatesView() {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [certificates, setCertificates] = useState<CertificateRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCertificates = React.useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/epoch/settlement/certificates");
            if (res.ok) {
                const { data } = await res.json();
                setCertificates(data.map((c: any) => ({
                    id: c.id,
                    mission: c.mission?.title || c.missionId || "Unknown Mission",
                    institution: "System",
                    issued: c.issuedAt ? new Date(c.issuedAt).toLocaleString() : new Date(c.createdAt).toLocaleString(),
                    issuer: c.issuerId || "Epoch Core Authority",
                    version: "v1.0",
                    status: c.status === "active" ? "Active" : c.status === "revoked" ? "Revoked" : "Expired"
                })));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchCertificates();
    }, [fetchCertificates]);

    const toggleRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRows(newSet);
    };

    const toggleAll = () => {
        if (selectedRows.size === certificates.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(certificates.map(m => m.id)));
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 border-b border-border bg-card">
                <div className="flex items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Certificates</h1>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm">
                            <Download className="size-3.5" />
                            Export
                        </button>
                        <button 
                            onClick={fetchCertificates}
                            disabled={isLoading}
                            className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm disabled:opacity-50"
                        >
                            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between px-6 py-3 bg-muted/20 border-t border-border overflow-x-auto custom-scrollbar">
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
                        
                        <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0">
                            Mission <ChevronDown className="size-3" />
                        </button>
                        <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0">
                            Institution <ChevronDown className="size-3" />
                        </button>
                        <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0">
                            Certificate Type <ChevronDown className="size-3" />
                        </button>
                        <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0">
                            Status <ChevronDown className="size-3" />
                        </button>
                        <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0">
                            <Calendar className="size-3.5" /> Date Range
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-xs font-medium text-muted-foreground">{certificates.length} Certificates Found</span>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background/50 custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10 shadow-[0_1px_0_rgba(255,255,255,0.1)]">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === certificates.length && certificates.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold w-40">Certificate</th>
                            <th className="px-4 py-3 font-semibold w-32">Mission</th>
                            <th className="px-4 py-3 font-semibold w-40">Institution</th>
                            <th className="px-4 py-3 font-semibold w-40">Issued</th>
                            <th className="px-4 py-3 font-semibold w-48">Issuer</th>
                            <th className="px-4 py-3 font-semibold w-32">Version</th>
                            <th className="px-4 py-3 font-semibold w-32">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {isLoading && certificates.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground text-sm">Loading certificates...</td>
                            </tr>
                        ) : certificates.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground text-sm">No certificates found.</td>
                            </tr>
                        ) : certificates.map((record) => (
                            <tr 
                                key={record.id} 
                                onClick={() => openInspector("certificate" as any, { ...record, context: 'settlement', name: `Certificate ${record.id}` })}
                                className={cn(
                                    "group hover:bg-muted/30 transition-colors cursor-pointer",
                                    selectedRows.has(record.id) ? "bg-primary/5 hover:bg-primary/10" : ""
                                )}
                            >
                                <td className="px-6 py-4" onClick={(e) => toggleRow(record.id, e)}>
                                    <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.has(record.id)} readOnly />
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] font-bold text-foreground flex items-center gap-2">
                                    <FileBadge2 className="size-3.5 text-amber-500" />
                                    {record.id}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {record.mission}
                                </td>
                                <td className="px-4 py-4 font-medium text-foreground">
                                    {record.institution}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {record.issued}
                                </td>
                                <td className="px-4 py-4 font-medium text-foreground">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="size-3.5 text-muted-foreground" />
                                        {record.issuer}
                                    </div>
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {record.version}
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        record.status === "Active" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                        record.status === "Expired" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                        "bg-red-500/10 text-red-500 border border-red-500/20"
                                    )}>
                                        {record.status === "Active" && <CheckCircle2 className="size-3" />}
                                        {record.status === "Expired" && <Clock className="size-3" />}
                                        {record.status === "Revoked" && <XCircle className="size-3" />}
                                        {record.status}
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
