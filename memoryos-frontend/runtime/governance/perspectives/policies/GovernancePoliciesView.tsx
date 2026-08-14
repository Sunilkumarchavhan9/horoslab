"use client";

import React, { useState } from "react";
import { Search, ListFilter, Calendar, ChevronDown, CheckCircle2, ShieldAlert, Scale, Download, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useInspector } from "@/components/mission-control/universal-inspector";

const MOCK_POLICIES = [
    {
        id: "POL-SEC-01",
        name: "Data Exfiltration Prevention",
        authority: "Strict",
        institution: "Acme Corp",
        scope: "Global",
        version: "v2.1",
        status: "Active",
        created: "2025-11-12",
        updated: "2026-07-28"
    },
    {
        id: "POL-FIN-12",
        name: "Cloud Spend Limits",
        authority: "Moderate",
        institution: "Acme Corp",
        scope: "Engineering",
        version: "v1.4",
        status: "Active",
        created: "2026-01-05",
        updated: "2026-06-15"
    },
    {
        id: "POL-OPS-04",
        name: "Production Deployment Gates",
        authority: "Strict",
        institution: "Acme Corp",
        scope: "Global",
        version: "v3.0",
        status: "Draft",
        created: "2026-08-01",
        updated: "2026-08-01"
    },
];

export function GovernancePoliciesView() {
    const { openInspector } = useInspector();
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col shrink-0 border-b border-border bg-card">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Scale className="size-5 text-indigo-500" />
                            Policies
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded hover:bg-primary/90 transition-colors">
                            <Plus className="size-3.5" />
                            Create Policy
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between px-6 py-3 bg-muted/20 border-t border-border overflow-x-auto custom-scrollbar">
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="relative w-64 shrink-0">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search policies..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-8 pl-9 pr-3 text-xs bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/70 text-foreground"
                            />
                        </div>
                        <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0 shadow-sm">
                            <ListFilter className="size-3.5" /> Type <ChevronDown className="size-3" />
                        </button>
                        <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0 shadow-sm">
                            Institution <ChevronDown className="size-3" />
                        </button>
                        <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0 shadow-sm">
                            Environment <ChevronDown className="size-3" />
                        </button>
                        <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0 shadow-sm">
                            Status <ChevronDown className="size-3" />
                        </button>
                        <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0 shadow-sm">
                            Version <ChevronDown className="size-3" />
                        </button>
                        <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0 shadow-sm">
                            <Calendar className="size-3.5" /> Date <ChevronDown className="size-3" />
                        </button>
                        <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0 shadow-sm">
                            <Download className="size-3.5" /> Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background/50 custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10 shadow-[0_1px_0_rgba(255,255,255,0.1)]">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold">Policy Name</th>
                            <th className="px-4 py-3 font-semibold">Authority</th>
                            <th className="px-4 py-3 font-semibold">Institution</th>
                            <th className="px-4 py-3 font-semibold">Scope</th>
                            <th className="px-4 py-3 font-semibold">Version</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Created</th>
                            <th className="px-4 py-3 font-semibold text-right">Updated</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {MOCK_POLICIES.map((row) => (
                            <tr
                                key={row.id}
                                onClick={() => openInspector("governance", { type: "policy", data: row })}
                                className="group hover:bg-muted/30 transition-colors cursor-pointer"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-semibold text-foreground flex items-center gap-2">
                                            <Scale className="size-3.5 text-indigo-500" />
                                            {row.name}
                                        </span>
                                        <span className="font-mono text-[10px] text-muted-foreground">{row.id}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <Badge variant="outline" className={cn(
                                        "font-mono text-[10px] tracking-wide",
                                        row.authority === "Strict" ? "text-red-500 border-red-500/30 bg-red-500/5" : "text-amber-500 border-amber-500/30 bg-amber-500/5"
                                    )}>
                                        <ShieldAlert className="size-3 mr-1" />
                                        {row.authority}
                                    </Badge>
                                </td>
                                <td className="px-4 py-4 text-xs font-medium text-foreground">{row.institution}</td>
                                <td className="px-4 py-4 text-xs text-muted-foreground">{row.scope}</td>
                                <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{row.version}</td>
                                <td className="px-4 py-4">
                                    <Badge variant="outline" className={cn(
                                        "font-mono text-[10px] tracking-wide",
                                        row.status === "Active" ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/5" : "text-muted-foreground border-border bg-muted/50"
                                    )}>
                                        {row.status === "Active" && <CheckCircle2 className="size-3 mr-1" />}
                                        {row.status}
                                    </Badge>
                                </td>
                                <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{row.created}</td>
                                <td className="px-4 py-4 text-right font-mono text-xs text-muted-foreground">{row.updated}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
