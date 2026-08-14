"use client";

import React, { useEffect, useState } from "react";
import { 
    Search, ChevronDown, ChevronLeft, ChevronRight,
    RefreshCw, TerminalSquare, Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "@/components/mission-control/universal-inspector";
import { getEpochOpenApiContract } from "@/lib/epoch-api";
import { LiveFilterDropdown } from "@/components/mission-control/ui/live-filter-dropdown";
import { exportLiveRows } from "@/components/mission-control/export-live-rows";

type ApiEndpointRow = {
    id: string;
    endpoint: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    service: string;
    version: string;
    authentication: string;
    status: "Active" | "Deprecated" | "Beta";
    lastUpdated: string;
    description: string;
    operation: Record<string, unknown>;
};

export function ApiExplorerView({ workspaceId: _workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [apiRecords, setApiRecords] = useState<ApiEndpointRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [version, setVersion] = useState("All");
    const [service, setService] = useState("All");
    const [method, setMethod] = useState("All");

    const loadContract = async () => {
        setIsLoading(true);
        try {
            const contract = await getEpochOpenApiContract();
            const paths = contract.paths && typeof contract.paths === "object" ? contract.paths as Record<string, unknown> : {};
            const rows: ApiEndpointRow[] = [];
            Object.entries(paths).forEach(([endpoint, operations]) => {
                if (!operations || typeof operations !== "object") return;
                Object.entries(operations as Record<string, unknown>).forEach(([method, operation], index) => {
                    if (!["GET", "POST", "PUT", "DELETE", "PATCH"].includes(method.toUpperCase())) return;
                    const data = operation && typeof operation === "object" ? operation as Record<string, unknown> : {};
                    rows.push({
                        id: `${method}-${endpoint}-${index}`,
                        endpoint,
                        method: method.toUpperCase() as ApiEndpointRow["method"],
                        service: String(data.tags && Array.isArray(data.tags) ? data.tags[0] ?? "Epoch Runtime" : "Epoch Runtime"),
                        version: "V12",
                        authentication: data.security ? "Bearer Token" : "Public",
                        status: "Active",
                        lastUpdated: "Live contract",
                        description: String(data.description ?? data.summary ?? "No description in the live OpenAPI contract."),
                        operation: data,
                    });
                });
            });
            setApiRecords(rows);
        } catch { setApiRecords([]); }
        finally { setIsLoading(false); }
    };
    useEffect(() => {
        void loadContract();
        const timer = window.setInterval(() => void loadContract(), 5000);
        return () => window.clearInterval(timer);
    }, []);

    const toggleRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRows(newSet);
    };

    const toggleAll = () => {
        if (selectedRows.size === visibleRecords.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(visibleRecords.map(m => m.id)));
    };
    const visibleRecords = apiRecords.filter((record) => (version === "All" || record.version === version) && (service === "All" || record.service === service) && (method === "All" || record.method === method) && `${record.endpoint} ${record.service} ${record.method}`.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 bg-background">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <TerminalSquare className="size-5 text-indigo-500" />
                            API Explorer
                        </h1>
                        <span className="text-xs text-muted-foreground mt-1">Manage and explore the Epoch Runtime API.</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => exportLiveRows("epoch-api-contract.json", visibleRecords)} className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm">
                            <Download className="size-3.5" />
                            Export
                        </button>
                        <button type="button" onClick={() => void loadContract()} className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm">
                            <RefreshCw className="size-3.5" />
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between px-6 py-3 bg-muted/20 overflow-visible">
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="relative w-64 shrink-0">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="Search Endpoints..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-8 pl-9 pr-3 text-xs bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/70 text-foreground"
                            />
                        </div>
                        <LiveFilterDropdown label="Version" value={version} options={["All", ...Array.from(new Set(apiRecords.map((record) => record.version)))]} onChange={setVersion} />
                        <LiveFilterDropdown label="Service" value={service} options={["All", ...Array.from(new Set(apiRecords.map((record) => record.service)))]} onChange={setService} />
                        <LiveFilterDropdown label="Method" value={method} options={["All", "GET", "POST", "PUT", "PATCH", "DELETE"]} onChange={setMethod} />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === apiRecords.length && apiRecords.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold w-24">Method</th>
                            <th className="px-4 py-3 font-semibold w-64">Endpoint</th>
                            <th className="px-4 py-3 font-semibold w-40">Service</th>
                            <th className="px-4 py-3 font-semibold w-24">Version</th>
                            <th className="px-4 py-3 font-semibold w-40">Authentication</th>
                            <th className="px-4 py-3 font-semibold w-32">Status</th>
                            <th className="px-4 py-3 font-semibold w-40">Last Updated</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {isLoading ? <tr><td colSpan={9} className="px-6 py-8 text-center text-muted-foreground">Loading API contract...</td></tr> : visibleRecords.length === 0 ? <tr><td colSpan={9} className="px-6 py-8 text-center text-muted-foreground">No API endpoints found.</td></tr> : visibleRecords.map((record) => (
                            <tr 
                                key={record.id} 
                                onClick={() => openInspector("api" as any, { ...record, context: 'developer', name: `API ${record.id}` })}
                                className={cn(
                                    "group hover:bg-muted/30 transition-colors cursor-pointer",
                                    selectedRows.has(record.id) ? "bg-primary/5 hover:bg-primary/10" : ""
                                )}
                            >
                                <td className="px-6 py-4" onClick={(e) => toggleRow(record.id, e)}>
                                    <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.has(record.id)} readOnly />
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                        record.method === "POST" ? "bg-emerald-500/10 text-emerald-500" :
                                        record.method === "GET" ? "bg-blue-500/10 text-blue-500" :
                                        record.method === "DELETE" ? "bg-red-500/10 text-red-500" :
                                        "bg-amber-500/10 text-amber-500"
                                    )}>
                                        {record.method}
                                    </span>
                                </td>
                                <td className="px-4 py-4 font-mono text-[13px] font-bold text-foreground">
                                    {record.endpoint}
                                </td>
                                <td className="px-4 py-4 font-medium text-muted-foreground">
                                    {record.service}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {record.version}
                                </td>
                                <td className="px-4 py-4 font-medium text-muted-foreground">
                                    {record.authentication}
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        record.status === "Active" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                        record.status === "Beta" ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20" :
                                        "bg-red-500/10 text-red-500 border border-red-500/20"
                                    )}>
                                        {record.status}
                                    </span>
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {record.lastUpdated}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
