"use client";

import React, { useEffect, useState } from "react";
import { 
    Search, Filter, Download, ChevronDown, ChevronLeft, ChevronRight,
    Building, Users, Activity, ShieldCheck, Plus, CheckCircle2,
    XCircle, Clock, PauseCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "../universal-inspector";
import { createDhyraInstitution, listDhyraInstitutions } from "@/lib/dhyra-api";
import { LiveFilterDropdown } from "../ui/live-filter-dropdown";

type InstitutionRow = {
    id: string;
    name: string;
    category: string;
    status: "Active" | "Maintenance" | "Archived" | "Pending Approval";
    version: string;
    owner: string;
    workersCount: number;
    missionsCount: number;
    policiesCount: number;
    memoryRecordsCount: string;
    updated: string;
};

function StatusBadge({ status }: { status: InstitutionRow["status"] }) {
    switch (status) {
        case "Active": return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-wider"><CheckCircle2 className="size-3" /> Active</span>;
        case "Maintenance": return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 text-orange-500 border border-orange-500/20 uppercase tracking-wider"><PauseCircle className="size-3" /> Maintenance</span>;
        case "Archived": return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border uppercase tracking-wider"><XCircle className="size-3" /> Archived</span>;
        case "Pending Approval": return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-wider"><Clock className="size-3" /> Pending</span>;
    }
}

export function WorkspaceInstitutions({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [institutions, setInstitutions] = useState<InstitutionRow[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [creating, setCreating] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [institutionName, setInstitutionName] = useState("");
    const [institutionCategory, setInstitutionCategory] = useState("Software Development");
    const [createError, setCreateError] = useState<string | null>(null);
    const institutionCategories = [
        "Software Development",
        "AI / Machine Learning",
        "Infrastructure",
        "Security",
        "Operations",
        "Research",
        "Finance",
        "Healthcare",
        "E-Commerce",
        "Other",
    ];
    useEffect(() => {
        if (!workspaceId) return;
        let cancelled = false;
        const load = () => listDhyraInstitutions(workspaceId)
            .then((items) => {
                if (cancelled) return;
                setInstitutions(items.map((item) => ({ id: item.id, name: item.name, category: (item.category ?? "Infrastructure") as InstitutionRow["category"], status: (item.status ?? "Active") as InstitutionRow["status"], version: item.version ?? "-", owner: "Workspace", workersCount: 0, missionsCount: item.missionCount ?? 0, policiesCount: 0, memoryRecordsCount: "-", updated: item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "-" })));
            })
            .catch(() => undefined);
        void load();
        const interval = window.setInterval(() => void load(), 5000);
        return () => { cancelled = true; window.clearInterval(interval); };
    }, [workspaceId]);

    const toggleRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRows(newSet);
    };

    const toggleAll = () => {
        if (selectedRows.size === visibleInstitutions.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(visibleInstitutions.map(m => m.id)));
    };

    const visibleInstitutions = institutions.filter((institution) => {
        const query = searchQuery.trim().toLowerCase();
        return (!query || JSON.stringify(institution).toLowerCase().includes(query)) &&
            (statusFilter === "All" || institution.status === statusFilter) &&
            (categoryFilter === "All" || institution.category === categoryFilter);
    });

    const exportInstitutions = () => {
        const blob = new Blob([JSON.stringify(visibleInstitutions, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "dhyra-institutions.json";
        anchor.click();
        URL.revokeObjectURL(url);
    };

    const createInstitution = async () => {
        if (!workspaceId || creating) return;
        if (!institutionName.trim()) {
            setCreateError("Enter an institution name.");
            return;
        }
        setCreating(true);
        setCreateError(null);
        try {
            await createDhyraInstitution(workspaceId, { name: institutionName.trim(), category: institutionCategory });
            const refreshed = await listDhyraInstitutions(workspaceId);
            setInstitutions(refreshed.map((item) => ({ id: item.id, name: item.name, category: (item.category ?? "Infrastructure") as InstitutionRow["category"], status: (item.status ?? "Active") as InstitutionRow["status"], version: item.version ?? "-", owner: "Workspace", workersCount: 0, missionsCount: item.missionCount ?? 0, policiesCount: 0, memoryRecordsCount: "-", updated: item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "-" })));
            setInstitutionName("");
            setInstitutionCategory("Software Development");
            setCreateOpen(false);
        } catch (cause) {
            setCreateError(cause instanceof Error ? cause.message : "Institution creation failed.");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 border-b border-border bg-card">
                <div className="flex items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Organizations</h1>
                    <div className="flex items-center gap-2">
                        <button onClick={exportInstitutions} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors shadow-sm">
                            <Download className="size-3.5" />
                            Export
                        </button>
                        <button onClick={() => { setCreateError(null); setCreateOpen(true); }} disabled={creating} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50">
                            <Plus className="size-3.5" />
                            New Institution
                        </button>
                    </div>
                </div>

                <div className="relative z-30 flex items-center justify-between px-6 py-3 bg-muted/20 border-t border-border overflow-visible">
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="relative w-64 shrink-0">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="Search institutions, owners..." 
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                className="w-full h-8 pl-9 pr-3 text-xs bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/70 text-foreground"
                            />
                        </div>
                        <LiveFilterDropdown label="Category" value={categoryFilter} options={["All", ...Array.from(new Set(institutions.map((institution) => institution.category)))]} onChange={setCategoryFilter} />
                        <LiveFilterDropdown label="Status" value={statusFilter} options={["All", ...Array.from(new Set(institutions.map((institution) => institution.status)))]} onChange={setStatusFilter} />
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0 ml-4">
                        <div className="flex items-center gap-1 text-xs font-medium shrink-0">
                            <button className="px-3 py-1.5 rounded-md bg-muted text-foreground">All</button>
                        </div>
                        
                        {selectedRows.size > 0 ? <span className="text-[11px] font-medium text-muted-foreground">{selectedRows.size} selected</span> : null}
                    </div>
                </div>
            </div>

            {createOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="create-institution-title">
                <form onSubmit={(event) => { event.preventDefault(); void createInstitution(); }} className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-2xl">
                    <h2 id="create-institution-title" className="text-base font-semibold text-foreground">Create institution</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Create an institution in this workspace.</p>
                    <label className="mt-5 block text-xs font-semibold text-foreground">Institution name<input autoFocus value={institutionName} onChange={(event) => setInstitutionName(event.target.value)} placeholder="e.g. My AI Startup" className="mt-2 h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" /></label>
                    <label className="mt-4 block text-xs font-semibold text-foreground">Category<select value={institutionCategory} onChange={(event) => setInstitutionCategory(event.target.value)} className="mt-2 h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary">{institutionCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
                    {createError && <p className="mt-2 text-xs text-red-500">{createError}</p>}
                    <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => { setCreateOpen(false); setCreateError(null); }} className="rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-muted">Cancel</button><button type="submit" disabled={creating} className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">{creating ? "Creating..." : "Create institution"}</button></div>
                </form>
            </div>}

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background/50 custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10 shadow-[0_1px_0_rgba(255,255,255,0.1)]">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === institutions.length && institutions.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Institution</th>
                            <th className="px-4 py-3 font-semibold">Category</th>
                            <th className="px-4 py-3 font-semibold">Version</th>
                            <th className="px-4 py-3 font-semibold">Owner</th>
                            <th className="px-4 py-3 font-semibold text-center">Workers</th>
                            <th className="px-4 py-3 font-semibold text-center">Missions</th>
                            <th className="px-4 py-3 font-semibold text-center">Policies</th>
                            <th className="px-4 py-3 font-semibold text-center">Memory</th>
                            <th className="px-4 py-3 font-semibold text-right">Updated</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {visibleInstitutions.map((inst) => (
                            <tr 
                                key={inst.id} 
                                onClick={() => openInspector("institution", inst)}
                                className={cn(
                                    "group hover:bg-muted/30 transition-colors cursor-pointer",
                                    selectedRows.has(inst.id) ? "bg-primary/5 hover:bg-primary/10" : ""
                                )}
                            >
                                <td className="px-6 py-4" onClick={(e) => toggleRow(inst.id, e)}>
                                    <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.has(inst.id)} readOnly />
                                </td>
                                <td className="px-4 py-4">
                                    <StatusBadge status={inst.status} />
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-semibold text-foreground flex items-center gap-2">
                                            <Building className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            {inst.name}
                                        </span>
                                        <span className="text-xs font-mono text-muted-foreground">{inst.id}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="px-2 py-1 bg-muted rounded-md text-xs font-medium text-foreground">{inst.category}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="font-mono text-xs text-muted-foreground">{inst.version}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="text-muted-foreground">{inst.owner}</span>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className="font-medium text-foreground">{inst.workersCount}</span>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className="font-medium text-foreground">{inst.missionsCount}</span>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className="font-medium text-foreground">{inst.policiesCount}</span>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className="font-medium text-foreground">{inst.memoryRecordsCount}</span>
                                </td>
                                <td className="px-4 py-4 text-right text-muted-foreground whitespace-nowrap">
                                    {inst.updated}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
