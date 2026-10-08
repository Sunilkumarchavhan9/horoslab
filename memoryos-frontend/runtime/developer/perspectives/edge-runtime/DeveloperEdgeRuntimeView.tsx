"use client";

import React, { useEffect, useState } from "react";
import { 
    Search, ChevronDown, ChevronLeft, ChevronRight,
    Server, Download, Plus, Signal, CloudOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "@/components/mission-control/universal-inspector";
import { enrollHorosEdgeWorker, listHorosWorkers } from "@/lib/horos-api";
import { exportLiveRows } from "@/components/mission-control/export-live-rows";
import { LiveFilterDropdown } from "@/components/mission-control/ui/live-filter-dropdown";

type EdgeRuntimeRow = {
    id: string;
    device: string;
    identity: string;
    region: string;
    status: "Online" | "Offline" | "Syncing" | "Error";
    runtime: "v2.1.0" | "v2.0.4" | "v1.9.8";
    lastHeartbeat: string;
    offlineMode: boolean;
};

export function DeveloperEdgeRuntimeView({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [edgeRecords, setEdgeRecords] = useState<EdgeRuntimeRow[]>([]);
    const [isLoading, setIsLoading] = useState(Boolean(workspaceId));
    const [statusFilter, setStatusFilter] = useState("All");
    const [regionFilter, setRegionFilter] = useState("All");
    const [enrollOpen, setEnrollOpen] = useState(false);
    const [workerId, setWorkerId] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!workspaceId) return;
        let active = true;
        const load = () => listHorosWorkers(workspaceId).then((workers) => {
            if (!active) return;
            const rows = workers.filter((worker) => {
                const metadata = worker.metadata && typeof worker.metadata === "object" ? worker.metadata as Record<string, unknown> : {};
                return worker.kind === "edge" || Boolean(metadata.edgeEnrollment) || Boolean(metadata.edgeTelemetry);
            }).map((worker) => {
                const metadata = worker.metadata && typeof worker.metadata === "object" ? worker.metadata as Record<string, unknown> : {};
                const telemetry = metadata.edgeTelemetry && typeof metadata.edgeTelemetry === "object" ? metadata.edgeTelemetry as Record<string, unknown> : {};
                const connectivity = String(telemetry.connectivity ?? worker.status ?? "offline").toLowerCase();
                return { id: String(worker.id ?? "edge-worker"), device: String(worker.name ?? worker.id ?? "Edge worker"), identity: String(worker.id ?? "-"), region: String(worker.region ?? "-"), status: (connectivity === "online" || connectivity === "available" ? "Online" : connectivity === "syncing" ? "Syncing" : connectivity === "error" ? "Error" : "Offline") as EdgeRuntimeRow["status"], runtime: String(worker.version ?? "-") as EdgeRuntimeRow["runtime"], lastHeartbeat: String(worker.updatedAt ?? "-"), offlineMode: connectivity === "offline" } satisfies EdgeRuntimeRow;
            });
            setEdgeRecords(rows);
        }).catch(() => { if (active) setEdgeRecords([]); }).finally(() => { if (active) setIsLoading(false); });
        void load();
        const timer = window.setInterval(() => void load(), 5000);
        return () => { active = false; window.clearInterval(timer); };
    }, [workspaceId]);
    const enroll = async (event: React.FormEvent) => { event.preventDefault(); if (!workspaceId || !workerId.trim()) return; try { setError(null); await enrollHorosEdgeWorker(workspaceId, workerId.trim()); setWorkerId(""); setEnrollOpen(false); window.location.reload(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to enroll edge worker."); } };
    const visibleEdgeRecords = edgeRecords.filter((record) => (statusFilter === "All" || record.status === statusFilter) && (regionFilter === "All" || record.region === regionFilter) && `${record.device} ${record.identity} ${record.region}`.toLowerCase().includes(searchQuery.toLowerCase()));

    const toggleRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRows(newSet);
    };

    const toggleAll = () => {
        if (selectedRows.size === edgeRecords.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(edgeRecords.map(m => m.id)));
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 bg-background">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Server className="size-5 text-indigo-500" />
                            Edge Registry
                        </h1>
                        <span className="text-xs text-muted-foreground mt-1">Manage edge workers and remote deployments.</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => exportLiveRows("horos-edge-workers.json", visibleEdgeRecords)} className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm">
                            <Download className="size-3.5" />
                            Export
                        </button>
                        <button type="button" onClick={() => setEnrollOpen((value) => !value)} className="flex items-center gap-2 bg-primary px-3 py-1.5 rounded-md text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
                            <Plus className="size-3.5" />
                            Enroll Device
                        </button>
                    </div>
                </div>
                {enrollOpen && <form onSubmit={enroll} className="mx-6 mb-4 flex gap-2 rounded-md border border-border bg-card p-3"><input value={workerId} onChange={(event) => setWorkerId(event.target.value)} placeholder="Existing edge worker ID" className="h-9 flex-1 rounded border border-border bg-background px-3 text-xs" required /><button disabled={!workspaceId} className="rounded bg-primary px-4 text-xs font-semibold text-primary-foreground">Enroll</button></form>}
                {error && <p className="mx-6 mb-3 text-xs text-red-500">{error}</p>}

                <div className="flex items-center justify-between px-6 py-3 bg-muted/20 overflow-visible">
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="relative w-64 shrink-0">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="Search Edge devices..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-8 pl-9 pr-3 text-xs bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/70 text-foreground"
                            />
                        </div>
                        <LiveFilterDropdown label="Region" value={regionFilter} options={["All", ...Array.from(new Set(edgeRecords.map((record) => record.region)))]} onChange={setRegionFilter} />
                        <LiveFilterDropdown label="Status" value={statusFilter} options={["All", "Online", "Offline", "Syncing", "Error"]} onChange={setStatusFilter} />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === edgeRecords.length && edgeRecords.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold w-56">Device</th>
                            <th className="px-4 py-3 font-semibold w-48">Worker Identity</th>
                            <th className="px-4 py-3 font-semibold w-32">Region</th>
                            <th className="px-4 py-3 font-semibold w-24">Version</th>
                            <th className="px-4 py-3 font-semibold w-24">Offline</th>
                            <th className="px-4 py-3 font-semibold w-32">Last Heartbeat</th>
                            <th className="px-4 py-3 font-semibold w-32">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {isLoading ? <tr><td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">Loading edge workers...</td></tr> : visibleEdgeRecords.length === 0 ? <tr><td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">No enrolled edge workers found.</td></tr> : visibleEdgeRecords.map((record) => (
                            <tr 
                                key={record.id} 
                                onClick={() => openInspector("edge_runtime" as any, { ...record, workspaceId, context: 'developer', name: record.device })}
                                className={cn(
                                    "group hover:bg-muted/30 transition-colors cursor-pointer",
                                    selectedRows.has(record.id) ? "bg-primary/5 hover:bg-primary/10" : ""
                                )}
                            >
                                <td className="px-6 py-4" onClick={(e) => toggleRow(record.id, e)}>
                                    <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.has(record.id)} readOnly />
                                </td>
                                <td className="px-4 py-4 font-medium text-foreground">
                                    <div className="flex items-center gap-2">
                                        <Server className="size-4 text-muted-foreground" />
                                        {record.device}
                                    </div>
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] font-bold text-muted-foreground">
                                    {record.identity}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {record.region}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] font-bold text-muted-foreground">
                                    {record.runtime}
                                </td>
                                <td className="px-4 py-4">
                                    {record.offlineMode ? (
                                        <CloudOff className="size-4 text-orange-400" />
                                    ) : (
                                        <Signal className="size-4 text-emerald-400" />
                                    )}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {record.lastHeartbeat}
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        record.status === "Online" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                        record.status === "Syncing" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                                        record.status === "Error" ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                                        "bg-muted/50 text-muted-foreground border border-border/50"
                                    )}>
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
