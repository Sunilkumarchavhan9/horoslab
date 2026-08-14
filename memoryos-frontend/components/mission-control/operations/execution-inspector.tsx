"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Activity, Play, Pause, RefreshCw, Ban, Download, FileText, Bot, 
    Network, ListTree, Code2, Terminal, AlertTriangle, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ExecutionInspector({ entityData }: { entityData: any }) {
    return (
        <Tabs defaultValue="overview" className="flex-1 flex flex-col w-full h-full">
            <div className="px-6 border-b border-border bg-muted/10 shrink-0">
                <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0 overflow-x-auto custom-scrollbar">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider shrink-0">
                        <Activity className="size-3.5 mr-2" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="timeline" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider shrink-0">
                        <ListTree className="size-3.5 mr-2" />
                        Timeline
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider shrink-0">
                        <Terminal className="size-3.5 mr-2" />
                        Logs
                    </TabsTrigger>
                    <TabsTrigger value="metrics" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider shrink-0">
                        <Network className="size-3.5 mr-2" />
                        Metrics & Metadata
                    </TabsTrigger>
                </TabsList>
            </div>

            <ScrollArea className="flex-1 w-full bg-background/50">
                <div className="p-6">
                    <TabsContent value="overview" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border col-span-2">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Mission Context</span>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-sm font-medium text-foreground">{entityData.mission}</span>
                                    <span className="text-xs font-mono bg-muted/50 px-2 py-0.5 rounded">{entityData.institution}</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Execution Status</span>
                                <span className={cn(
                                    "text-sm font-medium",
                                    entityData.status === "Running" ? "text-blue-500" :
                                    entityData.status === "Failed" ? "text-red-500" :
                                    entityData.status === "Completed" ? "text-emerald-500" :
                                    "text-muted-foreground"
                                )}>{entityData.status} ({entityData.progress}%)</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Worker Assignment</span>
                                <span className="text-sm font-mono font-medium text-foreground">{entityData.worker}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Execution Graph</span>
                            <div className="bg-card border border-border rounded-md p-4 flex flex-col gap-4">
                                <div className="flex items-center gap-4 text-xs font-mono font-medium">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className={cn("size-8 rounded-full flex items-center justify-center text-primary-foreground", entityData.plannerState === "Complete" ? "bg-emerald-500" : "bg-blue-500")}>
                                            P
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">Planner</span>
                                    </div>
                                    <div className="flex-1 h-px bg-border"></div>
                                    <div className="flex flex-col items-center gap-1">
                                        <div className={cn("size-8 rounded-full flex items-center justify-center text-primary-foreground", entityData.executorState === "Running" ? "bg-blue-500 animate-pulse" : entityData.executorState === "Error" ? "bg-red-500" : "bg-muted text-muted-foreground")}>
                                            E
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">Executor</span>
                                    </div>
                                    <div className="flex-1 h-px bg-border"></div>
                                    <div className="flex flex-col items-center gap-1">
                                        <div className={cn("size-8 rounded-full flex items-center justify-center text-primary-foreground", entityData.reviewerState === "Reviewing" ? "bg-purple-500 animate-pulse" : entityData.reviewerState === "Approved" ? "bg-emerald-500" : "bg-muted text-muted-foreground")}>
                                            R
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">Reviewer</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-[#0d1117] border border-border/50 rounded-md text-[11px] font-mono text-[#c9d1d9] leading-relaxed">
                                    <span className="text-blue-400 font-bold">Planner Decisions:</span> Analyzed mission parameters and generated an optimal 5-step execution plan utilizing `SearchWeb` and `ReadFile` tools. Wait for Executor to signal completion on step 3.
                                </div>
                            </div>
                        </div>

                    </TabsContent>

                    <TabsContent value="timeline" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Queue & Lifecycle History</span>
                            <div className="flex flex-col divide-y divide-border/50 border border-border bg-card rounded-md text-sm">
                                <div className="flex items-center justify-between p-3">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="size-4 text-emerald-500" />
                                        <span className="text-sm font-medium">Mission Scheduled</span>
                                    </div>
                                    <span className="text-xs font-mono text-muted-foreground">10:15:00</span>
                                </div>
                                <div className="flex items-center justify-between p-3">
                                    <div className="flex items-center gap-3">
                                        <ListTree className="size-4 text-blue-500" />
                                        <span className="text-sm font-medium">Entered Queue (Pos: 14)</span>
                                    </div>
                                    <span className="text-xs font-mono text-muted-foreground">10:15:05</span>
                                </div>
                                <div className="flex items-center justify-between p-3">
                                    <div className="flex items-center gap-3">
                                        <Bot className="size-4 text-emerald-500" />
                                        <span className="text-sm font-medium">Assigned to Worker WRK-9004</span>
                                    </div>
                                    <span className="text-xs font-mono text-muted-foreground">10:15:22</span>
                                </div>
                                {entityData.retries > 0 && (
                                    <div className="flex items-center justify-between p-3 bg-orange-500/5">
                                        <div className="flex items-center gap-3">
                                            <RefreshCw className="size-4 text-orange-500" />
                                            <span className="text-sm font-medium text-orange-500">Retry Triggered (Attempt {entityData.retries})</span>
                                        </div>
                                        <span className="text-xs font-mono text-muted-foreground">10:20:05</span>
                                    </div>
                                )}
                                {entityData.timeoutEvents > 0 && (
                                    <div className="flex items-center justify-between p-3 bg-red-500/5">
                                        <div className="flex items-center gap-3">
                                            <AlertTriangle className="size-4 text-red-500" />
                                            <span className="text-sm font-medium text-red-500">Timeout Event (Worker unresponsive)</span>
                                        </div>
                                        <span className="text-xs font-mono text-muted-foreground">10:25:00</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Checkpoints</span>
                            <div className="bg-card border border-border rounded-md p-4">
                                <div className="flex items-center gap-2 text-sm text-foreground/80">
                                    <Code2 className="size-4 text-muted-foreground" />
                                    <span>3 Checkpoints saved during execution.</span>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="logs" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Streaming Output & Tool Calls</span>
                                <span className="text-[10px] flex items-center gap-1.5 text-blue-500 font-bold uppercase"><span className="size-1.5 rounded-full bg-blue-500 animate-pulse" /> Live</span>
                            </div>
                            <div className="flex flex-col bg-[#0d1117] border border-border/50 rounded-md p-4 gap-2 font-mono text-[11px] overflow-x-auto text-[#c9d1d9] h-[300px]">
                                <div className="flex gap-3">
                                    <span className="text-muted-foreground shrink-0">10:15:23</span>
                                    <span className="text-blue-400 font-bold shrink-0">[THOUGHT]</span>
                                    <span>I need to analyze the current system state before proceeding. I will call `view_file` on `config.json`.</span>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-muted-foreground shrink-0">10:15:25</span>
                                    <span className="text-purple-400 font-bold shrink-0">[TOOL CALL]</span>
                                    <span>view_file {"{"} "AbsolutePath": "/etc/epoch/config.json" {"}"}</span>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-muted-foreground shrink-0">10:15:26</span>
                                    <span className="text-emerald-400 font-bold shrink-0">[TOOL RESP]</span>
                                    <span>File contents loaded (1.2KB)</span>
                                </div>
                                {entityData.status === "Failed" && (
                                    <div className="flex gap-3 mt-2 border-t border-red-500/20 pt-2">
                                        <span className="text-muted-foreground shrink-0">10:20:00</span>
                                        <span className="text-red-400 font-bold shrink-0">[ERROR]</span>
                                        <span className="text-red-400">Execution halted. Unhandled exception in worker payload.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="metrics" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1 p-4 rounded-md bg-card border border-border">
                                <span className="text-xs text-muted-foreground">Resource Usage (RAM)</span>
                                <span className="text-xl font-bold text-foreground">412 MB</span>
                            </div>
                            <div className="flex flex-col gap-1 p-4 rounded-md bg-card border border-border">
                                <span className="text-xs text-muted-foreground">Avg Step Latency</span>
                                <span className="text-xl font-bold text-foreground">1.2s</span>
                            </div>
                            <div className="flex flex-col gap-1 p-4 rounded-md bg-card border border-border">
                                <span className="text-xs text-muted-foreground">Compute Cost</span>
                                <span className="text-xl font-bold text-foreground">$0.042</span>
                            </div>
                            <div className="flex flex-col gap-1 p-4 rounded-md bg-card border border-border">
                                <span className="text-xs text-muted-foreground">Token Usage</span>
                                <span className="text-xl font-bold text-foreground">14.2K</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Execution Metadata</span>
                            <div className="flex flex-col bg-card border border-border rounded-md p-4 gap-3 text-sm">
                                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                    <span className="text-muted-foreground">Correlation ID</span>
                                    <span className="font-mono text-xs">corr_8829f9c1</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                    <span className="text-muted-foreground">Trace ID</span>
                                    <span className="font-mono text-xs text-blue-500 hover:underline cursor-pointer">trace_a41b77d2</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Cancellation Events</span>
                                    <span className="font-mono text-xs">{entityData.cancellations}</span>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </div>
            </ScrollArea>

            {/* Actions Bar */}
            <div className="flex items-center gap-2 p-4 border-t border-border bg-muted/10 shrink-0 overflow-x-auto custom-scrollbar">
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-md text-xs font-medium whitespace-nowrap shadow-sm">
                    {entityData.status === "Paused" ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
                    {entityData.status === "Paused" ? "Resume" : "Pause"}
                </button>
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <RefreshCw className="size-3.5" />
                    Retry
                </button>
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <Activity className="size-3.5" />
                    Replay
                </button>
                <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <Download className="size-3.5" />
                    Download Logs
                </button>
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <FileText className="size-3.5" />
                    Open Mission
                </button>
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <Bot className="size-3.5" />
                    Open Worker
                </button>
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <Download className="size-3.5" />
                    Export
                </button>
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-red-500/10 hover:text-red-500 transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm ml-auto">
                    <Ban className="size-3.5" />
                    Cancel
                </button>
            </div>
        </Tabs>
    );
}
