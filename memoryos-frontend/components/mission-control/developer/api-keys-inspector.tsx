"use client";

import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Activity, Shield, Clock, RotateCw, History, Key, 
    Copy, Download, Ban, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { revokeEpochRuntimeApiKey } from "@/lib/epoch-api";

export function ApiKeysInspector({ entityData }: { entityData: any }) {
    const [revoking, setRevoking] = useState(false);
    const revoke = async () => {
        if (!entityData.workspaceId || !entityData.id) return;
        setRevoking(true);
        try { await revokeEpochRuntimeApiKey(entityData.workspaceId, entityData.id); } finally { setRevoking(false); }
    };
    return (
        <Tabs defaultValue="overview" className="flex-1 flex flex-col w-full h-full">
            <div className="px-6 border-b border-border bg-muted/10 shrink-0">
                <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <Key className="size-3.5 mr-2" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="usage" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <Activity className="size-3.5 mr-2" />
                        Usage History
                    </TabsTrigger>
                    <TabsTrigger value="audit" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <History className="size-3.5 mr-2" />
                        Audit Trail
                    </TabsTrigger>
                </TabsList>
            </div>

            <ScrollArea className="flex-1 w-full bg-background/50">
                <div className="p-6">
                    <TabsContent value="overview" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Environment</span>
                                <span className="text-sm font-medium text-foreground">{entityData.environment}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Created By</span>
                                <span className="text-sm font-medium text-foreground">Alice Chen</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Created</span>
                                <span className="text-sm font-medium text-foreground font-mono text-xs">{entityData.created}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Last Used</span>
                                <span className="text-sm font-medium text-foreground font-mono text-xs">{entityData.lastUsed}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scopes & Permissions</span>
                            <div className="bg-card border border-border rounded-md p-4 flex flex-col gap-3">
                                <div className="flex flex-wrap gap-2">
                                    {entityData.scopes?.map((scope: string, idx: number) => (
                                        <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-md border border-border/50">
                                            <Shield className="size-3.5 text-blue-500" />
                                            <span className="text-xs font-mono text-foreground">{scope}</span>
                                        </div>
                                    ))}
                                </div>
                                <span className="text-sm text-foreground leading-relaxed mt-2">
                                    This identity inherits institutional policy <strong>POL-SEC-01</strong> and is allowed to execute runtime operations based on its granted scopes.
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Identity Prefix</span>
                            <div className="flex items-center justify-between p-3 rounded-md bg-card border border-border">
                                <span className="text-sm font-mono font-medium text-muted-foreground">{entityData.keyPrefix}************************</span>
                                <button className="text-muted-foreground hover:text-foreground transition-colors">
                                    <Copy className="size-4" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rotation History</span>
                            <div className="flex flex-col divide-y divide-border/50 border border-border rounded-md bg-card">
                                <div className="flex items-center justify-between p-3 group">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-foreground">Rotated by Alice Chen</span>
                                        <span className="text-xs text-muted-foreground">Reason: Standard 90-day rotation</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground font-mono">2026-06-15</span>
                                </div>
                                <div className="flex items-center justify-between p-3 group">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-foreground">Initial Creation</span>
                                        <span className="text-xs text-muted-foreground">System auto-provision</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground font-mono">2025-11-01</span>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="usage" className="m-0 focus-visible:outline-none">
                        <div className="flex flex-col gap-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1 p-4 rounded-md bg-card border border-border">
                                    <span className="text-xs text-muted-foreground">Total Requests</span>
                                    <span className="text-xl font-bold text-foreground">14.2M</span>
                                </div>
                                <div className="flex flex-col gap-1 p-4 rounded-md bg-card border border-border">
                                    <span className="text-xs text-muted-foreground">Error Rate</span>
                                    <span className="text-xl font-bold text-emerald-500">0.01%</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Requests</span>
                                <div className="flex flex-col divide-y divide-border/50 border border-border bg-card rounded-md text-sm">
                                    <div className="flex items-center justify-between p-3">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-xs font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">200</span>
                                            <span className="font-mono text-xs">POST /v1/missions</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground font-mono">Just now</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-xs font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">200</span>
                                            <span className="font-mono text-xs">GET /v1/missions/123</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground font-mono">2 mins ago</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-xs font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">403</span>
                                            <span className="font-mono text-xs">DELETE /v1/missions/123</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground font-mono">15 mins ago</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="audit" className="m-0 focus-visible:outline-none">
                        <div className="flex flex-col divide-y divide-border/50 border border-border bg-card rounded-md">
                            <div className="flex flex-col p-4 gap-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Activity className="size-4 text-emerald-500" />
                                        <span className="text-sm font-medium text-foreground">Key scope updated</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">2026-07-20 09:12:00</span>
                                </div>
                                <span className="text-xs text-muted-foreground pl-6">Added scope `evidence.read`</span>
                            </div>
                            <div className="flex flex-col p-4 gap-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <RotateCw className="size-4 text-blue-500" />
                                        <span className="text-sm font-medium text-foreground">Key Rotated</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">2026-06-15 14:00:00</span>
                                </div>
                                <span className="text-xs text-muted-foreground pl-6">Standard rotation via API</span>
                            </div>
                        </div>
                    </TabsContent>
                </div>
            </ScrollArea>

            {/* Actions Bar */}
            <div className="flex items-center gap-2 p-4 border-t border-border bg-muted/10 shrink-0 overflow-x-auto custom-scrollbar">
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <RotateCw className="size-3.5" />
                    Rotate
                </button>
                <button type="button" onClick={() => void revoke()} disabled={revoking} className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-red-500/10 hover:text-red-500 transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm disabled:opacity-50">
                    <Ban className="size-3.5" />
                    {revoking ? "Revoking..." : "Revoke"}
                </button>
                <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
                <button type="button" onClick={() => void navigator.clipboard?.writeText(String(entityData.keyPrefix ?? entityData.id ?? ""))} className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm ml-auto">
                    <Copy className="size-3.5" />
                    Copy
                </button>
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <Download className="size-3.5" />
                    Export
                </button>
            </div>
        </Tabs>
    );
}
