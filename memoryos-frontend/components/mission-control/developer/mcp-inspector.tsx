"use client";

import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    TerminalSquare, Shield, Database, Wrench, Play, 
    Network, Server, Activity, StopCircle, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { connectHorosMcpConnection } from "@/lib/horos-api";

export function McpInspector({ entityData }: { entityData: any }) {
    const [connecting, setConnecting] = useState(false);
    const reconnect = async () => {
        if (!entityData.workspaceId || !entityData.id) return;
        setConnecting(true);
        try { await connectHorosMcpConnection(entityData.workspaceId, entityData.id); } finally { setConnecting(false); }
    };
    return (
        <Tabs defaultValue="overview" className="flex-1 flex flex-col w-full h-full">
            <div className="px-6 border-b border-border bg-muted/10 shrink-0">
                <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <Server className="size-3.5 mr-2" />
                        Server Details
                    </TabsTrigger>
                    <TabsTrigger value="tools" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <Wrench className="size-3.5 mr-2" />
                        Tools & Resources
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <Activity className="size-3.5 mr-2" />
                        Connection Logs
                    </TabsTrigger>
                </TabsList>
            </div>

            <ScrollArea className="flex-1 w-full bg-background/50">
                <div className="p-6">
                    <TabsContent value="overview" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Status</span>
                                <span className={cn(
                                    "text-sm font-medium",
                                    entityData.status === "Connected" ? "text-emerald-500" :
                                    entityData.status === "Disconnected" ? "text-muted-foreground" :
                                    "text-red-500"
                                )}>{entityData.status}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Protocol Version</span>
                                <span className="text-sm font-mono font-bold text-foreground">v2.1.0</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border col-span-2">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Server URI</span>
                                <span className="text-sm font-mono text-muted-foreground">{entityData.uri}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Governing Policies</span>
                            <div className="bg-card border border-border rounded-md p-4 flex flex-col gap-3">
                                <div className="flex flex-wrap gap-2">
                                    {entityData.policies?.map((pol: string, idx: number) => (
                                        <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 rounded-md border border-blue-500/20">
                                            <Shield className="size-3.5 text-blue-500" />
                                            <span className="text-xs font-mono text-blue-500">{pol}</span>
                                        </div>
                                    ))}
                                </div>
                                <span className="text-sm text-foreground leading-relaxed mt-1">
                                    This server operates under strict institutional governance. Any tool executions or resource accesses that violate these policies will be blocked at the protocol layer.
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Capabilities Overview</span>
                            <div className="flex flex-col divide-y divide-border/50 border border-border rounded-md bg-card">
                                <div className="flex items-center justify-between p-3">
                                    <div className="flex items-center gap-3 text-foreground">
                                        <Wrench className="size-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Exposed Tools</span>
                                    </div>
                                    <span className="text-sm font-mono font-bold">{entityData.capabilities?.length || 0}</span>
                                </div>
                                <div className="flex items-center justify-between p-3">
                                    <div className="flex items-center gap-3 text-foreground">
                                        <Database className="size-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Exposed Resources</span>
                                    </div>
                                    <span className="text-sm font-mono font-bold">{entityData.resources}</span>
                                </div>
                            </div>
                        </div>

                    </TabsContent>

                    <TabsContent value="tools" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Registered Tools</span>
                            <div className="flex flex-col gap-3">
                                {entityData.capabilities?.map((cap: string, idx: number) => (
                                    <div key={idx} className="flex flex-col bg-card border border-border rounded-md p-4 gap-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <TerminalSquare className="size-4 text-emerald-500" />
                                                <span className="text-sm font-mono font-bold text-foreground">{cap}</span>
                                            </div>
                                            <button type="button" onClick={() => void navigator.clipboard?.writeText(cap)} className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded transition-colors hover:bg-emerald-500/20">
                                                <Play className="size-3" /> Execute
                                            </button>
                                        </div>
                                        <span className="text-xs text-muted-foreground leading-relaxed">
                                            {cap === "read_repositories" ? "Fetches metadata and contents from allowed GitHub repositories." : 
                                             cap === "create_pull_request" ? "Opens a new pull request on a target repository with specified changes." : 
                                             cap === "read_tables" ? "Queries data from authorized schemas in the analytics database." :
                                             "Executes the specified tool with provided parameters."}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="logs" className="m-0 focus-visible:outline-none">
                        <div className="flex flex-col bg-[#0d1117] border border-border/50 rounded-md p-4 gap-2 font-mono text-[11px] overflow-x-auto">
                            <div className="flex gap-3 text-muted-foreground">
                                <span className="shrink-0">2026-08-01 10:15:01</span>
                                <span className="text-emerald-500 shrink-0">[CONNECT]</span>
                                <span className="text-[#c9d1d9]">Handshake initiated with {entityData.uri}</span>
                            </div>
                            <div className="flex gap-3 text-muted-foreground">
                                <span className="shrink-0">2026-08-01 10:15:02</span>
                                <span className="text-blue-500 shrink-0">[NEGOTIATE]</span>
                                <span className="text-[#c9d1d9]">Protocol version v2.1.0 agreed</span>
                            </div>
                            <div className="flex gap-3 text-muted-foreground">
                                <span className="shrink-0">2026-08-01 10:15:03</span>
                                <span className="text-blue-500 shrink-0">[SYNC]</span>
                                <span className="text-[#c9d1d9]">Synchronizing {entityData.capabilities?.length} tools and {entityData.resources}</span>
                            </div>
                            {entityData.status === "Error" && (
                                <div className="flex gap-3 text-muted-foreground">
                                    <span className="shrink-0">2026-08-01 10:16:45</span>
                                    <span className="text-red-500 shrink-0">[ERROR]</span>
                                    <span className="text-red-400">Connection dropped unexpectedly. ECONNRESET.</span>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </div>
            </ScrollArea>

            {/* Actions Bar */}
            <div className="flex items-center gap-2 p-4 border-t border-border bg-muted/10 shrink-0 overflow-x-auto custom-scrollbar">
                <button type="button" onClick={() => void reconnect()} disabled={connecting} className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm disabled:opacity-50">
                    <RefreshCw className="size-3.5" />
                    {connecting ? "Connecting..." : "Reconnect"}
                </button>
                <button type="button" onClick={() => void navigator.clipboard?.writeText(String(entityData.uri ?? ""))} className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <StopCircle className="size-3.5 text-red-500" />
                    Disconnect
                </button>
            </div>
        </Tabs>
    );
}
