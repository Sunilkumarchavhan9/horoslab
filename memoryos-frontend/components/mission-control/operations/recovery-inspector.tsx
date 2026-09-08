"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { 
    RefreshCcw, PlayCircle, RotateCcw, XCircle, UserPlus, ShieldAlert,
    Download, Activity, AlertTriangle, Route, Network, Settings2,
    Database, Coins, Clock, Link2, HelpCircle, History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const MOCK_RECOVERY_DETAILS = {
    overview: {
        mission: "MSN-8991",
        execution: "EX-4412",
        status: "Recovering"
    },
    failureAnalysis: {
        summary: "Execution halted due to external API rate limits being exceeded during bulk data ingestion.",
        rootCause: "Target provider returned HTTP 429 Too Many Requests. Burst capacity exceeded by 25%.",
        retryPolicy: "Exponential Backoff (Max 3 retries)",
        retryHistory: [
            { attempt: 1, delay: "10s", result: "Failed (429)" },
            { attempt: 2, delay: "30s", result: "Failed (429)" },
            { attempt: 3, delay: "90s", result: "Pending Execution..." }
        ]
    },
    strategy: {
        checkpointResume: {
            available: true,
            id: "CHK-33A",
            savedState: "Ingested 14,200 of 20,000 records"
        },
        fallbackWorker: {
            enabled: false,
            assigned: "None"
        },
        fallbackModel: {
            enabled: true,
            primary: "gpt-4-turbo",
            fallback: "claude-3-haiku"
        },
        rollback: {
            available: true,
            mechanism: "Database Transaction Revert",
            compensationRequired: false
        }
    },
    timeline: [
        { time: "10:15:20", event: "Failure detected: HTTP 429", type: "error" },
        { time: "10:15:22", event: "Recovery Engine engaged. Identified Checkpoint CHK-33A", type: "system" },
        { time: "10:15:32", event: "Retry Attempt 1 (10s delay) failed", type: "warning" },
        { time: "10:16:02", event: "Retry Attempt 2 (30s delay) failed", type: "warning" }
    ],
    metrics: {
        mttr: "Ongoing",
        computeCost: "$0.42",
        lostTime: "4m 12s"
    }
};

