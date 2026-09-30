"use client";

import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Webhook, Play, Ban, Trash2, Key, Edit, Activity, 
    RefreshCw, RotateCw, Copy, FileJson
} from "lucide-react";
import { cn } from "@/lib/utils";
import { testDhyraDeveloperWebhook } from "@/lib/dhyra-api";

export function WebhookInspector({ entityData }: { entityData: any }) {
    const [testing, setTesting] = useState(false);
    const testWebhook = async () => {
        if (!entityData.workspaceId || !entityData.id) return;
        setTesting(true);
        try { await testDhyraDeveloperWebhook(entityData.workspaceId, entityData.id); } finally { setTesting(false); }
    };
    return (
        <Tabs defaultValue="overview" className="flex-1 flex flex-col w-full h-full">
            <div className="px-6 border-b border-border bg-muted/10 shrink-0">
                <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <Webhook className="size-3.5 mr-2" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <Activity className="size-3.5 mr-2" />
                        Delivery History
                    </TabsTrigger>
                    <TabsTrigger value="payloads" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <FileJson className="size-3.5 mr-2" />
                        Payloads
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
                                    entityData.status === "Active" ? "text-emerald-500" :
                                    entityData.status === "Failing" ? "text-orange-500" :
                                    "text-muted-foreground"
                                )}>{entityData.status}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Environment</span>
                                <span className="text-sm font-medium text-foreground">{entityData.environment}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border col-span-2">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Endpoint URL</span>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-sm font-mono text-muted-foreground break-all">{entityData.endpoint}</span>
                                    <button className="text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-2">
                                        <Copy className="size-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Authentication Secret</span>
                            <div className="flex items-center justify-between p-3 rounded-md bg-card border border-border">
                                <span className="text-sm font-mono font-medium text-muted-foreground">whsec_************************</span>
                                <div className="flex items-center gap-2">
                                    <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 bg-muted/50 rounded border border-border/50">
                                        <Copy className="size-3" /> Copy
                                    </button>
                                    <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 bg-muted/50 rounded border border-border/50">
                                        <RotateCw className="size-3" /> Rotate
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subscribed Events</span>
                            <div className="bg-card border border-border rounded-md p-4 flex flex-col gap-3">
                                <div className="flex flex-wrap gap-2">
                                    {entityData.events?.map((evt: string, idx: number) => (
                                        <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-md border border-border/50">
                                            <span className="text-xs font-mono text-foreground">{evt}</span>
                                        </div>
                                    ))}
                                </div>
                                <span className="text-sm text-foreground/80 leading-relaxed mt-2">
                                    This webhook will trigger a `POST` request to the endpoint whenever the subscribed institutional events occur.
                                </span>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1 p-4 rounded-md bg-card border border-border">
                                <span className="text-xs text-muted-foreground">Success Rate (24h)</span>
                                <span className={cn(
                                    "text-xl font-bold",
                                    entityData.successRate === "100%" || entityData.successRate === "99.9%" ? "text-emerald-500" :
                                    entityData.successRate === "0.0%" ? "text-muted-foreground" :
                                    "text-orange-500"
                                )}>{entityData.successRate}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-4 rounded-md bg-card border border-border">
                                <span className="text-xs text-muted-foreground">Retry Queue</span>
                                <span className={cn(
                                    "text-xl font-bold",
                                    entityData.retryQueue > 0 ? "text-orange-500" : "text-muted-foreground"
                                )}>{entityData.retryQueue} Pending</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Deliveries</span>
                            <div className="flex flex-col divide-y divide-border/50 border border-border bg-card rounded-md text-sm overflow-hidden">
                                <div className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors cursor-pointer">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">200 OK</span>
                                            <span className="font-mono text-xs">evt_mission_completed_9a8b</span>
                                        </div>
                                        <span className="text-xs font-mono text-muted-foreground">mission.completed</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground font-mono">2 mins ago</span>
                                </div>
                                <div className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors cursor-pointer">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">502 Bad Gateway</span>
                                            <span className="font-mono text-xs">evt_policy_violation_c4f1</span>
                                        </div>
                                        <span className="text-xs font-mono text-muted-foreground">policy.violation</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground font-mono">15 mins ago</span>
                                </div>
                                <div className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors cursor-pointer bg-orange-500/5">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded">Pending Retry</span>
                                            <span className="font-mono text-xs">evt_policy_violation_c4f1</span>
                                        </div>
                                        <span className="text-xs font-mono text-muted-foreground">policy.violation (Attempt 3/5)</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground font-mono">In Queue</span>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="payloads" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Webhook Headers</span>
                            <div className="flex flex-col bg-[#0d1117] border border-border/50 rounded-md p-4 gap-2 font-mono text-[11px] overflow-x-auto text-[#c9d1d9]">
                                <div><span className="text-blue-400">Content-Type:</span> application/json</div>
                                <div><span className="text-blue-400">Dhyra-Signature:</span> t=1690909200,v1=a3b4c5...</div>
                                <div><span className="text-blue-400">Dhyra-Event-Id:</span> evt_mission_completed_9a8b</div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payload Sample: mission.completed</span>
                            <div className="flex flex-col bg-[#0d1117] border border-border/50 rounded-md p-4 font-mono text-[11px] overflow-x-auto text-[#c9d1d9] whitespace-pre">
{`{
  "event": "mission.completed",
  "id": "evt_mission_completed_9a8b",
  "created_at": "2026-08-01T10:15:00Z",
  "data": {
    "mission_id": "MSN-2026-9812",
    "institution_id": "INST-CORE",
    "status": "Verified",
    "completed_at": "2026-08-01T10:14:58Z",
    "executor": {
      "type": "Agent",
      "id": "ep_agent_7b2c"
    }
  }
}`}
                            </div>
                        </div>
                    </TabsContent>
                </div>
            </ScrollArea>

            {/* Actions Bar */}
            <div className="flex items-center gap-2 p-4 border-t border-border bg-muted/10 shrink-0 overflow-x-auto custom-scrollbar">
                <button type="button" onClick={() => void testWebhook()} disabled={testing} className="flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-md text-xs font-medium whitespace-nowrap shadow-sm disabled:opacity-50">
                    <Edit className="size-3.5" />
                    {testing ? "Testing..." : "Send Test"}
                </button>
                <button type="button" onClick={() => void navigator.clipboard?.writeText(String(entityData.endpoint ?? ""))} className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <RefreshCw className="size-3.5" />
                    Replay Deliveries
                </button>
                <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <Ban className="size-3.5" />
                    Disable
                </button>
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-red-500/10 hover:text-red-500 transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm ml-auto">
                    <Trash2 className="size-3.5" />
                    Delete
                </button>
            </div>
        </Tabs>
    );
}
