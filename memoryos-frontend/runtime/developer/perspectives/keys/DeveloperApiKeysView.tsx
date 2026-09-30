"use client";

import React, { useEffect, useState } from "react";
import { 
    Search, ChevronDown, ChevronLeft, ChevronRight,
    RefreshCw, Key, Download, Shield, Clock, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "@/components/mission-control/universal-inspector";
import { createDhyraRuntimeApiKey, listDhyraRuntimeApiKeys, revokeDhyraRuntimeApiKey } from "@/lib/dhyra-api";
import { LiveFilterDropdown } from "@/components/mission-control/ui/live-filter-dropdown";
import { exportLiveRows } from "@/components/mission-control/export-live-rows";

type ApiKeyRow = {
    id: string;
    keyName: string;
    keyPrefix: string;
    scopes: string[];
    environment: string;
    created: string;
    lastUsed: string;
    status: "Active" | "Revoked" | "Suspended";
};

export function DeveloperApiKeysView({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [keys, setKeys] = useState<ApiKeyRow[]>([]);
    const [environmentFilter, setEnvironmentFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [loading, setLoading] = useState(Boolean(workspaceId));
    const [error, setError] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [name, setName] = useState("");
    const [creating, setCreating] = useState(false);
    const [createdToken, setCreatedToken] = useState<string | null>(null);
    const loadKeys = async () => {
        if (!workspaceId) return;
        try { setError(null); const items = await listDhyraRuntimeApiKeys(workspaceId); setKeys(items.map((item) => ({ id: item.id, keyName: item.name ?? item.id, keyPrefix: item.prefix ?? "-", scopes: item.endpoints ?? [], environment: "Workspace", created: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-", lastUsed: item.lastUsedAt ? new Date(item.lastUsedAt).toLocaleString() : "Never", status: item.status === "revoked" ? "Revoked" : "Active" }))); }
        catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load API keys."); }
        finally { setLoading(false); }
    };
    useEffect(() => {
        void loadKeys();
        const timer = window.setInterval(() => void loadKeys(), 5000);
        return () => window.clearInterval(timer);
    }, [workspaceId]);
    const createKey = async (event: React.FormEvent) => { event.preventDefault(); if (!workspaceId || !name.trim()) return; try { setCreating(true); setError(null); const result = await createDhyraRuntimeApiKey(workspaceId, { name: name.trim() }); setName(""); setCreatedToken(result.token); setCreateOpen(true); await loadKeys(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to create API key."); } finally { setCreating(false); } };
    const revokeKey = async (id: string, event: React.MouseEvent) => { event.stopPropagation(); if (!workspaceId) return; try { setError(null); await revokeDhyraRuntimeApiKey(workspaceId, id); await loadKeys(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to revoke API key."); } };

    const visibleKeys = keys.filter((key) =>
        (environmentFilter === "All" || key.environment === environmentFilter) &&
        (statusFilter === "All" || key.status === statusFilter) &&
        `${key.keyName} ${key.keyPrefix} ${key.scopes.join(" ")}`.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const toggleRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRows(newSet);
    };

    const toggleAll = () => {
        if (selectedRows.size === visibleKeys.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(visibleKeys.map(m => m.id)));
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 bg-background">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Key className="size-5 text-indigo-500" />
                            API Keys
                        </h1>
                        <span className="text-xs text-muted-foreground mt-1">Manage runtime authentication.</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => exportLiveRows("dhyra-api-keys.json", visibleKeys)} className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm">
                            <Download className="size-3.5" />
                            Export
                        </button>
                        <button type="button" onClick={() => setCreateOpen((value) => !value)} className="flex items-center gap-2 bg-primary px-3 py-1.5 rounded-md text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
                            Create Key
                        </button>
                    </div>
                </div>
                {createOpen && <div className="mx-6 mb-4 rounded-md border border-border bg-card p-3">{createdToken ? <div><p className="text-xs font-semibold text-foreground">New key created. Copy it now; it will not be shown again.</p><code className="mt-2 block break-all rounded bg-muted p-2 text-xs text-foreground">{createdToken}</code><button type="button" onClick={() => { void navigator.clipboard?.writeText(createdToken); setCreatedToken(null); setCreateOpen(false); }} className="mt-2 rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Copy and close</button></div> : <form onSubmit={createKey} className="flex gap-2"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Key name" className="h-9 flex-1 rounded border border-border bg-background px-3 text-xs" required /><button disabled={creating} className="rounded bg-primary px-4 text-xs font-semibold text-primary-foreground">{creating ? "Creating..." : "Create"}</button></form>}</div>}
                {error && <p className="mx-6 mb-3 text-xs text-red-500">{error}</p>}

                <div className="flex items-center justify-between px-6 py-3 bg-muted/20 overflow-visible">
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="relative w-64 shrink-0">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="Search Keys..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-8 pl-9 pr-3 text-xs bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/70 text-foreground"
                            />
                        </div>
                        <LiveFilterDropdown label="Environment" value={environmentFilter} options={["All", ...Array.from(new Set(keys.map((key) => key.environment)))]} onChange={setEnvironmentFilter} />
                        <LiveFilterDropdown label="Status" value={statusFilter} options={["All", ...Array.from(new Set(keys.map((key) => key.status)))]} onChange={setStatusFilter} />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === visibleKeys.length && visibleKeys.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold w-56">Key Name</th>
                            <th className="px-4 py-3 font-semibold w-40">Key Prefix</th>
                            <th className="px-4 py-3 font-semibold min-w-[200px]">Scopes</th>
                            <th className="px-4 py-3 font-semibold w-32">Environment</th>
                            <th className="px-4 py-3 font-semibold w-32">Created</th>
                            <th className="px-4 py-3 font-semibold w-40">Last Used</th>
                            <th className="px-4 py-3 font-semibold w-32">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {loading ? <tr><td colSpan={8} className="px-6 py-8 text-center text-xs text-muted-foreground">Loading API keys...</td></tr> : visibleKeys.length === 0 ? <tr><td colSpan={8} className="px-6 py-8 text-center text-xs text-muted-foreground">No API keys found.</td></tr> : visibleKeys.map((record) => (
                            <tr 
                                key={record.id} 
                                onClick={() => openInspector("api_key" as any, { ...record, workspaceId, context: 'developer', name: record.keyName })}
                                className={cn(
                                    "group hover:bg-muted/30 transition-colors cursor-pointer",
                                    selectedRows.has(record.id) ? "bg-primary/5 hover:bg-primary/10" : ""
                                )}
                            >
                                <td className="px-6 py-4" onClick={(e) => toggleRow(record.id, e)}>
                                    <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.has(record.id)} readOnly />
                                </td>
                                <td className="px-4 py-4 font-medium text-foreground">
                                    {record.keyName}
                                </td>
                                <td className="px-4 py-4 font-mono text-[13px] font-bold text-muted-foreground">
                                    {record.keyPrefix}...
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex flex-wrap gap-1.5">
                                        {record.scopes.map((scope, idx) => (
                                            <span key={idx} className="px-1.5 py-0.5 bg-muted/50 border border-border/50 text-foreground text-[10px] font-mono rounded">
                                                {scope}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-4 font-medium text-muted-foreground text-xs">
                                    {record.environment}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {record.created}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {record.lastUsed}
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        record.status === "Active" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                        record.status === "Suspended" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                        "bg-red-500/10 text-red-500 border border-red-500/20"
                                    )}>
                                        {record.status}
                                    </span>
                                    {record.status === "Active" && <button type="button" onClick={(event) => void revokeKey(record.id, event)} className="ml-2 text-[10px] font-semibold text-red-500">Revoke</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