export function RecoveryInspector({ entityData }: { entityData: any }) {
    if (!entityData) return null;

    return (
        <div className="flex h-full flex-col bg-background p-6">
            <div className="mb-5 flex items-center gap-3 border-b border-border pb-4">
                <RefreshCcw className="size-5 text-orange-500" />
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Recovery {entityData.id ?? "record"}</h2>
                    <p className="text-xs text-muted-foreground">Live recovery escalation from the Epoch API</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {["status", "missionId", "executionId", "reason", "failureReason", "createdAt", "resolvedAt"].map((key) => (
                    <div key={key} className="rounded-md border border-border bg-card p-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{key}</div>
                        <div className="mt-1 break-words text-sm text-foreground">{entityData[key] == null || entityData[key] === "" ? "-" : String(entityData[key])}</div>
                    </div>
                ))}
            </div>
            <pre className="mt-4 flex-1 overflow-auto rounded-md border border-border bg-muted/20 p-4 text-xs text-muted-foreground">{JSON.stringify(entityData, null, 2)}</pre>
        </div>
    );

    return (
        <div className="flex-1 overflow-hidden flex flex-col h-full bg-background/50">
            
            {/* Header Actions */}
            <div className="px-6 py-3 border-b border-border bg-card/50 flex items-center gap-2 overflow-x-auto">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-colors shrink-0">
                    <RefreshCcw className="size-3.5" /> Force Retry
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-blue-500/20 text-xs font-semibold transition-colors shrink-0">
                    <PlayCircle className="size-3.5" /> Resume Checkpoint
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border border-orange-500/20 text-xs font-semibold transition-colors shrink-0">
                    <RotateCcw className="size-3.5" /> Trigger Rollback
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 text-xs font-semibold transition-colors shrink-0">
                    <XCircle className="size-3.5" /> Hard Cancel
                </button>
                
                <div className="w-px h-4 bg-border mx-2 shrink-0" />
                
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-background hover:bg-muted text-foreground border border-border text-xs font-semibold transition-colors shrink-0">
                    <UserPlus className="size-3.5" /> Reassign Worker
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-background hover:bg-muted text-foreground border border-border text-xs font-semibold transition-colors shrink-0">
                    <ShieldAlert className="size-3.5" /> Escalate
                </button>
                
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-background hover:bg-muted text-foreground border border-border text-xs font-semibold transition-colors shrink-0 ml-auto">
                    <Download className="size-3.5" /> Report
                </button>
            </div>

            <Tabs defaultValue="failure" className="flex-1 flex flex-col w-full h-full">
                <div className="px-6 border-b border-border bg-muted/10 shrink-0">
                    <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0">
                        <TabsTrigger value="failure" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                            <AlertTriangle className="size-3.5 mr-2" />
                            Failure Context
                        </TabsTrigger>
                        <TabsTrigger value="strategy" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                            <Route className="size-3.5 mr-2" />
                            Recovery Strategy
                        </TabsTrigger>
                        <TabsTrigger value="checkpoints" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                            <Database className="size-3.5 mr-2" />
                            Checkpoints & State
                        </TabsTrigger>
                        <TabsTrigger value="timeline" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                            <Activity className="size-3.5 mr-2" />
                            Timeline
                        </TabsTrigger>
                    </TabsList>
                </div>

                <ScrollArea className="flex-1 w-full">
                    <div className="p-6">
                        
                        {/* 1. FAILURE CONTEXT TAB */}
                        <TabsContent value="failure" className="m-0 focus-visible:outline-none space-y-6">
                            
                            <div className="flex flex-col gap-4 bg-red-500/5 border border-red-500/20 rounded-md p-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-red-500 flex items-center gap-1.5"><AlertTriangle className="size-3.5" /> Critical Failure Detected</h3>
                                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30 font-mono">
                                        Execution {MOCK_RECOVERY_DETAILS.overview.execution}
                                    </Badge>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <p className="text-sm font-semibold text-foreground">
                                        {MOCK_RECOVERY_DETAILS.failureAnalysis.summary}
                                    </p>
                                    <div className="bg-[#0c0c0c] border border-border/30 rounded-md p-3 text-xs font-mono text-red-400">
                                        Root Cause: {MOCK_RECOVERY_DETAILS.failureAnalysis.rootCause}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Settings2 className="size-3.5" /> Retry Policy</h3>
                                    <Card className="bg-card/40 border-border/30 p-4 flex flex-col justify-center h-full">
                                        <span className="text-sm font-semibold text-foreground">{MOCK_RECOVERY_DETAILS.failureAnalysis.retryPolicy}</span>
                                    </Card>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><History className="size-3.5" /> Retry History</h3>
                                    <div className="bg-card/40 border border-border/30 rounded-md overflow-hidden">
                                        <table className="w-full text-left text-sm">
                                            <tbody className="divide-y divide-border/30">
                                                {MOCK_RECOVERY_DETAILS.failureAnalysis.retryHistory.map((r, i) => (
                                                    <tr key={i}>
                                                        <td className="px-4 py-2 font-medium text-muted-foreground">Attempt {r.attempt}</td>
                                                        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{r.delay} delay</td>
                                                        <td className="px-4 py-2 text-right">
                                                            <span className={cn(
                                                                "text-[10px] uppercase font-bold tracking-widest",
                                                                r.result.includes("Failed") ? "text-red-500" : "text-blue-500"
                                                            )}>{r.result}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* 2. RECOVERY STRATEGY TAB */}
                        <TabsContent value="strategy" className="m-0 focus-visible:outline-none space-y-6">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Database className="size-3.5" /> Checkpoint Resume</h3>
                                    <Card className={cn(
                                        "bg-card/40 border-border/30 p-4 flex flex-col gap-3",
                                        MOCK_RECOVERY_DETAILS.strategy.checkpointResume.available && "border-blue-500/30 bg-blue-500/5"
                                    )}>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-foreground">Status</span>
                                            {MOCK_RECOVERY_DETAILS.strategy.checkpointResume.available ? (
                                                <Badge className="bg-blue-500 text-[#F0EFE2]">Available</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-muted-foreground">Unavailable</Badge>
                                            )}
                                        </div>
                                    </Card>
                                </div>

                                {/* Rollback */}
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><RotateCcw className="size-3.5" /> Rollback & Compensation</h3>
                                    <Card className="bg-card/40 border-border/30 p-4 flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-foreground">Rollback Available</span>
                                            <span className="text-sm font-mono text-emerald-500">Yes</span>
                                        </div>
                                        <div className="flex flex-col gap-1 text-xs">
                                            <span className="text-muted-foreground">Mechanism: <span className="text-foreground">{MOCK_RECOVERY_DETAILS.strategy.rollback.mechanism}</span></span>
                                            <span className="text-muted-foreground">Compensation Required: <span className="text-foreground">{MOCK_RECOVERY_DETAILS.strategy.rollback.compensationRequired ? "Yes" : "No"}</span></span>
                                        </div>
                                    </Card>
                                </div>

                                {/* Fallback Worker */}
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Network className="size-3.5" /> Fallback Worker</h3>
                                    <Card className="bg-card/40 border-border/30 p-4 flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-foreground">Enabled</span>
                                            <span className="text-sm font-mono text-muted-foreground">{MOCK_RECOVERY_DETAILS.strategy.fallbackWorker.enabled ? "Yes" : "No"}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">Assigned: {MOCK_RECOVERY_DETAILS.strategy.fallbackWorker.assigned}</span>
                                    </Card>
                                </div>

                                {/* Fallback Model */}
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Network className="size-3.5" /> Fallback Model</h3>
                                    <Card className="bg-card/40 border-border/30 p-4 flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-foreground">Enabled</span>
                                            <span className="text-sm font-mono text-emerald-500">{MOCK_RECOVERY_DETAILS.strategy.fallbackModel.enabled ? "Yes" : "No"}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="font-mono text-muted-foreground">{MOCK_RECOVERY_DETAILS.strategy.fallbackModel.primary}</span>
                                            <span className="text-muted-foreground">&rarr;</span>
                                            <span className="font-mono text-purple-400">{MOCK_RECOVERY_DETAILS.strategy.fallbackModel.fallback}</span>
                                        </div>
                                    </Card>
                                </div>

                            </div>
                        </TabsContent>

                        {/* 2.5 CHECKPOINTS TAB */}
                        <TabsContent value="checkpoints" className="m-0 focus-visible:outline-none space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Database className="size-3.5" /> Saved Checkpoints</h3>
                                    <Card className="bg-card/40 border-border/30 p-6 flex flex-col gap-4">
                                        {MOCK_RECOVERY_DETAILS.strategy.checkpointResume.available ? (
                                            <div className="flex items-start justify-between border border-blue-500/30 bg-blue-500/5 p-4 rounded-md">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-bold text-foreground">Active Checkpoint</span>
                                                    <span className="text-[11px] font-mono text-blue-500">{MOCK_RECOVERY_DETAILS.strategy.checkpointResume.id}</span>
                                                    <span className="text-xs text-muted-foreground mt-2">{MOCK_RECOVERY_DETAILS.strategy.checkpointResume.savedState}</span>
                                                </div>
                                                <Badge className="bg-blue-500 text-[#F0EFE2]">Ready for Resume</Badge>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">No checkpoints available for this execution.</span>
                                        )}
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        {/* 3. TIMELINE & AUDIT TAB */}
                        <TabsContent value="timeline" className="m-0 focus-visible:outline-none space-y-6">
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="col-span-2 flex flex-col gap-2">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Clock className="size-3.5" /> Recovery Timeline</h3>
                                    <div className="flex flex-col gap-4 relative before:absolute before:inset-y-6 before:left-4 before:w-px before:bg-border/50">
                                        {MOCK_RECOVERY_DETAILS.timeline.map((event, i) => (
                                            <Card key={i} className="bg-card/40 border-border/30 p-4 flex gap-4 items-center z-10 relative ml-8">
                                                <div className={cn(
                                                    "absolute -left-[35px] top-1/2 -translate-y-1/2 size-2 rounded-full ring-4 ring-background",
                                                    event.type === "error" ? "bg-red-500" :
                                                    event.type === "warning" ? "bg-orange-500" :
                                                    "bg-blue-500"
                                                )} />
                                                <div className="flex flex-col flex-1">
                                                    <span className="text-[10px] font-mono text-muted-foreground">{event.time}</span>
                                                    <span className={cn(
                                                        "text-sm font-medium mt-1",
                                                        event.type === "error" ? "text-red-500" :
                                                        event.type === "warning" ? "text-orange-500" :
                                                        "text-foreground"
                                                    )}>{event.event}</span>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>

                                <div className="col-span-1 flex flex-col gap-6">
                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Activity className="size-3.5" /> Recovery Metrics</h3>
                                        <Card className="bg-card/40 border-border/30 p-4 flex flex-col gap-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">MTTR (Mean Time to Recover)</span>
                                                <span className="text-lg font-mono text-orange-500">{MOCK_RECOVERY_DETAILS.metrics.mttr}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Lost Time Delay</span>
                                                <span className="text-lg font-mono text-foreground">{MOCK_RECOVERY_DETAILS.metrics.lostTime}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5">Compute Cost <HelpCircle className="size-3" /></span>
                                                <span className="text-lg font-mono text-red-400">+{MOCK_RECOVERY_DETAILS.metrics.computeCost}</span>
                                            </div>
                                        </Card>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Link2 className="size-3.5" /> Related</h3>
                                        <Card className="bg-card/40 border-border/30 p-4 flex gap-4 items-center cursor-pointer hover:bg-muted/50 transition-colors">
                                            <Network className="size-4 text-muted-foreground shrink-0" />
                                            <div className="flex flex-col flex-1">
                                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest mb-0.5">Parent Mission</span>
                                                <span className="text-sm font-semibold text-foreground">{MOCK_RECOVERY_DETAILS.overview.mission}</span>
                                            </div>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                    </div>
                </ScrollArea>
            </Tabs>
        </div>
    );
}
