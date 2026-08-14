"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
    FileJson, Network, ShieldCheck, History, Play, CheckCircle2,
    Database, Activity, Lock, Box, Link2, DownloadCloud, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock detailed data
const MOCK_EVENT_DETAILS = {
    payload: {
        timestamp: "2024-10-24T10:16:01.334Z",
        severity: "ERROR",
        message: "Failed to allocate memory for snapshot buffer",
        errorCode: "OOM_ERROR_0x99A",
        stackTrace: "at snapshot.js:144:22\nat process.tickCallback (internal/process/next_tick.js:68:7)",
        context: {
            bufferSizeRequested: "4.2 GB",
            memoryAvailable: "1.1 GB",
            region: "us-east-1"
        }
    },
    metadata: {
        traceId: "TRC-8812-AAB",
        spanId: "SPN-449-01",
        host: "node-worker-99a",
        version: "v4.1.2",
    },
    relationships: {
        mission: { id: "MSN-8991", name: "Payment Gateway Upgrade", state: "Running" },
        execution: { id: "EX-4412", phase: "Database Snapshot", startedAt: "10:15:22" },
        actor: { type: "Worker", name: "Python Env Executor", id: "WRK-9004" }
    },
    evidence: [
        { type: "Memory Dump", file: "heap_dump_101601.log", size: "1.1 GB" },
        { type: "System State", file: "sys_state.json", size: "45 KB" }
    ],
    verification: {
        status: "Failed",
        rule: "POL-045: Memory Bounds Check",
        evaluator: "System Guard"
    },
    audit: {
        webhookDelivered: true,
        webhookEndpoint: "https://api.pagerduty.com/v1/incidents",
        auditLogHash: "0x89ab12cf...",
        retryCount: 0
    }
};

