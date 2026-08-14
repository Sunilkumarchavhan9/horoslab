"use client";

import React, { useEffect, useState } from "react";
import { 
    Search, ChevronDown, ChevronLeft, ChevronRight,
    Webhook, Download, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "@/components/mission-control/universal-inspector";
import { createEpochDeveloperWebhook, listEpochDeveloperWebhooks } from "@/lib/epoch-api";
import { LiveFilterDropdown } from "@/components/mission-control/ui/live-filter-dropdown";
import { exportLiveRows } from "@/components/mission-control/export-live-rows";

type WebhookRow = {
    id: string;
    endpoint: string;
    events: string[];
    status: "Active" | "Failing" | "Disabled";
    successRate: string;
    lastDelivery: string;
    retryQueue: number;
    environment: string;
    lastDeliveryId?: string;
};

export function DeveloperWebhooksView({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [webhooks, setWebhooks] = useState<WebhookRow[]>([]);
    const [statusFilter, setStatusFilter] = useState("All");
    const [environmentFilter, setEnvironmentFilter] = useState("All");
    const [loading, setLoading] = useState(Boolean(workspaceId));
    const [error, setError] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [url, setUrl] = useState("");
    const [events, setEvents] = useState("mission.completed,mission.failed");
    const [creating, setCreating] = useState(false);
    const loadWebhooks = async () => { if (!workspaceId) return; try { setError(null); const items = await listEpochDeveloperWebhooks(workspaceId); setWebhooks(items.map((item) => ({ id: item.id, endpoint: item.url, events: item.events ?? [], status: item.status === "active" ? "Active" : item.status === "disabled" ? "Disabled" : "Failing", successRate: "-", lastDelivery: item.deliveries?.[0]?.createdAt ?? "-", retryQueue: item.deliveries?.filter((delivery) => delivery.status === "pending").length ?? 0, environment: "Workspace", lastDeliveryId: item.deliveries?.[0]?.id }))); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load webhooks."); } finally { setLoading(false); } };
    useEffect(() => { void loadWebhooks(); const timer = window.setInterval(() => void loadWebhooks(), 5000); return () => window.clearInterval(timer); }, [workspaceId]);
    const createWebhook = async (event: React.FormEvent) => { event.preventDefault(); if (!workspaceId || !url.trim()) return; try { setCreating(true); await createEpochDeveloperWebhook(workspaceId, { url: url.trim(), events: events.split(",").map((item) => item.trim()).filter(Boolean) }); setUrl(""); setCreateOpen(false); await loadWebhooks(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to create webhook."); } finally { setCreating(false); } };

    const visibleWebhooks = webhooks.filter((webhook) =>
        (statusFilter === "All" || webhook.status === statusFilter) &&
        (environmentFilter === "All" || webhook.environment === environmentFilter) &&
        `${webhook.endpoint} ${webhook.events.join(" ")}`.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const toggleRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRows(newSet);
    };

    const toggleAll = () => {
        if (selectedRows.size === visibleWebhooks.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(visibleWebhooks.map(m => m.id)));
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 bg-background">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Webhook className="size-5 text-indigo-500" />
                            Webhooks
                        </h1>
                        <span className="text-xs text-muted-foreground mt-1">Manage outbound event delivery to external systems.</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => exportLiveRows("epoch-webhooks.json", visibleWebhooks)} className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm">
                            <Download className="size-3.5" />
                            Export
                        </button>
                        <button type="button" onClick={() => setCreateOpen((value) => !value)} className="flex items-center gap-2 bg-primary px-3 py-1.5 rounded-md text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
                            <Plus className="size-3.5" />
                            Create Webhook
                        </button>
                    </div>
                </div>
                {createOpen && <form onSubmit={createWebhook} className="mx-6 mb-4 grid gap-2 rounded-md border border-border bg-card p-3 md:grid-cols-[2fr_1fr_auto]"><input value={url} onChange={(event) => setUrl(event.target.value)} type="url" placeholder="https://your-service.example/epoch-events" className="h-9 rounded border border-border bg-background px-3 text-xs" required /><input value={events} onChange={(event) => setEvents(event.target.value)} placeholder="mission.completed,mission.failed" className="h-9 rounded border border-border bg-background px-3 text-xs" /><button disabled={creating} className="rounded bg-primary px-4 text-xs font-semibold text-primary-foreground">{creating ? "Creating..." : "Create"}</button></form>}
                {error && <p className="mx-6 mb-3 text-xs text-red-500">{error}</p>}

                <div className="flex items-center justify-between px-6 py-3 bg-muted/20 overflow-visible">
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="relative w-64 shrink-0">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="Search endpoints..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-8 pl-9 pr-3 text-xs bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/70 text-foreground"
                            />
                        </div>
                        <LiveFilterDropdown label="Status" value={statusFilter} options={["All", ...Array.from(new Set(webhooks.map((webhook) => webhook.status)))]} onChange={setStatusFilter} />
                        <LiveFilterDropdown label="Environment" value={environmentFilter} options={["All", ...Array.from(new Set(webhooks.map((webhook) => webhook.environment)))]} onChange={setEnvironmentFilter} />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === visibleWebhooks.length && visibleWebhooks.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold w-72">Endpoint</th>
                            <th className="px-4 py-3 font-semibold min-w-[200px]">Subscribed Events</th>
                            <th className="px-4 py-3 font-semibold w-32">Status</th>
                            <th className="px-4 py-3 font-semibold w-32">Success Rate</th>
                            <th className="px-4 py-3 font-semibold w-32">Last Delivery</th>
                            <th className="px-4 py-3 font-semibold w-32">Retry Queue</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {loading ? <tr><td colSpan={7} className="px-6 py-8 text-center text-xs text-muted-foreground">Loading webhooks...</td></tr> : visibleWebhooks.length === 0 ? <tr><td colSpan={7} className="px-6 py-8 text-center text-xs text-muted-foreground">No webhooks found.</td></tr> : visibleWebhooks.map((record) => (
                            <tr 
                                key={record.id} 
                                onClick={() => openInspector("webhook" as any, { ...record, workspaceId, context: 'developer', name: record.endpoint })}
                                className={cn(
                                    "group hover:bg-muted/30 transition-colors cursor-pointer",
                                    selectedRows.has(record.id) ? "bg-primary/5 hover:bg-primary/10" : ""
                                )}
                            >
                                <td className="px-6 py-4" onClick={(e) => toggleRow(record.id, e)}>
                                    <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.has(record.id)} readOnly />
                                </td>
                                <td className="px-4 py-4 font-mono text-[12px] text-foreground font-medium truncate max-w-[280px]" title={record.endpoint}>
                                    {record.endpoint}
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex flex-wrap gap-1.5">
                                        {record.events.map((evt, idx) => (
                                            <span key={idx} className="px-1.5 py-0.5 bg-muted/50 border border-border/50 text-foreground text-[10px] font-mono rounded">
                                                {evt}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        record.status === "Active" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                        record.status === "Failing" ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" :
                                        "bg-muted/50 text-muted-foreground border border-border/50"
                                    )}>
                                        {record.status}
                                    </span>
                                </td>
                                <td className="px-4 py-4 font-mono font-medium">
                                    <span className={cn(
                                        record.successRate === "100%" || record.successRate === "99.9%" ? "text-emerald-500" :
                                        record.successRate === "0.0%" ? "text-muted-foreground" :
                                        "text-orange-500"
                                    )}>
                                        {record.successRate}
                                    </span>
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {record.lastDelivery}
                                </td>
                                <td className="px-4 py-4 font-mono font-bold">
                                    <span className={cn(
                                        record.retryQueue > 0 ? "text-orange-500" : "text-muted-foreground"
                                    )}>
                                        {record.retryQueue} {record.retryQueue > 0 ? "pending" : ""}
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
