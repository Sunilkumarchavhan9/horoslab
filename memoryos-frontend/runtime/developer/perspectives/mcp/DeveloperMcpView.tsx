"use client";

import React, { useEffect, useState } from "react";
import { 
    Search, ChevronDown, ChevronLeft, ChevronRight,
    TerminalSquare, Download, Link as LinkIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "@/components/mission-control/universal-inspector";
import { connectHorosMcpConnection, listHorosMcpConnections, registerHorosMcpConnection } from "@/lib/horos-api";
import { LiveFilterDropdown } from "@/components/mission-control/ui/live-filter-dropdown";
import { exportLiveRows } from "@/components/mission-control/export-live-rows";

type McpRow = {
    id: string;
    serverName: string;
    uri: string;
    capabilities: string[];
    resources: string;
    policies: string[];
    status: "Connected" | "Disconnected" | "Error";
};

export function DeveloperMcpView({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [records, setRecords] = useState<McpRow[]>([]);
    const [registerOpen, setRegisterOpen] = useState(false);
    const [registering, setRegistering] = useState(false);
    const [registerError, setRegisterError] = useState<string | null>(null);
    const [form, setForm] = useState({ name: "", uri: "", token: "" });
    const [connecting, setConnecting] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState("All");
    const [capabilityFilter, setCapabilityFilter] = useState("All");
    const [policyFilter, setPolicyFilter] = useState("All");
    const [setupOpen, setSetupOpen] = useState(false);
    const loadConnections = React.useCallback(async () => {
        if (!workspaceId) return;
        try {
            setLoadError(null);
            const items = await listHorosMcpConnections(workspaceId);
            setRecords(items.map((item) => ({ id: item.id, serverName: item.name ?? item.id, uri: String(item.config?.uri ?? item.client ?? "-"), capabilities: Array.isArray(item.config?.capabilities) ? item.config!.capabilities as string[] : [], resources: Array.isArray(item.config?.resources) ? `${item.config!.resources.length} discovered` : String(item.config?.resources ?? "-"), policies: Array.isArray(item.config?.policies) ? item.config!.policies as string[] : [], status: item.status === "connected" ? "Connected" : item.status === "error" ? "Error" : "Disconnected" })));
        } catch (cause) {
            setLoadError(cause instanceof Error ? cause.message : "Unable to load MCP connections.");
        } finally {
            setLoading(false);
        }
    }, [workspaceId]);
    useEffect(() => {
        void loadConnections();
        const timer = window.setInterval(() => void loadConnections(), 5000);
        return () => window.clearInterval(timer);
    }, [loadConnections]);
    const registerServer = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!workspaceId || !form.name.trim() || !form.uri.trim()) { setRegisterError("Server name and URI are required."); return; }
        try { setRegistering(true); setRegisterError(null); const created = await registerHorosMcpConnection(workspaceId, { name: form.name.trim(), uri: form.uri.trim() }); await connectHorosMcpConnection(workspaceId, created.id, { token: form.token.trim() || undefined }); setForm({ name: "", uri: "", token: "" }); setRegisterOpen(false); await loadConnections(); }
        catch (cause) { setRegisterError(cause instanceof Error ? cause.message : "Unable to register MCP server."); }
        finally { setRegistering(false); }
    };
    const connectServer = async (id: string) => {
        if (!workspaceId) return;
        try { setConnecting(id); setRegisterError(null); await connectHorosMcpConnection(workspaceId, id); await loadConnections(); }
        catch (cause) { setRegisterError(cause instanceof Error ? cause.message : "Unable to connect MCP server."); }
        finally { setConnecting(null); }
    };

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

    const visibleRecords = records.filter((record) => {
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch = !query || [record.serverName, record.uri, ...record.capabilities, ...record.policies].some((value) => value.toLowerCase().includes(query));
        const matchesStatus = statusFilter === "All" || record.status === statusFilter;
        const matchesCapability = capabilityFilter === "All" || record.capabilities.includes(capabilityFilter);
        const matchesPolicy = policyFilter === "All" || record.policies.includes(policyFilter);
        return matchesSearch && matchesStatus && matchesCapability && matchesPolicy;
    });
    const capabilityOptions = ["All", ...Array.from(new Set(records.flatMap((record) => record.capabilities)))];
    const policyOptions = ["All", ...Array.from(new Set(records.flatMap((record) => record.policies)))];

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 bg-background">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <TerminalSquare className="size-5 text-indigo-500" />
                            HOROS MCP and External Tools
                        </h1>
                        <span className="text-xs text-muted-foreground mt-1">Connect external AI systems to the Institution via Model Context Protocol.</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => exportLiveRows("horos-mcp-connections.json", visibleRecords)} className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm">
                            <Download className="size-3.5" />
                            Export
                        </button>
                        <button type="button" onClick={() => setSetupOpen((open) => !open)} className="flex items-center gap-2 border border-border bg-background px-3 py-1.5 rounded-md text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm">
                            <LinkIcon className="size-3.5" /> HOROS MCP Client
                        </button>
                        <button type="button" onClick={() => { setRegisterOpen((open) => !open); setRegisterError(null); }} className="flex items-center gap-2 bg-primary px-3 py-1.5 rounded-md text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
                            Register External MCP
                        </button>
                    </div>
                </div>
                {setupOpen && <div className="mx-6 mb-4 rounded-md border border-border bg-card p-4 text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground">HOROS V12 MCP client</p>
                    <p className="mt-1">Use this published stdio client in Claude, Cursor, or another MCP host. It is separate from registering an external HTTP MCP server below.</p>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                        <code className="rounded bg-muted px-3 py-2 text-foreground">pnpm add -g @horostm/v12-mcp</code>
                        <code className="rounded bg-muted px-3 py-2 text-foreground">horos-v12-mcp</code>
                        <code className="rounded bg-muted px-3 py-2 text-foreground">HOROS_V12_API_URL=http://localhost:3011</code>
                        <code className="rounded bg-muted px-3 py-2 text-foreground">HOROS_V12_API_KEY=runtime-key</code>
                    </div>
                </div>}
                {registerOpen && <form onSubmit={registerServer} className="mx-6 mb-4 grid gap-3 rounded-md border border-border bg-card p-4 md:grid-cols-[1fr_2fr_1fr_auto]">
                    <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Server name" className="h-9 rounded border border-border bg-background px-3 text-xs text-foreground" required />
                    <input value={form.uri} onChange={(event) => setForm((current) => ({ ...current, uri: event.target.value }))} placeholder="https://example.com/mcp" type="url" className="h-9 rounded border border-border bg-background px-3 text-xs text-foreground" required />
                    <input value={form.token} onChange={(event) => setForm((current) => ({ ...current, token: event.target.value }))} placeholder="Bearer token (optional)" type="password" className="h-9 rounded border border-border bg-background px-3 text-xs text-foreground" />
                    <button type="submit" disabled={registering} className="h-9 rounded bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-50">{registering ? "Registering..." : "Register"}</button>
                    {registerError && <p className="text-xs text-red-500 md:col-span-4">{registerError}</p>}
                </form>}

                <div className="flex items-center justify-between px-6 py-3 bg-muted/20 overflow-visible">
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="relative w-64 shrink-0">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="Search MCP Servers..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-8 pl-9 pr-3 text-xs bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/70 text-foreground"
                            />
                        </div>
                        <LiveFilterDropdown label="Status" value={statusFilter} options={["All", "Connected", "Disconnected", "Error"]} onChange={setStatusFilter} />
                        <LiveFilterDropdown label="Capability" value={capabilityFilter} options={capabilityOptions} onChange={setCapabilityFilter} />
                        <LiveFilterDropdown label="Policy" value={policyFilter} options={policyOptions} onChange={setPolicyFilter} />
                        <button type="button" onClick={() => exportLiveRows("horos-mcp-connections.json", visibleRecords)} className="ml-auto flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md bg-background shrink-0 shadow-sm">
                            <Download className="size-3.5" /> Export visible
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === visibleRecords.length && visibleRecords.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold w-56">Server Name</th>
                            <th className="px-4 py-3 font-semibold w-64">URI</th>
                            <th className="px-4 py-3 font-semibold w-48">Capabilities</th>
                            <th className="px-4 py-3 font-semibold w-32">Resources</th>
                            <th className="px-4 py-3 font-semibold w-40">Policies</th>
                            <th className="px-4 py-3 font-semibold w-32">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {loading && <tr><td colSpan={7} className="px-6 py-12 text-center text-xs text-muted-foreground">Loading MCP connections...</td></tr>}
                        {!loading && loadError && <tr><td colSpan={7} className="px-6 py-12 text-center text-xs text-red-500">{loadError}</td></tr>}
                        {!loading && !loadError && visibleRecords.length === 0 && <tr><td colSpan={7} className="px-6 py-12 text-center text-xs text-muted-foreground">{records.length === 0 ? "No MCP servers registered yet." : "No MCP servers match these filters."}</td></tr>}
                        {!loading && !loadError && visibleRecords.map((record) => (
                            <tr 
                                key={record.id} 
                                onClick={() => openInspector("mcp" as any, { ...record, workspaceId, context: 'developer', name: record.serverName })}
                                className={cn(
                                    "group hover:bg-muted/30 transition-colors cursor-pointer",
                                    selectedRows.has(record.id) ? "bg-primary/5 hover:bg-primary/10" : ""
                                )}
                            >
                                <td className="px-6 py-4" onClick={(e) => toggleRow(record.id, e)}>
                                    <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.has(record.id)} readOnly />
                                </td>
                                <td className="px-4 py-4 font-bold text-foreground">
                                    <div className="flex items-center gap-2">
                                        <TerminalSquare className="size-4 text-muted-foreground" />
                                        {record.serverName}
                                    </div>
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {record.uri}
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex flex-col gap-1">
                                        {record.capabilities.map((cap, idx) => (
                                            <span key={idx} className="text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
                                                <div className="size-1 bg-[#3f3f46] rounded-full" /> {cap}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-[13px] text-muted-foreground">
                                    {record.resources}
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex flex-wrap gap-1.5">
                                        {record.policies.map((pol, idx) => (
                                            <span key={idx} className="px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-mono rounded">
                                                {pol}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        record.status === "Connected" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                        record.status === "Disconnected" ? "bg-muted/50 text-muted-foreground border border-border/50" :
                                        "bg-red-500/10 text-red-500 border border-red-500/20"
                                    )}>
                                        {record.status}
                                    </span>
                                    {record.status !== "Connected" && <button type="button" onClick={(event) => { event.stopPropagation(); void connectServer(record.id); }} className="ml-2 text-[10px] font-semibold text-primary disabled:opacity-50" disabled={connecting === record.id}>{connecting === record.id ? "Connecting..." : "Connect"}</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