export function EventInspector({ entityData }: { entityData: any }) {
    // We assume entityData contains basic event row data to use for the header.
    // The rest is populated from MOCK_EVENT_DETAILS.
    
    return (
        <div className="flex-1 overflow-hidden flex flex-col h-full bg-background/50">
            
            <div className="px-6 py-3 border-b border-border bg-card/50 flex items-center gap-2 overflow-x-auto">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors shrink-0">
                    <Play className="size-3.5" /> Replay
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors shrink-0">
                    <Activity className="size-3.5" /> Open Mission
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors shrink-0">
                    <Database className="size-3.5" /> Open Execution
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors shrink-0">
                    <Box className="size-3.5" /> Open Evidence
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors shrink-0 ml-auto">
                    <Link2 className="size-3.5" /> Copy Correlation ID
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors shrink-0">
                    <DownloadCloud className="size-3.5" /> Download Event
                </button>
            </div>

            <Tabs defaultValue="overview" className="flex-1 flex flex-col w-full h-full">
                <div className="px-6 border-b border-border bg-muted/10 shrink-0">
                    <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                            <Activity className="size-3.5 mr-2" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="evidence" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                            <Box className="size-3.5 mr-2" />
                            Evidence & Verification
                        </TabsTrigger>
                        <TabsTrigger value="audit" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                            <ShieldCheck className="size-3.5 mr-2" />
                            Audit & Recovery
                        </TabsTrigger>
                        <TabsTrigger value="payload" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                            <FileJson className="size-3.5 mr-2" />
                            Raw Payload & Metadata
                        </TabsTrigger>
                    </TabsList>
                </div>

                <ScrollArea className="flex-1 w-full">
                    <div className="p-6">
                        
                        <TabsContent value="overview" className="m-0 focus-visible:outline-none space-y-6">
                            
                            <div className="flex flex-col gap-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Network className="size-3.5" /> Event Origin Graph</h3>
                                
                                <div className="flex flex-col gap-4 relative before:absolute before:inset-y-6 before:left-4 before:w-px before:bg-border/50">
                                    
                                    {/* Mission Node */}
                                    <Card className="bg-card/40 border-border/30 p-4 flex gap-4 items-center z-10 relative ml-8">
                                        <div className="absolute -left-[35px] top-1/2 -translate-y-1/2 size-2 rounded-full bg-primary ring-4 ring-background" />
                                        <div className="flex flex-col flex-1">
                                            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Parent Mission</span>
                                            <span className="text-sm font-semibold text-foreground">{MOCK_EVENT_DETAILS.relationships.mission.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-muted-foreground">{MOCK_EVENT_DETAILS.relationships.mission.id}</span>
                                            <Badge variant="outline" className="text-blue-500 border-blue-500/30">{MOCK_EVENT_DETAILS.relationships.mission.state}</Badge>
                                        </div>
                                    </Card>

                                    {/* Execution Node */}
                                    <Card className="bg-card/40 border-border/30 p-4 flex gap-4 items-center z-10 relative ml-8">
                                        <div className="absolute -left-[35px] top-1/2 -translate-y-1/2 size-2 rounded-full bg-emerald-500 ring-4 ring-background" />
                                        <div className="flex flex-col flex-1">
                                            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Execution Phase</span>
                                            <span className="text-sm font-semibold text-foreground">{MOCK_EVENT_DETAILS.relationships.execution.phase}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-muted-foreground">{MOCK_EVENT_DETAILS.relationships.execution.id}</span>
                                            <span className="text-xs text-muted-foreground">Started: {MOCK_EVENT_DETAILS.relationships.execution.startedAt}</span>
                                        </div>
                                    </Card>

                                    {/* Actor Node */}
                                    <Card className="bg-card/40 border-border/30 p-4 flex gap-4 items-center z-10 relative ml-8">
                                        <div className="absolute -left-[35px] top-1/2 -translate-y-1/2 size-2 rounded-full bg-orange-500 ring-4 ring-background" />
                                        <div className="flex flex-col flex-1">
                                            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Triggered By Actor</span>
                                            <span className="text-sm font-semibold text-foreground">{MOCK_EVENT_DETAILS.relationships.actor.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-muted-foreground">{MOCK_EVENT_DETAILS.relationships.actor.id}</span>
                                            <Badge className="bg-muted text-muted-foreground">{MOCK_EVENT_DETAILS.relationships.actor.type}</Badge>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        {/* 3. EVIDENCE & VERIFICATION TAB */}
                        <TabsContent value="evidence" className="m-0 focus-visible:outline-none space-y-6">
                            
                            <div className="flex flex-col gap-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Box className="size-3.5" /> Artifacts Produced</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {MOCK_EVENT_DETAILS.evidence.map((ev, i) => (
                                        <Card key={i} className="bg-card/40 border-border/30 p-4 flex flex-col gap-2 hover:bg-muted/30 transition-colors cursor-pointer group">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                                                <Database className="size-3.5" /> {ev.type}
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="font-mono text-sm text-foreground">{ev.file}</span>
                                                <span className="text-xs text-muted-foreground font-mono">{ev.size}</span>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><ShieldCheck className="size-3.5" /> Policy Verification</h3>
                                <div className="bg-card/40 border border-border/30 rounded-md p-4 flex flex-col gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                                            <AlertTriangle className="size-4 text-red-500" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-red-500">Verification Failed</span>
                                            <span className="text-xs text-muted-foreground">This event violated a runtime constraint.</span>
                                        </div>
                                    </div>
                                    <div className="bg-[#0c0c0c] border border-border/30 p-3 rounded-md text-xs font-mono text-zinc-300 flex flex-col gap-1">
                                        <span className="text-muted-foreground">Rule: <span className="text-foreground">{MOCK_EVENT_DETAILS.verification.rule}</span></span>
                                        <span className="text-muted-foreground">Evaluator: <span className="text-foreground">{MOCK_EVENT_DETAILS.verification.evaluator}</span></span>
                                    </div>
                                </div>
                            </div>

                        </TabsContent>

                        {/* 4. AUDIT & RECOVERY TAB */}
                        <TabsContent value="audit" className="m-0 focus-visible:outline-none space-y-6">
                            
                            <div className="flex flex-col gap-2">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><History className="size-3.5" /> Event Replay</h3>
                                <div className="bg-card/40 border border-border/30 rounded-md p-6 flex flex-col items-center justify-center text-center gap-4">
                                    <p className="text-sm text-muted-foreground max-w-sm">
                                        You can replay this specific event payload back into the execution flow to trigger recovery handlers or debug worker logic.
                                    </p>
                                    <button 
                                        className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                                        onClick={() => {
                                            // Mock toast/action
                                            alert("Event payload dispatched to replay queue.");
                                        }}
                                    >
                                        <Play className="size-4" /> Inject Replay
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Lock className="size-3.5" /> Security & Audit Trail</h3>
                                <div className="bg-card/40 border border-border/30 rounded-md overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <tbody className="divide-y divide-border/30">
                                            <tr>
                                                <td className="px-4 py-3 font-medium text-muted-foreground w-1/3">Webhook Delivered</td>
                                                <td className="px-4 py-3 text-foreground">
                                                    {MOCK_EVENT_DETAILS.audit.webhookDelivered ? (
                                                        <span className="flex items-center gap-1.5 text-emerald-500 font-semibold"><CheckCircle2 className="size-3.5" /> Yes</span>
                                                    ) : "No"}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 font-medium text-muted-foreground">Endpoint</td>
                                                <td className="px-4 py-3 font-mono text-foreground text-xs">{MOCK_EVENT_DETAILS.audit.webhookEndpoint}</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 font-medium text-muted-foreground">Audit Hash</td>
                                                <td className="px-4 py-3 font-mono text-foreground text-xs">{MOCK_EVENT_DETAILS.audit.auditLogHash}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </TabsContent>

                        <TabsContent value="payload" className="m-0 focus-visible:outline-none space-y-6">
                            
                            <div className="flex flex-col gap-2">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><FileJson className="size-3.5" /> Raw Payload JSON</h3>
                                <div className="bg-[#0c0c0c] border border-border/50 rounded-md p-4 overflow-x-auto text-[13px]">
                                    <pre className="text-zinc-300 font-mono leading-relaxed">
                                        {JSON.stringify(MOCK_EVENT_DETAILS.payload, null, 2)}
                                    </pre>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Activity className="size-3.5" /> Trace Metadata</h3>
                                <div className="bg-card/40 border border-border/30 rounded-md overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <tbody className="divide-y divide-border/30">
                                            {Object.entries(MOCK_EVENT_DETAILS.metadata).map(([k, v]) => (
                                                <tr key={k}>
                                                    <td className="px-4 py-3 font-medium text-muted-foreground w-1/3 capitalize">{k}</td>
                                                    <td className="px-4 py-3 font-mono text-foreground">{v}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </TabsContent>

                    </div>
                </ScrollArea>
            </Tabs>
        </div>
    );
}
