"use client";

import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Server, Activity, Shield, CloudOff, RefreshCw,
    Download, Power, Settings, RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { enrollDhyraEdgeWorker } from "@/lib/dhyra-api";

export function EdgeRuntimeInspector({ entityData }: { entityData: any }) {
    const [reconnecting, setReconnecting] = useState(false);
    const reconnect = async () => {
        if (!entityData.workspaceId || !entityData.id) return;
        setReconnecting(true);
        try { await enrollDhyraEdgeWorker(entityData.workspaceId, entityData.id); } finally { setReconnecting(false); }
    };
    return (
        <Tabs defaultValue="overview" className="flex-1 flex flex-col w-full h-full">
            <div className="px-6 border-b border-border bg-muted/10 shrink-0">
                <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <Server className="size-3.5 mr-2" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="sync" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <RefreshCw className="size-3.5 mr-2" />
                        Synchronization
                    </TabsTrigger>
                    <TabsTrigger value="health" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <Activity className="size-3.5 mr-2" />
                        Health & Logs
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
                                    entityData.status === "Online" ? "text-emerald-500" :
                                    entityData.status === "Syncing" ? "text-blue-500" :
                                    entityData.status === "Error" ? "text-red-500" :
                                    "text-muted-foreground"
                                )}>{entityData.status}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Runtime Version</span>
                                <span className="text-sm font-mono font-bold text-foreground">{entityData.runtime}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Worker Identity</span>
                                <span className="text-sm font-mono text-foreground">{entityData.identity}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Region</span>
                                <span className="text-sm font-mono text-muted-foreground">{entityData.region}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Enrollment & Governance</span>
                            <div className="bg-card border border-border rounded-md p-4 flex flex-col gap-3">
                                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                    <span className="text-sm text-foreground/80">Governing Policy</span>
                                    <span className="text-xs font-mono text-blue-500 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">POL-EDGE-01</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                    <span className="text-sm text-foreground/80">Offline Mode Allowed</span>
                                    <span className="text-xs font-mono text-emerald-500">True</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                    <span className="text-sm text-foreground/80">Max Cache Size</span>
                                    <span className="text-xs font-mono text-foreground">50 GB</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-foreground/80">Enrolled On</span>
                                    <span className="text-xs font-mono text-muted-foreground">2026-01-14 09:30:00</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Offline Capabilities</span>
                            <div className="bg-card border border-border rounded-md p-4 flex flex-col gap-3">
                                <div className="flex items-start gap-3">
                                    {entityData.offlineMode ? (
                                        <CloudOff className="size-5 text-orange-400 shrink-0" />
                                    ) : (
                                        <CloudOff className="size-5 text-muted-foreground shrink-0" />
                                    )}
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-medium text-foreground">
                                            {entityData.offlineMode ? "Operating in Disconnected Environment" : "Ready for Offline Operation"}
                                        </span>
                                        <span className="text-xs text-muted-foreground leading-relaxed">
                                            This edge runtime is configured to gracefully handle prolonged disconnection from the Dhyra central control plane. Local telemetry and mission evidence are being cached locally.
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 bg-muted/50 rounded border border-border/50">
                                        <RotateCcw className="size-3" /> Replay Offline Cache
                                    </button>
                                </div>
                            </div>
                        </div>

                    </TabsContent>

                    <TabsContent value="sync" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Synchronization Status</span>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1 p-4 rounded-md bg-card border border-border">
                                    <span className="text-xs text-muted-foreground">Pending Telemetry Events</span>
                                    <span className="text-xl font-bold text-orange-500">1,204</span>
                                </div>
                                <div className="flex flex-col gap-1 p-4 rounded-md bg-card border border-border">
                                    <span className="text-xs text-muted-foreground">Pending Mission Evidence</span>
                                    <span className="text-xl font-bold text-orange-500">42 MB</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Sync History</span>
                            <div className="flex flex-col divide-y divide-border/50 border border-border bg-card rounded-md text-sm">
                                <div className="flex items-center justify-between p-3">
                                    <div className="flex items-center gap-2">
                                        <RefreshCw className="size-4 text-blue-500" />
                                        <span className="text-xs font-medium">Policy Update Pull</span>
                                    </div>
                                    <span className="text-xs font-mono text-muted-foreground">2 hours ago</span>
                                </div>
                                <div className="flex items-center justify-between p-3">
                                    <div className="flex items-center gap-2">
                                        <RefreshCw className="size-4 text-emerald-500" />
                                        <span className="text-xs font-medium">Evidence Batch Push (1.2MB)</span>
                                    </div>
                                    <span className="text-xs font-mono text-muted-foreground">5 hours ago</span>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="health" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1 p-4 rounded-md bg-card border border-border">
                                <span className="text-xs text-muted-foreground">CPU Utilization</span>
                                <span className="text-xl font-bold text-emerald-500">12%</span>
                            </div>
                            <div className="flex flex-col gap-1 p-4 rounded-md bg-card border border-border">
                                <span className="text-xs text-muted-foreground">Memory Usage</span>
                                <span className="text-xl font-bold text-emerald-500">452 MB</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Edge Logs</span>
                            <div className="flex flex-col bg-[#0d1117] border border-border/50 rounded-md p-4 gap-2 font-mono text-[11px] overflow-x-auto text-[#c9d1d9]">
                                <div className="flex gap-3 text-muted-foreground">
                                    <span className="shrink-0">10:14:01</span>
                                    <span className="text-blue-500 shrink-0">[HEARTBEAT]</span>
                                    <span className="text-[#c9d1d9]">Ping acknowledged by central plane</span>
                                </div>
                                <div className="flex gap-3 text-muted-foreground">
                                    <span className="shrink-0">10:14:15</span>
                                    <span className="text-emerald-500 shrink-0">[LOCAL_EXEC]</span>
                                    <span className="text-[#c9d1d9]">Mission MSN-8891 executing tool locally...</span>
                                </div>
                                <div className="flex gap-3 text-muted-foreground">
                                    <span className="shrink-0">10:14:18</span>
                                    <span className="text-orange-500 shrink-0">[WARN]</span>
                                    <span className="text-orange-400">Network latency spike detected (450ms)</span>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </div>
            </ScrollArea>

            {/* Actions Bar */}
            <div className="flex items-center gap-2 p-4 border-t border-border bg-muted/10 shrink-0 overflow-x-auto custom-scrollbar">
                <button type="button" onClick={() => void reconnect()} disabled={reconnecting} className="flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-md text-xs font-medium whitespace-nowrap shadow-sm disabled:opacity-50">
                    <RefreshCw className="size-3.5" />
                    {reconnecting ? "Connecting..." : "Reconnect"}
                </button>
                <button type="button" onClick={() => void navigator.clipboard?.writeText(String(entityData.identity ?? entityData.id ?? ""))} className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <RotateCcw className="size-3.5" />
                    Replay
                </button>
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <Download className="size-3.5" />
                    Update
                </button>
                <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-red-500/10 hover:text-red-500 transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm ml-auto">
                    <Power className="size-3.5" />
                    Retire
                </button>
            </div>
        </Tabs>
    );
}
